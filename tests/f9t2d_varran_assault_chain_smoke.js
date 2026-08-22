"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert");
const ROOT=path.resolve(__dirname,".."); let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++;};
const eq=(a,b,m)=>{assert.strictEqual(a,b,m);checks++;};
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.join(",")===b.join(",");
const dist=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2]));
const adj=(a,b)=>dist(a,b)===1;
const EventTypes=Object.fromEntries([
  "AI_EXPERT_DECISION","AI_MICROPLAN_STEP","AI_MICROPLAN_COMPLETED","AI_MICROPLAN_ABORTED","AI_EXPERT_FALLBACK",
  "AI_EXPERT_TURN_STARTED","AI_EXPERT_CONTEXT_CREATED","AI_EXPERT_MODULE_ROUTED","AI_EXPERT_TURN_COMPLETED",
  "UNIT_SPAWNED","UNIT_ATTACKED","ABILITY_USED","PS_CONTROL_CHANGED","UNIT_DESTROYED"
].map(x=>[x,x]));

function makeState(){
  return {
    aiMode:"expert",turn:10,currentPlayer:1,factions:{1:"Exordium",2:"Nexus"},modes:{1:"bot",2:"bot"},
    energy:{1:5,2:5},pressure:{1:0,2:0},cells:[],hand:{1:[],2:[]},starterCards:{1:{},2:{}},
    units:[
      {uid:"hq-ex",side:1,faction:"Exordium",type:"QG",pos:[-5,5,0],alive:true,acted:false,currentHp:20,currentDef:0},
      {uid:"hq-nx",side:2,faction:"Nexus",type:"QG",pos:[5,-5,0],alive:true,acted:false,currentHp:20,currentDef:0},
      {uid:"varran",blueprintId:"EX0B00",name:"Varran",side:1,faction:"Exordium",type:"Comandante",pos:[0,0,0],alive:true,acted:false,abilityUsedThisTurn:false,cooldownLeft:0,currentAtt:0,att:0,attacksMade:0,attacksPerTurn:1,buffs:[],currentHp:8,currentDef:0,ability:{name:"Ordine di Varran",kind:"varranOrder",value:1,range:1,cooldown:2,cost:1,target:"ally"}},
      {uid:"actor",name:"Legionario",side:1,faction:"Exordium",type:"Fanteria",pos:[1,-1,0],alive:true,acted:false,movedThisTurn:false,currentAtt:3,att:3,attacksMade:0,attacksPerTurn:1,buffs:[],cost:2,currentHp:5,currentDef:0},
      {uid:"enemy",name:"Mech Nexus",side:2,faction:"Nexus",type:"Veicolo",pos:[2,-2,0],alive:true,acted:false,currentHp:4,maxHp:4,currentDef:0,maxDef:0,weight:"Pesante",cost:3},
      {uid:"enemy2",name:"Drone Nexus",side:2,faction:"Nexus",type:"Fanteria",pos:[2,-1,-1],alive:true,acted:false,currentHp:6,maxHp:6,currentDef:0,maxDef:0,weight:"Leggera",cost:1}
    ]
  };
}
const state=makeState();
const emitted=[]; let now=0;
const combatUnits=s=>state.units.filter(u=>u.alive!==false&&u.side===s&&u.type!=="QG");
const getUnitAt=c=>state.units.find(u=>u.alive!==false&&u.type!=="QG"&&same(u.pos,c))||null;
const getCellAt=c=>state.cells.find(x=>same(x.coord,c))||null;
const canAct=u=>!!u&&u.alive!==false&&!u.acted;
const canMove=u=>canAct(u)&&!u.movedThisTurn;
const canActAfterMove=u=>!!u&&(u.type==="Fanteria"||u.type==="Comandante"||u.moveAttack||u.warPush);
const canAttack=u=>canAct(u)&&u.type!=="Struttura"&&u.type!=="QG"&&(u.attacksMade||0)<(u.attacksPerTurn||1)&&!(u.type==="Veicolo"&&u.movedThisTurn&&!u.moveAttack&&!u.warPush);
const movableCells=u=>{ if(!canMove(u))return []; if(u.uid==="actor") return [[1,0,-1]]; return []; };
const abilityTargets=(u,ab)=>combatUnits(u.side).filter(t=>dist(u.pos,t.pos)<=Number(ab.range||0));
const canUseAbility=(u,ab)=>canAct(u)&&!u.abilityUsedThisTurn&&u.cooldownLeft<=0&&state.energy[u.side]>=Number(ab.cost||0);
const effectiveAtt=u=>Number(u.currentAtt||u.att||0);
const effectiveLife=u=>Math.max(0,Number(u.currentHp||0)+Number(u.currentDef||0));
const previewBasicAttackOutcome=(attacker,defender,options={})=>{
  const amount=Math.max(0,Number(options.effectiveAttack==null?effectiveAtt(attacker):options.effectiveAttack));
  const def=Math.max(0,Number(defender.currentDef||0));
  const hp=Math.max(0,Number(defender.currentHp||0));
  const defLoss=def>0?Math.min(def,amount):0;
  const hpLoss=def>0?0:Math.min(hp,amount);
  return {originalTargetUnitId:defender.uid,targetUnitId:defender.uid,intercepted:false,effectiveAttack:amount,amount,defLoss,hpLoss,effectiveDamage:defLoss+hpLoss,overflowLost:def>0?Math.max(0,amount-defLoss):0,remainingDef:Math.max(0,def-defLoss),remainingHp:Math.max(0,hp-hpLoss),targetDestroyed:Math.max(0,hp-hpLoss)<=0};
};
const ctx=vm.createContext({
  console,Map,Set,Object,Array,Number,String,Boolean,Math,JSON,Date,state,EventTypes,BLUEPRINTS:[],
  performance:{now:()=>now+=.05,memory:{usedJSHeapSize:1000}},sameCoord:same,hexDistance:dist,areAdjacent:adj,
  combatUnits,getUnitAt,getCellAt,getHq:s=>state.units.find(u=>u.type==="QG"&&u.side===s),getEnemyPlayers:p=>p===1?[2]:[1],enemyOf:p=>p===1?2:1,
  canAct,canMove,canActAfterMove,canAttack,movableCells,abilityTargets,canUseAbility,effectiveAtt,effectiveLife,previewBasicAttackOutcome,
  effectiveAbilityCost:(p,ab)=>Number(ab.cost||0),scoreAttackTarget:(a,d)=>effectiveAtt(a)+(d.weight==="Pesante"?3:0),
  emitGameEvent:e=>{emitted.push(JSON.parse(JSON.stringify(e)));return e;},telemetryRecordExpertDecisionF9T1:()=>{},
  useAbility:(u,t,ab)=>{if(!canUseAbility(u,ab))return;state.energy[u.side]-=Number(ab.cost||0);t.currentAtt+=Number(ab.value||0);t.buffs.push({stat:"att",value:Number(ab.value||0),turns:1,source:ab.name});u.abilityUsedThisTurn=true;u.cooldownLeft=Number(ab.cooldown||0);u.c2finalc2ReadyAfterAbility=true;},
  botMoveUnitF9T0:(u,c)=>{u.pos=c.slice();u.movedThisTurn=true;},
  attackUnit:(a,d)=>{if(!canAttack(a)||!adj(a.pos,d.pos))return;a.attacksMade=(a.attacksMade||0)+1;const out=previewBasicAttackOutcome(a,d,{effectiveAttack:effectiveAtt(a)});d.currentDef=Math.max(0,d.currentDef-out.defLoss);d.currentHp=Math.max(0,d.currentHp-out.hpLoss);if(d.currentHp<=0)d.alive=false;},
  shouldEndAfterAttack:u=>(u.attacksMade||0)>=(u.attacksPerTurn||1),endUnitAction:u=>{u.acted=true;},finishBotMove:u=>{u.acted=true;},
  isCellEnterable:()=>true,getMapTerrainAt:()=>null,countControlledPS:()=>0,botPressureProfileF9T0:()=>({totalPs:0,requiredPs:1,pressureWin:5,maxRound:35}),pressureRuleProfile:()=>({centralCoord:null,requiredPs:1,pressureWin:5,maxRound:35})
});
for(const rel of ["src/expert_ai/expert_common_strategy.js","src/expert_ai/expert_exordium.js","src/expert_ai/expert_router.js","src/expert_ai/expert_runtime.js"])
  vm.runInContext(fs.readFileSync(path.join(ROOT,rel),"utf8"),ctx,{filename:rel});
