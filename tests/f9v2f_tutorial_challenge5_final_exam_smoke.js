"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const storeMap = new Map();
const context = vm.createContext({
  console,
  Date,
  Set,
  Map,
  setTimeout,
  clearTimeout,
  localStorage:{
    getItem:key => storeMap.has(key) ? storeMap.get(key) : null,
    setItem:(key,value) => storeMap.set(key, String(value)),
    removeItem:key => storeMap.delete(key)
  },
  EventTypes:{
    TURN_STARTED:"TURN_STARTED",
    TURN_ENDED:"TURN_ENDED",
    UNIT_MOVED:"UNIT_MOVED",
    UNIT_DESTROYED:"UNIT_DESTROYED",
    CARD_DRAWN:"CARD_DRAWN",
    CARD_PLAYED:"CARD_PLAYED",
    CARD_DISCARDED:"CARD_DISCARDED",
    PS_CONTROL_CHANGED:"PS_CONTROL_CHANGED",
    PRESSURE_CHANGED:"PRESSURE_CHANGED",
    PRESSURE_EVALUATED:"PRESSURE_EVALUATED",
    VICTORY:"VICTORY",
    LOG_MESSAGE:"LOG_MESSAGE"
  },
  renderAll:()=>{},
  syncCardDebugState:()=>{},
  resetInteractionContext:()=>{},
  eventOverlayEnqueue:()=>{},
  log:()=>{},
  mapRuntimePlayerIds:()=>[1,2],
  pressureWinLimit:()=>5,
  countControlledPS:()=>0,
  deckRecoveryConfig:()=>({cost:5,draw:3,missionOrdinaryDraw:4}),
  canRecoverDeck:()=>({ok:true,reason:"Pronto",cost:5,draw:3,missionOrdinaryDraw:4}),
  state:null
});

function load(rel) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), context, { filename:rel });
}

load("data/tutorial_scenarios.js");
load("src/tutorial_runtime.js");
load("src/build_info.js");

const evaluate = expression => vm.runInContext(expression, context);
const challenge = evaluate("tutorialRuntimeChallengeById('challenge-5-final-exam')");
const scenario = evaluate("tutorialRuntimeChallengeScenarioById('challenge-5-final-exam')");
if (!challenge || !scenario) throw new Error("Challenge 5 final exam missing");
if (challenge.scenarioId !== "challenge-5-final-exam" || challenge.contentStatus !== "available_f9v2f") throw new Error("Challenge 5 plan not published as F9V2f");
if (scenario.objective.kind !== "win_match") throw new Error(`Expected win_match objective, got ${scenario.objective.kind}`);
if (!scenario.rules.fullMatch) throw new Error("Challenge 5 must declare fullMatch");
if (scenario.setup.mapId !== "map1_starter" || scenario.setup.pacePreset !== "competitive") throw new Error("Final exam must use Campo Starter / Rapida");
if (scenario.setup.factions[1] !== "Exordium" || scenario.setup.factions[2] !== "Nexus") throw new Error("Final exam factions invalid");
if (scenario.setup.modes[1] !== "human" || scenario.setup.modes[2] !== "bot" || scenario.setup.aiMode !== "advanced") throw new Error("Final exam opponent contract invalid");
if (scenario.setup.selectedCommanders[1] !== "EX0B00" || scenario.setup.selectedCommanders[2] !== "NXCMD01") throw new Error("Final exam commander contract invalid");
if (scenario.initialUnits.length !== 0 || scenario.waves.length !== 0) throw new Error("Full match must not pre-deploy Challenge units/waves");
for (const forbidden of ["deckRecoveryDisabled","starterCardsDisabled","enemyCardsDisabled","enemyEnergyLocked","missionsDisabled","cardsDisabled","deckDisabled","fixedHand"]) {
  if (scenario.rules[forbidden]) throw new Error(`Full match unexpectedly enables restriction ${forbidden}`);
}
for (const forbidden of ["energy","hand","deck","discard","starterCardsEnabled","startingRound","pressure"]) {
  if (Object.prototype.hasOwnProperty.call(scenario.setup, forbidden)) throw new Error(`Full match setup must not override normal ${forbidden}`);
}

