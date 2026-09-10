"use strict";

// AR-AC1 - deterministic Advanced AI score aggregation and move selection.
// Faction-specific scoring and context construction remain behind explicit ports.
function createAiMoveSelectionService(dependencies = {}) {
  const {
    getFactionMoveBaseScore,
    getExpertFactionMoveBonus,
    getStrategicStatus,
    createMoveContext,
    scoreCandidate
  } = dependencies;

  function botAdvancedMoveScoreF9T0(entry, context) {
    const emergencyWeight = context.status.active ? 0.85 : 0;
    return getFactionMoveBaseScore(entry, context)
      + entry.generalScore
      + entry.factionDoctrineScore
      + entry.homeScore
      + entry.emergencyScore * emergencyWeight
      + entry.c2e3Score * 0.35
      + entry.missionScore
      + entry.stallScore
      + getExpertFactionMoveBonus(context.unit, entry.coord, context);
  }

  function chooseAdvancedMove(unit, options, cachedStatus = null) {
    const status = cachedStatus || getStrategicStatus(unit.side);
    const context = createMoveContext(unit, options, status);
    let best = null;
    for (const entry of context.candidates) {
      const score = scoreCandidate(entry, context);
      const tie = entry.enemyHqDistance * 0.001 + String(entry.coord.join(",")).length * 0.000001;
      if (!best || score > best.score || (score === best.score && tie < best.tie)) best = { coord:entry.coord, score, tie };
    }
    return best ? best.coord : null;
  }

  return Object.freeze({ botAdvancedMoveScoreF9T0, chooseAdvancedMove });
}
