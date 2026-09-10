"use strict";

// AR-AC1 - persistenza delle mappe custom dietro porte sincrone esplicite.
// Il servizio non conosce DOM, localStorage, OPFS o stato di partita.

function createMapPersistenceService(dependencies = {}) {
  const {
    storageKey,
    schemaVersion,
    readJson,
    writeJson,
    safeId,
    normalizeDefinition,
    validateDefinition,
    isBuiltinId,
    nowIso
  } = dependencies;

  function fallbackStore() {
    return { schemaVersion, maps: {} };
  }

  function readStore() {
    const fallback = fallbackStore();
    const store = readJson(storageKey, fallback);
    if (!store || typeof store !== "object" || Array.isArray(store)) return fallback;
    if (!store.maps || typeof store.maps !== "object" || Array.isArray(store.maps)) store.maps = {};
    return store;
  }

  function writeStore(store) {
    const safe = store && typeof store === "object" ? store : fallbackStore();
    safe.schemaVersion = schemaVersion;
    if (!safe.maps || typeof safe.maps !== "object" || Array.isArray(safe.maps)) safe.maps = {};
    return writeJson(storageKey, safe);
  }

  function getDefinitions() {
    const store = readStore();
    return Object.values(store.maps || {}).map(definition => normalizeDefinition(definition, { imported: true }));
  }

  function getById(mapId) {
    const definition = readStore().maps[mapId];
    return definition ? normalizeDefinition(definition, { imported: true }) : null;
  }

  function saveDefinition(rawDefinition, options = {}) {
    const normalized = normalizeDefinition(rawDefinition, { imported: true });
    normalized.official = false;
    normalized.editable = true;
    const store = readStore();
    if (isBuiltinId(normalized.id)) {
      return { ok: false, issues: ["Una mappa custom non può sovrascrivere una mappa built-in."], code: "E_MAP_BUILTIN_READ_ONLY" };
    }
    if (store.maps[normalized.id] && options.overwrite !== true) {
      return { ok: false, issues: [`ID già presente: ${normalized.id}.`], code: "E_MAP_ID_CONFLICT" };
    }
    const now = nowIso();
    normalized.metadata.createdAt = normalized.metadata.createdAt || now;
    normalized.metadata.updatedAt = now;
    normalized.metadata.revision = Math.max(1, Number(normalized.metadata.revision) || 1);
    const validation = validateDefinition(normalized, { imported: true });
    if (!validation.valid) return { ok: false, issues: validation.errors.map(issue => `${issue.code}: ${issue.message}`), validation };
    store.maps[normalized.id] = normalized;
    const ok = writeStore(store);
    return { ok, definition: normalized, validation, issues: ok ? [] : ["Scrittura storage fallita."] };
  }

  function deleteDefinition(mapId) {
    const id = safeId(mapId, "");
    if (!id || isBuiltinId(id)) return { ok: false, code: "E_MAP_BUILTIN_READ_ONLY" };
    const store = readStore();
    if (!store.maps[id]) return { ok: false, code: "E_MAP_NOT_FOUND" };
    delete store.maps[id];
    return { ok: writeStore(store) };
  }

  return Object.freeze({
    readStore,
    writeStore,
    getDefinitions,
    getById,
    saveDefinition,
    deleteDefinition
  });
}
