"use strict";

const assert = require("assert");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(process.env.ARENA_BROWSER_ROOT || path.resolve(__dirname, ".."));
const mime = {
  ".css":"text/css", ".html":"text/html", ".js":"text/javascript", ".json":"application/json",
  ".png":"image/png", ".webp":"image/webp", ".jpg":"image/jpeg", ".mp3":"audio/mpeg"
};

function serverStart() {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const target = path.resolve(root, relative);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) return response.writeHead(403).end("Forbidden");
    fs.readFile(target, (error, body) => {
      if (error) return response.writeHead(error.code === "ENOENT" ? 404 : 500).end(error.code || "Error");
      response.writeHead(200, { "Content-Type":mime[path.extname(target).toLowerCase()] || "application/octet-stream" });
      response.end(body);
    });
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(server)));
}

function closeEnough(a, b, tolerance = 0.0001) {
  return Math.abs(a - b) <= tolerance;
}

const setup = {
  mapId:"custom_triple_ms3s2abv",
  factions:{ 1:"Nexus", 2:"Exordium", 3:"Liberti", 4:"Agathoi" },
  selectedCommanders:{ 1:"NXCMD01", 2:"EX0B00", 3:"LX0B00", 4:"AG0B00" },
  selectedDecks:{
    1:{ mode:"custom", savedKey:"Nexus::NXCMD01::bastione-mobile" },
    2:{ mode:"custom", savedKey:"Exordium::EX0B00::doppio-assalto-imperiale" },
    3:{ mode:"custom", savedKey:"Liberti::LX0B00::orda-della-fossa" },
    4:{ mode:"custom", savedKey:"Agathoi::AG0B00::citta-vivente" }
  },
  modes:{ 1:"human", 2:"human", 3:"human", 4:"human" },
  autoResignEnabled:false,
  tutorialMode:false,
  mapLabMode:false,
  aiMode:"advanced",
  pacePreset:"standard",
  gameScaleMode:"large_scale",
  matchSeed:"S2-RC-UI-MICROFIX"
};

