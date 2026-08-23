"use strict";

const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const uiSource = fs.readFileSync(require("path").join(__dirname, "../src/ui.js"), "utf8");
const startMarker = "// F9W1a — Match Data 2.0 Foundation";
const endMarker = "// F9W1a END";
const start = uiSource.indexOf(startMarker);
const end = uiSource.indexOf(endMarker);
assert(start >= 0 && end > start, "F9W1a block not found in src/ui.js");
const patchSource = uiSource.slice(start, end + endMarker.length);

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

function makeContext() {
  const store = new Map();
  let matchStatsStore = [];
  const logs = [];
  const lifecycle = {
    1:{ eliminatedAtTurn:null, eliminatedBy:null, eliminationReason:null, eliminationAssistSides:[], eliminationAttributionType:null },
    2:{ eliminatedAtTurn:21, eliminatedBy:4, eliminationReason:"units", eliminationAssistSides:[1], eliminationAttributionType:"direct" },
    3:{ eliminatedAtTurn:25, eliminatedBy:4, eliminationReason:"pressure", eliminationAssistSides:[], eliminationAttributionType:"direct" },
    4:{ eliminatedAtTurn:null, eliminatedBy:null, eliminationReason:null, eliminationAssistSides:[], eliminationAttributionType:null }
  };
  const unitCounts = {1:3,2:0,3:0,4:5};
  const psCounts = {1:1,2:0,3:1,4:3};

  const sandbox = {
    console,
    Date,
    JSON,
    Math,
    Number,
    String,
    Object,
    Array,
    Map,
    Set,
    Boolean,
    Intl,
    EventTypes:{ LOG_MESSAGE:"LOG_MESSAGE", MATCH_STATS_RECORDED:"MATCH_STATS_RECORDED" },
    ARENA_STORAGE_SCHEMA_VERSION:"F9P1-1",
    MATCH_TELEMETRY_SCHEMA_VERSION:"F9Q3e1-2",
    ArenaDataStore:{
      mirror:new Map(),
      pathForKey:key => `settings/legacy/${key}.json`,
      _loadRegisteredKey:async function(key){ this.mirror.set(key, store.has(key) ? clone(store.get(key)) : []); return true; }
    },
    arenaStorageReadJson:(key, fallback) => store.has(key) ? clone(store.get(key)) : clone(fallback),
    arenaStorageWriteJson:(key, value) => { store.set(key, clone(value)); return true; },
    mapRuntimePlayerIds:s => [...(s.playerIds || [1,2])],
    getPlayerById:side => lifecycle[side] || null,
    isPlayerEliminated:side => Boolean(lifecycle[side] && lifecycle[side].eliminatedAtTurn != null),
    playerLifecycleStatus:side => (lifecycle[side] && lifecycle[side].eliminatedAtTurn != null) ? "eliminated" : "active",
    countControlledPS:side => psCounts[side] || 0,
    combatUnits:side => Array.from({length:unitCounts[side] || 0}, (_,i) => ({uid:`u${side}-${i}`})),
    commanderLogLabel:side => ({1:"Varran",2:"Avatex",3:"Khar",4:"Dendros"}[side] || `Commander ${side}`),
    telemetryDeckIdentity:side => ({
      mode: side === 4 ? "custom" : "template",
      key:`deck-${side}`,
      name:`Deck ${side}`,
      official:side !== 4,
      category:"tactical",
      archetype:`A${side}`,
      commanderId:`CMD${side}`,
      commanderName:`Commander ${side}`,
      pivotId:`PIV${side}`,
      pivotName:`Pivot ${side}`,
      missionId:`MIS${side}`,
      missionName:`Mission ${side}`,
      cardCount:30
    }),
    mapTerrainUsage:() => ({free:40, rough:3}),
    buildInfoExportMeta:() => ({version:"C2-STABLE-1-F9W1a-APK-M4c", buildName:"Match Data 2.0 Foundation"}),
    currentMatchStatsObject:() => clone(sandbox.state.matchStats),
    currentMatchTelemetrySnapshot:() => ({
      schemaVersion:"F9Q3e1-2",
      matchId:sandbox.state.matchId,
      players:Object.fromEntries((sandbox.state.playerIds || []).map(side => [side,{faction:sandbox.state.factions[side]}])),
      final:{winnerSide:sandbox.state.winnerSide, round:sandbox.state.turn}
    }),
    ffaAttributionSnapshot:() => ({winnerSide:sandbox.state.winnerSide, assists:[1]}),
    updateControlFromOccupants:() => {},
    loadMatchStats:() => clone(matchStatsStore),
    saveMatchStats:items => { matchStatsStore = clone(items); },
    log:(message, type, data) => logs.push({message,type,data:clone(data)}),
    controlCenterEscape:value => String(value == null ? "" : value).replace(/[&<>]/g, ""),
    controlCenterFormatDate:value => String(value || "").slice(0,16),
    controlCenterMetricCard:(label,value,meta) => `<metric label="${label}" value="${value}" meta="${meta}"></metric>`,
    escapeHtml:value => String(value == null ? "" : value),
    state:null,
    __store:store,
    __logs:logs,
    __getMatchStats:() => clone(matchStatsStore)
  };
  vm.createContext(sandbox);
  vm.runInContext(patchSource, sandbox, {filename:"f9w1a-ui-block.js"});
  assert.strictEqual(sandbox.ArenaDataStore.pathForKey("arenaRubra.matchTelemetry.v2"), "stats/match-telemetry.json", "telemetry store must have a stable vault path");
  return sandbox;
}

