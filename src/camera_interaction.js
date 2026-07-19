"use strict";

// Arena Rubra – F9O2 Interactive Map Camera Foundation.
// Input diretto mouse/touch, zoom ancorato, pinch, pan limitato e API di focus
// condivise fra camera desktop e APK-M4. Nessuna modifica al gameplay.

const CAMERA_INTERACTION_MIN_ZOOM = 0.72;
const CAMERA_INTERACTION_MAX_ZOOM = 2.2;
const CAMERA_INTERACTION_BUTTON_STEP = 1.16;
const CAMERA_INTERACTION_WHEEL_SENSITIVITY = 0.00155;
const CAMERA_INTERACTION_DRAG_THRESHOLD = 7;
const CAMERA_INTERACTION_MIN_VISIBLE_MARGIN = 24;

const cameraInteractionState = {
  bound: false,
  locked: false,
  pointers: new Map(),
  gesture: null,
  dragging: false,
  suppressClickUntil: 0,
  lastInput: "none"
};

function cameraInteractionClampValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cameraInteractionIsMobile() {
  return typeof apkM4Camera !== "undefined"
    && apkM4Camera
    && apkM4Camera.mobile === true
    && typeof document !== "undefined"
    && document.body
    && document.body.classList.contains("mobile-apk-m4");
}

function cameraInteractionModel() {
  if (cameraInteractionIsMobile()) return apkM4Camera;
  return typeof boardCamera !== "undefined" ? boardCamera : null;
}

function cameraInteractionWrap() {
  return typeof document !== "undefined" ? document.getElementById("boardWrap") : null;
}

function cameraInteractionSurface() {
  return typeof document !== "undefined" ? document.getElementById("boardVisualStack") : null;
}

function cameraInteractionNativeSize() {
  return {
    width: typeof BOARD_CAMERA_W === "number" ? BOARD_CAMERA_W : 920,
    height: typeof BOARD_CAMERA_H === "number" ? BOARD_CAMERA_H : 780
  };
}

function cameraInteractionFitScale(model = cameraInteractionModel()) {
  return model && Number.isFinite(model.fitScale) ? model.fitScale : 1;
}

function cameraInteractionRelativeZoom(model = cameraInteractionModel()) {
  return model && Number.isFinite(model.zoom) ? model.zoom : 1;
}

function cameraInteractionTotalScale(model = cameraInteractionModel(), zoomOverride = null) {
  const fit = cameraInteractionFitScale(model);
  const zoom = Number.isFinite(zoomOverride) ? zoomOverride : cameraInteractionRelativeZoom(model);
  return Math.max(0.18, fit * zoom);
}

function cameraInteractionViewportCenter() {
  const wrap = cameraInteractionWrap();
  if (!wrap || typeof wrap.getBoundingClientRect !== "function") return { x: 0, y: 0, rect: null };
  const rect = wrap.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rect };
}

function cameraInteractionComputeZoomTranslation(anchor, viewportCenter, oldTranslation, oldScale, newScale) {
  const safeOldScale = Math.max(0.0001, Number(oldScale) || 1);
  const safeNewScale = Math.max(0.0001, Number(newScale) || 1);
  const a = anchor || viewportCenter || { x: 0, y: 0 };
  const c = viewportCenter || { x: 0, y: 0 };
  const oldT = oldTranslation || { x: 0, y: 0 };
  const localX = (a.x - c.x - (Number(oldT.x) || 0)) / safeOldScale;
  const localY = (a.y - c.y - (Number(oldT.y) || 0)) / safeOldScale;
  return {
    x: a.x - c.x - localX * safeNewScale,
    y: a.y - c.y - localY * safeNewScale
  };
}

function cameraInteractionClampModel(model = cameraInteractionModel()) {
  const wrap = cameraInteractionWrap();
  if (!model || !wrap || typeof wrap.getBoundingClientRect !== "function") return model;
  const rect = wrap.getBoundingClientRect();
  const native = cameraInteractionNativeSize();
  const scale = cameraInteractionTotalScale(model);
  const visualW = native.width * scale;
  const visualH = native.height * scale;
  const extraX = Math.max(0, (visualW - rect.width) / 2);
  const extraY = Math.max(0, (visualH - rect.height) / 2);
  const margin = cameraInteractionIsMobile() ? 18 : CAMERA_INTERACTION_MIN_VISIBLE_MARGIN;
  model.x = cameraInteractionClampValue(Number(model.x) || 0, -(extraX + margin), extraX + margin);
  model.y = cameraInteractionClampValue(Number(model.y) || 0, -(extraY + margin), extraY + margin);
  return model;
}

