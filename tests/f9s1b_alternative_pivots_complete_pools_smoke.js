"use strict";

const assert=require("assert");
const fs=require("fs");
const path=require("path");
const vm=require("vm");
const root=path.resolve(__dirname,"..");
const read=rel=>fs.readFileSync(path.join(root,rel),"utf8");
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks+=1;};
const eq=(a,b,m)=>{assert.strictEqual(a,b,m);checks+=1;};
const deep=(a,b,m)=>{assert.deepStrictEqual(a,b,m);checks+=1;};

const ctx={console}; vm.createContext(ctx);
for(const rel of ["data/units_base.js","data/tactics_cards_c2.js","data/missions_base.js","data/cards_base.js","src/cards.js"]){vm.runInContext(read(rel),ctx,{filename:rel});}
const factions=["Nexus","Exordium","Liberti","Agathoi","Fabeot"];
for(const faction of factions){
  eq(vm.runInContext(`BLUEPRINTS.filter(x=>x.faction===${JSON.stringify(faction)}).length`,ctx),23,`${faction}: 23 unità`);
  eq(vm.runInContext(`DECK_TACTICS.filter(x=>x.faction===${JSON.stringify(faction)}).length`,ctx),14,`${faction}: 14 tattiche`);
  eq(vm.runInContext(`MISSION_DEFINITIONS.filter(x=>x.faction===${JSON.stringify(faction)}).length`,ctx),3,`${faction}: 3 Missioni`);
  eq(vm.runInContext(`buildCardCatalog().filter(x=>x.faction===${JSON.stringify(faction)}).length`,ctx),40,`${faction}: 40 carte totali`);
  eq(vm.runInContext(`BLUEPRINTS.filter(x=>x.faction===${JSON.stringify(faction)}&&x.weight==="Pivot").length`,ctx),2,`${faction}: 2 Pivot alternative`);
}
const ids=["NXPIV02","EXPIV02","LXPIV02","AGPIV02","FBPIV02"];
for(const id of ids) ok(vm.runInContext(`BLUEPRINTS.some(x=>x.id===${JSON.stringify(id)})`,ctx),`${id} presente`);
eq(vm.runInContext(`BLUEPRINTS.find(x=>x.id==="NXPIV02").twilightDefShred`,ctx),1,"UCB Tramonto -1 DEF");
eq(vm.runInContext(`BLUEPRINTS.find(x=>x.id==="EXPIV02").effectDamageReduction`,ctx),1,"Mech riduce danno effetti di 1");
eq(vm.runInContext(`BLUEPRINTS.find(x=>x.id==="LXPIV02").bleedValue`,ctx),2,"Camion applica Sanguinamento 2");
eq(vm.runInContext(`BLUEPRINTS.find(x=>x.id==="AGPIV02").passiveThorns`,ctx),2,"Giganthropos ha Spine 2");
eq(vm.runInContext(`BLUEPRINTS.find(x=>x.id==="FBPIV02").adjacentDamageAmp`,ctx),1,"Torre amplifica di 1");
eq(vm.runInContext(`CARD_CATALOG_CONFIG.officialFactionCardCountF9S1b`,ctx),40,"config pool 40 carte");

const builtin=read("data/builtin_decks.js");
for(const id of ids) ok(builtin.includes(id),`${id} integrata esplicitamente nel roster ufficiale F9S1c1`);
ok(read("src/deck.js").includes('if (pivotCopies > 1)'),"validazione runtime mantiene massimo una Pivot");
ok(read("src/deck_builder.js").includes('if (pivotCopies > 1)'),"Deck Builder mantiene massimo una Pivot");

