"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const logs = [];
const events = [];
const discarded = [];

const context = {
  console,
  Math,
  Object,
  Array,
  Set,
  Map,
  Date,
  JSON,
  Number,
  String,
  Boolean,
  Infinity,
  STATUS_DEFINITIONS: {
    inhibit_action:{}, inhibit_attack:{}, inhibit_move:{}, bleed:{}, thorns:{}
  },
  EventTypes: {
    LOG_MESSAGE:"LOG_MESSAGE",
    TACTIC_USED:"TACTIC_USED",
    ECONOMY_CHANGED:"ECONOMY_CHANGED"
  },
  CARD_CATALOG_CONFIG: {},
  TACTICS: [],
  DECK_TACTICS: [],
  botRunning: false,
  state: {
    winner:null,
    currentPlayer:1,
    factions:{1:"Nexus",2:"Exordium"},
    energy:{1:10,2:10},
    deck:{1:[{id:"D1"},{id:"D2"},{id:"D3"}],2:[]},
    hand:{1:[],2:[]},
    discard:{1:[],2:[]},
    cells:[
      {coord:[0,0,0]},
      {coord:[1,-1,0]},
      {coord:[0,-1,1]},
      {coord:[1,0,-1]},
      {coord:[2,-2,0]}
    ],
    units:[]
  },
  log(message, type="LOG_MESSAGE", data={}) { logs.push(message); events.push({type,data}); },
  renderAll() {},
  playerName(side) { return `G${side}`; },
  enemyOf(side) { return side === 1 ? 2 : 1; },
  coordKey(c) { return c.join(","); },
  sameCoord(a,b) { return Boolean(a && b && a[0]===b[0] && a[1]===b[1] && a[2]===b[2]); },
  hexDistance(a,b) { return Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2])); },
  neighbors(c) {
    return [[1,-1,0],[1,0,-1],[0,1,-1],[-1,1,0],[-1,0,1],[0,-1,1]].map(d => [c[0]+d[0],c[1]+d[1],c[2]+d[2]]);
  },
  uniqueCoords(coords) {
    const seen = new Set();
    return coords.filter(c => { const k=c.join(","); if (seen.has(k)) return false; seen.add(k); return true; });
  },
  getCellAt(coord) { return context.state.cells.find(c => context.sameCoord(c.coord, coord)) || null; },
  getUnitAt(coord) { return context.state.units.find(u => u.alive && context.sameCoord(u.pos, coord)) || null; },
  isFieldUnit(unit) { return Boolean(unit && unit.alive && Array.isArray(unit.pos)); },
  combatUnits(side=null) { return context.state.units.filter(u => context.isFieldUnit(u) && (side === null || u.side === side)); },
  isUntargetableTo() { return false; },
  canBleed(unit) { return unit.type !== "Struttura" && unit.type !== "QG"; },
  applyDamage(target, amount) {
    if (target.currentDef > 0) target.currentDef = Math.max(0, target.currentDef - amount);
    else target.currentHp = Math.max(0, target.currentHp - amount);
    if (target.currentHp <= 0) target.alive = false;
  },
  applyStatus(target, status) { target.statuses.push({...status}); },
  drawCards(side, count) {
    const out=[];
    for (let i=0;i<count;i+=1) {
      const card=context.state.deck[side].shift();
      if (!card) break;
      context.state.hand[side].push(card);
      out.push(card);
    }
    return out;
  },
  playerHandLocked() { return false; },
  handCardBlocked() { return false; },
  handCardBlockReason() { return ""; },
  playerEnergyLocked() { return false; },
  deckTacticById() { return null; },
  discardPlayedHandCard(side, cardUid) {
    const i=context.state.hand[side].findIndex(c => c.cardUid===cardUid);
    if (i<0) return null;
    const [card]=context.state.hand[side].splice(i,1);
    context.state.discard[side].push(card);
    discarded.push(cardUid);
    return card;
  },
  handCardByUid(side, uid) { return context.state.hand[side].find(c => c.cardUid===uid) || null; },
  countControlledPS() { return 0; },
  clearSelection() {},
  postActionChecks() {},
  closeHandPanelAfterAcceptedCardPlay() {},
  apkM4CloseHandAfterCardPlay() {}
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,"src/custom_tactics.js"),"utf8"), context, {filename:"custom_tactics.js"});
vm.runInContext(fs.readFileSync(path.join(root,"src/tactics.js"),"utf8"), context, {filename:"tactics.js"});

function makeCard(kind, overrides={}) {
  const sourceId = overrides.sourceId || `CUS_NX_TAC_${kind.toUpperCase()}`;
  return {
    id:`CUSTOM:TACTIC:${sourceId}`,
    sourceId,
    tacticId:sourceId,
    sourceType:"tactic",
    cardType:"tactic",
    deckRole:"tactic",
    faction:"Nexus",
    name:`Test ${kind}`,
    cost:2,
    custom:true,
    cardUid:`UID_${sourceId}`,
    customAbilitySchema:{active:{kind,value:2,range:2,target:"enemy",filter:"any"},passive:null},
    ...overrides
  };
}

