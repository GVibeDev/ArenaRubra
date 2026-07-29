"use strict";

// Arena Rubra — F9O5 Miniature Taxonomy & Asset Completion.
// Tassonomia progettuale separata dal campo legacy `weight`, ancora usato da
// alcune regole runtime. Gli Starter hanno unitClass="starter" ma conservano
// il loro peso funzionale (Leggera/Pesante) per interazioni e cap esistenti.

const UNIT_TAXONOMY_SCHEMA_F9O5 = "arena-rubra-unit-taxonomy-f9o5-v1";

const UNIT_TAXONOMY_CLASS_LABELS_F9O5 = Object.freeze({
  starter: "Starter",
  light: "Leggera",
  heavy: "Pesante",
  elite: "Elite",
  pivot: "Pivot",
  commander: "Comandante"
});

const UNIT_STARTER_ROLE_BY_ID_F9O5 = Object.freeze({
  NX2B01: "starter_infantry",
  NX3B01: "starter_vehicle",
  NXC1F07: "starter_structure",
  EX1B01: "starter_infantry",
  EXC1F04: "starter_vehicle",
  EX4B02: "starter_structure",
  LX2B01: "starter_infantry",
  LX3B02: "starter_vehicle",
  LX4B01: "starter_structure",
  AG1B01: "starter_infantry",
  AG2B01: "starter_vehicle",
  AG4B01: "starter_structure",
  FB1B01: "starter_infantry",
  FB2B01: "starter_vehicle",
  FB4B01: "starter_structure"
});

const UNIT_TAXONOMY_TRAIT_KEYS_F9O5 = Object.freeze({
  SUPERIORITY: "superiority_numeric",
  BLEED: "bleed",
  BLEED_IMMUNE: "bleed_immune",
  VANGUARD: "vanguard",
  THORNS: "thorns"
});

function unitTaxonomyLegacyWeightKeyF9O5(weight) {
  const clean = String(weight || "").trim().toLowerCase();
  if (clean.startsWith("legger")) return "light";
  if (clean.startsWith("pesant")) return "heavy";
  if (clean === "elite") return "elite";
  if (clean === "pivot") return "pivot";
  return "light";
}

function unitTaxonomyClassKeyForBlueprintF9O5(bp) {
  if (!bp) return "light";
  if (bp.type === "Comandante" || bp.role === "commander") return "commander";
  if (UNIT_STARTER_ROLE_BY_ID_F9O5[bp.id]) return "starter";
  return unitTaxonomyLegacyWeightKeyF9O5(bp.weight);
}

