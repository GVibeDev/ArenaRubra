"use strict";

// Arena Rubra — F9U3 Control Center.
// App-shell e diagnostica soltanto: nessuna modifica a regole, carte, deck,
// mappe, IA, targeting o schema telemetrico F9Q3e1-2.

const CONTROL_CENTER_SCHEMA_F9U3 = "F9U3-1";
const CONTROL_CENTER_SETTINGS_KEY_F9U3 = "controlCenter";
const CONTROL_CENTER_TELEMETRY_SCHEMA_FALLBACK = "F9Q3e1-2";
const CONTROL_CENTER_DIAGNOSTIC_ERRORS = [];
const CONTROL_CENTER_MAX_CAPTURED_ERRORS = 80;

const CONTROL_CENTER_PANEL_LABELS = Object.freeze({
  mapArchive: "Archivio mappe",
  statistics: "Statistiche",
  history: "Cronologia",
  telemetry: "Telemetria",
  log: "Log",
  version: "Versione",
  settings: "Impostazioni",
  debug: "Debug",
  transfer: "Import / Export"
});

const controlCenterStateF9U3 = {
  initialized: false,
  activePanel: "",
  storageEstimate: null,
  lastDiagnostics: null,
  captureInstalled: false,
  developerModeOverride: null,
  ready: false,
  deferredRefreshTimer: null
};

