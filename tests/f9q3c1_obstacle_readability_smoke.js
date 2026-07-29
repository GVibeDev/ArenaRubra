"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };

const css = read("css/style.css");
const build = read("src/build_info.js");
const html = read("index.html");

ok(build.includes('version: "C2-STABLE-1-F9R3-APK-M4c"'), "metadata corrente aggiornata a F9R3");
ok(build.includes('logicBaseline: "C2-STABLE-1-F9O7h3-APK-M4c"'), "baseline logica punta alla F9O7h3 validata");
ok(html.includes("F9R3 · Official Map & Pressure Lab"), "fallback visivo Editor mappe aggiornato");
ok(css.includes("F9Q3c1 – Obstacle Readability Hotfix"), "blocco hotfix presente alla fine del cascade");
ok(css.includes("--terrain-obstacle-fill: rgba(4, 5, 7, .88)"), "fill ostacolo nero/charcoal ad alpha alta");
ok(css.includes("#board .hex.terrain-obstacle:not(.tacticalTarget):not(.selected)"), "stile runtime specifico per ostacoli");
ok(css.includes("background-color: var(--terrain-obstacle-fill) !important"), "fill runtime prevale sul binding generico opacità celle");
ok(css.includes("inset 0 0 0 2px rgba(0, 0, 0, .96)"), "bordo interno segue la sagoma esagonale");
ok(css.includes(".mapEditorHex.terrain-obstacle polygon") && css.includes("fill: #07090c !important"), "Editor usa riempimento near-black sul poligono esagonale");
ok(css.includes("#mapEditorCanvas.hasCustomBackground .mapEditorHex.terrain-obstacle polygon") && css.includes("fill-opacity: .96 !important"), "ostacolo resta evidente sopra sfondo custom");
ok(css.includes('.cellTerrainMarker[data-terrain="obstacle"]'), "badge × F9Q3b conservato");

console.log(`F9Q3c1 obstacle readability smoke: ${checks}/${checks} OK`);
