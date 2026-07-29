"use strict";

// Arena Rubra – F9G Camera Foundation.
// Stato UI/render separato dallo stato logico della partita.
// Non modifica regole, AI, mappa, deck, tattiche o input di gioco.

const BOARD_CAMERA_W = 920;
const BOARD_CAMERA_H = 780;
const BOARD_CAMERA_ZOOMS = Object.freeze({ fit: 1, play: 1.12, focus: 1.32, manual: 1.12 });

const boardCamera = {
  x: 0,
  y: 0,
  zoom: 1,
  fitScale: 1,
  mode: "fit",
  initialized: false,
  lastFocusKey: "",
  geometryVersion: -1,
  geometryMapId: ""
};

let boardCameraAnimationTimer = null;

function isApkM4CameraActive() {
  return typeof document !== "undefined"
    && document.body
    && document.body.classList.contains("mobile-apk-m4");
}

function boardCameraBoardEl() {
  if (typeof document === "undefined") return null;
  return document.getElementById("boardVisualStack") || document.getElementById("board");
}

function boardCameraWrapEl() {
  return typeof document !== "undefined" ? document.getElementById("boardWrap") : null;
}

function boardCameraTotalScale() {
  const scale = (Number.isFinite(boardCamera.fitScale) ? boardCamera.fitScale : 1) * (Number.isFinite(boardCamera.zoom) ? boardCamera.zoom : 1);
  return Math.max(0.25, Math.min(2.2, scale));
}

function boardCameraGeometry() {
  return typeof getBoardGeometry === "function"
    ? getBoardGeometry()
    : {
        version: 0,
        mapId: "map1_starter",
        nativeWidth: BOARD_CAMERA_W,
        nativeHeight: BOARD_CAMERA_H,
        renderOriginX: typeof CENTER_X !== "undefined" ? CENTER_X : BOARD_CAMERA_W / 2,
        renderOriginY: typeof CENTER_Y !== "undefined" ? CENTER_Y : BOARD_CAMERA_H / 2
      };
}

function clampBoardCamera(options = {}) {
  const wrap = boardCameraWrapEl();
  if (!wrap) return;
  const rect = typeof cameraInteractionViewportRect === "function"
    ? cameraInteractionViewportRect({ refresh: options.refreshGeometry === true })
    : wrap.getBoundingClientRect();
  if (!rect) return;
  const scale = boardCameraTotalScale();
  if (typeof clampBoardGeometryTranslation === "function") {
    const clamped = clampBoardGeometryTranslation(boardCamera.x, boardCamera.y, rect.width, rect.height, scale, 24);
    boardCamera.x = clamped.x;
    boardCamera.y = clamped.y;
    return;
  }
  const geometry = boardCameraGeometry();
  const extraX = Math.max(0, (geometry.nativeWidth * scale - rect.width) / 2);
  const extraY = Math.max(0, (geometry.nativeHeight * scale - rect.height) / 2);
  boardCamera.x = extraX > 0 ? Math.max(-(extraX + 24), Math.min(extraX + 24, boardCamera.x)) : 0;
  boardCamera.y = extraY > 0 ? Math.max(-(extraY + 24), Math.min(extraY + 24, boardCamera.y)) : 0;
}

function setBoardCameraAnimating(enabled) {
  const board = boardCameraBoardEl();
  if (!board || board.id !== "boardVisualStack") return;

  if (boardCameraAnimationTimer) {
    clearTimeout(boardCameraAnimationTimer);
    boardCameraAnimationTimer = null;
  }

  if (!enabled) {
    board.classList.remove("mapCameraAnimating");
    return;
  }

  board.classList.add("mapCameraAnimating");
  boardCameraAnimationTimer = setTimeout(() => {
    board.classList.remove("mapCameraAnimating");
    boardCameraAnimationTimer = null;
  }, 180);
}

function updateBoardCameraHud() {
  const chip = typeof document !== "undefined" ? document.getElementById("gameHudCamera") : null;
  if (!chip) return;
  const active = isApkM4CameraActive() && typeof apkM4Camera !== "undefined" && apkM4Camera ? apkM4Camera : boardCamera;
  const mode = active && active.mode ? active.mode : "fit";
  const modeLabel = mode === "focus" ? "Focus" : mode === "play" ? "Play" : mode === "manual" ? "Manuale" : mode === "deployment-fit" ? "Sbarco" : "Fit";
  const totalScale = active && Number.isFinite(active.fitScale) && Number.isFinite(active.zoom)
    ? active.fitScale * active.zoom
    : boardCameraTotalScale();
  const pct = Math.round(totalScale * 100);
  chip.textContent = `Camera: ${modeLabel} ${pct}%`;
  chip.dataset.cameraMode = mode;
}

