"use strict";

// Arena Rubra – F9O3 Event & Narrative Overlay Foundation.
// Coda visuale non bloccante per eventi rapidi + fondazione narrativa riutilizzabile.

const EVENT_OVERLAY_CONFIG = Object.freeze({
  durationMs: 1000,
  reducedDurationMs: 520,
  queueMax: 24,
  dedupeWindowMs: 240,
  lowAlpha: 0.23
});

const EVENT_OVERLAY_PRIORITY = Object.freeze({ low:0, info:1, high:2, critical:3 });

let eventOverlayQueue = [];
let eventOverlayCurrent = null;
let eventOverlayTimer = null;
let eventOverlaySequence = 0;
let eventOverlayRecentKeys = new Map();
let eventOverlayThreatState = { 1:false, 2:false };
let eventOverlayDom = null;

const NARRATIVE_EXPRESSIONS = Object.freeze(["neutral", "explain", "approve", "warning", "stern"]);
const NARRATIVE_EXPRESSION_SYMBOL = Object.freeze({
  neutral:"●", explain:"?", approve:"✓", warning:"!", stern:"◆"
});
const narrativePortraitSets = new Map();
let narrativeState = { messages:[], index:0, options:{}, open:false };
let narrativeDom = null;

function eventOverlayReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return Boolean(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function eventOverlayEscape(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));
}

function eventOverlayEnsureDom() {
  if (typeof document === "undefined") return null;
  if (eventOverlayDom && eventOverlayDom.root && eventOverlayDom.root.isConnected) return eventOverlayDom;
  const host = document.getElementById("gameScreen") || document.body;
  if (!host) return null;

  let root = document.getElementById("gameEventOverlayRoot");
  if (!root) {
    root = document.createElement("div");
    root.id = "gameEventOverlayRoot";
    root.className = "gameEventOverlayRoot";
    root.setAttribute("aria-live", "polite");
    root.setAttribute("aria-atomic", "true");
    root.innerHTML = `
      <button id="gameEventOverlayCard" class="gameEventOverlayCard" type="button" hidden aria-label="Chiudi messaggio evento">
        <span class="gameEventOverlayIcon" aria-hidden="true"></span>
        <span class="gameEventOverlayCopy">
          <strong class="gameEventOverlayTitle"></strong>
          <span class="gameEventOverlayMessage"></span>
        </span>
      </button>`;
    host.appendChild(root);
  }

  const card = root.querySelector("#gameEventOverlayCard");
  const icon = root.querySelector(".gameEventOverlayIcon");
  const title = root.querySelector(".gameEventOverlayTitle");
  const message = root.querySelector(".gameEventOverlayMessage");
  if (card && !card.dataset.f9o3Bound) {
    card.dataset.f9o3Bound = "1";
    card.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      eventOverlayDismissCurrent("click");
    });
  }
  eventOverlayDom = { root, card, icon, title, message };
  return eventOverlayDom;
}

function eventOverlayNormalizeItem(item) {
  const safe = item && typeof item === "object" ? item : { title:String(item || "Evento") };
  const priorityName = Object.prototype.hasOwnProperty.call(EVENT_OVERLAY_PRIORITY, safe.priority) ? safe.priority : "info";
  return {
    id: safe.id || `evt-${Date.now()}-${++eventOverlaySequence}`,
    key: safe.key || `${safe.type || "event"}:${safe.title || ""}:${safe.message || ""}`,
    type: safe.type || "EVENT",
    title: String(safe.title || "EVENTO"),
    message: String(safe.message || ""),
    icon: String(safe.icon || "◆"),
    side: Number(safe.side) || null,
    faction: safe.faction || null,
    priority: priorityName,
    priorityValue: EVENT_OVERLAY_PRIORITY[priorityName],
    durationMs: Math.max(250, Number(safe.durationMs) || EVENT_OVERLAY_CONFIG.durationMs),
    createdAt: Date.now(),
    sourceEvent: safe.sourceEvent || null
  };
}

