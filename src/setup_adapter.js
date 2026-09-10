"use strict";

// AR-AC1 first boundary: browser setup controls -> plain setup DTO.
// This classic-script namespace is a temporary bridge until the runtime has an
// explicit module entrypoint. It owns control IDs but no game, state or storage logic.
const ArenaSetupAdapter = (() => {
  const DEFAULT_MAP_ID = "map1_starter";
  const FACTION_FALLBACKS = Object.freeze({ 1: "Nexus", 2: "Exordium", 3: "Liberti", 4: "Agathoi" });

  function hasOwn(value, key) {
    return Boolean(value && Object.prototype.hasOwnProperty.call(value, key));
  }

  function getElement(root, id) {
    return root && typeof root.getElementById === "function" ? root.getElementById(id) : null;
  }

  function readPlayerValue(root, side, suffix, fallback) {
    const setupElement = getElement(root, `setupP${side}${suffix}`);
    const legacyElement = getElement(root, `p${side}${suffix}`);
    return setupElement ? setupElement.value : (legacyElement ? legacyElement.value : fallback);
  }

  function readDeckForSide(root, side) {
    // Compatibility: deck controls historically prefer p* over setupP*, unlike
    // the other player controls. Preserve this until the legacy IDs are removed.
    const modeElement = getElement(root, `p${side}DeckMode`) || getElement(root, `setupP${side}DeckMode`);
    const savedKeyElement = getElement(root, `p${side}DeckSavedKey`) || getElement(root, `setupP${side}DeckSavedKey`);
    return {
      mode: modeElement && modeElement.value === "custom" ? "custom" : "template",
      savedKey: savedKeyElement ? String(savedKeyElement.value || "") : ""
    };
  }

  function normalize(rawSetup = {}, dependencies = {}) {
    const raw = rawSetup && typeof rawSetup === "object" ? rawSetup : {};
    const getMapDefinition = typeof dependencies.getMapDefinitionById === "function"
      ? dependencies.getMapDefinitionById
      : () => null;
    const mapId = hasOwn(raw, "mapId") ? raw.mapId : DEFAULT_MAP_ID;
    const mapDefinition = hasOwn(raw, "mapDefinition") ? raw.mapDefinition : getMapDefinition(mapId);
    const playerCount = Math.max(2, Math.min(4, Number(mapDefinition && mapDefinition.playerCount) || 2));
    const playerIds = Array.from({ length: playerCount }, (_, index) => index + 1);
    const factions = {};
    const selectedCommanders = {};
    const selectedDecks = {};
    const modes = {};

    for (const side of playerIds) {
      factions[side] = hasOwn(raw.factions, side) ? raw.factions[side] : FACTION_FALLBACKS[side];
      selectedCommanders[side] = hasOwn(raw.selectedCommanders, side) ? raw.selectedCommanders[side] : null;
      const rawDeck = hasOwn(raw.selectedDecks, side) && raw.selectedDecks[side] && typeof raw.selectedDecks[side] === "object"
        ? raw.selectedDecks[side]
        : {};
      selectedDecks[side] = {
        mode: rawDeck.mode === "custom" ? "custom" : "template",
        savedKey: String(rawDeck.savedKey || "")
      };
      modes[side] = hasOwn(raw.modes, side) ? raw.modes[side] : (side === 1 ? "human" : "bot");
    }

    return {
      mapId,
      mapDefinition,
      playerCount,
      playerIds,
      factions,
      selectedCommanders,
      selectedDecks,
      modes,
      autoResignEnabled: hasOwn(raw, "autoResignEnabled") ? Boolean(raw.autoResignEnabled) : true,
      aiMode: hasOwn(raw, "aiMode") ? raw.aiMode : "advanced",
      pacePreset: hasOwn(raw, "pacePreset") ? raw.pacePreset : "standard",
      gameScaleMode: hasOwn(raw, "gameScaleMode") ? raw.gameScaleMode : "large_scale"
    };
  }

  function readFromDom(root, dependencies = {}) {
    const mapElement = getElement(root, "setupMapName");
    const mapId = mapElement ? mapElement.value : DEFAULT_MAP_ID;
    const getMapDefinition = typeof dependencies.getMapDefinitionById === "function"
      ? dependencies.getMapDefinitionById
      : () => null;
    const factions = {};
    const selectedCommanders = {};
    const selectedDecks = {};
    const modes = {};
    for (const side of [1, 2, 3, 4]) {
      factions[side] = readPlayerValue(root, side, "Faction", FACTION_FALLBACKS[side]);
      selectedCommanders[side] = readPlayerValue(root, side, "Commander", null);
      selectedDecks[side] = readDeckForSide(root, side);
      modes[side] = readPlayerValue(root, side, "Mode", side === 1 ? "human" : "bot");
    }
    const autoResignElement = getElement(root, "autoResignToggle");
    const aiModeElement = getElement(root, "botAiMode");
    const pacePresetElement = getElement(root, "pacePreset");
    const gameScaleElement = getElement(root, "gameScaleMode");
    return normalize({
      mapId,
      mapDefinition: getMapDefinition(mapId),
      factions,
      selectedCommanders,
      selectedDecks,
      modes,
      autoResignEnabled: autoResignElement ? autoResignElement.checked : true,
      aiMode: aiModeElement ? aiModeElement.value : "advanced",
      pacePreset: pacePresetElement ? pacePresetElement.value : "standard",
      gameScaleMode: gameScaleElement ? gameScaleElement.value : "large_scale"
    }, dependencies);
  }

  function readInitiativeMode(root) {
    // The control is required by the existing browser lifecycle; retaining the
    // direct .value contract preserves the previous failure mode if it is absent.
    return getElement(root, "initiativeMode").value;
  }

  return Object.freeze({ normalize, readFromDom, readInitiativeMode });
})();
