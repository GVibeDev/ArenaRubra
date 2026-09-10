"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const runtime = fs.readFileSync(path.join(root, "src/i18n/runtime.js"), "utf8");
const app = fs.readFileSync(path.join(root, "src/app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css/components/language_picker.css"), "utf8");

assert(index.includes('id="arenaLanguageSelect"'));
assert(index.includes('data-i18n="menu.play.newTitle"'));
assert(index.includes('data-i18n="setup.startGame"'));
assert(index.includes('data-i18n-aria-label="menu.ariaLabel"'));
assert(index.indexOf('src/storage.js') < index.indexOf('src/i18n/core.js'));
assert(index.indexOf('src/i18n/core.js') < index.indexOf('src/i18n/runtime.js'));
assert(index.indexOf('src/i18n/runtime.js') < index.indexOf('src/app.js'));
assert(runtime.includes('localization: { ...(settings.localization || {}), language }'));
assert(runtime.includes('window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT'));
assert(runtime.includes('document.documentElement.lang = state.service.currentLanguage()'));
assert(runtime.includes('data-i18n-params'));
assert(app.includes('window.addEventListener("arena:languagechange"'));
assert(css.includes('.arenaLanguagePicker select:focus-visible'));
const gate = spawnSync(process.execPath, [path.join(root, "tools/check_locales.js")], { cwd: root, encoding: "utf8" });
assert.strictEqual(gate.status, 0, gate.stderr || gate.stdout);
assert(gate.stdout.includes("runtime bindings"));

console.log("S2-C5b2 shell/setup i18n contract smoke: 15/15 OK");
