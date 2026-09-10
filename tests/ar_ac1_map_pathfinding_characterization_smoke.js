"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = [
  "src/hex.js",
  "data/terrain_registry.js",
  "data/official_maps_f9r3.js",
  "data/map_definitions.js",
  "src/map_normalization.js",
  "src/map_pathfinding.js",
  "src/map_validation.js",
  "src/map_persistence.js",
  "src/map_state_queries.js",
  "src/map_runtime.js"
];
const prefix = `
function arenaStorageReadJson(_key, fallback) { return JSON.parse(JSON.stringify(fallback)); }
function arenaStorageWriteJson() { return true; }
`;
const checks = `
function radiusCells(radius) {
  const cells = [];
  for (let x = -radius; x <= radius; x += 1) {
    for (let y = -radius; y <= radius; y += 1) {
      const z = -x - y;
      if (z < -radius || z > radius) continue;
      cells.push({ coord:[x,y,z], terrainType:"free", cellRole:"normal" });
    }
  }
  return cells;
}

const fixture = {
  id:"path-fixture",
  movementMultiplier:1,
  geometry:{ cells:radiusCells(2) },
  playerSlots:[],
  strategicPoints:[],
  metadata:{ symmetry:"rotation-2" }
};
const byKey = new Map(fixture.geometry.cells.map(cell => [mapRuntimeCellKey(cell.coord), cell]));
byKey.get("1,-1,0").terrainType = "difficult";
byKey.get("0,1,-1").terrainType = "obstacle";
byKey.get("-1,0,1").terrainType = "obstacle";

const occupied = new Set(["1,0,-1"]);
const corpus = {
  neighbors:mapRuntimeNeighbors([0,0,0]),
  distances:[
    mapRuntimeHexDistance([0,0,0],[2,-1,-1]),
    mapRuntimeHexDistance([0,0,0],[1,1,1]),
    mapRuntimeHexDistance(null,[0,0,0])
  ],
  paths:{
    tie:findMapPath(fixture,[0,0,0],[2,-1,-1]),
    occupied:findMapPath(fixture,[0,0,0],[2,-1,-1],{ occupiedKeys:occupied }),
    occupiedTarget:findMapPath(fixture,[0,0,0],[1,0,-1],{ occupiedKeys:occupied }),
    same:findMapPath(fixture,[0,0,0],[0,0,0]),
    invalid:findMapPath(fixture,[0,0,0],[1,1,1]),
    outside:findMapPath(fixture,[0,0,0],[9,-9,0])
  },
  reachable:{
    zero:mapReachableCells(fixture,[0,0,0],0),
    one:mapReachableCells(fixture,[0,0,0],1),
    three:mapReachableCells(fixture,[0,0,0],3),
    occupied:mapReachableCells(fixture,[0,0,0],3,{ occupiedKeys:occupied }),
    outside:mapReachableCells(fixture,[9,-9,0],3)
  },
  reachableKeys:[...mapRuntimeReachableKeys(fixture,[0,0,0])],
  chokes:mapRuntimeSingleCellChokes(fixture),
  symmetryIssues:mapRuntimeObstacleSymmetryIssues(fixture),
  indexIdentity:(() => {
    const first = mapRuntimeCellIndex(fixture.geometry.cells);
    const second = mapRuntimeCellIndex(fixture.geometry.cells);
    return first === second;
  })(),
  lookup:getMapCell([1,-1,0], fixture),
  perf:null
};
corpus.perf = { ...MAP_RUNTIME_PERF };
if (occupied.size !== 1 || !occupied.has("1,0,-1")) throw new Error("pathfinding mutated occupiedKeys");
return corpus;
`;

const source = prefix + files.map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + checks;
const corpus = new Function(source)();
const hash = crypto.createHash("sha256").update(JSON.stringify(corpus)).digest("hex");
const expectedHash = "a50e8ecd652690c5b9f3cd1bcdae092c117f09eaef0ab83809c0e20a66fccd52";

assert.strictEqual(hash, expectedHash, `map pathfinding characterization changed: ${hash}`);
assert.strictEqual(corpus.indexIdentity, true);
assert.strictEqual(corpus.paths.occupiedTarget.cost, 1);
assert.strictEqual(corpus.paths.invalid, null);
assert.strictEqual(corpus.paths.outside, null);
assert.deepStrictEqual(corpus.reachable.zero, []);

console.log(`AR-AC1 map pathfinding characterization: PASS (${hash})`);