function fourPlayerState() {
  return {
    matchId:"match-4p-001",
    matchRecorded:false,
    tutorialMode:false,
    mapLabMode:false,
    playerIds:[1,2,3,4],
    factions:{1:"Exordium",2:"Nexus",3:"Liberti",4:"Agathoi"},
    modes:{1:"human",2:"bot",3:"bot",4:"human"},
    selectedCommanders:{1:"EX0B00",2:"NXCMD01",3:"LX0B00",4:"AGCMD02"},
    selectedDecks:{1:{mode:"template"},2:{mode:"template"},3:{mode:"template"},4:{mode:"custom",savedKey:"deck-4"}},
    pressure:{1:2,2:0,3:1,4:5},
    energy:{1:4,2:1,3:3,4:8},
    aiMode:"advanced",
    pacePreset:"competitive",
    gameScaleMode:"tactical",
    matchSeed:"seed-4p",
    firstPlayer:3,
    mapId:"map_4p_test",
    mapDefinition:{name:"Four Player Test",schemaVersion:3,movementMultiplier:1.25,metadata:{revision:7}},
    cells:[{ps:true},{ps:true},{ps:true},{ps:true},{ps:false}],
    winnerSide:4,
    winType:"pressione",
    turn:27,
    winner:"Vittoria G4 Agathoi per Pressione Strategica.",
    events:[{type:"A"},{type:"B"},{type:"C"}],
    eventSeq:91,
    logSeq:88,
    matchStats:{
      eventCount:91,
      eventSeqMax:91,
      totals:{attacks:12},
      tactics:{"Tactic A":3,"Tactic B":1},
      abilities:{"Ability A":2},
      players:{
        1:{kills:1,assists:2,pressureGained:2},
        2:{kills:0,assists:0,pressureGained:0},
        3:{kills:2,assists:1,pressureGained:1},
        4:{kills:3,assists:0,pressureGained:5}
      }
    },
    aiTelemetry:{goalSwitchCount:{2:4,3:5}},
    f9n3Telemetry:{mission:{4:{completed:true}}},
    matchTelemetry:{schemaVersion:"F9Q3e1-2"}
  };
}

