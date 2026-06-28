"use strict";

// Arena Rubra – F9I1e Stat Value Clearance Microfix.
// Definisce convenzioni stabili per naming asset, coordinate derivate dal Card Composer
// e manifest dinamico carta -> path immagine, così gli asset pesanti possono essere inseriti manualmente.
// In F9I1e restano ID puri e fallback raw-case; le cifre delle stat vengono abbassate ulteriormente per non coprire le label ENE/HP/DEF/ATT.

const CARD_ASSET_BASE_DIR = "assets/cards";
const CARD_ASSET_FACTION_KEYS = Object.freeze({
  Nexus: "nexus",
  Exordium: "exordium",
  Liberti: "liberti",
  Agathoi: "agathoi",
  Fabeot: "fabeot"
});

const CARD_ASSET_KIND_KEYS = Object.freeze({
  unit: "unit",
  tactic: "tactic"
});

const CARD_ASSET_FRAME_PATHS = Object.freeze({
  nexus: {
    unit: `${CARD_ASSET_BASE_DIR}/frames/nexus_unit_frame.png`,
    tactic: `${CARD_ASSET_BASE_DIR}/frames/nexus_tactic_frame.png`,
    back: `${CARD_ASSET_BASE_DIR}/frames/nexus_back.png`
  },
  exordium: {
    unit: `${CARD_ASSET_BASE_DIR}/frames/exordium_unit_frame.png`,
    tactic: `${CARD_ASSET_BASE_DIR}/frames/exordium_tactic_frame.png`,
    back: `${CARD_ASSET_BASE_DIR}/frames/exordium_back.png`
  },
  liberti: {
    unit: `${CARD_ASSET_BASE_DIR}/frames/liberti_unit_frame.png`,
    tactic: `${CARD_ASSET_BASE_DIR}/frames/liberti_tactic_frame.png`,
    back: `${CARD_ASSET_BASE_DIR}/frames/liberti_back.png`
  },
  agathoi: {
    unit: `${CARD_ASSET_BASE_DIR}/frames/agathoi_unit_frame.png`,
    tactic: `${CARD_ASSET_BASE_DIR}/frames/agathoi_tactic_frame.png`,
    back: `${CARD_ASSET_BASE_DIR}/frames/agathoi_back.png`
  },
  fabeot: {
    unit: `${CARD_ASSET_BASE_DIR}/frames/fabeot_unit_frame.png`,
    tactic: `${CARD_ASSET_BASE_DIR}/frames/fabeot_tactic_frame.png`,
    back: `${CARD_ASSET_BASE_DIR}/frames/fabeot_back.png`
  }
});

const CARD_ASSET_PLACEHOLDERS = Object.freeze({
  unit: `${CARD_ASSET_BASE_DIR}/placeholders/missing_art_unit.png`,
  tactic: `${CARD_ASSET_BASE_DIR}/placeholders/missing_art_tactic.png`
});

const CARD_ASSET_ART_EXTENSIONS = Object.freeze(["webp", "jpg", "png"]);

const CARD_COMPOSER_TEMPLATE_GEOMETRY = Object.freeze({
  canvas: { w: 1024, h: 1536 },
  unit: {
    image: { x: 96, y: 184, w: 832, h: 850 },
    imageTransform: { zoom: 1.25, offsetX: 25, offsetY: 145 },
    recommendedArtSize: "800x780 px",
    recommendedHighResArtSize: "1600x1560 px @2x opzionale",
    recommendedColorDepth: "WEBP/JPG consigliato; PNG RGB 24-bit o RGBA 32-bit solo se serve",
    textAreas: {
      name: { x: 146, y: 1090.5, w: 732, h: 48, maxFontSize: 46, minFontSize: 30, weight: "700" },
      type: { x: 312, y: 1192, w: 400, h: 30, maxFontSize: 25, minFontSize: 18, weight: "700" },
      description: { x: 150, y: 1249, w: 724, h: 218, maxFontSize: 34, minFontSize: 22, weight: "500", titleWeight: "700", lineHeightRatio: 1.16 }
    },
    statText: {
      ene: { cx: 140, labelY: 111, valueY: 180, labelSize: 25, valueSize: 104 },
      hp: { cx: 152, labelY: 925, valueY: 997, labelSize: 25, valueSize: 104 },
      def: { cx: 322, labelY: 954, valueY: 1003, labelSize: 19, valueSize: 70 },
      att: { cx: 861, labelY: 925, valueY: 997, labelSize: 25, valueSize: 104 }
    }
  },
  tactic: {
    image: { x: 96, y: 184, w: 832, h: 700 },
    imageTransform: { zoom: 1.04, offsetX: 0, offsetY: 0 },
    recommendedArtSize: "800x670 px",
    recommendedHighResArtSize: "1600x1340 px @2x opzionale",
    recommendedColorDepth: "WEBP/JPG consigliato; PNG RGB 24-bit o RGBA 32-bit solo se serve",
    textAreas: {
      name: { x: 146, y: 924.5, w: 740, h: 60, maxFontSize: 55, minFontSize: 28, weight: "700" },
      type: { x: 274, y: 1020, w: 495, h: 34, maxFontSize: 28, minFontSize: 16, weight: "700" },
      description: { x: 138, y: 1120, w: 748, h: 300, maxFontSize: 38, minFontSize: 22, weight: "500", titleWeight: "700", lineHeightRatio: 1.16 }
    },
    statText: {
      ene: { cx: 140, labelY: 111, valueY: 180, labelSize: 25, valueSize: 104 }
    }
  }
});

function cardAssetNormalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function cardAssetSafeFileText(value, preserveCase = false) {
  const safe = String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return preserveCase ? safe : safe.toLowerCase();
}

function cardAssetFactionKey(cardOrFaction) {
  const faction = typeof cardOrFaction === "string" ? cardOrFaction : (cardOrFaction && cardOrFaction.faction);
  return CARD_ASSET_FACTION_KEYS[faction] || cardAssetNormalizeText(faction || "neutral") || "neutral";
}

function cardAssetKind(card) {
  return card && card.sourceType === "tactic" ? CARD_ASSET_KIND_KEYS.tactic : CARD_ASSET_KIND_KEYS.unit;
}

function cardAssetSourceStableId(card) {
  if (!card) return "unknown_card";
  return card.sourceId || card.blueprintId || card.tacticId || card.id || card.name || "unknown_card";
}

function cardAssetFileId(card) {
  return cardAssetSafeFileText(cardAssetSourceStableId(card), false) || "unknown_card";
}

function cardAssetRawFileId(card) {
  return cardAssetSafeFileText(cardAssetSourceStableId(card), true) || "unknown_card";
}

function cardAssetSlug(card) {
  return cardAssetFileId(card);
}

function cardAssetArtBasePathFor(card, fileId = null) {
  const factionKey = cardAssetFactionKey(card);
  const kind = cardAssetKind(card);
  const folder = kind === CARD_ASSET_KIND_KEYS.tactic ? "tactics" : "units";
  const id = fileId || cardAssetSlug(card);
  return `${CARD_ASSET_BASE_DIR}/art/${factionKey}/${folder}/${id}`;
}

function cardAssetArtPathFor(card, extension = "webp", fileId = null) {
  const ext = cardAssetNormalizeText(extension || "webp") || "webp";
  return `${cardAssetArtBasePathFor(card, fileId)}.${ext}`;
}

function cardAssetArtCandidatePathsFor(card) {
  const ids = [];
  const lowerId = cardAssetFileId(card);
  const rawId = cardAssetRawFileId(card);
  [lowerId, rawId].forEach(id => {
    if (id && !ids.includes(id)) ids.push(id);
  });
  const paths = [];
  for (const ext of CARD_ASSET_ART_EXTENSIONS) {
    for (const id of ids) paths.push(cardAssetArtPathFor(card, ext, id));
  }
  return paths;
}

function cardAssetFramePathFor(card) {
  const factionKey = cardAssetFactionKey(card);
  const kind = cardAssetKind(card);
  const frames = CARD_ASSET_FRAME_PATHS[factionKey] || {};
  return frames[kind] || "";
}

function cardAssetBackPathFor(faction) {
  const factionKey = cardAssetFactionKey(faction);
  const frames = CARD_ASSET_FRAME_PATHS[factionKey] || {};
  return frames.back || "";
}

