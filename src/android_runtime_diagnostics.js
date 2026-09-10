"use strict";

// F9T2a — diagnostica volatile e a costo limitato per Android/WebView.
// Non persiste dati, non modifica il gameplay e non avvia sonde frame continue.

const ANDROID_RUNTIME_DIAGNOSTICS_SCHEMA_F9T2A = "F9T2a-1";
const ANDROID_RUNTIME_DIAGNOSTICS_SAMPLE_LIMIT_F9T2A = 160;
const ANDROID_RUNTIME_DIAGNOSTICS_LONG_TASK_LIMIT_F9T2A = 32;

const androidRuntimeDiagnosticsStateF9T2a = {
  schemaVersion: ANDROID_RUNTIME_DIAGNOSTICS_SCHEMA_F9T2A,
  startedAt: Date.now(),
  metrics: Object.create(null),
  samples: [],
  longTasks: [],
  observer: null,
  frameProbe: null,
  patched: false
};

function androidRuntimeDiagnosticsNowF9T2a() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function androidRuntimeDiagnosticsSafeDetailF9T2a(detail) {
  if (!detail || typeof detail !== "object") return null;
  const out = {};
  Object.keys(detail).slice(0, 12).forEach(key => {
    const value = detail[key];
    if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    }
  });
  return out;
}

function androidRuntimeDiagnosticsRecordF9T2a(metric, duration = 0, detail = null) {
  const key = String(metric || "unknown");
  const elapsed = Math.max(0, Number(duration) || 0);
  const previous = androidRuntimeDiagnosticsStateF9T2a.metrics[key] || {
    count: 0,
    totalMs: 0,
    maxMs: 0,
    over33Ms: 0,
    over50Ms: 0,
    over100Ms: 0,
    lastMs: 0
  };
  previous.count += 1;
  previous.totalMs += elapsed;
  previous.maxMs = Math.max(previous.maxMs, elapsed);
  previous.lastMs = elapsed;
  if (elapsed > 33) previous.over33Ms += 1;
  if (elapsed > 50) previous.over50Ms += 1;
  if (elapsed > 100) previous.over100Ms += 1;
  androidRuntimeDiagnosticsStateF9T2a.metrics[key] = previous;

  const samples = androidRuntimeDiagnosticsStateF9T2a.samples;
  samples.push({
    metric: key,
    durationMs: Math.round(elapsed * 1000) / 1000,
    atMs: Date.now() - androidRuntimeDiagnosticsStateF9T2a.startedAt,
    detail: androidRuntimeDiagnosticsSafeDetailF9T2a(detail)
  });
  while (samples.length > ANDROID_RUNTIME_DIAGNOSTICS_SAMPLE_LIMIT_F9T2A) samples.shift();
  return previous;
}

function androidRuntimeDiagnosticsMetricSummaryF9T2a() {
  const result = {};
  Object.entries(androidRuntimeDiagnosticsStateF9T2a.metrics).forEach(([key, value]) => {
    result[key] = {
      ...value,
      averageMs: value.count ? Math.round((value.totalMs / value.count) * 1000) / 1000 : 0,
      totalMs: Math.round(value.totalMs * 1000) / 1000,
      maxMs: Math.round(value.maxMs * 1000) / 1000,
      lastMs: Math.round(value.lastMs * 1000) / 1000
    };
  });
  return result;
}

function androidRuntimeDiagnosticsCanvasBytesF9T2a() {
  if (typeof document === "undefined") return { count:0, pixels:0, bytes:0 };
  let pixels = 0;
  const canvases = Array.from(document.querySelectorAll("canvas"));
  canvases.forEach(canvas => {
    pixels += Math.max(0, Number(canvas.width) || 0) * Math.max(0, Number(canvas.height) || 0);
  });
  return { count:canvases.length, pixels, bytes:pixels * 4 };
}

