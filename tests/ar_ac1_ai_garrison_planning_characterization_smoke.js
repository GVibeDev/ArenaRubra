"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const pressureSource = read("src/ai/pressure_perception.js");
const maturitySource = read("src/ai/faction_maturity.js");
const garrisonSource = read("src/ai/garrison_planning.js");
const strategicSource = read("src/ai/strategic_status.js");
const aiSource = read("src/ai.js");
let checks = 0;
const ok = (value,message) => { assert.ok(value,message); checks += 1; };
const eq = (actual,expected,message) => { assert.strictEqual(JSON.stringify(actual),JSON.stringify(expected),message); checks += 1; };

const key = coord => coord.join(",");
const cubeDistance = (left,right) => Math.max(Math.abs(left[0]-right[0]),Math.abs(left[1]-right[1]),Math.abs(left[2]-right[2]));

function createHarness() {
  const context = {
    console,
    state:{cells:[],units:[]},
    enemyCounts:{},
    allyCounts:{},
    __controlledPsCells(player){ return context.state.cells.filter(cell => cell.ps && cell.control === player); },
    __enemiesNear(coord){ return Array.from({length:context.enemyCounts[key(coord)] || 0},(_,index) => ({uid:`enemy-${index}`})); },
    __alliesNear(coord){ return Array.from({length:context.allyCounts[key(coord)] || 0},(_,index) => ({uid:`ally-${index}`})); },
    __sameCoord:(left,right) => Array.isArray(left) && Array.isArray(right) && left.every((value,index) => value === right[index]),
    __hexDistance:cubeDistance,
    __getUnitAt(coord){ return context.state.units.find(unit => context.__sameCoord(unit.pos,coord)) || null; }
  };
  vm.createContext(context);
  vm.runInContext(`${pressureSource}\n${maturitySource}\n${garrisonSource}\n${strategicSource}\n${aiSource}\n;controlledPsCells=__controlledPsCells; enemiesNear=__enemiesNear; alliesNear=__alliesNear; sameCoord=__sameCoord; hexDistance=__hexDistance; getUnitAt=__getUnitAt; globalThis.__garrison={botGarrisonCellPriorityF9T0,botBuildGarrisonPlanF9T0};`,context,{filename:"ai-garrison-planning-characterization.js"});
  return {context,api:context.__garrison};
}

function cell(id,coord,control=1){ return {id,coord:[...coord],ps:true,control}; }
function status(overrides={}) {
  return {
    center:null,
    ownHq:null,
    closePressureLock:false,
    ownPressureQualified:false,
    pressureEmergency:false,
    hqDanger:false,
    pressureWindow:false,
    stalledRounds:0,
    winning:false,
    networkMature:false,
    greenLineMature:false,
    ...overrides
  };
}

{
  const {context,api} = createHarness();
  const target = cell("center",[0,0,0]);
  context.enemyCounts[key(target.coord)] = 2;
  const result = api.botGarrisonCellPriorityF9T0(1,target,status({
    center:target,
    ownHq:{pos:[1,-1,0]},
    ownPressureQualified:true
  }));
  eq(result,{score:172,enemies:2,allies:0,isCenter:true,nearHq:true},"priority preserves every additive center/threat/pressure/isolation term");
}

{
  const {context,api} = createHarness();
  const target = cell("flank",[4,-4,0]);
  context.enemyCounts[key(target.coord)] = 1;
  context.allyCounts[key(target.coord)] = 2;
  const result = api.botGarrisonCellPriorityF9T0(1,target,status({ownHq:{pos:[0,0,0]},closePressureLock:true}));
  eq(result,{score:60,enemies:1,allies:2,isCenter:false,nearHq:false},"non-central priority preserves threat and pressure-lock terms without isolation bonus");
}

{
  const {context,api} = createHarness();
  const result = api.botBuildGarrisonPlanF9T0(1,status());
  eq(result.budget,0,"empty controlled-PS set has zero budget");
  eq(result.keepCells,[],"empty plan has no kept cells");
  ok(Object.prototype.toString.call(result.keepKeys) === "[object Set]" && result.keepKeys.size === 0,"empty plan exposes an empty Set of keys");
  eq(result.guardTargets,[],"empty plan has no guard targets");
  ok(!Object.prototype.hasOwnProperty.call(result,"entries"),"empty plan preserves the historical omission of entries");
  eq(context.state,{cells:[],units:[]},"empty planning is read-only");
}

function budgetFor(count,overrides={},configure=()=>{}) {
  const {context,api} = createHarness();
  context.state.cells = Array.from({length:count},(_,index) => cell(`ps-${index+1}`,[index,-index,0]));
  configure(context);
  return api.botBuildGarrisonPlanF9T0(1,status(overrides));
}

