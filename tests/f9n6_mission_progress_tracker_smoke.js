"use strict";
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const ctx = {
  console,
  Date,
  JSON,
  Math,
  Set,
  Map,
  BUILD_INFO:{version:"TEST-F9N6"},
  CENTER_PS_COORD:[0,0,0],
  EventTypes:{
    UNIT_SPAWNED:"UNIT_SPAWNED", UNIT_BUILT:"UNIT_BUILT", UNIT_ATTACKED:"UNIT_ATTACKED", UNIT_DAMAGED:"UNIT_DAMAGED", UNIT_DESTROYED:"UNIT_DESTROYED",
    ABILITY_USED:"ABILITY_USED", TACTIC_USED:"TACTIC_USED", STATUS_APPLIED:"STATUS_APPLIED", ECONOMY_CHANGED:"ECONOMY_CHANGED", UNIT_CONVERTED:"UNIT_CONVERTED",
    CARD_DRAWN:"CARD_DRAWN", CARD_PLAYED:"CARD_PLAYED", MISSION_PROGRESS_CHANGED:"MISSION_PROGRESS_CHANGED", MISSION_READY:"MISSION_READY", MISSION_CHECKPOINT:"MISSION_CHECKPOINT"
  },
  emitted:[],
  sameCoord(a,b){ return Boolean(a&&b&&a.length===3&&b.length===3&&a.every((v,i)=>v===b[i])); },
  hexDistance(a,b){ return Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2])); },
  areAdjacent(a,b){ return this.hexDistance(a,b)===1; },
  isProtectedHandCard(card){ return ["mission","commander"].includes(card.deckRole); },
  BLUEPRINTS:[
    {id:"U3",cost:3,type:"Fanteria",weight:"Pesante"},
    {id:"V3",cost:3,type:"Veicolo",weight:"Pesante"}
  ]
};
ctx.emitGameEvent = ev => { ctx.emitted.push(ev); return ev; };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const file of ["data/missions_base.js","src/missions.js"]) vm.runInContext(fs.readFileSync(file,"utf8"),ctx,{filename:file});
vm.runInContext("this.MISSION_DEFINITIONS = MISSION_DEFINITIONS;", ctx);

function unit(uid, side, type, pos, extra={}) { return {uid,side,type,pos,alive:true,...extra}; }
ctx.state = {
  factions:{1:"Nexus",2:"Exordium"}, turn:1, currentPlayer:1, energy:{1:3,2:3}, pressure:{1:0,2:0},
  cells:[
    {coord:[0,0,0],ps:true,control:null},
    {coord:[0,-4,4],ps:true,control:null},
    {coord:[0,4,-4],ps:true,control:null}
  ],
  units:[], hand:{1:[],2:[]}, deck:{1:[],2:[]}, discard:{1:[],2:[]}, missions:{1:null,2:null}
};
ctx.getHq = side => ({side,pos:side===1?[-6,0,6]:[6,0,-6]});
ctx.combatUnits = side => ctx.state.units.filter(u=>u.alive && u.type!=="QG" && (side==null || u.side===side));
ctx.countControlledPS = side => ctx.state.cells.filter(c=>c.ps&&c.control===side).length;

let checks=0;
function ok(value,msg){ assert.ok(value,msg); checks++; }
function eq(a,b,msg){ assert.deepStrictEqual(a,b,msg); checks++; }

// Tutte le definizioni e metriche sono coperte.
eq(ctx.MISSION_DEFINITIONS.length,15,"15 Missioni");
const supported=ctx.missionSupportedMetrics();
for (const def of ctx.MISSION_DEFINITIONS) {
  const items=ctx.missionObjectivesFor(def);
  eq(items.length,3,`${def.id} ha tre condizioni`);
  for (const item of items) ok(supported.has(item.metric),`${def.id}/${item.id} metrica supportata`);
}

// Missione facoltativa: assenza non genera tracker attivo.
ctx.state.missions[1]=ctx.createMissionRuntime(1,null);
eq(ctx.state.missions[1].status,"absent","assenza Missione");
ok(!ctx.state.missions[1].active,"Missione facoltativa inattiva");

// Consecutività owner_turns: cresce e si azzera se interrotta.
let def=ctx.missionDefinitionById("NXMSN01");
ctx.state.missions[1]=ctx.createMissionRuntime(1,def);
ctx.state.cells[0].control=1; ctx.state.cells[1].control=1;
ctx.missionEvaluateSide(1,"test",{checkpoint:"turn_start",side:1});
eq(ctx.state.missions[1].entries.o1.streak,1,"prima verifica consecutiva");
ctx.state.cells[1].control=null;
ctx.missionEvaluateSide(1,"test",{checkpoint:"turn_start",side:1});
eq(ctx.state.missions[1].entries.o1.streak,0,"serie interrotta azzerata");
ctx.state.cells[1].control=1;
ctx.missionEvaluateSide(1,"test",{checkpoint:"turn_start",side:1});
ctx.missionEvaluateSide(1,"test",{checkpoint:"turn_start",side:1});
ok(ctx.state.missions[1].entries.o1.completed,"serie completa dopo due turni");

