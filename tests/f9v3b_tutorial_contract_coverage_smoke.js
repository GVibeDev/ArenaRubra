"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const context = vm.createContext({
  console, Date, Set, Map,
  setTimeout:()=>1, clearTimeout:()=>{},
  state:null, mode:"idle", selectedId:null
});
function load(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), context, {filename:rel}); }
load("data/tutorial_scenarios.js");
load("src/tutorial_runtime.js");
const ev = expr => vm.runInContext(expr, context);

const scenarioIds = ev("Object.keys(TUTORIAL_SCENARIOS_F9O6)");
if (scenarioIds.length !== 5) throw new Error(`Expected 5 tutorial scenarios, got ${scenarioIds.length}`);
const totalSteps = ev("Object.values(TUTORIAL_SCENARIOS_F9O6).reduce((sum,s)=>sum+(s.steps||[]).length,0)");
if (totalSteps !== 116) throw new Error(`Expected frozen 116 tutorial steps, got ${totalSteps}`);
const runtimeAudit = ev("tutorialRuntimeActionContractScenarioAuditF9V3b()");
if (!runtimeAudit.ok || runtimeAudit.scenarios !== 5 || runtimeAudit.totalSteps !== 116) throw new Error(`Runtime contract audit failed: ${JSON.stringify(runtimeAudit)}`);

const coverage = [];
const errors = [];
for (const scenarioId of scenarioIds) {
  const steps = ev(`TUTORIAL_SCENARIOS_F9O6[${JSON.stringify(scenarioId)}].steps`);
  for (let index=0; index<steps.length; index+=1) {
    const step = steps[index];
    if (!step || !["locked","guided"].includes(step.mode)) continue;
    const target = step.spotlight && step.spotlight.target;
    if (!target) {
      errors.push(`${scenarioId}/${step.id}: interactive step without spotlight target`);
      continue;
    }
    let contract = null;
    if (step.completeOn && step.completeOn.kind === "action" && step.completeOn.action) contract = step.completeOn.action;
    else if (target.type === "card") contract = "card_selected";
    else if (target.type === "unit") contract = "unit_context";
    else if (target.type === "hex") contract = "cell_context";
    else if (target.type === "selector") {
      context.__selector = target.selector || "";
      contract = ev("tutorialRuntimeSemanticKeyForSelectorF9V3b(__selector)");
      if (contract === "hand_cards" && step.completeOn && step.completeOn.kind === "action") contract = step.completeOn.action;
    }
    if (!contract) errors.push(`${scenarioId}/${step.id}: no semantic contract for ${JSON.stringify(target)}`);
    coverage.push({scenarioId,stepId:step.id,targetType:target.type,contract});
  }
}
if (errors.length) throw new Error(errors.join("\n"));

const contracts = [...new Set(coverage.map(item=>item.contract))].sort();
for (const required of ["card_selected","unit_context","cell_context","hand_collapse","hand_show","end_turn","ability_toggle"]) {
  if (!contracts.includes(required)) throw new Error(`Coverage missing ${required}: ${contracts.join(", ")}`);
}

console.log(JSON.stringify({
  ok:true,
  scenarios:scenarioIds.length,
  totalSteps,
  interactiveSteps:coverage.length,
  contracts,
  unknownContracts:0,
  selectorDriftUnknown:0
}, null, 2));
