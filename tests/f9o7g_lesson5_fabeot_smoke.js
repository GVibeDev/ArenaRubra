"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const context = { console };
vm.createContext(context);
vm.runInContext(`${read("data/tutorial_scenarios.js")}
this.__audit=tutorialScenarioAuditF9O6();
this.__lesson=TUTORIAL_SCENARIOS_F9O6["lesson-5-fabeot"];
this.__plan=TUTORIAL_LESSON_PLAN_F9O6;
this.__coords=TUTORIAL_FABEOT_COORDS_F9O7G;`, context);

const audit = JSON.parse(JSON.stringify(context.__audit));
const lesson = JSON.parse(JSON.stringify(context.__lesson));
const plan = JSON.parse(JSON.stringify(context.__plan));
const coords = JSON.parse(JSON.stringify(context.__coords));

assert.strictEqual(audit.ok, true, audit.errors.join("\n"));
assert.strictEqual(audit.warnings.length, 0, audit.warnings.join("\n"));
assert.strictEqual(audit.lessons, 5);
assert.strictEqual(audit.scenarios, 5);
assert.strictEqual(lesson.id, "lesson-5-fabeot");
assert.strictEqual(lesson.lessonId, "lesson-5-fabeot");
assert.strictEqual(lesson.narratorFaction, "Fabeot");
assert.strictEqual(lesson.setup.factions[1], "Fabeot");
assert.strictEqual(lesson.setup.factions[2], "Nexus");
assert.strictEqual(lesson.setup.pacePreset, "competitive");
assert.strictEqual(lesson.setup.gameScaleMode, "tactical");
assert.strictEqual(lesson.setup.starterCardsEnabled, false);
assert.strictEqual(lesson.setup.energy[1], 20);
assert.strictEqual(lesson.setup.energy[2], 5);
assert.deepStrictEqual(lesson.setup.hand[1], [
  "TACTIC:FABTAC07", "TACTIC:FABTAC09", "TACTIC:FABTAC04", "TACTIC:FABTAC03"
]);
assert.deepStrictEqual(lesson.setup.hand[2], ["UNIT:NXC1F03"]);
assert.deepStrictEqual(lesson.setup.deck[1], []);
assert.deepStrictEqual(lesson.setup.deck[2], []);
assert.ok(lesson.steps.length >= 19, "La Lezione 5 deve coprire Marchio, Vulnerabilità, conversione, Mano ed ENE.");

const ids = new Set(lesson.steps.map(step => step.id));
for (const id of [
  "select-fabeot-hierarch", "activate-purple-sentence", "mark-fante-with-vulnerability",
  "vulnerability-contract-ready", "exploit-fabeot-vulnerability", "select-fabeot-citadel",
  "activate-acquisition-clause", "convert-marked-fante", "fabeot-conversion-resolved",
  "inspect-fabeot-contracts", "play-fabeot-embargo", "fabeot-embargo-resolved",
  "play-fabeot-usury", "fabeot-usury-resolved", "fabeot-lesson-complete"
]) assert.ok(ids.has(id), `Passo mancante: ${id}`);

const events = lesson.steps
  .filter(step => step.completeOn && step.completeOn.kind === "event")
  .map(step => ({ id:step.id, event:step.completeOn.event, match:step.completeOn.match || {} }));
for (const event of ["ABILITY_USED", "UNIT_ATTACKED", "UNIT_CONVERTED", "TACTIC_USED"])
  assert.ok(events.some(item => item.event === event), `Evento non coperto: ${event}`);
assert.ok(events.some(item => item.event === "ABILITY_USED" && item.match.abilityKind === "vulnerableMark"));
assert.ok(events.some(item => item.event === "UNIT_CONVERTED" && item.match.oldSide === 2 && item.match.newSide === 1));
for (const tacticId of ["FABTAC07", "FABTAC09"])
  assert.ok(events.some(item => item.event === "TACTIC_USED" && item.match.tacticId === tacticId), `Tattica non coperta: ${tacticId}`);

const checkpoints = lesson.steps.filter(step => step.checkpoint === true);
assert.ok(checkpoints.length >= 4, "Servono checkpoint dopo vulnerabilità, conversione, Mano ed ENE.");
assert.deepStrictEqual(checkpoints.map(step => step.id), [
  "vulnerability-contract-ready",
  "fabeot-conversion-resolved",
  "fabeot-embargo-resolved",
  "fabeot-usury-resolved"
]);

