"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const pressurePerceptionSource = read("src/ai/pressure_perception.js");
const factionMaturitySource = read("src/ai/faction_maturity.js");
const strategicStatusSource = read("src/ai/strategic_status.js");
const aiSource = read("src/ai.js");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => {
  assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected, message);
  checks += 1;
};

const same = (left, right) => Boolean(left && right && left.length === right.length && left.every((value, index) => value === right[index]));
const distance = (left, right) => Math.max(...left.map((value, index) => Math.abs(value - right[index])));
const makeUnit = (uid, side, faction, type, pos) => ({uid, side, faction, type, pos:[...pos], alive:true});

function createHarness({faction="Nexus", controls=[1,1,null,null,null], units=[], requiredPs=4} = {}) {
  const coords = [[0,0,0],[3,-3,0],[-3,3,0],[5,-5,0],[-5,5,0]];
  const state = {
    factions:{1:faction,2:"Fabeot"},
    cells:coords.map((coord,index) => ({id:`PS${index}`,coord:[...coord],ps:true,control:controls[index]})),
    units:units.map(entry => ({...entry,pos:entry.pos ? [...entry.pos] : null}))
  };
  const profile = {totalPs:5,requiredPs,centralCoord:[0,0,0],startRound:20,pressureWin:5,maxRound:35};
  const calls = {combatUnits:0,getCellAt:0};
  const context = vm.createContext({
    console,
    state,
    CENTER_PS_COORD:[0,0,0],
    PRESSURE_WIN:5,
    MAX_ROUND:35,
    sameCoord:same,
    hexDistance:distance,
    getCentralStrategicPointCoord:() => [0,0,0],
    pressureRuleProfile:() => profile,
    pressureStartRound:() => 20,
    pressureWinLimit:() => 5,
    maxRoundLimit:() => 35,
    playerControlsCentralStrategicPoint:player => state.cells[0].control === player,
    combatUnits:player => {
      calls.combatUnits += 1;
      return state.units.filter(unit => unit.alive !== false && unit.side === player && unit.type !== "QG");
    },
    getCellAt:coord => {
      calls.getCellAt += 1;
      return state.cells.find(cell => same(cell.coord,coord)) || null;
    }
  });
  vm.runInContext(`${pressurePerceptionSource}\n${factionMaturitySource}\n${strategicStatusSource}\n${aiSource}\n;globalThis.__maturity={botNexusNetworkMaturityF9T0,botAgathoiGreenLineMaturityF9T0};`, context, {filename:"ai-faction-maturity-characterization.js"});
  return {context,state,profile,calls,api:context.__maturity};
}

const nexusStructures = [
  makeUnit("nx-s1",1,"Nexus","Struttura",[0,1,-1]),
  makeUnit("nx-s2",1,"Nexus","Struttura",[3,-2,-1])
];
const nexusMobile = [
  makeUnit("nx-m1",1,"Nexus","Fanteria",[1,0,-1]),
  makeUnit("nx-m2",1,"Nexus","Fanteria",[2,-1,-1]),
  makeUnit("nx-m3",1,"Nexus","Veicolo",[4,-4,0])
];

let harness = createHarness({faction:"Liberti",units:[...nexusStructures,...nexusMobile]});
let before = JSON.stringify(harness.state);
let result = harness.api.botNexusNetworkMaturityF9T0(1,harness.profile);
eq(result,{mature:false,controlled:0,structures:0,covered:0,mobile:0},"non-Nexus player receives the exact historical neutral shape");
eq(harness.calls.combatUnits,0,"non-Nexus guard performs no unit queries");
eq(JSON.stringify(harness.state),before,"non-Nexus guard is state-read-only");

harness = createHarness({faction:"Nexus",units:[...nexusStructures,...nexusMobile],requiredPs:4});
before = JSON.stringify(harness.state);
result = harness.api.botNexusNetworkMaturityF9T0(1,harness.profile);
eq(result,{mature:true,controlled:2,structures:2,covered:2,mobile:3,targetPs:2},"Nexus network matures with two covered PS, two structures and three mobile units on a four-PS threshold");
eq(JSON.stringify(harness.state),before,"Nexus maturity does not mutate state");
eq(harness.profile,{totalPs:5,requiredPs:4,centralCoord:[0,0,0],startRound:20,pressureWin:5,maxRound:35},"Nexus maturity does not mutate the supplied Pressure profile");

harness = createHarness({
  faction:"Nexus",
  units:[nexusStructures[0],...nexusMobile,makeUnit("nx-extra-cover",1,"Nexus","Fanteria",[3,-4,1])],
  requiredPs:4
});
result = harness.api.botNexusNetworkMaturityF9T0(1,harness.profile);
eq({mature:result.mature,structures:result.structures,covered:result.covered,mobile:result.mobile,targetPs:result.targetPs},
  {mature:false,structures:1,covered:2,mobile:4,targetPs:2},
  "Nexus coverage cannot replace the second required structure on thresholds of three or more");

const alliedCoverageUnits = [
  makeUnit("nx-solo-structure",1,"Nexus","Struttura",[8,-8,0]),
  makeUnit("nx-a1",1,"Nexus","Fanteria",[0,1,-1]),
  makeUnit("nx-a2",1,"Nexus","Fanteria",[1,-1,0]),
  makeUnit("nx-b1",1,"Nexus","Fanteria",[3,-2,-1]),
  makeUnit("nx-b2",1,"Nexus","Fanteria",[4,-3,-1])
];
harness = createHarness({faction:"Nexus",units:alliedCoverageUnits,requiredPs:2});
result = harness.api.botNexusNetworkMaturityF9T0(1,harness.profile);
eq(result,{mature:true,controlled:2,structures:1,covered:2,mobile:4,targetPs:1},"two nearby allies cover a Nexus PS when no structure is adjacent");

