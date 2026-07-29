"use strict";

// Arena Rubra – F9M2f Token Asset Cache / Flicker Fix.
// Registry visual-only per token grafici, path asset previsti e cache preload anti-flicker.
// Non modifica gameplay, targeting, AI, combat, deck, mappe o regole.

const VISUAL_ASSET_TOKEN_MODE_STORAGE_KEY = "arenaRubra.tokenGraphicsMode.v1";
const VISUAL_ASSET_TOKEN_MODE_DEFAULT = "on";
const VISUAL_ASSET_TOKEN_MODE_OPTIONS = Object.freeze(["off", "on"]);

const TOKEN_ASSET_TYPES = Object.freeze(["infantry", "vehicle", "structure", "commander", "pivot", "qg"]);
const TOKEN_ASSET_CLASSES_F9O5 = Object.freeze(["starter", "light", "heavy", "elite", "pivot", "commander"]);
const TOKEN_ASSET_FACTIONS = Object.freeze(["nexus", "exordium", "liberti", "agathoi", "fabeot"]);

function visualAssetTokenPath(factionKey, typeKey) {
  return `assets/tokens/${factionKey}/${typeKey}.webp`;
}

function visualAssetBuildTokenRegistry() {
  const out = {};
  for (const factionKey of TOKEN_ASSET_FACTIONS) {
    out[factionKey] = {};
    for (const typeKey of TOKEN_ASSET_TYPES) out[factionKey][typeKey] = visualAssetTokenPath(factionKey, typeKey);
  }
  out.custom = {};
  for (const typeKey of TOKEN_ASSET_TYPES.filter(t => t !== "qg")) out.custom[typeKey] = visualAssetTokenPath("custom", typeKey);
  return out;
}

const VISUAL_TOKEN_ASSET_REGISTRY = Object.freeze(visualAssetBuildTokenRegistry());


// F9M2f: cache visual-only dei token grafici.
// Motivo: renderBoard() ricrea il DOM a ogni render; durante i turni bot questo
// faceva ripartire il caricamento <img> e mostrava per una frazione di secondo
// il fallback CSS/SVG. Qui precarichiamo gli asset e ricordiamo lo stato, così
// i token possono essere renderizzati già come "loaded" quando l'immagine è in cache.
const VISUAL_TOKEN_ASSET_STATUS = new Map();
const VISUAL_TOKEN_ASSET_IMAGE_CACHE = new Map();
const VISUAL_TOKEN_ASSET_CALLBACKS = new Map();

function visualAssetTokenAssetStatus(path) {
  if (!path) return "missing";
  return VISUAL_TOKEN_ASSET_STATUS.get(path) || "unknown";
}

function visualAssetNotifyTokenCallbacks(path, status) {
  const callbacks = VISUAL_TOKEN_ASSET_CALLBACKS.get(path) || [];
  VISUAL_TOKEN_ASSET_CALLBACKS.delete(path);
  for (const cb of callbacks) {
    try { cb(status, path); }
    catch (err) { console.warn("Visual Asset Slots: callback token asset fallita", err); }
  }
}

function visualAssetPreloadTokenArt(path, callback=null) {
  if (!path || typeof Image === "undefined") return visualAssetTokenAssetStatus(path);
  const current = visualAssetTokenAssetStatus(path);
  if (current === "loaded" || current === "missing") {
    if (typeof callback === "function") setTimeout(() => callback(current, path), 0);
    return current;
  }
  if (typeof callback === "function") {
    const list = VISUAL_TOKEN_ASSET_CALLBACKS.get(path) || [];
    list.push(callback);
    VISUAL_TOKEN_ASSET_CALLBACKS.set(path, list);
  }
  if (current === "loading") return current;

  VISUAL_TOKEN_ASSET_STATUS.set(path, "loading");
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    VISUAL_TOKEN_ASSET_STATUS.set(path, "loaded");
    VISUAL_TOKEN_ASSET_IMAGE_CACHE.set(path, img);
    visualAssetNotifyTokenCallbacks(path, "loaded");
  };
  img.onerror = () => {
    VISUAL_TOKEN_ASSET_STATUS.set(path, "missing");
    visualAssetNotifyTokenCallbacks(path, "missing");
  };
  img.src = path;
  VISUAL_TOKEN_ASSET_IMAGE_CACHE.set(path, img);
  return "loading";
}

