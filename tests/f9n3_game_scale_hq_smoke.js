"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const hq = { side:1, pos:[0,6], type:"QG", alive:true };
const context = {
  console, Object, Array, Number, Boolean, Math,
  state: {
    gameScaleMode:"tactical",
    winner:null,
    units:[hq],
    starterCards:{ 1:{ infantry:{cardUid:"s-i", blueprintId:"INF", starterRole:"starter_infantry"} } },
    f9n3Telemetry:{
      starterSpawned:{1:{starter_infantry:0}}, starterDestroyed:{1:{starter_infantry:0}},
      tacticalCapBlocked:{1:{starter_infantry:0}}, starterEnergySpent:{1:0}, hqDeployments:{1:0}, hqBuilds:{1:0}
    }
  },
  getHq: side => side === 1 ? hq : null,
  isCellEnterable: coord => Array.isArray(coord) && coord[0] === 0 && coord[1] === 6,
  getUnitAt: coord => context.state.units.find(u => u.alive && u.type !== "QG" && u.pos && u.pos[0] === coord[0] && u.pos[1] === coord[1]) || null,
  playerEnergyLocked: () => false,
  purchaseLimitReached: () => false
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "src", "game_scale.js"), "utf8"), context);

assert.equal(context.currentGameScaleMode(), "tactical");
assert.equal(context.starterRoleForCardUid(1, "s-i"), "starter_infantry");
assert.equal(context.starterRoleForBlueprint(1, {id:"INF"}), "starter_infantry");

const a = {side:1, alive:true, pos:[1,5]};
const b = {side:1, alive:true, pos:[-1,6]};
context.markStarterOrigin(a, 1, "starter_infantry", 2);
context.markStarterOrigin(b, 1, "starter_infantry", 2);
context.state.units.push(a, b);
assert.deepEqual(context.tacticalStarterCapState(1, "starter_infantry"), {count:2, cap:2, blocked:true});
assert.equal(context.state.f9n3Telemetry.starterEnergySpent[1], 4);

context.noteTacticalStarterCapBlocked(1, "starter_infantry");
assert.equal(context.state.f9n3Telemetry.tacticalCapBlocked[1].starter_infantry, 1);
context.noteStarterDestroyed(a);
a.alive = false;
assert.equal(context.state.f9n3Telemetry.starterDestroyed[1].starter_infantry, 1);
assert.equal(context.tacticalStarterCapState(1, "starter_infantry").blocked, false);

assert.deepEqual(context.ownHqBuildCell(1), [0,6]);
assert.equal(context.canBuildFromOwnHq(1, {type:"Struttura"}), true);
context.state.units.push({side:1, alive:true, type:"Struttura", pos:[0,6]});
assert.equal(context.ownHqBuildCell(1), null);

context.state.gameScaleMode = "large_scale";
b.alive = true;
context.state.units.push({side:1, alive:true, spawnSource:"starter", starterRole:"starter_infantry", pos:[2,4]});
assert.equal(context.tacticalStarterCapState(1, "starter_infantry").blocked, false);

console.log("F9N3 game scale/HQ smoke: 14/14 OK");
