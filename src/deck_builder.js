"use strict";

// Arena Rubra – F9N10 Deck Builder con libreria built-in e Missione supplementare.
// I deck con carte custom restano marcati NON UFFICIALI, ma possono entrare nel runtime
// quando il Setup seleziona esplicitamente un deck personalizzato salvato.

const deckBuilderState = {
  faction: "Nexus",
  commanderId: "",
  draftsByKey: {},
  feedback: "",
  selectedSavedKey: "",
  selectedPreviewCardId: "",
  includeCustomCards: false,
  deckName: ""
};

const DECK_BUILDER_STORAGE_KEY = typeof ARENA_STORAGE_KEYS !== "undefined" ? ARENA_STORAGE_KEYS.customDecks : "arenaRubraF9H3SavedDecksV1";

function deckBuilderNowIso() {
  try { return new Date().toISOString(); } catch (_) { return ""; }
}

function deckBuilderBuiltinDeckStore() {
  return typeof BUILTIN_DECKS !== "undefined" && BUILTIN_DECKS && typeof BUILTIN_DECKS === "object"
    ? BUILTIN_DECKS
    : {};
}

function deckBuilderIsBuiltinKey(key, payload=null) {
  const builtin = deckBuilderBuiltinDeckStore();
  return Boolean((payload && payload.builtIn === true) || Object.prototype.hasOwnProperty.call(builtin, String(key || "")));
}

function deckBuilderReadLocalSavedStore() {
  if (typeof arenaStorageReadCustomDecks === "function") return arenaStorageReadCustomDecks();
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(DECK_BUILDER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (err) {
    console.warn("Deck Builder: store localStorage non leggibile", err);
    return {};
  }
}

function deckBuilderReadSavedStore() {
  // Le copie locali non possono sostituire i preset integrati con la stessa chiave.
  return { ...deckBuilderReadLocalSavedStore(), ...deckBuilderBuiltinDeckStore() };
}

function deckBuilderLocalOnlyStore(store) {
  const out = {};
  Object.entries(store || {}).forEach(([key, payload]) => {
    if (deckBuilderIsBuiltinKey(key, payload)) return;
    out[key] = payload;
  });
  return out;
}

function deckBuilderWriteSavedStore(store) {
  const localOnly = deckBuilderLocalOnlyStore(store);
  if (typeof arenaStorageWriteCustomDecks === "function") return arenaStorageWriteCustomDecks(localOnly);
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(DECK_BUILDER_STORAGE_KEY, JSON.stringify(localOnly, null, 2));
    return true;
  } catch (err) {
    console.warn("Deck Builder: salvataggio localStorage fallito", err);
    return false;
  }
}

function deckBuilderSetFeedback(message, tone = "") {
  deckBuilderState.feedback = message || "";
  if (typeof document === "undefined") return;
  const el = document.getElementById("deckBuilderFeedback");
  if (!el) return;
  el.textContent = deckBuilderState.feedback;
  el.classList.toggle("good", tone === "good");
  el.classList.toggle("bad", tone === "bad");
}

function deckBuilderNormalizeDeckName(value) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  return text.slice(0, 64);
}

function deckBuilderSlugPart(value) {
  const slug = String(value || "deck")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 44);
  return slug || "deck";
}

function deckBuilderDefaultDeckName(report = null) {
  const faction = report && report.faction ? report.faction : deckBuilderResolvedFaction();
  const commander = report && (report.commanderName || report.commanderId) ? (report.commanderName || report.commanderId) : "Comandante";
  const mode = report && report.containsCustomCards ? "Custom Lab" : "Ufficiale";
  return `${faction} · ${commander} · ${mode}`;
}

function deckBuilderCurrentDeckName(report = null) {
  const input = typeof document !== "undefined" ? document.getElementById("deckBuilderDeckNameInput") : null;
  const fromInput = input ? deckBuilderNormalizeDeckName(input.value) : "";
  const fromState = deckBuilderNormalizeDeckName(deckBuilderState.deckName || "");
  return fromInput || fromState || deckBuilderDefaultDeckName(report);
}

function deckBuilderBaseKey(faction, commanderId, includeCustom = false) {
  const resolvedFaction = faction || deckBuilderResolvedFaction();
  const resolvedCommander = commanderId || "default";
  return `${resolvedFaction}::${resolvedCommander}${includeCustom ? "::CUSTOM" : ""}`;
}

function deckBuilderSavedKeyBaseForPayload(payload, fallbackKey = "") {
  const faction = payload && payload.faction ? payload.faction : String(fallbackKey || "").split("::")[0] || "";
  const commanderId = payload && payload.commanderId ? payload.commanderId : String(fallbackKey || "").split("::")[1] || "";
  const hasCustom = deckBuilderSavedPayloadHasCustom(payload, deckBuilderCatalog({ includeCustom: true }));
  return deckBuilderBaseKey(faction, commanderId, hasCustom);
}

function deckBuilderStorageKeyForReport(report, deckName) {
  const name = deckBuilderNormalizeDeckName(deckName) || deckBuilderDefaultDeckName(report);
  const slug = deckBuilderSlugPart(name);
  return `${report.draftKey}::${slug}`;
}

function deckBuilderSavedPayloadFor(faction, commanderId, options = {}) {
  const store = deckBuilderReadSavedStore();
  const exactKey = options && options.savedKey ? String(options.savedKey) : "";
  if (exactKey) return store[exactKey] || null;

  const includeCustom = Boolean(options && options.includeCustom);
  const legacyKey = deckBuilderDraftKey(faction, commanderId, { includeCustom });
  if (store[legacyKey]) return store[legacyKey];

  const entries = deckBuilderSavedPayloadEntriesFor(faction, commanderId, { includeCustom });
  return entries.length ? entries[0].payload : null;
}

function deckBuilderSavedPayloadEntriesFor(faction, commanderId, options = {}) {
  const store = deckBuilderReadSavedStore();
  const includeCustomFilter = options && Object.prototype.hasOwnProperty.call(options, "includeCustom") ? Boolean(options.includeCustom) : null;
  const allowCustom = options && Object.prototype.hasOwnProperty.call(options, "allowCustom") ? Boolean(options.allowCustom) : true;
  const expectedFaction = faction || "";
  const expectedCommander = commanderId || "";
  const entries = [];
  Object.entries(store || {}).forEach(([key, payload]) => {
    if (!payload || typeof payload !== "object") return;
    const payloadFaction = payload.faction || String(key).split("::")[0] || "";
    const payloadCommander = payload.commanderId || String(key).split("::")[1] || "";
    if (expectedFaction && payloadFaction !== expectedFaction) return;
    if (expectedCommander && payloadCommander !== expectedCommander) return;
    const hasCustom = deckBuilderSavedPayloadHasCustom(payload, deckBuilderCatalog({ includeCustom: true }));
    if (hasCustom && !allowCustom) return;
    if (includeCustomFilter !== null && hasCustom !== includeCustomFilter) return;
    entries.push({
      key,
      payload,
      faction: payloadFaction,
      commanderId: payloadCommander,
      containsCustomCards: hasCustom,
      savedAt: payload.savedAt || payload.updatedAt || payload.importedAt || "",
      deckName: deckBuilderNormalizeDeckName(payload.deckName || payload.name || ""),
      builtIn:deckBuilderIsBuiltinKey(key, payload),
      supplementalMissionId:payload.supplementalMissionId || null
    });
  });
  return entries.sort((a, b) => Number(Boolean(b.builtIn)) - Number(Boolean(a.builtIn)) || String(a.deckName || "").localeCompare(String(b.deckName || "")) || String(b.savedAt || "").localeCompare(String(a.savedAt || "")));
}

function deckBuilderSavedStatusForSetup(faction, commanderId, catalog = null, options = {}) {
  const allowCustom = Boolean(options && options.allowCustom);
  const preferCustom = Boolean(options && options.preferCustom);
  const savedKey = options && options.savedKey ? String(options.savedKey) : "";
  const officialCatalog = catalog || deckBuilderOfficialCatalog();
  const customCatalog = allowCustom ? deckBuilderCatalog({ includeCustom: true }) : officialCatalog;
  const candidates = [];

  if (savedKey) {
    const payload = deckBuilderSavedPayloadFor(faction, commanderId, { savedKey });
    if (payload) {
      const payloadHasCustom = deckBuilderSavedPayloadHasCustom(payload, customCatalog);
      candidates.push({ key:savedKey, payload, includeCustom:payloadHasCustom, runtimeMode:payloadHasCustom ? "custom_lab" : "official" });
    }
  } else {
    const entries = deckBuilderSavedPayloadEntriesFor(faction, commanderId, { allowCustom });
    const customEntries = entries.filter(e => e.containsCustomCards);
    const officialEntries = entries.filter(e => !e.containsCustomCards);
    const ordered = preferCustom ? [...customEntries, ...officialEntries] : [...officialEntries, ...customEntries];
    ordered.forEach(entry => candidates.push({
      key: entry.key,
      payload: entry.payload,
      includeCustom: entry.containsCustomCards,
      runtimeMode: entry.containsCustomCards ? "custom_lab" : "official"
    }));
  }

  if (!candidates.length) {
    return {
      ok: false,
      exists: false,
      key: savedKey || "",
      runtimeMode: allowCustom ? "custom_lab" : "official",
      issues: [allowCustom ? "nessun deck salvato selezionabile per Setup/Custom Lab" : "nessun deck ufficiale salvato"],
      payload: null
    };
  }

  const checked = candidates.map(entry => {
    const sourceCatalog = entry.includeCustom ? customCatalog : officialCatalog;
    const check = deckBuilderValidateSavedDeckPayload(entry.payload, faction, commanderId, sourceCatalog, {
      allowCustom: entry.includeCustom,
      setupRuntime: true,
      savedKey: entry.key
    });
    return { ...check, key: entry.key, savedKey: entry.key, runtimeMode: entry.runtimeMode, includeCustomRuntime: entry.includeCustom };
  });

  return checked.find(check => check.ok) || checked[0];
}

