
"use strict";

// Arena Rubra – F9I1e Stat Value Clearance Microfix.
// Preview canvas non distruttiva: usa i dati del catalogo, il manifest asset carte e le coordinate del Card Composer.
// In F9I1c verifica/hydrata i dati carta dal catalogo, così HP/DEF/ATT e descrizione restano coerenti tra pool e draft.

const CARD_RENDERER_STATE = {
  selectedCardId: "",
  selectedSource: "",
  lastContext: "deckBuilder"
};

const GAME_CARD_PREVIEW_STATE = {
  handCardUid: "",
  handSide: 0,
  handSource: "",
  selectedUnitUid: ""
};

const CARD_RENDERER_FACTION_STYLE = Object.freeze({
  nexus: { text: "#d8dde6", textShadow: "rgba(0,0,0,.88)", stroke: "rgba(0,0,0,.82)", base: "#0f1e35", accent: "#2c5ea9" },
  exordium: { text: "#ffd35a", textShadow: "rgba(0,0,0,.88)", stroke: "rgba(0,0,0,.82)", base: "#34110f", accent: "#7f2917" },
  liberti: { text: "#ffe29a", textShadow: "rgba(0,0,0,.88)", stroke: "rgba(0,0,0,.82)", base: "#35250f", accent: "#866227" },
  agathoi: { text: "#f1e8aa", textShadow: "rgba(0,0,0,.88)", stroke: "rgba(0,0,0,.82)", base: "#273617", accent: "#557437" },
  fabeot: { text: "#d5d5df", textShadow: "rgba(0,0,0,.88)", stroke: "rgba(0,0,0,.82)", base: "#231d37", accent: "#55428a" },
  neutral: { text: "#ececec", textShadow: "rgba(0,0,0,.88)", stroke: "rgba(0,0,0,.82)", base: "#24262f", accent: "#525866" }
});

const cardRendererImageCache = Object.create(null);

function cardRendererSelectCard(cardId, source = "") {
  CARD_RENDERER_STATE.selectedCardId = String(cardId || "");
  CARD_RENDERER_STATE.selectedSource = String(source || "");
  return CARD_RENDERER_STATE.selectedCardId;
}

function cardRendererCurrentCardId() {
  return CARD_RENDERER_STATE.selectedCardId || "";
}

function cardRendererFactionStyle(card) {
  const key = typeof cardAssetFactionKey === "function" ? cardAssetFactionKey(card) : "neutral";
  return CARD_RENDERER_FACTION_STYLE[key] || CARD_RENDERER_FACTION_STYLE.neutral;
}

function cardRendererSourceBlueprint(card) {
  if (!card || card.sourceType !== "unit" || typeof BLUEPRINTS === "undefined") return null;
  return (BLUEPRINTS || []).find(bp => bp && bp.id === card.blueprintId) || null;
}

function cardRendererSourceTactic(card) {
  if (!card || card.sourceType !== "tactic" || typeof DECK_TACTICS === "undefined") return null;
  return (DECK_TACTICS || []).find(t => t && t.id === card.tacticId) || null;
}

function cardRendererLocalizedUnitType(card) {
  if (!card) return "—";
  const cardType = String(card.cardType || "").toLowerCase();
  const deckRole = String(card.deckRole || "").toLowerCase();
  const unitTypeRaw = String(card.unitType || "").trim();
  const weightRaw = String(card.weight || "").trim();
  const typeMap = {
    comandante: "COMANDANTE",
    fanteria: "FANTERIA",
    veicolo: "VEICOLO",
    struttura: "STRUTTURA"
  };
  const weightMap = {
    leggera: "LEGGERA", leggero: "LEGGERO",
    pesante: "PESANTE",
    elite: "ELITE",
    pivot: "PIVOT"
  };
  if (cardType === "commander" || deckRole === "commander" || unitTypeRaw.toLowerCase() === "comandante") return "COMANDANTE";
  const typeKey = unitTypeRaw.toLowerCase();
  const weightKey = weightRaw.toLowerCase();
  const localizedType = typeMap[typeKey] || unitTypeRaw.toUpperCase() || "UNITA";
  const localizedWeight = weightMap[weightKey] || weightRaw.toUpperCase();
  return [localizedType, localizedWeight].filter(Boolean).join(" ").trim();
}

