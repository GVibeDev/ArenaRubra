"use strict";

// Arena Rubra – F9N10 Mission Progress Tracker e ciclo di recupero.
// Tracker puro: osserva eventi strutturati e checkpoint di stato.
// Non rende giocabili le Missioni e non applica ricompense.

let missionTrackerProcessing = false;

function ensureMissionTelemetry() {
  if (!state) return null;
  if (!state.missionTelemetry) state.missionTelemetry = { byMission:{} };
  const t = state.missionTelemetry;
  const numericMaps = ["cyclesStarted","recoveriesWithMission","recoveriesWithoutMission","missionLocksApplied","missionUnlocks","missionsReady","missionsPlayed","secondOrLaterPlays","rewardsResolved","aiMissionPlays","aiMissionWaits","targetQuotasWasted"];
  for (const key of numericMaps) {
    if (!t[key]) t[key] = {1:0,2:0};
    for (const side of [1,2]) if (!Number.isFinite(t[key][side])) t[key][side] = 0;
  }
  if (!t.lastAiDecision) t.lastAiDecision = {1:null,2:null};
  if (!t.byMission || typeof t.byMission !== "object") t.byMission = {};
  return t;
}

function missionTelemetryRecord(side, key, amount=1, extra=null) {
  const t = ensureMissionTelemetry();
  if (!t || !t[key] || !Object.prototype.hasOwnProperty.call(t[key], side)) return false;
  t[key][side] = (Number(t[key][side]) || 0) + (Number(amount) || 0);
  const runtime = typeof missionRuntime === "function" ? missionRuntime(side) : null;
  const missionId = runtime && runtime.missionId;
  if (missionId) {
    if (!t.byMission[missionId]) t.byMission[missionId] = { cycles:0, ready:0, played:0, rewards:0, aiPlays:0, recovered:0, wastedTargets:0 };
    const map = { cyclesStarted:"cycles", missionsReady:"ready", missionsPlayed:"played", rewardsResolved:"rewards", aiMissionPlays:"aiPlays", recoveriesWithMission:"recovered", targetQuotasWasted:"wastedTargets" };
    const targetKey = map[key];
    if (targetKey) t.byMission[missionId][targetKey] = (Number(t.byMission[missionId][targetKey]) || 0) + (Number(amount) || 0);
  }
  if (extra && key === "aiMissionPlays") t.lastAiDecision[side] = { ...(t.lastAiDecision[side] || {}), ...extra, decision:"play" };
  return true;
}

function missionSupportedMetrics() {
  return new Set([
    "controlled_ps","structures_built_near_objective","energy_and_hand","controls_central_ps","tagged_effects_used","pivot_in_play",
    "enemy_controls_central_ps","enemy_pressure","enemy_pivot_and_commander_in_play","vehicles_in_play","enemy_units_destroyed",
    "infantry_vehicle_ratio","enemy_structures_destroyed","enemy_units_destroyed_in_owner_turn","own_heavy_vehicles_destroyed_by_enemy",
    "enemy_controlled_ps","own_commander_destroyed","units_deployed","numerical_superiority_unique_targets","ordinary_cards_in_hand",
    "bleed_damage_dealt","units_deployed_by_tactics","unit_distance_from_enemy_hq","own_units_destroyed_by_enemy","enemy_has_more_units",
    "own_commander_or_pivot_destroyed","units_deployed_min_cost","deck_cards_remaining","adjacent_structure_cluster","thorns_damage_dealt",
    "round_and_energy","own_structures_destroyed_by_enemy","vehicles_in_play_near_ps","marks_applied","energy_gained_from_doctrine",
    "enemy_faction_units_controlled","enemy_energy_manipulations","enemy_energy_greater_than_owner"
  ]);
}

function missionDefinitionById(id) {
  if (!id || typeof MISSION_DEFINITIONS === "undefined") return null;
  return MISSION_DEFINITIONS.find(def => def && def.id === id) || null;
}

function missionCardForSide(side) {
  if (!state) return null;
  const zones = [state.hand && state.hand[side], state.deck && state.deck[side], state.discard && state.discard[side]];
  for (const zone of zones) {
    const card = (zone || []).find(c => c && (c.sourceType === "mission" || c.cardType === "mission" || c.deckRole === "mission"));
    if (card) return card;
  }
  return null;
}

