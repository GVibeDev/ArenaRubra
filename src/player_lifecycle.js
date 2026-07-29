"use strict";

// Arena Rubra – F9Q3d3 Player Elimination & Active State Foundation.
// Centralizza lo stato active/eliminated/winner e la bonifica atomica di un giocatore
// eliminato. Le carte rubate e le unità già convertite seguono il possessore corrente:
// non vengono restituite al proprietario originario e non vengono cancellate se ora
// appartengono a un giocatore ancora attivo.

const PLAYER_LIFECYCLE_STATES = Object.freeze({
  ACTIVE:"active",
  ELIMINATED:"eliminated",
  WINNER:"winner"
});

function playerLifecycleRecord(playerId) {
  if (typeof state === "undefined" || !state || !Array.isArray(state.players)) return null;
  return state.players.find(player => Number(player.id) === Number(playerId)) || null;
}

function playerLifecycleStatus(playerId) {
  const side = Number(playerId);
  if (!Number.isFinite(side) || side <= 0) return null;
  if (state && Number(state.winnerSide) === side) return PLAYER_LIFECYCLE_STATES.WINNER;
  const record = playerLifecycleRecord(side);
  if (record && record.eliminated === true) return PLAYER_LIFECYCLE_STATES.ELIMINATED;
  return PLAYER_LIFECYCLE_STATES.ACTIVE;
}

function isPlayerActive(playerId) {
  return playerLifecycleStatus(playerId) === PLAYER_LIFECYCLE_STATES.ACTIVE;
}

function isPlayerWinner(playerId) {
  return playerLifecycleStatus(playerId) === PLAYER_LIFECYCLE_STATES.WINNER;
}

function playerLifecycleIds(status=null) {
  const ids = typeof mapRuntimePlayerIds === "function"
    ? mapRuntimePlayerIds(typeof state !== "undefined" ? state : null)
    : (state && Array.isArray(state.players) ? state.players.map(player => Number(player.id)) : []);
  return status ? ids.filter(side => playerLifecycleStatus(side) === status) : ids;
}

function playerLifecycleNeutralizeOwnedHazards(playerId) {
  const side = Number(playerId);
  const summary = { minesRemoved:0, minesNeutralized:0, cellEffectsRemoved:0, cellEffectsNeutralized:0, psLocksRemoved:0 };
  if (!state) return summary;

  if (Array.isArray(state.mines)) {
    const kept = [];
    for (const mine of state.mines) {
      if (Number(mine && mine.owner) !== side) { kept.push(mine); continue; }
      if (mine && mine.initialMapHazard) {
        mine.owner = 0;
        summary.minesNeutralized += 1;
        kept.push(mine);
      } else summary.minesRemoved += 1;
    }
    state.mines = kept;
  }

  if (Array.isArray(state.cellEffects)) {
    const kept = [];
    for (const effect of state.cellEffects) {
      if (Number(effect && effect.owner) !== side) { kept.push(effect); continue; }
      if (effect && effect.initialMapHazard) {
        effect.owner = 0;
        summary.cellEffectsNeutralized += 1;
        kept.push(effect);
      } else summary.cellEffectsRemoved += 1;
    }
    state.cellEffects = kept;
  }

  if (Array.isArray(state.psLocks)) {
    const before = state.psLocks.length;
    state.psLocks = state.psLocks.filter(lock => Number(lock && lock.owner) !== side);
    summary.psLocksRemoved = before - state.psLocks.length;
  }

  if (Array.isArray(state.cells)) {
    for (const cell of state.cells) {
      const hazard = cell && cell.initialHazard;
      if (hazard && Number(hazard.ownerPlayerId) === side) hazard.ownerPlayerId = 0;
    }
  }
  return summary;
}

function playerLifecycleRemoveOwnedStatuses(playerId) {
  const side = Number(playerId);
  let removed = 0;
  if (!state || !Array.isArray(state.units)) return removed;
  for (const unit of state.units) {
    if (!unit || !Array.isArray(unit.statuses)) continue;
    const before = unit.statuses.length;
    unit.statuses = unit.statuses.filter(status => Number(status && (status.owner ?? status.sourceSide ?? status.casterSide)) !== side);
    removed += before - unit.statuses.length;
  }
  return removed;
}

