"use strict";

// Arena Rubra – F9Q3d1 Target Player Foundation.
// Centralizza i bersagli di livello giocatore per effetti su ENE, mano, deck e abilità.
// In 1v1 l'unico avversario valido viene risolto automaticamente; in FFA un umano
// sceglie esplicitamente, mentre l'IA usa una selezione deterministica/scored.

const F9Q3D1_PLAYER_TARGET_TACTIC_KINDS = Object.freeze(new Set([
  "enemy_ability_cost_tax",
  "mutual_draw_conditional_steal",
  "block_enemy_hand_cards_by_ps",
  "usury_energy_income_debuff"
]));

const F9Q3D1_PLAYER_TARGET_ABILITY_KINDS = Object.freeze(new Set([
  "compromisedLogistics",
  "copyRandomEnemyHandCard",
  "lockEnemyEnergy"
]));

const F9Q3D1_PLAYER_TARGET_STARTER_TACTIC_KINDS = Object.freeze(new Set([
  "contractTrap"
]));

let f9q3d1PlayerTargetCallback = null;

function isPlayerTargetToken(target) {
  return Boolean(target && target.playerTarget === true && Number.isFinite(Number(target.side)));
}

function playerTargetSide(target) {
  return isPlayerTargetToken(target) ? Number(target.side) : null;
}

function createPlayerTargetToken(side, meta={}) {
  const playerSide = Number(side);
  const faction = typeof state !== "undefined" && state && state.factions ? state.factions[playerSide] : null;
  const label = typeof playerName === "function" ? playerName(playerSide) : `Giocatore ${playerSide}`;
  return Object.freeze({
    uid:`PLAYER-${playerSide}`,
    id:`PLAYER-${playerSide}`,
    side:playerSide,
    playerTarget:true,
    type:"Giocatore",
    name:label,
    faction:faction || null,
    targetDomain:"player",
    ...meta
  });
}

function f9q3d1ActiveEnemySides(casterSide) {
  const caster = Number(casterSide);
  const enemies = typeof getEnemyPlayers === "function"
    ? getEnemyPlayers(caster)
    : (typeof mapRuntimePlayerIds === "function"
      ? mapRuntimePlayerIds(typeof state !== "undefined" ? state : null).filter(side => Number(side) !== caster)
      : [caster === 1 ? 2 : 1]);
  return [...new Set((enemies || []).map(Number))]
    .filter(side => side > 0 && side !== caster)
    .filter(side => typeof isPlayerEliminated !== "function" || !isPlayerEliminated(side));
}

function handTacticRequiresPlayerTarget(card) {
  const kind = String(card && (card.effectKind || card.kind) || "");
  return F9Q3D1_PLAYER_TARGET_TACTIC_KINDS.has(kind);
}

function abilityRequiresPlayerTarget(ability) {
  const kind = String(ability && ability.kind || "");
  const genericEnemyEconomicEffect = Boolean(
    ability && ability.affects === "enemy" && ["incomeSwing", "costDelta", "incomeDelta"].includes(kind)
  );
  return F9Q3D1_PLAYER_TARGET_ABILITY_KINDS.has(kind)
    || Boolean(ability && ability.target === "enemy_player")
    || genericEnemyEconomicEffect;
}

function starterTacticRequiresPlayerTarget(tactic) {
  const kind = String(tactic && tactic.kind || "");
  return F9Q3D1_PLAYER_TARGET_STARTER_TACTIC_KINDS.has(kind) || tactic && tactic.target === "enemy_player";
}

function f9q3d1UnblockedHandCount(side) {
  const hand = typeof state !== "undefined" && state && state.hand && Array.isArray(state.hand[side]) ? state.hand[side] : [];
  return hand.filter(card => !(typeof handCardBlocked === "function" && handCardBlocked(card))).length;
}

function f9q3d1StealableHandCount(side) {
  if (typeof stealableHandCards === "function") return stealableHandCards(side).length;
  const hand = typeof state !== "undefined" && state && state.hand && Array.isArray(state.hand[side]) ? state.hand[side] : [];
  return hand.filter(card => card && card.sourceType !== "mission" && card.cardType !== "mission" && card.deckRole !== "mission" && card.cardType !== "commander" && card.deckRole !== "commander").length;
}

