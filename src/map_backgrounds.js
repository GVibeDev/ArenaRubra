"use strict";

// Arena Rubra – F9Q3c Custom Map Backgrounds.
// Gestisce immagini custom come asset locali separati dalla definizione JSON,
// con fallback inline per backend senza supporto blob e pacchetto JSON portatile.

const MAP_BACKGROUND_MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAP_BACKGROUND_MAX_PORTABLE_JSON_BYTES = 20 * 1024 * 1024;
const MAP_BACKGROUND_FALLBACK_INLINE_BYTES = 2 * 1024 * 1024;
const MAP_BACKGROUND_ALLOWED_MIME = Object.freeze(["image/png", "image/jpeg", "image/webp"]);

const mapBackgroundRuntime = {
  requestToken: 0,
  objectUrl: "",
  sourcePath: "",
  editorUrls: new Set()
};

function mapBackgroundSafePresentation(raw) {
  const presentation = raw && typeof raw === "object" ? raw : {};
  const fit = ["cover", "contain", "native"].includes(presentation.backgroundFit)
    ? presentation.backgroundFit
    : "cover";
  return {
    backgroundAssetId: presentation.backgroundAssetId || null,
    backgroundAssetPath: presentation.backgroundAssetPath || null,
    backgroundName: presentation.backgroundName || null,
    backgroundMime: MAP_BACKGROUND_ALLOWED_MIME.includes(String(presentation.backgroundMime || "").toLowerCase())
      ? String(presentation.backgroundMime).toLowerCase()
      : null,
    backgroundWidth: Math.max(0, Math.trunc(Number(presentation.backgroundWidth) || 0)),
    backgroundHeight: Math.max(0, Math.trunc(Number(presentation.backgroundHeight) || 0)),
    backgroundFit: fit,
    backgroundOpacity: Math.max(0, Math.min(1, Number.isFinite(Number(presentation.backgroundOpacity)) ? Number(presentation.backgroundOpacity) : 0.9)),
    backgroundScale: Math.max(0.25, Math.min(4, Number.isFinite(Number(presentation.backgroundScale)) ? Number(presentation.backgroundScale) : 1)),
    backgroundOffsetX: Math.max(-100, Math.min(100, Number.isFinite(Number(presentation.backgroundOffsetX)) ? Number(presentation.backgroundOffsetX) : 0)),
    backgroundOffsetY: Math.max(-100, Math.min(100, Number.isFinite(Number(presentation.backgroundOffsetY)) ? Number(presentation.backgroundOffsetY) : 0)),
    backgroundInlineDataUrl: typeof presentation.backgroundInlineDataUrl === "string" && presentation.backgroundInlineDataUrl.startsWith("data:image/")
      ? presentation.backgroundInlineDataUrl
      : null
  };
}

function mapBackgroundHasAsset(rawPresentation) {
  const presentation = mapBackgroundSafePresentation(rawPresentation);
  return Boolean(presentation.backgroundAssetPath || presentation.backgroundInlineDataUrl);
}

function mapBackgroundExtension(mime) {
  const normalized = String(mime || "").toLowerCase();
  if (normalized === "image/png") return "png";
  if (normalized === "image/jpeg") return "jpg";
  return "webp";
}

function mapBackgroundSafeAssetId(mapId, filename = "background") {
  const base = typeof mapRuntimeSafeId === "function"
    ? mapRuntimeSafeId(`${mapId || "custom-map"}-${filename}`, "map-background")
    : String(`${mapId || "custom-map"}-${filename}`).toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  return `map-bg-${base}-${Date.now().toString(36)}`.slice(0, 120);
}

function mapBackgroundAssetPath(assetId, mime) {
  const safeId = typeof arenaDataSafePart === "function"
    ? arenaDataSafePart(assetId, "map-background")
    : String(assetId || "map-background").replace(/[^a-z0-9._-]+/gi, "-");
  return `maps/backgrounds/${safeId}.${mapBackgroundExtension(mime)}`;
}

async function mapBackgroundReadDimensions(blob) {
  if (!blob) return { width: 0, height: 0 };
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob);
      const out = { width: Number(bitmap.width) || 0, height: Number(bitmap.height) || 0 };
      if (typeof bitmap.close === "function") bitmap.close();
      return out;
    } catch (_) {}
  }
  if (typeof document !== "undefined" && typeof URL !== "undefined" && typeof Image === "function") {
    const url = URL.createObjectURL(blob);
    try {
      const dimensions = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: Number(image.naturalWidth) || 0, height: Number(image.naturalHeight) || 0 });
        image.onerror = () => reject(new Error("Immagine non leggibile"));
        image.src = url;
      });
      return dimensions;
    } catch (_) {
      return { width: 0, height: 0 };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return { width: 0, height: 0 };
}

