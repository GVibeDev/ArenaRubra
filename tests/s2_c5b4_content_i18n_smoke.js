"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const ArenaI18nCore = require("../src/i18n/core");

const root = path.resolve(__dirname, "..");
const dictionaries = Object.fromEntries(["it", "en"].map(language => [language, JSON.parse(fs.readFileSync(path.join(root, "locales", `${language}.json`), "utf8"))]));
let language = "en";
const service = ArenaI18nCore.create({ dictionaries, readLanguage: () => language });
global.ArenaI18n = { has: service.has, t: service.t };
const content = require("../src/i18n/content");

assert.strictEqual(content.text("terrains", "defensive", "name", "Difensivo"), "Defensive");
assert.strictEqual(content.text("maps", "map1_starter", "name", "Campo Starter"), "Starter Battlefield");
assert.strictEqual(content.taxonomy("types", "Fanteria"), "Infantry");
assert.strictEqual(content.taxonomy("weights", "Pesante"), "Heavy");
assert.strictEqual(content.text("units", "UNKNOWN", "name", "Fallback"), "Fallback");
assert.deepStrictEqual(content.project("terrains", { id:"exposed", name:"Scoperto", movementCost:1 }), { id:"exposed", name:"Exposed", movementCost:1 });
assert.strictEqual(content.key("maps", "map10_snow_bf_4pl_3x", "description"), "content.maps.map10_snow_bf_4pl_3x.description");
const gate = spawnSync(process.execPath, [path.join(root, "tools/check_content_locales.js")], { cwd:root, encoding:"utf8" });
assert.strictEqual(gate.status, 0, gate.stderr || gate.stdout);
assert(gate.stdout.includes("10 KEEP maps, 5 terrains"));
const frozen = spawnSync(process.execPath, [path.join(root, "tools/generate_starter_1_0_manifest.js"), "--check"], { cwd:root, encoding:"utf8" });
assert.strictEqual(frozen.status, 0, frozen.stderr || frozen.stdout);
assert(frozen.stdout.includes("eab4dadff4d9f6d4bc8e99bd38d7331e4d1559e69d40547b0039a75c1f140709"));

console.log("S2-C5b4 content i18n smoke: 11/11 OK");
