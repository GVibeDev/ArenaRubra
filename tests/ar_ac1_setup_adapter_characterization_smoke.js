"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const adapterSource = fs.readFileSync(path.join(root, "src", "setup_adapter.js"), "utf8");
const stateSource = fs.readFileSync(path.join(root, "src", "state.js"), "utf8");
const gameSource = fs.readFileSync(path.join(root, "src", "game.js"), "utf8");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function element(value, checked = undefined) {
  const result = { value };
  if (checked !== undefined) result.checked = checked;
  return result;
}

const maps = {
  map1_starter: { id: "map1_starter", name: "Campo Starter", playerCount: 2 },
  map_three: { id: "map_three", name: "Three", playerCount: 3 },
  map_four: { id: "map_four", name: "Four", playerCount: 4 },
  map10_snow_bf_4pl_3x: { id: "map10_snow_bf_4pl_3x", name: "Snow BF - 4PL - 3x", playerCount: 4 }
};
let elements = {};
const setupContext = {
  console,
  Math,
  Date,
  setTimeout,
  document: { getElementById(id) { return elements[id] || null; } },
  getMapDefinitionById(id) { return maps[id] || null; }
};
setupContext.globalThis = setupContext;
vm.createContext(setupContext);
vm.runInContext(adapterSource, setupContext, { filename: "src/setup_adapter.js" });
vm.runInContext(stateSource, setupContext, { filename: "src/state.js" });
vm.runInContext(gameSource, setupContext, { filename: "src/game.js" });

elements = {};
assert.deepStrictEqual(plain(vm.runInContext("readGameSetupFromDom()", setupContext)), {
  mapId: "map1_starter",
  mapDefinition: maps.map1_starter,
  playerCount: 2,
  playerIds: [1, 2],
  factions: { 1: "Nexus", 2: "Exordium" },
  selectedCommanders: { 1: null, 2: null },
  selectedDecks: {
    1: { mode: "template", savedKey: "" },
    2: { mode: "template", savedKey: "" }
  },
  modes: { 1: "human", 2: "bot" },
  autoResignEnabled: true,
  aiMode: "advanced",
  pacePreset: "standard",
  gameScaleMode: "large_scale"
});

elements = {
  setupMapName: element("map_three"),
  setupP1Faction: element("Agathoi"),
  p1Faction: element("Fabeot"),
  setupP1Commander: element("AGCMD02"),
  p1Commander: element("FB0B00"),
  setupP1Mode: element("bot"),
  p1Mode: element("human"),
  setupP1DeckMode: element("template"),
  p1DeckMode: element("custom"),
  setupP1DeckSavedKey: element("modern-key"),
  p1DeckSavedKey: element("legacy-key"),
  setupP2Faction: element("Liberti"),
  setupP2DeckMode: element("invalid-mode"),
  setupP2DeckSavedKey: element("setup-two"),
  autoResignToggle: element("", false),
  botAiMode: element("expert"),
  pacePreset: element("competitive"),
  gameScaleMode: element("tactical")
};
const threePlayer = plain(vm.runInContext("readGameSetupFromDom()", setupContext));
assert.deepStrictEqual(threePlayer, {
  mapId: "map_three",
  mapDefinition: maps.map_three,
  playerCount: 3,
  playerIds: [1, 2, 3],
  factions: { 1: "Agathoi", 2: "Liberti", 3: "Liberti" },
  selectedCommanders: { 1: "AGCMD02", 2: null, 3: null },
  selectedDecks: {
    1: { mode: "custom", savedKey: "legacy-key" },
    2: { mode: "template", savedKey: "setup-two" },
    3: { mode: "template", savedKey: "" }
  },
  modes: { 1: "bot", 2: "bot", 3: "bot" },
  autoResignEnabled: false,
  aiMode: "expert",
  pacePreset: "competitive",
  gameScaleMode: "tactical"
});
assert.strictEqual(Object.prototype.hasOwnProperty.call(threePlayer, "initiativeMode"), false, "initiative remains a separate current DOM read");

elements = { setupMapName: element("map10_snow_bf_4pl_3x") };
const fourPlayer = plain(vm.runInContext("readGameSetupFromDom()", setupContext));
assert.deepStrictEqual(fourPlayer.playerIds, [1, 2, 3, 4]);
assert.deepStrictEqual(fourPlayer.factions, { 1: "Nexus", 2: "Exordium", 3: "Liberti", 4: "Agathoi" });
assert.deepStrictEqual(fourPlayer.modes, { 1: "human", 2: "bot", 3: "bot", 4: "bot" });

