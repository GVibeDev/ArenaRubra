"use strict";

// F9Q1/F9Q2 - definizioni built-in serializzabili.
// Le funzioni di composizione servono soltanto a costruire gli oggetti dati;
// nessuna funzione viene inclusa nel JSON esportabile.

const MAP_SCHEMA_VERSION = 1;
const MAP_MAX_CELLS = 1000;

function mapDefinitionCoordKey(coord) {
  return Array.isArray(coord) ? coord.join(",") : "";
}

function mapDefinitionGenerateHexComponent(component) {
  const radius = Math.max(1, Math.min(12, Math.trunc(Number(component.radius) || 6)));
  const origin = Array.isArray(component.origin) ? component.origin.map(Number) : [0, 0, 0];
  const cells = [];
  for (let x = -radius; x <= radius; x += 1) {
    for (let y = -radius; y <= radius; y += 1) {
      const z = -x - y;
      if (z < -radius || z > radius) continue;
      cells.push({
        coord: [x + origin[0], y + origin[1], z + origin[2]],
        componentId: component.id || "hex",
        terrainType: "free",
        cellRole: "normal",
        ownerPlayerId: null,
        initialHazard: null
      });
    }
  }
  return cells;
}

function mapDefinitionCompositeCells(components) {
  const merged = new Map();
  for (const component of components || []) {
    for (const cell of mapDefinitionGenerateHexComponent(component)) {
      const key = mapDefinitionCoordKey(cell.coord);
      if (!merged.has(key)) {
        merged.set(key, { ...cell, componentIds: [cell.componentId] });
      } else {
        const current = merged.get(key);
        current.componentIds = Array.from(new Set([...(current.componentIds || []), cell.componentId]));
      }
    }
  }
  return [...merged.values()];
}

function mapDefinitionApplyTerrain(cells, terrainId, coords) {
  const keys = new Set((coords || []).map(mapDefinitionCoordKey));
  for (const cell of cells) {
    if (keys.has(mapDefinitionCoordKey(cell.coord))) cell.terrainType = terrainId;
  }
}

function mapDefinitionMarkRoles(cells, playerSlots, strategicPoints) {
  const byKey = new Map(cells.map(cell => [mapDefinitionCoordKey(cell.coord), cell]));
  for (const slot of playerSlots || []) {
    const cell = byKey.get(mapDefinitionCoordKey(slot.headquarters));
    if (!cell) continue;
    cell.cellRole = "headquarters";
    cell.ownerPlayerId = Number(slot.slotId);
    cell.terrainType = "free";
  }
  for (const ps of strategicPoints || []) {
    const cell = byKey.get(mapDefinitionCoordKey(ps.coord));
    if (!cell || cell.cellRole === "headquarters") continue;
    cell.cellRole = "strategic_point";
    cell.ownerPlayerId = null;
    if (cell.terrainType === "obstacle") cell.terrainType = "free";
  }
  return cells;
}

