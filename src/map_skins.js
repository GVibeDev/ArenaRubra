"use strict";

// Arena Rubra – F9M2e Visual Asset Population Pass.
// Registry visual-only: skin mappa con slot background ufficiali + tema UI leggero.
// Se gli asset non esistono, il fallback CSS resta operativo.
// Non modifica celle, coordinate, terrain, PS/QG, gameplay, AI o regole.

const MAP_SKIN_STORAGE_KEY = "arenaRubra.mapSkin.v1";

const MAP_SKIN_DEFAULT_KEY = "red_dust";
const MAP_BACKGROUND_ASSET_ROOT = "assets/maps/backgrounds/";
const MAP_BACKGROUND_ASSET_FALLBACK_ROOTS = Object.freeze([
  "assets/maps/backgrounds/",
  "./assets/maps/backgrounds/",
  "../assets/maps/backgrounds/"
]);

function mapSkinAssetUrl(filename, root = MAP_BACKGROUND_ASSET_ROOT) {
  return `${root}${filename}`;
}

function mapSkinAssetCandidates(filename) {
  const clean = String(filename || "").split(/[\\/]/).pop();
  if (!clean) return [];
  const seen = new Set();
  const out = [];
  for (const root of MAP_BACKGROUND_ASSET_FALLBACK_ROOTS) {
    const url = mapSkinAssetUrl(clean, root);
    if (!seen.has(url)) { seen.add(url); out.push(url); }
  }
  return out;
}

function mapSkinAssetFilename(skin) {
  const src = skin && skin.asset && skin.asset.backgroundImage ? String(skin.asset.backgroundImage) : "";
  return src.split(/[\\/]/).pop();
}

function mapSkinAssetLayer(filename) {
  return `url("${mapSkinAssetUrl(filename)}")`;
}

function mapSkinArtLayer(filename, fallbackGradient) {
  // F9M2b: lo slot asset reale viene caricato anche come <img> dedicata.
  // La CSS var resta per preview/export, ma il layer visibile usa un tag img robusto.
  return fallbackGradient;
}

function mapSkinEnsureAssetImage() {
  if (typeof document === "undefined") return null;
  const layer = document.getElementById("mapBgLayer");
  if (!layer) return null;
  let img = document.getElementById("mapBgAssetImage");
  if (!img) {
    img = document.createElement("img");
    img.id = "mapBgAssetImage";
    img.className = "mapBgAssetImage";
    img.alt = "";
    img.decoding = "async";
    img.loading = "eager";
    img.draggable = false;
    img.setAttribute("aria-hidden", "true");
    layer.prepend(img);
  }
  return img;
}

function mapSkinSetAssetStatus(status, src, skin=null) {
  if (typeof document === "undefined" || !document.documentElement) return;
  const root = document.documentElement;
  const stack = document.getElementById("boardVisualStack");
  root.dataset.mapBgAssetStatus = status;
  if (src) root.dataset.mapBgAsset = src;
  if (stack) {
    stack.dataset.mapSkinAssetStatus = status;
    if (skin) stack.dataset.mapSkin = skin.key || "";
    if (src && status === "loaded") stack.dataset.mapSkinAssetLoaded = src;
    if (src && status === "missing") stack.dataset.mapSkinAssetMissing = src;
    if (src && status === "checking") stack.dataset.mapSkinAssetChecking = src;
  }
}