async function mapBackgroundFileToPresentation(file, mapId, previousPresentation = null) {
  if (!file || typeof file !== "object") return { ok: false, issues: ["Nessun file selezionato."] };
  const mime = String(file.type || "").toLowerCase();
  if (!MAP_BACKGROUND_ALLOWED_MIME.includes(mime)) {
    return { ok: false, issues: ["Formato non supportato. Usa PNG, JPEG o WebP."] };
  }
  const size = Number(file.size) || 0;
  if (size <= 0 || size > MAP_BACKGROUND_MAX_FILE_BYTES) {
    return { ok: false, issues: [`Lo sfondo deve pesare al massimo ${Math.round(MAP_BACKGROUND_MAX_FILE_BYTES / 1024 / 1024)} MiB.`] };
  }

  const previousAssetPath = previousPresentation && previousPresentation.backgroundAssetPath
    ? String(previousPresentation.backgroundAssetPath)
    : null;

  const assetId = mapBackgroundSafeAssetId(mapId, file.name || "background");
  const assetPath = mapBackgroundAssetPath(assetId, mime);
  const dimensions = await mapBackgroundReadDimensions(file);
  const base = mapBackgroundSafePresentation(previousPresentation);
  const output = {
    ...base,
    backgroundAssetId: assetId,
    backgroundAssetPath: assetPath,
    backgroundName: String(file.name || `${assetId}.${mapBackgroundExtension(mime)}`).slice(0, 120),
    backgroundMime: mime,
    backgroundWidth: dimensions.width,
    backgroundHeight: dimensions.height,
    backgroundInlineDataUrl: null
  };

  let storedAsBlob = false;
  if (typeof ArenaDataStore !== "undefined") {
    try {
      await ArenaDataStore.ready();
      storedAsBlob = await ArenaDataStore.writeBlob(assetPath, file);
    } catch (_) { storedAsBlob = false; }
  }

  if (!storedAsBlob) {
    if (size > MAP_BACKGROUND_FALLBACK_INLINE_BYTES) {
      return {
        ok: false,
        issues: ["Il backend locale corrente non supporta file binari e l'immagine è troppo grande per il fallback inline."]
      };
    }
    output.backgroundAssetPath = null;
    output.backgroundInlineDataUrl = await arenaDataBlobToDataUrl(file);
  }

  if (previousAssetPath && previousAssetPath !== output.backgroundAssetPath && typeof ArenaDataStore !== "undefined") {
    try { await ArenaDataStore.removeBlob(previousAssetPath); } catch (_) {}
  }
  return { ok: true, presentation: output, storageMode: storedAsBlob ? "blob" : "inline" };
}

async function mapBackgroundRemovePresentationAsset(rawPresentation) {
  const presentation = mapBackgroundSafePresentation(rawPresentation);
  if (presentation.backgroundAssetPath && typeof ArenaDataStore !== "undefined") {
    try { await ArenaDataStore.removeBlob(presentation.backgroundAssetPath); } catch (_) {}
  }
  return {
    ...presentation,
    backgroundAssetId: null,
    backgroundAssetPath: null,
    backgroundName: null,
    backgroundMime: null,
    backgroundWidth: 0,
    backgroundHeight: 0,
    backgroundInlineDataUrl: null
  };
}

async function mapBackgroundResolveSource(rawPresentation, options = {}) {
  const presentation = mapBackgroundSafePresentation(rawPresentation);
  if (presentation.backgroundInlineDataUrl) return { ok: true, src: presentation.backgroundInlineDataUrl, revoke: false, mode: "inline" };
  if (presentation.backgroundAssetPath && /^(?:\.\/)?assets\//.test(presentation.backgroundAssetPath)) {
    return { ok: true, src: presentation.backgroundAssetPath.replace(/^\.\//, ""), revoke: false, mode: "static" };
  }
  if (!presentation.backgroundAssetPath || typeof ArenaDataStore === "undefined") return { ok: false, src: "", revoke: false, mode: "missing" };
  try {
    await ArenaDataStore.ready();
    const blob = await ArenaDataStore.readBlob(presentation.backgroundAssetPath);
    if (!blob) return { ok: false, src: "", revoke: false, mode: "missing" };
    if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
      const dataUrl = await arenaDataBlobToDataUrl(blob);
      return { ok: Boolean(dataUrl), src: dataUrl, revoke: false, mode: "data-url" };
    }
    const src = URL.createObjectURL(blob);
    if (options.editor) mapBackgroundRuntime.editorUrls.add(src);
    return { ok: true, src, revoke: true, mode: "blob" };
  } catch (_) {
    return { ok: false, src: "", revoke: false, mode: "error" };
  }
}

function mapBackgroundReleaseRuntimeUrl(options = {}) {
  if (options.invalidate !== false) mapBackgroundRuntime.requestToken += 1;
  if (mapBackgroundRuntime.objectUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    try { URL.revokeObjectURL(mapBackgroundRuntime.objectUrl); } catch (_) {}
  }
  mapBackgroundRuntime.objectUrl = "";
  mapBackgroundRuntime.sourcePath = "";
}

function mapBackgroundReleaseEditorUrl(url) {
  if (!url || !mapBackgroundRuntime.editorUrls.has(url)) return;
  mapBackgroundRuntime.editorUrls.delete(url);
  if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    try { URL.revokeObjectURL(url); } catch (_) {}
  }
}