function applyBoardCamera(options = {}) {
  const board = boardCameraBoardEl();
  const wrap = boardCameraWrapEl();
  if (!board || !wrap) return;

  // Su APK-M4 la camera validata è quella mobile. Qui non interferiamo.
  if (isApkM4CameraActive()) {
    updateBoardCameraHud();
    return;
  }

  setBoardCameraAnimating(Boolean(options.animate));
  if (!options.skipClamp) clampBoardCamera({ refreshGeometry: options.refreshGeometry === true });

  const totalScale = boardCameraTotalScale();
  const geometry = boardCameraGeometry();
  board.style.setProperty("--board-fit-scale", String(totalScale.toFixed(4)));
  board.style.setProperty("--board-camera-x", `${Math.round(boardCamera.x)}px`);
  board.style.setProperty("--board-camera-y", `${Math.round(boardCamera.y)}px`);
  if (!options.skipLayoutSize) {
    wrap.style.setProperty("--board-visual-width", `${Math.round(geometry.nativeWidth * totalScale)}px`);
    wrap.style.setProperty("--board-visual-height", `${Math.round(geometry.nativeHeight * totalScale)}px`);
  }
  updateBoardCameraHud();
}

function computeBoardFitScale() {
  const wrap = boardCameraWrapEl();
  if (!wrap) return 1;
  const rect = wrap.getBoundingClientRect();
  const pad = 28;
  const availableW = Math.max(260, rect.width - pad);
  const availableH = Math.max(220, rect.height - pad);
  const geometry = boardCameraGeometry();
  return Math.max(0.18, Math.min(1, availableW / geometry.nativeWidth, availableH / geometry.nativeHeight));
}

function boardPointForCoord(coord) {
  if (typeof getBoardRenderPoint === "function") return getBoardRenderPoint(coord);
  const geometry = boardCameraGeometry();
  if (!Array.isArray(coord)) return { x: geometry.nativeWidth / 2, y: geometry.nativeHeight / 2 };
  const q = coord[0];
  const r = coord[2];
  return {
    x: geometry.renderOriginX + HEX_SIZE * Math.sqrt(3) * (q + r / 2),
    y: geometry.renderOriginY + HEX_SIZE * 1.5 * r
  };
}

function firstCoordFromTargetList(list) {
  if (!Array.isArray(list)) return null;
  for (const item of list) {
    if (Array.isArray(item)) return item;
    if (item && Array.isArray(item.pos)) return item.pos;
    if (item && Array.isArray(item.coord)) return item.coord;
  }
  return null;
}

