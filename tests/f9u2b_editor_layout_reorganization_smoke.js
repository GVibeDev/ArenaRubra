"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");

const index = read("index.html");
const css = read("css/style.css");
const mapEditor = read("src/map_editor.js");
const build = read("src/build_info.js");

let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const once = (id) => (index.match(new RegExp(`id=["']${id}["']`, "g")) || []).length === 1;

ok(build.includes('version: "C2-STABLE-1-F9U2b-APK-M4c"'), "versione F9U2b");
ok(build.includes('buildName: "Card Editor & Map Editor Layout Reorganization"'), "nome build F9U2b");
ok(build.includes('logicBaseline: "C2-STABLE-1-F9U2a-APK-M4c"'), "baseline F9U2a");
ok(build.includes('buildChannel: "f9u2b-candidate"'), "canale candidato");
ok(build.includes('telemetria F9Q3e1-2 restano invariati'), "telemetria dichiarata invariata");

[
  "cardEditorNewBtn", "cardEditorSaveBtn", "cardEditorDuplicateBtn", "cardEditorDeleteBtn",
  "cardEditorCopyJsonBtn", "cardEditorCopyAllBtn", "cardEditorPreviewCanvas", "cardEditorSavedList",
  "cardEditorImportText", "mapEditorNewBtn", "mapEditorSaveBtn", "mapEditorImportBtn",
  "mapEditorExportBtn", "mapEditorPortableExportBtn", "mapEditorUndoBtn", "mapEditorRedoBtn",
  "mapEditorFitBtn", "mapEditorCanvas", "mapEditorValidationSummary", "mapEditorValidationList",
  "mapEditorSelection", "mapEditorToolGrid", "mapEditorSymmetry"
].forEach(id => ok(once(id), `${id} presente una sola volta`));

ok(index.includes('class="deckBuilderHeaderActions cardEditorHeaderActions"'), "toolbar Card Editor raggruppata");
ok(index.includes('class="cardEditorActionGroup cardEditorPrimaryActions"'), "azioni primarie Card Editor");
ok(index.includes('class="cardEditorActionGroup cardEditorNavigationActions"'), "navigazione Card Editor");
ok(index.includes('class="cardEditorHeaderTools"'), "strumenti dati Card Editor richiudibili");
ok(index.includes('class="cardEditorDataExchange" open'), "scambio dati Card Editor organizzato");
ok(index.includes('class="cardEditorLayout cardEditorLayoutF9U2b"'), "layout Card Editor F9U2b");
ok(index.includes('class="cardEditorLibrarySection"'), "libreria custom separata");

ok(index.includes('class="mapEditorLiveBar"'), "barra live Map Editor");
["mapEditorLiveName", "mapEditorLivePlayers", "mapEditorLiveCells", "mapEditorLiveHq", "mapEditorLivePs", "mapEditorLiveMovement", "mapEditorLiveZoom", "mapEditorLiveTool", "mapEditorLiveSelection"].forEach(id => ok(once(id), `${id} presente`));
ok(index.includes('class="mapEditorSidebar mapEditorProjectPanel"'), "menu progetto a sinistra");
ok(index.includes('class="mapEditorSidebar mapEditorToolsPanel"'), "menu strumenti a destra");
ok(index.includes('class="mapEditorValidationPanel" open'), "validazione sul lato strumenti");
ok(index.includes('class="mapEditorActionGroup mapEditorProjectActions"'), "azioni progetto ordinate");
ok(index.includes('class="mapEditorActionGroup mapEditorHistoryActions"'), "cronologia e vista ordinate");
ok(index.includes('class="mapEditorActionDetails"'), "export raggruppato");

ok(mapEditor.includes('const MAP_EDITOR_TOOL_LABELS = Object.freeze'), "etichette live strumenti");
ok(mapEditor.includes('function mapEditorUpdateLiveBar'), "aggiornamento barra live");
ok(mapEditor.includes('mapEditorUpdateLiveBar(draft, validation);'), "barra live aggiornata dal render");
ok(mapEditor.includes('mapEditorLiveSelection'), "selezione live aggiornata");
ok(mapEditor.includes('mapEditorLiveZoom'), "zoom live aggiornato");

ok(css.includes('F9U2b – Card Editor & Map Editor Layout Reorganization'), "blocco CSS F9U2b");
ok(css.includes('.mapEditorWorkspaceF9U2b'), "griglia editor mappa F9U2b");
ok(css.includes('.mapEditorLiveBar'), "stile barra live");
ok(css.includes('.cardEditorLayoutF9U2b'), "griglia Card Editor F9U2b");
ok(css.includes('.cardEditorPreviewBox {\n  position: sticky;'), "preview Card Editor sticky desktop");
ok(css.includes('@media (max-width: 760px)'), "reflow mobile dedicato");

console.log(`F9U2b Editor Layout Reorganization smoke: ${checks}/${checks} verifiche superate`);