function deckBuilderSupplementalMissionCard(payload, faction, commanderId, catalog = null) {
  const rawId = payload && payload.supplementalMissionId ? String(payload.supplementalMissionId) : "";
  if (!rawId) return { id:"", card:null, issues:[] };
  const cardId = rawId.startsWith("MISSION:") ? rawId : `MISSION:${rawId}`;
  const sourceCatalog = catalog || deckBuilderCatalog({ includeCustom:false });
  const pool = deckBuilderPoolFor(faction, commanderId, sourceCatalog);
  const card = pool.find(item => item && item.id === cardId) || null;
  const issues = [];
  if (!card) issues.push(`Missione supplementare non trovata nel pool: ${cardId}`);
  else if (!(card.sourceType === "mission" || card.cardType === "mission" || card.deckRole === "mission")) issues.push(`${cardId} non è una Missione`);
  else if (card.faction !== faction) issues.push(`Missione supplementare ${cardId} appartiene a ${card.faction}, attesa ${faction}`);
  return { id:cardId, card, issues };
}

function deckBuilderValidateSavedDeckPayload(payload, faction = null, commanderId = null, catalog = null, options = {}) {
  const allowCustom = options && options.allowCustom !== undefined ? Boolean(options.allowCustom) : deckBuilderIncludeCustomCards();
  const sourceCatalog = catalog || deckBuilderCatalog({ includeCustom: allowCustom });
  const expectedFaction = faction || (payload && payload.faction) || "";
  const expectedCommander = commanderId || (payload && payload.commanderId) || "";
  const ids = payload && Array.isArray(payload.deckIds) ? payload.deckIds : [];
  const payloadHasCustom = deckBuilderSavedPayloadHasCustom(payload, deckBuilderCatalog({ includeCustom: true }));
  const draftData = deckBuilderDraftCardsFromIds(ids, expectedFaction, expectedCommander, sourceCatalog);
  const sanity = deckBuilderValidateDraft(draftData.cards, {
    faction: expectedFaction,
    commanderId: expectedCommander,
    catalog: sourceCatalog,
    poolSize: deckBuilderPoolFor(expectedFaction, expectedCommander, sourceCatalog).length,
    invalidIds: draftData.invalidIds
  });
  const supplemental = deckBuilderSupplementalMissionCard(payload, expectedFaction, expectedCommander, sourceCatalog);
  const countedMissionCopies = draftData.cards.filter(card => card && (card.sourceType === "mission" || card.cardType === "mission" || card.deckRole === "mission")).length;
  const supplementalMissionCopies = supplemental.card ? 1 : 0;
  const runtimeMissionCopies = countedMissionCopies + supplementalMissionCopies;
  const issues = [];
  if (!payload || typeof payload !== "object") issues.push("payload assente");
  if (payload && payload.faction !== expectedFaction) issues.push(`fazione salvata ${payload.faction || "—"}, attesa ${expectedFaction}`);
  if (payload && payload.commanderId !== expectedCommander) issues.push(`comandante salvato ${payload.commanderId || "—"}, atteso ${expectedCommander}`);
  if (payloadHasCustom && !allowCustom) issues.push("deck non ufficiale con carte CUSTOM: non disponibile nel runtime standard");
  if (!sanity.ok) issues.push(...sanity.issues);
  if (supplemental.issues.length) issues.push(...supplemental.issues);
  if (supplemental.card && countedMissionCopies > 0) issues.push("una Missione supplementare non può affiancare una Missione già conteggiata nel deck");
  if (runtimeMissionCopies > 1) issues.push(`copie Missione runtime ${runtimeMissionCopies}, massimo 1`);

  const supplementalCard = supplemental.card ? {
    ...(typeof withDeckCopyMeta === "function" ? withDeckCopyMeta(supplemental.card, 1) : supplemental.card),
    supplementalDeckCard:true,
    countedInDeck:false,
    supplementalMissionId:String(payload.supplementalMissionId || supplemental.card.sourceId || ""),
    supplementalMissionReason:payload.supplementalMissionReason || "Missione supplementare esclusa dal solo contatore del deck."
  } : null;
  const countedCards = draftData.cards.map(card => ({ ...card, countedInDeck:card.countedInDeck !== false }));
  const runtimeCards = supplementalCard ? [...countedCards, supplementalCard] : countedCards;
  const saveKey = options && options.savedKey ? String(options.savedKey) : deckBuilderDraftKey(expectedFaction, expectedCommander, { includeCustom: allowCustom && payloadHasCustom });
  return {
    ok: issues.length === 0,
    exists: Boolean(payload),
    key: saveKey,
    savedKey: saveKey,
    payload,
    faction: expectedFaction,
    commanderId: expectedCommander,
    deckName: deckBuilderNormalizeDeckName(payload && (payload.deckName || payload.name)) || deckBuilderDefaultDeckName({ faction: expectedFaction, commanderId: expectedCommander, containsCustomCards: payloadHasCustom }),
    deckIds: ids,
    cards: countedCards,
    runtimeCards,
    countedDeckSize:countedCards.length,
    runtimeCardTotal:runtimeCards.length,
    supplementalMissionId:supplementalCard ? (supplementalCard.missionId || supplementalCard.sourceId || String(supplementalCard.id || "").replace(/^MISSION:/, "")) : null,
    supplementalMissionCard:supplementalCard,
    supplementalMissionCopies,
    runtimeMissionCopies,
    containsCustomCards: payloadHasCustom || deckBuilderCustomCardCount(draftData.cards) > 0,
    official: !(payloadHasCustom || deckBuilderCustomCardCount(draftData.cards) > 0),
    builtIn:deckBuilderIsBuiltinKey(saveKey, payload),
    sanity:{ ...sanity, countedMissionCopies, supplementalMissionCopies, runtimeMissionCopies, countedDeckSize:countedCards.length, runtimeCardTotal:runtimeCards.length },
    issues
  };
}

function deckBuilderValidatedSavedDeckForRuntime(faction, commanderId, catalog = null, options = {}) {
  const allowCustom = options && Object.prototype.hasOwnProperty.call(options, "allowCustom") ? Boolean(options.allowCustom) : true;
  return deckBuilderSavedStatusForSetup(faction, commanderId, catalog || deckBuilderOfficialCatalog(), {
    allowCustom,
    preferCustom: allowCustom,
    savedKey: options && options.savedKey ? String(options.savedKey) : "",
    runtime: true
  });
}

function dbEscapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[c]));
}

function deckBuilderFactionList() {
  if (typeof FACTIONS !== "undefined" && FACTIONS) return Object.keys(FACTIONS);
  const catalog = deckBuilderCatalog({ includeCustom: true });
  return [...new Set(catalog.map(card => card && card.faction).filter(Boolean))].sort();
}

function deckBuilderCommanderLabel(card) {
  if (!card) return "Comandante";
  if (typeof commanderOptionLabel === "function") return commanderOptionLabel(card);
  const archetype = card.commanderArchetype ? ` · ${card.commanderArchetype}` : "";
  return `${card.name}${archetype}`;
}

function deckBuilderRoleLabel(card) {
  if (!card) return "—";
  const role = card.deckRole || card.cardType || "—";
  const map = {
    commander: "Comandante",
    pivot: "Pivot",
    elite: "Elite",
    heavy: "Pesante",
    base: "Base",
    tactic: "Tattica",
    mission: "Missione",
    unit_structure: "Struttura",
    unit_infantry: "Fanteria",
    unit_vehicle: "Veicolo"
  };
  return map[role] || role;
}

function deckBuilderTypeLabel(card) {
  if (!card) return "—";
  if (card.sourceType === "mission") return card.missionClass === "desperate" ? "Missione · Disperata" : "Missione · Ordinaria";
  if (card.sourceType === "tactic") return `Tattica${card.category ? ` · ${card.category}` : ""}`;
  return [card.unitType, card.unitClassLabel || card.weight].filter(Boolean).join(" · ") || card.cardType || "Carta";
}

function deckBuilderCardSort(a, b) {
  if (typeof deckCardSort === "function") return deckCardSort(a, b);
  const fa = String(a && a.faction || "").localeCompare(String(b && b.faction || ""));
  if (fa) return fa;
  const ca = Number.isFinite(a && a.cost) ? a.cost : 99;
  const cb = Number.isFinite(b && b.cost) ? b.cost : 99;
  if (ca !== cb) return ca - cb;
  return String(a && a.name || "").localeCompare(String(b && b.name || ""));
}

function deckBuilderOfficialCatalog() {
  return typeof buildCardCatalog === "function" ? buildCardCatalog() : [];
}

function deckBuilderCanReadCustomCards() {
  return typeof cardEditorCatalogWithCustom === "function" && typeof cardEditorCustomCards === "function";
}

function deckBuilderIncludeCustomCards() {
  return Boolean(deckBuilderState.includeCustomCards && deckBuilderCanReadCustomCards());
}

function deckBuilderCatalogWithMode(includeCustom = null) {
  const official = deckBuilderOfficialCatalog();
  const useCustom = includeCustom === null ? deckBuilderIncludeCustomCards() : Boolean(includeCustom && deckBuilderCanReadCustomCards());
  return useCustom ? cardEditorCatalogWithCustom(official) : official;
}

function deckBuilderCardIsCustom(card) {
  return Boolean(card && (card.custom === true || card.official === false || String(card.id || "").startsWith("CUSTOM:")));
}

function deckBuilderCustomCardCount(cards) {
  return (cards || []).filter(deckBuilderCardIsCustom).length;
}

function deckBuilderSourceBadgeHtml(card) {
  return deckBuilderCardIsCustom(card) ? `<span class="deckBuilderCustomBadge">CUSTOM</span>` : `<span class="deckBuilderOfficialBadge">OFF</span>`;
}

function deckBuilderModeLabel(includeCustom = null) {
  const active = includeCustom === null ? deckBuilderIncludeCustomCards() : Boolean(includeCustom);
  return active ? "Custom Lab" : "Ufficiale";
}

function deckBuilderSavedPayloadHasCustom(payload, catalog = null) {
  if (payload && (payload.official === false || payload.containsCustomCards === true || payload.deckMode === "custom_lab")) return true;
  const sourceCatalog = catalog || deckBuilderCatalogWithMode(true);
  const ids = payload && Array.isArray(payload.deckIds) ? payload.deckIds : [];
  const byId = new Map(sourceCatalog.map(card => [card.id, card]));
  return ids.some(id => deckBuilderCardIsCustom(byId.get(id)));
}