function mapDefinitionCreate(config) {
  const components = (config.components || []).map(component => ({
    id: String(component.id || "hex"),
    radius: Math.trunc(Number(component.radius) || 6),
    origin: [...component.origin],
    rotation: Number(component.rotation || 0)
  }));
  const cells = mapDefinitionCompositeCells(components);
  const terrain = config.terrain || {};
  Object.entries(terrain).forEach(([terrainId, coords]) => mapDefinitionApplyTerrain(cells, terrainId, coords));
  mapDefinitionMarkRoles(cells, config.playerSlots, config.strategicPoints);
  const initialHazards = (config.initialHazards || []).map((hazard, index) => ({
    id: hazard.id || `hazard-${index + 1}`,
    type: hazard.type,
    coord: [...hazard.coord],
    sourceType: "map",
    sourceId: hazard.id || `hazard-${index + 1}`,
    ownerPlayerId: null,
    duration: Number.isFinite(hazard.duration) ? hazard.duration : null,
    payload: { ...(hazard.payload || {}) }
  }));
  const cellByKey = new Map(cells.map(cell => [mapDefinitionCoordKey(cell.coord), cell]));
  for (const hazard of initialHazards) {
    const cell = cellByKey.get(mapDefinitionCoordKey(hazard.coord));
    if (!cell || cell.cellRole !== "normal" || cell.terrainType === "obstacle") continue;
    cell.initialHazard = {
      type: hazard.type,
      sourceType: hazard.sourceType,
      sourceId: hazard.sourceId,
      ownerPlayerId: null,
      duration: hazard.duration,
      payload: { ...hazard.payload }
    };
  }
  return {
    schemaVersion: MAP_SCHEMA_VERSION,
    id: config.id,
    name: config.name,
    description: config.description,
    official: true,
    editable: false,
    enabled: true,
    playerCount: config.playerCount,
    movementMultiplier: config.movementMultiplier,
    turnOrder: Array.from({ length: config.playerCount }, (_, index) => index + 1),
    geometry: {
      type: config.geometryType,
      nominalRadius: 6,
      components,
      cells
    },
    playerSlots: config.playerSlots.map(slot => ({
      slotId: Number(slot.slotId),
      headquarters: [...slot.headquarters],
      deployment: {
        mode: "hq_network",
        radius: 1,
        ...(slot.deployment || {})
      }
    })),
    strategicPoints: config.strategicPoints.map(ps => ({
      id: ps.id,
      coord: [...ps.coord],
      incomeValue: Number.isFinite(ps.incomeValue) ? ps.incomeValue : 1,
      tags: Array.isArray(ps.tags) ? [...ps.tags] : []
    })),
    initialHazards,
    presentation: {
      skinKey: config.skinKey || "red_dust",
      backgroundKey: null
    },
    metadata: {
      author: "Arena Rubra",
      revision: 1,
      tags: [...config.tags],
      symmetry: config.symmetry,
      source: "F9Q1-F9Q2"
    }
  };
}

const MAP1_STARTER_DEFINITION = mapDefinitionCreate({
  id: "map1_starter",
  name: "Campo Starter",
  description: "La MAP1 storica di Arena Rubra: due giocatori, 127 celle e nessun terreno speciale.",
  playerCount: 2,
  movementMultiplier: 1,
  geometryType: "single_hex",
  components: [{ id: "hex-a", radius: 6, origin: [0, 0, 0], rotation: 0 }],
  playerSlots: [
    { slotId: 1, headquarters: [-6, 0, 6] },
    { slotId: 2, headquarters: [6, 0, -6] }
  ],
  strategicPoints: [
    { id: "ps-center", coord: [0, 0, 0], incomeValue: 1, tags: ["central"] },
    { id: "ps-north", coord: [0, -4, 4], incomeValue: 1, tags: ["lateral"] },
    { id: "ps-south", coord: [0, 4, -4], incomeValue: 1, tags: ["lateral"] }
  ],
  terrain: {},
  tags: ["official", "starter", "two-player", "classic"],
  symmetry: "rotation-2"
});

const MAP2_TRIUMVIRATE_DEFINITION = mapDefinitionCreate({
  id: "map2_triumvirate",
  name: "Triumvirato Rubro",
  description: "Due esagoni uniti per tre giocatori tutti contro tutti, con movimento globale ×2 e terreni avanzati.",
  playerCount: 3,
  movementMultiplier: 2,
  geometryType: "double_hex",
  components: [
    { id: "hex-a", radius: 6, origin: [-4, 0, 4], rotation: 0 },
    { id: "hex-b", radius: 6, origin: [4, 0, -4], rotation: 0 }
  ],
  playerSlots: [
    { slotId: 1, headquarters: [-10, 4, 6] },
    { slotId: 2, headquarters: [10, -4, -6] },
    { slotId: 3, headquarters: [0, -6, 6] }
  ],
  strategicPoints: [
    { id: "ps-center", coord: [0, 0, 0], incomeValue: 2, tags: ["central"] },
    { id: "ps-west", coord: [-4, 1, 3], incomeValue: 1, tags: ["sector-1"] },
    { id: "ps-east", coord: [4, -1, -3], incomeValue: 1, tags: ["sector-2"] },
    { id: "ps-north", coord: [0, -3, 3], incomeValue: 1, tags: ["sector-3"] }
  ],
  terrain: {
    obstacle: [[-2, 2, 0], [2, -2, 0], [0, 2, -2], [0, -2, 2], [-2, 0, 2], [2, 0, -2]],
    difficult: [[-3, 2, 1], [3, -2, -1], [-1, 3, -2], [1, -3, 2], [-2, -1, 3], [2, 1, -3]],
    defensive: [[-5, 3, 2], [5, -3, -2], [0, -4, 4]],
    exposed: [[-1, 1, 0], [1, -1, 0], [0, 1, -1], [0, -1, 1]]
  },
  initialHazards: [
    { id: "map2-trap-west", type: "trap", coord: [-5, 2, 3] },
    { id: "map2-trap-east", type: "trap", coord: [5, -2, -3] },
    { id: "map2-mine-north", type: "mine", coord: [0, -5, 5] }
  ],
  tags: ["official", "advanced", "three-player", "double-hex", "free-for-all"],
  symmetry: "radial-3"
});

