"use strict";

// Arena Rubra – F9O4 Hidden Bot Hand, Card Backs & Card Motion.
// Privacy UI della mano, resolver dorsi fazione e coda animazioni non bloccante.

const CARD_MOTION_CONFIG = Object.freeze({
  durationMs: 280,
  reducedDurationMs: 90,
  queueMax: 14,
  dedupeWindowMs: 100
});

let cardMotionQueue = [];
let cardMotionCurrent = null;
let cardMotionTimer = null;
let cardMotionSeq = 0;
let cardMotionRecent = new Map();
let cardMotionDom = null;
const CARD_MOTION_SETTINGS_KEY = "presentation";
const cardMotionPreferenceState = { reduced:false, loaded:false };

function cardPresentationHumanSides() {
  if (typeof state === "undefined" || !state || !state.modes) return [];
  return (typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(state) : [1, 2]).filter(side => state.modes[side] === "human");
}

function cardPresentationViewerSide() {
  const humans = cardPresentationHumanSides();
  if (humans.length === 1) return humans[0];
  if (humans.length >= 2) return (typeof state !== "undefined" && state && state.currentPlayer) || humans[0];
  return 0;
}

function cardPresentationDisplaySide() {
  return cardPresentationViewerSide() || ((typeof state !== "undefined" && state && state.currentPlayer) || 1);
}

function cardPresentationCanViewHand(side) {
  const viewer = cardPresentationViewerSide();
  return Boolean(viewer && Number(side) === Number(viewer));
}

function cardPresentationCardIsPublic(card) {
  if (!card) return false;
  return Boolean(
    card.sourceType === "mission" || card.cardType === "mission" || card.deckRole === "mission" ||
    card.cardType === "commander" || card.deckRole === "commander"
  );
}

function handCardHiddenFromViewer(side, card) {
  if (!card) return false;
  if (cardPresentationCardIsPublic(card)) return false;
  return !cardPresentationCanViewHand(side);
}

function cardPresentationCanRevealTransfer(fromSide, toSide) {
  const viewer = cardPresentationViewerSide();
  return Boolean(viewer && (Number(viewer) === Number(fromSide) || Number(viewer) === Number(toSide)));
}

function cardPresentationEventCardName(data, fallback = "Carta coperta") {
  const d = data || {};
  if (d.public === true || cardPresentationCanRevealTransfer(d.fromSide, d.toSide) || cardPresentationCanViewHand(d.player || d.side)) {
    return d.cardName || d.name || fallback;
  }
  return fallback;
}

function cardPresentationVisibleCardName(side, card, fallback = "una carta coperta") {
  if (!card) return fallback;
  if (cardPresentationCanViewHand(side) || cardPresentationCardIsPublic(card)) return card.name || card.id || fallback;
  return fallback;
}

function cardPresentationVisibleCardsLabel(side, cards, options = {}) {
  const list = Array.isArray(cards) ? cards.filter(Boolean) : [];
  if (!list.length) return options.emptyLabel || "nessuna";
  const hiddenLabel = options.hiddenLabel || "carta coperta";
  const formatter = typeof options.formatter === "function" ? options.formatter : card => card.name || card.id || "Carta";
  const canView = cardPresentationCanViewHand(side);
  const publicCount = list.filter(cardPresentationCardIsPublic).length;
  if (!canView && publicCount === 0 && options.compactHidden !== false) {
    return `${list.length} carta${list.length === 1 ? "" : "e"} coperta${list.length === 1 ? "" : "e"}`;
  }
  return list.map(card => canView || cardPresentationCardIsPublic(card) ? formatter(card) : hiddenLabel).join(", ");
}

function cardBackCandidatesForFaction(faction) {
  if (typeof cardAssetBackCandidatePathsFor === "function") return cardAssetBackCandidatePathsFor(faction);
  const key = typeof cardAssetFactionKey === "function" ? cardAssetFactionKey(faction) : String(faction || "nexus").toLowerCase();
  const prefixes = { nexus:"nex", exordium:"exo", liberti:"lib", agathoi:"aga", fabeot:"fab" };
  const base = `assets/cards/art/${key}/${prefixes[key] || key.slice(0,3)}back`;
  return ["webp","png","jpg","jpeg"].map(ext => `${base}.${ext}`);
}

function cardBackEscape(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}

