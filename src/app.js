"use strict";

// Arena Rubra – F9L2 app shell.
// Mantiene gameplay/runtime F9K6b validati, F9K7 menu cleanup, F9L1 calibratore e F9L2 layer visuali mappa.

const ARENA_APP_SCREENS = Object.freeze({
  MAIN_MENU: "mainMenu",
  SETUP: "setup",
  GAME: "game",
  DECK_BUILDER: "deckBuilder",
  CARD_EDITOR: "cardEditor",
  CARD_POOL: "cardPool",
  MAP_EDITOR: "mapEditor",
  TUTORIAL: "tutorial",
  LAYOUT_LAB: "layoutLab",
  STATS: "stats",
  OPTIONS: "options",
  ABOUT: "about"
});

const arenaApp = {
  screen: ARENA_APP_SCREENS.MAIN_MENU,
  lastPlaceholder: ""
};

function currentAppScreen() {
  return arenaApp.screen;
}

function setAppScreen(screen) {
  const next = screen || ARENA_APP_SCREENS.MAIN_MENU;
  arenaApp.screen = next;
  if (typeof document === "undefined" || !document.body) return;

  const placeholderScreens = [
    ARENA_APP_SCREENS.STATS,
    ARENA_APP_SCREENS.OPTIONS,
    ARENA_APP_SCREENS.ABOUT
  ];
  const isMainMenu = next === ARENA_APP_SCREENS.MAIN_MENU;
  const isSetup = next === ARENA_APP_SCREENS.SETUP;
  const isGame = next === ARENA_APP_SCREENS.GAME;
  const isDeckBuilder = next === ARENA_APP_SCREENS.DECK_BUILDER;
  const isCardEditor = next === ARENA_APP_SCREENS.CARD_EDITOR;
  const isCardPool = next === ARENA_APP_SCREENS.CARD_POOL;
  const isMapEditor = next === ARENA_APP_SCREENS.MAP_EDITOR;
  const isTutorial = next === ARENA_APP_SCREENS.TUTORIAL;
  const isLayoutLab = next === ARENA_APP_SCREENS.LAYOUT_LAB;
  const isPlaceholder = placeholderScreens.includes(next);
  const isGameLayoutLab = isLayoutLab && typeof menuLayoutCalibrationIsGameContext === "function" && menuLayoutCalibrationIsGameContext();

  if (!isMainMenu && typeof controlCenterClosePanel === "function") controlCenterClosePanel();
  if (!isGame && typeof closeGamePanel === "function") closeGamePanel();

  document.body.dataset.appScreen = next;
  document.body.classList.toggle("app-screen-menu", isMainMenu);
  document.body.classList.toggle("app-screen-setup", isSetup);
  document.body.classList.toggle("app-screen-game", isGame || isGameLayoutLab);
  document.body.classList.toggle("app-screen-deck-builder", isDeckBuilder);
  document.body.classList.toggle("app-screen-card-editor", isCardEditor);
  document.body.classList.toggle("app-screen-card-pool", isCardPool);
  document.body.classList.toggle("app-screen-map-editor", isMapEditor);
  document.body.classList.toggle("app-screen-tutorial", isTutorial);
  document.body.classList.toggle("app-screen-layout-lab", isLayoutLab);
  document.body.classList.toggle("app-layout-lab-game-context", isGameLayoutLab);
  document.body.classList.toggle("app-screen-placeholder", isPlaceholder);

  const screens = document.querySelectorAll("[data-app-screen-panel]");
  screens.forEach(el => {
    const active = el.dataset.appScreenPanel === next || (el.id === "appPlaceholderScreen" && isPlaceholder);
    el.classList.toggle("isActive", active);
    el.setAttribute("aria-hidden", active ? "false" : "true");
  });

  if (isDeckBuilder && typeof renderDeckBuilderScreen === "function") renderDeckBuilderScreen();
  if (isCardEditor && typeof renderCardEditorScreen === "function") renderCardEditorScreen();
  if (isCardPool && typeof renderCardPoolScreen === "function") renderCardPoolScreen();
  if (isMapEditor && typeof renderMapEditor === "function") renderMapEditor();
  if (isTutorial && typeof tutorialRuntimeRenderMenu === "function") tutorialRuntimeRenderMenu();
  if (isLayoutLab && typeof renderMenuLayoutCalibrationLab === "function") renderMenuLayoutCalibrationLab();
  if (!isGame && !isGameLayoutLab && typeof arenaPresentationResetForMenu === "function") {
    arenaPresentationResetForMenu({ music: true, restoreMap: true, fade: true });
  }
  refreshMainMenuResumeState();
  if (isMainMenu) {
    refreshMainMenuLocalDataSummary();
    if (typeof controlCenterRefresh === "function") controlCenterRefresh();
  }
}

function readControlValue(id, fallback = "") {
  const el = typeof document !== "undefined" ? document.getElementById(id) : null;
  return el ? el.value : fallback;
}

