"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert");
const ROOT=path.resolve(__dirname,".."); let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++}; const equal=(a,e,m)=>{assert.strictEqual(a,e,m);checks++};
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.join(",")===b.join(",");
const EventTypes={AI_EXPERT_DECISION:"AI_EXPERT_DECISION",AI_EXPERT_TURN_STARTED:"AI_EXPERT_TURN_STARTED",AI_EXPERT_CONTEXT_CREATED:"AI_EXPERT_CONTEXT_CREATED",AI_EXPERT_MODULE_ROUTED:"AI_EXPERT_MODULE_ROUTED",AI_EXPERT_FALLBACK:"AI_EXPERT_FALLBACK",AI_EXPERT_BUDGET_EXHAUSTED:"AI_EXPERT_BUDGET_EXHAUSTED",AI_EXPERT_TURN_COMPLETED:"AI_EXPERT_TURN_COMPLETED",AI_MICROPLAN_SELECTED:"AI_MICROPLAN_SELECTED",AI_MICROPLAN_STEP:"AI_MICROPLAN_STEP",AI_MICROPLAN_COMPLETED:"AI_MICROPLAN_COMPLETED",AI_MICROPLAN_ABORTED:"AI_MICROPLAN_ABORTED"};
const VARRAN={id:"EX0B00",faction:"Exordium",name:"Varran",type:"Comandante",weight:"Leggera",cost:4,hp:5,att:5,def:2};
const BLUEPRINTS=[VARRAN];

function makeHarness({round=4,energy=4,hqRisk="none",legalCells=[[-5,4,1]],commanderInPlay=false}={}){
  let now=1; const emitted=[];
  const state={matchId:`d3-${Math.random()}`,aiMode:"expert",modes:{1:"bot",2:"bot"},turn:round,currentPlayer:1,factions:{1:"Exordium",2:"Nexus"},energy:{1:energy,2:3},hand:{1:[{cardUid:"varran-card",blueprintId:"EX0B00",name:"Varran",deckRole:"commander"}],2:[]},units:[],cells:[],expertAiF9T1:null};
  if(commanderInPlay) state.units.push({uid:"varran-unit",id:"EX0B00",blueprintId:"EX0B00",name:"Varran",type:"Comandante",side:1,faction:"Exordium",pos:legalCells[0]||[-5,4,1],alive:true});
  const getUnitAt=c=>state.units.find(u=>u.alive!==false&&same(u.pos,c))||null;
  const context=vm.createContext({console,Map,Set,Object,Array,Number,String,Boolean,Math,JSON,Date,state,BLUEPRINTS,EventTypes,
    performance:{now:()=>now+=0.1,memory:{usedJSHeapSize:4096}},
    emitGameEvent:e=>{emitted.push(JSON.parse(JSON.stringify(e)));return e;},telemetryRecordExpertDecisionF9T1:()=>{},
    selectedCommanderBlueprintIdForSide:()=>"EX0B00",blueprintForHandCard:card=>BLUEPRINTS.find(bp=>bp.id===card.blueprintId)||null,
    purchaseLimitReached:()=>false,playerEnergyLocked:()=>false,playerHandLocked:()=>false,handCardBlocked:()=>false,
    spawnCellsFor:()=>legalCells.map(c=>c.slice()),effectiveHandUnitCardCost:()=>4,chooseSpawnCell:(p,bp,cells)=>cells[0]&&cells[0].slice(),
    commanderOf:p=>state.units.find(u=>u.alive!==false&&u.side===p&&u.type==="Comandante")||null,getUnitAt,
    sameCoord:same,hexDistance:(a,b)=>Math.max(...a.map((x,i)=>Math.abs(x-b[i]))),
    getEnemyPlayers:p=>[1,2].filter(x=>x!==p),getHq:()=>null,combatUnits:p=>state.units.filter(u=>u.alive!==false&&u.side===p),countControlledPS:()=>0,
    getCellAt:()=>null,areAdjacent:()=>false,getMapMovementMultiplier:()=>1,botPressureProfileF9T0:()=>({totalPs:7,requiredPs:4,pressureWin:5,startRound:20,maxRound:35}),
    effectiveAtt:u=>u.att||0,effectiveLife:u=>(u.currentHp||0)+(u.currentDef||0),canAct:u=>!u.acted,canMove:u=>!u.acted,canAttack:u=>!u.acted,
    canBuildStructures:()=>false,isCellEnterable:()=>true,getMapTerrainAt:()=>null,movementRangeFor:()=>1,movableCells:()=>[],numericalSuperiorityBonus:()=>0,
    effectiveBlueprintCost:()=>4,starterRoleForBlueprint:()=>null,tacticalStarterCapState:()=>({blocked:false}),canUseAbility:()=>false
  });
  for(const rel of ["src/expert_ai/expert_common_strategy.js","src/expert_ai/expert_nexus.js","src/expert_ai/expert_exordium.js","src/expert_ai/expert_liberti.js","src/expert_ai/expert_agathoi.js","src/expert_ai/expert_fabeot.js","src/expert_ai/expert_router.js","src/expert_ai/expert_runtime.js"]){
    vm.runInContext(fs.readFileSync(path.join(ROOT,rel),"utf8"),context,{filename:rel});
  }
  vm.runInContext(`expertEnsureStateF9T1(); expertRuntimeStateF9T1.activeByPlayer[1]={sequence:1,matchId:state.matchId,faction:"Exordium",completed:false,plan:null,decisions:[],decisionTotal:0,decisionRecordsEmitted:0,decisionRecordsDropped:0,auditItemsTotal:0,auditItemsStored:0,auditItemsDropped:0,auditContainersTotal:0};`,context);
  const refresh=()=>vm.runInContext(`expertExordiumRefreshCommanderCommitmentF9T2d3(1,{common:{hqOccupationRisk:{risk:${JSON.stringify(hqRisk)}}}})`,context);
  return {state,context,emitted,refresh,get hqRisk(){return hqRisk;},set hqRisk(v){hqRisk=v;}};
}
const decisions=h=>h.emitted.filter(e=>e.type==="AI_EXPERT_DECISION").map(e=>e.data&&e.data.decision).filter(Boolean);

