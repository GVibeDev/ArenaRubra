"use strict";

const fs = require("fs");
const assert = require("assert");
const vm = require("vm");
const audioCode = fs.readFileSync("src/audio_manager.js", "utf8");
const presentationCode = fs.readFileSync("src/presentation_theme.js", "utf8");
let n = 0;
const ok = (value, message) => { assert.ok(value, message); n += 1; };

function makeDatasetNode() { return { dataset: {} }; }
const root = makeDatasetNode();
const body = makeDatasetNode();
const appliedSkins = [];
const playedFactions = [];
const context = {
  console,
  setTimeout,
  clearTimeout,
  Math,
  Promise,
  document: { documentElement: root, body, getElementById: () => null },
  mapSkinApply: (key, options) => { appliedSkins.push({key, options}); return {key}; },
  mapSkinApplySaved: () => { appliedSkins.push({key:"saved"}); return {key:"saved"}; },
  arenaAudioEnterGameForFaction: faction => { playedFactions.push(faction); return true; },
  arenaAudioEnterMenu: () => { playedFactions.push("menu"); return true; },
  state: { factions:{1:"Exordium",2:"Nexus"}, modes:{1:"human",2:"bot"} }
};
vm.createContext(context);
vm.runInContext(audioCode, context, { filename:"audio_manager.js" });
// Restore stubs overwritten only if same names existed (they do not for game/menu calls until declarations load).
context.arenaAudioEnterGameForFaction = faction => { playedFactions.push(faction); return true; };
context.arenaAudioEnterMenu = () => { playedFactions.push("menu"); return true; };
vm.runInContext(presentationCode, context, { filename:"presentation_theme.js" });

const theme = context.arenaPresentationApplyForGame({music:true});
ok(theme.key === "exordium", "tema Exordium");
ok(appliedSkins.at(-1).key === "exordium_battlegrounds", "mappa Exordium");
ok(playedFactions.at(-1) === "Exordium", "musica Exordium");
ok(body.dataset.arenaFactionTheme === "exordium", "dataset body");
ok(root.dataset.arenaThemeMap === "exordium_battlegrounds", "dataset mappa");
ok(context.state.presentationTheme.sourceSide === 1, "autorità G1");

context.state.factions[1] = "Nexus";
const nexus = context.arenaPresentationApplyForGame({music:false, resetSessionOverride:true});
ok(nexus.mapSkinKey === "basalt_night", "Nexus Basalto notturno");
ok(appliedSkins.at(-1).key === "basalt_night", "skin Basalto applicata");

context.state.factions[1] = "Fabeot";
const fabeot = context.arenaPresentationApplyForGame({music:true});
ok(fabeot.mapSkinKey === "fabeot_velvet_hoods", "mappa Fabeot");
ok(playedFactions.at(-1) === "Fabeot", "musica Fabeot");

context.arenaPresentationResetForMenu({music:true,restoreMap:true,fade:false});
ok(!("arenaFactionTheme" in body.dataset), "dataset rimosso");
ok(appliedSkins.at(-1).key === "saved", "skin menu ripristinata");
ok(playedFactions.at(-1) === "menu", "musica menu");

console.log(`F9O1 presentation runtime smoke: ${n}/${n} OK`);
