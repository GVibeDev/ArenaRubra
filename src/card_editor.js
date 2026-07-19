"use strict";

// Arena Rubra – F9N1 Card Editor + Runtime-safe custom unit/tactic data.
// Crea e gestisce carte custom separate dal catalogo ufficiale, con import immagine e allineamento art permanente.
// F9K6b collega al runtime anche apply_status tramite whitelist sicura; le carte ufficiali restano read-only.

const CARD_EDITOR_STORAGE_KEY = "arenaRubra.customCards.v1";

const CARD_EDITOR_BUDGET = Object.freeze({
  1: { maxStats: 4, ability: "passive_only", label: "max 4 HP+DEF+ATT + passiva" },
  2: { maxStats: 7, ability: "single", label: "max 7 HP+DEF+ATT + passiva o attiva" },
  3: { maxStats: 10, ability: "single", label: "max 10 HP+DEF+ATT + passiva o attiva" },
  4: { maxStats: 14, ability: "both", label: "max 14 HP+DEF+ATT + passiva e/o attiva" },
  5: { maxStats: 18, ability: "both", label: "max 18 HP+DEF+ATT + passiva e/o attiva" },
  6: { maxStats: 22, ability: "both", label: "max 22 HP+DEF+ATT + passiva e/o attiva" },
  7: { maxStats: 27, ability: "both", label: "max 27 HP+DEF+ATT + passiva e/o attiva" }
});

const CARD_EDITOR_ACTIVE_EFFECTS = Object.freeze({
  none: { label: "Nessuna attiva" },
  damage: { label: "Danno", target: "enemy", valueLabel: "Danno" },
  heal: { label: "Cura HP", target: "ally", valueLabel: "HP curati" },
  restore_def: { label: "Ripristina DEF", target: "ally", valueLabel: "DEF recuperata" },
  shred_def: { label: "Rimuovi DEF", target: "enemy", valueLabel: "DEF rimossa" },
  buff_att: { label: "Buff ATT", target: "ally", valueLabel: "ATT bonus" },
  buff_def: { label: "Buff DEF", target: "ally", valueLabel: "DEF bonus" },
  apply_status: { label: "Applica stato", target: "any", valueLabel: "Valore stato" },
  draw_card: { label: "Pesca carta", target: "self", valueLabel: "Carte" },
  gain_energy: { label: "Ottieni ENE", target: "self", valueLabel: "ENE" },
  cell_blast: { label: "Danno area su cella", target: "any", valueLabel: "Danno", tacticOnly: true },
  custom_text_only: { label: "Descrittiva / futura", target: "any", valueLabel: "Valore" }
});

const CARD_EDITOR_STATUS_OPTIONS = Object.freeze({
  inhibit_action: { label: "Inibizione azione", statusKind: "inhibit_action", target: "enemy", valueDefault: 0, valueMin: 0, valueMax: 0, turnsDefault: 1, turnsMin: 1, turnsMax: 1, text: "Non può muovere, attaccare o usare abilità." },
  inhibit_attack: { label: "Inibizione attacco", statusKind: "inhibit_attack", target: "enemy", valueDefault: 0, valueMin: 0, valueMax: 0, turnsDefault: 1, turnsMin: 1, turnsMax: 2, text: "Non può attaccare." },
  inhibit_move: { label: "Inibizione movimento", statusKind: "inhibit_move", target: "enemy", valueDefault: 0, valueMin: 0, valueMax: 0, turnsDefault: 1, turnsMin: 1, turnsMax: 2, text: "Non può muovere." },
  bleed: { label: "Sanguinamento", statusKind: "bleed", target: "enemy", valueDefault: 1, valueMin: 1, valueMax: 3, turnsDefault: 2, turnsMin: 1, turnsMax: 3, text: "Subisce danno diretto a inizio turno." },
  thorns: { label: "Spine", statusKind: "thorns", target: "ally", valueDefault: 1, valueMin: 1, valueMax: 3, turnsDefault: 1, turnsMin: 1, turnsMax: 2, text: "Chi attacca il bersaglio subisce danno diretto." }
});

const CARD_EDITOR_PASSIVE_EFFECTS = Object.freeze({
  none: { label: "Nessuna passiva" },
  vanguard: { label: "Avanguardia" },
  bleed_immune: { label: "Immune a sanguinamento" },
  anti_structure_bonus: { label: "+ATT contro strutture" },
  ps_bonus_att: { label: "Bonus ATT su PS" },
  ps_bonus_def: { label: "Bonus DEF su PS" },
  thorns: { label: "Spine / contrattacco" },
  aura_att: { label: "Aura ATT alleata" },
  aura_def: { label: "Aura DEF alleata" },
  custom_text_only: { label: "Descrittiva / futura" }
});

const CARD_EDITOR_FACTION_KEYS = Object.freeze({
  Nexus: "NX",
  Exordium: "EX",
  Liberti: "LB",
  Agathoi: "AG",
  Fabeot: "FB"
});

const cardEditorState = {
  selectedCustomId: "",
  librarySearch: "",
  libraryKind: "all",
  libraryFaction: "all",
  customArt: null
};

function cardEditorEscapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cardEditorNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function cardEditorInt(value, fallback = 0) {
  return Math.max(0, Math.round(cardEditorNumber(value, fallback)));
}

function cardEditorClampInt(value, fallback, min, max) {
  const n = cardEditorInt(value, fallback);
  const lo = Number.isFinite(min) ? min : 0;
  const hi = Number.isFinite(max) ? max : Infinity;
  return Math.max(lo, Math.min(hi, n));
}

function cardEditorStatusOption(key = null) {
  const raw = key || cardEditorFormValue("cardEditorActiveStatusKind", "inhibit_attack");
  return CARD_EDITOR_STATUS_OPTIONS[raw] || CARD_EDITOR_STATUS_OPTIONS.inhibit_attack;
}

function cardEditorStatusKeyForKind(statusKind) {
  const wanted = String(statusKind || "");
  return Object.keys(CARD_EDITOR_STATUS_OPTIONS).find(key => CARD_EDITOR_STATUS_OPTIONS[key].statusKind === wanted) || "";
}

function cardEditorStatusRuntimeAllowed(statusKind) {
  const key = cardEditorStatusKeyForKind(statusKind);
  const opt = CARD_EDITOR_STATUS_OPTIONS[key];
  if (!opt || opt.statusKind !== statusKind) return false;
  return typeof STATUS_DEFINITIONS === "undefined" || Boolean(STATUS_DEFINITIONS[statusKind]);
}

function cardEditorStatusDescription(active) {
  if (!active || active.kind !== "apply_status") return "";
  const opt = cardEditorStatusOption(active.statusKey || cardEditorStatusKeyForKind(active.statusKind));
  const valueText = (opt.valueMax || 0) > 0 ? ` valore ${active.value}` : "";
  const targetText = opt.target === "ally" ? "a una unità alleata" : "a una unità nemica";
  return `Applica ${opt.label} per ${active.statusTurns || opt.turnsDefault || 1} turno/i${valueText} ${targetText} entro R${active.range || 0}. ${opt.text || ""}`.trim();
}

function cardEditorStorageAvailable() {
  try {
    if (typeof localStorage === "undefined") return false;
    const key = "__arenaRubraCardEditorProbe__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch (_) {
    return false;
  }
}

