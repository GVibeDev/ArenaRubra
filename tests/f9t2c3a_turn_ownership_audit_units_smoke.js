"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert");
const ROOT=path.resolve(__dirname,".."); let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++}; const eq=(a,b,m)=>{assert.strictEqual(a,b,m);checks++};
const names=[
  "GAME_STARTED","TURN_ENDED","CARD_DRAWN","CARD_PLAYED","AI_EXPERT_TURN_STARTED","AI_EXPERT_CONTEXT_CREATED",
  "AI_EXPERT_MODULE_ROUTED","AI_EXPERT_FALLBACK","AI_EXPERT_DECISION","AI_EXPERT_TURN_COMPLETED",
  "AI_MICROPLAN_SELECTED","AI_MICROPLAN_STEP","AI_MICROPLAN_COMPLETED","AI_MICROPLAN_ABORTED","AI_EXPERT_BUDGET_EXHAUSTED",
  "UNIT_SPAWNED","UNIT_ATTACKED","ABILITY_USED","PS_CONTROL_CHANGED","UNIT_DESTROYED","VICTORY"
];
const EventTypes=Object.fromEntries(names.map(x=>[x,x]));
const state={
  aiMode:"expert",matchId:"f9t2c3a-smoke",matchSeed:"seed",matchRngCalls:0,matchRngState:1,
  turn:6,currentPlayer:1,turnOrder:[1,2],playerIds:[1,2],factions:{1:"Exordium",2:"Nexus"},modes:{1:"bot",2:"bot"},
  energy:{1:8,2:8},pressure:{1:0,2:0},hand:{1:[],2:[]},deck:{1:[],2:[]},discard:{1:[],2:[]},units:[],cells:[],
  selectedCommanders:{},selectedDecks:{},mapId:"map1",mapDefinition:{name:"Smoke",movementMultiplier:2,metadata:{revision:1}},
  pacePreset:"standard",gameScaleMode:"large_scale",starterCards:{1:{},2:{}},cellEffects:[]
};
const emitted=[]; let now=0; let ctx;
const sandbox={
  console,JSON,Date,Math,Number,String,Boolean,Object,Array,Map,Set,state,EventTypes,BUILD_INFO:{version:"C2-STABLE-1-F9T2d3-APK-M4c"},
  performance:{now:()=>++now,memory:{usedJSHeapSize:1000}},
  getEnemyPlayers:p=>p===1?[2]:[1],getHq:()=>null,combatUnits:()=>[],countControlledPS:()=>0,getUnitAt:()=>null,getCellAt:()=>null,
  getCentralStrategicPointCoord:()=>[0,5,-5],pressureRuleProfile:()=>({centralCoord:[0,5,-5],requiredPs:2,pressureWin:5,maxRound:35}),
  botPressureProfileF9T0:()=>({totalPs:3,requiredPs:2,pressureWin:5,maxRound:35}),sameCoord:(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.join(',')===b.join(','),
  hexDistance:(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i]))),movementRangeFor:()=>2,getMapMovementMultiplier:()=>2,currentPace:()=>({vehicleMove:1}),
  canAct:()=>true,canMove:()=>true,canAttack:()=>true,canBuildStructures:()=>false,isCellEnterable:()=>true,getMapTerrainAt:()=>null,buildableCells:()=>[],movableCells:()=>[],
  effectiveAtt:u=>u&&u.att||0,effectiveLife:u=>(u&&u.currentHp||0)+(u&&u.currentDef||0),numericalSuperiorityBonus:()=>0
};
ctx=vm.createContext(sandbox);
sandbox.emitGameEvent=e=>{const copy=JSON.parse(JSON.stringify(e));emitted.push(copy);ctx.__evt=copy;vm.runInContext("updateMatchTelemetryFromEvent(__evt)",ctx);return e;};
for(const rel of ["src/match_telemetry.js","src/expert_ai/expert_common_strategy.js","src/expert_ai/expert_exordium.js","src/expert_ai/expert_runtime.js"]){
  vm.runInContext(fs.readFileSync(path.join(ROOT,rel),"utf8"),ctx,{filename:rel});
}
vm.runInContext("initializeMatchTelemetry()",ctx);