function mapSkinProbeAsset(skin) {
  if (typeof document === "undefined" || !skin || !skin.asset || !skin.asset.backgroundImage) return;
  const root = document.documentElement;
  const filename = mapSkinAssetFilename(skin);
  const candidates = mapSkinAssetCandidates(filename);
  const img = mapSkinEnsureAssetImage();
  if (!img || !candidates.length) return;

  const stack = document.getElementById("boardVisualStack");
  if (stack) {
    stack.dataset.mapSkinAssetCandidates = candidates.join(" | ");
    stack.dataset.mapSkinAsset = skin.asset.backgroundImage;
  }

  img.classList.remove("loaded", "missing");
  img.removeAttribute("src");
  img.hidden = true;
  root.style.setProperty("--map-bg-image", "none");

  let index = 0;
  const tryNext = () => {
    const src = candidates[index];
    if (!src) {
      img.hidden = true;
      img.classList.add("missing");
      mapSkinSetAssetStatus("missing", candidates[0] || skin.asset.backgroundImage, skin);
      return;
    }
    mapSkinSetAssetStatus("checking", src, skin);
    img.onload = () => {
      img.hidden = false;
      img.classList.add("loaded");
      img.classList.remove("missing");
      root.style.setProperty("--map-bg-image", `url("${src}")`);
      mapSkinSetAssetStatus("loaded", src, skin);
    };
    img.onerror = () => {
      index += 1;
      tryNext();
    };
    img.src = src;
  };

  tryNext();
}

