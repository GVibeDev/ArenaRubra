"use strict";

// Arena Rubra – Fase B6d
// Movement extraction prudente.
// Questo file contiene range movimento, target movimento,
// modalità movimento UI e applicazione dello spostamento.
// Non contiene logica decisionale AI: l'AI usa queste funzioni,
// ma resta ancora nel main.

// Dipendenze globali accettate in questa fase:
// - state.js: state, mode, pending..., selectedId
// - rules.js: getSelectedUnit, getUnitAt, isInsideMap, playerName
// - statuses.js: canMove
// - main.js/pace future: currentPace
// - render/events: log, EventTypes, renderAll

function vehicleMoveRange() { return currentPace().vehicleMove || 1; }
    function isInfantryActionLike(unit) { return unit && (unit.type === "Fanteria" || unit.type === "Comandante"); }
    function canActAfterMove(unit) { return Boolean(unit && (unit.warPush || isInfantryActionLike(unit) || unit.moveAttack)); }
    function movementRangeFor(unit) {
      if (!unit) return 0;
      let range = (unit.type === "Veicolo" ? vehicleMoveRange() : 1)
        + (unit.warPush ? 1 : 0)
        + (unit.c1fMoveBonus ? unit.c1fMoveBonus : 0)
        + (unit.c2c5bMoveBonus ? unit.c2c5bMoveBonus : 0);
      if (unit.c2c5bDoubleMove) range *= 2;
      const mapMultiplier = typeof getMapMovementMultiplier === "function" ? getMapMovementMultiplier() : 1;
      return Math.max(0, range * mapMultiplier);
    }

function toggleMoveMode() {
      if ((typeof missionInteractionBlocked === "function" && missionInteractionBlocked()) || !getSelectedUnit()) return;
      mode = mode === "move" ? "idle" : "move";
      pendingAbility = null;
      pendingBuildBlueprintId = null;
      pendingPurchaseBlueprintId = null;
      pendingTacticId = null;
      renderAll();
    }

function moveUnit(unit, coord) {
      if (unit.stationaryDefBonus) {
        log(`${unit.name} si muove e perde il bonus DEF da posizione.`);
        unit.stationaryDefBonus = 0;
      }
      log(`${unit.name} si muove da [${unit.pos.join(",")}] a [${coord.join("," )}].`, EventTypes.UNIT_MOVED, {
        player: unit.side,
        faction: state.factions[unit.side],
        unitId: unit.uid,
        unitName: unit.name,
        from: [...unit.pos],
        to: [...coord]
      });
      unit.pos = [...coord];
      unit.movedThisTurn = true;
      if (typeof triggerMinesAt === "function") triggerMinesAt(unit.pos, unit);
      if (typeof triggerCellEffectsAt === "function") triggerCellEffectsAt(unit.pos, unit);
      if (unit.alive && typeof triggerAmbushesAt === "function") triggerAmbushesAt(unit);
    }

function isMoveTarget(coord) {
      const u = getSelectedUnit();
      return mode === "move" && u && movableCells(u).some(c => sameCoord(c, coord));
    }

function movableCells(unit) {
      if (!canMove(unit) || !unit.pos || unit.type === "Struttura" || unit.type === "QG") return [];
      const range = movementRangeFor(unit);
      if (range <= 0) return [];
      if (typeof mapReachableCells === "function" && state.mapDefinition) {
        const occupiedKeys = new Set();
        // Build occupancy from active pieces (units) instead of asking every
        // map cell to linearly scan the full unit history (cells x units).
        const fieldUnits = typeof combatUnits === "function"
          ? combatUnits()
          : (Array.isArray(state.units) ? state.units.filter(other => other && other.alive && other.pos && other.type !== "QG") : []);
        for (const other of fieldUnits) {
          if (other && other.pos && other.uid !== unit.uid) occupiedKeys.add(coordKey(other.pos));
        }
        for (const effect of Array.isArray(state.cellEffects) ? state.cellEffects : []) {
          if (effect && effect.kind === "temporary_block_cell" && Array.isArray(effect.coord)) {
            occupiedKeys.add(coordKey(effect.coord));
          }
        }
        return mapReachableCells(state.mapDefinition, unit.pos, range, { occupiedKeys })
          .map(entry => entry.coord)
          .filter(isCellEnterable);
      }
      return neighbors(unit.pos).filter(coord => isCellEnterable(coord) && !getUnitAt(coord));
    }
