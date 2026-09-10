"use strict";

// AR-AC1 - read-only Advanced AI movement feature collection.
// Final scoring and coordinate selection intentionally remain outside this service.
function createAiMoveContextService(dependencies = {}) {
  const {
    getEnemyOf,
    getHq,
    getCells,
    getControlledPsCells,
    getNearestControlledPsNeedingGuard,
    getCommander,
    getCombatUnits,
    getNexusTargets,
    getAgathoiTargets,
    getExordiumFronts,
    getLibertiTargets,
    getLibertiFlank,
    getFabeotTargets,
    getFabeotCollapseReady,
    getFabeotExposedTargets,
    getFabeotEnemyConcentration,
    chooseExordiumFront,
    getCellAt,
    getHexDistance,
    getAlliesNear,
    getEnemiesNear,
    getHomePsMoveScore,
    getStrategicMoveBonus,
    getGeneralDoctrineMoveBonus,
    getFactionDoctrineMoveBonus,
    getMissionMoveBonus,
    getC2e3MoveScore,
    getStallOscillationScore
  } = dependencies;

  function botCreateAdvancedMoveContextF9T0(unit, options, status) {
    const player = unit.side;
    const enemy = getEnemyOf(player);
    const enemyHq = getHq(enemy);
    const ownHq = getHq(player);
    const hasPS = status.ownPs >= 1;
    const cells = getCells();
    const psCells = cells.filter(cell => cell.ps).map(cell => cell.coord);
    const uncontrolledPs = cells.filter(cell => cell.ps && cell.control !== player).map(cell => cell.coord);
    const controlledPs = getControlledPsCells(player).map(cell => cell.coord);
    const guardTarget = getNearestControlledPsNeedingGuard(player, status);
    const commander = getCommander(player);
    const context = {
      unit, player, enemy, enemyHq, ownHq, hasPS, psCells, uncontrolledPs, controlledPs, guardTarget, commander, status,
      enemyUnits:getCombatUnits(enemy),
      allyUnits:getCombatUnits(player),
      nexusTargets:unit.faction === "Nexus" ? getNexusTargets(player, status) : [],
      greenTargets:unit.faction === "Agathoi" ? getAgathoiTargets(player, status) : [],
      exordiumFronts:unit.faction === "Exordium" ? getExordiumFronts(player) : [],
      libertiTargets:unit.faction === "Liberti" ? getLibertiTargets(player, status) : [],
      libertiFlank:unit.faction === "Liberti" ? getLibertiFlank(player) : null,
      fabeotTargets:unit.faction === "Fabeot" ? getFabeotTargets(player, status) : [],
      fabeotCollapse:unit.faction === "Fabeot" ? getFabeotCollapseReady(player, status) : false,
      fabeotExposed:unit.faction === "Fabeot" ? getFabeotExposedTargets(player) : [],
      fabeotConcentrated:unit.faction === "Fabeot" ? getFabeotEnemyConcentration(player) : false
    };
    context.exordiumFront = context.exordiumFronts.length ? chooseExordiumFront(unit, context.exordiumFronts) : null;
    context.candidates = options.map(coord => ({
      coord,
      cell:getCellAt(coord),
      enemyHqDistance:enemyHq ? getHexDistance(coord, enemyHq.pos) : 99,
      ownHqDistance:ownHq ? getHexDistance(coord, ownHq.pos) : 99,
      alliesR1:getAlliesNear(coord, player, 1).length,
      enemiesR1:getEnemiesNear(coord, player, 1).length,
      homeScore:getHomePsMoveScore(unit, coord, status),
      emergencyScore:getStrategicMoveBonus(player, unit, coord, status),
      generalScore:getGeneralDoctrineMoveBonus(unit, coord, status),
      factionDoctrineScore:getFactionDoctrineMoveBonus(unit, coord, status),
      missionScore:getMissionMoveBonus(unit, coord),
      c2e3Score:getC2e3MoveScore(unit, coord, status),
      stallScore:getStallOscillationScore(unit, coord, status)
    }));
    return context;
  }

  return Object.freeze({ botCreateAdvancedMoveContextF9T0 });
}
