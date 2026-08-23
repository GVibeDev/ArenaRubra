"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const uiPath = path.join(root, "src", "ui.js");
const source = fs.readFileSync(uiPath, "utf8");
const startMarker = "// F9W2a — Player / DEV Runtime Profile Foundation";
const endMarker = "// F9W2a END";
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);
assert(start >= 0 && end > start, "F9W2a block not found in src/ui.js");
const block = source.slice(start, end + endMarker.length);

function buildContext(build = {}, stored = {}) {
  let settings = JSON.parse(JSON.stringify(stored || {}));
  const calls = {
    panels: [],
    screens: [],
    editor: 0,
    mapEditor: 0,
    layout: 0,
    renderer: 0,
    rendererInject: 0,
    result: [],
    mapRefresh: 0,
    storageRead: [],
    storageWrite: []
  };

  const context = {
    console,
    Date,
    URLSearchParams,
    queueMicrotask: fn => fn(),
    setTimeout: fn => { fn(); return 1; },
    clearTimeout: () => {},
    BUILD_INFO: {
      productProfileDefault: "dev",
      productProfileSwitchable: true,
      ...build
    },
    arenaStorageReadSettings: () => JSON.parse(JSON.stringify(settings)),
    arenaStorageWriteSettings: value => { settings = JSON.parse(JSON.stringify(value)); return true; },
    arenaStorageReadJson: (key, fallback) => { calls.storageRead.push(key); return { key, fallback, via: "vault" }; },
    arenaStorageWriteJson: (key, value) => { calls.storageWrite.push([key, value]); return true; },
    controlCenterDeveloperDefault: () => true,
    controlCenterReadDeveloperMode: () => true,
    controlCenterSetDeveloperMode: () => true,
    controlCenterApplyDeveloperMode: () => true,
    controlCenterOpenPanel: key => { calls.panels.push(key); return `panel:${key}`; },
    controlCenterOpenMapInEditor: () => { calls.mapEditor += 1; return true; },
    controlCenterOpenMapInSetup: () => true,
    controlCenterDebugHtml: () => '<div><button class="ghost" type="button" data-control-center-action="open-layout-lab">Apri Layout Calibration Lab</button></div>',
    controlCenterHandleAction: action => `action:${action}`,
    setAppScreen: screen => { calls.screens.push(screen); return screen; },
    openCardEditorScreen: () => { calls.editor += 1; return true; },
    openMapEditorScreen: () => { calls.mapEditor += 1; return true; },
    openMenuLayoutCalibrationLabScreen: () => { calls.layout += 1; return true; },
    rendererCalibrationOpen: () => { calls.renderer += 1; return true; },
    rendererCalibrationInjectButtons: () => { calls.rendererInject += 1; return true; },
    rendererCalibrationCurrentCard: () => ({ id:"TEST" }),
    arenaResultModalHandleActionF9V3a: action => { calls.result.push(action); return `result:${action}`; },
    refreshSetupMapSelector: () => { calls.mapRefresh += 1; return true; },
    refreshMainMenuLocalDataSummary: () => true,
    menuLayoutCalibrationReadJson: () => null,
    menuLayoutCalibrationWriteJson: () => false,
    rendererCalibrationReadJson: () => null,
    rendererCalibrationWriteJson: () => false,
    initializeRendererCalibrationLab: () => true,
    window: { location: { search: "" } },
    globalThis: null
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(block, context, { filename: "f9w2a-profile-block.js" });
  return { context, calls, getSettings: () => settings };
}

function evalIn(ctx, expr) {
  return vm.runInContext(expr, ctx);
}

// DEV candidate defaults to full workshop exposure.
{
  const { context, calls, getSettings } = buildContext();
  assert.strictEqual(evalIn(context, "arenaProductProfileCurrentF9W2a()"), "dev");
  assert.strictEqual(evalIn(context, 'arenaProductProfileAllowsF9W2a("play")'), true);
  assert.strictEqual(evalIn(context, 'arenaProductProfileAllowsF9W2a("cardEditor")'), true);
  assert.strictEqual(evalIn(context, 'arenaProductProfileAllowsF9W2a("calibration")'), true);

  assert.strictEqual(evalIn(context, 'arenaProductProfileSetF9W2a("distribution", {persist:true})'), "distribution");
  const snapshot = JSON.parse(JSON.stringify(evalIn(context, "arenaProductProfileSnapshotF9W2a()")));
  assert.strictEqual(snapshot.profile, "distribution");
  for (const capability of ["play","tutorial","deckBuilder","cardPool","playerStatistics","playerHistory","settings","version"]) {
    assert.strictEqual(snapshot.capabilities[capability], true, `${capability} must remain public`);
  }
  for (const capability of ["cardEditor","mapEditor","rawTelemetry","rawLog","debug","calibration","expertAi","fullVaultTransfer","customMaps"]) {
    assert.strictEqual(snapshot.capabilities[capability], false, `${capability} must be DEV-only`);
  }
  const persisted = getSettings();
  assert.strictEqual(persisted.productProfile.profile, "distribution");
  assert.strictEqual(persisted.controlCenter.developerMode, false, "legacy developer toggle must remain compatible");

  assert.strictEqual(evalIn(context, 'controlCenterOpenPanel("statistics")'), "panel:statistics");
  assert.strictEqual(evalIn(context, 'controlCenterOpenPanel("history")'), "panel:history");
  assert.strictEqual(evalIn(context, 'controlCenterOpenPanel("telemetry")'), false);
  assert.strictEqual(evalIn(context, 'controlCenterOpenPanel("log")'), false);
  assert.strictEqual(evalIn(context, 'controlCenterOpenPanel("debug")'), false);
  assert.strictEqual(evalIn(context, 'controlCenterOpenPanel("transfer")'), false);
  assert.strictEqual(evalIn(context, "openCardEditorScreen()"), false);
  assert.strictEqual(evalIn(context, "openMapEditorScreen()"), false);
  assert.strictEqual(evalIn(context, "openMenuLayoutCalibrationLabScreen()"), false);
  assert.strictEqual(evalIn(context, 'arenaResultModalHandleActionF9V3a("telemetry")'), false);
  assert.strictEqual(evalIn(context, 'arenaResultModalHandleActionF9V3a("log")'), false);
  assert.strictEqual(evalIn(context, 'arenaResultModalHandleActionF9V3a("statistics")'), "result:statistics");

  assert.strictEqual(evalIn(context, 'setAppScreen("cardEditor")'), "mainMenu");
  assert.strictEqual(evalIn(context, 'setAppScreen("mapEditor")'), "mainMenu");
  assert.strictEqual(evalIn(context, 'setAppScreen("layoutLab")'), "mainMenu");
  assert.strictEqual(evalIn(context, 'setAppScreen("game")'), "game");

  // Both calibration labs must be preserved in DEV and use the vault facade.
  assert.strictEqual(evalIn(context, 'menuLayoutCalibrationReadJson("arenaRubra.menuLayoutCalibration.v1", {})').via, "vault");
  assert.strictEqual(evalIn(context, 'rendererCalibrationReadJson("arenaRubra.rendererTextCalibration.v2", {})').via, "vault");
  assert.strictEqual(evalIn(context, 'menuLayoutCalibrationWriteJson("arenaRubra.menuLayoutCalibration.v1", {x:1})'), true);
  assert.strictEqual(evalIn(context, 'rendererCalibrationWriteJson("arenaRubra.rendererTextCalibration.v2", {x:1})'), true);
  assert(calls.storageRead.includes("arenaRubra.menuLayoutCalibration.v1"));
  assert(calls.storageRead.includes("arenaRubra.rendererTextCalibration.v2"));

  assert.strictEqual(evalIn(context, 'arenaProductProfileSetF9W2a("dev", {persist:false})'), "dev");
  assert.strictEqual(evalIn(context, "openCardEditorScreen()"), true);
  assert.strictEqual(evalIn(context, "openMenuLayoutCalibrationLabScreen()"), true);
  assert.strictEqual(evalIn(context, 'controlCenterHandleAction("open-renderer-lab")'), true);
  assert(calls.renderer > 0, "renderer calibration lab should remain callable in DEV");
  assert(evalIn(context, "controlCenterDebugHtml()").includes('data-control-center-action="open-renderer-lab"'));
  assert(calls.mapRefresh >= 2, "map selector should refresh on profile transitions");

  // Profile gating must preserve the natural open/closed state of transient UI.
  context.__closedMenu = {tagName:"DIV", hidden:true, disabled:false, dataset:{}, attrs:{}, setAttribute(k,v){this.attrs[k]=v;}};
  context.__visibleButton = {tagName:"BUTTON", hidden:false, disabled:false, dataset:{}, attrs:{}, setAttribute(k,v){this.attrs[k]=v;}};
  evalIn(context, "arenaProductProfileSetElementVisibleF9W2a(__closedMenu,false); arenaProductProfileSetElementVisibleF9W2a(__closedMenu,true);");
  evalIn(context, "arenaProductProfileSetElementVisibleF9W2a(__visibleButton,false,{disable:true}); arenaProductProfileSetElementVisibleF9W2a(__visibleButton,true,{disable:true});");
  assert.strictEqual(context.__closedMenu.hidden, true, "closed debug menu must stay closed after profile roundtrip");
  assert.strictEqual(context.__visibleButton.hidden, false, "visible control must be restored in DEV");
  assert.strictEqual(context.__visibleButton.disabled, false, "disabled state must be restored in DEV");
}


// Invalid persisted/query values must not silently elevate a locked/public build.
{
  const { context } = buildContext(
    { productProfileDefault:"distribution", productProfileSwitchable:false },
    { productProfile:{ profile:"dev" }, controlCenter:{ developerMode:true } }
  );
  assert.strictEqual(evalIn(context, "arenaProductProfileCurrentF9W2a()"), "distribution");
  assert.strictEqual(evalIn(context, 'arenaProductProfileSetF9W2a("dev", {persist:true})'), "distribution");
  assert.strictEqual(evalIn(context, 'arenaProductProfileAllowsF9W2a("cardEditor")'), false);
  assert.strictEqual(evalIn(context, 'arenaProductProfileAllowsF9W2a("play")'), true);
}

// Invalid query does not become DEV by accident.
{
  const { context } = buildContext({ productProfileDefault:"distribution", productProfileSwitchable:true });
  context.window.location.search = "?profile=garbage";
  assert.strictEqual(evalIn(context, "arenaProductProfileQueryOverrideF9W2a()"), null);
  assert.strictEqual(evalIn(context, "arenaProductProfileCurrentF9W2a()"), "distribution");
}

console.log("F9W2a product profile smoke: PASS");
