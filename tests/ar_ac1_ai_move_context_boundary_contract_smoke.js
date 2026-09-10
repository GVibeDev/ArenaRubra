"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const boundary = read("src/ai/move_context.js");
const facade = read("src/ai.js");
const index = read("index.html");
let checks = 0;
const ok = (value,message) => { assert.ok(value,message); checks += 1; };
const eq = (actual,expected,message) => { assert.strictEqual(JSON.stringify(actual),JSON.stringify(expected),message); checks += 1; };

const context = {};
vm.createContext(context);
vm.runInContext(boundary,context,{filename:"src/ai/move_context.js"});
ok(typeof context.createAiMoveContextService === "function","boundary exposes one factory without construction-time globals");

const calls = {};
const hit = name => { calls[name] = (calls[name] || 0) + 1; };
const dependencies = {
  getEnemyOf:player => { hit("enemy"); return player === 1 ? 2 : 1; },
  getHq:player => { hit("hq"); return {side:player,pos:[player,-player,0]}; },
  getCells:() => { hit("cells"); return [{id:"ps",ps:true,control:1,coord:[0,0,0]}]; },
  getControlledPsCells:() => { hit("controlled"); return [{coord:[0,0,0]}]; },
  getNearestControlledPsNeedingGuard:() => { hit("guard"); return null; },
  getCommander:() => { hit("commander"); return null; },
  getCombatUnits:player => { hit(`units${player}`); return []; },
  getNexusTargets:() => { hit("nexus"); return [[0,0,0]]; },
  getAgathoiTargets:() => { hit("agathoi"); return []; },
  getExordiumFronts:() => { hit("exordium"); return []; },
  getLibertiTargets:() => { hit("liberti"); return []; },
  getLibertiFlank:() => { hit("libertiFlank"); return null; },
  getFabeotTargets:() => { hit("fabeot"); return []; },
  getFabeotCollapseReady:() => { hit("collapse"); return false; },
  getFabeotExposedTargets:() => { hit("exposed"); return []; },
  getFabeotEnemyConcentration:() => { hit("concentration"); return false; },
  chooseExordiumFront:() => { hit("chooseFront"); return null; },
  getCellAt:() => { hit("cell"); return null; },
  getHexDistance:() => { hit("distance"); return 0; },
  getAlliesNear:() => { hit("allies"); return []; },
  getEnemiesNear:() => { hit("enemies"); return []; },
  getHomePsMoveScore:() => { hit("home"); return 0; },
  getStrategicMoveBonus:() => { hit("strategic"); return 0; },
  getGeneralDoctrineMoveBonus:() => { hit("general"); return 0; },
  getFactionDoctrineMoveBonus:() => { hit("factionScore"); return 0; },
  getMissionMoveBonus:() => { hit("mission"); return 0; },
  getC2e3MoveScore:() => { hit("c2e3"); return 0; },
  getStallOscillationScore:() => { hit("stall"); return 0; }
};
const service = context.createAiMoveContextService(dependencies);
ok(Object.isFrozen(service),"service API is immutable");
eq(Array.from(Object.keys(service)),["botCreateAdvancedMoveContextF9T0"],"service exposes only context construction");

const unit = {uid:"u",side:1,faction:"Nexus"};
const status = {ownPs:1};
const built = service.botCreateAdvancedMoveContextF9T0(unit,[],status);
ok(built.unit === unit && built.status === status,"service preserves caller-owned unit and status identity");
eq({player:built.player,enemy:built.enemy,hasPS:built.hasPS,psCells:built.psCells,controlledPs:built.controlledPs,nexusTargets:built.nexusTargets,candidates:built.candidates},
  {player:1,enemy:2,hasPS:true,psCells:[[0,0,0]],controlledPs:[[0,0,0]],nexusTargets:[[0,0,0]],candidates:[]},"service composes the common read model through ports");
ok(calls.nexus === 1 && !calls.agathoi && !calls.exordium && !calls.liberti && !calls.fabeot,"service invokes only the active faction route");
ok(!calls.cell && !calls.distance && !calls.allies && !calls.enemies && !calls.home,"empty options skip all per-candidate collaborators");

for(const forbidden of ["document","localStorage","sessionStorage","indexedDB","window.","state.","aiTelemetry","Math.random","moveUnit(","render(","botAdvancedMoveScoreF9T0","chooseAdvancedMove(",".sort("]){
  ok(!boundary.includes(forbidden),`boundary excludes ${forbidden}`);
}
for(const port of Object.keys(dependencies)){
  ok(boundary.includes(port),`boundary declares the ${port} port`);
}
ok(!boundary.includes("includeFaction")&&!boundary.includes("includeDoctrine")&&!boundary.includes("includeGate"),"legacy duplicate-scoring flags remain outside the service");

const declarations = facade.match(/function\s+botCreateAdvancedMoveContextF9T0\s*\(/g) || [];
eq(declarations.length,1,"legacy context builder has one facade declaration");
ok(facade.includes("aiMoveContextService().botCreateAdvancedMoveContextF9T0(unit,options,status)"),"legacy context builder delegates to the service");
ok(facade.includes("createAiMoveContextService({"),"legacy facade creates the service lazily");
ok(facade.includes("getCells:() => state.cells"),"global cell access is late-bound in the facade");
ok(facade.includes("getGeneralDoctrineMoveBonus:(unit,coord,status) => botGeneralDoctrineMoveBonus(unit,coord,status,{includeFaction:false})"),"general doctrine preserves duplicate-faction suppression");
ok(facade.includes("getC2e3MoveScore:(unit,coord,status) => c2e3MoveScore(unit,coord,status,{includeDoctrine:false,includeGate:false})"),"C2E3 preserves duplicate doctrine/gate suppression");
ok(facade.includes('typeof botMissionMoveBonus === "function" ? botMissionMoveBonus(unit,coord) : 0'),"optional mission scorer fallback remains late-bound");

const facadeStart = facade.indexOf("function botCreateAdvancedMoveContextF9T0");
const facadeEnd = facade.indexOf("function botFactionMoveBaseScoreF9T0",facadeStart);
const facadeBody = facade.slice(facadeStart,facadeEnd);
ok(!facadeBody.includes("context.candidates")&&!facadeBody.includes("exordiumFronts.length")&&!facadeBody.includes("state.cells.filter"),"context construction has one implementation owner");

const pressureIndex = index.indexOf('<script src="src/ai/pressure_perception.js"></script>');
const memoryIndex = index.indexOf('<script src="src/ai/finalization_memory.js"></script>');
const maturityIndex = index.indexOf('<script src="src/ai/faction_maturity.js"></script>');
const garrisonIndex = index.indexOf('<script src="src/ai/garrison_planning.js"></script>');
const statusIndex = index.indexOf('<script src="src/ai/strategic_status.js"></script>');
const moveIndex = index.indexOf('<script src="src/ai/move_context.js"></script>');
const facadeIndex = index.indexOf('<script src="src/ai.js"></script>');
ok(pressureIndex>=0&&pressureIndex<memoryIndex&&memoryIndex<maturityIndex&&maturityIndex<garrisonIndex&&garrisonIndex<statusIndex&&statusIndex<moveIndex&&moveIndex<facadeIndex,"browser loads movement context after its AI read services and before the facade");

console.log(`AR-AC1 AI move context boundary contract smoke: ${checks}/${checks} OK`);