function androidRuntimeDiagnosticsImageBytesF9T2a() {
  if (typeof document === "undefined") return { count:0, loaded:0, decodedEstimateBytes:0 };
  const images = Array.from(document.images || []);
  let loaded = 0;
  let pixels = 0;
  images.forEach(image => {
    if (!image.complete || !image.naturalWidth || !image.naturalHeight) return;
    loaded += 1;
    pixels += image.naturalWidth * image.naturalHeight;
  });
  return { count:images.length, loaded, decodedEstimateBytes:pixels * 4 };
}

function androidRuntimeDiagnosticsSnapshotF9T2a() {
  const canvas = androidRuntimeDiagnosticsCanvasBytesF9T2a();
  const images = androidRuntimeDiagnosticsImageBytesF9T2a();
  const memory = typeof performance !== "undefined" && performance.memory
    ? {
        usedJSHeapSize: Number(performance.memory.usedJSHeapSize) || 0,
        totalJSHeapSize: Number(performance.memory.totalJSHeapSize) || 0,
        jsHeapSizeLimit: Number(performance.memory.jsHeapSizeLimit) || 0
      }
    : null;
  const board = typeof boardRenderDiagnostics === "function" ? boardRenderDiagnostics() : null;
  const handThumbs = typeof cardRendererHandThumbCacheDiagnostics === "function"
    ? cardRendererHandThumbCacheDiagnostics()
    : null;
  const cardImages = typeof cardRendererImageCacheDiagnosticsF9T2a === "function"
    ? cardRendererImageCacheDiagnosticsF9T2a()
    : null;
  const tokenAssets = typeof visualAssetTokenCacheDiagnosticsF9T2a === "function"
    ? visualAssetTokenCacheDiagnosticsF9T2a()
    : null;
  const mapEditor = typeof mapEditorState !== "undefined" && mapEditorState
    ? {
        cells: mapEditorState.draft && mapEditorState.draft.geometry && Array.isArray(mapEditorState.draft.geometry.cells)
          ? mapEditorState.draft.geometry.cells.length
          : 0,
        scale: Number(mapEditorState.view && mapEditorState.view.scale) || 0,
        activePointers: mapEditorState.interaction && mapEditorState.interaction.pointers instanceof Map
          ? mapEditorState.interaction.pointers.size
          : 0,
        renderer: typeof document !== "undefined" && document.getElementById("mapEditorCanvas")
          ? document.getElementById("mapEditorCanvas").dataset.renderer || ""
          : ""
      }
    : null;
  return {
    schemaVersion: ANDROID_RUNTIME_DIAGNOSTICS_SCHEMA_F9T2A,
    capturedAt: new Date().toISOString(),
    uptimeMs: Date.now() - androidRuntimeDiagnosticsStateF9T2a.startedAt,
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    screen: typeof document !== "undefined" && document.body ? document.body.dataset.appScreen || "" : "",
    dom: typeof document !== "undefined"
      ? {
          elements: document.getElementsByTagName("*").length,
          boardCells: document.querySelectorAll("#board .hex").length,
          mapEditorCells: document.querySelectorAll("#mapEditorCanvas [data-map-cell]").length,
          cardPoolCanvases: document.querySelectorAll(".cardPoolGalleryCanvas").length
        }
      : null,
    canvas,
    images,
    memory,
    board,
    handThumbs,
    cardImages,
    tokenAssets,
    mapEditor,
    metrics: androidRuntimeDiagnosticsMetricSummaryF9T2a(),
    longTasks: androidRuntimeDiagnosticsStateF9T2a.longTasks.slice(),
    recentSamples: androidRuntimeDiagnosticsStateF9T2a.samples.slice()
  };
}

function androidRuntimeDiagnosticsResetF9T2a() {
  androidRuntimeDiagnosticsStateF9T2a.startedAt = Date.now();
  androidRuntimeDiagnosticsStateF9T2a.metrics = Object.create(null);
  androidRuntimeDiagnosticsStateF9T2a.samples.length = 0;
  androidRuntimeDiagnosticsStateF9T2a.longTasks.length = 0;
  return true;
}