vm.runInContext("expertExordiumHasImmediateTerritorialCandidateF9T2c1=()=>false; expertExordiumForwardPivotCandidatesF9T2c=()=>[];",ctx);
const context={player:1,faction:"Exordium",turn:10,common:{hqOccupationRisk:{risk:"none"}}};

// Deterministic combat rule: no overflow from DEF to HP.
const actor=state.units.find(u=>u.uid==="actor"), enemy=state.units.find(u=>u.uid==="enemy"), enemy2=state.units.find(u=>u.uid==="enemy2"), varran=state.units.find(u=>u.uid==="varran");
actor.currentAtt=6; enemy.currentDef=3; enemy.currentHp=4;
let zero=vm.runInContext("expertExordiumEvaluateVarranAssaultOptionF9T2d1",ctx)(1,varran,actor,enemy,context,[],[enemy],null);
eq(zero.option,null,"ATT 6→7 contro DEF 3 non crea danno marginale");
eq(zero.audit.rejectionReason,"no_marginal_bonus_value","rifiuto marginale corretto");
eq(zero.audit.baseEffectiveDamage,3,"base rimuove solo DEF");
eq(zero.audit.orderedEffectiveDamage,3,"bonus eccedente non perfora");

// A real +1 HP damage and enabled immediate kill is accepted.
actor.currentAtt=3; enemy.currentDef=0; enemy.currentHp=4; enemy.alive=true;
let useful=vm.runInContext("expertExordiumEvaluateVarranAssaultOptionF9T2d1",ctx)(1,varran,actor,enemy,context,[],[enemy],null);
ok(useful.option,"candidato con danno marginale reale accettato");
eq(useful.option.predictedBonusEffectiveDamage,1,"danno marginale previsto = 1");
eq(useful.option.baseWouldKill,false,"attacco base non elimina");
eq(useful.option.immediateKillPredicted,true,"attacco ordinato elimina");
eq(useful.option.bonusEnabledKill,true,"bonus abilita la kill");

