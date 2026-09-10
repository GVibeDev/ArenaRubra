"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const workflow = fs.readFileSync(path.join(root, ".github", "workflows", "pages.yml"), "utf8");
const requiredBeforeUpload = [
  "node tools/check_js_syntax.js",
  "python tools/check_python_syntax.py",
  "node tools/generate_starter_1_0_manifest.js --check",
  "node tools/check_locales.js",
  "node tools/check_required_assets.js",
  "node tools/run_node_smokes.js",
  "python tools/run_python_smokes.py",
  "node tools/stage_runtime.js --profile dev",
  "node tools/build_distribution_artifact.js --output _site_distribution",
  "node tools/check_staged_profile.js --profile dev",
  "node tools/check_staged_profile.js --profile distribution",
  "python tests/ar_ac1_browser_distribution_profile_smoke.py",
  "node tests/s2_c7_browser_release_matrix_smoke.js",
  "node tests/s2_c7_artifact_final_smoke.js"
];
const uploadAt = workflow.indexOf("actions/upload-pages-artifact");
assert(uploadAt > 0);
for (const command of requiredBeforeUpload) {
  const at = workflow.indexOf(command);
  assert(at >= 0, `missing CI gate: ${command}`);
  assert(at < uploadAt, `gate occurs after upload: ${command}`);
}
assert(workflow.includes("path: _site_distribution"));
assert(!workflow.includes("path: _site\n"));
assert(workflow.includes('npm install --prefix "$RUNNER_TEMP/arena-node-runtime" --no-save --ignore-scripts playwright@1.62.0'));
assert(workflow.includes('NODE_PATH=$RUNNER_TEMP/arena-node-runtime/node_modules'));
assert(workflow.includes('PYTHONDONTWRITEBYTECODE: "1"'));
assert(workflow.includes('- "release/**"'), "release branches do not trigger CI");
assert.strictEqual((workflow.match(/if: github\.ref == 'refs\/heads\/main'/g) || []).length, 3, "Pages configure/upload/deploy must be main-only");
console.log(`AR-AC1 CI gate contract smoke: ${requiredBeforeUpload.length + 8}/${requiredBeforeUpload.length + 8} OK`);
