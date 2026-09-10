"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const fixturePath = path.join(root, "tests", "fixtures", "ar_ac1_golden_matches.json");
const browserTestPath = path.join(root, "tests", "ar_ac1_browser_golden_matches_smoke.py");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const browserTest = fs.readFileSync(browserTestPath, "utf8");

assert.strictEqual(fixture.schemaVersion, 1);
assert.strictEqual(fixture.projectionVersion, "AR-AC1-GOLDEN-2");
assert.deepStrictEqual(fixture.matches.map(match => match.id), [
  "GOLDEN-001", "GOLDEN-002", "GOLDEN-003", "GOLDEN-004-3P", "GOLDEN-005-4P"
]);
assert.deepStrictEqual(fixture.matches.map(match => Object.keys(match.factions).length), [2, 2, 2, 3, 4]);
assert.deepStrictEqual(fixture.matches.slice(0, 3).map(match => Object.values(match.factions)), [
  ["Nexus", "Exordium"],
  ["Liberti", "Agathoi"],
  ["Fabeot", "Nexus"]
]);

for (const match of fixture.matches) {
  const sides = Object.keys(match.factions);
  assert.ok(match.seed.startsWith("AR-AC1-GOLDEN-"), `${match.id}: seed missing`);
  assert.ok(match.mapId, `${match.id}: map missing`);
  assert.ok(match.actionTurns >= sides.length * 20, `${match.id}: fewer than twenty complete rounds`);
  assert.deepStrictEqual(Object.keys(match.commanders), sides, `${match.id}: commander sides mismatch`);
  assert.deepStrictEqual(Object.keys(match.decks), sides, `${match.id}: deck sides mismatch`);
  assert.match(match.expectedProjectionHash, /^[a-f0-9]{64}$/, `${match.id}: projection hash not frozen`);
}

for (const stableField of [
  "winner", "round", "energy", "pressure", "controlledPs", "units",
  "deckCount", "discard", "lifecycle", "telemetry", "eventCounts"
]) {
  assert.ok(browserTest.includes(stableField), `stable projection field missing: ${stableField}`);
}
assert.ok(browserTest.includes("range(2)"), "each Golden Match must execute twice");
assert.ok(browserTest.includes('assert runs[0]["hash"] == runs[1]["hash"]'), "repeat determinism assertion missing");
assert.ok(browserTest.includes("expectedProjectionHash"), "frozen snapshot comparison missing");
assert.ok(browserTest.includes("runBotTurn"), "deterministic Advanced AI action driver missing");

console.log(JSON.stringify({
  status:"PASS",
  gate:"AR-AC1 Golden Matches",
  projectionVersion:fixture.projectionVersion,
  matches:fixture.matches.map(match => ({
    id:match.id,
    players:Object.keys(match.factions).length,
    actionTurns:match.actionTurns,
    hash:match.expectedProjectionHash
  }))
}, null, 2));
