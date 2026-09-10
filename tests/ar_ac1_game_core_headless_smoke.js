"use strict";

const assert=require("assert");
const fs=require("fs");
const path=require("path");
const vm=require("vm");
const root=path.resolve(__dirname,"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");
const context={console,Object,Array,Number,Boolean,Math,Set,Map,Date,START_ENE:3,
  document:new Proxy({}, {get(){throw new Error("GameCore touched document");}}),
  localStorage:{getItem(){return null;},setItem(){}}
};
context.globalThis=context;vm.createContext(context);
for(const relative of [
  "data/maps.js","src/hex.js","data/terrain_registry.js","data/map_definitions.js",
  "src/map_normalization.js","src/map_pathfinding.js","src/map_validation.js","src/map_persistence.js",
  "src/map_state_queries.js","src/map_runtime.js","src/setup_adapter.js","src/state.js",
  "src/core/state_domains.js","src/core/action_service.js","src/core/game_core.js"
]) vm.runInContext(read(relative),context,{filename:relative});
vm.runInContext("globalThis.__core=createGameCoreService({normalizeSetup:(s,d)=>ArenaSetupAdapter.normalize(s,d),createInitialState:createInitialGameState,chooseFirstPlayer:(ids,rng,mode)=>ids.includes(Number(mode))?Number(mode):ids[0],getMapDefinition:getMapDefinitionById,actionService:createGameActionService({handlers:{ping:{apply:p=>p.value}}}),stateDomains:ArenaStateDomains})",context);
function create(mapId,firstPlayer){context.__setup={mapId,firstPlayer,factions:{1:"Nexus",2:"Exordium",3:"Liberti",4:"Agathoi"},modes:{1:"human",2:"bot",3:"bot",4:"bot"},selectedCommanders:{},selectedDecks:{},matchSeed:"AR-AC1-CORE"};return JSON.parse(JSON.stringify(vm.runInContext("__core.createGame(__setup)",context)));}
const two=create("map1_starter",2);
const three=create("map2_triumvirate",3);
const four=create("map3_quadrivium",4);
assert.deepStrictEqual(two.playerIds,[1,2]);
assert.deepStrictEqual(three.playerIds,[1,2,3]);
assert.deepStrictEqual(four.playerIds,[1,2,3,4]);
assert.strictEqual(two.currentPlayer,2);
assert.strictEqual(three.currentPlayer,3);
assert.strictEqual(four.currentPlayer,4);
assert.strictEqual(two.mapId,"map1_starter");
assert(two.cells.length>0&&three.cells.length>two.cells.length&&four.cells.length>three.cells.length);
assert.strictEqual(context.__core.validateAction({type:"ping"}).ok,true);
assert.strictEqual(context.__core.applyAction({type:"ping",payload:{value:7}}).result,7);
assert.strictEqual(context.__core.validateAction({type:"missing"}).ok,false);
const coreSource=read("src/core/game_core.js");
assert(!/document|window\.|localStorage|sessionStorage|indexedDB|render\(/.test(coreSource));
console.log("AR-AC1 GameCore headless smoke: 12/12 OK");