function visualAssetPreloadAllTokenAssets() {
  if (typeof Image === "undefined") return;
  for (const factionRegistry of Object.values(VISUAL_TOKEN_ASSET_REGISTRY || {})) {
    for (const path of Object.values(factionRegistry || {})) visualAssetPreloadTokenArt(path);
  }
}

function visualAssetTokenArtIsLoaded(path) {
  return visualAssetTokenAssetStatus(path) === "loaded";
}

function visualAssetReadJson(key, fallback) {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

function visualAssetWriteJson(key, value) {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(key, JSON.stringify(value, null, 2));
    return true;
  } catch (err) {
    console.warn("Visual Asset Slots: salvataggio localStorage fallito", err);
    return false;
  }
}

function visualAssetTokenModeNormalize(mode) {
  const clean = String(mode || "").toLowerCase();
  return VISUAL_ASSET_TOKEN_MODE_OPTIONS.includes(clean) ? clean : VISUAL_ASSET_TOKEN_MODE_DEFAULT;
}

function visualAssetTokenGraphicsMode() {
  const store = visualAssetReadJson(VISUAL_ASSET_TOKEN_MODE_STORAGE_KEY, null);
  if (!store || store.schema !== "arena-rubra-token-graphics-mode-v1") return VISUAL_ASSET_TOKEN_MODE_DEFAULT;
  return visualAssetTokenModeNormalize(store.mode);
}

function visualAssetSaveTokenGraphicsMode(mode) {
  const clean = visualAssetTokenModeNormalize(mode);
  return visualAssetWriteJson(VISUAL_ASSET_TOKEN_MODE_STORAGE_KEY, {
    schema: "arena-rubra-token-graphics-mode-v1",
    mode: clean,
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    updatedAt: new Date().toISOString()
  });
}

function visualAssetApplyTokenGraphicsMode(mode = visualAssetTokenGraphicsMode()) {
  const clean = visualAssetTokenModeNormalize(mode);
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.dataset.tokenGraphicsMode = clean;
    if (document.body) document.body.dataset.tokenGraphicsMode = clean;
  }
  if (clean === "on") visualAssetPreloadAllTokenAssets();
  return clean;
}

function visualAssetSetTokenGraphicsMode(mode, options = {}) {
  const clean = visualAssetApplyTokenGraphicsMode(mode);
  if (options.save) visualAssetSaveTokenGraphicsMode(clean);
  return clean;
}

function visualAssetTokenGraphicsEnabled() {
  return visualAssetTokenGraphicsMode() === "on" || (typeof document !== "undefined" && document.documentElement && document.documentElement.dataset.tokenGraphicsMode === "on");
}

