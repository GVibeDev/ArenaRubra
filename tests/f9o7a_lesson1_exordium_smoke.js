"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const context = { console };
vm.createContext(context);
vm.runInContext(`${read("data/tutorial_scenarios.js")}\nthis.__audit=tutorialScenarioAuditF9O6();\nthis.__lesson=TUTORIAL_SCENARIOS_F9O6["lesson-1-exordium"];\nthis.__plan=TUTORIAL_LESSON_PLAN_F9O6;`, context);

const audit = JSON.parse(JSON.stringify(context.__audit));
const lesson = JSON.parse(JSON.stringify(context.__lesson));
const plan = JSON.parse(JSON.stringify(context.__plan));
assert.strictEqual(audit.ok, true, audit.errors.join("\n"));
assert.strictEqual(audit.lessons, 5);
assert.strictEqual(audit.scenarios, 5);
assert.strictEqual(lesson.id, "lesson-1-exordium");
assert.strictEqual(lesson.lessonId, "lesson-1-exordium");
assert.strictEqual(lesson.setup.pacePreset, "competitive");
assert.strictEqual(lesson.setup.gameScaleMode, "tactical");
assert.strictEqual(lesson.setup.starterCardsEnabled, false);
assert.deepStrictEqual(lesson.setup.hand[1], ["UNIT:EXC1F01", "UNIT:EX1B04"]);
assert.strictEqual(lesson.setup.hand[2].length, 0);
assert.ok(lesson.steps.length >= 25, "La lezione deve coprire l'intero percorso concordato.");

const ids = new Set(lesson.steps.map(step => step.id));
for (const id of [
  "read-tribune-card", "collapse-hand", "show-hand", "deploy-tribune",
  "fante-robot-arrives", "explain-defense", "end-first-turn",
  "deploy-legionary", "activate-heavy-blow", "heavy-blow-target",
  "mech-arrival", "read-emp-card", "emp-target-mech",
  "tribune-breaks-mech-defense", "mech-counterattack", "destroy-mech",
  "lesson-complete"
]) assert.ok(ids.has(id), `Passo mancante: ${id}`);

assert.ok(lesson.steps.filter(step => step.checkpoint === true).length >= 2, "Servono almeno due checkpoint didattici.");
assert.ok(lesson.steps.some(step => (step.onEnter || []).some(command => command.action === "spawn_unit" && command.blueprintId === "NXC1F01")));
assert.ok(lesson.steps.some(step => (step.onEnter || []).some(command => command.action === "spawn_unit" && command.blueprintId === "NX3B03")));
assert.ok(lesson.steps.some(step => (step.onEnter || []).some(command => command.action === "grant_card" && command.cardId === "TACTIC:EXTAC03")));
assert.ok(lesson.steps.some(step => (step.onEnter || []).some(command => command.action === "script_attack_and_end_turn")));

const forbidden = /\b(build|versione|update|aggiornamento|sviluppo|debug|placeholder|milestone|runtime|test)\b/i;
for (const step of lesson.steps) {
  assert.ok(!forbidden.test(String(step.message && step.message.text || "")), `Linguaggio estraneo al gameplay nel passo ${step.id}`);
}
assert.ok(!plan.find(item => item.id === "lesson-3-agathoi").summary.includes("Prima Linea"));

const tacticsSource = read("src/tactics.js");
assert.ok(
  tacticsSource.includes('c.effectKind === "damage_and_permanent_att_debuff" || c.effectKind === "damage_and_permanent_attack_debuff"'),
  "Missile EMP deve infliggere i 2 danni dichiarati anche con il nome effectKind esteso."
);

const runtime = read("src/tutorial_runtime.js");
for (const api of [
  "tutorialRuntimeGameSnapshot", "tutorialRuntimeRestoreGameSnapshot",
  "tutorialRuntimeStartScenario", "tutorialRuntimeFinish"
]) assert.ok(runtime.includes(`function ${api}`), `API mancante: ${api}`);
for (const command of ["spawn_unit", "grant_card", "pass_turn", "script_attack_and_end_turn"])
  assert.ok(runtime.includes(`case "${command}"`), `Comando scenario mancante: ${command}`);
assert.ok(runtime.includes('title:"LEZIONE COMPLETATA"'));
assert.ok(!runtime.includes('Scenario tecnico F9O6'));

const cards = read("data/cards_base.js");
for (const flag of [
  "tutorialLessonOneExordiumF9O7a", "tutorialScenarioCommandsF9O7a",
  "tutorialCheckpointSnapshotF9O7a", "tutorialPlayerTextGameplayOnlyF9O7a"
]) assert.ok(new RegExp(`${flag}\\s*:\\s*true`).test(cards), `Feature flag mancante: ${flag}`);

const buildInfo = read("src/build_info.js");
assert.ok(buildInfo.includes("C2-STABLE-1-F9O7g-APK-M4c"));
const index = read("index.html");
assert.ok(index.includes("Avvia Lezione 1"));
assert.ok(index.includes("Riprendi Lezione 1"));

console.log(JSON.stringify({ ok:true, steps:lesson.steps.length, checkpoints:lesson.steps.filter(step => step.checkpoint).length, audit }, null, 2));
