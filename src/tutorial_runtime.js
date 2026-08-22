"use strict";

// Arena Rubra – F9V1a Tutorial Runtime 2.0 · Authoritative Interaction & Selector Drift Hotfix.
// Basata sul runtime F9O7: conserva scenari/checkpoint e aggiunge un contratto di interazione autorevole.
// Motore data-driven con spotlight, vignette, input controllato, setup deterministico,
// comandi di scenario, eventi di completamento e checkpoint con ripristino dello stato.

const TUTORIAL_RUNTIME_STORAGE_KEY = "arenaRubra.tutorial.v1";
const TUTORIAL_RUNTIME_SCHEMA = 1;
const TUTORIAL_STEP_MODES = Object.freeze({
  INFORMATIVE:"informative",
  GUIDED:"guided",
  LOCKED:"locked"
});

let tutorialRuntimeMemoryStore = { schemaVersion:TUTORIAL_RUNTIME_SCHEMA, scenarios:{}, lessons:{}, updatedAt:null };

let tutorialRuntimeState = {
  active:false,
  scenario:null,
  scenarioId:"",
  stepIndex:0,
  step:null,
  target:null,
  allowedTargets:[],
  attentionTargets:[],
  previewPortals:[],
  spotlightDom:null,
  retryTimer:null,
  updateFrame:null,
  hintTimer:null,
  focusTimer:null,
  timers:new Set(),
  sessionToken:0,
  stepToken:0,
  preparingStep:false,
  targetRecoveryCount:0,
  closing:false,
  botPaused:false,
  lastAction:null
};

function tutorialRuntimeStorageClone(value) {
  try { return JSON.parse(JSON.stringify(value)); }
  catch (_) { return { schemaVersion:TUTORIAL_RUNTIME_SCHEMA, scenarios:{}, lessons:{}, updatedAt:null }; }
}

function tutorialRuntimeStorageRead() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TUTORIAL_RUNTIME_STORAGE_KEY) || "null");
    if (!parsed || parsed.schemaVersion !== TUTORIAL_RUNTIME_SCHEMA) throw new Error("schema");
    tutorialRuntimeMemoryStore = tutorialRuntimeStorageClone(parsed);
    return parsed;
  } catch (_) {
    return tutorialRuntimeStorageClone(tutorialRuntimeMemoryStore);
  }
}

function tutorialRuntimeStorageWrite(payload) {
  const safe = payload && typeof payload === "object" ? payload : tutorialRuntimeStorageRead();
  safe.schemaVersion = TUTORIAL_RUNTIME_SCHEMA;
  safe.updatedAt = new Date().toISOString();
  tutorialRuntimeMemoryStore = tutorialRuntimeStorageClone(safe);
  try { localStorage.setItem(TUTORIAL_RUNTIME_STORAGE_KEY, JSON.stringify(safe)); }
  catch (_) { /* fallback memoria per contesti senza localStorage */ }
  return tutorialRuntimeStorageClone(safe);
}

function tutorialRuntimeScenarioById(id) {
  if (!id || typeof TUTORIAL_SCENARIOS_F9O6 === "undefined") return null;
  return TUTORIAL_SCENARIOS_F9O6[String(id)] || null;
}

function tutorialRuntimeProgressForScenario(id) {
  const store = tutorialRuntimeStorageRead();
  return store.scenarios && store.scenarios[id] ? { ...store.scenarios[id] } : null;
}

function tutorialRuntimeGameSnapshot() {
  if (!state) return null;
  const clone = value => tutorialRuntimeStorageClone(value);
  return {
    currentPlayer:state.currentPlayer,
    turn:state.turn,
    orderIndex:state.orderIndex,
    turnOrder:clone(state.turnOrder || []),
    energy:clone(state.energy || {}),
    units:clone(state.units || []),
    hand:clone(state.hand || {}),
    deck:clone(state.deck || {}),
    discard:clone(state.discard || {}),
    starterCards:clone(state.starterCards || {}),
    tacticUsedThisTurn:clone(state.tacticUsedThisTurn || {}),
    tacticCooldowns:clone(state.tacticCooldowns || {}),
    turnsStarted:clone(state.turnsStarted || {}),
    pressure:clone(state.pressure || {}),
    instanceCounters:clone(state.instanceCounters || {}),
    playerEffects:clone(state.playerEffects || {}),
    tutorialBotPaused:true
  };
}

function tutorialRuntimeRestoreGameSnapshot(snapshot) {
  if (!state || !snapshot || typeof snapshot !== "object") return false;
  for (const key of ["currentPlayer","turn","orderIndex","turnOrder","energy","units","hand","deck","discard","starterCards","tacticUsedThisTurn","tacticCooldowns","turnsStarted","pressure","instanceCounters","playerEffects"]) {
    if (Object.prototype.hasOwnProperty.call(snapshot, key)) state[key] = tutorialRuntimeStorageClone(snapshot[key]);
  }
  state.tutorialMode = true;
  state.tutorialScenarioId = tutorialRuntimeState.scenarioId;
  state.tutorialLessonId = tutorialRuntimeState.scenario && tutorialRuntimeState.scenario.lessonId || null;
  state.tutorialBotPaused = true;
  state.matchRecorded = false;
  if (typeof syncCardDebugState === "function") syncCardDebugState();
  if (typeof resetInteractionContext === "function") resetInteractionContext();
  if (typeof updateControlFromOccupants === "function") updateControlFromOccupants();
  if (typeof renderAll === "function") renderAll();
  return true;
}

function tutorialRuntimeSaveProgress(options={}) {
  if (!tutorialRuntimeState.scenarioId) return null;
  const store = tutorialRuntimeStorageRead();
  store.scenarios = store.scenarios || {};
  store.lessons = store.lessons || {};
  const previous = store.scenarios[tutorialRuntimeState.scenarioId] || {};
  const nextIndex = Number.isFinite(options.nextStepIndex) ? options.nextStepIndex : tutorialRuntimeState.stepIndex;
  const snapshot = options.includeSnapshot === true ? tutorialRuntimeGameSnapshot() : (previous.snapshot || null);
  store.scenarios[tutorialRuntimeState.scenarioId] = {
    ...previous,
    scenarioId:tutorialRuntimeState.scenarioId,
    nextStepIndex:Math.max(0, nextIndex),
    completed:options.completed === true || previous.completed === true,
    lastStepId:tutorialRuntimeState.step && tutorialRuntimeState.step.id || previous.lastStepId || null,
    snapshot,
    updatedAt:new Date().toISOString()
  };
  const lessonId = tutorialRuntimeState.scenario && tutorialRuntimeState.scenario.lessonId;
  if (lessonId) {
    const priorLesson = store.lessons[lessonId] || {};
    store.lessons[lessonId] = {
      ...priorLesson,
      completed:options.completed === true || priorLesson.completed === true,
      scenarioId:tutorialRuntimeState.scenarioId,
      updatedAt:new Date().toISOString()
    };
  }
  return tutorialRuntimeStorageWrite(store);
}

function tutorialRuntimeResetProgress() {
  tutorialRuntimeMemoryStore = { schemaVersion:TUTORIAL_RUNTIME_SCHEMA, scenarios:{}, lessons:{}, updatedAt:null };
  try { localStorage.removeItem(TUTORIAL_RUNTIME_STORAGE_KEY); }
  catch (_) { /* no-op */ }
  tutorialRuntimeRenderMenu();
  tutorialRuntimeSetStatus("Progressi tutorial azzerati.");
  return true;
}

function tutorialRuntimeSetStatus(text) {
  if (typeof document === "undefined") return;
  const el = document.getElementById("tutorialRuntimeStatus");
  if (el) el.textContent = String(text || "");
}

