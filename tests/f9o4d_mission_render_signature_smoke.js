"use strict";
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
let checks = 0;
function ok(value, message) { checks += 1; if (!value) throw new Error(message); }
function neq(a, b, message) { ok(a !== b, `${message}: ${a}`); }

const ctx = { console, Set, Date, JSON, Math, Number, String, Boolean, Object, Array };
ctx.globalThis = ctx;
ctx.state = {
  currentPlayer: 1,
  turn: 4,
  modes: { 1: "human", 2: "bot" },
  winner: null,
  handLocked: { 1: 0 },
  energy: { 1: 8 },
  missions: {},
  hand: { 1: [] },
  missionPendingReward: null
};
const runtime = {
  active: true,
  missionId: "NXMSN01",
  missionName: "Civiltà Algoritmica",
  missionClass: "ordinary",
  cycle: 1,
  status: "tracking",
  played: false,
  revealed: false,
  rewardPending: false,
  ready: false,
  readyCount: 1,
  recoveryLocked: false,
  entries: {
    o1: { current: 1, target: 2, streak: 0, satisfied: false, completed: false, detail: "1 / 2" },
    o2: { current: 2, target: 3, streak: 0, satisfied: false, completed: false, detail: "2 / 3" },
    o3: { current: 6, target: 8, streak: 0, satisfied: false, completed: false, detail: "6 / 8" }
  }
};
ctx.state.missions[1] = runtime;
ctx.missionRuntime = side => ctx.state.missions[side];
ctx.missionDefinitionById = () => ({ objectives: [{ id: "o1" }, { id: "o2" }, { id: "o3" }] });
ctx.missionObjectivesFor = definition => definition.objectives;
ctx.missionCardForSide = () => ({ cardUid: "mission", sourceType: "mission" });
ctx.handCardBlocked = () => false;
ctx.playerHandLocked = () => false;
ctx.missionCanPlayOrdinary = () => ({ ok: runtime.ready, reason: runtime.ready ? "Pronta" : "In corso" });
ctx.renderAll = () => {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "src/mission_ui.js"), "utf8"), ctx);

const s0 = vm.runInContext("missionUiRenderSignature(1)", ctx);
runtime.entries.o1.current = 2;
runtime.entries.o1.satisfied = true;
runtime.entries.o1.completed = true;
runtime.entries.o1.detail = "2 / 2";
runtime.readyCount = 2;
const s1 = vm.runInContext("missionUiRenderSignature(1)", ctx);
neq(s0, s1, "il progresso cambia la firma");

runtime.ready = true;
runtime.readyCount = 3;
runtime.status = "ready";
const s2 = vm.runInContext("missionUiRenderSignature(1)", ctx);
neq(s1, s2, "lo stato pronto cambia la firma");

vm.runInContext("missionUiRequestPlay(1)", ctx);
const s3 = vm.runInContext("missionUiRenderSignature(1)", ctx);
neq(s2, s3, "la conferma cambia la firma");
ok(vm.runInContext("MISSION_UI_STATE.playPendingSide", ctx) === 1, "conferma gioco pendente");

ctx.state.missionPendingReward = {
  kind: "enemy_discard_selection",
  chooserSide: 1,
  missionId: "NXMSN01",
  required: 2,
  selectedUids: ["b"]
};
runtime.rewardPending = true;
const s4 = vm.runInContext("missionUiRenderSignature(1)", ctx);
neq(s3, s4, "la ricompensa cambia la firma");
ctx.state.missionPendingReward.selectedUids.push("a");
const s5 = vm.runInContext("missionUiRenderSignature(1)", ctx);
neq(s4, s5, "la selezione ricompensa cambia la firma");

const rev0 = vm.runInContext("MISSION_UI_STATE.renderRevision", ctx);
ok(vm.runInContext("missionUiHandleGameEvent({type:'MISSION_PROGRESS_CHANGED'})", ctx), "evento Missione invalidato");
ok(vm.runInContext("MISSION_UI_STATE.renderRevision", ctx) === rev0 + 1, "revisione incrementata");
ok(!vm.runInContext("missionUiHandleGameEvent({type:'UNIT_MOVED'})", ctx), "evento ordinario non invalida");

const render = fs.readFileSync(path.join(ROOT, "src/render.js"), "utf8");
ok(render.includes("missionUiRenderSignature(side)"), "firma inclusa nel renderer");
ok(render.includes("dock.dataset.renderSignature"), "firma diagnostica nel dock");
const events = fs.readFileSync(path.join(ROOT, "src/events.js"), "utf8");
ok(events.includes("missionUiHandleGameEvent(normalized)"), "invalidazione eventi collegata");
const build = fs.readFileSync(path.join(ROOT, "src/build_info.js"), "utf8");
ok(build.includes("C2-STABLE-1-F9O4f-APK-M4c") || build.includes("C2-STABLE-1-F9O4f-APK-M4c") || build.includes("C2-STABLE-1-F9O4e-APK-M4c") || build.includes("C2-STABLE-1-F9O4d-APK-M4c"), "metadata F9O4d");
ok(build.includes('logicBaseline: "C2-STABLE-1-F9O4c-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O4e-APK-M4c"') || build.includes('logicBaseline: "C2-STABLE-1-F9O4d-APK-M4c"'), "baseline F9O4c/F9O4d");
console.log(`F9O4d mission render signature smoke: ${checks}/${checks} OK`);
