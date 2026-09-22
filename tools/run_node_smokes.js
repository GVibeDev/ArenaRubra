"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const testsDir = path.join(root, "tests");
// This smoke requires a built Distribution artifact and is run explicitly by
// the post-staging CI gate. Keeping it out of the source-tree batch prevents a
// false failure before the artifact exists.
const postStagingOnly = new Set([
  "s2_c7_artifact_final_smoke.js",
  // Supplemental ZIP-only Android candidate tests are intentionally outside
  // the Starter 1.0 Desktop/Web baseline (see AR_P0_BASELINE_RECONCILIATION).
  "f9t2a_android_touch_render_baseline_smoke.js",
  "f9t2a_browser_android_touch_render_smoke.js"
]);
const files = fs.readdirSync(testsDir)
  .filter((name) => name.endsWith("_smoke.js") && !postStagingOnly.has(name))
  .sort();
const failures = [];
const annotationEscape = value => String(value || "")
  .replace(/%/g, "%25")
  .replace(/\r/g, "%0D")
  .replace(/\n/g, "%0A");
for (const file of files) {
  process.stdout.write(`[RUN] ${file}\n`);
  const result = spawnSync(process.execPath, [path.join(testsDir, file)], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    failures.push(file);
    const details = `${result.stdout || ""}${result.stderr || ""}${result.error ? result.error.stack || result.error.message : ""}`;
    process.stderr.write(`\n[FAIL] ${file}\n${details}`);
    if (process.env.GITHUB_ACTIONS === "true") {
      process.stderr.write(`\n::error file=tests/${file},title=Node smoke failed::${annotationEscape(details || `exit ${result.status}`)}\n`);
    }
  } else {
    process.stdout.write(`[PASS] ${file}\n`);
  }
}
console.log(`AR-AC1 Node smoke gate: ${files.length - failures.length}/${files.length} PASS`);
if (failures.length) {
  console.error(`Failures: ${failures.join(", ")}`);
  process.exitCode = 1;
}
