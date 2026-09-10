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


function mapRuntimeClampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function mapRuntimeSafeImageDataUrl(value, maxLength = 3 * 1024 * 1024) {
  const text = String(value || "");
  if (!/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\r\n]+$/i.test(text)) return null;
  return text.length <= maxLength ? text : null;
}

function mapRuntimeCellKey(coord) {
  return Array.isArray(coord) ? coord.join(",") : "";
}

// F9O7h2 performance hotfix. Geometry coordinates do not change during a
// match, while mutable ownership remains on the indexed cell objects.
const MAP_RUNTIME_PERF = {
  cellIndexBuilds: 0,
  shortestPathQueries: 0,
  reachableQueries: 0
};

function mapRuntimeValidCubeCoord(coord) {
  return Array.isArray(coord)
    && coord.length === 3
    && coord.every(value => Number.isInteger(value))
    && coord[0] + coord[1] + coord[2] === 0;
}

let MAP_PATHFINDING_SERVICE = null;

function mapRuntimeGetPathfindingService() {
  if (!MAP_PATHFINDING_SERVICE) {
    MAP_PATHFINDING_SERVICE = createMapPathfindingService({
      cellKey: mapRuntimeCellKey,
      validCubeCoord: mapRuntimeValidCubeCoord,
      terrainDefinition,
      directionsProvider: () => typeof HEX_DIRECTIONS !== "undefined" ? HEX_DIRECTIONS : [
        [1, -1, 0], [1, 0, -1], [0, 1, -1], [-1, 1, 0], [-1, 0, 1], [0, -1, 1]
      ],
      perf: MAP_RUNTIME_PERF
    });
  }
  return MAP_PATHFINDING_SERVICE;
}

function mapRuntimeCellIndex(cells) {
  return mapRuntimeGetPathfindingService().cellIndex(cells);
}

function mapRuntimeHexDistance(a, b) {
  return mapRuntimeGetPathfindingService().hexDistance(a, b);
}

function mapRuntimeNeighbors(coord) {
  return mapRuntimeGetPathfindingService().neighbors(coord);
}

function mapRuntimeReachableKeys(definition, startCoord) {
  return mapRuntimeGetPathfindingService().reachableKeys(definition, startCoord);
}

function mapRuntimeSingleCellChokes(definition) {
  return mapRuntimeGetPathfindingService().singleCellChokes(definition);
}

function mapRuntimeObstacleSymmetryIssues(definition) {
  return mapRuntimeGetPathfindingService().obstacleSymmetryIssues(definition);
}

function findMapPath(definition, startCoord, targetCoord, options = {}) {
  return mapRuntimeGetPathfindingService().findPath(definition, startCoord, targetCoord, options);
}

function mapReachableCells(definition, startCoord, budget, options = {}) {
  return mapRuntimeGetPathfindingService().reachableCells(definition, startCoord, budget, options);
}

let MAP_NORMALIZATION_SERVICE = null;

function mapRuntimeGetNormalizationService() {
  if (!MAP_NORMALIZATION_SERVICE) {
    MAP_NORMALIZATION_SERVICE = createMapNormalizationService({
      schemaVersion: MAP_SCHEMA_VERSION,
      maxCells: MAP_MAX_CELLS,
      clone: mapRuntimeClone,
      safeText: mapRuntimeSafeText,
      safeId: mapRuntimeSafeId,
      clampNumber: mapRuntimeClampNumber,
      safeImageDataUrl: mapRuntimeSafeImageDataUrl,
      cellKey: mapRuntimeCellKey,
      validCubeCoord: mapRuntimeValidCubeCoord
    });
  }
  return MAP_NORMALIZATION_SERVICE;
}

function mapRuntimeNormalizeDefinition(rawDefinition, options = {}) {
  return mapRuntimeGetNormalizationService().normalizeDefinition(rawDefinition, options);
}

let MAP_PERSISTENCE_SERVICE = null;

function mapRuntimeGetPersistenceService() {
  if (!MAP_PERSISTENCE_SERVICE) {
    MAP_PERSISTENCE_SERVICE = createMapPersistenceService({
      storageKey: ARENA_MAP_STORAGE_KEY,
      schemaVersion: 1,
      readJson: (key, fallback) => typeof arenaStorageReadJson === "function"
        ? arenaStorageReadJson(key, fallback)
        : fallback,
      writeJson: (key, value) => typeof arenaStorageWriteJson === "function"
        ? arenaStorageWriteJson(key, value)
        : false,
      safeId: mapRuntimeSafeId,
      normalizeDefinition: mapRuntimeNormalizeDefinition,
      validateDefinition: (definition, options) => validateMapDefinition(definition, options),
      isBuiltinId: id => Boolean(BUILTIN_MAP_DEFINITIONS[id]),
      nowIso: () => new Date().toISOString()
    });
  }
  return MAP_PERSISTENCE_SERVICE;
}