(function testCanonicalFourPlayerRecordAndSeparateTelemetry() {
  const ctx = makeContext();
  ctx.state = fourPlayerState();
  ctx.recordMatchResult();

  const rawHistory = ctx.__store.get("arenaRubra.matchHistory.v1");
  const rawTelemetry = ctx.__store.get("arenaRubra.matchTelemetry.v2");
  assert(Array.isArray(rawHistory) && rawHistory.length === 1, "one canonical history record expected");
  assert(Array.isArray(rawTelemetry) && rawTelemetry.length === 1, "one separate telemetry record expected");
  const record = rawHistory[0];
  const telemetry = rawTelemetry[0];

  assert.strictEqual(record.schemaVersion, "AR-MATCH-2");
  assert.strictEqual(record.kind, "arena-rubra-match-record");
  assert.strictEqual(record.playerCount, 4);
  assert.deepStrictEqual(Array.from(record.playerIds), [1,2,3,4]);
  assert.strictEqual(record.participants.length, 4);
  assert.strictEqual(record.participants[0].mode, "human");
  assert.strictEqual(record.participants[1].mode, "bot");
  assert.strictEqual(record.participants[3].faction, "Agathoi");
  assert.strictEqual(record.participants[3].deck.mode, "custom");
  assert.strictEqual(record.winnerSide, 4);
  assert.strictEqual(record.winnerFaction, "Agathoi");
  assert.strictEqual(record.winType, "pressione");
  assert.strictEqual(record.mapId, "map_4p_test");
  assert.strictEqual(record.mapName, "Four Player Test");
  assert.strictEqual(record.map.revision, 7);
  assert.strictEqual(record.build.version, "C2-STABLE-1-F9W1a-APK-M4c");
  assert.strictEqual(record.final.ps[4], 3);
  assert(!Object.prototype.hasOwnProperty.call(record, "matchTelemetry"), "history must not embed matchTelemetry");
  assert(!Object.prototype.hasOwnProperty.call(record, "f9n3Telemetry"), "history must not embed f9n3Telemetry");
  assert(record.telemetryRef && record.telemetryRef.matchId === record.matchId, "history must reference telemetry by matchId");

  assert.strictEqual(telemetry.schemaVersion, "AR-TELEMETRY-2");
  assert.strictEqual(telemetry.matchId, record.matchId);
  assert.strictEqual(telemetry.payload.schemaVersion, "F9Q3e1-2");
  assert.strictEqual(telemetry.payload.players[4].faction, "Agathoi");
  assert(telemetry.developerStats && telemetry.developerStats.players[4].kills === 3);
  assert(telemetry.aiTelemetry && telemetry.aiTelemetry.goalSwitchCount[3] === 5);
  assert(telemetry.f9n3Telemetry && telemetry.f9n3Telemetry.mission[4].completed === true);

  const compactStats = ctx.__getMatchStats();
  assert.strictEqual(compactStats.length, 1);
  assert.strictEqual(compactStats[0].playerCount, 4);
  assert(!compactStats[0].telemetryRef, "compatibility matchup stats must remain compact");

  const historyHtml = ctx.controlCenterHistoryHtml();
  const statsHtml = ctx.controlCenterStatisticsHtml();
  assert(historyHtml.includes("G4 Agathoi"), "history UI must show player 4");
  assert(statsHtml.includes("G3 Liberti"), "statistics UI must show player 3");
  const csv = ctx.statsToCsv();
  assert(csv.includes("G4:Agathoi"), "CSV must retain player 4");
  assert(csv.includes("G2:bot"), "CSV must retain control mode");
  const telemetrySource = ctx.controlCenterTelemetrySource();
  assert.strictEqual(telemetrySource.source, "Partita attiva");
  ctx.state = null;
  const persistedSource = ctx.controlCenterTelemetrySource();
  assert.strictEqual(persistedSource.source, "Ultimo match registrato");
  assert.strictEqual(persistedSource.telemetry.schemaVersion, "F9Q3e1-2");

  const envelope = ctx.arenaStorageMatchHistoryEnvelope();
  assert.strictEqual(envelope.recordSchemaVersion, "AR-MATCH-2");
  assert.strictEqual(envelope.telemetryStorageKey, "arenaRubra.matchTelemetry.v2");
  assert.strictEqual(envelope.matches.length, 1);
  assert(ctx.controlCenterKnownStorageKeys().includes("arenaRubra.matchTelemetry.v2"), "backup keys must include telemetry store");
})();

