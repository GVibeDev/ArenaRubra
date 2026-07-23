"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "src/camera_interaction.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
const game = fs.readFileSync(path.join(root, "src/game.js"), "utf8");
const mobile = fs.readFileSync(path.join(root, "src/mobile.js"), "utf8");
const camera = fs.readFileSync(path.join(root, "src/camera.js"), "utf8");
const build = fs.readFileSync(path.join(root, "src/build_info.js"), "utf8");

let checks = 0;
function ok(value, message) { assert.ok(value, message); checks += 1; }
function equal(actual, expected, message) { assert.strictEqual(actual, expected, message); checks += 1; }
function near(actual, expected, epsilon, message) { assert.ok(Math.abs(actual - expected) <= epsilon, `${message}: ${actual} vs ${expected}`); checks += 1; }

const context = vm.createContext({ console, Date, Math, Map, Set, Number, Array, Object, String, Boolean, JSON, setTimeout, clearTimeout });
vm.runInContext(source, context, { filename: "camera_interaction.js" });

const run = expression => vm.runInContext(expression, context);
equal(run("cameraInteractionClampValue(12, 0, 10)"), 10, "clamp superiore");
equal(run("cameraInteractionClampValue(-2, 0, 10)"), 0, "clamp inferiore");
equal(run("cameraInteractionClampValue(4, 0, 10)"), 4, "clamp interno");

const zoomTranslation = run("cameraInteractionComputeZoomTranslation({x:700,y:450},{x:500,y:350},{x:20,y:-10},1,1.5)");
near(zoomTranslation.x, -70, 0.0001, "zoom ancorato X");
near(zoomTranslation.y, -65, 0.0001, "zoom ancorato Y");

const localOldX = (700 - 500 - 20) / 1;
const localOldY = (450 - 350 + 10) / 1;
near(500 + zoomTranslation.x + localOldX * 1.5, 700, 0.0001, "ancora X invariata");
near(350 + zoomTranslation.y + localOldY * 1.5, 450, 0.0001, "ancora Y invariata");

ok(Array.from(run("cameraParseHexCoord('2,-1,-1')")).join(",") === "2,-1,-1", "parsing coord stringa");
ok(Array.from(run("cameraParseHexCoord([0,1,-1])")).join(",") === "0,1,-1", "parsing coord array");
equal(run("cameraParseHexCoord('bad')"), null, "coord invalida");

// Runtime desktop minimo.
context.boardCamera = { x: 0, y: 0, zoom: 1, fitScale: 1, mode: "fit" };
context.BOARD_CAMERA_W = 920;
context.BOARD_CAMERA_H = 780;
context.applyBoardCamera = () => {};
context.updateBoardCameraHud = () => {};
context.boardPointForCoord = coord => ({ x: 460 + coord[0] * 50, y: 390 + coord[2] * 45 });
context.document = {
  body: { classList: { contains: () => false } },
  getElementById(id) {
    if (id === "boardWrap") return { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 700 }) };
    if (id === "mapCameraZoomLabel") return { textContent: "" };
    return null;
  }
};
context.window = { requestAnimationFrame: fn => fn() };

run("cameraSetZoom(1.5, { anchor:{x:750,y:350}, animate:false })");
near(context.boardCamera.zoom, 1.5, 0.0001, "cameraSetZoom applica zoom");
equal(context.boardCamera.mode, "manual", "zoom entra in manuale");
near(context.boardCamera.x, -125, 0.0001, "zoom ancorato modello X");
near(context.boardCamera.y, 0, 0.0001, "zoom ancorato modello Y");

run("cameraInteractionPanBy(9999, -9999)");
ok(context.boardCamera.x < 1000 && context.boardCamera.x > 0, "pan X limitato");
ok(context.boardCamera.y > -1000 && context.boardCamera.y < 0, "pan Y limitato");

run("cameraFocusHex([1,-1,0], { zoom:1.4, animate:false })");
equal(context.boardCamera.mode, "focus", "focus hex imposta modalità");
near(context.boardCamera.zoom, 1.4, 0.0001, "focus hex imposta zoom");

context.state = { units: [{ uid: "u1", pos: [2,-2,0] }] };
equal(run("cameraFocusUnit('u1', { keepZoom:true, animate:false })"), true, "focus unità");
context.getHq = side => ({ uid: `hq-${side}`, pos: side === 1 ? [-6,0,6] : [6,0,-6] });
equal(run("cameraFocusHQ(1, { keepZoom:true, animate:false })"), true, "focus QG");

equal(run("cameraLockInput(true)"), true, "blocco input");
equal(run("cameraGetState().locked"), true, "diagnostica blocco");
equal(run("cameraLockInput(false)"), false, "sblocco input");

const apiNames = ["cameraFocusHex", "cameraFocusUnit", "cameraFocusHQ", "cameraFitCoords", "cameraFitDeploymentTargets", "cameraSetZoom", "cameraResetView", "cameraLockInput", "cameraDiagnostics"];
for (const name of apiNames) equal(run(`typeof ${name}`), "function", `API ${name}`);

