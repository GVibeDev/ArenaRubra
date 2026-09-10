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
ok(typeof sandbox.createAiMoveExecutionService === "function","boundary factory evaluates without runtime globals");

function createHarness(options={}) {
  const calls = [];
  const unit = {name:"Legionario",warPush:false,moveAttack:false,...options.unit};
  let canActIndex = 0;
  const service = sandbox.createAiMoveExecutionService({
    isFieldUnit(moving){ calls.push("field"); assert.strictEqual(moving,unit); return options.field !== false; },
    logWarPush(moving){ calls.push("log"); assert.strictEqual(moving,unit); assert.strictEqual(unit.warPush,false); if(options.logError) throw new Error("log-failed"); },
    tryStationaryAction(moving){ calls.push("stationary"); assert.strictEqual(moving,unit); if(options.stationaryError) throw new Error("stationary-failed"); },
    endUnitAction(moving){ calls.push("end"); assert.strictEqual(moving,unit); if(options.endError) throw new Error("end-failed"); },
    isInfantryActionLike(moving){ calls.push("infantry"); assert.strictEqual(moving,unit); return Boolean(options.infantry); },
    canAct(moving){ calls.push("canAct"); assert.strictEqual(moving,unit); const values = options.canActValues || [options.canAct !== false]; return values[Math.min(canActIndex++,values.length-1)]; },
    tryAttackOnly(moving){ calls.push("attack"); assert.strictEqual(moving,unit); if(options.attackError) throw new Error("attack-failed"); }
  });
  return {service,unit,calls};
}

{
  const harness = createHarness({field:false,unit:{warPush:true}});
  const before = JSON.stringify(harness.unit);
  eq(harness.service.finishBotMove(harness.unit),undefined,"non-field finalization returns undefined");
  eq(harness.calls,["field"],"non-field finalization exits before effects");
  eq(JSON.stringify(harness.unit),before,"non-field finalization does not mutate the unit");
  ok(Object.isFrozen(harness.service),"combined movement API is immutable");
  eq(Array.from(Object.keys(harness.service)),["botMoveUnitF9T0","finishBotMove"],"combined movement API has the two bounded operations");
}

{
  const harness = createHarness({unit:{warPush:true}});
  harness.service.finishBotMove(harness.unit);
  eq(harness.calls,["field","log","stationary","end"],"War Push effects retain mutation-aware historical order");
  eq(harness.unit.warPush,false,"War Push credit is consumed by the finalization owner");
}

{
  const harness = createHarness({infantry:true,canAct:true});
  harness.service.finishBotMove(harness.unit);
  eq(harness.calls,["field","infantry","canAct","stationary","end"],"infantry branch delegates action then end");
}

{
  const harness = createHarness({infantry:false,canAct:true,unit:{moveAttack:true}});
  harness.service.finishBotMove(harness.unit);
  eq(harness.calls,["field","infantry","canAct","attack","end"],"move-attack branch delegates attack then end");
}

{
  const harness = createHarness({infantry:true,canActValues:[false,false],unit:{moveAttack:true}});
  harness.service.finishBotMove(harness.unit);
  eq(harness.calls,["field","infantry","canAct","canAct","end"],"independent action checks remain independent");
}

{
  const harness = createHarness({unit:{warPush:true},logError:true});
  assert.throws(() => harness.service.finishBotMove(harness.unit),/log-failed/); checks += 1;
  eq(harness.calls,["field","log"],"War Push logging error propagates before later effects");
  eq(harness.unit.warPush,false,"War Push stays consumed after a logging error");
}

{
  const harness = createHarness({infantry:false,unit:{moveAttack:true},attackError:true});
  assert.throws(() => harness.service.finishBotMove(harness.unit),/attack-failed/); checks += 1;
  eq(harness.calls,["field","infantry","canAct","attack"],"attack error propagates before end action");
}

const finishStart = boundary.indexOf("function finishBotMove");
const finishEnd = boundary.indexOf("return Object.freeze",finishStart);
const finishBody = boundary.slice(finishStart,finishEnd);
ok(finishStart>=0&&finishEnd>finishStart,"finalization implementation is owned by the movement service");
for(const forbidden of ["document","localStorage","sessionStorage","indexedDB","window.","state.","aiTelemetry","Math.random","render(","moveUnit("]){
  ok(!finishBody.includes(forbidden),`finalization boundary excludes ${forbidden}`);
}
for(const port of ["isFieldUnit","logWarPush","tryStationaryAction","endUnitAction","isInfantryActionLike","canAct","tryAttackOnly"]){
  ok(boundary.includes(port),`boundary declares the ${port} port`);
}
ok(finishBody.includes("unit.warPush = false")&&finishBody.indexOf("unit.warPush = false")<finishBody.indexOf("logWarPush(unit)"),"War Push mutation precedes its logging port");

eq((facade.match(/function\s+finishBotMove\s*\(/g)||[]).length,1,"legacy finalizer has one facade declaration");
ok(facade.includes("aiMoveExecutionService().finishBotMove(unit)"),"legacy finalizer delegates to the movement service");
for(const adapter of [
  "isFieldUnit:unit => isFieldUnit(unit)",
  "logWarPush:unit => log(`${unit.name} sfrutta Spinta di Guerra: può ancora agire.`)",
  "tryStationaryAction:unit => botTryStationaryAction(unit)",
  "endUnitAction:unit => endUnitAction(unit)",
  "isInfantryActionLike:unit => isInfantryActionLike(unit)",
  "canAct:unit => canAct(unit)",
  "tryAttackOnly:unit => botTryAttackOnly(unit)"
]) ok(facade.includes(adapter),`facade late-binds ${adapter.split(":")[0]}`);
const facadeStart = facade.indexOf("function finishBotMove");
const facadeEnd = facade.indexOf("function emergencyBotAction",facadeStart);
const facadeBody = facade.slice(facadeStart,facadeEnd);
ok(!facadeBody.includes("warPush")&&!facadeBody.includes("canAct(")&&!facadeBody.includes("botTryAttackOnly(")&&!facadeBody.includes("endUnitAction("),"legacy finalizer contains no duplicate policy");

const executionIndex = index.indexOf('<script src="src/ai/move_execution.js"></script>');
const facadeIndex = index.indexOf('<script src="src/ai.js"></script>');
ok(executionIndex>=0&&executionIndex<facadeIndex,"browser loads finalization owner before the legacy facade");

console.log(`AR-AC1 AI move finalization boundary contract smoke: ${checks}/${checks} OK`);
