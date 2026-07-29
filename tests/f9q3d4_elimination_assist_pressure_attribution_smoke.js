"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
let checks = 0;
const ok = (value, label) => { assert.ok(value, label); checks += 1; };
const eq = (actual, expected, label) => { assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected, label); checks += 1; };

// ---------------------------------------------------------------------------
// Attribution engine: damage provenance, unit kill, assist, player elimination.
// ---------------------------------------------------------------------------
const ctx = { console, Object, Array, Number, Boolean, Math, Set, Map, Date, JSON, state:null };
ctx.globalThis = ctx;
ctx.mapRuntimePlayerIds = () => [1,2,3,4];
vm.createContext(ctx);
vm.runInContext(read("src/ffa_attribution.js"), ctx, { filename:"src/ffa_attribution.js" });
const ev = code => vm.runInContext(code, ctx);

ctx.state = {
  turn:9, eventSeq:30, orderIndex:1,
  players:[1,2,3,4].map(id => ({id,eliminated:false})),
  ffaAttribution:null
};
ctx.target = { uid:"u4a", name:"Guardia", side:4, type:"Fanteria", weight:"Pesante" };
ev("ffaAttributionRecordDamage(target,{sourceSide:2,source:'Tiro',damageKind:'attack',defLoss:2,hpLoss:0,options:{baseAttack:true}})");
ctx.state.eventSeq += 1;
ev("ffaAttributionRecordDamage(target,{sourceSide:3,source:'Mortaio',damageKind:'ability',defLoss:0,hpLoss:2,options:{ability:true}})");
const kill = ev("ffaAttributionResolveUnitDestruction(target,{sourceSide:3,source:'Mortaio',damageKind:'ability',options:{ability:true}})");
eq(kill.killerSide, 3, "final hostile source receives unit kill");
eq(kill.assistSides, [2], "recent hostile contributor receives assist");
eq(kill.attributionType, "direct", "ability kill classified as direct");
eq(kill.contributions.map(row => row.side).sort(), [2,3], "both hostile contributions preserved");
ok(ev("state.ffaAttribution.damageByUnit.u4a===undefined"), "unit ledger cleared after destruction");
ok(ev("state.ffaAttribution.hostilityByPlayer['4']['3'].unitKills===1"), "killer hostility recorded");
ok(ev("state.ffaAttribution.hostilityByPlayer['4']['2'].assists===1"), "assist hostility recorded");

const playerKill = ev("ffaAttributionResolvePlayerElimination(4,3,'qg')");
eq(playerKill.killerSide, 3, "QG conqueror receives player elimination");
eq(playerKill.assistSides, [2], "recent contributor receives player-elimination assist");
eq(playerKill.attributionType, "qg_capture", "QG elimination classified explicitly");
const concession = ev("ffaAttributionResolvePlayerElimination(2,1,'concessione')");
eq(concession.killerSide, null, "concession has no arbitrary killer");
eq(concession.assistSides, [], "concession grants no assists");
eq(concession.attributionType, "concession", "concession classified explicitly");

ctx.mineTarget = { uid:"u1mine", name:"Ricognitore", side:1, type:"Veicolo", weight:"Leggera" };
ev("ffaAttributionRecordDamage(mineTarget,{sourceSide:2,source:'Mina',damageKind:'hazard',defLoss:0,hpLoss:1,options:{hazard:true}})");
const mineKill = ev("ffaAttributionResolveUnitDestruction(mineTarget,{sourceSide:2,source:'Mina',damageKind:'hazard',options:{hazard:true}})");
eq(mineKill.killerSide, 2, "owned mine credits its owner");
eq(mineKill.attributionType, "hazard", "mine kill classified as hazard");

ctx.selfTarget = { uid:"self", name:"Sacrificio", side:1, type:"Fanteria" };
const selfKill = ev("ffaAttributionResolveUnitDestruction(selfTarget,{sourceSide:1,source:'Ultima Corsa',damageKind:'self',options:{sacrifice:true}})");
eq(selfKill.killerSide, null, "self destruction grants no hostile kill");
eq(selfKill.attributionType, "self", "self destruction classified explicitly");

const pressureEntry = ev("ffaAttributionRecordPressureEvaluation({round:20,activePlayers:[1,3,4],eliminatedPlayers:[2],qualifiedPlayers:[1],advancingPlayer:1,outcome:'advanced',requiredPs:4,totalPs:7,centralStrategicPointId:'ps-center',standings:[{player:1,ps:4,controlsCentral:true,pressure:2},{player:3,ps:2,controlsCentral:false,pressure:1},{player:4,ps:1,controlsCentral:false,pressure:0}]})");
eq(pressureEntry.activePlayers, [1,3,4], "pressure attribution stores active players");
eq(pressureEntry.eliminatedPlayers, [2], "pressure attribution stores eliminated players");
eq(pressureEntry.advancingPlayer, 1, "pressure advancement attributed to exact player");
ok(ev("ffaAttributionSnapshot().pressureTimeline.length===1"), "pressure timeline exported");

