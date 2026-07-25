"use strict";

// F9Q1/F9Q2 - runtime centrale per mappe, giocatori, terreni e validazione.

const ARENA_MAP_STORAGE_KEY = "arenaRubra.maps.v1";
const MAP_RUNTIME_DEFAULT_ID = "map1_starter";

function mapRuntimeClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function mapRuntimeSafeText(value, maxLength = 160) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function mapRuntimeSafeId(value, fallback = "custom_map") {
  const normalized = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  return normalized || fallback;
}

function mapRuntimeCellKey(coord) {
  return Array.isArray(coord) ? coord.join(",") : "";
}

function mapRuntimeValidCubeCoord(coord) {
  return Array.isArray(coord)
    && coord.length === 3
    && coord.every(value => Number.isInteger(value))
    && coord[0] + coord[1] + coord[2] === 0;
}

function mapRuntimeNormalizeCell(rawCell) {
  const cell = rawCell && typeof rawCell === "object" ? rawCell : {};
  const coord = Array.isArray(cell.coord) ? cell.coord.map(Number) : [];
  return {
    coord,
    componentId: mapRuntimeSafeText(cell.componentId || "", 48) || null,
    componentIds: Array.isArray(cell.componentIds) ? cell.componentIds.map(value => mapRuntimeSafeText(value, 48)).filter(Boolean) : [],
    terrainType: mapRuntimeSafeId(cell.terrainType || cell.terrain || "free", "free"),
    cellRole: ["normal", "headquarters", "strategic_point"].includes(cell.cellRole) ? cell.cellRole : "normal",
    ownerPlayerId: Number.isInteger(Number(cell.ownerPlayerId)) ? Number(cell.ownerPlayerId) : null,
    initialHazard: cell.initialHazard && typeof cell.initialHazard === "object"
      ? {
          type: ["trap", "mine"].includes(cell.initialHazard.type) ? cell.initialHazard.type : null,
          sourceType: mapRuntimeSafeText(cell.initialHazard.sourceType || "map", 40),
          sourceId: mapRuntimeSafeText(cell.initialHazard.sourceId || "initial", 80),
          ownerPlayerId: Number.isInteger(Number(cell.initialHazard.ownerPlayerId)) ? Number(cell.initialHazard.ownerPlayerId) : null,
          duration: Number.isFinite(cell.initialHazard.duration) ? Number(cell.initialHazard.duration) : null,
          payload: cell.initialHazard.payload && typeof cell.initialHazard.payload === "object" ? mapRuntimeClone(cell.initialHazard.payload) : {}
        }
      : null
  };
}

function mapRuntimeNormalizeInitialHazard(rawHazard, index = 0) {
  const hazard = rawHazard && typeof rawHazard === "object" ? rawHazard : {};
  return {
    id: mapRuntimeSafeId(hazard.id || hazard.sourceId, `hazard-${index + 1}`),
    type: ["trap", "mine"].includes(hazard.type) ? hazard.type : null,
    coord: Array.isArray(hazard.coord) ? hazard.coord.map(Number) : [],
    sourceType: mapRuntimeSafeText(hazard.sourceType || "map", 40),
    sourceId: mapRuntimeSafeText(hazard.sourceId || hazard.id || `hazard-${index + 1}`, 80),
    ownerPlayerId: Number.isInteger(Number(hazard.ownerPlayerId)) ? Number(hazard.ownerPlayerId) : null,
    duration: Number.isFinite(hazard.duration) ? Number(hazard.duration) : null,
    payload: hazard.payload && typeof hazard.payload === "object" ? mapRuntimeClone(hazard.payload) : {}
  };
}

