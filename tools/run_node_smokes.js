"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const testsDir = path.join(root, "tests");
// This smoke requires a built Distribution artifact and is run explicitly by
// the post-staging CI gate. Keeping it out of the source-tree batch prevents a
// false failure before the artifact exists.
const postStagingOnly = new Set(["s2_c7_artifact_final_smoke.js"]);
const files = fs.readdirSync(testsDir)
  .filter((name) => name.endsWith("_smoke.js") && !postStagingOnly.has(name))
  .sort();
const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, [path.join(testsDir, file)], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    failures.push(file);
    process.stderr.write(`\n[FAIL] ${file}\n${result.stdout || ""}${result.stderr || ""}`);
  }
}
console.log(`AR-AC1 Node smoke gate: ${files.length - failures.length}/${files.length} PASS`);
if (failures.length) {
  console.error(`Failures: ${failures.join(", ")}`);
  process.exitCode = 1;
}
