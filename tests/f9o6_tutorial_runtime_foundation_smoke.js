"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
let checks = 0;
function ok(condition, message) {
  checks += 1;
  if (!condition) throw new Error(message);
}
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), "utf8"); }

const dataSource = read("data/tutorial_scenarios.js");
const context = { console };
vm.createContext(context);
vm.runInContext(`${dataSource}\nthis.__audit = tutorialScenarioAuditF9O6();\nthis.__plan = TUTORIAL_LESSON_PLAN_F9O6;\nthis.__demo = TUTORIAL_SCENARIOS_F9O6[\"lesson-1-exordium\"];`, context);

ok(context.__audit.ok === true, `Audit tutorial non valido: ${(context.__audit.errors || []).join("; ")}`);
ok(context.__audit.lessons === 5, "Il piano deve contenere cinque lezioni.");
ok(context.__audit.portraitSets === 5, "Servono cinque set narratore.");
ok(context.__demo.setup.pacePreset === "competitive" && context.__demo.setup.gameScaleMode === "tactical", "Default Rapida/Tattica non rispettato.");
ok(context.__demo.setup.starterCardsEnabled === false, "La lezione deve mostrare soltanto le due carte iniziali richieste.");
ok(context.__demo.setup.hand[1].length === 2, "La mano Exordium della lezione deve avere due carte.");
ok(context.__demo.steps.some(step => step.mode === "locked"), "La lezione deve coprire input vincolato.");
ok(runtimeSupportsGuided(context.__demo), "Il runtime deve conservare il supporto agli input guidati.");
ok(context.__demo.steps.some(step => step.completeOn && step.completeOn.kind === "event"), "La lezione deve coprire completamento da evento.");
ok(context.__demo.steps.some(step => step.checkpoint === true), "La lezione deve coprire checkpoint.");
ok(!context.__plan.find(item => item.id === "lesson-3-agathoi").summary.includes("Prima Linea"), "Prima Linea non deve essere attribuita alla lezione Agathoi.");

function runtimeSupportsGuided(scenario) { return scenario.steps.some(step => step.mode === "guided") || read("src/tutorial_runtime.js").includes("TUTORIAL_STEP_MODES.GUIDED"); }

const runtime = read("src/tutorial_runtime.js");
for (const api of [
  "tutorialRuntimeStartScenario",
  "tutorialRuntimeHandleGameEvent",
  "tutorialRuntimeShouldPauseBot",
  "tutorialRuntimeNotifyAction",
  "tutorialRuntimeResolveTarget",
  "tutorialRuntimeSaveProgress"
]) ok(runtime.includes(`function ${api}`), `API F9O6 mancante: ${api}.`);
ok(runtime.includes('spec.all === true'), "Il runtime deve supportare più bersagli validi nello stesso passo.");
ok(runtime.includes('state.tutorialMode = true'), "Lo scenario deve marcare la partita come tutorial.");
ok(runtime.includes('state.starterCards[side] = {}'), "Il setup deve poter disattivare gli Starter.");

const events = read("src/events.js");
ok(events.includes('tutorialRuntimeHandleGameEvent'), "Gli eventi del motore non raggiungono il runtime tutorial.");
const ai = read("src/ai.js");
ok(ai.includes('tutorialRuntimeShouldPauseBot'), "La pausa bot tutorial non è integrata.");
const stats = read("src/stats.js");
ok(stats.includes('state.tutorialMode === true'), "Le partite tutorial non sono escluse dalle statistiche.");
const render = read("src/render.js");
ok(render.includes('unit.type !== "QG"'), "La pseudo-unità QG non è esclusa dal renderer token.");
const cards = read("data/cards_base.js");
for (const flag of [
  "hqObjectiveTokenSuppressionF9O5b",
  "dataDrivenTutorialRuntimeF9O6",
  "semanticTutorialSpotlightF9O6",
  "tutorialNarrativePortraitsF9O6",
  "tutorialEventCompletionF9O6",
  "tutorialCheckpointStorageF9O6",
  "tutorialBotPauseF9O6",
  "tutorialStatsExclusionF9O6"
]) ok(new RegExp(`${flag}\\s*:\\s*true`).test(cards), `Feature flag F9O6 mancante: ${flag}.`);

console.log(JSON.stringify({ ok:true, checks, audit:context.__audit }, null, 2));
