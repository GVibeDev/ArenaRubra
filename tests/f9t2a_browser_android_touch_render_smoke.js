const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function pointerPayload(pointerId, x, y, buttons = 1, isPrimary = true) {
  return {
    pointerId,
    pointerType: "touch",
    clientX: x,
    clientY: y,
    button: 0,
    buttons,
    isPrimary,
    bubbles: true,
    cancelable: true
  };
}

async function loadBase(page) {
  const index = read("index.html");
  const scripts = [...index.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g)].map(match => match[1]);
  const html = index
    .replace(/<script\s+src="[^"]+"\s*><\/script>/g, "")
    .replace(/<link\s+rel="stylesheet"\s+href="[^"]+"\s*\/?>/g, "");

  await page.setContent(html, { waitUntil: "load" });
  await page.addStyleTag({ path: path.join(ROOT, "css", "style.css") });
  const calibration = path.join(ROOT, "css", "renderer_calibration_lab.css");
  if (fs.existsSync(calibration)) await page.addStyleTag({ path: calibration });
  for (const relativePath of scripts) {
    await page.addScriptTag({ path: path.join(ROOT, relativePath) });
  }

  await page.waitForFunction(() =>
    typeof BUILD_INFO !== "undefined"
    && typeof initializeArenaAppShell === "function"
    && typeof androidRuntimeDiagnosticsSnapshotF9T2a === "function"
  );
  await page.evaluate(() => {
    const splash = document.getElementById("appSplash");
    if (splash) {
      splash.style.display = "none";
      splash.style.pointerEvents = "none";
    }
    initializeArenaAppShell();
    setAppScreen(ARENA_APP_SCREENS.MAP_EDITOR);
    initializeMapEditorScreen();
    const largest = Object.values(BUILTIN_MAP_DEFINITIONS)
      .slice()
      .sort((a, b) => (b.geometry?.cells?.length || 0) - (a.geometry?.cells?.length || 0))[0];
    mapEditorLoad(largest.id, { copy: true });
  });
  await page.waitForFunction(() =>
    document.querySelectorAll("#mapEditorCanvas [data-map-cell]").length >= 500
  );
  await page.waitForTimeout(500);
}

async function visibleCell(page) {
  const cell = page.locator("#mapEditorCanvas [data-map-cell]").filter({ visible: true }).first();
  const box = await cell.boundingBox();
  if (!box) throw new Error("Nessuna cella SVG visibile e misurabile");
  return { cell, box };
}

async function tappableCellPoint(page) {
  return page.evaluate(() => {
    const svg = document.getElementById("mapEditorCanvas");
    const viewport = svg.getBoundingClientRect();
    for (const cell of svg.querySelectorAll("[data-map-cell]")) {
      const box = cell.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      if (x < viewport.left || x > viewport.right || y < viewport.top || y > viewport.bottom) continue;
      const hit = document.elementFromPoint(x, y);
      if (hit && hit.closest && hit.closest("[data-map-cell]") === cell) {
        return { x, y, key: cell.dataset.mapCell };
      }
    }
    return null;
  });
}