function mapRuntimeReadCustomStore() {
  return mapRuntimeGetPersistenceService().readStore();
}

function mapRuntimeWriteCustomStore(store) {
  return mapRuntimeGetPersistenceService().writeStore(store);
}

function getBuiltinMapDefinitions(options = {}) {
  const includeDisabled = options.includeDisabled === true;
  return Object.values(BUILTIN_MAP_DEFINITIONS)
    .filter(definition => includeDisabled || definition.enabled !== false)
    .map(mapRuntimeClone);
}

function getCustomMapDefinitions() {
  return mapRuntimeGetPersistenceService().getDefinitions();
}

function getAvailableMapDefinitions(options = {}) {
  const includeInvalid = options.includeInvalid === true;
  const all = [...getBuiltinMapDefinitions({ includeDisabled: options.includeDisabled === true }), ...getCustomMapDefinitions()]
    .filter(definition => options.includeDisabled === true || definition.enabled !== false);
  return includeInvalid ? all : all.filter(definition => validateMapDefinition(definition).valid);
}

function getMapDefinitionById(mapId, options = {}) {
  const id = mapRuntimeSafeId(mapId || MAP_RUNTIME_DEFAULT_ID, MAP_RUNTIME_DEFAULT_ID);
  if (options.definition && typeof options.definition === "object") {
    const normalized = mapRuntimeNormalizeDefinition(options.definition, { imported: options.definition.official !== true });
    if (normalized.id === id || options.allowMismatchedDefinition === true) return normalized;
  }
  if (BUILTIN_MAP_DEFINITIONS[id]) return mapRuntimeClone(BUILTIN_MAP_DEFINITIONS[id]);
  return mapRuntimeGetPersistenceService().getById(id);
}

let MAP_STATE_QUERIES_SERVICE = null;

function mapRuntimeGetStateQueriesService() {
  if (!MAP_STATE_QUERIES_SERVICE) {
    MAP_STATE_QUERIES_SERVICE = createMapStateQueriesService({
      getState: () => typeof state !== "undefined" ? state : null,
      getDefaultDefinition: () => getMapDefinitionById(MAP_RUNTIME_DEFAULT_ID),
      cellIndex: mapRuntimeCellIndex,
      cellKey: mapRuntimeCellKey,
      clone: mapRuntimeClone,
      terrainDefinition: terrainId => terrainDefinition(terrainId),
      centerCoord: () => typeof CENTER_PS_COORD !== "undefined" ? [...CENTER_PS_COORD] : [0, 0, 0],
      hexDistance: mapRuntimeHexDistance,
      hasPlayerActive: () => typeof isPlayerActive === "function",
      playerActive: playerId => isPlayerActive(playerId),
      hasCombatUnits: () => typeof combatUnits === "function",
      combatUnits: side => combatUnits(side),
      hasHeadquartersLookup: () => typeof getHq === "function",
      headquartersLookup: playerId => getHq(playerId)
    });
  }
  return MAP_STATE_QUERIES_SERVICE;
}

function getActiveMapDefinition() {
  return mapRuntimeGetStateQueriesService().activeMapDefinition();
}

function getActiveMapCells() {
  return mapRuntimeGetStateQueriesService().activeMapCells();
}

function getMapCell(coord, definition = null) {
  return mapRuntimeGetStateQueriesService().mapCell(coord, definition);
}

function getMapHeadquarters(playerId, definition = null) {
  return mapRuntimeGetStateQueriesService().mapHeadquarters(playerId, definition);
}

function getMapStrategicPoints(definition = null) {
  return mapRuntimeGetStateQueriesService().mapStrategicPoints(definition);
}

function getCentralStrategicPoint(definition = null) {
  return mapRuntimeGetStateQueriesService().centralStrategicPoint(definition);
}

function getCentralStrategicPointCoord(definition = null) {
  return mapRuntimeGetStateQueriesService().centralStrategicPointCoord(definition);
}