function missionEntryState(item) {
  return {
    id:item.id,
    metric:item.metric,
    text:item.text || item.metric,
    current:0,
    target:Number.isFinite(item.value) ? item.value : (Number.isFinite(item.consecutive) ? item.consecutive : 1),
    streak:0,
    satisfied:false,
    completed:false,
    detail:"Non valutato",
    lastUpdatedAt:null
  };
}

function createMissionRuntime(side, definition=null) {
  const entries = {};
  for (const item of definition ? missionObjectivesFor(definition) : []) entries[item.id] = missionEntryState(item);
  return {
    side,
    active:Boolean(definition),
    missionId:definition ? definition.id : null,
    missionName:definition ? definition.name : null,
    missionClass:definition ? definition.missionClass : null,
    cycle:definition ? 1 : 0,
    status:definition ? "tracking" : "absent",
    ready:false,
    readyCount:0,
    played:false,
    playedAt:null,
    playedRound:null,
    rewardPending:false,
    rewardResolved:false,
    rewardResolvedAt:null,
    rewardResult:null,
    recoveryLocked:false,
    recoveryLockedAt:null,
    unlockAtOwnerTurnStarted:null,
    unlockedAt:null,
    revealed:false,
    revealedAt:null,
    revealedBy:null,
    entries,
    counters:{
      structuresBuiltNearObjective:0,
      taggedEffectsUsed:{ ps_related:0, defensive_ability:0 },
      enemyUnitsDestroyed:0,
      enemyStructuresDestroyed:0,
      enemyUnitsDestroyedCurrentOwnerTurn:0,
      ownHeavyVehiclesDestroyedByEnemy:0,
      unitsDeployed:0,
      unitsDeployedByTactics:0,
      unitsDeployedMinCost:0,
      bleedDamageDealt:0,
      thornsDamageDealt:0,
      ownUnitsDestroyedByEnemy:0,
      ownStructuresDestroyedByEnemy:0,
      ownCommanderDestroyed:false,
      ownPivotDestroyed:false,
      marksApplied:0,
      energyGainedFromDoctrine:0,
      enemyEnergyManipulations:0,
      enemyFactionUnitsControlled:0,
      cardsDrawn:0,
      cardsPlayed:0,
      abilitiesUsed:0,
      tacticsUsed:0
    },
    unique:{ numericalSuperiorityTargets:[] },
    diagnostics:{
      lastEvent:null,
      lastCheckpoint:null,
      evaluations:0,
      progressChanges:0,
      warnings:[]
    },
    createdAt:new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };
}

function initializeMissionTrackerForGame() {
  if (!state) return null;
  state.missions = state.missions || { 1:null, 2:null };
  for (const side of [1,2]) {
    const card = missionCardForSide(side);
    const id = card && (card.missionId || card.sourceId || String(card.id || "").replace(/^MISSION:/, ""));
    const definition = missionDefinitionById(id);
    state.missions[side] = createMissionRuntime(side, definition);
    if (definition) missionTelemetryRecord(side, "cyclesStarted", 1);
  }
  missionEvaluateAll("game_initialized", { checkpoint:"initial" });
  return state.missions;
}

function missionRuntime(side) {
  return state && state.missions ? state.missions[side] || null : null;
}

function missionEnemy(side) { return side === 1 ? 2 : 1; }
function missionUnits(side) { return typeof combatUnits === "function" ? combatUnits(side).filter(u => u && u.type !== "QG") : []; }
function missionCentralCell() { return state && state.cells ? state.cells.find(c => c.ps && sameCoord(c.coord, CENTER_PS_COORD)) || null : null; }
function missionControlledPs(side) { return typeof countControlledPS === "function" ? countControlledPS(side) : 0; }
function missionCommanderInPlay(side) { return missionUnits(side).some(u => u.type === "Comandante" || u.role === "commander"); }
function missionPivotInPlay(side) { return missionUnits(side).some(u => u.weight === "Pivot" || u.deckRole === "pivot"); }
function missionOrdinaryCardsInHand(side) {
  return state && state.hand && state.hand[side]
    ? state.hand[side].filter(card => card && !(typeof isProtectedHandCard === "function" && isProtectedHandCard(card))).length
    : 0;
}

