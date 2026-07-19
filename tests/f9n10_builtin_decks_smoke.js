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

assert.equal(result.length, 13, "13 deck built-in");
assert.equal(result.filter(entry => entry.runtimeMissionCopies === 0).length, 3, "3 deck senza Missione");
assert.equal(result.filter(entry => entry.runtimeMissionCopies === 1).length, 10, "10 deck per Missioni ordinarie");
for (const entry of result) {
  assert.equal(entry.payload.builtIn, true, `${entry.key}: built-in`);
  assert.equal(entry.payload.immutable, true, `${entry.key}: immutabile`);
  assert.equal(entry.payload.deckIds.length, 30, `${entry.key}: 30 carte conteggiate`);
  assert.equal(entry.countedDeckSize, 30, `${entry.key}: validazione 30/30`);
  assert.equal(entry.commanderCopies, 1, `${entry.key}: un Comandante`);
  assert.equal(entry.pivotCopies <= 1, true, `${entry.key}: massimo una Pivot`);
  assert.equal(entry.copyViolations.length, 0, `${entry.key}: nessuna violazione copie`);
  assert.equal(entry.ok, true, `${entry.key}: ${entry.issues.join("; ")}`);
}

const tafos = result.find(entry => entry.key === "Agathoi::AG0B00::agathoi-alexandros-tafos-lithos");
assert.ok(tafos, "preset Tafos Lithos presente");
assert.equal(tafos.supplementalMissionId, "AGMSN01");
assert.equal(tafos.countedDeckSize, 30);
assert.equal(tafos.runtimeCardTotal, 31);
assert.equal(tafos.runtimeMissionCopies, 1);
assert.equal(tafos.payload.deckIds.includes("MISSION:AGMSN01"), false, "Missione esclusa solo dal contatore/lista 30");

console.log("F9N10 built-in decks smoke: 13/13 validi · 10 preset Missione · Tafos 30+1 OK");
