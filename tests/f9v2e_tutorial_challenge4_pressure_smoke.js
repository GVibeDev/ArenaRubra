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
  countControlledPS:side => Number(side) === 1 ? 2 : 1,
  sameCoord:(a,b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value,index) => Number(value) === Number(b[index])),
  getCellAt:coord => ({ coord:[...coord], ps:true, control:1 }),
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
const scenario = evaluate("tutorialRuntimeChallengeScenarioById('challenge-4-pressure')");
if (!scenario) throw new Error("Challenge 4 scenario missing");
if (scenario.objective.kind !== "win_by_pressure" || scenario.objective.target !== 5) throw new Error("Pressure objective invalid");
if (scenario.objective.requiredPs !== 2 || scenario.objective.totalPs !== 3) throw new Error("Pressure qualification contract invalid");
if (scenario.setup.startingRound !== 20) throw new Error(`Expected starting round 20, got ${scenario.setup.startingRound}`);
if (scenario.setup.hand[1].length !== 5) throw new Error(`Expected initial hand 5, got ${scenario.setup.hand[1].length}`);
if (scenario.setup.deck[1].length !== 20) throw new Error(`Expected reduced deck 20, got ${scenario.setup.deck[1].length}`);
if (!scenario.rules.deckRecoveryDisabled || !scenario.rules.starterCardsDisabled || !scenario.rules.enemyCardsDisabled || !scenario.rules.missionsDisabled) throw new Error("Challenge 4 restrictions incomplete");
if (scenario.initialUnits.length !== 4) throw new Error(`Expected 4 initial Agathoi units, got ${scenario.initialUnits.length}`);
if (scenario.waves.length !== 1 || scenario.waves[0].units.length !== 4) throw new Error("Expected one Exordium opposition line with 4 units");

const playerCardIds = [...scenario.setup.hand[1], ...scenario.setup.deck[1]];
if (playerCardIds.length !== 25) throw new Error(`Expected 25 player cards, got ${playerCardIds.length}`);
if (!playerCardIds.every(id => id.startsWith("UNIT:AG") || id.startsWith("TACTIC:AGTAC"))) throw new Error(`Non-Agathoi card found: ${playerCardIds.join(",")}`);
const counts = playerCardIds.reduce((out,id) => (out[id]=(out[id]||0)+1,out),{});
if (Math.max(...Object.values(counts)) > 2) throw new Error(`Challenge 4 card copy rule exceeded: ${JSON.stringify(counts)}`);

// The generic Challenge setup must start at R20, materialize 5+20 cards, remove Missions/Starter reserve,
// preserve the Bot's ENE and keep the Pressure counters explicit.
context.document = { getElementById:()=>null };
context.ARENA_APP_SCREENS = { GAME:"game", TUTORIAL:"tutorial" };
context.setAppScreen = ()=>{};
context.cardById = id => ({ id, name:id });
context.createCardInstance = (card, side, zone, index) => ({ id:card.id, side, zone, index });
context.newGame = options => {
  context.state = {
    ...options,
    turn:1,
    pressure:{1:0,2:0},
    energy:{1:3,2:3},
    hand:{1:[],2:[{id:"enemyHand"}]},
    deck:{1:[],2:[{id:"enemyDeck"}]},
    discard:{1:[],2:[]},
    starterCards:{1:{starter_infantry:{id:"AG1B01"}},2:{starter_infantry:{id:"EX1B01"}}},
    missions:{1:{id:"mission-p1"},2:{id:"mission-p2"}},
    missionPendingReward:{pending:true}
  };
};
context.__challenge = evaluate("tutorialRuntimeChallengeById('challenge-4-pressure')");
context.__scenario = scenario;
if (!evaluate("tutorialRuntimeApplyChallengeSetup(__challenge,__scenario)")) throw new Error("Challenge 4 setup application failed");
const setupState = evaluate("({turn:state.turn,p1:state.pressure[1],p2:state.pressure[2],hand:state.hand[1].length,deck:state.deck[1].length,enemyHand:state.hand[2].length,enemyDeck:state.deck[2].length,energy1:state.energy[1],energy2:state.energy[2],starter1:Object.keys(state.starterCards[1]||{}).length,starter2:Object.keys(state.starterCards[2]||{}).length,mission1:state.missions[1],mission2:state.missions[2],pending:state.missionPendingReward,recorded:state.matchRecorded})");
if (setupState.turn !== 20 || setupState.p1 !== 0 || setupState.p2 !== 0 || setupState.hand !== 5 || setupState.deck !== 20 || setupState.enemyHand !== 0 || setupState.enemyDeck !== 0 || setupState.energy1 !== 10 || setupState.energy2 !== 8 || setupState.starter1 !== 0 || setupState.starter2 !== 0 || setupState.mission1 !== null || setupState.mission2 !== null || setupState.pending !== null || setupState.recorded !== false) {
  throw new Error(`Challenge 4 setup contract invalid: ${JSON.stringify(setupState)}`);
}

