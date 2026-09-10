"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const pressurePerceptionSource = read("src/ai/pressure_perception.js");
const finalizationMemorySource = read("src/ai/finalization_memory.js");
const factionMaturitySource = read("src/ai/faction_maturity.js");
const garrisonPlanningSource = read("src/ai/garrison_planning.js");
const strategicStatusSource = read("src/ai/strategic_status.js");
const aiSource = read("src/ai.js");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => {
  assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected, message);
  checks += 1;
};

const CENTER = [0, 0, 0];
const OWN_HQ = [5, -5, 0];
const ENEMY_HQ = [-5, 5, 0];
const CELL_COORDS = [CENTER, [1, -1, 0], [2, -2, 0], [-1, 1, 0], [-2, 2, 0]];
const distance = (left, right) => Math.max(...left.map((value, index) => Math.abs(value - right[index])));
const same = (left, right) => Boolean(left && right && left.length === right.length && left.every((value, index) => value === right[index]));

function unit(uid, side, pos, type = "Fanteria", extra = {}) {
  return { uid, side, pos:[...pos], type, alive:true, acted:false, ...extra };
}

function createHarness(options = {}) {
  const profile = {
    totalPs:5,
    requiredPs:3,
    centralCoord:[...CENTER],
    startRound:20,
    pressureWin:5,
    maxRound:35,
    ...(options.profile || {})
  };
  const state = {
    turn:options.turn === undefined ? 10 : options.turn,
    winner:null,
    factions:{1:options.faction || "Nexus", 2:"Exordium"},
    pressure:{1:0, 2:0, ...(options.pressure || {})},
    cells:CELL_COORDS.map((coord, index) => ({ id:`PS${index}`, coord:[...coord], ps:true, control:(options.controls || [1, 1, 2, 2, null])[index] })),
    units:[
      unit("hq-1", 1, OWN_HQ, "QG"),
      unit("hq-2", 2, ENEMY_HQ, "QG"),
      ...(options.units || [])
    ]
  };
  const calls = { progress:0, nexus:0, agathoi:0, garrison:0, defaultMoves:0, customMoves:0 };
  const garrison = { schema:"characterized-garrison", player:1 };
  const context = vm.createContext({
    console,
    state,
    __profile:profile,
    __strategic:{ posture:"equilibrio", unitDelta:0, incomeDelta:0, ...(options.strategic || {}) },
    __stalledRounds:Number(options.stalledRounds) || 0,
    __nexusMaturity:{ mature:Boolean(options.networkMature), source:"nexus-characterization" },
    __agathoiMaturity:{ mature:Boolean(options.greenLineMature), source:"agathoi-characterization" },
    __calls:calls,
    __garrison:garrison,
    __garrisonObserved:null,
    CENTER_PS_COORD:[...CENTER],
    CENTER_OPENING_END_ROUND:3,
    CENTER_CONTEST_END_ROUND:5,
    QG_THREAT_RANGE:2,
    PRESSURE_WIN:5,
    MAX_ROUND:35,
    EventTypes:{},
    enemyOf:player => player === 1 ? 2 : 1,
    countControlledPS:player => state.cells.filter(cell => cell.ps && cell.control === player).length,
    getHq:player => state.units.find(entry => entry.alive !== false && entry.side === player && entry.type === "QG") || null,
    combatUnits:player => state.units.filter(entry => entry.alive !== false && entry.side === player && entry.type !== "QG"),
    getUnitAt:coord => state.units.find(entry => entry.alive !== false && same(entry.pos, coord)) || null,
    sameCoord:same,
    hexDistance:distance,
    getCentralStrategicPointCoord:() => [...CENTER],
    pressureRuleProfile:() => profile,
    playerControlsCentralStrategicPoint:player => state.cells[0].control === player,
    pressureStartRound:() => profile.startRound,
    pressureWinLimit:() => profile.pressureWin,
    maxRoundLimit:() => profile.maxRound,
    movementRangeFor:entry => entry.type === "Veicolo" ? 2 : 1,
    movableCells:() => { calls.defaultMoves += 1; return []; }
  });
  vm.runInContext(`${pressurePerceptionSource}\n${finalizationMemorySource}\n${factionMaturitySource}\n${garrisonPlanningSource}\n${strategicStatusSource}\n${aiSource}`, context, { filename:"ai-strategic-status-characterization.js" });
  vm.runInContext(`
    evaluateBotStrategicState = () => __strategic;
    botUpdateFinalizationMemoryF9T0 = () => { __calls.progress += 1; return { stalledRounds:__stalledRounds }; };
    botNexusNetworkMaturityF9T0 = (player, pressureProfile) => {
      __calls.nexus += 1;
      __calls.nexusPlayer = player;
      __calls.nexusRequiredPs = pressureProfile.requiredPs;
      return __nexusMaturity;
    };
    botAgathoiGreenLineMaturityF9T0 = (player, pressureProfile) => {
      __calls.agathoi += 1;
      __calls.agathoiPlayer = player;
      __calls.agathoiRequiredPs = pressureProfile.requiredPs;
      return __agathoiMaturity;
    };
    botBuildGarrisonPlanF9T0 = (player, status) => {
      __calls.garrison += 1;
      __garrisonObserved = {
        player,
        mode:status.mode,
        hasGarrisonPlan:Object.prototype.hasOwnProperty.call(status, "garrisonPlan")
      };
      return __garrison;
    };
  `, context);
  const evaluate = customMoves => {
    if (customMoves) {
      context.__options = {
        movesFor:entry => {
          calls.customMoves += 1;
          return customMoves(entry);
        }
      };
    } else {
      context.__options = {};
    }
    return vm.runInContext("strategicStatus(1, __options)", context);
  };
  return { context, state, profile, calls, garrison, evaluate };
}

