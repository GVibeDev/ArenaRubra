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
const aiSource = read("src/ai.js");
let checks = 0;
const ok = (value,message) => { assert.ok(value,message); checks += 1; };
const eq = (actual,expected,message) => { assert.strictEqual(JSON.stringify(actual),JSON.stringify(expected),message); checks += 1; };

function createHarness(options={}) {
  const calls = [];
  const unit = {uid:"moving",side:1,pos:[0,0,0]};
  const coord = [1,-1,0];
  const sandbox = {
    console,
    __advanced(){ calls.push("advanced"); return options.advanced !== false; },
    __record(moving,target){ calls.push("record"); assert.strictEqual(moving,unit); assert.strictEqual(target,coord); if(options.recordError) throw new Error("record-failed"); return "record-result"; },
    __move(moving,target){ calls.push("move"); assert.strictEqual(moving,unit); assert.strictEqual(target,coord); if(options.moveError) throw new Error("move-failed"); return "move-result"; }
  };
  vm.createContext(sandbox);
  vm.runInContext(`${sources.join("\n")}\n${aiSource}\n;
    advancedAiEnabled=__advanced;
    botRecordMoveChoiceF9T0=__record;
    moveUnit=__move;
    globalThis.__moveExecution={botMoveUnitF9T0};`,sandbox,{filename:"ai-move-execution-characterization.js"});
  return {api:sandbox.__moveExecution,unit,coord,calls};
}

{
  const harness = createHarness();
  const before = JSON.stringify({unit:harness.unit,coord:harness.coord});
  const result = harness.api.botMoveUnitF9T0(harness.unit,harness.coord);
  eq(result,undefined,"successful movement facade returns undefined");
  eq(harness.calls,["advanced","record","move"],"Advanced movement records the choice before invoking movement");
  eq(JSON.stringify({unit:harness.unit,coord:harness.coord}),before,"orchestrator itself does not mutate unit or coordinate");
}

{
  const harness = createHarness({advanced:false});
  harness.api.botMoveUnitF9T0(harness.unit,harness.coord);
  eq(harness.calls,["advanced","move"],"non-Advanced movement skips history and still invokes movement");
}

{
  const harness = createHarness({recordError:true});
  assert.throws(() => harness.api.botMoveUnitF9T0(harness.unit,harness.coord),/record-failed/); checks += 1;
  eq(harness.calls,["advanced","record"],"recording failure propagates and prevents movement");
}

{
  const harness = createHarness({moveError:true});
  assert.throws(() => harness.api.botMoveUnitF9T0(harness.unit,harness.coord),/move-failed/); checks += 1;
  eq(harness.calls,["advanced","record","move"],"movement failure propagates after history recording");
}

const start = aiSource.indexOf("function botMoveUnitF9T0");
const end = aiSource.indexOf("let AI_COMBAT_EXECUTION_SERVICE",start);
const executionSource = sources[sources.length-1];
const extractedStart = executionSource.indexOf("function botMoveUnitF9T0");
const extractedEnd = executionSource.indexOf("function finishBotMove",extractedStart);
const source = `${executionSource.slice(extractedStart,extractedEnd)}\n${aiSource.slice(start,end)}`;
ok(start>=0&&end>start,"move-execution source span is present");
ok(!/document|localStorage|sessionStorage|indexedDB|window\.|state\.|aiTelemetry|Math\.random|render\(|endUnitAction\(/.test(source),"move execution has no DOM, storage, direct state, telemetry, RNG, render or finalization dependency");
ok(source.indexOf("botRecordMoveChoiceF9T0")<source.indexOf("moveUnit("),"history recording remains ordered before movement");

console.log(`AR-AC1 AI move execution characterization smoke: ${checks}/${checks} OK`);
