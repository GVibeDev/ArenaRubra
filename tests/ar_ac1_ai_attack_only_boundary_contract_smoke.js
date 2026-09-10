"use strict";

const assert=require("assert");
const fs=require("fs");
const path=require("path");
const vm=require("vm");
const root=path.resolve(__dirname,"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");
const boundary=read("src/ai/combat_execution.js");
const facade=read("src/ai.js");
const index=read("index.html");
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks+=1;};
const eq=(a,e,m)=>{assert.strictEqual(JSON.stringify(a),JSON.stringify(e),m);checks+=1;};
const sandbox={};vm.createContext(sandbox);vm.runInContext(boundary,sandbox);
ok(typeof sandbox.createAiCombatExecutionService==="function","combat boundary exposes a construction-time-global-free factory");
const service=sandbox.createAiCombatExecutionService({});
ok(Object.isFrozen(service),"combat service API is immutable");
eq(Array.from(Object.keys(service)),["botTryAttackOnly","botTryStationaryAction","emergencyBotAction"],"combat service exposes the three characterized operations");

const start=boundary.indexOf("function botTryAttackOnly");
const end=boundary.indexOf("function botTryStationaryAction",start);
const body=boundary.slice(start,end);
ok(start>=0&&end>start,"attack-only implementation is present");
for(const forbidden of ["document","localStorage","sessionStorage","indexedDB","window.","state.","aiTelemetry","Math.random","render(","moveUnit(","useAbility("]){ok(!body.includes(forbidden),`attack-only boundary excludes ${forbidden}`);}
for(const port of ["getCombatUnits","getEnemy","areAdjacent","isAdvancedAiEnabled","shouldAttackTarget","canAttack","scoreAttackTarget","attackUnit","isFieldUnit"]){ok(boundary.includes(port),`combat boundary declares ${port}`);}
eq((facade.match(/function\s+botTryAttackOnly\s*\(/g)||[]).length,1,"legacy attack-only helper has one declaration");
ok(facade.includes("aiCombatExecutionService().botTryAttackOnly(unit)"),"legacy attack-only helper delegates");
const facadeStart=facade.indexOf("function botTryAttackOnly");
const facadeEnd=facade.indexOf("function finishBotMove",facadeStart);
ok(!facade.slice(facadeStart,facadeEnd).includes("attackUnit("),"legacy attack-only facade contains no policy copy");
const combatIndex=index.indexOf('<script src="src/ai/combat_execution.js"></script>');
const aiIndex=index.indexOf('<script src="src/ai.js"></script>');
ok(combatIndex>=0&&combatIndex<aiIndex,"browser loads combat owner before facade");
console.log(`AR-AC1 AI attack-only boundary contract smoke: ${checks}/${checks} OK`);