function writeControlValue(id, value) {
  const el = typeof document !== "undefined" ? document.getElementById(id) : null;
  if (!el || value === undefined || value === null) return;
  const stringValue = String(value);
  const hasOption = !el.options || Array.from(el.options).some(opt => opt.value === stringValue);
  if (hasOption || el.type === "checkbox") {
    if (el.type === "checkbox") el.checked = Boolean(value);
    else el.value = stringValue;
  }
}

function appEscapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function appShortDateLabel(value) {
  const text = String(value || "");
  if (!text) return "";
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : text.slice(0, 10);
}

function setupDeckOptionLabel(entry) {
  if (!entry) return "Nessun deck salvato";
  const payload = entry.payload || {};
  const deckName = entry.deckName || payload.deckName || payload.name || entry.key || "Deck salvato";
  const count = Array.isArray(payload.deckIds) ? payload.deckIds.length : null;
  const countLabel = payload.supplementalMissionId ? `${count == null ? "?" : count} + Missione` : `${count == null ? "?" : count} carte`;
  const mode = entry.containsCustomCards ? "CUSTOM" : (entry.builtIn || payload.builtIn ? "BUILT-IN" : "OFFICIAL");
  const saved = entry.builtIn || payload.builtIn ? "" : appShortDateLabel(entry.savedAt || payload.savedAt || payload.updatedAt || payload.importedAt || "");
  const commander = payload.commanderName || entry.commanderId || "Comandante";
  return `${deckName} · ${countLabel} · ${mode} · ${commander}${saved ? ` · ${saved}` : ""}`;
}

function setupUpdateDeckBadge(side, text, tone = "starter") {
  const badge = typeof document !== "undefined" ? document.getElementById(`setupP${side}DeckBadge`) : null;
  if (!badge) return;
  badge.textContent = text || "Deck Starter";
  badge.classList.toggle("custom", tone === "custom");
  badge.classList.toggle("official", tone === "official");
  badge.classList.toggle("bad", tone === "bad");
  badge.classList.toggle("starter", tone === "starter");
}


function refreshMainMenuResumeState() {
  const resumeBtn = typeof document !== "undefined" ? document.getElementById("mainMenuResumeBtn") : null;
  if (!resumeBtn) return;
  const hasGame = typeof state !== "undefined" && !!state;
  resumeBtn.disabled = !hasGame;
  resumeBtn.title = hasGame ? "Riprendi la sessione runtime corrente" : "Nessuna sessione attiva";
  const title = resumeBtn.querySelector("strong");
  const hint = resumeBtn.querySelector("small");
  if (title) title.textContent = "Riprendi";
  if (hint) hint.textContent = hasGame ? "Sessione runtime corrente" : "Nessuna sessione attiva";
  if (!title && !hint) resumeBtn.textContent = hasGame ? "Riprendi partita" : "Riprendi partita non disponibile";
}

function refreshMainMenuLocalDataSummary() {
  if (typeof document === "undefined") return;
  const status = document.getElementById("menuStorageStatus");
  const summary = document.getElementById("mainMenuLocalSummary");
  const diagnostics = typeof arenaStorageBackendDiagnostics === "function"
    ? arenaStorageBackendDiagnostics()
    : { backendName: "localStorage", initialized: true, pendingWrites: 0 };
  const backendLabels = {
    opfs: "directory privata OPFS",
    indexedDB: "archivio IndexedDB",
    localStorage: "compatibilità localStorage",
    memory: "memoria temporanea",
    uninitialized: "inizializzazione"
  };
  const backendLabel = backendLabels[diagnostics.backendName] || diagnostics.backendName || "archivio locale";
  if (status) {
    const pending = Number(diagnostics.pendingWrites) || 0;
    status.textContent = `Archivio locale: ${backendLabel}${pending ? ` · ${pending} scrittura/e` : ""}`;
    status.dataset.storageTone = diagnostics.backendName === "memory" || diagnostics.error ? "warn" : "good";
  }
  if (summary) {
    const cards = typeof cardEditorReadCustomCards === "function" ? cardEditorReadCustomCards().length : 0;
    const deckStore = typeof arenaStorageReadCustomDecks === "function" ? arenaStorageReadCustomDecks() : {};
    const decks = deckStore && typeof deckStore === "object" ? Object.keys(deckStore).length : 0;
    const maps = typeof getCustomMapDefinitions === "function" ? getCustomMapDefinitions().length : 0;
    const stats = typeof arenaStorageReadMatchupStats === "function" ? arenaStorageReadMatchupStats().length : 0;
    const history = typeof arenaStorageReadMatchHistory === "function" ? arenaStorageReadMatchHistory().length : 0;
    summary.textContent = `${cards} carte custom · ${decks} deck custom · ${maps} mappe custom · ${stats} record matchup · ${history} partite nello storico`;
  }
  if (typeof controlCenterRefreshMetrics === "function") controlCenterRefreshMetrics();
}

