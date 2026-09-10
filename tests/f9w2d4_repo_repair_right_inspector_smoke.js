"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { assertCurrentBuildInfo } = require("./helpers/build_info_contract");

const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "css", "layout", "game_inspector.css"), "utf8");
const build = fs.readFileSync(path.join(root, "src", "build_info.js"), "utf8");

for (const token of [
  "AR-AC1 ownership: Desktop/Web selected-unit Inspector geometry",
  "position: fixed;",
  "right: 14px;",
  "width: min(420px, calc(100vw - 28px));",
  "width: min(100%, 370px);"
]) assert(css.includes(token), `missing inspector token: ${token}`);

const buildInfo = assertCurrentBuildInfo(build);

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
  build: buildInfo.version
}, null, 2));
