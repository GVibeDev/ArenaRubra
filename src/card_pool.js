"use strict";

// Arena Rubra – F9J1 Card Pool Screen Foundation.
// Browser carte read-only con preview renderer, filtri e riferimenti asset.
// Non modifica gameplay, deck rules, AI o stato partita.

const CARD_POOL_STATE = {
  faction: "all",
  kind: "all",
  role: "all",
  search: "",
  selectedCardId: ""
};

function cardPoolEscapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cardPoolCatalog() {
  return typeof buildCardCatalog === "function" ? buildCardCatalog() : [];
}

function cardPoolFactionList(catalog = null) {
  const source = catalog || cardPoolCatalog();
  return [...new Set(source.map(card => card && card.faction).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function cardPoolKind(card) {
  return card && card.sourceType === "tactic" ? "tactic" : "unit";
}

function cardPoolRole(card) {
  if (!card) return "unknown";
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
  if (card.sourceType === "tactic") return card.category ? `TATTICA · ${card.category}` : "TATTICA";
  return [card.unitType, card.weight].filter(Boolean).join(" ").toUpperCase() || "UNITÀ";
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

function cardPoolSelectCard(cardId, source = "pool") {
  const card = cardPoolCardById(cardId);
  if (!card) return false;
  CARD_POOL_STATE.selectedCardId = card.id;
  if (typeof cardRendererSelectCard === "function") cardRendererSelectCard(card.id, source);
  renderCardPoolPreview(card);
  syncCardPoolSelection();
  return true;
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

function cardPoolSummaryHtml(counts) {
  return `
    <div class="deckBuilderStatus good">
      <strong>Card Pool Foundation</strong>
      <span>${counts.filtered}/${counts.total} carte visibili · ${counts.unit} unità · ${counts.tactic} tattiche · ${counts.factions} fazioni</span>
    </div>
    <div class="deckBuilderRuleBox">
      <strong>F9J1:</strong> browser read-only del catalogo carte con filtri, ricerca, preview renderer e path asset.
      Le carte restano dati di catalogo: questa schermata non modifica deck, gameplay, bilanciamento o salvataggi.
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
      <td>${cardPoolEscapeHtml(cardPoolKind(card) === "tactic" ? "Tattica" : "Unità")}</td>
      <td>${cardPoolEscapeHtml(cardPoolRoleLabel(card))}</td>
      <td>${cardPoolEscapeHtml(cardPoolTypeLabel(card))}</td>
      <td>${Number.isFinite(card.cost) ? card.cost : "—"}</td>
      <td><code>${cardPoolEscapeHtml(artHint)}</code></td>
    </tr>`;
  }).join("");
}

function cardPoolPreviewStatsHtml(card) {
  if (!card) return "";
  return `<div class="deckBuilderPreviewStats">
    <span><strong>Fazione</strong> ${cardPoolEscapeHtml(card.faction || "—")}</span>
    <span><strong>Tipo</strong> ${cardPoolEscapeHtml(cardPoolTypeLabel(card))}</span>
    <span><strong>Ruolo</strong> ${cardPoolEscapeHtml(cardPoolRoleLabel(card))}</span>
    <span><strong>ENE</strong> ${Number.isFinite(typeof cardRendererStat === "function" ? cardRendererStat(card, "cost") : card.cost) ? (typeof cardRendererStat === "function" ? cardRendererStat(card, "cost") : card.cost) : "—"}</span>
    ${card.sourceType !== "tactic" && typeof cardRendererStat === "function" ? `
      <span><strong>HP</strong> ${Number.isFinite(cardRendererStat(card, "hp")) ? cardRendererStat(card, "hp") : "—"}</span>
      <span><strong>DEF</strong> ${Number.isFinite(cardRendererStat(card, "def")) ? cardRendererStat(card, "def") : "—"}</span>
      <span><strong>ATT</strong> ${Number.isFinite(cardRendererStat(card, "att")) ? cardRendererStat(card, "att") : "—"}</span>` : ""}
  </div>`;
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
    return null;
  }

  const entry = typeof cardAssetEntryFor === "function" ? cardAssetEntryFor(selected) : null;
  const desc = typeof cardRendererDescriptionText === "function" ? cardRendererNormalizeDescription(cardRendererDescriptionText(selected)) : (selected.effectText || "");
  meta.textContent = `${selected.faction || "—"} · ${selected.sourceType === "tactic" ? "Tattica" : "Unità"} · ${selected.id || ""}`;
  body.innerHTML = `
    ${cardPoolPreviewStatsHtml(selected)}
    <div class="deckBuilderPreviewDesc">${cardPoolEscapeHtml(desc || "Nessun testo descrittivo disponibile nel catalogo.")}</div>
    <div class="deckBuilderPreviewPaths">
      <div><strong>Card ID:</strong> <code>${cardPoolEscapeHtml(selected.id || "")}</code></div>
      <div><strong>Source ID:</strong> <code>${cardPoolEscapeHtml(selected.sourceId || selected.blueprintId || selected.tacticId || "")}</code></div>
      <div><strong>Frame:</strong> <code>${cardPoolEscapeHtml(entry && entry.framePath || "")}</code></div>
      <div><strong>Art preferita:</strong> <code>${cardPoolEscapeHtml(entry && entry.artPath || "")}</code></div>
      <div><strong>Fallback art:</strong> <code>${cardPoolEscapeHtml(entry && entry.artCandidatePaths ? entry.artCandidatePaths.join(" | ") : "")}</code></div>
      <div><strong>Formato:</strong> <code>${cardPoolEscapeHtml(entry && entry.recommendedArtSize || "")}</code> · <code>${cardPoolEscapeHtml(entry && entry.recommendedColorDepth || "")}</code></div>
    </div>`;
  return selected;
}

function syncCardPoolSelection() {
  if (typeof document === "undefined") return;
  const selectedId = CARD_POOL_STATE.selectedCardId;
  document.querySelectorAll("[data-card-pool-select]").forEach(row => {
    row.classList.toggle("cardPoolSelectedRow", row.getAttribute("data-card-pool-select") === selectedId);
  });
}

function renderCardPoolScreen() {
  if (typeof document === "undefined") return;
  cardPoolPopulateFactionSelect();
  const cards = cardPoolFilteredCards();
  const selected = cardPoolEnsureSelected(cards);
  const counts = cardPoolCounts();
  const summary = document.getElementById("cardPoolSummary");
  const body = document.getElementById("cardPoolTableBody");
  const meta = document.getElementById("cardPoolMetaLine");
  if (summary) summary.innerHTML = cardPoolSummaryHtml(counts);
  if (body) body.innerHTML = cardPoolRowsHtml(cards);
  if (meta) meta.textContent = `${typeof buildInfoLabel === "function" ? buildInfoLabel() : "build"} · Card Pool · ${counts.filtered}/${counts.total} carte · selezionata: ${selected ? selected.name : "nessuna"}`;
  renderCardPoolPreview(selected);
  syncCardPoolSelection();
}

function openCardPoolScreen() {
  renderCardPoolScreen();
  if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.CARD_POOL);
}

function copyCardPoolSelectedJson() {
  const card = cardPoolCardById(CARD_POOL_STATE.selectedCardId);
  const payload = {
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    mode: "F9J1-card-pool-selected-card",
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
      CARD_POOL_STATE.faction = "all";
      CARD_POOL_STATE.kind = "all";
      CARD_POOL_STATE.role = "all";
      CARD_POOL_STATE.search = "";
      const search = document.getElementById("cardPoolSearchInput");
      if (search) search.value = "";
      renderCardPoolScreen();
    });
  }

  const copyBtn = document.getElementById("cardPoolCopySelectedBtn");
  if (copyBtn && copyBtn.dataset.bound !== "1") {
    copyBtn.dataset.bound = "1";
    copyBtn.addEventListener("click", copyCardPoolSelectedJson);
  }

  const manifestBtn = document.getElementById("cardPoolCopyManifestBtn");
  if (manifestBtn && manifestBtn.dataset.bound !== "1") {
    manifestBtn.dataset.bound = "1";
    manifestBtn.addEventListener("click", copyCardPoolManifestJson);
  }

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
      }
    });
  }

  renderCardPoolScreen();
}
