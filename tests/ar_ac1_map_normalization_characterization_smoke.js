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
const raw = {
  schemaVersion:0,
  id:"  BAD Map ID!!  ",
  name:"  Demo\\u0000   map  ",
  description:" line one\\n line two ",
  official:true,
  editable:false,
  enabled:false,
  playerCount:9,
  movementMultiplier:-2,
  turnOrder:["1",2,5,"bad",3,3],
  geometry:{
    type:"unknown",
    nominalRadius:99,
    components:Array.from({length:9}, (_, index) => ({ id:"Hex " + index, radius:index, origin:[String(index),0,-index], rotation:String(index * 60) })),
    cells:[
      { coord:["0","0","0"], componentId:" main ", componentIds:[" main ",""], terrain:"Difficult Terrain", cellRole:"wrong", ownerPlayerId:"2", initialHazard:{ type:"trap", sourceType:" map ", sourceId:" cell trap ", ownerPlayerId:"", duration:3, payload:{ damage:1 } } },
      { coord:[1,-1,0], terrainType:"free", cellRole:"normal" },
      { coord:[2,-2,0], terrainType:"free", cellRole:"strategic_point" }
    ]
  },
  playerSlots:[
    { slotId:"1", headquarters:[0,0,0], deployment:{ mode:"hq_network", radius:2 } },
    { slotId:"bad", headquarters:[1,-1,0] },
    {},
    { slotId:4, headquarters:[2,-2,0], deployment:null },
    { slotId:5, headquarters:[3,-3,0] }
  ],
  strategicPoints:[
    { id:"Center PS", coord:[2,-2,0], incomeValue:99, tags:["central","  tag  ","", ...Array(15).fill("overflow")] },
    null
  ],
  initialHazards:[
    { id:"external trap", type:"trap", coord:[1,-1,0], sourceType:" map ", payload:{ damage:2 } },
    { id:"cell trap", type:"trap", coord:[0,0,0], payload:{ damage:9 } },
    { id:"bad mine", type:"fire", coord:[2,-2,0] }
  ],
  presentation:{
    skinKey:" Snow Skin ",
    backgroundKey:"  winter   field ",
    backgroundAssetId:" Asset ID! ",
    backgroundAssetPath:" assets/maps/demo.png ",
    backgroundName:" Demo Background ",
    backgroundMime:"IMAGE/PNG",
    backgroundWidth:20000,
    backgroundHeight:-2,
    backgroundFit:"invalid",
    backgroundOpacity:2,
    backgroundScale:0.1,
    backgroundOffsetX:-200,
    backgroundOffsetY:200,
    backgroundInlineDataUrl:"data:image/png;base64,YXJlbmE="
  },
  metadata:{
    author:"  Test   Author ",
    revision:0,
    tags:[" one ","", ...Array(24).fill("tag")],
    symmetry:" rotation-2 ",
    source:" import ",
    createdAt:" 2026-09-03 ",
    updatedAt:" 2026-09-03T12:00:00Z ",
    sourceMapId:" Source Map! "
  }
};
const before = JSON.stringify(raw);
const nullSlotError = (() => {
  const candidate = mapRuntimeClone(raw);
  candidate.playerSlots = [null];
  try {
    mapRuntimeNormalizeDefinition(candidate);
    return null;
  } catch (error) {
    return { name:error.name, message:error.message };
  }
})();
const corpus = {
  defaults:mapRuntimeNormalizeDefinition(null),
  regular:mapRuntimeNormalizeDefinition(raw, { fallbackId:"fallback-map" }),
  imported:mapRuntimeNormalizeDefinition(raw, { imported:true, fallbackId:"fallback-map" }),
  builtinIds:getBuiltinMapDefinitions({ includeDisabled:true }).map(map => mapRuntimeNormalizeDefinition(map).id),
  helperSamples:{
    safeText:mapRuntimeSafeText("  a\\u0000  b\\n c  ", 20),
    safeId:mapRuntimeSafeId(" Demo ID!? ", "fallback"),
    clampLow:mapRuntimeClampNumber(-3, 7, 0, 10),
    clampFallback:mapRuntimeClampNumber("bad", 7, 0, 10),
    imageRejected:mapRuntimeSafeImageDataUrl("data:text/plain;base64,YQ=="),
    imageAccepted:mapRuntimeSafeImageDataUrl("data:image/webp;base64,YQ==")
  },
  nullSlotError,
  storage:{ reads:__storeReads, writes:__storeWrites }
};
if (JSON.stringify(raw) !== before) throw new Error("normalization mutated its input");
return corpus;
`;

const source = prefix + files.map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + checks;
const corpus = new Function(source)();
const hash = crypto.createHash("sha256").update(JSON.stringify(corpus)).digest("hex");
const expectedHash = "a530bbb485703d6385b830d5bd3b6ae6f2b5ec563eb1d12ac1c0fcaaedd5766d";

assert.strictEqual(hash, expectedHash, `map normalization characterization changed: ${hash}`);
assert.strictEqual(corpus.regular.geometry.components.length, 8);
assert.strictEqual(corpus.regular.playerSlots.length, 4);
assert.strictEqual(corpus.regular.official, true);
assert.strictEqual(corpus.imported.official, false);
assert.strictEqual(corpus.imported.editable, true);
assert.strictEqual(corpus.nullSlotError.name, "TypeError");
assert.deepStrictEqual(corpus.storage, { reads:0, writes:0 });

console.log(`AR-AC1 map normalization characterization: PASS (${hash})`);