(function testLegacyMigrationIsIdempotentAndExtractsTelemetry() {
  const ctx = makeContext();
  ctx.__store.set("arenaRubra.matchHistory.v1", [{
    id:"legacy-001",
    at:"2026-08-20T12:00:00.000Z",
    p1Faction:"Exordium",
    p2Faction:"Nexus",
    p1Mode:"human",
    p2Mode:"bot",
    p1Commander:"Varran",
    p2Commander:"Avatex",
    playerIds:[1,2],
    playerCount:2,
    players:{1:{faction:"Exordium",mode:"human",kills:2,ps:2,pressure:5,units:4,energy:3},2:{faction:"Nexus",mode:"bot",kills:1,ps:1,pressure:1,units:1,energy:0}},
    selectedDecks:{1:{mode:"template"},2:{mode:"template"}},
    mapId:"map1_starter",
    mapName:"Campo Starter",
    mapRevision:1,
    mapSchemaVersion:2,
    mapCellCount:61,
    terrainUsage:{free:61},
    movementMultiplier:1,
    aiMode:"advanced",
    pacePreset:"competitive",
    gameScaleMode:"tactical",
    winnerSide:1,
    winnerFaction:"Exordium",
    loserFactions:["Nexus"],
    winType:"qg",
    round:22,
    ps:{1:2,2:1},
    pressure:{1:5,2:1},
    energy:{1:3,2:0},
    units:{1:4,2:1},
    totals:{attacks:9},
    matchTelemetry:{schemaVersion:"F9Q3e1-2",players:{1:{faction:"Exordium"},2:{faction:"Nexus"}}},
    f9n3Telemetry:{legacy:true},
    attribution:{winnerSide:1}
  }]);

  const first = ctx.arenaMatchDataMigrateLegacyHistoryF9W1a();
  assert.strictEqual(first.migrated, 1);
  assert.strictEqual(first.telemetryExtracted, 1);
  const raw = ctx.__store.get("arenaRubra.matchHistory.v1");
  assert.strictEqual(raw[0].schemaVersion, "AR-MATCH-2");
  assert.strictEqual(raw[0].participants.length, 2);
  assert(!Object.prototype.hasOwnProperty.call(raw[0], "matchTelemetry"));
  assert(!Object.prototype.hasOwnProperty.call(raw[0], "f9n3Telemetry"));
  const telemetry = ctx.__store.get("arenaRubra.matchTelemetry.v2");
  assert.strictEqual(telemetry.length, 1);
  assert.strictEqual(telemetry[0].matchId, "legacy-001");
  assert.strictEqual(telemetry[0].payload.schemaVersion, "F9Q3e1-2");
  assert.strictEqual(telemetry[0].f9n3Telemetry.legacy, true);

  const second = ctx.arenaMatchDataMigrateLegacyHistoryF9W1a();
  assert.strictEqual(second.migrated, 0, "second migration must be idempotent");
  assert.strictEqual(second.telemetryExtracted, 0, "second migration must not duplicate telemetry");
  assert.strictEqual(ctx.__store.get("arenaRubra.matchTelemetry.v2").length, 1);
})();

(function testTutorialAndMatchLabStayExcluded() {
  const ctx = makeContext();
  const tutorial = fourPlayerState();
  tutorial.matchId = "tutorial-excluded";
  tutorial.tutorialMode = true;
  tutorial.playerIds = [1,2];
  tutorial.factions = {1:"Exordium",2:"Nexus"};
  tutorial.modes = {1:"human",2:"human"};
  tutorial.matchRecorded = false;
  ctx.state = tutorial;
  ctx.recordMatchResult();
  assert.strictEqual(ctx.state.matchRecorded, true);
  assert(!ctx.__store.has("arenaRubra.matchHistory.v1"), "tutorial must not enter history");

  const lab = fourPlayerState();
  lab.matchId = "lab-excluded";
  lab.mapLabMode = true;
  lab.matchRecorded = false;
  ctx.state = lab;
  ctx.recordMatchResult();
  assert.strictEqual(ctx.state.matchRecorded, true);
  assert(!ctx.__store.has("arenaRubra.matchHistory.v1"), "Match Lab must not enter history");
  assert(ctx.__logs.some(item => /Match Lab esclusa/.test(item.message)), "Match Lab exclusion should be logged");
})();

console.log("F9W1a Match Data 2.0 smoke: PASS");