function tutorialRuntimeRenderMenu() {
  if (typeof document === "undefined") return false;
  const grid = document.getElementById("tutorialLessonGrid");
  if (!grid) return false;
  const store = tutorialRuntimeStorageRead();
  const plan = typeof TUTORIAL_LESSON_PLAN_F9O6 !== "undefined" ? TUTORIAL_LESSON_PLAN_F9O6 : [];
  grid.innerHTML = plan.map(lesson => {
    const progress = store.lessons && store.lessons[lesson.id] || null;
    const scenarioProgress = lesson.scenarioId && store.scenarios && store.scenarios[lesson.scenarioId] || null;
    const available = Boolean(lesson.scenarioId && tutorialRuntimeScenarioById(lesson.scenarioId));
    const completed = Boolean(progress && progress.completed);
    const canResume = Boolean(available && scenarioProgress && !scenarioProgress.completed && scenarioProgress.snapshot && Number.isFinite(scenarioProgress.nextStepIndex) && scenarioProgress.nextStepIndex > 0);
    const status = completed ? "Completata" : (available ? "Disponibile" : "Bloccata");
    const actions = available
      ? `<div class="tutorialLessonCardActions"><button class="${completed ? "ghost" : "primary"}" type="button" data-tutorial-start="${tutorialRuntimeEscape(lesson.scenarioId)}">${completed ? "Ripeti" : "Avvia"}</button><button class="ghost" type="button" data-tutorial-resume="${tutorialRuntimeEscape(lesson.scenarioId)}"${canResume ? "" : " disabled"}>Riprendi</button></div>`
      : "";
    return `<article class="tutorialLessonCard${available ? " isAvailable" : " isLocked"}" data-tutorial-lesson="${String(lesson.id)}">
      <h3>${lesson.order}. ${tutorialRuntimeEscape(lesson.narratorFaction)}</h3>
      <strong>${tutorialRuntimeEscape(lesson.title)}</strong>
      <p>${tutorialRuntimeEscape(lesson.summary)}</p>
      <div class="tutorialLessonMeta"><span>${tutorialRuntimeEscape(status)}</span><span>Rapida</span><span>Tattica</span></div>${actions}
    </article>`;
  }).join("");

  if (grid.dataset.bound !== "1") {
    grid.dataset.bound = "1";
    grid.addEventListener("click", event => {
      const startButton = event.target && event.target.closest ? event.target.closest("[data-tutorial-start]") : null;
      if (startButton) {
        tutorialRuntimeStartScenario(startButton.dataset.tutorialStart, { resume:false });
        return;
      }
      const resumeButton = event.target && event.target.closest ? event.target.closest("[data-tutorial-resume]") : null;
      if (resumeButton && !resumeButton.disabled) tutorialRuntimeStartScenario(resumeButton.dataset.tutorialResume, { resume:true });
    });
  }

  const scenarioId = "lesson-1-exordium";
  const lesson = tutorialRuntimeScenarioById(scenarioId);
  const progress = tutorialRuntimeProgressForScenario(scenarioId);
  const startBtn = document.getElementById("tutorialRuntimeDemoBtn");
  const resumeBtn = document.getElementById("tutorialResumeBtn");
  const resetBtn = document.getElementById("tutorialResetProgressBtn");
  if (startBtn) {
    startBtn.textContent = progress && progress.completed ? "Ripeti Lezione 1" : "Avvia Lezione 1";
    if (startBtn.dataset.bound !== "1") {
      startBtn.dataset.bound = "1";
      startBtn.addEventListener("click", () => tutorialRuntimeStartScenario(lesson && lesson.id || scenarioId, { resume:false }));
    }
  }
  if (resumeBtn) {
    const canResume = Boolean(progress && !progress.completed && progress.snapshot && Number.isFinite(progress.nextStepIndex) && progress.nextStepIndex > 0);
    resumeBtn.disabled = !canResume;
    resumeBtn.textContent = progress && progress.completed ? "Lezione 1 completata" : "Riprendi Lezione 1";
    if (resumeBtn.dataset.bound !== "1") {
      resumeBtn.dataset.bound = "1";
      resumeBtn.addEventListener("click", () => tutorialRuntimeStartScenario(scenarioId, { resume:true }));
    }
  }
  if (resetBtn && resetBtn.dataset.bound !== "1") {
    resetBtn.dataset.bound = "1";
    resetBtn.addEventListener("click", tutorialRuntimeResetProgress);
  }
  const availableCount = plan.filter(item => item && item.scenarioId && tutorialRuntimeScenarioById(item.scenarioId)).length;
  const completedCount = plan.filter(item => store.lessons && store.lessons[item.id] && store.lessons[item.id].completed).length;
  tutorialRuntimeSetStatus(`${availableCount} lezioni disponibili · ${completedCount} completate. Seleziona Avvia o Riprendi nella lezione desiderata.`);
  return true;
}

function tutorialRuntimeEscape(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[char]));
}

