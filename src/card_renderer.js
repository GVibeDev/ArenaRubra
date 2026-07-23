
"use strict";

// Arena Rubra – F9K2d Renderer Calibration Commit / Coordinate Freeze.
// Preview canvas non distruttiva: usa i dati del catalogo, il manifest asset carte e le coordinate del Card Composer.
// In F9K2d integra nel renderer le coordinate validate dal Calibration Lab per Exordium, Agathoi, Liberti e Fabeot, separate tra unità e tattiche.

const CARD_RENDERER_STATE = {
  selectedCardId: "",
  selectedSource: "",
  lastContext: "deckBuilder"
};

const GAME_CARD_PREVIEW_STATE = {
  handCardUid: "",
  handSide: 0,
  handSource: "",
  selectedUnitUid: ""
};

const CARD_RENDERER_FACTION_STYLE = Object.freeze({
  nexus: { text: "#d8dde6", textShadow: "rgba(0,0,0,.88)", stroke: "rgba(0,0,0,.82)", base: "#0f1e35", accent: "#2c5ea9" },
  exordium: { text: "#ffd35a", textShadow: "rgba(0,0,0,.88)", stroke: "rgba(0,0,0,.82)", base: "#34110f", accent: "#7f2917" },
  liberti: { text: "#ffe29a", textShadow: "rgba(0,0,0,.88)", stroke: "rgba(0,0,0,.82)", base: "#35250f", accent: "#866227" },
  agathoi: { text: "#f1e8aa", textShadow: "rgba(0,0,0,.88)", stroke: "rgba(0,0,0,.82)", base: "#273617", accent: "#557437" },
  fabeot: { text: "#d5d5df", textShadow: "rgba(0,0,0,.88)", stroke: "rgba(0,0,0,.82)", base: "#231d37", accent: "#55428a" },
  neutral: { text: "#ececec", textShadow: "rgba(0,0,0,.88)", stroke: "rgba(0,0,0,.82)", base: "#24262f", accent: "#525866" }
});

const CARD_RENDERER_TEXT_AREA_OFFSETS = Object.freeze({
  unit: {
    nexus: { nameY: 0, typeY: 0, descriptionY: 0 },
    exordium: { nameY: 8, typeY: 7, descriptionY: 9 },
    liberti: { nameY: 8, typeY: 7, descriptionY: 9 },
    fabeot: { nameY: 8, typeY: 7, descriptionY: 9 },
    agathoi: { nameY: 20, typeY: 15, descriptionY: 22 }
  },
  tactic: {
    nexus: { nameY: 0, typeY: 0, descriptionY: 0 },
    exordium: { nameY: 7, typeY: 6, descriptionY: 9 },
    liberti: { nameY: 7, typeY: 6, descriptionY: 9 },
    fabeot: { nameY: 7, typeY: 6, descriptionY: 9 },
    agathoi: { nameY: 4, typeY: 8, descriptionY: 6 }
  }
});

const CARD_RENDERER_FIXED_LAYOUT_OVERRIDES = Object.freeze({
  "unit": {
    "exordium": {
      "textAreas": {
        "name": {
          "x": 146,
          "y": 1073.5,
          "w": 735,
          "h": 48,
          "maxFontSize": 55,
          "minFontSize": 30
        },
        "type": {
          "x": 312,
          "y": 1190,
          "w": 400,
          "h": 30,
          "maxFontSize": 25,
          "minFontSize": 18
        },
        "description": {
          "x": 161,
          "y": 1230,
          "w": 724,
          "h": 218,
          "maxFontSize": 34,
          "minFontSize": 22
        }
      },
      "statText": {
        "ene": {
          "cx": 140,
          "labelY": 111,
          "valueY": 180,
          "labelSize": 25,
          "valueSize": 104
        },
        "hp": {
          "cx": 155,
          "labelY": 925,
          "valueY": 997,
          "labelSize": 25,
          "valueSize": 104
        },
        "def": {
          "cx": 322,
          "labelY": 954,
          "valueY": 1006,
          "labelSize": 19,
          "valueSize": 70
        },
        "att": {
          "cx": 871,
          "labelY": 925,
          "valueY": 997,
          "labelSize": 25,
          "valueSize": 104
        }
      }
    },
    "agathoi": {
      "textAreas": {
        "name": {
          "x": 146,
          "y": 1080.5,
          "w": 732,
          "h": 48,
          "maxFontSize": 55,
          "minFontSize": 30
        },
        "type": {
          "x": 312,
          "y": 1190,
          "w": 400,
          "h": 30,
          "maxFontSize": 25,
          "minFontSize": 18
        },
        "description": {
          "x": 155,
          "y": 1240,
          "w": 724,
          "h": 218,
          "maxFontSize": 34,
          "minFontSize": 22
        }
      },
      "statText": {
        "ene": {
          "cx": 140,
          "labelY": 111,
          "valueY": 180,
          "labelSize": 25,
          "valueSize": 104
        },
        "hp": {
          "cx": 152,
          "labelY": 925,
          "valueY": 997,
          "labelSize": 25,
          "valueSize": 104
        },
        "def": {
          "cx": 322,
          "labelY": 954,
          "valueY": 1003,
          "labelSize": 19,
          "valueSize": 70
        },
        "att": {
          "cx": 861,
          "labelY": 925,
          "valueY": 997,
          "labelSize": 25,
          "valueSize": 104
        }
      }
    },
    "liberti": {
      "textAreas": {
        "name": {
          "x": 146,
          "y": 1090,
          "w": 732,
          "h": 48,
          "maxFontSize": 55,
          "minFontSize": 30
        },
        "type": {
          "x": 312,
          "y": 1195,
          "w": 400,
          "h": 30,
          "maxFontSize": 25,
          "minFontSize": 18
        },
        "description": {
          "x": 155,
          "y": 1258,
          "w": 724,
          "h": 218,
          "maxFontSize": 34,
          "minFontSize": 22
        }
      },
      "statText": {
        "ene": {
          "cx": 140,
          "labelY": 111,
          "valueY": 180,
          "labelSize": 25,
          "valueSize": 104
        },
        "hp": {
          "cx": 152,
          "labelY": 925,
          "valueY": 997,
          "labelSize": 25,
          "valueSize": 104
        },
        "def": {
          "cx": 322,
          "labelY": 954,
          "valueY": 1003,
          "labelSize": 19,
          "valueSize": 70
        },
        "att": {
          "cx": 861,
          "labelY": 925,
          "valueY": 997,
          "labelSize": 25,
          "valueSize": 104
        }
      }
    },
    "fabeot": {
      "textAreas": {
        "name": {
          "x": 146,
          "y": 1085,
          "w": 732,
          "h": 48,
          "maxFontSize": 55,
          "minFontSize": 30
        },
        "type": {
          "x": 312,
          "y": 1190,
          "w": 400,
          "h": 30,
          "maxFontSize": 25,
          "minFontSize": 18
        },
        "description": {
          "x": 155,
          "y": 1240,
          "w": 724,
          "h": 218,
          "maxFontSize": 34,
          "minFontSize": 22
        }
      },
      "statText": {
        "ene": {
          "cx": 140,
          "labelY": 111,
          "valueY": 180,
          "labelSize": 25,
          "valueSize": 104
        },
        "hp": {
          "cx": 152,
          "labelY": 925,
          "valueY": 997,
          "labelSize": 25,
          "valueSize": 104
        },
        "def": {
          "cx": 322,
          "labelY": 954,
          "valueY": 1003,
          "labelSize": 19,
          "valueSize": 70
        },
        "att": {
          "cx": 861,
          "labelY": 925,
          "valueY": 997,
          "labelSize": 25,
          "valueSize": 104
        }
      }
    }
  },
  "tactic": {
    "exordium": {
      "textAreas": {
        "name": {
          "x": 146,
          "y": 880,
          "w": 740,
          "h": 60,
          "maxFontSize": 55,
          "minFontSize": 28
        },
        "type": {
          "x": 267,
          "y": 1002,
          "w": 495,
          "h": 34,
          "maxFontSize": 28,
          "minFontSize": 16
        },
        "description": {
          "x": 150,
          "y": 1095,
          "w": 748,
          "h": 300,
          "maxFontSize": 38,
          "minFontSize": 22
        }
      },
      "statText": {
        "ene": {
          "cx": 150,
          "labelY": 110,
          "valueY": 190,
          "labelSize": 25,
          "valueSize": 104
        },
        "hp": {
          "cx": 0,
          "labelY": 0,
          "valueY": 0,
          "labelSize": 0,
          "valueSize": 0
        },
        "def": {
          "cx": 0,
          "labelY": 0,
          "valueY": 0,
          "labelSize": 0,
          "valueSize": 0
        },
        "att": {
          "cx": 0,
          "labelY": 0,
          "valueY": 0,
          "labelSize": 0,
          "valueSize": 0
        }
      }
    },
    "agathoi": {
      "textAreas": {
        "name": {
          "x": 146,
          "y": 900,
          "w": 740,
          "h": 60,
          "maxFontSize": 55,
          "minFontSize": 28
        },
        "type": {
          "x": 274,
          "y": 1010,
          "w": 495,
          "h": 34,
          "maxFontSize": 28,
          "minFontSize": 16
        },
        "description": {
          "x": 157,
          "y": 1100,
          "w": 748,
          "h": 300,
          "maxFontSize": 38,
          "minFontSize": 22
        }
      },
      "statText": {
        "ene": {
          "cx": 140,
          "labelY": 108,
          "valueY": 190,
          "labelSize": 25,
          "valueSize": 104
        },
        "hp": {
          "cx": 0,
          "labelY": 0,
          "valueY": 0,
          "labelSize": 0,
          "valueSize": 0
        },
        "def": {
          "cx": 0,
          "labelY": 0,
          "valueY": 0,
          "labelSize": 0,
          "valueSize": 0
        },
        "att": {
          "cx": 0,
          "labelY": 0,
          "valueY": 0,
          "labelSize": 0,
          "valueSize": 0
        }
      }
    },
    "liberti": {
      "textAreas": {
        "name": {
          "x": 146,
          "y": 910,
          "w": 740,
          "h": 60,
          "maxFontSize": 55,
          "minFontSize": 28
        },
        "type": {
          "x": 274,
          "y": 1032,
          "w": 495,
          "h": 34,
          "maxFontSize": 28,
          "minFontSize": 16
        },
        "description": {
          "x": 138,
          "y": 1120,
          "w": 748,
          "h": 300,
          "maxFontSize": 38,
          "minFontSize": 22
        }
      },
      "statText": {
        "ene": {
          "cx": 140,
          "labelY": 111,
          "valueY": 185,
          "labelSize": 25,
          "valueSize": 104
        },
        "hp": {
          "cx": 0,
          "labelY": 0,
          "valueY": 0,
          "labelSize": 0,
          "valueSize": 0
        },
        "def": {
          "cx": 0,
          "labelY": 0,
          "valueY": 0,
          "labelSize": 0,
          "valueSize": 0
        },
        "att": {
          "cx": 0,
          "labelY": 0,
          "valueY": 0,
          "labelSize": 0,
          "valueSize": 0
        }
      }
    },
    "fabeot": {
      "textAreas": {
        "name": {
          "x": 146,
          "y": 885,
          "w": 740,
          "h": 60,
          "maxFontSize": 55,
          "minFontSize": 28
        },
        "type": {
          "x": 274,
          "y": 1000,
          "w": 495,
          "h": 34,
          "maxFontSize": 28,
          "minFontSize": 16
        },
        "description": {
          "x": 142,
          "y": 1100,
          "w": 748,
          "h": 300,
          "maxFontSize": 38,
          "minFontSize": 22
        }
      },
      "statText": {
        "ene": {
          "cx": 140,
          "labelY": 111,
          "valueY": 190,
          "labelSize": 25,
          "valueSize": 104
        },
        "hp": {
          "cx": 0,
          "labelY": 0,
          "valueY": 0,
          "labelSize": 0,
          "valueSize": 0
        },
        "def": {
          "cx": 0,
          "labelY": 0,
          "valueY": 0,
          "labelSize": 0,
          "valueSize": 0
        },
        "att": {
          "cx": 0,
          "labelY": 0,
          "valueY": 0,
          "labelSize": 0,
          "valueSize": 0
        }
      }
    }
  }
});

