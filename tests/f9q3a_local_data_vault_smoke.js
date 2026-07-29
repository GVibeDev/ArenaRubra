"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const code = fs.readFileSync(path.join(ROOT, "src/data_store.js"), "utf8");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const equal = (actual, expected, message) => { assert.strictEqual(actual, expected, message); checks += 1; };

class LocalStorageMock {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
  clear() { this.map.clear(); }
}

class MemoryFileHandle {
  constructor(directory, name) { this.directory = directory; this.name = name; }
  async getFile() {
    if (!this.directory.files.has(this.name)) {
      const error = new Error("not found"); error.name = "NotFoundError"; throw error;
    }
    const value = this.directory.files.get(this.name);
    return value instanceof Blob ? value : new Blob([String(value)], { type: "text/plain" });
  }
  async createWritable() {
    const self = this;
    return {
      async write(value) { self.directory.files.set(self.name, value); },
      async close() {}
    };
  }
}

class MemoryDirectory {
  constructor(name = "root") { this.name = name; this.directories = new Map(); this.files = new Map(); }
  async getDirectoryHandle(name, options = {}) {
    if (!this.directories.has(name)) {
      if (!options.create) { const error = new Error("not found"); error.name = "NotFoundError"; throw error; }
      this.directories.set(name, new MemoryDirectory(name));
    }
    return this.directories.get(name);
  }
  async getFileHandle(name, options = {}) {
    if (!this.files.has(name) && !options.create) { const error = new Error("not found"); error.name = "NotFoundError"; throw error; }
    if (!this.files.has(name) && options.create) this.files.set(name, "");
    return new MemoryFileHandle(this, name);
  }
  async removeEntry(name) { this.files.delete(name); this.directories.delete(name); }
}

function lookup(root, pathValue) {
  const parts = pathValue.split("/").filter(Boolean);
  const filename = parts.pop();
  let current = root;
  for (const part of parts) current = current.directories.get(part);
  return current && current.files.get(filename);
}

function createContext(localStorage, opfsRoot) {
  const context = vm.createContext({
    console,
    Math,
    Number,
    Array,
    Object,
    String,
    Boolean,
    JSON,
    Set,
    Map,
    Date,
    Promise,
    Blob,
    Uint8Array,
    TextEncoder,
    Buffer,
    structuredClone,
    atob: value => Buffer.from(value, "base64").toString("binary"),
    localStorage,
    navigator: { storage: { getDirectory: async () => opfsRoot } },
    setTimeout,
    clearTimeout
  });
  vm.runInContext(`${code}\nthis.__store = ArenaDataStore;`, context, { filename: "data_store.js" });
  return context;
}