function missionCompare(actual, operator, expected) {
  if (operator === "eq") return actual === expected;
  if (operator === "gt") return actual > expected;
  if (operator === "lt") return actual < expected;
  if (operator === "lte") return actual <= expected;
  if (operator === "neq") return actual !== expected;
  return actual >= expected;
}

function missionLargestAdjacentStructureCluster(side) {
  const structures = missionUnits(side).filter(u => u.type === "Struttura" && Array.isArray(u.pos));
  let best = 0;
  const visited = new Set();
  for (const root of structures) {
    if (visited.has(root.uid)) continue;
    let count = 0;
    const queue = [root];
    visited.add(root.uid);
    while (queue.length) {
      const current = queue.shift();
      count += 1;
      for (const other of structures) {
        if (!visited.has(other.uid) && areAdjacent(current.pos, other.pos)) {
          visited.add(other.uid);
          queue.push(other);
        }
      }
    }
    best = Math.max(best, count);
  }
  return best;
}

function missionVehiclesNearPs(side, range=3) {
  const ps = (state && state.cells || []).filter(c => c.ps).map(c => c.coord);
  return missionUnits(side).filter(u => u.type === "Veicolo" && Array.isArray(u.pos) && ps.some(coord => hexDistance(u.pos, coord) <= range)).length;
}

function missionUnitNearEnemyHq(side, range=5) {
  const hq = typeof getHq === "function" ? getHq(missionEnemy(side)) : null;
  return Boolean(hq && missionUnits(side).some(u => Array.isArray(u.pos) && hexDistance(u.pos, hq.pos) <= range));
}

function missionStructureNearObjective(coord, side) {
  if (!Array.isArray(coord) || !state) return false;
  const hqs = [getHq(side), getHq(missionEnemy(side))].filter(Boolean).map(h => h.pos);
  const objectives = [...(state.cells || []).filter(c => c.ps).map(c => c.coord), ...hqs];
  return objectives.some(target => hexDistance(coord, target) <= 1);
}

function missionEffectTagsFromAbility(ab) {
  const tags = new Set();
  if (!ab) return [];
  const kind = String(ab.kind || "");
  const statusKind = String(ab.statusKind || "");
  if (kind === "psLock" || /ps|presidio|punto strategico/i.test(`${ab.name || ""} ${ab.description || ""}`)) tags.add("ps_related");
  if (["armor","buffDef","adjacentDefBuff","armorThorns","agathoiShroud","abilityUntargetable"].includes(kind)
      || ["untargetable","phase_shield"].includes(statusKind)
      || /\bdef\b|non bersagliabile|scudo/i.test(`${ab.name || ""} ${ab.description || ""}`)) tags.add("defensive_ability");
  if (["incomeSwing","incomeDelta","customGainEnergy"].includes(kind) && ab.affects === "enemy") tags.add("enemy_energy_manipulation");
  return [...tags];
}

function missionEffectTagsFromTactic(card) {
  const tags = new Set();
  if (!card) return [];
  const kind = String(card.effectKind || card.kind || "");
  if (["energy_gain_by_ps","ps_lock","healArmorOnPS","damageNearPS"].includes(kind) || /\bps\b|punto strategico/i.test(`${card.condition || ""} ${card.effectText || ""}`)) tags.add("ps_related");
  if (["usury_energy_income_debuff","enemy_energy_loss","income_debuff"].includes(kind)) tags.add("enemy_energy_manipulation");
  return [...tags];
}

