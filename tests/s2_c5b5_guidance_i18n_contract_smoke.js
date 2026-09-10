"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const index = read("index.html");
const runtime = read("src/tutorial_runtime.js");
const sourceCatalog = read("data/tutorial_scenarios.js");
const it = JSON.parse(read("locales/it.json"));
const en = JSON.parse(read("locales/en.json"));

assert(index.includes('data-i18n="tutorial.title"'));
assert(index.includes('data-i18n="tutorial.resetProgress"'));
assert(index.includes('data-i18n-aria-label="tutorial.ariaLabel"'));
assert(runtime.includes('function tutorialRuntimeLocalizedPlanF9C5b5'));
assert(runtime.includes('tutorialRuntimeLocalizedPlanF9C5b5("lessons"'));
assert(runtime.includes('tutorialRuntimeLocalizedPlanF9C5b5("challenges"'));
assert(runtime.includes('tutorialRuntimeI18n("tutorial.gateLocked"'));
assert(runtime.includes('tutorialRuntimeI18n("tutorial.challengeFailedDetail"'));
assert(runtime.includes('tutorialRuntimeI18n("tutorial.lessonCompleted"'));

const lessonIds = ["lesson-1-exordium", "lesson-2-nexus", "lesson-3-agathoi", "lesson-4-liberti", "lesson-5-fabeot"];
const challengeIds = ["challenge-1-elimination", "challenge-2-hold-ps", "challenge-3-hq-breach", "challenge-4-pressure", "challenge-5-final-exam"];
for (const id of lessonIds) {
  assert(it.tutorial.lessons[id]);
  assert(en.tutorial.lessons[id]);
  assert.notStrictEqual(en.tutorial.lessons[id].title, it.tutorial.lessons[id].title);
}
for (const id of challengeIds) {
  assert(it.tutorial.challenges[id]);
  assert(en.tutorial.challenges[id]);
  assert(en.tutorial.challenges[id].objective.length > 0);
}
assert.strictEqual(en.tutorial.challenges["challenge-5-final-exam"].title, "Final exam");
assert(sourceCatalog.includes('title:"Esame finale"'));
assert(!sourceCatalog.includes('title:"Final exam"'));

console.log("S2-C5b5 tutorial/challenge guidance i18n contract smoke: 42/42 OK");