function tutorialRuntimeAttrEscape(value) {
  return String(value == null ? "" : value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}


function tutorialRuntimeCancelTimer(timerId) {
  if (timerId == null) return;
  clearTimeout(timerId);
  tutorialRuntimeState.timers.delete(timerId);
}

function tutorialRuntimeClearTimers() {
  for (const timerId of tutorialRuntimeState.timers) clearTimeout(timerId);
  tutorialRuntimeState.timers.clear();
  tutorialRuntimeState.retryTimer = null;
  tutorialRuntimeState.hintTimer = null;
}

function tutorialRuntimeSchedule(callback, delay=0, options={}) {
  if (typeof callback !== "function") return null;
  const sessionToken = options.sessionToken == null ? tutorialRuntimeState.sessionToken : options.sessionToken;
  const stepToken = options.stepToken === false
    ? null
    : (options.stepToken == null ? tutorialRuntimeState.stepToken : options.stepToken);
  const timerId = setTimeout(() => {
    tutorialRuntimeState.timers.delete(timerId);
    if (tutorialRuntimeState.sessionToken !== sessionToken) return;
    if (stepToken != null && tutorialRuntimeState.stepToken !== stepToken) return;
    callback();
  }, Math.max(0, Number(delay) || 0));
  tutorialRuntimeState.timers.add(timerId);
  return timerId;
}

function tutorialRuntimeInvalidateAsync() {
  tutorialRuntimeState.sessionToken += 1;
  tutorialRuntimeState.stepToken += 1;
  tutorialRuntimeClearTimers();
  if (tutorialRuntimeState.updateFrame) cancelAnimationFrame(tutorialRuntimeState.updateFrame);
  tutorialRuntimeState.updateFrame = null;
}

function tutorialRuntimeHandStateFromDom() {
  if (typeof document === "undefined") return "unknown";
  const overlay = document.getElementById("mapHandOverlay");
  if (!overlay) return "unknown";
  const collapse = overlay.querySelector(".mapHandCollapseBtn");
  if (overlay.classList.contains("isTargeting") || overlay.classList.contains("isMovementHidden")) return "collapsed";
  if (tutorialRuntimeElementIsVisible(collapse)) return "open";
  if (typeof MAP_HAND_OVERLAY_STATE !== "undefined" && MAP_HAND_OVERLAY_STATE && MAP_HAND_OVERLAY_STATE.manuallyCollapsed) return "collapsed";
  return overlay.firstElementChild ? "open" : "collapsed";
}

function tutorialRuntimeDesiredHandState(step) {
  const explicit = step && step.uiState && step.uiState.hand;
  if (["open", "collapsed", "preserve"].includes(explicit)) return explicit;
  const target = step && step.spotlight && step.spotlight.target;
  if (!target) return "preserve";
  if (target.type === "card") return "open";
  if (["unit", "hex", "hq", "ps"].includes(target.type)) return "collapsed";
  const selector = String(target.selector || "");
  if (selector.includes("mapHandCollapseBtn")) return "open";
  if (selector.includes("mapLeftHandBtn") || selector.includes("mapHandShowBtn") || selector.includes("selectedUnitPrimaryAbilitySlot") || selector.includes("actionPanel")) return "collapsed";
  return "preserve";
}

function tutorialRuntimeNormalizeTransientUi(options={}) {
  if (typeof closeAnyGamePanelForMapReturn === "function") closeAnyGamePanelForMapReturn();
  if (typeof closeApkM4Panel === "function") closeApkM4Panel();
  if (typeof mapHandOverlayHideHoverPreview === "function") mapHandOverlayHideHoverPreview();
  if (typeof resetInteractionContext === "function") resetInteractionContext();
  else if (typeof clearSelection === "function") clearSelection();
  if (typeof MAP_HAND_OVERLAY_STATE !== "undefined" && MAP_HAND_OVERLAY_STATE) {
    MAP_HAND_OVERLAY_STATE.hiddenForTarget = false;
    MAP_HAND_OVERLAY_STATE.hiddenForMovement = false;
    MAP_HAND_OVERLAY_STATE.manuallyCollapsed = options.hand === "collapsed";
    MAP_HAND_OVERLAY_STATE.selectedCardUid = "";
    MAP_HAND_OVERLAY_STATE.selectedSource = "";
    MAP_HAND_OVERLAY_STATE.selectedSide = 0;
    MAP_HAND_OVERLAY_STATE.hoverCardUid = "";
    MAP_HAND_OVERLAY_STATE.hoverSource = "";
    MAP_HAND_OVERLAY_STATE.hoverSide = 0;
  }
  if (typeof renderAll === "function") renderAll();
  return true;
}

function tutorialRuntimeApplyStepUiState(step, options={}) {
  const desired = tutorialRuntimeDesiredHandState(step);
  if (desired === "preserve") return true;
  const current = tutorialRuntimeHandStateFromDom();
  if (!options.force && current === desired) return true;
  if (desired === "open" && typeof mapHandOverlayShowHand === "function") return mapHandOverlayShowHand();
  if (desired === "collapsed" && typeof mapHandOverlayCollapse === "function") return mapHandOverlayCollapse();
  return false;
}

function tutorialRuntimeAbortForMissingTarget(step) {
  const stepId = step && step.id || "sconosciuto";
  tutorialRuntimeState.lastAction = { kind:"target-missing", stepId, at:Date.now() };
  tutorialRuntimeAbort({ returnToTutorial:true, reason:"target-missing" });
  return false;
}

function tutorialRuntimeRegisterPortraits() {
  if (typeof narrativeRegisterPortraitSet !== "function" || typeof TUTORIAL_PORTRAIT_MANIFEST_F9O6 === "undefined") return;
  for (const item of Object.values(TUTORIAL_PORTRAIT_MANIFEST_F9O6)) {
    narrativeRegisterPortraitSet(item.id, item.frames || {});
  }
}

function tutorialRuntimeEnsureSpotlightDom() {
  if (typeof document === "undefined") return null;
  if (tutorialRuntimeState.spotlightDom && tutorialRuntimeState.spotlightDom.root && tutorialRuntimeState.spotlightDom.root.isConnected) return tutorialRuntimeState.spotlightDom;
  const host = document.getElementById("gameScreen") || document.body;
  if (!host) return null;
  let root = document.getElementById("tutorialSpotlightRoot");
  if (!root) {
    root = document.createElement("div");
    root.id = "tutorialSpotlightRoot";
    root.className = "tutorialSpotlightRoot";
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `<div class="tutorialSpotlightHole"></div><div class="tutorialSpotlightArrow" aria-hidden="true"></div><div class="tutorialSpotlightHint" role="status"></div>`;
    host.appendChild(root);
  }
  tutorialRuntimeState.spotlightDom = {
    root,
    hole:root.querySelector(".tutorialSpotlightHole"),
    arrow:root.querySelector(".tutorialSpotlightArrow"),
    hint:root.querySelector(".tutorialSpotlightHint")
  };
  return tutorialRuntimeState.spotlightDom;
}

function tutorialRuntimeAllCards(side) {
  if (!state || !side) return [];
  return [
    ...((state.hand && state.hand[side]) || []),
    ...Object.values((state.starterCards && state.starterCards[side]) || {}).filter(Boolean),
    ...((state.deck && state.deck[side]) || []),
    ...((state.discard && state.discard[side]) || [])
  ];
}

function tutorialRuntimeFindCard(spec) {
  const side = Number(spec.side) || (state && state.currentPlayer) || 1;
  const cardId = spec.cardId || spec.id || null;
  const sourceId = spec.sourceId || spec.blueprintId || null;
  return tutorialRuntimeAllCards(side).find(card => card && (
    (cardId && card.id === cardId) ||
    (sourceId && (card.sourceId === sourceId || card.blueprintId === sourceId || card.tacticId === sourceId))
  )) || null;
}

function tutorialRuntimeElementIsVisible(element) {
  if (!element || !element.isConnected || typeof element.getBoundingClientRect !== "function") return false;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const style = typeof getComputedStyle === "function" ? getComputedStyle(element) : null;
  return !style || (style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0);
}

function tutorialRuntimeBestVisibleTarget(nodes) {
  const list = Array.from(nodes || []).filter(Boolean);
  if (!list.length) return null;
  return list.find(node => node.closest && node.closest("#mapHandOverlay") && tutorialRuntimeElementIsVisible(node))
    || list.find(tutorialRuntimeElementIsVisible)
    || list[0];
}

function tutorialRuntimeResolveTarget(spec) {
  if (typeof document === "undefined" || !spec) return null;
  if (typeof spec === "string") return tutorialRuntimeBestVisibleTarget(document.querySelectorAll(spec));
  if (spec.type === "selector") return tutorialRuntimeBestVisibleTarget(document.querySelectorAll(spec.selector || ""));
  if (spec.type === "ui") {
    const byId = document.getElementById(spec.id || spec.target || "");
    if (tutorialRuntimeElementIsVisible(byId)) return byId;
    return tutorialRuntimeBestVisibleTarget(document.querySelectorAll(spec.selector || "")) || byId;
  }
  if (spec.type === "card") {
    const card = tutorialRuntimeFindCard(spec);
    if (!card || !card.cardUid) return null;
    return tutorialRuntimeBestVisibleTarget(document.querySelectorAll(`[data-preview-card-uid="${tutorialRuntimeAttrEscape(card.cardUid)}"]`));
  }
  if (spec.type === "unit") {
    let unit = null;
    if (state && Array.isArray(state.units)) {
      unit = spec.uid ? state.units.find(item => item && item.uid === spec.uid) : state.units.find(item => item && item.alive && item.type !== "QG" && (!spec.side || item.side === Number(spec.side)) && (!spec.blueprintId || item.id === spec.blueprintId));
    }
    return unit ? document.querySelector(`.unitToken[data-unit-uid="${tutorialRuntimeAttrEscape(unit.uid)}"]`) : null;
  }
  if (spec.type === "hex") {
    const coord = Array.isArray(spec.coord) ? spec.coord.join(",") : String(spec.coord || spec.id || "");
    return coord ? document.querySelector(`.hex[data-coord-key="${tutorialRuntimeAttrEscape(coord)}"]`) : null;
  }
  if (spec.type === "hq") {
    const side = Number(spec.side) || 1;
    const coord = typeof HQ_POS !== "undefined" && HQ_POS[side] ? HQ_POS[side].join(",") : "";
    return coord ? document.querySelector(`.hex[data-coord-key="${tutorialRuntimeAttrEscape(coord)}"]`) : null;
  }
  if (spec.type === "ps") {
    const cells = state && Array.isArray(state.cells) ? state.cells.filter(cell => cell && cell.ps) : [];
    const cell = spec.coord ? cells.find(item => item.coord && item.coord.join(",") === [].concat(spec.coord).join(",")) : cells[Number(spec.index) || 0];
    return cell ? document.querySelector(`.hex[data-coord-key="${tutorialRuntimeAttrEscape(cell.coord.join(","))}"]`) : null;
  }
  return null;
}

function tutorialRuntimeResolveTargets(spec) {
  if (typeof document === "undefined" || !spec) return [];
  if (spec.all === true && (spec.type === "selector" || typeof spec === "string")) {
    const selector = typeof spec === "string" ? spec : (spec.selector || "");
    return Array.from(document.querySelectorAll(selector)).filter(tutorialRuntimeElementIsVisible);
  }
  const target = tutorialRuntimeResolveTarget(spec);
  return target ? [target] : [];
}

function tutorialRuntimeResolveAllowedTargets(step) {
  const specs = Array.isArray(step && step.allowedTargets) && step.allowedTargets.length
    ? step.allowedTargets
    : step && step.spotlight && step.spotlight.target ? [step.spotlight.target] : [];
  return specs.flatMap(tutorialRuntimeResolveTargets).filter(Boolean);
}


function tutorialRuntimePortalPreviewElement(element) {
  if (typeof document === "undefined" || !document.body || !element || !element.parentNode) return false;
  if (tutorialRuntimeState.previewPortals.some(item => item && item.element === element)) return true;
  const originalParent = element.parentNode;
  const marker = document.createComment(`tutorial-preview-portal:${element.id || element.className || "preview"}`);
  originalParent.insertBefore(marker, element);
  document.body.appendChild(element);
  element.classList.add("tutorialPreviewPortal");
  tutorialRuntimeState.previewPortals.push({ element, marker, originalParent });
  return true;
}

function tutorialRuntimePortalCardPreviews() {
  if (typeof document === "undefined") return false;
  const previews = Array.from(document.querySelectorAll("#mapHandSelectionPreview,.mapHandHoverPreview"));
  let moved = false;
  for (const preview of previews) moved = tutorialRuntimePortalPreviewElement(preview) || moved;
  return moved;
}

function tutorialRuntimeRestoreCardPreviews() {
  const portals = Array.isArray(tutorialRuntimeState.previewPortals) ? [...tutorialRuntimeState.previewPortals] : [];
  tutorialRuntimeState.previewPortals = [];
  for (const item of portals) {
    const element = item && item.element;
    const marker = item && item.marker;
    if (!element) continue;
    element.classList.remove("tutorialPreviewPortal");
    if (marker && marker.parentNode) {
      marker.parentNode.insertBefore(element, marker);
      marker.remove();
    } else if (item.originalParent && item.originalParent.isConnected) {
      item.originalParent.appendChild(element);
    }
  }
  return portals.length > 0;
}

function tutorialRuntimeClearAttentionTargets() {
  if (typeof document !== "undefined") {
    document.querySelectorAll(".tutorialAttentionTarget,.tutorialAttentionContext").forEach(element => {
      element.classList.remove("tutorialAttentionTarget", "tutorialAttentionContext");
      element.removeAttribute("data-tutorial-attention");
    });
  }
  tutorialRuntimeState.attentionTargets = [];
}

function tutorialRuntimeMarkAttentionTarget(element, kind="action") {
  if (!element || !element.classList) return false;
  const className = kind === "context" ? "tutorialAttentionContext" : "tutorialAttentionTarget";
  element.classList.add(className);
  element.setAttribute("data-tutorial-attention", kind);
  tutorialRuntimeState.attentionTargets.push(element);
  return true;
}

function tutorialRuntimeApplyAttention(step) {
  tutorialRuntimePortalCardPreviews();
  tutorialRuntimeClearAttentionTargets();
  if (!step || typeof document === "undefined") return false;
  const informative = step.mode === TUTORIAL_STEP_MODES.INFORMATIVE;
  if (informative) {
    const next = document.querySelector("#narrativeOverlayRoot:not([hidden]) .narrativeNextBtn:not([hidden]):not(:disabled)");
    if (next) tutorialRuntimeMarkAttentionTarget(next, "action");
    const context = step.spotlight && step.spotlight.target ? tutorialRuntimeResolveTarget(step.spotlight.target) : null;
    if (context) tutorialRuntimeMarkAttentionTarget(context, "context");
  } else {
    const targets = tutorialRuntimeResolveAllowedTargets(step);
    for (const target of targets) tutorialRuntimeMarkAttentionTarget(target, "action");
  }
  return tutorialRuntimeState.attentionTargets.length > 0;
}

function tutorialRuntimeRect(element, padding=0) {
  if (!tutorialRuntimeElementIsVisible(element)) return null;
  const rect = element.getBoundingClientRect();
  const p = Math.max(0, Number(padding) || 0);
  const left = Math.max(0, rect.left - p);
  const top = Math.max(0, rect.top - p);
  const right = Math.min(window.innerWidth, rect.right + p);
  const bottom = Math.min(window.innerHeight, rect.bottom + p);
  return { left, top, right, bottom, width:Math.max(0, right-left), height:Math.max(0, bottom-top) };
}

function tutorialRuntimeRectIntersection(a, b) {
  if (!a || !b) return null;
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.right, b.right);
  const bottom = Math.min(a.bottom, b.bottom);
  if (right <= left || bottom <= top) return null;
  return { left, top, right, bottom, width:right-left, height:bottom-top };
}