function missionResolveMetric(side, item, runtime) {
  const enemy = missionEnemy(side);
  const counters = runtime.counters;
  let current = 0;
  let target = Number.isFinite(item.value) ? item.value : 1;
  let satisfied = false;
  let detail = "";

  switch (item.metric) {
    case "controlled_ps": current = missionControlledPs(side); break;
    case "structures_built_near_objective": current = counters.structuresBuiltNearObjective; break;
    case "energy_and_hand": {
      const ene = state.energy[side] || 0;
      const hand = state.hand && state.hand[side] ? state.hand[side].length : 0;
      satisfied = missionCompare(ene, item.energy.operator, item.energy.value) && missionCompare(hand, item.hand.operator, item.hand.value);
      current = `${ene} ENE / ${hand} carte`; target = `${item.energy.value} ENE / ${item.hand.value} carte`;
      detail = `${current}`;
      return {current,target,satisfied,detail};
    }
    case "controls_central_ps": current = Boolean(missionCentralCell() && missionCentralCell().control === side); target = true; break;
    case "tagged_effects_used": current = counters.taggedEffectsUsed[item.tag] || 0; break;
    case "pivot_in_play": current = missionPivotInPlay(side); target = true; break;
    case "enemy_controls_central_ps": current = Boolean(missionCentralCell() && missionCentralCell().control === enemy); target = true; break;
    case "enemy_pressure": current = state.pressure[enemy] || 0; break;
    case "enemy_pivot_and_commander_in_play": {
      const pivot = missionPivotInPlay(enemy), commander = missionCommanderInPlay(enemy);
      current = `${pivot ? 1 : 0}/${commander ? 1 : 0}`; target = "Pivot+Comandante"; satisfied = pivot && commander;
      return {current,target,satisfied,detail:`Pivot ${pivot ? "sì" : "no"}, Comandante ${commander ? "sì" : "no"}`};
    }
    case "vehicles_in_play": current = missionUnits(side).filter(u => u.type === "Veicolo").length; break;
    case "enemy_units_destroyed": current = counters.enemyUnitsDestroyed; break;
    case "infantry_vehicle_ratio": {
      const infantry = missionUnits(side).filter(u => u.type === "Fanteria" || u.type === "Comandante").length;
      const vehicles = missionUnits(side).filter(u => u.type === "Veicolo").length;
      satisfied = (!item.requireNonZero || infantry + vehicles > 0) && infantry === vehicles;
      current = `${infantry}:${vehicles}`; target = "1:1";
      return {current,target,satisfied,detail:`Fanterie ${infantry}, veicoli ${vehicles}`};
    }
    case "enemy_structures_destroyed": current = counters.enemyStructuresDestroyed; break;
    case "enemy_units_destroyed_in_owner_turn": current = counters.enemyUnitsDestroyedCurrentOwnerTurn; break;
    case "own_heavy_vehicles_destroyed_by_enemy": current = counters.ownHeavyVehiclesDestroyedByEnemy; break;
    case "enemy_controlled_ps": current = missionControlledPs(enemy); break;
    case "own_commander_destroyed": current = counters.ownCommanderDestroyed; target = true; break;
    case "units_deployed": current = counters.unitsDeployed; break;
    case "numerical_superiority_unique_targets": current = runtime.unique.numericalSuperiorityTargets.length; break;
    case "ordinary_cards_in_hand": current = missionOrdinaryCardsInHand(side); break;
    case "bleed_damage_dealt": current = counters.bleedDamageDealt; break;
    case "units_deployed_by_tactics": current = counters.unitsDeployedByTactics; break;
    case "unit_distance_from_enemy_hq": current = missionUnitNearEnemyHq(side, item.value || 5); target = true; break;
    case "own_units_destroyed_by_enemy": current = counters.ownUnitsDestroyedByEnemy; break;
    case "enemy_has_more_units": current = missionUnits(enemy).length > missionUnits(side).length; target = true; break;
    case "own_commander_or_pivot_destroyed": current = counters.ownCommanderDestroyed || counters.ownPivotDestroyed; target = true; break;
    case "units_deployed_min_cost": current = counters.unitsDeployedMinCost; break;
    case "deck_cards_remaining": current = state.deck && state.deck[side] ? state.deck[side].length : 0; break;
    case "adjacent_structure_cluster": current = missionLargestAdjacentStructureCluster(side); break;
    case "thorns_damage_dealt": current = counters.thornsDamageDealt; break;
    case "round_and_energy": {
      const round = state.turn || 1, ene = state.energy[side] || 0;
      satisfied = missionCompare(round, item.round.operator, item.round.value) && missionCompare(ene, item.energy.operator, item.energy.value);
      current = `R${round} / ${ene} ENE`; target = `R${item.round.value}+ / ${item.energy.value} ENE`;
      return {current,target,satisfied,detail:current};
    }
    case "own_structures_destroyed_by_enemy": current = counters.ownStructuresDestroyedByEnemy; break;
    case "vehicles_in_play_near_ps": current = missionVehiclesNearPs(side, item.range || 3); break;
    case "marks_applied": current = counters.marksApplied; break;
    case "energy_gained_from_doctrine": current = counters.energyGainedFromDoctrine; break;
    case "enemy_faction_units_controlled": current = counters.enemyFactionUnitsControlled; break;
    case "enemy_energy_manipulations": current = counters.enemyEnergyManipulations; break;
    case "enemy_energy_greater_than_owner": current = (state.energy[enemy] || 0) > (state.energy[side] || 0); target = true; break;
    default:
      return {current:0,target, satisfied:false, detail:`Metrica non supportata: ${item.metric}`, warning:true};
  }

  satisfied = missionCompare(current, item.operator || "gte", target);
  detail = `${current} / ${target}`;
  return {current,target,satisfied,detail};
}

