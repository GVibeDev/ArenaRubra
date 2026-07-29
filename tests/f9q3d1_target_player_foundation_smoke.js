"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
let checks = 0;
const ok = (value, label) => { assert.ok(value, label); checks += 1; };
const eq = (actual, expected, label) => { assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), expected, label); checks += 1; };

const context = {
  console, Object, Array, Number, Boolean, Math, Set, Map, Date,
  state: {
    players:[{id:1},{id:2},{id:3},{id:4,eliminated:true}],
    factions:{1:"Fabeot",2:"Nexus",3:"Exordium",4:"Liberti"},
    modes:{1:"human",2:"bot",3:"bot",4:"bot"},
    energy:{1:10,2:3,3:8,4:9},
    pressure:{1:0,2:1,3:2,4:4},
    hand:{
      1:[],
      2:[{cardUid:"p2a",sourceType:"unit"}],
      3:[{cardUid:"p3a",sourceType:"unit"},{cardUid:"p3b",sourceType:"unit",c2c7aBlockedTurns:1}],
      4:[{cardUid:"p4a",sourceType:"unit"}]
    },
    deck:{1:[1],2:[1,2],3:[1,2,3],4:[1]},
    units:[
      {uid:"u2",side:2,alive:true,currentHp:2,pos:[0,0,0],ability:{kind:"damage",cost:0}},
      {uid:"u3",side:3,alive:true,currentHp:2,pos:[1,0,-1],ability:{kind:"damage",cost:2}},
      {uid:"u4",side:4,alive:true,currentHp:2,pos:[0,1,-1],ability:{kind:"damage",cost:3}}
    ]
  },
  playerName(side) { return `G${side} ${context.state.factions[side]}`; },
  mapRuntimePlayerIds(source) { return source.players.map(player => player.id); },
  getEnemyPlayers(side) { return context.state.players.filter(p => !p.eliminated && p.id !== side).map(p => p.id); },
  isPlayerEliminated(side) { return Boolean(context.state.players.find(p => p.id === side)?.eliminated); },
  combatUnits(side=null) { return context.state.units.filter(u => u.alive && (side == null || u.side === side)); },
  countControlledPS(side) { return side === 3 ? 2 : side === 2 ? 1 : 0; },
  handCardBlocked(card) { return Boolean(card && card.c2c7aBlockedTurns > 0); },
  stealableHandCards(side) { return context.state.hand[side].filter(card => !card.c2c7aBlockedTurns); }
};
vm.createContext(context);
vm.runInContext(read("src/player_targeting.js"), context, { filename:"src/player_targeting.js" });

const evalIn = code => vm.runInContext(code, context);
eq(evalIn("f9q3d1ActiveEnemySides(1)"), [2,3], "eliminated player excluded");
eq(evalIn("eligiblePlayerTargetSides(1,{kind:'usury_energy_income_debuff'})"), [2,3], "usury targets every active opponent");
eq(evalIn("eligiblePlayerTargetSides(1,{kind:'enemy_ability_cost_tax'})"), [3], "ability tax keeps only opponents with paid abilities");
eq(evalIn("eligiblePlayerTargetSides(1,{kind:'mutual_draw_conditional_steal'})"), [2,3], "mutual draw keeps opponents with deck");
eq(evalIn("eligiblePlayerTargetSides(1,{kind:'block_enemy_hand_cards_by_ps'})"), [2,3], "embargo keeps opponents with unblocked hand cards");
eq(evalIn("eligiblePlayerTargetSides(1,{kind:'compromisedLogistics'})"), [2,3], "compromised logistics targets active decks");
eq(evalIn("eligiblePlayerTargetSides(1,{kind:'copyRandomEnemyHandCard'})"), [2,3], "hand copy targets stealable hands");
const tokens = evalIn("eligiblePlayerTargets(1,{kind:'usury_energy_income_debuff'}).map(t=>({uid:t.uid,side:t.side,type:t.type,playerTarget:t.playerTarget}))");
eq(tokens, [
  {uid:"PLAYER-2",side:2,type:"Giocatore",playerTarget:true},
  {uid:"PLAYER-3",side:3,type:"Giocatore",playerTarget:true}
], "stable player target tokens");
eq(evalIn("chooseAutomaticPlayerTarget(1,eligiblePlayerTargets(1,{kind:'usury_energy_income_debuff'}),{kind:'usury_energy_income_debuff'}).side"), 3, "bot/automatic scoring chooses the stronger target");
ok(evalIn("handTacticRequiresPlayerTarget({effectKind:'block_enemy_hand_cards_by_ps'})"), "hand tactic classified");
ok(evalIn("abilityRequiresPlayerTarget({kind:'lockEnemyEnergy'})"), "ability classified");
ok(evalIn("abilityRequiresPlayerTarget({kind:'incomeDelta',affects:'enemy'})"), "generic enemy economy ability classified");
ok(evalIn("starterTacticRequiresPlayerTarget({kind:'contractTrap'})"), "starter tactic classified");

// 1v1 auto-resolution foundation.
context.state.players = [{id:1},{id:2}];
eq(evalIn("eligiblePlayerTargets(1,{kind:'usury_energy_income_debuff'}).map(t=>t.side)"), [2], "1v1 has a single automatic opponent");

// Source-level integration guards.
const tactics = read("src/tactics.js");
const abilities = read("src/abilities.js");
const controller = read("src/controller.js");
const ai = read("src/ai.js");
ok(tactics.includes("requestPlayerTargetSelection({"), "human tactic selector connected");
ok(tactics.includes("playerTargetSide(target)"), "tactic resolvers consume selected side");
ok(abilities.includes("eligiblePlayerTargets(unit.side"), "ability target pool connected");
ok(abilities.includes('affectedPlayerForAbility(user, target, { ...ab, affects:"enemy" })'), "income swing uses selected enemy player");
ok(read("src/economy.js").includes("isPlayerTargetToken(target)"), "generic enemy economic resolver consumes player token");
ok(controller.includes("abilityRequiresPlayerTarget(unit.ability)"), "ability UI selector connected");
ok(ai.includes("isPlayerTargetToken(target)"), "AI scores player target tokens");
ok(read("index.html").includes('src/player_targeting.js'), "target-player module loaded by app");
ok(read("data/tactics_base.js").includes('target:"enemy_player", kind:"contractTrap"'), "legacy Contract Trap migrated");
for (const kind of ["compromisedLogistics","copyRandomEnemyHandCard","lockEnemyEnergy"]) {
  ok(new RegExp(`kind:\\"${kind}\\"[^\\n]+target:\\"enemy_player\\"`).test(read("data/units_base.js")), `${kind} data target migrated`);
}
ok(read("src/build_info.js").includes('version: "C2-STABLE-1-F9Q3d1-APK-M4c"'), "F9Q3d1 build metadata");
ok(read("src/build_info.js").includes('logicBaseline: "C2-STABLE-1-F9S1b1-APK-M4c"'), "validated F9S1b1 baseline preserved");

console.log(`F9Q3d1 Target Player Foundation smoke: ${checks}/${checks} OK`);
