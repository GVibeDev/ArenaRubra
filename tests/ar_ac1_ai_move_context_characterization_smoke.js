"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const sources = [
  "src/ai/pressure_perception.js",
  "src/ai/finalization_memory.js",
  "src/ai/faction_maturity.js",
  "src/ai/garrison_planning.js",
  "src/ai/strategic_status.js",
  "src/ai/move_context.js"
].map(read);
const aiSource = read("src/ai.js");
let checks = 0;
const ok = (value,message) => { assert.ok(value,message); checks += 1; };
const eq = (actual,expected,message) => { assert.strictEqual(JSON.stringify(actual),JSON.stringify(expected),message); checks += 1; };
const dist = (left,right) => Math.max(...left.map((value,index) => Math.abs(value-right[index])));

function createHarness(faction="Nexus",options={}) {
  const controlledCoord = [0,1,-1];
  const uncontrolledCoord = [3,-3,0];
  const neutralCoord = [2,0,-2];
  const cells = [
    {id:"own-ps",coord:controlledCoord,ps:true,control:1},
    {id:"enemy-ps",coord:uncontrolledCoord,ps:true,control:2},
    {id:"plain",coord:neutralCoord,ps:false,control:null}
  ];
  const unit = {uid:"moving",side:1,faction,type:"Fanteria",pos:[0,0,0]};
  const status = {ownPs:options.ownPs ?? 0,marker:"status"};
  const moveOptions = [[1,-1,0],[2,-2,0]];
  const calls = {};
  const hit = name => { calls[name] = (calls[name] || 0) + 1; };
  const factionValue = name => { hit(name); return [`${name}-target`]; };
  const context = {
    console,
    state:{cells,marker:"state"},
    __enemyOf(player){ hit("enemyOf"); return player === 1 ? 2 : 1; },
    __getHq(player){ hit(`hq${player}`); return {uid:`hq-${player}`,side:player,pos:player === 1 ? [0,0,0] : [4,-4,0]}; },
    __controlledPsCells(player){ hit("controlledPs"); return cells.filter(cell => cell.ps && cell.control === player); },
    __nearestGuard(player,resolved){ hit("guard"); return {id:"guard",coord:[0,1,-1],player,resolved}; },
    __commanderOf(player){ hit("commander"); return {uid:"commander",side:player,pos:[0,0,0]}; },
    __combatUnits(player){ hit(`units${player}`); return [{uid:`unit-${player}`,side:player,pos:[player,-player,0]}]; },
    __nexusTargets(){ return factionValue("nexus"); },
    __greenTargets(){ return factionValue("agathoi"); },
    __exordiumFronts(){ hit("exordium"); return options.emptyFronts ? [] : [{id:"front",ps:[0,1,-1],advance:[2,-2,0]}]; },
    __libertiTargets(){ return factionValue("liberti"); },
    __libertiFlank(){ hit("libertiFlank"); return [2,-1,-1]; },
    __fabeotTargets(){ return factionValue("fabeot"); },
    __fabeotCollapse(){ hit("fabeotCollapse"); return true; },
    __fabeotExposed(){ hit("fabeotExposed"); return [{uid:"exposed"}]; },
    __fabeotConcentrated(){ hit("fabeotConcentrated"); return true; },
    __chooseFront(moving,fronts){ hit("chooseFront"); return {chosenFor:moving.uid,source:fronts[0].id}; },
    __getCellAt(coord){ hit("cell"); return {id:`cell-${coord[0]}`,coord}; },
    __hexDistance(left,right){ hit("distance"); return dist(left,right); },
    __alliesNear(coord,player,range){ hit("allies"); assert.strictEqual(player,1); assert.strictEqual(range,1); return Array.from({length:coord[0]}); },
    __enemiesNear(coord,player,range){ hit("enemies"); assert.strictEqual(player,1); assert.strictEqual(range,1); return Array.from({length:3-coord[0]}); },
    __homeScore(moving,coord,resolved){ hit("home"); assert.strictEqual(moving,unit); assert.strictEqual(resolved,status); return 10+coord[0]; },
    __emergencyScore(player,moving,coord,resolved){ hit("emergency"); assert.strictEqual(player,1); assert.strictEqual(moving,unit); assert.strictEqual(resolved,status); return 20+coord[0]; },
    __generalScore(moving,coord,resolved,flags){ hit("general"); eq(flags,{includeFaction:false},"general doctrine disables duplicate faction scoring"); return 30+coord[0]; },
    __factionScore(moving,coord,resolved){ hit("factionScore"); return 40+coord[0]; },
    __missionScore(moving,coord){ hit("mission"); return 50+coord[0]; },
    __c2e3Score(moving,coord,resolved,flags){ hit("c2e3"); eq(flags,{includeDoctrine:false,includeGate:false},"C2E3 disables duplicate doctrine and gate scoring"); return 60+coord[0]; },
    __stallScore(moving,coord,resolved){ hit("stall"); return 70+coord[0]; }
  };
  vm.createContext(context);
  const bind = [
    "enemyOf=__enemyOf","getHq=__getHq","controlledPsCells=__controlledPsCells",
    "nearestControlledPsNeedingGuard=__nearestGuard","commanderOf=__commanderOf","combatUnits=__combatUnits",
    "botNexusPsNetworkTargets=__nexusTargets","botAgathoiGreenLineTargets=__greenTargets",
    "exordiumFrontTargets=__exordiumFronts","botLibertiFrontTargets=__libertiTargets","libertiFlankTarget=__libertiFlank",
    "botFabeotDeceptionTargets=__fabeotTargets","botFabeotCollapseReady=__fabeotCollapse",
    "botFabeotExposedKeyTargets=__fabeotExposed","botFabeotEnemyConcentratedOnDefense=__fabeotConcentrated",
    "chooseExordiumFrontForUnit=__chooseFront","getCellAt=__getCellAt","hexDistance=__hexDistance",
    "alliesNear=__alliesNear","enemiesNear=__enemiesNear","homePsMoveScore=__homeScore",
    "strategicMoveBonus=__emergencyScore","botGeneralDoctrineMoveBonus=__generalScore",
    "botFactionDoctrineMoveBonusF9T0=__factionScore","c2e3MoveScore=__c2e3Score",
    "botStallOscillationScoreF9T0=__stallScore",
    options.missionAvailable === false ? "globalThis.botMissionMoveBonus=undefined" : "globalThis.botMissionMoveBonus=__missionScore"
  ].join(";");
  vm.runInContext(`${sources.join("\n")}\n${aiSource}\n;${bind};globalThis.__moveContext={botCreateAdvancedMoveContextF9T0};`,context,{filename:"ai-move-context-characterization.js"});
  return {context,api:context.__moveContext,unit,status,moveOptions,cells,calls};
}