function initializeMainMenuDeveloperTools() {
  if (typeof document === "undefined") return;
  if (typeof controlCenterApplyDeveloperMode === "function") {
    controlCenterApplyDeveloperMode();
    return;
  }
  let enabled = false;
  try {
    const params = new URLSearchParams(window.location.search || "");
    enabled = params.get("dev") === "1";
  } catch (_) {}
  document.querySelectorAll("[data-dev-only]").forEach(element => {
    element.hidden = !enabled;
    element.setAttribute("aria-hidden", enabled ? "false" : "true");
  });
}

function commanderLabelForSetup(card) {
  return typeof commanderOptionLabel === "function" ? commanderOptionLabel(card) : (card ? card.name : "Comandante");
}

function populateSetupCommanderSelectForSide(side) {
  const factionSelect = document.getElementById(`setupP${side}Faction`);
  const commanderSelect = document.getElementById(`setupP${side}Commander`);
  if (!factionSelect || !commanderSelect || typeof commanderCardsForFaction !== "function") return;

  const faction = factionSelect.value;
  const previous = commanderSelect.value;
  const commanders = commanderCardsForFaction(faction);
  commanderSelect.innerHTML = commanders.map(card => `<option value="${card.blueprintId}">${commanderLabelForSetup(card)}</option>`).join("");

  const fallback = typeof defaultCommanderBlueprintIdForFaction === "function"
    ? defaultCommanderBlueprintIdForFaction(faction)
    : (commanders[0] && commanders[0].blueprintId);
  commanderSelect.value = commanders.some(card => card.blueprintId === previous) ? previous : fallback;
}

function refreshSetupCommanderSelects() {
  [1, 2, 3, 4].forEach(populateSetupCommanderSelectForSide);
}

function setupSelectedMapDefinition() {
  const mapId = readControlValue("setupMapName", "map1_starter");
  return typeof getMapDefinitionById === "function" ? getMapDefinitionById(mapId) : null;
}

function setupActivePlayerCount() {
  const definition = setupSelectedMapDefinition();
  return Math.max(2, Math.min(4, Number(definition && definition.playerCount) || 2));
}

function refreshSetupMapSelector(preferredId = "") {
  const select = typeof document !== "undefined" ? document.getElementById("setupMapName") : null;
  if (!select || typeof getAvailableMapDefinitions !== "function") return;
  const definitions = getAvailableMapDefinitions();
  const previous = preferredId || select.value || "map1_starter";
  select.innerHTML = definitions.map(definition => {
    const custom = definition.official ? "" : " · CUSTOM";
    return `<option value="${appEscapeHtml(definition.id)}">${appEscapeHtml(definition.name)} · ${definition.playerCount}G · ${definition.geometry.cells.length} celle · movimento ×${definition.movementMultiplier}${custom}</option>`;
  }).join("");
  select.value = definitions.some(definition => definition.id === previous) ? previous : "map1_starter";
  refreshSetupForSelectedMap();
}

function refreshSetupForSelectedMap() {
  const definition = setupSelectedMapDefinition();
  if (!definition) return;
  const count = Math.max(2, Math.min(4, Number(definition.playerCount) || 2));
  [1, 2, 3, 4].forEach(side => {
    const box = document.getElementById(`setupPlayer${side}Box`) || document.querySelectorAll(".setupPlayerBox")[side - 1];
    if (box) box.hidden = side > count;
  });
  const initiative = document.getElementById("setupInitiativeMode");
  if (initiative) {
    const previous = initiative.value || "random";
    initiative.innerHTML = `<option value="random">Casuale</option>${Array.from({ length: count }, (_, index) => `<option value="${index + 1}">Giocatore ${index + 1}</option>`).join("")}`;
    initiative.value = previous === "random" || Number(previous) <= count ? previous : "random";
  }
  const heading = document.getElementById("setupMapHeading");
  if (heading) heading.textContent = `Setup ${definition.name}`;
  const meta = document.getElementById("setupMapMeta");
  if (meta) {
    const usage = typeof mapTerrainUsage === "function" ? mapTerrainUsage(definition) : {};
    const special = Object.entries(usage).filter(([key]) => key !== "free").map(([key, value]) => `${key} ${value}`).join(" · ");
    const lab = typeof mapEditorState !== "undefined" && mapEditorState && mapEditorState.labMapId === definition.id ? "MATCH LAB · " : "";
    const central = typeof getCentralStrategicPoint === "function" ? getCentralStrategicPoint(definition) : null;
    meta.textContent = `${lab}${definition.playerCount} giocatori FFA · ${definition.geometry.cells.length} celle · ${definition.strategicPoints.length} PS · centro ${central ? `[${central.coord.join(",")}]` : "non valido"} · movimento ×${definition.movementMultiplier}${special ? ` · ${special}` : " · terreno standard"}`;
  }
  refreshSetupDeckSelectors();
}

function setupSavedDeckEntriesForSide(side) {
  const faction = readControlValue(`setupP${side}Faction`, side === 1 ? "Nexus" : "Exordium");
  if (typeof deckBuilderSavedPayloadEntriesFor !== "function") return [];
  // F9S1b1: il selettore mostra tutti i deck salvati della fazione.
  // Il comandante viene sincronizzato dal deck selezionato, invece di filtrare
  // preventivamente la lista sul comandante attualmente visibile nel Setup.
  return deckBuilderSavedPayloadEntriesFor(faction, "", { allowCustom: true });
}