let rngCalls = 0;
setupContext.__rng = { next() { rngCalls += 1; return 0.8; } };
elements = { initiativeMode: element("3") };
assert.strictEqual(vm.runInContext("chooseFirstPlayer([1,2,3], __rng, ArenaSetupAdapter.readInitiativeMode(document))", setupContext), 3);
assert.strictEqual(rngCalls, 0, "explicit initiative must not consume RNG");
elements = { initiativeMode: element("random") };
assert.strictEqual(vm.runInContext("chooseFirstPlayer([1,2,3], __rng, ArenaSetupAdapter.readInitiativeMode(document))", setupContext), 3);
assert.strictEqual(rngCalls, 1, "random initiative consumes exactly one seeded value");
elements = { initiativeMode: element("2") };
assert.strictEqual(vm.runInContext("chooseFirstPlayer([], __rng, ArenaSetupAdapter.readInitiativeMode(document))", setupContext), 2, "empty player list keeps the 1/2 fallback");

const stateContext = {
  console,
  Object,
  Array,
  Number,
  Boolean,
  Math,
  Set,
  Map,
  Date,
  START_ENE: 3,
  document: new Proxy({}, { get() { throw new Error("createInitialGameState accessed document"); } }),
  localStorage: { getItem() { return null; }, setItem() {} }
};
stateContext.globalThis = stateContext;
vm.createContext(stateContext);
for (const relative of [
  "data/maps.js",
  "src/hex.js",
  "data/terrain_registry.js",
  "data/map_definitions.js",
  "src/map_normalization.js",
  "src/map_pathfinding.js",
  "src/map_validation.js",
  "src/map_persistence.js",
  "src/map_state_queries.js",
  "src/map_runtime.js",
  "src/setup_adapter.js",
  "src/state.js"
]) {
  vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), stateContext, { filename: relative });
}

function stateSnapshot(mapId, firstPlayer) {
  stateContext.__mapId = mapId;
  stateContext.__firstPlayer = firstPlayer;
  return plain(vm.runInContext(`(() => {
    const mapDefinition = getMapDefinitionById(__mapId);
    const playerIds = Array.from({ length: mapDefinition.playerCount }, (_, index) => index + 1);
    const setup = {
      mapId: __mapId,
      mapDefinition,
      firstPlayer: __firstPlayer,
      factions: Object.fromEntries(playerIds.map(id => [id, ["Nexus", "Exordium", "Liberti", "Agathoi"][id - 1]])),
      selectedCommanders: {},
      selectedDecks: {},
      modes: Object.fromEntries(playerIds.map(id => [id, id === 1 ? "human" : "bot"])),
      autoResignEnabled: true,
      aiMode: "advanced",
      pacePreset: "standard",
      gameScaleMode: "large_scale",
      matchSeed: "AR-AC1-SETUP"
    };
    const result = createInitialGameState(setup);
    return {
      mapId: result.mapId,
      mapRevision: result.mapRuntime.mapRevision,
      cellCount: result.cells.length,
      playerIds: result.playerIds,
      factions: result.factions,
      modes: result.modes,
      turnOrder: result.turnOrder,
      currentPlayer: result.currentPlayer,
      energy: result.energy,
      pressure: result.pressure,
      lifecycle: result.players.map(player => [player.id, player.lifecycleStatus, player.eliminated]),
      units: result.units.length,
      cardBranches: Object.keys(result.cardDebug).sort(),
      missionBranches: Object.keys(result.missionTelemetry).sort(),
      matchRngState: result.matchRngState,
      matchRngCalls: result.matchRngCalls
    };
  })()`, stateContext));
}

const initialStates = [
  stateSnapshot("map1_starter", 2),
  stateSnapshot("map2_triumvirate", 2),
  stateSnapshot("map3_quadrivium", 3)
];
assert.deepStrictEqual(initialStates.map(item => item.playerIds), [[1, 2], [1, 2, 3], [1, 2, 3, 4]]);
assert.deepStrictEqual(initialStates.map(item => item.turnOrder), [[2, 1], [2, 3, 1], [3, 4, 1, 2]]);
for (const snapshot of initialStates) {
  assert.strictEqual(snapshot.units, 0);
  assert(snapshot.playerIds.every(id => snapshot.energy[id] === 3 && snapshot.pressure[id] === 0));
  assert(snapshot.lifecycle.every(([, status, eliminated]) => status === "active" && eliminated === false));
  assert.strictEqual(snapshot.matchRngState, 0);
  assert.strictEqual(snapshot.matchRngCalls, 0);
}

assert.match(gameSource, /let setup = \{ \.\.\.readGameSetupFromDom\(\), \.\.\.\(setupOverrides/);

console.log(JSON.stringify({
  status: "PASS",
  setupSnapshots: ["default-2P", "precedence-3P", "snow-stub-4P"],
  initiativeCases: 3,
  domFreeInitialStates: initialStates.map(item => ({ mapId: item.mapId, players: item.playerIds.length, cells: item.cellCount }))
}, null, 2));
