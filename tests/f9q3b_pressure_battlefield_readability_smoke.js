"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const equal = (actual, expected, message) => { assert.strictEqual(actual, expected, message); checks += 1; };

const prefix = `
const EventTypes = { PRESSURE_CHANGED:"PRESSURE_CHANGED", PS_CONTROL_CHANGED:"PS_CONTROL_CHANGED", VICTORY:"VICTORY", LOG_MESSAGE:"LOG_MESSAGE" };
const FACTIONS = {
  Nexus:{label:"Nexus",key:"nexus",color:"#2b6fb8"},
  Exordium:{label:"Exordium",key:"exordium",color:"#b43a32"},
  Liberti:{label:"Liberti",key:"liberti",color:"#b88720"},
  Agathoi:{label:"Agathoi",key:"agathoi",color:"#4f9d58"}
};
let selectedId = null;
let mode = "idle";
let state = null;
const logs = [];
function $(id) { return null; }
function sameCoord(a,b){ return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]); }
function hexDistance(a,b){ return Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2])); }
function log(message){ logs.push(message); }
function emitGameEvent(){}
function recordMatchResult(){}
function renderMatchupStats(){}
function renderAll(){}
function canAct(){ return true; }
function hasStatus(){ return false; }
function hasAnyInhibition(){ return false; }
function effectiveThorns(){ return 0; }
function effectiveAtt(u){ return u.currentAtt || 0; }
function unitStatusSummary(){ return ""; }
function unitIcon(){ return ""; }
function unitOverlay(){ return ""; }
function getEffectiveDefense(u){ return u.currentDef || 0; }
function getActiveMapDefinition(){ return state && state.mapDefinition ? state.mapDefinition : {id:"map1_starter"}; }
function getActivePlayers(){ return state.players.filter(p=>!p.eliminated).map(p=>p.id); }
function getCentralStrategicPoint(definition) {
  if (!definition || !Array.isArray(definition.strategicPoints)) return null;
  return definition.strategicPoints.find(ps => ps.id === definition.centralStrategicPointId) || null;
}
function isPsLocked(){ return false; }
function countControlledPS(player){ return state.cells.filter(cell => cell.ps && cell.control === player).length; }
function playerName(player){ return "G" + player; }
function setWinner(message, meta){ state.winner = message; state.winnerSide = meta.winner; }
function resolveRoundLimit(){ state.roundLimitResolved = true; }
function combatUnits(){ return []; }
`;

const source = prefix
  + read("data/maps.js") + "\n"
  + read("src/constants.js") + "\n"
  + read("src/board.js") + "\n"
  + read("src/rules.js") + `
function makeState(playerCount, pacePreset, psControls) {
  const strategicPoints = psControls.map((_control,index)=>({
    id:index===0 ? "ps-center" : "ps-" + (index+1),
    coord:[index,-index,0],
    incomeValue:1,
    tags:index===0 ? ["central"] : []
  }));
  return {
    mapId:"f9r3-fixture",
    mapDefinition:{
      id:"f9r3-fixture",
      playerCount,
      strategicPoints,
      centralStrategicPointId:"ps-center"
    },
    pacePreset,
    turn:40,
    winner:null,
    winnerSide:null,
    players:Array.from({length:playerCount},(_,index)=>({id:index+1,eliminated:false})),
    playerIds:Array.from({length:playerCount},(_,index)=>index+1),
    factions:Object.fromEntries(Array.from({length:playerCount},(_,index)=>[index+1,["Nexus","Exordium","Liberti","Agathoi"][index] || "Nexus"])),
    modes:Object.fromEntries(Array.from({length:playerCount},(_,index)=>[index+1,"bot"])),
    units:[],
    cells:psControls.map((control,index)=>({coord:[index,-index,0],ps:true,control})),
    pressure:Object.fromEntries(Array.from({length:playerCount},(_,index)=>[index+1,0])),
    energy:Object.fromEntries(Array.from({length:playerCount},(_,index)=>[index+1,3])),
    desperation:Object.fromEntries(Array.from({length:playerCount},(_,index)=>[index+1,0])),
    psLocks:[],
    autoResignEnabled:false
  };
}

updateControlFromOccupants = function(){};

state = makeState(2, "standard", [1,1,2]);
equal(pressureMapScale(), 3, "2 giocatori e 3 PS producono C=3");
equal(pressureStartRound(), 23, "Standard parte al round 20+C");
equal(pressureWinLimit(), 7, "Standard richiede 7 incrementi");
equal(maxRoundLimit(), 50, "Standard termina al round 50");
equal(pressureControlThreshold(3), 2, "3 PS richiedono metà arrotondata per eccesso");
state.pacePreset = "competitive";
equal(pressureStartRound(), 20, "Rapida parte sempre al round 20");
equal(pressureWinLimit(), 5, "Rapida richiede 5 incrementi");
equal(maxRoundLimit(), 33, "Rapida termina al round 30+C");

state = makeState(4, "standard", [1,1,1,1,2,2,2]);
equal(pressureMapScale(), 6, "4 giocatori e 7 PS producono C=6");
equal(pressureStartRound(), 26, "Standard 4G/7PS parte al round 26");
equal(pressureControlThreshold(7), 4, "7 PS richiedono 4 controllati");
state.pacePreset = "competitive";
equal(maxRoundLimit(), 36, "Rapida 4G/7PS termina al round 36");

logs.length = 0;
state = makeState(4, "standard", [2,1,1,1,1,2,2]);
state.turn = 26;
resolveEndOfRound();
equal(state.pressure[1], 0, "4/7 senza PS centrale non genera Pressione");
ok(logs.some(line=>line.includes("PS centrale") && line.includes("4/7")), "log espone centro e soglia proporzionale");

logs.length = 0;
state = makeState(4, "standard", [1,1,1,1,2,2,2]);
state.turn = 26;
resolveEndOfRound();
equal(state.pressure[1], 1, "PS centrale incluso in 4/7 genera un incremento");
ok(logs.some(line=>line.includes("4/7") && line.includes("1/7")), "log espone avanzamento e limite Standard");

state = makeState(2, "competitive", [1,1,2]);
state.turn = 20;
resolveEndOfRound();
equal(state.pressure[1], 1, "Rapida 2G/3PS avanza con centro più un PS");
`;

new Function("assert", "console", "ok", "equal", source)(assert, console, ok, equal);

const render = read("src/render.js");
const css = read("css/style.css");
ok(render.includes("cellTerrainMarker") && render.includes("boardRenderTerrainMarkerText"), "renderer crea badge terreno persistenti");
ok(render.includes("cellOccupationTint") && render.includes("occupiedSide${unit.side}"), "renderer marca la fazione sulla cella occupata");
ok(render.includes("psControlFlag") && render.includes("PS controllato da"), "renderer crea bandiera PS controllato");
ok(css.includes("--token-faction-base-art-opacity: .28"), "alpha sfondo token aumentato da .22 a .28");
ok(css.includes(".cellTerrainMarker[data-terrain=\"difficult\"]") && css.includes(".cellTerrainMarker[data-terrain=\"defensive\"]") && css.includes(".cellTerrainMarker[data-terrain=\"exposed\"]"), "stili distinti per difficile, difensivo e scoperto");
ok(css.includes(".psControlFlag") && css.includes("--ps-flag-color"), "bandiera usa colore fazione runtime");

console.log(`F9Q3b/F9R3 pressure & battlefield readability smoke: ${checks}/${checks} OK`);
