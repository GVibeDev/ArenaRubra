"use strict";

const assert = require("assert");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");
const { verify } = require("../tools/build_distribution_artifact");

const root = path.resolve(process.env.ARENA_BROWSER_ROOT || "");
if (!process.env.ARENA_BROWSER_ROOT || !fs.existsSync(path.join(root, "ARTIFACT_MANIFEST.json"))) {
  console.error("ARENA_BROWSER_ROOT must point to a staged Distribution artifact");
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, "ARTIFACT_MANIFEST.json"), "utf8"));
const verified = verify(root);
const mime = { ".css":"text/css", ".html":"text/html", ".js":"text/javascript", ".json":"application/json", ".png":"image/png", ".webp":"image/webp", ".jpg":"image/jpeg", ".mp3":"audio/mpeg", ".md":"text/markdown", ".txt":"text/plain" };

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

(async () => {
  assert.strictEqual(manifest.profile, "distribution");
  assert.match(manifest.sourceCommit, /^[a-f0-9]{40}$/);
  assert.strictEqual(verified.files, manifest.summary.files);
  assert(fs.existsSync(path.join(root, "LICENSE")) && fs.existsSync(path.join(root, "Asset_License")));
  const server = await startServer();
  const browser = await chromium.launch({ headless:true, executablePath:process.env.ARENA_BROWSER_EXECUTABLE || chromium.executablePath() });
  const page = await browser.newPage({ viewport:{ width:1366, height:900 } });
  page.setDefaultTimeout(30000);
  const pageErrors = [];
  const requested = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("request", request => requested.push(request.url()));
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html?lang=en`, { waitUntil:"networkidle" });
    await page.waitForFunction(() => typeof newGame === "function" && typeof ArenaI18n !== "undefined" && ArenaI18n.diagnostics().status === "ready");
    const runtime = await page.evaluate(() => ({
      profile:ArenaRuntimeProfile.current(),
      version:BUILD_INFO.version,
      buildName:BUILD_INFO.buildName,
      expert:typeof expertAiRuntimeStateF9T1,
      language:document.documentElement.lang
    }));
    assert.strictEqual(runtime.profile, "distribution");
    assert.strictEqual(runtime.version, manifest.build.version);
    assert.strictEqual(runtime.buildName, manifest.build.buildName);
    assert.strictEqual(runtime.expert, "undefined");
    assert.strictEqual(runtime.language, "en");
    const precheck = await page.evaluate(() => {
      const originalMaybeRunBot = window.maybeRunBot;
      window.maybeRunBot = () => false;
      try {
        newGame({ mapId:"map1_starter", modes:{1:"human",2:"human"}, aiMode:"advanced", matchSeed:"S2-C7-ARTIFACT-SMOKE" });
      } finally { window.maybeRunBot = originalMaybeRunBot; }
      return runPrecheck({ quiet:true, source:"s2-c7-artifact-final" });
    });
    assert.strictEqual(precheck.ok, true, JSON.stringify(precheck.problems));
    assert.deepStrictEqual(requested.filter(url => /(?:card_editor|map_editor|calibration_lab|expert_ai)\.js(?:$|\?)/.test(url)), []);
    assert.deepStrictEqual(pageErrors, []);
    console.log(`PASS: final artifact smoke (${manifest.summary.files} files, ${manifest.summary.bytes} bytes, ${manifest.build.version}, source ${manifest.sourceState})`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error && error.stack || error);
  process.exitCode = 1;
});
