"use strict";

// Arena Rubra – F9Q3d4 Elimination, Assist & Pressure Attribution.
// Questo modulo raccoglie in modo deterministico la provenienza del danno,
// assegna eliminazioni/assist e conserva una timeline FFA della Pressione.
// Non modifica i valori di danno, le soglie di Pressione o le condizioni di vittoria.

const FFA_ATTRIBUTION_SCHEMA_VERSION = "F9Q3d4-1";
const FFA_UNIT_ASSIST_WINDOW_ROUNDS = 2;
const FFA_PLAYER_ASSIST_WINDOW_ROUNDS = 3;

function ffaAttributionPlayerIds() {
  if (typeof mapRuntimePlayerIds === "function") return mapRuntimePlayerIds(typeof state !== "undefined" ? state : null);
  if (typeof state !== "undefined" && state && Array.isArray(state.players)) return state.players.map(player => Number(player.id)).filter(Boolean);
  return [1, 2];
}

function ensureFfaAttributionState() {
  if (typeof state === "undefined" || !state) return null;
  if (!state.ffaAttribution || typeof state.ffaAttribution !== "object") {
    state.ffaAttribution = {
      schemaVersion: FFA_ATTRIBUTION_SCHEMA_VERSION,
      damageByUnit: {},
      unitEliminations: [],
      playerEliminations: [],
      pressureTimeline: [],
      hostilityByPlayer: {}
    };
  }
  const data = state.ffaAttribution;
  data.schemaVersion = FFA_ATTRIBUTION_SCHEMA_VERSION;
  if (!data.damageByUnit || typeof data.damageByUnit !== "object") data.damageByUnit = {};
  if (!Array.isArray(data.unitEliminations)) data.unitEliminations = [];
  if (!Array.isArray(data.playerEliminations)) data.playerEliminations = [];
  if (!Array.isArray(data.pressureTimeline)) data.pressureTimeline = [];
  if (!data.hostilityByPlayer || typeof data.hostilityByPlayer !== "object") data.hostilityByPlayer = {};
  return data;
}

function ffaAttributionRound() {
  return typeof state !== "undefined" && state ? Number(state.turn || 0) : 0;
}

function ffaAttributionSeqHint() {
  return typeof state !== "undefined" && state ? Number(state.eventSeq || 0) + 1 : 0;
}

function ffaAttributionValidSide(side) {
  const value = Number(side);
  return Number.isInteger(value) && value > 0 && ffaAttributionPlayerIds().includes(value);
}

function ffaAttributionIsHostile(sourceSide, targetSide) {
  const source = Number(sourceSide);
  const target = Number(targetSide);
  return ffaAttributionValidSide(source) && ffaAttributionValidSide(target) && source !== target;
}

function ffaAttributionClassifyDamage(damageKind, options={}) {
  if (options && options.sacrifice) return "self";
  const kind = String(damageKind || "effect").toLowerCase();
  if (kind === "bleed" || kind === "persistent") return "persistent";
  if (kind === "hazard" || kind === "mine" || kind === "terrain") return "hazard";
  if (kind === "thorns" || kind === "reaction") return "reaction";
  if (kind === "attack" || kind === "ability" || kind === "tactic") return "direct";
  if (options && options.indirect) return "indirect";
  return "effect";
}

function ffaAttributionUnitLedger(unit, create=true) {
  const data = ensureFfaAttributionState();
  if (!data || !unit || !unit.uid) return null;
  if (!data.damageByUnit[unit.uid] && create) {
    data.damageByUnit[unit.uid] = {
      unitId: unit.uid,
      targetSide: Number(unit.side) || null,
      createdRound: ffaAttributionRound(),
      contributions: {},
      neutralDamage: 0,
      selfDamage: 0,
      lastDamage: null
    };
  }
  return data.damageByUnit[unit.uid] || null;
}

function ffaAttributionRecordDamage(target, details={}) {
  const ledger = ffaAttributionUnitLedger(target, true);
  if (!ledger || !target) return null;
  const defLoss = Math.max(0, Number(details.defLoss || 0));
  const hpLoss = Math.max(0, Number(details.hpLoss || 0));
  const amount = defLoss + hpLoss;
  if (amount <= 0) return null;

  const sourceSide = Number(details.sourceSide || 0) || null;
  const round = ffaAttributionRound();
  const seq = ffaAttributionSeqHint();
  const damageKind = String(details.damageKind || "effect");
  const source = String(details.source || "danno");
  const classification = ffaAttributionClassifyDamage(damageKind, details.options || {});

  if (ffaAttributionIsHostile(sourceSide, target.side)) {
    const key = String(sourceSide);
    const contribution = ledger.contributions[key] || {
      side: sourceSide,
      totalDamage: 0,
      hpDamage: 0,
      defDamage: 0,
      hits: 0,
      firstRound: round,
      lastRound: round,
      lastSeq: seq,
      sources: []
    };
    contribution.totalDamage += amount;
    contribution.hpDamage += hpLoss;
    contribution.defDamage += defLoss;
    contribution.hits += 1;
    contribution.lastRound = round;
    contribution.lastSeq = seq;
    if (!contribution.sources.includes(source)) contribution.sources.push(source);
    if (contribution.sources.length > 8) contribution.sources.shift();
    ledger.contributions[key] = contribution;
  } else if (sourceSide && Number(sourceSide) === Number(target.side)) {
    ledger.selfDamage += amount;
  } else {
    ledger.neutralDamage += amount;
  }

  ledger.lastDamage = {
    sourceSide,
    source,
    damageKind,
    classification,
    amount,
    defLoss,
    hpLoss,
    round,
    seq
  };
  return ledger.lastDamage;
}

