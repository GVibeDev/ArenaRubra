"use strict";

// Arena Rubra — F9T2c Expert AI Runtime.
// Conserva il contratto architetturale F9T1 e abilita il primo micro-piano reale
// Exordium. Il runtime resta non strategico: budget, riserve, avanzamento piatto,
// fallback Advanced e telemetria senza ricerca ricorsiva.

const EXPERT_AI_SCHEMA_VERSION_F9T1 = "F9T1-1";
const EXPERT_AI_DOCTRINE_SCHEMA_VERSION_F9T2 = "F9T2d3-1";
const EXPERT_AI_LIMITS_F9T1 = Object.freeze({
  contextBudgetMs:12,
  moduleBudgetMs:8,
  turnBudgetMs:30,
  maxCandidates:64,
  maxPlanSteps:12,
  maxSupportActors:8,
  maxAbortConditions:12,
  maxDecisionRecordsPerTurn:24
});

var expertRuntimeStateF9T1 = { sequence:0, activeByPlayer:Object.create(null) };

function expertPrepareMatchF9T2c2(matchId = null, options = {}) {
  for (const runtime of Object.values(expertRuntimeStateF9T1.activeByPlayer || {})) {
    if (runtime && runtime.cache && typeof runtime.cache.clear === "function") runtime.cache.clear();
  }
  expertRuntimeStateF9T1.activeByPlayer = Object.create(null);
  expertRuntimeStateF9T1.sequence = 0;
  expertRuntimeStateF9T1.matchId = matchId == null ? null : String(matchId);
  if (state && state.expertAiF9T1) {
    state.expertAiF9T1.players = {};
    state.expertAiF9T1.commanderCommitments = {};
    state.expertAiF9T1.lastTurn = null;
    state.expertAiF9T1.matchId = expertRuntimeStateF9T1.matchId;
  }
  return { matchId:expertRuntimeStateF9T1.matchId, reason:String(options.reason || "match_prepare") };
}

function expertNowF9T1() {
  return typeof performance !== "undefined" && performance && typeof performance.now === "function" ? performance.now() : Date.now();
}

function expertHeapBytesF9T1() {
  try {
    return typeof performance !== "undefined" && performance && performance.memory && Number.isFinite(Number(performance.memory.usedJSHeapSize))
      ? Number(performance.memory.usedJSHeapSize)
      : null;
  } catch (_) { return null; }
}

function expertAiEnabledF9T1(player = null) {
  if (!state || state.aiMode !== "expert") return false;
  if (player == null) return true;
  return !state.modes || state.modes[player] === "bot";
}

function expertEnsureStateF9T1() {
  if (!state) return null;
  if (!state.expertAiF9T1 || typeof state.expertAiF9T1 !== "object") {
    state.expertAiF9T1 = { schemaVersion:EXPERT_AI_SCHEMA_VERSION_F9T1, doctrineSchemaVersion:EXPERT_AI_DOCTRINE_SCHEMA_VERSION_F9T2, players:{}, lastTurn:null };
  }
  state.expertAiF9T1.doctrineSchemaVersion = EXPERT_AI_DOCTRINE_SCHEMA_VERSION_F9T2;
  if (!state.expertAiF9T1.players) state.expertAiF9T1.players = {};
  if (!state.expertAiF9T1.commanderCommitments) state.expertAiF9T1.commanderCommitments = {};
  return state.expertAiF9T1;
}

function expertSafeCloneF9T1(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); }
  catch (_) { return null; }
}

function expertEmitF9T1(type, player, data = {}) {
  if (typeof emitGameEvent !== "function") return null;
  return emitGameEvent({
    type,
    message:"",
    data:{
      player:Number(player),
      round:state ? Number(state.turn || 0) : 0,
      schemaVersion:EXPERT_AI_SCHEMA_VERSION_F9T1,
      doctrineSchemaVersion:EXPERT_AI_DOCTRINE_SCHEMA_VERSION_F9T2,
      ...expertSafeCloneF9T1(data)
    }
  });
}

