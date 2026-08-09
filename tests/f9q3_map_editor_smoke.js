"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = [
  "data/terrain_registry.js",
  "data/official_maps_f9r3.js",
  "data/map_definitions.js",
  "src/map_runtime.js",
  "src/map_backgrounds.js",
  "src/map_editor.js"
];
const prefix = `
let __store = { schemaVersion: 1, maps: {} };
function arenaStorageReadJson(_key, fallback) { return JSON.parse(JSON.stringify(__store || fallback)); }
function arenaStorageWriteJson(_key, value) { __store = JSON.parse(JSON.stringify(value)); return true; }
let symmetryMode = "none";
const document = {
  getElementById(id) {
    if (id === "mapEditorSymmetry") return { value:symmetryMode };
    return null;
  }
};
`;
const checks = `
const expectedTemplateCells = { single:127, double:229, triple:265 };
for (const template of ["single", "double", "triple"]) {
  const definition = mapEditorTemplateDefinition(template);
  const validation = validateMapDefinition(definition);
  assert.strictEqual(validation.valid, true, template + ": " + JSON.stringify(validation.errors));
  assert.strictEqual(definition.official, false);
  assert.strictEqual(definition.editable, true);
  assert.strictEqual(definition.geometry.cells.length, expectedTemplateCells[template]);
}
const empty = mapEditorTemplateDefinition("empty");
assert.strictEqual(validateMapDefinition(empty).valid, false);

const draft = duplicateMapDefinition("custom_double_ms0ra3ds").definition;
draft.name = "Test editor";
draft.description = "Round-trip editor";
draft.metadata.tags = ["custom", "round-trip"];
const obstacleCell = draft.geometry.cells.find(cell => cell.cellRole === "normal" && cell.terrainType === "free");
obstacleCell.terrainType = "obstacle";
let validation = validateMapDefinition(draft);
if (!validation.valid && validation.errors.some(issue => issue.code === "E_MAP_DISCONNECTED")) {
  obstacleCell.terrainType = "difficult";
  validation = validateMapDefinition(draft);
}
assert.strictEqual(validation.valid, true);
const saved = saveCustomMapDefinition(draft);
assert.strictEqual(saved.ok, true);
const json = exportMapDefinitionJson(saved.definition);
assert.strictEqual(json.ok, true);
const imported = importMapDefinitionJson(json.json, { save: false });
assert.strictEqual(imported.ok, true);
assert.strictEqual(imported.conflict, true);
assert.ok(imported.definition.id.includes("import"));
assert.strictEqual(deleteCustomMapDefinition(saved.definition.id).ok, true);

mapEditorState.draft = mapEditorTemplateDefinition("triple");
mapEditorState.draft.id = "editor_symmetry";
mapEditorState.undo = [];
mapEditorState.redo = [];
symmetryMode = "rotate3";
const sourceNeighbor = [1,-1,0];
const replicas = mapEditorSymmetryCoords(sourceNeighbor);
assert.strictEqual(replicas.length, 3);
assert.ok(replicas.every(coord => getMapCell(coord, mapEditorState.draft)));
mapEditorState.tool = "terrain";
mapEditorState.toolValue = "difficult";
mapEditorApplyTool(sourceNeighbor);
assert.strictEqual(mapEditorState.undo.length, 1);
assert.ok(replicas.every(coord => getMapCell(coord, mapEditorState.draft).terrainType === "difficult"));
mapEditorUndo();
assert.ok(replicas.some(coord => getMapCell(coord, mapEditorState.draft).terrainType !== "difficult"));
mapEditorRedo();
assert.ok(replicas.every(coord => getMapCell(coord, mapEditorState.draft).terrainType === "difficult"));

const hazardCell = mapEditorState.draft.geometry.cells.find(cell => cell.cellRole === "normal" && cell.terrainType !== "obstacle");
hazardCell.initialHazard = { type:"mine", sourceType:"map", sourceId:"editor-mine", ownerPlayerId:null, duration:null, payload:{ infantryDamage:1 } };
mapEditorSyncInitialHazards();
assert.ok(mapEditorState.draft.initialHazards.some(hazard => hazard.type === "mine" && mapRuntimeCellKey(hazard.coord) === mapRuntimeCellKey(hazardCell.coord)));
const hazardExport = exportMapDefinitionJson(mapEditorState.draft);
assert.strictEqual(hazardExport.ok, true);
const hazardImport = importMapDefinitionJson(hazardExport.json, { save:false });
assert.strictEqual(hazardImport.ok, true);
const importedHazardCell = getMapCell(hazardCell.coord, hazardImport.definition);
assert.strictEqual(importedHazardCell.terrainType, hazardCell.terrainType);
assert.strictEqual(importedHazardCell.initialHazard.type, "mine");
assert.ok(hazardImport.definition.initialHazards.some(hazard => hazard.type === "mine"));

const componentDraft = mapEditorTemplateDefinition("double");
mapEditorState.draft = componentDraft;
const beforeComponentCells = componentDraft.geometry.cells.length;
componentDraft.geometry.components[1].origin = [5,0,-5];
mapEditorRebuildGeometryFromComponents();
assert.notStrictEqual(mapEditorState.draft.geometry.cells.length, beforeComponentCells);
assert.strictEqual(new Set(mapEditorState.draft.geometry.cells.map(cell => mapRuntimeCellKey(cell.coord))).size, mapEditorState.draft.geometry.cells.length);

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const id of [
  "mapEditorScreen", "mapEditorCanvas", "mapEditorMapSelect", "mapEditorTemplateSelect",
  "mapEditorUndoBtn", "mapEditorRedoBtn", "mapEditorFitBtn", "mapEditorSaveBtn",
  "mapEditorExportBtn", "mapEditorImportBtn", "mapEditorValidationList", "mapEditorLabBtn",
  "mapEditorDescriptionInput", "mapEditorTagsInput", "mapEditorComponentSelect",
  "mapEditorComponentRadius", "mapEditorComponentOriginX", "mapEditorComponentOriginY",
  "mapEditorNormalizeComponentsBtn"
]) {
  assert.ok(html.includes('id="' + id + '"'), id + " missing");
}
assert.ok(html.includes('data-app-open-map-editor'));
assert.ok(html.includes('src="src/map_editor.js"'));
assert.ok(html.includes('src="src/map_runtime.js"'));
console.log("F9Q3 map editor smoke: OK");
`;

const source = prefix + files.map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n") + checks;
new Function("assert", "console", "fs", "path", "root", source)(assert, console, fs, path, root);
