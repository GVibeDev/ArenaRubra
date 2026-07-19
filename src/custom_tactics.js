"use strict";

// Arena Rubra – F9N1 Custom Tactics Runtime Foundation.
// Binding prudente e data-driven per tattiche CUSTOM semplici create nel Card Editor.
// Nessun eval, nessun codice arbitrario dal JSON: solo effectKind/parametri whitelistati.

const CUSTOM_TACTIC_RUNTIME_VERSION = "F9N1";

const CUSTOM_TACTIC_FILTERS = Object.freeze(new Set([
  "any",
  "infantry",
  "vehicle",
  "structure",
  "commander_or_pivot"
]));

const CUSTOM_TACTIC_STATUS_RULES = Object.freeze({
  inhibit_action: { targetSide:"enemy", valueMin:0, valueMax:0, turnsMin:1, turnsMax:1 },
  inhibit_attack: { targetSide:"enemy", valueMin:0, valueMax:0, turnsMin:1, turnsMax:2 },
  inhibit_move: { targetSide:"enemy", valueMin:0, valueMax:0, turnsMin:1, turnsMax:2 },
  bleed: { targetSide:"enemy", valueMin:1, valueMax:3, turnsMin:1, turnsMax:3 },
  thorns: { targetSide:"ally", valueMin:1, valueMax:3, turnsMin:1, turnsMax:2 }
});

const CUSTOM_TACTIC_EFFECT_DEFINITIONS = Object.freeze({
  damage: {
    label:"Danno unità",
    targetDomain:"board_unit",
    targetSide:"enemy",
    rangeMode:"ally_network",
    valueMin:1,
    valueMax:5,
    rangeMin:1,
    rangeMax:4,
    durationMode:"immediate"
  },
  heal: {
    label:"Cura HP",
    targetDomain:"board_unit",
    targetSide:"ally",
    rangeMode:"ally_network",
    valueMin:1,
    valueMax:5,
    rangeMin:1,
    rangeMax:4,
    durationMode:"immediate"
  },
  restore_def: {
    label:"Ripristina DEF",
    targetDomain:"board_unit",
    targetSide:"ally",
    rangeMode:"ally_network",
    valueMin:1,
    valueMax:5,
    rangeMin:1,
    rangeMax:4,
    durationMode:"immediate"
  },
  shred_def: {
    label:"Rimuovi DEF",
    targetDomain:"board_unit",
    targetSide:"enemy",
    rangeMode:"ally_network",
    valueMin:1,
    valueMax:5,
    rangeMin:1,
    rangeMax:4,
    durationMode:"immediate"
  },
  buff_att: {
    label:"Buff ATT",
    targetDomain:"board_unit",
    targetSide:"ally",
    rangeMode:"ally_network",
    valueMin:1,
    valueMax:3,
    rangeMin:1,
    rangeMax:4,
    durationMode:"until_end_of_current_player_turn",
    durationValue:1
  },
  buff_def: {
    label:"Buff DEF",
    targetDomain:"board_unit",
    targetSide:"ally",
    rangeMode:"ally_network",
    valueMin:1,
    valueMax:3,
    rangeMin:1,
    rangeMax:4,
    durationMode:"until_end_of_current_player_turn",
    durationValue:1
  },
  apply_status: {
    label:"Applica stato",
    targetDomain:"board_unit",
    targetSide:"enemy",
    rangeMode:"ally_network",
    valueMin:0,
    valueMax:3,
    rangeMin:1,
    rangeMax:4,
    durationMode:"target_owner_turns",
    durationValue:1
  },
  draw_card: {
    label:"Pesca carta",
    targetDomain:"none",
    targetSide:"self",
    rangeMode:"none",
    valueMin:1,
    valueMax:3,
    rangeMin:0,
    rangeMax:0,
    durationMode:"immediate"
  },
  gain_energy: {
    label:"Ottieni ENE",
    targetDomain:"none",
    targetSide:"self",
    rangeMode:"none",
    valueMin:1,
    valueMax:5,
    rangeMin:0,
    rangeMax:0,
    durationMode:"immediate"
  },
  cell_blast: {
    label:"Danno area su cella",
    targetDomain:"board_cell",
    targetSide:"both",
    rangeMode:"ally_network",
    valueMin:1,
    valueMax:3,
    rangeMin:1,
    rangeMax:4,
    durationMode:"immediate"
  }
});

