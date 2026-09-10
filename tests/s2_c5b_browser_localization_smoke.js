"use strict";

const assert = require("assert");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const mime = { ".css":"text/css", ".html":"text/html", ".js":"text/javascript", ".json":"application/json", ".png":"image/png", ".webp":"image/webp", ".jpg":"image/jpeg", ".mp3":"audio/mpeg" };

function startServer() {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const target = path.resolve(root, relative);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    fs.readFile(target, (error, body) => {
      if (error) {
        response.writeHead(error.code === "ENOENT" ? 404 : 500).end(error.code || "Error");
        return;
      }
      response.writeHead(200, { "Content-Type":mime[path.extname(target).toLowerCase()] || "application/octet-stream" });
      response.end(body);
    });
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(server)));
}

(async () => {
  const server = await startServer();
  const address = server.address();
  const browser = await chromium.launch({ headless:true, executablePath:process.env.ARENA_BROWSER_EXECUTABLE || chromium.executablePath() });
  const page = await browser.newPage({ viewport:{ width:1440, height:900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.goto(`http://127.0.0.1:${address.port}/?profile=distribution&lang=en`, { waitUntil:"networkidle" });
    await page.waitForFunction(() => document.documentElement.lang === "en" && !document.getElementById("arenaLanguageSelect").disabled);
    assert.strictEqual(await page.locator("html").getAttribute("lang"), "en");
    assert.strictEqual(await page.locator("#arenaLanguageSelect").inputValue(), "en");
    assert.match(await page.locator("#mainMenuNewGameBtn").innerText(), /New game/i);
    assert.strictEqual(await page.locator("#gameDebugHeaderBtn").isVisible(), false);
    assert.strictEqual(await page.locator("#mainMenuTelemetryBtn").isVisible(), false);

    await page.locator("#splashEnterBtn").click();
    await page.waitForSelector("#appSplash", { state:"hidden" });
    await page.locator("#mainMenuNewGameBtn").click();
    await page.waitForSelector('#setupScreen[aria-hidden="false"]');
    const englishSetup = await page.locator("#setupScreen").innerText();
    assert.match(englishSetup, /Match parameters/i);
    assert.match(englishSetup, /Starting initiative/i);
    assert.match(englishSetup, /SP garrison/);
    assert.doesNotMatch(englishSetup, /Presidio PS|Sustain offensivo|Formazione difensiva/);
    assert.strictEqual(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true);

    await page.locator("#setupBackMenuBtn").click();
    await page.locator("#arenaLanguageSelect").selectOption("it");
    await page.waitForFunction(() => document.documentElement.lang === "it");
    await page.locator("#mainMenuNewGameBtn").click();
    await page.waitForSelector('#setupScreen[aria-hidden="false"]');
    assert.match(await page.locator("#setupScreen").innerText(), /Parametri (partita|match)/i);
    await page.evaluate(() => history.replaceState(null, "", `${location.pathname}?profile=distribution`));
    await page.reload({ waitUntil:"networkidle" });
    await page.waitForFunction(() => document.documentElement.lang === "it");
    assert.strictEqual(await page.locator("#arenaLanguageSelect").inputValue(), "it");

    await page.evaluate(() => ArenaI18n.setLanguage("en"));
    await page.waitForFunction(() => document.documentElement.lang === "en");
    await page.reload({ waitUntil:"networkidle" });
    await page.waitForFunction(() => document.documentElement.lang === "en");
    assert.strictEqual(await page.locator("#arenaLanguageSelect").inputValue(), "en");
    assert.deepStrictEqual(errors, []);
    console.log("S2-C5b browser localization smoke: 15/15 OK");
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error && error.stack || error);
  process.exitCode = 1;
});
