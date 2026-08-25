"use strict";

// Arena Rubra – Fase B3b
// UI bindings isolation prudente.
// Questo file contiene i collegamenti DOM: pulsanti, select, toggle e avvio iniziale.
// Non introduce nuove meccaniche e non modifica il gameplay.


function commanderOptionLabel(card) {
  const bp = card && typeof BLUEPRINTS !== "undefined" ? BLUEPRINTS.find(x => x.id === card.blueprintId) : null;
  const archetype = bp && bp.commanderArchetype ? ` · ${bp.commanderArchetype}` : "";
  return `${card.name}${archetype}`;
}

function populateCommanderSelectForSide(side) {
  const factionSelect = $(`p${side}Faction`);
  const commanderSelect = $(`p${side}Commander`);
  if (!factionSelect || !commanderSelect || typeof commanderCardsForFaction !== "function") return;

  const faction = factionSelect.value;
  const previous = commanderSelect.value;
  const commanders = commanderCardsForFaction(faction);
  commanderSelect.innerHTML = commanders.map(card => `<option value="${card.blueprintId}">${commanderOptionLabel(card)}</option>`).join("");

  const fallback = typeof defaultCommanderBlueprintIdForFaction === "function" ? defaultCommanderBlueprintIdForFaction(faction) : (commanders[0] && commanders[0].blueprintId);
  commanderSelect.value = commanders.some(card => card.blueprintId === previous) ? previous : fallback;
}

function refreshCommanderSelects() {
  populateCommanderSelectForSide(1);
  populateCommanderSelectForSide(2);
}

function bindUiEvents() {
$("newGameBtn").addEventListener("click", newGame);
    $("resetStatsBtn").addEventListener("click", resetMatchStats);
    $("copyStatsBtn").addEventListener("click", copyMatchStatsCsv);
    if ($("copyLogBtn")) $("copyLogBtn").addEventListener("click", copyCurrentMatchLogTxt);
    if ($("exportLogBtn")) $("exportLogBtn").addEventListener("click", exportCurrentMatchLogTxt);
    if ($("copyMatchStatsJsonBtn")) $("copyMatchStatsJsonBtn").addEventListener("click", copyCurrentMatchStatsJson);
    if ($("copyMatchTelemetryJsonBtn")) $("copyMatchTelemetryJsonBtn").addEventListener("click", copyCurrentMatchTelemetryJson);
    if ($("copyMatchReportBtn")) $("copyMatchReportBtn").addEventListener("click", copyCurrentMatchReportText);
    if ($("copyEventsJsonBtn")) $("copyEventsJsonBtn").addEventListener("click", copyCurrentMatchEventsJson);
    if ($("copyStatsFullLogBtn")) $("copyStatsFullLogBtn").addEventListener("click", copyCurrentMatchLogTxt);
    if ($("copyMatchHistoryJsonBtn")) $("copyMatchHistoryJsonBtn").addEventListener("click", copyPersistentMatchHistoryJson);
    if ($("importMatchHistoryJsonBtn")) $("importMatchHistoryJsonBtn").addEventListener("click", importPersistentMatchHistoryJson);
    if ($("resetMatchHistoryBtn")) $("resetMatchHistoryBtn").addEventListener("click", resetPersistentMatchHistory);
    $("endTurnBtn").addEventListener("click", () => endTurn({ source:"ui" }));
    $("runBotBtn").addEventListener("click", maybeRunBot);
    $("concedeBtn").addEventListener("click", () => concedeMatch(state.currentPlayer));
    $("autoResignToggle").addEventListener("change", () => { if (state) state.autoResignEnabled = $("autoResignToggle").checked; });
    $("botAiMode").addEventListener("change", () => { if (state) { state.aiMode = $("botAiMode").value; log(`AI dei bot impostata su ${typeof aiModeLabel === "function" ? aiModeLabel(state.aiMode) : state.aiMode}.`); maybeRunBot(); renderAll(); } });
    $("pacePreset").addEventListener("change", () => { if (state) { state.pacePreset = $("pacePreset").value; log(`Preset ritmo impostato su ${paceLabel()}: ${typeof pressureRequirementSummary === "function" ? pressureRequirementSummary() : `Pressione dal round ${pressureStartRound()}`}; cap leggere G1 ${lightFieldLimit(1)} / G2 ${lightFieldLimit(2)}, movimento veicoli ${vehicleMoveRange()}.`); renderAll(); maybeRunBot(); } });
    $("p1Mode").addEventListener("change", () => { if (state) state.modes[1] = $("p1Mode").value; maybeRunBot(); renderAll(); });
    $("p2Mode").addEventListener("change", () => { if (state) state.modes[2] = $("p2Mode").value; maybeRunBot(); renderAll(); });
    $("p1Faction").addEventListener("change", () => { refreshCommanderSelects(); if (state) log("La fazione/comandante del G1 verranno applicati dalla prossima nuova partita."); });
    $("p2Faction").addEventListener("change", () => { refreshCommanderSelects(); if (state) log("La fazione/comandante del G2 verranno applicati dalla prossima nuova partita."); });
    if ($("p1Commander")) $("p1Commander").addEventListener("change", () => { if (state) log("Il comandante del G1 verrà applicato dalla prossima nuova partita."); });
    if ($("p2Commander")) $("p2Commander").addEventListener("change", () => { if (state) log("Il comandante del G2 verrà applicato dalla prossima nuova partita."); });
    $("initiativeMode").addEventListener("change", () => { if (state) log("L'iniziativa verrà applicata dalla prossima nuova partita."); });
}

// =====================================================
// F9W1a — Match Data 2.0 Foundation
// Canonical N-player MatchRecord + MatchTelemetry separata.
// Mantiene gli alias storici necessari alle viste legacy, ma il payload telemetrico
// non viene più incorporato nei nuovi record di cronologia.
// =====================================================

const MATCH_RECORD_SCHEMA_VERSION_F9W1A = "AR-MATCH-2";
const MATCH_TELEMETRY_STORE_SCHEMA_VERSION_F9W1A = "AR-TELEMETRY-2";
const MATCH_TELEMETRY_STORAGE_KEY_F9W1A = "arenaRubra.matchTelemetry.v2";
const MATCH_HISTORY_STORAGE_KEY_F9W1A = "arenaRubra.matchHistory.v1";
const MATCH_DATA_LIMIT_F9W1A = 500;
const MATCH_TELEMETRY_DATA_PATH_F9W1A = "stats/match-telemetry.json";

function arenaMatchDataInstallDataStorePathF9W1a() {
  if (typeof ArenaDataStore === "undefined" || !ArenaDataStore || ArenaDataStore.__f9w1aTelemetryPathInstalled) return false;
  if (typeof ArenaDataStore.pathForKey !== "function") return false;
  const previousPathForKey = ArenaDataStore.pathForKey.bind(ArenaDataStore);
  ArenaDataStore.pathForKey = function pathForKeyF9W1a(key) {
    if (String(key || "") === MATCH_TELEMETRY_STORAGE_KEY_F9W1A) return MATCH_TELEMETRY_DATA_PATH_F9W1A;
    return previousPathForKey(key);
  };
  ArenaDataStore.__f9w1aTelemetryPathInstalled = true;
  return true;
}

async function arenaMatchDataEnsureTelemetryStoreReadyF9W1a() {
  arenaMatchDataInstallDataStorePathF9W1a();
  if (typeof ArenaDataStore === "undefined" || !ArenaDataStore) return false;
  if (ArenaDataStore.mirror && typeof ArenaDataStore.mirror.has === "function" && ArenaDataStore.mirror.has(MATCH_TELEMETRY_STORAGE_KEY_F9W1A)) return true;
  if (typeof ArenaDataStore._loadRegisteredKey === "function") {
    await ArenaDataStore._loadRegisteredKey(MATCH_TELEMETRY_STORAGE_KEY_F9W1A);
    return true;
  }
  return false;
}

arenaMatchDataInstallDataStorePathF9W1a();

function matchDataCloneF9W1a(value) {
  if (value == null) return value;
  try { return structuredClone(value); } catch (_) {}
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
}

