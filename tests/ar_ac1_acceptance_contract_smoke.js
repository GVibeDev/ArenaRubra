"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data", "ar_ac1_acceptance_manifest.json"), "utf8"));
assert.strictEqual(manifest.schemaVersion, "AR-AC1-ACCEPTANCE-1");
assert.strictEqual(manifest.criteria.length, 15);
assert.deepStrictEqual(manifest.criteria.map((criterion) => criterion.id), Array.from({ length: 15 }, (_, index) => index + 1));
for (const criterion of manifest.criteria) {
  assert(criterion.evidence.length >= 2, `criterion ${criterion.id} has insufficient evidence`);
  for (const relative of criterion.evidence) assert(fs.existsSync(path.join(root, relative)), `criterion ${criterion.id}: missing ${relative}`);
}

const ui = fs.readFileSync(path.join(root, "src", "ui.js"), "utf8");
assert(!ui.includes("function arenaMatchDataBuildRecordF9W1a"));
assert(!ui.includes("function arenaMatchDataMigrateRecordF9W1a"));
const css = fs.readFileSync(path.join(root, "css", "style.css"), "utf8");
assert(!css.includes("AR-AC1 DESKTOP GAME INSPECTOR GEOMETRY OWNER"));
console.log("AR-AC1 acceptance evidence contract: 21/21 OK");