function tutorialRuntimeRectOverlaps(a, b, tolerance=2) {
  const hit = tutorialRuntimeRectIntersection(a, b);
  return Boolean(hit && hit.width > tolerance && hit.height > tolerance);
}

function tutorialRuntimeBoardViewportRect() {
  const wrap = typeof cameraInteractionViewportRect === "function"
    ? cameraInteractionViewportRect({ refresh:true })
    : tutorialRuntimeRect(document.getElementById("boardWrap"));
  if (!wrap) return null;
  const left = Math.max(0, wrap.left);
  const top = Math.max(0, wrap.top);
  const right = Math.min(window.innerWidth, wrap.right);
  const bottom = Math.min(window.innerHeight, wrap.bottom);
  return { left, top, right, bottom, width:Math.max(0,right-left), height:Math.max(0,bottom-top) };
}

function tutorialRuntimeOccluderRects() {
  if (typeof document === "undefined") return [];
  const selectors = [
    "#narrativeOverlayRoot:not([hidden]) .narrativeDialog",
    "#mapHandOverlay:not([hidden]):not(.isCollapsed)",
    ".mapHandSelectionPreview.isVisible",
    ".apkM4Panel.isOpen",
    "#mobileGameBar"
  ];
  return selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)))
    .map(element => tutorialRuntimeRect(element, 10))
    .filter(Boolean);
}

function tutorialRuntimeLargestFreeRect(base, occluders) {
  if (!base) return null;
  const clipped = (occluders || []).map(rect => tutorialRuntimeRectIntersection(base, rect)).filter(Boolean);
  if (!clipped.length) return { ...base };
  const xs = new Set([base.left, base.right]);
  const ys = new Set([base.top, base.bottom]);
  for (const rect of clipped) {
    xs.add(Math.max(base.left, Math.min(base.right, rect.left)));
    xs.add(Math.max(base.left, Math.min(base.right, rect.right)));
    ys.add(Math.max(base.top, Math.min(base.bottom, rect.top)));
    ys.add(Math.max(base.top, Math.min(base.bottom, rect.bottom)));
  }
  const xValues = [...xs].sort((a,b)=>a-b);
  const yValues = [...ys].sort((a,b)=>a-b);
  let best = null;
  let bestScore = -Infinity;
  const baseCx = base.left + base.width/2;
  const baseCy = base.top + base.height/2;
  for (let xi=0; xi<xValues.length-1; xi++) {
    for (let xj=xi+1; xj<xValues.length; xj++) {
      for (let yi=0; yi<yValues.length-1; yi++) {
        for (let yj=yi+1; yj<yValues.length; yj++) {
          const rect = { left:xValues[xi], right:xValues[xj], top:yValues[yi], bottom:yValues[yj] };
          rect.width = rect.right-rect.left;
          rect.height = rect.bottom-rect.top;
          if (rect.width < 96 || rect.height < 84) continue;
          if (clipped.some(block => tutorialRuntimeRectOverlaps(rect, block))) continue;
          const area = rect.width*rect.height;
          const cx = rect.left+rect.width/2;
          const cy = rect.top+rect.height/2;
          const distance = Math.hypot(cx-baseCx, cy-baseCy);
          const score = area - distance*42;
          if (score > bestScore) { bestScore=score; best=rect; }
        }
      }
    }
  }
  return best || { ...base };
}

function tutorialRuntimeSafeViewport() {
  const board = tutorialRuntimeBoardViewportRect();
  if (!board) return null;
  const free = tutorialRuntimeLargestFreeRect(board, tutorialRuntimeOccluderRects());
  if (!free) return null;
  const padding = Math.min(36, Math.max(14, Math.min(free.width, free.height)*0.06));
  const rect = {
    left:free.left+padding,
    top:free.top+padding,
    right:free.right-padding,
    bottom:free.bottom-padding
  };
  rect.width = Math.max(1, rect.right-rect.left);
  rect.height = Math.max(1, rect.bottom-rect.top);
  return { rect, point:{ x:rect.left+rect.width/2, y:rect.top+rect.height/2 } };
}

function tutorialRuntimeStepNeedsAdaptiveFocus(step) {
  if (!step || !step.spotlight || !step.spotlight.target || step.focus === false) return false;
  if (step.focus === true) return true;
  const spec = step.spotlight.target;
  if (spec && ["hex","unit","hq","ps"].includes(spec.type)) return true;
  const target = tutorialRuntimeResolveTarget(spec);
  return Boolean(target && target.closest && target.closest("#boardVisualStack,#board"));
}

function tutorialRuntimeTargetRect(target, padding=8) {
  if (!target || typeof target.getBoundingClientRect !== "function") return null;
  const rect = target.getBoundingClientRect();
  if (!Number.isFinite(rect.left) || rect.width <= 0 || rect.height <= 0) return null;
  const p = Math.max(0, Number(padding) || 0);
  const left = Math.max(4, rect.left - p);
  const top = Math.max(4, rect.top - p);
  const right = Math.min(window.innerWidth - 4, rect.right + p);
  const bottom = Math.min(window.innerHeight - 4, rect.bottom + p);
  return { left, top, width:Math.max(8, right-left), height:Math.max(8, bottom-top), right, bottom };
}

function tutorialRuntimePositionSpotlight() {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step || !tutorialRuntimeState.step.spotlight) return false;
  const dom = tutorialRuntimeEnsureSpotlightDom();
  const target = tutorialRuntimeResolveTarget(tutorialRuntimeState.step.spotlight.target);
  if (!dom || !target) return false;
  tutorialRuntimeState.target = target;
  tutorialRuntimeState.allowedTargets = tutorialRuntimeResolveAllowedTargets(tutorialRuntimeState.step);
  if (!tutorialRuntimeState.attentionTargets.length || tutorialRuntimeState.attentionTargets.some(item => !item || !item.isConnected)) {
    tutorialRuntimeApplyAttention(tutorialRuntimeState.step);
  }
  const rect = tutorialRuntimeTargetRect(target, tutorialRuntimeState.step.spotlight.padding);
  if (!rect) return false;
  Object.assign(dom.hole.style, { left:`${rect.left}px`, top:`${rect.top}px`, width:`${rect.width}px`, height:`${rect.height}px` });
  const arrowLeft = Math.max(8, Math.min(window.innerWidth - 28, rect.left + rect.width / 2 - 10));
  const arrowTop = rect.top > 42 ? rect.top - 27 : rect.bottom + 8;
  Object.assign(dom.arrow.style, { left:`${arrowLeft}px`, top:`${arrowTop}px` });
  if (dom.hint && !dom.hint.classList.contains("isVisible")) {
    const hintLeft = Math.max(8, Math.min(window.innerWidth - 370, rect.left));
    const hintTop = Math.min(window.innerHeight - 52, rect.bottom + 14);
    Object.assign(dom.hint.style, { left:`${hintLeft}px`, top:`${hintTop}px` });
  }
  return true;
}

