"use strict";

// AR-AC1 - DOM/storage-free normalization for serializable map definitions.
// Sanitizers and schema limits are explicit dependencies; the runtime keeps
// the legacy mapRuntimeNormalizeDefinition facade.
function createMapNormalizationService(dependencies = {}) {
  const {
    schemaVersion,
    maxCells,
    clone,
    safeText,
    safeId,
    clampNumber,
    safeImageDataUrl,
    cellKey,
    validCubeCoord
  } = dependencies;

  function normalizeCell(rawCell) {
    const cell = rawCell && typeof rawCell === "object" ? rawCell : {};
    const coord = Array.isArray(cell.coord) ? cell.coord.map(Number) : [];
    return {
      coord,
      componentId: safeText(cell.componentId || "", 48) || null,
      componentIds: Array.isArray(cell.componentIds) ? cell.componentIds.map(value => safeText(value, 48)).filter(Boolean) : [],
      terrainType: safeId(cell.terrainType || cell.terrain || "free", "free"),
      cellRole: ["normal", "headquarters", "strategic_point"].includes(cell.cellRole) ? cell.cellRole : "normal",
      ownerPlayerId: Number.isInteger(Number(cell.ownerPlayerId)) ? Number(cell.ownerPlayerId) : null,
      initialHazard: cell.initialHazard && typeof cell.initialHazard === "object"
        ? {
            type: ["trap", "mine"].includes(cell.initialHazard.type) ? cell.initialHazard.type : null,
            sourceType: safeText(cell.initialHazard.sourceType || "map", 40),
            sourceId: safeText(cell.initialHazard.sourceId || "initial", 80),
            ownerPlayerId: Number.isInteger(Number(cell.initialHazard.ownerPlayerId)) ? Number(cell.initialHazard.ownerPlayerId) : null,
            duration: Number.isFinite(cell.initialHazard.duration) ? Number(cell.initialHazard.duration) : null,
            payload: cell.initialHazard.payload && typeof cell.initialHazard.payload === "object" ? clone(cell.initialHazard.payload) : {}
          }
        : null
    };
  }

  function normalizeInitialHazard(rawHazard, index = 0) {
    const hazard = rawHazard && typeof rawHazard === "object" ? rawHazard : {};
    return {
      id: safeId(hazard.id || hazard.sourceId, `hazard-${index + 1}`),
      type: ["trap", "mine"].includes(hazard.type) ? hazard.type : null,
      coord: Array.isArray(hazard.coord) ? hazard.coord.map(Number) : [],
      sourceType: safeText(hazard.sourceType || "map", 40),
      sourceId: safeText(hazard.sourceId || hazard.id || `hazard-${index + 1}`, 80),
      ownerPlayerId: Number.isInteger(Number(hazard.ownerPlayerId)) ? Number(hazard.ownerPlayerId) : null,
      duration: Number.isFinite(hazard.duration) ? Number(hazard.duration) : null,
      payload: hazard.payload && typeof hazard.payload === "object" ? clone(hazard.payload) : {}
    };
  }

  function normalizeDefinition(rawDefinition, options = {}) {
    const raw = rawDefinition && typeof rawDefinition === "object" ? rawDefinition : {};
    const geometry = raw.geometry && typeof raw.geometry === "object" ? raw.geometry : {};
    const components = Array.isArray(geometry.components) ? geometry.components.slice(0, 8).map((component, index) => ({
      id: safeId(component && component.id, `hex-${index + 1}`),
      radius: Math.max(1, Math.min(12, Math.trunc(Number(component && component.radius) || 6))),
      origin: Array.isArray(component && component.origin) ? component.origin.map(Number) : [0, 0, 0],
      rotation: Number(component && component.rotation || 0)
    })) : [];
    const cells = Array.isArray(geometry.cells)
      ? geometry.cells.slice(0, maxCells + 1).map(normalizeCell)
      : [];
    const playerCount = Math.max(2, Math.min(4, Math.trunc(Number(raw.playerCount) || 2)));
    const playerSlots = Array.isArray(raw.playerSlots) ? raw.playerSlots.slice(0, 4).map((slot, index) => ({
      slotId: Number.isInteger(Number(slot && slot.slotId)) ? Number(slot.slotId) : index + 1,
      headquarters: Array.isArray(slot && slot.headquarters) ? slot.headquarters.map(Number) : [],
      deployment: slot && slot.deployment && typeof slot.deployment === "object"
        ? clone(slot.deployment)
        : { mode: "hq_network", radius: 1 }
    })) : [];
    const strategicPoints = Array.isArray(raw.strategicPoints) ? raw.strategicPoints.slice(0, 64).map((ps, index) => ({
      id: safeId(ps && ps.id, `ps-${index + 1}`),
      coord: Array.isArray(ps && ps.coord) ? ps.coord.map(Number) : [],
      incomeValue: Math.max(0, Math.min(10, Number(ps && ps.incomeValue) || 1)),
      tags: Array.isArray(ps && ps.tags) ? ps.tags.map(tag => safeText(tag, 32)).filter(Boolean).slice(0, 12) : []
    })) : [];
    const taggedCentralPs = strategicPoints.filter(ps => ps.tags.includes("central"));
    const inferredCentralPs = taggedCentralPs[0]
      || strategicPoints.find(ps => cellKey(ps.coord) === "0,0,0")
      || null;
    const centralStrategicPointId = safeId(
      raw.centralStrategicPointId || (inferredCentralPs && inferredCentralPs.id) || "",
      ""
    ) || null;
    const explicitHazards = Array.isArray(raw.initialHazards)
      ? raw.initialHazards.slice(0, 128).map(normalizeInitialHazard)
      : [];
    const cellsByKey = new Map(cells.map(cell => [cellKey(cell.coord), cell]));
    for (const hazard of explicitHazards) {
      if (!hazard.type || !validCubeCoord(hazard.coord)) continue;
      const cell = cellsByKey.get(cellKey(hazard.coord));
      if (!cell || cell.initialHazard) continue;
      cell.initialHazard = {
        type: hazard.type,
        sourceType: hazard.sourceType,
        sourceId: hazard.sourceId,
        ownerPlayerId: hazard.ownerPlayerId,
        duration: hazard.duration,
        payload: clone(hazard.payload)
      };
    }
    const hazardsByKey = new Map();
    for (const hazard of explicitHazards) {
      if (hazard.type && validCubeCoord(hazard.coord)) {
        hazardsByKey.set(`${cellKey(hazard.coord)}|${hazard.type}`, hazard);
      }
    }
    for (const cell of cells) {
      if (!cell.initialHazard || !cell.initialHazard.type) continue;
      const key = `${cellKey(cell.coord)}|${cell.initialHazard.type}`;
      if (!hazardsByKey.has(key)) {
        hazardsByKey.set(key, normalizeInitialHazard({
          ...cell.initialHazard,
          id: cell.initialHazard.sourceId,
          coord: cell.coord
        }, hazardsByKey.size));
      }
    }
    const initialHazards = [...hazardsByKey.values()];
    const imported = options.imported === true;
    return {
      schemaVersion: Number(raw.schemaVersion) || schemaVersion,
      id: safeId(raw.id, options.fallbackId || "custom_map"),
      name: safeText(raw.name || "Mappa custom", 80),
      description: safeText(raw.description || "", 500),
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
      centralStrategicPointId,
      initialHazards,
      presentation: {
        skinKey: safeId(raw.presentation && raw.presentation.skinKey || "red_dust", "red_dust"),
        backgroundKey: raw.presentation && raw.presentation.backgroundKey ? safeText(raw.presentation.backgroundKey, 120) : null,
        backgroundAssetId: raw.presentation && raw.presentation.backgroundAssetId
          ? safeId(raw.presentation.backgroundAssetId, "map-background")
          : null,
        backgroundAssetPath: raw.presentation && raw.presentation.backgroundAssetPath
          ? safeText(raw.presentation.backgroundAssetPath, 240)
          : null,
        backgroundName: raw.presentation && raw.presentation.backgroundName
          ? safeText(raw.presentation.backgroundName, 120)
          : null,
        backgroundMime: raw.presentation && /^(?:image\/(?:png|jpeg|webp))$/i.test(String(raw.presentation.backgroundMime || ""))
          ? String(raw.presentation.backgroundMime).toLowerCase()
          : null,
        backgroundWidth: Math.max(0, Math.min(16384, Math.trunc(Number(raw.presentation && raw.presentation.backgroundWidth) || 0))),
        backgroundHeight: Math.max(0, Math.min(16384, Math.trunc(Number(raw.presentation && raw.presentation.backgroundHeight) || 0))),
        backgroundFit: ["cover", "contain", "native"].includes(raw.presentation && raw.presentation.backgroundFit)
          ? raw.presentation.backgroundFit
          : "cover",
        backgroundOpacity: clampNumber(raw.presentation && raw.presentation.backgroundOpacity, 0.9, 0, 1),
        backgroundScale: clampNumber(raw.presentation && raw.presentation.backgroundScale, 1, 0.25, 4),
        backgroundOffsetX: clampNumber(raw.presentation && raw.presentation.backgroundOffsetX, 0, -100, 100),
        backgroundOffsetY: clampNumber(raw.presentation && raw.presentation.backgroundOffsetY, 0, -100, 100),
        backgroundInlineDataUrl: safeImageDataUrl(raw.presentation && raw.presentation.backgroundInlineDataUrl)
      },
      metadata: {
        author: safeText(raw.metadata && raw.metadata.author || "Arena Rubra", 80),
        revision: Math.max(1, Math.trunc(Number(raw.metadata && raw.metadata.revision) || 1)),
        tags: Array.isArray(raw.metadata && raw.metadata.tags)
          ? raw.metadata.tags.map(tag => safeText(tag, 32)).filter(Boolean).slice(0, 20)
          : [],
        symmetry: safeText(raw.metadata && raw.metadata.symmetry || "", 48) || null,
        source: safeText(raw.metadata && raw.metadata.source || "", 80) || null,
        createdAt: safeText(raw.metadata && raw.metadata.createdAt || "", 40) || null,
        updatedAt: safeText(raw.metadata && raw.metadata.updatedAt || "", 40) || null,
        sourceMapId: safeId(raw.metadata && raw.metadata.sourceMapId || "", "") || null
      }
    };
  }

  return Object.freeze({ normalizeDefinition });
}
