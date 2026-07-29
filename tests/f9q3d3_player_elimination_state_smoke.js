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

const logs = [];
const ctx = {
  console, Object, Array, Number, Boolean, Math, Set, Map, Date, JSON,
  PRESSURE_WIN:5, MAX_ROUND:40, AUTO_RESIGN_ROUND:8, AUTO_RESIGN_STREAK:2,
  EventTypes:{
    LOG_MESSAGE:"LOG_MESSAGE", PLAYER_ELIMINATED:"PLAYER_ELIMINATED", VICTORY:"VICTORY",
    PRESSURE_CHANGED:"PRESSURE_CHANGED", PS_CONTROL_CHANGED:"PS_CONTROL_CHANGED", TURN_ENDED:"TURN_ENDED", TURN_STARTED:"TURN_STARTED"
  },
  state:null, selectedId:null, pendingPlayerTargetContext:null,
  log(message,type,data){ logs.push({message:String(message),type,data}); },
  recordMatchResult(){ ctx.state.matchRecorded=true; }, renderMatchupStats(){}, renderAll(){},
  sameCoord(a,b){ return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]); },
  hexDistance(a,b){ return Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2])); },
  pressureStartRound(){ return 20; }, pressureWinLimit(){ return 5; }, maxRoundLimit(){ return 40; }, pressureMapScale(){ return 0; },
  getActiveMapDefinition(){ return {strategicPoints:[],playerCount:4}; }, getCentralStrategicPoint(){ return null; },
  closePlayerTargetSelector(){ ctx.selectorClosed=true; ctx.pendingPlayerTargetContext=null; },
  clearSelection(){ ctx.selectedId=null; ctx.selectionCleared=true; },
  missionOpenPendingPlayerRewardSelector(){ ctx.missionSelectorReopened=true; return true; },
  missionFinalizeReward(side,result){ ctx.finalizedMission={side,result}; },
  arenaAudioHandleMatchEnd(){},
  countControlledPS(side){ return ctx.state.cells.filter(c=>c.ps&&c.control===side).length; }
};
ctx.globalThis=ctx;
vm.createContext(ctx);
for (const file of ["src/map_runtime.js","src/player_lifecycle.js","src/rules.js"]) vm.runInContext(read(file),ctx,{filename:file});
const evalIn = code => vm.runInContext(code,ctx);

