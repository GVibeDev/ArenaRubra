"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert");
const ROOT=path.resolve(__dirname,".."); let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++}; const equal=(a,e,m)=>{assert.strictEqual(a,e,m);checks++};
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.join(",")===b.join(",");
const distance=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2]));
const state={aiMode:"expert",modes:{1:"bot",2:"bot"},turn:12,currentPlayer:1,factions:{1:"Exordium",2:"Nexus"},playerIds:[1,2],energy:{1:5,2:5},pressure:{1:0,2:0},mapId:"conversion-test",mapDefinition:{id:"conversion-test",name:"Conversion Test",movementMultiplier:1},cells:[
 {coord:[-5,5,0],ps:false,control:null},{coord:[5,-5,0],ps:false,control:null},{coord:[0,0,0],ps:true,control:2},{coord:[2,-2,0],ps:true,control:2},{coord:[-1,0,1],ps:false,control:null},{coord:[0,-1,1],ps:false,control:null},{coord:[1,0,-1],ps:false,control:null}],
 units:[
 {uid:"hq-ex",side:1,faction:"Exordium",type:"QG",pos:[-5,5,0],alive:true},
 {uid:"hq-nx",side:2,faction:"Nexus",type:"QG",pos:[5,-5,0],alive:true},
 {uid:"target",id:"NX-GUARD",name:"Presidio Nexus",side:2,faction:"Nexus",type:"Fanteria",cost:2,att:1,currentHp:4,currentDef:0,pos:[0,0,0],alive:true,acted:false},
 {uid:"atk1",name:"Legionario A",side:1,faction:"Exordium",type:"Fanteria",cost:2,att:2,currentHp:3,currentDef:0,pos:[-1,0,1],alive:true,acted:false},
 {uid:"atk2",name:"Legionario B",side:1,faction:"Exordium",type:"Fanteria",cost:2,att:2,currentHp:3,currentDef:0,pos:[0,-1,1],alive:true,acted:false},
 {uid:"builder",name:"Apotecario Exordium",side:1,faction:"Exordium",type:"Fanteria",cost:1,att:1,currentHp:2,currentDef:0,pos:[1,0,-1],alive:true,acted:false}],
 hand:{1:[{cardUid:"card-bastion",sourceType:"unit",blueprintId:"EX4B02",name:"Bastione Armato"}],2:[]},starterCards:{1:{},2:{}}};
