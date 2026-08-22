"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");

const index = read("index.html");
const css = read("css/style.css");
const runtime = read("src/control_center.js");
const app = read("src/app.js");
const build = read("src/build_info.js");
const precheck = read("src/precheck.js");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };
const once = id => (index.match(new RegExp(`id=["']${id}["']`, "g")) || []).length === 1;

ok(build.includes('version: "C2-STABLE-1-F9V2f-APK-M4c"'), "versione F9T2c");
ok(build.includes('buildName: "Tutorial Challenge I · Elimination"'), "nome build F9T2d");
ok(build.includes('logicBaseline: "C2-STABLE-1-F9T2c4-APK-M4c"'), "baseline logica F9T2c4");
ok(build.includes('buildChannel: "starter2-tutorial-v2f"'), "canale candidato F9T2c");
ok(build.includes("F9Q3e1-2") && build.includes("F9T1-1") && build.includes("F9T2d3-1"), "schema base, contratto Expert ed estensione dottrinale dichiarati");

[
  "mainMenuNewGameBtn", "mainMenuTutorialBtn", "mainMenuResumeBtn", "mainMenuMapArchiveBtn",
  "mainMenuStatsBtn", "mainMenuHistoryBtn", "mainMenuTelemetryBtn", "mainMenuLogBtn",
  "mainMenuAboutBtn", "mainMenuSettingsBtn", "mainMenuOptionsBtn", "mainMenuTransferBtn",
  "controlCenterVersion", "controlCenterLogicBaseline", "controlCenterTelemetrySchema",
  "controlCenterOfficialDecks", "controlCenterOfficialMaps", "controlCenterStorageSpace",
  "controlCenterLastMatch", "controlCenterDiagnosticErrors", "controlCenterPanel",
  "controlCenterPanelTitle", "controlCenterPanelBody", "controlCenterPanelCloseBtn"
].forEach(id => ok(once(id), `${id} presente una sola volta`));

ok((index.match(/class="[^"]*controlCenterArea[^"]*"/g) || []).length === 5, "cinque aree Control Center");
["Gioca", "Carte e deck", "Mappe", "Analisi", "Sistema"].forEach(label => ok(index.includes(`>${label}<`) || index.toLowerCase().includes(`>${label.toLowerCase()}<`), `area ${label}`));
ok(index.includes('<script src="src/control_center.js"></script>'), "runtime Control Center incluso");
ok(index.indexOf('src/control_center.js') < index.indexOf('src/app.js'), "runtime caricato prima della shell app");

[
  "function initializeControlCenter", "function controlCenterSnapshot", "function controlCenterArchiveEnvelope",
  "function controlCenterImportArchiveFile", "function controlCenterRunDiagnostics", "function controlCenterApplyDeveloperMode",
  "function controlCenterOpenPanel", "function controlCenterMapsHtml", "function controlCenterTelemetryHtml"
].forEach(marker => ok(runtime.includes(marker), marker));
ok(runtime.includes('CONTROL_CENTER_TELEMETRY_SCHEMA_FALLBACK = "F9Q3e1-2"'), "fallback schema telemetrico");
ok(runtime.includes('ArenaDataStore.createBackup("pre-f9u3-import")'), "backup di sicurezza pre-import");
ok(runtime.includes('known.has(key)'), "chiavi import filtrate");
ok(runtime.includes('CONTROL_CENTER_DIAGNOSTIC_ERRORS'), "cattura errori runtime");
ok(runtime.includes('data-control-center-dev-only'), "visibilità Debug gestita");

ok(app.includes('initializeControlCenter()'), "inizializzazione Control Center nella shell");
ok(app.includes('controlCenterRefreshMetrics'), "refresh metriche integrato");
ok(app.includes('controlCenterClosePanel'), "chiusura pannello su navigazione");
ok(precheck.includes('F9U3: Centro di controllo con cinque aree'), "precheck F9U3");

ok(css.includes('F9U3 – Control Center'), "blocco CSS F9U3");
ok(css.includes('.mainMenuDashboard.controlCenterDashboard'), "griglia centrale F9U3");
ok(css.includes('.controlCenterStatusBoard'), "plancia stato");
ok(css.includes('.controlCenterPanelSheet'), "pannello modale");
ok(css.includes('@media (max-width: 760px)'), "reflow mobile");
ok(css.includes('html[data-arena-developer-mode="off"]'), "hide developer mode");

console.log(`F9U3 Control Center smoke: ${checks}/${checks} verifiche superate`);