function controlCenterEscape(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function controlCenterClone(value) {
  if (value == null) return value;
  try { return structuredClone(value); } catch (_) {}
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
}

function controlCenterFormatBytes(value) {
  const bytes = Math.max(0, Number(value) || 0);
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  const digits = size >= 100 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(digits)} ${units[index]}`;
}

function controlCenterFormatDate(value, withTime = true) {
  const text = String(value || "");
  if (!text) return "—";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return controlCenterEscape(text.slice(0, withTime ? 19 : 10));
  try {
    return new Intl.DateTimeFormat("it-IT", {
      dateStyle: "short",
      ...(withTime ? { timeStyle: "short" } : {})
    }).format(date);
  } catch (_) {
    return text.slice(0, withTime ? 19 : 10).replace("T", " ");
  }
}

function controlCenterSafeFilename(value) {
  const text = String(value || "arena-rubra")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return text || "arena-rubra";
}

function controlCenterSetText(id, value) {
  if (typeof document === "undefined") return;
  const element = document.getElementById(id);
  if (element) element.textContent = value == null ? "" : String(value);
}

function controlCenterSetTone(id, tone) {
  if (typeof document === "undefined") return;
  const element = document.getElementById(id);
  if (element) element.dataset.tone = tone || "neutral";
}

function controlCenterKnownStorageKeys() {
  if (typeof ARENA_DATA_PATHS !== "undefined" && ARENA_DATA_PATHS) return Object.keys(ARENA_DATA_PATHS);
  return [
    "arenaRubra.customCards.v1",
    "arenaRubraF9H3SavedDecksV1",
    "arenaRubra.maps.v1",
    "arenaRubra.matchupStats.v1",
    "arenaRubra.matchHistory.v1",
    "arenaRubra.settings.v1",
    "arenaRubra.tutorial.v1",
    "arenaRubra.mapSkin.v1",
    "arenaRubra.tokenGraphicsMode.v1",
    "arenaRubra.rendererTextCalibration.v2",
    "arenaRubra.menuLayoutCalibration.v1"
  ];
}

function controlCenterReadStorageEntries() {
  const entries = {};
  for (const key of controlCenterKnownStorageKeys()) {
    let value = null;
    try {
      value = typeof arenaStorageReadJson === "function" ? arenaStorageReadJson(key, null) : null;
    } catch (_) {
      value = null;
    }
    if (value != null) entries[key] = controlCenterClone(value);
  }
  return entries;
}

function controlCenterApproximateStorageBytes() {
  try {
    const payload = JSON.stringify(controlCenterReadStorageEntries());
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(payload).byteLength;
    return payload.length * 2;
  } catch (_) {
    return 0;
  }
}

async function controlCenterReadStorageEstimate() {
  const approximate = controlCenterApproximateStorageBytes();
  let estimate = null;
  try {
    if (typeof navigator !== "undefined" && navigator.storage && typeof navigator.storage.estimate === "function") {
      estimate = await navigator.storage.estimate();
    }
  } catch (_) {
    estimate = null;
  }
  const usage = Number(estimate && estimate.usage);
  const quota = Number(estimate && estimate.quota);
  controlCenterStateF9U3.storageEstimate = {
    usage: Number.isFinite(usage) && usage >= 0 ? usage : approximate,
    quota: Number.isFinite(quota) && quota > 0 ? quota : null,
    approximate,
    source: Number.isFinite(usage) ? "navigator.storage" : "archive-json-estimate"
  };
  controlCenterRenderStorageMetric();
  return controlCenterStateF9U3.storageEstimate;
}

function controlCenterRenderStorageMetric() {
  const metric = controlCenterStateF9U3.storageEstimate;
  if (!metric) {
    controlCenterSetText("controlCenterStorageSpace", "Calcolo…");
    controlCenterSetText("controlCenterStorageSpaceMeta", "Stima archivio in corso");
    return;
  }
  const usageLabel = controlCenterFormatBytes(metric.usage);
  const quotaLabel = metric.quota ? controlCenterFormatBytes(metric.quota) : "quota non esposta";
  controlCenterSetText("controlCenterStorageSpace", usageLabel);
  controlCenterSetText("controlCenterStorageSpaceMeta", metric.quota ? `${usageLabel} / ${quotaLabel}` : `${usageLabel} · ${quotaLabel}`);
  controlCenterSetTone("controlCenterStorageSpaceCard", "good");
}

function controlCenterOfficialDeckCount() {
  try {
    if (typeof BUILTIN_DECKS !== "undefined" && BUILTIN_DECKS) return Object.keys(BUILTIN_DECKS).length;
    if (typeof BUILTIN_DECK_EXPORT !== "undefined" && BUILTIN_DECK_EXPORT && BUILTIN_DECK_EXPORT.decks) return Object.keys(BUILTIN_DECK_EXPORT.decks).length;
  } catch (_) {}
  return 0;
}

function controlCenterOfficialMaps() {
  try {
    if (typeof getBuiltinMapDefinitions === "function") {
      return getBuiltinMapDefinitions().filter(definition => definition && definition.official !== false && definition.enabled !== false);
    }
    if (typeof getAvailableMapDefinitions === "function") {
      return getAvailableMapDefinitions().filter(definition => definition && definition.official === true);
    }
  } catch (_) {}
  return [];
}

function controlCenterCustomDeckCount() {
  try {
    const store = typeof arenaStorageReadCustomDecks === "function" ? arenaStorageReadCustomDecks() : {};
    return store && typeof store === "object" ? Object.keys(store).length : 0;
  } catch (_) { return 0; }
}

function controlCenterCustomMapCount() {
  try { return typeof getCustomMapDefinitions === "function" ? getCustomMapDefinitions().length : 0; }
  catch (_) { return 0; }
}

function controlCenterCustomCardCount() {
  try { return typeof cardEditorReadCustomCards === "function" ? cardEditorReadCustomCards().length : 0; }
  catch (_) { return 0; }
}

function controlCenterLatestHistoryRecord() {
  try {
    const history = typeof arenaStorageReadMatchHistory === "function" ? arenaStorageReadMatchHistory() : [];
    return Array.isArray(history) && history.length ? history[0] : null;
  } catch (_) {
    return null;
  }
}

function controlCenterTelemetrySchema() {
  try {
    if (typeof state !== "undefined" && state && state.matchTelemetry && state.matchTelemetry.schemaVersion) return String(state.matchTelemetry.schemaVersion);
    const latest = controlCenterLatestHistoryRecord();
    if (latest && latest.matchTelemetry && latest.matchTelemetry.schemaVersion) return String(latest.matchTelemetry.schemaVersion);
  } catch (_) {}
  return CONTROL_CENTER_TELEMETRY_SCHEMA_FALLBACK;
}

function controlCenterStorageDiagnostics() {
  try {
    return typeof arenaStorageBackendDiagnostics === "function"
      ? arenaStorageBackendDiagnostics()
      : { backendName: "unavailable", initialized: false, pendingWrites: 0, error: "Storage diagnostics non disponibili" };
  } catch (error) {
    return { backendName: "error", initialized: false, pendingWrites: 0, error: String(error && error.message || error) };
  }
}

function controlCenterCaptureDiagnostic(kind, message, details = {}) {
  const entry = {
    kind: String(kind || "runtime"),
    message: String(message || "Errore senza messaggio"),
    at: new Date().toISOString(),
    details: controlCenterClone(details || {})
  };
  CONTROL_CENTER_DIAGNOSTIC_ERRORS.unshift(entry);
  if (CONTROL_CENTER_DIAGNOSTIC_ERRORS.length > CONTROL_CENTER_MAX_CAPTURED_ERRORS) CONTROL_CENTER_DIAGNOSTIC_ERRORS.length = CONTROL_CENTER_MAX_CAPTURED_ERRORS;
  return entry;
}

function controlCenterInstallDiagnosticCapture() {
  if (controlCenterStateF9U3.captureInstalled || typeof window === "undefined") return;
  controlCenterStateF9U3.captureInstalled = true;
  window.addEventListener("error", event => {
    controlCenterCaptureDiagnostic("window.error", event && event.message ? event.message : "Errore runtime", {
      filename: event && event.filename || "",
      line: event && event.lineno || 0,
      column: event && event.colno || 0
    });
    controlCenterRefreshMetrics();
  });
  window.addEventListener("unhandledrejection", event => {
    const reason = event && event.reason;
    controlCenterCaptureDiagnostic("unhandledrejection", reason && reason.message ? reason.message : String(reason || "Promise rifiutata"));
    controlCenterRefreshMetrics();
  });
}

function controlCenterRunDiagnostics(options = {}) {
  const source = options.source || "control-center";
  let precheck = null;
  try {
    precheck = typeof runPrecheck === "function"
      ? runPrecheck({ quiet: true, source })
      : { ok: false, problems: ["runPrecheck non disponibile"], warnings: [], info: [] };
  } catch (error) {
    precheck = { ok: false, problems: [`Precheck exception: ${error && error.message ? error.message : error}`], warnings: [], info: [] };
  }
  const storage = controlCenterStorageDiagnostics();
  const runtimeErrors = CONTROL_CENTER_DIAGNOSTIC_ERRORS.map(controlCenterClone);
  const storageErrors = [];
  const storageWarnings = [];
  if (storage && storage.error) storageErrors.push(String(storage.error));
  if (storage && storage.migration && Array.isArray(storage.migration.issues)) {
    storage.migration.issues.forEach(issue => {
      if (issue) storageWarnings.push(String(issue));
    });
  }
  const report = {
    schemaVersion: CONTROL_CENTER_SCHEMA_F9U3,
    at: new Date().toISOString(),
    source,
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    telemetrySchema: controlCenterTelemetrySchema(),
    precheck: controlCenterClone(precheck),
    storage: controlCenterClone(storage),
    runtimeErrors,
    storageErrors,
    storageWarnings,
    counts: {
      officialDecks: controlCenterOfficialDeckCount(),
      officialMaps: controlCenterOfficialMaps().length,
      customDecks: controlCenterCustomDeckCount(),
      customMaps: controlCenterCustomMapCount(),
      customCards: controlCenterCustomCardCount()
    }
  };
  report.errorCount = (precheck && Array.isArray(precheck.problems) ? precheck.problems.length : 0) + runtimeErrors.length + storageErrors.filter(Boolean).length;
  report.warningCount = (precheck && Array.isArray(precheck.warnings) ? precheck.warnings.length : 0) + storageWarnings.filter(Boolean).length;
  report.ok = report.errorCount === 0;
  controlCenterStateF9U3.lastDiagnostics = report;
  return report;
}

function controlCenterDiagnosticStatus() {
  if (controlCenterStateF9U3.lastDiagnostics) return controlCenterStateF9U3.lastDiagnostics;
  return {
    schemaVersion: CONTROL_CENTER_SCHEMA_F9U3,
    at: new Date().toISOString(),
    source: "control-center-pending",
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    telemetrySchema: controlCenterTelemetrySchema(),
    precheck: { ok: true, problems: [], warnings: [], info: [] },
    storage: controlCenterStorageDiagnostics(),
    runtimeErrors: CONTROL_CENTER_DIAGNOSTIC_ERRORS.map(controlCenterClone),
    storageErrors: [],
    storageWarnings: [],
    errorCount: CONTROL_CENTER_DIAGNOSTIC_ERRORS.length,
    warningCount: 0,
    ok: CONTROL_CENTER_DIAGNOSTIC_ERRORS.length === 0,
    pending: true
  };
}

function controlCenterDeveloperDefault() {
  try {
    const channel = typeof BUILD_INFO !== "undefined" && BUILD_INFO ? String(BUILD_INFO.buildChannel || "") : "";
    return /candidate|dev|debug|lab|alpha/i.test(channel);
  } catch (_) {
    return true;
  }
}

function controlCenterReadDeveloperMode() {
  if (typeof controlCenterStateF9U3.developerModeOverride === "boolean") return controlCenterStateF9U3.developerModeOverride;
  try {
    const settings = typeof arenaStorageReadSettings === "function" ? arenaStorageReadSettings() : {};
    const cfg = settings && settings[CONTROL_CENTER_SETTINGS_KEY_F9U3] && typeof settings[CONTROL_CENTER_SETTINGS_KEY_F9U3] === "object"
      ? settings[CONTROL_CENTER_SETTINGS_KEY_F9U3]
      : {};
    if (typeof cfg.developerMode === "boolean") return cfg.developerMode;
  } catch (_) {}
  return controlCenterDeveloperDefault();
}

function controlCenterSetDeveloperMode(enabled, options = {}) {
  const value = Boolean(enabled);
  controlCenterStateF9U3.developerModeOverride = value;
  if (options.persist !== false) {
    try {
      if (typeof arenaStorageReadSettings === "function" && typeof arenaStorageWriteSettings === "function") {
        const settings = arenaStorageReadSettings();
        const next = settings && typeof settings === "object" && !Array.isArray(settings) ? { ...settings } : {};
        next[CONTROL_CENTER_SETTINGS_KEY_F9U3] = {
          ...(next[CONTROL_CENTER_SETTINGS_KEY_F9U3] && typeof next[CONTROL_CENTER_SETTINGS_KEY_F9U3] === "object" ? next[CONTROL_CENTER_SETTINGS_KEY_F9U3] : {}),
          developerMode: value
        };
        arenaStorageWriteSettings(next);
      }
    } catch (_) {}
  }
  controlCenterApplyDeveloperMode();
  return value;
}

function controlCenterApplyDeveloperMode() {
  if (typeof document === "undefined") return;
  const enabled = controlCenterReadDeveloperMode();
  document.documentElement.dataset.arenaDeveloperMode = enabled ? "on" : "off";
  document.querySelectorAll("[data-control-center-dev-only]").forEach(element => {
    element.hidden = !enabled;
    element.setAttribute("aria-hidden", enabled ? "false" : "true");
  });
  document.querySelectorAll("[data-dev-only]").forEach(element => {
    element.hidden = !enabled;
    element.setAttribute("aria-hidden", enabled ? "false" : "true");
  });
  const checkbox = document.getElementById("controlCenterDeveloperModeToggle");
  if (checkbox) checkbox.checked = enabled;
}

function controlCenterLastMatchLabel(record) {
  if (!record) return { value: "Nessun match", meta: "Lo storico è ancora vuoto", tone: "neutral" };
  const matchup = [record.p1Faction, record.p2Faction].filter(Boolean).join(" vs ") || `${record.playerCount || 2} giocatori`;
  const winner = record.winnerFaction || "Esito non registrato";
  const round = Number(record.round || 0);
  return {
    value: `${winner} · R${round || "—"}`,
    meta: `${matchup} · ${controlCenterFormatDate(record.at || record.recordedAt)}`,
    tone: "good"
  };
}

function controlCenterRefreshMetrics() {
  if (typeof document === "undefined") return;
  const diagnostics = controlCenterDiagnosticStatus();
  const officialDecks = controlCenterOfficialDeckCount();
  const officialMaps = controlCenterOfficialMaps().length;
  const latest = controlCenterLastMatchLabel(controlCenterLatestHistoryRecord());

  controlCenterSetText("controlCenterVersion", typeof BUILD_INFO !== "undefined" && BUILD_INFO ? BUILD_INFO.version : "unknown");
  controlCenterSetText("controlCenterVersionMeta", typeof BUILD_INFO !== "undefined" && BUILD_INFO ? BUILD_INFO.buildName : "Build metadata non disponibili");
  controlCenterSetText("controlCenterLogicBaseline", typeof BUILD_INFO !== "undefined" && BUILD_INFO ? BUILD_INFO.logicBaseline : "unknown");
  controlCenterSetText("controlCenterLogicBaselineMeta", "Baseline logica dichiarata");
  controlCenterSetText("controlCenterTelemetrySchema", controlCenterTelemetrySchema());
  controlCenterSetText("controlCenterTelemetrySchemaMeta", "Schema runtime e storico");
  controlCenterSetText("controlCenterOfficialDecks", officialDecks);
  controlCenterSetText("controlCenterOfficialDecksMeta", `${controlCenterCustomDeckCount()} deck custom locali`);
  controlCenterSetText("controlCenterOfficialMaps", officialMaps);
  controlCenterSetText("controlCenterOfficialMapsMeta", `${controlCenterCustomMapCount()} mappe custom locali`);
  controlCenterSetText("controlCenterLastMatch", latest.value);
  controlCenterSetText("controlCenterLastMatchMeta", latest.meta);
  controlCenterSetTone("controlCenterLastMatchCard", latest.tone);
  controlCenterSetText("controlCenterDiagnosticErrors", diagnostics.errorCount ? `${diagnostics.errorCount} errori` : "Nessun errore");
  controlCenterSetText("controlCenterDiagnosticErrorsMeta", `${diagnostics.warningCount || 0} avvisi · ${CONTROL_CENTER_DIAGNOSTIC_ERRORS.length} runtime`);
  controlCenterSetTone("controlCenterDiagnosticCard", diagnostics.errorCount ? "bad" : diagnostics.warningCount ? "warn" : "good");
  controlCenterRenderStorageMetric();
  controlCenterApplyDeveloperMode();
  if (typeof refreshMainMenuResumeState === "function") refreshMainMenuResumeState();
}

function controlCenterRuntimeReady() {
  if (typeof window === "undefined") return true;
  return typeof cameraFocusHex === "function"
    && typeof initializeCameraInteraction === "function"
    && typeof boardRenderReplaceChildrenCompat === "function"
    && typeof requestInGameHandThumbnailRender === "function"
    && typeof apkM4SchedulePanelLayout === "function";
}

function controlCenterRefresh() {
  if (!controlCenterStateF9U3.ready) {
    controlCenterRefreshMetrics();
    if (controlCenterRuntimeReady()) controlCenterStateF9U3.ready = true;
    else {
      if (controlCenterStateF9U3.deferredRefreshTimer == null && typeof setTimeout === "function") {
        controlCenterStateF9U3.deferredRefreshTimer = setTimeout(() => {
          controlCenterStateF9U3.deferredRefreshTimer = null;
          controlCenterRefresh();
        }, 50);
      }
      return;
    }
  }
  controlCenterStateF9U3.lastDiagnostics = controlCenterRunDiagnostics({ source: "control-center-refresh" });
  controlCenterRefreshMetrics();
  Promise.resolve(controlCenterReadStorageEstimate()).catch(() => {});
  if (controlCenterStateF9U3.activePanel) controlCenterRenderActivePanel();
}

function controlCenterPanelElement() {
  return typeof document !== "undefined" ? document.getElementById("controlCenterPanel") : null;
}

function controlCenterPanelBody() {
  return typeof document !== "undefined" ? document.getElementById("controlCenterPanelBody") : null;
}

function controlCenterOpenPanel(panelKey) {
  const key = String(panelKey || "");
  if (!CONTROL_CENTER_PANEL_LABELS[key]) return false;
  if (key === "debug" && !controlCenterReadDeveloperMode()) {
    controlCenterOpenPanel("settings");
    return false;
  }
  controlCenterStateF9U3.activePanel = key;
  const panel = controlCenterPanelElement();
  if (panel) {
    panel.hidden = false;
    panel.classList.add("isOpen");
    panel.setAttribute("aria-hidden", "false");
  }
  controlCenterSetText("controlCenterPanelTitle", CONTROL_CENTER_PANEL_LABELS[key]);
  controlCenterRenderActivePanel();
  const close = typeof document !== "undefined" ? document.getElementById("controlCenterPanelCloseBtn") : null;
  if (close && typeof close.focus === "function") close.focus({ preventScroll: true });
  return true;
}

function controlCenterClosePanel() {
  const panel = controlCenterPanelElement();
  if (panel) {
    panel.hidden = true;
    panel.classList.remove("isOpen");
    panel.setAttribute("aria-hidden", "true");
  }
  controlCenterStateF9U3.activePanel = "";
  controlCenterRefreshMetrics();
}

function controlCenterMetricCard(label, value, meta = "", tone = "neutral") {
  return `<article class="controlCenterMiniMetric" data-tone="${controlCenterEscape(tone)}"><small>${controlCenterEscape(label)}</small><strong>${controlCenterEscape(value)}</strong><span>${controlCenterEscape(meta)}</span></article>`;
}

function controlCenterMapsHtml() {
  const definitions = typeof getAvailableMapDefinitions === "function"
    ? getAvailableMapDefinitions({ includeInvalid: true })
    : [];
  const rows = definitions.map(definition => {
    const validation = typeof validateMapDefinition === "function" ? validateMapDefinition(definition) : { valid: true, errors: [], warnings: [] };
    const type = definition.official ? "Ufficiale" : "Custom";
    const status = validation.valid ? (validation.warnings && validation.warnings.length ? `${validation.warnings.length} avvisi` : "Valida") : `${validation.errors ? validation.errors.length : 1} errori`;
    const central = typeof getCentralStrategicPoint === "function" ? getCentralStrategicPoint(definition) : null;
    return `<tr data-control-center-map-row="${controlCenterEscape(definition.id)}">
      <td><strong>${controlCenterEscape(definition.name || definition.id)}</strong><small><code>${controlCenterEscape(definition.id)}</code></small></td>
      <td>${controlCenterEscape(type)}</td>
      <td>${Number(definition.playerCount || 2)}G</td>
      <td>${definition.geometry && Array.isArray(definition.geometry.cells) ? definition.geometry.cells.length : 0}</td>
      <td>${Array.isArray(definition.strategicPoints) ? definition.strategicPoints.length : 0}</td>
      <td>${central && Array.isArray(central.coord) ? `[${central.coord.join(",")}]` : "—"}</td>
      <td data-tone="${validation.valid ? (validation.warnings && validation.warnings.length ? "warn" : "good") : "bad"}">${controlCenterEscape(status)}</td>
      <td class="controlCenterTableActions">
        <button class="primary compact" type="button" data-control-center-map-setup="${controlCenterEscape(definition.id)}">Gioca</button>
        <button class="ghost compact" type="button" data-control-center-map-edit="${controlCenterEscape(definition.id)}">${definition.official ? "Copia in Editor" : "Modifica"}</button>
      </td>
    </tr>`;
  }).join("");
  const official = definitions.filter(item => item && item.official).length;
  const custom = definitions.filter(item => item && !item.official).length;
  return `
    <div class="controlCenterPanelLead">
      <div><strong>Mappe disponibili</strong><p>Consulta geometria, giocatori, PS centrale e validazione; da qui puoi avviare il Setup o aprire una copia modificabile nell’Editor.</p></div>
      <button class="primary" type="button" data-app-open-map-editor>Apri Map Editor</button>
    </div>
    <div class="controlCenterMiniMetrics">
      ${controlCenterMetricCard("Ufficiali", official, "Mappe integrate attive", "good")}
      ${controlCenterMetricCard("Custom", custom, "Mappe archiviate localmente", custom ? "good" : "neutral")}
      ${controlCenterMetricCard("Totale", definitions.length, "Valide e non valide visibili", "neutral")}
    </div>
    <div class="controlCenterTableWrap"><table class="controlCenterTable">
      <thead><tr><th>Mappa</th><th>Tipo</th><th>Gioc.</th><th>Celle</th><th>PS</th><th>Centro</th><th>Stato</th><th>Azioni</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="8">Nessuna mappa disponibile.</td></tr>`}</tbody>
    </table></div>`;
}

