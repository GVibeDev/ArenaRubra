"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
let checks = 0;
const ok = (value, label) => { assert.ok(value, label); checks += 1; };
const eq = (actual, expected, label) => { assert.deepStrictEqual(actual, expected, label); checks += 1; };
const hexDistance = (a, b) => Math.max(Math.abs(a[0]-b[0]), Math.abs(a[1]-b[1]), Math.abs(a[2]-b[2]));

const ctx = {};
vm.createContext(ctx);
vm.runInContext(`${read("data/official_maps_f9s1b1.js")}\nthis.__maps = F9S1B1_OFFICIAL_MAP_DEFINITIONS;`, ctx);
const maps = JSON.parse(JSON.stringify(ctx.__maps));
const expected = {
  custom_triple_ms3r4ifn: { name:"Central hotspot", players:3, cells:439, ps:8, center:[0,-3,3], distance:13 },
  custom_double_ms3ppdyc: { name:"Plains 2G large", players:2, cells:313, ps:7, center:[0,5,-5], distance:12 },
  custom_triple_ms3s2abv: { name:"La Trappola", players:4, cells:151, ps:7, center:[0,0,0], distance:7 }
};

eq(Object.keys(maps), Object.keys(expected), "tre mappe ufficiali F9S1b1");
for (const [id, exp] of Object.entries(expected)) {
  const map = maps[id];
  ok(Boolean(map), `${id} presente`);
  eq(map.name, exp.name, `${id} nome`);
  eq(map.playerCount, exp.players, `${id} giocatori`);
  eq(map.geometry.cells.length, exp.cells, `${id} celle`);
  eq(map.strategicPoints.length, exp.ps, `${id} PS`);
  ok(map.official === true && map.enabled === true && map.editable === false, `${id} flag ufficiali`);
  const coords = map.geometry.cells.map(cell => cell.coord.join(","));
  eq(new Set(coords).size, coords.length, `${id} coordinate uniche`);
  const psIds = map.strategicPoints.map(ps => ps.id);
  eq(new Set(psIds).size, psIds.length, `${id} ID PS univoci`);
  const center = map.strategicPoints.find(ps => ps.id === map.centralStrategicPointId);
  eq(center.coord, exp.center, `${id} centro`);
  const distances = map.playerSlots.map(slot => hexDistance(center.coord, slot.headquarters));
  eq([...new Set(distances)], [exp.distance], `${id} centro equidistante`);
  ok(/^assets\/maps\/backgrounds\/.+\.webp$/.test(map.presentation.backgroundAssetPath), `${id} sfondo statico`);
  ok(fs.existsSync(path.join(ROOT, map.presentation.backgroundAssetPath)), `${id} file sfondo presente`);
}

const app = read("src/app.js");
ok(app.includes('deckBuilderSavedPayloadEntriesFor(faction, "", { allowCustom: true })'), "Setup elenca tutti i deck della fazione");
ok(app.includes("function setupApplySelectedDeckIdentity"), "sincronizzazione identità deck presente");
ok(app.includes('commanderSelect.disabled = mode === "custom"'), "comandante bloccato nel modo deck salvato");
ok(app.includes("setupApplySelectedDeckIdentity(side);"), "cambio selezione deck applica identità");

const mapDefinitions = read("data/map_definitions.js");
ok(mapDefinitions.includes("F9S1B1_OFFICIAL_MAP_DEFINITIONS"), "map pack collegato al catalogo built-in");
const index = read("index.html");
ok(index.includes('data/official_maps_f9s1b1.js'), "map pack caricato da index");
const build = read("src/build_info.js");
ok(build.includes('version: "C2-STABLE-1-F9S1b1-APK-M4c"'), "versione candidata F9S1b1");
ok(build.includes('logicBaseline: "C2-STABLE-1-F9S1b-APK-M4c"'), "baseline logica F9S1b validata");

console.log(`F9S1b1 deck selection + official maps smoke: ${checks}/${checks} OK`);
