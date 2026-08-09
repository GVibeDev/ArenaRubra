"use strict";

// Arena Rubra – F9Q3e1a Telemetry Attribution & Pivot Instances Hotfix.
// Raccolta strutturata e versionata per testing/bilanciamento.
// Non modifica regole, costi, target o IA: osserva gli eventi tipizzati e gli snapshot runtime.

const MATCH_TELEMETRY_SCHEMA_VERSION = "F9Q3e1-2";
const MATCH_TELEMETRY_RNG_ALGORITHM = "mulberry32";
const MATCH_TELEMETRY_EXPERT_SCHEMA_VERSION = "F9T1-1";
const MATCH_TELEMETRY_EXPERT_DOCTRINE_SCHEMA_VERSION = "F9T2d3-1";

function telemetryNowIso() {
  return new Date().toISOString();
}

function telemetryPerfNow() {
  return typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
}

function telemetryClone(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); }
  catch (_) { return null; }
}

function telemetryNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function telemetryPlayerIds() {
  if (!state) return [1, 2];
  const raw = typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(state) : [1, 2];
  return [...new Set((raw || []).map(Number).filter(side => Number.isInteger(side) && side > 0))];
}

function telemetryValidSide(side) {
  const normalized = Number(side);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
}

function createMatchSeed() {
  const time = Date.now().toString(36);
  const random = Math.floor(Math.random() * 0xffffffff).toString(36);
  return `AR-${time}-${random}`;
}

function telemetryHashSeed(seed) {
  const text = String(seed || "arena-rubra");
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash || 0x6d2b79f5;
}

