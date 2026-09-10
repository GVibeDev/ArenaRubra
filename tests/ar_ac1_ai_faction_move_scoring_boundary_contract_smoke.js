"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const boundary = read("src/ai/faction_move_scoring.js");
const facade = read("src/ai.js");
const index = read("index.html");
let checks = 0;
const ok = (value,message) => { assert.ok(value,message); checks += 1; };
const eq = (actual,expected,message) => { assert.strictEqual(JSON.stringify(actual),JSON.stringify(expected),message); checks += 1; };

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(boundary,sandbox,{filename:"src/ai/faction_move_scoring.js"});
ok(typeof sandbox.createAiFactionMoveScoringService === "function","boundary exposes one factory without construction-time globals");

const calls = {};
const hit = name => { calls[name] = (calls[name] || 0) + 1; };
const dependencies = {
  isUnitGarrisoningPs:unit => { hit("garrison"); return Boolean(unit.garrisoning); },
  shouldReleasePsGarrison:() => { hit("release"); return false; },
  getMinDistance:() => { hit("min"); return 1; },
  getNearestCoord:(coord,targets) => { hit("nearest"); return targets[0]; },
  getHexDistance:() => { hit("distance"); return 1; },
  areSameCoord:() => { hit("same"); return false; },
  getCells:() => { hit("cells"); return []; },
  getPsProtectionMoveBonus:() => { hit("psProtection"); return 2; },
  getAgathoiStructureNetworkScore:() => { hit("greenNetwork"); return 0; },
  isExordiumShockUnit:() => { hit("shock"); return false; },
  isUnitSacrificial:() => { hit("sacrificial"); return false; },
  areAdjacent:() => { hit("adjacent"); return false; },
  getFabeotLessDefendedPsTargets:() => { hit("lessDefended"); return []; },
  isFabeotBaitUnit:() => { hit("bait"); return false; },
  isFabeotValuableUnit:() => { hit("valuable"); return false; },
  getFabeotSplitPressureScore:() => { hit("split"); return 0; },
  getCommanderThreatLevel:() => { hit("commanderThreat"); return 1; },
  getCommanderProtectionMoveBonus:() => { hit("commanderProtection"); return 3; }
};
const service = sandbox.createAiFactionMoveScoringService(dependencies);
ok(Object.isFrozen(service),"service API is immutable");
eq(Array.from(Object.keys(service)),["botFactionMoveBaseScoreF9T0"],"service exposes only faction base scoring");

const unit = {uid:"u",side:1,faction:"Other",type:"Comandante",pos:[0,0,0]};
const entry = {coord:[1,-1,0],cell:null,enemyHqDistance:2,alliesR1:0,enemiesR1:2};
const context = {unit,player:1,enemyHq:{pos:[4,-4,0]},hasPS:true,status:{},commander:{uid:"c",pos:[0,0,0]}};
assert.strictEqual(service.botFactionMoveBaseScoreF9T0(entry,context),-8,"unknown faction preserves common commander/protection/danger tail"); checks += 1;
eq({garrison:calls.garrison,commanderThreat:calls.commanderThreat,distance:calls.distance,commanderProtection:calls.commanderProtection},{garrison:1,commanderThreat:1,distance:1,commanderProtection:1},"common tail uses each required collaborator once");
ok(!calls.release,"non-garrison unit skips release policy");

const structureContext = {
  unit:{uid:"s",side:1,faction:"Nexus",type:"Struttura",weight:"Leggera",pos:[0,0,0]}, player:1,
  enemyHq:{pos:[4,-4,0]}, hasPS:true,
  status:{networkMature:true,zeroPsRecovery:false,pressureEmergency:false,qgWinPlan:false,pressureWinPlan:false,hqDanger:false,ownPs:2,pressureProfile:{requiredPs:3}},
  uncontrolledPs:[],psCells:[],controlledPs:[],nexusTargets:[],guardTarget:null,commander:null
};
const structureEntry = {coord:[3,-3,0],cell:null,enemyHqDistance:1,alliesR1:0,enemiesR1:0};
const structureScore = service.botFactionMoveBaseScoreF9T0(structureEntry,structureContext);
ok(typeof structureScore==="number"&&calls.cells===1,"Nexus structure battlefield lookup crosses the explicit cell port");

