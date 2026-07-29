"use strict";

// Arena Rubra – F9Q3a Dynamic Board Geometry Foundation.
// Sorgente unica per dimensioni native, origine di render e limiti camera.
// Le costanti MAP1 restano esclusivamente come fallback compatibile.

const BOARD_GEOMETRY_DEFAULT_WIDTH = 920;
const BOARD_GEOMETRY_DEFAULT_HEIGHT = 780;
const BOARD_GEOMETRY_DEFAULT_PADDING = 70;
const BOARD_GEOMETRY_EDGE_MARGIN = 24;

const boardGeometry = {
  version: 0,
  mapId: "map1_starter",
  minX: 0,
  minY: 0,
  maxX: BOARD_GEOMETRY_DEFAULT_WIDTH,
  maxY: BOARD_GEOMETRY_DEFAULT_HEIGHT,
  nativeWidth: BOARD_GEOMETRY_DEFAULT_WIDTH,
  nativeHeight: BOARD_GEOMETRY_DEFAULT_HEIGHT,
  renderOriginX: typeof CENTER_X !== "undefined" ? CENTER_X : BOARD_GEOMETRY_DEFAULT_WIDTH / 2,
  renderOriginY: typeof CENTER_Y !== "undefined" ? CENTER_Y : BOARD_GEOMETRY_DEFAULT_HEIGHT / 2,
  hexPadding: BOARD_GEOMETRY_DEFAULT_PADDING,
  cellCount: 0,
  structureKey: ""
};

const boardGeometryListeners = new Set();

function boardGeometryFinite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function boardGeometrySnapshot() {
  return { ...boardGeometry };
}

function getBoardGeometry() {
  return boardGeometrySnapshot();
}

function getBoardNativeSize() {
  return {
    width: boardGeometry.nativeWidth,
    height: boardGeometry.nativeHeight
  };
}

function boardGeometryCoordKey(coord) {
  return Array.isArray(coord) ? coord.join(",") : "";
}

function boardGeometryStructureKey(cells) {
  const list = Array.isArray(cells) ? cells : [];
  if (!list.length) return "";
  return list.map(cell => boardGeometryCoordKey(cell && cell.coord)).join("|");
}

function calculateBoardGeometry(cells, options = {}) {
  const list = Array.isArray(cells) ? cells.filter(cell => cell && Array.isArray(cell.coord)) : [];
  const mapId = String(options.mapId || "map1_starter");
  const isStarter = options.forceStarter === true || mapId === "map1_starter";
  const padding = Math.max(40, boardGeometryFinite(options.padding, BOARD_GEOMETRY_DEFAULT_PADDING));
  const hexSize = Math.max(1, boardGeometryFinite(options.hexSize, typeof HEX_SIZE !== "undefined" ? HEX_SIZE : 30));

  if (isStarter || !list.length) {
    return {
      mapId,
      minX: 0,
      minY: 0,
      maxX: BOARD_GEOMETRY_DEFAULT_WIDTH,
      maxY: BOARD_GEOMETRY_DEFAULT_HEIGHT,
      nativeWidth: BOARD_GEOMETRY_DEFAULT_WIDTH,
      nativeHeight: BOARD_GEOMETRY_DEFAULT_HEIGHT,
      renderOriginX: typeof CENTER_X !== "undefined" ? CENTER_X : BOARD_GEOMETRY_DEFAULT_WIDTH / 2,
      renderOriginY: typeof CENTER_Y !== "undefined" ? CENTER_Y : BOARD_GEOMETRY_DEFAULT_HEIGHT / 2,
      hexPadding: padding,
      cellCount: list.length,
      structureKey: boardGeometryStructureKey(list)
    };
  }

  const points = list.map(cell => {
    const q = Number(cell.coord[0]) || 0;
    const r = Number(cell.coord[2]) || 0;
    return {
      x: hexSize * Math.sqrt(3) * (q + r / 2),
      y: hexSize * 1.5 * r
    };
  });
  const minX = Math.min(...points.map(point => point.x));
  const maxX = Math.max(...points.map(point => point.x));
  const minY = Math.min(...points.map(point => point.y));
  const maxY = Math.max(...points.map(point => point.y));
  const nativeWidth = Math.max(1, Math.ceil(maxX - minX + padding * 2));
  const nativeHeight = Math.max(1, Math.ceil(maxY - minY + padding * 2));

  return {
    mapId,
    minX,
    minY,
    maxX,
    maxY,
    nativeWidth,
    nativeHeight,
    renderOriginX: padding - minX,
    renderOriginY: padding - minY,
    hexPadding: padding,
    cellCount: list.length,
    structureKey: boardGeometryStructureKey(list)
  };
}

function boardGeometryEqual(a, b) {
  return a.mapId === b.mapId
    && a.nativeWidth === b.nativeWidth
    && a.nativeHeight === b.nativeHeight
    && a.renderOriginX === b.renderOriginX
    && a.renderOriginY === b.renderOriginY
    && a.structureKey === b.structureKey;
}