function mapBackgroundApplyImageStyle(img, rawPresentation) {
  if (!img) return;
  const presentation = mapBackgroundSafePresentation(rawPresentation);
  img.classList.add("customMapBackground");
  img.style.objectFit = presentation.backgroundFit === "native" ? "none" : presentation.backgroundFit;
  img.style.objectPosition = "center center";
  img.style.opacity = String(presentation.backgroundOpacity);
  img.style.transformOrigin = "center center";
  img.style.transform = `translate3d(${presentation.backgroundOffsetX}%, ${presentation.backgroundOffsetY}%, 0) scale(${presentation.backgroundScale})`;
}

async function mapBackgroundApplyForMap(mapDefinition) {
  const presentation = mapDefinition && mapDefinition.presentation ? mapDefinition.presentation : null;
  if (!mapBackgroundHasAsset(presentation) || typeof document === "undefined") return false;
  const token = ++mapBackgroundRuntime.requestToken;
  if (typeof mapSkinCancelAssetProbe === "function") mapSkinCancelAssetProbe();
  const img = typeof mapSkinEnsureAssetImage === "function" ? mapSkinEnsureAssetImage() : document.getElementById("mapBgAssetImage");
  if (!img) return false;
  const resolved = await mapBackgroundResolveSource(presentation);
  if (token !== mapBackgroundRuntime.requestToken) {
    if (resolved.revoke && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
      try { URL.revokeObjectURL(resolved.src); } catch (_) {}
    }
    return false;
  }
  mapBackgroundReleaseRuntimeUrl({ invalidate: false });
  const root = document.documentElement;
  const stack = document.getElementById("boardVisualStack");
  root.dataset.mapBgMode = "custom";
  if (!resolved.ok) {
    img.hidden = true;
    img.removeAttribute("src");
    img.classList.add("missing");
    if (stack) stack.dataset.customMapBackgroundStatus = "missing";
    if (typeof mapSkinSetAssetStatus === "function") mapSkinSetAssetStatus("missing", presentation.backgroundAssetPath || "custom", { key: "custom-map" });
    return false;
  }
  mapBackgroundRuntime.objectUrl = resolved.revoke ? resolved.src : "";
  mapBackgroundRuntime.sourcePath = presentation.backgroundAssetPath || "inline";
  mapBackgroundApplyImageStyle(img, presentation);
  img.onload = () => {
    if (token !== mapBackgroundRuntime.requestToken) return;
    img.hidden = false;
    img.classList.add("loaded", "customMapBackground");
    img.classList.remove("missing");
    if (stack) stack.dataset.customMapBackgroundStatus = "loaded";
    if (typeof mapSkinSetAssetStatus === "function") mapSkinSetAssetStatus("loaded", presentation.backgroundAssetPath || "inline", { key: "custom-map" });
  };
  img.onerror = () => {
    if (token !== mapBackgroundRuntime.requestToken) return;
    img.hidden = true;
    img.classList.add("missing");
    if (stack) stack.dataset.customMapBackgroundStatus = "missing";
    if (typeof mapSkinSetAssetStatus === "function") mapSkinSetAssetStatus("missing", presentation.backgroundAssetPath || "inline", { key: "custom-map" });
  };
  img.hidden = false;
  img.src = resolved.src;
  if (img.complete && img.naturalWidth > 0 && typeof img.onload === "function") img.onload();
  return true;
}