function cameraInteractionApply(options = {}) {
  const model = cameraInteractionModel();
  if (!model) return;
  cameraInteractionClampModel(model);
  if (cameraInteractionIsMobile() && typeof applyApkM4Camera === "function") {
    applyApkM4Camera();
  } else if (typeof applyBoardCamera === "function") {
    applyBoardCamera({ animate: options.animate === true });
  }
  cameraInteractionUpdateControls();
}

function cameraInteractionSetZoom(nextZoom, anchor = null, options = {}) {
  const model = cameraInteractionModel();
  if (!model) return 1;
  const oldZoom = cameraInteractionRelativeZoom(model);
  const clampedZoom = cameraInteractionClampValue(Number(nextZoom) || oldZoom, CAMERA_INTERACTION_MIN_ZOOM, CAMERA_INTERACTION_MAX_ZOOM);
  if (Math.abs(clampedZoom - oldZoom) < 0.0001) return oldZoom;

  const center = cameraInteractionViewportCenter();
  const point = anchor && Number.isFinite(anchor.x) && Number.isFinite(anchor.y)
    ? anchor
    : { x: center.x, y: center.y };
  const oldScale = cameraInteractionTotalScale(model, oldZoom);
  const newScale = cameraInteractionTotalScale(model, clampedZoom);
  const nextTranslation = cameraInteractionComputeZoomTranslation(
    point,
    { x: center.x, y: center.y },
    { x: model.x, y: model.y },
    oldScale,
    newScale
  );

  model.zoom = clampedZoom;
  model.x = nextTranslation.x;
  model.y = nextTranslation.y;
  model.mode = "manual";
  cameraInteractionApply({ animate: options.animate === true });
  return clampedZoom;
}

function cameraInteractionZoomByFactor(factor, anchor = null, options = {}) {
  const model = cameraInteractionModel();
  if (!model) return 1;
  return cameraInteractionSetZoom(cameraInteractionRelativeZoom(model) * (Number(factor) || 1), anchor, options);
}

function cameraInteractionPanBy(dx, dy, options = {}) {
  const model = cameraInteractionModel();
  if (!model) return;
  model.mode = "manual";
  model.x = (Number(model.x) || 0) + (Number(dx) || 0);
  model.y = (Number(model.y) || 0) + (Number(dy) || 0);
  cameraInteractionApply({ animate: options.animate === true });
}

function cameraInteractionPointerPoint(event) {
  return { x: Number(event.clientX) || 0, y: Number(event.clientY) || 0 };
}

function cameraInteractionPointerDistance(a, b) {
  return Math.hypot((b.x || 0) - (a.x || 0), (b.y || 0) - (a.y || 0));
}

function cameraInteractionPointerMidpoint(a, b) {
  return { x: ((a.x || 0) + (b.x || 0)) / 2, y: ((a.y || 0) + (b.y || 0)) / 2 };
}

function cameraInteractionBeginSingleGesture(pointer) {
  const model = cameraInteractionModel();
  if (!model) return;
  cameraInteractionState.gesture = {
    type: "pan",
    pointerId: pointer.id,
    start: { x: pointer.x, y: pointer.y },
    last: { x: pointer.x, y: pointer.y },
    originX: Number(model.x) || 0,
    originY: Number(model.y) || 0
  };
  cameraInteractionState.dragging = false;
}

function cameraInteractionCapturePointer(pointerId) {
  const surface = cameraInteractionSurface();
  if (!surface || typeof surface.setPointerCapture !== "function") return false;
  try {
    surface.setPointerCapture(pointerId);
    return true;
  } catch (err) {
    return false;
  }
}

function cameraInteractionBeginPinchGesture() {
  const pointers = Array.from(cameraInteractionState.pointers.values());
  const model = cameraInteractionModel();
  if (pointers.length < 2 || !model) return;
  const a = pointers[0];
  const b = pointers[1];
  const midpoint = cameraInteractionPointerMidpoint(a, b);
  const center = cameraInteractionViewportCenter();
  const startScale = cameraInteractionTotalScale(model);
  const localX = (midpoint.x - center.x - (Number(model.x) || 0)) / Math.max(0.0001, startScale);
  const localY = (midpoint.y - center.y - (Number(model.y) || 0)) / Math.max(0.0001, startScale);
  cameraInteractionState.gesture = {
    type: "pinch",
    startDistance: Math.max(1, cameraInteractionPointerDistance(a, b)),
    startZoom: cameraInteractionRelativeZoom(model),
    nativeAnchor: { x: localX, y: localY }
  };
  cameraInteractionState.dragging = true;
  pointers.forEach(pointer => cameraInteractionCapturePointer(pointer.id));
  cameraInteractionSetDraggingClass(true);
}