function expertPlanStepSafeF9T1(step) {
  if (!step || typeof step !== "object" || Array.isArray(step)) return null;
  if (step.orderedSteps || step.fallbackPlan || step.microPlan || step.plan) return null;
  const safe = expertSafeCloneF9T1(step);
  if (!safe || typeof safe !== "object") return null;
  return safe;
}

function expertValidateMicroPlanF9T1(plan) {
  const errors = [];
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return { ok:false, errors:["plan_not_object"] };
  if (!plan.id) errors.push("missing_id");
  if (!["Nexus","Exordium","Liberti","Agathoi","Fabeot"].includes(String(plan.faction || ""))) errors.push("invalid_faction");
  if (!plan.goal) errors.push("missing_goal");
  if (!Array.isArray(plan.orderedSteps) || plan.orderedSteps.length < 1) errors.push("missing_steps");
  if (Array.isArray(plan.orderedSteps) && plan.orderedSteps.length > EXPERT_AI_LIMITS_F9T1.maxPlanSteps) errors.push("too_many_steps");
  if (Array.isArray(plan.supportActorIds) && plan.supportActorIds.length > EXPERT_AI_LIMITS_F9T1.maxSupportActors) errors.push("too_many_support_actors");
  if (Array.isArray(plan.abortConditions) && plan.abortConditions.length > EXPERT_AI_LIMITS_F9T1.maxAbortConditions) errors.push("too_many_abort_conditions");
  if (plan.fallbackPlan != null && typeof plan.fallbackPlan !== "string") errors.push("fallback_must_be_id");
  if (Array.isArray(plan.orderedSteps) && plan.orderedSteps.some(step => !expertPlanStepSafeF9T1(step))) errors.push("recursive_or_invalid_step");
  if (Number(plan.requiredEnergy || 0) < 0 || Number(plan.reservedEnergy || 0) < 0) errors.push("negative_energy");
  return { ok:errors.length === 0, errors };
}

function expertCreateMicroPlanF9T1(input = {}) {
  const plan = {
    schemaVersion:EXPERT_AI_SCHEMA_VERSION_F9T1,
    id:String(input.id || ""),
    faction:String(input.faction || ""),
    goal:String(input.goal || ""),
    targetCell:Array.isArray(input.targetCell) ? input.targetCell.slice(0, 3) : null,
    targetPs:Array.isArray(input.targetPs) ? input.targetPs.slice(0, 3) : null,
    targetUnitId:input.targetUnitId == null ? null : String(input.targetUnitId),
    primaryActorId:input.primaryActorId == null ? null : String(input.primaryActorId),
    supportActorIds:Array.isArray(input.supportActorIds) ? input.supportActorIds.slice(0, EXPERT_AI_LIMITS_F9T1.maxSupportActors).map(String) : [],
    requiredEnergy:Math.max(0, Number(input.requiredEnergy) || 0),
    reservedEnergy:Math.max(0, Number(input.reservedEnergy) || 0),
    reservedActions:Array.isArray(input.reservedActions) ? input.reservedActions.slice(0, EXPERT_AI_LIMITS_F9T1.maxPlanSteps).map(String) : [],
    orderedSteps:Array.isArray(input.orderedSteps) ? input.orderedSteps.slice(0, EXPERT_AI_LIMITS_F9T1.maxPlanSteps).map(expertPlanStepSafeF9T1).filter(Boolean) : [],
    currentStep:Math.max(0, Number(input.currentStep) || 0),
    expectedResult:expertSafeCloneF9T1(input.expectedResult || {}),
    abortConditions:Array.isArray(input.abortConditions) ? expertSafeCloneF9T1(input.abortConditions.slice(0, EXPERT_AI_LIMITS_F9T1.maxAbortConditions)) : [],
    fallbackPlan:input.fallbackPlan == null ? null : String(input.fallbackPlan),
    status:String(input.status || "proposed")
  };
  const validation = expertValidateMicroPlanF9T1(plan);
  return { plan, validation };
}

function expertActiveRuntimeF9T2(player) {
  return expertRuntimeStateF9T1 && expertRuntimeStateF9T1.activeByPlayer
    ? expertRuntimeStateF9T1.activeByPlayer[player] || null
    : null;
}

