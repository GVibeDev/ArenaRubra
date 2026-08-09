"use strict";

// Arena Rubra – Fase B4c
// Rules extraction prudente.
// Questo file contiene:
// - helper generali di accesso stato/identità;
// - regole PS/QG;
// - pressione strategica;
// - vittoria/concessione/resa tecnica.
// Non contiene ancora combattimento, economia, stati, abilità o AI.


// =====================================================
// B4b – Rules/access helpers
// =====================================================

function getSelectedUnit() { return state && Array.isArray(state.units) ? state.units.find(u => u.uid === selectedId && u.alive && u.pos) || null : null; }
    function getCellAt(coord) {
      if (typeof getMapCell === "function") return getMapCell(coord);
      return state.cells.find(c => sameCoord(c.coord, coord)) || null;
    }
    function isFieldUnit(u) { return Boolean(u && u.alive === true && u.currentHp > 0 && Array.isArray(u.pos) && u.type !== "QG"); }
    function getUnitAt(coord) { return state.units.find(u => isFieldUnit(u) && sameCoord(u.pos, coord)) || null; }
    function getHq(side) { return state.units.find(u => u.side === side && u.type === "QG"); }
    function combatUnits(side=null) { return state.units.filter(u => isFieldUnit(u) && (side === null || u.side === side)); }
    function activeCombatUnits(side) { return combatUnits(side).filter(u => canAct(u)); }
    function hasAnyCombatUnits(side) { return combatUnits(side).length > 0; }
    function structureBlueprintFor(side) { return BLUEPRINTS.find(u => u.faction === state.factions[side] && u.type === "Struttura") || null; }
    function blueprintById(id, faction) { return BLUEPRINTS.find(u => u.id === id && u.faction === faction) || null; }
    function enemyOf(side) {
      const enemies = typeof getEnemyPlayers === "function" ? getEnemyPlayers(side) : (side === 1 ? [2] : [1]);
      if (!enemies.length) return side === 1 ? 2 : 1;
      if (enemies.length === 1) return enemies[0];
      if (typeof selectAiTargetPlayer === "function") return selectAiTargetPlayer(side, { reason: "enemyOf-adapter" });
      const ownHq = getHq(side);
      return enemies
        .map(enemy => {
          const enemyHq = getHq(enemy);
          return {
            enemy,
            distance: ownHq && enemyHq ? hexDistance(ownHq.pos, enemyHq.pos) : Infinity,
            ps: countControlledPS(enemy),
            pressure: state.pressure[enemy] || 0
          };
        })
        .sort((a, b) => a.distance - b.distance || b.ps - a.ps || b.pressure - a.pressure || a.enemy - b.enemy)[0].enemy;
    }
    function factionMeta(faction) { return FACTIONS[faction] || FACTIONS.Nexus; }
    function factionMetaBySide(side) { return factionMeta(state.factions[side]); }
    function playerName(side) { return `G${side} ${state.factions[side]}`; }
    function effectiveLife(u) {
      const defense = typeof getEffectiveDefense === "function" ? getEffectiveDefense(u) : u.currentDef;
      return u.currentHp + defense;
    }
    function isInsideMap(coord) { return state.cells.some(c => sameCoord(c.coord, coord)); }


// =====================================================
// B4c – PS control / locks
// =====================================================