function deckBuilderCatalog(options = {}) {
  if (typeof options === "boolean") return deckBuilderCatalogWithMode(options);
  if (options && Object.prototype.hasOwnProperty.call(options, "includeCustom")) return deckBuilderCatalogWithMode(Boolean(options.includeCustom));
  return deckBuilderCatalogWithMode(null);
}

function deckBuilderTargetSize() {
  const config = typeof CARD_CATALOG_CONFIG !== "undefined" ? CARD_CATALOG_CONFIG : {};
  return config.deckSize || 30;
}

function deckBuilderDefaultCommanderId(faction, catalog = null) {
  const sourceCatalog = catalog || deckBuilderCatalog();
  return typeof defaultCommanderBlueprintIdForFaction === "function" ? defaultCommanderBlueprintIdForFaction(faction, sourceCatalog) : "";
}

function deckBuilderResolvedFaction() {
  const factions = deckBuilderFactionList();
  if (!factions.includes(deckBuilderState.faction)) deckBuilderState.faction = factions[0] || "Nexus";
  return deckBuilderState.faction;
}

function deckBuilderResolvedCommanderId(faction = null, catalog = null) {
  const sourceCatalog = catalog || deckBuilderCatalog();
  const resolvedFaction = faction || deckBuilderResolvedFaction();
  const commanders = typeof commanderCardsForFaction === "function" ? commanderCardsForFaction(resolvedFaction, sourceCatalog) : [];
  const fallback = deckBuilderDefaultCommanderId(resolvedFaction, sourceCatalog) || (commanders[0] && commanders[0].blueprintId) || "";
  if (!deckBuilderState.commanderId || !commanders.some(card => card.blueprintId === deckBuilderState.commanderId)) deckBuilderState.commanderId = fallback;
  return deckBuilderState.commanderId || fallback;
}

function deckBuilderDraftKey(faction = null, commanderId = null, options = {}) {
  const includeCustom = options && Object.prototype.hasOwnProperty.call(options, "includeCustom")
    ? Boolean(options.includeCustom)
    : deckBuilderIncludeCustomCards();
  const sourceCatalog = deckBuilderCatalog({ includeCustom });
  const resolvedFaction = faction || deckBuilderResolvedFaction();
  const resolvedCommander = commanderId || deckBuilderResolvedCommanderId(resolvedFaction, sourceCatalog) || "default";
  return `${resolvedFaction}::${resolvedCommander}${includeCustom ? "::CUSTOM" : ""}`;
}

function deckBuilderPoolFor(faction, commanderId, catalog = null) {
  const sourceCatalog = catalog || deckBuilderCatalog();
  const options = { selectedCommanderId: commanderId };
  return typeof deckPoolCardsForFaction === "function" ? deckPoolCardsForFaction(faction, sourceCatalog, options).sort(deckBuilderCardSort) : [];
}

function deckBuilderPoolMapFor(faction, commanderId, catalog = null) {
  return new Map(deckBuilderPoolFor(faction, commanderId, catalog).map(card => [card.id, card]));
}

function deckBuilderTemplateIdsFor(faction, commanderId, catalog = null) {
  // F9K5: il template automatico resta ufficiale anche quando il pool custom è attivo.
  // Le carte CUSTOM entrano nel draft solo per scelta esplicita dal pool.
  const sourceCatalog = catalog && !deckBuilderIncludeCustomCards() ? catalog : deckBuilderOfficialCatalog();
  const options = { selectedCommanderId: commanderId };
  const deck = typeof buildDebugDeckForFaction === "function" ? buildDebugDeckForFaction(faction, sourceCatalog, null, options) : [];
  return deck.map(card => card && card.id).filter(Boolean);
}

function deckBuilderEnsureDraft(faction = null, commanderId = null) {
  const sourceCatalog = deckBuilderCatalog();
  const resolvedFaction = faction || deckBuilderResolvedFaction();
  const resolvedCommander = commanderId || deckBuilderResolvedCommanderId(resolvedFaction, sourceCatalog);
  const key = deckBuilderDraftKey(resolvedFaction, resolvedCommander);
  if (!Array.isArray(deckBuilderState.draftsByKey[key])) {
    deckBuilderState.draftsByKey[key] = deckBuilderTemplateIdsFor(resolvedFaction, resolvedCommander, sourceCatalog);
  }
  return deckBuilderState.draftsByKey[key];
}

function deckBuilderCurrentDraftIds() {
  return deckBuilderEnsureDraft();
}

function deckBuilderDraftCardsFromIds(ids, faction, commanderId, catalog = null) {
  const poolMap = deckBuilderPoolMapFor(faction, commanderId, catalog);
  const cards = [];
  const invalidIds = [];
  const seen = {};
  for (const id of ids || []) {
    const card = poolMap.get(id);
    if (!card) {
      invalidIds.push(id);
      continue;
    }
    const copyNo = (seen[id] || 0) + 1;
    seen[id] = copyNo;
    const withMeta = typeof withDeckCopyMeta === "function"
      ? withDeckCopyMeta(card, copyNo)
      : { ...card, deckCopyNo: copyNo };
    cards.push(withMeta);
  }
  return { cards, invalidIds };
}

function deckBuilderValidateDraft(deck, reportBase = {}) {
  const config = typeof CARD_CATALOG_CONFIG !== "undefined" ? CARD_CATALOG_CONFIG : {};
  const targetSize = deckBuilderTargetSize();
  const copyViolations = typeof deckCopyViolations === "function" ? deckCopyViolations(deck) : [];
  const roleCounts = typeof deckRoleCounts === "function" ? deckRoleCounts(deck) : {};
  const counts = typeof countCardCopies === "function" ? countCardCopies(deck) : {};
  const commanderCopies = deck.filter(card => card && (card.deckRole === "commander" || card.cardType === "commander")).length;
  const pivotCopies = deck.filter(card => card && (card.deckRole === "pivot" || card.cardType === "pivot")).length;
  const missionCopies = deck.filter(card => card && (card.deckRole === "mission" || card.cardType === "mission")).length;
  const debugOverflowCopies = deck.filter(card => card && card.debugOverflowCopy).length;
  const legalCapacity = typeof deckLegalCapacityForFaction === "function" ? deckLegalCapacityForFaction(reportBase.faction, reportBase.catalog, { selectedCommanderId: reportBase.commanderId }) : 0;
  const invalidIds = Array.isArray(reportBase.invalidIds) ? reportBase.invalidIds : [];
  const issues = [];

  if (deck.length !== targetSize) issues.push(`carte deck ${deck.length}/${targetSize}`);
  if (legalCapacity < targetSize) issues.push(`capacità legale ${legalCapacity}/${targetSize}`);
  if (invalidIds.length) issues.push(`id non validi nel draft: ${invalidIds.join(", ")}`);
  if (commanderCopies !== 1) issues.push(`copie comandante ${commanderCopies}, atteso 1`);
  if (pivotCopies > 1) issues.push(`copie pivot ${pivotCopies}, massimo 1`);
  if (missionCopies > 1) issues.push(`copie Missione ${missionCopies}, massimo 1`);
  if (debugOverflowCopies > 0) issues.push(`overflow debug presente: ${debugOverflowCopies}`);
  if (copyViolations.length) issues.push(`violazioni copie: ${copyViolations.map(v => `${v.name || v.id} ${v.count}/${v.limit}`).join(", ")}`);

  return {
    faction: reportBase.faction,
    targetSize,
    deckSize: deck.length,
    poolSize: reportBase.poolSize || 0,
    legalCapacity,
    canBuildLegalDeck: legalCapacity >= targetSize,
    debugOverflowCopies,
    uniqueCards: Object.keys(counts).length,
    commanderCopies,
    pivotCopies,
    missionCopies,
    roleCounts,
    copyViolations,
    invalidIds,
    ok: issues.length === 0,
    issues
  };
}

