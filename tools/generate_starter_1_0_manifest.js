"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "data", "starter_1_0_manifest.json");
const REFRACTOR_BASELINE = "fef34ddf34fa20e111fbfe0d6721448b7e5bc6c5";
const REMOVE_MAPS = new Map([
  [
    "map2_triumvirate",
    "Legacy map disabled by F9R3: its central strategic point is not equidistant from every headquarters. Keep resolver/storage compatibility only."
  ],
  [
    "map3_quadrivium",
    "Legacy map disabled by F9R3: its central strategic point is not equidistant from every headquarters. Keep resolver/storage compatibility only."
  ]
]);

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .filter(key => value[key] !== undefined)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
  return crypto.createHash("sha256").update(input).digest("hex");
}

function contentHash(value) {
  return sha256(stableStringify(plain(value)));
}

function createContext() {
  const context = {
    console,
    Object,
    Array,
    Number,
    Boolean,
    Math,
    Set,
    Map,
    Date,
    state: null,
    localStorage: { getItem() { return null; }, setItem() {} },
    document: undefined
  };
  context.globalThis = context;
  vm.createContext(context);
  return context;
}

function loadInto(context, relativePaths) {
  for (const relativePath of relativePaths) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, relativePath), "utf8"), context, { filename: relativePath });
  }
}

function loadCardContent() {
  const context = createContext();
  loadInto(context, [
    "data/units_base.js",
    "data/tactics_base.js",
    "data/tactics_cards_c2.js",
    "data/missions_base.js",
    "data/builtin_decks.js",
    "data/cards_base.js",
    "src/cards.js",
    "src/deck.js",
    "src/deck_builder.js"
  ]);

  const catalogs = plain(vm.runInContext(`({
    units: BLUEPRINTS,
    starterTactics: TACTICS,
    deckTactics: DECK_TACTICS,
    missions: MISSION_DEFINITIONS,
    builtInDecks: BUILTIN_DECKS,
    cards: buildCardCatalog()
  })`, context));

  const deckValidation = plain(vm.runInContext(`(() => {
    const catalog = buildCardCatalog();
    return Object.entries(BUILTIN_DECKS).map(([key, payload]) => {
      const check = deckBuilderValidateSavedDeckPayload(
        payload,
        payload.faction,
        payload.commanderId,
        catalog,
        { allowCustom: true, setupRuntime: true, savedKey: key }
      );
      return {
        key,
        ok: check.ok,
        issues: check.issues,
        countedDeckSize: check.countedDeckSize,
        runtimeCardTotal: check.runtimeCardTotal,
        runtimeMissionCopies: check.runtimeMissionCopies,
        commanderCopies: check.sanity.commanderCopies,
        pivotCopies: check.sanity.pivotCopies,
        copyViolations: check.sanity.copyViolations
      };
    });
  })()`, context));

  return { ...catalogs, deckValidation };
}

function loadMapContent() {
  const context = createContext();
  loadInto(context, [
    "data/maps.js",
    "src/hex.js",
    "src/board_geometry.js",
    "data/terrain_registry.js",
    "data/official_maps_f9r3.js",
    "data/official_maps_f9s1b1.js",
    "data/official_maps_f9w2a1.js",
    "data/map_definitions.js",
    "src/map_normalization.js",
    "src/map_pathfinding.js",
    "src/map_validation.js",
    "src/map_persistence.js",
    "src/map_state_queries.js",
    "src/map_runtime.js"
  ]);
  const maps = plain(vm.runInContext("getBuiltinMapDefinitions({ includeDisabled: true })", context));
  const validation = maps.map(map => {
    context.__starterManifestMap = map;
    return plain(vm.runInContext("validateMapDefinition(__starterManifestMap)", context));
  });
  delete context.__starterManifestMap;
  return { maps, validation };
}

function countBy(items, selectors) {
  const root = {};
  for (const item of items) {
    let cursor = root;
    selectors.forEach((selector, index) => {
      const key = String(selector(item) || "unknown");
      if (index === selectors.length - 1) cursor[key] = (cursor[key] || 0) + 1;
      else cursor = cursor[key] = cursor[key] || {};
    });
  }
  return root;
}

function duplicateIds(scopes) {
  const findings = [];
  const global = new Map();
  for (const [scope, ids] of Object.entries(scopes)) {
    const counts = new Map();
    for (const rawId of ids) {
      const id = String(rawId || "");
      counts.set(id, (counts.get(id) || 0) + 1);
      const owners = global.get(id) || [];
      owners.push(scope);
      global.set(id, owners);
    }
    for (const [id, count] of counts) {
      if (!id || count > 1) findings.push({ scope, id, count });
    }
  }
  for (const [id, owners] of global) {
    if (id && owners.length > 1) findings.push({ scope: "cross-catalog", id, count: owners.length, owners });
  }
  return findings;
}

