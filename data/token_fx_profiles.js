"use strict";

// Arena Rubra — F9O5a Token Motion & SFX Evaluation profiles.
// Profilazione esclusivamente visuale/sonora: non modifica statistiche,
// targeting, IA, costi o regole. I profili sono volutamente riutilizzabili.

const TOKEN_FX_PROFILE_SCHEMA_F9O5A = "arena-rubra-token-fx-f9o5a-v1";

const TOKEN_FX_PROFILE_LABELS_F9O5A = Object.freeze({
  ballistic_light: "Balistico leggero",
  ballistic_heavy: "Balistico pesante",
  energy: "Energia",
  organic: "Organico",
  occult: "Occulto / conversione",
  structure: "Struttura armata",
  support: "Supporto",
  melee: "Corpo a corpo"
});

function tokenFxAbilityLooksSupportF9O5a(bp) {
  const ability = bp && bp.ability ? bp.ability : null;
  const text = `${ability && ability.kind || ""} ${ability && ability.name || ""} ${ability && ability.description || ""}`.toLowerCase();
  return /heal|cura|def|shield|scudo|buff|support|logistic|income|draw|pesca|riprist|protezione|campo/.test(text);
}

function tokenFxAbilityLooksOccultF9O5a(bp) {
  const ability = bp && bp.ability ? bp.ability : null;
  const text = `${ability && ability.kind || ""} ${ability && ability.name || ""} ${ability && ability.description || ""}`.toLowerCase();
  return /convert|corru|march|stealth|furtiv|stun|blocc|ipnosi|tradiment|espropr|stasi|disloc/.test(text);
}

function tokenFxProfileKeyForBlueprintF9O5a(bp) {
  if (!bp) return "ballistic_light";
  if (tokenFxAbilityLooksSupportF9O5a(bp)) return "support";
  if (bp.faction === "Agathoi") return "organic";
  if (bp.faction === "Fabeot" || tokenFxAbilityLooksOccultF9O5a(bp)) return "occult";
  if (bp.type === "Struttura") return "structure";
  if (bp.faction === "Nexus") return bp.type === "Fanteria" && bp.unitClass !== "elite" ? "energy" : "ballistic_heavy";
  if (bp.faction === "Liberti" && bp.type === "Fanteria") return "melee";
  if (["heavy", "elite", "pivot", "commander"].includes(bp.unitClass) || bp.type === "Veicolo") return "ballistic_heavy";
  return "ballistic_light";
}

function applyTokenFxProfilesF9O5a(list = (typeof BLUEPRINTS !== "undefined" ? BLUEPRINTS : [])) {
  for (const bp of list || []) {
    if (!bp || !bp.id) continue;
    const profile = tokenFxProfileKeyForBlueprintF9O5a(bp);
    bp.tokenAnimationProfile = profile;
    bp.tokenFxProfile = profile;
    bp.sfxProfile = profile;
    bp.tokenFxSchema = TOKEN_FX_PROFILE_SCHEMA_F9O5A;
  }
  return list;
}

function tokenFxProfileAuditF9O5a(list = (typeof BLUEPRINTS !== "undefined" ? BLUEPRINTS : [])) {
  const counts = {};
  const errors = [];
  for (const bp of list || []) {
    if (!bp || !bp.id) { errors.push("Blueprint senza ID."); continue; }
    const key = bp.tokenFxProfile || tokenFxProfileKeyForBlueprintF9O5a(bp);
    if (!TOKEN_FX_PROFILE_LABELS_F9O5A[key]) errors.push(`${bp.id}: profilo FX sconosciuto ${key}.`);
    counts[key] = (counts[key] || 0) + 1;
  }
  return { schema:TOKEN_FX_PROFILE_SCHEMA_F9O5A, total:(list || []).length, counts, errors, ok:errors.length === 0 };
}

applyTokenFxProfilesF9O5a();