function androidRuntimeDiagnosticsWrapFunctionF9T2a(name, metric) {
  if (typeof globalThis === "undefined") return false;
  const original = globalThis[name];
  if (typeof original !== "function" || original.androidDiagnosticsF9T2a) return false;
  const wrapped = function androidDiagnosticsWrappedF9T2a() {
    const started = androidRuntimeDiagnosticsNowF9T2a();
    try {
      return original.apply(this, arguments);
    } finally {
      androidRuntimeDiagnosticsRecordF9T2a(metric, androidRuntimeDiagnosticsNowF9T2a() - started);
    }
  };
  Object.keys(original).forEach(key => {
    try { wrapped[key] = original[key]; } catch (_) {}
  });
  wrapped.androidDiagnosticsF9T2a = true;
  wrapped.androidDiagnosticsOriginalF9T2a = original;
  globalThis[name] = wrapped;
  return true;
}

function androidRuntimeDiagnosticsObserveLongTasksF9T2a() {
  if (typeof PerformanceObserver === "undefined") return false;
  try {
    const supported = Array.isArray(PerformanceObserver.supportedEntryTypes)
      ? PerformanceObserver.supportedEntryTypes
      : [];
    if (!supported.includes("longtask")) return false;
    const observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        const item = {
          durationMs: Math.round((Number(entry.duration) || 0) * 1000) / 1000,
          startTimeMs: Math.round((Number(entry.startTime) || 0) * 1000) / 1000
        };
        androidRuntimeDiagnosticsStateF9T2a.longTasks.push(item);
        while (androidRuntimeDiagnosticsStateF9T2a.longTasks.length > ANDROID_RUNTIME_DIAGNOSTICS_LONG_TASK_LIMIT_F9T2A) {
          androidRuntimeDiagnosticsStateF9T2a.longTasks.shift();
        }
        androidRuntimeDiagnosticsRecordF9T2a("long_task", item.durationMs);
      });
    });
    observer.observe({ entryTypes:["longtask"] });
    androidRuntimeDiagnosticsStateF9T2a.observer = observer;
    return true;
  } catch (_) {
    return false;
  }
}

function androidRuntimeDiagnosticsStartFrameProbeF9T2a(durationMs = 10000) {
  if (typeof requestAnimationFrame !== "function") return false;
  const safeDuration = Math.max(1000, Math.min(60000, Number(durationMs) || 10000));
  if (androidRuntimeDiagnosticsStateF9T2a.frameProbe) {
    androidRuntimeDiagnosticsStateF9T2a.frameProbe.cancelled = true;
  }
  const probe = { cancelled:false, startedAt:androidRuntimeDiagnosticsNowF9T2a(), previous:0, frames:0 };
  androidRuntimeDiagnosticsStateF9T2a.frameProbe = probe;
  const step = timestamp => {
    if (probe.cancelled) return;
    if (probe.previous) {
      const delta = timestamp - probe.previous;
      probe.frames += 1;
      androidRuntimeDiagnosticsRecordF9T2a("frame_interval", delta);
    }
    probe.previous = timestamp;
    if (timestamp - probe.startedAt >= safeDuration) {
      androidRuntimeDiagnosticsStateF9T2a.frameProbe = null;
      return;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return true;
}

function androidRuntimeDiagnosticsInstallF9T2a() {
  if (androidRuntimeDiagnosticsStateF9T2a.patched) return false;
  androidRuntimeDiagnosticsStateF9T2a.patched = true;
  androidRuntimeDiagnosticsWrapFunctionF9T2a("renderBoard", "render_board");
  androidRuntimeDiagnosticsWrapFunctionF9T2a("renderAll", "render_all");
  androidRuntimeDiagnosticsObserveLongTasksF9T2a();
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.dataset.androidDiagnostics = ANDROID_RUNTIME_DIAGNOSTICS_SCHEMA_F9T2A;
  }
  return true;
}

androidRuntimeDiagnosticsInstallF9T2a();
