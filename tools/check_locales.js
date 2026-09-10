"use strict";

const fs = require("fs");
const path = require("path");
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
const dictionaries = Object.fromEntries(ArenaI18nCore.SUPPORTED_LANGUAGES.map(language => {
  const base = JSON.parse(fs.readFileSync(path.join(root, "locales", `${language}.json`), "utf8"));
  const dictionary = fragmentNames.reduce((result, fragment) => mergeLocale(result,
    JSON.parse(fs.readFileSync(path.join(root, "locales", `${fragment}.${language}.json`), "utf8"))
  ), base);
  return [language, dictionary];
}));
const report = ArenaI18nCore.audit(dictionaries);
const errors = [...report.errors];
for (const language of ArenaI18nCore.SUPPORTED_LANGUAGES) {
  if (dictionaries[language].meta.code !== language) errors.push(`${language}: meta.code mismatch`);
}
const reference = ArenaI18nCore.flattenDictionary(dictionaries.it);
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const boundKeys = [...indexSource.matchAll(/data-i18n(?:-aria-label|-title|-placeholder)?="([^"]+)"/g)].map(match => match[1]);
const runtimeSources = ["src/app.js", "src/card_motion.js", "src/card_renderer.js", "src/control_center.js", "src/deck.js", "src/deployment.js", "src/economy.js", "src/event_overlay.js", "src/game_screen.js", "src/mission_rewards.js", "src/mission_ui.js", "src/missions.js", "src/render.js", "src/tutorial_runtime.js", "src/ui.js", "src/card_pool.js", "src/deck_builder.js"]
  .map(file => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const runtimeKeys = [...runtimeSources.matchAll(/(?:appI18n|controlCenterI18n|gameScreenI18n|renderI18n|tutorialRuntimeI18n|arenaI18nText|arenaProductProfileI18nF9W2a)\(\s*"([^"]+)"/g)].map(match => match[1]);
const prefixedRuntimeKeys = [
  ...[...runtimeSources.matchAll(/missionUiText\(\s*"([^"]+)"/g)].map(match => `missionUi.${match[1]}`),
  ...[...runtimeSources.matchAll(/eventOverlayText\(\s*"([^"]+)"/g)].map(match => `eventOverlay.${match[1]}`),
  ...[...runtimeSources.matchAll(/cardPoolI18n\(\s*"([^"]+)"/g)].map(match => `tools.cardPool.${match[1]}`),
  ...[...runtimeSources.matchAll(/deckBuilderI18n\(\s*"([^"]+)"/g)].map(match => `tools.deckBuilder.${match[1]}`),
  ...[...runtimeSources.matchAll(/controlCenterToolI18n\(\s*"([^"]+)"/g)].map(match => `tools.controlCenter.${match[1]}`)
  ,...[...runtimeSources.matchAll(/cardRendererText\(\s*"([^"]+)"/g)].map(match => `cardRenderer.${match[1]}`)
  ,...[...runtimeSources.matchAll(/deploymentI18n\(\s*"([^"]+)"/g)].map(match => `game.${match[1]}`)
  ,...[...runtimeSources.matchAll(/economyI18n\(\s*"([^"]+)"/g)].map(match => `game.${match[1]}`)
  ,...[...runtimeSources.matchAll(/missionRewardI18n\(\s*"([^"]+)"/g)].map(match => `missionUi.playReasons.${match[1]}`)
  ,...[...runtimeSources.matchAll(/missionTrackerI18n\(\s*"([^"]+)"/g)].map(match => `missionUi.trackerDetails.${match[1]}`)
  ,...[...runtimeSources.matchAll(/cardMotionI18n\(\s*"([^"]+)"/g)].map(match => `game.cardMotion.${match[1]}`)
];
const requiredKeys = [...new Set([...boundKeys, ...runtimeKeys, ...prefixedRuntimeKeys])];
for (const key of requiredKeys) if (!Object.prototype.hasOwnProperty.call(reference, key)) errors.push(`runtime: missing key ${key}`);

console.log(`S2-C5b locale gate: ${report.ok && errors.length === 0 ? "PASS" : "FAIL"} (${report.keys} keys × ${report.languages.length} languages; ${requiredKeys.length} runtime bindings)`);
for (const error of errors) console.error(`- ${error}`);
if (!report.ok || errors.length) process.exitCode = 1;