function cardEditorReadCustomCards() {
  if (!cardEditorStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(CARD_EDITOR_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(card => card && card.custom === true) : [];
  } catch (err) {
    console.warn("Card Editor: custom cards non leggibili", err);
    return [];
  }
}

function cardEditorWriteCustomCards(cards) {
  if (!cardEditorStorageAvailable()) return false;
  try {
    localStorage.setItem(CARD_EDITOR_STORAGE_KEY, JSON.stringify(Array.isArray(cards) ? cards : [], null, 2));
    return true;
  } catch (err) {
    console.warn("Card Editor: salvataggio custom cards fallito", err);
    return false;
  }
}

function cardEditorCustomCards() {
  return cardEditorReadCustomCards();
}

function cardEditorCatalogWithCustom(baseCatalog = null) {
  const official = Array.isArray(baseCatalog)
    ? baseCatalog
    : (typeof buildCardCatalog === "function" ? buildCardCatalog() : []);
  const officialIds = new Set(official.map(card => card && card.id).filter(Boolean));
  const custom = cardEditorCustomCards().filter(card => card && card.id && !officialIds.has(card.id));
  return [...official, ...custom];
}

function cardEditorFactionList() {
  if (typeof FACTIONS !== "undefined" && FACTIONS) return Object.keys(FACTIONS);
  return ["Nexus", "Exordium", "Liberti", "Agathoi", "Fabeot"];
}

function cardEditorFactionCode(faction) {
  return CARD_EDITOR_FACTION_KEYS[faction] || String(faction || "CU").slice(0, 2).toUpperCase();
}

function cardEditorSlug(value) {
  const raw = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleaned = raw.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
  return cleaned || "CUSTOM";
}

function cardEditorNextSourceId(kind, faction, name) {
  const prefix = `CUS_${cardEditorFactionCode(faction)}_${kind === "tactic" ? "TAC" : "UNIT"}`;
  const slug = cardEditorSlug(name || "NUOVA_CARTA").slice(0, 28);
  const existing = new Set(cardEditorCustomCards().map(card => card && card.sourceId).filter(Boolean));
  let n = 1;
  let id = `${prefix}_${slug}`;
  while (existing.has(id)) {
    n += 1;
    id = `${prefix}_${slug}_${String(n).padStart(2, "0")}`;
  }
  return id;
}

function cardEditorCardId(kind, sourceId) {
  return `CUSTOM:${kind === "tactic" ? "TACTIC" : "UNIT"}:${sourceId}`;
}

function cardEditorRoleForUnit(unitType, weight) {
  if (unitType === "Comandante") return "commander";
  if (weight === "Pivot") return "pivot";
  if (weight === "Elite") return "elite";
  if (String(weight || "").toLowerCase().startsWith("pesant")) return "heavy";
  return "base";
}

function cardEditorCardTypeForUnit(unitType, weight) {
  if (unitType === "Comandante") return "commander";
  if (weight === "Pivot") return "pivot";
  if (unitType === "Struttura") return "unit_structure";
  if (unitType === "Veicolo") return "unit_vehicle";
  if (unitType === "Fanteria") return "unit_infantry";
  return "unit";
}

function cardEditorBudgetForCost(cost) {
  return CARD_EDITOR_BUDGET[Math.max(1, Math.min(7, cardEditorInt(cost, 1)))] || CARD_EDITOR_BUDGET[1];
}

function cardEditorAbilityAllowanceText(cost) {
  const b = cardEditorBudgetForCost(cost);
  if (b.ability === "passive_only") return "solo passiva";
  if (b.ability === "single") return "passiva o attiva";
  return "passiva e/o attiva";
}

function cardEditorFormValue(id, fallback = "") {
  const el = typeof document !== "undefined" ? document.getElementById(id) : null;
  if (!el) return fallback;
  if (el.type === "checkbox") return Boolean(el.checked);
  return el.value ?? fallback;
}

function cardEditorSetFormValue(id, value) {
  const el = typeof document !== "undefined" ? document.getElementById(id) : null;
  if (!el) return;
  if (el.type === "checkbox") el.checked = Boolean(value);
  else el.value = value;
}

function cardEditorArtTarget(kind = null, preset = null) {
  const sourceKind = kind || cardEditorFormValue("cardEditorKind", "unit");
  const sourcePreset = preset || cardEditorFormValue("cardEditorArtPreset", "recommended");
  const unit = sourceKind !== "tactic";
  const base = unit
    ? { width: 800, height: 780, highWidth: 1600, highHeight: 1560, label: "Unità" }
    : { width: 800, height: 670, highWidth: 1600, highHeight: 1340, label: "Tattica" };
  const high = sourcePreset === "high";
  return {
    kind: unit ? "unit" : "tactic",
    label: base.label,
    width: high ? base.highWidth : base.width,
    height: high ? base.highHeight : base.height,
    recommended: `${base.width}×${base.height}px`,
    highRes: `${base.highWidth}×${base.highHeight}px`
  };
}

function cardEditorCurrentCustomArt() {
  return cardEditorState.customArt && cardEditorState.customArt.dataUrl ? { ...cardEditorState.customArt } : null;
}

function cardEditorSetCustomArt(art = null) {
  cardEditorState.customArt = art && art.dataUrl ? { ...art } : null;
}

function cardEditorArtTransformFromForm() {
  return {
    zoom: Math.max(0.2, Math.min(3, cardEditorNumber(cardEditorFormValue("cardEditorArtZoom", "1"), 1))),
    offsetX: Math.max(-600, Math.min(600, cardEditorNumber(cardEditorFormValue("cardEditorArtOffsetX", "0"), 0))),
    offsetY: Math.max(-600, Math.min(600, cardEditorNumber(cardEditorFormValue("cardEditorArtOffsetY", "0"), 0)))
  };
}

function cardEditorSetArtTransform(transform = null) {
  const t = transform || { zoom: 1, offsetX: 0, offsetY: 0 };
  cardEditorSetFormValue("cardEditorArtZoom", Number.isFinite(t.zoom) ? t.zoom : 1);
  cardEditorSetFormValue("cardEditorArtOffsetX", Number.isFinite(t.offsetX) ? t.offsetX : 0);
  cardEditorSetFormValue("cardEditorArtOffsetY", Number.isFinite(t.offsetY) ? t.offsetY : 0);
}

function cardEditorResetArtTransform() {
  cardEditorSetArtTransform({ zoom: 1, offsetX: 0, offsetY: 0 });
  renderCardEditorPreview();
}

function cardEditorFileSizeLabel(bytes) {
  const n = Number(bytes || 0);
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function cardEditorReadFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Lettura file fallita."));
    reader.readAsDataURL(file);
  });
}

function cardEditorLoadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Immagine non caricabile."));
    img.src = dataUrl;
  });
}

async function cardEditorProcessArtDataUrl(dataUrl, originalName = "custom-art") {
  const img = await cardEditorLoadImageFromDataUrl(dataUrl);
  const target = cardEditorArtTarget();
  const format = cardEditorFormValue("cardEditorArtFormat", "webp");
  const quality = Math.max(0.5, Math.min(0.95, cardEditorNumber(cardEditorFormValue("cardEditorArtQuality", "0.82"), 0.82)));
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
  const drawW = Math.max(1, Math.round(img.width * scale));
  const drawH = Math.max(1, Math.round(img.height * scale));
  const drawX = Math.round((canvas.width - drawW) / 2);
  const drawY = Math.round((canvas.height - drawH) / 2);
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  const mime = format === "png" ? "image/png" : (format === "jpeg" ? "image/jpeg" : "image/webp");
  let out = "";
  try {
    out = canvas.toDataURL(mime, format === "png" ? undefined : quality);
  } catch (_) {
    out = canvas.toDataURL("image/png");
  }
  return {
    dataUrl: out,
    format,
    originalName,
    originalWidth: img.width,
    originalHeight: img.height,
    outputWidth: canvas.width,
    outputHeight: canvas.height,
    sourceKind: target.kind,
    targetPreset: cardEditorFormValue("cardEditorArtPreset", "recommended"),
    quality,
    importedAt: new Date().toISOString(),
    embedded: true
  };
}

async function cardEditorImportArtFile(event) {
  const file = event && event.target && event.target.files && event.target.files[0];
  if (!file) return false;
  const status = typeof document !== "undefined" ? document.getElementById("cardEditorArtStatus") : null;
  if (status) status.textContent = "Importazione immagine in corso...";
  try {
    const raw = await cardEditorReadFileAsDataUrl(file);
    const art = await cardEditorProcessArtDataUrl(raw, file.name || "custom-art");
    cardEditorSetCustomArt(art);
    if (status) status.textContent = `Illustrazione allegata: ${art.outputWidth}×${art.outputHeight}px · ${String(art.format).toUpperCase()} · ${cardEditorFileSizeLabel(Math.ceil((art.dataUrl.length * 3) / 4))}.`;
    renderCardEditorPreview();
    return true;
  } catch (err) {
    console.error("Card Editor: import immagine fallito", err);
    if (status) status.textContent = `Import immagine fallito: ${err && err.message ? err.message : err}`;
    return false;
  }
}

async function cardEditorReprocessArt() {
  const art = cardEditorCurrentCustomArt();
  if (!art || !art.dataUrl) return false;
  try {
    const next = await cardEditorProcessArtDataUrl(art.dataUrl, art.originalName || "custom-art");
    cardEditorSetCustomArt(next);
    renderCardEditorPreview();
    return true;
  } catch (err) {
    console.error("Card Editor: riapplica preset fallito", err);
    return false;
  }
}

function cardEditorClearArt() {
  cardEditorSetCustomArt(null);
  const file = typeof document !== "undefined" ? document.getElementById("cardEditorArtFile") : null;
  if (file) file.value = "";
  renderCardEditorPreview();
}

function cardEditorCopyArtTransformJson() {
  const payload = {
    mode: "F9K2b-card-art-transform",
    transform: cardEditorArtTransformFromForm()
  };
  const text = JSON.stringify(payload, null, 2);
  if (typeof arenaStorageCopyText === "function") return arenaStorageCopyText(text, "Transform immagine copiato in JSON.");
  if (typeof navigator !== "undefined" && navigator.clipboard) return navigator.clipboard.writeText(text);
  if (typeof prompt === "function") prompt("Copia JSON transform immagine:", text);
  return text;
}