function customTacticIsCard(card) {
  return Boolean(card && card.custom === true && card.sourceType === "tactic");
}

function customTacticClampInt(value, fallback, min, max) {
  const n = Number(value);
  const rounded = Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.max(min, Math.min(max, rounded));
}

function customTacticRawActive(card) {
  return card && card.customAbilitySchema && card.customAbilitySchema.active
    ? card.customAbilitySchema.active
    : null;
}

function customTacticEffectDefinition(kind) {
  return CUSTOM_TACTIC_EFFECT_DEFINITIONS[String(kind || "")] || null;
}

function customTacticNormalizeFilter(filter) {
  const value = String(filter || "any").toLowerCase();
  return CUSTOM_TACTIC_FILTERS.has(value) ? value : "any";
}

function customTacticEditorMetadata(active) {
  const effect = customTacticEffectDefinition(active && active.kind);
  if (!effect) {
    return {
      runtimeVersion:CUSTOM_TACTIC_RUNTIME_VERSION,
      playable:false,
      targetDomain:"none",
      targetSide:"self",
      rangeMode:"none",
      durationMode:"data_only",
      durationValue:0
    };
  }
  const statusRule = active && active.kind === "apply_status"
    ? CUSTOM_TACTIC_STATUS_RULES[String(active.statusKind || "")]
    : null;
  return {
    runtimeVersion:CUSTOM_TACTIC_RUNTIME_VERSION,
    playable: active.kind !== "apply_status" || Boolean(statusRule),
    targetDomain:effect.targetDomain,
    targetSide:statusRule ? statusRule.targetSide : effect.targetSide,
    rangeMode:effect.rangeMode,
    durationMode:effect.durationMode,
    durationValue:active && active.kind === "apply_status"
      ? customTacticClampInt(active.statusTurns || active.turns, 1, statusRule ? statusRule.turnsMin : 1, statusRule ? statusRule.turnsMax : 1)
      : (effect.durationValue || 0)
  };
}

function normalizeCustomTacticCard(card) {
  if (!customTacticIsCard(card)) return card;

  const active = customTacticRawActive(card);
  const kind = String(active && active.kind || card.effectKind || "custom_text_only");
  const effect = customTacticEffectDefinition(kind);
  const errors = [];
  const warnings = [];

  if (!active) warnings.push("schema attivo assente");
  if (!effect) errors.push(`effectKind non supportato: ${kind}`);

  const statusKind = kind === "apply_status"
    ? String(active && active.statusKind || card.statusKind || "")
    : "";
  const statusRule = kind === "apply_status" ? CUSTOM_TACTIC_STATUS_RULES[statusKind] : null;
  if (kind === "apply_status" && !statusRule) errors.push(`status non whitelistato: ${statusKind || "assente"}`);
  if (kind === "apply_status" && statusRule && typeof STATUS_DEFINITIONS !== "undefined" && !STATUS_DEFINITIONS[statusKind]) {
    errors.push(`status non presente nel runtime: ${statusKind}`);
  }

  const safeEffect = effect || {
    targetDomain:"none",
    targetSide:"self",
    rangeMode:"none",
    valueMin:0,
    valueMax:0,
    rangeMin:0,
    rangeMax:0,
    durationMode:"data_only",
    durationValue:0
  };

  const rawValue = active && active.value !== undefined ? active.value : (card.value !== undefined ? card.value : 0);
  const valueMin = statusRule ? statusRule.valueMin : safeEffect.valueMin;
  const valueMax = statusRule ? statusRule.valueMax : safeEffect.valueMax;
  const value = customTacticClampInt(rawValue, valueMin, valueMin, valueMax);
  if (Number(rawValue) !== value) warnings.push(`valore normalizzato a ${value}`);

  const rawRange = active && active.range !== undefined ? active.range : card.range;
  const range = customTacticClampInt(rawRange, safeEffect.rangeMin, safeEffect.rangeMin, safeEffect.rangeMax);
  if (Number(rawRange) !== range && safeEffect.rangeMode !== "none") warnings.push(`raggio normalizzato a ${range}`);

  const filter = customTacticNormalizeFilter(active && active.filter || card.customTargetFilter || "any");
  if (String(active && active.filter || "any").toLowerCase() !== filter) warnings.push(`filtro normalizzato a ${filter}`);

  const statusTurns = statusRule
    ? customTacticClampInt(active && (active.statusTurns || active.turns), 1, statusRule.turnsMin, statusRule.turnsMax)
    : 0;
  const targetSide = statusRule ? statusRule.targetSide : safeEffect.targetSide;
  const durationValue = statusRule ? statusTurns : (safeEffect.durationValue || 0);
  const playable = errors.length === 0;

  const schema = Object.freeze({
    version:CUSTOM_TACTIC_RUNTIME_VERSION,
    effectKind:kind,
    targetDomain:safeEffect.targetDomain,
    targetSide,
    rangeMode:safeEffect.rangeMode,
    range,
    filter,
    value,
    statusKind:statusKind || null,
    statusTurns:statusTurns || 0,
    durationMode:safeEffect.durationMode,
    durationValue,
    playable
  });

  return {
    ...card,
    tacticId: card.tacticId || card.sourceId || String(card.id || "").replace(/^CUSTOM:TACTIC:/, ""),
    effectKind:kind,
    targetDomain:schema.targetDomain,
    targetSide:schema.targetSide,
    rangeMode:schema.rangeMode,
    range:schema.range,
    customTargetFilter:schema.filter,
    durationMode:schema.durationMode,
    durationValue:schema.durationValue,
    implementationStatus:playable ? "custom_playable_f9n1" : "custom_data_only",
    customTacticRuntime:true,
    customTacticRuntimeVersion:CUSTOM_TACTIC_RUNTIME_VERSION,
    customTacticSchema:schema,
    customTacticValidation:{ ok:playable, playable, errors, warnings, schema }
  };
}