function missionCheckpointMatches(item, checkpoint, checkpointSide, ownerSide) {
  const mode = item.durationMode;
  if (!item.consecutive) return true;
  if (mode === "rounds") return checkpoint === "round_end";
  if (mode === "owner_turns") return checkpoint === "turn_start" && checkpointSide === ownerSide;
  if (mode === "enemy_turns") return checkpoint === "turn_start" && checkpointSide === missionEnemy(ownerSide);
  return checkpoint === "turn_start" && checkpointSide === ownerSide;
}

function missionEmitProgress(side, runtime, item, entry, previous) {
  if (typeof emitGameEvent !== "function") return;
  runtime.diagnostics.progressChanges += 1;
  emitGameEvent({
    type:EventTypes.MISSION_PROGRESS_CHANGED,
    data:{
      player:side,
      faction:state.factions[side],
      missionId:runtime.missionId,
      missionName:runtime.missionName,
      objectiveId:item.id,
      metric:item.metric,
      current:entry.current,
      target:entry.target,
      streak:entry.streak,
      satisfied:entry.satisfied,
      completed:entry.completed,
      previous
    }
  });
}

function missionEvaluateSide(side, reason="manual", context={}) {
  const runtime = missionRuntime(side);
  if (!runtime || !runtime.active || runtime.played) return runtime;
  const definition = missionDefinitionById(runtime.missionId);
  if (!definition) return runtime;
  const items = missionObjectivesFor(definition);
  let satisfiedCount = 0;

  for (const item of items) {
    const entry = runtime.entries[item.id] || (runtime.entries[item.id] = missionEntryState(item));
    const previous = JSON.stringify({current:entry.current,streak:entry.streak,satisfied:entry.satisfied,completed:entry.completed});
    const result = missionResolveMetric(side, item, runtime);
    entry.current = result.current;
    entry.target = result.target;
    entry.detail = result.detail;
    entry.satisfied = Boolean(result.satisfied);

    if (item.consecutive && missionCheckpointMatches(item, context.checkpoint, context.side, side)) {
      entry.streak = entry.satisfied ? entry.streak + 1 : 0;
      entry.completed = entry.completed || entry.streak >= item.consecutive;
      entry.detail = `${entry.detail} · serie ${entry.streak}/${item.consecutive}`;
    } else if (!item.consecutive) {
      if (item.cumulative || definition.missionClass === "ordinary") entry.completed = entry.completed || entry.satisfied;
      else entry.completed = entry.satisfied;
    }

    if (result.warning && !runtime.diagnostics.warnings.includes(result.detail)) runtime.diagnostics.warnings.push(result.detail);
    if (entry.completed || entry.satisfied) satisfiedCount += 1;
    entry.lastUpdatedAt = new Date().toISOString();
    const after = JSON.stringify({current:entry.current,streak:entry.streak,satisfied:entry.satisfied,completed:entry.completed});
    if (previous !== after) missionEmitProgress(side, runtime, item, entry, JSON.parse(previous));
  }

  const previousReady = runtime.ready;
  runtime.readyCount = satisfiedCount;
  runtime.ready = definition.missionClass === "desperate" ? satisfiedCount >= 1 : items.every(item => runtime.entries[item.id] && runtime.entries[item.id].completed);
  runtime.status = runtime.recoveryLocked ? "blocked" : (runtime.ready ? "ready" : "tracking");
  runtime.updatedAt = new Date().toISOString();
  runtime.diagnostics.evaluations += 1;
  runtime.diagnostics.lastCheckpoint = { reason, ...context, at:runtime.updatedAt };

  if (!previousReady && runtime.ready) {
    missionTelemetryRecord(side, "missionsReady", 1);
    if (typeof emitGameEvent === "function") emitGameEvent({ type:EventTypes.MISSION_READY, data:{ player:side, faction:state.factions[side], missionId:runtime.missionId, missionName:runtime.missionName, missionClass:runtime.missionClass, readyCount:satisfiedCount, cycle:runtime.cycle } });
  }
  return runtime;
}