function cameraInteractionSetDraggingClass(enabled) {
  const surface = cameraInteractionSurface();
  const wrap = cameraInteractionWrap();
  if (surface && surface.classList && typeof surface.classList.toggle === "function") surface.classList.toggle("cameraDragging", Boolean(enabled));
  if (wrap && wrap.classList && typeof wrap.classList.toggle === "function") wrap.classList.toggle("cameraDragging", Boolean(enabled));
}

function cameraInteractionHandlePointerDown(event) {
  if (cameraInteractionState.locked) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  const surface = cameraInteractionSurface();
  if (!surface) return;
  const point = cameraInteractionPointerPoint(event);
  cameraInteractionState.lastInput = event.pointerType || "pointer";
  cameraInteractionState.pointers.set(event.pointerId, { id: event.pointerId, ...point });
  // Non acquisire subito il puntatore: la pointer capture al pointerdown
  // ritargettizza il pointerup/click al contenitore e può impedire alle celle
  // di ricevere il click di sbarco. La capture parte solo quando il gesto
  // supera la soglia di pan oppure diventa un pinch reale.
  if (cameraInteractionState.pointers.size >= 2) {
    if (event.cancelable) event.preventDefault();
    cameraInteractionBeginPinchGesture();
  } else {
    cameraInteractionBeginSingleGesture({ id: event.pointerId, ...point });
  }
}

function cameraInteractionHandlePointerMove(event) {
  if (cameraInteractionState.locked || !cameraInteractionState.pointers.has(event.pointerId)) return;
  const point = cameraInteractionPointerPoint(event);
  cameraInteractionState.pointers.set(event.pointerId, { id: event.pointerId, ...point });
  const model = cameraInteractionModel();
  const gesture = cameraInteractionState.gesture;
  if (!model || !gesture) return;

  if (cameraInteractionState.pointers.size >= 2 || gesture.type === "pinch") {
    const pointers = Array.from(cameraInteractionState.pointers.values());
    if (pointers.length < 2) return;
    if (gesture.type !== "pinch") cameraInteractionBeginPinchGesture();
    const pinch = cameraInteractionState.gesture;
    const a = pointers[0];
    const b = pointers[1];
    const midpoint = cameraInteractionPointerMidpoint(a, b);
    const distance = Math.max(1, cameraInteractionPointerDistance(a, b));
    const nextZoom = cameraInteractionClampValue(
      pinch.startZoom * (distance / Math.max(1, pinch.startDistance)),
      CAMERA_INTERACTION_MIN_ZOOM,
      CAMERA_INTERACTION_MAX_ZOOM
    );
    const center = cameraInteractionViewportCenter();
    const newScale = cameraInteractionTotalScale(model, nextZoom);
    model.zoom = nextZoom;
    model.x = midpoint.x - center.x - pinch.nativeAnchor.x * newScale;
    model.y = midpoint.y - center.y - pinch.nativeAnchor.y * newScale;
    model.mode = "manual";
    if (event.cancelable) event.preventDefault();
    cameraInteractionApply({ animate: false });
    return;
  }

  if (gesture.type !== "pan" || gesture.pointerId !== event.pointerId) return;
  const dxFromStart = point.x - gesture.start.x;
  const dyFromStart = point.y - gesture.start.y;
  if (!cameraInteractionState.dragging && Math.hypot(dxFromStart, dyFromStart) >= CAMERA_INTERACTION_DRAG_THRESHOLD) {
    cameraInteractionState.dragging = true;
    cameraInteractionCapturePointer(event.pointerId);
    cameraInteractionSetDraggingClass(true);
  }
  if (!cameraInteractionState.dragging) return;
  if (event.cancelable) event.preventDefault();
  model.mode = "manual";
  model.x = gesture.originX + dxFromStart;
  model.y = gesture.originY + dyFromStart;
  gesture.last = point;
  cameraInteractionApply({ animate: false });
}