// 1) R4: commitment persistente, riserva ENE e deploy immediato se legale.
{
  const h=makeHarness({round:4,energy:4}); h.refresh();
  const c=vm.runInContext("expertExordiumCommanderCommitmentF9T2d3(1)",h.context);
  ok(c&&c.active,"commitment creato al round 4");
  equal(c.commanderId,"EX0B00","commitment associato al comandante scelto");
  equal(c.commitmentCreatedRound,4,"round creazione corretto");
  equal(c.deploymentDeadlineRound,6,"deadline bounded R4+2");
  equal(c.reservedEnergy,4,"quattro ENE riservate");
  equal(vm.runInContext("expertCommanderReservedEnergyF9T2d3(1)",h.context),4,"runtime vede la riserva comandante");
  equal(vm.runInContext("expertCanSpendEnergyF9T2(1,1,{kind:'hand_tactic'})",h.context),false,"tattica marginale non può consumare la riserva");
  equal(vm.runInContext("expertCanSpendEnergyF9T2(1,4,{kind:'roster_purchase'})",h.context),false,"acquisto generico non può consumare la riserva");
  const choice=vm.runInContext("expertExordiumCommanderRosterChoiceF9T2d3(1)",h.context);
  ok(choice,"scelta comandante disponibile"); equal(choice.bp.id,"EX0B00","Varran scelto"); equal(choice.source,"hand","origine mano"); equal(choice.cost,4,"costo reale");
  equal(choice.expertDoctrine,"commander_deployment_commitment_f9t2d3","dottrina identificabile");
  h.state.energy[1]-=choice.cost; h.state.units.push({uid:"varran-unit",id:"EX0B00",blueprintId:"EX0B00",name:"Varran",type:"Comandante",side:1,faction:"Exordium",pos:choice.coord.slice(),alive:true});
  equal(vm.runInContext(`expertExordiumObserveCommanderRosterPlayF9T2d3(1,${JSON.stringify(choice)})`,h.context),true,"deploy osservato dal commitment");
  const after=vm.runInContext("expertExordiumCommanderCommitmentF9T2d3(1)",h.context);
  equal(after.executed,true,"commitment eseguito"); equal(after.active,false,"commitment chiuso"); equal(after.reservedEnergy,0,"riserva rilasciata"); equal(after.commanderActualDeploymentRound,4,"deployment nello stesso round");
  const kinds=decisions(h).map(d=>d.kind); ok(kinds.includes("commander_deployment_commitment_created"),"creazione telemetrizzata"); ok(kinds.includes("commander_deployment_energy_reserved"),"riserva telemetrizzata"); ok(kinds.includes("commander_deployment_attempted"),"tentativo telemetrizzato"); ok(kinds.includes("commander_deployment_executed"),"esecuzione telemetrizzata");
}