// ---------------------------------------------------------------------------
// Combat integration: actual applyDamage emits killer/assist metadata.
// ---------------------------------------------------------------------------
const combatLogs = [];
const combatCtx = {
  console, Object, Array, Number, Boolean, Math, Set, Map, Date, JSON,
  state:{turn:6,eventSeq:5,currentPlayer:2,players:[1,2,3,4].map(id=>({id})),units:[],energy:{1:0,2:0,3:0,4:0},ffaAttribution:null},
  EventTypes:{UNIT_DAMAGED:"UNIT_DAMAGED",UNIT_DESTROYED:"UNIT_DESTROYED",LOG_MESSAGE:"LOG_MESSAGE"},
  log(message,type,data){ combatLogs.push({message:String(message),type,data}); },
  mapRuntimePlayerIds(){return [1,2,3,4];},
  getStatus(){return null;}, defenseAuraBonus(){return 0;}, agathoiStructureAdjacencyDefBonus(){return 0;}, dynamicDefenseBonus(){return 0;},
  getTerrainDefenseModifier(){return 0;}, updateControlFromOccupants(){}, addPlayerEffect(){}, c2c6bRecordUnitDestroyed(){}, c1fBeforeUnitDestroyed(){},
  isAdjacentToAlliedStructure(){return false;}, sameCoord(a,b){return JSON.stringify(a)===JSON.stringify(b);},
  getUnitAt(){return null;}, combatUnits(){return [];}, neighbors(){return [];}, uniqueCoords(x){return x;}, isInsideMap(){return true;},
  removeStatusKind(){}, applyStatus(){}, playerName(side){return `G${side}`;}, stateUnitById(){return null;}
};
combatCtx.globalThis = combatCtx;
vm.createContext(combatCtx);
vm.runInContext(read("src/ffa_attribution.js"), combatCtx, {filename:"src/ffa_attribution.js"});
vm.runInContext(read("src/combat.js"), combatCtx, {filename:"src/combat.js"});
combatCtx.victim = {uid:"victim",name:"Bersaglio",side:4,faction:"Agathoi",type:"Fanteria",weight:"Pesante",role:"line",alive:true,acted:false,currentHp:2,currentDef:0,maxHp:2,statuses:[],pos:[0,0,0]};
combatCtx.state.units=[combatCtx.victim];
vm.runInContext("ffaAttributionRecordDamage(victim,{sourceSide:3,source:'supporto',damageKind:'attack',defLoss:1,hpLoss:0,options:{baseAttack:true}})",combatCtx);
vm.runInContext("applyDamage(victim,2,'Colpo finale',{directHp:true,sourceSide:2,damageKind:'tactic',tactic:true})",combatCtx);
const destroyedEvent = combatLogs.find(entry => entry.type === "UNIT_DESTROYED");
ok(destroyedEvent, "combat emits typed destruction event");
eq(destroyedEvent.data.killerSide, 2, "combat event credits final source");
eq(destroyedEvent.data.assistSides, [3], "combat event carries assist list");
eq(destroyedEvent.data.destroyedBySide, 2, "legacy destroyedBySide remains compatible");
eq(destroyedEvent.data.attributionType, "direct", "combat event carries attribution class");

