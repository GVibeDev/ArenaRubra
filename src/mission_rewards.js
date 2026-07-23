"use strict";

// Arena Rubra – F9N10 Missioni, ricompense e cicli multipli.
// Le 10 Missioni ordinarie restano operative.
// F9N9 aggiunge le 5 Missioni disperate, moltiplicatore x1-x3,
// selezioni distinte, quote sprecate e ricompense temporali.

let missionResolutionBusy = false;

function ensureMissionRewardState() {
  if (!state) return null;
  if (!state.missionRewards) {
    state.missionRewards = {
      1:{ cardCostSequence:null, repeatAttacksRemaining:0, repeatAttacksGranted:0, repeatAttacksUsed:0, repeatAttacksRound:null },
      2:{ cardCostSequence:null, repeatAttacksRemaining:0, repeatAttacksGranted:0, repeatAttacksUsed:0, repeatAttacksRound:null }
    };
  }
  if (!state.missionRewards[1]) state.missionRewards[1] = { cardCostSequence:null };
  if (!state.missionRewards[2]) state.missionRewards[2] = { cardCostSequence:null };
  for (const side of [1,2]) {
    const rewardState = state.missionRewards[side];
    if (!Number.isFinite(rewardState.repeatAttacksRemaining)) rewardState.repeatAttacksRemaining = 0;
    if (!Number.isFinite(rewardState.repeatAttacksGranted)) rewardState.repeatAttacksGranted = 0;
    if (!Number.isFinite(rewardState.repeatAttacksUsed)) rewardState.repeatAttacksUsed = 0;
    if (!Object.prototype.hasOwnProperty.call(rewardState, "repeatAttacksRound")) rewardState.repeatAttacksRound = null;
  }
  if (!Object.prototype.hasOwnProperty.call(state, "missionPendingReward")) state.missionPendingReward = null;
  return state.missionRewards;
}

function missionPendingReward() {
  ensureMissionRewardState();
  return state ? state.missionPendingReward || null : null;
}

function missionInteractionBlocked() {
  return Boolean(missionPendingReward());
}

function missionCardInHand(side) {
  if (!state || !state.hand || !state.hand[side]) return null;
  return state.hand[side].find(card => card && (card.sourceType === "mission" || card.cardType === "mission" || card.deckRole === "mission")) || null;
}

function missionOrdinaryCardInHand(side) { return missionCardInHand(side); }

function missionCardMatchesRuntime(card, runtime) {
  if (!card || !runtime) return false;
  const id = card.missionId || card.sourceId || String(card.id || "").replace(/^MISSION:/, "");
  return id === runtime.missionId;
}

function missionCanPlayOrdinary(side, card=null, options={}) {
  if (!state) return { ok:false, reason:"Partita non inizializzata" };
  if (state.winner) return { ok:false, reason:"Partita conclusa" };
  if (missionInteractionBlocked()) return { ok:false, reason:"Completa prima la scelta della ricompensa Missione" };
  const runtime = typeof missionRuntime === "function" ? missionRuntime(side) : null;
  if (!runtime || !runtime.active) return { ok:false, reason:"Missione assente" };
  if (runtime.missionClass !== "ordinary") return { ok:false, reason:"La Missione selezionata è disperata" };
  if (runtime.played) return { ok:false, reason:"Missione già giocata in questo ciclo" };
  if (typeof missionIsRecoveryLocked === "function" && missionIsRecoveryLocked(side)) return { ok:false, reason:"Missione recuperata: utilizzabile dal prossimo turno personale" };
  if (state.currentPlayer !== side) return { ok:false, reason:"Non è il turno del proprietario" };
  const isBotOwner = Boolean(state.modes && state.modes[side] === "bot");
  if (isBotOwner && options.allowBot !== true) return { ok:false, reason:"Missione gestita dall’IA" };
  if (!isBotOwner && botRunning) return { ok:false, reason:"Bot in esecuzione" };
  const missionCard = card || missionCardInHand(side);
  if (!missionCard || !missionCardMatchesRuntime(missionCard, runtime)) return { ok:false, reason:"La carta Missione non è nella mano" };
  if (typeof playerHandLocked === "function" && playerHandLocked(side)) return { ok:false, reason:"Mano bloccata" };
  if (typeof handCardBlocked === "function" && handCardBlocked(missionCard)) return { ok:false, reason:typeof handCardBlockReason === "function" ? handCardBlockReason(missionCard) : "Missione bloccata" };
  if (options.evaluate !== false && typeof missionEvaluateSide === "function") missionEvaluateSide(side, "f9n8_final_validation", { checkpoint:"mission_play", side, round:state.turn });
  if (!runtime.ready) return { ok:false, reason:"Obiettivi non tutti completati" };
  return { ok:true, reason:"Missione ordinaria pronta", card:missionCard, runtime };
}

function missionRewardStateForSide(side) {
  const rewards = ensureMissionRewardState();
  return rewards ? rewards[side] : null;
}

function missionCardCostSequence(side) {
  const rewardState = missionRewardStateForSide(side);
  const seq = rewardState && rewardState.cardCostSequence;
  return seq && (seq.freeRemaining > 0 || seq.discountRemaining > 0) ? seq : null;
}