function f9q3d1PaidAbilityCount(side) {
  if (typeof combatUnits !== "function") return 0;
  return combatUnits(side).filter(unit => unit && unit.ability && !unit.ability.passive && Number(unit.ability.cost || 0) > 0).length;
}

function eligiblePlayerTargetSides(casterSide, context={}) {
  const kind = String(context.kind || context.effectKind || (context.card && context.card.effectKind) || (context.ability && context.ability.kind) || (context.tactic && context.tactic.kind) || "");
  return f9q3d1ActiveEnemySides(casterSide).filter(side => {
    if (kind === "enemy_ability_cost_tax") return f9q3d1PaidAbilityCount(side) > 0;
    if (kind === "mutual_draw_conditional_steal") return Boolean(state && state.deck && Array.isArray(state.deck[side]) && state.deck[side].length > 0);
    if (kind === "block_enemy_hand_cards_by_ps") return f9q3d1UnblockedHandCount(side) > 0;
    if (kind === "compromisedLogistics") return Boolean(state && state.deck && Array.isArray(state.deck[side]) && state.deck[side].length > 0);
    if (kind === "copyRandomEnemyHandCard") return f9q3d1StealableHandCount(side) > 0;
    return true;
  });
}

function eligiblePlayerTargets(casterSide, context={}) {
  return eligiblePlayerTargetSides(casterSide, context).map(side => createPlayerTargetToken(side, {
    sourceKind:String(context.kind || context.effectKind || (context.card && context.card.effectKind) || (context.ability && context.ability.kind) || (context.tactic && context.tactic.kind) || "")
  }));
}

function f9q3d1PlayerThreatScore(casterSide, targetSide, context={}) {
  const kind = String(context.kind || context.effectKind || (context.card && context.card.effectKind) || (context.ability && context.ability.kind) || (context.tactic && context.tactic.kind) || "");
  const energy = state && state.energy ? Number(state.energy[targetSide] || 0) : 0;
  const hand = state && state.hand && Array.isArray(state.hand[targetSide]) ? state.hand[targetSide].length : 0;
  const deck = state && state.deck && Array.isArray(state.deck[targetSide]) ? state.deck[targetSide].length : 0;
  const pressure = state && state.pressure ? Number(state.pressure[targetSide] || 0) : 0;
  const ps = typeof countControlledPS === "function" ? countControlledPS(targetSide) : 0;
  let score = pressure * 5 + ps * 3 + energy * 0.6 + hand * 0.35 + deck * 0.02;
  if (kind === "enemy_ability_cost_tax") score += f9q3d1PaidAbilityCount(targetSide) * 4;
  if (kind === "mutual_draw_conditional_steal") score += hand * 0.7 + deck * 0.05;
  if (kind === "block_enemy_hand_cards_by_ps") score += f9q3d1UnblockedHandCount(targetSide) * 2;
  if (kind === "usury_energy_income_debuff" || kind === "lockEnemyEnergy" || kind === "contractTrap") score += energy * 1.5;
  if (kind === "copyRandomEnemyHandCard") score += f9q3d1StealableHandCount(targetSide) * 2;
  if (kind === "compromisedLogistics") score += deck * 0.1;
  if (kind === "mission_enemy_energy_fraction") score += energy * 3;
  if (kind === "mission_enemy_discard_fraction") score += f9q3d1UnblockedHandCount(targetSide) * 3 + hand;
  // Spareggio stabile: priorità al lato con ID minore.
  return score - targetSide * 0.0001;
}

function chooseAutomaticPlayerTarget(casterSide, targets, context={}) {
  const list = Array.isArray(targets) ? targets.filter(isPlayerTargetToken) : [];
  if (!list.length) return null;
  if (list.length === 1) return list[0];
  return [...list].sort((a,b) => f9q3d1PlayerThreatScore(casterSide, b.side, context) - f9q3d1PlayerThreatScore(casterSide, a.side, context))[0];
}

function f9q3d1EnsurePlayerTargetOverlay() {
  if (typeof document === "undefined") return null;
  let overlay = document.getElementById("playerTargetOverlay");
  if (overlay) return overlay;
  overlay = document.createElement("div");
  overlay.id = "playerTargetOverlay";
  overlay.className = "player-target-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <section class="player-target-dialog" role="dialog" aria-modal="true" aria-labelledby="playerTargetTitle">
      <div class="player-target-kicker">FFA · bersaglio giocatore</div>
      <h2 id="playerTargetTitle">Scegli avversario</h2>
      <p id="playerTargetDescription" class="player-target-description"></p>
      <div id="playerTargetChoices" class="player-target-choices"></div>
      <button id="playerTargetCancel" type="button" class="player-target-cancel">Annulla</button>
    </section>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", event => {
    if (event.target === overlay && overlay.dataset.allowCancel !== "0") closePlayerTargetSelector();
  });
  return overlay;
}