function boardCameraFocusCoord() {
  try {
    const selected = typeof gameScreenDisplayedUnit === "function"
      ? gameScreenDisplayedUnit()
      : (typeof getSelectedUnit === "function" ? getSelectedUnit() : null);
    if (selected && Array.isArray(selected.pos)) return selected.pos;

    if (typeof state !== "undefined" && state) {
      if (mode === "spawn" && typeof pendingBlueprintForHandOrMarket === "function" && typeof spawnCellsFor === "function") {
        const bp = pendingPurchaseBlueprintId ? pendingBlueprintForHandOrMarket(state.currentPlayer, pendingPurchaseBlueprintId) : null;
        const coord = bp ? firstCoordFromTargetList(spawnCellsFor(state.currentPlayer, bp)) : null;
        if (coord) return coord;
      }
      if (mode === "build" && typeof pendingBlueprintForHandOrMarket === "function" && typeof buildableCells === "function") {
        const selected = typeof getSelectedUnit === "function" ? getSelectedUnit() : null;
        const bp = pendingBuildBlueprintId ? pendingBlueprintForHandOrMarket(state.currentPlayer, pendingBuildBlueprintId) : null;
        const coord = selected && bp ? firstCoordFromTargetList(buildableCells(selected)) : null;
        if (coord) return coord;
      }
      if (mode === "ability" && typeof getSelectedUnit === "function" && typeof abilityTargets === "function" && pendingAbility) {
        const selected = getSelectedUnit();
        const coord = selected ? firstCoordFromTargetList(abilityTargets(selected, pendingAbility)) : null;
        if (coord) return coord;
      }
      if (mode === "tactic") {
        if (pendingHandCardUid && typeof handCardByUid === "function" && typeof handTacticTargets === "function") {
          const card = handCardByUid(state.currentPlayer, pendingHandCardUid);
          const coord = card ? firstCoordFromTargetList(handTacticTargets(state.currentPlayer, card)) : null;
          if (coord) return coord;
        }
        if (pendingTacticId && typeof tacticById === "function" && typeof tacticTargets === "function") {
          const tactic = tacticById(pendingTacticId);
          const coord = tactic ? firstCoordFromTargetList(tacticTargets(state.currentPlayer, tactic)) : null;
          if (coord) return coord;
        }
      }
      if (typeof getHq === "function" && state.currentPlayer) {
        const hq = getHq(state.currentPlayer);
        if (hq && Array.isArray(hq.pos)) return hq.pos;
      }
    }
  } catch (err) {
    // Camera UI: non deve mai bloccare gameplay/render.
  }
  if (typeof getCentralStrategicPointCoord === "function") return getCentralStrategicPointCoord(state && state.mapDefinition);
  return typeof CENTER_PS_COORD !== "undefined" ? CENTER_PS_COORD : [0,0,0];
}

function centerBoardCameraOn(coord, options = {}) {
  if (isApkM4CameraActive()) {
    if (typeof centerApkM4CameraOn === "function") centerApkM4CameraOn(coord || boardCameraFocusCoord(), options);
    return;
  }

  if (!options.keepZoom) boardCamera.zoom = BOARD_CAMERA_ZOOMS.focus;
  const p = boardPointForCoord(coord || boardCameraFocusCoord());
  const scale = boardCameraTotalScale();
  const geometry = boardCameraGeometry();
  boardCamera.x = (geometry.nativeWidth / 2 - p.x) * scale;
  boardCamera.y = (geometry.nativeHeight / 2 - p.y) * scale;
  applyBoardCamera({ animate: options.animate !== false });
}

function fitToBoard(options = {}) {
  if (isApkM4CameraActive()) {
    if (typeof setApkM4CameraMode === "function") setApkM4CameraMode("fit");
    else if (typeof fitApkM4Board === "function") fitApkM4Board({ preserveCamera:false });
    return;
  }
  boardCamera.mode = "fit";
  boardCamera.fitScale = computeBoardFitScale();
  boardCamera.zoom = BOARD_CAMERA_ZOOMS.fit;
  boardCamera.x = 0;
  boardCamera.y = 0;
  applyBoardCamera({ animate: options.animate !== false });
}

function resetCamera() {
  fitToBoard();
}

function focusCoord(coord, options = {}) {
  if (isApkM4CameraActive()) {
    if (typeof setApkM4CameraMode === "function") setApkM4CameraMode("focus");
    if (typeof centerApkM4CameraOn === "function") centerApkM4CameraOn(coord || boardCameraFocusCoord(), { keepZoom:true });
    return;
  }
  boardCamera.mode = "focus";
  boardCamera.fitScale = computeBoardFitScale();
  boardCamera.zoom = BOARD_CAMERA_ZOOMS.focus;
  centerBoardCameraOn(coord || boardCameraFocusCoord(), { keepZoom:true });
}

function focusUnit(unitOrId) {
  let unit = unitOrId;
  if (typeof unitOrId === "string" && typeof state !== "undefined" && state && Array.isArray(state.units)) {
    unit = state.units.find(u => u && u.uid === unitOrId);
  }
  if (unit && Array.isArray(unit.pos)) focusCoord(unit.pos);
  else focusCoord(boardCameraFocusCoord());
}

function setBoardCameraMode(mode) {
  if (mode === "focus") return focusCoord(boardCameraFocusCoord());
  if (mode === "play") {
    if (isApkM4CameraActive() && typeof setApkM4CameraMode === "function") return setApkM4CameraMode("play");
    boardCamera.mode = "play";
    boardCamera.fitScale = computeBoardFitScale();
    boardCamera.zoom = BOARD_CAMERA_ZOOMS.play;
    boardCamera.x = 0;
    boardCamera.y = 0;
    applyBoardCamera({ animate:true });
    return;
  }
  return fitToBoard();
}

