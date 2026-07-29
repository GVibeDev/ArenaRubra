"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(ROOT, "src/match_telemetry.js"), "utf8");
let passed = 0;
let failed = 0;
function ok(condition, label) {
  if (condition) { passed += 1; console.log(`PASS ${label}`); }
  else { failed += 1; console.error(`FAIL ${label}`); }
}

const EventTypes = {
  GAME_STARTED:"GAME_STARTED", TURN_ENDED:"TURN_ENDED", CARD_DRAWN:"CARD_DRAWN", CARD_PLAYED:"CARD_PLAYED",
  CARD_DISCARDED:"CARD_DISCARDED", CARD_STOLEN:"CARD_STOLEN", CARD_BLOCKED:"CARD_BLOCKED",
  DECK_EXHAUSTED:"DECK_EXHAUSTED", DECK_RECOVERED:"DECK_RECOVERED", UNIT_SPAWNED:"UNIT_SPAWNED",
  UNIT_BUILT:"UNIT_BUILT", TACTIC_USED:"TACTIC_USED", ABILITY_USED:"ABILITY_USED", UNIT_ATTACKED:"UNIT_ATTACKED",
  UNIT_MOVED:"UNIT_MOVED", UNIT_DAMAGED:"UNIT_DAMAGED", UNIT_DESTROYED:"UNIT_DESTROYED",
  ECONOMY_CHANGED:"ECONOMY_CHANGED", PS_CONTROL_CHANGED:"PS_CONTROL_CHANGED", PRESSURE_CHANGED:"PRESSURE_CHANGED",
  MISSION_PROGRESS_CHANGED:"MISSION_PROGRESS_CHANGED", MISSION_READY:"MISSION_READY", MISSION_PLAYED:"MISSION_PLAYED",
  MISSION_REWARD_RESOLVED:"MISSION_REWARD_RESOLVED", PLAYER_ELIMINATED:"PLAYER_ELIMINATED", VICTORY:"VICTORY"
};

const pivotCard1 = { id:"NXPIV01", blueprintId:"NXPIV01", sourceType:"unit", deckRole:"pivot", name:"Fortezza Mobile", cost:5 };
const pivotCard2 = { id:"EXPIV02", blueprintId:"EXPIV02", sourceType:"unit", deckRole:"pivot", name:"Mech d'Assalto", cost:5 };
const state = {
  matchId:"smoke-f9q3e1a", matchSeed:"seed", matchRngCalls:0, matchRngState:1,
  turn:1, currentPlayer:1, turnOrder:[1,2], factions:{1:"Nexus",2:"Exordium"}, modes:{1:"bot",2:"bot"},
  selectedDecks:{1:{mode:"template"},2:{mode:"template"}}, selectedCommanders:{1:"NXCMD01",2:"EXCMD01"},
  hand:{1:[pivotCard1],2:[pivotCard2]}, deck:{1:[],2:[]}, discard:{1:[],2:[]}, energy:{1:3,2:3}, pressure:{1:0,2:0},
  units:[], cells:[], mapId:"map1", mapDefinition:{name:"Smoke",schemaVersion:1,movementMultiplier:1,metadata:{revision:1}},
  mapRuntime:{terrainUsage:{}}, pacePreset:"standard", gameScaleMode:"tactical", aiMode:"bot-vs-bot",
  tutorialMode:false, mapLabMode:false
};