function eventOverlayQueueTrim() {
  if (eventOverlayQueue.length <= EVENT_OVERLAY_CONFIG.queueMax) return;
  const removable = eventOverlayQueue
    .map((item, index) => ({ item, index }))
    .sort((a,b) => a.item.priorityValue - b.item.priorityValue || a.item.createdAt - b.item.createdAt);
  while (eventOverlayQueue.length > EVENT_OVERLAY_CONFIG.queueMax && removable.length) {
    const candidate = removable.shift();
    const liveIndex = eventOverlayQueue.findIndex(item => item.id === candidate.item.id);
    if (liveIndex >= 0) eventOverlayQueue.splice(liveIndex, 1);
  }
}

function eventOverlayEnqueue(item) {
  const normalized = eventOverlayNormalizeItem(item);
  const now = Date.now();
  const recent = eventOverlayRecentKeys.get(normalized.key) || 0;
  if (now - recent < EVENT_OVERLAY_CONFIG.dedupeWindowMs) return false;
  eventOverlayRecentKeys.set(normalized.key, now);
  for (const [key, at] of eventOverlayRecentKeys.entries()) if (now - at > 5000) eventOverlayRecentKeys.delete(key);

  if (eventOverlayCurrent && normalized.priorityValue === EVENT_OVERLAY_PRIORITY.critical && eventOverlayCurrent.priorityValue < normalized.priorityValue) {
    eventOverlayQueue.unshift(normalized);
    eventOverlayDismissCurrent("critical-preempt");
    return true;
  }

  eventOverlayQueue.push(normalized);
  eventOverlayQueue.sort((a,b) => b.priorityValue - a.priorityValue || a.createdAt - b.createdAt);
  eventOverlayQueueTrim();
  eventOverlayShowNext();
  return true;
}

function eventOverlayShowNext() {
  if (eventOverlayCurrent || !eventOverlayQueue.length) return false;
  const dom = eventOverlayEnsureDom();
  if (!dom || !dom.card) return false;
  const item = eventOverlayQueue.shift();
  eventOverlayCurrent = item;
  dom.icon.textContent = item.icon;
  dom.title.textContent = item.title;
  dom.message.textContent = item.message;
  dom.card.dataset.priority = item.priority;
  dom.card.dataset.eventType = item.type;
  dom.card.hidden = false;
  dom.card.classList.remove("isRunning", "isReduced");
  const reduced = eventOverlayReducedMotion();
  if (reduced) dom.card.classList.add("isReduced");
  const duration = reduced ? Math.min(item.durationMs, EVENT_OVERLAY_CONFIG.reducedDurationMs) : item.durationMs;
  dom.card.style.setProperty("--event-overlay-duration", `${duration}ms`);
  // Restart dell'animazione anche per messaggi consecutivi dello stesso tipo.
  void dom.card.offsetWidth;
  dom.card.classList.add("isRunning");
  clearTimeout(eventOverlayTimer);
  eventOverlayTimer = setTimeout(() => eventOverlayDismissCurrent("timeout"), duration + 24);
  return true;
}

function eventOverlayDismissCurrent(reason="manual") {
  clearTimeout(eventOverlayTimer);
  eventOverlayTimer = null;
  const dom = eventOverlayEnsureDom();
  if (dom && dom.card) {
    dom.card.classList.remove("isRunning", "isReduced");
    dom.card.hidden = true;
    dom.card.dataset.dismissReason = reason;
  }
  eventOverlayCurrent = null;
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => eventOverlayShowNext());
  } else {
    eventOverlayShowNext();
  }
  return true;
}

function eventOverlayClear(options={}) {
  eventOverlayQueue = [];
  eventOverlayRecentKeys.clear();
  clearTimeout(eventOverlayTimer);
  eventOverlayTimer = null;
  eventOverlayCurrent = null;
  if (options.resetThreats !== false) eventOverlayThreatState = { 1:false, 2:false };
  const dom = eventOverlayEnsureDom();
  if (dom && dom.card) {
    dom.card.hidden = true;
    dom.card.classList.remove("isRunning", "isReduced");
  }
}

function eventOverlaySideLabel(side, faction=null) {
  const s = Number(side);
  const factionName = faction || (typeof state !== "undefined" && state && state.factions ? state.factions[s] : null);
  return `Giocatore ${s || "?"}${factionName ? ` · ${factionName}` : ""}`;
}

function eventOverlayCoordLabel(coord) {
  return Array.isArray(coord) ? `[${coord.join(",")}]` : "";
}

