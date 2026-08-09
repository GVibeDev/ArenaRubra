"use strict";

// Arena Rubra — F9T2a Exordium Expert Bastion Relay Hotfix.
// Corregge il candidato impossibile di F9T2: il PS è ora cercato quando è
// occupato dalla guarnigione mobile da liberare. La sequenza legale è:
// movimento della guarnigione -> verifica cella libera -> costruzione Bastione.
// Nessuna ricerca ricorsiva e nessuna nuova dottrina oltre il Relay Exordium.

const EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2A = "F9T2A-EXORDIUM-1";
const EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2 = EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2A;
const EXPERT_EXORDIUM_BASTION_ID_F9T2 = "EX4B02";

function expertExordiumRuntimeF9T2(player) {
  return typeof expertRuntimeStateF9T1 !== "undefined" && expertRuntimeStateF9T1 && expertRuntimeStateF9T1.activeByPlayer
    ? expertRuntimeStateF9T1.activeByPlayer[player] || null
    : null;
}

function expertExordiumCoordKeyF9T2(coord) {
  return Array.isArray(coord) ? coord.join(",") : "";
}

function expertExordiumSameCoordF9T2(a, b) {
  if (typeof sameCoord === "function") return sameCoord(a, b);
  return Array.isArray(a) && Array.isArray(b) && a.length >= 3 && b.length >= 3 && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function expertExordiumDistanceF9T2(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 999;
  if (typeof hexDistance === "function") return Number(hexDistance(a, b)) || 0;
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

function expertExordiumUnitsF9T2(player) {
  if (typeof combatUnits === "function") return (combatUnits(player) || []).filter(unit => unit && unit.alive !== false);
  return state && Array.isArray(state.units)
    ? state.units.filter(unit => unit && unit.alive !== false && Number(unit.side) === Number(player) && unit.type !== "QG")
    : [];
}

function expertExordiumEnemyUnitsF9T2(player) {
  const enemySides = typeof getEnemyPlayers === "function"
    ? (getEnemyPlayers(player) || [])
    : [Number(player) === 1 ? 2 : 1];
  const result = [];
  for (const side of enemySides) result.push(...expertExordiumUnitsF9T2(side));
  return result;
}

function expertExordiumBastionBlueprintF9T2() {
  return typeof BLUEPRINTS !== "undefined" && Array.isArray(BLUEPRINTS)
    ? BLUEPRINTS.find(bp => bp && bp.id === EXPERT_EXORDIUM_BASTION_ID_F9T2 && bp.faction === "Exordium") || null
    : null;
}

function expertExordiumCellBuildableAfterReleaseF9T2a(targetCoord, guard) {
  if (!Array.isArray(targetCoord)) return false;
  if (typeof isCellEnterable === "function" && !isCellEnterable(targetCoord)) return false;
  const terrain = typeof getMapTerrainAt === "function" ? getMapTerrainAt(targetCoord) : null;
  if (terrain && terrain.blocksDeployment) return false;
  if (typeof getUnitAt === "function") {
    const occupant = getUnitAt(targetCoord);
    if (occupant && (!guard || String(occupant.uid || occupant.id || "") !== String(guard.uid || guard.id || ""))) return false;
  }
  return true;
}

function expertExordiumCanUseBuilderAfterReleaseF9T2a(builder, targetCoord, guard) {
  if (!builder || builder === guard || builder.alive === false || builder.acted || !Array.isArray(builder.pos)) return false;
  if (builder.faction !== "Exordium") return false;
  if (typeof canAct === "function" && !canAct(builder)) return false;
  if (typeof canBuildStructures === "function" && !canBuildStructures(builder)) return false;
  if (expertExordiumDistanceF9T2(builder.pos, targetCoord) !== 1) return false;
  return expertExordiumCellBuildableAfterReleaseF9T2a(targetCoord, guard);
}

// Verifica ordinaria usata dopo che la guarnigione ha già liberato la cella.
function expertExordiumCanUseBuilderF9T2(builder, targetCoord) {
  if (!builder || builder.alive === false || builder.acted || !Array.isArray(builder.pos)) return false;
  if (builder.faction !== "Exordium") return false;
  if (typeof canBuildStructures === "function" && !canBuildStructures(builder)) return false;
  if (typeof buildableCells !== "function") return false;
  const cells = buildableCells(builder) || [];
  return cells.some(coord => expertExordiumSameCoordF9T2(coord, targetCoord));
}

function expertExordiumCardSourceF9T2(player, bp, coord) {
  if (!bp || !state || !state.energy) return null;
  if (typeof purchaseLimitReached === "function" && purchaseLimitReached(player, bp)) return null;
  if (typeof playerEnergyLocked === "function" && playerEnergyLocked(player)) return null;

  const hand = state.hand && Array.isArray(state.hand[player]) ? state.hand[player] : [];
  const handCard = hand.find(card => card && card.sourceType === "unit" && card.blueprintId === bp.id && !(typeof handCardBlocked === "function" && handCardBlocked(card)));
  if (handCard) {
    const cost = typeof effectiveHandUnitCardCost === "function"
      ? Number(effectiveHandUnitCardCost(player, handCard, bp, coord))
      : Number(bp.cost || 0);
    if (Number.isFinite(cost) && state.energy[player] >= cost) {
      return { source:"hand", cost, cardUid:String(handCard.cardUid || ""), cardName:String(handCard.name || bp.name || "") };
    }
  }

  const marketCost = typeof effectiveBlueprintCost === "function"
    ? Number(effectiveBlueprintCost(player, bp, coord))
    : Number(bp.cost || 0);
  if (!Number.isFinite(marketCost) || state.energy[player] < marketCost) return null;
  const starterRole = typeof starterRoleForBlueprint === "function" ? starterRoleForBlueprint(player, bp) : null;
  if (starterRole && typeof tacticalStarterCapState === "function") {
    const cap = tacticalStarterCapState(player, starterRole);
    if (cap && cap.blocked) return null;
  }
  const starterCard = starterRole && state.starterCards && state.starterCards[player]
    ? Object.values(state.starterCards[player]).find(card => card && card.starterRole === starterRole) || null
    : null;
  return {
    source:"market",
    cost:marketCost,
    starterRole:starterRole || null,
    starterCardUid:starterCard ? String(starterCard.cardUid || "") : null
  };
}

function expertExordiumPsCellsF9T2a() {
  return state && Array.isArray(state.cells)
    ? state.cells.filter(cell => cell && cell.ps && Array.isArray(cell.coord))
    : [];
}

function expertExordiumObjectiveCoordsF9T2(player) {
  const points = expertExordiumPsCellsF9T2a()
    .filter(cell => Number(cell.control) !== Number(player))
    .map(cell => cell.coord.slice(0, 3));
  const centerIndex = points.findIndex(coord => expertExordiumIsCenterF9T2c1(coord));
  if (centerIndex > 0) {
    const center = points.splice(centerIndex, 1)[0];
    points.unshift(center);
  }
  if (!points.length && typeof getEnemyPlayers === "function" && typeof getHq === "function") {
    for (const side of getEnemyPlayers(player) || []) {
      const hq = getHq(side);
      if (hq && Array.isArray(hq.pos)) points.push(hq.pos.slice(0, 3));
    }
  }
  return points;
}

function expertExordiumNearestObjectiveF9T2(origin, objectives) {
  if (!Array.isArray(origin) || !Array.isArray(objectives) || !objectives.length) return null;
  let best = null;
  let bestDistance = Infinity;
  let bestKey = "";
  for (const coord of objectives) {
    const distance = expertExordiumDistanceF9T2(origin, coord);
    const key = expertExordiumCoordKeyF9T2(coord);
    if (distance < bestDistance || (distance === bestDistance && (!best || key < bestKey))) {
      best = coord;
      bestDistance = distance;
      bestKey = key;
    }
  }
  return best ? best.slice(0, 3) : null;
}

function expertExordiumIsMobileGuardF9T2a(unit, player) {
  if (!unit || unit.alive === false || Number(unit.side) !== Number(player) || unit.faction !== "Exordium") return false;
  if (unit.type === "Struttura" || unit.type === "QG" || unit.acted || !Array.isArray(unit.pos)) return false;
  if (typeof canAct === "function" && !canAct(unit)) return false;
  return true;
}

function expertExordiumReleaseMoveF9T2a(guard, objectiveCoord, enemyUnits = null, moveCache = null) {
  if (!guard || !Array.isArray(guard.pos) || !Array.isArray(objectiveCoord) || typeof movableCells !== "function") return null;
  const cachedMoves = moveCache && typeof moveCache.get === "function" ? moveCache : new Map();
  const cacheKey = String(guard.uid || guard.id || "");
  if (!cachedMoves.has(cacheKey)) cachedMoves.set(cacheKey, movableCells(guard) || []);
  const enemies = Array.isArray(enemyUnits) ? enemyUnits : expertExordiumEnemyUnitsF9T2(guard.side);
  const before = expertExordiumDistanceF9T2(guard.pos, objectiveCoord);
  const entries = [];
  for (const coord of cachedMoves.get(cacheKey) || []) {
    const after = expertExordiumDistanceF9T2(coord, objectiveCoord);
    const gain = before - after;
    if (gain < 1) continue;
    let enemyR1 = 0;
    let enemyR2 = 0;
    for (const enemy of enemies) {
      if (!enemy || !Array.isArray(enemy.pos)) continue;
      const distance = expertExordiumDistanceF9T2(enemy.pos, coord);
      if (distance <= 1) enemyR1 += 1;
      if (distance <= 2) enemyR2 += 1;
    }
    const cell = typeof getCellAt === "function" ? getCellAt(coord) : null;
    let score = gain * 100 - after * 2 - enemyR1 * 22 - enemyR2 * 4;
    if (cell && cell.ps && Number(cell.control) !== Number(guard.side)) score += 30;
    entries.push({ coord:coord.slice(0, 3), gain, beforeDistance:before, afterDistance:after, enemyR1, enemyR2, score });
  }
  entries.sort((a, b) => b.score - a.score || a.afterDistance - b.afterDistance || expertExordiumCoordKeyF9T2(a.coord).localeCompare(expertExordiumCoordKeyF9T2(b.coord)));
  return { best:entries[0] || null, count:entries.length, entries };
}


// =====================================================
// F9T2c3 — TELEMETRY AGGREGATION RECONCILIATION
// =====================================================
function expertExordiumScannerKeyF9T2c3(scanner) {
  const key = String(scanner || "");
  if (key === "relay") return "relay";
  if (key === "clearOccupyFortify" || key === "clear") return "clearOccupyFortify";
  if (key === "varranAssault" || key === "varran") return "varranAssault";
  return "forwardPivot";
}

function expertExordiumAccumulateCandidateAuditsF9T2c3(player, scanner, audits) {
  const list = Array.isArray(audits) ? audits.filter(Boolean) : [];
  const rejectionCounts = {};
  const runtime = expertExordiumRuntimeF9T2(player);
  const scannerKey = expertExordiumScannerKeyF9T2c3(scanner);
  for (const audit of list) {
    const reason = String(audit && audit.rejectionReason || "valid_candidate");
    rejectionCounts[reason] = Number(rejectionCounts[reason] || 0) + 1;
  }
  if (runtime) {
    runtime.candidateAuditCount = Number(runtime.candidateAuditCount || 0) + list.length;
    if (!runtime.candidateAuditCountByScanner) runtime.candidateAuditCountByScanner = { relay:0, clearOccupyFortify:0, forwardPivot:0, varranAssault:0 };
    runtime.candidateAuditCountByScanner[scannerKey] = Number(runtime.candidateAuditCountByScanner[scannerKey] || 0) + list.length;
    if (!runtime.candidateRejectionCounts) runtime.candidateRejectionCounts = {};
    if (!runtime.candidateRejectionCountsByScanner) runtime.candidateRejectionCountsByScanner = { relay:{}, clearOccupyFortify:{}, forwardPivot:{}, varranAssault:{} };
    if (!runtime.candidateRejectionCountsByScanner[scannerKey]) runtime.candidateRejectionCountsByScanner[scannerKey] = {};
    for (const [reason, count] of Object.entries(rejectionCounts)) {
      runtime.candidateRejectionCounts[reason] = Number(runtime.candidateRejectionCounts[reason] || 0) + Number(count || 0);
      runtime.candidateRejectionCountsByScanner[scannerKey][reason] = Number(runtime.candidateRejectionCountsByScanner[scannerKey][reason] || 0) + Number(count || 0);
    }
  }
  return { runtime, scannerKey, rejectionCounts, auditTotal:list.length };
}

function expertExordiumEmitCandidateAuditBatchF9T2c3(player, scanner, kind, source, audits, detailLimit = 12) {
  const list = Array.isArray(audits) ? audits.filter(Boolean) : [];
  if (!list.length) return null;
  const aggregate = expertExordiumAccumulateCandidateAuditsF9T2c3(player, scanner, list);
  const stored = list.slice(0, Math.max(0, Number(detailLimit || 0)));
  const decision = {
    kind:String(kind || "candidate_audit_batch"),
    source:String(source || "expert_exordium"),
    scanner:aggregate.scannerKey,
    audits:stored,
    auditTotal:list.length,
    rejectionCounts:aggregate.rejectionCounts,
    auditRecordsDropped:Math.max(0, list.length - stored.length)
  };
  if (typeof expertEmitDecisionLimitedF9T2c1 === "function") {
    return expertEmitDecisionLimitedF9T2c1(player, decision, { audit:true, auditTotal:list.length, auditStored:stored.length });
  }
  if (typeof expertEmitF9T1 === "function" && typeof EventTypes !== "undefined" && EventTypes.AI_EXPERT_DECISION) {
    return expertEmitF9T1(EventTypes.AI_EXPERT_DECISION, player, {
      sequence:aggregate.runtime ? aggregate.runtime.sequence : null,
      decision:{ ...decision, auditRecord:true }
    });
  }
  return null;
}

function expertExordiumMarkTerritorialMetricF9T2c3(player, metric) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const plan = runtime && runtime.plan;
  if (!runtime || !plan || plan.goal !== "EXORDIUM_CLEAR_OCCUPY_FORTIFY") return false;
  if (!runtime.territorialConversionMetrics) runtime.territorialConversionMetrics = { psClearedDuringExpertPlan:0, psClearedDirectlyByExpertStep:0, psOccupiedAfterClear:0, psFortifiedAfterClear:0 };
  if (!plan.exordium) plan.exordium = {};
  if (!plan.exordium.telemetryMetrics) plan.exordium.telemetryMetrics = {};
  const key = String(metric || "");
  if (!key || plan.exordium.telemetryMetrics[key]) return false;
  plan.exordium.telemetryMetrics[key] = true;
  runtime.territorialConversionMetrics[key] = Number(runtime.territorialConversionMetrics[key] || 0) + 1;
  return true;
}

function expertExordiumRecordCandidateAuditsF9T2a(player, audits) {
  return expertExordiumEmitCandidateAuditBatchF9T2c3(
    player,
    "relay",
    "bastion_relay_candidate_audit_batch",
    "expert_exordium_f9t2a",
    audits,
    12
  );
}

// Alias mantenuto per strumenti diagnostici che invocavano il recorder singolo.
function expertExordiumRecordCandidateAuditF9T2a(player, audit) {
  expertExordiumRecordCandidateAuditsF9T2a(player, audit ? [audit] : []);
}

function expertExordiumRelayCandidatesF9T2(context) {
  const player = Number(context && context.player || 0);
  const bp = expertExordiumBastionBlueprintF9T2();
  if (!player || !bp) return [];
  const psCells = expertExordiumPsCellsF9T2a();
  const ownHq = typeof getHq === "function" ? getHq(player) : null;
  const enemyHqs = typeof getEnemyPlayers === "function" && typeof getHq === "function"
    ? (getEnemyPlayers(player) || []).map(getHq).filter(Boolean)
    : [];
  const objectives = expertExordiumObjectiveCoordsF9T2(player);
  const ownUnits = expertExordiumUnitsF9T2(player);
  const ownStructures = ownUnits.filter(unit => unit.type === "Struttura" && Array.isArray(unit.pos));
  const builderUnits = ownUnits.filter(unit => unit && unit.type !== "Struttura" && unit.type !== "QG" && unit.faction === "Exordium" && Array.isArray(unit.pos));
  const enemyUnits = expertExordiumEnemyUnitsF9T2(player);
  const availableEnergy = Number(state && state.energy && state.energy[player] || 0);
  const moveCache = new Map();
  const candidates = [];
  const audits = [];
  const maxCandidates = typeof EXPERT_AI_LIMITS_F9T1 !== "undefined"
    ? Math.max(1, Number(EXPERT_AI_LIMITS_F9T1.maxCandidates || 64))
    : 64;

  const pushEarlyAudit = (ps, occupant, structurePresent, reason, extras = {}) => {
    audits.push({
      psCoord:ps.coord.slice(0, 3),
      owned:Number(ps.control) === player,
      occupantId:occupant ? String(occupant.uid || occupant.id || "") : null,
      occupantType:occupant ? String(occupant.type || "") : null,
      mobileOccupant:false,
      mobileGuardEligible:false,
      structurePresent:Boolean(structurePresent),
      adjacentBuilders:0,
      eligibleBuilders:0,
      builderReady:false,
      builderCanBuildBastion:false,
      availableEnergy,
      bastionCost:Number(bp.cost || 0),
      reservePossible:false,
      releaseDestinationCount:0,
      objectiveCoord:null,
      candidateValid:false,
      rejectionReason:reason,
      rejectionReasons:[reason],
      ...extras
    });
  };

  for (const ps of psCells) {
    const occupant = typeof getUnitAt === "function" ? getUnitAt(ps.coord) : null;
    const structurePresent = Boolean(occupant && occupant.type === "Struttura") || ownStructures.some(structure => expertExordiumSameCoordF9T2(structure.pos, ps.coord));
    if (Number(ps.control) !== player) {
      pushEarlyAudit(ps, occupant, structurePresent, "ps_not_owned");
      continue;
    }
    if (structurePresent) {
      pushEarlyAudit(ps, occupant, true, "ps_has_structure");
      continue;
    }

    const mobileGuard = expertExordiumIsMobileGuardF9T2a(occupant, player) ? occupant : null;
    const objective = expertExordiumNearestObjectiveF9T2(ps.coord, objectives);
    const adjacentBuilders = [];
    for (const builder of builderUnits) {
      if (builder === occupant || expertExordiumDistanceF9T2(builder.pos, ps.coord) !== 1) continue;
      if (typeof canBuildStructures === "function" && !canBuildStructures(builder)) continue;
      adjacentBuilders.push(builder);
    }
    const eligibleBuilders = adjacentBuilders.filter(builder => expertExordiumCanUseBuilderAfterReleaseF9T2a(builder, ps.coord, mobileGuard));
    eligibleBuilders.sort((a, b) => {
      const aValue = Number(a.cost || 0) * 2 + Number(a.att || 0) + (a.weight === "Elite" || a.weight === "Pivot" ? 6 : 0);
      const bValue = Number(b.cost || 0) * 2 + Number(b.att || 0) + (b.weight === "Elite" || b.weight === "Pivot" ? 6 : 0);
      return aValue - bValue || String(a.uid || "").localeCompare(String(b.uid || ""));
    });
    const release = mobileGuard && objective ? expertExordiumReleaseMoveF9T2a(mobileGuard, objective, enemyUnits, moveCache) : null;
    const source = mobileGuard && eligibleBuilders.length && objective && release && release.best
      ? expertExordiumCardSourceF9T2(player, bp, ps.coord)
      : null;
    const reasons = [];
    if (!occupant) reasons.push("ps_has_no_occupant");
    else if (Number(occupant.side) !== player || occupant.faction !== "Exordium" || occupant.type === "Struttura" || occupant.type === "QG") reasons.push("ps_occupant_not_mobile_guard");
    else if (!mobileGuard) reasons.push("mobile_guard_already_acted");
    if (!expertExordiumCellBuildableAfterReleaseF9T2a(ps.coord, mobileGuard)) reasons.push("cell_not_buildable");
    if (!adjacentBuilders.length) reasons.push("no_adjacent_builder");
    else if (!eligibleBuilders.length) reasons.push("builder_exhausted_or_ineligible");
    if (!objective) reasons.push("no_next_objective");
    if (mobileGuard && objective && (!release || release.count < 1)) reasons.push("no_release_destination");
    if (!source && !reasons.length) reasons.push(availableEnergy < Number(bp.cost || 0) ? "insufficient_energy" : "bastion_source_unavailable");

    audits.push({
      psCoord:ps.coord.slice(0, 3),
      owned:true,
      occupantId:occupant ? String(occupant.uid || occupant.id || "") : null,
      occupantType:occupant ? String(occupant.type || "") : null,
      mobileOccupant:Boolean(mobileGuard),
      mobileGuardEligible:Boolean(mobileGuard),
      structurePresent:false,
      adjacentBuilders:adjacentBuilders.length,
      eligibleBuilders:eligibleBuilders.length,
      builderReady:Boolean(eligibleBuilders.length),
      builderCanBuildBastion:Boolean(eligibleBuilders.length),
      availableEnergy,
      bastionCost:source ? Number(source.cost || 0) : Number(bp.cost || 0),
      reservePossible:Boolean(source),
      releaseDestinationCount:release ? release.count : 0,
      objectiveCoord:objective ? objective.slice(0, 3) : null,
      candidateValid:reasons.length === 0,
      rejectionReason:reasons[0] || null,
      rejectionReasons:reasons
    });
    if (reasons.length || candidates.length >= maxCandidates) continue;

    const builder = eligibleBuilders[0];
    const advance = release.best;
    const distanceFromOwnHq = ownHq && Array.isArray(ownHq.pos) ? expertExordiumDistanceF9T2(ownHq.pos, ps.coord) : 0;
    let distanceToEnemyHq = 99;
    for (const hq of enemyHqs) distanceToEnemyHq = Math.min(distanceToEnemyHq, expertExordiumDistanceF9T2(ps.coord, hq.pos));
    let enemyR1 = 0;
    let enemyR2 = 0;
    for (const enemy of enemyUnits) {
      if (!enemy || !Array.isArray(enemy.pos)) continue;
      const distance = expertExordiumDistanceF9T2(enemy.pos, ps.coord);
      if (distance <= 1) enemyR1 += 1;
      if (distance <= 2) enemyR2 += 1;
    }
    let support = 0;
    for (const unit of ownUnits) if (unit && Array.isArray(unit.pos) && expertExordiumDistanceF9T2(unit.pos, ps.coord) <= 2) support += 1;
    const isCenter = expertExordiumIsCenterF9T2c1(ps.coord);
    let score = 30 + distanceFromOwnHq * 2.2 + advance.gain * 12 + support * 1.5;
    if (isCenter) score += 24;
    if (distanceToEnemyHq <= 5) score += 10;
    score -= enemyR1 * 12 + enemyR2 * 3;
    candidates.push({
      ps, builder, mobileGuard, advance, objective, bp, source, score,
      diagnostics:{ distanceFromOwnHq, distanceToEnemyHq, enemyR1, enemyR2, support, isCenter, releaseDestinationCount:release.count }
    });
  }

  expertExordiumRecordCandidateAuditsF9T2a(player, audits);
  candidates.sort((a, b) => b.score - a.score || expertExordiumCoordKeyF9T2(a.ps.coord).localeCompare(expertExordiumCoordKeyF9T2(b.ps.coord)) || String(a.builder.uid || "").localeCompare(String(b.builder.uid || "")));
  return candidates;
}

function expertExordiumCreateRelayPlanF9T2(context, candidate) {
  const turn = Number(context && context.turn || 0);
  const psCoord = candidate.ps.coord.slice(0, 3);
  const objective = candidate.objective.slice(0, 3);
  const source = candidate.source;
  const guardId = String(candidate.mobileGuard.uid || candidate.mobileGuard.id || "");
  const created = typeof expertCreateMicroPlanF9T1 === "function"
    ? expertCreateMicroPlanF9T1({
        id:`exordium-bastion-relay-${turn}-${expertExordiumCoordKeyF9T2(psCoord)}`,
        faction:"Exordium",
        goal:"EXORDIUM_BASTION_RELAY",
        targetCell:psCoord,
        targetPs:psCoord,
        targetUnitId:guardId,
        primaryActorId:guardId,
        supportActorIds:[String(candidate.builder.uid || "")],
        requiredEnergy:source.cost,
        reservedEnergy:source.cost,
        reservedActions:[`move:${guardId}`, `build:${candidate.builder.uid}`],
        orderedSteps:[
          {
            id:"release_mobile_guard",
            action:"advance_unit_pre_purchase",
            unitId:guardId,
            targetCell:objective,
            plannedCell:candidate.advance.coord.slice(0, 3),
            originPs:psCoord,
            minimumDistanceGain:1
          },
          {
            id:"fortify_ps_with_bastion",
            action:"build_roster",
            blueprintId:candidate.bp.id,
            targetCell:psCoord,
            builderId:String(candidate.builder.uid || ""),
            source:source.source,
            cardUid:source.cardUid || null,
            starterRole:source.starterRole || null,
            starterCardUid:source.starterCardUid || null,
            requiredEnergy:source.cost
          }
        ],
        expectedResult:{
          mobileGuardReleased:true,
          psFortified:true,
          deploymentNodeCreated:true,
          targetPs:psCoord,
          advanceObjective:objective
        },
        abortConditions:[
          "hq_occupation_risk_direct",
          "release_actor_unavailable",
          "release_destination_unavailable",
          "target_ps_not_freed",
          "builder_unavailable",
          "reserved_energy_unavailable"
        ],
        fallbackPlan:"advanced_f9t0",
        status:"proposed"
      })
    : { plan:null, validation:{ ok:false, errors:["microplan_factory_unavailable"] } };
  if (!created.validation.ok) return null;
  created.plan.exordium = {
    contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2A,
    doctrine:"bastion_relay",
    hotfix:"candidate_and_legal_sequence",
    candidateScore:Number(candidate.score.toFixed(3)),
    diagnostics:candidate.diagnostics,
    plannedAdvanceCell:candidate.advance.coord.slice(0, 3)
  };
  return created.plan;
}

function expertExordiumModuleF9T2a(context) {
  if (!context || context.faction !== "Exordium") {
    return { moduleId:"expert-exordium-f9t2a", faction:"Exordium", plan:null, status:"not_applicable", reason:"wrong_faction", contextTurn:context ? context.turn : null };
  }
  const hqRisk = context.common && context.common.hqOccupationRisk ? context.common.hqOccupationRisk.risk : "unknown";
  if (hqRisk === "occupied" || hqRisk === "direct") {
    return { moduleId:"expert-exordium-f9t2a", faction:"Exordium", plan:null, status:"fallback", reason:"hq_occupation_risk_priority", contextTurn:context.turn };
  }
  const candidates = expertExordiumRelayCandidatesF9T2(context);
  const runtime = expertExordiumRuntimeF9T2(context.player);
  if (runtime) {
    runtime.candidateCount = Number(runtime.candidateCount || 0) + candidates.length;
    runtime.discardedCandidates = Number(runtime.discardedCandidates || 0) + Math.max(0, candidates.length - 1);
  }
  if (!candidates.length) {
    return { moduleId:"expert-exordium-f9t2a", faction:"Exordium", plan:null, status:"fallback", reason:"no_bastion_relay_candidate", contextTurn:context.turn, candidateCount:0 };
  }
  const plan = expertExordiumCreateRelayPlanF9T2(context, candidates[0]);
  if (!plan) {
    return { moduleId:"expert-exordium-f9t2a", faction:"Exordium", plan:null, status:"fallback", reason:"relay_plan_validation_failed", contextTurn:context.turn, candidateCount:candidates.length };
  }
  return {
    moduleId:"expert-exordium-f9t2a",
    faction:"Exordium",
    plan,
    status:"microplan_selected",
    reason:"bastion_relay_available",
    contextTurn:context.turn,
    candidateCount:candidates.length,
    contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2A
  };
}

function expertExordiumModuleF9T2(context) { return expertExordiumModuleF9T2a(context); }
function expertExordiumModuleF9T1(context) { return expertExordiumModuleF9T2a(context); }

function expertExordiumCurrentStepF9T2(player) {
  const runtime = expertExordiumRuntimeF9T2(player);
  if (!runtime || !runtime.plan || runtime.plan.faction !== "Exordium" || runtime.plan.status !== "active") return null;
  return runtime.plan.orderedSteps[runtime.plan.currentStep] || null;
}

function expertExordiumTryPrePurchasePlanStepF9T2a(player) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const step = expertExordiumCurrentStepF9T2(player);
  if (!runtime || !step || step.action !== "advance_unit_pre_purchase") return false;
  const unit = expertExordiumUnitsF9T2(player).find(candidate => String(candidate.uid || candidate.id || "") === String(step.unitId || "")) || null;
  if (!expertExordiumIsMobileGuardF9T2a(unit, player) || !expertExordiumSameCoordF9T2(unit.pos, step.originPs)) {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "release_actor_unavailable", { stepId:step.id, unitId:step.unitId });
    return false;
  }
  const objective = Array.isArray(step.targetCell) ? step.targetCell : null;
  const release = expertExordiumReleaseMoveF9T2a(unit, objective);
  const planned = Array.isArray(step.plannedCell)
    ? release && release.entries.find(entry => expertExordiumSameCoordF9T2(entry.coord, step.plannedCell)) || null
    : null;
  const best = planned || (release && release.best) || null;
  if (!best || best.gain < Math.max(1, Number(step.minimumDistanceGain || 1))) {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "release_destination_unavailable", { stepId:step.id, unitId:step.unitId });
    return false;
  }
  const before = typeof expertCaptureUnitDecisionF9T1 === "function" ? expertCaptureUnitDecisionF9T1(unit) : { unitId:String(unit.uid || unit.id || ""), position:unit.pos.slice(0, 3), energy:Number(state.energy[player] || 0) };
  if (typeof botMoveUnitF9T0 !== "function") {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "planned_move_runtime_unavailable", { stepId:step.id });
    return false;
  }
  botMoveUnitF9T0(unit, best.coord);
  if (typeof finishBotMove === "function") finishBotMove(unit);
  else unit.acted = true;
  const after = typeof expertCaptureUnitDecisionF9T1 === "function" ? expertCaptureUnitDecisionF9T1(unit) : { unitId:String(unit.uid || unit.id || ""), position:unit.pos.slice(0, 3), energy:Number(state.energy[player] || 0) };
  if (typeof expertRecordDecisionF9T1 === "function") {
    expertRecordDecisionF9T1(player, before, after, { kind:"pre_purchase_relay_move", source:"expert_exordium_f9t2a" });
  } else {
    expertExordiumObserveUnitDecisionF9T2(player, before, after);
  }
  const occupant = typeof getUnitAt === "function" ? getUnitAt(step.originPs) : null;
  if (occupant) {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "target_ps_not_freed", { stepId:step.id, occupantId:String(occupant.uid || occupant.id || "") });
    return false;
  }
  return Boolean(runtime.plan && runtime.plan.status === "active" && runtime.plan.currentStep === 1);
}

function expertExordiumRosterChoiceF9T2(player) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const step = expertExordiumCurrentStepF9T2(player);
  if (!runtime || !step || step.action !== "build_roster" || step.blueprintId !== EXPERT_EXORDIUM_BASTION_ID_F9T2) return null;
  const bp = expertExordiumBastionBlueprintF9T2();
  const builder = expertExordiumUnitsF9T2(player).find(unit => String(unit.uid || unit.id || "") === String(step.builderId || "")) || null;
  if (typeof getUnitAt === "function" && getUnitAt(step.targetCell)) {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "target_ps_not_freed", { stepId:step.id });
    return null;
  }
  if (!bp || !builder || !expertExordiumCanUseBuilderF9T2(builder, step.targetCell)) {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "builder_or_target_unavailable", { stepId:step.id });
    return null;
  }
  const source = expertExordiumCardSourceF9T2(player, bp, step.targetCell);
  if (!source || Number(state.energy[player] || 0) < Number(source.cost || 0)) {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "reserved_energy_unavailable", { stepId:step.id });
    return null;
  }
  return {
    source:source.source,
    bp,
    cardUid:source.cardUid || null,
    cardName:source.cardName || bp.name,
    starterRole:source.starterRole || null,
    starterCardUid:source.starterCardUid || null,
    builder,
    coord:step.targetCell.slice(0, 3),
    cost:source.cost,
    score:1000,
    expertPlanId:runtime.plan.id,
    expertStepId:step.id,
    expertDoctrine:"exordium_bastion_relay_f9t2a"
  };
}

function expertExordiumObserveRosterPlayF9T2(player, choice) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const step = expertExordiumCurrentStepF9T2(player);
  if (!runtime || !step || step.action !== "build_roster" || !choice || !choice.bp) return false;
  if (choice.bp.id !== step.blueprintId || !expertExordiumSameCoordF9T2(choice.coord, step.targetCell)) return false;
  runtime.plan.reservedEnergy = 0;
  if (typeof expertAdvancePlanStepF9T2 === "function") {
    expertAdvancePlanStepF9T2(player, {
      stepId:step.id,
      action:step.action,
      result:"bastion_built_on_ps",
      targetCell:step.targetCell,
      blueprintId:choice.bp.id,
      energySpent:Number(choice.cost || 0)
    });
  }
  return true;
}

// Compatibilità con gli hook F9T2: il movimento del Relay viene ora completato
// prima della fase acquisti; durante il loop unità non serve alcun bonus residuo.
function expertExordiumUnitPriorityBonusF9T2(unit) { return 0; }
function expertExordiumMoveBonusF9T2(unit, coord) { return 0; }
function expertExordiumTryPlannedUnitActionF9T2(unit) { return false; }

function expertExordiumObserveUnitDecisionF9T2(player, before, after) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const step = expertExordiumCurrentStepF9T2(player);
  if (!runtime || !step || step.action !== "advance_unit_pre_purchase") return false;
  const unitId = String((after && after.unitId) || (before && before.unitId) || "");
  if (unitId !== String(step.unitId || "")) return false;
  const from = before && before.position;
  const to = after && after.position;
  if (!Array.isArray(from) || !Array.isArray(to) || expertExordiumSameCoordF9T2(from, to)) {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "release_actor_did_not_advance", { stepId:step.id, unitId });
    return false;
  }
  const beforeDistance = expertExordiumDistanceF9T2(from, step.targetCell);
  const afterDistance = expertExordiumDistanceF9T2(to, step.targetCell);
  if (afterDistance >= beforeDistance) {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "release_actor_wrong_direction", { stepId:step.id, unitId, beforeDistance, afterDistance });
    return false;
  }
  if (typeof expertAdvancePlanStepF9T2 === "function") {
    expertAdvancePlanStepF9T2(player, {
      stepId:step.id,
      action:step.action,
      result:"mobile_guard_released",
      unitId,
      from,
      to,
      originPs:step.originPs,
      distanceBefore:beforeDistance,
      distanceAfter:afterDistance,
      distanceGain:beforeDistance - afterDistance
    });
  }
  return true;
}

// =====================================================
// F9T2b — Exordium Expert Territorial Conversion & Relay Survival
// =====================================================
// Aggiunge due componenti strettamente delimitate:
// 1) CLEAR_OCCUPY_FORTIFY: rimozione coordinata del presidio di un PS e
//    conversione immediata in Bastione oppure guarnigione economica;
// 2) RELAY_SURVIVAL_CHECK: filtro leggero, con memoria limitata a cinque round,
//    che evita ricostruzioni automatiche su PS ripetutamente insostenibili.
// Nessuna ricerca ricorsiva, massimo tre attaccanti e un solo micro-piano attivo.

const EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2B = "F9T2B-EXORDIUM-1";
const EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2B = "F9T2b-1";
const EXPERT_EXORDIUM_CLEAR_MAX_ATTACKERS_F9T2B = 3;
const EXPERT_EXORDIUM_LOSS_MEMORY_ROUNDS_F9T2B = 5;

function expertExordiumUnitIdF9T2b(unit) {
  return unit ? String(unit.uid || unit.id || "") : "";
}

function expertExordiumUnitByIdF9T2b(unitId) {
  if (!unitId || !state || !Array.isArray(state.units)) return null;
  return state.units.find(unit => unit && String(unit.uid || unit.id || "") === String(unitId)) || null;
}

function expertExordiumEnsureMemoryF9T2b() {
  if (!state) return null;
  if (!state.expertAiF9T2b || state.expertAiF9T2b.schemaVersion !== EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2B) {
    state.expertAiF9T2b = {
      schemaVersion:EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2B,
      bastionLossesByPlayer:{},
      territorialConversionsByPlayer:{}
    };
  }
  return state.expertAiF9T2b;
}

function expertExordiumRoundF9T2b() {
  return Math.max(0, Number(state && state.turn || 0));
}

function expertExordiumLossBucketF9T2b(player, coord, create = false) {
  const memory = expertExordiumEnsureMemoryF9T2b();
  if (!memory) return null;
  const sideKey = String(Number(player || 0));
  const coordKey = expertExordiumCoordKeyF9T2(coord);
  if (!memory.bastionLossesByPlayer[sideKey] && create) memory.bastionLossesByPlayer[sideKey] = {};
  const byCoord = memory.bastionLossesByPlayer[sideKey] || null;
  if (!byCoord) return null;
  if (!byCoord[coordKey] && create) byCoord[coordKey] = { rounds:[], lastLossRound:null };
  const bucket = byCoord[coordKey] || null;
  if (!bucket) return null;
  const round = expertExordiumRoundF9T2b();
  bucket.rounds = (Array.isArray(bucket.rounds) ? bucket.rounds : [])
    .map(Number)
    .filter(value => Number.isFinite(value) && round - value <= EXPERT_EXORDIUM_LOSS_MEMORY_ROUNDS_F9T2B)
    .slice(-EXPERT_EXORDIUM_LOSS_MEMORY_ROUNDS_F9T2B);
  if (!bucket.rounds.length && bucket.lastLossRound != null && round - Number(bucket.lastLossRound) > EXPERT_EXORDIUM_LOSS_MEMORY_ROUNDS_F9T2B) {
    delete byCoord[coordKey];
    return null;
  }
  return bucket;
}

function expertExordiumRecordBastionLossF9T2b(player, coord, round = expertExordiumRoundF9T2b()) {
  if (!Array.isArray(coord)) return null;
  const bucket = expertExordiumLossBucketF9T2b(player, coord, true);
  if (!bucket) return null;
  const resolvedRound = Math.max(0, Number(round || 0));
  bucket.rounds.push(resolvedRound);
  bucket.rounds = bucket.rounds
    .filter(value => resolvedRound - Number(value) <= EXPERT_EXORDIUM_LOSS_MEMORY_ROUNDS_F9T2B)
    .slice(-EXPERT_EXORDIUM_LOSS_MEMORY_ROUNDS_F9T2B);
  bucket.lastLossRound = resolvedRound;
  return bucket;
}

function expertAiHandleGameEventF9T2b(event) {
  if (!event || typeof EventTypes === "undefined" || event.type !== EventTypes.UNIT_DESTROYED || !state) return false;
  const data = event.data || {};
  const unit = expertExordiumUnitByIdF9T2b(data.unitId);
  const blueprintId = String((unit && (unit.id || unit.blueprintId)) || data.blueprintId || "");
  const faction = String((unit && unit.faction) || data.faction || "");
  const unitType = String((unit && unit.type) || data.unitType || "");
  if (blueprintId !== EXPERT_EXORDIUM_BASTION_ID_F9T2 || faction !== "Exordium" || unitType !== "Struttura") return false;
  const coord = unit && Array.isArray(unit.pos) ? unit.pos.slice(0, 3) : (Array.isArray(data.targetPos) ? data.targetPos.slice(0, 3) : null);
  const side = Number((unit && unit.side) || data.side || 0);
  if (!coord || !side) return false;
  expertExordiumRecordBastionLossF9T2b(side, coord);
  return true;
}

function expertExordiumEffectiveAttackF9T2b(attacker, defender) {
  if (!attacker) return 0;
  let damage = typeof effectiveAtt === "function" ? Number(effectiveAtt(attacker) || 0) : Number(attacker.att || 0);
  if (typeof numericalSuperiorityBonus === "function" && defender) damage += Number(numericalSuperiorityBonus(attacker, defender) || 0);
  return Math.max(0, damage);
}

function expertExordiumEffectiveLifeF9T2b(unit) {
  if (!unit) return 0;
  if (typeof effectiveLife === "function") return Math.max(0, Number(effectiveLife(unit) || 0));
  return Math.max(0, Number(unit.currentHp != null ? unit.currentHp : unit.hp || 0) + Number(unit.currentDef != null ? unit.currentDef : unit.def || 0));
}

function expertExordiumEnemyPressureMaxF9T2b(player) {
  const enemies = typeof getEnemyPlayers === "function" ? (getEnemyPlayers(player) || []) : [];
  let best = 0;
  for (const side of enemies) best = Math.max(best, Number(state && state.pressure && state.pressure[side] || 0));
  return best;
}

function expertExordiumRelaySurvivalAssessmentF9T2b(player, coord, context = null) {
  const round = expertExordiumRoundF9T2b();
  const bucket = expertExordiumLossBucketF9T2b(player, coord, false);
  const rounds = bucket && Array.isArray(bucket.rounds) ? bucket.rounds : [];
  const lossesLast2 = rounds.filter(value => round - Number(value) <= 2).length;
  const lossesLast5 = rounds.filter(value => round - Number(value) <= 5).length;
  const enemies = expertExordiumEnemyUnitsF9T2(player);
  const allies = expertExordiumUnitsF9T2(player);
  let threatCount = 0;
  let threatDamage = 0;
  for (const enemy of enemies) {
    if (!enemy || !Array.isArray(enemy.pos) || enemy.type === "Struttura") continue;
    const move = typeof movementRangeFor === "function" ? Math.max(0, Number(movementRangeFor(enemy) || 0)) : 1;
    const distance = expertExordiumDistanceF9T2(enemy.pos, coord);
    if (distance <= move + 1) {
      threatCount += 1;
      threatDamage += Math.max(0, typeof effectiveAtt === "function" ? Number(effectiveAtt(enemy) || 0) : Number(enemy.att || 0));
    }
  }
  let supportCount = 0;
  for (const ally of allies) {
    if (!ally || !Array.isArray(ally.pos) || ally.type === "Struttura") continue;
    if (expertExordiumDistanceF9T2(ally.pos, coord) <= 2) supportCount += 1;
  }
  const bp = expertExordiumBastionBlueprintF9T2();
  const bastionDurability = Math.max(1, Number(bp && bp.hp || 3) + Number(bp && bp.def || 2));
  const pressureProfile = context && context.pressureProfile ? context.pressureProfile : (typeof botPressureProfileF9T0 === "function" ? botPressureProfileF9T0() : null);
  const maxRound = Math.max(round, Number(pressureProfile && pressureProfile.maxRound || 0));
  const roundsRemaining = maxRound ? Math.max(0, maxRound - round) : null;
  const isCenter = expertExordiumIsCenterF9T2c1(coord);
  const enemyPressure = expertExordiumEnemyPressureMaxF9T2b(player);
  const pressureWin = Number(pressureProfile && pressureProfile.pressureWin || 5);
  const requiredPs = Number(pressureProfile && pressureProfile.requiredPs || 0);
  const controlledPs = typeof countControlledPS === "function" ? Number(countControlledPS(player) || 0) : 0;
  const criticalValue = Boolean(isCenter && ((roundsRemaining != null && roundsRemaining <= 5) || enemyPressure >= Math.max(0, pressureWin - 1) || controlledPs >= Math.max(1, requiredPs - 1)));

  let classification = "SAFE";
  if (lossesLast5 >= 2 && (threatCount >= 2 || threatDamage >= bastionDurability) && supportCount < 2) classification = "UNSUSTAINABLE";
  else if (lossesLast2 >= 1 && (threatCount >= 1 || threatDamage >= bastionDurability * 0.7)) classification = "CRITICAL";
  else if (threatCount >= 2 || threatDamage >= bastionDurability) classification = "CONTESTED";
  const allowBuild = classification !== "UNSUSTAINABLE" || criticalValue;
  const recommendation = !allowBuild ? "do_not_rebuild_now" : (classification === "SAFE" ? "rebuild_now" : (classification === "CONTESTED" ? "rebuild_with_support" : "clear_or_support_before_rebuild"));
  return {
    psCoord:Array.isArray(coord) ? coord.slice(0, 3) : null,
    round,
    lossesLast2,
    lossesLast5,
    lastLossRound:bucket ? bucket.lastLossRound : null,
    threatCount,
    threatDamage,
    supportCount,
    bastionDurability,
    isCenter,
    roundsRemaining,
    enemyPressure,
    controlledPs,
    requiredPs,
    criticalValue,
    classification,
    allowBuild,
    recommendation
  };
}

function expertExordiumEmitDecisionF9T2b(player, kind, payload = {}) {
  const runtime = expertExordiumRuntimeF9T2(player);
  if (typeof expertEmitF9T1 === "function" && typeof EventTypes !== "undefined" && EventTypes.AI_EXPERT_DECISION) {
    expertEmitF9T1(EventTypes.AI_EXPERT_DECISION, player, {
      sequence:runtime ? runtime.sequence : null,
      decision:{ kind, source:"expert_exordium_f9t2b", ...payload }
    });
  }
}

function expertExordiumRelayCandidatesF9T2b(context) {
  const player = Number(context && context.player || 0);
  const base = expertExordiumRelayCandidatesF9T2(context) || [];
  const assessments = [];
  const accepted = [];
  for (const candidate of base) {
    const assessment = expertExordiumRelaySurvivalAssessmentF9T2b(player, candidate.ps.coord, context);
    assessments.push({ ...assessment, candidateScore:Number(candidate.score || 0), candidateAccepted:Boolean(assessment.allowBuild) });
    if (!assessment.allowBuild) continue;
    const adjustment = assessment.classification === "SAFE" ? 10 : (assessment.classification === "CONTESTED" ? -8 : (assessment.classification === "CRITICAL" ? -15 : -25));
    candidate.score += adjustment;
    candidate.diagnostics = { ...(candidate.diagnostics || {}), relaySurvival:assessment };
    accepted.push(candidate);
  }
  if (assessments.length) expertExordiumEmitDecisionF9T2b(player, "relay_survival_assessment_batch", { assessments });
  accepted.sort((a, b) => b.score - a.score || expertExordiumCoordKeyF9T2(a.ps.coord).localeCompare(expertExordiumCoordKeyF9T2(b.ps.coord)));
  return accepted;
}

function expertExordiumCanAttackTargetF9T2b(attacker, target) {
  if (!attacker || !target || attacker.alive === false || target.alive === false || attacker.acted) return false;
  if (Number(attacker.side) === Number(target.side) || attacker.faction !== "Exordium") return false;
  if (typeof canAttack === "function" && !canAttack(attacker)) return false;
  if (typeof areAdjacent === "function") return areAdjacent(attacker.pos, target.pos);
  return expertExordiumDistanceF9T2(attacker.pos, target.pos) === 1;
}

function expertExordiumReachableAfterTargetRemovedF9T2b(unit, targetCoord, target) {
  if (!unit || unit.alive === false || unit.acted || unit.type === "Struttura" || unit.type === "QG" || !Array.isArray(unit.pos)) return false;
  if (typeof canMove === "function" && !canMove(unit)) return false;
  const range = typeof movementRangeFor === "function" ? Math.max(0, Number(movementRangeFor(unit) || 0)) : 1;
  if (range <= 0) return false;
  if (typeof mapReachableCells === "function" && state && state.mapDefinition) {
    const occupiedKeys = new Set();
    const targetId = expertExordiumUnitIdF9T2b(target);
    for (const other of state.units || []) {
      if (!other || other.alive === false || !Array.isArray(other.pos) || other.type === "QG") continue;
      const otherId = expertExordiumUnitIdF9T2b(other);
      if (otherId === expertExordiumUnitIdF9T2b(unit) || otherId === targetId) continue;
      const key = typeof coordKey === "function" ? coordKey(other.pos) : expertExordiumCoordKeyF9T2(other.pos);
      occupiedKeys.add(key);
    }
    const reachable = mapReachableCells(state.mapDefinition, unit.pos, range, { occupiedKeys }) || [];
    return reachable.some(entry => expertExordiumSameCoordF9T2(entry && entry.coord ? entry.coord : entry, targetCoord));
  }
  return expertExordiumDistanceF9T2(unit.pos, targetCoord) <= range && (typeof isCellEnterable !== "function" || isCellEnterable(targetCoord));
}


// =====================================================
// F9T2d2 — CLEAR EFFECTIVE DAMAGE PREVIEW
// =====================================================
// CLEAR_OCCUPY_FORTIFY usa ora lo stesso modello puro ATT -> DEF -> HP
// introdotto per Varran. Gli attacchi sono simulati in sequenza e il candidato
// è valido soltanto se al massimo tre attaccanti distruggono davvero il presidio.

const EXPERT_EXORDIUM_CLEAR_DAMAGE_MODEL_F9T2D2 = "ATT_DEF_HP_NON_PIERCING";
const EXPERT_EXORDIUM_CLEAR_RECOMPUTE_LIMIT_F9T2D2 = 1;

function expertExordiumClearTargetStateF9T2d2(target) {
  if (!target) return null;
  return {
    ...target,
    currentDef:Math.max(0, Number(target.currentDef != null ? target.currentDef : target.def || 0)),
    currentHp:Math.max(1, Number(target.currentHp != null ? target.currentHp : (target.hp != null ? target.hp : 1)) || 1),
    alive:target.alive !== false
  };
}

function expertExordiumPreviewClearAttackF9T2d2(attacker, simulatedTarget, originalTarget = null) {
  if (!attacker || !simulatedTarget) return null;
  const effectiveAttack = typeof effectiveAtt === "function"
    ? Math.max(0, Number(effectiveAtt(attacker) || 0))
    : Math.max(0, Number(attacker.currentAtt != null ? attacker.currentAtt : attacker.att || 0));
  if (effectiveAttack <= 0) return null;

  // Un intercettore Prima Linea impedirebbe di colpire il presidio sul PS.
  // In questa hotfix non pianifichiamo una catena multi-bersaglio: l'attaccante
  // viene quindi escluso dalla sequenza di clear.
  if (originalTarget && typeof previewBasicAttackOutcome === "function") {
    const direct = previewBasicAttackOutcome(attacker, originalTarget, { effectiveAttack });
    const originalId = expertExordiumUnitIdF9T2b(originalTarget);
    if (direct && direct.intercepted && String(direct.targetUnitId || "") !== originalId) {
      return { intercepted:true, effectiveAttack, targetUnitId:String(direct.targetUnitId || "") };
    }
  }

  let outcome = null;
  if (typeof previewBasicAttackOutcome === "function") {
    outcome = previewBasicAttackOutcome(attacker, simulatedTarget, { effectiveAttack, ignoreInterception:true });
  } else {
    const amount = effectiveAttack + (typeof numericalSuperiorityBonus === "function" ? Math.max(0, Number(numericalSuperiorityBonus(attacker, simulatedTarget) || 0)) : 0);
    const currentDef = Math.max(0, Number(simulatedTarget.currentDef || 0));
    const currentHp = Math.max(0, Number(simulatedTarget.currentHp || 0));
    const defLoss = currentDef > 0 ? Math.min(currentDef, amount) : 0;
    const hpLoss = currentDef > 0 ? 0 : Math.min(currentHp, amount);
    outcome = {
      targetUnitId:expertExordiumUnitIdF9T2b(simulatedTarget),
      effectiveAttack,
      amount,
      defLoss,
      hpLoss,
      effectiveDamage:defLoss + hpLoss,
      overflowLost:currentDef > 0 ? Math.max(0, amount - defLoss) : 0,
      remainingDef:Math.max(0, currentDef - defLoss),
      remainingHp:Math.max(0, currentHp - hpLoss),
      targetDestroyed:Math.max(0, currentHp - hpLoss) <= 0
    };
  }
  if (!outcome) return null;
  return {
    intercepted:false,
    effectiveAttack,
    amount:Number(outcome.amount || outcome.effectiveAttack || 0),
    defLoss:Math.max(0, Number(outcome.defLoss || 0)),
    hpLoss:Math.max(0, Number(outcome.hpLoss || 0)),
    effectiveDamage:Math.max(0, Number(outcome.effectiveDamage || 0)),
    overflowLost:Math.max(0, Number(outcome.overflowLost || 0)),
    remainingDef:Math.max(0, Number(outcome.remainingDef || 0)),
    remainingHp:Math.max(0, Number(outcome.remainingHp || 0)),
    targetDestroyed:Boolean(outcome.targetDestroyed)
  };
}

function expertExordiumSelectClearAttackSequenceF9T2d2(attackerPool, target, maxAttackers = EXPERT_EXORDIUM_CLEAR_MAX_ATTACKERS_F9T2B) {
  const initial = expertExordiumClearTargetStateF9T2d2(target);
  if (!initial) return {
    attackers:[], predictedDefDamage:0, predictedHpDamage:0, predictedEffectiveDamage:0,
    predictedRemainingDef:0, predictedRemainingHp:0, predictedTargetDestroyed:false,
    interceptionBlockedCount:0, predictionModel:EXPERT_EXORDIUM_CLEAR_DAMAGE_MODEL_F9T2D2
  };
  const simulated = expertExordiumClearTargetStateF9T2d2(target);
  const remaining = (Array.isArray(attackerPool) ? attackerPool : []).slice();
  const selected = [];
  let predictedDefDamage = 0;
  let predictedHpDamage = 0;
  let interceptionBlockedCount = 0;
  const limit = Math.max(0, Math.min(EXPERT_EXORDIUM_CLEAR_MAX_ATTACKERS_F9T2B, Number(maxAttackers || 0)));

  while (selected.length < limit && simulated.currentHp > 0 && remaining.length) {
    const options = [];
    for (const entry of remaining) {
      const outcome = expertExordiumPreviewClearAttackF9T2d2(entry.unit, simulated, target);
      if (!outcome) continue;
      if (outcome.intercepted) {
        interceptionBlockedCount += 1;
        continue;
      }
      if (outcome.effectiveDamage <= 0) continue;
      options.push({ entry, outcome });
    }
    if (!options.length) break;
    const strippingDefense = simulated.currentDef > 0;
    options.sort((a, b) => {
      if (a.outcome.targetDestroyed !== b.outcome.targetDestroyed) return a.outcome.targetDestroyed ? -1 : 1;
      if (!strippingDefense && a.outcome.hpLoss !== b.outcome.hpLoss) return b.outcome.hpLoss - a.outcome.hpLoss;
      if (strippingDefense && a.outcome.defLoss !== b.outcome.defLoss) return b.outcome.defLoss - a.outcome.defLoss;
      if (strippingDefense && a.outcome.overflowLost !== b.outcome.overflowLost) return a.outcome.overflowLost - b.outcome.overflowLost;
      if (a.outcome.effectiveDamage !== b.outcome.effectiveDamage) return b.outcome.effectiveDamage - a.outcome.effectiveDamage;
      const valueDelta = Number(a.entry.value || 0) - Number(b.entry.value || 0);
      if (valueDelta) return valueDelta;
      return expertExordiumUnitIdF9T2b(a.entry.unit).localeCompare(expertExordiumUnitIdF9T2b(b.entry.unit));
    });
    const chosen = options[0];
    const beforeDef = simulated.currentDef;
    const beforeHp = simulated.currentHp;
    simulated.currentDef = chosen.outcome.remainingDef;
    simulated.currentHp = chosen.outcome.remainingHp;
    simulated.alive = simulated.currentHp > 0;
    predictedDefDamage += chosen.outcome.defLoss;
    predictedHpDamage += chosen.outcome.hpLoss;
    selected.push({
      ...chosen.entry,
      damage:chosen.outcome.effectiveDamage,
      effectiveAttack:chosen.outcome.effectiveAttack,
      predictedBeforeDef:beforeDef,
      predictedBeforeHp:beforeHp,
      predictedDefDamage:chosen.outcome.defLoss,
      predictedHpDamage:chosen.outcome.hpLoss,
      predictedEffectiveDamage:chosen.outcome.effectiveDamage,
      predictedAfterDef:chosen.outcome.remainingDef,
      predictedAfterHp:chosen.outcome.remainingHp,
      predictedTargetDestroyed:chosen.outcome.targetDestroyed,
      predictedOverflowLost:chosen.outcome.overflowLost
    });
    const index = remaining.indexOf(chosen.entry);
    if (index >= 0) remaining.splice(index, 1);
  }

  return {
    attackers:selected,
    predictedDefDamage,
    predictedHpDamage,
    predictedEffectiveDamage:predictedDefDamage + predictedHpDamage,
    predictedRemainingDef:simulated.currentDef,
    predictedRemainingHp:simulated.currentHp,
    predictedTargetDestroyed:simulated.currentHp <= 0,
    requiredAttackerIds:selected.map(entry => expertExordiumUnitIdF9T2b(entry.unit)),
    requiredAttackCount:selected.length,
    interceptionBlockedCount,
    initialDef:initial.currentDef,
    initialHp:initial.currentHp,
    predictionModel:EXPERT_EXORDIUM_CLEAR_DAMAGE_MODEL_F9T2D2
  };
}

function expertExordiumClearAttackStepsF9T2d2(sequence, targetId, targetCell, prefix = "clear_attack") {
  return (sequence && Array.isArray(sequence.attackers) ? sequence.attackers : []).map((entry, index) => ({
    id:`${prefix}_${index + 1}`,
    action:"attack_ps_target",
    unitId:expertExordiumUnitIdF9T2b(entry.unit),
    targetUnitId:targetId,
    targetCell:targetCell.slice(0, 3),
    expectedDamage:entry.predictedEffectiveDamage,
    predictionModel:EXPERT_EXORDIUM_CLEAR_DAMAGE_MODEL_F9T2D2,
    predictedBeforeDef:entry.predictedBeforeDef,
    predictedBeforeHp:entry.predictedBeforeHp,
    predictedDefDamage:entry.predictedDefDamage,
    predictedHpDamage:entry.predictedHpDamage,
    predictedEffectiveDamage:entry.predictedEffectiveDamage,
    predictedAfterDef:entry.predictedAfterDef,
    predictedAfterHp:entry.predictedAfterHp,
    predictedTargetDestroyed:entry.predictedTargetDestroyed
  }));
}

function expertExordiumApplyClearSequenceToPlanF9T2d2(plan, sequence, attackSteps, executedIds = []) {
  if (!plan) return;
  if (!plan.exordium) plan.exordium = {};
  const executed = Array.isArray(executedIds) ? executedIds.slice() : [];
  plan.exordium.clearPredictionModel = EXPERT_EXORDIUM_CLEAR_DAMAGE_MODEL_F9T2D2;
  plan.exordium.clearPredictedDefDamage = Number(sequence && sequence.predictedDefDamage || 0);
  plan.exordium.clearPredictedHpDamage = Number(sequence && sequence.predictedHpDamage || 0);
  plan.exordium.clearPredictedEffectiveDamage = Number(sequence && sequence.predictedEffectiveDamage || 0);
  plan.exordium.clearPredictedRemainingDef = Number(sequence && sequence.predictedRemainingDef || 0);
  plan.exordium.clearPredictedRemainingHp = Number(sequence && sequence.predictedRemainingHp || 0);
  plan.exordium.clearPredictedTargetDestroyed = Boolean(sequence && sequence.predictedTargetDestroyed);
  plan.exordium.clearRequiredAttackerIds = [...executed, ...(attackSteps || []).map(step => String(step.unitId || ""))].filter(Boolean);
  plan.exordium.clearRequiredAttackCount = plan.exordium.clearRequiredAttackerIds.length;
  if (!Array.isArray(plan.exordium.clearExecutedAttackerIds)) plan.exordium.clearExecutedAttackerIds = [];
  if (!Number.isFinite(Number(plan.exordium.clearActualDefDamage))) plan.exordium.clearActualDefDamage = 0;
  if (!Number.isFinite(Number(plan.exordium.clearActualHpDamage))) plan.exordium.clearActualHpDamage = 0;
  if (plan.exordium.clearPredictionMatched == null) plan.exordium.clearPredictionMatched = true;
}

function expertExordiumRecomputeClearAttackSequenceF9T2d2(player, reason = "sequence_invalidated") {
  const runtime = expertExordiumRuntimeF9T2(player);
  const plan = runtime && runtime.plan;
  if (!plan || plan.status !== "active" || plan.goal !== "EXORDIUM_CLEAR_OCCUPY_FORTIFY") return false;
  if (!plan.exordium) plan.exordium = {};
  const recomputes = Math.max(0, Number(plan.exordium.clearAttackSequenceRecomputed || 0));
  if (recomputes >= EXPERT_EXORDIUM_CLEAR_RECOMPUTE_LIMIT_F9T2D2) return false;
  const target = plan.targetUnitId ? expertExordiumUnitByIdF9T2b(plan.targetUnitId) : null;
  if (!target || target.alive === false || !Array.isArray(target.pos)) return false;
  const executedIds = Array.isArray(plan.exordium.clearExecutedAttackerIds) ? plan.exordium.clearExecutedAttackerIds.slice() : [];
  const remainingSlots = Math.max(0, EXPERT_EXORDIUM_CLEAR_MAX_ATTACKERS_F9T2B - executedIds.length);
  if (remainingSlots <= 0) return false;
  const pool = expertExordiumUnitsF9T2(player)
    .filter(unit => !executedIds.includes(expertExordiumUnitIdF9T2b(unit)) && expertExordiumCanAttackTargetF9T2b(unit, target))
    .map(unit => ({
      unit,
      value:Number(unit.cost || 0) * 2 + (unit.weight === "Pivot" || unit.weight === "Elite" ? 6 : 0)
    }));
  const sequence = expertExordiumSelectClearAttackSequenceF9T2d2(pool, target, remainingSlots);
  if (!sequence.predictedTargetDestroyed || !sequence.attackers.length) return false;

  const targetCell = Array.isArray(plan.targetCell) ? plan.targetCell.slice(0, 3) : target.pos.slice(0, 3);
  const replacementSteps = expertExordiumClearAttackStepsF9T2d2(sequence, plan.targetUnitId, targetCell, `clear_recompute_${recomputes + 1}_attack`);
  const prefix = plan.orderedSteps.slice(0, plan.currentStep);
  const suffix = plan.orderedSteps.slice(plan.currentStep).filter(step => step && step.action !== "attack_ps_target");
  plan.orderedSteps = [...prefix, ...replacementSteps, ...suffix];
  plan.exordium.clearAttackSequenceRecomputed = recomputes + 1;
  expertExordiumApplyClearSequenceToPlanF9T2d2(plan, sequence, replacementSteps, executedIds);
  plan.reservedActions = [
    ...executedIds.map(id => `attack:${id}`),
    ...replacementSteps.map(step => `attack:${step.unitId}`),
    ...(Array.isArray(plan.reservedActions) ? plan.reservedActions.filter(value => !String(value).startsWith("attack:")) : [])
  ];
  expertExordiumEmitDecisionF9T2c1(player, "clear_attack_sequence_recomputed", {
    source:"expert_exordium_f9t2d2",
    featureOrigin:"clear_occupy_fortify",
    featureRevision:"F9T2d2",
    planId:plan.id,
    reason:String(reason || "sequence_invalidated"),
    targetUnitId:plan.targetUnitId,
    requiredAttackerIds:replacementSteps.map(step => step.unitId),
    predictedDefDamage:sequence.predictedDefDamage,
    predictedHpDamage:sequence.predictedHpDamage,
    predictedTargetDestroyed:sequence.predictedTargetDestroyed,
    recomputeCount:plan.exordium.clearAttackSequenceRecomputed
  });
  return true;
}

function expertExordiumRecordClearAttackResultF9T2d2(player, plan, step, target, beforeDef, beforeHp) {
  if (!plan || !step || !plan.exordium) return null;
  const afterDef = target && target.alive !== false ? Math.max(0, Number(target.currentDef || 0)) : 0;
  const afterHp = target && target.alive !== false ? Math.max(0, Number(target.currentHp || 0)) : 0;
  const actualDefDamage = Math.max(0, beforeDef - afterDef);
  const actualHpDamage = Math.max(0, beforeHp - afterHp);
  const actualDestroyed = !target || target.alive === false || afterHp <= 0;
  plan.exordium.clearActualDefDamage = Number(plan.exordium.clearActualDefDamage || 0) + actualDefDamage;
  plan.exordium.clearActualHpDamage = Number(plan.exordium.clearActualHpDamage || 0) + actualHpDamage;
  plan.exordium.clearActualTargetDestroyed = actualDestroyed;
  if (!Array.isArray(plan.exordium.clearExecutedAttackerIds)) plan.exordium.clearExecutedAttackerIds = [];
  const attackerId = String(step.unitId || "");
  if (attackerId && !plan.exordium.clearExecutedAttackerIds.includes(attackerId)) plan.exordium.clearExecutedAttackerIds.push(attackerId);
  const stepMatched = actualDefDamage === Number(step.predictedDefDamage || 0)
    && actualHpDamage === Number(step.predictedHpDamage || 0)
    && actualDestroyed === Boolean(step.predictedTargetDestroyed);
  plan.exordium.clearPredictionMatched = Boolean(plan.exordium.clearPredictionMatched !== false && stepMatched);
  if (actualDestroyed) {
    const predictedDestroyed = Boolean(plan.exordium.clearPredictedTargetDestroyed);
    plan.exordium.clearPredictionMatched = Boolean(plan.exordium.clearPredictionMatched && predictedDestroyed);
  }
  expertExordiumEmitDecisionF9T2c1(player, "clear_effective_damage_step", {
    source:"expert_exordium_f9t2d2",
    featureOrigin:"clear_occupy_fortify",
    featureRevision:"F9T2d2",
    planId:plan.id,
    stepId:step.id,
    attackerId,
    targetUnitId:step.targetUnitId,
    predictionModel:EXPERT_EXORDIUM_CLEAR_DAMAGE_MODEL_F9T2D2,
    predictedDefDamage:Number(step.predictedDefDamage || 0),
    actualDefDamage,
    predictedHpDamage:Number(step.predictedHpDamage || 0),
    actualHpDamage,
    predictedTargetDestroyed:Boolean(step.predictedTargetDestroyed),
    actualTargetDestroyed:actualDestroyed,
    predictionMatched:stepMatched
  });
  if (actualDestroyed) {
    expertExordiumEmitDecisionF9T2c1(player, "clear_effective_damage_sequence_result", {
      source:"expert_exordium_f9t2d2",
      featureOrigin:"clear_occupy_fortify",
      featureRevision:"F9T2d2",
      planId:plan.id,
      targetUnitId:step.targetUnitId,
      predictionModel:EXPERT_EXORDIUM_CLEAR_DAMAGE_MODEL_F9T2D2,
      requiredAttackerIds:plan.exordium.clearRequiredAttackerIds || [],
      executedAttackerIds:plan.exordium.clearExecutedAttackerIds || [],
      predictedDefDamage:Number(plan.exordium.clearPredictedDefDamage || 0),
      actualDefDamage:Number(plan.exordium.clearActualDefDamage || 0),
      predictedHpDamage:Number(plan.exordium.clearPredictedHpDamage || 0),
      actualHpDamage:Number(plan.exordium.clearActualHpDamage || 0),
      predictedTargetDestroyed:Boolean(plan.exordium.clearPredictedTargetDestroyed),
      actualTargetDestroyed:true,
      predictionMatched:Boolean(plan.exordium.clearPredictionMatched),
      sequenceRecomputed:Number(plan.exordium.clearAttackSequenceRecomputed || 0)
    });
  }
  return { actualDefDamage, actualHpDamage, actualDestroyed, stepMatched };
}

