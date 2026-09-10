"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

const build = read("src/build_info.js");
const index = read("index.html");
const mapEditor = read("src/map_editor.js");
const diagnostics = read("src/android_runtime_diagnostics.js");
const css = read("css/style.css");
const app = read("src/app.js");
const cardPool = read("src/card_pool.js");
const cardEditor = read("src/card_editor.js");
const deckBuilder = read("src/deck_builder.js");
const cardRenderer = read("src/card_renderer.js");
const visualAssets = read("src/visual_assets.js");
const expertRuntime = read("src/expert_ai/expert_runtime.js");
const expertExordium = read("src/expert_ai/expert_exordium.js");

let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

ok(build.includes('version: "C2-STABLE-1-F9T2a-APK-M4c"'), "versione F9T2a");
ok(build.includes('buildName: "Android Touch & Render Baseline"'), "nome build F9T2a");
ok(build.includes('buildChannel: "f9t2a-candidate"'), "canale F9T2a");
ok(build.includes('logicBaseline: "C2-STABLE-1-F9T1-APK-M4c"'), "baseline logica F9T1 conservata");
ok(build.includes("F9Q3e1-2") && build.includes("F9T1-1") && build.includes("F9T2-1"), "schemi gameplay/Expert conservati");

ok(mapEditor.includes("pointers: new Map()"), "registro pointer limitato alla sessione editor");
ok(mapEditor.includes("MAP_EDITOR_DRAG_THRESHOLD_F9T2A = 8"), "soglia tap/drag presente");
ok(mapEditor.includes("mapEditorBeginPinchF9T2a"), "pinch zoom presente");
ok(mapEditor.includes('addEventListener("pointercancel"'), "pointercancel gestito");
ok(mapEditor.includes('addEventListener("lostpointercapture"'), "lostpointercapture gestito");
ok(mapEditor.includes("mapEditorClientPointToSvgF9T2a"), "conversione coordinate SVG robusta");
ok(mapEditor.includes("matrixTransform(matrix.inverse())"), "conversione usa CTM quando disponibile");
ok(mapEditor.includes("mapEditorScheduleWorldTransformF9T2a"), "transform coalescente presente");
ok(mapEditor.includes('world.setAttribute("transform"'), "aggiornamento limitato al world transform");
ok(mapEditor.includes('svg.dataset.renderer = "incremental-view-f9t2a"'), "renderer editor dichiarato");
ok(mapEditor.includes('mapEditorState.tool === "cell" && mapEditorState.toolValue === "add"'), "tap vuoto per aggiunta cella");
ok(!mapEditor.includes('if (event.target.closest("[data-map-cell]")) return;\n      svg.setPointerCapture'), "pan non bloccato sulle celle");

const renderStart = mapEditor.indexOf("function renderMapEditor()");
const renderEnd = mapEditor.indexOf("function mapEditorFit()", renderStart);
const renderBody = mapEditor.slice(renderStart, renderEnd);
ok(renderStart >= 0 && renderEnd > renderStart, "corpo renderMapEditor individuato");
ok(!renderBody.includes('querySelectorAll("[data-map-cell]").forEach'), "nessun listener per-cella ricreato dal render");
ok(!renderBody.includes("node.addEventListener"), "render privo di binding per nodo");
ok(renderBody.includes('mapEditorRecordDiagnosticF9T2a("map_editor_full_render"'), "render completo misurato");

const pointerMoveStart = mapEditor.indexOf('svg.addEventListener("pointermove"');
const pointerMoveEnd = mapEditor.indexOf('svg.addEventListener("pointerup"', pointerMoveStart);
const pointerMoveBody = mapEditor.slice(pointerMoveStart, pointerMoveEnd);
ok(pointerMoveStart >= 0 && pointerMoveEnd > pointerMoveStart, "corpo pointermove individuato");
ok(!pointerMoveBody.includes("renderMapEditor()"), "pointermove non ricostruisce l'editor");
ok(pointerMoveBody.includes("mapEditorScheduleWorldTransformF9T2a()"), "pointermove accoda solo il transform");

