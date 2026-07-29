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
  const entries = deckBuilderSavedDeckEntries(catalog);
  const nexus = entries.filter(entry => entry.faction === "Nexus");
  const bastione = nexus.find(entry => entry.deckName === "Bastione Mobile");
  const gallery = deckBuilderSavedGalleryHtml(nexus, bastione.key);
  const controlCard = bastione.check.cards.find(card => card.deckRole !== "commander" && card.deckRole !== "pivot");
  const report = {
    deckRules:{ deckSize:30, defaultMaxCopies:2 },
    deckIds:[...bastione.payload.deckIds],
    deckCopyCounts:countCardCopies(bastione.check.cards),
    sanity:bastione.check.sanity,
    deck:bastione.check.cards,
    analysis:deckBuilderAnalyzeDeck(bastione.check.cards),
    containsCustomCards:false,
    customCount:0,
    poolCustomCount:0,
    faction:bastione.faction,
    commanderName:bastione.commanderName,
    commanderId:bastione.commanderId,
    deckName:bastione.deckName,
    includeCustomCards:false,
    mode:"official",
    poolSize:buildCardCatalog().filter(card => card.faction === bastione.faction).length,
    deckRules:{ deckSize:30, defaultMaxCopies:2 }
  };
  const control = deckBuilderCardCountControlHtml(controlCard, report);
  const summary = deckBuilderSummaryHtml(report);
  return {
    total:entries.length,
    nexusCount:nexus.length,
    commanderCounts:Object.fromEntries([...new Set(nexus.map(entry => entry.commanderId))].map(id => [id, nexus.filter(entry => entry.commanderId === id).length])),
    tactical:entries.filter(entry => entry.deckCategory === "tactical").length,
    mission:entries.filter(entry => entry.deckCategory === "mission").length,
    gallery,
    control,
    summary,
    analysis:report.analysis,
    bastioneMeta:{ energyAverage:bastione.energyAverage, unitCount:bastione.unitCount, tacticCount:bastione.tacticCount, structureCount:bastione.structureCount },
    legacyPresent:[
      "Nexus::NXCMD01::nexus-avatex-ufficiale",
      "Exordium::EX0B00::varran-default",
      "Liberti::LXCMD02::pravus-default"
    ].some(key => Object.prototype.hasOwnProperty.call(BUILTIN_DECKS, key))
  };
})()`, context);

assert.equal(result.total, 50, "50 deck nella libreria");
assert.equal(result.tactical, 40, "40 deck tattici");
assert.equal(result.mission, 10, "10 deck Missione");
assert.equal(result.nexusCount, 10, "10 Nexus nella gallery filtrata");
assert.deepEqual(result.commanderCounts, { NXCMD01:5, NXCMD02:5 }, "5 deck per Comandante Nexus");
assert.equal(result.legacyPresent, false, "preset legacy rimossi");
assert.equal((result.gallery.match(/data-db-select-saved-key=/g) || []).length, 10, "10 pulsanti nome-only");
assert.ok(result.gallery.includes("deckBuilderSavedDeckDetail"), "dettaglio deck separato");
assert.ok(result.gallery.includes("Bastione Mobile"), "deck selezionato nel dettaglio");
assert.equal((result.control.match(/<button/g) || []).length, 2, "controllo copie unico con − e +");
assert.ok(result.control.includes("data-db-remove-card"), "rimozione nella stessa casella");
assert.ok(result.control.includes("data-db-add-card"), "aggiunta nella stessa casella");
assert.ok(result.summary.includes("deckBuilderAnalysisPanel"), "pannello analisi presente");
assert.ok(result.summary.includes("Curva ENE"), "curva ENE presente");
assert.ok(result.summary.includes("Proporzione unità/tattiche"), "rapporto unità/tattiche presente");
assert.equal(Object.keys(result.analysis.energyCurve).length, 8, "curva 0-7 completa");
assert.equal(result.analysis.totalCards, 30, "analisi su 30 carte");
assert.equal(result.analysis.unitCount + result.analysis.tacticCount + result.analysis.missionCount, 30, "composizione completa");
assert.equal(result.bastioneMeta.unitCount, result.analysis.unitCount, "metadati unità coerenti");
assert.equal(result.bastioneMeta.tacticCount, result.analysis.tacticCount, "metadati tattiche coerenti");
assert.equal(result.bastioneMeta.structureCount, result.analysis.structureCount, "metadati strutture coerenti");
assert.equal(result.bastioneMeta.energyAverage, result.analysis.energyAverage, "media ENE coerente");

console.log("F9S1c1 roster/Deck Builder UX smoke: 32/32 verifiche superate");