// Base kill must not consume the ability.
actor.currentAtt=5; enemy.currentHp=4;
let baseKill=vm.runInContext("expertExordiumEvaluateVarranAssaultOptionF9T2d1",ctx)(1,varran,actor,enemy,context,[],[enemy],null);
eq(baseKill.option,null,"kill base già garantita rifiutata");
eq(baseKill.audit.rejectionReason,"base_attack_already_kills","ragione base kill corretta");

// Build and execute a valid plan.
actor.currentAtt=3; actor.att=3; actor.acted=false; actor.movedThisTurn=false; actor.attacksMade=0; actor.buffs=[];
enemy.currentHp=4; enemy.currentDef=0; enemy.alive=true; enemy2.alive=false;
varran.acted=false; varran.abilityUsedThisTurn=false; varran.cooldownLeft=0; state.energy[1]=5;
const result=vm.runInContext("expertExordiumModuleF9T2c",ctx)(context);
eq(result.moduleId,"expert-exordium-f9t2d3","modulo F9T2d2a instradato");
eq(result.status,"microplan_selected","micro-piano Varran selezionato");
eq(result.plan.goal,"EXORDIUM_VARRAN_ASSAULT_CHAIN","goal corretto");
eq(result.plan.orderedSteps.length,2,"catena piatta in due passi");
eq(result.plan.orderedSteps[0].action,"use_varran_order","prima abilità");
eq(result.plan.orderedSteps[1].action,"execute_varran_assault","poi attacco");
eq(result.plan.orderedSteps[1].stationaryAttackBranch,true,"ramo stazionario dichiarato");
eq(result.plan.orderedSteps[1].movementRequired,false,"nessun movimento richiesto");
eq(result.plan.orderedSteps[1].movementSkippedReason,"already_in_attack_range","salto movimento motivato");
eq(result.plan.reservedEnergy,1,"ENE abilità riservata");
eq(result.plan.expectedResult.predictedBonusEffectiveDamage,1,"margine previsto nel piano");
eq(result.plan.expectedResult.baseWouldKill,false,"baseWouldKill nel piano");
eq(result.plan.expectedResult.immediateKillPredicted,true,"kill immediata prevista");
eq(result.plan.expectedResult.bonusEnabledKill,true,"kill abilitata dal bonus");
ok(!("killEnabled" in result.plan.expectedResult),"killEnabled legacy rimosso dal piano");

