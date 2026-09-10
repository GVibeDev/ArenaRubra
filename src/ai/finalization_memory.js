"use strict";

// AR-AC1 - stateful F9T0 progress and movement-history memory.
// Memory storage and optional telemetry effects enter through explicit ports.
function createAiFinalizationMemoryService(dependencies = {}) {
  const {
    hasGameState,
    getFinalizationMemory,
    setFinalizationMemory,
    getRound,
    getPressure,
    getEnemyOf,
    getHq,
    getCombatUnits,
    getHexDistance,
    getControlledPsCount,
    areSameCoord,
    recordMaxStalledRounds,
    recordOscillationMove
  } = dependencies;

  function ensureAiFinalizationMemoryF9T0() {
    if (!hasGameState()) return null;
    let memory = getFinalizationMemory();
    if (!memory || typeof memory !== "object") {
      memory = { schema:"F9T0-1", players:{}, unitHistory:{} };
      setFinalizationMemory(memory);
    }
    if (!memory.players) memory.players = {};
    if (!memory.unitHistory) memory.unitHistory = {};
    return memory;
  }

  function botProgressSnapshotF9T0(player) {
    const enemy = getEnemyOf(player);
    const ownHq = getHq(player);
    const enemyHq = getHq(enemy);
    const ownUnits = getCombatUnits(player);
    const enemyUnits = getCombatUnits(enemy);
    const mobile = ownUnits.filter(unit => unit.type !== "Struttura" && unit.type !== "QG");
    const closestEnemyHqDistance = enemyHq && mobile.length ? Math.min(...mobile.map(unit => getHexDistance(unit.pos, enemyHq.pos))) : 99;
    const forwardUnits = ownHq && enemyHq ? mobile.filter(unit => getHexDistance(unit.pos, enemyHq.pos) < getHexDistance(unit.pos, ownHq.pos)).length : 0;
    return {
      round: Number(getRound()) || 0,
      ownPs: getControlledPsCount(player),
      ownPressure: Number(getPressure(player)) || 0,
      enemyUnits: enemyUnits.length,
      closestEnemyHqDistance,
      forwardUnits
    };
  }

  function botUpdateFinalizationMemoryF9T0(player) {
    const memory = ensureAiFinalizationMemoryF9T0();
    if (!memory) return { stalledRounds:0, lastProgressRound:0 };
    const round = Number(getRound()) || 0;
    const existing = memory.players[player];
    if (existing && existing.lastRound === round) return existing;
    const current = botProgressSnapshotF9T0(player);
    const record = existing || { lastRound:-1, stalledRounds:0, lastProgressRound:current.round, snapshot:null };
    if (record.lastRound !== current.round) {
      const previous = record.snapshot;
      const progressed = !previous
        || current.ownPs > previous.ownPs
        || current.ownPressure > previous.ownPressure
        || current.enemyUnits < previous.enemyUnits
        || current.closestEnemyHqDistance < previous.closestEnemyHqDistance
        || current.forwardUnits > previous.forwardUnits;
      if (progressed || current.round < 6) {
        record.stalledRounds = 0;
        record.lastProgressRound = current.round;
      } else {
        record.stalledRounds = Math.min(9, (record.stalledRounds || 0) + 1);
      }
      record.snapshot = current;
      record.lastRound = current.round;
      memory.players[player] = record;
      recordMaxStalledRounds(player, record.stalledRounds);
    }
    return record;
  }

  function botRecordMoveChoiceF9T0(unit, coord) {
    const memory = ensureAiFinalizationMemoryF9T0();
    if (!memory || !unit || !unit.uid || !Array.isArray(unit.pos) || !Array.isArray(coord)) return;
    const previousRecord = memory.unitHistory[unit.uid] || {};
    const returning = Array.isArray(previousRecord.previous) && areSameCoord(previousRecord.previous, coord);
    memory.unitHistory[unit.uid] = {
      previous:[...unit.pos],
      current:[...coord],
      round:Number(getRound()) || 0,
      returning
    };
    if (returning) recordOscillationMove(unit.side);
  }

  return Object.freeze({
    ensureAiFinalizationMemoryF9T0,
    botProgressSnapshotF9T0,
    botUpdateFinalizationMemoryF9T0,
    botRecordMoveChoiceF9T0
  });
}
