"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "data", "tutorial_scenarios.js"), "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(`${source}\n;globalThis.__tutorialScenarios = TUTORIAL_SCENARIOS_F9O6;`, context);

const fieldCounts = {};
const rows = [];
function visit(value, segments=[]) {
  if (!value || typeof value !== "object") return;
  Object.entries(value).forEach(([key, child]) => {
    const next = [...segments, key];
    if (typeof child === "string") {
      fieldCounts[key] = (fieldCounts[key] || 0) + 1;
      rows.push({ path:next.join("."), field:key, value:child });
    } else visit(child, next);
  });
}
visit(context.__tutorialScenarios);
console.log(JSON.stringify({ fieldCounts, rows }, null, 2));