function validateCustomTacticCard(card) {
  const normalized = normalizeCustomTacticCard(card);
  if (!customTacticIsCard(normalized)) {
    return { ok:false, playable:false, errors:["non è una tattica custom"], warnings:[], schema:null };
  }
  return normalized.customTacticValidation || { ok:false, playable:false, errors:["validazione assente"], warnings:[], schema:null };
}

function customTacticRuntimePlayable(card) {
  const normalized = normalizeCustomTacticCard(card);
  return Boolean(customTacticIsCard(normalized) && normalized.customTacticValidation && normalized.customTacticValidation.playable);
}

function customTacticIsImmediateNoTarget(card) {
  const normalized = normalizeCustomTacticCard(card);
  return Boolean(customTacticRuntimePlayable(normalized) && normalized.customTacticSchema.targetDomain === "none");
}

function customTacticIsCellTarget(card) {
  const normalized = normalizeCustomTacticCard(card);
  return Boolean(customTacticRuntimePlayable(normalized) && normalized.customTacticSchema.targetDomain === "board_cell");
}

function customTacticSourceCells(player, card) {
  const normalized = normalizeCustomTacticCard(card);
  if (!state || !normalized || normalized.customTacticSchema.rangeMode !== "ally_network") return [];
  return combatUnits(player)
    .filter(unit => unit && unit.alive && unit.type !== "QG" && Array.isArray(unit.pos))
    .map(unit => unit.pos);
}

function customTacticInRange(player, card, target) {
  const normalized = normalizeCustomTacticCard(card);
  if (!target || !Array.isArray(target.pos) || !customTacticRuntimePlayable(normalized)) return false;
  if (normalized.customTacticSchema.rangeMode === "none") return true;
  return customTacticSourceCells(player, normalized)
    .some(pos => hexDistance(pos, target.pos) <= normalized.customTacticSchema.range);
}

function customTacticUnitMatchesFilter(unit, filter) {
  if (!unit) return false;
  const safe = customTacticNormalizeFilter(filter);
  if (safe === "any") return true;
  if (safe === "infantry") return unit.type === "Fanteria";
  if (safe === "vehicle") return unit.type === "Veicolo";
  if (safe === "structure") return unit.type === "Struttura";
  if (safe === "commander_or_pivot") return unit.type === "Comandante" || unit.weight === "Pivot";
  return false;
}

