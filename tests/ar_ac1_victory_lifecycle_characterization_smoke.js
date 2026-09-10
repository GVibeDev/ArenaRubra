"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => { assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected, message); checks += 1; };

const source = `
const EventTypes={
  LOG_MESSAGE:"LOG_MESSAGE", VICTORY:"VICTORY", PLAYER_ELIMINATED:"PLAYER_ELIMINATED",
  PRESSURE_CHANGED:"PRESSURE_CHANGED", PRESSURE_EVALUATED:"PRESSURE_EVALUATED", PS_CONTROL_CHANGED:"PS_CONTROL_CHANGED"
};
let state=null;
let selectedId=null;
let pendingPlayerTargetContext=null;
let logs=[];
let resultWrites=0;
let statsRenders=0;
let renders=0;
let audioCalls=[];
let endTurnCalls=[];
function $(id){return null;}
function log(message,type,data){logs.push({message:String(message),type:type||null,data:data||null});}
function emitGameEvent(){}
function sameCoord(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((value,index)=>value===b[index]);}
function hexDistance(a,b){return Math.max(...a.map((value,index)=>Math.abs(value-b[index])));}
function getActiveMapDefinition(){return state.mapDefinition;}
function getCentralStrategicPoint(definition){return definition.strategicPoints.find(ps=>ps.id===definition.centralStrategicPointId)||null;}
function mapRuntimePlayerIds(source){return source.playerIds;}
function getActivePlayers(){return state.players.filter(player=>!player.eliminated).map(player=>player.id);}
function getEnemyPlayers(player){return getActivePlayers().filter(candidate=>candidate!==player);}
function playerName(player){return 'G'+player;}
function recordMatchResult(){resultWrites+=1;}
function renderMatchupStats(){statsRenders+=1;}
function renderAll(){renders+=1;}
function arenaAudioHandleMatchEnd(payload){audioCalls.push(JSON.parse(JSON.stringify(payload)));}
function endTurn(options){endTurnCalls.push(JSON.parse(JSON.stringify(options||{})));}
function closePlayerTargetSelector(){pendingPlayerTargetContext=null;}
function clearSelection(){selectedId=null;}
${read("data/maps.js")}
${read("src/constants.js")}
${read("src/board.js")}
${read("src/player_lifecycle.js")}
${read("src/rules/victory_lifecycle.js")}
${read("src/rules/pressure_victory.js")}
${read("src/rules.js")}
function makeState(options={}){
  const players=options.players||2;
  const ids=Array.from({length:players},(_,index)=>index+1);
  const points=[
    {id:'ps-center',coord:[0,0,0],tags:['central']},
    {id:'ps-2',coord:[1,-1,0],tags:[]},
    {id:'ps-3',coord:[-1,1,0],tags:[]}
  ];
  const units=[];
  for(const player of ids){
    units.push({uid:'hq-'+player,type:'QG',side:player,alive:true,currentHp:9,pos:[10+player,-10-player,0],statuses:[]});
    const count=(options.unitCounts&&options.unitCounts[player])||1;
    for(let index=0;index<count;index++) units.push({uid:'u-'+player+'-'+index,type:'Fanteria',side:player,alive:true,currentHp:2,pos:[player,index+1,-player-index-1],acted:false,statuses:[]});
  }
  return {
    turn:options.turn||1, orderIndex:0, currentPlayer:options.currentPlayer||1,
    winner:null,winnerSide:null,winType:null,playerIds:ids,
    players:ids.map(id=>({id,eliminated:false,lifecycleStatus:'active'})),
    factions:Object.fromEntries(ids.map(id=>[id,'F'+id])),
    modes:Object.fromEntries(ids.map(id=>[id,(options.modes&&options.modes[id])||'bot'])),
    mapDefinition:{id:'lifecycle',playerCount:players,strategicPoints:points,centralStrategicPointId:'ps-center'},
    cells:points.map((point,index)=>({coord:point.coord,ps:true,control:options.controls?options.controls[index]:null})),
    units,pressure:Object.fromEntries(ids.map(id=>[id,0])),energy:Object.fromEntries(ids.map(id=>[id,3])),
    desperation:Object.fromEntries(ids.map(id=>[id,(options.desperation&&options.desperation[id])||0])),
    autoResignEnabled:options.autoResignEnabled===true,psLocks:[],mines:[],cellEffects:[],playerEffects:{},missions:{},
    energyLocked:{},handLocked:{},tacticUsedThisTurn:{},tacticCooldowns:{},c2eBotHandTacticsUsedThisTurn:{},
    fabeotEconomyAbilityUsed:{},fabeotConversionUsed:{},hand:{},deck:{},discard:{}
  };
}
function reset(value){state=value;selectedId=null;pendingPlayerTargetContext=null;logs=[];resultWrites=0;statsRenders=0;renders=0;audioCalls=[];endTurnCalls=[];}
return {
  makeState,reset,getState:()=>state,getLogs:()=>logs,getResultWrites:()=>resultWrites,
  getStatsRenders:()=>statsRenders,getRenders:()=>renders,getAudioCalls:()=>audioCalls,getEndTurnCalls:()=>endTurnCalls,
  setWinner,inferWinnerSide,inferWinType,eliminatePlayer,maybeAutoResign,concedeMatch,checkVictory,playerLifecycleStatus
};
`;

const runtime = new Function(source)();