function eventOverlayResolveUnit(data={}) {
  if (typeof state !== "undefined" && state && Array.isArray(state.units) && data.unitId) {
    const runtime = state.units.find(unit => unit && unit.uid === data.unitId);
    if (runtime) return runtime;
  }
  if (typeof BLUEPRINTS !== "undefined" && Array.isArray(BLUEPRINTS) && data.blueprintId) {
    const bp = BLUEPRINTS.find(item => item && item.id === data.blueprintId);
    if (bp) return bp;
  }
  return null;
}

function eventOverlayMissionDefinition(missionId) {
  if (typeof missionDefinitionById === "function") return missionDefinitionById(missionId);
  if (typeof MISSION_DEFINITIONS !== "undefined" && Array.isArray(MISSION_DEFINITIONS)) return MISSION_DEFINITIONS.find(item => item.id === missionId) || null;
  return null;
}

function eventOverlayMissionItem(definition, objectiveId) {
  if (!definition) return null;
  const list = definition.missionClass === "desperate" ? (definition.conditions || []) : (definition.objectives || []);
  return list.find(item => item && item.id === objectiveId) || null;
}

function eventOverlayDescriptorsForGameEvent(event) {
  const d = event && event.data ? event.data : {};
  const type = event && event.type ? event.type : "";
  const out = [];
  if (!type) return out;

  if (type === "TURN_STARTED") {
    out.push({ type, title:"INIZIO TURNO", message:eventOverlaySideLabel(d.player, d.faction), icon:"▶", side:d.player, faction:d.faction, key:`turn:${d.round}:${d.player}` });
  }

  if (type === "PS_CONTROL_CHANGED") {
    const prev = Number(d.previousControl) || null;
    const next = Number(d.nextControl) || null;
    const coord = eventOverlayCoordLabel(d.coord);
    if (!prev && next) out.push({ type, title:"PS OCCUPATO", message:`${eventOverlaySideLabel(next)} ${coord}`.trim(), icon:"⬢", side:next, key:`ps-occupied:${coord}:${next}:${d.round}` });
    else if (prev && !next) out.push({ type, title:d.locked ? "PS BLOCCATO" : "PS LIBERATO", message:`Punto Strategico ${coord}`.trim(), icon:d.locked ? "⊘" : "◇", side:prev, priority:d.locked ? "high" : "info", key:`ps-${d.locked ? "locked" : "freed"}:${coord}:${d.round}` });
    else if (prev && next && prev !== next) out.push({ type, title:"PS CONQUISTATO", message:`${eventOverlaySideLabel(next)} ${coord}`.trim(), icon:"⬢", side:next, priority:"high", key:`ps-captured:${coord}:${next}:${d.round}` });
  }

  if (type === "UNIT_SPAWNED" || type === "UNIT_BUILT") {
    const unit = eventOverlayResolveUnit(d);
    const unitType = d.unitType || (unit && unit.type) || "";
    const unitWeight = d.unitWeight || (unit && unit.weight) || "";
    const name = d.unitName || (unit && unit.name) || "Unità";
    if (unitType === "Comandante") out.push({ type, title:"COMANDANTE IN GIOCO", message:`${eventOverlaySideLabel(d.player, d.faction)} · ${name}`, icon:"★", side:d.player, priority:"high", key:`commander-in:${d.unitId}` });
    else if (String(unitWeight).toLowerCase() === "pivot") out.push({ type, title:"PIVOT IN GIOCO", message:`${eventOverlaySideLabel(d.player, d.faction)} · ${name}`, icon:"◆", side:d.player, priority:"high", key:`pivot-in:${d.unitId}` });
  }

  if (type === "UNIT_DESTROYED") {
    if (d.unitType === "Comandante") out.push({ type, title:"COMANDANTE SCONFITTO", message:`${eventOverlaySideLabel(d.side, d.faction)} · ${d.unitName || "Comandante"}`, icon:"✦", side:d.side, priority:"critical", key:`commander-out:${d.unitId}` });
    else if (String(d.unitWeight || d.unitRole || "").toLowerCase() === "pivot") out.push({ type, title:"PIVOT DISTRUTTA", message:`${eventOverlaySideLabel(d.side, d.faction)} · ${d.unitName || "Pivot"}`, icon:"✕", side:d.side, priority:"critical", key:`pivot-out:${d.unitId}` });
  }

  if (type === "MISSION_READY") {
    const def = eventOverlayMissionDefinition(d.missionId);
    if (!def || def.missionClass !== "desperate") out.push({ type, title:"MISSIONE SUPERATA", message:`${eventOverlaySideLabel(d.player, d.faction)} · ${d.missionName || (def && def.name) || "Missione"}`, icon:"✓", side:d.player, priority:"high", key:`mission-ready:${d.player}:${d.missionId}:${d.cycle}` });
  }

  if (type === "MISSION_PROGRESS_CHANGED") {
    const def = eventOverlayMissionDefinition(d.missionId);
    const previous = d.previous || {};
    if (def && def.missionClass === "desperate" && Boolean(d.completed) && !Boolean(previous.completed)) {
      const list = def.conditions || [];
      const item = eventOverlayMissionItem(def, d.objectiveId);
      const index = Math.max(0, list.findIndex(entry => entry.id === d.objectiveId));
      out.push({
        type,
        title:`MISSIONE DISPERATA · ${index + 1}/${list.length || 3}`,
        message:`${d.missionName || def.name}: ${(item && item.text) || "condizione superata"}`,
        icon:"⚠",
        side:d.player,
        priority:"high",
        key:`mission-condition:${d.player}:${d.missionId}:${d.objectiveId}:${d.cycle || 1}`
      });
    }
  }

  if (type === "MISSION_PLAYED") out.push({ type, title:"CARTA MISSIONE GIOCATA", message:`${eventOverlaySideLabel(d.player, d.faction)} · ${d.missionName || "Missione"}`, icon:"▣", side:d.player, priority:"high", key:`mission-played:${d.player}:${d.missionId}:${d.cycle}` });
  if (type === "DECK_EXHAUSTED") out.push({ type, title:"DECK TERMINATO", message:eventOverlaySideLabel(d.player, d.faction), icon:"□", side:d.player, priority:"high", key:`deck-empty:${d.player}:${d.round}` });
  if (type === "DECK_RECOVERED") out.push({ type, title:"DECK RIMESCOLATO", message:`${eventOverlaySideLabel(d.player, d.faction)} · ${d.deckSize || 0} carte`, icon:"↻", side:d.player, priority:"high", key:`deck-recovered:${d.player}:${d.missionCycle || 0}:${d.deckSize}` });
  if (type === "PRESSURE_CHANGED" && Number(d.delta) > 0) out.push({ type, title:"AUMENTO PRESSIONE", message:`${eventOverlaySideLabel(d.player, d.faction)} · ${d.current}/${d.limit}`, icon:"▲", side:d.player, priority:"high", key:`pressure:${d.player}:${d.current}:${d.round}` });
  if (type === "HQ_THREATENED") out.push({ type, title:"QG MINACCIATO", message:`${eventOverlaySideLabel(d.hqSide, d.hqFaction)} · nemico entro R${d.range || 4}`, icon:"!", side:d.hqSide, priority:"critical", key:`hq-threat:${d.hqSide}:${d.episode || 1}` });
  if (type === "UNIT_CONVERTED") out.push({ type, title:"UNITÀ CONVERTITA", message:`${d.unitName || d.targetName || "Unità"} passa a ${eventOverlaySideLabel(d.newSide, d.newFaction)}`, icon:"⇄", side:d.newSide, priority:"high", key:`converted:${d.unitId || d.targetId}:${d.newSide}` });
  if (type === "CARD_STOLEN") {
    const visibleName = typeof cardPresentationEventCardName === "function" ? cardPresentationEventCardName(d, "Carta coperta") : (d.cardName || "Carta");
    out.push({ type, title:"CARTA RUBATA", message:`${eventOverlaySideLabel(d.toSide, d.toFaction)} · ${visibleName}`, icon:"↤", side:d.toSide, priority:"high", key:`card-stolen:${d.cardUid}:${d.toSide}` });
  }
  if (type === "CARD_BLOCKED" && Number(d.count || (d.blocked && d.blocked.length) || 0) > 0) out.push({ type, title:"CARTE BLOCCATE", message:`${eventOverlaySideLabel(d.enemy, d.enemyFaction)} · ${Number(d.count || d.blocked.length)} carta/e`, icon:"⊘", side:d.enemy, priority:"high", key:`card-blocked:${d.enemy}:${d.round || ""}:${d.source || ""}` });

  if (type === "VICTORY") {
    const winner = Number(d.winner) || null;
    const humanSides = typeof state !== "undefined" && state && state.modes ? [1,2].filter(side => state.modes[side] === "human") : [];
    const localDefeat = Boolean(winner && humanSides.length === 1 && humanSides[0] !== winner);
    if (winner) out.push({ type, title:localDefeat ? "SCONFITTA" : "VITTORIA", message:`${eventOverlaySideLabel(winner, d.winnerFaction)} · ${d.winType || "partita conclusa"}`, icon:localDefeat ? "◆" : "✹", side:winner, priority:"critical", key:`victory:${winner}:${d.round}:${d.winType}` });
    else out.push({ type, title:"PAREGGIO", message:d.message || "Partita conclusa", icon:"＝", priority:"critical", key:`draw:${d.round}:${d.winType}` });
  }

  return out;
}

