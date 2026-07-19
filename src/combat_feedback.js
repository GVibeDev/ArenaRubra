"use strict";

// Arena Rubra – F9N2a Feedback Readability Timing.
// Layer esclusivamente visuale, guidato dagli eventi tipizzati del motore.
// Non modifica danni, stati, coordinate, targeting, IA, deck o regole.

const COMBAT_FEEDBACK_CONFIG = Object.freeze({
  attackMs: 230,
  impactMs: 260,
  floatMs: 1000,
  statusMs: 1000,
  queueLimit: 160,
  attackShiftPx: 9
});

const COMBAT_FEEDBACK_STATUS_MAP = Object.freeze({
  inhibit_move: { label:"BLOCCO", kind:"block", tokenClass:"feedback-block" },
  inhibit_attack: { label:"BLOCCO ATTACCO", kind:"block", tokenClass:"feedback-block" },
  inhibit_action: { label:"STORDITO", kind:"stun", tokenClass:"feedback-stun" },
  bleed: { label:"SANGUINAMENTO", kind:"bleed", tokenClass:"feedback-bleed" }
});

const COMBAT_FEEDBACK_QUEUE = [];
const COMBAT_FEEDBACK_ACTIVE_SLOTS = new Map();
let combatFeedbackRunning = false;
let combatFeedbackScheduled = false;

function combatFeedbackCloneCoord(coord) {
  return Array.isArray(coord) && coord.length === 3 ? coord.map(Number) : null;
}

function combatFeedbackEscape(value) {
  const raw = String(value == null ? "" : value);
  if (typeof CSS !== "undefined" && CSS && typeof CSS.escape === "function") return CSS.escape(raw);
  return raw.replace(/["\\]/g, "\\$&");
}

function combatFeedbackTokenByUid(uid) {
  if (!uid || typeof document === "undefined") return null;
  return document.querySelector(`.unitToken[data-unit-uid="${combatFeedbackEscape(uid)}"]`);
}

function combatFeedbackHexByCoord(coord) {
  if (!coord || typeof document === "undefined") return null;
  return document.querySelector(`.hex[data-coord-key="${combatFeedbackEscape(coord.join(","))}"]`);
}

function combatFeedbackOverlayLayer() {
  return typeof document !== "undefined" ? document.getElementById("mapOverlayLayer") : null;
}

function combatFeedbackPixelForCoord(coord) {
  const hex = combatFeedbackHexByCoord(coord);
  if (hex) {
    const left = Number.parseFloat(hex.style.left);
    const top = Number.parseFloat(hex.style.top);
    if (Number.isFinite(left) && Number.isFinite(top)) return { left, top };
  }
  if (!coord || typeof CENTER_X === "undefined" || typeof CENTER_Y === "undefined" || typeof HEX_SIZE === "undefined") return null;
  const q = coord[0];
  const r = coord[2];
  return {
    left: CENTER_X + HEX_SIZE * Math.sqrt(3) * (q + r / 2),
    top: CENTER_Y + HEX_SIZE * 1.5 * r
  };
}

function combatFeedbackSleep(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, ms || 0)));
}

function combatFeedbackReducedMotion() {
  try {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) {
    return false;
  }
}

function combatFeedbackAcquireSlot(coord) {
  const key = coord ? coord.join(",") : "global";
  const current = COMBAT_FEEDBACK_ACTIVE_SLOTS.get(key) || 0;
  COMBAT_FEEDBACK_ACTIVE_SLOTS.set(key, current + 1);
  return { key, slot: current };
}

function combatFeedbackReleaseSlot(slotInfo) {
  if (!slotInfo) return;
  const current = COMBAT_FEEDBACK_ACTIVE_SLOTS.get(slotInfo.key) || 0;
  if (current <= 1) COMBAT_FEEDBACK_ACTIVE_SLOTS.delete(slotInfo.key);
  else COMBAT_FEEDBACK_ACTIVE_SLOTS.set(slotInfo.key, current - 1);
}

