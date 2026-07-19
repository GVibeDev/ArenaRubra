"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const events = [];
const logs = [];
const context = {
  console, Object, Array, Number, Boolean, Math, Set, Map, Date,
  state:null, botRunning:false,
  EventTypes:{
    LOG_MESSAGE:"LOG_MESSAGE", CARD_DRAWN:"CARD_DRAWN", DECK_RECOVERED:"DECK_RECOVERED",
    MISSION_PROGRESS_CHANGED:"MISSION_PROGRESS_CHANGED", MISSION_READY:"MISSION_READY", MISSION_CHECKPOINT:"MISSION_CHECKPOINT",
    MISSION_CYCLE_RESET:"MISSION_CYCLE_RESET", MISSION_RECOVERY_LOCKED:"MISSION_RECOVERY_LOCKED", MISSION_UNLOCKED:"MISSION_UNLOCKED",
    MISSION_PLAYED:"MISSION_PLAYED", MISSION_REWARD_PENDING:"MISSION_REWARD_PENDING", MISSION_REWARD_RESOLVED:"MISSION_REWARD_RESOLVED",
    ECONOMY_CHANGED:"ECONOMY_CHANGED", CARD_DISCARDED:"CARD_DISCARDED"
  },
  log(message){ logs.push(String(message)); },
  emitGameEvent(event){ events.push(event); return event; },
  playerName(side){ return `G${side}`; },
  enemyOf(side){ return side === 1 ? 2 : 1; },
  countControlledPS(){ return 0; },
  getHq(side){ return { side, pos:side === 1 ? [-6,0,6] : [6,0,-6] }; },
  hexDistance(a,b){ return Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2])); },
  areAdjacent(a,b){ return context.hexDistance(a,b) === 1; },
  renderAll(){}, maybeRunBot(){}, missionUiCancelSelection(){}, missionUiOpenPanel(){},
  combatUnits(){ return []; }, activeCombatUnits(){ return []; },
  getCellAt(){ return null; }, isOnPS(){ return false; },
  copyText(){}, navigator:undefined, document:undefined
};
vm.createContext(context);
for (const relative of [
  "data/missions_base.js", "data/cards_base.js", "src/deck.js", "src/missions.js", "src/mission_rewards.js"
]) vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, { filename:relative });

function missionCard(zone="discard") {
  return { id:"MISSION:NXMSN01", sourceId:"NXMSN01", missionId:"NXMSN01", name:"Civiltà Algoritmica", faction:"Nexus", sourceType:"mission", cardType:"mission", deckRole:"mission", cardUid:"mission-1", zone, missionPlayed:true, missionPlayedAt:"old" };
}
function ordinary(index, zone="discard") {
  return { id:`UNIT:NX${index}`, sourceId:`NX${index}`, name:`Carta ${index}`, faction:"Nexus", sourceType:"unit", cardType:"unit", deckRole:"base", blueprintId:`NX${index}`, cardUid:`ordinary-${index}`, zone, countedInDeck:true };
}
function telemetry(){
  return {
    cyclesStarted:{1:1,2:0}, recoveriesWithMission:{1:0,2:0}, recoveriesWithoutMission:{1:0,2:0}, missionLocksApplied:{1:0,2:0}, missionUnlocks:{1:0,2:0},
    missionsReady:{1:0,2:0}, missionsPlayed:{1:0,2:0}, secondOrLaterPlays:{1:0,2:0}, rewardsResolved:{1:0,2:0}, aiMissionPlays:{1:0,2:0}, aiMissionWaits:{1:0,2:0}, targetQuotasWasted:{1:0,2:0}, lastAiDecision:{1:null,2:null}, byMission:{}
  };
}

