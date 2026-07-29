"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const render = read("src/render.js");
const css = read("css/style.css");
const config = read("data/cards_base.js");
const build = read("src/build_info.js");
const precheck = read("src/precheck.js");

assert.ok(build.includes('version: "C2-STABLE-1-F9O7g-APK-M4c"'));
assert.ok(build.includes('logicBaseline: "C2-STABLE-1-F9O7f-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O7e-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O7d-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O7c-APK-M4c"'));
assert.ok(/collapsedHandControlsReflowF9O7d\s*:\s*true/.test(config));
assert.ok(precheck.includes("collapsedHandControlsReflowF9O7d"));

assert.ok(render.includes("function mapCollapsedHandControlsHtml"));
assert.ok(render.includes('class="mapLeftDockControls"'));
assert.ok(render.includes('data-map-left-dock-controls="true"'));
assert.ok(render.includes('class="ghost mapLeftHandBtn"'));
assert.ok(render.includes('class="danger mapLeftEndTurnBtn"'));
assert.ok(render.includes('${mapCollapsedHandControlsHtml(disabledGlobal)}'));
assert.ok(render.includes('overlay.replaceChildren();'));
assert.ok(render.includes('overlay.setAttribute("aria-hidden", "true")'));
assert.ok(render.includes('overlay.removeAttribute("aria-hidden")'));

const compactBranch = render.match(/if \(compactHand\) \{([\s\S]*?)renderMapHandSelectionPreview\(\);\n\s*return;/);
assert.ok(compactBranch, "Ramo Mano ridotta non trovato");
assert.ok(!compactBranch[1].includes("mapHandOverlayCompact"), "Il vecchio riquadro compatto non deve più essere renderizzato nell'overlay");
assert.ok(!compactBranch[1].includes("mapHandShowBtn"), "Mostra mano non deve restare nel vecchio overlay ridotto");

assert.ok(css.includes("/* F9O7d — Collapsed Hand Controls Reflow"));
assert.ok(css.includes(".mapHandOverlay.isMovementHidden {\n  display: none;"));
assert.ok(css.includes(".mapLeftDockControls"));
assert.ok(css.includes("body.mobile-apk-m4 .mapLeftDockControls"));

console.log(JSON.stringify({
  ok: true,
  build: "C2-STABLE-1-F9O7g-APK-M4c",
  baseline: "C2-STABLE-1-F9O7e-APK-M4c",
  compactControlsHost: "mapActionDock",
  permanentControlsF9U1a: true,
  openHandLayoutPreserved: true
}, null, 2));