function cardRendererLocalizedTacticType(card) {
  if (!card) return "TATTICA";
  const category = String(card.category || "").trim();
  return category ? `TATTICA · ${category.toUpperCase()}` : "TATTICA";
}

function cardRendererStatPalette() {
  return {
    ene: "#f2cf57",
    hp: "#3ecb63",
    def: "#f4f4f4",
    att: "#d4483c"
  };
}
function cardRendererTypeText(card) {
  if (!card) return "—";
  if (card.sourceType === "tactic") return cardRendererLocalizedTacticType(card);
  return cardRendererLocalizedUnitType(card) || String(card.cardType || "CARTA").toUpperCase();
}

function cardRendererDescriptionText(card) {
  if (!card) return "";
  if (card.sourceType === "tactic") {
    const tactic = cardRendererSourceTactic(card);
    return [card.effectText, tactic && tactic.notes, tactic && tactic.target ? `Bersaglio: ${tactic.target}.` : ""].filter(Boolean).join(" ").trim();
  }
  const bp = cardRendererSourceBlueprint(card);
  const parts = [];
  if (bp && bp.ability && bp.ability.description) {
    const abilityLabel = bp.ability.name ? `${bp.ability.name}: ` : "";
    parts.push(`${abilityLabel}${bp.ability.description}`);
  }
  if (bp && bp.psBonus && bp.psBonus.description) parts.push(bp.psBonus.description);
  if (!parts.length) parts.push("Anteprima dati base: in questa fase il renderer usa catalogo + manifest asset. Testo regole/abilità completo integrabile nelle prossime sottofasi.");
  return parts.join(" ");
}

function cardRendererStat(card, key) {
  const bp = cardRendererSourceBlueprint(card);
  if (bp && Number.isFinite(bp[key])) return bp[key];
  if (Number.isFinite(card && card[key])) return card[key];
  if (key === "cost" && Number.isFinite(card && card.cost)) return card.cost;
  return null;
}

