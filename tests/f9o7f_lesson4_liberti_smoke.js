"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const context = { console };
vm.createContext(context);
vm.runInContext(`${read("data/tutorial_scenarios.js")}\nthis.__audit=tutorialScenarioAuditF9O6();\nthis.__lesson=TUTORIAL_SCENARIOS_F9O6["lesson-4-liberti"];\nthis.__plan=TUTORIAL_LESSON_PLAN_F9O6;`, context);

const audit = JSON.parse(JSON.stringify(context.__audit));
const lesson = JSON.parse(JSON.stringify(context.__lesson));
const plan = JSON.parse(JSON.stringify(context.__plan));
assert.strictEqual(audit.ok, true, audit.errors.join("\n"));
assert.strictEqual(audit.warnings.length, 0, audit.warnings.join("\n"));
assert.strictEqual(audit.lessons, 5);
assert.strictEqual(audit.scenarios, 5);
assert.strictEqual(lesson.id, "lesson-4-liberti");
assert.strictEqual(lesson.lessonId, "lesson-4-liberti");
assert.strictEqual(lesson.narratorFaction, "Liberti");
assert.strictEqual(lesson.setup.factions[1], "Liberti");
assert.strictEqual(lesson.setup.factions[2], "Agathoi");
assert.strictEqual(lesson.setup.pacePreset, "competitive");
assert.strictEqual(lesson.setup.gameScaleMode, "tactical");
assert.strictEqual(lesson.setup.starterCardsEnabled, false);
assert.deepStrictEqual(lesson.setup.hand[1], ["TACTIC:LBTAC08", "TACTIC:LBTAC14", "TACTIC:LBTAC05", "TACTIC:LBTAC09"]);
assert.deepStrictEqual(lesson.setup.hand[2], []);
assert.deepStrictEqual(lesson.setup.deck[1], []);
assert.deepStrictEqual(lesson.setup.deck[2], []);
assert.ok(lesson.steps.length >= 14, "La Lezione 4 deve coprire lettura Mano, due scelte, Sanguinamento, assalto coordinato e conquista.");

const ids = new Set(lesson.steps.map(step => step.id));
for (const id of [
  "inspect-liberti-hand", "choose-sanguis-card", "apply-sanguis-mark", "superiority-attack",
  "bleed-prepared", "end-turn-for-bleed", "bleed-resolved", "choose-coordinated-card",
  "play-coordinated-attack", "coordinated-pressure-resolved", "select-predone-to-capture",
  "capture-center-ps", "liberti-lesson-complete"
]) assert.ok(ids.has(id), `Passo mancante: ${id}`);

const choiceSteps = lesson.steps.filter(step => step.completeOn && step.completeOn.kind === "action" && step.completeOn.action === "card_selected");
assert.deepStrictEqual(choiceSteps.map(step => step.completeOn.match.cardId), ["TACTIC:LBTAC08", "TACTIC:LBTAC14"]);
assert.ok(choiceSteps.every(step => step.mode === "locked" && step.uiState && step.uiState.hand === "open"));
assert.ok(lesson.steps.filter(step => step.checkpoint === true).length >= 2, "Servono almeno due checkpoint.");
for (const event of ["TACTIC_USED", "UNIT_ATTACKED", "TURN_ENDED", "PS_CONTROL_CHANGED"])
  assert.ok(lesson.steps.some(step => step.completeOn && step.completeOn.kind === "event" && step.completeOn.event === event), `Evento non coperto: ${event}`);
const commands = lesson.steps.flatMap(step => step.onEnter || []).map(command => command.action);
for (const action of ["spawn_unit", "pass_turn"]) assert.ok(commands.includes(action), `Comando non utilizzato: ${action}`);

for (const step of lesson.steps.filter(step => step.mode === "locked")) {
  assert.ok(step.uiState && ["open", "collapsed"].includes(step.uiState.hand), `Contratto Mano assente: ${step.id}`);
  assert.ok(step.spotlight && step.spotlight.target, `Target assente: ${step.id}`);
}
const forbidden = /\b(build|versione|update|aggiornamento|sviluppo|debug|placeholder|milestone|runtime|test)\b/i;
for (const step of lesson.steps) assert.ok(!forbidden.test(String(step.message && step.message.text || "")), `Linguaggio estraneo al gameplay: ${step.id}`);

const lessonPlan = plan.find(item => item.id === "lesson-4-liberti");
assert.ok(lessonPlan && lessonPlan.status === "available" && lessonPlan.scenarioId === "lesson-4-liberti");

const units = read("data/units_base.js");
for (const unitId of ["LX2B01", "LX2B02", "AGC1F04"])
  assert.ok(units.includes(unitId), `Blueprint tutorial assente: ${unitId}`);
const tactics = read("data/tactics_cards_c2.js");
for (const tacticId of ["LBTAC05", "LBTAC08", "LBTAC09", "LBTAC14"])
  assert.ok(tactics.includes(tacticId), `Tattica tutorial assente: ${tacticId}`);

const runtime = read("src/tutorial_runtime.js");
assert.ok(runtime.includes("function tutorialRuntimeGateAction"), "Gate azioni tutorial assente.");
assert.ok(runtime.includes("function tutorialRuntimeActionMatch"), "Matcher azioni tutorial assente.");
const render = read("src/render.js");
assert.ok(render.includes('tutorialRuntimeGateAction("card_selected"'), "La selezione carta non usa il gate tutorial.");
assert.ok(render.includes('tutorialRuntimeNotifyAction("card_selected"'), "La selezione carta non notifica il tutorial.");
const css = read("css/style.css");
assert.ok(/body\.tutorial-runtime-active \.mapHandSelectionPreview\.isVisible\.hoverPreview\s*\{[\s\S]*?z-index:\s*95\s*;/.test(css), "Anteprima hover non elevata sopra lo spotlight.");
assert.ok(/\.tutorialSpotlightRoot[^}]*z-index:\s*94/.test(css), "Z-index spotlight atteso non trovato.");
assert.ok(/\.narrativeOverlayRoot[^}]*z-index:\s*96/.test(css), "Z-index vignetta narrativa atteso non trovato.");

const cards = read("data/cards_base.js");
for (const flag of [
  "tutorialLessonFourLibertiF9O7f", "tutorialCardChoiceGateF9O7f",
  "tutorialHoverPreviewAboveSpotlightF9O7f", "tutorialBleedSuperiorityCoordinationF9O7f"
]) assert.ok(new RegExp(`${flag}\\s*:\\s*true`).test(cards), `Feature flag mancante: ${flag}`);

const buildInfo = read("src/build_info.js");
assert.ok(buildInfo.includes("C2-STABLE-1-F9O7g-APK-M4c"));
assert.ok(buildInfo.includes('logicBaseline: "C2-STABLE-1-F9O7f-APK-M4c"') || buildInfo.includes('logicBaseline: "C2-STABLE-1-F9O7e-APK-M4c"'));

console.log(JSON.stringify({
  ok:true,
  steps:lesson.steps.length,
  checkpoints:lesson.steps.filter(step => step.checkpoint).length,
  choices:choiceSteps.map(step => step.completeOn.match.cardId),
  audit
}, null, 2));
