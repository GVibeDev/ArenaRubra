"use strict";
const fs=require("fs"), vm=require("vm"), assert=require("assert");
const ctx={console,Date,JSON,Math,Set,Map,botRunning:false,renderAll(){},log(){},playerName:s=>`G${s}`,
 EventTypes:{ECONOMY_CHANGED:"ECONOMY_CHANGED",CARD_DISCARDED:"CARD_DISCARDED",MISSION_PLAYED:"MISSION_PLAYED",MISSION_REWARD_PENDING:"MISSION_REWARD_PENDING",MISSION_REWARD_RESOLVED:"MISSION_REWARD_RESOLVED",CARD_PLAYED:"CARD_PLAYED"}, emitted:[]};
ctx.emitGameEvent=e=>{ctx.emitted.push(e);return e}; ctx.globalThis=ctx; vm.createContext(ctx);
for(const f of ["data/missions_base.js","src/missions.js","src/mission_rewards.js"]) vm.runInContext(fs.readFileSync(f,"utf8"),ctx,{filename:f});
ctx.state={turn:12,currentPlayer:1,winner:null,factions:{1:"Nexus",2:"Exordium"},modes:{1:"human",2:"human"},energy:{1:20,2:11},pressure:{1:0,2:0},cells:[],units:[],hand:{1:[],2:[]},deck:{1:[],2:[]},discard:{1:[],2:[]},missions:{1:null,2:null},missionRewards:{1:{cardCostSequence:null},2:{cardCostSequence:null}},missionPendingReward:null};
ctx.missionEvaluateSide=()=>{}; ctx.playerHandLocked=()=>false; ctx.handCardBlocked=()=>false; ctx.countControlledPS=()=>2;
ctx.isProtectedHandCard=c=>["mission","commander"].includes(c.deckRole)||c.sourceType==="mission";
ctx.discardableHandCards=side=>ctx.state.hand[side].filter(c=>!ctx.isProtectedHandCard(c));
ctx.discardCard=(side,uid)=>{const i=ctx.state.hand[side].findIndex(c=>c.cardUid===uid); if(i<0||ctx.isProtectedHandCard(ctx.state.hand[side][i]))return null; const [c]=ctx.state.hand[side].splice(i,1);c.zone="discard";ctx.state.discard[side].push(c);return c};
ctx.discardPlayedHandCard=(side,uid)=>{const i=ctx.state.hand[side].findIndex(c=>c.cardUid===uid);if(i<0)return null;const[c]=ctx.state.hand[side].splice(i,1);c.zone="discard";ctx.state.discard[side].push(c);return c};
let drawSeq=0;ctx.drawCards=(side,n)=>{const out=[];for(let i=0;i<n;i++){if(!ctx.state.deck[side].length)break;const c=ctx.state.deck[side].shift();c.zone="hand";ctx.state.hand[side].push(c);out.push(c)}return out};
ctx.c2c6aApplyCardDiscount=(card,value,source,min)=>{const b=card.cost;card.cost=Math.max(min,b+value);return b-card.cost};
ctx.missionUiCancelSelection=()=>true;ctx.missionUiOpenPanel=()=>true;
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++};const eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);checks++};
function card(uid,name,cost=2,extra={}){return{cardUid:uid,id:uid,name,cost,side:extra.side||1,sourceType:extra.sourceType||"unit",deckRole:extra.deckRole||"base",cardType:extra.cardType||"unit",zone:"hand",...extra}}
function prep(id){const d=ctx.missionDefinitionById(id);const r=ctx.createMissionRuntime(1,d);r.ready=true;r.status="ready";for(const e of Object.values(r.entries)){e.completed=true;e.satisfied=true}ctx.state.missions[1]=r;ctx.state.currentPlayer=1;ctx.state.modes[1]="human";ctx.state.missionPendingReward=null;ctx.state.missionRewards[1]={cardCostSequence:null};ctx.state.hand[1]=[card(`M_${id}`,d.name,0,{sourceType:"mission",deckRole:"mission",cardType:"mission",missionId:id,sourceId:id})];ctx.state.discard[1]=[];ctx.state.deck[1]=[];ctx.state.energy[1]=20;ctx.state.energy[2]=11;return{d,r}}

// NXMSN01: sequenza costo 0, -1, -1 e scarto Missione.
prep("NXMSN01");ok(ctx.missionPlayOrdinary(1),"Civiltà giocata");eq(ctx.state.discard[1][0].sourceType,"mission","Missione scartata");
let c=card("C1","Carta 1",5);eq(ctx.missionEffectiveCardCost(1,c,5),0,"prima carta gratis");ctx.missionConsumeCardCostSequence(1,c);
eq(ctx.missionEffectiveCardCost(1,c,5),4,"seconda carta -1");ctx.missionConsumeCardCostSequence(1,c);eq(ctx.missionEffectiveCardCost(1,c,5),4,"terza carta -1");ctx.missionConsumeCardCostSequence(1,c);eq(ctx.missionEffectiveCardCost(1,c,5),5,"sequenza esaurita");

