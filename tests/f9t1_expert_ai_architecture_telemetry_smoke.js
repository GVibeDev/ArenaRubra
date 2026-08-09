"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
let checks = 0;
function ok(condition, message) { assert.ok(condition, message); checks += 1; }
function equal(actual, expected, message) { assert.strictEqual(actual, expected, message); checks += 1; }

const sourceFiles = [
  "src/expert_ai/expert_common_strategy.js",
  "src/expert_ai/expert_nexus.js",
  "src/expert_ai/expert_exordium.js",
  "src/expert_ai/expert_liberti.js",
  "src/expert_ai/expert_agathoi.js",
  "src/expert_ai/expert_fabeot.js",
  "src/expert_ai/expert_router.js",
  "src/expert_ai/expert_runtime.js"
];
for (const relative of sourceFiles) ok(fs.existsSync(path.join(ROOT, relative)), `presente ${relative}`);

const index = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
ok(index.includes('option value="expert"'), "modalità Expert esposta nel setup di sviluppo");
for (const relative of sourceFiles) ok(index.includes(relative), `script caricato: ${relative}`);

const aiSource = fs.readFileSync(path.join(ROOT, "src/ai.js"), "utf8");
ok(aiSource.includes('state.aiMode === "advanced" || state.aiMode === "expert"'), "Expert riusa il motore Advanced F9T0 come fallback");
ok(aiSource.includes("expertBeginTurnF9T1(player)"), "hook inizio turno Expert");
ok(aiSource.includes("expertCompleteTurnF9T1(player"), "hook completamento turno Expert");

const eventsSource = fs.readFileSync(path.join(ROOT, "src/events.js"), "utf8");
for (const eventName of [
  "AI_EXPERT_TURN_STARTED", "AI_EXPERT_CONTEXT_CREATED", "AI_EXPERT_MODULE_ROUTED",
  "AI_MICROPLAN_SELECTED", "AI_MICROPLAN_STEP", "AI_MICROPLAN_COMPLETED", "AI_MICROPLAN_ABORTED",
  "AI_EXPERT_DECISION", "AI_EXPERT_FALLBACK", "AI_EXPERT_BUDGET_EXHAUSTED", "AI_EXPERT_TURN_COMPLETED"
]) ok(eventsSource.includes(eventName), `evento contratto ${eventName}`);

const telemetrySource = fs.readFileSync(path.join(ROOT, "src/match_telemetry.js"), "utf8");
ok(telemetrySource.includes('MATCH_TELEMETRY_EXPERT_SCHEMA_VERSION = "F9T1-1"'), "estensione telemetrica F9T1-1");
ok(telemetrySource.includes("singleFactionRouter:true"), "telemetria dichiara router singola fazione");
ok(telemetrySource.includes("recursiveSearch:false"), "telemetria dichiara assenza ricerca ricorsiva");
ok(telemetrySource.includes("telemetryRecordExpertDecisionF9T1"), "registro decisioni Expert disponibile");

let now = 100;
const emitted = [];
let directDecisionRecords = 0;
const state = {
  aiMode:"expert",
  modes:{1:"bot",2:"bot"},
  turn:7,
  currentPlayer:1,
  factions:{1:"Nexus",2:"Exordium"},
  playerIds:[1,2],
  energy:{1:8,2:7},
  pressure:{1:1,2:0},
  mapId:"test-map",
  mapDefinition:{id:"test-map", name:"Test Map", movementMultiplier:2},
  cells:[
    {coord:[0,0,0], ps:false, control:null},
    {coord:[1,-1,0], ps:true, control:1},
    {coord:[3,-3,0], ps:true, control:2}
  ],
  units:[
    {uid:"hq1", name:"QG1", side:1, type:"QG", pos:[0,0,0], alive:true},
    {uid:"hq2", name:"QG2", side:2, type:"QG", pos:[6,-6,0], alive:true},
    {uid:"nx-structure", name:"Nodo", side:1, type:"Struttura", pos:[1,-1,0], alive:true},
    {uid:"nx-unit", name:"Fante", side:1, type:"Fanteria", pos:[2,-2,0], alive:true, acted:false},
    {uid:"ex-unit", name:"Cursor", side:2, type:"Veicolo", pos:[2,-2,0], alive:true, acted:true}
  ]
};

