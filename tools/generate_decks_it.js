"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.resolve(__dirname, "..");
const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "data/builtin_decks.js"), "utf8"), context);
const decks = vm.runInContext("BUILTIN_DECKS", context);
const output = { content:{ decks:Object.fromEntries(Object.entries(decks).map(([id, deck]) => [id, { name:deck.deckName || deck.name }])) } };
const outputPath = path.join(root, "locales/content/decks.it.json");
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Generated ${path.relative(root, outputPath)} (${Object.keys(decks).length} decks).`);
