"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const ui = fs.readFileSync(path.join(root, "src", "ui.js"), "utf8");
const build = fs.readFileSync(path.join(root, "src", "build_info.js"), "utf8");

for (const token of [
  'const ARENA_UI_THEME_SKIN_SCHEMA_F9W2D = "F9W2d-1"',
  'const ARENA_UI_THEME_SKIN_ASSETS_F9W2D = Object.freeze(',
  'assets/ui/faction_skins/nexus_basalt/material.webp',
  'assets/ui/faction_skins/exordium_imperium/material.webp',
  'assets/ui/faction_skins/liberti_sine_vinculis/material.webp',
  'assets/ui/faction_skins/agathoi_kleos/material.webp',
  'assets/ui/faction_skins/fabeot_vesper/material.webp',
  'materialPass:true',
  'ornamentalModularity:true'
]) assert(ui.includes(token), `missing F9W2d token: ${token}`);

for (const token of [
  'version: "C2-STABLE-1-F9W2d2-APK-M4c"',
  'buildName: "Thin Border Modules & Ornament Simplification"',
  'buildChannel: "starter2-ui-border-modules-w2d2"',
  'logicBaseline: "C2-STABLE-1-F9T2c4-APK-M4c"'
]) assert(build.includes(token), `missing F9W2d build metadata: ${token}`);

const themes = ['nexus_basalt','exordium_imperium','liberti_sine_vinculis','agathoi_kleos','fabeot_vesper'];
const assets = ['material.webp','corner_tl.webp','corner_tr.webp','corner_bl.webp','corner_br.webp','edge_top.webp','edge_right.webp','edge_bottom.webp','edge_left.webp'];
for (const theme of themes) for (const asset of assets) {
  const file = path.join(root, 'assets', 'ui', 'faction_skins', theme, asset);
  assert(fs.existsSync(file), `missing asset: ${file}`);
}

const start = ui.indexOf('// F9W2b — Menu Theme System');
const end = ui.indexOf('// F9W2c END', start);
assert(start >= 0 && end > start, 'combined F9W2b/F9W2c block missing');
const block = ui.slice(start, end + '// F9W2c END'.length);

let storedSettings = {};
let currentScreen = 'mainMenu';
const styleProps = {};
const styleElements = new Map();
const documentElement = { dataset:{}, style:{setProperty:(key,value)=>{styleProps[key]=value;}} };
const body = { dataset:{}, classList:{contains:name => name === 'app-screen-game' && currentScreen === 'game'} };
const document = {
  head:{appendChild:el=>styleElements.set(el.id,el)},
  body,
  documentElement,
  createElement:tag=>({tagName:String(tag).toUpperCase(),id:'',textContent:''}),
  getElementById:id=>styleElements.get(id)||null,
  querySelectorAll:()=>[]
};
const context = {
  console, Date, Math, document, state:null,
  arenaStorageReadSettings:()=>JSON.parse(JSON.stringify(storedSettings)),
  arenaStorageWriteSettings:value=>{storedSettings=JSON.parse(JSON.stringify(value)); return true;},
  controlCenterSettingsHtml:()=>'<div class="controlCenterSettingsGrid"><section class="controlCenterSettingsCard"><h3>Archivio</h3></section></div>',
  controlCenterBindDynamicPanelControls:()=>true,
  currentAppScreen:()=>currentScreen,
  setAppScreen:screen=>{currentScreen=screen; return screen;},
  renderAll:()=>true,
  newGame:()=>true
};
context.globalThis = context;
vm.runInNewContext(block, context, {filename:'f9w2d-material-theme.js'});

context.arenaMenuThemeApplyF9W2b('agathoi_kleos', {persist:true});
context.arenaUiThemeInitializeF9W2c();
let snap = context.arenaUiThemeSnapshotF9W2c();
assert.strictEqual(snap.activeTheme, 'agathoi_kleos');
assert.strictEqual(styleProps['--arena-ui-text-primary'], '#172111');
assert.strictEqual(styleProps['--arena-ui-table-text'], '#1b2615');
assert.ok(String(styleProps['--arena-ui-material-image']).includes('agathoi_kleos/material.webp'));
assert.ok(String(styleProps['--arena-ui-corner-tl']).includes('agathoi_kleos/corner_tl.webp'));
assert.strictEqual(styleProps['--arena-ui-ornament-opacity'], '.30');

context.state = {
  playerIds:[1,2],
  players:[{id:1,faction:'Nexus',mode:'human'},{id:2,faction:'Exordium',mode:'bot'}],
  factions:{1:'Nexus',2:'Exordium'},
  modes:{1:'human',2:'bot'},
  currentPlayer:2
};
context.setAppScreen('game');
context.renderAll();
snap = context.arenaUiThemeSnapshotF9W2c();
assert.strictEqual(snap.activeTheme, 'nexus_basalt');
assert.ok(String(styleProps['--arena-ui-material-image']).includes('nexus_basalt/material.webp'));

console.log(JSON.stringify({
  ok:true,
  feature:'F9W2d Thin Border Modules & Ornament Simplification',
  themes,
  assetsPerTheme:assets.length,
  activeGameTheme:snap.activeTheme,
  build:'C2-STABLE-1-F9W2d2-APK-M4c'
}, null, 2));