// 2) Starvation prevention anche quando R4 non è ancora abbordabile: l'ENE viene accumulata.
{
  const h=makeHarness({round:4,energy:2}); h.refresh();
  const c=vm.runInContext("expertExordiumCommanderCommitmentF9T2d3(1)",h.context);
  ok(c&&c.active,"commitment creato anche prima di avere tutta l'ENE"); equal(c.reservedEnergy,4,"riserva conserva costo comandante");
  equal(vm.runInContext("expertCanSpendEnergyF9T2(1,1,{kind:'starter_tactic'})",h.context),false,"con ENE 2 non si spende contro la riserva 4");
  equal(vm.runInContext("expertExordiumCommanderRosterChoiceF9T2d3(1)",h.context),null,"nessun deploy senza ENE sufficiente");
  h.state.turn=5; h.state.energy[1]=5; h.refresh();
  equal(vm.runInContext("expertExordiumCommanderCommitmentF9T2d3(1).playableRounds",h.context),1,"primo round realmente giocabile contato");
  const choice=vm.runInContext("expertExordiumCommanderRosterChoiceF9T2d3(1)",h.context); ok(choice&&choice.bp.id==="EX0B00","Varran diventa subito la scelta quando l'ENE raggiunge il costo");
}

// 3) Rischio QG direct sospende la riserva e differisce; al rientro il commitment riparte senza ricrearsi.
{
  const h=makeHarness({round:4,energy:4,hqRisk:"direct"}); h.refresh();
  const first=vm.runInContext("expertExordiumCommanderCommitmentF9T2d3(1)",h.context);
  equal(first.reservationActive,false,"rischio QG sospende riserva comandante"); equal(first.deploymentDeadlineRound,7,"deadline estesa di un round per emergenza");
  equal(vm.runInContext("expertExordiumCommanderRosterChoiceF9T2d3(1)",h.context),null,"nessun deploy durante rischio QG direct");
  equal(vm.runInContext("expertCanSpendEnergyF9T2(1,1,{kind:'hq_emergency'})",h.context),true,"ENE liberata per l'emergenza QG");
  h.state.turn=5; h.hqRisk="none"; h.refresh();
  const resumed=vm.runInContext("expertExordiumCommanderCommitmentF9T2d3(1)",h.context);
  equal(resumed.commitmentCreatedRound,4,"commitment originale preservato"); equal(resumed.reservationActive,true,"riserva riattivata dopo emergenza");
  const choice=vm.runInContext("expertExordiumCommanderRosterChoiceF9T2d3(1)",h.context); ok(choice,"deployment riprende dopo emergenza");
  const def=decisions(h).find(d=>d.kind==="commander_deployment_deferred"); ok(def&&def.reason==="hq_occupation_risk_priority","causa di differimento telemetrizzata");
}

