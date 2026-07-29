"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => { assert.strictEqual(actual, expected, message); checks += 1; };
const deep = (actual, expected, message) => { assert.deepStrictEqual(actual, expected, message); checks += 1; };

const dataContext = { console };
vm.createContext(dataContext);
for (const rel of ["data/units_base.js", "data/tactics_cards_c2.js", "data/cards_base.js"]) {
  vm.runInContext(read(rel), dataContext, { filename:rel });
}
const factions = ["Nexus","Exordium","Liberti","Agathoi","Fabeot"];
const unitCounts = vm.runInContext(`Object.fromEntries(${JSON.stringify(factions)}.map(f=>[f,BLUEPRINTS.filter(x=>x.faction===f).length]))`, dataContext);
const tacticCounts = vm.runInContext(`Object.fromEntries(${JSON.stringify(factions)}.map(f=>[f,DECK_TACTICS.filter(x=>x.faction===f).length]))`, dataContext);
for (const faction of factions) {
  eq(unitCounts[faction], 23, `${faction} has 23 unit blueprints after F9S1b`);
  eq(tacticCounts[faction], 14, `${faction} has 14 deck tactics`);
}

const newUnitIds = ["NXS1A01","NXS1A02","NXS1A03","EXS1A01","EXS1A02","EXS1A03","LBS1A01","LBS1A02","LBS1A03","LBS1A04","LBS1A05","FBS1A01","FBS1A02","FBS1A03"];
const newTacticIds = ["NXTAC13","NXTAC14","EXTAC13","EXTAC14","AGTAC10","AGTAC11","AGTAC12","AGTAC13","AGTAC14","FABTAC13","FABTAC14"];
for (const id of newUnitIds) ok(vm.runInContext(`BLUEPRINTS.some(x=>x.id===${JSON.stringify(id)})`, dataContext), `${id} exists`);
for (const id of newTacticIds) ok(vm.runInContext(`DECK_TACTICS.some(x=>x.id===${JSON.stringify(id)}&&x.implementationStatus==="playable_f9s1a")`, dataContext), `${id} is playable F9S1a`);

eq(vm.runInContext(`BLUEPRINTS.find(x=>x.id==="NXS1A03").ability.selectionCount`, dataContext), 2, "Nexus artillery selects two cells");
eq(vm.runInContext(`BLUEPRINTS.find(x=>x.id==="EXS1A02").ability.selectionCount`, dataContext), 3, "Exordium mortar selects three cells");
eq(vm.runInContext(`BLUEPRINTS.find(x=>x.id==="LBS1A01").ability.kind`, dataContext), "f9s1Assassinate", "Liberti attacker uses sacrificial assassination runtime");
ok(vm.runInContext(`BLUEPRINTS.find(x=>x.id==="LBS1A02").postAttackMove===true`, dataContext), "Liberti Segugio has post-attack movement");
eq(vm.runInContext(`BLUEPRINTS.find(x=>x.id==="FBS1A01").ability.cost`, dataContext), 2, "Fabeot courier double move costs 2 ENE");
eq(vm.runInContext(`BLUEPRINTS.find(x=>x.id==="EXS1A03").deploymentRule.maxPerTurn`, dataContext), 1, "shipping depot deploys once per turn");
eq(vm.runInContext(`BLUEPRINTS.find(x=>x.id==="LBS1A05").deploymentRule.range`, dataContext), 2, "clan tent deploys at R2");

const builtInDeckSource = read("data/builtin_decks.js");
const integratedF9S1aCards = [...newUnitIds, ...newTacticIds].filter(id => builtInDeckSource.includes(id));
ok(integratedF9S1aCards.length >= 20, `F9S1c1 official roster intentionally integrates F9S1a cards (${integratedF9S1aCards.length}/25)`);

