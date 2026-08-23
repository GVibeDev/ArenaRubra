"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const calls = [];
const store = new Map();

const context = vm.createContext({
  console,
  Date,
  Set,
  Map,
  globalThis:null,
  setTimeout:(fn)=>{ fn(); return 1; },
  clearTimeout:()=>{},
  localStorage:{
    getItem:key => store.has(key) ? store.get(key) : null,
    setItem:(key,value) => store.set(key, String(value)),
    removeItem:key => store.delete(key)
  },
  TUTORIAL_LESSON_PLAN_F9O6:[
    {id:"lesson-1-exordium",order:1,title:"L1",scenarioId:"lesson-1-exordium"},
    {id:"lesson-2-nexus",order:2,title:"L2",scenarioId:"lesson-2-nexus"},
    {id:"lesson-3-agathoi",order:3,title:"L3",scenarioId:"lesson-3-agathoi"},
    {id:"lesson-4-liberti",order:4,title:"L4",scenarioId:"lesson-4-liberti"},
    {id:"lesson-5-fabeot",order:5,title:"L5",scenarioId:"lesson-5-fabeot"}
  ],
  TUTORIAL_CHALLENGE_PLAN_F9V2A:[
    {id:"challenge-1-elimination",order:1,title:"Eliminazione",scenarioId:"challenge-1-elimination"},
    {id:"challenge-2-hold-ps",order:2,title:"Tenuta",scenarioId:"challenge-2-hold-ps"},
    {id:"challenge-3-hq-breach",order:3,title:"Breccia",scenarioId:"challenge-3-hq-breach"},
    {id:"challenge-4-pressure",order:4,title:"Pressione",scenarioId:"challenge-4-pressure"},
    {id:"challenge-5-final-exam",order:5,title:"Esame finale",scenarioId:"challenge-5-final-exam"}
  ],
  EventTypes:{VICTORY:"VICTORY",TURN_STARTED:"TURN_STARTED",TURN_ENDED:"TURN_ENDED",UNIT_MOVED:"UNIT_MOVED",UNIT_DESTROYED:"UNIT_DESTROYED",CARD_DRAWN:"CARD_DRAWN",CARD_PLAYED:"CARD_PLAYED",CARD_DISCARDED:"CARD_DISCARDED",PS_CONTROL_CHANGED:"PS_CONTROL_CHANGED",PRESSURE_CHANGED:"PRESSURE_CHANGED",PRESSURE_EVALUATED:"PRESSURE_EVALUATED",LOG_MESSAGE:"LOG_MESSAGE"},
  state:{
    currentPlayer:1,
    turn:12,
    modes:{1:"human",2:"bot"},
    factions:{1:"Exordium",2:"Nexus"},
    deck:{1:[],2:[]},
    hand:{1:[],2:[]},
    discard:{1:[{id:"A"}],2:[]},
    starterCards:{1:{a:{id:"S1"},b:{id:"S2"},c:{id:"S3"}},2:{}},
    energy:{1:5,2:0}
  },
  mapRuntimePlayerIds:()=>[1,2],
  pressureWinLimit:()=>5,
  countControlledPS:()=>0,
  renderAll:()=>{},
  syncCardDebugState:()=>{},
  resetInteractionContext:()=>{},
  eventOverlayEnqueue:()=>{},
  log:()=>{},
  escapeHtml:value=>String(value == null ? "" : value).replace(/[&<>\"']/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch])),
  recoverCurrentPlayerDeck:()=>true,
  renderDeckRecoveryControl:()=>"LEGACY",
  canRecoverDeck(side){
    const st = context.state;
    const cfg = {cost:5,draw:3,missionOrdinaryDraw:4};
    if ((st.deck[side]||[]).length > 0) return {ok:false,reason:"Il deck non è vuoto",...cfg};
    const blockers=(st.hand[side]||[]).filter(card=>card && card.sourceType!=="mission");
    if (blockers.length) return {ok:false,reason:"La mano contiene ancora carte ordinarie",...cfg};
    if (!(st.discard[side]||[]).length) return {ok:false,reason:"Gli scarti sono vuoti",...cfg};
    if ((st.energy[side]||0) < cfg.cost) return {ok:false,reason:"Servono 5 ENE",...cfg};
    return {ok:true,reason:"Pronto",...cfg};
  },
  closeGamePanel:()=>{ calls.push(["closeGamePanel"]); return true; },
  closeAnyGamePanelForMapReturn:()=>{ calls.push(["closeAnyGamePanelForMapReturn"]); return true; },
  controlCenterClosePanel:()=>{ calls.push(["controlCenterClosePanel"]); return true; },
  openGamePanel:(name)=>{ calls.push(["openGamePanel",name]); return true; },
  controlCenterOpenPanel:name=>{ calls.push(["controlCenterOpenPanel",name]); return true; },
  setAppScreen:name=>{ calls.push(["screen",name]); return true; },
  ARENA_APP_SCREENS:{MAIN_MENU:"mainMenu",SETUP:"setup",GAME:"game",TUTORIAL:"tutorial"},
  openNewGameSetupScreen:()=>{ calls.push(["newGameSetup"]); return true; },
  openMainMenu:()=>{ calls.push(["mainMenu"]); return true; }
});
context.globalThis = context;

function load(rel){
  vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), context, {filename:rel});
}
load("src/tutorial_runtime.js");
load("src/build_info.js");