// 4) Un micro-piano Expert già attivo ha priorità; il commander commitment non scompare.
{
  const h=makeHarness({round:4,energy:6}); h.refresh();
  vm.runInContext(`expertRuntimeStateF9T1.activeByPlayer[1].plan={id:"P0-CLEAR",goal:"EXORDIUM_CLEAR_OCCUPY_FORTIFY",status:"active",orderedSteps:[{kind:"x"}],currentStep:0,reservedEnergy:0};`,h.context);
  equal(vm.runInContext("expertExordiumCommanderRosterChoiceF9T2d3(1)",h.context),null,"piano Expert prioritario differisce il comandante");
  const c=vm.runInContext("expertExordiumCommanderCommitmentF9T2d3(1)",h.context); equal(c.active,true,"commitment resta attivo"); equal(c.deploymentDeadlineRound,7,"deadline estesa per piano prioritario");
  const d=decisions(h).find(x=>x.kind==="commander_deployment_deferred"&&x.reason==="higher_priority_expert_plan"); ok(d,"differimento per piano prioritario telemetrizzato");
}

// 5) Nessuna cella legale: differimento bounded, non perdita del commitment.
{
  const h=makeHarness({round:4,energy:4,legalCells:[]}); h.refresh();
  const c=vm.runInContext("expertExordiumCommanderCommitmentF9T2d3(1)",h.context); ok(c&&c.active,"commitment creato anche con deployment temporaneamente bloccato"); equal(c.deploymentDeadlineRound,7,"deadline estesa per assenza celle");
  const d=decisions(h).find(x=>x.kind==="commander_deployment_deferred"&&x.reason==="no_legal_deployment_cell"); ok(d,"assenza cella legale tracciata");
}

// 6) Se il fallback schiera comunque lo stesso comandante durante un commitment, l'osservatore lo riconcilia subito.
{
  const h=makeHarness({round:4,energy:5}); h.refresh();
  const fallbackChoice={source:"hand",bp:VARRAN,cardUid:"varran-card",cardName:"Varran",coord:[-5,4,1],cost:4,score:999};
  h.state.units.push({uid:"varran-fallback",id:"EX0B00",blueprintId:"EX0B00",name:"Varran",type:"Comandante",side:1,faction:"Exordium",pos:fallbackChoice.coord.slice(),alive:true});
  equal(vm.runInContext(`expertExordiumObserveCommanderRosterPlayF9T2d3(1,${JSON.stringify(fallbackChoice)})`,h.context),true,"deployment Advanced dello stesso comandante riconciliato");
  const c=vm.runInContext("expertExordiumCommanderCommitmentF9T2d3(1)",h.context); equal(c.executed,true,"commitment chiuso anche su fallback coerente"); equal(c.deploymentSource,"advanced_fallback_while_committed","origine fallback distinta");
}

// 7) Contratto statico della candidata.
{
  const build=fs.readFileSync(path.join(ROOT,"src/build_info.js"),"utf8");
  const runtime=fs.readFileSync(path.join(ROOT,"src/expert_ai/expert_runtime.js"),"utf8");
  const telemetry=fs.readFileSync(path.join(ROOT,"src/match_telemetry.js"),"utf8");
  ok(build.includes('version: "C2-STABLE-1-F9V2d-APK-M4c"'),"versione build F9T2d3");
  ok(build.includes('logicBaseline: "C2-STABLE-1-F9T2c4-APK-M4c"'),"baseline logica F9T2c4 preservata");
  ok(runtime.includes('EXPERT_AI_DOCTRINE_SCHEMA_VERSION_F9T2 = "F9T2d3-1"'),"schema runtime F9T2d3-1");
  ok(telemetry.includes('MATCH_TELEMETRY_EXPERT_DOCTRINE_SCHEMA_VERSION = "F9T2d3-1"'),"schema telemetria F9T2d3-1");
  ok(telemetry.includes("commanderDeploymentCommitmentsExecuted"),"aggregati commitment presenti");
}

console.log(`F9T2d3 Commander Deployment Commitment smoke: ${checks}/${checks} verifiche superate`);
