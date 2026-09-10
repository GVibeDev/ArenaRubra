"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
let checks = 0;
const eq = (actual, expected, message) => { assert.strictEqual(actual, expected, message); checks += 1; };
const ok = (value, message) => { assert.ok(value, message); checks += 1; };

const source = `
const EventTypes={
  PRESSURE_CHANGED:"PRESSURE_CHANGED", PRESSURE_EVALUATED:"PRESSURE_EVALUATED",
  VICTORY:"VICTORY", PS_CONTROL_CHANGED:"PS_CONTROL_CHANGED",
  PLAYER_ELIMINATED:"PLAYER_ELIMINATED", LOG_MESSAGE:"LOG_MESSAGE"
};
let state=null;
let events=[];
let logs=[];
let resultWrites=0;
let statsRenders=0;
function $(id){return null;}
function log(message,type,data){logs.push({message:String(message),type:type||null,data:data||null});}
function emitGameEvent(event){events.push(JSON.parse(JSON.stringify(event))); return event;}
function sameCoord(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);}
function getActiveMapDefinition(){return state.mapDefinition;}
function getCentralStrategicPoint(definition){return definition.strategicPoints.find(ps=>ps.id===definition.centralStrategicPointId)||null;}
function isPsLocked(){return false;}
function getActivePlayers(){return state.players.filter(player=>!player.eliminated).map(player=>player.id);}
function mapRuntimePlayerIds(source){return source.playerIds;}
function playerName(player){return 'G'+player;}
function isPlayerEliminated(player){const record=state.players.find(entry=>entry.id===player); return Boolean(record&&record.eliminated);}
function getEnemyPlayers(player){return getActivePlayers().filter(candidate=>candidate!==player);}
function enemyCombatUnits(player){return combatUnits().filter(unit=>unit.side!==player);}
function recordMatchResult(){resultWrites+=1;}
function renderMatchupStats(){statsRenders+=1;}
function renderAll(){}
function playerLifecycleMarkWinner(player){const record=state.players.find(entry=>entry.id===player); if(record)record.lifecycleStatus='winner';}
function arenaAudioHandleMatchEnd(){}
function hexDistance(a,b){return Math.max(...a.map((value,index)=>Math.abs(value-b[index])));}
${read("data/maps.js")}
${read("src/constants.js")}
${read("src/board.js")}
${read("src/rules/victory_lifecycle.js")}
${read("src/rules/pressure_victory.js")}
${read("src/rules.js")}
updateControlFromOccupants=function(){};
function makeState(options={}){
  const players=options.players||2;
  const totalPs=options.totalPs||3;
  const center=[0,0,0];
  const points=Array.from({length:totalPs},(_,index)=>({
    id:index===0?'ps-center':'ps-'+(index+1),
    coord:index===0?center:[index,-index,0],
    tags:index===0?['central']:[]
  }));
  const ids=Array.from({length:players},(_,index)=>index+1);
  const units=[];
  for(const player of ids){
    units.push({uid:'hq-'+player,type:'QG',side:player,alive:true,currentHp:9,pos:[20+player,-20-player,0]});
    const count=(options.unitCounts&&options.unitCounts[player])||0;
    for(let index=0;index<count;index++) units.push({uid:'u-'+player+'-'+index,type:'Fanteria',side:player,alive:true,currentHp:1,pos:[player,index+1,-player-index-1],acted:false});
  }
  return {
    pacePreset:options.pace||'standard', turn:options.turn||1,
    winner:null, winnerSide:null, winType:null, mapId:'characterization',
    mapDefinition:{id:'characterization',playerCount:players,strategicPoints:points,centralStrategicPointId:'ps-center'},
    playerIds:ids, players:ids.map(id=>({id,eliminated:Boolean(options.eliminated&&options.eliminated.includes(id))})),
    cells:points.map((point,index)=>({coord:point.coord,ps:true,control:options.controls?options.controls[index]:null})),
    pressure:Object.fromEntries(ids.map(id=>[id,(options.pressure&&options.pressure[id])||0])),
    energy:Object.fromEntries(ids.map(id=>[id,(options.energy&&options.energy[id])||0])),
    factions:Object.fromEntries(ids.map(id=>[id,'F'+id])), modes:Object.fromEntries(ids.map(id=>[id,'bot'])),
    units, desperation:{}, psLocks:[], autoResignEnabled:false
  };
}
function setState(value){state=value; events=[]; logs=[]; resultWrites=0; statsRenders=0;}
return {
  makeState,setState,getState:()=>state,getEvents:()=>events,getLogs:()=>logs,
  getResultWrites:()=>resultWrites,getStatsRenders:()=>statsRenders,
  pressureRuleProfile,resolveEndOfRound,resolveRoundLimit,checkVictory,setWinner
};
`;

const runtime = new Function(source)();