function expertExordiumClearCandidatesF9T2b(context) {
  const player = Number(context && context.player || 0);
  const bp = expertExordiumBastionBlueprintF9T2();
  if (!player || !bp) return [];
  const ownUnits = expertExordiumUnitsF9T2(player);
  const psCells = expertExordiumPsCellsF9T2a().slice().sort((a, b) => {
    const aTarget = typeof getUnitAt === "function" ? getUnitAt(a.coord) : null;
    const bTarget = typeof getUnitAt === "function" ? getUnitAt(b.coord) : null;
    const aEnemy = aTarget && aTarget.alive !== false && Number(aTarget.side) !== player && aTarget.type !== "QG" ? 1 : 0;
    const bEnemy = bTarget && bTarget.alive !== false && Number(bTarget.side) !== player && bTarget.type !== "QG" ? 1 : 0;
    if (aEnemy !== bEnemy) return bEnemy - aEnemy;
    const aCenter = expertExordiumIsCenterF9T2c1(a.coord) ? 1 : 0;
    const bCenter = expertExordiumIsCenterF9T2c1(b.coord) ? 1 : 0;
    if (aCenter !== bCenter) return bCenter - aCenter;
    return expertExordiumCoordKeyF9T2(a.coord).localeCompare(expertExordiumCoordKeyF9T2(b.coord));
  });
  const candidates = [];
  const audits = [];
  const availableEnergy = Number(state && state.energy && state.energy[player] || 0);
  const maxCandidates = typeof EXPERT_AI_LIMITS_F9T1 !== "undefined" ? Math.max(1, Number(EXPERT_AI_LIMITS_F9T1.maxCandidates || 64)) : 64;

  for (const ps of psCells) {
    const target = typeof getUnitAt === "function" ? getUnitAt(ps.coord) : null;
    const reasons = [];
    if (!target || target.alive === false || Number(target.side) === player || target.type === "QG") reasons.push("no_enemy_ps_presidium");
    const targetLife = target && !reasons.length ? expertExordiumEffectiveLifeF9T2b(target) : 0;
    const attackerPool = target && !reasons.length
      ? ownUnits.filter(unit => expertExordiumCanAttackTargetF9T2b(unit, target)).map(unit => ({
          unit,
          value:Number(unit.cost || 0) * 2 + (unit.weight === "Pivot" || unit.weight === "Elite" ? 6 : 0)
        }))
      : [];
    const sequence = target && !reasons.length
      ? expertExordiumSelectClearAttackSequenceF9T2d2(attackerPool, target, EXPERT_EXORDIUM_CLEAR_MAX_ATTACKERS_F9T2B)
      : {
          attackers:[], predictedDefDamage:0, predictedHpDamage:0, predictedEffectiveDamage:0,
          predictedRemainingDef:0, predictedRemainingHp:0, predictedTargetDestroyed:false,
          requiredAttackerIds:[], requiredAttackCount:0, interceptionBlockedCount:0,
          initialDef:0, initialHp:0, predictionModel:EXPERT_EXORDIUM_CLEAR_DAMAGE_MODEL_F9T2D2
        };
    const attackers = sequence.attackers || [];
    const reservedDamage = Number(sequence.predictedEffectiveDamage || 0); // legacy: danno effettivo previsto, non somma ATT.
    if (target && !reasons.length && !sequence.predictedTargetDestroyed) {
      reasons.push(sequence.predictedRemainingDef <= 0 && sequence.predictedRemainingHp > 0
        ? "insufficient_hp_damage_after_def_break"
        : "no_effective_kill_sequence");
    }
    const attackerIds = new Set(attackers.map(entry => expertExordiumUnitIdF9T2b(entry.unit)));

    const survival = target && !reasons.length
      ? expertExordiumRelaySurvivalAssessmentF9T2b(player, ps.coord, context)
      : {
          psCoord:ps.coord.slice(0, 3), lossesLast2:0, lossesLast5:0,
          classification:"NOT_EVALUATED", allowBuild:true,
          isCenter:expertExordiumIsCenterF9T2c1(ps.coord), criticalValue:false
        };
    const builders = target && !reasons.length
      ? ownUnits.filter(unit => !attackerIds.has(expertExordiumUnitIdF9T2b(unit)) && expertExordiumCanUseBuilderAfterReleaseF9T2a(unit, ps.coord, target))
      : [];
    builders.sort((a, b) => Number(a.cost || 0) - Number(b.cost || 0) || expertExordiumUnitIdF9T2b(a).localeCompare(expertExordiumUnitIdF9T2b(b)));
    const source = builders.length && survival.allowBuild ? expertExordiumCardSourceF9T2(player, bp, ps.coord) : null;

    const occupiers = target && !reasons.length
      ? ownUnits.filter(unit => !attackerIds.has(expertExordiumUnitIdF9T2b(unit)) && unit.type !== "Struttura" && unit.type !== "QG" && unit.acted !== true && expertExordiumReachableAfterTargetRemovedF9T2b(unit, ps.coord, target))
      : [];
    occupiers.sort((a, b) => Number(a.cost || 0) - Number(b.cost || 0) || expertExordiumDistanceF9T2(a.pos, ps.coord) - expertExordiumDistanceF9T2(b.pos, ps.coord) || expertExordiumUnitIdF9T2b(a).localeCompare(expertExordiumUnitIdF9T2b(b)));

    let conversionMode = null;
    if (source && builders.length) conversionMode = "BASTION";
    else if (occupiers.length) conversionMode = "GARRISON";
    if (target && !reasons.length && !conversionMode) reasons.push(survival.allowBuild ? "no_fortification_or_garrison" : "relay_survival_rejected_and_no_garrison");

    audits.push({
      psCoord:ps.coord.slice(0, 3),
      targetId:target ? expertExordiumUnitIdF9T2b(target) : null,
      targetType:target ? String(target.type || "") : null,
      targetLife,
      targetInitialDef:Number(sequence.initialDef || 0),
      targetInitialHp:Number(sequence.initialHp || 0),
      attackerCount:attackers.length,
      attackerIds:attackers.map(entry => expertExordiumUnitIdF9T2b(entry.unit)),
      reservedDamage,
      predictedDefDamage:Number(sequence.predictedDefDamage || 0),
      predictedHpDamage:Number(sequence.predictedHpDamage || 0),
      predictedEffectiveDamage:Number(sequence.predictedEffectiveDamage || 0),
      predictedRemainingDef:Number(sequence.predictedRemainingDef || 0),
      predictedRemainingHp:Number(sequence.predictedRemainingHp || 0),
      predictedTargetDestroyed:Boolean(sequence.predictedTargetDestroyed),
      requiredAttackerIds:Array.isArray(sequence.requiredAttackerIds) ? sequence.requiredAttackerIds : [],
      requiredAttackCount:Number(sequence.requiredAttackCount || 0),
      predictionModel:EXPERT_EXORDIUM_CLEAR_DAMAGE_MODEL_F9T2D2,
      interceptionBlockedCount:Number(sequence.interceptionBlockedCount || 0),
      builderCount:builders.length,
      occupierCount:occupiers.length,
      availableEnergy,
      conversionMode,
      survivalClassification:survival.classification,
      lossesLast2:survival.lossesLast2,
      lossesLast5:survival.lossesLast5,
      candidateValid:reasons.length === 0,
      rejectionReason:reasons[0] || "valid_candidate",
      rejectionReasons:reasons
    });
    if (reasons.length || candidates.length >= maxCandidates) continue;

    const isCenter = expertExordiumIsCenterF9T2c1(ps.coord);
    let score = 80 + Math.min(30, (Number(sequence.initialHp || 0) + Number(sequence.initialDef || 0)) * 3) + (isCenter ? 30 : 0) + (target.type === "Struttura" ? 12 : 0);
    score += conversionMode === "BASTION" ? 18 : 8;
    score -= attackers.length * 3;
    if (survival.classification === "CRITICAL") score -= 10;
    if (survival.classification === "CONTESTED") score -= 5;
    candidates.push({
      ps,
      target,
      attackers,
      reservedDamage,
      sequence,
      conversionMode,
      builder:conversionMode === "BASTION" ? builders[0] : null,
      source:conversionMode === "BASTION" ? source : null,
      occupier:conversionMode === "GARRISON" ? occupiers[0] : null,
      occupierIds:occupiers.map(unit => expertExordiumUnitIdF9T2b(unit)),
      bp,
      survival,
      score,
      diagnostics:{
        isCenter,
        targetLife,
        reservedDamage,
        attackerCount:attackers.length,
        conversionMode,
        predictionModel:EXPERT_EXORDIUM_CLEAR_DAMAGE_MODEL_F9T2D2,
        predictedDefDamage:sequence.predictedDefDamage,
        predictedHpDamage:sequence.predictedHpDamage,
        predictedRemainingDef:sequence.predictedRemainingDef,
        predictedRemainingHp:sequence.predictedRemainingHp,
        predictedTargetDestroyed:sequence.predictedTargetDestroyed,
        requiredAttackerIds:sequence.requiredAttackerIds
      }
    });
    if (isCenter || target.type === "Struttura" || score >= 110) {
      const runtime = expertExordiumRuntimeF9T2(player);
      if (runtime) runtime.candidateScanStoppedEarly = true;
      break;
    }
  }

  if (audits.length) {
    expertExordiumEmitCandidateAuditBatchF9T2c3(
      player,
      "clearOccupyFortify",
      "territorial_conversion_candidate_audit_batch",
      "expert_exordium_f9t2d2",
      audits,
      12
    );
  }
  candidates.sort((a, b) => b.score - a.score || expertExordiumCoordKeyF9T2(a.ps.coord).localeCompare(expertExordiumCoordKeyF9T2(b.ps.coord)));
  return candidates;
}

function expertExordiumCreateClearPlanF9T2b(context, candidate) {
  const player = Number(context && context.player || 0);
  const turn = Number(context && context.turn || 0);
  const targetCell = candidate.ps.coord.slice(0, 3);
  const targetId = expertExordiumUnitIdF9T2b(candidate.target);
  const sequence = candidate.sequence || expertExordiumSelectClearAttackSequenceF9T2d2(candidate.attackers || [], candidate.target, EXPERT_EXORDIUM_CLEAR_MAX_ATTACKERS_F9T2B);
  if (!sequence || !sequence.predictedTargetDestroyed) return null;
  const attackSteps = expertExordiumClearAttackStepsF9T2d2(sequence, targetId, targetCell);
  const conversionStep = candidate.conversionMode === "BASTION"
    ? {
        id:"fortify_cleared_ps", action:"build_roster_clear_ps", blueprintId:candidate.bp.id,
        targetCell, builderId:expertExordiumUnitIdF9T2b(candidate.builder), source:candidate.source.source,
        cardUid:candidate.source.cardUid || null, starterRole:candidate.source.starterRole || null,
        starterCardUid:candidate.source.starterCardUid || null, requiredEnergy:candidate.source.cost
      }
    : {
        id:"occupy_cleared_ps", action:"occupy_ps",
        unitId:expertExordiumUnitIdF9T2b(candidate.occupier), targetCell
      };
  const primaryActorId = attackSteps.length ? attackSteps[0].unitId : (conversionStep.unitId || conversionStep.builderId || null);
  const supportActorIds = [...new Set([
    ...attackSteps.slice(1).map(step => step.unitId),
    conversionStep.unitId || null,
    conversionStep.builderId || null
  ].filter(Boolean))];
  const requiredEnergy = candidate.source ? Number(candidate.source.cost || 0) : 0;
  const created = typeof expertCreateMicroPlanF9T1 === "function" ? expertCreateMicroPlanF9T1({
    id:`exordium-clear-occupy-fortify-${turn}-${expertExordiumCoordKeyF9T2(targetCell)}`,
    faction:"Exordium",
    goal:"EXORDIUM_CLEAR_OCCUPY_FORTIFY",
    targetCell,
    targetPs:targetCell,
    targetUnitId:targetId,
    primaryActorId,
    supportActorIds,
    requiredEnergy,
    reservedEnergy:requiredEnergy,
    reservedActions:[...attackSteps.map(step => `attack:${step.unitId}`), `${candidate.conversionMode.toLowerCase()}:${conversionStep.unitId || conversionStep.builderId}`],
    orderedSteps:[...attackSteps, conversionStep],
    expectedResult:{
      targetRemoved:true,
      psOccupiedOrFortified:true,
      expectedPsDelta:1,
      expectedMaterialDelta:1,
      conversionMode:candidate.conversionMode,
      targetPs:targetCell,
      predictionModel:EXPERT_EXORDIUM_CLEAR_DAMAGE_MODEL_F9T2D2,
      predictedDefDamage:sequence.predictedDefDamage,
      predictedHpDamage:sequence.predictedHpDamage,
      predictedTargetDestroyed:sequence.predictedTargetDestroyed
    },
    abortConditions:[
      "hq_occupation_risk_direct",
      "required_attacker_unavailable",
      "sequence_invalidated",
      "target_survives_effective_sequence",
      "target_ps_not_cleared",
      "conversion_actor_unavailable",
      "reserved_energy_unavailable"
    ],
    fallbackPlan:"advanced_f9t0",
    status:"proposed"
  }) : { plan:null, validation:{ ok:false, errors:["microplan_factory_unavailable"] } };
  if (!created.validation.ok) return null;
  created.plan.exordium = {
    contractVersion:"F9T2D2A-EXORDIUM-1",
    doctrine:"territorial_conversion",
    featureRevision:"F9T2d2",
    conversionMode:candidate.conversionMode,
    candidateScore:Number(candidate.score.toFixed(3)),
    reservedDamage:Number(sequence.predictedEffectiveDamage || 0),
    attackerIds:attackSteps.map(step => step.unitId),
    occupierCandidateIds:Array.isArray(candidate.occupierIds) ? candidate.occupierIds.slice(0, 8) : [],
    conversionActorInitialId:conversionStep.unitId || conversionStep.builderId || null,
    conversionActorCurrentId:conversionStep.unitId || conversionStep.builderId || null,
    conversionActorReassignments:0,
    conversionCommitmentActive:false,
    relaySurvival:candidate.survival,
    diagnostics:candidate.diagnostics,
    clearAttackSequenceRecomputed:0,
    clearExecutedAttackerIds:[],
    clearActualDefDamage:0,
    clearActualHpDamage:0,
    clearActualTargetDestroyed:false,
    clearPredictionMatched:true
  };
  expertExordiumApplyClearSequenceToPlanF9T2d2(created.plan, sequence, attackSteps, []);
  return created.plan;
}

function expertExordiumCreateRelayPlanF9T2b(context, candidate) {
  const plan = expertExordiumCreateRelayPlanF9T2(context, candidate);
  if (!plan) return null;
  plan.exordium = {
    ...(plan.exordium || {}),
    contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2B,
    doctrine:"bastion_relay",
    relaySurvival:candidate.diagnostics && candidate.diagnostics.relaySurvival ? candidate.diagnostics.relaySurvival : null
  };
  return plan;
}

function expertExordiumModuleF9T2b(context) {
  if (!context || context.faction !== "Exordium") return { moduleId:"expert-exordium-f9t2b", faction:"Exordium", plan:null, status:"not_applicable", reason:"wrong_faction" };
  const hqRisk = context.common && context.common.hqOccupationRisk ? context.common.hqOccupationRisk.risk : "unknown";
  if (hqRisk === "occupied" || hqRisk === "direct") return { moduleId:"expert-exordium-f9t2b", faction:"Exordium", plan:null, status:"fallback", reason:"hq_occupation_risk_priority" };
  const runtime = expertExordiumRuntimeF9T2(context.player);
  const clearCandidates = expertExordiumClearCandidatesF9T2b(context);
  if (runtime) runtime.candidateCount = Number(runtime.candidateCount || 0) + clearCandidates.length;
  if (clearCandidates.length) {
    if (runtime) runtime.discardedCandidates = Number(runtime.discardedCandidates || 0) + Math.max(0, clearCandidates.length - 1);
    const plan = expertExordiumCreateClearPlanF9T2b(context, clearCandidates[0]);
    if (plan) return { moduleId:"expert-exordium-f9t2b", faction:"Exordium", plan, status:"microplan_selected", reason:"clear_occupy_fortify_available", candidateCount:clearCandidates.length, contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2B };
  }
  const relayCandidates = expertExordiumRelayCandidatesF9T2b(context);
  if (runtime) {
    runtime.candidateCount = Number(runtime.candidateCount || 0) + relayCandidates.length;
    runtime.discardedCandidates = Number(runtime.discardedCandidates || 0) + Math.max(0, relayCandidates.length - 1);
  }
  if (relayCandidates.length) {
    const plan = expertExordiumCreateRelayPlanF9T2b(context, relayCandidates[0]);
    if (plan) return { moduleId:"expert-exordium-f9t2b", faction:"Exordium", plan, status:"microplan_selected", reason:"bastion_relay_survival_approved", candidateCount:relayCandidates.length, contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2B };
  }
  return { moduleId:"expert-exordium-f9t2b", faction:"Exordium", plan:null, status:"fallback", reason:"no_territorial_conversion_or_safe_relay_candidate", candidateCount:0, contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2B };
}

function expertExordiumNormalizeClearStepF9T2b(player) {
  const runtime = expertExordiumRuntimeF9T2(player);
  if (!runtime || !runtime.plan || runtime.plan.goal !== "EXORDIUM_CLEAR_OCCUPY_FORTIFY" || runtime.plan.status !== "active") return null;
  let step = runtime.plan.orderedSteps[runtime.plan.currentStep] || null;
  let guard = 0;
  while (step && step.action === "attack_ps_target" && guard < EXPERT_EXORDIUM_CLEAR_MAX_ATTACKERS_F9T2B) {
    guard += 1;
    const target = expertExordiumUnitByIdF9T2b(step.targetUnitId);
    const stillBlocks = target && target.alive !== false && Array.isArray(target.pos) && expertExordiumSameCoordF9T2(target.pos, step.targetCell);
    if (stillBlocks) break;
    if (typeof expertAdvancePlanStepF9T2 === "function") expertAdvancePlanStepF9T2(player, { stepId:step.id, action:step.action, result:"target_already_removed", targetUnitId:step.targetUnitId });
    step = runtime.plan && runtime.plan.status === "active" ? runtime.plan.orderedSteps[runtime.plan.currentStep] || null : null;
  }
  return step;
}

function expertExordiumTryClearPlanActionF9T2b(unit) {
  if (!unit || unit.faction !== "Exordium") return false;
  const player = Number(unit.side || 0);
  const runtime = expertExordiumRuntimeF9T2(player);
  const step = expertExordiumNormalizeClearStepF9T2b(player);
  if (!runtime || !step || !runtime.plan || runtime.plan.goal !== "EXORDIUM_CLEAR_OCCUPY_FORTIFY") return false;
  const plan = runtime.plan;

  if (step.action === "attack_ps_target") {
    if (expertExordiumUnitIdF9T2b(unit) !== String(step.unitId || "")) return false;
    const target = expertExordiumUnitByIdF9T2b(step.targetUnitId);
    if (!target || target.alive === false || !expertExordiumSameCoordF9T2(target.pos, step.targetCell)) {
      if (plan.exordium) {
        plan.exordium.clearActualTargetDestroyed = true;
        plan.exordium.clearTargetRemovedByExternalAction = true;
      }
      expertExordiumNormalizeClearStepF9T2b(player);
      return false;
    }
    if (!expertExordiumCanAttackTargetF9T2b(unit, target) || typeof attackUnit !== "function") {
      if (expertExordiumRecomputeClearAttackSequenceF9T2d2(player, "required_attacker_unavailable")) return false;
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "required_attacker_unavailable", { unitId:expertExordiumUnitIdF9T2b(unit), targetUnitId:step.targetUnitId });
      return false;
    }
    const beforeDef = Math.max(0, Number(target.currentDef != null ? target.currentDef : target.def || 0));
    const beforeHp = Math.max(0, Number(target.currentHp != null ? target.currentHp : target.hp || 0));
    attackUnit(unit, target);
    if (typeof endUnitAction === "function" && unit.alive !== false) endUnitAction(unit);
    const attackResult = expertExordiumRecordClearAttackResultF9T2d2(player, plan, step, target, beforeDef, beforeHp);
    if (target.alive === false) {
      expertExordiumMarkTerritorialMetricF9T2c3(player, "psClearedDuringExpertPlan");
      expertExordiumMarkTerritorialMetricF9T2c3(player, "psClearedDirectlyByExpertStep");
    }
    if (typeof expertAdvancePlanStepF9T2 === "function") expertAdvancePlanStepF9T2(player, {
      stepId:step.id,
      action:step.action,
      result:target.alive === false ? "ps_presidium_destroyed" : "effective_attack_step_completed",
      attackerId:expertExordiumUnitIdF9T2b(unit),
      targetUnitId:step.targetUnitId,
      predictionModel:EXPERT_EXORDIUM_CLEAR_DAMAGE_MODEL_F9T2D2,
      predictedDefDamage:Number(step.predictedDefDamage || 0),
      actualDefDamage:Number(attackResult && attackResult.actualDefDamage || 0),
      predictedHpDamage:Number(step.predictedHpDamage || 0),
      actualHpDamage:Number(attackResult && attackResult.actualHpDamage || 0),
      predictedTargetDestroyed:Boolean(step.predictedTargetDestroyed),
      actualTargetDestroyed:Boolean(attackResult && attackResult.actualDestroyed),
      predictionMatched:Boolean(attackResult && attackResult.stepMatched)
    });
    const next = expertExordiumNormalizeClearStepF9T2b(player);
    if (next && next.action !== "attack_ps_target" && target.alive !== false) {
      if (!expertExordiumRecomputeClearAttackSequenceF9T2d2(player, "predicted_sequence_did_not_destroy_target")) {
        if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "target_survives_effective_sequence", {
          targetUnitId:step.targetUnitId,
          remainingDef:Math.max(0, Number(target.currentDef || 0)),
          remainingHp:Math.max(0, Number(target.currentHp || 0)),
          predictedDefDamage:Number(plan.exordium && plan.exordium.clearPredictedDefDamage || 0),
          actualDefDamage:Number(plan.exordium && plan.exordium.clearActualDefDamage || 0),
          predictedHpDamage:Number(plan.exordium && plan.exordium.clearPredictedHpDamage || 0),
          actualHpDamage:Number(plan.exordium && plan.exordium.clearActualHpDamage || 0)
        });
      }
    }
    return true;
  }

  if (step.action === "occupy_ps") {
    if (expertExordiumUnitIdF9T2b(unit) !== String(step.unitId || "")) return false;
    if (typeof getUnitAt === "function" && getUnitAt(step.targetCell)) {
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "target_ps_not_cleared", { targetCell:step.targetCell });
      return false;
    }
    const moves = typeof movableCells === "function" ? movableCells(unit) || [] : [];
    const targetMove = moves.find(coord => expertExordiumSameCoordF9T2(coord, step.targetCell)) || null;
    if (!targetMove || typeof botMoveUnitF9T0 !== "function") {
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "conversion_actor_unavailable", { unitId:step.unitId, targetCell:step.targetCell });
      return false;
    }
    const from = unit.pos.slice(0, 3);
    botMoveUnitF9T0(unit, targetMove);
    if (typeof finishBotMove === "function") finishBotMove(unit);
    else unit.acted = true;
    expertExordiumMarkTerritorialMetricF9T2c3(player, "psClearedDuringExpertPlan");
    expertExordiumMarkTerritorialMetricF9T2c3(player, "psOccupiedAfterClear");
    if (typeof expertAdvancePlanStepF9T2 === "function") expertAdvancePlanStepF9T2(player, { stepId:step.id, action:step.action, result:"ps_occupied_after_clear", unitId:step.unitId, from, to:step.targetCell });
    expertExordiumEmitDecisionF9T2b(player, "territorial_conversion_result", { targetPs:step.targetCell, conversionMode:"GARRISON", psCleared:true, psOccupied:true, psFortified:false, predictionModel:EXPERT_EXORDIUM_CLEAR_DAMAGE_MODEL_F9T2D2 });
    return true;
  }

  if (step.action === "build_roster_clear_ps") {
    if (expertExordiumUnitIdF9T2b(unit) !== String(step.builderId || "")) return false;
    if (typeof getUnitAt === "function" && getUnitAt(step.targetCell)) {
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "target_ps_not_cleared", { targetCell:step.targetCell });
      return false;
    }
    const assessment = expertExordiumRelaySurvivalAssessmentF9T2b(player, step.targetCell, runtime.context || null);
    if (!assessment.allowBuild) {
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "relay_survival_rejected_after_clear", { assessment });
      return false;
    }
    const bp = expertExordiumBastionBlueprintF9T2();
    if (!bp || !expertExordiumCanUseBuilderF9T2(unit, step.targetCell)) {
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "conversion_actor_unavailable", { builderId:step.builderId });
      return false;
    }
    const cost = Number(step.requiredEnergy || 0);
    if (Number(state && state.energy && state.energy[player] || 0) < cost) {
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "reserved_energy_unavailable", { requiredEnergy:cost });
      return false;
    }
    const choice = {
      player,
      bp,
      builder:unit,
      coord:step.targetCell.slice(0, 3),
      cost,
      source:step.source,
      cardUid:step.cardUid,
      starterRole:step.starterRole,
      starterCardUid:step.starterCardUid,
      score:999,
      expertPlanId:runtime.plan.id
    };
    const done = typeof executeBotRosterPlay === "function" ? executeBotRosterPlay(player, choice) : false;
    if (!done) return false;
    expertExordiumMarkTerritorialMetricF9T2c3(player, "psClearedDuringExpertPlan");
    expertExordiumMarkTerritorialMetricF9T2c3(player, "psFortifiedAfterClear");
    if (typeof expertAdvancePlanStepF9T2 === "function") expertAdvancePlanStepF9T2(player, { stepId:step.id, action:step.action, result:"ps_fortified_after_clear", builderId:step.builderId, targetCell:step.targetCell, blueprintId:bp.id });
    expertExordiumEmitDecisionF9T2b(player, "territorial_conversion_result", { targetPs:step.targetCell, conversionMode:"BASTION", psCleared:true, psOccupied:false, psFortified:true, predictionModel:EXPERT_EXORDIUM_CLEAR_DAMAGE_MODEL_F9T2D2 });
    return true;
  }
  return false;
}

function expertExordiumUnitPriorityBonusF9T2(unit) {
  if (!unit || unit.faction !== "Exordium") return 0;
  const step = expertExordiumNormalizeClearStepF9T2b(unit.side) || expertExordiumCurrentStepF9T2(unit.side);
  if (!step) return 0;
  const unitId = expertExordiumUnitIdF9T2b(unit);
  if (unitId === String(step.unitId || step.builderId || "")) return 1000;
  return 0;
}

function expertExordiumTryPlannedUnitActionF9T2(unit) {
  return expertExordiumTryClearPlanActionF9T2b(unit);
}

// Override F9T2a: mantiene il Relay pre-acquisto e ignora correttamente i piani CLEAR.
function expertExordiumTryPrePurchasePlanStepF9T2a(player) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const step = expertExordiumCurrentStepF9T2(player);
  if (!runtime || !step || step.action !== "advance_unit_pre_purchase") return false;
  const unit = expertExordiumUnitsF9T2(player).find(candidate => expertExordiumUnitIdF9T2b(candidate) === String(step.unitId || "")) || null;
  if (!expertExordiumIsMobileGuardF9T2a(unit, player) || !expertExordiumSameCoordF9T2(unit.pos, step.originPs)) {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "release_actor_unavailable", { stepId:step.id, unitId:step.unitId });
    return false;
  }
  const release = expertExordiumReleaseMoveF9T2a(unit, step.targetCell);
  const planned = Array.isArray(step.plannedCell) && release ? release.entries.find(entry => expertExordiumSameCoordF9T2(entry.coord, step.plannedCell)) || null : null;
  const best = planned || (release && release.best) || null;
  if (!best || best.gain < Math.max(1, Number(step.minimumDistanceGain || 1))) {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "release_destination_unavailable", { stepId:step.id, unitId:step.unitId });
    return false;
  }
  const before = typeof expertCaptureUnitDecisionF9T1 === "function" ? expertCaptureUnitDecisionF9T1(unit) : { unitId:expertExordiumUnitIdF9T2b(unit), position:unit.pos.slice(0, 3), energy:Number(state.energy[player] || 0) };
  if (typeof botMoveUnitF9T0 !== "function") return false;
  botMoveUnitF9T0(unit, best.coord);
  if (typeof finishBotMove === "function") finishBotMove(unit); else unit.acted = true;
  const after = typeof expertCaptureUnitDecisionF9T1 === "function" ? expertCaptureUnitDecisionF9T1(unit) : { unitId:expertExordiumUnitIdF9T2b(unit), position:unit.pos.slice(0, 3), energy:Number(state.energy[player] || 0) };
  if (typeof expertRecordDecisionF9T1 === "function") expertRecordDecisionF9T1(player, before, after, { kind:"pre_purchase_relay_move", source:"expert_exordium_f9t2b" });
  const occupant = typeof getUnitAt === "function" ? getUnitAt(step.originPs) : null;
  if (occupant) {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "target_ps_not_freed", { occupantId:expertExordiumUnitIdF9T2b(occupant) });
    return false;
  }
  return Boolean(runtime.plan && runtime.plan.status === "active" && runtime.plan.currentStep === 1);
}

// Override F9T2a: il purchase hook resta riservato al Relay; la fortificazione
// post-eliminazione viene eseguita nel loop unità dal builder dichiarato.
function expertExordiumRosterChoiceF9T2(player) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const step = expertExordiumCurrentStepF9T2(player);
  if (!runtime || !step || step.action !== "build_roster" || step.blueprintId !== EXPERT_EXORDIUM_BASTION_ID_F9T2) return null;
  const bp = expertExordiumBastionBlueprintF9T2();
  const builder = expertExordiumUnitByIdF9T2b(step.builderId);
  if (typeof getUnitAt === "function" && getUnitAt(step.targetCell)) return null;
  if (!bp || !builder || !expertExordiumCanUseBuilderF9T2(builder, step.targetCell)) return null;
  const source = expertExordiumCardSourceF9T2(player, bp, step.targetCell);
  if (!source) return null;
  return { source:source.source, bp, cardUid:source.cardUid || null, cardName:source.cardName || bp.name, starterRole:source.starterRole || null, starterCardUid:source.starterCardUid || null, builder, coord:step.targetCell.slice(0, 3), cost:source.cost, score:1000, expertPlanId:runtime.plan.id, expertStepId:step.id, expertDoctrine:"exordium_bastion_relay_f9t2b" };
}

function expertExordiumObserveRosterPlayF9T2(player, choice) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const step = expertExordiumCurrentStepF9T2(player);
  if (!runtime || !step || !choice || !choice.bp || choice.bp.id !== EXPERT_EXORDIUM_BASTION_ID_F9T2 || !expertExordiumSameCoordF9T2(choice.coord, step.targetCell)) return false;
  if (!["build_roster", "build_roster_clear_ps"].includes(step.action)) return false;
  runtime.plan.reservedEnergy = 0;
  const resultCode = step.action === "build_roster_clear_ps" ? "ps_fortified_after_clear" : "bastion_built_on_ps";
  if (step.action === "build_roster_clear_ps") {
    expertExordiumMarkTerritorialMetricF9T2c3(player, "psClearedDuringExpertPlan");
    expertExordiumMarkTerritorialMetricF9T2c3(player, "psFortifiedAfterClear");
  }
  if (typeof expertAdvancePlanStepF9T2 === "function") expertAdvancePlanStepF9T2(player, { stepId:step.id, action:step.action, result:resultCode, targetCell:step.targetCell, blueprintId:choice.bp.id, energySpent:Number(choice.cost || 0) });
  if (step.action === "build_roster_clear_ps") expertExordiumEmitDecisionF9T2b(player, "territorial_conversion_result", { targetPs:step.targetCell, conversionMode:"BASTION", psCleared:true, psOccupied:true, psFortified:true });
  return true;
}

function expertExordiumModuleF9T2a(context) { return expertExordiumModuleF9T2b(context); }
function expertExordiumModuleF9T2(context) { return expertExordiumModuleF9T2b(context); }
function expertExordiumModuleF9T1(context) { return expertExordiumModuleF9T2b(context); }


// =====================================================
// F9T2c — FORWARD STRATEGIC DEPLOYMENT
// =====================================================
// Preserva integralmente F9T2b e aggiunge un solo micro-piano P1:
// schierare una Pivot Exordium già presente in mano da un nodo strutturale
// avanzato, con supporto reale e un obiettivo influenzabile entro il turno
// successivo. Nessuna ricerca ricorsiva, nessun mercato usato come scorciatoia,
// un solo step e memoria d'impatto limitata a due round.

const EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2C = "F9T2C-EXORDIUM-1";
const EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C = "F9T2c-1";
const EXPERT_EXORDIUM_PIVOT_IMPACT_WINDOW_F9T2C = 2;

function expertExordiumEnsureForwardPivotMemoryF9T2c() {
  if (!state) return null;
  if (!state.expertAiF9T2c || state.expertAiF9T2c.schemaVersion !== EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C) {
    state.expertAiF9T2c = {
      schemaVersion:EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C,
      forwardPivotByPlayer:{},
      lastForwardPivotResultByPlayer:{}
    };
  }
  return state.expertAiF9T2c;
}

function expertExordiumEmitDecisionF9T2c(player, kind, payload = {}, explicitSequence = null) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const sequence = explicitSequence != null ? explicitSequence : (runtime ? runtime.sequence : null);
  if (typeof expertEmitF9T1 === "function" && typeof EventTypes !== "undefined" && EventTypes.AI_EXPERT_DECISION) {
    expertEmitF9T1(EventTypes.AI_EXPERT_DECISION, player, {
      sequence,
      decision:{ kind, source:"expert_exordium_f9t2c", ...payload }
    });
  }
}

function expertExordiumIsPivotBlueprintF9T2c(bp, card = null) {
  return Boolean(bp && (String(bp.weight || "").toLowerCase() === "pivot" || String(bp.deckRole || "").toLowerCase() === "pivot" || (card && (card.deckRole === "pivot" || card.cardType === "pivot"))));
}

function expertExordiumPivotInPlayF9T2c(player) {
  return expertExordiumUnitsF9T2(player).some(unit => unit && unit.alive !== false && expertExordiumIsPivotBlueprintF9T2c(unit));
}

function expertExordiumHandPivotOptionsF9T2c(player) {
  const hand = state && state.hand && Array.isArray(state.hand[player]) ? state.hand[player] : [];
  const options = [];
  for (const card of hand) {
    if (!card || card.sourceType === "mission" || card.sourceType === "tactic") continue;
    if (typeof handCardBlocked === "function" && handCardBlocked(card)) continue;
    const bp = typeof blueprintForHandCard === "function"
      ? blueprintForHandCard(card, player)
      : (Array.isArray(BLUEPRINTS) ? BLUEPRINTS.find(candidate => candidate && candidate.id === card.blueprintId) || null : null);
    if (!bp || bp.faction !== "Exordium" || !expertExordiumIsPivotBlueprintF9T2c(bp, card)) continue;
    options.push({ card, bp });
  }
  options.sort((a, b) => Number(a.bp.cost || 0) - Number(b.bp.cost || 0) || String(a.card.cardUid || a.bp.id).localeCompare(String(b.card.cardUid || b.bp.id)));
  return options;
}

function expertExordiumProjectedPivotMoveF9T2c(bp, context = null) {
  let base = 1;
  if (bp && bp.type === "Veicolo") {
    try {
      const pace = typeof currentPace === "function" ? currentPace() : null;
      base = Math.max(1, Number(pace && pace.vehicleMove || 1));
    } catch (_) { base = 1; }
  }
  base += Math.max(0, Number(bp && bp.c1fMoveBonus || 0));
  const multiplier = Math.max(1, Number(context && context.movementMultiplier || (typeof getMapMovementMultiplier === "function" ? getMapMovementMultiplier() : 1)));
  return Math.max(1, base * multiplier);
}

function expertExordiumForwardPivotThreatF9T2c(player, coord) {
  let threatCount = 0;
  let threatDamage = 0;
  const threatIds = [];
  for (const enemy of expertExordiumEnemyUnitsF9T2(player)) {
    if (!enemy || enemy.alive === false || !Array.isArray(enemy.pos) || enemy.type === "Struttura") continue;
    const move = typeof movementRangeFor === "function" ? Math.max(0, Number(movementRangeFor(enemy) || 0)) : 1;
    const distance = expertExordiumDistanceF9T2(enemy.pos, coord);
    if (distance > move + 1) continue;
    threatCount += 1;
    threatDamage += Math.max(0, typeof effectiveAtt === "function" ? Number(effectiveAtt(enemy) || 0) : Number(enemy.att || 0));
    if (threatIds.length < 8) threatIds.push(expertExordiumUnitIdF9T2b(enemy));
  }
  return { threatCount, threatDamage, threatIds };
}

function expertExordiumForwardPivotSupportF9T2c(player, coord) {
  const support = expertExordiumUnitsF9T2(player)
    .filter(unit => unit && unit.alive !== false && Array.isArray(unit.pos) && unit.type !== "QG" && unit.type !== "Struttura" && expertExordiumDistanceF9T2(unit.pos, coord) <= 2)
    .sort((a, b) => expertExordiumDistanceF9T2(a.pos, coord) - expertExordiumDistanceF9T2(b.pos, coord) || expertExordiumUnitIdF9T2b(a).localeCompare(expertExordiumUnitIdF9T2b(b)));
  return { count:support.length, ids:support.slice(0, 8).map(expertExordiumUnitIdF9T2b) };
}

