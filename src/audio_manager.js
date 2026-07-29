"use strict";

// Arena Rubra – F9O1b Faction Theme, Music Controls & Persistent Volume Runtime.
// Un solo elemento <audio> gestisce menu, temi di fazione e playlist post-partita.
// Tutti i percorsi hanno fallback; se un asset manca il gioco continua senza blocchi.

const ARENA_AUDIO_DEFAULT_VOLUME = 0.65;
const ARENA_AUDIO_SETTINGS_KEY = "audio";
const ARENA_AUDIO_FADE_OUT_MS = 360;
const ARENA_AUDIO_FADE_IN_MS = 620;

const ARENA_AUDIO_TRACKS = Object.freeze({
  menu: Object.freeze({
    key: "menu",
    label: "432 Hz Rift",
    candidates: Object.freeze(["assets/audio/432-hertz-rift.mp3"]),
    loop: true
  }),
  faction_nexus: Object.freeze({
    key: "faction_nexus",
    label: "Machina Concordia",
    candidates: Object.freeze([
      "assets/audio/theme-nexus-machina-concordia.mp3",
      "assets/audio/theme-nexus.mp3"
    ]),
    loop: true
  }),
  faction_exordium: Object.freeze({
    key: "faction_exordium",
    label: "Aureum Imperium",
    candidates: Object.freeze([
      "assets/audio/theme-exordium-aureum-imperium.mp3",
      "assets/audio/theme-exordium.mp3"
    ]),
    loop: true
  }),
  faction_liberti: Object.freeze({
    key: "faction_liberti",
    label: "Sine Vinculis",
    candidates: Object.freeze([
      "assets/audio/theme-liberti-sine-vinculis.mp3",
      "assets/audio/theme-liberti.mp3"
    ]),
    loop: true
  }),
  faction_agathoi: Object.freeze({
    key: "faction_agathoi",
    label: "Kleos Aionion",
    candidates: Object.freeze([
      "assets/audio/theme-agathoi-kleos-aionion.mp3",
      "assets/audio/theme-agathoi.mp3"
    ]),
    loop: true
  }),
  faction_fabeot: Object.freeze({
    key: "faction_fabeot",
    label: "Vesper Tenebrarum",
    candidates: Object.freeze([
      "assets/audio/theme-fabeot-vesper-tenebrarum.mp3",
      "assets/audio/theme-fabeot.mp3"
    ]),
    loop: true
  }),
  victory: Object.freeze({
    key: "victory",
    label: "Rubra Triumphans",
    candidates: Object.freeze([
      "assets/audio/theme-victory-rubra-triumphant.mp3",
      "assets/audio/theme-victory-rubra-triumphans.mp3",
      "assets/audio/triumphant.mp3"
    ]),
    loop: false
  }),
  defeat: Object.freeze({
    key: "defeat",
    label: "Rubra Losers",
    candidates: Object.freeze([
      "assets/audio/theme-defeat-rubra-losers.mp3",
      "assets/audio/losers.mp3"
    ]),
    loop: false
  })
});

const ARENA_AUDIO_FACTION_TRACK = Object.freeze({
  Nexus: "faction_nexus",
  Exordium: "faction_exordium",
  Liberti: "faction_liberti",
  Agathoi: "faction_agathoi",
  Fabeot: "faction_fabeot"
});

const ARENA_AUDIO_POST_MATCH_WEIGHTS = Object.freeze({
  victory: Object.freeze({ menu: 3, victory: 5, defeat: 1 }),
  defeat: Object.freeze({ menu: 3, victory: 1, defeat: 5 }),
  neutral: Object.freeze({ menu: 5, victory: 2, defeat: 2 })
});

const arenaAudioState = {
  mode: "menu",
  outcome: "neutral",
  currentTrackKey: null,
  currentSource: "",
  requestedTrackKey: null,
  candidateIndex: 0,
  lastPostMatchTrackKey: null,
  transitionId: 0,
  volume: ARENA_AUDIO_DEFAULT_VOLUME,
  enabled: true,
  settingsLoaded: false,
  lastError: "",
  missingSources: [],
  postMatchSequenceCount: 0
};