async function exportMapDefinitionPortableJson(rawDefinition) {
  const validation = validateMapDefinition(rawDefinition, { imported: rawDefinition && rawDefinition.official !== true });
  if (!validation.valid) return { ok: false, validation, json: "", issues: validation.errors.map(issue => `${issue.code}: ${issue.message}`) };
  const definition = mapRuntimeClone(validation.definition);
  const presentation = mapBackgroundSafePresentation(definition.presentation);
  let dataUrl = presentation.backgroundInlineDataUrl || "";
  if (!dataUrl && presentation.backgroundAssetPath && typeof ArenaDataStore !== "undefined") {
    try {
      await ArenaDataStore.ready();
      const blob = await ArenaDataStore.readBlob(presentation.backgroundAssetPath);
      if (blob) dataUrl = await arenaDataBlobToDataUrl(blob);
    } catch (_) {}
  }
  if (definition.presentation) delete definition.presentation.backgroundInlineDataUrl;
  const asset = dataUrl ? {
    kind: "map-background",
    assetId: presentation.backgroundAssetId,
    name: presentation.backgroundName,
    mime: presentation.backgroundMime,
    width: presentation.backgroundWidth,
    height: presentation.backgroundHeight,
    dataUrl
  } : null;
  return {
    ok: true,
    validation,
    json: JSON.stringify({
      kind: "arena-rubra-map-package",
      schemaVersion: MAP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      assetMode: asset ? "embedded" : "reference-only",
      map: definition,
      assets: { background: asset }
    }, null, 2),
    hasEmbeddedBackground: Boolean(asset)
  };
}

async function importMapDefinitionPortableJson(text, options = {}) {
  const rawText = String(text || "");
  const rawBytes = typeof TextEncoder === "function" ? new TextEncoder().encode(rawText).byteLength : rawText.length;
  if (rawBytes > MAP_BACKGROUND_MAX_PORTABLE_JSON_BYTES) {
    return { ok: false, issues: ["Pacchetto oltre il limite di 20 MiB."] };
  }
  let parsed;
  try { parsed = JSON.parse(rawText); }
  catch (error) { return { ok: false, issues: [`JSON non valido: ${error.message || error}`] }; }
  if (!parsed || parsed.kind !== "arena-rubra-map-package") return importMapDefinitionJson(rawText, options);
  const imported = importMapDefinitionJson(JSON.stringify({ kind: "arena-rubra-map", map: parsed.map }), { save: false });
  if (!imported.ok) return imported;
  const asset = parsed.assets && parsed.assets.background;
  if (asset && typeof asset.dataUrl === "string") {
    const blob = arenaDataDataUrlToBlob(asset.dataUrl);
    if (!blob || !MAP_BACKGROUND_ALLOWED_MIME.includes(String(blob.type || "").toLowerCase())) {
      return { ok: false, issues: ["Sfondo incorporato non valido."], definition: imported.definition };
    }
    if (blob.size > MAP_BACKGROUND_MAX_FILE_BYTES) {
      return { ok: false, issues: ["Sfondo incorporato oltre il limite di 12 MiB."], definition: imported.definition };
    }
    const assetId = mapBackgroundSafeAssetId(imported.definition.id, asset.name || "background");
    const assetPath = mapBackgroundAssetPath(assetId, blob.type);
    let stored = false;
    if (typeof ArenaDataStore !== "undefined") {
      try {
        await ArenaDataStore.ready();
        stored = await ArenaDataStore.writeBlob(assetPath, blob);
      } catch (_) { stored = false; }
    }
    if (!stored && blob.size > MAP_BACKGROUND_FALLBACK_INLINE_BYTES) {
      return {
        ok: false,
        issues: ["Il backend locale corrente non supporta file binari e lo sfondo incorporato è troppo grande per il fallback inline."],
        definition: imported.definition
      };
    }
    imported.definition.presentation = {
      ...imported.definition.presentation,
      backgroundAssetId: assetId,
      backgroundAssetPath: stored ? assetPath : null,
      backgroundName: String(asset.name || `background.${mapBackgroundExtension(blob.type)}`).slice(0, 120),
      backgroundMime: blob.type,
      backgroundWidth: Math.max(0, Math.trunc(Number(asset.width) || 0)),
      backgroundHeight: Math.max(0, Math.trunc(Number(asset.height) || 0)),
      backgroundInlineDataUrl: stored ? null : asset.dataUrl
    };
    imported.definition = mapRuntimeNormalizeDefinition(imported.definition, { imported: true });
  }
  const validation = validateMapDefinition(imported.definition, { imported: true });
  if (!validation.valid) return { ok: false, issues: validation.errors.map(issue => `${issue.code}: ${issue.message}`), validation, definition: imported.definition };
  if (options.save === false) return { ok: true, definition: imported.definition, validation, conflict: imported.conflict };
  const saved = saveCustomMapDefinition(imported.definition, { overwrite: false });
  return { ...saved, definition: imported.definition, validation, conflict: imported.conflict };
}