function eventOverlayRelevantForThreatCheck(type) {
  return ["GAME_STARTED", "TURN_STARTED", "UNIT_SPAWNED", "UNIT_BUILT", "UNIT_MOVED", "UNIT_DESTROYED", "UNIT_CONVERTED"].includes(type);
}

function eventOverlayEvaluateHqThreats(triggerEvent=null) {
  if (typeof state === "undefined" || !state || typeof getHq !== "function" || typeof hexDistance !== "function") return;
  const episodeMap = state.f9o3HqThreatEpisodes || (state.f9o3HqThreatEpisodes = {1:0,2:0});
  for (const hqSide of [1,2]) {
    const hq = getHq(hqSide);
    if (!hq || !Array.isArray(hq.pos)) continue;
    const enemy = hqSide === 1 ? 2 : 1;
    const enemies = Array.isArray(state.units) ? state.units.filter(unit => unit && unit.alive !== false && unit.type !== "QG" && unit.side === enemy && Array.isArray(unit.pos)) : [];
    const nearest = enemies.map(unit => ({ unit, distance:hexDistance(unit.pos, hq.pos) })).sort((a,b) => a.distance - b.distance)[0] || null;
    const threatened = Boolean(nearest && nearest.distance <= 4);
    const wasThreatened = Boolean(eventOverlayThreatState[hqSide]);
    eventOverlayThreatState[hqSide] = threatened;
    if (threatened && !wasThreatened && typeof emitGameEvent === "function" && typeof EventTypes !== "undefined" && EventTypes.HQ_THREATENED) {
      episodeMap[hqSide] = (episodeMap[hqSide] || 0) + 1;
      emitGameEvent({
        type:EventTypes.HQ_THREATENED,
        data:{ hqSide, hqFaction:state.factions && state.factions[hqSide], enemySide:enemy, enemyFaction:state.factions && state.factions[enemy], unitId:nearest.unit.uid, unitName:nearest.unit.name, distance:nearest.distance, range:4, episode:episodeMap[hqSide], round:state.turn, triggerType:triggerEvent && triggerEvent.type }
      });
    }
  }
}

