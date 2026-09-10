"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const validation = read("src/map_validation.js");
const runtime = read("src/map_runtime.js");
const index = read("index.html");

assert.ok(validation.includes("function createMapValidationService(dependencies = {})"));
assert.ok(validation.includes("function validateDefinition(rawDefinition, options = {})"));
assert.ok(validation.includes("return Object.freeze({ validateDefinition })"));

for (const dependency of [
  "normalizeDefinition", "validCubeCoord", "cellKey", "safeId", "terrainDefinition",
  "terrainAt", "hexDistance", "reachableKeys", "singleCellChokes", "findPath",
  "obstacleSymmetryIssues", "getCentralStrategicPoint", "terrainUsage"
]) {
  assert.ok(validation.includes(dependency), `explicit dependency missing: ${dependency}`);
}

for (const forbidden of [
  "document", "window", "localStorage", "sessionStorage", "indexedDB",
  "arenaStorageReadJson", "arenaStorageWriteJson", "ARENA_MAP_STORAGE_KEY", "state."
]) {
  assert.ok(!validation.includes(forbidden), `validation boundary must not own ${forbidden}`);
}

assert.ok(runtime.includes("function validateMapDefinition(rawDefinition, options = {})"));
assert.ok(runtime.includes("mapRuntimeGetValidationService().validateDefinition(rawDefinition, options)"));
assert.ok(!runtime.includes("E_MAP_CENTRAL_PS_NOT_EQUIDISTANT"), "validation rules leaked back into map runtime");
assert.strictEqual((runtime.match(/function validateMapDefinition\(/g) || []).length, 1);

const definitionsIndex = index.indexOf('<script src="data/map_definitions.js"></script>');
const validationIndex = index.indexOf('<script src="src/map_validation.js"></script>');
const runtimeIndex = index.indexOf('<script src="src/map_runtime.js"></script>');
const editorIndex = index.indexOf('ArenaRuntimeProfile.loadScript("src/map_editor.js","dev")');
assert.ok(definitionsIndex >= 0 && definitionsIndex < validationIndex);
assert.ok(validationIndex < runtimeIndex && runtimeIndex < editorIndex);

console.log(JSON.stringify({
  status:"PASS",
  boundary:"src/map_validation.js",
  direction:"map data -> validation service <- explicit runtime dependencies",
  legacyFacade:"validateMapDefinition",
  domFree:true,
  storageFree:true
}, null, 2));
