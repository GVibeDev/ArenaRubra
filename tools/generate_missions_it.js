"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "data/missions_base.js"), "utf8"), context);
const missions = vm.runInContext("MISSION_DEFINITIONS", context);
const entries = missions.map(mission => {
  const key = mission.missionClass === "desperate" ? "conditions" : "objectives";
  return [mission.id, {
    name:mission.name,
    [key]:Object.fromEntries((mission[key] || []).map(item => [item.id, { text:item.text }])),
    reward:{ text:mission.reward.text }
  }];
});
const output = { content:{
  missionLabels:{ card:{ objectives:"Obiettivi", conditions:"Condizioni", reward:"Ricompensa" } },
  missions:Object.fromEntries(entries)
} };
const outputPath = path.join(root, "locales/content/missions.it.json");
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Generated ${path.relative(root, outputPath)} (${entries.length} missions).`);
