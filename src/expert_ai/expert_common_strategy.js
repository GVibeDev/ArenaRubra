"use strict";

// Arena Rubra — F9T1 Expert AI Architecture & Telemetry Contract.
// Quattro sole valutazioni strategiche comuni. Questo file non assegna pesi,
// non sceglie azioni e non contiene dottrine di fazione.

const EXPERT_COMMON_CONTRACT_VERSION_F9T1 = "F9T1-COMMON-1";

function expertFiniteNumberF9T1(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function expertCoordCloneF9T1(coord) {
  return Array.isArray(coord) ? coord.slice(0, 3).map(value => expertFiniteNumberF9T1(value, 0)) : null;
}

function expertCoordKeyF9T1(coord) {
  return Array.isArray(coord) ? coord.join(",") : "";
}

function expertCacheGetF9T1(runtime, key, factory) {
  if (!runtime || !runtime.cache || typeof runtime.cache.has !== "function") return factory();
  if (runtime.cache.has(key)) {
    runtime.cacheHits = expertFiniteNumberF9T1(runtime.cacheHits, 0) + 1;
    return runtime.cache.get(key);
  }
  runtime.cacheMisses = expertFiniteNumberF9T1(runtime.cacheMisses, 0) + 1;
  const value = factory();
  runtime.cache.set(key, value);
  return value;
}

function expertEnemyPlayersF9T1(player) {
  if (typeof getEnemyPlayers === "function") {
    return (getEnemyPlayers(player) || []).map(Number).filter(side => Number.isInteger(side) && side > 0);
  }
  if (state && Array.isArray(state.playerIds)) return state.playerIds.filter(side => Number(side) !== Number(player));
  return [Number(player) === 1 ? 2 : 1];
}

function expertCombatUnitsF9T1(side, runtime) {
  return expertCacheGetF9T1(runtime, `combat:${side}`, () => {
    if (typeof combatUnits === "function") return (combatUnits(side) || []).filter(unit => unit && unit.alive !== false);
    return state && Array.isArray(state.units)
      ? state.units.filter(unit => unit && unit.alive !== false && Number(unit.side) === Number(side) && unit.type !== "QG")
      : [];
  });
}

function expertMapMovementMultiplierF9T1() {
  if (typeof getMapMovementMultiplier === "function") return Math.max(1, expertFiniteNumberF9T1(getMapMovementMultiplier(), 1));
  return Math.max(1, expertFiniteNumberF9T1(state && state.mapDefinition && state.mapDefinition.movementMultiplier, 1));
}

function expertUnitMovementRangeF9T1(unit, mapMultiplier) {
  if (!unit || unit.type === "Struttura" || unit.type === "QG") return 0;
  if (typeof movementRangeFor === "function") {
    const resolved = expertFiniteNumberF9T1(movementRangeFor(unit), 0);
    if (resolved > 0) return resolved;
  }
  const base = unit.type === "Veicolo" ? 2 : 1;
  return Math.max(1, base * Math.max(1, expertFiniteNumberF9T1(mapMultiplier, 1)));
}

function expertHexDistanceF9T1(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 999;
  if (typeof hexDistance === "function") return expertFiniteNumberF9T1(hexDistance(a, b), 999);
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

function expertOwnStrategicAssetCoordsF9T1(player, runtime) {
  return expertCacheGetF9T1(runtime, `strategic-assets:${player}`, () => {
    const coords = [];
    const hq = typeof getHq === "function" ? getHq(player) : null;
    if (hq && Array.isArray(hq.pos)) coords.push({ kind:"hq", coord:expertCoordCloneF9T1(hq.pos) });
    const cells = state && Array.isArray(state.cells) ? state.cells : [];
    for (const cell of cells) {
      if (cell && cell.ps && Number(cell.control) === Number(player) && Array.isArray(cell.coord)) {
        coords.push({ kind:"ps", coord:expertCoordCloneF9T1(cell.coord) });
      }
    }
    return coords;
  });
}

// Istruzione comune 1: prossimità nemica adattata al moltiplicatore di movimento.
function expertEvaluateAdaptiveEnemyProximityF9T1(player, runtime) {
  const mapMultiplier = expertMapMovementMultiplierF9T1();
  const assets = expertOwnStrategicAssetCoordsF9T1(player, runtime);
  const ownHq = typeof getHq === "function" ? getHq(player) : null;
  const entries = [];
  for (const enemySide of expertEnemyPlayersF9T1(player)) {
    for (const unit of expertCombatUnitsF9T1(enemySide, runtime)) {
      if (!Array.isArray(unit.pos)) continue;
      const movementRange = expertUnitMovementRangeF9T1(unit, mapMultiplier);
      const hqDistance = ownHq && Array.isArray(ownHq.pos) ? expertHexDistanceF9T1(unit.pos, ownHq.pos) : 999;
      let nearestAsset = null;
      for (const asset of assets) {
        const distance = expertHexDistanceF9T1(unit.pos, asset.coord);
        if (!nearestAsset || distance < nearestAsset.distance) nearestAsset = { kind:asset.kind, coord:asset.coord, distance };
      }
      const assetDistance = nearestAsset ? nearestAsset.distance : hqDistance;
      const turnsToAsset = movementRange > 0 ? Math.ceil(assetDistance / movementRange) : 99;
      const turnsToHq = movementRange > 0 ? Math.ceil(hqDistance / movementRange) : 99;
      entries.push({
        unitId:String(unit.uid || unit.id || ""),
        unitName:String(unit.name || ""),
        side:Number(enemySide),
        type:String(unit.type || ""),
        weight:String(unit.weight || ""),
        position:expertCoordCloneF9T1(unit.pos),
        movementRange,
        hqDistance,
        nearestAssetKind:nearestAsset ? nearestAsset.kind : "hq",
        nearestAssetCoord:nearestAsset ? expertCoordCloneF9T1(nearestAsset.coord) : (ownHq ? expertCoordCloneF9T1(ownHq.pos) : null),
        nearestAssetDistance:assetDistance,
        turnsToAsset,
        turnsToHq,
        threatBand:turnsToHq <= 1 ? "immediate" : (turnsToHq <= 2 ? "near" : (turnsToHq <= 3 ? "watch" : "distant"))
      });
    }
  }
  entries.sort((a, b) => a.turnsToHq - b.turnsToHq || a.hqDistance - b.hqDistance || a.unitId.localeCompare(b.unitId));
  return {
    contract:"adaptive_enemy_proximity",
    mapMovementMultiplier:mapMultiplier,
    enemyCount:entries.length,
    immediateCount:entries.filter(entry => entry.threatBand === "immediate").length,
    nearCount:entries.filter(entry => entry.threatBand === "near").length,
    watchCount:entries.filter(entry => entry.threatBand === "watch").length,
    minimumTurnsToHq:entries.length ? Math.min(...entries.map(entry => entry.turnsToHq)) : null,
    units:entries
  };
}

// Istruzione comune 2: presenza di protezione strutturale sul QG o adiacente.
function expertEvaluateHqStructureProtectionF9T1(player, runtime) {
  const hq = typeof getHq === "function" ? getHq(player) : null;
  const structures = expertCombatUnitsF9T1(player, runtime).filter(unit => unit.type === "Struttura" && Array.isArray(unit.pos));
  const protecting = hq && Array.isArray(hq.pos)
    ? structures.filter(unit => expertHexDistanceF9T1(unit.pos, hq.pos) <= 1)
    : [];
  return {
    contract:"hq_structure_protection",
    hqCoord:hq ? expertCoordCloneF9T1(hq.pos) : null,
    protected:protecting.length > 0,
    structureCount:protecting.length,
    onHqCount:hq ? protecting.filter(unit => expertHexDistanceF9T1(unit.pos, hq.pos) === 0).length : 0,
    adjacentCount:hq ? protecting.filter(unit => expertHexDistanceF9T1(unit.pos, hq.pos) === 1).length : 0,
    structureIds:protecting.map(unit => String(unit.uid || unit.id || ""))
  };
}

// Istruzione comune 3: strutture sui PS. Nessuna imposizione automatica di costruzione.
function expertEvaluatePsStructuresF9T1(player, runtime) {
  const cells = state && Array.isArray(state.cells) ? state.cells.filter(cell => cell && cell.ps) : [];
  const structures = expertCombatUnitsF9T1(player, runtime).filter(unit => unit.type === "Struttura" && Array.isArray(unit.pos));
  const structureByCoord = new Map(structures.map(unit => [expertCoordKeyF9T1(unit.pos), unit]));
  const points = cells.map(cell => {
    const structure = structureByCoord.get(expertCoordKeyF9T1(cell.coord)) || null;
    return {
      coord:expertCoordCloneF9T1(cell.coord),
      control:cell.control == null ? null : Number(cell.control),
      owned:Number(cell.control) === Number(player),
      hasOwnStructure:Boolean(structure),
      structureId:structure ? String(structure.uid || structure.id || "") : null,
      structureName:structure ? String(structure.name || "") : null
    };
  });
  const owned = points.filter(point => point.owned);
  return {
    contract:"structures_on_strategic_points",
    totalPs:points.length,
    ownedPs:owned.length,
    ownedPsWithStructure:owned.filter(point => point.hasOwnStructure).length,
    coverageRatio:owned.length ? Number((owned.filter(point => point.hasOwnStructure).length / owned.length).toFixed(3)) : 0,
    points
  };
}

// Istruzione comune 4: rischio geometrico di occupazione della cella QG nel prossimo turno plausibile.
// È deliberatamente conservativa e non simula ricorsivamente il turno avversario.
function expertEvaluateHqOccupationRiskF9T1(player, runtime, proximity) {
  const hq = typeof getHq === "function" ? getHq(player) : null;
  if (!hq || !Array.isArray(hq.pos)) {
    return { contract:"hq_cell_occupation_risk", hqCoord:null, occupiedBy:null, risk:"unknown", directThreats:[], conditionalThreats:[] };
  }
  const occupant = typeof getUnitAt === "function" ? getUnitAt(hq.pos) : null;
  const entries = proximity && Array.isArray(proximity.units) ? proximity.units : [];
  const directThreats = entries.filter(entry => entry.hqDistance <= entry.movementRange);
  const conditionalThreats = entries.filter(entry => entry.hqDistance > entry.movementRange && entry.hqDistance <= entry.movementRange * 2);
  const occupiedByEnemy = occupant && Number(occupant.side) !== Number(player);
  const openCell = !occupant || occupiedByEnemy;
  let risk = "none";
  if (occupiedByEnemy) risk = "occupied";
  else if (directThreats.length && openCell) risk = "direct";
  else if (directThreats.length) risk = "conditional";
  else if (conditionalThreats.length) risk = "watch";
  return {
    contract:"hq_cell_occupation_risk",
    hqCoord:expertCoordCloneF9T1(hq.pos),
    occupiedBy:occupant ? { unitId:String(occupant.uid || occupant.id || ""), side:Number(occupant.side || 0), type:String(occupant.type || "") } : null,
    openCell,
    risk,
    directThreats:directThreats.map(entry => ({ unitId:entry.unitId, side:entry.side, movementRange:entry.movementRange, hqDistance:entry.hqDistance })),
    conditionalThreats:conditionalThreats.map(entry => ({ unitId:entry.unitId, side:entry.side, movementRange:entry.movementRange, hqDistance:entry.hqDistance }))
  };
}

function expertBuildCommonContextF9T1(player, runtime) {
  const proximity = expertEvaluateAdaptiveEnemyProximityF9T1(player, runtime);
  const hqProtection = expertEvaluateHqStructureProtectionF9T1(player, runtime);
  const psStructures = expertEvaluatePsStructuresF9T1(player, runtime);
  const hqOccupationRisk = expertEvaluateHqOccupationRiskF9T1(player, runtime, proximity);
  return {
    contractVersion:EXPERT_COMMON_CONTRACT_VERSION_F9T1,
    adaptiveEnemyProximity:proximity,
    hqStructureProtection:hqProtection,
    psStructures,
    hqOccupationRisk
  };
}