function arenaAudioClampVolume(value) {
  const numeric = Number(value);
  return Math.max(0, Math.min(1, Number.isFinite(numeric) ? numeric : ARENA_AUDIO_DEFAULT_VOLUME));
}

function arenaAudioReadPreferences() {
  let settings = {};
  try {
    settings = typeof arenaStorageReadSettings === "function" ? arenaStorageReadSettings() : {};
  } catch (_) {
    settings = {};
  }
  const audio = settings && settings[ARENA_AUDIO_SETTINGS_KEY] && typeof settings[ARENA_AUDIO_SETTINGS_KEY] === "object"
    ? settings[ARENA_AUDIO_SETTINGS_KEY]
    : {};
  const enabled = typeof audio.musicEnabled === "boolean" ? audio.musicEnabled : true;
  const rawVolumePercent = Number(audio.musicVolumePercent);
  const volumePercent = Object.prototype.hasOwnProperty.call(audio, "musicVolumePercent") && Number.isFinite(rawVolumePercent)
    ? Math.max(0, Math.min(100, Math.round(rawVolumePercent)))
    : Math.round(ARENA_AUDIO_DEFAULT_VOLUME * 100);
  return { enabled, volume: volumePercent / 100, volumePercent };
}

function arenaAudioWritePreferences() {
  try {
    if (typeof arenaStorageReadSettings !== "function" || typeof arenaStorageWriteSettings !== "function") return false;
    const settings = arenaStorageReadSettings();
    const next = settings && typeof settings === "object" && !Array.isArray(settings) ? { ...settings } : {};
    next[ARENA_AUDIO_SETTINGS_KEY] = {
      ...(next[ARENA_AUDIO_SETTINGS_KEY] && typeof next[ARENA_AUDIO_SETTINGS_KEY] === "object" ? next[ARENA_AUDIO_SETTINGS_KEY] : {}),
      musicEnabled: Boolean(arenaAudioState.enabled),
      musicVolumePercent: Math.round(arenaAudioClampVolume(arenaAudioState.volume) * 100)
    };
    return arenaStorageWriteSettings(next);
  } catch (err) {
    arenaAudioState.lastError = err && err.message ? err.message : String(err || "audio-settings-write-failed");
    return false;
  }
}

function arenaAudioSyncControls() {
  if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") return;
  const enabled = Boolean(arenaAudioState.enabled);
  const percent = Math.round(arenaAudioClampVolume(arenaAudioState.volume) * 100);
  document.querySelectorAll("[data-arena-music-toggle]").forEach(button => {
    button.textContent = enabled ? "Musica ON" : "Musica OFF";
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    button.classList.toggle("isOff", !enabled);
  });
  document.querySelectorAll("[data-arena-music-volume]").forEach(input => {
    if (String(input.value) !== String(percent)) input.value = String(percent);
    input.setAttribute("aria-valuetext", `${percent}%`);
  });
  document.querySelectorAll("[data-arena-music-volume-output]").forEach(output => {
    output.textContent = `${percent}%`;
  });
  document.querySelectorAll("[data-arena-music-control]").forEach(control => {
    control.dataset.musicEnabled = enabled ? "on" : "off";
    control.dataset.musicVolume = String(percent);
  });
}

function arenaAudioApplyPreferences(options = {}) {
  const audio = arenaAudioElement();
  const target = arenaAudioState.enabled ? arenaAudioClampVolume(arenaAudioState.volume) : 0;
  arenaAudioState.transitionId += 1;
  if (audio) {
    audio.volume = target;
    if (!arenaAudioState.enabled && !audio.paused) audio.pause();
  }
  if (options.persist !== false) arenaAudioWritePreferences();
  arenaAudioSyncControls();
  return { enabled: arenaAudioState.enabled, volume: arenaAudioState.volume, volumePercent: Math.round(arenaAudioState.volume * 100) };
}

function arenaAudioSetVolumePercent(value, options = {}) {
  const percent = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  arenaAudioState.volume = percent / 100;
  arenaAudioApplyPreferences({ persist: options.persist !== false });
  return percent;
}