function deckBuilderReportObject() {
  const config = typeof CARD_CATALOG_CONFIG !== "undefined" ? CARD_CATALOG_CONFIG : {};
  const includeCustomCards = deckBuilderIncludeCustomCards();
  const catalog = deckBuilderCatalog({ includeCustom: includeCustomCards });
  const officialCatalog = deckBuilderOfficialCatalog();
  const totalCustomCards = includeCustomCards && typeof cardEditorCustomCards === "function" ? cardEditorCustomCards().length : 0;
  const faction = deckBuilderResolvedFaction();
  const commanderId = deckBuilderResolvedCommanderId(faction, catalog);
  const pool = deckBuilderPoolFor(faction, commanderId, catalog);
  const poolMap = new Map(pool.map(card => [card.id, card]));
  const draftIds = [...deckBuilderEnsureDraft(faction, commanderId)];
  const draftData = deckBuilderDraftCardsFromIds(draftIds, faction, commanderId, catalog);
  const deck = draftData.cards;
  const customCount = deckBuilderCustomCardCount(deck);
  const poolCustomCount = deckBuilderCustomCardCount(pool);
  const sanity = deckBuilderValidateDraft(deck, { faction, commanderId, catalog, poolSize: pool.length, invalidIds: draftData.invalidIds });
  const starterExcludedIds = typeof deckStarterExclusionIdsForFaction === "function" ? deckStarterExclusionIdsForFaction(faction, catalog) : new Set();
  const starters = typeof starterCardsForFaction === "function" ? starterCardsForFaction(faction, catalog).filter(card => starterExcludedIds.has(card.id)).sort(deckBuilderCardSort) : [];
  const counts = typeof countCardCopies === "function" ? countCardCopies(deck) : {};
  const commanders = typeof commanderCardsForFaction === "function" ? commanderCardsForFaction(faction, catalog) : [];
  const commander = commanders.find(card => card.blueprintId === commanderId) || commanders[0] || null;
  const templateIds = deckBuilderTemplateIdsFor(faction, commanderId, catalog);
  const draftKey = deckBuilderDraftKey(faction, commanderId);
  const deckName = deckBuilderCurrentDeckName({ faction, commanderId, commanderName: commander ? commander.name : "", containsCustomCards: customCount > 0 });
  const matchingSavedDecks = deckBuilderSavedPayloadEntriesFor(faction, commanderId, { includeCustom: customCount > 0 });

  return {
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    mode: includeCustomCards ? "F9K5 custom_match_test_lab" : "F9K5 official_deck_builder",
    includeCustomCards,
    containsCustomCards: customCount > 0,
    official: customCount === 0,
    customCount,
    poolCustomCount,
    totalCustomCards,
    officialCatalogSize: officialCatalog.length,
    faction,
    commanderId,
    commanderName: commander ? commander.name : "",
    deckName,
    draftKey,
    deckRules: {
      deckSize: config.deckSize || 30,
      starterExcluded: config.excludeStarterCardsFromDeck !== false,
      commanderPivotEliteMax: 1,
      missionMax: 1,
      defaultMaxCopies: config.deckCopyRules && Number.isFinite(config.deckCopyRules.defaultMaxCopies) ? config.deckCopyRules.defaultMaxCopies : 2
    },
    catalogSize: catalog.length,
    poolSize: pool.length,
    starterExcluded: starters.map(card => ({ id: card.id, name: card.name, role: card.starterRole, cost: card.cost })),
    sanity,
    deckIds: draftIds,
    templateIds,
    deck: deck.map(card => ({
      id: card.id,
      sourceId: card.sourceId || "",
      name: card.name,
      faction: card.faction,
      sourceType: card.sourceType,
      deckRole: card.deckRole,
      cardType: card.cardType,
      cost: card.cost,
      unitType: card.unitType || null,
      weight: card.weight || null,
      blueprintId: card.blueprintId || null,
      tacticId: card.tacticId || null,
      category: card.category || "",
      target: card.target || "",
      effectText: card.effectText || "",
      condition: card.condition || "",
      duration: card.duration || "",
      copyNo: card.deckCopyNo || null,
      copyLimit: typeof deckCopyLimitForCard === "function" ? deckCopyLimitForCard(card) : null,
      custom: deckBuilderCardIsCustom(card),
      official: !deckBuilderCardIsCustom(card)
    })),
    deckCopyCounts: counts,
    invalidDraftIds: draftData.invalidIds,
    editable: true,
    persistentSave: true,
    gameplayIntegration: "optional_setup_custom_deck",
    savedDeck: (() => {
      const preferredKey = deckBuilderState.selectedSavedKey && matchingSavedDecks.some(entry => entry.key === deckBuilderState.selectedSavedKey) ? deckBuilderState.selectedSavedKey : "";
      const payload = deckBuilderSavedPayloadFor(faction, commanderId, { includeCustom: customCount > 0, savedKey: preferredKey });
      const entry = preferredKey ? matchingSavedDecks.find(item => item.key === preferredKey) : matchingSavedDecks[0];
      return payload ? { key: entry ? entry.key : (preferredKey || draftKey), deckName: deckBuilderNormalizeDeckName(payload.deckName || payload.name || ""), savedAt: payload.savedAt || "", deckSize: Array.isArray(payload.deckIds) ? payload.deckIds.length : 0 } : null;
    })(),
    savedDeckCount: matchingSavedDecks.length,
    pool: pool.map(card => ({
      id: card.id,
      name: card.name,
      role: card.deckRole || card.cardType || "",
      sourceType: card.sourceType || "",
      cost: card.cost,
      copyLimit: typeof deckCopyLimitForCard === "function" ? deckCopyLimitForCard(card) : null,
      currentCopies: counts[card.id] || 0,
      inPool: poolMap.has(card.id),
      custom: deckBuilderCardIsCustom(card),
      official: !deckBuilderCardIsCustom(card)
    }))
  };
}

function deckBuilderSummaryHtml(report) {
  const sanity = report.sanity || {};
  const ok = Boolean(sanity.ok);
  const statusClass = ok ? "good" : "bad";
  const statusText = ok ? "Deck draft valido" : "Deck draft non valido";
  const roleCounts = sanity.roleCounts || {};
  const violations = Array.isArray(sanity.copyViolations) ? sanity.copyViolations : [];
  const issues = Array.isArray(sanity.issues) ? sanity.issues : [];
  const customWarning = report.containsCustomCards
    ? `<div class="deckBuilderIssueBox warn"><strong>NON UFFICIALE:</strong> questo draft contiene ${report.customCount} carta/e CUSTOM. In F9K5b può essere usato solo dal Setup selezionando un deck personalizzato salvato: è Custom Match Test Lab, non bilanciamento ufficiale.</div>`
    : "";
  return `
    <div class="deckBuilderStatus ${statusClass} ${report.containsCustomCards ? "custom" : ""}">
      <strong>${dbEscapeHtml(statusText)} · ${report.containsCustomCards ? "NON UFFICIALE" : "UFFICIALE"}</strong>
      <span>${dbEscapeHtml(report.deckName || deckBuilderDefaultDeckName(report))} · ${dbEscapeHtml(report.faction)} · ${dbEscapeHtml(report.commanderName || report.commanderId || "Comandante")} · ${dbEscapeHtml(deckBuilderModeLabel(report.includeCustomCards))}</span>
    </div>
    <div class="deckBuilderStatGrid">
      <div class="statTile"><strong>${sanity.deckSize || 0}</strong><span>carte draft</span></div>
      <div class="statTile"><strong>${report.deckRules.deckSize}</strong><span>target</span></div>
      <div class="statTile"><strong>${sanity.poolSize || report.poolSize}</strong><span>pool legale</span></div>
      <div class="statTile"><strong>${sanity.legalCapacity || 0}</strong><span>capacità legale</span></div>
      <div class="statTile"><strong>${sanity.uniqueCards || Object.keys(report.deckCopyCounts || {}).length}</strong><span>carte uniche</span></div>
      <div class="statTile"><strong>${violations.length}</strong><span>violazioni copie</span></div>
      <div class="statTile"><strong>${report.customCount || 0}</strong><span>custom nel draft</span></div>
      <div class="statTile"><strong>${report.poolCustomCount || 0}</strong><span>custom nel pool</span></div>
    </div>
    <div class="deckBuilderRuleBox">
      <strong>F9K5b:</strong>
      le carte CUSTOM entrano nel Deck Builder solo con toggle esplicito. I draft che le contengono sono marcati NON UFFICIALI e salvati su chiave separata; non sostituiscono il deck ufficiale del SetupScreen.
      <br /><strong>Regole freeze:</strong> deck ${report.deckRules.deckSize}; senza Missione 30 carte ordinarie, con Missione 29 + 1; Missione facoltativa e massimo 1; comandante/pivot/elite max 1; altre carte/tattiche max ${report.deckRules.defaultMaxCopies}; starter esclusi dal deck.
      <br />Ruoli nel draft: comandante ${roleCounts.commander || 0}, base ${roleCounts.base || 0}, pesanti ${roleCounts.heavy || 0}, elite ${roleCounts.elite || 0}, pivot ${roleCounts.pivot || 0}, tattiche ${roleCounts.tactic || 0}, Missioni ${roleCounts.mission || 0}.
    </div>
    ${customWarning}
    ${issues.length ? `<div class="deckBuilderIssueBox"><strong>Da correggere:</strong> ${issues.map(dbEscapeHtml).join("; ")}</div>` : ""}
    ${violations.length ? `<div class="deckBuilderIssueBox"><strong>Violazioni copie:</strong> ${violations.map(v => `${dbEscapeHtml(v.name || v.id)} ${v.count}/${v.limit}`).join("; ")}</div>` : ""}`;
}

function deckBuilderCanAddCard(card, report) {
  if (!card || !report) return { ok: false, reason: "carta assente" };
  const target = report.deckRules.deckSize || deckBuilderTargetSize();
  const count = (report.deckCopyCounts || {})[card.id] || 0;
  const limit = typeof deckCopyLimitForCard === "function" ? deckCopyLimitForCard(card) : 0;
  if ((report.deckIds || []).length >= target) return { ok: false, reason: "deck pieno" };
  if ((card.deckRole === "mission" || card.cardType === "mission") && report.sanity && report.sanity.missionCopies >= 1) return { ok: false, reason: "Missione già presente" };
  if (count >= limit) return { ok: false, reason: "limite copie" };
  return { ok: true, reason: "aggiungi" };
}



function deckBuilderSelectedPreviewCardId() {
  return deckBuilderState.selectedPreviewCardId || (typeof cardRendererCurrentCardId === "function" ? cardRendererCurrentCardId() : "");
}

function deckBuilderSetPreviewCard(cardId, source = "") {
  deckBuilderState.selectedPreviewCardId = String(cardId || "");
  if (typeof cardRendererSelectCard === "function") cardRendererSelectCard(deckBuilderState.selectedPreviewCardId, source);
  return deckBuilderState.selectedPreviewCardId;
}

function deckBuilderEnsurePreviewCard(report, pool = null) {
  const candidateId = deckBuilderSelectedPreviewCardId();
  const poolList = Array.isArray(pool) ? pool : deckBuilderPoolFor(report.faction, report.commanderId, deckBuilderCatalog());
  const candidates = [...(report.deck || []), ...poolList].filter(Boolean);
  const match = candidateId ? candidates.find(card => card.id === candidateId) : null;
  if (match) return match.id;
  const fallback = candidates[0] ? candidates[0].id : "";
  if (fallback) deckBuilderSetPreviewCard(fallback, "auto");
  return fallback;
}

function deckBuilderPoolRowsHtml(pool, report) {
  const deckCounts = report.deckCopyCounts || {};
  if (!pool.length) return `<tr><td colspan="8">Nessuna carta nel pool.</td></tr>`;
  return pool.map(card => {
    const limit = typeof deckCopyLimitForCard === "function" ? deckCopyLimitForCard(card) : "—";
    const copies = deckCounts[card.id] || 0;
    const cls = copies > 0 ? "deckBuilderInTemplate" : "";
    const addState = deckBuilderCanAddCard(card, report);
    const selected = deckBuilderSelectedPreviewCardId() === card.id ? "deckBuilderPreviewSelectedRow" : "";
    return `<tr class="${cls} ${selected}" data-db-preview-card="${dbEscapeHtml(card.id)}" data-db-preview-source="pool">
      <td><button class="miniBtn deckBuilderAddBtn" type="button" data-db-add-card="${dbEscapeHtml(card.id)}" ${addState.ok ? "" : "disabled"}>+</button></td>
      <td>${dbEscapeHtml(card.id)}</td>
      <td class="deckBuilderNameCell"><strong class="deckBuilderCardNameText">${dbEscapeHtml(card.name)}</strong> ${deckBuilderSourceBadgeHtml(card)}</td>
      <td>${dbEscapeHtml(deckBuilderRoleLabel(card))}</td>
      <td>${dbEscapeHtml(deckBuilderTypeLabel(card))}</td>
      <td>${Number.isFinite(card.cost) ? card.cost : "—"}</td>
      <td>${copies}/${limit}</td>
      <td>${dbEscapeHtml(addState.ok ? (card.effectText || card.ability && card.ability.description || card.target || "") : addState.reason)}</td>
    </tr>`;
  }).join("");
}