function cameraInteractionFinishPointer(event) {
  if (!cameraInteractionState.pointers.has(event.pointerId)) return;
  cameraInteractionState.pointers.delete(event.pointerId);
  if (cameraInteractionState.dragging) cameraInteractionState.suppressClickUntil = Date.now() + 420;

  if (cameraInteractionState.pointers.size >= 2) {
    cameraInteractionBeginPinchGesture();
    return;
  }
  if (cameraInteractionState.pointers.size === 1) {
    const remaining = Array.from(cameraInteractionState.pointers.values())[0];
    cameraInteractionBeginSingleGesture(remaining);
    return;
  }
  cameraInteractionState.gesture = null;
  cameraInteractionState.dragging = false;
  cameraInteractionSetDraggingClass(false);
  cameraInteractionApply({ animate: false });
}

function cameraInteractionHandleWheel(event) {
  if (cameraInteractionState.locked) return;
  if (!event || !Number.isFinite(event.deltaY)) return;
  if (event.cancelable) event.preventDefault();
  cameraInteractionState.lastInput = "wheel";
  const factor = Math.exp(-event.deltaY * CAMERA_INTERACTION_WHEEL_SENSITIVITY);
  cameraInteractionZoomByFactor(factor, cameraInteractionPointerPoint(event), { animate: false });
}

function cameraInteractionHandleClickCapture(event) {
  if (Date.now() <= cameraInteractionState.suppressClickUntil) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
  }
}

function cameraInteractionZoomIn(anchor = null) {
  if (cameraInteractionState.locked) return;
  cameraInteractionZoomByFactor(CAMERA_INTERACTION_BUTTON_STEP, anchor, { animate: true });
}

function cameraInteractionZoomOut(anchor = null) {
  if (cameraInteractionState.locked) return;
  cameraInteractionZoomByFactor(1 / CAMERA_INTERACTION_BUTTON_STEP, anchor, { animate: true });
}

function cameraInteractionCenterCurrent() {
  if (cameraInteractionState.locked) return;
  const coord = typeof boardCameraFocusCoord === "function" ? boardCameraFocusCoord() : null;
  cameraFocusHex(coord, { keepZoom: true, animate: true });
}

function cameraInteractionFit() {
  if (cameraInteractionState.locked) return;
  cameraResetView({ animate: true });
}

function cameraInteractionUpdateControls() {
  const model = cameraInteractionModel();
  const pct = Math.round(cameraInteractionTotalScale(model) * 100);
  const label = typeof document !== "undefined" ? document.getElementById("mapCameraZoomLabel") : null;
  if (label) label.textContent = `${pct}%`;
  const controls = typeof document !== "undefined" ? document.getElementById("mapCameraControls") : null;
  if (controls) {
    controls.dataset.cameraLocked = cameraInteractionState.locked ? "1" : "0";
    controls.querySelectorAll("button").forEach(button => { button.disabled = cameraInteractionState.locked; });
  }
  if (typeof updateBoardCameraHud === "function") updateBoardCameraHud();
}

function cameraParseHexCoord(value) {
  if (Array.isArray(value) && value.length >= 3) return value.map(Number).slice(0, 3);
  if (value && Array.isArray(value.coord)) return value.coord.map(Number).slice(0, 3);
  if (typeof value !== "string") return null;
  const parts = value.split(",").map(part => Number(part.trim()));
  return parts.length >= 3 && parts.every(Number.isFinite) ? parts.slice(0, 3) : null;
}

function cameraFocusHex(hexIdOrCoord, options = {}) {
  const coord = cameraParseHexCoord(hexIdOrCoord) || (typeof boardCameraFocusCoord === "function" ? boardCameraFocusCoord() : null);
  if (!coord) return false;
  const model = cameraInteractionModel();
  if (!model) return false;
  if (!options.keepZoom) model.zoom = cameraInteractionClampValue(Number(options.zoom) || 1.35, CAMERA_INTERACTION_MIN_ZOOM, CAMERA_INTERACTION_MAX_ZOOM);
  model.mode = options.mode || "focus";
  const point = typeof boardPointForCoord === "function" ? boardPointForCoord(coord) : null;
  const native = cameraInteractionNativeSize();
  const scale = cameraInteractionTotalScale(model);
  if (point) {
    model.x = (native.width / 2 - point.x) * scale;
    model.y = (native.height / 2 - point.y) * scale;
    cameraInteractionApply({ animate: options.animate !== false });
    return true;
  }
  if (cameraInteractionIsMobile() && typeof centerApkM4CameraOn === "function") {
    centerApkM4CameraOn(coord, { keepZoom: true });
    cameraInteractionUpdateControls();
    return true;
  }
  return false;
}