ok(index.includes('id="mapCameraControls"'), "controlli camera presenti");
ok(index.includes('id="cameraZoomOutBtn"'), "pulsante zoom meno");
ok(index.includes('id="cameraZoomInBtn"'), "pulsante zoom più");
ok(index.includes('id="cameraCenterBtn"'), "pulsante centra");
ok(index.includes('id="cameraFitBtn"'), "pulsante fit");
ok(index.includes('<script src="src/camera_interaction.js"></script>'), "script camera interaction caricato");
ok(index.indexOf('src/mobile.js') < index.indexOf('src/camera_interaction.js'), "interaction caricata dopo mobile");
ok(css.includes('touch-action: none !important'), "touch browser disattivato sulla mappa");
ok(css.includes('.cameraDragging'), "stato dragging visuale");
ok(game.includes('cameraResetForNewGame'), "reset camera su nuova partita");
ok(!mobile.includes('centerApkM4CameraOn(selected.pos)'), "render mobile non centra selezioni");
ok(mobile.includes('preserveCamera:true'), "resize mobile preserva camera");
ok(camera.includes('active.mode'), "HUD usa camera attiva");
ok(build.includes('C2-STABLE-1-F9O4d-APK-M4c') || build.includes('C2-STABLE-1-F9O4c-APK-M4c') || build.includes('C2-STABLE-1-F9O4b-APK-M4c') || build.includes('C2-STABLE-1-F9O4a-APK-M4c') || build.includes('C2-STABLE-1-F9O4-APK-M4c') || build.includes('C2-STABLE-1-F9O2e-APK-M4c') || build.includes('C2-STABLE-1-F9O2d-APK-M4c') || build.includes('C2-STABLE-1-F9O2c-APK-M4c') || build.includes('C2-STABLE-1-F9O2b-APK-M4c'), "metadata F9O2b o successiva");
ok(source.includes('CAMERA_INTERACTION_DRAG_THRESHOLD'), "soglia click/drag");
ok(source.includes('pointercancel'), "gestione pointer cancel");
ok(source.includes('lostpointercapture'), "gestione perdita capture");
ok(source.includes('event.stopImmediatePropagation'), "soppressione click dopo pan");
ok(source.includes('Math.exp(-event.deltaY'), "zoom rotellina continuo");
ok(source.includes('startDistance'), "pinch distance tracking");
ok(source.includes('nativeAnchor'), "pinch conserva ancora");

// Regressione F9O2a: il tap su una cella non deve acquisire il puntatore.
// La capture deve iniziare soltanto dopo la soglia di trascinamento.
let captureCalls = [];
const surfaceMock = {
  classList: { toggle() {} },
  setPointerCapture(pointerId) { captureCalls.push(pointerId); },
  querySelectorAll() { return []; }
};
const wrapMock = {
  classList: { toggle() {} },
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 700 })
};
context.document.getElementById = id => {
  if (id === "boardVisualStack") return surfaceMock;
  if (id === "boardWrap") return wrapMock;
  if (id === "mapCameraZoomLabel") return { textContent: "" };
  return null;
};
run("cameraInteractionState.pointers.clear(); cameraInteractionState.gesture=null; cameraInteractionState.dragging=false; cameraInteractionState.suppressClickUntil=0");
const tapDown = { pointerType:"mouse", button:0, pointerId:31, clientX:100, clientY:100, cancelable:true, preventDefault(){} };
context.tapDown = tapDown;
run("cameraInteractionHandlePointerDown(tapDown)");
equal(captureCalls.length, 0, "tap: nessuna pointer capture al pointerdown");
const tapUp = { pointerId:31 }; context.tapUp=tapUp;
run("cameraInteractionFinishPointer(tapUp)");
equal(run("cameraInteractionState.suppressClickUntil"), 0, "tap: click non soppresso");
let tapPrevented=false, tapStopped=false;
context.tapClick={ preventDefault(){tapPrevented=true;}, stopPropagation(){tapStopped=true;}, stopImmediatePropagation(){tapStopped=true;} };
run("cameraInteractionHandleClickCapture(tapClick)");
equal(tapPrevented, false, "tap: click cella preservato");
equal(tapStopped, false, "tap: propagazione preservata");

const dragDown = { pointerType:"mouse", button:0, pointerId:32, clientX:100, clientY:100, cancelable:true, preventDefault(){} };
context.dragDown=dragDown; run("cameraInteractionHandlePointerDown(dragDown)");
const dragMove = { pointerId:32, clientX:112, clientY:100, cancelable:true, preventDefault(){} };
context.dragMove=dragMove; run("cameraInteractionHandlePointerMove(dragMove)");
equal(captureCalls.includes(32), true, "drag: pointer capture dopo soglia");
equal(run("cameraInteractionState.dragging"), true, "drag: stato trascinamento attivo");
context.dragUp={pointerId:32}; run("cameraInteractionFinishPointer(dragUp)");
ok(run("cameraInteractionState.suppressClickUntil > Date.now()"), "drag: click successivo soppresso");

console.log(`F9O2 camera interaction smoke: ${checks}/${checks}`);