function isPsLocked(coord) { return Boolean(state && state.psLocks && state.psLocks.some(l => sameCoord(l.coord, coord))); }
    function addPsLock(owner, coord, source) {
      if (!state.psLocks) state.psLocks = [];
      const existing = state.psLocks.find(l => sameCoord(l.coord, coord));
      if (existing) {
        existing.owner = owner;
        existing.source = source || existing.source;
      } else {
        state.psLocks.push({ owner, coord:[...coord], source:source || "Blocco PS" });
      }
      updateControlFromOccupants();
      log(`Il Punto Strategico [${coord.join(",")}] viene bloccato da ${source || "effetto Fabeot"} fino al prossimo turno di ${playerName(owner)}.`);
    }
    function tickPsLocksAtStart(player) {
      if (!state.psLocks || !state.psLocks.length) return;
      const before = state.psLocks.length;
      const removed = state.psLocks.filter(l => l.owner === player);
      state.psLocks = state.psLocks.filter(l => l.owner !== player);
      for (const l of removed) log(`Il blocco sul Punto Strategico [${l.coord.join(",")}] termina.`);
      if (before !== state.psLocks.length) updateControlFromOccupants();
    }

    function updateControlFromOccupants() {
      for (const cell of state.cells) {
        if (!cell.ps) continue;
        const previousControl = cell.control ?? null;
        let nextControl = null;
        let occupant = null;
        let locked = false;

        if (isPsLocked(cell.coord)) {
          locked = true;
        } else {
          occupant = getUnitAt(cell.coord);
          nextControl = occupant && occupant.type !== "QG" ? occupant.side : null;
        }

        cell.control = nextControl;

        if (previousControl !== nextControl && typeof emitGameEvent === "function") {
          emitGameEvent({
            type: EventTypes.PS_CONTROL_CHANGED,
            message: "",
            data: {
              coord: [...cell.coord],
              previousControl,
              nextControl,
              locked,
              occupantId: occupant ? occupant.uid : null,
              occupantName: occupant ? occupant.name : null,
              round: state.turn
            }
          });
        }
      }
    }
    function removeDeadControl() { updateControlFromOccupants(); }
    function countControlledPS(player) { return state.cells.filter(c => c.ps && !isPsLocked(c.coord) && c.control === player).length; }


// =====================================================
// B4c – Pressure / round limit
// =====================================================

function resolveEndOfRound() {
      updateControlFromOccupants();
      if (state.turn >= pressureStartRound()) {
        const p1 = countControlledPS(1);
        const p2 = countControlledPS(2);
        if (p1 > p2) {
          const previous = state.pressure[1] || 0;
          state.pressure[1] = previous + 1;
          log(`Pressione Strategica: ${playerName(1)} controlla più PS (${p1}-${p2}) e sale a ${state.pressure[1]}/${PRESSURE_WIN}.`, EventTypes.PRESSURE_CHANGED, {
            player:1, faction:state.factions[1], previous, current:state.pressure[1], delta:1, limit:PRESSURE_WIN, controlledPs:p1, enemyControlledPs:p2, round:state.turn
          });
        } else if (p2 > p1) {
          const previous = state.pressure[2] || 0;
          state.pressure[2] = previous + 1;
          log(`Pressione Strategica: ${playerName(2)} controlla più PS (${p2}-${p1}) e sale a ${state.pressure[2]}/${PRESSURE_WIN}.`, EventTypes.PRESSURE_CHANGED, {
            player:2, faction:state.factions[2], previous, current:state.pressure[2], delta:1, limit:PRESSURE_WIN, controlledPs:p2, enemyControlledPs:p1, round:state.turn
          });
        } else {
          log(`Pressione Strategica: parità PS (${p1}-${p2}), nessuno avanza.`);
        }
        if (state.pressure[1] >= PRESSURE_WIN) setWinner(`Vittoria ${playerName(1)} per dominio operativo: Pressione Strategica ${state.pressure[1]}/${PRESSURE_WIN}.`, { winner:1, type:"pressione" });
        if (state.pressure[2] >= PRESSURE_WIN) setWinner(`Vittoria ${playerName(2)} per dominio operativo: Pressione Strategica ${state.pressure[2]}/${PRESSURE_WIN}.`, { winner:2, type:"pressione" });
      }
      if (!state.winner && state.turn >= MAX_ROUND) resolveRoundLimit();
    }

    function resolveRoundLimit() {
      const metrics = [1,2].map(p => ({
        player:p,
        ps:countControlledPS(p),
        units:combatUnits(p).length,
        ene:state.energy[p]
      }));
      const a = metrics[0], b = metrics[1];
      let winner = null;
      let reason = "";
      if (a.ps !== b.ps) { winner = a.ps > b.ps ? 1 : 2; reason = `più PS controllati (${a.ps}-${b.ps})`; }
      else if (a.units !== b.units) { winner = a.units > b.units ? 1 : 2; reason = `più unità in campo (${a.units}-${b.units})`; }
      else if (a.ene !== b.ene) { winner = a.ene > b.ene ? 1 : 2; reason = `più ENE non spesa (${a.ene}-${b.ene})`; }
      if (winner) setWinner(`Vittoria ${playerName(winner)} allo spareggio del round ${MAX_ROUND}: ${reason}.`, { winner, type:"spareggio" });
      else setWinner(`Pareggio tecnico al round ${MAX_ROUND}: PS, unità ed ENE sono equivalenti.`, { winner:null, type:"pareggio" });
    }