function expertActivePlanF9T2(player) {
  const runtime = expertActiveRuntimeF9T2(player);
  return runtime && runtime.plan && runtime.plan.status === "active" ? runtime.plan : null;
}

function expertCurrentPlanStepF9T2(player) {
  const plan = expertActivePlanF9T2(player);
  return plan && Array.isArray(plan.orderedSteps) ? plan.orderedSteps[plan.currentStep] || null : null;
}

function expertCommanderCommitmentF9T2d3(player) {
  const persistent = expertEnsureStateF9T1();
  return persistent && persistent.commanderCommitments
    ? persistent.commanderCommitments[player] || null
    : null;
}

function expertCommanderReservedEnergyF9T2d3(player) {
  const commitment = expertCommanderCommitmentF9T2d3(player);
  if (!commitment || commitment.active !== true || commitment.executed === true || commitment.reservationActive === false) return 0;
  return Math.max(0, Number(commitment.reservedEnergy || 0));
}

function expertReservedEnergyF9T2(player) {
  const plan = expertActivePlanF9T2(player);
  const planReserve = plan ? Math.max(0, Number(plan.reservedEnergy || 0)) : 0;
  const commanderReserve = expertCommanderReservedEnergyF9T2d3(player);
  return planReserve + commanderReserve;
}

function expertCanSpendEnergyF9T2(player, cost, options = {}) {
  if (!expertAiEnabledF9T1(player) || options.planSpend) return true;
  const reserve = expertReservedEnergyF9T2(player);
  if (reserve <= 0) return true;
  const available = Number(state && state.energy && state.energy[player] || 0);
  return available - Math.max(0, Number(cost || 0)) >= reserve;
}

function expertAdvancePlanStepF9T2(player, result = {}) {
  const runtime = expertActiveRuntimeF9T2(player);
  const plan = runtime && runtime.plan;
  if (!runtime || !plan || plan.status !== "active") return null;
  const step = plan.orderedSteps[plan.currentStep] || null;
  if (!step) return null;
  const completedIndex = plan.currentStep;
  plan.currentStep += 1;
  expertEmitF9T1(EventTypes.AI_MICROPLAN_STEP, player, {
    sequence:runtime.sequence,
    moduleId:runtime.module ? runtime.module.moduleId : null,
    planId:plan.id,
    goal:plan.goal,
    stepIndex:completedIndex,
    stepId:String(step.id || ""),
    action:String(step.action || ""),
    status:"completed",
    result:expertSafeCloneF9T1(result)
  });
  if (plan.currentStep >= plan.orderedSteps.length) {
    plan.status = "completed";
    expertEmitF9T1(EventTypes.AI_MICROPLAN_COMPLETED, player, {
      sequence:runtime.sequence,
      moduleId:runtime.module ? runtime.module.moduleId : null,
      planId:plan.id,
      goal:plan.goal,
      completedSteps:plan.currentStep,
      expectedResult:expertSafeCloneF9T1(plan.expectedResult || {}),
      finalResult:expertSafeCloneF9T1(result)
    });
  }
  return plan;
}

function expertAbortPlanF9T2(player, reason, details = {}) {
  const runtime = expertActiveRuntimeF9T2(player);
  const plan = runtime && runtime.plan;
  if (!runtime || !plan || !["active","proposed"].includes(plan.status)) return null;
  plan.status = "aborted";
  runtime.fallbackUsed = true;
  plan.reservedEnergy = 0;
  expertEmitF9T1(EventTypes.AI_MICROPLAN_ABORTED, player, {
    sequence:runtime.sequence,
    moduleId:runtime.module ? runtime.module.moduleId : null,
    planId:plan.id,
    goal:plan.goal,
    currentStep:Number(plan.currentStep || 0),
    reason:String(reason || "plan_aborted"),
    details:expertSafeCloneF9T1(details)
  });
  expertEmitF9T1(EventTypes.AI_EXPERT_FALLBACK, player, {
    sequence:runtime.sequence,
    moduleId:runtime.module ? runtime.module.moduleId : null,
    reason:String(reason || "plan_aborted"),
    fallback:"advanced_f9t0"
  });
  return plan;
}

