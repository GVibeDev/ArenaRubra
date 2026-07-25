"use strict";

// Arena Rubra – C1a
// Card helpers.
// Questa fondazione genera un catalogo carte dai blueprint/tattiche esistenti.
// Modalità passiva: non sostituisce ancora mercato o tattiche attuali.


const CARD_STARTER_ROLE_FALLBACK_F9O5 = Object.freeze({
  NX2B01:"starter_infantry", NX3B01:"starter_vehicle", NXC1F07:"starter_structure",
  EX1B01:"starter_infantry", EXC1F04:"starter_vehicle", EX4B02:"starter_structure",
  LX2B01:"starter_infantry", LX3B02:"starter_vehicle", LX4B01:"starter_structure",
  AG1B01:"starter_infantry", AG2B01:"starter_vehicle", AG4B01:"starter_structure",
  FB1B01:"starter_infantry", FB2B01:"starter_vehicle", FB4B01:"starter_structure"
});

function normalizeCardString(value) {
  return String(value || "").trim();
}

function normalizedWeight(value) {
  return normalizeCardString(value).toLowerCase();
}

function isLightBlueprint(bp) {
  return normalizedWeight(bp && bp.weight).startsWith("legger");
}

function isHeavyBlueprint(bp) {
  return normalizedWeight(bp && bp.weight).startsWith("pesant");
}

function isEliteBlueprint(bp) {
  return bp && bp.weight === "Elite";
}

function isPivotBlueprint(bp) {
  return bp && bp.weight === "Pivot";
}

function cardTypeForBlueprint(bp) {
  if (!bp) return "unknown";
  if (bp.type === "Comandante") return "commander";
  if (bp.weight === "Pivot") return "pivot";
  if (bp.type === "Struttura") return "unit_structure";
  if (bp.type === "Fanteria") return "unit_infantry";
  if (bp.type === "Veicolo") return "unit_vehicle";
  return "unit";
}

function cardStarterRoleForBlueprint(bp) {
  if (!bp || bp.type === "QG") return null;
  if (bp.starterRole) return bp.starterRole;
  if (typeof UNIT_STARTER_ROLE_BY_ID_F9O5 !== "undefined" && UNIT_STARTER_ROLE_BY_ID_F9O5[bp.id]) return UNIT_STARTER_ROLE_BY_ID_F9O5[bp.id];
  return CARD_STARTER_ROLE_FALLBACK_F9O5[bp.id] || null;
}

function deckRoleForBlueprint(bp) {
  if (!bp || bp.type === "QG") return null;
  const cls = String(bp.unitClass || "").toLowerCase();
  if (cls === "commander" || bp.type === "Comandante") return "commander";
  if (cls === "pivot" || bp.weight === "Pivot") return "pivot";
  if (cls === "elite" || isEliteBlueprint(bp)) return "elite";
  if (cls === "heavy" || isHeavyBlueprint(bp)) return "heavy";
  return "base";
}

function buildUnitCardFromBlueprint(bp) {
  const deckRole = deckRoleForBlueprint(bp);
  const starterRole = cardStarterRoleForBlueprint(bp);
  return {
    id: `UNIT:${bp.id}`,
    sourceId: bp.id,
    sourceType: "unit",
    cardType: cardTypeForBlueprint(bp),
    deckRole,
    starterRole,
    faction: bp.faction,
    name: bp.name,
    cost: bp.cost,
    unitType: bp.type,
    weight: bp.weight,
    unitClass: bp.unitClass || null,
    unitClassLabel: bp.unitClassLabel || null,
    traits: Array.isArray(bp.traits) ? [...bp.traits] : [],
    tokenClass: bp.tokenClass || null,
    tokenAssetId: bp.tokenAssetId || null,
    tokenVariant: Number.isFinite(bp.tokenVariant) ? bp.tokenVariant : 1,
    tokenFallbackClass: bp.tokenFallbackClass || null,
    tokenAnimationProfile: bp.tokenAnimationProfile || null,
    blueprintId: bp.id,
    tacticId: null,
    passiveOnly: true
  };
}

