"use strict";

// S2-C5b5b: immutable presentation projection for the frozen tutorial scenarios.
const ArenaTutorialI18n = (() => {
  function text(scenarioId, stepId, field, fallback="") {
    const key = `tutorialNarrative.${scenarioId}.steps.${stepId}.${field}`;
    return typeof ArenaI18n !== "undefined" && ArenaI18n.has(key)
      ? ArenaI18n.t(key, {}, fallback)
      : fallback;
  }

  function scenario(source) {
    if (!source || typeof source !== "object") return source;
    const scenarioId = String(source.id || source.lessonId || "");
    const localized = { ...source };
    const titleKey = `tutorialNarrative.${scenarioId}.title`;
    if (typeof ArenaI18n !== "undefined" && ArenaI18n.has(titleKey)) localized.title = ArenaI18n.t(titleKey, {}, source.title || "");
    localized.steps = (source.steps || []).map((step, index) => {
      const stepId = String(step && step.id || `step-${index + 1}`);
      const projected = { ...step };
      if (step.message) projected.message = {
        ...step.message,
        speaker:text(scenarioId, stepId, "message.speaker", step.message.speaker || ""),
        text:text(scenarioId, stepId, "message.text", step.message.text || "")
      };
      if (step.spotlight) projected.spotlight = {
        ...step.spotlight,
        label:text(scenarioId, stepId, "spotlight.label", step.spotlight.label || "")
      };
      if (step.wrongActionText) projected.wrongActionText = text(scenarioId, stepId, "wrongActionText", step.wrongActionText);
      return projected;
    });
    return localized;
  }

  return Object.freeze({ scenario, text });
})();

globalThis.ArenaTutorialI18n = ArenaTutorialI18n;
globalThis.arenaTutorialScenario = ArenaTutorialI18n.scenario;

if (typeof module !== "undefined" && module.exports) module.exports = ArenaTutorialI18n;
