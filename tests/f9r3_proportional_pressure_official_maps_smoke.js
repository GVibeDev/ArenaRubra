"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const eq = (actual, expected, message) => { assert.strictEqual(actual, expected, message); checks += 1; };
const deep = (actual, expected, message) => { assert.deepStrictEqual(actual, expected, message); checks += 1; };

const context = {
  console,
  localStorage: { getItem(){ return null; }, setItem(){}, removeItem(){} },
  arenaStorageReadJson(){ return { schemaVersion:1, maps:{} }; },
  arenaStorageWriteJson(){ return true; }
};
vm.createContext(context);
for (const rel of [
  "data/maps.js",
  "src/hex.js",
  "data/terrain_registry.js",
  "data/official_maps_f9r3.js",
  "data/map_definitions.js",
  "src/map_runtime.js"
]) vm.runInContext(read(rel), context, { filename: rel });

const enabled = vm.runInContext("getAvailableMapDefinitions()", context);
const names = enabled.map(definition => definition.name);
eq(enabled.length, 6, "Starter + five approved official maps are selectable");
for (const expected of ["Campo Starter", "Diamond 4", "Claustro Clash", "Narrow Path", "Triple Battlefield", "The Valley"]) {
  ok(names.includes(expected), `${expected} is in the official selector set`);
}
ok(!names.includes("Triumvirato Rubro") && !names.includes("Quadrivio Spezzato"), "legacy non-equidistant maps are hidden but retained by id");
ok(Boolean(vm.runInContext('getMapDefinitionById("map2_triumvirate")', context)), "legacy MAP2 remains resolvable for compatibility");

const expectedCenters = {
  custom_single_ms0nf51r: [0,0,0],
  map1_starter_copy: [0,0,0],
  custom_double_ms0ra3ds: [0,-4,4],
  map3_quadrivium_copy: [2,3,-5],
  custom_double_ms0cunhu: [2,0,-2]
};
for (const [id, coord] of Object.entries(expectedCenters)) {
  const definition = vm.runInContext(`getMapDefinitionById(${JSON.stringify(id)})`, context);
  const validation = context.validateMapDefinition(definition);
  ok(validation.valid, `${definition.name} passes full map validation`);
  const central = context.getCentralStrategicPoint(definition);
  deep(Array.from(central.coord), coord, `${definition.name} central PS coordinate is frozen`);
  eq(central.id, "ps-center", `${definition.name} central PS uses semantic id`);
  const distances = Array.from(context.centralStrategicPointLinearDistances(definition), entry => entry.distance);
  eq(new Set(distances).size, 1, `${definition.name} center is linearly equidistant from all HQs`);
  const psIds = definition.strategicPoints.map(ps => ps.id);
  eq(new Set(psIds).size, psIds.length, `${definition.name} has unique PS ids`);
  const hazardIds = (definition.initialHazards || []).map(hazard => hazard.id);
  eq(new Set(hazardIds).size, hazardIds.length, `${definition.name} has unique hazard ids`);
}
const triple = vm.runInContext('getMapDefinitionById("map3_quadrivium_copy")', context);
deep(Array.from(context.centralStrategicPointLinearDistances(triple), entry => entry.distance), [11,11,11,11], "Triple Battlefield corrected center is 11 cells from every HQ");
const valley = vm.runInContext('getMapDefinitionById("custom_double_ms0cunhu")', context);
eq(valley.playerCount, 3, "The Valley is officially a three-player map");
ok(/^3 Giocatori/.test(valley.description), "The Valley description matches its player count");
const narrow = vm.runInContext('getMapDefinitionById("custom_double_ms0ra3ds")', context);
eq(narrow.presentation.backgroundAssetPath, "assets/maps/backgrounds/f9r3_narrow_path_desertcenter.webp", "Narrow Path uses packaged static background");
ok(fs.existsSync(path.join(root, narrow.presentation.backgroundAssetPath)), "Narrow Path packaged background exists");