function cardBackVisualHtml(faction, options = {}) {
  const candidates = cardBackCandidatesForFaction(faction);
  const safeCandidates = candidates.map(cardBackEscape).join("|");
  const first = candidates[0] || "";
  const blocked = options.blocked ? `<span class="cardBackBlockedMark" aria-label="Carta bloccata">⊘</span>` : "";
  const compact = options.compact ? " compact" : "";
  return `<div class="factionCardBack${compact}" data-card-back-faction="${cardBackEscape(faction || "neutral")}">
    ${first ? `<img class="factionCardBackImage" src="${cardBackEscape(first)}" data-card-back-candidates="${safeCandidates}" data-card-back-index="0" alt="Dorso carta ${cardBackEscape(faction || "")}" onerror="cardBackImageFallback(this)">` : ""}
    <div class="factionCardBackFallback" aria-hidden="true"><strong>${cardBackEscape(faction || "AR")}</strong><span>ARENA RUBRA</span></div>
    ${blocked}
  </div>`;
}

function cardBackImageFallback(img) {
  if (!img) return false;
  const list = String(img.getAttribute("data-card-back-candidates") || "").split("|").filter(Boolean);
  const current = Number(img.getAttribute("data-card-back-index") || 0);
  const next = current + 1;
  if (next < list.length) {
    img.setAttribute("data-card-back-index", String(next));
    img.src = list[next];
    return true;
  }
  img.hidden = true;
  const shell = img.closest ? img.closest(".factionCardBack") : null;
  if (shell) shell.classList.add("assetMissing");
  return false;
}

function cardMotionSystemReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function cardMotionReducedMotion() {
  return Boolean(cardMotionPreferenceState.reduced || cardMotionSystemReducedMotion());
}

function cardMotionReadPreferences() {
  let settings = {};
  try { settings = typeof arenaStorageReadSettings === "function" ? arenaStorageReadSettings() : {}; }
  catch (_) { settings = {}; }
  const presentation = settings && settings[CARD_MOTION_SETTINGS_KEY] && typeof settings[CARD_MOTION_SETTINGS_KEY] === "object"
    ? settings[CARD_MOTION_SETTINGS_KEY]
    : {};
  return { reduced: Boolean(presentation.cardAnimationsReduced) };
}

function cardMotionWritePreferences() {
  try {
    if (typeof arenaStorageReadSettings !== "function" || typeof arenaStorageWriteSettings !== "function") return false;
    const settings = arenaStorageReadSettings();
    const next = settings && typeof settings === "object" && !Array.isArray(settings) ? { ...settings } : {};
    next[CARD_MOTION_SETTINGS_KEY] = {
      ...(next[CARD_MOTION_SETTINGS_KEY] && typeof next[CARD_MOTION_SETTINGS_KEY] === "object" ? next[CARD_MOTION_SETTINGS_KEY] : {}),
      cardAnimationsReduced: Boolean(cardMotionPreferenceState.reduced)
    };
    return arenaStorageWriteSettings(next);
  } catch (_) { return false; }
}

function cardMotionSyncControls() {
  if (typeof document === "undefined") return false;
  const reduced = Boolean(cardMotionPreferenceState.reduced);
  if (document.documentElement) document.documentElement.dataset.cardMotion = reduced ? "reduced" : "on";
  document.querySelectorAll("[data-arena-card-motion-toggle]").forEach(button => {
    button.textContent = reduced ? "Carte animate RIDOTTE" : "Carte animate ON";
    button.setAttribute("aria-pressed", reduced ? "true" : "false");
    button.classList.toggle("isReduced", reduced);
  });
  return true;
}

function cardMotionSetReduced(reduced, options = {}) {
  cardMotionPreferenceState.reduced = Boolean(reduced);
  cardMotionPreferenceState.loaded = true;
  if (options.persist !== false) cardMotionWritePreferences();
  cardMotionSyncControls();
  return cardMotionPreferenceState.reduced;
}

function cardMotionToggleReduced() {
  return cardMotionSetReduced(!cardMotionPreferenceState.reduced, { persist:true });
}

function cardMotionBindControls() {
  if (typeof document === "undefined") return false;
  document.querySelectorAll("[data-arena-card-motion-toggle]").forEach(button => {
    if (button.dataset.arenaCardMotionBound === "1") return;
    button.dataset.arenaCardMotionBound = "1";
    button.addEventListener("click", cardMotionToggleReduced);
  });
  cardMotionSyncControls();
  return true;
}

function cardMotionInitializePreferences() {
  if (!cardMotionPreferenceState.loaded) {
    const preferences = cardMotionReadPreferences();
    cardMotionPreferenceState.reduced = Boolean(preferences.reduced);
    cardMotionPreferenceState.loaded = true;
  }
  cardMotionBindControls();
  return { reduced:cardMotionPreferenceState.reduced, systemReduced:cardMotionSystemReducedMotion() };
}