function cameraFocusUnit(unitOrId, options = {}) {
  let unit = unitOrId;
  if (typeof unitOrId === "string" && typeof state !== "undefined" && state && Array.isArray(state.units)) {
    unit = state.units.find(candidate => candidate && candidate.uid === unitOrId);
  }
  return Boolean(unit && Array.isArray(unit.pos) && cameraFocusHex(unit.pos, options));
}

function cameraFocusHQ(side, options = {}) {
  if (typeof getHq !== "function") return false;
  const hq = getHq(Number(side));
  return Boolean(hq && Array.isArray(hq.pos) && cameraFocusHex(hq.pos, options));
}

function cameraNormalizeCoordList(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const coords = [];
  for (const item of items) {
    const coord = cameraParseHexCoord(item);
    if (!coord) continue;
    const key = coord.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    coords.push(coord);
  }
  return coords;
}

function cameraFitCoords(items, options = {}) {
  const coords = cameraNormalizeCoordList(items);
  const model = cameraInteractionModel();
  const wrap = cameraInteractionWrap();
  if (!coords.length || !model || !wrap || typeof wrap.getBoundingClientRect !== "function" || typeof boardPointForCoord !== "function") return false;

  if (cameraInteractionIsMobile() && typeof fitApkM4Board === "function") fitApkM4Board({ preserveCamera:true });
  else if (!cameraInteractionIsMobile() && typeof computeBoardFitScale === "function") model.fitScale = computeBoardFitScale();

  const points = coords.map(coord => boardPointForCoord(coord)).filter(point => point && Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!points.length) return false;
  const hexPad = Number.isFinite(options.hexPadding) ? options.hexPadding : (typeof HEX_SIZE === "number" ? HEX_SIZE * 1.35 : 62);
  const minX = Math.min(...points.map(point => point.x)) - hexPad;
  const maxX = Math.max(...points.map(point => point.x)) + hexPad;
  const minY = Math.min(...points.map(point => point.y)) - hexPad;
  const maxY = Math.max(...points.map(point => point.y)) + hexPad;
  const contentW = Math.max(hexPad * 2, maxX - minX);
  const contentH = Math.max(hexPad * 2, maxY - minY);
  const rect = wrap.getBoundingClientRect();
  const viewportMargin = Number.isFinite(options.viewportMargin) ? options.viewportMargin : (cameraInteractionIsMobile() ? 28 : 46);
  const availableW = Math.max(160, rect.width - viewportMargin * 2);
  const availableH = Math.max(140, rect.height - viewportMargin * 2);
  const desiredTotalScale = Math.min(availableW / contentW, availableH / contentH);
  const fitScale = Math.max(0.0001, cameraInteractionFitScale(model));
  const maxZoom = Number.isFinite(options.maxZoom) ? options.maxZoom : 1.72;
  model.zoom = cameraInteractionClampValue(desiredTotalScale / fitScale, CAMERA_INTERACTION_MIN_ZOOM, Math.min(CAMERA_INTERACTION_MAX_ZOOM, maxZoom));
  model.mode = options.mode || "deployment-fit";
  const scale = cameraInteractionTotalScale(model);
  const native = cameraInteractionNativeSize();
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  model.x = (native.width / 2 - centerX) * scale;
  model.y = (native.height / 2 - centerY) * scale;
  cameraInteractionApply({ animate: options.animate !== false });
  return true;
}

function cameraFitDeploymentTargets(side, blueprint, options = {}) {
  if (!blueprint || typeof spawnCellsFor !== "function") return false;
  const coords = spawnCellsFor(Number(side), blueprint);
  return cameraFitCoords(coords, { ...options, mode:"deployment-fit" });
}

function cameraScheduleDeploymentFit(side, blueprint, options = {}) {
  const run = () => cameraFitDeploymentTargets(side, blueprint, options);
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => window.requestAnimationFrame(run));
    return true;
  }
  return run();
}

function cameraSetZoom(level, options = {}) {
  const center = cameraInteractionViewportCenter();
  const anchor = options.anchor || { x: center.x, y: center.y };
  return cameraInteractionSetZoom(level, anchor, { animate: options.animate === true });
}

function cameraResetView(options = {}) {
  if (cameraInteractionIsMobile()) {
    if (typeof setApkM4CameraMode === "function") setApkM4CameraMode("fit");
    else if (typeof fitApkM4Board === "function") fitApkM4Board({ preserveCamera: false });
  } else if (typeof fitToBoard === "function") {
    fitToBoard({ animate: options.animate !== false });
  }
  cameraInteractionUpdateControls();
}

