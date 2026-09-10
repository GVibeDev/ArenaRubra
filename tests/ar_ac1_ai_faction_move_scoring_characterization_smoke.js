"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const serviceSources = [
  "src/ai/pressure_perception.js",
  "src/ai/finalization_memory.js",
  "src/ai/faction_maturity.js",
  "src/ai/garrison_planning.js",
  "src/ai/strategic_status.js",
  "src/ai/move_context.js",
  "src/ai/faction_move_scoring.js",
  "src/ai/move_selection.js"
].map(read);
const factionScoringSource = read("src/ai/faction_move_scoring.js");
const aiSource = read("src/ai.js");
const cubeDistance = (left,right) => Math.max(...left.map((value,index) => Math.abs(value-right[index])));
let checks = 0;
const ok = (value,message) => { assert.ok(value,message); checks += 1; };
const eq = (actual,expected,message) => { assert.strictEqual(JSON.stringify(actual),JSON.stringify(expected),message); checks += 1; };

const calls = [];
const log = (name,...args) => calls.push(`${name}:${args.map(value => Array.isArray(value) ? value.join(",") : String(value)).join("|")}`);
const cells = [
  {id:"own-ps",coord:[0,0,0],ps:true,control:1},
  {id:"enemy-ps",coord:[2,-2,0],ps:true,control:2},
  {id:"neutral-ps",coord:[3,-3,0],ps:true,control:null},
  {id:"plain",coord:[5,-5,0],ps:false,control:null}
];
const sandbox = {
  console,
  state:{cells},
  __garrisoning(unit){ log("garrison",unit.uid); return Boolean(unit.garrisoning); },
  __release(unit,status){ log("release",unit.uid,status.release); return Boolean(status.release); },
  __minDistance(coord,targets){ log("min",coord,targets.length); return targets.length ? Math.min(...targets.map(target => cubeDistance(coord,target))) : 99; },
  __nearest(coord,targets){ log("nearest",coord,targets.length); return targets.reduce((best,target) => cubeDistance(coord,target)<cubeDistance(coord,best) ? target : best,targets[0]); },
  __distance(left,right){ log("distance",left,right); return cubeDistance(left,right); },
  __same(left,right){ log("same",left,right); return Boolean(left&&right&&cubeDistance(left,right)===0); },
  __psProtection(player,coord){ log("psProtection",player,coord); return 5+coord[0]; },
  __greenNetwork(player,coord){ log("greenNetwork",player,coord); return 4; },
  __shock(unit){ log("shock",unit.uid); return Boolean(unit.shock); },
  __sacrificial(unit){ log("sacrificial",unit.uid); return Boolean(unit.sacrificial); },
  __adjacent(left,right){ log("adjacent",left,right); return cubeDistance(left,right)===1; },
  __lessDefended(player){ log("lessDefended",player); return [[2,-2,0],[3,-3,0]]; },
  __bait(unit){ log("bait",unit.uid); return Boolean(unit.bait); },
  __valuable(unit){ log("valuable",unit.uid); return Boolean(unit.valuable); },
  __split(player,coord,status){ log("split",player,coord,status.mode); return 8; },
  __commanderThreat(commander){ log("commanderThreat",commander.uid); return commander.threat||0; },
  __commanderProtection(unit,coord){ log("commanderProtection",unit.uid,coord); return 3; }
};
vm.createContext(sandbox);
vm.runInContext(`${serviceSources.join("\n")}\n${aiSource}\n;
  unitIsGarrisoningPs=__garrisoning;
  shouldReleasePsGarrison=__release;
  minDistance=__minDistance;
  nearestCoord=__nearest;
  hexDistance=__distance;
  sameCoord=__same;
  psProtectionMoveBonus=__psProtection;
  botAgathoiStructureNetworkScore=__greenNetwork;
  botExordiumShockUnit=__shock;
  botUnitIsSacrificial=__sacrificial;
  areAdjacent=__adjacent;
  botFabeotLessDefendedPsTargets=__lessDefended;
  botFabeotIsBaitUnit=__bait;
  botFabeotIsValuableUnit=__valuable;
  botFabeotSplitPressureScore=__split;
  commanderThreatLevel=__commanderThreat;
  commanderProtectionMoveBonus=__commanderProtection;
  globalThis.__score=botFactionMoveBaseScoreF9T0;`,sandbox,{filename:"ai-faction-move-scoring-characterization.js"});

