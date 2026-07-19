"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
let played = [];
let decisions = [];
let telemetry = [];
const context = {
  console, Object, Array, Number, Boolean, Math, Set, Map, Date,
  state:null,
  EventTypes:{MISSION_AI_DECISION:"MISSION_AI_DECISION"},
  missionInteractionBlocked(){ return false; }, missionIsRecoveryLocked(){ return false; },
  missionPlayMission(side, options){ played.push({side,options}); context.state.missions[side].played = true; return true; },
  missionTelemetryRecord(side,key,amount,extra){ telemetry.push({side,key,amount,extra}); return true; },
  ensureMissionTelemetry(){ return context.state.missionTelemetry; },
  emitGameEvent(event){ decisions.push(event.data); },
  playerName(side){ return `G${side}`; }, log(){},
  enemyOf(side){ return side === 1 ? 2 : 1; },
  combatUnits(side){ return context.state.units.filter(unit => unit.side === side && unit.alive !== false); },
  evaluateBotStrategicState(){ return context.strategic || {posture:"equilibrio"}; },
  botHandFreeSlots(){ return 2; }, botHasImmediateAttack(unit){ return Boolean(unit.readyAttack); },
  getCellAt(coord){ return context.state.cells.find(c => JSON.stringify(c.coord) === JSON.stringify(coord)) || null; },
  minDistance(coord,coords){ return Math.min(...coords.map(c => context.hexDistance(coord,c))); },
  hexDistance(a,b){ return Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2])); },
  getHq(side){ return {side,pos:side===1?[-6,0,6]:[6,0,-6]}; },
  numericalSuperiorityBonus(){ return 1; }, hasStatus(){ return false; }, enemiesNear(){ return []; },
  missionEffectTagsFromAbility(ab){
    const tags=[]; if (ab && ["armor","adjacentDefBuff"].includes(ab.kind)) tags.push("defensive_ability"); if (ab && ab.kind==="psLock") tags.push("ps_related"); return tags;
  },
  missionEffectTagsFromTactic(card){ return card && card.effectKind === "energy_gain_by_ps" ? ["ps_related"] : []; }
};
vm.createContext(context);
for (const relative of ["data/missions_base.js", "src/mission_ai.js"]) vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, { filename:relative });
context.missionDefinitionById = id => vm.runInContext(`MISSION_DEFINITIONS.find(m => m.id === ${JSON.stringify(id)})`, context);
context.missionObjectivesFor = def => def.missionClass === "desperate" ? def.conditions : def.objectives;
context.missionRuntime = side => context.state.missions[side];

function runtime(id, ready=true, readyCount=3) {
  const def = context.missionDefinitionById(id);
  return { active:true, played:false, missionId:id, missionName:def.name, missionClass:def.missionClass, cycle:1, ready, readyCount, entries:Object.fromEntries(context.missionObjectivesFor(def).map(item => [item.id,{completed:false}])) };
}
context.state = {
  modes:{1:"bot",2:"human"}, currentPlayer:1, turn:5, factions:{1:"Nexus",2:"Fabeot"},
  missions:{1:runtime("NXMSN01"),2:null}, units:[], cells:[{coord:[0,0,0],ps:true,control:2}],
  missionTelemetry:{lastAiDecision:{1:null,2:null}}
};

assert.equal(vm.runInContext("botTryPlayMission(1, 'turn_start')", context), true);
assert.equal(played.length, 1);
assert.equal(played[0].options.allowBot, true);
assert.equal(decisions.at(-1).decision, "play");

// Bias Missione ordinaria: Tafos preferisce costo >=3 e abilità difensive.
context.state.missions[1] = runtime("AGMSN01", false, 0);
context.state.factions[1] = "Agathoi";
const high = vm.runInContext("botMissionPurchaseBonus(1, {type:'Fanteria',cost:3,weight:'Pesante',ability:{kind:'armor'}})", context);
const low = vm.runInContext("botMissionPurchaseBonus(1, {type:'Fanteria',cost:1,weight:'Leggera'})", context);
assert.ok(high > low + 10, `bonus Tafos alto ${high} vs basso ${low}`);
assert.ok(vm.runInContext("botMissionAbilityBonus({side:1}, {}, {kind:'armor'})", context) > 0);

// Mainframe orienta il movimento verso il PS centrale.
context.state.missions[1] = runtime("NXMSN02", false, 0);
context.state.factions[1] = "Nexus";
context.state.missions[1].entries.o2.completed = true;
context.state.missions[1].entries.o3.completed = true;
context.unit = {side:1,type:"Fanteria",pos:[-2,0,2]};
const center = vm.runInContext("botMissionMoveBonus(unit, [0,0,0])", context);
const far = vm.runInContext("botMissionMoveBonus(unit, [-4,0,4])", context);
assert.ok(center > far);

// Sangue e Sabbia valorizza gli spawn da tattica.
context.state.missions[1] = runtime("LBMSN02", false, 0);
context.state.factions[1] = "Liberti";
assert.ok(vm.runInContext("botMissionTacticBonus(1, {effectKind:'spawn_two_militia'})", context) >= 16);

// Missione disperata ×1: l'IA può attendere; ×2: la gioca.
played = [];
context.state.turn = 4;
context.strategic = {posture:"vantaggio"};
context.state.factions[1] = "Exordium";
context.state.units = [{uid:"v1",side:1,type:"Veicolo",alive:true,pos:[0,0,0]}];
context.state.missions[1] = runtime("EXMSND01", true, 1);
assert.equal(vm.runInContext("botTryPlayMission(1, 'turn_start')", context), false);
assert.equal(played.length, 0);
assert.equal(decisions.at(-1).decision, "wait");
assert.ok(telemetry.some(item => item.key === "aiMissionWaits"));

context.state.missions[1] = runtime("EXMSND01", true, 2);
assert.equal(vm.runInContext("botTryPlayMission(1, 'dynamic')", context), true);
assert.equal(played.length, 1);
assert.equal(played[0].options.allowBot, true);

console.log("F9N10 Mission AI smoke: gioco/wait, acquisti, abilità, movimento e tattiche OK");
