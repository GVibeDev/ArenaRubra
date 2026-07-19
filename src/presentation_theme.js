"use strict";

// Arena Rubra – F9O1a Presentation Theme Runtime.
// La fazione del Giocatore 1 assegna il preset iniziale; il calibratore può
// applicare un override visuale di sessione durante la partita.

const ARENA_FACTION_PRESENTATION_THEMES = Object.freeze({
  Nexus: Object.freeze({
    key: "nexus",
    label: "Nexus · Basalto notturno",
    mapSkinKey: "basalt_night",
    mapLabel: "Basalto notturno",
    musicTrackKey: "faction_nexus"
  }),
  Exordium: Object.freeze({
    key: "exordium",
    label: "Exordium · Imperium",
    mapSkinKey: "exordium_battlegrounds",
    mapLabel: "Campi di battaglia imperiali",
    musicTrackKey: "faction_exordium"
  }),
  Liberti: Object.freeze({
    key: "liberti",
    label: "Liberti · Sine Vinculis",
    mapSkinKey: "red_dust",
    mapLabel: "Polvere rossa",
    musicTrackKey: "faction_liberti"
  }),
  Agathoi: Object.freeze({
    key: "agathoi",
    label: "Agathoi · Kleos",
    mapSkinKey: "overgrowth_ruins",
    mapLabel: "Rovine vegetali",
    musicTrackKey: "faction_agathoi"
  }),
  Fabeot: Object.freeze({
    key: "fabeot",
    label: "Fabeot · Vesper",
    mapSkinKey: "fabeot_velvet_hoods",
    mapLabel: "Cappucci di velluto",
    musicTrackKey: "faction_fabeot"
  })
});

function arenaPresentationThemeForFaction(faction) {
  return ARENA_FACTION_PRESENTATION_THEMES[String(faction || "")] || ARENA_FACTION_PRESENTATION_THEMES.Nexus;
}

function arenaPresentationNormalizeMapSkinKey(key, fallback = "basalt_night") {
  if (typeof mapSkinByKey === "function") return mapSkinByKey(key || fallback).key;
  return String(key || fallback);
}

function arenaPresentationCurrentOverride() {
  if (typeof state === "undefined" || !state || !state.presentationTheme) return null;
  const override = state.presentationTheme.calibrationOverride;
  return override && override.active ? override : null;
}

function arenaPresentationHasGameCalibrationOverride() {
  return Boolean(arenaPresentationCurrentOverride());
}

function arenaPresentationWriteDataset(theme, faction, activeMapSkinKey = null, source = "faction-default") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  const mapKey = activeMapSkinKey || theme.mapSkinKey;
  if (root) {
    root.dataset.arenaFactionTheme = theme.key;
    root.dataset.arenaFaction = faction;
    root.dataset.arenaThemeMap = mapKey;
    root.dataset.arenaThemeMapDefault = theme.mapSkinKey;
    root.dataset.arenaThemeSource = source;
    root.dataset.arenaThemeMusic = theme.musicTrackKey;
  }
  if (body) {
    body.dataset.arenaFactionTheme = theme.key;
    body.dataset.arenaFaction = faction;
    body.dataset.arenaThemeSource = source;
  }
}

function arenaPresentationApplyForFaction(faction, options = {}) {
  const normalizedFaction = ARENA_FACTION_PRESENTATION_THEMES[faction] ? faction : "Nexus";
  const theme = arenaPresentationThemeForFaction(normalizedFaction);
  const previousOverride = options.preserveOverride !== false ? arenaPresentationCurrentOverride() : null;
  const activeMapSkinKey = previousOverride
    ? arenaPresentationNormalizeMapSkinKey(previousOverride.mapSkinKey, theme.mapSkinKey)
    : theme.mapSkinKey;
  const source = previousOverride ? "calibrator-session" : "faction-default";

  arenaPresentationWriteDataset(theme, normalizedFaction, activeMapSkinKey, source);
  if (typeof mapSkinApply === "function") mapSkinApply(activeMapSkinKey, { save: false });
  if (previousOverride && previousOverride.tokenGraphicsMode && typeof visualAssetSetTokenGraphicsMode === "function") {
    visualAssetSetTokenGraphicsMode(previousOverride.tokenGraphicsMode, { save: false });
  }

  if (typeof state !== "undefined" && state) {
    state.presentationTheme = {
      faction: normalizedFaction,
      key: theme.key,
      label: theme.label,
      mapSkinKey: activeMapSkinKey,
      activeMapSkinKey,
      defaultMapSkinKey: theme.mapSkinKey,
      mapLabel: previousOverride && previousOverride.mapLabel ? previousOverride.mapLabel : theme.mapLabel,
      defaultMapLabel: theme.mapLabel,
      mapSource: source,
      musicTrackKey: theme.musicTrackKey,
      sourceSide: 1,
      calibrationOverride: previousOverride ? { ...previousOverride, mapSkinKey: activeMapSkinKey } : null
    };
  }
  if (options.music !== false && typeof arenaAudioEnterGameForFaction === "function") {
    arenaAudioEnterGameForFaction(normalizedFaction, { fade: options.fade !== false });
  }
  return theme;
}

