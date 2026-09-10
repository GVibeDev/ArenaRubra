"use strict";

// AR-AC1 state ownership vocabulary. Existing serialized fields remain intact;
// projections make authoritative, AI and diagnostic ownership explicit.
const ArenaStateDomains = (() => {
  const AI_KEYS = Object.freeze([
    "aiFinalizationF9T0", "expertAiF9T1", "emergencyLoggedTurn", "c2eBotHandTacticsUsedThisTurn"
  ]);
  const TELEMETRY_KEYS = Object.freeze([
    "aiTelemetry", "matchTelemetry", "matchStats", "missionTelemetry", "f9n3Telemetry",
    "f9Telemetry", "cardDebug", "events", "eventSeq", "logSeq"
  ]);
  const UI_INTERACTION_KEYS = Object.freeze([
    "selectedId", "mode", "pendingAbility", "pendingBuildBlueprintId", "pendingPurchaseBlueprintId",
    "pendingTacticId", "pendingHandCardUid", "pendingStarterCardUid", "pendingBuildSource",
    "pendingDeploymentContext", "pendingTargetPlayer"
  ]);

  function clone(value) {
    if (value == null) return value;
    if (typeof structuredClone === "function") {
      try { return structuredClone(value); } catch (_) {}
    }
    return JSON.parse(JSON.stringify(value));
  }

  function telemetryKey(key) {
    return TELEMETRY_KEYS.includes(key) || /(?:Telemetry|Diagnostics|Debug)$/.test(key);
  }

  function aiKey(key) {
    return AI_KEYS.includes(key) || /^(?:ai|expertAi)/.test(key);
  }

  function classifyKey(key) {
    if (UI_INTERACTION_KEYS.includes(key)) return "ui";
    if (telemetryKey(key)) return "telemetry";
    if (aiKey(key)) return "ai";
    return "authoritative";
  }

  function project(state, domain) {
    const source = state && typeof state === "object" ? state : {};
    return Object.fromEntries(Object.entries(source)
      .filter(([key]) => classifyKey(key) === domain)
      .map(([key,value]) => [key, clone(value)]));
  }

  function authoritative(state) { return project(state, "authoritative"); }
  function ai(state) { return project(state, "ai"); }
  function telemetry(state) { return project(state, "telemetry"); }
  function withoutDiagnostics(state) { return authoritative(state); }

  function uiInteraction(source = globalThis) {
    const result = {};
    for (const key of UI_INTERACTION_KEYS) {
      try { if (Object.prototype.hasOwnProperty.call(source, key)) result[key] = clone(source[key]); } catch (_) {}
    }
    return result;
  }

  return Object.freeze({
    AI_KEYS,
    TELEMETRY_KEYS,
    UI_INTERACTION_KEYS,
    classifyKey,
    authoritative,
    ai,
    telemetry,
    withoutDiagnostics,
    uiInteraction
  });
})();
