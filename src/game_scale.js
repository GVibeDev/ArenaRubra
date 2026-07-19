"use strict";

// F9N3 - Game Scale Modes & HQ Deployment Foundation.
const GAME_SCALE_MODES = Object.freeze({ LARGE_SCALE:"large_scale", TACTICAL:"tactical" });
const TACTICAL_STARTER_CAP = 2;

function currentGameScaleMode() {
  return state && state.gameScaleMode === GAME_SCALE_MODES.TACTICAL ? GAME_SCALE_MODES.TACTICAL : GAME_SCALE_MODES.LARGE_SCALE;
}

function starterRoleForCardUid(side, cardUid) {
  if (!cardUid || !state || !state.starterCards || !state.starterCards[side]) return null;
  const card = Object.values(state.starterCards[side]).find(c => c && c.cardUid === cardUid);
  return card && card.starterRole ? card.starterRole : null;
}

function starterRoleForBlueprint(side, bp) {
  if (!bp || !state || !state.starterCards || !state.starterCards[side]) return null;
  const card = Object.values(state.starterCards[side]).find(c => c && c.blueprintId === bp.id);
  return card && card.starterRole ? card.starterRole : null;
}

function starterUnitsInField(side, role) {
  // F9O2e: il cap Starter considera soltanto pezzi realmente presenti sul campo.
  // Il controllo completo evita che una struttura distrutta, rimossa o in uno stato
  // intermedio con flag alive obsoleto continui a occupare lo slot tattico.
  const isActuallyInField = unit => {
    if (!unit) return false;
    if (typeof isFieldUnit === "function") return isFieldUnit(unit);
    // Fallback per test/strumenti che usano fixture minime: se HP/pos non sono
    // dichiarati, il flag alive resta sufficiente; se sono presenti, devono essere validi.
    const hpOk = unit.currentHp == null || Number(unit.currentHp) > 0;
    const posOk = unit.pos == null || Array.isArray(unit.pos);
    return unit.alive === true && hpOk && posOk && unit.type !== "QG";
  };
  return (state && Array.isArray(state.units) ? state.units : []).filter(u =>
    isActuallyInField(u)
    && u.side === side
    && u.spawnSource === "starter"
    && u.starterRole === role
  );
}

function tacticalStarterCapState(side, role) {
  const count = starterUnitsInField(side, role).length;
  return { count, cap:TACTICAL_STARTER_CAP, blocked:currentGameScaleMode() === GAME_SCALE_MODES.TACTICAL && count >= TACTICAL_STARTER_CAP };
}

function noteTacticalStarterCapBlocked(side, role) {
  const bucket = state && state.f9n3Telemetry && state.f9n3Telemetry.tacticalCapBlocked;
  if (bucket && bucket[side] && role) bucket[side][role] = (bucket[side][role] || 0) + 1;
}

function markStarterOrigin(unit, side, role, paid) {
  if (!unit || !role) return;
  unit.spawnSource = "starter";
  unit.starterRole = role;
  const t = state && state.f9n3Telemetry;
  if (t && t.starterSpawned && t.starterSpawned[side]) t.starterSpawned[side][role] = (t.starterSpawned[side][role] || 0) + 1;
  if (t && t.starterEnergySpent) t.starterEnergySpent[side] = (t.starterEnergySpent[side] || 0) + Math.max(0, Number(paid) || 0);
}

function noteStarterDestroyed(unit) {
  if (!unit || unit.spawnSource !== "starter" || !unit.starterRole || unit._f9n3StarterDestroyedRecorded) return;
  unit._f9n3StarterDestroyedRecorded = true;
  const bucket = state && state.f9n3Telemetry && state.f9n3Telemetry.starterDestroyed;
  if (bucket && bucket[unit.side]) bucket[unit.side][unit.starterRole] = (bucket[unit.side][unit.starterRole] || 0) + 1;
}

function ownHqBuildCell(side) {
  const hq = state && typeof getHq === "function" ? getHq(side) : null;
  if (!hq || !Array.isArray(hq.pos) || !isCellEnterable(hq.pos) || getUnitAt(hq.pos)) return null;
  return [...hq.pos];
}

function canBuildFromOwnHq(side, bp) {
  return Boolean(state && bp && bp.type === "Struttura" && !state.winner && !playerEnergyLocked(side) && !purchaseLimitReached(side, bp) && ownHqBuildCell(side));
}
