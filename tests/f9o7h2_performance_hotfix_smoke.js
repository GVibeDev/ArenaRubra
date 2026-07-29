"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const prefix = `
let state = null;
let mode = "idle";
let pendingAbility = null;
let pendingBuildBlueprintId = null;
let pendingPurchaseBlueprintId = null;
let pendingTacticId = null;
let selectedId = null;
function currentPace() { return { vehicleMove: 1 }; }
function canMove(unit) { return Boolean(unit && unit.alive !== false); }
function combatUnits() {
  return state.units.filter(unit => unit && unit.alive && unit.currentHp > 0 && Array.isArray(unit.pos) && unit.type !== "QG");
}
let getUnitAtCalls = 0;
function getUnitAt(coord) {
  getUnitAtCalls += 1;
  return combatUnits().find(unit => sameCoord(unit.pos, coord)) || null;
}
function isCellEnterable(coord) {
  const terrain = getMapTerrainAt(coord);
  const blocked = state.cellEffects.some(effect => effect.kind === "temporary_block_cell" && sameCoord(effect.coord, coord));
  return !blocked && Boolean(getMapCell(coord)) && !terrain.blocksMovement && !terrain.blocksOccupation;
}
`;

const checks = `
function radiusCells(radius) {
  const cells = [];
  for (let x = -radius; x <= radius; x += 1) {
    for (let y = -radius; y <= radius; y += 1) {
      const z = -x - y;
      if (z < -radius || z > radius) continue;
      const terrainType = (Math.abs(x * 7 + y * 3) % 11 === 0) ? "difficult" : "free";
      cells.push({ coord:[x,y,z], terrainType, cellRole:"normal", ps:false, control:null });
    }
  }
  return cells;
}

function legacyTakeReachable(definition, startCoord, budget, options = {}) {
  const cells = new Map(definition.geometry.cells.map(cell => [mapRuntimeCellKey(cell.coord), cell]));
  const startKey = mapRuntimeCellKey(startCoord);
  const occupied = options.occupiedKeys instanceof Set ? options.occupiedKeys : new Set();
  const distances = new Map([[startKey, 0]]);
  const queue = [{ coord:[...startCoord], cost:0 }];
  while (queue.length) {
    queue.sort((a,b) => a.cost - b.cost);
    const current = queue.shift();
    const currentKey = mapRuntimeCellKey(current.coord);
    if (current.cost !== distances.get(currentKey)) continue;
    for (const next of mapRuntimeNeighbors(current.coord)) {
      const nextKey = mapRuntimeCellKey(next);
      const cell = cells.get(nextKey);
      const terrain = cell ? terrainDefinition(cell.terrainType || "free") : null;
      if (!cell || !terrain || terrain.blocksMovement || terrain.blocksOccupation || occupied.has(nextKey)) continue;
      const nextCost = current.cost + terrain.movementCost;
      if (nextCost > budget || nextCost >= (distances.get(nextKey) ?? Infinity)) continue;
      distances.set(nextKey, nextCost);
      queue.push({ coord:next, cost:nextCost });
    }
  }
  return [...distances.entries()]
    .filter(([key]) => key !== startKey)
    .map(([key,cost]) => ({ coord:key.split(",").map(Number), cost }));
}

const cells = radiusCells(12);
const definition = {
  id:"f9o7h2-perf-fixture",
  movementMultiplier:3,
  geometry:{ cells },
  playerSlots:[],
  strategicPoints:[]
};
assert.strictEqual(cells.length, 469, "fixture matches the reported large-map cell count");

const occupied = new Set(["1,0,-1", "0,1,-1", "-1,1,0"]);
for (const budget of [1,3,6,9]) {
  const expected = legacyTakeReachable(definition, [0,0,0], budget, { occupiedKeys:occupied });
  const actual = mapReachableCells(definition, [0,0,0], budget, { occupiedKeys:occupied });
  assert.deepStrictEqual(actual, expected, "optimized reachability preserves legacy order and costs");
}

const buildsAfterWarmup = MAP_RUNTIME_PERF.cellIndexBuilds;
for (let index = 0; index < 100; index += 1) {
  mapReachableCells(definition, [0,0,0], 9, { occupiedKeys:occupied });
  getMapCell([12,-12,0], definition);
}
assert.strictEqual(MAP_RUNTIME_PERF.cellIndexBuilds, buildsAfterWarmup, "geometry index is reused across AI queries");
assert.strictEqual(MAP_RUNTIME_PERF.reachableQueries, 104, "reachability telemetry counts all queries");

const moving = { uid:"moving", type:"Fanteria", side:1, alive:true, currentHp:2, pos:[0,0,0] };
const blocker = { uid:"blocker", type:"Fanteria", side:2, alive:true, currentHp:2, pos:[0,-1,1] };
state = {
  mapDefinition:definition,
  cells,
  units:[moving, blocker],
  cellEffects:[{ kind:"temporary_block_cell", coord:[-1,0,1] }]
};
const reachable = movableCells(moving);
assert.strictEqual(getUnitAtCalls, 0, "occupancy no longer performs a unit lookup for every cell");
assert.ok(!reachable.some(coord => sameCoord(coord, blocker.pos)), "unit occupancy remains blocked");
assert.ok(!reachable.some(coord => sameCoord(coord, [-1,0,1])), "temporary blocked cells remain blocked");

const aiSource = ${JSON.stringify(read("src/ai.js"))};
const renderSource = ${JSON.stringify(read("src/render.js"))};
const eventSource = ${JSON.stringify(read("src/events.js"))};
const buildSource = ${JSON.stringify(read("src/build_info.js"))};
assert.ok(buildSource.includes('version: "C2-STABLE-1-F9R3-APK-M4c"'), "F9R3 retains the performance hotfix on the current metadata");
assert.ok(aiSource.includes("const movementCache = new Map()"), "advanced AI memoizes movement once per candidate decision");
assert.ok(aiSource.includes("skipInitialRender"), "bot handoff skips duplicate initial rendering");
assert.ok(renderSource.includes("visibleLimit = 300"), "visible log DOM is bounded");
assert.ok(eventSource.includes("state.events.unshift(normalized)"), "complete exported event ordering is unchanged");

console.log("F9O7h2 performance hotfix smoke: deterministic reachability, cached geometry, O(units) occupancy and bounded log OK");
`;

const source = [
  prefix,
  read("src/hex.js"),
  read("data/terrain_registry.js"),
  read("src/map_runtime.js"),
  read("src/movement.js"),
  checks
].join("\n");

new Function("assert", "console", source)(assert, console);