ctx.expertRuntimeStateF9T1.activeByPlayer[1]={sequence:20,player:1,turn:10,faction:"Exordium",context,module:{moduleId:"expert-exordium-f9t2d3"},plan:result.plan,decisions:[],decisionTotal:0,decisionRecordsEmitted:0,decisionRecordsDropped:0,decisionLimitReached:false,auditRecordTotal:0,auditRecordsDropped:0};
result.plan.status="active";
ok(vm.runInContext("expertFactionUnitPriorityBonusF9T2(state.units.find(u=>u.uid==='varran'))",ctx)>=1900,"Varran agisce per primo");
eq(vm.runInContext("expertFactionTryPlannedUnitActionF9T2(state.units.find(u=>u.uid==='varran'))",ctx),true,"Ordine eseguito");
eq(state.energy[1],4,"costo abilità pagato");
eq(actor.currentAtt,4,"alleato riceve +1 ATT");
eq(result.plan.currentStep,1,"passo abilità completato");
const orderDecision=emitted.find(e=>e.type==="AI_EXPERT_DECISION"&&e.data.decision.kind==="varran_assault_order_committed").data.decision;
eq(orderDecision.source,"expert_exordium_f9t2d2a","sorgente F9T2d2a");
eq(orderDecision.featureRevision,"F9T2d2a","revisione F9T2d2a");
eq(orderDecision.predictedBonusEffectiveDamage,1,"ordine conserva il margine previsto");
ok(vm.runInContext("expertFactionUnitPriorityBonusF9T2(state.units.find(u=>u.uid==='actor'))",ctx)>=1800,"attaccante prioritario");
eq(vm.runInContext("expertFactionTryReservedStationaryAssaultActionF9T2d2a(state.units.find(u=>u.uid==='actor'))",ctx),true,"attacco stazionario prenotato eseguito prima del fallback");
eq(enemy.alive,false,"bersaglio eliminato grazie al bonus");
eq(result.plan.status,"completed","micro-piano completato");
const assaultDecision=emitted.find(e=>e.type==="AI_EXPERT_DECISION"&&e.data.decision.kind==="varran_assault_executed").data.decision;
eq(assaultDecision.predictedBonusEffectiveDamage,1,"margine previsto telemetrizzato");
eq(assaultDecision.actualBonusEffectiveDamage,1,"margine reale telemetrizzato");
eq(assaultDecision.predictedHpDamage,4,"danno HP previsto");
eq(assaultDecision.actualHpDamage,4,"danno HP reale");
eq(assaultDecision.immediateKillPredicted,true,"kill prevista telemetrizzata");
eq(assaultDecision.immediateKillAchieved,true,"kill ottenuta telemetrizzata");
eq(assaultDecision.bonusEnabledKill,true,"bonus-enabled kill telemetrizzata");
eq(assaultDecision.predictionMatched,true,"previsione coincide col risultato");
eq(assaultDecision.stationaryAttackBranch,true,"telemetria ramo stazionario");
eq(assaultDecision.movementRequired,false,"telemetria nessun movimento");
eq(assaultDecision.movementSkippedReason,"already_in_attack_range","telemetria salto movimento");
eq(assaultDecision.attackOwnership,"expert_executor","proprietà attacco Expert");
eq(assaultDecision.attackExecutionRecognized,true,"attacco riconosciuto");
eq(assaultDecision.requestedActorId,"actor","attore richiesto riconciliato");
eq(assaultDecision.actualActorId,"actor","attore reale riconciliato");
eq(assaultDecision.requestedTargetUnitId,"enemy","bersaglio richiesto riconciliato");
eq(assaultDecision.actualTargetUnitId,"enemy","bersaglio reale riconciliato");

