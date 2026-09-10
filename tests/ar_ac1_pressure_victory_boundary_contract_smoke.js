"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const boundary = read("src/rules/pressure_victory.js");
const facade = read("src/rules.js");
const index = read("index.html");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => { assert.strictEqual(actual, expected, message); checks += 1; };

const context = {};
vm.createContext(context);
vm.runInContext(boundary, context, { filename:"src/rules/pressure_victory.js" });
ok(typeof context.createPressureVictoryService === "function", "boundary exposes one service factory");

let stateReads = 0;
const service = context.createPressureVictoryService({
  getState(){ stateReads += 1; return null; },
  getActiveMapDefinition(){ return null; },
  getCentralStrategicPoint(){ return null; },
  sameCoord(){ return false; }, isPsLocked(){ return false; }, updateControlFromOccupants(){},
  getActivePlayers(){ return []; }, mapRuntimePlayerIds(){ return []; }, countControlledPS(){ return 0; },
  playerName(player){ return `G${player}`; }, pressureMapScale(){ return 0; }, pressureStartRound(){ return 20; },
  pressureWinLimit(){ return 7; }, maxRoundLimit(){ return 50; }, combatUnits(){ return []; },
  recordPressureEvaluation(){ return null; }, emitGameEvent(){}, getEventTypes(){ return {}; }, log(){}, setWinner(){}
});
ok(Object.isFrozen(service), "service API is immutable");
eq(stateReads, 0, "factory construction does not read mutable game state");
eq(Array.from(Object.keys(service)).sort().join(","), [
  "playerControlsCentralStrategicPoint", "pressureControlThreshold", "pressureRequirementSummary",
  "pressureRuleProfile", "resolveEndOfRound", "resolveRoundLimit", "totalStrategicPoints"
].sort().join(","), "service exposes only the pressure and round-limit API");

for (const forbidden of ["document", "localStorage", "sessionStorage", "indexedDB", "window."]) {
  ok(!boundary.includes(forbidden), `boundary excludes ${forbidden}`);
}
ok(boundary.includes("getState") && boundary.includes("setWinner") && boundary.includes("emitGameEvent"), "state and effects enter through named ports");
ok(!boundary.includes("PRESSURE_WIN") && !boundary.includes("MAX_ROUND"), "balance constants enter through dependency ports");

for (const name of [
  "totalStrategicPoints", "pressureControlThreshold", "pressureRuleProfile",
  "playerControlsCentralStrategicPoint", "pressureRequirementSummary", "resolveEndOfRound", "resolveRoundLimit"
]) {
  const declarations = facade.match(new RegExp(`function\\s+${name}\\s*\\(`, "g")) || [];
  eq(declarations.length, 1, `${name} has one legacy facade declaration`);
  ok(facade.includes(`pressureVictoryService().${name}`), `${name} delegates to the boundary`);
}
ok(!facade.includes("Pressione Strategica: servono") && !facade.includes("Pareggio tecnico al round"), "pressure and round-limit rule messages have one owner");

const boundaryIndex = index.indexOf('<script src="src/rules/pressure_victory.js"></script>');
const facadeIndex = index.indexOf('<script src="src/rules.js"></script>');
ok(boundaryIndex >= 0 && boundaryIndex < facadeIndex, "browser loads the boundary before its legacy facade");

console.log(`AR-AC1 pressure/victory boundary contract smoke: ${checks}/${checks} OK`);
