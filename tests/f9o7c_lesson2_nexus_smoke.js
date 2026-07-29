"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const context = { console };
vm.createContext(context);
vm.runInContext(`${read("data/tutorial_scenarios.js")}\nthis.__audit=tutorialScenarioAuditF9O6();\nthis.__lesson=TUTORIAL_SCENARIOS_F9O6["lesson-2-nexus"];\nthis.__plan=TUTORIAL_LESSON_PLAN_F9O6;`, context);

const audit = JSON.parse(JSON.stringify(context.__audit));
const lesson = JSON.parse(JSON.stringify(context.__lesson));
const plan = JSON.parse(JSON.stringify(context.__plan));
assert.strictEqual(audit.ok, true, audit.errors.join("\n"));
assert.strictEqual(audit.warnings.length, 0, audit.warnings.join("\n"));
assert.strictEqual(audit.lessons, 5);
assert.strictEqual(audit.scenarios, 5);
assert.strictEqual(lesson.id, "lesson-2-nexus");
assert.strictEqual(lesson.lessonId, "lesson-2-nexus");
assert.strictEqual(lesson.narratorFaction, "Nexus");
assert.strictEqual(lesson.setup.factions[1], "Nexus");
assert.strictEqual(lesson.setup.factions[2], "Exordium");
assert.strictEqual(lesson.setup.pacePreset, "competitive");
assert.strictEqual(lesson.setup.gameScaleMode, "tactical");
assert.strictEqual(lesson.setup.starterCardsEnabled, true);
assert.deepStrictEqual(lesson.setup.hand[1], ["UNIT:NXC1F03"]);
assert.deepStrictEqual(lesson.setup.hand[2], []);
assert.deepStrictEqual(lesson.setup.deck[1], []);
assert.deepStrictEqual(lesson.setup.deck[2], []);
assert.ok(lesson.steps.length >= 27, "La Lezione 2 deve coprire l'intero percorso Starter/rete/Avanguardia.");

const ids = new Set(lesson.steps.map(step => step.id));
for (const id of [
  "starter-reserve-overview", "select-security-droid-starter", "deploy-security-droid",
  "starter-remains-available", "move-security-droid", "read-starter-structure",
  "build-forward-structure", "deployment-network-online", "read-starter-vehicle",
  "deploy-quad-from-network", "ordinary-vehicle-exhausted", "quad-captures-center",
  "ordinary-route-complete", "prepare-vanguard-comparison", "select-vanguard-card",
  "deploy-vanguard-from-network", "vanguard-captures-center", "nexus-lesson-complete"
]) assert.ok(ids.has(id), `Passo mancante: ${id}`);

const events = new Set(lesson.steps.filter(step => step.completeOn && step.completeOn.kind === "event").map(step => step.completeOn.event));
for (const eventName of ["UNIT_SPAWNED", "UNIT_BUILT", "UNIT_MOVED", "TURN_ENDED", "PS_CONTROL_CHANGED"])
  assert.ok(events.has(eventName), `Evento didattico mancante: ${eventName}`);
assert.ok(lesson.steps.filter(step => step.checkpoint === true).length >= 2, "Servono almeno due checkpoint didattici.");
assert.ok(lesson.steps.some(step => (step.onEnter || []).some(command => command.action === "pass_turn" && command.side === 2)));
assert.ok(lesson.steps.some(step => (step.onEnter || []).some(command => command.action === "relocate_unit" && command.blueprintId === "NX3B01")));

for (const step of lesson.steps.filter(step => step.mode === "locked")) {
  assert.ok(step.uiState && ["open", "collapsed"].includes(step.uiState.hand), `Contratto Mano assente: ${step.id}`);
  assert.ok(step.spotlight && step.spotlight.target, `Target assente: ${step.id}`);
}
const forbidden = /\b(build|versione|update|aggiornamento|sviluppo|debug|placeholder|milestone|runtime|test)\b/i;
for (const step of lesson.steps) assert.ok(!forbidden.test(String(step.message && step.message.text || "")), `Linguaggio estraneo al gameplay: ${step.id}`);

const lessonPlan = plan.find(item => item.id === "lesson-2-nexus");
assert.ok(lessonPlan && lessonPlan.status === "available" && lessonPlan.scenarioId === "lesson-2-nexus");

const units = read("data/units_base.js");
for (const unitId of ["NX2B01", "NX3B01", "NXC1F07", "NXC1F03"])
  assert.ok(units.includes(unitId), `Blueprint tutorial assente: ${unitId}`);

const runtime = read("src/tutorial_runtime.js");
assert.ok(runtime.includes('case "relocate_unit"'));
assert.ok(runtime.includes("data-tutorial-start"));
assert.ok(runtime.includes("data-tutorial-resume"));
assert.ok(runtime.includes("tutorialLessonCardActions"));

const cards = read("data/cards_base.js");
for (const flag of [
  "tutorialLessonTwoNexusF9O7c", "tutorialStarterReserveF9O7c",
  "tutorialDeploymentNetworkF9O7c", "tutorialVanguardComparisonF9O7c",
  "tutorialMultiLessonMenuF9O7c"
]) assert.ok(new RegExp(`${flag}\\s*:\\s*true`).test(cards), `Feature flag mancante: ${flag}`);

const buildInfo = read("src/build_info.js");
assert.ok(buildInfo.includes("C2-STABLE-1-F9O7g-APK-M4c"));
assert.ok(buildInfo.includes('logicBaseline: "C2-STABLE-1-F9O7f-APK-M4c"') || buildInfo.includes('logicBaseline: "C2-STABLE-1-F9O7e-APK-M4c"') || buildInfo.includes('logicBaseline: "C2-STABLE-1-F9O7d-APK-M4c"') || buildInfo.includes('logicBaseline: "C2-STABLE-1-F9O7c-APK-M4c"'));
assert.ok(read("index.html").includes("Nexus per Starter"));
assert.ok(read("css/style.css").includes(".tutorialLessonCardActions"));

console.log(JSON.stringify({
  ok:true,
  steps:lesson.steps.length,
  checkpoints:lesson.steps.filter(step => step.checkpoint).length,
  events:[...events],
  audit
}, null, 2));
