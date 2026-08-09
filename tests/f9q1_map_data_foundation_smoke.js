"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = [
  "data/terrain_registry.js",
  "data/map_definitions.js",
  "src/map_runtime.js"
];
const prefix = `
let __store = { schemaVersion: 1, maps: {} };
function arenaStorageReadJson(_key, fallback) { return JSON.parse(JSON.stringify(__store || fallback)); }
function arenaStorageWriteJson(_key, value) { __store = JSON.parse(JSON.stringify(value)); return true; }
`;
const checks = `
const maps = Object.values(BUILTIN_MAP_DEFINITIONS);
assert.strictEqual(maps.length, 3);
const map1 = BUILTIN_MAP_DEFINITIONS.map1_starter;
const map2 = BUILTIN_MAP_DEFINITIONS.map2_triumvirate;
const map3 = BUILTIN_MAP_DEFINITIONS.map3_quadrivium;
assert.deepStrictEqual(
  maps.map(map => [map.id, map.playerCount, map.movementMultiplier, map.geometry.cells.length]),
  [
    ["map1_starter", 2, 1, 127],
    ["map2_triumvirate", 3, 2, 229],
    ["map3_quadrivium", 4, 3, 265]
  ]
);
for (const map of maps) {
  const validation = validateMapDefinition(map);
  assert.strictEqual(validation.valid, true, map.id + ": " + JSON.stringify(validation.errors));
  assert.strictEqual(validation.errors.length, 0);
  assert.strictEqual(validation.warnings.length, 0, map.id + ": " + JSON.stringify(validation.warnings));
  assert.strictEqual(map.playerSlots.length, map.playerCount);
  assert.ok(map.geometry.cells.every(cell => mapRuntimeValidCubeCoord(cell.coord)));
  assert.ok(map.playerSlots.every(slot => findMapPath(map, slot.headquarters, map.strategicPoints[0].coord)));
}
assert.deepStrictEqual(map1.playerSlots.map(slot => slot.headquarters), [[-6,0,6],[6,0,-6]]);
assert.deepStrictEqual(map1.strategicPoints.map(ps => ps.coord), [[0,0,0],[0,-4,4],[0,4,-4]]);
assert.deepStrictEqual(mapTerrainUsage(map1), { free: 127 });
assert.ok(map2.geometry.components.length === 2 && map3.geometry.components.length === 3);
assert.ok(mapTerrainUsage(map2).obstacle > 0 && mapTerrainUsage(map2).difficult > 0);
assert.ok(mapTerrainUsage(map3).defensive > 0 && mapTerrainUsage(map3).exposed > 0);
assert.ok(map2.initialHazards.some(hazard => hazard.type === "mine"));
assert.ok(map2.initialHazards.some(hazard => hazard.type === "trap"));
assert.strictEqual(terrainDefinition("difficult").movementCost, 2);
assert.strictEqual(terrainDefinition("difficult").movementFactor, 0.5);
assert.strictEqual(terrainDefinition("defensive").defenseModifier, 1);
assert.strictEqual(terrainDefinition("exposed").defenseModifier, -1);
assert.strictEqual(terrainDefinition("obstacle").blocksMovement, true);

const exported = exportMapDefinitionJson(map2);
assert.strictEqual(exported.ok, true);
const parsed = JSON.parse(exported.json);
assert.strictEqual(parsed.kind, "arena-rubra-map");
assert.strictEqual(parsed.schemaVersion, MAP_SCHEMA_VERSION);
const imported = importMapDefinitionJson(exported.json, { save: false });
assert.strictEqual(imported.ok, true);
assert.strictEqual(imported.conflict, true);
assert.notStrictEqual(imported.definition.id, map2.id);
assert.strictEqual(imported.definition.official, false);

const duplicate = duplicateMapDefinition("map3_quadrivium");
assert.strictEqual(duplicate.ok, true);
assert.strictEqual(duplicate.definition.metadata.sourceMapId, "map3_quadrivium");
const saved = saveCustomMapDefinition(duplicate.definition);
assert.strictEqual(saved.ok, true);
assert.ok(getCustomMapDefinitions().some(map => map.id === saved.definition.id));
assert.strictEqual(deleteCustomMapDefinition("map1_starter").ok, false);
assert.strictEqual(deleteCustomMapDefinition(saved.definition.id).ok, true);

const corrupt = mapRuntimeClone(map2);
corrupt.geometry.cells.push(mapRuntimeClone(corrupt.geometry.cells[0]));
const badValidation = validateMapDefinition(corrupt);
assert.strictEqual(badValidation.valid, false);
assert.ok(badValidation.errors.some(issue => issue.code === "E_MAP_DUPLICATE_COORD"));

console.log("F9Q1 map data foundation smoke: OK");
`;

const source = prefix + files.map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + checks;
new Function("assert", "console", source)(assert, console);
