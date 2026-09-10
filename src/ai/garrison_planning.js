"use strict";

// AR-AC1 - deterministic F9T0 garrison priorities and reservation plan.
// Battlefield reads enter only through late-bound ports supplied by the facade.
function createAiGarrisonPlanningService(dependencies = {}) {
  const {
    getControlledPsCells,
    getEnemiesNear,
    getAlliesNear,
    areSameCoord,
    getHexDistance,
    getUnitAt
  } = dependencies;

  function botGarrisonCellPriorityF9T0(player, cell, status) {
    const enemies = getEnemiesNear(cell.coord, player, 2).length;
    const allies = getAlliesNear(cell.coord, player, 1).length;
    const isCenter = Boolean(status.center && areSameCoord(cell.coord, status.center.coord));
    const nearHq = status.ownHq ? getHexDistance(cell.coord, status.ownHq.pos) <= 2 : false;
    let score = enemies * 50 + (isCenter ? 24 : 0) + (nearHq ? 12 : 0);
    if (status.closePressureLock || status.ownPressureQualified) score += isCenter ? 28 : 10;
    if (allies <= 0) score += 8;
    return { score, enemies, allies, isCenter, nearHq };
  }

  function botBuildGarrisonPlanF9T0(player, status) {
    const cells = getControlledPsCells(player);
    if (!cells.length) return { budget:0, keepCells:[], keepKeys:new Set(), guardTargets:[] };
    const entries = cells.map(cell => ({ cell, ...botGarrisonCellPriorityF9T0(player, cell, status) }));
    const critical = entries.filter(entry => entry.enemies > 0 || (entry.isCenter && (status.pressureWindow || status.closePressureLock)));
    let budget;
    if (status.closePressureLock || status.pressureEmergency || (status.hqDanger && cells.length <= 2)) budget = cells.length;
    else if (cells.length <= 1) budget = 1;
    else if (status.stalledRounds >= 2) budget = Math.max(1, Math.ceil(cells.length * 0.34));
    else if (status.winning && (status.networkMature || status.greenLineMature)) budget = Math.max(1, Math.ceil(cells.length * 0.5));
    else budget = Math.max(1, Math.ceil(cells.length * 0.67));
    budget = Math.min(cells.length, Math.max(budget, critical.length));
    entries.sort((left,right) => right.score - left.score || String(left.cell.id || "").localeCompare(String(right.cell.id || "")));
    const keepCells = entries.slice(0, budget).map(entry => entry.cell);
    for (const entry of critical) if (!keepCells.some(cell => areSameCoord(cell.coord, entry.cell.coord))) keepCells.push(entry.cell);
    const keepKeys = new Set(keepCells.map(cell => cell.coord.join(",")));
    const guardTargets = entries.filter(entry => {
      if (!keepKeys.has(entry.cell.coord.join(","))) return false;
      const occupant = getUnitAt(entry.cell.coord);
      if (!occupant || occupant.side !== player) return true;
      return entry.enemies > 0 && entry.allies < Math.min(3, entry.enemies + 1);
    }).map(entry => entry.cell);
    return { budget, keepCells, keepKeys, guardTargets, entries };
  }

  return Object.freeze({
    botGarrisonCellPriorityF9T0,
    botBuildGarrisonPlanF9T0
  });
}