function cardMotionEnsureDom() {
  if (typeof document === "undefined") return null;
  if (cardMotionDom && cardMotionDom.root && cardMotionDom.root.isConnected) return cardMotionDom;
  const host = document.getElementById("gameScreen") || document.body;
  if (!host) return null;
  let root = document.getElementById("cardMotionRoot");
  if (!root) {
    root = document.createElement("div");
    root.id = "cardMotionRoot";
    root.className = "cardMotionRoot";
    root.setAttribute("aria-live", "polite");
    root.innerHTML = `<div id="cardMotionStage" class="cardMotionStage" hidden></div>`;
    host.appendChild(root);
  }
  cardMotionDom = { root, stage:root.querySelector("#cardMotionStage") };
  return cardMotionDom;
}

function cardMotionClearTimer() {
  if (cardMotionTimer) clearTimeout(cardMotionTimer);
  cardMotionTimer = null;
}

function cardMotionFaceHtml(item) {
  if (!item.faceUp) return cardBackVisualHtml(item.faction, { compact:true, blocked:item.kind === "block" });
  return `<div class="cardMotionFace faction-${cardBackEscape(String(item.faction || "neutral").toLowerCase())}">
    <span class="cardMotionKind">${cardBackEscape(item.label || "CARTA")}</span>
    <strong>${cardBackEscape(item.cardName || "Carta")}</strong>
    <small>${cardBackEscape(item.faction || "")}</small>
  </div>`;
}

function cardMotionRenderCurrent() {
  const dom = cardMotionEnsureDom();
  if (!dom || !dom.stage || !cardMotionCurrent) return false;
  const item = cardMotionCurrent;
  dom.stage.hidden = false;
  dom.stage.className = `cardMotionStage kind-${cardBackEscape(item.kind || "generic")} ${cardMotionReducedMotion() ? "reduced" : ""}`;
  dom.stage.innerHTML = `<div class="cardMotionCardWrap">${cardMotionFaceHtml(item)}<span class="cardMotionCaption">${cardBackEscape(item.caption || "")}</span></div>`;
  return true;
}

function cardMotionShowNext() {
  cardMotionClearTimer();
  if (cardMotionCurrent || !cardMotionQueue.length) return false;
  cardMotionCurrent = cardMotionQueue.shift();
  cardMotionRenderCurrent();
  const duration = cardMotionReducedMotion() ? CARD_MOTION_CONFIG.reducedDurationMs : CARD_MOTION_CONFIG.durationMs;
  cardMotionTimer = setTimeout(() => cardMotionFinishCurrent(), duration);
  return true;
}

function cardMotionFinishCurrent() {
  cardMotionClearTimer();
  const dom = cardMotionEnsureDom();
  if (dom && dom.stage) { dom.stage.hidden = true; dom.stage.innerHTML = ""; }
  cardMotionCurrent = null;
  if (cardMotionQueue.length) setTimeout(cardMotionShowNext, 0);
  return true;
}

function cardMotionClear() {
  cardMotionQueue = [];
  cardMotionCurrent = null;
  cardMotionRecent.clear();
  cardMotionClearTimer();
  const dom = cardMotionEnsureDom();
  if (dom && dom.stage) { dom.stage.hidden = true; dom.stage.innerHTML = ""; }
  return true;
}

function cardMotionEnqueue(item) {
  if (!item) return false;
  const now = Date.now();
  const key = String(item.key || `${item.kind}:${item.side || ""}:${item.cardName || ""}`);
  const previous = cardMotionRecent.get(key) || 0;
  if (now - previous < CARD_MOTION_CONFIG.dedupeWindowMs) return false;
  cardMotionRecent.set(key, now);
  item = { id:`card-motion-${++cardMotionSeq}`, kind:"generic", faceUp:false, faction:"", label:"CARTA", caption:"", ...item };
  if (cardMotionQueue.length >= CARD_MOTION_CONFIG.queueMax) cardMotionQueue.shift();
  cardMotionQueue.push(item);
  cardMotionShowNext();
  return true;
}

function cardMotionResolveDrawnCard(side, entry) {
  if (typeof state === "undefined" || !state || !entry) return null;
  const zones = [state.hand && state.hand[side], state.discard && state.discard[side]].filter(Array.isArray);
  for (const zone of zones) {
    const found = zone.find(card => card && card.cardUid === entry.cardUid);
    if (found) return found;
  }
  return null;
}