{
  const harness = createHarness("Nexus");
  const before = JSON.stringify({state:harness.context.state,unit:harness.unit,status:harness.status,options:harness.moveOptions});
  const result = harness.api.botCreateAdvancedMoveContextF9T0(harness.unit,harness.moveOptions,harness.status);
  ok(result.unit === harness.unit && result.status === harness.status,"context preserves unit and status identity");
  eq({player:result.player,enemy:result.enemy,hasPS:result.hasPS},{player:1,enemy:2,hasPS:false},"identity and hasPS derive from unit side and status ownPs");
  ok(result.psCells[0] === harness.cells[0].coord && result.psCells[1] === harness.cells[1].coord,"PS coordinate references are preserved without cloning");
  eq(result.uncontrolledPs,[[3,-3,0]],"uncontrolled PS projection excludes friendly control");
  eq(result.controlledPs,[[0,1,-1]],"controlled PS projection uses the collaborator result");
  eq({guard:result.guardTarget.id,commander:result.commander.uid,enemyUnits:result.enemyUnits.length,allyUnits:result.allyUnits.length},{guard:"guard",commander:"commander",enemyUnits:1,allyUnits:1},"common strategic collaborators populate the context");
  eq(result.nexusTargets,["nexus-target"],"Nexus target routing is preserved");
  eq({green:result.greenTargets,fronts:result.exordiumFronts,liberti:result.libertiTargets,flank:result.libertiFlank,fabeot:result.fabeotTargets},
    {green:[],fronts:[],liberti:[],flank:null,fabeot:[]},"non-Nexus faction data remains neutral");
  eq(result.exordiumFront,null,"non-Exordium context has no selected front");
  eq(result.candidates.map(entry => ({
    coord:entry.coord,
    cell:entry.cell.id,
    enemyHqDistance:entry.enemyHqDistance,
    ownHqDistance:entry.ownHqDistance,
    alliesR1:entry.alliesR1,
    enemiesR1:entry.enemiesR1,
    homeScore:entry.homeScore,
    emergencyScore:entry.emergencyScore,
    generalScore:entry.generalScore,
    factionDoctrineScore:entry.factionDoctrineScore,
    missionScore:entry.missionScore,
    c2e3Score:entry.c2e3Score,
    stallScore:entry.stallScore
  })),[
    {coord:[1,-1,0],cell:"cell-1",enemyHqDistance:3,ownHqDistance:1,alliesR1:1,enemiesR1:2,homeScore:11,emergencyScore:21,generalScore:31,factionDoctrineScore:41,missionScore:51,c2e3Score:61,stallScore:71},
    {coord:[2,-2,0],cell:"cell-2",enemyHqDistance:2,ownHqDistance:2,alliesR1:2,enemiesR1:1,homeScore:12,emergencyScore:22,generalScore:32,factionDoctrineScore:42,missionScore:52,c2e3Score:62,stallScore:72}
  ],"candidate feature vectors preserve exact values and order");
  ok(result.candidates[0].coord === harness.moveOptions[0] && result.candidates[1].coord === harness.moveOptions[1],"candidate coordinates preserve option identity");
  for(const name of ["cell","allies","enemies","home","emergency","general","factionScore","mission","c2e3","stall"]){
    eq(harness.calls[name],2,`${name} is evaluated exactly once per candidate`);
  }
  eq(JSON.stringify({state:harness.context.state,unit:harness.unit,status:harness.status,options:harness.moveOptions}),before,"context construction does not mutate inputs or state");
}

