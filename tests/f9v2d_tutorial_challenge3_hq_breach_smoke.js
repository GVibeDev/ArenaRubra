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
    VICTORY:"VICTORY",
    LOG_MESSAGE:"LOG_MESSAGE"
  },
  renderAll:()=>{},
  syncCardDebugState:()=>{},
  resetInteractionContext:()=>{},
  eventOverlayEnqueue:()=>{},
  log:()=>{},
  mapRuntimePlayerIds:()=>[1,2],
  sameCoord:(a,b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value,index) => Number(value) === Number(b[index])),
  getHq:side => context.state && Array.isArray(context.state.units) ? context.state.units.find(unit => unit && unit.type === "QG" && Number(unit.side) === Number(side)) || null : null,
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
const scenario = evaluate("tutorialRuntimeChallengeScenarioById('challenge-3-hq-breach')");
if (!scenario) throw new Error("Challenge 3 scenario missing");
if (scenario.objective.kind !== "occupy_enemy_hq" || scenario.objective.targetSide !== 2) throw new Error("HQ objective invalid");
if (scenario.setup.hand[1].length !== 5) throw new Error(`Expected initial hand 5, got ${scenario.setup.hand[1].length}`);
if (scenario.setup.deck[1].length !== 10) throw new Error(`Expected reduced deck 10, got ${scenario.setup.deck[1].length}`);
if (scenario.setup.hand[2].length !== 0 || scenario.setup.deck[2].length !== 0) throw new Error("Nexus card zones must start empty");
if (!scenario.rules.deckRecoveryDisabled || !scenario.rules.starterCardsDisabled || !scenario.rules.enemyCardsDisabled || !scenario.rules.enemyEnergyLocked || !scenario.rules.missionsDisabled) {
  throw new Error("Challenge 3 restrictions incomplete");
}
if (scenario.initialUnits.length !== 3) throw new Error(`Expected 3 initial Exordium units, got ${scenario.initialUnits.length}`);
if (scenario.waves.length !== 1 || scenario.waves[0].units.length !== 4) throw new Error("Expected one Nexus defense line with 4 units");

const playerCardIds = [...scenario.setup.hand[1], ...scenario.setup.deck[1]];
if (playerCardIds.length !== 15 || new Set(playerCardIds).size !== 15) throw new Error("Challenge 3 hand/deck must contain 15 deterministic unique cards");
if (!playerCardIds.every(id => id.startsWith("UNIT:EX") || id.startsWith("TACTIC:EXTAC"))) throw new Error(`Non-Exordium card found: ${playerCardIds.join(",")}`);

// The generic Challenge setup must materialize the 5+10 card zones and remove Missions.
context.document = { getElementById:()=>null };
context.ARENA_APP_SCREENS = { GAME:"game", TUTORIAL:"tutorial" };
context.setAppScreen = ()=>{};
context.cardById = id => ({ id, name:id });
context.createCardInstance = (card, side, zone, index) => ({ id:card.id, side, zone, index });
context.newGame = options => {
  context.state = {
    ...options,
    energy:{1:3,2:3},
    hand:{1:[],2:[]},
    deck:{1:[],2:[]},
    discard:{1:[],2:[]},
    starterCards:{1:{starter_infantry:{id:"EX1B01"}},2:{starter_infantry:{id:"NX2B01"}}},
    missions:{1:{id:"mission-p1"},2:{id:"mission-p2"}},
    missionPendingReward:{pending:true}
  };
};
context.__challenge = evaluate("tutorialRuntimeChallengeById('challenge-3-hq-breach')");
context.__scenario = scenario;
if (!evaluate("tutorialRuntimeApplyChallengeSetup(__challenge,__scenario)")) throw new Error("Challenge 3 setup application failed");
const setupState = evaluate("({hand:state.hand[1].length,deck:state.deck[1].length,enemyHand:state.hand[2].length,enemyDeck:state.deck[2].length,enemyEnergy:state.energy[2],starter1:Object.keys(state.starterCards[1]||{}).length,starter2:Object.keys(state.starterCards[2]||{}).length,mission1:state.missions[1],mission2:state.missions[2],pending:state.missionPendingReward,recorded:state.matchRecorded})");
if (setupState.hand !== 5 || setupState.deck !== 10 || setupState.enemyHand !== 0 || setupState.enemyDeck !== 0 || setupState.enemyEnergy !== 0 || setupState.starter1 !== 0 || setupState.starter2 !== 0 || setupState.mission1 !== null || setupState.mission2 !== null || setupState.pending !== null || setupState.recorded !== false) {
  throw new Error(`Challenge 3 setup contract invalid: ${JSON.stringify(setupState)}`);
}