function mapRuntimeNormalizeDefinition(rawDefinition, options = {}) {
  const raw = rawDefinition && typeof rawDefinition === "object" ? rawDefinition : {};
  const geometry = raw.geometry && typeof raw.geometry === "object" ? raw.geometry : {};
  const components = Array.isArray(geometry.components) ? geometry.components.slice(0, 8).map((component, index) => ({
    id: mapRuntimeSafeId(component && component.id, `hex-${index + 1}`),
    radius: Math.max(1, Math.min(12, Math.trunc(Number(component && component.radius) || 6))),
    origin: Array.isArray(component && component.origin) ? component.origin.map(Number) : [0, 0, 0],
    rotation: Number(component && component.rotation || 0)
  })) : [];
  const cells = Array.isArray(geometry.cells)
    ? geometry.cells.slice(0, MAP_MAX_CELLS + 1).map(mapRuntimeNormalizeCell)
    : [];
  const playerCount = Math.max(2, Math.min(4, Math.trunc(Number(raw.playerCount) || 2)));
  const playerSlots = Array.isArray(raw.playerSlots) ? raw.playerSlots.slice(0, 4).map((slot, index) => ({
    slotId: Number.isInteger(Number(slot && slot.slotId)) ? Number(slot.slotId) : index + 1,
    headquarters: Array.isArray(slot && slot.headquarters) ? slot.headquarters.map(Number) : [],
    deployment: slot && slot.deployment && typeof slot.deployment === "object"
      ? mapRuntimeClone(slot.deployment)
      : { mode: "hq_network", radius: 1 }
  })) : [];
  const strategicPoints = Array.isArray(raw.strategicPoints) ? raw.strategicPoints.slice(0, 64).map((ps, index) => ({
    id: mapRuntimeSafeId(ps && ps.id, `ps-${index + 1}`),
    coord: Array.isArray(ps && ps.coord) ? ps.coord.map(Number) : [],
    incomeValue: Math.max(0, Math.min(10, Number(ps && ps.incomeValue) || 1)),
    tags: Array.isArray(ps && ps.tags) ? ps.tags.map(tag => mapRuntimeSafeText(tag, 32)).filter(Boolean).slice(0, 12) : []
  })) : [];
  const explicitHazards = Array.isArray(raw.initialHazards)
    ? raw.initialHazards.slice(0, 128).map(mapRuntimeNormalizeInitialHazard)
    : [];
  const cellsByKey = new Map(cells.map(cell => [mapRuntimeCellKey(cell.coord), cell]));
  for (const hazard of explicitHazards) {
    if (!hazard.type || !mapRuntimeValidCubeCoord(hazard.coord)) continue;
    const cell = cellsByKey.get(mapRuntimeCellKey(hazard.coord));
    if (!cell || cell.initialHazard) continue;
    cell.initialHazard = {
      type: hazard.type,
      sourceType: hazard.sourceType,
      sourceId: hazard.sourceId,
      ownerPlayerId: hazard.ownerPlayerId,
      duration: hazard.duration,
      payload: mapRuntimeClone(hazard.payload)
    };
  }
  const hazardsByKey = new Map();
  for (const hazard of explicitHazards) {
    if (hazard.type && mapRuntimeValidCubeCoord(hazard.coord)) {
      hazardsByKey.set(`${mapRuntimeCellKey(hazard.coord)}|${hazard.type}`, hazard);
    }
  }
  for (const cell of cells) {
    if (!cell.initialHazard || !cell.initialHazard.type) continue;
    const key = `${mapRuntimeCellKey(cell.coord)}|${cell.initialHazard.type}`;
    if (!hazardsByKey.has(key)) {
      hazardsByKey.set(key, mapRuntimeNormalizeInitialHazard({
        ...cell.initialHazard,
        id: cell.initialHazard.sourceId,
        coord: cell.coord
      }, hazardsByKey.size));
    }
  }
  const initialHazards = [...hazardsByKey.values()];
  const imported = options.imported === true;
  return {
    schemaVersion: Number(raw.schemaVersion) || MAP_SCHEMA_VERSION,
    id: mapRuntimeSafeId(raw.id, options.fallbackId || "custom_map"),
    name: mapRuntimeSafeText(raw.name || "Mappa custom", 80),
    description: mapRuntimeSafeText(raw.description || "", 500),
    official: imported ? false : raw.official === true,
    editable: imported ? true : raw.editable !== false,
    enabled: raw.enabled !== false,
    playerCount,
    movementMultiplier: Math.max(1, Math.min(3, Number(raw.movementMultiplier) || 1)),
    turnOrder: Array.isArray(raw.turnOrder)
      ? raw.turnOrder.map(Number).filter(id => Number.isInteger(id) && id >= 1 && id <= playerCount)
      : Array.from({ length: playerCount }, (_, index) => index + 1),
    geometry: {
      type: ["single_hex", "double_hex", "triple_hex", "explicit_cells"].includes(geometry.type) ? geometry.type : "explicit_cells",
      nominalRadius: Math.max(1, Math.min(12, Math.trunc(Number(geometry.nominalRadius) || 6))),
      components,
      cells
    },
    playerSlots,
    strategicPoints,
    initialHazards,
    presentation: {
      skinKey: mapRuntimeSafeId(raw.presentation && raw.presentation.skinKey || "red_dust", "red_dust"),
      backgroundKey: raw.presentation && raw.presentation.backgroundKey ? mapRuntimeSafeText(raw.presentation.backgroundKey, 120) : null
    },
    metadata: {
      author: mapRuntimeSafeText(raw.metadata && raw.metadata.author || "Arena Rubra", 80),
      revision: Math.max(1, Math.trunc(Number(raw.metadata && raw.metadata.revision) || 1)),
      tags: Array.isArray(raw.metadata && raw.metadata.tags)
        ? raw.metadata.tags.map(tag => mapRuntimeSafeText(tag, 32)).filter(Boolean).slice(0, 20)
        : [],
      symmetry: mapRuntimeSafeText(raw.metadata && raw.metadata.symmetry || "", 48) || null,
      source: mapRuntimeSafeText(raw.metadata && raw.metadata.source || "", 80) || null,
      createdAt: mapRuntimeSafeText(raw.metadata && raw.metadata.createdAt || "", 40) || null,
      updatedAt: mapRuntimeSafeText(raw.metadata && raw.metadata.updatedAt || "", 40) || null,
      sourceMapId: mapRuntimeSafeId(raw.metadata && raw.metadata.sourceMapId || "", "") || null
    }
  };
}