const runtimeSource=`
let pendingAbilityCoords=[];
let state={turn:4,currentPlayer:1,cells:[],units:[]};
const logs=[],hits=[],statuses=[];
const EventTypes={UNIT_DAMAGED:"UNIT_DAMAGED"};
function log(m){logs.push(m);}
function coordKey(c){return c.join(",");}
function sameCoord(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.every((v,i)=>v===b[i]);}
function hexDistance(a,b){return Math.max(...a.map((v,i)=>Math.abs(v-b[i])));}
function areAdjacent(a,b){return hexDistance(a,b)===1;}
function getCellAt(c){return state.cells.find(x=>sameCoord(x.coord,c))||null;}
function getUnitAt(c){return state.units.find(u=>u.alive&&u.pos&&sameCoord(u.pos,c))||null;}
function combatUnits(side=null){return state.units.filter(u=>u.alive&&(side===null||u.side===side));}
function enemyCombatUnits(side){return combatUnits(null).filter(u=>u.side!==side);}
function applyStatus(target,status){target.statuses=target.statuses||[];target.statuses.push({...status});statuses.push({target:target.uid,...status});}
function applyDamage(target,amount,source,options={}){hits.push({target:target.uid,amount,source,options}); if(target.currentDef>0&&!options.directHp){target.currentDef=Math.max(0,target.currentDef-amount);}else{target.currentHp-=amount;if(target.currentHp<=0)target.alive=false;}}
${read("src/f9s1_runtime.js")}
${read("src/f9s1b_runtime.js")}
return {state,logs,hits,statuses,setState(v){state=v;},f9s1bApplyEndTurnPassives,f9s1bAbilityHandler,f9s1bCompleteLineCoords,f9s1bAdjustIncomingDamage,f9s1bAbilityLineTargets};`;
const rt=new Function(runtimeSource)();
const coords=[]; for(let q=-3;q<=3;q++)for(let r=-3;r<=3;r++){const s=-q-r;if(Math.max(Math.abs(q),Math.abs(r),Math.abs(s))<=3)coords.push([q,r,s]);}
const cells=coords.map(coord=>({coord}));

const ucb={uid:"ucb",side:1,name:"UCB",type:"Veicolo",alive:true,pos:[0,0,0],twilightDefShred:1};
const e1={uid:"e1",side:2,name:"Nemico 1",type:"Fanteria",weight:"Pesante",alive:true,pos:[1,-1,0],currentDef:2,currentHp:3};
const e2={uid:"e2",side:3,name:"Nemico 2",type:"Veicolo",weight:"Leggero",alive:true,pos:[0,1,-1],currentDef:0,currentHp:3};
rt.setState({turn:4,currentPlayer:1,cells,units:[ucb,e1,e2]});
rt.f9s1bApplyEndTurnPassives(1);
eq(e1.currentDef,1,"Tramonto riduce la DEF corrente di 1");
eq(e2.currentDef,0,"Tramonto non porta la DEF sotto zero");
rt.f9s1bAbilityHandler("f9s1bAdjacentMoveLock",ucb,ucb,{name:"Trappola"});
eq(rt.statuses.filter(x=>x.kind==="inhibit_move").length,2,"Trappola blocca tutti i nemici adiacenti");

const mech={uid:"mech",side:1,name:"Mech",type:"Veicolo",alive:true,pos:[0,0,0],currentHp:5,currentDef:4};
const lineEnemyA={uid:"la",side:2,name:"A",type:"Fanteria",alive:true,pos:[1,0,-1],currentHp:3,currentDef:0};
const lineEnemyB={uid:"lb",side:2,name:"B",type:"Fanteria",alive:true,pos:[1,-2,1],currentHp:3,currentDef:0};
rt.setState({turn:4,currentPlayer:1,cells,units:[mech,lineEnemyA,lineEnemyB]});
eq(rt.f9s1bCompleteLineCoords(mech,{selectedCoords:[[0,0,0],[1,-1,0]]},{range:2}).length,0,"Soppressione non può includere la cella del Mech");
const line=rt.f9s1bCompleteLineCoords(mech,{selectedCoords:[[1,-1,0],[1,0,-1]]},{range:2});
deep(line,[[1,-1,0],[1,0,-1],[1,-2,1]],"Soppressione genera 3 celle collineari fuori dalla cella del Mech");
rt.f9s1bAbilityHandler("f9s1bLineSuppression",mech,{selectedCoords:[[1,-1,0],[1,0,-1]]},{name:"Soppressione",range:2,value:2});
ok(rt.hits.some(x=>x.target==="la")&&rt.hits.some(x=>x.target==="lb"),"Soppressione colpisce entrambe le estremità occupate");