// Contatori strutturati da eventi.
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.UNIT_BUILT,data:{player:1,coord:[0,1,-1]}});
eq(ctx.state.missions[1].counters.structuresBuiltNearObjective,1,"struttura vicino obiettivo");
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.UNIT_SPAWNED,data:{player:1,blueprintId:"U3",cost:3,spawnSource:"tactic"}});
eq(ctx.state.missions[1].counters.unitsDeployed,1,"schieramento conteggiato");
eq(ctx.state.missions[1].counters.unitsDeployedByTactics,1,"schieramento tattica");
eq(ctx.state.missions[1].counters.unitsDeployedMinCost,1,"schieramento costo 3+");
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.CARD_DRAWN,data:{player:1,count:2}});
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.CARD_PLAYED,data:{player:1}});
eq(ctx.state.missions[1].counters.cardsDrawn,2,"carte pescate");
eq(ctx.state.missions[1].counters.cardsPlayed,1,"carte giocate");

// Superiorità su bersagli distinti.
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.UNIT_ATTACKED,data:{attackerSide:1,defenderId:"E1",superiorityBonus:1}});
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.UNIT_ATTACKED,data:{attackerSide:1,defenderId:"E1",superiorityBonus:1}});
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.UNIT_ATTACKED,data:{attackerSide:1,defenderId:"E2",superiorityBonus:1}});
eq(ctx.state.missions[1].unique.numericalSuperiorityTargets.length,2,"bersagli distinti");

// Danni indiretti attribuiti al proprietario.
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.UNIT_DAMAGED,data:{sourceSide:1,source:"Sanguinamento",damageKind:"bleed",hpLoss:3}});
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.UNIT_DAMAGED,data:{sourceSide:1,source:"Spine",damageKind:"thorns",hpLoss:2}});
eq(ctx.state.missions[1].counters.bleedDamageDealt,3,"danno Sanguinamento");
eq(ctx.state.missions[1].counters.thornsDamageDealt,2,"danno Spine");

// Distruzioni tipizzate e attribuite.
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.UNIT_DESTROYED,data:{side:2,destroyedBySide:1,unitType:"Struttura",unitWeight:"Pesante"}});
eq(ctx.state.missions[1].counters.enemyUnitsDestroyed,1,"unità nemica distrutta");
eq(ctx.state.missions[1].counters.enemyStructuresDestroyed,1,"struttura nemica distrutta");
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.UNIT_DESTROYED,data:{side:1,destroyedBySide:2,unitType:"Veicolo",unitWeight:"Pesante"}});
eq(ctx.state.missions[1].counters.ownUnitsDestroyedByEnemy,1,"unità propria persa");
eq(ctx.state.missions[1].counters.ownHeavyVehiclesDestroyedByEnemy,1,"veicolo pesante proprio perso");

// Tag abilità/tattiche, marchi, dottrina, conversione ed ENE nemica.
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.ABILITY_USED,data:{player:1,missionTags:["ps_related","defensive_ability","enemy_energy_manipulation"]}});
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.TACTIC_USED,data:{player:1,missionTags:["ps_related","enemy_energy_manipulation"]}});
eq(ctx.state.missions[1].counters.taggedEffectsUsed.ps_related,2,"effetti PS");
eq(ctx.state.missions[1].counters.taggedEffectsUsed.defensive_ability,1,"abilità difensiva");
eq(ctx.state.missions[1].counters.enemyEnergyManipulations,2,"manipolazioni ENE");
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.STATUS_APPLIED,data:{owner:1,statusKind:"fabeot_vulnerable"}});
eq(ctx.state.missions[1].counters.marksApplied,1,"marchio");
ctx.state.factions[1]="Fabeot";
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.ECONOMY_CHANGED,data:{player:1,doctrineDelta:2}});
eq(ctx.state.missions[1].counters.energyGainedFromDoctrine,2,"ENE dottrina");
ctx.missionTrackerHandleEvent({type:ctx.EventTypes.UNIT_CONVERTED,data:{oldSide:2,newSide:1}});
eq(ctx.state.missions[1].counters.enemyFactionUnitsControlled,1,"conversione");

// Missione disperata pronta con una sola condizione, ordinaria solo con tutte.
def=ctx.missionDefinitionById("NXMSND01");
ctx.state.missions[1]=ctx.createMissionRuntime(1,def);
ctx.state.pressure[2]=3;
ctx.missionEvaluateSide(1,"test",{checkpoint:"event"});
ok(ctx.state.missions[1].ready,"disperata pronta con una condizione");
eq(ctx.state.missions[1].readyCount,1,"moltiplicatore base x1");

def=ctx.missionDefinitionById("LBMSN01");
ctx.state.missions[1]=ctx.createMissionRuntime(1,def);
ctx.state.missions[1].counters.unitsDeployed=10;
ctx.state.missions[1].unique.numericalSuperiorityTargets=["a","b","c","d","e"];
ctx.state.hand[1]=[{deckRole:"mission"},{deckRole:"commander"}];
ctx.missionEvaluateSide(1,"test",{checkpoint:"event"});
ok(ctx.state.missions[1].ready,"ordinaria pronta con tutti gli obiettivi");

// Reset ciclo: progressi azzerati e ciclo incrementato.
const beforeCycle=ctx.state.missions[1].cycle;
ctx.missionResetCycle(1);
eq(ctx.state.missions[1].cycle,beforeCycle+1,"ciclo incrementato");
eq(ctx.state.missions[1].counters.unitsDeployed,0,"progressi azzerati");
ok(!ctx.state.missions[1].ready,"nuovo ciclo non pronto");

const diag=ctx.missionDiagnosticsForSide(1);
ok(diag && Array.isArray(diag.objectives) && diag.objectives.length===3,"diagnostica leggibile");
console.log(`F9N6 mission tracker smoke: ${checks}/${checks} OK`);