// =====================================================
// B4c – Resign / winner inference
// =====================================================

function maybeAutoResign(player) {
      if (!state || state.winner || !state.autoResignEnabled) return;
      if (state.modes[player] !== "bot" || state.turn < AUTO_RESIGN_ROUND) return;
      const enemy = enemyOf(player);
      const ownUnits = combatUnits(player);
      const enemyUnits = combatUnits(enemy);
      const enemyHq = getHq(enemy);
      const noReach = ownUnits.length === 0 || ownUnits.every(u => hexDistance(u.pos, enemyHq.pos) > 3);
      const hopeless = countControlledPS(player) === 0 && countControlledPS(enemy) >= 2 && ownUnits.length * 2 < Math.max(enemyUnits.length, 1) && noReach;
      state.desperation[player] = hopeless ? (state.desperation[player] || 0) + 1 : 0;
      if (state.desperation[player] >= AUTO_RESIGN_STREAK) {
        setWinner(`${playerName(player)} concede per resa tecnica: 0 PS, forte inferiorità numerica e nessuna pressione sul QG nemico. Vittoria ${playerName(enemy)}.`, { winner:enemy, type:"resa_tecnica" });
      }
    }

    function concedeMatch(player) {
      if (!state || state.winner) return;
      setWinner(`${playerName(player)} concede la partita. Vittoria ${playerName(enemyOf(player))}.`, { winner:enemyOf(player), type:"concessione" });
      renderAll();
    }

    function setWinner(message, meta = {}) {
      if (state.winner) return;
      state.winner = message;
      state.winnerSide = Object.prototype.hasOwnProperty.call(meta, "winner") ? meta.winner : inferWinnerSide(message);
      state.winType = meta.type || inferWinType(message);
      if (state.winnerSide && typeof playerLifecycleMarkWinner === "function") playerLifecycleMarkWinner(state.winnerSide);
      log(message, EventTypes.VICTORY, {
        ...meta,
        winner: state.winnerSide,
        winnerFaction: state.winnerSide ? state.factions[state.winnerSide] : null,
        winType: state.winType,
        round: state.turn,
        message,
        attributionSnapshot: typeof ffaAttributionSnapshot === "function" ? ffaAttributionSnapshot() : null
      });
      recordMatchResult();
      renderMatchupStats();
      if (typeof arenaAudioHandleMatchEnd === "function") {
        arenaAudioHandleMatchEnd({
          winnerSide: state.winnerSide,
          winType: state.winType,
          modes: state.modes,
          factions: state.factions,
          round: state.turn
        });
      }
    }

    function inferWinnerSide(message) {
      if (!state) return null;
      if (message.includes(`Vittoria ${playerName(1)}`)) return 1;
      if (message.includes(`Vittoria ${playerName(2)}`)) return 2;
      return null;
    }

    function inferWinType(message) {
      const m = String(message).toLowerCase();
      if (m.includes("pressione") || m.includes("dominio operativo")) return "pressione";
      if (m.includes("qg")) return "qg";
      if (m.includes("spareggio")) return "spareggio";
      if (m.includes("resa tecnica")) return "resa_tecnica";
      if (m.includes("concede")) return "concessione";
      if (m.includes("pareggio")) return "pareggio";
      return "altro";
    }


