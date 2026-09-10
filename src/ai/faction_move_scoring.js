"use strict";

// AR-AC1 - read-only faction-specific Advanced AI movement scoring.
// Final aggregation/selection and movement execution remain outside this service.
function createAiFactionMoveScoringService(dependencies = {}) {
  const {
    isUnitGarrisoningPs,
    shouldReleasePsGarrison,
    getMinDistance,
    getNearestCoord,
    getHexDistance,
    areSameCoord,
    getCells,
    getPsProtectionMoveBonus,
    getAgathoiStructureNetworkScore,
    isExordiumShockUnit,
    isUnitSacrificial,
    areAdjacent,
    getFabeotLessDefendedPsTargets,
    isFabeotBaitUnit,
    isFabeotValuableUnit,
    getFabeotSplitPressureScore,
    getCommanderThreatLevel,
    getCommanderProtectionMoveBonus
  } = dependencies;

  function botFactionMoveBaseScoreF9T0(entry, context) {
    const { unit, player, enemyHq, hasPS, status } = context;
    const { coord, cell } = entry;
    let score = 0;
    if (isUnitGarrisoningPs(unit) && !shouldReleasePsGarrison(unit, status)) score -= 999;
    if (unit.faction === "Nexus") {
      const mature = status.networkMature;
      if (!hasPS) score -= getMinDistance(coord, context.uncontrolledPs.length ? context.uncontrolledPs : context.psCells) * 2.6;
      else if (status.zeroPsRecovery || status.pressureEmergency) score -= getMinDistance(coord, context.nexusTargets) * 1.5;
      else if (context.guardTarget && !mature) score -= getHexDistance(coord, context.guardTarget.coord) * 2.2;
      else if (!mature && context.controlledPs.length && status.ownPs < Math.max(1, status.pressureProfile.requiredPs - 1)) score -= getMinDistance(coord, context.controlledPs) * 1.1;
      else if (context.uncontrolledPs.length && status.pressureWinPlan) score -= getMinDistance(coord, context.uncontrolledPs) * 1.2;
      else score -= entry.enemyHqDistance * (status.qgWinPlan || mature ? 1.05 : 0.55);
      if (cell && cell.ps && cell.control !== player) score += status.zeroPsRecovery || status.pressureEmergency ? 34 : (mature ? 22 : 14);
      if (cell && cell.ps && cell.control === player) score += unit.type === "Struttura" ? 20 : (mature ? 3 : 10);
      if (!mature && context.controlledPs.some(ps => getHexDistance(coord, ps) === 1)) score += 5;
      if (enemyHq && areSameCoord(coord, enemyHq.pos) && hasPS) score += status.qgWinPlan || mature ? 55 : 28;
      if (unit.weight === "Pivot") score += entry.alliesR1 * 2.2;
      if (unit.type === "Struttura" && !getCells().some(c => c.ps && getHexDistance(c.coord, coord) <= 1) && !status.hqDanger) score -= 5;
      score += getPsProtectionMoveBonus(player, coord, status) * (mature ? 0.45 : 1.05);
    } else if (unit.faction === "Agathoi") {
      const mature = status.greenLineMature;
      if (!hasPS) score -= getMinDistance(coord, context.psCells) * 2.0;
      else if (context.guardTarget && !mature) score -= getHexDistance(coord, context.guardTarget.coord) * 2.4;
      else if (context.uncontrolledPs.length && (status.pressureWinPlan || mature)) score -= getMinDistance(coord, context.uncontrolledPs) * (mature ? 1.25 : 0.9);
      else score -= entry.enemyHqDistance * (status.qgWinPlan || mature ? 1.0 : 0.55);
      if (context.greenTargets.length) score += Math.max(0, (mature ? 12 : 18) - getMinDistance(coord, context.greenTargets) * (mature ? 2.2 : 3.2));
      if (cell && cell.ps && cell.control !== player) score += status.zeroPsRecovery || status.pressureEmergency ? 28 : (mature ? 22 : 12);
      if (cell && cell.ps && cell.control === player) score += mature ? 4 : 13;
      score += entry.alliesR1 * (mature ? 0.7 : 1.1);
      score += getAgathoiStructureNetworkScore(player, coord) * (mature ? 0.35 : 0.7);
      if (unit.canBuild && getCells().some(ps => ps.ps && getHexDistance(coord, ps.coord) <= 1)) score += mature ? 2 : 7;
      if (enemyHq && areSameCoord(coord, enemyHq.pos) && hasPS) score += status.qgWinPlan || mature ? 42 : 10;
      score += getPsProtectionMoveBonus(player, coord, status) * (mature ? 0.4 : 1.25);
    } else if (unit.faction === "Exordium") {
      const front = context.exordiumFront;
      if (!hasPS && context.exordiumFronts.length) score -= getMinDistance(coord, context.exordiumFronts.map(f => f.ps)) * 2.35;
      else if (front) score -= getHexDistance(coord, front.advance) * 1.05;
      score -= entry.enemyHqDistance * (hasPS ? 0.95 : 0.15);
      if (cell && cell.ps && cell.control !== player) score += status.zeroPsRecovery || status.pressureEmergency ? 28 : 10;
      if (enemyHq && areSameCoord(coord, enemyHq.pos) && hasPS) score += 55;
      if (unit.type === "Veicolo") score += 2;
      if (unit.weight === "Pivot" || unit.weight === "Elite") score += 2;
      score += Math.min(5, entry.alliesR1 * (isExordiumShockUnit(unit) ? 1.5 : 0.9));
      if (!status.zeroPsRecovery && !status.pressureEmergency && entry.alliesR1 >= 4) score -= 2;
      score += getPsProtectionMoveBonus(player, coord, status) * 1.1;
    } else if (unit.faction === "Liberti") {
      const mainTarget = hasPS
        ? (status.qgWinPlan ? enemyHq.pos : (context.libertiFlank && getHexDistance(unit.pos, context.libertiFlank) > 2 ? context.libertiFlank : enemyHq.pos))
        : (context.libertiTargets.length ? getNearestCoord(unit.pos, context.libertiTargets) : [0,0,0]);
      score -= getHexDistance(coord, mainTarget) * (hasPS ? 1.15 : 1.85);
      if (context.libertiTargets.length) score += Math.max(0, 18 - getMinDistance(coord, context.libertiTargets) * 3.4);
      if (hasPS) score += Math.min(3.5, Math.abs(coord[1]) * 0.45);
      if (cell && cell.ps && cell.control !== player) score += status.zeroPsRecovery || status.pressureEmergency ? 28 : 8;
      if (cell && cell.ps && cell.control === player) score += isUnitSacrificial(unit) ? 4 : 7;
      if (enemyHq && areSameCoord(coord, enemyHq.pos) && hasPS) score += status.qgRaiders >= 2 ? 55 : 24;
      score += entry.alliesR1 * 2.0;
      for (const enemy of context.enemyUnits) if (areAdjacent(coord, enemy.pos)) score += 2 + (context.allyUnits.some(a => a.uid !== unit.uid && areAdjacent(a.pos, enemy.pos)) ? 6 : 0);
      score += getPsProtectionMoveBonus(player, coord, status) * 1.1;
    } else if (unit.faction === "Fabeot") {
      if (!hasPS || status.zeroPsRecovery || status.pressureEmergency) {
        const psTargets = getFabeotLessDefendedPsTargets(player);
        score += psTargets.length ? Math.max(0, 34 - getMinDistance(coord, psTargets) * 5.2) : 0;
      } else if (context.fabeotTargets.length) {
        score += Math.max(0, (context.fabeotCollapse ? 28 : 20) - getMinDistance(coord, context.fabeotTargets) * (context.fabeotCollapse ? 4.4 : 3.2));
      }
      if (cell && cell.ps && cell.control !== player) score += status.zeroPsRecovery || status.pressureEmergency ? 36 : 16;
      if (cell && cell.ps && cell.control === player) score += 7;
      if (enemyHq && areSameCoord(coord, enemyHq.pos) && hasPS) score += context.fabeotCollapse && status.qgRaiders >= 2 ? 60 : (isFabeotBaitUnit(unit) ? 36 : 14);
      if (unit.ability && !unit.ability.passive && context.enemyUnits.some(e => getHexDistance(coord, e.pos) <= Math.max(1, unit.ability.range || 1))) score += context.fabeotCollapse ? 7 : 5;
      if (context.fabeotCollapse && context.fabeotExposed.length) score += Math.max(0, 22 - getMinDistance(coord, context.fabeotExposed.map(e => e.pos)) * 4.2);
      if (!context.fabeotCollapse && isFabeotValuableUnit(unit) && enemyHq && entry.enemyHqDistance <= 3) score -= 10;
      if (context.fabeotConcentrated) score += getFabeotSplitPressureScore(player, coord, status) * 0.9;
      score += getPsProtectionMoveBonus(player, coord, status) * 0.95;
    }
    if (context.commander && unit.uid !== context.commander.uid && getCommanderThreatLevel(context.commander) > 0) score -= getHexDistance(coord, context.commander.pos) * (unit.faction === "Exordium" ? 1.8 : 2.0);
    score += getCommanderProtectionMoveBonus(unit, coord);
    score -= entry.enemiesR1 * (unit.type === "Comandante" ? 4.5 : 0.45);
    return score;
  }

  return Object.freeze({ botFactionMoveBaseScoreF9T0 });
}