function deckBuilderDeckRowsHtml(deck, report) {
  if (!deck.length) return `<tr><td colspan="7">Deck draft vuoto. Aggiungi carte dal pool legale.</td></tr>`;
  const byId = new Map();
  for (const card of deck) {
    const row = byId.get(card.id) || { card, count: 0 };
    row.count += 1;
    byId.set(card.id, row);
  }
  return [...byId.values()].sort((a, b) => deckBuilderCardSort(a.card, b.card)).map(row => {
    const card = row.card;
    const limit = typeof deckCopyLimitForCard === "function" ? deckCopyLimitForCard(card) : "—";
    const violation = Number.isFinite(limit) && row.count > limit;
    const selected = deckBuilderSelectedPreviewCardId() === card.id ? "deckBuilderPreviewSelectedRow" : "";
    return `<tr class="${violation ? "deckBuilderViolationRow" : ""} ${selected}" data-db-preview-card="${dbEscapeHtml(card.id)}" data-db-preview-source="deck">
      <td><button class="miniBtn deckBuilderRemoveBtn" type="button" data-db-remove-card="${dbEscapeHtml(card.id)}">−</button></td>
      <td>${dbEscapeHtml(card.id)}</td>
      <td class="deckBuilderNameCell"><strong class="deckBuilderCardNameText">${dbEscapeHtml(card.name)}</strong> ${deckBuilderSourceBadgeHtml(card)}</td>
      <td>${dbEscapeHtml(deckBuilderRoleLabel(card))}</td>
      <td>${Number.isFinite(card.cost) ? card.cost : "—"}</td>
      <td>${row.count}/${limit}</td>
      <td>${dbEscapeHtml(deckBuilderTypeLabel(card))}</td>
    </tr>`;
  }).join("");
}

function deckBuilderStartersHtml(report) {
  const list = report.starterExcluded || [];
  if (!list.length) return `<div class="help">Nessuno starter escluso rilevato per questa fazione.</div>`;
  return `<div class="deckBuilderStarterList">${list.map(card => `
    <div class="unitCard deckBuilderStarterCard">
      <h4>${dbEscapeHtml(card.name)} <span>${dbEscapeHtml(card.role || "starter")}</span></h4>
      <div class="meta">${dbEscapeHtml(card.id)} · costo ${Number.isFinite(card.cost) ? card.cost : "—"} · esclusa dal deck</div>
    </div>`).join("")}</div>`;
}

function deckBuilderSavedDeckEntries(catalog = null) {
  const sourceCatalog = catalog || deckBuilderCatalog();
  const store = deckBuilderReadSavedStore();
  const entries = [];
  Object.entries(store || {}).forEach(([key, payload]) => {
    const faction = payload && payload.faction ? payload.faction : String(key).split("::")[0] || "";
    const commanderId = payload && payload.commanderId ? payload.commanderId : String(key).split("::")[1] || "";
    const payloadHasCustom = deckBuilderSavedPayloadHasCustom(payload, deckBuilderCatalog({ includeCustom: true }));
    const validationCatalog = payloadHasCustom ? deckBuilderCatalog({ includeCustom: true }) : sourceCatalog;
    const check = deckBuilderValidateSavedDeckPayload(payload, faction, commanderId, validationCatalog, { allowCustom: payloadHasCustom, savedKey: key });
    const commanderCard = sourceCatalog.find(card => card && (card.blueprintId === commanderId || card.id === commanderId));
    const deckIds = payload && Array.isArray(payload.deckIds) ? payload.deckIds : [];
    entries.push({
      key,
      payload,
      faction,
      commanderId,
      commanderName: (payload && payload.commanderName) || (commanderCard && commanderCard.name) || commanderId || "Comandante",
      deckName: deckBuilderNormalizeDeckName((payload && (payload.deckName || payload.name)) || "") || deckBuilderDefaultDeckName({ faction, commanderId, commanderName: (payload && payload.commanderName) || (commanderCard && commanderCard.name) || commanderId, containsCustomCards: payloadHasCustom }),
      savedAt: (payload && (payload.savedAt || payload.importedAt || payload.updatedAt)) || "",
      savedKind: deckBuilderIsBuiltinKey(key, payload) ? "integrato" : (payload && payload.importedAt ? "importato" : "salvato"),
      builtIn:deckBuilderIsBuiltinKey(key, payload),
      deckSize: deckIds.length,
      runtimeCardTotal:check.runtimeCardTotal || deckIds.length,
      supplementalMissionId:check.supplementalMissionId || null,
      containsCustomCards: Boolean(check.containsCustomCards || payloadHasCustom),
      customCount: check && Array.isArray(check.cards) ? deckBuilderCustomCardCount(check.cards) : 0,
      official: !(check.containsCustomCards || payloadHasCustom),
      ok: Boolean(check.ok),
      issues: Array.isArray(check.issues) ? check.issues : [],
      check
    });
  });
  return entries.sort((a, b) => {
    const builtinCmp = Number(Boolean(b.builtIn)) - Number(Boolean(a.builtIn));
    if (builtinCmp) return builtinCmp;
    const factionCmp = String(a.faction || "").localeCompare(String(b.faction || ""));
    if (factionCmp) return factionCmp;
    const nameCmp = String(a.deckName || "").localeCompare(String(b.deckName || ""));
    if (nameCmp) return nameCmp;
    return String(b.savedAt || "").localeCompare(String(a.savedAt || ""));
  });
}

function deckBuilderSavedGalleryHtml(entries, currentKey = "") {
  if (!entries.length) {
    return `<div class="deckBuilderEmptyGallery">Nessun deck salvato/importato. Salva un draft valido oppure importa un file JSON esportato da Arena Rubra.</div>`;
  }
  return `<div class="deckBuilderSavedGalleryList">${entries.map(entry => {
    const statusClass = entry.ok ? "good" : "bad";
    const statusText = entry.ok ? "valido" : "non valido";
    const selected = entry.key === currentKey ? " selected" : "";
    const custom = Boolean(entry.containsCustomCards);
    const issueText = entry.ok
      ? (custom ? "Deck NON UFFICIALE: pronto per laboratorio custom, non per Setup standard." : "Pronto per il SetupScreen.")
      : (entry.issues || []).join("; ") || "Deck non valido.";
    return `<article class="deckBuilderSavedDeckCard${selected}${custom ? " custom" : ""}">
      <div class="deckBuilderSavedDeckTop">
        <div>
          <strong>${dbEscapeHtml(entry.deckName || "Deck senza nome")}</strong>
          <span>${dbEscapeHtml(entry.faction || "—")} · ${dbEscapeHtml(entry.commanderName || entry.commanderId || "Comandante")} · ${dbEscapeHtml(entry.key)}</span>
        </div>
        <span class="deckBuilderSavedState ${statusClass}">${custom ? "NON UFFICIALE" : dbEscapeHtml(statusText)}</span>
      </div>
      <div class="deckBuilderSavedDeckMeta">
        <span>${entry.supplementalMissionId ? `${entry.deckSize}/30 + Missione` : `${entry.deckSize}/30 carte`}</span>
        <span>${custom ? "custom lab" : dbEscapeHtml(entry.savedKind || "salvato")}</span>
        ${custom ? `<span>${entry.customCount || 0} CUSTOM</span>` : ""}
        <span>${dbEscapeHtml(entry.savedAt || "data non disponibile")}</span>
      </div>
      <div class="deckBuilderSavedDeckNote">${dbEscapeHtml(issueText)}</div>
      <div class="deckBuilderSavedDeckActions">
        <button class="ghost" type="button" data-db-load-saved-key="${dbEscapeHtml(entry.key)}" ${entry.ok ? "" : "disabled"}>Carica nel draft</button>
        <button class="ghost" type="button" data-db-copy-saved-key="${dbEscapeHtml(entry.key)}">Copia JSON</button>
        <button class="danger" type="button" data-db-delete-saved-key="${dbEscapeHtml(entry.key)}" ${entry.builtIn ? "disabled" : ""}>${entry.builtIn ? "Integrato" : "Elimina"}</button>
      </div>
    </article>`;
  }).join("")}</div>`;
}

function populateDeckBuilderFactionSelect() {
  const select = document.getElementById("deckBuilderFactionSelect");
  if (!select) return;
  const factions = deckBuilderFactionList();
  if (!factions.includes(deckBuilderState.faction)) deckBuilderState.faction = factions[0] || "Nexus";
  select.innerHTML = factions.map(faction => `<option value="${dbEscapeHtml(faction)}">${dbEscapeHtml(faction)}</option>`).join("");
  select.value = deckBuilderState.faction;
}

function populateDeckBuilderCommanderSelect() {
  const select = document.getElementById("deckBuilderCommanderSelect");
  if (!select || typeof commanderCardsForFaction !== "function") return;
  const catalog = deckBuilderCatalog();
  const faction = deckBuilderResolvedFaction();
  const commanders = commanderCardsForFaction(faction, catalog);
  const fallback = deckBuilderDefaultCommanderId(faction, catalog) || (commanders[0] && commanders[0].blueprintId);
  if (!deckBuilderState.commanderId || !commanders.some(card => card.blueprintId === deckBuilderState.commanderId)) deckBuilderState.commanderId = fallback || "";
  select.innerHTML = commanders.map(card => `<option value="${dbEscapeHtml(card.blueprintId)}">${dbEscapeHtml(deckBuilderCommanderLabel(card))}</option>`).join("");
  select.value = deckBuilderState.commanderId;
}