// Simulate the normal newGame/card initialization result. Challenge setup must preserve all ordinary zones/economy.
context.document = { getElementById:()=>null };
context.ARENA_APP_SCREENS = { GAME:"game", TUTORIAL:"tutorial" };
context.setAppScreen = ()=>{};
context.newGame = options => {
  const cards = (prefix,n) => Array.from({length:n},(_,i)=>({id:`${prefix}${i+1}`, countedInDeck:true}));
  context.state = {
    ...options,
    turn:1,
    pressure:{1:0,2:0},
    energy:{1:3,2:3},
    hand:{1:cards("P1H",5),2:cards("P2H",5)},
    deck:{1:cards("P1D",25),2:cards("P2D",25)},
    discard:{1:[],2:[]},
    starterCards:{
      1:{starter_infantry:{id:"EX1B01"},starter_vehicle:{id:"EX2B01"},starter_structure:{id:"EX4B02"}},
      2:{starter_infantry:{id:"NX2B01"},starter_vehicle:{id:"NX3B01"},starter_structure:{id:"NX4B03"}}
    },
    missions:{1:{id:"normal-mission-p1"},2:{id:"normal-mission-p2"}},
    missionPendingReward:null,
    units:[
      {uid:"hq1",side:1,type:"QG",alive:true,pos:[-6,0,6]},
      {uid:"hq2",side:2,type:"QG",alive:true,pos:[6,0,-6]}
    ],
    cardDebug:{initialized:true}
  };
};
context.__challenge = challenge;
context.__scenario = scenario;
if (!evaluate("tutorialRuntimeApplyChallengeSetup(__challenge,__scenario)")) throw new Error("Challenge 5 setup application failed");
const setup = evaluate(`({
  tutorialMode:state.tutorialMode,
  challengeMode:state.tutorialChallengeMode,
  challengeId:state.tutorialChallengeId,
  recorded:state.matchRecorded,
  autoResign:state.autoResignEnabled,
  p1Hand:state.hand[1].length,p1Deck:state.deck[1].length,p2Hand:state.hand[2].length,p2Deck:state.deck[2].length,
  p1Starter:Object.keys(state.starterCards[1]||{}).length,p2Starter:Object.keys(state.starterCards[2]||{}).length,
  ene1:state.energy[1],ene2:state.energy[2],turn:state.turn,
  mission1:state.missions[1]&&state.missions[1].id,mission2:state.missions[2]&&state.missions[2].id,
  units:state.units.length,recoveryDisabled:state.tutorialChallengeDeckRecoveryDisabled
})`);
if (!setup.tutorialMode || !setup.challengeMode || setup.challengeId !== "challenge-5-final-exam" || setup.recorded !== false) throw new Error(`Challenge exclusion flags invalid: ${JSON.stringify(setup)}`);
if (!setup.autoResign) throw new Error("Final exam must preserve normal auto-resign behavior");
if (setup.p1Hand !== 5 || setup.p1Deck !== 25 || setup.p2Hand !== 5 || setup.p2Deck !== 25) throw new Error(`Normal 30-card zones were modified: ${JSON.stringify(setup)}`);
if (setup.p1Starter !== 3 || setup.p2Starter !== 3 || setup.ene1 !== 3 || setup.ene2 !== 3 || setup.turn !== 1) throw new Error(`Normal Starter/economy/turn was modified: ${JSON.stringify(setup)}`);
if (setup.mission1 !== "normal-mission-p1" || setup.mission2 !== "normal-mission-p2") throw new Error(`Normal Mission state was modified: ${JSON.stringify(setup)}`);
if (setup.units !== 2) throw new Error(`Final exam must begin with HQs only, got ${setup.units} units`);
if (setup.recoveryDisabled) throw new Error("Deck recovery must remain normal in final exam");