function isCentralStrategicPointCoord(coord, definition = null) {
  return mapRuntimeGetStateQueriesService().isCentralStrategicPoint(coord, definition);
}

function centralStrategicPointLinearDistances(definition = null) {
  return mapRuntimeGetStateQueriesService().centralStrategicPointDistances(definition);
}

function getMapDeploymentDefinition(playerId, definition = null) {
  return mapRuntimeGetStateQueriesService().mapDeploymentDefinition(playerId, definition);
}

function isMapCoordValid(coord, definition = null) {
  return mapRuntimeGetStateQueriesService().isMapCoordValid(coord, definition);
}

function getMapTerrainAt(coord, definition = null) {
  return mapRuntimeGetStateQueriesService().mapTerrainAt(coord, definition);
}

function mapTerrainUsage(definition = null) {
  return mapRuntimeGetStateQueriesService().terrainUsage(definition);
}

function getMapMovementMultiplier(definition = null) {
  return mapRuntimeGetStateQueriesService().mapMovementMultiplier(definition);
}

function getTerrainMovementCost(coord, definition = null) {
  return mapRuntimeGetStateQueriesService().terrainMovementCost(coord, definition);
}

function getTerrainDefenseModifier(unit) {
  return mapRuntimeGetStateQueriesService().terrainDefenseModifier(unit);
}

function getEffectiveDefense(unit) {
  return mapRuntimeGetStateQueriesService().effectiveDefense(unit);
}

function mapRuntimePlayerIds(sourceState = null) {
  return mapRuntimeGetStateQueriesService().playerIds(sourceState);
}

function getPlayerById(playerId) {
  return mapRuntimeGetStateQueriesService().playerById(playerId);
}

function getActivePlayers() {
  return mapRuntimeGetStateQueriesService().activePlayers();
}

function getEnemyPlayers(playerId) {
  return mapRuntimeGetStateQueriesService().enemyPlayers(playerId);
}

function isPlayerEliminated(playerId) {
  return mapRuntimeGetStateQueriesService().playerEliminated(playerId);
}

function isEnemySide(playerId, otherPlayerId) {
  return mapRuntimeGetStateQueriesService().enemySide(playerId, otherPlayerId);
}

function enemyCombatUnits(playerId) {
  return mapRuntimeGetStateQueriesService().enemyCombatUnits(playerId);
}

function getNextActivePlayerId(playerId) {
  return mapRuntimeGetStateQueriesService().nextActivePlayerId(playerId);
}

function getPlayerHeadquarters(playerId) {
  return mapRuntimeGetStateQueriesService().playerHeadquarters(playerId);
}

let MAP_VALIDATION_SERVICE = null;

function mapRuntimeGetValidationService() {
  if (!MAP_VALIDATION_SERVICE) {
    MAP_VALIDATION_SERVICE = createMapValidationService({
      schemaVersion: MAP_SCHEMA_VERSION,
      maxCells: MAP_MAX_CELLS,
      normalizeDefinition: mapRuntimeNormalizeDefinition,
      validCubeCoord: mapRuntimeValidCubeCoord,
      cellKey: mapRuntimeCellKey,
      safeId: mapRuntimeSafeId,
      terrainDefinition,
      terrainAt: getMapTerrainAt,
      hexDistance: mapRuntimeHexDistance,
      reachableKeys: mapRuntimeReachableKeys,
      singleCellChokes: mapRuntimeSingleCellChokes,
      findPath: findMapPath,
      obstacleSymmetryIssues: mapRuntimeObstacleSymmetryIssues,
      getCentralStrategicPoint,
      terrainUsage: mapTerrainUsage
    });
  }
  return MAP_VALIDATION_SERVICE;
}

function validateMapDefinition(rawDefinition, options = {}) {
  return mapRuntimeGetValidationService().validateDefinition(rawDefinition, options);
}
function saveCustomMapDefinition(rawDefinition, options = {}) {
  return mapRuntimeGetPersistenceService().saveDefinition(rawDefinition, options);
}

function deleteCustomMapDefinition(mapId) {
  return mapRuntimeGetPersistenceService().deleteDefinition(mapId);
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
  const portableMap = mapRuntimeClone(validation.definition);
  if (portableMap.presentation) delete portableMap.presentation.backgroundInlineDataUrl;
  return {
    ok: true,
    validation,
    json: JSON.stringify({
      kind: "arena-rubra-map",
      schemaVersion: MAP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      assetMode: "reference-only",
      map: portableMap
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
