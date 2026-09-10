"use strict";

// AR-AC1 - deterministic Advanced AI strategic-status composition.
// The legacy facade gathers battlefield data, advances finalization memory and
// attaches the garrison plan. This service only combines supplied read models.
function createAiStrategicStatusService() {
  function compose(input = {}) {
    const {
      player,
      enemy,
      profile,
      ownPs,
      enemyPs,
      ownPressure,
      enemyPressure,
      ownHq,
      enemyHq,
      enemyUnits,
      ownUnits,
      enemyOnOwnHq,
      enemiesNearOwnHq,
      center,
      centerOccupant,
      centerOpening,
      centerLostEarly,
      ownControlsCentral,
      enemyControlsCentral,
      strategic,
      progressMemory,
      nexusMaturity,
      agathoiMaturity,
      turn,
      faction,
      sameCoord,
      hexDistance,
      movementRangeFor,
      movesFor
    } = input;

    const pressureWindow = turn >= profile.startRound - 2;
    const ownPressureQualified = ownControlsCentral && ownPs >= profile.requiredPs;
    const enemyPressureQualified = enemyControlsCentral && enemyPs >= profile.requiredPs;
    const ownPressureNearQualified = ownControlsCentral && ownPs >= Math.max(1, profile.requiredPs - 1);
    const enemyPressureNearQualified = enemyControlsCentral && enemyPs >= Math.max(1, profile.requiredPs - 1);
    const pressureEmergency = enemyPressureQualified || enemyPressure >= Math.max(1, profile.pressureWin - 2) || (pressureWindow && enemyPressureNearQualified && enemyPs > ownPs);
    const zeroPsRecovery = ownPs <= 0 && enemyPs > 0;
    const pressureDanger = pressureWindow && (enemyPressureQualified || enemyPressureNearQualified || enemyPressure >= profile.pressureWin - 2 || (enemyPs > ownPs && enemyPs >= Math.max(1, profile.requiredPs - 1)) || enemyPressure - ownPressure >= 2);
    const hqDanger = Boolean(enemyOnOwnHq) || enemiesNearOwnHq.length > 0;
    const defendQGRecovery = hqDanger && (zeroPsRecovery || enemyPs >= Math.max(2, profile.requiredPs - 1) || enemyPressure > ownPressure);
    const roundDanger = turn >= profile.maxRound - 5 && (enemyPs > ownPs || enemyPressure > ownPressure || enemyUnits.length > ownUnits.length + 2);
    const allIn = Boolean(enemyOnOwnHq) || enemyPressure >= profile.pressureWin - 1 || (turn >= profile.maxRound - 3 && enemyPs >= ownPs) || (pressureWindow && ownPs === 0 && enemyPs >= Math.max(2, profile.requiredPs - 1)) || (pressureEmergency && ownPs === 0);
    const midgame = turn >= 8;
    const winning = midgame && strategic.posture === "vantaggio";
    const losing = midgame && strategic.posture === "svantaggio";
    const stalledRounds = progressMemory.stalledRounds || 0;
    const networkMature = nexusMaturity.mature;
    const greenLineMature = agathoiMaturity.mature;
    const qgRaiderUnits = ownUnits.filter(unit => enemyHq && (hexDistance(unit.pos, enemyHq.pos) <= 5 || (unit.type === "Veicolo" && hexDistance(unit.pos, enemyHq.pos) <= 6)));
    const qgRaiders = qgRaiderUnits.length;
    const closestQGRaiderDistance = qgRaiderUnits.length && enemyHq ? Math.min(...qgRaiderUnits.map(unit => hexDistance(unit.pos, enemyHq.pos))) : 99;
    const qgImmediateOccupy = Boolean(ownUnits.some(unit => enemyHq && sameCoord(unit.pos, enemyHq.pos)));
    const qgImmediateMove = Boolean(enemyHq && ownPs >= 1 && ownUnits.some(unit => {
      if (unit.acted || unit.type === "Struttura" || unit.type === "QG") return false;
      const estimatedRange = movementRangeFor(unit);
      if (hexDistance(unit.pos, enemyHq.pos) > estimatedRange) return false;
      return typeof movesFor === "function" && movesFor(unit).some(coord => sameCoord(coord, enemyHq.pos));
    }));
    const closePressureLock = Boolean(ownPressure >= profile.pressureWin - 1 && ownPressureQualified && ownPs > enemyPs);
    const qgStrongSequence = Boolean(!closePressureLock && qgRaiders >= 2 && closestQGRaiderDistance <= 2);
    const matureAssaultReady = Boolean((networkMature || greenLineMature) && ownUnits.filter(unit => unit.type !== "Struttura" && unit.type !== "QG").length >= 4);
    const qgPreparedSequence = Boolean(!closePressureLock && matureAssaultReady && qgRaiders >= 1 && closestQGRaiderDistance <= 4 && ownPs >= Math.max(1, profile.requiredPs - 2));
    const qgClosingPossible = Boolean(winning && ownPs >= 1 && (qgImmediateOccupy || qgImmediateMove || qgStrongSequence || qgPreparedSequence));
    const qgWinPlan = qgClosingPossible;
    const pressureWinPlan = Boolean(!qgWinPlan && (closePressureLock || (winning && ownPressureNearQualified && (ownPs >= profile.requiredPs || ownPs > enemyPs || strategic.incomeDelta >= 0))));
    const enemyPressurePlan = Boolean(losing && (enemyPressureNearQualified || enemyPressure > ownPressure || (enemyPs > ownPs && enemyPs >= Math.max(1, profile.requiredPs - 1))));
    const finalizationStall = Boolean(midgame && !losing && stalledRounds >= 2 && (faction === "Nexus" || faction === "Agathoi"));
    const doctrineActive = pressureWinPlan || qgWinPlan || enemyPressurePlan || pressureEmergency || zeroPsRecovery || defendQGRecovery || closePressureLock || finalizationStall;
    const active = pressureDanger || hqDanger || roundDanger || allIn || centerOpening || centerLostEarly || doctrineActive;
    let mode = "normal";
    if (qgImmediateOccupy || qgImmediateMove) mode = "vittoria_qg";
    else if (allIn) mode = "tutto_per_tutto";
    else if (closePressureLock) mode = "vittoria_pressione";
    else if (pressureEmergency) mode = "rompi_controllo_ps";
    else if (zeroPsRecovery) mode = "recupero_ps";
    else if (defendQGRecovery) mode = "difesa_qg_recupero_ps";
    else if (hqDanger) mode = "difesa_qg";
    else if (centerLostEarly || centerOpening) mode = "contesta_centro";
    else if (pressureDanger) mode = "rompi_pressione";
    else if (roundDanger) mode = "finale";
    else if (enemyPressurePlan) mode = "difesa_pressione";
    else if (qgWinPlan) mode = "vittoria_qg";
    else if (pressureWinPlan) mode = "vittoria_pressione";
    else if (finalizationStall) mode = "sblocco_stallo";

    return {
      player, enemy, ownPs, enemyPs, ownPressure, enemyPressure, ownHq, enemyHq,
      enemyUnits, ownUnits, enemyOnOwnHq, enemiesNearOwnHq, center, centerOccupant,
      centerOpening, centerLostEarly, pressureWindow, pressureDanger, pressureEmergency,
      zeroPsRecovery, defendQGRecovery, hqDanger, roundDanger, allIn, active, mode,
      strategic, midgame, winning, losing, pressureWinPlan, qgWinPlan, qgClosingPossible,
      qgImmediateOccupy, qgImmediateMove, qgStrongSequence, qgPreparedSequence,
      closePressureLock, closestQGRaiderDistance, enemyPressurePlan, doctrineActive,
      qgRaiders, pressureProfile:profile, ownControlsCentral, enemyControlsCentral,
      ownPressureQualified, enemyPressureQualified, ownPressureNearQualified,
      enemyPressureNearQualified, networkMature, greenLineMature, nexusMaturity,
      agathoiMaturity, stalledRounds, finalizationStall
    };
  }

  return Object.freeze({ compose });
}