function makeCase(id,faction,overrides={}) {
  const unit = {
    uid:`${id}-unit`, side:1, faction, type:"Fanteria", weight:"Leggera", pos:[0,0,0],
    ...overrides.unit
  };
  const status = {
    networkMature:false, greenLineMature:false, zeroPsRecovery:false, pressureEmergency:false,
    ownPs:1, pressureProfile:{requiredPs:3}, qgWinPlan:false, pressureWinPlan:false,
    hqDanger:false, qgRaiders:1, mode:id, release:false,
    ...overrides.status
  };
  const coord = overrides.coord || [1,-1,0];
  const cell = Object.prototype.hasOwnProperty.call(overrides,"cell") ? overrides.cell : cells.find(candidate => cubeDistance(candidate.coord,coord)===0) || null;
  const entry = {coord,cell,enemyHqDistance:cubeDistance(coord,[4,-4,0]),alliesR1:2,enemiesR1:1,...overrides.entry};
  const context = {
    unit, player:1, enemyHq:{uid:"enemy-hq",pos:[4,-4,0]}, hasPS:true, status,
    psCells:cells.filter(candidate => candidate.ps).map(candidate => candidate.coord),
    uncontrolledPs:[[2,-2,0],[3,-3,0]], controlledPs:[[0,0,0]],
    guardTarget:null, commander:{uid:"commander",pos:[0,1,-1],threat:2},
    nexusTargets:[[2,-2,0]], greenTargets:[[2,-2,0]],
    exordiumFronts:[{ps:[2,-2,0],advance:[3,-3,0]}], exordiumFront:{ps:[2,-2,0],advance:[3,-3,0]},
    libertiTargets:[[2,-2,0],[3,-3,0]], libertiFlank:[3,-3,0],
    fabeotTargets:[[2,-2,0]], fabeotCollapse:false, fabeotExposed:[{uid:"exposed",pos:[3,-3,0]}], fabeotConcentrated:false,
    enemyUnits:[{uid:"enemy-a",pos:[2,-1,-1]},{uid:"enemy-b",pos:[4,-4,0]}],
    allyUnits:[{uid:"ally-a",pos:[1,0,-1]},{uid:"ally-b",pos:[3,-2,-1]}],
    ...overrides.context
  };
  context.unit = unit;
  context.status = status;
  return {id,entry,context};
}