function renderDeckBuilderScreen() {
  if (typeof document === "undefined") return;
  const summary = document.getElementById("deckBuilderSummary");
  const poolBody = document.getElementById("deckBuilderPoolBody");
  const deckBody = document.getElementById("deckBuilderDeckBody");
  const starterBox = document.getElementById("deckBuilderStarterBox");
  const savedGallery = document.getElementById("deckBuilderSavedGallery");
  const meta = document.getElementById("deckBuilderMetaLine");
  if (!summary || !poolBody || !deckBody || !starterBox) return;

  populateDeckBuilderFactionSelect();
  populateDeckBuilderCommanderSelect();
  const customToggle = document.getElementById("deckBuilderIncludeCustomToggle");
  if (customToggle) {
    customToggle.checked = deckBuilderIncludeCustomCards();
    customToggle.disabled = !deckBuilderCanReadCustomCards();
    customToggle.title = deckBuilderCanReadCustomCards() ? "Mostra anche le carte custom salvate nel Card Editor." : "Card Editor custom non disponibile.";
  }
  const report = deckBuilderReportObject();
  const nameInput = document.getElementById("deckBuilderDeckNameInput");
  if (nameInput && document.activeElement !== nameInput && !deckBuilderNormalizeDeckName(nameInput.value)) nameInput.value = report.deckName || deckBuilderDefaultDeckName(report);
  const pool = deckBuilderPoolFor(report.faction, report.commanderId, deckBuilderCatalog());
  deckBuilderEnsurePreviewCard(report, pool);

  summary.innerHTML = deckBuilderSummaryHtml(report);
  poolBody.innerHTML = deckBuilderPoolRowsHtml(pool, report);
  deckBody.innerHTML = deckBuilderDeckRowsHtml(report.deck || [], report);
  starterBox.innerHTML = deckBuilderStartersHtml(report);
  if (savedGallery) {
    savedGallery.innerHTML = deckBuilderSavedGalleryHtml(deckBuilderSavedDeckEntries(deckBuilderCatalog()), deckBuilderState.selectedSavedKey || report.draftKey);
  }
  if (typeof renderDeckBuilderCardPreview === "function") renderDeckBuilderCardPreview(report);
  if (meta) {
    const status = report.sanity && report.sanity.ok ? "draft valido" : "draft da correggere";
    const saved = report.savedDeck ? ` · salvato: ${report.savedDeck.deckName || "deck"} · ${report.savedDeck.savedAt || "local"}` : ` · salvati per slot: ${report.savedDeckCount || 0}`;
    meta.textContent = `${report.build.version || "build"} · ${report.mode} · ${status} · ${report.deckIds.length}/${report.deckRules.deckSize} carte · ${report.deckName || deckBuilderDefaultDeckName(report)}${saved}`;
  }
  deckBuilderSetFeedback(deckBuilderState.feedback || "", deckBuilderState.feedback ? (report.sanity && report.sanity.ok ? "good" : "") : "");
}

function openDeckBuilderScreen() {
  if (typeof syncSetupScreenFromLegacyControls === "function") {
    try {
      deckBuilderState.faction = (typeof readControlValue === "function") ? readControlValue("setupP1Faction", deckBuilderState.faction) : deckBuilderState.faction;
      deckBuilderState.commanderId = "";
    } catch (_) {}
  }
  renderDeckBuilderScreen();
  if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.DECK_BUILDER);
}

function deckBuilderAddCard(cardId) {
  const report = deckBuilderReportObject();
  const poolMap = deckBuilderPoolMapFor(report.faction, report.commanderId, deckBuilderCatalog());
  const card = poolMap.get(cardId);
  const canAdd = deckBuilderCanAddCard(card, report);
  if (!canAdd.ok) return false;
  const draft = deckBuilderEnsureDraft(report.faction, report.commanderId);
  draft.push(cardId);
  deckBuilderSetFeedback("");
  renderDeckBuilderScreen();
  return true;
}

function deckBuilderRemoveCard(cardId) {
  const report = deckBuilderReportObject();
  const draft = deckBuilderEnsureDraft(report.faction, report.commanderId);
  const index = draft.lastIndexOf(cardId);
  if (index < 0) return false;
  draft.splice(index, 1);
  deckBuilderSetFeedback("");
  renderDeckBuilderScreen();
  return true;
}

function resetDeckBuilderDraftToTemplate() {
  const catalog = deckBuilderCatalog();
  const faction = deckBuilderResolvedFaction();
  const commanderId = deckBuilderResolvedCommanderId(faction, catalog);
  deckBuilderState.draftsByKey[deckBuilderDraftKey(faction, commanderId)] = deckBuilderTemplateIdsFor(faction, commanderId, catalog);
  deckBuilderSetFeedback("Template automatico ripristinato.", "good");
  renderDeckBuilderScreen();
}

function clearDeckBuilderDraft() {
  const faction = deckBuilderResolvedFaction();
  const commanderId = deckBuilderResolvedCommanderId(faction, deckBuilderCatalog());
  deckBuilderState.draftsByKey[deckBuilderDraftKey(faction, commanderId)] = [];
  deckBuilderSetFeedback("Draft svuotato: deck non valido finché non torna a 30 carte.", "bad");
  renderDeckBuilderScreen();
}

function deckBuilderReportJson() {
  return JSON.stringify(deckBuilderReportObject(), null, 2);
}

function deckBuilderDeckJson() {
  const report = deckBuilderReportObject();
  return JSON.stringify({
    build: report.build,
    mode: report.mode,
    faction: report.faction,
    deckName: report.deckName,
    commanderId: report.commanderId,
    commanderName: report.commanderName,
    deckRules: report.deckRules,
    official: report.official,
    containsCustomCards: report.containsCustomCards,
    customCount: report.customCount,
    setupRuntimeEligible: true,
    sanity: report.sanity,
    deckIds: report.deckIds,
    deck: report.deck,
    warning: report.containsCustomCards
      ? "F9K5b export: deck NON UFFICIALE con carte CUSTOM. Usabile nel Custom Match Test Lab selezionando Deck personalizzato salvato nel Setup."
      : "F9K5b export: deck ufficiale compatibile con Setup standard se valido."
  }, null, 2);
}

function copyDeckBuilderText(text, label) {
  if (typeof f9fCopyText === "function") return f9fCopyText(text, label);
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") return navigator.clipboard.writeText(text).then(() => text);
  if (typeof prompt === "function") prompt("Copia manualmente:", text);
  return text;
}

function copyDeckBuilderReportJson() {
  return copyDeckBuilderText(deckBuilderReportJson(), "Report deck builder JSON copiato negli appunti.");
}

function copyDeckBuilderDeckJson() {
  return copyDeckBuilderText(deckBuilderDeckJson(), "Deck draft JSON copiato negli appunti.");
}

function deckBuilderExportFilename(prefix = "arena_rubra_custom_decks") {
  const stamp = typeof arenaStorageTimestampForFilename === "function" ? arenaStorageTimestampForFilename() : deckBuilderNowIso().replace(/[^0-9T]/g, "").slice(0, 15);
  return `${prefix}_${stamp}.json`;
}

function deckBuilderDownloadJson(text, filename, label) {
  if (typeof arenaStorageDownloadText === "function") {
    const result = arenaStorageDownloadText(text, filename, "application/json");
    deckBuilderSetFeedback(label || `File JSON preparato: ${filename}`, "good");
    return result;
  }
  deckBuilderSetFeedback(`Download non disponibile: JSON copiato negli appunti (${filename}).`, "good");
  return copyDeckBuilderText(text, `JSON copiato negli appunti: ${filename}`);
}

function exportAllDeckBuilderSavedDecksJson() {
  const text = typeof arenaStorageExportCustomDecksJson === "function"
    ? arenaStorageExportCustomDecksJson()
    : JSON.stringify({ schemaVersion:"legacy", decks:deckBuilderReadSavedStore() }, null, 2);
  const filename = deckBuilderExportFilename("arena_rubra_custom_decks");
  return deckBuilderDownloadJson(text, filename, `Export deck pronto: scaricato ${filename}.`);
}

function copyAllDeckBuilderSavedDecksJson() {
  const text = typeof arenaStorageExportCustomDecksJson === "function"
    ? arenaStorageExportCustomDecksJson()
    : JSON.stringify({ schemaVersion:"legacy", decks:deckBuilderReadSavedStore() }, null, 2);
  deckBuilderSetFeedback("Deck salvati copiati negli appunti in formato JSON.", "good");
  return copyDeckBuilderText(text, "Deck salvati copiati negli appunti in formato JSON.");
}

function deckBuilderImportSavedDecksFromText(text, sourceLabel = "testo incollato") {
  if (!String(text || "").trim()) {
    deckBuilderSetFeedback(`Import deck annullato: ${sourceLabel} vuoto.`, "bad");
    return false;
  }
  const result = typeof arenaStorageImportCustomDecksFromText === "function"
    ? arenaStorageImportCustomDecksFromText(text)
    : { ok:false, imported:0, issues:["storage layer non disponibile"] };
  const suffix = result.issues && result.issues.length ? ` · ${result.issues.join("; ")}` : "";
  deckBuilderSetFeedback(result.ok ? `Import da ${sourceLabel} completato: ${result.imported} deck importati.${suffix}` : `Import da ${sourceLabel} fallito: ${suffix || "nessun deck importato"}`, result.ok ? "good" : "bad");
  if (typeof refreshSetupDeckSelectors === "function") refreshSetupDeckSelectors();
  renderDeckBuilderScreen();
  return result.ok;
}

function openDeckBuilderImportFilePicker() {
  const input = typeof document !== "undefined" ? document.getElementById("deckBuilderImportDecksFile") : null;
  if (!input) {
    deckBuilderSetFeedback("Import da file non disponibile: input file assente.", "bad");
    return false;
  }
  input.click();
  return true;
}

function importDeckBuilderSavedDecksFile(file) {
  if (!file) {
    deckBuilderSetFeedback("Import deck annullato: nessun file selezionato.");
    return false;
  }
  if (typeof FileReader === "undefined") {
    deckBuilderSetFeedback("Import da file non disponibile in questo ambiente. Usa 'Incolla JSON'.", "bad");
    return false;
  }
  const reader = new FileReader();
  reader.onload = () => deckBuilderImportSavedDecksFromText(reader.result || "", file.name || "file JSON");
  reader.onerror = () => deckBuilderSetFeedback(`Import fallito: impossibile leggere ${file.name || "file"}.`, "bad");
  reader.readAsText(file, "utf-8");
  return true;
}

