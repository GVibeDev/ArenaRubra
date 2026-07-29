"use strict";

// Arena Rubra – F9Q3a Local Data Vault.
// Backend preferito: Origin Private File System, con directory ArenaRubraData.
// Fallback: IndexedDB; ultimo fallback: localStorage. Le API sincrone legacy
// leggono da una mirror inizializzata prima della AppShell e scrivono in coda.

const ARENA_DATA_STORE_VERSION = 1;
const ARENA_DATA_STORE_DIRECTORY = "ArenaRubraData";
const ARENA_DATA_STORE_DB = "ArenaRubraDataVault";
const ARENA_DATA_STORE_DB_VERSION = 1;
const ARENA_DATA_STORE_MAX_BACKUPS = 8;
const ARENA_DATA_STORE_MIGRATION_MARKER = "arenaRubra.dataStoreMigration.v1";

const ARENA_DATA_PATHS = Object.freeze({
  "arenaRubra.customCards.v1": "cards/index.json",
  "arenaRubraF9H3SavedDecksV1": "decks/index.json",
  "arenaRubra.maps.v1": "maps/index.json",
  "arenaRubra.matchupStats.v1": "stats/matchup-stats.json",
  "arenaRubra.matchHistory.v1": "stats/match-history.json",
  "arenaRubra.settings.v1": "settings/app-settings.json",
  "arenaRubra.tutorial.v1": "settings/tutorial-progress.json",
  "arenaRubra.mapSkin.v1": "settings/map-skin.json",
  "arenaRubra.tokenGraphicsMode.v1": "settings/token-graphics.json",
  "arenaRubra.rendererTextCalibration.v2": "settings/renderer-calibration.json",
  "arenaRubra.menuLayoutCalibration.v1": "settings/menu-layout-calibration.json"
});

function arenaDataClone(value) {
  if (value == null) return value;
  try { return structuredClone(value); } catch (_) {}
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
}

function arenaDataSafePart(value, fallback = "item") {
  const out = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return out || fallback;
}

function arenaDataNowStamp() {
  try { return new Date().toISOString().replace(/[:.]/g, "-"); }
  catch (_) { return String(Date.now()); }
}

function arenaDataLocalStorageAvailable() {
  try {
    if (typeof localStorage === "undefined") return false;
    const key = "__arenaDataStoreProbe__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch (_) { return false; }
}

function arenaDataDataUrlToBlob(dataUrl) {
  const text = String(dataUrl || "");
  const match = text.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!match || typeof Blob === "undefined") return null;
  const mime = match[1] || "application/octet-stream";
  const base64 = Boolean(match[2]);
  try {
    let bytes;
    if (base64) {
      const binary = typeof atob === "function"
        ? atob(match[3])
        : (typeof Buffer !== "undefined" ? Buffer.from(match[3], "base64").toString("binary") : "");
      bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    } else {
      const decoded = decodeURIComponent(match[3]);
      bytes = new TextEncoder().encode(decoded);
    }
    return new Blob([bytes], { type: mime });
  } catch (_) { return null; }
}

function arenaDataBlobToDataUrl(blob) {
  if (!blob) return Promise.resolve("");
  if (typeof FileReader === "function") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Blob non leggibile"));
      reader.readAsDataURL(blob);
    });
  }
  if (typeof Buffer !== "undefined" && blob.arrayBuffer) {
    return blob.arrayBuffer().then(buffer => `data:${blob.type || "application/octet-stream"};base64,${Buffer.from(buffer).toString("base64")}`);
  }
  return Promise.resolve("");
}