const EventTypes = Object.fromEntries([
  "AI_EXPERT_TURN_STARTED", "AI_EXPERT_CONTEXT_CREATED", "AI_EXPERT_MODULE_ROUTED",
  "AI_MICROPLAN_SELECTED", "AI_MICROPLAN_STEP", "AI_MICROPLAN_COMPLETED", "AI_MICROPLAN_ABORTED",
  "AI_EXPERT_DECISION", "AI_EXPERT_FALLBACK", "AI_EXPERT_BUDGET_EXHAUSTED", "AI_EXPERT_TURN_COMPLETED"
].map(name => [name,name]));

const context = vm.createContext({
  console,
  Map,
  Object,
  Array,
  Number,
  String,
  Boolean,
  Math,
  JSON,
  Date,
  state,
  EventTypes,
  performance:{ now:() => (now += 0.25), memory:{ usedJSHeapSize:2048 } },
  emitGameEvent:event => { emitted.push(JSON.parse(JSON.stringify(event))); return event; },
  telemetryRecordExpertDecisionF9T1:() => { directDecisionRecords += 1; },
  getEnemyPlayers:player => [1,2].filter(side => side !== player),
  getHq:side => state.units.find(unit => unit.type === "QG" && unit.side === side),
  combatUnits:side => state.units.filter(unit => unit.alive && unit.side === side && unit.type !== "QG"),
  countControlledPS:side => state.cells.filter(cell => cell.ps && cell.control === side).length,
  getUnitAt:coord => state.units.find(unit => unit.alive && unit.pos.join(",") === coord.join(",")) || null,
  hexDistance:(a,b) => Math.max(Math.abs(a[0]-b[0]), Math.abs(a[1]-b[1]), Math.abs(a[2]-b[2])),
  movementRangeFor:unit => (unit.type === "Veicolo" ? 2 : 1) * state.mapDefinition.movementMultiplier,
  getMapMovementMultiplier:() => state.mapDefinition.movementMultiplier,
  botPressureProfileF9T0:() => ({totalPs:2,requiredPs:1,pressureWin:5,startRound:20,maxRound:30})
});

for (const relative of sourceFiles) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, relative), "utf8"), context, { filename:relative });
}

equal(vm.runInContext("expertAiEnabledF9T1(1)", context), true, "runtime attivo soltanto in modalità Expert");
state.aiMode = "advanced";
equal(vm.runInContext("expertAiEnabledF9T1(1)", context), false, "runtime Expert spento in modalità Advanced");
state.aiMode = "expert";

const common = vm.runInContext("expertBuildCommonContextF9T1(1, {cache:new Map(),cacheHits:0,cacheMisses:0})", context);
equal(common.contractVersion, "F9T1-COMMON-1", "versione contratto comune");
equal(common.adaptiveEnemyProximity.mapMovementMultiplier, 2, "prossimità adattata al movimento mappa");
equal(common.adaptiveEnemyProximity.immediateCount, 1, "minaccia rilevata entro un turno adattivo");
equal(common.hqStructureProtection.protected, true, "struttura adiacente protegge il QG");
equal(common.psStructures.ownedPsWithStructure, 1, "struttura su PS registrata");
ok(["conditional","direct","occupied"].includes(common.hqOccupationRisk.risk), "rischio occupazione QG valutato");