ok(index.includes('<script src="src/android_runtime_diagnostics.js"></script>'), "diagnostica caricata");
ok(index.indexOf("src/android_runtime_diagnostics.js") > index.indexOf("src/camera_interaction.js"), "diagnostica applicata dopo i wrapper UI");
ok(diagnostics.includes('ANDROID_RUNTIME_DIAGNOSTICS_SCHEMA_F9T2A = "F9T2a-1"'), "schema diagnostico");
ok(diagnostics.includes("ANDROID_RUNTIME_DIAGNOSTICS_SAMPLE_LIMIT_F9T2A = 160"), "buffer campioni limitato");
ok(diagnostics.includes("ANDROID_RUNTIME_DIAGNOSTICS_LONG_TASK_LIMIT_F9T2A = 32"), "buffer long task limitato");
ok(diagnostics.includes('androidRuntimeDiagnosticsWrapFunctionF9T2a("renderBoard"'), "renderBoard misurato");
ok(diagnostics.includes('androidRuntimeDiagnosticsWrapFunctionF9T2a("renderAll"'), "renderAll misurato");
ok(diagnostics.includes("androidRuntimeDiagnosticsCanvasBytesF9T2a"), "stima memoria canvas disponibile");
ok(diagnostics.includes("androidRuntimeDiagnosticsImageBytesF9T2a"), "stima immagini decodificate disponibile");
ok(!diagnostics.includes("localStorage") && !diagnostics.includes("indexedDB"), "diagnostica non persistente");

ok(index.match(/<canvas id="(?:deckBuilderCardPreviewCanvas|cardEditorPreviewCanvas|cardPoolPreviewCanvas)" width="1" height="1"/g)?.length === 3, "canvas editor inattivi iniziano a 1x1");
ok(cardPool.includes('CARD_POOL_GALLERY_ROOT_MARGIN_F9T2A = "320px 0px"'), "finestra lazy Card Pool limitata");
ok(cardPool.includes("new IntersectionObserver"), "miniature Card Pool renderizzate per visibilita");
ok(cardPool.includes("canvases.slice(0, 12)"), "fallback miniature senza IntersectionObserver limitato");
ok(cardPool.includes("function releaseCardPoolScreenResourcesF9T2a()"), "rilascio risorse Card Pool presente");
ok(app.includes("function appReleaseInactiveScreenResourcesF9T2a"), "rilascio canvas alla transizione schermata");
ok(cardEditor.includes("cardEditorResetForm({ render: false })"), "Card Editor non renderizzato all'avvio");
ok(!deckBuilder.slice(deckBuilder.indexOf("function openDeckBuilderScreen()"), deckBuilder.indexOf("function deckBuilderAddCard")).match(/renderDeckBuilderScreen\(\);\s*if/), "Deck Builder non effettua doppio render in apertura");
ok(visualAssets.includes('dataset.tokenAssetLoading = "demand-f9t2a"'), "asset token caricati su domanda");
ok(!visualAssets.slice(visualAssets.indexOf("function visualAssetApplyTokenGraphicsMode"), visualAssets.indexOf("function visualAssetSetTokenGraphicsMode")).includes("visualAssetPreloadAllTokenAssets()"), "nessun preload globale dei token al bootstrap");
ok(visualAssets.includes("visualAssetWatchTokenCandidatesOnDemandF9T2a"), "fallback token risolto in sequenza");
ok(cardRenderer.includes("CARD_RENDERER_IMAGE_CACHE_LIMIT_F9T2A = 32"), "cache immagini carta limitata");
ok(cardRenderer.includes("CARD_RENDERER_HAND_THUMB_MOBILE_LIMIT_F9T2A = 18"), "cache miniature ridotta su mobile");
ok(diagnostics.includes("cardRendererImageCacheDiagnosticsF9T2a") && diagnostics.includes("visualAssetTokenCacheDiagnosticsF9T2a"), "cache asset incluse nella diagnostica");

ok(css.includes("F9T2a — Android Touch & Render Baseline"), "CSS milestone presente");
ok(css.includes(".mapEditorCanvasPanel {\n    order: -2;"), "mappa prima nel layout compatto");
ok(css.includes("#mapEditorCanvas.isGestureActive .mapEditorHex polygon"), "transizioni sospese durante gesto");
ok(index.includes("Trascina anche sulle celle") && index.includes("pizzica"), "istruzioni touch visibili");

ok(expertRuntime.includes('EXPERT_AI_DOCTRINE_SCHEMA_VERSION_F9T2 = "F9T2-1"'), "runtime Expert F9T2 intatto");
ok(expertExordium.includes('EXPERT_EXORDIUM_BASTION_ID_F9T2 = "EX4B02"'), "dottrina Bastion Relay intatta");

console.log(JSON.stringify({
  status: "PASS",
  checks,
  version: "C2-STABLE-1-F9T2a-APK-M4c",
  renderer: "incremental-view-f9t2a",
  diagnostics: "F9T2a-1"
}, null, 2));
