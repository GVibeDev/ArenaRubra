"use strict";

// Arena Rubra – Fase B4a
// State extraction prudente.
// Qui vivono lo stato globale, il contesto UI corrente e le factory base.
// Non introduce nuove meccaniche e non modifica il gameplay.

let state = null;
let selectedId = null;
let mode = "idle"; // idle | move | ability | build | spawn | tactic
let pendingAbility = null;
let pendingBuildBlueprintId = null;
let pendingPurchaseBlueprintId = null;
let pendingTacticId = null;
let pendingHandCardUid = null;
let pendingStarterCardUid = null;
let pendingDeploymentContext = null; // { source:"starter", starterRole, cardUid, side }
let pendingBuildSource = null; // { type:"unit", builderId } | { type:"own_hq", side }
let botRunning = false;

const $ = (id) => document.getElementById(id);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function createMatchId() {
  return Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

function readDeckSetupForSide(side) {
  const modeEl = $(`p${side}DeckMode`) || $(`setupP${side}DeckMode`);
  const savedKeyEl = $(`p${side}DeckSavedKey`) || $(`setupP${side}DeckSavedKey`);
  const mode = modeEl ? modeEl.value : "template";
  const savedKey = savedKeyEl ? String(savedKeyEl.value || "") : "";
  return {
    mode: mode === "custom" ? "custom" : "template",
    savedKey
  };
}

function readGameSetupFromDom() {
  return {
    factions: {
      1: $("p1Faction").value,
      2: $("p2Faction").value
    },
    selectedCommanders: {
      1: $("p1Commander") ? $("p1Commander").value : null,
      2: $("p2Commander") ? $("p2Commander").value : null
    },
    selectedDecks: {
      1: readDeckSetupForSide(1),
      2: readDeckSetupForSide(2)
    },
    modes: {
      1: $("p1Mode").value,
      2: $("p2Mode").value
    },
    autoResignEnabled: $("autoResignToggle") ? $("autoResignToggle").checked : true,
    aiMode: $("botAiMode") ? $("botAiMode").value : "advanced",
    pacePreset: $("pacePreset") ? $("pacePreset").value : "standard",
    gameScaleMode: $("gameScaleMode") ? $("gameScaleMode").value : "large_scale"
  };
}

function createInitialGameState(setup) {
  const factions = setup.factions;
  const firstPlayer = setup.firstPlayer;

  return {
    cells: generateMap(RADIUS),
    units: [],
    factions,
    selectedCommanders: setup.selectedCommanders || {},
    selectedDecks: setup.selectedDecks || { 1: { mode: "template" }, 2: { mode: "template" } },
    turnOrder: firstPlayer === 1 ? [1, 2] : [2, 1],
    orderIndex: 0,
    currentPlayer: firstPlayer,
    turn: 1,
    energy: { 1: START_ENE, 2: START_ENE },
    turnsStarted: { 1: 0, 2: 0 },
    modes: setup.modes,
    instanceCounters: {},
    pressure: { 1: 0, 2: 0 },
    desperation: { 1: 0, 2: 0 },
    playerEffects: { 1: [], 2: [] },
    c2c6b: { enemyDestroyedThisTurn: { 1: 0, 2: 0 } },
    mines: [],
    cellEffects: [],
    tacticCooldowns: { 1: {}, 2: {} },
    tacticUsedThisTurn: { 1: false, 2: false },
    c2eBotHandTacticsUsedThisTurn: { 1: 0, 2: 0 },
    fabeotEconomyAbilityUsed: { 1: false, 2: false },
    fabeotConversionUsed: { 1: false, 2: false },
    energyLocked: { 1: 0, 2: 0 },
    handLocked: { 1: 0, 2: 0 },
    psLocks: [],
    emergencyLoggedTurn: { 1: -1, 2: -1 },
    autoResignEnabled: setup.autoResignEnabled,
    aiMode: setup.aiMode,
    pacePreset: setup.pacePreset,
    gameScaleMode: setup.gameScaleMode === "tactical" ? "tactical" : "large_scale",
    winner: null,
    logSeq: 0,
    eventSeq: 0,
    events: [],
    matchRecorded: false,
    matchStats: null,

    // F9N6 – stato Missione separato per giocatore.
    // Viene popolato dopo l'inizializzazione delle zone carta.
    missions: { 1:null, 2:null },
    missionRewards: { 1:{ cardCostSequence:null }, 2:{ cardCostSequence:null } },
    missionPendingReward: null,
    missionTelemetry: {
      cyclesStarted:{ 1:0, 2:0 },
      recoveriesWithMission:{ 1:0, 2:0 },
      recoveriesWithoutMission:{ 1:0, 2:0 },
      missionLocksApplied:{ 1:0, 2:0 },
      missionUnlocks:{ 1:0, 2:0 },
      missionsReady:{ 1:0, 2:0 },
      missionsPlayed:{ 1:0, 2:0 },
      secondOrLaterPlays:{ 1:0, 2:0 },
      rewardsResolved:{ 1:0, 2:0 },
      aiMissionPlays:{ 1:0, 2:0 },
      aiMissionWaits:{ 1:0, 2:0 },
      targetQuotasWasted:{ 1:0, 2:0 },
      lastAiDecision:{ 1:null, 2:null },
      byMission:{}
    },

    // C2e-4g – telemetry minima per regression/balancing AI.
    aiTelemetry: {
      maxPressure:{ 1:0, 2:0 },
      turnsAt0PS:{ 1:0, 2:0 },
      turnsEnemyAt3PS:{ 1:0, 2:0 },
      goalSwitchCount:{ 1:0, 2:0 },
      lastGoal:{ 1:null, 2:null },
      lastGoalBeforeWin:{ 1:null, 2:null },
      cardsOverdrawn:{ 1:0, 2:0 },
      keyCardsOverdrawn:{ 1:[], 2:[] },
      deckRecoveries:{ 1:0, 2:0 },
      hazardsTriggered:{ 1:0, 2:0 },
      selfMineTriggers:{ 1:0, 2:0 },
      qgThreatTurns:{ 1:0, 2:0 },
      qgBlockedOpportunities:{ 1:0, 2:0 },
      pressureEmergencyTurns:{ 1:0, 2:0 },
      recoveriesFrom0PS:{ 1:0, 2:0 },
      wasAt0PS:{ 1:false, 2:false }
    },

    f9n3Telemetry: {
      gameScaleMode: setup.gameScaleMode === "tactical" ? "tactical" : "large_scale",
      starterSpawned: { 1:{ starter_infantry:0, starter_vehicle:0, starter_structure:0 }, 2:{ starter_infantry:0, starter_vehicle:0, starter_structure:0 } },
      starterDestroyed: { 1:{ starter_infantry:0, starter_vehicle:0, starter_structure:0 }, 2:{ starter_infantry:0, starter_vehicle:0, starter_structure:0 } },
      tacticalCapBlocked: { 1:{ starter_infantry:0, starter_vehicle:0, starter_structure:0 }, 2:{ starter_infantry:0, starter_vehicle:0, starter_structure:0 } },
      starterEnergySpent: { 1:0, 2:0 },
      hqDeployments: { 1:0, 2:0 },
      hqBuilds: { 1:0, 2:0 }
    },

    // C1a – fondazione passiva carte/deck/mano.
    cardCatalog: [],
    deck: { 1: [], 2: [] },
    hand: { 1: [], 2: [] },
    discard: { 1: [], 2: [] },
    starterCards: { 1: {}, 2: {} },
    cardDebug: {
      enabled: true,
      mode: "debug_passive",
      initialized: false,
      catalogSize: 0,
      deckSize: { 1: 0, 2: 0 },
      handSize: { 1: 0, 2: 0 },
      starterSlots: { 1: {}, 2: {} }
    },

    matchId: createMatchId()
  };
}

function resetInteractionContext() {
  selectedId = null;
  mode = "idle";
  pendingAbility = null;
  pendingBuildBlueprintId = null;
  pendingPurchaseBlueprintId = null;
  pendingTacticId = null;
  pendingHandCardUid = null;
  pendingStarterCardUid = null;
  pendingDeploymentContext = null;
  pendingBuildSource = null;
}


    function createHq(side) {
      const faction = state.factions[side];
      return {
        id: `HQ-${side}-${faction}`,
        uid: `HQ-${side}-${faction}`,
        side,
        faction,
        name: `QG ${faction}`,
        type: "QG",
        weight: "Obiettivo",
        cost: 0,
        hp: 0,
        maxHp: 0,
        currentHp: 0,
        att: 0,
        baseAtt: 0,
        currentAtt: 0,
        def: 0,
        maxDef: 0,
        currentDef: 0,
        source: "QG v1.4.1 · cella occupabile",
        ability: null,
        pos: [...HQ_POS[side]],
        acted: true,
        movedThisTurn: false,
        abilityUsedThisTurn: false,
        builtThisTurn: false,
        alive: true,
        cooldownLeft: 0,
        buffs: [],
        statuses: []
      };
    }



    function createUnitFromBlueprint(bp, side) {
      const key = `${side}:${bp.id}`;
      state.instanceCounters[key] = (state.instanceCounters[key] || 0) + 1;
      const n = state.instanceCounters[key];
      return {
        ...bp,
        side,
        uid: `${bp.id}_${side}_${n}`,
        instanceNo: n,
        maxHp: bp.hp,
        currentHp: bp.hp,
        baseAtt: bp.att,
        currentAtt: bp.att,
        maxDef: bp.def,
        currentDef: bp.def,
        baseMoveBonus: bp.c1fMoveBonus || 0,
        attacksPerTurn: bp.attacksPerTurn || 1,
        attacksMade: 0,
        movedThisTurn: false,
        abilityUsedThisTurn: false,
        builtThisTurn: false,
        pos: null,
        acted: false,
        alive: true,
        cooldownLeft: 0,
        buffs: [],
        factionRules: Array.isArray(bp.factionRules) ? [...bp.factionRules] : [],
        statuses: (bp.startStatuses || []).map(st => ({ ...st }))
      };
    }