// Enemy cards stay disabled, but enemy ENE is intentionally NOT locked: the fixed Exordium units may use abilities.
context.state.hand[2] = [{id:"shouldClear"}];
context.state.deck[2] = [{id:"shouldClear"}];
context.state.starterCards[2] = { starter_infantry:{id:"EX1B01"} };
evaluate(`tutorialChallengeRuntimeState.active=true;
tutorialChallengeRuntimeState.challengeId='challenge-4-pressure';
tutorialChallengeRuntimeState.scenario=__scenario;
tutorialChallengeRuntimeState.meta={waveIndex:0,enemyDestroyed:0,enemiesSpawned:4,playerTurnsEnded:0,holdCount:0,hqOccupied:false,hqOccupantUid:null,targetHqCoord:null,pressureWon:false,pressureValue:0,pressureTarget:5,playerUnitIds:new Set(),enemyUnitIds:new Set(),destroyedEnemyUnitIds:new Set(),startedWaves:new Set([0]),waveUnitIds:{}};`);
evaluate("tutorialRuntimeChallengeApplyTurnRestrictions({type:EventTypes.TURN_STARTED,data:{player:2}})");
const restricted = evaluate("({energy:state.energy[2],enemyHand:state.hand[2].length,enemyDeck:state.deck[2].length,enemyStarters:Object.keys(state.starterCards[2]||{}).length,playerHand:state.hand[1].length,playerDeck:state.deck[1].length})");
if (restricted.energy !== 8 || restricted.enemyHand !== 0 || restricted.enemyDeck !== 0 || restricted.enemyStarters !== 0 || restricted.playerHand !== 5 || restricted.playerDeck !== 20) throw new Error(`Enemy restriction invalid: ${JSON.stringify(restricted)}`);

// The 20-card deck is finite.
evaluate("tutorialRuntimeChallengeInstallDeckRecoveryGuard()");
const recovery = evaluate("canRecoverDeck(1)");
if (recovery.ok || !String(recovery.reason).includes("disabilitato")) throw new Error(`Deck recovery guard failed: ${JSON.stringify(recovery)}`);

// PRESSURE_CHANGED updates Challenge progress but is not itself enough: completion waits for the core VICTORY/pressione event.
// For this isolated VM smoke, scheduling is made synchronous so both the wrong-victory and success paths can be asserted deterministically.
context.__completion = null;
evaluate("tutorialRuntimeChallengeSchedule = fn => { fn(); return null; }");
evaluate("tutorialRuntimeCompleteChallenge = options => { __completion=options; tutorialChallengeRuntimeState.active=false; return true; }");
context.state.pressure[1] = 1;
evaluate("tutorialRuntimeHandleChallengeGameEvent({type:EventTypes.PRESSURE_CHANGED,data:{player:1,current:1,limit:5}})");
if (evaluate("tutorialChallengeRuntimeState.meta.pressureValue") !== 1 || context.__completion) throw new Error("Pressure increment handling invalid");
context.state.pressure[1] = 5;
evaluate("tutorialRuntimeHandleChallengeGameEvent({type:EventTypes.PRESSURE_CHANGED,data:{player:1,current:5,limit:5}})");
if (context.__completion) throw new Error("Challenge 4 completed before core victory event");

// A player victory obtained by another core condition must fail this Challenge.
evaluate("tutorialRuntimeHandleChallengeGameEvent({type:EventTypes.VICTORY,data:{winner:1,winType:'qg'}})");
if (!context.__completion || context.__completion.success !== false || context.__completion.reason !== "wrong_victory_condition") {
  throw new Error(`Wrong-victory rejection invalid: ${JSON.stringify(context.__completion)}`);
}

// Reset only the isolated Challenge flags and prove that the actual core Pressure victory is authoritative.
context.__completion = null;
evaluate("tutorialChallengeRuntimeState.active=true; tutorialChallengeRuntimeState.completing=false; tutorialChallengeRuntimeState.meta.pressureWon=false;");
evaluate("tutorialRuntimeHandleChallengeGameEvent({type:EventTypes.VICTORY,data:{winner:1,winType:'pressione'}})");
const completion = context.__completion;
if (!completion || completion.success !== true || completion.reason !== "pressure_victory") throw new Error(`Completion invalid: ${JSON.stringify(completion)}`);
if (evaluate("tutorialChallengeRuntimeState.meta.pressureWon") !== true) throw new Error("Pressure victory flag not tracked");
if (evaluate("BUILD_INFO.version") !== "C2-STABLE-1-F9V3b-APK-M4c") throw new Error("BUILD_INFO version invalid");
console.log(JSON.stringify({
  ok:true,
  challenge:"challenge-4-pressure",
  faction:"Agathoi",
  opponent:"Exordium Advanced",
  startingRound:scenario.setup.startingRound,
  initialUnits:scenario.initialUnits.length,
  initialHand:scenario.setup.hand[1].length,
  reducedDeck:scenario.setup.deck[1].length,
  pressureTarget:scenario.objective.target,
  requiredPs:scenario.objective.requiredPs,
  centralRequired:true,
  enemyEnergyLocked:false,
  deckRecoveryDisabled:true,
  missionsDisabled:true,
  wrongVictoryRejected:true,
  completion:completion.reason,
  build:evaluate("BUILD_INFO.version")
}, null, 2));