function cameraResetForNewGame() {
  if (typeof gameScreenClearInspection === "function") gameScreenClearInspection();
  cameraInteractionState.pointers.clear();
  cameraInteractionState.gesture = null;
  cameraInteractionState.dragging = false;
  cameraInteractionState.suppressClickUntil = 0;
  cameraInteractionSetDraggingClass(false);
  if (typeof boardCamera !== "undefined" && boardCamera) {
    boardCamera.mode = "fit";
    boardCamera.zoom = 1;
    boardCamera.x = 0;
    boardCamera.y = 0;
  }
  if (typeof apkM4Camera !== "undefined" && apkM4Camera) {
    apkM4Camera.mode = "fit";
    apkM4Camera.zoom = 1;
    apkM4Camera.x = 0;
    apkM4Camera.y = 0;
  }
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => cameraResetView({ animate: false }));
  } else {
    cameraResetView({ animate: false });
  }
}

function cameraLockInput(enabled) {
  cameraInteractionState.locked = Boolean(enabled);
  if (cameraInteractionState.locked) {
    cameraInteractionState.pointers.clear();
    cameraInteractionState.gesture = null;
    cameraInteractionState.dragging = false;
    cameraInteractionSetDraggingClass(false);
  }
  cameraInteractionUpdateControls();
  return cameraInteractionState.locked;
}

function cameraGetState() {
  const model = cameraInteractionModel();
  return {
    mobile: cameraInteractionIsMobile(),
    locked: cameraInteractionState.locked,
    mode: model ? model.mode : "fit",
    x: model ? Number(model.x) || 0 : 0,
    y: model ? Number(model.y) || 0 : 0,
    zoom: model ? cameraInteractionRelativeZoom(model) : 1,
    fitScale: model ? cameraInteractionFitScale(model) : 1,
    totalScale: model ? cameraInteractionTotalScale(model) : 1,
    lastInput: cameraInteractionState.lastInput
  };
}

function cameraDiagnostics() {
  const snapshot = cameraGetState();
  return {
    build: typeof buildInfoLabel === "function" ? buildInfoLabel() : "unknown",
    camera: snapshot,
    limits: { minZoom: CAMERA_INTERACTION_MIN_ZOOM, maxZoom: CAMERA_INTERACTION_MAX_ZOOM },
    api: ["cameraFocusHex", "cameraFocusUnit", "cameraFocusHQ", "cameraFitCoords", "cameraFitDeploymentTargets", "cameraSetZoom", "cameraResetView", "cameraLockInput"]
  };
}

function initializeCameraInteraction() {
  if (typeof document === "undefined" || cameraInteractionState.bound) return;
  const surface = cameraInteractionSurface();
  if (!surface) return;
  cameraInteractionState.bound = true;
  surface.dataset.cameraInteractionBound = "1";
  surface.addEventListener("pointerdown", cameraInteractionHandlePointerDown, { passive: false });
  surface.addEventListener("pointermove", cameraInteractionHandlePointerMove, { passive: false });
  surface.addEventListener("pointerup", cameraInteractionFinishPointer, { passive: true });
  surface.addEventListener("pointercancel", cameraInteractionFinishPointer, { passive: true });
  surface.addEventListener("lostpointercapture", cameraInteractionFinishPointer, { passive: true });
  surface.addEventListener("wheel", cameraInteractionHandleWheel, { passive: false });
  surface.addEventListener("click", cameraInteractionHandleClickCapture, true);

  const bindButton = (id, handler) => {
    const button = document.getElementById(id);
    if (!button || button.dataset.cameraBound === "1") return;
    button.dataset.cameraBound = "1";
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      handler();
    });
  };
  bindButton("cameraZoomOutBtn", cameraInteractionZoomOut);
  bindButton("cameraZoomInBtn", cameraInteractionZoomIn);
  bindButton("cameraCenterBtn", cameraInteractionCenterCurrent);
  bindButton("cameraFitBtn", cameraInteractionFit);

  if (typeof window !== "undefined") {
    window.addEventListener("resize", () => cameraInteractionApply({ animate: false }), { passive: true });
    window.addEventListener("orientationchange", () => setTimeout(() => cameraInteractionApply({ animate: false }), 160), { passive: true });
  }
  cameraInteractionUpdateControls();
}

initializeCameraInteraction();