{
  const harness = createHarness("Nexus",{ownPs:2,missionAvailable:false});
  const result = harness.api.botCreateAdvancedMoveContextF9T0(harness.unit,harness.moveOptions,harness.status);
  eq(result.hasPS,true,"positive status ownPs enables hasPS independently of cell queries");
  eq(result.candidates.map(entry => entry.missionScore),[0,0],"missing mission scorer preserves the zero fallback");
  ok(!harness.calls.mission,"missing mission scorer is never invoked");
}

{
  const agathoi = createHarness("Agathoi");
  const result = agathoi.api.botCreateAdvancedMoveContextF9T0(agathoi.unit,[],agathoi.status);
  eq(result.greenTargets,["agathoi-target"],"Agathoi routes only Green Line targets");
  ok(agathoi.calls.agathoi === 1 && !agathoi.calls.nexus && !agathoi.calls.exordium && !agathoi.calls.liberti && !agathoi.calls.fabeot,"Agathoi excludes every other faction target query");
}

{
  const exordium = createHarness("Exordium");
  const result = exordium.api.botCreateAdvancedMoveContextF9T0(exordium.unit,[],exordium.status);
  eq(result.exordiumFronts,[{id:"front",ps:[0,1,-1],advance:[2,-2,0]}],"Exordium fronts are retained");
  eq(result.exordiumFront,{chosenFor:"moving",source:"front"},"non-empty Exordium fronts select one unit front");
  eq(exordium.calls.chooseFront,1,"Exordium front selection runs exactly once");

  const empty = createHarness("Exordium",{emptyFronts:true});
  const emptyResult = empty.api.botCreateAdvancedMoveContextF9T0(empty.unit,[],empty.status);
  eq(emptyResult.exordiumFront,null,"empty Exordium fronts preserve the null selection");
  ok(!empty.calls.chooseFront,"empty Exordium fronts skip the selector");
}

{
  const liberti = createHarness("Liberti");
  const result = liberti.api.botCreateAdvancedMoveContextF9T0(liberti.unit,[],liberti.status);
  eq({targets:result.libertiTargets,flank:result.libertiFlank},{targets:["liberti-target"],flank:[2,-1,-1]},"Liberti routes target and flank collaborators");
  ok(liberti.calls.liberti === 1 && liberti.calls.libertiFlank === 1 && !liberti.calls.nexus && !liberti.calls.fabeot,"Liberti excludes unrelated faction queries");
}

{
  const fabeot = createHarness("Fabeot");
  const result = fabeot.api.botCreateAdvancedMoveContextF9T0(fabeot.unit,[],fabeot.status);
  eq({targets:result.fabeotTargets,collapse:result.fabeotCollapse,exposed:result.fabeotExposed,concentrated:result.fabeotConcentrated},
    {targets:["fabeot-target"],collapse:true,exposed:[{uid:"exposed"}],concentrated:true},"Fabeot routes all four deception-state collaborators");
  ok(fabeot.calls.fabeot === 1 && fabeot.calls.fabeotCollapse === 1 && fabeot.calls.fabeotExposed === 1 && fabeot.calls.fabeotConcentrated === 1,"each Fabeot query runs exactly once");
}

const start = aiSource.indexOf("function botCreateAdvancedMoveContextF9T0");
const end = aiSource.indexOf("function botFactionMoveBaseScoreF9T0",start);
const source = aiSource.slice(start,end);
ok(start >= 0 && end > start,"move-context source span is present");
ok(!/document|localStorage|sessionStorage|indexedDB|window\.|Math\.random|aiTelemetry|moveUnit\(|render\(/.test(`${sources[sources.length-1]}\n${source}`),"move-context slice has no DOM, storage, RNG, telemetry or action dependency");
ok(source.includes("state.cells") || sources[sources.length-1].includes("getCells"),"cell access remains identifiable before and after extraction");

console.log(`AR-AC1 AI move context characterization smoke: ${checks}/${checks} OK`);