function cardRendererFixedLayoutOverride(card, kind) {
  const factionKey = typeof cardAssetFactionKey === "function" ? cardAssetFactionKey(card) : String(card && card.faction || "").toLowerCase();
  const byKind = CARD_RENDERER_FIXED_LAYOUT_OVERRIDES[kind] || null;
  return byKind && factionKey ? byKind[factionKey] || null : null;
}

function cardRendererMergeArea(base, override) {
  return override && typeof override === "object" ? { ...(base || {}), ...override } : { ...(base || {}) };
}

function cardRendererApplyFixedLayoutOverride(layout, card, kind) {
  const override = cardRendererFixedLayoutOverride(card, kind);
  if (!override) return layout;
  const next = {
    ...layout,
    image: { ...(layout.image || {}) },
    imageTransform: { ...(layout.imageTransform || {}) },
    textAreas: { ...(layout.textAreas || {}) },
    statText: { ...(layout.statText || {}) }
  };
  if (override.textAreas) {
    Object.keys(override.textAreas).forEach(key => {
      next.textAreas[key] = cardRendererMergeArea(next.textAreas[key], override.textAreas[key]);
    });
  }
  if (override.statText) {
    Object.keys(override.statText).forEach(key => {
      next.statText[key] = cardRendererMergeArea(next.statText[key], override.statText[key]);
    });
  }
  return next;
}

function cardRendererTextAreaOffset(card, kind, areaName) {
  const fallback = { nameY: 0, typeY: 0, descriptionY: 0 };
  const factionKey = typeof cardAssetFactionKey === "function" ? cardAssetFactionKey(card) : String(card && card.faction || "").toLowerCase();
  const table = CARD_RENDERER_TEXT_AREA_OFFSETS[kind] || CARD_RENDERER_TEXT_AREA_OFFSETS.unit || {};
  const row = table[factionKey] || fallback;
  const key = `${areaName}Y`;
  return Number.isFinite(row[key]) ? row[key] : 0;
}

function cardRendererOffsetTextArea(area, yOffset) {
  return { ...(area || {}), y: (area && Number.isFinite(area.y) ? area.y : 0) + (Number.isFinite(yOffset) ? yOffset : 0) };
}

function cardRendererLayoutFor(card, kind) {
  const base = (typeof CARD_COMPOSER_TEMPLATE_GEOMETRY !== "undefined" && CARD_COMPOSER_TEMPLATE_GEOMETRY[kind])
    ? CARD_COMPOSER_TEMPLATE_GEOMETRY[kind]
    : CARD_COMPOSER_TEMPLATE_GEOMETRY.unit;
  const textAreas = base.textAreas || {};
  const layout = {
    ...base,
    image: { ...(base.image || {}) },
    imageTransform: { ...(base.imageTransform || {}) },
    statText: { ...(base.statText || {}) },
    textAreas: {
      ...textAreas,
      name: cardRendererOffsetTextArea(textAreas.name, cardRendererTextAreaOffset(card, kind, "name")),
      type: cardRendererOffsetTextArea(textAreas.type, cardRendererTextAreaOffset(card, kind, "type")),
      description: cardRendererOffsetTextArea(textAreas.description, cardRendererTextAreaOffset(card, kind, "description"))
    }
  };
  return cardRendererApplyFixedLayoutOverride(layout, card, kind);
}

const cardRendererImageCache = Object.create(null);

// F9O4e: cache bitmap delle miniature pubbliche della mano.
// Evita che Starter, Comandante e Missione tornino al fallback quando il DOM
// della mano viene ricostruito durante i turni bot rapidi.
const CARD_RENDERER_HAND_THUMB_CACHE_LIMIT = 40;
const cardRendererHandThumbCache = new Map();
const cardRendererHandThumbPrewarm = new Map();

