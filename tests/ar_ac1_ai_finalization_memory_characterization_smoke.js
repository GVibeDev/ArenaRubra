"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const pressureSource = read("src/ai/pressure_perception.js");
const finalizationSource = read("src/ai/finalization_memory.js");
const maturitySource = read("src/ai/faction_maturity.js");
const garrisonSource = read("src/ai/garrison_planning.js");
const strategicSource = read("src/ai/strategic_status.js");
const aiSource = read("src/ai.js");
let checks = 0;
const ok = (value,message) => { assert.ok(value,message); checks += 1; };
const eq = (actual,expected,message) => { assert.strictEqual(JSON.stringify(actual),JSON.stringify(expected),message); checks += 1; };

const sameCoord = (left,right) => Array.isArray(left) && Array.isArray(right) && left.every((value,index) => value === right[index]);
const distance = (left,right) => Math.max(Math.abs(left[0]-right[0]),Math.abs(left[1]-right[1]),Math.abs(left[2]-right[2]));

function baseState(overrides={}) {
  return {
    turn:6,
    pressure:{1:1,2:0},
    cells:[{id:"ps-own",coord:[0,1,-1],ps:true,control:1}],
    units:[
      {uid:"hq-1",side:1,type:"QG",pos:[0,0,0]},
      {uid:"mobile-a",side:1,type:"Fanteria",pos:[4,-4,0]},
      {uid:"mobile-b",side:1,type:"Fanteria",pos:[1,-1,0]},
      {uid:"structure",side:1,type:"Struttura",pos:[0,1,-1]},
      {uid:"hq-2",side:2,type:"QG",pos:[6,-6,0]},
      {uid:"enemy-a",side:2,type:"Fanteria",pos:[5,-5,0]}
    ],
    ...overrides
  };
}

function createHarness(initialState=baseState()) {
  const context = {
    console,
    state:initialState,
    __enemyOf:player => player === 1 ? 2 : 1,
    __getHq(player){ return context.state && context.state.units.find(unit => unit.side === player && unit.type === "QG") || null; },
    __combatUnits(player){ return context.state ? context.state.units.filter(unit => unit.side === player) : []; },
    __hexDistance:distance,
    __countControlledPS(player){ return context.state ? context.state.cells.filter(cell => cell.ps && cell.control === player).length : 0; },
    __sameCoord:sameCoord
  };
  vm.createContext(context);
  vm.runInContext(`${pressureSource}\n${finalizationSource}\n${maturitySource}\n${garrisonSource}\n${strategicSource}\n${aiSource}\n;enemyOf=__enemyOf; getHq=__getHq; combatUnits=__combatUnits; hexDistance=__hexDistance; countControlledPS=__countControlledPS; sameCoord=__sameCoord; globalThis.__memory={ensureAiFinalizationMemoryF9T0,botProgressSnapshotF9T0,botUpdateFinalizationMemoryF9T0,botRecordMoveChoiceF9T0};`,context,{filename:"ai-finalization-memory-characterization.js"});
  return {context,api:context.__memory};
}

{
  const {context,api} = createHarness(null);
  eq(api.ensureAiFinalizationMemoryF9T0(),null,"no game state produces no memory store");
  eq(api.botUpdateFinalizationMemoryF9T0(1),{stalledRounds:0,lastProgressRound:0},"no game state preserves the neutral update result");
  eq(context.state,null,"no-state calls do not create global state");
}

{
  const {context,api} = createHarness(baseState({aiFinalizationF9T0:"invalid",marker:"keep"}));
  const memory = api.ensureAiFinalizationMemoryF9T0();
  eq(memory,{schema:"F9T0-1",players:{},unitHistory:{}},"invalid memory is replaced with the exact F9T0 schema");
  ok(memory === context.state.aiFinalizationF9T0,"ensure returns the authoritative stored object");
  eq(context.state.marker,"keep","ensure preserves unrelated state");
}

{
  const rootMemory = {schema:"custom",extra:7};
  const {context,api} = createHarness(baseState({aiFinalizationF9T0:rootMemory}));
  const memory = api.ensureAiFinalizationMemoryF9T0();
  ok(memory === rootMemory,"valid memory root retains object identity");
  eq(memory,{schema:"custom",extra:7,players:{},unitHistory:{}},"missing memory branches are added without replacing other fields");
  ok(context.state.aiFinalizationF9T0 === rootMemory,"stored valid memory root is not replaced");
}

