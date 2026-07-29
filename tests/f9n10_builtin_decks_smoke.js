"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const context = {
  console, Object, Array, Number, Boolean, Math, Set, Map, Date,
  state:null,
  localStorage:{ getItem(){ return null; }, setItem(){} },
  document:undefined
};
vm.createContext(context);
for (const relative of [
  "data/units_base.js", "data/tactics_base.js", "data/tactics_cards_c2.js",
  "data/missions_base.js", "data/builtin_decks.js", "data/cards_base.js",
  "src/cards.js", "src/deck.js", "src/deck_builder.js"
]) vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, { filename:relative });

const result = vm.runInContext(`(() => {
  const catalog = buildCardCatalog();
  return Object.entries(BUILTIN_DECKS).map(([key,payload]) => {
    const check = deckBuilderValidateSavedDeckPayload(payload, payload.faction, payload.commanderId, catalog, { allowCustom:true, setupRuntime:true, savedKey:key });
    return {
      key, payload, ok:check.ok, issues:check.issues,
      countedDeckSize:check.countedDeckSize,
      runtimeCardTotal:check.runtimeCardTotal,
      runtimeMissionCopies:check.runtimeMissionCopies,
      supplementalMissionId:check.supplementalMissionId,
      commanderCopies:check.sanity.commanderCopies,
      pivotCopies:check.sanity.pivotCopies,
      copyViolations:check.sanity.copyViolations
    };
  });
})()`, context);

const starterIds = new Set([
  "NX2B01", "NX3B01", "NXC1F07",
  "EX1B01", "EXC1F04", "EX4B02",
  "LX2B01", "LX3B02", "LX4B01",
  "AG1B01", "AG2B01", "AG4B01",
  "FB1B01", "FB2B01", "FB4B01"
]);
const legacyKeys = new Set([
  "Nexus::NXCMD01::nexus-avatex-ufficiale",
  "Exordium::EX0B00::varran-default",
  "Liberti::LXCMD02::pravus-default"
]);

assert.equal(result.length, 50, "50 deck ufficiali");
assert.equal(result.filter(entry => entry.runtimeMissionCopies === 0).length, 40, "40 deck tattici senza Missione");
assert.equal(result.filter(entry => entry.runtimeMissionCopies === 1).length, 10, "10 deck Missione");
assert.equal(result.filter(entry => entry.payload.deckCategory === "tactical").length, 40, "40 metadati tactical");
assert.equal(result.filter(entry => entry.payload.deckCategory === "mission").length, 10, "10 metadati mission");

const factionCounts = {};
const commanderCounts = {};
for (const entry of result) {
  assert.equal(entry.payload.builtIn, true, `${entry.key}: built-in`);
  assert.equal(entry.payload.immutable, true, `${entry.key}: immutabile`);
  assert.equal(entry.payload.deckIds.length, 30, `${entry.key}: 30 carte conteggiate`);
  assert.equal(entry.countedDeckSize, 30, `${entry.key}: validazione 30/30`);
  assert.equal(entry.commanderCopies, 1, `${entry.key}: un Comandante`);
  assert.equal(entry.pivotCopies <= 1, true, `${entry.key}: massimo una Pivot`);
  assert.equal(entry.copyViolations.length, 0, `${entry.key}: nessuna violazione copie`);
  assert.equal(entry.ok, true, `${entry.key}: ${entry.issues.join("; ")}`);
  assert.equal(legacyKeys.has(entry.key), false, `${entry.key}: non legacy`);
  for (const id of entry.payload.deckIds) {
    const sourceId = String(id).replace(/^[A-Z]+:/, "");
    assert.equal(starterIds.has(sourceId), false, `${entry.key}: starter escluso ${sourceId}`);
  }
  factionCounts[entry.payload.faction] = (factionCounts[entry.payload.faction] || 0) + 1;
  const commanderKey = `${entry.payload.faction}::${entry.payload.commanderId}`;
  commanderCounts[commanderKey] = (commanderCounts[commanderKey] || 0) + 1;
}
for (const faction of ["Nexus", "Exordium", "Liberti", "Agathoi", "Fabeot"]) assert.equal(factionCounts[faction], 10, `${faction}: 10 deck`);
for (const [commanderKey, count] of Object.entries(commanderCounts)) assert.equal(count, 5, `${commanderKey}: 5 deck`);
assert.equal(Object.keys(commanderCounts).length, 10, "10 Comandanti nel roster");

const tafos = result.find(entry => entry.key === "Agathoi::AG0B00::agathoi-alexandros-tafos-lithos");
assert.ok(tafos, "preset Tafos Lithos presente");
assert.equal(tafos.supplementalMissionId, "AGMSN01");
assert.equal(tafos.countedDeckSize, 30);
assert.equal(tafos.runtimeCardTotal, 31);
assert.equal(tafos.runtimeMissionCopies, 1);
assert.equal(tafos.payload.deckIds.includes("MISSION:AGMSN01"), false, "Missione esclusa solo dal contatore/lista 30");

console.log("F9S1c1 official roster smoke: 50/50 validi · 40 tattici · 10 Missione · 10/fazione · 5/Comandante · Starter assenti · legacy rimossi");
