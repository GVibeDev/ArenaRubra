"use strict";

// AR-AC1 - proiezioni di mappa, terreno e giocatori su stato iniettato.
// Nessun accesso diretto a DOM, storage o globali di partita.

function createMapStateQueriesService(dependencies = {}) {
  const {
    getState,
    getDefaultDefinition,
    cellIndex,
    cellKey,
    clone,
    terrainDefinition,
    centerCoord,
    hexDistance,
    hasPlayerActive,
    playerActive,
    hasCombatUnits,
    combatUnits,
    hasHeadquartersLookup,
    headquartersLookup
  } = dependencies;

  function activeMapDefinition() {
    const sourceState = getState();
    if (sourceState && sourceState.mapDefinition) return sourceState.mapDefinition;
    return getDefaultDefinition();
  }

  function activeMapCells() {
    const sourceState = getState();
    if (sourceState && Array.isArray(sourceState.cells)) return sourceState.cells;
    const definition = activeMapDefinition();
    return definition && definition.geometry ? definition.geometry.cells || [] : [];
  }

  function mapCell(coord, definition = null) {
    const cells = definition && definition.geometry
      ? definition.geometry.cells || []
      : activeMapCells();
    return cellIndex(cells).get(cellKey(coord)) || null;
  }

  function mapHeadquarters(playerId, definition = null) {
    const active = definition || activeMapDefinition();
    const slot = active && Array.isArray(active.playerSlots)
      ? active.playerSlots.find(entry => Number(entry.slotId) === Number(playerId))
      : null;
    return slot && Array.isArray(slot.headquarters) ? [...slot.headquarters] : null;
  }

  function mapStrategicPoints(definition = null) {
    const active = definition || activeMapDefinition();
    return active && Array.isArray(active.strategicPoints)
      ? active.strategicPoints.map(ps => ({ ...ps, coord: [...ps.coord] }))
      : [];
  }

  function centralStrategicPoint(definition = null) {
    const active = definition || activeMapDefinition();
    const points = active && Array.isArray(active.strategicPoints) ? active.strategicPoints : [];
    if (!points.length) return null;
    const explicitId = active && active.centralStrategicPointId ? String(active.centralStrategicPointId) : "";
    const explicit = explicitId ? points.find(ps => String(ps.id) === explicitId) : null;
    const tagged = points.find(ps => Array.isArray(ps.tags) && ps.tags.includes("central"));
    const fallback = points.find(ps => cellKey(ps.coord) === "0,0,0");
    const central = explicit || tagged || fallback || null;
    return central ? { ...central, coord: [...central.coord] } : null;
  }

  function centralStrategicPointCoord(definition = null) {
    const central = centralStrategicPoint(definition);
    return central ? [...central.coord] : centerCoord();
  }

  function isCentralStrategicPoint(coord, definition = null) {
    const central = centralStrategicPoint(definition);
    return Boolean(central && cellKey(central.coord) === cellKey(coord));
  }

  function centralStrategicPointDistances(definition = null) {
    const active = definition || activeMapDefinition();
    const central = centralStrategicPoint(active);
    if (!active || !central || !Array.isArray(active.playerSlots)) return [];
    return active.playerSlots.map(slot => ({
      player: Number(slot.slotId),
      distance: hexDistance(central.coord, slot.headquarters)
    }));
  }

  function mapDeploymentDefinition(playerId, definition = null) {
    const active = definition || activeMapDefinition();
    const slot = active && Array.isArray(active.playerSlots)
      ? active.playerSlots.find(entry => Number(entry.slotId) === Number(playerId))
      : null;
    return slot && slot.deployment ? clone(slot.deployment) : null;
  }

  function isMapCoordValid(coord, definition = null) {
    return Boolean(mapCell(coord, definition));
  }

  function mapTerrainAt(coord, definition = null) {
    const cell = mapCell(coord, definition);
    return terrainDefinition(cell && cell.terrainType || "free") || terrainDefinition("free");
  }

  function terrainUsage(definition = null) {
    const active = definition || activeMapDefinition();
    const usage = {};
    for (const cell of active && active.geometry && Array.isArray(active.geometry.cells) ? active.geometry.cells : []) {
      const terrainId = cell.terrainType || "free";
      usage[terrainId] = (usage[terrainId] || 0) + 1;
    }
    return usage;
  }

  function mapMovementMultiplier(definition = null) {
    const active = definition || activeMapDefinition();
    return Math.max(1, Math.min(3, Number(active && active.movementMultiplier) || 1));
  }

  function terrainMovementCost(coord, definition = null) {
    const terrain = mapTerrainAt(coord, definition);
    if (!terrain || terrain.blocksMovement || terrain.blocksOccupation) return Infinity;
    return Number.isFinite(terrain.movementCost) ? Math.max(1, terrain.movementCost) : Math.max(1, Math.round(1 / (terrain.movementFactor || 1)));
  }

  function terrainDefenseModifier(unit) {
    if (!unit || !Array.isArray(unit.pos)) return 0;
    const terrain = mapTerrainAt(unit.pos);
    return terrain && Number.isFinite(terrain.defenseModifier) ? terrain.defenseModifier : 0;
  }

  function effectiveDefense(unit) {
    const current = Math.max(0, Number(unit && unit.currentDef) || 0);
    return Math.max(0, current + terrainDefenseModifier(unit));
  }

  function playerIds(sourceState = null) {
    const source = sourceState || getState();
    if (source && Array.isArray(source.players) && source.players.length) {
      return source.players.map(player => Number(player.id)).filter(Number.isInteger);
    }
    const definition = source && source.mapDefinition ? source.mapDefinition : activeMapDefinition();
    const count = Math.max(2, Math.min(4, Number(definition && definition.playerCount) || 2));
    return Array.from({ length: count }, (_, index) => index + 1);
  }

  function playerById(playerId) {
    const sourceState = getState();
    if (!sourceState || !Array.isArray(sourceState.players)) return null;
    return sourceState.players.find(player => Number(player.id) === Number(playerId)) || null;
  }

  function activePlayers() {
    const sourceState = getState();
    if (!sourceState) return [];
    return playerIds(sourceState).filter(playerId => {
      if (hasPlayerActive()) return playerActive(playerId);
      const player = playerById(playerId);
      return !player || player.eliminated !== true;
    });
  }

  function enemyPlayers(playerId) {
    return activePlayers().filter(id => Number(id) !== Number(playerId));
  }

  function playerEliminated(playerId) {
    const player = playerById(playerId);
    return Boolean(player && player.eliminated === true);
  }

  function enemySide(playerId, otherPlayerId) {
    return Number(playerId) !== Number(otherPlayerId) && !playerEliminated(otherPlayerId);
  }

  function enemyCombatUnits(playerId) {
    if (!hasCombatUnits()) return [];
    const enemyIds = new Set(enemyPlayers(playerId));
    return combatUnits(null).filter(unit => enemyIds.has(Number(unit.side)));
  }

  function nextActivePlayerId(playerId) {
    const sourceState = getState();
    const order = sourceState && Array.isArray(sourceState.turnOrder) && sourceState.turnOrder.length
      ? sourceState.turnOrder.map(Number)
      : playerIds();
    if (!order.length) return null;
    const start = Math.max(0, order.indexOf(Number(playerId)));
    for (let offset = 1; offset <= order.length; offset += 1) {
      const candidate = order[(start + offset) % order.length];
      if (!playerEliminated(candidate)) return candidate;
    }
    return Number(playerId);
  }

  function playerHeadquarters(playerId) {
    if (hasHeadquartersLookup() && getState()) return headquartersLookup(playerId);
    return mapHeadquarters(playerId);
  }

  return Object.freeze({
    activeMapDefinition,
    activeMapCells,
    mapCell,
    mapHeadquarters,
    mapStrategicPoints,
    centralStrategicPoint,
    centralStrategicPointCoord,
    isCentralStrategicPoint,
    centralStrategicPointDistances,
    mapDeploymentDefinition,
    isMapCoordValid,
    mapTerrainAt,
    terrainUsage,
    mapMovementMultiplier,
    terrainMovementCost,
    terrainDefenseModifier,
    effectiveDefense,
    playerIds,
    playerById,
    activePlayers,
    enemyPlayers,
    playerEliminated,
    enemySide,
    enemyCombatUnits,
    nextActivePlayerId,
    playerHeadquarters
  });
}
