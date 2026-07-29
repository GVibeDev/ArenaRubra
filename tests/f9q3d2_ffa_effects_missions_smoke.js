"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
let checks = 0;
const ok = (value, label) => { assert.ok(value, label); checks += 1; };
const eq = (actual, expected, label) => { assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected, label); checks += 1; };

const emitted = [];
const logs = [];
const ctx = {
  console, Object, Array, Number, Boolean, Math, Set, Map, Date, JSON,
  document:{},
  BUILD_INFO:{version:"C2-STABLE-1-F9Q3d2-APK-M4c"},
  CENTER_PS_COORD:[0,0,0],
  EventTypes:{
    UNIT_SPAWNED:"UNIT_SPAWNED", UNIT_BUILT:"UNIT_BUILT", UNIT_ATTACKED:"UNIT_ATTACKED", UNIT_DAMAGED:"UNIT_DAMAGED", UNIT_DESTROYED:"UNIT_DESTROYED",
    ABILITY_USED:"ABILITY_USED", TACTIC_USED:"TACTIC_USED", STATUS_APPLIED:"STATUS_APPLIED", ECONOMY_CHANGED:"ECONOMY_CHANGED", UNIT_CONVERTED:"UNIT_CONVERTED",
    CARD_DRAWN:"CARD_DRAWN", CARD_PLAYED:"CARD_PLAYED", CARD_DISCARDED:"CARD_DISCARDED", MISSION_PROGRESS_CHANGED:"MISSION_PROGRESS_CHANGED", MISSION_READY:"MISSION_READY",
    MISSION_CHECKPOINT:"MISSION_CHECKPOINT", MISSION_REWARD_RESOLVED:"MISSION_REWARD_RESOLVED", MISSION_REWARD_PENDING:"MISSION_REWARD_PENDING"
  },
  state:null,
  botRunning:false,
  playerName(side) { return `G${side}`; },
  mapRuntimePlayerIds(source) { return (source.players || []).map(p => Number(p.id)); },
  getEnemyPlayers(side) { return ctx.state.players.filter(p => !p.eliminated && Number(p.id) !== Number(side)).map(p => Number(p.id)); },
  isPlayerEliminated(side) { return Boolean(ctx.state.players.find(p => Number(p.id) === Number(side))?.eliminated); },
  combatUnits(side=null) { return ctx.state.units.filter(u => u.alive && (side == null || Number(u.side) === Number(side))); },
  countControlledPS(side) { return Number(ctx.state.controlledPs[side] || 0); },
  getHq(side) { return ctx.state.hqs[side] || null; },
  sameCoord(a,b) { return Boolean(a && b && a.length === 3 && a.every((v,i)=>v===b[i])); },
  hexDistance(a,b) { return Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2])); },
  areAdjacent(a,b) { return ctx.hexDistance(a,b) === 1; },
  isProtectedHandCard(card) { return Boolean(card && ["mission","commander"].includes(card.deckRole)); },
  discardableHandCards(side) { return ctx.state.hand[side].filter(card => !ctx.isProtectedHandCard(card)); },
  discardCard(side, uid) {
    const hand = ctx.state.hand[side] || [];
    const index = hand.findIndex(card => card.cardUid === uid);
    if (index < 0) return null;
    const [card] = hand.splice(index,1);
    ctx.state.discard[side].push(card);
    return card;
  },
  emitGameEvent(event) { emitted.push(event); return event; },
  log(message) { logs.push(String(message)); },
  renderAll() {},
  closePlayerTargetSelector() { ctx.closedSelector = true; },
  requestPlayerTargetSelection(options) { ctx.selectorOptions = options; return true; },
  missionUiOpenPanel(side) { ctx.openedMissionPanel = side; },
  hasStatus() { return false; },
  isUntargetableTo() { return false; },
  BLUEPRINTS:[]
};
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const file of ["data/missions_base.js","src/player_targeting.js","src/missions.js","src/mission_rewards.js"]) {
  vm.runInContext(read(file), ctx, {filename:file});
}
// Replace the browser overlay with a deterministic harness after loading the real targeting helpers.
ctx.requestPlayerTargetSelection = options => { ctx.selectorOptions = options; return true; };
ctx.closePlayerTargetSelector = () => { ctx.closedSelector = true; return true; };
const evalIn = code => vm.runInContext(code, ctx);