let state = runtime.makeState({ players:4, turn:12 });
runtime.reset(state);
runtime.setWinner("Vittoria G4 F4: occupa il QG avversario.");
eq(state.winnerSide, 4, "winner inference scans every runtime player");
eq(state.winType, "qg", "winner type is inferred from the message when metadata is absent");
eq(runtime.playerLifecycleStatus(4), "winner", "winner lifecycle is marked explicitly");
eq(runtime.getResultWrites(), 1, "winner persists exactly one match result");
eq(runtime.getStatsRenders(), 1, "winner refreshes matchup statistics once");
eq(runtime.getAudioCalls()[0], {winnerSide:4,winType:"qg",modes:state.modes,factions:state.factions,round:12}, "winner notifies match-end audio with stable metadata");
runtime.setWinner("Vittoria G1 duplicata.", {winner:1,type:"altro"});
eq(runtime.getResultWrites(), 1, "setWinner is idempotent after a terminal result");
eq(state.winnerSide, 4, "a second winner cannot overwrite the first result");

for(const [message,type] of [
  ["dominio operativo per pressione","pressione"], ["conquista QG","qg"], ["spareggio finale","spareggio"],
  ["resa tecnica","resa_tecnica"], ["G2 concede","concessione"], ["pareggio tecnico","pareggio"], ["esito speciale","altro"]
]) eq(runtime.inferWinType(message),type,`inferWinType preserves ${type}`);

state=runtime.makeState({players:4,turn:9,currentPlayer:2});
runtime.reset(state);
runtime.concedeMatch(2);
eq(runtime.playerLifecycleStatus(2),"eliminated","a conceding player leaves the active lifecycle");
eq(state.players[1].eliminationReason,"concessione","concession reason is stored on the player record");
eq(state.players[1].eliminatedBy,null,"concession does not assign an arbitrary killer");
eq(runtime.getEndTurnCalls(),[{eliminatedCurrent:true}],"current-player concession advances through the turn adapter");
eq(state.winner,null,"a 4P concession does not end a match with three survivors");

state=runtime.makeState({players:3,turn:9,currentPlayer:1});
runtime.reset(state);
runtime.concedeMatch(3);
eq(runtime.getEndTurnCalls().length,0,"non-current concession does not advance the turn cursor");
eq(runtime.getRenders(),1,"non-current concession refreshes the current game view");
eq(state.winner,null,"a 3P concession leaves two active players");

state=runtime.makeState({players:2,turn:9,currentPlayer:2});
runtime.reset(state);
runtime.concedeMatch(2);
eq(state.winnerSide,1,"the sole survivor wins a 2P concession");
eq(state.winType,"concessione","last-survivor concession preserves its distinct win type");
eq(runtime.getResultWrites(),1,"terminal concession persists one result");

state=runtime.makeState({players:2,turn:25,controls:[1,1,1],autoResignEnabled:false,unitCounts:{1:4,2:1}});
runtime.reset(state);
runtime.maybeAutoResign(2);
eq(state.desperation[2],0,"disabled auto-resign does not advance desperation");

state=runtime.makeState({players:2,turn:24,controls:[1,1,1],autoResignEnabled:true,unitCounts:{1:4,2:1}});
runtime.reset(state);
runtime.maybeAutoResign(2);
eq(state.desperation[2],0,"auto-resign does not evaluate before round 25");

state=runtime.makeState({players:2,turn:25,controls:[1,1,1],autoResignEnabled:true,unitCounts:{1:4,2:1},modes:{2:'human'}});
runtime.reset(state);
runtime.maybeAutoResign(2);
eq(state.desperation[2],0,"human players never auto-resign");

state=runtime.makeState({players:2,turn:25,controls:[1,1,1],autoResignEnabled:true,unitCounts:{1:4,2:1}});
state.units.find(unit=>unit.uid==='u-2-0').pos=[40,-40,0];
runtime.reset(state);
runtime.maybeAutoResign(2);
runtime.maybeAutoResign(2);
eq(state.desperation[2],2,"hopeless bot state must persist for consecutive evaluations");
eq(runtime.playerLifecycleStatus(2),"active","bot remains active before the third hopeless evaluation");
runtime.maybeAutoResign(2);
eq(runtime.playerLifecycleStatus(2),"eliminated","third hopeless evaluation eliminates the bot");
eq(state.players[1].eliminationReason,"resa_tecnica","auto-resign records the technical-surrender reason");
eq(state.players[1].eliminatedBy,null,"technical surrender grants no killer credit");
eq(state.winnerSide,1,"sole survivor wins after technical surrender");
eq(state.winType,"eliminazione","current technical-surrender terminal path uses the elimination win type");

state=runtime.makeState({players:2,turn:25,controls:[1,1,2],autoResignEnabled:true,desperation:{2:2}});
runtime.reset(state);
runtime.maybeAutoResign(2);
eq(state.desperation[2],0,"a non-hopeless evaluation resets the resignation streak");

state=runtime.makeState({players:3,turn:6,controls:[1,2,3],unitCounts:{1:2}});
let attacker=state.units.find(unit=>unit.uid==='u-1-0');
state.units.find(unit=>unit.uid==='u-1-1').pos=[0,0,0];
let hq2=state.units.find(unit=>unit.uid==='hq-2');
attacker.pos=[...hq2.pos];
runtime.reset(state);
runtime.checkVictory();
eq(runtime.playerLifecycleStatus(2),"eliminated","3P QG capture eliminates its defender");
eq(state.winner,null,"first 3P QG capture leaves the match active");
let hq3=state.units.find(unit=>unit.uid==='hq-3');
attacker.pos=[...hq3.pos];
runtime.checkVictory();
eq(runtime.playerLifecycleStatus(3),"eliminated","second QG capture eliminates the remaining opponent");
eq(state.winnerSide,1,"last active player wins after sequential 3P QG captures");
eq(state.winType,"eliminazione","multiplayer QG capture retains the characterized elimination type");

console.log(`AR-AC1 victory/lifecycle characterization smoke: ${checks}/${checks} OK`);
