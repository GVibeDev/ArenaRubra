"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "data/units_base.js"), "utf8"), context);
const blueprints = vm.runInContext("BLUEPRINTS", context);

function textFields(unit) {
  const entry = {};
  if (unit.description) entry.description = unit.description;
  if (unit.ability && (unit.ability.name || unit.ability.description)) {
    entry.ability = {};
    if (unit.ability.name) entry.ability.name = unit.ability.name;
    if (unit.ability.description) entry.ability.description = unit.ability.description;
  }
  if (unit.commanderArchetype) entry.commanderArchetype = unit.commanderArchetype;
  if (unit.psBonus && unit.psBonus.description) entry.psBonus = { description:unit.psBonus.description };
  if (unit.deploymentRule && unit.deploymentRule.label) entry.deploymentRule = { label:unit.deploymentRule.label };
  return entry;
}

const output = {
  content: {
    units: Object.fromEntries(blueprints
      .map(unit => [unit.id, textFields(unit)])
      .filter(([, fields]) => Object.keys(fields).length))
  }
};
const outputPath = path.join(root, "locales/content/unit_text.it.json");
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Generated ${path.relative(root, outputPath)} (${Object.keys(output.content.units).length} units).`);