function expertBuildTurnContextF9T1(player, runtime) {
  const enemyPlayers = typeof expertEnemyPlayersF9T1 === "function" ? expertEnemyPlayersF9T1(player) : [];
  const common = expertBuildCommonContextF9T1(player, runtime);
  const pressureProfile = typeof botPressureProfileF9T0 === "function" ? botPressureProfileF9T0() : null;
  return Object.freeze({
    schemaVersion:EXPERT_AI_SCHEMA_VERSION_F9T1,
    doctrineSchemaVersion:EXPERT_AI_DOCTRINE_SCHEMA_VERSION_F9T2,
    player:Number(player),
    faction:String(state && state.factions ? state.factions[player] || "" : ""),
    turn:Number(state && state.turn || 0),
    mapId:String(state && state.mapId || ""),
    mapName:String(state && state.mapDefinition && state.mapDefinition.name || ""),
    movementMultiplier:typeof expertMapMovementMultiplierF9T1 === "function" ? expertMapMovementMultiplierF9T1() : 1,
    enemyPlayers,
    energy:Number(state && state.energy && state.energy[player] || 0),
    controlledPs:typeof countControlledPS === "function" ? Number(countControlledPS(player) || 0) : 0,
    pressure:Number(state && state.pressure && state.pressure[player] || 0),
    pressureProfile:pressureProfile ? expertSafeCloneF9T1(pressureProfile) : null,
    limits:EXPERT_AI_LIMITS_F9T1,
    common
  });
}

function expertContextTelemetrySummaryF9T1(context, runtime, durationMs) {
  const common = context.common || {};
  return {
    faction:context.faction,
    mapId:context.mapId,
    movementMultiplier:context.movementMultiplier,
    durationMs:Number(durationMs.toFixed(3)),
    cacheHits:Number(runtime.cacheHits || 0),
    cacheMisses:Number(runtime.cacheMisses || 0),
    common:{
      enemyProximity:{
        immediateCount:common.adaptiveEnemyProximity ? common.adaptiveEnemyProximity.immediateCount : 0,
        nearCount:common.adaptiveEnemyProximity ? common.adaptiveEnemyProximity.nearCount : 0,
        minimumTurnsToHq:common.adaptiveEnemyProximity ? common.adaptiveEnemyProximity.minimumTurnsToHq : null
      },
      hqStructureProtection:common.hqStructureProtection ? expertSafeCloneF9T1(common.hqStructureProtection) : null,
      psStructures:common.psStructures ? {
        totalPs:common.psStructures.totalPs,
        ownedPs:common.psStructures.ownedPs,
        ownedPsWithStructure:common.psStructures.ownedPsWithStructure,
        coverageRatio:common.psStructures.coverageRatio
      } : null,
      hqOccupationRisk:common.hqOccupationRisk ? expertSafeCloneF9T1(common.hqOccupationRisk) : null
    }
  };
}

function expertFlushDeferredModuleTelemetryF9T2d1(player) {
  const runtime = expertRuntimeStateF9T1.activeByPlayer[player];
  if (!runtime || !Array.isArray(runtime.deferredModuleTelemetry) || !runtime.deferredModuleTelemetry.length) return 0;
  const queue = runtime.deferredModuleTelemetry.splice(0);
  let emitted = 0;
  for (const entry of queue) {
    if (!entry || !entry.decision) continue;
    expertEmitDecisionLimitedF9T2c1(player, entry.decision, entry.options || {});
    emitted += 1;
  }
  return emitted;
}