function cardAssetEntryFor(card) {
  const kind = cardAssetKind(card);
  const factionKey = cardAssetFactionKey(card);
  return {
    id: card && card.id || "",
    blueprintId: card && card.blueprintId || "",
    name: card && card.name || "",
    faction: card && card.faction || "",
    factionKey,
    kind,
    role: card && (card.deckRole || card.cardType || "") || "",
    framePath: cardAssetFramePathFor(card),
    backPath: cardAssetBackPathFor(card && card.faction),
    fileId: cardAssetFileId(card),
    rawFileId: cardAssetRawFileId(card),
    artPath: cardAssetArtPathFor(card),
    artCandidatePaths: cardAssetArtCandidatePathsFor(card),
    placeholderPath: CARD_ASSET_PLACEHOLDERS[kind] || "",
    recommendedArtSize: CARD_COMPOSER_TEMPLATE_GEOMETRY[kind] ? CARD_COMPOSER_TEMPLATE_GEOMETRY[kind].recommendedArtSize : "",
    recommendedHighResArtSize: CARD_COMPOSER_TEMPLATE_GEOMETRY[kind] ? CARD_COMPOSER_TEMPLATE_GEOMETRY[kind].recommendedHighResArtSize : "",
    recommendedColorDepth: CARD_COMPOSER_TEMPLATE_GEOMETRY[kind] ? CARD_COMPOSER_TEMPLATE_GEOMETRY[kind].recommendedColorDepth : "",
    status: "expected"
  };
}

function buildCardAssetManifest(catalog = null) {
  const sourceCatalog = Array.isArray(catalog)
    ? catalog
    : (typeof buildCardCatalog === "function" ? buildCardCatalog() : []);
  const entries = sourceCatalog.map(cardAssetEntryFor).sort((a, b) => {
    const f = String(a.faction).localeCompare(String(b.faction));
    if (f) return f;
    const k = String(a.kind).localeCompare(String(b.kind));
    if (k) return k;
    return String(a.name).localeCompare(String(b.name));
  });
  return {
    schemaVersion: "F9I1e-card-assets-6",
    generatedAt: new Date().toISOString(),
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    baseDir: CARD_ASSET_BASE_DIR,
    policy: "Frame/retro leggeri nel progetto; illustrazioni pesanti inserite manualmente secondo artCandidatePaths; naming consigliato lower-case basato su sourceId/blueprintId/tacticId; renderer prova anche raw-case per tollerare file tipo NXTAC02.jpg.",
    filenameConvention: "assets/cards/art/<factionKey>/<units|tactics>/<sourceId_lowercase>.<webp|jpg|png>; fallback accettato: <sourceId_rawcase>.<webp|jpg|png>",
    preferredExtensions: CARD_ASSET_ART_EXTENSIONS,
    frames: CARD_ASSET_FRAME_PATHS,
    placeholders: CARD_ASSET_PLACEHOLDERS,
    geometry: CARD_COMPOSER_TEMPLATE_GEOMETRY,
    counts: {
      total: entries.length,
      unit: entries.filter(e => e.kind === "unit").length,
      tactic: entries.filter(e => e.kind === "tactic").length
    },
    entries
  };
}

function cardAssetManifestJson() {
  return JSON.stringify(buildCardAssetManifest(), null, 2);
}

function copyCardAssetManifestJson() {
  const text = cardAssetManifestJson();
  if (typeof arenaStorageCopyText === "function") return arenaStorageCopyText(text, "Manifest asset carte copiato negli appunti.");
  if (typeof f9fCopyText === "function") return f9fCopyText(text, "Manifest asset carte copiato negli appunti.");
  if (typeof prompt === "function") prompt("Copia manualmente il manifest asset:", text);
  return text;
}

function cardAssetDirectoryTreeText() {
  return [
    "assets/cards/",
    "  frames/",
    "    nexus_unit_frame.png",
    "    nexus_tactic_frame.png",
    "    nexus_back.png",
    "    exordium_unit_frame.png",
    "    exordium_tactic_frame.png",
    "    exordium_back.png",
    "    liberti_unit_frame.png",
    "    liberti_tactic_frame.png",
    "    liberti_back.png",
    "    agathoi_unit_frame.png",
    "    agathoi_tactic_frame.png",
    "    agathoi_back.png",
    "    fabeot_unit_frame.png",
    "    fabeot_tactic_frame.png",
    "    fabeot_back.png",
    "  art/",
    "    nexus/units/*.<webp|jpg|png>",
    "    nexus/tactics/*.<webp|jpg|png>",
    "    exordium/units/*.<webp|jpg|png>",
    "    exordium/tactics/*.<webp|jpg|png>",
    "    liberti/units/*.<webp|jpg|png>",
    "    liberti/tactics/*.<webp|jpg|png>",
    "    agathoi/units/*.<webp|jpg|png>",
    "    agathoi/tactics/*.<webp|jpg|png>",
    "    fabeot/units/*.<webp|jpg|png>",
    "    fabeot/tactics/*.<webp|jpg|png>",
    "  placeholders/",
    "    missing_art_unit.png",
    "    missing_art_tactic.png"
  ].join("\n");
}
