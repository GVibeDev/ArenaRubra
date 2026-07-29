"use strict";

// Arena Rubra – Fase B4a
// State extraction prudente.
// Qui vivono lo stato globale, il contesto UI corrente e le factory base.
// Non introduce nuove meccaniche e non modifica il gameplay.

let state = null;
let selectedId = null;
let mode = "idle"; // idle | move | ability | build | spawn | tactic
let pendingAbility = null;
let pendingAbilityCoords = []; // F9S1a multi-cella abilità
let pendingBuildBlueprintId = null;
let pendingPurchaseBlueprintId = null;
let pendingTacticId = null;
let pendingTacticCoords = []; // F9S1a multi-cella tattiche
let pendingPlayerTargetContext = null; // F9Q3d1 selezione esplicita avversario
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

function readPlayerSetupValue(side, suffix, fallback) {
  const setupEl = $(`setupP${side}${suffix}`);
  const legacyEl = $(`p${side}${suffix}`);
  return setupEl ? setupEl.value : (legacyEl ? legacyEl.value : fallback);
}

function readGameSetupFromDom() {
  const mapId = $("setupMapName") ? $("setupMapName").value : "map1_starter";
  const definition = typeof getMapDefinitionById === "function" ? getMapDefinitionById(mapId) : null;
  const playerCount = Math.max(2, Math.min(4, Number(definition && definition.playerCount) || 2));
  const playerIds = Array.from({ length: playerCount }, (_, index) => index + 1);
  const factionFallbacks = { 1: "Nexus", 2: "Exordium", 3: "Liberti", 4: "Agathoi" };
  const factions = {};
  const selectedCommanders = {};
  const selectedDecks = {};
  const modes = {};
  playerIds.forEach(side => {
    factions[side] = readPlayerSetupValue(side, "Faction", factionFallbacks[side]);
    selectedCommanders[side] = readPlayerSetupValue(side, "Commander", null);
    selectedDecks[side] = readDeckSetupForSide(side);
    modes[side] = readPlayerSetupValue(side, "Mode", side === 1 ? "human" : "bot");
  });
  return {
    mapId,
    mapDefinition: definition,
    playerCount,
    playerIds,
    factions,
    selectedCommanders,
    selectedDecks,
    modes,
    autoResignEnabled: $("autoResignToggle") ? $("autoResignToggle").checked : true,
    aiMode: $("botAiMode") ? $("botAiMode").value : "advanced",
    pacePreset: $("pacePreset") ? $("pacePreset").value : "standard",
    gameScaleMode: $("gameScaleMode") ? $("gameScaleMode").value : "large_scale"
  };
}