function cardEditorDisplayArtPath(card, entry = null) {
  const art = card && card.customArt;
  const raw = String(entry && entry.artPath || "");
  if (art && art.dataUrl) {
    return art.originalName || "immagine-custom-incorporata";
  }
  if (raw.startsWith("data:")) {
    return entry && entry.embeddedMeta && entry.embeddedMeta.originalName
      ? entry.embeddedMeta.originalName
      : "immagine-custom-incorporata";
  }
  return raw;
}

function cardEditorArtMetaHtml(card) {
  const art = card && card.customArt;
  const transform = card && card.customArtTransform;
  const target = cardEditorArtTarget(card && card.sourceType, art && art.targetPreset);
  if (!art || !art.dataUrl) {
    return `<div class="deckBuilderRuleBox warn">Nessuna immagine custom allegata. ${target.label}: consigliata ${target.recommended}; alta risoluzione ${target.highRes}.</div>`;
  }
  return `<div class="deckBuilderPreviewPaths">
    <div><strong>Immagine custom:</strong> <code>${cardEditorEscapeHtml(art.originalName || "custom-art")}</code></div>
    <div><strong>Originale:</strong> <code>${cardEditorEscapeHtml(`${art.originalWidth || "?"}×${art.originalHeight || "?"}`)}</code> · <strong>Salvata:</strong> <code>${cardEditorEscapeHtml(`${art.outputWidth || "?"}×${art.outputHeight || "?"}`)}</code></div>
    <div><strong>Formato:</strong> <code>${cardEditorEscapeHtml(String(art.format || "?").toUpperCase())}</code> · <strong>Peso stimato:</strong> <code>${cardEditorEscapeHtml(cardEditorFileSizeLabel(Math.ceil(((art.dataUrl || "").length * 3) / 4)))}</code></div>
    <div><strong>Transform:</strong> <code>zoom ${cardEditorEscapeHtml(transform && transform.zoom || 1)}</code> · <code>x ${cardEditorEscapeHtml(transform && transform.offsetX || 0)}</code> · <code>y ${cardEditorEscapeHtml(transform && transform.offsetY || 0)}</code></div>
  </div>`;
}

function cardEditorUpdateArtPanel(card) {
  if (typeof document === "undefined") return;
  const target = cardEditorArtTarget(card && card.sourceType);
  const hint = document.getElementById("cardEditorArtResolutionHint");
  if (hint) hint.innerHTML = `${target.label}: consigliata <strong>${target.recommended}</strong>; alta risoluzione <strong>${target.highRes}</strong>.`;
  const img = document.getElementById("cardEditorArtPreviewImg");
  const meta = document.getElementById("cardEditorArtMeta");
  const status = document.getElementById("cardEditorArtStatus");
  const art = card && card.customArt;
  if (img) {
    if (art && art.dataUrl) {
      img.hidden = false;
      img.src = art.dataUrl;
    } else {
      img.hidden = true;
      img.removeAttribute("src");
    }
  }
  if (meta) meta.innerHTML = cardEditorArtMetaHtml(card);
  if (status && art && art.dataUrl) status.textContent = "Illustrazione custom pronta e inclusa nella carta custom.";
  if (status && (!art || !art.dataUrl)) status.textContent = "Nessuna immagine custom allegata.";
}

function cardEditorActiveEffectFromForm() {
  const kind = cardEditorFormValue("cardEditorActiveKind", "none");
  if (!kind || kind === "none") return null;
  const def = CARD_EDITOR_ACTIVE_EFFECTS[kind] || CARD_EDITOR_ACTIVE_EFFECTS.custom_text_only;
  let value = cardEditorInt(cardEditorFormValue("cardEditorActiveValue", "1"), 1);
  const range = cardEditorInt(cardEditorFormValue("cardEditorActiveRange", "1"), 1);
  const cost = cardEditorInt(cardEditorFormValue("cardEditorActiveCost", "0"), 0);
  const cooldown = cardEditorInt(cardEditorFormValue("cardEditorActiveCooldown", "1"), 1);
  let target = cardEditorFormValue("cardEditorActiveTarget", def.target || "any");
  const filter = cardEditorFormValue("cardEditorActiveFilter", "any");
  let description = cardEditorFormValue("cardEditorActiveDescription", "").trim();
  const out = {
    kind,
    label: def.label || kind,
    value,
    range,
    cost,
    cooldown,
    target,
    filter,
    description
  };

  if (kind === "apply_status") {
    const statusKey = cardEditorFormValue("cardEditorActiveStatusKind", "inhibit_attack");
    const opt = cardEditorStatusOption(statusKey);
    value = cardEditorClampInt(cardEditorFormValue("cardEditorActiveValue", opt.valueDefault || 0), opt.valueDefault || 0, opt.valueMin || 0, Number.isFinite(opt.valueMax) ? opt.valueMax : 0);
    const turns = cardEditorClampInt(cardEditorFormValue("cardEditorActiveStatusTurns", opt.turnsDefault || 1), opt.turnsDefault || 1, opt.turnsMin || 1, opt.turnsMax || 1);
    target = opt.target || "enemy";
    out.label = `Applica ${opt.label}`;
    out.value = value;
    out.target = target;
    out.statusKey = statusKey;
    out.statusKind = opt.statusKind;
    out.statusLabel = opt.label;
    out.statusTurns = turns;
    out.description = description || cardEditorStatusDescription(out);
  }

  return out;
}

function cardEditorPassiveEffectFromForm() {
  const kind = cardEditorFormValue("cardEditorPassiveKind", "none");
  if (!kind || kind === "none") return null;
  const def = CARD_EDITOR_PASSIVE_EFFECTS[kind] || CARD_EDITOR_PASSIVE_EFFECTS.custom_text_only;
  const value = cardEditorInt(cardEditorFormValue("cardEditorPassiveValue", "1"), 1);
  const range = cardEditorInt(cardEditorFormValue("cardEditorPassiveRange", "1"), 1);
  const description = cardEditorFormValue("cardEditorPassiveDescription", "").trim();
  return {
    kind,
    label: def.label || kind,
    value,
    range,
    description
  };
}

function cardEditorAbilityDescription(active, passive) {
  const parts = [];
  if (passive) parts.push(`Passiva – ${passive.label}${passive.value ? ` (${passive.value})` : ""}${passive.description ? `: ${passive.description}` : ""}`);
  if (active) {
    if (active.kind === "apply_status") {
      parts.push(`Attiva – ${active.label}: durata ${active.statusTurns || 1} turno/i, raggio ${active.range}, costo ${active.cost} ENE, CD ${active.cooldown}.${active.value ? ` Valore ${active.value}.` : ""}${active.description ? ` ${active.description}` : ""}`);
    } else {
      parts.push(`Attiva – ${active.label}: valore ${active.value}, raggio ${active.range}, costo ${active.cost} ENE, CD ${active.cooldown}.${active.description ? ` ${active.description}` : ""}`);
    }
  }
  return parts.join(" ");
}

function cardEditorApplyPassiveFields(card, passive) {
  if (!card || !passive) return card;
  if (passive.kind === "vanguard") card.vanguard = true;
  if (passive.kind === "bleed_immune") card.bleedImmune = true;
  if (passive.kind === "anti_structure_bonus") card.antiStructureAtt = passive.value || 1;
  if (passive.kind === "thorns") card.passiveThorns = passive.value || 1;
  if (passive.kind === "aura_att") card.attackAura = { value: passive.value || 1, range: passive.range || 1, source: passive.label };
  if (passive.kind === "aura_def") card.defenseAura = { value: passive.value || 1, range: passive.range || 1, source: passive.label };
  if (passive.kind === "ps_bonus_att") {
    card.psBonus = { stat: "att", value: passive.value || 1, condition: "on_ps", description: passive.description || `+${passive.value || 1} ATT su PS.` };
  }
  if (passive.kind === "ps_bonus_def") {
    card.psBonus = { stat: "def", value: passive.value || 1, condition: "on_ps", description: passive.description || `+${passive.value || 1} DEF su PS.` };
  }
  return card;
}

