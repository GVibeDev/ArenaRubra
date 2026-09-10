"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ArenaI18nCore = require("../src/i18n/core");

const root = path.resolve(__dirname, "..");
const dictionaries = Object.fromEntries(["it", "en"].map(language => [language, JSON.parse(fs.readFileSync(path.join(root, "locales", `${language}.json`), "utf8"))]));
let persisted = "en-US";
let changed = null;
const service = ArenaI18nCore.create({
  dictionaries,
  readLanguage: () => persisted,
  writeLanguage: language => { persisted = language; },
  onLanguageChanged: language => { changed = language; }
});

assert.deepStrictEqual(service.availableLanguages(), ["it", "en"]);
assert.strictEqual(service.currentLanguage(), "en");
assert.strictEqual(service.t("common.save"), "Save");
assert.strictEqual(service.t("language.changed", { language: "English" }), "Language set to English.");
assert.strictEqual(service.setLanguage("it-IT"), "it");
assert.strictEqual(persisted, "it");
assert.strictEqual(changed, "it");
assert.strictEqual(service.t("common.save"), "Salva");
assert.strictEqual(service.t("unknown.key"), "unknown.key");
assert.strictEqual(service.has("common.close"), true);
assert.strictEqual(service.has("unknown.key"), false);
assert.strictEqual(service.audit().ok, true);
assert.throws(() => ArenaI18nCore.create({ dictionaries: { it: dictionaries.it, en: {} } }), /Invalid locale dictionaries/);
console.log("S2-C5b1 i18n core smoke: 12/12 OK");