// Retarget bounded with the already-active +1, without double counting it.
state.turn=11; state.energy[1]=5;
Object.assign(varran,{abilityUsedThisTurn:false,cooldownLeft:0,acted:false});
Object.assign(actor,{acted:false,movedThisTurn:false,attacksMade:0,currentAtt:3,att:3,pos:[1,-1,0],buffs:[]});
Object.assign(enemy,{alive:true,currentHp:4,maxHp:4,currentDef:0,pos:[2,-2,0]});
Object.assign(enemy2,{alive:true,currentHp:4,maxHp:4,currentDef:0,pos:[2,-1,-1]});
const retargetContext={player:1,faction:"Exordium",turn:11,common:{hqOccupationRisk:{risk:"none"}}};
const retargetResult=vm.runInContext("expertExordiumModuleF9T2c",ctx)(retargetContext);
ctx.expertRuntimeStateF9T1.activeByPlayer[1]={sequence:21,player:1,turn:11,faction:"Exordium",context:retargetContext,module:{moduleId:"expert-exordium-f9t2d3"},plan:retargetResult.plan,decisions:[],decisionTotal:0,decisionRecordsEmitted:0,decisionRecordsDropped:0,decisionLimitReached:false,auditRecordTotal:0,auditRecordsDropped:0};
retargetResult.plan.status="active";
eq(vm.runInContext("expertFactionTryPlannedUnitActionF9T2(state.units.find(u=>u.uid==='varran'))",ctx),true,"Ordine prima del retarget");
enemy.alive=false;
eq(vm.runInContext("expertFactionTryPlannedUnitActionF9T2(state.units.find(u=>u.uid==='actor'))",ctx),true,"attacco retarget eseguito");
eq(enemy2.alive,false,"bersaglio sostitutivo eliminato");
eq(retargetResult.plan.exordium.targetReassignments,1,"un solo retarget");
const retargetDecision=emitted.filter(e=>e.type==="AI_EXPERT_DECISION"&&e.data.decision.kind==="varran_assault_target_reassigned").at(-1).data.decision;
eq(retargetDecision.predictedBonusEffectiveDamage,1,"retarget usa il solo +1 già applicato");

// One bounded move before attack.
state.turn=12; state.energy[1]=5;
Object.assign(varran,{abilityUsedThisTurn:false,cooldownLeft:0,acted:false});
Object.assign(actor,{acted:false,movedThisTurn:false,attacksMade:0,currentAtt:3,att:3,pos:[1,-1,0],buffs:[]});
Object.assign(enemy,{alive:false});
Object.assign(enemy2,{alive:true,currentHp:4,maxHp:4,currentDef:0,pos:[2,0,-2]});
const moveContext={player:1,faction:"Exordium",turn:12,common:{hqOccupationRisk:{risk:"none"}}};
const moveResult=vm.runInContext("expertExordiumModuleF9T2c",ctx)(moveContext);
eq(moveResult.plan.orderedSteps[1].moveCell.join(","),"1,0,-1","movimento singolo pianificato");
ctx.expertRuntimeStateF9T1.activeByPlayer[1]={sequence:22,player:1,turn:12,faction:"Exordium",context:moveContext,module:{moduleId:"expert-exordium-f9t2d3"},plan:moveResult.plan,decisions:[],decisionTotal:0,decisionRecordsEmitted:0,decisionRecordsDropped:0,decisionLimitReached:false,auditRecordTotal:0,auditRecordsDropped:0};
moveResult.plan.status="active";
eq(vm.runInContext("expertFactionTryPlannedUnitActionF9T2(state.units.find(u=>u.uid==='varran'))",ctx),true,"Ordine prima del movimento");
eq(vm.runInContext("expertFactionTryPlannedUnitActionF9T2(state.units.find(u=>u.uid==='actor'))",ctx),true,"movimento e attacco concatenati");
eq(actor.pos.join(","),"1,0,-1","attaccante raggiunge cella prevista");
eq(enemy2.alive,false,"bersaglio eliminato dopo movimento");