function cardEditorBuildPreviewCard() {
  const kind = cardEditorFormValue("cardEditorKind", "unit");
  const faction = cardEditorFormValue("cardEditorFaction", "Nexus");
  const name = String(cardEditorFormValue("cardEditorName", kind === "tactic" ? "Nuova tattica custom" : "Nuova unità custom")).trim() || "Nuova carta custom";
  const sourceId = String(cardEditorFormValue("cardEditorSourceId", "")).trim() || cardEditorNextSourceId(kind, faction, name);
  const cost = Math.max(1, Math.min(7, cardEditorInt(cardEditorFormValue("cardEditorCost", "1"), 1)));
  const description = String(cardEditorFormValue("cardEditorDescription", "")).trim();
  const active = cardEditorActiveEffectFromForm();
  const passive = cardEditorPassiveEffectFromForm();
  const abilityText = cardEditorAbilityDescription(active, passive);
  const base = {
    id: cardEditorCardId(kind, sourceId),
    sourceId,
    sourceType: kind,
    cardType: kind === "tactic" ? "tactic" : "unit",
    deckRole: kind === "tactic" ? "tactic" : "base",
    starterRole: null,
    faction,
    name,
    cost,
    custom: true,
    official: false,
    editorVersion: "F9N1",
    createdAt: new Date().toISOString(),
    description,
    abilityText,
    customAbilitySchema: { active, passive },
    customArt: cardEditorCurrentCustomArt(),
    customArtTransform: cardEditorArtTransformFromForm(),
    passiveOnly: true
  };

  if (kind === "tactic") {
    const category = cardEditorFormValue("cardEditorTacticCategory", "Operazione");
    const target = cardEditorFormValue("cardEditorTacticTarget", active ? active.target : "any");
    const range = active ? active.range : cardEditorInt(cardEditorFormValue("cardEditorActiveRange", "1"), 1);
    const runtimeMeta = typeof customTacticEditorMetadata === "function"
      ? customTacticEditorMetadata(active)
      : { playable:false, targetDomain:"none", targetSide:"self", rangeMode:"none", durationMode:"data_only", durationValue:0, runtimeVersion:"F9N1" };
    return {
      ...base,
      sourceType: "tactic",
      cardType: "tactic",
      deckRole: "tactic",
      unitType: null,
      weight: null,
      blueprintId: null,
      tacticId: sourceId,
      category,
      quality: "Custom",
      target,
      targetDomain: runtimeMeta.targetDomain,
      targetSide: runtimeMeta.targetSide,
      rangeMode: runtimeMeta.rangeMode,
      range,
      customTargetFilter: active ? active.filter : "any",
      condition: "",
      duration: runtimeMeta.durationMode,
      durationMode: runtimeMeta.durationMode,
      durationValue: runtimeMeta.durationValue,
      effectKind: active ? active.kind : "custom_text_only",
      statusKind: active && active.kind === "apply_status" ? active.statusKind : null,
      statusTurns: active && active.kind === "apply_status" ? active.statusTurns : null,
      statusValue: active && active.kind === "apply_status" ? active.value : null,
      implementationStatus: runtimeMeta.playable ? "custom_playable_f9n1" : "custom_data_only",
      customTacticRuntimeVersion: runtimeMeta.runtimeVersion || "F9N1",
      effectText: description || abilityText || "Tattica custom data-only.",
      notes: runtimeMeta.playable
        ? "F9N1: tattica custom semplice collegata al runtime tramite whitelist sicura."
        : "F9N1: tattica custom conservata data-only; effetto non ancora supportato dal runtime."
    };
  }

  const unitType = cardEditorFormValue("cardEditorUnitType", "Fanteria");
  const weight = cardEditorFormValue("cardEditorWeight", "Leggera");
  const hp = cardEditorInt(cardEditorFormValue("cardEditorHp", "1"), 1);
  const def = cardEditorInt(cardEditorFormValue("cardEditorDef", "0"), 0);
  const att = cardEditorInt(cardEditorFormValue("cardEditorAtt", "1"), 1);
  const unit = {
    ...base,
    sourceType: "unit",
    cardType: cardEditorCardTypeForUnit(unitType, weight),
    deckRole: cardEditorRoleForUnit(unitType, weight),
    unitType,
    weight,
    blueprintId: sourceId,
    tacticId: null,
    hp,
    def,
    att,
    ability: active ? {
      name: active.label,
      kind: active.kind,
      value: active.value,
      range: active.range,
      cost: active.cost,
      cooldown: active.cooldown,
      target: active.target,
      filter: active.filter,
      statusKind: active.statusKind || null,
      turns: active.statusTurns || null,
      statusTurns: active.statusTurns || null,
      statusValue: active.kind === "apply_status" ? active.value : null,
      description: active.description || active.label,
      customDataOnly: true
    } : (passive ? {
      name: passive.label,
      passive: true,
      kind: passive.kind,
      value: passive.value,
      range: passive.range,
      description: passive.description || passive.label,
      customDataOnly: true
    } : null)
  };
  return cardEditorApplyPassiveFields(unit, passive);
}

function cardEditorValidateCard(card = null) {
  const c = card || cardEditorBuildPreviewCard();
  const issues = [];
  const warnings = [];
  const cost = Math.max(1, Math.min(7, cardEditorInt(c.cost, 1)));
  const budget = cardEditorBudgetForCost(cost);
  const active = c.customAbilitySchema && c.customAbilitySchema.active;
  const passive = c.customAbilitySchema && c.customAbilitySchema.passive;
  const abilityCount = (active ? 1 : 0) + (passive ? 1 : 0);

  if (!c.name || c.name.length < 3) issues.push("Nome troppo breve.");
  if (!c.sourceId || !/^CUS_[A-Z0-9_]+$/.test(c.sourceId)) issues.push("Source ID custom non valido. Usa solo lettere/numeri/underscore e prefisso CUS_.");
  if (!c.faction) issues.push("Fazione mancante.");
  if (cost < 1 || cost > 7) issues.push("ENE deve essere tra 1 e 7.");

  if (active && active.kind === "apply_status") {
    const statusKey = active.statusKey || cardEditorStatusKeyForKind(active.statusKind);
    if (!active.statusKind || !statusKey || !CARD_EDITOR_STATUS_OPTIONS[statusKey]) {
      issues.push("Status custom non selezionato o non valido.");
    } else if (!cardEditorStatusRuntimeAllowed(active.statusKind)) {
      issues.push(`Status non presente nel runtime: ${active.statusKind}.`);
    }
  }

  if (c.sourceType === "unit") {
    const activeDef = active ? CARD_EDITOR_ACTIVE_EFFECTS[active.kind] : null;
    if (activeDef && activeDef.tacticOnly) issues.push(`${activeDef.label} è disponibile soltanto per le tattiche custom.`);
    const hp = cardEditorInt(c.hp, 0);
    const def = cardEditorInt(c.def, 0);
    const att = cardEditorInt(c.att, 0);
    const total = hp + def + att;
    if (hp < 1) issues.push("HP deve essere almeno 1.");
    if (att < 0 || def < 0) issues.push("ATT/DEF non possono essere negativi.");
    if (total > budget.maxStats) issues.push(`Budget stat superato: HP+DEF+ATT = ${total}, massimo ${budget.maxStats} per ${cost} ENE.`);
    if (budget.ability === "passive_only" && active) issues.push("A 1 ENE è consentita solo una passiva, non una attiva.");
    if (budget.ability === "single" && abilityCount > 1) issues.push(`A ${cost} ENE è consentita una sola abilità: passiva o attiva.`);
    if (abilityCount === 0) warnings.push("Nessuna abilità: carta valida, ma meno caratterizzata.");
  }

  let customTacticRuntimeCheck = null;
  if (c.sourceType === "tactic") {
    if (!c.effectText && !c.description) warnings.push("Tattica senza testo effetto.");
    if (!active) warnings.push("Tattica data-only senza effetto attivo selezionato.");
    if (typeof validateCustomTacticCard === "function") {
      customTacticRuntimeCheck = validateCustomTacticCard(c);
      if (active && !customTacticRuntimeCheck.playable) {
        warnings.push(`Runtime F9N1 non disponibile: ${(customTacticRuntimeCheck.errors || []).join("; ") || "effetto data-only"}.`);
      }
      for (const warning of customTacticRuntimeCheck.warnings || []) warnings.push(`Runtime F9N1: ${warning}.`);
    }
  }

  const existingOfficial = typeof buildCardCatalog === "function" ? buildCardCatalog().find(card => card && card.id === c.id) : null;
  if (existingOfficial) issues.push("ID già usato da una carta ufficiale: le carte base sono read-only.");

  const existingCustom = cardEditorCustomCards().find(card => card && card.id === c.id);
  if (existingCustom && cardEditorState.selectedCustomId !== c.id) warnings.push("ID già presente tra le custom: il salvataggio aggiornerà/sostituirà la carta custom.");

  return { ok: issues.length === 0, issues, warnings, budget, customTacticRuntimeCheck, statTotal: c.sourceType === "unit" ? cardEditorInt(c.hp, 0) + cardEditorInt(c.def, 0) + cardEditorInt(c.att, 0) : 0 };
}