ctx.state={
  turn:7, orderIndex:0, turnOrder:[1,2,3,4], currentPlayer:1, winner:null, winnerSide:null, winType:null,
  players:[1,2,3,4].map(id=>({id,eliminated:false,lifecycleStatus:"active"})),
  factions:{1:"Nexus",2:"Exordium",3:"Liberti",4:"Agathoi"}, modes:{1:"human",2:"bot",3:"human",4:"bot"},
  units:[
    {uid:"hq1",side:1,type:"QG",alive:true,pos:[-3,0,3],statuses:[]},
    {uid:"hq2",side:2,type:"QG",alive:true,pos:[3,0,-3],statuses:[]},
    {uid:"hq3",side:3,type:"QG",alive:true,pos:[0,3,-3],statuses:[]},
    {uid:"hq4",side:4,type:"QG",alive:true,pos:[0,-3,3],statuses:[]},
    {uid:"u1",side:1,type:"Fanteria",alive:true,currentHp:2,pos:[0,0,0],statuses:[]},
    {uid:"converted",side:1,originalSide:2,type:"Veicolo",alive:true,currentHp:3,pos:[1,-1,0],statuses:[]},
    {uid:"u2",side:2,type:"Struttura",alive:true,currentHp:3,pos:[2,-1,-1],statuses:[]},
    {uid:"u3",side:3,type:"Fanteria",alive:true,currentHp:2,pos:[-1,1,0],statuses:[{kind:"inhibit_move",owner:2},{kind:"taxed",casterSide:2},{kind:"stealth",owner:4}]},
    {uid:"u4",side:4,type:"Fanteria",alive:true,currentHp:2,pos:[0,-1,1],statuses:[]}
  ],
  cells:[{coord:[2,-1,-1],ps:true,control:2},{coord:[0,0,0],ps:true,control:1}], psLocks:[{owner:2,coord:[2,-1,-1]},{owner:3,coord:[0,0,0]}],
  mines:[{owner:2,coord:[2,0,-2],name:"user"},{owner:2,coord:[3,-1,-2],name:"map",initialMapHazard:true},{owner:0,coord:[0,2,-2],name:"neutral",initialMapHazard:true}],
  cellEffects:[{owner:2,coord:[2,1,-3],kind:"trap"},{owner:2,coord:[3,1,-4],kind:"maptrap",initialMapHazard:true},{owner:3,coord:[-1,2,-1],kind:"other"}],
  playerEffects:{1:[{kind:"tax",casterSide:2},{kind:"other",casterSide:3}],2:[{kind:"income",casterSide:1}],3:[],4:[]},
  energy:{1:5,2:8,3:4,4:3}, pressure:{1:0,2:3,3:1,4:0}, desperation:{1:0,2:0,3:0,4:0},
  energyLocked:{1:0,2:2,3:0,4:0}, handLocked:{1:0,2:1,3:0,4:0}, tacticUsedThisTurn:{1:false,2:true,3:false,4:false},
  tacticCooldowns:{1:{},2:{x:2},3:{},4:{}}, c2eBotHandTacticsUsedThisTurn:{1:0,2:2,3:0,4:0},
  fabeotEconomyAbilityUsed:{1:false,2:true,3:false,4:false}, fabeotConversionUsed:{1:false,2:true,3:false,4:false},
  missions:{1:{status:"reward_pending",rewardPending:true},2:{status:"active",ready:true,rewardPending:true},3:null,4:null},
  missionPendingReward:{kind:"mission_player_target_selection",missionOwnerSide:1,targetSides:[2,3],missionName:"Test"},
  hand:{1:[{cardUid:"stolen",originSide:2}],2:[{cardUid:"frozen"}],3:[],4:[]}, deck:{1:[],2:[{cardUid:"deck2"}],3:[],4:[]}, discard:{1:[],2:[],3:[],4:[]},
  matchRecorded:false
};
ctx.selectedId="u2";
ctx.pendingPlayerTargetContext={casterSide:1,targetSides:[2,3]};

eq(evalIn("getActivePlayers()"),[1,2,3,4],"all players begin active");
eq(evalIn("playerLifecycleStatus(2)"),"active","initial lifecycle active");
ok(evalIn("eliminatePlayer(2,1,'qg')"),"player 2 eliminated");
eq(evalIn("getActivePlayers()"),[1,3,4],"eliminated player leaves active set");
eq(evalIn("playerLifecycleStatus(2)"),"eliminated","lifecycle changes to eliminated");
ok(evalIn("state.players[1].eliminatedBy===1 && state.players[1].eliminationReason==='qg'"),"elimination metadata recorded");
ok(evalIn("!state.units.find(u=>u.uid==='u2').alive && state.units.find(u=>u.uid==='u2').pos===null"),"owned field structure removed");
ok(evalIn("state.units.find(u=>u.uid==='hq2').alive && state.units.find(u=>u.uid==='hq2').activeObjective===false"),"HQ remains landmark but inactive");
ok(evalIn("state.units.find(u=>u.uid==='converted').alive && state.units.find(u=>u.uid==='converted').side===1"),"already converted survivor unit remains");
eq(evalIn("state.units.find(u=>u.uid==='u3').statuses.map(s=>s.owner)"),[4],"statuses owned by eliminated player expire");
eq(evalIn("state.mines.map(m=>({name:m.name,owner:m.owner}))"),[{name:"map",owner:0},{name:"neutral",owner:0}],"user mine removed and map mine neutralized");
eq(evalIn("state.cellEffects.map(e=>({kind:e.kind,owner:e.owner}))"),[{kind:"maptrap",owner:0},{kind:"other",owner:3}],"owned cell effects cleaned safely");
eq(evalIn("state.psLocks.map(l=>l.owner)"),[3],"owned PS lock removed");
eq(evalIn("state.cells.find(c=>c.coord[0]===2).control"),null,"PS control removed immediately");
eq(evalIn("state.playerEffects[1].map(e=>e.casterSide)"),[3],"effects sourced by eliminated player removed from survivors");
eq(evalIn("state.playerEffects[2]"),[],"effects targeting eliminated player cleared");
ok(evalIn("state.energyLocked[2]===0 && state.handLocked[2]===0 && Object.keys(state.tacticCooldowns[2]).length===0"),"locks and cooldowns cleared");
ok(ctx.selectorClosed && ctx.selectionCleared,"stale interaction contexts closed");
eq(evalIn("state.missionPendingReward.targetSides"),[3],"pending Mission target list filtered");
ok(ctx.missionSelectorReopened,"Mission selector reopened for remaining target");
eq(evalIn("state.hand[1].map(c=>c.cardUid)"),["stolen"],"stolen card remains with current holder");
eq(evalIn("state.hand[2].map(c=>c.cardUid)"),["frozen"],"eliminated card zone remains frozen for diagnostics");
ok(logs.some(entry=>entry.type==="PLAYER_ELIMINATED"),"typed elimination event emitted");

