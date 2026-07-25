"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "src/stats.js"), "utf8");
const deckSource = fs.readFileSync(path.join(root, "src/deck.js"), "utf8");
const checks = `
const EventTypes = {
  GAME_STARTED:"GAME_STARTED",
  TURN_STARTED:"TURN_STARTED",
  TURN_ENDED:"TURN_ENDED",
  UNIT_SPAWNED:"UNIT_SPAWNED",
  UNIT_BUILT:"UNIT_BUILT",
  UNIT_MOVED:"UNIT_MOVED",
  UNIT_ATTACKED:"UNIT_ATTACKED",
  UNIT_DAMAGED:"UNIT_DAMAGED",
  UNIT_DESTROYED:"UNIT_DESTROYED",
  ABILITY_USED:"ABILITY_USED",
  TACTIC_USED:"TACTIC_USED",
  STATUS_APPLIED:"STATUS_APPLIED",
  STATUS_EXPIRED:"STATUS_EXPIRED",
  ECONOMY_CHANGED:"ECONOMY_CHANGED",
  PS_CONTROL_CHANGED:"PS_CONTROL_CHANGED"
};
let state = {
  matchId:"telemetry-f9q2",
  turn:1,
  currentPlayer:1,
  winnerSide:null,
  winType:"",
  eventSeq:0,
  events:[],
  players:[1,2,3,4].map(id => ({ id, eliminated:false })),
  factions:{1:"Nexus",2:"Exordium",3:"Liberti",4:"Agathoi"},
  modes:{1:"human",2:"bot",3:"bot",4:"bot"},
  selectedCommanders:{},
  selectedDecks:{},
  pressure:{1:0,2:0,3:0,4:0},
  energy:{1:3,2:3,3:3,4:3},
  deck:{1:[],2:[],3:[],4:[]},
  hand:{1:[],2:[],3:[],4:[]},
  discard:{1:[],2:[],3:[],4:[]},
  units:[],
  mapId:"map3_quadrivium",
  mapDefinition:{
    id:"map3_quadrivium",
    name:"Quadrivio Spezzato",
    schemaVersion:1,
    movementMultiplier:3,
    metadata:{ revision:1 },
    geometry:{ cells:Array.from({length:265}, (_, index) => ({ coord:[index,-index,0], terrainType:"free" })) }
  }
};
function mapRuntimePlayerIds() { return state.players.map(player => player.id); }
function mapTerrainUsage() { return { free:265 }; }
function countControlledPS() { return 0; }
function combatUnits(side) { return state.units.filter(unit => unit.side === side); }
function updateControlFromOccupants() {}
function buildInfoExportMeta() { return { version:"C2-STABLE-1-F9Q3-APK-M4c" }; }

assert.strictEqual(f9fSideKey(3), "3");
assert.strictEqual(f9fSideKey(4), "4");
initializeMatchStats();
assert.deepStrictEqual(Object.keys(state.matchStats.players), ["1","2","3","4"]);
updateMatchStatsFromEvent({ type:EventTypes.TURN_STARTED, seq:1, data:{ player:3 } });
assert.strictEqual(state.matchStats.players[3].turnsStarted, 1);
assert.strictEqual(state.matchStats.current.energy[4], 3);
assert.ok(matchLogHeaderText().includes("P4: Agathoi"));
assert.ok(currentMatchReportText().includes("G4"));
state.mapLabMode = true;
state.matchRecorded = false;
recordMatchResult();
assert.strictEqual(state.matchRecorded, true, "Match Lab result must be consumed without entering competitive history");
console.log("F9Q2 multiplayer telemetry smoke: OK");
`;

new Function("assert", "console", source + "\n" + checks)(assert, console);
assert.ok(deckSource.includes("openingHand: Object.fromEntries(runtimeSides.map"));
assert.ok(deckSource.includes("deckRuntimeValidationForSide(side)"));