function cardEditorValidationHtml(result) {
  const cls = result.ok ? "good" : "bad";
  const budgetText = result.budget ? `${result.budget.label}${Number.isFinite(result.statTotal) ? ` · stat ${result.statTotal}/${result.budget.maxStats}` : ""}` : "";
  const issues = result.issues.length ? `<ul>${result.issues.map(x => `<li>${cardEditorEscapeHtml(x)}</li>`).join("")}</ul>` : "";
  const warnings = result.warnings.length ? `<ul>${result.warnings.map(x => `<li>${cardEditorEscapeHtml(x)}</li>`).join("")}</ul>` : "";
  return `
    <div class="deckBuilderStatus ${cls}">
      <strong>${result.ok ? "Carta custom valida" : "Carta custom non valida"}</strong>
      <span>${cardEditorEscapeHtml(budgetText)}</span>
    </div>
    ${issues ? `<div class="deckBuilderRuleBox bad">${issues}</div>` : ""}
    ${warnings ? `<div class="deckBuilderRuleBox warn">${warnings}</div>` : ""}`;
}

function cardEditorSyncConditionalFields() {
  if (typeof document === "undefined") return;
  const kind = cardEditorFormValue("cardEditorKind", "unit");
  const activeKind = cardEditorFormValue("cardEditorActiveKind", "none");
  const isStatus = activeKind === "apply_status";
  document.querySelectorAll("[data-card-editor-unit-only]").forEach(el => { el.hidden = kind !== "unit"; });
  document.querySelectorAll("[data-card-editor-tactic-only]").forEach(el => { el.hidden = kind !== "tactic"; });
  document.querySelectorAll("[data-card-editor-status-only]").forEach(el => { el.hidden = !isStatus; });

  const opt = cardEditorStatusOption();
  const activeDef = CARD_EDITOR_ACTIVE_EFFECTS[activeKind] || CARD_EDITOR_ACTIVE_EFFECTS.custom_text_only;
  const activeTarget = document.getElementById("cardEditorActiveTarget");
  if (activeTarget && isStatus && activeTarget.value !== opt.target) activeTarget.value = opt.target || "enemy";
  if (activeTarget && kind === "tactic" && ["draw_card", "gain_energy"].includes(activeKind)) activeTarget.value = "self";
  if (activeTarget && kind === "tactic" && activeKind === "cell_blast") activeTarget.value = "any";
  const tacticTarget = document.getElementById("cardEditorTacticTarget");
  if (tacticTarget && kind === "tactic" && ["draw_card", "gain_energy"].includes(activeKind)) tacticTarget.value = "none";
  if (tacticTarget && kind === "tactic" && activeKind === "cell_blast") tacticTarget.value = "any";
  const runtimeEffect = typeof customTacticEffectDefinition === "function" ? customTacticEffectDefinition(activeKind) : null;
  const valueInput = document.getElementById("cardEditorActiveValue");
  const rangeInput = document.getElementById("cardEditorActiveRange");
  if (kind === "tactic" && runtimeEffect && valueInput) {
    valueInput.min = String(runtimeEffect.valueMin);
    valueInput.max = String(runtimeEffect.valueMax);
  }
  if (kind === "tactic" && runtimeEffect && rangeInput) {
    rangeInput.min = String(runtimeEffect.rangeMin);
    rangeInput.max = String(runtimeEffect.rangeMax);
    if (runtimeEffect.rangeMode === "none" && rangeInput.value !== "0") rangeInput.value = "0";
  }
  const valueLabel = document.getElementById("cardEditorActiveValueLabel");
  if (valueLabel) valueLabel.textContent = isStatus ? `Valore status (${opt.valueMin || 0}-${Number.isFinite(opt.valueMax) ? opt.valueMax : 0})` : (activeDef.valueLabel || "Valore");
  const statusHint = document.getElementById("cardEditorStatusHint");
  if (statusHint) statusHint.textContent = isStatus ? `${opt.label}: target ${opt.target === "ally" ? "alleato" : "nemico"}, durata ${opt.turnsMin || 1}-${opt.turnsMax || 1}, valore ${opt.valueMin || 0}-${Number.isFinite(opt.valueMax) ? opt.valueMax : 0}. ${opt.text || ""}` : "";

  const cost = Math.max(1, Math.min(7, cardEditorInt(cardEditorFormValue("cardEditorCost", "1"), 1)));
  const budget = cardEditorBudgetForCost(cost);
  const budgetLine = document.getElementById("cardEditorBudgetLine");
  if (budgetLine) {
    const runtimeText = kind === "tactic"
      ? (runtimeEffect ? ` Runtime F9N1: ${activeKind === "apply_status" && !CARD_EDITOR_STATUS_OPTIONS[cardEditorFormValue("cardEditorActiveStatusKind", "")] ? "data-only" : "whitelist disponibile"}.` : " Runtime F9N1: data-only.")
      : "";
    budgetLine.textContent = `${cost} ENE: ${budget.label}. Abilità consentite: ${cardEditorAbilityAllowanceText(cost)}.${runtimeText}`;
  }
}

function renderCardEditorPreview() {
  if (typeof document === "undefined") return null;
  cardEditorSyncConditionalFields();
  const card = cardEditorBuildPreviewCard();
  const result = cardEditorValidateCard(card);
  const canvas = document.getElementById("cardEditorPreviewCanvas");
  const meta = document.getElementById("cardEditorPreviewMeta");
  const body = document.getElementById("cardEditorPreviewBody");
  const validation = document.getElementById("cardEditorValidation");
  if (typeof renderArenaCardPreviewCanvas === "function") renderArenaCardPreviewCanvas(canvas, card);
  if (meta) meta.textContent = `${card.faction} · ${card.sourceType === "tactic" ? "Tattica custom" : "Unità custom"} · ${card.id}`;
  if (body) {
    const desc = typeof cardRendererDescriptionText === "function" ? cardRendererNormalizeDescription(cardRendererDescriptionText(card)) : (card.description || card.effectText || "");
    const entry = typeof cardAssetEntryFor === "function" ? cardAssetEntryFor(card) : null;
    body.innerHTML = `
      <div class="deckBuilderPreviewStats">
        <span><strong>ENE</strong> ${card.cost}</span>
        ${card.sourceType === "unit" ? `<span><strong>HP</strong> ${card.hp}</span><span><strong>DEF</strong> ${card.def}</span><span><strong>ATT</strong> ${card.att}</span>` : ""}
        <span><strong>Ruolo</strong> ${cardEditorEscapeHtml(card.deckRole || "—")}</span>
        <span><strong>Source</strong> ${cardEditorEscapeHtml(card.sourceId)}</span>
      </div>
      <div class="deckBuilderPreviewDesc">${cardEditorEscapeHtml(desc || "Nessun testo descrittivo.")}</div>
      ${typeof cardRendererPassiveBadgesHtml === "function" ? cardRendererPassiveBadgesHtml(card, cardEditorEscapeHtml) : ""}
      ${cardEditorArtMetaHtml(card)}
      <div class="deckBuilderPreviewPaths">
        <div><strong>Art attesa:</strong> <code>${cardEditorEscapeHtml(cardEditorDisplayArtPath(card, entry))}</code></div>
        <div><strong>Nota:</strong> le immagini custom restano incorporate nella carta; il data URL tecnico non viene mostrato nel pannello.</div>
      </div>`;
  }
  cardEditorUpdateArtPanel(card);
  if (validation) validation.innerHTML = cardEditorValidationHtml(result);
  const saveBtn = document.getElementById("cardEditorSaveBtn");
  if (saveBtn) saveBtn.disabled = !result.ok;
  return card;
}

function cardEditorPopulateSelects() {
  const faction = document.getElementById("cardEditorFaction");
  if (faction && !faction.options.length) {
    faction.innerHTML = cardEditorFactionList().map(f => `<option value="${cardEditorEscapeHtml(f)}">${cardEditorEscapeHtml(f)}</option>`).join("");
  }
  const active = document.getElementById("cardEditorActiveKind");
  if (active && !active.options.length) {
    active.innerHTML = Object.entries(CARD_EDITOR_ACTIVE_EFFECTS).map(([k, v]) => `<option value="${cardEditorEscapeHtml(k)}">${cardEditorEscapeHtml(v.label)}</option>`).join("");
  }
  const status = document.getElementById("cardEditorActiveStatusKind");
  if (status && !status.options.length) {
    status.innerHTML = Object.entries(CARD_EDITOR_STATUS_OPTIONS).map(([k, v]) => `<option value="${cardEditorEscapeHtml(k)}">${cardEditorEscapeHtml(v.label)}</option>`).join("");
  }
  const passive = document.getElementById("cardEditorPassiveKind");
  if (passive && !passive.options.length) {
    passive.innerHTML = Object.entries(CARD_EDITOR_PASSIVE_EFFECTS).map(([k, v]) => `<option value="${cardEditorEscapeHtml(k)}">${cardEditorEscapeHtml(v.label)}</option>`).join("");
  }
}

