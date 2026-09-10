"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const normalization = read("src/map_normalization.js");
const validation = read("src/map_validation.js");
const runtime = read("src/map_runtime.js");
const index = read("index.html");

assert.ok(normalization.includes("function createMapNormalizationService(dependencies = {})"));
assert.ok(normalization.includes("function normalizeDefinition(rawDefinition, options = {})"));
assert.ok(normalization.includes("function normalizeCell(rawCell)"));
assert.ok(normalization.includes("function normalizeInitialHazard(rawHazard, index = 0)"));
assert.ok(normalization.includes("return Object.freeze({ normalizeDefinition })"));

for (const dependency of [
  "schemaVersion", "maxCells", "clone", "safeText", "safeId",
  "clampNumber", "safeImageDataUrl", "cellKey", "validCubeCoord"
]) {
  assert.ok(normalization.includes(dependency), `explicit dependency missing: ${dependency}`);
}

for (const forbidden of [
  "document", "window", "localStorage", "sessionStorage", "indexedDB",
  "arenaStorageReadJson", "arenaStorageWriteJson", "ARENA_MAP_STORAGE_KEY",
  "terrainDefinition", "state."
]) {
  assert.ok(!normalization.includes(forbidden), `normalization boundary must not own ${forbidden}`);
}

assert.ok(runtime.includes("function mapRuntimeNormalizeDefinition(rawDefinition, options = {})"));
assert.ok(runtime.includes("mapRuntimeGetNormalizationService().normalizeDefinition(rawDefinition, options)"));
assert.ok(!runtime.includes("function mapRuntimeNormalizeCell("));
assert.ok(!runtime.includes("function mapRuntimeNormalizeInitialHazard("));
assert.strictEqual((runtime.match(/function mapRuntimeNormalizeDefinition\(/g) || []).length, 1);
assert.ok(validation.includes("normalizeDefinition(raw, { imported: options.imported === true })"));

const definitionsIndex = index.indexOf('<script src="data/map_definitions.js"></script>');
const normalizationIndex = index.indexOf('<script src="src/map_normalization.js"></script>');
const validationIndex = index.indexOf('<script src="src/map_validation.js"></script>');
const runtimeIndex = index.indexOf('<script src="src/map_runtime.js"></script>');
assert.ok(definitionsIndex >= 0 && definitionsIndex < normalizationIndex);
assert.ok(normalizationIndex < validationIndex && validationIndex < runtimeIndex);

console.log(JSON.stringify({
  status:"PASS",
  boundary:"src/map_normalization.js",
  direction:"map data -> normalization -> validation/runtime consumers",
  legacyFacade:"mapRuntimeNormalizeDefinition",
  domFree:true,
  storageFree:true,
  terrainFree:true
}, null, 2));
