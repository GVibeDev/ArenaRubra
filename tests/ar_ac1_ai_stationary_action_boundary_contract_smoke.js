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
eq(Array.from(Object.keys(service)),["botTryAttackOnly","botTryStationaryAction","emergencyBotAction"],"stationary action shares only the characterized combat API");

const start=boundary.indexOf("function botTryStationaryAction");
const end=boundary.indexOf("function emergencyBotAction",start);
const body=boundary.slice(start,end);
ok(start>=0&&end>start,"stationary-action implementation is present");
for(const forbidden of ["document","localStorage","sessionStorage","indexedDB","window.","state.","aiTelemetry","Math.random","render(","endUnitAction("]){ok(!body.includes(forbidden),`stationary boundary excludes ${forbidden}`);}
for(const marker of ["f9s1aKeepActionAfterAbility = false","c2finalc2ReadyAfterAbility = false","f9s1aPostAttackMoveUsed = true"]){ok(body.includes(marker),`stationary boundary owns ${marker}`);}
for(const port of ["canAct","canUseAbility","getAbilityTargets","scoreAbility","useAbility","canAttack","attackUnit","isFieldUnit","hasMovableCells","getMovableCells","chooseMove","moveUnit","logPostAttackMove"]){ok(boundary.includes(port),`combat boundary declares ${port}`);}
eq((facade.match(/function\s+botTryStationaryAction\s*\(/g)||[]).length,1,"legacy stationary helper has one declaration");
ok(facade.includes("aiCombatExecutionService().botTryStationaryAction(unit)"),"legacy stationary helper delegates");
for(const adapter of ["scoreAbility:(unit,target,ability) => scoreAbilityWithMission(unit,target,ability)","moveUnit:(unit,coord) => botMoveUnitF9T0(unit,coord)","logPostAttackMove:unit => log(`${unit.name} usa Disimpegno dopo l'attacco.`)"]){ok(facade.includes(adapter),`facade preserves ${adapter.split(":")[0]} wiring`);}
const facadeStart=facade.indexOf("function botTryStationaryAction");
const facadeEnd=facade.indexOf("function botTryAttackOnly",facadeStart);
ok(!facade.slice(facadeStart,facadeEnd).includes("f9s1aKeepActionAfterAbility"),"legacy stationary facade contains no policy copy");
const moveIndex=index.indexOf('<script src="src/ai/move_execution.js"></script>');
const combatIndex=index.indexOf('<script src="src/ai/combat_execution.js"></script>');
const aiIndex=index.indexOf('<script src="src/ai.js"></script>');
ok(moveIndex>=0&&moveIndex<combatIndex&&combatIndex<aiIndex,"combat boundary loads after movement and before facade");
console.log(`AR-AC1 AI stationary-action boundary contract smoke: ${checks}/${checks} OK`);