function mapRuntimeReadCustomStore() {
  const fallback = { schemaVersion: 1, maps: {} };
  const store = typeof arenaStorageReadJson === "function"
    ? arenaStorageReadJson(ARENA_MAP_STORAGE_KEY, fallback)
    : fallback;
  if (!store || typeof store !== "object" || Array.isArray(store)) return fallback;
  if (!store.maps || typeof store.maps !== "object" || Array.isArray(store.maps)) store.maps = {};
  return store;
}

function mapRuntimeWriteCustomStore(store) {
  const safe = store && typeof store === "object" ? store : { schemaVersion: 1, maps: {} };
  safe.schemaVersion = 1;
  if (!safe.maps || typeof safe.maps !== "object" || Array.isArray(safe.maps)) safe.maps = {};
  return typeof arenaStorageWriteJson === "function"
    ? arenaStorageWriteJson(ARENA_MAP_STORAGE_KEY, safe)
    : false;
}

function getBuiltinMapDefinitions() {
  return Object.values(BUILTIN_MAP_DEFINITIONS).map(mapRuntimeClone);
}

function getCustomMapDefinitions() {
  const store = mapRuntimeReadCustomStore();
  return Object.values(store.maps || {}).map(definition => mapRuntimeNormalizeDefinition(definition, { imported: true }));
}

function getAvailableMapDefinitions(options = {}) {
  const includeInvalid = options.includeInvalid === true;
  const all = [...getBuiltinMapDefinitions(), ...getCustomMapDefinitions()];
  return includeInvalid ? all : all.filter(definition => validateMapDefinition(definition).valid);
}

function getMapDefinitionById(mapId, options = {}) {
  const id = mapRuntimeSafeId(mapId || MAP_RUNTIME_DEFAULT_ID, MAP_RUNTIME_DEFAULT_ID);
  if (options.definition && typeof options.definition === "object") {
    const normalized = mapRuntimeNormalizeDefinition(options.definition, { imported: options.definition.official !== true });
    if (normalized.id === id || options.allowMismatchedDefinition === true) return normalized;
  }
  if (BUILTIN_MAP_DEFINITIONS[id]) return mapRuntimeClone(BUILTIN_MAP_DEFINITIONS[id]);
  const custom = mapRuntimeReadCustomStore().maps[id];
  return custom ? mapRuntimeNormalizeDefinition(custom, { imported: true }) : null;
}

function getActiveMapDefinition() {
  if (typeof state !== "undefined" && state && state.mapDefinition) return state.mapDefinition;
  return getMapDefinitionById(MAP_RUNTIME_DEFAULT_ID);
}

function getActiveMapCells() {
  if (typeof state !== "undefined" && state && Array.isArray(state.cells)) return state.cells;
  const definition = getActiveMapDefinition();
  return definition && definition.geometry ? definition.geometry.cells || [] : [];
}

function getMapCell(coord, definition = null) {
  const cells = definition && definition.geometry
    ? definition.geometry.cells || []
    : getActiveMapCells();
  const key = mapRuntimeCellKey(coord);
  return cells.find(cell => mapRuntimeCellKey(cell.coord) === key) || null;
}

function getMapHeadquarters(playerId, definition = null) {
  const active = definition || getActiveMapDefinition();
  const slot = active && Array.isArray(active.playerSlots)
    ? active.playerSlots.find(entry => Number(entry.slotId) === Number(playerId))
    : null;
  return slot && Array.isArray(slot.headquarters) ? [...slot.headquarters] : null;
}

function getMapStrategicPoints(definition = null) {
  const active = definition || getActiveMapDefinition();
  return active && Array.isArray(active.strategicPoints)
    ? active.strategicPoints.map(ps => ({ ...ps, coord: [...ps.coord] }))
    : [];
}

function getMapDeploymentDefinition(playerId, definition = null) {
  const active = definition || getActiveMapDefinition();
  const slot = active && Array.isArray(active.playerSlots)
    ? active.playerSlots.find(entry => Number(entry.slotId) === Number(playerId))
    : null;
  return slot && slot.deployment ? mapRuntimeClone(slot.deployment) : null;
}

function isMapCoordValid(coord, definition = null) {
  return Boolean(getMapCell(coord, definition));
}

function getMapTerrainAt(coord, definition = null) {
  const cell = getMapCell(coord, definition);
  return terrainDefinition(cell && cell.terrainType || "free") || terrainDefinition("free");
}

function mapTerrainUsage(definition = null) {
  const active = definition || getActiveMapDefinition();
  const usage = {};
  for (const cell of active && active.geometry && Array.isArray(active.geometry.cells) ? active.geometry.cells : []) {
    const terrainId = cell.terrainType || "free";
    usage[terrainId] = (usage[terrainId] || 0) + 1;
  }
  return usage;
}

function getMapMovementMultiplier(definition = null) {
  const active = definition || getActiveMapDefinition();
  return Math.max(1, Math.min(3, Number(active && active.movementMultiplier) || 1));
}

function getTerrainMovementCost(coord, definition = null) {
  const terrain = getMapTerrainAt(coord, definition);
  if (!terrain || terrain.blocksMovement || terrain.blocksOccupation) return Infinity;
  return Number.isFinite(terrain.movementCost) ? Math.max(1, terrain.movementCost) : Math.max(1, Math.round(1 / (terrain.movementFactor || 1)));
}

