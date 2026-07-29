"use strict";

// F9Q1 - registry dati dei terreni statici.
// QG, PS, trappole e mine non appartengono a questo registry:
// sono rispettivamente ruoli della cella e pericoli separati.

const TERRAIN_SCHEMA_VERSION = 1;

const TERRAIN_REGISTRY = Object.freeze({
  free: Object.freeze({
    id: "free",
    name: "Libero",
    description: "Terreno standard senza modificatori.",
    icon: "·",
    visualClass: "terrain-free",
    movementFactor: 1,
    movementCost: 1,
    defenseModifier: 0,
    blocksMovement: false,
    blocksDeployment: false,
    blocksOccupation: false,
    blocksTargeting: false,
    tags: ["starter-safe"]
  }),
  obstacle: Object.freeze({
    id: "obstacle",
    name: "Ostacolo",
    description: "Cella presente ma invalicabile, non occupabile e non utilizzabile per deployment o costruzione.",
    icon: "×",
    visualClass: "terrain-obstacle",
    movementFactor: 0,
    movementCost: null,
    defenseModifier: 0,
    blocksMovement: true,
    blocksDeployment: true,
    blocksOccupation: true,
    blocksTargeting: false,
    tags: ["advanced-map"]
  }),
  difficult: Object.freeze({
    id: "difficult",
    name: "Difficile",
    description: "Il costo di ingresso è 2: equivale a movimento dimezzato su un budget intero.",
    icon: "≈",
    visualClass: "terrain-difficult",
    movementFactor: 0.5,
    movementCost: 2,
    defenseModifier: 0,
    blocksMovement: false,
    blocksDeployment: false,
    blocksOccupation: false,
    blocksTargeting: false,
    tags: ["advanced-map"]
  }),
  defensive: Object.freeze({
    id: "defensive",
    name: "Difensivo",
    description: "L'unità occupante riceve +1 DEF derivata finché resta sulla cella.",
    icon: "◇",
    visualClass: "terrain-defensive",
    movementFactor: 1,
    movementCost: 1,
    defenseModifier: 1,
    blocksMovement: false,
    blocksDeployment: false,
    blocksOccupation: false,
    blocksTargeting: false,
    tags: ["advanced-map"]
  }),
  exposed: Object.freeze({
    id: "exposed",
    name: "Scoperto",
    description: "L'unità occupante riceve -1 DEF derivata, senza scendere sotto 0.",
    icon: "!",
    visualClass: "terrain-exposed",
    movementFactor: 1,
    movementCost: 1,
    defenseModifier: -1,
    blocksMovement: false,
    blocksDeployment: false,
    blocksOccupation: false,
    blocksTargeting: false,
    tags: ["advanced-map"]
  })
});

function terrainDefinition(terrainId) {
  return TERRAIN_REGISTRY[String(terrainId || "free")] || null;
}

function terrainDefinitions() {
  return Object.values(TERRAIN_REGISTRY);
}