function cardEditorAutofillSourceId(force = false) {
  const source = document.getElementById("cardEditorSourceId");
  if (!source) return;
  if (!force && source.value.trim()) return;
  const kind = cardEditorFormValue("cardEditorKind", "unit");
  const faction = cardEditorFormValue("cardEditorFaction", "Nexus");
  const name = cardEditorFormValue("cardEditorName", "Nuova carta custom");
  source.value = cardEditorNextSourceId(kind, faction, name);
}

function cardEditorResetForm() {
  cardEditorState.selectedCustomId = "";
  cardEditorSetFormValue("cardEditorKind", "unit");
  cardEditorSetFormValue("cardEditorFaction", "Nexus");
  cardEditorSetFormValue("cardEditorName", "Nuova unità custom");
  cardEditorSetFormValue("cardEditorSourceId", "");
  cardEditorSetFormValue("cardEditorCost", "1");
  cardEditorSetFormValue("cardEditorUnitType", "Fanteria");
  cardEditorSetFormValue("cardEditorWeight", "Leggera");
  cardEditorSetFormValue("cardEditorHp", "2");
  cardEditorSetFormValue("cardEditorDef", "1");
  cardEditorSetFormValue("cardEditorAtt", "1");
  cardEditorSetFormValue("cardEditorDescription", "Carta custom data-only.");
  cardEditorSetFormValue("cardEditorTacticCategory", "Operazione");
  cardEditorSetFormValue("cardEditorTacticTarget", "enemy");
  cardEditorSetFormValue("cardEditorActiveKind", "none");
  cardEditorSetFormValue("cardEditorActiveValue", "1");
  cardEditorSetFormValue("cardEditorActiveRange", "1");
  cardEditorSetFormValue("cardEditorActiveCost", "0");
  cardEditorSetFormValue("cardEditorActiveCooldown", "1");
  cardEditorSetFormValue("cardEditorActiveTarget", "enemy");
  cardEditorSetFormValue("cardEditorActiveFilter", "any");
  cardEditorSetFormValue("cardEditorActiveStatusKind", "inhibit_attack");
  cardEditorSetFormValue("cardEditorActiveStatusTurns", "1");
  cardEditorSetFormValue("cardEditorActiveDescription", "");
  cardEditorSetFormValue("cardEditorPassiveKind", "none");
  cardEditorSetFormValue("cardEditorPassiveValue", "1");
  cardEditorSetFormValue("cardEditorPassiveRange", "1");
  cardEditorSetFormValue("cardEditorPassiveDescription", "");
  cardEditorSetCustomArt(null);
  cardEditorSetArtTransform({ zoom: 1, offsetX: 0, offsetY: 0 });
  cardEditorAutofillSourceId(true);
  renderCardEditorScreen();
}

function cardEditorLoadCardToForm(card) {
  if (!card || !card.custom) return;
  cardEditorState.selectedCustomId = card.id;
  cardEditorSetFormValue("cardEditorKind", card.sourceType || "unit");
  cardEditorSetFormValue("cardEditorFaction", card.faction || "Nexus");
  cardEditorSetFormValue("cardEditorName", card.name || "Carta custom");
  cardEditorSetFormValue("cardEditorSourceId", card.sourceId || "");
  cardEditorSetFormValue("cardEditorCost", card.cost || 1);
  cardEditorSetFormValue("cardEditorDescription", card.description || card.effectText || "");
  if (card.sourceType === "unit") {
    cardEditorSetFormValue("cardEditorUnitType", card.unitType || "Fanteria");
    cardEditorSetFormValue("cardEditorWeight", card.weight || "Leggera");
    cardEditorSetFormValue("cardEditorHp", card.hp || 1);
    cardEditorSetFormValue("cardEditorDef", card.def || 0);
    cardEditorSetFormValue("cardEditorAtt", card.att || 1);
  } else {
    cardEditorSetFormValue("cardEditorTacticCategory", card.category || "Operazione");
    cardEditorSetFormValue("cardEditorTacticTarget", card.target || "enemy");
  }
  const schema = card.customAbilitySchema || {};
  const active = schema.active || null;
  const passive = schema.passive || null;
  cardEditorSetFormValue("cardEditorActiveKind", active ? active.kind : "none");
  cardEditorSetFormValue("cardEditorActiveValue", active ? active.value : 1);
  cardEditorSetFormValue("cardEditorActiveRange", active ? active.range : 1);
  cardEditorSetFormValue("cardEditorActiveCost", active ? active.cost : 0);
  cardEditorSetFormValue("cardEditorActiveCooldown", active ? active.cooldown : 1);
  cardEditorSetFormValue("cardEditorActiveTarget", active ? active.target : "enemy");
  cardEditorSetFormValue("cardEditorActiveFilter", active ? active.filter : "any");
  cardEditorSetFormValue("cardEditorActiveStatusKind", active && active.statusKind ? (cardEditorStatusKeyForKind(active.statusKind) || "inhibit_attack") : "inhibit_attack");
  cardEditorSetFormValue("cardEditorActiveStatusTurns", active && active.statusTurns ? active.statusTurns : 1);
  cardEditorSetFormValue("cardEditorActiveDescription", active ? active.description : "");
  cardEditorSetFormValue("cardEditorPassiveKind", passive ? passive.kind : "none");
  cardEditorSetFormValue("cardEditorPassiveValue", passive ? passive.value : 1);
  cardEditorSetFormValue("cardEditorPassiveRange", passive ? passive.range : 1);
  cardEditorSetFormValue("cardEditorPassiveDescription", passive ? passive.description : "");
  cardEditorSetCustomArt(card.customArt && card.customArt.dataUrl ? card.customArt : null);
  cardEditorSetArtTransform(card.customArtTransform || (card.customArt && card.customArt.transform) || { zoom: 1, offsetX: 0, offsetY: 0 });
  renderCardEditorScreen();
}

function cardEditorSaveCurrentCard() {
  const card = cardEditorBuildPreviewCard();
  const result = cardEditorValidateCard(card);
  if (!result.ok) {
    renderCardEditorPreview();
    return false;
  }
  const cards = cardEditorCustomCards();
  const idx = cards.findIndex(c => c && c.id === card.id);
  if (idx >= 0) cards[idx] = { ...cards[idx], ...card, updatedAt: new Date().toISOString() };
  else cards.push(card);
  cardEditorWriteCustomCards(cards);
  cardEditorState.selectedCustomId = card.id;
  renderCardEditorScreen();
  if (typeof renderCardPoolScreen === "function") renderCardPoolScreen();
  return true;
}

function cardEditorDeleteSelectedCard() {
  if (!cardEditorState.selectedCustomId) return false;
  const card = cardEditorCustomCards().find(c => c && c.id === cardEditorState.selectedCustomId);
  const ok = typeof confirm === "function" ? confirm(`Eliminare la carta custom "${card ? card.name : cardEditorState.selectedCustomId}"?`) : true;
  if (!ok) return false;
  const next = cardEditorCustomCards().filter(c => c && c.id !== cardEditorState.selectedCustomId);
  cardEditorWriteCustomCards(next);
  cardEditorResetForm();
  if (typeof renderCardPoolScreen === "function") renderCardPoolScreen();
  return true;
}

function cardEditorCopyCurrentJson() {
  const card = cardEditorBuildPreviewCard();
  const result = cardEditorValidateCard(card);
  const payload = {
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    mode: "F9K2b-card-editor-selected-card",
    valid: result.ok,
    validation: result,
    card,
    asset: typeof cardAssetEntryFor === "function" ? cardAssetEntryFor(card) : null
  };
  const text = JSON.stringify(payload, null, 2);
  if (typeof arenaStorageCopyText === "function") return arenaStorageCopyText(text, "Carta custom copiata in JSON.");
  if (typeof navigator !== "undefined" && navigator.clipboard) return navigator.clipboard.writeText(text);
  if (typeof prompt === "function") prompt("Copia JSON carta custom:", text);
  return text;
}


