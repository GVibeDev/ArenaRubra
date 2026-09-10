"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const ArenaI18nCore = require("../src/i18n/core");

const root = path.resolve(__dirname, "..");
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const manifest = readJson("data/starter_1_0_manifest.json");
const itFragment = readJson("locales/content/units.it.json");
const enFragment = readJson("locales/content/units.en.json");
const itTextFragment = readJson("locales/content/unit_text.it.json");
const enTextFragment = readJson("locales/content/unit_text.en.json");
const itUnits = itFragment.content.units;
const enUnits = enFragment.content.units;
const keepUnits = manifest.catalogs.units.filter(unit => unit.decision === "KEEP");

assert.strictEqual(keepUnits.length, 115);
assert.strictEqual(Object.keys(itUnits).length, keepUnits.length);
assert.strictEqual(Object.keys(enUnits).length, keepUnits.length);
for (const unit of keepUnits) {
  assert.strictEqual(itUnits[unit.id].name, unit.name, `Italian source drift: ${unit.id}`);
  assert(enUnits[unit.id] && enUnits[unit.id].name.trim(), `Missing English name: ${unit.id}`);
}

const mergeUnits = (names, text) => Object.fromEntries(Object.keys(names).map(id => [id, { ...names[id], ...(text[id] || {}) }]));
const dictionaries = {
  it: { content:{ units:mergeUnits(itUnits, itTextFragment.content.units) } },
  en: { content:{ units:mergeUnits(enUnits, enTextFragment.content.units) } }
};
const service = ArenaI18nCore.create({ dictionaries, readLanguage:() => "en" });
global.ArenaI18n = { has:service.has, t:service.t };
const content = require("../src/i18n/content");
const card = { id:"UNIT:NX2B01", sourceId:"NX2B01", blueprintId:"NX2B01", sourceType:"unit", name:"Droide di Sicurezza", cost:1 };
const projected = content.card(card);
assert.strictEqual(projected.name, "Security Droid");
assert.strictEqual(projected.id, card.id);
assert.strictEqual(card.name, "Droide di Sicurezza");
assert.strictEqual(content.resolveId("units", card), "NX2B01");
assert.strictEqual(content.project("units", { id:"EX4B02", name:"Bastione Armato" }, ["name"]).name, "Armed Bastion");
const localizedCommander = content.project("units", {
  id:"NXCMD01",
  name:"Avatex",
  description:"Comandante Nexus orientato a presidio PS e controllo territoriale.",
  ability:{ name:"Protocollo di Presidio", description:"Italian source" }
}, ["name", "description", "ability.name", "ability.description"]);
assert.strictEqual(localizedCommander.description, "A Nexus commander focused on SP garrisoning and territorial control.");
assert.strictEqual(localizedCommander.ability.name, "Garrison Protocol");
assert(localizedCommander.ability.description.startsWith("Target an allied Nexus unit"));

const runtime = fs.readFileSync(path.join(root, "src/i18n/runtime.js"), "utf8");
const renderer = fs.readFileSync(path.join(root, "src/card_renderer.js"), "utf8");
const matchRender = fs.readFileSync(path.join(root, "src/render.js"), "utf8");
assert(runtime.includes('"content/units", "content/unit_text", "content/tactics", "content/missions", "content/decks", "content/tutorial_text", "ui/tools"'));
assert(renderer.includes('typeof arenaContentCard === "function" ? arenaContentCard(card) : card'));
assert(renderer.includes('card = typeof arenaContentCard === "function" ? arenaContentCard(card) : card'));
assert(matchRender.includes('card = renderContentCard(card)'));
assert(matchRender.includes('renderLanguageSignature(), state.currentPlayer'));

const gate = spawnSync(process.execPath, [path.join(root, "tools/check_content_locales.js")], { cwd:root, encoding:"utf8" });
assert.strictEqual(gate.status, 0, gate.stderr || gate.stdout);
assert(gate.stdout.includes("115 KEEP units"));
const frozen = spawnSync(process.execPath, [path.join(root, "tools/generate_starter_1_0_manifest.js"), "--check"], { cwd:root, encoding:"utf8" });
assert.strictEqual(frozen.status, 0, frozen.stderr || frozen.stdout);

console.log("S2-C5b4b frozen unit-name localization smoke: 246/246 OK");