function expertExordiumForwardPivotObjectiveF9T2c(player, coord, sourceCoord, projectedMove) {
  const objectives = [];
  const psCells = state && Array.isArray(state.cells) ? state.cells.filter(cell => cell && cell.ps && Array.isArray(cell.coord) && Number(cell.control) !== Number(player)) : [];
  for (const cell of psCells) {
    const distance = expertExordiumDistanceF9T2(coord, cell.coord);
    if (distance > projectedMove) continue;
    const isCenter = expertExordiumIsCenterF9T2c1(cell.coord);
    objectives.push({
      type:isCenter ? "CENTER_PS" : "PS",
      coord:cell.coord.slice(0, 3),
      distance,
      score:120 + (isCenter ? 35 : 0) + (cell.control ? 12 : 0) - distance * 3
    });
  }

  for (const enemy of expertExordiumEnemyUnitsF9T2(player)) {
    if (!enemy || enemy.alive === false || !Array.isArray(enemy.pos)) continue;
    const distance = expertExordiumDistanceF9T2(coord, enemy.pos);
    if (distance > projectedMove + 1) continue;
    let value = 80;
    if (enemy.type === "Comandante") value += 28;
    if (String(enemy.weight || "").toLowerCase() === "pivot") value += 24;
    if (enemy.type === "Struttura") value += 16;
    if (enemy.weight === "Elite") value += 12;
    if (typeof getCellAt === "function") {
      const targetCell = getCellAt(enemy.pos);
      if (targetCell && targetCell.ps) value += 22;
    }
    objectives.push({ type:"HIGH_VALUE_TARGET", coord:enemy.pos.slice(0, 3), unitId:expertExordiumUnitIdF9T2b(enemy), distance, score:value - distance * 2 });
  }

  const enemyHqs = typeof getEnemyPlayers === "function" && typeof getHq === "function"
    ? (getEnemyPlayers(player) || []).map(getHq).filter(Boolean)
    : [];
  for (const hq of enemyHqs) {
    const distance = expertExordiumDistanceF9T2(coord, hq.pos);
    const sourceDistance = Array.isArray(sourceCoord) ? expertExordiumDistanceF9T2(sourceCoord, hq.pos) : distance;
    if (distance <= projectedMove + 1) {
      objectives.push({ type:"HQ_BREAKTHROUGH", coord:hq.pos.slice(0, 3), distance, score:150 - distance * 3 });
    } else if (distance <= projectedMove + 2 && sourceDistance - distance >= 1) {
      objectives.push({ type:"HQ_CORRIDOR", coord:hq.pos.slice(0, 3), distance, score:96 + (sourceDistance - distance) * 5 - distance });
    }
  }

  objectives.sort((a, b) => b.score - a.score || a.distance - b.distance || expertExordiumCoordKeyF9T2(a.coord).localeCompare(expertExordiumCoordKeyF9T2(b.coord)));
  return objectives[0] || null;
}

function expertExordiumRecordForwardPivotAuditsF9T2c(player, audits) {
  if (!Array.isArray(audits) || !audits.length) return;
  const rejectionCounts = {};
  const runtime = expertExordiumRuntimeF9T2(player);
  if (runtime) {
    runtime.candidateAuditCount = Number(runtime.candidateAuditCount || 0) + audits.length;
    if (!runtime.candidateRejectionCounts) runtime.candidateRejectionCounts = {};
  }
  for (const audit of audits) {
    const reason = String(audit && audit.rejectionReason || "valid_candidate");
    rejectionCounts[reason] = Number(rejectionCounts[reason] || 0) + 1;
    if (runtime) runtime.candidateRejectionCounts[reason] = Number(runtime.candidateRejectionCounts[reason] || 0) + 1;
  }
  expertExordiumEmitDecisionF9T2c(player, "forward_pivot_candidate_audit_batch", {
    audits:audits.slice(0, 24),
    auditTotal:audits.length,
    rejectionCounts
  });
}

function expertExordiumForwardPivotCandidatesF9T2c(context) {
  const player = Number(context && context.player || 0);
  const audits = [];
  if (!player || !state) return [];
  if (expertExordiumPivotInPlayF9T2c(player)) {
    expertExordiumRecordForwardPivotAuditsF9T2c(player, [{ rejectionReason:"pivot_already_in_play" }]);
    return [];
  }
  if (typeof playerHandLocked === "function" && playerHandLocked(player)) {
    expertExordiumRecordForwardPivotAuditsF9T2c(player, [{ rejectionReason:"hand_locked" }]);
    return [];
  }
  const pivotOptions = expertExordiumHandPivotOptionsF9T2c(player);
  if (!pivotOptions.length) {
    expertExordiumRecordForwardPivotAuditsF9T2c(player, [{ rejectionReason:"pivot_not_in_hand" }]);
    return [];
  }

  const ownHq = typeof getHq === "function" ? getHq(player) : null;
  const ownStructures = expertExordiumUnitsF9T2(player).filter(unit => unit && unit.alive !== false && unit.type === "Struttura" && Array.isArray(unit.pos));
  const maxCandidates = typeof EXPERT_AI_LIMITS_F9T1 !== "undefined" ? Number(EXPERT_AI_LIMITS_F9T1.maxCandidates || 64) : 64;
  const candidates = [];

  for (const option of pivotOptions) {
    const { card, bp } = option;
    if (typeof purchaseLimitReached === "function" && purchaseLimitReached(player, bp)) {
      audits.push({ blueprintId:bp.id, cardUid:card.cardUid || null, rejectionReason:"pivot_purchase_limit" });
      continue;
    }
    const spawnCells = typeof spawnCellsFor === "function" ? (spawnCellsFor(player, bp) || []) : [];
    if (!spawnCells.length) {
      audits.push({ blueprintId:bp.id, cardUid:card.cardUid || null, rejectionReason:"no_spawn_cells" });
      continue;
    }
    const projectedMove = expertExordiumProjectedPivotMoveF9T2c(bp, context);
    const durability = Math.max(1, Number(bp.hp || 0) + Number(bp.def || 0));

    for (const coord of spawnCells.slice(0, maxCandidates)) {
      const audit = {
        blueprintId:bp.id,
        cardUid:card.cardUid || null,
        targetCell:Array.isArray(coord) ? coord.slice(0, 3) : null,
        projectedMove,
        sourceStructureIds:[],
        supportActorIds:[],
        threatCount:0,
        threatDamage:0,
        objectiveType:null,
        objectiveCell:null,
        availableEnergy:Number(state.energy && state.energy[player] || 0),
        cost:null,
        rejectionReason:null
      };
      if (!Array.isArray(coord)) { audit.rejectionReason = "invalid_spawn_cell"; audits.push(audit); continue; }
      if (ownHq && expertExordiumSameCoordF9T2(coord, ownHq.pos)) { audit.rejectionReason = "own_hq_only"; audits.push(audit); continue; }
      const sources = ownStructures.filter(structure => expertExordiumDistanceF9T2(structure.pos, coord) === 1);
      audit.sourceStructureIds = sources.slice(0, 8).map(expertExordiumUnitIdF9T2b);
      if (!sources.length) { audit.rejectionReason = "no_advanced_structure_source"; audits.push(audit); continue; }
      sources.sort((a, b) => {
        const aDepth = ownHq ? expertExordiumDistanceF9T2(ownHq.pos, a.pos) : 0;
        const bDepth = ownHq ? expertExordiumDistanceF9T2(ownHq.pos, b.pos) : 0;
        return bDepth - aDepth || expertExordiumUnitIdF9T2b(a).localeCompare(expertExordiumUnitIdF9T2b(b));
      });
      const source = sources[0];
      const support = expertExordiumForwardPivotSupportF9T2c(player, coord);
      audit.supportActorIds = support.ids;
      if (support.count < 1) { audit.rejectionReason = "no_ally_support"; audits.push(audit); continue; }
      const threat = expertExordiumForwardPivotThreatF9T2c(player, coord);
      audit.threatCount = threat.threatCount;
      audit.threatDamage = threat.threatDamage;
      audit.threatIds = threat.threatIds;
      if ((threat.threatCount >= 3 && support.count < 2) || (threat.threatDamage >= durability && support.count < threat.threatCount)) {
        audit.rejectionReason = "node_overexposed";
        audits.push(audit);
        continue;
      }
      const objective = expertExordiumForwardPivotObjectiveF9T2c(player, coord, source.pos, projectedMove);
      if (!objective) { audit.rejectionReason = "no_one_turn_objective"; audits.push(audit); continue; }
      audit.objectiveType = objective.type;
      audit.objectiveCell = objective.coord.slice(0, 3);
      const cost = typeof effectiveHandUnitCardCost === "function" ? Number(effectiveHandUnitCardCost(player, card, bp, coord)) : Number(bp.cost || 0);
      audit.cost = cost;
      if (!Number.isFinite(cost) || cost < 0 || Number(state.energy && state.energy[player] || 0) < cost) {
        audit.rejectionReason = "insufficient_energy";
        audits.push(audit);
        continue;
      }
      const sourceDepth = ownHq ? expertExordiumDistanceF9T2(ownHq.pos, source.pos) : 0;
      const score = objective.score + sourceDepth * 5 + support.count * 8 - threat.threatCount * 10 - Math.max(0, threat.threatDamage - durability) * 3;
      audit.rejectionReason = null;
      audit.score = score;
      audits.push(audit);
      candidates.push({
        card,
        bp,
        cost,
        coord:coord.slice(0, 3),
        sourceStructureId:expertExordiumUnitIdF9T2b(source),
        sourceStructureCoord:source.pos.slice(0, 3),
        supportActorIds:support.ids,
        projectedMove,
        objective,
        threat,
        score
      });
      if (candidates.length >= maxCandidates) break;
    }
    if (candidates.length >= maxCandidates) break;
  }

  expertExordiumRecordForwardPivotAuditsF9T2c(player, audits.slice(0, maxCandidates));
  candidates.sort((a, b) => b.score - a.score || a.objective.distance - b.objective.distance || expertExordiumCoordKeyF9T2(a.coord).localeCompare(expertExordiumCoordKeyF9T2(b.coord)) || String(a.card.cardUid || a.bp.id).localeCompare(String(b.card.cardUid || b.bp.id)));
  return candidates;
}

function expertExordiumCreateForwardPivotPlanF9T2c(context, candidate) {
  if (!context || !candidate || typeof expertCreateMicroPlanF9T1 !== "function") return null;
  const player = Number(context.player || 0);
  const round = Math.max(0, Number(state && state.turn || 0));
  const planId = `EX-F9T2C-PIVOT-${player}-${round}-${String(candidate.card.cardUid || candidate.bp.id)}`;
  const step = {
    id:`${planId}-DEPLOY`,
    action:"deploy_pivot_forward",
    blueprintId:candidate.bp.id,
    cardUid:candidate.card.cardUid || null,
    targetCell:candidate.coord.slice(0, 3),
    sourceStructureId:candidate.sourceStructureId,
    sourceStructureCoord:candidate.sourceStructureCoord.slice(0, 3),
    objectiveType:candidate.objective.type,
    objectiveCell:candidate.objective.coord.slice(0, 3),
    objectiveUnitId:candidate.objective.unitId || null,
    projectedMove:candidate.projectedMove,
    requiredEnergy:candidate.cost
  };
  const created = expertCreateMicroPlanF9T1({
    id:planId,
    faction:"Exordium",
    goal:"EXORDIUM_FORWARD_PIVOT_DEPLOYMENT",
    targetCell:candidate.coord,
    targetPs:["PS", "CENTER_PS"].includes(candidate.objective.type) ? candidate.objective.coord : null,
    targetUnitId:candidate.objective.unitId || null,
    primaryActorId:null,
    supportActorIds:candidate.supportActorIds,
    requiredEnergy:candidate.cost,
    reservedEnergy:candidate.cost,
    reservedActions:["deploy_pivot_forward"],
    orderedSteps:[step],
    expectedResult:{
      pivotDeployed:true,
      advancedNodeUsed:true,
      firstImpactWithinRounds:EXPERT_EXORDIUM_PIVOT_IMPACT_WINDOW_F9T2C,
      objectiveType:candidate.objective.type,
      objectiveCell:candidate.objective.coord.slice(0, 3)
    },
    abortConditions:[
      { kind:"hq_occupation_risk_priority" },
      { kind:"pivot_unavailable" },
      { kind:"advanced_node_lost" },
      { kind:"support_lost" },
      { kind:"deployment_cell_invalid" },
      { kind:"reserved_energy_unavailable" }
    ],
    fallbackPlan:"advanced_f9t0",
    status:"proposed"
  });
  if (!created.validation.ok) return null;
  created.plan.exordium = {
    doctrine:"FORWARD_PIVOT_DEPLOYMENT",
    contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2C,
    blueprintId:candidate.bp.id,
    cardUid:candidate.card.cardUid || null,
    sourceStructureId:candidate.sourceStructureId,
    sourceStructureCoord:candidate.sourceStructureCoord.slice(0, 3),
    objectiveType:candidate.objective.type,
    objectiveCell:candidate.objective.coord.slice(0, 3),
    projectedMove:candidate.projectedMove,
    expectedImpactDeadlineRound:round + EXPERT_EXORDIUM_PIVOT_IMPACT_WINDOW_F9T2C,
    candidateScore:Number(candidate.score || 0),
    threat:expertSafeCloneF9T1(candidate.threat || {})
  };
  return created.plan;
}

function expertExordiumForwardPivotTrackF9T2c(player, unit, plan, choice) {
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  if (!memory || !unit || !plan) return null;
  const runtime = expertExordiumRuntimeF9T2(player);
  const deployedRound = Math.max(0, Number(state && state.turn || 0));
  const record = {
    player:Number(player),
    unitId:expertExordiumUnitIdF9T2b(unit),
    blueprintId:String(unit.id || unit.blueprintId || (choice && choice.bp && choice.bp.id) || ""),
    deployedRound,
    deploymentSequence:runtime ? runtime.sequence : null,
    deploymentCell:Array.isArray(unit.pos) ? unit.pos.slice(0, 3) : null,
    sourceStructureId:plan.exordium && plan.exordium.sourceStructureId || null,
    objectiveType:plan.exordium && plan.exordium.objectiveType || null,
    objectiveCell:plan.exordium && Array.isArray(plan.exordium.objectiveCell) ? plan.exordium.objectiveCell.slice(0, 3) : null,
    impactDeadlineRound:deployedRound + EXPERT_EXORDIUM_PIVOT_IMPACT_WINDOW_F9T2C,
    status:"awaiting_impact",
    impact:null
  };
  memory.forwardPivotByPlayer[String(Number(player))] = record;
  return record;
}

function expertExordiumResolveForwardPivotImpactF9T2c(player, tracking, impactKind, event = null, details = {}) {
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  if (!memory || !tracking) return false;
  const round = Math.max(0, Number(state && state.turn || 0));
  const result = {
    ...expertSafeCloneF9T1(tracking),
    status:impactKind === "DESTROYED_BEFORE_IMPACT" || impactKind === "WINDOW_EXPIRED" ? "missed" : "impacted",
    impact:{ kind:impactKind, round, roundsToImpact:Math.max(0, round - Number(tracking.deployedRound || round)), eventType:event && event.type || null, ...expertSafeCloneF9T1(details) }
  };
  memory.lastForwardPivotResultByPlayer[String(Number(player))] = result;
  delete memory.forwardPivotByPlayer[String(Number(player))];
  const isMiss = result.status === "missed";
  expertExordiumEmitDecisionF9T2c(player, isMiss ? "forward_pivot_impact_window_missed" : "forward_pivot_impact", {
    unitId:tracking.unitId,
    blueprintId:tracking.blueprintId,
    deploymentCell:tracking.deploymentCell,
    objectiveType:tracking.objectiveType,
    objectiveCell:tracking.objectiveCell,
    impact:result.impact
  }, tracking.deploymentSequence);
  return true;
}

function expertExordiumCheckForwardPivotExpiryF9T2c(player) {
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  if (!memory) return false;
  const tracking = memory.forwardPivotByPlayer[String(Number(player))] || null;
  if (!tracking || tracking.status !== "awaiting_impact") return false;
  const round = Math.max(0, Number(state && state.turn || 0));
  if (round <= Number(tracking.impactDeadlineRound || 0)) return false;
  return expertExordiumResolveForwardPivotImpactF9T2c(player, tracking, "WINDOW_EXPIRED", null, { deadlineRound:tracking.impactDeadlineRound });
}

function expertAiHandleGameEventF9T2c(event) {
  const handledBase = typeof expertAiHandleGameEventF9T2b === "function" ? expertAiHandleGameEventF9T2b(event) : false;
  if (!event || !state || state.aiMode !== "expert" || typeof EventTypes === "undefined") return handledBase;
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  if (!memory) return handledBase;
  const data = event.data || {};
  for (const sideKey of Object.keys(memory.forwardPivotByPlayer || {})) {
    const tracking = memory.forwardPivotByPlayer[sideKey];
    if (!tracking || tracking.status !== "awaiting_impact") continue;
    const side = Number(sideKey);
    if (event.type === EventTypes.UNIT_ATTACKED && String(data.attackerId || "") === String(tracking.unitId)) {
      return expertExordiumResolveForwardPivotImpactF9T2c(side, tracking, "ATTACK", event, { targetUnitId:data.defenderId || null, amount:Number(data.amount || 0) }) || handledBase;
    }
    if (event.type === EventTypes.ABILITY_USED && String(data.unitId || "") === String(tracking.unitId)) {
      return expertExordiumResolveForwardPivotImpactF9T2c(side, tracking, "ABILITY", event, { abilityKind:data.abilityKind || null, targetUnitId:data.targetId || null }) || handledBase;
    }
    if (event.type === EventTypes.PS_CONTROL_CHANGED && String(data.occupantId || "") === String(tracking.unitId) && Number(data.nextControl || 0) === side) {
      return expertExordiumResolveForwardPivotImpactF9T2c(side, tracking, "PS_CONTROL", event, { coord:Array.isArray(data.coord) ? data.coord.slice(0, 3) : null }) || handledBase;
    }
    if (event.type === EventTypes.UNIT_DESTROYED && String(data.unitId || "") === String(tracking.unitId)) {
      return expertExordiumResolveForwardPivotImpactF9T2c(side, tracking, "DESTROYED_BEFORE_IMPACT", event, { destroyedBySide:Number(data.destroyedBySide || 0) || null }) || handledBase;
    }
  }
  return handledBase;
}

function expertExordiumModuleF9T2c(context) {
  if (!context || context.faction !== "Exordium") return { moduleId:"expert-exordium-f9t2c", faction:"Exordium", plan:null, status:"not_applicable", reason:"wrong_faction" };
  expertExordiumCheckForwardPivotExpiryF9T2c(context.player);
  const base = expertExordiumModuleF9T2b(context);
  if (base && base.plan) return { ...base, moduleId:"expert-exordium-f9t2c", contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2C };
  if (base && ["wrong_faction", "hq_occupation_risk_priority"].includes(base.reason)) return { ...base, moduleId:"expert-exordium-f9t2c", contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2C };
  const runtime = expertExordiumRuntimeF9T2(context.player);
  const candidates = expertExordiumForwardPivotCandidatesF9T2c(context);
  if (runtime) {
    runtime.candidateCount = Number(runtime.candidateCount || 0) + candidates.length;
    runtime.discardedCandidates = Number(runtime.discardedCandidates || 0) + Math.max(0, candidates.length - 1);
  }
  if (candidates.length) {
    const plan = expertExordiumCreateForwardPivotPlanF9T2c(context, candidates[0]);
    if (plan) return { moduleId:"expert-exordium-f9t2c", faction:"Exordium", plan, status:"microplan_selected", reason:"forward_pivot_deployment_available", candidateCount:candidates.length, contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2C };
  }
  return { moduleId:"expert-exordium-f9t2c", faction:"Exordium", plan:null, status:"fallback", reason:"no_territorial_conversion_safe_relay_or_forward_pivot_candidate", candidateCount:0, contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2C };
}

function expertExordiumRosterChoiceF9T2c(player) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const step = expertExordiumCurrentStepF9T2(player);
  if (!runtime || !step || step.action !== "deploy_pivot_forward") return expertExordiumRosterChoiceF9T2(player);
  const abort = (reason, details = {}) => {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, reason, details);
    return null;
  };
  const hqRisk = runtime.context && runtime.context.common && runtime.context.common.hqOccupationRisk ? runtime.context.common.hqOccupationRisk.risk : "unknown";
  if (hqRisk === "occupied" || hqRisk === "direct") return abort("hq_occupation_risk_priority", { hqRisk });
  const hand = state && state.hand && Array.isArray(state.hand[player]) ? state.hand[player] : [];
  const card = hand.find(candidate => candidate && String(candidate.cardUid || "") === String(step.cardUid || "")) || null;
  if (!card || (typeof handCardBlocked === "function" && handCardBlocked(card))) return abort("pivot_unavailable", { cardUid:step.cardUid });
  const bp = typeof blueprintForHandCard === "function" ? blueprintForHandCard(card, player) : (Array.isArray(BLUEPRINTS) ? BLUEPRINTS.find(candidate => candidate && candidate.id === step.blueprintId) || null : null);
  if (!bp || !expertExordiumIsPivotBlueprintF9T2c(bp, card) || expertExordiumPivotInPlayF9T2c(player)) return abort("pivot_unavailable", { blueprintId:step.blueprintId });
  const source = expertExordiumUnitByIdF9T2b(step.sourceStructureId);
  if (!source || source.alive === false || source.type !== "Struttura" || expertExordiumDistanceF9T2(source.pos, step.targetCell) !== 1) return abort("advanced_node_lost", { sourceStructureId:step.sourceStructureId });
  const support = expertExordiumForwardPivotSupportF9T2c(player, step.targetCell);
  if (support.count < 1) return abort("support_lost", { targetCell:step.targetCell });
  const legal = typeof spawnCellsFor === "function" ? (spawnCellsFor(player, bp) || []).some(coord => expertExordiumSameCoordF9T2(coord, step.targetCell)) : false;
  if (!legal) return abort("deployment_cell_invalid", { targetCell:step.targetCell });
  const cost = typeof effectiveHandUnitCardCost === "function" ? Number(effectiveHandUnitCardCost(player, card, bp, step.targetCell)) : Number(bp.cost || 0);
  if (!Number.isFinite(cost) || Number(state.energy && state.energy[player] || 0) < cost) return abort("reserved_energy_unavailable", { requiredEnergy:cost });
  return {
    source:"hand",
    bp,
    cardUid:card.cardUid || null,
    cardName:card.name || bp.name,
    coord:step.targetCell.slice(0, 3),
    cost,
    score:1300,
    expertPlanId:runtime.plan.id,
    expertStepId:step.id,
    expertDoctrine:"exordium_forward_pivot_deployment_f9t2c"
  };
}

function expertExordiumObserveRosterPlayF9T2c(player, choice) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const step = expertExordiumCurrentStepF9T2(player);
  if (!runtime || !step || step.action !== "deploy_pivot_forward") return expertExordiumObserveRosterPlayF9T2(player, choice);
  if (!choice || !choice.bp || choice.bp.id !== step.blueprintId || !expertExordiumSameCoordF9T2(choice.coord, step.targetCell)) return false;
  const pivot = typeof getUnitAt === "function" ? getUnitAt(step.targetCell) : null;
  if (!pivot || pivot.side !== Number(player) || !expertExordiumIsPivotBlueprintF9T2c(pivot)) {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "pivot_spawn_not_observed", { targetCell:step.targetCell, blueprintId:step.blueprintId });
    return false;
  }
  runtime.plan.reservedEnergy = 0;
  const tracking = expertExordiumForwardPivotTrackF9T2c(player, pivot, runtime.plan, choice);
  if (typeof expertAdvancePlanStepF9T2 === "function") expertAdvancePlanStepF9T2(player, {
    stepId:step.id,
    action:step.action,
    result:"pivot_deployed_forward",
    unitId:expertExordiumUnitIdF9T2b(pivot),
    blueprintId:choice.bp.id,
    targetCell:step.targetCell,
    sourceStructureId:step.sourceStructureId,
    objectiveType:step.objectiveType,
    objectiveCell:step.objectiveCell,
    energySpent:Number(choice.cost || 0),
    impactDeadlineRound:tracking ? tracking.impactDeadlineRound : null
  });
  expertExordiumEmitDecisionF9T2c(player, "forward_pivot_deployed", {
    unitId:expertExordiumUnitIdF9T2b(pivot),
    blueprintId:choice.bp.id,
    deploymentCell:step.targetCell,
    sourceStructureId:step.sourceStructureId,
    objectiveType:step.objectiveType,
    objectiveCell:step.objectiveCell,
    impactDeadlineRound:tracking ? tracking.impactDeadlineRound : null
  });
  return true;
}


// =====================================================
// F9T2c1 — FORWARD PIVOT CANDIDATE & EXECUTION INTEGRITY
// =====================================================
// Hotfix disciplinato: nessuna nuova dottrina. Corregge il candidato Pivot,
// riconcilia i risultati territoriali autorevoli, applica il Survival Check
// a ogni Bastione costruito su PS, usa il centro dichiarato dalla mappa e
// separa record decisionali e audit sotto limiti rigidi.

const EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2C1 = "F9T2C2-EXORDIUM-1";
const EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C1 = "F9T2c1-1";
const EXPERT_EXORDIUM_FORWARD_AUDIT_DETAIL_LIMIT_F9T2C1 = 12;
const EXPERT_EXORDIUM_PIVOT_RESULT_LIMIT_F9T2C1 = 12;

function expertExordiumCentralCoordF9T2c1() {
  try {
    if (typeof getCentralStrategicPointCoord === "function") {
      const coord = getCentralStrategicPointCoord(state && state.mapDefinition);
      if (Array.isArray(coord)) return coord.slice(0, 3);
    }
  } catch (_) {}
  try {
    if (typeof pressureRuleProfile === "function") {
      const profile = pressureRuleProfile();
      if (profile && Array.isArray(profile.centralCoord)) return profile.centralCoord.slice(0, 3);
    }
  } catch (_) {}
  try {
    if (typeof centerPsCell === "function") {
      const cell = centerPsCell();
      if (cell && Array.isArray(cell.coord)) return cell.coord.slice(0, 3);
    }
  } catch (_) {}
  return null;
}

function expertExordiumIsCenterF9T2c1(coord) {
  const center = expertExordiumCentralCoordF9T2c1();
  return Boolean(center && expertExordiumSameCoordF9T2(coord, center));
}

function expertExordiumEmitDecisionF9T2c1(player, kind, payload = {}, options = {}) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const decision = {
    kind:String(kind || "expert_exordium_decision"),
    source:String(options.source || "expert_exordium_f9t2c1"),
    ...expertSafeCloneF9T1(payload || {})
  };
  if (typeof expertEmitDecisionLimitedF9T2c1 === "function") {
    return expertEmitDecisionLimitedF9T2c1(player, decision, {
      sequence:options.sequence != null ? options.sequence : (runtime ? runtime.sequence : null),
      audit:Boolean(options.audit),
      auditTotal:options.auditTotal,
      auditStored:options.auditStored
    });
  }
  if (typeof expertEmitF9T1 === "function" && typeof EventTypes !== "undefined" && EventTypes.AI_EXPERT_DECISION) {
    return expertEmitF9T1(EventTypes.AI_EXPERT_DECISION, player, {
      sequence:options.sequence != null ? options.sequence : (runtime ? runtime.sequence : null),
      decision
    });
  }
  return null;
}

// Override retrocompatibile: tutti gli audit F9T2b/F9T2c passano dal limite c1.
function expertExordiumEmitDecisionF9T2b(player, kind, payload = {}) {
  const auditKinds = new Set([
    "relay_survival_assessment_batch",
    "territorial_conversion_candidate_audit_batch",
    "bastion_ps_build_gate"
  ]);
  const audit = auditKinds.has(String(kind || ""));
  const total = payload && (payload.auditTotal != null ? payload.auditTotal : (Array.isArray(payload.assessments) ? payload.assessments.length : (Array.isArray(payload.audits) ? payload.audits.length : 1)));
  const stored = payload && (Array.isArray(payload.assessments) ? Math.min(payload.assessments.length, EXPERT_EXORDIUM_FORWARD_AUDIT_DETAIL_LIMIT_F9T2C1) : (Array.isArray(payload.audits) ? Math.min(payload.audits.length, EXPERT_EXORDIUM_FORWARD_AUDIT_DETAIL_LIMIT_F9T2C1) : 1));
  return expertExordiumEmitDecisionF9T2c1(player, kind, payload, { audit, auditTotal:total, auditStored:stored });
}

function expertExordiumEmitDecisionF9T2c(player, kind, payload = {}, explicitSequence = null) {
  const auditKinds = new Set(["forward_pivot_candidate_audit_batch"]);
  const audit = auditKinds.has(String(kind || ""));
  const total = payload && (payload.auditTotal != null ? payload.auditTotal : (Array.isArray(payload.audits) ? payload.audits.length : 1));
  const stored = payload && Array.isArray(payload.audits) ? Math.min(payload.audits.length, EXPERT_EXORDIUM_FORWARD_AUDIT_DETAIL_LIMIT_F9T2C1) : 1;
  return expertExordiumEmitDecisionF9T2c1(player, kind, payload, { sequence:explicitSequence, audit, auditTotal:total, auditStored:stored });
}

function expertExordiumCanBuildBastionOnPsF9T2c1(player, bp, coord, options = {}) {
  const result = { applicable:false, allowBuild:true, assessment:null, source:String(options.source || "unknown") };
  if (!state || state.aiMode !== "expert" || Number(player) < 1 || !bp || String(bp.id || "") !== EXPERT_EXORDIUM_BASTION_ID_F9T2 || !Array.isArray(coord)) return result;
  if (state.modes && state.modes[player] && state.modes[player] !== "bot") return result;
  if (!state.factions || state.factions[player] !== "Exordium") return result;
  const cell = typeof getCellAt === "function" ? getCellAt(coord) : null;
  if (!cell || !cell.ps) return result;
  const runtime = expertExordiumRuntimeF9T2(player);
  const assessment = expertExordiumRelaySurvivalAssessmentF9T2b(player, coord, runtime && runtime.context || null);
  result.applicable = true;
  result.assessment = assessment;
  result.allowBuild = Boolean(assessment && assessment.allowBuild);
  if (options.emit) {
    expertExordiumEmitDecisionF9T2c1(player, "bastion_ps_build_gate", {
      psCoord:coord.slice(0, 3),
      source:result.source,
      expertPlanId:options.expertPlanId || (options.choice && options.choice.expertPlanId) || null,
      expertDoctrine:options.expertDoctrine || (options.choice && options.choice.expertDoctrine) || null,
      classification:assessment ? assessment.classification : "UNKNOWN",
      isCenter:assessment ? assessment.isCenter : expertExordiumIsCenterF9T2c1(coord),
      criticalValue:assessment ? assessment.criticalValue : false,
      allowBuild:result.allowBuild,
      recommendation:assessment ? assessment.recommendation : "unknown"
    }, { audit:true, auditTotal:1, auditStored:1 });
  }
  return result;
}

function expertExordiumProjectedReachableCellsF9T2c1(deploymentCoord, moveBudget) {
  if (!Array.isArray(deploymentCoord)) return [];
  const budget = Math.max(1, Number(moveBudget || 1));
  const entries = [{ coord:deploymentCoord.slice(0, 3), cost:0 }];
  if (typeof mapReachableCells !== "function" || !state || !state.mapDefinition) {
    const cells = state && Array.isArray(state.cells) ? state.cells : [];
    for (const cell of cells) {
      if (!cell || !Array.isArray(cell.coord) || expertExordiumSameCoordF9T2(cell.coord, deploymentCoord)) continue;
      const cost = expertExordiumDistanceF9T2(deploymentCoord, cell.coord);
      if (cost > budget) continue;
      if (typeof isCellEnterable === "function" && !isCellEnterable(cell.coord)) continue;
      if (typeof getUnitAt === "function" && getUnitAt(cell.coord)) continue;
      entries.push({ coord:cell.coord.slice(0, 3), cost });
    }
    return entries;
  }
  const occupiedKeys = new Set();
  const field = Array.isArray(state.units) ? state.units : [];
  for (const unit of field) {
    if (!unit || unit.alive === false || !Array.isArray(unit.pos) || unit.type === "QG") continue;
    if (!expertExordiumSameCoordF9T2(unit.pos, deploymentCoord)) occupiedKeys.add(expertExordiumCoordKeyF9T2(unit.pos));
  }
  for (const effect of Array.isArray(state.cellEffects) ? state.cellEffects : []) {
    if (effect && effect.kind === "temporary_block_cell" && Array.isArray(effect.coord)) occupiedKeys.add(expertExordiumCoordKeyF9T2(effect.coord));
  }
  const reachable = mapReachableCells(state.mapDefinition, deploymentCoord, budget, { occupiedKeys }) || [];
  for (const entry of reachable) {
    if (!entry || !Array.isArray(entry.coord)) continue;
    entries.push({ coord:entry.coord.slice(0, 3), cost:Number(entry.cost || 0) });
  }
  return entries;
}

function expertExordiumNearestEnemyPsF9T2c1(player, origin) {
  const cells = expertExordiumPsCellsF9T2a().filter(cell => Number(cell.control) !== Number(player));
  let best = null;
  for (const cell of cells) {
    const distance = expertExordiumDistanceF9T2(origin, cell.coord);
    const center = expertExordiumIsCenterF9T2c1(cell.coord);
    const item = { coord:cell.coord.slice(0, 3), distance, center, control:Number(cell.control || 0) || null };
    if (!best || (center && !best.center) || (center === best.center && (distance < best.distance || (distance === best.distance && expertExordiumCoordKeyF9T2(item.coord) < expertExordiumCoordKeyF9T2(best.coord))))) best = item;
  }
  return best;
}

function expertExordiumPivotAttackAbilityRangeF9T2c1(bp) {
  return Math.max(1, Number(bp && (bp.attackRange || bp.range || bp.abilityRange || bp.skillRange) || 1));
}