function cardEditorLibraryFilteredCards() {
  const q = String(cardEditorState.librarySearch || "").trim().toLowerCase();
  return cardEditorCustomCards().filter(card => {
    if (!card) return false;
    if (cardEditorState.libraryKind !== "all" && card.sourceType !== cardEditorState.libraryKind) return false;
    if (cardEditorState.libraryFaction !== "all" && card.faction !== cardEditorState.libraryFaction) return false;
    if (!q) return true;
    const haystack = [card.id, card.sourceId, card.name, card.faction, card.sourceType, card.deckRole, card.description, card.effectText, card.abilityText]
      .filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(q);
  }).sort((a, b) => {
    const fa = String(a.faction || "").localeCompare(String(b.faction || ""));
    if (fa) return fa;
    const ka = String(a.sourceType || "").localeCompare(String(b.sourceType || ""));
    if (ka) return ka;
    const ca = (Number.isFinite(a.cost) ? a.cost : 99) - (Number.isFinite(b.cost) ? b.cost : 99);
    if (ca) return ca;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

function cardEditorLibraryPayload(cards = null) {
  const list = Array.isArray(cards) ? cards : cardEditorCustomCards();
  return {
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    mode: "F9K2b-custom-card-library",
    schemaVersion: "arena-rubra-custom-cards-v1",
    exportedAt: new Date().toISOString(),
    count: list.length,
    cards: list
  };
}

function cardEditorCopyAllCustomJson() {
  const text = JSON.stringify(cardEditorLibraryPayload(), null, 2);
  if (typeof arenaStorageCopyText === "function") return arenaStorageCopyText(text, "Libreria custom copiata in JSON.");
  if (typeof navigator !== "undefined" && navigator.clipboard) return navigator.clipboard.writeText(text);
  if (typeof prompt === "function") prompt("Copia JSON libreria custom:", text);
  return text;
}

function cardEditorWriteExportToImportBox() {
  const textarea = typeof document !== "undefined" ? document.getElementById("cardEditorImportText") : null;
  const text = JSON.stringify(cardEditorLibraryPayload(), null, 2);
  if (textarea) textarea.value = text;
  return text;
}

function cardEditorImportedCardsFromPayload(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.cards)) return payload.cards;
  if (payload.card) return [payload.card];
  return [];
}

function cardEditorNormalizeImportedCard(card) {
  if (!card || typeof card !== "object") return null;
  const copy = JSON.parse(JSON.stringify(card));
  if (copy.custom !== true) return null;
  if (!copy.sourceType || !["unit", "tactic"].includes(copy.sourceType)) return null;
  if (!copy.sourceId || !String(copy.sourceId).startsWith("CUS_")) return null;
  copy.id = cardEditorCardId(copy.sourceType, copy.sourceId);
  copy.custom = true;
  copy.official = false;
  copy.editorVersion = copy.editorVersion || "F9N1";
  copy.importedAt = new Date().toISOString();
  if (copy.sourceType === "unit") {
    copy.blueprintId = copy.sourceId;
    copy.tacticId = null;
    copy.cardType = copy.cardType || cardEditorCardTypeForUnit(copy.unitType || "Fanteria", copy.weight || "Leggera");
    copy.deckRole = copy.deckRole || cardEditorRoleForUnit(copy.unitType || "Fanteria", copy.weight || "Leggera");
  } else {
    copy.tacticId = copy.sourceId;
    copy.blueprintId = null;
    copy.cardType = "tactic";
    copy.deckRole = "tactic";
  }
  return copy;
}

function cardEditorImportCustomJson() {
  const textarea = typeof document !== "undefined" ? document.getElementById("cardEditorImportText") : null;
  const status = typeof document !== "undefined" ? document.getElementById("cardEditorImportStatus") : null;
  const raw = textarea ? textarea.value.trim() : "";
  if (!raw) {
    if (status) status.innerHTML = `<div class="deckBuilderRuleBox warn">Nessun JSON da importare.</div>`;
    return { ok: false, imported: 0, issues: ["JSON vuoto"] };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    if (status) status.innerHTML = `<div class="deckBuilderRuleBox bad">JSON non valido: ${cardEditorEscapeHtml(err.message || err)}</div>`;
    return { ok: false, imported: 0, issues: [String(err && err.message || err)] };
  }
  const incoming = cardEditorImportedCardsFromPayload(parsed).map(cardEditorNormalizeImportedCard).filter(Boolean);
  const accepted = [];
  const issues = [];
  incoming.forEach(card => {
    const result = cardEditorValidateCard(card);
    if (result.ok) accepted.push(card);
    else issues.push(`${card.name || card.id}: ${result.issues.join("; ")}`);
  });
  if (!accepted.length) {
    if (status) status.innerHTML = `<div class="deckBuilderRuleBox bad">Nessuna carta importata.${issues.length ? `<ul>${issues.map(x => `<li>${cardEditorEscapeHtml(x)}</li>`).join("")}</ul>` : ""}</div>`;
    return { ok: false, imported: 0, issues };
  }
  const store = cardEditorCustomCards();
  const byId = new Map(store.map(card => [card.id, card]));
  accepted.forEach(card => byId.set(card.id, card));
  cardEditorWriteCustomCards([...byId.values()]);
  cardEditorState.selectedCustomId = accepted[0].id;
  cardEditorLoadCardToForm(accepted[0]);
  if (status) status.innerHTML = `<div class="deckBuilderStatus good"><strong>Import completato</strong><span>${accepted.length} carte importate/aggiornate.${issues.length ? ` Scartate: ${issues.length}.` : ""}</span></div>`;
  if (typeof renderCardPoolScreen === "function") renderCardPoolScreen();
  return { ok: true, imported: accepted.length, issues };
}

function cardEditorDuplicateCustomSelected() {
  const source = cardEditorCustomCards().find(card => card && card.id === cardEditorState.selectedCustomId);
  if (!source) return false;
  const clone = cardEditorCustomClone(source, `Copia di ${source.name || "Carta custom"}`);
  const cards = cardEditorCustomCards();
  cards.push(clone);
  cardEditorWriteCustomCards(cards);
  cardEditorState.selectedCustomId = clone.id;
  cardEditorLoadCardToForm(clone);
  if (typeof renderCardPoolScreen === "function") renderCardPoolScreen();
  return true;
}

function cardEditorResetCustomLibrary() {
  const cards = cardEditorCustomCards();
  if (!cards.length) return false;
  const ok = typeof confirm === "function" ? confirm(`Eliminare tutte le ${cards.length} carte custom salvate? Le carte ufficiali non saranno toccate.`) : true;
  if (!ok) return false;
  cardEditorWriteCustomCards([]);
  cardEditorResetForm();
  if (typeof renderCardPoolScreen === "function") renderCardPoolScreen();
  return true;
}

function cardEditorCustomClone(source, name = null) {
  const kind = source.sourceType === "tactic" ? "tactic" : "unit";
  const faction = source.faction || "Nexus";
  const cloneName = name || `Copia di ${source.name || "Carta"}`;
  const sourceId = cardEditorNextSourceId(kind, faction, cloneName);
  const clone = JSON.parse(JSON.stringify(source));
  clone.name = cloneName;
  clone.sourceId = sourceId;
  clone.id = cardEditorCardId(kind, sourceId);
  clone.custom = true;
  clone.official = false;
  clone.editorVersion = "F9N1";
  clone.createdAt = new Date().toISOString();
  clone.updatedAt = clone.createdAt;
  clone.sourceType = kind;
  clone.cardType = kind === "tactic" ? "tactic" : (clone.cardType || cardEditorCardTypeForUnit(clone.unitType || "Fanteria", clone.weight || "Leggera"));
  clone.deckRole = kind === "tactic" ? "tactic" : (clone.deckRole || cardEditorRoleForUnit(clone.unitType || "Fanteria", clone.weight || "Leggera"));
  clone.blueprintId = kind === "unit" ? sourceId : null;
  clone.tacticId = kind === "tactic" ? sourceId : null;
  clone.notes = clone.notes || "Carta custom duplicata in F9K2b.";
  return clone;
}

function cardEditorCustomFromCatalogCard(source) {
  if (!source) return null;
  if (source.custom) return cardEditorCustomClone(source, `Copia di ${source.name || "Carta custom"}`);
  const kind = source.sourceType === "tactic" ? "tactic" : "unit";
  const faction = source.faction || "Nexus";
  const name = `Custom ${source.name || "Carta"}`;
  const sourceId = cardEditorNextSourceId(kind, faction, name);
  const desc = typeof cardRendererDescriptionText === "function" ? cardRendererNormalizeDescription(cardRendererDescriptionText(source)) : (source.effectText || source.description || "");
  const base = {
    id: cardEditorCardId(kind, sourceId),
    sourceId,
    sourceType: kind,
    cardType: kind === "tactic" ? "tactic" : (source.cardType || "unit"),
    deckRole: kind === "tactic" ? "tactic" : (source.deckRole || "base"),
    starterRole: null,
    faction,
    name,
    cost: Math.max(1, Math.min(7, cardEditorInt(source.cost, 1))),
    custom: true,
    official: false,
    editorVersion: "F9N1",
    createdAt: new Date().toISOString(),
    description: desc,
    abilityText: "",
    customAbilitySchema: source.customAbilitySchema || { active: null, passive: null },
    passiveOnly: true,
    originalCardId: source.id || ""
  };
  if (kind === "tactic") {
    return {
      ...base,
      cardType: "tactic",
      deckRole: "tactic",
      unitType: null,
      weight: null,
      blueprintId: null,
      tacticId: sourceId,
      category: source.category || "Operazione",
      quality: "Custom",
      target: source.target || "any",
      targetDomain: source.targetDomain || "none",
      targetSide: source.targetSide || "self",
      rangeMode: source.rangeMode || "none",
      range: source.range || 0,
      duration: source.duration || "",
      durationMode: source.durationMode || "data_only",
      effectKind: source.effectKind || "custom_text_only",
      implementationStatus: "custom_data_only",
      effectText: source.effectText || desc || "Tattica custom duplicata dal catalogo.",
      notes: `Duplicata da ${source.id || "carta ufficiale"}.`
    };
  }
  return {
    ...base,
    unitType: source.unitType || "Fanteria",
    weight: source.weight || "Leggera",
    blueprintId: sourceId,
    tacticId: null,
    hp: typeof cardRendererStat === "function" ? cardRendererStat(source, "hp") : (source.hp || 1),
    def: typeof cardRendererStat === "function" ? cardRendererStat(source, "def") : (source.def || 0),
    att: typeof cardRendererStat === "function" ? cardRendererStat(source, "att") : (source.att || 1),
    ability: null
  };
}

function cardEditorDuplicateCatalogCard(cardId = "") {
  const id = cardId || (typeof CARD_POOL_STATE !== "undefined" ? CARD_POOL_STATE.selectedCardId : "");
  const source = id && typeof cardPoolCardById === "function" ? cardPoolCardById(id) : null;
  if (!source) return false;
  const clone = cardEditorCustomFromCatalogCard(source);
  if (!clone) return false;
  cardEditorLoadCardToForm(clone);
  if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.CARD_EDITOR);
  return clone;
}
function cardEditorListHtml() {
  const cards = cardEditorLibraryFilteredCards();
  const total = cardEditorCustomCards().length;
  if (!total) return `<div class="deckBuilderRuleBox">Nessuna carta custom salvata. Crea una carta e salvala: apparirà anche nel Pool carte.</div>`;
  if (!cards.length) return `<div class="deckBuilderRuleBox warn">Nessuna custom corrisponde ai filtri della libreria.</div>`;
  return cards.map(card => {
    const selected = card.id === cardEditorState.selectedCustomId ? " cardEditorSavedSelected" : "";
    return `<button class="cardEditorSavedItem${selected}" type="button" data-card-editor-load="${cardEditorEscapeHtml(card.id)}">
      <strong>${cardEditorEscapeHtml(card.name || "Carta custom")} <em>CUSTOM</em></strong>
      <span>${cardEditorEscapeHtml(card.faction || "—")} · ${card.sourceType === "tactic" ? "Tattica" : "Unità"} · ${cardEditorEscapeHtml(card.sourceId || card.id)}</span>
    </button>`;
  }).join("");
}