const MAP_SKIN_PRESETS = Object.freeze([
  {
    key: "arena_default",
    label: "Arena Rubra · Default",
    shortLabel: "Default",
    description: "Fondale ufficiale caldo/ferroso. Usa asset se presente, altrimenti fallback procedurale.",
    asset: { backgroundImage: mapSkinAssetUrl("arena_rubra_default.webp") },
    css: {
      "--map-bg-image": mapSkinAssetLayer("arena_rubra_default.webp"),
      "--map-bg-art": mapSkinArtLayer("arena_rubra_default.webp", "radial-gradient(circle at 50% 46%, rgba(194, 76, 46, .20), rgba(214, 179, 90, .08) 22%, rgba(21, 27, 38, .44) 53%, rgba(5, 7, 12, .92) 100%)"),
      "--map-bg-grid": "linear-gradient(30deg, rgba(255,255,255,.035) 0 1px, transparent 1px 42px), linear-gradient(150deg, rgba(255,255,255,.026) 0 1px, transparent 1px 42px)",
      "--map-bg-tint": "linear-gradient(180deg, rgba(23,29,41,.78), rgba(9,11,17,.92))",
      "--map-bg-position": "center center",
      "--map-bg-size": "cover, cover"
    },
    ui: {
      "--skin-accent": "#d6b35a",
      "--skin-panel-bg": "linear-gradient(180deg, rgba(44,31,28,.92), rgba(20,22,30,.96))",
      "--skin-panel-border": "rgba(214,179,90,.24)",
      "--skin-button-bg": "linear-gradient(180deg, rgba(58,46,43,.92), rgba(31,34,45,.96))",
      "--skin-hand-bg": "linear-gradient(180deg, rgba(45,32,31,.78), rgba(16,18,25,.94))"
    }
  },
  {
    key: "basalt_night",
    label: "Basalto notturno",
    shortLabel: "Basalto",
    description: "Skin scura/fredda per far risaltare token e highlight.",
    asset: { backgroundImage: mapSkinAssetUrl("basalt_night.webp") },
    css: {
      "--map-bg-image": mapSkinAssetLayer("basalt_night.webp"),
      "--map-bg-art": mapSkinArtLayer("basalt_night.webp", "radial-gradient(circle at 50% 46%, rgba(85, 115, 156, .22), rgba(31, 40, 55, .42) 38%, rgba(5, 7, 12, .94) 100%)"),
      "--map-bg-grid": "linear-gradient(30deg, rgba(151,190,255,.045) 0 1px, transparent 1px 42px), linear-gradient(150deg, rgba(151,190,255,.030) 0 1px, transparent 1px 42px)",
      "--map-bg-tint": "linear-gradient(180deg, rgba(16,23,36,.82), rgba(5,7,12,.96))",
      "--map-bg-position": "center center",
      "--map-bg-size": "cover, cover"
    },
    ui: {
      "--skin-accent": "#84b9ff",
      "--skin-panel-bg": "linear-gradient(180deg, rgba(19,27,42,.92), rgba(7,9,15,.96))",
      "--skin-panel-border": "rgba(132,185,255,.22)",
      "--skin-button-bg": "linear-gradient(180deg, rgba(31,42,62,.94), rgba(17,22,34,.98))",
      "--skin-hand-bg": "linear-gradient(180deg, rgba(17,25,39,.84), rgba(7,9,14,.96))"
    }
  },
  {
    key: "red_dust",
    label: "Polvere rossa",
    shortLabel: "Polvere",
    description: "Variante sabbia/ossido, utile per testare leggibilità su fondo caldo.",
    asset: { backgroundImage: mapSkinAssetUrl("red_dust.webp") },
    css: {
      "--map-bg-image": mapSkinAssetLayer("red_dust.webp"),
      "--map-bg-art": mapSkinArtLayer("red_dust.webp", "radial-gradient(circle at 48% 45%, rgba(223, 148, 70, .25), rgba(151, 68, 46, .34) 34%, rgba(44, 30, 27, .76) 73%, rgba(8, 7, 9, .96) 100%)"),
      "--map-bg-grid": "linear-gradient(30deg, rgba(255,231,172,.050) 0 1px, transparent 1px 42px), linear-gradient(150deg, rgba(255,231,172,.032) 0 1px, transparent 1px 42px)",
      "--map-bg-tint": "linear-gradient(180deg, rgba(38,24,20,.78), rgba(9,7,8,.95))",
      "--map-bg-position": "center center",
      "--map-bg-size": "cover, cover"
    },
    ui: {
      "--skin-accent": "#df9446",
      "--skin-panel-bg": "linear-gradient(180deg, rgba(50,30,23,.92), rgba(17,12,13,.96))",
      "--skin-panel-border": "rgba(223,148,70,.24)",
      "--skin-button-bg": "linear-gradient(180deg, rgba(67,38,27,.94), rgba(30,18,17,.98))",
      "--skin-hand-bg": "linear-gradient(180deg, rgba(51,30,24,.84), rgba(12,9,10,.96))"
    }
  },
  {
    key: "overgrowth_ruins",
    label: "Rovine vegetali",
    shortLabel: "Rovine verdi",
    description: "Variante verde/scura per stressare PS, QG e token Agathoi.",
    asset: { backgroundImage: mapSkinAssetUrl("overgrowth_ruins.webp") },
    css: {
      "--map-bg-image": mapSkinAssetLayer("overgrowth_ruins.webp"),
      "--map-bg-art": mapSkinArtLayer("overgrowth_ruins.webp", "radial-gradient(circle at 52% 46%, rgba(91, 144, 76, .24), rgba(36, 71, 55, .40) 37%, rgba(14, 24, 24, .82) 73%, rgba(4, 6, 7, .96) 100%)"),
      "--map-bg-grid": "linear-gradient(30deg, rgba(190,255,197,.040) 0 1px, transparent 1px 42px), linear-gradient(150deg, rgba(190,255,197,.026) 0 1px, transparent 1px 42px)",
      "--map-bg-tint": "linear-gradient(180deg, rgba(16,30,26,.80), rgba(5,8,6,.96))",
      "--map-bg-position": "center center",
      "--map-bg-size": "cover, cover"
    },
    ui: {
      "--skin-accent": "#8fe09a",
      "--skin-panel-bg": "linear-gradient(180deg, rgba(19,38,31,.92), rgba(7,12,10,.96))",
      "--skin-panel-border": "rgba(143,224,154,.22)",
      "--skin-button-bg": "linear-gradient(180deg, rgba(31,54,43,.94), rgba(13,22,18,.98))",
      "--skin-hand-bg": "linear-gradient(180deg, rgba(20,39,32,.84), rgba(6,10,8,.96))"
    }
  },
  {
    key: "exordium_battlegrounds",
    label: "Campi di battaglia imperiali",
    shortLabel: "Battlegrounds",
    description: "Tema Exordium: rosso scuro, metallo annerito e highlight aurei.",
    asset: { backgroundImage: mapSkinAssetUrl("battlegrounds.webp") },
    css: {
      "--map-bg-image": mapSkinAssetLayer("battlegrounds.webp"),
      "--map-bg-art": mapSkinArtLayer("battlegrounds.webp", "radial-gradient(circle at 50% 45%, rgba(164, 36, 29, .30), rgba(71, 15, 17, .48) 39%, rgba(25, 7, 10, .84) 74%, rgba(5, 3, 5, .98) 100%)"),
      "--map-bg-grid": "linear-gradient(30deg, rgba(255,219,105,.042) 0 1px, transparent 1px 42px), linear-gradient(150deg, rgba(255,219,105,.026) 0 1px, transparent 1px 42px)",
      "--map-bg-tint": "linear-gradient(180deg, rgba(45,8,11,.72), rgba(8,3,5,.95))",
      "--map-bg-position": "center center",
      "--map-bg-size": "cover, cover"
    },
    ui: {
      "--skin-accent": "#d8b33e",
      "--skin-panel-bg": "linear-gradient(180deg, rgba(59,14,16,.94), rgba(20,7,9,.98))",
      "--skin-panel-border": "rgba(216,179,62,.27)",
      "--skin-button-bg": "linear-gradient(180deg, rgba(82,22,22,.95), rgba(34,10,12,.99))",
      "--skin-hand-bg": "linear-gradient(180deg, rgba(63,16,18,.86), rgba(18,6,8,.97))"
    }
  },
  {
    key: "fabeot_velvet_hoods",
    label: "Cappucci di velluto",
    shortLabel: "Velvet Hoods",
    description: "Tema Fabeot: viola profondo, ombre prugna e highlight giallo pallido.",
    asset: { backgroundImage: mapSkinAssetUrl("velvet_hoods.webp") },
    css: {
      "--map-bg-image": mapSkinAssetLayer("velvet_hoods.webp"),
      "--map-bg-art": mapSkinArtLayer("velvet_hoods.webp", "radial-gradient(circle at 50% 45%, rgba(116, 57, 135, .28), rgba(50, 24, 65, .48) 40%, rgba(18, 9, 25, .86) 75%, rgba(4, 3, 6, .98) 100%)"),
      "--map-bg-grid": "linear-gradient(30deg, rgba(240,228,153,.038) 0 1px, transparent 1px 42px), linear-gradient(150deg, rgba(240,228,153,.024) 0 1px, transparent 1px 42px)",
      "--map-bg-tint": "linear-gradient(180deg, rgba(34,16,44,.74), rgba(7,4,10,.96))",
      "--map-bg-position": "center center",
      "--map-bg-size": "cover, cover"
    },
    ui: {
      "--skin-accent": "#e2d58b",
      "--skin-panel-bg": "linear-gradient(180deg, rgba(50,24,65,.94), rgba(17,9,23,.98))",
      "--skin-panel-border": "rgba(226,213,139,.24)",
      "--skin-button-bg": "linear-gradient(180deg, rgba(70,35,88,.95), rgba(27,14,36,.99))",
      "--skin-hand-bg": "linear-gradient(180deg, rgba(53,27,68,.86), rgba(15,8,21,.97))"
    }
  },
  {
    key: "tactical_blueprint",
    label: "Blueprint tattico",
    shortLabel: "Blueprint",
    description: "Fondale tecnico/griglia, molto neutro per debug visuale.",
    asset: { backgroundImage: mapSkinAssetUrl("tactical_blueprint.webp") },
    css: {
      "--map-bg-image": mapSkinAssetLayer("tactical_blueprint.webp"),
      "--map-bg-art": mapSkinArtLayer("tactical_blueprint.webp", "radial-gradient(circle at 50% 50%, rgba(68, 116, 184, .18), rgba(16, 35, 63, .52) 45%, rgba(4, 8, 15, .96) 100%)"),
      "--map-bg-grid": "linear-gradient(30deg, rgba(125,205,255,.070) 0 1px, transparent 1px 36px), linear-gradient(150deg, rgba(125,205,255,.045) 0 1px, transparent 1px 36px), linear-gradient(90deg, rgba(125,205,255,.018) 0 1px, transparent 1px 18px)",
      "--map-bg-tint": "linear-gradient(180deg, rgba(8,19,35,.82), rgba(3,6,11,.96))",
      "--map-bg-position": "center center",
      "--map-bg-size": "cover, cover"
    },
    ui: {
      "--skin-accent": "#7dcdff",
      "--skin-panel-bg": "linear-gradient(180deg, rgba(10,27,48,.92), rgba(4,8,15,.97))",
      "--skin-panel-border": "rgba(125,205,255,.24)",
      "--skin-button-bg": "linear-gradient(180deg, rgba(16,42,71,.94), rgba(6,15,28,.98))",
      "--skin-hand-bg": "linear-gradient(180deg, rgba(8,27,50,.84), rgba(3,8,15,.96))"
    }
  }
]);

