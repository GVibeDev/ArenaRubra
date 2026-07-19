"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const render = read("src/render.js");
const css = read("css/style.css");
const build = read("src/build_info.js");
const precheck = read("src/precheck.js");
const config = read("data/cards_base.js");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };

ok(build.includes("C2-STABLE-1-F9O2e-APK-M4c") || build.includes("C2-STABLE-1-F9O2d-APK-M4c"), "metadata F9O2d");
ok(build.includes("mission-accessibility-build-flow") || build.includes("token-layering-active-unit-cues"), "canale F9O2d");
ok(build.includes('logicBaseline: "C2-STABLE-1-F9O2d-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O2c-APK-M4c"'), "baseline F9O2c");
ok(precheck.includes("F9O2d: livelli token separati"), "precheck F9O2d");
ok(config.includes("tokenLayeringF9O2d: true"), "flag token layering");
ok(config.includes("tokenFactionBaseOpacityIndependentF9O2d: true"), "flag opacità indipendente");
ok(config.includes("activeUnitHaloArrowF9O2d: true"), "flag cue unità attiva");
ok(config.includes("reducedMotionTokenCuesF9O2d: true"), "flag movimento ridotto");

ok(render.includes('class="tokenFactionBase"'), "layer base fazione nel renderer");
ok(render.includes('class="tokenSelectionHalo"'), "alone selezione nel renderer");
ok(render.includes('class="tokenActiveArrow"'), "freccia attiva nel renderer");
ok(render.includes("displayedSelectedId && unit.uid === displayedSelectedId"), "cue legate alla selezione visualizzata");

ok(css.includes("--token-faction-base-art-opacity: .22"), "opacità base dedicata");
ok(css.includes("--token-art-acted-opacity: .50"), "opacità asset acted dedicata");
ok(css.includes('.unitToken.acted {\n  opacity: 1 !important;'), "acted non attenua shell completa");
ok(css.includes('html[data-token-graphics-mode="on"] .unitToken.token-art-loaded .tokenFactionBase'), "base trasparente con asset ON");
ok(css.includes('html[data-token-graphics-mode="on"] .unitToken.token-art-loaded.acted .tokenFactionBase'), "base invariata dopo azione");
ok(css.includes('html[data-token-graphics-mode="on"] .unitToken.token-art-loaded.acted .tokenArt'), "asset attenuato dopo azione");
ok(css.includes("@keyframes tokenActiveHaloPulse"), "animazione alone");
ok(css.includes("@keyframes tokenActiveArrowBob"), "animazione freccia");
ok(css.includes("@media (prefers-reduced-motion: reduce)"), "fallback movimento ridotto");
ok(css.includes("pointer-events: none;\n  user-select: none;\n  touch-action: none;"), "cue non intercettano mouse/touch");

for (const faction of ["nexus", "exordium", "liberti", "agathoi", "fabeot"]) {
  ok(css.includes(`.unitToken.faction-${faction} { --token-active-rgb:`), `colore cue ${faction}`);
  ok(css.includes(`.unitToken.faction-${faction} .tokenFactionBase`), `base fazione ${faction}`);
}

console.log(`F9O2d token layering & active cues smoke: ${checks}/${checks}`);
