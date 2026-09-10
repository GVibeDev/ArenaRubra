"use strict";

// AR-AC1 - pressure and round-limit rules boundary.
// Mutable game state and observable side effects are supplied as explicit ports;
// src/rules.js retains the historical global facade used by the runtime.
function createPressureVictoryService(dependencies = {}) {
  const {
    getState,
    getActiveMapDefinition,
    getCentralStrategicPoint,
    sameCoord,
    isPsLocked,
    updateControlFromOccupants,
    getActivePlayers,
    mapRuntimePlayerIds,
    countControlledPS,
    playerName,
    pressureMapScale,
    pressureStartRound,
    pressureWinLimit,
    maxRoundLimit,
    combatUnits,
    recordPressureEvaluation,
    emitGameEvent,
    getEventTypes,
    log,
    setWinner
  } = dependencies;

  const currentState = () => getState();

  function totalStrategicPoints() {
    const state = currentState();
    if (state && Array.isArray(state.cells)) return state.cells.filter(cell => cell && cell.ps).length;
    const definition = getActiveMapDefinition();
    return definition && Array.isArray(definition.strategicPoints) ? definition.strategicPoints.length : 0;
  }

  function pressureControlThreshold(totalPs = totalStrategicPoints()) {
    const total = Math.max(0, Math.trunc(Number(totalPs) || 0));
    return total ? Math.ceil(total / 2) : 0;
  }

  function pressureRuleProfile() {
    const state = currentState();
    const definition = getActiveMapDefinition() || (state && state.mapDefinition ? state.mapDefinition : null);
    const totalPs = totalStrategicPoints();
    const central = getCentralStrategicPoint(definition);
    return {
      totalPs,
      requiredPs: pressureControlThreshold(totalPs),
      mode: "central_half",
      centralStrategicPointId: central ? central.id : null,
      centralCoord: central ? [...central.coord] : null,
      startRound: pressureStartRound(),
      pressureWin: pressureWinLimit(),
      maxRound: maxRoundLimit(),
      scale: pressureMapScale()
    };
  }

  function playerControlsCentralStrategicPoint(player, profile = pressureRuleProfile()) {
    const state = currentState();
    if (!profile || !Array.isArray(profile.centralCoord) || !state || !Array.isArray(state.cells)) return false;
    const cell = state.cells.find(entry => entry && entry.ps && sameCoord(entry.coord, profile.centralCoord));
    return Boolean(cell && !isPsLocked(cell.coord) && cell.control === player);
  }

  function pressureRequirementSummary() {
    const profile = pressureRuleProfile();
    const center = profile.centralCoord ? `[${profile.centralCoord.join(",")}]` : "non designato";
    return `Pressione dal round ${profile.startRound}: PS centrale ${center} incluso in ${profile.requiredPs}/${profile.totalPs} PS · vittoria ${profile.pressureWin} · limite R${profile.maxRound}`;
  }

  function resolveEndOfRound() {
    const state = currentState();
    updateControlFromOccupants();
    const profile = pressureRuleProfile();
    if (state.turn >= profile.startRound) {
      const activePlayers = getActivePlayers();
      const standings = activePlayers
        .map(player => ({
          player,
          ps: countControlledPS(player),
          controlsCentral: playerControlsCentralStrategicPoint(player, profile)
        }))
        .sort((a, b) => b.ps - a.ps || a.player - b.player);
      for (const entry of standings) entry.pressure = Number(state.pressure[entry.player] || 0);
      const qualified = standings.filter(entry => entry.controlsCentral && entry.ps >= profile.requiredPs);
      const advancingPlayer = qualified.length === 1 ? qualified[0] : null;
      const allPlayers = mapRuntimePlayerIds(state);
      const eliminatedPlayers = allPlayers.filter(player => !activePlayers.includes(player));
      const pressureOutcome = advancingPlayer ? "advanced" : (qualified.length > 1 ? "tie" : "unqualified");
      const pressureEvaluation = recordPressureEvaluation({
        round: state.turn,
        activePlayers,
        eliminatedPlayers,
        qualifiedPlayers: qualified.map(entry => entry.player),
        advancingPlayer: advancingPlayer ? advancingPlayer.player : null,
        outcome: pressureOutcome,
        requiredPs: profile.requiredPs,
        totalPs: profile.totalPs,
        centralStrategicPointId: profile.centralStrategicPointId,
        standings
      });
      const eventTypes = getEventTypes();
      if (emitGameEvent && eventTypes.PRESSURE_EVALUATED) emitGameEvent({
        type: eventTypes.PRESSURE_EVALUATED,
        message: "",
        data: pressureEvaluation || {
          round: state.turn, activePlayers, eliminatedPlayers,
          qualifiedPlayers: qualified.map(entry => entry.player),
          advancingPlayer: advancingPlayer ? advancingPlayer.player : null,
          outcome: pressureOutcome, requiredPs: profile.requiredPs, totalPs: profile.totalPs,
          centralStrategicPointId: profile.centralStrategicPointId, standings
        }
      });

      if (!advancingPlayer) {
        const centralOwner = standings.find(entry => entry.controlsCentral);
        const centerText = centralOwner ? `G${centralOwner.player}` : "nessuno";
        log(`Pressione Strategica: servono il PS centrale e almeno ${profile.requiredPs}/${profile.totalPs} PS; centro controllato da ${centerText}. Situazione: ${standings.map(entry => `G${entry.player}:${entry.ps}${entry.controlsCentral ? "★" : ""}`).join(" · ")}.`);
      } else {
        const previous = state.pressure[advancingPlayer.player] || 0;
        state.pressure[advancingPlayer.player] = previous + 1;
        log(`Pressione Strategica: ${playerName(advancingPlayer.player)} controlla il PS centrale e ${advancingPlayer.ps}/${profile.totalPs} PS (soglia ${profile.requiredPs}), salendo a ${state.pressure[advancingPlayer.player]}/${profile.pressureWin}.`, eventTypes.PRESSURE_CHANGED, {
          player: advancingPlayer.player,
          faction: state.factions[advancingPlayer.player],
          previous,
          current: state.pressure[advancingPlayer.player],
          delta: 1,
          limit: profile.pressureWin,
          controlledPs: advancingPlayer.ps,
          totalPs: profile.totalPs,
          requiredPs: profile.requiredPs,
          controlsCentral: true,
          centralStrategicPointId: profile.centralStrategicPointId,
          centralCoord: profile.centralCoord,
          pressureRule: profile.mode,
          standings,
          activePlayers,
          eliminatedPlayers,
          qualifiedPlayers: qualified.map(entry => entry.player),
          attribution: pressureEvaluation,
          round: state.turn
        });
      }

      const pressureWinner = standings.find(entry => (state.pressure[entry.player] || 0) >= profile.pressureWin);
      if (pressureWinner) {
        setWinner(`Vittoria ${playerName(pressureWinner.player)} per dominio operativo: Pressione Strategica ${state.pressure[pressureWinner.player]}/${profile.pressureWin}.`, {
          winner: pressureWinner.player,
          type: "pressione",
          pressureAttribution: pressureEvaluation
        });
      }
    }
    if (!state.winner && state.turn >= profile.maxRound) resolveRoundLimit();
  }

  function resolveRoundLimit() {
    const state = currentState();
    const limit = maxRoundLimit();
    const activePlayers = getActivePlayers();
    const ranked = activePlayers.map(player => ({
      player,
      ps: countControlledPS(player),
      units: combatUnits(player).length,
      ene: state.energy[player]
    })).sort((a, b) => b.ps - a.ps || b.units - a.units || b.ene - a.ene || a.player - b.player);
    const first = ranked[0];
    const second = ranked[1];
    const winner = first && (!second || first.ps !== second.ps || first.units !== second.units || first.ene !== second.ene)
      ? first.player
      : null;
    let reason = "";
    if (winner && (!second || first.ps !== second.ps)) reason = `più PS controllati (${first.ps})`;
    else if (winner && first.units !== second.units) reason = `più unità in campo (${first.units})`;
    else if (winner) reason = `più ENE non spesa (${first.ene})`;
    if (winner) setWinner(`Vittoria ${playerName(winner)} allo spareggio del round ${limit}: ${reason}.`, { winner, type: "spareggio" });
    else setWinner(`Pareggio tecnico al round ${limit}: PS, unità ed ENE sono equivalenti.`, { winner: null, type: "pareggio" });
  }

  return Object.freeze({
    totalStrategicPoints,
    pressureControlThreshold,
    pressureRuleProfile,
    playerControlsCentralStrategicPoint,
    pressureRequirementSummary,
    resolveEndOfRound,
    resolveRoundLimit
  });
}
