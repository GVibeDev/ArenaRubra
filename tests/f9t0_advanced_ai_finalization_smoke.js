"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
const aiSource = read("src/ai.js");
const stateSource = read("src/state.js");
const buildSource = read("src/build_info.js");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };

function bodyOf(name) {
  const start = aiSource.indexOf(`function ${name}`);
  assert.ok(start >= 0, `funzione ${name} presente`);
  let depth = 0;
  let seen = false;
  for (let i = aiSource.indexOf("{", start); i < aiSource.length; i += 1) {
    if (aiSource[i] === "{") { depth += 1; seen = true; }
    else if (aiSource[i] === "}") {
      depth -= 1;
      if (seen && depth === 0) return aiSource.slice(start, i + 1);
    }
  }
  throw new Error(`corpo ${name} non chiuso`);
}

// Contratto statico della patch.
[
  "botPressureProfileF9T0", "botBuildGarrisonPlanF9T0", "botNexusNetworkMaturityF9T0",
  "botAgathoiGreenLineMaturityF9T0", "botStallOscillationScoreF9T0",
  "botCreateAdvancedMoveContextF9T0", "botAdvancedMoveScoreF9T0", "botMoveUnitF9T0"
].forEach(name => ok(aiSource.includes(`function ${name}`), `${name} presente`));
ok(stateSource.includes('aiFinalizationF9T0: { schema:"F9T0-1"'), "memoria F9T0 inizializzata nello stato");
ok(buildSource.includes('version: "C2-STABLE-1-F9T0-APK-M4c"'), "versione candidata F9T0");
ok(buildSource.includes('logicBaseline: "C2-STABLE-1-F9U3-APK-M4c"'), "baseline logica F9U3");
ok(buildSource.includes('buildChannel: "f9t0-candidate"'), "canale candidato F9T0");