function arenaAudioResumeCurrentContext(options = {}) {
  if (!arenaAudioState.enabled) return false;
  const fallbackKey = arenaAudioState.mode === "game" && typeof state !== "undefined" && state
    ? arenaAudioTrackForFaction(state.factions && state.factions[1])
    : arenaAudioState.mode === "postmatch"
      ? (arenaAudioState.lastPostMatchTrackKey || (arenaAudioState.outcome === "defeat" ? "defeat" : "victory"))
      : "menu";
  const key = arenaAudioState.requestedTrackKey || arenaAudioState.currentTrackKey || fallbackKey;
  return arenaAudioPlayTrack(key, { loop: arenaAudioState.mode !== "postmatch", fade: options.fade === true });
}

function arenaAudioSetEnabled(enabled, options = {}) {
  const next = Boolean(enabled);
  if (arenaAudioState.enabled === next) {
    arenaAudioApplyPreferences({ persist: options.persist !== false });
    return next;
  }
  arenaAudioState.enabled = next;
  arenaAudioApplyPreferences({ persist: options.persist !== false });
  if (next && options.resume !== false) arenaAudioResumeCurrentContext({ fade: false });
  return next;
}

function arenaAudioToggleEnabled() {
  return arenaAudioSetEnabled(!arenaAudioState.enabled, { persist: true, resume: true });
}

function arenaAudioBindControls() {
  if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") return;
  document.querySelectorAll("[data-arena-music-toggle]").forEach(button => {
    if (button.dataset.arenaMusicBound === "1") return;
    button.dataset.arenaMusicBound = "1";
    button.addEventListener("click", () => arenaAudioToggleEnabled());
  });
  document.querySelectorAll("[data-arena-music-volume]").forEach(input => {
    if (input.dataset.arenaMusicBound === "1") return;
    input.dataset.arenaMusicBound = "1";
    input.addEventListener("input", () => arenaAudioSetVolumePercent(input.value, { persist: true }));
    input.addEventListener("change", () => arenaAudioSetVolumePercent(input.value, { persist: true }));
  });
  arenaAudioSyncControls();
}

function arenaAudioInitializePreferences() {
  if (!arenaAudioState.settingsLoaded) {
    const preferences = arenaAudioReadPreferences();
    arenaAudioState.enabled = preferences.enabled;
    arenaAudioState.volume = preferences.volume;
    arenaAudioState.settingsLoaded = true;
  }
  arenaAudioApplyPreferences({ persist: false });
  arenaAudioBindControls();
  return arenaAudioDiagnostics();
}

function arenaAudioElement() {
  return typeof document !== "undefined" ? document.getElementById("introMusic") : null;
}

function arenaAudioTrack(key) {
  return ARENA_AUDIO_TRACKS[key] || ARENA_AUDIO_TRACKS.menu;
}

function arenaAudioTrackForFaction(faction) {
  return ARENA_AUDIO_FACTION_TRACK[String(faction || "")] || "faction_nexus";
}

function arenaAudioSameSource(audio, source) {
  if (!audio || !source) return false;
  const attr = String(audio.getAttribute("src") || "");
  return attr === source || String(audio.src || "").endsWith(source);
}

function arenaAudioDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

async function arenaAudioFade(audio, target, duration, transitionId) {
  if (!audio) return;
  const safeTarget = Math.max(0, Math.min(1, Number(target) || 0));
  const safeDuration = Math.max(0, Number(duration) || 0);
  if (!safeDuration) {
    audio.volume = safeTarget;
    return;
  }
  const start = Number.isFinite(audio.volume) ? audio.volume : arenaAudioState.volume;
  const steps = Math.max(1, Math.round(safeDuration / 45));
  for (let index = 1; index <= steps; index += 1) {
    if (transitionId !== arenaAudioState.transitionId) return;
    audio.volume = start + ((safeTarget - start) * index / steps);
    await arenaAudioDelay(safeDuration / steps);
  }
}

function arenaAudioBindElement(audio) {
  if (!audio || audio.dataset.arenaAudioBound === "1") return;
  audio.dataset.arenaAudioBound = "1";
  audio.addEventListener("error", () => {
    arenaAudioTryNextCandidate("media-error");
  });
  audio.addEventListener("ended", () => {
    if (arenaAudioState.mode === "postmatch") arenaAudioAdvancePostMatch();
  });
}

