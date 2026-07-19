"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");
const assert = require("assert");
const root = path.resolve(__dirname, "..");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => { assert.deepStrictEqual(actual, expected, message); checks += 1; };

const emitted = [];
const state = {
  factions:{1:"Nexus",2:"Exordium"},
  turn:7,
  units:[
    {uid:"hq1",side:1,type:"QG",alive:true,pos:[-6,0,6]},
    {uid:"hq2",side:2,type:"QG",alive:true,pos:[6,0,-6]},
    {uid:"enemy",side:2,type:"Fanteria",alive:true,pos:[-2,0,2],name:"Legionario"}
  ]
};
const ctx = {
  console, Object, Array, Number, Boolean, Math, Date, Map, Set, setTimeout, clearTimeout,
  state,
  BLUEPRINTS:[
    {id:"CMD",name:"Avatex",type:"Comandante",weight:"Base"},
    {id:"PIV",name:"Fortezza Mobile",type:"Veicolo",weight:"Pivot"}
  ],
  MISSION_DEFINITIONS:[
    {id:"ORD",name:"Ordinaria",missionClass:"ordinary",objectives:[{id:"o1",text:"Obiettivo"}]},
    {id:"DESP",name:"Disperata",missionClass:"desperate",conditions:[{id:"c1",text:"Condizione uno"},{id:"c2",text:"Condizione due"},{id:"c3",text:"Condizione tre"}]}
  ],
  missionDefinitionById:id => ctx.MISSION_DEFINITIONS.find(m => m.id === id),
  getHq:side => state.units.find(u => u.type === "QG" && u.side === side),
  hexDistance:(a,b) => Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2])),
  emitGameEvent:event => { emitted.push(event); return event; },
  EventTypes:{HQ_THREATENED:"HQ_THREATENED"}
};
vm.createContext(ctx);
const source = fs.readFileSync(path.join(root,"src/event_overlay.js"),"utf8") + `
this.__desc=eventOverlayDescriptorsForGameEvent;
this.__enqueue=eventOverlayEnqueue;
this.__diag=eventOverlayDiagnostics;
this.__clear=eventOverlayClear;
this.__threat=eventOverlayEvaluateHqThreats;
this.__nOpen=narrativeOpen;
this.__nNext=narrativeNext;
this.__nPrev=narrativePrevious;
this.__nCurrent=narrativeCurrentMessage;
this.__nDiag=narrativeDiagnostics;
this.__nRegister=narrativeRegisterPortraitSet;
`;
vm.runInContext(source,ctx);

// Eventi richiesti.
eq(ctx.__desc({type:"TURN_STARTED",data:{player:1,faction:"Nexus",round:2}})[0].title,"INIZIO TURNO","inizio turno");
eq(ctx.__desc({type:"PS_CONTROL_CHANGED",data:{previousControl:null,nextControl:1,coord:[0,0,0],round:2}})[0].title,"PS OCCUPATO","PS occupato");
eq(ctx.__desc({type:"PS_CONTROL_CHANGED",data:{previousControl:1,nextControl:null,coord:[0,0,0],round:2}})[0].title,"PS LIBERATO","PS liberato");
eq(ctx.__desc({type:"UNIT_SPAWNED",data:{player:1,faction:"Nexus",unitId:"c",unitName:"Avatex",blueprintId:"CMD"}})[0].title,"COMANDANTE IN GIOCO","comandante in gioco");
eq(ctx.__desc({type:"UNIT_SPAWNED",data:{player:1,faction:"Nexus",unitId:"p",unitName:"Fortezza Mobile",blueprintId:"PIV"}})[0].title,"PIVOT IN GIOCO","pivot in gioco");
eq(ctx.__desc({type:"UNIT_DESTROYED",data:{unitId:"c",unitName:"Avatex",unitType:"Comandante",side:1,faction:"Nexus"}})[0].title,"COMANDANTE SCONFITTO","comandante sconfitto");
eq(ctx.__desc({type:"UNIT_DESTROYED",data:{unitId:"p",unitName:"Fortezza",unitWeight:"Pivot",side:1,faction:"Nexus"}})[0].title,"PIVOT DISTRUTTA","pivot distrutta");
eq(ctx.__desc({type:"MISSION_READY",data:{player:1,faction:"Nexus",missionId:"ORD",missionName:"Ordinaria",cycle:1}})[0].title,"MISSIONE SUPERATA","missione ordinaria pronta");
eq(ctx.__desc({type:"MISSION_PROGRESS_CHANGED",data:{player:1,missionId:"DESP",missionName:"Disperata",objectiveId:"c2",completed:true,previous:{completed:false}}})[0].title,"MISSIONE DISPERATA · 2/3","condizione disperata");
eq(ctx.__desc({type:"MISSION_PLAYED",data:{player:1,faction:"Nexus",missionId:"ORD",missionName:"Ordinaria",cycle:1}})[0].title,"CARTA MISSIONE GIOCATA","missione giocata");
eq(ctx.__desc({type:"DECK_EXHAUSTED",data:{player:1,faction:"Nexus",round:5}})[0].title,"DECK TERMINATO","deck terminato");
eq(ctx.__desc({type:"DECK_RECOVERED",data:{player:1,faction:"Nexus",deckSize:21,missionCycle:2}})[0].title,"DECK RIMESCOLATO","deck recuperato");
eq(ctx.__desc({type:"PRESSURE_CHANGED",data:{player:1,faction:"Nexus",delta:1,current:2,limit:5,round:8}})[0].title,"AUMENTO PRESSIONE","pressione");
eq(ctx.__desc({type:"CARD_STOLEN",data:{toSide:1,toFaction:"Nexus",cardUid:"x",cardName:"Carta"}})[0].title,"CARTA RUBATA","carta rubata");
eq(ctx.__desc({type:"CARD_BLOCKED",data:{enemy:2,enemyFaction:"Exordium",count:2,source:"Embargo"}})[0].title,"CARTE BLOCCATE","carte bloccate");
eq(ctx.__desc({type:"UNIT_CONVERTED",data:{unitId:"u",unitName:"Unità",newSide:1,newFaction:"Nexus"}})[0].title,"UNITÀ CONVERTITA","conversione");
eq(ctx.__desc({type:"VICTORY",data:{winner:1,winnerFaction:"Nexus",round:9,winType:"qg"}})[0].title,"VITTORIA","vittoria");