function getTerrainDefenseModifier(unit) {
  if (!unit || !Array.isArray(unit.pos)) return 0;
  const terrain = getMapTerrainAt(unit.pos);
  return terrain && Number.isFinite(terrain.defenseModifier) ? terrain.defenseModifier : 0;
}

function getEffectiveDefense(unit) {
  const current = Math.max(0, Number(unit && unit.currentDef) || 0);
  return Math.max(0, current + getTerrainDefenseModifier(unit));
}

function mapRuntimePlayerIds(sourceState = null) {
  const source = sourceState || (typeof state !== "undefined" ? state : null);
  if (source && Array.isArray(source.players) && source.players.length) {
    return source.players.map(player => Number(player.id)).filter(Number.isInteger);
  }
  const definition = source && source.mapDefinition ? source.mapDefinition : getActiveMapDefinition();
  const count = Math.max(2, Math.min(4, Number(definition && definition.playerCount) || 2));
  return Array.from({ length: count }, (_, index) => index + 1);
}

function getPlayerById(playerId) {
  if (typeof state === "undefined" || !state || !Array.isArray(state.players)) return null;
  return state.players.find(player => Number(player.id) === Number(playerId)) || null;
}

function getActivePlayers() {
  if (typeof state === "undefined" || !state) return [];
  return mapRuntimePlayerIds(state).filter(playerId => {
    const player = getPlayerById(playerId);
    return !player || player.eliminated !== true;
  });
}

function getEnemyPlayers(playerId) {
  return getActivePlayers().filter(id => Number(id) !== Number(playerId));
}

function isPlayerEliminated(playerId) {
  const player = getPlayerById(playerId);
  return Boolean(player && player.eliminated === true);
}

function isEnemySide(playerId, otherPlayerId) {
  return Number(playerId) !== Number(otherPlayerId) && !isPlayerEliminated(otherPlayerId);
}

function enemyCombatUnits(playerId) {
  if (typeof combatUnits !== "function") return [];
  const enemyIds = new Set(getEnemyPlayers(playerId));
  return combatUnits(null).filter(unit => enemyIds.has(Number(unit.side)));
}

function getNextActivePlayerId(playerId) {
  const order = typeof state !== "undefined" && state && Array.isArray(state.turnOrder) && state.turnOrder.length
    ? state.turnOrder.map(Number)
    : mapRuntimePlayerIds();
  if (!order.length) return null;
  const start = Math.max(0, order.indexOf(Number(playerId)));
  for (let offset = 1; offset <= order.length; offset += 1) {
    const candidate = order[(start + offset) % order.length];
    if (!isPlayerEliminated(candidate)) return candidate;
  }
  return Number(playerId);
}

function getPlayerHeadquarters(playerId) {
  if (typeof getHq === "function" && typeof state !== "undefined" && state) return getHq(playerId);
  return getMapHeadquarters(playerId);
}

function mapRuntimeNeighbors(coord) {
  const directions = typeof HEX_DIRECTIONS !== "undefined" ? HEX_DIRECTIONS : [
    [1, -1, 0], [1, 0, -1], [0, 1, -1], [-1, 1, 0], [-1, 0, 1], [0, -1, 1]
  ];
  return directions.map(direction => [
    coord[0] + direction[0],
    coord[1] + direction[1],
    coord[2] + direction[2]
  ]);
}

function mapRuntimeReachableKeys(definition, startCoord) {
  const cells = definition && definition.geometry ? definition.geometry.cells || [] : [];
  const valid = new Map(cells.map(cell => [mapRuntimeCellKey(cell.coord), cell]));
  const startKey = mapRuntimeCellKey(startCoord);
  if (!valid.has(startKey)) return new Set();
  const queue = [startCoord];
  const reached = new Set([startKey]);
  while (queue.length) {
    const current = queue.shift();
    for (const next of mapRuntimeNeighbors(current)) {
      const key = mapRuntimeCellKey(next);
      const cell = valid.get(key);
      const terrain = cell ? terrainDefinition(cell.terrainType || "free") : null;
      if (!cell || reached.has(key) || !terrain || terrain.blocksMovement || terrain.blocksOccupation) continue;
      reached.add(key);
      queue.push(next);
    }
  }
  return reached;
}

function mapRuntimeSingleCellChokes(definition) {
  const traversable = new Map((definition && definition.geometry && definition.geometry.cells || [])
    .filter(cell => {
      const terrain = terrainDefinition(cell.terrainType || "free");
      return terrain && !terrain.blocksMovement && !terrain.blocksOccupation;
    })
    .map(cell => [mapRuntimeCellKey(cell.coord), cell.coord]));
  const discovery = new Map();
  const low = new Map();
  const parent = new Map();
  const articulation = new Set();
  let time = 0;
  const visit = key => {
    discovery.set(key, ++time);
    low.set(key, discovery.get(key));
    let children = 0;
    for (const coord of mapRuntimeNeighbors(traversable.get(key))) {
      const nextKey = mapRuntimeCellKey(coord);
      if (!traversable.has(nextKey)) continue;
      if (!discovery.has(nextKey)) {
        parent.set(nextKey, key);
        children += 1;
        visit(nextKey);
        low.set(key, Math.min(low.get(key), low.get(nextKey)));
        if (!parent.has(key) && children > 1) articulation.add(key);
        if (parent.has(key) && low.get(nextKey) >= discovery.get(key)) articulation.add(key);
      } else if (parent.get(key) !== nextKey) {
        low.set(key, Math.min(low.get(key), discovery.get(nextKey)));
      }
    }
  };
  for (const key of traversable.keys()) if (!discovery.has(key)) visit(key);
  return [...articulation].map(key => traversable.get(key));
}