function cardMotionDescriptorForGameEvent(event) {
  if (!event || !event.type) return null;
  const d = event.data || {};
  const type = event.type;
  if (type === "GAME_STARTED") return { clear:true };
  if (type === "CARD_DRAWN") {
    const side = Number(d.player) || 0;
    const first = Array.isArray(d.cards) ? d.cards[0] : null;
    const card = cardMotionResolveDrawnCard(side, first);
    const visible = cardPresentationCanViewHand(side);
    return { kind:"draw", side, faction:d.faction || (typeof state !== "undefined" && state && state.factions && state.factions[side]), faceUp:Boolean(visible && card), cardName:visible && card ? card.name : "", label:"PESCA", caption:`${visible && card ? card.name : "Carta pescata"}${Number(d.count) > 1 ? ` ×${d.count}` : ""}`, key:`draw:${event.seq || ""}:${side}` };
  }
  if (type === "CARD_PLAYED") {
    // La Missione ha il proprio evento pubblico MISSION_PLAYED: evitare due animazioni consecutive della stessa carta.
    if (d.sourceType === "mission" || d.cardType === "mission") return null;
    return { kind:"play", side:d.player, faction:d.faction, faceUp:true, cardName:d.cardName || "Carta", label:"GIOCATA", caption:`${d.cardName || "Carta"} giocata`, key:`play:${d.cardUid || event.seq}` };
  }
  if (type === "MISSION_PLAYED") return { kind:"mission", side:d.player, faction:d.faction, faceUp:true, cardName:d.missionName || "Missione", label:"MISSIONE", caption:"Missione giocata", key:`mission:${d.player}:${d.missionId}:${d.cycle || ""}` };
  if (type === "CARD_DISCARDED") {
    const visible = cardPresentationCanViewHand(d.player || d.side) || d.public === true;
    return { kind:"discard", side:d.player || d.side, faction:d.faction, faceUp:visible, cardName:visible ? (d.cardName || "Carta") : "", label:"SCARTO", caption:visible ? `${d.cardName || "Carta"} scartata` : "Carta avversaria scartata", key:`discard:${d.cardUid || event.seq}` };
  }
  if (type === "CARD_STOLEN") {
    const reveal = cardPresentationCanRevealTransfer(d.fromSide, d.toSide);
    return { kind:"steal", side:d.toSide, faction:d.toFaction, faceUp:reveal, cardName:reveal ? (d.cardName || "Carta") : "", label:"FURTO", caption:reveal ? `${d.cardName || "Carta"} rubata` : "Carta coperta rubata", key:`steal:${d.cardUid || event.seq}` };
  }
  if (type === "CARD_BLOCKED") return { kind:"block", side:d.enemy, faction:d.enemyFaction, faceUp:false, label:"BLOCCO", caption:`${Number(d.count || (d.blocked && d.blocked.length) || 1)} carta/e bloccata/e`, key:`block:${d.enemy}:${event.seq || d.round || ""}` };
  if (type === "CARD_UNBLOCKED") return { kind:"unblock", side:d.player, faction:d.faction, faceUp:false, label:"SBLOCCO", caption:`${Number(d.count || 1)} carta/e liberata/e`, key:`unblock:${d.player}:${event.seq || d.round || ""}` };
  if (type === "DECK_RECOVERED") return { kind:"recover", side:d.player, faction:d.faction, faceUp:false, label:"RIMESCOLA", caption:`Deck riorganizzato · ${d.deckSize || 0} carte`, key:`recover:${d.player}:${d.missionCycle || ""}:${event.seq || ""}` };
  return null;
}

function cardMotionEnqueueGameEvent(event) {
  const descriptor = cardMotionDescriptorForGameEvent(event);
  if (!descriptor) return false;
  if (descriptor.clear) return cardMotionClear();
  return cardMotionEnqueue(descriptor);
}

function cardMotionDiagnostics() {
  return {
    config:{...CARD_MOTION_CONFIG},
    preferences:{ reduced:Boolean(cardMotionPreferenceState.reduced), systemReduced:cardMotionSystemReducedMotion(), effectiveReduced:cardMotionReducedMotion() },
    viewerSide:cardPresentationViewerSide(),
    displaySide:cardPresentationDisplaySide(),
    current:cardMotionCurrent ? {...cardMotionCurrent} : null,
    queue:cardMotionQueue.map(item => ({...item})),
    backs:["Nexus","Exordium","Liberti","Agathoi","Fabeot"].reduce((out, faction) => { out[faction] = cardBackCandidatesForFaction(faction); return out; }, {})
  };
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cardMotionInitializePreferences, { once:true });
  else setTimeout(cardMotionInitializePreferences, 0);
}