function customTacticTargetUnitValid(player, card, target) {
  const normalized = normalizeCustomTacticCard(card);
  if (!customTacticRuntimePlayable(normalized) || !target || !isFieldUnit(target) || target.type === "QG") return false;
  if (typeof isUntargetableTo === "function" && isUntargetableTo(target, player)) return false;

  const schema = normalized.customTacticSchema;
  if (schema.targetDomain !== "board_unit") return false;
  if (schema.targetSide === "enemy" && target.side === player) return false;
  if (schema.targetSide === "ally" && target.side !== player) return false;
  if (!customTacticUnitMatchesFilter(target, schema.filter)) return false;

  if (schema.effectKind === "heal" && !(Number.isFinite(target.currentHp) && Number.isFinite(target.maxHp) && target.currentHp < target.maxHp)) return false;
  if (schema.effectKind === "restore_def" && !(Number.isFinite(target.currentDef) && Number.isFinite(target.maxDef) && target.currentDef < target.maxDef)) return false;
  if (schema.effectKind === "shred_def" && !(Number.isFinite(target.currentDef) && target.currentDef > 0)) return false;
  if (schema.effectKind === "apply_status" && schema.statusKind === "bleed") {
    if (typeof canBleed === "function" && !canBleed(target)) return false;
    if (typeof canBleed !== "function" && target.type === "Struttura") return false;
  }
  return customTacticInRange(player, normalized, target);
}

function customTacticCandidateUnits(player, card) {
  const normalized = normalizeCustomTacticCard(card);
  if (!customTacticRuntimePlayable(normalized) || normalized.customTacticSchema.targetDomain !== "board_unit") return [];
  const side = normalized.customTacticSchema.targetSide;
  const candidates = side === "ally" ? combatUnits(player) : (side === "enemy" ? combatUnits(enemyOf(player)) : combatUnits(null));
  return candidates.filter(target => customTacticTargetUnitValid(player, normalized, target));
}

function customTacticCellTarget(coord) {
  return {
    uid:`CUSTOM_CELL:${coordKey(coord)}`,
    pos:[...coord],
    cell:getCellAt(coord),
    isCellTarget:true,
    type:"Cella",
    side:null,
    alive:true,
    name:`cella [${coord.join(",")}]`
  };
}

function customTacticCellAreaCoords(coord) {
  return uniqueCoords([coord, ...neighbors(coord)]).filter(candidate => getCellAt(candidate));
}

function customTacticCellAffectedUnits(coord) {
  return customTacticCellAreaCoords(coord)
    .map(candidate => getUnitAt(candidate))
    .filter(unit => unit && unit.alive && unit.type !== "QG");
}

function customTacticCandidateCellTargets(player, card) {
  const normalized = normalizeCustomTacticCard(card);
  if (!state || !customTacticRuntimePlayable(normalized) || normalized.customTacticSchema.targetDomain !== "board_cell") return [];
  return (state.cells || [])
    .filter(cell => cell && Array.isArray(cell.coord))
    .map(cell => customTacticCellTarget(cell.coord))
    .filter(target => customTacticInRange(player, normalized, target))
    .filter(target => customTacticCellAffectedUnits(target.pos).length > 0);
}

function customTacticTargets(player, card) {
  const normalized = normalizeCustomTacticCard(card);
  if (!customTacticRuntimePlayable(normalized)) return [];
  if (normalized.customTacticSchema.targetDomain === "board_unit") return customTacticCandidateUnits(player, normalized);
  if (normalized.customTacticSchema.targetDomain === "board_cell") return customTacticCandidateCellTargets(player, normalized);
  return [];
}

function customTacticCanUse(player, card) {
  const normalized = normalizeCustomTacticCard(card);
  const validation = validateCustomTacticCard(normalized);
  if (!validation.playable) return { ok:false, reason:`Tattica custom data-only: ${validation.errors.join("; ")}` };
  const schema = normalized.customTacticSchema;
  if (schema.effectKind === "draw_card") {
    const deckCount = state && state.deck && state.deck[player] ? state.deck[player].length : 0;
    if (deckCount <= 0) return { ok:false, reason:"Deck vuoto" };
  }
  if (schema.targetDomain !== "none" && customTacticTargets(player, normalized).length <= 0) {
    return { ok:false, reason:"Nessun bersaglio custom valido entro raggio" };
  }
  return { ok:true, reason:schema.targetDomain === "none" ? "Pronta · effetto immediato" : `Pronta · bersagli validi ${customTacticTargets(player, normalized).length}` };
}

