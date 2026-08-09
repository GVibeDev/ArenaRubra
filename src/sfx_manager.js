"use strict";

// Arena Rubra — F9O5a Lightweight SFX Evaluation Runtime.
// SFX sintetici a costo asset zero, con registry pronto per campioni futuri.
// Nessun suono influenza tempi, eventi o gameplay.

const ARENA_SFX_SETTINGS_KEY_F9O5A = "sfx";
const ARENA_SFX_DEFAULT_VOLUME_F9O5A = 0.38;
const ARENA_SFX_CONFIG_F9O5A = Object.freeze({ maxVoices:5, minGapMs:55, masterGain:0.72 });

const ARENA_SFX_ASSET_REGISTRY_F9O5A = Object.freeze({
  attack: Object.freeze(["assets/audio/sfx/attack.ogg", "assets/audio/sfx/attack.mp3"]),
  impact: Object.freeze(["assets/audio/sfx/impact.ogg", "assets/audio/sfx/impact.mp3"]),
  destruction: Object.freeze(["assets/audio/sfx/destruction.ogg", "assets/audio/sfx/destruction.mp3"]),
  ability: Object.freeze(["assets/audio/sfx/ability.ogg", "assets/audio/sfx/ability.mp3"])
});

const arenaSfxStateF9O5a = {
  enabled:true,
  volume:ARENA_SFX_DEFAULT_VOLUME_F9O5A,
  loaded:false,
  context:null,
  master:null,
  unlocked:false,
  activeVoices:0,
  played:0,
  dropped:0,
  lastAt:0,
  lastError:""
};

function arenaSfxReadPreferencesF9O5a() {
  let settings = {};
  try { settings = typeof arenaStorageReadSettings === "function" ? arenaStorageReadSettings() : {}; }
  catch (_) { settings = {}; }
  const cfg = settings && settings[ARENA_SFX_SETTINGS_KEY_F9O5A] && typeof settings[ARENA_SFX_SETTINGS_KEY_F9O5A] === "object"
    ? settings[ARENA_SFX_SETTINGS_KEY_F9O5A]
    : {};
  const enabled = typeof cfg.enabled === "boolean" ? cfg.enabled : true;
  const raw = Number(cfg.volumePercent);
  const volumePercent = Number.isFinite(raw) ? Math.max(0, Math.min(100, Math.round(raw))) : Math.round(ARENA_SFX_DEFAULT_VOLUME_F9O5A * 100);
  return { enabled, volume:volumePercent / 100, volumePercent };
}

function arenaSfxWritePreferencesF9O5a() {
  try {
    if (typeof arenaStorageReadSettings !== "function" || typeof arenaStorageWriteSettings !== "function") return false;
    const settings = arenaStorageReadSettings();
    const next = settings && typeof settings === "object" && !Array.isArray(settings) ? { ...settings } : {};
    next[ARENA_SFX_SETTINGS_KEY_F9O5A] = { enabled:arenaSfxStateF9O5a.enabled, volumePercent:Math.round(arenaSfxStateF9O5a.volume * 100) };
    arenaStorageWriteSettings(next);
    return true;
  } catch (_) { return false; }
}

function arenaSfxSyncControlsF9O5a() {
  if (typeof document === "undefined") return;
  const percent = Math.round(arenaSfxStateF9O5a.volume * 100);
  document.querySelectorAll("[data-arena-sfx-toggle]").forEach(button => {
    button.textContent = arenaSfxStateF9O5a.enabled ? "SFX ON" : "SFX OFF";
    button.setAttribute("aria-pressed", arenaSfxStateF9O5a.enabled ? "true" : "false");
    button.classList.toggle("isOff", !arenaSfxStateF9O5a.enabled);
  });
  document.querySelectorAll("[data-arena-sfx-volume]").forEach(input => {
    input.value = String(percent);
    input.setAttribute("aria-valuetext", `${percent}%`);
  });
  document.querySelectorAll("[data-arena-sfx-volume-output]").forEach(output => { output.textContent = `${percent}%`; });
}

function arenaSfxSetEnabledF9O5a(enabled, options = {}) {
  arenaSfxStateF9O5a.enabled = Boolean(enabled);
  if (options.persist !== false) arenaSfxWritePreferencesF9O5a();
  arenaSfxSyncControlsF9O5a();
  return arenaSfxStateF9O5a.enabled;
}

