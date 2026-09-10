"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { assertCurrentBuildInfo } = require("./helpers/build_info_contract");
const root = path.resolve(__dirname, "..");
const ui = fs.readFileSync(path.join(root, "src", "ui.js"), "utf8");
const build = fs.readFileSync(path.join(root, "src", "build_info.js"), "utf8");

for (const token of [
  'const ARENA_PRODUCT_PROFILE_SCHEMA_F9W2A = "F9W2a-1"',
  'DISTRIBUTION:"distribution"',
  'cardEditor:Object.freeze(["dev"])',
  'mapEditor:Object.freeze(["dev"])',
  'rawTelemetry:Object.freeze(["dev"])',
  'calibration:Object.freeze(["dev"])',
  'expertAi:Object.freeze(["dev"])',
  'fullVaultTransfer:Object.freeze(["dev"])',
  '"[data-app-open-card-editor]"',
  '"[data-app-open-map-editor]"',
  '"#mainMenuTelemetryBtn"',
  '"#mainMenuLogBtn"',
  '"#gameDebugHeaderBtn"',
  '"#cardPoolDebugDetails"',
  'data-control-center-action="open-renderer-lab"',
  'arenaProductProfilePatchCalibrationStorageF9W2a',
  'arenaProductProfileInstallMutationObserverF9W2a',
  'arenaProductProfileSetElementVisibleF9W2a',
  'arenaProductProfileSetTextF9W2a'
]) assert(ui.includes(token), `missing F9W2a contract token: ${token}`);

assertCurrentBuildInfo(build);

console.log("F9W2a profile static smoke: PASS");