function customTacticEnsureBuffs(target) {
  if (!Array.isArray(target.buffs)) target.buffs = [];
  return target.buffs;
}

function resolveCustomTacticEffect(player, rawCard, target) {
  const card = normalizeCustomTacticCard(rawCard);
  if (!customTacticRuntimePlayable(card)) return null;
  const schema = card.customTacticSchema;
  const source = card.name || "Tattica custom";

  if (schema.effectKind === "damage") {
    applyDamage(target, schema.value, source, { tactic:true, amplifiable:true, sourceCardUid:card.cardUid });
    return { damage:schema.value, extra:"danno custom" };
  }

  if (schema.effectKind === "heal") {
    const before = target.currentHp;
    target.currentHp = Math.min(target.maxHp, target.currentHp + schema.value);
    const healed = target.currentHp - before;
    log(`${target.name} recupera ${healed} HP da ${source}.`);
    return { damage:0, extra:`+${healed} HP` };
  }

  if (schema.effectKind === "restore_def") {
    const before = target.currentDef;
    target.currentDef = Math.min(target.maxDef, target.currentDef + schema.value);
    const restored = target.currentDef - before;
    log(`${target.name} recupera ${restored} DEF da ${source}.`);
    return { damage:0, extra:`+${restored} DEF` };
  }

  if (schema.effectKind === "shred_def") {
    const loss = Math.min(target.currentDef, schema.value);
    target.currentDef -= loss;
    if (typeof combatFeedbackEmitDefenseLoss === "function") combatFeedbackEmitDefenseLoss(target, loss, source, { sourceType:"custom_tactic", sourceId:card.cardUid });
    log(`${target.name} perde ${loss} DEF da ${source}.`);
    return { damage:0, extra:`-${loss} DEF` };
  }

  if (schema.effectKind === "buff_att") {
    target.currentAtt += schema.value;
    customTacticEnsureBuffs(target).push({ stat:"att", value:schema.value, turns:1, source, customTactic:true, durationMode:schema.durationMode });
    log(`${target.name} riceve +${schema.value} ATT da ${source} fino alla fine del turno del giocatore corrente.`);
    return { damage:0, extra:`+${schema.value} ATT` };
  }

  if (schema.effectKind === "buff_def") {
    target.currentDef += schema.value;
    customTacticEnsureBuffs(target).push({ stat:"def", value:schema.value, turns:1, source, customTactic:true, durationMode:schema.durationMode });
    log(`${target.name} riceve +${schema.value} DEF da ${source} fino alla fine del turno del giocatore corrente.`);
    return { damage:0, extra:`+${schema.value} DEF` };
  }

  if (schema.effectKind === "apply_status") {
    applyStatus(target, {
      kind:schema.statusKind,
      value:schema.value,
      turns:schema.statusTurns,
      source,
      owner:player,
      durationMode:schema.durationMode,
      customTactic:true
    });
    return { damage:0, extra:`status ${schema.statusKind}` };
  }

  if (schema.effectKind === "draw_card") {
    const drawn = drawCards(player, schema.value, { source });
    log(`${playerName(player)} pesca ${drawn.length} carta/e da ${source}.`);
    return { damage:0, extra:`pesca ${drawn.length}` };
  }

  if (schema.effectKind === "gain_energy") {
    state.energy[player] += schema.value;
    log(`${playerName(player)} guadagna +${schema.value} ENE da ${source}.`, EventTypes.ECONOMY_CHANGED, {
      player,
      faction:state.factions && state.factions[player],
      gain:schema.value,
      source:"F9N1-custom-tactic"
    });
    return { damage:0, extra:`+${schema.value} ENE` };
  }

  if (schema.effectKind === "cell_blast") {
    const affected = customTacticCellAffectedUnits(target.pos);
    for (const unit of affected) {
      if (unit.alive) applyDamage(unit, schema.value, source, { tactic:true, amplifiable:true, sourceCardUid:card.cardUid });
    }
    log(`${source} colpisce ${affected.length} unità nella cella bersaglio e nelle celle adiacenti.`);
    return { damage:schema.value, extra:`area custom · ${affected.length} bersagli`, affected:affected.length };
  }

  return null;
}