function expertExordiumProjectedPivotObjectiveF9T2c1(player, bp, deploymentCoord, sourceCoord, projectedMove) {
  const reachable = expertExordiumProjectedReachableCellsF9T2c1(deploymentCoord, projectedMove);
  const center = expertExordiumCentralCoordF9T2c1();
  const enemyPsBefore = expertExordiumNearestEnemyPsF9T2c1(player, deploymentCoord);
  const attackRange = expertExordiumPivotAttackAbilityRangeF9T2c1(bp);
  const enemies = expertExordiumEnemyUnitsF9T2(player);
  const enemyHqs = typeof getEnemyPlayers === "function" && typeof getHq === "function"
    ? (getEnemyPlayers(player) || []).map(getHq).filter(hq => hq && Array.isArray(hq.pos))
    : [];
  const options = [];

  for (const entry of reachable) {
    const end = entry.coord;
    const cell = typeof getCellAt === "function" ? getCellAt(end) : null;
    const nearestPs = expertExordiumNearestEnemyPsF9T2c1(player, end);
    const centerDistance = center ? expertExordiumDistanceF9T2(end, center) : null;
    let best = null;

    if (cell && cell.ps && Number(cell.control) !== Number(player)) {
      best = {
        type:expertExordiumIsCenterF9T2c1(end) ? "CENTER_PS" : "PS",
        coord:end.slice(0, 3),
        distance:0,
        score:220 + (expertExordiumIsCenterF9T2c1(end) ? 45 : 0) + (cell.control ? 18 : 0)
      };
    }

    for (const enemy of enemies) {
      if (!enemy || enemy.alive === false || !Array.isArray(enemy.pos)) continue;
      const distance = expertExordiumDistanceF9T2(end, enemy.pos);
      if (distance > attackRange) continue;
      let value = 132 - distance * 3;
      if (enemy.type === "Comandante") value += 36;
      if (String(enemy.weight || "").toLowerCase() === "pivot") value += 30;
      if (enemy.type === "Struttura") value += 18;
      const targetCell = typeof getCellAt === "function" ? getCellAt(enemy.pos) : null;
      if (targetCell && targetCell.ps) value += 26;
      const candidate = { type:"HIGH_VALUE_TARGET", coord:enemy.pos.slice(0, 3), unitId:expertExordiumUnitIdF9T2b(enemy), distance, score:value };
      if (!best || candidate.score > best.score) best = candidate;
    }

    for (const hq of enemyHqs) {
      const distance = expertExordiumDistanceF9T2(end, hq.pos);
      const deployDistance = expertExordiumDistanceF9T2(deploymentCoord, hq.pos);
      const sourceDistance = Array.isArray(sourceCoord) ? expertExordiumDistanceF9T2(sourceCoord, hq.pos) : deployDistance;
      let candidate = null;
      if (distance <= attackRange) candidate = { type:"HQ_BREAKTHROUGH", coord:hq.pos.slice(0, 3), distance, score:245 - distance * 4 };
      else if (deployDistance - distance >= 2 || sourceDistance - distance >= 3) candidate = { type:"HQ_CORRIDOR", coord:hq.pos.slice(0, 3), distance, score:116 + Math.max(deployDistance - distance, sourceDistance - distance) * 6 - distance };
      if (candidate && (!best || candidate.score > best.score)) best = candidate;
    }

    if (!best && nearestPs && enemyPsBefore) {
      const gain = enemyPsBefore.distance - nearestPs.distance;
      if (gain >= 1 && nearestPs.distance <= Math.max(1, attackRange + 1)) {
        best = {
          type:nearestPs.center ? "CENTER_APPROACH" : "PS_APPROACH",
          coord:nearestPs.coord.slice(0, 3),
          distance:nearestPs.distance,
          score:128 + gain * 10 + (nearestPs.center ? 22 : 0) - nearestPs.distance * 2
        };
      }
    }

    if (!best && center && centerDistance != null) {
      const beforeCenter = expertExordiumDistanceF9T2(deploymentCoord, center);
      const gain = beforeCenter - centerDistance;
      if (gain >= 1 && centerDistance <= Math.max(2, attackRange + 2)) {
        best = { type:"CENTER_APPROACH", coord:center.slice(0, 3), distance:centerDistance, score:112 + gain * 8 - centerDistance };
      }
    }

    if (!best) continue;
    options.push({
      ...best,
      projectedEndCellNextTurn:end.slice(0, 3),
      movementCost:Number(entry.cost || 0),
      distanceToCenterAfterMove:centerDistance,
      distanceToNearestEnemyPsAfterMove:nearestPs ? nearestPs.distance : null,
      attackOrAbilityRangeAfterMove:attackRange,
      score:Number(best.score || 0) - Number(entry.cost || 0) * 0.25
    });
  }

  options.sort((a, b) => b.score - a.score || a.distance - b.distance || expertExordiumCoordKeyF9T2(a.projectedEndCellNextTurn).localeCompare(expertExordiumCoordKeyF9T2(b.projectedEndCellNextTurn)));
  return options[0] || null;
}

function expertExordiumRecordForwardPivotAuditsF9T2c(player, audits) {
  return expertExordiumEmitCandidateAuditBatchF9T2c3(
    player,
    "forwardPivot",
    "forward_pivot_candidate_audit_batch",
    "expert_exordium_f9t2c2",
    audits,
    EXPERT_EXORDIUM_FORWARD_AUDIT_DETAIL_LIMIT_F9T2C1
  );
}

function expertExordiumForwardPivotCandidatesF9T2c(context) {
  const player = Number(context && context.player || 0);
  const audits = [];
  if (!player || !state) return [];
  if (expertExordiumPivotInPlayF9T2c(player)) {
    expertExordiumRecordForwardPivotAuditsF9T2c(player, [{ rejectionReason:"pivot_already_in_play" }]);
    return [];
  }
  if (typeof playerHandLocked === "function" && playerHandLocked(player)) {
    expertExordiumRecordForwardPivotAuditsF9T2c(player, [{ rejectionReason:"hand_locked" }]);
    return [];
  }
  const pivotOptions = expertExordiumHandPivotOptionsF9T2c(player);
  if (!pivotOptions.length) {
    expertExordiumRecordForwardPivotAuditsF9T2c(player, [{ rejectionReason:"pivot_not_in_hand" }]);
    return [];
  }

  const ownHq = typeof getHq === "function" ? getHq(player) : null;
  const ownStructures = expertExordiumUnitsF9T2(player).filter(unit => unit && unit.alive !== false && unit.type === "Struttura" && Array.isArray(unit.pos));
  const maxCandidates = typeof EXPERT_AI_LIMITS_F9T1 !== "undefined" ? Number(EXPERT_AI_LIMITS_F9T1.maxCandidates || 64) : 64;
  const availableEnergy = Number(state.energy && state.energy[player] || 0);
  const candidates = [];
  let stop = false;
  const scanStartedAt = typeof expertNowF9T1 === "function" ? expertNowF9T1() : Date.now();
  const scanBudgetMs = 3.25;

  for (const option of pivotOptions) {
    if (stop) break;
    const { card, bp } = option;
    if (typeof purchaseLimitReached === "function" && purchaseLimitReached(player, bp)) {
      audits.push({ blueprintId:bp.id, cardUid:card.cardUid || null, pivotCost:Number(bp.cost || 0), rejectionReason:"pivot_purchase_limit" });
      continue;
    }
    const spawnCells = typeof spawnCellsFor === "function" ? (spawnCellsFor(player, bp) || []) : [];
    if (!spawnCells.length) {
      audits.push({ blueprintId:bp.id, cardUid:card.cardUid || null, pivotCost:Number(bp.cost || 0), rejectionReason:"no_spawn_cells" });
      continue;
    }
    const projectedMove = expertExordiumProjectedPivotMoveF9T2c(bp, context);
    const durability = Math.max(1, Number(bp.hp || 0) + Number(bp.def || 0));

    for (const coord of spawnCells.slice(0, maxCandidates)) {
      const scanElapsed = (typeof expertNowF9T1 === "function" ? expertNowF9T1() : Date.now()) - scanStartedAt;
      if (scanElapsed > scanBudgetMs) {
        const runtime = expertExordiumRuntimeF9T2(player);
        if (runtime) runtime.candidateScanStoppedEarly = true;
        audits.push({ blueprintId:bp.id, cardUid:card.cardUid || null, rejectionReason:"candidate_scan_budget_reached", scanElapsedMs:Number(scanElapsed.toFixed ? scanElapsed.toFixed(3) : scanElapsed) });
        stop = true;
        break;
      }
      if (audits.length >= maxCandidates) { stop = true; break; }
      const cost = Array.isArray(coord) && typeof effectiveHandUnitCardCost === "function" ? Number(effectiveHandUnitCardCost(player, card, bp, coord)) : Number(bp.cost || 0);
      const audit = {
        blueprintId:bp.id,
        cardUid:card.cardUid || null,
        pivotCost:Number.isFinite(cost) ? cost : Number(bp.cost || 0),
        availableEnergy,
        energyAfterDeployment:Number.isFinite(cost) ? availableEnergy - cost : null,
        sourceStructure:null,
        sourceStructureId:null,
        deploymentCell:Array.isArray(coord) ? coord.slice(0, 3) : null,
        targetCell:Array.isArray(coord) ? coord.slice(0, 3) : null,
        projectedMove,
        projectedEndCellNextTurn:null,
        distanceToCenterAfterMove:null,
        distanceToNearestEnemyPsAfterMove:null,
        attackOrAbilityRangeAfterMove:null,
        objectiveType:null,
        objectiveCell:null,
        supportActorIds:[],
        threatCount:0,
        threatDamage:0,
        rejectionReason:null
      };
      if (!Array.isArray(coord)) { audit.rejectionReason = "invalid_spawn_cell"; audits.push(audit); continue; }
      if (!Number.isFinite(cost) || cost < 0 || availableEnergy < cost) { audit.rejectionReason = "insufficient_energy"; audits.push(audit); continue; }
      if (ownHq && expertExordiumSameCoordF9T2(coord, ownHq.pos)) { audit.rejectionReason = "own_hq_only"; audits.push(audit); continue; }
      const sources = ownStructures.filter(structure => expertExordiumDistanceF9T2(structure.pos, coord) === 1);
      if (!sources.length) { audit.rejectionReason = "no_advanced_structure_source"; audits.push(audit); continue; }
      sources.sort((a, b) => {
        const aDepth = ownHq ? expertExordiumDistanceF9T2(ownHq.pos, a.pos) : 0;
        const bDepth = ownHq ? expertExordiumDistanceF9T2(ownHq.pos, b.pos) : 0;
        return bDepth - aDepth || expertExordiumUnitIdF9T2b(a).localeCompare(expertExordiumUnitIdF9T2b(b));
      });
      const source = sources[0];
      audit.sourceStructure = { id:expertExordiumUnitIdF9T2b(source), coord:source.pos.slice(0, 3), name:source.name || "" };
      audit.sourceStructureId = audit.sourceStructure.id;
      const support = expertExordiumForwardPivotSupportF9T2c(player, coord);
      audit.supportActorIds = support.ids;
      if (support.count < 1) { audit.rejectionReason = "no_ally_support"; audits.push(audit); continue; }
      const threat = expertExordiumForwardPivotThreatF9T2c(player, coord);
      audit.threatCount = threat.threatCount;
      audit.threatDamage = threat.threatDamage;
      audit.threatIds = threat.threatIds;
      if ((threat.threatCount >= 3 && support.count < 2) || (threat.threatDamage >= durability && support.count < threat.threatCount)) {
        audit.rejectionReason = "node_overexposed";
        audits.push(audit);
        continue;
      }
      const objective = expertExordiumProjectedPivotObjectiveF9T2c1(player, bp, coord, source.pos, projectedMove);
      if (!objective) { audit.rejectionReason = "no_one_turn_objective"; audits.push(audit); continue; }
      audit.projectedEndCellNextTurn = objective.projectedEndCellNextTurn.slice(0, 3);
      audit.distanceToCenterAfterMove = objective.distanceToCenterAfterMove;
      audit.distanceToNearestEnemyPsAfterMove = objective.distanceToNearestEnemyPsAfterMove;
      audit.attackOrAbilityRangeAfterMove = objective.attackOrAbilityRangeAfterMove;
      audit.objectiveType = objective.type;
      audit.objectiveCell = objective.coord.slice(0, 3);
      const sourceDepth = ownHq ? expertExordiumDistanceF9T2(ownHq.pos, source.pos) : 0;
      const score = Number(objective.score || 0) + sourceDepth * 5 + support.count * 8 - threat.threatCount * 10 - Math.max(0, threat.threatDamage - durability) * 3;
      audit.score = Number(score.toFixed(3));
      audits.push(audit);
      candidates.push({
        card, bp, cost, coord:coord.slice(0, 3),
        sourceStructureId:expertExordiumUnitIdF9T2b(source),
        sourceStructureCoord:source.pos.slice(0, 3),
        supportActorIds:support.ids,
        projectedMove,
        projectedEndCellNextTurn:objective.projectedEndCellNextTurn.slice(0, 3),
        distanceToCenterAfterMove:objective.distanceToCenterAfterMove,
        distanceToNearestEnemyPsAfterMove:objective.distanceToNearestEnemyPsAfterMove,
        attackOrAbilityRangeAfterMove:objective.attackOrAbilityRangeAfterMove,
        objective,
        threat,
        score
      });
      if (score >= 180) {
        const runtime = expertExordiumRuntimeF9T2(player);
        if (runtime) runtime.candidateScanStoppedEarly = true;
        stop = true;
        break;
      }
    }
  }

  expertExordiumRecordForwardPivotAuditsF9T2c(player, audits);
  candidates.sort((a, b) => b.score - a.score || a.objective.distance - b.objective.distance || expertExordiumCoordKeyF9T2(a.coord).localeCompare(expertExordiumCoordKeyF9T2(b.coord)) || String(a.card.cardUid || a.bp.id).localeCompare(String(b.card.cardUid || b.bp.id)));
  return candidates;
}

function expertExordiumCreateForwardPivotPlanF9T2c(context, candidate) {
  if (!context || !candidate || typeof expertCreateMicroPlanF9T1 !== "function") return null;
  const player = Number(context.player || 0);
  const round = Math.max(0, Number(state && state.turn || 0));
  const planId = `EX-F9T2C2-PIVOT-${player}-${round}-${String(candidate.card.cardUid || candidate.bp.id)}`;
  const step = {
    id:`${planId}-DEPLOY`,
    action:"deploy_pivot_forward",
    blueprintId:candidate.bp.id,
    cardUid:candidate.card.cardUid || null,
    targetCell:candidate.coord.slice(0, 3),
    sourceStructureId:candidate.sourceStructureId,
    projectedMove:candidate.projectedMove,
    projectedEndCellNextTurn:candidate.projectedEndCellNextTurn.slice(0, 3),
    objectiveType:candidate.objective.type,
    objectiveCell:candidate.objective.coord.slice(0, 3),
    requiredEnergy:Number(candidate.cost || 0)
  };
  const created = expertCreateMicroPlanF9T1({
    id:planId,
    faction:"Exordium",
    goal:"EXORDIUM_FORWARD_PIVOT_DEPLOYMENT",
    targetCell:candidate.coord,
    targetPs:candidate.objective.type.includes("PS") || candidate.objective.type.includes("CENTER") ? candidate.objective.coord : null,
    targetUnitId:candidate.objective.unitId || null,
    primaryActorId:candidate.sourceStructureId,
    supportActorIds:candidate.supportActorIds,
    requiredEnergy:Number(candidate.cost || 0),
    reservedEnergy:Number(candidate.cost || 0),
    reservedActions:[`deploy:${candidate.bp.id}`],
    orderedSteps:[step],
    expectedResult:{
      pivotDeployed:true,
      impactWithinRounds:EXPERT_EXORDIUM_PIVOT_IMPACT_WINDOW_F9T2C,
      objectiveType:candidate.objective.type,
      objectiveCell:candidate.objective.coord,
      projectedEndCellNextTurn:candidate.projectedEndCellNextTurn
    },
    abortConditions:["hq_occupation_risk_direct", "pivot_unavailable", "advanced_node_lost", "support_lost", "deployment_cell_invalid", "reserved_energy_unavailable"],
    fallbackPlan:"advanced_f9t0",
    status:"proposed"
  });
  if (!created.validation.ok) return null;
  created.plan.exordium = {
    contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2C4,
    doctrine:"forward_pivot_deployment",
    candidateScore:Number(candidate.score.toFixed(3)),
    sourceStructureId:candidate.sourceStructureId,
    deploymentCell:candidate.coord.slice(0, 3),
    projectedEndCellNextTurn:candidate.projectedEndCellNextTurn.slice(0, 3),
    distanceToCenterAfterMove:candidate.distanceToCenterAfterMove,
    distanceToNearestEnemyPsAfterMove:candidate.distanceToNearestEnemyPsAfterMove,
    attackOrAbilityRangeAfterMove:candidate.attackOrAbilityRangeAfterMove,
    objectiveType:candidate.objective.type,
    objectiveCell:candidate.objective.coord.slice(0, 3),
    threat:candidate.threat
  };
  return created.plan;
}

function expertExordiumEnsureForwardPivotMemoryF9T2c() {
  if (!state) return null;
  if (!state.expertAiF9T2c || state.expertAiF9T2c.schemaVersion !== EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C1) {
    state.expertAiF9T2c = {
      schemaVersion:EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C1,
      forwardPivotByPlayer:{},
      pivotImpactByUnit:{},
      lastForwardPivotResultByPlayer:{},
      pivotResults:[],
      pendingTemporalDecisionsByPlayer:{}
    };
  }
  if (!state.expertAiF9T2c.pivotImpactByUnit) state.expertAiF9T2c.pivotImpactByUnit = {};
  if (!Array.isArray(state.expertAiF9T2c.pivotResults)) state.expertAiF9T2c.pivotResults = [];
  if (!state.expertAiF9T2c.pendingTemporalDecisionsByPlayer) state.expertAiF9T2c.pendingTemporalDecisionsByPlayer = {};
  return state.expertAiF9T2c;
}

function expertExordiumDeploymentSourceF9T2c1(data = {}) {
  const doctrine = String(data.expertDoctrine || "");
  const source = String(data.spawnSource || data.source || "unknown");
  if (doctrine.includes("forward_pivot")) return "expert_forward_plan";
  if (source === "hand_deck") return "advanced_fallback";
  if (["starter_roster", "market"].includes(source)) return "roster_or_market";
  if (["ability_spawn", "structure_spawn"].includes(source)) return source;
  return source === "unknown" ? "advanced_fallback" : source;
}

function expertExordiumTrackAnyPivotF9T2c1(player, unit, options = {}) {
  if (!unit || unit.alive === false || Number(unit.side) !== Number(player) || unit.faction !== "Exordium" || !expertExordiumIsPivotBlueprintF9T2c(unit)) return null;
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  if (!memory) return null;
  const unitId = expertExordiumUnitIdF9T2b(unit);
  const round = Math.max(0, Number(options.deploymentRound != null ? options.deploymentRound : (state && state.turn || 0)));
  let tracking = memory.pivotImpactByUnit[unitId] || null;
  if (!tracking || tracking.status !== "awaiting_impact") {
    tracking = {
      player:Number(player),
      unitId,
      blueprintId:String(unit.blueprintId || unit.id || ""),
      unitName:String(unit.name || ""),
      deploymentSource:String(options.deploymentSource || unit.spawnSource || "unknown"),
      deployedRound:round,
      firstImpactRound:null,
      roundsToFirstImpact:null,
      impactType:null,
      impactMiss:false,
      impactDeadlineRound:round + EXPERT_EXORDIUM_PIVOT_IMPACT_WINDOW_F9T2C,
      deploymentSequence:options.deploymentSequence != null ? options.deploymentSequence : null,
      deploymentCell:Array.isArray(unit.pos) ? unit.pos.slice(0, 3) : null,
      projectedEndCellNextTurn:Array.isArray(options.projectedEndCellNextTurn) ? options.projectedEndCellNextTurn.slice(0, 3) : null,
      objectiveType:options.objectiveType || null,
      objectiveCell:Array.isArray(options.objectiveCell) ? options.objectiveCell.slice(0, 3) : null,
      status:"awaiting_impact"
    };
    memory.pivotImpactByUnit[unitId] = tracking;
  } else {
    if (options.deploymentSource) tracking.deploymentSource = String(options.deploymentSource);
    if (options.deploymentSequence != null) tracking.deploymentSequence = options.deploymentSequence;
    if (Array.isArray(options.projectedEndCellNextTurn)) tracking.projectedEndCellNextTurn = options.projectedEndCellNextTurn.slice(0, 3);
    if (options.objectiveType) tracking.objectiveType = options.objectiveType;
    if (Array.isArray(options.objectiveCell)) tracking.objectiveCell = options.objectiveCell.slice(0, 3);
  }
  memory.forwardPivotByPlayer[String(Number(player))] = tracking;
  return tracking;
}

function expertExordiumForwardPivotTrackF9T2c(player, unit, plan, choice) {
  return expertExordiumTrackAnyPivotF9T2c1(player, unit, {
    deploymentSource:"expert_forward_plan",
    deploymentSequence:expertExordiumRuntimeF9T2(player) ? expertExordiumRuntimeF9T2(player).sequence : null,
    projectedEndCellNextTurn:plan && plan.exordium && plan.exordium.projectedEndCellNextTurn,
    objectiveType:plan && plan.exordium && plan.exordium.objectiveType,
    objectiveCell:plan && plan.exordium && plan.exordium.objectiveCell
  });
}

function expertExordiumResolveForwardPivotImpactF9T2c(player, tracking, impactKind, event = null, details = {}) {
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  if (!memory || !tracking || tracking.status !== "awaiting_impact") return false;
  const round = Math.max(0, Number(state && state.turn || 0));
  const missed = impactKind === "DESTROYED_BEFORE_IMPACT" || impactKind === "WINDOW_EXPIRED";
  tracking.status = missed ? "missed" : "impacted";
  tracking.firstImpactRound = missed ? null : round;
  tracking.roundsToFirstImpact = missed ? null : Math.max(0, round - Number(tracking.deployedRound || round));
  tracking.impactType = String(impactKind || "UNKNOWN");
  tracking.impactMiss = missed;
  tracking.impact = {
    kind:tracking.impactType,
    round,
    roundsToImpact:tracking.roundsToFirstImpact,
    eventType:event && event.type || null,
    ...expertSafeCloneF9T1(details)
  };
  const result = expertSafeCloneF9T1(tracking);
  memory.lastForwardPivotResultByPlayer[String(Number(player))] = result;
  memory.pivotResults.push(result);
  if (memory.pivotResults.length > EXPERT_EXORDIUM_PIVOT_RESULT_LIMIT_F9T2C1) memory.pivotResults.splice(0, memory.pivotResults.length - EXPERT_EXORDIUM_PIVOT_RESULT_LIMIT_F9T2C1);
  delete memory.pivotImpactByUnit[String(tracking.unitId)];
  if (memory.forwardPivotByPlayer[String(Number(player))] && String(memory.forwardPivotByPlayer[String(Number(player))].unitId) === String(tracking.unitId)) delete memory.forwardPivotByPlayer[String(Number(player))];
  expertExordiumEmitDecisionF9T2c1(player, missed ? "forward_pivot_impact_window_missed" : "forward_pivot_impact", {
    unitId:tracking.unitId,
    blueprintId:tracking.blueprintId,
    deploymentSource:tracking.deploymentSource,
    deploymentRound:tracking.deployedRound,
    firstImpactRound:tracking.firstImpactRound,
    roundsToFirstImpact:tracking.roundsToFirstImpact,
    impactType:tracking.impactType,
    impactMiss:tracking.impactMiss,
    deploymentCell:tracking.deploymentCell,
    projectedEndCellNextTurn:tracking.projectedEndCellNextTurn,
    objectiveType:tracking.objectiveType,
    objectiveCell:tracking.objectiveCell,
    impact:tracking.impact
  }, { sequence:tracking.deploymentSequence });
  return true;
}

function expertExordiumCheckForwardPivotExpiryF9T2c(player) {
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  if (!memory) return false;
  const round = Math.max(0, Number(state && state.turn || 0));
  const legacy = memory.forwardPivotByPlayer && memory.forwardPivotByPlayer[String(Number(player))];
  if (legacy && legacy.status === "awaiting_impact" && !memory.pivotImpactByUnit[String(legacy.unitId)]) {
    legacy.player = Number(player);
    legacy.deploymentSource = legacy.deploymentSource || "legacy_forward_tracking";
    memory.pivotImpactByUnit[String(legacy.unitId)] = legacy;
  }
  let changed = false;
  for (const tracking of Object.values(memory.pivotImpactByUnit || {})) {
    if (!tracking || tracking.status !== "awaiting_impact" || Number(tracking.player) !== Number(player)) continue;
    if (round <= Number(tracking.impactDeadlineRound || 0)) continue;
    changed = expertExordiumResolveForwardPivotImpactF9T2c(player, tracking, "WINDOW_EXPIRED", null, { deadlineRound:tracking.impactDeadlineRound }) || changed;
  }
  return changed;
}

function expertExordiumReconcileActivePlanF9T2c1(player, options = {}) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const plan = runtime && runtime.plan;
  if (!plan || plan.status !== "active" || plan.goal !== "EXORDIUM_CLEAR_OCCUPY_FORTIFY") return false;
  if (plan.exordium && plan.exordium.authoritativeReconcileRecorded) return false;
  const targetPs = Array.isArray(plan.targetPs) ? plan.targetPs : plan.targetCell;
  if (!Array.isArray(targetPs)) return false;
  const target = plan.targetUnitId ? expertExordiumUnitByIdF9T2b(plan.targetUnitId) : null;
  const targetRemoved = !target || target.alive === false || !Array.isArray(target.pos) || !expertExordiumSameCoordF9T2(target.pos, targetPs);
  if (!targetRemoved) return false;
  const cell = typeof getCellAt === "function" ? getCellAt(targetPs) : null;
  const occupant = typeof getUnitAt === "function" ? getUnitAt(targetPs) : null;
  const ownOccupant = occupant && occupant.alive !== false && Number(occupant.side) === Number(player) && occupant.type !== "QG";
  const controlled = Boolean(cell && Number(cell.control) === Number(player));
  if (!controlled || !ownOccupant) return false;
  const fortified = occupant.type === "Struttura";
  const occupied = !fortified;
  let guard = 0;
  while (plan.status === "active" && plan.currentStep < plan.orderedSteps.length && guard < 8) {
    const step = plan.orderedSteps[plan.currentStep];
    expertAdvancePlanStepF9T2(player, {
      stepId:step && step.id || null,
      action:step && step.action || null,
      result:"authoritative_ps_conversion_observed",
      phase:String(options.phase || "runtime"),
      targetRemoved:true,
      targetPs:targetPs.slice(0, 3),
      occupantId:expertExordiumUnitIdF9T2b(occupant),
      psOccupied:occupied,
      psFortified:fortified
    });
    guard += 1;
  }
  if (!plan.exordium) plan.exordium = {};
  plan.exordium.authoritativeReconcileRecorded = true;
  expertExordiumMarkTerritorialMetricF9T2c3(player, "psClearedDuringExpertPlan");
  if (occupied) expertExordiumMarkTerritorialMetricF9T2c3(player, "psOccupiedAfterClear");
  if (fortified) expertExordiumMarkTerritorialMetricF9T2c3(player, "psFortifiedAfterClear");
  plan.reservedEnergy = 0;
  expertExordiumEmitDecisionF9T2c1(player, "territorial_conversion_authoritative_reconcile", {
    authoritativeReconcile:true,
    planId:plan.id,
    targetPs:targetPs.slice(0, 3),
    targetUnitId:plan.targetUnitId || null,
    occupantId:expertExordiumUnitIdF9T2b(occupant),
    psCleared:true,
    psOccupied:occupied,
    psFortified:fortified,
    phase:String(options.phase || "runtime")
  });
  return true;
}

function expertAiHandleGameEventF9T2c(event) {
  const handledBase = typeof expertAiHandleGameEventF9T2b === "function" ? expertAiHandleGameEventF9T2b(event) : false;
  if (!event || !state || state.aiMode !== "expert" || typeof EventTypes === "undefined") return handledBase;
  const data = event.data || {};
  const side = Number(data.player || data.side || 0);
  if (event.type === EventTypes.UNIT_SPAWNED && side && state.factions && state.factions[side] === "Exordium") {
    const unit = expertExordiumUnitByIdF9T2b(data.unitId);
    if (unit && expertExordiumIsPivotBlueprintF9T2c(unit)) {
      expertExordiumTrackAnyPivotF9T2c1(side, unit, {
        deploymentSource:expertExordiumDeploymentSourceF9T2c1(data),
        deploymentRound:Number(data.round != null ? data.round : state.turn || 0),
        deploymentSequence:expertExordiumRuntimeF9T2(side) ? expertExordiumRuntimeF9T2(side).sequence : null
      });
    }
  }
  if (event.type === EventTypes.PS_CONTROL_CHANGED && side && state.factions && state.factions[side] === "Exordium") {
    expertExordiumReconcileActivePlanF9T2c1(side, { phase:"ps_control_event" });
  }
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  if (!memory) return handledBase;
  let changed = false;
  for (const tracking of Object.values(memory.pivotImpactByUnit || {})) {
    if (!tracking || tracking.status !== "awaiting_impact") continue;
    const owner = Number(tracking.player || 0);
    if (event.type === EventTypes.UNIT_ATTACKED && String(data.attackerId || "") === String(tracking.unitId)) {
      changed = expertExordiumResolveForwardPivotImpactF9T2c(owner, tracking, "ATTACK", event, { targetUnitId:data.defenderId || null, amount:Number(data.amount || 0) }) || changed;
      continue;
    }
    if (event.type === EventTypes.ABILITY_USED && String(data.unitId || data.casterId || "") === String(tracking.unitId)) {
      changed = expertExordiumResolveForwardPivotImpactF9T2c(owner, tracking, "ABILITY", event, { abilityKind:data.abilityKind || data.abilityName || null, targetUnitId:data.targetId || null }) || changed;
      continue;
    }
    if (event.type === EventTypes.PS_CONTROL_CHANGED && String(data.occupantId || "") === String(tracking.unitId) && Number(data.nextControl || 0) === owner) {
      changed = expertExordiumResolveForwardPivotImpactF9T2c(owner, tracking, "PS_CONTROL", event, { coord:Array.isArray(data.coord) ? data.coord.slice(0, 3) : null }) || changed;
      continue;
    }
    if (event.type === EventTypes.UNIT_DESTROYED && String(data.unitId || "") === String(tracking.unitId)) {
      changed = expertExordiumResolveForwardPivotImpactF9T2c(owner, tracking, "DESTROYED_BEFORE_IMPACT", event, { destroyedBySide:Number(data.destroyedBySide || data.killerSide || 0) || null }) || changed;
    }
  }
  return changed || handledBase;
}


function expertExordiumHasImmediateTerritorialCandidateF9T2c1(player) {
  for (const cell of expertExordiumPsCellsF9T2a()) {
    const occupant = typeof getUnitAt === "function" ? getUnitAt(cell.coord) : null;
    if (occupant && occupant.alive !== false && Number(occupant.side) !== Number(player) && occupant.type !== "QG") return true;
    if (Number(cell.control) === Number(player) && occupant && occupant.alive !== false && Number(occupant.side) === Number(player) && occupant.type !== "Struttura" && occupant.type !== "QG") {
      const hasStructure = expertExordiumUnitsF9T2(player).some(unit => unit && unit.alive !== false && unit.type === "Struttura" && expertExordiumSameCoordF9T2(unit.pos, cell.coord));
      if (!hasStructure) return true;
    }
  }
  return false;
}

function expertExordiumModuleF9T2c(context) {
  if (!context || context.faction !== "Exordium") return { moduleId:"expert-exordium-f9t2c4", faction:"Exordium", plan:null, status:"not_applicable", reason:"wrong_faction" };
  expertExordiumFlushTemporalPivotDecisionsF9T2c3a(context.player);
  expertExordiumCheckForwardPivotExpiryF9T2c(context.player);
  const shouldScanTerritory = expertExordiumHasImmediateTerritorialCandidateF9T2c1(context.player);
  const base = shouldScanTerritory ? expertExordiumModuleF9T2b(context) : null;
  if (base && base.plan) return { ...base, moduleId:"expert-exordium-f9t2c4", contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2C4 };
  if (base && ["wrong_faction", "hq_occupation_risk_priority"].includes(base.reason)) return { ...base, moduleId:"expert-exordium-f9t2c4", contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2C4 };
  const runtime = expertExordiumRuntimeF9T2(context.player);
  const candidates = expertExordiumForwardPivotCandidatesF9T2c(context);
  if (runtime) {
    runtime.candidateCount = Number(runtime.candidateCount || 0) + candidates.length;
    runtime.discardedCandidates = Number(runtime.discardedCandidates || 0) + Math.max(0, candidates.length - 1);
  }
  if (candidates.length) {
    const plan = expertExordiumCreateForwardPivotPlanF9T2c(context, candidates[0]);
    if (plan) return { moduleId:"expert-exordium-f9t2c4", faction:"Exordium", plan, status:"microplan_selected", reason:"forward_pivot_projected_impact_available", candidateCount:candidates.length, contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2C4 };
  }
  return { moduleId:"expert-exordium-f9t2c4", faction:"Exordium", plan:null, status:"fallback", reason:"no_territorial_conversion_safe_relay_or_projected_forward_pivot_candidate", candidateCount:0, contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2C4 };
}

function expertExordiumModuleF9T2a(context) { return expertExordiumModuleF9T2c(context); }
function expertExordiumModuleF9T2(context) { return expertExordiumModuleF9T2c(context); }
function expertExordiumModuleF9T1(context) { return expertExordiumModuleF9T2c(context); }

function expertExordiumRosterChoiceF9T2c(player) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const step = expertExordiumCurrentStepF9T2(player);
  if (!runtime || !step || step.action !== "deploy_pivot_forward") return expertExordiumRosterChoiceF9T2(player);
  const abort = (reason, details = {}) => {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, reason, details);
    return null;
  };
  const hqRisk = runtime.context && runtime.context.common && runtime.context.common.hqOccupationRisk ? runtime.context.common.hqOccupationRisk.risk : "unknown";
  if (hqRisk === "occupied" || hqRisk === "direct") return abort("hq_occupation_risk_priority", { hqRisk });
  const hand = state && state.hand && Array.isArray(state.hand[player]) ? state.hand[player] : [];
  const card = hand.find(candidate => candidate && String(candidate.cardUid || "") === String(step.cardUid || "")) || null;
  if (!card || (typeof handCardBlocked === "function" && handCardBlocked(card))) return abort("pivot_unavailable", { cardUid:step.cardUid });
  const bp = typeof blueprintForHandCard === "function" ? blueprintForHandCard(card, player) : (Array.isArray(BLUEPRINTS) ? BLUEPRINTS.find(candidate => candidate && candidate.id === step.blueprintId) || null : null);
  if (!bp || !expertExordiumIsPivotBlueprintF9T2c(bp, card) || expertExordiumPivotInPlayF9T2c(player)) return abort("pivot_unavailable", { blueprintId:step.blueprintId });
  const source = expertExordiumUnitByIdF9T2b(step.sourceStructureId);
  if (!source || source.alive === false || source.type !== "Struttura" || expertExordiumDistanceF9T2(source.pos, step.targetCell) !== 1) return abort("advanced_node_lost", { sourceStructureId:step.sourceStructureId });
  const support = expertExordiumForwardPivotSupportF9T2c(player, step.targetCell);
  if (support.count < 1) return abort("support_lost", { targetCell:step.targetCell });
  const legal = typeof spawnCellsFor === "function" ? (spawnCellsFor(player, bp) || []).some(coord => expertExordiumSameCoordF9T2(coord, step.targetCell)) : false;
  if (!legal) return abort("deployment_cell_invalid", { targetCell:step.targetCell });
  const cost = typeof effectiveHandUnitCardCost === "function" ? Number(effectiveHandUnitCardCost(player, card, bp, step.targetCell)) : Number(bp.cost || 0);
  if (!Number.isFinite(cost) || Number(state.energy && state.energy[player] || 0) < cost) return abort("reserved_energy_unavailable", { requiredEnergy:cost });
  return {
    source:"hand",
    bp,
    cardUid:card.cardUid || null,
    cardName:card.name || bp.name,
    coord:step.targetCell.slice(0, 3),
    cost,
    score:1300,
    projectedEndCellNextTurn:Array.isArray(step.projectedEndCellNextTurn) ? step.projectedEndCellNextTurn.slice(0, 3) : null,
    objectiveType:step.objectiveType,
    objectiveCell:Array.isArray(step.objectiveCell) ? step.objectiveCell.slice(0, 3) : null,
    expertPlanId:runtime.plan.id,
    expertStepId:step.id,
    expertDoctrine:"exordium_forward_pivot_deployment_f9t2c2"
  };
}