function playerLifecycleClearPlayerEffects(playerId) {
  const side = Number(playerId);
  const summary = { targetEffectsCleared:0, sourceEffectsCleared:0 };
  if (!state || !state.playerEffects) return summary;
  if (Array.isArray(state.playerEffects[side])) {
    summary.targetEffectsCleared = state.playerEffects[side].length;
    state.playerEffects[side] = [];
  }
  for (const [target, effects] of Object.entries(state.playerEffects)) {
    if (Number(target) === side || !Array.isArray(effects)) continue;
    const before = effects.length;
    state.playerEffects[target] = effects.filter(effect => Number(effect && (effect.casterSide ?? effect.owner ?? effect.sourceSide)) !== side);
    summary.sourceEffectsCleared += before - state.playerEffects[target].length;
  }
  return summary;
}

function playerLifecycleCancelInteraction(playerId) {
  const side = Number(playerId);
  let cancelledPlayerTarget = false;
  let cancelledUnitSelection = false;
  if (typeof pendingPlayerTargetContext !== "undefined" && pendingPlayerTargetContext) {
    const casterEliminated = Number(pendingPlayerTargetContext.casterSide) === side;
    const targetWasListed = Array.isArray(pendingPlayerTargetContext.targetSides) && pendingPlayerTargetContext.targetSides.map(Number).includes(side);
    if (casterEliminated || targetWasListed) {
      if (typeof closePlayerTargetSelector === "function") closePlayerTargetSelector({ silent:true, force:true });
      else pendingPlayerTargetContext = null;
      cancelledPlayerTarget = true;
    }
  }
  if (typeof selectedId !== "undefined" && selectedId && state && Array.isArray(state.units)) {
    const selected = state.units.find(unit => unit && unit.uid === selectedId);
    if (selected && Number(selected.side) === side) {
      if (typeof clearSelection === "function") clearSelection();
      else selectedId = null;
      cancelledUnitSelection = true;
    }
  }
  return { cancelledPlayerTarget, cancelledUnitSelection };
}

function playerLifecycleReconcilePendingMission(playerId) {
  const side = Number(playerId);
  const pending = state && state.missionPendingReward;
  if (!pending) return { changed:false, action:"none" };
  const owner = Number(pending.missionOwnerSide || 0);

  if (owner === side) {
    state.missionPendingReward = null;
    if (typeof closePlayerTargetSelector === "function") closePlayerTargetSelector({ silent:true, force:true });
    const runtime = state.missions && state.missions[side];
    if (runtime) {
      runtime.rewardPending = false;
      runtime.ready = false;
      runtime.status = "eliminated";
    }
    return { changed:true, action:"owner_eliminated" };
  }

  if (pending.kind === "mission_player_target_selection" && Array.isArray(pending.targetSides)) {
    const before = pending.targetSides.length;
    pending.targetSides = pending.targetSides.map(Number).filter(target => target !== side && (typeof isPlayerEliminated !== "function" || !isPlayerEliminated(target)));
    if (pending.targetSides.length !== before) {
      if (typeof closePlayerTargetSelector === "function") closePlayerTargetSelector({ silent:true, force:true });
      if (pending.targetSides.length && typeof missionOpenPendingPlayerRewardSelector === "function") missionOpenPendingPlayerRewardSelector();
      else if (!pending.targetSides.length) {
        state.missionPendingReward = null;
        if (typeof missionFinalizeReward === "function" && owner > 0) missionFinalizeReward(owner, { kind:"no_valid_target", targetEliminated:true });
      }
      return { changed:true, action:pending.targetSides.length ? "targets_filtered" : "no_targets" };
    }
  }

  if (Number(pending.chooserSide || pending.targetSide || 0) === side) {
    state.missionPendingReward = null;
    if (typeof closePlayerTargetSelector === "function") closePlayerTargetSelector({ silent:true, force:true });
    if (typeof missionFinalizeReward === "function" && owner > 0) missionFinalizeReward(owner, { kind:"no_valid_target", targetEliminated:true });
    return { changed:true, action:"chooser_eliminated" };
  }

  if (pending.kind === "mission_target_selection" && Array.isArray(pending.groups)) {
    let changed = false;
    const eliminatedUids = new Set((state.units || []).filter(unit => unit && Number(unit.side) === side).map(unit => unit.uid));
    for (const group of pending.groups) {
      if (!group) continue;
      const beforeEligible = Array.isArray(group.eligibleUids) ? group.eligibleUids.length : 0;
      group.eligibleUids = (group.eligibleUids || []).filter(uid => !eliminatedUids.has(uid));
      group.selectedUids = (group.selectedUids || []).filter(uid => group.eligibleUids.includes(uid));
      group.required = Math.min(Number(group.required || 0), group.eligibleUids.length);
      if (group.eligibleUids.length !== beforeEligible) changed = true;
    }
    if (changed) return { changed:true, action:"unit_targets_filtered" };
  }
  return { changed:false, action:"none" };
}

