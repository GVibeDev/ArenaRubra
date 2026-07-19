"use strict";

// Arena Rubra – F9N10 Mission AI.
// L'IA gioca le Missioni pronte e orienta le decisioni ordinarie verso
// gli obiettivi ancora incompleti. Non altera soglie o progressi del tracker.

function botMissionContext(side) {
  if (!state || !state.modes || state.modes[side] !== "bot") return null;
  if (typeof missionRuntime !== "function" || typeof missionDefinitionById !== "function") return null;
  const runtime = missionRuntime(side);
  if (!runtime || !runtime.active || runtime.played) return null;
  const definition = missionDefinitionById(runtime.missionId);
  if (!definition) return null;
  const items = typeof missionObjectivesFor === "function" ? missionObjectivesFor(definition) : (definition.objectives || definition.conditions || []);
  const incomplete = items.filter(item => {
    const entry = runtime.entries && runtime.entries[item.id];
    return !(entry && entry.completed);
  });
  return { side, runtime, definition, items, incomplete };
}

function botMissionIncompleteMetrics(side) {
  const context = botMissionContext(side);
  return context ? new Set(context.incomplete.map(item => item.metric)) : new Set();
}

function botMissionPendingItems(side, metric) {
  const context = botMissionContext(side);
  if (!context || context.definition.missionClass !== "ordinary") return [];
  return context.incomplete.filter(item => item.metric === metric);
}

function botMissionHasPendingMetric(side, metric) {
  return botMissionPendingItems(side, metric).length > 0;
}

function botMissionTagPending(side, tag) {
  return botMissionPendingItems(side, "tagged_effects_used").some(item => item.tag === tag);
}

function botMissionPurchaseBonus(side, bp) {
  const context = botMissionContext(side);
  if (!context || context.definition.missionClass !== "ordinary" || !bp) return 0;
  const metrics = botMissionIncompleteMetrics(side);
  let score = 0;
  const cost = Number(bp.cost) || 0;
  const weight = String(bp.weight || "").toLowerCase();
  const ownUnits = typeof combatUnits === "function" ? combatUnits(side) : [];

  if (metrics.has("units_deployed")) score += 4;
  if (metrics.has("units_deployed_min_cost")) score += cost >= 3 ? 12 : -2;
  if (metrics.has("vehicles_in_play") && bp.type === "Veicolo") score += 10;
  if (metrics.has("vehicles_in_play_near_ps") && bp.type === "Veicolo") score += 9;
  if (metrics.has("pivot_in_play") && (weight === "pivot" || bp.deckRole === "pivot")) {
    const hasPivot = ownUnits.some(unit => String(unit.weight || "").toLowerCase() === "pivot" || unit.deckRole === "pivot");
    if (!hasPivot) score += 18;
  }
  if ((metrics.has("adjacent_structure_cluster") || metrics.has("structures_built_near_objective")) && bp.type === "Struttura") score += 12;
  if (metrics.has("enemy_structures_destroyed") && (bp.antiStructureAtt || weight.startsWith("pesant") || (Number(bp.att) || 0) >= 3)) score += 6;

  if (metrics.has("infantry_vehicle_ratio")) {
    const infantry = ownUnits.filter(unit => unit.type === "Fanteria").length;
    const vehicles = ownUnits.filter(unit => unit.type === "Veicolo").length;
    if (bp.type === "Fanteria" && infantry < vehicles) score += 10;
    else if (bp.type === "Veicolo" && vehicles < infantry) score += 10;
    else if (["Fanteria", "Veicolo"].includes(bp.type)) score += 2;
  }

  const abilityTags = typeof missionEffectTagsFromAbility === "function" ? missionEffectTagsFromAbility(bp.ability) : [];
  if (botMissionTagPending(side, "ps_related") && abilityTags.includes("ps_related")) score += 11;
  if (botMissionTagPending(side, "defensive_ability") && abilityTags.includes("defensive_ability")) score += 11;

  if (metrics.has("marks_applied") && bp.ability && ["vulnerableMark", "bountyMark"].includes(bp.ability.kind)) score += 13;
  if (metrics.has("enemy_faction_units_controlled") && bp.ability && ["convertEnemy", "corruptLightInfantry"].includes(bp.ability.kind)) score += 14;
  if (metrics.has("enemy_energy_manipulations") && bp.ability && ["incomeDelta", "incomeSwing", "costDelta"].includes(bp.ability.kind)) score += 10;
  return score;
}