(async () => {
  const pageErrors = [];
  const consoleErrors = [];
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    args: ["--no-sandbox", "--allow-file-access-from-files"]
  });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on("pageerror", error => pageErrors.push(String(error)));
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  try {
    await loadBase(page);
    const initial = await page.evaluate(() => {
      androidRuntimeDiagnosticsResetF9T2a();
      const canvas = document.getElementById("mapEditorCanvas").getBoundingClientRect();
      const project = document.querySelector(".mapEditorProjectPanel").getBoundingClientRect();
      const canvasPanel = document.querySelector(".mapEditorCanvasPanel").getBoundingClientRect();
      return {
        build: BUILD_INFO.version,
        mapId: mapEditorState.sourceId,
        cells: mapEditorState.draft.geometry.cells.length,
        view: { ...mapEditorState.view },
        canvas: { x: canvas.x, y: canvas.y, width: canvas.width, height: canvas.height },
        projectTop: project.top,
        canvasPanelTop: canvasPanel.top,
        renderer: document.getElementById("mapEditorCanvas").dataset.renderer
      };
    });

    const svg = page.locator("#mapEditorCanvas");
    const firstVisible = await visibleCell(page);
    const startX = firstVisible.box.x + firstVisible.box.width / 2;
    const startY = firstVisible.box.y + firstVisible.box.height / 2;
    await firstVisible.cell.dispatchEvent("pointerdown", pointerPayload(41, startX, startY));
    await svg.dispatchEvent("pointermove", pointerPayload(41, startX + 46, startY + 31));
    await svg.dispatchEvent("pointermove", pointerPayload(41, startX + 74, startY + 48));
    await page.waitForTimeout(80);
    await svg.dispatchEvent("pointerup", pointerPayload(41, startX + 74, startY + 48, 0));
    await page.waitForTimeout(80);

    const pan = await page.evaluate(() => {
      const snapshot = androidRuntimeDiagnosticsSnapshotF9T2a();
      return {
        view: { ...mapEditorState.view },
        selected: mapEditorState.selectedKey,
        activePointers: snapshot.mapEditor.activePointers,
        gestureActive: document.getElementById("mapEditorCanvas").classList.contains("isGestureActive"),
        fullRenders: snapshot.metrics.map_editor_full_render?.count || 0,
        viewFrames: snapshot.metrics.map_editor_view_frame?.count || 0
      };
    });

    await page.waitForTimeout(500);
    const tapTarget = await tappableCellPoint(page);
    if (!tapTarget) throw new Error("Nessuna cella realmente toccabile nel viewport");
    await page.touchscreen.tap(tapTarget.x, tapTarget.y);
    await page.waitForFunction(() => mapEditorState.selectedKey !== "");
    const tap = await page.evaluate(() => ({
      selected: mapEditorState.selectedKey,
      activePointers: mapEditorState.interaction.pointers.size
    }));

    await page.evaluate(() => androidRuntimeDiagnosticsResetF9T2a());
    const canvasBox = await svg.boundingBox();
    if (!canvasBox) throw new Error("Canvas SVG non misurabile");
    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;
    const scaleBefore = await page.evaluate(() => mapEditorState.view.scale);
    await svg.dispatchEvent("pointerdown", pointerPayload(51, centerX - 38, centerY, 1, true));
    await svg.dispatchEvent("pointerdown", pointerPayload(52, centerX + 38, centerY, 1, false));
    await svg.dispatchEvent("pointermove", pointerPayload(51, centerX - 72, centerY, 1, true));
    await svg.dispatchEvent("pointermove", pointerPayload(52, centerX + 72, centerY, 1, false));
    await page.waitForTimeout(80);
    await svg.dispatchEvent("pointerup", pointerPayload(51, centerX - 72, centerY, 0, true));
    await svg.dispatchEvent("pointerup", pointerPayload(52, centerX + 72, centerY, 0, false));
    await page.waitForTimeout(80);

    const pinch = await page.evaluate(() => {
      const snapshot = androidRuntimeDiagnosticsSnapshotF9T2a();
      return {
        scale: mapEditorState.view.scale,
        activePointers: snapshot.mapEditor.activePointers,
        fullRenders: snapshot.metrics.map_editor_full_render?.count || 0,
        viewFrames: snapshot.metrics.map_editor_view_frame?.count || 0
      };
    });

    await svg.dispatchEvent("pointerdown", pointerPayload(61, centerX, centerY));
    await svg.dispatchEvent("pointermove", pointerPayload(61, centerX + 30, centerY + 20));
    await svg.dispatchEvent("pointercancel", pointerPayload(61, centerX + 30, centerY + 20, 0));
    await page.waitForTimeout(50);
    const cancelled = await page.evaluate(() => ({
      activePointers: mapEditorState.interaction.pointers.size,
      drag: mapEditorState.drag,
      gestureActive: document.getElementById("mapEditorCanvas").classList.contains("isGestureActive")
    }));
    const diagnostics = await page.evaluate(() => androidRuntimeDiagnosticsSnapshotF9T2a());

    await page.evaluate(() => setAppScreen(ARENA_APP_SCREENS.CARD_POOL));
    await page.waitForFunction(() => document.querySelectorAll("[data-card-pool-gallery-canvas]").length > 0);
    await page.locator("[data-card-pool-gallery-canvas]").first().scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll("[data-card-pool-gallery-canvas]"))
        .some(canvas => canvas.width > 1 && canvas.height > 1)
    );
    const cardPoolActive = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll("[data-card-pool-gallery-canvas]"));
      const snapshot = androidRuntimeDiagnosticsSnapshotF9T2a();
      return {
        total: canvases.length,
        rendered: canvases.filter(canvas => canvas.width > 1 && canvas.height > 1).length,
        bytes: snapshot.canvas.bytes
      };
    });
    await page.evaluate(() => setAppScreen(ARENA_APP_SCREENS.MAP_EDITOR));
    await page.waitForTimeout(80);
    const cardPoolReleased = await page.evaluate(() => {
      const snapshot = androidRuntimeDiagnosticsSnapshotF9T2a();
      return {
        galleryCanvases: document.querySelectorAll("[data-card-pool-gallery-canvas]").length,
        preview: {
          width: document.getElementById("cardPoolPreviewCanvas").width,
          height: document.getElementById("cardPoolPreviewCanvas").height
        },
        pixels: snapshot.canvas.pixels,
        bytes: snapshot.canvas.bytes,
        cardImages: snapshot.cardImages,
        tokenAssets: snapshot.tokenAssets
      };
    });

    if (initial.build !== "C2-STABLE-1-F9T2a-APK-M4c") throw new Error(JSON.stringify(initial));
    if (initial.cells < 500 || initial.renderer !== "incremental-view-f9t2a") throw new Error(JSON.stringify(initial));
    if (!(initial.canvasPanelTop < initial.projectTop)) throw new Error(`Layout mobile non map-first: ${JSON.stringify(initial)}`);
    if (pan.view.x === initial.view.x && pan.view.y === initial.view.y) throw new Error(`Pan non applicato: ${JSON.stringify(pan)}`);
    if (pan.selected !== "" || pan.activePointers !== 0 || pan.gestureActive) throw new Error(`Pan interpretato come tap: ${JSON.stringify(pan)}`);
    if (pan.fullRenders !== 0 || pan.viewFrames < 1) throw new Error(`Pan non incrementale: ${JSON.stringify(pan)}`);
    if (!tap.selected || tap.activePointers !== 0) throw new Error(`Tap non seleziona: ${JSON.stringify(tap)}`);
    if (!(pinch.scale > scaleBefore) || pinch.activePointers !== 0) throw new Error(`Pinch non applicato: ${JSON.stringify({ scaleBefore, pinch })}`);
    if (pinch.fullRenders !== 0 || pinch.viewFrames < 1) throw new Error(`Pinch non incrementale: ${JSON.stringify(pinch)}`);
    if (cancelled.activePointers !== 0 || cancelled.drag !== null || cancelled.gestureActive) throw new Error(`Cancel incompleto: ${JSON.stringify(cancelled)}`);
    if (diagnostics.schemaVersion !== "F9T2a-1") throw new Error(JSON.stringify(diagnostics));
    if (diagnostics.mapEditor.renderer !== "incremental-view-f9t2a") throw new Error(JSON.stringify(diagnostics.mapEditor));
    if (diagnostics.dom.mapEditorCells !== initial.cells || diagnostics.canvas.bytes < 0) throw new Error(JSON.stringify(diagnostics));
    if (cardPoolActive.total < 20 || cardPoolActive.rendered < 1 || cardPoolActive.rendered >= cardPoolActive.total) {
      throw new Error(`Lazy gallery non limitata: ${JSON.stringify(cardPoolActive)}`);
    }
    if (cardPoolReleased.galleryCanvases !== 0 || cardPoolReleased.preview.width !== 1 || cardPoolReleased.preview.height !== 1) {
      throw new Error(`Risorse Card Pool non rilasciate: ${JSON.stringify(cardPoolReleased)}`);
    }
    if (cardPoolReleased.bytes > 64) throw new Error(`Backing store nascosto non rilasciato: ${JSON.stringify(cardPoolReleased)}`);
    if (!cardPoolReleased.cardImages || cardPoolReleased.cardImages.loaded > 32) {
      throw new Error(`Cache immagini carta non limitata: ${JSON.stringify(cardPoolReleased.cardImages)}`);
    }
    if (!cardPoolReleased.tokenAssets || cardPoolReleased.tokenAssets.loadingMode !== "demand-f9t2a"
      || cardPoolReleased.tokenAssets.registryAssets !== 35 || cardPoolReleased.tokenAssets.requested !== 0) {
      throw new Error(`Preload token inatteso: ${JSON.stringify(cardPoolReleased.tokenAssets)}`);
    }
    if (pageErrors.length || consoleErrors.length) throw new Error(JSON.stringify({ pageErrors, consoleErrors }));

    console.log(JSON.stringify({
      status: "PASS",
      build: initial.build,
      map: initial.mapId,
      cells: initial.cells,
      pan,
      tap,
      pinch,
      cancelled,
      diagnostics: {
        schema: diagnostics.schemaVersion,
        dom: diagnostics.dom,
        canvas: diagnostics.canvas
      },
      cardPool: {
        active: cardPoolActive,
        released: cardPoolReleased
      },
      pageErrors: pageErrors.length,
      consoleErrors: consoleErrors.length
    }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