function arenaPresentationApplyForGame(options = {}) {
  const faction = typeof state !== "undefined" && state && state.factions ? state.factions[1] : "Nexus";
  const preserveOverride = options.resetSessionOverride === true ? false : options.preserveOverride !== false;
  return arenaPresentationApplyForFaction(faction, { ...options, preserveOverride });
}

function arenaPresentationSetGameCalibrationOverride(values = {}) {
  if (typeof state === "undefined" || !state || !state.factions) return null;
  const faction = state.factions[1] || "Nexus";
  const theme = arenaPresentationThemeForFaction(faction);
  const mapSkinKey = arenaPresentationNormalizeMapSkinKey(values.mapSkinKey, theme.mapSkinKey);
  const skin = typeof mapSkinByKey === "function" ? mapSkinByKey(mapSkinKey) : { key: mapSkinKey, label: mapSkinKey };
  const tokenGraphicsMode = values.tokenGraphicsMode ? String(values.tokenGraphicsMode) : null;
  const override = {
    active: true,
    source: "layout-calibrator",
    mapSkinKey,
    mapLabel: skin.label || mapSkinKey,
    tokenGraphicsMode,
    appliedAt: new Date().toISOString()
  };

  const current = state.presentationTheme || {};
  state.presentationTheme = {
    ...current,
    faction,
    key: theme.key,
    label: theme.label,
    defaultMapSkinKey: theme.mapSkinKey,
    defaultMapLabel: theme.mapLabel,
    mapSkinKey,
    activeMapSkinKey: mapSkinKey,
    mapLabel: override.mapLabel,
    mapSource: "calibrator-session",
    musicTrackKey: theme.musicTrackKey,
    sourceSide: 1,
    calibrationOverride: override
  };
  arenaPresentationWriteDataset(theme, faction, mapSkinKey, "calibrator-session");
  if (typeof mapSkinApply === "function") mapSkinApply(mapSkinKey, { save: false });
  if (tokenGraphicsMode && typeof visualAssetSetTokenGraphicsMode === "function") {
    visualAssetSetTokenGraphicsMode(tokenGraphicsMode, { save: false });
  }
  return override;
}

function arenaPresentationClearGameCalibrationOverride(options = {}) {
  if (typeof state === "undefined" || !state || !state.factions) return null;
  const faction = state.factions[1] || "Nexus";
  const theme = arenaPresentationThemeForFaction(faction);
  if (state.presentationTheme) state.presentationTheme.calibrationOverride = null;
  if (options.apply !== false) {
    arenaPresentationApplyForFaction(faction, { music: false, preserveOverride: false });
  }
  return theme;
}

function arenaPresentationResetForMenu(options = {}) {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    const body = document.body;
    if (root) {
      delete root.dataset.arenaFactionTheme;
      delete root.dataset.arenaFaction;
      delete root.dataset.arenaThemeMap;
      delete root.dataset.arenaThemeMapDefault;
      delete root.dataset.arenaThemeSource;
      delete root.dataset.arenaThemeMusic;
    }
    if (body) {
      delete body.dataset.arenaFactionTheme;
      delete body.dataset.arenaFaction;
      delete body.dataset.arenaThemeSource;
    }
  }
  if (options.restoreMap !== false && typeof mapSkinApplySaved === "function") mapSkinApplySaved();
  if (options.music !== false && typeof arenaAudioEnterMenu === "function") arenaAudioEnterMenu({ fade: options.fade !== false });
}

function arenaPresentationDiagnostics() {
  const faction = typeof state !== "undefined" && state && state.factions ? state.factions[1] : null;
  const theme = faction ? arenaPresentationThemeForFaction(faction) : null;
  return {
    schema: "arena-rubra-f9o1a-presentation-diagnostics-v2",
    player1Faction: faction,
    theme: theme ? { ...theme } : null,
    runtime: typeof state !== "undefined" && state && state.presentationTheme ? { ...state.presentationTheme } : null,
    calibrationOverrideActive: arenaPresentationHasGameCalibrationOverride(),
    audio: typeof arenaAudioDiagnostics === "function" ? arenaAudioDiagnostics() : null
  };
}