function cardRendererNormalizeDescription(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function cardRendererLoadImage(src, onDone) {
  if (!src) return null;
  const cached = cardRendererImageCache[src];
  if (cached) {
    if (cached.status === "loaded") return cached.img;
    if (cached.status === "error") return null;
    if (typeof onDone === "function") cached.listeners.push(onDone);
    return null;
  }
  const img = new Image();
  cardRendererImageCache[src] = { status: "loading", img, listeners: typeof onDone === "function" ? [onDone] : [] };
  img.onload = () => {
    const entry = cardRendererImageCache[src];
    if (!entry) return;
    entry.status = "loaded";
    const listeners = entry.listeners.splice(0);
    listeners.forEach(fn => { try { fn(); } catch (_) {} });
  };
  img.onerror = () => {
    const entry = cardRendererImageCache[src];
    if (!entry) return;
    entry.status = "error";
    const listeners = entry.listeners.splice(0);
    listeners.forEach(fn => { try { fn(); } catch (_) {} });
  };
  img.src = src;
  return null;
}

function cardRendererLoadFirstAvailableImage(paths, onDone) {
  const list = Array.isArray(paths) ? paths.filter(Boolean) : [paths].filter(Boolean);
  if (!list.length) return null;
  for (const src of list) {
    const cached = cardRendererImageCache[src];
    if (cached && cached.status === "loaded") return cached.img;
  }
  for (const src of list) {
    const cached = cardRendererImageCache[src];
    if (cached && cached.status === "loading") {
      if (typeof onDone === "function") cached.listeners.push(onDone);
      return null;
    }
  }
  const next = list.find(src => !cardRendererImageCache[src] || cardRendererImageCache[src].status !== "error");
  if (!next) return null;
  return cardRendererLoadImage(next, onDone);
}

function cardRendererSetStatFont(ctx, size) {
  const px = Math.max(10, Math.round(size));
  ctx.font = `900 ${px}px Consolas, "Liberation Mono", "Courier New", monospace`;
}

function cardRendererSetFont(ctx, size, weight = "700", family = "Georgia, 'Times New Roman', serif") {
  ctx.font = `${weight} ${Math.max(10, Math.round(size))}px ${family}`;
}

function cardRendererFitFont(ctx, text, maxWidth, maxSize, minSize, weight = "700") {
  let size = maxSize;
  for (; size >= minSize; size -= 1) {
    cardRendererSetFont(ctx, size, weight);
    if (ctx.measureText(text).width <= maxWidth) return size;
  }
  return minSize;
}

function cardRendererWrapText(ctx, text, maxWidth) {
  const tokens = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  tokens.forEach(token => {
    const probe = current ? `${current} ${token}` : token;
    if (ctx.measureText(probe).width <= maxWidth || !current) current = probe;
    else { lines.push(current); current = token; }
  });
  if (current) lines.push(current);
  return lines;
}

function cardRendererDrawTextBlock(ctx, text, area, options = {}) {
  const normalized = cardRendererNormalizeDescription(text);
  if (!normalized) return;
  const maxFont = area.maxFontSize || 32;
  const minFont = area.minFontSize || 18;
  const weight = options.weight || area.weight || "500";
  const lineHeightRatio = area.lineHeightRatio || 1.16;
  let fontSize = maxFont;
  let lines = [];
  for (; fontSize >= minFont; fontSize -= 1) {
    cardRendererSetFont(ctx, fontSize, weight);
    lines = cardRendererWrapText(ctx, normalized, area.w);
    const lineHeight = fontSize * lineHeightRatio;
    if (lines.length * lineHeight <= area.h) break;
  }
  cardRendererSetFont(ctx, fontSize, weight);
  const lineHeight = fontSize * lineHeightRatio;
  const totalHeight = lines.length * lineHeight;
  let y = area.y + Math.max(0, (area.h - totalHeight) / 2) + fontSize;
  lines.forEach(line => {
    ctx.fillText(line, area.x, y);
    y += lineHeight;
  });
}

function cardRendererDrawOutlinedText(ctx, text, x, y, opts = {}) {
  const fill = opts.fill || "#f5f5f5";
  const stroke = opts.stroke || "rgba(0,0,0,.82)";
  const lineWidth = Number.isFinite(opts.lineWidth) ? opts.lineWidth : Math.max(2, (opts.fontSize || 20) * 0.08);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = stroke;
  ctx.strokeText(String(text || ""), x, y);
  ctx.fillStyle = fill;
  ctx.fillText(String(text || ""), x, y);
}

function cardRendererDrawCardBase(ctx, canvas, card) {
  const style = cardRendererFactionStyle(card);
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, style.base || "#20242f");
  grad.addColorStop(1, style.accent || "#4f5866");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function cardRendererDrawArtArea(ctx, card, layout, redraw) {
  const artPaths = typeof cardAssetArtCandidatePathsFor === "function" ? cardAssetArtCandidatePathsFor(card) : (typeof cardAssetArtPathFor === "function" ? [cardAssetArtPathFor(card)] : []);
  const placeholderPath = typeof cardAssetEntryFor === "function" ? (cardAssetEntryFor(card).placeholderPath || "") : "";
  const artArea = layout.image;
  const transform = layout.imageTransform || { zoom: 1, offsetX: 0, offsetY: 0 };
  const artImg = cardRendererLoadFirstAvailableImage(artPaths, redraw);
  const placeholderImg = cardRendererLoadFirstAvailableImage([placeholderPath], redraw);
  const img = artImg || placeholderImg;
  if (img && img.width && img.height) {
    const zoom = Number.isFinite(transform.zoom) ? transform.zoom : 1;
    const drawW = artArea.w * zoom;
    const drawH = artArea.h * zoom;
    const drawX = artArea.x + (artArea.w - drawW) / 2 + (transform.offsetX || 0);
    const drawY = artArea.y + (artArea.h - drawH) / 2 + (transform.offsetY || 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(artArea.x, artArea.y, artArea.w, artArea.h);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  } else {
    const grad = ctx.createLinearGradient(artArea.x, artArea.y, artArea.x + artArea.w, artArea.y + artArea.h);
    grad.addColorStop(0, "rgba(255,255,255,.08)");
    grad.addColorStop(1, "rgba(0,0,0,.18)");
    ctx.fillStyle = grad;
    ctx.fillRect(artArea.x, artArea.y, artArea.w, artArea.h);
    ctx.strokeStyle = "rgba(255,255,255,.18)";
    ctx.lineWidth = 3;
    ctx.strokeRect(artArea.x + 4, artArea.y + 4, artArea.w - 8, artArea.h - 8);
  }
}

function cardRendererDrawFrame(ctx, card, redraw) {
  const framePath = typeof cardAssetFramePathFor === "function" ? cardAssetFramePathFor(card) : "";
  const frameImg = cardRendererLoadImage(framePath, redraw);
  if (frameImg && frameImg.width && frameImg.height) {
    ctx.drawImage(frameImg, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}


function cardRendererDrawStatLabel(ctx, label, statBox, color, style) {
  if (!statBox) return;
  const size = statBox.labelSize || 22;
  cardRendererSetStatFont(ctx, size);
  cardRendererDrawOutlinedText(ctx, label, statBox.cx, statBox.labelY, {
    fill: color,
    stroke: style.stroke,
    fontSize: size,
    lineWidth: Math.max(2, Math.round(size * 0.16))
  });
}

function cardRendererDrawStats(ctx, card, layout, style) {
  const stat = layout.statText || {};
  const cost = cardRendererStat(card, "cost");
  const hp = cardRendererStat(card, "hp");
  const def = cardRendererStat(card, "def");
  const att = cardRendererStat(card, "att");
  const palette = cardRendererStatPalette();
  ctx.textAlign = "center";
  if (stat.ene) {
    cardRendererDrawStatLabel(ctx, "ENE", stat.ene, palette.ene, style);
    cardRendererSetStatFont(ctx, stat.ene.valueSize || 104);
    cardRendererDrawOutlinedText(ctx, Number.isFinite(cost) ? cost : "—", stat.ene.cx, stat.ene.valueY, { fill: palette.ene, stroke: style.stroke, fontSize: stat.ene.valueSize || 104, lineWidth: 7 });
  }
  if (card.sourceType !== "tactic") {
    if (stat.hp) {
      cardRendererDrawStatLabel(ctx, "HP", stat.hp, palette.hp, style);
      cardRendererSetStatFont(ctx, stat.hp.valueSize || 104);
      cardRendererDrawOutlinedText(ctx, Number.isFinite(hp) ? hp : "—", stat.hp.cx, stat.hp.valueY, { fill: palette.hp, stroke: style.stroke, fontSize: stat.hp.valueSize || 104, lineWidth: 7 });
    }
    if (stat.def) {
      cardRendererDrawStatLabel(ctx, "DEF", stat.def, palette.def, style);
      cardRendererSetStatFont(ctx, stat.def.valueSize || 70);
      cardRendererDrawOutlinedText(ctx, Number.isFinite(def) ? def : "—", stat.def.cx, stat.def.valueY, { fill: palette.def, stroke: style.stroke, fontSize: stat.def.valueSize || 70, lineWidth: 5 });
    }
    if (stat.att) {
      cardRendererDrawStatLabel(ctx, "ATT", stat.att, palette.att, style);
      cardRendererSetStatFont(ctx, stat.att.valueSize || 104);
      cardRendererDrawOutlinedText(ctx, Number.isFinite(att) ? att : "—", stat.att.cx, stat.att.valueY, { fill: palette.att, stroke: style.stroke, fontSize: stat.att.valueSize || 104, lineWidth: 7 });
    }
  }
  ctx.textAlign = "left";
}

function renderArenaCardPreviewCanvas(canvas, card, options = {}) {
  if (!canvas || typeof canvas.getContext !== "function") return false;
  const redraw = () => {
    if (canvas.isConnected) renderArenaCardPreviewCanvas(canvas, card, options);
  };
  const ctx = canvas.getContext("2d");
  const kind = typeof cardAssetKind === "function" ? cardAssetKind(card) : (card && card.sourceType === "tactic" ? "tactic" : "unit");
  const layout = CARD_COMPOSER_TEMPLATE_GEOMETRY[kind] || CARD_COMPOSER_TEMPLATE_GEOMETRY.unit;
  const style = cardRendererFactionStyle(card);
  canvas.width = CARD_COMPOSER_TEMPLATE_GEOMETRY.canvas.w;
  canvas.height = CARD_COMPOSER_TEMPLATE_GEOMETRY.canvas.h;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  cardRendererDrawCardBase(ctx, canvas, card);

  if (!card) {
    ctx.fillStyle = "rgba(255,255,255,.8)";
    ctx.textAlign = "center";
    cardRendererSetFont(ctx, 42, "700");
    ctx.fillText("Seleziona una carta", canvas.width / 2, canvas.height / 2 - 20);
    cardRendererSetFont(ctx, 24, "400", "system-ui, sans-serif");
    ctx.fillText("Deck Builder · anteprima renderer F9I1", canvas.width / 2, canvas.height / 2 + 26);
    return true;
  }

  cardRendererDrawArtArea(ctx, card, layout, redraw);
  cardRendererDrawFrame(ctx, card, redraw);

  ctx.fillStyle = style.text;
  ctx.strokeStyle = style.stroke;
  ctx.shadowColor = style.textShadow;
  ctx.shadowBlur = 0;

  const nameArea = layout.textAreas.name;
  const typeArea = layout.textAreas.type;
  const descArea = layout.textAreas.description;
  const centeredNameMax = (nameArea.maxFontSize || 48) + 3;
  const centeredNameMin = (nameArea.minFontSize || 28) + 2;
  const nameFont = cardRendererFitFont(ctx, card.name || "Carta", nameArea.w, centeredNameMax, centeredNameMin, nameArea.weight || "700");
  cardRendererSetFont(ctx, nameFont, nameArea.weight || "700");
  ctx.textAlign = "center";
  ctx.fillText(String(card.name || "Carta"), nameArea.x + (nameArea.w / 2), nameArea.y + nameFont);

  const typeText = cardRendererTypeText(card);
  const typeFont = cardRendererFitFont(ctx, typeText, typeArea.w, typeArea.maxFontSize || 28, typeArea.minFontSize || 16, typeArea.weight || "700");
  cardRendererSetFont(ctx, typeFont, typeArea.weight || "700");
  ctx.fillText(typeText, typeArea.x + (typeArea.w / 2), typeArea.y + typeFont);
  ctx.textAlign = "left";

  const description = cardRendererDescriptionText(card);
  cardRendererSetFont(ctx, descArea.maxFontSize || 34, descArea.weight || "500");
  cardRendererDrawTextBlock(ctx, description, descArea, { weight: descArea.weight || "500" });

  cardRendererDrawStats(ctx, card, layout, style);
  return true;
}

function cardRendererCatalogCardById(cardId) {
  if (!cardId || typeof buildCardCatalog !== "function") return null;
  try {
    return buildCardCatalog().find(card => card && card.id === cardId) || null;
  } catch (_) {
    return null;
  }
}

function cardRendererHydrateCard(card) {
  if (!card) return null;
  const full = cardRendererCatalogCardById(card.id);
  return full ? { ...full, deckCopyNo: card.deckCopyNo || card.copyNo || full.deckCopyNo || null } : card;
}

function deckBuilderPreviewCardFromReport(report) {
  const sourceCards = [];
  const pool = report && report.faction ? (typeof deckBuilderPoolFor === "function" ? deckBuilderPoolFor(report.faction, report.commanderId, deckBuilderCatalog()) : []) : [];
  sourceCards.push(...pool);
  if (report && Array.isArray(report.deck)) sourceCards.push(...report.deck);
  const targetId = cardRendererCurrentCardId();
  const catalogMatch = targetId ? cardRendererCatalogCardById(targetId) : null;
  const rowMatch = targetId ? sourceCards.find(card => card && card.id === targetId) : null;
  const fallback = sourceCards[0] || null;
  return cardRendererHydrateCard(catalogMatch || rowMatch || fallback);
}

function gameCardPreviewCardByUid(side, cardUid) {
  if (!state || !cardUid || !side) return null;
  const hand = state.hand && state.hand[side] ? state.hand[side] : [];
  const inHand = hand.find(card => card && card.cardUid === cardUid);
  if (inHand) return inHand;
  const starters = state.starterCards && state.starterCards[side] ? Object.values(state.starterCards[side]) : [];
  return starters.find(card => card && card.cardUid === cardUid) || null;
}

function gameCardPreviewCardFromUnit(unit) {
  if (!unit) return null;
  if (typeof buildUnitCardFromBlueprint === "function") return buildUnitCardFromBlueprint(unit);
  return {
    id: `UNIT:${unit.id || unit.name || "preview"}`,
    sourceId: unit.id || unit.name || "preview",
    sourceType: "unit",
    cardType: unit.type === "Comandante" ? "commander" : "unit",
    deckRole: unit.weight === "Pivot" ? "pivot" : (unit.weight === "Elite" ? "elite" : "base"),
    starterRole: null,
    faction: unit.faction,
    name: unit.name,
    cost: unit.cost,
    unitType: unit.type,
    weight: unit.weight,
    blueprintId: unit.id || null,
    tacticId: null
  };
}

function syncGameHandPreviewSelectionUi() {
  if (typeof document === "undefined") return;
  const uid = String(GAME_CARD_PREVIEW_STATE.handCardUid || "");
  document.querySelectorAll("[data-preview-card-uid]").forEach(el => {
    if (!el || !el.classList) return;
    el.classList.toggle("previewSelected", uid && el.getAttribute("data-preview-card-uid") === uid);
  });
}

function gameCardPreviewSelectHandCard(side, cardUid, source = "hand") {
  GAME_CARD_PREVIEW_STATE.handSide = Number(side || 0) || 0;
  GAME_CARD_PREVIEW_STATE.handCardUid = String(cardUid || "");
  GAME_CARD_PREVIEW_STATE.handSource = String(source || "hand");
  syncGameHandPreviewSelectionUi();
  renderInGameHandCardPreview();
  return GAME_CARD_PREVIEW_STATE.handCardUid;
}

function gameCardPreviewSelectedHandUid() {
  return String(GAME_CARD_PREVIEW_STATE.handCardUid || "");
}

function gameCardPreviewEnsureDefaultHandCard(side) {
  if (!state || !side) return null;
  const current = gameCardPreviewCardByUid(side, GAME_CARD_PREVIEW_STATE.handCardUid);
  if (current) return current;
  const hand = state.hand && state.hand[side] ? state.hand[side] : [];
  if (hand.length) {
    GAME_CARD_PREVIEW_STATE.handSide = side;
    GAME_CARD_PREVIEW_STATE.handCardUid = hand[0].cardUid || "";
    GAME_CARD_PREVIEW_STATE.handSource = "hand";
    return hand[0];
  }
  const starters = state.starterCards && state.starterCards[side] ? Object.values(state.starterCards[side]).filter(Boolean) : [];
  if (starters.length) {
    GAME_CARD_PREVIEW_STATE.handSide = side;
    GAME_CARD_PREVIEW_STATE.handCardUid = starters[0].cardUid || "";
    GAME_CARD_PREVIEW_STATE.handSource = "starter";
    return starters[0];
  }
  GAME_CARD_PREVIEW_STATE.handSide = side;
  GAME_CARD_PREVIEW_STATE.handCardUid = "";
  GAME_CARD_PREVIEW_STATE.handSource = "";
  return null;
}

function gameCardPreviewBodyHtml(card, context = "hand") {
  if (!card) return `<div class="deckBuilderPreviewHelp">Nessuna carta selezionata.</div>`;
  const desc = cardRendererNormalizeDescription(cardRendererDescriptionText(card));
  const role = typeof deckBuilderRoleLabel === "function" ? deckBuilderRoleLabel(card) : (card.deckRole || "—");
  const prefix = context === "unit" ? "Unità in campo" : "Carta selezionata";
  return `
    <div class="deckBuilderPreviewStats">
      <span><strong>${prefix}</strong> ${dbEscapeHtml(card.name || "—")}</span>
      <span><strong>Ruolo</strong> ${dbEscapeHtml(role)}</span>
      <span><strong>Tipo</strong> ${dbEscapeHtml(cardRendererTypeText(card))}</span>
      <span><strong>ENE</strong> ${Number.isFinite(cardRendererStat(card, "cost")) ? cardRendererStat(card, "cost") : "—"}</span>
      ${card.sourceType !== "tactic" ? `<span><strong>HP</strong> ${Number.isFinite(cardRendererStat(card, "hp")) ? cardRendererStat(card, "hp") : "—"}</span>
      <span><strong>DEF</strong> ${Number.isFinite(cardRendererStat(card, "def")) ? cardRendererStat(card, "def") : "—"}</span>
      <span><strong>ATT</strong> ${Number.isFinite(cardRendererStat(card, "att")) ? cardRendererStat(card, "att") : "—"}</span>` : ""}
    </div>
    <div class="deckBuilderPreviewDesc">${dbEscapeHtml(desc || "Nessun testo carta disponibile nel catalogo.")}</div>`;
}

function renderInGameHandCardPreview() {
  if (typeof document === "undefined" || !state) return null;
  const canvas = document.getElementById("gameHandCardPreviewCanvas");
  const meta = document.getElementById("gameHandCardPreviewMeta");
  const body = document.getElementById("gameHandCardPreviewBody");
  if (!canvas || !meta || !body) return null;
  const side = GAME_CARD_PREVIEW_STATE.handSide || state.currentPlayer || 1;
  const card = gameCardPreviewCardByUid(side, GAME_CARD_PREVIEW_STATE.handCardUid) || gameCardPreviewEnsureDefaultHandCard(side);
  renderArenaCardPreviewCanvas(canvas, card || null);
  meta.textContent = card
    ? `${card.faction || "—"} · ${card.sourceType === "tactic" ? "Tattica" : "Unità"} · ${card.id || ""}`
    : "Seleziona una carta dalla mano o una starter card per vedere l'anteprima.";
  body.innerHTML = gameCardPreviewBodyHtml(card, "hand");
  syncGameHandPreviewSelectionUi();
  return card;
}

function renderSelectedUnitCardPreview(unit) {
  if (typeof document === "undefined") return null;
  const canvas = document.getElementById("selectedUnitCardPreviewCanvas");
  const meta = document.getElementById("selectedUnitCardPreviewMeta");
  const body = document.getElementById("selectedUnitCardPreviewBody");
  if (!canvas || !meta || !body) return null;
  const card = unit ? cardRendererHydrateCard(gameCardPreviewCardFromUnit(unit)) : null;
  GAME_CARD_PREVIEW_STATE.selectedUnitUid = unit && unit.uid ? unit.uid : "";
  renderArenaCardPreviewCanvas(canvas, card || null);
  meta.textContent = card
    ? `${card.faction || "—"} · carta base di ${card.name || "Unità"}`
    : "Seleziona una unità sulla mappa per vedere la miniatura renderizzata.";
  body.innerHTML = gameCardPreviewBodyHtml(card, "unit");
  return card;
}

function renderDeckBuilderCardPreview(report) {
  if (typeof document === "undefined") return null;
  const canvas = document.getElementById("deckBuilderCardPreviewCanvas");
  const meta = document.getElementById("deckBuilderCardPreviewMeta");
  const body = document.getElementById("deckBuilderCardPreviewBody");
  const card = cardRendererHydrateCard(deckBuilderPreviewCardFromReport(report));
  if (card) cardRendererSelectCard(card.id, "deckBuilder");
  renderArenaCardPreviewCanvas(canvas, card);
  if (meta) {
    meta.textContent = card
      ? `${card.faction || "—"} · ${card.sourceType === "tactic" ? "Tattica" : "Unità"} · ${card.id || ""}`
      : "Nessuna carta selezionata.";
  }
  if (body) {
    if (!card) {
      body.innerHTML = `<div class="deckBuilderPreviewHelp">Seleziona una riga dal draft o dal pool per vedere l'anteprima della carta.</div>`;
    } else {
      const entry = typeof cardAssetEntryFor === "function" ? cardAssetEntryFor(card) : null;
      const desc = cardRendererNormalizeDescription(cardRendererDescriptionText(card));
      body.innerHTML = `
        <div class="deckBuilderPreviewStats">
          <span><strong>Ruolo</strong> ${dbEscapeHtml(typeof deckBuilderRoleLabel === "function" ? deckBuilderRoleLabel(card) : (card.deckRole || "—"))}</span>
          <span><strong>Tipo</strong> ${dbEscapeHtml(cardRendererTypeText(card))}</span>
          <span><strong>ENE</strong> ${Number.isFinite(cardRendererStat(card, "cost")) ? cardRendererStat(card, "cost") : "—"}</span>
          ${card.sourceType !== "tactic" ? `<span><strong>HP</strong> ${Number.isFinite(cardRendererStat(card, "hp")) ? cardRendererStat(card, "hp") : "—"}</span>
          <span><strong>DEF</strong> ${Number.isFinite(cardRendererStat(card, "def")) ? cardRendererStat(card, "def") : "—"}</span>
          <span><strong>ATT</strong> ${Number.isFinite(cardRendererStat(card, "att")) ? cardRendererStat(card, "att") : "—"}</span>` : ""}
        </div>
        <div class="deckBuilderPreviewDesc">${dbEscapeHtml(desc || "Nessun testo carta disponibile nel catalogo.")}</div>
        <div class="deckBuilderPreviewPaths">
          <div><strong>Frame:</strong> <code>${dbEscapeHtml(entry && entry.framePath || "")}</code></div>
          <div><strong>Art preferita:</strong> <code>${dbEscapeHtml(entry && entry.artPath || "")}</code></div>
          <div><strong>Fallback art:</strong> <code>${dbEscapeHtml(entry && entry.artCandidatePaths ? entry.artCandidatePaths.join(" | ") : "")}</code></div>
          <div><strong>File ID:</strong> <code>${dbEscapeHtml(entry && entry.fileId || "")}</code>${entry && entry.rawFileId && entry.rawFileId !== entry.fileId ? ` · raw <code>${dbEscapeHtml(entry.rawFileId)}</code>` : ""}</div>
          <div><strong>Formato art:</strong> <code>${dbEscapeHtml(entry && entry.recommendedArtSize || "")}</code> · <code>${dbEscapeHtml(entry && entry.recommendedHighResArtSize || "")}</code> · <code>${dbEscapeHtml(entry && entry.recommendedColorDepth || "")}</code></div>
          <div><strong>Placeholder:</strong> <code>${dbEscapeHtml(entry && entry.placeholderPath || "")}</code></div>
        </div>`;
    }
  }
  return card;
}