function f9q3d1TargetSummary(side) {
  const faction = state && state.factions ? state.factions[side] : "";
  const energy = state && state.energy ? Number(state.energy[side] || 0) : 0;
  const hand = state && state.hand && Array.isArray(state.hand[side]) ? state.hand[side].length : 0;
  const deck = state && state.deck && Array.isArray(state.deck[side]) ? state.deck[side].length : 0;
  const pressure = state && state.pressure ? Number(state.pressure[side] || 0) : 0;
  const ps = typeof countControlledPS === "function" ? countControlledPS(side) : 0;
  return { faction, energy, hand, deck, pressure, ps };
}

function closePlayerTargetSelector(options={}) {
  const overlay = typeof document !== "undefined" ? document.getElementById("playerTargetOverlay") : null;
  if (overlay && overlay.dataset.allowCancel === "0" && options.force !== true) return false;
  if (overlay) { overlay.hidden = true; overlay.dataset.allowCancel = "1"; }
  f9q3d1PlayerTargetCallback = null;
  if (typeof pendingPlayerTargetContext !== "undefined") pendingPlayerTargetContext = null;
  if (!options.silent && typeof renderAll === "function") renderAll();
}

function requestPlayerTargetSelection({ casterSide, targets, sourceName="effetto", title="Scegli avversario", description="", context={}, onSelect, onCancel, allowCancel=true }={}) {
  const caster = Number(casterSide);
  const valid = (Array.isArray(targets) ? targets : eligiblePlayerTargets(caster, context)).filter(isPlayerTargetToken);
  if (!valid.length || typeof onSelect !== "function") return false;
  const isBot = Boolean(state && state.modes && state.modes[caster] === "bot");
  if (isBot || valid.length === 1 || typeof document === "undefined") {
    const chosen = chooseAutomaticPlayerTarget(caster, valid, context);
    if (!chosen) return false;
    onSelect(chosen);
    return true;
  }

  const overlay = f9q3d1EnsurePlayerTargetOverlay();
  if (!overlay) return false;
  const titleEl = overlay.querySelector("#playerTargetTitle");
  const descriptionEl = overlay.querySelector("#playerTargetDescription");
  const choices = overlay.querySelector("#playerTargetChoices");
  if (titleEl) titleEl.textContent = title;
  if (descriptionEl) descriptionEl.textContent = description || `${sourceName}: scegli quale avversario attivo subisce l'effetto.`;
  if (choices) {
    choices.innerHTML = "";
    for (const target of valid) {
      const info = f9q3d1TargetSummary(target.side);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "player-target-choice";
      button.dataset.playerSide = String(target.side);
      button.innerHTML = `<strong>${target.name}</strong><span>${info.faction || "Fazione"}</span><small>ENE ${info.energy} · PS ${info.ps} · Pressione ${info.pressure} · Mano ${info.hand} · Deck ${info.deck}</small>`;
      button.addEventListener("click", () => {
        const callback = f9q3d1PlayerTargetCallback;
        closePlayerTargetSelector({ silent:true, force:true });
        if (callback) callback(target);
      });
      choices.appendChild(button);
    }
  }
  f9q3d1PlayerTargetCallback = onSelect;
  if (typeof pendingPlayerTargetContext !== "undefined") {
    pendingPlayerTargetContext = { casterSide:caster, sourceName, title, targetSides:valid.map(t => t.side), context:{ kind:String(context.kind || context.effectKind || "") } };
  }
  overlay.dataset.allowCancel = allowCancel === false ? "0" : "1";
  const cancel = overlay.querySelector("#playerTargetCancel");
  if (cancel) {
    cancel.hidden = allowCancel === false;
    cancel.onclick = () => {
      closePlayerTargetSelector({ silent:true, force:true });
      if (typeof onCancel === "function") onCancel();
      else if (typeof renderAll === "function") renderAll();
    };
  }
  overlay.hidden = false;
  return true;
}
