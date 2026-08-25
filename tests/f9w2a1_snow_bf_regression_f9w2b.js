"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const crypto = require("crypto");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const ui = fs.readFileSync(path.join(root, "src", "ui.js"), "utf8");
const build = fs.readFileSync(path.join(root, "src", "build_info.js"), "utf8");
const marker = "const F9W2A1_SNOW_BF_OFFICIAL_MAP = Object.freeze(";
const start = ui.indexOf(marker);
assert(start >= 0, "Snow BF official map constant missing");
const jsonStart = start + marker.length;
const end = ui.indexOf(");\n\nfunction arenaOfficialSnowMapCloneF9W2a1", jsonStart);
assert(end > jsonStart, "Snow BF official map constant terminator missing");
const map = JSON.parse(ui.slice(jsonStart, end));

assert.strictEqual(map.id, "map10_snow_bf_4pl_3x");
assert.strictEqual(map.name, "Snow BF - 4PL - 3x");
assert.strictEqual(map.official, true);
assert.strictEqual(map.editable, false);
assert.strictEqual(map.enabled, true);
assert.strictEqual(map.playerCount, 4);
assert.strictEqual(map.movementMultiplier, 3);
assert.deepStrictEqual(map.turnOrder, [1,2,3,4]);
assert.strictEqual(map.geometry.type, "triple_hex");
assert.strictEqual(map.geometry.cells.length, 349);
assert.strictEqual(map.playerSlots.length, 4);
assert.strictEqual(map.strategicPoints.length, 13);
assert.strictEqual(map.centralStrategicPointId, "ps-center");
assert.strictEqual(map.initialHazards.length, 4);
assert(map.metadata.tags.includes("standard"));
assert(map.metadata.tags.includes("classic"));
assert(map.metadata.tags.includes("official"));
assert.strictEqual(map.metadata.sourceMapId, "custom_triple_mt6bju0j");
assert.strictEqual(map.presentation.backgroundAssetPath, "assets/maps/backgrounds/snow_bf_4pl_3x.webp");
assert.strictEqual(map.presentation.backgroundMime, "image/webp");
assert.strictEqual(map.presentation.backgroundWidth, 906);
assert.strictEqual(map.presentation.backgroundHeight, 1061);

const coordKey = coord => coord.join(",");
const cells = new Map(map.geometry.cells.map(cell => [coordKey(cell.coord), cell]));
assert.strictEqual(cells.size, map.geometry.cells.length, "duplicate cell coordinates");
for (const cell of map.geometry.cells) {
  assert.strictEqual(cell.coord.reduce((sum, value) => sum + value, 0), 0, `invalid cube coord ${coordKey(cell.coord)}`);
}
for (const slot of map.playerSlots) {
  const cell = cells.get(coordKey(slot.headquarters));
  assert(cell, `HQ G${slot.slotId} outside map`);
  assert.strictEqual(cell.cellRole, "headquarters");
  assert.strictEqual(Number(cell.ownerPlayerId), Number(slot.slotId));
}
for (const ps of map.strategicPoints) {
  const cell = cells.get(coordKey(ps.coord));
  assert(cell, `PS ${ps.id} outside map`);
  assert.strictEqual(cell.cellRole, "strategic_point");
  assert.notStrictEqual(cell.terrainType, "obstacle");
}
for (const hazard of map.initialHazards) {
  const cell = cells.get(coordKey(hazard.coord));
  assert(cell, `hazard ${hazard.id} outside map`);
  assert.strictEqual(cell.cellRole, "normal");
  assert.notStrictEqual(cell.terrainType, "obstacle");
}

const central = map.strategicPoints.find(ps => ps.id === map.centralStrategicPointId);
assert(central, "central PS missing");
const hexDistance = (a,b) => Math.max(...a.map((value,index) => Math.abs(value-b[index])));
const centralDistances = map.playerSlots.map(slot => hexDistance(central.coord, slot.headquarters));
assert.deepStrictEqual(centralDistances, [15,15,15,15], "central PS must be equidistant");

const gameplayProjection = Object.fromEntries([
  "schemaVersion","playerCount","movementMultiplier","turnOrder","geometry","playerSlots",
  "strategicPoints","centralStrategicPointId","initialHazards"
].map(key => [key, map[key]]));
const stableStringify = value => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
};
const gameplayHash = crypto.createHash("sha256").update(stableStringify(gameplayProjection)).digest("hex");
assert.strictEqual(gameplayHash, "119055f3cc7cfcbd7b36a0fd5ce0f856b4369e8164f71ca4b162432a0da90a8f", "gameplay payload changed from supplied JSON");


// Execute the isolated registration block against the public map-runtime entrypoints.
const blockEnd = ui.indexOf("// F9W2a1 END", start);
assert(blockEnd > start, "F9W2a1 registration block end missing");
const blockCode = ui.slice(start, blockEnd);
const context = {
  console,
  mapRuntimeClone:value => JSON.parse(JSON.stringify(value)),
  mapRuntimeSafeId:value => String(value || ""),
  getBuiltinMapDefinitions:() => [{id:"map1_starter", official:true}],
  getMapDefinitionById:id => id === "map1_starter" ? {id:"map1_starter", official:true} : null
};
context.globalThis = context;
vm.runInNewContext(blockCode, context, {filename:"f9w2a1-registration.js"});
const registered = context.getBuiltinMapDefinitions();
assert.strictEqual(registered.filter(item => item.id === map.id).length, 1, "Snow BF must register exactly once");
assert.strictEqual(context.getMapDefinitionById(map.id).official, true);
assert.strictEqual(context.getMapDefinitionById("map1_starter").id, "map1_starter");
assert.strictEqual(context.getBuiltinMapDefinitions().filter(item => item.id === map.id).length, 1, "registration must be idempotent");

const background = path.join(root, map.presentation.backgroundAssetPath);
let backgroundHash = "patch-only-skip";
if (fs.existsSync(background)) {
  backgroundHash = crypto.createHash("sha256").update(fs.readFileSync(background)).digest("hex");
  assert.strictEqual(backgroundHash, "6cb3ea1fa2f67c7b509a6e57dca0d787fcf5deac3c7e8059796d605be779e8dd");
} else {
  assert.strictEqual(map.presentation.backgroundAssetPath, "assets/maps/backgrounds/snow_bf_4pl_3x.webp");
}

for (const token of [
  "function arenaInstallOfficialSnowMapF9W2a1()",
  "root.getBuiltinMapDefinitions = wrappedBuiltin",
  "root.getMapDefinitionById = wrappedGetById",
  "arenaInstallOfficialSnowMapF9W2a1();",
  'version: "C2-STABLE-1-F9W2d3-APK-M4c"',
  'buildChannel: "starter2-ui-agathoi-palette-w2d3"'
]) assert(ui.includes(token) || build.includes(token), `missing F9W2a1 contract token: ${token}`);

console.log(JSON.stringify({
  status:"PASS",
  id:map.id,
  cells:map.geometry.cells.length,
  players:map.playerCount,
  strategicPoints:map.strategicPoints.length,
  hazards:map.initialHazards.length,
  movementMultiplier:map.movementMultiplier,
  centralDistances,
  gameplayHash,
  backgroundHash
}, null, 2));