function missionEvaluateAll(reason="manual", context={}) {
  if (!state || !state.missions) return null;
  for (const side of [1,2]) missionEvaluateSide(side, reason, context);
  return state.missions;
}

function missionIsRecoveryLocked(side) {
  const runtime = missionRuntime(side);
  if (!runtime || !runtime.active || !runtime.recoveryLocked) return false;
  const currentOwnerTurns = state && state.turnsStarted ? Number(state.turnsStarted[side] || 0) : 0;
  return !Number.isFinite(runtime.unlockAtOwnerTurnStarted) || currentOwnerTurns < runtime.unlockAtOwnerTurnStarted;
}

function missionLockUntilNextOwnerTurn(side, options={}) {
  const runtime = missionRuntime(side);
  if (!runtime || !runtime.active) return runtime;
  const currentOwnerTurns = state && state.turnsStarted ? Number(state.turnsStarted[side] || 0) : 0;
  runtime.recoveryLocked = true;
  runtime.recoveryLockedAt = new Date().toISOString();
  runtime.unlockAtOwnerTurnStarted = currentOwnerTurns + 1;
  runtime.unlockedAt = null;
  runtime.status = "blocked";
  missionTelemetryRecord(side, "missionLocksApplied", 1);
  if (typeof emitGameEvent === "function" && EventTypes.MISSION_RECOVERY_LOCKED) emitGameEvent({
    type:EventTypes.MISSION_RECOVERY_LOCKED,
    data:{ player:side, faction:state.factions && state.factions[side], missionId:runtime.missionId, missionName:runtime.missionName, cycle:runtime.cycle, unlockAtOwnerTurnStarted:runtime.unlockAtOwnerTurnStarted, source:options.source || "deck_recovery" }
  });
  return runtime;
}

function missionUnlockAtOwnerTurnStart(side) {
  const runtime = missionRuntime(side);
  if (!runtime || !runtime.active || !runtime.recoveryLocked) return false;
  const currentOwnerTurns = state && state.turnsStarted ? Number(state.turnsStarted[side] || 0) : 0;
  if (currentOwnerTurns < Number(runtime.unlockAtOwnerTurnStarted || Infinity)) return false;
  runtime.recoveryLocked = false;
  runtime.unlockedAt = new Date().toISOString();
  runtime.status = runtime.ready ? "ready" : "tracking";
  missionTelemetryRecord(side, "missionUnlocks", 1);
  if (typeof emitGameEvent === "function" && EventTypes.MISSION_UNLOCKED) emitGameEvent({
    type:EventTypes.MISSION_UNLOCKED,
    data:{ player:side, faction:state.factions && state.factions[side], missionId:runtime.missionId, missionName:runtime.missionName, cycle:runtime.cycle, ownerTurnsStarted:currentOwnerTurns }
  });
  if (typeof log === "function") log(`La Missione “${runtime.missionName}” è nuovamente utilizzabile per ${playerName(side)}.`);
  return true;
}

function missionCheckpointTurnStart(side) {
  missionUnlockAtOwnerTurnStart(side);
  const runtime = missionRuntime(side);
  if (runtime && runtime.active) runtime.counters.enemyUnitsDestroyedCurrentOwnerTurn = 0;
  missionEvaluateAll("turn_start", { checkpoint:"turn_start", side, round:state.turn });
  if (typeof emitGameEvent === "function") emitGameEvent({ type:EventTypes.MISSION_CHECKPOINT, data:{ checkpoint:"turn_start", player:side, round:state.turn } });
}

function missionCheckpointRoundEnd(round=state && state.turn) {
  missionEvaluateAll("round_end", { checkpoint:"round_end", side:null, round });
  if (typeof emitGameEvent === "function") emitGameEvent({ type:EventTypes.MISSION_CHECKPOINT, data:{ checkpoint:"round_end", round } });
}

