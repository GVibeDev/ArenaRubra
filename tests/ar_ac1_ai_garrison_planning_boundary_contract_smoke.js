"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const boundary = read("src/ai/garrison_planning.js");
const facade = read("src/ai.js");
const index = read("index.html");
let checks = 0;
const ok = (value,message) => { assert.ok(value,message); checks += 1; };
const eq = (actual,expected,message) => { assert.strictEqual(JSON.stringify(actual),JSON.stringify(expected),message); checks += 1; };

const context = {};
vm.createContext(context);
vm.runInContext(boundary,context,{filename:"src/ai/garrison_planning.js"});
ok(typeof context.createAiGarrisonPlanningService === "function","boundary exposes one service factory without construction-time globals");

const calls = {cells:0,enemies:0,allies:0,same:0,distance:0,occupant:0};
const controlled = [{id:"center",coord:[0,0,0],ps:true,control:1}];
const service = context.createAiGarrisonPlanningService({
  getControlledPsCells(player){ calls.cells += 1; assert.strictEqual(player,1); return controlled; },
  getEnemiesNear(coord,player,range){ calls.enemies += 1; assert.strictEqual(player,1); assert.strictEqual(range,2); return [{uid:"enemy"}]; },
  getAlliesNear(coord,player,range){ calls.allies += 1; assert.strictEqual(player,1); assert.strictEqual(range,1); return []; },
  areSameCoord(left,right){ calls.same += 1; return left.join(",") === right.join(","); },
  getHexDistance(){ calls.distance += 1; return 1; },
  getUnitAt(){ calls.occupant += 1; return null; }
});

ok(Object.isFrozen(service),"service API is immutable");
eq(Array.from(Object.keys(service)).sort(),["botBuildGarrisonPlanF9T0","botGarrisonCellPriorityF9T0"],"service exposes only the two characterized operations");
eq(service.botGarrisonCellPriorityF9T0(1,controlled[0],{
  center:controlled[0],ownHq:{pos:[1,-1,0]},closePressureLock:false,ownPressureQualified:true
}),{score:122,enemies:1,allies:0,isCenter:true,nearHq:true},"priority is computed entirely through the injected ports");

const plan = service.botBuildGarrisonPlanF9T0(1,{
  center:controlled[0],ownHq:null,closePressureLock:false,ownPressureQualified:false,
  pressureEmergency:false,hqDanger:false,pressureWindow:false,stalledRounds:0,
  winning:false,networkMature:false,greenLineMature:false
});
eq(plan.budget,1,"plan preserves the single-PS budget");
eq(Array.from(plan.keepKeys),["0,0,0"],"plan publishes coordinate keys through a Set");
eq(Array.from(plan.guardTargets,item => item.id),["center"],"empty kept PS remains a guard target");
ok(calls.cells === 1 && calls.enemies === 2 && calls.allies === 2 && calls.occupant === 1,"service obtains battlefield data only through named read ports");

for(const forbidden of ["document","localStorage","sessionStorage","indexedDB","window.","state.","Math.random","aiTelemetry","moveUnit(","render("]){
  ok(!boundary.includes(forbidden),`boundary excludes ${forbidden}`);
}
for(const port of ["getControlledPsCells","getEnemiesNear","getAlliesNear","areSameCoord","getHexDistance","getUnitAt"]){
  ok(boundary.includes(port),`boundary declares the ${port} port`);
}
ok(!/(^|[^A-Za-z])controlledPsCells\s*\(|(^|[^A-Za-z])enemiesNear\s*\(|(^|[^A-Za-z])alliesNear\s*\(|(^|[^A-Za-z])sameCoord\s*\(|(^|[^A-Za-z])hexDistance\s*\(/m.test(boundary),"boundary does not call legacy battlefield globals directly");
ok(!/\.splice\(|\.reverse\(/.test(boundary),"boundary contains no destructive collection operation");

for(const name of ["botGarrisonCellPriorityF9T0","botBuildGarrisonPlanF9T0"]){
  const declarations = facade.match(new RegExp(`function\\s+${name}\\s*\\(`,"g")) || [];
  eq(declarations.length,1,`${name} has one legacy facade declaration`);
  ok(facade.includes(`aiGarrisonPlanningService().${name}(`),`${name} delegates to the boundary`);
}
ok(facade.includes("createAiGarrisonPlanningService({"),"legacy facade creates the service lazily");
ok(facade.includes("getControlledPsCells:player => controlledPsCells(player)"),"controlled-PS legacy query is late-bound");
ok(facade.includes("getUnitAt:coord => getUnitAt(coord)"),"occupancy legacy query is late-bound");

const facadeStart = facade.indexOf("function botGarrisonCellPriorityF9T0");
const facadeEnd = facade.indexOf("function botStallOscillationScoreF9T0",facadeStart);
const facadeBody = facade.slice(facadeStart,facadeEnd);
ok(!facadeBody.includes("critical")&&!facadeBody.includes("cells.length * 0.67")&&!facadeBody.includes("guardTargets ="),"garrison policy has one implementation owner");

const pressureIndex = index.indexOf('<script src="src/ai/pressure_perception.js"></script>');
const maturityIndex = index.indexOf('<script src="src/ai/faction_maturity.js"></script>');
const garrisonIndex = index.indexOf('<script src="src/ai/garrison_planning.js"></script>');
const statusIndex = index.indexOf('<script src="src/ai/strategic_status.js"></script>');
const facadeIndex = index.indexOf('<script src="src/ai.js"></script>');
ok(pressureIndex>=0&&pressureIndex<maturityIndex&&maturityIndex<garrisonIndex&&garrisonIndex<statusIndex&&statusIndex<facadeIndex,"browser loads garrison planning before Strategic Status and the legacy facade");

console.log(`AR-AC1 AI garrison planning boundary contract smoke: ${checks}/${checks} OK`);
