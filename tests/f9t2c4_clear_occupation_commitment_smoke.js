"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert");
const ROOT=path.resolve(__dirname,".."); let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const eq=(a,b,m)=>{assert.strictEqual(a,b,m);checks++;};
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.join(",")===b.join(",");
const dist=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2]));
const EventTypes=Object.fromEntries([
  "AI_EXPERT_DECISION","AI_MICROPLAN_STEP","AI_MICROPLAN_COMPLETED","AI_MICROPLAN_ABORTED","AI_EXPERT_FALLBACK",
  "AI_EXPERT_TURN_STARTED","AI_EXPERT_CONTEXT_CREATED","AI_EXPERT_MODULE_ROUTED","AI_EXPERT_TURN_COMPLETED",
  "UNIT_SPAWNED","UNIT_ATTACKED","ABILITY_USED","PS_CONTROL_CHANGED","UNIT_DESTROYED"
].map(x=>[x,x]));
const targetCell=[0,0,0];
const state={
  aiMode:"expert",modes:{1:"bot",2:"bot"},turn:21,currentPlayer:1,factions:{1:"Exordium",2:"Nexus"},
  energy:{1:5,2:5},pressure:{1:0,2:0},mapDefinition:{movementMultiplier:1},
  cells:[{coord:targetCell,ps:true,control:null},{coord:[-5,5,0],ps:false,control:null},{coord:[5,-5,0],ps:false,control:null}],
  units:[
    {uid:"hq-ex",side:1,faction:"Exordium",type:"QG",pos:[-5,5,0],alive:true,acted:false},
    {uid:"hq-nx",side:2,faction:"Nexus",type:"QG",pos:[5,-5,0],alive:true,acted:false},
    {uid:"reserved-old",side:1,faction:"Exordium",type:"Fanteria",cost:1,pos:[-1,0,1],alive:true,acted:true},
    {uid:"replacement",side:1,faction:"Exordium",type:"Fanteria",cost:1,pos:[0,-1,1],alive:true,acted:false},
    {uid:"expensive",side:1,faction:"Exordium",type:"Veicolo",cost:4,pos:[1,-1,0],alive:true,acted:false},
    {uid:"removed-target",side:2,faction:"Nexus",type:"Struttura",cost:2,pos:targetCell.slice(),alive:false,acted:true}
  ],hand:{1:[],2:[]},starterCards:{1:{},2:{}}
};
const emitted=[]; let now=0;
const getUnitAt=c=>state.units.find(u=>u.alive!==false&&u.type!=="QG"&&same(u.pos,c))||null;
const getCellAt=c=>state.cells.find(x=>same(x.coord,c))||null;
const ctx=vm.createContext({
  console,Map,Set,Object,Array,Number,String,Boolean,Math,JSON,Date,state,EventTypes,BLUEPRINTS:[],
  performance:{now:()=>now+=.05,memory:{usedJSHeapSize:1000}},
  emitGameEvent:e=>{emitted.push(JSON.parse(JSON.stringify(e)));return e;},telemetryRecordExpertDecisionF9T1:()=>{},
  sameCoord:same,hexDistance:dist,getUnitAt,getCellAt,getHq:s=>state.units.find(u=>u.type==="QG"&&u.side===s),
  getEnemyPlayers:p=>p===1?[2]:[1],combatUnits:s=>state.units.filter(u=>u.alive!==false&&u.side===s&&u.type!=="QG"),
  countControlledPS:s=>state.cells.filter(c=>c.ps&&c.control===s).length,canMove:u=>u&&!u.acted,
  movementRangeFor:()=>1,isCellEnterable:()=>true,getMapTerrainAt:()=>null,
  movableCells:u=>(u&&u.alive!==false&&!u.acted&&!getUnitAt(targetCell)&&dist(u.pos,targetCell)<=1)?[targetCell.slice()]:[],
  botMoveUnitF9T0:(u,c)=>{u.pos=c.slice();const cell=getCellAt(c);if(cell&&cell.ps)cell.control=u.side;},
  finishBotMove:u=>{u.acted=true;},canAct:u=>u&&!u.acted,
  botPressureProfileF9T0:()=>({totalPs:1,requiredPs:1,pressureWin:5,maxRound:35}),pressureRuleProfile:()=>({centralCoord:targetCell,requiredPs:1,pressureWin:5,maxRound:35})
});
for(const rel of [
  "src/expert_ai/expert_common_strategy.js","src/expert_ai/expert_exordium.js","src/expert_ai/expert_router.js","src/expert_ai/expert_runtime.js"
]) vm.runInContext(fs.readFileSync(path.join(ROOT,rel),"utf8"),ctx,{filename:rel});

