"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { validateRequiredAssets } = require("../tools/check_required_assets");

const root = path.resolve(__dirname, "..");
const result = validateRequiredAssets(root);
assert.strictEqual(result.ok, true, result.failures.join("\n"));
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data", "required_assets.json"), "utf8"));
assert.strictEqual(result.checked, manifest.required.length);
assert.strictEqual(result.classified, Object.values(manifest.summary).reduce((sum, group) => sum + group.files, 0));

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "arena-ar-ac1-assets-"));
try {
  fs.mkdirSync(path.join(temp, "data"), { recursive: true });
  fs.copyFileSync(path.join(root, "data", "required_assets.json"), path.join(temp, "data", "required_assets.json"));
  const missing = validateRequiredAssets(temp);
  assert.strictEqual(missing.ok, false);
  assert(missing.failures.some((failure) => failure.includes("missing required asset")));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
console.log("S2-C6 required asset and complete classification gate smoke: 5/5 OK");
