"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { assertCurrentBuildInfo } = require("./helpers/build_info_contract");

const root = path.resolve(__dirname, "..");
const ui = fs.readFileSync(path.join(root, "src", "ui.js"), "utf8");
const build = fs.readFileSync(path.join(root, "src", "build_info.js"), "utf8");

const buildInfo = assertCurrentBuildInfo(build);

const ornamentStart = ui.indexOf('style.textContent += `\n    html[data-arena-ui-theme] [data-arena-skin-slot="shell"]');
const ornamentEnd = ui.indexOf('document.head.appendChild(style);', ornamentStart);
assert(ornamentStart >= 0 && ornamentEnd > ornamentStart, "F9W2d ornament block missing");
const ornamentBlock = ui.slice(ornamentStart, ornamentEnd);

assert(!/data-arena-skin-slot="shell"[\s\S]{0,900}overflow\s*:\s*hidden/.test(ornamentBlock),
  "skin decoration must not override native menu/panel scrolling with overflow:hidden");
assert(ornamentBlock.includes("border-radius:inherit"),
  "ornament pseudo-elements must clip themselves instead of clipping scroll containers");

assert(ui.includes('materialOverlay:"linear-gradient(180deg, rgba(10,18,12,.28), rgba(24,40,25,.38))"'),
  "Agathoi toned overlay missing");
assert(ui.includes("scrollPolicyPreserved:true"), "scroll policy marker missing");
assert(ui.includes("agathoiMaterialToned:true"), "Agathoi tone marker missing");

console.log(JSON.stringify({
  ok:true,
  feature:"F9W2d1 scroll invariant + Agathoi tone chain",
  nativeOverflowPreserved:true,
  ornamentSelfClip:true,
  agathoiOverlayToned:true,
  build:buildInfo.version
}, null, 2));
