"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const ui = fs.readFileSync(path.join(root, "src", "ui.js"), "utf8");
const build = fs.readFileSync(path.join(root, "src", "build_info.js"), "utf8");

for (const token of [
  'const ARENA_UI_THEME_SCHEMA_F9W2C = "F9W2c-1"',
  'function arenaUiThemeAssetSlotsF9W2c',
  'function arenaUiThemeResolveF9W2c',
  'function arenaUiThemeContrastTextF9W2c',
  'function arenaUiThemeSyncF9W2c',
  'function arenaUiThemeInstallHooksF9W2c',
  'scope:"global-shell+game-context"',
  'source = "active-human"',
  'source = "last-human-during-bot-turn"',
  '.setupScreenCard',
  '.deckBuilderCard',
  '.cardPoolCard',
  '.cardEditorCard',
  '.mapEditorCard',
  '.panel:not(#boardWrap)',
  '--arena-ui-text-on-accent',
  '--arena-ui-table-text',
  '--arena-ui-corner-tl',
  '--arena-ui-edge-top',
  'if (typeof arenaUiThemeInitializeF9W2c === "function") arenaUiThemeInitializeF9W2c();'
]) assert(ui.includes(token), `missing F9W2c contract token: ${token}`);

for (const token of [
  'version: "C2-STABLE-1-F9W2d3-APK-M4c"',
  'buildName: "Agathoi Palette Readability Hotfix"',
  'buildChannel: "starter2-ui-agathoi-palette-w2d3"',
  'logicBaseline: "C2-STABLE-1-F9T2c4-APK-M4c"'
]) assert(build.includes(token), `missing F9W2c build metadata: ${token}`);

// Validated predecessor contracts remain present.
for (const token of [
  'const ARENA_MENU_THEME_SCHEMA_F9W2B = "F9W2b-1"',
  'const ARENA_PRODUCT_PROFILE_SCHEMA_F9W2A = "F9W2a-1"',
  'const F9W2A1_SNOW_BF_OFFICIAL_MAP = Object.freeze(',
  '"id":"map10_snow_bf_4pl_3x"'
]) assert(ui.includes(token), `validated predecessor regression marker missing: ${token}`);

const start = ui.indexOf('// F9W2b — Menu Theme System');
const end = ui.indexOf('// F9W2c END', start);
assert(start >= 0 && end > start, 'combined F9W2b/F9W2c block missing');
const block = ui.slice(start, end + '// F9W2c END'.length);

let storedSettings = {};
let currentScreen = 'mainMenu';
const styleProps = {};
const styleElements = new Map();
const documentElement = {
  dataset:{},
  style:{setProperty:(key,value)=>{styleProps[key]=value;}}
};
const body = {
  dataset:{},
  classList:{contains:name => name === 'app-screen-game' && currentScreen === 'game'}
};
const document = {
  head:{appendChild:el=>styleElements.set(el.id,el)},
  body,
  documentElement,
  createElement:tag=>({tagName:String(tag).toUpperCase(),id:'',textContent:''}),
  getElementById:id=>styleElements.get(id)||null,
  querySelectorAll:()=>[]
};
const context = {
  console,
  Date,
  Math,
  document,
  state:null,
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
vm.runInNewContext(block, context, {filename:'f9w2c-global-theme.js'});

// Global selected theme now reaches every non-game screen through the UI token layer.
context.arenaMenuThemeApplyF9W2b('agathoi_kleos', {persist:true});
context.arenaUiThemeInitializeF9W2c();
let snap = context.arenaUiThemeSnapshotF9W2c();
assert.strictEqual(snap.selectedGlobalTheme, 'agathoi_kleos');
assert.strictEqual(snap.activeTheme, 'agathoi_kleos');
assert.strictEqual(snap.source, 'global-selection');
assert.strictEqual(documentElement.dataset.arenaUiScope, 'global');
assert.strictEqual(styleProps['--arena-ui-accent'], '#88b879');
assert.strictEqual(snap.contrastTokens, true);
assert.strictEqual(snap.modularSkinSlots, true);
assert(snap.slots.includes('cornerTl') && snap.slots.includes('edgeTop'), 'modular ornament slots missing');

// Single-human game: UI identity is fixed to Player 1 faction.
context.state = {
  playerIds:[1,2],
  players:[{id:1,faction:'Nexus',mode:'human'},{id:2,faction:'Exordium',mode:'bot'}],
  factions:{1:'Nexus',2:'Exordium'},
  modes:{1:'human',2:'bot'},
  currentPlayer:2
};
context.setAppScreen('game');
snap = context.arenaUiThemeSnapshotF9W2c();
assert.strictEqual(snap.activeTheme, 'nexus_basalt');
assert.strictEqual(snap.activeSide, 1);
assert.strictEqual(snap.source, 'player1');
assert.strictEqual(snap.humanPlayers, 1);
assert.strictEqual(styleProps['--arena-ui-accent'], '#4b93cf');

// Multi-human game: active human drives the UI; bot turns retain last human skin.
context.state = {
  playerIds:[1,2,3],
  players:[
    {id:1,faction:'Nexus',mode:'human'},
    {id:2,faction:'Exordium',mode:'human'},
    {id:3,faction:'Liberti',mode:'bot'}
  ],
  factions:{1:'Nexus',2:'Exordium',3:'Liberti'},
  modes:{1:'human',2:'human',3:'bot'},
  currentPlayer:2
};
context.renderAll();
snap = context.arenaUiThemeSnapshotF9W2c();
assert.strictEqual(snap.activeTheme, 'exordium_imperium');
assert.strictEqual(snap.activeSide, 2);
assert.strictEqual(snap.source, 'active-human');
assert.strictEqual(snap.humanPlayers, 2);

context.state.currentPlayer = 3;
context.renderAll();
snap = context.arenaUiThemeSnapshotF9W2c();
assert.strictEqual(snap.activeTheme, 'exordium_imperium');
assert.strictEqual(snap.activeSide, 2);
assert.strictEqual(snap.source, 'last-human-during-bot-turn');

context.state.currentPlayer = 1;
context.renderAll();
snap = context.arenaUiThemeSnapshotF9W2c();
assert.strictEqual(snap.activeTheme, 'nexus_basalt');
assert.strictEqual(snap.activeSide, 1);
assert.strictEqual(snap.source, 'active-human');

// Leaving the match restores the persisted global theme automatically.
context.setAppScreen('setup');
snap = context.arenaUiThemeSnapshotF9W2c();
assert.strictEqual(snap.activeTheme, 'agathoi_kleos');
assert.strictEqual(snap.source, 'global-selection');
assert.strictEqual(snap.boardPresentationUntouched, true);
assert(styleElements.has('arenaUiThemeStylesF9W2c'), 'global theme CSS not installed');

console.log(JSON.stringify({
  ok:true,
  feature:'F9W2c Global Theme Scope & Skin Architecture',
  globalScreens:['home','tutorial','setup','deckBuilder','cardPool','cardEditor','mapEditor','controlCenter'],
  singleHumanGame:'player1-faction',
  multiHumanGame:'active-human-with-bot-hold',
  boardPresentationUntouched:true,
  contrastTokens:true,
  modularSkinSlots:true,
    materialPass:true,
  predecessorRegression:true,
  build:'C2-STABLE-1-F9W2d3-APK-M4c'
}, null, 2));
