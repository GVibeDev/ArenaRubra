"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const store = new Map();
const context = vm.createContext({
  console,
  Date,
  Set,
  Map,
  globalThis:null,
  setTimeout:(fn)=>{ fn(); return 1; },
  clearTimeout:()=>{},
  localStorage:{
    getItem:key => store.has(key) ? store.get(key) : null,
    setItem:(key,value) => store.set(key, String(value)),
    removeItem:key => store.delete(key)
  },
  state:null,
  mode:"idle",
  selectedId:null,
  renderAll:()=>{},
  getSelectedUnit:()=>{
    if (!context.state || !Array.isArray(context.state.units) || !context.selectedId) return null;
    return context.state.units.find(unit=>unit && unit.uid===context.selectedId) || null;
  }
});
context.globalThis = context;

function load(rel) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), context, { filename:rel });
}
load("src/tutorial_runtime.js");
const ev = expr => vm.runInContext(expr, context);

// Selector drift registry: historical selectors must resolve to semantic keys.
const selectorChecks = {
  '#mapHandOverlay .mapHandCollapseBtn':'hand_collapse',
  '#mapActionDock .mapLeftHandBtn':'hand_show',
  '.mapLeftEndTurnBtn':'end_turn',
  '#selectedUnitPrimaryAbilitySlot [data-unit-action="ability"]':'ability_toggle',
  '#mapHandOverlay .mapHandOverlayCards':'hand_cards',
  '#p2Score':'opponent_score'
};
for (const [selector, expected] of Object.entries(selectorChecks)) {
  const actual = ev(`tutorialRuntimeSemanticKeyForSelectorF9V3b(${JSON.stringify(selector)})`);
  if (actual !== expected) throw new Error(`Selector semantic mismatch ${selector}: ${actual} != ${expected}`);
}

context.state = {
  currentPlayer:1,
  units:[
    {uid:"ally", id:"ALLY", side:1, alive:true, pos:[-1,0,1]},
    {uid:"enemy", id:"ENEMY", side:2, alive:true, pos:[0,0,0]},
    {uid:"enemy2", id:"ENEMY2", side:2, alive:true, pos:[1,0,-1]}
  ]
};

function setStep(step) {
  context.mode = "idle";
  context.selectedId = null;
  context.__step = step;
  ev("tutorialRuntimeState.active=true; tutorialRuntimeState.closing=false; tutorialRuntimeState.preparingStep=false; tutorialRuntimeState.step=__step;");
}
function gate(action, data) {
  context.__action = action; context.__data = data;
  return ev("tutorialRuntimeGateInteraction(__action,__data)");
}

// Unit selection is semantic, not a raw DOM click.
setStep({id:"select-unit",mode:"locked",spotlight:{target:{type:"unit",side:1,blueprintId:"ALLY"}},completeOn:{kind:"click"}});
let result = gate("unit_click", {uid:"ally",side:1,blueprintId:"ALLY",coord:[-1,0,1],player:1,quiet:true});
if (!result.allowed || result.semanticAction !== "unit_select" || result.expected.action !== "unit_select") throw new Error(`Unit select semantic gate failed: ${JSON.stringify(result)}`);

// Attack classification must win over the auto-primed move mode after selecting a unit.
context.selectedId = "ally";
context.mode = "move";
context.__step = {id:"attack",mode:"locked",spotlight:{target:{type:"unit",side:2,blueprintId:"ENEMY"}},completeOn:{kind:"event",event:"UNIT_ATTACKED"}};
ev("tutorialRuntimeState.step=__step");
result = gate("unit_click", {uid:"enemy",side:2,blueprintId:"ENEMY",coord:[0,0,0],player:1,quiet:true});
if (!result.allowed || result.semanticAction !== "attack" || result.expected.action !== "attack") throw new Error(`Attack semantic gate failed: ${JSON.stringify(result)}`);
let wrong = gate("unit_click", {uid:"enemy2",side:2,blueprintId:"ENEMY2",coord:[1,0,-1],player:1,quiet:true});
if (wrong.allowed) throw new Error(`Wrong attack target was accepted: ${JSON.stringify(wrong)}`);

// Hex actions are classified by the actual runtime mode before mutation.
for (const [runtimeMode, semantic] of [["move","move"],["spawn","deploy"],["build","build"]]) {
  context.mode = runtimeMode;
  context.selectedId = runtimeMode === "move" ? "ally" : null;
  context.__step = {id:`${semantic}-step`,mode:"locked",spotlight:{target:{type:"hex",coord:[2,0,-2]}},completeOn:{kind:"event",event:"TEST"}};
  ev("tutorialRuntimeState.step=__step");
  result = gate("cell_click", {coord:[2,0,-2],player:1,quiet:true});
  if (!result.allowed || result.semanticAction !== semantic || result.expected.action !== semantic) throw new Error(`${semantic} semantic gate failed: ${JSON.stringify(result)}`);
  wrong = gate("cell_click", {coord:[3,0,-3],player:1,quiet:true});
  if (wrong.allowed) throw new Error(`${semantic} wrong coord was accepted`);
}