function mapRuntimeRotate60(coord) {
  return [-coord[2], -coord[0], -coord[1]];
}

function mapRuntimeSymmetryTargets(coord, mode) {
  if (mode === "rotation-2") return [[...coord], [-coord[0], -coord[1], -coord[2]]];
  if (mode === "radial-3") {
    const rotate = (value, turns) => {
      let result = [...value];
      for (let index = 0; index < turns; index += 1) result = mapRuntimeRotate60(result);
      return result;
    };
    return [[...coord], rotate(coord, 2), rotate(coord, 4)];
  }
  return [[...coord]];
}

function mapRuntimeObstacleSymmetryIssues(definition) {
  const mode = definition && definition.metadata ? definition.metadata.symmetry : null;
  if (!["rotation-2", "radial-3"].includes(mode)) return [];
  const cells = new Map((definition.geometry.cells || []).map(cell => [mapRuntimeCellKey(cell.coord), cell]));
  const issues = [];
  for (const cell of definition.geometry.cells || []) {
    if (cell.terrainType !== "obstacle") continue;
    for (const target of mapRuntimeSymmetryTargets(cell.coord, mode)) {
      const counterpart = cells.get(mapRuntimeCellKey(target));
      if (!counterpart || counterpart.terrainType !== "obstacle") {
        issues.push({ source: [...cell.coord], target });
      }
    }
  }
  return issues;
}

function findMapPath(definition, startCoord, targetCoord, options = {}) {
  if (!definition || !mapRuntimeValidCubeCoord(startCoord) || !mapRuntimeValidCubeCoord(targetCoord)) return null;
  const cells = new Map((definition.geometry && definition.geometry.cells || []).map(cell => [mapRuntimeCellKey(cell.coord), cell]));
  const startKey = mapRuntimeCellKey(startCoord);
  const targetKey = mapRuntimeCellKey(targetCoord);
  if (!cells.has(startKey) || !cells.has(targetKey)) return null;
  const distances = new Map([[startKey, 0]]);
  const previous = new Map();
  const queue = [{ coord: [...startCoord], cost: 0 }];
  const occupied = options.occupiedKeys instanceof Set ? options.occupiedKeys : new Set();
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    const currentKey = mapRuntimeCellKey(current.coord);
    if (current.cost !== distances.get(currentKey)) continue;
    if (currentKey === targetKey) break;
    for (const next of mapRuntimeNeighbors(current.coord)) {
      const nextKey = mapRuntimeCellKey(next);
      const cell = cells.get(nextKey);
      const terrain = cell ? terrainDefinition(cell.terrainType || "free") : null;
      if (!cell || !terrain || terrain.blocksMovement || terrain.blocksOccupation) continue;
      if (occupied.has(nextKey) && nextKey !== targetKey) continue;
      const stepCost = Number.isFinite(terrain.movementCost) ? terrain.movementCost : 1;
      const nextCost = current.cost + stepCost;
      if (nextCost >= (distances.get(nextKey) ?? Infinity)) continue;
      distances.set(nextKey, nextCost);
      previous.set(nextKey, currentKey);
      queue.push({ coord: next, cost: nextCost });
    }
  }
  if (!distances.has(targetKey)) return null;
  const keys = [];
  let cursor = targetKey;
  while (cursor) {
    keys.push(cursor);
    if (cursor === startKey) break;
    cursor = previous.get(cursor);
  }
  keys.reverse();
  return {
    cost: distances.get(targetKey),
    coords: keys.map(key => key.split(",").map(Number))
  };
}

function mapReachableCells(definition, startCoord, budget, options = {}) {
  const cells = new Map((definition && definition.geometry && definition.geometry.cells || []).map(cell => [mapRuntimeCellKey(cell.coord), cell]));
  const startKey = mapRuntimeCellKey(startCoord);
  if (!cells.has(startKey) || budget <= 0) return [];
  const occupied = options.occupiedKeys instanceof Set ? options.occupiedKeys : new Set();
  const distances = new Map([[startKey, 0]]);
  const queue = [{ coord: [...startCoord], cost: 0 }];
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    const currentKey = mapRuntimeCellKey(current.coord);
    if (current.cost !== distances.get(currentKey)) continue;
    for (const next of mapRuntimeNeighbors(current.coord)) {
      const nextKey = mapRuntimeCellKey(next);
      const cell = cells.get(nextKey);
      const terrain = cell ? terrainDefinition(cell.terrainType || "free") : null;
      if (!cell || !terrain || terrain.blocksMovement || terrain.blocksOccupation || occupied.has(nextKey)) continue;
      const nextCost = current.cost + (Number.isFinite(terrain.movementCost) ? terrain.movementCost : 1);
      if (nextCost > budget || nextCost >= (distances.get(nextKey) ?? Infinity)) continue;
      distances.set(nextKey, nextCost);
      queue.push({ coord: next, cost: nextCost });
    }
  }
  return [...distances.entries()]
    .filter(([key]) => key !== startKey)
    .map(([key, cost]) => ({ coord: key.split(",").map(Number), cost }));
}