function cardRendererHandThumbVisualKey(card) {
  if (!card) return "";
  const art = card && card.customArt && card.customArt.dataUrl ? String(card.customArt.dataUrl) : "";
  const artToken = art ? `${art.length}:${art.slice(0, 24)}:${art.slice(-24)}` : "";
  let assetToken = "";
  try {
    const paths = cardRendererPreviewAssetPaths(card);
    assetToken = `${(paths.art || []).join(",")}::${(paths.frame || []).join(",")}`;
  } catch (_) {}
  return [
    card.id || card.sourceId || card.name || "card",
    card.id || "",
    card.sourceId || "",
    card.name || "",
    card.faction || "",
    card.sourceType || "",
    card.cardType || "",
    card.deckRole || "",
    Number.isFinite(Number(card.cost)) ? Number(card.cost) : "",
    Number.isFinite(Number(card.hp)) ? Number(card.hp) : "",
    Number.isFinite(Number(card.maxHp)) ? Number(card.maxHp) : "",
    Number.isFinite(Number(card.att)) ? Number(card.att) : "",
    Number.isFinite(Number(card.def)) ? Number(card.def) : "",
    card.effectText || card.description || card.text || "",
    artToken,
    assetToken
  ].join("¦");
}

function cardRendererHandThumbCacheableCanvas(canvas) {
  if (!canvas) return false;
  if (canvas.dataset && canvas.dataset.handThumbPrewarm === "1") return true;
  return Boolean(canvas.classList && canvas.classList.contains("handCardThumbCanvas"));
}

function cardRendererHandThumbQualityRank(ready, artSource) {
  if (artSource === "real") return ready ? 40 : 30;
  if (artSource === "placeholder") return ready ? 20 : 10;
  return ready ? 5 : 0;
}

function cardRendererStoreHandThumbnailSnapshot(canvas, card, options = {}) {
  if (!canvas || !card || !cardRendererHandThumbCacheableCanvas(canvas)) return false;
  if (typeof document === "undefined" || typeof document.createElement !== "function") return false;
  if (!canvas.width || !canvas.height || typeof canvas.getContext !== "function") return false;
  const key = cardRendererHandThumbVisualKey(card);
  if (!key) return false;
  const ready = options.ready === true;
  const artSource = String(options.artSource || "pending");
  const qualityRank = cardRendererHandThumbQualityRank(ready, artSource);
  try {
    const snapshot = document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    const ctx = snapshot.getContext("2d");
    if (!ctx || typeof ctx.drawImage !== "function") return false;
    ctx.drawImage(canvas, 0, 0);
    const previous = cardRendererHandThumbCache.get(key);
    const largerOrEqual = !previous || (snapshot.width * snapshot.height) >= (previous.canvas.width * previous.canvas.height);
    const previousRank = previous && Number.isFinite(previous.qualityRank) ? previous.qualityRank : cardRendererHandThumbQualityRank(Boolean(previous && previous.ready), previous && previous.artSource);
    // F9O4f: una bitmap provvisoria (placeholder mentre l'arte reale è ancora
    // pendente) non può mai sostituire uno snapshot definitivo. A parità di
    // finalizzazione prevale la sorgente grafica migliore e poi la risoluzione.
    const shouldReplace = !previous
      || (ready && !previous.ready)
      || (ready === Boolean(previous.ready) && (qualityRank > previousRank || (qualityRank === previousRank && largerOrEqual)));
    if (shouldReplace) {
      cardRendererHandThumbCache.delete(key);
      cardRendererHandThumbCache.set(key, { canvas:snapshot, ready, artSource, qualityRank, storedAt:Date.now() });
      while (cardRendererHandThumbCache.size > CARD_RENDERER_HAND_THUMB_CACHE_LIMIT) {
        const oldest = cardRendererHandThumbCache.keys().next().value;
        cardRendererHandThumbCache.delete(oldest);
      }
    }
    canvas.__arenaHandThumbCacheKey = key;
    if (ready) {
      cardRendererHandThumbPrewarm.delete(key);
      const current = cardRendererHandThumbCache.get(key);
      if (current && typeof document.querySelectorAll === "function") {
        document.querySelectorAll(".handCardThumbCanvas").forEach(target => {
          if (!target || target === canvas || target.__arenaHandThumbCacheKey !== key) return;
          cardRendererRestoreHandThumbnailSnapshot(target, card);
        });
      }
    }
    return true;
  } catch (_) {
    return false;
  }
}

function cardRendererRestoreHandThumbnailSnapshot(canvas, card) {
  if (!canvas || !card || typeof canvas.getContext !== "function") return false;
  const key = cardRendererHandThumbVisualKey(card);
  const entry = key ? cardRendererHandThumbCache.get(key) : null;
  if (!entry || !entry.canvas) return false;
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx || typeof ctx.drawImage !== "function") return false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(entry.canvas, 0, 0, canvas.width, canvas.height);
    canvas.__arenaHandThumbCacheKey = key;
    canvas.dataset.thumbCacheRestored = "1";
    canvas.dataset.cardRenderState = entry.ready ? "ready" : "pending";
    canvas.dataset.cardArtState = entry.artSource || (entry.ready ? "final" : "pending");
    canvas.dataset.thumbSnapshotFinal = entry.ready ? "1" : "0";
    if (entry.ready) canvas.dataset.thumbRendered = "1";
    else if (typeof canvas.removeAttribute === "function") canvas.removeAttribute("data-thumb-rendered");
    const wrap = typeof canvas.closest === "function"
      ? (canvas.closest(".handRenderedCard") || canvas.closest(".mapHandVisualCard"))
      : null;
    // Anche uno snapshot provvisorio evita il flash, ma non viene marcato come
    // render definitivo e quindi resta eleggibile per il ridisegno reale.
    if (wrap && wrap.classList) wrap.classList.add("thumbRendered");
    cardRendererHandThumbCache.delete(key);
    cardRendererHandThumbCache.set(key, entry);
    return entry.ready ? "ready" : "pending";
  } catch (_) {
    return false;
  }
}

function cardRendererPrewarmHandThumbnail(card) {
  if (!card || typeof document === "undefined" || typeof document.createElement !== "function") return false;
  const key = cardRendererHandThumbVisualKey(card);
  if (!key || cardRendererHandThumbCache.has(key) || cardRendererHandThumbPrewarm.has(key)) return false;
  const canvas = document.createElement("canvas");
  canvas.width = 215;
  canvas.height = 323;
  canvas.dataset.handThumbPrewarm = "1";
  cardRendererHandThumbPrewarm.set(key, canvas);
  const rendered = renderArenaCardPreviewCanvas(canvas, card, { scale:0.21 });
  if (!rendered) cardRendererHandThumbPrewarm.delete(key);
  return Boolean(rendered);
}

function cardRendererHandThumbCacheDiagnostics() {
  const entries = Array.from(cardRendererHandThumbCache.values());
  return {
    cached: entries.length,
    final: entries.filter(entry => entry && entry.ready).length,
    provisional: entries.filter(entry => entry && !entry.ready).length,
    realArt: entries.filter(entry => entry && entry.artSource === "real").length,
    placeholderArt: entries.filter(entry => entry && entry.artSource === "placeholder").length,
    prewarming: cardRendererHandThumbPrewarm.size,
    limit: CARD_RENDERER_HAND_THUMB_CACHE_LIMIT
  };
}

function cardRendererSelectCard(cardId, source = "") {
  CARD_RENDERER_STATE.selectedCardId = String(cardId || "");
  CARD_RENDERER_STATE.selectedSource = String(source || "");
  return CARD_RENDERER_STATE.selectedCardId;
}

function cardRendererCurrentCardId() {
  return CARD_RENDERER_STATE.selectedCardId || "";
}

function cardRendererFactionStyle(card) {
  const key = typeof cardAssetFactionKey === "function" ? cardAssetFactionKey(card) : "neutral";
  return CARD_RENDERER_FACTION_STYLE[key] || CARD_RENDERER_FACTION_STYLE.neutral;
}

function cardRendererSourceBlueprint(card) {
  if (!card || card.sourceType !== "unit" || typeof BLUEPRINTS === "undefined") return null;
  return (BLUEPRINTS || []).find(bp => bp && bp.id === card.blueprintId) || null;
}

function cardRendererSourceTactic(card) {
  if (!card || card.sourceType !== "tactic" || typeof DECK_TACTICS === "undefined") return null;
  return (DECK_TACTICS || []).find(t => t && t.id === card.tacticId) || null;
}

function cardRendererEscapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cardRendererPassiveEntries(card) {
  if (!card || card.sourceType === "tactic" || card.sourceType === "mission") return [];
  const bp = cardRendererSourceBlueprint(card) || (card.custom ? card : null);
  if (!bp) return [];
  const entries = [];
  const add = (name, description) => {
    if (!name) return;
    if (entries.some(e => e.name === name)) return;
    entries.push({ name, description: description || name });
  };
  const rules = Array.isArray(bp.factionRules) ? bp.factionRules : [];

  if (bp.vanguard) add("Avanguardia", "Può agire nel turno in cui entra in gioco.");
  if (bp.frontLine) add("Prima Linea", "Intercetta attacchi base diretti a unità alleate adiacenti, quando la regola è applicabile.");
  if (Number.isFinite(bp.passiveThorns) && bp.passiveThorns > 0) add("Spine", `Chi attacca questa unità subisce ${bp.passiveThorns} danno diretto.`);
  if (bp.guardThornsOnIdle) add("Spine", "Se termina il turno senza attaccare/usare abilità/costruire, ottiene Spine 1 fino al prossimo turno.");
  if (rules.includes("Superiorità Numerica")) add("Superiorità Numerica", "Bonus d'attacco Liberti quando il bersaglio è pressato da più unità valide.");
  if (rules.includes("Sanguinamento") || (Number.isFinite(bp.bleedValue) && bp.bleedValue > 0)) add("Sanguinamento", `Gli attacchi possono applicare Sanguinamento${Number.isFinite(bp.bleedValue) && bp.bleedValue > 0 ? ` ${bp.bleedValue}` : ""}, infliggendo pressione nel tempo.`);
  if (bp.bleedImmune) add("Immunità Sanguinamento", "Non subisce gli effetti di Sanguinamento.");
  if (Number.isFinite(bp.antiStructureAtt) && bp.antiStructureAtt > 0) add("Anti-Struttura", `+${bp.antiStructureAtt} ATT quando attacca strutture.`);
  if (Number.isFinite(bp.attacksPerTurn) && bp.attacksPerTurn > 1) add("Attacchi Multipli", `Può effettuare ${bp.attacksPerTurn} attacchi base per turno, se le condizioni lo permettono.`);
  if (bp.psBonus && bp.psBonus.description) add("Bonus PS", bp.psBonus.description);
  if (bp.costAdjacencyVehicle && Number.isFinite(bp.costAdjacencyVehicle.value)) add("Coordinamento", `Riduce il costo di ${Math.abs(bp.costAdjacencyVehicle.value)} ENE vicino a veicoli alleati, fino al minimo previsto.`);
  if (Number.isFinite(bp.onKillHealInfantry) && bp.onKillHealInfantry > 0) add("Predazione", `Quando distrugge una fanteria nemica recupera ${bp.onKillHealInfantry} HP.`);
  if (bp.ability && bp.ability.passive) add(bp.ability.name || "Passiva", bp.ability.description || "Abilità passiva.");
  if (bp.customAbilitySchema && bp.customAbilitySchema.passive) {
    const passive = bp.customAbilitySchema.passive;
    add(passive.label || passive.kind || "Passiva custom", passive.description || passive.label || "Passiva custom data-only.");
  }
  return entries;
}

function cardRendererPassiveText(card) {
  return cardRendererPassiveEntries(card)
    .map(entry => `${entry.name}: ${entry.description}`)
    .join(" ");
}

function cardRendererPassiveBadgesHtml(card, escapeFn = cardRendererEscapeHtml) {
  const entries = cardRendererPassiveEntries(card);
  if (!entries.length) return "";
  const esc = typeof escapeFn === "function" ? escapeFn : cardRendererEscapeHtml;
  return `<div class="cardRendererPassiveBadges" aria-label="Tratti passivi">${entries.map(entry => `<span class="cardRendererPassiveBadge" tabindex="0" title="${esc(entry.description)}"><strong>${esc(entry.name)}</strong></span>`).join("")}</div>`;
}

function cardRendererLocalizedUnitType(card) {
  if (!card) return "—";
  const cardType = String(card.cardType || "").toLowerCase();
  const deckRole = String(card.deckRole || "").toLowerCase();
  const unitTypeRaw = String(card.unitType || "").trim();
  const weightRaw = String(card.weight || "").trim();
  const typeMap = {
    comandante: "COMANDANTE",
    fanteria: "FANTERIA",
    veicolo: "VEICOLO",
    struttura: "STRUTTURA"
  };
  const weightMap = {
    leggera: "LEGGERA", leggero: "LEGGERO",
    pesante: "PESANTE",
    elite: "ELITE",
    pivot: "PIVOT"
  };
  if (cardType === "commander" || deckRole === "commander" || unitTypeRaw.toLowerCase() === "comandante") return "COMANDANTE";
  const typeKey = unitTypeRaw.toLowerCase();
  const weightKey = weightRaw.toLowerCase();
  const localizedType = typeMap[typeKey] || unitTypeRaw.toUpperCase() || "UNITA";
  const localizedWeight = weightMap[weightKey] || weightRaw.toUpperCase();
  return [localizedType, localizedWeight].filter(Boolean).join(" ").trim();
}

function cardRendererLocalizedTacticType(card) {
  if (!card) return "TATTICA";
  const category = String(card.category || "").trim();
  return category ? `TATTICA · ${category.toUpperCase()}` : "TATTICA";
}

function cardRendererUsesTacticLayout(card) {
  return Boolean(card && (card.sourceType === "tactic" || card.sourceType === "mission"));
}

function cardRendererSourceTypeLabel(card) {
  if (!card) return "Carta";
  if (card.sourceType === "mission") return "Missione";
  if (card.sourceType === "tactic") return "Tattica";
  return "Unità";
}

function cardRendererStatPalette() {
  return {
    ene: "#f2cf57",
    hp: "#3ecb63",
    def: "#f4f4f4",
    att: "#d4483c"
  };
}
function cardRendererTypeText(card) {
  if (!card) return "—";
  if (card.sourceType === "mission") return card.missionClass === "desperate" ? "MISSIONE DISPERATA" : "MISSIONE";
  if (card.sourceType === "tactic") return cardRendererLocalizedTacticType(card);
  return cardRendererLocalizedUnitType(card) || String(card.cardType || "CARTA").toUpperCase();
}

function cardRendererDescriptionText(card) {
  if (!card) return "";
  if (card.sourceType === "mission") return String(card.effectText || card.description || "").trim();
  if (card.custom && (card.description || card.abilityText || card.effectText || card.notes)) {
    const passiveText = cardRendererPassiveText(card);
    return [card.description, card.abilityText, passiveText, card.effectText, card.notes].filter(Boolean).join(" ").trim();
  }
  if (card.sourceType === "tactic") {
    const tactic = cardRendererSourceTactic(card);
    return [card.effectText, tactic && tactic.notes, tactic && tactic.target ? `Bersaglio: ${tactic.target}.` : ""].filter(Boolean).join(" ").trim();
  }
  const bp = cardRendererSourceBlueprint(card);
  const parts = [];
  if (card.description) parts.push(card.description);
  if (card.abilityText) parts.push(card.abilityText);
  if (bp && bp.description) parts.push(bp.description);
  if (bp && bp.ability && bp.ability.description && !bp.ability.passive) {
    const abilityLabel = bp.ability.name ? `${bp.ability.name}: ` : "";
    parts.push(`${abilityLabel}${bp.ability.description}`);
  }
  const passiveText = cardRendererPassiveText(card);
  if (passiveText) parts.push(passiveText);
  if (bp && bp.psBonus && bp.psBonus.description && !parts.join(" ").includes(bp.psBonus.description)) parts.push(bp.psBonus.description);
  if (!parts.length) parts.push("Nessuna abilità.");
  return [...new Set(parts)].join(" ");
}

function cardRendererStat(card, key) {
  const bp = cardRendererSourceBlueprint(card);
  if (bp && Number.isFinite(bp[key])) return bp[key];
  if (Number.isFinite(card && card[key])) return card[key];
  if (key === "cost" && Number.isFinite(card && card.cost)) return card.cost;
  return null;
}