function tutorialRuntimeScheduleSpotlightUpdate() {
  if (!tutorialRuntimeState.active || tutorialRuntimeState.updateFrame) return;
  tutorialRuntimeState.updateFrame = requestAnimationFrame(() => {
    tutorialRuntimeState.updateFrame = null;
    tutorialRuntimePositionSpotlight();
    if (tutorialRuntimeState.active) tutorialRuntimeScheduleSpotlightUpdate();
  });
}

function tutorialRuntimeShowSpotlight(step) {
  const dom = tutorialRuntimeEnsureSpotlightDom();
  if (!dom) return false;
  if (!step || !step.spotlight) {
    dom.root.hidden = true;
    tutorialRuntimeState.target = null;
    tutorialRuntimeState.allowedTargets = [];
    return true;
  }
  dom.root.hidden = false;
  dom.root.dataset.mode = step.mode || TUTORIAL_STEP_MODES.INFORMATIVE;
  dom.root.dataset.stepId = step.id || "";
  tutorialRuntimePositionSpotlight();
  tutorialRuntimeScheduleSpotlightUpdate();
  return true;
}

function tutorialRuntimeHideSpotlight() {
  tutorialRuntimeCancelTimer(tutorialRuntimeState.retryTimer);
  tutorialRuntimeCancelTimer(tutorialRuntimeState.hintTimer);
  tutorialRuntimeCancelTimer(tutorialRuntimeState.focusTimer);
  tutorialRuntimeState.retryTimer = null;
  tutorialRuntimeState.hintTimer = null;
  tutorialRuntimeState.focusTimer = null;
  tutorialRuntimeClearAttentionTargets();
  if (tutorialRuntimeState.updateFrame) cancelAnimationFrame(tutorialRuntimeState.updateFrame);
  tutorialRuntimeState.updateFrame = null;
  const dom = tutorialRuntimeEnsureSpotlightDom();
  if (dom && dom.root) dom.root.hidden = true;
  if (dom && dom.hint) dom.hint.classList.remove("isVisible");
  tutorialRuntimeState.target = null;
  tutorialRuntimeState.allowedTargets = [];
}

function tutorialRuntimeShowHint(text) {
  const dom = tutorialRuntimeEnsureSpotlightDom();
  if (!dom || !dom.hint) return;
  dom.hint.textContent = String(text || "Azione non disponibile in questo passo.");
  dom.hint.classList.add("isVisible");
  tutorialRuntimeCancelTimer(tutorialRuntimeState.hintTimer);
  tutorialRuntimeState.hintTimer = tutorialRuntimeSchedule(() => dom.hint.classList.remove("isVisible"), 1500);
}

function tutorialRuntimeFocusTarget(spec, options={}) {
  if (!spec) return false;
  try {
    const safe = options.adaptive === false ? null : tutorialRuntimeSafeViewport();
    const cameraOptions = { animate:true, zoom:Number(options.zoom) || 1.28 };
    if (safe && safe.point) cameraOptions.viewportPoint = safe.point;
    if (spec.type === "hex" && typeof cameraFocusHex === "function") return cameraFocusHex(spec.coord || spec.id, cameraOptions);
    if (spec.type === "hq" && typeof cameraFocusHQ === "function") return cameraFocusHQ(spec.side, { ...cameraOptions, zoom:Number(options.zoom) || 1.25 });
    if (spec.type === "unit" && typeof state !== "undefined" && state && Array.isArray(state.units) && typeof cameraFocusUnit === "function") {
      const unit = spec.uid ? state.units.find(item => item && item.uid === spec.uid) : state.units.find(item => item && item.alive && item.type !== "QG" && (!spec.side || item.side === Number(spec.side)) && (!spec.blueprintId || item.id === spec.blueprintId));
      return unit ? cameraFocusUnit(unit, { ...cameraOptions, zoom:Number(options.zoom) || 1.32 }) : false;
    }
    const target = tutorialRuntimeResolveTarget(spec);
    const boardHex = target && target.closest ? target.closest(".hex[data-coord-key]") : null;
    if (boardHex && typeof cameraFocusHex === "function") {
      return cameraFocusHex(boardHex.dataset.coordKey, cameraOptions);
    }
    if (target && typeof target.scrollIntoView === "function" && !target.closest("#boardVisualStack,#board")) {
      target.scrollIntoView({ behavior:"smooth", block:"center", inline:"center" });
      return true;
    }
  } catch (_) { /* focus best effort */ }
  return false;
}

function tutorialRuntimeNarrativePositionForStep(step) {
  if (!step || !step.message) return "bottom";
  if (step.message.position === "top" || step.message.position === "bottom") return step.message.position;
  if (step.id && /hand|card/.test(step.id)) return "top";
  const target = step.spotlight && step.spotlight.target ? tutorialRuntimeResolveTarget(step.spotlight.target) : null;
  const rect = target && typeof target.getBoundingClientRect === "function" ? target.getBoundingClientRect() : null;
  if (rect && rect.height > 0) return rect.top + rect.height / 2 >= window.innerHeight / 2 ? "top" : "bottom";
  return "bottom";
}

function tutorialRuntimeNarrativeForStep(step) {
  if (!step || !step.message || typeof narrativeOpen !== "function") return false;
  const informative = step.mode === TUTORIAL_STEP_MODES.INFORMATIVE;
  return narrativeOpen([step.message], {
    nonModal:true,
    position:tutorialRuntimeNarrativePositionForStep(step),
    showPrev:false,
    showRepeat:true,
    showClose:true,
    showNext:informative,
    closeLabel:"Esci",
    nextLabel:informative ? "Avanti" : "Continua",
    stepLabel:`Passo ${tutorialRuntimeState.stepIndex + 1}/${tutorialRuntimeState.scenario.steps.length}`,
    onRender:() => {
      tutorialRuntimeSchedule(() => {
        if (!tutorialRuntimeState.active || tutorialRuntimeState.step !== step) return;
        tutorialRuntimeApplyAttention(step);
        if (tutorialRuntimeStepNeedsAdaptiveFocus(step)) tutorialRuntimeFocusTarget(step.spotlight.target, { adaptive:true });
        tutorialRuntimePositionSpotlight();
      }, 30);
    },
    onClose:(_index, reason) => {
      if (tutorialRuntimeState.closing) return;
      if (reason === "complete" && informative) tutorialRuntimeCompleteStep("next");
      else if (reason === "manual") tutorialRuntimeAbort({ returnToTutorial:true, reason:"manual" });
    }
  });
}

function tutorialRuntimeMatchEvent(event, condition) {
  if (!event || !condition || condition.kind !== "event" || event.type !== condition.event) return false;
  const data = event.data || {};
  const expected = condition.match || {};
  for (const [key, value] of Object.entries(expected)) {
    if (data[key] !== value) return false;
  }
  return true;
}

function tutorialRuntimeHandleGameEvent(event) {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step) return false;
  const condition = tutorialRuntimeState.step.completeOn;
  if (!tutorialRuntimeMatchEvent(event, condition)) return false;
  tutorialRuntimeSchedule(() => tutorialRuntimeCompleteStep(`event:${event.type}`), 0);
  return true;
}

function tutorialRuntimeElementAllowed(target) {
  if (!target || typeof target.closest !== "function") return false;
  if (target.closest(".narrativeDialog")) return true;
  return tutorialRuntimeState.allowedTargets.some(item => item === target || item.contains(target));
}

function tutorialRuntimeCaptureInteraction(event) {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step || tutorialRuntimeState.closing) return;
  if (!event.target || event.type !== "click") return;
  const step = tutorialRuntimeState.step;
  const inNarrative = Boolean(event.target.closest && event.target.closest(".narrativeDialog"));
  const allowed = tutorialRuntimeElementAllowed(event.target);
  const mustBlock = (step.mode === TUTORIAL_STEP_MODES.INFORMATIVE && !inNarrative)
    || ((step.mode === TUTORIAL_STEP_MODES.LOCKED || step.mode === TUTORIAL_STEP_MODES.GUIDED) && !allowed);
  if (mustBlock) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    tutorialRuntimeShowHint(step.wrongActionText || (step.mode === TUTORIAL_STEP_MODES.INFORMATIVE ? "Continua dal riquadro della lezione." : "Segui l'elemento evidenziato."));
    return;
  }
  if (allowed && step.completeOn && step.completeOn.kind === "click") {
    tutorialRuntimeState.lastAction = { kind:"click", stepId:step.id, at:Date.now() };
    tutorialRuntimeSchedule(() => tutorialRuntimeCompleteStep("click"), 0);
  }
}