function expertBeginTurnF9T1(player) {
  if (!expertAiEnabledF9T1(player)) return null;
  const turn = Number(state.turn || 0);
  const matchId = String(state.matchId || "");
  const existing = expertRuntimeStateF9T1.activeByPlayer[player];
  if (existing && existing.turn === turn && String(existing.matchId || "") === matchId) return existing;
  if (existing) {
    if (existing.cache && typeof existing.cache.clear === "function") existing.cache.clear();
    delete expertRuntimeStateF9T1.activeByPlayer[player];
  }

  expertRuntimeStateF9T1.sequence += 1;
  const runtime = {
    sequence:expertRuntimeStateF9T1.sequence,
    matchId,
    player:Number(player),
    turn,
    faction:String(state.factions && state.factions[player] || ""),
    startedAt:expertNowF9T1(),
    heapStart:expertHeapBytesF9T1(),
    cache:new Map(),
    cacheHits:0,
    cacheMisses:0,
    candidateCount:0,
    discardedCandidates:0,
    candidateAuditCount:0,
    candidateAuditCountByScanner:{ relay:0, clearOccupyFortify:0, forwardPivot:0, varranAssault:0 },
    candidateRejectionCounts:{},
    candidateRejectionCountsByScanner:{ relay:{}, clearOccupyFortify:{}, forwardPivot:{}, varranAssault:{} },
    territorialConversionMetrics:{
      psClearedDuringExpertPlan:0,
      psClearedDirectlyByExpertStep:0,
      psOccupiedAfterClear:0,
      psFortifiedAfterClear:0
    },
    decisions:[],
    decisionTotal:0,
    decisionRecordsEmitted:0,
    decisionRecordsDropped:0,
    decisionLimitReached:false,
    auditRecordTotal:0,
    auditRecordsDropped:0,
    auditItemsTotal:0,
    auditItemsStored:0,
    auditItemsDropped:0,
    auditContainersTotal:0,
    candidateScanStoppedEarly:false,
    fallbackUsed:false,
    completed:false,
    deferredModuleTelemetry:[],
    plan:null,
    module:null
  };
  expertRuntimeStateF9T1.activeByPlayer[player] = runtime;
  expertEnsureStateF9T1();
  expertEmitF9T1(EventTypes.AI_EXPERT_TURN_STARTED, player, {
    sequence:runtime.sequence,
    matchId:runtime.matchId,
    faction:runtime.faction,
    limits:EXPERT_AI_LIMITS_F9T1,
    heapBytes:runtime.heapStart
  });

  const contextStarted = expertNowF9T1();
  runtime.context = expertBuildTurnContextF9T1(player, runtime);
  if (typeof expertFactionRefreshPersistentCommitmentsF9T2d3 === "function") {
    expertFactionRefreshPersistentCommitmentsF9T2d3(player, runtime.context);
  }
  runtime.contextDurationMs = expertNowF9T1() - contextStarted;
  expertEmitF9T1(EventTypes.AI_EXPERT_CONTEXT_CREATED, player, {
    sequence:runtime.sequence,
    ...expertContextTelemetrySummaryF9T1(runtime.context, runtime, runtime.contextDurationMs)
  });

  runtime.module = expertRouteFactionF9T1(runtime.context);
  expertFlushDeferredModuleTelemetryF9T2d1(player);
  expertEmitF9T1(EventTypes.AI_EXPERT_MODULE_ROUTED, player, {
    sequence:runtime.sequence,
    matchId:runtime.matchId,
    faction:runtime.faction,
    moduleId:runtime.module.moduleId,
    invokedModules:runtime.module.invokedModules,
    durationMs:runtime.module.durationMs,
    moduleStatus:runtime.module.result ? runtime.module.result.status : "empty"
  });

  const proposed = runtime.module && runtime.module.result ? runtime.module.result.plan : null;
  if (proposed) {
    const validation = expertValidateMicroPlanF9T1(proposed);
    if (validation.ok) {
      runtime.plan = proposed;
      runtime.plan.status = "active";
      runtime.plan.currentStep = Math.max(0, Number(runtime.plan.currentStep || 0));
      runtime.fallbackUsed = false;
      expertEmitF9T1(EventTypes.AI_MICROPLAN_SELECTED, player, {
        sequence:runtime.sequence,
        moduleId:runtime.module.moduleId,
        planId:proposed.id,
        goal:proposed.goal,
        stepCount:proposed.orderedSteps.length,
        requiredEnergy:proposed.requiredEnergy,
        reservedEnergy:proposed.reservedEnergy,
        targetCell:proposed.targetCell,
        targetPs:proposed.targetPs,
        primaryActorId:proposed.primaryActorId,
        supportActorIds:proposed.supportActorIds,
        expectedResult:proposed.expectedResult
      });
    } else {
      runtime.fallbackUsed = true;
      expertEmitF9T1(EventTypes.AI_EXPERT_FALLBACK, player, {
        sequence:runtime.sequence,
        moduleId:runtime.module.moduleId,
        reason:"invalid_microplan",
        validationErrors:validation.errors,
        fallback:"advanced_f9t0"
      });
    }
  } else {
    runtime.fallbackUsed = true;
    expertEmitF9T1(EventTypes.AI_EXPERT_FALLBACK, player, {
      sequence:runtime.sequence,
      moduleId:runtime.module.moduleId,
      reason:String(runtime.module && runtime.module.result && runtime.module.result.reason || "no_microplan"),
      fallback:"advanced_f9t0"
    });
  }

  const elapsed = expertNowF9T1() - runtime.startedAt;
  if (runtime.contextDurationMs > EXPERT_AI_LIMITS_F9T1.contextBudgetMs || runtime.module.durationMs > EXPERT_AI_LIMITS_F9T1.moduleBudgetMs || elapsed > EXPERT_AI_LIMITS_F9T1.turnBudgetMs) {
    expertEmitF9T1(EventTypes.AI_EXPERT_BUDGET_EXHAUSTED, player, {
      sequence:runtime.sequence,
      phase:runtime.contextDurationMs > EXPERT_AI_LIMITS_F9T1.contextBudgetMs ? "context" : (runtime.module.durationMs > EXPERT_AI_LIMITS_F9T1.moduleBudgetMs ? "module" : "turn_start"),
      contextDurationMs:Number(runtime.contextDurationMs.toFixed(3)),
      moduleDurationMs:Number(runtime.module.durationMs || 0),
      elapsedMs:Number(elapsed.toFixed(3)),
      limits:EXPERT_AI_LIMITS_F9T1
    });
  }
  return runtime;
}

