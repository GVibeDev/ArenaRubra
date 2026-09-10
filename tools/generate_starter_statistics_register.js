"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "docs", "release", "STARTER_1_0_STATISTICS_REGISTER.md");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadMaps() {
  const context = {
    console, Object, Array, Number, Boolean, Math, Set, Map, Date,
    state: null,
    localStorage: { getItem() { return null; }, setItem() {} },
    document: undefined
  };
  context.globalThis = context;
  vm.createContext(context);
  const files = [
    "data/maps.js", "src/hex.js", "src/board_geometry.js",
    "data/terrain_registry.js", "data/official_maps_f9r3.js",
    "data/official_maps_f9s1b1.js", "data/official_maps_f9w2a1.js",
    "data/map_definitions.js", "src/map_normalization.js",
    "src/map_pathfinding.js", "src/map_validation.js",
    "src/map_persistence.js", "src/map_state_queries.js", "src/map_runtime.js"
  ];
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
  }
  return plain(vm.runInContext("getBuiltinMapDefinitions({ includeDisabled: true })", context));
}

function mapRow(map) {
  const cells = Array.isArray(map.geometry && map.geometry.cells) ? map.geometry.cells : [];
  const strategicPoints = Array.isArray(map.strategicPoints) ? map.strategicPoints : [];
  const terrain = cells.reduce((acc, cell) => {
    const key = String(cell.terrainType || "free");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const terrainSummary = Object.entries(terrain)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => `${key}:${count}`)
    .join(", ");
  return `| ${map.name} | \`${map.id}\` | ${map.playerCount} | ${cells.length} | ${strategicPoints.length} | ×${map.movementMultiplier || 1} | ${terrainSummary || "n/a"} |`;
}

function nestedRows(object, prefixes = []) {
  const rows = [];
  for (const [key, value] of Object.entries(object || {})) {
    if (value && typeof value === "object") rows.push(...nestedRows(value, [...prefixes, key]));
    else rows.push(`| ${[...prefixes, key].join(" / ")} | ${value} |`);
  }
  return rows;
}

function render() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "starter_1_0_manifest.json"), "utf8"));
  const assets = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "required_assets.json"), "utf8"));
  const mapsById = new Map(loadMaps().map(map => [map.id, map]));
  const officialMaps = manifest.catalogs.officialMaps.map(item => mapsById.get(item.id)).filter(Boolean);
  const legacyMaps = manifest.catalogs.legacyMaps;
  const s = manifest.summary;
  const a = assets.summary;
  const assetTotal = Object.values(a).reduce((total, group) => ({
    files: total.files + Number(group.files || 0),
    bytes: total.bytes + Number(group.bytes || 0)
  }), { files: 0, bytes: 0 });
  const lines = [
    "# Arena Rubra Starter 1.0 — Statistics Register",
    "",
    "> Generated file. Do not edit counts manually. Run `node tools/generate_starter_statistics_register.js` and verify with `--check`.",
    "",
    `- Content manifest: \`${manifest.manifestId}\``,
    `- Catalog hash: \`${manifest.catalogHash}\``,
    `- Source baseline recorded by manifest: \`${manifest.sourceBaseline}\``,
    `- Release target: ${manifest.releaseTarget}`,
    "",
    "## Frozen content totals",
    "",
    "| Catalog | Count |",
    "|---|---:|",
    `| Units | ${s.units} |`,
    `| Starter tactics | ${s.starterTactics} |`,
    `| Deck tactics | ${s.deckTactics} |`,
    `| Missions | ${s.missions} |`,
    `| Built-in decks | ${s.builtInDecks} |`,
    `| Official enabled maps | ${s.officialMaps} |`,
    `| Legacy disabled maps | ${s.legacyMaps} |`,
    `| Total classified content items | ${s.totalContentItems} |`,
    "",
    "## Units by faction and role",
    "",
    "| Faction / role | Count |",
    "|---|---:|",
    ...nestedRows(s.unitsByFactionAndRole),
    "",
    "## Tactics, missions and decks",
    "",
    "| Category / faction / class | Count |",
    "|---|---:|",
    ...nestedRows({
      starterTactics: s.starterTacticsByFaction,
      deckTactics: s.deckTacticsByFaction,
      missions: s.missionsByFactionAndClass,
      builtInDecks: s.builtInDecksByFactionAndCategory
    }),
    "",
    "## Official runtime maps",
    "",
    "| Map | ID | Players | Cells | PS | Movement | Terrain cell counts |",
    "|---|---|---:|---:|---:|---:|---|",
    ...officialMaps.map(mapRow),
    "",
    "Official map distribution: " + Object.entries(s.officialMapsByPlayerCount).map(([players, count]) => `${players}P=${count}`).join(", ") + ".",
    "",
    "## Legacy compatibility maps",
    "",
    "| Map | ID | Players | Runtime status | Decision |",
    "|---|---|---:|---|---|",
    ...legacyMaps.map(map => `| ${map.name} | \`${map.id}\` | ${map.playerCount} | disabled / invalid | ${map.decision} |`),
    "",
    "These maps remain resolvable only for storage compatibility; they are not part of the Starter 1.0 official map set.",
    "",
    "## Asset inventory",
    "",
    "| Classification | Files | Bytes |",
    "|---|---:|---:|",
    `| Required | ${a.required.files} | ${a.required.bytes} |`,
    `| Optional | ${a.optional.files} | ${a.optional.bytes} |`,
    `| DEV-only | ${a.devOnly.files} | ${a.devOnly.bytes} |`,
    `| Legacy | ${a.legacy.files} | ${a.legacy.bytes} |`,
    `| Unused | ${a.unused.files} | ${a.unused.bytes} |`,
    `| Total | ${assetTotal.files} | ${assetTotal.bytes} |`,
    "",
    "Required assets are integrity-checked by path, size and SHA-256. Optional ornaments may fall back without blocking play.",
    ""
  ];
  return lines.join("\n");
}

const expected = render();
if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, "utf8") : "";
  if (current !== expected) {
    console.error("FAIL: statistics register is missing or stale");
    process.exit(1);
  }
  console.log("PASS: Starter 1.0 statistics register is current");
} else {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, expected, "utf8");
  console.log(`Generated ${path.relative(ROOT, OUTPUT)}`);
}