function begin(sequence,round){
  state.turn=round; state.currentPlayer=1;
  ctx.__runtime={sequence,matchId:state.matchId,player:1,turn:round,faction:"Exordium",startedAt:now,heapStart:1000,cache:new Map(),cacheHits:0,cacheMisses:0,candidateCount:0,discardedCandidates:0,candidateAuditCount:0,candidateAuditCountByScanner:{relay:0,clearOccupyFortify:0,forwardPivot:0},candidateRejectionCounts:{},candidateRejectionCountsByScanner:{relay:{},clearOccupyFortify:{},forwardPivot:{}},territorialConversionMetrics:{psClearedDuringExpertPlan:0,psClearedDirectlyByExpertStep:0,psOccupiedAfterClear:0,psFortifiedAfterClear:0},decisions:[],decisionTotal:0,decisionRecordsEmitted:0,decisionRecordsDropped:0,decisionLimitReached:false,auditRecordTotal:0,auditRecordsDropped:0,auditItemsTotal:0,auditItemsStored:0,auditItemsDropped:0,auditContainersTotal:0,candidateScanStoppedEarly:false,fallbackUsed:false,completed:false,contextDurationMs:0,context:{},module:{moduleId:"expert-exordium-f9t2d3",durationMs:0,invokedModules:1,result:{}},plan:null};
  vm.runInContext("expertRuntimeStateF9T1.activeByPlayer[1]=__runtime",ctx);
  vm.runInContext(`expertEmitF9T1(EventTypes.AI_EXPERT_TURN_STARTED,1,{sequence:${sequence},faction:'Exordium'}); expertEmitF9T1(EventTypes.AI_EXPERT_CONTEXT_CREATED,1,{sequence:${sequence},context:{}}); expertEmitF9T1(EventTypes.AI_EXPERT_MODULE_ROUTED,1,{sequence:${sequence},moduleId:'expert-exordium-f9t2d3',invokedModules:1,durationMs:0,moduleStatus:'smoke'});`,ctx);
}
function complete(){return vm.runInContext("expertCompleteTurnF9T1(1,{reason:'f9t2c3a-smoke'})",ctx);}
function turn(sequence){return vm.runInContext(`JSON.parse(JSON.stringify(state.matchTelemetry.expertAi.turns.find(t=>t.side===1&&t.sequence===${sequence})))`,ctx);}

// R6: deployment record belongs only to R6.
begin(6,6);
vm.runInContext("expertEmitDecisionLimitedF9T2c1(1,{kind:'forward_pivot_deployed',unitId:'mech',deploymentRound:6})",ctx);
vm.runInContext(`state.expertAiF9T2c={schemaVersion:EXPERT_EXORDIUM_DOCTRINE_SCHEMA_VERSION_F9T2C1,forwardPivotByPlayer:{},pivotImpactByUnit:{mech:{player:1,unitId:'mech',blueprintId:'EXPIV02',deploymentSource:'advanced_fallback',deployedRound:6,impactDeadlineRound:8,deploymentSequence:6,deploymentCell:[-5,10,-5],projectedEndCellNextTurn:[-1,6,-5],objectiveType:'ENEMY_PS_CAPTURE',objectiveCell:[-1,6,-5],status:'awaiting_impact',impactWindowMissRecorded:false}},lastForwardPivotResultByPlayer:{},pivotResults:[],pendingTemporalDecisionsByPlayer:{}}`,ctx);
complete();
let r6=turn(6);
eq(r6.decisions.length,1,"R6 conserva soltanto il deployment");
ok(!r6.decisions.some(d=>d.kind.includes('impact_window')||d.kind.includes('late_impact')),"R6 non riceve annotazioni retroattive");
eq(r6.decisionRecordsStored,r6.decisions.length,"R6 stored coincide con array");
eq(r6.decisionRecordsTotal,r6.decisionRecordsStored+r6.decisionRecordsDropped,"R6 total riconciliato");
ok(r6.decisionReconciliationOk,"R6 riconciliazione valida");

// R9: expiry determined and stored in R9 with reference to R6.
begin(9,9);
eq(vm.runInContext("expertExordiumCheckForwardPivotExpiryF9T2c(1)",ctx),true,"scadenza rilevata in R9");
complete();
let r9=turn(9), miss=r9.decisions.find(d=>d.kind==='forward_pivot_impact_window_missed');
ok(Boolean(miss),"WINDOW_EXPIRED conservato in R9");
eq(miss.deploymentTurnSequence,6,"R9 riferisce il turno di deployment");
eq(miss.temporalOwnerSequence,9,"R9 è proprietario temporale del record");
eq(r9.decisionRecordsStored,r9.decisions.length,"R9 stored coincide con array");
eq(r9.decisionRecordsTotal,r9.decisionRecordsStored+r9.decisionRecordsDropped,"R9 total riconciliato");
ok(r9.decisionReconciliationOk,"R9 riconciliazione valida");

