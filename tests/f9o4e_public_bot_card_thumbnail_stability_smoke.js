"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const ROOT = path.resolve(__dirname, "..");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");

const build = read("src/build_info.js");
ok(build.includes("C2-STABLE-1-F9O7g-APK-M4c") || build.includes("C2-STABLE-1-F9O7e-APK-M4c") || build.includes('C2-STABLE-1-F9O6-APK-M4c') || build.includes('C2-STABLE-1-F9O5b-APK-M4c') || build.includes('C2-STABLE-1-F9O5a-APK-M4c') || build.includes('C2-STABLE-1-F9O5-APK-M4c') || build.includes('C2-STABLE-1-F9O4f-APK-M4c') || build.includes('C2-STABLE-1-F9O4e-APK-M4c'), "metadata F9O4e o successiva");
ok(build.includes('logicBaseline: "C2-STABLE-1-F9O7f-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O7e-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O7d-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O7c-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O7b-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O6-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O5b-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O5-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O4f-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O4e-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O4d-APK-M4c"'), "baseline F9O4d/F9O4e");
ok(build.includes("Lezione 5 Fabeot") || build.includes("Lezione 4 Liberti") || build.includes("Lezione 3 Agathoi") || build.includes("Comandi Mano ridotta sotto le abilità di fazione") || build.includes("Tutorial UI State & Resume Hotfix") || build.includes("Lezione 1 Exordium") || build.includes("Tutorial Runtime Foundation") || build.includes("HQ Empty Objective Visual Hotfix") || build.includes("Token Motion & SFX Evaluation") || build.includes("Miniature Taxonomy & Asset Completion") || build.includes("Real Art Thumbnail Cache Finalization Hotfix") || build.includes("Public Bot Card Thumbnail Stability Hotfix"), "nome build F9O4e o successiva");

const config = read("data/cards_base.js");
ok(config.includes("publicBotHandThumbnailCacheF9O4e: true"), "flag cache miniature pubbliche");
ok(config.includes("publicBotCardPrewarmF9O4e: true"), "flag prewarm carte pubbliche");
ok(config.includes("hiddenBotCardArtBypassF9O4e: true"), "flag bypass art carte coperte");

const renderer = read("src/card_renderer.js");
ok(renderer.includes("CARD_RENDERER_HAND_THUMB_CACHE_LIMIT = 40"), "limite cache LRU");
ok(renderer.includes("function cardRendererStoreHandThumbnailSnapshot"), "store snapshot");
ok(renderer.includes("function cardRendererRestoreHandThumbnailSnapshot"), "restore snapshot");
ok(renderer.includes("function cardRendererPrewarmHandThumbnail"), "prewarm snapshot");
ok(renderer.includes("cardRendererHandThumbCache.delete(key);\n    cardRendererHandThumbCache.set(key, entry);"), "LRU touch");
ok(renderer.includes("cardRendererStoreHandThumbnailSnapshot(canvas, card, { ready, artSource:assetState.artSource });"), "snapshot aggiornato con stato art F9O4f");
ok(renderer.includes('card.id || card.sourceId || card.name || "card"'), "cache grafica indipendente dal cardUid");

const render = read("src/render.js");
ok(render.includes("function handThumbPrewarmPublicBotCards"), "prewarm bot-vs-bot");
ok(render.includes('state.modes[1] !== "bot" || state.modes[2] !== "bot"'), "prewarm limitato bot-vs-bot");
ok(render.includes("handCardHiddenFromViewer(side, card)"), "carte coperte escluse dal prewarm");
ok(render.includes("cardRendererRestoreHandThumbnailSnapshot(canvas, card)"), "restore sincrono prima della coda");
ok(render.includes("handThumbCardForCanvas(canvas)"), "resolver unico canvas-carta");

const hiddenStart = render.indexOf("function renderHiddenHandCardSlot");
const hiddenEnd = render.indexOf("function renderHandCardSlotDebug");
const hiddenBlock = render.slice(hiddenStart, hiddenEnd);
ok(hiddenStart >= 0 && hiddenEnd > hiddenStart, "blocco carte nascoste trovato");
ok(!hiddenBlock.includes("handCardThumbCanvas"), "le carte coperte non creano canvas illustrazione");

console.log(`F9O4e public bot card thumbnail stability smoke: ${checks}/${checks} OK`);
