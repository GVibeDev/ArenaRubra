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
const service=sandbox.createAiCombatExecutionService({});
ok(Object.isFrozen(service),"combined combat API is immutable");
eq(Array.from(Object.keys(service)),["botTryAttackOnly","botTryStationaryAction","emergencyBotAction"],"emergency action shares only the characterized combat API");

const start=boundary.indexOf("function emergencyBotAction");
const end=boundary.indexOf("return Object.freeze",start);
const body=boundary.slice(start,end);
ok(start>=0&&end>start,"emergency-action implementation is present");
for(const forbidden of ["document","localStorage","sessionStorage","indexedDB","window.","state.","aiTelemetry","Math.random","render(","moveUnit("]){ok(!body.includes(forbidden),`emergency boundary excludes ${forbidden}`);}
for(const port of ["getStrategicStatus","getCombatUnits","areAdjacent","isStrategicEnemyTarget","canAttack","scoreAttackTarget","attackUnit","isFieldUnit","canUseAbility","getAbilityTargets","tryStationaryAction","endUnitAction"]){ok(boundary.includes(port),`combat boundary declares ${port}`);}
ok(body.includes("scoreAttackTarget(unit, enemy) + 12"),"strategic target bonus remains exactly +12");
eq((facade.match(/function\s+emergencyBotAction\s*\(/g)||[]).length,1,"legacy emergency helper has one declaration");
ok(facade.includes("function emergencyBotAction(unit, movementProvider = movableCells, status = null)"),"legacy default signature is preserved");
ok(facade.includes("aiCombatExecutionService().emergencyBotAction(unit,movementProvider,status)"),"legacy emergency helper delegates all arguments");
const facadeStart=facade.indexOf("function emergencyBotAction");
const facadeEnd=facade.indexOf("function scoreAttackTarget",facadeStart);
ok(!facade.slice(facadeStart,facadeEnd).includes("strategicAdjacent"),"legacy emergency facade contains no policy copy");
const combatIndex=index.indexOf('<script src="src/ai/combat_execution.js"></script>');
const aiIndex=index.indexOf('<script src="src/ai.js"></script>');
ok(combatIndex>=0&&combatIndex<aiIndex,"browser loads emergency owner before facade");
console.log(`AR-AC1 AI emergency-action boundary contract smoke: ${checks}/${checks} OK`);
