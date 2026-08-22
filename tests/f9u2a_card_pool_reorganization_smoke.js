"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const html = read("index.html");
const css = read("css/style.css");
const poolSource = read("src/card_pool.js");
const buildSource = read("src/build_info.js");
const calibrationSource = read("src/renderer_calibration_lab.js");

const context = {
  console,
  document: undefined,
  cardRendererStat: (card, key) => Number.isFinite(card[key]) ? card[key] : null,
  cardRendererSourceBlueprint: card => card.blueprint || null,
  cardRendererDescriptionText: card => card.effectText || card.description || "",
  cardRendererNormalizeDescription: text => String(text || "").replace(/\s+/g, " ").trim(),
  cardRendererPassiveEntries: card => card.passives || [],
  cardRendererTypeText: card => card.typeLabel || "UNITÀ",
};
vm.createContext(context);
vm.runInContext(`${buildSource}\n${poolSource}\n;globalThis.__build=BUILD_INFO;globalThis.__stats=cardPoolPreviewStatsHtml;globalThis.__abilities=cardPoolAbilitiesHtml;globalThis.__technical=cardPoolTechnicalHtml;`, context, { filename:"f9u2a-smoke.js" });
const build = context.__build;

assert.equal(build.version, "C2-STABLE-1-F9V2b-APK-M4c");
assert.equal(build.buildName, "Tutorial Challenge I · Elimination");
assert.equal(build.buildChannel, "starter2-tutorial-v2b");
assert.equal(build.logicBaseline, "C2-STABLE-1-F9T2c4-APK-M4c");
assert.ok(build.notes.includes("Pool carte"));
assert.ok(build.notes.includes("F9Q3e1-2"));
assert.ok(build.notes.includes("stato autorevole"));

const headerStart = html.indexOf('<header class="deckBuilderHeader cardPoolHeader">');
const headerEnd = html.indexOf('</header>', headerStart);
const header = html.slice(headerStart, headerEnd);
assert.ok(headerStart >= 0 && headerEnd > headerStart);
assert.ok(header.indexOf('Deck Builder') < header.indexOf('Card Editor'));
assert.ok(header.indexOf('Card Editor') < header.indexOf('Duplica selezionata'));
assert.ok(header.indexOf('Duplica selezionata') < header.indexOf('Menu principale'));
assert.ok(!header.includes('cardPoolCopySelectedBtn'));
assert.ok(!header.includes('cardPoolCopyManifestBtn'));

const toolbarStart = html.indexOf('<div class="cardPoolPreviewToolbar"');
const toolbarEnd = html.indexOf('</div>\n        <div class="cardPoolPreviewLayout">', toolbarStart);
const toolbar = html.slice(toolbarStart, toolbarEnd);
assert.ok(toolbar.includes('cardPoolViewModeGroup'));
assert.ok(toolbar.includes('cardPoolNavGroup'));
assert.ok(toolbar.includes('cardPoolFocusGroup'));
assert.ok(toolbar.indexOf('cardPoolPrevBtn') < toolbar.indexOf('cardPoolSelectionCounter'));
assert.ok(toolbar.indexOf('cardPoolSelectionCounter') < toolbar.indexOf('cardPoolNextBtn'));
assert.ok(toolbar.indexOf('cardPoolNextBtn') < toolbar.indexOf('cardPoolFullscreenOpenBtn'));
assert.ok(html.includes('id="cardPoolDebugDetails"'));
assert.ok(html.includes('<summary class="ghost cardPoolDebugSummary">Debug</summary>'));
assert.ok(html.indexOf('id="cardPoolCopySelectedBtn"') > html.indexOf('id="cardPoolDebugDetails"'));
assert.ok(html.indexOf('id="cardPoolCopyManifestBtn"') > html.indexOf('id="cardPoolDebugDetails"'));
assert.ok(html.includes('class="deckBuilderPreviewInfo cardPoolSelectedInfoBox"'));
assert.ok(calibrationSource.includes('#cardPoolScreen .cardPoolDebugActions'));
assert.ok(!calibrationSource.includes('#cardPoolScreen .deckBuilderHeaderActions'));

const unit = {
  id:"TEST01", name:"Unità prova", faction:"Nexus", sourceType:"unit", deckRole:"elite",
  cost:4, hp:5, def:2, att:4, typeLabel:"FANTERIA ELITE",
  blueprint:{ability:{name:"Impulso",cost:2,cooldown:3,range:2,target:"enemy",description:"Infligge pressione al bersaglio."}},
  passives:[{name:"Visione",description:"Rileva unità furtive entro R2."}],
  description:"Testo generale della carta."
};
const unitStats = vm.runInContext(`__stats(${JSON.stringify(unit)})`, context);
const unitAbilities = vm.runInContext(`__abilities(${JSON.stringify(unit)})`, context);
assert.ok(unitStats.includes('cardPoolLargeStats'));
assert.ok(unitStats.includes('>ENE<') && unitStats.includes('>HP<') && unitStats.includes('>DEF<') && unitStats.includes('>ATT<'));
assert.ok(unitAbilities.includes('Abilità attiva · Impulso'));
assert.ok(unitAbilities.includes('Costo 2 ENE'));
assert.ok(unitAbilities.includes('CD 3'));
assert.ok(unitAbilities.includes('R2'));
assert.ok(unitAbilities.includes('Passive e tratti'));
assert.ok(unitAbilities.includes('Visione'));

const tactic = {id:"TACT01",name:"Tattica prova",faction:"Nexus",sourceType:"tactic",cost:2,effectText:"Pesca due carte.",typeLabel:"TATTICA"};
const tacticAbilities = vm.runInContext(`__abilities(${JSON.stringify(tactic)})`, context);
assert.ok(tacticAbilities.includes('Effetto tattica'));
assert.ok(tacticAbilities.includes('Pesca due carte.'));
assert.ok(!tacticAbilities.includes('Abilità attiva'));

const tech = vm.runInContext(`__technical(${JSON.stringify(unit)}, ${JSON.stringify({framePath:'frames/nexus.webp',artPath:'art/test.webp',artCandidatePaths:['a.webp','b.png'],recommendedArtSize:'1664x1700',recommendedColorDepth:'24-bit'})})`, context);
assert.ok(tech.includes('Card ID:'));
assert.ok(tech.includes('TEST01'));
assert.ok(tech.includes('frames/nexus.webp'));
assert.ok(tech.includes('a.webp | b.png'));
assert.ok(tech.includes('1664x1700'));

assert.ok(poolSource.includes('function cardPoolActiveAbility'));
assert.ok(poolSource.includes('function cardPoolAbilitiesHtml'));
assert.ok(poolSource.includes('function cardPoolTechnicalHtml'));
assert.ok(poolSource.includes('document.getElementById("cardPoolDebugBody")'));
assert.ok(!poolSource.includes('<div class="deckBuilderPreviewPaths">\n      <div><strong>Card ID:'));
assert.ok(css.includes('F9U2a – Card Pool Reorganization'));
assert.ok(css.includes('.cardPoolHeaderActions'));
assert.ok(css.includes('.cardPoolSelectedInfoBox'));
assert.ok(css.includes('.cardPoolLargeStats'));
assert.ok(css.includes('.cardPoolAbilitySection p'));
assert.ok(css.includes('.cardPoolDebugDetails'));
assert.ok(css.includes('font-size: 15px'));

console.log("F9U2a Card Pool Reorganization smoke: 54/54 verifiche superate");
