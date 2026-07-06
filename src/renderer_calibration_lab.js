"use strict";

// Arena Rubra – F9K2d Optional Renderer Text Calibration Lab.
// Dev tool opzionale: riparte da storage v2 per evitare che vecchi override F9K2c sovrascrivano le coordinate fissate nel renderer.
// Non modifica gameplay, AI, deck rules o dati ufficiali.

const RENDERER_CALIBRATION_STORAGE_KEY = "arenaRubra.rendererTextCalibration.v2";

const rendererCalibrationState = {
  open: false,
  targetCard: null,
  targetKind: "unit",
  targetFactionKey: "nexus",
  enabled: true,
  overrides: {},
  lastExport: ""
};

const RENDERER_CALIBRATION_TEXT_FIELDS = ["x", "y", "w", "h", "maxFontSize", "minFontSize"];
const RENDERER_CALIBRATION_STAT_FIELDS = ["cx", "labelY", "valueY", "labelSize", "valueSize"];

function rendererCalibrationEscapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function rendererCalibrationReadJson(key, fallback) {
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

function rendererCalibrationWriteJson(key, value) {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(key, JSON.stringify(value, null, 2));
    return true;
  } catch (err) {
    console.warn("Renderer Calibration Lab: salvataggio localStorage fallito", err);
    return false;
  }
}

function rendererCalibrationLoadStore() {
  const store = rendererCalibrationReadJson(RENDERER_CALIBRATION_STORAGE_KEY, null);
  if (!store || store.schema !== "arena-rubra-renderer-calibration-lab-v1") return {};
  return store.overrides && typeof store.overrides === "object" ? store.overrides : {};
}

function rendererCalibrationSaveStore() {
  rendererCalibrationWriteJson(RENDERER_CALIBRATION_STORAGE_KEY, {
    schema: "arena-rubra-renderer-calibration-lab-v1",
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    updatedAt: new Date().toISOString(),
    overrides: rendererCalibrationState.overrides
  });
}

function rendererCalibrationTargetKey(kind = rendererCalibrationState.targetKind, factionKey = rendererCalibrationState.targetFactionKey) {
  return `${kind || "unit"}:${factionKey || "neutral"}`;
}

function rendererCalibrationFactionKey(card) {
  if (typeof cardAssetFactionKey === "function") return cardAssetFactionKey(card);
  return String(card && card.faction || "neutral").toLowerCase();
}

function rendererCalibrationKind(card) {
  if (typeof cardAssetKind === "function") return cardAssetKind(card);
  return card && card.sourceType === "tactic" ? "tactic" : "unit";
}