const runtimeSource = `
let pendingAbilityCoords=[], pendingTacticCoords=[];
let state={turn:7,modes:{1:"bot"},cells:[],units:[],mines:[],cellEffects:[]};
const logs=[], hits=[];
function log(m){logs.push(m);}
function coordKey(c){return c.join(",");}
function sameCoord(a,b){return a&&b&&a.every((v,i)=>v===b[i]);}
function hexDistance(a,b){return Math.max(...a.map((v,i)=>Math.abs(v-b[i])));}
function areAdjacent(a,b){return hexDistance(a,b)===1;}
function neighbors(c){const dirs=[[1,-1,0],[1,0,-1],[0,1,-1],[-1,1,0],[-1,0,1],[0,-1,1]];return dirs.map(d=>c.map((v,i)=>v+d[i]));}
function getCellAt(c){return state.cells.find(x=>sameCoord(x.coord,c))||null;}
function getUnitAt(c){return state.units.find(u=>u.alive&&u.pos&&sameCoord(u.pos,c))||null;}
function isCellEnterable(c){return Boolean(getCellAt(c));}
function getMapTerrainAt(){return null;}
function combatUnits(side=null){return state.units.filter(u=>u.alive&&(side===null||u.side===side));}
function enemyCombatUnits(side){return combatUnits(null).filter(u=>u.side!==side);}
function getHq(side){return {side,pos:[0,0,0]};}
function applyDamage(target,value,source,options={}){hits.push({target:target.uid,value,source,options}); if(options.directHp){target.currentHp-=value;} else if(target.currentDef>0){target.currentDef=Math.max(0,target.currentDef-value);} else target.currentHp-=value; if(target.currentHp<=0)target.alive=false;}
function applyStatus(target,status){target.statuses=target.statuses||[];target.statuses.push({...status});}
function purchaseLimitReached(){return false;}
function spawnCellsFor(){return state.cells.map(c=>c.coord).filter(c=>!getUnitAt(c));}
function c2c5cAvailableCapacity(){return 2;}
function c2c5cSpawnUnitFromTactic(player,bp,coord){const u={uid:"spawn"+(state.units.length+1),side:player,name:bp.name,type:bp.type,weight:bp.weight,currentHp:bp.hp,maxHp:bp.hp,currentDef:bp.def,maxDef:bp.def,currentAtt:bp.att,baseAtt:bp.att,pos:[...coord],alive:true,acted:true};state.units.push(u);return u;}
function handTacticSourceCells(){return [[0,0,0]];}
function normalizeHandTacticCard(c){return c;}
function confirm(){return true;}
const CARD_CATALOG_CONFIG={playableTacticIdsF9S1a:${JSON.stringify(newTacticIds)},playableTacticEffectKindsF9S1a:["f9s1_repair_choice","f9s1_reveal_stealth_area","f9s1_permanent_vision_att","f9s1_heal_vehicle","f9s1_green_fury","f9s1_damage_unit","f9s1_place_two_mines","f9s1_spawn_two_guardians","f9s1_permanent_vision_def","f9s1_double_hit"]};
${read("data/units_base.js")}
${read("src/f9s1_runtime.js")}
return {state,logs,hits,setState(v){state=v;},f9s1aCompleteAbilityCoords,f9s1aAbilityHandler,f9s1aDeploymentCostModifier,f9s1aConsumeDeploymentSource,f9s1aResolveTactic,f9s1aRestoreGreenFury,f9s1aTacticCellTargets};
`;
const rt = new Function(runtimeSource)();
const cells = [[0,0,0],[1,-1,0],[1,0,-1],[0,1,-1],[-1,1,0],[-1,0,1],[0,-1,1],[2,-1,-1],[2,-2,0]].map(coord=>({coord}));
const artillery={uid:"art",side:1,name:"Artiglieria Nexus",pos:[0,0,0],alive:true,currentHp:3,maxHp:3,currentDef:3,maxDef:3,currentAtt:2};
const enemy={uid:"enemy",side:2,name:"Enemy",type:"Fanteria",weight:"Pesante",pos:[1,-1,0],alive:true,currentHp:3,maxHp:3,currentDef:0,maxDef:0,currentAtt:2};
const ally={uid:"ally",side:1,name:"Ally",type:"Fanteria",pos:[1,0,-1],alive:true,currentHp:3,maxHp:3,currentDef:0,maxDef:0,currentAtt:2};
rt.setState({turn:7,modes:{1:"bot"},cells,units:[artillery,enemy,ally],mines:[],cellEffects:[]});
const pair=rt.f9s1aCompleteAbilityCoords(artillery,{pos:[1,-1,0]},{range:3,selectionCount:2});
eq(pair.length,2,"artillery autocompletes two cells");
ok(Math.max(...pair[0].map((v,i)=>Math.abs(v-pair[1][i])))===1,"artillery cells are adjacent");
eq(rt.f9s1aCompleteAbilityCoords(artillery,{pos:[1,-1,0],selectedCoords:[[1,-1,0],[0,1,-1]]},{range:3,selectionCount:2}).length,0,"invalid non-adjacent manual cell group is rejected");
rt.f9s1aAbilityHandler("f9s1CellBarrage",artillery,{pos:pair[0],selectedCoords:pair},{name:"Sbarramento",range:3,selectionCount:2,value:2});
ok(rt.hits.length>=1,"barrage resolves normal damage on occupied selected cells");

const repairer={uid:"repair",side:1,name:"Riparatore",pos:[0,0,0],alive:true};
const damaged={uid:"damaged",side:1,name:"Damaged",pos:[1,-1,0],alive:true,currentHp:1,maxHp:3,currentDef:0,maxDef:2};
rt.f9s1aAbilityHandler("f9s1RepairHpDef",repairer,damaged,{name:"Riparazione",value:1});
eq(damaged.currentHp,2,"repair restores one HP");
eq(damaged.currentDef,1,"repair restores one DEF");

