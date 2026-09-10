"use strict";

const fs = require("fs");
const path = require("path");
const ArenaI18nCore = require("../src/i18n/core");

const root = path.resolve(__dirname, "..");
const locales = Object.fromEntries(["it", "en"].map(language => {
  const paths = [
    path.join(root, "locales", `${language}.json`),
    path.join(root, "locales", "content", `units.${language}.json`),
    path.join(root, "locales", "content", `unit_text.${language}.json`),
    path.join(root, "locales", "content", `tactics.${language}.json`),
    path.join(root, "locales", "content", `missions.${language}.json`),
    path.join(root, "locales", "content", `decks.${language}.json`)
  ];
  const flattened = Object.assign({}, ...paths.map(file => ArenaI18nCore.flattenDictionary(JSON.parse(fs.readFileSync(file, "utf8")))));
  return [language, flattened];
}));
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/starter_1_0_manifest.json"), "utf8"));
const officialMaps = manifest.catalogs.officialMaps.filter(map => map.decision === "KEEP").map(map => map.id);
const officialUnits = manifest.catalogs.units.filter(unit => unit.decision === "KEEP").map(unit => unit.id);
const vm = require("vm");
const unitContext = {};
vm.createContext(unitContext);
vm.runInContext(fs.readFileSync(path.join(root, "data/units_base.js"), "utf8"), unitContext);
const unitBlueprints = vm.runInContext("BLUEPRINTS", unitContext);
const contentContext = {};
vm.createContext(contentContext);
["data/tactics_base.js", "data/tactics_cards_c2.js", "data/missions_base.js"].forEach(file => {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), contentContext);
});
const starterTactics = vm.runInContext("TACTICS", contentContext);
const deckTactics = vm.runInContext("DECK_TACTICS", contentContext);
const missions = vm.runInContext("MISSION_DEFINITIONS", contentContext);
vm.runInContext(fs.readFileSync(path.join(root, "data/builtin_decks.js"), "utf8"), contentContext);
const builtinDecks = vm.runInContext("BUILTIN_DECKS", contentContext);
const terrainIds = ["free", "obstacle", "difficult", "defensive", "exposed"];
const taxonomy = {
  types: ["Fanteria", "Veicolo", "Struttura", "Comandante"],
  weights: ["Leggera", "Pesante", "Elite", "Pivot", "Base"],
  missionClasses: ["ordinary", "desperate"]
};
const required = [
  ...officialUnits.map(id => `content.units.${id}.name`),
  ...unitBlueprints.flatMap(unit => [
    unit.description && `content.units.${unit.id}.description`,
    unit.ability && unit.ability.name && `content.units.${unit.id}.ability.name`,
    unit.ability && unit.ability.description && `content.units.${unit.id}.ability.description`,
    unit.commanderArchetype && `content.units.${unit.id}.commanderArchetype`,
    unit.psBonus && unit.psBonus.description && `content.units.${unit.id}.psBonus.description`,
    unit.deploymentRule && unit.deploymentRule.label && `content.units.${unit.id}.deploymentRule.label`
  ].filter(Boolean)),
  ...starterTactics.flatMap(tactic => [
    `content.tactics.${tactic.id}.name`,
    `content.tactics.${tactic.id}.description`,
    `content.tactics.${tactic.id}.effectText`
  ]),
  ...deckTactics.flatMap(tactic => [
    `content.tactics.${tactic.id}.name`,
    `content.tactics.${tactic.id}.effectText`,
    tactic.notes && `content.tactics.${tactic.id}.notes`
  ].filter(Boolean)),
  ...missions.flatMap(mission => {
    const group = mission.missionClass === "desperate" ? "conditions" : "objectives";
    return [
      `content.missions.${mission.id}.name`,
      ...(mission[group] || []).map(item => `content.missions.${mission.id}.${group}.${item.id}.text`),
      `content.missions.${mission.id}.reward.text`
    ];
  }),
  "content.missionLabels.card.objectives",
  "content.missionLabels.card.conditions",
  "content.missionLabels.card.reward",
  ...Object.keys(builtinDecks).map(id => `content.decks.${id}.name`),
  ...officialMaps.flatMap(id => [`content.maps.${id}.name`, `content.maps.${id}.description`]),
  ...terrainIds.flatMap(id => [`content.terrains.${id}.name`, `content.terrains.${id}.description`]),
  ...Object.entries(taxonomy).flatMap(([group, values]) => values.map(value => `content.taxonomy.${group}.${value}`))
];
const errors = [];
for (const language of ["it", "en"]) {
  for (const key of required) {
    if (!locales[language][key] || !locales[language][key].trim()) errors.push(`${language}: missing ${key}`);
  }
}
console.log(`S2-C5b frozen presentation locale gate: ${errors.length ? "FAIL" : "PASS"} (${officialUnits.length} KEEP units, ${starterTactics.length + deckTactics.length} tactics, ${missions.length} missions, ${Object.keys(builtinDecks).length} decks, ${officialMaps.length} KEEP maps, ${terrainIds.length} terrains, ${required.length} fields × 2)`);
errors.forEach(error => console.error(`- ${error}`));
if (errors.length) process.exitCode = 1;
