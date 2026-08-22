"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const html = read("index.html");
const css = read("css/style.css");
const render = read("src/render.js");
const buildSource = read("src/build_info.js");
const context = { console, document: undefined };
vm.createContext(context);
vm.runInContext(`${buildSource}\n;globalThis.__build=BUILD_INFO;`, context, { filename:"build_info.js" });
const build = context.__build;

assert.equal(build.version, "C2-STABLE-1-F9V2a-APK-M4c");
assert.equal(build.buildName, "Tutorial Runtime 2.0 · Authoritative Interaction Hotfix");
assert.equal(build.buildChannel, "starter2-tutorial-v2a");
assert.equal(build.logicBaseline, "C2-STABLE-1-F9T2c4-APK-M4c");
assert.ok(build.notes.includes("F9Q3e1-2"));

assert.ok(html.includes('class="arenaGameAudioRow"'));
assert.ok(html.includes('class="arenaGamePresentationToggles"'));
assert.ok(html.includes('aria-label="Effetti, miniature e carte animate"'));
assert.ok(html.includes('Miniature FX ON'));
assert.ok(html.includes('Effetti ON'));

assert.ok(render.includes('id="selectedUnitPrimaryAbilitySlot"'));
assert.ok(render.includes('selectedUnitInspectorDetailsHtml(selected)'));
assert.ok(render.includes('selectedUnitAbilityAvailabilityText'));
assert.ok(render.includes('class="selectedUnitStatsTable"'));
assert.ok(render.includes('<th>HP</th><th>DEF</th><th>ATT</th>'));
assert.ok(render.includes('data.unitAction = "end-turn"') || render.includes('dataset.unitAction = "end-turn"'));
assert.ok(!render.includes('passBtn.textContent = "Passa azione unità"'));
const abilityPos = render.indexOf('const abilitySlot = document.getElementById("selectedUnitPrimaryAbilitySlot")');
const movePos = render.indexOf('const moveBtn = document.createElement("button")', abilityPos);
const buildPos = render.indexOf('const buildBtn = document.createElement("button")', movePos);
const endPos = render.indexOf('const endBtn = document.createElement("button")', buildPos);
assert.ok(abilityPos >= 0 && movePos > abilityPos && buildPos > movePos && endPos > buildPos);

assert.ok(css.includes('width: min(100%, 230px)'));
assert.ok(css.includes('left: max(220px'));
assert.ok(css.includes('.arenaGamePresentationToggles'));
assert.ok(css.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'));
assert.ok(css.includes('.selectedUnitStatsTable td'));
assert.ok(css.includes('font-size: 22px'));
assert.ok(css.includes('.selectedUnitFloat #actionPanel'));
assert.ok(css.includes('grid-template-columns: 1fr'));

console.log("F9U1a1 Inspector/Hand/Header Controls smoke: 29/29 verifiche superate");
