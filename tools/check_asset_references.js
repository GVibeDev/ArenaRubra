"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const roots = ["index.html", "src", "data", "css", "locales"];
const sourceExtensions = new Set([".html", ".js", ".css", ".json"]);
const assetPattern = /assets\/[A-Za-z0-9_./~-]+\.(?:png|webp|jpe?g|mp3|wav|ogg)/gi;
const optionalMissingCandidates = new Set([
  "assets/audio/theme-nexus.mp3", "assets/audio/theme-exordium.mp3", "assets/audio/theme-liberti.mp3", "assets/audio/theme-agathoi.mp3", "assets/audio/theme-fabeot.mp3",
  "assets/audio/theme-victory-rubra-triumphant.mp3", "assets/audio/triumphant.mp3", "assets/audio/losers.mp3",
  "assets/audio/sfx/attack.ogg", "assets/audio/sfx/attack.mp3", "assets/audio/sfx/impact.ogg", "assets/audio/sfx/impact.mp3",
  "assets/audio/sfx/destruction.ogg", "assets/audio/sfx/destruction.mp3", "assets/audio/sfx/ability.ogg", "assets/audio/sfx/ability.mp3"
]);

function sources(target) {
  const absolute = path.join(root, target);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return sourceExtensions.has(path.extname(absolute).toLowerCase()) ? [absolute] : [];
  return fs.readdirSync(absolute, { withFileTypes:true }).flatMap(entry => sources(path.relative(root, path.join(absolute, entry.name))));
}

const references = new Map();
for (const source of roots.flatMap(sources)) {
  const text = fs.readFileSync(source, "utf8");
  for (const match of text.matchAll(assetPattern)) {
    const assetPath = match[0].replaceAll("\\", "/");
    if (!references.has(assetPath)) references.set(assetPath, new Set());
    references.get(assetPath).add(path.relative(root, source).split(path.sep).join("/"));
  }
}

const absent = [...references].filter(([assetPath]) => !fs.existsSync(path.join(root, assetPath)));
const missing = absent.filter(([assetPath]) => !optionalMissingCandidates.has(assetPath));
const fallbackCandidates = absent.filter(([assetPath]) => optionalMissingCandidates.has(assetPath));
console.log(`S2-C6 literal asset references: ${missing.length ? "FAIL" : "PASS"} (${references.size} unique references; ${fallbackCandidates.length} declared fallback candidates absent)`);
for (const [assetPath, sourceFiles] of missing) console.error(`- missing ${assetPath} referenced by ${[...sourceFiles].join(", ")}`);
if (missing.length) process.exitCode = 1;

module.exports = { fallbackCandidates, optionalMissingCandidates, references, missing };