const assassin={uid:"assassin",side:1,name:"Attentatore",type:"Fanteria",weight:"Pesante",alive:true,currentHp:1,currentDef:1,pos:[0,0,0]};
const victim={uid:"victim",side:2,name:"Victim",type:"Veicolo",weight:"Pesante",alive:true,currentHp:5,currentDef:2,pos:[1,-1,0]};
rt.f9s1aAbilityHandler("f9s1Assassinate",assassin,victim,{name:"Attentato"});
ok(!victim.alive,"Attentato destroys eligible target regardless of HP");
ok(!assassin.alive,"Attentato also destroys its user");

const depot={uid:"depot",side:1,name:"Deposito",type:"Struttura",alive:true,pos:[0,0,0],deploymentRule:{range:1,maxPerTurn:1,unitTypes:["Veicolo"],discount:-1,minCost:1,label:"Logistica"}};
const vehicle={id:"V",name:"Vehicle",type:"Veicolo",weight:"Pesante",cost:4};
rt.setState({turn:8,modes:{1:"bot"},cells,units:[depot],mines:[],cellEffects:[]});
const mod=rt.f9s1aDeploymentCostModifier(1,vehicle,[1,-1,0]);
eq(mod.value,-1,"deployment structure grants its local discount");
rt.f9s1aConsumeDeploymentSource(1,vehicle,[1,-1,0]);
eq(depot.f9s1aDeploymentUsedRound,8,"deployment source is consumed for the round");
eq(rt.f9s1aDeploymentCostModifier(1,vehicle,[1,0,-1]).value,0,"same deployment structure cannot discount twice in one turn");

const fury={uid:"fury",side:1,name:"Fury",type:"Fanteria",faction:"Agathoi",alive:true,currentHp:3,maxHp:3,currentAtt:4,currentDef:2,maxDef:4,pos:[0,0,0]};
rt.setState({turn:9,modes:{1:"bot"},cells,units:[fury],mines:[],cellEffects:[]});
rt.f9s1aResolveTactic(1,{sourceId:"AGTAC10",tacticId:"AGTAC10",effectKind:"f9s1_green_fury",name:"Furia Verde"},fury);
deep([fury.currentAtt,fury.currentDef],[2,4],"Furia Verde swaps current ATT and DEF");
fury.currentDef=3;
rt.f9s1aRestoreGreenFury(9);
deep([fury.currentAtt,fury.currentDef],[4,1],"Furia Verde restoration preserves DEF damage during swap");

const pointed={uid:"pointed",side:1,name:"Pointed",faction:"Exordium",type:"Veicolo",alive:true,currentAtt:2,baseAtt:2,att:2,currentDef:1,maxDef:1,tags:[],pos:[0,0,0]};
rt.setState({turn:10,modes:{1:"bot"},cells,units:[pointed],mines:[],cellEffects:[]});
rt.f9s1aResolveTactic(1,{sourceId:"EXTAC13",tacticId:"EXTAC13",effectKind:"f9s1_permanent_vision_att",name:"Puntatore Imperiale"},pointed);
eq(pointed.currentAtt,3,"Puntatore Imperiale grants permanent ATT");
ok(pointed.tags.includes("vision")&&pointed.visionRange===2,"Puntatore Imperiale grants Vision R2");

const doubleTarget={uid:"double",side:2,name:"Double",type:"Fanteria",alive:true,currentHp:3,maxHp:3,currentDef:1,maxDef:1,pos:[1,-1,0]};
rt.setState({turn:11,modes:{1:"bot"},cells,units:[doubleTarget],mines:[],cellEffects:[]});
const hitStart=rt.hits.length;
rt.f9s1aResolveTactic(1,{sourceId:"FABTAC13",tacticId:"FABTAC13",effectKind:"f9s1_double_hit",name:"Doppio Colpo",hitDamage:1,hitCount:2},doubleTarget);
eq(rt.hits.length-hitStart,2,"Doppio Colpo resolves two separate damage events");

const build=read("src/build_info.js");
ok(build.includes('version: "C2-STABLE-1-F9S1b1-APK-M4c"'),"F9S1b build metadata is current");
ok(read("index.html").includes('src/f9s1_runtime.js'),"F9S1a runtime is loaded by the app");
ok(read("src/deployment.js").includes("f9s1aConsumeDeploymentSource"),"deployment consumes one-use structure source");
ok(read("src/turns.js").includes("f9s1aRestoreGreenFury"),"round flow restores Furia Verde");
ok(read("src/combat.js").includes("f9s1aPostAttackMoveReady"),"combat exposes Segugio post-attack movement");

console.log(`F9S1a faction units & tactics expansion smoke: ${checks}/${checks} OK`);