function renderCardEditorScreen() {
  if (typeof document === "undefined") return;
  cardEditorPopulateSelects();
  const list = document.getElementById("cardEditorSavedList");
  if (list) list.innerHTML = cardEditorListHtml();
  const total = cardEditorCustomCards().length;
  const filtered = cardEditorLibraryFilteredCards().length;
  const count = document.getElementById("cardEditorLibraryCount");
  if (count) count.textContent = `${filtered}/${total} custom`;
  const search = document.getElementById("cardEditorLibrarySearch");
  if (search && search.value !== cardEditorState.librarySearch) search.value = cardEditorState.librarySearch;
  const kind = document.getElementById("cardEditorLibraryKind");
  if (kind) kind.value = cardEditorState.libraryKind;
  const faction = document.getElementById("cardEditorLibraryFaction");
  if (faction && !faction.options.length) {
    faction.innerHTML = `<option value="all">Tutte le fazioni</option>` + cardEditorFactionList().map(f => `<option value="${cardEditorEscapeHtml(f)}">${cardEditorEscapeHtml(f)}</option>`).join("");
  }
  if (faction) faction.value = cardEditorState.libraryFaction;
  renderCardEditorPreview();
}

function openCardEditorScreen() {
  if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.CARD_EDITOR);
  renderCardEditorScreen();
}

function initializeCardEditorScreen() {
  if (typeof document === "undefined") return;
  cardEditorPopulateSelects();

  const ids = [
    "cardEditorKind", "cardEditorFaction", "cardEditorName", "cardEditorSourceId", "cardEditorCost",
    "cardEditorUnitType", "cardEditorWeight", "cardEditorHp", "cardEditorDef", "cardEditorAtt",
    "cardEditorDescription", "cardEditorTacticCategory", "cardEditorTacticTarget",
    "cardEditorActiveKind", "cardEditorActiveValue", "cardEditorActiveRange", "cardEditorActiveCost",
    "cardEditorActiveCooldown", "cardEditorActiveTarget", "cardEditorActiveFilter", "cardEditorActiveStatusKind", "cardEditorActiveStatusTurns", "cardEditorActiveDescription",
    "cardEditorPassiveKind", "cardEditorPassiveValue", "cardEditorPassiveRange", "cardEditorPassiveDescription",
    "cardEditorArtPreset", "cardEditorArtFormat", "cardEditorArtQuality", "cardEditorArtZoom", "cardEditorArtOffsetX", "cardEditorArtOffsetY"
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.dataset.bound !== "1") {
      el.dataset.bound = "1";
      el.addEventListener("input", () => {
        if (["cardEditorName", "cardEditorFaction", "cardEditorKind"].includes(id)) cardEditorAutofillSourceId(false);
        renderCardEditorPreview();
      });
      el.addEventListener("change", () => {
        if (["cardEditorName", "cardEditorFaction", "cardEditorKind"].includes(id)) cardEditorAutofillSourceId(false);
        renderCardEditorPreview();
      });
    }
  });

  [["cardEditorNewBtn", cardEditorResetForm], ["cardEditorSaveBtn", cardEditorSaveCurrentCard], ["cardEditorDeleteBtn", cardEditorDeleteSelectedCard], ["cardEditorCopyJsonBtn", cardEditorCopyCurrentJson], ["cardEditorCopyAllBtn", cardEditorCopyAllCustomJson], ["cardEditorWriteExportBtn", cardEditorWriteExportToImportBox], ["cardEditorImportBtn", cardEditorImportCustomJson], ["cardEditorDuplicateBtn", cardEditorDuplicateCustomSelected], ["cardEditorResetLibraryBtn", cardEditorResetCustomLibrary], ["cardEditorArtPickBtn", () => { const f = document.getElementById("cardEditorArtFile"); if (f) f.click(); }], ["cardEditorArtClearBtn", cardEditorClearArt], ["cardEditorArtReprocessBtn", cardEditorReprocessArt], ["cardEditorArtResetTransformBtn", cardEditorResetArtTransform], ["cardEditorArtCopyTransformBtn", cardEditorCopyArtTransformJson], ["cardEditorRegenerateIdBtn", () => { cardEditorSetFormValue("cardEditorSourceId", ""); cardEditorAutofillSourceId(true); renderCardEditorPreview(); }]].forEach(([id, handler]) => {
    const el = document.getElementById(id);
    if (el && el.dataset.bound !== "1") {
      el.dataset.bound = "1";
      el.addEventListener("click", handler);
    }
  });

  [["cardEditorLibrarySearch", value => { cardEditorState.librarySearch = value; }], ["cardEditorLibraryKind", value => { cardEditorState.libraryKind = value || "all"; }], ["cardEditorLibraryFaction", value => { cardEditorState.libraryFaction = value || "all"; }]].forEach(([id, setter]) => {
    const el = document.getElementById(id);
    if (el && el.dataset.bound !== "1") {
      el.dataset.bound = "1";
      el.addEventListener("input", () => { setter(el.value || ""); renderCardEditorScreen(); });
      el.addEventListener("change", () => { setter(el.value || ""); renderCardEditorScreen(); });
    }
  });

  const artFile = document.getElementById("cardEditorArtFile");
  if (artFile && artFile.dataset.bound !== "1") {
    artFile.dataset.bound = "1";
    artFile.addEventListener("change", cardEditorImportArtFile);
  }

  const screen = document.getElementById("cardEditorScreen");
  if (screen && screen.dataset.delegated !== "1") {
    screen.dataset.delegated = "1";
    screen.addEventListener("click", event => {
      const btn = event.target && event.target.closest ? event.target.closest("[data-card-editor-load]") : null;
      if (!btn) return;
      const card = cardEditorCustomCards().find(c => c && c.id === btn.getAttribute("data-card-editor-load"));
      if (card) cardEditorLoadCardToForm(card);
    });
  }

  if (!cardEditorFormValue("cardEditorSourceId", "")) cardEditorResetForm();
  else renderCardEditorScreen();
}
