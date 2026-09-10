"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const roots = ["src", "data", "tests", "tools"];
const files = [];
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(absolute);
    else if (entry.name.endsWith(".js")) files.push(absolute);
  }
}
for (const relative of roots) visit(path.join(root, relative));
const failures = [];
for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ["--check", file], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) failures.push(`${path.relative(root, file)}: ${result.stderr.trim()}`);
}
console.log(`AR-AC1 JavaScript syntax gate: ${files.length - failures.length}/${files.length} PASS`);
for (const failure of failures) console.error(failure);
if (failures.length) process.exitCode = 1;
