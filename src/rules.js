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


let VICTORY_LIFECYCLE_SERVICE = null;

function victoryLifecycleService() {
  if (!VICTORY_LIFECYCLE_SERVICE) {
    VICTORY_LIFECYCLE_SERVICE = createVictoryLifecycleService({
      getState: () => state,
      getEventTypes: () => typeof EventTypes !== "undefined" ? EventTypes : {},
      playerName: player => playerName(player),
      mapRuntimePlayerIds: source => typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(source) : [1, 2],
      playerLifecycleMarkWinner: player => { if (typeof playerLifecycleMarkWinner === "function") playerLifecycleMarkWinner(player); },
      log: (message, type, data) => log(message, type, data),
      attributionSnapshot: () => typeof ffaAttributionSnapshot === "function" ? ffaAttributionSnapshot() : null,
      recordMatchResult: () => recordMatchResult(),
      renderMatchupStats: () => renderMatchupStats(),
      audioHandleMatchEnd: payload => { if (typeof arenaAudioHandleMatchEnd === "function") arenaAudioHandleMatchEnd(payload); },
      resolvePlayerEliminationAttribution: (player, conqueror, reason) => typeof ffaAttributionResolvePlayerElimination === "function"
        ? ffaAttributionResolvePlayerElimination(player, conqueror, reason)
        : null,
      playerLifecycleCleanupElimination: (player, conqueror, reason) => typeof playerLifecycleCleanupElimination === "function"
        ? playerLifecycleCleanupElimination(player, conqueror, reason)
        : null,
      playerLifecycleRecord: player => typeof playerLifecycleRecord === "function" ? playerLifecycleRecord(player) : null,
      combatUnits: player => combatUnits(player),
      updateControlFromOccupants: () => updateControlFromOccupants(),
      getActivePlayers: () => typeof getActivePlayers === "function" ? getActivePlayers() : [1, 2],
      isPlayerEliminated: player => typeof isPlayerEliminated === "function" ? isPlayerEliminated(player) : false,
      enemyOf: player => enemyOf(player),
      enemyCombatUnits: (player, enemy) => typeof enemyCombatUnits === "function" ? enemyCombatUnits(player) : combatUnits(enemy),
      getEnemyPlayers: (player, enemy) => typeof getEnemyPlayers === "function" ? getEnemyPlayers(player) : [enemy],
      getHq: player => getHq(player),
      getUnitAt: coord => getUnitAt(coord),
      countControlledPS: player => countControlledPS(player),
      hexDistance: (a, b) => hexDistance(a, b),
      autoResignRound: () => AUTO_RESIGN_ROUND,
      autoResignStreak: () => AUTO_RESIGN_STREAK,
      canEndTurn: () => typeof endTurn === "function",
      endTurn: options => endTurn(options),
      renderAll: () => renderAll()
    });
  }
  return VICTORY_LIFECYCLE_SERVICE;
}

function setWinner(message, meta = {}) { return victoryLifecycleService().setWinner(message, meta); }
function inferWinnerSide(message) { return victoryLifecycleService().inferWinnerSide(message); }
function inferWinType(message) { return victoryLifecycleService().inferWinType(message); }
function eliminatePlayer(player, conqueror = null, reason = "eliminazione") { return victoryLifecycleService().eliminatePlayer(player, conqueror, reason); }
function maybeAutoResign(player) { return victoryLifecycleService().maybeAutoResign(player); }
function concedeMatch(player) { return victoryLifecycleService().concedeMatch(player); }
function checkVictory() { return victoryLifecycleService().checkVictory(); }

// =====================================================
// F9R3 - Pressione proporzionale e PS centrale semantico.
// Rapida: parte al round 20, 5 incrementi, limite 30+C.
// Standard: parte al round 20+C, 7 incrementi, limite 50.
// C = ceil((PS totali + giocatori) / 2).
// Per avanzare: PS centrale + almeno ceil(PS totali / 2) PS complessivi.
// =====================================================

let PRESSURE_VICTORY_SERVICE = null;

function pressureVictoryService() {
  if (!PRESSURE_VICTORY_SERVICE) {
    PRESSURE_VICTORY_SERVICE = createPressureVictoryService({
      getState: () => state,
      getActiveMapDefinition: () => typeof getActiveMapDefinition === "function" ? getActiveMapDefinition() : (state && state.mapDefinition ? state.mapDefinition : null),
      getCentralStrategicPoint: definition => typeof getCentralStrategicPoint === "function" ? getCentralStrategicPoint(definition) : null,
      sameCoord: (a, b) => sameCoord(a, b),
      isPsLocked: coord => isPsLocked(coord),
      updateControlFromOccupants: () => updateControlFromOccupants(),
      getActivePlayers: () => typeof getActivePlayers === "function" ? getActivePlayers() : [1, 2],
      mapRuntimePlayerIds: source => typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(source) : [1, 2],
      countControlledPS: player => countControlledPS(player),
      playerName: player => playerName(player),
      pressureMapScale: () => typeof pressureMapScale === "function" ? pressureMapScale() : 0,
      pressureStartRound: () => typeof pressureStartRound === "function" ? pressureStartRound() : 20,
      pressureWinLimit: () => typeof pressureWinLimit === "function" ? pressureWinLimit() : PRESSURE_WIN,
      maxRoundLimit: () => typeof maxRoundLimit === "function" ? maxRoundLimit() : MAX_ROUND,
      combatUnits: player => combatUnits(player),
      recordPressureEvaluation: payload => typeof ffaAttributionRecordPressureEvaluation === "function" ? ffaAttributionRecordPressureEvaluation(payload) : null,
      emitGameEvent: event => typeof emitGameEvent === "function" ? emitGameEvent(event) : null,
      getEventTypes: () => typeof EventTypes !== "undefined" ? EventTypes : {},
      log: (message, type, data) => log(message, type, data),
      setWinner: (message, meta) => setWinner(message, meta)
    });
  }
  return PRESSURE_VICTORY_SERVICE;
}

function totalStrategicPoints() { return pressureVictoryService().totalStrategicPoints(); }
function pressureControlThreshold(totalPs = totalStrategicPoints()) { return pressureVictoryService().pressureControlThreshold(totalPs); }
function pressureRuleProfile() { return pressureVictoryService().pressureRuleProfile(); }
function playerControlsCentralStrategicPoint(player, profile = pressureRuleProfile()) { return pressureVictoryService().playerControlsCentralStrategicPoint(player, profile); }
function pressureRequirementSummary() { return pressureVictoryService().pressureRequirementSummary(); }

// =====================================================
// F9Q1/F9Q2 - adattatori multiplayer FFA.
// Le dichiarazioni seguenti sostituiscono gli omonimi legacy a due giocatori
// senza alterare il percorso dati MAP1.
// =====================================================

function resolveEndOfRound() { return pressureVictoryService().resolveEndOfRound(); }

function resolveRoundLimit() { return pressureVictoryService().resolveRoundLimit(); }