function expertExordiumObserveRosterPlayF9T2c(player, choice) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const step = expertExordiumCurrentStepF9T2(player);
  if (!runtime || !step || step.action !== "deploy_pivot_forward") return expertExordiumObserveRosterPlayF9T2(player, choice);
  if (!choice || !choice.bp || choice.bp.id !== step.blueprintId || !expertExordiumSameCoordF9T2(choice.coord, step.targetCell)) return false;
  const pivot = typeof getUnitAt === "function" ? getUnitAt(step.targetCell) : null;
  if (!pivot || pivot.side !== Number(player) || !expertExordiumIsPivotBlueprintF9T2c(pivot)) {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "pivot_spawn_not_observed", { targetCell:step.targetCell, blueprintId:step.blueprintId });
    return false;
  }
  runtime.plan.reservedEnergy = 0;
  const tracking = expertExordiumForwardPivotTrackF9T2c(player, pivot, runtime.plan, choice);
  if (typeof expertAdvancePlanStepF9T2 === "function") expertAdvancePlanStepF9T2(player, {
    stepId:step.id,
    action:step.action,
    result:"pivot_deployed_forward",
    unitId:expertExordiumUnitIdF9T2b(pivot),
    blueprintId:choice.bp.id,
    targetCell:step.targetCell,
    sourceStructureId:step.sourceStructureId,
    projectedEndCellNextTurn:step.projectedEndCellNextTurn,
    objectiveType:step.objectiveType,
    objectiveCell:step.objectiveCell,
    energySpent:Number(choice.cost || 0),
    impactDeadlineRound:tracking ? tracking.impactDeadlineRound : null
  });
  expertExordiumEmitDecisionF9T2c1(player, "forward_pivot_deployed", {
    unitId:expertExordiumUnitIdF9T2b(pivot),
    blueprintId:choice.bp.id,
    deploymentSource:"expert_forward_plan",
    deploymentCell:step.targetCell,
    sourceStructureId:step.sourceStructureId,
    projectedEndCellNextTurn:step.projectedEndCellNextTurn,
    objectiveType:step.objectiveType,
    objectiveCell:step.objectiveCell,
    impactDeadlineRound:tracking ? tracking.impactDeadlineRound : null
  });
  return true;
}


// =====================================================
// F9T2c2 — Forward Pivot Impact & objective discipline
// =====================================================
const EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2C2 = "F9T2C2-EXORDIUM-1";
const EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C2 = "F9T2c2-1";
const EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C3A = "F9T2c3a-1";

function expertExordiumProjectedPivotObjectiveF9T2c1(player, bp, deploymentCoord, sourceCoord, projectedMove) {
  const reachable = expertExordiumProjectedReachableCellsF9T2c1(deploymentCoord, projectedMove);
  const attackRange = Math.max(1, Number(bp && (bp.attackRange || bp.range) || 1));
  const abilityRange = Math.max(0, Number(bp && bp.ability && bp.ability.range || 0));
  const enemies = expertExordiumEnemyUnitsF9T2(player);
  const ownUnits = expertExordiumUnitsF9T2(player);
  const center = expertExordiumCentralCoordF9T2c1();
  const enemyHqs = typeof getEnemyPlayers === "function" && typeof getHq === "function"
    ? (getEnemyPlayers(player) || []).map(getHq).filter(hq => hq && Array.isArray(hq.pos)) : [];
  const options = [];

  for (const entry of reachable) {
    const end = entry.coord;
    const cell = typeof getCellAt === "function" ? getCellAt(end) : null;
    let best = null;

    // 1) impatto territoriale autorevole: la Pivot termina realmente sul PS.
    if (cell && cell.ps && Number(cell.control) !== Number(player)) {
      const isCenter = expertExordiumIsCenterF9T2c1(end);
      best = {
        type:isCenter ? "CENTER_CAPTURE" : "ENEMY_PS_CAPTURE",
        coord:end.slice(0, 3), distance:0,
        score:260 + (isCenter ? 45 : 0) + (cell.control ? 20 : 0)
      };
    }

    // 2) attacco concretamente disponibile dalla posizione proiettata.
    for (const enemy of enemies) {
      if (!enemy || enemy.alive === false || !Array.isArray(enemy.pos)) continue;
      const distance = expertExordiumDistanceF9T2(end, enemy.pos);
      if (distance > attackRange) continue;
      let score = 205 - distance * 3;
      if (enemy.type === "Comandante") score += 42;
      if (String(enemy.weight || "").toLowerCase() === "pivot") score += 36;
      if (enemy.type === "Struttura") score += 20;
      const targetCell = typeof getCellAt === "function" ? getCellAt(enemy.pos) : null;
      if (targetCell && targetCell.ps) score += 34;
      const candidate = { type:"IMMEDIATE_ATTACK", coord:enemy.pos.slice(0, 3), unitId:expertExordiumUnitIdF9T2b(enemy), distance, score };
      if (!best || candidate.score > best.score) best = candidate;
    }

    // 3) abilità a impatto reale: almeno un nemico in area e rapporto bersagli non sfavorevole.
    if (abilityRange > 0) {
      const enemiesInRange = enemies.filter(enemy => enemy && enemy.alive !== false && Array.isArray(enemy.pos) && expertExordiumDistanceF9T2(end, enemy.pos) <= abilityRange);
      const alliesInRange = ownUnits.filter(ally => ally && ally.alive !== false && Array.isArray(ally.pos) && expertExordiumDistanceF9T2(end, ally.pos) <= abilityRange);
      if (enemiesInRange.length && enemiesInRange.length >= Math.max(1, alliesInRange.length - 1)) {
        const target = enemiesInRange.slice().sort((a,b) => {
          const av = (a.type === "Comandante" ? 3 : 0) + (String(a.weight || "").toLowerCase() === "pivot" ? 2 : 0);
          const bv = (b.type === "Comandante" ? 3 : 0) + (String(b.weight || "").toLowerCase() === "pivot" ? 2 : 0);
          return bv-av || expertExordiumDistanceF9T2(end,a.pos)-expertExordiumDistanceF9T2(end,b.pos);
        })[0];
        const candidate = { type:"IMMEDIATE_ABILITY", coord:target.pos.slice(0,3), unitId:expertExordiumUnitIdF9T2b(target), distance:expertExordiumDistanceF9T2(end,target.pos), score:218 + enemiesInRange.length*12 - alliesInRange.length*5 };
        if (!best || candidate.score > best.score) best = candidate;
      }
    }

    // 4) corridoio QG solo se operativo, non per semplice riduzione della distanza.
    for (const hq of enemyHqs) {
      const distance = expertExordiumDistanceF9T2(end, hq.pos);
      if (distance <= attackRange) {
        const candidate = { type:"HQ_BREAKTHROUGH", coord:hq.pos.slice(0,3), distance, score:290-distance*4 };
        if (!best || candidate.score > best.score) best = candidate;
      } else if (distance <= Math.max(2, attackRange + 1) && typeof countControlledPS === "function" && countControlledPS(player) >= 1) {
        const deployDistance = expertExordiumDistanceF9T2(deploymentCoord, hq.pos);
        if (deployDistance - distance >= 1) {
          const candidate = { type:"HQ_CORRIDOR", coord:hq.pos.slice(0,3), distance, score:176-distance*4 };
          if (!best || candidate.score > best.score) best = candidate;
        }
      }
    }

    if (!best) continue;
    const nearestPs = expertExordiumNearestEnemyPsF9T2c1(player, end);
    const centerDistance = center ? expertExordiumDistanceF9T2(end, center) : null;
    options.push({
      ...best,
      projectedEndCellNextTurn:end.slice(0,3),
      preferredMoveCell:end.slice(0,3),
      preferredTargetId:best.unitId || null,
      movementCost:Number(entry.cost || 0),
      distanceToCenterAfterMove:centerDistance,
      distanceToNearestEnemyPsAfterMove:nearestPs ? nearestPs.distance : null,
      attackOrAbilityRangeAfterMove:Math.max(attackRange, abilityRange),
      score:Number(best.score || 0) - Number(entry.cost || 0)*0.25
    });
  }

  options.sort((a,b) => b.score-a.score || a.distance-b.distance || expertExordiumCoordKeyF9T2(a.projectedEndCellNextTurn).localeCompare(expertExordiumCoordKeyF9T2(b.projectedEndCellNextTurn)));
  return options[0] || null;
}

function expertExordiumEnsureForwardPivotMemoryF9T2c() {
  if (!state) return null;
  if (!state.expertAiF9T2c || ![EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C1, EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C2, EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C3A].includes(state.expertAiF9T2c.schemaVersion)) {
    state.expertAiF9T2c = { schemaVersion:EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C3A, forwardPivotByPlayer:{}, pivotImpactByUnit:{}, lastForwardPivotResultByPlayer:{}, pivotResults:[], pendingTemporalDecisionsByPlayer:{} };
  }
  state.expertAiF9T2c.schemaVersion = EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C3A;
  if (!state.expertAiF9T2c.forwardPivotByPlayer) state.expertAiF9T2c.forwardPivotByPlayer = {};
  if (!state.expertAiF9T2c.pivotImpactByUnit) state.expertAiF9T2c.pivotImpactByUnit = {};
  if (!state.expertAiF9T2c.lastForwardPivotResultByPlayer) state.expertAiF9T2c.lastForwardPivotResultByPlayer = {};
  if (!Array.isArray(state.expertAiF9T2c.pivotResults)) state.expertAiF9T2c.pivotResults = [];
  if (!state.expertAiF9T2c.pendingTemporalDecisionsByPlayer) state.expertAiF9T2c.pendingTemporalDecisionsByPlayer = {};
  return state.expertAiF9T2c;
}

function expertExordiumTrackAnyPivotF9T2c1(player, unit, options = {}) {
  if (!unit || unit.alive === false || Number(unit.side) !== Number(player) || unit.faction !== "Exordium" || !expertExordiumIsPivotBlueprintF9T2c(unit)) return null;
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  if (!memory) return null;
  const unitId = expertExordiumUnitIdF9T2b(unit);
  const round = Math.max(0, Number(options.deploymentRound != null ? options.deploymentRound : (state && state.turn || 0)));
  let tracking = memory.pivotImpactByUnit[unitId] || null;
  if (!tracking || ["final_missed","impacted","late_impacted"].includes(tracking.status)) {
    tracking = {
      player:Number(player), unitId,
      blueprintId:String(unit.blueprintId || unit.id || ""), unitName:String(unit.name || ""),
      deploymentSource:String(options.deploymentSource || unit.spawnSource || "unknown"),
      deployedRound:round, impactDeadlineRound:round + EXPERT_EXORDIUM_PIVOT_IMPACT_WINDOW_F9T2C,
      deploymentSequence:options.deploymentSequence != null ? options.deploymentSequence : null,
      deploymentCell:Array.isArray(unit.pos) ? unit.pos.slice(0,3) : null,
      projectedEndCellNextTurn:Array.isArray(options.projectedEndCellNextTurn) ? options.projectedEndCellNextTurn.slice(0,3) : null,
      preferredMoveCell:Array.isArray(options.projectedEndCellNextTurn) ? options.projectedEndCellNextTurn.slice(0,3) : null,
      objectiveType:options.objectiveType || null,
      forwardRole:options.objectiveType || null,
      objectiveCell:Array.isArray(options.objectiveCell) ? options.objectiveCell.slice(0,3) : null,
      preferredTargetId:options.preferredTargetId || null,
      impactWithinDeadline:null, impactMiss:false, impactWindowMissRecorded:false,
      firstActualImpactRound:null, roundsToFirstActualImpact:null, firstActualImpactType:null,
      status:"awaiting_impact"
    };
    memory.pivotImpactByUnit[unitId] = tracking;
  } else {
    if (options.deploymentSource) tracking.deploymentSource = String(options.deploymentSource);
    if (options.deploymentSequence != null) tracking.deploymentSequence = options.deploymentSequence;
    if (Array.isArray(options.projectedEndCellNextTurn)) tracking.projectedEndCellNextTurn = tracking.preferredMoveCell = options.projectedEndCellNextTurn.slice(0,3);
    if (options.objectiveType) tracking.objectiveType = tracking.forwardRole = options.objectiveType;
    if (Array.isArray(options.objectiveCell)) tracking.objectiveCell = options.objectiveCell.slice(0,3);
    if (options.preferredTargetId) tracking.preferredTargetId = String(options.preferredTargetId);
  }
  memory.forwardPivotByPlayer[String(Number(player))] = tracking;
  return tracking;
}

function expertExordiumForwardPivotTrackF9T2c(player, unit, plan, choice) {
  return expertExordiumTrackAnyPivotF9T2c1(player, unit, {
    deploymentSource:"expert_forward_plan",
    deploymentSequence:expertExordiumRuntimeF9T2(player) ? expertExordiumRuntimeF9T2(player).sequence : null,
    projectedEndCellNextTurn:plan && plan.exordium && plan.exordium.projectedEndCellNextTurn,
    objectiveType:plan && plan.exordium && plan.exordium.objectiveType,
    objectiveCell:plan && plan.exordium && plan.exordium.objectiveCell,
    preferredTargetId:plan && plan.targetUnitId
  });
}

function expertExordiumTemporalPivotPayloadF9T2c3a(tracking, payload = {}) {
  const runtime = tracking ? expertExordiumRuntimeF9T2(tracking.player) : null;
  return {
    ...expertSafeCloneF9T1(payload || {}),
    trackedPivotId:tracking && tracking.unitId || null,
    deploymentRound:tracking && tracking.deployedRound != null ? Number(tracking.deployedRound) : null,
    deploymentSequence:tracking && tracking.deploymentSequence != null ? Number(tracking.deploymentSequence) : null,
    deploymentTurnSequence:tracking && tracking.deploymentSequence != null ? Number(tracking.deploymentSequence) : null,
    deploymentDecisionId:tracking ? `pivot-deploy:${String(tracking.unitId || "unknown")}:${String(tracking.deploymentSequence == null ? "na" : tracking.deploymentSequence)}` : null,
    determinedRound:Number(state && state.turn || 0),
    temporalOwnerSequence:runtime && !runtime.completed ? Number(runtime.sequence) : null
  };
}

function expertExordiumEmitTemporalPivotDecisionF9T2c3a(player, kind, tracking, payload = {}) {
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  if (!memory) return null;
  const enriched = expertExordiumTemporalPivotPayloadF9T2c3a(tracking, payload);
  const runtime = expertExordiumRuntimeF9T2(player);
  if (runtime && !runtime.completed) {
    return expertExordiumEmitDecisionF9T2c1(player, kind, enriched, { source:"expert_exordium_f9t2c3a_temporal" });
  }
  const key = String(Number(player));
  if (!Array.isArray(memory.pendingTemporalDecisionsByPlayer[key])) memory.pendingTemporalDecisionsByPlayer[key] = [];
  memory.pendingTemporalDecisionsByPlayer[key].push({ kind:String(kind), payload:enriched });
  if (memory.pendingTemporalDecisionsByPlayer[key].length > 16) memory.pendingTemporalDecisionsByPlayer[key].splice(0, memory.pendingTemporalDecisionsByPlayer[key].length - 16);
  return null;
}

function expertExordiumFlushTemporalPivotDecisionsF9T2c3a(player) {
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  const runtime = expertExordiumRuntimeF9T2(player);
  if (!memory || !runtime || runtime.completed) return 0;
  const key = String(Number(player));
  const queue = Array.isArray(memory.pendingTemporalDecisionsByPlayer[key]) ? memory.pendingTemporalDecisionsByPlayer[key].splice(0) : [];
  let emitted = 0;
  for (const entry of queue) {
    if (!entry || !entry.kind) continue;
    expertExordiumEmitDecisionF9T2c1(player, entry.kind, { ...expertSafeCloneF9T1(entry.payload || {}), flushedFromPending:true, temporalOwnerSequence:Number(runtime.sequence) }, { source:"expert_exordium_f9t2c3a_temporal" });
    emitted += 1;
  }
  return emitted;
}

function expertExordiumFinalizePivotTrackingF9T2c2(player, tracking, kind, event, details = {}) {
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  if (!memory || !tracking) return false;
  const round = Math.max(0, Number(state && state.turn || 0));
  const actual = !["DESTROYED_BEFORE_IMPACT","WINDOW_EXPIRED"].includes(kind);
  if (kind === "WINDOW_EXPIRED") {
    if (tracking.impactWindowMissRecorded) return false;
    tracking.impactWindowMissRecorded = true;
    tracking.impactWithinDeadline = false;
    tracking.impactMiss = true;
    tracking.status = "awaiting_late_impact";
    expertExordiumEmitTemporalPivotDecisionF9T2c3a(player, "forward_pivot_impact_window_missed", tracking, {
      unitId:tracking.unitId, blueprintId:tracking.blueprintId, deploymentSource:tracking.deploymentSource,
      impactDeadlineRound:tracking.impactDeadlineRound,
      impactWithinDeadline:false, impactMiss:true, objectiveType:tracking.objectiveType,
      objectiveCell:tracking.objectiveCell, deploymentCell:tracking.deploymentCell,
      projectedEndCellNextTurn:tracking.projectedEndCellNextTurn,
      firstActualImpactRound:null, roundsToFirstActualImpact:null, firstActualImpactType:null,
      impact:{ kind:"WINDOW_EXPIRED", round, deadlineRound:tracking.impactDeadlineRound, ...expertSafeCloneF9T1(details) }
    });
    return true;
  }
  if (kind === "DESTROYED_BEFORE_IMPACT") {
    tracking.status = "final_missed";
    tracking.impactWithinDeadline = false;
    tracking.impactMiss = true;
  } else if (actual) {
    tracking.firstActualImpactRound = round;
    tracking.roundsToFirstActualImpact = Math.max(0, round - Number(tracking.deployedRound || round));
    tracking.firstActualImpactType = String(kind || "UNKNOWN");
    tracking.impactWithinDeadline = round <= Number(tracking.impactDeadlineRound || 0);
    tracking.impactMiss = !tracking.impactWithinDeadline;
    tracking.status = tracking.impactWithinDeadline ? "impacted" : "late_impacted";
  }
  tracking.impact = { kind:String(kind || "UNKNOWN"), round, eventType:event && event.type || null, ...expertSafeCloneF9T1(details) };
  const result = expertSafeCloneF9T1(tracking);
  memory.lastForwardPivotResultByPlayer[String(Number(player))] = result;
  memory.pivotResults.push(result);
  if (memory.pivotResults.length > EXPERT_EXORDIUM_PIVOT_RESULT_LIMIT_F9T2C1) memory.pivotResults.splice(0, memory.pivotResults.length-EXPERT_EXORDIUM_PIVOT_RESULT_LIMIT_F9T2C1);
  delete memory.pivotImpactByUnit[String(tracking.unitId)];
  if (memory.forwardPivotByPlayer[String(Number(player))] && String(memory.forwardPivotByPlayer[String(Number(player))].unitId) === String(tracking.unitId)) delete memory.forwardPivotByPlayer[String(Number(player))];
  const recordKind = actual ? (tracking.impactWithinDeadline ? "forward_pivot_impact" : "forward_pivot_late_impact") : "forward_pivot_destroyed_before_impact";
  expertExordiumEmitTemporalPivotDecisionF9T2c3a(player, recordKind, tracking, {
    unitId:tracking.unitId, blueprintId:tracking.blueprintId, deploymentSource:tracking.deploymentSource,
    impactDeadlineRound:tracking.impactDeadlineRound,
    impactWithinDeadline:tracking.impactWithinDeadline, impactMiss:tracking.impactMiss,
    firstActualImpactRound:tracking.firstActualImpactRound,
    roundsToFirstActualImpact:tracking.roundsToFirstActualImpact,
    firstActualImpactType:tracking.firstActualImpactType,
    firstImpactRound:tracking.firstActualImpactRound,
    roundsToFirstImpact:tracking.roundsToFirstActualImpact,
    impactType:tracking.firstActualImpactType || kind,
    deploymentCell:tracking.deploymentCell, projectedEndCellNextTurn:tracking.projectedEndCellNextTurn,
    objectiveType:tracking.objectiveType, objectiveCell:tracking.objectiveCell, impact:tracking.impact
  });
  return true;
}

function expertExordiumResolveForwardPivotImpactF9T2c(player, tracking, impactKind, event = null, details = {}) {
  if (!tracking || !["awaiting_impact","awaiting_late_impact"].includes(tracking.status)) return false;
  return expertExordiumFinalizePivotTrackingF9T2c2(player, tracking, impactKind, event, details);
}

function expertExordiumCheckForwardPivotExpiryF9T2c(player) {
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  if (!memory) return false;
  const round = Math.max(0, Number(state && state.turn || 0));
  let changed = false;
  for (const tracking of Object.values(memory.pivotImpactByUnit || {})) {
    if (!tracking || tracking.status !== "awaiting_impact" || Number(tracking.player) !== Number(player)) continue;
    if (round <= Number(tracking.impactDeadlineRound || 0)) continue;
    changed = expertExordiumFinalizePivotTrackingF9T2c2(player, tracking, "WINDOW_EXPIRED", null, { deadlineRound:tracking.impactDeadlineRound }) || changed;
  }
  return changed;
}

function expertAiHandleGameEventF9T2c(event) {
  const handledBase = typeof expertAiHandleGameEventF9T2b === "function" ? expertAiHandleGameEventF9T2b(event) : false;
  if (!event || !state || state.aiMode !== "expert" || typeof EventTypes === "undefined") return handledBase;
  const data = event.data || {};
  const side = Number(data.player || data.side || 0);
  if (event.type === EventTypes.UNIT_SPAWNED && side && state.factions && state.factions[side] === "Exordium") {
    const unit = expertExordiumUnitByIdF9T2b(data.unitId);
    if (unit && expertExordiumIsPivotBlueprintF9T2c(unit)) expertExordiumTrackAnyPivotF9T2c1(side, unit, { deploymentSource:expertExordiumDeploymentSourceF9T2c1(data), deploymentRound:Number(data.round != null ? data.round : state.turn || 0), deploymentSequence:expertExordiumRuntimeF9T2(side) ? expertExordiumRuntimeF9T2(side).sequence : null });
  }
  if (event.type === EventTypes.PS_CONTROL_CHANGED && side && state.factions && state.factions[side] === "Exordium") expertExordiumReconcileActivePlanF9T2c1(side, { phase:"ps_control_event" });
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  if (!memory) return handledBase;
  let changed = false;
  for (const tracking of Object.values(memory.pivotImpactByUnit || {})) {
    if (!tracking || !["awaiting_impact","awaiting_late_impact"].includes(tracking.status)) continue;
    const owner = Number(tracking.player || 0);
    if (event.type === EventTypes.UNIT_ATTACKED && String(data.attackerId || "") === String(tracking.unitId)) changed = expertExordiumResolveForwardPivotImpactF9T2c(owner, tracking, "ATTACK", event, { targetUnitId:data.defenderId || null, amount:Number(data.amount || 0) }) || changed;
    else if (event.type === EventTypes.ABILITY_USED && String(data.unitId || data.casterId || "") === String(tracking.unitId)) changed = expertExordiumResolveForwardPivotImpactF9T2c(owner, tracking, "ABILITY", event, { abilityKind:data.abilityKind || data.abilityName || null, targetUnitId:data.targetId || null }) || changed;
    else if (event.type === EventTypes.PS_CONTROL_CHANGED && String(data.occupantId || "") === String(tracking.unitId) && Number(data.nextControl || 0) === owner) changed = expertExordiumResolveForwardPivotImpactF9T2c(owner, tracking, "PS_CONTROL", event, { coord:Array.isArray(data.coord) ? data.coord.slice(0,3) : null }) || changed;
    else if (event.type === EventTypes.UNIT_DESTROYED && String(data.unitId || "") === String(tracking.unitId)) changed = expertExordiumResolveForwardPivotImpactF9T2c(owner, tracking, "DESTROYED_BEFORE_IMPACT", event, { destroyedBySide:Number(data.destroyedBySide || data.killerSide || 0) || null }) || changed;
  }
  return changed || handledBase;
}

function expertExordiumForwardTrackingForUnitF9T2c2(unit) {
  if (!unit || unit.faction !== "Exordium") return null;
  const memory = expertExordiumEnsureForwardPivotMemoryF9T2c();
  const tracking = memory && memory.pivotImpactByUnit ? memory.pivotImpactByUnit[expertExordiumUnitIdF9T2b(unit)] : null;
  if (!tracking || !["awaiting_impact","awaiting_late_impact"].includes(tracking.status)) return null;
  return tracking;
}


// =====================================================
// F9T2c4 — CLEAR OCCUPATION COMMITMENT HOTFIX
// =====================================================
// Quando il presidio bersaglio è stato rimosso, la conversione territoriale
// diventa un impegno operativo stretto: l'occupante prenotato viene confermato
// oppure sostituito con una sola scansione bounded delle unità ancora disponibili.
// L'occupazione viene eseguita prima delle azioni generiche del fallback, salvo
// vittoria immediata sul QG o rischio QG diretto/occupato.

const EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2C4 = "F9T2C4-EXORDIUM-1";
const EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C4 = "F9T2c4-1";
const EXPERT_EXORDIUM_CLEAR_REASSIGN_LIMIT_F9T2C4 = 2;

function expertExordiumClearOccupierCanCommitF9T2c4(unit, targetCell) {
  if (!unit || unit.alive === false || unit.acted === true || unit.faction !== "Exordium") return false;
  if (unit.type === "Struttura" || unit.type === "QG" || !Array.isArray(unit.pos) || !Array.isArray(targetCell)) return false;
  if (typeof getUnitAt === "function" && getUnitAt(targetCell)) return false;
  if (typeof canMove === "function" && !canMove(unit)) return false;
  if (typeof movableCells === "function") {
    const moves = movableCells(unit) || [];
    return moves.some(coord => expertExordiumSameCoordF9T2(coord, targetCell));
  }
  const range = typeof movementRangeFor === "function" ? Math.max(0, Number(movementRangeFor(unit) || 0)) : 1;
  return range > 0 && expertExordiumDistanceF9T2(unit.pos, targetCell) <= range && (typeof isCellEnterable !== "function" || isCellEnterable(targetCell));
}

function expertExordiumClearPlanTargetRemovedF9T2c4(plan) {
  if (!plan || !Array.isArray(plan.targetCell)) return false;
  const target = plan.targetUnitId ? expertExordiumUnitByIdF9T2b(plan.targetUnitId) : null;
  return !target || target.alive === false || !Array.isArray(target.pos) || !expertExordiumSameCoordF9T2(target.pos, plan.targetCell);
}

function expertExordiumSelectReplacementOccupierF9T2c4(player, step, plan) {
  const preferred = new Map();
  const ids = plan && plan.exordium && Array.isArray(plan.exordium.occupierCandidateIds)
    ? plan.exordium.occupierCandidateIds : [];
  ids.forEach((id, index) => preferred.set(String(id), index));
  return expertExordiumUnitsF9T2(player)
    .filter(unit => expertExordiumClearOccupierCanCommitF9T2c4(unit, step.targetCell))
    .sort((a, b) => {
      const aId = expertExordiumUnitIdF9T2b(a), bId = expertExordiumUnitIdF9T2b(b);
      const aPreferred = preferred.has(aId) ? preferred.get(aId) : 999;
      const bPreferred = preferred.has(bId) ? preferred.get(bId) : 999;
      if (aPreferred !== bPreferred) return aPreferred - bPreferred;
      const costDelta = Number(a.cost || 0) - Number(b.cost || 0);
      if (costDelta) return costDelta;
      const distanceDelta = expertExordiumDistanceF9T2(a.pos, step.targetCell) - expertExordiumDistanceF9T2(b.pos, step.targetCell);
      if (distanceDelta) return distanceDelta;
      return aId.localeCompare(bId);
    })[0] || null;
}

function expertExordiumEnsureClearConversionActorF9T2c4(player, options = {}) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const plan = runtime && runtime.plan;
  if (!plan || plan.status !== "active" || plan.goal !== "EXORDIUM_CLEAR_OCCUPY_FORTIFY") return null;
  if (!expertExordiumClearPlanTargetRemovedF9T2c4(plan)) return null;

  const step = expertExordiumNormalizeClearStepF9T2b(player);
  if (!step || step.action !== "occupy_ps") return step || null;

  const occupant = typeof getUnitAt === "function" ? getUnitAt(step.targetCell) : null;
  if (occupant) {
    if (Number(occupant.side) === Number(player) && occupant.type !== "QG") {
      expertExordiumReconcileActivePlanF9T2c1(player, { phase:"clear_commitment_existing_occupant" });
      return null;
    }
    if (typeof expertAbortPlanF9T2 === "function") {
      expertAbortPlanF9T2(player, "target_ps_reoccupied", {
        targetCell:step.targetCell,
        occupantId:expertExordiumUnitIdF9T2b(occupant),
        occupantSide:Number(occupant.side || 0)
      });
    }
    return null;
  }

  if (!plan.exordium) plan.exordium = {};
  const current = expertExordiumUnitByIdF9T2b(step.unitId);
  if (!expertExordiumClearOccupierCanCommitF9T2c4(current, step.targetCell)) {
    const replacements = Number(plan.exordium.conversionActorReassignments || 0);
    if (replacements >= EXPERT_EXORDIUM_CLEAR_REASSIGN_LIMIT_F9T2C4) {
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "conversion_actor_reassignment_exhausted", { targetCell:step.targetCell, previousUnitId:step.unitId || null });
      return null;
    }
    const replacement = expertExordiumSelectReplacementOccupierF9T2c4(player, step, plan);
    if (!replacement) {
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "conversion_actor_unavailable_after_clear", { targetCell:step.targetCell, previousUnitId:step.unitId || null });
      return null;
    }
    const previousUnitId = String(step.unitId || "");
    const replacementId = expertExordiumUnitIdF9T2b(replacement);
    step.unitId = replacementId;
    plan.exordium.conversionActorCurrentId = replacementId;
    plan.exordium.conversionActorReassignments = replacements + 1;
    if (!Array.isArray(plan.supportActorIds)) plan.supportActorIds = [];
    if (!plan.supportActorIds.includes(replacementId)) plan.supportActorIds.push(replacementId);
    if (Array.isArray(plan.reservedActions)) {
      plan.reservedActions = plan.reservedActions.map(value => String(value).startsWith("garrison:") ? `garrison:${replacementId}` : value);
    }
    expertExordiumEmitDecisionF9T2c1(player, "clear_conversion_actor_reassigned", {
      planId:plan.id,
      targetPs:step.targetCell,
      previousUnitId:previousUnitId || null,
      unitId:replacementId,
      reassignmentCount:plan.exordium.conversionActorReassignments,
      reason:String(options.reason || "reserved_actor_unavailable")
    });
  }

  if (!plan.exordium.conversionCommitmentActive) {
    plan.exordium.conversionCommitmentActive = true;
    plan.exordium.targetRemovedObservedRound = Math.max(0, Number(state && state.turn || 0));
    plan.exordium.conversionActorCurrentId = String(step.unitId || "");
    expertExordiumEmitDecisionF9T2c1(player, "clear_conversion_actor_committed", {
      planId:plan.id,
      targetPs:step.targetCell,
      unitId:step.unitId || null,
      targetRemovedObservedRound:plan.exordium.targetRemovedObservedRound,
      conversionMode:"GARRISON"
    });
  }
  return step;
}

function expertExordiumTryCommittedClearConversionF9T2c4(unit) {
  if (!unit || unit.faction !== "Exordium") return false;
  const player = Number(unit.side || 0);
  const runtime = expertExordiumRuntimeF9T2(player);
  const step = expertExordiumEnsureClearConversionActorF9T2c4(player, { reason:"priority_action" });
  if (!runtime || !step || step.action !== "occupy_ps") return false;
  if (expertExordiumUnitIdF9T2b(unit) !== String(step.unitId || "")) return false;

  const hq = typeof getHq === "function" ? getHq(player) : null;
  const hqOccupant = hq && typeof getUnitAt === "function" ? getUnitAt(hq.pos) : null;
  const runtimeRisk = runtime.context && runtime.context.common && runtime.context.common.hqOccupationRisk
    ? String(runtime.context.common.hqOccupationRisk.risk || "unknown") : "unknown";
  if ((hqOccupant && Number(hqOccupant.side) !== player) || runtimeRisk === "occupied" || runtimeRisk === "direct") {
    expertExordiumEmitDecisionF9T2c1(player, "clear_conversion_commitment_deferred_hq_risk", {
      planId:runtime.plan && runtime.plan.id || null,
      unitId:expertExordiumUnitIdF9T2b(unit),
      targetPs:step.targetCell,
      hqRisk:runtimeRisk
    });
    return false;
  }

  const executed = expertExordiumTryClearPlanActionF9T2b(unit);
  if (executed) {
    expertExordiumEmitDecisionF9T2c1(player, "clear_conversion_commitment_executed", {
      planId:runtime.plan && runtime.plan.id || null,
      unitId:expertExordiumUnitIdF9T2b(unit),
      targetPs:step.targetCell,
      conversionMode:"GARRISON",
      reassignments:Number(runtime.plan && runtime.plan.exordium && runtime.plan.exordium.conversionActorReassignments || 0)
    });
  }
  return Boolean(executed);
}

function expertExordiumUnitPriorityBonusF9T2(unit) {
  if (!unit || unit.faction !== "Exordium") return 0;
  const committedStep = expertExordiumEnsureClearConversionActorF9T2c4(unit.side, { reason:"unit_priority" });
  const step = committedStep || expertExordiumNormalizeClearStepF9T2b(unit.side) || expertExordiumCurrentStepF9T2(unit.side);
  const unitId = expertExordiumUnitIdF9T2b(unit);
  let bonus = step && unitId === String(step.unitId || step.builderId || "") ? (step.action === "occupy_ps" ? 1600 : 1000) : 0;
  const tracking = expertExordiumForwardTrackingForUnitF9T2c2(unit);
  if (tracking && tracking.status === "awaiting_impact") bonus += 900;
  else if (tracking && tracking.status === "awaiting_late_impact") bonus += 120;
  return bonus;
}

function expertExordiumMoveBonusF9T2(unit, coord) {
  const tracking = expertExordiumForwardTrackingForUnitF9T2c2(unit);
  if (!tracking || !Array.isArray(coord)) return 0;
  if (tracking.status !== "awaiting_impact") return 0;
  let score = 0;
  if (Array.isArray(tracking.preferredMoveCell) && expertExordiumSameCoordF9T2(coord, tracking.preferredMoveCell)) score += 720;
  if (Array.isArray(tracking.objectiveCell)) {
    const before = expertExordiumDistanceF9T2(unit.pos, tracking.objectiveCell);
    const after = expertExordiumDistanceF9T2(coord, tracking.objectiveCell);
    score += (before-after)*95;
    if (after > before) score -= 240;
    const cell = typeof getCellAt === "function" ? getCellAt(coord) : null;
    if (cell && cell.ps && Number(cell.control) !== Number(unit.side)) score += 160;
  }
  return score;
}