// Even though the Challenge guard is installed globally, it must delegate to normal deck recovery for Challenge V.
evaluate("tutorialRuntimeChallengeInstallDeckRecoveryGuard()");
const recovery = evaluate("canRecoverDeck(1)");
if (!recovery.ok) throw new Error(`Normal deck recovery was blocked: ${JSON.stringify(recovery)}`);

// No pre-deployed units are required: full-match initialization must still succeed.
evaluate(`tutorialChallengeRuntimeState.active=true;
tutorialChallengeRuntimeState.challenge=__challenge;
tutorialChallengeRuntimeState.challengeId='challenge-5-final-exam';
tutorialChallengeRuntimeState.scenario=__scenario;
tutorialChallengeRuntimeState.completing=false;`);
if (!evaluate("tutorialRuntimeChallengeInitializeScenario()")) throw new Error("Full-match Challenge initialization rejected empty initialUnits");
if (!evaluate("tutorialRuntimeChallengeCheckPlayerSurvival(__scenario,'')")) throw new Error("Final exam must not apply custom all-units-destroyed failure");

// Card/pressure activity only refreshes HUD; it cannot complete the exam.
context.__completion = null;
evaluate("tutorialRuntimeChallengeSchedule = fn => { fn(); return null; }");
evaluate("tutorialRuntimeCompleteChallenge = options => { __completion=options; tutorialChallengeRuntimeState.active=false; return true; }");
evaluate("tutorialRuntimeHandleChallengeGameEvent({type:EventTypes.CARD_DRAWN,data:{player:1}})");
if (context.__completion) throw new Error("Final exam completed on ordinary card activity");

// Any legitimate core victory by the human passes the exam: prove QG victory path.
evaluate("tutorialRuntimeHandleChallengeGameEvent({type:EventTypes.VICTORY,data:{winner:1,winType:'qg'}})");
if (!context.__completion || context.__completion.success !== true || context.__completion.reason !== "match_victory") throw new Error(`Human core victory did not pass exam: ${JSON.stringify(context.__completion)}`);
if (!evaluate("tutorialChallengeRuntimeState.meta.matchWon") || evaluate("tutorialChallengeRuntimeState.meta.finalWinType") !== "qg") throw new Error("Final exam victory metadata invalid");

// Reset isolated runtime and prove that an enemy victory fails the exam.
context.__completion = null;
evaluate(`tutorialChallengeRuntimeState.active=true;
tutorialChallengeRuntimeState.completing=false;
tutorialChallengeRuntimeState.meta.matchWon=false;
tutorialChallengeRuntimeState.meta.finalWinType=null;`);
evaluate("tutorialRuntimeHandleChallengeGameEvent({type:EventTypes.VICTORY,data:{winner:2,winType:'pressione'}})");
if (!context.__completion || context.__completion.success !== false || context.__completion.reason !== "enemy_victory") throw new Error(`Enemy victory did not fail exam: ${JSON.stringify(context.__completion)}`);

if (evaluate("BUILD_INFO.version") !== "C2-STABLE-1-F9V3a-APK-M4c") throw new Error("BUILD_INFO version invalid");
if (evaluate("BUILD_INFO.buildChannel") !== "starter2-result-modal-v3a") throw new Error("BUILD_INFO channel invalid");

console.log(JSON.stringify({
  ok:true,
  challenge:"challenge-5-final-exam",
  player:"Exordium",
  opponent:"Nexus Advanced",
  map:"map1_starter",
  pace:"competitive",
  fullMatch:true,
  normalHandPerSide:5,
  normalDeckAfterOpeningHandPerSide:25,
  countedCardsPerSide:30,
  starterReservePreserved:true,
  normalEconomyPreserved:true,
  normalDeckRecoveryPreserved:true,
  noPredeployedChallengeUnits:true,
  anyCoreHumanVictoryPasses:true,
  enemyVictoryFails:true,
  competitiveRecordingExcluded:true,
  build:evaluate("BUILD_INFO.version")
}, null, 2));
