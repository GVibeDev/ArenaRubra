"use strict";

// Arena Rubra – F9U1b Unit Inspector & PS/Unit Bars.
// UI-only: legge direttamente lo stato autorevole della partita.
// La telemetria registra i dati, ma non alimenta gli indicatori grafici.

const F9U1B_COMPARISON_STATE = {
  lastSignature: "",
  initialized: false
};

const F9U1B_FALLBACK_COLORS = Object.freeze(["#2b6fb8", "#b43a32", "#b88720", "#4f9d58", "#8a4fb0", "#73839a"]);

function f9u1bPlayerIds(matchState = (typeof state !== "undefined" ? state : null)) {
  if (!matchState) return [];
  const ids = [];
  if (typeof mapRuntimePlayerIds === "function") {
    try { ids.push(...mapRuntimePlayerIds(matchState)); } catch (err) {}
  }
  if (matchState.factions && typeof matchState.factions === "object") ids.push(...Object.keys(matchState.factions));
  if (Array.isArray(matchState.turnOrder)) ids.push(...matchState.turnOrder);
  return [...new Set(ids.map(Number).filter(side => Number.isFinite(side) && side > 0))].sort((a, b) => a - b);
}

function f9u1bFactionName(side, matchState = (typeof state !== "undefined" ? state : null)) {
  return matchState && matchState.factions && matchState.factions[side] ? String(matchState.factions[side]) : `G${side}`;
}

function f9u1bSideColor(side, matchState = (typeof state !== "undefined" ? state : null)) {
  try {
    const faction = f9u1bFactionName(side, matchState);
    if (typeof factionMeta === "function") {
      const meta = factionMeta(faction);
      if (meta && meta.color) return meta.color;
    }
  } catch (err) {}
  return F9U1B_FALLBACK_COLORS[(Math.max(1, Number(side) || 1) - 1) % F9U1B_FALLBACK_COLORS.length];
}

function f9u1bControlledPsCount(side, matchState = (typeof state !== "undefined" ? state : null)) {
  if (!matchState || !Array.isArray(matchState.cells)) return 0;
  return matchState.cells.reduce((total, cell) => total + (cell && cell.ps && Number(cell.control) === Number(side) ? 1 : 0), 0);
}

function f9u1bFieldUnitCount(side, matchState = (typeof state !== "undefined" ? state : null)) {
  if (!matchState || !Array.isArray(matchState.units)) return 0;
  return matchState.units.reduce((total, unit) => {
    if (!unit || Number(unit.side) !== Number(side) || unit.type === "QG") return total;
    const alive = unit.alive === true && Number(unit.currentHp) > 0 && Array.isArray(unit.pos);
    return total + (alive ? 1 : 0);
  }, 0);
}

function f9u1bComparisonSnapshot(matchState = (typeof state !== "undefined" ? state : null)) {
  const playerIds = f9u1bPlayerIds(matchState);
  if (!matchState || !playerIds.length) {
    return { playerIds:[], players:[], psTotal:0, psNeutral:0, unitTotal:0 };
  }
  const factionMultiplicity = {};
  for (const side of playerIds) {
    const faction = f9u1bFactionName(side, matchState);
    factionMultiplicity[faction] = (factionMultiplicity[faction] || 0) + 1;
  }
  const players = playerIds.map(side => {
    const faction = f9u1bFactionName(side, matchState);
    return {
      side,
      faction,
      label:`G${side} ${faction}`,
      color:f9u1bSideColor(side, matchState),
      duplicateFaction:factionMultiplicity[faction] > 1,
      ps:f9u1bControlledPsCount(side, matchState),
      units:f9u1bFieldUnitCount(side, matchState),
      eliminated:Boolean(matchState.players && matchState.players[side] && matchState.players[side].eliminated)
    };
  });
  const psTotal = Array.isArray(matchState.cells) ? matchState.cells.filter(cell => cell && cell.ps).length : 0;
  const controlledTotal = players.reduce((sum, player) => sum + player.ps, 0);
  return {
    playerIds,
    players,
    psTotal,
    psNeutral:Math.max(0, psTotal - controlledTotal),
    unitTotal:players.reduce((sum, player) => sum + player.units, 0)
  };
}

function f9u1bComparisonSignature(snapshot) {
  return JSON.stringify({
    p:snapshot.players.map(player => [player.side, player.faction, player.ps, player.units, player.eliminated]),
    pt:snapshot.psTotal,
    pn:snapshot.psNeutral,
    ut:snapshot.unitTotal
  });
}

function f9u1bClearNode(node) {
  if (!node) return;
  while (node.firstChild) node.removeChild(node.firstChild);
}

