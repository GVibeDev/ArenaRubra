"use strict";

// AR-AC1 - read-only Advanced AI perception of the canonical Pressure rules.
// Mutable game state and late-loaded rule facades enter through explicit ports;
// src/ai.js retains the historical global functions used by Advanced/Expert AI.
function createAiPressurePerceptionService(dependencies = {}) {
  const {
    getState,
    getPressureRuleProfile,
    getCenterPsCell,
    hasCentralControlQuery,
    queryCentralControl,
    getPressureStartRound,
    getPressureWinLimit,
    getMaxRoundLimit
  } = dependencies;

  function botTotalPsCount() {
    const state = getState();
    return state && Array.isArray(state.cells) ? state.cells.filter(cell => cell.ps).length : 3;
  }

  function botPressureProfileF9T0() {
    const profile = getPressureRuleProfile();
    const totalPs = Math.max(1, Number(profile && profile.totalPs) || botTotalPsCount() || 1);
    const requiredPs = Math.max(1, Number(profile && profile.requiredPs) || Math.ceil(totalPs / 2));
    return {
      totalPs,
      requiredPs,
      centralCoord: profile && Array.isArray(profile.centralCoord)
        ? [...profile.centralCoord]
        : (getCenterPsCell() ? [...getCenterPsCell().coord] : null),
      startRound: Number(profile && profile.startRound) || getPressureStartRound(),
      pressureWin: Number(profile && profile.pressureWin) || getPressureWinLimit(),
      maxRound: Number(profile && profile.maxRound) || getMaxRoundLimit()
    };
  }

  function botControlsCentralF9T0(player, profile = botPressureProfileF9T0()) {
    if (hasCentralControlQuery()) return queryCentralControl(player, profile);
    const center = getCenterPsCell();
    return Boolean(center && center.control === player);
  }

  return Object.freeze({
    botTotalPsCount,
    botPressureProfileF9T0,
    botControlsCentralF9T0
  });
}
