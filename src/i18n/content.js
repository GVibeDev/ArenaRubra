"use strict";

// S2-C5b4: presentation-only localization seam for frozen content.
const ArenaContentI18n = (() => {
  function key(kind, id, field) {
    return `content.${String(kind || "").trim()}.${String(id || "").trim()}.${String(field || "name").trim()}`;
  }

  function text(kind, id, field, fallback = "") {
    const translationKey = key(kind, id, field);
    if (typeof ArenaI18n === "undefined" || !ArenaI18n.has(translationKey)) return fallback;
    return ArenaI18n.t(translationKey, {}, fallback);
  }

  function resolveId(kind, item) {
    if (!item || typeof item !== "object") return "";
    const normalizedKind = String(kind || "");
    if (normalizedKind === "units") return item.blueprintId || item.sourceId || item.id || "";
    if (normalizedKind === "tactics") return item.tacticId || item.sourceId || item.id || "";
    if (normalizedKind === "missions") return item.missionId || item.sourceId || item.id || "";
    return item.id || item.sourceId || "";
  }

  function taxonomy(group, value, fallback = value) {
    const translationKey = `content.taxonomy.${String(group || "")}.${String(value || "")}`;
    if (typeof ArenaI18n === "undefined" || !ArenaI18n.has(translationKey)) return fallback;
    return ArenaI18n.t(translationKey, {}, fallback);
  }

  function valueAt(item, field) {
    return String(field || "").split(".").reduce((value, segment) => value && value[segment], item);
  }

  function assignAt(item, field, value) {
    const segments = String(field || "").split(".").filter(Boolean);
    if (!segments.length) return item;
    let cursor = item;
    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        cursor[segment] = value;
        return;
      }
      cursor[segment] = cursor[segment] && typeof cursor[segment] === "object"
        ? { ...cursor[segment] }
        : {};
      cursor = cursor[segment];
    });
    return item;
  }

  function project(kind, item, fields = ["name", "description"]) {
    if (!item || typeof item !== "object") return item;
    const id = resolveId(kind, item);
    const localized = { ...item };
    fields.forEach(field => {
      const sourceValue = valueAt(item, field);
      if (typeof sourceValue === "string") assignAt(localized, field, text(kind, id, field, sourceValue));
    });
    return localized;
  }

  function mission(item) {
    if (!item || typeof item !== "object") return item;
    const id = resolveId("missions", item);
    const localized = project("missions", item, ["name", "description", "quality", "category"]);
    ["objectives", "conditions"].forEach(group => {
      if (!Array.isArray(item[group])) return;
      localized[group] = item[group].map(entry => ({
        ...entry,
        text:text("missions", id, `${group}.${entry.id}.text`, entry.text || "")
      }));
    });
    if (item.reward && typeof item.reward === "object") {
      localized.reward = {
        ...item.reward,
        text:text("missions", id, "reward.text", item.reward.text || "")
      };
    }
    if (item.effectText) {
      const items = localized.missionClass === "desperate" ? (localized.conditions || []) : (localized.objectives || []);
      const prefix = localized.missionClass === "desperate"
        ? text("missionLabels", "card", "conditions", "Condizioni")
        : text("missionLabels", "card", "objectives", "Obiettivi");
      const rewardLabel = text("missionLabels", "card", "reward", "Ricompensa");
      localized.effectText = `${prefix}: ${items.map((entry, index) => `${index + 1}) ${entry.text}`).join(" ")} ${rewardLabel}: ${localized.reward ? localized.reward.text : ""}`.trim();
    }
    return localized;
  }

  function card(item, fields = null) {
    if (!item || typeof item !== "object") return item;
    const sourceType = item.sourceType || "";
    const kind = sourceType === "unit" ? "units" : (sourceType === "tactic" ? "tactics" : (sourceType === "mission" ? "missions" : ""));
    const localizedFields = fields || (kind === "units"
      ? ["name", "description", "abilityText"]
      : ["name", "description", "effectText", "notes", "target", "category", "quality"]);
    if (kind === "missions") return mission(item);
    return kind ? project(kind, item, localizedFields) : item;
  }

  return Object.freeze({ card, key, mission, project, resolveId, taxonomy, text });
})();

globalThis.ArenaContentI18n = ArenaContentI18n;
globalThis.arenaContentText = ArenaContentI18n.text;
globalThis.arenaContentTaxonomy = ArenaContentI18n.taxonomy;
globalThis.arenaContentCard = ArenaContentI18n.card;
globalThis.arenaContentMission = ArenaContentI18n.mission;

if (typeof module !== "undefined" && module.exports) module.exports = ArenaContentI18n;