// Threat QG emesso una sola volta per episodio.
ctx.__threat({type:"UNIT_MOVED"});
eq(emitted.length,1,"QG minacciato emesso");
eq(emitted[0].type,"HQ_THREATENED","tipo evento minaccia");
ctx.__threat({type:"UNIT_MOVED"});
eq(emitted.length,1,"nessun duplicato durante stesso episodio");
state.units.find(u=>u.uid==="enemy").pos=[4,0,-4];
ctx.__threat({type:"UNIT_MOVED"});
state.units.find(u=>u.uid==="enemy").pos=[-2,0,2];
ctx.__threat({type:"UNIT_MOVED"});
eq(emitted.length,2,"nuovo episodio dopo uscita e rientro");

// Coda e deduplica senza DOM.
ctx.__clear();
ok(ctx.__enqueue({title:"A",message:"B",key:"same"}),"primo enqueue");
eq(ctx.__enqueue({title:"A",message:"B",key:"same"}),false,"deduplica ravvicinata");
ok(ctx.__diag().queue.length===1,"coda diagnostica");

// Fondazione narrativa: cinque espressioni, navigazione e registry.
ok(ctx.__nRegister("guide",{neutral:"n.webp",warning:"w.webp"}),"registro portrait set");
const opened = ctx.__nOpen([
  {speaker:"Guida",text:"Uno",portraitSet:"guide",expression:"neutral"},
  {speaker:"Guida",text:"Due",portraitSet:"guide",expression:"warning",side:"right"}
]);
// Senza DOM narrativeOpen restituisce false al render, ma lo stato è inizializzato.
eq(opened,false,"render assente in Node");
eq(ctx.__nCurrent().text,"Uno","messaggio corrente");
eq(ctx.__nNext(),false,"next senza DOM aggiorna stato ma non renderizza");
eq(ctx.__nCurrent().text,"Due","navigazione avanti");
eq(ctx.__nPrev(),false,"previous senza DOM");
eq(ctx.__nCurrent().text,"Uno","navigazione indietro");
eq(ctx.__nDiag().expressions.length,5,"cinque espressioni supportate");

// Contratti statici del runtime.
const eventsCode = fs.readFileSync(path.join(root,"src/events.js"),"utf8");
ok(eventsCode.includes("eventOverlayEnqueueGameEvent(normalized)"),"hook centrale eventi");
const turnsCode = fs.readFileSync(path.join(root,"src/turns.js"),"utf8");
ok(turnsCode.includes("firstTurn:true"),"evento anche al primo turno");
const rulesCode = fs.readFileSync(path.join(root,"src/rules.js"),"utf8");
ok(rulesCode.includes("EventTypes.PRESSURE_CHANGED"),"pressione tipizzata");
const deckCode = fs.readFileSync(path.join(root,"src/deck.js"),"utf8");
ok(deckCode.includes("maybeEmitDeckExhausted"),"deck terminato tipizzato");
const css = fs.readFileSync(path.join(root,"css/style.css"),"utf8");
ok(css.includes("@keyframes arenaEventRise"),"animazione verticale");
ok(css.includes("opacity: .23"),"alpha bordo 23 percento");

console.log(`F9O3 event/narrative overlay smoke: ${checks}/${checks} OK`);