function setupSelectedSavedDeckEntryForSide(side, entries = null) {
  const list = Array.isArray(entries) ? entries : setupSavedDeckEntriesForSide(side);
  const key = readControlValue(`setupP${side}DeckSavedKey`, "") || readControlValue(`p${side}DeckSavedKey`, "");
  return list.find(entry => entry && entry.key === key) || null;
}

function setupApplySelectedDeckIdentity(side, entries = null) {
  const mode = readControlValue(`setupP${side}DeckMode`, "template");
  const commanderSelect = document.getElementById(`setupP${side}Commander`);
  if (commanderSelect) {
    commanderSelect.disabled = mode === "custom";
    commanderSelect.title = mode === "custom"
      ? "Nel modo Deck salvato il comandante è determinato dal deck selezionato."
      : "";
  }
  if (mode !== "custom") return null;
  const entry = setupSelectedSavedDeckEntryForSide(side, entries);
  const payload = entry && entry.payload ? entry.payload : null;
  const commanderId = payload && payload.commanderId ? String(payload.commanderId) : "";
  if (!entry || !commanderId) return entry;
  writeControlValue(`setupP${side}Commander`, commanderId);
  writeControlValue(`p${side}Commander`, commanderId);
  return entry;
}

function setupPopulateSavedDeckSelectForSide(side, entries = null) {
  const select = document.getElementById(`setupP${side}DeckSavedKey`);
  const legacySelect = document.getElementById(`p${side}DeckSavedKey`);
  const setupLabel = typeof document !== "undefined" ? document.querySelector(`label[for=\"setupP${side}DeckSavedKey\"]`) : null;
  const legacyLabel = typeof document !== "undefined" ? document.querySelector(`label[for=\"p${side}DeckSavedKey\"]`) : null;
  const mode = readControlValue(`setupP${side}DeckMode`, "template");
  const list = Array.isArray(entries) ? entries : setupSavedDeckEntriesForSide(side);
  const current = readControlValue(`setupP${side}DeckSavedKey`, "") || readControlValue(`p${side}DeckSavedKey`, "");
  const optionHtml = list.length
    ? list.map(entry => {
        const label = setupDeckOptionLabel(entry);
        return `<option value="${appEscapeHtml(entry.key)}">${appEscapeHtml(label)}</option>`;
      }).join("")
    : `<option value="">Nessun deck salvato</option>`;
  [select, legacySelect].forEach(el => {
    if (!el) return;
    el.innerHTML = optionHtml;
    const valid = list.some(entry => entry.key === current);
    el.value = valid ? current : (list[0] ? list[0].key : "");
    el.disabled = mode !== "custom" || !list.length;
    el.hidden = mode !== "custom";
  });
  [setupLabel, legacyLabel].forEach(label => { if (label) label.hidden = mode !== "custom"; });
  return { entries: list, selectedKey: (select && select.value) || (legacySelect && legacySelect.value) || "" };
}

function setupDeckInfoForSide(side) {
  const faction = readControlValue(`setupP${side}Faction`, side === 1 ? "Nexus" : "Exordium");
  const mode = readControlValue(`setupP${side}DeckMode`, "template");
  const entries = setupSavedDeckEntriesForSide(side);
  const selectState = setupPopulateSavedDeckSelectForSide(side, entries);
  const savedKey = selectState.selectedKey || "";
  const selectedEntry = setupApplySelectedDeckIdentity(side, entries);
  const commanderId = readControlValue(`setupP${side}Commander`, "");
  const check = typeof deckBuilderSavedStatusForSetup === "function"
    ? deckBuilderSavedStatusForSetup(faction, commanderId, null, { allowCustom: true, preferCustom: true, savedKey: mode === "custom" ? savedKey : "" })
    : { ok: false, exists: false, issues: ["Deck Builder non inizializzato"] };
  return { side, faction, commanderId, mode, savedKey, selectedEntry, savedDeckEntries: entries, check };
}

