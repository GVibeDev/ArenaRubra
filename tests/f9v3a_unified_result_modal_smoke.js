"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const store = new Map();
const calls = [];
const context = vm.createContext({
  console,
  Date,
  Set,
  Map,
  setTimeout:(fn)=>{ fn(); return 1; },
  clearTimeout:()=>{},
  localStorage:{
    getItem:key => store.has(key) ? store.get(key) : null,
    setItem:(key,value) => store.set(key, String(value)),
    removeItem:key => store.delete(key)
  },
  EventTypes:{
    TURN_STARTED:"TURN_STARTED", TURN_ENDED:"TURN_ENDED", UNIT_MOVED:"UNIT_MOVED",
    UNIT_DESTROYED:"UNIT_DESTROYED", CARD_DRAWN:"CARD_DRAWN", CARD_PLAYED:"CARD_PLAYED",
    CARD_DISCARDED:"CARD_DISCARDED", PS_CONTROL_CHANGED:"PS_CONTROL_CHANGED",
    PRESSURE_CHANGED:"PRESSURE_CHANGED", PRESSURE_EVALUATED:"PRESSURE_EVALUATED",
    VICTORY:"VICTORY", LOG_MESSAGE:"LOG_MESSAGE"
  },
  state:null,
  renderAll:()=>{}, syncCardDebugState:()=>{}, resetInteractionContext:()=>{},
  eventOverlayEnqueue:()=>{}, log:()=>{}, mapRuntimePlayerIds:()=>[1,2],
  pressureWinLimit:()=>5, countControlledPS:()=>0,
  deckRecoveryConfig:()=>({cost:5,draw:3,missionOrdinaryDraw:4}),
  canRecoverDeck:()=>({ok:true,reason:"Pronto",cost:5,draw:3,missionOrdinaryDraw:4}),
  openGamePanel:(name,options)=>calls.push(["gamePanel",name,options&&options.focusId]),
  controlCenterOpenPanel:name=>{ calls.push(["controlCenter",name]); return true; },
  openNewGameSetupScreen:()=>calls.push(["newGameSetup"]),
  setAppScreen:name=>calls.push(["screen",name]),
  ARENA_APP_SCREENS:{ MAIN_MENU:"mainMenu", SETUP:"setup", GAME:"game", TUTORIAL:"tutorial" }
});

function load(rel) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), context, { filename:rel });
}

load("data/tutorial_scenarios.js");
load("src/tutorial_runtime.js");
load("src/build_info.js");
const ev = expr => vm.runInContext(expr, context);
const source = fs.readFileSync(path.join(ROOT, "src/tutorial_runtime.js"), "utf8");

for (const token of [
  'data-result-action="log"',
  'data-result-action="telemetry"',
  'data-result-action="statistics"',
  'action:"main-menu"',
  'action:"new-game"',
  'action:"academy"',
  'LEZIONE COMPLETATA',
  'PROVA COMPLETATA',
  'PROVA FALLITA'
]) {
  if (!source.includes(token)) throw new Error(`Result Modal contract missing ${token}`);
}
if (source.includes('tutorialRuntimeSchedule(() => {\n    if (typeof setAppScreen') && source.includes('}, 1150')) {
  throw new Error("Legacy automatic Academy return still present after lesson completion");
}

// Capture modal payloads without needing a browser DOM.
context.__result = null;
ev("arenaResultModalShowF9V3a = payload => { __result = payload; return true; }");

// Normal match victory: must expose winner name, faction, round and win type.
context.state = { turn:24, modes:{1:"human",2:"bot"}, factions:{1:"Exordium",2:"Nexus"} };
ev("tutorialRuntimeHandleGameEvent({type:EventTypes.VICTORY,data:{winner:1,winnerFaction:'Exordium',winType:'pressione',message:'Vittoria Giocatore 1 per Pressione Strategica.'}})");
let result = context.__result;
if (!result || result.kind !== "victory" || result.title !== "VITTORIA") throw new Error(`Normal victory modal invalid: ${JSON.stringify(result)}`);
if (result.subject !== "Vincitore · Giocatore 1" || result.faction !== "Exordium" || result.round !== 24 || result.winType !== "pressione") throw new Error(`Winner identity not explicit: ${JSON.stringify(result)}`);

// Single-human loss: still identify the winning bot and faction clearly.
context.__result = null;
ev("tutorialRuntimeHandleGameEvent({type:EventTypes.VICTORY,data:{winner:2,winnerFaction:'Nexus',winType:'qg',message:'Vittoria Giocatore 2.'}})");
result = context.__result;
if (!result || result.kind !== "defeat" || result.title !== "SCONFITTA" || result.subject !== "Vincitore · Giocatore 2" || result.faction !== "Nexus") throw new Error(`Defeat modal invalid: ${JSON.stringify(result)}`);

// Draw path.
context.__result = null;
ev("tutorialRuntimeHandleGameEvent({type:EventTypes.VICTORY,data:{winner:null,winType:'pareggio',message:'Pareggio tecnico.'}})");
result = context.__result;
if (!result || result.kind !== "draw" || result.title !== "PAREGGIO") throw new Error(`Draw modal invalid: ${JSON.stringify(result)}`);