const BLUEPRINTS=[{id:"EX4B02",faction:"Exordium",name:"Bastione Armato",type:"Struttura",weight:"Leggera",cost:2,hp:3,att:0,def:2}];
const eventNames=["UNIT_DESTROYED","AI_EXPERT_TURN_STARTED","AI_EXPERT_CONTEXT_CREATED","AI_EXPERT_MODULE_ROUTED","AI_MICROPLAN_SELECTED","AI_MICROPLAN_STEP","AI_MICROPLAN_COMPLETED","AI_MICROPLAN_ABORTED","AI_EXPERT_DECISION","AI_EXPERT_FALLBACK","AI_EXPERT_BUDGET_EXHAUSTED","AI_EXPERT_TURN_COMPLETED"];
const EventTypes=Object.fromEntries(eventNames.map(x=>[x,x])),emitted=[]; let now=1;
const getUnitAt=c=>state.units.find(u=>u.alive!==false&&Array.isArray(u.pos)&&same(u.pos,c))||null;
const context=vm.createContext({console,Map,Set,Object,Array,Number,String,Boolean,Math,JSON,Date,state,BLUEPRINTS,EventTypes,
 performance:{now:()=>now+=.1,memory:{usedJSHeapSize:4096}},emitGameEvent:e=>{emitted.push(JSON.parse(JSON.stringify(e)));return e},telemetryRecordExpertDecisionF9T1:()=>{},
 getEnemyPlayers:p=>[1,2].filter(s=>s!==p),getHq:s=>state.units.find(u=>u.type==="QG"&&u.side===s),combatUnits:s=>state.units.filter(u=>u.alive!==false&&u.side===s&&u.type!=="QG"),countControlledPS:s=>state.cells.filter(c=>c.ps&&c.control===s).length,getUnitAt,getCellAt:c=>state.cells.find(x=>same(x.coord,c))||null,sameCoord:same,hexDistance:distance,areAdjacent:(a,b)=>distance(a,b)===1,
 movementRangeFor:()=>1,getMapMovementMultiplier:()=>1,canAct:u=>u&&!u.acted,canMove:u=>u&&!u.acted,canAttack:u=>u&&!u.acted,canBuildStructures:u=>u&&u.uid==="builder"&&!u.acted,isCellEnterable:()=>true,getMapTerrainAt:()=>null,
 buildableCells:u=>u&&u.uid==="builder"&&!getUnitAt([0,0,0])?[[0,0,0]]:[],movableCells:()=>[],effectiveAtt:u=>u.att||0,effectiveLife:u=>(u.currentHp||0)+(u.currentDef||0),numericalSuperiorityBonus:()=>0,
 attackUnit:(a,t)=>{t.currentHp-=a.att; a.attacksMade=(a.attacksMade||0)+1; if(t.currentHp<=0){t.alive=false;t.acted=true;}},endUnitAction:u=>{u.acted=true},
 purchaseLimitReached:()=>false,playerEnergyLocked:()=>false,handCardBlocked:()=>false,effectiveHandUnitCardCost:()=>2,effectiveBlueprintCost:()=>2,starterRoleForBlueprint:()=>"starter_structure",tacticalStarterCapState:()=>({blocked:false}),
 botPressureProfileF9T0:()=>({totalPs:2,requiredPs:2,pressureWin:5,startRound:20,maxRound:35}),
 executeBotRosterPlay:(player,choice)=>{if(!choice||state.energy[player]<choice.cost||getUnitAt(choice.coord))return false;state.energy[player]-=choice.cost;choice.builder.acted=true;state.units.push({uid:"bastion",id:"EX4B02",side:player,faction:"Exordium",type:"Struttura",pos:choice.coord.slice(),alive:true,acted:true,currentHp:3,currentDef:2});vm.runInContext(`expertFactionObserveRosterPlayF9T2(${player}, ${JSON.stringify({bp:BLUEPRINTS[0],coord:choice.coord,cost:choice.cost})})`,context);return true;}
});
for(const rel of ["src/expert_ai/expert_common_strategy.js","src/expert_ai/expert_nexus.js","src/expert_ai/expert_exordium.js","src/expert_ai/expert_liberti.js","src/expert_ai/expert_agathoi.js","src/expert_ai/expert_fabeot.js","src/expert_ai/expert_router.js","src/expert_ai/expert_runtime.js"])vm.runInContext(fs.readFileSync(path.join(ROOT,rel),"utf8"),context,{filename:rel});
const session=vm.runInContext("expertBeginTurnF9T1(1)",context);
equal(session.module.moduleId,"expert-exordium-f9t2d3","router F9T2c");
equal(session.plan.goal,"EXORDIUM_CLEAR_OCCUPY_FORTIFY","piano conversione selezionato");
equal(session.plan.exordium.conversionMode,"BASTION","conversione strutturale preferita");
equal(session.plan.orderedSteps.length,3,"due attacchi e fortificazione");
equal(session.plan.reservedEnergy,2,"ENE riservata");
ok(emitted.some(e=>e.type==="AI_EXPERT_DECISION"&&e.data&&e.data.decision&&e.data.decision.kind==="territorial_conversion_candidate_audit_batch"),"audit conversione emesso");
equal(vm.runInContext("expertCanSpendEnergyF9T2(1,4)",context),false,"acquisti ordinari non consumano la riserva");
equal(vm.runInContext("expertFactionUnitPriorityBonusF9T2(state.units.find(u=>u.uid==='atk1'))",context),1000,"primo attaccante prioritario");
equal(vm.runInContext("expertFactionTryPlannedUnitActionF9T2(state.units.find(u=>u.uid==='atk1'))",context),true,"primo attacco eseguito");
equal(session.plan.currentStep,1,"primo step completato");
equal(vm.runInContext("expertFactionTryPlannedUnitActionF9T2(state.units.find(u=>u.uid==='atk2'))",context),true,"secondo attacco eseguito");
equal(state.units.find(u=>u.uid==="target").alive,false,"presidio eliminato");
equal(session.plan.currentStep,2,"fortificazione è il prossimo step");
equal(vm.runInContext("expertFactionUnitPriorityBonusF9T2(state.units.find(u=>u.uid==='builder'))",context),1000,"builder prioritario");
equal(vm.runInContext("expertFactionTryPlannedUnitActionF9T2(state.units.find(u=>u.uid==='builder'))",context),true,"Bastione costruito dopo la rimozione");
equal(session.plan.status,"completed","piano completato");
ok(getUnitAt([0,0,0])&&getUnitAt([0,0,0]).id==="EX4B02","PS fortificato");
equal(state.energy[1],3,"spesa esatta di 2 ENE");
ok(emitted.some(e=>e.type==="AI_EXPERT_DECISION"&&e.data&&e.data.decision&&e.data.decision.kind==="territorial_conversion_result"&&e.data.decision.psFortified===true),"risultato conversione telemetrizzato");

// Memoria Relay: due perdite recenti su un PS periferico sotto minaccia e senza supporto.
state.units=state.units.filter(u=>u.type==="QG");
state.units.push({uid:"e1",side:2,faction:"Nexus",type:"Veicolo",att:3,pos:[2,-3,1],alive:true,acted:false},{uid:"e2",side:2,faction:"Nexus",type:"Fanteria",att:2,pos:[3,-2,-1],alive:true,acted:false});
vm.runInContext("expertExordiumRecordBastionLossF9T2b(1,[2,-2,0],10); expertExordiumRecordBastionLossF9T2b(1,[2,-2,0],12);",context);
const survival=vm.runInContext("expertExordiumRelaySurvivalAssessmentF9T2b(1,[2,-2,0],{pressureProfile:{requiredPs:2,pressureWin:5,maxRound:35}})",context);
equal(survival.lossesLast5,2,"memoria perdite limitata registrata");
equal(survival.classification,"UNSUSTAINABLE","PS ripetutamente distrutto classificato insostenibile");
equal(survival.allowBuild,false,"ricostruzione automatica respinta");
const summary=vm.runInContext("expertCompleteTurnF9T1(1,{guardIterations:3})",context);
equal(summary.planStatus,"completed","riepilogo Expert completato");
equal(vm.runInContext("Object.keys(expertRuntimeStateF9T1.activeByPlayer).length",context),0,"runtime ripulito");
console.log(`F9T2b Exordium Territorial Conversion smoke: ${checks}/${checks} verifiche superate`);