vm.runInContext(`
  var moduleCallsF9T1 = {Nexus:0,Exordium:0,Liberti:0,Agathoi:0,Fabeot:0};
  expertNexusModuleF9T1 = function(ctx){ moduleCallsF9T1.Nexus += 1; return {moduleId:"expert-nexus-f9t1",faction:"Nexus",plan:null,status:"architecture_only",reason:"test"}; };
  expertExordiumModuleF9T1 = function(ctx){ moduleCallsF9T1.Exordium += 1; return {moduleId:"expert-exordium-f9t1",plan:null}; };
  expertLibertiModuleF9T1 = function(ctx){ moduleCallsF9T1.Liberti += 1; return {moduleId:"expert-liberti-f9t1",plan:null}; };
  expertAgathoiModuleF9T1 = function(ctx){ moduleCallsF9T1.Agathoi += 1; return {moduleId:"expert-agathoi-f9t1",plan:null}; };
  expertFabeotModuleF9T1 = function(ctx){ moduleCallsF9T1.Fabeot += 1; return {moduleId:"expert-fabeot-f9t1",plan:null}; };
`, context);
const routed = vm.runInContext('expertRouteFactionF9T1({faction:"Nexus",turn:7})', context);
equal(routed.moduleId, "expert-nexus-f9t1", "router seleziona Nexus");
equal(routed.invokedModules, 1, "router dichiara un solo modulo");
const calls = vm.runInContext("moduleCallsF9T1", context);
equal(calls.Nexus, 1, "modulo Nexus eseguito");
equal(calls.Exordium + calls.Liberti + calls.Agathoi + calls.Fabeot, 0, "le altre quattro fazioni non vengono eseguite");

const validPlan = vm.runInContext(`expertCreateMicroPlanF9T1({
  id:"test-plan", faction:"Nexus", goal:"TEST", orderedSteps:[{id:"s1",action:"hold"}],
  requiredEnergy:2, reservedEnergy:2, fallbackPlan:"advanced_f9t0"
})`, context);
equal(validPlan.validation.ok, true, "micro-piano piatto valido");
const invalidPlan = vm.runInContext(`expertValidateMicroPlanF9T1({
  id:"bad", faction:"Nexus", goal:"BAD", orderedSteps:[{id:"s1", plan:{id:"nested"}}], fallbackPlan:{id:"nested"}
})`, context);
equal(invalidPlan.ok, false, "micro-piano ricorsivo rifiutato");
ok(invalidPlan.errors.includes("fallback_must_be_id"), "fallback annidato vietato");
ok(invalidPlan.errors.includes("recursive_or_invalid_step"), "step ricorsivo vietato");

const session1 = vm.runInContext("expertBeginTurnF9T1(1)", context);
const session2 = vm.runInContext("expertBeginTurnF9T1(1)", context);
equal(session1.sequence, session2.sequence, "contesto costruito una sola volta nello stesso turno");
equal(vm.runInContext("moduleCallsF9T1.Nexus", context), 2, "modulo eseguito una sola volta dal begin oltre al test router");
ok(emitted.some(event => event.type === "AI_EXPERT_CONTEXT_CREATED"), "evento contesto emesso");
ok(emitted.some(event => event.type === "AI_EXPERT_MODULE_ROUTED"), "evento router emesso");
ok(emitted.some(event => event.type === "AI_EXPERT_FALLBACK"), "fallback Advanced esplicito");

const before = vm.runInContext("expertCaptureUnitDecisionF9T1(state.units.find(u => u.uid === 'nx-unit'))", context);
state.units.find(unit => unit.uid === "nx-unit").pos = [3,-3,0];
state.units.find(unit => unit.uid === "nx-unit").acted = true;
const after = vm.runInContext("expertCaptureUnitDecisionF9T1(state.units.find(u => u.uid === 'nx-unit'))", context);
vm.runInContext(`expertRecordDecisionF9T1(1, ${JSON.stringify(before)}, ${JSON.stringify(after)}, {kind:"unit_action"})`, context);
equal(directDecisionRecords, 1, "decisione registrata senza evento per-microazione");
const summary = vm.runInContext("expertCompleteTurnF9T1(1, {guardIterations:1})", context);
equal(summary.fallbackUsed, true, "F9T1 usa il fallback Advanced perché i moduli sono vuoti");
equal(summary.decisionCount, 1, "conteggio decisioni del turno");
equal(vm.runInContext("Object.keys(expertRuntimeStateF9T1.activeByPlayer).length", context), 0, "cache/sessione effimera eliminata a fine turno");
ok(emitted.some(event => event.type === "AI_EXPERT_TURN_COMPLETED"), "evento completamento emesso");
equal(state.expertAiF9T1.schemaVersion, "F9T1-1", "stato Expert persistente minimo versionato");

console.log(`F9T1 Expert AI Architecture & Telemetry smoke: ${checks}/${checks} verifiche superate`);