eq(budgetFor(1).budget,1,"one controlled PS always receives one garrison slot");
eq(budgetFor(4,{closePressureLock:true}).budget,4,"close Pressure lock keeps every controlled PS");
eq(budgetFor(4,{pressureEmergency:true}).budget,4,"Pressure emergency keeps every controlled PS");
eq(budgetFor(2,{hqDanger:true}).budget,2,"HQ danger with at most two controlled PS keeps both");
eq(budgetFor(5,{stalledRounds:2}).budget,2,"stall recovery uses the 34-percent budget branch");
eq(budgetFor(5,{winning:true,networkMature:true}).budget,3,"winning mature Nexus posture uses the 50-percent budget branch");
eq(budgetFor(5,{winning:true,greenLineMature:true}).budget,3,"winning mature Agathoi posture uses the 50-percent budget branch");
eq(budgetFor(5).budget,4,"default posture uses the 67-percent budget branch");

{
  const plan = budgetFor(5,{stalledRounds:2});
  eq(plan.keepCells.length,2,"keep-cell count matches the computed budget without critical cells");
}

{
  const plan = budgetFor(5,{stalledRounds:2},context => {
    for(let index=0;index<4;index += 1) context.enemyCounts[`${index},${-index},0`] = 1;
  });
  eq(plan.budget,4,"critical threatened cells raise the budget above the posture baseline");
  eq(plan.keepCells.length,4,"all critical threatened cells remain in the keep set");
}

{
  const {context,api} = createHarness();
  context.state.cells = [cell("zeta",[0,0,0]),cell("alfa",[1,-1,0]),cell("beta",[2,-2,0])];
  for(const current of context.state.cells) context.allyCounts[key(current.coord)] = 1;
  const plan = api.botBuildGarrisonPlanF9T0(1,status({closePressureLock:true}));
  eq(Array.from(plan.entries,item => item.cell.id),["alfa","beta","zeta"],"equal priorities use stable cell-id ordering");
  eq(Array.from(plan.keepKeys),["1,-1,0","2,-2,0","0,0,0"],"keepKeys preserve ranked keep-cell order");
}

{
  const {context,api} = createHarness();
  const empty = cell("empty",[0,0,0]);
  const undermanned = cell("under",[1,-1,0]);
  const supported = cell("supported",[2,-2,0]);
  const hostile = cell("hostile",[3,-3,0]);
  context.state.cells = [empty,undermanned,supported,hostile];
  context.state.units = [
    {uid:"own-under",side:1,pos:[...undermanned.coord]},
    {uid:"own-supported",side:1,pos:[...supported.coord]},
    {uid:"enemy-hostile",side:2,pos:[...hostile.coord]}
  ];
  context.enemyCounts[key(undermanned.coord)] = 2;
  context.allyCounts[key(undermanned.coord)] = 1;
  context.enemyCounts[key(supported.coord)] = 1;
  context.allyCounts[key(supported.coord)] = 2;
  const plan = api.botBuildGarrisonPlanF9T0(1,status({closePressureLock:true}));
  eq(Array.from(plan.guardTargets,item => item.id).sort(),["empty","hostile","under"],"guard targets preserve empty, hostile-occupied and undermanned threatened cases");
  ok(!plan.guardTargets.includes(supported),"sufficiently supported friendly occupant is not a guard target");
}

{
  const {context,api} = createHarness();
  const flankA = cell("a",[1,-1,0]);
  const center = cell("center",[0,0,0]);
  const flankB = cell("b",[2,-2,0]);
  const flankC = cell("c",[3,-3,0]);
  context.state.cells = [flankA,center,flankB,flankC];
  for(const current of context.state.cells) context.allyCounts[key(current.coord)] = 1;
  const plan = api.botBuildGarrisonPlanF9T0(1,status({center,pressureWindow:true,stalledRounds:2}));
  ok(plan.keepCells.includes(center),"central PS is critical during the Pressure window even without nearby enemies");
  eq(plan.budget,2,"a single central critical PS does not inflate an already sufficient stall budget");
}

{
  const {context,api} = createHarness();
  context.state.cells = [cell("a",[0,0,0]),cell("b",[1,-1,0]),cell("enemy",[2,-2,0],2)];
  context.state.units = [{uid:"own",side:1,pos:[0,0,0]}];
  context.enemyCounts["0,0,0"] = 1;
  const beforeState = JSON.stringify(context.state);
  const resolvedStatus = status({closePressureLock:true,ownHq:{pos:[3,-3,0]}});
  const beforeStatus = JSON.stringify(resolvedStatus);
  api.botBuildGarrisonPlanF9T0(1,resolvedStatus);
  eq(JSON.stringify(context.state),beforeState,"planning does not mutate cells or units");
  eq(JSON.stringify(resolvedStatus),beforeStatus,"planning does not mutate Strategic Status");
}

const start = aiSource.indexOf("function botGarrisonCellPriorityF9T0");
const end = aiSource.indexOf("function botStallOscillationScoreF9T0",start);
const source = aiSource.slice(start,end);
ok(start >= 0 && end > start,"garrison planning source span is present");
ok(!/document|localStorage|sessionStorage|indexedDB|window\.|Math\.random|aiTelemetry/.test(`${garrisonSource}\n${source}`),"garrison planning has no DOM, storage, RNG or telemetry dependency");
ok(!/state\.|\.splice\(/.test(`${garrisonSource}\n${source}`),"garrison planning has no direct state or destructive input-collection mutation");

console.log(`AR-AC1 AI garrison planning characterization smoke: ${checks}/${checks} OK`);