// Formula and runtime qualification.
const pressureSource = `
const EventTypes={PRESSURE_CHANGED:"PRESSURE_CHANGED",VICTORY:"VICTORY",PS_CONTROL_CHANGED:"PS_CONTROL_CHANGED"};
let state=null;
const logs=[];
function $(id){return null;}
function log(message){logs.push(message);}
function sameCoord(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.every((v,i)=>v===b[i]);}
function getActiveMapDefinition(){return state.mapDefinition;}
function getCentralStrategicPoint(definition){return definition.strategicPoints.find(ps=>ps.id===definition.centralStrategicPointId)||null;}
function isPsLocked(){return false;}
function updateControlFromOccupants(){}
function getActivePlayers(){return state.players.filter(p=>!p.eliminated).map(p=>p.id);}
function countControlledPS(player){return state.cells.filter(c=>c.ps&&c.control===player).length;}
function combatUnits(player){return state.units.filter(u=>u.side===player&&u.alive);}
function playerName(player){return 'G'+player;}
function recordMatchResult(){}
function renderMatchupStats(){}
function renderAll(){}
function emitGameEvent(){}
function enemyOf(player){return player===1?2:1;}
function getHq(){return {pos:[0,0,0]};}
function getUnitAt(){return null;}
function hexDistance(a,b){return Math.max(...a.map((v,i)=>Math.abs(v-b[i])));}
${read("data/maps.js")}
${read("src/constants.js")}
${read("src/board.js")}
${read("src/rules.js")}
updateControlFromOccupants=function(){};
function makeState(players,totalPs,pace,controls){
 const center=[0,0,0];
 const points=Array.from({length:totalPs},(_,i)=>({id:i===0?'ps-center':'ps-'+(i+1),coord:i===0?center:[i,-i,0],tags:i===0?['central']:[]}));
 return {pacePreset:pace,turn:1,winner:null,winnerSide:null,winType:null,mapId:'test',mapDefinition:{id:'test',playerCount:players,strategicPoints:points,centralStrategicPointId:'ps-center'},playerIds:Array.from({length:players},(_,i)=>i+1),players:Array.from({length:players},(_,i)=>({id:i+1,eliminated:false})),cells:points.map((ps,i)=>({coord:ps.coord,ps:true,control:controls?controls[i]:null})),pressure:Object.fromEntries(Array.from({length:players},(_,i)=>[i+1,0])),energy:Object.fromEntries(Array.from({length:players},(_,i)=>[i+1,3])),factions:Object.fromEntries(Array.from({length:players},(_,i)=>[i+1,'F'+(i+1)])),units:[],desperation:{},psLocks:[],autoResignEnabled:false};
}
return {makeState, getState:()=>state, setState:v=>state=v, pressureMapScale, pressureStartRound, pressureWinLimit, maxRoundLimit, pressureControlThreshold, pressureRuleProfile, resolveEndOfRound, logs};
`;
const runtime = new Function(pressureSource)();
runtime.setState(runtime.makeState(2,3,"standard"));
eq(runtime.pressureMapScale(), 3, "2 players / 3 PS scale is ceil(5/2)=3");
eq(runtime.pressureStartRound(), 23, "Standard starts at 20+C");
eq(runtime.pressureWinLimit(), 7, "Standard requires seven increments");
eq(runtime.maxRoundLimit(), 50, "Standard hard limit is round 50");
eq(runtime.pressureControlThreshold(3), 2, "Three PS require central included in two controlled PS");
runtime.setState(runtime.makeState(2,3,"competitive"));
eq(runtime.pressureStartRound(), 20, "Rapid starts at standard minus C, therefore round 20");
eq(runtime.pressureWinLimit(), 5, "Rapid requires five increments");
eq(runtime.maxRoundLimit(), 33, "Rapid limit is 30+C");
runtime.setState(runtime.makeState(4,9,"standard"));
eq(runtime.pressureMapScale(), 7, "4 players / 9 PS scale is ceil(13/2)=7");
eq(runtime.pressureStartRound(), 27, "Diamond Standard starts at round 27");
eq(runtime.pressureControlThreshold(9), 5, "Nine PS require five including center");
runtime.setState(runtime.makeState(4,9,"competitive"));
eq(runtime.maxRoundLimit(), 37, "Diamond Rapid ends at round 37");

let testState = runtime.makeState(4,7,"standard",[1,1,1,1,2,3,4]);
testState.turn=26;
runtime.setState(testState);
runtime.resolveEndOfRound();
eq(runtime.getState().pressure[1],1,"player controlling center and 4/7 PS gains pressure");
testState = runtime.makeState(4,7,"standard",[2,1,1,1,1,3,4]);
testState.turn=26;
runtime.setState(testState);
runtime.resolveEndOfRound();
eq(runtime.getState().pressure[1],0,"4/7 without the central PS does not gain pressure");
ok(runtime.logs.some(line=>line.includes("PS centrale")), "pressure log explains the central requirement");

const editorSource = read("src/map_editor.js");
ok(editorSource.includes('["central_ps", "PS centrale"]'), "Map Editor exposes central PS designation");
ok(editorSource.includes("E_MAP_CENTRAL_PS_NOT_EQUIDISTANT") || read("src/map_runtime.js").includes("E_MAP_CENTRAL_PS_NOT_EQUIDISTANT"), "validator enforces linear equidistance");
ok(editorSource.includes('editor-${mapEditorState.toolValue}-${mapRuntimeCellKey(target)'), "new editor hazards receive coordinate-unique source ids");
const build = read("src/build_info.js");
ok(build.includes('version: "C2-STABLE-1-F9R3-APK-M4c"'), "F9R3 build metadata is current");

console.log(`F9R3 proportional pressure & official maps smoke: ${checks}/${checks} OK`);