{
  const {context,api} = createHarness();
  eq(api.botProgressSnapshotF9T0(1),{
    round:6,
    ownPs:1,
    ownPressure:1,
    enemyUnits:2,
    closestEnemyHqDistance:2,
    forwardUnits:1
  },"progress snapshot preserves round, PS, Pressure, enemy count and geometry");
  context.state.units = context.state.units.filter(unit => unit.uid !== "hq-2");
  const withoutEnemyHq = api.botProgressSnapshotF9T0(1);
  eq({closestEnemyHqDistance:withoutEnemyHq.closestEnemyHqDistance,forwardUnits:withoutEnemyHq.forwardUnits},{closestEnemyHqDistance:99,forwardUnits:0},"missing enemy HQ preserves distance and forward-unit fallbacks");
}

{
  const {context,api} = createHarness(baseState({aiTelemetry:{}}));
  const first = api.botUpdateFinalizationMemoryF9T0(1);
  eq({lastRound:first.lastRound,stalledRounds:first.stalledRounds,lastProgressRound:first.lastProgressRound},{lastRound:6,stalledRounds:0,lastProgressRound:6},"first observation records immediate progress");
  eq(first.snapshot,api.botProgressSnapshotF9T0(1),"first observation stores the exact current snapshot");
  ok(first === context.state.aiFinalizationF9T0.players[1],"player record is stored by identity");
  context.state.pressure[1] = 9;
  const sameRound = api.botUpdateFinalizationMemoryF9T0(1);
  ok(sameRound === first,"same-round update is idempotent by identity");
  eq(sameRound.snapshot.ownPressure,1,"same-round update does not refresh the snapshot");
  eq(context.state.aiTelemetry.maxStalledRounds,{1:0},"first observation initializes max-stall telemetry without inflating it");
}

{
  const {context,api} = createHarness();
  api.botUpdateFinalizationMemoryF9T0(1);
  context.state.turn = 7;
  const stalled = api.botUpdateFinalizationMemoryF9T0(1);
  eq({stalledRounds:stalled.stalledRounds,lastProgressRound:stalled.lastProgressRound},{stalledRounds:1,lastProgressRound:6},"unchanged later round increments stall and preserves last progress round");
}

function progressBy(change) {
  const {context,api} = createHarness();
  api.botUpdateFinalizationMemoryF9T0(1);
  context.state.turn = 7;
  change(context.state);
  return api.botUpdateFinalizationMemoryF9T0(1);
}

eq(progressBy(state => state.cells.push({id:"ps-2",coord:[2,-2,0],ps:true,control:1})).stalledRounds,0,"PS gain counts as progress");
eq(progressBy(state => { state.pressure[1] += 1; }).stalledRounds,0,"Pressure gain counts as progress");
eq(progressBy(state => { state.units = state.units.filter(unit => unit.uid !== "enemy-a"); }).stalledRounds,0,"enemy-unit reduction counts as progress");
eq(progressBy(state => { state.units.find(unit => unit.uid === "mobile-a").pos = [5,-5,0]; }).stalledRounds,0,"closer enemy-HQ distance counts as progress");
eq(progressBy(state => { state.units.find(unit => unit.uid === "mobile-b").pos = [4,-4,0]; }).stalledRounds,0,"additional forward unit counts as progress");

{
  const early = baseState({turn:4});
  const {context,api} = createHarness(early);
  api.botUpdateFinalizationMemoryF9T0(1);
  context.state.turn = 5;
  const record = api.botUpdateFinalizationMemoryF9T0(1);
  eq({stalledRounds:record.stalledRounds,lastProgressRound:record.lastProgressRound},{stalledRounds:0,lastProgressRound:5},"rounds below six reset stall even without battlefield progress");
}