const truck={uid:"truck",side:1,name:"Camion",type:"Veicolo",alive:true,pos:[0,0,0],currentHp:4,currentDef:3};
const heavy={uid:"heavy",side:2,name:"Pesante",type:"Veicolo",weight:"Pesante",alive:true,pos:[1,-1,0],currentHp:6,currentDef:3};
rt.setState({turn:4,currentPlayer:1,cells,units:[truck,heavy]});
rt.f9s1bAbilityHandler("f9s1bCrash",truck,heavy,{name:"Schianto"});
eq(heavy.currentDef,0,"Schianto rimuove 1 DEF ai Pesanti prima del danno 4");

const giga={uid:"giga",side:1,name:"Giganthropos",type:"Veicolo",alive:true,pos:[0,0,0],currentHp:6,currentDef:5};
const erkosTarget={uid:"erkos",side:2,name:"Bersaglio",type:"Fanteria",alive:true,pos:[1,-1,0],currentHp:4,currentDef:0};
rt.setState({turn:4,currentPlayer:1,cells,units:[giga,erkosTarget]});
rt.f9s1bAbilityHandler("f9s1bErkos",giga,erkosTarget,{name:"Erkos",value:2});
eq(erkosTarget.currentHp,2,"Erkos infligge 2 danni");
ok(rt.statuses.some(x=>x.target==="erkos"&&x.kind==="inhibit_move"),"Erkos applica blocco movimento");

const tower={uid:"tower",side:1,name:"Torre",type:"Struttura",alive:true,pos:[0,0,0],adjacentDamageAmp:1};
const reactive={uid:"reactive",side:2,name:"Mech Reattivo",type:"Veicolo",alive:true,pos:[1,-1,0],effectDamageReduction:1};
rt.setState({turn:4,currentPlayer:1,cells,units:[tower,reactive]});
eq(rt.f9s1bAdjustIncomingDamage(reactive,2,"abilità",{ability:true},"ability",1),2,"aura +1 e Corazza -1 producono danno finale 2");
eq(rt.f9s1bAdjustIncomingDamage(reactive,2,"attacco",{baseAttack:true},"attack",1),3,"Corazza non riduce gli attacchi base ma la Torre amplifica");
eq(rt.f9s1bAdjustIncomingDamage(reactive,2,"abilità alleata",{ability:true},"ability",2),3,"Corazza non riduce effetti della propria fazione");

ok(read("src/abilities.js").includes('ab.target === "cell_line"'),"abilità riconosce target lineare");
ok(read("src/controller.js").includes('["cell_group","cell_line"]'),"controller gestisce selezione multi-cella lineare");
ok(read("src/combat.js").includes("f9s1bAdjustIncomingDamage"),"combat integra amplificazione/riduzione F9S1b");
ok(read("src/turns.js").includes("f9s1bApplyEndTurnPassives"),"turn flow integra Tramonto");
ok(read("src/ai.js").includes('ab.kind === "f9s1bLineSuppression"'),"IA valuta Soppressione");
ok(read("index.html").includes('src/f9s1b_runtime.js'),"runtime F9S1b caricato");
ok(read("src/build_info.js").includes('version: "C2-STABLE-1-F9S1b1-APK-M4c"'),"metadata build F9S1b");

console.log(`F9S1b alternative pivots smoke: ${checks}/${checks} OK`);