function missionResetCycle(side, options={}) {
  const old = missionRuntime(side);
  if (!old || !old.active) return old;
  const def = missionDefinitionById(old.missionId);
  const next = createMissionRuntime(side, def);
  next.cycle = options.increment === false ? old.cycle : old.cycle + 1;
  state.missions[side] = next;
  missionTelemetryRecord(side, "cyclesStarted", 1);
  missionEvaluateSide(side, "cycle_reset", { checkpoint:"cycle_reset", side, round:state.turn });
  if (options.lockUntilNextOwnerTurn === true) missionLockUntilNextOwnerTurn(side, { source:options.source || "deck_recovery" });
  if (typeof emitGameEvent === "function" && EventTypes.MISSION_CYCLE_RESET) emitGameEvent({
    type:EventTypes.MISSION_CYCLE_RESET,
    data:{ player:side, faction:state.factions && state.factions[side], missionId:next.missionId, missionName:next.missionName, previousCycle:old.cycle, cycle:next.cycle, locked:Boolean(next.recoveryLocked), source:options.source || "deck_recovery" }
  });
  return next;
}

function missionEventActor(event) {
  const d = event && event.data || {};
  return Number(d.player || d.attackerSide || d.sourceSide || d.owner || d.caster || 0) || null;
}

function missionTrackerHandleEvent(event) {
  if (!state || !state.missions || !event || missionTrackerProcessing) return;
  if ([EventTypes.MISSION_PROGRESS_CHANGED, EventTypes.MISSION_READY, EventTypes.MISSION_CHECKPOINT].includes(event.type)) return;
  missionTrackerProcessing = true;
  try {
    const d = event.data || {};
    const actor = missionEventActor(event);

    for (const side of [1,2]) {
      const runtime = missionRuntime(side);
      if (!runtime || !runtime.active || runtime.played) continue;
      const enemy = missionEnemy(side);
      const c = runtime.counters;

      if (event.type === EventTypes.UNIT_SPAWNED && Number(d.player) === side) {
        c.unitsDeployed += 1;
        const bp = typeof BLUEPRINTS !== "undefined" ? BLUEPRINTS.find(x => x.id === d.blueprintId) : null;
        const cost = Number.isFinite(d.cost) ? d.cost : (bp && bp.cost);
        if (Number.isFinite(cost) && cost >= 3) c.unitsDeployedMinCost += 1;
        if (d.source === "C2c-5c-tactic-spawn" || d.spawnSource === "tactic") c.unitsDeployedByTactics += 1;
      }

      if (event.type === EventTypes.UNIT_BUILT && Number(d.player) === side && missionStructureNearObjective(d.coord, side)) c.structuresBuiltNearObjective += 1;

      if (event.type === EventTypes.UNIT_ATTACKED && Number(d.attackerSide) === side && Number(d.superiorityBonus || 0) > 0 && d.defenderId) {
        if (!runtime.unique.numericalSuperiorityTargets.includes(d.defenderId)) runtime.unique.numericalSuperiorityTargets.push(d.defenderId);
      }

      if (event.type === EventTypes.UNIT_DAMAGED && Number(d.sourceSide) === side) {
        if (d.damageKind === "bleed" || /sanguinamento/i.test(String(d.source || ""))) c.bleedDamageDealt += Number(d.hpLoss || 0);
        if (d.damageKind === "thorns" || /spine/i.test(String(d.source || ""))) c.thornsDamageDealt += Number(d.hpLoss || 0);
      }

      if (event.type === EventTypes.UNIT_DESTROYED && Number(d.side) === enemy && Number(d.destroyedBySide || actor) === side) {
        c.enemyUnitsDestroyed += 1;
        c.enemyUnitsDestroyedCurrentOwnerTurn += 1;
        if (d.unitType === "Struttura") c.enemyStructuresDestroyed += 1;
      }
      if (event.type === EventTypes.UNIT_DESTROYED && Number(d.side) === side && Number(d.destroyedBySide || actor) === enemy) {
        c.ownUnitsDestroyedByEnemy += 1;
        if (d.unitType === "Struttura") c.ownStructuresDestroyedByEnemy += 1;
        if (d.unitType === "Veicolo" && String(d.unitWeight || "").toLowerCase().startsWith("pesant")) c.ownHeavyVehiclesDestroyedByEnemy += 1;
        if (d.unitType === "Comandante" || d.unitRole === "commander") c.ownCommanderDestroyed = true;
        if (d.unitWeight === "Pivot" || d.unitRole === "pivot") c.ownPivotDestroyed = true;
      }

      if (event.type === EventTypes.ABILITY_USED && Number(d.player) === side) {
        c.abilitiesUsed += 1;
        for (const tag of d.missionTags || []) {
          if (tag === "ps_related" || tag === "defensive_ability") c.taggedEffectsUsed[tag] = (c.taggedEffectsUsed[tag] || 0) + 1;
          if (tag === "enemy_energy_manipulation") c.enemyEnergyManipulations += 1;
        }
      }

      if (event.type === EventTypes.TACTIC_USED && Number(d.player) === side) {
        c.tacticsUsed += 1;
        for (const tag of d.missionTags || []) {
          if (tag === "ps_related") c.taggedEffectsUsed.ps_related += 1;
          if (tag === "enemy_energy_manipulation") c.enemyEnergyManipulations += 1;
        }
      }

      if (event.type === EventTypes.STATUS_APPLIED && Number(d.owner || actor) === side) {
        const marks = new Set(["raid_mark","logistic_choke","fabeot_vulnerable","fabeot_bounty","fabeot_sicario_contract","fabeot_copy_bounty"]);
        if (marks.has(d.statusKind)) c.marksApplied += 1;
      }

      if (event.type === EventTypes.ECONOMY_CHANGED && Number(d.player) === side && Number(d.doctrineDelta || 0) > 0 && state.factions[side] === "Fabeot") c.energyGainedFromDoctrine += Number(d.doctrineDelta || 0);
      if (event.type === EventTypes.UNIT_CONVERTED && Number(d.newSide) === side && Number(d.oldSide) === enemy) c.enemyFactionUnitsControlled += 1;
      if (event.type === EventTypes.CARD_DRAWN && Number(d.player) === side) c.cardsDrawn += Number(d.count || 1);
      if (event.type === EventTypes.CARD_PLAYED && Number(d.player) === side) c.cardsPlayed += 1;

      runtime.diagnostics.lastEvent = { type:event.type, seq:event.seq || null, data:{...d}, at:event.at || new Date().toISOString() };
    }

    missionEvaluateAll(`event:${event.type}`, { checkpoint:"event", side:actor, round:state.turn, eventType:event.type });
  } finally {
    missionTrackerProcessing = false;
  }
}

