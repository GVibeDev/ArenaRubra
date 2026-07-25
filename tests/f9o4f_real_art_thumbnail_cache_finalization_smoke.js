"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const ROOT = path.resolve(__dirname, "..");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");

const build = read("src/build_info.js");
ok(build.includes("C2-STABLE-1-F9O7g-APK-M4c") || build.includes("C2-STABLE-1-F9O7e-APK-M4c") || build.includes('C2-STABLE-1-F9O6-APK-M4c') || build.includes('C2-STABLE-1-F9O5b-APK-M4c') || build.includes('C2-STABLE-1-F9O5a-APK-M4c') || build.includes('C2-STABLE-1-F9O5-APK-M4c') || build.includes('C2-STABLE-1-F9O4f-APK-M4c'), "metadata F9O4f");
ok(build.includes('logicBaseline: "C2-STABLE-1-F9O7f-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O7e-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O7d-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O7c-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O7b-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O6-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O5b-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O5-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O4f-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O4e-APK-M4c"'), "baseline F9O4e");
ok(build.includes("Lezione 5 Fabeot") || build.includes("Lezione 4 Liberti") || build.includes("Lezione 3 Agathoi") || build.includes("Comandi Mano ridotta sotto le abilità di fazione") || build.includes("Tutorial UI State & Resume Hotfix") || build.includes("Lezione 1 Exordium") || build.includes("Tutorial Runtime Foundation") || build.includes("HQ Empty Objective Visual Hotfix") || build.includes("Token Motion & SFX Evaluation") || build.includes("Miniature Taxonomy & Asset Completion") || build.includes("Real Art Thumbnail Cache Finalization Hotfix"), "nome build");

const config = read("data/cards_base.js");
ok(config.includes("realArtThumbnailFinalizationF9O4f: true"), "flag finalizzazione arte reale");
ok(config.includes("provisionalPlaceholderCacheF9O4f: true"), "flag placeholder provvisorio");

const renderer = read("src/card_renderer.js");
ok(renderer.includes("function cardRendererImagePathsState"), "stato distinto dei gruppi immagine");
ok(renderer.includes("function cardRendererPreviewAssetState"), "stato completo asset preview");
ok(renderer.includes('realArt: realArtPaths.filter(Boolean)'), "candidati reali separati");
ok(renderer.includes("const realLoaded = realArtState === \"loaded\""), "successo arte reale esplicito");
ok(renderer.includes("const realExhausted = realArtState === \"error\" || realArtState === \"empty\""), "esaurimento candidati reale esplicito");
ok(renderer.includes("const artSettled = realLoaded || (realExhausted && placeholderSettled)"), "placeholder non finalizza mentre reale pending");
ok(renderer.includes('canvas.dataset.cardArtState = assetState.artSource'), "diagnostica sorgente arte");
ok(renderer.includes('canvas.removeAttribute("data-thumb-rendered")'), "snapshot pending non marcato definitivo");
ok(renderer.includes("function cardRendererHandThumbQualityRank"), "ranking qualità cache");
ok(renderer.includes("qualityRank > previousRank"), "snapshot migliore sostituisce provvisorio");
ok(renderer.includes('canvas.dataset.handThumbPrewarm === "1"'), "prewarm riconosciuto fuori DOM");
ok(renderer.includes("(!canvas.isConnected && !isPrewarmCanvas)"), "redraw detached ammesso solo per prewarm");

const render = read("src/render.js");
ok(render.includes('canvas.dataset.cardRenderState === "ready"'), "queue marca finale solo se ready");
ok(render.includes('canvas.removeAttribute("data-thumb-rendered")'), "queue mantiene pending eleggibile");

const doc = read("docs/F9O4F_REAL_ART_THUMBNAIL_CACHE_FINALIZATION_HOTFIX.md");
ok(doc.includes("placeholder caricato resta soltanto provvisorio"), "contratto documentato");

console.log(`F9O4f real art thumbnail cache finalization smoke: ${checks}/${checks} OK`);