const ArenaDataStore = {
  backendName: "uninitialized",
  initialized: false,
  initializationError: null,
  migration: { migrated: [], restored: [], issues: [], backupPath: null },
  mirror: new Map(),
  pendingWrites: new Map(),
  opfsRoot: null,
  idb: null,
  readyPromise: null,

  pathForKey(key) {
    return ARENA_DATA_PATHS[key] || `settings/legacy/${arenaDataSafePart(key, "entry")}.json`;
  },

  async initialize() {
    if (this.readyPromise) return this.readyPromise;
    this.readyPromise = this._initializeInternal();
    return this.readyPromise;
  },

  async ready() {
    return this.initialize();
  },

  async _initializeInternal() {
    try {
      await this._selectBackend();
      await this._backupLegacyBeforeMigration();
      for (const key of Object.keys(ARENA_DATA_PATHS)) {
        await this._loadRegisteredKey(key);
      }
      await this._writeManifest();
      if (["opfs", "indexedDB"].includes(this.backendName) && arenaDataLocalStorageAvailable()) {
        try {
          localStorage.setItem(ARENA_DATA_STORE_MIGRATION_MARKER, JSON.stringify({
            schemaVersion: ARENA_DATA_STORE_VERSION,
            completedAt: new Date().toISOString(),
            backend: this.backendName,
            backupPath: this.migration.backupPath
          }));
        } catch (_) {}
      }
      this.initialized = true;
      return this.diagnostics();
    } catch (error) {
      this.initializationError = error;
      this.migration.issues.push(`Inizializzazione vault fallita: ${error && error.message ? error.message : error}`);
      this.backendName = arenaDataLocalStorageAvailable() ? "localStorage" : "memory";
      this.initialized = true;
      return this.diagnostics();
    }
  },

  async _selectBackend() {
    if (typeof navigator !== "undefined" && navigator.storage && typeof navigator.storage.getDirectory === "function") {
      try {
        const originRoot = await navigator.storage.getDirectory();
        this.opfsRoot = await originRoot.getDirectoryHandle(ARENA_DATA_STORE_DIRECTORY, { create: true });
        this.backendName = "opfs";
        return;
      } catch (error) {
        this.migration.issues.push(`OPFS non disponibile: ${error && error.message ? error.message : error}`);
      }
    }
    if (typeof indexedDB !== "undefined") {
      try {
        this.idb = await this._openIndexedDb();
        this.backendName = "indexedDB";
        return;
      } catch (error) {
        this.migration.issues.push(`IndexedDB non disponibile: ${error && error.message ? error.message : error}`);
      }
    }
    this.backendName = arenaDataLocalStorageAvailable() ? "localStorage" : "memory";
  },

  _openIndexedDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(ARENA_DATA_STORE_DB, ARENA_DATA_STORE_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("entries")) db.createObjectStore("entries");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Apertura IndexedDB fallita"));
    });
  },

  _idbRequest(mode, action) {
    return new Promise((resolve, reject) => {
      const tx = this.idb.transaction("entries", mode);
      const store = tx.objectStore("entries");
      let request;
      try { request = action(store); }
      catch (error) { reject(error); return; }
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Operazione IndexedDB fallita"));
    });
  },

  async _opfsDirectory(parts, create = false) {
    let directory = this.opfsRoot;
    for (const part of parts) directory = await directory.getDirectoryHandle(part, { create });
    return directory;
  },

  async _opfsRead(path) {
    const parts = String(path).split("/").filter(Boolean);
    const filename = parts.pop();
    try {
      const directory = await this._opfsDirectory(parts, false);
      const handle = await directory.getFileHandle(filename, { create: false });
      return await handle.getFile();
    } catch (error) {
      if (error && error.name === "NotFoundError") return null;
      throw error;
    }
  },

  async _opfsWrite(path, payload) {
    const parts = String(path).split("/").filter(Boolean);
    const filename = parts.pop();
    const directory = await this._opfsDirectory(parts, true);
    const handle = await directory.getFileHandle(filename, { create: true });
    const writable = await handle.createWritable();
    await writable.write(payload);
    await writable.close();
    return true;
  },

  async _backendReadText(path) {
    if (this.backendName === "opfs") {
      const file = await this._opfsRead(path);
      return file ? file.text() : null;
    }
    if (this.backendName === "indexedDB") {
      const value = await this._idbRequest("readonly", store => store.get(`text:${path}`));
      return typeof value === "string" ? value : null;
    }
    return null;
  },

  async _backendWriteText(path, text) {
    if (this.backendName === "opfs") return this._opfsWrite(path, String(text));
    if (this.backendName === "indexedDB") {
      await this._idbRequest("readwrite", store => store.put(String(text), `text:${path}`));
      return true;
    }
    return false;
  },

  async writeBlob(path, blob) {
    if (!blob) return false;
    if (this.backendName === "opfs") return this._opfsWrite(path, blob);
    if (this.backendName === "indexedDB") {
      await this._idbRequest("readwrite", store => store.put(blob, `blob:${path}`));
      return true;
    }
    return false;
  },

  async readBlob(path) {
    if (this.backendName === "opfs") return this._opfsRead(path);
    if (this.backendName === "indexedDB") {
      const value = await this._idbRequest("readonly", store => store.get(`blob:${path}`));
      return value || null;
    }
    return null;
  },

  async removeBlob(path) {
    const safePath = String(path || "").split("/").filter(Boolean).join("/");
    if (!safePath) return false;
    if (this.backendName === "indexedDB") {
      await this._idbRequest("readwrite", store => store.delete(`blob:${safePath}`));
      return true;
    }
    if (this.backendName === "opfs") {
      const parts = safePath.split("/");
      const filename = parts.pop();
      try {
        const directory = await this._opfsDirectory(parts, false);
        await directory.removeEntry(filename);
        return true;
      } catch (error) {
        if (error && error.name === "NotFoundError") return false;
        throw error;
      }
    }
    return false;
  },

  async _prepareValueForPersistence(key, value) {
    const prepared = arenaDataClone(value);
    if (key !== "arenaRubra.customCards.v1" || !Array.isArray(prepared) || !["opfs", "indexedDB"].includes(this.backendName)) return prepared;
    for (const card of prepared) {
      if (!card || !card.customArt || !card.customArt.dataUrl) continue;
      const blob = arenaDataDataUrlToBlob(card.customArt.dataUrl);
      if (!blob) continue;
      const extension = blob.type.includes("png") ? "png" : blob.type.includes("jpeg") ? "jpg" : "webp";
      const assetId = card.customArt.assetId || `card-art-${arenaDataSafePart(card.id || card.name, "custom")}`;
      const assetPath = `cards/art/${assetId}.${extension}`;
      await this.writeBlob(assetPath, blob);
      card.customArt = {
        ...card.customArt,
        assetId,
        assetPath,
        mime: blob.type || card.customArt.mime || "image/webp"
      };
      delete card.customArt.dataUrl;
    }
    return prepared;
  },

  async _hydrateValue(key, value) {
    const hydrated = arenaDataClone(value);
    if (key !== "arenaRubra.customCards.v1" || !Array.isArray(hydrated)) return hydrated;
    for (const card of hydrated) {
      if (!card || !card.customArt || card.customArt.dataUrl || !card.customArt.assetPath) continue;
      try {
        const blob = await this.readBlob(card.customArt.assetPath);
        if (blob) card.customArt.dataUrl = await arenaDataBlobToDataUrl(blob);
      } catch (error) {
        this.migration.issues.push(`${card.id || "Carta custom"}: artwork locale non leggibile.`);
      }
    }
    return hydrated;
  },

  async _loadRegisteredKey(key) {
    const path = this.pathForKey(key);
    let loaded = null;
    const text = await this._backendReadText(path);
    if (text) {
      try { loaded = JSON.parse(text); }
      catch (error) { this.migration.issues.push(`${path}: JSON locale corrotto, uso backup compatibilità.`); }
    }
    if (loaded == null && arenaDataLocalStorageAvailable()) {
      const legacy = localStorage.getItem(key);
      if (legacy) {
        try {
          loaded = JSON.parse(legacy);
          this.migration.migrated.push(key);
          if (["opfs", "indexedDB"].includes(this.backendName)) {
            const prepared = await this._prepareValueForPersistence(key, loaded);
            await this._backendWriteText(path, JSON.stringify(prepared, null, 2));
          }
        } catch (error) {
          this.migration.issues.push(`${key}: dato legacy non valido.`);
        }
      }
    } else if (loaded != null) {
      this.migration.restored.push(key);
    }
    if (loaded != null) this.mirror.set(key, await this._hydrateValue(key, loaded));
  },

  readJsonSync(key, fallback) {
    if (this.mirror.has(key)) return arenaDataClone(this.mirror.get(key));
    if (arenaDataLocalStorageAvailable()) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.mirror.set(key, parsed);
          return arenaDataClone(parsed);
        }
      } catch (_) {}
    }
    return arenaDataClone(fallback);
  },

  writeJsonSync(key, value) {
    const safe = arenaDataClone(value);
    this.mirror.set(key, safe);
    // Copia di compatibilità immediata: evita perdita dati se WebView viene chiusa
    // prima del completamento della scrittura OPFS/IDB.
    if (arenaDataLocalStorageAvailable()) {
      try { localStorage.setItem(key, JSON.stringify(safe, null, 2)); } catch (_) {}
    }
    this.pendingWrites.set(key, true);
    Promise.resolve().then(() => this.flushKey(key)).catch(error => {
      this.migration.issues.push(`${key}: scrittura differita fallita (${error && error.message ? error.message : error}).`);
    });
    return true;
  },

  removeSync(key) {
    this.mirror.delete(key);
    if (arenaDataLocalStorageAvailable()) {
      try { localStorage.removeItem(key); } catch (_) {}
    }
    this.pendingWrites.delete(key);
    Promise.resolve().then(async () => {
      const path = this.pathForKey(key);
      if (this.backendName === "indexedDB") await this._idbRequest("readwrite", store => store.delete(`text:${path}`));
      if (this.backendName === "opfs") {
        const parts = path.split("/").filter(Boolean);
        const filename = parts.pop();
        try { const directory = await this._opfsDirectory(parts, false); await directory.removeEntry(filename); } catch (_) {}
      }
    });
    return true;
  },

  async flushKey(key) {
    if (!this.mirror.has(key) || !["opfs", "indexedDB"].includes(this.backendName)) {
      this.pendingWrites.delete(key);
      return false;
    }
    const prepared = await this._prepareValueForPersistence(key, this.mirror.get(key));
    await this._backendWriteText(this.pathForKey(key), JSON.stringify(prepared, null, 2));
    this.pendingWrites.delete(key);
    await this._writeManifest();
    return true;
  },

  async flushAll() {
    for (const key of [...this.pendingWrites.keys()]) await this.flushKey(key);
    return true;
  },

  async _backupLegacyBeforeMigration() {
    if (!["opfs", "indexedDB"].includes(this.backendName) || !arenaDataLocalStorageAvailable()) return;
    try {
      const marker = JSON.parse(localStorage.getItem(ARENA_DATA_STORE_MIGRATION_MARKER) || "null");
      if (marker && Number(marker.schemaVersion) >= ARENA_DATA_STORE_VERSION) return;
    } catch (_) {}
    const legacy = {};
    for (const key of Object.keys(ARENA_DATA_PATHS)) {
      const raw = localStorage.getItem(key);
      if (raw != null) legacy[key] = raw;
    }
    if (!Object.keys(legacy).length) return;
    const path = `backups/pre-migration-${arenaDataNowStamp()}.json`;
    await this._backendWriteText(path, JSON.stringify({
      kind: "arena-rubra-pre-migration-backup",
      schemaVersion: ARENA_DATA_STORE_VERSION,
      createdAt: new Date().toISOString(),
      entries: legacy
    }, null, 2));
    this.migration.backupPath = path;
  },

  async createBackup(label = "manual") {
    await this.flushAll();
    const entries = {};
    for (const [key, value] of this.mirror.entries()) entries[key] = arenaDataClone(value);
    const path = `backups/${arenaDataSafePart(label, "backup")}-${arenaDataNowStamp()}.json`;
    const payload = {
      kind: "arena-rubra-local-vault-backup",
      schemaVersion: ARENA_DATA_STORE_VERSION,
      createdAt: new Date().toISOString(),
      backend: this.backendName,
      entries
    };
    if (["opfs", "indexedDB"].includes(this.backendName)) await this._backendWriteText(path, JSON.stringify(payload, null, 2));
    return { ok: true, path, payload };
  },

  async restoreBackup(backup) {
    let payload = backup;
    if (typeof backup === "string") {
      const text = await this._backendReadText(backup);
      if (!text) throw new Error("Backup locale non trovato");
      payload = JSON.parse(text);
    }
    if (!payload || typeof payload !== "object" || !payload.entries || typeof payload.entries !== "object") {
      throw new Error("Formato backup Arena Rubra non valido");
    }
    const restored = [];
    for (const [key, value] of Object.entries(payload.entries)) {
      const parsed = typeof value === "string" ? (() => { try { return JSON.parse(value); } catch (_) { return null; } })() : value;
      if (parsed == null) continue;
      this.mirror.set(key, arenaDataClone(parsed));
      this.pendingWrites.set(key, true);
      if (arenaDataLocalStorageAvailable()) {
        try { localStorage.setItem(key, JSON.stringify(parsed, null, 2)); } catch (_) {}
      }
      restored.push(key);
    }
    await this.flushAll();
    return { ok: true, restored };
  },

  async _writeManifest() {
    if (!["opfs", "indexedDB"].includes(this.backendName)) return false;
    const manifest = {
      kind: "arena-rubra-local-data-vault",
      schemaVersion: ARENA_DATA_STORE_VERSION,
      directory: ARENA_DATA_STORE_DIRECTORY,
      backend: this.backendName,
      updatedAt: new Date().toISOString(),
      paths: ARENA_DATA_PATHS,
      pendingWrites: [...this.pendingWrites.keys()]
    };
    return this._backendWriteText("manifest.json", JSON.stringify(manifest, null, 2));
  },

  diagnostics() {
    return {
      schemaVersion: ARENA_DATA_STORE_VERSION,
      directory: ARENA_DATA_STORE_DIRECTORY,
      backendName: this.backendName,
      initialized: this.initialized,
      entries: this.mirror.size,
      pendingWrites: this.pendingWrites.size,
      migration: arenaDataClone(this.migration),
      error: this.initializationError ? String(this.initializationError.message || this.initializationError) : null
    };
  }
};

function arenaDataStoreReady() {
  return ArenaDataStore.ready();
}

function arenaDataStoreDiagnostics() {
  return ArenaDataStore.diagnostics();
}