const ev = expr => vm.runInContext(expr, context);
// Avoid DOM dependency while preserving modal state transitions.
ev("arenaResultModalRenderPayloadF9V3c = function(payload){ arenaResultModalStateF9V3a.open=true; arenaResultModalStateF9V3a.suspended=false; return true; };");

// Terminal match: analysis suspends, closing analysis restores same modal and lock.
ev("arenaResultModalShowMatchVictoryF9V3a({data:{winner:1,winnerFaction:'Exordium',winType:'pressione'}})");
if (!ev("arenaResultModalStateF9V3a.locked") || !ev("arenaResultModalStateF9V3a.open")) throw new Error("Result lock not armed");
ev("arenaResultModalHandleActionF9V3a('log')");
if (!ev("arenaResultModalStateF9V3a.locked") || ev("arenaResultModalStateF9V3a.open") || !ev("arenaResultModalStateF9V3a.suspended")) throw new Error("Analysis did not suspend locked result");
ev("closeGamePanel()")
if (!ev("arenaResultModalStateF9V3a.locked") || !ev("arenaResultModalStateF9V3a.open") || ev("arenaResultModalStateF9V3a.suspended")) throw new Error("Closing Log did not restore locked result modal");

// Statistics and Telemetry close follow the same contract.
ev("arenaResultModalHandleActionF9V3a('statistics')");
ev("closeGamePanel()")
if (!ev("arenaResultModalStateF9V3a.open")) throw new Error("Closing Statistics did not restore result modal");
ev("arenaResultModalHandleActionF9V3a('telemetry')");
ev("controlCenterClosePanel()")
if (!ev("arenaResultModalStateF9V3a.open")) throw new Error("Closing Telemetry did not restore result modal");

// Terminal actions resolve lock.
ev("arenaResultModalHandleActionF9V3a('main-menu')")
if (ev("arenaResultModalStateF9V3a.locked") || !ev("arenaResultModalStateF9V3a.resolved")) throw new Error("Main menu did not resolve terminal lock");

// Tutorial result: no analysis and direct next lesson.
ev("arenaResultModalShowLessonCompleteF9V3a('L1','lesson-1-exordium')")
let payload = ev("arenaResultModalStateF9V3a.payload");
if (payload.analysisAllowed !== false || payload.nextAction !== "next-lesson" || payload.nextScenarioId !== "lesson-2-nexus") throw new Error(`Lesson 1 flow invalid ${JSON.stringify(payload)}`);
if (ev("arenaResultModalOpenAnalysisF9V3a('log')") !== false) throw new Error("Tutorial result unexpectedly exposes Log");

// Replace actual starters to inspect routing without scenario data.
context.__next = [];
ev("tutorialRuntimeStartScenario = function(id){ __next.push(['lesson',id]); return true; }; tutorialRuntimeStartChallenge = function(id){ __next.push(['challenge',id]); return true; };");
ev("arenaResultModalHandleActionF9V3a('next-lesson')")
if (JSON.stringify(context.__next[0]) !== JSON.stringify(["lesson","lesson-2-nexus"])) throw new Error(`Next lesson route invalid ${JSON.stringify(context.__next)}`);