function missionEffectiveCardCost(side, card, baseCost) {
  const base = Math.max(0, Number(baseCost) || 0);
  if (!card || card.sourceType === "mission" || card.cardType === "mission" || card.deckRole === "mission") return base;
  const seq = missionCardCostSequence(side);
  if (!seq) return base;
  if (seq.freeRemaining > 0) return 0;
  if (seq.discountRemaining > 0) return Math.max(Number.isFinite(seq.minCost) ? seq.minCost : 0, base - Math.max(0, seq.discount || 0));
  return base;
}

function missionSetCardCostSequence(side, reward, source) {
  const rewardState = missionRewardStateForSide(side);
  if (!rewardState) return null;
  rewardState.cardCostSequence = {
    source,
    freeRemaining:Math.max(0, Number(reward.freeCards) || 0),
    discountRemaining:Math.max(0, Number(reward.discountedCards) || 0),
    discount:Math.max(0, Number(reward.discount) || 0),
    minCost:Number.isFinite(reward.minCost) ? reward.minCost : 0,
    createdRound:state.turn,
    consumed:0
  };
  return rewardState.cardCostSequence;
}

function missionConsumeCardCostSequence(side, card) {
  if (!card || card.sourceType === "mission" || card.cardType === "mission" || card.deckRole === "mission") return false;
  const seq = missionCardCostSequence(side);
  if (!seq) return false;
  let label = "";
  if (seq.freeRemaining > 0) {
    seq.freeRemaining -= 1;
    label = "costo 0";
  } else if (seq.discountRemaining > 0) {
    seq.discountRemaining -= 1;
    label = `costo -${seq.discount} ENE`;
  }
  seq.consumed += 1;
  if (typeof log === "function") log(`${seq.source}: ${card.name || card.id} consuma il bonus ${label}.`);
  if (seq.freeRemaining <= 0 && seq.discountRemaining <= 0) {
    const rewardState = missionRewardStateForSide(side);
    if (rewardState) rewardState.cardCostSequence = null;
  }
  return true;
}

function missionEmitEconomyChange(side, delta, source, extra={}) {
  if (!state || !state.energy || !Number.isFinite(delta) || delta === 0) return;
  if (typeof emitGameEvent === "function") emitGameEvent({
    type:EventTypes.ECONOMY_CHANGED,
    data:{ player:side, faction:state.factions && state.factions[side], delta, gain:delta > 0 ? delta : 0, loss:delta < 0 ? -delta : 0, source, ...extra }
  });
}

function missionRewardGainEnergy(side, amount, source) {
  const gain = Math.max(0, Number(amount) || 0);
  if (!gain) return { gain:0 };
  state.energy[side] += gain;
  missionEmitEconomyChange(side, gain, source, { missionReward:true });
  if (typeof log === "function") log(`${playerName(side)} guadagna +${gain} ENE dalla Missione “${source}”.`);
  return { gain };
}

function missionRewardDraw(side, amount, source, discount=0, minCost=0) {
  const requested = Math.max(0, Number(amount) || 0);
  const drawn = typeof drawCards === "function" ? drawCards(side, requested, { source:`Missione: ${source}` }) : [];
  let discounted = 0;
  if (discount > 0 && typeof c2c6aApplyCardDiscount === "function") {
    for (const card of drawn) discounted += c2c6aApplyCardDiscount(card, -discount, `Missione: ${source}`, minCost);
  }
  if (typeof log === "function") {
    const names = typeof cardPresentationVisibleCardsLabel === "function"
      ? cardPresentationVisibleCardsLabel(side, drawn)
      : (drawn.map(card => card.name || card.id).join(", ") || "nessuna");
    log(`Missione “${source}”: ${playerName(side)} pesca ${drawn.length}/${requested} carte (${names})${discount > 0 ? `; sconto applicato alle carte disponibili in mano` : ""}.`);
  }
  return { requested, drawn:drawn.length, discounted, cards:drawn.map(card => card.cardUid) };
}

function missionRewardEnemyLosesEnergyFraction(side, reward, source) {
  const enemy = typeof missionEnemy === "function" ? missionEnemy(side) : (side === 1 ? 2 : 1);
  const numerator = Math.max(0, Number(reward.numerator) || 0);
  const denominator = Math.max(1, Number(reward.denominator) || 1);
  const before = Math.max(0, Number(state.energy[enemy]) || 0);
  const loss = Math.floor(before * numerator / denominator);
  state.energy[enemy] = Math.max(0, before - loss);
  if (loss > 0) missionEmitEconomyChange(enemy, -loss, source, { missionOwner:side, missionReward:true });
  if (typeof log === "function") log(`Missione “${source}”: ${playerName(enemy)} perde ${loss} ENE (${before} → ${state.energy[enemy]}).`);
  return { targetSide:enemy, before, loss, after:state.energy[enemy] };
}

function missionRewardEligibleDiscardCards(side) {
  if (typeof discardableHandCards === "function") return discardableHandCards(side);
  return state && state.hand && state.hand[side] ? state.hand[side].filter(card => !(typeof isProtectedHandCard === "function" && isProtectedHandCard(card))) : [];
}

function missionBotDiscardChoice(cards, count) {
  return [...cards]
    .sort((a,b) => (Number(a.cost) || 0) - (Number(b.cost) || 0) || String(a.name || a.id).localeCompare(String(b.name || b.id)))
    .slice(0, count)
    .map(card => card.cardUid);
}