let state = runtime.makeState({ turn:22, controls:[1,1,2] });
runtime.setState(state);
runtime.resolveEndOfRound();
eq(state.pressure[1], 0, "pressure does not advance before the Standard start round");
eq(runtime.getEvents().length, 0, "pre-start rounds do not emit pressure evaluation events");

state = runtime.makeState({ turn:23, controls:[1,1,2] });
runtime.setState(state);
runtime.resolveEndOfRound();
eq(state.pressure[1], 1, "central plus half of PS advances pressure at the start round");
eq(runtime.getEvents()[0].type, "PRESSURE_EVALUATED", "pressure evaluation is emitted before advancement");
eq(runtime.getEvents()[0].data.outcome, "advanced", "evaluation attributes the unique advancing player");

state = runtime.makeState({ turn:23, controls:[1,2,2] });
runtime.setState(state);
runtime.resolveEndOfRound();
eq(state.pressure[1], 0, "central control below the PS threshold does not advance pressure");
eq(runtime.getEvents()[0].data.outcome, "unqualified", "failed threshold is recorded as unqualified");

state = runtime.makeState({ turn:23, controls:[1,1,2], pressure:{1:6} });
runtime.setState(state);
runtime.resolveEndOfRound();
eq(state.pressure[1], 7, "the seventh Standard increment reaches the pressure limit");
eq(state.winnerSide, 1, "terminal pressure names the advancing player");
eq(state.winType, "pressione", "terminal pressure records the pressure win type");
eq(runtime.getResultWrites(), 1, "terminal pressure persists one match result");
runtime.resolveEndOfRound();
eq(runtime.getResultWrites(), 1, "winner handling is idempotent after terminal pressure");

for(const fixture of [
  {players:3,totalPs:7,turn:25,winner:1,controls:[1,1,1,1,2,3,null]},
  {players:4,totalPs:9,turn:27,winner:4,controls:[4,4,4,4,4,1,2,3,null]}
]){
  state=runtime.makeState({
    players:fixture.players,totalPs:fixture.totalPs,turn:fixture.turn,
    controls:fixture.controls,pressure:{[fixture.winner]:6}
  });
  runtime.setState(state);
  runtime.resolveEndOfRound();
  eq(state.pressure[fixture.winner],7,`${fixture.players}P terminal pressure reaches the Standard limit`);
  eq(state.winnerSide,fixture.winner,`${fixture.players}P terminal pressure preserves player attribution`);
  eq(state.winType,"pressione",`${fixture.players}P terminal pressure preserves the canonical win type`);
}

const roundLimitCases = [
  { label:"PS", controls:[1,1,2], unitCounts:{1:1,2:4}, energy:{1:0,2:9}, winner:1 },
  { label:"units", controls:[1,2,null], unitCounts:{1:3,2:1}, energy:{1:0,2:9}, winner:1 },
  { label:"energy", controls:[1,2,null], unitCounts:{1:1,2:1}, energy:{1:4,2:2}, winner:1 }
];
for(const fixture of roundLimitCases){
  state=runtime.makeState({turn:50,controls:fixture.controls,unitCounts:fixture.unitCounts,energy:fixture.energy});
  runtime.setState(state);
  runtime.resolveRoundLimit();
  eq(state.winnerSide,fixture.winner,`${fixture.label} is applied in round-limit tiebreak order`);
  eq(state.winType,"spareggio",`${fixture.label} tiebreak records the canonical win type`);
}

state=runtime.makeState({turn:50,controls:[1,2,null],unitCounts:{1:1,2:1},energy:{1:3,2:3}});
runtime.setState(state);
runtime.resolveRoundLimit();
eq(state.winnerSide,null,"equal PS, units and energy produce no winning side");
eq(state.winType,"pareggio","an exact round-limit tie records the draw type");

state=runtime.makeState({turn:5,controls:[1,2,2],unitCounts:{1:1}});
const defenderHq=state.units.find(unit=>unit.type==='QG'&&unit.side===2);
state.units.find(unit=>unit.uid==='u-1-0').pos=[...defenderHq.pos];
runtime.setState(state);
runtime.checkVictory();
ok(state.players.find(player=>player.id===2).eliminated,"an enemy occupying the HQ with one controlled PS eliminates its defender");
eq(state.winnerSide,1,"the last active player wins after HQ capture");
eq(state.winType,"eliminazione","current multiplayer HQ capture resolves through the elimination win type");

state=runtime.makeState({turn:5,controls:[2,2,2],unitCounts:{1:1}});
const protectedHq=state.units.find(unit=>unit.type==='QG'&&unit.side===2);
state.units.find(unit=>unit.uid==='u-1-0').pos=[...protectedHq.pos];
runtime.setState(state);
runtime.checkVictory();
eq(state.players.find(player=>player.id===2).eliminated,false,"HQ occupation without a controlled PS does not eliminate the defender");
eq(state.winner,null,"HQ occupation without the PS prerequisite does not end the match");

console.log(`AR-AC1 pressure/victory characterization smoke: ${checks}/${checks} OK`);