function controlCenterStatisticsHtml() {
  const items = typeof arenaStorageReadMatchupStats === "function" ? arenaStorageReadMatchupStats() : [];
  const safeItems = Array.isArray(items) ? items : [];
  const wins = {};
  let roundTotal = 0;
  for (const item of safeItems) {
    const winner = item && item.winnerFaction ? String(item.winnerFaction) : "Pareggio";
    wins[winner] = (wins[winner] || 0) + 1;
    roundTotal += Number(item && item.round || 0);
  }
  const leaders = Object.entries(wins).sort((a, b) => b[1] - a[1]);
  const average = safeItems.length ? (roundTotal / safeItems.length).toFixed(1) : "—";
  const rows = safeItems.slice(0, 20).map(item => `<tr>
    <td>${controlCenterFormatDate(item.at)}</td>
    <td>${controlCenterEscape(item.p1Faction || "—")} vs ${controlCenterEscape(item.p2Faction || "—")}</td>
    <td>${controlCenterEscape(item.winnerFaction || "—")}</td>
    <td>${controlCenterEscape(item.winType || "—")}</td>
    <td>${Number(item.round || 0)}</td>
    <td>${controlCenterEscape(item.mapName || item.mapId || "—")}</td>
  </tr>`).join("");
  return `
    <div class="controlCenterPanelLead">
      <div><strong>Registro matchup</strong><p>Vista sintetica dei record competitivi persistenti. Tutorial e Match Lab restano esclusi dal registro.</p></div>
      <div class="controlCenterInlineActions">
        <button class="ghost" type="button" data-control-center-action="copy-stats">Copia JSON</button>
        <button class="primary" type="button" data-control-center-action="download-stats">Esporta JSON</button>
      </div>
    </div>
    <div class="controlCenterMiniMetrics">
      ${controlCenterMetricCard("Partite", safeItems.length, "Record matchup", safeItems.length ? "good" : "neutral")}
      ${controlCenterMetricCard("Round medi", average, "Su tutti i record", "neutral")}
      ${controlCenterMetricCard("Più vittorie", leaders[0] ? `${leaders[0][0]} · ${leaders[0][1]}` : "—", leaders.length ? `${leaders.length} esiti distinti` : "Nessun dato", "neutral")}
    </div>
    <div class="controlCenterTableWrap"><table class="controlCenterTable">
      <thead><tr><th>Data</th><th>Matchup</th><th>Vincitore</th><th>Esito</th><th>Round</th><th>Mappa</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="6">Nessuna statistica registrata.</td></tr>`}</tbody>
    </table></div>`;
}

function controlCenterHistoryHtml() {
  const items = typeof arenaStorageReadMatchHistory === "function" ? arenaStorageReadMatchHistory() : [];
  const safeItems = Array.isArray(items) ? items : [];
  const rows = safeItems.slice(0, 30).map(item => {
    const players = item && item.playerIds && item.players
      ? item.playerIds.map(side => item.players[side] && item.players[side].faction).filter(Boolean).join(" · ")
      : [item.p1Faction, item.p2Faction].filter(Boolean).join(" vs ");
    return `<tr>
      <td>${controlCenterFormatDate(item.at || item.recordedAt)}</td>
      <td>${controlCenterEscape(players || "—")}</td>
      <td>${controlCenterEscape(item.winnerFaction || "—")}</td>
      <td>${controlCenterEscape(item.winType || "—")}</td>
      <td>${Number(item.round || 0)}</td>
      <td>${controlCenterEscape(item.mapName || item.mapId || item.map || "—")}</td>
      <td>${item.matchTelemetry && item.matchTelemetry.schemaVersion ? controlCenterEscape(item.matchTelemetry.schemaVersion) : "—"}</td>
    </tr>`;
  }).join("");
  const latest = safeItems[0];
  return `
    <div class="controlCenterPanelLead">
      <div><strong>Storico partite</strong><p>Archivio completo degli esiti con setup, statistiche finali, attribuzione e telemetria quando disponibili.</p></div>
      <div class="controlCenterInlineActions">
        <button class="ghost" type="button" data-control-center-action="copy-history">Copia JSON</button>
        <button class="primary" type="button" data-control-center-action="download-history">Esporta JSON</button>
      </div>
    </div>
    <div class="controlCenterMiniMetrics">
      ${controlCenterMetricCard("Record", safeItems.length, "Limite archivio 500", safeItems.length ? "good" : "neutral")}
      ${controlCenterMetricCard("Ultimo match", latest ? controlCenterFormatDate(latest.at || latest.recordedAt) : "—", latest ? (latest.winnerFaction || "Esito registrato") : "Nessun dato", "neutral")}
      ${controlCenterMetricCard("Schema telemetrico", controlCenterTelemetrySchema(), "Ultimo schema disponibile", "neutral")}
    </div>
    <div class="controlCenterTableWrap"><table class="controlCenterTable">
      <thead><tr><th>Data</th><th>Giocatori</th><th>Vincitore</th><th>Esito</th><th>Round</th><th>Mappa</th><th>Telemetria</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="7">Nessuna partita nello storico.</td></tr>`}</tbody>
    </table></div>`;
}

