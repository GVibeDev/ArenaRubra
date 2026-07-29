"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = [
  "data/terrain_registry.js",
  "data/map_definitions.js",
  "src/map_runtime.js",
  "src/rules.js"
];
const prefix = `
const PRESSURE_WIN = 3;
const MAX_ROUND = 20;
const AUTO_RESIGN_ROUND = 8;
const AUTO_RESIGN_STREAK = 2;
const EventTypes = { LOG_MESSAGE:"LOG_MESSAGE", VICTORY:"VICTORY", PRESSURE_CHANGED:"PRESSURE_CHANGED", PS_CONTROL_CHANGED:"PS_CONTROL_CHANGED" };
let selectedId = null;
let state = {
  turn:4,
  winner:null,
  winnerSide:null,
  players:[1,2,3].map(id => ({ id, eliminated:false })),
  factions:{1:"Nexus",2:"Exordium",3:"Liberti"},
  modes:{1:"bot",2:"bot",3:"bot"},
  units:[
    { uid:"u1", side:1, type:"Fanteria", alive:true, currentHp:2, pos:[0,0,0] },
    { uid:"u2", side:2, type:"Fanteria", alive:true, currentHp:2, pos:[1,-1,0] },
    { uid:"u3", side:3, type:"Fanteria", alive:true, currentHp:2, pos:[-1,1,0] }
  ],
  cells:[],
  pressure:{1:0,2:0,3:0},
  energy:{1:3,2:3,3:3},
  desperation:{1:0,2:0,3:0},
  psLocks:[]
};
const logs = [];
function sameCoord(a,b) { return Array.isArray(a) && Array.isArray(b) && a.every((value,index) => value === b[index]); }
function log(message) { logs.push(message); }
function recordMatchResult() { state.matchRecorded = true; }
function renderMatchupStats() {}
function renderAll() {}
function pressureStartRound() { return 4; }
`;
const checks = `
assert.deepStrictEqual(getActivePlayers(), [1,2,3]);
assert.strictEqual(eliminatePlayer(2, 1, "qg"), true);
assert.deepStrictEqual(getActivePlayers(), [1,3]);
assert.strictEqual(state.winner, null, "three-player match must not end after first elimination");
assert.strictEqual(state.players[1].eliminated, true);
assert.strictEqual(state.units.find(unit => unit.uid === "u2").alive, false);
assert.strictEqual(eliminatePlayer(3, 1, "qg"), true);
assert.deepStrictEqual(getActivePlayers(), [1]);
assert.strictEqual(state.winnerSide, 1);
assert.ok(state.winner.includes("ultimo giocatore attivo"));
assert.strictEqual(state.matchRecorded, true);
console.log("F9Q2 multiplayer elimination smoke: OK");
`;

const source = prefix + files.map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + checks;
new Function("assert", "console", source)(assert, console);

