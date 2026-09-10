"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DOC_ROOT = path.join(ROOT, "docs", "release");
const requiredDocs = [
  "STARTER_1_0_RULEBOOK_IT.md",
  "STARTER_1_0_RULEBOOK_EN.md",
  "STARTER_1_0_PLAYER_GUIDE_IT_EN.md",
  "STARTER_1_0_GLOSSARY_IT_EN.md",
  "STARTER_1_0_STATISTICS_REGISTER.md",
  "STARTER_1_0_DEV_GUIDE.md",
  "STARTER_1_0_CHANGELOG.md",
  "STARTER_1_0_WEBSITE_CANONICAL_COPY.md",
  "STARTER_1_0_CREDITS_LICENSES.md"
];
const failures = [];
const pass = condition => Boolean(condition);
const expect = (condition, message) => { if (!pass(condition)) failures.push(message); };
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");

for (const name of requiredDocs) {
  const absolute = path.join(DOC_ROOT, name);
  expect(fs.existsSync(absolute), `missing document: ${name}`);
  if (fs.existsSync(absolute)) expect(fs.statSync(absolute).size >= 250, `document too small: ${name}`);
}

const generation = spawnSync(process.execPath, [path.join(ROOT, "tools", "generate_starter_statistics_register.js"), "--check"], { encoding: "utf8" });
expect(generation.status === 0, (generation.stderr || generation.stdout || "statistics generator failed").trim());

const manifest = JSON.parse(read("data/starter_1_0_manifest.json"));
const stats = read("docs/release/STARTER_1_0_STATISTICS_REGISTER.md");
for (const [label, value] of Object.entries({
  Units: manifest.summary.units,
  "Starter tactics": manifest.summary.starterTactics,
  "Deck tactics": manifest.summary.deckTactics,
  Missions: manifest.summary.missions,
  "Built-in decks": manifest.summary.builtInDecks,
  "Official enabled maps": manifest.summary.officialMaps
})) expect(stats.includes(`| ${label} | ${value} |`), `statistics mismatch: ${label}`);
expect(stats.includes(manifest.catalogHash), "statistics register lacks frozen catalog hash");
for (const map of manifest.catalogs.officialMaps) {
  expect(stats.includes(`| ${map.name} | \`${map.id}\``), `official map absent from statistics: ${map.id}`);
}
for (const map of manifest.catalogs.legacyMaps) {
  expect(stats.includes(`| ${map.name} | \`${map.id}\``), `legacy map absent from statistics: ${map.id}`);
}

const it = read("docs/release/STARTER_1_0_RULEBOOK_IT.md");
const en = read("docs/release/STARTER_1_0_RULEBOOK_EN.md");
const website = read("docs/release/STARTER_1_0_WEBSITE_CANONICAL_COPY.md");
const devGuide = read("docs/release/STARTER_1_0_DEV_GUIDE.md");
const credits = read("docs/release/STARTER_1_0_CREDITS_LICENSES.md");
const allCanonical = requiredDocs.filter(name => fs.existsSync(path.join(DOC_ROOT, name))).map(name => fs.readFileSync(path.join(DOC_ROOT, name), "utf8")).join("\n");

for (const marker of ["2–4", "3 ENE", "30 carte", "5 carte", "cap 10", "5 ENE", "Advanced", "DEV/sperimentale", "Desktop/Web"]) {
  expect(it.includes(marker), `Italian rulebook missing marker: ${marker}`);
}
for (const marker of ["2–4", "3 ENE", "30 cards", "5 cards", "capped at 10", "5 ENE", "Advanced", "DEV/experimental", "Desktop/Web"]) {
  expect(en.includes(marker), `English rulebook missing marker: ${marker}`);
}
expect(/Advanced is the highest official Starter 1\.0 level/.test(en), "Advanced public ceiling not explicit");
expect(/Expert is a DEV\/experimental feature/.test(en), "Expert experimental boundary not explicit");
expect(/Android is not a requirement/.test(website), "website release scope does not exclude Android requirement");
expect(devGuide.includes("Never label a build validated"), "DEV guide lacks validation-label guard");
expect(credits.includes("Mozilla Public License 2.0"), "credits lack MPL 2.0 notice");
expect(credits.includes("all rights reserved"), "credits lack reserved-assets notice");
expect(!/Android (?:APK|package|build) (?:is|required|must)/i.test(allCanonical), "canonical docs introduce an Android requirement");
expect(!/Expert (?:is|as) (?:the )?(?:official|supported|production)/i.test(allCanonical), "canonical docs incorrectly promote Expert");
expect(!/\bVALIDATA\b/.test(allCanonical), "canonical docs contain forbidden human-validation claim");

const constants = read("src/constants.js");
const board = read("src/board.js");
const deck = read("data/cards_base.js");
const victory = read("src/rules/victory_lifecycle.js");
const pressure = read("src/rules/pressure_victory.js");
expect(constants.includes("const START_ENE = 3"), "runtime start ENE drift");
expect(constants.includes("pressureBaseRound:20") && constants.includes("pressureWin:7") && constants.includes("maxRound:50"), "standard pace drift");
expect(constants.includes("pressureWin:5") && constants.includes("maxRoundBase:30"), "competitive pace drift");
expect(board.includes("Math.ceil((Math.max(0, ps) + Math.max(2, players)) / 2)"), "pressure map scale drift");
expect(deck.includes("deckSize: 30") && deck.includes("initialHandSize: 5") && deck.includes("maxHandSize: 10"), "deck contract drift");
expect(deck.includes("deckRecoveryCost: 5") && deck.includes("deckRecoveryDraw: 3"), "deck recovery drift");
expect(victory.includes("countControlledPS(occupant.side) >= 1"), "HQ victory prerequisite drift");
expect(pressure.includes("Math.ceil(total / 2)"), "pressure majority drift");
expect(pressure.includes("b.ps - a.ps || b.units - a.units || b.ene - a.ene"), "round tiebreak drift");

if (failures.length) {
  console.error(`FAIL: DOC-FREEZE (${failures.length} issue${failures.length === 1 ? "" : "s"})`);
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
console.log(`PASS: DOC-FREEZE (${requiredDocs.length} canonical documents, ${manifest.summary.officialMaps} official maps, catalog ${manifest.catalogHash})`);
