"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const boundary = read("src/rules/victory_lifecycle.js");
const facade = read("src/rules.js");
const pressure = read("src/rules/pressure_victory.js");
const index = read("index.html");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => { assert.strictEqual(actual, expected, message); checks += 1; };

const context = {};
vm.createContext(context);
vm.runInContext(boundary, context, {filename:"src/rules/victory_lifecycle.js"});
ok(typeof context.createVictoryLifecycleService === "function", "boundary exposes one service factory");

let stateReads = 0;
const noop = () => {};
const service = context.createVictoryLifecycleService({
  getState(){ stateReads += 1; return null; }, getEventTypes(){ return {}; }, playerName(player){ return `G${player}`; },
  mapRuntimePlayerIds(){ return []; }, playerLifecycleMarkWinner:noop, log:noop, attributionSnapshot(){ return null; },
  recordMatchResult:noop, renderMatchupStats:noop, audioHandleMatchEnd:noop,
  resolvePlayerEliminationAttribution(){ return null; }, playerLifecycleCleanupElimination(){ return null; },
  playerLifecycleRecord(){ return null; }, combatUnits(){ return []; }, updateControlFromOccupants:noop,
  getActivePlayers(){ return []; }, isPlayerEliminated(){ return false; }, enemyOf(){ return 2; },
  enemyCombatUnits(){ return []; }, getEnemyPlayers(){ return []; }, getHq(){ return null; }, getUnitAt(){ return null; },
  countControlledPS(){ return 0; }, hexDistance(){ return 0; }, autoResignRound(){ return 25; }, autoResignStreak(){ return 3; },
  canEndTurn(){ return false; }, endTurn:noop, renderAll:noop
});
ok(Object.isFrozen(service), "service API is immutable");
eq(stateReads,0,"factory construction does not read mutable game state");
eq(Array.from(Object.keys(service)).sort().join(","),[
  "checkVictory","concedeMatch","eliminatePlayer","inferWinType","inferWinnerSide","maybeAutoResign","setWinner"
].sort().join(","),"service exposes only the bounded victory/lifecycle API");

for(const forbidden of ["document","localStorage","sessionStorage","indexedDB","window."]){
  ok(!boundary.includes(forbidden),`boundary excludes ${forbidden}`);
}
for(const port of [
  "getState","playerLifecycleCleanupElimination","resolvePlayerEliminationAttribution","recordMatchResult",
  "renderMatchupStats","audioHandleMatchEnd","canEndTurn","endTurn","renderAll"
]) ok(boundary.includes(port),`${port} is an explicit dependency/effect port`);
ok(!boundary.includes("AUTO_RESIGN_ROUND")&&!boundary.includes("AUTO_RESIGN_STREAK"),"auto-resign constants enter through ports");
ok(!boundary.includes("PRESSURE_WIN")&&!boundary.includes("MAX_ROUND"),"Pressure and round-limit constants remain outside the boundary");

for(const name of ["setWinner","inferWinnerSide","inferWinType","eliminatePlayer","maybeAutoResign","concedeMatch","checkVictory"]){
  const declarations=facade.match(new RegExp(`function\\s+${name}\\s*\\(`,"g"))||[];
  eq(declarations.length,1,`${name} has one legacy facade declaration`);
  ok(facade.includes(`victoryLifecycleService().${name}`),`${name} delegates to the boundary`);
}
ok(!facade.includes("ultimo giocatore attivo sulla mappa")&&!facade.includes("resa_tecnica\")"),"winner and surrender decisions have one owner");
ok(pressure.includes("setWinner(")&&!pressure.includes("createVictoryLifecycleService"),"Pressure consumes the winner facade without owning lifecycle construction");

const victoryIndex=index.indexOf('<script src="src/rules/victory_lifecycle.js"></script>');
const pressureIndex=index.indexOf('<script src="src/rules/pressure_victory.js"></script>');
const facadeIndex=index.indexOf('<script src="src/rules.js"></script>');
ok(victoryIndex>=0&&victoryIndex<pressureIndex&&pressureIndex<facadeIndex,"browser loads both rule services before the legacy facade");

console.log(`AR-AC1 victory/lifecycle boundary contract smoke: ${checks}/${checks} OK`);
