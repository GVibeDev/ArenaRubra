"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const logs = [];
const context = {
  console, Object, Array, Number, Boolean, Math, Set, Map, Date,
  state:null,
  EventTypes:{ LOG_MESSAGE:"LOG_MESSAGE" },
  TACTICS:[], DECK_TACTICS:[],
  log(message) { logs.push(String(message)); },
  playerName(side) { return `G${side}`; },
  enemyOf(side) { return side === 1 ? 2 : 1; },
  countControlledPS() { return 2; },
  renderAll() {},
  maybeRunBot() {}
};
vm.createContext(context);
for (const relative of ["data/cards_base.js", "src/deck.js", "src/tactics.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, { filename:relative });
}

function card(id, role, extra = {}) {
  return { id, sourceId:id, name:id, faction:"Nexus", sourceType:role === "mission" ? "mission" : "unit", cardType:role, deckRole:role, blueprintId:role === "mission" ? null : id, cardUid:`uid_${id}`, zone:"deck", ...extra };
}

const mission = card("NXMSN01", "mission", { missionId:"NXMSN01" });
const commander = card("NXCMD01", "commander");
const ordinary = Array.from({ length:28 }, (_, index) => card(`NXB${index + 1}`, "base"));
const missionDeck = [...ordinary.slice(0, 9), commander, ...ordinary.slice(9), mission];
context.missionDeck = missionDeck;

let split = vm.runInContext("createInitialHandFromDeck(missionDeck)", context);
assert.equal(split.hand.length, 5);
assert.equal(split.deck.length, 25);
assert.equal(split.hand[0].deckRole, "mission");
assert.equal(split.hand[1].deckRole, "commander");
assert.equal(split.hand.filter(item => item.deckRole === "mission").length, 1);
assert.equal(split.hand.filter(item => item.deckRole === "commander").length, 1);
assert.equal(split.hand.filter(item => item.deckRole === "base").length, 3);
context.openingWithMission = split.hand;
let opening = vm.runInContext("openingHandContractSummary(openingWithMission)", context);
assert.equal(opening.ok, true);
assert.equal(opening.missionCopies, 1);
assert.equal(opening.commanderCopies, 1);
assert.equal(opening.ordinaryCopies, 3);

const noMissionDeck = [commander, ...ordinary, card("NXB29", "base")];
context.noMissionDeck = noMissionDeck;
split = vm.runInContext("createInitialHandFromDeck(noMissionDeck)", context);
assert.equal(split.hand.length, 5);
assert.equal(split.hand[0].deckRole, "commander");
assert.equal(split.hand.filter(item => item.deckRole === "mission").length, 0);
assert.equal(split.hand.filter(item => item.deckRole === "base").length, 4);
context.openingWithoutMission = split.hand;
opening = vm.runInContext("openingHandContractSummary(openingWithoutMission)", context);
assert.equal(opening.ok, true);
assert.equal(opening.ordinaryCopies, 4);

const pMission = { ...mission, cardUid:"m1", zone:"hand" };
const pCommander = { ...commander, cardUid:"c1", zone:"hand" };
const pOrdinary = { ...ordinary[0], cardUid:"o1", zone:"hand" };
context.state = {
  factions:{1:"Nexus",2:"Fabeot"}, winner:null, energy:{1:5,2:5},
  deck:{1:[],2:[]}, hand:{1:[pMission,pCommander,pOrdinary],2:[]}, discard:{1:[],2:[]}, cardDebug:null
};

assert.equal(vm.runInContext("isProtectedHandCard(state.hand[1][0])", context), true);
assert.equal(vm.runInContext("isProtectedHandCard(state.hand[1][1])", context), true);
assert.equal(vm.runInContext("isProtectedHandCard(state.hand[1][2])", context), false);
assert.equal(vm.runInContext("discardableHandCards(1).length", context), 1);
assert.equal(vm.runInContext("stealableHandCards(1).length", context), 1);
assert.equal(vm.runInContext("discardCard(1, 'm1')", context), null);
assert.equal(vm.runInContext("discardCard(1, 'c1')", context), null);
assert.equal(context.state.hand[1].length, 3);
assert.equal(vm.runInContext("discardCard(1, 'o1').cardUid", context), "o1");
assert.equal(context.state.discard[1].length, 1);

assert.equal(vm.runInContext("moveHandCardBetweenPlayers(1, 2, 'm1')", context), null);
assert.equal(vm.runInContext("moveHandCardBetweenPlayers(1, 2, 'c1')", context), null);
assert.equal(context.state.hand[2].length, 0);

const moveOrdinary = { ...ordinary[1], cardUid:"o2", zone:"hand" };
context.state.hand[1].push(moveOrdinary);
assert.ok(vm.runInContext("moveHandCardBetweenPlayers(1, 2, 'o2')", context));
assert.equal(context.state.hand[2].length, 1);

assert.equal(vm.runInContext("discardPlayedHandCard(1, 'c1').cardUid", context), "c1");
assert.equal(context.state.discard[1].some(item => item.cardUid === "c1"), true);
assert.equal(context.state.hand[1].some(item => item.cardUid === "m1"), true);

context.state.hand[1][0].c2c7aBlockedTurns = 1;
context.state.hand[1][0].c2c7aBlockedSource = "Embargo";
assert.equal(vm.runInContext("handCardBlocked(state.hand[1][0])", context), true);
assert.match(vm.runInContext("handCardBlockReason(state.hand[1][0])", context), /Embargo/);

context.state.hand[2] = [{ ...mission, cardUid:"m2", zone:"hand" }, { ...commander, cardUid:"c2", zone:"hand" }];
assert.equal(vm.runInContext("copyRandomEnemyHandCard(1)", context), null);
context.state.hand[2].push({ ...ordinary[2], cardUid:"o3", zone:"hand" });
assert.ok(vm.runInContext("copyRandomEnemyHandCard(1)", context));
assert.equal(context.state.hand[1].some(item => item.copiedFrom === 2 && item.id === ordinary[2].id), true);

context.state.hand[1] = [{ ...mission, cardUid:"m3", zone:"hand" }];
context.state.discard[1] = [{ ...ordinary[3], cardUid:"d1", zone:"discard" }];
context.state.deck[1] = [];
assert.equal(vm.runInContext("canRecoverDeck(1).ok", context), true);
context.state.hand[1].push({ ...commander, cardUid:"c3", zone:"hand" });
assert.equal(vm.runInContext("canRecoverDeck(1).ok", context), false);

context.state.hand[2] = [{ ...mission, cardUid:"m4", zone:"hand" }, { ...commander, cardUid:"c4", zone:"hand" }];
context.blockCard = { name:"Embargo", sourceType:"tactic", cardType:"tactic", deckRole:"tactic", effectKind:"block_enemy_hand_cards_by_ps" };
const blocked = vm.runInContext("c2c7aBlockRandomEnemyHandCards(1, blockCard)", context);
assert.equal(blocked.extra, "2 carte bloccate");
assert.equal(context.state.hand[2].every(item => vm.runInContext(`handCardBlocked(${JSON.stringify(item)})`, context)), true);

console.log("F9N5 opening hand/protection smoke: 36/36 OK");