function expertCaptureUnitDecisionF9T1(unit) {
  if (!unit) return null;
  return {
    unitId:String(unit.uid || unit.id || ""),
    unitName:String(unit.name || ""),
    type:String(unit.type || ""),
    position:Array.isArray(unit.pos) ? unit.pos.slice(0, 3) : null,
    acted:Boolean(unit.acted),
    alive:unit.alive !== false,
    energy:Number(state && state.energy && state.energy[unit.side] || 0)
  };
}

function expertDecisionSlotF9T2c1(player) {
  const runtime = expertRuntimeStateF9T1.activeByPlayer[player];
  if (!runtime || runtime.completed) return false;
  runtime.decisionTotal = Number(runtime.decisionTotal || 0) + 1;
  if (Number(runtime.decisionRecordsEmitted || 0) >= EXPERT_AI_LIMITS_F9T1.maxDecisionRecordsPerTurn) {
    runtime.decisionLimitReached = true;
    runtime.decisionRecordsDropped = Number(runtime.decisionRecordsDropped || 0) + 1;
    return false;
  }
  runtime.decisionRecordsEmitted = Number(runtime.decisionRecordsEmitted || 0) + 1;
  return true;
}

function expertRecordAuditF9T2c1(player, detailCount = 1, storedCount = 1) {
  const runtime = expertRuntimeStateF9T1.activeByPlayer[player];
  if (!runtime || runtime.completed) return null;
  const total = Math.max(0, Number(detailCount || 0));
  const stored = Math.max(0, Math.min(total, Number(storedCount || 0)));
  const dropped = Math.max(0, total - stored);
  runtime.auditItemsTotal = Number(runtime.auditItemsTotal || 0) + total;
  runtime.auditItemsStored = Number(runtime.auditItemsStored || 0) + stored;
  runtime.auditItemsDropped = Number(runtime.auditItemsDropped || 0) + dropped;
  runtime.auditContainersTotal = Number(runtime.auditContainersTotal || 0) + 1;
  // Campi legacy: auditRecordTotal/auditRecordsDropped contano item atomici.
  runtime.auditRecordTotal = runtime.auditItemsTotal;
  runtime.auditRecordsDropped = runtime.auditItemsDropped;
  return { runtime, total, stored, dropped };
}

