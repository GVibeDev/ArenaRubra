"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const html = read("index.html");
const css = read("css/style.css");
const uiSource = read("src/f9u1b_ui.js");
const renderSource = read("src/render.js");
const buildSource = read("src/build_info.js");

const state = {
  factions:{1:"Nexus",2:"Exordium",3:"Liberti",4:"Nexus"},
  players:{1:{id:1},2:{id:2},3:{id:3,eliminated:true},4:{id:4}},
  cells:[
    {coord:[0,0,0],ps:true,control:1},
    {coord:[1,0,-1],ps:true,control:1},
    {coord:[0,1,-1],ps:true,control:2},
    {coord:[-1,1,0],ps:true,control:4},
    {coord:[0,-1,1],ps:true,control:null},
    {coord:[2,0,-2],ps:false,control:3}
  ],
  units:[
    {uid:"hq1",side:1,type:"QG",alive:true,currentHp:20,pos:[3,0,-3]},
    {uid:"u1",side:1,type:"Fanteria",alive:true,currentHp:3,pos:[0,0,0]},
    {uid:"s1",side:1,type:"Struttura",alive:true,currentHp:5,pos:[1,-1,0]},
    {uid:"u2",side:2,type:"Veicolo",alive:true,currentHp:4,pos:[0,1,-1]},
    {uid:"dead3",side:3,type:"Fanteria",alive:false,currentHp:0,pos:null},
    {uid:"s4",side:4,type:"Struttura",alive:true,currentHp:2,pos:[-1,1,0]}
  ]
};
const before = JSON.stringify(state);
const context = {
  console,
  document:undefined,
  state,
  mapRuntimePlayerIds:s => Object.keys(s.factions).map(Number),
  factionMeta:faction => ({
    Nexus:{color:"#2b6fb8"}, Exordium:{color:"#b43a32"}, Liberti:{color:"#b88720"}
  }[faction] || {color:"#73839a"})
};
vm.createContext(context);
vm.runInContext(`${buildSource}\n${uiSource}\n;globalThis.__build=BUILD_INFO;globalThis.__snapshot=f9u1bComparisonSnapshot;globalThis.__signature=f9u1bComparisonSignature;`, context, {filename:"f9u1b_ui.js"});
const build = context.__build;
const snapshot = vm.runInContext("__snapshot(state)", context);
const normalized = JSON.parse(JSON.stringify(snapshot));

assert.equal(build.version, "C2-STABLE-1-F9V3a-APK-M4c");
assert.equal(build.buildName, "Tutorial Challenge I · Elimination");
assert.equal(build.buildChannel, "starter2-tutorial-v2e");
assert.equal(build.logicBaseline, "C2-STABLE-1-F9T2c4-APK-M4c");
assert.ok(build.notes.includes("stato autorevole"));
assert.ok(build.notes.includes("F9Q3e1-2"));

assert.ok(html.includes('id="gameComparisonBars"'));
assert.ok(html.includes('id="gameComparisonPsSegments"'));
assert.ok(html.includes('id="gameComparisonUnitSegments"'));
assert.ok(html.includes('id="gameComparisonPsCounters"'));
assert.ok(html.includes('id="gameComparisonUnitCounters"'));
assert.ok(html.includes('src/f9u1b_ui.js'));
assert.ok(html.includes('id="selectedUnitFloatTitle"'));

assert.deepEqual(normalized.playerIds, [1,2,3,4]);
assert.equal(normalized.psTotal, 5);
assert.equal(normalized.psNeutral, 1);
assert.equal(normalized.unitTotal, 4);
assert.equal(normalized.players.find(p => p.side === 1).ps, 2);
assert.equal(normalized.players.find(p => p.side === 1).units, 2, "struttura inclusa, QG escluso");
assert.equal(normalized.players.find(p => p.side === 2).units, 1);
assert.equal(normalized.players.find(p => p.side === 3).units, 0, "unità distrutta esclusa");
assert.equal(normalized.players.find(p => p.side === 4).units, 1);
assert.equal(normalized.players.find(p => p.side === 3).eliminated, true);
assert.equal(normalized.players.find(p => p.side === 1).duplicateFaction, true);
assert.equal(normalized.players.find(p => p.side === 4).duplicateFaction, true);
assert.equal(JSON.stringify(state), before, "snapshot non modifica lo stato");
assert.ok(vm.runInContext("__signature(__snapshot(state))", context).includes('Nexus'));

assert.ok(uiSource.includes("f9u1bControlledPsCount"));
assert.ok(uiSource.includes("f9u1bFieldUnitCount"));
assert.ok(uiSource.includes("renderF9U1bComparisonBars"));
assert.ok(!uiSource.includes("matchTelemetryRecord"));
assert.ok(!uiSource.includes("MATCH_TELEMETRY_STATE"));
assert.ok(renderSource.includes('abilitySlot.hidden = !hasPrimaryActiveAbility'));
assert.ok(renderSource.includes('inspectorTitle.textContent = selected.name'));
assert.ok(css.includes('.gameComparisonBars'));
assert.ok(css.includes('.gameComparisonSegment'));
assert.ok(css.includes('.gameComparisonCounter'));
assert.ok(css.includes('height: 8px'));
assert.ok(css.includes('isDuplicateFaction'));
assert.ok(css.includes('selectedUnitPrimaryAbilitySlot[hidden]'));

console.log("F9U1b Unit Inspector & PS/Unit Bars smoke: 42/42 verifiche superate");