const targetPsTable = [
  [1,1],[2,1],[3,2],[4,2],[5,3],[7,4]
];
for (const [requiredPs,targetPs] of targetPsTable) {
  harness = createHarness({faction:"Nexus",units:[...nexusStructures,...nexusMobile],requiredPs});
  result = harness.api.botNexusNetworkMaturityF9T0(1,harness.profile);
  eq(result.targetPs,targetPs,`Nexus target PS scales proportionally for requiredPs=${requiredPs}`);
}

const agathoiStructures = [
  makeUnit("ag-s1",1,"Agathoi","Struttura",[0,2,-2]),
  makeUnit("ag-s2",1,"Agathoi","Struttura",[3,-1,-2])
];
const agathoiMobile = [
  makeUnit("ag-m1",1,"Agathoi","Fanteria",[1,0,-1]),
  makeUnit("ag-m2",1,"Agathoi","Fanteria",[2,-1,-1]),
  makeUnit("ag-m3",1,"Agathoi","Veicolo",[4,-4,0])
];

harness = createHarness({faction:"Nexus",units:[...agathoiStructures,...agathoiMobile]});
result = harness.api.botAgathoiGreenLineMaturityF9T0(1,harness.profile);
eq(result,{mature:false,controlled:0,structures:0,covered:0,mobile:0},"non-Agathoi player receives the exact historical neutral shape");
eq(harness.calls.combatUnits,0,"non-Agathoi guard performs no unit queries");

harness = createHarness({faction:"Agathoi",units:[...agathoiStructures,...agathoiMobile],requiredPs:4});
before = JSON.stringify(harness.state);
result = harness.api.botAgathoiGreenLineMaturityF9T0(1,harness.profile);
eq(result,{mature:true,controlled:2,structures:2,covered:2,mobile:3,targetPs:2},"Agathoi green line matures with range-two structures and two forward mobile units");
eq(JSON.stringify(harness.state),before,"Agathoi maturity does not mutate state");
eq(harness.profile,{totalPs:5,requiredPs:4,centralCoord:[0,0,0],startRound:20,pressureWin:5,maxRound:35},"Agathoi maturity does not mutate the supplied Pressure profile");

const garrisonedAgathoi = [
  ...agathoiStructures,
  makeUnit("ag-g1",1,"Agathoi","Fanteria",[0,0,0]),
  makeUnit("ag-g2",1,"Agathoi","Fanteria",[3,-3,0]),
  makeUnit("ag-forward",1,"Agathoi","Veicolo",[4,-4,0])
];
harness = createHarness({faction:"Agathoi",units:garrisonedAgathoi,requiredPs:4});
result = harness.api.botAgathoiGreenLineMaturityF9T0(1,harness.profile);
eq({mature:result.mature,controlled:result.controlled,structures:result.structures,covered:result.covered,mobile:result.mobile,targetPs:result.targetPs},
  {mature:false,controlled:2,structures:2,covered:2,mobile:3,targetPs:2},
  "Agathoi requires two non-garrison mobile units even when territorial coverage is complete");
eq(harness.calls.getCellAt,3,"Agathoi forward readiness checks every mobile unit against PS garrisoning");

harness = createHarness({
  faction:"Agathoi",
  units:[agathoiStructures[0],...agathoiMobile,makeUnit("ag-extra-cover",1,"Agathoi","Fanteria",[3,-4,1])],
  requiredPs:4
});
result = harness.api.botAgathoiGreenLineMaturityF9T0(1,harness.profile);
eq({mature:result.mature,structures:result.structures,covered:result.covered,mobile:result.mobile,targetPs:result.targetPs},
  {mature:false,structures:1,covered:2,mobile:4,targetPs:2},
  "Agathoi coverage cannot replace the second required structure on thresholds of three or more");

harness = createHarness({faction:"Nexus",units:[...nexusStructures,...nexusMobile],requiredPs:3});
result = harness.api.botNexusNetworkMaturityF9T0(1);
eq({mature:result.mature,targetPs:result.targetPs}, {mature:true,targetPs:2}, "Nexus default parameter consumes the extracted canonical Pressure profile");

const nexusStart = aiSource.indexOf("function botNexusNetworkMaturityF9T0");
const agathoiStart = aiSource.indexOf("function botAgathoiGreenLineMaturityF9T0",nexusStart);
const maturityEnd = aiSource.indexOf("function botGarrisonCellPriorityF9T0",agathoiStart);
const maturitySource = aiSource.slice(nexusStart,maturityEnd);
ok(nexusStart >= 0 && agathoiStart > nexusStart && maturityEnd > agathoiStart,"faction maturity source span is uniquely addressable");
ok(!/document|localStorage|sessionStorage|indexedDB|window\.|Math\.random|aiTelemetry/.test(`${factionMaturitySource}\n${maturitySource}`),"faction maturity boundary and facade have no DOM, persistence, RNG or telemetry dependency");
ok(!/state\.[A-Za-z0-9_$]+\s*=|\.push\(|\.splice\(|\.sort\(/.test(`${factionMaturitySource}\n${maturitySource}`),"faction maturity boundary and facade contain no direct mutation operation");

console.log(`AR-AC1 AI faction maturity characterization smoke: ${checks}/${checks} OK`);