// NXMSN02: 2 ENE per 2 PS.
prep("NXMSN02");ctx.missionPlayOrdinary(1);eq(ctx.state.energy[1],24,"Mainframe +4 ENE");

// Exordium x2: pesca 3 e sconto.
for(const id of ["EXMSN01","EXMSN02"]){prep(id);ctx.state.deck[1]=[card(`${id}A`,"A",3),card(`${id}B`,"B",2),card(`${id}C`,"C",1)];ctx.missionPlayOrdinary(1);eq(ctx.state.hand[1].length,3,`${id} pesca 3`);ok(ctx.state.hand[1].every(x=>x.cost>=0&&x.cost<=(x.cardUid.endsWith("A")?3:2)),`${id} sconto`)}

// Liberti Arena: pesca 5.
prep("LBMSN01");ctx.state.deck[1]=Array.from({length:5},(_,i)=>card(`L${i}`,`L${i}`,1));ctx.missionPlayOrdinary(1);eq(ctx.state.hand[1].length,5,"Arena pesca 5");
// Sangue e Sabbia: +5 ENE.
prep("LBMSN02");ctx.missionPlayOrdinary(1);eq(ctx.state.energy[1],25,"Sangue +5 ENE");
// Agathoi Tafos: pesca 5.
prep("AGMSN01");ctx.state.deck[1]=Array.from({length:5},(_,i)=>card(`A${i}`,`A${i}`,1));ctx.missionPlayOrdinary(1);eq(ctx.state.hand[1].length,5,"Tafos pesca 5");
// Erkos: +10.
prep("AGMSN02");ctx.missionPlayOrdinary(1);eq(ctx.state.energy[1],30,"Erkos +10");
// Ex Lucis: nemico perde metà floor 11=>5.
prep("FBMSN01");ctx.missionPlayOrdinary(1);eq(ctx.state.energy[2],6,"Ex Lucis perde 5");
// Cospirazione: avversario umano sceglie metà delle ordinarie, protette escluse.
prep("FBMSN02");ctx.state.hand[2]=[card("E1","E1",1,{side:2}),card("E2","E2",2,{side:2}),card("E3","E3",3,{side:2}),card("EC","Comandante",4,{side:2,deckRole:"commander",cardType:"commander"}),card("EM","Missione",0,{side:2,sourceType:"mission",deckRole:"mission",cardType:"mission"})];
ctx.missionPlayOrdinary(1);ok(ctx.missionInteractionBlocked(),"scelta pendente blocca interazioni");eq(ctx.missionPendingReward().required,1,"metà di 3 floor =1");ctx.missionRewardToggleDiscardSelection("E2");ok(ctx.missionRewardConfirmDiscardSelection(),"scarto scelto confermato");eq(ctx.state.hand[2].some(x=>x.cardUid==="E2"),false,"carta scelta scartata");ok(ctx.state.hand[2].some(x=>x.cardUid==="EC")&&ctx.state.hand[2].some(x=>x.cardUid==="EM"),"protette conservate");ok(!ctx.missionInteractionBlocked(),"blocco rimosso");

// Sicurezza: non pronta e disperata non sono giocabili in F9N8.
let secure=prep("NXMSN01");secure.r.ready=false;ok(!ctx.missionPlayOrdinary(1),"ordinaria incompleta bloccata");
secure=prep("NXMSND01");secure.r.ready=true;ok(!ctx.missionPlayOrdinary(1),"disperata rinviata a F9N9");

// Cospirazione contro bot: scelta automatica prudente e nessun pending.
prep("FBMSN02");ctx.state.modes[2]="bot";ctx.state.hand[2]=[card("B1","B1",1,{side:2}),card("B2","B2",4,{side:2}),card("B3","B3",2,{side:2}),card("BC","Comandante",4,{side:2,deckRole:"commander",cardType:"commander"})];ctx.missionPlayOrdinary(1);ok(!ctx.missionInteractionBlocked(),"bot risolve scarto senza pending");eq(ctx.state.hand[2].length,3,"bot scarta una ordinaria su tre");ctx.state.modes[2]="human";

for(const id of ["NXMSN01","NXMSN02","EXMSN01","EXMSN02","LBMSN01","LBMSN02","AGMSN01","AGMSN02","FBMSN01","FBMSN02"]){ok(ctx.missionDefinitionById(id).missionClass==="ordinary",`${id} ordinaria coperta`)}
console.log(`F9N8 ordinary missions smoke: ${checks}/${checks} OK`);