function refreshSetupDeckSelectorForSide(side) {
  const modeSelect = document.getElementById(`setupP${side}DeckMode`);
  const infoEl = document.getElementById(`setupP${side}DeckInfo`);
  if (!modeSelect || !infoEl) return;
  const info = setupDeckInfoForSide(side);
  const customOption = Array.from(modeSelect.options || []).find(opt => opt.value === "custom");
  const savedAt = info.check && info.check.payload ? info.check.payload.savedAt : "";
  const payload = info.check && info.check.payload ? info.check.payload : null;
  const deckName = (info.check && info.check.deckName) || (payload && (payload.deckName || payload.name)) || "";
  const isCustomLab = Boolean(info.check && (info.check.runtimeMode === "custom_lab" || info.check.containsCustomCards));
  if (customOption) customOption.textContent = info.savedDeckEntries.length
    ? `Deck integrato / salvato / Custom Lab (${info.savedDeckEntries.length})`
    : "Deck integrato/salvato non disponibile";
  infoEl.classList.toggle("good", info.mode === "custom" && info.check && info.check.ok);
  infoEl.classList.toggle("bad", info.mode === "custom" && (!info.check || !info.check.ok));
  if (info.mode === "custom") {
    if (info.check && info.check.ok && payload) {
      const shortSaved = appShortDateLabel(savedAt);
      const builtin = Boolean(info.check.builtIn || payload.builtIn);
      setupUpdateDeckBadge(side, isCustomLab ? `CUSTOM · ${payload.customCount || 0}` : (builtin ? "BUILT-IN" : "OFFICIAL"), isCustomLab ? "custom" : "official");
      const countLabel = info.check.supplementalMissionId ? `${info.check.countedDeckSize}/30 + Missione supplementare` : `${info.check.deckIds.length} carte`;
      infoEl.textContent = `${isCustomLab ? "Custom Match Test Lab" : (builtin ? "Deck integrato" : "Deck personalizzato ufficiale")}: “${deckName || "deck"}” · ${info.faction} · ${payload.commanderName || info.commanderId} · ${countLabel}${shortSaved && !builtin ? ` · ${shortSaved}` : ""}.`;
    } else {
      setupUpdateDeckBadge(side, "Deck non valido", "bad");
      infoEl.textContent = `Deck personalizzato non disponibile/valido: ${((info.check && info.check.issues) || ["nessun deck salvato selezionato"]).join("; ")}.`;
    }
  } else {
    setupUpdateDeckBadge(side, info.savedDeckEntries.length ? `${info.savedDeckEntries.length} salvati` : "Deck Starter", "starter");
    infoEl.textContent = info.savedDeckEntries.length
      ? `Deck automatico Starter. Deck salvati disponibili per questa fazione/comandante: ${info.savedDeckEntries.length}. Se vuoi usarli, cambia Modalità deck.`
      : `Deck automatico Starter.`;
  }
}

function refreshSetupDeckSelectors() {
  const count = setupActivePlayerCount();
  [1, 2, 3, 4].forEach(side => {
    if (side <= count) refreshSetupDeckSelectorForSide(side);
  });
}

function validateSetupDeckSelectionsBeforeStart() {
  const issues = [];
  Array.from({ length: setupActivePlayerCount() }, (_, index) => index + 1).forEach(side => {
    const info = setupDeckInfoForSide(side);
    if (info.mode !== "custom") return;
    if (!info.check || !info.check.ok) {
      issues.push(`G${side}: ${((info.check && info.check.issues) || ["deck personalizzato non valido"]).join("; ")}`);
    }
  });
  const errorEl = document.getElementById("setupDeckError");
  if (errorEl) {
    errorEl.classList.toggle("bad", issues.length > 0);
    errorEl.textContent = issues.length ? `Impossibile avviare: ${issues.join(" | ")}` : "";
  }
  if (issues.length && typeof alert === "function") alert(`Deck personalizzato non valido.\n${issues.join("\n")}`);
  return { ok: issues.length === 0, issues };
}

function syncSetupScreenFromLegacyControls() {
  writeControlValue("setupP1Faction", readControlValue("p1Faction", "Nexus"));
  writeControlValue("setupP2Faction", readControlValue("p2Faction", "Exordium"));
  writeControlValue("setupP3Faction", readControlValue("setupP3Faction", "Liberti"));
  writeControlValue("setupP4Faction", readControlValue("setupP4Faction", "Agathoi"));
  refreshSetupCommanderSelects();
  writeControlValue("setupP1Commander", readControlValue("p1Commander", ""));
  writeControlValue("setupP2Commander", readControlValue("p2Commander", ""));
  writeControlValue("setupP1Mode", readControlValue("p1Mode", "human"));
  writeControlValue("setupP2Mode", readControlValue("p2Mode", "bot"));
  writeControlValue("setupP3Mode", readControlValue("setupP3Mode", "bot"));
  writeControlValue("setupP4Mode", readControlValue("setupP4Mode", "bot"));
  writeControlValue("setupInitiativeMode", readControlValue("initiativeMode", "random"));
  writeControlValue("setupBotAiMode", readControlValue("botAiMode", "advanced"));
  writeControlValue("setupPacePreset", readControlValue("pacePreset", "standard"));
  writeControlValue("setupGameScaleMode", readControlValue("gameScaleMode", "large_scale"));
  writeControlValue("setupP1DeckMode", readControlValue("p1DeckMode", "template"));
  writeControlValue("setupP2DeckMode", readControlValue("p2DeckMode", "template"));
  writeControlValue("setupP3DeckMode", readControlValue("setupP3DeckMode", "template"));
  writeControlValue("setupP4DeckMode", readControlValue("setupP4DeckMode", "template"));
  writeControlValue("setupP1DeckSavedKey", readControlValue("p1DeckSavedKey", readControlValue("setupP1DeckSavedKey", "")));
  writeControlValue("setupP2DeckSavedKey", readControlValue("p2DeckSavedKey", readControlValue("setupP2DeckSavedKey", "")));
  writeControlValue("setupP3DeckSavedKey", readControlValue("setupP3DeckSavedKey", ""));
  writeControlValue("setupP4DeckSavedKey", readControlValue("setupP4DeckSavedKey", ""));
  refreshSetupDeckSelectors();
  const legacyAuto = document.getElementById("autoResignToggle");
  const setupAuto = document.getElementById("setupAutoResignToggle");
  if (legacyAuto && setupAuto) setupAuto.checked = legacyAuto.checked;
}

