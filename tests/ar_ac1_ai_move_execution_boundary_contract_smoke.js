"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const boundary = read("src/ai/move_execution.js");
const facade = read("src/ai.js");
const index = read("index.html");
let checks = 0;
const ok = (value,message) => { assert.ok(value,message); checks += 1; };
const eq = (actual,expected,message) => { assert.strictEqual(JSON.stringify(actual),JSON.stringify(expected),message); checks += 1; };

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(boundary,sandbox,{filename:"src/ai/move_execution.js"});
ok(typeof sandbox.createAiMoveExecutionService === "function","boundary exposes one factory without construction-time globals");

const calls = [];
const unit = {uid:"u"};
const coord = [1,-1,0];
const service = sandbox.createAiMoveExecutionService({
  isAdvancedAiEnabled(){ calls.push("advanced"); return true; },
  recordMoveChoice(moving,target){ calls.push("record"); assert.strictEqual(moving,unit); assert.strictEqual(target,coord); },
  moveUnit(moving,target){ calls.push("move"); assert.strictEqual(moving,unit); assert.strictEqual(target,coord); }
});
ok(Object.isFrozen(service),"service API is immutable");
eq(Array.from(Object.keys(service)),["botMoveUnitF9T0","finishBotMove"],"movement service exposes execution and post-move finalization");
eq(service.botMoveUnitF9T0(unit,coord),undefined,"service preserves the undefined success result");
eq(calls,["advanced","record","move"],"service preserves Advanced history-before-movement ordering");

for(const forbidden of ["document","localStorage","sessionStorage","indexedDB","window.","state.","aiTelemetry","Math.random","render("]){
  ok(!boundary.includes(forbidden),`boundary excludes ${forbidden}`);
}
const moveStart = boundary.indexOf("function botMoveUnitF9T0");
const moveEnd = boundary.indexOf("function finishBotMove",moveStart);
const moveBody = boundary.slice(moveStart,moveEnd);
ok(!moveBody.includes("endUnitAction(")&&!moveBody.includes("tryStationaryAction(")&&!moveBody.includes("tryAttackOnly("),"authoritative movement operation stays isolated from post-move effects");
for(const port of ["isAdvancedAiEnabled","recordMoveChoice","moveUnit"]) ok(boundary.includes(port),`boundary declares the ${port} port`);

eq((facade.match(/function\s+botMoveUnitF9T0\s*\(/g)||[]).length,1,"legacy movement helper has one facade declaration");
ok(facade.includes("createAiMoveExecutionService({"),"legacy facade creates the service lazily");
ok(facade.includes("isAdvancedAiEnabled:() => advancedAiEnabled()"),"AI mode remains late-bound");
ok(facade.includes("recordMoveChoice:(unit,coord) => botRecordMoveChoiceF9T0(unit,coord)"),"history recording remains late-bound");
ok(facade.includes("moveUnit:(unit,coord) => moveUnit(unit,coord)"),"authoritative movement remains late-bound");
ok(facade.includes("aiMoveExecutionService().botMoveUnitF9T0(unit,coord)"),"legacy helper delegates to the service");
const facadeStart = facade.indexOf("function botMoveUnitF9T0");
const facadeEnd = facade.indexOf("let AI_COMBAT_EXECUTION_SERVICE",facadeStart);
const facadeBody = facade.slice(facadeStart,facadeEnd);
ok(!facadeBody.includes("advancedAiEnabled()")&&!facadeBody.includes("botRecordMoveChoiceF9T0(unit, coord)")&&!facadeBody.includes("moveUnit(unit, coord)"),"movement execution has one implementation owner");

const selectionIndex = index.indexOf('<script src="src/ai/move_selection.js"></script>');
const executionIndex = index.indexOf('<script src="src/ai/move_execution.js"></script>');
const facadeIndex = index.indexOf('<script src="src/ai.js"></script>');
ok(selectionIndex>=0&&selectionIndex<executionIndex&&executionIndex<facadeIndex,"browser loads movement execution after selection and before the facade");

console.log(`AR-AC1 AI move execution boundary contract smoke: ${checks}/${checks} OK`);
