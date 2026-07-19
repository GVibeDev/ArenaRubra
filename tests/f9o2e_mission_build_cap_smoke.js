"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");
const assert = require("assert");
const root = path.resolve(__dirname, "..");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => { assert.deepStrictEqual(actual, expected, message); checks += 1; };

// 1) Cap Starter: conta solo unità realmente presenti sul campo.
{
  const ctx = {
    console, Object, Array, Number, Boolean, Math,
    state: {
      gameScaleMode:"tactical",
      units:[], starterCards:{1:{},2:{}},
      f9n3Telemetry:{ tacticalCapBlocked:{1:{},2:{}}, starterDestroyed:{1:{},2:{}}, starterSpawned:{1:{},2:{}}, starterEnergySpent:{1:0,2:0} }
    },
    isFieldUnit:u => Boolean(u && u.alive === true && u.currentHp > 0 && Array.isArray(u.pos) && u.type !== "QG")
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root,"src/game_scale.js"),"utf8"),ctx);
  ctx.state.units.push(
    { side:1, type:"Struttura", alive:true, currentHp:3, pos:[0,0], spawnSource:"starter", starterRole:"starter_structure" },
    { side:1, type:"Struttura", alive:true, currentHp:3, pos:[1,0], spawnSource:"starter", starterRole:"starter_structure" }
  );
  eq(ctx.tacticalStarterCapState(1,"starter_structure").count,2,"due strutture vive occupano il cap");
  ctx.state.units[0].currentHp = 0;
  ctx.state.units[0].pos = null;
  // Simula stato intermedio obsoleto: alive è ancora true, ma il pezzo non è più in campo.
  eq(ctx.tacticalStarterCapState(1,"starter_structure").count,1,"struttura distrutta non occupa slot");
  eq(ctx.tacticalStarterCapState(1,"starter_structure").blocked,false,"distruzione libera il cap");
}

// 2) Costruzione da carta: costruttore oppure QG proprio.
{
  const ctx = {
    console, Object, Array, Number, Boolean, Math,
    state:{ currentPlayer:1, modes:{1:"human"}, factions:{1:"Exordium"}, winner:null, energy:{1:10} },
    botRunning:false, pendingHandCardUid:null, pendingStarterCardUid:null, pendingDeploymentContext:null,
    pendingAbility:null, pendingTacticId:null, pendingBuildBlueprintId:null, pendingPurchaseBlueprintId:null,
    pendingBuildSource:null, selectedId:null, mode:"idle",
    missionInteractionBlocked:()=>false,
    isPlayableUnitHandCard:()=>true,
    blueprintForHandCard:null,
    getSelectedUnit:()=>null,
    canBuildStructures:()=>false,
    buildableCells:()=>[],
    canBuildFromOwnHq:()=>true,
    purchaseLimitReached:()=>false,
    playerHandLocked:()=>false,
    handCardBlocked:()=>false,
    effectiveBlueprintCost:()=>4,
    playerHandUnitCostModifiers:()=>[],
    playerCostModifiers:()=>[],
    c1fPlacementCostModifier:()=>({value:0,minCost:0}),
    missionEffectiveCardCost:(side,card,cost)=>cost,
    renderAll:()=>{}, log:()=>{},
    EventTypes:{LOG_MESSAGE:"LOG_MESSAGE"},
    handCardByUid:()=>null,
    closeHandPanelAfterAcceptedCardPlay:()=>{},
    cameraScheduleDeploymentFit:()=>{}
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root,"src/deployment.js"),"utf8"),ctx);
  const barracks = { sourceType:"unit", blueprintId:"EXC1F09", name:"Caserma Fanteria", cardUid:"c1" };
  const bp = { id:"EXC1F09", faction:"Exordium", name:"Caserma Fanteria", type:"Struttura", cost:4 };
  ctx.blueprintForHandCard = () => bp;
  const state = ctx.handCardActionState(1,barracks);
  ok(state.canUse,"la Caserma è giocabile dal QG libero senza costruttore selezionato");
  ctx.handCardByUid = () => barracks;
  ok(ctx.beginHandCardPlay("c1"),"il click della Caserma avvia la costruzione");
  eq(ctx.mode,"build","modalità build attiva");
  eq(ctx.pendingBuildSource.type,"own_hq","sorgente costruzione QG impostata");
  eq(ctx.pendingBuildBlueprintId,"EXC1F09","blueprint Caserma mantenuto");
}

