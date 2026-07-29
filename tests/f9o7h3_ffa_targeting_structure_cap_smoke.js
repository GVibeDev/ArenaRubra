"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => { assert.strictEqual(actual, expected, message); checks += 1; };

// Unit-target pools in FFA must include every active enemy side.
const targetingPrefix = `
const EventTypes = new Proxy({}, { get:(_, key)=>String(key) });
const TACTICS = [];
const CARD_CATALOG_CONFIG = {};
let state = {
  factions:{1:"Nexus",2:"Exordium",3:"Liberti",4:"Fabeot"},
  energy:{1:10,2:10,3:10,4:10},
  units:[
    {uid:"own",side:1,type:"Fanteria",alive:true,currentHp:2,pos:[0,0,0],statuses:[]},
    {uid:"e2",side:2,type:"Veicolo",alive:true,currentHp:2,pos:[1,0,-1],statuses:[]},
    {uid:"e3",side:3,type:"Fanteria",alive:true,currentHp:2,pos:[0,1,-1],statuses:[]},
    {uid:"e4",side:4,type:"Struttura",alive:true,currentHp:3,pos:[-1,1,0],statuses:[]}
  ]
};
function combatUnits(side=null){ return state.units.filter(u=>u.alive && u.currentHp>0 && Array.isArray(u.pos) && u.type!=="QG" && (side===null || u.side===side)); }
function enemyOf(){ return 2; }
function enemyCombatUnits(player){ return combatUnits(null).filter(u=>u.side!==player && u.side!==4); }
function isEnemySide(player, other){ return other!==player && other!==4; }
function isFieldUnit(u){ return Boolean(u && u.alive && u.currentHp>0 && Array.isArray(u.pos) && u.type!=="QG"); }
function isUntargetableTo(){ return false; }
function isAbilityUntargetableTo(){ return false; }
function canUseAbility(){ return true; }
function hexDistance(a,b){ return Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2])); }
function hasStatus(){ return false; }
function statusBlocks(){ return false; }
function canAct(){ return true; }
function canAttack(){ return true; }
function adjacentAttackTargets(){ return []; }
function isOnPS(){ return false; }
function isOnOrAdjacentToAnyPS(){ return true; }
function adjacentAllyOfOtherAssaultType(){ return true; }
function movableCells(){ return [[1,0,-1]]; }
function playerName(side){ return 'G'+side; }
function log(){}
function applyStatus(){}
function applyDamage(){}
function addPlayerEffect(){}
function getStatus(){ return null; }
function effectiveLife(u){ return u.currentHp; }
function areAdjacent(a,b){ return hexDistance(a,b)===1; }
function getCellAt(){ return null; }
function getUnitAt(){ return null; }
function isCellEnterable(){ return true; }
function neighbors(){ return []; }
function sameCoord(a,b){ return a.every((v,i)=>v===b[i]); }
function uniqueCoords(x){ return x; }
function coordKey(c){ return c.join(','); }
function countControlledPS(){ return 0; }
function playerHandLocked(){ return false; }
function handCardBlocked(){ return false; }
function normalizeCustomTacticCard(card){ return card; }
function customTacticRuntimePlayable(){ return true; }
function validateCustomTacticCard(){ return {playable:true,errors:[]}; }
function customTacticUnitMatchesFilter(){ return true; }
function customTacticInRange(){ return true; }
function canBleed(){ return true; }
function effectiveAbilityCost(){ return 0; }
function purchaseLimitReached(){ return false; }
function countsAsLightCap(){ return false; }
function activeLightCount(){ return 0; }
function lightFieldLimit(){ return 99; }
function lightBucketCount(){ return 0; }
const ELITE_FIELD_LIMIT=1;
`;

const tacticResult = new Function(`${targetingPrefix}\n${read("src/tactics.js")}\nreturn {
  base:tacticTargets(1,{target:"enemy",kind:"raidMark"}).map(u=>u.uid),
  hand:handTacticCandidateUnits(1,{targetSide:"enemy"}).map(u=>u.uid)
};`)();
assert.deepStrictEqual(tacticResult.base, ["e2","e3"]); checks += 1;
assert.deepStrictEqual(tacticResult.hand, ["e2","e3"]); checks += 1;

