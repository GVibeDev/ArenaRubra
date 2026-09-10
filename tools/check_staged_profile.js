"use strict";

const fs = require("fs");
const path = require("path");
const runtimeManifest = require("./runtime_profile_manifest");
const { validateRequiredAssets } = require("./check_required_assets");

function checkStagedProfile(rootDir, profile) {
  const root = path.resolve(rootDir);
  const failures = [];
  const indexPath = path.join(root, "index.html");
  const buildPath = path.join(root, "data", "runtime_profile_build.js");
  if (!fs.existsSync(indexPath)) failures.push("missing index.html");
  if (!fs.existsSync(buildPath)) failures.push("missing runtime profile build marker");
  if (fs.existsSync(buildPath) && !fs.readFileSync(buildPath, "utf8").includes(`"${profile}"`)) failures.push(`build marker is not ${profile}`);
  for (const modulePath of runtimeManifest.devOnly) {
    const exists = fs.existsSync(path.join(root, modulePath));
    if (profile === "distribution" && exists) failures.push(`DEV module shipped: ${modulePath}`);
    if (profile === "dev" && !exists) failures.push(`DEV module missing: ${modulePath}`);
  }
  const assets = validateRequiredAssets(root, { allowExcludedNonRequired:profile === "distribution" });
  failures.push(...assets.failures);
  return { ok: failures.length === 0, profile, devModules: runtimeManifest.devOnly.length, requiredAssets: assets.checked, failures };
}

if (require.main === module) {
  const profileIndex = process.argv.indexOf("--profile");
  const rootIndex = process.argv.indexOf("--root");
  const profile = profileIndex >= 0 ? process.argv[profileIndex + 1] : "distribution";
  const root = rootIndex >= 0 ? process.argv[rootIndex + 1] : `_site_${profile}`;
  if (!["dev", "distribution"].includes(profile)) throw new Error(`Invalid profile: ${profile}`);
  const result = checkStagedProfile(root, profile);
  console.log(`AR-AC1 staged ${profile}: ${result.ok ? "PASS" : "FAIL"}`);
  for (const failure of result.failures) console.error(`- ${failure}`);
  process.exitCode = result.ok ? 0 : 1;
}

module.exports = { checkStagedProfile };
