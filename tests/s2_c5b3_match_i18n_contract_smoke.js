"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const index = read("index.html");
const gameScreen = read("src/game_screen.js");
const render = read("src/render.js");
const tutorialRuntime = read("src/tutorial_runtime.js");
const app = read("src/app.js");
const en = JSON.parse(read("locales/en.json"));

assert(index.includes('data-i18n="game.endTurn"'));
assert(index.includes('data-i18n-aria-label="game.boardLabel"'));
assert(index.includes('data-i18n-aria-label="game.selectedUnitLabel"'));
assert(gameScreen.includes('function gameScreenI18n(key, fallback, params = {})'));
assert(gameScreen.includes('gameScreenI18n("game.deployTarget"'));
assert(gameScreen.includes('gameScreenContentName("units"'));
assert(render.includes('function renderI18n(key, fallback, params = {})'));
assert(render.includes('renderContentText("units"'));
assert(render.includes('renderI18n("game.abilityReady"'));
assert(tutorialRuntime.includes('tutorialRuntimeI18n("result.matchEnded"'));
assert(tutorialRuntime.includes('tutorialRuntimeI18n("result.victory"'));
assert(tutorialRuntime.includes('tutorialRuntimeI18n(`result.reasons.${key}`'));
assert(app.includes('currentAppScreen() === ARENA_APP_SCREENS.GAME'));
assert.strictEqual(en.game.endTurn, "End turn");
assert.strictEqual(en.game.noSelectedUnit, "No unit selected");
assert.strictEqual(en.result.reasons.pressure_victory, "Strategic Pressure victory");

const gate = spawnSync(process.execPath, [path.join(root, "tools/check_locales.js")], { cwd:root, encoding:"utf8" });
assert.strictEqual(gate.status, 0, gate.stderr || gate.stdout);
assert(gate.stdout.includes("runtime bindings"));

console.log("S2-C5b3 match UI i18n contract smoke: 18/18 OK");