// 3) Missioni: profilo accessibile e soglie principali.
{
  const ctx = { console, Object, Array, Number, Boolean, Math };
  vm.createContext(ctx);
  const code = fs.readFileSync(path.join(root,"data/missions_base.js"),"utf8") + "\nthis.__MISSIONS=MISSION_DEFINITIONS; this.__PROFILE=MISSION_BALANCE_PROFILE;";
  vm.runInContext(code,ctx);
  const byId = Object.fromEntries(ctx.__MISSIONS.map(m => [m.id,m]));
  eq(ctx.__PROFILE,"F9O2e-starter-accessibility-v1","profilo tuning registrato");
  eq(byId.NXMSN01.objectives[1].value,3,"Civiltà: strutture 3");
  eq(byId.EXMSN02.objectives[2].value,2,"Ordo: due distruzioni nello stesso turno");
  eq(byId.LBMSN02.objectives[0].value,10,"Sangue e Sabbia: sanguinamento 10");
  eq(byId.AGMSN02.objectives[2].round.value,12,"Erkos: round 12");
  eq(byId.AGMSN02.objectives[2].energy.value,12,"Erkos: ENE 12");
  eq(byId.FBMSN02.objectives[2].value,5,"Cospirazione: manipolazioni 5");
  eq(byId.LBMSND01.conditions[0].value,8,"Ultima Possibilità: perdite 8");
}

// 4) Carta Missione cliccabile + progressi compatti nel dock azioni.
{
  const runtime = {
    active:true, missionId:"NXMSN01", missionName:"Civiltà Algoritmica", missionClass:"ordinary",
    played:false, ready:true, readyCount:3, cycle:1,
    entries:{ o1:{completed:true,satisfied:true,current:2,target:2,streak:1}, o2:{completed:true,satisfied:true,current:3,target:3}, o3:{completed:true,satisfied:true,current:"8 ENE · 6 carte",target:"8 ENE · 6 carte"} }
  };
  const def = { missionClass:"ordinary", objectives:[
    {id:"o1",text:"Controlla 2 PS",consecutive:1}, {id:"o2",text:"Costruisci 3 strutture"}, {id:"o3",text:"8 ENE e 6 carte"}
  ], reward:{text:"Bonus"} };
  const ctx = {
    console, Object, Array, Number, Boolean, Math, Date,
    state:{currentPlayer:1,modes:{1:"human"},winner:null,handLocked:{1:0},missions:{1:runtime},factions:{1:"Nexus"}},
    botRunning:false,
    missionRuntime:()=>runtime,
    missionDefinitionById:()=>def,
    missionObjectivesFor:d=>d.objectives,
    missionCardForSide:()=>({sourceType:"mission",missionId:"NXMSN01"}),
    missionCanPlayOrdinary:()=>({ok:true,reason:"Missione ordinaria pronta"}),
    playerHandLocked:()=>false,
    handCardBlocked:()=>false,
    renderAll:()=>{},
    escapeHtml:s=>String(s)
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root,"src/mission_ui.js"),"utf8") + "\nthis.__UI_STATE=MISSION_UI_STATE;",ctx);
  ok(ctx.missionUiActivateCard(1),"click carta Missione accettato");
  eq(ctx.__UI_STATE.playPendingSide,1,"click apre conferma gioco");
  const html = ctx.missionUiCompactPanelHtml(1);
  ok(html.includes("Controlla 2 PS"),"progressi Missione nel dock azioni");
  ok(html.includes("Conferma"),"conferma Missione disponibile nel dock");
}

// 5) Contratto statico renderer.
{
  const render = fs.readFileSync(path.join(root,"src/render.js"),"utf8");
  ok(render.includes("missionUiCompactPanelHtml(player)"),"dock azioni integra progressi Missione");
  ok(render.includes("missionUiActivateCard(side, { card, source:\"map_hand_card\" })"),"click carta Missione dalla mano mappa");
  ok(render.includes("missionUiActivateCard(${side}, { source:'hand_panel' })"),"pulsante Missione dal pannello mano");
  ok(render.includes("missionUiActivateCard(${side}, { source:'hand_card_face' })"),"click diretto sulla faccia Missione nel pannello mano");
}

console.log(`F9O2e mission/build/cap smoke: ${checks}/${checks} OK`);