// HQ risk blocks the chain.
state.turn=13; state.energy[1]=5;
Object.assign(varran,{abilityUsedThisTurn:false,cooldownLeft:0,acted:false});
Object.assign(actor,{acted:false,movedThisTurn:false,attacksMade:0,currentAtt:3,att:3,pos:[1,-1,0],buffs:[]});
Object.assign(enemy,{alive:true,currentHp:4,currentDef:0,pos:[2,-2,0]});
const emittedBeforeRisk=emitted.length;
const blocked=vm.runInContext("expertExordiumVarranAssaultCandidatesF9T2d",ctx)({player:1,faction:"Exordium",turn:13,common:{hqOccupationRisk:{risk:"direct"}}});
vm.runInContext("expertFlushDeferredModuleTelemetryF9T2d1(1)",ctx);
eq(blocked.length,0,"rischio QG diretto blocca la catena");
const riskDecision=emitted.slice(emittedBeforeRisk).find(e=>e.type==="AI_EXPERT_DECISION"&&e.data.decision.kind==="varran_assault_scan");
eq(riskDecision.data.decision.rejectionCounts.hq_occupation_risk_priority,1,"blocco QG telemetrizzato");

// Candidate audits are emitted and integrated under the Varran scanner.
const auditBatch=emitted.find(e=>e.type==="AI_EXPERT_DECISION"&&e.data.decision.kind==="varran_assault_candidate_audit_batch");
ok(auditBatch,"batch audit Varran emesso");
eq(auditBatch.data.decision.scanner,"varranAssault","scanner audit corretto");
eq(auditBatch.data.decision.source,"expert_exordium_f9t2d2a","sorgente audit corretta");

const telemetry=fs.readFileSync(path.join(ROOT,"src/match_telemetry.js"),"utf8");
ok(telemetry.includes('MATCH_TELEMETRY_EXPERT_DOCTRINE_SCHEMA_VERSION = "F9T2d3-1"'),"schema telemetrico F9T2d2a");
ok(telemetry.includes("varranCandidateRejectionCounts"),"rejection counts Varran presenti");
ok(telemetry.includes('varranAssault:0'),"scanner Varran presente negli aggregati");
ok(telemetry.includes('recordKind === "varran_assault_candidate_audit_batch"'),"batch Varran riconosciuto come candidate audit");
ok(telemetry.includes("varranActualBonusEffectiveDamage"),"margine reale aggregato");
const build=fs.readFileSync(path.join(ROOT,"src/build_info.js"),"utf8");
ok(build.includes('version: "C2-STABLE-1-F9V2f-APK-M4c"'),"versione build corretta");
ok(build.includes('logicBaseline: "C2-STABLE-1-F9T2c4-APK-M4c"'),"baseline logica preservata");
const ai=fs.readFileSync(path.join(ROOT,"src/ai.js"),"utf8");
const preemptIndex=ai.indexOf("expertFactionTryReservedStationaryAssaultActionF9T2d2a");
const emergencyIndex=ai.indexOf("emergencyBotAction(unit",preemptIndex);
ok(preemptIndex>=0&&emergencyIndex>preemptIndex,"hook stazionario precede emergenza/fallback");
ok(telemetry.includes("varranStationaryAssaultsExecuted"),"aggregato assalti stazionari presente");
ok(telemetry.includes("varranAttackOwnershipRecognized"),"aggregato ownership riconosciuta presente");
console.log(`F9T2d2a Effective Assault Value smoke: ${checks}/${checks} verifiche superate`);