function arenaSfxToggleF9O5a() {
  return arenaSfxSetEnabledF9O5a(!arenaSfxStateF9O5a.enabled, { persist:true });
}

function arenaSfxSetVolumePercentF9O5a(value, options = {}) {
  const percent = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  arenaSfxStateF9O5a.volume = percent / 100;
  if (arenaSfxStateF9O5a.master) arenaSfxStateF9O5a.master.gain.value = arenaSfxStateF9O5a.volume * ARENA_SFX_CONFIG_F9O5A.masterGain;
  if (options.persist !== false) arenaSfxWritePreferencesF9O5a();
  arenaSfxSyncControlsF9O5a();
  return percent;
}

function arenaSfxEnsureContextF9O5a() {
  if (arenaSfxStateF9O5a.context) return arenaSfxStateF9O5a.context;
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  try {
    const ctx = new AudioContextCtor();
    const master = ctx.createGain();
    master.gain.value = arenaSfxStateF9O5a.volume * ARENA_SFX_CONFIG_F9O5A.masterGain;
    master.connect(ctx.destination);
    arenaSfxStateF9O5a.context = ctx;
    arenaSfxStateF9O5a.master = master;
    return ctx;
  } catch (err) {
    arenaSfxStateF9O5a.lastError = String(err && err.message || err);
    return null;
  }
}

async function arenaSfxUnlockF9O5a() {
  const ctx = arenaSfxEnsureContextF9O5a();
  if (!ctx) return false;
  try {
    if (ctx.state === "suspended") await ctx.resume();
    arenaSfxStateF9O5a.unlocked = ctx.state === "running";
    return arenaSfxStateF9O5a.unlocked;
  } catch (err) {
    arenaSfxStateF9O5a.lastError = String(err && err.message || err);
    return false;
  }
}

function arenaSfxNoiseBufferF9O5a(ctx, duration) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  return buffer;
}

function arenaSfxProfileForUnitF9O5a(uid) {
  if (typeof state === "undefined" || !state || !Array.isArray(state.units)) return "ballistic_light";
  const unit = state.units.find(entry => entry && String(entry.uid) === String(uid));
  return String(unit && (unit.sfxProfile || unit.tokenFxProfile || unit.tokenAnimationProfile) || "ballistic_light");
}

function arenaSfxDescriptorForGameEventF9O5a(event) {
  if (!event || !event.type || typeof EventTypes === "undefined") return null;
  const d = event.data || {};
  if (event.type === EventTypes.UNIT_ATTACKED) return { kind:"attack", profile:arenaSfxProfileForUnitF9O5a(d.attackerId), intensity:Number(d.amount || 1) };
  if (event.type === EventTypes.UNIT_DAMAGED && (Number(d.defLoss || 0) > 0 || Number(d.hpLoss || 0) > 0)) return { kind:"impact", profile:arenaSfxProfileForUnitF9O5a(d.targetId), intensity:Number(d.hpLoss || d.defLoss || 1) };
  if (event.type === EventTypes.UNIT_DESTROYED) return { kind:"destruction", profile:arenaSfxProfileForUnitF9O5a(d.unitId), intensity:4 };
  if (event.type === EventTypes.ABILITY_USED) return { kind:"ability", profile:arenaSfxProfileForUnitF9O5a(d.unitId), intensity:2 };
  return null;
}

