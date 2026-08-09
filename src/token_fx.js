"use strict";

// Arena Rubra — F9O5a Token Motion & Dynamic FX Foundation.
// Layer visuale event-driven: non modifica logica, coordinate o durata dei turni.

const TOKEN_FX_CONFIG_F9O5A = Object.freeze({
  queueMax: 96,
  activeMax: 8,
  dedupeMs: 45,
  attackMs: 260,
  impactMs: 320,
  abilityMs: 520,
  destructionMs: 620,
  reducedMs: 110
});

const TOKEN_FX_MODES_F9O5A = Object.freeze(["on", "reduced", "off"]);
const TOKEN_FX_SETTINGS_KEY_F9O5A = "tokenFx";
const TOKEN_FX_QUEUE_F9O5A = [];
const TOKEN_FX_RECENT_F9O5A = new Map();
const TOKEN_FX_STATE_F9O5A = {
  mode:"on",
  loaded:false,
  draining:false,
  active:0,
  seq:0,
  rendered:0,
  dropped:0,
  lastError:""
};

function tokenFxReadPreferencesF9O5a() {
  let settings = {};
  try { settings = typeof arenaStorageReadSettings === "function" ? arenaStorageReadSettings() : {}; }
  catch (_) { settings = {}; }
  const cfg = settings && settings[TOKEN_FX_SETTINGS_KEY_F9O5A] && typeof settings[TOKEN_FX_SETTINGS_KEY_F9O5A] === "object"
    ? settings[TOKEN_FX_SETTINGS_KEY_F9O5A]
    : {};
  const mode = TOKEN_FX_MODES_F9O5A.includes(cfg.mode) ? cfg.mode : "on";
  return { mode };
}

function tokenFxWritePreferencesF9O5a() {
  try {
    if (typeof arenaStorageReadSettings !== "function" || typeof arenaStorageWriteSettings !== "function") return false;
    const settings = arenaStorageReadSettings();
    const next = settings && typeof settings === "object" && !Array.isArray(settings) ? { ...settings } : {};
    next[TOKEN_FX_SETTINGS_KEY_F9O5A] = { ...(next[TOKEN_FX_SETTINGS_KEY_F9O5A] || {}), mode:TOKEN_FX_STATE_F9O5A.mode };
    arenaStorageWriteSettings(next);
    return true;
  } catch (_) { return false; }
}

function tokenFxSystemReducedF9O5a() {
  try { return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches; }
  catch (_) { return false; }
}

function tokenFxEffectiveModeF9O5a() {
  if (TOKEN_FX_STATE_F9O5A.mode === "off") return "off";
  if (TOKEN_FX_STATE_F9O5A.mode === "reduced" || tokenFxSystemReducedF9O5a()) return "reduced";
  return "on";
}

function tokenFxSyncControlsF9O5a() {
  if (typeof document === "undefined") return;
  const mode = TOKEN_FX_STATE_F9O5A.mode;
  if (document.documentElement) document.documentElement.dataset.tokenFxMode = tokenFxEffectiveModeF9O5a();
  const labels = { on:"Miniature FX ON", reduced:"Miniature FX RIDOTTE", off:"Miniature FX OFF" };
  document.querySelectorAll("[data-arena-token-fx-toggle]").forEach(button => {
    button.textContent = labels[mode];
    button.setAttribute("aria-pressed", mode === "on" ? "true" : "false");
    button.dataset.tokenFxMode = mode;
    button.classList.toggle("isOff", mode === "off");
  });
}

function tokenFxSetModeF9O5a(mode, options = {}) {
  TOKEN_FX_STATE_F9O5A.mode = TOKEN_FX_MODES_F9O5A.includes(mode) ? mode : "on";
  TOKEN_FX_STATE_F9O5A.loaded = true;
  if (options.persist !== false) tokenFxWritePreferencesF9O5a();
  tokenFxSyncControlsF9O5a();
  return TOKEN_FX_STATE_F9O5A.mode;
}

function tokenFxCycleModeF9O5a() {
  const index = TOKEN_FX_MODES_F9O5A.indexOf(TOKEN_FX_STATE_F9O5A.mode);
  return tokenFxSetModeF9O5a(TOKEN_FX_MODES_F9O5A[(index + 1) % TOKEN_FX_MODES_F9O5A.length], { persist:true });
}

function tokenFxBindControlsF9O5a() {
  if (typeof document === "undefined") return;
  document.querySelectorAll("[data-arena-token-fx-toggle]").forEach(button => {
    if (button.dataset.arenaTokenFxBound === "1") return;
    button.dataset.arenaTokenFxBound = "1";
    button.addEventListener("click", tokenFxCycleModeF9O5a);
  });
  tokenFxSyncControlsF9O5a();
}

