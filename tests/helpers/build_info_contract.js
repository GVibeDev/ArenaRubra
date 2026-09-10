"use strict";

const assert = require("assert");
const vm = require("vm");

const CURRENT_LOGIC_BASELINE = "C2-STABLE-1-F9T2c4-APK-M4c";
const BUILD_VERSION_PATTERN = /^(?:C2-STABLE-1-F9[A-Za-z0-9]+-APK-M4c|1\.0\.0-rc\.\d+)$/;
const BUILD_CHANNEL_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function buildInfoFromSource(source) {
  assert.strictEqual(typeof source, "string", "build_info source must be text");
  const context = { console, document: undefined };
  vm.createContext(context);
  vm.runInContext(`${source}\n;globalThis.__buildInfoContractValue=BUILD_INFO;`, context, {
    filename: "build_info.js",
  });
  return context.__buildInfoContractValue;
}

function assertCurrentBuildInfo(value) {
  const build = typeof value === "string" ? buildInfoFromSource(value) : value;
  assert.ok(build && typeof build === "object", "BUILD_INFO must be an object");
  assert.strictEqual(Object.isFrozen(build), true, "BUILD_INFO must remain immutable");
  assert.strictEqual(build.appName, "Arena Rubra", "unexpected application name");
  assert.ok(String(build.stage || "").trim(), "build stage is required");
  assert.match(String(build.version || ""), BUILD_VERSION_PATTERN, "invalid build version format");
  assert.ok(String(build.buildName || "").trim(), "build name is required");
  assert.match(String(build.buildDate || ""), /^\d{4}-\d{2}-\d{2}$/, "invalid build date format");
  assert.match(String(build.buildChannel || ""), BUILD_CHANNEL_PATTERN, "invalid build channel format");
  assert.strictEqual(build.logicBaseline, CURRENT_LOGIC_BASELINE, "validated logic baseline changed");
  assert.strictEqual(build.productProfileDefault, "dev", "unexpected default product profile");
  assert.strictEqual(build.productProfileSwitchable, true, "product profile must remain switchable");
  assert.ok(String(build.distributionProfileName || "").trim(), "distribution profile name is required");
  assert.ok(String(build.notes || "").trim(), "build notes are required");
  return build;
}

module.exports = {
  CURRENT_LOGIC_BASELINE,
  assertCurrentBuildInfo,
  buildInfoFromSource,
};