for(const forbidden of ["document","localStorage","sessionStorage","indexedDB","window.","state.","aiTelemetry","Math.random","moveUnit(","render(","chooseAdvancedMove("]){
  ok(!boundary.includes(forbidden),`boundary excludes ${forbidden}`);
}
for(const port of Object.keys(dependencies)) ok(boundary.includes(port),`boundary declares the ${port} port`);
for(const faction of ["Nexus","Agathoi","Exordium","Liberti","Fabeot"]) ok(boundary.includes(`unit.faction === "${faction}"`),`boundary retains the ${faction} branch`);
ok(!boundary.includes("generalScore")&&!boundary.includes("factionDoctrineScore")&&!boundary.includes("emergencyScore")&&!boundary.includes("c2e3Score"),"final score aggregation remains outside the faction service");
ok(!boundary.includes("scoreCandidate")&&!boundary.includes("best.score")&&!boundary.includes("best.tie"),"candidate selection remains outside the faction service");

eq((facade.match(/function\s+botFactionMoveBaseScoreF9T0\s*\(/g)||[]).length,1,"legacy faction scorer has one facade declaration");
ok(facade.includes("createAiFactionMoveScoringService({"),"legacy facade creates the service lazily");
const expectedPorts = [
  "isUnitGarrisoningPs:unit => unitIsGarrisoningPs(unit)",
  "shouldReleasePsGarrison:(unit,status) => shouldReleasePsGarrison(unit,status)",
  "getMinDistance:(coord,targets) => minDistance(coord,targets)",
  "getNearestCoord:(coord,targets) => nearestCoord(coord,targets)",
  "getHexDistance:(left,right) => hexDistance(left,right)",
  "areSameCoord:(left,right) => sameCoord(left,right)",
  "getCells:() => state.cells",
  "getPsProtectionMoveBonus:(player,coord,status) => psProtectionMoveBonus(player,coord,status)",
  "getAgathoiStructureNetworkScore:(player,coord) => botAgathoiStructureNetworkScore(player,coord)",
  "isExordiumShockUnit:unit => botExordiumShockUnit(unit)",
  "isUnitSacrificial:unit => botUnitIsSacrificial(unit)",
  "areAdjacent:(left,right) => areAdjacent(left,right)",
  "getFabeotLessDefendedPsTargets:player => botFabeotLessDefendedPsTargets(player)",
  "isFabeotBaitUnit:unit => botFabeotIsBaitUnit(unit)",
  "isFabeotValuableUnit:unit => botFabeotIsValuableUnit(unit)",
  "getFabeotSplitPressureScore:(player,coord,status) => botFabeotSplitPressureScore(player,coord,status)",
  "getCommanderThreatLevel:commander => commanderThreatLevel(commander)",
  "getCommanderProtectionMoveBonus:(unit,coord) => commanderProtectionMoveBonus(unit,coord)"
];
for(const port of expectedPorts) ok(facade.includes(port),`legacy facade preserves late-bound port ${port.split(":")[0]}`);
ok(facade.includes("aiFactionMoveScoringService().botFactionMoveBaseScoreF9T0(entry,context)"),"legacy scorer delegates to the service");
const facadeStart = facade.indexOf("function botFactionMoveBaseScoreF9T0");
const facadeEnd = facade.indexOf("let AI_MOVE_SELECTION_SERVICE",facadeStart);
const facadeBody = facade.slice(facadeStart,facadeEnd);
ok(!facadeBody.includes("unit.faction")&&!facadeBody.includes("score +=")&&!facadeBody.includes("score -="),"faction scoring has one implementation owner");

const contextIndex = index.indexOf('<script src="src/ai/move_context.js"></script>');
const factionIndex = index.indexOf('<script src="src/ai/faction_move_scoring.js"></script>');
const selectionIndex = index.indexOf('<script src="src/ai/move_selection.js"></script>');
const facadeIndex = index.indexOf('<script src="src/ai.js"></script>');
ok(contextIndex>=0&&contextIndex<factionIndex&&factionIndex<selectionIndex&&selectionIndex<facadeIndex,"browser loads faction scoring between context and selection before the facade");

console.log(`AR-AC1 AI faction move scoring boundary contract smoke: ${checks}/${checks} OK`);