function botMissionMoveBonus(unit, coord) {
  if (!unit || !coord) return 0;
  const side = unit.side;
  const context = botMissionContext(side);
  if (!context || context.definition.missionClass !== "ordinary") return 0;
  const metrics = botMissionIncompleteMetrics(side);
  let score = 0;
  const cell = typeof getCellAt === "function" ? getCellAt(coord) : null;
  const psCells = state && state.cells ? state.cells.filter(c => c.ps) : [];

  if (metrics.has("controlled_ps") || metrics.has("controls_central_ps")) {
    if (cell && cell.ps && cell.control !== side) score += 18;
    if (metrics.has("controls_central_ps") && Array.isArray(coord) && coord[0] === 0 && coord[1] === 0 && coord[2] === 0) score += 22;
    if (psCells.length && typeof minDistance === "function") score += Math.max(0, 7 - minDistance(coord, psCells.map(c => c.coord))) * 1.4;
  }
  if (metrics.has("vehicles_in_play_near_ps") && unit.type === "Veicolo" && psCells.length && typeof minDistance === "function") {
    score += Math.max(0, 6 - minDistance(coord, psCells.map(c => c.coord))) * 2;
  }
  if (metrics.has("unit_distance_from_enemy_hq") && typeof getHq === "function" && typeof hexDistance === "function") {
    const enemyHq = getHq(typeof enemyOf === "function" ? enemyOf(side) : (side === 1 ? 2 : 1));
    if (enemyHq) score += Math.max(0, 10 - hexDistance(coord, enemyHq.pos)) * 1.8;
  }
  return score;
}

function botMissionAttackBonus(attacker, defender) {
  if (!attacker || !defender) return 0;
  const context = botMissionContext(attacker.side);
  if (!context || context.definition.missionClass !== "ordinary") return 0;
  const metrics = botMissionIncompleteMetrics(attacker.side);
  let score = 0;
  if (metrics.has("enemy_units_destroyed") || metrics.has("enemy_units_destroyed_in_owner_turn")) score += 3;
  if (metrics.has("enemy_structures_destroyed") && defender.type === "Struttura") score += 18;
  if (metrics.has("numerical_superiority_unique_targets") && typeof numericalSuperiorityBonus === "function" && numericalSuperiorityBonus(attacker, defender)) score += 9;
  if (metrics.has("bleed_damage_dealt") && typeof hasStatus === "function" && hasStatus(defender, "bleed")) score += 4;
  return score;
}

function botMissionAbilityBonus(unit, target, ab) {
  if (!unit || !ab) return 0;
  const context = botMissionContext(unit.side);
  if (!context || context.definition.missionClass !== "ordinary") return 0;
  const metrics = botMissionIncompleteMetrics(unit.side);
  const tags = typeof missionEffectTagsFromAbility === "function" ? missionEffectTagsFromAbility(ab) : [];
  let score = 0;
  if (botMissionTagPending(unit.side, "ps_related") && tags.includes("ps_related")) score += 12;
  if (botMissionTagPending(unit.side, "defensive_ability") && tags.includes("defensive_ability")) score += 12;
  if (metrics.has("marks_applied") && ["vulnerableMark", "bountyMark"].includes(ab.kind)) score += 14;
  if (metrics.has("enemy_faction_units_controlled") && ["convertEnemy", "corruptLightInfantry"].includes(ab.kind)) score += 15;
  if (metrics.has("enemy_energy_manipulations") && ["incomeDelta", "incomeSwing", "costDelta"].includes(ab.kind)) score += 11;
  if (metrics.has("thorns_damage_dealt") && ["armorThorns", "adjacentDefBuff"].includes(ab.kind)) score += 8;
  return score;
}