const MAP3_QUADRIVIUM_DEFINITION = mapDefinitionCreate({
  id: "map3_quadrivium",
  name: "Quadrivio Spezzato",
  description: "Tre esagoni uniti per quattro giocatori tutti contro tutti, con movimento globale ×3 e cinque fronti strategici.",
  playerCount: 4,
  movementMultiplier: 3,
  geometryType: "triple_hex",
  components: [
    { id: "hex-a", radius: 6, origin: [-6, 3, 3], rotation: 0 },
    { id: "hex-b", radius: 6, origin: [0, 0, 0], rotation: 0 },
    { id: "hex-c", radius: 6, origin: [6, -3, -3], rotation: 0 }
  ],
  playerSlots: [
    { slotId: 1, headquarters: [-12, 6, 6] },
    { slotId: 2, headquarters: [-6, -3, 9] },
    { slotId: 3, headquarters: [6, 3, -9] },
    { slotId: 4, headquarters: [12, -6, -6] }
  ],
  strategicPoints: [
    { id: "ps-center", coord: [0, 0, 0], incomeValue: 2, tags: ["central"] },
    { id: "ps-west", coord: [-6, 6, 0], incomeValue: 1, tags: ["sector-1"] },
    { id: "ps-north", coord: [0, -3, 3], incomeValue: 1, tags: ["sector-2"] },
    { id: "ps-south", coord: [0, 3, -3], incomeValue: 1, tags: ["sector-3"] },
    { id: "ps-east", coord: [6, -6, 0], incomeValue: 1, tags: ["sector-4"] }
  ],
  terrain: {
    obstacle: [[-2, 2, 0], [2, -2, 0], [0, 2, -2], [0, -2, 2], [-2, 0, 2], [2, 0, -2], [-10, 5, 5], [-10, 4, 6], [10, -5, -5], [10, -4, -6]],
    difficult: [[-5, 2, 3], [5, -2, -3], [-4, 5, -1], [4, -5, 1], [-1, -4, 5], [1, 4, -5]],
    defensive: [[-8, 4, 4], [8, -4, -4], [-4, -1, 5], [4, 1, -5]],
    exposed: [[-1, 1, 0], [1, -1, 0], [0, 1, -1], [0, -1, 1], [-6, 4, 2], [6, -4, -2]]
  },
  initialHazards: [
    { id: "map3-mine-west", type: "mine", coord: [-9, 5, 4] },
    { id: "map3-mine-east", type: "mine", coord: [9, -5, -4] },
    { id: "map3-trap-north", type: "trap", coord: [-2, -4, 6] },
    { id: "map3-trap-south", type: "trap", coord: [2, 4, -6] }
  ],
  tags: ["official", "advanced", "four-player", "triple-hex", "free-for-all"],
  symmetry: "rotation-2"
});

const BUILTIN_MAP_DEFINITIONS = Object.freeze({
  [MAP1_STARTER_DEFINITION.id]: MAP1_STARTER_DEFINITION,
  [MAP2_TRIUMVIRATE_DEFINITION.id]: MAP2_TRIUMVIRATE_DEFINITION,
  [MAP3_QUADRIVIUM_DEFINITION.id]: MAP3_QUADRIVIUM_DEFINITION
});
