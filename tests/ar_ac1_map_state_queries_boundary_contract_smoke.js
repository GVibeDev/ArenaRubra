"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const queries = read("src/map_state_queries.js");
const runtime = read("src/map_runtime.js");
const board = read("src/board.js");
const ai = read("src/ai.js");
const movement = read("src/movement.js");
const index = read("index.html");

assert.ok(queries.includes("function createMapStateQueriesService(dependencies = {})"));
const serviceApis = [
  "activeMapDefinition", "activeMapCells", "mapCell", "mapHeadquarters",
  "mapStrategicPoints", "centralStrategicPoint", "centralStrategicPointCoord",
  "isCentralStrategicPoint", "centralStrategicPointDistances", "mapDeploymentDefinition",
  "isMapCoordValid", "mapTerrainAt", "terrainUsage", "mapMovementMultiplier",
  "terrainMovementCost", "terrainDefenseModifier", "effectiveDefense", "playerIds",
  "playerById", "activePlayers", "enemyPlayers", "playerEliminated", "enemySide",
  "enemyCombatUnits", "nextActivePlayerId", "playerHeadquarters"
];
for (const api of serviceApis) assert.ok(queries.includes(api), `state-query API missing: ${api}`);

for (const dependency of [
  "getState", "getDefaultDefinition", "cellIndex", "cellKey", "clone",
  "terrainDefinition", "centerCoord", "hexDistance", "hasPlayerActive",
  "playerActive", "hasCombatUnits", "combatUnits", "hasHeadquartersLookup",
  "headquartersLookup"
]) {
  assert.ok(queries.includes(dependency), `explicit dependency missing: ${dependency}`);
}
for (const forbidden of [
  /\bdocument\b/, /\bwindow\b/, /localStorage\s*\./, /sessionStorage\s*\./,
  /indexedDB\s*\./, /arenaStorageReadJson\s*\(/, /arenaStorageWriteJson\s*\(/,
  /ArenaDataStore\s*\./, /\bstate\s*\./
]) {
  assert.ok(!forbidden.test(queries), `state-query boundary owns forbidden global/API: ${forbidden}`);
}

const facades = [
  "getActiveMapDefinition", "getActiveMapCells", "getMapCell", "getMapHeadquarters",
  "getMapStrategicPoints", "getCentralStrategicPoint", "getCentralStrategicPointCoord",
  "isCentralStrategicPointCoord", "centralStrategicPointLinearDistances",
  "getMapDeploymentDefinition", "isMapCoordValid", "getMapTerrainAt", "mapTerrainUsage",
  "getMapMovementMultiplier", "getTerrainMovementCost", "getTerrainDefenseModifier",
  "getEffectiveDefense", "mapRuntimePlayerIds", "getPlayerById", "getActivePlayers",
  "getEnemyPlayers", "isPlayerEliminated", "isEnemySide", "enemyCombatUnits",
  "getNextActivePlayerId", "getPlayerHeadquarters"
];
for (const facade of facades) {
  assert.strictEqual((runtime.match(new RegExp(`function ${facade}\\(`, "g")) || []).length, 1, `${facade} facade must be unique`);
}
assert.ok(runtime.includes("createMapStateQueriesService({"));
assert.ok(runtime.includes('getState: () => typeof state !== "undefined" ? state : null'));
assert.ok(runtime.includes('hasPlayerActive: () => typeof isPlayerActive === "function"'));
assert.ok(runtime.includes('hasCombatUnits: () => typeof combatUnits === "function"'));
assert.ok(runtime.includes('hasHeadquartersLookup: () => typeof getHq === "function"'));
for (const removedImplementation of [
  "source.players.map(player => Number(player.id))",
  "combatUnits(null).filter(unit => enemyIds.has(Number(unit.side)))",
  "points.find(ps => Array.isArray(ps.tags) && ps.tags.includes(\"central\"))",
  "terrain.blocksMovement || terrain.blocksOccupation"
]) {
  assert.ok(!runtime.includes(removedImplementation), `runtime still owns query implementation: ${removedImplementation}`);
}

assert.ok(board.includes("getMapTerrainAt(coord)"));
assert.ok(ai.includes("getEnemyPlayers(player)"));
assert.ok(movement.includes("getMapMovementMultiplier()"));

const persistenceIndex = index.indexOf('<script src="src/map_persistence.js"></script>');
const queriesIndex = index.indexOf('<script src="src/map_state_queries.js"></script>');
const runtimeIndex = index.indexOf('<script src="src/map_runtime.js"></script>');
const lifecycleIndex = index.indexOf('<script src="src/player_lifecycle.js"></script>');
assert.ok(persistenceIndex >= 0 && persistenceIndex < queriesIndex);
assert.ok(queriesIndex < runtimeIndex && runtimeIndex < lifecycleIndex);

console.log(JSON.stringify({
  status:"PASS",
  boundary:"src/map_state_queries.js",
  direction:"state/map/terrain ports -> query service -> unchanged runtime/gameplay facades",
  legacyFacadeCount:facades.length,
  domFree:true,
  storageFree:true,
  directStateGlobalFree:true,
  lateHookResolution:true
}, null, 2));
