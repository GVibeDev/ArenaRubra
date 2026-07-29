"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = [
  "data/maps.js",
  "src/hex.js",
  "data/terrain_registry.js",
  "data/map_definitions.js",
  "src/map_runtime.js",
  "src/state.js",
  "src/movement.js"
];
const prefix = `
const START_ENE = 5;
let __store = { schemaVersion: 1, maps: {} };
function arenaStorageReadJson(_key, fallback) { return JSON.parse(JSON.stringify(__store || fallback)); }
function arenaStorageWriteJson(_key, value) { __store = JSON.parse(JSON.stringify(value)); return true; }
const document = { getElementById() { return null; } };
function currentPace() { return { vehicleMove: 1 }; }
function canMove(unit) { return Boolean(unit && unit.alive !== false); }
function isCellBlockedByEffect() { return false; }
function getUnitAt(coord) {
  return state.units.find(unit => unit.alive && Array.isArray(unit.pos) && sameCoord(unit.pos, coord)) || null;
}
function isCellEnterable(coord) {
  const terrain = getMapTerrainAt(coord);
  return isMapCoordValid(coord) && terrain && !terrain.blocksMovement && !terrain.blocksOccupation;
}
`;
const checks = `
function setupFor(mapId, firstPlayer) {
  const definition = getMapDefinitionById(mapId);
  const ids = Array.from({ length: definition.playerCount }, (_, index) => index + 1);
  return {
    mapId,
    mapDefinition: definition,
    firstPlayer,
    factions: Object.fromEntries(ids.map(id => [id, ["Nexus","Exordium","Liberti","Agathoi"][id - 1]])),
    selectedCommanders: {},
    selectedDecks: {},
    modes: Object.fromEntries(ids.map(id => [id, "bot"])),
    autoResignEnabled: false,
    aiMode: "advanced",
    pacePreset: "standard",
    gameScaleMode: "large_scale"
  };
}

state = createInitialGameState(setupFor("map3_quadrivium", 3));
assert.deepStrictEqual(state.playerIds, [1,2,3,4]);
assert.deepStrictEqual(state.turnOrder, [3,4,1,2]);
assert.strictEqual(state.currentPlayer, 3);
assert.strictEqual(state.players.length, 4);
assert.ok([1,2,3,4].every(id => state.energy[id] === START_ENE));
assert.ok([1,2,3,4].every(id => Array.isArray(state.hand[id]) && Array.isArray(state.deck[id])));
assert.ok([1,2,3,4].every(id => state.missionTelemetry.cyclesStarted[id] === 0));
assert.strictEqual(state.mapRuntime.movementMultiplier, 3);
assert.deepStrictEqual(createHq(4).pos, [12,-6,-6]);

state = createInitialGameState(setupFor("map2_triumvirate", 1));
const unit = {
  uid: "move-test",
  type: "Fanteria",
  pos: [0,0,0],
  alive: true,
  currentHp: 2,
  side: 1,
  warPush: false,
  c1fMoveBonus: 0,
  c2c5bMoveBonus: 0,
  c2c5bDoubleMove: false
};
state.units.push(unit);
assert.strictEqual(movementRangeFor(unit), 2);
const reachable = movableCells(unit);
assert.ok(reachable.length > 0);
assert.ok(reachable.every(coord => getMapTerrainAt(coord).id !== "obstacle"));
const difficult = state.cells.find(cell => cell.terrainType === "difficult");
if (difficult) {
  const adjacentFree = mapRuntimeNeighbors(difficult.coord).find(coord => {
    const terrain = getMapTerrainAt(coord);
    return terrain && terrain.id === "free";
  });
  if (adjacentFree) {
    const reach = mapReachableCells(state.mapDefinition, adjacentFree, 1);
    assert.ok(!reach.some(entry => sameCoord(entry.coord, difficult.coord)), "difficult must cost 2");
  }
}

const defensiveCell = state.cells.find(cell => cell.terrainType === "defensive");
unit.pos = [...defensiveCell.coord];
unit.currentDef = 2;
assert.strictEqual(getTerrainDefenseModifier(unit), 1);
assert.strictEqual(getEffectiveDefense(unit), 3);
assert.strictEqual(getEffectiveDefense(unit), 3, "defensive modifier must not accumulate");
const exposedCell = state.cells.find(cell => cell.terrainType === "exposed");
unit.pos = [...exposedCell.coord];
assert.strictEqual(getEffectiveDefense(unit), 1);
assert.strictEqual(getEffectiveDefense(unit), 1, "exposed modifier must not accumulate");
const freeCell = state.cells.find(cell => cell.terrainType === "free" && cell.cellRole === "normal" && !cell.initialHazard);
unit.pos = [...freeCell.coord];
assert.strictEqual(getEffectiveDefense(unit), 2, "leaving terrain must restore derived defense");
const obstacleCell = state.cells.find(cell => cell.terrainType === "obstacle");
assert.strictEqual(isCellEnterable(obstacleCell.coord), false);
assert.strictEqual(getMapTerrainAt(obstacleCell.coord).blocksDeployment, true);
for (const hazard of state.mapDefinition.initialHazards) {
  const hazardCell = getMapCell(hazard.coord, state.mapDefinition);
  assert.ok(hazardCell.initialHazard);
  assert.notStrictEqual(hazardCell.terrainType, "obstacle");
}
assert.ok(state.cells.filter(cell => cell.cellRole === "headquarters").every(cell => cell.terrainType === "free"));
assert.ok(state.cells.filter(cell => cell.cellRole === "strategic_point").every(cell => cell.terrainType !== "obstacle"));
assert.deepStrictEqual(mapRuntimeObstacleSymmetryIssues(state.mapDefinition), []);

state.players.find(player => player.id === 2).eliminated = true;
assert.deepStrictEqual(getActivePlayers(), [1,3]);
assert.strictEqual(getNextActivePlayerId(1), 3);
assert.ok(getEnemyPlayers(1).includes(3) && !getEnemyPlayers(1).includes(2));
assert.strictEqual(getNextActivePlayerId(3), 1);

state = createInitialGameState(setupFor("map3_quadrivium", 1));
assert.ok(state.playerIds.every(id => state.modes[id] === "bot"));
state.players.find(player => player.id === 2).eliminated = true;
state.players.find(player => player.id === 3).eliminated = true;
assert.strictEqual(getNextActivePlayerId(1), 4);

state = createInitialGameState(setupFor("map1_starter", 2));
assert.strictEqual(state.cells.length, 127);
assert.deepStrictEqual(state.turnOrder, [2,1]);
assert.deepStrictEqual(state.mapRuntime.terrainUsage, { free: 127 });
assert.deepStrictEqual(createHq(1).pos, HQ_POS[1]);
assert.deepStrictEqual(createHq(2).pos, HQ_POS[2]);
console.log("F9Q2 multiplayer terrain smoke: OK");
`;

const source = prefix + files.map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + checks;
new Function("assert", "console", source)(assert, console);
