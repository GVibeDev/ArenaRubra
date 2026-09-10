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
const prefix = `
let __storeReads = 0;
let __storeWrites = 0;
function arenaStorageReadJson(_key, fallback) { __storeReads += 1; return JSON.parse(JSON.stringify(fallback)); }
function arenaStorageWriteJson() { __storeWrites += 1; return true; }
`;
const checks = `
const project = result => ({
  valid: result.valid,
  errors: result.errors.map(issue => issue.code),
  warnings: result.warnings.map(issue => issue.code),
  summary: result.summary
});
const builtins = getBuiltinMapDefinitions({ includeDisabled:true });
const corpus = {
  builtinOrder: builtins.map(map => map.id),
  builtins: builtins.map(map => [map.id, project(validateMapDefinition(map))]),
  invalid: {}
};
const base = getMapDefinitionById("map1_starter");
const cases = {
  schema: map => { map.schemaVersion = 99; },
  id: map => { map.id = "INVALID MAP ID"; },
  movement: map => { map.movementMultiplier = 4; },
  empty: map => { map.geometry.cells = []; },
  duplicateCoord: map => { map.geometry.cells.push(mapRuntimeClone(map.geometry.cells[0])); },
  unknownTerrain: map => { map.geometry.cells[0].terrainType = "unknown_terrain"; },
  hazardType: map => { map.initialHazards = [{ id:"bad-hazard", type:"fire", coord:[0,0,0] }]; },
  hqCount: map => { map.playerSlots.pop(); },
  duplicateHq: map => { map.playerSlots[1].headquarters = [...map.playerSlots[0].headquarters]; },
  missingCenter: map => {
    map.centralStrategicPointId = null;
    map.strategicPoints.forEach(ps => { ps.tags = ps.tags.filter(tag => tag !== "central"); });
  },
  centerNotFound: map => { map.centralStrategicPointId = "missing-ps"; },
  obstacleOnPs: map => {
    const key = mapRuntimeCellKey(map.strategicPoints[0].coord);
    map.geometry.cells.find(cell => mapRuntimeCellKey(cell.coord) === key).terrainType = "obstacle";
  }
};
for (const [name, mutate] of Object.entries(cases)) {
  const candidate = mapRuntimeClone(base);
  mutate(candidate);
  corpus.invalid[name] = project(validateMapDefinition(candidate));
}
const imported = validateMapDefinition(base, { imported:true });
corpus.importedFlags = {
  valid: imported.valid,
  official: imported.definition.official,
  editable: imported.definition.editable
};
corpus.perf = { ...MAP_RUNTIME_PERF };
corpus.storage = { reads:__storeReads, writes:__storeWrites };
return corpus;
`;

const source = prefix + files.map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + checks;
const corpus = new Function(source)();
const serialized = JSON.stringify(corpus);
const hash = crypto.createHash("sha256").update(serialized).digest("hex");
const expectedHash = "49fe142d7b414997eda0cff008297ab391fdd0f397bfb3cbcd46943b4b8d9222";

assert.strictEqual(hash, expectedHash, `map validation characterization changed: ${hash}`);
assert.strictEqual(corpus.builtins.length, 12);
assert.strictEqual(corpus.builtins.filter(([, result]) => result.valid).length, 10);
assert.deepStrictEqual(corpus.importedFlags, { valid:true, official:false, editable:true });
assert.deepStrictEqual(corpus.storage, { reads:0, writes:0 });

console.log(`AR-AC1 map validation characterization: PASS (${hash})`);