function combatFeedbackShowFloat({ coord, text, kind="hp", delay=0, duration=null }) {
  const layer = combatFeedbackOverlayLayer();
  const point = combatFeedbackPixelForCoord(coord);
  if (!layer || !point || !text) return Promise.resolve(false);
  const slotInfo = combatFeedbackAcquireSlot(coord);
  const el = document.createElement("div");
  el.className = `combatFeedbackFloat feedback-${kind}`;
  el.textContent = text;
  el.style.left = `${point.left}px`;
  el.style.top = `${point.top - 22 - slotInfo.slot * 15}px`;
  el.style.setProperty("--feedback-delay", `${Math.max(0, delay)}ms`);
  el.style.setProperty("--feedback-duration", `${duration || COMBAT_FEEDBACK_CONFIG.floatMs}ms`);
  layer.appendChild(el);
  const total = Math.max(0, delay) + (duration || COMBAT_FEEDBACK_CONFIG.floatMs) + 60;
  return combatFeedbackSleep(total).then(() => {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    combatFeedbackReleaseSlot(slotInfo);
    return true;
  });
}

function combatFeedbackPulseToken(uid, tokenClass, duration=COMBAT_FEEDBACK_CONFIG.statusMs) {
  const token = combatFeedbackTokenByUid(uid);
  if (!token || !tokenClass) return Promise.resolve(false);
  token.classList.remove(tokenClass);
  void token.offsetWidth;
  token.classList.add(tokenClass);
  return combatFeedbackSleep(duration).then(() => {
    if (token && token.isConnected) token.classList.remove(tokenClass);
    return true;
  });
}

function combatFeedbackImpact(uid) {
  const token = combatFeedbackTokenByUid(uid);
  if (!token) return Promise.resolve(false);
  token.classList.remove("feedback-impact");
  void token.offsetWidth;
  token.classList.add("feedback-impact");
  return combatFeedbackSleep(COMBAT_FEEDBACK_CONFIG.impactMs).then(() => {
    if (token && token.isConnected) token.classList.remove("feedback-impact");
    return true;
  });
}

function combatFeedbackAttackVector(from, to) {
  const a = combatFeedbackPixelForCoord(from);
  const b = combatFeedbackPixelForCoord(to);
  if (!a || !b) return { x:0, y:-COMBAT_FEEDBACK_CONFIG.attackShiftPx };
  const dx = b.left - a.left;
  const dy = b.top - a.top;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: Math.round((dx / len) * COMBAT_FEEDBACK_CONFIG.attackShiftPx * 10) / 10,
    y: Math.round((dy / len) * COMBAT_FEEDBACK_CONFIG.attackShiftPx * 10) / 10
  };
}

function combatFeedbackAnimateAttack(data) {
  const token = combatFeedbackTokenByUid(data.attackerId);
  if (!token) return Promise.resolve(false);
  const vector = combatFeedbackAttackVector(data.attackerPos, data.defenderPos);
  token.style.setProperty("--feedback-shift-x", `${vector.x}px`);
  token.style.setProperty("--feedback-shift-y", `${vector.y}px`);
  token.classList.remove("feedback-attacking");
  void token.offsetWidth;
  token.classList.add("feedback-attacking");
  const duration = combatFeedbackReducedMotion() ? 80 : COMBAT_FEEDBACK_CONFIG.attackMs;
  return combatFeedbackSleep(duration).then(() => {
    if (token && token.isConnected) {
      token.classList.remove("feedback-attacking");
      token.style.removeProperty("--feedback-shift-x");
      token.style.removeProperty("--feedback-shift-y");
    }
    return true;
  });
}

function combatFeedbackHandleDamage(data) {
  const coord = combatFeedbackCloneCoord(data.targetPos);
  const jobs = [];
  if ((data.defLoss || 0) > 0) jobs.push(combatFeedbackShowFloat({ coord, text:`-${data.defLoss} DEF`, kind:"def" }));
  if ((data.hpLoss || 0) > 0) jobs.push(combatFeedbackShowFloat({ coord, text:`-${data.hpLoss} HP`, kind:"hp", delay:(data.defLoss || 0) > 0 ? 90 : 0 }));
  if (jobs.length) jobs.push(combatFeedbackImpact(data.targetId));
  return jobs.length ? Promise.all(jobs) : Promise.resolve(false);
}

function combatFeedbackHandleDefenseLoss(data) {
  const loss = Number(data.defLoss || data.amount || 0);
  if (!(loss > 0)) return Promise.resolve(false);
  return Promise.all([
    combatFeedbackShowFloat({ coord:combatFeedbackCloneCoord(data.targetPos), text:`-${loss} DEF`, kind:"def" }),
    combatFeedbackImpact(data.targetId)
  ]);
}

