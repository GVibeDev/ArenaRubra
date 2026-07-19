"use strict";
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const ctx = {
  console, Date, JSON, Math, Set, Map,
  BUILD_INFO:{version:"TEST-F9N7a"},
  CENTER_PS_COORD:[0,0,0],
  EventTypes:{
    MISSION_PROGRESS_CHANGED:"MISSION_PROGRESS_CHANGED",
    MISSION_READY:"MISSION_READY",
    MISSION_CHECKPOINT:"MISSION_CHECKPOINT",
    MISSION_REVEALED:"MISSION_REVEALED"
  },
  emitted:[], logs:[], renders:0,
  emitGameEvent(ev){ ctx.emitted.push(ev); return ev; },
  log(message){ ctx.logs.push(String(message)); },
  playerName(side){ return `G${side}`; },
  sameCoord(a,b){ return Boolean(a&&b&&a.length===3&&b.length===3&&a.every((v,i)=>v===b[i])); },
  hexDistance(a,b){ return Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2])); },
  areAdjacent(a,b){ return this.hexDistance(a,b)===1; },
  renderAll(){ ctx.renders += 1; },
  clearSelection(){ ctx.mode="idle"; },
  mode:"idle",
  botRunning:false,
  handCardBlocked(){ return false; },
  playerHandLocked(side){ return Boolean(ctx.state.handLocked && ctx.state.handLocked[side]); },
  copyMissionDiagnosticsJson(){ return "{}"; }
};
ctx.globalThis=ctx;
vm.createContext(ctx);
for (const f of ["data/missions_base.js","src/missions.js","src/mission_ui.js"]) {
  vm.runInContext(fs.readFileSync(f,"utf8"),ctx,{filename:f});
}
vm.runInContext("this.MISSION_DEFINITIONS=MISSION_DEFINITIONS; this.MISSION_UI_STATE=MISSION_UI_STATE;",ctx);

function missionCard(id, side){
  return {id:`MISSION:${id}`,sourceId:id,missionId:id,sourceType:"mission",cardType:"mission",deckRole:"mission",cardUid:`m${side}`,side,zone:"hand"};
}
ctx.state={
  factions:{1:"Nexus",2:"Exordium"}, currentPlayer:1, turn:4, winner:null,
  modes:{1:"human",2:"bot"}, handLocked:{1:0,2:0},
  energy:{1:12,2:3}, pressure:{1:0,2:0},
  cells:[{coord:[0,0,0],ps:true,control:1},{coord:[0,-4,4],ps:true,control:1},{coord:[0,4,-4],ps:true,control:null}],
  units:[],
  hand:{1:[missionCard("NXMSN01",1)],2:[missionCard("EXMSN01",2)]}, deck:{1:[],2:[]}, discard:{1:[],2:[]},
  missions:{1:null,2:null}
};
ctx.getHq=side=>({side,pos:side===1?[-6,0,6]:[6,0,-6]});
ctx.combatUnits=()=>[];
ctx.countControlledPS=side=>ctx.state.cells.filter(c=>c.ps&&c.control===side).length;
ctx.state.missions[1]=ctx.createMissionRuntime(1,ctx.missionDefinitionById("NXMSN01"));
ctx.state.missions[2]=ctx.createMissionRuntime(2,ctx.missionDefinitionById("EXMSN01"));

let checks=0;
function ok(v,m){assert.ok(v,m);checks++;}
function eq(a,b,m){assert.strictEqual(a,b,m);checks++;}

ok(ctx.missionUiCanViewDetails(1,1),"propria Missione visibile");
ok(ctx.missionUiCanViewDetails(1,2),"Missione avversaria visibile anche se bot");
ok(ctx.missionUiCanViewDetails(2,1),"visibilità indipendente dal giocatore corrente");
let html=ctx.missionUiDashboardHtml(1);
ok(html.includes("Civiltà Algoritmica"),"dashboard mostra Missione G1");
ok(html.includes("Triumphale Iter"),"dashboard mostra Missione G2");
ok(!html.includes("MISSIONE NASCOSTA"),"nessun pannello Missione nascosto");
ok(html.includes("F9N10 · Missioni su cicli multipli"),"titolo aggiornato F9N10");
ok(html.includes("Runtime Missioni disperate non disponibile") || html.includes("Gioca Missione"),"azione Missione presente");
ok(!html.includes("Prepara rivelazione"),"controlli rivelazione rimossi dalla UI");

eq(ctx.missionUiStatus(1).key,"tracking","stato iniziale in corso");
ctx.state.missions[1].ready=true;
ctx.state.missions[1].readyCount=3;
eq(ctx.missionUiStatus(1).key,"ready","stato pronta");
ctx.state.handLocked[1]=1;
eq(ctx.missionUiStatus(1).key,"blocked","stato bloccata");
ctx.state.handLocked[1]=0;

html=ctx.missionUiMapBadgeHtml(1);
ok(html.includes("Civiltà Algoritmica"),"badge mappa mostra nome Missione");
ok(html.includes("PRONTA"),"badge mappa mostra stato");

console.log(`F9N7a mission UI smoke: ${checks}/${checks} OK`);