function panBy(dx, dy) {
  if (isApkM4CameraActive()) return;
  boardCamera.mode = "manual";
  boardCamera.x += Number(dx) || 0;
  boardCamera.y += Number(dy) || 0;
  applyBoardCamera({ animate:true });
}

function zoomAt(point, delta) {
  if (isApkM4CameraActive()) return;
  boardCamera.mode = "manual";
  const current = Number.isFinite(boardCamera.zoom) ? boardCamera.zoom : 1;
  const step = delta > 0 ? 1.1 : 0.9;
  boardCamera.zoom = Math.max(0.72, Math.min(1.8, current * step));
  applyBoardCamera({ animate:true });
}

function screenToBoardCoord(point) {
  const board = boardCameraBoardEl();
  if (!board || !point) return null;
  const rect = board.getBoundingClientRect();
  const scale = boardCameraTotalScale();
  return {
    x: (point.x - rect.left) / scale,
    y: (point.y - rect.top) / scale
  };
}

function refreshBoardCameraForGeometry(geometry, options = {}) {
  boardCamera.geometryVersion = geometry.version;
  boardCamera.geometryMapId = geometry.mapId;
  if (options.mapChanged || boardCamera.mode === "fit") {
    boardCamera.fitScale = computeBoardFitScale();
    boardCamera.zoom = boardCamera.mode === "fit" ? BOARD_CAMERA_ZOOMS.fit : boardCamera.zoom;
    boardCamera.x = 0;
    boardCamera.y = 0;
  }
  if (typeof cameraInteractionInvalidateGeometry === "function") cameraInteractionInvalidateGeometry();
}

function syncBoardCameraAfterRender() {
  // I render ordinari non devono inseguire bot o azioni. Si reagisce soltanto
  // agli eventi del registry geometrico F9Q3a; in sua assenza resta il contratto
  // storico F9O2c e la camera corrente viene soltanto riapplicata.
  const geometry = boardCameraGeometry();
  const hasDynamicGeometry = typeof getBoardGeometry === "function";
  const geometryChanged = hasDynamicGeometry && boardCamera.geometryVersion !== geometry.version;
  const mapChanged = hasDynamicGeometry && boardCamera.geometryMapId !== geometry.mapId;

  if (isApkM4CameraActive()) {
    if (typeof apkM4HandleBoardGeometry === "function") apkM4HandleBoardGeometry({ geometryChanged, mapChanged });
    else if (typeof applyApkM4Camera === "function") applyApkM4Camera();
    if (typeof updateApkM4StatusStrip === "function") updateApkM4StatusStrip();
    if (typeof cameraInteractionUpdateControls === "function") cameraInteractionUpdateControls();
    return;
  }
  if (!boardCamera.initialized) {
    boardCamera.initialized = true;
    boardCamera.geometryVersion = geometry.version;
    boardCamera.geometryMapId = geometry.mapId;
    fitToBoard({ animate:false });
    return;
  }
  if (geometryChanged) refreshBoardCameraForGeometry(geometry, { mapChanged });
  applyBoardCamera({ animate:false, refreshGeometry:geometryChanged, skipClamp:!geometryChanged });
  if (typeof cameraInteractionUpdateControls === "function") cameraInteractionUpdateControls();
}

function initializeBoardCamera() {
  if (typeof document === "undefined") return;
  if (boardCamera.initialized) {
    syncBoardCameraAfterRender();
    return;
  }
  boardCamera.initialized = true;
  fitToBoard({ animate:false });

  const handleViewportChange = () => {
    if (typeof cameraInteractionInvalidateGeometry === "function") cameraInteractionInvalidateGeometry();
    if (boardCamera.mode === "fit") boardCamera.fitScale = computeBoardFitScale();
    applyBoardCamera({ animate:false, refreshGeometry:true });
  };
  window.addEventListener("resize", handleViewportChange, { passive:true });
  window.addEventListener("orientationchange", () => setTimeout(handleViewportChange, 160), { passive:true });
  if (window.visualViewport && typeof window.visualViewport.addEventListener === "function") {
    window.visualViewport.addEventListener("resize", handleViewportChange, { passive:true });
  }
}