{
  const seeded = baseState({turn:11,aiTelemetry:{maxStalledRounds:{1:4}}});
  const {context,api} = createHarness(seeded);
  const snapshot = api.botProgressSnapshotF9T0(1);
  context.state.aiFinalizationF9T0 = {
    schema:"F9T0-1",
    players:{1:{lastRound:10,stalledRounds:9,lastProgressRound:2,snapshot}},
    unitHistory:{}
  };
  const record = api.botUpdateFinalizationMemoryF9T0(1);
  eq(record.stalledRounds,9,"stall counter remains capped at nine");
  eq(context.state.aiTelemetry.maxStalledRounds[1],9,"maximum-stall telemetry records the observed cap");
  context.state.turn = 12;
  context.state.cells.push({id:"progress",coord:[2,-2,0],ps:true,control:1});
  api.botUpdateFinalizationMemoryF9T0(1);
  eq(context.state.aiTelemetry.maxStalledRounds[1],9,"maximum-stall telemetry never decreases after progress");
}

{
  const {context,api} = createHarness(baseState({marker:{stable:true}}));
  api.botRecordMoveChoiceF9T0(null,[1,-1,0]);
  ok(Boolean(context.state.aiFinalizationF9T0),"invalid move input still preserves historical memory initialization");
  eq(context.state.aiFinalizationF9T0.unitHistory,{},"invalid move input writes no unit history");
  eq(context.state.marker,{stable:true},"invalid move input preserves unrelated state");
}

{
  const {context,api} = createHarness(baseState({turn:8,aiTelemetry:{}}));
  const unit = {uid:"mover",side:1,pos:[0,0,0]};
  const firstTarget = [1,-1,0];
  api.botRecordMoveChoiceF9T0(unit,firstTarget);
  eq(context.state.aiFinalizationF9T0.unitHistory.mover,{previous:[0,0,0],current:[1,-1,0],round:8,returning:false},"first move stores cloned endpoints, round and non-returning flag");
  unit.pos[0] = 99;
  firstTarget[0] = 88;
  eq(context.state.aiFinalizationF9T0.unitHistory.mover.previous,[0,0,0],"stored previous coordinate is isolated from later unit mutation");
  eq(context.state.aiFinalizationF9T0.unitHistory.mover.current,[1,-1,0],"stored current coordinate is isolated from later target mutation");

  unit.pos = [1,-1,0];
  api.botRecordMoveChoiceF9T0(unit,[0,0,0]);
  eq(context.state.aiFinalizationF9T0.unitHistory.mover,{previous:[1,-1,0],current:[0,0,0],round:8,returning:true},"return to the previously departed coordinate is detected exactly");
  eq(context.state.aiTelemetry.oscillationMoves,{1:1},"detected return increments side-specific oscillation telemetry");

  unit.pos = [0,0,0];
  api.botRecordMoveChoiceF9T0(unit,[2,-2,0]);
  eq(context.state.aiTelemetry.oscillationMoves,{1:1},"non-returning move does not increment oscillation telemetry");
}

{
  const state = baseState({turn:9});
  const {context,api} = createHarness(state);
  const unit = {uid:"mover",side:2,pos:[0,0,0]};
  api.botRecordMoveChoiceF9T0(unit,[1,-1,0]);
  unit.pos = [1,-1,0];
  api.botRecordMoveChoiceF9T0(unit,[0,0,0]);
  ok(!Object.prototype.hasOwnProperty.call(context.state,"aiTelemetry"),"move memory does not create telemetry when the branch is absent");
}

const serviceStart = aiSource.indexOf("let AI_FINALIZATION_MEMORY_SERVICE");
const legacyStart = aiSource.indexOf("function ensureAiFinalizationMemoryF9T0");
const start = serviceStart >= 0 ? serviceStart : legacyStart;
const moveExecutionStart = aiSource.indexOf("let AI_MOVE_EXECUTION_SERVICE",start);
const end = moveExecutionStart >= 0 ? moveExecutionStart : aiSource.indexOf("function botMoveUnitF9T0",start);
const source = aiSource.slice(start,end);
ok(start >= 0 && end > start,"finalization-memory source span is present");
ok(!/document|localStorage|sessionStorage|indexedDB|window\.|Math\.random|render\(|moveUnit\(/.test(`${finalizationSource}\n${source}`),"memory slice has no DOM, storage, RNG, rendering or action dependency");
ok(
  (source.includes("getFinalizationMemory")&&source.includes("recordMaxStalledRounds")&&source.includes("recordOscillationMove"))
    || (source.includes("state.aiFinalizationF9T0")&&source.includes("state.aiTelemetry")),
  "memory storage and telemetry effects remain explicit before and after extraction"
);

console.log(`AR-AC1 AI finalization memory characterization smoke: ${checks}/${checks} OK`);