// Ability and tactic targeting are distinguished even when both click a unit token.
for (const [runtimeMode, semantic] of [["ability","ability_target"],["tactic","tactic_target"]]) {
  context.mode = runtimeMode;
  context.__step = {id:`${semantic}-step`,mode:"locked",spotlight:{target:{type:"unit",side:2,blueprintId:"ENEMY"}},completeOn:{kind:"event",event:"TEST"}};
  ev("tutorialRuntimeState.step=__step");
  result = gate("unit_click", {uid:"enemy",side:2,blueprintId:"ENEMY",coord:[0,0,0],player:1,quiet:true});
  if (!result.allowed || result.semanticAction !== semantic || result.expected.action !== semantic) throw new Error(`${semantic} semantic gate failed: ${JSON.stringify(result)}`);
}

// UI actions remain stable regardless of raw selector changes.
context.mode = "idle";
context.__step = {id:"end-turn",mode:"locked",spotlight:{target:{type:"selector",selector:".mapLeftEndTurnBtn"}},completeOn:{kind:"event",event:"TURN_ENDED",match:{player:1}}};
ev("tutorialRuntimeState.step=__step");
result = gate("end_turn", {player:1,source:"runtime",quiet:true});
if (!result.allowed || result.expected.action !== "end_turn") throw new Error(`End turn semantic gate failed: ${JSON.stringify(result)}`);

context.__step = {id:"ability-toggle",mode:"locked",spotlight:{target:{type:"selector",selector:'#selectedUnitPrimaryAbilitySlot [data-unit-action="ability"]'}},completeOn:{kind:"click"}};
ev("tutorialRuntimeState.step=__step");
result = gate("ability_toggle", {player:1,side:1,uid:"ally",blueprintId:"ALLY",quiet:true});
if (!result.allowed || result.expected.action !== "ability_toggle") throw new Error(`Ability toggle semantic gate failed: ${JSON.stringify(result)}`);

// Pre-mutation guard: a rejected action never enters the wrapped core function.
context.__mutations = 0;
context.handleCellClick = function(coord) {
  // Simulates the existing core's own legacy gate. F9V3b must bypass this second
  // check only after the semantic pre-gate has already accepted the action.
  const inner = ev(`tutorialRuntimeGateInteraction("cell_click", {coord:${JSON.stringify([2,0,-2])}, player:1, quiet:true})`);
  if (inner && inner.handled && inner.allowed === false) return false;
  context.__mutations += 1;
  return true;
};
for (const name of ["endTurn","beginStarterCardPurchase","beginHandCardPlay","toggleAbilityMode","toggleBuildMode","passUnit"]) {
  context[name] = function(){ context.__mutations += 1000; return true; };
}
context.mode = "move";
context.selectedId = "ally";
context.__step = {id:"guarded-move",mode:"locked",spotlight:{target:{type:"hex",coord:[2,0,-2]}},completeOn:{kind:"event",event:"UNIT_MOVED"}};
ev("tutorialRuntimeState.step=__step; tutorialRuntimeInstallActionContractF9V3b();");
let callResult = ev("handleCellClick([9,0,-9])");
if (callResult !== false || context.__mutations !== 0) throw new Error(`Rejected action mutated core state: result=${callResult}, mutations=${context.__mutations}`);
callResult = ev("handleCellClick([2,0,-2])");
if (callResult !== true || context.__mutations !== 1) throw new Error(`Accepted action did not execute exactly once: result=${callResult}, mutations=${context.__mutations}`);

const diagnostics = ev("tutorialRuntimeActionContractDiagnosticsF9V3b()");
for (const name of diagnostics.guardedEntrypoints) if (!diagnostics.wrapped.includes(name)) throw new Error(`Entrypoint not wrapped: ${name}`);
if (diagnostics.schemaVersion !== "F9V3b-1") throw new Error(`Action contract schema invalid: ${diagnostics.schemaVersion}`);

console.log(JSON.stringify({
  ok:true,
  feature:"Tutorial Runtime Hardening / Action Contract Closure",
  semanticActions:["unit_select","attack","move","deploy","build","ability_target","tactic_target","end_turn","ability_toggle"],
  selectorFallbacks:Object.keys(selectorChecks).length,
  guardedEntrypoints:diagnostics.guardedEntrypoints,
  rejectedMutationCount:0,
  acceptedMutationCount:1,
  schema:diagnostics.schemaVersion
}, null, 2));