function buildTacticCardFromTactic(tactic) {
  return {
    id: `TACTIC:${tactic.id}`,
    sourceId: tactic.id,
    sourceType: "tactic",
    cardType: "tactic",
    deckRole: "tactic",
    starterRole: null,
    faction: tactic.faction,
    name: tactic.name,
    cost: tactic.cost,
    unitType: null,
    weight: null,
    blueprintId: null,
    tacticId: tactic.id,
    quality: tactic.quality || "",
    category: tactic.category || "",
    target: tactic.target || "",
    targetDomain: tactic.targetDomain || "",
    targetSide: tactic.targetSide || "",
    rangeMode: tactic.rangeMode || "none",
    range: tactic.range,
    condition: tactic.condition || "",
    effectText: tactic.effectText || tactic.description || "",
    duration: tactic.duration || "",
    effectKind: tactic.effectKind || "",
    implementationStatus: tactic.implementationStatus || "data_only",
    notes: tactic.notes || "",
    passiveOnly: true
  };
}

function buildMissionCardFromDefinition(mission) {
  return {
    id:`MISSION:${mission.id}`,
    sourceId:mission.id,
    sourceType:"mission",
    cardType:"mission",
    deckRole:"mission",
    starterRole:null,
    faction:mission.faction,
    name:mission.name,
    cost:Number.isFinite(mission.cost) ? mission.cost : 0,
    missionId:mission.id,
    missionClass:mission.missionClass === "desperate" ? "desperate" : "ordinary",
    quality:mission.missionClass === "desperate" ? "Missione disperata" : "Missione ordinaria",
    category:"Missione",
    objectives:(mission.objectives || []).map(item => ({...item})),
    conditions:(mission.conditions || []).map(item => ({...item})),
    reward:mission.reward ? {...mission.reward} : null,
    effectText:typeof missionCardRulesText === "function" ? missionCardRulesText(mission) : "",
    implementationStatus:"data_only",
    passiveOnly:true
  };
}