function mapSkinPresets() {
  return MAP_SKIN_PRESETS.slice();
}

function mapSkinByKey(key) {
  const wanted = String(key || "");
  return MAP_SKIN_PRESETS.find(skin => skin.key === wanted) || MAP_SKIN_PRESETS.find(skin => skin.key === MAP_SKIN_DEFAULT_KEY) || MAP_SKIN_PRESETS[0];
}

function mapSkinReadJson(key, fallback) {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

function mapSkinWriteJson(key, value) {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(key, JSON.stringify(value, null, 2));
    return true;
  } catch (err) {
    console.warn("Map Skin Slot: salvataggio localStorage fallito", err);
    return false;
  }
}

function mapSkinLoadKey() {
  const store = mapSkinReadJson(MAP_SKIN_STORAGE_KEY, null);
  if (!store || store.schema !== "arena-rubra-map-skin-v1") return MAP_SKIN_DEFAULT_KEY;
  return mapSkinByKey(store.key).key;
}

function mapSkinSaveKey(key) {
  const skin = mapSkinByKey(key);
  return mapSkinWriteJson(MAP_SKIN_STORAGE_KEY, {
    schema: "arena-rubra-map-skin-v1",
    key: skin.key,
    label: skin.label,
    asset: skin.asset || {},
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    updatedAt: new Date().toISOString()
  });
}