function expertExordiumTryForwardPivotActionF9T2c2(unit) {
  const tracking = expertExordiumForwardTrackingForUnitF9T2c2(unit);
  if (!tracking || tracking.status !== "awaiting_impact" || unit.acted) return false;
  // Primo turno successivo: raggiunge esattamente la cella proiettata, se ancora legale.
  if (Array.isArray(tracking.preferredMoveCell) && !expertExordiumSameCoordF9T2(unit.pos, tracking.preferredMoveCell) && typeof movableCells === "function") {
    const preferred = (movableCells(unit) || []).find(coord => expertExordiumSameCoordF9T2(coord, tracking.preferredMoveCell));
    if (preferred && typeof botMoveUnitF9T0 === "function") {
      botMoveUnitF9T0(unit, preferred);
      if (typeof finishBotMove === "function") finishBotMove(unit); else unit.acted = true;
      return true;
    }
  }
  // Secondo turno: anticipa un'azione realmente impattante dalla posizione raggiunta.
  if (typeof botTryStationaryAction === "function" && botTryStationaryAction(unit)) {
    if (typeof endUnitAction === "function" && !unit.acted) endUnitAction(unit);
    return true;
  }
  // PS obiettivo raggiungibile: occupazione prima di riposizionamenti marginali.
  if (Array.isArray(tracking.objectiveCell) && typeof movableCells === "function") {
    const objectiveMove = (movableCells(unit) || []).find(coord => expertExordiumSameCoordF9T2(coord, tracking.objectiveCell));
    if (objectiveMove && typeof botMoveUnitF9T0 === "function") {
      botMoveUnitF9T0(unit, objectiveMove);
      if (typeof finishBotMove === "function") finishBotMove(unit); else unit.acted = true;
      return true;
    }
  }
  return false;
}

function expertExordiumTryPlannedUnitActionF9T2(unit) {
  if (expertExordiumTryClearPlanActionF9T2b(unit)) return true;
  return expertExordiumTryForwardPivotActionF9T2c2(unit);
}


// =====================================================
// F9T2d1 — EFFECTIVE VARRAN ASSAULT VALUE
// =====================================================
// Aggiunge un solo micro-piano piatto: Varran usa Ordine di Varran soltanto
// quando una unità Exordium può trasformare il bonus in un attacco reale nello
// stesso turno. Nessuna ricerca ricorsiva: una sola proiezione di movimento,
// massimo 24 opzioni ordinate e un solo retarget bounded prima dell'attacco.

const EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2D = "F9T2D3-EXORDIUM-1";
const EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2D = "F9T2d3-1";
const EXPERT_EXORDIUM_VARRAN_ID_F9T2D = "EX0B00";
const EXPERT_EXORDIUM_VARRAN_CANDIDATE_LIMIT_F9T2D = 24;

function expertExordiumEmitDecisionF9T2d(player, kind, payload = {}, options = {}) {
  return expertExordiumEmitDecisionF9T2c1(player, kind, {
    decisionLayer:"expert_microplan",
    featureOrigin:"varran_assault_chain",
    featureRevision:"F9T2d2a",
    ...expertSafeCloneF9T1(payload || {})
  }, { ...options, source:String(options.source || "expert_exordium_f9t2d2a") });
}

function expertExordiumIsVarranF9T2d(unit) {
  if (!unit || unit.alive === false || unit.faction !== "Exordium" || unit.type !== "Comandante") return false;
  return String(unit.blueprintId || unit.id || "") === EXPERT_EXORDIUM_VARRAN_ID_F9T2D || String(unit.name || "").toLowerCase() === "varran";
}

function expertExordiumVarranF9T2d(player) {
  return expertExordiumUnitsF9T2(player).find(expertExordiumIsVarranF9T2d) || null;
}

function expertExordiumCanMoveAndAttackF9T2d(unit) {
  if (!unit || unit.alive === false || unit.acted || !Array.isArray(unit.pos)) return false;
  if (typeof canMove === "function" && !canMove(unit)) return false;
  if (typeof canActAfterMove === "function") return canActAfterMove(unit);
  return unit.type === "Fanteria" || unit.type === "Comandante" || Boolean(unit.warPush || unit.moveAttack);
}

function expertExordiumEnemyStrategicValueF9T2d(player, enemy) {
  if (!enemy || !Array.isArray(enemy.pos)) return 0;
  let score = 0;
  const cell = typeof getCellAt === "function" ? getCellAt(enemy.pos) : null;
  if (cell && cell.ps) score += 14;
  if (cell && cell.ps && expertExordiumIsCenterF9T2c1(cell.coord)) score += 8;
  if (enemy.type === "Comandante") score += 7;
  if (enemy.weight === "Pivot" || enemy.deckRole === "pivot") score += 7;
  if (enemy.type === "Struttura") score += 2;
  const enemyHq = typeof getHq === "function" ? getHq(Number(enemy.side || 0)) : null;
  if (enemyHq && Array.isArray(enemyHq.pos) && expertExordiumDistanceF9T2(enemy.pos, enemyHq.pos) <= 2) score += 4;
  return score;
}

function expertExordiumAssaultMoveCellF9T2d(actor, defender, cachedMoves = null, enemyUnits = null) {
  if (!actor || !defender || !Array.isArray(actor.pos) || !Array.isArray(defender.pos)) return null;
  if (typeof areAdjacent === "function" ? areAdjacent(actor.pos, defender.pos) : expertExordiumDistanceF9T2(actor.pos, defender.pos) === 1) return null;
  if (!expertExordiumCanMoveAndAttackF9T2d(actor) || typeof movableCells !== "function") return undefined;
  const moves = Array.isArray(cachedMoves) ? cachedMoves : (movableCells(actor) || []);
  const enemies = Array.isArray(enemyUnits) ? enemyUnits : expertExordiumEnemyUnitsF9T2(actor.side);
  const options = moves
    .filter(coord => (typeof areAdjacent === "function" ? areAdjacent(coord, defender.pos) : expertExordiumDistanceF9T2(coord, defender.pos) === 1))
    .map(coord => {
      const cell = typeof getCellAt === "function" ? getCellAt(coord) : null;
      const danger = enemies.filter(enemy => enemy && enemy.uid !== defender.uid && Array.isArray(enemy.pos) && expertExordiumDistanceF9T2(enemy.pos, coord) <= 1).length;
      let score = -danger * 8;
      if (cell && cell.ps && Number(cell.control) !== Number(actor.side)) score += 10;
      if (cell && cell.ps && expertExordiumIsCenterF9T2c1(cell.coord)) score += 5;
      return { coord:coord.slice(0, 3), score };
    })
    .sort((a, b) => b.score - a.score || expertExordiumCoordKeyF9T2(a.coord).localeCompare(expertExordiumCoordKeyF9T2(b.coord)));
  return options.length ? options[0].coord : undefined;
}

function expertExordiumPreviewVarranOutcomeF9T2d1(actor, defender, effectiveAttack) {
  if (typeof previewBasicAttackOutcome === "function") {
    return previewBasicAttackOutcome(actor, defender, { effectiveAttack });
  }
  // Fallback puro per harness minimali: replica la regola non perforante essenziale.
  const amount = Math.max(0, Number(effectiveAttack || 0));
  const currentDef = Math.max(0, Number(defender && defender.currentDef || 0));
  const currentHp = Math.max(0, Number(defender && defender.currentHp || 0));
  const defLoss = currentDef > 0 ? Math.min(currentDef, amount) : 0;
  const hpLoss = currentDef > 0 ? 0 : Math.min(currentHp, amount);
  return {
    targetUnitId:expertExordiumUnitIdF9T2b(defender),
    effectiveAttack:amount,
    amount,
    defLoss,
    hpLoss,
    effectiveDamage:defLoss + hpLoss,
    overflowLost:currentDef > 0 ? Math.max(0, amount - defLoss) : 0,
    remainingDef:Math.max(0, currentDef - defLoss),
    remainingHp:Math.max(0, currentHp - hpLoss),
    targetDestroyed:Math.max(0, currentHp - hpLoss) <= 0
  };
}

function expertExordiumCompactAttackOutcomeF9T2d1(outcome) {
  if (!outcome) return null;
  return {
    targetUnitId:String(outcome.targetUnitId || ""),
    intercepted:Boolean(outcome.intercepted),
    effectiveAttack:Number(outcome.effectiveAttack || 0),
    defLoss:Number(outcome.defLoss || 0),
    hpLoss:Number(outcome.hpLoss || 0),
    effectiveDamage:Number(outcome.effectiveDamage || 0),
    remainingDef:Number(outcome.remainingDef || 0),
    remainingHp:Number(outcome.remainingHp || 0),
    targetDestroyed:Boolean(outcome.targetDestroyed)
  };
}

function expertExordiumVarranStrategicContextF9T2d1(player, context) {
  const psCells = expertExordiumPsCellsF9T2a();
  const controlledPs = psCells.filter(cell => Number(cell.control) === Number(player)).length;
  const profile = typeof botPressureProfileF9T0 === "function" ? botPressureProfileF9T0(player) : null;
  const requiredPs = Math.max(1, Number(profile && profile.requiredPs || 1));
  const maxRound = Math.max(1, Number(profile && profile.maxRound || 35));
  const round = Math.max(0, Number(state && state.turn || context && context.turn || 0));
  return {
    controlledPs,
    requiredPs,
    pressureThresholdEnabled:controlledPs === requiredPs - 1,
    roundsRemaining:Math.max(0, maxRound - round),
    tiebreakUrgency:Math.max(0, maxRound - round) <= 5,
    psCells
  };
}

function expertExordiumEvaluateVarranAssaultOptionF9T2d1(player, varran, actor, defender, context = null, cachedMoves = null, enemyUnits = null, activeOrderGain = null, strategicContext = null) {
  const audit = {
    actorId:expertExordiumUnitIdF9T2b(actor),
    defenderId:expertExordiumUnitIdF9T2b(defender),
    rejectionReason:null
  };
  if (!varran || !actor || !defender || actor.alive === false || defender.alive === false) return { option:null, audit:{ ...audit, rejectionReason:"actor_or_target_unavailable" } };
  if (Number(actor.side) !== Number(player) || actor.faction !== "Exordium" || actor.type === "Struttura" || actor.type === "QG" || actor.acted) return { option:null, audit:{ ...audit, rejectionReason:"no_realizable_attack_for_actor" } };
  if (Number(defender.side) === Number(player) || defender.type === "QG" || !Array.isArray(defender.pos)) return { option:null, audit:{ ...audit, rejectionReason:"invalid_enemy_target" } };
  const moveCell = expertExordiumAssaultMoveCellF9T2d(actor, defender, cachedMoves, enemyUnits);
  const alreadyAdjacent = typeof areAdjacent === "function" ? areAdjacent(actor.pos, defender.pos) : expertExordiumDistanceF9T2(actor.pos, defender.pos) === 1;
  if (!alreadyAdjacent && moveCell === undefined) return { option:null, audit:{ ...audit, rejectionReason:"no_realizable_attack_for_actor" } };
  if (alreadyAdjacent && typeof canAttack === "function" && !canAttack(actor)) return { option:null, audit:{ ...audit, rejectionReason:"no_realizable_attack_for_actor" } };

  const ability = varran.ability || {};
  const gain = activeOrderGain == null ? Math.max(0, Number(ability.value || 1)) : Math.max(0, Number(activeOrderGain || 0));
  const currentAttack = typeof effectiveAtt === "function" ? Math.max(0, Number(effectiveAtt(actor) || 0)) : Math.max(0, Number(actor.currentAtt || actor.att || 0));
  const baseAttack = activeOrderGain == null ? currentAttack : Math.max(0, currentAttack - gain);
  const orderedAttack = activeOrderGain == null ? baseAttack + gain : currentAttack;
  if (gain <= 0) return { option:null, audit:{ ...audit, rejectionReason:"ability_has_no_attack_gain" } };

  const baseOutcome = expertExordiumPreviewVarranOutcomeF9T2d1(actor, defender, baseAttack);
  const orderedOutcome = expertExordiumPreviewVarranOutcomeF9T2d1(actor, defender, orderedAttack);
  if (!baseOutcome || !orderedOutcome) return { option:null, audit:{ ...audit, rejectionReason:"attack_preview_unavailable" } };
  const bonusEffectiveDamage = Math.max(0, Number(orderedOutcome.effectiveDamage || 0) - Number(baseOutcome.effectiveDamage || 0));
  const baseWouldKill = Boolean(baseOutcome.targetDestroyed);
  const immediateKillPredicted = Boolean(orderedOutcome.targetDestroyed);
  const bonusEnabledKill = !baseWouldKill && immediateKillPredicted;
  const compactBaseOutcome = expertExordiumCompactAttackOutcomeF9T2d1(baseOutcome);
  const compactOrderedOutcome = expertExordiumCompactAttackOutcomeF9T2d1(orderedOutcome);
  Object.assign(audit, {
    baseAttack,
    orderedAttack,
    baseEffectiveDamage:Number(baseOutcome.effectiveDamage || 0),
    orderedEffectiveDamage:Number(orderedOutcome.effectiveDamage || 0),
    baseDefDamage:Number(baseOutcome.defLoss || 0),
    orderedDefDamage:Number(orderedOutcome.defLoss || 0),
    baseHpDamage:Number(baseOutcome.hpLoss || 0),
    orderedHpDamage:Number(orderedOutcome.hpLoss || 0),
    bonusEffectiveDamage,
    baseWouldKill,
    immediateKillPredicted,
    bonusEnabledKill
  });
  if (baseWouldKill) return { option:null, audit:{ ...audit, rejectionReason:"base_attack_already_kills" } };
  if (bonusEffectiveDamage <= 0 && !bonusEnabledKill) return { option:null, audit:{ ...audit, rejectionReason:"no_marginal_bonus_value" } };

  const attackScore = typeof scoreAttackTarget === "function" ? Number(scoreAttackTarget(actor, defender) || 0) : orderedAttack;
  const strategicValue = expertExordiumEnemyStrategicValueF9T2d(player, defender);
  const strategic = strategicContext || expertExordiumVarranStrategicContextF9T2d1(player, context);
  const targetCell = typeof getCellAt === "function" ? getCellAt(defender.pos) : null;
  const targetOnStrategicPoint = Boolean(targetCell && targetCell.ps);
  const strategicPsCells = Array.isArray(strategic.psCells) ? strategic.psCells : [];
  const opensPathToStrategicPoint = targetOnStrategicPoint || strategicPsCells.some(cell => expertExordiumDistanceF9T2(defender.pos, cell.coord) <= 1 && Number(cell.control) !== Number(player));
  const pressureThresholdEnabled = Boolean(strategic.pressureThresholdEnabled && targetOnStrategicPoint);
  const pressureDenialValue = targetOnStrategicPoint && Number(targetCell.control) !== Number(player) ? (pressureThresholdEnabled ? 28 : 10) : 0;
  const tiebreakUrgency = strategic.tiebreakUrgency && targetOnStrategicPoint ? 12 : 0;
  const moveCost = Array.isArray(moveCell) ? expertExordiumDistanceF9T2(actor.pos, moveCell) : 0;
  const score = attackScore + strategicValue + bonusEffectiveDamage * 12 + (bonusEnabledKill ? 46 : 0) + pressureDenialValue + tiebreakUrgency + (opensPathToStrategicPoint ? 8 : 0) - moveCost * 2 + (actor.uid === varran.uid ? 1 : 0);
  const option = {
    varranId:expertExordiumUnitIdF9T2b(varran),
    actorId:expertExordiumUnitIdF9T2b(actor),
    defenderId:expertExordiumUnitIdF9T2b(defender),
    moveCell:Array.isArray(moveCell) ? moveCell.slice(0, 3) : null,
    targetCell:defender.pos.slice(0, 3),
    baseAttack,
    orderedAttack,
    predictedBaseEffectiveDamage:Number(compactBaseOutcome && compactBaseOutcome.effectiveDamage || 0),
    predictedOrderedEffectiveDamage:Number(compactOrderedOutcome && compactOrderedOutcome.effectiveDamage || 0),
    predictedDefDamage:Number(compactOrderedOutcome && compactOrderedOutcome.defLoss || 0),
    predictedHpDamage:Number(compactOrderedOutcome && compactOrderedOutcome.hpLoss || 0),
    predictedBonusEffectiveDamage:bonusEffectiveDamage,
    baseWouldKill,
    immediateKillPredicted,
    bonusEnabledKill,
    strategicValue,
    targetOnStrategicPoint,
    opensPathToStrategicPoint,
    sameTurnPsCapturePossible:false,
    pressureThresholdEnabled,
    pressureDenialValue,
    roundsRemaining:strategic.roundsRemaining,
    tiebreakUrgency:Boolean(tiebreakUrgency),
    score
  };
  return { option, audit:{ ...audit, rejectionReason:"valid_candidate", score, targetOnStrategicPoint, opensPathToStrategicPoint, pressureThresholdEnabled } };
}

function expertExordiumVarranAssaultOptionF9T2d(player, varran, actor, defender, context = null, cachedMoves = null, enemyUnits = null) {
  return expertExordiumEvaluateVarranAssaultOptionF9T2d1(player, varran, actor, defender, context, cachedMoves, enemyUnits, null).option;
}

function expertExordiumDeferModuleTelemetryF9T2d1(player, decision, options = {}) {
  const runtime = expertExordiumRuntimeF9T2(player);
  if (runtime && !runtime.completed) {
    if (!Array.isArray(runtime.deferredModuleTelemetry)) runtime.deferredModuleTelemetry = [];
    runtime.deferredModuleTelemetry.push({ decision:expertSafeCloneF9T1(decision || {}), options:expertSafeCloneF9T1(options || {}) });
    return decision;
  }
  if (typeof expertEmitDecisionLimitedF9T2c1 === "function") return expertEmitDecisionLimitedF9T2c1(player, decision, options);
  return null;
}

function expertExordiumRecordVarranAuditsF9T2d1(player, audits) {
  const list = Array.isArray(audits) ? audits.filter(Boolean) : [];
  if (!list.length) return null;
  const aggregate = expertExordiumAccumulateCandidateAuditsF9T2c3(player, "varranAssault", list);
  const stored = list.slice(0, 12);
  return expertExordiumDeferModuleTelemetryF9T2d1(player, {
    kind:"varran_assault_candidate_audit_batch",
    source:"expert_exordium_f9t2d2a",
    scanner:aggregate.scannerKey,
    audits:stored,
    auditTotal:list.length,
    rejectionCounts:aggregate.rejectionCounts,
    auditRecordsDropped:Math.max(0, list.length - stored.length)
  }, { audit:true, auditTotal:list.length, auditStored:stored.length });
}

function expertExordiumEmitVarranScanF9T2d1(player, varran, options, audits, extra = {}) {
  const rejectionCounts = {};
  for (const audit of audits || []) {
    const reason = String(audit && audit.rejectionReason || "valid_candidate");
    rejectionCounts[reason] = Number(rejectionCounts[reason] || 0) + 1;
  }
  expertExordiumRecordVarranAuditsF9T2d1(player, audits || []);
  expertExordiumDeferModuleTelemetryF9T2d1(player, {
    kind:"varran_assault_scan",
    source:"expert_exordium_f9t2d2a",
    decisionLayer:"expert_microplan",
    featureOrigin:"varran_assault_chain",
    featureRevision:"F9T2d2a",
    varranId:varran ? expertExordiumUnitIdF9T2b(varran) : null,
    candidateCount:Array.isArray(options) ? options.length : 0,
    auditTotal:Array.isArray(audits) ? audits.length : 0,
    rejectionCounts,
    selected:options && options[0] ? {
      actorId:options[0].actorId,
      defenderId:options[0].defenderId,
      predictedBonusEffectiveDamage:options[0].predictedBonusEffectiveDamage,
      immediateKillPredicted:options[0].immediateKillPredicted,
      bonusEnabledKill:options[0].bonusEnabledKill,
      moveCell:options[0].moveCell,
      targetOnStrategicPoint:options[0].targetOnStrategicPoint,
      score:options[0].score
    } : null,
    ...expertSafeCloneF9T1(extra || {})
  });
}

function expertExordiumVarranAssaultCandidatesF9T2d(context) {
  const player = Number(context && context.player || 0);
  const runtime = expertExordiumRuntimeF9T2(player);
  const audits = [];
  const varran = expertExordiumVarranF9T2d(player);
  if (!varran) {
    audits.push({ rejectionReason:"varran_not_in_play" });
    expertExordiumEmitVarranScanF9T2d1(player, null, [], audits);
    return [];
  }
  const ability = varran.ability;
  if (!ability || ability.kind !== "varranOrder") {
    audits.push({ varranId:expertExordiumUnitIdF9T2b(varran), rejectionReason:"varran_order_unavailable" });
    expertExordiumEmitVarranScanF9T2d1(player, varran, [], audits);
    return [];
  }
  if (typeof canUseAbility === "function" && !canUseAbility(varran, ability)) {
    audits.push({ varranId:expertExordiumUnitIdF9T2b(varran), rejectionReason:"ability_not_usable", cooldownLeft:Number(varran.cooldownLeft || 0), energy:Number(state && state.energy && state.energy[player] || 0) });
    expertExordiumEmitVarranScanF9T2d1(player, varran, [], audits);
    return [];
  }
  const abilityCost = typeof effectiveAbilityCost === "function" ? Number(effectiveAbilityCost(player, ability) || 0) : Number(ability.cost || 0);
  if (Number(state && state.energy && state.energy[player] || 0) < abilityCost) {
    audits.push({ rejectionReason:"insufficient_energy", requiredEnergy:abilityCost });
    expertExordiumEmitVarranScanF9T2d1(player, varran, [], audits);
    return [];
  }
  const hqRisk = context && context.common && context.common.hqOccupationRisk ? String(context.common.hqOccupationRisk.risk || "unknown") : "unknown";
  if (hqRisk === "occupied" || hqRisk === "direct") {
    audits.push({ rejectionReason:"hq_occupation_risk_priority", hqRisk });
    expertExordiumEmitVarranScanF9T2d1(player, varran, [], audits, { hqRisk });
    return [];
  }

  const legalTargets = typeof abilityTargets === "function" ? (abilityTargets(varran, ability) || []) : expertExordiumUnitsF9T2(player).filter(unit => expertExordiumDistanceF9T2(varran.pos, unit.pos) <= Number(ability.range || 1));
  const actors = legalTargets
    .filter(unit => unit && Number(unit.side) === player && unit.faction === "Exordium" && unit.type !== "Struttura" && unit.type !== "QG" && unit.alive !== false && !unit.acted)
    .slice(0, 8);
  const enemies = expertExordiumEnemyUnitsF9T2(player)
    .filter(unit => unit && unit.alive !== false && unit.type !== "QG" && Array.isArray(unit.pos))
    .sort((a, b) => expertExordiumEnemyStrategicValueF9T2d(player, b) - expertExordiumEnemyStrategicValueF9T2d(player, a) || String(a.uid || a.id || "").localeCompare(String(b.uid || b.id || "")))
    .slice(0, 32);
  const options = [];
  const strategicContext = expertExordiumVarranStrategicContextF9T2d1(player, context);
  let evaluatedPairs = 0;
  let stoppedEarly = false;

  if (!actors.length) audits.push({ rejectionReason:"no_legal_order_target" });
  outer: for (const actor of actors) {
    const moves = expertExordiumCanMoveAndAttackF9T2d(actor) && typeof movableCells === "function" ? (movableCells(actor) || []) : [];
    const reachable = enemies.filter(defender => {
      if (typeof areAdjacent === "function" ? areAdjacent(actor.pos, defender.pos) : expertExordiumDistanceF9T2(actor.pos, defender.pos) === 1) return true;
      return moves.some(coord => typeof areAdjacent === "function" ? areAdjacent(coord, defender.pos) : expertExordiumDistanceF9T2(coord, defender.pos) === 1);
    });
    if (!reachable.length) {
      audits.push({ actorId:expertExordiumUnitIdF9T2b(actor), rejectionReason:"no_realizable_attack_for_actor" });
      continue;
    }
    for (const defender of reachable) {
      if (evaluatedPairs >= EXPERT_EXORDIUM_VARRAN_CANDIDATE_LIMIT_F9T2D) { stoppedEarly = true; break outer; }
      evaluatedPairs += 1;
      const evaluated = expertExordiumEvaluateVarranAssaultOptionF9T2d1(player, varran, actor, defender, context, moves, enemies, null, strategicContext);
      audits.push(evaluated.audit);
      if (evaluated.option) options.push(evaluated.option);
    }
  }

  options.sort((a, b) => b.score - a.score || Number(b.bonusEnabledKill) - Number(a.bonusEnabledKill) || Number(b.predictedBonusEffectiveDamage) - Number(a.predictedBonusEffectiveDamage) || String(a.actorId).localeCompare(String(b.actorId)) || String(a.defenderId).localeCompare(String(b.defenderId)));
  if (runtime) {
    runtime.candidateCount = Number(runtime.candidateCount || 0) + options.length;
    runtime.discardedCandidates = Number(runtime.discardedCandidates || 0) + Math.max(0, options.length - 1);
    if (stoppedEarly) runtime.candidateScanStoppedEarly = true;
  }
  expertExordiumEmitVarranScanF9T2d1(player, varran, options, audits, { evaluatedPairs, candidateScanStoppedEarly:stoppedEarly });
  return options;
}

function expertExordiumCreateVarranAssaultPlanF9T2d(context, candidate) {
  if (!context || !candidate || typeof expertCreateMicroPlanF9T1 !== "function") return null;
  const player = Number(context.player || 0);
  const varran = expertExordiumUnitByIdF9T2b(candidate.varranId);
  const ability = varran && varran.ability;
  const abilityCost = typeof effectiveAbilityCost === "function" ? Number(effectiveAbilityCost(player, ability) || 0) : Number(ability && ability.cost || 0);
  const round = Math.max(0, Number(state && state.turn || context.turn || 0));
  const planId = `EX-F9T2D-VARRAN-${player}-${round}-${candidate.actorId}-${candidate.defenderId}`;
  const built = expertCreateMicroPlanF9T1({
    id:planId,
    faction:"Exordium",
    goal:"EXORDIUM_VARRAN_ASSAULT_CHAIN",
    targetCell:candidate.targetCell,
    targetUnitId:candidate.defenderId,
    primaryActorId:candidate.varranId,
    supportActorIds:candidate.actorId === candidate.varranId ? [] : [candidate.actorId],
    requiredEnergy:abilityCost,
    reservedEnergy:abilityCost,
    reservedActions:[`ability:${candidate.varranId}`, `attack:${candidate.actorId}`],
    orderedSteps:[
      { id:`${planId}-ORDER`, action:"use_varran_order", unitId:candidate.varranId, targetUnitId:candidate.actorId, defenderId:candidate.defenderId, predictedBonusEffectiveDamage:candidate.predictedBonusEffectiveDamage, baseWouldKill:candidate.baseWouldKill, immediateKillPredicted:candidate.immediateKillPredicted, bonusEnabledKill:candidate.bonusEnabledKill },
      { id:`${planId}-ASSAULT`, action:"execute_varran_assault", unitId:candidate.actorId, targetUnitId:candidate.defenderId, moveCell:candidate.moveCell, targetCell:candidate.targetCell, stationaryAttackBranch:!Array.isArray(candidate.moveCell), movementRequired:Array.isArray(candidate.moveCell), movementSkippedReason:Array.isArray(candidate.moveCell) ? null : "already_in_attack_range", predictedBonusEffectiveDamage:candidate.predictedBonusEffectiveDamage, predictedDefDamage:candidate.predictedDefDamage, predictedHpDamage:candidate.predictedHpDamage, baseWouldKill:candidate.baseWouldKill, immediateKillPredicted:candidate.immediateKillPredicted, bonusEnabledKill:candidate.bonusEnabledKill }
    ],
    expectedResult:{
      result:"varran_assault_executed",
      defenderId:candidate.defenderId,
      predictedBonusEffectiveDamage:candidate.predictedBonusEffectiveDamage,
      predictedDefDamage:candidate.predictedDefDamage,
      predictedHpDamage:candidate.predictedHpDamage,
      baseWouldKill:candidate.baseWouldKill,
      immediateKillPredicted:candidate.immediateKillPredicted,
      bonusEnabledKill:candidate.bonusEnabledKill,
      stationaryAttackBranch:!Array.isArray(candidate.moveCell),
      movementRequired:Array.isArray(candidate.moveCell),
      movementSkippedReason:Array.isArray(candidate.moveCell) ? null : "already_in_attack_range",
      targetCell:candidate.targetCell
    },
    abortConditions:["varran_unavailable", "ability_unavailable", "assault_actor_unavailable", "target_unavailable", "attack_no_longer_legal", "hq_occupation_risk_priority"],
    fallbackPlan:"advanced_f9t0",
    status:"proposed"
  });
  if (!built.validation.ok) return null;
  built.plan.exordium = {
    doctrine:"VARRAN_ASSAULT_CHAIN",
    contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2D,
    varranId:candidate.varranId,
    assaultActorId:candidate.actorId,
    defenderId:candidate.defenderId,
    moveCell:candidate.moveCell,
    stationaryAttackBranch:!Array.isArray(candidate.moveCell),
    movementRequired:Array.isArray(candidate.moveCell),
    movementSkippedReason:Array.isArray(candidate.moveCell) ? null : "already_in_attack_range",
    attackOwnership:null,
    attackExecutionRecognized:false,
    predictedBonusEffectiveDamage:candidate.predictedBonusEffectiveDamage,
    predictedDefDamage:candidate.predictedDefDamage,
    predictedHpDamage:candidate.predictedHpDamage,
    baseWouldKill:candidate.baseWouldKill,
    immediateKillPredicted:candidate.immediateKillPredicted,
    bonusEnabledKill:candidate.bonusEnabledKill,
    targetReassignments:0
  };
  return built.plan;
}

function expertExordiumVarranCurrentStepF9T2d(player) {
  const runtime = expertExordiumRuntimeF9T2(player);
  const plan = runtime && runtime.plan;
  if (!plan || plan.status !== "active" || plan.goal !== "EXORDIUM_VARRAN_ASSAULT_CHAIN") return null;
  return Array.isArray(plan.orderedSteps) ? plan.orderedSteps[Number(plan.currentStep || 0)] || null : null;
}

function expertExordiumVarranRetargetOptionF9T2d(player, varran, actor, defender) {
  if (!varran || !actor || !defender) return null;
  const ability = varran.ability || {};
  const activeOrderGain = (Array.isArray(actor.buffs) ? actor.buffs : []).reduce((sum, buff) => {
    if (!buff || String(buff.stat || "") !== "att" || String(buff.source || "") !== String(ability.name || "Ordine di Varran")) return sum;
    if (buff.turns != null && Number(buff.turns) <= 0) return sum;
    return sum + Math.max(0, Number(buff.value || 0));
  }, 0);
  if (activeOrderGain <= 0) return null;
  return expertExordiumEvaluateVarranAssaultOptionF9T2d1(player, varran, actor, defender, null, null, null, activeOrderGain).option;
}

function expertExordiumRetargetVarranAssaultF9T2d(player, actor, step, plan) {
  if (!actor || !step || !plan) return null;
  if (Number(plan.exordium && plan.exordium.targetReassignments || 0) >= 1) return null;
  const varran = expertExordiumUnitByIdF9T2b(plan.exordium && plan.exordium.varranId);
  const options = expertExordiumEnemyUnitsF9T2(player)
    .map(defender => expertExordiumVarranRetargetOptionF9T2d(player, varran, actor, defender))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || String(a.defenderId).localeCompare(String(b.defenderId)));
  const replacement = options[0] || null;
  if (!replacement) return null;
  const previousTargetId = String(step.targetUnitId || "");
  step.targetUnitId = replacement.defenderId;
  step.moveCell = replacement.moveCell;
  step.targetCell = replacement.targetCell;
  step.predictedBonusEffectiveDamage = replacement.predictedBonusEffectiveDamage;
  step.predictedDefDamage = replacement.predictedDefDamage;
  step.predictedHpDamage = replacement.predictedHpDamage;
  step.baseWouldKill = replacement.baseWouldKill;
  step.immediateKillPredicted = replacement.immediateKillPredicted;
  step.bonusEnabledKill = replacement.bonusEnabledKill;
  plan.targetUnitId = replacement.defenderId;
  plan.targetCell = replacement.targetCell;
  plan.exordium.defenderId = replacement.defenderId;
  plan.exordium.moveCell = replacement.moveCell;
  plan.exordium.predictedBonusEffectiveDamage = replacement.predictedBonusEffectiveDamage;
  plan.exordium.predictedDefDamage = replacement.predictedDefDamage;
  plan.exordium.predictedHpDamage = replacement.predictedHpDamage;
  plan.exordium.baseWouldKill = replacement.baseWouldKill;
  plan.exordium.immediateKillPredicted = replacement.immediateKillPredicted;
  plan.exordium.bonusEnabledKill = replacement.bonusEnabledKill;
  plan.exordium.targetReassignments = Number(plan.exordium.targetReassignments || 0) + 1;
  expertExordiumEmitDecisionF9T2d(player, "varran_assault_target_reassigned", {
    planId:plan.id,
    actorId:expertExordiumUnitIdF9T2b(actor),
    previousTargetId:previousTargetId || null,
    targetUnitId:replacement.defenderId,
    moveCell:replacement.moveCell,
    predictedBonusEffectiveDamage:replacement.predictedBonusEffectiveDamage,
    immediateKillPredicted:replacement.immediateKillPredicted,
    bonusEnabledKill:replacement.bonusEnabledKill
  });
  return replacement;
}