function ffaAttributionRecentContributions(target, windowRounds=FFA_UNIT_ASSIST_WINDOW_ROUNDS) {
  const ledger = ffaAttributionUnitLedger(target, false);
  if (!ledger) return [];
  const round = ffaAttributionRound();
  return Object.values(ledger.contributions || {})
    .filter(entry => entry && ffaAttributionIsHostile(entry.side, target.side) && round - Number(entry.lastRound || 0) <= windowRounds)
    .sort((a, b) => Number(b.lastRound || 0) - Number(a.lastRound || 0)
      || Number(b.lastSeq || 0) - Number(a.lastSeq || 0)
      || Number(b.totalDamage || 0) - Number(a.totalDamage || 0)
      || Number(a.side || 0) - Number(b.side || 0));
}

function ffaAttributionBuildContributions(entries) {
  return (entries || []).map(entry => ({
    side: Number(entry.side),
    totalDamage: Number(entry.totalDamage || 0),
    hpDamage: Number(entry.hpDamage || 0),
    defDamage: Number(entry.defDamage || 0),
    hits: Number(entry.hits || 0),
    firstRound: Number(entry.firstRound || 0),
    lastRound: Number(entry.lastRound || 0),
    sources: Array.isArray(entry.sources) ? [...entry.sources] : []
  }));
}

function ffaAttributionRegisterHostility(victimSide, attackerSide, weight=1, meta={}) {
  const data = ensureFfaAttributionState();
  const victim = Number(victimSide);
  const attacker = Number(attackerSide);
  if (!data || !ffaAttributionIsHostile(attacker, victim)) return null;
  const victimKey = String(victim);
  const attackerKey = String(attacker);
  if (!data.hostilityByPlayer[victimKey]) data.hostilityByPlayer[victimKey] = {};
  const record = data.hostilityByPlayer[victimKey][attackerKey] || {
    attackerSide: attacker,
    score: 0,
    unitKills: 0,
    assists: 0,
    lastRound: ffaAttributionRound(),
    lastSeq: ffaAttributionSeqHint()
  };
  record.score += Math.max(0, Number(weight || 0));
  record.lastRound = ffaAttributionRound();
  record.lastSeq = ffaAttributionSeqHint();
  if (meta.kind === "kill") record.unitKills += 1;
  if (meta.kind === "assist") record.assists += 1;
  record.lastUnitId = meta.unitId || record.lastUnitId || null;
  data.hostilityByPlayer[victimKey][attackerKey] = record;
  return record;
}

function ffaAttributionResolveUnitDestruction(target, details={}) {
  const sourceSide = Number(details.sourceSide || 0) || null;
  const damageKind = String(details.damageKind || "effect");
  const source = String(details.source || "danno");
  const options = details.options || {};
  const recent = ffaAttributionRecentContributions(target);
  const hostileFinal = ffaAttributionIsHostile(sourceSide, target && target.side);
  const killerSide = hostileFinal ? sourceSide : null;
  const assistSides = killerSide
    ? recent.map(entry => Number(entry.side)).filter(side => side !== killerSide)
    : [];
  const uniqueAssistSides = [...new Set(assistSides)].sort((a, b) => a - b);
  const attributionType = killerSide
    ? ffaAttributionClassifyDamage(damageKind, options)
    : (sourceSide && target && Number(sourceSide) === Number(target.side) ? "self" : "unattributed");
  const result = {
    killerSide,
    assistSides: uniqueAssistSides,
    attributionType,
    damageKind,
    source,
    round: ffaAttributionRound(),
    contributions: ffaAttributionBuildContributions(recent)
  };

  const data = ensureFfaAttributionState();
  if (data && target) {
    data.unitEliminations.push({
      unitId: target.uid,
      unitName: target.name || "",
      victimSide: Number(target.side) || null,
      unitType: target.type || null,
      unitWeight: target.weight || null,
      ...result
    });
    if (data.unitEliminations.length > 500) data.unitEliminations.shift();
    if (killerSide) {
      let weight = 1;
      if (target.type === "Struttura") weight += 1;
      if (target.type === "Comandante" || target.weight === "Pivot") weight += 1;
      ffaAttributionRegisterHostility(target.side, killerSide, weight, { kind:"kill", unitId:target.uid });
      for (const assistSide of uniqueAssistSides) ffaAttributionRegisterHostility(target.side, assistSide, 0.5, { kind:"assist", unitId:target.uid });
    }
    delete data.damageByUnit[target.uid];
  }
  return result;
}

