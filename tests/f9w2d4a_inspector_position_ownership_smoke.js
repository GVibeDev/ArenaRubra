"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const ui = fs.readFileSync(path.join(root, "src", "ui.js"), "utf8");
const build = fs.readFileSync(path.join(root, "src", "build_info.js"), "utf8");

const oldConflict = `    html[data-arena-ui-theme] body.app-screen-game .gameDebugMenu,
    html[data-arena-ui-theme] body.app-screen-game .selectedUnitFloat,
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap){
      position:relative;
      isolation:isolate;
    }`;

const correctedHostRule = `    html[data-arena-ui-theme] body.app-screen-game .gameDebugMenu,
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap){
      position:relative;
      isolation:isolate;
    }`;

assert(!ui.includes(oldConflict), "theme layer still forces selectedUnitFloat to position:relative");
assert(ui.includes(correctedHostRule), "corrected theme host rule missing");

// The inspector must still participate in visual theming.
assert(ui.includes('html[data-arena-ui-theme] body.app-screen-game .selectedUnitFloat > *'), "inspector child z-index theming missing");
assert(ui.includes('html[data-arena-ui-theme] body.app-screen-game .selectedUnitFloat::after'), "inspector ornament pseudo-element theming missing");
assert(ui.includes('html[data-arena-ui-theme] body.app-screen-game .selectedUnitFloat,'), "inspector visual surface theming missing");

assert(ui.includes("inspectorPositionOwnedByLayout:true"), "snapshot ownership marker missing");

for (const token of [
  'version: "C2-STABLE-1-F9W2d4a-APK-M4c"',
  'buildName: "Inspector Position Ownership Hotfix"',
  'buildChannel: "starter2-ui-inspector-position-w2d4a"',
  'logicBaseline: "C2-STABLE-1-F9T2c4-APK-M4c"'
]) {
  assert(build.includes(token), `missing build token: ${token}`);
}

console.log(JSON.stringify({
  ok: true,
  feature: "F9W2d4a Inspector Position Ownership Hotfix",
  themeNoLongerOwnsInspectorPosition: true,
  visualThemeStillApplied: true,
  layoutOwnershipMarker: true,
  build: "C2-STABLE-1-F9W2d4a-APK-M4c"
}, null, 2));