context.state = {
  tutorialChallengeMode:true,
  tutorialChallengeDeckRecoveryDisabled:true,
  units:[
    {uid:"hq1",side:1,type:"QG",alive:true,pos:[-6,0,6]},
    {uid:"hq2",side:2,type:"QG",alive:true,pos:[6,0,-6]},
    {uid:"p1",side:1,type:"Veicolo",alive:true,pos:[5,0,-5]},
    {uid:"e1",side:2,type:"Fanteria",alive:true,pos:[3,0,-3]}
  ],
  energy:{1:6,2:9},
  hand:{1:[{id:"h1"},{id:"h2"},{id:"h3"},{id:"h4"},{id:"h5"}],2:[{id:"enemy"}]},
  deck:{1:Array.from({length:10},(_,index)=>({id:`d${index}`})),2:[{id:"enemyDeck"}]},
  discard:{1:[],2:[]},
  starterCards:{1:{},2:{starter_infantry:{id:"NX2B01"}}},
  missions:{1:{id:"mission-p1"},2:{id:"mission-p2"}}
};
context.__scenario = scenario;
evaluate(`tutorialChallengeRuntimeState.active=true;
tutorialChallengeRuntimeState.challengeId='challenge-3-hq-breach';
tutorialChallengeRuntimeState.scenario=__scenario;
tutorialChallengeRuntimeState.meta={waveIndex:0,enemyDestroyed:0,enemiesSpawned:4,playerTurnsEnded:0,holdCount:0,hqOccupied:false,hqOccupantUid:null,targetHqCoord:[6,0,-6],playerUnitIds:new Set(['p1']),enemyUnitIds:new Set(['e1']),destroyedEnemyUnitIds:new Set(),startedWaves:new Set([0]),waveUnitIds:{0:new Set(['e1'])}};`);

// Enemy restrictions must not touch the player's real hand/deck.
evaluate("tutorialRuntimeChallengeApplyTurnRestrictions({type:EventTypes.TURN_STARTED,data:{player:2}})");
const restricted = evaluate("({enemyEnergy:state.energy[2], enemyHand:state.hand[2].length, enemyDeck:state.deck[2].length, enemyStarters:Object.keys(state.starterCards[2]||{}).length, playerHand:state.hand[1].length, playerDeck:state.deck[1].length})");
if (restricted.enemyEnergy !== 0 || restricted.enemyHand !== 0 || restricted.enemyDeck !== 0 || restricted.enemyStarters !== 0 || restricted.playerHand !== 5 || restricted.playerDeck !== 10) {
  throw new Error(`Enemy restriction invalid: ${JSON.stringify(restricted)}`);
}

// The reduced 10-card deck is finite: no deck recovery inside Breccia.
evaluate("tutorialRuntimeChallengeInstallDeckRecoveryGuard()");
const recovery = evaluate("canRecoverDeck(1)");
if (recovery.ok || !String(recovery.reason).includes("disabilitato")) throw new Error(`Deck recovery guard failed: ${JSON.stringify(recovery)}`);

// A normal move does not complete the Challenge.
context.__completion = null;
evaluate("tutorialRuntimeCompleteChallenge = options => { __completion=options; tutorialChallengeRuntimeState.active=false; return true; }");
evaluate("tutorialRuntimeChallengeHandleHqObjective({type:EventTypes.UNIT_MOVED,data:{player:1,unitId:'p1',to:[5,-1,-4]}})");
if (evaluate("tutorialChallengeRuntimeState.meta.hqOccupied") !== false || context.__completion) throw new Error("Non-HQ movement completed Challenge 3");

// Entering the enemy HQ cell is the authoritative Challenge objective, independent of PS control.
evaluate("tutorialRuntimeChallengeHandleHqObjective({type:EventTypes.UNIT_MOVED,data:{player:1,unitId:'p1',to:[6,0,-6]}})");
if (evaluate("tutorialChallengeRuntimeState.meta.hqOccupied") !== true) throw new Error("HQ occupation was not detected from UNIT_MOVED");
if (evaluate("tutorialChallengeRuntimeState.meta.hqOccupantUid") !== "p1") throw new Error("HQ occupant UID not tracked");

setTimeout(() => {
  const completion = context.__completion;
  if (!completion || completion.success !== true || completion.reason !== "enemy_hq_occupied") throw new Error(`Completion invalid: ${JSON.stringify(completion)}`);
  if (evaluate("BUILD_INFO.version") !== "C2-STABLE-1-F9V2f-APK-M4c") throw new Error("BUILD_INFO version invalid");
  console.log(JSON.stringify({
    ok:true,
    challenge:"challenge-3-hq-breach",
    initialUnits:scenario.initialUnits.length,
    initialHand:scenario.setup.hand[1].length,
    reducedDeck:scenario.setup.deck[1].length,
    nexusDefenders:scenario.waves[0].units.length,
    deckRecoveryDisabled:true,
    enemyCardsDisabled:true,
    missionsDisabled:true,
    objective:"occupy_enemy_hq",
    completion:completion.reason,
    build:evaluate("BUILD_INFO.version")
  }, null, 2));
}, 20);
