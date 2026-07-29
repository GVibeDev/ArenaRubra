"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const context = { console };
vm.createContext(context);
vm.runInContext(`${read("data/tutorial_scenarios.js")}\nthis.__audit=tutorialScenarioAuditF9O6();\nthis.__lesson=TUTORIAL_SCENARIOS_F9O6["lesson-1-exordium"];\nthis.__portraits=TUTORIAL_PORTRAIT_MANIFEST_F9O6;`, context);

const audit = JSON.parse(JSON.stringify(context.__audit));
const lesson = JSON.parse(JSON.stringify(context.__lesson));
const portraits = JSON.parse(JSON.stringify(context.__portraits));
assert.strictEqual(audit.ok, true, audit.errors.join("\n"));
assert.strictEqual(audit.warnings.length, 0, audit.warnings.join("\n"));

const handByStep = Object.fromEntries(lesson.steps.map(step => [step.id, step.uiState && step.uiState.hand]));
assert.strictEqual(handByStep["collapse-hand"], "open");
assert.strictEqual(handByStep["show-hand"], "collapsed");
for (const id of ["read-tribune-card", "select-tribune-card", "select-legionary-card", "read-emp-card", "select-emp-card"])
  assert.strictEqual(handByStep[id], "open", `${id} deve aprire la Mano.`);
for (const id of ["deploy-tribune", "select-legionary-unit", "activate-heavy-blow", "heavy-blow-target", "emp-target-mech", "destroy-mech"])
  assert.strictEqual(handByStep[id], "collapsed", `${id} deve ridurre la Mano.`);

for (const [faction, descriptor] of Object.entries(portraits)) {
  for (const expression of ["neutral", "explain", "approve", "warning", "stern"]) {
    assert.strictEqual(descriptor.frames[expression], `assets/narrative/portraits/${faction}/${expression}.webp`);
  }
}

const runtime = read("src/tutorial_runtime.js");
for (const api of [
  "tutorialRuntimeSchedule", "tutorialRuntimeInvalidateAsync", "tutorialRuntimeNormalizeTransientUi",
  "tutorialRuntimeApplyStepUiState", "tutorialRuntimeAbortForMissingTarget"
]) assert.ok(runtime.includes(`function ${api}`), `API F9O7b mancante: ${api}`);
assert.ok(runtime.includes("sessionToken"));
assert.ok(runtime.includes("stepToken"));
assert.ok(runtime.includes("target-missing"));

const overlay = read("src/event_overlay.js");
for (const api of ["narrativeResolvePortraitCandidates", "narrativeShowPortraitPlaceholder", "narrativeLoadPortrait"])
  assert.ok(overlay.includes(`function ${api}`), `Fallback ritratto mancante: ${api}`);
assert.ok(overlay.includes("dom.image.onerror = () => tryNext()"));

const cards = read("data/cards_base.js");
for (const flag of [
  "tutorialUiStateContractF9O7b", "tutorialResumeSynchronizationF9O7b",
  "tutorialAsyncSessionGuardF9O7b", "tutorialPortraitFallbackF9O7b"
]) assert.ok(new RegExp(`${flag}\\s*:\\s*true`).test(cards), `Feature flag mancante: ${flag}`);

assert.ok(read("src/build_info.js").includes("C2-STABLE-1-F9O7g-APK-M4c"));
console.log(JSON.stringify({ ok:true, steps:lesson.steps.length, portraits:Object.keys(portraits).length, audit }, null, 2));