ctx.state = {
  players:[{id:1},{id:2},{id:3},{id:4,eliminated:true}],
  factions:{1:"Fabeot",2:"Nexus",3:"Exordium",4:"Liberti"},
  modes:{1:"human",2:"bot",3:"human",4:"bot"},
  currentPlayer:1, turn:8, winner:null,
  energy:{1:4,2:8,3:9,4:20}, pressure:{1:0,2:2,3:4,4:9},
  controlledPs:{1:0,2:2,3:0,4:5},
  cells:[{coord:[0,0,0],ps:true,control:2}],
  hqs:{1:{side:1,pos:[-8,0,8]},2:{side:2,pos:[8,0,-8]},3:{side:3,pos:[0,4,-4]},4:{side:4,pos:[0,-8,8]}},
  units:[
    {uid:"own-near-3",side:1,type:"Fanteria",alive:true,pos:[0,3,-3]},
    {uid:"e2-pivot",side:2,type:"Veicolo",weight:"Pivot",alive:true,pos:[2,0,-2]},
    {uid:"e2-line",side:2,type:"Fanteria",alive:true,pos:[3,0,-3]},
    {uid:"e3-commander",side:3,type:"Comandante",role:"commander",alive:true,pos:[0,2,-2]},
    {uid:"e3-line",side:3,type:"Veicolo",alive:true,pos:[1,2,-3]},
    {uid:"e4-line",side:4,type:"Fanteria",alive:true,pos:[0,-3,3]}
  ],
  hand:{
    1:[],
    2:[{cardUid:"2a",id:"2a",name:"A",cost:1},{cardUid:"2b",id:"2b",name:"B",cost:2},{cardUid:"2c",id:"2c",name:"C",cost:3},{cardUid:"2d",id:"2d",name:"D",cost:4},{cardUid:"2m",id:"2m",name:"Missione",deckRole:"mission"}],
    3:[{cardUid:"3a",id:"3a",name:"E",cost:3},{cardUid:"3b",id:"3b",name:"F",cost:4}],
    4:[{cardUid:"4a",id:"4a",name:"G",cost:1}]
  },
  deck:{1:[],2:[],3:[],4:[]}, discard:{1:[],2:[],3:[],4:[]},
  missions:{1:null,2:null,3:null,4:null}, missionPendingReward:null, missionRewards:null
};

// Static profile and declared FFA scopes.
eq(evalIn("MISSION_FFA_PROFILE"), "F9Q3d2-ffa-mission-semantics-v1", "FFA mission profile");
eq(evalIn("MISSION_DEFINITIONS.length"), 15, "all 15 missions retained");
ok(evalIn("MISSION_DEFINITIONS.every(def => missionObjectivesFor(def).every(item => !item.metric.startsWith('enemy_') || item.enemyScope || ['enemy_units_destroyed','enemy_structures_destroyed','enemy_units_destroyed_in_owner_turn','enemy_faction_units_controlled','enemy_energy_manipulations'].includes(item.metric)))"), "enemy mission conditions have explicit or cumulative semantics");
eq(evalIn("MISSION_DEFINITIONS.find(d=>d.id==='FBMSN01').reward.targetScope"), "chosen_active_enemy", "energy reward scope explicit");
eq(evalIn("MISSION_DEFINITIONS.find(d=>d.id==='FBMSND01').reward.targetScope"), "all_active_enemy_units", "Anatema scope explicit");