function syncLegacyControlsFromSetupScreen() {
  writeControlValue("p1Faction", readControlValue("setupP1Faction", "Nexus"));
  writeControlValue("p2Faction", readControlValue("setupP2Faction", "Exordium"));
  if (typeof refreshCommanderSelects === "function") refreshCommanderSelects();
  writeControlValue("p1Commander", readControlValue("setupP1Commander", ""));
  writeControlValue("p2Commander", readControlValue("setupP2Commander", ""));
  writeControlValue("p1Mode", readControlValue("setupP1Mode", "human"));
  writeControlValue("p2Mode", readControlValue("setupP2Mode", "bot"));
  writeControlValue("initiativeMode", readControlValue("setupInitiativeMode", "random"));
  writeControlValue("botAiMode", readControlValue("setupBotAiMode", "advanced"));
  writeControlValue("pacePreset", readControlValue("setupPacePreset", "standard"));
  writeControlValue("gameScaleMode", readControlValue("setupGameScaleMode", "large_scale"));
  writeControlValue("p1DeckMode", readControlValue("setupP1DeckMode", "template"));
  writeControlValue("p2DeckMode", readControlValue("setupP2DeckMode", "template"));
  writeControlValue("p1DeckSavedKey", readControlValue("setupP1DeckSavedKey", ""));
  writeControlValue("p2DeckSavedKey", readControlValue("setupP2DeckSavedKey", ""));
  const legacyAuto = document.getElementById("autoResignToggle");
  const setupAuto = document.getElementById("setupAutoResignToggle");
  if (legacyAuto && setupAuto) legacyAuto.checked = setupAuto.checked;
}

function openNewGameSetupScreen() {
  if (typeof tutorialRuntimeAbortChallenge === "function" && typeof tutorialChallengeRuntimeState !== "undefined" && tutorialChallengeRuntimeState.active) {
    tutorialRuntimeAbortChallenge({ silent:true, keepScreen:true, reason:"open-new-game" });
  }
  if (typeof refreshCommanderSelects === "function") refreshCommanderSelects();
  refreshSetupMapSelector(typeof mapEditorState !== "undefined" && mapEditorState && mapEditorState.labMapId ? mapEditorState.labMapId : "");
  syncSetupScreenFromLegacyControls();
  setAppScreen(ARENA_APP_SCREENS.SETUP);
}

function startGameFromSetupScreen() {
  refreshSetupDeckSelectors();
  const deckCheck = validateSetupDeckSelectionsBeforeStart();
  if (!deckCheck.ok) return;
  syncLegacyControlsFromSetupScreen();
  const setupOverrides = {
    gameScaleMode: readControlValue("setupGameScaleMode", "large_scale") === "tactical" ? "tactical" : "large_scale",
    mapId: readControlValue("setupMapName", "map1_starter")
  };
  const labMapId = typeof mapEditorState !== "undefined" && mapEditorState ? mapEditorState.labMapId : null;
  setupOverrides.mapLabMode = Boolean(labMapId && labMapId === setupOverrides.mapId);
  setupOverrides.mapLabSourceId = setupOverrides.mapLabMode ? labMapId : null;
  setAppScreen(ARENA_APP_SCREENS.GAME);
  if (typeof newGame === "function") {
    try {
      newGame(setupOverrides);
    } catch (err) {
      console.error("Avvio partita fallito", err);
      setAppScreen(ARENA_APP_SCREENS.SETUP);
      const errorEl = document.getElementById("setupDeckError");
      if (errorEl) {
        errorEl.classList.add("bad");
        errorEl.textContent = `Avvio partita fallito: ${err && err.message ? err.message : err}`;
      }
    }
  }
}


function appPlaceholderText(screen) {
  const labels = {
    cardEditor: "Crea / modifica carta",
    cardPool: "Pool carte",
    stats: "Statistiche / log test",
    options: "Opzioni / debug",
    about: "Informazioni versione"
  };
  const label = labels[screen] || "Schermata futura";
  if (screen === ARENA_APP_SCREENS.ABOUT && typeof BUILD_INFO !== "undefined") {
    return `${label}: ${BUILD_INFO.version} · ${BUILD_INFO.buildName} · baseline ${BUILD_INFO.logicBaseline}.`;
  }
  return `${label}: placeholder F9P1. La schermata verrà implementata nelle prossime sottofasi senza modificare la logica Starter congelata.`;
}

function showAppPlaceholder(screen) {
  const target = document.getElementById("appPlaceholderMessage");
  if (target) target.textContent = appPlaceholderText(screen);
  setAppScreen(screen);
}

function startNewGameFromAppMenu() {
  openNewGameSetupScreen();
}