function eventOverlayEnqueueGameEvent(event) {
  if (!event || !event.type) return false;
  if (event.type === "GAME_STARTED") {
    eventOverlayClear({ resetThreats:true });
    if (typeof state !== "undefined" && state) state.f9o3HqThreatEpisodes = {1:0,2:0};
  }
  const descriptors = eventOverlayDescriptorsForGameEvent(event);
  for (const descriptor of descriptors) eventOverlayEnqueue({ ...descriptor, sourceEvent:event });
  if (eventOverlayRelevantForThreatCheck(event.type)) eventOverlayEvaluateHqThreats(event);
  return descriptors.length > 0;
}

function eventOverlayDiagnostics() {
  return {
    config:{ ...EVENT_OVERLAY_CONFIG },
    current:eventOverlayCurrent ? { ...eventOverlayCurrent, sourceEvent:undefined } : null,
    queue:eventOverlayQueue.map(item => ({ ...item, sourceEvent:undefined })),
    threatState:{ ...eventOverlayThreatState },
    domReady:Boolean(eventOverlayDom && eventOverlayDom.root && eventOverlayDom.root.isConnected)
  };
}

// -----------------------------------------------------------------------------
// Fondazione narrativa per tutorial e campagne single-player.
// -----------------------------------------------------------------------------

