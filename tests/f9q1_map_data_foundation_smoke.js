"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = [
  "data/terrain_registry.js",
  "data/official_maps_f9r3.js",
  "data/map_definitions.js",
  "src/map_runtime.js"
];
const prefix = `
let __store = { schemaVersion: 1, maps: {} };
function arenaStorageReadJson(_key, fallback) { return JSON.parse(JSON.stringify(__store || fallback)); }
function arenaStorageWriteJson(_key, value) { __store = JSON.parse(JSON.stringify(value)); return true; }
`;
const checks = `
const maps = getAvailableMapDefinitions();
assert.deepStrictEqual(
  maps.map(map => [map.id, map.playerCount, map.movementMultiplier, map.geometry.cells.length]),
  [
    ["map1_starter", 2, 1, 127],
    ["custom_single_ms0nf51r", 4, 3, 469],
    ["map1_starter_copy", 4, 2, 127],
    ["custom_double_ms0ra3ds", 2, 2, 229],
    ["map3_quadrivium_copy", 4, 3, 575],
    ["custom_double_ms0cunhu", 3, 2, 383]
  ]
);
for (const map of maps) {
  const validation = validateMapDefinition(map);
  assert.strictEqual(validation.valid, true, map.id + ": " + JSON.stringify(validation.errors));
  assert.strictEqual(validation.errors.length, 0);
  assert.strictEqual(map.official, true);
  assert.strictEqual(map.enabled, true);
  assert.strictEqual(map.playerSlots.length, map.playerCount);
  assert.ok(map.geometry.cells.every(cell => mapRuntimeValidCubeCoord(cell.coord)));
  const center = getCentralStrategicPoint(map);
  assert.ok(center, map.id + " must expose a semantic central PS");
  assert.strictEqual(center.id, map.centralStrategicPointId);
  const distances = centralStrategicPointLinearDistances(map);
  assert.ok(distances.length === map.playerCount);
  assert.ok(distances.every(item => item.distance === distances[0].distance), map.id + " center must be linearly equidistant");
  assert.ok(map.playerSlots.every(slot => findMapPath(map, slot.headquarters, center.coord)));
}

const map1 = getMapDefinitionById("map1_starter");
assert.deepStrictEqual(map1.playerSlots.map(slot => slot.headquarters), [[-6,0,6],[6,0,-6]]);
assert.deepStrictEqual(map1.strategicPoints.map(ps => ps.coord), [[0,0,0],[0,-4,4],[0,4,-4]]);
assert.deepStrictEqual(mapTerrainUsage(map1), { free: 127 });
assert.strictEqual(getCentralStrategicPoint(map1).id, "ps-center");

const diamond = getMapDefinitionById("custom_single_ms0nf51r");
const narrow = getMapDefinitionById("custom_double_ms0ra3ds");
const triple = getMapDefinitionById("map3_quadrivium_copy");
const valley = getMapDefinitionById("custom_double_ms0cunhu");
assert.ok(mapTerrainUsage(diamond).obstacle > 0 && mapTerrainUsage(diamond).difficult > 0);
assert.ok(mapTerrainUsage(triple).defensive > 0 && mapTerrainUsage(triple).exposed > 0);
assert.ok(narrow.presentation.backgroundAssetPath.includes("f9r3_narrow_path_desertcenter.webp"));
assert.strictEqual(valley.playerCount, 3);
assert.strictEqual(new Set(valley.initialHazards.map(hazard => hazard.id)).size, valley.initialHazards.length);
assert.strictEqual(new Set(triple.strategicPoints.map(ps => ps.id)).size, triple.strategicPoints.length);

const legacyMap2 = getMapDefinitionById("map2_triumvirate");
const legacyMap3 = getMapDefinitionById("map3_quadrivium");
assert.ok(legacyMap2 && legacyMap3, "legacy map IDs remain resolvable for old saves/logs");
assert.strictEqual(legacyMap2.enabled, false);
assert.strictEqual(legacyMap3.enabled, false);
assert.ok(!maps.some(map => map.id === legacyMap2.id || map.id === legacyMap3.id));

assert.strictEqual(terrainDefinition("difficult").movementCost, 2);
assert.strictEqual(terrainDefinition("difficult").movementFactor, 0.5);
assert.strictEqual(terrainDefinition("defensive").defenseModifier, 1);
assert.strictEqual(terrainDefinition("exposed").defenseModifier, -1);
assert.strictEqual(terrainDefinition("obstacle").blocksMovement, true);

const exported = exportMapDefinitionJson(narrow);
assert.strictEqual(exported.ok, true);
const parsed = JSON.parse(exported.json);
assert.strictEqual(parsed.kind, "arena-rubra-map");
assert.strictEqual(parsed.schemaVersion, MAP_SCHEMA_VERSION);
const imported = importMapDefinitionJson(exported.json, { save: false });
assert.strictEqual(imported.ok, true);
assert.strictEqual(imported.conflict, true);
assert.notStrictEqual(imported.definition.id, narrow.id);
assert.strictEqual(imported.definition.official, false);
assert.strictEqual(imported.definition.centralStrategicPointId, "ps-center");

const duplicate = duplicateMapDefinition("map3_quadrivium_copy");
assert.strictEqual(duplicate.ok, true);
assert.strictEqual(duplicate.definition.metadata.sourceMapId, "map3_quadrivium_copy");
const saved = saveCustomMapDefinition(duplicate.definition);
assert.strictEqual(saved.ok, true);
assert.ok(getCustomMapDefinitions().some(map => map.id === saved.definition.id));
assert.strictEqual(deleteCustomMapDefinition("map1_starter").ok, false);
assert.strictEqual(deleteCustomMapDefinition(saved.definition.id).ok, true);

const corrupt = mapRuntimeClone(narrow);
corrupt.geometry.cells.push(mapRuntimeClone(corrupt.geometry.cells[0]));
const badValidation = validateMapDefinition(corrupt);
assert.strictEqual(badValidation.valid, false);
assert.ok(badValidation.errors.some(issue => issue.code === "E_MAP_DUPLICATE_COORD"));

console.log("F9Q1 map data foundation smoke: official F9R3 set and legacy compatibility OK");
`;

const source = prefix + files.map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + checks;
new Function("assert", "console", source)(assert, console);