function missionDiscardSelectedCards(targetSide, selectedUids, source, missionOwnerSide) {
  const discarded = [];
  for (const uid of selectedUids) {
    const card = typeof discardCard === "function" ? discardCard(targetSide, uid) : null;
    if (!card) continue;
    discarded.push(card);
    if (typeof emitGameEvent === "function" && EventTypes.CARD_DISCARDED) emitGameEvent({
      type:EventTypes.CARD_DISCARDED,
      data:{ player:targetSide, faction:state.factions && state.factions[targetSide], cardUid:card.cardUid, cardId:card.id, cardName:card.name, source:`Missione: ${source}`, missionOwnerSide }
    });
  }
  if (typeof log === "function") {
    const canRevealDiscarded = typeof cardPresentationCanViewHand !== "function" || cardPresentationCanViewHand(targetSide);
    const discardedLabel = canRevealDiscarded ? (discarded.map(c => c.name || c.id).join(", ") || "nessuna") : (discarded.length ? `${discarded.length} carta/e coperte` : "nessuna");
    log(`${playerName(targetSide)} sceglie e scarta ${discarded.length} carte per la Missione “${source}”: ${discardedLabel}.`);
  }
  return discarded;
}

function missionCreateDiscardSelection(side, reward, source) {
  const targetSide = typeof missionEnemy === "function" ? missionEnemy(side) : (side === 1 ? 2 : 1);
  const eligible = missionRewardEligibleDiscardCards(targetSide);
  const required = Math.floor(eligible.length * Math.max(0, Number(reward.numerator) || 0) / Math.max(1, Number(reward.denominator) || 1));
  if (required <= 0) return { pending:false, targetSide, required:0, discarded:0 };
  if (state.modes && state.modes[targetSide] === "bot") {
    const selected = missionBotDiscardChoice(eligible, required);
    const discarded = missionDiscardSelectedCards(targetSide, selected, source, side);
    return { pending:false, targetSide, required, discarded:discarded.length, selected };
  }
  state.missionPendingReward = {
    kind:"enemy_discard_selection",
    missionOwnerSide:side,
    chooserSide:targetSide,
    missionId:missionRuntime(side) && missionRuntime(side).missionId,
    missionName:source,
    required,
    eligibleUids:eligible.map(card => card.cardUid),
    selectedUids:[],
    createdAt:new Date().toISOString()
  };
  return { pending:true, targetSide, required, discarded:0 };
}

function missionPendingDiscardEligibleCards() {
  const pending = missionPendingReward();
  if (!pending || pending.kind !== "enemy_discard_selection") return [];
  const hand = state.hand && state.hand[pending.chooserSide] ? state.hand[pending.chooserSide] : [];
  return hand.filter(card => pending.eligibleUids.includes(card.cardUid) && !(typeof isProtectedHandCard === "function" && isProtectedHandCard(card)));
}

function missionRewardToggleDiscardSelection(cardUid) {
  const pending = missionPendingReward();
  if (!pending || pending.kind !== "enemy_discard_selection") return false;
  if (!pending.eligibleUids.includes(cardUid)) return false;
  const index = pending.selectedUids.indexOf(cardUid);
  if (index >= 0) pending.selectedUids.splice(index, 1);
  else if (pending.selectedUids.length < pending.required) pending.selectedUids.push(cardUid);
  if (typeof renderAll === "function") renderAll();
  return true;
}

function missionRewardConfirmDiscardSelection() {
  const pending = missionPendingReward();
  if (!pending || pending.kind !== "enemy_discard_selection") return false;
  const selected = pending.selectedUids.filter(uid => pending.eligibleUids.includes(uid));
  if (selected.length !== pending.required) return false;
  const discarded = missionDiscardSelectedCards(pending.chooserSide, selected, pending.missionName, pending.missionOwnerSide);
  if (discarded.length !== pending.required) return false;
  const ownerSide = pending.missionOwnerSide;
  state.missionPendingReward = null;
  missionFinalizeReward(ownerSide, { kind:"enemy_discards_hand_fraction", targetSide:pending.chooserSide, required:pending.required, discarded:discarded.length, selected });
  if (typeof renderAll === "function") renderAll();
  if (state && state.modes && state.modes[state.currentPlayer] === "bot" && typeof maybeRunBot === "function") maybeRunBot();
  return true;
}

function missionApplyOrdinaryReward(side, definition) {
  const reward = definition && definition.reward;
  if (!reward) return { pending:false, kind:"none" };
  const source = definition.name;
  switch (reward.kind) {
    case "card_cost_sequence":
      return { pending:false, kind:reward.kind, sequence:missionSetCardCostSequence(side, reward, source) };
    case "gain_energy_per_controlled_ps": {
      const ps = typeof countControlledPS === "function" ? countControlledPS(side) : 0;
      return { pending:false, kind:reward.kind, controlledPs:ps, ...missionRewardGainEnergy(side, ps * (Number(reward.value) || 0), source) };
    }
    case "draw_with_discount":
      return { pending:false, kind:reward.kind, ...missionRewardDraw(side, reward.draw, source, reward.discount, reward.minCost) };
    case "draw_cards":
      return { pending:false, kind:reward.kind, ...missionRewardDraw(side, reward.draw, source) };
    case "gain_energy":
      return { pending:false, kind:reward.kind, ...missionRewardGainEnergy(side, reward.value, source) };
    case "enemy_loses_energy_fraction":
      return { pending:false, kind:reward.kind, ...missionRewardEnemyLosesEnergyFraction(side, reward, source) };
    case "enemy_discards_hand_fraction":
      return { kind:reward.kind, ...missionCreateDiscardSelection(side, reward, source) };
    default:
      return { pending:false, kind:reward.kind || "unsupported", unsupported:true };
  }
}

