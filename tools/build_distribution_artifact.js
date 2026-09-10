"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { stageRuntime } = require("./stage_runtime");

const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_MANIFEST = path.join(ROOT, "docs", "release", "S2_C7_ARTIFACT_MANIFEST.json");
const EVIDENCE_SUMS = path.join(ROOT, "docs", "release", "S2_C7_SHA256SUMS.txt");
const GENERATED = new Set(["ARTIFACT_MANIFEST.json", "SHA256SUMS.txt"]);

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function walk(directory, prefix = "") {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) output.push(...walk(path.join(directory, entry.name), relative));
    else if (entry.isFile() && !GENERATED.has(relative)) output.push(relative);
  }
  return output;
}

function git(args) {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : null;
}

function readBuildInfo() {
  const source = fs.readFileSync(path.join(ROOT, "src", "build_info.js"), "utf8");
  const marker = "const BUILD_INFO = Object.freeze({";
  const start = source.indexOf(marker);
  const canonicalSource = start >= 0 ? source.slice(start, source.indexOf("});", start) + 3) : "";
  const field = name => {
    const match = canonicalSource.match(new RegExp(`${name}:\\s*"([^"]*)"`));
    return match ? match[1] : "unknown";
  };
  return { version:field("version"), buildName:field("buildName"), buildDate:field("buildDate"), buildChannel:field("buildChannel"), logicBaseline:field("logicBaseline") };
}

function build(outputDir, writeEvidence = false) {
  const output = path.resolve(outputDir);
  const cleanCheckout = (git(["status", "--porcelain"]) || "").length === 0;
  const sourceCommit = git(["rev-parse", "HEAD"]) || "unavailable";
  stageRuntime({ rootDir:ROOT, outputDir:output, profile:"distribution" });
  const files = walk(output).map(relativePath => {
    const body = fs.readFileSync(path.join(output, ...relativePath.split("/")));
    return { path:relativePath, bytes:body.length, sha256:sha256(body) };
  });
  const manifest = {
    schemaVersion:"AR-STARTER-1.0-ARTIFACT-1",
    artifact:"ArenaRubra-Starter-1.0-Web",
    target:"Desktop / Web",
    profile:"distribution",
    sourceCommit,
    sourceState:cleanCheckout ? "clean-checkout" : "working-tree",
    cleanCheckout,
    build:readBuildInfo(),
    contentCatalogHash:JSON.parse(fs.readFileSync(path.join(ROOT, "data", "starter_1_0_manifest.json"), "utf8")).catalogHash,
    files,
    summary:{ files:files.length, bytes:files.reduce((sum, item) => sum + item.bytes, 0) }
  };
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  fs.writeFileSync(path.join(output, "ARTIFACT_MANIFEST.json"), manifestText, "utf8");
  const checksumRows = [...files.map(item => `${item.sha256}  ${item.path}`), `${sha256(Buffer.from(manifestText, "utf8"))}  ARTIFACT_MANIFEST.json`];
  const sumsText = `${checksumRows.join("\n")}\n`;
  fs.writeFileSync(path.join(output, "SHA256SUMS.txt"), sumsText, "utf8");
  if (writeEvidence) {
    fs.mkdirSync(path.dirname(EVIDENCE_MANIFEST), { recursive:true });
    fs.writeFileSync(EVIDENCE_MANIFEST, manifestText, "utf8");
    fs.writeFileSync(EVIDENCE_SUMS, sumsText, "utf8");
  }
  return { output, manifest, checksums:checksumRows.length };
}

function verify(outputDir) {
  const output = path.resolve(outputDir);
  const manifest = JSON.parse(fs.readFileSync(path.join(output, "ARTIFACT_MANIFEST.json"), "utf8"));
  const failures = [];
  for (const item of manifest.files) {
    const absolute = path.join(output, ...item.path.split("/"));
    if (!fs.existsSync(absolute)) failures.push(`missing ${item.path}`);
    else {
      const body = fs.readFileSync(absolute);
      if (body.length !== item.bytes) failures.push(`size ${item.path}`);
      if (sha256(body) !== item.sha256) failures.push(`sha256 ${item.path}`);
    }
  }
  const actualFiles = walk(output);
  const declared = manifest.files.map(item => item.path);
  if (JSON.stringify(actualFiles) !== JSON.stringify(declared)) failures.push("file inventory mismatch");
  const lines = fs.readFileSync(path.join(output, "SHA256SUMS.txt"), "utf8").trim().split(/\r?\n/);
  if (lines.length !== manifest.files.length + 1) failures.push("checksum row count");
  if (failures.length) throw new Error(`Artifact verification failed: ${failures.join(", ")}`);
  return { files:manifest.files.length, bytes:manifest.summary.bytes, cleanCheckout:manifest.cleanCheckout };
}

if (require.main === module) {
  const outputIndex = process.argv.indexOf("--output");
  const output = path.resolve(outputIndex >= 0 ? process.argv[outputIndex + 1] : ".tmp_s2_c7_artifact");
  const result = build(output, process.argv.includes("--evidence"));
  const verified = verify(output);
  console.log(`PASS: Distribution artifact (${verified.files} payload files, ${verified.bytes} bytes, ${result.checksums} checksums, source ${verified.cleanCheckout ? "clean" : "working-tree"})`);
}

module.exports = { build, verify };
