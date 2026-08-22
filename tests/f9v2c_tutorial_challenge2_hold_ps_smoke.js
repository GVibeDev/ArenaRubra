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
    UNIT_DESTROYED:"UNIT_DESTROYED",
    VICTORY:"VICTORY",
    LOG_MESSAGE:"LOG_MESSAGE"
  },
  renderAll:()=>{},
  syncCardDebugState:()=>{},
  resetInteractionContext:()=>{},
  eventOverlayEnqueue:()=>{},
  log:()=>{},
  getCellAt:coord => context.state.cells.find(cell => cell.coord.join(",") === coord.join(",")) || null,
  mapRuntimePlayerIds:()=>[1,2],
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
const scenario = evaluate("tutorialRuntimeChallengeScenarioById('challenge-2-hold-ps')");
if (!scenario) throw new Error("Challenge 2 scenario missing");
if (scenario.objective.kind !== "hold_ps" || scenario.objective.target !== 3) throw new Error("Hold objective invalid");
if (scenario.setup.hand[1].length !== 5) throw new Error(`Expected fixed hand 5, got ${scenario.setup.hand[1].length}`);
if (scenario.setup.deck[1].length !== 0 || scenario.setup.deck[2].length !== 0) throw new Error("Challenge 2 deck must be empty");
if (!scenario.rules.deckRecoveryDisabled || !scenario.rules.enemyCardsDisabled || !scenario.rules.enemyEnergyLocked) throw new Error("Challenge 2 restrictions incomplete");
if (scenario.waves.length !== 3 || scenario.waves.some(wave => wave.units.length !== 2)) throw new Error("Expected 3 waves of 2");
const enemyIds = scenario.waves.flatMap(wave => wave.units.map(unit => unit.blueprintId));
if (!enemyIds.every(id => ["EX1B01","EXC1F04"].includes(id))) throw new Error(`Non-Starter Exordium unit in waves: ${enemyIds.join(",")}`);

context.state = {
  tutorialChallengeMode:true,
  tutorialChallengeDeckRecoveryDisabled:true,
  cells:[{coord:[0,0,0], ps:true, control:1}],
  units:[{uid:"p1",side:1,alive:true,type:"Fanteria"},{uid:"e1",side:2,alive:true,type:"Fanteria"}],
  energy:{1:12,2:9},
  hand:{1:[{id:"fixed"}],2:[{id:"enemy"}]},
  deck:{1:[],2:[{id:"enemyDeck"}]},
  discard:{1:[],2:[]},
  starterCards:{1:{},2:{starter_infantry:{id:"EX1B01"}}}
};
context.__scenario = scenario;
evaluate(`tutorialChallengeRuntimeState.active=true;
tutorialChallengeRuntimeState.challengeId='challenge-2-hold-ps';
tutorialChallengeRuntimeState.scenario=__scenario;
tutorialChallengeRuntimeState.meta={waveIndex:2,enemyDestroyed:0,enemiesSpawned:6,playerTurnsEnded:0,holdCount:0,playerUnitIds:new Set(['p1']),enemyUnitIds:new Set(['e1']),destroyedEnemyUnitIds:new Set(),startedWaves:new Set([0,1,2]),waveUnitIds:{}};`);

// Enemy restrictions do not wipe the player's fixed hand.
evaluate("tutorialRuntimeChallengeApplyTurnRestrictions({type:EventTypes.TURN_STARTED,data:{player:2}})");
const restricted = evaluate("({enemyEnergy:state.energy[2], enemyHand:state.hand[2].length, enemyDeck:state.deck[2].length, enemyStarters:Object.keys(state.starterCards[2]||{}).length, playerHand:state.hand[1].length})");
if (restricted.enemyEnergy !== 0 || restricted.enemyHand !== 0 || restricted.enemyDeck !== 0 || restricted.enemyStarters !== 0 || restricted.playerHand !== 1) {
  throw new Error(`Enemy restriction invalid: ${JSON.stringify(restricted)}`);
}

// Deck recovery is authoritatively disabled for this challenge.
evaluate("tutorialRuntimeChallengeInstallDeckRecoveryGuard()");
const recovery = evaluate("canRecoverDeck(1)");
if (recovery.ok || !String(recovery.reason).includes("disabilitato")) throw new Error(`Deck recovery guard failed: ${JSON.stringify(recovery)}`);

// Two valid holds accumulate, loss during enemy turn resets at next player turn.
evaluate("tutorialRuntimeChallengeHandleHoldObjective({type:EventTypes.TURN_ENDED,data:{player:1}})");
evaluate("tutorialRuntimeChallengeHandleHoldObjective({type:EventTypes.TURN_ENDED,data:{player:1}})");
if (evaluate("tutorialChallengeRuntimeState.meta.holdCount") !== 2) throw new Error("Hold did not reach 2/3");
context.state.cells[0].control = 2;
evaluate("tutorialRuntimeChallengeHandleHoldObjective({type:EventTypes.TURN_STARTED,data:{player:1}})");
if (evaluate("tutorialChallengeRuntimeState.meta.holdCount") !== 0) throw new Error("Hold counter did not reset after PS loss");

// Three consecutive valid holds complete the challenge.
context.state.cells[0].control = 1;
context.__completion = null;
evaluate("tutorialRuntimeCompleteChallenge = options => { __completion=options; tutorialChallengeRuntimeState.active=false; return true; }");
evaluate("tutorialRuntimeChallengeHandleHoldObjective({type:EventTypes.TURN_ENDED,data:{player:1}})");
evaluate("tutorialRuntimeChallengeHandleHoldObjective({type:EventTypes.TURN_ENDED,data:{player:1}})");
evaluate("tutorialRuntimeChallengeHandleHoldObjective({type:EventTypes.TURN_ENDED,data:{player:1}})");

setTimeout(() => {
  const completion = context.__completion;
  if (!completion || completion.success !== true || completion.reason !== "central_ps_held_three_turns") throw new Error(`Completion invalid: ${JSON.stringify(completion)}`);
  if (evaluate("BUILD_INFO.version") !== "C2-STABLE-1-F9V2d-APK-M4c") throw new Error("BUILD_INFO version invalid");
  console.log(JSON.stringify({
    ok:true,
    challenge:"challenge-2-hold-ps",
    fixedHand:scenario.setup.hand[1].length,
    deckSize:scenario.setup.deck[1].length,
    waves:scenario.waves.length,
    enemies:enemyIds.length,
    holdTarget:scenario.objective.target,
    resetOnLoss:true,
    deckRecoveryDisabled:true,
    enemyCardsDisabled:true,
    completion:completion.reason,
    build:evaluate("BUILD_INFO.version")
  }, null, 2));
}, 20);
