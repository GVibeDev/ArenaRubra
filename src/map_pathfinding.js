"use strict";

// AR-AC1 - DOM/storage/state-free geometry and pathfinding service.
// Terrain lookup, coordinate helpers, directions and telemetry counters are
// explicit dependencies. The runtime retains the historical global facades.
function createMapPathfindingService(dependencies = {}) {
  const {
    cellKey,
    validCubeCoord,
    terrainDefinition,
    directionsProvider,
    perf
  } = dependencies;
  const cellIndexCache = new WeakMap();

  function cellIndex(cells) {
    if (!Array.isArray(cells)) return new Map();
    const cached = cellIndexCache.get(cells);
    if (cached && cached.length === cells.length) return cached.index;
    const index = new Map(cells.map(cell => [cellKey(cell.coord), cell]));
    cellIndexCache.set(cells, { length: cells.length, index });
    perf.cellIndexBuilds += 1;
    return index;
  }

  // Equivalent to queue.sort(cost).shift(), without reordering equal-cost
  // entries. This preserves deterministic insertion-order tie breaking.
  function takeLowestCost(queue) {
    let bestIndex = 0;
    for (let index = 1; index < queue.length; index += 1) {
      if (queue[index].cost < queue[bestIndex].cost) bestIndex = index;
    }
    return queue.splice(bestIndex, 1)[0];
  }

  function hexDistance(a, b) {
    if (!validCubeCoord(a) || !validCubeCoord(b)) return Infinity;
    return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
  }

  function neighbors(coord) {
    return directionsProvider().map(direction => [
      coord[0] + direction[0],
      coord[1] + direction[1],
      coord[2] + direction[2]
    ]);
  }

  function reachableKeys(definition, startCoord) {
    const cells = definition && definition.geometry ? definition.geometry.cells || [] : [];
    const valid = new Map(cells.map(cell => [cellKey(cell.coord), cell]));
    const startKey = cellKey(startCoord);
    if (!valid.has(startKey)) return new Set();
    const queue = [startCoord];
    const reached = new Set([startKey]);
    while (queue.length) {
      const current = queue.shift();
      for (const next of neighbors(current)) {
        const key = cellKey(next);
        const cell = valid.get(key);
        const terrain = cell ? terrainDefinition(cell.terrainType || "free") : null;
        if (!cell || reached.has(key) || !terrain || terrain.blocksMovement || terrain.blocksOccupation) continue;
        reached.add(key);
        queue.push(next);
      }
    }
    return reached;
  }

  function singleCellChokes(definition) {
    const traversable = new Map((definition && definition.geometry && definition.geometry.cells || [])
      .filter(cell => {
        const terrain = terrainDefinition(cell.terrainType || "free");
        return terrain && !terrain.blocksMovement && !terrain.blocksOccupation;
      })
      .map(cell => [cellKey(cell.coord), cell.coord]));
    const discovery = new Map();
    const low = new Map();
    const parent = new Map();
    const articulation = new Set();
    let time = 0;
    const visit = key => {
      discovery.set(key, ++time);
      low.set(key, discovery.get(key));
      let children = 0;
      for (const coord of neighbors(traversable.get(key))) {
        const nextKey = cellKey(coord);
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

  function rotate60(coord) {
    return [-coord[2], -coord[0], -coord[1]];
  }

  function symmetryTargets(coord, mode) {
    if (mode === "rotation-2") return [[...coord], [-coord[0], -coord[1], -coord[2]]];
    if (mode === "radial-3") {
      const rotate = (value, turns) => {
        let result = [...value];
        for (let index = 0; index < turns; index += 1) result = rotate60(result);
        return result;
      };
      return [[...coord], rotate(coord, 2), rotate(coord, 4)];
    }
    return [[...coord]];
  }

  function obstacleSymmetryIssues(definition) {
    const mode = definition && definition.metadata ? definition.metadata.symmetry : null;
    if (!["rotation-2", "radial-3"].includes(mode)) return [];
    const cells = new Map((definition.geometry.cells || []).map(cell => [cellKey(cell.coord), cell]));
    const issues = [];
    for (const cell of definition.geometry.cells || []) {
      if (cell.terrainType !== "obstacle") continue;
      for (const target of symmetryTargets(cell.coord, mode)) {
        const counterpart = cells.get(cellKey(target));
        if (!counterpart || counterpart.terrainType !== "obstacle") {
          issues.push({ source: [...cell.coord], target });
        }
      }
    }
    return issues;
  }

  function findPath(definition, startCoord, targetCoord, options = {}) {
    if (!definition || !validCubeCoord(startCoord) || !validCubeCoord(targetCoord)) return null;
    const cells = cellIndex(definition.geometry && definition.geometry.cells || []);
    const startKey = cellKey(startCoord);
    const targetKey = cellKey(targetCoord);
    if (!cells.has(startKey) || !cells.has(targetKey)) return null;
    perf.shortestPathQueries += 1;
    const distances = new Map([[startKey, 0]]);
    const previous = new Map();
    const queue = [{ coord: [...startCoord], cost: 0 }];
    const occupied = options.occupiedKeys instanceof Set ? options.occupiedKeys : new Set();
    while (queue.length) {
      const current = takeLowestCost(queue);
      const currentKey = cellKey(current.coord);
      if (current.cost !== distances.get(currentKey)) continue;
      if (currentKey === targetKey) break;
      for (const next of neighbors(current.coord)) {
        const nextKey = cellKey(next);
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

  function reachableCells(definition, startCoord, budget, options = {}) {
    const cells = cellIndex(definition && definition.geometry && definition.geometry.cells || []);
    const startKey = cellKey(startCoord);
    if (!cells.has(startKey) || budget <= 0) return [];
    perf.reachableQueries += 1;
    const occupied = options.occupiedKeys instanceof Set ? options.occupiedKeys : new Set();
    const distances = new Map([[startKey, 0]]);
    const queue = [{ coord: [...startCoord], cost: 0 }];
    while (queue.length) {
      const current = takeLowestCost(queue);
      const currentKey = cellKey(current.coord);
      if (current.cost !== distances.get(currentKey)) continue;
      for (const next of neighbors(current.coord)) {
        const nextKey = cellKey(next);
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

  return Object.freeze({
    cellIndex,
    hexDistance,
    neighbors,
    reachableKeys,
    singleCellChokes,
    obstacleSymmetryIssues,
    findPath,
    reachableCells
  });
}
