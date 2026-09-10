"use strict";

// AR-AC1 - read-only faction maturity summaries consumed by Strategic Status.
// Runtime state and legacy AI queries enter only through late-bound read ports.
function createAiFactionMaturityService(dependencies = {}) {
  const {
    isNexusPlayer,
    isAgathoiPlayer,
    getControlledPsCells,
    getCombatUnits,
    getAgathoiStructures,
    getHexDistance,
    getAlliesNear,
    isUnitGarrisoningPs
  } = dependencies;

  function targetPsFor(profile) {
    return Math.max(1, Math.min(profile.requiredPs - 1, Math.ceil(profile.requiredPs / 2)));
  }

  function botNexusNetworkMaturityF9T0(player, profile) {
    if (!isNexusPlayer(player)) return { mature:false, controlled:0, structures:0, covered:0, mobile:0 };
    const controlled = getControlledPsCells(player);
    const structures = getCombatUnits(player).filter(unit => unit.faction === "Nexus" && unit.type === "Struttura");
    const mobile = getCombatUnits(player).filter(unit => unit.type !== "Struttura" && unit.type !== "QG").length;
    const covered = controlled.filter(ps => structures.some(structure => getHexDistance(structure.pos, ps.coord) <= 1) || getAlliesNear(ps.coord, player, 1).length >= 2).length;
    const targetPs = targetPsFor(profile);
    const requiredStructures = profile.requiredPs >= 3 ? 2 : 1;
    return {
      mature: controlled.length >= targetPs && structures.length >= requiredStructures && covered >= Math.min(targetPs, controlled.length) && mobile >= 3,
      controlled:controlled.length,
      structures:structures.length,
      covered,
      mobile,
      targetPs
    };
  }

  function botAgathoiGreenLineMaturityF9T0(player, profile) {
    if (!isAgathoiPlayer(player)) return { mature:false, controlled:0, structures:0, covered:0, mobile:0 };
    const controlled = getControlledPsCells(player);
    const structures = getAgathoiStructures(player);
    const mobileUnits = getCombatUnits(player).filter(unit => unit.type !== "Struttura" && unit.type !== "QG");
    const covered = controlled.filter(ps => structures.some(structure => getHexDistance(structure.pos, ps.coord) <= 2) || getAlliesNear(ps.coord, player, 1).length >= 2).length;
    const targetPs = targetPsFor(profile);
    const requiredStructures = profile.requiredPs >= 3 ? 2 : 1;
    const forwardReady = mobileUnits.filter(unit => !isUnitGarrisoningPs(unit)).length >= 2;
    return {
      mature: controlled.length >= targetPs && structures.length >= requiredStructures && covered >= Math.min(targetPs, controlled.length) && forwardReady,
      controlled:controlled.length,
      structures:structures.length,
      covered,
      mobile:mobileUnits.length,
      targetPs
    };
  }

  return Object.freeze({
    botNexusNetworkMaturityF9T0,
    botAgathoiGreenLineMaturityF9T0
  });
}