// ---------------------------------------------------------------------------
// Stats integration: damage dealt, kills, assists, eliminations and Pressure.
// ---------------------------------------------------------------------------
const statsCtx = {
  console, Object, Array, Number, Boolean, Math, Set, Map, Date, JSON,
  EventTypes:{
    GAME_STARTED:"GAME_STARTED",TURN_STARTED:"TURN_STARTED",TURN_ENDED:"TURN_ENDED",UNIT_SPAWNED:"UNIT_SPAWNED",UNIT_BUILT:"UNIT_BUILT",
    UNIT_MOVED:"UNIT_MOVED",UNIT_ATTACKED:"UNIT_ATTACKED",UNIT_DAMAGED:"UNIT_DAMAGED",UNIT_DESTROYED:"UNIT_DESTROYED",
    PLAYER_ELIMINATED:"PLAYER_ELIMINATED",PRESSURE_EVALUATED:"PRESSURE_EVALUATED",PRESSURE_CHANGED:"PRESSURE_CHANGED",
    ABILITY_USED:"ABILITY_USED",TACTIC_USED:"TACTIC_USED",STATUS_APPLIED:"STATUS_APPLIED",STATUS_EXPIRED:"STATUS_EXPIRED",
    ECONOMY_CHANGED:"ECONOMY_CHANGED",PS_CONTROL_CHANGED:"PS_CONTROL_CHANGED",CARD_DRAWN:"CARD_DRAWN",CARD_PLAYED:"CARD_PLAYED",DECK_RECOVERED:"DECK_RECOVERED"
  },
  state:{
    turn:20,eventSeq:0,matchId:"m",currentPlayer:1,winnerSide:null,winType:null,
    players:[1,2,3,4].map(id=>({id,eliminated:false})),
    factions:{1:"Nexus",2:"Exordium",3:"Liberti",4:"Agathoi"},modes:{1:"human",2:"bot",3:"bot",4:"bot"},
    mapId:"map",mapDefinition:{name:"Test",schemaVersion:1,metadata:{revision:1},movementMultiplier:1},
    cells:[],units:[],energy:{1:3,2:3,3:3,4:3},pressure:{1:0,2:0,3:0,4:0},hand:{1:[],2:[],3:[],4:[]},deck:{1:[],2:[],3:[],4:[]},discard:{1:[],2:[],3:[],4:[]}
  },
  mapRuntimePlayerIds(){return [1,2,3,4];}, currentBuildVersionLabel(){return "test";}, buildInfoExportMeta(){return {version:"test"};},
  commanderLogLabel(){return "Cmd";}, mapTerrainUsage(){return {free:0};}, countControlledPS(){return 0;}, combatUnits(){return [];},
  isPlayerEliminated(side){return side===4;}, playerLifecycleStatus(side){return side===4?"eliminated":"active";}
};
statsCtx.globalThis=statsCtx;
vm.createContext(statsCtx);
vm.runInContext(read("src/stats.js"),statsCtx,{filename:"src/stats.js"});
vm.runInContext("initializeMatchStats()",statsCtx);
const pushStats = event => { statsCtx.event=event; vm.runInContext("updateMatchStatsFromEvent(event)",statsCtx); };
pushStats({type:"UNIT_DAMAGED",data:{targetSide:4,sourceSide:2,defLoss:1,hpLoss:2}});
pushStats({type:"UNIT_DESTROYED",data:{side:4,killerSide:2,destroyedBySide:2,assistSides:[3],unitType:"Fanteria"}});
pushStats({type:"PLAYER_ELIMINATED",data:{player:4,killerSide:2,assistSides:[3],reason:"qg",attributionType:"qg_capture",round:20}});
pushStats({type:"PRESSURE_EVALUATED",data:{round:20,activePlayers:[1,2,3],eliminatedPlayers:[4],qualifiedPlayers:[1,2],advancingPlayer:null,outcome:"tie",standings:[]}});
pushStats({type:"PRESSURE_CHANGED",data:{player:1,delta:1,current:1,round:21}});
eq(statsCtx.state.matchStats.players[2].damageDealt, 3, "stats records damage dealt by source");
eq(statsCtx.state.matchStats.players[2].kills, 1, "stats records unit kill");
eq(statsCtx.state.matchStats.players[3].assists, 1, "stats records unit assist");
eq(statsCtx.state.matchStats.players[2].playerEliminations, 1, "stats records player elimination");
eq(statsCtx.state.matchStats.players[3].playerEliminationAssists, 1, "stats records player-elimination assist");
eq(statsCtx.state.matchStats.players[4].timesEliminated, 1, "stats records victim elimination");
eq(statsCtx.state.matchStats.players[1].pressureDeniedByTie, 1, "pressure tie denial attributed to qualified player");
eq(statsCtx.state.matchStats.players[2].pressureDeniedByTie, 1, "pressure tie denial attributed to every qualified player");
eq(statsCtx.state.matchStats.players[1].pressureGained, 1, "pressure increment attributed to advancing player");
eq(statsCtx.state.matchStats.totals.unattributedPlayerEliminations, 0, "attributed elimination not counted as neutral");
eq(statsCtx.state.matchStats.eliminationTimeline.length, 1, "elimination timeline populated");
eq(statsCtx.state.matchStats.pressureTimeline.length, 1, "pressure evaluation timeline populated");

// Static integration and metadata.
ok(read("src/build_info.js").includes('version: "C2-STABLE-1-F9U2b-APK-M4c"'), "current F9Q3e1 build metadata");
ok(read("src/build_info.js").includes('F9Q3d4 validated-baseline compatibility marker: version: "C2-STABLE-1-F9Q3d4-APK-M4c"'), "validated F9Q3d4 baseline preserved");
ok(read("index.html").includes('src/ffa_attribution.js'), "FFA attribution module loaded");
ok(read("src/events.js").includes('PRESSURE_EVALUATED: "PRESSURE_EVALUATED"'), "typed Pressure evaluation event registered");
ok(read("src/rules.js").includes('eliminatePlayer(player, null, "concessione")'), "concession no longer assigns arbitrary opponent");
ok(read("src/combat.js").includes('damageKind:"hazard"'), "owned mine damage carries hazard attribution");

console.log(`F9Q3d4 Elimination, Assist & Pressure Attribution smoke: ${checks}/${checks} OK`);
