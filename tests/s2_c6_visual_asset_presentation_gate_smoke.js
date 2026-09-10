"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data", "required_assets.json"), "utf8"));
const ui = fs.readFileSync(path.join(root, "src", "ui.js"), "utf8");
const audio = fs.readFileSync(path.join(root, "src", "audio_manager.js"), "utf8");
const sfx = fs.readFileSync(path.join(root, "src", "sfx_manager.js"), "utf8");

assert.strictEqual(manifest.inventoryVersion, "S2-C6-VISUAL-ASSET-INVENTORY-1");
assert.strictEqual(Object.values(manifest.summary).reduce((sum, group) => sum + group.files, 0), 472);
assert.strictEqual(manifest.required.length, 69);
assert.strictEqual(manifest.unused.length, 1);
assert.strictEqual(manifest.unused[0].path, "assets/cards/art/nexus/units/-0");

const themes = ["nexus_basalt", "exordium_imperium", "liberti_sine_vinculis", "agathoi_kleos", "fabeot_vesper"];
const slots = ["material.webp", "corner_tl.webp", "corner_tr.webp", "corner_bl.webp", "corner_br.webp", "edge_top.webp", "edge_right.webp", "edge_bottom.webp", "edge_left.webp"];
const requiredPaths = new Set(manifest.required.map(item => item.path));
for (const theme of themes) for (const slot of slots) {
  const assetPath = `assets/ui/faction_skins/${theme}/${slot}`;
  assert(requiredPaths.has(assetPath), `missing required skin slot: ${assetPath}`);
  assert(ui.includes(assetPath), `skin slot not referenced: ${assetPath}`);
}
for (const theme of themes) for (const optional of ["crest.webp", "divider.webp"]) {
  assert(!requiredPaths.has(`assets/ui/faction_skins/${theme}/${optional}`), `${optional} must remain optional`);
}

for (const faction of ["nexus", "exordium", "liberti", "agathoi", "fabeot"]) {
  for (const slot of ["unit_frame", "tactic_frame", "back"]) assert(requiredPaths.has(`assets/cards/frames/${faction}_${slot}.png`));
}
assert(requiredPaths.has("assets/cards/placeholders/missing_art_unit.png"));
assert(requiredPaths.has("assets/cards/placeholders/missing_art_tactic.png"));

for (const presentTrack of [
  "theme-nexus-machina-concordia.mp3", "theme-exordium-aureum-imperium.mp3", "theme-liberti-sine-vinculis.mp3",
  "theme-agathoi-kleos-aionion.mp3", "theme-fabeot-vesper-tenebrarum.mp3", "theme-victory-rubra-triumphans.mp3", "theme-defeat-rubra-losers.mp3"
]) assert(audio.includes(presentTrack) && fs.existsSync(path.join(root, "assets/audio", presentTrack)));
assert(sfx.includes("arenaSfxOscillatorVoiceF9O5a"), "synthetic SFX fallback missing");

for (const [tool, args] of [
  ["tools/generate_visual_asset_inventory.js", ["--check"]],
  ["tools/check_required_assets.js", []],
  ["tools/check_asset_references.js", []]
]) {
  const result = spawnSync(process.execPath, [path.join(root, tool), ...args], { cwd:root, encoding:"utf8" });
  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
}

console.log("S2-C6 visual asset and presentation static gate: 133/133 OK");