// Lesson 5 hands off to Challenge I.
ev("arenaResultModalShowLessonCompleteF9V3a('L5','lesson-5-fabeot')")
payload = ev("arenaResultModalStateF9V3a.payload");
if (payload.analysisAllowed !== false || payload.nextAction !== "next-challenge" || payload.nextChallengeId !== "challenge-1-elimination") throw new Error(`Lesson 5 flow invalid ${JSON.stringify(payload)}`);

// Challenge success chains, failure retries; both suppress analysis.
ev("arenaResultModalShowChallengeResultF9V3a({id:'challenge-1-elimination',title:'Eliminazione'},true,'all_enemy_units_destroyed')")
payload = ev("arenaResultModalStateF9V3a.payload");
if (payload.analysisAllowed !== false || payload.nextAction !== "next-challenge" || payload.nextChallengeId !== "challenge-2-hold-ps") throw new Error(`Challenge chain invalid ${JSON.stringify(payload)}`);
ev("arenaResultModalShowChallengeResultF9V3a({id:'challenge-2-hold-ps',title:'Tenuta'},false,'all_player_units_destroyed')")
payload = ev("arenaResultModalStateF9V3a.payload");
if (payload.nextAction !== "retry-challenge" || payload.retryChallengeId !== "challenge-2-hold-ps") throw new Error(`Challenge retry invalid ${JSON.stringify(payload)}`);

// Deck recovery: three Starter cards are separate and do not block recovery.
context.state.deck[1] = [];
context.state.hand[1] = [];
context.state.discard[1] = [{id:"D1"},{id:"D2"}];
context.state.starterCards[1] = {inf:{id:"S1"},veh:{id:"S2"},str:{id:"S3"}};
context.state.energy[1] = 5;
let html = ev("renderDeckRecoveryControl()")
if (!/Riorganizza deck/.test(html) || / disabled/.test(html)) throw new Error(`Starter cards incorrectly block recovery: ${html}`);

// If an ordinary hand card remains, the control stays visible but explains why it is disabled.
context.state.hand[1] = [{id:"UNIT:X",sourceType:"unit"}];
html = ev("renderDeckRecoveryControl()")
if (!/Riorganizza deck/.test(html) || !/ disabled/.test(html) || !/La mano contiene ancora carte ordinarie/.test(html)) throw new Error(`Blocked recovery is still visually missing/opaque: ${html}`);

// Non-empty deck: recovery control remains absent.
context.state.deck[1] = [{id:"DECK"}];
html = ev("renderDeckRecoveryControl()")
if (html !== "") throw new Error(`Recovery shown before deck exhaustion: ${html}`);

const source = fs.readFileSync(path.join(ROOT,"src/tutorial_runtime.js"),"utf8");
for (const token of [
  ".narrativeExpressionLabel{display:none!important",
  "tutorialCompletionBadgeF9V3c",
  "tutorialLessonProgressF9V3c",
  "arenaResultModalResumeIfLockedF9V3c",
  "#returnMainMenuBtn,#newGameBtn",
  "analysisAllowed:false",
  "Vai alla Prova sul campo I"
]) if (!source.includes(token)) throw new Error(`F9V3c source contract missing ${token}`);

if (ev("BUILD_INFO.version") !== "C2-STABLE-1-F9V3c-APK-M4c") throw new Error("Build version invalid");
if (ev("BUILD_INFO.buildChannel") !== "starter2-result-flow-v3c") throw new Error("Build channel invalid");

console.log(JSON.stringify({
  ok:true,
  feature:"F9V3c Result Flow & Tutorial UX Polish",
  terminalLock:true,
  analysisReturnsToResult:true,
  titlebarTerminalActionsResolveLock:true,
  tutorialAnalysisSuppressed:true,
  lessonNextFlow:true,
  challengeNextRetryFlow:true,
  academyCompletionMarkers:true,
  narratorExpressionLabelHidden:true,
  deckRecoveryVisibleWhenBlocked:true,
  starterCardsBlockRecovery:false,
  build:ev("BUILD_INFO.version")
}, null, 2));