(async () => {
  const customCards = [{ id: "CUS_TEST", name: "Test", customArt: { dataUrl: "data:image/png;base64,aGVsbG8=" } }];
  const decks = { demo: { deckName: "Demo", deckIds: ["CUS_TEST"] } };
  const maps = [{ id: "custom_map", name: "Mappa" }];
  const stats = [{ faction1: "Nexus", faction2: "Liberti", games: 1 }];
  const storage = new LocalStorageMock({
    "arenaRubra.customCards.v1": JSON.stringify(customCards),
    "arenaRubraF9H3SavedDecksV1": JSON.stringify(decks),
    "arenaRubra.maps.v1": JSON.stringify(maps),
    "arenaRubra.matchupStats.v1": JSON.stringify(stats)
  });
  const originRoot = new MemoryDirectory();
  const ctx = createContext(storage, originRoot);
  const store = ctx.__store;
  const diagnostics = await store.initialize();

  equal(diagnostics.backendName, "opfs", "OPFS è il backend preferito");
  ok(originRoot.directories.has("ArenaRubraData"), "creata directory privata ArenaRubraData");
  const vault = originRoot.directories.get("ArenaRubraData");
  ok(store.migration.backupPath && lookup(vault, store.migration.backupPath), "backup pre-migrazione creato");
  ok(store.migration.migrated.includes("arenaRubra.customCards.v1"), "carte legacy migrate");
  ok(store.migration.migrated.includes("arenaRubraF9H3SavedDecksV1"), "deck legacy migrati");
  ok(store.migration.migrated.includes("arenaRubra.maps.v1"), "mappe legacy migrate");
  ok(store.migration.migrated.includes("arenaRubra.matchupStats.v1"), "statistiche legacy migrate");

  const cardTextBlob = lookup(vault, "cards/index.json");
  const cardText = await (cardTextBlob instanceof Blob ? cardTextBlob.text() : new Blob([String(cardTextBlob)]).text());
  const persistedCards = JSON.parse(cardText);
  ok(!persistedCards[0].customArt.dataUrl, "Data URL rimosso dal JSON persistente");
  ok(persistedCards[0].customArt.assetPath.startsWith("cards/art/"), "JSON conserva riferimento artwork");
  ok(lookup(vault, persistedCards[0].customArt.assetPath) instanceof Blob, "artwork conservato come blob dedicato");
  equal(store.readJsonSync("arenaRubra.customCards.v1", [])[0].customArt.dataUrl, customCards[0].customArt.dataUrl, "mirror sincrona mantiene compatibilità renderer");

  const updatedMaps = [...maps, { id: "custom_map_2", name: "Seconda" }];
  store.writeJsonSync("arenaRubra.maps.v1", updatedMaps);
  await store.flushAll();
  const persistedMapText = await new Blob([String(lookup(vault, "maps/index.json"))]).text();
  equal(JSON.parse(persistedMapText).length, 2, "scrittura locale mappe completata");
  equal(JSON.parse(storage.getItem("arenaRubra.maps.v1")).length, 2, "copia compatibilità immediata mantenuta");

  const backup = await store.createBackup("smoke");
  ok(backup.ok && lookup(vault, backup.path), "backup manuale disponibile");
  store.writeJsonSync("arenaRubra.maps.v1", []);
  await store.flushAll();
  const restored = await store.restoreBackup(backup.payload);
  ok(restored.ok && restored.restored.includes("arenaRubra.maps.v1"), "ripristino backup funziona");
  equal(store.readJsonSync("arenaRubra.maps.v1", []).length, 2, "ripristino recupera le mappe");

  // Un secondo avvio sullo stesso origin non crea un altro backup pre-migrazione.
  const secondCtx = createContext(storage, originRoot);
  const secondStore = secondCtx.__store;
  await secondStore.initialize();
  equal(secondStore.migration.backupPath, null, "marker evita backup pre-migrazione ripetuti");
  equal(secondStore.diagnostics().backendName, "opfs", "riavvio riapre OPFS");
  equal(secondStore.readJsonSync("arenaRubra.maps.v1", []).length, 2, "dati sopravvivono al riavvio");

  const facade = fs.readFileSync(path.join(ROOT, "src/storage.js"), "utf8");
  const cardEditor = fs.readFileSync(path.join(ROOT, "src/card_editor.js"), "utf8");
  const deckBuilder = fs.readFileSync(path.join(ROOT, "src/deck_builder.js"), "utf8");
  const mapRuntime = fs.readFileSync(path.join(ROOT, "src/map_runtime.js"), "utf8");
  const statsSource = fs.readFileSync(path.join(ROOT, "src/stats.js"), "utf8");
  ok(facade.includes("ArenaDataStore.readJsonSync") && facade.includes("ArenaDataStore.writeJsonSync"), "facade centralizzata collegata al vault");
  ok(!cardEditor.includes("localStorage."), "editor carte non accede direttamente a localStorage");
  ok(!deckBuilder.includes("localStorage."), "deck builder non accede direttamente a localStorage");
  ok(!mapRuntime.includes("localStorage."), "runtime mappe non accede direttamente a localStorage");
  ok(!statsSource.includes("localStorage."), "statistiche non accedono direttamente a localStorage");

  console.log(`F9Q3a local data vault smoke: ${checks}/${checks} OK`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