function createMatchRngController(seed) {
  const resolvedSeed = String(seed || createMatchSeed());
  return {
    seed: resolvedSeed,
    state: telemetryHashSeed(resolvedSeed),
    calls: 0,
    next() {
      this.state = (this.state + 0x6D2B79F5) >>> 0;
      let t = this.state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      this.calls += 1;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  };
}

function matchRandom() {
  if (!state || !Number.isInteger(state.matchRngState)) return Math.random();
  state.matchRngState = (state.matchRngState + 0x6D2B79F5) >>> 0;
  let t = state.matchRngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  state.matchRngCalls = telemetryNumber(state.matchRngCalls, 0) + 1;
  if (state.matchTelemetry && state.matchTelemetry.rng) {
    state.matchTelemetry.rng.calls = state.matchRngCalls;
    state.matchTelemetry.rng.state = state.matchRngState;
  }
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function telemetryCardKey(cardOrData) {
  const card = cardOrData || {};
  return String(card.cardId || card.id || card.sourceId || card.blueprintId || card.missionId || card.cardUid || "unknown");
}

function telemetryCardName(cardOrData) {
  const card = cardOrData || {};
  if (card.cardName || card.name) return String(card.cardName || card.name);
  const key = telemetryCardKey(card);
  const catalog = state && Array.isArray(state.cardCatalog) ? state.cardCatalog : [];
  const found = catalog.find(item => item && (item.id === key || item.sourceId === key || item.blueprintId === key || item.missionId === key));
  return found ? String(found.name || key) : key;
}

function telemetryDeckEntry(side) {
  if (!state) return null;
  const selection = state.selectedDecks && state.selectedDecks[side] ? state.selectedDecks[side] : {};
  const savedKey = String(selection.savedKey || "");
  if (savedKey && typeof BUILTIN_DECK_EXPORT !== "undefined" && BUILTIN_DECK_EXPORT && BUILTIN_DECK_EXPORT.decks && BUILTIN_DECK_EXPORT.decks[savedKey]) {
    return BUILTIN_DECK_EXPORT.decks[savedKey];
  }
  if (savedKey && typeof deckBuilderSavedPayloadEntriesFor === "function") {
    const faction = state.factions ? state.factions[side] : "";
    const entries = deckBuilderSavedPayloadEntriesFor(faction, "", { allowCustom:true }) || [];
    const found = entries.find(entry => entry && String(entry.key || entry.savedKey || "") === savedKey);
    if (found) return found.payload || found;
  }
  return null;
}

function telemetryRuntimeCards(side) {
  if (!state) return [];
  return [
    ...((state.hand && state.hand[side]) || []),
    ...((state.deck && state.deck[side]) || []),
    ...((state.discard && state.discard[side]) || [])
  ].filter(card => card && card.countedInDeck !== false);
}

function telemetryDeckIdentity(side) {
  const entry = telemetryDeckEntry(side);
  const cards = telemetryRuntimeCards(side);
  const selection = state && state.selectedDecks && state.selectedDecks[side] ? state.selectedDecks[side] : {};
  const commander = cards.find(card => card && (card.cardType === "commander" || card.deckRole === "commander"));
  const pivot = cards.find(card => card && card.deckRole === "pivot");
  const mission = cards.find(card => card && (card.sourceType === "mission" || card.deckRole === "mission" || card.cardType === "mission"));
  const counts = {};
  for (const card of cards) {
    const key = telemetryCardKey(card);
    counts[key] = (counts[key] || 0) + 1;
  }
  const energyValues = cards.map(card => telemetryNumber(card.cost, 0));
  const unitCount = cards.filter(card => card && card.sourceType === "unit").length;
  const tacticCount = cards.filter(card => card && card.sourceType === "tactic").length;
  const structureCount = cards.filter(card => card && card.sourceType === "unit" && (card.unitType === "Struttura" || card.type === "Struttura" || card.cardType === "unit_structure")).length;
  return {
    key: String((entry && (entry.key || entry.savedKey)) || selection.savedKey || "template"),
    mode: selection.mode === "custom" ? "custom" : "template",
    name: String((entry && (entry.deckName || entry.name)) || (cards.find(card => card.customMatchLabDeckName) || {}).customMatchLabDeckName || `${state.factions[side]} · Template`),
    official: Boolean(entry && (entry.official || entry.builtIn)),
    category: String((entry && entry.deckCategory) || (mission ? "mission" : "tactical")),
    archetype: String((entry && entry.archetype) || ""),
    version: String((entry && entry.officialDeckVersion) || ""),
    commanderId: String((entry && entry.commanderId) || (commander && (commander.blueprintId || commander.sourceId)) || (state.selectedCommanders && state.selectedCommanders[side]) || ""),
    commanderName: String((entry && entry.commanderName) || (commander && commander.name) || ""),
    pivotId: String((entry && entry.pivotId) || (pivot && (pivot.blueprintId || pivot.sourceId)) || ""),
    pivotName: String((entry && entry.pivotName) || (pivot && pivot.name) || ""),
    missionId: String((entry && entry.missionId) || (mission && (mission.missionId || mission.sourceId)) || ""),
    missionName: String((entry && entry.missionName) || (mission && mission.name) || ""),
    cardCount: cards.length,
    unitCount,
    tacticCount,
    structureCount,
    missionCount: mission ? 1 : 0,
    energyAverage: cards.length ? Number((energyValues.reduce((sum, value) => sum + value, 0) / cards.length).toFixed(3)) : 0,
    cardCounts: counts
  };
}

function telemetryEmptyCardCounters() {
  return {
    drawn:0, played:0, discarded:0, stolenIn:0, stolenOut:0, blocked:0, overdrawn:0,
    firstDrawRound:null, firstPlayRound:null, lastPlayRound:null, turnsHeldAtEnd:0
  };
}

function telemetryEmptyPlayer(side) {
  const deck = telemetryDeckIdentity(side);
  return {
    side,
    faction: state && state.factions ? state.factions[side] : "",
    mode: state && state.modes ? state.modes[side] : "",
    deck,
    economy: {
      startingEnergy: state && state.energy ? telemetryNumber(state.energy[side], 0) : 0,
      gainedTotal:0, gainedBaseIncome:0, gainedFromPs:0, gainedFromCards:0, gainedFromAbilities:0, gainedFromMissions:0, gainedOther:0,
      spentTotal:0, spentUnits:0, spentStructures:0, spentTactics:0, spentAbilities:0, spentMissions:0,
      lostTotal:0, stolenTotal:0, blockedEvents:0, incomePenaltyTotal:0, unusedAtTurnEndTotal:0, unusedAtTurnEndAverage:0, turnsMeasured:0
    },
    cards: {
      drawn:0, played:0, discarded:0, stolenIn:0, stolenOut:0, blocked:0, overdrawn:0, deckExhaustions:0, deckRecoveries:0,
      maxHandSize: state && state.hand && state.hand[side] ? state.hand[side].length : 0,
      handSizeSumAtTurnReady:0, turnReadySamples:0, noCardPlayedTurns:0, deadHandTurns:0, playableButUnusedTurns:0,
      byCard:{}
    },
    field: {
      unitsDeployed:0, structuresBuilt:0, psControlChanges:0, psGained:0, psLost:0, pressureGained:0,
      commanderDeployedRound:null,
      // Campi compatibili: primo draw/deploy, ultima distruzione e sopravvivenza cumulativa di tutte le istanze.
      pivotDrawRound:null, pivotDrawRounds:[], pivotDeployedRound:null, pivotDestroyedRound:null, pivotSurvivalRounds:null,
      pivotInstanceCount:0, pivotDestroyedCount:0, pivotActiveCount:0,
      pivotDamageDealt:0, pivotAbilitiesUsed:0, pivotAttacks:0,
      pivotInstances:[], deckPivotInstances:[], rosterPivotInstances:[], marketPivotInstances:[], allPivotInstances:[]
    },
    combat: {
      attacks:0, abilities:0, tactics:0, damageDealt:0, damageToDef:0, damageToHp:0, damageTaken:0,
      kills:0, assists:0, unitsLost:0, playerEliminations:0, eliminatedRound:null
    },
    mission: {
      present:Boolean(deck.missionId), missionId:deck.missionId || "", missionName:deck.missionName || "",
      progressChanges:0, readyRound:null, playedRound:null, completionRound:null, rewardResolvedRound:null, rewardsResolved:0, cyclesPlayed:0,
      impossibleAtEnd:false, objectives:{}
    },
    turns: [],
    performance: { turnDurationMsTotal:0, turnDurationMsMax:0, turnDurationMsAverage:0, turnsMeasured:0 }
  };
}


function telemetryEmptyExpertAiF9T1() {
  const moduleEntries = ["Nexus","Exordium","Liberti","Agathoi","Fabeot"].map(faction => [faction, {
    turnsRouted:0, fallbacks:0, microplansSelected:0, microplansCompleted:0, microplansAborted:0,
    microplanSteps:0, bastionRelayPlans:0, clearOccupyFortifyPlans:0, forwardPivotPlans:0, varranAssaultPlans:0,
    varranAssaultScans:0, varranAssaultOrdersCommitted:0, varranAssaultTargetsReassigned:0, varranAssaultsExecuted:0, varranStationaryAssaultsExecuted:0, varranAttackOwnershipRecognized:0, varranPredictedBonusEffectiveDamage:0, varranActualBonusEffectiveDamage:0, varranImmediateKillsPredicted:0, varranImmediateKillsAchieved:0, varranBonusEnabledKills:0,
    commanderDeploymentCommitments:0, commanderDeploymentCommitmentsExecuted:0, commanderDeploymentDeferred:0, commanderDeploymentDeferredReasons:{}, commanderDeploymentAttempts:0, commanderDeploymentDeadlineMisses:0, commanderEnergyReserved:0, commanderPlayableRoundsBeforeDeployment:0, commanderCommitmentCreatedRound:null, commanderDeploymentDeadlineRound:null, commanderActualDeploymentRound:null,
    bastionsBuiltOnPs:0, expertBastionsBuiltOnPs:0, fallbackBastionsBuiltOnPs:0, totalBastionsBuiltOnPs:0,
    mobileGuardsReleased:0, psCleared:0, psOccupiedAfterClear:0, psFortifiedAfterClear:0,
    expertPsCleared:0, expertPsOccupiedAfterClear:0, expertPsFortifiedAfterClear:0,
    psClearedDuringExpertPlan:0, psClearedDirectlyByExpertStep:0,
    relaySurvivalChecks:0, relayRebuildsRejected:0, forwardPivotsDeployed:0, forwardPivotImpacts:0, forwardPivotImpactMisses:0, forwardPivotLateImpacts:0, expertForwardPivotsDeployed:0, expertForwardPivotImpacts:0, expertForwardPivotImpactMisses:0, allExordiumPivotsTracked:0, allExordiumPivotImpacts:0, allExordiumPivotImpactMisses:0,
    contextDurationMsTotal:0, moduleDurationMsTotal:0, totalDurationMsTotal:0,
    decisionCount:0, decisionRecordsTotal:0, decisionRecordsStored:0, decisionRecordsDropped:0,
    candidateAudits:0, candidateAuditsTotal:0, candidateAuditsStored:0, candidateAuditsDropped:0,
    candidateAuditCountByScanner:{ relay:0, clearOccupyFortify:0, forwardPivot:0, varranAssault:0 },
    auditRecords:0, auditRecordsTotal:0, auditRecordsStored:0, auditRecordsDropped:0,
    auditItemsTotal:0, auditItemsStored:0, auditItemsDropped:0,
    auditContainersTotal:0, auditContainersStored:0, auditContainersDropped:0,
    candidateRejectionCounts:{}, relayCandidateRejectionCounts:{}, clearCandidateRejectionCounts:{}, forwardPivotCandidateRejectionCounts:{}, varranCandidateRejectionCounts:{}
  }]);
  return {
    schemaVersion:MATCH_TELEMETRY_EXPERT_SCHEMA_VERSION,
    doctrineSchemaVersion:MATCH_TELEMETRY_EXPERT_DOCTRINE_SCHEMA_VERSION,
    enabled:Boolean(state && state.aiMode === "expert"),
    strategyCommonContract:[
      "adaptive_enemy_proximity",
      "hq_structure_protection",
      "structures_on_strategic_points",
      "hq_cell_occupation_risk"
    ],
    architecture:{
      factionModules:["Nexus","Exordium","Liberti","Agathoi","Fabeot"],
      singleFactionRouter:true,
      advancedFallback:"F9T0",
      recursiveSearch:false,
      turnScopedCache:true,
      activeFactionDoctrines:{ Exordium:"F9T2D3-EXORDIUM-1" },
      telemetrySemantics:{
        decisionsRecorded:"stored decision records (legacy compatibility)",
        auditRecords:"stored audit containers",
        auditItems:"atomic audit evaluations"
      }
    },
    totals:{
      turnsStarted:0, turnsCompleted:0, contextsCreated:0, modulesRouted:0, fallbacks:0,
      budgetExhaustions:0, microplansSelected:0, microplanSteps:0, microplansCompleted:0,
      microplansAborted:0, decisionsRecorded:0
    },
    modules:Object.fromEntries(moduleEntries),
    turns:[],
    diagnostics:[]
  };
}

function telemetryEnsureExpertAiF9T1() {
  const telemetry = ensureMatchTelemetry();
  if (!telemetry) return null;
  if (!telemetry.expertAi || telemetry.expertAi.schemaVersion !== MATCH_TELEMETRY_EXPERT_SCHEMA_VERSION) {
    telemetry.expertAi = telemetryEmptyExpertAiF9T1();
  }
  return telemetry.expertAi;
}

function telemetryExpertTurnF9T1(side, sequence, create=false) {
  const expert = telemetryEnsureExpertAiF9T1();
  if (!expert) return null;
  const numericSide = Number(side);
  const numericSequence = Number(sequence);
  let turn = expert.turns.find(entry => Number(entry.side) === numericSide && Number(entry.sequence) === numericSequence) || null;
  if (!turn && create) {
    turn = {
      side:numericSide,
      sequence:numericSequence,
      round:Number(state && state.turn || 0),
      faction:String(state && state.factions && state.factions[numericSide] || ""),
      moduleId:null,
      status:"started",
      context:null,
      fallback:null,
      plan:null,
      planSteps:[],
      decisions:[],
      auditRecords:[],
      candidateAudits:[],
      candidateAuditsTotal:0,
      candidateAuditsStored:0,
      candidateAuditsDropped:0,
      candidateAuditCountByScanner:{ relay:0, clearOccupyFortify:0, forwardPivot:0, varranAssault:0 },
      decisionLimitReached:false,
      decisionRecordsTotal:0,
      decisionRecordsStored:0,
      decisionRecordsDropped:0,
      auditRecordTotal:0,
      auditRecordsStored:0,
      auditRecordsDropped:0,
      auditItemsTotal:0,
      auditItemsStored:0,
      auditItemsDropped:0,
      auditContainersTotal:0,
      auditContainersStored:0,
      auditContainersDropped:0,
      decisionReconciliationOk:true,
      decisionStoredArrayDelta:0,
      decisionTotalDelta:0,
      finalized:false,
      candidateRejectionCounts:{},
      candidateRejectionCountsByScanner:{ relay:{}, clearOccupyFortify:{}, forwardPivot:{}, varranAssault:{} },
      territorialConversionMetrics:{ psClearedDuringExpertPlan:0, psClearedDirectlyByExpertStep:0, psOccupiedAfterClear:0, psFortifiedAfterClear:0 },
      budgetExhaustions:[],
      performance:{ contextDurationMs:0, moduleDurationMs:0, totalDurationMs:0, heapStart:null, heapEnd:null, heapDelta:null }
    };
    expert.turns.push(turn);
    if (expert.turns.length > 300) expert.turns.shift();
  }
  return turn;
}

function telemetryExpertModuleBucketF9T1(faction) {
  const expert = telemetryEnsureExpertAiF9T1();
  if (!expert) return null;
  const key = String(faction || "");
  if (!expert.modules[key]) expert.modules[key] = {
    turnsRouted:0, fallbacks:0, microplansSelected:0, microplansCompleted:0, microplansAborted:0, microplanSteps:0,
    bastionRelayPlans:0, clearOccupyFortifyPlans:0, forwardPivotPlans:0, varranAssaultPlans:0,
    varranAssaultScans:0, varranAssaultOrdersCommitted:0, varranAssaultTargetsReassigned:0, varranAssaultsExecuted:0, varranStationaryAssaultsExecuted:0, varranAttackOwnershipRecognized:0, varranPredictedBonusEffectiveDamage:0, varranActualBonusEffectiveDamage:0, varranImmediateKillsPredicted:0, varranImmediateKillsAchieved:0, varranBonusEnabledKills:0,
    commanderDeploymentCommitments:0, commanderDeploymentCommitmentsExecuted:0, commanderDeploymentDeferred:0, commanderDeploymentDeferredReasons:{}, commanderDeploymentAttempts:0, commanderDeploymentDeadlineMisses:0, commanderEnergyReserved:0, commanderPlayableRoundsBeforeDeployment:0, commanderCommitmentCreatedRound:null, commanderDeploymentDeadlineRound:null, commanderActualDeploymentRound:null,
    bastionsBuiltOnPs:0, expertBastionsBuiltOnPs:0, fallbackBastionsBuiltOnPs:0, totalBastionsBuiltOnPs:0,
    mobileGuardsReleased:0, psCleared:0, psOccupiedAfterClear:0, psFortifiedAfterClear:0,
    expertPsCleared:0, expertPsOccupiedAfterClear:0, expertPsFortifiedAfterClear:0,
    psClearedDuringExpertPlan:0, psClearedDirectlyByExpertStep:0,
    relaySurvivalChecks:0, relayRebuildsRejected:0, forwardPivotsDeployed:0, forwardPivotImpacts:0, forwardPivotImpactMisses:0, forwardPivotLateImpacts:0, expertForwardPivotsDeployed:0, expertForwardPivotImpacts:0, expertForwardPivotImpactMisses:0, allExordiumPivotsTracked:0, allExordiumPivotImpacts:0, allExordiumPivotImpactMisses:0,
    contextDurationMsTotal:0, moduleDurationMsTotal:0, totalDurationMsTotal:0,
    decisionCount:0, decisionRecordsTotal:0, decisionRecordsStored:0, decisionRecordsDropped:0,
    candidateAudits:0, candidateAuditsTotal:0, candidateAuditsStored:0, candidateAuditsDropped:0,
    candidateAuditCountByScanner:{ relay:0, clearOccupyFortify:0, forwardPivot:0, varranAssault:0 },
    auditRecords:0, auditRecordsTotal:0, auditRecordsStored:0, auditRecordsDropped:0,
    auditItemsTotal:0, auditItemsStored:0, auditItemsDropped:0,
    auditContainersTotal:0, auditContainersStored:0, auditContainersDropped:0,
    candidateRejectionCounts:{}, relayCandidateRejectionCounts:{}, clearCandidateRejectionCounts:{}, forwardPivotCandidateRejectionCounts:{}, varranCandidateRejectionCounts:{}
  };
  return expert.modules[key];
}

function telemetryRecordExpertDecisionF9T1(side, sequence, record) {
  const expert = telemetryEnsureExpertAiF9T1();
  const turn = telemetryExpertTurnF9T1(side, sequence, true);
  if (!expert || !turn || !record) return null;
  if (turn.finalized || turn.status === "completed") {
    const diagnostic = {
      kind:"late_decision_for_finalized_turn",
      side:Number(side),
      sequence:Number(sequence),
      round:Number(state && state.turn || 0),
      recordKind:String(record.kind || ""),
      recordedAt:telemetryNowIso()
    };
    expert.diagnostics.push(diagnostic);
    if (expert.diagnostics.length > 200) expert.diagnostics.shift();
    if (typeof console !== "undefined" && console.warn) console.warn("F9T2c3a: decisione Expert rifiutata su turno già finalizzato", diagnostic);
    return turn;
  }
  const recordKind = String(record.kind || "");
  const isCandidateAuditBatch = ["bastion_relay_candidate_audit_batch", "territorial_conversion_candidate_audit_batch", "forward_pivot_candidate_audit_batch", "varran_assault_candidate_audit_batch"].includes(recordKind);
  const isAuditRecord = Boolean(record.auditRecord) || isCandidateAuditBatch || ["relay_survival_assessment_batch", "bastion_ps_build_gate"].includes(recordKind);
  const rawCandidateAudits = isCandidateAuditBatch && Array.isArray(record.audits) ? record.audits : [];
  const aggregateRejectionCounts = isCandidateAuditBatch && record.rejectionCounts && typeof record.rejectionCounts === "object" ? record.rejectionCounts : null;
  const aggregateAuditTotal = isCandidateAuditBatch ? Math.max(rawCandidateAudits.length, telemetryNumber(record.auditTotal, rawCandidateAudits.length)) : telemetryNumber(record.auditTotal, 1);
  const scanner = String(record.scanner || (recordKind === "bastion_relay_candidate_audit_batch" ? "relay" : (recordKind === "territorial_conversion_candidate_audit_batch" ? "clearOccupyFortify" : (recordKind === "forward_pivot_candidate_audit_batch" ? "forwardPivot" : (recordKind === "varran_assault_candidate_audit_batch" ? "varranAssault" : "")))));
  const module = telemetryExpertModuleBucketF9T1(turn.faction);

  if (isAuditRecord) {
    const auditItemsTotal = Math.max(0, telemetryNumber(record.auditItemsTotal, aggregateAuditTotal));
    const auditItemsStored = Math.max(0, Math.min(auditItemsTotal, telemetryNumber(record.auditItemsStored, isCandidateAuditBatch ? rawCandidateAudits.length : auditItemsTotal)));
    const auditItemsDropped = Math.max(0, telemetryNumber(record.auditItemsDropped, auditItemsTotal - auditItemsStored));
    const auditPayload = isCandidateAuditBatch ? { ...record, audits:rawCandidateAudits.slice(0, 12), auditTotal:aggregateAuditTotal } : record;
    turn.auditItemsTotal += auditItemsTotal;
    turn.auditItemsStored += auditItemsStored;
    turn.auditItemsDropped += auditItemsDropped;
    turn.auditContainersTotal += 1;
    if (turn.auditRecords.length < 24) turn.auditRecords.push(telemetryClone(auditPayload));
    else turn.auditContainersDropped += 1;
    turn.auditContainersStored = turn.auditRecords.length;
    turn.auditRecordsTotal = turn.auditContainersTotal;
    turn.auditRecordsStored = turn.auditContainersStored;
    turn.auditRecordsDropped = turn.auditContainersDropped;
    turn.auditRecordTotal = turn.auditItemsTotal;
  } else {
    if (turn.decisions.length < 24) turn.decisions.push(telemetryClone(record));
    else {
      turn.decisionLimitReached = true;
      turn.decisionRecordsDropped += 1;
      return turn;
    }
    expert.totals.decisionsRecorded += 1;
    if (module) module.decisionCount += 1;
  }

  const candidateAudits = isCandidateAuditBatch ? rawCandidateAudits : (recordKind === "bastion_relay_candidate_audit" ? [record] : []);
  const candidateStoredBefore = turn.candidateAudits.length;
  for (const audit of candidateAudits) {
    if (!audit || typeof audit !== "object") continue;
    if (turn.candidateAudits.length < 12) turn.candidateAudits.push(telemetryClone(audit));
  }
  if (isCandidateAuditBatch) {
    turn.candidateAuditsTotal = telemetryNumber(turn.candidateAuditsTotal, 0) + aggregateAuditTotal;
    turn.candidateAuditsStored = turn.candidateAudits.length;
    turn.candidateAuditsDropped = Math.max(0, turn.candidateAuditsTotal - turn.candidateAuditsStored);
    if (scanner && turn.candidateAuditCountByScanner) turn.candidateAuditCountByScanner[scanner] = telemetryNumber(turn.candidateAuditCountByScanner[scanner], 0) + aggregateAuditTotal;
  }
  if (aggregateRejectionCounts) {
    for (const [reasonKey, countValue] of Object.entries(aggregateRejectionCounts)) {
      const reason = String(reasonKey || "valid_candidate");
      const count = telemetryNumber(countValue, 0);
      turn.candidateRejectionCounts[reason] = telemetryNumber(turn.candidateRejectionCounts[reason], 0) + count;
      if (scanner && turn.candidateRejectionCountsByScanner && turn.candidateRejectionCountsByScanner[scanner]) {
        turn.candidateRejectionCountsByScanner[scanner][reason] = telemetryNumber(turn.candidateRejectionCountsByScanner[scanner][reason], 0) + count;
      }
    }
  } else {
    for (const audit of candidateAudits) {
      if (!audit || typeof audit !== "object") continue;
      const reason = String(audit.rejectionReason || "valid_candidate");
      turn.candidateRejectionCounts[reason] = telemetryNumber(turn.candidateRejectionCounts[reason], 0) + 1;
    }
  }
  if (["forward_pivot_impact", "forward_pivot_late_impact", "forward_pivot_impact_window_missed", "forward_pivot_destroyed_before_impact"].includes(recordKind) && record.unitId) {
    const pivotInstance = telemetryPivotInstanceByUnitId(side, record.unitId);
    if (pivotInstance) {
      pivotInstance.deploymentSource = String(record.deploymentSource || pivotInstance.deploymentSource || pivotInstance.spawnSource || "unknown");
      pivotInstance.firstImpactRound = record.firstActualImpactRound == null ? (record.firstImpactRound == null ? null : telemetryNumber(record.firstImpactRound, null)) : telemetryNumber(record.firstActualImpactRound, null);
      pivotInstance.roundsToFirstImpact = record.roundsToFirstActualImpact == null ? (record.roundsToFirstImpact == null ? null : telemetryNumber(record.roundsToFirstImpact, null)) : telemetryNumber(record.roundsToFirstActualImpact, null);
      pivotInstance.firstActualImpactRound = record.firstActualImpactRound == null ? pivotInstance.firstImpactRound : telemetryNumber(record.firstActualImpactRound, null);
      pivotInstance.roundsToFirstActualImpact = record.roundsToFirstActualImpact == null ? pivotInstance.roundsToFirstImpact : telemetryNumber(record.roundsToFirstActualImpact, null);
      pivotInstance.impactDeadlineRound = record.impactDeadlineRound == null ? pivotInstance.impactDeadlineRound || null : telemetryNumber(record.impactDeadlineRound, null);
      pivotInstance.impactWithinDeadline = record.impactWithinDeadline == null ? pivotInstance.impactWithinDeadline ?? null : Boolean(record.impactWithinDeadline);
      pivotInstance.impactType = record.firstActualImpactType || record.impactType || (record.impact && record.impact.kind) || null;
      pivotInstance.impactMiss = Boolean(record.impactMiss || recordKind === "forward_pivot_impact_window_missed");
    }
  }
  if (module) {
    if (recordKind === "relay_survival_assessment_batch") {
      const assessments = Array.isArray(record.assessments) ? record.assessments : [];
      module.relaySurvivalChecks += telemetryNumber(record.assessmentTotal, assessments.length);
      module.relayRebuildsRejected += assessments.filter(item => item && item.candidateAccepted === false).length;
    }
    if (recordKind === "forward_pivot_impact") { module.forwardPivotImpacts += 1; module.allExordiumPivotImpacts += 1; if (String(record.deploymentSource || "") === "expert_forward_plan") module.expertForwardPivotImpacts += 1; }
    if (recordKind === "forward_pivot_late_impact") { module.forwardPivotLateImpacts += 1; module.allExordiumPivotImpacts += 1; }
    if (["forward_pivot_impact_window_missed","forward_pivot_destroyed_before_impact"].includes(recordKind)) { module.forwardPivotImpactMisses += 1; module.allExordiumPivotImpactMisses += 1; if (String(record.deploymentSource || "") === "expert_forward_plan") module.expertForwardPivotImpactMisses += 1; }
    if (recordKind === "varran_assault_scan") module.varranAssaultScans += 1;
    if (recordKind === "varran_assault_order_committed") module.varranAssaultOrdersCommitted += 1;
    if (recordKind === "varran_assault_target_reassigned") module.varranAssaultTargetsReassigned += 1;
    if (recordKind === "varran_assault_executed") { module.varranAssaultsExecuted += 1; if (record.stationaryAttackBranch) module.varranStationaryAssaultsExecuted += 1; if (record.attackExecutionRecognized) module.varranAttackOwnershipRecognized += 1; module.varranPredictedBonusEffectiveDamage += telemetryNumber(record.predictedBonusEffectiveDamage, 0); module.varranActualBonusEffectiveDamage += telemetryNumber(record.actualBonusEffectiveDamage, 0); if (record.immediateKillPredicted) module.varranImmediateKillsPredicted += 1; if (record.immediateKillAchieved) module.varranImmediateKillsAchieved += 1; if (record.bonusEnabledKill) module.varranBonusEnabledKills += 1; }
    if (recordKind === "commander_deployment_commitment_created") { module.commanderDeploymentCommitments += 1; module.commanderCommitmentCreatedRound = record.commitmentCreatedRound == null ? module.commanderCommitmentCreatedRound : telemetryNumber(record.commitmentCreatedRound, null); module.commanderDeploymentDeadlineRound = record.deploymentDeadlineRound == null ? module.commanderDeploymentDeadlineRound : telemetryNumber(record.deploymentDeadlineRound, null); }
    if (recordKind === "commander_deployment_energy_reserved") module.commanderEnergyReserved = Math.max(telemetryNumber(module.commanderEnergyReserved, 0), telemetryNumber(record.reservedEnergy, 0));
    if (recordKind === "commander_deployment_attempted") module.commanderDeploymentAttempts += 1;
    if (recordKind === "commander_deployment_deferred") { module.commanderDeploymentDeferred += 1; const reason=String(record.reason || "deferred"); module.commanderDeploymentDeferredReasons[reason] = telemetryNumber(module.commanderDeploymentDeferredReasons[reason], 0) + 1; module.commanderDeploymentDeadlineRound = record.deploymentDeadlineRound == null ? module.commanderDeploymentDeadlineRound : telemetryNumber(record.deploymentDeadlineRound, null); }
    if (recordKind === "commander_deployment_deadline_missed") module.commanderDeploymentDeadlineMisses += 1;
    if (recordKind === "commander_deployment_executed") { module.commanderDeploymentCommitmentsExecuted += 1; module.commanderActualDeploymentRound = telemetryNumber(record.commanderActualDeploymentRound, module.commanderActualDeploymentRound); module.commanderPlayableRoundsBeforeDeployment = telemetryNumber(record.commanderPlayableRoundsBeforeDeployment, module.commanderPlayableRoundsBeforeDeployment); module.commanderDeploymentDeadlineRound = telemetryNumber(record.deploymentDeadlineRound, module.commanderDeploymentDeadlineRound); }
  }
  return turn;
}

function initializeMatchTelemetry() {
  if (!state) return null;
  const playerIds = telemetryPlayerIds();
  const build = typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : { version: typeof currentBuildVersionLabel === "function" ? currentBuildVersionLabel() : "unknown" };
  state.matchTelemetry = {
    schemaVersion: MATCH_TELEMETRY_SCHEMA_VERSION,
    kind: "arena-rubra-match-telemetry",
    status: "active",
    matchId: state.matchId || "",
    startedAt: telemetryNowIso(),
    updatedAt: telemetryNowIso(),
    endedAt: null,
    durationMs: null,
    build,
    metricAuthority: {
      psControl:"players[*].field.ps* + timelines.psControl",
      pivots:"players[*].field.pivotInstances (campi pivot* aggregati per compatibilità)",
      cards:"players[*].cards e cards.byCard; i contatori F9F sono riepiloghi eventi ausiliari",
      overdraw:"CARD_DISCARDED reason=overdraw; CARD_STOLEN destination=discard per furti a mano piena"
    },
    rng: {
      seed: String(state.matchSeed || ""),
      algorithm: MATCH_TELEMETRY_RNG_ALGORITHM,
      calls: telemetryNumber(state.matchRngCalls, 0),
      state: telemetryNumber(state.matchRngState, 0),
      replayable: true
    },
    setup: {
      mapId: state.mapId || "",
      mapName: state.mapDefinition ? state.mapDefinition.name : "",
      mapRevision: state.mapDefinition && state.mapDefinition.metadata ? state.mapDefinition.metadata.revision : null,
      mapSchemaVersion: state.mapDefinition ? state.mapDefinition.schemaVersion : null,
      mapCellCount: Array.isArray(state.cells) ? state.cells.length : 0,
      movementMultiplier: state.mapDefinition ? state.mapDefinition.movementMultiplier : 1,
      terrainUsage: state.mapRuntime ? telemetryClone(state.mapRuntime.terrainUsage) : {},
      playerIds:[...playerIds],
      playerCount:playerIds.length,
      firstPlayer: state.currentPlayer || null,
      turnOrder:Array.isArray(state.turnOrder) ? [...state.turnOrder] : [...playerIds],
      pacePreset: state.pacePreset || "",
      gameScaleMode: state.gameScaleMode || "",
      aiMode: state.aiMode || "",
      tutorialMode: state.tutorialMode === true,
      mapLabMode: state.mapLabMode === true
    },
    players: Object.fromEntries(playerIds.map(side => [side, telemetryEmptyPlayer(side)])),
    totals: {
      events:0, turns:0, cardsDrawn:0, cardsPlayed:0, energyGained:0, energySpent:0, damage:0,
      unitsDeployed:0, structuresBuilt:0, missionsPlayed:0, missionRewardsResolved:0, pressureIncrements:0
    },
    timelines: { turns:[], economy:[], cards:[], psControl:[], pivots:[], missions:[], victory:[] },
    expertAi: telemetryEmptyExpertAiF9T1(),
    final: null,
    diagnostics: { warnings:[], unsupportedEvents:{}, turnReadyHooks:0 }
  };
  state.matchTelemetryRuntime = {
    startedPerf: telemetryPerfNow(),
    activeTurns:{},
    turnPerfStart:{},
    lastKnownEnergy:Object.fromEntries(playerIds.map(side => [side, telemetryNumber(state.energy && state.energy[side], 0)]))
  };
  return state.matchTelemetry;
}

function ensureMatchTelemetry() {
  if (!state) return null;
  return state.matchTelemetry || initializeMatchTelemetry();
}

function telemetryPlayer(side) {
  const telemetry = ensureMatchTelemetry();
  if (!telemetry) return null;
  const key = telemetryValidSide(side);
  if (!key) return null;
  if (!telemetry.players[key]) telemetry.players[key] = telemetryEmptyPlayer(key);
  return telemetry.players[key];
}

function telemetryCardBucket(side, cardOrData) {
  const player = telemetryPlayer(side);
  if (!player) return null;
  const key = telemetryCardKey(cardOrData);
  if (!player.cards.byCard[key]) player.cards.byCard[key] = { id:key, name:telemetryCardName(cardOrData), ...telemetryEmptyCardCounters() };
  return player.cards.byCard[key];
}

function telemetryUnitById(unitId) {
  if (!state || !Array.isArray(state.units) || !unitId) return null;
  return state.units.find(unit => unit && String(unit.uid) === String(unitId)) || null;
}

function telemetryPivotInstanceByUnitId(side, unitId) {
  const player = telemetryPlayer(side);
  if (!player || !unitId || !Array.isArray(player.field.pivotInstances)) return null;
  return player.field.pivotInstances.find(instance => instance && String(instance.unitId) === String(unitId)) || null;
}

function telemetryRefreshPivotAggregates(player, roundForActive=null) {
  if (!player || !player.field) return null;
  const instances = Array.isArray(player.field.pivotInstances) ? player.field.pivotInstances : [];
  const activeRound = roundForActive == null ? null : telemetryNumber(roundForActive, 0);
  player.field.pivotInstanceCount = instances.length;
  player.field.pivotDestroyedCount = instances.filter(instance => instance.destroyedRound != null).length;
  player.field.pivotActiveCount = instances.filter(instance => instance.destroyedRound == null).length;
  player.field.pivotDeployedRound = instances.length ? Math.min(...instances.map(instance => telemetryNumber(instance.deployedRound, 0))) : null;
  const destroyedRounds = instances.filter(instance => instance.destroyedRound != null).map(instance => telemetryNumber(instance.destroyedRound, 0));
  player.field.pivotDestroyedRound = destroyedRounds.length ? Math.max(...destroyedRounds) : null;
  player.field.pivotAttacks = instances.reduce((sum, instance) => sum + telemetryNumber(instance.attacks, 0), 0);
  player.field.pivotAbilitiesUsed = instances.reduce((sum, instance) => sum + telemetryNumber(instance.abilitiesUsed, 0), 0);
  player.field.pivotDamageDealt = instances.reduce((sum, instance) => sum + telemetryNumber(instance.damageDealt, 0), 0);
  for (const instance of instances) {
    if (instance.survivalRounds != null) instance.currentSurvivalRounds = telemetryNumber(instance.survivalRounds, 0);
    else if (activeRound != null && instance.deployedRound != null) instance.currentSurvivalRounds = Math.max(0, activeRound - telemetryNumber(instance.deployedRound, activeRound) + 1);
    else instance.currentSurvivalRounds = 0;
  }
  player.field.pivotSurvivalRounds = instances.length ? instances.reduce((sum, instance) => sum + telemetryNumber(instance.currentSurvivalRounds, 0), 0) : null;
  return player.field;
}

function telemetryIsPivotBlueprintF9T2c1(blueprintId, unit = null) {
  const id = String(blueprintId || "");
  if (unit && (String(unit.weight || "").toLowerCase() === "pivot" || String(unit.deckRole || "").toLowerCase() === "pivot")) return true;
  const bp = typeof BLUEPRINTS !== "undefined" && Array.isArray(BLUEPRINTS) ? BLUEPRINTS.find(item => item && String(item.id) === id) : null;
  if (bp && (String(bp.weight || "").toLowerCase() === "pivot" || String(bp.deckRole || "").toLowerCase() === "pivot")) return true;
  if (state && state.matchTelemetry && state.matchTelemetry.players) {
    for (const player of Object.values(state.matchTelemetry.players)) if (player && player.deck && String(player.deck.pivotId || "") === id) return true;
  }
  if (state) {
    for (const zoneName of ["hand", "deck", "discard"]) {
      const zone = state[zoneName];
      if (!zone || typeof zone !== "object") continue;
      for (const cards of Object.values(zone)) {
        if (!Array.isArray(cards)) continue;
        if (cards.some(card => card && String(card.blueprintId || card.id || "") === id && (String(card.deckRole || "").toLowerCase() === "pivot" || String(card.cardType || "").toLowerCase() === "pivot"))) return true;
      }
    }
  }
  return false;
}

function telemetryNormalizeSpawnSourceF9T2c1(value) {
  const source = String(value || "unknown");
  if (source === "starter") return "starter_roster";
  if (source === "deck_or_market") return "unknown_legacy";
  return source;
}

function telemetryRegisterPivotInstance(side, data={}, cost=0) {
  const player = telemetryPlayer(side);
  if (!player) return null;
  const unit = telemetryUnitById(data.unitId);
  const blueprintId = String(data.blueprintId || (unit && unit.blueprintId) || (unit && unit.id) || "");
  if (!telemetryIsPivotBlueprintF9T2c1(blueprintId, unit)) return null;
  const unitId = data.unitId || (unit && unit.uid) || `${blueprintId}@${telemetryNumber(state && state.turn, 0)}@${player.field.pivotInstances.length + 1}`;
  let instance = telemetryPivotInstanceByUnitId(side, unitId);
  if (instance) return instance;
  instance = {
    unitId:String(unitId),
    instanceNo:data.instanceNo != null ? telemetryNumber(data.instanceNo, null) : (unit && unit.instanceNo != null ? telemetryNumber(unit.instanceNo, null) : null),
    pivotId:blueprintId,
    pivotName:data.unitName || (unit && unit.name) || (player.deck && blueprintId === player.deck.pivotId ? player.deck.pivotName : ""),
    deployedRound:telemetryNumber(data.round, state && state.turn),
    destroyedRound:null,
    survivalRounds:null,
    currentSurvivalRounds:0,
    status:"active",
    cost:Math.max(0, telemetryNumber(cost, 0)),
    spawnSource:telemetryNormalizeSpawnSourceF9T2c1(data.spawnSource || data.source || "unknown"),
    attacks:0,
    abilitiesUsed:0,
    damageDealt:0,
    deploymentSource:telemetryNormalizeSpawnSourceF9T2c1(data.spawnSource || data.source || "unknown"),
    firstImpactRound:null,
    roundsToFirstImpact:null,
    impactType:null,
    impactMiss:false,
    killerSide:null,
    destructionSource:""
  };
  player.field.pivotInstances.push(instance);
  player.field.allPivotInstances = player.field.pivotInstances;
  if (String(state && state.factions && state.factions[side] || "") === "Exordium") {
    const module = telemetryExpertModuleBucketF9T1("Exordium");
    if (module) module.allExordiumPivotsTracked += 1;
  }
  if (player.deck && blueprintId === String(player.deck.pivotId || "")) player.field.deckPivotInstances.push(instance);
  else if (instance.spawnSource === "market") player.field.marketPivotInstances.push(instance);
  else player.field.rosterPivotInstances.push(instance);
  telemetryRefreshPivotAggregates(player);
  return instance;
}

function telemetryPivotInstanceFromEvent(side, data={}, unitKeys=[]) {
  const player = telemetryPlayer(side);
  if (!player) return null;
  for (const key of unitKeys) {
    if (!data || !data[key]) continue;
    const found = telemetryPivotInstanceByUnitId(side, data[key]);
    if (found) return found;
  }
  const unitId = unitKeys.map(key => data && data[key]).find(Boolean);
  const unit = telemetryUnitById(unitId);
  if (unit && telemetryIsPivotBlueprintF9T2c1(unit.blueprintId || unit.id || "", unit)) {
    return telemetryRegisterPivotInstance(side, {
      unitId:unit.uid,
      unitName:unit.name,
      blueprintId:unit.blueprintId || unit.id,
      instanceNo:unit.instanceNo,
      round:state && state.turn,
      spawnSource:"telemetry_recovered"
    }, 0);
  }
  const blueprintCandidates = [data.blueprintId, data.unitBlueprintId, data.attackerBlueprintId, data.sourceBlueprintId].filter(Boolean).map(String);
  const pivotBlueprintId = blueprintCandidates.find(id => telemetryIsPivotBlueprintF9T2c1(id, null));
  if (pivotBlueprintId) {
    const activeInstances = (player.field.pivotInstances || []).filter(instance => instance && instance.destroyedRound == null);
    if (activeInstances.length) return activeInstances[activeInstances.length - 1];
    return telemetryRegisterPivotInstance(side, {
      ...data,
      unitId:unitId || `${pivotBlueprintId}@${telemetryNumber(state && state.turn, 0)}@recovered-${player.field.pivotInstances.length + 1}`,
      blueprintId:pivotBlueprintId,
      round:state && state.turn,
      spawnSource:"telemetry_recovered"
    }, 0);
  }
  return null;
}

function telemetryUnitCardPlayability(side, card) {
  const bp = typeof blueprintForHandCard === "function" ? blueprintForHandCard(card, side) : null;
  if (!bp) return { ok:false, reason:"blueprint_missing" };
  if (typeof playerHandLocked === "function" && playerHandLocked(side)) return { ok:false, reason:"hand_locked" };
  if (typeof handCardBlocked === "function" && handCardBlocked(card)) return { ok:false, reason:"card_blocked" };
  if (typeof purchaseLimitReached === "function" && purchaseLimitReached(side, bp)) return { ok:false, reason:"field_cap" };
  const cost = typeof effectiveHandUnitCardCost === "function" ? effectiveHandUnitCardCost(side, card, bp) : telemetryNumber(card.cost, 0);
  if (telemetryNumber(state.energy && state.energy[side], 0) < cost) return { ok:false, reason:"energy" };
  if (bp.type === "Struttura") {
    const builders = typeof combatUnits === "function" ? combatUnits(side).filter(unit => unit && typeof canBuildStructures === "function" && canBuildStructures(unit) && !unit.acted) : [];
    const unitBuildReady = builders.some(builder => typeof buildableCells === "function" && buildableCells(builder).length > 0);
    const hqBuildReady = typeof canBuildFromOwnHq === "function" && canBuildFromOwnHq(side, bp);
    return unitBuildReady || hqBuildReady ? { ok:true, cost } : { ok:false, reason:"no_build_cell" };
  }
  const cells = typeof spawnCellsFor === "function" ? spawnCellsFor(side, bp) : [];
  return cells.length ? { ok:true, cost } : { ok:false, reason:"no_spawn_cell" };
}

function telemetryHandCardPlayability(side, card) {
  if (!card) return { ok:false, reason:"missing" };
  if (card.sourceType === "mission") {
    const check = typeof missionUiPlayCheck === "function" ? missionUiPlayCheck(side, card, { allowBot:true, evaluate:true, source:"F9Q3e1-turn-ready" }) : { ok:false, reason:"mission_runtime_missing" };
    return { ok:Boolean(check && check.ok), reason:check && check.reason ? check.reason : "" };
  }
  if (card.sourceType === "tactic") {
    const check = typeof canUseHandTacticCard === "function" ? canUseHandTacticCard(side, card) : { ok:false, reason:"tactic_runtime_missing" };
    return { ok:Boolean(check && check.ok), reason:check && check.reason ? check.reason : "" };
  }
  if (typeof isPlayableUnitHandCard === "function" && isPlayableUnitHandCard(card)) return telemetryUnitCardPlayability(side, card);
  return { ok:false, reason:"not_playable_type" };
}

function telemetryTurnReady(side) {
  const telemetry = ensureMatchTelemetry();
  if (!telemetry || telemetry.status !== "active") return null;
  const player = telemetryPlayer(side);
  const runtime = state.matchTelemetryRuntime || (state.matchTelemetryRuntime = { activeTurns:{}, turnPerfStart:{}, lastKnownEnergy:{} });
  const hand = state.hand && state.hand[side] ? state.hand[side] : [];
  const evaluated = hand.map(card => ({
    id:telemetryCardKey(card), name:telemetryCardName(card), sourceType:card.sourceType || "", cost:telemetryNumber(card.cost, 0),
    ...telemetryHandCardPlayability(side, card)
  }));
  const playable = evaluated.filter(item => item.ok);
  const turn = {
    round:telemetryNumber(state.turn, 0), side:Number(side), startedAt:telemetryNowIso(), readyEnergy:telemetryNumber(state.energy && state.energy[side], 0),
    readyHandSize:hand.length, readyDeckSize:state.deck && state.deck[side] ? state.deck[side].length : 0,
    playableCardCount:playable.length, playableCards:playable.map(item => ({ id:item.id, name:item.name, sourceType:item.sourceType, cost:item.cost })),
    blockedReasons:evaluated.filter(item => !item.ok).reduce((out, item) => { out[item.reason || "unknown"] = (out[item.reason || "unknown"] || 0) + 1; return out; }, {}),
    cardsPlayed:0, unitsDeployed:0, structuresBuilt:0, tacticsUsed:0, abilitiesUsed:0, attacks:0, moves:0,
    energyGained:0, energySpent:0, damageDealt:0, endedAt:null, durationMs:null, endEnergy:null,
    noCardPlayed:false, deadHand:false, playableButUnused:false
  };
  runtime.activeTurns[side] = turn;
  runtime.turnPerfStart[side] = telemetryPerfNow();
  player.cards.maxHandSize = Math.max(player.cards.maxHandSize, hand.length);
  player.cards.handSizeSumAtTurnReady += hand.length;
  player.cards.turnReadySamples += 1;
  telemetry.diagnostics.turnReadyHooks += 1;
  telemetry.updatedAt = telemetryNowIso();
  return turn;
}

function telemetryActiveTurn(side) {
  return state && state.matchTelemetryRuntime && state.matchTelemetryRuntime.activeTurns ? state.matchTelemetryRuntime.activeTurns[side] || null : null;
}

function telemetryFinishTurn(side, options={}) {
  const telemetry = ensureMatchTelemetry();
  const player = telemetryPlayer(side);
  const runtime = state && state.matchTelemetryRuntime;
  const turn = telemetryActiveTurn(side);
  if (!telemetry || !player || !runtime || !turn || turn.endedAt) return turn;
  turn.endedAt = telemetryNowIso();
  turn.durationMs = Math.max(0, Math.round(telemetryPerfNow() - telemetryNumber(runtime.turnPerfStart[side], telemetryPerfNow())));
  turn.endEnergy = telemetryNumber(state.energy && state.energy[side], 0);
  turn.endHandSize = state.hand && state.hand[side] ? state.hand[side].length : 0;
  turn.endDeckSize = state.deck && state.deck[side] ? state.deck[side].length : 0;
  turn.interrupted = Boolean(options.interrupted);
  turn.noCardPlayed = turn.cardsPlayed === 0;
  turn.deadHand = turn.cardsPlayed === 0 && turn.readyHandSize > 0 && turn.playableCardCount === 0;
  turn.playableButUnused = turn.cardsPlayed === 0 && turn.playableCardCount > 0;
  player.cards.noCardPlayedTurns += turn.noCardPlayed ? 1 : 0;
  player.cards.deadHandTurns += turn.deadHand ? 1 : 0;
  player.cards.playableButUnusedTurns += turn.playableButUnused ? 1 : 0;
  player.economy.unusedAtTurnEndTotal += turn.endEnergy;
  player.economy.turnsMeasured += 1;
  player.economy.unusedAtTurnEndAverage = Number((player.economy.unusedAtTurnEndTotal / player.economy.turnsMeasured).toFixed(3));
  player.performance.turnDurationMsTotal += turn.durationMs;
  player.performance.turnDurationMsMax = Math.max(player.performance.turnDurationMsMax, turn.durationMs);
  player.performance.turnsMeasured += 1;
  player.performance.turnDurationMsAverage = Math.round(player.performance.turnDurationMsTotal / player.performance.turnsMeasured);
  player.turns.push(telemetryClone(turn));
  telemetry.timelines.turns.push({ ...telemetryClone(turn), faction:player.faction, mode:player.mode });
  telemetry.totals.turns += 1;
  delete runtime.activeTurns[side];
  delete runtime.turnPerfStart[side];
  telemetry.updatedAt = telemetryNowIso();
  return turn;
}

function telemetryClassifyEconomy(data) {
  const source = String(data.source || "").toLowerCase();
  if (data.missionReward || source.includes("mission")) return "mission";
  if (data.baseIncome !== undefined || data.ps !== undefined && data.round !== undefined && !data.caster) return "income";
  if (data.customRuntime || source.includes("abil") || source.includes("ability")) return "ability";
  if (source.includes("tactic") || source.includes("c2c") || source.includes("contratto") || source.includes("riforn") || source.includes("ricalcolo")) return "card";
  return "other";
}

function telemetryEventSide(data, keys) {
  for (const key of keys) {
    const side = Number(data && data[key]);
    if (Number.isInteger(side) && side > 0) return side;
  }
  return null;
}

function telemetryIncrementTurn(side, key, amount=1) {
  const turn = telemetryActiveTurn(side);
  if (turn) turn[key] = telemetryNumber(turn[key], 0) + amount;
}

function updateMatchTelemetryFromEvent(event) {
  if (!state || !event) return null;
  const telemetry = ensureMatchTelemetry();
  if (!telemetry) return null;
  const type = event.type || "LOG_MESSAGE";
  const data = event.data || {};
  telemetry.totals.events += 1;
  telemetry.updatedAt = telemetryNowIso();
  if (telemetry.rng) {
    telemetry.rng.calls = telemetryNumber(state.matchRngCalls, 0);
    telemetry.rng.state = telemetryNumber(state.matchRngState, 0);
  }

  switch (type) {
    case EventTypes.GAME_STARTED:
      telemetry.setup.firstPlayer = Number(data.firstPlayer || telemetry.setup.firstPlayer) || telemetry.setup.firstPlayer;
      telemetry.setup.selectedCommanders = telemetryClone(data.selectedCommanders || state.selectedCommanders || {});
      break;
    case EventTypes.TURN_ENDED: {
      const side = telemetryEventSide(data, ["player"]);
      if (side) telemetryFinishTurn(side);
      break;
    }
    case EventTypes.CARD_DRAWN: {
      const side = telemetryEventSide(data, ["player"]);
      const player = telemetryPlayer(side);
      const cards = Array.isArray(data.cards) ? data.cards : [];
      if (player) {
        player.cards.drawn += telemetryNumber(data.count, cards.length || 1);
        telemetry.totals.cardsDrawn += telemetryNumber(data.count, cards.length || 1);
        for (const card of cards) {
          const bucket = telemetryCardBucket(side, card);
          if (!bucket) continue;
          bucket.drawn += 1;
          if (bucket.firstDrawRound == null) bucket.firstDrawRound = telemetryNumber(state.turn, 0);
          // La sovrapesca viene contabilizzata una sola volta dall'evento CARD_DISCARDED.
          if (player.deck.pivotId && [card.id, card.sourceId, card.blueprintId].map(String).includes(String(player.deck.pivotId))) {
            const drawRound = telemetryNumber(state.turn, 0);
            if (player.field.pivotDrawRound == null) player.field.pivotDrawRound = drawRound;
            player.field.pivotDrawRounds.push(drawRound);
            telemetry.timelines.pivots.push({ side, event:"drawn", round:drawRound, pivotId:player.deck.pivotId, overdrawDiscarded:Boolean(card.overdrawDiscarded) });
          }
        }
      }
      break;
    }
    case EventTypes.CARD_PLAYED: {
      const side = telemetryEventSide(data, ["player"]);
      const player = telemetryPlayer(side);
      const bucket = telemetryCardBucket(side, data);
      if (player) { player.cards.played += 1; telemetry.totals.cardsPlayed += 1; }
      if (bucket) {
        bucket.played += 1;
        if (bucket.firstPlayRound == null) bucket.firstPlayRound = telemetryNumber(state.turn, 0);
        bucket.lastPlayRound = telemetryNumber(state.turn, 0);
      }
      telemetryIncrementTurn(side, "cardsPlayed", 1);
      telemetry.timelines.cards.push({ type:"played", side, round:state.turn, cardId:telemetryCardKey(data), cardName:telemetryCardName(data), sourceType:data.sourceType || "" });
      break;
    }
    case EventTypes.CARD_DISCARDED: {
      const side = telemetryEventSide(data, ["player"]);
      const player = telemetryPlayer(side);
      const bucket = telemetryCardBucket(side, data);
      if (player) { player.cards.discarded += 1; if (data.reason === "overdraw") player.cards.overdrawn += 1; }
      if (bucket) { bucket.discarded += 1; if (data.reason === "overdraw") bucket.overdrawn += 1; }
      telemetry.timelines.cards.push({ type:"discarded", side, round:state.turn, cardId:telemetryCardKey(data), cardName:telemetryCardName(data), reason:data.reason || "" });
      break;
    }
    case EventTypes.CARD_STOLEN: {
      const fromSide = telemetryEventSide(data, ["fromSide", "fromPlayer"]);
      const toSide = telemetryEventSide(data, ["toSide", "toPlayer", "player"]);
      const fromPlayer = telemetryPlayer(fromSide);
      const toPlayer = telemetryPlayer(toSide);
      if (fromPlayer) { fromPlayer.cards.stolenOut += 1; const bucket = telemetryCardBucket(fromSide, data); if (bucket) bucket.stolenOut += 1; }
      if (toPlayer) {
        toPlayer.cards.stolenIn += 1;
        const bucket = telemetryCardBucket(toSide, data);
        if (bucket) bucket.stolenIn += 1;
        if (data.destination === "discard" || data.reason === "overdraw" || data.overdrawDiscarded === true) {
          toPlayer.cards.overdrawn += 1;
          if (bucket) { bucket.overdrawn += 1; bucket.discarded += 1; }
          toPlayer.cards.discarded += 1;
        }
      }
      break;
    }
    case EventTypes.CARD_BLOCKED: {
      const side = telemetryEventSide(data, ["player", "targetSide"]);
      const player = telemetryPlayer(side);
      if (player) player.cards.blocked += telemetryNumber(data.count, 1);
      break;
    }
    case EventTypes.DECK_EXHAUSTED: {
      const side = telemetryEventSide(data, ["player"]);
      const player = telemetryPlayer(side);
      if (player) player.cards.deckExhaustions += 1;
      break;
    }
    case EventTypes.DECK_RECOVERED: {
      const side = telemetryEventSide(data, ["player"]);
      const player = telemetryPlayer(side);
      if (player) player.cards.deckRecoveries += 1;
      break;
    }
    case EventTypes.UNIT_SPAWNED:
    case EventTypes.UNIT_BUILT: {
      const side = telemetryEventSide(data, ["player", "side"]);
      const player = telemetryPlayer(side);
      const cost = Math.max(0, telemetryNumber(data.cost, 0));
      if (player) {
        if (type === EventTypes.UNIT_BUILT) { player.field.structuresBuilt += 1; player.economy.spentStructures += cost; telemetry.totals.structuresBuilt += 1; telemetryIncrementTurn(side, "structuresBuilt", 1); }
        else { player.field.unitsDeployed += 1; player.economy.spentUnits += cost; telemetry.totals.unitsDeployed += 1; telemetryIncrementTurn(side, "unitsDeployed", 1); }
        player.economy.spentTotal += cost;
        telemetry.totals.energySpent += cost;
        telemetryIncrementTurn(side, "energySpent", cost);
        if (player.deck.commanderId && data.blueprintId === player.deck.commanderId && player.field.commanderDeployedRound == null) player.field.commanderDeployedRound = telemetryNumber(state.turn, 0);
        if (type === EventTypes.UNIT_BUILT && String(data.blueprintId || "") === "EX4B02" && typeof getCellAt === "function") {
          const psCell = getCellAt(data.coord);
          if (psCell && psCell.ps) {
            const module = telemetryExpertModuleBucketF9T1("Exordium");
            if (module) {
              module.totalBastionsBuiltOnPs += 1;
              if (data.expertPlanId || String(data.expertDoctrine || "").startsWith("exordium_")) module.expertBastionsBuiltOnPs += 1;
              else module.fallbackBastionsBuiltOnPs += 1;
              module.bastionsBuiltOnPs = module.totalBastionsBuiltOnPs;
            }
          }
        }
        const pivotInstance = telemetryRegisterPivotInstance(side, data, cost);
        if (pivotInstance) {
          telemetry.timelines.pivots.push({
            side, event:"deployed", round:pivotInstance.deployedRound, pivotId:pivotInstance.pivotId, pivotName:pivotInstance.pivotName,
            unitId:pivotInstance.unitId, instanceNo:pivotInstance.instanceNo, instanceIndex:player.field.pivotInstances.indexOf(pivotInstance) + 1,
            cost, spawnSource:pivotInstance.spawnSource
          });
        }
      }
      break;
    }
    case EventTypes.TACTIC_USED: {
      const side = telemetryEventSide(data, ["player", "side", "casterSide"]);
      const player = telemetryPlayer(side);
      const cost = Math.max(0, telemetryNumber(data.cost, 0));
      if (player) { player.combat.tactics += 1; player.economy.spentTactics += cost; player.economy.spentTotal += cost; }
      telemetry.totals.energySpent += cost;
      telemetryIncrementTurn(side, "tacticsUsed", 1);
      telemetryIncrementTurn(side, "energySpent", cost);
      break;
    }
    case EventTypes.ABILITY_USED: {
      const side = telemetryEventSide(data, ["player", "side", "casterSide", "userSide"]);
      const player = telemetryPlayer(side);
      const cost = Math.max(0, telemetryNumber(data.cost, data.energyCost || 0));
      if (player) { player.combat.abilities += 1; player.economy.spentAbilities += cost; player.economy.spentTotal += cost; }
      telemetry.totals.energySpent += cost;
      telemetryIncrementTurn(side, "abilitiesUsed", 1);
      telemetryIncrementTurn(side, "energySpent", cost);
      const pivotInstance = telemetryPivotInstanceFromEvent(side, data, ["unitId"]);
      if (pivotInstance) { pivotInstance.abilitiesUsed += 1; telemetryRefreshPivotAggregates(player); }
      break;
    }
    case EventTypes.UNIT_ATTACKED: {
      const side = telemetryEventSide(data, ["attackerSide", "player", "side"]);
      const player = telemetryPlayer(side);
      if (player) player.combat.attacks += 1;
      telemetryIncrementTurn(side, "attacks", 1);
      const pivotInstance = telemetryPivotInstanceFromEvent(side, data, ["attackerId"]);
      if (pivotInstance) { pivotInstance.attacks += 1; telemetryRefreshPivotAggregates(player); }
      break;
    }
    case EventTypes.UNIT_MOVED: {
      const side = telemetryEventSide(data, ["player", "side"]);
      telemetryIncrementTurn(side, "moves", 1);
      break;
    }
    case EventTypes.UNIT_DAMAGED: {
      const sourceSide = telemetryEventSide(data, ["sourceSide", "attackerSide", "casterSide"]);
      const targetSide = telemetryEventSide(data, ["targetSide", "side"]);
      const total = Math.max(0, telemetryNumber(data.defLoss, 0) + telemetryNumber(data.hpLoss, 0));
      const sourcePlayer = telemetryPlayer(sourceSide);
      const targetPlayer = telemetryPlayer(targetSide);
      if (sourcePlayer && sourceSide !== targetSide) {
        sourcePlayer.combat.damageDealt += total;
        sourcePlayer.combat.damageToDef += Math.max(0, telemetryNumber(data.defLoss, 0));
        sourcePlayer.combat.damageToHp += Math.max(0, telemetryNumber(data.hpLoss, 0));
        telemetryIncrementTurn(sourceSide, "damageDealt", total);
        const pivotInstance = telemetryPivotInstanceFromEvent(sourceSide, data, ["sourceUnitId", "attackerId"]);
        if (pivotInstance) { pivotInstance.damageDealt += total; telemetryRefreshPivotAggregates(sourcePlayer); }
      }
      if (targetPlayer) targetPlayer.combat.damageTaken += total;
      telemetry.totals.damage += total;
      break;
    }
    case EventTypes.UNIT_DESTROYED: {
      const victimSide = telemetryEventSide(data, ["side", "targetSide", "player"]);
      const killerSide = telemetryEventSide(data, ["killerSide", "destroyedBySide"]);
      const victim = telemetryPlayer(victimSide);
      const killer = telemetryPlayer(killerSide);
      if (victim) {
        victim.combat.unitsLost += 1;
        const pivotInstance = telemetryPivotInstanceFromEvent(victimSide, data, ["unitId"]);
        if (pivotInstance && pivotInstance.destroyedRound == null) {
          pivotInstance.destroyedRound = telemetryNumber(data.round, state.turn);
          pivotInstance.survivalRounds = pivotInstance.deployedRound == null ? null : Math.max(0, pivotInstance.destroyedRound - telemetryNumber(pivotInstance.deployedRound, pivotInstance.destroyedRound) + 1);
          pivotInstance.status = "destroyed";
          pivotInstance.killerSide = killerSide || null;
          pivotInstance.destructionSource = String(data.source || "");
          telemetryRefreshPivotAggregates(victim);
          telemetry.timelines.pivots.push({
            side:victimSide, event:"destroyed", round:pivotInstance.destroyedRound, pivotId:victim.deck.pivotId,
            unitId:pivotInstance.unitId, instanceNo:pivotInstance.instanceNo, instanceIndex:victim.field.pivotInstances.indexOf(pivotInstance) + 1,
            survivalRounds:pivotInstance.survivalRounds, killerSide:killerSide || null, source:pivotInstance.destructionSource
          });
        }
      }
      if (killer && killerSide !== victimSide) killer.combat.kills += 1;
      for (const assistSide of (data.assistSides || []).map(Number)) { const assist = telemetryPlayer(assistSide); if (assist) assist.combat.assists += 1; }
      break;
    }
    case EventTypes.ECONOMY_CHANGED: {
      const side = telemetryEventSide(data, ["player", "targetSide"]);
      const player = telemetryPlayer(side);
      if (!player) break;
      const before = data.energyBefore !== undefined ? telemetryNumber(data.energyBefore, 0) : null;
      const after = data.energyAfter !== undefined ? telemetryNumber(data.energyAfter, 0) : null;
      const gain = Math.max(0, telemetryNumber(data.gain, data.delta > 0 ? data.delta : 0));
      const loss = Math.max(0, telemetryNumber(data.loss, data.delta < 0 ? -data.delta : (before != null && after != null ? before - after : 0)));
      const category = telemetryClassifyEconomy(data);
      if (gain > 0) {
        player.economy.gainedTotal += gain;
        telemetry.totals.energyGained += gain;
        telemetryIncrementTurn(side, "energyGained", gain);
        if (category === "income") {
          player.economy.gainedBaseIncome += Math.max(0, telemetryNumber(data.baseIncome, 0));
          player.economy.gainedFromPs += Math.max(0, gain - telemetryNumber(data.baseIncome, 0) - telemetryNumber(data.effectDelta, 0) - telemetryNumber(data.seedBonus, 0) - telemetryNumber(data.doctrineDelta, 0));
          player.economy.gainedOther += Math.max(0, telemetryNumber(data.effectDelta, 0) + telemetryNumber(data.seedBonus, 0) + telemetryNumber(data.doctrineDelta, 0));
        } else if (category === "mission") player.economy.gainedFromMissions += gain;
        else if (category === "ability") player.economy.gainedFromAbilities += gain;
        else if (category === "card") player.economy.gainedFromCards += gain;
        else player.economy.gainedOther += gain;
      }
      if (loss > 0) player.economy.lostTotal += loss;
      if (telemetryNumber(data.incomeDelta, 0) < 0) player.economy.incomePenaltyTotal += Math.abs(telemetryNumber(data.incomeDelta, 0)) * Math.max(1, telemetryNumber(data.turns, 1));
      telemetry.timelines.economy.push({ side, round:state.turn, gain, loss, category, source:String(data.source || ""), totalEnergy:state.energy ? telemetryNumber(state.energy[side], 0) : null });
      if (telemetry.timelines.economy.length > 1000) telemetry.timelines.economy.shift();
      break;
    }
    case EventTypes.PS_CONTROL_CHANGED: {
      const next = telemetryEventSide(data, ["nextControl", "newControl", "player", "side"]);
      const previous = telemetryEventSide(data, ["previousControl", "oldControl"]);
      if (next && next !== previous) {
        const nextPlayer = telemetryPlayer(next);
        if (nextPlayer) { nextPlayer.field.psControlChanges += 1; nextPlayer.field.psGained += 1; }
      }
      if (previous && previous !== next) {
        const previousPlayer = telemetryPlayer(previous);
        if (previousPlayer) { previousPlayer.field.psControlChanges += 1; previousPlayer.field.psLost += 1; }
      }
      telemetry.timelines.psControl.push({
        seq:event.seq || null,
        round:telemetryNumber(data.round, state.turn),
        coord:Array.isArray(data.coord) ? [...data.coord] : null,
        previousControl:previous || null,
        nextControl:next || null,
        locked:Boolean(data.locked),
        occupantId:data.occupantId || null,
        occupantName:data.occupantName || ""
      });
      if (telemetry.timelines.psControl.length > 1000) telemetry.timelines.psControl.shift();
      break;
    }
    case EventTypes.PRESSURE_CHANGED: {
      const side = telemetryEventSide(data, ["player"]);
      const player = telemetryPlayer(side);
      const delta = Math.max(0, telemetryNumber(data.delta, 0));
      if (player) player.field.pressureGained += delta;
      telemetry.totals.pressureIncrements += delta;
      break;
    }
    case EventTypes.MISSION_PROGRESS_CHANGED: {
      const side = telemetryEventSide(data, ["player"]);
      const player = telemetryPlayer(side);
      if (player) {
        player.mission.progressChanges += 1;
        player.mission.objectives[data.objectiveId || data.metric || "unknown"] = {
          metric:data.metric || "", current:telemetryClone(data.current), target:telemetryClone(data.target), streak:telemetryNumber(data.streak, 0),
          satisfied:Boolean(data.satisfied), completed:Boolean(data.completed), round:telemetryNumber(state.turn, 0)
        };
      }
      break;
    }
    case EventTypes.MISSION_READY: {
      const side = telemetryEventSide(data, ["player"]);
      const player = telemetryPlayer(side);
      if (player && player.mission.readyRound == null) player.mission.readyRound = telemetryNumber(state.turn, 0);
      telemetry.timelines.missions.push({ side, event:"ready", round:state.turn, missionId:data.missionId || "", cycle:data.cycle || 1 });
      break;
    }
    case EventTypes.MISSION_PLAYED: {
      const side = telemetryEventSide(data, ["player"]);
      const player = telemetryPlayer(side);
      if (player) {
        if (player.mission.playedRound == null) player.mission.playedRound = telemetryNumber(data.round, state.turn);
        player.mission.completionRound = telemetryNumber(data.round, state.turn);
        player.mission.cyclesPlayed += 1;
      }
      telemetry.totals.missionsPlayed += 1;
      telemetry.timelines.missions.push({ side, event:"played", round:telemetryNumber(data.round, state.turn), missionId:data.missionId || "", cycle:data.cycle || 1, multiplier:data.multiplier || 1 });
      break;
    }
    case EventTypes.MISSION_REWARD_RESOLVED: {
      const side = telemetryEventSide(data, ["player"]);
      const player = telemetryPlayer(side);
      if (player) { player.mission.rewardResolvedRound = telemetryNumber(state.turn, 0); player.mission.rewardsResolved += 1; }
      telemetry.totals.missionRewardsResolved += 1;
      telemetry.timelines.missions.push({ side, event:"reward_resolved", round:state.turn, missionId:data.missionId || "", cycle:data.cycle || 1, result:telemetryClone(data.result) });
      break;
    }
    case EventTypes.PLAYER_ELIMINATED: {
      const side = telemetryEventSide(data, ["player"]);
      const player = telemetryPlayer(side);
      if (player) { player.combat.eliminatedRound = telemetryNumber(data.round, state.turn); player.mission.impossibleAtEnd = player.mission.present && player.mission.completionRound == null; }
      telemetryFinishTurn(side, { interrupted:true });
      const killer = telemetryPlayer(telemetryEventSide(data, ["killerSide", "conqueror"]));
      if (killer) killer.combat.playerEliminations += 1;
      break;
    }
    case EventTypes.AI_EXPERT_TURN_STARTED: {
      const side = telemetryEventSide(data, ["player"]);
      const expert = telemetryEnsureExpertAiF9T1();
      const turn = telemetryExpertTurnF9T1(side, data.sequence, true);
      if (expert) { expert.enabled = true; expert.totals.turnsStarted += 1; }
      if (turn) {
        turn.status = "started";
        turn.faction = String(data.faction || turn.faction || "");
        turn.performance.heapStart = data.heapBytes == null ? null : telemetryNumber(data.heapBytes, null);
        turn.limits = telemetryClone(data.limits || {});
      }
      break;
    }
    case EventTypes.AI_EXPERT_CONTEXT_CREATED: {
      const side = telemetryEventSide(data, ["player"]);
      const expert = telemetryEnsureExpertAiF9T1();
      const turn = telemetryExpertTurnF9T1(side, data.sequence, true);
      if (expert) expert.totals.contextsCreated += 1;
      if (turn) {
        turn.context = telemetryClone(data.common || {});
        turn.mapId = String(data.mapId || "");
        turn.movementMultiplier = telemetryNumber(data.movementMultiplier, 1);
        turn.cacheHits = telemetryNumber(data.cacheHits, 0);
        turn.cacheMisses = telemetryNumber(data.cacheMisses, 0);
        turn.performance.contextDurationMs = telemetryNumber(data.durationMs, 0);
        const module = telemetryExpertModuleBucketF9T1(turn.faction);
        if (module) module.contextDurationMsTotal += telemetryNumber(data.durationMs, 0);
      }
      break;
    }
    case EventTypes.AI_EXPERT_MODULE_ROUTED: {
      const side = telemetryEventSide(data, ["player"]);
      const expert = telemetryEnsureExpertAiF9T1();
      const turn = telemetryExpertTurnF9T1(side, data.sequence, true);
      if (expert) expert.totals.modulesRouted += 1;
      if (turn) {
        turn.moduleId = String(data.moduleId || "");
        turn.invokedModules = telemetryNumber(data.invokedModules, 0);
        turn.moduleStatus = String(data.moduleStatus || "");
        turn.performance.moduleDurationMs = telemetryNumber(data.durationMs, 0);
        const module = telemetryExpertModuleBucketF9T1(turn.faction);
        if (module) { module.turnsRouted += 1; module.moduleDurationMsTotal += telemetryNumber(data.durationMs, 0); }
      }
      break;
    }
    case EventTypes.AI_EXPERT_FALLBACK: {
      const side = telemetryEventSide(data, ["player"]);
      const expert = telemetryEnsureExpertAiF9T1();
      const turn = telemetryExpertTurnF9T1(side, data.sequence, true);
      if (expert) expert.totals.fallbacks += 1;
      if (turn) {
        turn.fallback = { reason:String(data.reason || ""), target:String(data.fallback || "advanced_f9t0"), validationErrors:telemetryClone(data.validationErrors || []) };
        const module = telemetryExpertModuleBucketF9T1(turn.faction);
        if (module) module.fallbacks += 1;
      }
      break;
    }
    case EventTypes.AI_EXPERT_BUDGET_EXHAUSTED: {
      const side = telemetryEventSide(data, ["player"]);
      const expert = telemetryEnsureExpertAiF9T1();
      const turn = telemetryExpertTurnF9T1(side, data.sequence, true);
      if (expert) expert.totals.budgetExhaustions += 1;
      if (turn) turn.budgetExhaustions.push(telemetryClone(data));
      break;
    }
    case EventTypes.AI_MICROPLAN_SELECTED: {
      const side = telemetryEventSide(data, ["player"]);
      const expert = telemetryEnsureExpertAiF9T1();
      const turn = telemetryExpertTurnF9T1(side, data.sequence, true);
      if (expert) expert.totals.microplansSelected += 1;
      if (turn) {
        turn.plan = {
          id:String(data.planId || ""), goal:String(data.goal || ""), stepCount:telemetryNumber(data.stepCount, 0),
          requiredEnergy:telemetryNumber(data.requiredEnergy, 0), reservedEnergy:telemetryNumber(data.reservedEnergy, 0),
          targetCell:telemetryClone(data.targetCell || null), targetPs:telemetryClone(data.targetPs || null),
          primaryActorId:data.primaryActorId == null ? null : String(data.primaryActorId),
          supportActorIds:telemetryClone(data.supportActorIds || []), expectedResult:telemetryClone(data.expectedResult || {}), status:"selected"
        };
        const module = telemetryExpertModuleBucketF9T1(turn.faction);
        if (module) {
          module.microplansSelected += 1;
          if (String(data.goal || "") === "EXORDIUM_BASTION_RELAY") module.bastionRelayPlans += 1;
          if (String(data.goal || "") === "EXORDIUM_CLEAR_OCCUPY_FORTIFY") module.clearOccupyFortifyPlans += 1;
          if (String(data.goal || "") === "EXORDIUM_FORWARD_PIVOT_DEPLOYMENT") module.forwardPivotPlans += 1;
          if (String(data.goal || "") === "EXORDIUM_VARRAN_ASSAULT_CHAIN") module.varranAssaultPlans += 1;
        }
      }
      break;
    }
    case EventTypes.AI_MICROPLAN_STEP: {
      const side = telemetryEventSide(data, ["player"]);
      const expert = telemetryEnsureExpertAiF9T1();
      const turn = telemetryExpertTurnF9T1(side, data.sequence, true);
      if (expert) expert.totals.microplanSteps += 1;
      if (turn) {
        const stepRecord = {
          planId:String(data.planId || ""), goal:String(data.goal || ""), stepIndex:telemetryNumber(data.stepIndex, 0),
          stepId:String(data.stepId || ""), action:String(data.action || ""), status:String(data.status || "completed"),
          result:telemetryClone(data.result || {})
        };
        turn.planSteps.push(stepRecord);
        const module = telemetryExpertModuleBucketF9T1(turn.faction);
        if (module) {
          module.microplanSteps += 1;
          if (stepRecord.result && stepRecord.result.result === "bastion_built_on_ps") { /* counted authoritatively from UNIT_BUILT */ }
          if (stepRecord.result && stepRecord.result.result === "mobile_guard_released") module.mobileGuardsReleased += 1;
          if (stepRecord.result && stepRecord.result.result === "ps_presidium_destroyed") { /* aggregated from runtime summary F9T2c3 */ }
          if (stepRecord.result && String(stepRecord.result.result || "").startsWith("ps_occupied_after_clear")) { /* aggregated from runtime summary F9T2c3 */ }
          if (stepRecord.result && stepRecord.result.result === "pivot_deployed_forward") { module.forwardPivotsDeployed += 1; module.expertForwardPivotsDeployed += 1; }
          if (stepRecord.result && stepRecord.result.result === "ps_fortified_after_clear") { /* aggregated from runtime summary F9T2c3 */ }
        }
      }
      break;
    }
    case EventTypes.AI_MICROPLAN_COMPLETED: {
      const side = telemetryEventSide(data, ["player"]);
      const expert = telemetryEnsureExpertAiF9T1();
      const turn = telemetryExpertTurnF9T1(side, data.sequence, true);
      if (expert) expert.totals.microplansCompleted += 1;
      if (turn && turn.plan) turn.plan.status = "completed";
      if (turn) { const module = telemetryExpertModuleBucketF9T1(turn.faction); if (module) module.microplansCompleted += 1; }
      break;
    }
    case EventTypes.AI_MICROPLAN_ABORTED: {
      const side = telemetryEventSide(data, ["player"]);
      const expert = telemetryEnsureExpertAiF9T1();
      const turn = telemetryExpertTurnF9T1(side, data.sequence, true);
      if (expert) expert.totals.microplansAborted += 1;
      if (turn && turn.plan) {
        turn.plan.status = "aborted";
        turn.plan.abortReason = String(data.reason || "");
        turn.plan.abortDetails = telemetryClone(data.details || {});
      }
      if (turn) { const module = telemetryExpertModuleBucketF9T1(turn.faction); if (module) module.microplansAborted += 1; }
      break;
    }
    case EventTypes.AI_EXPERT_DECISION: {
      telemetryRecordExpertDecisionF9T1(telemetryEventSide(data, ["player"]), data.sequence, data.decision || data);
      break;
    }
    case EventTypes.AI_EXPERT_TURN_COMPLETED: {
      const side = telemetryEventSide(data, ["player"]);
      const expert = telemetryEnsureExpertAiF9T1();
      const turn = telemetryExpertTurnF9T1(side, data.sequence, true);
      if (expert) expert.totals.turnsCompleted += 1;
      if (turn) {
        turn.status = "completed";
        turn.fallbackUsed = Boolean(data.fallbackUsed);
        if (turn.plan) {
          turn.plan.status = String(data.planStatus || turn.plan.status || "");
          turn.plan.currentStep = data.planCurrentStep == null ? turn.plan.currentStep : telemetryNumber(data.planCurrentStep, 0);
        }
        const reportedDecisionStored = telemetryNumber(data.decisionRecordsStored, turn.decisions.length);
        const reportedDecisionDropped = telemetryNumber(data.decisionRecordsDropped, turn.decisionRecordsDropped || 0);
        const reportedDecisionTotal = telemetryNumber(data.decisionRecordsTotal, reportedDecisionStored + reportedDecisionDropped);
        turn.decisionRecordsStored = turn.decisions.length;
        turn.decisionCount = turn.decisions.length;
        turn.decisionRecordsDropped = reportedDecisionDropped;
        turn.decisionRecordsTotal = turn.decisionRecordsStored + turn.decisionRecordsDropped;
        turn.decisionStoredArrayDelta = reportedDecisionStored - turn.decisions.length;
        turn.decisionTotalDelta = reportedDecisionTotal - turn.decisionRecordsTotal;
        turn.decisionReconciliationOk = turn.decisionStoredArrayDelta === 0 && turn.decisionTotalDelta === 0;
        turn.decisionLimitReached = Boolean(data.decisionLimitReached || turn.decisionLimitReached);

        turn.auditItemsTotal = telemetryNumber(data.auditItemsTotal, data.auditRecordTotal == null ? turn.auditItemsTotal : data.auditRecordTotal);
        turn.auditItemsStored = telemetryNumber(data.auditItemsStored, Math.max(0, turn.auditItemsTotal - telemetryNumber(data.auditItemsDropped, data.auditRecordsDropped || 0)));
        turn.auditItemsDropped = telemetryNumber(data.auditItemsDropped, data.auditRecordsDropped == null ? turn.auditItemsDropped : data.auditRecordsDropped);
        turn.auditContainersTotal = telemetryNumber(data.auditContainersTotal, turn.auditContainersTotal || turn.auditRecords.length);
        turn.auditContainersStored = turn.auditRecords.length;
        turn.auditContainersDropped = Math.max(0, turn.auditContainersTotal - turn.auditContainersStored);
        turn.auditRecordTotal = turn.auditItemsTotal;
        turn.auditRecordsTotal = turn.auditContainersTotal;
        turn.auditRecordsStored = turn.auditContainersStored;
        turn.auditRecordsDropped = turn.auditContainersDropped;
        turn.candidateScanStoppedEarly = Boolean(data.candidateScanStoppedEarly);
        turn.candidateCount = telemetryNumber(data.candidateCount, 0);
        turn.discardedCandidates = telemetryNumber(data.discardedCandidates, 0);
        turn.candidateAuditCount = telemetryNumber(data.candidateAuditCount, turn.candidateAudits.length);
        turn.candidateAuditsTotal = turn.candidateAuditCount;
        turn.candidateAuditsStored = turn.candidateAudits.length;
        turn.candidateAuditsDropped = Math.max(0, turn.candidateAuditsTotal - turn.candidateAuditsStored);
        turn.candidateAuditCountByScanner = telemetryClone(data.candidateAuditCountByScanner || turn.candidateAuditCountByScanner || {});
        turn.candidateRejectionCounts = telemetryClone(data.candidateRejectionCounts || turn.candidateRejectionCounts || {});
        turn.candidateRejectionCountsByScanner = telemetryClone(data.candidateRejectionCountsByScanner || turn.candidateRejectionCountsByScanner || {});
        turn.territorialConversionMetrics = telemetryClone(data.territorialConversionMetrics || turn.territorialConversionMetrics || {});
        turn.cacheHits = telemetryNumber(data.cacheHits, turn.cacheHits || 0);
        turn.cacheMisses = telemetryNumber(data.cacheMisses, turn.cacheMisses || 0);
        turn.reason = String(data.reason || "turn_completed");
        turn.guardIterations = telemetryNumber(data.guardIterations, 0);
        turn.performance.contextDurationMs = telemetryNumber(data.contextDurationMs, turn.performance.contextDurationMs);
        turn.performance.moduleDurationMs = telemetryNumber(data.moduleDurationMs, turn.performance.moduleDurationMs);
        turn.performance.totalDurationMs = telemetryNumber(data.totalDurationMs, 0);
        turn.performance.heapStart = data.heapStart == null ? turn.performance.heapStart : telemetryNumber(data.heapStart, null);
        turn.performance.heapEnd = data.heapEnd == null ? null : telemetryNumber(data.heapEnd, null);
        turn.performance.heapDelta = data.heapDelta == null ? null : telemetryNumber(data.heapDelta, null);
        const module = telemetryExpertModuleBucketF9T1(turn.faction);
        if (module) {
          module.totalDurationMsTotal += telemetryNumber(data.totalDurationMs, 0);
          module.decisionRecordsTotal += turn.decisionRecordsTotal;
          module.decisionRecordsStored += turn.decisionRecordsStored;
          module.decisionRecordsDropped += turn.decisionRecordsDropped;
          module.auditItemsTotal += turn.auditItemsTotal;
          module.auditItemsStored += turn.auditItemsStored;
          module.auditItemsDropped += turn.auditItemsDropped;
          module.auditContainersTotal += turn.auditContainersTotal;
          module.auditContainersStored += turn.auditContainersStored;
          module.auditContainersDropped += turn.auditContainersDropped;
          module.auditRecordsTotal = module.auditContainersTotal;
          module.auditRecordsStored = module.auditContainersStored;
          module.auditRecordsDropped = module.auditContainersDropped;
          module.auditRecords = module.auditContainersStored;
          module.candidateAuditsTotal += turn.candidateAuditsTotal;
          module.candidateAuditsStored += turn.candidateAuditsStored;
          module.candidateAuditsDropped += turn.candidateAuditsDropped;
          module.candidateAudits = module.candidateAuditsTotal;
          for (const key of ["relay", "clearOccupyFortify", "forwardPivot", "varranAssault"]) {
            module.candidateAuditCountByScanner[key] = telemetryNumber(module.candidateAuditCountByScanner[key], 0) + telemetryNumber(turn.candidateAuditCountByScanner && turn.candidateAuditCountByScanner[key], 0);
          }
          for (const [reason, count] of Object.entries(turn.candidateRejectionCounts || {})) {
            module.candidateRejectionCounts[reason] = telemetryNumber(module.candidateRejectionCounts[reason], 0) + telemetryNumber(count, 0);
          }
          const scannerTargets = { relay:"relayCandidateRejectionCounts", clearOccupyFortify:"clearCandidateRejectionCounts", forwardPivot:"forwardPivotCandidateRejectionCounts", varranAssault:"varranCandidateRejectionCounts" };
          for (const [scannerKey, targetKey] of Object.entries(scannerTargets)) {
            for (const [reason, count] of Object.entries(turn.candidateRejectionCountsByScanner && turn.candidateRejectionCountsByScanner[scannerKey] || {})) {
              module[targetKey][reason] = telemetryNumber(module[targetKey][reason], 0) + telemetryNumber(count, 0);
            }
          }
          const territorial = turn.territorialConversionMetrics || {};
          module.psClearedDuringExpertPlan += telemetryNumber(territorial.psClearedDuringExpertPlan, 0);
          module.psClearedDirectlyByExpertStep += telemetryNumber(territorial.psClearedDirectlyByExpertStep, 0);
          module.psOccupiedAfterClear += telemetryNumber(territorial.psOccupiedAfterClear, 0);
          module.expertPsOccupiedAfterClear += telemetryNumber(territorial.psOccupiedAfterClear, 0);
          module.psFortifiedAfterClear += telemetryNumber(territorial.psFortifiedAfterClear, 0);
          module.expertPsFortifiedAfterClear += telemetryNumber(territorial.psFortifiedAfterClear, 0);
          module.psCleared = module.psClearedDuringExpertPlan;
          module.expertPsCleared = module.psClearedDuringExpertPlan;
        }
        if (!turn.decisionReconciliationOk) {
          const diagnostic = {
            kind:"decision_reconciliation_failed",
            side:Number(side),
            sequence:Number(data.sequence),
            round:Number(turn.round || 0),
            decisionStoredArrayDelta:turn.decisionStoredArrayDelta,
            decisionTotalDelta:turn.decisionTotalDelta,
            reportedDecisionStored,
            reportedDecisionTotal,
            authoritativeStored:turn.decisionRecordsStored,
            authoritativeTotal:turn.decisionRecordsTotal,
            recordedAt:telemetryNowIso()
          };
          expert.diagnostics.push(diagnostic);
          if (expert.diagnostics.length > 200) expert.diagnostics.shift();
          if (typeof console !== "undefined" && console.warn) console.warn("F9T2c3a: riconciliazione decisioni Expert non valida", diagnostic);
        }
        turn.finalized = true;
      }
      break;
    }
    case EventTypes.VICTORY:
      finalizeMatchTelemetry(data);
      break;
    default:
      break;
  }
  return telemetry;
}

function finalizeMatchTelemetry(victoryData={}) {
  const telemetry = ensureMatchTelemetry();
  if (!telemetry || telemetry.status === "complete") return telemetry;
  const runtime = state.matchTelemetryRuntime || {};
  for (const side of telemetryPlayerIds()) telemetryFinishTurn(side, { interrupted:true });
  telemetry.status = "complete";
  telemetry.endedAt = telemetryNowIso();
  telemetry.durationMs = Math.max(0, Math.round(telemetryPerfNow() - telemetryNumber(runtime.startedPerf, telemetryPerfNow())));
  for (const side of telemetryPlayerIds()) {
    const player = telemetryPlayer(side);
    const hand = state.hand && state.hand[side] ? state.hand[side] : [];
    for (const card of hand) {
      const bucket = telemetryCardBucket(side, card);
      if (bucket) bucket.turnsHeldAtEnd += 1;
    }
    if (player && player.mission.present && player.mission.completionRound == null) player.mission.impossibleAtEnd = Boolean(typeof isPlayerEliminated === "function" && isPlayerEliminated(side));
    if (player) telemetryRefreshPivotAggregates(player, telemetryNumber(victoryData.round, state.turn));
  }
  telemetry.final = {
    winnerSide:Number(victoryData.winner || state.winnerSide || 0) || null,
    winnerFaction:(victoryData.winnerFaction || (state.winnerSide && state.factions ? state.factions[state.winnerSide] : null)),
    winType:victoryData.winType || state.winType || "",
    round:telemetryNumber(victoryData.round, state.turn),
    message:victoryData.message || state.winner || "",
    ps:Object.fromEntries(telemetryPlayerIds().map(side => [side, typeof countControlledPS === "function" ? countControlledPS(side) : 0])),
    pressure:Object.fromEntries(telemetryPlayerIds().map(side => [side, state.pressure ? telemetryNumber(state.pressure[side], 0) : 0])),
    energy:Object.fromEntries(telemetryPlayerIds().map(side => [side, state.energy ? telemetryNumber(state.energy[side], 0) : 0])),
    units:Object.fromEntries(telemetryPlayerIds().map(side => [side, typeof combatUnits === "function" ? combatUnits(side).length : 0]))
  };
  telemetry.timelines.victory.push(telemetryClone(telemetry.final));
  telemetry.updatedAt = telemetry.endedAt;
  return telemetry;
}

function currentMatchTelemetrySnapshot() {
  const telemetry = ensureMatchTelemetry();
  if (!telemetry) return null;
  for (const side of telemetryPlayerIds()) telemetryRefreshPivotAggregates(telemetryPlayer(side), telemetryNumber(state && state.turn, 0));
  if (telemetry.rng) {
    telemetry.rng.calls = telemetryNumber(state.matchRngCalls, 0);
    telemetry.rng.state = telemetryNumber(state.matchRngState, 0);
  }
  telemetry.updatedAt = telemetryNowIso();
  return telemetryClone(telemetry);
}

function currentMatchTelemetryJson() {
  return JSON.stringify(currentMatchTelemetrySnapshot(), null, 2);
}

function copyCurrentMatchTelemetryJson() {
  const text = currentMatchTelemetryJson();
  if (typeof f9fCopyText === "function") return f9fCopyText(text, "Telemetria F9Q3e1a copiata negli appunti.");
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
  return text;
}

function renderMatchTelemetryPanel() {
  const panel = typeof $ === "function" ? $("matchTelemetryPanel") : null;
  if (!panel) return;
  if (!state || !state.matchTelemetry) {
    panel.innerHTML = `<div class="help">La telemetria F9Q3e1a verrà inizializzata all’avvio della prossima partita.</div>`;
    return;
  }
  const telemetry = state.matchTelemetry;
  const rows = telemetryPlayerIds().map(side => {
    const player = telemetry.players[side];
    const deck = player.deck || {};
    return `<tr>
      <td>G${side}</td><td>${typeof f9fEscapeHtml === "function" ? f9fEscapeHtml(player.faction) : player.faction}</td>
      <td>${typeof f9fEscapeHtml === "function" ? f9fEscapeHtml(deck.name || "—") : (deck.name || "—")}</td>
      <td>${player.economy.gainedTotal}</td><td>${player.economy.spentTotal}</td><td>${player.economy.unusedAtTurnEndAverage}</td>
      <td>${player.cards.drawn}</td><td>${player.cards.played}</td><td>${player.cards.deadHandTurns}</td>
      <td>${player.field.pivotDeployedRound == null ? "—" : `${player.field.pivotDeployedRound} · ×${player.field.pivotInstanceCount || 0} · †${player.field.pivotDestroyedCount || 0}`}</td><td>${player.mission.completionRound == null ? "—" : player.mission.completionRound}</td>
    </tr>`;
  }).join("");
  panel.innerHTML = `
    <div class="help"><strong>Schema ${telemetry.schemaVersion}</strong> · Seed <code>${String(telemetry.rng && telemetry.rng.seed || "—")}</code> · RNG ${telemetry.rng && telemetry.rng.algorithm || "—"} · ${telemetry.rng && telemetry.rng.calls || 0} chiamate.</div>
    <div class="miniTable"><table>
      <thead><tr><th>G</th><th>Fazione</th><th>Deck</th><th>ENE +</th><th>ENE spesa</th><th>ENE inutil.</th><th>Pesca</th><th>Giocate</th><th>Mani morte</th><th>Pivot R · ist.</th><th>Missione R</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}