// Challenge V must not emit the generic match modal before the contextual Challenge result.
context.__result = null;
ev("tutorialChallengeRuntimeState.active=true; tutorialRuntimeHandleChallengeGameEvent = () => false;");
ev("tutorialRuntimeHandleGameEvent({type:EventTypes.VICTORY,data:{winner:1,winnerFaction:'Exordium',winType:'qg'}})");
if (context.__result) throw new Error("Generic match modal leaked into active Challenge");
ev("tutorialChallengeRuntimeState.active=false;");

// Lesson completion must persist on the game screen and show the Academy result modal.
context.__result = null;
context.state = { tutorialBotPaused:true, turn:3, modes:{1:"human",2:"bot"}, factions:{1:"Exordium",2:"Nexus"} };
ev("tutorialRuntimeState.scenarioId='lesson-1-combat'; tutorialRuntimeState.scenario={id:'lesson-1-combat',lessonId:'lesson-1',title:'Lezione test',steps:[{id:'done'}]}; tutorialRuntimeState.active=true;");
ev("tutorialRuntimeSaveProgress=()=>({}); tutorialRuntimeHideSpotlight=()=>{}; tutorialRuntimeRestoreCardPreviews=()=>{};");
const beforeLessonScreens = calls.filter(x=>x[0]==="screen").length;
ev("tutorialRuntimeFinish()");
result = context.__result;
if (!result || result.kind !== "lesson_complete" || result.title !== "LEZIONE COMPLETATA" || result.showAcademy !== true) throw new Error(`Lesson result modal invalid: ${JSON.stringify(result)}`);
if (calls.filter(x=>x[0]==="screen").length !== beforeLessonScreens) throw new Error("Lesson completion still changes screen automatically");

// Challenge completion/failure must show contextual persistent modal and not auto-switch screen.
context.__result = null;
context.state = { turn:9, tutorialChallengeMode:true, tutorialChallengeId:"challenge-3-hq-breach", tutorialChallengeDeckRecoveryDisabled:true, tutorialMode:true, tutorialBotPaused:true };
ev("tutorialChallengeRuntimeState.active=true; tutorialChallengeRuntimeState.challengeId='challenge-3-hq-breach'; tutorialChallengeRuntimeState.challenge=tutorialRuntimeChallengeById('challenge-3-hq-breach'); tutorialChallengeRuntimeState.completing=true;");
ev("tutorialRuntimeSaveChallengeProgress=()=>({}); tutorialRuntimeChallengeClearTimers=()=>{}; tutorialRuntimeChallengeRemoveHud=()=>{};");
const beforeChallengeScreens = calls.filter(x=>x[0]==="screen").length;
ev("tutorialRuntimeCompleteChallenge({success:true,outcome:'success',reason:'enemy_hq_occupied'})");
result = context.__result;
if (!result || result.kind !== "challenge_complete" || result.title !== "PROVA COMPLETATA" || result.showAcademy !== true) throw new Error(`Challenge success modal invalid: ${JSON.stringify(result)}`);
if (calls.filter(x=>x[0]==="screen").length !== beforeChallengeScreens) throw new Error("Challenge completion still changes screen automatically");

context.__result = null;
ev("arenaResultModalShowChallengeResultF9V3a({title:'Prova test'},false,'all_player_units_destroyed')");
result = context.__result;
if (!result || result.kind !== "challenge_failed" || result.title !== "PROVA FALLITA" || !/Forze del giocatore eliminate/.test(result.detail)) throw new Error(`Challenge failure modal invalid: ${JSON.stringify(result)}`);

// Action routing reuses existing app surfaces.
calls.length = 0;
ev("arenaResultModalHideF9V3a=()=>true;");
ev("arenaResultModalHandleActionF9V3a('log'); arenaResultModalHandleActionF9V3a('statistics'); arenaResultModalHandleActionF9V3a('telemetry'); arenaResultModalHandleActionF9V3a('academy'); arenaResultModalHandleActionF9V3a('main-menu'); arenaResultModalHandleActionF9V3a('new-game');");
const callText = JSON.stringify(calls);
for (const expected of ['["gamePanel","log","log"]','["gamePanel","stats","matchupStatsPanel"]','["controlCenter","telemetry"]','["screen","tutorial"]','["screen","mainMenu"]','["newGameSetup"]']) {
  if (!callText.includes(expected)) throw new Error(`Action routing missing ${expected}: ${callText}`);
}

if (ev("BUILD_INFO.version") !== "C2-STABLE-1-F9V3b-APK-M4c") throw new Error("BUILD_INFO version invalid");
if (ev("BUILD_INFO.buildChannel") !== "starter2-tutorial-hardening-v3b") throw new Error("BUILD_INFO channel invalid");

console.log(JSON.stringify({
  ok:true,
  feature:"Unified Result Modal",
  normalMatch:["victory","defeat","draw"],
  academy:["lesson_complete","challenge_complete","challenge_failed"],
  actions:["log","telemetry","statistics","academy(contextual)","main-menu","new-game"],
  automaticAcademyReturn:false,
  coreVictoryRulesModified:false,
  build:ev("BUILD_INFO.version")
}, null, 2));