function validateMapDefinition(rawDefinition, options = {}) {
  const errors = [];
  const warnings = [];
  const raw = rawDefinition && typeof rawDefinition === "object" ? rawDefinition : {};
  const definition = mapRuntimeNormalizeDefinition(raw, { imported: options.imported === true });
  const pushError = (code, message, coord = null) => errors.push({ code, message, coord });
  const pushWarning = (code, message, coord = null) => warnings.push({ code, message, coord });

  if (Number(raw.schemaVersion) !== MAP_SCHEMA_VERSION) pushError("E_MAP_SCHEMA_UNSUPPORTED", `schemaVersion ${raw.schemaVersion} non supportata.`);
  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(String(raw.id || ""))) pushError("E_MAP_INVALID_ID", "ID mappa non valido.");
  if (![1, 2, 3].includes(Number(raw.movementMultiplier))) {
    pushError("E_MAP_INVALID_MOVEMENT_MULTIPLIER", "Il moltiplicatore movimento deve essere ×1, ×2 oppure ×3.");
  }
  const cells = definition.geometry.cells;
  if (!cells.length) pushError("E_MAP_EMPTY", "La mappa non contiene celle.");
  if (cells.length > MAP_MAX_CELLS) pushError("E_MAP_TOO_LARGE", `La mappa supera il limite di ${MAP_MAX_CELLS} celle.`);
  const keys = new Set();
  for (const cell of cells) {
    if (!mapRuntimeValidCubeCoord(cell.coord)) {
      pushError("E_MAP_INVALID_CUBE_COORD", `Coordinate cubiche non valide: ${JSON.stringify(cell.coord)}.`, cell.coord);
      continue;
    }
    const key = mapRuntimeCellKey(cell.coord);
    if (keys.has(key)) pushError("E_MAP_DUPLICATE_COORD", `Coordinate duplicate: ${key}.`, cell.coord);
    keys.add(key);
    const terrain = terrainDefinition(cell.terrainType);
    if (!terrain) pushError("E_MAP_UNKNOWN_TERRAIN", `Terreno sconosciuto: ${cell.terrainType}.`, cell.coord);
    if (cell.initialHazard && !["trap", "mine"].includes(cell.initialHazard.type)) {
      pushError("E_MAP_INVALID_INITIAL_HAZARD", `Pericolo iniziale non valido in ${key}.`, cell.coord);
    }
    if (cell.initialHazard && (cell.cellRole !== "normal" || (terrain && terrain.blocksOccupation))) {
      pushError("E_MAP_INVALID_INITIAL_HAZARD_CELL", `Pericolo iniziale non consentito su ruolo ${cell.cellRole} o terreno ${cell.terrainType}.`, cell.coord);
    }
  }

  const hazardKeys = new Set();
  for (const [index, hazard] of (Array.isArray(raw.initialHazards) ? raw.initialHazards : []).entries()) {
    if (!hazard || !["trap", "mine"].includes(hazard.type)) {
      pushError("E_MAP_INVALID_INITIAL_HAZARD", `Pericolo iniziale ${index + 1} con tipo non valido.`);
      continue;
    }
    if (!mapRuntimeValidCubeCoord(hazard.coord)) {
      pushError("E_MAP_INVALID_CUBE_COORD", `Pericolo iniziale ${index + 1} con coordinate non valide.`, hazard.coord);
      continue;
    }
    const key = mapRuntimeCellKey(hazard.coord);
    if (!keys.has(key)) pushError("E_MAP_INITIAL_HAZARD_OUTSIDE_CELLS", `Pericolo iniziale ${index + 1} fuori mappa.`, hazard.coord);
    const uniqueKey = `${key}|${hazard.type}`;
    if (hazardKeys.has(uniqueKey)) pushError("E_MAP_DUPLICATE_INITIAL_HAZARD", `Pericolo iniziale duplicato in ${key}.`, hazard.coord);
    hazardKeys.add(uniqueKey);
  }

  if (definition.playerSlots.length !== definition.playerCount) {
    pushError("E_MAP_HQ_COUNT_MISMATCH", `Attesi ${definition.playerCount} QG, trovati ${definition.playerSlots.length}.`);
  }
  const slotIds = new Set();
  const hqKeys = new Set();
  for (const slot of definition.playerSlots) {
    if (slotIds.has(slot.slotId)) pushError("E_MAP_DUPLICATE_PLAYER_SLOT", `Slot giocatore duplicato: ${slot.slotId}.`);
    slotIds.add(slot.slotId);
    if (!mapRuntimeValidCubeCoord(slot.headquarters)) {
      pushError("E_MAP_INVALID_CUBE_COORD", `QG G${slot.slotId} con coordinate non valide.`, slot.headquarters);
      continue;
    }
    const key = mapRuntimeCellKey(slot.headquarters);
    if (!keys.has(key)) pushError("E_MAP_HQ_OUTSIDE_CELLS", `QG G${slot.slotId} fuori mappa.`, slot.headquarters);
    if (hqKeys.has(key)) pushError("E_MAP_DUPLICATE_HQ", `Più QG sulla cella ${key}.`, slot.headquarters);
    hqKeys.add(key);
    const terrain = getMapTerrainAt(slot.headquarters, definition);
    if (terrain && terrain.blocksOccupation) pushError("E_MAP_OBSTACLE_ON_HQ", `QG G${slot.slotId} su ostacolo.`, slot.headquarters);
    if (!slot.deployment || slot.deployment.mode !== "hq_network") pushError("E_MAP_INVALID_DEPLOYMENT", `Deployment G${slot.slotId} non valido.`);
  }

  const psKeys = new Set();
  for (const ps of definition.strategicPoints) {
    if (!mapRuntimeValidCubeCoord(ps.coord)) {
      pushError("E_MAP_INVALID_CUBE_COORD", `PS ${ps.id} con coordinate non valide.`, ps.coord);
      continue;
    }
    const key = mapRuntimeCellKey(ps.coord);
    if (!keys.has(key)) pushError("E_MAP_PS_OUTSIDE_CELLS", `PS ${ps.id} fuori mappa.`, ps.coord);
    if (psKeys.has(key)) pushError("E_MAP_DUPLICATE_PS", `PS duplicato sulla cella ${key}.`, ps.coord);
    if (hqKeys.has(key)) pushError("E_MAP_PS_OVERLAPS_HQ", `PS ${ps.id} sovrapposto a un QG.`, ps.coord);
    psKeys.add(key);
    const terrain = getMapTerrainAt(ps.coord, definition);
    if (terrain && terrain.blocksOccupation) pushError("E_MAP_OBSTACLE_ON_PS", `PS ${ps.id} su ostacolo.`, ps.coord);
  }

  const traversableCells = cells.filter(cell => {
    const terrain = terrainDefinition(cell.terrainType || "free");
    return terrain && !terrain.blocksMovement && !terrain.blocksOccupation;
  });
  if (traversableCells.length) {
    const reached = mapRuntimeReachableKeys(definition, traversableCells[0].coord);
    if (reached.size !== traversableCells.length) {
      pushError("E_MAP_DISCONNECTED", `Regione giocabile disconnessa: ${reached.size}/${traversableCells.length} celle raggiungibili.`);
    }
    const chokes = mapRuntimeSingleCellChokes(definition);
    if (chokes.length) {
      pushWarning("W_MAP_SINGLE_CELL_CHOKE", `La regione percorribile contiene ${chokes.length} strozzature a cella singola.`, chokes[0]);
    }
  }

  for (const slot of definition.playerSlots) {
    for (const other of definition.playerSlots) {
      if (slot.slotId >= other.slotId) continue;
      if (!findMapPath(definition, slot.headquarters, other.headquarters)) {
        pushError("E_MAP_PLAYER_ISOLATED", `Nessun percorso teorico fra G${slot.slotId} e G${other.slotId}.`);
      }
    }
    for (const ps of definition.strategicPoints) {
      if (!findMapPath(definition, slot.headquarters, ps.coord)) {
        pushError("E_MAP_PS_UNREACHABLE", `${ps.id} non raggiungibile da G${slot.slotId}.`, ps.coord);
      }
    }
  }

  const centerDistances = definition.playerSlots.map(slot => {
    if (!definition.strategicPoints.length) return 0;
    return Math.min(...definition.strategicPoints.map(ps => {
      const path = findMapPath(definition, slot.headquarters, ps.coord);
      return path ? path.cost : Infinity;
    }));
  });
  const finiteDistances = centerDistances.filter(Number.isFinite);
  if (finiteDistances.length > 1 && Math.max(...finiteDistances) - Math.min(...finiteDistances) > 3) {
    pushWarning("W_MAP_HQ_DISTANCE_IMBALANCE", `Distanze QG-obiettivo sbilanciate: ${finiteDistances.join(", ")}.`);
  }
  const minHqDistance = definition.playerSlots.length > 1
    ? Math.min(...definition.playerSlots.flatMap((slot, index) => definition.playerSlots.slice(index + 1).map(other => {
        const path = findMapPath(definition, slot.headquarters, other.headquarters);
        return path ? path.cost : Infinity;
      })))
    : Infinity;
  if (Number.isFinite(minHqDistance) && minHqDistance <= definition.movementMultiplier * 2) {
    pushWarning("W_MAP_FIRST_TURN_HQ_THREAT", `Distanza minima fra QG ${minHqDistance}: verificare minaccia nel primo turno.`);
  }
  const symmetryIssues = mapRuntimeObstacleSymmetryIssues(definition);
  if (symmetryIssues.length) {
    pushWarning("W_MAP_ASYMMETRIC_TERRAIN", `Ostacoli non coerenti con la simmetria ${definition.metadata.symmetry}: ${symmetryIssues.length} repliche mancanti.`, symmetryIssues[0].target);
  } else if (definition.metadata.symmetry && definition.metadata.symmetry.startsWith("near-")) {
    pushWarning("W_MAP_ASYMMETRIC_TERRAIN", `Simmetria dichiarata come approssimata: ${definition.metadata.symmetry}.`);
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    definition,
    summary: {
      playerCount: definition.playerCount,
      cellCount: cells.length,
      strategicPointCount: definition.strategicPoints.length,
      terrainUsage: mapTerrainUsage(definition)
    }
  };
}

