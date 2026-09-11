"use strict";

const assert = require("assert");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data", "required_assets.json"), "utf8"));
const golden = JSON.parse(fs.readFileSync(path.join(root, "tests", "fixtures", "ar_ac1_golden_matches.json"), "utf8"));
const mime = { ".css":"text/css", ".html":"text/html", ".js":"text/javascript", ".json":"application/json", ".png":"image/png", ".webp":"image/webp", ".jpg":"image/jpeg", ".mp3":"audio/mpeg" };
const isCi = /^(?:1|true)$/i.test(String(process.env.CI || ""));
// Hosted runners share CPU with other workloads. Preserve the stricter local
// budget while allowing bounded infrastructure variance in CI; per-turn and
// final-render limits below remain identical in both environments.
const longMatchBudgetMs = isCi ? 75000 : 60000;

function startServer() {
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

async function layoutSnapshot(page, screen) {
  return page.evaluate(async screenName => {
    setAppScreen(screenName);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const active = document.querySelector('[data-app-screen-panel][aria-hidden="false"]');
    const rect = active ? active.getBoundingClientRect() : null;
    return {
      screen:screenName,
      viewport:innerWidth,
      documentWidth:document.documentElement.scrollWidth,
      clientWidth:document.documentElement.clientWidth,
      active:rect ? { left:rect.left, right:rect.right, width:rect.width, height:rect.height } : null,
      scrollable:Boolean(active && active.scrollHeight > active.clientHeight)
    };
  }, screen);
}

(async () => {
  const server = await startServer();
  const address = server.address();
  const browser = await chromium.launch({ headless:true, executablePath:process.env.ARENA_BROWSER_EXECUTABLE || chromium.executablePath() });
  const page = await browser.newPage({ viewport:{ width:1440, height:900 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  try {
    await page.goto(`http://127.0.0.1:${address.port}/?profile=distribution&lang=en`, { waitUntil:"networkidle" });
    await page.waitForFunction(() => document.documentElement.lang === "en");
    await page.locator("#splashEnterBtn").click();
    await page.waitForSelector("#appSplash", { state:"hidden" });

    const requiredFetch = await page.evaluate(async paths => Promise.all(paths.map(async assetPath => {
      const response = await fetch(assetPath, { cache:"no-store" });
      return { assetPath, ok:response.ok, bytes:(await response.arrayBuffer()).byteLength };
    })), manifest.required.map(item => item.path));
    assert.deepStrictEqual(requiredFetch.filter(item => !item.ok), []);
    for (const result of requiredFetch) assert.strictEqual(result.bytes, manifest.required.find(item => item.path === result.assetPath).bytes);

    const themes = ["nexus_basalt", "exordium_imperium", "liberti_sine_vinculis", "agathoi_kleos", "fabeot_vesper"];
    const geometries = [];
    for (const theme of themes) {
      const snapshot = await page.evaluate(async key => {
        arenaMenuThemeApplyF9W2b(key, { persist:false });
        arenaUiThemeSyncF9W2c(true);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const rect = document.querySelector(".mainMenuCard").getBoundingClientRect();
        const style = getComputedStyle(document.documentElement);
        return {
          key:document.documentElement.dataset.arenaUiTheme,
          rect:{ x:rect.x, y:rect.y, width:rect.width, height:rect.height },
          material:style.getPropertyValue("--arena-ui-material-image").trim(),
          corner:style.getPropertyValue("--arena-ui-corner-tl").trim(),
          edge:style.getPropertyValue("--arena-ui-edge-top").trim(),
          text:style.getPropertyValue("--arena-ui-text-primary").trim(),
          table:style.getPropertyValue("--arena-ui-table-text").trim()
        };
      }, theme);
      assert.strictEqual(snapshot.key, theme);
      assert.notStrictEqual(snapshot.material, "none");
      assert.notStrictEqual(snapshot.corner, "none");
      assert.notStrictEqual(snapshot.edge, "none");
      assert(snapshot.text && snapshot.table);
      geometries.push(snapshot.rect);
    }
    const baseline = geometries[0];
    for (const rect of geometries.slice(1)) {
      assert(Math.abs(rect.x - baseline.x) <= 1);
      assert(Math.abs(rect.y - baseline.y) <= 1);
      assert(Math.abs(rect.width - baseline.width) <= 1);
      assert(Math.abs(rect.height - baseline.height) <= 1);
    }

    for (const screen of ["mainMenu", "setup", "tutorial", "deckBuilder", "cardPool"]) {
      const layout = await layoutSnapshot(page, screen);
      assert(layout.active, `missing active screen: ${screen}`);
      assert(layout.documentWidth <= layout.clientWidth + 2, `desktop horizontal overflow: ${screen}`);
    }

    page.setDefaultTimeout(120000);
    const legacyLongFixture = golden.matches.find(item => item.id === "GOLDEN-005-4P");
    const longFixture = { ...legacyLongFixture, mapId:"custom_single_ms0nf51r", seed:"S2-C6-OFFICIAL-4P-LONG-MATCH" };
    const longMatch = await page.evaluate(async fixture => {
      const nativeSetTimeout = window.setTimeout.bind(window);
      window.setTimeout = (callback, _delay, ...args) => nativeSetTimeout(callback, 0, ...args);
      const playerIds = Object.keys(fixture.factions).map(Number).sort((a, b) => a - b);
      const modes = Object.fromEntries(playerIds.map(side => [side, "human"]));
      const selectedDecks = Object.fromEntries(playerIds.map(side => [side, { mode:"custom", savedKey:fixture.decks[String(side)] }]));
      newGame({
        mapId:fixture.mapId, factions:fixture.factions, selectedCommanders:fixture.commanders, selectedDecks, modes,
        autoResignEnabled:false, tutorialMode:false, mapLabMode:false, aiMode:"advanced", pacePreset:"standard",
        gameScaleMode:"large_scale", matchSeed:fixture.seed
      });
      const samples = [];
      const started = performance.now();
      for (let step = 0; step < fixture.actionTurns && !state.winner; step += 1) {
        const side = Number(state.currentPlayer);
        state.playerIds.forEach(id => { state.modes[id] = "human"; });
        state.modes[side] = "bot";
        const before = performance.now();
        await runBotTurn({ skipInitialRender:true });
        samples.push(performance.now() - before);
        state.playerIds.forEach(id => { state.modes[id] = "human"; });
      }
      const renderStarted = performance.now();
      renderAll();
      const renderMs = performance.now() - renderStarted;
      const totalMs = performance.now() - started;
      return {
        actionTurns:samples.length,
        round:state.turn,
        winner:state.winner,
        totalMs,
        maxTurnMs:Math.max(...samples),
        averageTurnMs:samples.reduce((sum, value) => sum + value, 0) / Math.max(1, samples.length),
        renderMs,
        units:state.units.length,
        cells:state.cells.length,
        boardTokens:document.querySelectorAll("#board .token").length,
        visibleLogRows:document.querySelectorAll("#log > *").length,
        horizontalOverflow:document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    }, longFixture);
    assert(longMatch.actionTurns >= 40, `long match ended before meaningful load: ${JSON.stringify(longMatch)}`);
    assert(
      longMatch.totalMs <= longMatchBudgetMs,
      `long match exceeded ${longMatchBudgetMs / 1000} s ${isCi ? "CI" : "local"} budget: ${longMatch.totalMs}`
    );
    assert(longMatch.maxTurnMs <= 5000, `single bot turn exceeded 5 s: ${longMatch.maxTurnMs}`);
    assert(longMatch.renderMs <= 1500, `final render exceeded 1.5 s: ${longMatch.renderMs}`);
    assert(longMatch.visibleLogRows <= 300, `visible log is unbounded: ${longMatch.visibleLogRows}`);
    assert(longMatch.horizontalOverflow <= 2, `long-match document overflow: ${longMatch.horizontalOverflow}`);

    await page.setViewportSize({ width:390, height:844 });
    for (const screen of ["mainMenu", "setup", "tutorial", "deckBuilder", "cardPool"]) {
      const layout = await layoutSnapshot(page, screen);
      assert(layout.active, `missing mobile active screen: ${screen}`);
      assert(layout.documentWidth <= layout.clientWidth + 2, `mobile horizontal overflow: ${screen} (${layout.documentWidth}/${layout.clientWidth})`);
      assert(layout.active.width <= 392, `mobile active screen exceeds viewport: ${screen}`);
    }

    assert.deepStrictEqual(pageErrors, []);
    console.log(`S2-C6 browser visual gate: PASS (${requiredFetch.length} required assets, 5 skins, 5 screens × 2 viewports, ${longMatch.actionTurns}-turn 4P long match in ${Math.round(longMatch.totalMs)} ms)`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error && error.stack || error);
  process.exitCode = 1;
});
