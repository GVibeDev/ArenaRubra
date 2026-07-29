"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const equal = (actual, expected, message) => { assert.strictEqual(actual, expected, message); checks += 1; };

const prefix = `
let __store = { schemaVersion:1, maps:{} };
function arenaStorageReadJson(_key, fallback) { return JSON.parse(JSON.stringify(__store || fallback)); }
function arenaStorageWriteJson(_key, value) { __store = JSON.parse(JSON.stringify(value)); return true; }
function arenaDataSafePart(value, fallback="item") { return String(value || fallback).toLowerCase().replace(/[^a-z0-9._-]+/g,"-"); }
function arenaDataDataUrlToBlob(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!match) return null;
  return new Blob([Buffer.from(match[3], "base64")], { type:match[1] || "application/octet-stream" });
}
async function arenaDataBlobToDataUrl(blob) {
  return "data:" + (blob.type || "application/octet-stream") + ";base64," + Buffer.from(await blob.arrayBuffer()).toString("base64");
}
const __blobs = new Map();
const ArenaDataStore = {
  backendName:"opfs",
  async ready(){ return true; },
  async writeBlob(path, blob){ __blobs.set(path, blob); return true; },
  async readBlob(path){ return __blobs.get(path) || null; },
  async removeBlob(path){ return __blobs.delete(path); }
};
`;

const source = prefix
  + read("data/terrain_registry.js") + "\n"
  + read("data/map_definitions.js") + "\n"
  + read("src/map_runtime.js") + "\n"
  + read("src/map_backgrounds.js") + `
(async () => {
  const draft = duplicateMapDefinition("map1_starter", "custom_background_smoke").definition;
  const imageBlob = new Blob([Buffer.from("arena-rubra-background")], { type:"image/png" });
  Object.defineProperty(imageBlob, "name", { value:"arena-field.png" });
  const importedAsset = await mapBackgroundFileToPresentation(imageBlob, draft.id, draft.presentation);
  assert.strictEqual(importedAsset.ok, true);
  assert.strictEqual(importedAsset.storageMode, "blob");
  assert.ok(importedAsset.presentation.backgroundAssetPath.startsWith("maps/backgrounds/"));
  assert.ok(__blobs.has(importedAsset.presentation.backgroundAssetPath));
  draft.presentation = { ...draft.presentation, ...importedAsset.presentation, backgroundFit:"contain", backgroundOpacity:0.72, backgroundScale:1.25, backgroundOffsetX:8, backgroundOffsetY:-6 };

  const normalized = mapRuntimeNormalizeDefinition(draft, { imported:true });
  assert.strictEqual(normalized.presentation.backgroundFit, "contain");
  assert.strictEqual(normalized.presentation.backgroundOpacity, 0.72);
  assert.strictEqual(normalized.presentation.backgroundScale, 1.25);
  assert.strictEqual(normalized.presentation.backgroundOffsetX, 8);
  assert.strictEqual(normalized.presentation.backgroundOffsetY, -6);

  const light = exportMapDefinitionJson(normalized);
  assert.strictEqual(light.ok, true);
  const lightParsed = JSON.parse(light.json);
  assert.strictEqual(lightParsed.assetMode, "reference-only");
  assert.ok(lightParsed.map.presentation.backgroundAssetPath);
  assert.strictEqual(lightParsed.map.presentation.backgroundInlineDataUrl, undefined);

  const portable = await exportMapDefinitionPortableJson(normalized);
  assert.strictEqual(portable.ok, true);
  assert.strictEqual(portable.hasEmbeddedBackground, true);
  const packageJson = JSON.parse(portable.json);
  assert.strictEqual(packageJson.kind, "arena-rubra-map-package");
  assert.ok(packageJson.assets.background.dataUrl.startsWith("data:image/png;base64,"));

  __store = { schemaVersion:1, maps:{} };
  const importedPackage = await importMapDefinitionPortableJson(portable.json, { save:false });
  assert.strictEqual(importedPackage.ok, true);
  assert.ok(importedPackage.definition.presentation.backgroundAssetPath.startsWith("maps/backgrounds/"));
  assert.ok(__blobs.has(importedPackage.definition.presentation.backgroundAssetPath));
  assert.strictEqual(importedPackage.definition.presentation.backgroundFit, "contain");

  const removed = await mapBackgroundRemovePresentationAsset(importedPackage.definition.presentation);
  assert.strictEqual(removed.backgroundAssetPath, null);
  assert.strictEqual(removed.backgroundAssetId, null);

  this.__checks = 22;
})().catch(error => { console.error(error); process.exitCode = 1; });
`;

const runner = new Function("assert", "console", "Buffer", "Blob", "process", source);
runner(assert, console, Buffer, Blob, process);

setTimeout(() => {
  if (process.exitCode) return;
  const html = read("index.html");
  const css = read("css/style.css");
  const presentation = read("src/presentation_theme.js");
  for (const id of [
    "mapEditorBackgroundChooseBtn", "mapEditorBackgroundRemoveBtn", "mapEditorBackgroundFile",
    "mapEditorBackgroundFit", "mapEditorBackgroundOpacity", "mapEditorBackgroundScale",
    "mapEditorBackgroundOffsetX", "mapEditorBackgroundOffsetY", "mapEditorPortableExportBtn"
  ]) ok(html.includes(`id="${id}"`), `${id} presente`);
  ok(html.includes('src="src/map_backgrounds.js"'), "modulo background incluso");
  ok(css.includes(".mapEditorBackgroundImage") && css.includes(".customMapBackground"), "stili preview/runtime presenti");
  ok(presentation.includes("mapBackgroundApplyForMap(state.mapDefinition)"), "runtime applica lo sfondo della mappa attiva");
  console.log(`F9Q3c custom map backgrounds smoke: ${checks + 22}/${checks + 22} OK`);
}, 50);
