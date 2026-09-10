"use strict";

// AR-AC1 - DOM/storage-free map validation boundary.
// All runtime services are passed explicitly so validation can be exercised
// headlessly while the legacy validateMapDefinition facade remains stable.
function createMapValidationService(dependencies = {}) {
  const {
    schemaVersion,
    maxCells,
    normalizeDefinition,
    validCubeCoord,
    cellKey,
    safeId,
    terrainDefinition,
    terrainAt,
    hexDistance,
    reachableKeys,
    singleCellChokes,
    findPath,
    obstacleSymmetryIssues,
    getCentralStrategicPoint,
    terrainUsage
  } = dependencies;

  function validateDefinition(rawDefinition, options = {}) {
    const errors = [];
    const warnings = [];
    const raw = rawDefinition && typeof rawDefinition === "object" ? rawDefinition : {};
    const definition = normalizeDefinition(raw, { imported: options.imported === true });
    const pushError = (code, message, coord = null) => errors.push({ code, message, coord });
    const pushWarning = (code, message, coord = null) => warnings.push({ code, message, coord });

    if (Number(raw.schemaVersion) !== schemaVersion) pushError("E_MAP_SCHEMA_UNSUPPORTED", `schemaVersion ${raw.schemaVersion} non supportata.`);
    if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(String(raw.id || ""))) pushError("E_MAP_INVALID_ID", "ID mappa non valido.");
    if (![1, 2, 3].includes(Number(raw.movementMultiplier))) {
      pushError("E_MAP_INVALID_MOVEMENT_MULTIPLIER", "Il moltiplicatore movimento deve essere ×1, ×2 oppure ×3.");
    }
    const cells = definition.geometry.cells;
    if (!cells.length) pushError("E_MAP_EMPTY", "La mappa non contiene celle.");
    if (cells.length > maxCells) pushError("E_MAP_TOO_LARGE", `La mappa supera il limite di ${maxCells} celle.`);
    const keys = new Set();
    for (const cell of cells) {
      if (!validCubeCoord(cell.coord)) {
        pushError("E_MAP_INVALID_CUBE_COORD", `Coordinate cubiche non valide: ${JSON.stringify(cell.coord)}.`, cell.coord);
        continue;
      }
      const key = cellKey(cell.coord);
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
    const hazardIds = new Set();
    for (const [index, hazard] of (Array.isArray(raw.initialHazards) ? raw.initialHazards : []).entries()) {
      if (!hazard || !["trap", "mine"].includes(hazard.type)) {
        pushError("E_MAP_INVALID_INITIAL_HAZARD", `Pericolo iniziale ${index + 1} con tipo non valido.`);
        continue;
      }
      if (!validCubeCoord(hazard.coord)) {
        pushError("E_MAP_INVALID_CUBE_COORD", `Pericolo iniziale ${index + 1} con coordinate non valide.`, hazard.coord);
        continue;
      }
      const hazardId = safeId(hazard.id || hazard.sourceId, `hazard-${index + 1}`);
      if (hazardIds.has(hazardId)) pushError("E_MAP_DUPLICATE_INITIAL_HAZARD_ID", `ID pericolo iniziale duplicato: ${hazardId}.`, hazard.coord);
      hazardIds.add(hazardId);
      const key = cellKey(hazard.coord);
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
      if (!validCubeCoord(slot.headquarters)) {
        pushError("E_MAP_INVALID_CUBE_COORD", `QG G${slot.slotId} con coordinate non valide.`, slot.headquarters);
        continue;
      }
      const key = cellKey(slot.headquarters);
      if (!keys.has(key)) pushError("E_MAP_HQ_OUTSIDE_CELLS", `QG G${slot.slotId} fuori mappa.`, slot.headquarters);
      if (hqKeys.has(key)) pushError("E_MAP_DUPLICATE_HQ", `Più QG sulla cella ${key}.`, slot.headquarters);
      hqKeys.add(key);
      const terrain = terrainAt(slot.headquarters, definition);
      if (terrain && terrain.blocksOccupation) pushError("E_MAP_OBSTACLE_ON_HQ", `QG G${slot.slotId} su ostacolo.`, slot.headquarters);
      if (!slot.deployment || slot.deployment.mode !== "hq_network") pushError("E_MAP_INVALID_DEPLOYMENT", `Deployment G${slot.slotId} non valido.`);
    }

    const psKeys = new Set();
    const psIds = new Set();
    for (const ps of definition.strategicPoints) {
      if (!validCubeCoord(ps.coord)) {
        pushError("E_MAP_INVALID_CUBE_COORD", `PS ${ps.id} con coordinate non valide.`, ps.coord);
        continue;
      }
      const key = cellKey(ps.coord);
      if (psIds.has(ps.id)) pushError("E_MAP_DUPLICATE_PS_ID", `ID Punto Strategico duplicato: ${ps.id}.`, ps.coord);
      psIds.add(ps.id);
      if (!keys.has(key)) pushError("E_MAP_PS_OUTSIDE_CELLS", `PS ${ps.id} fuori mappa.`, ps.coord);
      if (psKeys.has(key)) pushError("E_MAP_DUPLICATE_PS", `PS duplicato sulla cella ${key}.`, ps.coord);
      if (hqKeys.has(key)) pushError("E_MAP_PS_OVERLAPS_HQ", `PS ${ps.id} sovrapposto a un QG.`, ps.coord);
      psKeys.add(key);
      const terrain = terrainAt(ps.coord, definition);
      if (terrain && terrain.blocksOccupation) pushError("E_MAP_OBSTACLE_ON_PS", `PS ${ps.id} su ostacolo.`, ps.coord);
    }

    const centralTagged = definition.strategicPoints.filter(ps => Array.isArray(ps.tags) && ps.tags.includes("central"));
    const centralId = definition.centralStrategicPointId ? String(definition.centralStrategicPointId) : "";
    const centralPs = centralId ? definition.strategicPoints.find(ps => String(ps.id) === centralId) : null;
    if (!centralId) pushError("E_MAP_CENTRAL_PS_REQUIRED", "Designare un PS centrale esplicito.");
    else if (!centralPs) pushError("E_MAP_CENTRAL_PS_NOT_FOUND", `Il PS centrale ${centralId} non esiste.`);
    if (centralTagged.length > 1) pushError("E_MAP_MULTIPLE_CENTRAL_PS", `Più PS marcati come centrali: ${centralTagged.map(ps => ps.id).join(", ")}.`);
    if (centralPs && !centralPs.tags.includes("central")) {
      pushWarning("W_MAP_CENTRAL_PS_TAG_MISSING", `Il PS centrale ${centralPs.id} non contiene il tag central.`, centralPs.coord);
    }
    if (centralPs && definition.playerSlots.length > 1) {
      const distances = definition.playerSlots.map(slot => hexDistance(centralPs.coord, slot.headquarters));
      if (distances.some(distance => !Number.isFinite(distance)) || new Set(distances).size !== 1) {
        pushError("E_MAP_CENTRAL_PS_NOT_EQUIDISTANT", `Il PS centrale deve essere equidistante in linea retta da tutti i QG; distanze: ${distances.join(", ")}.`, centralPs.coord);
      }
    }

    const traversableCells = cells.filter(cell => {
      const terrain = terrainDefinition(cell.terrainType || "free");
      return terrain && !terrain.blocksMovement && !terrain.blocksOccupation;
    });
    if (traversableCells.length) {
      const reached = reachableKeys(definition, traversableCells[0].coord);
      if (reached.size !== traversableCells.length) {
        pushError("E_MAP_DISCONNECTED", `Regione giocabile disconnessa: ${reached.size}/${traversableCells.length} celle raggiungibili.`);
      }
      const chokes = singleCellChokes(definition);
      if (chokes.length) {
        pushWarning("W_MAP_SINGLE_CELL_CHOKE", `La regione percorribile contiene ${chokes.length} strozzature a cella singola.`, chokes[0]);
      }
    }

    for (const slot of definition.playerSlots) {
      for (const other of definition.playerSlots) {
        if (slot.slotId >= other.slotId) continue;
        if (!findPath(definition, slot.headquarters, other.headquarters)) {
          pushError("E_MAP_PLAYER_ISOLATED", `Nessun percorso teorico fra G${slot.slotId} e G${other.slotId}.`);
        }
      }
      for (const ps of definition.strategicPoints) {
        if (!findPath(definition, slot.headquarters, ps.coord)) {
          pushError("E_MAP_PS_UNREACHABLE", `${ps.id} non raggiungibile da G${slot.slotId}.`, ps.coord);
        }
      }
    }

    const centerDistances = definition.playerSlots.map(slot => {
      if (!definition.strategicPoints.length) return 0;
      return Math.min(...definition.strategicPoints.map(ps => {
        const path = findPath(definition, slot.headquarters, ps.coord);
        return path ? path.cost : Infinity;
      }));
    });
    const finiteDistances = centerDistances.filter(Number.isFinite);
    if (finiteDistances.length > 1 && Math.max(...finiteDistances) - Math.min(...finiteDistances) > 3) {
      pushWarning("W_MAP_HQ_DISTANCE_IMBALANCE", `Distanze QG-obiettivo sbilanciate: ${finiteDistances.join(", ")}.`);
    }
    const minHqDistance = definition.playerSlots.length > 1
      ? Math.min(...definition.playerSlots.flatMap((slot, index) => definition.playerSlots.slice(index + 1).map(other => {
          const path = findPath(definition, slot.headquarters, other.headquarters);
          return path ? path.cost : Infinity;
        })))
      : Infinity;
    if (Number.isFinite(minHqDistance) && minHqDistance <= definition.movementMultiplier * 2) {
      pushWarning("W_MAP_FIRST_TURN_HQ_THREAT", `Distanza minima fra QG ${minHqDistance}: verificare minaccia nel primo turno.`);
    }
    const symmetryIssues = obstacleSymmetryIssues(definition);
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
        centralStrategicPointId: definition.centralStrategicPointId || null,
        centralStrategicPointCoord: (getCentralStrategicPoint(definition) || {}).coord || null,
        terrainUsage: terrainUsage(definition)
      }
    };
  }

  return Object.freeze({ validateDefinition });
}
