"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const assetRoot = path.join(root, "assets");
const manifestPath = path.join(root, "data", "required_assets.json");

const frozenRequired = new Set([
  "assets/intro/g-vibe-dev-logo.png",
  "assets/intro/arena-rubra-title.png",
  "assets/maps/backgrounds/f9r3_narrow_path_desertcenter.webp",
  "assets/maps/backgrounds/map-bg-custom_double_ms3ppdyc-plains_webp-ms3qzmsc.webp",
  "assets/maps/backgrounds/map-bg-custom_triple_ms3r4ifn-ruins_webp-ms3rwq9c.webp",
  "assets/maps/backgrounds/map-bg-custom_triple_ms3s2abv-trap_webp-ms3skg6o.webp",
  "assets/maps/backgrounds/snow_bf_4pl_3x.webp",
  "assets/cards/placeholders/missing_art_tactic.png",
  "assets/cards/placeholders/missing_art_unit.png"
]);
const supplementalArchivePaths = new Set([
  // Preserved ZIP-only source, explicitly outside the repository inventory.
  "assets/maps/backgrounds/battlefield.webp"
]);

const skinIds = ["nexus_basalt", "exordium_imperium", "liberti_sine_vinculis", "agathoi_kleos", "fabeot_vesper"];
const skinRequiredSlots = ["material.webp", "corner_tl.webp", "corner_tr.webp", "corner_bl.webp", "corner_br.webp", "edge_top.webp", "edge_right.webp", "edge_bottom.webp", "edge_left.webp"];
for (const skin of skinIds) for (const slot of skinRequiredSlots) frozenRequired.add(`assets/ui/faction_skins/${skin}/${slot}`);
for (const faction of ["nexus", "exordium", "liberti", "agathoi", "fabeot"]) {
  for (const slot of ["unit_frame", "tactic_frame", "back"]) frozenRequired.add(`assets/cards/frames/${faction}_${slot}.png`);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes:true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function relative(absolute) {
  return path.relative(root, absolute).split(path.sep).join("/");
}

function owner(assetPath) {
  if (assetPath.startsWith("assets/intro/")) return "boot";
  if (assetPath.startsWith("assets/maps/")) return "map-presentation";
  if (assetPath.startsWith("assets/cards/")) return "card-presentation";
  if (assetPath.startsWith("assets/tokens/")) return "token-presentation";
  if (assetPath.startsWith("assets/narrative/")) return "tutorial-narrative";
  if (assetPath.startsWith("assets/audio/")) return "audio-feedback";
  if (assetPath.startsWith("assets/ui/")) return "ui-skin";
  return "asset-documentation";
}

function classification(assetPath) {
  if (frozenRequired.has(assetPath)) return "required";
  const lower = assetPath.toLowerCase();
  const base = path.posix.basename(lower);
  if (base === "-0") return "unused";
  if (base === ".keep" || base === ".gitkeep" || lower.endsWith(".jpg~") || lower.endsWith(".zip")) return "legacy";
  if (lower.endsWith(".md") || lower.endsWith(".txt")) return "devOnly";
  return "optional";
}

function reason(group, assetPath) {
  if (group === "required") {
    if (assetPath.includes("/faction_skins/")) return "five-skin modular geometry slot";
    if (assetPath.includes("/cards/frames/")) return "official card frame/back";
    if (assetPath.includes("/cards/placeholders/")) return "verified missing-art fallback";
    if (assetPath.includes("/maps/backgrounds/")) return "frozen Starter map background";
    return "release boot asset";
  }
  if (group === "optional") return "runtime enhancement with procedural, CSS, text, or silent fallback";
  if (group === "devOnly") return "asset documentation or authoring manifest; excluded from Distribution staging";
  if (group === "legacy") return "repository placeholder, backup, or source archive; excluded from Distribution staging";
  return "unreferenced malformed artifact; excluded from Distribution staging";
}

function record(absolute) {
  const assetPath = relative(absolute);
  const body = fs.readFileSync(absolute);
  const group = classification(assetPath);
  return {
    path:assetPath,
    bytes:body.length,
    sha256:crypto.createHash("sha256").update(body).digest("hex"),
    owner:owner(assetPath),
    reason:reason(group, assetPath)
  };
}

function generate() {
  const records = walk(assetRoot)
    .filter(absolute => !supplementalArchivePaths.has(relative(absolute)))
    .map(record)
    .sort((a, b) => a.path.localeCompare(b.path));
  const groups = { required:[], optional:[], devOnly:[], legacy:[], unused:[] };
  for (const item of records) groups[classification(item.path)].push(item);
  const manifest = {
    schemaVersion:"AR-AC1-REQUIRED-ASSETS-1",
    inventoryVersion:"S2-C6-VISUAL-ASSET-INVENTORY-1",
    releaseTarget:"Arena Rubra Starter 1.0 — Desktop / Web",
    policy:{
      required:"No fallback is accepted for release identity, frozen map backgrounds, five-skin modular geometry, official card frames, or missing-art placeholders.",
      optional:"Runtime enhancement with a verified lower-fidelity fallback.",
      devOnly:"Authoring/documentation material omitted from Distribution.",
      legacy:"Repository compatibility material omitted from Distribution.",
      unused:"Malformed or unreferenced material omitted from Distribution."
    },
    summary:Object.fromEntries(Object.entries(groups).map(([key, value]) => [key, { files:value.length, bytes:value.reduce((sum, item) => sum + item.bytes, 0) }])),
    ...groups
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

const output = generate();
if (process.argv.includes("--check")) {
  const current = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, "utf8") : "";
  if (current !== output) {
    console.error("S2-C6 visual asset inventory is stale; run node tools/generate_visual_asset_inventory.js");
    process.exitCode = 1;
  } else {
    const parsed = JSON.parse(output);
    console.log(`S2-C6 visual asset inventory PASS (${Object.values(parsed.summary).reduce((sum, group) => sum + group.files, 0)} classified assets; ${parsed.required.length} required)`);
  }
} else {
  fs.writeFileSync(manifestPath, output);
  const parsed = JSON.parse(output);
  console.log(`Wrote data/required_assets.json (${Object.values(parsed.summary).reduce((sum, group) => sum + group.files, 0)} classified assets; ${parsed.required.length} required)`);
}

module.exports = { classification, generate };