function arenaSfxOscillatorVoiceF9O5a(ctx, kind, profile, intensity) {
  if (!ctx || !arenaSfxStateF9O5a.master) return false;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const heavy = /heavy|structure/.test(profile);
  const organic = profile === "organic";
  const occult = profile === "occult";
  const energy = profile === "energy";
  const base = kind === "attack" ? (heavy ? 95 : energy ? 520 : 180)
    : kind === "impact" ? (heavy ? 70 : 125)
    : kind === "destruction" ? 55
    : occult ? 310 : organic ? 220 : 420;
  const duration = kind === "destruction" ? 0.34 : kind === "ability" ? 0.24 : kind === "impact" ? 0.11 : 0.15;
  osc.type = energy ? "sine" : occult ? "triangle" : heavy ? "sawtooth" : "square";
  osc.frequency.setValueAtTime(base + Math.min(120, intensity * 7), now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(35, base * (kind === "ability" ? 1.45 : 0.45)), now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  filter.type = "lowpass";
  filter.frequency.value = heavy ? 780 : energy ? 3600 : 1900;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(arenaSfxStateF9O5a.master);
  osc.start(now);
  osc.stop(now + duration + 0.02);

  if (kind === "impact" || kind === "destruction" || heavy) {
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noise.buffer = arenaSfxNoiseBufferF9O5a(ctx, duration);
    noiseGain.gain.setValueAtTime(0.025, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    noise.connect(noiseGain);
    noiseGain.connect(arenaSfxStateF9O5a.master);
    noise.start(now);
  }
  return true;
}

function arenaSfxPlayDescriptorF9O5a(descriptor) {
  if (!descriptor || !arenaSfxStateF9O5a.enabled || arenaSfxStateF9O5a.volume <= 0) return false;
  const nowMs = Date.now();
  if (arenaSfxStateF9O5a.activeVoices >= ARENA_SFX_CONFIG_F9O5A.maxVoices || nowMs - arenaSfxStateF9O5a.lastAt < ARENA_SFX_CONFIG_F9O5A.minGapMs) {
    arenaSfxStateF9O5a.dropped += 1;
    return false;
  }
  const ctx = arenaSfxEnsureContextF9O5a();
  if (!ctx || ctx.state !== "running") return false;
  arenaSfxStateF9O5a.lastAt = nowMs;
  arenaSfxStateF9O5a.activeVoices += 1;
  try {
    const played = arenaSfxOscillatorVoiceF9O5a(ctx, descriptor.kind, descriptor.profile, descriptor.intensity || 1);
    if (played) arenaSfxStateF9O5a.played += 1;
    setTimeout(() => { arenaSfxStateF9O5a.activeVoices = Math.max(0, arenaSfxStateF9O5a.activeVoices - 1); }, descriptor.kind === "destruction" ? 420 : 260);
    return played;
  } catch (err) {
    arenaSfxStateF9O5a.activeVoices = Math.max(0, arenaSfxStateF9O5a.activeVoices - 1);
    arenaSfxStateF9O5a.lastError = String(err && err.message || err);
    return false;
  }
}

function arenaSfxEnqueueGameEvent(event) {
  const descriptor = arenaSfxDescriptorForGameEventF9O5a(event);
  return descriptor ? arenaSfxPlayDescriptorF9O5a(descriptor) : false;
}

function arenaSfxBindControlsF9O5a() {
  if (typeof document === "undefined") return;
  document.querySelectorAll("[data-arena-sfx-toggle]").forEach(button => {
    if (button.dataset.arenaSfxBound === "1") return;
    button.dataset.arenaSfxBound = "1";
    button.addEventListener("click", () => { arenaSfxToggleF9O5a(); arenaSfxUnlockF9O5a(); });
  });
  document.querySelectorAll("[data-arena-sfx-volume]").forEach(input => {
    if (input.dataset.arenaSfxBound === "1") return;
    input.dataset.arenaSfxBound = "1";
    input.addEventListener("input", () => arenaSfxSetVolumePercentF9O5a(input.value, { persist:true }));
    input.addEventListener("change", () => arenaSfxSetVolumePercentF9O5a(input.value, { persist:true }));
  });
  const unlock = () => arenaSfxUnlockF9O5a();
  document.addEventListener("pointerdown", unlock, { once:true, passive:true });
  document.addEventListener("keydown", unlock, { once:true });
  arenaSfxSyncControlsF9O5a();
}

function arenaSfxInitializeF9O5a() {
  if (!arenaSfxStateF9O5a.loaded) {
    const pref = arenaSfxReadPreferencesF9O5a();
    arenaSfxStateF9O5a.enabled = pref.enabled;
    arenaSfxStateF9O5a.volume = pref.volume;
    arenaSfxStateF9O5a.loaded = true;
  }
  arenaSfxBindControlsF9O5a();
  return arenaSfxDiagnosticsF9O5a();
}

function arenaSfxDiagnosticsF9O5a() {
  return {
    enabled:arenaSfxStateF9O5a.enabled,
    volumePercent:Math.round(arenaSfxStateF9O5a.volume * 100),
    unlocked:arenaSfxStateF9O5a.unlocked,
    activeVoices:arenaSfxStateF9O5a.activeVoices,
    played:arenaSfxStateF9O5a.played,
    dropped:arenaSfxStateF9O5a.dropped,
    lastError:arenaSfxStateF9O5a.lastError,
    assetRegistry:ARENA_SFX_ASSET_REGISTRY_F9O5A
  };
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arenaSfxInitializeF9O5a, { once:true });
  else setTimeout(arenaSfxInitializeF9O5a, 0);
}