const projection = status => ({
  player:status.player,
  enemy:status.enemy,
  ownPs:status.ownPs,
  enemyPs:status.enemyPs,
  ownPressure:status.ownPressure,
  enemyPressure:status.enemyPressure,
  ownControlsCentral:status.ownControlsCentral,
  enemyControlsCentral:status.enemyControlsCentral,
  ownPressureQualified:status.ownPressureQualified,
  enemyPressureQualified:status.enemyPressureQualified,
  ownPressureNearQualified:status.ownPressureNearQualified,
  enemyPressureNearQualified:status.enemyPressureNearQualified,
  pressureWindow:status.pressureWindow,
  pressureDanger:status.pressureDanger,
  pressureEmergency:status.pressureEmergency,
  zeroPsRecovery:status.zeroPsRecovery,
  defendQGRecovery:status.defendQGRecovery,
  hqDanger:status.hqDanger,
  roundDanger:status.roundDanger,
  allIn:status.allIn,
  active:status.active,
  mode:status.mode,
  winning:status.winning,
  losing:status.losing,
  pressureWinPlan:status.pressureWinPlan,
  qgWinPlan:status.qgWinPlan,
  enemyPressurePlan:status.enemyPressurePlan,
  closePressureLock:status.closePressureLock,
  finalizationStall:status.finalizationStall
});

let harness = createHarness();
const baselineState = JSON.stringify(harness.state);
let status = harness.evaluate();
eq(projection(status), {
  player:1, enemy:2, ownPs:2, enemyPs:2, ownPressure:0, enemyPressure:0,
  ownControlsCentral:true, enemyControlsCentral:false,
  ownPressureQualified:false, enemyPressureQualified:false,
  ownPressureNearQualified:true, enemyPressureNearQualified:false,
  pressureWindow:false, pressureDanger:false, pressureEmergency:false,
  zeroPsRecovery:false, defendQGRecovery:false, hqDanger:false,
  roundDanger:false, allIn:false, active:false, mode:"normal",
  winning:false, losing:false, pressureWinPlan:false, qgWinPlan:false,
  enemyPressurePlan:false, closePressureLock:false, finalizationStall:false
}, "balanced midgame produces the exact normal strategic projection");
eq(JSON.stringify(harness.state), baselineState, "status orchestration is state-read-only when its memory collaborator is isolated");
eq(harness.calls, {
  progress:1, nexus:1, agathoi:1, garrison:1, defaultMoves:0, customMoves:0,
  nexusPlayer:1, nexusRequiredPs:3, agathoiPlayer:1, agathoiRequiredPs:3
}, "memory, maturity and garrison collaborators run exactly once with the canonical threshold");
eq(status.garrisonPlan, harness.garrison, "garrison collaborator result is attached unchanged");
eq(harness.context.__garrisonObserved, {player:1, mode:"normal", hasGarrisonPlan:false}, "garrison planning observes the completed status before attachment");
eq(Object.keys(status).sort(), [
  "active", "agathoiMaturity", "allIn", "center", "centerLostEarly", "centerOccupant",
  "centerOpening", "closePressureLock", "closestQGRaiderDistance", "defendQGRecovery",
  "doctrineActive", "enemy", "enemyControlsCentral", "enemyHq", "enemyOnOwnHq", "enemyPressure",
  "enemyPressureNearQualified", "enemyPressurePlan", "enemyPressureQualified", "enemyPs", "enemyUnits",
  "enemiesNearOwnHq", "finalizationStall", "garrisonPlan", "greenLineMature", "hqDanger", "losing",
  "midgame", "mode", "networkMature", "nexusMaturity", "ownControlsCentral", "ownHq", "ownPressure",
  "ownPressureNearQualified", "ownPressureQualified", "ownPs", "ownUnits", "player", "pressureDanger",
  "pressureEmergency", "pressureProfile", "pressureWinPlan", "pressureWindow", "qgClosingPossible",
  "qgImmediateMove", "qgImmediateOccupy", "qgPreparedSequence", "qgRaiders", "qgStrongSequence",
  "qgWinPlan", "roundDanger", "stalledRounds", "strategic", "winning", "zeroPsRecovery"
].sort(), "strategic status publishes the frozen legacy result shape");

