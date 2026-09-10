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

const setup = {
  mapId:"map1_starter",
  factions:{ 1:"Nexus", 2:"Exordium" },
  selectedCommanders:{ 1:"NXCMD01", 2:"EX0B00" },
  selectedDecks:{
    1:{ mode:"custom", savedKey:"Nexus::NXCMD01::bastione-mobile" },
    2:{ mode:"custom", savedKey:"Exordium::EX0B00::doppio-assalto-imperiale" }
  },
  modes:{ 1:"human", 2:"human" },
  autoResignEnabled:false,
  tutorialMode:false,
  mapLabMode:false,
  aiMode:"advanced",
  pacePreset:"standard",
  gameScaleMode:"large_scale",
  matchSeed:"S2-C7-HUD-GEOMETRY"
};

function closeEnough(a, b, tolerance = 2) {
  return Math.abs(a - b) <= tolerance;
}

(async () => {
  const server = await serverStart();
  const port = server.address().port;
  const browser = await chromium.launch({
    headless:true,
    executablePath:process.env.ARENA_BROWSER_EXECUTABLE || chromium.executablePath()
  });
  const results = [];
  const pageErrors = [];
  const viewports = [
    { width:1920, height:1080 },
    { width:1600, height:900 },
    { width:1366, height:768 }
  ];
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      page.setDefaultTimeout(120000);
      page.on("pageerror", error => pageErrors.push(`${viewport.width}x${viewport.height}: ${error.message}`));
      await page.goto(`http://127.0.0.1:${port}/index.html?profile=distribution&lang=it`, { waitUntil:"networkidle" });
      await page.waitForFunction(() => typeof newGame === "function" && typeof ArenaI18n !== "undefined" && ArenaI18n.diagnostics().status === "ready");
      await page.evaluate(gameSetup => {
        const originalMaybeRunBot = window.maybeRunBot;
        window.maybeRunBot = () => false;
        try { newGame(gameSetup); }
        finally { window.maybeRunBot = originalMaybeRunBot; }
        const splash = document.getElementById("appSplash");
        if (splash) splash.hidden = true;
        setAppScreen(ARENA_APP_SCREENS.GAME);
      }, setup);

      for (const language of ["it", "en"]) {
        await page.evaluate(async value => {
          await ArenaI18n.setLanguage(value);
          renderAll();
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }, language);
        const geometry = await page.evaluate(() => {
          const rect = selector => {
            const value = document.querySelector(selector).getBoundingClientRect();
            return { left:value.left, right:value.right, top:value.top, bottom:value.bottom, width:value.width, height:value.height };
          };
          const status = rect(".gameHudStatusRow");
          const bars = rect("#gameComparisonBars");
          const strip = rect("#gameHudStrip");
          const rows = [...document.querySelectorAll(".gameComparisonRow")].map(element => {
            const value = element.getBoundingClientRect();
            return { left:value.left, right:value.right, width:value.width };
          });
          const counters = [...document.querySelectorAll(".gameComparisonCounters")].map(element => {
            const value = element.getBoundingClientRect();
            return { left:value.left, right:value.right, width:value.width, text:element.innerText.trim() };
          });
          const chips = [...document.querySelectorAll(".gameHudStatusRow > .hudChip")].map(element => {
            const value = element.getBoundingClientRect();
            return {
              id:element.id,
              left:value.left,
              right:value.right,
              clientWidth:element.clientWidth,
              scrollWidth:element.scrollWidth,
              text:element.textContent.trim()
            };
          });
          return {
            language:document.documentElement.lang,
            status,
            bars,
            strip,
            rows,
            counters,
            chips,
            sticky:getComputedStyle(document.querySelector("#gameHudStrip")).position,
            horizontalOverflow:document.documentElement.scrollWidth - document.documentElement.clientWidth
          };
        });

        assert.strictEqual(geometry.language, language);
        assert(closeEnough(geometry.status.left, geometry.bars.left), JSON.stringify(geometry));
        assert(closeEnough(geometry.status.right, geometry.bars.right), JSON.stringify(geometry));
        assert(closeEnough((geometry.status.left + geometry.status.right) / 2, viewport.width / 2), JSON.stringify(geometry));
        assert(geometry.status.width <= 1180.1 && geometry.bars.width <= 1180.1, JSON.stringify(geometry));
        assert(["sticky", "relative"].includes(geometry.sticky), JSON.stringify(geometry));
        assert(geometry.horizontalOverflow <= 1, JSON.stringify(geometry));
        assert(geometry.rows.every(row => row.left >= geometry.bars.left - 1 && row.right <= geometry.bars.right + 1), JSON.stringify(geometry));
        assert(geometry.counters.every(counter => counter.text && counter.left >= geometry.bars.left && counter.right <= geometry.bars.right + 1), JSON.stringify(geometry));
        assert(geometry.chips.every(chip => chip.text && chip.left >= geometry.status.left - 1 && chip.right <= geometry.status.right + 1), JSON.stringify(geometry));
        assert(geometry.chips.every(chip => chip.scrollWidth <= chip.clientWidth + 1), JSON.stringify(geometry));
        results.push({ viewport:`${viewport.width}x${viewport.height}`, language, status:geometry.status, bars:geometry.bars, stripHeight:geometry.strip.height });
      }
      await page.close();
    }

    const mobile = await browser.newPage({ viewport:{ width:820, height:480 }, hasTouch:true });
    await mobile.goto(`http://127.0.0.1:${port}/index.html?profile=distribution&lang=en`, { waitUntil:"networkidle" });
    await mobile.waitForFunction(() => typeof newGame === "function" && typeof ArenaI18n !== "undefined" && ArenaI18n.diagnostics().status === "ready");
    const mobileGeometry = await mobile.evaluate(gameSetup => {
      document.body.classList.add("mobile-apk-m4");
      const originalMaybeRunBot = window.maybeRunBot;
      window.maybeRunBot = () => false;
      try { newGame(gameSetup); }
      finally { window.maybeRunBot = originalMaybeRunBot; }
      const splash = document.getElementById("appSplash");
      if (splash) splash.hidden = true;
      setAppScreen(ARENA_APP_SCREENS.GAME);
      const strip = document.querySelector("#gameHudStrip").getBoundingClientRect();
      const bars = document.querySelector("#gameComparisonBars").getBoundingClientRect();
      return {
        statusDisplay:getComputedStyle(document.querySelector(".gameHudStatusRow")).display,
        strip:{ left:strip.left, right:strip.right, width:strip.width },
        bars:{ left:bars.left, right:bars.right, width:bars.width },
        horizontalOverflow:document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    }, setup);
    assert.strictEqual(mobileGeometry.statusDisplay, "none");
    assert(mobileGeometry.bars.left >= mobileGeometry.strip.left && mobileGeometry.bars.right <= mobileGeometry.strip.right + 1, JSON.stringify(mobileGeometry));
    assert(mobileGeometry.horizontalOverflow <= 1, JSON.stringify(mobileGeometry));
    await mobile.close();

    assert.deepStrictEqual(pageErrors, []);
    console.log(JSON.stringify({ status:"PASS", desktop:results, mobile:mobileGeometry }, null, 2));
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