function mapSkinApplyCssObject(root, cssObject) {
  for (const [prop, value] of Object.entries(cssObject || {})) root.style.setProperty(prop, value);
}

function mapSkinApply(key, options = {}) {
  if (typeof document === "undefined" || !document.documentElement) return null;
  const skin = mapSkinByKey(key);
  const root = document.documentElement;
  mapSkinApplyCssObject(root, skin.css || {});
  mapSkinApplyCssObject(root, skin.ui || {});
  root.dataset.mapSkin = skin.key;
  const stack = document.getElementById("boardVisualStack");
  if (stack) {
    stack.dataset.mapSkin = skin.key;
    stack.dataset.mapSkinLabel = skin.label || skin.key;
    if (skin.asset && skin.asset.backgroundImage) stack.dataset.mapSkinAsset = skin.asset.backgroundImage;
  }
  mapSkinProbeAsset(skin);
  if (options.save) mapSkinSaveKey(skin.key);
  return skin;
}

function mapSkinApplySaved() {
  return mapSkinApply(mapSkinLoadKey());
}

function mapSkinCssExport(key) {
  const skin = mapSkinByKey(key);
  const lines = [
    `/* Arena Rubra F9M2 – Visual skin: ${skin.label || skin.key} */`,
    skin.asset && skin.asset.backgroundImage ? `/* Background asset previsto: ${skin.asset.backgroundImage} */` : "",
    ":root {"
  ].filter(Boolean);
  for (const [prop, value] of Object.entries(skin.css || {})) lines.push(`  ${prop}: ${value};`);
  for (const [prop, value] of Object.entries(skin.ui || {})) lines.push(`  ${prop}: ${value};`);
  lines.push("}");
  return lines.join("\n");
}

function mapSkinExportMeta(key) {
  const skin = mapSkinByKey(key);
  return {
    schema: "arena-rubra-map-skin-v2b",
    key: skin.key,
    label: skin.label,
    shortLabel: skin.shortLabel || skin.label,
    description: skin.description || "",
    asset: { ...(skin.asset || {}) },
    css: { ...(skin.css || {}) },
    ui: { ...(skin.ui || {}) }
  };
}

try {
  mapSkinApplySaved();
} catch (err) {
  console.warn("Map Skin Slot: bootstrap non riuscito", err);
}
