"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RELEASE = path.join(ROOT, "docs", "release");
const failures = [];
const warnings = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");

const requiredReports = [
  "docs/architecture/S2_C5A_CONTENT_FREEZE_REPORT.md",
  "docs/architecture/AR_AC1_CLOSURE_REPORT.md",
  "docs/localization/S2_C5B_FULL_ENGLISH_LOCALIZATION.md",
  "docs/presentation/S2_C6_VISUAL_ASSET_PRESENTATION_GATE.md",
  "docs/release/S2_DOC_FREEZE.md",
  "docs/release/S2_C7_RELEASE_REGRESSION.md"
];

for (const relative of requiredReports) {
  const absolute = path.join(ROOT, relative);
  expect(fs.existsSync(absolute), `missing milestone report: ${relative}`);
}

for (const relative of requiredReports.slice(0, -1)) {
  const absolute = path.join(ROOT, relative);
  if (fs.existsSync(absolute)) {
    expect(/(?:Status|Result):\s*\*\*PASS(?:\*\*|\s|\s*—)/i.test(fs.readFileSync(absolute, "utf8")), `milestone is not PASS: ${relative}`);
  }
}

const c7Path = path.join(RELEASE, "S2_C7_RELEASE_REGRESSION.md");
if (fs.existsSync(c7Path)) {
  expect(/Status:\s*\*\*PASS\*\*/i.test(fs.readFileSync(c7Path, "utf8")), "S2-C7 release regression is not PASS");
}

const artifactPath = path.join(RELEASE, "S2_C7_ARTIFACT_MANIFEST.json");
expect(fs.existsSync(artifactPath), "artifact manifest evidence missing");
if (fs.existsSync(artifactPath)) {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  expect(artifact.schemaVersion === "AR-STARTER-1.0-ARTIFACT-1", "artifact schema mismatch");
  expect(artifact.profile === "distribution", "artifact is not a Distribution profile");
  expect(
    artifact.cleanCheckout === true && artifact.sourceState === "clean-checkout",
    `artifact provenance is ${artifact.sourceState || "unknown"}/cleanCheckout=${String(artifact.cleanCheckout)}, expected clean-checkout/true`
  );
  expect(/^[0-9a-f]{40}$/i.test(artifact.sourceCommit || ""), "artifact source commit is missing or invalid");
  expect(/^[0-9a-f]{64}$/i.test(artifact.contentCatalogHash || ""), "artifact catalog hash is missing or invalid");
  for (const field of ["version", "buildName", "buildDate", "buildChannel", "logicBaseline"]) {
    expect(typeof artifact.build?.[field] === "string" && artifact.build[field].trim().length > 0, `artifact build.${field} is missing`);
  }
  expect(Array.isArray(artifact.files) && artifact.files.length > 0, "artifact payload inventory is empty");

  const checksumPath = path.join(RELEASE, "S2_C7_SHA256SUMS.txt");
  expect(fs.existsSync(checksumPath), "artifact checksum evidence missing");
  if (fs.existsSync(checksumPath) && Array.isArray(artifact.files)) {
    const rows = fs.readFileSync(checksumPath, "utf8").trim().split(/\r?\n/).filter(Boolean);
    expect(rows.length === artifact.files.length + 1, `checksum row count ${rows.length}, expected ${artifact.files.length + 1}`);
  }

  const contentManifest = JSON.parse(read("data/starter_1_0_manifest.json"));
  expect(artifact.contentCatalogHash === contentManifest.catalogHash, "artifact catalog hash differs from frozen content manifest");
}

const ciEvidencePath = path.join(RELEASE, "S2_CI_EVIDENCE.json");
expect(fs.existsSync(ciEvidencePath), "CI evidence missing: docs/release/S2_CI_EVIDENCE.json");
if (fs.existsSync(ciEvidencePath)) {
  const ci = JSON.parse(fs.readFileSync(ciEvidencePath, "utf8"));
  expect(ci.schemaVersion === "AR-S2-CI-EVIDENCE-1", "CI evidence schema mismatch");
  expect(ci.status === "success", `CI status is ${ci.status || "unknown"}, expected success`);
  expect(/^[0-9a-f]{40}$/i.test(ci.sourceCommit || ""), "CI source commit is missing or invalid");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    expect(ci.sourceCommit === artifact.sourceCommit, "CI and artifact were not produced from the same commit");
  }
}

const artifact = fs.existsSync(artifactPath) ? JSON.parse(fs.readFileSync(artifactPath, "utf8")) : null;
if (artifact && !/^(?:Starter\s*1\.0|S2[-_. ]?RC|1\.0\.0-rc\.\d+)/i.test(artifact.build?.version || "")) {
  warnings.push(`release identity still uses version ${artifact.build?.version || "unknown"}; confirm the S2-RC version label before publication`);
}

if (warnings.length) {
  console.warn(`WARN: S2-RC readiness (${warnings.length} warning${warnings.length === 1 ? "" : "s"})`);
  warnings.forEach(item => console.warn(`- ${item}`));
}
if (failures.length) {
  console.error(`FAIL: S2-RC readiness (${failures.length} blocker${failures.length === 1 ? "" : "s"})`);
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
console.log("PASS: S2-RC readiness (milestones, clean artifact and CI evidence aligned)");
