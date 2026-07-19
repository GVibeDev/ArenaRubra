"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");
const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const cameraInteraction = read("src/camera_interaction.js");
const camera = read("src/camera.js");
const mobile = read("src/mobile.js");
const controller = read("src/controller.js");
const gameScreen = read("src/game_screen.js");
const deployment = read("src/deployment.js");
const render = read("src/render.js");
const build = read("src/build_info.js");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const equal = (actual, expected, message) => { assert.strictEqual(actual, expected, message); checks += 1; };

ok(build.includes("C2-STABLE-1-F9O3-APK-M4c") || build.includes("C2-STABLE-1-F9O2e-APK-M4c") || build.includes("C2-STABLE-1-F9O2d-APK-M4c") || build.includes("C2-STABLE-1-F9O2c-APK-M4c") || build.includes("C2-STABLE-1-F9O2b-APK-M4c"), "metadata F9O2b o successiva");
ok(build.includes("event-narrative-overlay-foundation") || build.includes("mission-accessibility-build-flow") || build.includes("token-layering-active-unit-cues") || build.includes("bot-camera-freeze-hotfix") || build.includes("camera-autonomy-inspection"), "canale F9O2b o successivo");
ok(!mobile.includes("centerApkM4CameraOn(selected.pos)"), "nessun autofocus render mobile");
ok(!gameScreen.includes("centerApkM4CameraOn(apkM4FocusCoord())"), "scheda unità non centra camera");
ok(!camera.includes('if (boardCamera.mode === "focus") {\n    const coord = boardCameraFocusCoord()'), "render desktop non ricentra focus");
ok(controller.includes("gameScreenInspectUnit(unit)"), "ispezione bot collegata");
ok(controller.includes("Non usa selectedId"), "contratto ispezione non gameplay");
ok(gameScreen.includes("inspectedUnitId"), "stato ispezione UI separato");
ok(render.includes("gameScreenDisplayedUnitId"), "highlight usa unità mostrata");
ok(render.includes("gameScreenDisplayedUnit()"), "scheda usa unità mostrata");
ok(deployment.includes("cameraScheduleDeploymentFit(player, bp"), "fit sbarco carte mano");
ok(deployment.includes("cameraScheduleDeploymentFit(state.currentPlayer, bp"), "fit sbarco starter/mercato");
ok(cameraInteraction.includes('mode:"deployment-fit"'), "modalità sbarco dedicata");
ok(cameraInteraction.includes("cameraFitDeploymentTargets"), "API fit sbarco");
ok(cameraInteraction.includes("cameraFitCoords"), "API fit coordinate");

// Runtime cameraFitCoords: include tutte le celle e centra il loro bounding box.
const context = vm.createContext({ console, Math, Number, Array, Object, String, Boolean, JSON, Set, Map, Date, setTimeout, clearTimeout });
vm.runInContext(cameraInteraction, context, { filename:"camera_interaction.js" });
context.boardCamera = { x:0, y:0, zoom:1, fitScale:0.75, mode:"manual" };
context.BOARD_CAMERA_W = 920;
context.BOARD_CAMERA_H = 780;
context.HEX_SIZE = 45;
context.computeBoardFitScale = () => 0.75;
context.boardPointForCoord = coord => ({ x:460 + coord[0]*80, y:390 + coord[2]*70 });
context.applyBoardCamera = () => {};
context.updateBoardCameraHud = () => {};
context.document = {
  body:{ classList:{ contains:()=>false } },
  getElementById(id) {
    if (id === "boardWrap") return { getBoundingClientRect:()=>({left:0,top:0,width:900,height:600}) };
    if (id === "mapCameraZoomLabel") return { textContent:"" };
    return null;
  }
};
context.window = { requestAnimationFrame: fn => fn() };
context.coords = [[-4,0,4],[4,0,-4],[0,0,0]];
equal(vm.runInContext("cameraFitCoords(coords, { animate:false })", context), true, "fit coordinate eseguito");
equal(context.boardCamera.mode, "deployment-fit", "modalità deployment-fit");
ok(context.boardCamera.zoom >= 0.72 && context.boardCamera.zoom <= 1.72, "zoom fit nei limiti");
ok(Number.isFinite(context.boardCamera.x) && Number.isFinite(context.boardCamera.y), "pan fit finito");

// Runtime controller: durante bot ispeziona senza mutare selectedId/mode/pending.
const ctrl = vm.createContext({ console });
ctrl.state = { winner:null, currentPlayer:2, modes:{1:"human",2:"bot"} };
ctrl.botRunning = true;
ctrl.selectedId = "ai-selection";
ctrl.mode = "ability";
ctrl.pendingAbility = { id:"ai-ability" };
ctrl.pendingHandCardUid = "ai-card";
ctrl.missionInteractionBlocked = () => false;
ctrl.getUnitAt = () => ({ uid:"inspect-me", alive:true, pos:[0,0,0], side:1 });
let inspected = null, rendered = 0, revealed = 0;
ctrl.gameScreenInspectUnit = unit => { inspected = unit.uid; return true; };
ctrl.renderAll = () => { rendered += 1; };
ctrl.gameScreenRevealInspectionPanels = () => { revealed += 1; };
vm.runInContext(controller, ctrl, { filename:"controller.js" });
vm.runInContext("handleCellClick([0,0,0])", ctrl);
equal(inspected, "inspect-me", "unità ispezionata durante bot");
equal(rendered, 1, "render ispezione");
equal(revealed, 1, "pannelli ispezione aperti");
equal(ctrl.selectedId, "ai-selection", "selectedId IA invariato");
equal(ctrl.mode, "ability", "mode IA invariato");
equal(ctrl.pendingHandCardUid, "ai-card", "pending IA invariato");

console.log(`F9O2b camera autonomy/inspection smoke: ${checks}/${checks}`);
