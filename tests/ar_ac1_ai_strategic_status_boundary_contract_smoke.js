"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const boundary = read("src/ai/strategic_status.js");
const facade = read("src/ai.js");
const index = read("index.html");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => { assert.strictEqual(actual, expected, message); checks += 1; };

const context = {};
vm.createContext(context);
vm.runInContext(boundary, context, { filename:"src/ai/strategic_status.js" });
ok(typeof context.createAiStrategicStatusService === "function", "boundary exposes one service factory");

const service = context.createAiStrategicStatusService();
ok(Object.isFrozen(service), "service API is immutable");
eq(Array.from(Object.keys(service)).join(","), "compose", "service exposes only the deterministic composer");

const input = {
  player:1,
  enemy:2,
  profile:{totalPs:3, requiredPs:2, centralCoord:[0,0,0], startRound:20, pressureWin:5, maxRound:35},
  ownPs:1,
  enemyPs:1,
  ownPressure:0,
  enemyPressure:0,
  ownHq:{uid:"hq-1", pos:[5,-5,0]},
  enemyHq:{uid:"hq-2", pos:[-5,5,0]},
  enemyUnits:[],
  ownUnits:[],
  enemyOnOwnHq:null,
  enemiesNearOwnHq:[],
  center:{coord:[0,0,0], control:1},
  centerOccupant:null,
  centerOpening:false,
  centerLostEarly:false,
  ownControlsCentral:true,
  enemyControlsCentral:false,
  strategic:{posture:"equilibrio", unitDelta:0, incomeDelta:0},
  progressMemory:{stalledRounds:0},
  nexusMaturity:{mature:false},
  agathoiMaturity:{mature:false},
  turn:10,
  faction:"Nexus",
  sameCoord:(left,right) => left.every((value,indexValue) => value === right[indexValue]),
  hexDistance:(left,right) => Math.max(...left.map((value,indexValue) => Math.abs(value-right[indexValue]))),
  movementRangeFor:() => 1,
  movesFor:() => []
};
const before = JSON.stringify(input);
const result = service.compose(input);
eq(result.mode, "normal", "composer returns the characterized neutral mode");
eq(result.active, false, "composer returns the characterized inactive state");
eq(Object.prototype.hasOwnProperty.call(result, "garrisonPlan"), false, "garrison attachment remains outside the composer");
eq(Object.isFrozen(result), false, "legacy facade can attach the garrison plan to the result");
eq(JSON.stringify(input), before, "composer does not mutate the supplied read model");

for (const forbidden of ["document", "localStorage", "sessionStorage", "indexedDB", "window.", "state.", "Math.random", "aiTelemetry"]) {
  ok(!boundary.includes(forbidden), `boundary excludes ${forbidden}`);
}
ok(!boundary.includes("botUpdateFinalizationMemoryF9T0"), "boundary does not own finalization-memory advancement");
ok(!boundary.includes("botBuildGarrisonPlanF9T0"), "boundary does not own garrison planning");
ok(boundary.includes("profile.requiredPs") && boundary.includes("profile.pressureWin") && boundary.includes("profile.maxRound"), "scaled rule thresholds enter through the supplied profile");
ok(boundary.includes("movementRangeFor") && boundary.includes("movesFor"), "movement reachability enters through explicit read ports");

const declarations = facade.match(/function\s+strategicStatus\s*\(/g) || [];
eq(declarations.length, 1, "strategicStatus has one legacy facade declaration");
ok(facade.includes("aiStrategicStatusService().compose({"), "legacy strategicStatus delegates composition to the boundary");
ok(!facade.includes('mode = "rompi_controllo_ps"') && !facade.includes('mode = "vittoria_pressione"'), "mode-selection implementation has one owner");

const facadeStart = facade.indexOf("function strategicStatus");
const facadeEnd = facade.indexOf("function logEmergencyIfNeeded", facadeStart);
const facadeBody = facade.slice(facadeStart, facadeEnd);
const memoryIndex = facadeBody.indexOf("botUpdateFinalizationMemoryF9T0(player)");
const composeIndex = facadeBody.indexOf("aiStrategicStatusService().compose({");
const garrisonIndex = facadeBody.indexOf("botBuildGarrisonPlanF9T0(player, result)");
ok(memoryIndex >= 0 && memoryIndex < composeIndex && composeIndex < garrisonIndex, "facade preserves memory, compose, garrison ordering");
ok(facadeBody.includes('typeof options.movesFor === "function"'), "facade preserves the historical movesFor override");
ok(facadeBody.includes("movementRangeFor:u => typeof movementRangeFor"), "facade preserves the historical movement-range fallback");

const pressureIndex = index.indexOf('<script src="src/ai/pressure_perception.js"></script>');
const boundaryIndex = index.indexOf('<script src="src/ai/strategic_status.js"></script>');
const facadeIndex = index.indexOf('<script src="src/ai.js"></script>');
ok(pressureIndex >= 0 && pressureIndex < boundaryIndex && boundaryIndex < facadeIndex, "browser loads both AI services before the legacy facade");

console.log(`AR-AC1 AI strategic status boundary contract smoke: ${checks}/${checks} OK`);
