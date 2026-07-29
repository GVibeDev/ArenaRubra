"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const context = { console };
vm.createContext(context);
vm.runInContext(`${read("data/tutorial_scenarios.js")}\nthis.__audit=tutorialScenarioAuditF9O6();\nthis.__lesson=TUTORIAL_SCENARIOS_F9O6["lesson-3-agathoi"];\nthis.__plan=TUTORIAL_LESSON_PLAN_F9O6;`, context);

const audit = JSON.parse(JSON.stringify(context.__audit));
const lesson = JSON.parse(JSON.stringify(context.__lesson));
const plan = JSON.parse(JSON.stringify(context.__plan));
assert.strictEqual(audit.ok, true, audit.errors.join("\n"));
assert.strictEqual(audit.warnings.length, 0, audit.warnings.join("\n"));
assert.strictEqual(audit.lessons, 5);
assert.strictEqual(audit.scenarios, 5);
assert.strictEqual(lesson.id, "lesson-3-agathoi");
assert.strictEqual(lesson.lessonId, "lesson-3-agathoi");
assert.strictEqual(lesson.narratorFaction, "Agathoi");
assert.strictEqual(lesson.setup.factions[1], "Agathoi");
assert.strictEqual(lesson.setup.factions[2], "Exordium");
assert.strictEqual(lesson.setup.pacePreset, "competitive");
assert.strictEqual(lesson.setup.gameScaleMode, "tactical");
assert.strictEqual(lesson.setup.starterCardsEnabled, false);
assert.deepStrictEqual(lesson.setup.hand[1], ["TACTIC:AGTAC07", "TACTIC:AGTAC05", "TACTIC:AGTAC04", "TACTIC:AGTAC08"]);
assert.deepStrictEqual(lesson.setup.hand[2], []);
assert.deepStrictEqual(lesson.setup.deck[1], []);
assert.deepStrictEqual(lesson.setup.deck[2], []);
assert.ok(lesson.steps.length >= 23, "La Lezione 3 deve coprire scelta, tre difese e tre ondate.");

const ids = new Set(lesson.steps.map(step => step.id));
for (const id of [
  "choose-first-defense", "select-thorns-tactic", "apply-thorns-to-oplite", "wave-one-resolved",
  "choose-counterattack", "select-counterattack-tactic", "apply-counterattack-to-oplite", "wave-two-resolved",
  "choose-fortification", "select-fortification-tactic", "fortify-healing-grove", "wave-three-survived",
  "destroy-third-wave", "agathoi-lesson-complete"
]) assert.ok(ids.has(id), `Passo mancante: ${id}`);

const tacticEvents = lesson.steps
  .filter(step => step.completeOn && step.completeOn.event === "TACTIC_USED")
  .map(step => step.completeOn.match && step.completeOn.match.tacticId);
assert.deepStrictEqual(tacticEvents, ["AGTAC07", "AGTAC05", "AGTAC04"]);
assert.ok(lesson.steps.filter(step => step.checkpoint === true).length >= 3, "Servono tre checkpoint, uno per ondata.");
assert.strictEqual(lesson.steps.filter(step => (step.onEnter || []).some(command => command.action === "script_attack_and_end_turn")).length, 3);
assert.ok(lesson.steps.some(step => (step.onEnter || []).some(command => command.blueprintId === "AG1B02")));
assert.ok(lesson.steps.some(step => (step.onEnter || []).some(command => command.blueprintId === "AG4B01")));
for (const unitId of ["EX1B01", "EX1B04", "EX2B04"])
  assert.ok(lesson.steps.some(step => (step.onEnter || []).some(command => command.blueprintId === unitId)), `Ondata mancante: ${unitId}`);

for (const step of lesson.steps.filter(step => step.mode === "locked")) {
  assert.ok(step.uiState && ["open", "collapsed"].includes(step.uiState.hand), `Contratto Mano assente: ${step.id}`);
  assert.ok(step.spotlight && step.spotlight.target, `Target assente: ${step.id}`);
}
const forbidden = /\b(build|versione|update|aggiornamento|sviluppo|debug|placeholder|milestone|runtime|test)\b/i;
for (const step of lesson.steps) assert.ok(!forbidden.test(String(step.message && step.message.text || "")), `Linguaggio estraneo al gameplay: ${step.id}`);

const lessonPlan = plan.find(item => item.id === "lesson-3-agathoi");
assert.ok(lessonPlan && lessonPlan.status === "available" && lessonPlan.scenarioId === "lesson-3-agathoi");

const units = read("data/units_base.js");
for (const unitId of ["AG1B02", "AG4B01", "EX1B01", "EX1B04", "EX2B04"])
  assert.ok(units.includes(unitId), `Blueprint tutorial assente: ${unitId}`);
const tactics = read("data/tactics_cards_c2.js");
for (const tacticId of ["AGTAC04", "AGTAC05", "AGTAC07", "AGTAC08"])
  assert.ok(tactics.includes(tacticId), `Tattica tutorial assente: ${tacticId}`);

const cards = read("data/cards_base.js");
for (const flag of [
  "tutorialLessonThreeAgathoiF9O7e", "tutorialDefenseChoiceF9O7e",
  "tutorialThornsCounterattackF9O7e", "tutorialFortificationWavesF9O7e"
]) assert.ok(new RegExp(`${flag}\\s*:\\s*true`).test(cards), `Feature flag mancante: ${flag}`);

const buildInfo = read("src/build_info.js");
assert.ok(buildInfo.includes("C2-STABLE-1-F9O7g-APK-M4c"));
assert.ok(buildInfo.includes('logicBaseline: "C2-STABLE-1-F9O7f-APK-M4c"') || buildInfo.includes('logicBaseline: "C2-STABLE-1-F9O7e-APK-M4c"') || buildInfo.includes('logicBaseline: "C2-STABLE-1-F9O7d-APK-M4c"'));

console.log(JSON.stringify({
  ok:true,
  steps:lesson.steps.length,
  checkpoints:lesson.steps.filter(step => step.checkpoint).length,
  tacticEvents,
  audit
}, null, 2));