function botMissionTacticBonus(side, card, target=null) {
  const context = botMissionContext(side);
  if (!context || context.definition.missionClass !== "ordinary" || !card) return 0;
  const metrics = botMissionIncompleteMetrics(side);
  const kind = String(card.effectKind || card.kind || "");
  const tags = typeof missionEffectTagsFromTactic === "function" ? missionEffectTagsFromTactic(card) : [];
  let score = 0;
  if (botMissionTagPending(side, "ps_related") && tags.includes("ps_related")) score += 12;
  if (metrics.has("units_deployed_by_tactics") && ["spawn_two_militia", "spawn_predone_with_temp_vanguard", "spawn_clan_reinforcements", "spawn_militia_around_commander"].includes(kind)) score += 16;
  if (metrics.has("bleed_damage_dealt") && ["next_attack_bleed_two", "bleed_unit", "bleed_attack"].includes(kind)) score += 12;
  if (metrics.has("marks_applied") && /mark|marchio/i.test(`${kind} ${card.name || ""} ${card.quality || ""}`)) score += 13;
  if (metrics.has("enemy_energy_manipulations") && (tags.includes("enemy_energy_manipulation") || /energy.*enemy|enemy.*energy|usury/i.test(kind))) score += 12;
  if (metrics.has("deck_cards_remaining") && /draw/i.test(kind)) score += 7;
  return score;
}

function botMissionDesperateShouldPlay(side, context, phase="turn_start") {
  const runtime = context.runtime;
  const multiplier = Math.max(1, Math.min(3, Number(runtime.readyCount) || 0));
  if (multiplier >= 3) return { play:true, reason:"moltiplicatore massimo", multiplier };
  const strategic = typeof evaluateBotStrategicState === "function" ? evaluateBotStrategicState(side) : null;
  const disadvantaged = strategic && strategic.posture === "svantaggio";
  const lateRound = Number(state && state.turn || 0) >= 12;
  const own = typeof combatUnits === "function" ? combatUnits(side) : [];
  const enemySide = typeof enemyOf === "function" ? enemyOf(side) : (side === 1 ? 2 : 1);
  const enemies = typeof combatUnits === "function" ? combatUnits(enemySide) : [];
  const id = runtime.missionId;

  if (multiplier >= 2) {
    if (id === "EXMSND01" && !own.some(u => u.type === "Veicolo" || u.type === "Fanteria")) return { play:false, reason:"nessun bersaglio alleato utile", multiplier };
    if (id === "AGMSND01" && !own.length) return { play:false, reason:"nessuna unità da proteggere", multiplier };
    if (id === "FBMSND01" && !enemies.length) return { play:false, reason:"nessun nemico da stordire", multiplier };
    return { play:true, reason:"almeno due condizioni", multiplier };
  }

  if (id === "NXMSND01") {
    const freeSlots = typeof botHandFreeSlots === "function" ? botHandFreeSlots(side) : 1;
    return { play:disadvantaged || lateRound || freeSlots > 0, reason:"ENE e pesca immediatamente utili", multiplier };
  }
  if (id === "LBMSND01") {
    const attackReady = own.some(unit => typeof botHasImmediateAttack === "function" && botHasImmediateAttack(unit));
    return { play:attackReady || disadvantaged || lateRound, reason:attackReady ? "attacco ripetibile disponibile" : "attende un attacco utile", multiplier };
  }
  if (id === "EXMSND01") {
    const targets = own.filter(u => u.type === "Veicolo" || u.type === "Fanteria").length;
    return { play:targets > 0 && (disadvantaged || lateRound), reason:targets ? "bersagli alleati disponibili" : "nessun bersaglio alleato", multiplier };
  }
  if (id === "AGMSND01") {
    const threatened = own.some(u => typeof enemiesNear === "function" && enemiesNear(u.pos, side, 2).length > 0);
    return { play:own.length > 0 && (threatened || disadvantaged || lateRound), reason:threatened ? "unità minacciate" : "attende una minaccia", multiplier };
  }
  if (id === "FBMSND01") {
    const valuableEnemy = enemies.some(u => u.type === "Comandante" || u.weight === "Pivot" || u.weight === "Elite");
    return { play:enemies.length > 0 && (valuableEnemy || disadvantaged || lateRound), reason:valuableEnemy ? "bersaglio nemico prioritario" : "attende un bersaglio prioritario", multiplier };
  }
  return { play:disadvantaged || lateRound, reason:"valutazione prudente ×1", multiplier };
}