function installPlan(risk="none") {
  state.units.find(u=>u.uid==="reserved-old").acted=true;
  state.units.find(u=>u.uid==="replacement").acted=false;
  state.units.find(u=>u.uid==="replacement").pos=[0,-1,1];
  state.units.find(u=>u.uid==="expensive").acted=false;
  state.cells[0].control=null;
  ctx.expertRuntimeStateF9T1.activeByPlayer[1]={
    sequence:42,player:1,turn:21,faction:"Exordium",completed:false,decisions:[],decisionTotal:0,
    decisionRecordsEmitted:0,decisionRecordsDropped:0,decisionLimitReached:false,auditRecordTotal:0,auditRecordsDropped:0,
    context:{common:{hqOccupationRisk:{risk}}},module:{moduleId:"expert-exordium-f9t2d3"},
    plan:{id:"clear-commitment",goal:"EXORDIUM_CLEAR_OCCUPY_FORTIFY",targetPs:targetCell.slice(),targetCell:targetCell.slice(),
      targetUnitId:"removed-target",status:"active",currentStep:0,reservedEnergy:0,
      orderedSteps:[
        {id:"attack",action:"attack_ps_target",unitId:"attacker",targetUnitId:"removed-target",targetCell:targetCell.slice()},
        {id:"occupy",action:"occupy_ps",unitId:"reserved-old",targetCell:targetCell.slice()}
      ],
      reservedActions:["attack:attacker","garrison:reserved-old"],supportActorIds:["reserved-old"],expectedResult:{},
      exordium:{occupierCandidateIds:["reserved-old","replacement","expensive"],conversionActorInitialId:"reserved-old",conversionActorCurrentId:"reserved-old",conversionActorReassignments:0,conversionCommitmentActive:false}
    }
  };
  return ctx.expertRuntimeStateF9T1.activeByPlayer[1];
}

let runtime=installPlan();
const step=vm.runInContext("expertExordiumEnsureClearConversionActorF9T2c4(1,{reason:'smoke'})",ctx);
eq(step.action,"occupy_ps","attacchi superflui saltati dopo rimozione target");
eq(step.unitId,"replacement","occupante indisponibile sostituito");
eq(runtime.plan.exordium.conversionActorReassignments,1,"una sola riassegnazione registrata");
eq(runtime.plan.exordium.conversionActorCurrentId,"replacement","attore corrente aggiornato");
eq(runtime.plan.reservedActions[1],"garrison:replacement","azione riservata aggiornata");
eq(runtime.plan.exordium.conversionCommitmentActive,true,"commitment attivato");
ok(emitted.some(e=>e.type==="AI_EXPERT_DECISION"&&e.data.decision.kind==="clear_conversion_actor_reassigned"),"riassegnazione telemetrizzata");
ok(emitted.some(e=>e.type==="AI_EXPERT_DECISION"&&e.data.decision.kind==="clear_conversion_actor_committed"),"commitment telemetrizzato");
eq(vm.runInContext("expertFactionUnitPriorityBonusF9T2(state.units.find(u=>u.uid==='replacement'))",ctx),1600,"occupante committed ha priorità rigida");
eq(vm.runInContext("expertFactionTryCommittedConversionActionF9T2c4(state.units.find(u=>u.uid==='replacement'))",ctx),true,"occupazione committed eseguita");
eq(state.cells[0].control,1,"controllo PS convertito");
eq(runtime.plan.status,"completed","micro-piano completato");
eq(state.units.find(u=>u.uid==="replacement").acted,true,"attore chiuso dopo movimento");
ok(emitted.some(e=>e.type==="AI_EXPERT_DECISION"&&e.data.decision.kind==="clear_conversion_commitment_executed"),"esecuzione committed telemetrizzata");

runtime=installPlan("direct");
vm.runInContext("expertExordiumEnsureClearConversionActorF9T2c4(1,{reason:'hq-risk'})",ctx);
eq(vm.runInContext("expertFactionTryCommittedConversionActionF9T2c4(state.units.find(u=>u.uid==='replacement'))",ctx),false,"rischio QG diretto resta prioritario");
eq(state.units.find(u=>u.uid==="replacement").acted,false,"occupante non consumato durante emergenza QG");
eq(runtime.plan.status,"active","piano non abortito dal semplice differimento");
ok(emitted.some(e=>e.type==="AI_EXPERT_DECISION"&&e.data.decision.kind==="clear_conversion_commitment_deferred_hq_risk"),"differimento QG telemetrizzato");

const ai=fs.readFileSync(path.join(ROOT,"src/ai.js"),"utf8");
ok(ai.includes("expertFactionTryCommittedConversionActionF9T2c4"),"hook eseguito nel ciclo bot prima del fallback generico");
const telemetry=fs.readFileSync(path.join(ROOT,"src/match_telemetry.js"),"utf8");
ok(telemetry.includes('MATCH_TELEMETRY_EXPERT_DOCTRINE_SCHEMA_VERSION = "F9T2d3-1"'),"schema telemetrico F9T2c4");
console.log(`F9T2c4 Clear Occupation Commitment smoke: ${checks}/${checks} verifiche superate`);
