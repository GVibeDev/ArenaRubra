"use strict";

const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");
const index=read("index.html");
const runtime=read("src/core/runtime.js");
const action=read("src/core/action_service.js");
const gameCore=read("src/core/game_core.js");
for(const file of ["src/combat.js","src/movement.js","src/deployment.js","src/economy.js","src/deck.js","src/tactics.js","src/abilities.js","src/missions.js","src/rules/victory_lifecycle.js","src/rules/pressure_victory.js"]){
  const source=read(file);
  assert(!/document\.|document\[|getElementById|querySelector/.test(source),`${file} must remain DOM-free`);
}
for(const type of ["move","attack","deploy","build","ability","tactic","end_turn"]) assert(runtime.includes(`${type}: {`),`${type} action port missing`);
assert(runtime.includes("const GameCore = Object.freeze"));
assert(!/document|localStorage|sessionStorage|indexedDB/.test(action));
assert(!/document|localStorage|sessionStorage|indexedDB/.test(gameCore));
const stateIndex=index.indexOf('<script src="src/state.js"></script>');
const actionIndex=index.indexOf('<script src="src/core/action_service.js"></script>');
const gameCoreIndex=index.indexOf('<script src="src/core/game_core.js"></script>');
const turnsIndex=index.indexOf('<script src="src/turns.js"></script>');
const runtimeIndex=index.indexOf('<script src="src/core/runtime.js"></script>');
assert(stateIndex>=0&&stateIndex<actionIndex&&actionIndex<gameCoreIndex);
assert(turnsIndex>=0&&turnsIndex<runtimeIndex);
console.log("AR-AC1 core boundary contract smoke: 23/23 OK");