// A pending discard choice against an eliminated chooser cannot softlock the match.
ctx.state.missionPendingReward={kind:"enemy_discard_selection",missionOwnerSide:1,chooserSide:3,required:1};
ok(evalIn("eliminatePlayer(3,1,'qg')"),"player 3 eliminated");
eq(evalIn("state.missionPendingReward"),null,"invalid pending chooser cleared");
ok(ctx.finalizedMission && ctx.finalizedMission.side===1,"owner Mission finalized without target");

// Final survivor becomes winner and lifecycle is explicit.
ok(evalIn("eliminatePlayer(4,1,'qg')"),"player 4 eliminated");
eq(evalIn("state.winnerSide"),1,"last active player wins");
eq(evalIn("playerLifecycleStatus(1)"),"winner","winner lifecycle state");
ok(evalIn("state.matchRecorded"),"match recorded after final elimination");

// Turn cursor skips eliminated players without recursive endTurn calls and resolves one boundary.
const turnCtx={console,Object,Array,Number,Boolean,Math,Set,Map,Date,JSON};
turnCtx.state={
  turn:10,orderIndex:0,turnOrder:[1,2,3,4],currentPlayer:1,winner:null,
  players:[{id:1,eliminated:false},{id:2,eliminated:true},{id:3,eliminated:false},{id:4,eliminated:true}]
};
let roundBoundaries=0;
Object.assign(turnCtx,{
  EventTypes:{LOG_MESSAGE:"LOG_MESSAGE"},
  resolveEndOfRound(){roundBoundaries+=1;}, missionCheckpointRoundEnd(){}, missionCleanupEndOfRound(){}, f9s1aRestoreGreenFury(){},
  checkVictory(){}, log(){},
  isPlayerEliminated(side){return Boolean(turnCtx.state.players.find(p=>p.id===side)?.eliminated);}
});
vm.createContext(turnCtx);
vm.runInContext(read("src/turns.js"),turnCtx,{filename:"src/turns.js"});
vm.runInContext("advanceToNextActivePlayer()",turnCtx);
eq(turnCtx.state.currentPlayer,3,"turn cursor skips eliminated G2");
eq(turnCtx.state.turn,10,"no round boundary before G3");
turnCtx.state.currentPlayer=3; turnCtx.state.orderIndex=2;
vm.runInContext("advanceToNextActivePlayer()",turnCtx);
eq(turnCtx.state.currentPlayer,1,"turn cursor skips eliminated G4 and wraps to G1");
eq(turnCtx.state.turn,11,"round increments exactly once");
eq(roundBoundaries,1,"round boundary resolved once");

ok(read("src/build_info.js").includes('version: "C2-STABLE-1-F9Q3d3-APK-M4c"'),"F9Q3d3 build metadata");
ok(read("src/build_info.js").includes('logicBaseline: "C2-STABLE-1-F9Q3d2-APK-M4c"'),"validated F9Q3d2 baseline preserved");
ok(read("index.html").includes('src/player_lifecycle.js'),"player lifecycle module loaded");

console.log(`F9Q3d3 Player Elimination & Active State smoke: ${checks}/${checks} OK`);
