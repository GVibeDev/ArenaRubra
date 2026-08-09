"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert");
const ROOT=path.resolve(__dirname,".."); let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++}; const equal=(a,e,m)=>{assert.strictEqual(a,e,m);checks++};
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.join(",")===b.join(",");
const distance=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2]));
const eventNames=["UNIT_DESTROYED","UNIT_SPAWNED","UNIT_MOVED","UNIT_ATTACKED","AI_EXPERT_TURN_STARTED","AI_EXPERT_CONTEXT_CREATED","AI_EXPERT_MODULE_ROUTED","AI_MICROPLAN_SELECTED","AI_MICROPLAN_STEP","AI_MICROPLAN_COMPLETED","AI_MICROPLAN_ABORTED","AI_EXPERT_DECISION","AI_EXPERT_FALLBACK","AI_EXPERT_BUDGET_EXHAUSTED","AI_EXPERT_TURN_COMPLETED"];
const EventTypes=Object.fromEntries(eventNames.map(x=>[x,x]));
const BLUEPRINTS=[{id:"EX4B02",faction:"Exordium",name:"Bastione Armato",type:"Struttura",weight:"Leggera",cost:2,hp:3,att:0,def:2}];

function makeHarness({targetDef=1,targetHp=3,attackers=[{uid:"a",att:4,pos:[-1,0,1]}],includeOccupier=true}={}){
  let now=1; const emitted=[];
  const units=[
    {uid:"hq-ex",side:1,faction:"Exordium",type:"QG",pos:[-5,5,0],alive:true,currentHp:10,currentDef:0},
    {uid:"hq-nx",side:2,faction:"Nexus",type:"QG",pos:[5,-5,0],alive:true,currentHp:10,currentDef:0},
    {uid:"target",id:"NX-GUARD",name:"Presidio Nexus",side:2,faction:"Nexus",type:"Fanteria",cost:2,att:1,currentHp:targetHp,currentDef:targetDef,pos:[0,0,0],alive:true,acted:false}
  ];
  const adj=[[-1,0,1],[0,-1,1],[1,-1,0],[1,0,-1],[0,1,-1],[-1,1,0]];
  attackers.forEach((a,i)=>units.push({name:`Attaccante ${a.uid}`,side:1,faction:"Exordium",type:"Fanteria",cost:a.cost||2,currentHp:3,currentDef:0,alive:true,acted:false,...a,pos:a.pos||adj[i]}));
  if(includeOccupier) units.push({uid:"occ",name:"Occupante",side:1,faction:"Exordium",type:"Fanteria",cost:1,att:1,canAttackFlag:false,currentHp:2,currentDef:0,pos:adj[5],alive:true,acted:false});
  const state={matchId:`m-${Math.random()}`,aiMode:"expert",modes:{1:"bot",2:"bot"},turn:12,currentPlayer:1,factions:{1:"Exordium",2:"Nexus"},playerIds:[1,2],energy:{1:5,2:5},pressure:{1:0,2:0},mapId:"d2-test",mapDefinition:{id:"d2-test",name:"D2 Test",movementMultiplier:1},cells:[
    {coord:[-5,5,0],ps:false,control:null},{coord:[5,-5,0],ps:false,control:null},{coord:[0,0,0],ps:true,control:2},
    ...adj.map(coord=>({coord,ps:false,control:null}))
  ],units,hand:{1:[],2:[]},starterCards:{1:{},2:{}}};
  const getUnitAt=c=>state.units.find(u=>u.alive!==false&&Array.isArray(u.pos)&&same(u.pos,c))||null;
  const preview=(attacker,defender,options={})=>{
    const amount=Math.max(0,Number(options.effectiveAttack==null?attacker.att:options.effectiveAttack)||0);
    const currentDef=Math.max(0,Number(defender.currentDef||0)),currentHp=Math.max(0,Number(defender.currentHp||0));
    const defLoss=currentDef>0?Math.min(currentDef,amount):0;
    const hpLoss=currentDef>0?0:Math.min(currentHp,amount);
    return {targetUnitId:String(defender.uid||defender.id||""),intercepted:false,effectiveAttack:amount,amount,defLoss,hpLoss,effectiveDamage:defLoss+hpLoss,overflowLost:currentDef>0?Math.max(0,amount-defLoss):0,remainingDef:Math.max(0,currentDef-defLoss),remainingHp:Math.max(0,currentHp-hpLoss),targetDestroyed:Math.max(0,currentHp-hpLoss)<=0};
  };
  const context=vm.createContext({console,Map,Set,Object,Array,Number,String,Boolean,Math,JSON,Date,state,BLUEPRINTS,EventTypes,
    performance:{now:()=>now+=.1,memory:{usedJSHeapSize:4096}},emitGameEvent:e=>{emitted.push(JSON.parse(JSON.stringify(e)));return e},telemetryRecordExpertDecisionF9T1:()=>{},
    getEnemyPlayers:p=>[1,2].filter(s=>s!==p),getHq:s=>state.units.find(u=>u.type==="QG"&&u.side===s),combatUnits:s=>state.units.filter(u=>u.alive!==false&&u.side===s&&u.type!=="QG"),countControlledPS:s=>state.cells.filter(c=>c.ps&&c.control===s).length,
    getUnitAt,getCellAt:c=>state.cells.find(x=>same(x.coord,c))||null,sameCoord:same,hexDistance:distance,areAdjacent:(a,b)=>distance(a,b)===1,
    movementRangeFor:()=>1,getMapMovementMultiplier:()=>1,canAct:u=>u&&!u.acted,canMove:u=>u&&!u.acted,canAttack:u=>u&&!u.acted&&u.canAttackFlag!==false,canBuildStructures:()=>false,isCellEnterable:()=>true,getMapTerrainAt:()=>null,
    movableCells:u=>u&&u.uid==="occ"&&!getUnitAt([0,0,0])?[[0,0,0]]:[],effectiveAtt:u=>u.att||0,effectiveLife:u=>(u.currentHp||0)+(u.currentDef||0),numericalSuperiorityBonus:()=>0,
    previewBasicAttackOutcome:preview,
    attackUnit:(a,t)=>{const o=preview(a,t,{effectiveAttack:a.att||0});t.currentDef=o.remainingDef;t.currentHp=o.remainingHp;a.attacksMade=(a.attacksMade||0)+1;if(o.targetDestroyed){t.alive=false;t.acted=true;}},endUnitAction:u=>{u.acted=true},
    botMoveUnitF9T0:(u,c)=>{u.pos=c.slice();const cell=state.cells.find(x=>same(x.coord,c));if(cell&&cell.ps)cell.control=u.side;return true;},finishBotMove:u=>{u.acted=true},
    purchaseLimitReached:()=>false,playerEnergyLocked:()=>false,handCardBlocked:()=>false,effectiveHandUnitCardCost:()=>2,effectiveBlueprintCost:()=>2,starterRoleForBlueprint:()=>null,tacticalStarterCapState:()=>({blocked:false}),
    botPressureProfileF9T0:()=>({totalPs:1,requiredPs:1,pressureWin:5,startRound:20,maxRound:35}),canUseAbility:()=>false
  });
  for(const rel of ["src/expert_ai/expert_common_strategy.js","src/expert_ai/expert_nexus.js","src/expert_ai/expert_exordium.js","src/expert_ai/expert_liberti.js","src/expert_ai/expert_agathoi.js","src/expert_ai/expert_fabeot.js","src/expert_ai/expert_router.js","src/expert_ai/expert_runtime.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT,rel),"utf8"),context,{filename:rel});
  return {state,context,emitted};
}

// 1) Il falso candidato osservato in telemetria: ATT 4 contro DEF 1 + HP 3.
{
  const h=makeHarness({targetDef:1,targetHp:3,attackers:[{uid:"tribuno",att:4,pos:[-1,0,1]}],includeOccupier:false});
  const session=vm.runInContext("expertBeginTurnF9T1(1)",h.context);
  equal(session.module.moduleId,"expert-exordium-f9t2d3","router aggiornato a F9T2d2");
  equal(session.plan,null,"nessun piano Clear falso con un solo attacco non perforante");
  const audit=h.emitted.flatMap(e=>e.data&&e.data.decision&&Array.isArray(e.data.decision.audits)?e.data.decision.audits:[]).find(a=>a.targetId==="target");
  ok(audit,"audit Clear presente");
  equal(audit.predictedTargetDestroyed,false,"anteprima non predice la distruzione");
  equal(audit.predictedDefDamage,1,"un solo punto DEF previsto");
  equal(audit.predictedHpDamage,0,"nessun danno HP previsto");
  equal(audit.rejectionReason,"insufficient_hp_damage_after_def_break","falso candidato respinto con ragione precisa");
  equal(audit.predictionModel,"ATT_DEF_HP_NON_PIERCING","modello dichiarato");
}

// 2) Sequenza valida: ATT 1 rompe la DEF, ATT 3 elimina i 3 HP.
{
  const h=makeHarness({targetDef:1,targetHp:3,attackers:[{uid:"a",att:1,pos:[-1,0,1]},{uid:"b",att:3,pos:[0,-1,1]}]});
  const session=vm.runInContext("expertBeginTurnF9T1(1)",h.context);
  ok(session.plan,"piano Clear creato");
  equal(session.plan.goal,"EXORDIUM_CLEAR_OCCUPY_FORTIFY","goal corretto");
  equal(session.plan.orderedSteps.length,3,"due attacchi più occupazione");
  equal(session.plan.exordium.clearPredictedDefDamage,1,"DEF prevista correttamente");
  equal(session.plan.exordium.clearPredictedHpDamage,3,"HP previsti correttamente");
  equal(session.plan.exordium.clearPredictedTargetDestroyed,true,"distruzione prevista");
  equal(session.plan.exordium.clearRequiredAttackCount,2,"due attaccanti richiesti");
  equal(session.plan.orderedSteps[0].unitId,"a","attacco piccolo usa la DEF senza spreco");
  equal(session.plan.orderedSteps[1].unitId,"b","attacco forte riservato per gli HP");
  equal(vm.runInContext("expertFactionTryPlannedUnitActionF9T2(state.units.find(u=>u.uid==='a'))",h.context),true,"primo attacco eseguito");
  equal(h.state.units.find(u=>u.uid==="target").currentDef,0,"DEF rimossa");
  equal(h.state.units.find(u=>u.uid==="target").currentHp,3,"HP intatti dopo attacco sulla DEF");
  equal(vm.runInContext("expertFactionTryPlannedUnitActionF9T2(state.units.find(u=>u.uid==='b'))",h.context),true,"secondo attacco eseguito");
  equal(h.state.units.find(u=>u.uid==="target").alive,false,"presidio eliminato");
  equal(session.plan.exordium.clearActualDefDamage,1,"danno DEF reale riconciliato");
  equal(session.plan.exordium.clearActualHpDamage,3,"danno HP reale riconciliato");
  equal(session.plan.exordium.clearPredictionMatched,true,"previsione uguale al risultato");
  equal(vm.runInContext("expertFactionTryPlannedUnitActionF9T2(state.units.find(u=>u.uid==='occ'))",h.context),true,"occupazione eseguita");
  equal(session.plan.status,"completed","piano completato");
  equal(h.state.cells.find(c=>c.ps).control,1,"PS convertito a Exordium");
  ok(h.emitted.some(e=>e.data&&e.data.decision&&e.data.decision.kind==="clear_effective_damage_sequence_result"&&e.data.decision.predictionMatched===true),"risultato sequenza telemetrizzato");
}

// 3) Ricomposizione bounded: il primo attaccante prenotato diventa indisponibile.
{
  const h=makeHarness({targetDef:1,targetHp:3,attackers:[
    {uid:"a",att:1,pos:[-1,0,1]},{uid:"b",att:3,pos:[0,-1,1]},
    {uid:"c",att:1,pos:[1,-1,0]},{uid:"d",att:3,pos:[1,0,-1]}
  ]});
  const session=vm.runInContext("expertBeginTurnF9T1(1)",h.context);
  equal(session.plan.orderedSteps[0].unitId,"a","attaccante iniziale deterministico");
  h.state.units.find(u=>u.uid==="a").acted=true;
  equal(vm.runInContext("expertFactionTryPlannedUnitActionF9T2(state.units.find(u=>u.uid==='a'))",h.context),false,"attaccante indisponibile non agisce");
  equal(session.plan.exordium.clearAttackSequenceRecomputed,1,"sequenza ricomposta una volta");
  equal(session.plan.orderedSteps[session.plan.currentStep].unitId,"c","sostituto bounded selezionato");
  ok(h.emitted.some(e=>e.data&&e.data.decision&&e.data.decision.kind==="clear_attack_sequence_recomputed"),"ricomposizione telemetrizzata");
  equal(vm.runInContext("expertFactionTryPlannedUnitActionF9T2(state.units.find(u=>u.uid==='c'))",h.context),true,"primo sostituto attacca");
  equal(vm.runInContext("expertFactionTryPlannedUnitActionF9T2(state.units.find(u=>u.uid==='b'))",h.context),true,"secondo attaccante completa la kill");
  equal(h.state.units.find(u=>u.uid==="target").alive,false,"bersaglio eliminato dopo ricomposizione");
  ok(session.plan.exordium.clearRequiredAttackerIds.includes("c"),"attaccanti richiesti aggiornati");
  equal(session.plan.exordium.clearAttackSequenceRecomputed,1,"limite di ricomposizione rispettato");
}

console.log(`F9T2d2 Clear Effective Damage Preview smoke: ${checks}/${checks} verifiche superate`);
