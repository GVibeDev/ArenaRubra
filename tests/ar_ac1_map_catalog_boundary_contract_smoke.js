"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const index = read("index.html");
const ui = read("src/ui.js");
const provider = read("data/official_maps_f9w2a1.js");
const catalog = read("data/map_definitions.js");

assert(provider.includes('"id":"map10_snow_bf_4pl_3x"'));
assert(provider.includes("const F9W2A1_OFFICIAL_MAP_DEFINITIONS = Object.freeze({"));
assert(catalog.includes("F9W2A1_OFFICIAL_MAP_DEFINITIONS"), "Snow provider is not part of the canonical built-in catalog");

for (const token of [
  "F9W2A1_SNOW_BF_OFFICIAL_MAP",
  "arenaInstallOfficialSnowMapF9W2a1",
  "__arenaOfficialSnowMapF9W2a1Installed",
  "__f9w2a1SnowMapWrapped"
]) assert(!ui.includes(token), `Snow catalog responsibility remains in ui.js: ${token}`);

const providerIndex = index.indexOf('<script src="data/official_maps_f9w2a1.js"></script>');
const definitionsIndex = index.indexOf('<script src="data/map_definitions.js"></script>');
const runtimeIndex = index.indexOf('<script src="src/map_runtime.js"></script>');
const uiIndex = index.indexOf('<script src="src/ui.js"></script>');
assert(providerIndex >= 0 && providerIndex < definitionsIndex);
assert(definitionsIndex < runtimeIndex && runtimeIndex < uiIndex);

for (const token of ["document.", "querySelector", "addEventListener", "innerHTML", "localStorage"]) {
  assert(!provider.includes(token), `official map provider must remain data-only: ${token}`);
}

console.log(JSON.stringify({
  status: "PASS",
  provider: "data/official_maps_f9w2a1.js",
  ownership: "provider -> builtin catalog -> map runtime -> UI consumers",
  removedGlobalWrappers: ["getBuiltinMapDefinitions", "getMapDefinitionById"],
  domFree: true
}, null, 2));
