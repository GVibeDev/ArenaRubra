"use strict";

const fs = require("fs");
const assert = require("assert");
const vm = require("vm");
const read = file => fs.readFileSync(file, "utf8");
let n = 0;
const ok = (value, message) => { assert.ok(value, message); n += 1; };

const index = read("index.html");
const build = read("src/build_info.js");
const maps = read("src/map_skins.js");
const audio = read("src/audio_manager.js");
const presentation = read("src/presentation_theme.js");
const game = read("src/game.js");
const rules = read("src/rules.js");
const app = read("src/app.js");
const css = read("css/style.css");
const config = read("data/cards_base.js");

ok(build.includes("C2-STABLE-1-F9O7g-APK-M4c") || build.includes("C2-STABLE-1-F9O7e-APK-M4c") || build.includes("C2-STABLE-1-F9O6-APK-M4c") || build.includes("C2-STABLE-1-F9O5b-APK-M4c") || build.includes("C2-STABLE-1-F9O5a-APK-M4c") || build.includes("C2-STABLE-1-F9O5-APK-M4c") || build.includes("C2-STABLE-1-F9O4f-APK-M4c") || build.includes("C2-STABLE-1-F9O4f-APK-M4c") || build.includes("C2-STABLE-1-F9O4e-APK-M4c") || build.includes("C2-STABLE-1-F9O4d-APK-M4c") || build.includes("C2-STABLE-1-F9O4c-APK-M4c") || build.includes("C2-STABLE-1-F9O4b-APK-M4c") || build.includes("C2-STABLE-1-F9O4a-APK-M4c") || build.includes("C2-STABLE-1-F9O4-APK-M4c") || build.includes("C2-STABLE-1-F9O3-APK-M4c") || build.includes("C2-STABLE-1-F9O2e-APK-M4c") || build.includes("C2-STABLE-1-F9O2d-APK-M4c") || build.includes("C2-STABLE-1-F9O2c-APK-M4c") || build.includes("C2-STABLE-1-F9O2b-APK-M4c") || build.includes("C2-STABLE-1-F9O2a-APK-M4c") || build.includes("C2-STABLE-1-F9O2-APK-M4c") || build.includes("C2-STABLE-1-F9O1b-APK-M4c"), "build F9O1 o successiva");
ok(build.includes("lesson-5-fabeot") || build.includes("lesson-4-liberti") || build.includes("lesson-3-agathoi") || build.includes("collapsed-hand-controls-reflow") || build.includes("tutorial-lesson-2-nexus") || build.includes("tutorial-ui-state-resume-hotfix") || build.includes("lesson-1-exordium") || build.includes("tutorial-runtime-foundation") || build.includes("hq-empty-objective-visual-hotfix") || build.includes("token-motion-sfx-evaluation") || build.includes("miniature-taxonomy-asset-completion") || build.includes("real-art-thumbnail-cache-finalization-hotfix") || build.includes("public-bot-card-thumbnail-stability-hotfix") || build.includes("cross-platform-render-signature-integrity-hotfix") || build.includes("android-render-stability-hotfix") || build.includes("incremental-dom-renderer") || build.includes("android-camera-performance-hotfix") || build.includes("hidden-bot-hand-card-backs-motion") || build.includes("event-narrative-overlay-foundation") || build.includes("mission-accessibility-build-flow") || build.includes("token-layering-active-unit-cues") || build.includes("bot-camera-freeze-hotfix") || build.includes("camera-autonomy-inspection") || build.includes("camera-deployment-click-hotfix") || build.includes("interactive-map-camera-foundation") || build.includes("music-controls-persistent-volume"), "canale F9O1b o successivo");
ok(config.includes("factionPresentationRuntimeF9O1: true"), "flag tema");
ok(config.includes("postMatchAudioPlaylistF9O1: true"), "flag playlist");
ok(index.indexOf('src/audio_manager.js') < index.indexOf('src/splash.js'), "audio manager prima dello splash");
ok(index.indexOf('src/presentation_theme.js') < index.indexOf('src/game.js'), "presentation prima del lifecycle");
ok(maps.includes('key: "exordium_battlegrounds"'), "skin Exordium");
ok(maps.includes('mapSkinAssetUrl("battlegrounds.webp")'), "asset battlegrounds");
ok(maps.includes('key: "fabeot_velvet_hoods"'), "skin Fabeot");
ok(maps.includes('mapSkinAssetUrl("velvet_hoods.webp")'), "asset velvet hoods");
ok(presentation.includes('mapSkinKey: "basalt_night"'), "Nexus basalt night");
ok(presentation.includes('mapSkinKey: "red_dust"'), "Liberti red dust");
ok(presentation.includes('mapSkinKey: "overgrowth_ruins"'), "Agathoi ruins");
ok(audio.includes('theme-defeat-rubra-losers.mp3'), "traccia losers");
ok(audio.includes('theme-victory-rubra-triumphant.mp3'), "traccia triumphant");
ok(audio.includes('432-hertz-rift.mp3'), "traccia menu");
ok(game.includes('arenaPresentationApplyForGame({ music: true'), "hook nuova partita");
ok(rules.includes('arenaAudioHandleMatchEnd({'), "hook fine partita");
ok(app.includes('arenaPresentationResetForMenu'), "reset menu");
ok(app.includes('arenaAudioResumeForState'), "resume audio");
ok(css.includes('data-arena-faction-theme="exordium"'), "palette Exordium");
ok(css.includes('data-arena-faction-theme="fabeot"'), "palette Fabeot");

const context = {
  console,
  setTimeout,
  clearTimeout,
  Math,
  Promise,
  document: undefined,
  state: null
};
vm.createContext(context);
vm.runInContext(audio, context, { filename: "audio_manager.js" });

ok(context.arenaAudioTrackForFaction("Nexus") === "faction_nexus", "track Nexus");
ok(context.arenaAudioTrackForFaction("Exordium") === "faction_exordium", "track Exordium");
ok(context.arenaAudioTrackForFaction("Fabeot") === "faction_fabeot", "track Fabeot");
ok(context.arenaAudioHumanOutcome({ winnerSide:1, modes:{1:"human",2:"bot"} }) === "victory", "vittoria umano");
ok(context.arenaAudioHumanOutcome({ winnerSide:2, modes:{1:"human",2:"bot"} }) === "defeat", "sconfitta umano");
ok(context.arenaAudioHumanOutcome({ winnerSide:null, modes:{1:"human",2:"bot"} }) === "neutral", "pareggio neutro");
for (const outcome of ["victory", "defeat", "neutral"]) {
  for (const last of ["menu", "victory", "defeat"]) {
    for (const random of [0, .25, .5, .75, .999]) {
      ok(context.arenaAudioChoosePostMatchTrack(outcome, last, random) !== last, `no repeat ${outcome}/${last}/${random}`);
    }
  }
}

console.log(`F9O1 theme/audio integration smoke: ${n}/${n} OK`);