function expertEmitDecisionLimitedF9T2c1(player, decision, options = {}) {
  const runtime = expertRuntimeStateF9T1.activeByPlayer[player];
  const audit = Boolean(options.audit);
  let auditMeta = null;
  if (audit) {
    auditMeta = expertRecordAuditF9T2c1(player, options.auditTotal == null ? 1 : options.auditTotal, options.auditStored == null ? 1 : options.auditStored);
  } else if (runtime && !expertDecisionSlotF9T2c1(player)) {
    return null;
  } else if (!audit && runtime) {
    runtime.decisions.push(expertSafeCloneF9T1(decision || {}));
  }
  const auditFields = auditMeta ? {
    auditItemsTotal:Number(auditMeta.total || 0),
    auditItemsStored:Number(auditMeta.stored || 0),
    auditItemsDropped:Number(auditMeta.dropped || 0)
  } : {};
  return expertEmitF9T1(EventTypes.AI_EXPERT_DECISION, player, {
    sequence:options.sequence != null ? options.sequence : (runtime ? runtime.sequence : null),
    auditRecord:audit,
    decision:{ ...expertSafeCloneF9T1(decision || {}), ...auditFields, auditRecord:audit }
  });
}

function expertRecordDecisionF9T1(player, before, after, meta = {}) {
  const runtime = expertRuntimeStateF9T1.activeByPlayer[player];
  if (!runtime || runtime.completed) return null;
  if (!expertDecisionSlotF9T2c1(player)) return null;
  const record = {
    index:runtime.decisionTotal,
    kind:String(meta.kind || "advanced_fallback_unit_action"),
    source:String(meta.source || "advanced_f9t0"),
    unitId:String((after && after.unitId) || (before && before.unitId) || ""),
    unitName:String((after && after.unitName) || (before && before.unitName) || ""),
    from:before && Array.isArray(before.position) ? before.position.slice(0, 3) : null,
    to:after && Array.isArray(after.position) ? after.position.slice(0, 3) : null,
    moved:Boolean(before && after && before.position && after.position && before.position.join(",") !== after.position.join(",")),
    acted:Boolean(after && after.acted),
    aliveAfter:Boolean(after && after.alive),
    energyBefore:before ? Number(before.energy || 0) : null,
    energyAfter:after ? Number(after.energy || 0) : null
  };
  runtime.decisions.push(record);
  if (typeof telemetryRecordExpertDecisionF9T1 === "function") telemetryRecordExpertDecisionF9T1(player, runtime.sequence, record);
  if (runtime.faction === "Exordium" && typeof expertExordiumObserveUnitDecisionF9T2 === "function") {
    expertExordiumObserveUnitDecisionF9T2(player, before, after, record);
    if (typeof expertExordiumReconcileActivePlanF9T2c1 === "function") {
      expertExordiumReconcileActivePlanF9T2c1(player, { phase:"after_fallback_decision", record });
    }
  }
  return record;
}

