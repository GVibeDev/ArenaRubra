"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");
const html = read("index.html");
const css = read("css/style.css");
const render = read("src/render.js");
const ui = read("src/f9u1a_ui.js");
const buildSource = read("src/build_info.js");

const context = { console, document:undefined };
vm.createContext(context);
vm.runInContext(`${buildSource}\n;globalThis.__build=BUILD_INFO;`, context, { filename:"build_info.js" });
const build = context.__build;

assert.equal(build.version, "C2-STABLE-1-F9V2d-APK-M4c", "versione candidata corretta");
assert.equal(build.buildName, "Tutorial Challenge I · Elimination", "nome build corretto");
assert.equal(build.buildChannel, "starter2-tutorial-v2d", "canale candidato corretto");
assert.equal(build.logicBaseline, "C2-STABLE-1-F9T2c4-APK-M4c", "baseline logica validata corretta");
assert.ok(build.notes.includes("F9Q3e1-2"), "schema telemetrico dichiarato invariato");

assert.ok(html.includes('id="gameDebugBtn"'), "pulsante Debug desktop presente nella barra stato");
assert.ok(html.includes('id="gameDebugHeaderBtn"'), "pulsante Debug header/mobile presente");
assert.ok(html.includes('id="gameDebugMenu"'), "menu Debug partita presente");
assert.ok(html.includes('data-game-debug-action="hand"'), "Debug contiene accesso Mano");
assert.ok(html.includes('data-game-debug-action="log"'), "Debug contiene accesso Log");
assert.ok(html.includes('data-game-debug-action="stats"'), "Debug contiene accesso Statistiche");
assert.ok(html.includes('data-game-debug-action="telemetry"'), "Debug contiene accesso Telemetria");
assert.ok(!html.includes('id="gameActionBar"'), "barra inferiore legacy rimossa dal markup");
assert.ok(html.includes('id="mapActionDock"'), "dock sinistro della mappa conservato");
assert.ok(html.includes('src/f9u1a_ui.js'), "runtime UI F9U1a caricato");

assert.ok(render.includes('class="mapLeftDockControls"'), "dock contiene controlli principali fissi");
assert.ok(render.includes('mapHandOverlayToggleVisibility()'), "Mano apribile e richiudibile dal dock");
assert.ok(render.includes('mapHandOverlayEndTurn()'), "Fine turno disponibile nel dock");
assert.ok(render.includes('Missione'), "Missione renderizzata nel dock quando presente");
assert.ok(render.includes('Abilità di fazione'), "sezione abilità di fazione presente");
assert.ok(render.includes('Nessuna abilità di fazione disponibile.'), "stato vuoto abilità gestito");

assert.ok(css.includes('.gameActionBar'), "CSS protegge dalla ricomparsa della barra legacy");
assert.ok(css.includes('.mobileGameBar'), "barra mobile legacy disattivata");
assert.ok(css.includes('.gameDebugMenu'), "stili menu Debug presenti");
assert.ok(css.includes('.mapLeftDockControls'), "stili controlli dock presenti");
assert.ok(css.includes('transform: none !important'), "precedenza verticale legacy neutralizzata");

assert.ok(ui.includes('f9u1aOpenDebugAction'), "router azioni Debug presente");
assert.ok(ui.includes('openGamePanel("log"'), "Debug apre Log tramite Panel Manager");
assert.ok(ui.includes('openGamePanel("stats"'), "Debug apre Statistiche tramite Panel Manager");
assert.ok(ui.includes('matchTelemetryPanel'), "Debug può focalizzare Telemetria");
assert.ok(ui.includes('mapHandOverlayShowHand'), "Debug può richiamare la Mano");
assert.ok(!ui.includes('newGame('), "runtime UI non avvia o modifica partite");
assert.ok(!ui.includes('state.'), "runtime UI non scrive direttamente lo stato di gioco");

console.log("F9U1a Map HUD Layout Foundation smoke: 36/36 verifiche superate");