harness = createHarness({turn:2, controls:[null, 1, 2, null, null]});
status = harness.evaluate();
eq({centerOpening:status.centerOpening, centerLostEarly:status.centerLostEarly, active:status.active, mode:status.mode},
  {centerOpening:true, centerLostEarly:false, active:true, mode:"contesta_centro"},
  "neutral central PS activates the opening contest mode");

harness = createHarness({turn:2, controls:[2, 1, 2, null, null]});
status = harness.evaluate();
eq({centerOpening:status.centerOpening, centerLostEarly:status.centerLostEarly, mode:status.mode},
  {centerOpening:true, centerLostEarly:true, mode:"contesta_centro"},
  "enemy central control during the opening preserves the early-loss signal");

harness = createHarness({turn:18, profile:{requiredPs:2}, controls:[2, 1, 2, null, null]});
status = harness.evaluate();
eq({pressureWindow:status.pressureWindow, enemyPressureQualified:status.enemyPressureQualified, pressureEmergency:status.pressureEmergency, pressureDanger:status.pressureDanger, allIn:status.allIn, mode:status.mode},
  {pressureWindow:true, enemyPressureQualified:true, pressureEmergency:true, pressureDanger:true, allIn:false, mode:"rompi_controllo_ps"},
  "qualified enemy Pressure selects the break-control emergency before generic danger");

harness = createHarness({turn:10, controls:[2, 2, null, null, null]});
status = harness.evaluate();
eq({ownPs:status.ownPs, enemyPs:status.enemyPs, pressureEmergency:status.pressureEmergency, zeroPsRecovery:status.zeroPsRecovery, mode:status.mode},
  {ownPs:0, enemyPs:2, pressureEmergency:false, zeroPsRecovery:true, mode:"recupero_ps"},
  "zero strategic points select recovery outside the Pressure window");

harness = createHarness({
  turn:10,
  profile:{requiredPs:4},
  controls:[1, 1, 2, 2, 2],
  units:[unit("enemy-near-hq", 2, [4, -4, 0])]
});
status = harness.evaluate();
eq({hqDanger:status.hqDanger, defendQGRecovery:status.defendQGRecovery, pressureEmergency:status.pressureEmergency, allIn:status.allIn, mode:status.mode},
  {hqDanger:true, defendQGRecovery:true, pressureEmergency:false, allIn:false, mode:"difesa_qg_recupero_ps"},
  "nearby HQ threat plus territorial deficit selects defence-with-recovery");

harness = createHarness({units:[unit("enemy-on-hq", 2, OWN_HQ)]});
status = harness.evaluate();
eq({enemyOnOwnHq:status.enemyOnOwnHq.uid, hqDanger:status.hqDanger, allIn:status.allIn, mode:status.mode},
  {enemyOnOwnHq:"enemy-on-hq", hqDanger:true, allIn:true, mode:"tutto_per_tutto"},
  "direct HQ occupation has all-in precedence over defence modes");

harness = createHarness({turn:30, profile:{requiredPs:4}, controls:[1, 2, 2, null, null]});
status = harness.evaluate();
eq({pressureDanger:status.pressureDanger, roundDanger:status.roundDanger, allIn:status.allIn, mode:status.mode},
  {pressureDanger:false, roundDanger:true, allIn:false, mode:"finale"},
  "round-limit disadvantage selects the finale mode without inventing Pressure danger");

harness = createHarness({turn:10, controls:[2, 1, 2, null, null], strategic:{posture:"svantaggio"}});
status = harness.evaluate();
eq({enemyPressureNearQualified:status.enemyPressureNearQualified, pressureEmergency:status.pressureEmergency, pressureDanger:status.pressureDanger, losing:status.losing, enemyPressurePlan:status.enemyPressurePlan, mode:status.mode},
  {enemyPressureNearQualified:true, pressureEmergency:false, pressureDanger:false, losing:true, enemyPressurePlan:true, mode:"difesa_pressione"},
  "losing posture recognizes an enemy Pressure plan before the formal Pressure window");