function collectKeyReferences(value, keyName, owner, output) {
  if (Array.isArray(value)) {
    value.forEach(item => collectKeyReferences(item, keyName, owner, output));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (key === keyName && typeof child === "string" && child) output.push({ owner, id: child });
    collectKeyReferences(child, keyName, owner, output);
  }
}

function collectAssetPaths(value, owner, output) {
  if (Array.isArray(value)) {
    value.forEach(item => collectAssetPaths(item, owner, output));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach(child => collectAssetPaths(child, owner, output));
    return;
  }
  if (typeof value !== "string") return;
  const normalized = value.replace(/\\/g, "/");
  if (/^assets\/[A-Za-z0-9_./ -]+\.[A-Za-z0-9]+$/.test(normalized)) output.push({ path: normalized, owner });
}

function itemDecision(decision, reason = null) {
  const result = { decision };
  if (reason) result.reason = reason;
  if (decision === "REMOVE") result.supportPolicy = "compatibility-only-no-new-assets-or-localization";
  return result;
}

function mapItem(map, validation) {
  const reason = REMOVE_MAPS.get(map.id) || null;
  const decision = reason ? "REMOVE" : "KEEP";
  return {
    id: map.id,
    name: map.name,
    playerCount: map.playerCount,
    enabled: map.enabled !== false,
    official: map.official === true,
    valid: validation.valid === true,
    validationErrors: plain(validation.errors || []),
    contentHash: contentHash(map),
    ...itemDecision(decision, reason)
  };
}

function manifestSnapshotPayload(manifest) {
  return {
    policy: manifest.policy,
    catalogs: manifest.catalogs,
    assetReferences: manifest.assetReferences,
    findings: manifest.findings
  };
}

function computeCatalogHash(manifest) {
  return contentHash(manifestSnapshotPayload(manifest));
}

