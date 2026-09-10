"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const core = fs.readFileSync(path.join(root, "src", "data", "match_data.js"), "utf8");
const ui = fs.readFileSync(path.join(root, "src", "ui.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

for (const token of [
  'const MATCH_RECORD_SCHEMA_VERSION_F9W1A = "AR-MATCH-2"',
  'const MATCH_TELEMETRY_STORE_SCHEMA_VERSION_F9W1A = "AR-TELEMETRY-2"',
  'const MATCH_TELEMETRY_STORAGE_KEY_F9W1A = "arenaRubra.matchTelemetry.v2"',
  'const MATCH_HISTORY_STORAGE_KEY_F9W1A = "arenaRubra.matchHistory.v1"',
  "function matchDataBuildCanonicalRecordF9W1a()",
  "function matchDataNormalizeLegacyRecordF9W1a(input)",
  "function arenaMatchDataMigrateLegacyHistoryF9W1a()",
  "globalThis.recordMatchResult = function recordMatchResultF9W1a()",
  "globalThis.arenaStorageReadMatchHistory = function arenaStorageReadMatchHistoryF9W1a()",
  "globalThis.arenaStorageExportMatchHistoryJson = function arenaStorageExportMatchHistoryJsonF9W1a()"
]) assert(core.includes(token), `missing Match Data core contract: ${token}`);

for (const forbidden of ["document.", "innerHTML", "querySelector", "addEventListener", "classList"]) {
  assert(!core.includes(forbidden), `Match Data core must be DOM-free: ${forbidden}`);
}
for (const moved of [
  "function matchDataBuildCanonicalRecordF9W1a()",
  "function matchDataNormalizeLegacyRecordF9W1a(input)",
  "function arenaMatchDataMigrateLegacyHistoryF9W1a()",
  "globalThis.recordMatchResult = function recordMatchResultF9W1a()",
  "globalThis.arenaStorageReadMatchHistory = function arenaStorageReadMatchHistoryF9W1a()",
  "globalThis.arenaStorageExportMatchHistoryJson = function arenaStorageExportMatchHistoryJsonF9W1a()"
]) assert(!ui.includes(moved), `Match Data core still owned by ui.js: ${moved}`);

assert(ui.includes("// F9W1a — Match Data 2.0 UI projections"));
assert(ui.includes("globalThis.controlCenterHistoryHtml"));
assert(ui.includes("globalThis.controlCenterStatisticsHtml"));
assert(ui.includes("globalThis.renderMatchupStats"));

const telemetryIndex = index.indexOf('<script src="src/match_telemetry.js"></script>');
const matchDataIndex = index.indexOf('<script src="src/data/match_data.js"></script>');
const controlCenterIndex = index.indexOf('<script src="src/control_center.js"></script>');
const uiIndex = index.indexOf('<script src="src/ui.js"></script>');
assert(telemetryIndex >= 0 && telemetryIndex < matchDataIndex, "Match Data must load after its telemetry dependency");
assert(matchDataIndex < controlCenterIndex && controlCenterIndex < uiIndex, "data core must load before its UI consumers");

console.log(JSON.stringify({
  status: "PASS",
  module: "src/data/match_data.js",
  domFree: true,
  schemas: ["AR-MATCH-2", "AR-TELEMETRY-2"],
  loader: "match_telemetry -> match_data -> control_center -> ui"
}, null, 2));