const customResult = new Function(`${targetingPrefix}\n${read("src/custom_tactics.js")}\nconst card=normalizeCustomTacticCard({custom:true,sourceType:"tactic",name:"Test",cost:1,faction:"Nexus",customAbilitySchema:{active:{kind:"damage",value:2,range:4,filter:"any"}}}); return customTacticCandidateUnits(1,card).map(u=>u.uid);`)();
assert.deepStrictEqual(customResult, ["e2","e3"]); checks += 1;

const abilityResult = new Function(`${targetingPrefix}\n${read("src/abilities.js")}\nreturn abilityTargets(state.units[0],{target:"enemy",range:4,filter:"Any",kind:"damage"}).map(u=>u.uid);`)();
assert.deepStrictEqual(abilityResult, ["e2","e3"]); checks += 1;

// Deck structures have no field cap, including Elite/Pivot structures.
const economyPrefix = `
let state = { currentPlayer:1, factions:{1:"Nexus"}, units:[] };
const COMMANDER_FIELD_LIMIT=1, PIVOT_FIELD_LIMIT=1, ELITE_FIELD_LIMIT=1, HEAVY_FIELD_LIMIT=2, LIGHT_FIELD_LIMIT=10;
const STRUCTURE_FIELD_LIMIT=Infinity, AGATHOI_STRUCTURE_FIELD_LIMIT=Infinity;
function combatUnits(side=null){ return state.units.filter(u=>u.alive && (side===null || u.side===side)); }
function currentPace(){ return {lightCapDefault:10,lightCapByFaction:{}}; }
function playerName(side){ return 'G'+side; }
function log(){}
`;
const economyResult = new Function(`${economyPrefix}\n${read("src/economy.js")}\nstate.units = Array.from({length:12},(_,i)=>({uid:'s'+i,side:1,type:'Struttura',weight:i===0?'Elite':'Leggera',alive:true}));\nreturn {
  ordinary:purchaseLimitReached(1,{id:'S',type:'Struttura',weight:'Leggera'}),
  elite:purchaseLimitReached(1,{id:'SE',type:'Struttura',weight:'Elite'}),
  pivot:purchaseLimitReached(1,{id:'SP',type:'Struttura',weight:'Pivot'}),
  field:fieldLimitFor({id:'S',type:'Struttura',weight:'Leggera'},1),
  label:limitLabel(1,{id:'S',type:'Struttura',weight:'Leggera'})
};`)();
eq(economyResult.ordinary, false, "ordinary deck structure is not field-capped");
eq(economyResult.elite, false, "elite structure is limited by deck copies, not field cap");
eq(economyResult.pivot, false, "pivot structure is limited by deck copies, not field cap");
eq(economyResult.field, Infinity, "structure field limit is infinite");
ok(economyResult.label.includes("nessun cap generale"), "UI label describes deck-only structure policy");

// Tactical Starter structures still stop at two live copies of the Starter role.
const scaleResult = new Function(`
let state={gameScaleMode:"tactical",units:[
  {uid:"a",side:1,type:"Struttura",alive:true,currentHp:2,pos:[0,0,0],spawnSource:"starter",starterRole:"starter_structure"},
  {uid:"b",side:1,type:"Struttura",alive:true,currentHp:2,pos:[1,0,-1],spawnSource:"starter",starterRole:"starter_structure"},
  {uid:"deck",side:1,type:"Struttura",alive:true,currentHp:2,pos:[0,1,-1],spawnSource:"deck"}
]};
function isFieldUnit(u){return Boolean(u&&u.alive&&u.currentHp>0&&Array.isArray(u.pos)&&u.type!=="QG");}
${read("src/game_scale.js")}
return tacticalStarterCapState(1,"starter_structure");
`)();
eq(scaleResult.count, 2, "only live Starter structures occupy the tactical Starter cap");
eq(scaleResult.cap, 2, "Starter structure cap remains two");
eq(scaleResult.blocked, true, "third Starter structure is blocked in tactical mode");

const buildSource = read("src/build_info.js");
ok(buildSource.includes('version: "C2-STABLE-1-F9R3-APK-M4c"'), "F9R3 retains the validated F9O7h3 targeting and structure policy");
ok(read("src/render.js").includes("Edifici: nessun cap generale · Starter Tattica max 2"), "HUD reports the new structure policy");

console.log(`F9O7h3 FFA targeting & structure-cap smoke: ${checks}/${checks} OK`);