// Active opponents and current-state FFA metrics.
eq(evalIn("missionEnemySides(1)"), [2,3], "active opponents exclude owner and eliminated player");
eq(evalIn("missionEnemyUnits(1).map(u=>u.uid).sort()"), ["e2-line","e2-pivot","e3-commander","e3-line"], "enemy units aggregate active opponents");
ok(evalIn("missionUnitNearEnemyHq(1,2)"), "unit can satisfy distance near any active enemy HQ");
let def = evalIn("missionDefinitionById('NXMSND01')");
ctx.state.missions[1] = evalIn("createMissionRuntime(1,missionDefinitionById('NXMSND01'))");
let pressure = evalIn("missionResolveMetric(1,missionDefinitionById('NXMSND01').conditions[1],state.missions[1],{})");
eq({current:pressure.current,satisfied:pressure.satisfied,source:pressure.sourceEnemySide||null},{current:4,satisfied:true,source:null},"enemy pressure uses maximum active opponent");
let paired = evalIn("missionResolveMetric(1,missionDefinitionById('NXMSND01').conditions[2],state.missions[1],{})");
ok(!paired.satisfied, "Pivot and Commander split across opponents do not satisfy same-enemy condition");
ctx.state.units.push({uid:"e2-commander",side:2,type:"Comandante",role:"commander",alive:true,pos:[4,0,-4]});
paired = evalIn("missionResolveMetric(1,missionDefinitionById('NXMSND01').conditions[2],state.missions[1],{})");
ok(paired.satisfied && paired.sourceEnemySide === 2, "same active opponent with Pivot and Commander satisfies condition");

// Consecutive enemy turns are tracked independently by opponent.
ctx.state.missions[1] = evalIn("createMissionRuntime(1,missionDefinitionById('EXMSND01'))");
for (let cycle=0; cycle<3; cycle += 1) {
  evalIn("missionEvaluateSide(1,'side2-turn',{checkpoint:'turn_start',side:2,round:state.turn})");
  evalIn("missionEvaluateSide(1,'side3-turn',{checkpoint:'turn_start',side:3,round:state.turn})");
}
eq(evalIn("state.missions[1].entries.c2.streakByEnemy[2]"), 3, "side 2 keeps its own streak across other players turns");
eq(evalIn("state.missions[1].entries.c2.streakByEnemy[3]"), 0, "side 3 has independent failed streak");
ok(evalIn("state.missions[1].entries.c2.completed"), "same-opponent streak completes after three personal turns");
eq(evalIn("state.missions[1].entries.c2.sourceEnemySide"), 2, "streak attribution records opponent");

// Historical cumulative events aggregate every opponent, including later eliminated sides.
ctx.state.missions[1] = evalIn("createMissionRuntime(1,missionDefinitionById('EXMSN01'))");
evalIn("missionTrackerHandleEvent({type:EventTypes.UNIT_DESTROYED,data:{side:2,destroyedBySide:1,unitType:'Fanteria'}})");
evalIn("missionTrackerHandleEvent({type:EventTypes.UNIT_DESTROYED,data:{side:3,destroyedBySide:1,unitType:'Struttura'}})");
evalIn("missionTrackerHandleEvent({type:EventTypes.UNIT_DESTROYED,data:{side:1,destroyedBySide:2,unitType:'Veicolo'}})");
evalIn("missionTrackerHandleEvent({type:EventTypes.UNIT_DESTROYED,data:{side:1,destroyedBySide:3,unitType:'Struttura'}})");
evalIn("missionTrackerHandleEvent({type:EventTypes.UNIT_CONVERTED,data:{oldSide:3,newSide:1}})");
eq(evalIn("state.missions[1].counters.enemyUnitsDestroyed"), 2, "kills aggregate across multiple opponents");
eq(evalIn("state.missions[1].counters.enemyStructuresDestroyed"), 1, "enemy structure kill aggregated");
eq(evalIn("state.missions[1].counters.ownUnitsDestroyedByEnemy"), 2, "losses aggregate across multiple opponents");
eq(evalIn("state.missions[1].counters.ownStructuresDestroyedByEnemy"), 1, "own structure losses aggregated");
eq(evalIn("state.missions[1].counters.enemyFactionUnitsControlled"), 1, "conversion from any opponent counted");