context.state = {
  factions:{1:"Nexus",2:"Fabeot"}, modes:{1:"human",2:"bot"}, currentPlayer:1, winner:null, turn:8,
  energy:{1:10,2:5}, turnsStarted:{1:4,2:4}, pressure:{1:0,2:0},
  cells:[], units:[], deck:{1:[],2:[]}, hand:{1:[],2:[]}, discard:{1:[missionCard(), ...Array.from({length:8},(_,i)=>ordinary(i+1))],2:[]},
  missions:{1:null,2:null}, missionRewards:{1:{cardCostSequence:null},2:{cardCostSequence:null}}, missionPendingReward:null, missionTelemetry:telemetry(),
  aiTelemetry:{deckRecoveries:{1:0,2:0}}, cardDebug:null, eventSeq:0, events:[]
};
context.state.missions[1] = vm.runInContext("createMissionRuntime(1, missionDefinitionById('NXMSN01'))", context);
context.state.missions[1].played = true;
context.state.missions[1].cycle = 1;
context.state.missions[1].counters.structuresBuiltNearObjective = 4;

assert.equal(vm.runInContext("canRecoverDeck(1).ok", context), true);
const recovery = vm.runInContext("recoverDeckForPlayer(1, {skipRender:true,skipBot:true})", context);
assert.equal(recovery.ok, true);
assert.equal(context.state.energy[1], 5, "costo recupero 5 ENE");
assert.equal(context.state.hand[1].length, 5, "Missione + 4 carte");
assert.equal(context.state.hand[1].filter(c => c.sourceType === "mission").length, 1);
assert.equal(context.state.hand[1].filter(c => c.sourceType !== "mission").length, 4);
assert.equal(context.state.deck[1].length, 4);
assert.equal(context.state.discard[1].length, 0);
assert.equal(context.state.missions[1].cycle, 2);
assert.equal(context.state.missions[1].played, false);
assert.equal(context.state.missions[1].counters.structuresBuiltNearObjective, 0, "contatori azzerati");
assert.equal(vm.runInContext("missionIsRecoveryLocked(1)", context), true);
assert.equal(context.state.missions[1].unlockAtOwnerTurnStarted, 5);
assert.equal(context.state.missionTelemetry.recoveriesWithMission[1], 1);
assert.ok(events.some(event => event.type === "MISSION_CYCLE_RESET"));
assert.ok(events.some(event => event.type === "MISSION_RECOVERY_LOCKED"));
assert.ok(events.some(event => event.type === "DECK_RECOVERED"));

context.state.turnsStarted[1] = 5;
vm.runInContext("missionCheckpointTurnStart(1)", context);
assert.equal(vm.runInContext("missionIsRecoveryLocked(1)", context), false, "sblocco al turno personale successivo");
assert.equal(context.state.missionTelemetry.missionUnlocks[1], 1);

for (const entry of Object.values(context.state.missions[1].entries)) entry.completed = true;
context.state.missions[1].ready = true;
assert.equal(vm.runInContext("missionPlayOrdinary(1)", context), true, "Missione giocabile nel secondo ciclo");
assert.equal(context.state.missions[1].played, true);
assert.equal(context.state.missions[1].rewardResolved, true);
assert.equal(context.state.missionTelemetry.secondOrLaterPlays[1], 1);
assert.equal(context.state.hand[1].some(card => card.sourceType === "mission"), false);
assert.equal(context.state.discard[1].some(card => card.sourceType === "mission"), true);

// Regressione: senza Missione il recupero storico pesca 3 carte.
context.state.energy[1] = 10;
context.state.deck[1] = [];
context.state.hand[1] = [];
context.state.discard[1] = Array.from({length:6},(_,i)=>ordinary(i+20));
context.state.missions[1] = vm.runInContext("createMissionRuntime(1, null)", context);
const noMissionRecovery = vm.runInContext("recoverDeckForPlayer(1, {skipRender:true,skipBot:true})", context);
assert.equal(noMissionRecovery.ok, true);
assert.equal(context.state.hand[1].length, 3);
assert.equal(context.state.deck[1].length, 3);
assert.equal(context.state.missionTelemetry.recoveriesWithoutMission[1], 1);

console.log("F9N10 recovery/cycle smoke: Missione+4, lock/unlock, secondo completamento e recupero legacy OK");
