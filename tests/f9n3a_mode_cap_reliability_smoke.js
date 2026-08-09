"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");
const assert = require("assert");
const root = path.resolve(__dirname, "..");

const context = {
  console, Object, Array, Number, Boolean, Math,
  state:null,
  getHq:side => ({side, pos:side === 1 ? [0,6] : [0,-6]}),
  isCellEnterable:() => true,
  getUnitAt:() => null,
  playerEnergyLocked:() => false,
  purchaseLimitReached:() => false
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "src", "game_scale.js"), "utf8"), context);

function fresh(mode) {
  context.state = {
    gameScaleMode:mode,
    units:[], winner:null, starterCards:{1:{},2:{}},
    f9n3Telemetry:{
      starterSpawned:{1:{starter_infantry:0},2:{starter_infantry:0}},
      starterDestroyed:{1:{starter_infantry:0},2:{starter_infantry:0}},
      tacticalCapBlocked:{1:{starter_infantry:0},2:{starter_infantry:0}},
      starterEnergySpent:{1:0,2:0}, hqDeployments:{1:0,2:0}, hqBuilds:{1:0,2:0}
    }
  };
}

// Sequenza di nuove partite: nessuna contaminazione tra modalità.
for (const mode of ["large_scale", "tactical", "tactical", "large_scale", "tactical"]) {
  fresh(mode);
  assert.equal(context.currentGameScaleMode(), mode);
}

fresh("tactical");
for (const side of [1,2]) {
  const u1={side,alive:true}, u2={side,alive:true};
  context.markStarterOrigin(u1, side, "starter_infantry", 1);
  context.markStarterOrigin(u2, side, "starter_infantry", 1);
  context.state.units.push(u1,u2);
  const cap=context.tacticalStarterCapState(side,"starter_infantry");
  assert.equal(cap.count,2);
  assert.equal(cap.blocked,true);
}
assert.equal(context.tacticalStarterCapState(1,"starter_infantry").count,2);
assert.equal(context.tacticalStarterCapState(2,"starter_infantry").count,2);
assert.notStrictEqual(context.state.f9n3Telemetry.starterSpawned[1], context.state.f9n3Telemetry.starterSpawned[2]);

// Una copia da deck dello stesso tipo non entra nel conteggio.
context.state.units.push({side:1,alive:true,spawnSource:"deck",starterRole:"starter_infantry"});
assert.equal(context.tacticalStarterCapState(1,"starter_infantry").count,2);

// La distruzione libera solo lo slot del proprietario.
const victim=context.state.units.find(u=>u.side===2 && u.spawnSource==="starter");
context.noteStarterDestroyed(victim);
victim.alive=false;
assert.equal(context.tacticalStarterCapState(2,"starter_infantry").blocked,false);
assert.equal(context.tacticalStarterCapState(1,"starter_infantry").blocked,true);

// Contratto statico: setup autorevole e origine esplicita, senza lookup UID nel resolver.
const app=fs.readFileSync(path.join(root,"src","app.js"),"utf8");
const game=fs.readFileSync(path.join(root,"src","game.js"),"utf8");
const deployment=fs.readFileSync(path.join(root,"src","deployment.js"),"utf8");
const ai=fs.readFileSync(path.join(root,"src","ai.js"),"utf8");
assert.match(app,/newGame\(setupOverrides\)/);
assert.match(game,/function newGame\(setupOverrides = null\)/);
assert.match(deployment,/function spawnUnit\(bp, side, coord, options=\{\}\)/);
assert.match(deployment,/\["starter", "starter_roster"\]\.includes\(resolvedSpawnSource\) \? options\.starterRole : null/);
assert.match(ai,/spawnSource:resolvedSource, starterRole:choice\.starterRole/);

console.log("F9N3a mode/cap reliability smoke: 20/20 OK");