function toggleDeckBuilderImportTextBox(force = null) {
  const box = typeof document !== "undefined" ? document.getElementById("deckBuilderImportTextBox") : null;
  const textarea = typeof document !== "undefined" ? document.getElementById("deckBuilderImportTextArea") : null;
  if (!box) return false;
  const shouldOpen = force == null ? box.hidden : Boolean(force);
  box.hidden = !shouldOpen;
  if (shouldOpen && textarea) {
    textarea.focus();
    deckBuilderSetFeedback("Incolla nella casella il contenuto integrale del file JSON esportato, poi premi Importa testo JSON.");
  }
  return shouldOpen;
}

function importDeckBuilderSavedDecksFromTextArea() {
  const textarea = typeof document !== "undefined" ? document.getElementById("deckBuilderImportTextArea") : null;
  const ok = deckBuilderImportSavedDecksFromText(textarea ? textarea.value : "", "testo incollato");
  if (ok) {
    if (textarea) textarea.value = "";
    toggleDeckBuilderImportTextBox(false);
  }
  return ok;
}

function copyDeckBuilderAssetManifestJson() {
  if (typeof copyCardAssetManifestJson === "function") return copyCardAssetManifestJson();
  return copyDeckBuilderText(JSON.stringify({ error:"card asset manifest non disponibile" }, null, 2), "Manifest asset non disponibile.");
}

function saveCurrentDeckBuilderDraft() {
  const report = deckBuilderReportObject();
  if (!report.sanity || !report.sanity.ok) {
    deckBuilderSetFeedback(`Deck non salvato: ${((report.sanity && report.sanity.issues) || ["draft non valido"]).join("; ")}`, "bad");
    renderDeckBuilderScreen();
    return false;
  }
  const deckName = deckBuilderCurrentDeckName(report);
  const saveKey = deckBuilderStorageKeyForReport(report, deckName);
  const store = deckBuilderReadSavedStore();
  const payload = {
    schemaVersion: 3,
    savedAt: deckBuilderNowIso(),
    build: report.build,
    key: saveKey,
    baseKey: report.draftKey,
    deckName,
    name: deckName,
    faction: report.faction,
    commanderId: report.commanderId,
    commanderName: report.commanderName,
    deckRules: report.deckRules,
    deckMode: report.containsCustomCards ? "custom_lab" : "official",
    runtimeMode: report.containsCustomCards ? "custom_lab" : "official",
    official: !report.containsCustomCards,
    containsCustomCards: report.containsCustomCards,
    customCount: report.customCount || 0,
    setupRuntimeEligible: true,
    note: report.containsCustomCards ? "Deck non ufficiale F9K5b: usabile nel Custom Match Test Lab dal Setup." : "Deck ufficiale compatibile Setup standard.",
    deckIds: [...report.deckIds]
  };
  store[saveKey] = payload;
  const ok = deckBuilderWriteSavedStore(store);
  if (ok) {
    deckBuilderState.selectedSavedKey = saveKey;
    deckBuilderState.deckName = deckName;
  }
  deckBuilderSetFeedback(ok ? `Deck “${deckName}” ${report.containsCustomCards ? "NON UFFICIALE custom" : "ufficiale"} salvato localmente per ${report.faction} · ${report.commanderName || report.commanderId}.` : "Salvataggio fallito: localStorage non disponibile.", ok ? "good" : "bad");
  if (typeof refreshSetupDeckSelectors === "function") refreshSetupDeckSelectors();
  renderDeckBuilderScreen();
  return ok;
}

function loadSavedDeckBuilderDraft() {
  const report = deckBuilderReportObject();
  const entries = deckBuilderSavedPayloadEntriesFor(report.faction, report.commanderId, { includeCustom: report.includeCustomCards });
  const preferred = deckBuilderState.selectedSavedKey && entries.find(entry => entry.key === deckBuilderState.selectedSavedKey)
    ? entries.find(entry => entry.key === deckBuilderState.selectedSavedKey)
    : entries[0];
  const payload = preferred ? preferred.payload : null;
  if (!payload) {
    deckBuilderSetFeedback(`Nessun deck ${report.includeCustomCards ? "custom" : "ufficiale"} salvato da caricare per questa fazione/comandante.`, "bad");
    renderDeckBuilderScreen();
    return false;
  }
  const check = deckBuilderValidateSavedDeckPayload(payload, report.faction, report.commanderId, deckBuilderCatalog({ includeCustom: report.includeCustomCards }), { allowCustom: report.includeCustomCards, savedKey: preferred.key });
  if (!check.ok) {
    deckBuilderSetFeedback(`Nessun deck salvato valido da caricare: ${check.issues.join("; ")}`, "bad");
    renderDeckBuilderScreen();
    return false;
  }
  deckBuilderState.draftsByKey[report.draftKey] = [...check.deckIds];
  deckBuilderState.selectedSavedKey = preferred.key;
  deckBuilderState.deckName = check.deckName || payload.deckName || payload.name || "";
  const nameInput = typeof document !== "undefined" ? document.getElementById("deckBuilderDeckNameInput") : null;
  if (nameInput) nameInput.value = deckBuilderState.deckName || deckBuilderDefaultDeckName(report);
  deckBuilderSetFeedback(`Deck salvato caricato nel draft: “${deckBuilderState.deckName || "deck"}” (${check.deckIds.length} carte${report.includeCustomCards ? ", custom lab" : ""}).`, "good");
  renderDeckBuilderScreen();
  return true;
}

function deleteSavedDeckBuilderDraft() {
  const report = deckBuilderReportObject();
  const entries = deckBuilderSavedPayloadEntriesFor(report.faction, report.commanderId, { includeCustom: report.includeCustomCards });
  const target = deckBuilderState.selectedSavedKey && entries.find(entry => entry.key === deckBuilderState.selectedSavedKey)
    ? entries.find(entry => entry.key === deckBuilderState.selectedSavedKey)
    : entries[0];
  const store = deckBuilderReadSavedStore();
  if (!target || !store[target.key]) {
    deckBuilderSetFeedback("Nessun deck salvato da eliminare per questa fazione/comandante.", "bad");
    renderDeckBuilderScreen();
    return false;
  }
  if (deckBuilderIsBuiltinKey(target.key, store[target.key])) {
    deckBuilderSetFeedback("I deck integrati non possono essere eliminati.", "bad");
    renderDeckBuilderScreen();
    return false;
  }
  delete store[target.key];
  const ok = deckBuilderWriteSavedStore(store);
  if (deckBuilderState.selectedSavedKey === target.key) deckBuilderState.selectedSavedKey = "";
  deckBuilderSetFeedback(ok ? `Deck salvato eliminato: ${target.deckName || target.key}.` : "Eliminazione fallita.", ok ? "good" : "bad");
  if (typeof refreshSetupDeckSelectors === "function") refreshSetupDeckSelectors();
  renderDeckBuilderScreen();
  return ok;
}

function loadSavedDeckBuilderDraftByKey(savedKey) {
  const key = String(savedKey || "");
  const store = deckBuilderReadSavedStore();
  const payload = store[key];
  if (!payload) {
    deckBuilderSetFeedback(`Deck salvato non trovato: ${key || "chiave assente"}.`, "bad");
    renderDeckBuilderScreen();
    return false;
  }
  const payloadHasCustom = deckBuilderSavedPayloadHasCustom(payload, deckBuilderCatalog({ includeCustom: true }));
  deckBuilderState.includeCustomCards = payloadHasCustom;
  const faction = payload.faction || key.split("::")[0] || deckBuilderResolvedFaction();
  const commanderId = payload.commanderId || key.split("::")[1] || deckBuilderDefaultCommanderId(faction, deckBuilderCatalog({ includeCustom: payloadHasCustom }));
  const validationCatalog = deckBuilderCatalog({ includeCustom: payloadHasCustom });
  const check = deckBuilderValidateSavedDeckPayload(payload, faction, commanderId, validationCatalog, { allowCustom: payloadHasCustom, savedKey: key });
  if (!check.ok) {
    deckBuilderSetFeedback(`Deck salvato non caricato: ${check.issues.join("; ")}`, "bad");
    renderDeckBuilderScreen();
    return false;
  }
  deckBuilderState.faction = faction;
  deckBuilderState.commanderId = commanderId;
  deckBuilderState.selectedSavedKey = key;
  deckBuilderState.deckName = check.deckName || payload.deckName || payload.name || "";
  const nameInput = typeof document !== "undefined" ? document.getElementById("deckBuilderDeckNameInput") : null;
  if (nameInput) nameInput.value = deckBuilderState.deckName || deckBuilderDefaultDeckName({ faction, commanderId, commanderName: check.payload.commanderName || commanderId, containsCustomCards: payloadHasCustom });
  deckBuilderState.draftsByKey[deckBuilderDraftKey(faction, commanderId, { includeCustom: payloadHasCustom })] = [...check.deckIds];
  deckBuilderSetFeedback(`Deck gallery caricato nel draft: “${deckBuilderState.deckName || "deck"}” · ${faction} · ${check.payload.commanderName || commanderId} (${check.deckIds.length} carte${payloadHasCustom ? ", custom lab" : ""}).`, "good");
  renderDeckBuilderScreen();
  return true;
}

function copySavedDeckBuilderPayloadByKey(savedKey) {
  const key = String(savedKey || "");
  const store = deckBuilderReadSavedStore();
  const payload = store[key];
  if (!payload) {
    deckBuilderSetFeedback(`Deck salvato non trovato: ${key || "chiave assente"}.`, "bad");
    renderDeckBuilderScreen();
    return false;
  }
  const text = JSON.stringify({
    schemaVersion: "F9I1-single-deck",
    kind: "arena-rubra-custom-decks",
    exportedAt: deckBuilderNowIso(),
    key,
    decks: { [key]: payload }
  }, null, 2);
  const deckName = deckBuilderNormalizeDeckName(payload.deckName || payload.name || "") || key;
  deckBuilderSetFeedback(`Deck “${deckName}” copiato negli appunti.`, "good");
  return copyDeckBuilderText(text, `Deck “${deckName}” copiato negli appunti.`);
}