function missionFinalizeReward(side, result) {
  const runtime = typeof missionRuntime === "function" ? missionRuntime(side) : null;
  if (!runtime) return false;
  runtime.rewardPending = false;
  runtime.rewardResolved = true;
  runtime.rewardResolvedAt = new Date().toISOString();
  runtime.rewardResult = result || null;
  runtime.status = "resolved";
  if (typeof missionTelemetryRecord === "function") {
    missionTelemetryRecord(side, "rewardsResolved", 1);
    const wasted = result && Array.isArray(result.wasted) ? result.wasted.reduce((sum, item) => sum + Math.max(0, Number(item && item.amount) || 0), 0) : 0;
    if (wasted > 0) missionTelemetryRecord(side, "targetQuotasWasted", wasted);
  }
  if (typeof emitGameEvent === "function" && EventTypes.MISSION_REWARD_RESOLVED) emitGameEvent({
    type:EventTypes.MISSION_REWARD_RESOLVED,
    data:{ player:side, faction:state.factions && state.factions[side], missionId:runtime.missionId, missionName:runtime.missionName, cycle:runtime.cycle, result:runtime.rewardResult }
  });
  if (typeof log === "function") log(`Ricompensa della Missione “${runtime.missionName}” risolta.`);
  return true;
}

function missionPlayOrdinary(side, options={}) {
  if (missionResolutionBusy) return false;
  const check = missionCanPlayOrdinary(side, null, options);
  if (!check.ok) {
    if (typeof log === "function") log(`Missione: ${check.reason}.`);
    if (typeof renderAll === "function") renderAll();
    return false;
  }
  missionResolutionBusy = true;
  try {
    const runtime = check.runtime;
    const definition = missionDefinitionById(runtime.missionId);
    const card = check.card;
    runtime.played = true;
    runtime.playedAt = new Date().toISOString();
    runtime.playedRound = state.turn;
    runtime.ready = false;
    runtime.status = "resolving";
    card.missionPlayed = true;
    card.missionPlayedAt = runtime.playedAt;

    const discarded = typeof discardPlayedHandCard === "function" ? discardPlayedHandCard(side, card.cardUid) : null;
    if (!discarded) {
      runtime.played = false;
      runtime.status = "ready";
      runtime.ready = true;
      return false;
    }

    if (typeof emitGameEvent === "function" && EventTypes.MISSION_PLAYED) emitGameEvent({
      type:EventTypes.MISSION_PLAYED,
      data:{ player:side, faction:state.factions && state.factions[side], missionId:runtime.missionId, missionName:runtime.missionName, missionClass:runtime.missionClass, cycle:runtime.cycle, cardUid:discarded.cardUid, round:state.turn }
    });
    if (typeof missionTelemetryRecord === "function") {
      missionTelemetryRecord(side, "missionsPlayed", 1);
      if (runtime.cycle > 1) missionTelemetryRecord(side, "secondOrLaterPlays", 1);
      if (options.allowBot) missionTelemetryRecord(side, "aiMissionPlays", 1, { missionId:runtime.missionId, cycle:runtime.cycle, missionClass:runtime.missionClass, readyCount:runtime.readyCount, phase:options.phase || "bot" });
    }
    if (typeof log === "function") log(`${playerName(side)} gioca la Missione “${runtime.missionName}”: gli obiettivi vengono verificati e la carta va negli scarti.`);

    const result = missionApplyOrdinaryReward(side, definition);
    runtime.rewardResult = result;
    runtime.rewardPending = Boolean(result && result.pending);
    if (runtime.rewardPending) {
      runtime.status = "reward_pending";
      if (typeof emitGameEvent === "function" && EventTypes.MISSION_REWARD_PENDING) emitGameEvent({
        type:EventTypes.MISSION_REWARD_PENDING,
        data:{ player:side, faction:state.factions && state.factions[side], missionId:runtime.missionId, missionName:runtime.missionName, cycle:runtime.cycle, result }
      });
      if (typeof missionUiOpenPanel === "function") missionUiOpenPanel(side);
    } else {
      missionFinalizeReward(side, result);
    }
    if (typeof missionUiCancelSelection === "function") missionUiCancelSelection({ skipRender:true });
    if (typeof renderAll === "function") renderAll();
    return true;
  } finally {
    missionResolutionBusy = false;
  }
}


// =====================================================
// F9N9 – Missioni disperate
// =====================================================

function missionDesperateMultiplier(runtime) {
  return Math.max(1, Math.min(3, Number(runtime && runtime.readyCount) || 0));
}