function tutorialRuntimeActionMatch(condition, action, data={}) {
  if (!condition || condition.kind !== "action" || condition.action !== action) return { handled:false, matched:false };
  const expected = condition.match || {};
  for (const [key, value] of Object.entries(expected)) if (data[key] !== value) return { handled:true, matched:false, key, expected:value, actual:data[key] };
  return { handled:true, matched:true };
}

function tutorialRuntimeComparable(value) {
  if (Array.isArray(value)) return value.map(item => String(item)).join(",");
  if (value == null) return "";
  return String(value);
}

function tutorialRuntimeInteractionFieldMatches(expected, actual) {
  return tutorialRuntimeComparable(expected) === tutorialRuntimeComparable(actual);
}

function tutorialRuntimeExpectedInteraction(step=tutorialRuntimeState.step) {
  if (!step) return null;
  const completion = step.completeOn || null;
  if (completion && completion.kind === "action" && completion.action) {
    return { action:String(completion.action), match:{ ...(completion.match || {}) }, source:"completeOn" };
  }

  const target = step.spotlight && step.spotlight.target ? step.spotlight.target : null;
  if (!target) return null;
  if (target.type === "card") {
    const match = {};
    if (target.side != null) match.side = Number(target.side);
    if (target.cardId) match.cardId = String(target.cardId);
    return { action:"card_selected", match, source:"spotlight" };
  }
  if (target.type === "hex") {
    return { action:"cell_click", match:{ coord:Array.isArray(target.coord) ? [...target.coord] : target.coord }, source:"spotlight" };
  }
  if (target.type === "unit") {
    const match = {};
    if (target.side != null) match.side = Number(target.side);
    if (target.uid) match.uid = String(target.uid);
    if (target.blueprintId) match.blueprintId = String(target.blueprintId);
    return { action:"unit_click", match, source:"spotlight" };
  }
  if (target.type === "selector") {
    const selector = String(target.selector || "");
    if (selector.includes("mapHandCollapseBtn")) return { action:"hand_collapse", match:{}, source:"spotlight" };
    if (selector.includes("mapLeftHandBtn") || selector.includes("mapHandShowBtn")) return { action:"hand_show", match:{}, source:"spotlight" };
    if (/endturnbtn/i.test(selector)) {
      const match = {};
      if (completion && completion.match && completion.match.player != null) match.player = Number(completion.match.player);
      return { action:"end_turn", match, source:"spotlight" };
    }
    if (selector.includes('data-unit-action="ability"') || selector.includes("data-unit-action='ability'")) {
      return { action:"ability_toggle", match:{}, source:"spotlight" };
    }
  }
  return null;
}

function tutorialRuntimeInteractionMatch(expected, action, data={}) {
  if (!expected || expected.action !== action) return { matched:false, reason:"action", expected:expected && expected.action || null, actual:action };
  for (const [key, value] of Object.entries(expected.match || {})) {
    if (!tutorialRuntimeInteractionFieldMatches(value, data[key])) return { matched:false, reason:key, expected:value, actual:data[key] };
  }
  return { matched:true };
}

function tutorialRuntimeGateInteraction(action, data={}) {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step) return { handled:false, allowed:true };
  if (data && data.tutorialBypass === true) return { handled:true, allowed:true, bypass:true };
  const step = tutorialRuntimeState.step;
  const expected = tutorialRuntimeExpectedInteraction(step);
  const blockedByPhase = tutorialRuntimeState.preparingStep || tutorialRuntimeState.closing;
  const result = blockedByPhase ? { matched:false, reason:"step_transition" } : tutorialRuntimeInteractionMatch(expected, action, data);
  const allowed = Boolean(!blockedByPhase && step.mode !== TUTORIAL_STEP_MODES.INFORMATIVE && expected && result.matched);
  if (!allowed) {
    if (!data || data.quiet !== true) tutorialRuntimeShowHint(step.wrongActionText || (step.mode === TUTORIAL_STEP_MODES.INFORMATIVE ? "Continua dal riquadro della lezione." : "Segui l’azione evidenziata."));
    tutorialRuntimeState.lastAction = {
      kind:"interaction-rejected", action, data, stepId:step.id,
      expected:expected ? { action:expected.action, match:{ ...(expected.match || {}) } } : null,
      reason:result.reason || (step.mode === TUTORIAL_STEP_MODES.INFORMATIVE ? "informative_step" : "no_expected_interaction"),
      at:Date.now()
    };
    return { handled:true, allowed:false, expected, reason:result.reason || "blocked" };
  }
  tutorialRuntimeState.lastAction = { kind:"interaction-allowed", action, data, stepId:step.id, at:Date.now() };
  return { handled:true, allowed:true, expected };
}

function tutorialRuntimeGateAction(action, data={}) {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step) return { handled:false, allowed:true };
  const result = tutorialRuntimeActionMatch(tutorialRuntimeState.step.completeOn, action, data);
  if (!result.handled) return { handled:false, allowed:true };
  if (!result.matched) {
    tutorialRuntimeShowHint(tutorialRuntimeState.step.wrongActionText || "Questa non è la scelta richiesta dal passo.");
    tutorialRuntimeState.lastAction = { kind:"action-rejected", action, data, stepId:tutorialRuntimeState.step.id, at:Date.now() };
    return { handled:true, allowed:false };
  }
  return { handled:true, allowed:true };
}

function tutorialRuntimeNotifyAction(action, data={}) {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step) return false;
  const result = tutorialRuntimeActionMatch(tutorialRuntimeState.step.completeOn, action, data);
  if (!result.handled || !result.matched) return false;
  tutorialRuntimeState.lastAction = { kind:"action", action, data, at:Date.now() };
  tutorialRuntimeSchedule(() => tutorialRuntimeCompleteStep(`action:${action}`), 0);
  return true;
}

function tutorialRuntimeShouldPauseBot() {
  return Boolean(tutorialRuntimeState.active && tutorialRuntimeState.botPaused);
}

function tutorialRuntimeSetBotPaused(paused=true) {
  tutorialRuntimeState.botPaused = Boolean(paused);
  if (state) {
    state.tutorialBotPaused = tutorialRuntimeState.botPaused;
    state.tutorialMode = true;
  }
  if (!tutorialRuntimeState.botPaused && typeof maybeRunBot === "function") maybeRunBot();
  return tutorialRuntimeState.botPaused;
}

function tutorialRuntimeCardInstance(cardId, side, index=0, zone="hand") {
  if (typeof cardById !== "function" || typeof createCardInstance !== "function") return null;
  const card = cardById(cardId, state && state.cardCatalog ? state.cardCatalog : null);
  return card ? createCardInstance(card, side, zone, index) : null;
}

function tutorialRuntimeFindUnit(spec={}) {
  if (!state || !Array.isArray(state.units)) return null;
  const side = Number(spec.side || spec.targetSide || 0) || null;
  const uid = spec.uid || spec.unitId || spec.targetUid || null;
  const blueprintId = spec.blueprintId || spec.attackerBlueprintId || spec.targetBlueprintId || null;
  return state.units.find(unit => unit && unit.alive && unit.type !== "QG"
    && (!uid || unit.uid === uid)
    && (!side || unit.side === side)
    && (!blueprintId || unit.id === blueprintId)) || null;
}

function tutorialRuntimeSpawnUnit(item) {
  if (!state || typeof BLUEPRINTS === "undefined" || typeof createUnitFromBlueprint !== "function") return false;
  const bp = BLUEPRINTS.find(entry => entry && entry.id === item.blueprintId);
  const coord = Array.isArray(item.coord) ? [...item.coord] : null;
  if (!bp || !coord || (typeof isInsideMap === "function" && !isInsideMap(coord))) return false;
  if (typeof getUnitAt === "function" && getUnitAt(coord)) return false;
  const unit = createUnitFromBlueprint(bp, Number(item.side) || 2);
  unit.pos = coord;
  unit.acted = item.acted !== false;
  if (Number.isFinite(Number(item.currentHp))) unit.currentHp = Math.max(0, Math.min(unit.maxHp, Number(item.currentHp)));
  if (Number.isFinite(Number(item.currentDef))) unit.currentDef = Math.max(0, Number(item.currentDef));
  if (Number.isFinite(Number(item.currentAtt))) unit.currentAtt = Math.max(0, Number(item.currentAtt));
  unit.spawnSource = "tutorial_scenario";
  state.units.push(unit);
  if (typeof updateControlFromOccupants === "function") updateControlFromOccupants();
  if (typeof emitGameEvent === "function" && typeof EventTypes !== "undefined") emitGameEvent({
    type:EventTypes.UNIT_SPAWNED,
    data:{ player:unit.side, faction:unit.faction, unitId:unit.uid, unitName:unit.name, blueprintId:unit.id, cost:0, coord:[...coord], exhausted:unit.acted, spawnSource:"tutorial_scenario" }
  });
  if (typeof renderAll === "function") renderAll();
  return unit;
}

