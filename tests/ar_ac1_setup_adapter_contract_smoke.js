"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const adapterSource = fs.readFileSync(path.join(root, "src", "setup_adapter.js"), "utf8");
const stateSource = fs.readFileSync(path.join(root, "src", "state.js"), "utf8");
const gameSource = fs.readFileSync(path.join(root, "src", "game.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");

const context = {
  console,
  Object,
  Array,
  Number,
  Boolean,
  Math,
  Set,
  Map,
  Date,
  setTimeout,
  document: new Proxy({}, { get() { throw new Error("pure setup/initiative contract accessed document"); } })
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(adapterSource, context, { filename: "src/setup_adapter.js" });
vm.runInContext(gameSource, context, { filename: "src/game.js" });

context.__rawSetup = {
  mapId: "map-four",
  factions: { 1: "Fabeot", 4: "Nexus" },
  selectedCommanders: { 1: "FB0B00" },
  selectedDecks: {
    1: { mode: "custom", savedKey: "Fabeot::FB0B00::test" },
    2: { mode: "invalid", savedKey: null }
  },
  modes: { 1: "bot", 2: "human" },
  autoResignEnabled: false,
  aiMode: "expert",
  pacePreset: "competitive",
  gameScaleMode: "tactical"
};
context.__dependencies = { getMapDefinitionById(id) { return { id, playerCount: 4 }; } };
const normalized = JSON.parse(JSON.stringify(vm.runInContext("ArenaSetupAdapter.normalize(__rawSetup, __dependencies)", context)));
assert.deepStrictEqual(normalized, {
  mapId: "map-four",
  mapDefinition: { id: "map-four", playerCount: 4 },
  playerCount: 4,
  playerIds: [1, 2, 3, 4],
  factions: { 1: "Fabeot", 2: "Exordium", 3: "Liberti", 4: "Nexus" },
  selectedCommanders: { 1: "FB0B00", 2: null, 3: null, 4: null },
  selectedDecks: {
    1: { mode: "custom", savedKey: "Fabeot::FB0B00::test" },
    2: { mode: "template", savedKey: "" },
    3: { mode: "template", savedKey: "" },
    4: { mode: "template", savedKey: "" }
  },
  modes: { 1: "bot", 2: "human", 3: "bot", 4: "bot" },
  autoResignEnabled: false,
  aiMode: "expert",
  pacePreset: "competitive",
  gameScaleMode: "tactical"
});

let calls = 0;
context.__rng = { next() { calls += 1; return 0.51; } };
assert.strictEqual(vm.runInContext("chooseFirstPlayer([1,2,3,4], __rng, '4')", context), 4);
assert.strictEqual(calls, 0);
assert.strictEqual(vm.runInContext("chooseFirstPlayer([1,2,3,4], __rng, 'random')", context), 3);
assert.strictEqual(calls, 1);

const adapterIndex = indexSource.indexOf('<script src="src/setup_adapter.js"></script>');
const stateIndex = indexSource.indexOf('<script src="src/state.js"></script>');
assert(adapterIndex >= 0 && adapterIndex < stateIndex, "SetupAdapter must load immediately before state ownership uses it");
assert.strictEqual((adapterSource.match(/^const ArenaSetupAdapter\b/gm) || []).length, 1, "one adapter namespace");
assert.strictEqual((adapterSource.match(/^function\s+/gm) || []).length, 0, "adapter internals must not publish replacement globals");
assert(!adapterSource.includes("localStorage"));
assert(!adapterSource.includes("state."));
assert(!adapterSource.includes("telemetry"));
assert(!adapterSource.includes("document."));
assert.match(stateSource, /return ArenaSetupAdapter\.readFromDom\(document,/);
assert(!stateSource.includes("function readDeckSetupForSide"));
assert(!stateSource.includes("function readPlayerSetupValue"));
assert.match(gameSource, /chooseFirstPlayer\(setup\.playerIds, matchRng, initiativeMode\)/);
assert.match(gameSource, /function chooseFirstPlayer\(playerIds = null, rngController = null, initiativeMode = null\)/);

console.log(JSON.stringify({
  status: "PASS",
  api: ["normalize", "readFromDom", "readInitiativeMode"],
  domFree: ["normalize", "chooseFirstPlayer"],
  publishedNamespaces: 1,
  scriptOrder: "setup_adapter -> state"
}, null, 2));