function expertExordiumTryVarranAssaultActionF9T2d(unit) {
  if (!unit || unit.faction !== "Exordium") return false;
  const player = Number(unit.side || 0);
  const runtime = expertExordiumRuntimeF9T2(player);
  const plan = runtime && runtime.plan;
  const step = expertExordiumVarranCurrentStepF9T2d(player);
  if (!runtime || !plan || !step) return false;
  const unitId = expertExordiumUnitIdF9T2b(unit);
  if (unitId !== String(step.unitId || "")) return false;
  const hqRisk = runtime.context && runtime.context.common && runtime.context.common.hqOccupationRisk ? String(runtime.context.common.hqOccupationRisk.risk || "unknown") : "unknown";
  if (hqRisk === "occupied" || hqRisk === "direct") {
    if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "hq_occupation_risk_priority", { hqRisk, planId:plan.id });
    return false;
  }

  if (step.action === "use_varran_order") {
    const varran = unit;
    const target = expertExordiumUnitByIdF9T2b(step.targetUnitId);
    const defender = expertExordiumUnitByIdF9T2b(step.defenderId);
    const ability = varran.ability;
    if (!expertExordiumIsVarranF9T2d(varran) || !ability || ability.kind !== "varranOrder" || !target || target.alive === false || !defender || defender.alive === false) {
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "varran_chain_actor_or_target_unavailable", { varranId:unitId, targetUnitId:step.targetUnitId, defenderId:step.defenderId });
      return false;
    }
    const legalTargets = typeof abilityTargets === "function" ? abilityTargets(varran, ability) || [] : [];
    if ((typeof canUseAbility === "function" && !canUseAbility(varran, ability)) || (legalTargets.length && !legalTargets.some(candidate => expertExordiumUnitIdF9T2b(candidate) === expertExordiumUnitIdF9T2b(target)))) {
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "varran_order_no_longer_legal", { varranId:unitId, targetUnitId:step.targetUnitId });
      return false;
    }
    const beforeAtt = typeof effectiveAtt === "function" ? Number(effectiveAtt(target) || 0) : Number(target.currentAtt || target.att || 0);
    const beforeEnergy = Number(state && state.energy && state.energy[player] || 0);
    if (typeof useAbility !== "function") return false;
    useAbility(varran, target, ability);
    const afterAtt = typeof effectiveAtt === "function" ? Number(effectiveAtt(target) || 0) : Number(target.currentAtt || target.att || 0);
    if (!varran.abilityUsedThisTurn || afterAtt <= beforeAtt) {
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "varran_order_failed", { beforeAtt, afterAtt });
      return false;
    }
    plan.reservedEnergy = 0;
    expertExordiumEmitDecisionF9T2d(player, "varran_assault_order_committed", {
      planId:plan.id,
      varranId:unitId,
      actorId:expertExordiumUnitIdF9T2b(target),
      defenderId:step.defenderId,
      energySpent:Math.max(0, beforeEnergy - Number(state && state.energy && state.energy[player] || 0)),
      attackBefore:beforeAtt,
      attackAfter:afterAtt,
      predictedBonusEffectiveDamage:Number(step.predictedBonusEffectiveDamage || 0),
      stationaryAttackBranch:Boolean(plan.exordium && plan.exordium.stationaryAttackBranch),
      movementRequired:Boolean(plan.exordium && plan.exordium.movementRequired),
      movementSkippedReason:plan.exordium && plan.exordium.movementSkippedReason || null,
      immediateKillPredicted:Boolean(step.immediateKillPredicted),
      bonusEnabledKill:Boolean(step.bonusEnabledKill)
    });
    if (typeof expertAdvancePlanStepF9T2 === "function") expertAdvancePlanStepF9T2(player, { result:"varran_order_applied", varranId:unitId, actorId:expertExordiumUnitIdF9T2b(target), defenderId:step.defenderId, attackBefore:beforeAtt, attackAfter:afterAtt, predictedBonusEffectiveDamage:Number(step.predictedBonusEffectiveDamage || 0),
      immediateKillPredicted:Boolean(step.immediateKillPredicted),
      bonusEnabledKill:Boolean(step.bonusEnabledKill) });
    return true;
  }

  if (step.action === "execute_varran_assault") {
    const actor = unit;
    const stationaryAttackBranch = !Array.isArray(step.moveCell);
    const movementRequired = Array.isArray(step.moveCell);
    const movementSkippedReason = stationaryAttackBranch ? "already_in_attack_range" : null;
    if (plan.exordium) {
      plan.exordium.stationaryAttackBranch = stationaryAttackBranch;
      plan.exordium.movementRequired = movementRequired;
      plan.exordium.movementSkippedReason = movementSkippedReason;
    }
    let defender = expertExordiumUnitByIdF9T2b(step.targetUnitId);
    if (!defender || defender.alive === false) {
      const replacement = expertExordiumRetargetVarranAssaultF9T2d(player, actor, step, plan);
      defender = replacement ? expertExordiumUnitByIdF9T2b(replacement.defenderId) : null;
    }
    if (!defender || defender.alive === false) {
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "varran_assault_target_unavailable", { actorId:unitId });
      return false;
    }
    if (Array.isArray(step.moveCell) && !expertExordiumSameCoordF9T2(actor.pos, step.moveCell)) {
      const legalMove = typeof movableCells === "function" ? (movableCells(actor) || []).find(coord => expertExordiumSameCoordF9T2(coord, step.moveCell)) : null;
      if (!legalMove) {
        const replacement = expertExordiumRetargetVarranAssaultF9T2d(player, actor, step, plan);
        if (!replacement) {
          if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "varran_assault_move_unavailable", { actorId:unitId, targetUnitId:step.targetUnitId, moveCell:step.moveCell });
          return false;
        }
      }
      const refreshedMove = Array.isArray(step.moveCell) && typeof movableCells === "function" ? (movableCells(actor) || []).find(coord => expertExordiumSameCoordF9T2(coord, step.moveCell)) : null;
      if (refreshedMove && typeof botMoveUnitF9T0 === "function") botMoveUnitF9T0(actor, refreshedMove);
    }
    defender = expertExordiumUnitByIdF9T2b(step.targetUnitId);
    const adjacent = defender && (typeof areAdjacent === "function" ? areAdjacent(actor.pos, defender.pos) : expertExordiumDistanceF9T2(actor.pos, defender.pos) === 1);
    if (!defender || defender.alive === false || !adjacent || (typeof canAttack === "function" && !canAttack(actor))) {
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "varran_assault_attack_no_longer_legal", { actorId:unitId, targetUnitId:step.targetUnitId, actorPos:actor.pos, targetPos:defender && defender.pos || null });
      if (actor && actor.alive !== false && typeof finishBotMove === "function" && actor.movedThisTurn) finishBotMove(actor);
      return Boolean(actor && actor.movedThisTurn);
    }
    const ability = expertExordiumUnitByIdF9T2b(plan.exordium && plan.exordium.varranId) && expertExordiumUnitByIdF9T2b(plan.exordium && plan.exordium.varranId).ability || {};
    const activeOrderGain = (Array.isArray(actor.buffs) ? actor.buffs : []).reduce((sum, buff) => {
      if (!buff || String(buff.stat || "") !== "att" || String(buff.source || "") !== String(ability.name || "Ordine di Varran")) return sum;
      if (buff.turns != null && Number(buff.turns) <= 0) return sum;
      return sum + Math.max(0, Number(buff.value || 0));
    }, 0);
    const orderedAttackNow = typeof effectiveAtt === "function" ? Math.max(0, Number(effectiveAtt(actor) || 0)) : Math.max(0, Number(actor.currentAtt || actor.att || 0));
    const baseAttackNow = Math.max(0, orderedAttackNow - activeOrderGain);
    const basePreviewNow = expertExordiumPreviewVarranOutcomeF9T2d1(actor, defender, baseAttackNow);
    const orderedPreviewNow = expertExordiumPreviewVarranOutcomeF9T2d1(actor, defender, orderedAttackNow);
    const predictedBonusNow = Math.max(0, Number(orderedPreviewNow && orderedPreviewNow.effectiveDamage || 0) - Number(basePreviewNow && basePreviewNow.effectiveDamage || 0));
    const resolvedTargetId = String(orderedPreviewNow && orderedPreviewNow.targetUnitId || expertExordiumUnitIdF9T2b(defender));
    const resolvedTarget = expertExordiumUnitByIdF9T2b(resolvedTargetId) || defender;
    const defBefore = Math.max(0, Number(resolvedTarget.currentDef || 0));
    const hpBefore = Math.max(0, Number(resolvedTarget.currentHp || 0));
    const attacksBefore = Number(actor.attacksMade || 0);
    if (typeof attackUnit !== "function") return false;
    attackUnit(actor, defender);
    const attacked = Number(actor.attacksMade || 0) > attacksBefore;
    if (!attacked) {
      if (typeof expertAbortPlanF9T2 === "function") expertAbortPlanF9T2(player, "varran_assault_attack_failed", { actorId:unitId, targetUnitId:step.targetUnitId });
      return false;
    }
    const defAfter = resolvedTarget.alive === false ? 0 : Math.max(0, Number(resolvedTarget.currentDef || 0));
    const hpAfter = resolvedTarget.alive === false ? 0 : Math.max(0, Number(resolvedTarget.currentHp || 0));
    const actualDefDamage = Math.max(0, defBefore - defAfter);
    const actualHpDamage = Math.max(0, hpBefore - hpAfter);
    const actualDamage = actualDefDamage + actualHpDamage;
    const actualBonusEffectiveDamage = Math.max(0, actualDamage - Number(basePreviewNow && basePreviewNow.effectiveDamage || 0));
    const immediateKillPredicted = Boolean(orderedPreviewNow && orderedPreviewNow.targetDestroyed);
    const immediateKillAchieved = resolvedTarget.alive === false;
    const predictionMatched = actualDamage === Number(orderedPreviewNow && orderedPreviewNow.effectiveDamage || 0) && immediateKillAchieved === immediateKillPredicted;
    const attackOwnership = "expert_executor";
    const runtimeSequence = Number(runtime && runtime.sequence || 0) || null;
    if (plan.exordium) {
      plan.exordium.attackOwnership = attackOwnership;
      plan.exordium.attackExecutionRecognized = true;
      plan.exordium.attackObservedSequence = runtimeSequence;
    }
    expertExordiumEmitDecisionF9T2d(player, "varran_assault_executed", {
      planId:plan.id,
      varranId:plan.exordium && plan.exordium.varranId || null,
      actorId:unitId,
      requestedActorId:String(step.unitId || unitId),
      actualActorId:unitId,
      requestedTargetUnitId:step.targetUnitId,
      targetUnitId:resolvedTargetId,
      actualTargetUnitId:resolvedTargetId,
      interceptedTarget:Boolean(orderedPreviewNow && orderedPreviewNow.intercepted),
      moveCell:Array.isArray(step.moveCell) ? step.moveCell.slice(0, 3) : null,
      stationaryAttackBranch,
      movementRequired,
      movementSkippedReason,
      attackOwnership,
      attackObservedSequence:runtimeSequence,
      attackOccurredAfterOrder:true,
      attackExecutionRecognized:true,
      predictedBonusEffectiveDamage:predictedBonusNow,
      actualBonusEffectiveDamage,
      predictedDefDamage:Number(orderedPreviewNow && orderedPreviewNow.defLoss || 0),
      actualDefDamage,
      predictedHpDamage:Number(orderedPreviewNow && orderedPreviewNow.hpLoss || 0),
      actualHpDamage,
      baseWouldKill:Boolean(basePreviewNow && basePreviewNow.targetDestroyed),
      immediateKillPredicted,
      immediateKillAchieved,
      bonusEnabledKill:Boolean(basePreviewNow && !basePreviewNow.targetDestroyed && orderedPreviewNow && orderedPreviewNow.targetDestroyed),
      predictionMatched,
      actualDamage,
      targetDestroyed:immediateKillAchieved
    });
    if (typeof expertAdvancePlanStepF9T2 === "function") expertAdvancePlanStepF9T2(player, {
      result:"varran_assault_executed",
      varranId:plan.exordium && plan.exordium.varranId || null,
      actorId:unitId,
      requestedActorId:String(step.unitId || unitId),
      actualActorId:unitId,
      requestedTargetUnitId:step.targetUnitId,
      targetUnitId:resolvedTargetId,
      actualTargetUnitId:resolvedTargetId,
      stationaryAttackBranch,
      movementRequired,
      movementSkippedReason,
      attackOwnership,
      attackObservedSequence:runtimeSequence,
      attackOccurredAfterOrder:true,
      attackExecutionRecognized:true,
      interceptedTarget:Boolean(orderedPreviewNow && orderedPreviewNow.intercepted),
      predictedBonusEffectiveDamage:predictedBonusNow,
      actualBonusEffectiveDamage,
      actualDamage,
      immediateKillPredicted,
      immediateKillAchieved,
      bonusEnabledKill:Boolean(basePreviewNow && !basePreviewNow.targetDestroyed && orderedPreviewNow && orderedPreviewNow.targetDestroyed),
      predictionMatched
    });
    if (actor.alive !== false && typeof shouldEndAfterAttack === "function" && shouldEndAfterAttack(actor) && typeof endUnitAction === "function") endUnitAction(actor);
    return true;
  }
  return false;
}

// F9T2d1 sostituisce soltanto il selettore finale del modulo. Priorità:
// territorio -> Forward Pivot -> Varran Assault Chain -> fallback Advanced.
function expertExordiumModuleF9T2c(context) {
  if (!context || context.faction !== "Exordium") return { moduleId:"expert-exordium-f9t2d3", faction:"Exordium", plan:null, status:"not_applicable", reason:"wrong_faction" };
  expertExordiumFlushTemporalPivotDecisionsF9T2c3a(context.player);
  expertExordiumCheckForwardPivotExpiryF9T2c(context.player);
  const shouldScanTerritory = expertExordiumHasImmediateTerritorialCandidateF9T2c1(context.player);
  const base = shouldScanTerritory ? expertExordiumModuleF9T2b(context) : null;
  if (base && base.plan) return { ...base, moduleId:"expert-exordium-f9t2d3", contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2D };
  if (base && ["wrong_faction", "hq_occupation_risk_priority"].includes(base.reason)) return { ...base, moduleId:"expert-exordium-f9t2d3", contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2D };

  const pivotCandidates = expertExordiumForwardPivotCandidatesF9T2c(context);
  if (pivotCandidates.length) {
    const pivotPlan = expertExordiumCreateForwardPivotPlanF9T2c(context, pivotCandidates[0]);
    if (pivotPlan) return { moduleId:"expert-exordium-f9t2d3", faction:"Exordium", plan:pivotPlan, status:"microplan_selected", reason:"forward_pivot_projected_impact_available", candidateCount:pivotCandidates.length, contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2D };
  }

  const varranCandidates = expertExordiumVarranAssaultCandidatesF9T2d(context);
  if (varranCandidates.length) {
    const varranPlan = expertExordiumCreateVarranAssaultPlanF9T2d(context, varranCandidates[0]);
    if (varranPlan) return { moduleId:"expert-exordium-f9t2d3", faction:"Exordium", plan:varranPlan, status:"microplan_selected", reason:"varran_assault_chain_available", candidateCount:varranCandidates.length, contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2D };
  }
  return { moduleId:"expert-exordium-f9t2d3", faction:"Exordium", plan:null, status:"fallback", reason:"no_territorial_conversion_forward_pivot_or_varran_assault_candidate", candidateCount:0, contractVersion:EXPERT_EXORDIUM_CONTRACT_VERSION_F9T2D };
}

function expertExordiumModuleF9T2a(context) { return expertExordiumModuleF9T2c(context); }
function expertExordiumModuleF9T2(context) { return expertExordiumModuleF9T2c(context); }
function expertExordiumModuleF9T1(context) { return expertExordiumModuleF9T2c(context); }

function expertExordiumUnitPriorityBonusF9T2(unit) {
  if (!unit || unit.faction !== "Exordium") return 0;
  const committedStep = expertExordiumEnsureClearConversionActorF9T2c4(unit.side, { reason:"unit_priority" });
  const step = committedStep || expertExordiumNormalizeClearStepF9T2b(unit.side) || expertExordiumCurrentStepF9T2(unit.side);
  const unitId = expertExordiumUnitIdF9T2b(unit);
  let bonus = step && unitId === String(step.unitId || step.builderId || "") ? (step.action === "occupy_ps" ? 1600 : 1000) : 0;
  if (step && step.action === "use_varran_order" && unitId === String(step.unitId || "")) bonus += 1900;
  if (step && step.action === "execute_varran_assault" && unitId === String(step.unitId || "")) bonus += 1800;
  const tracking = expertExordiumForwardTrackingForUnitF9T2c2(unit);
  if (tracking && tracking.status === "awaiting_impact") bonus += 900;
  else if (tracking && tracking.status === "awaiting_late_impact") bonus += 120;
  return bonus;
}

function expertExordiumMoveBonusF9T2(unit, coord) {
  let score = 0;
  const step = unit ? expertExordiumVarranCurrentStepF9T2d(unit.side) : null;
  if (step && step.action === "execute_varran_assault" && expertExordiumUnitIdF9T2b(unit) === String(step.unitId || "") && Array.isArray(coord)) {
    if (Array.isArray(step.moveCell) && expertExordiumSameCoordF9T2(coord, step.moveCell)) score += 1000;
    const defender = expertExordiumUnitByIdF9T2b(step.targetUnitId);
    if (defender && Array.isArray(defender.pos)) score += (expertExordiumDistanceF9T2(unit.pos, defender.pos) - expertExordiumDistanceF9T2(coord, defender.pos)) * 110;
  }
  const tracking = expertExordiumForwardTrackingForUnitF9T2c2(unit);
  if (tracking && Array.isArray(coord) && tracking.status === "awaiting_impact") {
    if (Array.isArray(tracking.preferredMoveCell) && expertExordiumSameCoordF9T2(coord, tracking.preferredMoveCell)) score += 720;
    if (Array.isArray(tracking.objectiveCell)) {
      const before = expertExordiumDistanceF9T2(unit.pos, tracking.objectiveCell);
      const after = expertExordiumDistanceF9T2(coord, tracking.objectiveCell);
      score += (before-after)*95;
      if (after > before) score -= 240;
      const cell = typeof getCellAt === "function" ? getCellAt(coord) : null;
      if (cell && cell.ps && Number(cell.control) !== Number(unit.side)) score += 160;
    }
  }
  return score;
}

function expertExordiumTryReservedStationaryVarranAssaultF9T2d2a(unit) {
  if (!unit || unit.faction !== "Exordium") return false;
  const player = Number(unit.side || 0);
  const plan = expertExordiumRuntimeF9T2(player) && expertExordiumRuntimeF9T2(player).plan;
  const step = expertExordiumVarranCurrentStepF9T2d(player);
  if (!plan || !step || step.action !== "execute_varran_assault") return false;
  if (expertExordiumUnitIdF9T2b(unit) !== String(step.unitId || "")) return false;
  if (Array.isArray(step.moveCell)) return false;
  if (plan.exordium) {
    plan.exordium.stationaryAttackBranch = true;
    plan.exordium.movementRequired = false;
    plan.exordium.movementSkippedReason = "already_in_attack_range";
    plan.exordium.attackOwnership = "expert_executor";
  }
  return expertExordiumTryVarranAssaultActionF9T2d(unit);
}

function expertExordiumTryPlannedUnitActionF9T2(unit) {
  if (expertExordiumTryClearPlanActionF9T2b(unit)) return true;
  if (expertExordiumTryForwardPivotActionF9T2c2(unit)) return true;
  return expertExordiumTryVarranAssaultActionF9T2d(unit);
}


// =====================================================
// F9T2d3 — COMMANDER DEPLOYMENT COMMITMENT
// =====================================================
// Persistent bounded commitment. It does not add another strategic search:
// it protects the selected commander from purchase-planner starvation and
// exposes a single high-priority roster choice once deployment is legal.

const EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2D3 = "F9T2d3-1";
const EXPERT_EXORDIUM_COMMANDER_POLICIES_F9T2D3 = Object.freeze({
  EX0B00:Object.freeze({ earliestCommitRound:4, maxPlayableDelayRounds:2 })
});

function expertExordiumEmitDecisionF9T2d3(player, kind, payload = {}) {
  return expertExordiumEmitDecisionF9T2c1(player, kind, {
    source:"expert_exordium_f9t2d3",
    decisionLayer:"expert_commitment",
    featureOrigin:"commander_deployment_commitment",
    featureRevision:"F9T2d3",
    ...payload
  });
}

function expertExordiumCommanderCommitmentBucketF9T2d3(player) {
  const persistent = typeof expertEnsureStateF9T1 === "function" ? expertEnsureStateF9T1() : null;
  if (!persistent) return null;
  if (!persistent.commanderCommitments) persistent.commanderCommitments = {};
  if (!persistent.commanderCommitments[player]) persistent.commanderCommitments[player] = null;
  return persistent;
}

function expertExordiumSelectedCommanderCardF9T2d3(player) {
  const hand = state && state.hand && Array.isArray(state.hand[player]) ? state.hand[player] : [];
  const selectedId = typeof selectedCommanderBlueprintIdForSide === "function"
    ? selectedCommanderBlueprintIdForSide(player)
    : null;
  let card = selectedId ? hand.find(candidate => candidate && String(candidate.blueprintId || "") === String(selectedId)) || null : null;
  if (!card) card = hand.find(candidate => candidate && (candidate.deckRole === "commander" || candidate.cardType === "commander")) || null;
  if (!card) return null;
  const bp = typeof blueprintForHandCard === "function"
    ? blueprintForHandCard(card, player)
    : (typeof BLUEPRINTS !== "undefined" && Array.isArray(BLUEPRINTS) ? BLUEPRINTS.find(candidate => candidate && candidate.id === card.blueprintId) || null : null);
  if (!bp || bp.type !== "Comandante") return null;
  return { card, bp };
}

function expertExordiumCommanderPolicyF9T2d3(bp) {
  const specific = bp && EXPERT_EXORDIUM_COMMANDER_POLICIES_F9T2D3[String(bp.id || "")];
  return specific || { earliestCommitRound:5, maxPlayableDelayRounds:2 };
}

function expertExordiumCommanderDeploymentStatusF9T2d3(player) {
  const selected = expertExordiumSelectedCommanderCardF9T2d3(player);
  if (!selected) return { card:null, bp:null, legalCells:[], affordableCells:[], minCost:null, playable:false, blockedReason:"commander_not_in_hand" };
  const { card, bp } = selected;
  if (typeof purchaseLimitReached === "function" && purchaseLimitReached(player, bp)) return { card, bp, legalCells:[], affordableCells:[], minCost:null, playable:false, blockedReason:"commander_field_limit" };
  if (typeof playerEnergyLocked === "function" && playerEnergyLocked(player)) return { card, bp, legalCells:[], affordableCells:[], minCost:null, playable:false, blockedReason:"energy_locked" };
  if (typeof playerHandLocked === "function" && playerHandLocked(player)) return { card, bp, legalCells:[], affordableCells:[], minCost:null, playable:false, blockedReason:"hand_locked" };
  if (typeof handCardBlocked === "function" && handCardBlocked(card)) return { card, bp, legalCells:[], affordableCells:[], minCost:null, playable:false, blockedReason:"commander_card_blocked" };
  const legalCells = typeof spawnCellsFor === "function" ? (spawnCellsFor(player, bp) || []).map(coord => coord.slice(0, 3)) : [];
  const options = legalCells.map(coord => {
    const cost = typeof effectiveHandUnitCardCost === "function"
      ? Number(effectiveHandUnitCardCost(player, card, bp, coord))
      : Number(bp.cost || 0);
    return { coord, cost:Number.isFinite(cost) ? Math.max(0, cost) : Number(bp.cost || 0) };
  });
  const minCost = options.length ? Math.min(...options.map(entry => entry.cost)) : (typeof effectiveHandUnitCardCost === "function" ? Number(effectiveHandUnitCardCost(player, card, bp)) : Number(bp.cost || 0));
  const energy = Number(state && state.energy && state.energy[player] || 0);
  const affordableCells = options.filter(entry => energy >= entry.cost);
  return {
    card, bp, legalCells, affordableCells,
    minCost:Number.isFinite(minCost) ? Math.max(0, minCost) : Number(bp.cost || 0),
    playable:affordableCells.length > 0,
    blockedReason:legalCells.length ? (affordableCells.length ? null : "insufficient_energy") : "no_legal_deployment_cell"
  };
}

function expertExordiumCommanderCommitmentF9T2d3(player) {
  const persistent = expertExordiumCommanderCommitmentBucketF9T2d3(player);
  return persistent && persistent.commanderCommitments ? persistent.commanderCommitments[player] || null : null;
}

function expertExordiumExtendCommanderDeadlineF9T2d3(commitment, round) {
  if (!commitment || Number(commitment.lastDeadlineExtendedRound || -1) === Number(round)) return;
  commitment.deploymentDeadlineRound = Number(commitment.deploymentDeadlineRound || round) + 1;
  commitment.deadlineExtensions = Number(commitment.deadlineExtensions || 0) + 1;
  commitment.lastDeadlineExtendedRound = Number(round);
}

function expertExordiumNoteCommanderDeferredF9T2d3(player, reason, details = {}, options = {}) {
  const commitment = expertExordiumCommanderCommitmentF9T2d3(player);
  if (!commitment || commitment.active !== true || commitment.executed === true) return commitment;
  const round = Number(state && state.turn || 0);
  const normalizedReason = String(reason || "deferred");
  commitment.deferredRounds = Number(commitment.deferredRounds || 0) + (Number(commitment.lastDeferredRound || -1) === round ? 0 : 1);
  commitment.deferredReasons = commitment.deferredReasons || {};
  if (Number(commitment.lastDeferredRound || -1) !== round || String(commitment.lastDeferredReason || "") !== normalizedReason) {
    commitment.deferredReasons[normalizedReason] = Number(commitment.deferredReasons[normalizedReason] || 0) + 1;
    expertExordiumEmitDecisionF9T2d3(player, "commander_deployment_deferred", {
      commanderId:commitment.commanderId,
      commitmentCreatedRound:commitment.commitmentCreatedRound,
      deploymentDeadlineRound:commitment.deploymentDeadlineRound,
      reservedEnergy:commitment.reservedEnergy,
      reason:normalizedReason,
      ...details
    });
  }
  commitment.lastDeferredRound = round;
  commitment.lastDeferredReason = normalizedReason;
  if (options.extendDeadline !== false) expertExordiumExtendCommanderDeadlineF9T2d3(commitment, round);
  return commitment;
}

function expertExordiumRefreshCommanderCommitmentF9T2d3(player, context = null) {
  if (!state || state.aiMode !== "expert" || String(state.factions && state.factions[player] || "") !== "Exordium") return null;
  const persistent = expertExordiumCommanderCommitmentBucketF9T2d3(player);
  if (!persistent) return null;
  const round = Number(state.turn || 0);
  const deployedCommander = typeof commanderOf === "function" ? commanderOf(player) : expertExordiumUnitsF9T2(player).find(unit => unit && unit.type === "Comandante") || null;
  let commitment = persistent.commanderCommitments[player] || null;
  if (deployedCommander) {
    if (commitment && commitment.active === true && commitment.executed !== true) {
      commitment.active = false;
      commitment.executed = true;
      commitment.reservationActive = false;
      commitment.reservedEnergy = 0;
      commitment.commanderActualDeploymentRound = round;
      commitment.deploymentSource = commitment.deploymentSource || "observed_in_play";
      expertExordiumEmitDecisionF9T2d3(player, "commander_deployment_executed", {
        commanderId:commitment.commanderId,
        unitId:expertExordiumUnitIdF9T2b(deployedCommander),
        deploymentSource:commitment.deploymentSource,
        commitmentCreatedRound:commitment.commitmentCreatedRound,
        deploymentDeadlineRound:commitment.deploymentDeadlineRound,
        commanderActualDeploymentRound:round,
        commanderPlayableRoundsBeforeDeployment:Number(commitment.playableRounds || 0),
        commanderDeferredRounds:Number(commitment.deferredRounds || 0)
      });
    }
    return commitment;
  }

  const status = expertExordiumCommanderDeploymentStatusF9T2d3(player);
  if (!status.card || !status.bp) return commitment;
  const policy = expertExordiumCommanderPolicyF9T2d3(status.bp);
  if (round < Number(policy.earliestCommitRound || 0)) return commitment;

  if (!commitment || commitment.executed === true || String(commitment.commanderId || "") !== String(status.bp.id || "")) {
    const reserve = Math.max(0, Number(status.minCost == null ? status.bp.cost : status.minCost) || 0);
    commitment = {
      schemaVersion:EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2D3,
      commanderId:String(status.bp.id || ""),
      commanderName:String(status.bp.name || status.card.name || "Comandante"),
      cardUid:String(status.card.cardUid || ""),
      active:true,
      executed:false,
      reservationActive:true,
      commitmentCreatedRound:round,
      deploymentDeadlineRound:round + Math.max(1, Number(policy.maxPlayableDelayRounds || 2)),
      earliestCommitRound:Number(policy.earliestCommitRound || round),
      reservedEnergy:reserve,
      playableRounds:0,
      consecutivePlayableRounds:0,
      deferredRounds:0,
      deferredReasons:{},
      deploymentAttempts:0,
      deadlineExtensions:0,
      deadlineMisses:0,
      lastEvaluatedRound:null,
      lastPlayableRound:null,
      lastDeferredRound:null,
      lastDeferredReason:null,
      commanderActualDeploymentRound:null,
      deploymentSource:null,
      deploymentCell:null
    };
    persistent.commanderCommitments[player] = commitment;
    expertExordiumEmitDecisionF9T2d3(player, "commander_deployment_commitment_created", {
      commanderId:commitment.commanderId,
      commanderName:commitment.commanderName,
      commitmentCreatedRound:commitment.commitmentCreatedRound,
      deploymentDeadlineRound:commitment.deploymentDeadlineRound,
      reservedEnergy:commitment.reservedEnergy,
      earliestCommitRound:commitment.earliestCommitRound
    });
    expertExordiumEmitDecisionF9T2d3(player, "commander_deployment_energy_reserved", {
      commanderId:commitment.commanderId,
      reservedEnergy:commitment.reservedEnergy,
      energyAvailable:Number(state.energy && state.energy[player] || 0),
      deploymentDeadlineRound:commitment.deploymentDeadlineRound
    });
  }

  if (Number(commitment.lastEvaluatedRound || -1) !== round) {
    if (status.playable) {
      commitment.playableRounds = Number(commitment.playableRounds || 0) + 1;
      commitment.consecutivePlayableRounds = Number(commitment.lastPlayableRound || -999) === round - 1
        ? Number(commitment.consecutivePlayableRounds || 0) + 1
        : 1;
      commitment.lastPlayableRound = round;
    } else {
      commitment.consecutivePlayableRounds = 0;
    }
    commitment.lastEvaluatedRound = round;
  }

  commitment.cardUid = String(status.card.cardUid || commitment.cardUid || "");
  commitment.reservedEnergy = Math.max(0, Number(status.minCost == null ? commitment.reservedEnergy : status.minCost) || 0);
  commitment.reservationActive = true;

  const hqRisk = context && context.common && context.common.hqOccupationRisk ? String(context.common.hqOccupationRisk.risk || "none") : "none";
  if (hqRisk === "direct" || hqRisk === "occupied") {
    commitment.reservationActive = false;
    return expertExordiumNoteCommanderDeferredF9T2d3(player, "hq_occupation_risk_priority", { hqRisk }, { extendDeadline:true });
  }
  if (status.blockedReason === "no_legal_deployment_cell" || status.blockedReason === "commander_field_limit" || status.blockedReason === "hand_locked" || status.blockedReason === "commander_card_blocked") {
    return expertExordiumNoteCommanderDeferredF9T2d3(player, status.blockedReason, { legalCellCount:status.legalCells.length }, { extendDeadline:true });
  }

  if (round > Number(commitment.deploymentDeadlineRound || round) && Number(commitment.lastDeadlineMissRound || -1) !== round) {
    commitment.deadlineMisses = Number(commitment.deadlineMisses || 0) + 1;
    commitment.lastDeadlineMissRound = round;
    expertExordiumEmitDecisionF9T2d3(player, "commander_deployment_deadline_missed", {
      commanderId:commitment.commanderId,
      commitmentCreatedRound:commitment.commitmentCreatedRound,
      deploymentDeadlineRound:commitment.deploymentDeadlineRound,
      currentRound:round,
      playableRounds:Number(commitment.playableRounds || 0),
      reservedEnergy:commitment.reservedEnergy,
      energyAvailable:Number(state.energy && state.energy[player] || 0)
    });
  }
  return commitment;
}

function expertExordiumCommanderRosterChoiceF9T2d3(player) {
  const commitment = expertExordiumCommanderCommitmentF9T2d3(player);
  if (!commitment || commitment.active !== true || commitment.executed === true || commitment.reservationActive === false) return null;
  const activePlan = typeof expertActivePlanF9T2 === "function" ? expertActivePlanF9T2(player) : null;
  if (activePlan) {
    expertExordiumNoteCommanderDeferredF9T2d3(player, "higher_priority_expert_plan", { planId:activePlan.id, goal:activePlan.goal }, { extendDeadline:true });
    return null;
  }
  const status = expertExordiumCommanderDeploymentStatusF9T2d3(player);
  if (!status.card || !status.bp) return null;
  if (!status.legalCells.length) {
    expertExordiumNoteCommanderDeferredF9T2d3(player, status.blockedReason || "no_legal_deployment_cell", {}, { extendDeadline:true });
    return null;
  }
  if (!status.affordableCells.length) return null;

  let chosenCoord = null;
  if (typeof chooseSpawnCell === "function") {
    const candidate = chooseSpawnCell(player, status.bp, status.affordableCells.map(entry => entry.coord.slice(0, 3)));
    if (Array.isArray(candidate) && status.affordableCells.some(entry => expertExordiumSameCoordF9T2(entry.coord, candidate))) chosenCoord = candidate.slice(0, 3);
  }
  if (!chosenCoord) {
    const sorted = status.affordableCells.slice().sort((a,b) => a.cost - b.cost || expertExordiumCoordKeyF9T2(a.coord).localeCompare(expertExordiumCoordKeyF9T2(b.coord)));
    chosenCoord = sorted[0].coord.slice(0, 3);
  }
  const selected = status.affordableCells.find(entry => expertExordiumSameCoordF9T2(entry.coord, chosenCoord)) || status.affordableCells[0];
  commitment.deploymentAttempts = Number(commitment.deploymentAttempts || 0) + 1;
  commitment.lastAttemptRound = Number(state.turn || 0);
  expertExordiumEmitDecisionF9T2d3(player, "commander_deployment_attempted", {
    commanderId:commitment.commanderId,
    cardUid:String(status.card.cardUid || ""),
    targetCell:chosenCoord,
    cost:Number(selected.cost || 0),
    reservedEnergy:Number(commitment.reservedEnergy || 0),
    deploymentAttempt:Number(commitment.deploymentAttempts || 0),
    deploymentDeadlineRound:commitment.deploymentDeadlineRound
  });
  return {
    source:"hand",
    bp:status.bp,
    cardUid:status.card.cardUid || null,
    cardName:status.card.name || status.bp.name,
    coord:chosenCoord,
    cost:Number(selected.cost || 0),
    score:2200,
    expertDoctrine:"commander_deployment_commitment_f9t2d3",
    expertCommitmentId:`commander:${commitment.commanderId}:${commitment.commitmentCreatedRound}`
  };
}

function expertExordiumObserveCommanderRosterPlayF9T2d3(player, choice) {
  if (!choice || !choice.bp || choice.bp.type !== "Comandante") return false;
  const commitment = expertExordiumCommanderCommitmentF9T2d3(player);
  if (!commitment || commitment.active !== true || commitment.executed === true || String(commitment.commanderId || "") !== String(choice.bp.id || "")) return false;
  const unit = typeof getUnitAt === "function" ? getUnitAt(choice.coord) : null;
  if (!unit || Number(unit.side) !== Number(player) || unit.type !== "Comandante") return false;
  const round = Number(state.turn || 0);
  const committedChoice = choice.expertDoctrine === "commander_deployment_commitment_f9t2d3";
  commitment.active = false;
  commitment.executed = true;
  commitment.reservationActive = false;
  commitment.reservedEnergy = 0;
  commitment.commanderActualDeploymentRound = round;
  commitment.deploymentSource = committedChoice ? "expert_commander_commitment" : "advanced_fallback_while_committed";
  commitment.deploymentCell = Array.isArray(choice.coord) ? choice.coord.slice(0, 3) : null;
  expertExordiumEmitDecisionF9T2d3(player, "commander_deployment_executed", {
    commanderId:commitment.commanderId,
    unitId:expertExordiumUnitIdF9T2b(unit),
    cardUid:String(choice.cardUid || ""),
    deploymentSource:commitment.deploymentSource,
    deploymentCell:commitment.deploymentCell,
    commitmentCreatedRound:commitment.commitmentCreatedRound,
    deploymentDeadlineRound:commitment.deploymentDeadlineRound,
    commanderActualDeploymentRound:round,
    commanderPlayableRoundsBeforeDeployment:Number(commitment.playableRounds || 0),
    commanderDeferredRounds:Number(commitment.deferredRounds || 0),
    commanderDeploymentAttempts:Number(commitment.deploymentAttempts || 0),
    deadlineMisses:Number(commitment.deadlineMisses || 0)
  });
  return true;
}