async function arenaAudioPlayTrack(key, options = {}) {
  const audio = arenaAudioElement();
  if (!audio) return false;
  arenaAudioBindElement(audio);

  const track = arenaAudioTrack(key);
  const candidates = Array.isArray(track.candidates) ? track.candidates : [];
  const candidateIndex = Math.max(0, Math.min(candidates.length - 1, Number(options.candidateIndex) || 0));
  const source = candidates[candidateIndex] || ARENA_AUDIO_TRACKS.menu.candidates[0];
  const loop = Object.prototype.hasOwnProperty.call(options, "loop") ? Boolean(options.loop) : Boolean(track.loop);
  const fade = options.fade !== false;
  const transitionId = ++arenaAudioState.transitionId;

  arenaAudioState.requestedTrackKey = track.key;
  arenaAudioState.candidateIndex = candidateIndex;
  arenaAudioState.lastError = "";

  if (!arenaAudioState.enabled) {
    audio.loop = loop;
    audio.pause();
    audio.volume = 0;
    arenaAudioSyncControls();
    return true;
  }

  if (arenaAudioSameSource(audio, source) && arenaAudioState.currentTrackKey === track.key && !audio.paused) {
    audio.loop = loop;
    if (options.fade === false) audio.volume = arenaAudioState.volume;
    return true;
  }

  try {
    if (!arenaAudioSameSource(audio, source)) {
      if (fade && !audio.paused) await arenaAudioFade(audio, 0, options.fadeOutMs ?? ARENA_AUDIO_FADE_OUT_MS, transitionId);
      if (transitionId !== arenaAudioState.transitionId) return false;
      audio.pause();
      audio.setAttribute("src", source);
      audio.load();
    }
    audio.loop = loop;
    audio.volume = fade ? 0 : arenaAudioState.volume;
    await audio.play();
    if (transitionId !== arenaAudioState.transitionId) return false;
    arenaAudioState.currentTrackKey = track.key;
    arenaAudioState.currentSource = source;
    if (fade) await arenaAudioFade(audio, arenaAudioState.volume, options.fadeInMs ?? ARENA_AUDIO_FADE_IN_MS, transitionId);
    else audio.volume = arenaAudioState.volume;
    return true;
  } catch (err) {
    arenaAudioState.lastError = err && err.message ? err.message : String(err || "audio-play-failed");
    return false;
  }
}

function arenaAudioTryNextCandidate(reason = "missing") {
  const requested = arenaAudioState.requestedTrackKey || arenaAudioState.currentTrackKey || "menu";
  const track = arenaAudioTrack(requested);
  const sources = Array.isArray(track.candidates) ? track.candidates : [];
  const failed = sources[arenaAudioState.candidateIndex];
  if (failed && !arenaAudioState.missingSources.includes(failed)) arenaAudioState.missingSources.push(failed);
  const nextIndex = arenaAudioState.candidateIndex + 1;
  arenaAudioState.lastError = `${reason}:${failed || requested}`;
  if (nextIndex < sources.length) {
    arenaAudioPlayTrack(requested, { candidateIndex: nextIndex, loop: arenaAudioState.mode !== "postmatch", fade: false });
    return true;
  }
  if (requested !== "menu") {
    arenaAudioPlayTrack("menu", { loop: arenaAudioState.mode !== "postmatch", fade: false });
    return true;
  }
  return false;
}

function arenaAudioHumanOutcome(meta = {}) {
  const winnerSide = Object.prototype.hasOwnProperty.call(meta, "winnerSide") ? meta.winnerSide : (typeof state !== "undefined" && state ? state.winnerSide : null);
  const modes = meta.modes || (typeof state !== "undefined" && state && state.modes ? state.modes : {});
  const humanSides = (typeof mapRuntimePlayerIds === "function" && typeof state !== "undefined" && state ? mapRuntimePlayerIds(state) : [1, 2]).filter(side => modes && modes[side] === "human");
  if (!winnerSide) return "neutral";
  if (humanSides.length === 1) return winnerSide === humanSides[0] ? "victory" : "defeat";
  return "victory";
}

