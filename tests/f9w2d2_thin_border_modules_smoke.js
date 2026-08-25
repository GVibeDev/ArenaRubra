"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const ui = fs.readFileSync(path.join(root, "src", "ui.js"), "utf8");
const build = fs.readFileSync(path.join(root, "src", "build_info.js"), "utf8");

for (const token of [
  'const ARENA_UI_FRAME_SCHEMA_F9W2D2 = "F9W2d2-1"',
  'cornerSize:"48px"',
  'edgeHorizontalThickness:"16px"',
  'edgeVerticalThickness:"14px"',
  '--arena-ui-corner-size',
  '--arena-ui-edge-horizontal-thickness',
  '--arena-ui-edge-vertical-thickness',
  'eightSliceFrameOnly:true',
  'crestRemoved:true',
  'dividerRemoved:true',
  'moduleScaleTokens:true'
]) assert(ui.includes(token), `missing F9W2d2 token: ${token}`);

for (const forbidden of [
  '--arena-ui-crest-image',
  '--arena-ui-divider-image',
  'var(--arena-ui-crest-image)',
  'var(--arena-ui-divider-image)',
  'dividerImage:',
  'crestImage:'
]) assert(!ui.includes(forbidden), `obsolete ornament contract still active: ${forbidden}`);

for (const token of [
  'version: "C2-STABLE-1-F9W2d3-APK-M4c"',
  'buildName: "Agathoi Palette Readability Hotfix"',
  'buildChannel: "starter2-ui-agathoi-palette-w2d3"',
  'logicBaseline: "C2-STABLE-1-F9T2c4-APK-M4c"'
]) assert(build.includes(token), `missing current build metadata: ${token}`);

// The ornament layer must use exactly the 4 corners + 4 sides.
const layerStart = ui.indexOf('background-image:\n        var(--arena-ui-corner-tl)');
const layerEnd = ui.indexOf('mix-blend-mode:normal;', layerStart);
assert(layerStart >= 0 && layerEnd > layerStart, 'eight-slice ornament layer missing');
const layer = ui.slice(layerStart, layerEnd);
for (const token of [
  '--arena-ui-corner-tl','--arena-ui-corner-tr','--arena-ui-corner-bl','--arena-ui-corner-br',
  '--arena-ui-edge-top','--arena-ui-edge-right','--arena-ui-edge-bottom','--arena-ui-edge-left'
]) assert(layer.includes(token), `missing frame module: ${token}`);
assert(layer.includes('var(--arena-ui-corner-size)'), 'corner scale token not used');
assert(layer.includes('var(--arena-ui-edge-horizontal-thickness)'), 'horizontal side scale token not used');
assert(layer.includes('var(--arena-ui-edge-vertical-thickness)'), 'vertical side scale token not used');

// F9W2d1 scroll hotfix must remain intact.
const ornamentCssStart = ui.indexOf('style.textContent += `\n    html[data-arena-ui-theme] [data-arena-skin-slot="shell"]');
const ornamentCssEnd = ui.indexOf('document.head.appendChild(style);', ornamentCssStart);
const ornamentCss = ui.slice(ornamentCssStart, ornamentCssEnd);
assert(!/data-arena-skin-slot="shell"[\s\S]{0,900}overflow\s*:\s*hidden/.test(ornamentCss),
  'F9W2d1 scroll regression: overflow:hidden returned');

console.log(JSON.stringify({
  ok:true,
  feature:'Eight-slice thin border modules invariant',
  frameModules:8,
  corners:4,
  sides:4,
  crest:false,
  divider:false,
  cornerSize:'48px',
  horizontalSideThickness:'16px',
  verticalSideThickness:'14px',
  scrollPolicyPreserved:true,
  build:'C2-STABLE-1-F9W2d3-APK-M4c'
}, null, 2));