function controlCenterTelemetrySource() {
  try {
    if (typeof state !== "undefined" && state && state.matchTelemetry) {
      const snapshot = typeof currentMatchTelemetrySnapshot === "function" ? currentMatchTelemetrySnapshot() : controlCenterClone(state.matchTelemetry);
      return { source: "Partita attiva", telemetry: snapshot, record: null };
    }
    const latest = controlCenterLatestHistoryRecord();
    if (latest && latest.matchTelemetry) return { source: "Ultimo match registrato", telemetry: controlCenterClone(latest.matchTelemetry), record: latest };
  } catch (_) {}
  return { source: "Nessuna fonte", telemetry: null, record: null };
}

function controlCenterTelemetryHtml() {
  const source = controlCenterTelemetrySource();
  const telemetry = source.telemetry;
  if (!telemetry) {
    return `<div class="controlCenterEmptyState"><strong>Telemetria non disponibile</strong><p>Avvia o completa una partita per inizializzare lo schema ${CONTROL_CENTER_TELEMETRY_SCHEMA_FALLBACK}.</p></div>`;
  }
  const players = telemetry.players && typeof telemetry.players === "object" ? Object.entries(telemetry.players) : [];
  const rows = players.map(([side, player]) => {
    const economy = player.economy || {};
    const cards = player.cards || {};
    const field = player.field || {};
    const mission = player.mission || {};
    return `<tr>
      <td>G${controlCenterEscape(side)}</td>
      <td>${controlCenterEscape(player.faction || "—")}</td>
      <td>${controlCenterEscape(player.deck && player.deck.name || "—")}</td>
      <td>${Number(economy.gainedTotal || 0)}</td>
      <td>${Number(economy.spentTotal || 0)}</td>
      <td>${Number(cards.drawn || 0)}</td>
      <td>${Number(cards.played || 0)}</td>
      <td>${field.pivotDeployedRound == null ? "—" : Number(field.pivotDeployedRound)}</td>
      <td>${mission.completionRound == null ? "—" : Number(mission.completionRound)}</td>
    </tr>`;
  }).join("");
  const final = telemetry.final || {};
  const rng = telemetry.rng || {};
  return `
    <div class="controlCenterPanelLead">
      <div><strong>${controlCenterEscape(source.source)}</strong><p>Snapshot integrale dello schema ${controlCenterEscape(telemetry.schemaVersion || CONTROL_CENTER_TELEMETRY_SCHEMA_FALLBACK)}.</p></div>
      <div class="controlCenterInlineActions">
        <button class="ghost" type="button" data-control-center-action="copy-telemetry">Copia JSON</button>
        <button class="primary" type="button" data-control-center-action="download-telemetry">Esporta JSON</button>
      </div>
    </div>
    <div class="controlCenterMiniMetrics">
      ${controlCenterMetricCard("Schema", telemetry.schemaVersion || CONTROL_CENTER_TELEMETRY_SCHEMA_FALLBACK, "Versione record", "good")}
      ${controlCenterMetricCard("Seed", rng.seed || "—", `${rng.algorithm || "RNG"} · ${Number(rng.calls || 0)} chiamate`, "neutral")}
      ${controlCenterMetricCard("Esito", final.winnerFaction || "In corso", final.round != null ? `Round ${final.round}` : "Partita non conclusa", final.winnerFaction ? "good" : "neutral")}
    </div>
    <div class="controlCenterTableWrap"><table class="controlCenterTable">
      <thead><tr><th>G</th><th>Fazione</th><th>Deck</th><th>ENE +</th><th>ENE spesa</th><th>Pesca</th><th>Giocate</th><th>Pivot R</th><th>Missione R</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="9">Nessun giocatore telemetrico disponibile.</td></tr>`}</tbody>
    </table></div>
    <details class="controlCenterJsonDetails"><summary>Anteprima JSON</summary><pre>${controlCenterEscape(JSON.stringify(telemetry, null, 2).slice(0, 18000))}</pre></details>`;
}

function controlCenterLogHtml() {
  const events = typeof state !== "undefined" && state && Array.isArray(state.events) ? state.events : [];
  const rows = events.slice(0, 200).map(event => `<tr>
    <td>${event && event.seq != null ? Number(event.seq) : "—"}</td>
    <td>${controlCenterFormatDate(event && event.at)}</td>
    <td><code>${controlCenterEscape(event && event.type || "LOG_MESSAGE")}</code></td>
    <td>${controlCenterEscape(event && (event.message || (typeof gameEventToLogText === "function" ? gameEventToLogText(event) : "")) || "—")}</td>
  </tr>`).join("");
  return `
    <div class="controlCenterPanelLead">
      <div><strong>Log partita attiva</strong><p>Eventi tipizzati completi nello stato runtime; la tabella mostra gli ultimi 200 eventi senza troncare gli export.</p></div>
      <div class="controlCenterInlineActions">
        <button class="ghost" type="button" data-control-center-action="copy-log">Copia TXT</button>
        <button class="primary" type="button" data-control-center-action="download-log">Esporta TXT</button>
      </div>
    </div>
    <div class="controlCenterMiniMetrics">
      ${controlCenterMetricCard("Eventi", events.length, "Partita attiva", events.length ? "good" : "neutral")}
      ${controlCenterMetricCard("Sequenza", typeof state !== "undefined" && state ? Number(state.eventSeq || 0) : 0, "Ultimo indice evento", "neutral")}
      ${controlCenterMetricCard("Match", typeof state !== "undefined" && state ? (state.matchId || "Attivo") : "Nessuno", typeof state !== "undefined" && state ? `Round ${Number(state.turn || 0)}` : "Avvia una partita", "neutral")}
    </div>
    <div class="controlCenterTableWrap"><table class="controlCenterTable controlCenterLogTable">
      <thead><tr><th>#</th><th>Data</th><th>Tipo</th><th>Messaggio</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="4">Nessun log runtime: non è presente una partita attiva.</td></tr>`}</tbody>
    </table></div>`;
}

function controlCenterVersionHtml() {
  const build = typeof BUILD_INFO !== "undefined" && BUILD_INFO ? BUILD_INFO : {};
  const rows = [
    ["Applicazione", build.appName || "Arena Rubra"],
    ["Stadio", build.stage || "—"],
    ["Versione completa", build.version || "unknown"],
    ["Nome build", build.buildName || "—"],
    ["Data build", build.buildDate || "—"],
    ["Canale", build.buildChannel || "—"],
    ["Baseline logica", build.logicBaseline || "—"],
    ["Schema Control Center", CONTROL_CENTER_SCHEMA_F9U3],
    ["Schema telemetrico", controlCenterTelemetrySchema()]
  ].map(([label, value]) => `<tr><th>${controlCenterEscape(label)}</th><td>${controlCenterEscape(value)}</td></tr>`).join("");
  return `
    <div class="controlCenterPanelLead">
      <div><strong>Identità della build</strong><p>Metadati letti dalla fonte unica <code>BUILD_INFO</code>; nessuna etichetta duplicata nel Centro di controllo.</p></div>
      <button class="primary" type="button" data-control-center-action="copy-build">Copia metadati</button>
    </div>
    <div class="controlCenterTableWrap"><table class="controlCenterTable controlCenterKeyValueTable"><tbody>${rows}</tbody></table></div>
    <article class="controlCenterNotesBox"><strong>Note build</strong><p>${controlCenterEscape(build.notes || "Nessuna nota disponibile.")}</p></article>`;
}

function controlCenterSettingsHtml() {
  const developer = controlCenterReadDeveloperMode();
  return `
    <div class="controlCenterPanelLead">
      <div><strong>Preferenze applicazione</strong><p>Le impostazioni vengono salvate nell’archivio locale e riutilizzano i runtime audio, SFX, animazioni carte e FX miniature già esistenti.</p></div>
    </div>
    <div class="controlCenterSettingsGrid">
      <section class="controlCenterSettingsCard" data-arena-music-control>
        <h3>Audio</h3>
        <button class="ghost" type="button" data-arena-music-toggle aria-pressed="true">Musica ON</button>
        <label><span>Volume musica</span><input type="range" min="0" max="100" step="1" data-arena-music-volume><output data-arena-music-volume-output>65%</output></label>
        <button class="ghost" type="button" data-arena-sfx-toggle aria-pressed="true">Effetti ON</button>
        <label><span>Volume effetti</span><input type="range" min="0" max="100" step="1" data-arena-sfx-volume><output data-arena-sfx-volume-output>38%</output></label>
      </section>
      <section class="controlCenterSettingsCard">
        <h3>Presentazione</h3>
        <button class="ghost" type="button" data-arena-card-motion-toggle aria-pressed="false">Carte animate ON</button>
        <button class="ghost" type="button" data-arena-token-fx-toggle aria-pressed="true">Miniature FX ON</button>
        <p>Le preferenze di movimento ridotto del sistema continuano ad avere priorità sugli effetti non essenziali.</p>
      </section>
      <section class="controlCenterSettingsCard">
        <h3>Modalità sviluppatore</h3>
        <label class="controlCenterDeveloperToggle"><input id="controlCenterDeveloperModeToggle" type="checkbox" ${developer ? "checked" : ""}><span>Mostra strumenti Debug e laboratori</span></label>
        <p>In questa candidata di sviluppo è attiva per impostazione predefinita. Le future build pubbliche potranno disattivarla e nascondere Debug.</p>
      </section>
      <section class="controlCenterSettingsCard">
        <h3>Archivio</h3>
        <p id="controlCenterSettingsStorageSummary">${controlCenterEscape(controlCenterStateF9U3.storageEstimate ? `${controlCenterFormatBytes(controlCenterStateF9U3.storageEstimate.usage)} utilizzati` : "Calcolo spazio in corso")}</p>
        <button class="ghost" type="button" data-control-center-panel="transfer">Apri Import / Export</button>
      </section>
    </div>`;
}

function controlCenterDiagnosticList(items, emptyText) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return `<li class="isEmpty">${controlCenterEscape(emptyText)}</li>`;
  return list.map(item => `<li>${controlCenterEscape(typeof item === "string" ? item : JSON.stringify(item))}</li>`).join("");
}

function controlCenterDebugHtml() {
  const report = controlCenterRunDiagnostics({ source: "control-center-debug" });
  const precheck = report.precheck || { problems: [], warnings: [], info: [] };
  const storage = report.storage || {};
  return `
    <div class="controlCenterPanelLead">
      <div><strong>Diagnostica di sviluppo</strong><p>Precheck completo, backend archivio, errori runtime catturati e snapshot esportabile. Questo pannello non modifica il gameplay.</p></div>
      <div class="controlCenterInlineActions">
        <button class="ghost" type="button" data-control-center-action="run-diagnostics">Esegui diagnostica</button>
        <button class="ghost" type="button" data-control-center-action="copy-diagnostics">Copia JSON</button>
        <button class="primary" type="button" data-control-center-action="download-diagnostics">Esporta JSON</button>
      </div>
    </div>
    <div class="controlCenterMiniMetrics">
      ${controlCenterMetricCard("Errori", report.errorCount, report.ok ? "Nessun errore diagnostico" : "Intervento richiesto", report.ok ? "good" : "bad")}
      ${controlCenterMetricCard("Avvisi", report.warningCount, "Precheck non bloccanti", report.warningCount ? "warn" : "good")}
      ${controlCenterMetricCard("Storage", storage.backendName || "—", `${Number(storage.pendingWrites || 0)} scritture pendenti`, storage.error ? "bad" : "good")}
      ${controlCenterMetricCard("Runtime", typeof state !== "undefined" && state ? `R${Number(state.turn || 0)}` : "Inattivo", typeof state !== "undefined" && state ? (state.matchId || "Partita attiva") : "Nessuna partita", "neutral")}
    </div>
    <div class="controlCenterDiagnosticGrid">
      <details open><summary>Problemi precheck (${(precheck.problems || []).length})</summary><ul>${controlCenterDiagnosticList(precheck.problems, "Nessun problema rilevato.")}</ul></details>
      <details open><summary>Avvisi precheck (${(precheck.warnings || []).length})</summary><ul>${controlCenterDiagnosticList(precheck.warnings, "Nessun avviso rilevato.")}</ul></details>
      <details><summary>Errori runtime catturati (${report.runtimeErrors.length})</summary><ul>${controlCenterDiagnosticList(report.runtimeErrors.map(item => `${item.at} · ${item.kind} · ${item.message}`), "Nessun errore runtime catturato.")}</ul></details>
      <details><summary>Archivio e migrazione</summary><pre>${controlCenterEscape(JSON.stringify(storage, null, 2))}</pre></details>
    </div>
    <div class="controlCenterInlineActions controlCenterDebugActions">
      <button class="ghost" type="button" data-control-center-action="clear-runtime-errors">Azzera errori runtime catturati</button>
      <button class="ghost" type="button" data-control-center-action="open-layout-lab">Apri Layout Calibration Lab</button>
      <button class="ghost" type="button" data-control-center-action="refresh-control-center">Aggiorna Centro di controllo</button>
    </div>`;
}

function controlCenterArchiveEnvelope() {
  return {
    kind: "arena-rubra-control-center-archive",
    schemaVersion: CONTROL_CENTER_SCHEMA_F9U3,
    exportedAt: new Date().toISOString(),
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    entries: controlCenterReadStorageEntries()
  };
}

function controlCenterTransferHtml() {
  const keys = controlCenterKnownStorageKeys();
  const diagnostics = controlCenterStorageDiagnostics();
  return `
    <div class="controlCenterPanelLead">
      <div><strong>Archivio applicazione</strong><p>Esporta o ripristina un backup versionato di carte custom, deck, mappe, statistiche, cronologia, impostazioni, tutorial e laboratori locali.</p></div>
    </div>
    <div class="controlCenterTransferGrid">
      <section class="controlCenterTransferCard">
        <h3>Esporta</h3>
        <p>Crea un JSON portabile con tutte le ${keys.length} chiavi riconosciute dal vault locale.</p>
        <div class="controlCenterInlineActions">
          <button class="ghost" type="button" data-control-center-action="copy-archive">Copia backup JSON</button>
          <button class="primary" type="button" data-control-center-action="download-archive">Scarica backup JSON</button>
        </div>
      </section>
      <section class="controlCenterTransferCard">
        <h3>Importa</h3>
        <p>Prima del ripristino viene creato un backup di sicurezza. Le chiavi sconosciute vengono ignorate.</p>
        <button class="primary" type="button" data-control-center-action="select-import-archive">Seleziona backup JSON</button>
        <input id="controlCenterImportFile" type="file" accept="application/json,.json" hidden>
      </section>
      <section class="controlCenterTransferCard">
        <h3>Backend</h3>
        <dl>
          <div><dt>Archivio</dt><dd>${controlCenterEscape(diagnostics.backendName || "—")}</dd></div>
          <div><dt>Directory</dt><dd>${controlCenterEscape(diagnostics.directory || "ArenaRubraData")}</dd></div>
          <div><dt>Voci mirror</dt><dd>${Number(diagnostics.entries || 0)}</dd></div>
          <div><dt>Scritture pendenti</dt><dd>${Number(diagnostics.pendingWrites || 0)}</dd></div>
        </dl>
      </section>
    </div>
    <div id="controlCenterTransferFeedback" class="controlCenterFeedback" aria-live="polite">Nessuna operazione eseguita.</div>
    <details class="controlCenterJsonDetails"><summary>Chiavi incluse</summary><pre>${controlCenterEscape(keys.join("\n"))}</pre></details>`;
}

function controlCenterRenderActivePanel() {
  const body = controlCenterPanelBody();
  if (!body || !controlCenterStateF9U3.activePanel) return;
  const renderers = {
    mapArchive: controlCenterMapsHtml,
    statistics: controlCenterStatisticsHtml,
    history: controlCenterHistoryHtml,
    telemetry: controlCenterTelemetryHtml,
    log: controlCenterLogHtml,
    version: controlCenterVersionHtml,
    settings: controlCenterSettingsHtml,
    debug: controlCenterDebugHtml,
    transfer: controlCenterTransferHtml
  };
  const renderer = renderers[controlCenterStateF9U3.activePanel];
  body.innerHTML = renderer ? renderer() : `<div class="controlCenterEmptyState">Pannello non disponibile.</div>`;
  controlCenterBindDynamicPanelControls();
}

function controlCenterCopyText(text, message = "Dati copiati negli appunti.") {
  if (typeof arenaStorageCopyText === "function") return arenaStorageCopyText(String(text || ""), message);
  if (typeof f9fCopyText === "function") return f9fCopyText(String(text || ""), message);
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") return navigator.clipboard.writeText(String(text || ""));
  return String(text || "");
}

function controlCenterDownloadText(text, filename, mime = "application/json") {
  if (typeof arenaStorageDownloadText === "function") return arenaStorageDownloadText(String(text || ""), filename, mime);
  return controlCenterCopyText(text, `Download non disponibile: ${filename}. Contenuto copiato.`);
}

function controlCenterStatsEnvelope() {
  return {
    kind: "arena-rubra-matchup-stats",
    schemaVersion: CONTROL_CENTER_SCHEMA_F9U3,
    exportedAt: new Date().toISOString(),
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    records: typeof arenaStorageReadMatchupStats === "function" ? arenaStorageReadMatchupStats() : []
  };
}

function controlCenterLogText() {
  if (typeof currentMatchLogTxt === "function") return currentMatchLogTxt();
  const events = typeof state !== "undefined" && state && Array.isArray(state.events) ? state.events : [];
  return events.slice().reverse().map(event => `${event.seq || ""}\t${event.at || ""}\t${event.type || ""}\t${event.message || ""}`).join("\n");
}

function controlCenterActionPayload(action) {
  if (action === "stats") return JSON.stringify(controlCenterStatsEnvelope(), null, 2);
  if (action === "history") return typeof currentPersistentMatchHistoryJson === "function"
    ? currentPersistentMatchHistoryJson()
    : JSON.stringify({ matches: typeof arenaStorageReadMatchHistory === "function" ? arenaStorageReadMatchHistory() : [] }, null, 2);
  if (action === "telemetry") {
    const source = controlCenterTelemetrySource();
    return JSON.stringify(source.telemetry, null, 2);
  }
  if (action === "log") return controlCenterLogText();
  if (action === "build") return JSON.stringify(typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {}, null, 2);
  if (action === "diagnostics") return JSON.stringify(controlCenterRunDiagnostics({ source: "control-center-export" }), null, 2);
  if (action === "archive") return JSON.stringify(controlCenterArchiveEnvelope(), null, 2);
  return "";
}

function controlCenterSetFeedback(message, tone = "neutral") {
  const element = typeof document !== "undefined" ? document.getElementById("controlCenterTransferFeedback") : null;
  if (!element) return;
  element.textContent = String(message || "");
  element.dataset.tone = tone;
}

async function controlCenterImportArchiveFile(file) {
  if (!file) return { ok: false, restored: [], issues: ["Nessun file selezionato"] };
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch (error) {
    return { ok: false, restored: [], issues: [`JSON non valido: ${error && error.message ? error.message : error}`] };
  }
  const entries = parsed && parsed.entries && typeof parsed.entries === "object" && !Array.isArray(parsed.entries) ? parsed.entries : null;
  if (!entries) return { ok: false, restored: [], issues: ["Il backup non contiene un dizionario entries valido."] };
  const known = new Set(controlCenterKnownStorageKeys());
  const safeEntries = {};
  const ignored = [];
  for (const [key, value] of Object.entries(entries)) {
    if (!known.has(key)) {
      ignored.push(key);
      continue;
    }
    safeEntries[key] = controlCenterClone(value);
  }
  if (!Object.keys(safeEntries).length) return { ok: false, restored: [], issues: ["Nessuna chiave Arena Rubra riconosciuta nel backup."] };

  try {
    if (typeof ArenaDataStore !== "undefined" && ArenaDataStore && typeof ArenaDataStore.createBackup === "function") {
      await ArenaDataStore.createBackup("pre-f9u3-import");
    }
  } catch (error) {
    return { ok: false, restored: [], issues: [`Backup di sicurezza fallito: ${error && error.message ? error.message : error}`] };
  }

  let restored = [];
  try {
    if (typeof ArenaDataStore !== "undefined" && ArenaDataStore && typeof ArenaDataStore.restoreBackup === "function") {
      const result = await ArenaDataStore.restoreBackup({
        kind: "arena-rubra-control-center-import",
        schemaVersion: CONTROL_CENTER_SCHEMA_F9U3,
        entries: safeEntries
      });
      restored = result && Array.isArray(result.restored) ? result.restored : Object.keys(safeEntries);
    } else if (typeof arenaStorageWriteJson === "function") {
      for (const [key, value] of Object.entries(safeEntries)) {
        if (arenaStorageWriteJson(key, value)) restored.push(key);
      }
    }
  } catch (error) {
    return { ok: false, restored, issues: [`Ripristino fallito: ${error && error.message ? error.message : error}`] };
  }
  controlCenterStateF9U3.lastDiagnostics = null;
  controlCenterRefresh();
  return { ok: restored.length > 0, restored, ignored, issues: [] };
}

function controlCenterOpenMapInSetup(mapId) {
  const id = String(mapId || "map1_starter");
  if (typeof openNewGameSetupScreen === "function") openNewGameSetupScreen();
  if (typeof refreshSetupMapSelector === "function") refreshSetupMapSelector(id);
  if (typeof writeControlValue === "function") writeControlValue("setupMapName", id);
  const select = typeof document !== "undefined" ? document.getElementById("setupMapName") : null;
  if (select) select.value = id;
  if (typeof refreshSetupForSelectedMap === "function") refreshSetupForSelectedMap();
}

function controlCenterOpenMapInEditor(mapId) {
  if (typeof openMapEditorScreen === "function") openMapEditorScreen(String(mapId || "map1_starter"));
}

function controlCenterHandleAction(action) {
  const key = String(action || "");
  if (key === "copy-stats") return controlCenterCopyText(controlCenterActionPayload("stats"), "Statistiche JSON copiate.");
  if (key === "download-stats") return controlCenterDownloadText(controlCenterActionPayload("stats"), `arena-rubra-statistiche-${controlCenterSafeFilename(new Date().toISOString())}.json`);
  if (key === "copy-history") return controlCenterCopyText(controlCenterActionPayload("history"), "Cronologia JSON copiata.");
  if (key === "download-history") return controlCenterDownloadText(controlCenterActionPayload("history"), `arena-rubra-cronologia-${controlCenterSafeFilename(new Date().toISOString())}.json`);
  if (key === "copy-telemetry") return controlCenterCopyText(controlCenterActionPayload("telemetry"), "Telemetria JSON copiata.");
  if (key === "download-telemetry") return controlCenterDownloadText(controlCenterActionPayload("telemetry"), `arena-rubra-telemetria-${controlCenterSafeFilename(new Date().toISOString())}.json`);
  if (key === "copy-log") return controlCenterCopyText(controlCenterActionPayload("log"), "Log copiato.");
  if (key === "download-log") return controlCenterDownloadText(controlCenterActionPayload("log"), `arena-rubra-log-${controlCenterSafeFilename(new Date().toISOString())}.txt`, "text/plain");
  if (key === "copy-build") return controlCenterCopyText(controlCenterActionPayload("build"), "Metadati build copiati.");
  if (key === "run-diagnostics") {
    controlCenterStateF9U3.lastDiagnostics = controlCenterRunDiagnostics({ source: "control-center-manual" });
    controlCenterRefreshMetrics();
    controlCenterRenderActivePanel();
    return controlCenterStateF9U3.lastDiagnostics;
  }
  if (key === "copy-diagnostics") return controlCenterCopyText(controlCenterActionPayload("diagnostics"), "Diagnostica JSON copiata.");
  if (key === "download-diagnostics") return controlCenterDownloadText(controlCenterActionPayload("diagnostics"), `arena-rubra-diagnostica-${controlCenterSafeFilename(new Date().toISOString())}.json`);
  if (key === "clear-runtime-errors") {
    CONTROL_CENTER_DIAGNOSTIC_ERRORS.length = 0;
    controlCenterStateF9U3.lastDiagnostics = null;
    controlCenterRefresh();
    return true;
  }
  if (key === "open-layout-lab") {
    if (typeof openMenuLayoutCalibrationLabScreen === "function") openMenuLayoutCalibrationLabScreen({ sourceScreen: typeof currentAppScreen === "function" ? currentAppScreen() : "mainMenu" });
    return true;
  }
  if (key === "refresh-control-center") {
    controlCenterRefresh();
    return true;
  }
  if (key === "copy-archive") return controlCenterCopyText(controlCenterActionPayload("archive"), "Backup completo copiato.");
  if (key === "download-archive") return controlCenterDownloadText(controlCenterActionPayload("archive"), `arena-rubra-backup-${controlCenterSafeFilename(new Date().toISOString())}.json`);
  if (key === "select-import-archive") {
    const input = typeof document !== "undefined" ? document.getElementById("controlCenterImportFile") : null;
    if (input) input.click();
    return true;
  }
  return false;
}

function controlCenterBindDynamicPanelControls() {
  if (typeof document === "undefined") return;
  const body = controlCenterPanelBody();
  if (!body) return;

  body.querySelectorAll("[data-control-center-action]").forEach(button => {
    if (button.dataset.controlCenterBound === "1") return;
    button.dataset.controlCenterBound = "1";
    button.addEventListener("click", () => controlCenterHandleAction(button.dataset.controlCenterAction));
  });
  body.querySelectorAll("[data-control-center-panel]").forEach(button => {
    if (button.dataset.controlCenterBound === "1") return;
    button.dataset.controlCenterBound = "1";
    button.addEventListener("click", () => controlCenterOpenPanel(button.dataset.controlCenterPanel));
  });
  body.querySelectorAll("[data-control-center-map-setup]").forEach(button => {
    button.addEventListener("click", () => controlCenterOpenMapInSetup(button.dataset.controlCenterMapSetup));
  });
  body.querySelectorAll("[data-control-center-map-edit]").forEach(button => {
    button.addEventListener("click", () => controlCenterOpenMapInEditor(button.dataset.controlCenterMapEdit));
  });
  body.querySelectorAll("[data-app-open-map-editor]").forEach(button => {
    button.addEventListener("click", () => controlCenterOpenMapInEditor("map1_starter"));
  });

  const developerToggle = document.getElementById("controlCenterDeveloperModeToggle");
  if (developerToggle && developerToggle.dataset.controlCenterBound !== "1") {
    developerToggle.dataset.controlCenterBound = "1";
    developerToggle.addEventListener("change", () => controlCenterSetDeveloperMode(developerToggle.checked, { persist: true }));
  }
  const importFile = document.getElementById("controlCenterImportFile");
  if (importFile && importFile.dataset.controlCenterBound !== "1") {
    importFile.dataset.controlCenterBound = "1";
    importFile.addEventListener("change", async () => {
      const file = importFile.files && importFile.files[0];
      controlCenterSetFeedback(file ? `Importazione di ${file.name}…` : "Nessun file selezionato.", "neutral");
      const result = await controlCenterImportArchiveFile(file);
      controlCenterSetFeedback(result.ok
        ? `Import completato: ${result.restored.length} chiavi ripristinate${result.ignored && result.ignored.length ? ` · ${result.ignored.length} ignorate` : ""}.`
        : `Import fallito: ${(result.issues || ["errore sconosciuto"]).join("; ")}`,
      result.ok ? "good" : "bad");
      importFile.value = "";
    });
  }

  if (controlCenterStateF9U3.activePanel === "settings") {
    if (typeof arenaAudioBindControls === "function") arenaAudioBindControls();
    if (typeof arenaAudioSyncControls === "function") arenaAudioSyncControls();
    if (typeof arenaSfxBindControlsF9O5a === "function") arenaSfxBindControlsF9O5a();
    if (typeof arenaSfxSyncControlsF9O5a === "function") arenaSfxSyncControlsF9O5a();
    if (typeof cardMotionBindControls === "function") cardMotionBindControls();
    if (typeof cardMotionSyncControls === "function") cardMotionSyncControls();
    if (typeof tokenFxBindControlsF9O5a === "function") tokenFxBindControlsF9O5a();
    if (typeof tokenFxSyncControlsF9O5a === "function") tokenFxSyncControlsF9O5a();
    controlCenterApplyDeveloperMode();
  }
}

function initializeControlCenter() {
  if (controlCenterStateF9U3.initialized || typeof document === "undefined") return;
  controlCenterStateF9U3.initialized = true;
  controlCenterInstallDiagnosticCapture();

  const rootPanel = controlCenterPanelElement();
  if (rootPanel && rootPanel.parentElement !== document.body) document.body.appendChild(rootPanel);

  document.querySelectorAll("[data-control-center-panel]").forEach(button => {
    if (button.dataset.controlCenterBound === "1") return;
    button.dataset.controlCenterBound = "1";
    button.addEventListener("click", () => controlCenterOpenPanel(button.dataset.controlCenterPanel));
  });

  const closeButton = document.getElementById("controlCenterPanelCloseBtn");
  if (closeButton && closeButton.dataset.controlCenterBound !== "1") {
    closeButton.dataset.controlCenterBound = "1";
    closeButton.addEventListener("click", controlCenterClosePanel);
  }
  const scrim = document.getElementById("controlCenterPanelScrim");
  if (scrim && scrim.dataset.controlCenterBound !== "1") {
    scrim.dataset.controlCenterBound = "1";
    scrim.addEventListener("click", controlCenterClosePanel);
  }
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && controlCenterStateF9U3.activePanel) controlCenterClosePanel();
  });

  controlCenterApplyDeveloperMode();
  controlCenterRefreshMetrics();
  controlCenterRefresh();
}

function controlCenterSnapshot() {
  return {
    schemaVersion: CONTROL_CENTER_SCHEMA_F9U3,
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    telemetrySchema: controlCenterTelemetrySchema(),
    officialDecks: controlCenterOfficialDeckCount(),
    officialMaps: controlCenterOfficialMaps().length,
    customCards: controlCenterCustomCardCount(),
    customDecks: controlCenterCustomDeckCount(),
    customMaps: controlCenterCustomMapCount(),
    storage: controlCenterClone(controlCenterStateF9U3.storageEstimate),
    latestMatch: controlCenterClone(controlCenterLatestHistoryRecord()),
    diagnostics: controlCenterClone(controlCenterDiagnosticStatus()),
    developerMode: controlCenterReadDeveloperMode(),
    activePanel: controlCenterStateF9U3.activePanel
  };
}