const cardSteps = lesson.steps.filter(step => ["play-fabeot-embargo", "play-fabeot-usury"].includes(step.id));
assert.deepStrictEqual(cardSteps.map(step => step.spotlight.target.cardId), ["TACTIC:FABTAC07", "TACTIC:FABTAC09"]);
assert.ok(cardSteps.every(step => step.mode === "locked" && step.uiState.hand === "open" && step.spotlight.target.type === "card"));

for (const step of lesson.steps.filter(step => step.mode === "locked")) {
  assert.ok(step.uiState && ["open", "collapsed"].includes(step.uiState.hand), `Contratto Mano assente: ${step.id}`);
  assert.ok(step.spotlight && step.spotlight.target, `Target assente: ${step.id}`);
}
const forbidden = /\b(build|versione|update|aggiornamento|sviluppo|debug|placeholder|milestone|runtime|test)\b/i;
for (const step of lesson.steps)
  assert.ok(!forbidden.test(String(step.message && step.message.text || "")), `Linguaggio estraneo al gameplay: ${step.id}`);

const uniqueCoords = new Set(Object.values(coords).map(coord => coord.join(",")));
assert.strictEqual(uniqueCoords.size, Object.keys(coords).length, "Le coordinate tutorial devono essere distinte.");
for (const [name, coord] of Object.entries(coords))
  assert.strictEqual(coord.reduce((sum, value) => sum + value, 0), 0, `Coordinata cubica non valida: ${name}`);

const lessonPlan = plan.find(item => item.id === "lesson-5-fabeot");
assert.ok(lessonPlan && lessonPlan.status === "available" && lessonPlan.scenarioId === "lesson-5-fabeot");

const units = read("data/units_base.js");
for (const unitId of ["FB0B00", "FB1B01", "FBPIV01", "FB4B01", "NXC1F01"])
  assert.ok(units.includes(unitId), `Blueprint tutorial assente: ${unitId}`);
const tactics = read("data/tactics_cards_c2.js");
for (const tacticId of ["FABTAC03", "FABTAC04", "FABTAC07", "FABTAC09"])
  assert.ok(tactics.includes(tacticId), `Tattica tutorial assente: ${tacticId}`);

const abilities = read("src/abilities.js");
assert.ok(abilities.includes('["fabeot_bounty", "fabeot_vulnerable", "logistic_choke"]'));
assert.ok(abilities.includes("function performFabeotConversion"));
const tacticsRuntime = read("src/tactics.js");
assert.ok(tacticsRuntime.includes("function c2c7aBlockRandomEnemyHandCards"));
assert.ok(tacticsRuntime.includes("usury_energy_income_debuff"));
const runtime = read("src/tutorial_runtime.js");
assert.ok(runtime.includes("includeSnapshot:true"), "Salvataggio snapshot checkpoint assente.");
assert.ok(runtime.includes("tutorialRuntimeRestoreGameSnapshot(progress.snapshot)"), "Ripristino snapshot assente.");

const css = read("css/style.css");
assert.ok(/body\.tutorial-runtime-active \.mapHandSelectionPreview\.isVisible\.hoverPreview\s*\{[\s\S]*?z-index:\s*95\s*;/.test(css), "Anteprima hover non elevata sopra lo spotlight.");
assert.ok(/\.tutorialSpotlightRoot[^}]*z-index:\s*94/.test(css), "Z-index spotlight atteso non trovato.");
assert.ok(/\.narrativeOverlayRoot[^}]*z-index:\s*96/.test(css), "Z-index vignetta narrativa atteso non trovato.");

const cards = read("data/cards_base.js");
for (const flag of [
  "tutorialLessonFiveFabeotF9O7g", "tutorialFabeotMarkVulnerabilityF9O7g",
  "tutorialHandEnergyDisruptionF9O7g", "tutorialConversionResumeF9O7g"
]) assert.ok(new RegExp(`${flag}\\s*:\\s*true`).test(cards), `Feature flag mancante: ${flag}`);

const buildInfo = read("src/build_info.js");
assert.ok(buildInfo.includes("C2-STABLE-1-F9O7g-APK-M4c"));
assert.ok(buildInfo.includes('logicBaseline: "C2-STABLE-1-F9O7f-APK-M4c"'));
assert.ok(buildInfo.includes('buildChannel: "lesson-5-fabeot"'));

console.log(JSON.stringify({
  ok:true,
  steps:lesson.steps.length,
  checkpoints:checkpoints.map(step => step.id),
  events,
  audit
}, null, 2));