// R12: first late impact determined and stored in R12, not R6.
begin(12,12);
eq(vm.runInContext("expertAiHandleGameEventF9T2c({type:EventTypes.UNIT_ATTACKED,data:{attackerId:'mech',defenderId:'enemy',amount:2}})",ctx),true,"impatto tardivo rilevato in R12");
complete();
let r12=turn(12), late=r12.decisions.find(d=>d.kind==='forward_pivot_late_impact');
ok(Boolean(late),"LATE_IMPACT conservato in R12");
eq(late.deploymentTurnSequence,6,"R12 riferisce il deployment R6");
eq(late.temporalOwnerSequence,12,"R12 è proprietario temporale del record");
eq(r12.decisionRecordsStored,r12.decisions.length,"R12 stored coincide con array");
eq(r12.decisionRecordsTotal,r12.decisionRecordsStored+r12.decisionRecordsDropped,"R12 total riconciliato");
ok(r12.decisionReconciliationOk,"R12 riconciliazione valida");
r6=turn(6); eq(r6.decisions.length,1,"R6 resta immutabile dopo R9 e R12");

// Late write to finalized turn is rejected and diagnosed.
ctx.__late={type:EventTypes.AI_EXPERT_DECISION,data:{player:1,sequence:6,decision:{kind:'illegal_retroactive_write'}}};
vm.runInContext("updateMatchTelemetryFromEvent(__late)",ctx);
r6=turn(6); eq(r6.decisions.length,1,"scrittura tardiva rifiutata sul turno finalizzato");
ok(vm.runInContext("state.matchTelemetry.expertAi.diagnostics.some(d=>d.kind==='late_decision_for_finalized_turn'&&d.sequence===6)",ctx),"diagnostica tardiva registrata");

// Audit atomic items and audit containers use homogeneous units.
begin(20,20);
vm.runInContext(`expertExordiumEmitCandidateAuditBatchF9T2c3(1,'relay','bastion_relay_candidate_audit_batch','smoke',Array.from({length:22},(_,i)=>({rejectionReason:i<20?'ps_not_owned':'valid_candidate'})),12)`,ctx);
vm.runInContext(`expertExordiumEmitDecisionF9T2b(1,'relay_survival_assessment_batch',{assessments:[{},{},{}],assessmentTotal:3})`,ctx);
for(let i=0;i<3;i++) vm.runInContext(`expertExordiumEmitDecisionF9T2b(1,'bastion_ps_build_gate',{source:'smoke-${i}'})`,ctx);
complete();
const r20=turn(20), mod=vm.runInContext("JSON.parse(JSON.stringify(state.matchTelemetry.expertAi.modules.Exordium))",ctx);
eq(r20.auditItemsTotal,28,"28 audit item atomici prodotti");
eq(r20.auditItemsStored,18,"18 audit item atomici conservati");
eq(r20.auditItemsDropped,10,"10 audit item atomici scartati");
eq(r20.auditContainersTotal,5,"5 container audit prodotti");
eq(r20.auditContainersStored,5,"5 container audit conservati");
eq(r20.auditContainersDropped,0,"nessun container audit scartato");
eq(r20.auditRecordsTotal,5,"campo auditRecordsTotal coerente sui container");
eq(r20.auditRecordsStored,5,"campo auditRecordsStored coerente sui container");
eq(r20.auditRecordsDropped,0,"campo auditRecordsDropped coerente sui container");
eq(mod.auditItemsTotal,28,"modulo aggrega gli item atomici");
eq(mod.auditContainersTotal,5,"modulo aggrega i container");
eq(mod.auditRecordsTotal,5,"legacy auditRecords del modulo coerente sui container");
ok(vm.runInContext("state.matchTelemetry.expertAi.doctrineSchemaVersion==='F9T2d3-1'",ctx),"schema F9T2d2a-1");

console.log(`F9T2c3a Turn Ownership & Audit Unit Consistency smoke: ${checks}/${checks} verifiche superate`);