function missionCanPlayDesperate(side, card=null, options={}) {
  if (!state) return { ok:false, reason:"Partita non inizializzata" };
  if (state.winner) return { ok:false, reason:"Partita conclusa" };
  if (missionInteractionBlocked()) return { ok:false, reason:"Completa prima la scelta della ricompensa Missione" };
  const runtime = typeof missionRuntime === "function" ? missionRuntime(side) : null;
  if (!runtime || !runtime.active) return { ok:false, reason:"Missione assente" };
  if (runtime.missionClass !== "desperate") return { ok:false, reason:"La Missione non è disperata" };
  if (runtime.played) return { ok:false, reason:"Missione già giocata in questo ciclo" };
  if (typeof missionIsRecoveryLocked === "function" && missionIsRecoveryLocked(side)) return { ok:false, reason:"Missione recuperata: utilizzabile dal prossimo turno personale" };
  if (state.currentPlayer !== side) return { ok:false, reason:"Non è il turno del proprietario" };
  const isBotOwner = Boolean(state.modes && state.modes[side] === "bot");
  if (isBotOwner && options.allowBot !== true) return { ok:false, reason:"Missione gestita dall’IA" };
  if (!isBotOwner && botRunning) return { ok:false, reason:"Bot in esecuzione" };
  const missionCard = card || missionCardInHand(side);
  if (!missionCard || !missionCardMatchesRuntime(missionCard, runtime)) return { ok:false, reason:"La carta Missione non è nella mano" };
  if (typeof playerHandLocked === "function" && playerHandLocked(side)) return { ok:false, reason:"Mano bloccata" };
  if (typeof handCardBlocked === "function" && handCardBlocked(missionCard)) return { ok:false, reason:typeof handCardBlockReason === "function" ? handCardBlockReason(missionCard) : "Missione bloccata" };
  if (options.evaluate !== false && typeof missionEvaluateSide === "function") missionEvaluateSide(side, "f9n9_final_validation", { checkpoint:"mission_play", side, round:state.turn });
  const multiplier = missionDesperateMultiplier(runtime);
  if (!runtime.ready || multiplier < 1) return { ok:false, reason:"Nessuna condizione disperata soddisfatta" };
  return { ok:true, reason:`Missione disperata pronta ×${multiplier}`, card:missionCard, runtime, multiplier };
}

function missionRewardUnitByUid(uid) {
  return state && Array.isArray(state.units) ? state.units.find(unit => unit && unit.uid === uid && unit.alive && Array.isArray(unit.pos)) || null : null;
}

function missionRewardTargetableEnemy(unit, ownerSide) {
  if (!unit || !unit.alive || unit.side === ownerSide || unit.type === "QG") return false;
  if (typeof hasStatus === "function" && hasStatus(unit, "enemy_effect_immune")) return false;
  if (typeof isUntargetableTo === "function" && isUntargetableTo(unit, ownerSide)) return false;
  return true;
}

function missionCreateTargetGroup(key, label, units, quota, effect) {
  const eligible = (units || []).filter(Boolean);
  const required = Math.min(Math.max(0, Number(quota) || 0), eligible.length);
  return {
    key, label, quota:Math.max(0, Number(quota) || 0), required, wasted:Math.max(0, (Number(quota) || 0) - required),
    eligibleUids:eligible.map(unit => unit.uid), selectedUids:[], effect
  };
}

function missionTargetGroupsComplete(pending) {
  return Boolean(pending && Array.isArray(pending.groups) && pending.groups.every(group => (group.selectedUids || []).length === group.required));
}

function missionPendingTargetGroup(groupKey) {
  const pending = missionPendingReward();
  if (!pending || pending.kind !== "mission_target_selection") return null;
  return pending.groups.find(group => group.key === groupKey) || null;
}

function missionPendingTargetEligibleUnits(groupKey) {
  const group = missionPendingTargetGroup(groupKey);
  if (!group) return [];
  return group.eligibleUids.map(missionRewardUnitByUid).filter(Boolean);
}

function missionRewardToggleTargetSelection(groupKey, uid) {
  const group = missionPendingTargetGroup(groupKey);
  if (!group || !group.eligibleUids.includes(uid)) return false;
  const index = group.selectedUids.indexOf(uid);
  if (index >= 0) group.selectedUids.splice(index, 1);
  else if (group.selectedUids.length < group.required) group.selectedUids.push(uid);
  if (typeof renderAll === "function") renderAll();
  return true;
}

function missionResetUnitActionFlags(unit) {
  if (!unit || !unit.alive) return false;
  unit.acted = false;
  unit.attacksMade = 0;
  unit.movedThisTurn = false;
  unit.abilityUsedThisTurn = false;
  unit.builtThisTurn = false;
  unit.c2c5bMoveBonus = 0;
  unit.c2c5bDoubleMove = false;
  unit.c2c5bPassageContinue = false;
  unit.c2c5bMoveOnlyExhaustAfterMove = false;
  return true;
}

function missionGrantDoubleAction(unit, source) {
  if (!unit || !unit.alive || unit.type !== "Fanteria") return false;
  unit.missionExtraActionCredits = (unit.missionExtraActionCredits || 0) + 1;
  unit.missionExtraActionSource = source;
  unit.missionExtraActionRound = state.turn;
  if (unit.acted) {
    unit.missionExtraActionCredits -= 1;
    missionResetUnitActionFlags(unit);
    if (typeof log === "function") log(`${unit.name} viene riattivata da ${source}: può compiere la seconda azione nel round.`);
  } else if (typeof log === "function") {
    log(`${unit.name} riceve una seconda azione da ${source} nel round corrente.`);
  }
  return true;
}