const ally = {uid:"A1",side:1,faction:"Nexus",type:"Fanteria",weight:"Leggera",alive:true,pos:[0,0,0],currentHp:3,maxHp:4,currentDef:1,maxDef:2,currentAtt:2,statuses:[],buffs:[]};
const enemyInf = {uid:"E1",side:2,faction:"Exordium",type:"Fanteria",weight:"Leggera",alive:true,pos:[1,-1,0],currentHp:4,maxHp:4,currentDef:2,maxDef:2,currentAtt:2,statuses:[],buffs:[]};
const enemyVeh = {uid:"E2",side:2,faction:"Exordium",type:"Veicolo",weight:"Pesante",alive:true,pos:[2,-2,0],currentHp:4,maxHp:4,currentDef:0,maxDef:2,currentAtt:3,statuses:[],buffs:[]};
context.state.units.push(ally, enemyInf, enemyVeh);

const unsafeDamage = makeCard("damage", {customAbilitySchema:{active:{kind:"damage",value:99,range:99,target:"any",filter:"infantry"},passive:null}});
const normalized = context.normalizeCustomTacticCard(unsafeDamage);
assert.equal(normalized.implementationStatus, "custom_playable_f9n1");
assert.equal(normalized.customTacticSchema.value, 5);
assert.equal(normalized.customTacticSchema.range, 4);
assert.equal(normalized.targetDomain, "board_unit");
assert.equal(normalized.targetSide, "enemy");
assert.equal(context.customTacticTargets(1, normalized).length, 1);
assert.equal(context.customTacticTargets(1, normalized)[0].uid, "E1");

const unsupported = makeCard("custom_text_only");
assert.equal(context.customTacticRuntimePlayable(unsupported), false);
assert.equal(context.normalizeCustomTacticCard(unsupported).implementationStatus, "custom_data_only");

const invalidStatus = makeCard("apply_status", {customAbilitySchema:{active:{kind:"apply_status",statusKind:"god_mode",statusTurns:9,value:9,range:2,filter:"any"},passive:null}});
assert.equal(context.customTacticRuntimePlayable(invalidStatus), false);

const bleed = makeCard("apply_status", {customAbilitySchema:{active:{kind:"apply_status",statusKind:"bleed",statusTurns:9,value:9,range:2,filter:"infantry"},passive:null}});
const bleedN = context.normalizeCustomTacticCard(bleed);
assert.equal(bleedN.customTacticSchema.statusTurns, 3);
assert.equal(bleedN.customTacticSchema.value, 3);
assert.equal(context.customTacticTargets(1, bleedN).length, 1);

const draw = makeCard("draw_card", {customAbilitySchema:{active:{kind:"draw_card",value:9,range:7,target:"enemy",filter:"vehicle"},passive:null}});
const drawN = context.normalizeCustomTacticCard(draw);
assert.equal(drawN.targetDomain, "none");
assert.equal(drawN.customTacticSchema.value, 3);
assert.equal(drawN.customTacticSchema.range, 0);
assert.equal(context.isHandTacticImmediateNoTargetCard(drawN), true);

const cell = makeCard("cell_blast", {customAbilitySchema:{active:{kind:"cell_blast",value:2,range:3,target:"any",filter:"any"},passive:null}});
const cellTargets = context.handTacticTargets(1, cell);
assert.ok(cellTargets.length > 0);
const center = cellTargets.find(t => context.sameCoord(t.pos,[1,-1,0]));
assert.ok(center);
const beforeAllyDef = ally.currentDef;
const beforeEnemyDef = enemyInf.currentDef;
context.resolveCustomTacticEffect(1, cell, center);
assert.ok(ally.currentDef < beforeAllyDef || ally.currentHp < ally.maxHp);
assert.ok(enemyInf.currentDef < beforeEnemyDef || enemyInf.currentHp < enemyInf.maxHp);

const playableDamage = makeCard("damage", {cardUid:"PLAY_1",customAbilitySchema:{active:{kind:"damage",value:2,range:2,target:"enemy",filter:"infantry"},passive:null}});
context.state.hand[1].push(playableDamage);
const energyBefore = context.state.energy[1];
const used = context.useHandTacticCard(1, playableDamage, enemyInf);
assert.equal(used, true);
assert.equal(context.state.energy[1], energyBefore - 2);
assert.equal(discarded.filter(x => x === "PLAY_1").length, 1);
assert.equal(context.state.discard[1].filter(c => c.cardUid === "PLAY_1").length, 1);
assert.ok(events.some(e => e.type === "TACTIC_USED" && e.data.custom === true && e.data.customRuntimeVersion === "F9N1"));

const gain = makeCard("gain_energy", {cardUid:"PLAY_2",cost:1,customAbilitySchema:{active:{kind:"gain_energy",value:4,range:0,target:"self",filter:"any"},passive:null}});
context.state.hand[1].push(gain);
const gainBefore = context.state.energy[1];
assert.equal(context.useHandTacticCard(1, gain, null), true);
assert.equal(context.state.energy[1], gainBefore - 1 + 4);

console.log(JSON.stringify({
  ok:true,
  tests:12,
  events:events.length,
  logs:logs.length,
  discarded:discarded.length
}, null, 2));