function deleteSavedDeckBuilderDraftByKey(savedKey) {
  const key = String(savedKey || "");
  const store = deckBuilderReadSavedStore();
  if (!store[key]) {
    deckBuilderSetFeedback(`Deck salvato non trovato: ${key || "chiave assente"}.`, "bad");
    renderDeckBuilderScreen();
    return false;
  }
  if (deckBuilderIsBuiltinKey(key, store[key])) {
    deckBuilderSetFeedback("I deck integrati non possono essere eliminati.", "bad");
    renderDeckBuilderScreen();
    return false;
  }
  const okConfirm = typeof confirm === "function" ? confirm(`Eliminare il deck salvato ${key}?`) : true;
  if (!okConfirm) return false;
  delete store[key];
  const ok = deckBuilderWriteSavedStore(store);
  if (deckBuilderState.selectedSavedKey === key) deckBuilderState.selectedSavedKey = "";
  deckBuilderSetFeedback(ok ? `Deck salvato eliminato: ${key}.` : "Eliminazione fallita.", ok ? "good" : "bad");
  if (typeof refreshSetupDeckSelectors === "function") refreshSetupDeckSelectors();
  renderDeckBuilderScreen();
  return ok;
}

function initializeDeckBuilderScreen() {
  if (typeof document === "undefined") return;
  populateDeckBuilderFactionSelect();
  populateDeckBuilderCommanderSelect();

  const factionSelect = document.getElementById("deckBuilderFactionSelect");
  if (factionSelect && factionSelect.dataset.bound !== "1") {
    factionSelect.dataset.bound = "1";
    factionSelect.addEventListener("change", () => {
      deckBuilderState.faction = factionSelect.value;
      deckBuilderState.commanderId = "";
      deckBuilderState.selectedPreviewCardId = "";
      renderDeckBuilderScreen();
    });
  }

  const commanderSelect = document.getElementById("deckBuilderCommanderSelect");
  if (commanderSelect && commanderSelect.dataset.bound !== "1") {
    commanderSelect.dataset.bound = "1";
    commanderSelect.addEventListener("change", () => {
      deckBuilderState.commanderId = commanderSelect.value;
      deckBuilderState.selectedPreviewCardId = "";
      renderDeckBuilderScreen();
    });
  }

  const deckNameInput = document.getElementById("deckBuilderDeckNameInput");
  if (deckNameInput && deckNameInput.dataset.bound !== "1") {
    deckNameInput.dataset.bound = "1";
    deckNameInput.addEventListener("input", () => {
      deckBuilderState.deckName = deckBuilderNormalizeDeckName(deckNameInput.value);
    });
    deckNameInput.addEventListener("change", () => {
      deckBuilderState.deckName = deckBuilderNormalizeDeckName(deckNameInput.value);
      renderDeckBuilderScreen();
    });
  }

  const includeCustomToggle = document.getElementById("deckBuilderIncludeCustomToggle");
  if (includeCustomToggle && includeCustomToggle.dataset.bound !== "1") {
    includeCustomToggle.dataset.bound = "1";
    includeCustomToggle.addEventListener("change", () => {
      deckBuilderState.includeCustomCards = Boolean(includeCustomToggle.checked);
      deckBuilderState.selectedPreviewCardId = "";
      deckBuilderSetFeedback(deckBuilderState.includeCustomCards ? "Pool CUSTOM attivo: eventuali deck con custom saranno NON UFFICIALI." : "Pool ufficiale attivo.", deckBuilderState.includeCustomCards ? "good" : "");
      renderDeckBuilderScreen();
    });
  }

  const copyBtn = document.getElementById("deckBuilderCopyJsonBtn");
  if (copyBtn && copyBtn.dataset.bound !== "1") {
    copyBtn.dataset.bound = "1";
    copyBtn.addEventListener("click", copyDeckBuilderReportJson);
  }

  const copyDeckBtn = document.getElementById("deckBuilderCopyDeckJsonBtn");
  if (copyDeckBtn && copyDeckBtn.dataset.bound !== "1") {
    copyDeckBtn.dataset.bound = "1";
    copyDeckBtn.addEventListener("click", copyDeckBuilderDeckJson);
  }

  const saveBtn = document.getElementById("deckBuilderSaveBtn");
  if (saveBtn && saveBtn.dataset.bound !== "1") {
    saveBtn.dataset.bound = "1";
    saveBtn.addEventListener("click", saveCurrentDeckBuilderDraft);
  }

  const loadSavedBtn = document.getElementById("deckBuilderLoadSavedBtn");
  if (loadSavedBtn && loadSavedBtn.dataset.bound !== "1") {
    loadSavedBtn.dataset.bound = "1";
    loadSavedBtn.addEventListener("click", loadSavedDeckBuilderDraft);
  }

  const deleteSavedBtn = document.getElementById("deckBuilderDeleteSavedBtn");
  if (deleteSavedBtn && deleteSavedBtn.dataset.bound !== "1") {
    deleteSavedBtn.dataset.bound = "1";
    deleteSavedBtn.addEventListener("click", deleteSavedDeckBuilderDraft);
  }

  const exportAllBtn = document.getElementById("deckBuilderExportAllDecksBtn");
  if (exportAllBtn && exportAllBtn.dataset.bound !== "1") {
    exportAllBtn.dataset.bound = "1";
    exportAllBtn.addEventListener("click", exportAllDeckBuilderSavedDecksJson);
  }

  const copyAllBtn = document.getElementById("deckBuilderCopyAllDecksBtn");
  if (copyAllBtn && copyAllBtn.dataset.bound !== "1") {
    copyAllBtn.dataset.bound = "1";
    copyAllBtn.addEventListener("click", copyAllDeckBuilderSavedDecksJson);
  }

  const importAllBtn = document.getElementById("deckBuilderImportDecksBtn");
  if (importAllBtn && importAllBtn.dataset.bound !== "1") {
    importAllBtn.dataset.bound = "1";
    importAllBtn.addEventListener("click", openDeckBuilderImportFilePicker);
  }

  const importFileInput = document.getElementById("deckBuilderImportDecksFile");
  if (importFileInput && importFileInput.dataset.bound !== "1") {
    importFileInput.dataset.bound = "1";
    importFileInput.addEventListener("change", () => {
      const file = importFileInput.files && importFileInput.files[0] ? importFileInput.files[0] : null;
      importDeckBuilderSavedDecksFile(file);
      importFileInput.value = "";
    });
  }

  const pasteImportBtn = document.getElementById("deckBuilderPasteImportBtn");
  if (pasteImportBtn && pasteImportBtn.dataset.bound !== "1") {
    pasteImportBtn.dataset.bound = "1";
    pasteImportBtn.addEventListener("click", () => toggleDeckBuilderImportTextBox());
  }

  const importTextBtn = document.getElementById("deckBuilderImportTextConfirmBtn");
  if (importTextBtn && importTextBtn.dataset.bound !== "1") {
    importTextBtn.dataset.bound = "1";
    importTextBtn.addEventListener("click", importDeckBuilderSavedDecksFromTextArea);
  }

  const cancelImportTextBtn = document.getElementById("deckBuilderImportTextCancelBtn");
  if (cancelImportTextBtn && cancelImportTextBtn.dataset.bound !== "1") {
    cancelImportTextBtn.dataset.bound = "1";
    cancelImportTextBtn.addEventListener("click", () => toggleDeckBuilderImportTextBox(false));
  }

  const assetManifestBtn = document.getElementById("deckBuilderAssetManifestBtn");
  if (assetManifestBtn && assetManifestBtn.dataset.bound !== "1") {
    assetManifestBtn.dataset.bound = "1";
    assetManifestBtn.addEventListener("click", copyDeckBuilderAssetManifestJson);
  }

  const resetBtn = document.getElementById("deckBuilderResetTemplateBtn");
  if (resetBtn && resetBtn.dataset.bound !== "1") {
    resetBtn.dataset.bound = "1";
    resetBtn.addEventListener("click", resetDeckBuilderDraftToTemplate);
  }

  const clearBtn = document.getElementById("deckBuilderClearBtn");
  if (clearBtn && clearBtn.dataset.bound !== "1") {
    clearBtn.dataset.bound = "1";
    clearBtn.addEventListener("click", clearDeckBuilderDraft);
  }

  const screen = document.getElementById("deckBuilderScreen");
  if (screen && screen.dataset.deckBuilderDelegated !== "1") {
    screen.dataset.deckBuilderDelegated = "1";
    screen.addEventListener("click", event => {
      const addBtn = event.target && event.target.closest ? event.target.closest("[data-db-add-card]") : null;
      if (addBtn) {
        event.preventDefault();
        deckBuilderAddCard(addBtn.dataset.dbAddCard);
        return;
      }
      const removeBtn = event.target && event.target.closest ? event.target.closest("[data-db-remove-card]") : null;
      if (removeBtn) {
        event.preventDefault();
        deckBuilderRemoveCard(removeBtn.dataset.dbRemoveCard);
        return;
      }
      const previewRow = event.target && event.target.closest ? event.target.closest("[data-db-preview-card]") : null;
      if (previewRow) {
        const clickOnButton = event.target && event.target.closest ? event.target.closest("button") : null;
        if (!clickOnButton || !clickOnButton.hasAttribute("data-db-add-card") && !clickOnButton.hasAttribute("data-db-remove-card")) {
          deckBuilderSetPreviewCard(previewRow.dataset.dbPreviewCard, previewRow.dataset.dbPreviewSource || "");
          if (typeof renderDeckBuilderCardPreview === "function") renderDeckBuilderCardPreview(deckBuilderReportObject());
          renderDeckBuilderScreen();
          return;
        }
      }
      const loadSavedBtn = event.target && event.target.closest ? event.target.closest("[data-db-load-saved-key]") : null;
      if (loadSavedBtn) {
        event.preventDefault();
        loadSavedDeckBuilderDraftByKey(loadSavedBtn.dataset.dbLoadSavedKey);
        return;
      }
      const copySavedBtn = event.target && event.target.closest ? event.target.closest("[data-db-copy-saved-key]") : null;
      if (copySavedBtn) {
        event.preventDefault();
        copySavedDeckBuilderPayloadByKey(copySavedBtn.dataset.dbCopySavedKey);
        return;
      }
      const deleteSavedBtn = event.target && event.target.closest ? event.target.closest("[data-db-delete-saved-key]") : null;
      if (deleteSavedBtn) {
        event.preventDefault();
        deleteSavedDeckBuilderDraftByKey(deleteSavedBtn.dataset.dbDeleteSavedKey);
      }
    });
  }
}