function unitTaxonomyTraitKeysForBlueprintF9O5(bp) {
  if (!bp) return [];
  const text = [bp.description, bp.ability && bp.ability.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const traits = new Set(Array.isArray(bp.traits) ? bp.traits : []);
  const deniesSuperiority = text.includes("non usa superiorità numerica") || text.includes("senza superiorità numerica");
  if (text.includes("superiorità numerica") && !deniesSuperiority) traits.add(UNIT_TAXONOMY_TRAIT_KEYS_F9O5.SUPERIORITY);
  if (text.includes("immune a sanguinamento")) traits.add(UNIT_TAXONOMY_TRAIT_KEYS_F9O5.BLEED_IMMUNE);
  else {
    const deniesBleed = text.includes("senza sanguinamento") || text.includes("non sanguinamento");
    const affirmsBleed = text.includes("applica sanguinamento") || text.includes("mantiene superiorità numerica e sanguinamento") || text.includes("mantiene il sanguinamento") || String(bp.id || "").includes("SANG");
    if (affirmsBleed && !deniesBleed) traits.add(UNIT_TAXONOMY_TRAIT_KEYS_F9O5.BLEED);
  }
  if (bp.vanguard === true || text.includes("avanguardia")) traits.add(UNIT_TAXONOMY_TRAIT_KEYS_F9O5.VANGUARD);
  if (text.includes("spine")) traits.add(UNIT_TAXONOMY_TRAIT_KEYS_F9O5.THORNS);
  return [...traits].sort();
}

function unitTaxonomyAbilityProfileF9O5(bp) {
  const traits = new Set(unitTaxonomyTraitKeysForBlueprintF9O5(bp));
  let active = 0;
  let passive = 0;
  if (bp && bp.ability) {
    if (bp.ability.passive === true) passive += 1;
    else active += 1;
  }
  if (Array.isArray(bp && bp.passives)) passive += bp.passives.length;

  // Numerose passive storiche sono codificate come campi/descrizione invece
  // che come `ability`. Le keyword congelate come traits non consumano il cap.
  const description = String(bp && bp.description || "").toLowerCase();
  const traitOnlyFragments = [
    "superiorità numerica", "sanguinamento", "avanguardia", "spine",
    "immune a sanguinamento"
  ];
  const residual = traitOnlyFragments.reduce((text, fragment) => text.split(fragment).join(""), description);
  const hasNonTraitPassive = /passiva|se adiacente|se non attacca|se termina|all'inizio|alba|movimento permanente|può costruire/.test(residual);
  if (!bp.ability && hasNonTraitPassive) passive += 1;

  return { active, passive, traits:[...traits] };
}

function unitTaxonomyApplyToBlueprintF9O5(bp) {
  if (!bp || !bp.id) return bp;
  const unitClass = unitTaxonomyClassKeyForBlueprintF9O5(bp);
  const legacyClass = unitTaxonomyLegacyWeightKeyF9O5(bp.weight);
  bp.unitClass = unitClass;
  bp.unitClassLabel = UNIT_TAXONOMY_CLASS_LABELS_F9O5[unitClass] || unitClass;
  bp.starterRole = UNIT_STARTER_ROLE_BY_ID_F9O5[bp.id] || null;
  bp.traits = unitTaxonomyTraitKeysForBlueprintF9O5(bp);
  bp.tokenClass = unitClass;
  bp.tokenAssetId = bp.tokenAssetId || String(bp.id).toLowerCase();
  bp.tokenVariant = Number.isFinite(bp.tokenVariant) ? bp.tokenVariant : 1;
  bp.tokenFallbackClass = bp.tokenFallbackClass || (unitClass === "starter" ? legacyClass : unitClass);
  bp.tokenAnimationProfile = bp.tokenAnimationProfile || unitClass;
  bp.taxonomySchema = UNIT_TAXONOMY_SCHEMA_F9O5;
  return bp;
}

function applyUnitTaxonomyF9O5(list = (typeof BLUEPRINTS !== "undefined" ? BLUEPRINTS : [])) {
  for (const bp of list || []) unitTaxonomyApplyToBlueprintF9O5(bp);
  return list;
}

function unitTaxonomyAuditF9O5(list = (typeof BLUEPRINTS !== "undefined" ? BLUEPRINTS : [])) {
  const errors = [];
  const warnings = [];
  const counts = { starter:0, light:0, heavy:0, elite:0, pivot:0, commander:0 };
  const starterRoles = { starter_infantry:0, starter_vehicle:0, starter_structure:0 };
  const ids = new Set();

  for (const bp of list || []) {
    if (!bp || !bp.id) { errors.push("Blueprint tassonomico senza ID."); continue; }
    if (ids.has(bp.id)) errors.push(`ID duplicato: ${bp.id}`);
    ids.add(bp.id);
    const cls = bp.unitClass || unitTaxonomyClassKeyForBlueprintF9O5(bp);
    if (!(cls in counts)) errors.push(`${bp.id}: classe sconosciuta ${cls}`);
    else counts[cls] += 1;
    if (bp.starterRole) starterRoles[bp.starterRole] = (starterRoles[bp.starterRole] || 0) + 1;

    const cost = Number(bp.cost);
    if (!Number.isFinite(cost)) errors.push(`${bp.id}: costo ENE non numerico.`);
    else if (cls === "light" && bp.type === "Struttura" && cost > 3) errors.push(`${bp.id}: Struttura Leggera con costo ${cost} > 3.`);
    else if (cls === "light" && bp.type !== "Struttura" && cost > 2) errors.push(`${bp.id}: Leggera con costo ${cost} > 2.`);
    else if (cls === "heavy" && (cost < 2 || cost > 4)) errors.push(`${bp.id}: Pesante con costo ${cost}, atteso 2–4.`);
    else if (cls === "elite" && (cost < 3 || cost > 5)) errors.push(`${bp.id}: Elite con costo ${cost}, atteso 3–5.`);
    else if (cls === "pivot" && cost < 4) errors.push(`${bp.id}: Pivot con costo ${cost} < 4.`);
    else if (cls === "commander" && cost > 5) errors.push(`${bp.id}: Comandante con costo ${cost} > 5.`);

    const profile = unitTaxonomyAbilityProfileF9O5(bp);
    if (cls === "light" && profile.active + profile.passive > 1) {
      errors.push(`${bp.id}: Leggera con ${profile.active} attive + ${profile.passive} passive.`);
    }
    if (cls === "heavy" && (profile.active > 1 || profile.passive > 1)) {
      errors.push(`${bp.id}: Pesante con ${profile.active} attive + ${profile.passive} passive.`);
    }
    if (!bp.tokenAssetId || !bp.tokenClass || !bp.tokenAnimationProfile) {
      errors.push(`${bp.id}: metadati token incompleti.`);
    }
  }

  for (const faction of ["Nexus", "Exordium", "Liberti", "Agathoi", "Fabeot"]) {
    const factionRows = (list || []).filter(bp => bp && bp.faction === faction);
    for (const role of Object.keys(starterRoles)) {
      const found = factionRows.filter(bp => bp.starterRole === role).length;
      if (found !== 1) errors.push(`${faction}: ${role} ${found}/1.`);
    }
  }

  return {
    schema: UNIT_TAXONOMY_SCHEMA_F9O5,
    total: (list || []).length,
    counts,
    starterRoles,
    errors,
    warnings,
    ok: errors.length === 0
  };
}

applyUnitTaxonomyF9O5();