function tutorialRuntimeGrantCard(item) {
  if (!state) return false;
  const side = Number(item.side) || 1;
  const zone = item.zone || "hand";
  if (!state[zone] || !Array.isArray(state[zone][side])) return false;
  const card = tutorialRuntimeCardInstance(item.cardId, side, state[zone][side].length, zone);
  if (!card) return false;
  state[zone][side].push(card);
  if (typeof syncCardDebugState === "function") syncCardDebugState();
  if (typeof emitGameEvent === "function" && typeof EventTypes !== "undefined" && zone === "hand") emitGameEvent({
    type:EventTypes.CARD_DRAWN,
    data:{ player:side, faction:state.factions && state.factions[side], cardId:card.id, cardUid:card.cardUid, cardName:card.name, source:"tutorial_scenario" }
  });
  if (typeof renderAll === "function") renderAll();
  return card;
}

function tutorialRuntimeApplyScenarioSetup(scenario) {
  if (!scenario || !scenario.setup || typeof newGame !== "function") return false;
  const setup = scenario.setup;
  const initiative = typeof document !== "undefined" ? document.getElementById("initiativeMode") : null;
  if (initiative) initiative.value = String(setup.firstPlayer || 1);
  if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.GAME);
  newGame({
    factions:{ ...(setup.factions || {1:"Exordium",2:"Nexus"}) },
    selectedCommanders:{ ...(setup.selectedCommanders || {}) },
    selectedDecks:{ ...(setup.selectedDecks || {1:{mode:"template"},2:{mode:"template"}}) },
    modes:{ ...(setup.modes || {1:"human",2:"human"}) },
    autoResignEnabled:setup.autoResignEnabled === true,
    aiMode:setup.aiMode || "advanced",
    pacePreset:setup.pacePreset || "competitive",
    gameScaleMode:setup.gameScaleMode || "tactical",
    tutorialMode:true,
    tutorialScenarioId:scenario.id,
    tutorialLessonId:scenario.lessonId || null,
    tutorialTitle:scenario.title || "Lezione guidata"
  });
  if (!state) return false;
  state.tutorialMode = true;
  state.tutorialScenarioId = scenario.id;
  state.tutorialLessonId = scenario.lessonId || null;
  state.tutorialBotPaused = true;
  state.autoResignEnabled = false;
  state.matchRecorded = false;
  state.energy = { ...state.energy, ...(setup.energy || {}) };
  for (const side of [1,2]) {
    if (setup.starterCardsEnabled === false && state.starterCards) state.starterCards[side] = {};
    if (setup.hand && Array.isArray(setup.hand[side])) {
      state.hand[side] = setup.hand[side].map((cardId,index) => tutorialRuntimeCardInstance(cardId, side, index, "hand")).filter(Boolean);
    }
    if (setup.deck && Array.isArray(setup.deck[side])) {
      state.deck[side] = setup.deck[side].map((cardId,index) => tutorialRuntimeCardInstance(cardId, side, index, "deck")).filter(Boolean);
    }
    if (setup.discard && Array.isArray(setup.discard[side])) {
      state.discard[side] = setup.discard[side].map((cardId,index) => tutorialRuntimeCardInstance(cardId, side, index, "discard")).filter(Boolean);
    }
  }
  if (typeof syncCardDebugState === "function") syncCardDebugState();
  if (typeof resetInteractionContext === "function") resetInteractionContext();
  if (typeof renderAll === "function") renderAll();
  tutorialRuntimeSetBotPaused(true);
  return true;
}

function tutorialRuntimeStepAt(index) {
  const steps = tutorialRuntimeState.scenario && Array.isArray(tutorialRuntimeState.scenario.steps) ? tutorialRuntimeState.scenario.steps : [];
  return steps[index] || null;
}

function tutorialRuntimeExecuteCommand(command) {
  const item = typeof command === "string" ? { action:command } : (command || {});
  switch (item.action) {
    case "collapse_hand":
      return typeof mapHandOverlayCollapse === "function" ? mapHandOverlayCollapse() : false;
    case "show_hand":
      return typeof mapHandOverlayShowHand === "function" ? mapHandOverlayShowHand() : false;
    case "pause_bot":
      return tutorialRuntimeSetBotPaused(true);
    case "resume_bot":
      return tutorialRuntimeSetBotPaused(false);
    case "set_energy": {
      const side = Number(item.side) || 1;
      if (!state || !state.energy || !Number.isFinite(Number(item.value))) return false;
      state.energy[side] = Number(item.value);
      if (typeof renderAll === "function") renderAll();
      return true;
    }
    case "relocate_unit": {
      const unit = tutorialRuntimeFindUnit(item);
      const coord = Array.isArray(item.coord) ? [...item.coord] : null;
      if (!unit || !coord || (typeof isInsideMap === "function" && !isInsideMap(coord))) return false;
      const occupant = typeof getUnitAt === "function" ? getUnitAt(coord) : null;
      if (occupant && occupant.uid !== unit.uid) return false;
      unit.pos = coord;
      if (typeof item.acted === "boolean") unit.acted = item.acted;
      if (typeof updateControlFromOccupants === "function") updateControlFromOccupants();
      if (typeof resetInteractionContext === "function") resetInteractionContext();
      if (typeof renderAll === "function") renderAll();
      return unit;
    }
    case "spawn_unit":
      return tutorialRuntimeSpawnUnit(item);
    case "grant_card":
      return tutorialRuntimeGrantCard(item);
    case "pass_turn": {
      if (!state || typeof endTurn !== "function") return false;
      if (item.side && Number(item.side) !== Number(state.currentPlayer)) return false;
      endTurn({ source:"tutorial_script", tutorialBypass:true });
      return true;
    }
    case "script_attack_and_end_turn": {
      if (!state || typeof attackUnit !== "function" || typeof endTurn !== "function") return false;
      if (item.side && Number(item.side) !== Number(state.currentPlayer)) return false;
      const attacker = tutorialRuntimeFindUnit({ side:item.side, blueprintId:item.attackerBlueprintId, uid:item.attackerUid });
      const target = tutorialRuntimeFindUnit({ side:item.targetSide, blueprintId:item.targetBlueprintId, uid:item.targetUid });
      if (!attacker || !target) return false;
      attacker.acted = false;
      attacker.attacksMade = 0;
      attackUnit(attacker, target);
      if (attacker.alive && typeof endUnitAction === "function") endUnitAction(attacker);
      if (!state.winner) endTurn({ source:"tutorial_script", tutorialBypass:true });
      return true;
    }
    default:
      return false;
  }
}

function tutorialRuntimeRunCommands(commands) {
  const list = Array.isArray(commands) ? commands : (commands ? [commands] : []);
  return list.map(tutorialRuntimeExecuteCommand);
}

function tutorialRuntimeEnterStep(index) {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.scenario) return false;
  const step = tutorialRuntimeStepAt(index);
  if (!step) return tutorialRuntimeFinish();
  tutorialRuntimeCancelTimer(tutorialRuntimeState.retryTimer);
  tutorialRuntimeState.retryTimer = null;
  tutorialRuntimeState.stepToken += 1;
  const sessionToken = tutorialRuntimeState.sessionToken;
  const stepToken = tutorialRuntimeState.stepToken;
  tutorialRuntimeState.stepIndex = index;
  tutorialRuntimeState.step = step;
  tutorialRuntimeState.preparingStep = true;
  tutorialRuntimeState.targetRecoveryCount = 0;
  tutorialRuntimeState.closing = true;
  if (typeof narrativeClose === "function") narrativeClose("tutorial-step-change");
  tutorialRuntimeState.closing = false;
  tutorialRuntimeHideSpotlight();
  tutorialRuntimeRunCommands(step.onEnter);
  tutorialRuntimeApplyStepUiState(step, { force:true });

  let attempts = 0;
  const renderStep = () => {
    if (!tutorialRuntimeState.active || tutorialRuntimeState.sessionToken !== sessionToken || tutorialRuntimeState.stepToken !== stepToken || tutorialRuntimeState.step !== step) return;
    attempts += 1;
    const targetRequired = Boolean(step.spotlight && step.spotlight.target);
    const target = targetRequired ? tutorialRuntimeResolveTarget(step.spotlight.target) : null;
    if (targetRequired && !target) {
      if (attempts === 6 || attempts === 15) {
        tutorialRuntimeState.targetRecoveryCount += 1;
        tutorialRuntimeApplyStepUiState(step, { force:true });
      }
      if (attempts < 30) {
        tutorialRuntimeState.retryTimer = tutorialRuntimeSchedule(renderStep, 80, { sessionToken, stepToken });
        return;
      }
      tutorialRuntimeState.preparingStep = false;
      return tutorialRuntimeAbortForMissingTarget(step);
    }
    tutorialRuntimeState.preparingStep = false;
    tutorialRuntimeNarrativeForStep(step);
    tutorialRuntimeShowSpotlight(step);
    tutorialRuntimeSetStatus(`${tutorialRuntimeState.scenario.title} · passo ${index + 1}/${tutorialRuntimeState.scenario.steps.length}`);
  };
  tutorialRuntimeState.retryTimer = tutorialRuntimeSchedule(renderStep, step.focus ? 220 : 20, { sessionToken, stepToken });
  return true;
}