function openTutorialScreen() {
  setAppScreen(ARENA_APP_SCREENS.TUTORIAL);
  if (typeof tutorialRuntimeRenderMenu === "function") tutorialRuntimeRenderMenu();
}


function resumeGameFromAppMenu() {
  if (typeof state === "undefined" || !state) {
    openNewGameSetupScreen();
    return;
  }
  setAppScreen(ARENA_APP_SCREENS.GAME);
  if (typeof arenaPresentationApplyForGame === "function") arenaPresentationApplyForGame({ music: false, preserveOverride: true });
  if (typeof arenaAudioResumeForState === "function") arenaAudioResumeForState();
  if (typeof renderAll === "function") renderAll();
  if (typeof maybeRunBot === "function") maybeRunBot();
}

function openMainMenu() {
  if (typeof tutorialRuntimeAbortChallenge === "function" && typeof tutorialChallengeRuntimeState !== "undefined" && tutorialChallengeRuntimeState.active) {
    tutorialRuntimeAbortChallenge({ silent:true, keepScreen:true, reason:"main-menu" });
  }
  if (typeof controlCenterClosePanel === "function") controlCenterClosePanel();
  refreshSetupDeckSelectors();
  setAppScreen(ARENA_APP_SCREENS.MAIN_MENU);
}