function botMissionRecordDecision(side, context, phase, decision) {
  if (!context || !decision) return;
  const runtime = context.runtime;
  const key = `${state && state.turn || 0}:${phase}:${runtime.cycle}:${runtime.readyCount}:${decision.play ? "play" : "wait"}`;
  if (runtime.lastAiDecisionKey === key) return;
  runtime.lastAiDecisionKey = key;
  const data = {
    player:side,
    faction:state.factions && state.factions[side],
    missionId:runtime.missionId,
    missionName:runtime.missionName,
    missionClass:runtime.missionClass,
    cycle:runtime.cycle,
    readyCount:runtime.readyCount,
    phase,
    decision:decision.play ? "play" : "wait",
    reason:decision.reason || "",
    multiplier:decision.multiplier || (runtime.missionClass === "desperate" ? Math.max(1, runtime.readyCount || 1) : 1),
    round:state.turn
  };
  if (typeof missionTelemetryRecord === "function") {
    if (!decision.play) missionTelemetryRecord(side, "aiMissionWaits", 1, data);
    const telemetry = typeof ensureMissionTelemetry === "function" ? ensureMissionTelemetry() : null;
    if (telemetry) telemetry.lastAiDecision[side] = data;
  }
  if (typeof emitGameEvent === "function" && typeof EventTypes !== "undefined" && EventTypes.MISSION_AI_DECISION) emitGameEvent({ type:EventTypes.MISSION_AI_DECISION, data });
}

function botTryPlayMission(side, phase="dynamic") {
  const context = botMissionContext(side);
  if (!context || !context.runtime.ready || context.runtime.played) return false;
  if (typeof missionInteractionBlocked === "function" && missionInteractionBlocked()) return false;
  if (typeof missionIsRecoveryLocked === "function" && missionIsRecoveryLocked(side)) return false;

  let decision = { play:true, reason:"Missione ordinaria pronta", multiplier:1 };
  if (context.definition.missionClass === "desperate") decision = botMissionDesperateShouldPlay(side, context, phase);
  botMissionRecordDecision(side, context, phase, decision);
  if (!decision.play) return false;

  const played = typeof missionPlayMission === "function" ? missionPlayMission(side, { allowBot:true, phase }) : false;
  if (played && typeof log === "function") log(`${playerName(side)} integra la Missione “${context.runtime.missionName}” nel proprio piano IA (${decision.reason}).`);
  return Boolean(played);
}

function missionAiDiagnostics(side=null) {
  const one = targetSide => {
    const context = botMissionContext(targetSide);
    return {
      side:targetSide,
      mode:state && state.modes ? state.modes[targetSide] : null,
      missionId:context && context.runtime.missionId || null,
      missionName:context && context.runtime.missionName || null,
      missionClass:context && context.runtime.missionClass || null,
      cycle:context && context.runtime.cycle || 0,
      ready:Boolean(context && context.runtime.ready),
      readyCount:context && context.runtime.readyCount || 0,
      incompleteMetrics:context ? [...botMissionIncompleteMetrics(targetSide)] : [],
      lastDecision:state && state.missionTelemetry && state.missionTelemetry.lastAiDecision ? state.missionTelemetry.lastAiDecision[targetSide] || null : null
    };
  };
  return side === 1 || side === 2 ? one(side) : { 1:one(1), 2:one(2) };
}