function expertCompleteTurnF9T1(player, options = {}) {
  const runtime = expertRuntimeStateF9T1.activeByPlayer[player];
  if (!runtime || runtime.completed) {
    if (state && state.aiMode === "expert" && typeof console !== "undefined" && console.error) console.error("F9T2c2: tentativo di completare un turno Expert senza sessione attiva", { player, matchId:state.matchId || null });
    return null;
  }
  if (!state || String(runtime.matchId || "") !== String(state.matchId || "")) {
    if (runtime.cache && typeof runtime.cache.clear === "function") runtime.cache.clear();
    delete expertRuntimeStateF9T1.activeByPlayer[player];
    return null;
  }
  if (runtime.plan && runtime.plan.status === "active" && runtime.faction === "Exordium" && typeof expertExordiumReconcileActivePlanF9T2c1 === "function") {
    expertExordiumReconcileActivePlanF9T2c1(player, { phase:"turn_end" });
  }
  if (runtime.plan && runtime.plan.status === "active") {
    expertAbortPlanF9T2(player, "turn_ended_before_completion", { currentStep:runtime.plan.currentStep });
  }
  runtime.completed = true;
  const endedAt = expertNowF9T1();
  const heapEnd = expertHeapBytesF9T1();
  const summary = {
    sequence:runtime.sequence,
    faction:runtime.faction,
    moduleId:runtime.module ? runtime.module.moduleId : null,
    planId:runtime.plan ? runtime.plan.id : null,
    planStatus:runtime.plan ? runtime.plan.status : null,
    planCurrentStep:runtime.plan ? Number(runtime.plan.currentStep || 0) : null,
    fallbackUsed:Boolean(runtime.fallbackUsed),
    decisionCount:Number(runtime.decisionRecordsEmitted || 0),
    decisionRecordsTotal:Number(runtime.decisionTotal || 0),
    decisionRecordsStored:runtime.decisions.length,
    decisionRecordsDropped:Number(runtime.decisionRecordsDropped || 0),
    decisionLimitReached:Boolean(runtime.decisionLimitReached),
    auditRecordTotal:Number(runtime.auditRecordTotal || 0),
    auditRecordsDropped:Number(runtime.auditRecordsDropped || 0),
    auditItemsTotal:Number(runtime.auditItemsTotal || runtime.auditRecordTotal || 0),
    auditItemsStored:Number(runtime.auditItemsStored || 0),
    auditItemsDropped:Number(runtime.auditItemsDropped || runtime.auditRecordsDropped || 0),
    auditContainersTotal:Number(runtime.auditContainersTotal || 0),
    candidateScanStoppedEarly:Boolean(runtime.candidateScanStoppedEarly),
    candidateCount:Number(runtime.candidateCount || 0),
    discardedCandidates:Number(runtime.discardedCandidates || 0),
    candidateAuditCount:Number(runtime.candidateAuditCount || 0),
    candidateAuditCountByScanner:expertSafeCloneF9T1(runtime.candidateAuditCountByScanner || {}),
    candidateRejectionCounts:expertSafeCloneF9T1(runtime.candidateRejectionCounts || {}),
    candidateRejectionCountsByScanner:expertSafeCloneF9T1(runtime.candidateRejectionCountsByScanner || {}),
    territorialConversionMetrics:expertSafeCloneF9T1(runtime.territorialConversionMetrics || {}),
    cacheHits:Number(runtime.cacheHits || 0),
    cacheMisses:Number(runtime.cacheMisses || 0),
    contextDurationMs:Number((runtime.contextDurationMs || 0).toFixed(3)),
    moduleDurationMs:Number((runtime.module && runtime.module.durationMs || 0).toFixed ? (runtime.module && runtime.module.durationMs || 0).toFixed(3) : runtime.module && runtime.module.durationMs || 0),
    totalDurationMs:Number((endedAt - runtime.startedAt).toFixed(3)),
    heapStart:runtime.heapStart,
    heapEnd,
    heapDelta:runtime.heapStart != null && heapEnd != null ? heapEnd - runtime.heapStart : null,
    reason:String(options.reason || "turn_completed"),
    guardIterations:Number(options.guardIterations || 0),
    winner:Boolean(options.winner)
  };
  expertEmitF9T1(EventTypes.AI_EXPERT_TURN_COMPLETED, player, summary);
  const persistent = expertEnsureStateF9T1();
  if (persistent) {
    persistent.players[player] = { lastTurn:summary, turnsCompleted:Number((persistent.players[player] && persistent.players[player].turnsCompleted) || 0) + 1 };
    persistent.lastTurn = summary;
  }
  if (runtime.cache && typeof runtime.cache.clear === "function") runtime.cache.clear();
  runtime.context = null;
  runtime.module = null;
  runtime.plan = null;
  delete expertRuntimeStateF9T1.activeByPlayer[player];
  return summary;
}

function expertResetRuntimeF9T1() {
  for (const key of Object.keys(expertRuntimeStateF9T1.activeByPlayer)) {
    const runtime = expertRuntimeStateF9T1.activeByPlayer[key];
    if (runtime && runtime.cache && typeof runtime.cache.clear === "function") runtime.cache.clear();
  }
  expertRuntimeStateF9T1 = { sequence:0, activeByPlayer:Object.create(null) };
}
