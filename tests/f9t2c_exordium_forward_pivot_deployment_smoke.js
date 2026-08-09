"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert");
const ROOT=path.resolve(__dirname,".."); let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++}; const equal=(a,e,m)=>{assert.strictEqual(a,e,m);checks++};
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.join(",")===b.join(",");
const distance=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2]));
const pivotBp={id:"EXPIV02",faction:"Exordium",name:"Mech d'Assalto",type:"Veicolo",weight:"Pivot",cost:5,hp:6,att:4,def:3};
const bastionBp={id:"EX4B02",faction:"Exordium",name:"Bastione Armato",type:"Struttura",weight:"Leggera",cost:2,hp:3,att:0,def:2};
const state={aiMode:"expert",modes:{1:"bot",2:"bot"},turn:8,currentPlayer:1,factions:{1:"Exordium",2:"Nexus"},playerIds:[1,2],energy:{1:6,2:4},pressure:{1:0,2:0},mapId:"pivot-forward-test",mapDefinition:{id:"pivot-forward-test",name:"Pivot Forward Test",movementMultiplier:2},cells:[
 {coord:[-5,5,0],ps:false,control:null},{coord:[5,-5,0],ps:false,control:null},
 {coord:[0,0,0],ps:false,control:null},{coord:[2,-1,-1],ps:true,control:null},
 {coord:[-1,1,0],ps:true,control:1},{coord:[0,1,-1],ps:false,control:null}
],units:[
 {uid:"hq-ex",side:1,faction:"Exordium",type:"QG",pos:[-5,5,0],alive:true},
 {uid:"hq-nx",side:2,faction:"Nexus",type:"QG",pos:[5,-5,0],alive:true},
 {uid:"bastion-advanced",id:"EX4B02",name:"Bastione Armato",side:1,faction:"Exordium",type:"Struttura",weight:"Leggera",currentHp:3,currentDef:2,pos:[-1,1,0],alive:true,acted:true},
 {uid:"support",id:"EX1B04",name:"Legionario Pesante",side:1,faction:"Exordium",type:"Fanteria",weight:"Pesante",att:3,currentHp:3,currentDef:2,pos:[0,1,-1],alive:true,acted:false}
],hand:{1:[{cardUid:"pivot-card",sourceType:"unit",cardType:"pivot",deckRole:"pivot",blueprintId:"EXPIV02",faction:"Exordium",name:"Mech d'Assalto"}],2:[]},starterCards:{1:{},2:{}}};
const BLUEPRINTS=[pivotBp,bastionBp];
const eventNames=["UNIT_DESTROYED","UNIT_ATTACKED","ABILITY_USED","PS_CONTROL_CHANGED","AI_EXPERT_TURN_STARTED","AI_EXPERT_CONTEXT_CREATED","AI_EXPERT_MODULE_ROUTED","AI_MICROPLAN_SELECTED","AI_MICROPLAN_STEP","AI_MICROPLAN_COMPLETED","AI_MICROPLAN_ABORTED","AI_EXPERT_DECISION","AI_EXPERT_FALLBACK","AI_EXPERT_BUDGET_EXHAUSTED","AI_EXPERT_TURN_COMPLETED"];
const EventTypes=Object.fromEntries(eventNames.map(x=>[x,x])),emitted=[]; let now=1;
const getUnitAt=c=>state.units.find(u=>u.alive!==false&&Array.isArray(u.pos)&&same(u.pos,c))||null;
const context=vm.createContext({console,Map,Set,Object,Array,Number,String,Boolean,Math,JSON,Date,state,BLUEPRINTS,EventTypes,
 performance:{now:()=>now+=.1,memory:{usedJSHeapSize:8192}},emitGameEvent:e=>{emitted.push(JSON.parse(JSON.stringify(e)));return e},telemetryRecordExpertDecisionF9T1:()=>{},
 getEnemyPlayers:p=>[1,2].filter(s=>s!==p),getHq:s=>state.units.find(u=>u.type==="QG"&&u.side===s),combatUnits:s=>state.units.filter(u=>u.alive!==false&&u.side===s&&u.type!=="QG"),countControlledPS:s=>state.cells.filter(c=>c.ps&&c.control===s).length,getUnitAt,getCellAt:c=>state.cells.find(x=>same(x.coord,c))||null,sameCoord:same,hexDistance:distance,areAdjacent:(a,b)=>distance(a,b)===1,
 movementRangeFor:u=>u&&u.side===2?2:2,getMapMovementMultiplier:()=>2,currentPace:()=>({vehicleMove:1}),canAct:u=>u&&!u.acted,canMove:u=>u&&!u.acted,canAttack:u=>u&&!u.acted,canBuildStructures:()=>false,isCellEnterable:()=>true,getMapTerrainAt:()=>null,
 buildableCells:()=>[],movableCells:()=>[],effectiveAtt:u=>u.att||0,effectiveLife:u=>(u.currentHp||0)+(u.currentDef||0),numericalSuperiorityBonus:()=>0,
 purchaseLimitReached:()=>false,playerEnergyLocked:()=>false,playerHandLocked:()=>false,handCardBlocked:()=>false,effectiveHandUnitCardCost:()=>5,effectiveBlueprintCost:(p,bp)=>bp.cost,starterRoleForBlueprint:()=>null,tacticalStarterCapState:()=>({blocked:false}),
 blueprintForHandCard:card=>BLUEPRINTS.find(bp=>bp.id===card.blueprintId)||null,spawnCellsFor:()=>[[0,0,0]],
 botPressureProfileF9T0:()=>({totalPs:2,requiredPs:2,pressureWin:5,startRound:20,maxRound:35})
});
for(const rel of ["src/expert_ai/expert_common_strategy.js","src/expert_ai/expert_nexus.js","src/expert_ai/expert_exordium.js","src/expert_ai/expert_liberti.js","src/expert_ai/expert_agathoi.js","src/expert_ai/expert_fabeot.js","src/expert_ai/expert_router.js","src/expert_ai/expert_runtime.js"])vm.runInContext(fs.readFileSync(path.join(ROOT,rel),"utf8"),context,{filename:rel});
const session=vm.runInContext("expertBeginTurnF9T1(1)",context);
equal(session.module.moduleId,"expert-exordium-f9t2d3","router F9T2c");
equal(session.plan.goal,"EXORDIUM_FORWARD_PIVOT_DEPLOYMENT","piano Pivot avanzata selezionato");
equal(session.plan.orderedSteps.length,1,"micro-piano piatto a un solo step");
equal(session.plan.orderedSteps[0].action,"deploy_pivot_forward","step di schieramento");
equal(session.plan.reservedEnergy,5,"ENE Pivot riservata");
equal(session.plan.exordium.sourceStructureId,"bastion-advanced","nodo avanzato identificato");
equal(session.plan.exordium.objectiveType,"ENEMY_PS_CAPTURE","PS raggiungibile entro un turno selezionato");
ok(session.plan.supportActorIds.includes("support"),"supporto reale registrato");
ok(emitted.some(e=>e.type==="AI_EXPERT_DECISION"&&e.data&&e.data.decision&&e.data.decision.kind==="forward_pivot_candidate_audit_batch"),"audit candidati Pivot emesso");
equal(vm.runInContext("expertCanSpendEnergyF9T2(1,2)",context),false,"acquisti marginali non consumano la riserva Pivot");
const choice=vm.runInContext("expertFactionRosterChoiceF9T2(1)",context);
equal(choice.source,"hand","Pivot scelta esclusivamente dalla mano");
equal(choice.cardUid,"pivot-card","istanza carta corretta");
equal(choice.bp.id,"EXPIV02","blueprint Pivot corretto");
ok(same(choice.coord,[0,0,0]),"cella del nodo avanzato corretta");
state.energy[1]-=choice.cost;
state.hand[1]=[];
state.units.push({uid:"pivot-unit",...pivotBp,side:1,currentHp:pivotBp.hp,currentDef:pivotBp.def,pos:choice.coord.slice(),alive:true,acted:true});
equal(vm.runInContext(`expertFactionObserveRosterPlayF9T2(1, ${JSON.stringify({bp:pivotBp,coord:choice.coord,cost:choice.cost})})`,context),true,"schieramento osservato");
equal(session.plan.status,"completed","piano completato");
equal(session.plan.reservedEnergy,0,"riserva liberata");
equal(state.energy[1],1,"spesa esatta Pivot");
const tracking=vm.runInContext("state.expertAiF9T2c.forwardPivotByPlayer['1']",context);
equal(tracking.unitId,"pivot-unit","Pivot tracciata");
equal(tracking.impactDeadlineRound,10,"finestra impatto limitata a due round");
ok(emitted.some(e=>e.type==="AI_EXPERT_DECISION"&&e.data&&e.data.decision&&e.data.decision.kind==="forward_pivot_deployed"),"deployment telemetrizzato");
state.turn=9;
equal(vm.runInContext(`expertAiHandleGameEventF9T2c(${JSON.stringify({type:"UNIT_ATTACKED",data:{attackerId:"pivot-unit",defenderId:"enemy",amount:4}})})`,context),true,"primo attacco riconosciuto come impatto");
equal(vm.runInContext("state.expertAiF9T2c.forwardPivotByPlayer['1'] || null",context),null,"tracking attivo rimosso dopo il primo impatto");
const result=vm.runInContext("state.expertAiF9T2c.lastForwardPivotResultByPlayer['1']",context);
equal(result.status,"impacted","impatto registrato");
equal(result.impact.kind,"ATTACK","tipo impatto registrato");
equal(result.roundsToFirstActualImpact,1,"impatto entro un round");
ok(emitted.some(e=>e.type==="AI_EXPERT_DECISION"&&e.data&&e.data.decision&&e.data.decision.kind==="forward_pivot_impact"),"impatto telemetrizzato");
vm.runInContext("{const t={player:1,unitId:'late-pivot',blueprintId:'EXPIV02',deploymentSource:'advanced_fallback',deployedRound:8,deploymentSequence:1,deploymentCell:[0,0,0],objectiveType:'ENEMY_PS_CAPTURE',objectiveCell:[2,-1,-1],impactDeadlineRound:10,status:'awaiting_impact',impact:null,impactWindowMissRecorded:false}; state.expertAiF9T2c.forwardPivotByPlayer['1']=t; state.expertAiF9T2c.pivotImpactByUnit['late-pivot']=t;}",context);
state.turn=11;
equal(vm.runInContext("expertExordiumCheckForwardPivotExpiryF9T2c(1)",context),true,"finestra scaduta riconosciuta");
equal(vm.runInContext("state.expertAiF9T2c.pivotImpactByUnit['late-pivot'].status",context),"awaiting_late_impact","mancato impatto entro finestra registrato, tracking tardivo preservato");
ok(emitted.some(e=>e.type==="AI_EXPERT_DECISION"&&e.data&&e.data.decision&&e.data.decision.kind==="forward_pivot_impact_window_missed"),"mancato impatto telemetrizzato");
const telemetrySource=fs.readFileSync(path.join(ROOT,"src/match_telemetry.js"),"utf8");
ok(telemetrySource.includes('MATCH_TELEMETRY_EXPERT_DOCTRINE_SCHEMA_VERSION = "F9T2d3-1"')&&telemetrySource.includes("forwardPivotsDeployed")&&telemetrySource.includes("forwardPivotImpacts")&&telemetrySource.includes("forwardPivotImpactMisses"),"contratto telemetrico F9T2c presente");
const summary=vm.runInContext("expertCompleteTurnF9T1(1,{guardIterations:2})",context);
equal(summary.planStatus,"completed","riepilogo Expert completato");
equal(vm.runInContext("Object.keys(expertRuntimeStateF9T1.activeByPlayer).length",context),0,"runtime ripulito");
console.log(`F9T2c Exordium Forward Pivot smoke: ${checks}/${checks} verifiche superate`);
