"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const ui = fs.readFileSync(path.join(root, "src", "ui.js"), "utf8");
const build = fs.readFileSync(path.join(root, "src", "build_info.js"), "utf8");

for (const token of [
  'const ARENA_MENU_THEME_SCHEMA_F9W2B = "F9W2b-1"',
  'const ARENA_MENU_THEME_SETTINGS_KEY_F9W2B = "menuTheme"',
  'rubra_classic:Object.freeze',
  'nexus_basalt:Object.freeze',
  'exordium_imperium:Object.freeze',
  'liberti_sine_vinculis:Object.freeze',
  'agathoi_kleos:Object.freeze',
  'fabeot_vesper:Object.freeze',
  'function arenaMenuThemeApplyF9W2b',
  'function arenaMenuThemePersistF9W2b',
  'id="arenaMenuThemeSelectF9W2b"',
  'scope:"menu-control-center"',
  'if (typeof arenaMenuThemeInitializeF9W2b === "function") arenaMenuThemeInitializeF9W2b();'
]) assert(ui.includes(token), `missing F9W2b contract token: ${token}`);

for (const token of [
  'version: "C2-STABLE-1-F9W2b-APK-M4c"',
  'buildName: "Menu Theme System"',
  'buildChannel: "starter2-menu-theme-w2b"',
  'logicBaseline: "C2-STABLE-1-F9T2c4-APK-M4c"',
  'productProfileDefault: "dev"',
  'productProfileSwitchable: true'
]) assert(build.includes(token), `missing F9W2b build metadata: ${token}`);

// Regression markers from the two validated predecessors.
for (const token of [
  'const ARENA_PRODUCT_PROFILE_SCHEMA_F9W2A = "F9W2a-1"',
  'function arenaProductProfileInitializeF9W2a()',
  'const F9W2A1_SNOW_BF_OFFICIAL_MAP = Object.freeze(',
  '"id":"map10_snow_bf_4pl_3x"',
  'arenaInstallOfficialSnowMapF9W2a1();'
]) assert(ui.includes(token), `validated predecessor regression marker missing: ${token}`);

const blockStart = ui.indexOf('// F9W2b — Menu Theme System');
const blockEnd = ui.indexOf('// F9W2b END', blockStart);
assert(blockStart >= 0 && blockEnd > blockStart, 'F9W2b isolated block missing');
const block = ui.slice(blockStart, blockEnd);

let storedSettings = {};
const styleProps = {};
const styleElements = new Map();
const documentElement = {
  dataset:{},
  style:{ setProperty:(key,value)=>{ styleProps[key]=value; } }
};
const body = { dataset:{} };
const head = { appendChild:el => { styleElements.set(el.id, el); } };
const document = {
  head,
  body,
  documentElement,
  createElement:tag => ({ tagName:String(tag).toUpperCase(), id:"", textContent:"" }),
  getElementById:id => styleElements.get(id) || null
};
const context = {
  console,
  Date,
  document,
  arenaStorageReadSettings:() => JSON.parse(JSON.stringify(storedSettings)),
  arenaStorageWriteSettings:value => { storedSettings = JSON.parse(JSON.stringify(value)); return true; },
  controlCenterSettingsHtml:() => `<div class="controlCenterSettingsGrid">\n      <section class="controlCenterSettingsCard">\n        <h3>Archivio</h3>\n      </section>\n    </div>`,
  controlCenterBindDynamicPanelControls:() => true
};
context.globalThis = context;
vm.runInNewContext(block, context, {filename:"f9w2b-menu-theme.js"});

const settingsHtml = context.controlCenterSettingsHtml();
assert(settingsHtml.includes('id="arenaMenuThemeSelectF9W2b"'), 'theme selector not injected into Settings');
for (const key of ['rubra_classic','nexus_basalt','exordium_imperium','liberti_sine_vinculis','agathoi_kleos','fabeot_vesper']) {
  assert(settingsHtml.includes(`value="${key}"`), `theme option missing: ${key}`);
}

const initial = context.arenaMenuThemeInitializeF9W2b();
assert.strictEqual(initial.key, 'rubra_classic');
assert.strictEqual(initial.available.length, 6);
assert.strictEqual(documentElement.dataset.arenaMenuTheme, 'rubra_classic');
assert(styleElements.has('arenaMenuThemeStylesF9W2b'), 'theme CSS not installed');

const applied = context.arenaMenuThemeApplyF9W2b('fabeot_vesper', {persist:true});
assert.strictEqual(applied.key, 'fabeot_vesper');
assert.strictEqual(documentElement.dataset.arenaMenuTheme, 'fabeot_vesper');
assert.strictEqual(body.dataset.arenaMenuTheme, 'fabeot_vesper');
assert.strictEqual(storedSettings.menuTheme.schemaVersion, 'F9W2b-1');
assert.strictEqual(storedSettings.menuTheme.key, 'fabeot_vesper');
assert.strictEqual(styleProps['--arena-menu-accent'], '#ad70cf');
assert.strictEqual(context.arenaMenuThemeSnapshotF9W2b().scope, 'menu-control-center');

// Invalid persisted values always fall back safely.
storedSettings.menuTheme = {key:'not-a-theme'};
context.arenaMenuThemeStateF9W2b = context.arenaMenuThemeStateF9W2b || undefined;
assert.strictEqual(context.arenaMenuThemeNormalizeF9W2b('not-a-theme'), 'rubra_classic');

console.log(JSON.stringify({
  ok:true,
  feature:'F9W2b Menu Theme System',
  themes:6,
  defaultTheme:'rubra_classic',
  liveApply:true,
  persistent:true,
  scope:'menu-control-center',
  productProfileRegression:true,
  snowMapRegression:true,
  build:'C2-STABLE-1-F9W2b-APK-M4c'
}, null, 2));
