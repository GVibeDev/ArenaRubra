"use strict";

// AR-AC1 - stateful Advanced AI movement execution boundary.
// Movement-rule mutation remains delegated to the authoritative movement port;
// the historical post-move War Push mutation is kept explicit and ordered here.
function createAiMoveExecutionService(dependencies = {}) {
  const {
    isAdvancedAiEnabled,
    recordMoveChoice,
    moveUnit,
    isFieldUnit,
    logWarPush,
    tryStationaryAction,
    endUnitAction,
    isInfantryActionLike,
    canAct,
    tryAttackOnly
  } = dependencies;

  function botMoveUnitF9T0(unit, coord) {
    if (isAdvancedAiEnabled()) recordMoveChoice(unit, coord);
    moveUnit(unit, coord);
  }

  function finishBotMove(unit) {
    if (!isFieldUnit(unit)) return;
    if (unit.warPush) {
      unit.warPush = false;
      logWarPush(unit);
      tryStationaryAction(unit);
      endUnitAction(unit);
      return;
    }
    if (isInfantryActionLike(unit) && canAct(unit)) {
      tryStationaryAction(unit);
      endUnitAction(unit);
      return;
    }
    if (unit.moveAttack && canAct(unit)) {
      tryAttackOnly(unit);
      endUnitAction(unit);
      return;
    }
    endUnitAction(unit);
  }

  return Object.freeze({ botMoveUnitF9T0, finishBotMove });
}
