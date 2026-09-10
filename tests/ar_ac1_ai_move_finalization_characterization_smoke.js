"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const sources = [
  "src/ai/pressure_perception.js",
  "src/ai/finalization_memory.js",
  "src/ai/faction_maturity.js",
  "src/ai/garrison_planning.js",
  "src/ai/strategic_status.js",
  "src/ai/move_context.js",
  "src/ai/faction_move_scoring.js",
  "src/ai/move_selection.js",
  "src/ai/move_execution.js"
].map(read);
const executionSource = sources[sources.length-1];
const aiSource = read("src/ai.js");
let checks = 0;
const ok = (value,message) => { assert.ok(value,message); checks += 1; };
const eq = (actual,expected,message) => { assert.strictEqual(JSON.stringify(actual),JSON.stringify(expected),message); checks += 1; };

function createHarness(options={}) {
  const calls = [];
  const unit = {uid:"moving",name:"Legionario",warPush:false,moveAttack:false,...options.unit};
  let canActCalls = 0;
  const sandbox = {
    console,
    __field(moving){ calls.push("field"); assert.strictEqual(moving,unit); return options.field !== false; },
    __log(message){ calls.push("log"); assert.strictEqual(unit.warPush,false); assert.strictEqual(message,"Legionario sfrutta Spinta di Guerra: può ancora agire."); if(options.logError) throw new Error("log-failed"); },
    __stationary(moving){ calls.push("stationary"); assert.strictEqual(moving,unit); if(options.stationaryError) throw new Error("stationary-failed"); return "stationary-result"; },
    __end(moving){ calls.push("end"); assert.strictEqual(moving,unit); if(options.endError) throw new Error("end-failed"); return "end-result"; },
    __infantry(moving){ calls.push("infantry"); assert.strictEqual(moving,unit); return Boolean(options.infantry); },
    __canAct(moving){ calls.push("canAct"); assert.strictEqual(moving,unit); const values = options.canActValues || [options.canAct !== false]; return values[Math.min(canActCalls++,values.length-1)]; },
    __attack(moving){ calls.push("attack"); assert.strictEqual(moving,unit); if(options.attackError) throw new Error("attack-failed"); return "attack-result"; }
  };
  vm.createContext(sandbox);
  vm.runInContext(`${sources.join("\n")}\n${aiSource}\n;
    isFieldUnit=__field;
    log=__log;
    botTryStationaryAction=__stationary;
    endUnitAction=__end;
    isInfantryActionLike=__infantry;
    canAct=__canAct;
    botTryAttackOnly=__attack;
    globalThis.__moveFinalization={finishBotMove};`,sandbox,{filename:"ai-move-finalization-characterization.js"});
  return {api:sandbox.__moveFinalization,unit,calls};
}

{
  const harness = createHarness({field:false,unit:{warPush:true,moveAttack:true}});
  const before = JSON.stringify(harness.unit);
  eq(harness.api.finishBotMove(harness.unit),undefined,"non-field unit returns undefined");
  eq(harness.calls,["field"],"non-field unit performs no post-move effects");
  eq(JSON.stringify(harness.unit),before,"non-field early return preserves the unit");
}

{
  const harness = createHarness({unit:{warPush:true}});
  eq(harness.api.finishBotMove(harness.unit),undefined,"War Push branch returns undefined");
  eq(harness.calls,["field","log","stationary","end"],"War Push clears, logs, acts and ends in historical order");
  eq(harness.unit.warPush,false,"War Push credit is cleared before follow-up effects");
}

{
  const harness = createHarness({infantry:true,canAct:true});
  harness.api.finishBotMove(harness.unit);
  eq(harness.calls,["field","infantry","canAct","stationary","end"],"action-capable infantry performs a stationary action then ends");
}

{
  const harness = createHarness({infantry:false,canAct:true,unit:{moveAttack:true}});
  harness.api.finishBotMove(harness.unit);
  eq(harness.calls,["field","infantry","canAct","attack","end"],"move-attack unit attempts attacks then ends");
}

{
  const harness = createHarness({infantry:true,canActValues:[false,false],unit:{moveAttack:true}});
  harness.api.finishBotMove(harness.unit);
  eq(harness.calls,["field","infantry","canAct","canAct","end"],"failed infantry and move-attack action checks remain two independent short-circuits");
}

{
  const harness = createHarness({infantry:false,unit:{moveAttack:false}});
  harness.api.finishBotMove(harness.unit);
  eq(harness.calls,["field","infantry","end"],"default field-unit path ends without querying action capability");
}

{
  const harness = createHarness({unit:{warPush:true},logError:true});
  assert.throws(() => harness.api.finishBotMove(harness.unit),/log-failed/); checks += 1;
  eq(harness.calls,["field","log"],"War Push logging failure propagates before action and end effects");
  eq(harness.unit.warPush,false,"War Push remains consumed when logging throws");
}

{
  const harness = createHarness({infantry:false,unit:{moveAttack:true},attackError:true});
  assert.throws(() => harness.api.finishBotMove(harness.unit),/attack-failed/); checks += 1;
  eq(harness.calls,["field","infantry","canAct","attack"],"attack failure propagates and prevents end action");
}

const start = aiSource.indexOf("function finishBotMove");
const end = aiSource.indexOf("function emergencyBotAction",start);
const extractedStart = executionSource.indexOf("function finishBotMove");
const extractedEnd = executionSource.indexOf("return Object.freeze",extractedStart);
const source = extractedStart>=0
  ? `${executionSource.slice(extractedStart,extractedEnd)}\n${aiSource.slice(start,end)}`
  : aiSource.slice(start,end);
ok(start>=0&&end>start,"move-finalization source span is present");
ok(!/document|localStorage|sessionStorage|indexedDB|window\.|state\.|aiTelemetry|Math\.random|render\(|moveUnit\(/.test(source),"move finalization has no DOM, storage, direct state, telemetry, RNG, render or movement-rule dependency");
ok(source.includes("unit.warPush = false")&&source.indexOf("unit.warPush = false")<source.indexOf("logWarPush(unit)"),"War Push mutation remains ordered before logging");
ok(aiSource.includes("logWarPush:unit => log(`${unit.name} sfrutta Spinta di Guerra: può ancora agire.`)"),"War Push logging adapter preserves the historical message");

console.log(`AR-AC1 AI move finalization characterization smoke: ${checks}/${checks} OK`);
