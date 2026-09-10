"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const ArenaI18nCore = require("../src/i18n/core");

const root = path.resolve(__dirname, "..");
const fragmentNames = ["content/units", "content/unit_text", "content/tactics", "content/missions", "content/decks", "content/tutorial_text", "ui/tools"];
function mergeLocale(target, source) {
  const merged = { ...(target || {}) };
  Object.entries(source || {}).forEach(([key, value]) => {
    merged[key] = value && typeof value === "object" && !Array.isArray(value)
      ? mergeLocale(merged[key], value)
      : value;
  });
  return merged;
}
function readLocale(language) {
  const base = JSON.parse(fs.readFileSync(path.join(root, "locales", `${language}.json`), "utf8"));
  return fragmentNames.reduce((dictionary, fragment) => mergeLocale(dictionary,
    JSON.parse(fs.readFileSync(path.join(root, "locales", `${fragment}.${language}.json`), "utf8"))
  ), base);
}
const it = readLocale("it");
const en = readLocale("en");
const report = ArenaI18nCore.audit({ it, en });
assert.strictEqual(report.ok, true, report.errors.join("\n"));
assert(report.keys >= 21);
assert.deepStrictEqual(report.languages, ["it", "en"]);
assert.deepStrictEqual(ArenaI18nCore.placeholders(it.language.changed), ["language"]);
assert.deepStrictEqual(ArenaI18nCore.placeholders(en.language.changed), ["language"]);
const cli = spawnSync(process.execPath, [path.join(root, "tools", "check_locales.js")], { cwd: root, encoding: "utf8" });
assert.strictEqual(cli.status, 0, cli.stderr);
assert(cli.stdout.includes(`PASS (${report.keys} keys × 2 languages`));
console.log("S2-C5b1 locale parity smoke: 7/7 OK");
