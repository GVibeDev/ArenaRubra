"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const persistence = read("src/map_persistence.js");
const runtime = read("src/map_runtime.js");
const editor = read("src/map_editor.js");
const backgrounds = read("src/map_backgrounds.js");
const index = read("index.html");

assert.ok(persistence.includes("function createMapPersistenceService(dependencies = {})"));
for (const api of ["readStore", "writeStore", "getDefinitions", "getById", "saveDefinition", "deleteDefinition"]) {
  assert.ok(persistence.includes(api), `persistence API missing: ${api}`);
}
for (const dependency of [
  "storageKey", "schemaVersion", "readJson", "writeJson", "safeId",
  "normalizeDefinition", "validateDefinition", "isBuiltinId", "nowIso"
]) {
  assert.ok(persistence.includes(dependency), `explicit dependency missing: ${dependency}`);
}
for (const forbidden of [
  /\bdocument\b/, /\bwindow\b/, /localStorage\s*\./, /sessionStorage\s*\./,
  /indexedDB\s*\./, /arenaStorageReadJson\s*\(/, /arenaStorageWriteJson\s*\(/,
  /ArenaDataStore\s*\./, /\bstate\s*\./
]) {
  assert.ok(!forbidden.test(persistence), `persistence boundary owns forbidden API: ${forbidden}`);
}
for (const code of ["E_MAP_BUILTIN_READ_ONLY", "E_MAP_ID_CONFLICT", "E_MAP_NOT_FOUND"]) {
  assert.ok(persistence.includes(code), `persistence result code missing: ${code}`);
  assert.ok(!runtime.includes(code), `runtime must not own persistence result code: ${code}`);
}

for (const facade of [
  "mapRuntimeReadCustomStore", "mapRuntimeWriteCustomStore", "getCustomMapDefinitions",
  "saveCustomMapDefinition", "deleteCustomMapDefinition"
]) {
  assert.strictEqual((runtime.match(new RegExp(`function ${facade}\\(`, "g")) || []).length, 1, `${facade} facade must be unique`);
}
assert.ok(runtime.includes("createMapPersistenceService({"));
assert.ok(runtime.includes("storageKey: ARENA_MAP_STORAGE_KEY"));
assert.ok(runtime.includes("readJson: (key, fallback)"));
assert.ok(runtime.includes("writeJson: (key, value)"));
assert.ok(runtime.includes("mapRuntimeGetPersistenceService().saveDefinition(rawDefinition, options)"));
assert.ok(runtime.includes("mapRuntimeGetPersistenceService().deleteDefinition(mapId)"));
assert.ok(!runtime.includes("arenaStorageReadJson(ARENA_MAP_STORAGE_KEY"));
assert.ok(!runtime.includes("arenaStorageWriteJson(ARENA_MAP_STORAGE_KEY"));

assert.ok(editor.includes("saveCustomMapDefinition("));
assert.ok(editor.includes("deleteCustomMapDefinition("));
assert.ok(backgrounds.includes("saveCustomMapDefinition("));

const validationIndex = index.indexOf('<script src="src/map_validation.js"></script>');
const persistenceIndex = index.indexOf('<script src="src/map_persistence.js"></script>');
const runtimeIndex = index.indexOf('<script src="src/map_runtime.js"></script>');
assert.ok(validationIndex >= 0 && validationIndex < persistenceIndex);
assert.ok(persistenceIndex < runtimeIndex);

console.log(JSON.stringify({
  status:"PASS",
  boundary:"src/map_persistence.js",
  direction:"storage ports + map services -> custom map persistence -> legacy runtime/editor facades",
  legacyFacades:[
    "mapRuntimeReadCustomStore", "mapRuntimeWriteCustomStore", "getCustomMapDefinitions",
    "saveCustomMapDefinition", "deleteCustomMapDefinition"
  ],
  domFree:true,
  directBrowserStorageFree:true,
  stateFree:true
}, null, 2));