function matchDataNumberF9W1a(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function matchDataPlayerIdsF9W1a(sourceState = null) {
  const runtime = sourceState || (typeof state !== "undefined" ? state : null);
  let ids = [];
  if (runtime && typeof mapRuntimePlayerIds === "function") ids = mapRuntimePlayerIds(runtime) || [];
  else if (runtime && Array.isArray(runtime.playerIds)) ids = runtime.playerIds;
  if (!ids.length && runtime && runtime.factions) ids = Object.keys(runtime.factions);
  if (!ids.length) ids = [1, 2];
  return [...new Set(ids.map(Number).filter(side => Number.isInteger(side) && side > 0))].sort((a, b) => a - b);
}

function matchDataLegacyPlayerIdsF9W1a(record) {
  if (record && Array.isArray(record.playerIds) && record.playerIds.length) return [...record.playerIds].map(Number).filter(Boolean);
  if (record && record.players && typeof record.players === "object") {
    const keys = Object.keys(record.players).map(Number).filter(side => Number.isInteger(side) && side > 0);
    if (keys.length) return keys.sort((a, b) => a - b);
  }
  const ids = [];
  if (record && (record.p1Faction || record.p1Mode || record.p1Commander)) ids.push(1);
  if (record && (record.p2Faction || record.p2Mode || record.p2Commander)) ids.push(2);
  return ids.length ? ids : [1, 2];
}

function matchDataFinalValueF9W1a(record, key, side, fallback = 0) {
  if (record && record.final && record.final[key] && Object.prototype.hasOwnProperty.call(record.final[key], side)) return record.final[key][side];
  if (record && record[key] && typeof record[key] === "object" && Object.prototype.hasOwnProperty.call(record[key], side)) return record[key][side];
  const legacyKey = `${key === "energy" ? "ene" : key}${side}`;
  if (record && Object.prototype.hasOwnProperty.call(record, legacyKey)) return record[legacyKey];
  return fallback;
}

function matchDataDeckIdentityF9W1a(side) {
  const selection = typeof state !== "undefined" && state && state.selectedDecks && state.selectedDecks[side]
    ? matchDataCloneF9W1a(state.selectedDecks[side])
    : { mode:"template" };
  if (typeof telemetryDeckIdentity === "function") {
    try {
      const identity = telemetryDeckIdentity(side);
      if (identity && typeof identity === "object") {
        return {
          mode: identity.mode || selection.mode || "template",
          key: identity.key || selection.savedKey || "template",
          name: identity.name || "",
          official: Boolean(identity.official),
          category: identity.category || "",
          archetype: identity.archetype || "",
          commanderId: identity.commanderId || "",
          commanderName: identity.commanderName || "",
          pivotId: identity.pivotId || "",
          pivotName: identity.pivotName || "",
          missionId: identity.missionId || "",
          missionName: identity.missionName || "",
          cardCount: matchDataNumberF9W1a(identity.cardCount, 0)
        };
      }
    } catch (_) {}
  }
  return {
    mode: selection.mode || "template",
    key: selection.savedKey || "template",
    name: selection.deckName || "",
    official: selection.mode !== "custom"
  };
}

function matchDataParticipantFromStateF9W1a(side, statsPlayers = {}) {
  const playerState = typeof getPlayerById === "function" ? getPlayerById(side) : null;
  const aggregate = statsPlayers && statsPlayers[side] ? matchDataCloneF9W1a(statsPlayers[side]) : {};
  const eliminated = typeof isPlayerEliminated === "function" ? Boolean(isPlayerEliminated(side)) : Boolean(playerState && playerState.eliminated);
  return {
    side,
    faction: state && state.factions ? state.factions[side] || "" : "",
    mode: state && state.modes ? state.modes[side] || "" : "",
    commanderId: state && state.selectedCommanders ? state.selectedCommanders[side] || "" : "",
    commanderName: typeof commanderLogLabel === "function" ? commanderLogLabel(side) : "",
    deck: matchDataDeckIdentityF9W1a(side),
    lifecycle: {
      status: typeof playerLifecycleStatus === "function" ? playerLifecycleStatus(side) : (eliminated ? "eliminated" : "active"),
      eliminated,
      eliminatedAtTurn: playerState ? playerState.eliminatedAtTurn ?? null : null,
      eliminatedBy: playerState ? playerState.eliminatedBy ?? null : null,
      eliminationReason: playerState ? playerState.eliminationReason || null : null,
      eliminationAssistSides: playerState && Array.isArray(playerState.eliminationAssistSides) ? [...playerState.eliminationAssistSides] : [],
      eliminationAttributionType: playerState ? playerState.eliminationAttributionType || null : null
    },
    final: {
      ps: typeof countControlledPS === "function" ? countControlledPS(side) : 0,
      pressure: state && state.pressure ? matchDataNumberF9W1a(state.pressure[side], 0) : 0,
      units: typeof combatUnits === "function" ? combatUnits(side).length : 0,
      energy: state && state.energy ? matchDataNumberF9W1a(state.energy[side], 0) : 0
    },
    stats: aggregate
  };
}

function matchDataApplyCompatibilityAliasesF9W1a(record) {
  if (!record || typeof record !== "object") return record;
  const out = record;
  const participants = Array.isArray(out.participants) ? out.participants : [];
  const playerIds = participants.map(item => Number(item.side)).filter(Boolean);
  const players = Object.fromEntries(participants.map(item => [item.side, {
    faction:item.faction,
    mode:item.mode,
    commander:item.commanderName,
    commanderId:item.commanderId,
    eliminated:Boolean(item.lifecycle && item.lifecycle.eliminated),
    lifecycleStatus:item.lifecycle ? item.lifecycle.status : null,
    eliminatedAtTurn:item.lifecycle ? item.lifecycle.eliminatedAtTurn : null,
    eliminatedBy:item.lifecycle ? item.lifecycle.eliminatedBy : null,
    eliminationReason:item.lifecycle ? item.lifecycle.eliminationReason : null,
    eliminationAssistSides:item.lifecycle && Array.isArray(item.lifecycle.eliminationAssistSides) ? [...item.lifecycle.eliminationAssistSides] : [],
    eliminationAttributionType:item.lifecycle ? item.lifecycle.eliminationAttributionType : null,
    ...(item.stats && typeof item.stats === "object" ? matchDataCloneF9W1a(item.stats) : {}),
    ps:item.final ? item.final.ps : 0,
    pressure:item.final ? item.final.pressure : 0,
    units:item.final ? item.final.units : 0,
    energy:item.final ? item.final.energy : 0
  }]));
  out.id = out.matchId || out.id || "";
  out.at = out.recordedAt || out.at || "";
  out.playerIds = playerIds;
  out.playerCount = playerIds.length;
  out.players = players;
  out.selectedDecks = Object.fromEntries(participants.map(item => [item.side, matchDataCloneF9W1a(item.deck || { mode:"template" })]));
  out.p1Faction = participants[0] ? participants[0].faction : "";
  out.p2Faction = participants[1] ? participants[1].faction : "";
  out.p1Mode = participants[0] ? participants[0].mode : "";
  out.p2Mode = participants[1] ? participants[1].mode : "";
  out.p1Commander = participants[0] ? participants[0].commanderName : "";
  out.p2Commander = participants[1] ? participants[1].commanderName : "";
  out.mapId = out.map && out.map.id ? out.map.id : out.mapId || "map1_starter";
  out.mapName = out.map && out.map.name ? out.map.name : out.mapName || out.map || "Starter MAP1";
  out.mapRevision = out.map && out.map.revision != null ? out.map.revision : out.mapRevision || 1;
  out.mapSchemaVersion = out.map && out.map.schemaVersion != null ? out.map.schemaVersion : out.mapSchemaVersion || 1;
  out.mapCellCount = out.map && out.map.cellCount != null ? out.map.cellCount : out.mapCellCount || 0;
  out.terrainUsage = out.map && out.map.terrainUsage ? matchDataCloneF9W1a(out.map.terrainUsage) : out.terrainUsage || {};
  out.movementMultiplier = out.map && out.map.movementMultiplier != null ? out.map.movementMultiplier : out.movementMultiplier || 1;
  out.aiMode = out.setup ? out.setup.aiMode : out.aiMode || "advanced";
  out.pacePreset = out.setup ? out.setup.pacePreset : out.pacePreset || "competitive";
  out.gameScaleMode = out.setup ? out.setup.gameScaleMode : out.gameScaleMode || "tactical";
  out.winnerSide = out.outcome ? out.outcome.winnerSide : out.winnerSide ?? null;
  out.winnerFaction = out.outcome ? out.outcome.winnerFaction : out.winnerFaction || (out.winnerSide ? (players[out.winnerSide] && players[out.winnerSide].faction) : "Pareggio");
  out.winType = out.outcome ? out.outcome.winType : out.winType || "altro";
  out.round = out.outcome ? out.outcome.round : matchDataNumberF9W1a(out.round, 0);
  out.message = out.outcome ? out.outcome.message : out.message || "";
  out.loserFactions = out.outcome && Array.isArray(out.outcome.loserFactions) ? [...out.outcome.loserFactions] : participants.filter(item => out.winnerSide && item.side !== out.winnerSide).map(item => item.faction);
  out.loserFaction = out.loserFactions[0] || (out.winnerSide ? "" : "Pareggio");
  for (const side of [1, 2]) {
    out[`ps${side}`] = out.final && out.final.ps ? matchDataNumberF9W1a(out.final.ps[side], 0) : matchDataNumberF9W1a(players[side] && players[side].ps, 0);
    out[`pressure${side}`] = out.final && out.final.pressure ? matchDataNumberF9W1a(out.final.pressure[side], 0) : matchDataNumberF9W1a(players[side] && players[side].pressure, 0);
    out[`units${side}`] = out.final && out.final.units ? matchDataNumberF9W1a(out.final.units[side], 0) : matchDataNumberF9W1a(players[side] && players[side].units, 0);
    out[`ene${side}`] = out.final && out.final.energy ? matchDataNumberF9W1a(out.final.energy[side], 0) : matchDataNumberF9W1a(players[side] && players[side].energy, 0);
  }
  return out;
}

function matchDataBuildCanonicalRecordF9W1a() {
  if (!state) return null;
  const playerIds = matchDataPlayerIdsF9W1a(state);
  const stats = typeof currentMatchStatsObject === "function" ? currentMatchStatsObject() : (state.matchStats ? matchDataCloneF9W1a(state.matchStats) : null);
  const statsPlayers = stats && stats.players ? stats.players : {};
  const participants = playerIds.map(side => matchDataParticipantFromStateF9W1a(side, statsPlayers));
  const winnerSide = state.winnerSide == null ? null : Number(state.winnerSide);
  const losers = winnerSide ? participants.filter(item => item.side !== winnerSide) : [];
  const finalPs = Object.fromEntries(participants.map(item => [item.side, item.final.ps]));
  const finalPressure = Object.fromEntries(participants.map(item => [item.side, item.final.pressure]));
  const finalEnergy = Object.fromEntries(participants.map(item => [item.side, item.final.energy]));
  const finalUnits = Object.fromEntries(participants.map(item => [item.side, item.final.units]));
  const mapDefinition = state.mapDefinition || null;
  const record = {
    schemaVersion: MATCH_RECORD_SCHEMA_VERSION_F9W1A,
    kind: "arena-rubra-match-record",
    matchId: state.matchId || `match-${Date.now()}`,
    recordedAt: new Date().toISOString(),
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    setup: {
      playerCount: playerIds.length,
      playerIds: [...playerIds],
      aiMode: state.aiMode || "advanced",
      pacePreset: state.pacePreset || "competitive",
      gameScaleMode: state.gameScaleMode || "tactical",
      matchSeed: state.matchSeed || "",
      firstPlayer: state.firstPlayer || null
    },
    map: {
      id: state.mapId || "map1_starter",
      name: mapDefinition && mapDefinition.name ? mapDefinition.name : "Starter MAP1",
      revision: mapDefinition && mapDefinition.metadata ? mapDefinition.metadata.revision || 1 : 1,
      schemaVersion: mapDefinition && mapDefinition.schemaVersion ? mapDefinition.schemaVersion : 1,
      cellCount: Array.isArray(state.cells) ? state.cells.length : 0,
      strategicPointCount: Array.isArray(state.cells) ? state.cells.filter(cell => cell && cell.ps).length : 0,
      terrainUsage: typeof mapTerrainUsage === "function" ? matchDataCloneF9W1a(mapTerrainUsage(mapDefinition)) : {},
      movementMultiplier: mapDefinition && Number.isFinite(mapDefinition.movementMultiplier) ? mapDefinition.movementMultiplier : 1
    },
    participants,
    outcome: {
      winnerSide,
      winnerFaction: winnerSide && state.factions ? state.factions[winnerSide] || "" : "Pareggio",
      loserSides: losers.map(item => item.side),
      loserFactions: losers.map(item => item.faction),
      winType: state.winType || "altro",
      round: matchDataNumberF9W1a(state.turn, 0),
      message: state.winner || ""
    },
    final: {
      ps: finalPs,
      pressure: finalPressure,
      energy: finalEnergy,
      units: finalUnits
    },
    summary: {
      eventCount: stats && Number.isFinite(stats.eventCount) ? stats.eventCount : (Array.isArray(state.events) ? state.events.length : matchDataNumberF9W1a(state.logSeq, 0)),
      eventSeqMax: stats && Number.isFinite(stats.eventSeqMax) ? stats.eventSeqMax : matchDataNumberF9W1a(state.eventSeq, 0),
      totals: stats && stats.totals ? matchDataCloneF9W1a(stats.totals) : {},
      topTactics: stats && stats.tactics ? Object.entries(stats.tactics).sort((a,b) => Number(b[1] || 0) - Number(a[1] || 0)).slice(0,8) : [],
      topAbilities: stats && stats.abilities ? Object.entries(stats.abilities).sort((a,b) => Number(b[1] || 0) - Number(a[1] || 0)).slice(0,8) : []
    },
    telemetryRef: null
  };
  const telemetry = typeof currentMatchTelemetrySnapshot === "function" ? currentMatchTelemetrySnapshot() : null;
  if (telemetry || state.aiTelemetry || state.f9n3Telemetry) {
    record.telemetryRef = {
      schemaVersion: MATCH_TELEMETRY_STORE_SCHEMA_VERSION_F9W1A,
      storageKey: MATCH_TELEMETRY_STORAGE_KEY_F9W1A,
      matchId: record.matchId,
      sourceSchemaVersion: telemetry && telemetry.schemaVersion ? telemetry.schemaVersion : null
    };
  }
  return matchDataApplyCompatibilityAliasesF9W1a(record);
}

function matchDataNormalizeLegacyRecordF9W1a(input) {
  if (!input || typeof input !== "object") return null;
  if (input.schemaVersion === MATCH_RECORD_SCHEMA_VERSION_F9W1A && Array.isArray(input.participants)) {
    const clone = matchDataCloneF9W1a(input);
    delete clone.matchTelemetry;
    delete clone.f9n3Telemetry;
    return matchDataApplyCompatibilityAliasesF9W1a(clone);
  }
  const playerIds = matchDataLegacyPlayerIdsF9W1a(input);
  const participants = playerIds.map(side => {
    const source = input.players && input.players[side] ? input.players[side] : {};
    const faction = source.faction || input[`p${side}Faction`] || "";
    const mode = source.mode || input[`p${side}Mode`] || "";
    const commanderName = source.commander || input[`p${side}Commander`] || "";
    const deck = input.selectedDecks && input.selectedDecks[side] ? matchDataCloneF9W1a(input.selectedDecks[side]) : { mode:"template" };
    const stats = matchDataCloneF9W1a(source);
    for (const key of ["faction","mode","commander","commanderId","eliminated","lifecycleStatus","eliminatedAtTurn","eliminatedBy","eliminationReason","eliminationAssistSides","eliminationAttributionType","ps","pressure","units","energy"]) delete stats[key];
    return {
      side,
      faction,
      mode,
      commanderId: source.commanderId || "",
      commanderName,
      deck,
      lifecycle: {
        status: source.lifecycleStatus || (source.eliminated ? "eliminated" : "active"),
        eliminated: Boolean(source.eliminated),
        eliminatedAtTurn: source.eliminatedAtTurn ?? null,
        eliminatedBy: source.eliminatedBy ?? null,
        eliminationReason: source.eliminationReason || null,
        eliminationAssistSides: Array.isArray(source.eliminationAssistSides) ? [...source.eliminationAssistSides] : [],
        eliminationAttributionType: source.eliminationAttributionType || null
      },
      final: {
        ps: matchDataNumberF9W1a(matchDataFinalValueF9W1a(input, "ps", side, source.ps || 0), 0),
        pressure: matchDataNumberF9W1a(matchDataFinalValueF9W1a(input, "pressure", side, source.pressure || 0), 0),
        units: matchDataNumberF9W1a(matchDataFinalValueF9W1a(input, "units", side, source.units || 0), 0),
        energy: matchDataNumberF9W1a(matchDataFinalValueF9W1a(input, "energy", side, source.energy || 0), 0)
      },
      stats
    };
  });
  const winnerSide = input.winnerSide == null ? null : Number(input.winnerSide);
  const record = {
    schemaVersion: MATCH_RECORD_SCHEMA_VERSION_F9W1A,
    kind: "arena-rubra-match-record",
    matchId: input.matchId || input.id || `legacy-${String(input.at || input.recordedAt || Date.now()).replace(/[^0-9A-Za-z]+/g, "-")}`,
    recordedAt: input.recordedAt || input.at || new Date().toISOString(),
    build: matchDataCloneF9W1a(input.build || {}),
    setup: {
      playerCount: participants.length,
      playerIds: participants.map(item => item.side),
      aiMode: input.aiMode || "advanced",
      pacePreset: input.pacePreset || "competitive",
      gameScaleMode: input.gameScaleMode || "tactical",
      matchSeed: input.matchSeed || "",
      firstPlayer: input.firstPlayer || null
    },
    map: {
      id: input.mapId || "map1_starter",
      name: input.mapName || (typeof input.map === "string" ? input.map : "Starter MAP1"),
      revision: input.mapRevision || 1,
      schemaVersion: input.mapSchemaVersion || 1,
      cellCount: input.mapCellCount || 0,
      strategicPointCount: input.strategicPointCount || 0,
      terrainUsage: matchDataCloneF9W1a(input.terrainUsage || {}),
      movementMultiplier: Number.isFinite(input.movementMultiplier) ? input.movementMultiplier : 1
    },
    participants,
    outcome: {
      winnerSide,
      winnerFaction: input.winnerFaction || (winnerSide && participants.find(item => item.side === winnerSide) ? participants.find(item => item.side === winnerSide).faction : "Pareggio"),
      loserSides: winnerSide ? participants.filter(item => item.side !== winnerSide).map(item => item.side) : [],
      loserFactions: Array.isArray(input.loserFactions) ? [...input.loserFactions] : (winnerSide ? participants.filter(item => item.side !== winnerSide).map(item => item.faction) : []),
      winType: input.winType || "altro",
      round: matchDataNumberF9W1a(input.round, 0),
      message: input.message || ""
    },
    final: {
      ps: Object.fromEntries(participants.map(item => [item.side, item.final.ps])),
      pressure: Object.fromEntries(participants.map(item => [item.side, item.final.pressure])),
      energy: Object.fromEntries(participants.map(item => [item.side, item.final.energy])),
      units: Object.fromEntries(participants.map(item => [item.side, item.final.units]))
    },
    summary: {
      eventCount: matchDataNumberF9W1a(input.eventCount, input.logLines || 0),
      eventSeqMax: matchDataNumberF9W1a(input.eventSeqMax, 0),
      totals: matchDataCloneF9W1a(input.totals || {}),
      topTactics: matchDataCloneF9W1a(input.topTactics || []),
      topAbilities: matchDataCloneF9W1a(input.topAbilities || [])
    },
    telemetryRef: (input.matchTelemetry || input.f9n3Telemetry)
      ? {
          schemaVersion: MATCH_TELEMETRY_STORE_SCHEMA_VERSION_F9W1A,
          storageKey: MATCH_TELEMETRY_STORAGE_KEY_F9W1A,
          matchId: input.matchId || input.id || "",
          sourceSchemaVersion: input.matchTelemetry && input.matchTelemetry.schemaVersion ? input.matchTelemetry.schemaVersion : null
        }
      : null
  };
  return matchDataApplyCompatibilityAliasesF9W1a(record);
}

function arenaStorageReadMatchTelemetryF9W1a() {
  const items = typeof arenaStorageReadJson === "function" ? arenaStorageReadJson(MATCH_TELEMETRY_STORAGE_KEY_F9W1A, []) : [];
  return Array.isArray(items) ? items : [];
}

function arenaStorageWriteMatchTelemetryF9W1a(items) {
  return typeof arenaStorageWriteJson === "function"
    ? arenaStorageWriteJson(MATCH_TELEMETRY_STORAGE_KEY_F9W1A, Array.isArray(items) ? items.slice(0, MATCH_DATA_LIMIT_F9W1A) : [])
    : false;
}

function arenaStorageAppendMatchTelemetryF9W1a(entry) {
  if (!entry || typeof entry !== "object" || !entry.matchId) return false;
  const items = arenaStorageReadMatchTelemetryF9W1a().filter(item => item && item.matchId !== entry.matchId);
  items.unshift(matchDataCloneF9W1a(entry));
  return arenaStorageWriteMatchTelemetryF9W1a(items);
}

function arenaStorageFindMatchTelemetryF9W1a(matchId) {
  const id = String(matchId || "");
  if (!id) return null;
  return arenaStorageReadMatchTelemetryF9W1a().find(item => item && String(item.matchId || "") === id) || null;
}

function matchDataBuildTelemetryEntryF9W1a(record) {
  if (!record || !record.matchId || typeof state === "undefined" || !state) return null;
  const payload = typeof currentMatchTelemetrySnapshot === "function" ? currentMatchTelemetrySnapshot() : null;
  const developerStats = typeof currentMatchStatsObject === "function" ? currentMatchStatsObject() : (state.matchStats ? matchDataCloneF9W1a(state.matchStats) : null);
  const attribution = typeof ffaAttributionSnapshot === "function" ? ffaAttributionSnapshot() : null;
  if (!payload && !developerStats && !state.aiTelemetry && !state.f9n3Telemetry && !attribution) return null;
  return {
    schemaVersion: MATCH_TELEMETRY_STORE_SCHEMA_VERSION_F9W1A,
    kind: "arena-rubra-match-telemetry",
    matchId: record.matchId,
    recordedAt: record.recordedAt,
    build: matchDataCloneF9W1a(record.build || {}),
    sourceSchemaVersion: payload && payload.schemaVersion ? payload.schemaVersion : null,
    payload: matchDataCloneF9W1a(payload),
    developerStats: matchDataCloneF9W1a(developerStats),
    aiTelemetry: matchDataCloneF9W1a(state.aiTelemetry || null),
    f9n3Telemetry: matchDataCloneF9W1a(state.f9n3Telemetry || null),
    attribution: matchDataCloneF9W1a(attribution)
  };
}

function arenaMatchDataMigrateLegacyHistoryF9W1a() {
  if (typeof arenaStorageReadJson !== "function" || typeof arenaStorageWriteJson !== "function") return { migrated:0, telemetryExtracted:0, total:0 };
  const raw = arenaStorageReadJson(MATCH_HISTORY_STORAGE_KEY_F9W1A, []);
  if (!Array.isArray(raw) || !raw.length) return { migrated:0, telemetryExtracted:0, total:0 };
  let migrated = 0;
  let telemetryExtracted = 0;
  const telemetryItems = arenaStorageReadMatchTelemetryF9W1a();
  const telemetryById = new Map(telemetryItems.filter(Boolean).map(item => [String(item.matchId || ""), item]));
  const normalized = raw.map(item => {
    const record = matchDataNormalizeLegacyRecordF9W1a(item);
    if (!record) return null;
    if (!item || item.schemaVersion !== MATCH_RECORD_SCHEMA_VERSION_F9W1A || !Array.isArray(item.participants) || item.matchTelemetry || item.f9n3Telemetry) migrated += 1;
    if (item && (item.matchTelemetry || item.f9n3Telemetry) && record.matchId && !telemetryById.has(String(record.matchId))) {
      const entry = {
        schemaVersion: MATCH_TELEMETRY_STORE_SCHEMA_VERSION_F9W1A,
        kind: "arena-rubra-match-telemetry",
        matchId: record.matchId,
        recordedAt: record.recordedAt,
        build: matchDataCloneF9W1a(record.build || {}),
        sourceSchemaVersion: item.matchTelemetry && item.matchTelemetry.schemaVersion ? item.matchTelemetry.schemaVersion : null,
        payload: matchDataCloneF9W1a(item.matchTelemetry || null),
        developerStats: {
          totals: matchDataCloneF9W1a(item.totals || {}),
          players: matchDataCloneF9W1a(item.players || {}),
          eliminationTimeline: matchDataCloneF9W1a(item.eliminationTimeline || []),
          pressureTimeline: matchDataCloneF9W1a(item.pressureTimeline || []),
          topTactics: matchDataCloneF9W1a(item.topTactics || []),
          topAbilities: matchDataCloneF9W1a(item.topAbilities || [])
        },
        aiTelemetry: null,
        f9n3Telemetry: matchDataCloneF9W1a(item.f9n3Telemetry || null),
        attribution: matchDataCloneF9W1a(item.attribution || null)
      };
      telemetryById.set(String(record.matchId), entry);
      telemetryExtracted += 1;
    }
    return record;
  }).filter(Boolean);
  if (migrated > 0) arenaStorageWriteJson(MATCH_HISTORY_STORAGE_KEY_F9W1A, normalized.slice(0, MATCH_DATA_LIMIT_F9W1A));
  if (telemetryExtracted > 0) arenaStorageWriteMatchTelemetryF9W1a(Array.from(telemetryById.values()).sort((a,b) => String(b.recordedAt || "").localeCompare(String(a.recordedAt || ""))));
  return { migrated, telemetryExtracted, total:normalized.length };
}

function matchDataRecordLabelF9W1a(record) {
  const participants = Array.isArray(record && record.participants) ? record.participants : [];
  return participants.map(item => `G${item.side} ${item.faction}${item.mode ? ` (${item.mode})` : ""}`).join(" · ");
}

function matchDataCompactStatsRecordF9W1a(record) {
  const compact = matchDataCloneF9W1a(record);
  if (!compact) return null;
  delete compact.telemetryRef;
  if (compact.participants) compact.participants = compact.participants.map(item => ({
    side:item.side, faction:item.faction, mode:item.mode, commanderId:item.commanderId, commanderName:item.commanderName,
    deck:matchDataCloneF9W1a(item.deck || {}), lifecycle:matchDataCloneF9W1a(item.lifecycle || {}), final:matchDataCloneF9W1a(item.final || {}), stats:matchDataCloneF9W1a(item.stats || {})
  }));
  return matchDataApplyCompatibilityAliasesF9W1a(compact);
}

// Override storage/history readers after storage.js has loaded.
globalThis.arenaStorageReadMatchHistory = function arenaStorageReadMatchHistoryF9W1a() {
  const items = typeof arenaStorageReadJson === "function" ? arenaStorageReadJson(MATCH_HISTORY_STORAGE_KEY_F9W1A, []) : [];
  return Array.isArray(items) ? items.map(matchDataNormalizeLegacyRecordF9W1a).filter(Boolean) : [];
};

globalThis.arenaStorageWriteMatchHistory = function arenaStorageWriteMatchHistoryF9W1a(items) {
  const safe = Array.isArray(items) ? items.map(matchDataNormalizeLegacyRecordF9W1a).filter(Boolean).slice(0, MATCH_DATA_LIMIT_F9W1A) : [];
  return typeof arenaStorageWriteJson === "function" ? arenaStorageWriteJson(MATCH_HISTORY_STORAGE_KEY_F9W1A, safe) : false;
};

globalThis.arenaStorageAppendMatchHistory = function arenaStorageAppendMatchHistoryF9W1a(record, limit = MATCH_DATA_LIMIT_F9W1A) {
  const normalized = matchDataNormalizeLegacyRecordF9W1a(record);
  if (!normalized) return false;
  const items = globalThis.arenaStorageReadMatchHistory();
  const id = normalized.matchId || normalized.id || "";
  const filtered = id ? items.filter(item => (item && (item.matchId || item.id)) !== id) : items;
  filtered.unshift(normalized);
  return globalThis.arenaStorageWriteMatchHistory(filtered.slice(0, Math.max(1, Number(limit) || MATCH_DATA_LIMIT_F9W1A)));
};

globalThis.arenaStorageMatchHistoryEnvelope = function arenaStorageMatchHistoryEnvelopeF9W1a() {
  return {
    schemaVersion: typeof ARENA_STORAGE_SCHEMA_VERSION !== "undefined" ? ARENA_STORAGE_SCHEMA_VERSION : "F9P1-1",
    recordSchemaVersion: MATCH_RECORD_SCHEMA_VERSION_F9W1A,
    telemetrySchemaVersion: MATCH_TELEMETRY_STORE_SCHEMA_VERSION_F9W1A,
    kind: "arena-rubra-match-history",
    exportedAt: new Date().toISOString(),
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    storageKey: MATCH_HISTORY_STORAGE_KEY_F9W1A,
    telemetryStorageKey: MATCH_TELEMETRY_STORAGE_KEY_F9W1A,
    matches: globalThis.arenaStorageReadMatchHistory()
  };
};

// Authoritative Match Data 2.0 writer. Tutorial/Challenge and Match Lab remain excluded.
globalThis.recordMatchResult = function recordMatchResultF9W1a() {
  if (!state || state.matchRecorded) return;
  if (state.tutorialMode === true || state.mapLabMode === true) {
    state.matchRecorded = true;
    if (typeof log === "function") log(
      state.mapLabMode ? "Partita Match Lab esclusa da statistiche competitive e storico." : "Partita tutorial esclusa da statistiche e storico.",
      EventTypes.LOG_MESSAGE,
      {
        source: state.mapLabMode ? "F9Q3-map-lab-stats-exclusion" : "F9O6-tutorial-stats-exclusion",
        tutorialScenarioId: state.tutorialScenarioId || null,
        mapId: state.mapId || null,
        matchRecordSchemaVersion: MATCH_RECORD_SCHEMA_VERSION_F9W1A
      }
    );
    return;
  }
  state.matchRecorded = true;
  if (typeof updateControlFromOccupants === "function") updateControlFromOccupants();
  const record = matchDataBuildCanonicalRecordF9W1a();
  if (!record) return;
  const telemetryEntry = matchDataBuildTelemetryEntryF9W1a(record);
  if (telemetryEntry) arenaStorageAppendMatchTelemetryF9W1a(telemetryEntry);
  const compact = matchDataCompactStatsRecordF9W1a(record);
  if (typeof loadMatchStats === "function" && typeof saveMatchStats === "function") {
    const statsItems = loadMatchStats();
    const filteredStats = Array.isArray(statsItems) ? statsItems.filter(item => (item && (item.matchId || item.id)) !== record.matchId) : [];
    filteredStats.unshift(compact);
    saveMatchStats(filteredStats.slice(0, MATCH_DATA_LIMIT_F9W1A));
  }
  globalThis.arenaStorageAppendMatchHistory(record, MATCH_DATA_LIMIT_F9W1A);
  if (typeof log === "function") log(
    `MatchRecord 2.0 registrato: ${matchDataRecordLabelF9W1a(record)} · vincitore ${record.winnerFaction || "Pareggio"} · round ${record.round}.`,
    EventTypes.MATCH_STATS_RECORDED,
    {
      matchId: record.matchId,
      matchRecordSchemaVersion: MATCH_RECORD_SCHEMA_VERSION_F9W1A,
      telemetrySchemaVersion: telemetryEntry ? MATCH_TELEMETRY_STORE_SCHEMA_VERSION_F9W1A : null,
      playerIds: [...record.playerIds],
      playerCount: record.playerCount,
      mapId: record.mapId,
      winnerSide: record.winnerSide,
      winnerFaction: record.winnerFaction,
      winType: record.winType,
      round: record.round
    }
  );
};

// Control Center: history/statistics N-player e telemetria risolta dallo store separato.
globalThis.controlCenterTelemetrySchema = function controlCenterTelemetrySchemaF9W1a() {
  try {
    if (typeof state !== "undefined" && state && state.matchTelemetry && state.matchTelemetry.schemaVersion) return String(state.matchTelemetry.schemaVersion);
    const history = globalThis.arenaStorageReadMatchHistory ? globalThis.arenaStorageReadMatchHistory() : [];
    const latest = history[0];
    const entry = latest ? arenaStorageFindMatchTelemetryF9W1a(latest.matchId || latest.id) : null;
    if (entry && entry.payload && entry.payload.schemaVersion) return String(entry.payload.schemaVersion);
    if (entry && entry.sourceSchemaVersion) return String(entry.sourceSchemaVersion);
  } catch (_) {}
  return typeof MATCH_TELEMETRY_SCHEMA_VERSION !== "undefined" ? MATCH_TELEMETRY_SCHEMA_VERSION : "F9Q3e1-2";
};

globalThis.controlCenterTelemetrySource = function controlCenterTelemetrySourceF9W1a() {
  try {
    if (typeof state !== "undefined" && state && state.matchTelemetry) {
      const snapshot = typeof currentMatchTelemetrySnapshot === "function" ? currentMatchTelemetrySnapshot() : matchDataCloneF9W1a(state.matchTelemetry);
      return { source:"Partita attiva", telemetry:snapshot, record:null };
    }
    const history = globalThis.arenaStorageReadMatchHistory ? globalThis.arenaStorageReadMatchHistory() : [];
    const latest = history[0] || null;
    const entry = latest ? arenaStorageFindMatchTelemetryF9W1a(latest.matchId || latest.id) : null;
    if (entry && entry.payload) return { source:"Ultimo match registrato", telemetry:matchDataCloneF9W1a(entry.payload), record:latest, telemetryRecord:entry };
  } catch (_) {}
  return { source:"Nessuna fonte", telemetry:null, record:null };
};

globalThis.controlCenterHistoryHtml = function controlCenterHistoryHtmlF9W1a() {
  const items = globalThis.arenaStorageReadMatchHistory ? globalThis.arenaStorageReadMatchHistory() : [];
  const safeItems = Array.isArray(items) ? items : [];
  const esc = typeof controlCenterEscape === "function" ? controlCenterEscape : value => String(value == null ? "" : value);
  const fmtDate = typeof controlCenterFormatDate === "function" ? controlCenterFormatDate : value => String(value || "").slice(0, 16).replace("T", " ");
  const rows = safeItems.slice(0, 30).map(item => {
    const participants = Array.isArray(item.participants) ? item.participants : [];
    const playerLabel = participants.length ? participants.map(p => `G${p.side} ${p.faction}`).join(" · ") : [item.p1Faction, item.p2Faction].filter(Boolean).join(" vs ");
    const modes = participants.length ? participants.map(p => `G${p.side}:${p.mode || "—"}`).join(" · ") : [item.p1Mode, item.p2Mode].filter(Boolean).join(" · ");
    return `<tr>
      <td>${fmtDate(item.recordedAt || item.at)}</td>
      <td>${esc(playerLabel || "—")}</td>
      <td>${esc(modes || "—")}</td>
      <td>${esc(item.winnerFaction || "—")}</td>
      <td>${esc(item.winType || "—")}</td>
      <td>${Number(item.round || 0)}</td>
      <td>${esc(item.mapName || item.mapId || "—")}</td>
    </tr>`;
  }).join("");
  const latest = safeItems[0];
  const metric = typeof controlCenterMetricCard === "function"
    ? controlCenterMetricCard
    : (label, value, meta) => `<article><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(meta)}</span></article>`;
  return `
    <div class="controlCenterPanelLead">
      <div><strong>Storico partite · MatchRecord 2.0</strong><p>Archivio canonico N-player. La telemetria tecnica è conservata separatamente e collegata tramite matchId.</p></div>
      <div class="controlCenterInlineActions">
        <button class="ghost" type="button" data-control-center-action="copy-history">Copia JSON</button>
        <button class="primary" type="button" data-control-center-action="download-history">Esporta JSON</button>
      </div>
    </div>
    <div class="controlCenterMiniMetrics">
      ${metric("Record", safeItems.length, "MatchRecord canonici")}
      ${metric("Ultimo match", latest ? fmtDate(latest.recordedAt || latest.at) : "—", latest ? `${latest.playerCount || 2} giocatori · ${latest.winnerFaction || "Pareggio"}` : "Nessun dato")}
      ${metric("Schema", MATCH_RECORD_SCHEMA_VERSION_F9W1A, `Telemetry ${MATCH_TELEMETRY_STORE_SCHEMA_VERSION_F9W1A}`)}
    </div>
    <div class="controlCenterTableWrap"><table class="controlCenterTable">
      <thead><tr><th>Data</th><th>Partecipanti</th><th>Controllo</th><th>Vincitore</th><th>Esito</th><th>Round</th><th>Mappa</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="7">Nessuna partita nello storico.</td></tr>`}</tbody>
    </table></div>`;
};

globalThis.controlCenterStatisticsHtml = function controlCenterStatisticsHtmlF9W1a() {
  const items = globalThis.arenaStorageReadMatchHistory ? globalThis.arenaStorageReadMatchHistory() : [];
  const safeItems = Array.isArray(items) ? items : [];
  const esc = typeof controlCenterEscape === "function" ? controlCenterEscape : value => String(value == null ? "" : value);
  const fmtDate = typeof controlCenterFormatDate === "function" ? controlCenterFormatDate : value => String(value || "").slice(0, 16).replace("T", " ");
  const wins = {};
  let roundTotal = 0;
  safeItems.forEach(item => {
    const winner = item && item.winnerFaction ? String(item.winnerFaction) : "Pareggio";
    wins[winner] = (wins[winner] || 0) + 1;
    roundTotal += Number(item && item.round || 0);
  });
  const leaders = Object.entries(wins).sort((a,b) => b[1] - a[1]);
  const average = safeItems.length ? (roundTotal / safeItems.length).toFixed(1) : "—";
  const rows = safeItems.slice(0, 20).map(item => {
    const participants = Array.isArray(item.participants) ? item.participants : [];
    const label = participants.length ? participants.map(p => `G${p.side} ${p.faction}`).join(" · ") : [item.p1Faction, item.p2Faction].filter(Boolean).join(" vs ");
    return `<tr>
      <td>${fmtDate(item.recordedAt || item.at)}</td>
      <td>${esc(label || "—")}</td>
      <td>${Number(item.playerCount || participants.length || 2)}</td>
      <td>${esc(item.winnerFaction || "—")}</td>
      <td>${esc(item.winType || "—")}</td>
      <td>${Number(item.round || 0)}</td>
      <td>${esc(item.mapName || item.mapId || "—")}</td>
    </tr>`;
  }).join("");
  const metric = typeof controlCenterMetricCard === "function"
    ? controlCenterMetricCard
    : (label, value, meta) => `<article><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(meta)}</span></article>`;
  return `
    <div class="controlCenterPanelLead">
      <div><strong>Statistiche MatchRecord 2.0</strong><p>Vista sintetica N-player derivata dallo storico canonico; nessun payload telemetrico viene letto per queste statistiche.</p></div>
      <div class="controlCenterInlineActions">
        <button class="ghost" type="button" data-control-center-action="copy-stats">Copia JSON</button>
        <button class="primary" type="button" data-control-center-action="download-stats">Esporta JSON</button>
      </div>
    </div>
    <div class="controlCenterMiniMetrics">
      ${metric("Partite", safeItems.length, "Record canonici")}
      ${metric("Round medi", average, "Tutti i formati 2P/3P/4P")}
      ${metric("Più vittorie", leaders[0] ? `${leaders[0][0]} · ${leaders[0][1]}` : "—", leaders.length ? `${leaders.length} esiti distinti` : "Nessun dato")}
    </div>
    <div class="controlCenterTableWrap"><table class="controlCenterTable">
      <thead><tr><th>Data</th><th>Partecipanti</th><th>G</th><th>Vincitore</th><th>Esito</th><th>Round</th><th>Mappa</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="7">Nessuna statistica registrata.</td></tr>`}</tbody>
    </table></div>`;
};