(async () => {
  const server = await serverStart();
  const browser = await chromium.launch({
    headless:true,
    executablePath:process.env.ARENA_BROWSER_EXECUTABLE || chromium.executablePath()
  });
  const pageErrors = [];
  const results = [];
  const viewports = [
    { width:1050, height:848 },
    { width:1366, height:768 },
    { width:1600, height:900 },
    { width:1920, height:1080 }
  ];

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      page.setDefaultTimeout(120000);
      page.on("pageerror", error => pageErrors.push(`${viewport.width}x${viewport.height}: ${error.message}`));
      await page.goto(`http://127.0.0.1:${server.address().port}/index.html?profile=distribution&lang=it`, { waitUntil:"networkidle" });
      await page.waitForFunction(() =>
        typeof newGame === "function"
        && typeof createUnitFromBlueprint === "function"
        && typeof cameraGetState === "function"
        && typeof ArenaI18n !== "undefined"
        && ArenaI18n.diagnostics().status === "ready"
      );

      const result = await page.evaluate(async gameSetup => {
        const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const closeEnough = (a, b, tolerance = 0.0001) => Math.abs(a - b) <= tolerance;
        const originalMaybeRunBot = window.maybeRunBot;
        window.maybeRunBot = () => false;
        try { newGame(gameSetup); }
        finally { window.maybeRunBot = originalMaybeRunBot; }
        setAppScreen(ARENA_APP_SCREENS.GAME);
        await nextFrame();
        const initialCamera = cameraGetState();
        if (initialCamera.mode !== "fit" || !closeEnough(initialCamera.x, 0) || !closeEnough(initialCamera.y, 0)) {
          throw new Error(`new game camera did not initialize in fit mode: ${JSON.stringify(initialCamera)}`);
        }

        const availableBlueprints = BLUEPRINTS.filter(item => item && item.type !== "QG");
        const factions = [...new Set(availableBlueprints.map(item => item.faction).filter(Boolean))];
        const blueprints = Array.from({ length:10 }, (_, index) => {
          const candidates = availableBlueprints.filter(item => item.faction === factions[index % factions.length]);
          return candidates[Math.floor(index / factions.length) % candidates.length];
        });
        const freeCells = state.cells.filter(cell => !getUnitAt(cell.coord));
        const chosenCells = [];
        for (let index = 0; index < 5; index += 1) {
          chosenCells.push(freeCells[index], freeCells[freeCells.length - 1 - index]);
        }
        const units = chosenCells.map((cell, index) => {
          const unit = createUnitFromBlueprint(blueprints[index % blueprints.length], (index % 4) + 1);
          unit.pos = [...cell.coord];
          unit.alive = true;
          unit.acted = true;
          state.units.push(unit);
          return unit;
        });
        renderAll();
        selectedId = units[0].uid;
        mode = "idle";
        renderAll();
        await nextFrame();

        boardCamera.zoom = 1.55;
        boardCamera.x = 73;
        boardCamera.y = -51;
        boardCamera.mode = "manual";
        applyBoardCamera({ animate:false });
        await nextFrame();

        const rect = selector => {
          const value = document.querySelector(selector).getBoundingClientRect();
          return { top:value.top, bottom:value.bottom, left:value.left, right:value.right, width:value.width, height:value.height };
        };
        const snapshot = () => ({
          language:document.documentElement.lang,
          camera:cameraGetState(),
          viewport:rect("#boardWrap"),
          header:rect(".topTitleBar"),
          hud:rect("#gameHudStrip"),
          status:rect(".gameHudStatusRow"),
          inspector:rect("#selectedUnitFloat"),
          transform:getComputedStyle(document.getElementById("boardVisualStack")).transform,
          horizontalOverflow:document.documentElement.scrollWidth - document.documentElement.clientWidth,
          inspectorContentHeight:document.querySelector(".selectedUnitFloatBody").scrollHeight,
          chips:[...document.querySelectorAll(".gameHudStatusRow > .hudChip")].map(element => {
            const box = element.getBoundingClientRect();
            return { left:box.left, right:box.right, clientWidth:element.clientWidth, scrollWidth:element.scrollWidth, text:element.textContent.trim() };
          }),
          counters:[...document.querySelectorAll(".gameComparisonCounters")].map(element => {
            const box = element.getBoundingClientRect();
            return { left:box.left, right:box.right, clientWidth:element.clientWidth, scrollWidth:element.scrollWidth, text:element.textContent.trim() };
          })
        });
        const assertGeometry = value => {
          if (Math.abs(value.hud.top - value.header.bottom) > 2) throw new Error(`header/HUD gap: ${JSON.stringify(value)}`);
          if (Math.abs(value.inspector.top - value.header.bottom) > 2) throw new Error(`header/inspector gap: ${JSON.stringify(value)}`);
          if (Math.abs(value.inspector.top - value.hud.top) > 2) throw new Error(`HUD/inspector alignment: ${JSON.stringify(value)}`);
          if (value.viewport.top < value.hud.bottom - 1) throw new Error(`HUD/board overlap: ${JSON.stringify(value)}`);
          if (value.inspector.bottom > innerHeight + 1) throw new Error(`inspector viewport overflow: ${JSON.stringify(value)}`);
          if (value.horizontalOverflow > 1) throw new Error(`horizontal overflow: ${JSON.stringify(value)}`);
          if (!value.chips.length || value.chips.some(chip => !chip.text || chip.left < value.status.left - 1 || chip.right > value.status.right + 1 || chip.scrollWidth > chip.clientWidth + 1)) {
            throw new Error(`HUD chip clipping: ${JSON.stringify(value)}`);
          }
          if (value.counters.length !== 2 || value.counters.some(counter => !counter.text || counter.left < value.hud.left - 1 || counter.right > value.hud.right + 1 || counter.scrollWidth > counter.clientWidth + 1)) {
            throw new Error(`comparison counter clipping: ${JSON.stringify(value)}`);
          }
        };
        const assertCamera = (before, after, label) => {
          if (!closeEnough(before.viewport.width, after.viewport.width) || !closeEnough(before.viewport.height, after.viewport.height)) {
            throw new Error(`${label}: board viewport changed: ${JSON.stringify({ before, after })}`);
          }
          for (const key of ["x", "y", "zoom", "fitScale", "totalScale"]) {
            if (!closeEnough(before.camera[key], after.camera[key])) throw new Error(`${label}: camera ${key} changed: ${JSON.stringify({ before, after })}`);
          }
          if (before.camera.mode !== after.camera.mode || before.transform !== after.transform) {
            throw new Error(`${label}: camera mode/transform changed: ${JSON.stringify({ before, after })}`);
          }
        };

        const stack = document.getElementById("boardVisualStack");
        let cameraStyleMutations = 0;
        const observer = new MutationObserver(records => {
          cameraStyleMutations += records.filter(record => record.type === "attributes" && record.attributeName === "style").length;
        });
        observer.observe(stack, { attributes:true, attributeFilter:["style"] });

        const languages = [];
        let reference = snapshot();
        assertGeometry(reference);
        for (const language of ["it", "en"]) {
          if (ArenaI18n.currentLanguage() !== language) {
            await ArenaI18n.setLanguage(language);
            renderAll();
            await nextFrame();
            const localized = snapshot();
            assertGeometry(localized);
            assertCamera(reference, localized, `${language}: language switch`);
            reference = localized;
          }

          const contentHeights = [];
          for (let index = 0; index < units.length; index += 1) {
            const before = snapshot();
            document.querySelector(`[data-unit-uid="${units[index].uid}"]`).click();
            await nextFrame();
            const after = snapshot();
            assertGeometry(after);
            assertCamera(before, after, `${language}: unit ${index + 1}`);
            contentHeights.push(after.inspectorContentHeight);
          }

          const terrain = freeCells.find(cell => !getUnitAt(cell.coord));
          const beforeTerrain = snapshot();
          document.querySelector(`.hex[data-coord-key="${terrain.coord.join(",")}"]`).click();
          await nextFrame();
          const afterTerrain = snapshot();
          assertCamera(beforeTerrain, afterTerrain, `${language}: unit to terrain`);
          document.querySelector(`[data-unit-uid="${units[units.length - 1].uid}"]`).click();
          await nextFrame();
          const afterUnit = snapshot();
          assertGeometry(afterUnit);
          assertCamera(afterTerrain, afterUnit, `${language}: terrain to unit`);
          languages.push({ language, geometry:afterUnit, distinctInspectorHeights:new Set(contentHeights).size });
          reference = afterUnit;
        }

        observer.disconnect();
        if (cameraStyleMutations !== 0) throw new Error(`selection rewrote camera style ${cameraStyleMutations} times`);
        const beforeFit = snapshot();
        document.getElementById("cameraFitBtn").click();
        await new Promise(resolve => setTimeout(resolve, 220));
        await nextFrame();
        const afterFit = snapshot();
        assertGeometry(afterFit);
        if (afterFit.camera.mode !== "fit" || !closeEnough(afterFit.camera.x, 0) || !closeEnough(afterFit.camera.y, 0) || !closeEnough(afterFit.camera.zoom, 1)) {
          throw new Error(`explicit Fit did not reset the camera: ${JSON.stringify({ beforeFit, afterFit })}`);
        }
        if (afterFit.transform === beforeFit.transform) throw new Error(`explicit Fit did not change the manual transform: ${JSON.stringify({ beforeFit, afterFit })}`);
        return {
          languages,
          cameraStyleMutations,
          units:units.length,
          factions:new Set(units.map(unit => unit.faction)).size,
          initialCamera,
          explicitFit:{ before:beforeFit.camera, after:afterFit.camera }
        };
      }, setup);

      assert.strictEqual(result.units, 10);
      assert(result.factions >= 5, JSON.stringify(result));
      assert.strictEqual(result.cameraStyleMutations, 0);
      assert.deepStrictEqual(result.languages.map(item => item.language), ["it", "en"]);
      for (const language of result.languages) {
        assert(language.distinctInspectorHeights >= 2, JSON.stringify(language));
      }

      const beforeResize = await page.evaluate(async () => {
        boardCamera.zoom = 1.45;
        boardCamera.x = 23;
        boardCamera.y = -17;
        boardCamera.mode = "manual";
        applyBoardCamera({ animate:false });
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const box = document.getElementById("boardWrap").getBoundingClientRect();
        return { camera:cameraGetState(), viewport:{ width:box.width, height:box.height }, transform:getComputedStyle(document.getElementById("boardVisualStack")).transform };
      });
      await page.setViewportSize({ width:viewport.width + 41, height:viewport.height + 29 });
      const afterResize = await page.evaluate(async previousCamera => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const box = document.getElementById("boardWrap").getBoundingClientRect();
        const expectedPan = typeof clampBoardGeometryTranslation === "function"
          ? clampBoardGeometryTranslation(previousCamera.x, previousCamera.y, box.width, box.height, previousCamera.totalScale, 24)
          : { x:previousCamera.x, y:previousCamera.y };
        return {
          camera:cameraGetState(),
          viewport:{ width:box.width, height:box.height },
          transform:getComputedStyle(document.getElementById("boardVisualStack")).transform,
          expectedPan
        };
      }, beforeResize.camera);
      assert(
        !closeEnough(beforeResize.viewport.width, afterResize.viewport.width)
          || !closeEnough(beforeResize.viewport.height, afterResize.viewport.height),
        JSON.stringify({ beforeResize, afterResize })
      );
      assert(closeEnough(beforeResize.camera.zoom, afterResize.camera.zoom), JSON.stringify({ beforeResize, afterResize }));
      assert(closeEnough(afterResize.expectedPan.x, afterResize.camera.x), JSON.stringify({ beforeResize, afterResize }));
      assert(closeEnough(afterResize.expectedPan.y, afterResize.camera.y), JSON.stringify({ beforeResize, afterResize }));
      assert.strictEqual(afterResize.camera.mode, "manual");
      results.push({ viewport:`${viewport.width}x${viewport.height}`, ...result, realResize:{ before:beforeResize, after:afterResize } });
      await page.close();
    }

    assert.deepStrictEqual(pageErrors, []);
    console.log(JSON.stringify({ status:"PASS", viewports:results, pageErrors:0 }, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