function saveCustomMapDefinition(rawDefinition, options = {}) {
  const normalized = mapRuntimeNormalizeDefinition(rawDefinition, { imported: true });
  normalized.official = false;
  normalized.editable = true;
  const store = mapRuntimeReadCustomStore();
  if (BUILTIN_MAP_DEFINITIONS[normalized.id]) {
    return { ok: false, issues: ["Una mappa custom non può sovrascrivere una mappa built-in."], code: "E_MAP_BUILTIN_READ_ONLY" };
  }
  if (store.maps[normalized.id] && options.overwrite !== true) {
    return { ok: false, issues: [`ID già presente: ${normalized.id}.`], code: "E_MAP_ID_CONFLICT" };
  }
  const now = new Date().toISOString();
  normalized.metadata.createdAt = normalized.metadata.createdAt || now;
  normalized.metadata.updatedAt = now;
  normalized.metadata.revision = Math.max(1, Number(normalized.metadata.revision) || 1);
  const validation = validateMapDefinition(normalized, { imported: true });
  if (!validation.valid) return { ok: false, issues: validation.errors.map(issue => `${issue.code}: ${issue.message}`), validation };
  store.maps[normalized.id] = normalized;
  const ok = mapRuntimeWriteCustomStore(store);
  return { ok, definition: normalized, validation, issues: ok ? [] : ["Scrittura storage fallita."] };
}

