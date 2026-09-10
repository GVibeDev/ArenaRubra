"use strict";

// AR-AC1 - stateful AI combat/action execution boundary.
// Rule application remains delegated to authoritative ability, attack, move and end ports.
function createAiCombatExecutionService(dependencies = {}) {
  const {
    canAct,
    canUseAbility,
    getAbilityTargets,
    scoreAbility,
    useAbility,
    getCombatUnits,
    getEnemy,
    areAdjacent,
    isAdvancedAiEnabled,
    shouldAttackTarget,
    canAttack,
    scoreAttackTarget,
    attackUnit,
    isFieldUnit,
    hasMovableCells,
    getMovableCells,
    chooseMove,
    moveUnit,
    logPostAttackMove,
    getStrategicStatus,
    isStrategicEnemyTarget,
    tryStationaryAction,
    endUnitAction
  } = dependencies;

  function adjacentAttackTargets(unit) {
    return getCombatUnits(getEnemy(unit.side)).filter(enemy =>
      areAdjacent(unit.pos, enemy.pos) && (!isAdvancedAiEnabled() || shouldAttackTarget(unit, enemy))
    );
  }

  function botTryAttackOnly(unit) {
    let adjacentEnemies = adjacentAttackTargets(unit);
    let didSomething = false;
    while (adjacentEnemies.length && canAttack(unit) && unit.alive) {
      const target = adjacentEnemies
        .map(enemy => ({ unit:enemy, score:scoreAttackTarget(unit, enemy) }))
        .sort((left,right) => right.score - left.score)[0].unit;
      const before = unit.attacksMade || 0;
      attackUnit(unit, target);
      didSomething = true;
      if (!isFieldUnit(unit)) return true;
      if ((unit.attacksMade || 0) === before) break;
      adjacentEnemies = adjacentAttackTargets(unit);
    }
    return didSomething;
  }

  function botTryStationaryAction(unit) {
    if (!unit || !canAct(unit)) return false;
    let didSomething = false;
    let f9s1aPreparedAction = false;
    const ability = unit.ability;
    if (ability && !ability.passive && canUseAbility(unit, ability)) {
      const scored = getAbilityTargets(unit, ability)
        .map(target => ({ target, score:scoreAbility(unit, target, ability) }))
        .sort((left,right) => right.score - left.score);
      if (scored.length && scored[0].score > 0) {
        useAbility(unit, scored[0].target, ability);
        didSomething = true;
        if (unit.f9s1aKeepActionAfterAbility) {
          unit.f9s1aKeepActionAfterAbility = false;
          f9s1aPreparedAction = true;
        } else if (unit.c2finalc2ReadyAfterAbility) {
          unit.c2finalc2ReadyAfterAbility = false;
        } else if (unit.type !== "Veicolo") return true;
      }
    }
    let adjacentEnemies = adjacentAttackTargets(unit);
    if (adjacentEnemies.length && canAttack(unit)) {
      while (adjacentEnemies.length && canAttack(unit) && unit.alive) {
        const target = adjacentEnemies
          .map(enemy => ({ unit:enemy, score:scoreAttackTarget(unit, enemy) }))
          .sort((left,right) => right.score - left.score)[0].unit;
        const before = unit.attacksMade || 0;
        attackUnit(unit, target);
        didSomething = true;
        if (!isFieldUnit(unit)) return true;
        if ((unit.attacksMade || 0) === before) break;
        adjacentEnemies = adjacentAttackTargets(unit);
      }
    }
    if (!isFieldUnit(unit)) return didSomething;
    if (unit.postAttackMove && (unit.attacksMade || 0) > 0 && !unit.f9s1aPostAttackMoveUsed && hasMovableCells()) {
      const steps = getMovableCells(unit);
      const step = steps.length ? chooseMove(unit, steps) : null;
      if (step) {
        unit.f9s1aPostAttackMoveUsed = true;
        moveUnit(unit, step);
        logPostAttackMove(unit);
        return true;
      }
    }
    if (unit.type === "Veicolo" && (unit.attacksMade || 0) > 0) return true;
    if (unit.type === "Veicolo" && ability && !ability.passive && canUseAbility(unit, ability)) {
      const scored = getAbilityTargets(unit, ability)
        .map(target => ({ target, score:scoreAbility(unit, target, ability) }))
        .sort((left,right) => right.score - left.score);
      if (scored.length && scored[0].score > 0) {
        useAbility(unit, scored[0].target, ability);
        didSomething = true;
        if (unit.f9s1aKeepActionAfterAbility) {
          unit.f9s1aKeepActionAfterAbility = false;
          f9s1aPreparedAction = true;
        }
      }
    }
    return f9s1aPreparedAction ? false : didSomething;
  }

  function emergencyBotAction(unit, movementProvider, status = null) {
    status = status || getStrategicStatus(unit.side);
    if (!status.active) return false;
    const adjacentEnemies = getCombatUnits(status.enemy).filter(enemy => areAdjacent(unit.pos, enemy.pos));
    const strategicAdjacent = adjacentEnemies.filter(enemy => isStrategicEnemyTarget(unit.side, enemy, status));
    if (strategicAdjacent.length && canAttack(unit)) {
      while (canAttack(unit) && unit.alive && strategicAdjacent.some(enemy => enemy.alive)) {
        const target = strategicAdjacent
          .filter(enemy => enemy.alive)
          .map(enemy => ({ unit:enemy, score:scoreAttackTarget(unit, enemy) + 12 }))
          .sort((left,right) => right.score - left.score)[0]?.unit;
        if (!target) break;
        const before = unit.attacksMade || 0;
        attackUnit(unit, target);
        if (!isFieldUnit(unit)) return true;
        if ((unit.attacksMade || 0) === before) break;
      }
      if (isFieldUnit(unit) && unit.type === "Veicolo" && canUseAbility(unit, unit.ability) && getAbilityTargets(unit, unit.ability).length > 0) tryStationaryAction(unit);
      if (isFieldUnit(unit)) endUnitAction(unit);
      return true;
    }
    return false;
  }

  return Object.freeze({ botTryAttackOnly, botTryStationaryAction, emergencyBotAction });
}