// Export canonici: la UI esistente continua a chiamare questi nomi globali.
globalThis.arenaStorageExportMatchHistoryJson = function arenaStorageExportMatchHistoryJsonF9W1a() {
  return JSON.stringify(globalThis.arenaStorageMatchHistoryEnvelope(), null, 2);
};

globalThis.currentPersistentMatchHistoryJson = function currentPersistentMatchHistoryJsonF9W1a() {
  return globalThis.arenaStorageExportMatchHistoryJson();
};

globalThis.controlCenterStatsEnvelope = function controlCenterStatsEnvelopeF9W1a() {
  return {
    kind: "arena-rubra-match-statistics",
    schemaVersion: MATCH_RECORD_SCHEMA_VERSION_F9W1A,
    exportedAt: new Date().toISOString(),
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    source: "canonical-match-history",
    records: globalThis.arenaStorageReadMatchHistory()
  };
};

// CSV leggibile anche per 3P/4P: una riga per match, partecipanti serializzati senza perdere giocatori.
globalThis.statsToCsv = function statsToCsvF9W1a() {
  const records = globalThis.arenaStorageReadMatchHistory ? globalThis.arenaStorageReadMatchHistory() : [];
  const fields = ["recordedAt","matchId","playerCount","participants","modes","winnerFaction","winnerSide","winType","round","mapId","mapName","pacePreset","aiMode","gameScaleMode","buildVersion"];
  const esc = value => `"${String(value == null ? "" : value).replace(/"/g, '""')}"`;
  const rows = records.map(record => {
    const participants = Array.isArray(record.participants) ? record.participants : [];
    const values = {
      recordedAt:record.recordedAt || record.at || "",
      matchId:record.matchId || record.id || "",
      playerCount:record.playerCount || participants.length || 0,
      participants:participants.map(item => `G${item.side}:${item.faction}`).join(" | "),
      modes:participants.map(item => `G${item.side}:${item.mode || ""}`).join(" | "),
      winnerFaction:record.winnerFaction || "",
      winnerSide:record.winnerSide == null ? "" : record.winnerSide,
      winType:record.winType || "",
      round:record.round || 0,
      mapId:record.mapId || "",
      mapName:record.mapName || "",
      pacePreset:record.pacePreset || "",
      aiMode:record.aiMode || "",
      gameScaleMode:record.gameScaleMode || "",
      buildVersion:record.build && record.build.version ? record.build.version : ""
    };
    return fields.map(field => esc(values[field])).join(",");
  });
  return [fields.join(","), ...rows].join("\n");
};

// Pannello in-game compatibile N-player. Mantiene gli stessi due host DOM del renderer storico.
globalThis.renderMatchupStats = function renderMatchupStatsF9W1a() {
  if (typeof document === "undefined") return;
  const panel = document.getElementById("matchupStatsPanel");
  const recent = document.getElementById("recentStatsPanel");
  if (!panel || !recent) return;
  const records = globalThis.arenaStorageReadMatchHistory ? globalThis.arenaStorageReadMatchHistory() : [];
  const esc = typeof escapeHtml === "function" ? escapeHtml : value => String(value == null ? "" : value);
  if (!records.length) {
    panel.innerHTML = `<div class="help">Nessuna partita registrata. Il registro si aggiorna automaticamente a fine match.</div>`;
    recent.innerHTML = "";
    return;
  }
  const average = (records.reduce((sum, item) => sum + Number(item.round || 0), 0) / records.length).toFixed(1);
  const formatCounts = records.reduce((acc, item) => {
    const count = Number(item.playerCount || (item.participants || []).length || 2);
    acc[count] = (acc[count] || 0) + 1;
    return acc;
  }, {});
  const formats = Object.entries(formatCounts).sort((a,b) => Number(a[0]) - Number(b[0])).map(([count, total]) => `${count}P ${total}`).join(" · ");
  panel.innerHTML = `
    <div class="statGrid">
      <div class="statTile"><strong>${records.length}</strong><span>partite registrate</span></div>
      <div class="statTile"><strong>${average}</strong><span>round medio</span></div>
      <div class="statTile"><strong>${esc(formats)}</strong><span>formati</span></div>
    </div>`;
  recent.innerHTML = `<div class="miniTable"><table>
    <thead><tr><th>Ultime partite</th><th>Vincitore</th><th>Tipo</th><th>Round</th><th>Mappa</th></tr></thead>
    <tbody>${records.slice(0,8).map(record => {
      const participants = Array.isArray(record.participants) ? record.participants : [];
      const label = participants.length ? participants.map(item => `G${item.side} ${item.faction}`).join(" · ") : [record.p1Faction,record.p2Faction].filter(Boolean).join(" vs ");
      return `<tr><td>${esc(label)}</td><td>${esc(record.winnerFaction || "Pareggio")}</td><td>${esc(record.winType || "—")}</td><td>${Number(record.round || 0)}</td><td>${esc(record.mapName || record.mapId || "—")}</td></tr>`;
    }).join("")}</tbody>
  </table></div>`;
};

// Conserva la telemetria separata anche nei backup del Control Center.
globalThis.controlCenterKnownStorageKeys = function controlCenterKnownStorageKeysF9W1a() {
  let keys = [];
  if (typeof ARENA_DATA_PATHS !== "undefined" && ARENA_DATA_PATHS) keys = Object.keys(ARENA_DATA_PATHS);
  else if (typeof ARENA_STORAGE_KEYS !== "undefined" && ARENA_STORAGE_KEYS) keys = Object.values(ARENA_STORAGE_KEYS);
  else keys = [
    "arenaRubra.customCards.v1",
    "arenaRubraF9H3SavedDecksV1",
    "arenaRubra.maps.v1",
    "arenaRubra.matchupStats.v1",
    MATCH_HISTORY_STORAGE_KEY_F9W1A,
    "arenaRubra.settings.v1"
  ];
  if (!keys.includes(MATCH_TELEMETRY_STORAGE_KEY_F9W1A)) keys.push(MATCH_TELEMETRY_STORAGE_KEY_F9W1A);
  return keys;
};

// F9W1a END

// =====================================================
// F9W2a — Player / DEV Runtime Profile Foundation
// Un solo runtime, due profili di esposizione. Gli strumenti DEV restano nel
// codice e nel vault ma vengono nascosti/guardati nel profilo Distribution.
// Il profilo pubblico futuro potrà bloccare lo switch via BUILD_INFO senza
// creare una seconda codebase.
// =====================================================

const ARENA_PRODUCT_PROFILE_SCHEMA_F9W2A = "F9W2a-1";
const ARENA_PRODUCT_PROFILE_SETTINGS_KEY_F9W2A = "productProfile";
const ARENA_PRODUCT_PROFILES_F9W2A = Object.freeze({
  DEV:"dev",
  DISTRIBUTION:"distribution"
});

const ARENA_PRODUCT_PROFILE_CAPABILITIES_F9W2A = Object.freeze({
  play:Object.freeze(["dev","distribution"]),
  tutorial:Object.freeze(["dev","distribution"]),
  deckBuilder:Object.freeze(["dev","distribution"]),
  cardPool:Object.freeze(["dev","distribution"]),
  playerStatistics:Object.freeze(["dev","distribution"]),
  playerHistory:Object.freeze(["dev","distribution"]),
  settings:Object.freeze(["dev","distribution"]),
  version:Object.freeze(["dev","distribution"]),
  cardEditor:Object.freeze(["dev"]),
  mapEditor:Object.freeze(["dev"]),
  rawTelemetry:Object.freeze(["dev"]),
  rawLog:Object.freeze(["dev"]),
  debug:Object.freeze(["dev"]),
  calibration:Object.freeze(["dev"]),
  expertAi:Object.freeze(["dev"]),
  fullVaultTransfer:Object.freeze(["dev"]),
  customMaps:Object.freeze(["dev"])
});

const arenaProductProfileStateF9W2a = {
  sessionOverride:null,
  mutationObserver:null,
  applyScheduled:false,
  installed:false,
  initialized:false,
  originalFunctions:{},
  lastApplied:null
};

function arenaProductProfileNormalizeF9W2a(value, fallback="dev") {
  const text = String(value || "").trim().toLowerCase();
  if (["distribution","demo","player","public"].includes(text)) return ARENA_PRODUCT_PROFILES_F9W2A.DISTRIBUTION;
  if (["dev","developer","development"].includes(text)) return ARENA_PRODUCT_PROFILES_F9W2A.DEV;
  return fallback === ARENA_PRODUCT_PROFILES_F9W2A.DISTRIBUTION ? ARENA_PRODUCT_PROFILES_F9W2A.DISTRIBUTION : ARENA_PRODUCT_PROFILES_F9W2A.DEV;
}

function arenaProductProfileParseF9W2a(value) {
  const text = String(value || "").trim().toLowerCase();
  if (["distribution","demo","player","public"].includes(text)) return ARENA_PRODUCT_PROFILES_F9W2A.DISTRIBUTION;
  if (["dev","developer","development"].includes(text)) return ARENA_PRODUCT_PROFILES_F9W2A.DEV;
  return null;
}

function arenaProductProfileBuildDefaultF9W2a() {
  try {
    const configured = typeof BUILD_INFO !== "undefined" && BUILD_INFO ? BUILD_INFO.productProfileDefault : null;
    return arenaProductProfileNormalizeF9W2a(configured, ARENA_PRODUCT_PROFILES_F9W2A.DEV);
  } catch (_) {
    return ARENA_PRODUCT_PROFILES_F9W2A.DEV;
  }
}

function arenaProductProfileSwitchableF9W2a() {
  try {
    if (typeof BUILD_INFO !== "undefined" && BUILD_INFO && BUILD_INFO.productProfileSwitchable === false) return false;
  } catch (_) {}
  return true;
}

function arenaProductProfileReadSettingsF9W2a() {
  try {
    const settings = typeof arenaStorageReadSettings === "function" ? arenaStorageReadSettings() : {};
    return settings && typeof settings === "object" && !Array.isArray(settings) ? settings : {};
  } catch (_) {
    return {};
  }
}

function arenaProductProfileQueryOverrideF9W2a() {
  if (!arenaProductProfileSwitchableF9W2a()) return null;
  try {
    if (typeof window === "undefined" || !window.location) return null;
    const params = new URLSearchParams(window.location.search || "");
    const raw = params.get("profile");
    if (!raw) return null;
    return arenaProductProfileParseF9W2a(raw);
  } catch (_) {
    return null;
  }
}

function arenaProductProfileStoredF9W2a() {
  if (!arenaProductProfileSwitchableF9W2a()) return null;
  const settings = arenaProductProfileReadSettingsF9W2a();
  const cfg = settings[ARENA_PRODUCT_PROFILE_SETTINGS_KEY_F9W2A];
  if (cfg && typeof cfg === "object" && cfg.profile) return arenaProductProfileParseF9W2a(cfg.profile);

  // Migrazione compatibile dal vecchio toggle F9U3.
  const legacy = settings.controlCenter;
  if (legacy && typeof legacy === "object" && typeof legacy.developerMode === "boolean") {
    return legacy.developerMode ? ARENA_PRODUCT_PROFILES_F9W2A.DEV : ARENA_PRODUCT_PROFILES_F9W2A.DISTRIBUTION;
  }
  return null;
}

function arenaProductProfileCurrentF9W2a() {
  const buildDefault = arenaProductProfileBuildDefaultF9W2a();
  if (!arenaProductProfileSwitchableF9W2a()) return buildDefault;
  if (arenaProductProfileStateF9W2a.sessionOverride) return arenaProductProfileStateF9W2a.sessionOverride;
  const query = arenaProductProfileQueryOverrideF9W2a();
  if (query) return query;
  return arenaProductProfileStoredF9W2a() || buildDefault;
}

function arenaProductProfileIsDevF9W2a() {
  return arenaProductProfileCurrentF9W2a() === ARENA_PRODUCT_PROFILES_F9W2A.DEV;
}

function arenaProductProfileAllowsF9W2a(capability, profile=arenaProductProfileCurrentF9W2a()) {
  const allowed = ARENA_PRODUCT_PROFILE_CAPABILITIES_F9W2A[String(capability || "")];
  if (!allowed) return false;
  return allowed.includes(arenaProductProfileNormalizeF9W2a(profile, arenaProductProfileBuildDefaultF9W2a()));
}

function arenaProductProfilePersistF9W2a(profile) {
  if (typeof arenaStorageWriteSettings !== "function") return false;
  try {
    const settings = arenaProductProfileReadSettingsF9W2a();
    const next = { ...settings };
    next[ARENA_PRODUCT_PROFILE_SETTINGS_KEY_F9W2A] = {
      schemaVersion:ARENA_PRODUCT_PROFILE_SCHEMA_F9W2A,
      profile,
      updatedAt:new Date().toISOString()
    };
    // Compatibilità con il Control Center F9U3 finché il vecchio campo esiste.
    next.controlCenter = {
      ...(next.controlCenter && typeof next.controlCenter === "object" ? next.controlCenter : {}),
      developerMode:profile === ARENA_PRODUCT_PROFILES_F9W2A.DEV
    };
    return Boolean(arenaStorageWriteSettings(next));
  } catch (_) {
    return false;
  }
}

function arenaProductProfileSetF9W2a(profile, options={}) {
  const buildDefault = arenaProductProfileBuildDefaultF9W2a();
  const requested = arenaProductProfileNormalizeF9W2a(profile, buildDefault);
  const next = arenaProductProfileSwitchableF9W2a() ? requested : buildDefault;
  arenaProductProfileStateF9W2a.sessionOverride = next;
  if (options.persist !== false && arenaProductProfileSwitchableF9W2a()) arenaProductProfilePersistF9W2a(next);
  arenaProductProfileApplyDomF9W2a();
  // Ricostruisce il selector mappe quando si cambia profilo: Distribution filtra
  // le custom, DEV le ripristina senza richiedere un reload.
  if (typeof refreshSetupMapSelector === "function") {
    try { refreshSetupMapSelector(); } catch (_) {}
  }
  if (next === ARENA_PRODUCT_PROFILES_F9W2A.DEV && typeof rendererCalibrationInjectButtons === "function") {
    try { rendererCalibrationInjectButtons(); } catch (_) {}
  }
  return next;
}