function visualAssetFactionKeyForUnit(unit) {
  if (!unit) return "nexus";
  if (typeof factionMeta === "function") return factionMeta(unit.faction).key || "nexus";
  return String(unit.faction || "nexus").toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function visualAssetTokenTypeForUnit(unit) {
  if (!unit) return "infantry";
  const type = String(unit.type || "").toLowerCase();
  const weight = String(unit.weight || "").toLowerCase();
  if (type === "qg") return "qg";
  if (weight.includes("pivot")) return "pivot";
  if (type === "comandante") return "commander";
  if (type === "struttura") return "structure";
  if (type === "veicolo") return "vehicle";
  if (type === "fanteria") return "infantry";
  return "infantry";
}

function visualAssetTokenClassForUnitF9O5(unit) {
  if (!unit) return "light";
  const explicit = String(unit.tokenClass || unit.unitClass || "").toLowerCase();
  if (TOKEN_ASSET_CLASSES_F9O5.includes(explicit)) return explicit;
  const typeKey = visualAssetTokenTypeForUnit(unit);
  if (typeKey === "commander" || typeKey === "pivot") return typeKey;
  const weight = String(unit.weight || "").toLowerCase();
  if (weight.startsWith("pesant")) return "heavy";
  if (weight === "elite") return "elite";
  return "light";
}

function visualAssetTokenBaseTypeForUnitF9O5(unit) {
  const type = String(unit && unit.type || "").toLowerCase();
  if (type === "struttura") return "structure";
  if (type === "veicolo") return "vehicle";
  if (type === "comandante") return "commander";
  if (type === "qg") return "qg";
  return "infantry";
}

function visualAssetTokenCandidatesForUnit(unit) {
  if (!unit) return [];
  const factionKey = unit.customRuntime === true ? "custom" : visualAssetFactionKeyForUnit(unit);
  const classKey = visualAssetTokenClassForUnitF9O5(unit);
  const fallbackClass = String(unit.tokenFallbackClass || "").toLowerCase();
  const baseType = visualAssetTokenBaseTypeForUnitF9O5(unit);
  const legacyType = visualAssetTokenTypeForUnit(unit);
  const assetId = String(unit.tokenAssetId || unit.blueprintId || unit.id || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  const candidates = [];
  if (assetId) candidates.push(`assets/tokens/${factionKey}/units/${assetId}.webp`);
  candidates.push(`assets/tokens/${factionKey}/${baseType}/${classKey}.webp`);
  candidates.push(`assets/tokens/${factionKey}/${classKey}.webp`);
  if (fallbackClass && fallbackClass !== classKey) {
    candidates.push(`assets/tokens/${factionKey}/${baseType}/${fallbackClass}.webp`);
    candidates.push(`assets/tokens/${factionKey}/${fallbackClass}.webp`);
  }
  const registry = VISUAL_TOKEN_ASSET_REGISTRY[factionKey] || VISUAL_TOKEN_ASSET_REGISTRY.nexus;
  if (registry && registry[legacyType]) candidates.push(registry[legacyType]);
  if (registry && registry[baseType]) candidates.push(registry[baseType]);
  if (registry && registry.infantry) candidates.push(registry.infantry);
  return [...new Set(candidates.filter(Boolean))];
}

const VISUAL_TOKEN_CANDIDATE_WATCHED_F9O5 = new Set();
let VISUAL_TOKEN_RERENDER_QUEUED_F9O5 = false;
function visualAssetScheduleTokenRerenderF9O5() {
  if (VISUAL_TOKEN_RERENDER_QUEUED_F9O5) return;
  VISUAL_TOKEN_RERENDER_QUEUED_F9O5 = true;
  const run = () => {
    VISUAL_TOKEN_RERENDER_QUEUED_F9O5 = false;
    if (typeof renderBoard === "function") renderBoard();
  };
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
  else setTimeout(run, 0);
}

function visualAssetWatchTokenCandidateF9O5(path) {
  if (!path || VISUAL_TOKEN_CANDIDATE_WATCHED_F9O5.has(path)) return;
  VISUAL_TOKEN_CANDIDATE_WATCHED_F9O5.add(path);
  visualAssetPreloadTokenArt(path, () => visualAssetScheduleTokenRerenderF9O5());
}

function visualAssetTokenArtForUnit(unit) {
  const candidates = visualAssetTokenCandidatesForUnit(unit);
  if (!candidates.length) return null;
  for (const path of candidates) visualAssetWatchTokenCandidateF9O5(path);
  const loaded = candidates.find(path => visualAssetTokenAssetStatus(path) === "loaded");
  if (loaded) return loaded;
  // Conserva il vecchio asset generico come placeholder stabile mentre i livelli
  // dedicato/classe vengono risolti in background.
  const legacy = candidates[candidates.length - 1];
  if (legacy && visualAssetTokenAssetStatus(legacy) !== "missing") return legacy;
  return candidates.find(path => visualAssetTokenAssetStatus(path) !== "missing") || null;
}

function visualAssetTokenRegistryExport() {
  const status = {};
  for (const [path, value] of VISUAL_TOKEN_ASSET_STATUS.entries()) status[path] = value;
  const coverage = typeof BLUEPRINTS !== "undefined" ? BLUEPRINTS.map(bp => ({
    id: bp.id,
    faction: bp.faction,
    type: bp.type,
    unitClass: bp.unitClass || null,
    tokenClass: bp.tokenClass || null,
    tokenAssetId: bp.tokenAssetId || null,
    candidates: visualAssetTokenCandidatesForUnit(bp),
    resolved: visualAssetTokenArtForUnit(bp),
    resolvedStatus: visualAssetTokenAssetStatus(visualAssetTokenArtForUnit(bp))
  })) : [];
  return {
    schema: "arena-rubra-token-assets-f9o5-v1",
    mode: visualAssetTokenGraphicsMode(),
    assetFormat: "webp",
    root: "assets/tokens/",
    fallbackOrder: ["dedicated", "faction-type-class", "faction-class", "fallback-class", "legacy-faction-type", "procedural"],
    classes: [...TOKEN_ASSET_CLASSES_F9O5],
    registry: JSON.parse(JSON.stringify(VISUAL_TOKEN_ASSET_REGISTRY)),
    coverage,
    status
  };
}

try {
  visualAssetApplyTokenGraphicsMode();
} catch (err) {
  console.warn("Visual Asset Slots: bootstrap token graphics non riuscito", err);
}
