"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = [
  "data/terrain_registry.js",
  "data/official_maps_f9r3.js",
  "data/official_maps_f9s1b1.js",
  "data/official_maps_f9w2a1.js",
  "data/map_definitions.js",
  "src/map_normalization.js",
  "src/map_pathfinding.js",
  "src/map_validation.js",
  "src/map_persistence.js",
  "src/map_state_queries.js",
  "src/map_runtime.js"
];
const runtimeSource = files.map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
const prefix = `
let __storedValue;
let __readKeys = [];
let __writeRecords = [];
let __writeOk = true;
let __clockIndex = 0;
class Date {
  constructor() {
    this.value = \`2026-09-03T12:00:\${String(__clockIndex++).padStart(2, "0")}.000Z\`;
  }
  toISOString() { return this.value; }
}
function __clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function arenaStorageReadJson(key, fallback) {
  __readKeys.push(key);
  return __storedValue === undefined ? __clone(fallback) : __storedValue;
}
function arenaStorageWriteJson(key, value) {
  __writeRecords.push({ key, value:__clone(value), ok:__writeOk });
  __storedValue = __clone(value);
  return __writeOk;
}
`;
const checks = `
const projectSave = result => ({
  ok:result.ok,
  code:result.code || null,
  issues:result.issues || [],
  id:result.definition ? result.definition.id : null,
  metadata:result.definition ? result.definition.metadata : null,
  valid:result.validation ? result.validation.valid : null,
  errors:result.validation ? result.validation.errors.map(issue => issue.code) : []
});

const empty = mapRuntimeReadCustomStore();
__storedValue = null;
const nullStore = mapRuntimeReadCustomStore();
__storedValue = [];
const arrayStore = mapRuntimeReadCustomStore();
__storedValue = { schemaVersion:9, maps:[] };
const malformedMaps = mapRuntimeReadCustomStore();

const writeInput = { schemaVersion:9, maps:[] };
const writeNormalized = mapRuntimeWriteCustomStore(writeInput);
const writeMutation = __clone(writeInput);

__storedValue = undefined;
__readKeys = [];
__writeRecords = [];

const duplicate = duplicateMapDefinition("map1_starter", "persist_test");
const saved = saveCustomMapDefinition(duplicate.definition);
const retrieved = getMapDefinitionById("persist_test");
const conflict = saveCustomMapDefinition(duplicate.definition);

const overwriteInput = mapRuntimeClone(saved.definition);
overwriteInput.name = "Persistence overwrite";
overwriteInput.metadata.revision = 7;
const overwritten = saveCustomMapDefinition(overwriteInput, { overwrite:true });

const builtinConflict = saveCustomMapDefinition(getMapDefinitionById("map1_starter"));
const invalidInput = mapRuntimeClone(overwritten.definition);
invalidInput.id = "persist_invalid";
invalidInput.geometry.cells = [];
const invalid = saveCustomMapDefinition(invalidInput);

const exported = exportMapDefinitionJson(overwritten.definition);
const imported = importMapDefinitionJson(exported.json, { save:false });

__writeOk = false;
const writeFailureInput = mapRuntimeClone(overwritten.definition);
writeFailureInput.id = "persist_write_failure";
const writeFailure = saveCustomMapDefinition(writeFailureInput);
__writeOk = true;

const deleteBuiltin = deleteCustomMapDefinition("map1_starter");
const deleteMissing = deleteCustomMapDefinition("does_not_exist");
const deleteExisting = deleteCustomMapDefinition("persist_test");
const finalDefinitions = getCustomMapDefinitions();

return {
  storeRecovery:{ empty, nullStore, arrayStore, malformedMaps },
  writeNormalization:{ ok:writeNormalized, mutation:writeMutation },
  duplicate:{ ok:duplicate.ok, id:duplicate.definition.id, metadata:duplicate.definition.metadata },
  save:projectSave(saved),
  retrieved:{ id:retrieved.id, name:retrieved.name, official:retrieved.official, editable:retrieved.editable, metadata:retrieved.metadata },
  conflict:projectSave(conflict),
  overwrite:projectSave(overwritten),
  builtinConflict:projectSave(builtinConflict),
  invalid:projectSave(invalid),
  exportImport:{
    exportOk:exported.ok,
    envelope:JSON.parse(exported.json),
    importOk:imported.ok,
    importConflict:imported.conflict,
    importId:imported.definition.id,
    importValid:imported.validation.valid
  },
  writeFailure:projectSave(writeFailure),
  deletion:{ builtin:deleteBuiltin, missing:deleteMissing, existing:deleteExisting },
  finalIds:finalDefinitions.map(definition => definition.id),
  storage:{ readKeys:__readKeys, writes:__writeRecords.map(record => ({ key:record.key, ok:record.ok, ids:Object.keys(record.value.maps) })) }
};
`;

const corpus = new Function(prefix + runtimeSource + checks)();
const fallbackCorpus = new Function(runtimeSource + `
const writeInput = { schemaVersion:7, maps:[] };
return {
  read:mapRuntimeReadCustomStore(),
  writeResult:mapRuntimeWriteCustomStore(writeInput),
  writeMutation:writeInput
};
`)();
const fullCorpus = { corpus, fallbackCorpus };
const hash = crypto.createHash("sha256").update(JSON.stringify(fullCorpus)).digest("hex");
const expectedHash = "6a46b58cc6fd1fa8becbae9a8ff6f70e71ac3ea5b73a1e9b533ecff83f88e400";

assert.strictEqual(hash, expectedHash, `map persistence characterization changed: ${hash}`);
assert.strictEqual(corpus.save.ok, true);
assert.strictEqual(corpus.conflict.code, "E_MAP_ID_CONFLICT");
assert.strictEqual(corpus.builtinConflict.code, "E_MAP_BUILTIN_READ_ONLY");
assert.strictEqual(corpus.invalid.ok, false);
assert.strictEqual(corpus.writeFailure.ok, false);
assert.deepStrictEqual(corpus.deletion.builtin, { ok:false, code:"E_MAP_BUILTIN_READ_ONLY" });
assert.deepStrictEqual(corpus.deletion.missing, { ok:false, code:"E_MAP_NOT_FOUND" });
assert.strictEqual(fallbackCorpus.writeResult, false);

console.log(`AR-AC1 map persistence characterization: PASS (${hash})`);