// =====================================================
// B4c – QG victory
// =====================================================

function checkVictory() {
      if (state.winner) return;
      for (const player of [1, 2]) {
        const enemy = enemyOf(player);
        const enemyHq = getHq(enemy);
        const occupant = getUnitAt(enemyHq.pos);
        if (occupant && occupant.side === player && countControlledPS(player) >= 1) {
          setWinner(`Vittoria ${playerName(player)}: occupa il QG di ${playerName(enemy)} controllando almeno un PS.`, { winner:player, type:"qg" });
          break;
        }
      }
    }

// =====================================================
// F9R3 - Pressione proporzionale e PS centrale semantico.
// Rapida: parte al round 20, 5 incrementi, limite 30+C.
// Standard: parte al round 20+C, 7 incrementi, limite 50.
// C = ceil((PS totali + giocatori) / 2).
// Per avanzare: PS centrale + almeno ceil(PS totali / 2) PS complessivi.
// =====================================================

function totalStrategicPoints() {
  if (state && Array.isArray(state.cells)) return state.cells.filter(cell => cell && cell.ps).length;
  const definition = typeof getActiveMapDefinition === "function" ? getActiveMapDefinition() : null;
  return definition && Array.isArray(definition.strategicPoints) ? definition.strategicPoints.length : 0;
}

function pressureControlThreshold(totalPs = totalStrategicPoints()) {
  const total = Math.max(0, Math.trunc(Number(totalPs) || 0));
  return total ? Math.ceil(total / 2) : 0;
}

function pressureRuleProfile() {
  const definition = typeof getActiveMapDefinition === "function" ? getActiveMapDefinition() : (state && state.mapDefinition ? state.mapDefinition : null);
  const totalPs = totalStrategicPoints();
  const central = typeof getCentralStrategicPoint === "function" ? getCentralStrategicPoint(definition) : null;
  return {
    totalPs,
    requiredPs: pressureControlThreshold(totalPs),
    mode: "central_half",
    centralStrategicPointId: central ? central.id : null,
    centralCoord: central ? [...central.coord] : null,
    startRound: typeof pressureStartRound === "function" ? pressureStartRound() : 20,
    pressureWin: typeof pressureWinLimit === "function" ? pressureWinLimit() : PRESSURE_WIN,
    maxRound: typeof maxRoundLimit === "function" ? maxRoundLimit() : MAX_ROUND,
    scale: typeof pressureMapScale === "function" ? pressureMapScale() : 0
  };
}

function playerControlsCentralStrategicPoint(player, profile = pressureRuleProfile()) {
  if (!profile || !Array.isArray(profile.centralCoord) || !state || !Array.isArray(state.cells)) return false;
  const cell = state.cells.find(entry => entry && entry.ps && sameCoord(entry.coord, profile.centralCoord));
  return Boolean(cell && !isPsLocked(cell.coord) && cell.control === player);
}

function pressureRequirementSummary() {
  const profile = pressureRuleProfile();
  const center = profile.centralCoord ? `[${profile.centralCoord.join(",")}]` : "non designato";
  return `Pressione dal round ${profile.startRound}: PS centrale ${center} incluso in ${profile.requiredPs}/${profile.totalPs} PS · vittoria ${profile.pressureWin} · limite R${profile.maxRound}`;
}

// =====================================================
// F9Q1/F9Q2 - adattatori multiplayer FFA.
// Le dichiarazioni seguenti sostituiscono gli omonimi legacy a due giocatori
// senza alterare il percorso dati MAP1.
// =====================================================

