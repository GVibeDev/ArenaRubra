"use strict";

const assert = require("assert");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");
const { optionalMissingCandidates } = require("../tools/check_asset_references");

const sourceRoot = path.resolve(__dirname, "..");
const root = path.resolve(process.env.ARENA_BROWSER_ROOT || sourceRoot);
const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, "data", "starter_1_0_manifest.json"), "utf8"));
const mime = { ".css":"text/css", ".html":"text/html", ".js":"text/javascript", ".json":"application/json", ".png":"image/png", ".webp":"image/webp", ".jpg":"image/jpeg", ".mp3":"audio/mpeg", ".md":"text/markdown" };

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

const seat = {
  1:{ faction:"Nexus", commander:"NXCMD01", deck:"Nexus::NXCMD01::bastione-mobile" },
  2:{ faction:"Exordium", commander:"EX0B00", deck:"Exordium::EX0B00::doppio-assalto-imperiale" },
  3:{ faction:"Liberti", commander:"LX0B00", deck:"Liberti::LX0B00::orda-della-fossa" },
  4:{ faction:"Agathoi", commander:"AG0B00", deck:"Agathoi::AG0B00::citta-vivente" }
};

function setupFor(playerCount, mapId, modes, seed) {
  const ids = Array.from({ length:playerCount }, (_, index) => index + 1);
  return {
    mapId,
    factions:Object.fromEntries(ids.map(id => [id, seat[id].faction])),
    selectedCommanders:Object.fromEntries(ids.map(id => [id, seat[id].commander])),
    selectedDecks:Object.fromEntries(ids.map(id => [id, { mode:"custom", savedKey:seat[id].deck }])),
    modes:Object.fromEntries(ids.map(id => [id, modes[id] || "human"])),
    autoResignEnabled:false,
    tutorialMode:false,
    mapLabMode:false,
    aiMode:"advanced",
    pacePreset:"standard",
    gameScaleMode:"large_scale",
    matchSeed:seed
  };
}

