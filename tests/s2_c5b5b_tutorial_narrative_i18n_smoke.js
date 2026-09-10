"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ArenaI18nCore = require("../src/i18n/core");

const root = path.resolve(__dirname, "..");
const it = JSON.parse(fs.readFileSync(path.join(root, "locales/content/tutorial_text.it.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(root, "locales/content/tutorial_text.en.json"), "utf8"));
const baseEn = JSON.parse(fs.readFileSync(path.join(root, "locales/en.json"), "utf8"));
const audit = ArenaI18nCore.audit({ it, en });
assert.strictEqual(audit.ok, true, audit.errors.join("\n"));

const source = fs.readFileSync(path.join(root, "data/tutorial_scenarios.js"), "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(`${source}\n;globalThis.scenarios=TUTORIAL_SCENARIOS_F9O6;`, context);
const scenarios = context.scenarios;
assert.strictEqual(Object.keys(scenarios).length, 5);
assert.strictEqual(Object.values(scenarios).reduce((sum, item) => sum + item.steps.length, 0), 116);

const service = ArenaI18nCore.create({ dictionaries:{ it, en }, initialLanguage:"en" });
global.ArenaI18n = { has:key => service.has(key), t:(key, params) => service.t(key, params) };
delete require.cache[require.resolve("../src/i18n/tutorial")];
const adapter = require("../src/i18n/tutorial");
const original = scenarios["lesson-1-exordium"];
const projected = adapter.scenario(original);
assert.notStrictEqual(projected, original);
assert.notStrictEqual(projected.steps, original.steps);
assert.strictEqual(projected.title, "Lesson 1 · Aurex’s Discipline");
assert(projected.steps[0].message.text.startsWith("Welcome to Aurex’s ranks"));
assert.strictEqual(projected.steps.find(step => step.id === "collapse-hand").wrongActionText, "Press Collapse Hand.");
assert.strictEqual(original.title, "Lezione 1 · Disciplina di Aurex");
assert(original.steps[0].message.text.startsWith("Benvenuto nelle schiere"));
assert.strictEqual(en.tutorialVoice["lesson-5-fabeot"]["fabeot-lesson-complete"].text.startsWith("Lesson complete."), true);
assert.strictEqual(Object.keys(baseEn.tutorial.challengeRuntime).length, 5);
assert.strictEqual(baseEn.tutorial.challengeRuntime["challenge-1-elimination"].title, "Field test I · Elimination");
assert.strictEqual(baseEn.tutorial.challengeRuntime["challenge-5-final-exam"].objective, "Win a full match against Nexus Advanced");
assert.strictEqual(baseEn.tutorial.challengeHud.finalExamTitle, "Win the match.");
assert.strictEqual(baseEn.tutorial.challengeEvents.examPassedTitle, "EXAM PASSED");

const runtime = fs.readFileSync(path.join(root, "src/tutorial_runtime.js"), "utf8");
assert(runtime.includes("arenaTutorialScenario(source)"));
assert(runtime.includes("tutorialVoice.${scenarioId}.${step.id}.text"));
assert(runtime.includes("tutorialRuntimeRefreshLanguage"));
assert(runtime.includes("tutorialRuntimeChallengeScenarioById"));
assert(runtime.includes("tutorial.challengeRuntime.${source.id}"));
assert(runtime.includes('tutorialRuntimeI18n("tutorial.challengeHud.finalExam"'));
assert(runtime.includes('tutorialRuntimeI18n("tutorial.challengeEvents.examPassed"'));
const browserRuntime = fs.readFileSync(path.join(root, "src/i18n/runtime.js"), "utf8");
assert(browserRuntime.includes('"content/tutorial_text"'));
console.log("S2-C5b5b tutorial narrative localization smoke: 24/24 OK");