function tutorialRuntimeCompleteStep(source="runtime") {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step || tutorialRuntimeState.closing) return false;
  const current = tutorialRuntimeState.step;
  tutorialRuntimeState.closing = true;
  if (current.checkpoint) tutorialRuntimeSaveProgress({ nextStepIndex:tutorialRuntimeState.stepIndex + 1, includeSnapshot:true });
  tutorialRuntimeHideSpotlight();
  if (typeof narrativeClose === "function") narrativeClose("tutorial-step-complete");
  const nextIndex = tutorialRuntimeState.stepIndex + 1;
  tutorialRuntimeState.closing = false;
  tutorialRuntimeState.lastAction = { kind:"complete", source, stepId:current.id, at:Date.now() };
  if (nextIndex >= tutorialRuntimeState.scenario.steps.length) return tutorialRuntimeFinish();
  return tutorialRuntimeEnterStep(nextIndex);
}

function tutorialRuntimeStartScenario(id, options={}) {
  const scenario = tutorialRuntimeScenarioById(id);
  if (!scenario) {
    tutorialRuntimeSetStatus(`Scenario tutorial non trovato: ${id}`);
    return false;
  }
  tutorialRuntimeAbort({ silent:true, keepScreen:true, reason:"restart" });
  tutorialRuntimeState.sessionToken += 1;
  tutorialRuntimeState.stepToken = 0;
  tutorialRuntimeState.active = true;
  tutorialRuntimeState.scenario = scenario;
  tutorialRuntimeState.scenarioId = scenario.id;
  tutorialRuntimeState.stepIndex = 0;
  tutorialRuntimeState.step = null;
  tutorialRuntimeState.botPaused = true;
  tutorialRuntimeState.preparingStep = false;
  if (typeof document !== "undefined" && document.body) document.body.classList.add("tutorial-runtime-active");
  tutorialRuntimePortalCardPreviews();
  if (!tutorialRuntimeApplyScenarioSetup(scenario)) {
    tutorialRuntimeAbort({ returnToTutorial:true, reason:"setup-failed" });
    return false;
  }
  const progress = options.resume ? tutorialRuntimeProgressForScenario(scenario.id) : null;
  const startIndex = progress && !progress.completed && Number.isFinite(progress.nextStepIndex)
    ? Math.max(0, Math.min(progress.nextStepIndex, scenario.steps.length - 1))
    : 0;
  if (progress && progress.snapshot) tutorialRuntimeRestoreGameSnapshot(progress.snapshot);
  tutorialRuntimeNormalizeTransientUi({ hand:"open" });
  tutorialRuntimeSaveProgress({ nextStepIndex:startIndex, completed:false });
  tutorialRuntimeEnterStep(startIndex);
  return true;
}

function tutorialRuntimeFinish() {
  if (!tutorialRuntimeState.scenarioId) return false;
  tutorialRuntimeSaveProgress({ nextStepIndex:tutorialRuntimeState.scenario.steps.length, completed:true });
  tutorialRuntimeState.closing = true;
  tutorialRuntimeHideSpotlight();
  if (typeof narrativeClose === "function") narrativeClose("tutorial-finished");
  tutorialRuntimeState.closing = false;
  tutorialRuntimeState.active = false;
  tutorialRuntimeState.botPaused = false;
  if (state) state.tutorialBotPaused = false;
  if (typeof document !== "undefined" && document.body) document.body.classList.remove("tutorial-runtime-active");
  tutorialRuntimeRestoreCardPreviews();
  const lessonPlanItem = typeof TUTORIAL_LESSON_PLAN_F9O6 !== "undefined" ? TUTORIAL_LESSON_PLAN_F9O6.find(item => item && item.id === (tutorialRuntimeState.scenario && tutorialRuntimeState.scenario.lessonId)) : null;
  const completionMessage = lessonPlanItem && lessonPlanItem.title ? lessonPlanItem.title : (tutorialRuntimeState.scenario && tutorialRuntimeState.scenario.title || "Lezione guidata");
  if (typeof eventOverlayEnqueue === "function") eventOverlayEnqueue({ title:"LEZIONE COMPLETATA", message:completionMessage, icon:"✓", priority:"high", durationMs:1100, key:`tutorial-complete:${Date.now()}` });
  tutorialRuntimeSchedule(() => {
    if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.TUTORIAL);
    tutorialRuntimeRenderMenu();
  }, 1150, { stepToken:false });
  return true;
}

function tutorialRuntimeAbort(options={}) {
  const wasActive = tutorialRuntimeState.active;
  tutorialRuntimeState.closing = true;
  tutorialRuntimeInvalidateAsync();
  tutorialRuntimeHideSpotlight();
  if (typeof narrativeClose === "function") narrativeClose("tutorial-abort");
  tutorialRuntimeState.active = false;
  tutorialRuntimeState.botPaused = false;
  tutorialRuntimeState.preparingStep = false;
  tutorialRuntimeState.step = null;
  tutorialRuntimeState.target = null;
  tutorialRuntimeState.allowedTargets = [];
  tutorialRuntimeState.closing = false;
  if (state) state.tutorialBotPaused = false;
  if (typeof document !== "undefined" && document.body) document.body.classList.remove("tutorial-runtime-active");
  tutorialRuntimeRestoreCardPreviews();
  if (!options.silent && options.returnToTutorial !== false && !options.keepScreen) {
    if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.TUTORIAL);
    tutorialRuntimeRenderMenu();
    const message = options.reason === "manual"
      ? "Tutorial interrotto. Il checkpoint resta disponibile."
      : options.reason === "target-missing"
        ? "Il passaggio non era disponibile. L’interfaccia è stata liberata: riprendi dal checkpoint oppure riavvia la lezione."
        : "Tutorial chiuso.";
    tutorialRuntimeSetStatus(message);
  }
  return wasActive;
}

function tutorialRuntimeDiagnostics() {
  return {
    active:tutorialRuntimeState.active,
    scenarioId:tutorialRuntimeState.scenarioId,
    stepIndex:tutorialRuntimeState.stepIndex,
    stepId:tutorialRuntimeState.step && tutorialRuntimeState.step.id || null,
    stepMode:tutorialRuntimeState.step && tutorialRuntimeState.step.mode || null,
    desiredHandState:tutorialRuntimeDesiredHandState(tutorialRuntimeState.step),
    actualHandState:tutorialRuntimeHandStateFromDom(),
    preparingStep:tutorialRuntimeState.preparingStep,
    sessionToken:tutorialRuntimeState.sessionToken,
    stepToken:tutorialRuntimeState.stepToken,
    targetRecoveryCount:tutorialRuntimeState.targetRecoveryCount,
    targetResolved:Boolean(tutorialRuntimeState.target && tutorialRuntimeState.target.isConnected),
    allowedTargets:tutorialRuntimeState.allowedTargets.length,
    previewPortals:tutorialRuntimeState.previewPortals.length,
    botPaused:tutorialRuntimeState.botPaused,
    progress:tutorialRuntimeState.scenarioId ? tutorialRuntimeProgressForScenario(tutorialRuntimeState.scenarioId) : null,
    expectedInteraction:tutorialRuntimeExpectedInteraction(tutorialRuntimeState.step),
    lastAction:tutorialRuntimeState.lastAction
  };
}

function tutorialRuntimeInit() {
  tutorialRuntimeRegisterPortraits();
  tutorialRuntimeEnsureSpotlightDom();
  if (typeof document !== "undefined") {
    document.addEventListener("click", tutorialRuntimeCaptureInteraction, true);
    window.addEventListener("resize", tutorialRuntimePositionSpotlight, { passive:true });
    window.addEventListener("scroll", tutorialRuntimePositionSpotlight, { passive:true, capture:true });
  }
  tutorialRuntimeRenderMenu();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tutorialRuntimeInit, { once:true });
  else tutorialRuntimeInit();
}
