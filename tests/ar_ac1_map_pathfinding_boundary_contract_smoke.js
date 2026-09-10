"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const pathfinding = read("src/map_pathfinding.js");
const validation = read("src/map_validation.js");
const runtime = read("src/map_runtime.js");
const movement = read("src/movement.js");
const index = read("index.html");

assert.ok(pathfinding.includes("function createMapPathfindingService(dependencies = {})"));
for (const api of [
  "cellIndex", "hexDistance", "neighbors", "reachableKeys", "singleCellChokes",
  "obstacleSymmetryIssues", "findPath", "reachableCells"
]) {
  assert.ok(pathfinding.includes(api), `pathfinding API missing: ${api}`);
}
for (const dependency of ["cellKey", "validCubeCoord", "terrainDefinition", "directionsProvider", "perf"]) {
  assert.ok(pathfinding.includes(dependency), `explicit dependency missing: ${dependency}`);
}
for (const forbidden of [
  "document", "window", "localStorage", "sessionStorage", "indexedDB",
  "arenaStorageReadJson", "arenaStorageWriteJson", "ARENA_MAP_STORAGE_KEY",
  "HEX_DIRECTIONS", "state."
]) {
  assert.ok(!pathfinding.includes(forbidden), `pathfinding boundary must not own ${forbidden}`);
}

const facades = [
  "mapRuntimeCellIndex", "mapRuntimeHexDistance", "mapRuntimeNeighbors",
  "mapRuntimeReachableKeys", "mapRuntimeSingleCellChokes",
  "mapRuntimeObstacleSymmetryIssues", "findMapPath", "mapReachableCells"
];
for (const facade of facades) {
  assert.strictEqual((runtime.match(new RegExp(`function ${facade}\\(`, "g")) || []).length, 1, `${facade} facade must be unique`);
}
assert.ok(runtime.includes("createMapPathfindingService({"));
assert.ok(runtime.includes("perf: MAP_RUNTIME_PERF"));
assert.ok(!runtime.includes("const cellIndexCache = new WeakMap()"));
assert.ok(!runtime.includes("function takeLowestCost("));
assert.ok(!runtime.includes("function symmetryTargets("));
assert.ok(validation.includes("findPath") && validation.includes("reachableKeys"));
assert.ok(movement.includes("mapReachableCells(state.mapDefinition"));

const normalizationIndex = index.indexOf('<script src="src/map_normalization.js"></script>');
const pathfindingIndex = index.indexOf('<script src="src/map_pathfinding.js"></script>');
const validationIndex = index.indexOf('<script src="src/map_validation.js"></script>');
const runtimeIndex = index.indexOf('<script src="src/map_runtime.js"></script>');
assert.ok(normalizationIndex >= 0 && normalizationIndex < pathfindingIndex);
assert.ok(pathfindingIndex < validationIndex && validationIndex < runtimeIndex);

console.log(JSON.stringify({
  status:"PASS",
  boundary:"src/map_pathfinding.js",
  direction:"geometry/terrain dependencies -> pathfinding -> validation/movement consumers",
  legacyFacades:facades,
  domFree:true,
  storageFree:true,
  stateFree:true
}, null, 2));