function arenaAudioChoosePostMatchTrack(outcome, lastKey, randomValue = Math.random()) {
  const normalizedOutcome = ARENA_AUDIO_POST_MATCH_WEIGHTS[outcome] ? outcome : "neutral";
  const weights = ARENA_AUDIO_POST_MATCH_WEIGHTS[normalizedOutcome];
  const entries = Object.entries(weights).filter(([key, weight]) => key !== lastKey && weight > 0);
  const total = entries.reduce((sum, entry) => sum + entry[1], 0);
  if (!entries.length || total <= 0) return "menu";
  let cursor = Math.max(0, Math.min(0.999999999, Number(randomValue) || 0)) * total;
  for (const [key, weight] of entries) {
    cursor -= weight;
    if (cursor < 0) return key;
  }
  return entries[entries.length - 1][0];
}

function arenaAudioAdvancePostMatch() {
  if (arenaAudioState.mode !== "postmatch") return false;
  const nextKey = arenaAudioChoosePostMatchTrack(arenaAudioState.outcome, arenaAudioState.lastPostMatchTrackKey);
  arenaAudioState.lastPostMatchTrackKey = nextKey;
  arenaAudioState.postMatchSequenceCount += 1;
  arenaAudioPlayTrack(nextKey, { loop: false, fade: true });
  return true;
}

function arenaAudioHandleMatchEnd(meta = {}) {
  const outcome = arenaAudioHumanOutcome(meta);
  arenaAudioState.mode = "postmatch";
  arenaAudioState.outcome = outcome;
  arenaAudioState.postMatchSequenceCount = 0;
  const firstKey = outcome === "defeat" ? "defeat" : outcome === "victory" ? "victory" : "menu";
  arenaAudioState.lastPostMatchTrackKey = firstKey;
  arenaAudioPlayTrack(firstKey, { loop: false, fade: true });
  return { outcome, firstTrackKey: firstKey };
}

function arenaAudioEnterMenu(options = {}) {
  arenaAudioState.mode = "menu";
  arenaAudioState.outcome = "neutral";
  arenaAudioState.lastPostMatchTrackKey = null;
  return arenaAudioPlayTrack("menu", { loop: true, fade: options.fade !== false });
}

function arenaAudioEnterGameForFaction(faction, options = {}) {
  const key = arenaAudioTrackForFaction(faction);
  arenaAudioState.mode = "game";
  arenaAudioState.outcome = "neutral";
  arenaAudioState.lastPostMatchTrackKey = null;
  return arenaAudioPlayTrack(key, { loop: true, fade: options.fade !== false });
}

function arenaAudioResumeForState() {
  if (typeof state === "undefined" || !state) return arenaAudioEnterMenu();
  if (state.winner) return arenaAudioHandleMatchEnd({ winnerSide: state.winnerSide, modes: state.modes });
  return arenaAudioEnterGameForFaction(state.factions && state.factions[1]);
}

function arenaAudioDiagnostics() {
  const track = arenaAudioTrack(arenaAudioState.currentTrackKey || arenaAudioState.requestedTrackKey || "menu");
  return {
    schema: "arena-rubra-f9o1b-audio-diagnostics-v1",
    mode: arenaAudioState.mode,
    enabled: Boolean(arenaAudioState.enabled),
    volume: arenaAudioState.volume,
    volumePercent: Math.round(arenaAudioState.volume * 100),
    settingsLoaded: Boolean(arenaAudioState.settingsLoaded),
    outcome: arenaAudioState.outcome,
    currentTrackKey: arenaAudioState.currentTrackKey,
    currentTrackLabel: track.label,
    currentSource: arenaAudioState.currentSource,
    requestedTrackKey: arenaAudioState.requestedTrackKey,
    candidateIndex: arenaAudioState.candidateIndex,
    missingSources: arenaAudioState.missingSources.slice(),
    lastError: arenaAudioState.lastError,
    postMatchSequenceCount: arenaAudioState.postMatchSequenceCount
  };
}


if (typeof document !== "undefined") {
  if (document.readyState === "loading" && typeof document.addEventListener === "function") document.addEventListener("DOMContentLoaded", arenaAudioInitializePreferences, { once: true });
  else arenaAudioInitializePreferences();
}
