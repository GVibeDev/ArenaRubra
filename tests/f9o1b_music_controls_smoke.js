"use strict";
const fs = require("fs");
const assert = require("assert");
const vm = require("vm");
const read = file => fs.readFileSync(file, "utf8");
let n = 0;
const ok = (value, message) => { assert.ok(value, message); n += 1; };

const index = read("index.html");
const audioSource = read("src/audio_manager.js");
const build = read("src/build_info.js");
const config = read("data/cards_base.js");
const css = read("css/style.css");

ok(build.includes("C2-STABLE-1-F9O4f-APK-M4c") || build.includes("C2-STABLE-1-F9O4f-APK-M4c") || build.includes("C2-STABLE-1-F9O4e-APK-M4c") || build.includes("C2-STABLE-1-F9O4d-APK-M4c") || build.includes("C2-STABLE-1-F9O4c-APK-M4c") || build.includes("C2-STABLE-1-F9O4b-APK-M4c") || build.includes("C2-STABLE-1-F9O4a-APK-M4c") || build.includes("C2-STABLE-1-F9O4-APK-M4c") || build.includes("C2-STABLE-1-F9O2e-APK-M4c") || build.includes("C2-STABLE-1-F9O2d-APK-M4c") || build.includes("C2-STABLE-1-F9O2c-APK-M4c") || build.includes("C2-STABLE-1-F9O2b-APK-M4c") || build.includes("C2-STABLE-1-F9O2a-APK-M4c") || build.includes("C2-STABLE-1-F9O2-APK-M4c") || build.includes("C2-STABLE-1-F9O1b-APK-M4c"), "build F9O1b o successiva");
ok(config.includes("persistentMusicControlsF9O1b: true"), "feature flag F9O1b");
ok(config.includes("defaultMusicVolumePercentF9O1b: 65"), "default 65 config");
ok(audioSource.includes("const ARENA_AUDIO_DEFAULT_VOLUME = 0.65"), "default 65 runtime");
ok((index.match(/data-arena-music-control/g) || []).length === 2, "controlli menu e game");
ok((index.match(/data-arena-music-toggle/g) || []).length === 2, "due toggle sincronizzati");
ok((index.match(/data-arena-music-volume/g) || []).length >= 4, "slider e output duplicati");
ok(css.includes("F9O1b — Controlli musica persistenti"), "CSS F9O1b");

function classList() {
  const values = new Set();
  return { toggle(name, on) { if (on) values.add(name); else values.delete(name); }, contains(name) { return values.has(name); } };
}
function controlNode(value = "") {
  return {
    value: String(value), textContent: "", dataset: {}, attrs: {}, listeners: {}, classList: classList(), paused: true, volume: 1, loop: true,
    setAttribute(name, value) { this.attrs[name] = String(value); if (name === "src") this.src = String(value); },
    getAttribute(name) { return this.attrs[name] || ""; },
    addEventListener(name, fn) { this.listeners[name] = fn; },
    pause() { this.paused = true; },
    play() { this.paused = false; return Promise.resolve(); },
    load() {}
  };
}
const toggles = [controlNode(), controlNode()];
const sliders = [controlNode(65), controlNode(65)];
const outputs = [controlNode(), controlNode()];
const wrappers = [controlNode(), controlNode()];
const audio = controlNode();
audio.attrs.src = "assets/audio/432-hertz-rift.mp3";
let settings = { unrelated: { keep: true } };
const document = {
  readyState: "complete",
  getElementById(id) { return id === "introMusic" ? audio : null; },
  querySelectorAll(selector) {
    if (selector === "[data-arena-music-toggle]") return toggles;
    if (selector === "[data-arena-music-volume]") return sliders;
    if (selector === "[data-arena-music-volume-output]") return outputs;
    if (selector === "[data-arena-music-control]") return wrappers;
    return [];
  },
  addEventListener() {}
};
const context = {
  console, document, setTimeout, clearTimeout, Promise, Math,
  state: null,
  arenaStorageReadSettings: () => JSON.parse(JSON.stringify(settings)),
  arenaStorageWriteSettings: next => { settings = JSON.parse(JSON.stringify(next)); return true; }
};
vm.createContext(context);
vm.runInContext(audioSource, context, { filename: "audio_manager.js" });

let initialDiag = context.arenaAudioDiagnostics();
ok(initialDiag.settingsLoaded === true, "preferenze inizializzate");
ok(initialDiag.enabled === true, "musica ON default");
ok(initialDiag.volume === 0.65, "volume runtime 65%");
ok(sliders.every(node => node.value === "65"), "slider sincronizzati 65");
ok(outputs.every(node => node.textContent === "65%"), "output sincronizzati 65");
ok(toggles.every(node => node.textContent === "Musica ON"), "toggle ON sincronizzati");

context.arenaAudioSetVolumePercent(42);
ok(context.arenaAudioDiagnostics().volume === 0.42, "volume modificato a 42");
ok(sliders.every(node => node.value === "42"), "slider sincronizzati 42");
ok(outputs.every(node => node.textContent === "42%"), "output sincronizzati 42");
ok(settings.audio.musicVolumePercent === 42, "volume persistito");
ok(settings.unrelated.keep === true, "altre impostazioni preservate");

context.arenaAudioSetEnabled(false, { resume: false });
ok(context.arenaAudioDiagnostics().enabled === false, "toggle OFF runtime");
ok(audio.paused === true, "audio in pausa");
ok(settings.audio.musicEnabled === false, "OFF persistito");
ok(toggles.every(node => node.textContent === "Musica OFF"), "toggle OFF sincronizzati");
ok(toggles.every(node => node.attrs["aria-pressed"] === "false"), "aria OFF");

context.arenaAudioSetVolumePercent(0);
ok(context.arenaAudioDiagnostics().enabled === false, "slider zero non cambia toggle");
ok(settings.audio.musicVolumePercent === 0, "zero persistito");
context.arenaAudioSetEnabled(true, { resume: false });
ok(context.arenaAudioDiagnostics().enabled === true, "toggle ON dopo zero");
ok(context.arenaAudioDiagnostics().volume === 0, "volume zero conservato");

context.arenaAudioSetVolumePercent(73);
const diag = context.arenaAudioDiagnostics();
ok(diag.enabled === true, "diagnostica enabled");
ok(diag.volumePercent === 73, "diagnostica volume");
ok(settings.audio.musicVolumePercent === 73, "ultimo volume persistito");

console.log(`F9O1b music controls smoke: ${n}/${n} OK`);
