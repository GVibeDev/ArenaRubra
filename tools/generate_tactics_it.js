"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = {};
vm.createContext(context);
["data/tactics_base.js", "data/tactics_cards_c2.js"].forEach(file => {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
});
const starter = vm.runInContext("TACTICS", context);
const deck = vm.runInContext("DECK_TACTICS", context);
const entries = [
  ...starter.map(tactic => [tactic.id, {
    name:tactic.name,
    description:tactic.description,
    effectText:tactic.description
  }]),
  ...deck.map(tactic => [tactic.id, Object.fromEntries([
    ["name", tactic.name],
    ["effectText", tactic.effectText],
    ["notes", tactic.notes]
  ].filter(([, value]) => typeof value === "string" && value.trim()))])
];
const output = { content:{ tactics:Object.fromEntries(entries) } };
const outputPath = path.join(root, "locales/content/tactics.it.json");
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Generated ${path.relative(root, outputPath)} (${entries.length} tactics).`);