function missionMaybeReactivateAfterAction(unit) {
  if (!unit || !unit.alive || (unit.missionExtraActionCredits || 0) <= 0 || unit.missionExtraActionRound !== state.turn) return false;
  unit.missionExtraActionCredits -= 1;
  missionResetUnitActionFlags(unit);
  if (typeof log === "function") log(`${unit.name} completa la prima azione e viene riattivata da ${unit.missionExtraActionSource || "Ultimo Assalto"}.`);
  return true;
}

function missionApplyTargetSelection(pending) {
  const applied = [];
  const wasted = [];
  for (const group of pending.groups || []) {
    const selectedUnits = (group.selectedUids || []).map(missionRewardUnitByUid).filter(Boolean);
    let appliedCount = 0;
    for (const unit of selectedUnits) {
      if (group.effect === "ignore_defense_next_attack") {
        if (typeof applyStatus === "function") applyStatus(unit, { kind:"next_attack_ignore_defense", turns:1, owner:pending.missionOwnerSide, source:`Missione: ${pending.missionName}` });
        appliedCount += 1;
      } else if (group.effect === "double_action_current_round") {
        if (missionGrantDoubleAction(unit, `Missione: ${pending.missionName}`)) appliedCount += 1;
      } else if (group.effect === "phase_shield_current_round") {
        if (typeof applyStatus === "function") applyStatus(unit, { kind:"mission_phase_shield", turns:1, owner:pending.missionOwnerSide, source:`Missione: ${pending.missionName}`, expiresRound:state.turn });
        appliedCount += 1;
      } else if (group.effect === "stun_enemy_turn") {
        if (missionRewardTargetableEnemy(unit, pending.missionOwnerSide) && typeof applyStatus === "function") {
          applyStatus(unit, { kind:"inhibit_action", turns:1, owner:pending.missionOwnerSide, source:`Missione: ${pending.missionName}` });
          appliedCount += 1;
        }
      }
    }
    applied.push({ key:group.key, quota:group.quota, selected:selectedUnits.length, applied:appliedCount, targets:selectedUnits.map(unit => unit.uid) });
    wasted.push({ key:group.key, amount:Math.max(0, group.quota - appliedCount) });
  }
  return { applied, wasted };
}

function missionRewardConfirmTargetSelection() {
  const pending = missionPendingReward();
  if (!pending || pending.kind !== "mission_target_selection" || !missionTargetGroupsComplete(pending)) return false;
  const ownerSide = pending.missionOwnerSide;
  const result = { kind:pending.rewardKind, multiplier:pending.multiplier, ...missionApplyTargetSelection(pending) };
  state.missionPendingReward = null;
  missionFinalizeReward(ownerSide, result);
  if (typeof renderAll === "function") renderAll();
  return true;
}

function missionAiTargetScore(unit, effect, ownerSide) {
  if (!unit) return -999;
  const att = typeof effectiveAtt === "function" ? effectiveAtt(unit) : Number(unit.currentAtt || unit.att || 0);
  const life = Number(unit.currentHp || 0) + Number(unit.currentDef || 0);
  const cost = Number(unit.cost || 0);
  let score = att * 2 + life * 0.45 + cost;
  if (unit.type === "Comandante") score += 5;
  if (unit.weight === "Pivot" || unit.deckRole === "pivot") score += 6;
  if (effect === "double_action_current_round") score += unit.acted ? 8 : 2;
  if (effect === "phase_shield_current_round") {
    const threats = typeof enemiesNear === "function" ? enemiesNear(unit.pos, ownerSide, 2).length : 0;
    score += threats * 5;
  }
  if (effect === "stun_enemy_turn") {
    if (unit.type === "Comandante") score += 6;
    if (unit.weight === "Pivot" || unit.weight === "Elite") score += 5;
  }
  return score;
}

function missionAiFillTargetGroups(pending) {
  if (!pending || !Array.isArray(pending.groups)) return pending;
  for (const group of pending.groups) {
    const units = group.eligibleUids.map(missionRewardUnitByUid).filter(Boolean);
    units.sort((a,b) => missionAiTargetScore(b, group.effect, pending.missionOwnerSide) - missionAiTargetScore(a, group.effect, pending.missionOwnerSide));
    group.selectedUids = units.slice(0, group.required).map(unit => unit.uid);
  }
  return pending;
}

