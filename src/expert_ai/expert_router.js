"use strict";

// Un router, un solo modulo per turno Expert. Le altre quattro fazioni non vengono eseguite.
const EXPERT_FACTION_MODULE_IDS_F9T1 = Object.freeze({
  Nexus:"expert-nexus-f9t1",
  Exordium:"expert-exordium-f9t2d3",
  Liberti:"expert-liberti-f9t1",
  Agathoi:"expert-agathoi-f9t1",
  Fabeot:"expert-fabeot-f9t1"
});

function expertInvokeFactionModuleF9T1(faction, context) {
  switch (faction) {
    case "Nexus": return expertNexusModuleF9T1(context);
    case "Exordium": return typeof expertExordiumModuleF9T2c === "function" ? expertExordiumModuleF9T2c(context) : (typeof expertExordiumModuleF9T2b === "function" ? expertExordiumModuleF9T2b(context) : (typeof expertExordiumModuleF9T2a === "function" ? expertExordiumModuleF9T2a(context) : (typeof expertExordiumModuleF9T2 === "function" ? expertExordiumModuleF9T2(context) : expertExordiumModuleF9T1(context))));
    case "Liberti": return expertLibertiModuleF9T1(context);
    case "Agathoi": return expertAgathoiModuleF9T1(context);
    case "Fabeot": return expertFabeotModuleF9T1(context);
    default: return { moduleId:"expert-unsupported-f9t1", faction:String(faction || ""), plan:null, status:"unsupported", reason:"unsupported_faction" };
  }
}

function expertRouteFactionF9T1(context) {
  const faction = context && context.faction ? String(context.faction) : "";
  const startedAt = typeof expertNowF9T1 === "function" ? expertNowF9T1() : Date.now();
  let result;
  try {
    result = expertInvokeFactionModuleF9T1(faction, context);
  } catch (error) {
    result = { moduleId:EXPERT_FACTION_MODULE_IDS_F9T1[faction] || "expert-unsupported-f9t1", faction, plan:null, status:"error", reason:"module_exception", error:String(error && error.message ? error.message : error) };
  }
  const durationMs = Math.max(0, (typeof expertNowF9T1 === "function" ? expertNowF9T1() : Date.now()) - startedAt);
  return {
    faction,
    moduleId:String((result && result.moduleId) || EXPERT_FACTION_MODULE_IDS_F9T1[faction] || "expert-unsupported-f9t1"),
    invokedModules:1,
    durationMs:Number(durationMs.toFixed ? durationMs.toFixed(3) : durationMs),
    result:result || null
  };
}



function expertFactionRefreshPersistentCommitmentsF9T2d3(player, context) {
  if (!state || state.aiMode !== "expert") return null;
  const faction = state.factions && state.factions[player];
  if (faction === "Exordium" && typeof expertExordiumRefreshCommanderCommitmentF9T2d3 === "function") {
    return expertExordiumRefreshCommanderCommitmentF9T2d3(player, context);
  }
  return null;
}

// F9T2c: hook stretti verso il solo modulo della fazione attiva.
function expertFactionTryPrePurchasePlanStepF9T2a(player) {
  if (!state || state.aiMode !== "expert") return false;
  const faction = state.factions && state.factions[player];
  if (faction === "Exordium" && typeof expertExordiumTryPrePurchasePlanStepF9T2a === "function") return expertExordiumTryPrePurchasePlanStepF9T2a(player);
  return false;
}

function expertFactionRosterChoiceF9T2(player) {
  if (!state || state.aiMode !== "expert") return null;
  const faction = state.factions && state.factions[player];
  if (faction === "Exordium") {
    if (typeof expertExordiumRosterChoiceF9T2c === "function") {
      const planned = expertExordiumRosterChoiceF9T2c(player);
      if (planned) {
        if (typeof expertExordiumNoteCommanderDeferredF9T2d3 === "function") expertExordiumNoteCommanderDeferredF9T2d3(player, "higher_priority_expert_roster_step", { expertDoctrine:planned.expertDoctrine || null }, { extendDeadline:true });
        return planned;
      }
    } else if (typeof expertExordiumRosterChoiceF9T2 === "function") {
      const planned = expertExordiumRosterChoiceF9T2(player);
      if (planned) {
        if (typeof expertExordiumNoteCommanderDeferredF9T2d3 === "function") expertExordiumNoteCommanderDeferredF9T2d3(player, "higher_priority_expert_roster_step", { expertDoctrine:planned.expertDoctrine || null }, { extendDeadline:true });
        return planned;
      }
    }
    if (typeof expertExordiumCommanderRosterChoiceF9T2d3 === "function") return expertExordiumCommanderRosterChoiceF9T2d3(player);
  }
  return null;
}

function expertFactionObserveRosterPlayF9T2(player, choice) {
  if (!state || state.aiMode !== "expert") return false;
  const faction = state.factions && state.factions[player];
  if (faction === "Exordium") {
    let observed = false;
    if (typeof expertExordiumObserveRosterPlayF9T2c === "function") observed = expertExordiumObserveRosterPlayF9T2c(player, choice) || observed;
    else if (typeof expertExordiumObserveRosterPlayF9T2 === "function") observed = expertExordiumObserveRosterPlayF9T2(player, choice) || observed;
    if (typeof expertExordiumObserveCommanderRosterPlayF9T2d3 === "function") observed = expertExordiumObserveCommanderRosterPlayF9T2d3(player, choice) || observed;
    return observed;
  }
  return false;
}

function expertFactionUnitPriorityBonusF9T2(unit) {
  if (!unit || !state || state.aiMode !== "expert") return 0;
  if (unit.faction === "Exordium" && typeof expertExordiumUnitPriorityBonusF9T2 === "function") return expertExordiumUnitPriorityBonusF9T2(unit);
  return 0;
}

function expertFactionMoveBonusF9T2(unit, coord, context) {
  if (!unit || !state || state.aiMode !== "expert") return 0;
  if (unit.faction === "Exordium" && typeof expertExordiumMoveBonusF9T2 === "function") return expertExordiumMoveBonusF9T2(unit, coord, context);
  return 0;
}



function expertFactionTryCommittedConversionActionF9T2c4(unit) {
  if (!unit || !state || state.aiMode !== "expert") return false;
  if (unit.faction === "Exordium" && typeof expertExordiumTryCommittedClearConversionF9T2c4 === "function") {
    return expertExordiumTryCommittedClearConversionF9T2c4(unit);
  }
  return false;
}

function expertFactionTryReservedStationaryAssaultActionF9T2d2a(unit) {
  if (!unit || !state || state.aiMode !== "expert") return false;
  if (unit.faction === "Exordium" && typeof expertExordiumTryReservedStationaryVarranAssaultF9T2d2a === "function") {
    return expertExordiumTryReservedStationaryVarranAssaultF9T2d2a(unit);
  }
  return false;
}

function expertFactionTryPlannedUnitActionF9T2(unit) {
  if (!unit || !expertAiEnabledF9T1(unit.side)) return false;
  if (unit.faction === "Exordium" && typeof expertExordiumTryPlannedUnitActionF9T2 === "function") return expertExordiumTryPlannedUnitActionF9T2(unit);
  return false;
}