function arenaProductProfilePanelAllowedF9W2a(panelKey) {
  const key = String(panelKey || "");
  if (key === "telemetry") return arenaProductProfileAllowsF9W2a("rawTelemetry");
  if (key === "log") return arenaProductProfileAllowsF9W2a("rawLog");
  if (key === "debug") return arenaProductProfileAllowsF9W2a("debug");
  if (key === "transfer") return arenaProductProfileAllowsF9W2a("fullVaultTransfer");
  return true;
}

function arenaProductProfileGuardScreenF9W2a(screen) {
  const key = String(screen || "");
  if (key === "cardEditor" && !arenaProductProfileAllowsF9W2a("cardEditor")) return "mainMenu";
  if (key === "mapEditor" && !arenaProductProfileAllowsF9W2a("mapEditor")) return "mainMenu";
  if (key === "layoutLab" && !arenaProductProfileAllowsF9W2a("calibration")) return "mainMenu";
  return key;
}

function arenaProductProfileSetElementVisibleF9W2a(element, visible, options={}) {
  if (!element) return;
  const isOption = String(element.tagName || "").toUpperCase() === "OPTION";
  const shouldDisable = options.disable === true || isOption;
  if (!visible) {
    if (element.dataset && element.dataset.f9w2aProfileHidden !== "1") {
      element.dataset.f9w2aProfileHidden = "1";
      element.dataset.f9w2aPreviousHidden = element.hidden ? "1" : "0";
      if (shouldDisable) element.dataset.f9w2aPreviousDisabled = element.disabled ? "1" : "0";
    }
    element.hidden = true;
    if (!isOption && typeof element.setAttribute === "function") element.setAttribute("aria-hidden", "true");
    if (shouldDisable) element.disabled = true;
    return;
  }

  if (element.dataset && element.dataset.f9w2aProfileHidden === "1") {
    element.hidden = element.dataset.f9w2aPreviousHidden === "1";
    if (shouldDisable) element.disabled = element.dataset.f9w2aPreviousDisabled === "1";
    delete element.dataset.f9w2aProfileHidden;
    delete element.dataset.f9w2aPreviousHidden;
    delete element.dataset.f9w2aPreviousDisabled;
  }
  if (!isOption && typeof element.setAttribute === "function" && !element.hidden) element.setAttribute("aria-hidden", "false");
}

function arenaProductProfileSetTextF9W2a(element, value) {
  if (!element) return;
  const text = String(value == null ? "" : value);
  if (element.textContent !== text) element.textContent = text;
}

function arenaProductProfileApplySelectorF9W2a(selector, visible, options={}) {
  if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") return;
  document.querySelectorAll(selector).forEach(element => arenaProductProfileSetElementVisibleF9W2a(element, visible, options));
}

function arenaProductProfileEnsureChipF9W2a(profile) {
  if (typeof document === "undefined") return;
  const host = document.querySelector(".mainMenuHeroStatus");
  if (!host) return;
  let chip = document.getElementById("arenaProductProfileChipF9W2a");
  if (!chip) {
    chip = document.createElement("span");
    chip.id = "arenaProductProfileChipF9W2a";
    chip.className = "mainMenuBuildChip";
    host.appendChild(chip);
  }
  arenaProductProfileSetTextF9W2a(chip, profile === ARENA_PRODUCT_PROFILES_F9W2A.DEV ? "Profilo DEV" : "Demo / Distribution");
  chip.title = profile === ARENA_PRODUCT_PROFILES_F9W2A.DEV
    ? "Runtime completo con editor, telemetria, debug e laboratori."
    : "Profilo Player: strumenti di sviluppo nascosti, runtime di gioco invariato.";
}

function arenaProductProfileUpdateSettingsCopyF9W2a(profile) {
  if (typeof document === "undefined") return;
  const checkbox = document.getElementById("controlCenterDeveloperModeToggle");
  if (!checkbox) return;
  checkbox.checked = profile === ARENA_PRODUCT_PROFILES_F9W2A.DEV;
  checkbox.disabled = !arenaProductProfileSwitchableF9W2a();
  const section = checkbox.closest ? checkbox.closest("section") : null;
  if (!section) return;
  arenaProductProfileSetElementVisibleF9W2a(section, arenaProductProfileSwitchableF9W2a() || profile === ARENA_PRODUCT_PROFILES_F9W2A.DEV);
  const heading = section.querySelector("h3");
  if (heading) arenaProductProfileSetTextF9W2a(heading, "Profilo prodotto");
  const span = checkbox.parentElement && checkbox.parentElement.querySelector("span");
  if (span) arenaProductProfileSetTextF9W2a(span, arenaProductProfileSwitchableF9W2a()
    ? "Profilo DEV (disattiva per simulare Demo / Distribution)"
    : (profile === ARENA_PRODUCT_PROFILES_F9W2A.DEV ? "Profilo DEV" : "Demo / Distribution"));
  const paragraph = section.querySelector("p");
  if (paragraph) arenaProductProfileSetTextF9W2a(paragraph, arenaProductProfileSwitchableF9W2a()
    ? "Un solo runtime: DEV espone editor, telemetria, debug, Expert e calibratori; Distribution conserva solo le funzioni Player."
    : "Profilo fissato dalla build: gli strumenti DEV restano nel codice ma non sono esposti al giocatore.");
}

function arenaProductProfileUpdateMenuCopyF9W2a(profile) {
  if (typeof document === "undefined") return;
  const distribution = profile === ARENA_PRODUCT_PROFILES_F9W2A.DISTRIBUTION;
  const cardsText = document.querySelector(".controlCenterAreaCards .mainMenuSectionHeading p");
  arenaProductProfileSetTextF9W2a(cardsText, distribution
    ? "Costruisci i mazzi e consulta il catalogo delle carte disponibili."
    : "Costruisci i mazzi, consulta il catalogo e crea carte custom senza alterare i contenuti ufficiali.");
  const mapsText = document.querySelector(".controlCenterAreaMaps .mainMenuSectionHeading p");
  arenaProductProfileSetTextF9W2a(mapsText, distribution
    ? "Consulta e usa i campi di battaglia ufficiali disponibili."
    : "Consulta mappe ufficiali e custom oppure apri l’editor tecnico con validazione live.");
  const analysisText = document.querySelector(".controlCenterAreaAnalysis .mainMenuSectionHeading p");
  arenaProductProfileSetTextF9W2a(analysisText, distribution
    ? "Consulta statistiche e cronologia delle partite senza dati tecnici di sviluppo."
    : "Leggi record persistenti e dati runtime senza dover entrare nel pannello Debug della partita.");
  const systemText = document.querySelector(".controlCenterAreaSystem .mainMenuSectionHeading p");
  arenaProductProfileSetTextF9W2a(systemText, distribution
    ? "Versione, preferenze e archivio Player sono raccolti nel menu applicazione."
    : "Versione, preferenze, diagnostica di sviluppo e backup sono riuniti in un unico punto.");
}

function arenaProductProfileFilterOfficialMapsF9W2a(profile) {
  if (typeof document === "undefined") return;
  const customAllowed = arenaProductProfileAllowsF9W2a("customMaps", profile);

  const setup = document.getElementById("setupMapName");
  if (!customAllowed && setup && setup.options && typeof getMapDefinitionById === "function") {
    [...setup.options].forEach(option => {
      const definition = getMapDefinitionById(option.value);
      if (definition && definition.official === false) option.remove();
    });
    const selected = getMapDefinitionById(setup.value);
    if (selected && selected.official === false) setup.value = "map1_starter";
  }

  document.querySelectorAll("[data-control-center-map-row]").forEach(row => {
    const mapId = row.dataset.controlCenterMapRow;
    const definition = typeof getMapDefinitionById === "function" ? getMapDefinitionById(mapId) : null;
    const visible = customAllowed || !definition || definition.official !== false;
    arenaProductProfileSetElementVisibleF9W2a(row, visible);
  });
}

function arenaProductProfileNormalizeAiControlsF9W2a(profile) {
  if (typeof document === "undefined") return;
  const allowExpert = arenaProductProfileAllowsF9W2a("expertAi", profile);
  ["setupBotAiMode","botAiMode"].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    const option = select.querySelector('option[value="expert"]');
    if (option) arenaProductProfileSetElementVisibleF9W2a(option, allowExpert, { disable:true });
    if (!allowExpert && select.value === "expert") select.value = "advanced";
  });
}

function arenaProductProfileCleanPlayerStatsF9W2a(profile) {
  if (typeof document === "undefined") return;
  const dev = profile === ARENA_PRODUCT_PROFILES_F9W2A.DEV;
  ["copyMatchTelemetryJsonBtn","copyEventsJsonBtn","copyStatsFullLogBtn"].forEach(id => {
    arenaProductProfileSetElementVisibleF9W2a(document.getElementById(id), dev, { disable:true });
  });
  const telemetryPanel = document.getElementById("matchTelemetryPanel");
  if (telemetryPanel && telemetryPanel.closest) {
    const details = telemetryPanel.closest("details");
    if (details) arenaProductProfileSetElementVisibleF9W2a(details, dev);
  }
}

function arenaProductProfileUpdateLocalSummaryF9W2a(profile) {
  if (typeof document === "undefined") return;
  const summary = document.getElementById("mainMenuLocalSummary");
  if (!summary) return;
  const deckStore = typeof arenaStorageReadCustomDecks === "function" ? arenaStorageReadCustomDecks() : {};
  const decks = deckStore && typeof deckStore === "object" ? Object.keys(deckStore).length : 0;
  const stats = typeof arenaStorageReadMatchupStats === "function" ? arenaStorageReadMatchupStats().length : 0;
  const history = typeof arenaStorageReadMatchHistory === "function" ? arenaStorageReadMatchHistory().length : 0;
  if (profile === ARENA_PRODUCT_PROFILES_F9W2A.DISTRIBUTION) {
    arenaProductProfileSetTextF9W2a(summary, `${decks} deck locali · ${stats} record statistici · ${history} partite nello storico`);
    return;
  }
  const cards = typeof cardEditorReadCustomCards === "function" ? cardEditorReadCustomCards().length : 0;
  const maps = typeof getCustomMapDefinitions === "function" ? getCustomMapDefinitions().length : 0;
  arenaProductProfileSetTextF9W2a(summary, `${cards} carte custom · ${decks} deck custom · ${maps} mappe custom · ${stats} record matchup · ${history} partite nello storico`);
}

function arenaProductProfileRefreshCalibrationCopyF9W2a() {
  if (typeof document === "undefined") return;
  const panel = document.getElementById("rendererCalibrationLab");
  if (panel) {
    const kicker = panel.querySelector(".mainMenuKicker");
    if (kicker) arenaProductProfileSetTextF9W2a(kicker, "Strumento DEV permanente");
    const note = panel.querySelector(".rendererCalibrationNote");
    if (note) arenaProductProfileSetTextF9W2a(note, "Strumento DEV permanente: gli override servono per preview e possono essere esportati per fissare le coordinate nel renderer stabile.");
  }
  const layout = document.getElementById("menuLayoutLabScreen");
  if (layout) layout.dataset.devOnly = "true";
}

function arenaProductProfileApplyDomF9W2a() {
  if (typeof document === "undefined" || arenaProductProfileStateF9W2a.applyScheduled) return;
  arenaProductProfileStateF9W2a.applyScheduled = true;
  const run = () => {
    arenaProductProfileStateF9W2a.applyScheduled = false;
    const profile = arenaProductProfileCurrentF9W2a();
    const dev = profile === ARENA_PRODUCT_PROFILES_F9W2A.DEV;
    arenaProductProfileStateF9W2a.lastApplied = profile;

    if (document.documentElement) {
      document.documentElement.dataset.arenaProductProfile = profile;
      document.documentElement.dataset.arenaDeveloperMode = dev ? "on" : "off";
    }
    if (document.body) document.body.dataset.arenaProductProfile = profile;

    arenaProductProfileEnsureChipF9W2a(profile);
    arenaProductProfileUpdateSettingsCopyF9W2a(profile);
    arenaProductProfileUpdateMenuCopyF9W2a(profile);

    const devOnlySelectors = [
      "[data-control-center-dev-only]",
      "[data-dev-only]",
      "[data-app-open-card-editor]",
      "[data-app-open-map-editor]",
      "[data-app-open-layout-lab]",
      "#mainMenuTelemetryBtn",
      "#mainMenuLogBtn",
      "#mainMenuOptionsBtn",
      "#mainMenuTransferBtn",
      "#controlCenterTelemetrySchemaCard",
      "#controlCenterDiagnosticCard",
      "#gameDebugHeaderBtn",
      "#gameDebugBtn",
      "#gameDebugMenu",
      "#logDock",
      "[data-game-panel=\"market\"]",
      "#cardPoolDebugDetails",
      ".rendererCalibrationOpenBtn",
      "#rendererCalibrationLab",
      "[data-result-action=\"log\"]",
      "[data-result-action=\"telemetry\"]",
      "[data-control-center-map-edit]"
    ];
    devOnlySelectors.forEach(selector => arenaProductProfileApplySelectorF9W2a(selector, dev, { disable:false }));

    arenaProductProfileCleanPlayerStatsF9W2a(profile);
    arenaProductProfileNormalizeAiControlsF9W2a(profile);
    arenaProductProfileFilterOfficialMapsF9W2a(profile);
    arenaProductProfileUpdateLocalSummaryF9W2a(profile);
    arenaProductProfileRefreshCalibrationCopyF9W2a();

    // Se un pannello DEV era aperto e si passa a Distribution, lo chiudiamo.
    if (!dev && typeof controlCenterStateF9U3 !== "undefined" && controlCenterStateF9U3 && !arenaProductProfilePanelAllowedF9W2a(controlCenterStateF9U3.activePanel)) {
      try { if (typeof controlCenterClosePanel === "function") controlCenterClosePanel(); } catch (_) {}
    }
    if (!dev && typeof currentAppScreen === "function" && ["cardEditor","mapEditor","layoutLab"].includes(currentAppScreen())) {
      try { if (typeof openMainMenu === "function") openMainMenu(); } catch (_) {}
    }
  };
  if (typeof queueMicrotask === "function") queueMicrotask(run);
  else if (typeof setTimeout === "function") setTimeout(run, 0);
  else run();
}

function arenaProductProfileScheduleApplyF9W2a() {
  arenaProductProfileApplyDomF9W2a();
}

function arenaProductProfileInstallMutationObserverF9W2a() {
  if (typeof MutationObserver === "undefined" || typeof document === "undefined" || arenaProductProfileStateF9W2a.mutationObserver) return false;
  const host = document.body || document.documentElement;
  if (!host) return false;
  const observer = new MutationObserver(() => arenaProductProfileScheduleApplyF9W2a());
  observer.observe(host, { childList:true, subtree:true });
  arenaProductProfileStateF9W2a.mutationObserver = observer;
  return true;
}

function arenaProductProfilePatchCalibrationStorageF9W2a() {
  if (typeof menuLayoutCalibrationReadJson === "function" && !menuLayoutCalibrationReadJson.__f9w2aStorage) {
    const read = function(key, fallback) {
      if (typeof arenaStorageReadJson === "function") return arenaStorageReadJson(key, fallback);
      try {
        if (typeof localStorage === "undefined") return fallback;
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_) { return fallback; }
    };
    read.__f9w2aStorage = true;
    menuLayoutCalibrationReadJson = read;
  }
  if (typeof menuLayoutCalibrationWriteJson === "function" && !menuLayoutCalibrationWriteJson.__f9w2aStorage) {
    const write = function(key, value) {
      if (typeof arenaStorageWriteJson === "function") return arenaStorageWriteJson(key, value);
      try { localStorage.setItem(key, JSON.stringify(value, null, 2)); return true; } catch (_) { return false; }
    };
    write.__f9w2aStorage = true;
    menuLayoutCalibrationWriteJson = write;
  }
  if (typeof rendererCalibrationReadJson === "function" && !rendererCalibrationReadJson.__f9w2aStorage) {
    const read = function(key, fallback) {
      if (typeof arenaStorageReadJson === "function") return arenaStorageReadJson(key, fallback);
      try {
        if (typeof localStorage === "undefined") return fallback;
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_) { return fallback; }
    };
    read.__f9w2aStorage = true;
    rendererCalibrationReadJson = read;
  }
  if (typeof rendererCalibrationWriteJson === "function" && !rendererCalibrationWriteJson.__f9w2aStorage) {
    const write = function(key, value) {
      if (typeof arenaStorageWriteJson === "function") return arenaStorageWriteJson(key, value);
      try { localStorage.setItem(key, JSON.stringify(value, null, 2)); return true; } catch (_) { return false; }
    };
    write.__f9w2aStorage = true;
    rendererCalibrationWriteJson = write;
  }
}

function arenaProductProfileInstallFunctionGuardsF9W2a() {
  if (arenaProductProfileStateF9W2a.installed) return true;
  arenaProductProfileStateF9W2a.installed = true;
  arenaProductProfilePatchCalibrationStorageF9W2a();

  // Compatibilità con la vecchia API "developerMode" del Control Center.
  if (typeof controlCenterDeveloperDefault === "function") {
    arenaProductProfileStateF9W2a.originalFunctions.controlCenterDeveloperDefault = controlCenterDeveloperDefault;
    controlCenterDeveloperDefault = () => arenaProductProfileBuildDefaultF9W2a() === ARENA_PRODUCT_PROFILES_F9W2A.DEV;
  }
  if (typeof controlCenterReadDeveloperMode === "function") {
    arenaProductProfileStateF9W2a.originalFunctions.controlCenterReadDeveloperMode = controlCenterReadDeveloperMode;
    controlCenterReadDeveloperMode = () => arenaProductProfileIsDevF9W2a();
  }
  if (typeof controlCenterSetDeveloperMode === "function") {
    arenaProductProfileStateF9W2a.originalFunctions.controlCenterSetDeveloperMode = controlCenterSetDeveloperMode;
    controlCenterSetDeveloperMode = (enabled, options={}) => arenaProductProfileSetF9W2a(enabled ? "dev" : "distribution", options);
  }
  if (typeof controlCenterApplyDeveloperMode === "function") {
    arenaProductProfileStateF9W2a.originalFunctions.controlCenterApplyDeveloperMode = controlCenterApplyDeveloperMode;
    controlCenterApplyDeveloperMode = () => { arenaProductProfileApplyDomF9W2a(); return arenaProductProfileIsDevF9W2a(); };
  }

  if (typeof controlCenterOpenPanel === "function") {
    const original = controlCenterOpenPanel;
    arenaProductProfileStateF9W2a.originalFunctions.controlCenterOpenPanel = original;
    controlCenterOpenPanel = function(panelKey) {
      if (!arenaProductProfilePanelAllowedF9W2a(panelKey)) return false;
      const result = original.apply(this, arguments);
      arenaProductProfileApplyDomF9W2a();
      return result;
    };
  }

  if (typeof controlCenterOpenMapInEditor === "function") {
    const original = controlCenterOpenMapInEditor;
    arenaProductProfileStateF9W2a.originalFunctions.controlCenterOpenMapInEditor = original;
    controlCenterOpenMapInEditor = function(mapId) {
      if (!arenaProductProfileAllowsF9W2a("mapEditor")) return false;
      return original.apply(this, arguments);
    };
  }

  if (typeof controlCenterOpenMapInSetup === "function") {
    const original = controlCenterOpenMapInSetup;
    arenaProductProfileStateF9W2a.originalFunctions.controlCenterOpenMapInSetup = original;
    controlCenterOpenMapInSetup = function(mapId) {
      if (!arenaProductProfileAllowsF9W2a("customMaps") && typeof getMapDefinitionById === "function") {
        const definition = getMapDefinitionById(String(mapId || ""));
        if (definition && definition.official === false) return false;
      }
      return original.apply(this, arguments);
    };
  }

  if (typeof controlCenterDebugHtml === "function") {
    const original = controlCenterDebugHtml;
    arenaProductProfileStateF9W2a.originalFunctions.controlCenterDebugHtml = original;
    controlCenterDebugHtml = function() {
      let html = original.apply(this, arguments);
      const marker = '<button class="ghost" type="button" data-control-center-action="open-layout-lab">Apri Layout Calibration Lab</button>';
      if (html.includes(marker) && !html.includes('data-control-center-action="open-renderer-lab"')) {
        html = html.replace(marker, `${marker}\n      <button class="ghost" type="button" data-control-center-action="open-renderer-lab">Apri Renderer Calibration Lab</button>`);
      }
      return html;
    };
  }

  if (typeof controlCenterHandleAction === "function") {
    const original = controlCenterHandleAction;
    arenaProductProfileStateF9W2a.originalFunctions.controlCenterHandleAction = original;
    controlCenterHandleAction = function(action) {
      const key = String(action || "");
      if (key === "open-renderer-lab") {
        if (!arenaProductProfileAllowsF9W2a("calibration")) return false;
        if (typeof openRendererCalibrationLab === "function") return openRendererCalibrationLab(typeof rendererCalibrationCurrentCard === "function" ? rendererCalibrationCurrentCard() : null);
        if (typeof rendererCalibrationOpen === "function") return rendererCalibrationOpen(typeof rendererCalibrationCurrentCard === "function" ? rendererCalibrationCurrentCard() : null);
        return false;
      }
      if (key === "open-layout-lab" && !arenaProductProfileAllowsF9W2a("calibration")) return false;
      return original.apply(this, arguments);
    };
  }

  if (typeof setAppScreen === "function") {
    const original = setAppScreen;
    arenaProductProfileStateF9W2a.originalFunctions.setAppScreen = original;
    setAppScreen = function(screen) {
      const guarded = arenaProductProfileGuardScreenF9W2a(screen);
      const result = original.call(this, guarded);
      arenaProductProfileApplyDomF9W2a();
      return result;
    };
  }

  if (typeof openCardEditorScreen === "function") {
    const original = openCardEditorScreen;
    arenaProductProfileStateF9W2a.originalFunctions.openCardEditorScreen = original;
    openCardEditorScreen = function() {
      if (!arenaProductProfileAllowsF9W2a("cardEditor")) return false;
      return original.apply(this, arguments);
    };
  }

  if (typeof openMapEditorScreen === "function") {
    const original = openMapEditorScreen;
    arenaProductProfileStateF9W2a.originalFunctions.openMapEditorScreen = original;
    openMapEditorScreen = function() {
      if (!arenaProductProfileAllowsF9W2a("mapEditor")) return false;
      return original.apply(this, arguments);
    };
  }

  if (typeof openMenuLayoutCalibrationLabScreen === "function") {
    const original = openMenuLayoutCalibrationLabScreen;
    arenaProductProfileStateF9W2a.originalFunctions.openMenuLayoutCalibrationLabScreen = original;
    openMenuLayoutCalibrationLabScreen = function() {
      if (!arenaProductProfileAllowsF9W2a("calibration")) return false;
      return original.apply(this, arguments);
    };
  }

  if (typeof rendererCalibrationOpen === "function") {
    const original = rendererCalibrationOpen;
    arenaProductProfileStateF9W2a.originalFunctions.rendererCalibrationOpen = original;
    rendererCalibrationOpen = function() {
      if (!arenaProductProfileAllowsF9W2a("calibration")) return false;
      return original.apply(this, arguments);
    };
    try { if (typeof window !== "undefined") window.openRendererCalibrationLab = rendererCalibrationOpen; } catch (_) {}
  }

  if (typeof rendererCalibrationInjectButtons === "function") {
    const original = rendererCalibrationInjectButtons;
    arenaProductProfileStateF9W2a.originalFunctions.rendererCalibrationInjectButtons = original;
    rendererCalibrationInjectButtons = function() {
      if (!arenaProductProfileAllowsF9W2a("calibration")) return false;
      const result = original.apply(this, arguments);
      arenaProductProfileApplyDomF9W2a();
      return result;
    };
  }

  if (typeof arenaResultModalHandleActionF9V3a === "function") {
    const original = arenaResultModalHandleActionF9V3a;
    arenaProductProfileStateF9W2a.originalFunctions.arenaResultModalHandleActionF9V3a = original;
    arenaResultModalHandleActionF9V3a = function(action) {
      const key = String(action || "");
      if (key === "telemetry" && !arenaProductProfileAllowsF9W2a("rawTelemetry")) return false;
      if (key === "log" && !arenaProductProfileAllowsF9W2a("rawLog")) return false;
      return original.apply(this, arguments);
    };
  }

  if (typeof refreshSetupMapSelector === "function") {
    const original = refreshSetupMapSelector;
    arenaProductProfileStateF9W2a.originalFunctions.refreshSetupMapSelector = original;
    refreshSetupMapSelector = function() {
      const result = original.apply(this, arguments);
      arenaProductProfileFilterOfficialMapsF9W2a(arenaProductProfileCurrentF9W2a());
      return result;
    };
  }

  if (typeof refreshMainMenuLocalDataSummary === "function") {
    const original = refreshMainMenuLocalDataSummary;
    arenaProductProfileStateF9W2a.originalFunctions.refreshMainMenuLocalDataSummary = original;
    refreshMainMenuLocalDataSummary = function() {
      const result = original.apply(this, arguments);
      arenaProductProfileApplyDomF9W2a();
      return result;
    };
  }

  return true;
}