function missionCreateTargetSelection(side, definition, multiplier) {
  const reward = definition.reward || {};
  const own = typeof missionUnits === "function" ? missionUnits(side) : [];
  const enemySide = typeof missionEnemy === "function" ? missionEnemy(side) : (side === 1 ? 2 : 1);
  const enemy = typeof missionUnits === "function" ? missionUnits(enemySide) : [];
  let groups = [];
  if (reward.kind === "distinct_units_per_condition") {
    groups = [
      missionCreateTargetGroup("vehicles", "Veicoli distinti", own.filter(unit => unit.type === "Veicolo"), multiplier, "ignore_defense_next_attack"),
      missionCreateTargetGroup("infantry", "Fanterie distinte", own.filter(unit => unit.type === "Fanteria"), multiplier, "double_action_current_round")
    ];
  } else if (reward.kind === "phase_shield_per_condition") {
    groups = [missionCreateTargetGroup("allies", "Unità alleate distinte", own, multiplier, "phase_shield_current_round")];
  } else if (reward.kind === "stun_enemy_per_condition") {
    groups = [missionCreateTargetGroup("enemies", "Unità nemiche distinte", enemy.filter(unit => missionRewardTargetableEnemy(unit, side)), multiplier, "stun_enemy_turn")];
  }
  const pending = {
    kind:"mission_target_selection", rewardKind:reward.kind, missionOwnerSide:side, missionId:definition.id, missionName:definition.name,
    multiplier, groups, createdAt:new Date().toISOString()
  };
  if (!groups.length || groups.every(group => group.required === 0)) {
    return { pending:false, kind:reward.kind, multiplier, applied:[], wasted:groups.map(group => ({key:group.key,amount:group.quota})) };
  }
  if (state.modes && state.modes[side] === "bot") {
    missionAiFillTargetGroups(pending);
    return { pending:false, kind:reward.kind, multiplier, ...missionApplyTargetSelection(pending), selectedBy:"ai" };
  }
  state.missionPendingReward = pending;
  return { pending:true, kind:reward.kind, multiplier, groups:groups.map(group => ({ key:group.key, quota:group.quota, required:group.required, wasted:group.wasted })) };
}

function missionGrantRepeatAttackPool(side, multiplier, source) {
  const rewardState = missionRewardStateForSide(side);
  rewardState.repeatAttacksRemaining = multiplier;
  rewardState.repeatAttacksGranted = multiplier;
  rewardState.repeatAttacksUsed = 0;
  rewardState.repeatAttacksRound = state.turn;
  rewardState.repeatAttacksSource = source;
  if (typeof log === "function") log(`Missione “${source}”: ${playerName(side)} ottiene ${multiplier} possibilita di ripetere un attacco nel round corrente.`);
  return { pending:false, kind:"repeat_attacks_current_round", multiplier, charges:multiplier, round:state.turn };
}

function missionRepeatAttackState(side) {
  const rewardState = missionRewardStateForSide(side);
  if (!rewardState || rewardState.repeatAttacksRound !== state.turn || rewardState.repeatAttacksRemaining <= 0) return null;
  return rewardState;
}

function missionMaybeOfferRepeatAttack(attacker, defender) {
  if (!state || state.missionRepeatResolving || missionPendingReward()) return false;
  if (!attacker || !defender || !attacker.alive || !defender.alive || attacker.side !== state.currentPlayer) return false;
  const rewardState = missionRepeatAttackState(attacker.side);
  if (!rewardState || !Array.isArray(attacker.pos) || !Array.isArray(defender.pos) || (typeof areAdjacent === "function" && !areAdjacent(attacker.pos, defender.pos))) return false;
  if (typeof statusBlocks === "function" && statusBlocks(attacker, "attack")) return false;
  if (typeof isUntargetableTo === "function" && isUntargetableTo(defender, attacker.side)) return false;
  state.missionPendingReward = {
    kind:"repeat_attack_confirmation", missionOwnerSide:attacker.side, missionName:rewardState.repeatAttacksSource || "Ultima Possibilita",
    attackerUid:attacker.uid, defenderUid:defender.uid, remaining:rewardState.repeatAttacksRemaining, createdAt:new Date().toISOString()
  };
  if (state.modes && state.modes[attacker.side] === "bot") return missionRewardConfirmRepeatAttack();
  if (typeof renderAll === "function") renderAll();
  return true;
}

function missionRewardSkipRepeatAttack() {
  const pending = missionPendingReward();
  if (!pending || pending.kind !== "repeat_attack_confirmation") return false;
  state.missionPendingReward = null;
  if (typeof renderAll === "function") renderAll();
  return true;
}

function missionRewardConfirmRepeatAttack() {
  const pending = missionPendingReward();
  if (!pending || pending.kind !== "repeat_attack_confirmation") return false;
  const attacker = missionRewardUnitByUid(pending.attackerUid);
  const defender = missionRewardUnitByUid(pending.defenderUid);
  const rewardState = missionRepeatAttackState(pending.missionOwnerSide);
  if (!attacker || !defender || !rewardState || rewardState.repeatAttacksRemaining <= 0) { state.missionPendingReward = null; if (typeof renderAll === "function") renderAll(); return false; }
  state.missionPendingReward = null;
  rewardState.repeatAttacksRemaining -= 1;
  rewardState.repeatAttacksUsed += 1;
  attacker.acted = false;
  attacker.attacksPerTurn = Math.max(attacker.attacksPerTurn || 1, (attacker.attacksMade || 0) + 1);
  state.missionRepeatResolving = true;
  try {
    if (typeof attackUnit === "function") attackUnit(attacker, defender);
  } finally {
    state.missionRepeatResolving = false;
    if (attacker.alive) attacker.acted = true;
  }
  if (attacker.alive && defender.alive && rewardState.repeatAttacksRemaining > 0) missionMaybeOfferRepeatAttack(attacker, defender);
  if (typeof renderAll === "function") renderAll();
  return true;
}