function setBoardGeometry(metrics, options = {}) {
  const next = metrics && typeof metrics === "object" ? metrics : {};
  const normalized = {
    mapId: String(next.mapId || boardGeometry.mapId || "map1_starter"),
    minX: boardGeometryFinite(next.minX, 0),
    minY: boardGeometryFinite(next.minY, 0),
    maxX: boardGeometryFinite(next.maxX, BOARD_GEOMETRY_DEFAULT_WIDTH),
    maxY: boardGeometryFinite(next.maxY, BOARD_GEOMETRY_DEFAULT_HEIGHT),
    nativeWidth: Math.max(1, boardGeometryFinite(next.nativeWidth, BOARD_GEOMETRY_DEFAULT_WIDTH)),
    nativeHeight: Math.max(1, boardGeometryFinite(next.nativeHeight, BOARD_GEOMETRY_DEFAULT_HEIGHT)),
    renderOriginX: boardGeometryFinite(next.renderOriginX, typeof CENTER_X !== "undefined" ? CENTER_X : BOARD_GEOMETRY_DEFAULT_WIDTH / 2),
    renderOriginY: boardGeometryFinite(next.renderOriginY, typeof CENTER_Y !== "undefined" ? CENTER_Y : BOARD_GEOMETRY_DEFAULT_HEIGHT / 2),
    hexPadding: Math.max(0, boardGeometryFinite(next.hexPadding, BOARD_GEOMETRY_DEFAULT_PADDING)),
    cellCount: Math.max(0, Math.trunc(boardGeometryFinite(next.cellCount, 0))),
    structureKey: String(next.structureKey || "")
  };
  const previous = boardGeometrySnapshot();
  if (boardGeometryEqual(previous, normalized) && options.force !== true) return previous;
  Object.assign(boardGeometry, normalized);
  boardGeometry.version += 1;

  if (typeof document !== "undefined" && document.documentElement) {
    const root = document.documentElement;
    root.style.setProperty("--board-native-width", `${Math.round(boardGeometry.nativeWidth)}px`);
    root.style.setProperty("--board-native-height", `${Math.round(boardGeometry.nativeHeight)}px`);
    root.style.setProperty("--board-layout-left", `calc(50% - ${boardGeometry.nativeWidth / 2}px)`);
    root.style.setProperty("--board-layout-top", `calc(50% - ${boardGeometry.nativeHeight / 2}px)`);
    root.style.setProperty("--hex-center-x", `${boardGeometry.renderOriginX}px`);
    root.style.setProperty("--hex-center-y", `${boardGeometry.renderOriginY}px`);
  }

  const detail = { previous, current: boardGeometrySnapshot(), mapChanged: previous.mapId !== boardGeometry.mapId };
  for (const listener of boardGeometryListeners) {
    try { listener(detail); } catch (error) { console.warn("Arena Rubra board geometry listener fallito", error); }
  }
  if (typeof document !== "undefined" && typeof CustomEvent === "function") {
    try { document.dispatchEvent(new CustomEvent("arena:board-geometry-changed", { detail })); } catch (_) {}
  }
  return boardGeometrySnapshot();
}

function updateBoardGeometryFromState(gameState = null, options = {}) {
  const source = gameState || (typeof state !== "undefined" ? state : null);
  const cells = source && Array.isArray(source.cells) ? source.cells : [];
  const mapId = source && source.mapId ? source.mapId : (options.mapId || "map1_starter");
  return setBoardGeometry(calculateBoardGeometry(cells, { ...options, mapId }));
}

function getBoardRenderPoint(coord) {
  if (!Array.isArray(coord)) {
    return { x: boardGeometry.nativeWidth / 2, y: boardGeometry.nativeHeight / 2 };
  }
  const q = Number(coord[0]) || 0;
  const r = Number(coord[2]) || 0;
  const hexSize = typeof HEX_SIZE !== "undefined" ? HEX_SIZE : 30;
  return {
    x: boardGeometry.renderOriginX + hexSize * Math.sqrt(3) * (q + r / 2),
    y: boardGeometry.renderOriginY + hexSize * 1.5 * r
  };
}

function boardGeometryPanLimits(viewportWidth, viewportHeight, scale, margin = BOARD_GEOMETRY_EDGE_MARGIN) {
  const viewportW = Math.max(0, boardGeometryFinite(viewportWidth, 0));
  const viewportH = Math.max(0, boardGeometryFinite(viewportHeight, 0));
  const safeScale = Math.max(0.01, boardGeometryFinite(scale, 1));
  const visualW = boardGeometry.nativeWidth * safeScale;
  const visualH = boardGeometry.nativeHeight * safeScale;
  const safeMargin = Math.max(0, boardGeometryFinite(margin, BOARD_GEOMETRY_EDGE_MARGIN));
  const extraX = Math.max(0, (visualW - viewportW) / 2);
  const extraY = Math.max(0, (visualH - viewportH) / 2);
  return {
    minX: visualW <= viewportW ? 0 : -(extraX + safeMargin),
    maxX: visualW <= viewportW ? 0 : extraX + safeMargin,
    minY: visualH <= viewportH ? 0 : -(extraY + safeMargin),
    maxY: visualH <= viewportH ? 0 : extraY + safeMargin,
    visualWidth: visualW,
    visualHeight: visualH
  };
}

function clampBoardGeometryTranslation(x, y, viewportWidth, viewportHeight, scale, margin = BOARD_GEOMETRY_EDGE_MARGIN) {
  const limits = boardGeometryPanLimits(viewportWidth, viewportHeight, scale, margin);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, boardGeometryFinite(value, 0)));
  return {
    x: clamp(x, limits.minX, limits.maxX),
    y: clamp(y, limits.minY, limits.maxY),
    limits
  };
}

function onBoardGeometryChanged(listener) {
  if (typeof listener !== "function") return () => {};
  boardGeometryListeners.add(listener);
  return () => boardGeometryListeners.delete(listener);
}
