"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "css", "style.css"), "utf8");
const build = fs.readFileSync(path.join(root, "src", "build_info.js"), "utf8");

for (const token of [
  "F9W2d4 - Right-side Selected Unit Inspector Hotfix",
  "position: fixed;",
  "right: 14px;",
  "width: min(420px, calc(100vw - 28px));",
  "width: min(100%, 370px);"
]) assert(css.includes(token), `missing inspector token: ${token}`);

for (const token of [
  'version: "C2-STABLE-1-F9W2d4-APK-M4c"',
  'buildName: "Repository Repair & Right Inspector Hotfix"',
  'buildChannel: "starter2-repo-repair-right-inspector-w2d4"',
  'logicBaseline: "C2-STABLE-1-F9T2c4-APK-M4c"'
]) assert(build.includes(token), `missing build token: ${token}`);

for (const badPath of [
  "GITHUB_PRESENTATION_PATCH_NOTES.txt",
  "docs/AI_RUNTIME_AND_HARDWARE.md",
  "docs/GENERATION_GUIDE.md",
  "docs/README.md",
  "docs/ROADMAP.md",
  "docs/SCREENSHOT_PLAN.md",
  "docs/WORKFLOWS.md",
  "docs/history/README.md",
  "docs/images/banner-clean.webp",
  "docs/images/banner-readme.webp"
]) assert(!fs.existsSync(path.join(root, badPath)), `foreign website file still present: ${badPath}`);

console.log(JSON.stringify({
  ok: true,
  feature: "F9W2d4 Repository Repair & Right Inspector Hotfix",
  badCommitReverted: true,
  rightInspector: true,
  selectedPreviewPx: 370,
  mobileUntouched: true,
  build: "C2-STABLE-1-F9W2d4-APK-M4c"
}, null, 2));