function buildCardCatalog() {
  const unitCards = (typeof BLUEPRINTS !== "undefined" ? BLUEPRINTS : [])
    .filter(bp => bp && bp.type !== "QG")
    .map(buildUnitCardFromBlueprint);

  // C2a: solo le tattiche deck pescabili entrano nel catalogo carte.
  // Le tattiche starter/base in TACTICS restano fuori deck e sono gestite dal vecchio pannello tattiche.
  const tacticCards = (typeof DECK_TACTICS !== "undefined" ? DECK_TACTICS : [])
    .filter(t => t && t.id)
    .map(buildTacticCardFromTactic);

  const missionCards = (typeof MISSION_DEFINITIONS !== "undefined" ? MISSION_DEFINITIONS : [])
    .filter(m => m && m.id)
    .map(buildMissionCardFromDefinition);

  return [...unitCards, ...tacticCards, ...missionCards].sort((a, b) => {
    const fa = String(a.faction || "").localeCompare(String(b.faction || ""));
    if (fa) return fa;
    const ta = String(a.cardType || "").localeCompare(String(b.cardType || ""));
    if (ta) return ta;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}

function cardById(cardId, catalog = null) {
  const list = catalog || buildCardCatalog();
  return list.find(card => card.id === cardId) || null;
}

function cardsForFaction(faction, catalog = null) {
  const list = catalog || buildCardCatalog();
  return list.filter(card => card.faction === faction);
}

function starterCardsForFaction(faction, catalog = null) {
  return cardsForFaction(faction, catalog).filter(card => Boolean(card.starterRole));
}

function missionCardsForFaction(faction, catalog = null) {
  return cardsForFaction(faction, catalog).filter(card => card && card.sourceType === "mission");
}

function commanderCardsForFaction(faction, catalog = null) {
  return cardsForFaction(faction, catalog)
    .filter(card => card && (card.cardType === "commander" || card.deckRole === "commander"))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}

function defaultCommanderBlueprintIdForFaction(faction, catalog = null) {
  const config = typeof CARD_CATALOG_CONFIG !== "undefined" ? CARD_CATALOG_CONFIG : {};
  const defaults = config.defaultCommanderByFaction || {};
  const configured = defaults[faction];
  const options = commanderCardsForFaction(faction, catalog);
  if (configured && options.some(card => card.blueprintId === configured)) return configured;
  return options.length ? options[0].blueprintId : null;
}

function commanderCardByBlueprintId(faction, blueprintId, catalog = null) {
  return commanderCardsForFaction(faction, catalog).find(card => card.blueprintId === blueprintId) || null;
}

function selectedCommanderBlueprintIdForSide(side, catalog = null) {
  const faction = state && state.factions ? state.factions[side] : null;
  if (!faction) return null;
  const selected = state && state.selectedCommanders ? state.selectedCommanders[side] : null;
  if (selected && commanderCardByBlueprintId(faction, selected, catalog)) return selected;
  return defaultCommanderBlueprintIdForFaction(faction, catalog);
}

function selectedCommanderCardForSide(side, catalog = null) {
  const faction = state && state.factions ? state.factions[side] : null;
  const commanderId = selectedCommanderBlueprintIdForSide(side, catalog);
  return commanderId ? commanderCardByBlueprintId(faction, commanderId, catalog) : null;
}

function deckStarterExclusionIdsForFaction(faction, catalog = null) {
  const config = typeof CARD_CATALOG_CONFIG !== "undefined" ? CARD_CATALOG_CONFIG : {};
  if (config.excludeStarterCardsFromDeck === false) return new Set();

  const list = cardsForFaction(faction, catalog)
    .filter(card => card && card.sourceType === "unit" && card.starterRole);
  const roles = Array.isArray(config.starterSlots)
    ? config.starterSlots.map(slot => slot && slot.key).filter(Boolean)
    : ["starter_infantry", "starter_vehicle", "starter_structure"];

  const ids = new Set();
  for (const role of roles) {
    const candidates = list
      .filter(card => card.starterRole === role)
      .sort((a, b) => (a.cost - b.cost) || String(a.name || "").localeCompare(String(b.name || "")));
    for (const candidate of candidates) ids.add(candidate.id);
  }
  return ids;
}

function deckPoolCardsForFaction(faction, catalog = null, options = {}) {
  const config = typeof CARD_CATALOG_CONFIG !== "undefined" ? CARD_CATALOG_CONFIG : {};
  const includes = config.deckIncludes || {};
  const selectedCommanderId = options.selectedCommanderId || defaultCommanderBlueprintIdForFaction(faction, catalog);
  const excludedStarterIds = options.excludeStarterCardsFromDeck === false
    ? new Set()
    : deckStarterExclusionIdsForFaction(faction, catalog);

  return cardsForFaction(faction, catalog).filter(card => {
    if (!card) return false;
    if (card.sourceType === "tactic") return includes.tactic !== false;
    if (card.sourceType === "mission") return includes.mission !== false;
    if (!card.deckRole) return false;
    if (card.sourceType === "unit" && excludedStarterIds.has(card.id)) return false;
    if (card.cardType === "commander" || card.deckRole === "commander") {
      return includes.commander !== false && card.blueprintId === selectedCommanderId;
    }
    return includes[card.deckRole] !== false;
  });
}

function cardDebugSummary(catalog = null) {
  const list = catalog || buildCardCatalog();
  const byFaction = {};
  for (const card of list) {
    byFaction[card.faction] = byFaction[card.faction] || { total: 0, deckPool: 0, starters: 0, tactics: 0, missions:0 };
    byFaction[card.faction].total += 1;
    if (card.deckRole) byFaction[card.faction].deckPool += 1;
    if (card.starterRole) byFaction[card.faction].starters += 1;
    if (card.sourceType === "tactic") byFaction[card.faction].tactics += 1;
    if (card.sourceType === "mission") byFaction[card.faction].missions += 1;
  }
  return {
    version: typeof CARD_CATALOG_CONFIG !== "undefined" ? CARD_CATALOG_CONFIG.version : "unknown",
    total: list.length,
    byFaction
  };
}