function initializeArenaAppShell() {
  if (typeof document === "undefined") return;
  if (typeof applyBuildInfoToDom === "function") applyBuildInfoToDom();
  initializeMainMenuDeveloperTools();
  refreshMainMenuLocalDataSummary();
  if (typeof initializeGameScreenShell === "function") {
    try {
      initializeGameScreenShell();
    } catch (err) {
      // La shell del menu non deve mai restare bloccata da un errore HUD/GameScreen.
      console.error("Arena AppShell: inizializzazione GameScreen non bloccante fallita", err);
    }
  }

  if (typeof initializeDeckBuilderScreen === "function") initializeDeckBuilderScreen();
  if (typeof initializeCardEditorScreen === "function") initializeCardEditorScreen();
  if (typeof initializeCardPoolScreen === "function") initializeCardPoolScreen();
  if (typeof initializeMapEditorScreen === "function") initializeMapEditorScreen();
  if (typeof initializeMenuLayoutCalibrationLab === "function") initializeMenuLayoutCalibrationLab();
  if (typeof initializeControlCenter === "function") initializeControlCenter();

  document.querySelectorAll("[data-app-open-deck-builder]").forEach(deckBuilderBtn => {
    if (deckBuilderBtn.dataset.bound === "1") return;
    deckBuilderBtn.dataset.bound = "1";
    deckBuilderBtn.addEventListener("click", () => {
      if (typeof openDeckBuilderScreen === "function") openDeckBuilderScreen();
      else showAppPlaceholder(ARENA_APP_SCREENS.DECK_BUILDER);
    });
  });

  document.querySelectorAll("[data-app-open-card-editor]").forEach(cardEditorBtn => {
    if (cardEditorBtn.dataset.bound === "1") return;
    cardEditorBtn.dataset.bound = "1";
    cardEditorBtn.addEventListener("click", () => {
      if (typeof openCardEditorScreen === "function") openCardEditorScreen();
      else showAppPlaceholder(ARENA_APP_SCREENS.CARD_EDITOR);
    });
  });

  document.querySelectorAll("[data-app-open-card-pool]").forEach(cardPoolBtn => {
    if (cardPoolBtn.dataset.bound === "1") return;
    cardPoolBtn.dataset.bound = "1";
    cardPoolBtn.addEventListener("click", () => {
      if (typeof openCardPoolScreen === "function") openCardPoolScreen();
      else showAppPlaceholder(ARENA_APP_SCREENS.CARD_POOL);
    });
  });

  document.querySelectorAll("[data-app-open-map-editor]").forEach(mapEditorBtn => {
    if (mapEditorBtn.dataset.bound === "1") return;
    mapEditorBtn.dataset.bound = "1";
    mapEditorBtn.addEventListener("click", () => {
      if (typeof openMapEditorScreen === "function") {
        const preferred = typeof mapEditorState !== "undefined" && mapEditorState && mapEditorState.labMapId
          ? mapEditorState.labMapId
          : "map1_starter";
        openMapEditorScreen(preferred);
      }
    });
  });

  document.querySelectorAll("[data-app-open-layout-lab]").forEach(layoutLabBtn => {
    if (layoutLabBtn.dataset.bound === "1") return;
    layoutLabBtn.dataset.bound = "1";
    layoutLabBtn.addEventListener("click", () => {
      if (typeof openMenuLayoutCalibrationLabScreen === "function") openMenuLayoutCalibrationLabScreen({ sourceScreen: currentAppScreen() });
      else showAppPlaceholder(ARENA_APP_SCREENS.OPTIONS);
    });
  });

  const newGameBtn = document.getElementById("mainMenuNewGameBtn");
  if (newGameBtn && newGameBtn.dataset.bound !== "1") {
    newGameBtn.dataset.bound = "1";
    newGameBtn.addEventListener("click", startNewGameFromAppMenu);
  }

  const resumeBtn = document.getElementById("mainMenuResumeBtn");
  if (resumeBtn && resumeBtn.dataset.bound !== "1") {
    resumeBtn.dataset.bound = "1";
    resumeBtn.addEventListener("click", resumeGameFromAppMenu);
  }

  const tutorialBtn = document.getElementById("mainMenuTutorialBtn");
  if (tutorialBtn && tutorialBtn.dataset.bound !== "1") {
    tutorialBtn.dataset.bound = "1";
    tutorialBtn.addEventListener("click", openTutorialScreen);
  }

  document.querySelectorAll("[data-app-placeholder-screen]").forEach(btn => {
    if (btn.disabled || btn.getAttribute("aria-disabled") === "true" || btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => showAppPlaceholder(btn.dataset.appPlaceholderScreen));
  });

  document.querySelectorAll("[data-app-back-menu]").forEach(btn => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", openMainMenu);
  });

  const setupStartBtn = document.getElementById("setupStartGameBtn");
  if (setupStartBtn && setupStartBtn.dataset.bound !== "1") {
    setupStartBtn.dataset.bound = "1";
    setupStartBtn.addEventListener("click", startGameFromSetupScreen);
  }

  const setupBackBtn = document.getElementById("setupBackMenuBtn");
  if (setupBackBtn && setupBackBtn.dataset.bound !== "1") {
    setupBackBtn.dataset.bound = "1";
    setupBackBtn.addEventListener("click", openMainMenu);
  }

  [1, 2, 3, 4].forEach(side => {
    const factionSelect = document.getElementById(`setupP${side}Faction`);
    if (factionSelect && factionSelect.dataset.bound !== "1") {
      factionSelect.dataset.bound = "1";
      factionSelect.addEventListener("change", () => {
        populateSetupCommanderSelectForSide(side);
        refreshSetupDeckSelectorForSide(side);
      });
    }

    const commanderSelect = document.getElementById(`setupP${side}Commander`);
    if (commanderSelect && commanderSelect.dataset.deckBound !== "1") {
      commanderSelect.dataset.deckBound = "1";
      commanderSelect.addEventListener("change", () => refreshSetupDeckSelectorForSide(side));
    }

    const deckModeSelect = document.getElementById(`setupP${side}DeckMode`);
    if (deckModeSelect && deckModeSelect.dataset.deckBound !== "1") {
      deckModeSelect.dataset.deckBound = "1";
      deckModeSelect.addEventListener("change", () => refreshSetupDeckSelectorForSide(side));
    }

    const savedDeckSelect = document.getElementById(`setupP${side}DeckSavedKey`);
    if (savedDeckSelect && savedDeckSelect.dataset.deckBound !== "1") {
      savedDeckSelect.dataset.deckBound = "1";
      savedDeckSelect.addEventListener("change", () => {
        setupApplySelectedDeckIdentity(side);
        refreshSetupDeckSelectorForSide(side);
      });
    }

    const legacyDeckModeSelect = document.getElementById(`p${side}DeckMode`);
    if (legacyDeckModeSelect && legacyDeckModeSelect.dataset.savedDeckBound !== "1") {
      legacyDeckModeSelect.dataset.savedDeckBound = "1";
      legacyDeckModeSelect.addEventListener("change", () => refreshSetupDeckSelectorForSide(side));
    }

    const legacySavedDeckSelect = document.getElementById(`p${side}DeckSavedKey`);
    if (legacySavedDeckSelect && legacySavedDeckSelect.dataset.deckBound !== "1") {
      legacySavedDeckSelect.dataset.deckBound = "1";
      legacySavedDeckSelect.addEventListener("change", () => {
        writeControlValue(`setupP${side}DeckSavedKey`, legacySavedDeckSelect.value || "");
        setupApplySelectedDeckIdentity(side);
        refreshSetupDeckSelectorForSide(side);
      });
    }
  });

  refreshSetupCommanderSelects();
  refreshSetupMapSelector();
  refreshSetupDeckSelectors();

  const setupMapSelect = document.getElementById("setupMapName");
  if (setupMapSelect && setupMapSelect.dataset.bound !== "1") {
    setupMapSelect.dataset.bound = "1";
    setupMapSelect.addEventListener("change", refreshSetupForSelectedMap);
  }

  const topNewGame = document.getElementById("newGameBtn");
  if (topNewGame && topNewGame.dataset.appShellPatched !== "1") {
    topNewGame.dataset.appShellPatched = "1";
    topNewGame.addEventListener("click", event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openNewGameSetupScreen();
    }, true);
  }

  const returnMenuBtn = document.getElementById("returnMainMenuBtn");
  if (returnMenuBtn && returnMenuBtn.dataset.bound !== "1") {
    returnMenuBtn.dataset.bound = "1";
    returnMenuBtn.addEventListener("click", openMainMenu);
  }

  refreshSetupDeckSelectors();
  setAppScreen(ARENA_APP_SCREENS.MAIN_MENU);
}