const nexusCore = bodyOf("botNexusCoreStructure");
ok(!nexusCore.includes("|| true"), "Nexus core structure non accetta più ogni struttura per errore");
const advancedMove = bodyOf("chooseAdvancedMove");
ok(advancedMove.includes("botCreateAdvancedMoveContextF9T0"), "movimento avanzato usa il contesto F9T0");
ok(!advancedMove.includes("chooseEmergencyMove"), "nessun secondo scoring emergenza nel selettore");
ok(!advancedMove.includes("chooseHomePsDutyMove"), "nessun secondo scoring PS domestico nel selettore");
ok(!advancedMove.includes("chooseSaferStrategicMove"), "nessun terzo rescoring sicurezza nel selettore");
const botAct = bodyOf("botAct");
ok(!botAct.includes("commanderSafetyMove(unit)"), "sicurezza comandante confluita nel punteggio unico");
ok(!botAct.includes("homePsDutyActive(unit.side)"), "dovere PS domestico confluito nel punteggio unico");
ok(botAct.includes("advancedStatus"), "stato strategico riusato nell'intera azione");
const moveContext = bodyOf("botCreateAdvancedMoveContextF9T0");
ok((moveContext.match(/homePsMoveScore\(/g) || []).length === 1, "homePsMoveScore calcolato una sola volta per candidato");
ok((moveContext.match(/botGeneralDoctrineMoveBonus\(/g) || []).length === 1, "dottrina generale calcolata una sola volta per candidato");
ok((moveContext.match(/botFactionDoctrineMoveBonusF9T0\(/g) || []).length === 1, "dottrina di fazione calcolata una sola volta per candidato");
const agathoiWrapper = bodyOf("chooseAdvancedAgathoiMove");
ok(agathoiWrapper.includes("return chooseAdvancedMove"), "Agathoi usa il selettore unificato");
const strategicStart = aiSource.indexOf("function strategicStatus");
const strategicEnd = aiSource.indexOf("function logEmergencyIfNeeded", strategicStart);
const strategicBody = aiSource.slice(strategicStart, strategicEnd);
ok(strategicBody.includes("profile.requiredPs"), "soglie strategiche proporzionali a requiredPs");
ok(!strategicBody.includes("ownPs >= 2 &&"), "rimossa la soglia fissa di due PS dalla chiusura strategica");

// Sandbox dinamica minima per verificare i contratti di comportamento.
const center = [0, 0, 0];
const cells = [
  { id:"PS0", coord:center, ps:true, control:1 },
  { id:"PS1", coord:[1,-1,0], ps:true, control:1 },
  { id:"PS2", coord:[2,-2,0], ps:true, control:null },
  { id:"PS3", coord:[3,-3,0], ps:true, control:null },
  { id:"PS4", coord:[-1,1,0], ps:true, control:2 },
  { id:"PS5", coord:[-2,2,0], ps:true, control:2 },
  { id:"PS6", coord:[0,1,-1], ps:true, control:null }
];
const units = [
  { uid:"hq1", side:1, faction:"Nexus", type:"QG", alive:true, pos:[4,-4,0], currentHp:20, currentDef:0, att:0, cost:0 },
  { uid:"hq2", side:2, faction:"Exordium", type:"QG", alive:true, pos:[-4,4,0], currentHp:20, currentDef:0, att:0, cost:0 },
  { uid:"n1", side:1, faction:"Nexus", type:"Fanteria", weight:"Leggera", alive:true, pos:center, currentHp:3, currentDef:1, att:2, cost:2 },
  { uid:"n2", side:1, faction:"Nexus", type:"Fanteria", weight:"Pesante", alive:true, pos:[1,-1,0], currentHp:4, currentDef:1, att:3, cost:3 },
  { uid:"n3", side:1, faction:"Nexus", type:"Veicolo", weight:"Pesante", alive:true, pos:[1,0,-1], currentHp:5, currentDef:2, att:4, cost:4 },
  { uid:"n4", side:1, faction:"Nexus", type:"Veicolo", weight:"Leggera", alive:true, pos:[2,-1,-1], currentHp:3, currentDef:1, att:2, cost:2 },
  { uid:"e1", side:2, faction:"Exordium", type:"Fanteria", weight:"Leggera", alive:true, pos:[-1,2,-1], currentHp:2, currentDef:1, att:2, cost:2 }
];
const state = {
  aiMode:"advanced", turn:12, factions:{1:"Nexus",2:"Exordium"}, cells, units,
  pressure:{1:0,2:0}, hand:{1:[],2:[]}, deck:{1:[1,2,3],2:[1,2,3]}, discard:{1:[],2:[]},
  aiTelemetry:{}, mapDefinition:{}, emergencyLoggedTurn:{1:-1,2:-1},
  aiFinalizationF9T0:{ schema:"F9T0-1", players:{}, unitHistory:{} }
};
const cubeDistance = (a,b) => Math.max(Math.abs(a[0]-b[0]), Math.abs(a[1]-b[1]), Math.abs(a[2]-b[2]));
const context = {
  console, state,
  CENTER_PS_COORD:center, CENTER_OPENING_END_ROUND:3, CENTER_CONTEST_END_ROUND:5,
  QG_THREAT_RANGE:2, BASE_INCOME:3, PRESSURE_WIN:5, MAX_ROUND:30,
  EventTypes:{AI_PLAN_CHANGED:"AI_PLAN_CHANGED"},
  enemyOf:p => p === 1 ? 2 : 1,
  getEnemyPlayers:p => [p === 1 ? 2 : 1],
  combatUnits:p => state.units.filter(u => u.alive && u.side === p && u.type !== "QG"),
  enemyCombatUnits:p => state.units.filter(u => u.alive && u.side !== p && u.type !== "QG"),
  getHq:p => state.units.find(u => u.side === p && u.type === "QG"),
  countControlledPS:p => state.cells.filter(c => c.ps && c.control === p).length,
  getCellAt:coord => state.cells.find(c => cubeDistance(c.coord,coord) === 0) || { coord:[...coord], ps:false, control:null },
  getUnitAt:coord => state.units.find(u => u.alive && u.pos && cubeDistance(u.pos,coord) === 0) || null,
  sameCoord:(a,b) => Boolean(a && b && a[0]===b[0] && a[1]===b[1] && a[2]===b[2]),
  hexDistance:cubeDistance,
  areAdjacent:(a,b) => cubeDistance(a,b) === 1,
  getCentralStrategicPointCoord:() => center,
  pressureRuleProfile:() => ({ totalPs:7, requiredPs:4, centralCoord:center, startRound:20, pressureWin:5, maxRound:30 }),
  playerControlsCentralStrategicPoint:p => state.cells.find(c => c.id === "PS0").control === p,
  pressureStartRound:() => 20, pressureWinLimit:() => 5, maxRoundLimit:() => 30,
  effectiveIncomeGain:p => ({ total:3 + state.cells.filter(c => c.ps && c.control === p).length * 2 }),
  movementRangeFor:() => 1, movableCells:() => [],
  isOnPS:u => Boolean(state.cells.find(c => c.ps && u.pos && cubeDistance(c.coord,u.pos) === 0)),
  log:() => {}, playerName:p => `P${p}`,
  moveUnit:(unit,coord) => { unit.pos = [...coord]; },
  isMissionHandCard:() => false
};
vm.createContext(context);
vm.runInContext(`${aiSource}\n;globalThis.__f9t0={strategicStatus,botNexusNetworkMaturityF9T0,botBuildGarrisonPlanF9T0,shouldReleasePsGarrison,botStallOscillationScoreF9T0,botRecordMoveChoiceF9T0};`, context, { filename:"ai.js" });
const api = context.__f9t0;

let status = api.strategicStatus(1);
ok(status.pressureProfile.requiredPs === 4, "mappa 7 PS richiede quattro PS");
ok(status.ownPs === 2 && status.ownControlsCentral, "scenario iniziale: due PS incluso il centrale");
ok(status.pressureWinPlan === false, "due PS su sette non attivano una falsa chiusura di Pressione");

// Il controllo nemico di centro + 4/7 PS deve essere riconosciuto immediatamente.
for (const c of state.cells) c.control = null;
state.cells[0].control = 2; state.cells[1].control = 2; state.cells[2].control = 2; state.cells[3].control = 2;
state.aiFinalizationF9T0.players = {};
status = api.strategicStatus(1);
ok(status.enemyPressureQualified === true, "nemico qualificato con centro e quattro PS");
ok(status.pressureEmergency === true, "qualificazione nemica attiva l'emergenza proporzionale");

// Rete Nexus matura e budget dinamico: almeno un PS sicuro viene liberato.
state.cells.forEach(c => { c.control = null; });
state.cells[0].control = 1; state.cells[1].control = 1; state.cells[2].control = 1;
state.units.push(
  { uid:"ns1", side:1, faction:"Nexus", type:"Struttura", weight:"Pesante", alive:true, pos:[0,-1,1], currentHp:5, currentDef:3, att:0, cost:3 },
  { uid:"ns2", side:1, faction:"Nexus", type:"Struttura", weight:"Pesante", alive:true, pos:[2,-3,1], currentHp:5, currentDef:3, att:0, cost:3 },
  { uid:"n5", side:1, faction:"Nexus", type:"Fanteria", weight:"Leggera", alive:true, pos:[2,-2,0], currentHp:2, currentDef:1, att:2, cost:2 }
);
state.aiFinalizationF9T0.players = {};
const maturity = api.botNexusNetworkMaturityF9T0(1);
ok(maturity.mature === true, "rete Nexus riconosciuta come matura");
const garrisonStatus = {
  center:state.cells[0], ownHq:context.getHq(1), pressureWindow:false, closePressureLock:false,
  ownPressureQualified:false, pressureEmergency:false, hqDanger:false, stalledRounds:0,
  winning:true, networkMature:true, greenLineMature:false
};
const plan = api.botBuildGarrisonPlanF9T0(1, garrisonStatus);
ok(plan.budget === 2 && plan.keepCells.length === 2, "rete matura conserva due guarnigioni su tre PS sicuri");
const releasable = state.units.find(u => u.side === 1 && u.pos && state.cells.some(c => c.ps && c.control === 1 && cubeDistance(c.coord,u.pos) === 0) && !plan.keepKeys.has(u.pos.join(",")));
ok(Boolean(releasable), "esiste una guarnigione sicura liberabile");
const releaseStatus = { ...garrisonStatus, allIn:false, finalizationStall:false, garrisonPlan:plan };
ok(api.shouldReleasePsGarrison(releasable, releaseStatus) === true, "la guarnigione fuori budget viene rilasciata");

// Anti-oscillazione: tornare alla cella precedente costa più dell'avanzata.
const mover = state.units.find(u => u.uid === "n3");
mover.pos = [1,0,-1];
state.aiFinalizationF9T0.unitHistory[mover.uid] = { previous:[0,0,0], current:[1,0,-1], round:11 };
const stallStatus = { stalledRounds:3, hqDanger:false, pressureEmergency:false, enemyHq:context.getHq(2), garrisonPlan:{keepKeys:new Set()} };
const returnScore = api.botStallOscillationScoreF9T0(mover, [0,0,0], stallStatus);
const forwardScore = api.botStallOscillationScoreF9T0(mover, [0,1,-1], stallStatus);
ok(returnScore < forwardScore, "ritorno oscillatorio penalizzato rispetto a una cella più avanzata");

console.log(`F9T0 Advanced AI Finalization smoke: ${checks}/${checks} verifiche superate`);
