"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const SUPPLEMENTAL_ARCHIVE_PATHS = new Set([
  "assets/maps/backgrounds/battlefield.webp"
]);

function safeRelative(value) {
  const normalized = String(value || "").replaceAll("\\", "/");
  return normalized && !path.isAbsolute(normalized) && !normalized.startsWith("../") && !normalized.includes("/../");
}

function validateRequiredAssets(rootDir, options = {}) {
  const root = path.resolve(rootDir);
  const manifestPath = path.join(root, "data", "required_assets.json");
  const starterPath = path.join(root, "data", "starter_1_0_manifest.json");
  const failures = [];
  if (!fs.existsSync(manifestPath)) return { ok: false, checked: 0, failures: ["missing data/required_assets.json"] };
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.schemaVersion !== "AR-AC1-REQUIRED-ASSETS-1") failures.push("invalid required asset schema");
  const required = Array.isArray(manifest.required) ? manifest.required : [];
  const groups = ["required", "optional", "devOnly", "legacy", "unused"];
  const allItems = groups.flatMap(group => (Array.isArray(manifest[group]) ? manifest[group].map(item => ({ ...item, classification:group })) : []));
  const declared = new Set(required.map((item) => item.path));
  const inventoryPaths = new Set();
  for (const item of allItems) {
    if (inventoryPaths.has(item.path)) failures.push(`duplicate asset classification: ${item.path}`);
    inventoryPaths.add(item.path);
  }
  const filesystemAssets = [];
  const assetRoot = path.join(root, "assets");
  function walk(directory) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes:true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else {
        const assetPath = path.relative(root, absolute).split(path.sep).join("/");
        if (!SUPPLEMENTAL_ARCHIVE_PATHS.has(assetPath)) filesystemAssets.push(assetPath);
      }
    }
  }
  walk(assetRoot);
  for (const assetPath of filesystemAssets) if (!inventoryPaths.has(assetPath)) failures.push(`unclassified asset: ${assetPath}`);
  for (const item of allItems) {
    if (!filesystemAssets.includes(item.path) && (!options.allowExcludedNonRequired || item.classification === "required")) {
      failures.push(`classified asset missing from tree: ${item.path}`);
    }
  }
  for (const item of allItems) {
    if (!safeRelative(item.path)) {
      failures.push(`unsafe asset path: ${item.path}`);
      continue;
    }
    const absolute = path.resolve(root, item.path);
    if (path.relative(root, absolute).startsWith("..") || !fs.existsSync(absolute)) {
      if (options.allowExcludedNonRequired && item.classification !== "required") continue;
      failures.push(`missing required asset: ${item.path}`);
      continue;
    }
    const bytes = fs.statSync(absolute).size;
    const hash = crypto.createHash("sha256").update(fs.readFileSync(absolute)).digest("hex");
    if (bytes !== item.bytes) failures.push(`size mismatch: ${item.path}`);
    if (hash !== item.sha256) failures.push(`hash mismatch: ${item.path}`);
  }
  if (fs.existsSync(starterPath)) {
    const starter = JSON.parse(fs.readFileSync(starterPath, "utf8"));
    for (const asset of starter.assetReferences || []) {
      if (asset.decision === "KEEP" && !declared.has(asset.path)) failures.push(`undeclared KEEP asset: ${asset.path}`);
    }
  }
  return { ok: failures.length === 0, checked: required.length, classified:allItems.length, failures };
}

if (require.main === module) {
  const rootArg = process.argv.indexOf("--root");
  const root = rootArg >= 0 ? process.argv[rootArg + 1] : path.resolve(__dirname, "..");
  const result = validateRequiredAssets(root);
  console.log(`S2-C6 required assets: ${result.ok ? "PASS" : "FAIL"} (${result.checked} required; ${result.classified || 0} classified)`);
  for (const failure of result.failures) console.error(`- ${failure}`);
  process.exitCode = result.ok ? 0 : 1;
}

module.exports = { validateRequiredAssets };