function arenaProductProfileSnapshotF9W2a() {
  const profile = arenaProductProfileCurrentF9W2a();
  return {
    schemaVersion:ARENA_PRODUCT_PROFILE_SCHEMA_F9W2A,
    profile,
    buildDefault:arenaProductProfileBuildDefaultF9W2a(),
    switchable:arenaProductProfileSwitchableF9W2a(),
    capabilities:Object.fromEntries(Object.keys(ARENA_PRODUCT_PROFILE_CAPABILITIES_F9W2A).map(key => [key, arenaProductProfileAllowsF9W2a(key, profile)])),
    calibration:{
      layoutAvailable:typeof openMenuLayoutCalibrationLabScreen === "function",
      rendererAvailable:typeof rendererCalibrationOpen === "function" || typeof openRendererCalibrationLab === "function",
      storageFacade:Boolean(typeof arenaStorageReadJson === "function" && typeof arenaStorageWriteJson === "function")
    }
  };
}

function arenaProductProfileInitializeF9W2a() {
  arenaProductProfileInstallFunctionGuardsF9W2a();
  arenaProductProfileStateF9W2a.initialized = true;
  arenaProductProfileApplyDomF9W2a();
  arenaProductProfileInstallMutationObserverF9W2a();
  if (arenaProductProfileIsDevF9W2a() && typeof initializeRendererCalibrationLab === "function") {
    try { initializeRendererCalibrationLab(); } catch (_) {}
  }
  if (arenaProductProfileIsDevF9W2a() && typeof rendererCalibrationInjectButtons === "function") {
    try { rendererCalibrationInjectButtons(); } catch (_) {}
  }
  return arenaProductProfileSnapshotF9W2a();
}

// API esplicita per test, Dev QA e futura build Distribution bloccata.
try {
  globalThis.arenaProductProfileCurrentF9W2a = arenaProductProfileCurrentF9W2a;
  globalThis.arenaProductProfileSetF9W2a = arenaProductProfileSetF9W2a;
  globalThis.arenaProductProfileAllowsF9W2a = arenaProductProfileAllowsF9W2a;
  globalThis.arenaProductProfileApplyDomF9W2a = arenaProductProfileApplyDomF9W2a;
  globalThis.arenaProductProfileSnapshotF9W2a = arenaProductProfileSnapshotF9W2a;
} catch (_) {}

arenaProductProfileInstallFunctionGuardsF9W2a();
// F9W2a END



// =====================================================
// F9W2b — Menu Theme System
// Sistema di temi persistenti per il menu/Control Center. È volutamente separato
// dal tema di fazione della partita: non modifica mappe, HUD, carte o gameplay.
// =====================================================

const ARENA_MENU_THEME_SCHEMA_F9W2B = "F9W2b-1";
const ARENA_MENU_THEME_SETTINGS_KEY_F9W2B = "menuTheme";
const ARENA_MENU_THEME_DEFAULT_F9W2B = "rubra_classic";

const ARENA_MENU_THEMES_F9W2B = Object.freeze({
  rubra_classic:Object.freeze({
    key:"rubra_classic", label:"Rubra · Classico", description:"Grafite, bronzo e rosso cupo: il tema neutro ufficiale di Arena Rubra.",
    bg:"#0d1015", bg2:"#171b23", surface:"#191e27", surface2:"#232a35", line:"#4c3c36",
    accent:"#c58a4d", accent2:"#7b342d", text:"#edf0f4", muted:"#abb2bd", glow:"rgba(197,138,77,.22)"
  }),
  nexus_basalt:Object.freeze({
    key:"nexus_basalt", label:"Nexus · Basalto notturno", description:"Acciaio freddo, blu calcolato e superfici basaltiche.",
    bg:"#090f16", bg2:"#101c28", surface:"#111c28", surface2:"#1b2a3a", line:"#34526e",
    accent:"#4b93cf", accent2:"#204f78", text:"#edf6ff", muted:"#9fb3c6", glow:"rgba(75,147,207,.22)"
  }),
  exordium_imperium:Object.freeze({
    key:"exordium_imperium", label:"Exordium · Imperium", description:"Cremisi, ferro e oro militare.",
    bg:"#120b0b", bg2:"#241112", surface:"#211314", surface2:"#321a1a", line:"#6a3734",
    accent:"#d0675d", accent2:"#7d2e2a", text:"#fff1ed", muted:"#c1aaa5", glow:"rgba(208,103,93,.24)"
  }),
  liberti_sine_vinculis:Object.freeze({
    key:"liberti_sine_vinculis", label:"Liberti · Sine Vinculis", description:"Terra bruciata, ottone e ambra irregolare.",
    bg:"#11100b", bg2:"#242012", surface:"#211e13", surface2:"#322d19", line:"#695a2d",
    accent:"#d1a63f", accent2:"#7b5d19", text:"#fff7df", muted:"#c2b99c", glow:"rgba(209,166,63,.23)"
  }),
  agathoi_kleos:Object.freeze({
    key:"agathoi_kleos", label:"Agathoi · Kleos", description:"Verde antico, bronzo spento e pietra protetta.",
    bg:"#0a120d", bg2:"#14241b", surface:"#102018", surface2:"#1a2b21", line:"#53725b",
    accent:"#88b879", accent2:"#3c6844", text:"#f2f7ea", muted:"#c9d7c3", glow:"rgba(136,184,121,.20)"
  }),
  fabeot_vesper:Object.freeze({
    key:"fabeot_vesper", label:"Fabeot · Vesper", description:"Porpora, velluto scuro e accenti aristocratici.",
    bg:"#100c14", bg2:"#21152a", surface:"#1f1726", surface2:"#2d2038", line:"#5d3d70",
    accent:"#ad70cf", accent2:"#623f79", text:"#faf1ff", muted:"#baa9c3", glow:"rgba(173,112,207,.23)"
  })
});

const arenaMenuThemeStateF9W2b = {
  initialized:false,
  key:null,
  styleInstalled:false,
  controlCenterPatched:false
};

function arenaMenuThemeNormalizeF9W2b(value) {
  const key = String(value || "").trim();
  return ARENA_MENU_THEMES_F9W2B[key] ? key : ARENA_MENU_THEME_DEFAULT_F9W2B;
}

function arenaMenuThemeReadSettingsF9W2b() {
  try {
    const settings = typeof arenaStorageReadSettings === "function" ? arenaStorageReadSettings() : {};
    const cfg = settings && typeof settings === "object" && !Array.isArray(settings) ? settings[ARENA_MENU_THEME_SETTINGS_KEY_F9W2B] : null;
    if (typeof cfg === "string") return arenaMenuThemeNormalizeF9W2b(cfg);
    if (cfg && typeof cfg === "object" && cfg.key) return arenaMenuThemeNormalizeF9W2b(cfg.key);
  } catch (_) {}
  return ARENA_MENU_THEME_DEFAULT_F9W2B;
}

function arenaMenuThemePersistF9W2b(key) {
  if (typeof arenaStorageReadSettings !== "function" || typeof arenaStorageWriteSettings !== "function") return false;
  try {
    const current = arenaStorageReadSettings();
    const next = current && typeof current === "object" && !Array.isArray(current) ? { ...current } : {};
    next[ARENA_MENU_THEME_SETTINGS_KEY_F9W2B] = {
      schemaVersion:ARENA_MENU_THEME_SCHEMA_F9W2B,
      key:arenaMenuThemeNormalizeF9W2b(key),
      updatedAt:new Date().toISOString()
    };
    return arenaStorageWriteSettings(next);
  } catch (_) { return false; }
}

function arenaMenuThemeEnsureStylesF9W2b() {
  if (typeof document === "undefined" || !document.head) return false;
  if (document.getElementById("arenaMenuThemeStylesF9W2b")) {
    arenaMenuThemeStateF9W2b.styleInstalled = true;
    return true;
  }
  const style = document.createElement("style");
  style.id = "arenaMenuThemeStylesF9W2b";
  style.textContent = `
    html[data-arena-menu-theme] .mainMenuScreen{color:var(--arena-menu-text)}
    html[data-arena-menu-theme] .mainMenuScreen .mainMenuBackdrop{
      background:
        radial-gradient(circle at 18% 10%,var(--arena-menu-glow),transparent 34%),
        radial-gradient(circle at 82% 22%,color-mix(in srgb,var(--arena-menu-accent2) 24%,transparent),transparent 38%),
        linear-gradient(145deg,var(--arena-menu-bg2),var(--arena-menu-bg) 62%)!important;
    }
    html[data-arena-menu-theme] .mainMenuScreen .mainMenuCard,
    html[data-arena-menu-theme] .controlCenterPanelSheet{
      background:linear-gradient(180deg,color-mix(in srgb,var(--arena-menu-surface2) 76%,transparent),var(--arena-menu-surface))!important;
      border-color:color-mix(in srgb,var(--arena-menu-line) 88%,white 8%)!important;
      box-shadow:0 26px 72px rgba(0,0,0,.48),0 0 34px var(--arena-menu-glow)!important;
      color:var(--arena-menu-text)!important;
    }
    html[data-arena-menu-theme] .mainMenuScreen .controlCenterArea,
    html[data-arena-menu-theme] .mainMenuScreen .controlCenterStatusCard,
    html[data-arena-menu-theme] .controlCenterPanelSheet .controlCenterSettingsCard,
    html[data-arena-menu-theme] .controlCenterPanelSheet .controlCenterTransferCard,
    html[data-arena-menu-theme] .controlCenterPanelSheet .controlCenterMiniMetric,
    html[data-arena-menu-theme] .controlCenterPanelSheet .controlCenterNotesBox{
      background:linear-gradient(180deg,color-mix(in srgb,var(--arena-menu-surface2) 72%,transparent),color-mix(in srgb,var(--arena-menu-surface) 92%,transparent))!important;
      border-color:color-mix(in srgb,var(--arena-menu-line) 76%,transparent)!important;
    }
    html[data-arena-menu-theme] .mainMenuScreen .mainMenuStudioTile,
    html[data-arena-menu-theme] .controlCenterPanelSheet button.ghost,
    html[data-arena-menu-theme] .controlCenterPanelSheet select{
      border-color:color-mix(in srgb,var(--arena-menu-line) 76%,transparent)!important;
      color:var(--arena-menu-text)!important;
    }
    html[data-arena-menu-theme] .mainMenuScreen .mainMenuStudioTile:hover:not(:disabled),
    html[data-arena-menu-theme] .controlCenterPanelSheet button.ghost:hover:not(:disabled){
      background:color-mix(in srgb,var(--arena-menu-accent) 13%,var(--arena-menu-surface2))!important;
      border-color:color-mix(in srgb,var(--arena-menu-accent) 58%,var(--arena-menu-line))!important;
    }
    html[data-arena-menu-theme] .mainMenuScreen .mainMenuPrimaryAction,
    html[data-arena-menu-theme] .controlCenterPanelSheet .primary{
      background:linear-gradient(180deg,var(--arena-menu-accent),color-mix(in srgb,var(--arena-menu-accent2) 82%,black 18%))!important;
      border-color:color-mix(in srgb,var(--arena-menu-accent) 72%,white 12%)!important;
      color:#fff!important;
      box-shadow:0 8px 24px color-mix(in srgb,var(--arena-menu-accent) 18%,transparent)!important;
    }
    html[data-arena-menu-theme] .mainMenuScreen .mainMenuSectionEyebrow,
    html[data-arena-menu-theme] .mainMenuScreen .mainMenuKicker,
    html[data-arena-menu-theme] .mainMenuScreen .mainMenuStage,
    html[data-arena-menu-theme] .controlCenterPanelSheet .mainMenuSectionEyebrow{
      color:var(--arena-menu-accent)!important;
    }
    html[data-arena-menu-theme] .mainMenuScreen .mainMenuTagline,
    html[data-arena-menu-theme] .mainMenuScreen .mainMenuSectionHeading p,
    html[data-arena-menu-theme] .mainMenuScreen small,
    html[data-arena-menu-theme] .mainMenuScreen .mainMenuNotes,
    html[data-arena-menu-theme] .controlCenterPanelSheet p,
    html[data-arena-menu-theme] .controlCenterPanelSheet small,
    html[data-arena-menu-theme] .controlCenterPanelSheet label{
      color:var(--arena-menu-muted)!important;
    }
    html[data-arena-menu-theme] .mainMenuScreen .mainMenuBuildChip,
    html[data-arena-menu-theme] .mainMenuScreen .mainMenuStorageChip,
    html[data-arena-menu-theme] .mainMenuScreen #arenaProductProfileChipF9W2a{
      border-color:color-mix(in srgb,var(--arena-menu-accent) 38%,var(--arena-menu-line))!important;
      background:color-mix(in srgb,var(--arena-menu-accent) 9%,var(--arena-menu-surface))!important;
    }
    .arenaMenuThemeSettingF9W2b label{display:grid;gap:7px}
    .arenaMenuThemeSettingF9W2b select{width:100%}
    .arenaMenuThemePreviewF9W2b{display:flex;align-items:center;gap:8px;margin-top:9px;font-size:.78rem;color:var(--arena-menu-muted)}
    .arenaMenuThemePreviewSwatchF9W2b{width:36px;height:16px;border-radius:999px;border:1px solid color-mix(in srgb,var(--arena-menu-line) 82%,white 10%);background:linear-gradient(90deg,var(--arena-menu-accent2),var(--arena-menu-accent));box-shadow:0 0 12px var(--arena-menu-glow)}
  `;
  style.textContent += `
    html[data-arena-ui-theme] [data-arena-skin-slot="shell"],
    html[data-arena-ui-theme] [data-arena-skin-slot="panel"],
    html[data-arena-ui-theme] [data-arena-skin-slot="header"],
    html[data-arena-ui-theme] .controlCenterPanelSheet,
    html[data-arena-ui-theme] body.app-screen-game .topTitleBar,
    html[data-arena-ui-theme] body.app-screen-game .gameHudStrip,
    html[data-arena-ui-theme] body.app-screen-game .gameActionBar,
    html[data-arena-ui-theme] body.app-screen-game .gameDebugMenu,
    html[data-arena-ui-theme] body.app-screen-game .selectedUnitFloat,
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap){
      position:relative;
      isolation:isolate;
    }
    html[data-arena-ui-theme] [data-arena-skin-slot="shell"] > *,
    html[data-arena-ui-theme] [data-arena-skin-slot="panel"] > *,
    html[data-arena-ui-theme] [data-arena-skin-slot="header"] > *,
    html[data-arena-ui-theme] .controlCenterPanelSheet > *,
    html[data-arena-ui-theme] body.app-screen-game .topTitleBar > *,
    html[data-arena-ui-theme] body.app-screen-game .gameHudStrip > *,
    html[data-arena-ui-theme] body.app-screen-game .gameActionBar > *,
    html[data-arena-ui-theme] body.app-screen-game .gameDebugMenu > *,
    html[data-arena-ui-theme] body.app-screen-game .selectedUnitFloat > *,
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap) > *{position:relative;z-index:1}

    html[data-arena-ui-theme] [data-arena-skin-slot="shell"]::after,
    html[data-arena-ui-theme] [data-arena-skin-slot="panel"]::after,
    html[data-arena-ui-theme] .controlCenterPanelSheet::after,
    html[data-arena-ui-theme] body.app-screen-game .topTitleBar::after,
    html[data-arena-ui-theme] body.app-screen-game .gameHudStrip::after,
    html[data-arena-ui-theme] body.app-screen-game .gameActionBar::after,
    html[data-arena-ui-theme] body.app-screen-game .gameDebugMenu::after,
    html[data-arena-ui-theme] body.app-screen-game .selectedUnitFloat::after,
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap)::after{
      content:"";
      position:absolute;
      inset:0;
      pointer-events:none;
      z-index:0;
      opacity:var(--arena-ui-ornament-opacity);
      background-image:
        var(--arena-ui-corner-tl),var(--arena-ui-corner-tr),
        var(--arena-ui-corner-bl),var(--arena-ui-corner-br),
        var(--arena-ui-edge-top),var(--arena-ui-edge-right),
        var(--arena-ui-edge-bottom),var(--arena-ui-edge-left);
      background-repeat:no-repeat,no-repeat,no-repeat,no-repeat,repeat-x,repeat-y,repeat-x,repeat-y;
      background-position:left top,right top,left bottom,right bottom,center top,right center,center bottom,left center;
      background-size:var(--arena-ui-corner-size) auto,var(--arena-ui-corner-size) auto,var(--arena-ui-corner-size) auto,var(--arena-ui-corner-size) auto,auto var(--arena-ui-edge-horizontal-thickness),var(--arena-ui-edge-vertical-thickness) auto,auto var(--arena-ui-edge-horizontal-thickness),var(--arena-ui-edge-vertical-thickness) auto;
      mix-blend-mode:normal;
      border-radius:inherit;
    }

    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] thead th,
    html[data-arena-ui-theme] .controlCenterPanelSheet thead th,
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap) thead th{
      box-shadow:inset 0 -1px 0 color-mix(in srgb,var(--arena-ui-line) 68%,transparent);
    }

    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] tbody tr:nth-child(even) td,
    html[data-arena-ui-theme] .controlCenterPanelSheet tbody tr:nth-child(even) td,
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap) tbody tr:nth-child(even) td{
      background:color-mix(in srgb,var(--arena-ui-surface2) 52%,transparent)!important;
    }
  `;
  document.head.appendChild(style);
  arenaMenuThemeStateF9W2b.styleInstalled = true;
  return true;
}

