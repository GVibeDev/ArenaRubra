"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const boundary = read("src/ai/finalization_memory.js");
const facade = read("src/ai.js");
const index = read("index.html");
let checks = 0;
const ok = (value,message) => { assert.ok(value,message); checks += 1; };
const eq = (actual,expected,message) => { assert.strictEqual(JSON.stringify(actual),JSON.stringify(expected),message); checks += 1; };

const context = {};
vm.createContext(context);
vm.runInContext(boundary,context,{filename:"src/ai/finalization_memory.js"});
ok(typeof context.createAiFinalizationMemoryService === "function","boundary exposes one factory without construction-time globals");

let memory = null;
let round = 6;
const effects = {max:[],oscillation:[]};
const service = context.createAiFinalizationMemoryService({
  hasGameState:() => true,
  getFinalizationMemory:() => memory,
  setFinalizationMemory:value => { memory = value; },
  getRound:() => round,
  getPressure:() => 0,
  getEnemyOf:player => player === 1 ? 2 : 1,
  getHq:player => ({side:player,pos:player === 1 ? [0,0,0] : [3,-3,0]}),
  getCombatUnits:player => player === 1 ? [{uid:"u",side:1,type:"Fanteria",pos:[1,-1,0]}] : [],
  getHexDistance:(left,right) => Math.max(...left.map((value,index) => Math.abs(value-right[index]))),
  getControlledPsCount:() => 1,
  areSameCoord:(left,right) => left.join(",") === right.join(","),
  recordMaxStalledRounds:(player,value) => effects.max.push([player,value]),
  recordOscillationMove:player => effects.oscillation.push(player)
});

ok(Object.isFrozen(service),"service API is immutable");
eq(Array.from(Object.keys(service)).sort(),[
  "botProgressSnapshotF9T0",
  "botRecordMoveChoiceF9T0",
  "botUpdateFinalizationMemoryF9T0",
  "ensureAiFinalizationMemoryF9T0"
].sort(),"service exposes only the four characterized memory operations");

const ensured = service.ensureAiFinalizationMemoryF9T0();
eq(ensured,{schema:"F9T0-1",players:{},unitHistory:{}},"service initializes the exact schema through storage ports");
ok(ensured === memory,"service preserves authoritative memory identity");
const record = service.botUpdateFinalizationMemoryF9T0(1);
eq({lastRound:record.lastRound,stalledRounds:record.stalledRounds,lastProgressRound:record.lastProgressRound},{lastRound:6,stalledRounds:0,lastProgressRound:6},"service updates the player record through query ports");
eq(effects.max,[[1,0]],"maximum-stall telemetry leaves through its effect port");
service.botRecordMoveChoiceF9T0({uid:"u",side:1,pos:[0,0,0]},[1,-1,0]);
service.botRecordMoveChoiceF9T0({uid:"u",side:1,pos:[1,-1,0]},[0,0,0]);
eq(effects.oscillation,[1],"oscillation telemetry leaves through its effect port only on return");

for(const forbidden of ["document","localStorage","sessionStorage","indexedDB","window.","state.","aiTelemetry","Math.random","moveUnit(","render("]){
  ok(!boundary.includes(forbidden),`boundary excludes ${forbidden}`);
}
for(const port of [
  "hasGameState","getFinalizationMemory","setFinalizationMemory","getRound","getPressure",
  "getEnemyOf","getHq","getCombatUnits","getHexDistance","getControlledPsCount","areSameCoord",
  "recordMaxStalledRounds","recordOscillationMove"
]){
  ok(boundary.includes(port),`boundary declares the ${port} port`);
}
ok(!/(^|[^A-Za-z])enemyOf\s*\(|(^|[^A-Za-z])combatUnits\s*\(|(^|[^A-Za-z])countControlledPS\s*\(|(^|[^A-Za-z])sameCoord\s*\(/m.test(boundary),"boundary does not call legacy battlefield globals directly");
ok(boundary.includes('schema:"F9T0-1"'),"memory schema remains owned by the boundary");
ok(boundary.includes("Math.min(9"),"stall cap remains owned by the boundary");
ok(boundary.includes("existing.lastRound === round"),"same-round idempotency remains owned by the boundary");

for(const name of ["ensureAiFinalizationMemoryF9T0","botProgressSnapshotF9T0","botUpdateFinalizationMemoryF9T0","botRecordMoveChoiceF9T0"]){
  const declarations = facade.match(new RegExp(`function\\s+${name}\\s*\\(`,"g")) || [];
  eq(declarations.length,1,`${name} has one legacy facade declaration`);
  ok(facade.includes(`aiFinalizationMemoryService().${name}(`),`${name} delegates to the stateful boundary`);
}
ok(facade.includes("createAiFinalizationMemoryService({"),"legacy facade creates the service lazily");
ok(facade.includes("getFinalizationMemory:() => state ? state.aiFinalizationF9T0 : null"),"memory storage is late-bound in the facade");
ok(facade.includes("recordMaxStalledRounds:(player,value) =>"),"max-stall telemetry effect is implemented by the facade");
ok(facade.includes("recordOscillationMove:player =>"),"oscillation telemetry effect is implemented by the facade");

const facadeStart = facade.indexOf("function ensureAiFinalizationMemoryF9T0");
const facadeEnd = facade.indexOf("function botMoveUnitF9T0",facadeStart);
const facadeBody = facade.slice(facadeStart,facadeEnd);
ok(!facadeBody.includes("progressed =")&&!facadeBody.includes("unitHistory[unit.uid] =")&&!facadeBody.includes("Math.min(9"),"memory algorithms have one implementation owner");

const pressureIndex = index.indexOf('<script src="src/ai/pressure_perception.js"></script>');
const memoryIndex = index.indexOf('<script src="src/ai/finalization_memory.js"></script>');
const maturityIndex = index.indexOf('<script src="src/ai/faction_maturity.js"></script>');
const garrisonIndex = index.indexOf('<script src="src/ai/garrison_planning.js"></script>');
const statusIndex = index.indexOf('<script src="src/ai/strategic_status.js"></script>');
const facadeIndex = index.indexOf('<script src="src/ai.js"></script>');
ok(pressureIndex>=0&&pressureIndex<memoryIndex&&memoryIndex<maturityIndex&&maturityIndex<garrisonIndex&&garrisonIndex<statusIndex&&statusIndex<facadeIndex,"browser loads finalization memory before dependent AI services and the facade");

console.log(`AR-AC1 AI finalization memory boundary contract smoke: ${checks}/${checks} OK`);
