"use strict";
const fs = require("fs");
const assert = require("assert");
const vm = require("vm");
const read = file => fs.readFileSync(file, "utf8");
let n = 0;
const ok = (value, message) => { assert.ok(value, message); n += 1; };

const presentation = read("src/presentation_theme.js");
const calibration = read("src/menu_layout_calibration_lab.js");
const app = read("src/app.js");
const game = read("src/game.js");
const css = read("css/style.css");
const config = read("data/cards_base.js");
const index = read("index.html");

ok(index.includes("C2-STABLE-1-F9O2e-APK-M4c") || index.includes("C2-STABLE-1-F9O2d-APK-M4c")||index.includes("C2-STABLE-1-F9O2c-APK-M4c")||index.includes("C2-STABLE-1-F9O2b-APK-M4c") || index.includes("C2-STABLE-1-F9O2-APK-M4c") || index.includes("C2-STABLE-1-F9O1b-APK-M4c"), "index build successivo a F9O1a");
ok(config.includes("liveLayoutCalibrationOverrideF9O1a: true"), "config live override flag");
ok(presentation.includes('mapSkinKey: "basalt_night"'), "Nexus basalt preset");
ok(presentation.includes("arenaPresentationSetGameCalibrationOverride"), "session override API");
ok(presentation.includes("arenaPresentationClearGameCalibrationOverride"), "clear override API");
ok(calibration.includes("menuLayoutCalibrationIsGameContext"), "game context detection");
ok(calibration.includes("Aspetto partita"), "presentation competence section");
ok(calibration.includes("Geometria e leggibilità"), "layout competence section");
ok(calibration.includes("Torna alla partita"), "return to game control");
ok(app.includes("app-layout-lab-game-context"), "app shell game-context class");
ok(app.includes("!isGameLayoutLab"), "no menu reset inside game calibrator");
ok(game.includes("resetSessionOverride: true"), "new game resets session override");
ok(css.includes("preview live partita"), "live preview CSS");
ok(css.includes(".app-layout-lab-game-context .gameScreen"), "game visible behind calibrator");

function datasetNode(){ return {dataset:{}}; }
const root = { dataset:{}, style:{ setProperty(){} } };
const body = datasetNode();
const skins=[];
const tokenModes=[];
const context = {
  console, Date, document:{documentElement:root,body,getElementById:()=>null},
  mapSkinByKey:key=>({key,label:key}),
  mapSkinApply:key=>{skins.push(key); return {key};},
  visualAssetSetTokenGraphicsMode:mode=>tokenModes.push(mode),
  state:{factions:{1:"Nexus",2:"Exordium"},presentationTheme:null}
};
vm.createContext(context);
vm.runInContext(presentation, context, {filename:"presentation_theme.js"});
context.arenaPresentationApplyForGame({music:false,resetSessionOverride:true});
ok(skins.at(-1)==="basalt_night", "new Nexus match uses basalt");
context.arenaPresentationSetGameCalibrationOverride({mapSkinKey:"red_dust",tokenGraphicsMode:"on"});
ok(context.state.presentationTheme.mapSource==="calibrator-session", "override source stored");
ok(context.state.presentationTheme.activeMapSkinKey==="red_dust", "override map active");
context.arenaPresentationApplyForGame({music:false,preserveOverride:true});
ok(skins.at(-1)==="red_dust", "resume preserves override");
context.arenaPresentationClearGameCalibrationOverride({apply:true});
ok(skins.at(-1)==="basalt_night", "faction preset restored");
ok(!context.state.presentationTheme.calibrationOverride, "override cleared");
console.log(`F9O1a live layout calibration smoke: ${n}/${n} OK`);
