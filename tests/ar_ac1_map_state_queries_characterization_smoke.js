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
const storageStub = `
function arenaStorageReadJson(_key, fallback) { return JSON.parse(JSON.stringify(fallback)); }
function arenaStorageWriteJson() { return true; }
`;
const fixtureSource = `
function queryFixture() {
  const cells = [
    { coord:[0,0,0], terrainType:"difficult", cellRole:"strategic_point" },
    { coord:[1,-1,0], terrainType:"defensive", cellRole:"normal" },
    { coord:[0,1,-1], terrainType:"obstacle", cellRole:"normal" },
    { coord:[-1,1,0], terrainType:"exposed", cellRole:"normal" }
  ];
  return {
    id:"query_fixture",
    playerCount:4,
    movementMultiplier:4,
    geometry:{ cells },
    playerSlots:[
      { slotId:1, headquarters:[1,-1,0], deployment:{ mode:"hq_network", radius:1 } },
      { slotId:2, headquarters:[-1,1,0], deployment:{ mode:"fixed", cells:[[0,0,0]] } },
      { slotId:4, headquarters:[0,1,-1], deployment:null }
    ],
    centralStrategicPointId:"ps-explicit",
    strategicPoints:[
      { id:"ps-explicit", coord:[0,0,0], tags:["central"], incomeValue:2 },
      { id:"ps-edge", coord:[1,-1,0], tags:["edge"], incomeValue:1 }
    ]
  };
}
`;

const mainChecks = `
const fallbackBeforeState = {
  definitionId:getActiveMapDefinition().id,
  cells:getActiveMapCells().length,
  center:getMapCell([0,0,0]).coord
};
state = {
  mapDefinition:queryFixture(),
  cells:queryFixture().geometry.cells,
  players:[
    { id:1, eliminated:false },
    { id:"2", eliminated:false },
    { id:3.5, eliminated:false },
    { id:"bad", eliminated:false },
    { id:4, eliminated:true }
  ],
  turnOrder:["4", "2", "1"]
};

const hq = getMapHeadquarters(1);
hq[0] = 99;
const points = getMapStrategicPoints();
const deployment = getMapDeploymentDefinition(2);
const center = getCentralStrategicPoint();
const noCenter = { strategicPoints:[], playerSlots:[], geometry:{ cells:[] } };

const activeInitially = getActivePlayers();
const nextInitially = {
  fromOne:getNextActivePlayerId(1),
  fromTwo:getNextActivePlayerId(2),
  unknown:getNextActivePlayerId(99)
};
state.players.find(player => Number(player.id) === 1).eliminated = true;
state.players.find(player => Number(player.id) === 2).eliminated = true;
const nextAllEliminated = getNextActivePlayerId(4);
state.players.find(player => Number(player.id) === 1).eliminated = false;
state.players.find(player => Number(player.id) === 2).eliminated = false;

return {
  fallbackBeforeState,
  activeDefinitionIdentity:getActiveMapDefinition() === state.mapDefinition,
  activeCellsIdentity:getActiveMapCells() === state.cells,
  cellLookup:{
    default:getMapCell([1,-1,0]),
    explicit:getMapCell([-1,1,0], state.mapDefinition),
    missing:getMapCell([9,-9,0])
  },
  headquarters:{ copy:hq, original:getMapHeadquarters(1), missing:getMapHeadquarters(3) },
  strategicPoints:{ value:points, arrayShared:points === state.mapDefinition.strategicPoints, coordShared:points[0].coord === state.mapDefinition.strategicPoints[0].coord, tagsShared:points[0].tags === state.mapDefinition.strategicPoints[0].tags },
  central:{ value:center, coordShared:center.coord === state.mapDefinition.strategicPoints[0].coord, fallback:getCentralStrategicPointCoord(noCenter), explicitCoord:getCentralStrategicPointCoord(), coordMatch:isCentralStrategicPointCoord([0,0,0]), coordMiss:isCentralStrategicPointCoord([1,-1,0]), distances:centralStrategicPointLinearDistances() },
  deployment:{ value:deployment, shared:deployment === state.mapDefinition.playerSlots[1].deployment, missing:getMapDeploymentDefinition(4) },
  validity:{ valid:isMapCoordValid([0,0,0]), invalid:isMapCoordValid([9,-9,0]) },
  terrain:{
    difficult:getMapTerrainAt([0,0,0]).id,
    missing:getMapTerrainAt([9,-9,0]).id,
    usage:mapTerrainUsage(),
    multiplier:getMapMovementMultiplier(),
    costs:[getTerrainMovementCost([0,0,0]), getTerrainMovementCost([1,-1,0]), String(getTerrainMovementCost([0,1,-1]))],
    defense:[getTerrainDefenseModifier({ pos:[1,-1,0] }), getTerrainDefenseModifier({ pos:[-1,1,0] }), getTerrainDefenseModifier(null)],
    effective:[getEffectiveDefense({ currentDef:2, pos:[1,-1,0] }), getEffectiveDefense({ currentDef:0, pos:[-1,1,0] }), getEffectiveDefense({ currentDef:"bad", pos:[0,0,0] })]
  },
  players:{
    ids:mapRuntimePlayerIds(),
    explicitIds:mapRuntimePlayerIds({ mapDefinition:{ playerCount:3 } }),
    found:getPlayerById("2"),
    missing:getPlayerById(7),
    activeInitially,
    enemies:getEnemyPlayers(1),
    eliminated:[isPlayerEliminated(4), isPlayerEliminated(3)],
    enemySides:[isEnemySide(1,1), isEnemySide(1,2), isEnemySide(1,4)],
    enemyUnits:enemyCombatUnits(1),
    nextInitially,
    nextAllEliminated,
    headquarters:getPlayerHeadquarters(2)
  }
};
`;