function cardRendererNormalizeDescription(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function cardRendererLoadImage(src, onDone) {
  if (!src) return null;
  const cached = cardRendererImageCache[src];
  if (cached) {
    if (cached.status === "loaded") return cached.img;
    if (cached.status === "error") return null;
    if (typeof onDone === "function") cached.listeners.push(onDone);
    return null;
  }
  const img = new Image();
  cardRendererImageCache[src] = { status: "loading", img, listeners: typeof onDone === "function" ? [onDone] : [] };
  img.onload = () => {
    const entry = cardRendererImageCache[src];
    if (!entry) return;
    entry.status = "loaded";
    const listeners = entry.listeners.splice(0);
    listeners.forEach(fn => { try { fn("loaded", src); } catch (_) {} });
  };
  img.onerror = () => {
    const entry = cardRendererImageCache[src];
    if (!entry) return;
    entry.status = "error";
    const listeners = entry.listeners.splice(0);
    listeners.forEach(fn => { try { fn("error", src); } catch (_) {} });
  };
  img.src = src;
  return null;
}

function cardRendererLoadFirstAvailableImage(paths, onDone) {
  const list = Array.isArray(paths) ? paths.filter(Boolean) : [paths].filter(Boolean);
  if (!list.length) return null;
  for (const src of list) {
    const cached = cardRendererImageCache[src];
    if (cached && cached.status === "loaded") return cached.img;
  }

  const firstCandidateIndex = list.findIndex(src => {
    const cached = cardRendererImageCache[src];
    return !cached || cached.status !== "error";
  });
  if (firstCandidateIndex < 0) return null;
  const src = list[firstCandidateIndex];
  const cached = cardRendererImageCache[src];
  const listener = status => {
    if (status === "error") {
      // Prosegue con il candidato successivo anche se il canvas che aveva richiesto
      // l'immagine è già stato sostituito da un render successivo.
      cardRendererLoadFirstAvailableImage(list, onDone);
      // L'ultimo errore deve provocare un ridisegno conclusivo: senza questo segnale
      // il canvas può restare per sempre nello stato "in caricamento" nelle build LITE.
      const exhausted = list.every(path => cardRendererImageCache[path] && cardRendererImageCache[path].status === "error");
      if (exhausted && typeof onDone === "function") onDone("settled-error", src);
      return;
    }
    if (typeof onDone === "function") onDone(status, src);
  };
  if (cached && cached.status === "loading") {
    cached.listeners.push(listener);
    return null;
  }
  return cardRendererLoadImage(src, listener);
}

function cardRendererImagePathsState(paths) {
  const list = Array.isArray(paths) ? paths.filter(Boolean) : [paths].filter(Boolean);
  if (!list.length) return "empty";
  if (list.some(src => cardRendererImageCache[src] && cardRendererImageCache[src].status === "loaded")) return "loaded";
  if (list.every(src => cardRendererImageCache[src] && cardRendererImageCache[src].status === "error")) return "error";
  return "pending";
}

function cardRendererImagePathsSettled(paths) {
  return cardRendererImagePathsState(paths) !== "pending";
}

function cardRendererPreviewAssetPaths(card) {
  const embeddedArtPath = card && card.customArt && card.customArt.dataUrl ? card.customArt.dataUrl : "";
  const realArtPaths = embeddedArtPath
    ? [embeddedArtPath]
    : (typeof cardAssetArtCandidatePathsFor === "function" ? cardAssetArtCandidatePathsFor(card) : (typeof cardAssetArtPathFor === "function" ? [cardAssetArtPathFor(card)] : []));
  const placeholderPath = typeof cardAssetEntryFor === "function" ? (cardAssetEntryFor(card).placeholderPath || "") : "";
  const framePath = typeof cardAssetFramePathFor === "function" ? cardAssetFramePathFor(card) : "";
  const placeholder = placeholderPath ? [placeholderPath] : [];
  return {
    realArt: realArtPaths.filter(Boolean),
    placeholder,
    // Compatibilità diagnostica con i consumer precedenti.
    art: [...realArtPaths, ...placeholder].filter(Boolean),
    frame: framePath ? [framePath] : []
  };
}

function cardRendererPreviewAssetState(card) {
  if (!card) return {
    ready: true,
    artSource: "none",
    realArtState: "empty",
    placeholderState: "empty",
    frameState: "empty"
  };
  const paths = cardRendererPreviewAssetPaths(card);
  const realArtState = cardRendererImagePathsState(paths.realArt);
  const placeholderState = cardRendererImagePathsState(paths.placeholder);
  const frameState = cardRendererImagePathsState(paths.frame);
  const realLoaded = realArtState === "loaded";
  const realExhausted = realArtState === "error" || realArtState === "empty";
  const placeholderSettled = placeholderState !== "pending";
  const frameSettled = frameState !== "pending";
  let artSource = "pending";
  if (realLoaded) artSource = "real";
  else if (realExhausted && placeholderState === "loaded") artSource = "placeholder";
  else if (realExhausted && placeholderSettled) artSource = "none";
  else if (placeholderState === "loaded") artSource = "placeholder"; // solo provvisorio
  const artSettled = realLoaded || (realExhausted && placeholderSettled);
  return {
    ready: artSettled && frameSettled,
    artSource,
    realArtState,
    placeholderState,
    frameState
  };
}

function cardRendererPreviewAssetsSettled(card) {
  return cardRendererPreviewAssetState(card).ready;
}

function cardRendererSyncCanvasReadyState(canvas, card) {
  if (!canvas) return false;
  const assetState = cardRendererPreviewAssetState(card);
  const ready = assetState.ready;
  canvas.dataset.cardRenderState = ready ? "ready" : "pending";
  canvas.dataset.cardArtState = assetState.artSource;
  canvas.dataset.cardRealArtState = assetState.realArtState;
  canvas.dataset.cardPlaceholderState = assetState.placeholderState;
  if (ready) canvas.dataset.thumbRendered = "1";
  else if (typeof canvas.removeAttribute === "function") canvas.removeAttribute("data-thumb-rendered");
  const wrap = typeof canvas.closest === "function"
    ? (canvas.closest(".handRenderedCard") || canvas.closest(".mapHandVisualCard"))
    : null;
  const cachedVisual = canvas.dataset && canvas.dataset.thumbCacheRestored === "1";
  if (wrap && wrap.classList) wrap.classList.toggle("thumbRendered", ready || cachedVisual);
  cardRendererStoreHandThumbnailSnapshot(canvas, card, { ready, artSource:assetState.artSource });
  return ready;
}

function cardRendererSetStatFont(ctx, size) {
  const px = Math.max(10, Math.round(size));
  ctx.font = `900 ${px}px Consolas, "Liberation Mono", "Courier New", monospace`;
}

function cardRendererSetFont(ctx, size, weight = "700", family = "Georgia, 'Times New Roman', serif") {
  ctx.font = `${weight} ${Math.max(10, Math.round(size))}px ${family}`;
}

function cardRendererFitFont(ctx, text, maxWidth, maxSize, minSize, weight = "700") {
  let size = maxSize;
  for (; size >= minSize; size -= 1) {
    cardRendererSetFont(ctx, size, weight);
    if (ctx.measureText(text).width <= maxWidth) return size;
  }
  return minSize;
}

function cardRendererWrapText(ctx, text, maxWidth) {
  const tokens = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  tokens.forEach(token => {
    const probe = current ? `${current} ${token}` : token;
    if (ctx.measureText(probe).width <= maxWidth || !current) current = probe;
    else { lines.push(current); current = token; }
  });
  if (current) lines.push(current);
  return lines;
}

function cardRendererDrawTextBlock(ctx, text, area, options = {}) {
  const normalized = cardRendererNormalizeDescription(text);
  if (!normalized) return;
  const maxFont = area.maxFontSize || 32;
  const minFont = area.minFontSize || 18;
  const weight = options.weight || area.weight || "500";
  const lineHeightRatio = area.lineHeightRatio || 1.16;
  let fontSize = maxFont;
  let lines = [];
  for (; fontSize >= minFont; fontSize -= 1) {
    cardRendererSetFont(ctx, fontSize, weight);
    lines = cardRendererWrapText(ctx, normalized, area.w);
    const lineHeight = fontSize * lineHeightRatio;
    if (lines.length * lineHeight <= area.h) break;
  }
  cardRendererSetFont(ctx, fontSize, weight);
  const lineHeight = fontSize * lineHeightRatio;
  const totalHeight = lines.length * lineHeight;
  let y = area.y + Math.max(0, (area.h - totalHeight) / 2) + fontSize;
  lines.forEach(line => {
    ctx.fillText(line, area.x, y);
    y += lineHeight;
  });
}

function cardRendererDrawDescription(ctx, card, text, area, style) {
  const normalized = cardRendererNormalizeDescription(text);
  if (!normalized) return;
  if (normalized === "Nessuna abilità.") {
    const fontSize = Math.min(area.maxFontSize || 34, 32);
    cardRendererSetFont(ctx, fontSize, area.weight || "500");
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    cardRendererDrawOutlinedText(ctx, normalized, area.x + (area.w / 2), area.y + (area.h / 2), {
      fill: (style && style.text) || "#f5f5f5",
      stroke: (style && style.stroke) || "rgba(0,0,0,.82)",
      fontSize,
      lineWidth: Math.max(2, Math.round(fontSize * 0.08))
    });
    ctx.restore();
    ctx.textBaseline = "alphabetic";
    return;
  }
  cardRendererDrawTextBlock(ctx, normalized, area, { weight: area.weight || "500" });
}

function cardRendererDrawOutlinedText(ctx, text, x, y, opts = {}) {
  const fill = opts.fill || "#f5f5f5";
  const stroke = opts.stroke || "rgba(0,0,0,.82)";
  const lineWidth = Number.isFinite(opts.lineWidth) ? opts.lineWidth : Math.max(2, (opts.fontSize || 20) * 0.08);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = stroke;
  ctx.strokeText(String(text || ""), x, y);
  ctx.fillStyle = fill;
  ctx.fillText(String(text || ""), x, y);
}

function cardRendererDrawCardBase(ctx, canvas, card) {
  const style = cardRendererFactionStyle(card);
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, style.base || "#20242f");
  grad.addColorStop(1, style.accent || "#4f5866");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function cardRendererDrawArtArea(ctx, card, layout, redraw) {
  const embeddedArtPath = card && card.customArt && card.customArt.dataUrl ? card.customArt.dataUrl : "";
  const artPaths = embeddedArtPath
    ? [embeddedArtPath]
    : (typeof cardAssetArtCandidatePathsFor === "function" ? cardAssetArtCandidatePathsFor(card) : (typeof cardAssetArtPathFor === "function" ? [cardAssetArtPathFor(card)] : []));
  const placeholderPath = typeof cardAssetEntryFor === "function" ? (cardAssetEntryFor(card).placeholderPath || "") : "";
  const artArea = layout.image;
  const baseTransform = layout.imageTransform || { zoom: 1, offsetX: 0, offsetY: 0 };
  const customTransform = embeddedArtPath ? (card.customArtTransform || card.customArt.transform || {}) : {};
  const transform = { ...baseTransform, ...customTransform };
  const artImg = cardRendererLoadFirstAvailableImage(artPaths, redraw);
  const placeholderImg = artImg ? null : cardRendererLoadFirstAvailableImage([placeholderPath], redraw);
  const img = artImg || placeholderImg;
  if (img && img.width && img.height) {
    const zoom = Number.isFinite(transform.zoom) ? transform.zoom : 1;
    const drawW = artArea.w * zoom;
    const drawH = artArea.h * zoom;
    const drawX = artArea.x + (artArea.w - drawW) / 2 + (transform.offsetX || 0);
    const drawY = artArea.y + (artArea.h - drawH) / 2 + (transform.offsetY || 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(artArea.x, artArea.y, artArea.w, artArea.h);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  } else {
    const grad = ctx.createLinearGradient(artArea.x, artArea.y, artArea.x + artArea.w, artArea.y + artArea.h);
    grad.addColorStop(0, "rgba(255,255,255,.08)");
    grad.addColorStop(1, "rgba(0,0,0,.18)");
    ctx.fillStyle = grad;
    ctx.fillRect(artArea.x, artArea.y, artArea.w, artArea.h);
    ctx.strokeStyle = "rgba(255,255,255,.18)";
    ctx.lineWidth = 3;
    ctx.strokeRect(artArea.x + 4, artArea.y + 4, artArea.w - 8, artArea.h - 8);
  }
}

function cardRendererDrawFrame(ctx, card, redraw, renderSize = null) {
  const framePath = typeof cardAssetFramePathFor === "function" ? cardAssetFramePathFor(card) : "";
  const frameImg = cardRendererLoadImage(framePath, redraw);
  if (frameImg && frameImg.width && frameImg.height) {
    const targetW = renderSize && Number.isFinite(renderSize.w) ? renderSize.w : ctx.canvas.width;
    const targetH = renderSize && Number.isFinite(renderSize.h) ? renderSize.h : ctx.canvas.height;
    ctx.drawImage(frameImg, 0, 0, targetW, targetH);
  }
}


function cardRendererDrawStatLabel(ctx, label, statBox, color, style) {
  if (!statBox) return;
  const size = statBox.labelSize || 22;
  cardRendererSetStatFont(ctx, size);
  cardRendererDrawOutlinedText(ctx, label, statBox.cx, statBox.labelY, {
    fill: color,
    stroke: style.stroke,
    fontSize: size,
    lineWidth: Math.max(2, Math.round(size * 0.16))
  });
}

function cardRendererDrawStats(ctx, card, layout, style) {
  const stat = layout.statText || {};
  const cost = cardRendererStat(card, "cost");
  const hp = cardRendererStat(card, "hp");
  const def = cardRendererStat(card, "def");
  const att = cardRendererStat(card, "att");
  const palette = cardRendererStatPalette();
  ctx.textAlign = "center";
  if (stat.ene) {
    cardRendererDrawStatLabel(ctx, "ENE", stat.ene, palette.ene, style);
    cardRendererSetStatFont(ctx, stat.ene.valueSize || 104);
    cardRendererDrawOutlinedText(ctx, Number.isFinite(cost) ? cost : "—", stat.ene.cx, stat.ene.valueY, { fill: palette.ene, stroke: style.stroke, fontSize: stat.ene.valueSize || 104, lineWidth: 7 });
  }
  if (!cardRendererUsesTacticLayout(card)) {
    if (stat.hp) {
      cardRendererDrawStatLabel(ctx, "HP", stat.hp, palette.hp, style);
      cardRendererSetStatFont(ctx, stat.hp.valueSize || 104);
      cardRendererDrawOutlinedText(ctx, Number.isFinite(hp) ? hp : "—", stat.hp.cx, stat.hp.valueY, { fill: palette.hp, stroke: style.stroke, fontSize: stat.hp.valueSize || 104, lineWidth: 7 });
    }
    if (stat.def) {
      cardRendererDrawStatLabel(ctx, "DEF", stat.def, palette.def, style);
      cardRendererSetStatFont(ctx, stat.def.valueSize || 70);
      cardRendererDrawOutlinedText(ctx, Number.isFinite(def) ? def : "—", stat.def.cx, stat.def.valueY, { fill: palette.def, stroke: style.stroke, fontSize: stat.def.valueSize || 70, lineWidth: 5 });
    }
    if (stat.att) {
      cardRendererDrawStatLabel(ctx, "ATT", stat.att, palette.att, style);
      cardRendererSetStatFont(ctx, stat.att.valueSize || 104);
      cardRendererDrawOutlinedText(ctx, Number.isFinite(att) ? att : "—", stat.att.cx, stat.att.valueY, { fill: palette.att, stroke: style.stroke, fontSize: stat.att.valueSize || 104, lineWidth: 7 });
    }
  }
  ctx.textAlign = "left";
}

function cardRendererScheduleCanvasRedraw(canvas, card, options, generation) {
  const isPrewarmCanvas = Boolean(canvas && canvas.dataset && canvas.dataset.handThumbPrewarm === "1");
  if (!canvas || (!canvas.isConnected && !isPrewarmCanvas) || canvas.__arenaCardRenderGeneration !== generation) return;
  if (canvas.__arenaCardRedrawPending) return;
  canvas.__arenaCardRedrawPending = true;
  const schedule = typeof window !== "undefined" && typeof window.requestAnimationFrame === "function"
    ? window.requestAnimationFrame.bind(window)
    : callback => setTimeout(callback, 16);
  schedule(() => {
    canvas.__arenaCardRedrawPending = false;
    const stillPrewarm = Boolean(canvas.dataset && canvas.dataset.handThumbPrewarm === "1");
    if ((!canvas.isConnected && !stillPrewarm) || canvas.__arenaCardRenderGeneration !== generation) return;
    cardRendererDrawPreviewCanvas(canvas, card, options, generation);
  });
}

function cardRendererDrawPreviewCanvas(canvas, card, options, generation) {
  if (!canvas || typeof canvas.getContext !== "function") return false;
  const redraw = () => cardRendererScheduleCanvasRedraw(canvas, card, options, generation);
  const ctx = canvas.getContext("2d");
  const kind = typeof cardAssetKind === "function" ? cardAssetKind(card) : (cardRendererUsesTacticLayout(card) ? "tactic" : "unit");
  const layout = cardRendererLayoutFor(card, kind);
  const style = cardRendererFactionStyle(card);
  const virtualW = CARD_COMPOSER_TEMPLATE_GEOMETRY.canvas.w;
  const virtualH = CARD_COMPOSER_TEMPLATE_GEOMETRY.canvas.h;
  const scale = Number.isFinite(options.scale) && options.scale > 0 ? options.scale : 1;
  const renderW = Math.max(1, Math.round(virtualW * scale));
  const renderH = Math.max(1, Math.round(virtualH * scale));
  if (canvas.width !== renderW) canvas.width = renderW;
  if (canvas.height !== renderH) canvas.height = renderH;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, renderW, renderH);
  ctx.save();
  if (scale !== 1) ctx.scale(scale, scale);
  const virtualCanvas = { width: virtualW, height: virtualH };
  cardRendererDrawCardBase(ctx, virtualCanvas, card);

  if (!card) {
    ctx.fillStyle = "rgba(255,255,255,.8)";
    ctx.textAlign = "center";
    cardRendererSetFont(ctx, 42, "700");
    ctx.fillText("Seleziona una carta", virtualW / 2, virtualH / 2 - 20);
    cardRendererSetFont(ctx, 24, "400", "system-ui, sans-serif");
    ctx.fillText("Deck Builder · anteprima renderer F9I1", virtualW / 2, virtualH / 2 + 26);
    ctx.restore();
    cardRendererSyncCanvasReadyState(canvas, card);
    return true;
  }

  cardRendererDrawArtArea(ctx, card, layout, redraw);
  cardRendererDrawFrame(ctx, card, redraw, { w: virtualW, h: virtualH });

  ctx.fillStyle = style.text;
  ctx.strokeStyle = style.stroke;
  ctx.shadowColor = style.textShadow;
  ctx.shadowBlur = 0;

  const nameArea = layout.textAreas.name;
  const typeArea = layout.textAreas.type;
  const descArea = layout.textAreas.description;
  const centeredNameMax = (nameArea.maxFontSize || 48) + 3;
  const centeredNameMin = (nameArea.minFontSize || 28) + 2;
  const nameFont = cardRendererFitFont(ctx, card.name || "Carta", nameArea.w, centeredNameMax, centeredNameMin, nameArea.weight || "700");
  cardRendererSetFont(ctx, nameFont, nameArea.weight || "700");
  ctx.textAlign = "center";
  ctx.fillText(String(card.name || "Carta"), nameArea.x + (nameArea.w / 2), nameArea.y + nameFont);

  const typeText = cardRendererTypeText(card);
  const typeFont = cardRendererFitFont(ctx, typeText, typeArea.w, typeArea.maxFontSize || 28, typeArea.minFontSize || 16, typeArea.weight || "700");
  cardRendererSetFont(ctx, typeFont, typeArea.weight || "700");
  ctx.fillText(typeText, typeArea.x + (typeArea.w / 2), typeArea.y + typeFont);
  ctx.textAlign = "left";

  const description = cardRendererDescriptionText(card);
  cardRendererSetFont(ctx, descArea.maxFontSize || 34, descArea.weight || "500");
  cardRendererDrawDescription(ctx, card, description, descArea, style);

  cardRendererDrawStats(ctx, card, layout, style);
  ctx.restore();
  cardRendererSyncCanvasReadyState(canvas, card);
  return true;
}

function renderArenaCardPreviewCanvas(canvas, card, options = {}) {
  if (!canvas || typeof canvas.getContext !== "function") return false;
  const generation = (Number(canvas.__arenaCardRenderGeneration) || 0) + 1;
  canvas.__arenaCardRenderGeneration = generation;
  canvas.__arenaCardRedrawPending = false;
  return cardRendererDrawPreviewCanvas(canvas, card, options, generation);
}

function cardRendererCatalogCardById(cardId) {
  if (!cardId || typeof buildCardCatalog !== "function") return null;
  try {
    return buildCardCatalog().find(card => card && card.id === cardId) || null;
  } catch (_) {
    return null;
  }
}

function cardRendererHydrateCard(card) {
  if (!card) return null;
  const full = cardRendererCatalogCardById(card.id);
  return full ? { ...full, deckCopyNo: card.deckCopyNo || card.copyNo || full.deckCopyNo || null } : card;
}

function deckBuilderPreviewCardFromReport(report) {
  const sourceCards = [];
  const pool = report && report.faction ? (typeof deckBuilderPoolFor === "function" ? deckBuilderPoolFor(report.faction, report.commanderId, deckBuilderCatalog()) : []) : [];
  sourceCards.push(...pool);
  if (report && Array.isArray(report.deck)) sourceCards.push(...report.deck);
  const targetId = cardRendererCurrentCardId();
  const catalogMatch = targetId ? cardRendererCatalogCardById(targetId) : null;
  const rowMatch = targetId ? sourceCards.find(card => card && card.id === targetId) : null;
  const fallback = sourceCards[0] || null;
  return cardRendererHydrateCard(catalogMatch || rowMatch || fallback);
}

function gameCardPreviewCardByUid(side, cardUid) {
  if (!state || !cardUid || !side) return null;
  const hand = state.hand && state.hand[side] ? state.hand[side] : [];
  const inHand = hand.find(card => card && card.cardUid === cardUid);
  if (inHand) {
    if (typeof handCardHiddenFromViewer === "function" && handCardHiddenFromViewer(side, inHand)) return null;
    if (typeof missionCardHiddenFromViewer === "function" && missionCardHiddenFromViewer(side, inHand)) return null;
    return inHand;
  }
  const starters = state.starterCards && state.starterCards[side] ? Object.values(state.starterCards[side]) : [];
  return starters.find(card => card && card.cardUid === cardUid) || null;
}

function gameCardPreviewCardFromUnit(unit) {
  if (!unit) return null;
  if (typeof buildUnitCardFromBlueprint === "function") return buildUnitCardFromBlueprint(unit);
  return {
    id: `UNIT:${unit.id || unit.name || "preview"}`,
    sourceId: unit.id || unit.name || "preview",
    sourceType: "unit",
    cardType: unit.type === "Comandante" ? "commander" : "unit",
    deckRole: unit.weight === "Pivot" ? "pivot" : (unit.weight === "Elite" ? "elite" : "base"),
    starterRole: null,
    faction: unit.faction,
    name: unit.name,
    cost: unit.cost,
    unitType: unit.type,
    weight: unit.weight,
    blueprintId: unit.id || null,
    tacticId: null
  };
}

function syncGameHandPreviewSelectionUi() {
  if (typeof document === "undefined") return;
  const uid = String(GAME_CARD_PREVIEW_STATE.handCardUid || "");
  document.querySelectorAll("[data-preview-card-uid]").forEach(el => {
    if (!el || !el.classList) return;
    el.classList.toggle("previewSelected", uid && el.getAttribute("data-preview-card-uid") === uid);
  });
}

function gameCardPreviewSelectHandCard(side, cardUid, source = "hand") {
  if (!gameCardPreviewCardByUid(side, cardUid)) return "";
  GAME_CARD_PREVIEW_STATE.handSide = Number(side || 0) || 0;
  GAME_CARD_PREVIEW_STATE.handCardUid = String(cardUid || "");
  GAME_CARD_PREVIEW_STATE.handSource = String(source || "hand");
  syncGameHandPreviewSelectionUi();
  renderInGameHandCardPreview();
  return GAME_CARD_PREVIEW_STATE.handCardUid;
}

function gameCardPreviewSelectedHandUid() {
  return String(GAME_CARD_PREVIEW_STATE.handCardUid || "");
}

function gameCardPreviewEnsureDefaultHandCard(side) {
  if (!state || !side) return null;
  const current = gameCardPreviewCardByUid(side, GAME_CARD_PREVIEW_STATE.handCardUid);
  if (current) return current;
  const hand = state.hand && state.hand[side]
    ? state.hand[side].filter(card => !(typeof handCardHiddenFromViewer === "function" && handCardHiddenFromViewer(side, card)) && !(typeof missionCardHiddenFromViewer === "function" && missionCardHiddenFromViewer(side, card)))
    : [];
  if (hand.length) {
    GAME_CARD_PREVIEW_STATE.handSide = side;
    GAME_CARD_PREVIEW_STATE.handCardUid = hand[0].cardUid || "";
    GAME_CARD_PREVIEW_STATE.handSource = "hand";
    return hand[0];
  }
  const starters = state.starterCards && state.starterCards[side] ? Object.values(state.starterCards[side]).filter(Boolean) : [];
  if (starters.length) {
    GAME_CARD_PREVIEW_STATE.handSide = side;
    GAME_CARD_PREVIEW_STATE.handCardUid = starters[0].cardUid || "";
    GAME_CARD_PREVIEW_STATE.handSource = "starter";
    return starters[0];
  }
  GAME_CARD_PREVIEW_STATE.handSide = side;
  GAME_CARD_PREVIEW_STATE.handCardUid = "";
  GAME_CARD_PREVIEW_STATE.handSource = "";
  return null;
}

function gameCardPreviewBodyHtml(card, context = "hand") {
  if (!card) return `<div class="deckBuilderPreviewHelp">Nessuna carta selezionata.</div>`;
  const desc = cardRendererNormalizeDescription(cardRendererDescriptionText(card));
  const role = typeof deckBuilderRoleLabel === "function" ? deckBuilderRoleLabel(card) : (card.deckRole || "—");
  const prefix = context === "unit" ? "Unità in campo" : "Carta selezionata";
  return `
    <div class="deckBuilderPreviewStats">
      <span><strong>${prefix}</strong> ${dbEscapeHtml(card.name || "—")}</span>
      <span><strong>Ruolo</strong> ${dbEscapeHtml(role)}</span>
      <span><strong>Tipo</strong> ${dbEscapeHtml(cardRendererTypeText(card))}</span>
      <span><strong>ENE</strong> ${Number.isFinite(cardRendererStat(card, "cost")) ? cardRendererStat(card, "cost") : "—"}</span>
      ${!cardRendererUsesTacticLayout(card) ? `<span><strong>HP</strong> ${Number.isFinite(cardRendererStat(card, "hp")) ? cardRendererStat(card, "hp") : "—"}</span>
      <span><strong>DEF</strong> ${Number.isFinite(cardRendererStat(card, "def")) ? cardRendererStat(card, "def") : "—"}</span>
      <span><strong>ATT</strong> ${Number.isFinite(cardRendererStat(card, "att")) ? cardRendererStat(card, "att") : "—"}</span>` : ""}
    </div>
    <div class="deckBuilderPreviewDesc">${dbEscapeHtml(desc || "Nessun testo carta disponibile nel catalogo.")}</div>
    ${cardRendererPassiveBadgesHtml(card, dbEscapeHtml)}`;
}

function renderInGameHandCardPreview() {
  if (typeof document === "undefined" || !state) return null;
  const canvas = document.getElementById("gameHandCardPreviewCanvas");
  const meta = document.getElementById("gameHandCardPreviewMeta");
  const body = document.getElementById("gameHandCardPreviewBody");
  if (!canvas || !meta || !body) return null;
  const side = GAME_CARD_PREVIEW_STATE.handSide || state.currentPlayer || 1;
  const card = gameCardPreviewCardByUid(side, GAME_CARD_PREVIEW_STATE.handCardUid) || gameCardPreviewEnsureDefaultHandCard(side);
  renderArenaCardPreviewCanvas(canvas, card || null);
  meta.textContent = card
    ? `${card.faction || "—"} · ${cardRendererSourceTypeLabel(card)} · ${card.id || ""}`
    : "Seleziona una carta dalla mano o una starter card per vedere l'anteprima.";
  body.innerHTML = gameCardPreviewBodyHtml(card, "hand");
  syncGameHandPreviewSelectionUi();
  return card;
}

function renderSelectedUnitCardPreview(unit) {
  if (typeof document === "undefined") return null;
  const canvas = document.getElementById("selectedUnitCardPreviewCanvas");
  const meta = document.getElementById("selectedUnitCardPreviewMeta");
  const body = document.getElementById("selectedUnitCardPreviewBody");
  if (!canvas || !meta || !body) return null;
  const card = unit ? cardRendererHydrateCard(gameCardPreviewCardFromUnit(unit)) : null;
  GAME_CARD_PREVIEW_STATE.selectedUnitUid = unit && unit.uid ? unit.uid : "";
  renderArenaCardPreviewCanvas(canvas, card || null);
  meta.textContent = card
    ? `${card.faction || "—"} · carta base di ${card.name || "Unità"}`
    : "Seleziona una unità sulla mappa per vedere la miniatura renderizzata.";
  body.innerHTML = gameCardPreviewBodyHtml(card, "unit");
  return card;
}

function renderDeckBuilderCardPreview(report) {
  if (typeof document === "undefined") return null;
  const canvas = document.getElementById("deckBuilderCardPreviewCanvas");
  const meta = document.getElementById("deckBuilderCardPreviewMeta");
  const body = document.getElementById("deckBuilderCardPreviewBody");
  const card = cardRendererHydrateCard(deckBuilderPreviewCardFromReport(report));
  if (card) cardRendererSelectCard(card.id, "deckBuilder");
  renderArenaCardPreviewCanvas(canvas, card);
  if (meta) {
    meta.textContent = card
      ? `${card.faction || "—"} · ${cardRendererSourceTypeLabel(card)} · ${card.id || ""}`
      : "Nessuna carta selezionata.";
  }
  if (body) {
    if (!card) {
      body.innerHTML = `<div class="deckBuilderPreviewHelp">Seleziona una riga dal draft o dal pool per vedere l'anteprima della carta.</div>`;
    } else {
      const entry = typeof cardAssetEntryFor === "function" ? cardAssetEntryFor(card) : null;
      const desc = cardRendererNormalizeDescription(cardRendererDescriptionText(card));
      body.innerHTML = `
        <div class="deckBuilderPreviewStats">
          <span><strong>Ruolo</strong> ${dbEscapeHtml(typeof deckBuilderRoleLabel === "function" ? deckBuilderRoleLabel(card) : (card.deckRole || "—"))}</span>
          <span><strong>Tipo</strong> ${dbEscapeHtml(cardRendererTypeText(card))}</span>
          <span><strong>ENE</strong> ${Number.isFinite(cardRendererStat(card, "cost")) ? cardRendererStat(card, "cost") : "—"}</span>
          ${!cardRendererUsesTacticLayout(card) ? `<span><strong>HP</strong> ${Number.isFinite(cardRendererStat(card, "hp")) ? cardRendererStat(card, "hp") : "—"}</span>
          <span><strong>DEF</strong> ${Number.isFinite(cardRendererStat(card, "def")) ? cardRendererStat(card, "def") : "—"}</span>
          <span><strong>ATT</strong> ${Number.isFinite(cardRendererStat(card, "att")) ? cardRendererStat(card, "att") : "—"}</span>` : ""}
        </div>
        <div class="deckBuilderPreviewDesc">${dbEscapeHtml(desc || "Nessun testo carta disponibile nel catalogo.")}</div>
        ${cardRendererPassiveBadgesHtml(card, dbEscapeHtml)}
        <div class="deckBuilderPreviewPaths">
          <div><strong>Frame:</strong> <code>${dbEscapeHtml(entry && entry.framePath || "")}</code></div>
          <div><strong>Art preferita:</strong> <code>${dbEscapeHtml(entry && entry.artPath || "")}</code></div>
          <div><strong>Fallback art:</strong> <code>${dbEscapeHtml(entry && entry.artCandidatePaths ? entry.artCandidatePaths.join(" | ") : "")}</code></div>
          <div><strong>File ID:</strong> <code>${dbEscapeHtml(entry && entry.fileId || "")}</code>${entry && entry.rawFileId && entry.rawFileId !== entry.fileId ? ` · raw <code>${dbEscapeHtml(entry.rawFileId)}</code>` : ""}</div>
          <div><strong>Formato art:</strong> <code>${dbEscapeHtml(entry && entry.recommendedArtSize || "")}</code> · <code>${dbEscapeHtml(entry && entry.recommendedHighResArtSize || "")}</code> · <code>${dbEscapeHtml(entry && entry.recommendedColorDepth || "")}</code></div>
          <div><strong>Placeholder:</strong> <code>${dbEscapeHtml(entry && entry.placeholderPath || "")}</code></div>
        </div>`;
    }
  }
  return card;
}