function combatFeedbackHandleStatus(data) {
  const meta = COMBAT_FEEDBACK_STATUS_MAP[data.statusKind];
  if (!meta) return Promise.resolve(false);
  const coord = combatFeedbackCloneCoord(data.targetPos);
  return Promise.all([
    combatFeedbackShowFloat({ coord, text:meta.label, kind:`status-${meta.kind}`, duration:COMBAT_FEEDBACK_CONFIG.statusMs }),
    combatFeedbackPulseToken(data.targetId, meta.tokenClass)
  ]);
}

async function combatFeedbackProcessEvent(event) {
  if (!event || !event.type) return;
  const data = event.data || {};
  if (event.type === EventTypes.UNIT_ATTACKED) {
    await combatFeedbackAnimateAttack(data);
    return;
  }
  if (event.type === EventTypes.UNIT_DAMAGED) {
    await combatFeedbackHandleDamage(data);
    return;
  }
  if (event.type === EventTypes.UNIT_DEFENSE_LOST) {
    await combatFeedbackHandleDefenseLoss(data);
    return;
  }
  if (event.type === EventTypes.STATUS_APPLIED) {
    await combatFeedbackHandleStatus(data);
  }
}

async function combatFeedbackDrainQueue() {
  if (combatFeedbackRunning) return;
  combatFeedbackRunning = true;
  combatFeedbackScheduled = false;
  try {
    while (COMBAT_FEEDBACK_QUEUE.length) {
      const event = COMBAT_FEEDBACK_QUEUE.shift();
      try { await combatFeedbackProcessEvent(event); }
      catch (err) { console.warn("Arena Rubra F9N2 feedback event failed", err); }
    }
  } finally {
    combatFeedbackRunning = false;
    if (COMBAT_FEEDBACK_QUEUE.length) combatFeedbackScheduleDrain();
  }
}

function combatFeedbackScheduleDrain() {
  if (combatFeedbackScheduled || combatFeedbackRunning) return;
  combatFeedbackScheduled = true;
  setTimeout(combatFeedbackDrainQueue, 0);
}

function combatFeedbackEnqueueEvent(event) {
  if (!event || !event.type) return false;
  const relevant = event.type === EventTypes.UNIT_ATTACKED
    || event.type === EventTypes.UNIT_DAMAGED
    || event.type === EventTypes.STATUS_APPLIED
    || event.type === EventTypes.UNIT_DEFENSE_LOST;
  if (!relevant) return false;
  COMBAT_FEEDBACK_QUEUE.push({
    type:event.type,
    seq:event.seq || 0,
    at:event.at || "",
    data:{ ...(event.data || {}) }
  });
  if (COMBAT_FEEDBACK_QUEUE.length > COMBAT_FEEDBACK_CONFIG.queueLimit) {
    COMBAT_FEEDBACK_QUEUE.splice(0, COMBAT_FEEDBACK_QUEUE.length - COMBAT_FEEDBACK_CONFIG.queueLimit);
  }
  combatFeedbackScheduleDrain();
  return true;
}

function combatFeedbackAfterRender() {
  if (COMBAT_FEEDBACK_QUEUE.length) combatFeedbackScheduleDrain();
}

function combatFeedbackEmitDefenseLoss(target, loss, source="perdita DEF", options={}) {
  const amount = Math.max(0, Number(loss) || 0);
  if (!target || !(amount > 0)) return null;
  return emitGameEvent({
    type:EventTypes.UNIT_DEFENSE_LOST,
    message:`${target.name} perde ${amount} DEF da ${source}.`,
    data:{
      targetId:target.uid,
      targetName:target.name,
      targetSide:target.side,
      targetPos:combatFeedbackCloneCoord(target.pos),
      defLoss:amount,
      source,
      sourceType:options.sourceType || null,
      sourceId:options.sourceId || null
    }
  });
}

function combatFeedbackDebugState() {
  return {
    queued:COMBAT_FEEDBACK_QUEUE.length,
    running:combatFeedbackRunning,
    activeSlots:Object.fromEntries(COMBAT_FEEDBACK_ACTIVE_SLOTS.entries())
  };
}
