"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const boundary = read("src/ai/pressure_perception.js");
const facade = read("src/ai.js");
const index = read("index.html");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => { assert.strictEqual(actual, expected, message); checks += 1; };

const context = {};
vm.createContext(context);
vm.runInContext(boundary, context, { filename:"src/ai/pressure_perception.js" });
ok(typeof context.createAiPressurePerceptionService === "function", "boundary exposes one service factory");

let stateReads = 0;
const service = context.createAiPressurePerceptionService({
  getState(){ stateReads += 1; return null; },
  getPressureRuleProfile(){ return null; },
  getCenterPsCell(){ return null; },
  hasCentralControlQuery(){ return false; },
  queryCentralControl(){ return false; },
  getPressureStartRound(){ return 20; },
  getPressureWinLimit(){ return 5; },
  getMaxRoundLimit(){ return 40; }
});
ok(Object.isFrozen(service), "service API is immutable");
eq(stateReads, 0, "factory construction does not read mutable game state");
eq(Array.from(Object.keys(service)).sort().join(","), [
  "botControlsCentralF9T0", "botPressureProfileF9T0", "botTotalPsCount"
].sort().join(","), "service exposes only the characterized Pressure-perception API");

for (const forbidden of ["document", "localStorage", "sessionStorage", "indexedDB", "window."]) {
  ok(!boundary.includes(forbidden), `boundary excludes ${forbidden}`);
}
ok(boundary.includes("getState") && boundary.includes("getPressureRuleProfile") && boundary.includes("getCenterPsCell"), "state and rule reads enter through named ports");
ok(boundary.includes("hasCentralControlQuery") && boundary.includes("queryCentralControl"), "late canonical central-control query enters through named ports");
ok(!boundary.includes("PRESSURE_WIN") && !boundary.includes("MAX_ROUND"), "balance constants enter through dependency ports");
ok(!boundary.includes("Math.random") && !boundary.includes("aiTelemetry"), "boundary owns neither RNG nor telemetry");

for (const name of ["botTotalPsCount", "botPressureProfileF9T0", "botControlsCentralF9T0"]) {
  const declarations = facade.match(new RegExp(`function\\s+${name}\\s*\\(`, "g")) || [];
  eq(declarations.length, 1, `${name} has one legacy facade declaration`);
  ok(facade.includes(`aiPressurePerceptionService().${name}`), `${name} delegates to the boundary`);
}
ok(!facade.includes("state.cells.filter(c => c.ps).length : 3"), "PS-counting implementation has one owner");
ok(!facade.includes("Math.ceil(totalPs / 2)"), "AI Pressure-profile fallback has one owner");

const boundaryIndex = index.indexOf('<script src="src/ai/pressure_perception.js"></script>');
const facadeIndex = index.indexOf('<script src="src/ai.js"></script>');
ok(boundaryIndex >= 0 && boundaryIndex < facadeIndex, "browser loads the boundary before its legacy facade");

// ai.js precedes state.js and rules.js in the classic loader. Constructing the
// singleton before Rules exists must not freeze an unavailable dependency.
const lateState = {
  cells:[
    {coord:[0,0,0], ps:true, control:2},
    {coord:[1,-1,0], ps:true, control:null}
  ],
  mapDefinition:{id:"late-rules"}
};
const lateContext = {
  state:lateState,
  CENTER_PS_COORD:[0,0,0],
  PRESSURE_WIN:5,
  MAX_ROUND:40,
  sameCoord:(left, right) => left.every((value, indexValue) => value === right[indexValue]),
  getCentralStrategicPointCoord:() => [0,0,0]
};
vm.createContext(lateContext);
vm.runInContext(`${boundary}\n${facade}`, lateContext, { filename:"ai-pressure-late-binding.js" });
eq(lateContext.botTotalPsCount(), 2, "singleton can be constructed before the Rules facade exists");
lateContext.pressureRuleProfile = () => ({
  totalPs:7, requiredPs:4, centralCoord:[2,0,-2], startRound:26, pressureWin:7, maxRound:50
});
lateContext.playerControlsCentralStrategicPoint = player => player === 3;
eq(lateContext.botPressureProfileF9T0(999).requiredPs, 4, "late-loaded Pressure profile is resolved at call time and ignores the historical extra argument");
eq(lateContext.botPressureProfileF9T0().centralCoord[0], 2, "late-loaded central coordinate reaches an already constructed singleton");
eq(lateContext.botControlsCentralF9T0(3), true, "late-loaded canonical central-control query reaches an already constructed singleton");

console.log(`AR-AC1 AI pressure perception boundary contract smoke: ${checks}/${checks} OK`);
