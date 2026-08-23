"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert");
const ROOT=path.resolve(__dirname,".."); let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++}; const equal=(a,b,m)=>{assert.strictEqual(a,b,m);checks++};
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.join(",")===b.join(",");
const dist=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2]));
const names=["AI_EXPERT_TURN_STARTED","AI_EXPERT_CONTEXT_CREATED","AI_EXPERT_MODULE_ROUTED","AI_EXPERT_FALLBACK","AI_EXPERT_TURN_COMPLETED","AI_EXPERT_DECISION","AI_MICROPLAN_SELECTED","AI_MICROPLAN_STEP","AI_MICROPLAN_COMPLETED","AI_MICROPLAN_ABORTED","AI_EXPERT_BUDGET_EXHAUSTED","UNIT_SPAWNED","UNIT_ATTACKED","ABILITY_USED","PS_CONTROL_CHANGED","UNIT_DESTROYED"];
const EventTypes=Object.fromEntries(names.map(x=>[x,x]));
const pivot={id:"EXPIV02",blueprintId:"EXPIV02",faction:"Exordium",name:"Mech d'Assalto",type:"Veicolo",weight:"Pivot",cost:5,hp:6,currentHp:6,def:3,currentDef:3,att:4,attackRange:1};
const state={matchId:"match-g2",aiMode:"expert",modes:{1:"bot",2:"bot"},turn:1,currentPlayer:2,factions:{1:"Exordium",2:"Nexus"},playerIds:[1,2],energy:{1:6,2:3},pressure:{1:0,2:0},mapId:"bootstrap",mapDefinition:{id:"bootstrap",movementMultiplier:2},cells:[{coord:[0,5,-5],ps:true,control:null},{coord:[12,-7,-5],ps:false,control:null}],units:[{uid:"hq-ex",side:1,faction:"Exordium",type:"QG",pos:[-12,7,5],alive:true},{uid:"hq-nx",side:2,faction:"Nexus",type:"QG",pos:[12,-7,-5],alive:true}],hand:{1:[],2:[]},starterCards:{1:{},2:{}},cellEffects:[]};
const emitted=[]; let now=0;
const getUnitAt=c=>state.units.find(u=>u.alive!==false&&same(u.pos,c))||null;
const getCellAt=c=>state.cells.find(x=>same(x.coord,c))||null;
const ctx=vm.createContext({console,Map,Set,Object,Array,Number,String,Boolean,Math,JSON,Date,state,BLUEPRINTS:[pivot],EventTypes,
 performance:{now:()=>now+=.05,memory:{usedJSHeapSize:1000}},emitGameEvent:e=>{emitted.push(JSON.parse(JSON.stringify(e)));return e},
 getEnemyPlayers:p=>state.playerIds.filter(x=>x!==p),getHq:s=>state.units.find(u=>u.type==="QG"&&u.side===s),combatUnits:s=>state.units.filter(u=>u.alive!==false&&u.side===s&&u.type!=="QG"),countControlledPS:s=>state.cells.filter(c=>c.ps&&c.control===s).length,
 getUnitAt,getCellAt,sameCoord:same,hexDistance:dist,areAdjacent:(a,b)=>dist(a,b)===1,movementRangeFor:()=>2,getMapMovementMultiplier:()=>2,currentPace:()=>({vehicleMove:1}),getCentralStrategicPointCoord:()=>[0,5,-5],pressureRuleProfile:()=>({centralCoord:[0,5,-5],requiredPs:1,pressureWin:5,maxRound:35}),botPressureProfileF9T0:()=>({totalPs:1,requiredPs:1,pressureWin:5,maxRound:35}),
 canAct:u=>u&&!u.acted,canMove:u=>u&&!u.acted,canAttack:u=>u&&!u.acted,canBuildStructures:()=>false,isCellEnterable:()=>true,getMapTerrainAt:()=>null,buildableCells:()=>[],movableCells:()=>[],effectiveAtt:u=>u.att||0,effectiveLife:u=>(u.currentHp||0)+(u.currentDef||0),numericalSuperiorityBonus:()=>0,
 purchaseLimitReached:()=>false,playerEnergyLocked:()=>false,playerHandLocked:()=>false,handCardBlocked:()=>false,effectiveHandUnitCardCost:()=>5,effectiveBlueprintCost:(p,bp)=>bp.cost,starterRoleForBlueprint:()=>null,tacticalStarterCapState:()=>({blocked:false}),blueprintForHandCard:card=>pivot,spawnCellsFor:()=>[],telemetryRecordExpertDecisionF9T1:()=>{}
});
for(const rel of ["src/expert_ai/expert_common_strategy.js","src/expert_ai/expert_nexus.js","src/expert_ai/expert_exordium.js","src/expert_ai/expert_liberti.js","src/expert_ai/expert_agathoi.js","src/expert_ai/expert_fabeot.js","src/expert_ai/expert_router.js","src/expert_ai/expert_runtime.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT,rel),"utf8"),ctx,{filename:rel});

// Bootstrap simmetrico: G2 può iniziare e completare senza record orfani.
vm.runInContext("expertPrepareMatchF9T2c2('match-g2',{reason:'smoke'})",ctx);
let g2=vm.runInContext("expertBeginTurnF9T1(2)",ctx);
equal(g2.player,2,"bootstrap Expert disponibile per G2 con iniziativa");
equal(g2.matchId,"match-g2","sessione vincolata al match corrente");
let g2summary=vm.runInContext("expertCompleteTurnF9T1(2,{reason:'smoke-g2'})",ctx);
equal(g2summary.moduleId,"expert-nexus-f9t1","G2 instradato al modulo corretto");
for(const type of ["AI_EXPERT_TURN_STARTED","AI_EXPERT_CONTEXT_CREATED","AI_EXPERT_MODULE_ROUTED","AI_EXPERT_TURN_COMPLETED"]) equal(emitted.filter(e=>e.type===type&&e.data.player===2).length,1,`${type} presente una volta per G2`);

state.matchId="match-g1"; state.currentPlayer=1; state.turn=1;
vm.runInContext("expertPrepareMatchF9T2c2('match-g1',{reason:'smoke'})",ctx);
let g1=vm.runInContext("expertBeginTurnF9T1(1)",ctx); ok(g1&&g1.player===1,"bootstrap Expert disponibile per G1");
let g1summary=vm.runInContext("expertCompleteTurnF9T1(1,{reason:'smoke-g1'})",ctx); ok(g1summary&&g1summary.moduleId==="expert-exordium-f9t2d3","G1 instradato a Exordium F9T2c2");
const completedBefore=emitted.filter(e=>e.type==="AI_EXPERT_TURN_COMPLETED").length;
equal(vm.runInContext("expertCompleteTurnF9T1(1,{reason:'orphan'})",ctx),null,"completamento orfano rifiutato");
equal(emitted.filter(e=>e.type==="AI_EXPERT_TURN_COMPLETED").length,completedBefore,"nessun evento completed fantasma");

// Sessione di un match precedente non può completare il match successivo.
state.matchId="old"; state.currentPlayer=2; state.turn=2; vm.runInContext("expertPrepareMatchF9T2c2('old')",ctx); vm.runInContext("expertBeginTurnF9T1(2)",ctx);
state.matchId="new"; vm.runInContext("expertPrepareMatchF9T2c2('new')",ctx);
equal(vm.runInContext("expertCompleteTurnF9T1(2,{reason:'stale'})",ctx),null,"sessione precedente invalidata dal nuovo match");

// HQ_CORRIDOR non è valido a distanza enorme solo perché si avanza.
state.matchId="objective"; state.currentPlayer=1; state.turn=6; state.factions[1]="Exordium";
state.units=[{uid:"hq-ex",side:1,faction:"Exordium",type:"QG",pos:[-12,7,5],alive:true},{uid:"hq-nx",side:2,faction:"Nexus",type:"QG",pos:[12,-7,-5],alive:true}];
state.cells=[{coord:[0,5,-5],ps:true,control:1},{coord:[12,-7,-5],ps:false,control:null}];
ctx.mapReachableCells=(map,start,budget)=>[{coord:[-1,6,-5],cost:budget}];
let far=vm.runInContext("expertExordiumProjectedPivotObjectiveF9T2c1(1, BLUEPRINTS[0], [-5,10,-5], [-6,11,-5], 8)",ctx);
equal(far,null,"nessun HQ_CORRIDOR decorativo a distanza 13");

// Se una proiezione raggiunge il centro, l'obiettivo è territoriale e operativo.
state.cells.push({coord:[-1,6,-5],ps:true,control:2});
let territorial=vm.runInContext("expertExordiumProjectedPivotObjectiveF9T2c1(1, BLUEPRINTS[0], [-5,10,-5], [-6,11,-5], 8)",ctx);
equal(territorial.type,"ENEMY_PS_CAPTURE","PS nemico prevale sul corridoio QG");
equal(territorial.projectedEndCellNextTurn.join(','),"-1,6,-5","cella proiettata preservata");

// Memoria Forward attiva: guida la Pivot alla cella prevista.
const mech={uid:"mech",...pivot,side:1,pos:[-5,10,-5],alive:true,acted:false}; state.units.push(mech);
ctx.movableCells=()=>[[-1,6,-5],[-4,9,-5]];
ctx.botMoveUnitF9T0=(u,c)=>{u.pos=c.slice();u.movedThisTurn=true;}; ctx.finishBotMove=u=>{u.acted=true;};
vm.runInContext("{const m=expertExordiumEnsureForwardPivotMemoryF9T2c(); const t={player:1,unitId:'mech',blueprintId:'EXPIV02',deploymentSource:'expert_forward_plan',deployedRound:6,impactDeadlineRound:8,deploymentSequence:9,deploymentCell:[-5,10,-5],projectedEndCellNextTurn:[-1,6,-5],preferredMoveCell:[-1,6,-5],objectiveType:'ENEMY_PS_CAPTURE',objectiveCell:[-1,6,-5],impactWindowMissRecorded:false,status:'awaiting_impact'};m.pivotImpactByUnit.mech=t;m.forwardPivotByPlayer['1']=t;}",ctx);
equal(vm.runInContext("expertExordiumTryForwardPivotActionF9T2c2(state.units.find(u=>u.uid==='mech'))",ctx),true,"memoria Forward esegue il movimento preferito");
equal(mech.pos.join(','),"-1,6,-5","Pivot raggiunge la cella proiettata");

// Finestra mancata ma primo impatto tardivo conservato.
mech.acted=false; state.turn=9;
equal(vm.runInContext("expertExordiumCheckForwardPivotExpiryF9T2c(1)",ctx),true,"scadenza impatto rilevata");
equal(vm.runInContext("state.expertAiF9T2c.pivotImpactByUnit.mech.status",ctx),"awaiting_late_impact","tracking tardivo resta attivo");
state.turn=10;
equal(vm.runInContext("expertAiHandleGameEventF9T2c({type:EventTypes.UNIT_ATTACKED,data:{attackerId:'mech',defenderId:'enemy',amount:2}})",ctx),true,"impatto tardivo registrato");
let late=vm.runInContext("state.expertAiF9T2c.lastForwardPivotResultByPlayer['1']",ctx);
equal(late.status,"late_impacted","stato tardivo distinto");
equal(late.firstActualImpactRound,10,"round del primo impatto reale conservato");
equal(late.roundsToFirstActualImpact,4,"ritardo dal deployment calcolato");
equal(late.impactWithinDeadline,false,"impatto fuori scadenza dichiarato");

const ai=fs.readFileSync(path.join(ROOT,"src/ai.js"),"utf8"),game=fs.readFileSync(path.join(ROOT,"src/game.js"),"utf8"),telemetry=fs.readFileSync(path.join(ROOT,"src/match_telemetry.js"),"utf8"),build=fs.readFileSync(path.join(ROOT,"src/build_info.js"),"utf8");
ok(ai.includes("botRunTokenCurrentF9T2c2")&&ai.includes("activeBotRunTokenF9T2c2"),"run bot vincolato a token match/epoca");
ok(game.indexOf("invalidateBotRunForNewMatchF9T2c2")<game.indexOf("createInitialGameState"),"invalidazione precedente alla creazione del nuovo stato");
ok(telemetry.includes('MATCH_TELEMETRY_EXPERT_DOCTRINE_SCHEMA_VERSION = "F9T2d3-1"'),"schema telemetrico F9T2c2");
ok(telemetry.includes("expertForwardPivotsDeployed")&&telemetry.includes("allExordiumPivotsTracked")&&telemetry.includes("forwardPivotLateImpacts"),"denominatori Pivot separati");
ok(build.includes('version: "C2-STABLE-1-F9V3c-APK-M4c"')&&build.includes('buildChannel: "starter2-result-flow-v3c"'),"metadata candidata corretti");
console.log(`F9T2c2 Bootstrap & Forward Pivot Impact smoke: ${checks}/${checks} verifiche superate`);
