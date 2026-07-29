"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");
const root = path.resolve(__dirname, "..");
const sandbox = { console, setTimeout, clearTimeout };
vm.createContext(sandbox);
function load(rel) { vm.runInContext(fs.readFileSync(path.join(root, rel), "utf8"), sandbox, { filename: rel }); }
for (const rel of [
  "data/units_base.js",
  "data/unit_taxonomy.js",
  "data/tactics_cards_c2.js",
  "data/missions_base.js",
  "data/builtin_decks.js",
  "data/cards_base.js",
  "src/cards.js",
  "src/deck.js",
  "src/visual_assets.js"
]) load(rel);

const audit = vm.runInContext("unitTaxonomyAuditF9O5(BLUEPRINTS)", sandbox);
assert.strictEqual(audit.ok, true, audit.errors.join("\n"));
assert.strictEqual(audit.total, 115);
assert.deepStrictEqual(JSON.parse(JSON.stringify(audit.counts)), {
  starter: 15, light: 23, heavy: 36, elite: 21, pivot: 10, commander: 10
});
assert.deepStrictEqual(JSON.parse(JSON.stringify(audit.starterRoles)), {
  starter_infantry: 5, starter_vehicle: 5, starter_structure: 5
});

function bp(id) { return vm.runInContext(`BLUEPRINTS.find(x => x.id === ${JSON.stringify(id)})`, sandbox); }
assert.strictEqual(bp("AGC1F09").weight, "Pesante");
assert.strictEqual(bp("FBC1F01").weight, "Elite");
assert.strictEqual(bp("FBC1F06").weight, "Elite");
assert.strictEqual(bp("AGC1F12").cost, 5);
assert.strictEqual(bp("FBPIV01").unitClass, "elite");
assert.strictEqual(bp("FBC1F04").unitClass, "pivot");
assert.strictEqual(bp("NXC1F07").unitClass, "starter");
assert.strictEqual(bp("NXC1F07").starterRole, "starter_structure");
assert.ok(bp("LXC1F01").traits.includes("superiority_numeric"));
assert.ok(bp("LXC1F01").traits.includes("vanguard"));
assert.ok(!bp("LXC1F01").traits.includes("bleed"));
assert.deepStrictEqual(JSON.parse(JSON.stringify(bp("LX3B02").traits)), ["bleed"]);
assert.ok(bp("AG1B02").traits.includes("thorns"));

const catalog = vm.runInContext("buildCardCatalog()", sandbox);
for (const faction of ["Nexus", "Exordium", "Liberti", "Agathoi", "Fabeot"]) {
  const starters = catalog.filter(c => c.faction === faction && c.starterRole);
  assert.strictEqual(starters.length, 3, `${faction} starter ${starters.length}/3`);
  assert.deepStrictEqual([...new Set(starters.map(c => c.starterRole))].sort(), ["starter_infantry", "starter_structure", "starter_vehicle"]);
}
assert.strictEqual(catalog.find(c => c.id === "UNIT:FBC1F01").deckRole, "elite");
assert.strictEqual(catalog.find(c => c.id === "UNIT:FBPIV01").deckRole, "elite");
assert.strictEqual(catalog.find(c => c.id === "UNIT:FBC1F04").deckRole, "pivot");

const decks = vm.runInContext("BUILTIN_DECK_EXPORT.decks", sandbox);
const exLucis = decks["Fabeot::FB0B00::fabeot-gerarca-ex-lucis-tenebrae"].deckIds;
const cosp = decks["Fabeot::FBCMD02::fabeot-emissario-cospirazione"].deckIds;
function count(list, id) { return list.filter(x => x === id).length; }
assert.strictEqual(exLucis.length, 30);
assert.strictEqual(cosp.length, 30);
assert.strictEqual(count(exLucis, "UNIT:FBC1F01"), 1);
assert.strictEqual(count(exLucis, "UNIT:FBC1F02"), 2);
assert.strictEqual(count(cosp, "UNIT:FBC1F01"), 1);
assert.strictEqual(count(cosp, "UNIT:FBC1F03"), 2);
assert.strictEqual(count(exLucis, "UNIT:FBC1F04"), 1);
assert.strictEqual(count(cosp, "UNIT:FBC1F04"), 1);

const sampleCandidates = vm.runInContext('visualAssetTokenCandidatesForUnit(BLUEPRINTS.find(x => x.id === "NXC1F07"))', sandbox);
assert.ok(sampleCandidates[0].endsWith("/units/nxc1f07.webp"));
assert.ok(sampleCandidates.some(p => p.endsWith("/structure/starter.webp")));
assert.ok(sampleCandidates.some(p => p.endsWith("/structure/light.webp")));
assert.ok(sampleCandidates.some(p => p.endsWith("/structure.webp")));
assert.strictEqual(new Set(sampleCandidates).size, sampleCandidates.length);

console.log("F9O5 miniature taxonomy & asset completion smoke: OK");
console.log(JSON.stringify({ audit, exLucisSpia: count(exLucis, "UNIT:FBC1F01"), cospSpia: count(cosp, "UNIT:FBC1F01"), sampleCandidates }, null, 2));