function missionApplyDesperateReward(side, definition, multiplier) {
  const reward = definition && definition.reward;
  if (!reward) return { pending:false, kind:"none", multiplier };
  const source = definition.name;
  switch (reward.kind) {
    case "energy_and_draw_per_condition":
      return { pending:false, kind:reward.kind, multiplier, energy:missionRewardGainEnergy(side, (Number(reward.energyPerCondition)||0)*multiplier, source), draw:missionRewardDraw(side, (Number(reward.drawPerCondition)||0)*multiplier, source) };
    case "distinct_units_per_condition":
    case "phase_shield_per_condition":
    case "stun_enemy_per_condition":
      return missionCreateTargetSelection(side, definition, multiplier);
    case "repeat_attacks_current_round":
      return missionGrantRepeatAttackPool(side, multiplier * Math.max(1, Number(reward.attacksPerCondition)||1), source);
    default:
      return { pending:false, kind:reward.kind || "unsupported", multiplier, unsupported:true };
  }
}

function missionPlayDesperate(side, options={}) {
  if (missionResolutionBusy) return false;
  const check = missionCanPlayDesperate(side, null, options);
  if (!check.ok) {
    if (typeof log === "function") log(`Missione: ${check.reason}.`);
    if (typeof renderAll === "function") renderAll();
    return false;
  }
  missionResolutionBusy = true;
  try {
    const runtime = check.runtime;
    const definition = missionDefinitionById(runtime.missionId);
    const card = check.card;
    const multiplier = check.multiplier;
    runtime.played = true; runtime.playedAt = new Date().toISOString(); runtime.playedRound = state.turn; runtime.playedMultiplier = multiplier;
    runtime.ready = false; runtime.status = "resolving";
    card.missionPlayed = true; card.missionPlayedAt = runtime.playedAt; card.missionMultiplier = multiplier;
    const discarded = typeof discardPlayedHandCard === "function" ? discardPlayedHandCard(side, card.cardUid) : null;
    if (!discarded) { runtime.played=false; runtime.status="ready"; runtime.ready=true; return false; }
    if (typeof emitGameEvent === "function" && EventTypes.MISSION_PLAYED) emitGameEvent({
      type:EventTypes.MISSION_PLAYED,
      data:{ player:side, faction:state.factions && state.factions[side], missionId:runtime.missionId, missionName:runtime.missionName, missionClass:"desperate", multiplier, cycle:runtime.cycle, cardUid:discarded.cardUid, round:state.turn }
    });
    if (typeof missionTelemetryRecord === "function") {
      missionTelemetryRecord(side, "missionsPlayed", 1);
      if (runtime.cycle > 1) missionTelemetryRecord(side, "secondOrLaterPlays", 1);
      if (options.allowBot) missionTelemetryRecord(side, "aiMissionPlays", 1, { missionId:runtime.missionId, cycle:runtime.cycle, missionClass:"desperate", multiplier, phase:options.phase || "bot" });
    }
    if (typeof log === "function") log(`${playerName(side)} gioca la Missione disperata “${runtime.missionName}” a ×${multiplier}: la carta va negli scarti.`);
    const result = missionApplyDesperateReward(side, definition, multiplier);
    runtime.rewardResult = result; runtime.rewardPending = Boolean(result && result.pending);
    if (runtime.rewardPending) {
      runtime.status = "reward_pending";
      if (typeof emitGameEvent === "function" && EventTypes.MISSION_REWARD_PENDING) emitGameEvent({ type:EventTypes.MISSION_REWARD_PENDING, data:{ player:side, faction:state.factions && state.factions[side], missionId:runtime.missionId, missionName:runtime.missionName, missionClass:"desperate", multiplier, cycle:runtime.cycle, result } });
      if (typeof missionUiOpenPanel === "function") missionUiOpenPanel(side);
    } else missionFinalizeReward(side, result);
    if (typeof missionUiCancelSelection === "function") missionUiCancelSelection({ skipRender:true });
    if (typeof renderAll === "function") renderAll();
    return true;
  } finally { missionResolutionBusy = false; }
}

function missionPlayMission(side, options={}) {
  const runtime = typeof missionRuntime === "function" ? missionRuntime(side) : null;
  if (!runtime) return false;
  return runtime.missionClass === "desperate" ? missionPlayDesperate(side, options) : missionPlayOrdinary(side, options);
}

function missionCleanupEndOfRound(round) {
  if (!state) return;
  for (const unit of state.units || []) {
    if (!unit) continue;
    unit.missionExtraActionCredits = 0;
    unit.missionExtraActionRound = null;
    if (Array.isArray(unit.statuses)) {
      const removed = unit.statuses.filter(status => status && status.kind === "mission_phase_shield" && (status.expiresRound == null || status.expiresRound <= round));
      unit.statuses = unit.statuses.filter(status => !removed.includes(status));
      for (const status of removed) if (typeof log === "function") log(`Scudo Fasico della Missione termina su ${unit.name} a fine round.`);
    }
  }
  for (const side of [1,2]) {
    const rewardState = missionRewardStateForSide(side);
    if (rewardState && rewardState.repeatAttacksRound === round) {
      const wasted = rewardState.repeatAttacksRemaining || 0;
      if (wasted > 0 && typeof log === "function") log(`${playerName(side)} perde ${wasted} ripetizioni di attacco non usate a fine round.`);
      rewardState.repeatAttacksRemaining = 0; rewardState.repeatAttacksRound = null;
    }
  }
}

function missionRewardDiagnostics() {
  ensureMissionRewardState();
  return {
    rewards:state ? JSON.parse(JSON.stringify(state.missionRewards)) : null,
    pending:state && state.missionPendingReward ? JSON.parse(JSON.stringify(state.missionPendingReward)) : null
  };
}
