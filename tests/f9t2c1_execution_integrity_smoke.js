"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert");
const ROOT=path.resolve(__dirname,".."); let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++}; const equal=(a,b,m)=>{assert.strictEqual(a,b,m);checks++};
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.join(",")===b.join(",");
const dist=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2]));
const EventTypes=Object.fromEntries(["AI_EXPERT_DECISION","AI_MICROPLAN_STEP","AI_MICROPLAN_COMPLETED","AI_MICROPLAN_ABORTED","AI_EXPERT_FALLBACK","UNIT_SPAWNED","UNIT_BUILT","UNIT_ATTACKED","ABILITY_USED","PS_CONTROL_CHANGED","UNIT_DESTROYED"].map(x=>[x,x]));
const bastion={id:"EX4B02",faction:"Exordium",name:"Bastione Armato",type:"Struttura",weight:"Leggera",cost:2,hp:3,def:2};
const pivot={id:"EXPIV02",faction:"Exordium",name:"Mech d'Assalto",type:"Veicolo",weight:"Pivot",cost:5,hp:6,def:3,att:4};
const state={aiMode:"expert",modes:{1:"bot",2:"bot"},turn:10,currentPlayer:1,factions:{1:"Exordium",2:"Nexus"},energy:{1:8,2:8},pressure:{1:0,2:0},mapDefinition:{movementMultiplier:2},cells:[
 {coord:[0,5,-5],ps:true,control:1},{coord:[2,-2,0],ps:true,control:1},{coord:[1,-2,1],ps:false,control:null},{coord:[3,-2,-1],ps:false,control:null}
],units:[
 {uid:"guard",side:1,faction:"Exordium",name:"Guardia",type:"Fanteria",pos:[0,5,-5],alive:true,acted:false},
 {uid:"enemy-a",side:2,faction:"Nexus",name:"Nemico A",type:"Veicolo",att:4,pos:[2,-3,1],alive:true,acted:false},
 {uid:"enemy-b",side:2,faction:"Nexus",name:"Nemico B",type:"Fanteria",att:3,pos:[3,-3,0],alive:true,acted:false}
],hand:{1:[],2:[]},starterCards:{1:{},2:{}},cellEffects:[]};
const emitted=[]; let now=0;
const getUnitAt=c=>state.units.find(u=>u.alive!==false&&Array.isArray(u.pos)&&same(u.pos,c))||null;
const getCellAt=c=>state.cells.find(x=>same(x.coord,c))||null;
const ctx=vm.createContext({console,Map,Set,Object,Array,Number,String,Boolean,Math,JSON,Date,state,BLUEPRINTS:[bastion,pivot],EventTypes,
 performance:{now:()=>now+=.05,memory:{usedJSHeapSize:1000}},emitGameEvent:e=>{emitted.push(JSON.parse(JSON.stringify(e)));return e},
 getCentralStrategicPointCoord:()=>[0,5,-5],sameCoord:same,hexDistance:dist,getCellAt,getUnitAt,getEnemyPlayers:p=>p===1?[2]:[1],combatUnits:s=>state.units.filter(u=>u.alive!==false&&u.side===s&&u.type!=="QG"),countControlledPS:s=>state.cells.filter(c=>c.ps&&c.control===s).length,
 movementRangeFor:()=>2,effectiveAtt:u=>u.att||0,canAct:u=>!u.acted,canBuildStructures:()=>true,isCellEnterable:()=>true,getMapTerrainAt:()=>null,buildableCells:()=>[],movableCells:()=>[],
 botPressureProfileF9T0:()=>({requiredPs:2,pressureWin:5,maxRound:35,totalPs:2}),pressureRuleProfile:()=>({centralCoord:[0,5,-5],requiredPs:2,pressureWin:5,maxRound:35}),
 telemetryRecordExpertDecisionF9T1:()=>{}
});
for(const rel of ["src/expert_ai/expert_common_strategy.js","src/expert_ai/expert_exordium.js","src/expert_ai/expert_runtime.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT,rel),"utf8"),ctx,{filename:rel});

equal(vm.runInContext("expertExordiumCentralCoordF9T2c1().join(',')",ctx),"0,5,-5","centro autorevole letto dalla mappa");
equal(vm.runInContext("expertExordiumIsCenterF9T2c1([0,5,-5])",ctx),true,"centro non geometrico riconosciuto");
const centerAssessment=vm.runInContext("expertExordiumRelaySurvivalAssessmentF9T2b(1,[0,5,-5],{pressureProfile:{requiredPs:2,pressureWin:5,maxRound:35}})",ctx);
equal(centerAssessment.isCenter,true,"Survival Check usa il centro autorevole");

vm.runInContext("expertExordiumRecordBastionLossF9T2b(1,[2,-2,0],8); expertExordiumRecordBastionLossF9T2b(1,[2,-2,0],10);",ctx);
const gate=vm.runInContext("expertExordiumCanBuildBastionOnPsF9T2c1(1,BLUEPRINTS[0],[2,-2,0],{source:'advanced_fallback',emit:true})",ctx);
equal(gate.applicable,true,"gate applicato a Bastione su PS");
equal(gate.assessment.classification,"UNSUSTAINABLE","ricostruzione periferica insostenibile rilevata");
equal(gate.allowBuild,false,"fallback non aggira il Survival Check");
ok(emitted.some(e=>e.type==="AI_EXPERT_DECISION"&&e.data.decision.kind==="bastion_ps_build_gate"),"gate telemetrizzato");

// Limite reale: 24 decisioni, audit separati.
ctx.expertRuntimeStateF9T1.activeByPlayer[1]={sequence:77,player:1,turn:10,faction:"Exordium",completed:false,decisions:[],decisionTotal:0,decisionRecordsEmitted:0,decisionRecordsDropped:0,decisionLimitReached:false,auditRecordTotal:0,auditRecordsDropped:0};
vm.runInContext("for(let i=0;i<30;i++) expertEmitDecisionLimitedF9T2c1(1,{kind:'limit-'+i}); for(let i=0;i<30;i++) expertEmitDecisionLimitedF9T2c1(1,{kind:'audit-'+i},{audit:true,auditTotal:1,auditStored:1});",ctx);
equal(ctx.expertRuntimeStateF9T1.activeByPlayer[1].decisionRecordsEmitted,24,"massimo 24 decisioni emesse");
equal(ctx.expertRuntimeStateF9T1.activeByPlayer[1].decisionRecordsDropped,6,"decisioni eccedenti scartate");
equal(ctx.expertRuntimeStateF9T1.activeByPlayer[1].decisions.length,24,"record decisionali realmente limitati");
equal(ctx.expertRuntimeStateF9T1.activeByPlayer[1].auditRecordTotal,30,"audit conteggiati separatamente");

// Riconciliazione autorevole del PS: attore diverso da quello prenotato.
state.units=state.units.filter(u=>u.uid!=="guard");
state.units.push({uid:"fallback-occupier",side:1,faction:"Exordium",name:"Artiglieria",type:"Veicolo",pos:[0,5,-5],alive:true,acted:true});
state.cells.find(c=>same(c.coord,[0,5,-5])).control=1;
ctx.expertRuntimeStateF9T1.activeByPlayer[1]={sequence:78,player:1,turn:10,faction:"Exordium",completed:false,decisions:[],decisionTotal:0,decisionRecordsEmitted:0,decisionRecordsDropped:0,decisionLimitReached:false,auditRecordTotal:0,auditRecordsDropped:0,module:{moduleId:"expert-exordium-f9t2d3"},plan:{id:"clear-test",goal:"EXORDIUM_CLEAR_OCCUPY_FORTIFY",targetPs:[0,5,-5],targetCell:[0,5,-5],targetUnitId:"removed-enemy",status:"active",currentStep:0,reservedEnergy:2,orderedSteps:[{id:"a",action:"attack_ps_target"},{id:"b",action:"occupy_ps"}],exordium:{}}};
equal(vm.runInContext("expertExordiumReconcileActivePlanF9T2c1(1,{phase:'smoke'})",ctx),true,"risultato autorevole riconciliato");
equal(ctx.expertRuntimeStateF9T1.activeByPlayer[1].plan.status,"completed","falso aborto evitato");
equal(ctx.expertRuntimeStateF9T1.activeByPlayer[1].plan.reservedEnergy,0,"riserva liberata dopo conversione");
ok(emitted.some(e=>e.type==="AI_EXPERT_DECISION"&&e.data.decision.kind==="territorial_conversion_authoritative_reconcile"&&e.data.decision.psOccupied===true),"conversione autorevole telemetrizzata");

// Pivot schierata dal fallback: monitorata comunque e classificata miss.
state.units.push({uid:"fallback-pivot",...pivot,blueprintId:"EXPIV02",side:1,alive:true,acted:true,pos:[1,-2,1],spawnSource:"hand_deck"});
vm.runInContext("expertAiHandleGameEventF9T2c({type:EventTypes.UNIT_SPAWNED,data:{player:1,unitId:'fallback-pivot',blueprintId:'EXPIV02',spawnSource:'hand_deck',round:10}})",ctx);
let track=vm.runInContext("state.expertAiF9T2c.pivotImpactByUnit['fallback-pivot']",ctx);
equal(track.deploymentSource,"advanced_fallback","Pivot fallback distinta dal piano Expert");
state.turn=13;
equal(vm.runInContext("expertExordiumCheckForwardPivotExpiryF9T2c(1)",ctx),true,"finestra Pivot fallback scaduta");
const miss=vm.runInContext("state.expertAiF9T2c.pivotImpactByUnit['fallback-pivot']",ctx);
equal(miss.impactMiss,true,"Pivot fallback registrata come impact miss entro finestra");
equal(miss.status,"awaiting_late_impact","tracking preservato per il primo impatto tardivo");
equal(miss.deploymentSource,"advanced_fallback","origine preservata nel risultato");

const telemetry=fs.readFileSync(path.join(ROOT,"src/match_telemetry.js"),"utf8");
ok(telemetry.includes('MATCH_TELEMETRY_EXPERT_DOCTRINE_SCHEMA_VERSION = "F9T2d3-1"'),"schema F9T2c1 presente");
ok(telemetry.includes("deckPivotInstances")&&telemetry.includes("rosterPivotInstances")&&telemetry.includes("marketPivotInstances")&&telemetry.includes("allPivotInstances"),"tutte le origini Pivot separate");
ok(telemetry.includes("expertBastionsBuiltOnPs")&&telemetry.includes("fallbackBastionsBuiltOnPs")&&telemetry.includes("totalBastionsBuiltOnPs"),"Bastioni Expert/fallback/totali separati");
const deployment=fs.readFileSync(path.join(ROOT,"src/deployment.js"),"utf8");
ok(deployment.includes("expertExordiumCanBuildBastionOnPsF9T2c1"),"gate applicato al confine runtime buildStructure");
console.log(`F9T2c1 Execution Integrity smoke: ${checks}/${checks} verifiche superate`);
