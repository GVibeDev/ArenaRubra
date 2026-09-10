"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const boundary = read("src/ai/faction_maturity.js");
const facade = read("src/ai.js");
const index = read("index.html");
let checks = 0;
const ok = (value,message) => { assert.ok(value,message); checks += 1; };
const eq = (actual,expected,message) => { assert.strictEqual(actual,expected,message); checks += 1; };

const context = {};
vm.createContext(context);
vm.runInContext(boundary,context,{filename:"src/ai/faction_maturity.js"});
ok(typeof context.createAiFactionMaturityService === "function","boundary exposes one service factory");

const calls = {nexus:0,agathoi:0,controlled:0,combat:0,structures:0,distance:0,allies:0,garrison:0};
const service = context.createAiFactionMaturityService({
  isNexusPlayer(){ calls.nexus += 1; return false; },
  isAgathoiPlayer(){ calls.agathoi += 1; return false; },
  getControlledPsCells(){ calls.controlled += 1; return []; },
  getCombatUnits(){ calls.combat += 1; return []; },
  getAgathoiStructures(){ calls.structures += 1; return []; },
  getHexDistance(){ calls.distance += 1; return 99; },
  getAlliesNear(){ calls.allies += 1; return []; },
  isUnitGarrisoningPs(){ calls.garrison += 1; return false; }
});
ok(Object.isFrozen(service),"service API is immutable");
eq(Array.from(Object.keys(service)).sort().join(","),["botAgathoiGreenLineMaturityF9T0","botNexusNetworkMaturityF9T0"].sort().join(","),"service exposes only the two characterized maturity queries");

const profile = {requiredPs:4};
eq(JSON.stringify(service.botNexusNetworkMaturityF9T0(1,profile)),JSON.stringify({mature:false,controlled:0,structures:0,covered:0,mobile:0}),"Nexus wrong-faction guard preserves the neutral result");
eq(JSON.stringify(service.botAgathoiGreenLineMaturityF9T0(1,profile)),JSON.stringify({mature:false,controlled:0,structures:0,covered:0,mobile:0}),"Agathoi wrong-faction guard preserves the neutral result");
eq(JSON.stringify(calls),JSON.stringify({nexus:1,agathoi:1,controlled:0,combat:0,structures:0,distance:0,allies:0,garrison:0}),"wrong-faction guards short-circuit every battlefield query");

for(const forbidden of ["document","localStorage","sessionStorage","indexedDB","window.","state.","Math.random","aiTelemetry"]){
  ok(!boundary.includes(forbidden),`boundary excludes ${forbidden}`);
}
ok(boundary.includes("getControlledPsCells")&&boundary.includes("getCombatUnits")&&boundary.includes("getAlliesNear"),"battlefield reads enter through named ports");
ok(boundary.includes("getAgathoiStructures")&&boundary.includes("isUnitGarrisoningPs"),"Agathoi-specific reads enter through named ports");
ok(!boundary.includes("botPressureProfileF9T0"),"canonical Pressure profile is supplied by the facade");
ok(!/\.push\(|\.splice\(|\.sort\(/.test(boundary),"boundary contains no collection mutation operation");

for(const name of ["botNexusNetworkMaturityF9T0","botAgathoiGreenLineMaturityF9T0"]){
  const declarations = facade.match(new RegExp(`function\\s+${name}\\s*\\(`,"g"))||[];
  eq(declarations.length,1,`${name} has one legacy facade declaration`);
  ok(facade.includes(`aiFactionMaturityService().${name}(player,profile)`),`${name} delegates to the boundary`);
}
ok(facade.includes("profile=botPressureProfileF9T0()"),"legacy facades retain the default canonical Pressure profile");

const facadeStart = facade.indexOf("function botNexusNetworkMaturityF9T0");
const facadeEnd = facade.indexOf("function botGarrisonCellPriorityF9T0",facadeStart);
const facadeBody = facade.slice(facadeStart,facadeEnd);
ok(!facadeBody.includes("requiredStructures")&&!facadeBody.includes("forwardReady"),"maturity implementation has one owner");

const pressureIndex = index.indexOf('<script src="src/ai/pressure_perception.js"></script>');
const maturityIndex = index.indexOf('<script src="src/ai/faction_maturity.js"></script>');
const statusIndex = index.indexOf('<script src="src/ai/strategic_status.js"></script>');
const facadeIndex = index.indexOf('<script src="src/ai.js"></script>');
ok(pressureIndex>=0&&pressureIndex<maturityIndex&&maturityIndex<statusIndex&&statusIndex<facadeIndex,"browser loads faction maturity between Pressure perception and Strategic Status before the facade");

console.log(`AR-AC1 AI faction maturity boundary contract smoke: ${checks}/${checks} OK`);