function resolveEndOfRound() {
  updateControlFromOccupants();
  const profile = pressureRuleProfile();
  if (state.turn >= profile.startRound) {
    const activePlayers = typeof getActivePlayers === "function" ? getActivePlayers() : [1, 2];
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
    const allPlayers = typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(state) : activePlayers;
    const eliminatedPlayers = allPlayers.filter(player => !activePlayers.includes(player));
    const pressureOutcome = advancingPlayer ? "advanced" : (qualified.length > 1 ? "tie" : "unqualified");
    const pressureEvaluation = typeof ffaAttributionRecordPressureEvaluation === "function"
      ? ffaAttributionRecordPressureEvaluation({
          round:state.turn,
          activePlayers,
          eliminatedPlayers,
          qualifiedPlayers:qualified.map(entry => entry.player),
          advancingPlayer:advancingPlayer ? advancingPlayer.player : null,
          outcome:pressureOutcome,
          requiredPs:profile.requiredPs,
          totalPs:profile.totalPs,
          centralStrategicPointId:profile.centralStrategicPointId,
          standings
        })
      : null;
    if (typeof emitGameEvent === "function" && EventTypes.PRESSURE_EVALUATED) emitGameEvent({
      type:EventTypes.PRESSURE_EVALUATED,
      message:"",
      data:pressureEvaluation || {
        round:state.turn, activePlayers, eliminatedPlayers,
        qualifiedPlayers:qualified.map(entry => entry.player),
        advancingPlayer:advancingPlayer ? advancingPlayer.player : null,
        outcome:pressureOutcome, requiredPs:profile.requiredPs, totalPs:profile.totalPs,
        centralStrategicPointId:profile.centralStrategicPointId, standings
      }
    });

    if (!advancingPlayer) {
      const centralOwner = standings.find(entry => entry.controlsCentral);
      const centerText = centralOwner ? `G${centralOwner.player}` : "nessuno";
      log(`Pressione Strategica: servono il PS centrale e almeno ${profile.requiredPs}/${profile.totalPs} PS; centro controllato da ${centerText}. Situazione: ${standings.map(entry => `G${entry.player}:${entry.ps}${entry.controlsCentral ? "★" : ""}`).join(" · ")}.`);
    } else {
      const previous = state.pressure[advancingPlayer.player] || 0;
      state.pressure[advancingPlayer.player] = previous + 1;
      log(`Pressione Strategica: ${playerName(advancingPlayer.player)} controlla il PS centrale e ${advancingPlayer.ps}/${profile.totalPs} PS (soglia ${profile.requiredPs}), salendo a ${state.pressure[advancingPlayer.player]}/${profile.pressureWin}.`, EventTypes.PRESSURE_CHANGED, {
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
        qualifiedPlayers:qualified.map(entry => entry.player),
        attribution:pressureEvaluation,
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
  const limit = typeof maxRoundLimit === "function" ? maxRoundLimit() : MAX_ROUND;
  const activePlayers = typeof getActivePlayers === "function" ? getActivePlayers() : [1, 2];
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

function eliminatePlayer(player, conqueror = null, reason = "eliminazione") {
  if (!state || state.winner || (typeof isPlayerEliminated === "function" && isPlayerEliminated(player))) return false;
  const attribution = typeof ffaAttributionResolvePlayerElimination === "function"
    ? ffaAttributionResolvePlayerElimination(player, conqueror, reason)
    : { killerSide:Number(conqueror) || null, conqueror:Number(conqueror) || null, assistSides:[], attributionType:"direct", reason };
  const creditedConqueror = attribution.killerSide || null;
  const summary = typeof playerLifecycleCleanupElimination === "function"
    ? playerLifecycleCleanupElimination(player, creditedConqueror, reason)
    : null;
  if (summary) {
    summary.attribution = attribution;
    const lifecycleRecord = typeof playerLifecycleRecord === "function" ? playerLifecycleRecord(player) : null;
    if (lifecycleRecord) {
      lifecycleRecord.eliminatedBy = creditedConqueror;
      lifecycleRecord.eliminationAssistSides = [...(attribution.assistSides || [])];
      lifecycleRecord.eliminationAttributionType = attribution.attributionType || null;
    }
  }
  if (!summary) {
    const record = Array.isArray(state.players) ? state.players.find(entry => Number(entry.id) === Number(player)) : null;
    if (record) { record.eliminated = true; record.eliminatedAtTurn = state.turn; record.eliminationReason = reason; }
    combatUnits(player).forEach(unit => { unit.alive = false; unit.acted = true; unit.pos = null; });
    updateControlFromOccupants();
  }
  const assistText = attribution.assistSides && attribution.assistSides.length
    ? ` · assist ${attribution.assistSides.map(side => playerName(side)).join(", ")}`
    : "";
  log(`${playerName(player)} è eliminato${creditedConqueror ? ` da ${playerName(creditedConqueror)}` : ""}${assistText} (${reason}).`, (EventTypes.PLAYER_ELIMINATED || EventTypes.LOG_MESSAGE), {
    player,
    faction:state.factions[player],
    conqueror:creditedConqueror,
    killerSide:creditedConqueror,
    conquerorFaction:creditedConqueror ? state.factions[creditedConqueror] : null,
    assistSides:[...(attribution.assistSides || [])],
    attributionType:attribution.attributionType,
    attribution,
    reason,
    cleanup:summary,
    activePlayers:typeof getActivePlayers === "function" ? getActivePlayers() : [],
    round: state.turn
  });
  const survivors = typeof getActivePlayers === "function" ? getActivePlayers() : [];
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
  if (!state || state.winner || !state.autoResignEnabled) return;
  if (state.modes[player] !== "bot" || state.turn < AUTO_RESIGN_ROUND || (typeof isPlayerEliminated === "function" && isPlayerEliminated(player))) return;
  const enemy = enemyOf(player);
  const ownUnits = combatUnits(player);
  const enemyUnits = typeof enemyCombatUnits === "function" ? enemyCombatUnits(player) : combatUnits(enemy);
  const enemyHq = getHq(enemy);
  const noReach = !enemyHq || ownUnits.length === 0 || ownUnits.every(unit => hexDistance(unit.pos, enemyHq.pos) > 3);
  const enemyPsLead = Math.max(0, ...(typeof getEnemyPlayers === "function" ? getEnemyPlayers(player) : [enemy]).map(id => countControlledPS(id)));
  const hopeless = countControlledPS(player) === 0 && enemyPsLead >= 2 && ownUnits.length * 2 < Math.max(enemyUnits.length, 1) && noReach;
  state.desperation[player] = hopeless ? (state.desperation[player] || 0) + 1 : 0;
  if (state.desperation[player] >= AUTO_RESIGN_STREAK) eliminatePlayer(player, null, "resa_tecnica");
}

function concedeMatch(player) {
  if (!state || state.winner) return;
  eliminatePlayer(player, null, "concessione");
  if (!state.winner && Number(state.currentPlayer) === Number(player) && typeof endTurn === "function") endTurn({ eliminatedCurrent:true });
  else renderAll();
}

function inferWinnerSide(message) {
  if (!state) return null;
  for (const player of (typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(state) : [1, 2])) {
    if (message.includes(`Vittoria ${playerName(player)}`)) return player;
  }
  return null;
}

function checkVictory() {
  if (state.winner) return;
  const activePlayers = typeof getActivePlayers === "function" ? getActivePlayers() : [1, 2];
  for (const defender of activePlayers) {
    const hq = getHq(defender);
    const occupant = hq ? getUnitAt(hq.pos) : null;
    if (occupant && occupant.side !== defender && countControlledPS(occupant.side) >= 1) {
      eliminatePlayer(defender, occupant.side, "qg");
    }
  }
  const survivors = typeof getActivePlayers === "function" ? getActivePlayers() : activePlayers;
  if (!state.winner && survivors.length === 1) {
    const winner = survivors[0];
    setWinner(`Vittoria ${playerName(winner)}: ultimo giocatore attivo sulla mappa.`, { winner, type: "eliminazione" });
  }
}