function arenaMenuThemeApplyF9W2b(value, options={}) {
  const key = arenaMenuThemeNormalizeF9W2b(value);
  const theme = ARENA_MENU_THEMES_F9W2B[key];
  arenaMenuThemeEnsureStylesF9W2b();
  if (typeof document !== "undefined" && document.documentElement) {
    const root = document.documentElement;
    root.dataset.arenaMenuTheme = key;
    root.style.setProperty("--arena-menu-bg", theme.bg);
    root.style.setProperty("--arena-menu-bg2", theme.bg2);
    root.style.setProperty("--arena-menu-surface", theme.surface);
    root.style.setProperty("--arena-menu-surface2", theme.surface2);
    root.style.setProperty("--arena-menu-line", theme.line);
    root.style.setProperty("--arena-menu-accent", theme.accent);
    root.style.setProperty("--arena-menu-accent2", theme.accent2);
    root.style.setProperty("--arena-menu-text", theme.text);
    root.style.setProperty("--arena-menu-muted", theme.muted);
    root.style.setProperty("--arena-menu-glow", theme.glow);
  }
  if (typeof document !== "undefined" && document.body) document.body.dataset.arenaMenuTheme = key;
  arenaMenuThemeStateF9W2b.key = key;
  if (options.persist !== false) arenaMenuThemePersistF9W2b(key);
  arenaMenuThemeSyncSettingsF9W2b();
  return theme;
}

function arenaMenuThemeCurrentF9W2b() {
  return arenaMenuThemeStateF9W2b.key || arenaMenuThemeReadSettingsF9W2b();
}

function arenaMenuThemeOptionsHtmlF9W2b() {
  const current = arenaMenuThemeCurrentF9W2b();
  return Object.values(ARENA_MENU_THEMES_F9W2B).map(theme =>
    `<option value="${theme.key}"${theme.key === current ? " selected" : ""}>${theme.label}</option>`
  ).join("");
}

function arenaMenuThemeSettingsCardF9W2b() {
  const theme = ARENA_MENU_THEMES_F9W2B[arenaMenuThemeCurrentF9W2b()] || ARENA_MENU_THEMES_F9W2B[ARENA_MENU_THEME_DEFAULT_F9W2B];
  return `<section class="controlCenterSettingsCard arenaMenuThemeSettingF9W2b">
    <h3>Tema menu</h3>
    <label><span>Stile dell'interfaccia menu</span><select id="arenaMenuThemeSelectF9W2b">${arenaMenuThemeOptionsHtmlF9W2b()}</select></label>
    <p id="arenaMenuThemeDescriptionF9W2b">${theme.description}</p>
    <div class="arenaMenuThemePreviewF9W2b"><span class="arenaMenuThemePreviewSwatchF9W2b" aria-hidden="true"></span><span>Anteprima live · salvata automaticamente</span></div>
  </section>`;
}

function arenaMenuThemeSyncSettingsF9W2b() {
  if (typeof document === "undefined") return false;
  const key = arenaMenuThemeCurrentF9W2b();
  const theme = ARENA_MENU_THEMES_F9W2B[key] || ARENA_MENU_THEMES_F9W2B[ARENA_MENU_THEME_DEFAULT_F9W2B];
  const select = document.getElementById("arenaMenuThemeSelectF9W2b");
  if (select && select.value !== key) select.value = key;
  const description = document.getElementById("arenaMenuThemeDescriptionF9W2b");
  if (description) description.textContent = theme.description;
  return true;
}

function arenaMenuThemeBindSettingsF9W2b() {
  if (typeof document === "undefined") return false;
  const select = document.getElementById("arenaMenuThemeSelectF9W2b");
  if (!select || select.dataset.arenaMenuThemeBoundF9W2b === "1") return Boolean(select);
  select.dataset.arenaMenuThemeBoundF9W2b = "1";
  select.addEventListener("change", () => arenaMenuThemeApplyF9W2b(select.value, { persist:true }));
  arenaMenuThemeSyncSettingsF9W2b();
  return true;
}

function arenaMenuThemeInstallControlCenterF9W2b() {
  if (arenaMenuThemeStateF9W2b.controlCenterPatched) return true;
  arenaMenuThemeStateF9W2b.controlCenterPatched = true;
  if (typeof controlCenterSettingsHtml === "function" && !controlCenterSettingsHtml.__arenaMenuThemeF9W2b) {
    const originalSettingsHtml = controlCenterSettingsHtml;
    const wrappedSettingsHtml = function() {
      let html = originalSettingsHtml.apply(this, arguments);
      if (!html.includes('id="arenaMenuThemeSelectF9W2b"')) {
        const archiveMarker = '<section class="controlCenterSettingsCard">\n        <h3>Archivio</h3>';
        if (html.includes(archiveMarker)) html = html.replace(archiveMarker, `${arenaMenuThemeSettingsCardF9W2b()}\n      ${archiveMarker}`);
        else html = html.replace('</div>', `${arenaMenuThemeSettingsCardF9W2b()}</div>`);
      }
      return html;
    };
    wrappedSettingsHtml.__arenaMenuThemeF9W2b = true;
    wrappedSettingsHtml.__arenaMenuThemeOriginal = originalSettingsHtml;
    controlCenterSettingsHtml = wrappedSettingsHtml;
  }
  if (typeof controlCenterBindDynamicPanelControls === "function" && !controlCenterBindDynamicPanelControls.__arenaMenuThemeF9W2b) {
    const originalBind = controlCenterBindDynamicPanelControls;
    const wrappedBind = function() {
      const result = originalBind.apply(this, arguments);
      arenaMenuThemeBindSettingsF9W2b();
      return result;
    };
    wrappedBind.__arenaMenuThemeF9W2b = true;
    wrappedBind.__arenaMenuThemeOriginal = originalBind;
    controlCenterBindDynamicPanelControls = wrappedBind;
  }
  return true;
}

function arenaMenuThemeSnapshotF9W2b() {
  const key = arenaMenuThemeCurrentF9W2b();
  const theme = ARENA_MENU_THEMES_F9W2B[key] || ARENA_MENU_THEMES_F9W2B[ARENA_MENU_THEME_DEFAULT_F9W2B];
  return {
    schemaVersion:ARENA_MENU_THEME_SCHEMA_F9W2B,
    key,
    label:theme.label,
    available:Object.keys(ARENA_MENU_THEMES_F9W2B),
    persistent:typeof arenaStorageReadSettings === "function" && typeof arenaStorageWriteSettings === "function",
    scope:"menu-control-center"
  };
}

function arenaMenuThemeInitializeF9W2b() {
  arenaMenuThemeInstallControlCenterF9W2b();
  const key = arenaMenuThemeReadSettingsF9W2b();
  arenaMenuThemeApplyF9W2b(key, { persist:false });
  arenaMenuThemeStateF9W2b.initialized = true;
  return arenaMenuThemeSnapshotF9W2b();
}

try {
  globalThis.arenaMenuThemeApplyF9W2b = arenaMenuThemeApplyF9W2b;
  globalThis.arenaMenuThemeCurrentF9W2b = arenaMenuThemeCurrentF9W2b;
  globalThis.arenaMenuThemeSnapshotF9W2b = arenaMenuThemeSnapshotF9W2b;
} catch (_) {}

arenaMenuThemeInstallControlCenterF9W2b();
// F9W2b END


// =====================================================
// F9W2c — Global Theme Scope & Skin Architecture
// Estende F9W2b a tutta la shell applicativa e introduce il contesto UI di
// partita. Le mappe/skin di campo restano governate da presentation_theme.js:
// F9W2c modifica esclusivamente materiali, contrasti e decorazioni della UI.
// =====================================================

const ARENA_UI_THEME_SCHEMA_F9W2C = "F9W2c-1";
const ARENA_UI_FACTION_THEME_F9W2C = Object.freeze({
  Nexus:"nexus_basalt",
  Exordium:"exordium_imperium",
  Liberti:"liberti_sine_vinculis",
  Agathoi:"agathoi_kleos",
  Fabeot:"fabeot_vesper"
});

const arenaUiThemeStateF9W2c = {
  initialized:false,
  styleInstalled:false,
  hooksInstalled:false,
  lastSignature:"",
  lastHumanSide:null,
  resolved:null
};

const ARENA_UI_THEME_SKIN_SCHEMA_F9W2D = "F9W2d-1";
const ARENA_UI_FRAME_SCHEMA_F9W2D2 = "F9W2d2-1";
const ARENA_UI_THEME_SKIN_ASSETS_F9W2D = Object.freeze({
  rubra_classic:Object.freeze({
    materialImage:"none",
    materialOverlay:"linear-gradient(180deg, rgba(255,255,255,.02), rgba(0,0,0,.08))",
    materialSize:"cover",
    materialPosition:"center",
    materialBlendMode:"soft-light",
    textPrimary:null,
    textSecondary:null,
    textHeading:null,
    textOnAccent:null,
    tableText:null,
    tableMuted:null,
    cornerTl:"none",
    cornerTr:"none",
    cornerBl:"none",
    cornerBr:"none",
    edgeTop:"none",
    edgeRight:"none",
    edgeBottom:"none",
    edgeLeft:"none",
    cornerSize:"48px",
    edgeHorizontalThickness:"16px",
    edgeVerticalThickness:"14px",
    ornamentOpacity:"0"
  }),
  nexus_basalt:Object.freeze({
    materialImage:'url("assets/ui/faction_skins/nexus_basalt/material.webp")',
    materialOverlay:"linear-gradient(180deg, rgba(6,12,20,.40), rgba(5,12,18,.58))",
    materialSize:"cover",
    materialPosition:"center",
    materialBlendMode:"soft-light",
    textPrimary:"#eef6ff",
    textSecondary:"#a9bdd0",
    textHeading:"#ffffff",
    textOnAccent:"#08111a",
    tableText:"#eef5ff",
    tableMuted:"#b0bfd0",
    cornerTl:'url("assets/ui/faction_skins/nexus_basalt/corner_tl.webp")',
    cornerTr:'url("assets/ui/faction_skins/nexus_basalt/corner_tr.webp")',
    cornerBl:'url("assets/ui/faction_skins/nexus_basalt/corner_bl.webp")',
    cornerBr:'url("assets/ui/faction_skins/nexus_basalt/corner_br.webp")',
    edgeTop:'url("assets/ui/faction_skins/nexus_basalt/edge_top.webp")',
    edgeRight:'url("assets/ui/faction_skins/nexus_basalt/edge_right.webp")',
    edgeBottom:'url("assets/ui/faction_skins/nexus_basalt/edge_bottom.webp")',
    edgeLeft:'url("assets/ui/faction_skins/nexus_basalt/edge_left.webp")',
    cornerSize:"48px",
    edgeHorizontalThickness:"16px",
    edgeVerticalThickness:"14px",
    ornamentOpacity:".34"
  }),
  exordium_imperium:Object.freeze({
    materialImage:'url("assets/ui/faction_skins/exordium_imperium/material.webp")',
    materialOverlay:"linear-gradient(180deg, rgba(18,5,5,.34), rgba(32,8,8,.52))",
    materialSize:"cover",
    materialPosition:"center",
    materialBlendMode:"soft-light",
    textPrimary:"#fff3ee",
    textSecondary:"#ccb2a9",
    textHeading:"#fffaf7",
    textOnAccent:"#220906",
    tableText:"#fff4ee",
    tableMuted:"#cfb9b0",
    cornerTl:'url("assets/ui/faction_skins/exordium_imperium/corner_tl.webp")',
    cornerTr:'url("assets/ui/faction_skins/exordium_imperium/corner_tr.webp")',
    cornerBl:'url("assets/ui/faction_skins/exordium_imperium/corner_bl.webp")',
    cornerBr:'url("assets/ui/faction_skins/exordium_imperium/corner_br.webp")',
    edgeTop:'url("assets/ui/faction_skins/exordium_imperium/edge_top.webp")',
    edgeRight:'url("assets/ui/faction_skins/exordium_imperium/edge_right.webp")',
    edgeBottom:'url("assets/ui/faction_skins/exordium_imperium/edge_bottom.webp")',
    edgeLeft:'url("assets/ui/faction_skins/exordium_imperium/edge_left.webp")',
    cornerSize:"48px",
    edgeHorizontalThickness:"16px",
    edgeVerticalThickness:"14px",
    ornamentOpacity:".36"
  }),
  liberti_sine_vinculis:Object.freeze({
    materialImage:'url("assets/ui/faction_skins/liberti_sine_vinculis/material.webp")',
    materialOverlay:"linear-gradient(180deg, rgba(31,17,6,.18), rgba(51,28,8,.36))",
    materialSize:"cover",
    materialPosition:"center",
    materialBlendMode:"multiply",
    textPrimary:"#25160a",
    textSecondary:"#5f4320",
    textHeading:"#331c08",
    textOnAccent:"#1b1208",
    tableText:"#2d1809",
    tableMuted:"#6e522d",
    cornerTl:'url("assets/ui/faction_skins/liberti_sine_vinculis/corner_tl.webp")',
    cornerTr:'url("assets/ui/faction_skins/liberti_sine_vinculis/corner_tr.webp")',
    cornerBl:'url("assets/ui/faction_skins/liberti_sine_vinculis/corner_bl.webp")',
    cornerBr:'url("assets/ui/faction_skins/liberti_sine_vinculis/corner_br.webp")',
    edgeTop:'url("assets/ui/faction_skins/liberti_sine_vinculis/edge_top.webp")',
    edgeRight:'url("assets/ui/faction_skins/liberti_sine_vinculis/edge_right.webp")',
    edgeBottom:'url("assets/ui/faction_skins/liberti_sine_vinculis/edge_bottom.webp")',
    edgeLeft:'url("assets/ui/faction_skins/liberti_sine_vinculis/edge_left.webp")',
    cornerSize:"48px",
    edgeHorizontalThickness:"16px",
    edgeVerticalThickness:"14px",
    ornamentOpacity:".32"
  }),
  agathoi_kleos:Object.freeze({
    materialImage:'url("assets/ui/faction_skins/agathoi_kleos/material.webp")',
    materialOverlay:"linear-gradient(180deg, rgba(10,18,12,.28), rgba(24,40,25,.38))",
    materialSize:"cover",
    materialPosition:"center",
    materialBlendMode:"multiply",
    textPrimary:"#f2f7ea",
    textSecondary:"#c9d7c3",
    textHeading:"#fffdf1",
    textOnAccent:"#10160f",
    tableText:"#f4f9ed",
    tableMuted:"#afbeaa",
    cornerTl:'url("assets/ui/faction_skins/agathoi_kleos/corner_tl.webp")',
    cornerTr:'url("assets/ui/faction_skins/agathoi_kleos/corner_tr.webp")',
    cornerBl:'url("assets/ui/faction_skins/agathoi_kleos/corner_bl.webp")',
    cornerBr:'url("assets/ui/faction_skins/agathoi_kleos/corner_br.webp")',
    edgeTop:'url("assets/ui/faction_skins/agathoi_kleos/edge_top.webp")',
    edgeRight:'url("assets/ui/faction_skins/agathoi_kleos/edge_right.webp")',
    edgeBottom:'url("assets/ui/faction_skins/agathoi_kleos/edge_bottom.webp")',
    edgeLeft:'url("assets/ui/faction_skins/agathoi_kleos/edge_left.webp")',
    cornerSize:"48px",
    edgeHorizontalThickness:"16px",
    edgeVerticalThickness:"14px",
    ornamentOpacity:".30"
  }),
  fabeot_vesper:Object.freeze({
    materialImage:'url("assets/ui/faction_skins/fabeot_vesper/material.webp")',
    materialOverlay:"linear-gradient(180deg, rgba(17,9,22,.36), rgba(24,10,29,.56))",
    materialSize:"cover",
    materialPosition:"center",
    materialBlendMode:"soft-light",
    textPrimary:"#faf1ff",
    textSecondary:"#cab5d2",
    textHeading:"#fff9ff",
    textOnAccent:"#120b16",
    tableText:"#fbf3ff",
    tableMuted:"#cdb9d8",
    cornerTl:'url("assets/ui/faction_skins/fabeot_vesper/corner_tl.webp")',
    cornerTr:'url("assets/ui/faction_skins/fabeot_vesper/corner_tr.webp")',
    cornerBl:'url("assets/ui/faction_skins/fabeot_vesper/corner_bl.webp")',
    cornerBr:'url("assets/ui/faction_skins/fabeot_vesper/corner_br.webp")',
    edgeTop:'url("assets/ui/faction_skins/fabeot_vesper/edge_top.webp")',
    edgeRight:'url("assets/ui/faction_skins/fabeot_vesper/edge_right.webp")',
    edgeBottom:'url("assets/ui/faction_skins/fabeot_vesper/edge_bottom.webp")',
    edgeLeft:'url("assets/ui/faction_skins/fabeot_vesper/edge_left.webp")',
    cornerSize:"48px",
    edgeHorizontalThickness:"16px",
    edgeVerticalThickness:"14px",
    ornamentOpacity:".35"
  })
});

function arenaUiThemeAssetSlotsF9W2c(themeKey) {
  return ARENA_UI_THEME_SKIN_ASSETS_F9W2D[String(themeKey || "")] || ARENA_UI_THEME_SKIN_ASSETS_F9W2D.rubra_classic;
}

function arenaUiThemeKeyForFactionF9W2c(faction) {
  return ARENA_UI_FACTION_THEME_F9W2C[String(faction || "")] || null;
}

function arenaUiThemePlayerModeF9W2c(side) {
  if (typeof state === "undefined" || !state) return null;
  const id = Number(side);
  const player = Array.isArray(state.players) ? state.players.find(item => Number(item && item.id) === id) : null;
  return String((player && player.mode) || (state.modes && state.modes[id]) || "").toLowerCase() || null;
}

function arenaUiThemePlayerFactionF9W2c(side) {
  if (typeof state === "undefined" || !state) return null;
  const id = Number(side);
  const player = Array.isArray(state.players) ? state.players.find(item => Number(item && item.id) === id) : null;
  return (player && player.faction) || (state.factions && state.factions[id]) || null;
}

function arenaUiThemePlayerIdsF9W2c() {
  if (typeof state === "undefined" || !state) return [];
  if (Array.isArray(state.playerIds) && state.playerIds.length) return state.playerIds.map(Number).filter(Number.isInteger);
  if (Array.isArray(state.players) && state.players.length) return state.players.map(item => Number(item && item.id)).filter(Number.isInteger);
  const factions = state.factions && typeof state.factions === "object" ? Object.keys(state.factions).map(Number).filter(Number.isInteger) : [];
  return factions.length ? factions : [1,2];
}

function arenaUiThemeIsGameContextF9W2c() {
  try {
    if (typeof currentAppScreen === "function" && currentAppScreen() === "game") return true;
  } catch (_) {}
  try {
    return Boolean(typeof document !== "undefined" && document.body && document.body.classList && document.body.classList.contains("app-screen-game"));
  } catch (_) { return false; }
}

function arenaUiThemeResolveF9W2c() {
  const globalKey = typeof arenaMenuThemeCurrentF9W2b === "function"
    ? arenaMenuThemeCurrentF9W2b()
    : ARENA_MENU_THEME_DEFAULT_F9W2B;
  const fallback = {
    key:arenaMenuThemeNormalizeF9W2b(globalKey),
    scope:"global",
    source:"global-selection",
    side:null,
    faction:null,
    humanPlayers:0
  };
  if (!arenaUiThemeIsGameContextF9W2c() || typeof state === "undefined" || !state) return fallback;

  const ids = arenaUiThemePlayerIdsF9W2c();
  const humanIds = ids.filter(side => arenaUiThemePlayerModeF9W2c(side) === "human");
  let side = 1;
  let source = "player1";

  if (humanIds.length > 1) {
    const current = Number(state.currentPlayer);
    if (humanIds.includes(current)) {
      side = current;
      arenaUiThemeStateF9W2c.lastHumanSide = current;
      source = "active-human";
    } else if (humanIds.includes(Number(arenaUiThemeStateF9W2c.lastHumanSide))) {
      side = Number(arenaUiThemeStateF9W2c.lastHumanSide);
      source = "last-human-during-bot-turn";
    }
  } else {
    // Con zero o un solo umano il tavolo mantiene l'identità del Giocatore 1.
    arenaUiThemeStateF9W2c.lastHumanSide = humanIds.length === 1 ? humanIds[0] : null;
  }

  const faction = arenaUiThemePlayerFactionF9W2c(side) || arenaUiThemePlayerFactionF9W2c(1);
  const key = arenaUiThemeKeyForFactionF9W2c(faction) || fallback.key;
  return {
    key,
    scope:"game",
    source,
    side,
    faction:faction || null,
    humanPlayers:humanIds.length
  };
}