function deleteCustomMapDefinition(mapId) {
  const id = mapRuntimeSafeId(mapId, "");
  if (!id || BUILTIN_MAP_DEFINITIONS[id]) return { ok: false, code: "E_MAP_BUILTIN_READ_ONLY" };
  const store = mapRuntimeReadCustomStore();
  if (!store.maps[id]) return { ok: false, code: "E_MAP_NOT_FOUND" };
  delete store.maps[id];
  return { ok: mapRuntimeWriteCustomStore(store) };
}

function duplicateMapDefinition(mapId, requestedId = "") {
  const source = getMapDefinitionById(mapId);
  if (!source) return { ok: false, issues: ["Mappa sorgente non trovata."] };
  const existing = new Set(getAvailableMapDefinitions({ includeInvalid: true }).map(definition => definition.id));
  const base = mapRuntimeSafeId(requestedId || `${source.id}_copy`, `${source.id}_copy`);
  let id = base;
  let suffix = 2;
  while (existing.has(id)) id = `${base}_${suffix++}`;
  const copy = mapRuntimeNormalizeDefinition({
    ...mapRuntimeClone(source),
    id,
    name: `${source.name} · copia`,
    official: false,
    editable: true,
    metadata: {
      ...(source.metadata || {}),
      revision: 1,
      sourceMapId: source.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }, { imported: true });
  return { ok: true, definition: copy };
}

function exportMapDefinitionJson(rawDefinition) {
  const validation = validateMapDefinition(rawDefinition, { imported: rawDefinition && rawDefinition.official !== true });
  if (!validation.valid) return { ok: false, validation, json: "" };
  return {
    ok: true,
    validation,
    json: JSON.stringify({
      kind: "arena-rubra-map",
      schemaVersion: MAP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      map: validation.definition
    }, null, 2)
  };
}

function importMapDefinitionJson(text, options = {}) {
  const rawText = String(text || "");
  if (rawText.length > 1024 * 1024) return { ok: false, issues: ["JSON oltre il limite di 1 MiB."] };
  let parsed;
  try { parsed = JSON.parse(rawText); }
  catch (error) { return { ok: false, issues: [`JSON non valido: ${error.message || error}`] }; }
  const source = parsed && parsed.map && typeof parsed.map === "object" ? parsed.map : parsed;
  let definition = mapRuntimeNormalizeDefinition(source, { imported: true });
  const existing = new Set(getAvailableMapDefinitions({ includeInvalid: true }).map(item => item.id));
  let conflict = false;
  if (existing.has(definition.id)) {
    conflict = true;
    const base = mapRuntimeSafeId(`${definition.id}_import`, "custom_map_import");
    let candidate = base;
    let suffix = 2;
    while (existing.has(candidate)) candidate = `${base}_${suffix++}`;
    definition.id = candidate;
    definition.name = `${definition.name} · import`;
  }
  const validation = validateMapDefinition(definition, { imported: true });
  if (!validation.valid) {
    return { ok: false, issues: validation.errors.map(issue => `${issue.code}: ${issue.message}`), validation, definition };
  }
  if (options.save === false) return { ok: true, definition, validation, conflict };
  const saved = saveCustomMapDefinition(definition, { overwrite: false });
  return { ...saved, definition, validation, conflict };
}
