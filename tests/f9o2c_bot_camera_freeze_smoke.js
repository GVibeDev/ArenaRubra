"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");
const root = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const camera = read("src/camera.js");
const mobile = read("src/mobile.js");
const build = read("src/build_info.js");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const equal = (actual, expected, message) => { assert.strictEqual(actual, expected, message); checks += 1; };

ok(build.includes("C2-STABLE-1-F9O4d-APK-M4c") || build.includes("C2-STABLE-1-F9O4c-APK-M4c") || build.includes("C2-STABLE-1-F9O4b-APK-M4c") || build.includes("C2-STABLE-1-F9O4a-APK-M4c") || build.includes("C2-STABLE-1-F9O4-APK-M4c") || build.includes("C2-STABLE-1-F9O3-APK-M4c") || build.includes("C2-STABLE-1-F9O2e-APK-M4c") || build.includes("C2-STABLE-1-F9O2d-APK-M4c") || build.includes("C2-STABLE-1-F9O2c-APK-M4c"), "metadata F9O2c o successiva");
ok(build.includes("cross-platform-render-signature-integrity-hotfix") || build.includes("android-render-stability-hotfix") || build.includes("incremental-dom-renderer") || build.includes("android-camera-performance-hotfix") || build.includes("hidden-bot-hand-card-backs-motion") || build.includes("event-narrative-overlay-foundation") || build.includes("mission-accessibility-build-flow") || build.includes("token-layering-active-unit-cues") || build.includes("bot-camera-freeze-hotfix"), "canale F9O2c o successiva");

const syncBody = camera.match(/function syncBoardCameraAfterRender\(\) \{[\s\S]*?\n\}/)?.[0] || "";
ok(syncBody.length > 0, "sync camera trovato");
ok(!syncBody.includes("fitApkM4Board"), "render mobile non richiama fit");
ok(!syncBody.includes("computeBoardFitScale"), "render desktop non ricalcola fitScale");
ok(syncBody.includes("applyApkM4Camera"), "render mobile riapplica solo trasformazione corrente");
ok(syncBody.includes("applyBoardCamera"), "render desktop riapplica solo trasformazione corrente");

const renderPatch = mobile.match(/function patchApkM4RenderRefresh\(\) \{[\s\S]*?\n\}/)?.[0] || "";
ok(renderPatch.length > 0, "patch render mobile trovato");
ok(!renderPatch.includes("fitApkM4Board({ preserveCamera:true })"), "secondo fit post-render eliminato");

// Runtime desktop: cento render bot non cambiano alcun parametro camera.
const desktop = vm.createContext({ console, Math, Number, Array, Object, String, Boolean, JSON, Set, Map, Date, setTimeout, clearTimeout });
desktop.document = {
  body:{ classList:{ contains:()=>false } },
  getElementById(id) {
    if (id === "boardVisualStack") return { id, style:{setProperty(){}}, classList:{add(){},remove(){}} };
    if (id === "boardWrap") return { style:{setProperty(){}}, getBoundingClientRect:()=>({width:700,height:500}) };
    return null;
  }
};
desktop.window = { addEventListener(){}, visualViewport:null };
desktop.CENTER_X=460; desktop.CENTER_Y=390; desktop.HEX_SIZE=45; desktop.CENTER_PS_COORD=[0,0,0];
vm.runInContext(camera, desktop, {filename:"camera.js"});
vm.runInContext("boardCamera.initialized=true; boardCamera.fitScale=.6137; boardCamera.zoom=1.427; boardCamera.x=83; boardCamera.y=-47; boardCamera.mode='manual';", desktop);
vm.runInContext("for(let i=0;i<100;i++) syncBoardCameraAfterRender();", desktop);
const d = vm.runInContext("({fitScale:boardCamera.fitScale,zoom:boardCamera.zoom,x:boardCamera.x,y:boardCamera.y,mode:boardCamera.mode})", desktop);
equal(d.fitScale, .6137, "desktop fitScale congelato");
equal(d.zoom, 1.427, "desktop zoom congelato");
equal(d.x, 83, "desktop x congelata");
equal(d.y, -47, "desktop y congelata");
equal(d.mode, "manual", "desktop mode congelata");

// Runtime mobile: cento render bot chiamano apply, mai fit, e preservano il modello.
let applyCount=0, fitCount=0;
const mobileCtx = vm.createContext({ console, Math, Number, Array, Object, String, Boolean, JSON, Set, Map, Date, setTimeout, clearTimeout });
mobileCtx.document = {
  body:{ classList:{ contains:name=>name === "mobile-apk-m4" } },
  getElementById(){ return null; }
};
mobileCtx.window = { addEventListener(){}, visualViewport:null };
mobileCtx.CENTER_X=460; mobileCtx.CENTER_Y=390; mobileCtx.HEX_SIZE=45; mobileCtx.CENTER_PS_COORD=[0,0,0];
vm.runInContext(camera, mobileCtx, {filename:"camera.js"});
mobileCtx.apkM4Camera={mobile:true,fitScale:.4821,zoom:1.731,x:-31,y:64,mode:"manual"};
mobileCtx.applyApkM4Camera=()=>{applyCount+=1;};
mobileCtx.fitApkM4Board=()=>{fitCount+=1;};
mobileCtx.updateApkM4StatusStrip=()=>{};
mobileCtx.cameraInteractionUpdateControls=()=>{};
vm.runInContext("for(let i=0;i<100;i++) syncBoardCameraAfterRender();", mobileCtx);
equal(applyCount, 100, "mobile riapplica trasformazione corrente");
equal(fitCount, 0, "mobile non esegue fit durante render bot");
equal(mobileCtx.apkM4Camera.fitScale, .4821, "mobile fitScale congelato");
equal(mobileCtx.apkM4Camera.zoom, 1.731, "mobile zoom congelato");
equal(mobileCtx.apkM4Camera.x, -31, "mobile x congelata");
equal(mobileCtx.apkM4Camera.y, 64, "mobile y congelata");
equal(mobileCtx.apkM4Camera.mode, "manual", "mobile mode congelata");

console.log(`F9O2c bot camera freeze smoke: ${checks}/${checks}`);