function narrativeRegisterPortraitSet(id, frames={}) {
  if (!id) return false;
  const safe = {};
  for (const expression of NARRATIVE_EXPRESSIONS) if (frames && frames[expression]) safe[expression] = String(frames[expression]);
  narrativePortraitSets.set(String(id), safe);
  return true;
}

function narrativeEnsureDom() {
  if (typeof document === "undefined") return null;
  if (narrativeDom && narrativeDom.root && narrativeDom.root.isConnected) return narrativeDom;
  const host = document.getElementById("gameScreen") || document.body;
  if (!host) return null;
  let root = document.getElementById("narrativeOverlayRoot");
  if (!root) {
    root = document.createElement("div");
    root.id = "narrativeOverlayRoot";
    root.className = "narrativeOverlayRoot";
    root.hidden = true;
    root.innerHTML = `
      <section class="narrativeDialog" role="dialog" aria-modal="true" aria-labelledby="narrativeSpeaker" aria-describedby="narrativeText">
        <div class="narrativePortrait" aria-hidden="true">
          <img class="narrativePortraitImage" alt="" hidden />
          <span class="narrativePortraitPlaceholder"><b class="narrativePortraitSymbol">●</b><small class="narrativeExpressionLabel">neutral</small></span>
        </div>
        <div class="narrativeContent">
          <div class="narrativeHeader">
            <strong id="narrativeSpeaker">Narratore</strong>
            <span class="narrativeStepLabel"></span>
          </div>
          <div id="narrativeText" class="narrativeText"></div>
          <div class="narrativeControls">
            <button class="ghost narrativePrevBtn" type="button">Indietro</button>
            <button class="ghost narrativeRepeatBtn" type="button">Ripeti</button>
            <button class="ghost narrativeCloseBtn" type="button">Chiudi</button>
            <button class="primary narrativeNextBtn" type="button">Avanti</button>
          </div>
        </div>
      </section>`;
    host.appendChild(root);
  }
  const dialog = root.querySelector(".narrativeDialog");
  const portrait = root.querySelector(".narrativePortrait");
  const image = root.querySelector(".narrativePortraitImage");
  const placeholder = root.querySelector(".narrativePortraitPlaceholder");
  const symbol = root.querySelector(".narrativePortraitSymbol");
  const expressionLabel = root.querySelector(".narrativeExpressionLabel");
  const speaker = root.querySelector("#narrativeSpeaker");
  const text = root.querySelector("#narrativeText");
  const step = root.querySelector(".narrativeStepLabel");
  const prev = root.querySelector(".narrativePrevBtn");
  const repeat = root.querySelector(".narrativeRepeatBtn");
  const close = root.querySelector(".narrativeCloseBtn");
  const next = root.querySelector(".narrativeNextBtn");
  if (!root.dataset.f9o3Bound) {
    root.dataset.f9o3Bound = "1";
    prev.addEventListener("click", narrativePrevious);
    repeat.addEventListener("click", narrativeRepeat);
    close.addEventListener("click", narrativeClose);
    next.addEventListener("click", narrativeNext);
  }
  narrativeDom = { root, dialog, portrait, image, placeholder, symbol, expressionLabel, speaker, text, step, prev, repeat, close, next };
  return narrativeDom;
}

function narrativeResolvePortrait(message) {
  if (!message) return null;
  if (message.portraitSrc) return String(message.portraitSrc);
  const set = narrativePortraitSets.get(String(message.portraitSet || ""));
  if (!set) return null;
  const expression = NARRATIVE_EXPRESSIONS.includes(message.expression) ? message.expression : "neutral";
  return set[expression] || set.neutral || null;
}

function narrativeNormalizeMessage(message, index=0) {
  const safe = message && typeof message === "object" ? message : { text:String(message || "") };
  const expression = NARRATIVE_EXPRESSIONS.includes(safe.expression) ? safe.expression : "neutral";
  return {
    id:safe.id || `narrative-${index + 1}`,
    speaker:String(safe.speaker || "Narratore"),
    text:String(safe.text || ""),
    portraitSet:safe.portraitSet || null,
    portraitSrc:safe.portraitSrc || null,
    expression,
    side:safe.side === "right" ? "right" : "left",
    focus:safe.focus || null,
    highlight:Array.isArray(safe.highlight) ? [...safe.highlight] : [],
    allowedActions:Array.isArray(safe.allowedActions) ? [...safe.allowedActions] : [],
    metadata:safe.metadata || {}
  };
}

