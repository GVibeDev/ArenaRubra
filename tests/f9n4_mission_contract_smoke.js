"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const context = { console, Object, Array, Number, Boolean, Math, Set, Map, BLUEPRINTS:[], DECK_TACTICS:[], state:null };
vm.createContext(context);

for (const relative of [
  "data/missions_base.js",
  "data/cards_base.js",
  "src/cards.js",
  "src/deck.js",
  "src/card_assets.js",
  "src/card_renderer.js"
]) {
  vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, { filename:relative });
}

const missions = vm.runInContext("MISSION_DEFINITIONS", context);
assert.equal(missions.length, 15);
assert.equal(new Set(missions.map(mission => mission.id)).size, 15);

const factions = ["Nexus", "Exordium", "Liberti", "Agathoi", "Fabeot"];
for (const faction of factions) {
  const group = missions.filter(mission => mission.faction === faction);
  assert.equal(group.length, 3, `${faction}: tre Missioni`);
  assert.equal(group.filter(mission => mission.missionClass === "ordinary").length, 2, `${faction}: due ordinarie`);
  assert.equal(group.filter(mission => mission.missionClass === "desperate").length, 1, `${faction}: una disperata`);
}

for (const mission of missions) {
  const clauses = mission.missionClass === "desperate" ? mission.conditions : mission.objectives;
  assert.equal(clauses.length, 3, `${mission.id}: tre obiettivi/condizioni`);
  assert.ok(mission.reward && mission.reward.kind && mission.reward.text, `${mission.id}: ricompensa strutturata`);
  for (const clause of clauses) {
    assert.ok(clause.id && clause.metric && clause.operator && clause.text, `${mission.id}: clausola completa`);
    if (clause.consecutive) assert.ok(clause.durationMode, `${mission.id}/${clause.id}: durata esplicita`);
  }
}

const missionCards = vm.runInContext("buildCardCatalog()", context);
assert.equal(missionCards.length, 15);
for (const card of missionCards) {
  assert.equal(card.sourceType, "mission");
  assert.equal(card.cardType, "mission");
  assert.equal(card.deckRole, "mission");
  assert.equal(card.implementationStatus, "data_only");
  assert.equal(vm.runInContext(`deckCopyLimitForCard(${JSON.stringify(card)})`, context), 1);
  const entry = vm.runInContext(`cardAssetEntryFor(${JSON.stringify(card)})`, context);
  assert.equal(entry.kind, "tactic");
  assert.equal(entry.artPath, `assets/cards/art/${card.faction.toLowerCase()}/tactics/${card.sourceId.toLowerCase()}.webp`);
  context.testMissionCard = card;
  assert.equal(vm.runInContext("cardRendererUsesTacticLayout(testMissionCard)", context), true);
  assert.match(vm.runInContext("cardRendererTypeText(testMissionCard)", context), /^MISSIONE/);
  const missionLayout = vm.runInContext("cardRendererLayoutFor(testMissionCard, cardAssetKind(testMissionCard))", context);
  const tacticLayout = vm.runInContext("cardRendererLayoutFor({...testMissionCard, sourceType:'tactic'}, 'tactic')", context);
  assert.deepEqual(JSON.parse(JSON.stringify(missionLayout)), JSON.parse(JSON.stringify(tacticLayout)));
}

const fakeCatalog = [
  { id:"UNIT:NX001", sourceId:"NX001", sourceType:"unit", cardType:"commander", deckRole:"commander", faction:"Nexus", name:"Commander", blueprintId:"NX001", cost:1 },
  ...Array.from({length:35}, (_, index) => ({
    id:`UNIT:NXB${index + 1}`, sourceId:`NXB${index + 1}`, sourceType:"unit", cardType:"unit", deckRole:"base",
    faction:"Nexus", name:`Base ${index + 1}`, blueprintId:`NXB${index + 1}`, cost:1
  })),
  ...missionCards.filter(card => card.faction === "Nexus")
];
context.fakeCatalog = fakeCatalog;
const template = vm.runInContext("buildLegalDeckTemplateForFaction('Nexus', fakeCatalog, 30)", context);
assert.equal(template.length, 30);
assert.equal(template.filter(card => card.sourceType === "mission").length, 0, "template automatico senza Missione");

const twoMissionDeck = [fakeCatalog[0], ...fakeCatalog.slice(1, 28), missionCards[0], missionCards[1]];
context.state = {
  factions:{1:"Nexus"}, selectedCommanders:{1:"NX001"}, cardCatalog:fakeCatalog,
  deck:{1:twoMissionDeck}, hand:{1:[]}, discard:{1:[]}, cardDebug:{initialized:true}
};
let runtime = vm.runInContext("deckRuntimeValidationForSide(1)", context);
assert.equal(runtime.missionCopies, 2);
assert.equal(runtime.ok, false);
assert.ok(runtime.issues.some(issue => issue.includes("Missione") && issue.includes("massimo 1")));

context.state.deck[1] = [fakeCatalog[0], ...fakeCatalog.slice(1, 29), missionCards[0]];
runtime = vm.runInContext("deckRuntimeValidationForSide(1)", context);
assert.equal(runtime.totalCards, 30);
assert.equal(runtime.missionCopies, 1);
assert.equal(runtime.ok, true);

console.log("F9N4 mission data/deck/asset smoke: 15 Missioni + contratto 29+1 OK");
