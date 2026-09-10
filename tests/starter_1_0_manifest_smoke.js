"use strict";

const assert = require("assert");
const fs = require("fs");
const {
  MANIFEST_PATH,
  buildManifest,
  computeCatalogHash,
  criticalFindings,
  serializeManifest
} = require("../tools/generate_starter_1_0_manifest");

const manifest = buildManifest();
const committed = fs.readFileSync(MANIFEST_PATH, "utf8");

assert.strictEqual(committed, serializeManifest(manifest), "catalog drift: review source changes and regenerate the Starter 1.0 manifest deliberately");
assert.strictEqual(manifest.catalogHash, computeCatalogHash(manifest), "catalog hash must be reproducible");
assert.deepStrictEqual(criticalFindings(manifest), [], "the freeze contains a critical finding");

const catalogs = manifest.catalogs;
const allItems = [
  ...catalogs.units,
  ...catalogs.starterTactics,
  ...catalogs.deckTactics,
  ...catalogs.missions,
  ...catalogs.builtInDecks,
  ...catalogs.officialMaps,
  ...catalogs.legacyMaps
];

assert.strictEqual(manifest.summary.totalContentItems, allItems.length);
assert.strictEqual(manifest.summary.units, catalogs.units.length);
assert.strictEqual(manifest.summary.starterTactics, catalogs.starterTactics.length);
assert.strictEqual(manifest.summary.deckTactics, catalogs.deckTactics.length);
assert.strictEqual(manifest.summary.missions, catalogs.missions.length);
assert.strictEqual(manifest.summary.builtInDecks, catalogs.builtInDecks.length);
assert.strictEqual(manifest.summary.officialMaps, catalogs.officialMaps.length);
assert.strictEqual(manifest.summary.legacyMaps, catalogs.legacyMaps.length);

assert.strictEqual(catalogs.units.length, 115);
assert.strictEqual(catalogs.starterTactics.length, 10);
assert.strictEqual(catalogs.deckTactics.length, 70);
assert.strictEqual(catalogs.missions.length, 15);
assert.strictEqual(catalogs.builtInDecks.length, 50);
assert.strictEqual(catalogs.officialMaps.length, 10);
assert.strictEqual(catalogs.legacyMaps.length, 2);

for (const item of allItems) {
  assert(["KEEP", "REDESIGN", "REMOVE"].includes(item.decision), `${item.id || item.key}: decision missing`);
  assert(/^[a-f0-9]{64}$/.test(item.contentHash), `${item.id || item.key}: content hash missing`);
  if (item.decision === "REDESIGN") assert(item.reason, `${item.id || item.key}: REDESIGN requires a reason`);
  if (item.decision === "REMOVE") {
    assert(item.reason, `${item.id || item.key}: REMOVE requires a reason`);
    assert.strictEqual(item.supportPolicy, "compatibility-only-no-new-assets-or-localization");
  }
}

assert(catalogs.builtInDecks.every(deck => deck.valid), "every built-in deck must be legal");
assert(catalogs.officialMaps.every(map => map.valid && map.enabled), "every Starter map must be enabled and valid");
assert.deepStrictEqual(catalogs.legacyMaps.map(map => map.id), ["map2_triumvirate", "map3_quadrivium"]);
assert(catalogs.legacyMaps.every(map => map.decision === "REMOVE" && !map.enabled));
assert(manifest.assetReferences.every(asset => asset.exists && /^[a-f0-9]{64}$/.test(asset.sha256)), "every explicit content asset must resolve and be hashed");

const simulatedDrift = JSON.parse(JSON.stringify(manifest));
simulatedDrift.catalogs.units[0].contentHash = "0".repeat(64);
assert.notStrictEqual(computeCatalogHash(simulatedDrift), manifest.catalogHash, "a catalog change must alter the freeze hash");

console.log(JSON.stringify({
  status: "PASS",
  catalogHash: manifest.catalogHash,
  counts: {
    units: catalogs.units.length,
    starterTactics: catalogs.starterTactics.length,
    deckTactics: catalogs.deckTactics.length,
    missions: catalogs.missions.length,
    builtInDecks: catalogs.builtInDecks.length,
    officialMaps: catalogs.officialMaps.length,
    legacyMaps: catalogs.legacyMaps.length,
    explicitAssets: manifest.assetReferences.length
  },
  decisions: manifest.summary.decisions
}, null, 2));