const hookChecks = `
state = {
  mapDefinition:queryFixture(),
  cells:queryFixture().geometry.cells,
  players:[{id:1,eliminated:false},{id:2,eliminated:false},{id:4,eliminated:true}],
  turnOrder:[1,2,4]
};
return {
  active:getActivePlayers(),
  enemies:getEnemyPlayers(1),
  enemyUnits:enemyCombatUnits(1),
  headquarters:getPlayerHeadquarters(2),
  eliminated:isPlayerEliminated(4)
};
`;

const fallbackChecks = `
const noCenter = { strategicPoints:[], playerSlots:[], geometry:{ cells:[] } };
return {
  definitionId:getActiveMapDefinition().id,
  playerIds:mapRuntimePlayerIds(),
  active:getActivePlayers(),
  player:getPlayerById(1),
  enemies:getEnemyPlayers(1),
  next:getNextActivePlayerId(1),
  headquarters:getPlayerHeadquarters(1),
  center:getCentralStrategicPointCoord(noCenter)
};
`;

const mainCorpus = new Function(storageStub + "let state; const CENTER_PS_COORD=[9,-9,0];\n" + runtimeSource + fixtureSource + mainChecks)();
const hookCorpus = new Function(storageStub + `
let state;
function isPlayerActive(playerId) { return Number(playerId) === 4; }
function combatUnits() { return [{uid:"one",side:1},{uid:"four",side:4},{uid:"two",side:"2"}]; }
function getHq(playerId) { return { uid:\`hq-\${playerId}\`, side:Number(playerId) }; }
` + runtimeSource + fixtureSource + hookChecks)();
const fallbackCorpus = new Function(storageStub + runtimeSource + fallbackChecks)();
const corpus = { mainCorpus, hookCorpus, fallbackCorpus };
const hash = crypto.createHash("sha256").update(JSON.stringify(corpus)).digest("hex");
const expectedHash = "b4a63f5aad2ba5b118d7648012ea83c845e4ff29247825a8b25011e71fab2f5c";

assert.strictEqual(hash, expectedHash, `map state queries characterization changed: ${hash}`);
assert.deepStrictEqual(mainCorpus.players.activeInitially, [1,2]);
assert.deepStrictEqual(hookCorpus.active, [4]);
assert.strictEqual(mainCorpus.strategicPoints.tagsShared, true);
assert.strictEqual(mainCorpus.strategicPoints.coordShared, false);
assert.strictEqual(fallbackCorpus.definitionId, "map1_starter");

console.log(`AR-AC1 map state queries characterization: PASS (${hash})`);