function arenaUiThemeHexLuminanceF9W2c(value) {
  const match = String(value || "").trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) return 0;
  const n = parseInt(match[1], 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(channel => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function arenaUiThemeContrastTextF9W2c(background) {
  return arenaUiThemeHexLuminanceF9W2c(background) > 0.42 ? "#101318" : "#ffffff";
}

function arenaUiThemeEnsureStylesF9W2c() {
  if (typeof document === "undefined" || !document.head) return false;
  if (document.getElementById("arenaUiThemeStylesF9W2c")) {
    arenaUiThemeStateF9W2c.styleInstalled = true;
    return true;
  }
  const style = document.createElement("style");
  style.id = "arenaUiThemeStylesF9W2c";
  style.textContent = `
    html[data-arena-ui-theme] body{color:var(--arena-ui-text-primary)}
    html[data-arena-ui-theme] body:not(.app-screen-game){
      background:
        radial-gradient(circle at 14% 8%,var(--arena-ui-glow),transparent 34%),
        radial-gradient(circle at 88% 18%,color-mix(in srgb,var(--arena-ui-accent2) 18%,transparent),transparent 38%),
        linear-gradient(145deg,var(--arena-ui-bg2),var(--arena-ui-bg) 64%)!important;
    }
    html[data-arena-ui-theme] body:not(.app-screen-game) .mainMenuBackdrop{
      background:
        radial-gradient(circle at 18% 10%,var(--arena-ui-glow),transparent 34%),
        radial-gradient(circle at 82% 22%,color-mix(in srgb,var(--arena-ui-accent2) 22%,transparent),transparent 38%),
        linear-gradient(145deg,var(--arena-ui-bg2),var(--arena-ui-bg) 62%)!important;
    }

    html[data-arena-ui-theme] body:not(.app-screen-game) .mainMenuCard,
    html[data-arena-ui-theme] body:not(.app-screen-game) .tutorialScreenCard,
    html[data-arena-ui-theme] body:not(.app-screen-game) .setupScreenCard,
    html[data-arena-ui-theme] body:not(.app-screen-game) .mapEditorCard,
    html[data-arena-ui-theme] body:not(.app-screen-game) .deckBuilderCard,
    html[data-arena-ui-theme] body:not(.app-screen-game) .cardEditorCard,
    html[data-arena-ui-theme] body:not(.app-screen-game) .cardPoolCard,
    html[data-arena-ui-theme] body:not(.app-screen-game) .placeholderCard,
    html[data-arena-ui-theme] .controlCenterPanelSheet{
      color:var(--arena-ui-text-primary)!important;
      border-color:color-mix(in srgb,var(--arena-ui-line) 86%,white 8%)!important;
      background-color:var(--arena-ui-surface)!important;
      background-image:var(--arena-ui-material-overlay),var(--arena-ui-material-image),linear-gradient(180deg,color-mix(in srgb,var(--arena-ui-surface2) 78%,transparent),var(--arena-ui-surface))!important;
      background-size:auto,var(--arena-ui-material-size),auto!important;
      background-position:center,var(--arena-ui-material-position),center!important;
      background-blend-mode:normal,var(--arena-ui-material-blend),normal!important;
      box-shadow:0 24px 68px rgba(0,0,0,.48),0 0 30px var(--arena-ui-glow)!important;
    }

    html[data-arena-ui-theme] body:not(.app-screen-game) .controlCenterArea,
    html[data-arena-ui-theme] body:not(.app-screen-game) .controlCenterStatusCard,
    html[data-arena-ui-theme] body:not(.app-screen-game) .setupSideBox,
    html[data-arena-ui-theme] body:not(.app-screen-game) .setupMatchBox,
    html[data-arena-ui-theme] body:not(.app-screen-game) .setupPlayerSubsection,
    html[data-arena-ui-theme] body:not(.app-screen-game) .deckBuilderControls,
    html[data-arena-ui-theme] body:not(.app-screen-game) .deckBuilderBox,
    html[data-arena-ui-theme] body:not(.app-screen-game) .deckBuilderSummary,
    html[data-arena-ui-theme] body:not(.app-screen-game) .cardEditorAbilityBox,
    html[data-arena-ui-theme] body:not(.app-screen-game) .cardEditorArtBox,
    html[data-arena-ui-theme] body:not(.app-screen-game) .cardEditorImportBox,
    html[data-arena-ui-theme] body:not(.app-screen-game) .mapEditorSidebar,
    html[data-arena-ui-theme] body:not(.app-screen-game) .mapEditorCanvasPanel,
    html[data-arena-ui-theme] body:not(.app-screen-game) .mapEditorLiveBar,
    html[data-arena-ui-theme] body:not(.app-screen-game) .mapEditorSideSection,
    html[data-arena-ui-theme] body:not(.app-screen-game) .mapEditorValidationPanel,
    html[data-arena-ui-theme] body:not(.app-screen-game) .tutorialLessonCard,
    html[data-arena-ui-theme] body:not(.app-screen-game) .tutorialRuntimeStatus,
    html[data-arena-ui-theme] .controlCenterSettingsCard,
    html[data-arena-ui-theme] .controlCenterTransferCard,
    html[data-arena-ui-theme] .controlCenterMiniMetric,
    html[data-arena-ui-theme] .controlCenterNotesBox{
      color:var(--arena-ui-text-primary)!important;
      border-color:color-mix(in srgb,var(--arena-ui-line) 74%,transparent)!important;
      background-color:var(--arena-ui-surface)!important;
      background-image:var(--arena-ui-material-overlay),var(--arena-ui-material-image),linear-gradient(180deg,color-mix(in srgb,var(--arena-ui-surface2) 70%,transparent),color-mix(in srgb,var(--arena-ui-surface) 94%,transparent))!important;
      background-size:auto,var(--arena-ui-material-size),auto!important;
      background-position:center,var(--arena-ui-material-position),center!important;
      background-blend-mode:normal,var(--arena-ui-material-blend),normal!important;
    }

    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] h1,
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] h2,
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] h3,
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] h4,
    html[data-arena-ui-theme] .controlCenterPanelSheet h1,
    html[data-arena-ui-theme] .controlCenterPanelSheet h2,
    html[data-arena-ui-theme] .controlCenterPanelSheet h3{color:var(--arena-ui-text-heading)!important}
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] p,
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] small,
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] .help,
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] label,
    html[data-arena-ui-theme] .controlCenterPanelSheet p,
    html[data-arena-ui-theme] .controlCenterPanelSheet small,
    html[data-arena-ui-theme] .controlCenterPanelSheet label{color:var(--arena-ui-text-secondary)!important}
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] .mainMenuKicker,
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] .mainMenuSectionEyebrow{color:var(--arena-ui-accent)!important}

    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] input,
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] select,
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] textarea,
    html[data-arena-ui-theme] .controlCenterPanelSheet input,
    html[data-arena-ui-theme] .controlCenterPanelSheet select,
    html[data-arena-ui-theme] .controlCenterPanelSheet textarea{
      color:var(--arena-ui-text-primary)!important;
      background:color-mix(in srgb,var(--arena-ui-surface2) 92%,black 8%)!important;
      border-color:color-mix(in srgb,var(--arena-ui-line) 82%,transparent)!important;
    }
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] button.ghost,
    html[data-arena-ui-theme] .controlCenterPanelSheet button.ghost{
      color:var(--arena-ui-text-primary)!important;
      border-color:color-mix(in srgb,var(--arena-ui-line) 80%,transparent)!important;
      background:color-mix(in srgb,var(--arena-ui-surface2) 44%,transparent)!important;
    }
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] button.ghost:hover:not(:disabled),
    html[data-arena-ui-theme] .controlCenterPanelSheet button.ghost:hover:not(:disabled){
      background:color-mix(in srgb,var(--arena-ui-accent) 13%,var(--arena-ui-surface2))!important;
      border-color:color-mix(in srgb,var(--arena-ui-accent) 58%,var(--arena-ui-line))!important;
    }
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] button.primary,
    html[data-arena-ui-theme] .controlCenterPanelSheet button.primary{
      color:var(--arena-ui-text-on-accent)!important;
      background:linear-gradient(180deg,var(--arena-ui-accent),color-mix(in srgb,var(--arena-ui-accent2) 84%,black 16%))!important;
      border-color:color-mix(in srgb,var(--arena-ui-accent) 70%,white 12%)!important;
    }

    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] table,
    html[data-arena-ui-theme] .controlCenterPanelSheet table{color:var(--arena-ui-table-text)!important}
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] thead th,
    html[data-arena-ui-theme] .controlCenterPanelSheet thead th{
      color:var(--arena-ui-text-heading)!important;
      background:color-mix(in srgb,var(--arena-ui-accent2) 28%,var(--arena-ui-surface2))!important;
      border-color:color-mix(in srgb,var(--arena-ui-line) 82%,transparent)!important;
    }
    html[data-arena-ui-theme] body:not(.app-screen-game) [data-app-screen-panel] tbody td,
    html[data-arena-ui-theme] .controlCenterPanelSheet tbody td{
      color:var(--arena-ui-table-text)!important;
      background:color-mix(in srgb,var(--arena-ui-surface) 91%,transparent)!important;
      border-color:color-mix(in srgb,var(--arena-ui-line) 58%,transparent)!important;
    }

    /* In partita cambiano soltanto shell/pannelli. Board, esagoni e asset mappa restano esclusi. */
    html[data-arena-ui-theme] body.app-screen-game .topTitleBar,
    html[data-arena-ui-theme] body.app-screen-game .gameHudStrip,
    html[data-arena-ui-theme] body.app-screen-game .gameActionBar,
    html[data-arena-ui-theme] body.app-screen-game .gameDebugMenu,
    html[data-arena-ui-theme] body.app-screen-game .selectedUnitFloat,
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap),
    html[data-arena-ui-theme] body.app-screen-game .managedGamePanel.panelOverlayActive{
      color:var(--arena-ui-text-primary)!important;
      border-color:color-mix(in srgb,var(--arena-ui-line) 76%,transparent)!important;
      background-color:var(--arena-ui-surface)!important;
      background-image:var(--arena-ui-material-overlay),var(--arena-ui-material-image),linear-gradient(180deg,color-mix(in srgb,var(--arena-ui-surface2) 74%,transparent),color-mix(in srgb,var(--arena-ui-surface) 96%,black 4%))!important;
      background-size:auto,var(--arena-ui-material-size),auto!important;
      background-position:center,var(--arena-ui-material-position),center!important;
      background-blend-mode:normal,var(--arena-ui-material-blend),normal!important;
    }
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap) h2,
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap) h3,
    html[data-arena-ui-theme] body.app-screen-game .selectedUnitFloatHeader strong{color:var(--arena-ui-text-heading)!important}
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap) .help,
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap) small,
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap) label{color:var(--arena-ui-text-secondary)!important}
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap) input,
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap) select,
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap) textarea{
      color:var(--arena-ui-text-primary)!important;
      background:color-mix(in srgb,var(--arena-ui-surface2) 90%,black 10%)!important;
      border-color:color-mix(in srgb,var(--arena-ui-line) 82%,transparent)!important;
    }
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap) table{color:var(--arena-ui-table-text)!important}
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap) thead th{
      color:var(--arena-ui-text-heading)!important;
      background:color-mix(in srgb,var(--arena-ui-accent2) 30%,var(--arena-ui-surface2))!important;
    }
    html[data-arena-ui-theme] body.app-screen-game .panel:not(#boardWrap) tbody td{
      color:var(--arena-ui-table-text)!important;
      background:color-mix(in srgb,var(--arena-ui-surface) 92%,transparent)!important;
    }

    /* Slot preparati per F9W2d: nessun asset ornamentale è applicato in F9W2c. */
    html[data-arena-ui-theme]{
      --arena-ui-material-image:none;
      --arena-ui-material-overlay:none;
      --arena-ui-material-blend:soft-light;
      --arena-ui-corner-tl:none;
      --arena-ui-corner-tr:none;
      --arena-ui-corner-bl:none;
      --arena-ui-corner-br:none;
      --arena-ui-edge-top:none;
      --arena-ui-edge-right:none;
      --arena-ui-edge-bottom:none;
      --arena-ui-edge-left:none;
      --arena-ui-corner-size:48px;
      --arena-ui-edge-horizontal-thickness:16px;
      --arena-ui-edge-vertical-thickness:14px;
      --arena-ui-ornament-opacity:0;
    }
  `;
  document.head.appendChild(style);
  arenaUiThemeStateF9W2c.styleInstalled = true;
  return true;
}

function arenaUiThemeAnnotateDomF9W2c() {
  if (typeof document === "undefined" || typeof document.querySelectorAll !== "function") return;
  const groups = [
    ["shell", ".mainMenuCard,.tutorialScreenCard,.setupScreenCard,.mapEditorCard,.deckBuilderCard,.cardEditorCard,.cardPoolCard,.placeholderCard,.controlCenterPanelSheet"],
    ["panel", ".controlCenterArea,.controlCenterStatusCard,.setupSideBox,.setupMatchBox,.deckBuilderBox,.deckBuilderControls,.cardEditorAbilityBox,.mapEditorSidebar,.mapEditorCanvasPanel,.mapEditorSideSection,.panel:not(#boardWrap)"],
    ["table", "table"],
    ["header", ".mainMenuHero,.deckBuilderHeader,.mapEditorHeader,.setupSideHeader,.selectedUnitFloatHeader"]
  ];
  groups.forEach(([slot, selector]) => {
    try {
      document.querySelectorAll(selector).forEach(element => { if (element && element.dataset) element.dataset.arenaSkinSlot = slot; });
    } catch (_) {}
  });
}

function arenaUiThemeApplyResolvedF9W2c(resolved, options={}) {
  const key = arenaMenuThemeNormalizeF9W2b(resolved && resolved.key);
  const theme = ARENA_MENU_THEMES_F9W2B[key] || ARENA_MENU_THEMES_F9W2B[ARENA_MENU_THEME_DEFAULT_F9W2B];
  const slots = arenaUiThemeAssetSlotsF9W2c(key) || {};
  arenaUiThemeEnsureStylesF9W2c();
  const root = typeof document !== "undefined" ? document.documentElement : null;
  const signature = [key,resolved && resolved.scope,resolved && resolved.source,resolved && resolved.side,resolved && resolved.faction].join("|");
  if (root && root.dataset) {
    root.dataset.arenaUiTheme = key;
    root.dataset.arenaUiScope = resolved && resolved.scope || "global";
    root.dataset.arenaUiThemeSource = resolved && resolved.source || "global-selection";
    if (resolved && resolved.side != null) root.dataset.arenaUiPlayer = String(resolved.side); else delete root.dataset.arenaUiPlayer;
    if (resolved && resolved.faction) root.dataset.arenaUiFaction = String(resolved.faction); else delete root.dataset.arenaUiFaction;
  }
  if (root && root.style && typeof root.style.setProperty === "function") {
    const props = {
      "--arena-ui-bg":theme.bg,
      "--arena-ui-bg2":theme.bg2,
      "--arena-ui-surface":theme.surface,
      "--arena-ui-surface2":theme.surface2,
      "--arena-ui-line":theme.line,
      "--arena-ui-accent":theme.accent,
      "--arena-ui-accent2":theme.accent2,
      "--arena-ui-text-primary":slots.textPrimary || theme.text,
      "--arena-ui-text-secondary":slots.textSecondary || theme.muted,
      "--arena-ui-text-heading":slots.textHeading || slots.textPrimary || theme.text,
      "--arena-ui-text-on-accent":slots.textOnAccent || arenaUiThemeContrastTextF9W2c(theme.accent),
      "--arena-ui-table-text":slots.tableText || slots.textPrimary || theme.text,
      "--arena-ui-table-muted":slots.tableMuted || slots.textSecondary || theme.muted,
      "--arena-ui-good":"#8bd17c",
      "--arena-ui-warning":"#e3bd67",
      "--arena-ui-danger":"#ef7777",
      "--arena-ui-glow":theme.glow,
      "--arena-ui-material-image":slots.materialImage || "none",
      "--arena-ui-material-overlay":slots.materialOverlay || "none",
      "--arena-ui-material-size":slots.materialSize || "cover",
      "--arena-ui-material-position":slots.materialPosition || "center",
      "--arena-ui-material-blend":slots.materialBlendMode || "soft-light",
      "--arena-ui-corner-tl":slots.cornerTl || "none",
      "--arena-ui-corner-tr":slots.cornerTr || "none",
      "--arena-ui-corner-bl":slots.cornerBl || "none",
      "--arena-ui-corner-br":slots.cornerBr || "none",
      "--arena-ui-edge-top":slots.edgeTop || "none",
      "--arena-ui-edge-right":slots.edgeRight || "none",
      "--arena-ui-edge-bottom":slots.edgeBottom || "none",
      "--arena-ui-edge-left":slots.edgeLeft || "none",
      "--arena-ui-corner-size":slots.cornerSize || "48px",
      "--arena-ui-edge-horizontal-thickness":slots.edgeHorizontalThickness || "16px",
      "--arena-ui-edge-vertical-thickness":slots.edgeVerticalThickness || "14px",
      "--arena-ui-ornament-opacity":String(slots.ornamentOpacity == null ? 0 : slots.ornamentOpacity)
    };
    Object.entries(props).forEach(([name,value]) => root.style.setProperty(name, value));
  }
  if (typeof document !== "undefined" && document.body && document.body.dataset) {
    document.body.dataset.arenaUiTheme = key;
    document.body.dataset.arenaUiScope = resolved && resolved.scope || "global";
  }
  arenaUiThemeStateF9W2c.lastSignature = signature;
  arenaUiThemeStateF9W2c.resolved = { ...resolved, key, label:theme.label };
  if (options.annotate !== false) arenaUiThemeAnnotateDomF9W2c();
  return arenaUiThemeStateF9W2c.resolved;
}

function arenaUiThemeSyncF9W2c(options={}) {
  const resolved = arenaUiThemeResolveF9W2c();
  const signature = [resolved.key,resolved.scope,resolved.source,resolved.side,resolved.faction].join("|");
  if (options.force !== true && signature === arenaUiThemeStateF9W2c.lastSignature) return arenaUiThemeStateF9W2c.resolved;
  return arenaUiThemeApplyResolvedF9W2c(resolved, options);
}

function arenaUiThemeWrapGlobalFunctionF9W2c(name) {
  const root = typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : null);
  if (!root || typeof root[name] !== "function" || root[name].__arenaUiThemeF9W2c) return false;
  const original = root[name];
  const wrapped = function() {
    const result = original.apply(this, arguments);
    const sync = () => { try { arenaUiThemeSyncF9W2c({ reason:name }); } catch (_) {} };
    if (result && typeof result.then === "function") {
      try { result.finally(sync); } catch (_) { sync(); }
    } else sync();
    return result;
  };
  wrapped.__arenaUiThemeF9W2c = true;
  wrapped.__arenaUiThemeOriginal = original;
  root[name] = wrapped;
  return true;
}

function arenaUiThemeInstallHooksF9W2c() {
  if (!arenaUiThemeStateF9W2c.hooksInstalled) {
    arenaUiThemeStateF9W2c.hooksInstalled = true;
    if (typeof arenaMenuThemeApplyF9W2b === "function" && !arenaMenuThemeApplyF9W2b.__arenaUiThemeF9W2c) {
      const originalMenuApply = arenaMenuThemeApplyF9W2b;
      arenaMenuThemeApplyF9W2b = function(value, options={}) {
        const result = originalMenuApply.call(this, value, options);
        if (arenaUiThemeStateF9W2c.initialized) arenaUiThemeSyncF9W2c({ force:true, reason:"global-theme-change" });
        return result;
      };
      arenaMenuThemeApplyF9W2b.__arenaUiThemeF9W2c = true;
      arenaMenuThemeApplyF9W2b.__arenaUiThemeOriginal = originalMenuApply;
      try { globalThis.arenaMenuThemeApplyF9W2b = arenaMenuThemeApplyF9W2b; } catch (_) {}
    }
  }
  // Ritenta i hook runtime anche se una funzione non era ancora disponibile
  // alla prima valutazione dello script. Ogni wrapper è idempotente.
  ["setAppScreen","renderAll","newGame"].forEach(arenaUiThemeWrapGlobalFunctionF9W2c);
  return true;
}

function arenaUiThemeSnapshotF9W2c() {
  const resolved = arenaUiThemeStateF9W2c.resolved || arenaUiThemeResolveF9W2c();
  return {
    schemaVersion:ARENA_UI_THEME_SCHEMA_F9W2C,
    scope:"global-shell+game-context",
    selectedGlobalTheme:typeof arenaMenuThemeCurrentF9W2b === "function" ? arenaMenuThemeCurrentF9W2b() : ARENA_MENU_THEME_DEFAULT_F9W2B,
    activeTheme:resolved && resolved.key || ARENA_MENU_THEME_DEFAULT_F9W2B,
    source:resolved && resolved.source || "global-selection",
    activeSide:resolved && resolved.side != null ? Number(resolved.side) : null,
    activeFaction:resolved && resolved.faction || null,
    humanPlayers:Number(resolved && resolved.humanPlayers || 0),
    boardPresentationUntouched:true,
    contrastTokens:true,
    modularSkinSlots:true,
    materialPass:true,
    ornamentalModularity:true,
    scrollPolicyPreserved:true,
    agathoiMaterialToned:true,
    agathoiPaletteReadable:true,
    agathoiTextContrastBoosted:true,
    eightSliceFrameOnly:true,
    crestRemoved:true,
    dividerRemoved:true,
    moduleScaleTokens:true,
    slots:Object.keys(arenaUiThemeAssetSlotsF9W2c(resolved && resolved.key || ARENA_MENU_THEME_DEFAULT_F9W2B))
  };
}

function arenaUiThemeInitializeF9W2c() {
  arenaUiThemeEnsureStylesF9W2c();
  arenaUiThemeInstallHooksF9W2c();
  arenaUiThemeStateF9W2c.initialized = true;
  return arenaUiThemeSyncF9W2c({ force:true, reason:"boot" });
}

try {
  globalThis.arenaUiThemeKeyForFactionF9W2c = arenaUiThemeKeyForFactionF9W2c;
  globalThis.arenaUiThemeResolveF9W2c = arenaUiThemeResolveF9W2c;
  globalThis.arenaUiThemeSyncF9W2c = arenaUiThemeSyncF9W2c;
  globalThis.arenaUiThemeSnapshotF9W2c = arenaUiThemeSnapshotF9W2c;
  globalThis.arenaUiThemeAssetSlotsF9W2c = arenaUiThemeAssetSlotsF9W2c;
} catch (_) {}

arenaUiThemeInstallHooksF9W2c();
// F9W2c END


async function bootArenaRubra() {
  if (typeof document !== "undefined" && document.body) document.body.classList.add("arena-storage-loading");
  try {
    if (typeof arenaDataStoreReady === "function") await arenaDataStoreReady();
    if (typeof arenaMatchDataEnsureTelemetryStoreReadyF9W1a === "function") await arenaMatchDataEnsureTelemetryStoreReadyF9W1a();
  } catch (error) {
    console.warn("Arena Rubra: archivio locale avviato in fallback", error);
  } finally {
    if (typeof document !== "undefined" && document.body) document.body.classList.remove("arena-storage-loading");
  }
  try {
    const migration = arenaMatchDataMigrateLegacyHistoryF9W1a();
    if (migration && migration.migrated && typeof console !== "undefined") console.info("F9W1a Match Data migration", migration);
  } catch (error) {
    console.warn("F9W1a: migrazione Match Data non bloccante fallita", error);
  }
  if (typeof arenaMenuThemeInitializeF9W2b === "function") arenaMenuThemeInitializeF9W2b();
  if (typeof arenaUiThemeInitializeF9W2c === "function") arenaUiThemeInitializeF9W2c();
  refreshCommanderSelects();
  bindUiEvents();
  if (typeof initializeArenaAppShell === "function") initializeArenaAppShell();
  else newGame();
  if (typeof arenaProductProfileInitializeF9W2a === "function") arenaProductProfileInitializeF9W2a();
}

// =====================================================
// F9W2a1 — Snow Battlefield · Official Standard / Classic Map
// Promozione della mappa utente "Snow BF - 4PL - 3x" a contenuto built-in.
// Geometria, terreni, QG, PS, hazard e parametri di movimento sono preservati;
// cambiano soltanto identità/metadata ufficiali e il riferimento allo sfondo statico.
// =====================================================

const F9W2A1_SNOW_BF_OFFICIAL_MAP = Object.freeze({"schemaVersion":1,"id":"map10_snow_bf_4pl_3x","name":"Snow BF - 4PL - 3x","description":"Mappa Standard / Classic per 4 giocatori, formato Large, movimento ×3 e 13 Punti Strategici.","official":true,"editable":false,"enabled":true,"playerCount":4,"movementMultiplier":3,"turnOrder":[1,2,3,4],"geometry":{"type":"triple_hex","nominalRadius":6,"components":[{"id":"hex-a","radius":6,"origin":[-9,0,9],"rotation":0},{"id":"hex-b","radius":6,"origin":[0,0,0],"rotation":0},{"id":"hex-c","radius":6,"origin":[9,0,-9],"rotation":0}],"cells":[{"coord":[-15,0,15],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-15,1,14],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-15,2,13],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-15,3,12],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-15,4,11],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-15,5,10],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-15,6,9],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"headquarters","ownerPlayerId":1,"initialHazard":null},{"coord":[-14,-1,15],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-14,0,14],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-14,1,13],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-14,2,12],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-14,3,11],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-14,4,10],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-14,5,9],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-14,6,8],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-13,-2,15],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-13,-1,14],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-13,0,13],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-13,1,12],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-13,2,11],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"strategic_point","ownerPlayerId":0,"initialHazard":null},{"coord":[-13,3,10],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-13,4,9],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"difficult","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-13,5,8],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-13,6,7],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-12,-3,15],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-12,-2,14],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-12,-1,13],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-12,0,12],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-12,1,11],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-12,2,10],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-12,3,9],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-12,4,8],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-12,5,7],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-12,6,6],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-11,-4,15],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-11,-3,14],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-11,-2,13],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"strategic_point","ownerPlayerId":0,"initialHazard":null},{"coord":[-11,-1,12],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-11,0,11],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"difficult","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-11,1,10],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-11,2,9],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-11,3,8],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-11,4,7],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-11,5,6],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-11,6,5],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-10,-5,15],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-10,-4,14],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-10,-3,13],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-10,-2,12],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-10,-1,11],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-10,0,10],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-10,1,9],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-10,2,8],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-10,3,7],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-10,4,6],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-10,5,5],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-10,6,4],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-9,-6,15],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"headquarters","ownerPlayerId":2,"initialHazard":null},{"coord":[-9,-5,14],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-9,-4,13],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"difficult","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-9,-3,12],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-9,-2,11],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-9,-1,10],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-9,0,9],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-9,1,8],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-9,2,7],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"strategic_point","ownerPlayerId":0,"initialHazard":null},{"coord":[-9,3,6],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-9,4,5],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-9,5,4],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-9,6,3],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-8,-6,14],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-8,-5,13],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-8,-4,12],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-8,-3,11],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-8,-2,10],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-8,-1,9],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-8,0,8],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-8,1,7],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-8,2,6],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-8,3,5],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-8,4,4],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-8,5,3],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-7,-6,13],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-7,-5,12],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-7,-4,11],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-7,-3,10],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-7,-2,9],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"strategic_point","ownerPlayerId":0,"initialHazard":null},{"coord":[-7,-1,8],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-7,0,7],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-7,1,6],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-7,2,5],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-7,3,4],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-7,4,3],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-6,-6,12],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-6,-5,11],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-6,-4,10],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-6,-3,9],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-6,-2,8],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-6,-1,7],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-6,0,6],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-6,1,5],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-6,2,4],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-6,3,3],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-5,-6,11],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-5,-5,10],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-5,-4,9],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-5,-3,8],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-5,-2,7],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-5,-1,6],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-5,0,5],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-5,1,4],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"exposed","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-5,2,3],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-4,-6,10],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-4,-5,9],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-4,-4,8],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-4,-3,7],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-4,-2,6],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-4,-1,5],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"exposed","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-4,0,4],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"free","cellRole":"strategic_point","ownerPlayerId":0,"initialHazard":null},{"coord":[-4,1,3],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-3,-6,9],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-3,-5,8],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-3,-4,7],"componentId":"hex-a","componentIds":["hex-a"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-3,-3,6],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-3,-2,5],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-3,-1,4],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-3,0,3],"componentId":"hex-a","componentIds":["hex-a","hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-6,4,2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-6,5,1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-6,6,0],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-5,3,2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-5,4,1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-5,5,0],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-5,6,-1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-4,2,2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-4,3,1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":{"type":"trap","sourceType":"map","sourceId":"editor-trap--4_3_1","ownerPlayerId":0,"duration":null,"payload":{}}},{"coord":[-4,4,0],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-4,5,-1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-4,6,-2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-3,1,2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-3,2,1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-3,3,0],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-3,4,-1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"exposed","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-3,5,-2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-3,6,-3],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-2,-4,6],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-2,-3,5],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-2,-2,4],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-2,-1,3],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-2,0,2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-2,1,1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-2,2,0],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-2,3,-1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-2,4,-2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"strategic_point","ownerPlayerId":0,"initialHazard":null},{"coord":[-2,5,-3],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-2,6,-4],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-1,-5,6],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-1,-4,5],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-1,-3,4],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":{"type":"trap","sourceType":"map","sourceId":"editor-trap--1_-3_4","ownerPlayerId":0,"duration":null,"payload":{}}},{"coord":[-1,-2,3],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-1,-1,2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-1,0,1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"defensive","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-1,1,0],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"defensive","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-1,2,-1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-1,3,-2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-1,4,-3],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"exposed","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-1,5,-4],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[-1,6,-5],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[0,-6,6],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[0,-5,5],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[0,-4,4],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[0,-3,3],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[0,-2,2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[0,-1,1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"defensive","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[0,0,0],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"strategic_point","ownerPlayerId":0,"initialHazard":null},{"coord":[0,1,-1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"defensive","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[0,2,-2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[0,3,-3],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[0,4,-4],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[0,5,-5],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[0,6,-6],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[1,-6,5],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[1,-5,4],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[1,-4,3],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"exposed","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[1,-3,2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[1,-2,1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[1,-1,0],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"defensive","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[1,0,-1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"defensive","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[1,1,-2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[1,2,-3],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[1,3,-4],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":{"type":"trap","sourceType":"map","sourceId":"editor-trap-1_3_-4","ownerPlayerId":0,"duration":null,"payload":{}}},{"coord":[1,4,-5],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[1,5,-6],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[2,-6,4],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[2,-5,3],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[2,-4,2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"strategic_point","ownerPlayerId":0,"initialHazard":null},{"coord":[2,-3,1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[2,-2,0],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[2,-1,-1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[2,0,-2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[2,1,-3],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[2,2,-4],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[2,3,-5],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[2,4,-6],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[3,-6,3],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[3,-5,2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[3,-4,1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"exposed","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[3,-3,0],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[3,-2,-1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[3,-1,-2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[3,0,-3],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[3,1,-4],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[3,2,-5],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[3,3,-6],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[4,-6,2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[4,-5,1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[4,-4,0],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[4,-3,-1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":{"type":"trap","sourceType":"map","sourceId":"editor-trap-4_-3_-1","ownerPlayerId":0,"duration":null,"payload":{}}},{"coord":[4,-2,-2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[4,-1,-3],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[4,0,-4],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"free","cellRole":"strategic_point","ownerPlayerId":0,"initialHazard":null},{"coord":[4,1,-5],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"exposed","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[4,2,-6],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[5,-6,1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[5,-5,0],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[5,-4,-1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[5,-3,-2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[5,-2,-3],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[5,-1,-4],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"exposed","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[5,0,-5],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[5,1,-6],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[6,-6,0],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[6,-5,-1],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[6,-4,-2],"componentId":"hex-b","componentIds":["hex-b"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[6,-3,-3],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[6,-2,-4],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[6,-1,-5],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[6,0,-6],"componentId":"hex-b","componentIds":["hex-b","hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[3,4,-7],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[3,5,-8],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[3,6,-9],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[4,3,-7],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[4,4,-8],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[4,5,-9],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[4,6,-10],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[5,2,-7],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[5,3,-8],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[5,4,-9],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[5,5,-10],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[5,6,-11],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[6,1,-7],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[6,2,-8],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[6,3,-9],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[6,4,-10],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[6,5,-11],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[6,6,-12],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[7,-4,-3],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[7,-3,-4],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[7,-2,-5],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[7,-1,-6],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[7,0,-7],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[7,1,-8],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[7,2,-9],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"strategic_point","ownerPlayerId":0,"initialHazard":null},{"coord":[7,3,-10],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[7,4,-11],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[7,5,-12],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[7,6,-13],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[8,-5,-3],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[8,-4,-4],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[8,-3,-5],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[8,-2,-6],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[8,-1,-7],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[8,0,-8],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[8,1,-9],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[8,2,-10],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[8,3,-11],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[8,4,-12],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[8,5,-13],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[8,6,-14],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[9,-6,-3],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[9,-5,-4],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[9,-4,-5],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[9,-3,-6],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[9,-2,-7],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"strategic_point","ownerPlayerId":0,"initialHazard":null},{"coord":[9,-1,-8],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[9,0,-9],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[9,1,-10],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[9,2,-11],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[9,3,-12],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[9,4,-13],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"difficult","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[9,5,-14],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[9,6,-15],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"headquarters","ownerPlayerId":3,"initialHazard":null},{"coord":[10,-6,-4],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[10,-5,-5],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[10,-4,-6],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[10,-3,-7],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[10,-2,-8],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[10,-1,-9],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[10,0,-10],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[10,1,-11],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[10,2,-12],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[10,3,-13],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[10,4,-14],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[10,5,-15],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[11,-6,-5],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[11,-5,-6],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[11,-4,-7],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[11,-3,-8],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[11,-2,-9],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[11,-1,-10],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[11,0,-11],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"difficult","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[11,1,-12],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[11,2,-13],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"strategic_point","ownerPlayerId":0,"initialHazard":null},{"coord":[11,3,-14],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[11,4,-15],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[12,-6,-6],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[12,-5,-7],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[12,-4,-8],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[12,-3,-9],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[12,-2,-10],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[12,-1,-11],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[12,0,-12],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[12,1,-13],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[12,2,-14],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[12,3,-15],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[13,-6,-7],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[13,-5,-8],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[13,-4,-9],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"difficult","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[13,-3,-10],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[13,-2,-11],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"strategic_point","ownerPlayerId":0,"initialHazard":null},{"coord":[13,-1,-12],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[13,0,-13],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[13,1,-14],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[13,2,-15],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[14,-6,-8],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[14,-5,-9],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[14,-4,-10],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[14,-3,-11],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[14,-2,-12],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[14,-1,-13],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[14,0,-14],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[14,1,-15],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[15,-6,-9],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"headquarters","ownerPlayerId":4,"initialHazard":null},{"coord":[15,-5,-10],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[15,-4,-11],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[15,-3,-12],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[15,-2,-13],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"free","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[15,-1,-14],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null},{"coord":[15,0,-15],"componentId":"hex-c","componentIds":["hex-c"],"terrainType":"obstacle","cellRole":"normal","ownerPlayerId":0,"initialHazard":null}]},"playerSlots":[{"slotId":1,"headquarters":[-15,6,9],"deployment":{"mode":"hq_network","radius":1}},{"slotId":2,"headquarters":[-9,-6,15],"deployment":{"mode":"hq_network","radius":1}},{"slotId":3,"headquarters":[9,6,-15],"deployment":{"mode":"hq_network","radius":1}},{"slotId":4,"headquarters":[15,-6,-9],"deployment":{"mode":"hq_network","radius":1}}],"strategicPoints":[{"id":"ps-center","coord":[0,0,0],"incomeValue":1,"tags":["central"]},{"id":"ps-2","coord":[-4,0,4],"incomeValue":1,"tags":["custom"]},{"id":"ps-3","coord":[4,0,-4],"incomeValue":1,"tags":["custom"]},{"id":"ps-4","coord":[2,-4,2],"incomeValue":1,"tags":["custom"]},{"id":"ps-5","coord":[-2,4,-2],"incomeValue":1,"tags":["custom"]},{"id":"ps-center-2","coord":[-9,2,7],"incomeValue":1,"tags":["custom"]},{"id":"ps-center-3","coord":[-7,-2,9],"incomeValue":1,"tags":["custom"]},{"id":"ps-8","coord":[9,-2,-7],"incomeValue":1,"tags":["custom"]},{"id":"ps-9","coord":[7,2,-9],"incomeValue":1,"tags":["custom"]},{"id":"ps-10","coord":[-13,2,11],"incomeValue":1,"tags":["custom"]},{"id":"ps-11","coord":[-11,-2,13],"incomeValue":1,"tags":["custom"]},{"id":"ps-12","coord":[13,-2,-11],"incomeValue":1,"tags":["custom"]},{"id":"ps-13","coord":[11,2,-13],"incomeValue":1,"tags":["custom"]}],"centralStrategicPointId":"ps-center","initialHazards":[{"id":"editor-trap--4_3_1","type":"trap","coord":[-4,3,1],"sourceType":"map","sourceId":"editor-trap--4_3_1","ownerPlayerId":0,"duration":null,"payload":{}},{"id":"editor-trap--1_-3_4","type":"trap","coord":[-1,-3,4],"sourceType":"map","sourceId":"editor-trap--1_-3_4","ownerPlayerId":0,"duration":null,"payload":{}},{"id":"editor-trap-1_3_-4","type":"trap","coord":[1,3,-4],"sourceType":"map","sourceId":"editor-trap-1_3_-4","ownerPlayerId":0,"duration":null,"payload":{}},{"id":"editor-trap-4_-3_-1","type":"trap","coord":[4,-3,-1],"sourceType":"map","sourceId":"editor-trap-4_-3_-1","ownerPlayerId":0,"duration":null,"payload":{}}],"presentation":{"skinKey":"red_dust","backgroundKey":null,"backgroundAssetId":"map-bg-snow-bf-4pl-3x","backgroundAssetPath":"assets/maps/backgrounds/snow_bf_4pl_3x.webp","backgroundName":"battlefield.webp","backgroundMime":"image/webp","backgroundWidth":906,"backgroundHeight":1061,"backgroundFit":"cover","backgroundOpacity":0.9,"backgroundScale":1,"backgroundOffsetX":4,"backgroundOffsetY":-1},"metadata":{"author":"Arena Rubra","revision":116,"tags":["official","standard","classic","four-player","4-players","large","triple-hex"],"symmetry":null,"source":"F9W2a1-official-promotion","createdAt":"2026-08-23T22:09:09.226Z","updatedAt":"2026-08-24T00:30:00+02:00","sourceMapId":"custom_triple_mt6bju0j"}});

function arenaOfficialSnowMapCloneF9W2a1() {
  if (typeof mapRuntimeClone === "function") return mapRuntimeClone(F9W2A1_SNOW_BF_OFFICIAL_MAP);
  return JSON.parse(JSON.stringify(F9W2A1_SNOW_BF_OFFICIAL_MAP));
}

function arenaInstallOfficialSnowMapF9W2a1() {
  const root = typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : null);
  if (!root || root.__arenaOfficialSnowMapF9W2a1Installed) return Boolean(root);

  const originalBuiltin = root.getBuiltinMapDefinitions;
  if (typeof originalBuiltin === "function" && !originalBuiltin.__f9w2a1SnowMapWrapped) {
    const wrappedBuiltin = function(options={}) {
      const list = originalBuiltin.apply(this, arguments);
      const out = Array.isArray(list) ? list : [];
      if (!out.some(definition => definition && definition.id === F9W2A1_SNOW_BF_OFFICIAL_MAP.id)) {
        out.push(arenaOfficialSnowMapCloneF9W2a1());
      }
      return out;
    };
    wrappedBuiltin.__f9w2a1SnowMapWrapped = true;
    wrappedBuiltin.__f9w2a1SnowMapOriginal = originalBuiltin;
    root.getBuiltinMapDefinitions = wrappedBuiltin;
  }

  const originalGetById = root.getMapDefinitionById;
  if (typeof originalGetById === "function" && !originalGetById.__f9w2a1SnowMapWrapped) {
    const wrappedGetById = function(mapId, options={}) {
      const normalizedId = typeof mapRuntimeSafeId === "function"
        ? mapRuntimeSafeId(mapId || "", "")
        : String(mapId || "");
      if (normalizedId === F9W2A1_SNOW_BF_OFFICIAL_MAP.id) return arenaOfficialSnowMapCloneF9W2a1();
      return originalGetById.apply(this, arguments);
    };
    wrappedGetById.__f9w2a1SnowMapWrapped = true;
    wrappedGetById.__f9w2a1SnowMapOriginal = originalGetById;
    root.getMapDefinitionById = wrappedGetById;
  }

  root.__arenaOfficialSnowMapF9W2a1Installed = true;
  return true;
}

arenaInstallOfficialSnowMapF9W2a1();

// F9W2a1 END

bootArenaRubra();