function narrativeRender() {
  const dom = narrativeEnsureDom();
  if (!dom || !narrativeState.open || !narrativeState.messages.length) return false;
  const message = narrativeState.messages[narrativeState.index];
  if (!message) return false;
  dom.root.hidden = false;
  dom.dialog.dataset.side = message.side;
  dom.dialog.dataset.expression = message.expression;
  dom.speaker.textContent = message.speaker;
  dom.text.textContent = message.text;
  dom.step.textContent = `${narrativeState.index + 1}/${narrativeState.messages.length}`;
  dom.prev.disabled = narrativeState.index <= 0;
  dom.next.textContent = narrativeState.index >= narrativeState.messages.length - 1 ? "Fine" : "Avanti";
  const src = narrativeResolvePortrait(message);
  if (src) {
    dom.image.src = src;
    dom.image.hidden = false;
    dom.placeholder.hidden = true;
  } else {
    dom.image.removeAttribute("src");
    dom.image.hidden = true;
    dom.placeholder.hidden = false;
    dom.symbol.textContent = NARRATIVE_EXPRESSION_SYMBOL[message.expression] || "●";
    dom.expressionLabel.textContent = message.expression;
  }
  if (typeof narrativeState.options.onRender === "function") {
    try { narrativeState.options.onRender(message, narrativeState.index); }
    catch (err) { console.warn("Arena Rubra F9O3 narrative onRender failed", err); }
  }
  return true;
}

function narrativeOpen(messages, options={}) {
  const list = Array.isArray(messages) ? messages : [messages];
  narrativeState = {
    messages:list.filter(item => item != null).map((item, index) => narrativeNormalizeMessage(item, index)),
    index:Math.max(0, Math.min(Number(options.startIndex) || 0, Math.max(0, list.length - 1))),
    options:{ ...options },
    open:true
  };
  if (!narrativeState.messages.length) return false;
  return narrativeRender();
}

function narrativeClose() {
  const dom = narrativeEnsureDom();
  const wasOpen = narrativeState.open;
  narrativeState.open = false;
  if (dom && dom.root) dom.root.hidden = true;
  if (wasOpen && narrativeState.options && typeof narrativeState.options.onClose === "function") {
    try { narrativeState.options.onClose(narrativeState.index); }
    catch (err) { console.warn("Arena Rubra F9O3 narrative onClose failed", err); }
  }
  return wasOpen;
}

function narrativeNext() {
  if (!narrativeState.open) return false;
  if (narrativeState.index >= narrativeState.messages.length - 1) return narrativeClose();
  narrativeState.index += 1;
  return narrativeRender();
}

function narrativePrevious() {
  if (!narrativeState.open || narrativeState.index <= 0) return false;
  narrativeState.index -= 1;
  return narrativeRender();
}

function narrativeRepeat() {
  if (!narrativeState.open) return false;
  const message = narrativeState.messages[narrativeState.index];
  if (narrativeState.options && typeof narrativeState.options.onRepeat === "function") {
    try { narrativeState.options.onRepeat(message, narrativeState.index); }
    catch (err) { console.warn("Arena Rubra F9O3 narrative onRepeat failed", err); }
  }
  return narrativeRender();
}

function narrativeCurrentMessage() {
  return narrativeState.open ? narrativeState.messages[narrativeState.index] || null : null;
}

function narrativeDiagnostics() {
  return {
    open:narrativeState.open,
    index:narrativeState.index,
    count:narrativeState.messages.length,
    current:narrativeCurrentMessage(),
    portraitSets:[...narrativePortraitSets.keys()],
    expressions:[...NARRATIVE_EXPRESSIONS],
    domReady:Boolean(narrativeDom && narrativeDom.root && narrativeDom.root.isConnected)
  };
}

// Placeholder manifest: gli asset definitivi possono sostituire questi frame senza cambiare API.
narrativeRegisterPortraitSet("tutorial-placeholder", {});

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { eventOverlayEnsureDom(); narrativeEnsureDom(); }, { once:true });
  else { eventOverlayEnsureDom(); narrativeEnsureDom(); }
}