function missionDiagnosticsForSide(side) {
  const runtime = missionRuntime(side);
  if (!runtime) return null;
  const def = missionDefinitionById(runtime.missionId);
  return {
    side,
    faction:state && state.factions && state.factions[side],
    active:runtime.active,
    missionId:runtime.missionId,
    missionName:runtime.missionName,
    missionClass:runtime.missionClass,
    cycle:runtime.cycle,
    status:runtime.status,
    ready:runtime.ready,
    readyCount:runtime.readyCount,
    played:Boolean(runtime.played),
    rewardPending:Boolean(runtime.rewardPending),
    rewardResolved:Boolean(runtime.rewardResolved),
    rewardResult:runtime.rewardResult ? JSON.parse(JSON.stringify(runtime.rewardResult)) : null,
    recoveryLocked:Boolean(runtime.recoveryLocked),
    unlockAtOwnerTurnStarted:runtime.unlockAtOwnerTurnStarted,
    unlockedAt:runtime.unlockedAt,
    counters:JSON.parse(JSON.stringify(runtime.counters)),
    unique:JSON.parse(JSON.stringify(runtime.unique)),
    objectives:(def ? missionObjectivesFor(def) : []).map(item => ({ definition:{...item}, progress:{...(runtime.entries[item.id] || {})} })),
    diagnostics:JSON.parse(JSON.stringify(runtime.diagnostics))
  };
}

function missionDiagnosticsSummary() {
  return {
    build:typeof BUILD_INFO !== "undefined" ? BUILD_INFO.version : "unknown",
    round:state ? state.turn : null,
    currentPlayer:state ? state.currentPlayer : null,
    sides:{ 1:missionDiagnosticsForSide(1), 2:missionDiagnosticsForSide(2) },
    rewards:typeof missionRewardDiagnostics === "function" ? missionRewardDiagnostics() : null,
    telemetry:state && state.missionTelemetry ? JSON.parse(JSON.stringify(state.missionTelemetry)) : null
  };
}

function exportMissionDiagnosticsJson() { return JSON.stringify(missionDiagnosticsSummary(), null, 2); }

function copyMissionDiagnosticsJson() {
  const text = exportMissionDiagnosticsJson();
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(() => text);
  return text;
}
