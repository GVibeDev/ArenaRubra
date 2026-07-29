"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const code = fs.readFileSync(path.join(ROOT, "src/board_geometry.js"), "utf8");
const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/fixtures/custom_double_ms0cunhu.json"), "utf8"));
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const equal = (actual, expected, message) => { assert.strictEqual(actual, expected, message); checks += 1; };

const ctx = vm.createContext({
  console,
  Math,
  Number,
  Array,
  Object,
  String,
  Boolean,
  JSON,
  Set,
  Map,
  Date,
  CENTER_X: 460,
  CENTER_Y: 390,
  HEX_SIZE: 30
});
vm.runInContext(`${code}\nthis.__bg = { calculateBoardGeometry, setBoardGeometry, getBoardGeometry, getBoardNativeSize, getBoardRenderPoint, boardGeometryPanLimits, clampBoardGeometryTranslation };`, ctx, { filename: "board_geometry.js" });
const api = ctx.__bg;

const starter = api.calculateBoardGeometry([], { mapId: "map1_starter" });
equal(starter.nativeWidth, 920, "MAP1 conserva larghezza storica");
equal(starter.nativeHeight, 780, "MAP1 conserva altezza storica");
equal(starter.renderOriginX, 460, "MAP1 conserva centro X");
equal(starter.renderOriginY, 390, "MAP1 conserva centro Y");

const map = fixture.map;
const geometry = api.calculateBoardGeometry(map.geometry.cells, { mapId: map.id });
ok(geometry.nativeWidth > 920, "fixture grande supera la larghezza MAP1");
ok(geometry.nativeHeight > 780, "fixture grande supera l'altezza MAP1");
equal(geometry.cellCount, map.geometry.cells.length, "tutte le celle partecipano alla geometria");
api.setBoardGeometry(geometry);
const active = api.getBoardGeometry();
equal(active.mapId, map.id, "registry geometrico usa la mappa attiva");
equal(api.getBoardNativeSize().width, geometry.nativeWidth, "dimensione nativa centralizzata");

const points = map.geometry.cells.map(cell => api.getBoardRenderPoint(cell.coord));
const minPointX = Math.min(...points.map(point => point.x));
const maxPointX = Math.max(...points.map(point => point.x));
const minPointY = Math.min(...points.map(point => point.y));
const maxPointY = Math.max(...points.map(point => point.y));
ok(minPointX >= geometry.hexPadding - 0.01, "estremo sinistro resta dentro il padding");
ok(minPointY >= geometry.hexPadding - 0.01, "estremo alto resta dentro il padding");
ok(maxPointX <= geometry.nativeWidth - geometry.hexPadding + 1, "estremo destro resta dentro il render");
ok(maxPointY <= geometry.nativeHeight - geometry.hexPadding + 1, "estremo basso resta dentro il render");

const viewport = { width: 700, height: 500 };
const limits = api.boardGeometryPanLimits(viewport.width, viewport.height, 1, 24);
ok(limits.minX < 0 && limits.maxX > 0, "pan orizzontale disponibile");
ok(limits.minY < 0 && limits.maxY > 0, "pan verticale disponibile");

// Con transform-origin centrale, agli estremi del clamp ogni bordo può arrivare
// al margine del viewport, senza restare irraggiungibile.
const rightAtMin = (viewport.width + limits.visualWidth) / 2 + limits.minX;
const leftAtMax = (viewport.width - limits.visualWidth) / 2 + limits.maxX;
const bottomAtMin = (viewport.height + limits.visualHeight) / 2 + limits.minY;
const topAtMax = (viewport.height - limits.visualHeight) / 2 + limits.maxY;
equal(Math.round(rightAtMin), viewport.width - 24, "bordo destro raggiungibile");
equal(Math.round(leftAtMax), 24, "bordo sinistro raggiungibile");
equal(Math.round(bottomAtMin), viewport.height - 24, "bordo basso raggiungibile");
equal(Math.round(topAtMax), 24, "bordo alto raggiungibile");

const clamped = api.clampBoardGeometryTranslation(99999, -99999, viewport.width, viewport.height, 1, 24);
equal(clamped.x, limits.maxX, "clamp X usa geometria dinamica");
equal(clamped.y, limits.minY, "clamp Y usa geometria dinamica");

const camera = fs.readFileSync(path.join(ROOT, "src/camera.js"), "utf8");
const mobile = fs.readFileSync(path.join(ROOT, "src/mobile.js"), "utf8");
const render = fs.readFileSync(path.join(ROOT, "src/render.js"), "utf8");
ok(camera.includes("getBoardGeometry") && camera.includes("getBoardRenderPoint"), "camera desktop usa il registry geometrico");
ok(mobile.includes("getBoardGeometry") && mobile.includes("clampBoardGeometryTranslation"), "camera mobile usa la stessa geometria");
ok(render.includes("calculateBoardGeometry") && render.includes("setBoardGeometry"), "renderer pubblica le metriche reali");

console.log(`F9Q3a dynamic board geometry smoke: ${checks}/${checks} OK`);