const cases = [
  makeCase("nexus-no-ps","Nexus",{unit:{weight:"Pivot"},coord:[2,-2,0],context:{hasPS:false}}),
  makeCase("nexus-emergency","Nexus",{coord:[4,-4,0],cell:{ps:true,control:2},status:{pressureEmergency:true,qgWinPlan:true,networkMature:true}}),
  makeCase("nexus-guard","Nexus",{context:{guardTarget:{coord:[2,-2,0]}}}),
  makeCase("nexus-low-control","Nexus",{status:{ownPs:1,pressureProfile:{requiredPs:4}}}),
  makeCase("nexus-pressure-plan","Nexus",{status:{networkMature:true,pressureWinPlan:true}}),
  makeCase("nexus-structure-away","Nexus",{unit:{type:"Struttura"},coord:[5,-5,0],status:{networkMature:true}}),
  makeCase("nexus-garrison-lock","Nexus",{unit:{garrisoning:true},status:{release:false}}),
  makeCase("agathoi-no-ps","Agathoi",{unit:{canBuild:true},context:{hasPS:false},coord:[1,-1,0]}),
  makeCase("agathoi-guard","Agathoi",{context:{guardTarget:{coord:[3,-3,0]}}}),
  makeCase("agathoi-mature-pressure","Agathoi",{coord:[2,-2,0],status:{greenLineMature:true,pressureWinPlan:true}}),
  makeCase("agathoi-hq","Agathoi",{coord:[4,-4,0],cell:null,status:{greenLineMature:true,qgWinPlan:true}}),
  makeCase("exordium-recovery","Exordium",{context:{hasPS:false},coord:[2,-2,0]}),
  makeCase("exordium-front","Exordium",{unit:{type:"Veicolo",weight:"Elite",shock:true},entry:{alliesR1:4},coord:[3,-3,0]}),
  makeCase("liberti-recovery","Liberti",{unit:{sacrificial:true},context:{hasPS:false},coord:[0,0,0]}),
  makeCase("liberti-flank","Liberti",{coord:[2,-1,-1]}),
  makeCase("liberti-hq","Liberti",{coord:[4,-4,0],cell:null,status:{qgWinPlan:true,qgRaiders:2}}),
  makeCase("fabeot-recovery","Fabeot",{context:{hasPS:false},coord:[2,-2,0]}),
  makeCase("fabeot-collapse","Fabeot",{unit:{ability:{passive:false,range:2},bait:true},coord:[4,-4,0],cell:null,status:{qgRaiders:2},context:{fabeotCollapse:true,fabeotConcentrated:true}}),
  makeCase("fabeot-feint","Fabeot",{unit:{valuable:true},coord:[2,-2,0],context:{fabeotConcentrated:true}}),
  makeCase("unknown-common-tail","Other",{unit:{type:"Comandante"},entry:{enemiesR1:3}})
];

const before = JSON.stringify(cases);
const observations = cases.map(testCase => {
  calls.length = 0;
  const score = sandbox.__score(testCase.entry,testCase.context);
  return {id:testCase.id,score,calls:[...calls]};
});
const digest = crypto.createHash("sha256").update(JSON.stringify(observations)).digest("hex");
const expectedDigest = "9c7dbc8949ab0bb1a0e33a3ae8159d7ef0d35475319580b0d8ec910a33d87868";
eq(digest,expectedDigest,"per-faction score and collaborator-call corpus is unchanged");
eq(JSON.stringify(cases),before,"faction scoring does not mutate entries, contexts, units, status or state");
eq(observations.map(item => item.id),cases.map(item => item.id),"all faction scenarios execute in declared order");
ok(observations.every(item => typeof item.score === "number"&&!Number.isNaN(item.score)),"all characterized scores remain finite numbers");
ok(observations.find(item => item.id==="nexus-garrison-lock").score < -900,"non-released PS garrison retains its hard penalty");
ok(observations.find(item => item.id==="unknown-common-tail").calls.some(call => call.startsWith("commanderProtection:")),"unknown factions still execute the common protection tail");

const start = aiSource.indexOf("function botFactionMoveBaseScoreF9T0");
const end = aiSource.indexOf("let AI_MOVE_SELECTION_SERVICE",start);
const source = `${factionScoringSource}\n${aiSource.slice(start,end)}`;
ok(start>=0&&end>start,"faction-scoring source span is present");
for(const faction of ["Nexus","Agathoi","Exordium","Liberti","Fabeot"]) ok(source.includes(`unit.faction === \"${faction}\"`),`${faction} branch remains explicit`);
ok(!/document|localStorage|sessionStorage|indexedDB|window\.|Math\.random|aiTelemetry|moveUnit\(|render\(/.test(source),"faction scoring has no DOM, storage, RNG, telemetry or action dependency");
ok(source.includes("state.cells")||serviceSources.some(text => text.includes("getCells")),"battlefield cell dependency remains identifiable before and after extraction");

console.log(`AR-AC1 AI faction move scoring characterization smoke: ${checks}/${checks} OK (${digest})`);
