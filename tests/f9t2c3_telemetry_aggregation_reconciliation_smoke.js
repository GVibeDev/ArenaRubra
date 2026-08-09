"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert");
const ROOT=path.resolve(__dirname,".."); let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++}; const eq=(a,b,m)=>{assert.strictEqual(a,b,m);checks++};
const eventNames=[
  "GAME_STARTED","TURN_ENDED","CARD_DRAWN","CARD_PLAYED","AI_EXPERT_TURN_STARTED","AI_EXPERT_CONTEXT_CREATED",
  "AI_EXPERT_MODULE_ROUTED","AI_EXPERT_FALLBACK","AI_EXPERT_DECISION","AI_EXPERT_TURN_COMPLETED",
  "AI_MICROPLAN_SELECTED","AI_MICROPLAN_STEP","AI_MICROPLAN_COMPLETED","AI_MICROPLAN_ABORTED","VICTORY"
];
const EventTypes=Object.fromEntries(eventNames.map(x=>[x,x]));
const state={
  aiMode:"expert",matchId:"f9t2c3-smoke",matchSeed:"seed",matchRngCalls:0,matchRngState:1,
  turn:12,currentPlayer:1,turnOrder:[1,2],factions:{1:"Exordium",2:"Nexus"},modes:{1:"bot",2:"bot"},
  energy:{1:8,2:8},hand:{1:[],2:[]},deck:{1:[],2:[]},discard:{1:[],2:[]},units:[],cells:[],
  selectedCommanders:{},selectedDecks:{},mapId:"map1",mapDefinition:{name:"Smoke",movementMultiplier:2,metadata:{revision:1}},
  pacePreset:"standard",gameScaleMode:"large_scale"
};
const ctx=vm.createContext({console,JSON,Date,Math,Number,String,Boolean,Object,Array,Map,Set,state,EventTypes,performance:{now:()=>1},BUILD_INFO:{version:"C2-STABLE-1-F9T2d3-APK-M4c"}});
vm.runInContext(fs.readFileSync(path.join(ROOT,"src/match_telemetry.js"),"utf8"),ctx,{filename:"match_telemetry.js"});
vm.runInContext("initializeMatchTelemetry()",ctx);
const emit=(type,data)=>vm.runInContext(`updateMatchTelemetryFromEvent(${JSON.stringify({type:null,data:null}).replace('null','undefined')})`,ctx);
function send(type,data){ ctx.__evt={type,data}; vm.runInContext("updateMatchTelemetryFromEvent(__evt)",ctx); }
send(EventTypes.AI_EXPERT_TURN_STARTED,{player:1,sequence:1,faction:"Exordium"});
send(EventTypes.AI_EXPERT_CONTEXT_CREATED,{player:1,sequence:1,context:{}});
send(EventTypes.AI_EXPERT_MODULE_ROUTED,{player:1,sequence:1,moduleId:"expert-exordium-f9t2c3",faction:"Exordium"});
const batch=(kind,scanner,audits,auditTotal,rejectionCounts)=>send(EventTypes.AI_EXPERT_DECISION,{player:1,sequence:1,decision:{kind,scanner,audits,auditTotal,rejectionCounts,auditRecord:true}});
batch("bastion_relay_candidate_audit_batch","relay",[{rejectionReason:"ps_not_owned"},{rejectionReason:"valid_candidate"}],5,{ps_not_owned:3,valid_candidate:2});
batch("territorial_conversion_candidate_audit_batch","clearOccupyFortify",[{rejectionReason:"no_enemy_ps_presidium"},{rejectionReason:"no_enemy_ps_presidium"}],4,{no_enemy_ps_presidium:4});
batch("forward_pivot_candidate_audit_batch","forwardPivot",[{rejectionReason:"insufficient_energy"},{rejectionReason:"insufficient_energy"},{rejectionReason:"valid_candidate"}],3,{insufficient_energy:2,valid_candidate:1});
for(let i=0;i<30;i++) send(EventTypes.AI_EXPERT_DECISION,{player:1,sequence:1,decision:{kind:`decision-${i}`}});
send(EventTypes.AI_EXPERT_TURN_COMPLETED,{
  player:1,sequence:1,moduleId:"expert-exordium-f9t2c3",decisionCount:24,decisionRecordsTotal:30,decisionRecordsStored:24,decisionRecordsDropped:6,
  auditRecordTotal:12,auditRecordsDropped:5,candidateAuditCount:12,candidateAuditCountByScanner:{relay:5,clearOccupyFortify:4,forwardPivot:3},
  candidateRejectionCounts:{ps_not_owned:3,valid_candidate:3,no_enemy_ps_presidium:4,insufficient_energy:2},
  candidateRejectionCountsByScanner:{relay:{ps_not_owned:3,valid_candidate:2},clearOccupyFortify:{no_enemy_ps_presidium:4},forwardPivot:{insufficient_energy:2,valid_candidate:1}},
  territorialConversionMetrics:{psClearedDuringExpertPlan:1,psClearedDirectlyByExpertStep:0,psOccupiedAfterClear:1,psFortifiedAfterClear:0},
  totalDurationMs:4
});
const out=vm.runInContext("JSON.parse(JSON.stringify(state.matchTelemetry.expertAi))",ctx);
const turn=out.turns[0],mod=out.modules.Exordium;
eq(turn.candidateAuditsTotal,12,"turn audit candidati totali"); eq(turn.candidateAuditsStored,7,"turn audit candidati conservati"); eq(turn.candidateAuditsDropped,5,"turn audit candidati scartati");
eq(mod.candidateAuditsTotal,12,"modulo audit candidati totali"); eq(mod.candidateAuditsStored,7,"modulo audit candidati conservati"); eq(mod.candidateAuditsDropped,5,"modulo audit candidati scartati");
eq(mod.candidateAuditCountByScanner.relay,5,"audit Relay separati"); eq(mod.candidateAuditCountByScanner.clearOccupyFortify,4,"audit Clear separati"); eq(mod.candidateAuditCountByScanner.forwardPivot,3,"audit Forward separati");
eq(mod.relayCandidateRejectionCounts.ps_not_owned,3,"rifiuti Relay riconciliati"); eq(mod.clearCandidateRejectionCounts.no_enemy_ps_presidium,4,"rifiuti Clear riconciliati"); eq(mod.forwardPivotCandidateRejectionCounts.insufficient_energy,2,"rifiuti Forward riconciliati");
eq(mod.candidateRejectionCounts.valid_candidate,3,"aggregato rifiuti/candidati valido senza perdita");
eq(mod.decisionRecordsTotal,30,"decisioni totali modulo"); eq(mod.decisionRecordsStored,24,"decisioni conservate modulo"); eq(mod.decisionRecordsDropped,6,"decisioni scartate modulo");
eq(mod.psClearedDuringExpertPlan,1,"PS liberato durante piano"); eq(mod.psClearedDirectlyByExpertStep,0,"PS non liberato direttamente dal passo Expert");
eq(mod.psCleared,1,"campo legacy psCleared riconciliato al risultato del piano"); eq(mod.psOccupiedAfterClear,1,"occupazione successiva al clear");
ok(out.doctrineSchemaVersion==="F9T2d3-1","schema F9T2c3");
console.log(`F9T2c3 Telemetry Aggregation Reconciliation smoke: ${checks}/${checks} verifiche superate`);