const sandbox = {
  console, Date, Math, JSON, Number, String, Object, Array, Set, Map,
  performance:{now:() => 100}, state, EventTypes,
  mapRuntimePlayerIds:() => [1,2],
  buildInfoExportMeta:() => ({version:"C2-STABLE-1-F9Q3e1a-APK-M4c"}),
  countControlledPS:() => 0,
  combatUnits:(side) => state.units.filter(unit => unit.side === side && unit.alive !== false)
};
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__api={initializeMatchTelemetry,updateMatchTelemetryFromEvent,finalizeMatchTelemetry,currentMatchTelemetrySnapshot};`, sandbox, {filename:"match_telemetry.js"});
const api = sandbox.__api;
const emit = (type, data, seq=1) => api.updateMatchTelemetryFromEvent({type,data,seq});
api.initializeMatchTelemetry();

ok(state.matchTelemetry.schemaVersion === "F9Q3e1-2", "schema hotfix is F9Q3e1-2");
ok(state.matchTelemetry.metricAuthority.cards.includes("players[*].cards"), "main telemetry explicitly declares authoritative card counters");

// PS attribution: no synthetic side 0 and symmetric gain/loss accounting.
emit(EventTypes.PS_CONTROL_CHANGED,{coord:[0,0,0],previousControl:null,nextControl:1,round:2},1);
emit(EventTypes.PS_CONTROL_CHANGED,{coord:[1,-1,0],previousControl:null,nextControl:2,round:2},2);
emit(EventTypes.PS_CONTROL_CHANGED,{coord:[0,0,0],previousControl:1,nextControl:null,round:3},3);
emit(EventTypes.PS_CONTROL_CHANGED,{coord:[1,-1,0],previousControl:2,nextControl:1,round:4},4);
ok(!Object.prototype.hasOwnProperty.call(state.matchTelemetry.players,"0"), "neutral PS control never creates player side 0");
ok(state.matchTelemetry.players[1].field.psControlChanges === 3, "Nexus receives gain/loss/transfer PS changes");
ok(state.matchTelemetry.players[1].field.psGained === 2 && state.matchTelemetry.players[1].field.psLost === 1, "Nexus PS gains and losses are separated");
ok(state.matchTelemetry.players[2].field.psControlChanges === 2, "Exordium receives gain and transfer-loss changes");
ok(state.matchTelemetry.players[2].field.psGained === 1 && state.matchTelemetry.players[2].field.psLost === 1, "Exordium PS gains and losses are separated");
ok(state.matchTelemetry.timelines.psControl.length === 4, "PS timeline is persisted in main telemetry");

// First Pivot instance.
state.turn = 21;
const pivot1 = {uid:"NXPIV01_1_1",id:"NXPIV01",instanceNo:1,name:"Fortezza Mobile",side:1,alive:true};
state.units.push(pivot1);
emit(EventTypes.UNIT_SPAWNED,{player:1,unitId:pivot1.uid,unitName:pivot1.name,blueprintId:pivot1.id,instanceNo:1,cost:5,spawnSource:"deck"},10);
emit(EventTypes.UNIT_ATTACKED,{attackerSide:1,attackerId:pivot1.uid,defenderSide:2,defenderId:"target"},11);
emit(EventTypes.ABILITY_USED,{player:1,unitId:pivot1.uid,cost:2},12);
emit(EventTypes.UNIT_DAMAGED,{sourceSide:1,sourceUnitId:pivot1.uid,targetSide:2,defLoss:2,hpLoss:1},13);
emit(EventTypes.UNIT_DESTROYED,{side:1,unitId:pivot1.uid,unitName:pivot1.name,killerSide:2,source:"smoke"},14);
pivot1.alive = false;

// Second Pivot instance of the same blueprint.
state.turn = 23;
const pivot2 = {uid:"NXPIV01_1_2",id:"NXPIV01",instanceNo:2,name:"Fortezza Mobile",side:1,alive:true};
state.units.push(pivot2);
emit(EventTypes.UNIT_SPAWNED,{player:1,unitId:pivot2.uid,unitName:pivot2.name,blueprintId:pivot2.id,instanceNo:2,cost:5,spawnSource:"deck_recovery"},15);
emit(EventTypes.UNIT_ATTACKED,{attackerSide:1,attackerId:pivot2.uid,defenderSide:2,defenderId:"target2"},16);
emit(EventTypes.UNIT_DAMAGED,{sourceSide:1,sourceUnitId:pivot2.uid,targetSide:2,defLoss:0,hpLoss:4},17);

const field = state.matchTelemetry.players[1].field;
ok(field.pivotInstances.length === 2 && field.pivotInstanceCount === 2, "two Pivot deployments create two distinct instances");
ok(field.pivotInstances[0].destroyedRound === 21 && field.pivotInstances[0].status === "destroyed", "first Pivot destruction is attributed by unit UID");
ok(field.pivotInstances[1].destroyedRound === null && field.pivotInstances[1].status === "active", "second Pivot remains independently active");
ok(field.pivotDestroyedRound === 21 && field.pivotDestroyedCount === 1 && field.pivotActiveCount === 1, "compatibility aggregate reports last destruction and active count");
ok(field.pivotAttacks === 2 && field.pivotAbilitiesUsed === 1, "Pivot attacks and abilities aggregate across instances");
ok(field.pivotDamageDealt === 7, "Pivot damage aggregates by source unit UID across instances");
ok(state.matchTelemetry.timelines.pivots.filter(item => item.event === "deployed").length === 2, "Pivot timeline contains both deployments");
ok(state.matchTelemetry.timelines.pivots.filter(item => item.event === "destroyed").length === 1, "Pivot timeline contains the first destruction");

// Overdraw must be counted only once despite CARD_DRAWN + CARD_DISCARDED.
state.turn = 24;
emit(EventTypes.CARD_DRAWN,{player:2,count:1,cards:[{id:"EXTST01",cardUid:"testudo-1",name:"Testudo",overdrawDiscarded:true}]},20);
emit(EventTypes.CARD_DISCARDED,{player:2,cardId:"EXTST01",cardUid:"testudo-1",cardName:"Testudo",reason:"overdraw"},21);
ok(state.matchTelemetry.players[2].cards.overdrawn === 1, "normal overdraw is counted exactly once");
ok(state.matchTelemetry.players[2].cards.byCard.EXTST01.overdrawn === 1, "per-card overdraw is counted exactly once");

// A stolen card sent directly to discard is still one overdraw event.
emit(EventTypes.CARD_STOLEN,{fromSide:1,toSide:2,cardId:"NXTST01",cardUid:"stolen-1",cardName:"Tattica",destination:"discard",overdrawDiscarded:true},22);
ok(state.matchTelemetry.players[2].cards.overdrawn === 2, "stolen card overdraw is counted from CARD_STOLEN destination");

// Unattributed cosmetic damage event must not recreate side 0.
emit(EventTypes.UNIT_DAMAGED,{targetId:"target",modifier:"Sentenza Porpora",extraDamage:1},23);
ok(!Object.prototype.hasOwnProperty.call(state.matchTelemetry.players,"0"), "unattributed events never create player side 0");

state.turn = 26;
api.finalizeMatchTelemetry({winner:1,round:26,winType:"smoke"});
ok(field.pivotSurvivalRounds === 5, "aggregate Pivot survival sums destroyed and still-active instances");
ok(field.pivotInstances[0].survivalRounds === 1, "destroyed Pivot keeps its own survival duration");
ok(field.pivotInstances[1].survivalRounds === null, "active Pivot instance remains open in its instance record");

console.log(JSON.stringify({passed,failed,total:passed+failed},null,2));
if (failed) process.exit(1);