function playerLifecycleCleanupElimination(playerId, conqueror=null, reason="eliminazione") {
  const side = Number(playerId);
  const record = playerLifecycleRecord(side);
  const summary = {
    player:side,
    conqueror:Number(conqueror) || null,
    reason,
    fieldUnitsRemoved:0,
    qgMarkedInactive:false,
    statusesRemoved:0,
    hazards:null,
    effects:null,
    interaction:null,
    mission:null
  };
  if (!state || !Number.isFinite(side) || side <= 0) return summary;

  if (record) {
    record.eliminated = true;
    record.lifecycleStatus = PLAYER_LIFECYCLE_STATES.ELIMINATED;
    record.eliminatedAtTurn = state.turn;
    record.eliminatedAtOrderIndex = state.orderIndex;
    record.eliminatedBy = summary.conqueror;
    record.eliminationReason = reason;
    if (summary.attribution) {
      record.eliminationAssistSides = [...(summary.attribution.assistSides || [])];
      record.eliminationAttributionType = summary.attribution.attributionType || null;
    }
  }

  if (Array.isArray(state.units)) {
    for (const unit of state.units) {
      if (!unit || Number(unit.side) !== side) continue;
      if (unit.type === "QG") {
        unit.eliminatedOwner = true;
        unit.activeObjective = false;
        unit.eliminatedAtTurn = state.turn;
        unit.acted = true;
        summary.qgMarkedInactive = true;
        continue;
      }
      if (unit.alive !== false || unit.pos) summary.fieldUnitsRemoved += 1;
      unit.alive = false;
      unit.acted = true;
      unit.pos = null;
    }
  }

  summary.statusesRemoved = playerLifecycleRemoveOwnedStatuses(side);
  summary.hazards = playerLifecycleNeutralizeOwnedHazards(side);
  summary.effects = playerLifecycleClearPlayerEffects(side);

  for (const key of ["energyLocked","handLocked"]) if (state[key]) state[key][side] = 0;
  if (state.tacticUsedThisTurn) state.tacticUsedThisTurn[side] = false;
  if (state.tacticCooldowns) state.tacticCooldowns[side] = {};
  if (state.c2eBotHandTacticsUsedThisTurn) state.c2eBotHandTacticsUsedThisTurn[side] = 0;
  if (state.fabeotEconomyAbilityUsed) state.fabeotEconomyAbilityUsed[side] = false;
  if (state.fabeotConversionUsed) state.fabeotConversionUsed[side] = false;

  summary.interaction = playerLifecycleCancelInteraction(side);
  summary.mission = playerLifecycleReconcilePendingMission(side);

  if (state.missions && state.missions[side]) {
    state.missions[side].status = "eliminated";
    state.missions[side].ready = false;
    state.missions[side].rewardPending = false;
    state.missions[side].eliminatedAtTurn = state.turn;
  }

  if (typeof updateControlFromOccupants === "function") updateControlFromOccupants();
  else if (Array.isArray(state.cells)) state.cells.forEach(cell => { if (cell && cell.control === side) cell.control = null; });
  return summary;
}

function playerLifecycleMarkWinner(playerId) {
  const side = Number(playerId);
  for (const record of (state && Array.isArray(state.players) ? state.players : [])) {
    if (Number(record.id) === side) record.lifecycleStatus = PLAYER_LIFECYCLE_STATES.WINNER;
    else if (record.eliminated === true) record.lifecycleStatus = PLAYER_LIFECYCLE_STATES.ELIMINATED;
    else record.lifecycleStatus = PLAYER_LIFECYCLE_STATES.ACTIVE;
  }
}

function playerLifecycleSnapshot() {
  const ids = playerLifecycleIds();
  return Object.fromEntries(ids.map(side => {
    const record = playerLifecycleRecord(side) || {};
    return [side, {
      status:playerLifecycleStatus(side),
      eliminatedAtTurn:record.eliminatedAtTurn ?? null,
      eliminatedBy:record.eliminatedBy ?? null,
      eliminationAssistSides:Array.isArray(record.eliminationAssistSides) ? [...record.eliminationAssistSides] : [],
      eliminationAttributionType:record.eliminationAttributionType || null,
      eliminationReason:record.eliminationReason || null
    }];
  }));
}
