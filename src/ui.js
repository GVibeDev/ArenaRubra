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
  refreshCommanderSelects();
  bindUiEvents();
  if (typeof initializeArenaAppShell === "function") initializeArenaAppShell();
  else newGame();
}

bootArenaRubra();