function ffaUnitDestroyedEventData(target, details={}) {
  const attribution = ffaAttributionResolveUnitDestruction(target, details);
  return {
    destroyedBySide: attribution.killerSide,
    killerSide: attribution.killerSide,
    assistSides: [...attribution.assistSides],
    attributionType: attribution.attributionType,
    damageKind: attribution.damageKind,
    attribution
  };
}

function ffaAttributionResolvePlayerElimination(playerId, conqueror=null, reason="eliminazione") {
  const data = ensureFfaAttributionState();
  const victim = Number(playerId);
  const requestedConqueror = Number(conqueror || 0) || null;
  const normalizedReason = String(reason || "eliminazione").toLowerCase();
  const creditsAllowed = !["concessione", "resa_tecnica", "abbandono"].includes(normalizedReason);
  const killerSide = creditsAllowed && ffaAttributionIsHostile(requestedConqueror, victim) ? requestedConqueror : null;
  const hostility = data && data.hostilityByPlayer[String(victim)] ? Object.values(data.hostilityByPlayer[String(victim)]) : [];
  const currentRound = ffaAttributionRound();
  const assistSides = killerSide
    ? hostility
      .filter(entry => entry && Number(entry.attackerSide) !== killerSide && currentRound - Number(entry.lastRound || 0) <= FFA_PLAYER_ASSIST_WINDOW_ROUNDS)
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0) || Number(b.lastRound || 0) - Number(a.lastRound || 0) || Number(a.attackerSide) - Number(b.attackerSide))
      .map(entry => Number(entry.attackerSide))
    : [];
  const uniqueAssistSides = [...new Set(assistSides)].sort((a, b) => a - b);
  let attributionType = "unattributed";
  if (normalizedReason === "qg" && killerSide) attributionType = "qg_capture";
  else if (normalizedReason === "concessione") attributionType = "concession";
  else if (normalizedReason === "resa_tecnica") attributionType = "technical_resignation";
  else if (killerSide) attributionType = "direct";

  const result = {
    player: victim,
    killerSide,
    conqueror: killerSide,
    assistSides: uniqueAssistSides,
    attributionType,
    reason: normalizedReason,
    round: currentRound,
    orderIndex: typeof state !== "undefined" && state ? Number(state.orderIndex || 0) : 0,
    hostility: hostility.map(entry => ({
      attackerSide: Number(entry.attackerSide),
      score: Number(entry.score || 0),
      unitKills: Number(entry.unitKills || 0),
      assists: Number(entry.assists || 0),
      lastRound: Number(entry.lastRound || 0)
    }))
  };
  if (data) {
    data.playerEliminations.push({ ...result });
    if (data.playerEliminations.length > 32) data.playerEliminations.shift();
  }
  return result;
}

function ffaAttributionRecordPressureEvaluation(payload={}) {
  const data = ensureFfaAttributionState();
  if (!data) return null;
  const entry = {
    round: Number(payload.round != null ? payload.round : ffaAttributionRound()),
    activePlayers: Array.isArray(payload.activePlayers) ? payload.activePlayers.map(Number) : [],
    eliminatedPlayers: Array.isArray(payload.eliminatedPlayers) ? payload.eliminatedPlayers.map(Number) : [],
    qualifiedPlayers: Array.isArray(payload.qualifiedPlayers) ? payload.qualifiedPlayers.map(Number) : [],
    advancingPlayer: Number(payload.advancingPlayer || 0) || null,
    outcome: payload.outcome || "unqualified",
    requiredPs: Number(payload.requiredPs || 0),
    totalPs: Number(payload.totalPs || 0),
    centralStrategicPointId: payload.centralStrategicPointId || null,
    standings: Array.isArray(payload.standings) ? payload.standings.map(entry => ({
      player: Number(entry.player),
      ps: Number(entry.ps || 0),
      controlsCentral: Boolean(entry.controlsCentral),
      pressure: Number(entry.pressure || 0)
    })) : []
  };
  data.pressureTimeline.push(entry);
  if (data.pressureTimeline.length > 200) data.pressureTimeline.shift();
  return entry;
}

function ffaAttributionSnapshot() {
  const data = ensureFfaAttributionState();
  if (!data) return null;
  return {
    schemaVersion: data.schemaVersion,
    unitEliminations: data.unitEliminations.map(entry => ({ ...entry, assistSides:[...(entry.assistSides || [])], contributions:(entry.contributions || []).map(item => ({...item, sources:[...(item.sources || [])]})) })),
    playerEliminations: data.playerEliminations.map(entry => ({ ...entry, assistSides:[...(entry.assistSides || [])], hostility:(entry.hostility || []).map(item => ({...item})) })),
    pressureTimeline: data.pressureTimeline.map(entry => ({ ...entry, activePlayers:[...(entry.activePlayers || [])], eliminatedPlayers:[...(entry.eliminatedPlayers || [])], qualifiedPlayers:[...(entry.qualifiedPlayers || [])], standings:(entry.standings || []).map(item => ({...item})) }))
  };
}
