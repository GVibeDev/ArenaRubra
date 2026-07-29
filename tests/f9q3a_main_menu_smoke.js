"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const ROOT = path.resolve(__dirname, "..");
const read = rel => fs.readFileSync(path.join(ROOT, rel), "utf8");
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks += 1; };

const html = read("index.html");
const css = read("css/style.css");
const app = read("src/app.js");
const ui = read("src/ui.js");
const build = read("src/build_info.js");
const control = read("src/control_center.js");

ok(html.includes("mainMenuHero") && html.includes("mainMenuDashboard"), "fondazione dashboard prodotto conservata");
ok(html.includes("mainMenuPlayPanel") && html.includes("mainMenuPrimaryAction"), "Nuova partita conserva gerarchia primaria");
ok((html.match(/mainMenuStudioTile/g) || []).length >= 12, "strumenti applicazione ordinati come tile");
ok(html.includes('id="menuStorageStatus"') && html.includes('id="mainMenuLocalSummary"'), "menu mostra stato archivio e dati locali");
ok((html.match(/controlCenterArea/g) || []).length >= 5, "cinque aree del Centro di controllo");
for (const id of ["mainMenuStatsBtn","mainMenuAboutBtn","mainMenuOptionsBtn"]) {
  ok(new RegExp(`<button[^>]*id="${id}"[^>]*data-control-center-panel=`).test(html), `${id} è attivo nel Centro di controllo`);
}
ok(html.includes("data-control-center-dev-only"), "Debug predisposto per la Modalità sviluppatore");
ok(control.includes("controlCenterReadDeveloperMode") && control.includes("controlCenterSetDeveloperMode"), "Modalità sviluppatore persistente");
ok(app.includes('if (btn.disabled || btn.getAttribute("aria-disabled") === "true"'), "placeholder legacy disattivi restano protetti");
ok(app.includes("refreshMainMenuLocalDataSummary") && app.includes("arenaStorageBackendDiagnostics"), "riepilogo menu legge il backend centralizzato");
ok(ui.includes("await arenaDataStoreReady()") && ui.includes("arena-storage-loading"), "AppShell attende il vault prima delle librerie");
ok(css.includes(".mainMenuDashboard") && css.includes(".controlCenterActionGrid"), "CSS dashboard e Control Center presenti");
ok(css.includes("grid-template-columns: repeat(2, minmax(0, 1fr))"), "griglie strumenti desktop conservate");
ok(css.includes("@media (max-width: 760px)") && css.includes("grid-template-columns: 1fr"), "breakpoint mobile passa a una colonna");
ok(css.includes("min-height: 44px") || css.includes("min-height:44px"), "target touch minimo previsto");
ok(css.includes("overflow-y: auto") || css.includes("overflow: auto"), "menu e pannelli scorrono nei viewport ridotti");
ok(build.includes("C2-STABLE-1-F9Q3c1-APK-M4c"), "marker storico F9Q3c1 conservato");
ok(build.includes('version: "C2-STABLE-1-F9T0-APK-M4c"'), "metadata F9T0 corrente");

console.log(`F9Q3a/F9T0 main menu regression smoke: ${checks}/${checks} OK`);