function rendererCalibrationClone(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

function rendererCalibrationNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function rendererCalibrationRound(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : value;
}

function rendererCalibrationApplyToLayout(layout, override) {
  if (!layout || !override || typeof override !== "object") return layout;
  const next = {
    ...layout,
    image: { ...(layout.image || {}) },
    imageTransform: { ...(layout.imageTransform || {}) },
    textAreas: { ...(layout.textAreas || {}) },
    statText: { ...(layout.statText || {}) }
  };
  if (override.textAreas) {
    Object.keys(override.textAreas).forEach(key => {
      if (!next.textAreas[key]) next.textAreas[key] = {};
      next.textAreas[key] = { ...next.textAreas[key], ...override.textAreas[key] };
    });
  }
  if (override.statText) {
    Object.keys(override.statText).forEach(key => {
      if (!next.statText[key]) next.statText[key] = {};
      next.statText[key] = { ...next.statText[key], ...override.statText[key] };
    });
  }
  return next;
}

(function patchRendererCalibrationLayout() {
  if (typeof window === "undefined") return;
  const original = window.cardRendererLayoutFor;
  if (typeof original !== "function" || original.__rendererCalibrationBase) return;
  function patchedCardRendererLayoutFor(card, kind) {
    const base = original.apply(this, arguments);
    if (!rendererCalibrationState.enabled) return base;
    const resolvedKind = kind || rendererCalibrationKind(card);
    const factionKey = rendererCalibrationFactionKey(card);
    const key = rendererCalibrationTargetKey(resolvedKind, factionKey);
    const override = rendererCalibrationState.overrides[key];
    return rendererCalibrationApplyToLayout(base, override);
  }
  patchedCardRendererLayoutFor.__rendererCalibrationBase = original;
  window.cardRendererLayoutFor = patchedCardRendererLayoutFor;
})();

function rendererCalibrationBaseLayout(card = rendererCalibrationState.targetCard, kind = rendererCalibrationState.targetKind) {
  const fn = typeof window !== "undefined" && typeof window.cardRendererLayoutFor === "function"
    ? (window.cardRendererLayoutFor.__rendererCalibrationBase || window.cardRendererLayoutFor)
    : null;
  if (typeof fn === "function") return rendererCalibrationClone(fn(card, kind));
  if (typeof CARD_COMPOSER_TEMPLATE_GEOMETRY !== "undefined") {
    const base = CARD_COMPOSER_TEMPLATE_GEOMETRY[kind] || CARD_COMPOSER_TEMPLATE_GEOMETRY.unit;
    return rendererCalibrationClone(base);
  }
  return { textAreas: {}, statText: {} };
}

function rendererCalibrationCurrentOverride() {
  return rendererCalibrationState.overrides[rendererCalibrationTargetKey()] || null;
}

function rendererCalibrationEffectiveLayout() {
  const base = rendererCalibrationBaseLayout();
  return rendererCalibrationApplyToLayout(base, rendererCalibrationCurrentOverride());
}

function rendererCalibrationCurrentCard() {
  const bodyScreen = typeof document !== "undefined" && document.body ? document.body.dataset.appScreen : "";
  try {
    if (bodyScreen === "cardEditor" && typeof cardEditorBuildPreviewCard === "function") return cardEditorBuildPreviewCard();
  } catch (_) {}
  try {
    if (bodyScreen === "cardPool" && typeof cardPoolEnsureSelected === "function") return cardPoolEnsureSelected();
  } catch (_) {}
  try {
    if (typeof cardPoolEnsureSelected === "function") return cardPoolEnsureSelected();
  } catch (_) {}
  try {
    if (typeof cardEditorBuildPreviewCard === "function") return cardEditorBuildPreviewCard();
  } catch (_) {}
  return null;
}

function rendererCalibrationRerenderPreviews() {
  try { if (typeof renderCardEditorScreen === "function") renderCardEditorScreen(); } catch (_) {}
  try { if (typeof renderCardPoolScreen === "function") renderCardPoolScreen(); } catch (_) {}
  try { if (typeof renderDeckBuilderScreen === "function" && document.body && document.body.dataset.appScreen === "deckBuilder") renderDeckBuilderScreen(); } catch (_) {}
  try { if (typeof renderGameHandPreview === "function") renderGameHandPreview(); } catch (_) {}
  try { if (typeof renderSelectedUnitCardPreview === "function") renderSelectedUnitCardPreview(); } catch (_) {}
}

function rendererCalibrationEnsurePanel() {
  if (typeof document === "undefined") return null;
  let panel = document.getElementById("rendererCalibrationLab");
  if (panel) return panel;
  panel = document.createElement("aside");
  panel.id = "rendererCalibrationLab";
  panel.className = "rendererCalibrationLab";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="rendererCalibrationHeader">
      <div>
        <div class="mainMenuKicker">Dev Tool temporaneo</div>
        <h3>Renderer Text Calibration Lab</h3>
      </div>
      <button class="ghost" id="rendererCalibrationCloseBtn" type="button">Chiudi</button>
    </div>
    <div class="rendererCalibrationTarget" id="rendererCalibrationTargetInfo">Nessuna carta selezionata.</div>
    <div class="rendererCalibrationControlsTop">
      <label class="checkline"><input id="rendererCalibrationEnabled" type="checkbox" checked> Applica override locali</label>
      <button class="ghost" id="rendererCalibrationLoadCurrentBtn" type="button">Usa carta corrente</button>
      <button class="ghost" id="rendererCalibrationApplyBtn" type="button">Applica preview</button>
      <button class="danger" id="rendererCalibrationResetTargetBtn" type="button">Reset target</button>
    </div>
    <div class="rendererCalibrationSelectorGrid">
      <label>Tipo
        <select id="rendererCalibrationKind">
          <option value="unit">Unità</option>
          <option value="tactic">Tattica</option>
        </select>
      </label>
      <label>Fazione key
        <select id="rendererCalibrationFaction">
          <option value="nexus">nexus</option>
          <option value="exordium">exordium</option>
          <option value="liberti">liberti</option>
          <option value="agathoi">agathoi</option>
          <option value="fabeot">fabeot</option>
          <option value="neutral">neutral</option>
        </select>
      </label>
    </div>
    <div class="rendererCalibrationScroll">
      <section>
        <h4>Caselle testo</h4>
        <div id="rendererCalibrationTextGrid" class="rendererCalibrationGrid"></div>
      </section>
      <section>
        <h4>Statistiche / ENE</h4>
        <div id="rendererCalibrationStatGrid" class="rendererCalibrationGrid"></div>
      </section>
    </div>
    <div class="rendererCalibrationExportActions">
      <button class="primary" id="rendererCalibrationCopyJsonBtn" type="button">Copia JSON calibrazione</button>
      <button class="ghost" id="rendererCalibrationWriteJsonBtn" type="button">Scrivi JSON sotto</button>
    </div>
    <textarea id="rendererCalibrationExportText" spellcheck="false" placeholder="Qui comparirà il JSON calibrazione esportato."></textarea>
    <p class="rendererCalibrationNote">Nota: questo è un tool temporaneo. Gli override servono per prova/preview e vengono esportati per fissare poi le coordinate nel codice del renderer.</p>
  `;
  document.body.appendChild(panel);

  document.getElementById("rendererCalibrationCloseBtn").addEventListener("click", () => rendererCalibrationClose());
  document.getElementById("rendererCalibrationLoadCurrentBtn").addEventListener("click", () => rendererCalibrationOpen(rendererCalibrationCurrentCard()));
  document.getElementById("rendererCalibrationApplyBtn").addEventListener("click", () => rendererCalibrationApplyForm());
  document.getElementById("rendererCalibrationResetTargetBtn").addEventListener("click", () => rendererCalibrationResetTarget());
  document.getElementById("rendererCalibrationCopyJsonBtn").addEventListener("click", () => rendererCalibrationCopyJson());
  document.getElementById("rendererCalibrationWriteJsonBtn").addEventListener("click", () => rendererCalibrationWriteExportText());
  document.getElementById("rendererCalibrationEnabled").addEventListener("change", event => {
    rendererCalibrationState.enabled = Boolean(event.target.checked);
    rendererCalibrationRerenderPreviews();
  });
  document.getElementById("rendererCalibrationKind").addEventListener("change", event => {
    rendererCalibrationState.targetKind = event.target.value || "unit";
    rendererCalibrationFillForm();
  });
  document.getElementById("rendererCalibrationFaction").addEventListener("change", event => {
    rendererCalibrationState.targetFactionKey = event.target.value || "neutral";
    rendererCalibrationFillForm();
  });
  return panel;
}

function rendererCalibrationFieldInput(id, value) {
  const safeId = rendererCalibrationEscapeHtml(id);
  const v = Number.isFinite(Number(value)) ? rendererCalibrationRound(Number(value)) : "";
  return `<input id="${safeId}" data-renderer-calibration-input="1" type="number" step="1" value="${rendererCalibrationEscapeHtml(v)}">`;
}

function rendererCalibrationRenderTextGrid(layout) {
  const grid = document.getElementById("rendererCalibrationTextGrid");
  if (!grid) return;
  const areas = layout.textAreas || {};
  const rows = ["name", "type", "description"];
  grid.innerHTML = rows.map(areaName => {
    const area = areas[areaName] || {};
    return `
      <div class="rendererCalibrationRowLabel">${rendererCalibrationEscapeHtml(areaName)}</div>
      ${RENDERER_CALIBRATION_TEXT_FIELDS.map(field => `
        <label>${field}
          ${rendererCalibrationFieldInput(`rendererCalibrationText_${areaName}_${field}`, area[field])}
        </label>`).join("")}`;
  }).join("");
  grid.style.gridTemplateColumns = `120px repeat(${RENDERER_CALIBRATION_TEXT_FIELDS.length}, minmax(72px, 1fr))`;
}

function rendererCalibrationRenderStatGrid(layout) {
  const grid = document.getElementById("rendererCalibrationStatGrid");
  if (!grid) return;
  const stat = layout.statText || {};
  const rows = ["ene", "hp", "def", "att"];
  grid.innerHTML = rows.map(statName => {
    const box = stat[statName] || {};
    return `
      <div class="rendererCalibrationRowLabel">${rendererCalibrationEscapeHtml(statName)}</div>
      ${RENDERER_CALIBRATION_STAT_FIELDS.map(field => `
        <label>${field}
          ${rendererCalibrationFieldInput(`rendererCalibrationStat_${statName}_${field}`, box[field])}
        </label>`).join("")}`;
  }).join("");
  grid.style.gridTemplateColumns = `120px repeat(${RENDERER_CALIBRATION_STAT_FIELDS.length}, minmax(72px, 1fr))`;
}

function rendererCalibrationSetTarget(card) {
  const target = card || rendererCalibrationCurrentCard();
  rendererCalibrationState.targetCard = target;
  rendererCalibrationState.targetKind = rendererCalibrationKind(target);
  rendererCalibrationState.targetFactionKey = rendererCalibrationFactionKey(target);
  const kindSelect = document.getElementById("rendererCalibrationKind");
  const factionSelect = document.getElementById("rendererCalibrationFaction");
  if (kindSelect) kindSelect.value = rendererCalibrationState.targetKind;
  if (factionSelect) factionSelect.value = rendererCalibrationState.targetFactionKey;
}

function rendererCalibrationFillForm() {
  rendererCalibrationEnsurePanel();
  const info = document.getElementById("rendererCalibrationTargetInfo");
  const card = rendererCalibrationState.targetCard;
  const layout = rendererCalibrationEffectiveLayout();
  if (info) {
    info.innerHTML = card
      ? `<strong>${rendererCalibrationEscapeHtml(card.name || "Carta")}</strong> · ${rendererCalibrationEscapeHtml(card.faction || "—")} · ${rendererCalibrationEscapeHtml(rendererCalibrationState.targetKind)} · key <code>${rendererCalibrationEscapeHtml(rendererCalibrationTargetKey())}</code>`
      : `Target manuale · key <code>${rendererCalibrationEscapeHtml(rendererCalibrationTargetKey())}</code>`;
  }
  rendererCalibrationRenderTextGrid(layout);
  rendererCalibrationRenderStatGrid(layout);
  document.querySelectorAll("[data-renderer-calibration-input]").forEach(input => {
    input.addEventListener("input", () => rendererCalibrationApplyForm(false));
    input.addEventListener("change", () => rendererCalibrationApplyForm(false));
  });
}

function rendererCalibrationReadTextOverrides() {
  const out = {};
  ["name", "type", "description"].forEach(areaName => {
    const entry = {};
    RENDERER_CALIBRATION_TEXT_FIELDS.forEach(field => {
      const el = document.getElementById(`rendererCalibrationText_${areaName}_${field}`);
      if (!el) return;
      const n = rendererCalibrationNumber(el.value, NaN);
      if (Number.isFinite(n)) entry[field] = n;
    });
    out[areaName] = entry;
  });
  return out;
}

function rendererCalibrationReadStatOverrides() {
  const out = {};
  ["ene", "hp", "def", "att"].forEach(statName => {
    const entry = {};
    RENDERER_CALIBRATION_STAT_FIELDS.forEach(field => {
      const el = document.getElementById(`rendererCalibrationStat_${statName}_${field}`);
      if (!el) return;
      const n = rendererCalibrationNumber(el.value, NaN);
      if (Number.isFinite(n)) entry[field] = n;
    });
    out[statName] = entry;
  });
  return out;
}

function rendererCalibrationApplyForm(rerender = true) {
  const key = rendererCalibrationTargetKey();
  rendererCalibrationState.overrides[key] = {
    textAreas: rendererCalibrationReadTextOverrides(),
    statText: rendererCalibrationReadStatOverrides(),
    updatedAt: new Date().toISOString()
  };
  rendererCalibrationSaveStore();
  rendererCalibrationWriteExportText(false);
  if (rerender) rendererCalibrationRerenderPreviews();
}

function rendererCalibrationResetTarget() {
  const key = rendererCalibrationTargetKey();
  delete rendererCalibrationState.overrides[key];
  rendererCalibrationSaveStore();
  rendererCalibrationFillForm();
  rendererCalibrationRerenderPreviews();
}

function rendererCalibrationBuildExport() {
  const card = rendererCalibrationState.targetCard;
  const kind = rendererCalibrationState.targetKind;
  const factionKey = rendererCalibrationState.targetFactionKey;
  const key = rendererCalibrationTargetKey(kind, factionKey);
  const base = rendererCalibrationBaseLayout(card, kind);
  const override = rendererCalibrationState.overrides[key] || {
    textAreas: rendererCalibrationReadTextOverrides(),
    statText: rendererCalibrationReadStatOverrides()
  };
  const resolved = rendererCalibrationApplyToLayout(base, override);
  return {
    schema: "arena-rubra-renderer-text-calibration-F9K2c",
    generatedAt: new Date().toISOString(),
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    target: {
      key,
      kind,
      factionKey,
      faction: card && card.faction || "",
      cardId: card && card.id || "",
      cardName: card && card.name || ""
    },
    patch: override,
    resolvedLayout: {
      textAreas: resolved.textAreas,
      statText: resolved.statText
    },
    codeHint: {
      note: "Usare patch/resolvedLayout per aggiornare CARD_RENDERER_TEXT_AREA_OFFSETS o CARD_COMPOSER_TEMPLATE_GEOMETRY nel renderer definitivo.",
      temporaryStorageKey: RENDERER_CALIBRATION_STORAGE_KEY
    }
  };
}

function rendererCalibrationWriteExportText(updateFromForm = true) {
  if (updateFromForm) rendererCalibrationApplyForm(false);
  const payload = rendererCalibrationBuildExport();
  const text = JSON.stringify(payload, null, 2);
  rendererCalibrationState.lastExport = text;
  const area = document.getElementById("rendererCalibrationExportText");
  if (area) area.value = text;
  return text;
}

function rendererCalibrationCopyJson() {
  const text = rendererCalibrationWriteExportText(true);
  if (typeof arenaStorageCopyText === "function") return arenaStorageCopyText(text, "JSON calibrazione renderer copiato.");
  if (navigator && navigator.clipboard) return navigator.clipboard.writeText(text);
  return text;
}

function rendererCalibrationOpen(card = null) {
  const panel = rendererCalibrationEnsurePanel();
  rendererCalibrationSetTarget(card || rendererCalibrationCurrentCard());
  rendererCalibrationState.open = true;
  panel.hidden = false;
  panel.classList.add("isOpen");
  const enabled = document.getElementById("rendererCalibrationEnabled");
  if (enabled) enabled.checked = rendererCalibrationState.enabled;
  rendererCalibrationFillForm();
  rendererCalibrationWriteExportText(false);
}

function rendererCalibrationClose() {
  const panel = rendererCalibrationEnsurePanel();
  rendererCalibrationState.open = false;
  panel.classList.remove("isOpen");
  panel.hidden = true;
}

function rendererCalibrationInjectButtons() {
  if (typeof document === "undefined") return;
  const targets = [
    { selector: "#cardEditorScreen .deckBuilderHeaderActions", id: "cardEditorRendererCalibrationBtn" },
    { selector: "#cardPoolScreen .deckBuilderHeaderActions", id: "cardPoolRendererCalibrationBtn" },
    { selector: "#deckBuilderScreen .deckBuilderHeaderActions", id: "deckBuilderRendererCalibrationBtn" }
  ];
  targets.forEach(target => {
    const box = document.querySelector(target.selector);
    if (!box || document.getElementById(target.id)) return;
    const btn = document.createElement("button");
    btn.className = "ghost rendererCalibrationOpenBtn";
    btn.id = target.id;
    btn.type = "button";
    btn.textContent = "Calibra renderer";
    btn.addEventListener("click", () => rendererCalibrationOpen(rendererCalibrationCurrentCard()));
    box.insertBefore(btn, box.firstChild);
  });
}

function initializeRendererCalibrationLab() {
  rendererCalibrationState.overrides = rendererCalibrationLoadStore();
  rendererCalibrationEnsurePanel();
  rendererCalibrationInjectButtons();
}

if (typeof window !== "undefined") {
  window.initializeRendererCalibrationLab = initializeRendererCalibrationLab;
  window.openRendererCalibrationLab = rendererCalibrationOpen;
  window.rendererCalibrationBuildExport = rendererCalibrationBuildExport;
  window.rendererCalibrationApplyToLayout = rendererCalibrationApplyToLayout;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeRendererCalibrationLab);
  } else {
    initializeRendererCalibrationLab();
  }
}
