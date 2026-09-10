"use strict";

// AR-AC1 - winner, elimination, concession and auto-resign boundary.
// The service owns orchestration only; lifecycle cleanup, attribution, turn
// advancement, persistence and presentation remain injected capabilities.
function createVictoryLifecycleService(dependencies = {}) {
  const {
    getState,
    getEventTypes,
    playerName,
    mapRuntimePlayerIds,
    playerLifecycleMarkWinner,
    log,
    attributionSnapshot,
    recordMatchResult,
    renderMatchupStats,
    audioHandleMatchEnd,
    resolvePlayerEliminationAttribution,
    playerLifecycleCleanupElimination,
    playerLifecycleRecord,
    combatUnits,
    updateControlFromOccupants,
    getActivePlayers,
    isPlayerEliminated,
    enemyOf,
    enemyCombatUnits,
    getEnemyPlayers,
    getHq,
    getUnitAt,
    countControlledPS,
    hexDistance,
    autoResignRound,
    autoResignStreak,
    canEndTurn,
    endTurn,
    renderAll
  } = dependencies;

  const currentState = () => getState();

  function inferWinnerSide(message) {
    const state = currentState();
    if (!state) return null;
    for (const player of mapRuntimePlayerIds(state)) {
      if (message.includes(`Vittoria ${playerName(player)}`)) return player;
    }
    return null;
  }

  function inferWinType(message) {
    const normalized = String(message).toLowerCase();
    if (normalized.includes("pressione") || normalized.includes("dominio operativo")) return "pressione";
    if (normalized.includes("qg")) return "qg";
    if (normalized.includes("spareggio")) return "spareggio";
    if (normalized.includes("resa tecnica")) return "resa_tecnica";
    if (normalized.includes("concede")) return "concessione";
    if (normalized.includes("pareggio")) return "pareggio";
    return "altro";
  }

  function setWinner(message, meta = {}) {
    const state = currentState();
    if (state.winner) return;
    state.winner = message;
    state.winnerSide = Object.prototype.hasOwnProperty.call(meta, "winner") ? meta.winner : inferWinnerSide(message);
    state.winType = meta.type || inferWinType(message);
    if (state.winnerSide) playerLifecycleMarkWinner(state.winnerSide);
    const eventTypes = getEventTypes();
    log(message, eventTypes.VICTORY, {
      ...meta,
      winner: state.winnerSide,
      winnerFaction: state.winnerSide ? state.factions[state.winnerSide] : null,
      winType: state.winType,
      round: state.turn,
      message,
      attributionSnapshot: attributionSnapshot()
    });
    recordMatchResult();
    renderMatchupStats();
    audioHandleMatchEnd({
      winnerSide: state.winnerSide,
      winType: state.winType,
      modes: state.modes,
      factions: state.factions,
      round: state.turn
    });
  }

  function eliminatePlayer(player, conqueror = null, reason = "eliminazione") {
    const state = currentState();
    if (!state || state.winner || isPlayerEliminated(player)) return false;
    const attribution = resolvePlayerEliminationAttribution(player, conqueror, reason) || {
      killerSide: Number(conqueror) || null,
      conqueror: Number(conqueror) || null,
      assistSides: [],
      attributionType: "direct",
      reason
    };
    const creditedConqueror = attribution.killerSide || null;
    const summary = playerLifecycleCleanupElimination(player, creditedConqueror, reason);
    if (summary) {
      summary.attribution = attribution;
      const lifecycleRecord = playerLifecycleRecord(player);
      if (lifecycleRecord) {
        lifecycleRecord.eliminatedBy = creditedConqueror;
        lifecycleRecord.eliminationAssistSides = [...(attribution.assistSides || [])];
        lifecycleRecord.eliminationAttributionType = attribution.attributionType || null;
      }
    }
    if (!summary) {
      const record = Array.isArray(state.players) ? state.players.find(entry => Number(entry.id) === Number(player)) : null;
      if (record) {
        record.eliminated = true;
        record.eliminatedAtTurn = state.turn;
        record.eliminationReason = reason;
      }
      combatUnits(player).forEach(unit => {
        unit.alive = false;
        unit.acted = true;
        unit.pos = null;
      });
      updateControlFromOccupants();
    }
    const assistText = attribution.assistSides && attribution.assistSides.length
      ? ` · assist ${attribution.assistSides.map(side => playerName(side)).join(", ")}`
      : "";
    const eventTypes = getEventTypes();
    log(`${playerName(player)} è eliminato${creditedConqueror ? ` da ${playerName(creditedConqueror)}` : ""}${assistText} (${reason}).`, (eventTypes.PLAYER_ELIMINATED || eventTypes.LOG_MESSAGE), {
      player,
      faction: state.factions[player],
      conqueror: creditedConqueror,
      killerSide: creditedConqueror,
      conquerorFaction: creditedConqueror ? state.factions[creditedConqueror] : null,
      assistSides: [...(attribution.assistSides || [])],
      attributionType: attribution.attributionType,
      attribution,
      reason,
      cleanup: summary,
      activePlayers: getActivePlayers(),
      round: state.turn
    });
    const survivors = getActivePlayers();
    if (survivors.length === 1) {
      const winner = survivors[0];
      setWinner(`Vittoria ${playerName(winner)}: ultimo giocatore attivo sulla mappa.`, {
        winner,
        type: reason === "concessione" ? "concessione" : "eliminazione"
      });
    }
    return true;
  }

  function maybeAutoResign(player) {
    const state = currentState();
    if (!state || state.winner || !state.autoResignEnabled) return;
    if (state.modes[player] !== "bot" || state.turn < autoResignRound() || isPlayerEliminated(player)) return;
    const enemy = enemyOf(player);
    const ownUnits = combatUnits(player);
    const enemyUnits = enemyCombatUnits(player, enemy);
    const enemyHq = getHq(enemy);
    const noReach = !enemyHq || ownUnits.length === 0 || ownUnits.every(unit => hexDistance(unit.pos, enemyHq.pos) > 3);
    const enemyPsLead = Math.max(0, ...getEnemyPlayers(player, enemy).map(id => countControlledPS(id)));
    const hopeless = countControlledPS(player) === 0 && enemyPsLead >= 2 && ownUnits.length * 2 < Math.max(enemyUnits.length, 1) && noReach;
    state.desperation[player] = hopeless ? (state.desperation[player] || 0) + 1 : 0;
    if (state.desperation[player] >= autoResignStreak()) eliminatePlayer(player, null, "resa_tecnica");
  }

  function concedeMatch(player) {
    const state = currentState();
    if (!state || state.winner) return;
    eliminatePlayer(player, null, "concessione");
    if (!state.winner && Number(state.currentPlayer) === Number(player) && canEndTurn()) endTurn({ eliminatedCurrent:true });
    else renderAll();
  }

  function checkVictory() {
    const state = currentState();
    if (state.winner) return;
    const activePlayers = getActivePlayers();
    for (const defender of activePlayers) {
      const hq = getHq(defender);
      const occupant = hq ? getUnitAt(hq.pos) : null;
      if (occupant && occupant.side !== defender && countControlledPS(occupant.side) >= 1) {
        eliminatePlayer(defender, occupant.side, "qg");
      }
    }
    const survivors = getActivePlayers();
    if (!state.winner && survivors.length === 1) {
      const winner = survivors[0];
      setWinner(`Vittoria ${playerName(winner)}: ultimo giocatore attivo sulla mappa.`, { winner, type:"eliminazione" });
    }
  }

  return Object.freeze({
    setWinner,
    inferWinnerSide,
    inferWinType,
    eliminatePlayer,
    maybeAutoResign,
    concedeMatch,
    checkVictory
  });
}