function createInitialGameState(setup) {
  const factions = setup.factions;
  const firstPlayer = setup.firstPlayer;
  const mapDefinition = mapRuntimeNormalizeDefinition(
    setup.mapDefinition || getMapDefinitionById(setup.mapId || MAP_RUNTIME_DEFAULT_ID) || getMapDefinitionById(MAP_RUNTIME_DEFAULT_ID),
    { imported: setup.mapDefinition && setup.mapDefinition.official !== true }
  );
  const playerIds = Array.from({ length: mapDefinition.playerCount }, (_, index) => index + 1);
  const startIndex = Math.max(0, playerIds.indexOf(firstPlayer));
  const turnOrder = [...playerIds.slice(startIndex), ...playerIds.slice(0, startIndex)];
  const runtimeCells = mapDefinition.geometry.cells.map(cell => ({
    ...mapRuntimeClone(cell),
    key: coordKey(cell.coord),
    ps: cell.cellRole === "strategic_point",
    control: null
  }));

  const initialState = {
    mapId: mapDefinition.id,
    mapDefinition,
    mapRuntime: {
      schemaVersion: mapDefinition.schemaVersion,
      mapRevision: mapDefinition.metadata.revision,
      movementMultiplier: mapDefinition.movementMultiplier,
      terrainUsage: mapTerrainUsage(mapDefinition)
    },
    mapLabMode: setup.mapLabMode === true,
    mapLabSourceId: setup.mapLabSourceId || null,
    cells: runtimeCells,
    units: [],
    playerIds,
    players: playerIds.map(id => ({
      id,
      faction: factions[id],
      mode: setup.modes[id],
      eliminated: false,
      lifecycleStatus: "active",
      eliminatedAtTurn: null,
      eliminatedAtOrderIndex: null,
      eliminatedBy: null,
      eliminationReason: null
    })),
    factions,
    selectedCommanders: setup.selectedCommanders || {},
    selectedDecks: setup.selectedDecks || { 1: { mode: "template" }, 2: { mode: "template" } },
    turnOrder,
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
    initialHazards: mapRuntimeClone(mapDefinition.initialHazards || []),
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
    // F9T0 – memoria AI leggera per stallo, maturità e oscillazioni.
    aiFinalizationF9T0: { schema:"F9T0-1", players:{}, unitHistory:{} },
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

    matchId: createMatchId(),
    matchSeed: String(setup.matchSeed || ""),
    matchRngState: Number.isInteger(setup.matchRngState) ? setup.matchRngState : (typeof telemetryHashSeed === "function" ? telemetryHashSeed(setup.matchSeed || "") : 0),
    matchRngCalls: Number.isFinite(setup.matchRngCalls) ? setup.matchRngCalls : 0,
    matchTelemetry: null,
    matchTelemetryRuntime: null
  };

  const ensurePlayerValue = (container, side, fallbackFactory) => {
    if (!container || typeof container !== "object") return;
    if (container[side] === undefined) container[side] = fallbackFactory();
  };
  playerIds.forEach(side => {
    ensurePlayerValue(initialState.energy, side, () => START_ENE);
    ensurePlayerValue(initialState.turnsStarted, side, () => 0);
    ensurePlayerValue(initialState.pressure, side, () => 0);
    ensurePlayerValue(initialState.desperation, side, () => 0);
    ensurePlayerValue(initialState.playerEffects, side, () => []);
    ensurePlayerValue(initialState.c2c6b.enemyDestroyedThisTurn, side, () => 0);
    ensurePlayerValue(initialState.tacticCooldowns, side, () => ({}));
    ensurePlayerValue(initialState.tacticUsedThisTurn, side, () => false);
    ensurePlayerValue(initialState.c2eBotHandTacticsUsedThisTurn, side, () => 0);
    ensurePlayerValue(initialState.fabeotEconomyAbilityUsed, side, () => false);
    ensurePlayerValue(initialState.fabeotConversionUsed, side, () => false);
    ensurePlayerValue(initialState.energyLocked, side, () => 0);
    ensurePlayerValue(initialState.handLocked, side, () => 0);
    ensurePlayerValue(initialState.emergencyLoggedTurn, side, () => -1);
    ensurePlayerValue(initialState.missions, side, () => null);
    ensurePlayerValue(initialState.missionRewards, side, () => ({ cardCostSequence: null }));
    [
      "cyclesStarted", "recoveriesWithMission", "recoveriesWithoutMission", "missionLocksApplied",
      "missionUnlocks", "missionsReady", "missionsPlayed", "secondOrLaterPlays", "rewardsResolved",
      "aiMissionPlays", "aiMissionWaits", "targetQuotasWasted"
    ].forEach(key => ensurePlayerValue(initialState.missionTelemetry[key], side, () => 0));
    ensurePlayerValue(initialState.missionTelemetry.lastAiDecision, side, () => null);
    [
      "maxPressure", "turnsAt0PS", "turnsEnemyAt3PS", "goalSwitchCount", "cardsOverdrawn",
      "deckRecoveries", "hazardsTriggered", "selfMineTriggers", "qgThreatTurns",
      "qgBlockedOpportunities", "pressureEmergencyTurns", "recoveriesFrom0PS"
    ].forEach(key => ensurePlayerValue(initialState.aiTelemetry[key], side, () => 0));
    ensurePlayerValue(initialState.aiTelemetry.lastGoal, side, () => null);
    ensurePlayerValue(initialState.aiTelemetry.lastGoalBeforeWin, side, () => null);
    ensurePlayerValue(initialState.aiTelemetry.keyCardsOverdrawn, side, () => []);
    ensurePlayerValue(initialState.aiTelemetry.wasAt0PS, side, () => false);
    ["starterSpawned", "starterDestroyed", "tacticalCapBlocked"].forEach(key => ensurePlayerValue(initialState.f9n3Telemetry[key], side, () => ({
      starter_infantry: 0, starter_vehicle: 0, starter_structure: 0
    })));
    ["starterEnergySpent", "hqDeployments", "hqBuilds"].forEach(key => ensurePlayerValue(initialState.f9n3Telemetry[key], side, () => 0));
    ensurePlayerValue(initialState.deck, side, () => []);
    ensurePlayerValue(initialState.hand, side, () => []);
    ensurePlayerValue(initialState.discard, side, () => []);
    ensurePlayerValue(initialState.starterCards, side, () => ({}));
    ensurePlayerValue(initialState.cardDebug.deckSize, side, () => 0);
    ensurePlayerValue(initialState.cardDebug.handSize, side, () => 0);
    ensurePlayerValue(initialState.cardDebug.starterSlots, side, () => ({}));
  });
  const cellHazards = runtimeCells
    .filter(cell => cell.initialHazard && cell.initialHazard.type)
    .map(cell => ({ ...mapRuntimeClone(cell.initialHazard), coord: [...cell.coord] }));
  initialState.initialHazards = [...initialState.initialHazards, ...cellHazards]
    .filter((hazard, index, all) => all.findIndex(candidate =>
      candidate.type === hazard.type
      && sameCoord(candidate.coord, hazard.coord)
    ) === index);
  for (const hazard of cellHazards) {
    if (hazard.type === "mine") {
      initialState.mines.push({
        owner: hazard.ownerPlayerId || 0,
        coord: [...hazard.coord],
        name: "Mina della mappa",
        infantryDamage: Number(hazard.payload && hazard.payload.infantryDamage) || 1,
        vehicleDamage: Number(hazard.payload && hazard.payload.vehicleDamage) || 3,
        initialMapHazard: true
      });
    } else if (hazard.type === "trap") {
      initialState.cellEffects.push({
        kind: "cell_movement_trap",
        owner: hazard.ownerPlayerId || 0,
        coord: [...hazard.coord],
        source: "Trappola della mappa",
        turns: Number.isFinite(hazard.duration) ? hazard.duration : null,
        initialMapHazard: true
      });
    }
  }
  return initialState;
}

function resetInteractionContext() {
  selectedId = null;
  mode = "idle";
  pendingAbility = null;
  pendingAbilityCoords = [];
  pendingTacticCoords = [];
  pendingPlayerTargetContext = null;
  if (typeof closePlayerTargetSelector === "function") closePlayerTargetSelector({ silent:true });
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
        pos: [...(getMapHeadquarters(side, state.mapDefinition) || HQ_POS[side] || [0, 0, 0])],
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
