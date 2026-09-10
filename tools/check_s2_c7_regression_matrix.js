"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const matrix = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "s2_c7_regression_matrix.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "starter_1_0_manifest.json"), "utf8"));
const browserSource = fs.readFileSync(path.join(ROOT, "tests", "s2_c7_browser_release_matrix_smoke.js"), "utf8");
const failures = [];

if (matrix.schemaVersion !== "S2-C7-MATRIX-1") failures.push("schema version");
if (matrix.policy.blockersAllowed !== 0 || matrix.policy.reproducibleSoftlocksAllowed !== 0) failures.push("blocker policy");
if (matrix.policy.desktopWrapper !== "not-planned") failures.push("desktop wrapper disposition");
if (matrix.policy.androidRequirement !== false) failures.push("Android wrongly required");
const ids = new Set();
for (const item of matrix.coverage || []) {
  if (!item.id || ids.has(item.id)) failures.push(`duplicate/empty coverage id: ${item.id}`);
  ids.add(item.id);
  if (!['covered', 'not-planned'].includes(item.status)) failures.push(`${item.id}: invalid status`);
  if (!Array.isArray(item.evidence) || !item.evidence.length) failures.push(`${item.id}: no evidence`);
  for (const evidence of item.evidence || []) if (!fs.existsSync(path.join(ROOT, evidence))) failures.push(`${item.id}: missing ${evidence}`);
}
for (const required of [
  "config-2p-human-human", "config-2p-human-bot", "config-2p-bot-bot", "config-3p-mixed", "config-4p-mixed",
  "all-frozen-official-maps", "victory-hq-and-elimination", "victory-pressure-and-round-limit", "ene-economy-and-ps",
  "combat-actions", "deck-and-recovery", "missions", "tactics", "commander-selection-and-lifecycle", "tutorial",
  "challenge-suite", "result-modal", "history-and-telemetry", "italian-english", "themes-and-layout",
  "player-dev-separation", "storage-migration-import-old", "asset-required-and-fallback", "long-match-and-populated-board",
  "screen-change-new-game-memory", "stale-callback-guard", "startup-bot-render-performance", "distribution-packaging",
  "artifact-manifest-and-checksum", "desktop-wrapper"
]) if (!ids.has(required)) failures.push(`missing coverage: ${required}`);

for (const map of manifest.catalogs.officialMaps) {
  if (!browserSource.includes("manifest.catalogs.officialMaps")) failures.push(`browser matrix is not manifest-driven: ${map.id}`);
}
for (const scenario of ["2P-HH", "2P-HB", "2P-BB", "3P-MIX", "4P-MIX"]) {
  if (!browserSource.includes(`id:\"${scenario}\"`)) failures.push(`browser scenario missing: ${scenario}`);
}

if (failures.length) {
  console.error(`FAIL: S2-C7 regression matrix (${failures.length} issues)`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`PASS: S2-C7 regression matrix (${matrix.coverage.length} coverage rows, ${manifest.catalogs.officialMaps.length} manifest-driven maps)`);