function f9u1bCreateSegment(entry, count, total, kind) {
  const segment = document.createElement("span");
  segment.className = `gameComparisonSegment${entry.duplicateFaction ? " isDuplicateFaction" : ""}${entry.eliminated ? " isEliminated" : ""}`;
  segment.style.setProperty("--comparison-color", entry.color);
  segment.style.setProperty("--comparison-stripe-angle", `${35 + (Number(entry.side) % 4) * 18}deg`);
  segment.style.flexGrow = String(Math.max(0, count));
  segment.dataset.side = String(entry.side);
  segment.dataset.value = String(count);
  const noun = kind === "ps" ? "PS" : "unità e strutture";
  segment.title = `${entry.label}: ${count} ${noun}`;
  segment.setAttribute("aria-label", segment.title);
  if (total <= 0 || count <= 0) segment.hidden = true;
  return segment;
}

function f9u1bCreateCounter(entry, count, kind) {
  const counter = document.createElement("span");
  counter.className = `gameComparisonCounter${entry.eliminated ? " isEliminated" : ""}`;
  counter.style.setProperty("--comparison-color", entry.color);
  counter.dataset.side = String(entry.side);
  const dot = document.createElement("i");
  dot.className = "gameComparisonCounterDot";
  dot.setAttribute("aria-hidden", "true");
  const text = document.createElement("b");
  text.textContent = `G${entry.side} ${count}`;
  counter.append(dot, text);
  const noun = kind === "ps" ? "Punti Strategici" : "unità e strutture";
  counter.title = `${entry.label}: ${count} ${noun}`;
  counter.setAttribute("aria-label", counter.title);
  return counter;
}

function f9u1bRenderRow(snapshot, kind) {
  const isPs = kind === "ps";
  const segments = document.getElementById(isPs ? "gameComparisonPsSegments" : "gameComparisonUnitSegments");
  const counters = document.getElementById(isPs ? "gameComparisonPsCounters" : "gameComparisonUnitCounters");
  const track = segments && segments.closest ? segments.closest(".gameComparisonTrack") : null;
  if (!segments || !counters) return;
  f9u1bClearNode(segments);
  f9u1bClearNode(counters);

  const total = isPs ? snapshot.psTotal : snapshot.unitTotal;
  for (const player of snapshot.players) {
    const count = isPs ? player.ps : player.units;
    segments.appendChild(f9u1bCreateSegment(player, count, total, kind));
    counters.appendChild(f9u1bCreateCounter(player, count, kind));
  }

  if (isPs) {
    const neutral = document.createElement("span");
    neutral.className = "gameComparisonSegment isNeutral";
    neutral.style.flexGrow = String(Math.max(0, snapshot.psNeutral));
    neutral.dataset.value = String(snapshot.psNeutral);
    neutral.title = `PS neutrali: ${snapshot.psNeutral}`;
    neutral.setAttribute("aria-label", neutral.title);
    neutral.hidden = snapshot.psNeutral <= 0 || total <= 0;
    segments.appendChild(neutral);

    const neutralCounter = document.createElement("span");
    neutralCounter.className = "gameComparisonCounter isNeutral";
    neutralCounter.innerHTML = '<i class="gameComparisonCounterDot" aria-hidden="true"></i><b>N ' + snapshot.psNeutral + '</b>';
    neutralCounter.title = `PS neutrali: ${snapshot.psNeutral}`;
    neutralCounter.setAttribute("aria-label", neutralCounter.title);
    counters.appendChild(neutralCounter);
  }

  segments.classList.toggle("isEmpty", total <= 0);
  if (track) {
    const summary = snapshot.players.map(player => `${player.label} ${isPs ? player.ps : player.units}`).join(", ");
    const neutralText = isPs ? `, neutrali ${snapshot.psNeutral}` : "";
    track.setAttribute("aria-label", `${isPs ? "PS" : "Unità"}: ${summary}${neutralText}`);
  }
}

function renderF9U1bComparisonBars(force = false) {
  if (typeof document === "undefined") return null;
  const root = document.getElementById("gameComparisonBars");
  if (!root) return null;
  const snapshot = f9u1bComparisonSnapshot();
  const signature = f9u1bComparisonSignature(snapshot);
  if (!force && signature === F9U1B_COMPARISON_STATE.lastSignature) return snapshot;
  F9U1B_COMPARISON_STATE.lastSignature = signature;
  f9u1bRenderRow(snapshot, "ps");
  f9u1bRenderRow(snapshot, "units");
  root.classList.toggle("isEmpty", snapshot.players.length === 0);
  return snapshot;
}

function initializeF9U1bUi() {
  if (typeof document === "undefined" || F9U1B_COMPARISON_STATE.initialized) return;
  F9U1B_COMPARISON_STATE.initialized = true;
  renderF9U1bComparisonBars(true);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeF9U1bUi, { once:true });
  else initializeF9U1bUi();
}
