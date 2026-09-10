"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { stageRuntime } = require("../tools/stage_runtime");
const { checkStagedProfile } = require("../tools/check_staged_profile");
const runtimeManifest = require("../tools/runtime_profile_manifest");
const { PUBLIC_RELEASE_FILES, DISTRIBUTION_EXCLUDE_FILES } = require("../tools/stage_runtime");

const root = path.resolve(__dirname, "..");
const tempRoot = path.join(root, ".tmp_ar_ac1_staging_gate");
const devRoot = path.join(tempRoot, "dev");
const distributionRoot = path.join(tempRoot, "distribution");
const sourceAssetInventory = JSON.parse(fs.readFileSync(path.join(root, "data", "required_assets.json"), "utf8"));
try {
  const dev = stageRuntime({ rootDir: root, outputDir: devRoot, profile: "dev" });
  const distribution = stageRuntime({ rootDir: root, outputDir: distributionRoot, profile: "distribution" });
  assert.strictEqual(dev.excluded, 0);
  assert.strictEqual(distribution.excluded, runtimeManifest.devOnly.length);
  assert.strictEqual(checkStagedProfile(devRoot, "dev").ok, true);
  assert.strictEqual(checkStagedProfile(distributionRoot, "distribution").ok, true);
  assert(fs.existsSync(path.join(devRoot, runtimeManifest.devOnly[0])));
  assert(!fs.existsSync(path.join(distributionRoot, runtimeManifest.devOnly[0])));
  assert(fs.existsSync(path.join(devRoot, "locales", "it.json")));
  assert(fs.existsSync(path.join(distributionRoot, "locales", "en.json")));
  assert(fs.existsSync(path.join(distributionRoot, "LICENSE")));
  assert(fs.existsSync(path.join(distributionRoot, "Asset_License")));
  for (const relativePath of PUBLIC_RELEASE_FILES) assert(fs.existsSync(path.join(distributionRoot, relativePath)));
  assert(!fs.existsSync(path.join(distributionRoot, "docs", "release", "STARTER_1_0_DEV_GUIDE.md")));
  assert(!fs.existsSync(path.join(distributionRoot, "docs", "release", "S2_DOC_FREEZE.md")));
  for (const relativePath of DISTRIBUTION_EXCLUDE_FILES) assert(!fs.existsSync(path.join(distributionRoot, relativePath)));
  for (const group of ["devOnly", "legacy", "unused"]) {
    for (const item of sourceAssetInventory[group] || []) assert(!fs.existsSync(path.join(distributionRoot, ...item.path.split("/"))));
  }
  const runtimeSource = fs.readFileSync(path.join(root, "src", "runtime_profile.js"), "utf8");
  for (const modulePath of runtimeManifest.devOnly) assert(runtimeSource.includes(`"${modulePath}"`));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
const excludedAssets = sourceAssetInventory.devOnly.length + sourceAssetInventory.legacy.length + sourceAssetInventory.unused.length;
console.log(`AR-AC1 staging gate smoke: ${13 + runtimeManifest.devOnly.length + PUBLIC_RELEASE_FILES.length + DISTRIBUTION_EXCLUDE_FILES.length + excludedAssets}/${13 + runtimeManifest.devOnly.length + PUBLIC_RELEASE_FILES.length + DISTRIBUTION_EXCLUDE_FILES.length + excludedAssets} OK`);