harness = createHarness({turn:22, controls:[1, 1, 1, 2, null], pressure:{1:4}, strategic:{posture:"vantaggio", incomeDelta:0}});
status = harness.evaluate();
eq({winning:status.winning, ownPressureQualified:status.ownPressureQualified, closePressureLock:status.closePressureLock, qgWinPlan:status.qgWinPlan, pressureWinPlan:status.pressureWinPlan, mode:status.mode},
  {winning:true, ownPressureQualified:true, closePressureLock:true, qgWinPlan:false, pressureWinPlan:true, mode:"vittoria_pressione"},
  "qualified four-of-five Pressure selects the close-pressure plan");

harness = createHarness({
  turn:22,
  controls:[1, 1, 1, 2, null],
  pressure:{1:4},
  strategic:{posture:"vantaggio", incomeDelta:0},
  units:[unit("immediate-raider", 1, [-4, 4, 0])]
});
status = harness.evaluate(() => [[...ENEMY_HQ]]);
eq({qgImmediateMove:status.qgImmediateMove, closePressureLock:status.closePressureLock, qgWinPlan:status.qgWinPlan, pressureWinPlan:status.pressureWinPlan, mode:status.mode},
  {qgImmediateMove:true, closePressureLock:true, qgWinPlan:true, pressureWinPlan:false, mode:"vittoria_qg"},
  "immediate legal HQ occupation outranks an otherwise closed Pressure plan");
eq({customMoves:harness.calls.customMoves, defaultMoves:harness.calls.defaultMoves}, {customMoves:1, defaultMoves:0},
  "options.movesFor is the authoritative movement query when supplied");

harness = createHarness({
  turn:22,
  controls:[1, 1, 2, 2, null],
  strategic:{posture:"vantaggio"},
  units:[unit("raider-a", 1, [-3, 3, 0]), unit("raider-b", 1, [-3, 4, -1])]
});
status = harness.evaluate();
eq({qgRaiders:status.qgRaiders, closestQGRaiderDistance:status.closestQGRaiderDistance, qgStrongSequence:status.qgStrongSequence, qgClosingPossible:status.qgClosingPossible, qgWinPlan:status.qgWinPlan, mode:status.mode},
  {qgRaiders:2, closestQGRaiderDistance:2, qgStrongSequence:true, qgClosingPossible:true, qgWinPlan:true, mode:"vittoria_qg"},
  "two nearby raiders activate the strong HQ-closing sequence");

harness = createHarness({stalledRounds:2, faction:"Nexus"});
status = harness.evaluate();
eq({stalledRounds:status.stalledRounds, finalizationStall:status.finalizationStall, doctrineActive:status.doctrineActive, active:status.active, mode:status.mode},
  {stalledRounds:2, finalizationStall:true, doctrineActive:true, active:true, mode:"sblocco_stallo"},
  "two stalled rounds activate the Nexus finalization escape mode");

harness = createHarness({stalledRounds:2, faction:"Liberti"});
status = harness.evaluate();
eq({finalizationStall:status.finalizationStall, doctrineActive:status.doctrineActive, active:status.active, mode:status.mode},
  {finalizationStall:false, doctrineActive:false, active:false, mode:"normal"},
  "the same stall does not activate the faction-limited escape mode for Liberti");

const strategicStart = aiSource.indexOf("function strategicStatus");
const strategicEnd = aiSource.indexOf("function logEmergencyIfNeeded", strategicStart);
const strategicSource = aiSource.slice(strategicStart, strategicEnd);
ok(strategicStart >= 0 && strategicEnd > strategicStart, "strategicStatus source span is uniquely addressable");
ok(!/document|localStorage|sessionStorage|indexedDB|window\./.test(`${strategicStatusSource}\n${strategicSource}`), "strategic-status boundary and facade have no DOM or persistence dependency");
ok(strategicSource.includes("botUpdateFinalizationMemoryF9T0(player)"), "current status orchestration explicitly crosses the AI-memory boundary");
ok(strategicSource.includes("botBuildGarrisonPlanF9T0(player, result)"), "current status orchestration explicitly crosses the garrison-planning boundary");
ok(strategicSource.includes('typeof options.movesFor === "function"'), "movement reachability remains an injectable characterization seam");
ok(strategicStatusSource.includes('mode = "rompi_controllo_ps"') && strategicStatusSource.includes('mode = "vittoria_qg"'), "characterized mode composition has one boundary owner");

console.log(`AR-AC1 AI strategic status characterization smoke: ${checks}/${checks} OK`);