(async () => {
  const server = await serverStart();
  const port = server.address().port;
  const browser = await chromium.launch({ headless:true, executablePath:process.env.ARENA_BROWSER_EXECUTABLE || chromium.executablePath() });
  const page = await browser.newPage({ viewport:{ width:1440, height:900 } });
  page.setDefaultTimeout(120000);
  const pageErrors = [];
  const consoleErrors = [];
  const requested = [];
  const failedResponses = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("request", request => requested.push(request.url()));
  page.on("response", response => {
    if (response.status() >= 400) failedResponses.push({ status:response.status(), url:response.url() });
  });
  const startupAt = Date.now();
  try {
    await page.goto(`http://127.0.0.1:${port}/index.html?profile=distribution&lang=en`, { waitUntil:"networkidle" });
    await page.waitForFunction(() => typeof newGame === "function" && typeof runBotTurn === "function" && typeof ArenaI18n !== "undefined" && ArenaI18n.diagnostics().status === "ready");
    const startupMs = Date.now() - startupAt;
    assert(startupMs <= 25000, `cold startup exceeded 25 s: ${startupMs}`);
    assert.strictEqual(await page.evaluate(() => ArenaRuntimeProfile.current()), "distribution");
    assert.strictEqual(await page.evaluate(() => document.documentElement.lang), "en");
    assert.strictEqual(await page.evaluate(() => typeof expertAiRuntimeStateF9T1), "undefined");

    const persisted = await page.evaluate(async () => {
      await ArenaI18n.setLanguage("it");
      arenaMenuThemeApplyF9W2b("fabeot_vesper", { persist:true });
      const settings = arenaStorageReadSettings();
      await ArenaI18n.setLanguage("en");
      return {
        storedLanguageIt:settings.localization && settings.localization.language === "it",
        storedTheme:settings.menuThemeF9W2b || settings.presentationTheme || JSON.stringify(settings),
        finalLanguage:ArenaI18n.currentLanguage(),
        theme:arenaMenuThemeCurrentF9W2b()
      };
    });
    assert(persisted.storedLanguageIt);
    assert.strictEqual(persisted.finalLanguage, "en");
    assert.strictEqual(persisted.theme, "fabeot_vesper");

    const mapResults = [];
    for (const map of manifest.catalogs.officialMaps) {
      const result = await page.evaluate(input => {
        const originalMaybeRunBot = window.maybeRunBot;
        window.maybeRunBot = () => false;
        const started = performance.now();
        try { newGame(input.setup); }
        finally { window.maybeRunBot = originalMaybeRunBot; }
        const renderStart = performance.now();
        renderAll();
        const mapDefinition = getActiveMapDefinition();
        return {
          id:state.mapId,
          players:state.playerIds.length,
          cells:state.cells.length,
          strategicPoints:state.cells.filter(cell => cell.ps).length,
          movement:mapDefinition.movementMultiplier,
          initMs:renderStart - started,
          renderMs:performance.now() - renderStart,
          overflow:document.documentElement.scrollWidth - document.documentElement.clientWidth,
          winner:state.winner
        };
      }, { setup:setupFor(map.playerCount, map.id, {}, `S2-C7-MAP-${map.id}`) });
      assert.strictEqual(result.id, map.id);
      assert.strictEqual(result.players, map.playerCount);
      assert(result.cells > 0 && result.strategicPoints > 0, JSON.stringify(result));
      assert(result.initMs <= 3000, `map init exceeded 3 s: ${JSON.stringify(result)}`);
      assert(result.renderMs <= 2000, `map render exceeded 2 s: ${JSON.stringify(result)}`);
      assert(result.overflow <= 2, `map overflow: ${JSON.stringify(result)}`);
      assert.strictEqual(result.winner, null);
      mapResults.push(result);
    }

    const scenarios = [
      { id:"2P-HH", mapId:"map1_starter", players:2, modes:{1:"human",2:"human"} },
      { id:"2P-HB", mapId:"custom_double_ms0ra3ds", players:2, modes:{1:"human",2:"bot"} },
      { id:"2P-BB", mapId:"custom_double_ms3ppdyc", players:2, modes:{1:"bot",2:"bot"} },
      { id:"3P-MIX", mapId:"custom_double_ms0cunhu", players:3, modes:{1:"human",2:"bot",3:"bot"} },
      { id:"4P-MIX", mapId:"custom_triple_ms3s2abv", players:4, modes:{1:"human",2:"bot",3:"human",4:"bot"} }
    ];
    const modeResults = [];
    for (const scenario of scenarios) {
      const result = await page.evaluate(async input => {
        const originalMaybeRunBot = window.maybeRunBot;
        window.maybeRunBot = () => false;
        try { newGame(input.setup); }
        finally { window.maybeRunBot = originalMaybeRunBot; }
        const configured = { ...state.modes };
        const botSide = state.playerIds.find(id => state.modes[id] === "bot");
        let botActionMs = 0;
        if (botSide) {
          state.currentPlayer = botSide;
          state.orderIndex = state.turnOrder.indexOf(botSide);
          const started = performance.now();
          await runBotTurn({ skipInitialRender:true });
          botActionMs = performance.now() - started;
        }
        return {
          configured,
          players:state.playerIds.length,
          botActionMs,
          eventCount:(state.events || []).length,
          units:state.units.length,
          winner:state.winner
        };
      }, { setup:setupFor(scenario.players, scenario.mapId, scenario.modes, `S2-C7-${scenario.id}`) });
      assert.strictEqual(result.players, scenario.players);
      for (const [side, mode] of Object.entries(scenario.modes)) assert.strictEqual(result.configured[side], mode, `${scenario.id} G${side}`);
      assert(result.eventCount > 0 && result.units >= scenario.players);
      assert(result.botActionMs <= 6000, `${scenario.id} bot action exceeded 6 s`);
      modeResults.push({ id:scenario.id, ...result });
    }

    const churn = await page.evaluate(async input => {
      const heapBefore = performance.memory ? performance.memory.usedJSHeapSize : null;
      const originalMaybeRunBot = window.maybeRunBot;
      window.maybeRunBot = () => false;
      for (let iteration = 0; iteration < 20; iteration += 1) {
        newGame({ ...input.setup, matchSeed:`S2-C7-CHURN-${iteration}` });
        for (const screen of ["mainMenu", "setup", "tutorial", "deckBuilder", "cardPool", "game"]) setAppScreen(screen);
      }
      window.maybeRunBot = originalMaybeRunBot;
      setAppScreen("game");
      renderAll();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const heapAfter = performance.memory ? performance.memory.usedJSHeapSize : null;
      return {
        heapBefore,
        heapAfter,
        heapGrowth:heapBefore != null && heapAfter != null ? heapAfter - heapBefore : null,
        activeScreens:document.querySelectorAll('[data-app-screen-panel][aria-hidden="false"]').length,
        overlays:document.querySelectorAll(".arenaResultModalBackdrop").length,
        overflow:document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    }, { setup:setupFor(4, "custom_single_ms0nf51r", {1:"human",2:"human",3:"human",4:"human"}, "S2-C7-CHURN") });
    assert.strictEqual(churn.activeScreens, 1);
    assert(churn.overflow <= 2, JSON.stringify(churn));
    if (churn.heapGrowth != null) assert(churn.heapGrowth <= 256 * 1024 * 1024, `heap grew over 256 MiB: ${JSON.stringify(churn)}`);

    const devRequests = requested.filter(url => /(?:card_editor|map_editor|calibration_lab|expert_ai)\.js(?:$|\?)/.test(url));
    const unexpectedResponses = failedResponses.filter(item => {
      const relative = decodeURIComponent(new URL(item.url).pathname).replace(/^\/+/, "");
      const visualCandidateFallback = /^assets\/(?:tokens|cards\/art)\/.+\.(?:png|webp|jpe?g)$/i.test(relative);
      return item.status !== 404 || (!optionalMissingCandidates.has(relative) && !visualCandidateFallback);
    });
    const nonFallbackConsoleErrors = consoleErrors.filter(message => !message.includes("Failed to load resource: the server responded with a status of 404"));
    assert.deepStrictEqual(devRequests, []);
    assert.deepStrictEqual(unexpectedResponses, []);
    assert.strictEqual(await page.evaluate(() => document.documentElement.dataset.arenaPrecheckOk), "true");
    assert.deepStrictEqual(pageErrors, []);
    assert.deepStrictEqual(nonFallbackConsoleErrors, []);
    console.log(JSON.stringify({
      status:"PASS",
      startupMs,
      maps:mapResults.map(item => ({ id:item.id, players:item.players, cells:item.cells, strategicPoints:item.strategicPoints, initMs:Math.round(item.initMs), renderMs:Math.round(item.renderMs) })),
      modes:modeResults.map(item => ({ id:item.id, players:item.players, botActionMs:Math.round(item.botActionMs), events:item.eventCount })),
      churn,
      profile:"distribution",
      optionalFallback404s:failedResponses.length,
      pageErrors:0,
      consoleErrors:nonFallbackConsoleErrors.length
    }, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error && error.stack || error);
  process.exitCode = 1;
});
