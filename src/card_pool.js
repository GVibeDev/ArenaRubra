"use strict";

// Arena Rubra – F9K2 Card Pool / Custom Library integration.
// Browser carte read-only con filtri, tabella/galleria, navigazione, custom badge e duplicazione sicura in editor.
// Non modifica gameplay, deck rules, AI o stato partita.

const CARD_POOL_STATE = {
  faction: "Nexus",
  kind: "unit",
  role: "all",
  origin: "all",
  search: "",
  selectedCardId: "",
  viewMode: "gallery",
  focusMode: false
};

const CARD_POOL_GALLERY_THUMB_SCALE = 0.19;

function cardPoolEscapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cardPoolCatalog() {
  const official = typeof buildCardCatalog === "function" ? buildCardCatalog() : [];
  return typeof cardEditorCatalogWithCustom === "function" ? cardEditorCatalogWithCustom(official) : official;
}

function cardPoolFactionList(catalog = null) {
  const source = catalog || cardPoolCatalog();
  return [...new Set(source.map(card => card && card.faction).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function cardPoolKind(card) {
  if (card && card.sourceType === "mission") return "mission";
  return card && card.sourceType === "tactic" ? "tactic" : "unit";
}

function cardPoolRole(card) {
  if (!card) return "unknown";
  if (card.sourceType === "mission") return "mission";
  if (card.sourceType === "tactic") return "tactic";
  return card.deckRole || card.cardType || "unit";
}

function cardPoolRoleLabel(cardOrRole) {
  const raw = typeof cardOrRole === "string" ? cardOrRole : cardPoolRole(cardOrRole);
  const labels = {
    all: "Tutti",
    commander: "Comandanti",
    pivot: "Pivot",
    elite: "Elite",
    heavy: "Pesanti",
    base: "Base",
    tactic: "Tattiche",
    mission: "Missioni",
    unit_structure: "Strutture",
    unit_infantry: "Fanterie",
    unit_vehicle: "Veicoli",
    unit: "Unità"
  };
  return labels[raw] || raw || "—";
}

function cardPoolTypeLabel(card) {
  if (!card) return "—";
  if (typeof cardRendererTypeText === "function") return cardRendererTypeText(card);
  if (card.sourceType === "mission") return card.missionClass === "desperate" ? "MISSIONE DISPERATA" : "MISSIONE";
  if (card.sourceType === "tactic") return card.category ? `TATTICA · ${card.category}` : "TATTICA";
  return [card.unitType, card.unitClassLabel || card.weight].filter(Boolean).join(" ").toUpperCase() || "UNITÀ";
}

function cardPoolCompare(a, b) {
  const fa = String(a.faction || "").localeCompare(String(b.faction || ""));
  if (fa) return fa;
  const ka = cardPoolKind(a).localeCompare(cardPoolKind(b));
  if (ka) return ka;
  const ra = cardPoolRole(a).localeCompare(cardPoolRole(b));
  if (ra) return ra;
  const ca = (Number.isFinite(a.cost) ? a.cost : 99) - (Number.isFinite(b.cost) ? b.cost : 99);
  if (ca) return ca;
  return String(a.name || "").localeCompare(String(b.name || ""));
}

function cardPoolFilterCard(card) {
  if (!card) return false;
  if (CARD_POOL_STATE.faction !== "all" && card.faction !== CARD_POOL_STATE.faction) return false;
  if (CARD_POOL_STATE.kind !== "all" && cardPoolKind(card) !== CARD_POOL_STATE.kind) return false;
  if (CARD_POOL_STATE.role !== "all" && cardPoolRole(card) !== CARD_POOL_STATE.role) return false;
  if (CARD_POOL_STATE.origin === "custom" && card.custom !== true) return false;
  if (CARD_POOL_STATE.origin === "official" && card.custom === true) return false;
  const q = String(CARD_POOL_STATE.search || "").trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    card.id, card.sourceId, card.blueprintId, card.tacticId, card.name, card.faction,
    cardPoolTypeLabel(card), cardPoolRoleLabel(card), card.category, card.quality,
    card.effectText, card.notes, card.target, card.effectKind
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(q);
}

function cardPoolFilteredCards() {
  return cardPoolCatalog().filter(cardPoolFilterCard).sort(cardPoolCompare);
}

function cardPoolCardById(cardId) {
  const id = String(cardId || "");
  if (!id) return null;
  return cardPoolCatalog().find(card => card && card.id === id) || null;
}

function cardPoolFilteredIndexByCardId(cardId, cards = null) {
  const list = Array.isArray(cards) ? cards : cardPoolFilteredCards();
  return list.findIndex(card => card && card.id === cardId);
}

function cardPoolSelectCard(cardId, source = "pool") {
  const card = cardPoolCardById(cardId);
  if (!card) return false;
  CARD_POOL_STATE.selectedCardId = card.id;
  if (typeof cardRendererSelectCard === "function") cardRendererSelectCard(card.id, source);
  renderCardPoolPreview(card);
  syncCardPoolSelection();
  return true;
}

function cardPoolDuplicateSelectedInEditor() {
  const card = cardPoolCardById(CARD_POOL_STATE.selectedCardId);
  if (!card || card.sourceType === "mission") return false;
  return typeof cardEditorDuplicateCatalogCard === "function" ? cardEditorDuplicateCatalogCard(card.id) : false;
}

function cardPoolEnsureSelected(cards = null) {
  const list = Array.isArray(cards) ? cards : cardPoolFilteredCards();
  const selected = cardPoolCardById(CARD_POOL_STATE.selectedCardId);
  if (selected && list.some(card => card.id === selected.id)) return selected;
  const fallback = list[0] || cardPoolCatalog()[0] || null;
  CARD_POOL_STATE.selectedCardId = fallback ? fallback.id : "";
  return fallback;
}

function cardPoolCounts(catalog = null) {
  const source = catalog || cardPoolCatalog();
  const filtered = cardPoolFilteredCards();
  return {
    total: source.length,
    filtered: filtered.length,
    unit: source.filter(card => cardPoolKind(card) === "unit").length,
    tactic: source.filter(card => cardPoolKind(card) === "tactic").length,
    mission: source.filter(card => cardPoolKind(card) === "mission").length,
    custom: source.filter(card => card && card.custom === true).length,
    official: source.filter(card => card && card.custom !== true).length,
    factions: cardPoolFactionList(source).length
  };
}

function cardPoolPopulateFactionSelect() {
  const select = typeof document !== "undefined" ? document.getElementById("cardPoolFactionSelect") : null;
  if (!select) return;
  const factions = cardPoolFactionList();
  const current = CARD_POOL_STATE.faction;
  select.innerHTML = `<option value="all">Tutte le fazioni</option>` + factions.map(faction => `<option value="${cardPoolEscapeHtml(faction)}">${cardPoolEscapeHtml(faction)}</option>`).join("");
  select.value = factions.includes(current) ? current : "all";
  CARD_POOL_STATE.faction = select.value;
}

function cardPoolSyncControls() {
  if (typeof document === "undefined") return;
  const factionSelect = document.getElementById("cardPoolFactionSelect");
  if (factionSelect) factionSelect.value = CARD_POOL_STATE.faction || "all";
  const kindSelect = document.getElementById("cardPoolKindSelect");
  if (kindSelect) kindSelect.value = CARD_POOL_STATE.kind || "all";
  const roleSelect = document.getElementById("cardPoolRoleSelect");
  if (roleSelect) roleSelect.value = CARD_POOL_STATE.role || "all";
  const originSelect = document.getElementById("cardPoolOriginSelect");
  if (originSelect) originSelect.value = CARD_POOL_STATE.origin || "all";
  const searchInput = document.getElementById("cardPoolSearchInput");
  if (searchInput && searchInput.value !== (CARD_POOL_STATE.search || "")) searchInput.value = CARD_POOL_STATE.search || "";
}

function cardPoolSetViewMode(mode) {
  CARD_POOL_STATE.viewMode = mode === "table" ? "table" : "gallery";
  if (typeof document !== "undefined") {
    const tableWrap = document.getElementById("cardPoolTableWrap");
    const galleryWrap = document.getElementById("cardPoolGalleryWrap");
    const tableBtn = document.getElementById("cardPoolViewTableBtn");
    const galleryBtn = document.getElementById("cardPoolViewGalleryBtn");
    if (tableWrap) tableWrap.hidden = CARD_POOL_STATE.viewMode !== "table";
    if (galleryWrap) galleryWrap.hidden = CARD_POOL_STATE.viewMode !== "gallery";
    if (tableBtn) tableBtn.classList.toggle("active", CARD_POOL_STATE.viewMode === "table");
    if (galleryBtn) galleryBtn.classList.toggle("active", CARD_POOL_STATE.viewMode === "gallery");
  }
}

function cardPoolSummaryHtml(counts) {
  return `
    <div class="deckBuilderStatus good">
      <strong>Card Pool Gallery</strong>
      <span>${counts.filtered}/${counts.total} carte visibili · ${counts.unit} unità · ${counts.tactic} tattiche · ${counts.mission} Missioni · ${counts.custom} custom · ${counts.factions} fazioni</span>
    </div>
    <div class="deckBuilderRuleBox">
      <strong>F9K2:</strong> browser read-only del catalogo con filtro origine, badge CUSTOM, duplicazione sicura in editor e custom library separata.
      Apertura ottimizzata su Nexus + Unità per evitare il render iniziale di tutto il catalogo.
    </div>`;
}

function cardPoolRowsHtml(cards) {
  if (!cards.length) return `<tr><td colspan="8">Nessuna carta corrisponde ai filtri impostati.</td></tr>`;
  return cards.map(card => {
    const selected = CARD_POOL_STATE.selectedCardId === card.id ? "cardPoolSelectedRow" : "";
    const entry = typeof cardAssetEntryFor === "function" ? cardAssetEntryFor(card) : null;
    const artHint = entry && entry.fileId ? entry.fileId : (card.sourceId || card.id || "");
    return `<tr class="${selected}" data-card-pool-select="${cardPoolEscapeHtml(card.id)}">
      <td><button class="miniBtn" type="button" data-card-pool-select-btn="${cardPoolEscapeHtml(card.id)}">Vedi</button></td>
      <td>${cardPoolEscapeHtml(card.faction || "—")}</td>
      <td><strong>${cardPoolEscapeHtml(card.name || "Carta")}</strong><span>${cardPoolEscapeHtml(card.id || "")}</span></td>
      <td>${cardPoolEscapeHtml(cardPoolKind(card) === "mission" ? "Missione" : (cardPoolKind(card) === "tactic" ? "Tattica" : "Unità"))}${card.custom ? ` <span class="cardPoolCustomBadge">CUSTOM</span>` : ""}</td>
      <td>${cardPoolEscapeHtml(cardPoolRoleLabel(card))}</td>
      <td>${cardPoolEscapeHtml(cardPoolTypeLabel(card))}</td>
      <td>${Number.isFinite(card.cost) ? card.cost : "—"}</td>
      <td><code>${cardPoolEscapeHtml(artHint)}</code></td>
    </tr>`;
  }).join("");
}

function cardPoolGalleryHtml(cards) {
  if (!cards.length) return `<div class="deckBuilderRuleBox">Nessuna carta corrisponde ai filtri impostati.</div>`;
  return cards.map(card => {
    const selected = CARD_POOL_STATE.selectedCardId === card.id ? " cardPoolGalleryItemSelected" : "";
    return `<button class="cardPoolGalleryItem${selected}${card.custom ? " cardPoolGalleryItemCustom" : ""}" type="button" data-card-pool-gallery-select="${cardPoolEscapeHtml(card.id)}" aria-label="Seleziona ${cardPoolEscapeHtml(card.name || card.id || 'carta')}">
      ${card.custom ? `<span class="cardPoolGalleryCustomCorner">CUSTOM</span>` : ""}
      <canvas class="cardPoolGalleryCanvas" data-card-pool-gallery-canvas="${cardPoolEscapeHtml(card.id)}"></canvas>
      <span class="cardPoolGalleryName">${cardPoolEscapeHtml(card.name || "Carta")}</span>
      <span class="cardPoolGalleryMeta">${cardPoolEscapeHtml(card.id || "")} · ${cardPoolEscapeHtml(cardPoolRoleLabel(card))}</span>
    </button>`;
  }).join("");
}

function cardPoolRenderGalleryCanvases(cards) {
  if (typeof document === "undefined" || typeof renderArenaCardPreviewCanvas !== "function") return;
  const list = Array.isArray(cards) ? cards : cardPoolFilteredCards();
  const canvases = new Map();
  document.querySelectorAll("[data-card-pool-gallery-canvas]").forEach(canvas => {
    canvases.set(canvas.getAttribute("data-card-pool-gallery-canvas"), canvas);
  });
  list.forEach(card => {
    const canvas = canvases.get(card.id);
    if (!canvas) return;
    renderArenaCardPreviewCanvas(canvas, card, { scale: CARD_POOL_GALLERY_THUMB_SCALE });
  });
}

function cardPoolPreviewStatsHtml(card) {
  if (!card) return "";
  return `<div class="deckBuilderPreviewStats">
    <span><strong>Fazione</strong> ${cardPoolEscapeHtml(card.faction || "—")}</span>
    <span><strong>Tipo</strong> ${cardPoolEscapeHtml(cardPoolTypeLabel(card))}</span>
    <span><strong>Ruolo</strong> ${cardPoolEscapeHtml(cardPoolRoleLabel(card))}</span>
    <span><strong>ENE</strong> ${Number.isFinite(typeof cardRendererStat === "function" ? cardRendererStat(card, "cost") : card.cost) ? (typeof cardRendererStat === "function" ? cardRendererStat(card, "cost") : card.cost) : "—"}</span>
    ${card.sourceType !== "tactic" && card.sourceType !== "mission" && typeof cardRendererStat === "function" ? `
      <span><strong>HP</strong> ${Number.isFinite(cardRendererStat(card, "hp")) ? cardRendererStat(card, "hp") : "—"}</span>
      <span><strong>DEF</strong> ${Number.isFinite(cardRendererStat(card, "def")) ? cardRendererStat(card, "def") : "—"}</span>
      <span><strong>ATT</strong> ${Number.isFinite(cardRendererStat(card, "att")) ? cardRendererStat(card, "att") : "—"}</span>` : ""}
  </div>`;
}

function cardPoolUpdateNavButtons(cards = null) {
  if (typeof document === "undefined") return;
  const list = Array.isArray(cards) ? cards : cardPoolFilteredCards();
  const index = cardPoolFilteredIndexByCardId(CARD_POOL_STATE.selectedCardId, list);
  const prev = document.getElementById("cardPoolPrevBtn");
  const next = document.getElementById("cardPoolNextBtn");
  const status = document.getElementById("cardPoolSelectionCounter");
  if (prev) prev.disabled = !(index > 0);
  if (next) next.disabled = !(index >= 0 && index < list.length - 1);
  if (status) status.textContent = list.length ? `${Math.max(0, index) + 1}/${list.length}` : "0/0";
  const modalStatus = document.getElementById("cardPoolFullscreenCounter");
  if (modalStatus) modalStatus.textContent = status ? status.textContent : (list.length ? `${Math.max(0, index) + 1}/${list.length}` : "0/0");
}

function cardPoolSelectRelative(step) {
  const list = cardPoolFilteredCards();
  if (!list.length) return false;
  let index = cardPoolFilteredIndexByCardId(CARD_POOL_STATE.selectedCardId, list);
  if (index < 0) index = 0;
  const target = Math.min(list.length - 1, Math.max(0, index + step));
  return cardPoolSelectCard(list[target].id, "cardPoolNav");
}

function cardPoolRenderFocusMode(card) {
  // F9K1b: il focus usa la stessa preview principale. Nessun canvas duplicato.
  void card;
}

function cardPoolOpenFullscreen() {
  if (typeof document === "undefined") return;
  CARD_POOL_STATE.focusMode = true;
  document.body.classList.add("cardPoolFocusMode");
  const selected = cardPoolEnsureSelected();
  renderCardPoolPreview(selected);
  cardPoolUpdateNavButtons();
}

function cardPoolCloseFullscreen() {
  if (typeof document === "undefined") return;
  CARD_POOL_STATE.focusMode = false;
  document.body.classList.remove("cardPoolFocusMode");
  cardPoolUpdateNavButtons();
}

function renderCardPoolPreview(card = null) {
  if (typeof document === "undefined") return null;
  const selected = card || cardPoolEnsureSelected();
  const canvas = document.getElementById("cardPoolPreviewCanvas");
  const meta = document.getElementById("cardPoolPreviewMeta");
  const body = document.getElementById("cardPoolPreviewBody");
  if (!canvas || !meta || !body) return selected;

  if (typeof renderArenaCardPreviewCanvas === "function") renderArenaCardPreviewCanvas(canvas, selected || null);
  if (!selected) {
    meta.textContent = "Nessuna carta selezionata.";
    body.innerHTML = `<div class="deckBuilderPreviewHelp">Seleziona una carta dal pool.</div>`;
    cardPoolRenderFocusMode(null);
    return null;
  }

  const entry = typeof cardAssetEntryFor === "function" ? cardAssetEntryFor(selected) : null;
  const duplicateButton = document.getElementById("cardPoolDuplicateSelectedBtn");
  if (duplicateButton) {
    duplicateButton.disabled = selected.sourceType === "mission";
    duplicateButton.title = selected.sourceType === "mission" ? "Le Missioni ufficiali non sono duplicabili nel Card Editor in F9N4." : "";
  }
  const desc = typeof cardRendererDescriptionText === "function" ? cardRendererNormalizeDescription(cardRendererDescriptionText(selected)) : (selected.effectText || "");
  meta.textContent = `${selected.faction || "—"} · ${selected.sourceType === "mission" ? "Missione" : (selected.sourceType === "tactic" ? "Tattica" : "Unità")} · ${selected.id || ""}`;
  body.innerHTML = `
    ${cardPoolPreviewStatsHtml(selected)}
    <div class="deckBuilderPreviewDesc">${cardPoolEscapeHtml(desc || "Nessun testo descrittivo disponibile nel catalogo.")}</div>
    ${typeof cardRendererPassiveBadgesHtml === "function" ? cardRendererPassiveBadgesHtml(selected, cardPoolEscapeHtml) : ""}
    <div class="deckBuilderPreviewPaths">
      <div><strong>Card ID:</strong> <code>${cardPoolEscapeHtml(selected.id || "")}</code></div>
      <div><strong>Source ID:</strong> <code>${cardPoolEscapeHtml(selected.sourceId || selected.blueprintId || selected.tacticId || "")}</code></div>
      <div><strong>Frame:</strong> <code>${cardPoolEscapeHtml(entry && entry.framePath || "")}</code></div>
      <div><strong>Art preferita:</strong> <code>${cardPoolEscapeHtml(entry && entry.artPath || "")}</code></div>
      <div><strong>Fallback art:</strong> <code>${cardPoolEscapeHtml(entry && entry.artCandidatePaths ? entry.artCandidatePaths.join(" | ") : "")}</code></div>
      <div><strong>Formato:</strong> <code>${cardPoolEscapeHtml(entry && entry.recommendedArtSize || "")}</code> · <code>${cardPoolEscapeHtml(entry && entry.recommendedColorDepth || "")}</code></div>
    </div>`;
  cardPoolRenderFocusMode(selected);
  cardPoolUpdateNavButtons();
  return selected;
}

function syncCardPoolSelection() {
  if (typeof document === "undefined") return;
  const selectedId = CARD_POOL_STATE.selectedCardId;
  document.querySelectorAll("[data-card-pool-select]").forEach(row => {
    row.classList.toggle("cardPoolSelectedRow", row.getAttribute("data-card-pool-select") === selectedId);
  });
  document.querySelectorAll("[data-card-pool-gallery-select]").forEach(item => {
    item.classList.toggle("cardPoolGalleryItemSelected", item.getAttribute("data-card-pool-gallery-select") === selectedId);
  });
}

function renderCardPoolScreen() {
  if (typeof document === "undefined") return;
  cardPoolPopulateFactionSelect();
  cardPoolSyncControls();
  const cards = cardPoolFilteredCards();
  const selected = cardPoolEnsureSelected(cards);
  const counts = cardPoolCounts();
  const summary = document.getElementById("cardPoolSummary");
  const body = document.getElementById("cardPoolTableBody");
  const gallery = document.getElementById("cardPoolGalleryBody");
  const meta = document.getElementById("cardPoolMetaLine");
  if (summary) summary.innerHTML = cardPoolSummaryHtml(counts);
  if (body) body.innerHTML = cardPoolRowsHtml(cards);
  if (gallery) gallery.innerHTML = cardPoolGalleryHtml(cards);
  if (meta) meta.textContent = `${typeof buildInfoLabel === "function" ? buildInfoLabel() : "build"} · Card Pool · ${counts.filtered}/${counts.total} carte · selezionata: ${selected ? selected.name : "nessuna"}`;
  cardPoolSetViewMode(CARD_POOL_STATE.viewMode);
  renderCardPoolPreview(selected);
  syncCardPoolSelection();
  cardPoolRenderGalleryCanvases(cards);
}

function openCardPoolScreen() {
  renderCardPoolScreen();
  if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.CARD_POOL);
}

function copyCardPoolSelectedJson() {
  const card = cardPoolCardById(CARD_POOL_STATE.selectedCardId);
  const payload = {
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    mode: "F9J2-card-pool-selected-card",
    card,
    asset: typeof cardAssetEntryFor === "function" && card ? cardAssetEntryFor(card) : null
  };
  const text = JSON.stringify(payload, null, 2);
  if (typeof arenaStorageCopyText === "function") return arenaStorageCopyText(text, "Carta pool copiata in JSON.");
  if (typeof navigator !== "undefined" && navigator.clipboard) return navigator.clipboard.writeText(text);
  return text;
}

function copyCardPoolManifestJson() {
  if (typeof copyCardAssetManifestJson === "function") return copyCardAssetManifestJson();
  const text = typeof cardAssetManifestJson === "function" ? cardAssetManifestJson() : JSON.stringify({ error:"manifest non disponibile" }, null, 2);
  if (typeof arenaStorageCopyText === "function") return arenaStorageCopyText(text, "Manifest asset carte copiato.");
  return text;
}

function initializeCardPoolScreen() {
  if (typeof document === "undefined") return;

  const factionSelect = document.getElementById("cardPoolFactionSelect");
  if (factionSelect && factionSelect.dataset.bound !== "1") {
    factionSelect.dataset.bound = "1";
    factionSelect.addEventListener("change", () => {
      CARD_POOL_STATE.faction = factionSelect.value || "all";
      renderCardPoolScreen();
    });
  }

  const kindSelect = document.getElementById("cardPoolKindSelect");
  if (kindSelect && kindSelect.dataset.bound !== "1") {
    kindSelect.dataset.bound = "1";
    kindSelect.addEventListener("change", () => {
      CARD_POOL_STATE.kind = kindSelect.value || "all";
      renderCardPoolScreen();
    });
  }

  const roleSelect = document.getElementById("cardPoolRoleSelect");
  if (roleSelect && roleSelect.dataset.bound !== "1") {
    roleSelect.dataset.bound = "1";
    roleSelect.addEventListener("change", () => {
      CARD_POOL_STATE.role = roleSelect.value || "all";
      renderCardPoolScreen();
    });
  }

  const originSelect = document.getElementById("cardPoolOriginSelect");
  if (originSelect && originSelect.dataset.bound !== "1") {
    originSelect.dataset.bound = "1";
    originSelect.addEventListener("change", () => {
      CARD_POOL_STATE.origin = originSelect.value || "all";
      renderCardPoolScreen();
    });
  }

  const searchInput = document.getElementById("cardPoolSearchInput");
  if (searchInput && searchInput.dataset.bound !== "1") {
    searchInput.dataset.bound = "1";
    searchInput.addEventListener("input", () => {
      CARD_POOL_STATE.search = searchInput.value || "";
      renderCardPoolScreen();
    });
  }

  const resetBtn = document.getElementById("cardPoolResetFiltersBtn");
  if (resetBtn && resetBtn.dataset.bound !== "1") {
    resetBtn.dataset.bound = "1";
    resetBtn.addEventListener("click", () => {
      CARD_POOL_STATE.faction = "Nexus";
      CARD_POOL_STATE.kind = "unit";
      CARD_POOL_STATE.role = "all";
      CARD_POOL_STATE.origin = "all";
      CARD_POOL_STATE.search = "";
      const search = document.getElementById("cardPoolSearchInput");
      if (search) search.value = "";
      renderCardPoolScreen();
    });
  }

  [["cardPoolCopySelectedBtn", copyCardPoolSelectedJson], ["cardPoolDuplicateSelectedBtn", cardPoolDuplicateSelectedInEditor], ["cardPoolCopyManifestBtn", copyCardPoolManifestJson], ["cardPoolPrevBtn", () => cardPoolSelectRelative(-1)], ["cardPoolNextBtn", () => cardPoolSelectRelative(1)], ["cardPoolFullscreenOpenBtn", cardPoolOpenFullscreen], ["cardPoolFullscreenCloseBtn", cardPoolCloseFullscreen]].forEach(([id, handler]) => {
    const el = document.getElementById(id);
    if (el && el.dataset.bound !== "1") {
      el.dataset.bound = "1";
      el.addEventListener("click", handler);
    }
  });

  [["cardPoolViewTableBtn", "table"], ["cardPoolViewGalleryBtn", "gallery"]].forEach(([id, mode]) => {
    const el = document.getElementById(id);
    if (el && el.dataset.bound !== "1") {
      el.dataset.bound = "1";
      el.addEventListener("click", () => cardPoolSetViewMode(mode));
    }
  });

  const screen = document.getElementById("cardPoolScreen");
  if (screen && screen.dataset.delegated !== "1") {
    screen.dataset.delegated = "1";
    screen.addEventListener("click", event => {
      const btn = event.target && event.target.closest ? event.target.closest("[data-card-pool-select-btn]") : null;
      if (btn) {
        event.preventDefault();
        cardPoolSelectCard(btn.getAttribute("data-card-pool-select-btn"), "cardPool");
        return;
      }
      const row = event.target && event.target.closest ? event.target.closest("[data-card-pool-select]") : null;
      if (row) {
        event.preventDefault();
        cardPoolSelectCard(row.getAttribute("data-card-pool-select"), "cardPool");
        return;
      }
      const item = event.target && event.target.closest ? event.target.closest("[data-card-pool-gallery-select]") : null;
      if (item) {
        event.preventDefault();
        cardPoolSelectCard(item.getAttribute("data-card-pool-gallery-select"), "cardPoolGallery");
        return;
      }
    });
  }

  document.addEventListener("keydown", event => {
    if (document.body && document.body.classList.contains("app-screen-card-pool")) {
      if (event.key === "ArrowLeft") cardPoolSelectRelative(-1);
      if (event.key === "ArrowRight") cardPoolSelectRelative(1);
      if (event.key === "Escape" && CARD_POOL_STATE.focusMode) cardPoolCloseFullscreen();
    }
  });

  renderCardPoolScreen();
}