// Human FFA reward selects one explicit active opponent.
ctx.state.missions[1] = evalIn("createMissionRuntime(1,missionDefinitionById('FBMSN01'))");
let result = evalIn("missionCreatePlayerRewardSelection(1,missionDefinitionById('FBMSN01'))");
ok(result.pending, "human FFA reward opens target selection");
eq(result.targetSides, [2,3], "reward target list contains all active opponents");
ok(ctx.selectorOptions && ctx.selectorOptions.allowCancel === false, "mission target selection is non-cancellable");
ok(evalIn("missionRewardConfirmPlayerTarget(3)"), "chosen energy target confirmed");
eq(ctx.state.energy[2], 8, "unchosen opponent energy unchanged");
eq(ctx.state.energy[3], 5, "chosen opponent loses floor half energy");
eq(evalIn("state.missions[1].rewardResult.targetSide"), 3, "energy reward records target attribution");

// Cospirazione targets one opponent; the selected bot discards half ordinary hand only.
ctx.state.missionPendingReward = null;
ctx.state.missions[1] = evalIn("createMissionRuntime(1,missionDefinitionById('FBMSN02'))");
result = evalIn("missionCreatePlayerRewardSelection(1,missionDefinitionById('FBMSN02'))");
eq(result.targetSides, [2,3], "discard reward offers both eligible opponents");
ok(evalIn("missionRewardConfirmPlayerTarget(2)"), "discard target confirmed");
eq(ctx.state.hand[2].filter(c=>c.deckRole!=='mission').length, 2, "chosen bot discards half of four ordinary cards");
eq(ctx.state.hand[2].filter(c=>c.deckRole==='mission').length, 1, "protected Mission card remains in hand");
eq(ctx.state.hand[3].length, 2, "unchosen opponent hand unchanged");
eq(ctx.state.discard[2].length, 2, "discarded cards move to chosen player discard");
eq(evalIn("state.missions[1].rewardResult.targetSide"), 2, "discard reward records chosen opponent");

// Anatema can target units belonging to every active opponent, never eliminated players.
ctx.state.missionPendingReward = null;
ctx.state.modes[1] = "human";
const anatema = evalIn("missionCreateTargetSelection(1,missionDefinitionById('FBMSND01'),3)");
ok(anatema.pending, "Anatema creates a target selection");
eq(evalIn("state.missionPendingReward.groups[0].eligibleUids.sort()"), ["e2-commander","e2-line","e2-pivot","e3-commander","e3-line"], "Anatema includes all active enemy units only");
eq(evalIn("state.missionPendingReward.groups[0].required"), 3, "Anatema quota follows multiplier");

// Dynamic diagnostics and source guards.
ctx.state.missions[2] = evalIn("createMissionRuntime(2,null)");
ctx.state.missions[3] = evalIn("createMissionRuntime(3,null)");
ctx.state.missions[4] = evalIn("createMissionRuntime(4,null)");
eq(evalIn("Object.keys(missionDiagnosticsSummary().sides)"), ["1","2","3","4"], "diagnostics export every runtime player");
const missionsSource = read("src/missions.js");
ok(!missionsSource.includes("return side === 1 ? 2 : 1;"), "no duel-only mission enemy fallback remains");
ok(missionsSource.includes("streakByEnemy"), "per-enemy streak state persisted");
ok(read("src/mission_ai.js").includes("missionEnemyUnits(side)"), "Mission AI uses all active enemy units");
ok(read("src/mission_ui.js").includes("mission_player_target_selection"), "Mission UI renders player reward targeting");
ok(read("src/build_info.js").includes('version: "C2-STABLE-1-F9Q3d2-APK-M4c"'), "F9Q3d2 build metadata");
ok(read("src/build_info.js").includes('logicBaseline: "C2-STABLE-1-F9Q3d1-APK-M4c"'), "validated F9Q3d1 baseline preserved");

console.log(`F9Q3d2 FFA Effects & Missions smoke: ${checks}/${checks} OK`);