function tokenFxInitializeF9O5a() {
  if (!TOKEN_FX_STATE_F9O5A.loaded) {
    const pref = tokenFxReadPreferencesF9O5a();
    TOKEN_FX_STATE_F9O5A.mode = pref.mode;
    TOKEN_FX_STATE_F9O5A.loaded = true;
  }
  tokenFxBindControlsF9O5a();
  return tokenFxDiagnosticsF9O5a();
}

function tokenFxEscapeF9O5a(value) {
  const raw = String(value == null ? "" : value);
  if (typeof CSS !== "undefined" && CSS && typeof CSS.escape === "function") return CSS.escape(raw);
  return raw.replace(/["\\]/g, "\\$&");
}

function tokenFxUnitByUidF9O5a(uid) {
  if (!uid || typeof state === "undefined" || !state || !Array.isArray(state.units)) return null;
  return state.units.find(unit => unit && String(unit.uid) === String(uid)) || null;
}

function tokenFxTokenByUidF9O5a(uid) {
  if (!uid || typeof document === "undefined") return null;
  return document.querySelector(`.unitToken[data-unit-uid="${tokenFxEscapeF9O5a(uid)}"]`);
}

function tokenFxProfileForUnitF9O5a(unit) {
  return String(unit && (unit.tokenFxProfile || unit.tokenAnimationProfile || unit.sfxProfile) || "ballistic_light");
}

function tokenFxLayerF9O5a() {
  return typeof document !== "undefined" ? document.getElementById("mapOverlayLayer") : null;
}

function tokenFxPointForCoordF9O5a(coord) {
  if (!Array.isArray(coord)) return null;
  if (typeof document !== "undefined") {
    const hex = document.querySelector(`.hex[data-coord-key="${tokenFxEscapeF9O5a(coord.join(","))}"]`);
    if (hex) {
      const left = Number.parseFloat(hex.style.left);
      const top = Number.parseFloat(hex.style.top);
      if (Number.isFinite(left) && Number.isFinite(top)) return { left, top };
    }
  }
  if (typeof CENTER_X === "undefined" || typeof CENTER_Y === "undefined" || typeof HEX_SIZE === "undefined") return null;
  const q = Number(coord[0]);
  const r = Number(coord[2]);
  return { left:CENTER_X + HEX_SIZE * Math.sqrt(3) * (q + r / 2), top:CENTER_Y + HEX_SIZE * 1.5 * r };
}

function tokenFxWaitF9O5a(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function tokenFxDurationF9O5a(normal) {
  return tokenFxEffectiveModeF9O5a() === "reduced" ? TOKEN_FX_CONFIG_F9O5A.reducedMs : normal;
}

function tokenFxRemoveLaterF9O5a(element, duration) {
  return tokenFxWaitF9O5a(duration + 60).then(() => {
    if (element && element.parentNode) element.parentNode.removeChild(element);
    return true;
  });
}

function tokenFxCreateBurstF9O5a(coord, profile, kind="impact", options = {}) {
  const layer = tokenFxLayerF9O5a();
  const point = tokenFxPointForCoordF9O5a(coord);
  if (!layer || !point) return Promise.resolve(false);
  const reduced = tokenFxEffectiveModeF9O5a() === "reduced";
  const el = document.createElement("div");
  el.className = `tokenFxBurst tokenFx-${kind} fx-profile-${profile}`;
  el.style.left = `${point.left}px`;
  el.style.top = `${point.top}px`;
  const count = reduced ? 2 : Math.max(3, Math.min(9, Number(options.particles) || (kind === "destruction" ? 8 : 5)));
  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement("i");
    particle.style.setProperty("--fx-angle", `${Math.round((360 / count) * i + (i % 2) * 11)}deg`);
    particle.style.setProperty("--fx-distance", `${reduced ? 11 : 18 + (i % 3) * 5}px`);
    el.appendChild(particle);
  }
  layer.appendChild(el);
  const duration = tokenFxDurationF9O5a(kind === "destruction" ? TOKEN_FX_CONFIG_F9O5A.destructionMs : TOKEN_FX_CONFIG_F9O5A.impactMs);
  el.style.setProperty("--token-fx-duration", `${duration}ms`);
  return tokenFxRemoveLaterF9O5a(el, duration);
}

function tokenFxCreateProjectileF9O5a(from, to, profile) {
  const layer = tokenFxLayerF9O5a();
  const a = tokenFxPointForCoordF9O5a(from);
  const b = tokenFxPointForCoordF9O5a(to);
  if (!layer || !a || !b) return Promise.resolve(false);
  const dx = b.left - a.left;
  const dy = b.top - a.top;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const el = document.createElement("div");
  el.className = `tokenFxProjectile fx-profile-${profile}`;
  el.style.left = `${a.left}px`;
  el.style.top = `${a.top}px`;
  el.style.width = `${distance}px`;
  el.style.transform = `rotate(${angle}deg)`;
  const duration = tokenFxDurationF9O5a(TOKEN_FX_CONFIG_F9O5A.attackMs);
  el.style.setProperty("--token-fx-duration", `${duration}ms`);
  layer.appendChild(el);
  return tokenFxRemoveLaterF9O5a(el, duration);
}

function tokenFxAbilityPulseF9O5a(coord, profile, target=false) {
  const layer = tokenFxLayerF9O5a();
  const point = tokenFxPointForCoordF9O5a(coord);
  if (!layer || !point) return Promise.resolve(false);
  const el = document.createElement("div");
  el.className = `tokenFxAbilityPulse fx-profile-${profile}${target ? " is-target" : ""}`;
  el.style.left = `${point.left}px`;
  el.style.top = `${point.top}px`;
  const duration = tokenFxDurationF9O5a(TOKEN_FX_CONFIG_F9O5A.abilityMs);
  el.style.setProperty("--token-fx-duration", `${duration}ms`);
  layer.appendChild(el);
  return tokenFxRemoveLaterF9O5a(el, duration);
}

function tokenFxDestructionGhostF9O5a(item) {
  const layer = tokenFxLayerF9O5a();
  const point = tokenFxPointForCoordF9O5a(item.coord);
  if (!layer || !point) return Promise.resolve(false);
  const el = document.createElement("div");
  el.className = `tokenFxDeathGhost fx-profile-${item.profile}`;
  el.style.left = `${point.left}px`;
  el.style.top = `${point.top}px`;
  if (item.snapshotHtml) el.innerHTML = item.snapshotHtml;
  else el.innerHTML = `<span class="tokenFxDeathMark">✦</span>`;
  const duration = tokenFxDurationF9O5a(TOKEN_FX_CONFIG_F9O5A.destructionMs);
  el.style.setProperty("--token-fx-duration", `${duration}ms`);
  layer.appendChild(el);
  const burst = tokenFxCreateBurstF9O5a(item.coord, item.profile, "destruction", { particles:8 });
  return Promise.all([tokenFxRemoveLaterF9O5a(el, duration), burst]);
}

function tokenFxDescriptorForGameEventF9O5a(event) {
  if (!event || !event.type || typeof EventTypes === "undefined") return null;
  const data = event.data || {};
  if (event.type === EventTypes.UNIT_ATTACKED) {
    const unit = tokenFxUnitByUidF9O5a(data.attackerId);
    return { kind:"attack", unitId:data.attackerId, from:data.attackerPos || (unit && unit.pos), to:data.defenderPos, profile:tokenFxProfileForUnitF9O5a(unit) };
  }
  if (event.type === EventTypes.UNIT_DAMAGED) {
    const unit = tokenFxUnitByUidF9O5a(data.targetId);
    return { kind:"impact", unitId:data.targetId, coord:data.targetPos || (unit && unit.pos), profile:tokenFxProfileForUnitF9O5a(unit), damageKind:data.damageKind || "effect" };
  }
  if (event.type === EventTypes.UNIT_DESTROYED) {
    const unit = tokenFxUnitByUidF9O5a(data.unitId);
    const token = tokenFxTokenByUidF9O5a(data.unitId);
    return {
      kind:"destruction",
      unitId:data.unitId,
      coord:(unit && Array.isArray(unit.pos)) ? [...unit.pos] : (Array.isArray(data.unitPos) ? [...data.unitPos] : null),
      profile:tokenFxProfileForUnitF9O5a(unit),
      snapshotHtml:token ? token.innerHTML : ""
    };
  }
  if (event.type === EventTypes.ABILITY_USED) {
    const unit = tokenFxUnitByUidF9O5a(data.unitId);
    const target = tokenFxUnitByUidF9O5a(data.targetId);
    return {
      kind:"ability",
      unitId:data.unitId,
      from:unit && unit.pos,
      to:target && target.pos,
      profile:tokenFxProfileForUnitF9O5a(unit),
      abilityKind:data.abilityKind || ""
    };
  }
  return null;
}

async function tokenFxProcessItemF9O5a(item) {
  if (!item || tokenFxEffectiveModeF9O5a() === "off") return false;
  if (item.kind === "attack") {
    const token = tokenFxTokenByUidF9O5a(item.unitId);
    if (token) {
      token.classList.remove("token-fx-recoil");
      void token.offsetWidth;
      token.classList.add("token-fx-recoil");
      setTimeout(() => token && token.isConnected && token.classList.remove("token-fx-recoil"), tokenFxDurationF9O5a(TOKEN_FX_CONFIG_F9O5A.attackMs));
    }
    return tokenFxCreateProjectileF9O5a(item.from, item.to, item.profile);
  }
  if (item.kind === "impact") return tokenFxCreateBurstF9O5a(item.coord, item.profile, item.damageKind === "bleed" ? "bleed" : "impact");
  if (item.kind === "destruction") return tokenFxDestructionGhostF9O5a(item);
  if (item.kind === "ability") {
    const jobs = [tokenFxAbilityPulseF9O5a(item.from, item.profile, false)];
    if (item.to) jobs.push(tokenFxAbilityPulseF9O5a(item.to, item.profile, true));
    return Promise.all(jobs);
  }
  return false;
}

async function tokenFxDrainF9O5a() {
  if (TOKEN_FX_STATE_F9O5A.draining) return;
  TOKEN_FX_STATE_F9O5A.draining = true;
  try {
    while (TOKEN_FX_QUEUE_F9O5A.length) {
      if (TOKEN_FX_STATE_F9O5A.active >= TOKEN_FX_CONFIG_F9O5A.activeMax) {
        await tokenFxWaitF9O5a(24);
        continue;
      }
      const item = TOKEN_FX_QUEUE_F9O5A.shift();
      TOKEN_FX_STATE_F9O5A.active += 1;
      Promise.resolve(tokenFxProcessItemF9O5a(item))
        .catch(err => { TOKEN_FX_STATE_F9O5A.lastError = String(err && err.message || err); })
        .finally(() => { TOKEN_FX_STATE_F9O5A.active = Math.max(0, TOKEN_FX_STATE_F9O5A.active - 1); });
      TOKEN_FX_STATE_F9O5A.rendered += 1;
      await tokenFxWaitF9O5a(tokenFxEffectiveModeF9O5a() === "reduced" ? 8 : 18);
    }
  } finally {
    TOKEN_FX_STATE_F9O5A.draining = false;
    if (TOKEN_FX_QUEUE_F9O5A.length) setTimeout(tokenFxDrainF9O5a, 0);
  }
}

function tokenFxEnqueueGameEvent(event) {
  if (tokenFxEffectiveModeF9O5a() === "off") return false;
  const descriptor = tokenFxDescriptorForGameEventF9O5a(event);
  if (!descriptor) return false;
  const key = `${event.type}:${descriptor.unitId || ""}:${descriptor.kind}:${event.seq || ""}`;
  const now = Date.now();
  const recent = TOKEN_FX_RECENT_F9O5A.get(key) || 0;
  if (now - recent < TOKEN_FX_CONFIG_F9O5A.dedupeMs) return false;
  TOKEN_FX_RECENT_F9O5A.set(key, now);
  if (TOKEN_FX_RECENT_F9O5A.size > 160) {
    for (const [oldKey, at] of TOKEN_FX_RECENT_F9O5A.entries()) if (now - at > 3000) TOKEN_FX_RECENT_F9O5A.delete(oldKey);
  }
  descriptor.id = `token-fx-${++TOKEN_FX_STATE_F9O5A.seq}`;
  descriptor.eventType = event.type;
  descriptor.eventSeq = event.seq || 0;
  if (TOKEN_FX_QUEUE_F9O5A.length >= TOKEN_FX_CONFIG_F9O5A.queueMax) {
    TOKEN_FX_QUEUE_F9O5A.shift();
    TOKEN_FX_STATE_F9O5A.dropped += 1;
  }
  TOKEN_FX_QUEUE_F9O5A.push(descriptor);
  setTimeout(tokenFxDrainF9O5a, 0);
  return true;
}

function tokenFxClearF9O5a() {
  TOKEN_FX_QUEUE_F9O5A.length = 0;
  TOKEN_FX_RECENT_F9O5A.clear();
  if (typeof document !== "undefined") document.querySelectorAll(".tokenFxProjectile,.tokenFxBurst,.tokenFxAbilityPulse,.tokenFxDeathGhost").forEach(el => el.remove());
}

function tokenFxDiagnosticsF9O5a() {
  return {
    mode:TOKEN_FX_STATE_F9O5A.mode,
    effectiveMode:tokenFxEffectiveModeF9O5a(),
    queue:TOKEN_FX_QUEUE_F9O5A.length,
    active:TOKEN_FX_STATE_F9O5A.active,
    rendered:TOKEN_FX_STATE_F9O5A.rendered,
    dropped:TOKEN_FX_STATE_F9O5A.dropped,
    lastError:TOKEN_FX_STATE_F9O5A.lastError
  };
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tokenFxInitializeF9O5a, { once:true });
  else setTimeout(tokenFxInitializeF9O5a, 0);
}