function buildManifest() {
  const cardContent = loadCardContent();
  const mapContent = loadMapContent();
  const units = cardContent.units.map(unit => ({
    id: unit.id,
    name: unit.name,
    faction: unit.faction,
    role: unit.type,
    weight: unit.weight,
    contentHash: contentHash(unit),
    ...itemDecision("KEEP")
  }));
  const starterTactics = cardContent.starterTactics.map(tactic => ({
    id: tactic.id,
    name: tactic.name,
    faction: tactic.faction,
    kind: tactic.kind,
    contentHash: contentHash(tactic),
    ...itemDecision("KEEP")
  }));
  const deckTactics = cardContent.deckTactics.map(tactic => ({
    id: tactic.id,
    name: tactic.name,
    faction: tactic.faction,
    category: tactic.category,
    implementationStatus: tactic.implementationStatus,
    contentHash: contentHash(tactic),
    ...itemDecision("KEEP")
  }));
  const missions = cardContent.missions.map(mission => ({
    id: mission.id,
    name: mission.name,
    faction: mission.faction,
    missionClass: mission.missionClass,
    contentHash: contentHash(mission),
    ...itemDecision("KEEP")
  }));
  const deckValidationByKey = new Map(cardContent.deckValidation.map(item => [item.key, item]));
  const builtInDecks = Object.entries(cardContent.builtInDecks).map(([key, deck]) => {
    const validation = deckValidationByKey.get(key);
    const hashProjection = { ...deck };
    delete hashProjection.savedAt;
    delete hashProjection.build;
    return {
      key,
      name: deck.deckName || deck.name,
      faction: deck.faction,
      commanderId: deck.commanderId,
      pivotId: deck.pivotId || null,
      missionId: deck.missionId || null,
      category: deck.deckCategory,
      countedCards: Array.isArray(deck.deckIds) ? deck.deckIds.length : 0,
      valid: Boolean(validation && validation.ok),
      contentHash: contentHash(hashProjection),
      ...itemDecision("KEEP")
    };
  });
  const allMaps = mapContent.maps.map((map, index) => mapItem(map, mapContent.validation[index]));
  const officialMaps = allMaps.filter(map => map.decision !== "REMOVE");
  const legacyMaps = allMaps.filter(map => map.decision === "REMOVE");

  const duplicateFindings = duplicateIds({
    units: units.map(item => item.id),
    starterTactics: starterTactics.map(item => item.id),
    deckTactics: deckTactics.map(item => item.id),
    missions: missions.map(item => item.id),
    builtInDecks: builtInDecks.map(item => item.key),
    maps: allMaps.map(item => item.id)
  });

  const unitIds = new Set(cardContent.units.map(item => item.id));
  const missionIds = new Set(cardContent.missions.map(item => item.id));
  const cardIds = new Set(cardContent.cards.map(item => item.id));
  const missingReferences = [];
  const spawnReferences = [];
  cardContent.units.forEach(unit => collectKeyReferences(unit, "spawnBlueprintId", `unit:${unit.id}`, spawnReferences));
  cardContent.deckTactics.forEach(tactic => collectKeyReferences(tactic, "spawnBlueprintId", `deckTactic:${tactic.id}`, spawnReferences));
  for (const reference of spawnReferences) {
    if (!unitIds.has(reference.id)) missingReferences.push({ type: "spawnBlueprint", ...reference });
  }
  for (const [key, deck] of Object.entries(cardContent.builtInDecks)) {
    if (!unitIds.has(deck.commanderId)) missingReferences.push({ type: "commander", owner: `deck:${key}`, id: deck.commanderId });
    if (deck.pivotId && !unitIds.has(deck.pivotId)) missingReferences.push({ type: "pivot", owner: `deck:${key}`, id: deck.pivotId });
    if (deck.missionId && !missionIds.has(deck.missionId)) missingReferences.push({ type: "mission", owner: `deck:${key}`, id: deck.missionId });
    for (const id of deck.deckIds || []) {
      if (!cardIds.has(id)) missingReferences.push({ type: "deckCard", owner: `deck:${key}`, id });
    }
  }

  const assetOwners = [];
  const contentAndDecisions = [
    ...cardContent.units.map((raw, index) => ({ raw, category: "unit", item: units[index] })),
    ...cardContent.starterTactics.map((raw, index) => ({ raw, category: "starterTactic", item: starterTactics[index] })),
    ...cardContent.deckTactics.map((raw, index) => ({ raw, category: "deckTactic", item: deckTactics[index] })),
    ...cardContent.missions.map((raw, index) => ({ raw, category: "mission", item: missions[index] })),
    ...Object.entries(cardContent.builtInDecks).map(([key, raw], index) => ({ raw, category: "builtInDeck", item: builtInDecks[index], ownerId: key })),
    ...mapContent.maps.map((raw, index) => ({ raw, category: "map", item: allMaps[index] }))
  ];
  for (const entry of contentAndDecisions) {
    collectAssetPaths(entry.raw, {
      category: entry.category,
      id: entry.ownerId || entry.item.id || entry.item.key,
      decision: entry.item.decision
    }, assetOwners);
  }
  const assetsByPath = new Map();
  for (const reference of assetOwners) {
    const owners = assetsByPath.get(reference.path) || [];
    if (!owners.some(owner => owner.category === reference.owner.category && owner.id === reference.owner.id)) owners.push(reference.owner);
    assetsByPath.set(reference.path, owners);
  }
  const assetReferences = [...assetsByPath.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([assetPath, owners]) => {
    owners.sort((a, b) => `${a.category}:${a.id}`.localeCompare(`${b.category}:${b.id}`));
    const absolutePath = path.join(ROOT, ...assetPath.split("/"));
    const exists = fs.existsSync(absolutePath);
    if (!exists) missingReferences.push({ type: "asset", owner: owners.map(owner => `${owner.category}:${owner.id}`).join(","), id: assetPath });
    const keepOwner = owners.some(owner => owner.decision === "KEEP");
    return {
      path: assetPath,
      exists,
      bytes: exists ? fs.statSync(absolutePath).size : 0,
      sha256: exists ? sha256(fs.readFileSync(absolutePath)) : null,
      owners,
      decision: keepOwner ? "KEEP" : "REMOVE"
    };
  });

  const everyContentItem = [...units, ...starterTactics, ...deckTactics, ...missions, ...builtInDecks, ...allMaps];
  const undecidedContent = everyContentItem
    .filter(item => !["KEEP", "REDESIGN", "REMOVE"].includes(item.decision))
    .map(item => item.id || item.key);
  const redesignWithoutReason = everyContentItem
    .filter(item => item.decision === "REDESIGN" && !item.reason)
    .map(item => item.id || item.key);
  const removeSupportViolations = assetReferences
    .filter(asset => asset.owners.some(owner => owner.decision === "REMOVE"))
    .map(asset => ({ type: "asset", path: asset.path, owners: asset.owners.filter(owner => owner.decision === "REMOVE") }));
  const illegalDecks = cardContent.deckValidation
    .filter(item => !item.ok)
    .map(item => ({ key: item.key, issues: item.issues }));
  const invalidKeptMaps = allMaps
    .filter(map => map.decision === "KEEP" && !map.valid)
    .map(map => ({ id: map.id, errors: map.validationErrors }));
  const invalidRemovedMaps = allMaps
    .filter(map => map.decision === "REMOVE" && !map.valid)
    .map(map => ({ id: map.id, errors: map.validationErrors }));

  const manifest = {
    schemaVersion: 1,
    manifestId: "arena-rubra-starter-1.0-content-freeze",
    releaseTarget: "Arena Rubra Starter 1.0 — Desktop / Web",
    sourceBaseline: REFRACTOR_BASELINE,
    generator: "tools/generate_starter_1_0_manifest.js",
    deterministic: true,
    policy: {
      decisions: ["KEEP", "REDESIGN", "REMOVE"],
      defaultCurrentCatalogDecision: "KEEP",
      redesignRequiresReason: true,
      removedContentPolicy: "Compatibility resolution only; no new assets or localization. Physical removal is deferred to a separately approved migration.",
      generatedAtExcluded: true
    },
    summary: {
      totalContentItems: everyContentItem.length,
      units: units.length,
      starterTactics: starterTactics.length,
      deckTactics: deckTactics.length,
      missions: missions.length,
      builtInDecks: builtInDecks.length,
      officialMaps: officialMaps.length,
      legacyMaps: legacyMaps.length,
      explicitAssetReferences: assetReferences.length,
      decisions: countBy(everyContentItem, [item => item.decision]),
      unitsByFactionAndRole: countBy(cardContent.units, [item => item.faction, item => item.type]),
      starterTacticsByFaction: countBy(cardContent.starterTactics, [item => item.faction]),
      deckTacticsByFaction: countBy(cardContent.deckTactics, [item => item.faction]),
      missionsByFactionAndClass: countBy(cardContent.missions, [item => item.faction, item => item.missionClass]),
      builtInDecksByFactionAndCategory: countBy(Object.values(cardContent.builtInDecks), [item => item.faction, item => item.deckCategory]),
      officialMapsByPlayerCount: countBy(officialMaps, [item => item.playerCount])
    },
    catalogs: { units, starterTactics, deckTactics, missions, builtInDecks, officialMaps, legacyMaps },
    assetReferences,
    findings: {
      duplicateIds: duplicateFindings,
      missingReferences,
      illegalDecks,
      invalidKeptMaps,
      invalidRemovedMaps,
      undecidedContent,
      redesignWithoutReason,
      removeSupportViolations
    }
  };
  manifest.catalogHash = computeCatalogHash(manifest);
  return manifest;
}

function serializeManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function criticalFindings(manifest) {
  return [
    "duplicateIds",
    "missingReferences",
    "illegalDecks",
    "invalidKeptMaps",
    "undecidedContent",
    "redesignWithoutReason",
    "removeSupportViolations"
  ].flatMap(key => (manifest.findings[key] || []).map(finding => ({ key, finding })));
}

function runCli() {
  const manifest = buildManifest();
  const serialized = serializeManifest(manifest);
  const mode = process.argv[2] || "--check";
  if (mode === "--write") {
    fs.writeFileSync(MANIFEST_PATH, serialized, "utf8");
    console.log(`Wrote ${path.relative(ROOT, MANIFEST_PATH)} (${manifest.catalogHash})`);
    return;
  }
  if (mode === "--check") {
    if (!fs.existsSync(MANIFEST_PATH)) throw new Error("Starter 1.0 manifest missing; run with --write after reviewing content decisions");
    const committed = fs.readFileSync(MANIFEST_PATH, "utf8");
    if (committed !== serialized) throw new Error("Starter 1.0 catalog drift detected; review the source change and regenerate the manifest deliberately");
    const critical = criticalFindings(manifest);
    if (critical.length) throw new Error(`Starter 1.0 manifest has ${critical.length} critical finding(s)`);
    console.log(`Starter 1.0 manifest PASS (${manifest.catalogHash})`);
    return;
  }
  if (mode === "--print") {
    process.stdout.write(serialized);
    return;
  }
  throw new Error(`Unknown mode: ${mode}`);
}

if (require.main === module) {
  try {
    runCli();
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  }
}

module.exports = {
  MANIFEST_PATH,
  buildManifest,
  computeCatalogHash,
  criticalFindings,
  manifestSnapshotPayload,
  serializeManifest,
  stableStringify
};
