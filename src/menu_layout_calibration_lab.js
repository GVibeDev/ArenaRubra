"use strict";

// Arena Rubra – F9M2e Visual Asset Population Pass.
// Dev tool: applica override CSS locali ai menu/laboratori, ai layer visuali mappa e agli slot asset.
// F9M2 aggiunge path asset ufficiali, UI skin e modalità token grafici senza terrain per cella.
// Non modifica gameplay, dati partita, deck, AI, combat o renderer carte.

const MENU_LAYOUT_CALIBRATION_STORAGE_KEY = "arenaRubra.menuLayoutCalibration.v1";
const MENU_LAYOUT_CALIBRATION_SCHEMA = "arena-rubra-menu-layout-calibration-lab-v3";

const MENU_LAYOUT_CALIBRATION_DEFAULTS = Object.freeze({
  enabled: true,
  screenPadding: 18,
  menuCardWidth: 620,
  setupCardWidth: 880,
  labCardWidth: 1180,
  wideLabCardWidth: 1380,
  cardPadding: 28,
  cardRadius: 24,
  groupGap: 12,
  buttonMinHeight: 44,
  backdropOpacity: 0.50,
  fontScale: 1.00,
  mapBgOpacity: 0.96,
  mapGridOpacity: 0.25,
  mapCellFillOpacity: 0.35,
  mapPsGlowOpacity: 1.00,
  mapQgGlowOpacity: 1.00,
  mapSkinKey: "red_dust",
  tokenGraphicsMode: "on"
});

const MENU_LAYOUT_CALIBRATION_FIELDS = Object.freeze([
  { key:"screenPadding", label:"Padding schermo", min:8, max:42, step:1, suffix:"px", css:"--f9l1-screen-padding" },
  { key:"menuCardWidth", label:"Larghezza menu", min:520, max:940, step:10, suffix:"px", css:"--f9l1-menu-card-width" },
  { key:"setupCardWidth", label:"Larghezza setup", min:740, max:1320, step:10, suffix:"px", css:"--f9l1-setup-card-width" },
  { key:"labCardWidth", label:"Larghezza Deck Builder", min:920, max:1540, step:10, suffix:"px", css:"--f9l1-lab-card-width" },
  { key:"wideLabCardWidth", label:"Larghezza Card Editor/Pool", min:1040, max:1660, step:10, suffix:"px", css:"--f9l1-wide-lab-card-width" },
  { key:"cardPadding", label:"Padding card", min:16, max:44, step:1, suffix:"px", css:"--f9l1-card-padding" },
  { key:"cardRadius", label:"Radius card", min:12, max:34, step:1, suffix:"px", css:"--f9l1-card-radius" },
  { key:"groupGap", label:"Gap sezioni", min:6, max:28, step:1, suffix:"px", css:"--f9l1-group-gap" },
  { key:"buttonMinHeight", label:"Altezza pulsanti", min:36, max:58, step:1, suffix:"px", css:"--f9l1-button-min-height" },
  { key:"backdropOpacity", label:"Opacità sfondo menu", min:0.20, max:0.78, step:0.01, suffix:"", css:"--f9l1-backdrop-opacity" },
  { key:"fontScale", label:"Scala testo menu", min:0.90, max:1.14, step:0.01, suffix:"", css:"--f9l1-font-scale" },
  { key:"mapBgOpacity", label:"Mappa · opacità fondo", min:0.18, max:1.00, step:0.01, suffix:"", css:"--map-bg-opacity" },
  { key:"mapGridOpacity", label:"Mappa · opacità griglia", min:0.00, max:0.28, step:0.01, suffix:"", css:"--map-grid-opacity" },
  { key:"mapCellFillOpacity", label:"Mappa · opacità celle", min:0.00, max:0.92, step:0.01, suffix:"", css:"--map-cell-fill-opacity" },
  { key:"mapPsGlowOpacity", label:"Mappa · glow PS", min:0.15, max:1.00, step:0.01, suffix:"", css:"--map-ps-glow-opacity" },
  { key:"mapQgGlowOpacity", label:"Mappa · glow QG", min:0.15, max:1.00, step:0.01, suffix:"", css:"--map-qg-glow-opacity" }
]);

const menuLayoutCalibrationState = {
  values: { ...MENU_LAYOUT_CALIBRATION_DEFAULTS },
  lastExport: ""
};

function menuLayoutCalibrationSkinKey(value) {
  if (typeof mapSkinByKey === "function") return mapSkinByKey(value).key;
  return String(value || MENU_LAYOUT_CALIBRATION_DEFAULTS.mapSkinKey || "arena_default");
}

function menuLayoutCalibrationTokenGraphicsMode(value) {
  if (typeof visualAssetTokenModeNormalize === "function") return visualAssetTokenModeNormalize(value);
  return String(value || "off").toLowerCase() === "on" ? "on" : "off";
}

function menuLayoutCalibrationReadJson(key, fallback) {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

function menuLayoutCalibrationWriteJson(key, value) {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(key, JSON.stringify(value, null, 2));
    return true;
  } catch (err) {
    console.warn("Menu Layout Calibration Lab: salvataggio localStorage fallito", err);
    return false;
  }
}

function menuLayoutCalibrationClamp(field, raw) {
  const value = Number(raw);
  const fallback = MENU_LAYOUT_CALIBRATION_DEFAULTS[field.key];
  if (!Number.isFinite(value)) return fallback;
  return Math.min(field.max, Math.max(field.min, value));
}

function menuLayoutCalibrationSanitize(values) {
  const out = { ...MENU_LAYOUT_CALIBRATION_DEFAULTS };
  if (values && typeof values === "object") {
    out.enabled = values.enabled !== false;
    out.mapSkinKey = menuLayoutCalibrationSkinKey(values.mapSkinKey || values.mapSkin || out.mapSkinKey);
    out.tokenGraphicsMode = menuLayoutCalibrationTokenGraphicsMode(values.tokenGraphicsMode || values.tokenMode || out.tokenGraphicsMode);
    for (const field of MENU_LAYOUT_CALIBRATION_FIELDS) {
      out[field.key] = menuLayoutCalibrationClamp(field, values[field.key]);
    }
  }
  out.mapSkinKey = menuLayoutCalibrationSkinKey(out.mapSkinKey);
  out.tokenGraphicsMode = menuLayoutCalibrationTokenGraphicsMode(out.tokenGraphicsMode);
  return out;
}

function menuLayoutCalibrationMigrateStoreValues(store) {
  const values = { ...((store && store.values) || {}) };
  // F9M2e: population pass degli asset visuali. Se il tester non ha ancora
  // modificato i vecchi default F9M2c/F9M2d, li migriamo al profilo validato:
  // red_dust, token grafici ON, fondo quasi pieno, griglia leggera e celle leggibili.
  // Se invece i valori sono stati calibrati manualmente, li preserviamo.
  if (!store || store.schema === MENU_LAYOUT_CALIBRATION_SCHEMA) return values;

  if (!values.mapSkinKey || values.mapSkinKey === "arena_default") values.mapSkinKey = MENU_LAYOUT_CALIBRATION_DEFAULTS.mapSkinKey;
  if (!values.tokenGraphicsMode || values.tokenGraphicsMode === "off") values.tokenGraphicsMode = MENU_LAYOUT_CALIBRATION_DEFAULTS.tokenGraphicsMode;

  if (Number(values.mapBgOpacity) === 0.96 || values.mapBgOpacity == null) values.mapBgOpacity = MENU_LAYOUT_CALIBRATION_DEFAULTS.mapBgOpacity;
  if (Number(values.mapGridOpacity) === 0.11 || values.mapGridOpacity == null) values.mapGridOpacity = MENU_LAYOUT_CALIBRATION_DEFAULTS.mapGridOpacity;
  if (Number(values.mapCellFillOpacity) === 0.42 || Number(values.mapCellFillOpacity) === 0.20 || values.mapCellFillOpacity == null) values.mapCellFillOpacity = MENU_LAYOUT_CALIBRATION_DEFAULTS.mapCellFillOpacity;
  if (Number(values.mapPsGlowOpacity) === 0.78 || values.mapPsGlowOpacity == null) values.mapPsGlowOpacity = MENU_LAYOUT_CALIBRATION_DEFAULTS.mapPsGlowOpacity;
  if (Number(values.mapQgGlowOpacity) === 0.82 || values.mapQgGlowOpacity == null) values.mapQgGlowOpacity = MENU_LAYOUT_CALIBRATION_DEFAULTS.mapQgGlowOpacity;

  return values;
}

function menuLayoutCalibrationLoadStore() {
  const store = menuLayoutCalibrationReadJson(MENU_LAYOUT_CALIBRATION_STORAGE_KEY, null);
  if (!store || (store.schema !== "arena-rubra-menu-layout-calibration-lab-v1" && store.schema !== "arena-rubra-menu-layout-calibration-lab-v2" && store.schema !== MENU_LAYOUT_CALIBRATION_SCHEMA)) {
    return menuLayoutCalibrationSanitize({
      ...MENU_LAYOUT_CALIBRATION_DEFAULTS,
      mapSkinKey: typeof mapSkinLoadKey === "function" ? mapSkinLoadKey() : MENU_LAYOUT_CALIBRATION_DEFAULTS.mapSkinKey,
      tokenGraphicsMode: typeof visualAssetTokenGraphicsMode === "function" ? visualAssetTokenGraphicsMode() : MENU_LAYOUT_CALIBRATION_DEFAULTS.tokenGraphicsMode
    });
  }
  return menuLayoutCalibrationSanitize(menuLayoutCalibrationMigrateStoreValues(store));
}

function menuLayoutCalibrationSaveStore() {
  return menuLayoutCalibrationWriteJson(MENU_LAYOUT_CALIBRATION_STORAGE_KEY, {
    schema: MENU_LAYOUT_CALIBRATION_SCHEMA,
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    updatedAt: new Date().toISOString(),
    values: menuLayoutCalibrationState.values
  });
}

function menuLayoutCalibrationCssValue(field, value) {
  const n = menuLayoutCalibrationClamp(field, value);
  return field.suffix === "px" ? `${Math.round(n)}px` : String(Math.round(n * 100) / 100);
}

function applyMenuLayoutCalibration(values = menuLayoutCalibrationState.values) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const clean = menuLayoutCalibrationSanitize(values);
  menuLayoutCalibrationState.values = clean;
  root.classList.toggle("f9l1-menu-layout-calibration-disabled", !clean.enabled);
  if (!clean.enabled) {
    for (const field of MENU_LAYOUT_CALIBRATION_FIELDS) root.style.removeProperty(field.css);
    return;
  }

  // F9M2d: applica prima la skin, poi gli override del calibratore.
  // Così eventuali variabili impostate dalla skin non possono coprire
  // slider come opacità celle/griglia/fondo.
  if (typeof mapSkinApply === "function") mapSkinApply(clean.mapSkinKey);
  if (typeof visualAssetSetTokenGraphicsMode === "function") visualAssetSetTokenGraphicsMode(clean.tokenGraphicsMode);

  for (const field of MENU_LAYOUT_CALIBRATION_FIELDS) {
    root.style.setProperty(field.css, menuLayoutCalibrationCssValue(field, clean[field.key]));
  }
}

function menuLayoutCalibrationEscapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '\"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function menuLayoutCalibrationCssExport(values = menuLayoutCalibrationState.values) {
  const clean = menuLayoutCalibrationSanitize(values);
  const lines = [
    "/* Arena Rubra F9M2c – Menu/Map Layout + Visual Asset Slots export */",
    ":root {"
  ];
  for (const field of MENU_LAYOUT_CALIBRATION_FIELDS) {
    lines.push(`  ${field.css}: ${menuLayoutCalibrationCssValue(field, clean[field.key])};`);
  }
  lines.push("}");
  if (typeof mapSkinCssExport === "function") {
    lines.push("", mapSkinCssExport(clean.mapSkinKey));
  }
  return lines.join("\n");
}

function menuLayoutCalibrationJsonExport(values = menuLayoutCalibrationState.values) {
  return JSON.stringify({
    schema: MENU_LAYOUT_CALIBRATION_SCHEMA,
    build: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
    exportedAt: new Date().toISOString(),
    mapSkin: typeof mapSkinExportMeta === "function" ? mapSkinExportMeta(menuLayoutCalibrationSanitize(values).mapSkinKey) : null,
    tokenAssets: typeof visualAssetTokenRegistryExport === "function" ? visualAssetTokenRegistryExport() : null,
    values: menuLayoutCalibrationSanitize(values)
  }, null, 2);
}

function menuLayoutCalibrationExportBundle(values = menuLayoutCalibrationState.values) {
  return `${menuLayoutCalibrationJsonExport(values)}\n\n${menuLayoutCalibrationCssExport(values)}`;
}

function menuLayoutCalibrationEnsureScreen() {
  if (typeof document === "undefined") return null;
  let screen = document.getElementById("menuLayoutLabScreen");
  if (screen) return screen;

  screen = document.createElement("section");
  screen.id = "menuLayoutLabScreen";
  screen.className = "appScreen menuLayoutLabScreen";
  screen.dataset.appScreenPanel = "layoutLab";
  screen.setAttribute("aria-label", "Menu/Map Layout Calibration Tool");
  screen.innerHTML = `
    <div class="mainMenuBackdrop"></div>
    <div class="menuLayoutLabCard">
      <div class="deckBuilderHeader menuLayoutLabHeader">
        <div>
          <div class="mainMenuKicker">Dev Tool temporaneo</div>
          <h2>Menu Layout Calibration</h2>
          <p class="deckBuilderIntro">F9M2c calibra layout menu/setup/laboratorio, skin UI/mappa e modalità token grafici tramite variabili CSS/localStorage. Non modifica gameplay, deck, AI, combat o dati ufficiali.</p>
        </div>
        <div class="deckBuilderHeaderActions menuLayoutLabHeaderActions">
          <button class="ghost" data-app-back-menu type="button">Torna al menu</button>
          <button class="ghost" data-menu-layout-preview="mainMenu" type="button">Vedi menu</button>
          <button class="ghost" data-menu-layout-preview="setup" type="button">Vedi setup</button>
          <button class="ghost" data-menu-layout-preview="deckBuilder" type="button">Vedi Deck Builder</button>
        </div>
      </div>

      <section class="deckBuilderBox menuLayoutLabControlsBox">
        <div class="deckBuilderBoxTitleRow">
          <h3>Override locali</h3>
          <span class="help">Usa i range, salva localmente oppure copia JSON/CSS per riportare i valori nel codice.</span>
        </div>
        <label class="checkline menuLayoutLabEnabledLine"><input id="menuLayoutEnabledInput" type="checkbox" checked> Applica override locali F9M2c</label>
        <div class="mapSkinSlotRow" id="mapSkinSlotRow"></div>
        <div class="menuLayoutLabGrid" id="menuLayoutLabControls"></div>
        <div class="menuLayoutLabActions">
          <button class="primary" id="menuLayoutApplyBtn" type="button">Applica preview</button>
          <button class="ghost" id="menuLayoutSaveBtn" type="button">Salva locale</button>
          <button class="ghost" id="menuLayoutCopyJsonBtn" type="button">Copia JSON</button>
          <button class="ghost" id="menuLayoutCopyCssBtn" type="button">Copia CSS</button>
          <button class="danger" id="menuLayoutResetBtn" type="button">Reset default</button>
        </div>
        <div class="deckBuilderMeta" id="menuLayoutStatusLine">Override pronti.</div>
      </section>

      <section class="deckBuilderBox menuLayoutLabExportBox">
        <div class="deckBuilderBoxTitleRow">
          <h3>Export calibrazione</h3>
          <span class="help">Il JSON è per reimport/backup; il blocco CSS è quello utile per fissare i valori in una patch stabile.</span>
        </div>
        <textarea id="menuLayoutExportText" spellcheck="false"></textarea>
        <p class="rendererCalibrationNote">Nota: il calibratore resta uno strumento di officina. Dopo la scelta dei valori, conviene fissare solo le variabili davvero utili.</p>
      </section>
    </div>`;

  const gameScreen = document.getElementById("gameScreen");
  if (gameScreen && gameScreen.parentNode) gameScreen.parentNode.insertBefore(screen, gameScreen);
  else document.body.appendChild(screen);
  menuLayoutCalibrationBindScreen(screen);
  return screen;
}

function menuLayoutCalibrationControlHtml(field, value) {
  const clean = menuLayoutCalibrationClamp(field, value);
  const display = field.suffix === "px" ? `${Math.round(clean)} px` : `${Math.round(clean * 100) / 100}`;
  return `
    <label class="menuLayoutLabField" for="menuLayoutField_${field.key}">
      <span>${menuLayoutCalibrationEscapeHtml(field.label)} <strong id="menuLayoutValue_${field.key}">${display}</strong></span>
      <input id="menuLayoutField_${field.key}" data-menu-layout-field="${field.key}" type="range" min="${field.min}" max="${field.max}" step="${field.step}" value="${clean}">
    </label>`;
}

function menuLayoutCalibrationSkinOptionsHtml(selectedKey) {
  const presets = typeof mapSkinPresets === "function" ? mapSkinPresets() : [];
  const current = menuLayoutCalibrationSkinKey(selectedKey);
  return presets.map(skin => `<option value="${menuLayoutCalibrationEscapeHtml(skin.key)}"${skin.key === current ? " selected" : ""}>${menuLayoutCalibrationEscapeHtml(skin.label || skin.key)}</option>`).join("");
}

function menuLayoutCalibrationTokenModeOptionsHtml(selectedMode) {
  const current = menuLayoutCalibrationTokenGraphicsMode(selectedMode);
  const options = [
    { key:"off", label:"Token grafici OFF · CSS/SVG stabile" },
    { key:"on", label:"Token grafici ON · usa asset se presenti" }
  ];
  return options.map(opt => `<option value="${opt.key}"${opt.key === current ? " selected" : ""}>${menuLayoutCalibrationEscapeHtml(opt.label)}</option>`).join("");
}

function menuLayoutCalibrationRenderSkinSlot(values = menuLayoutCalibrationState.values) {
  const box = document.getElementById("mapSkinSlotRow");
  if (!box) return;
  const clean = menuLayoutCalibrationSanitize(values);
  const skin = typeof mapSkinByKey === "function" ? mapSkinByKey(clean.mapSkinKey) : { key: clean.mapSkinKey, label: clean.mapSkinKey, description: "" };
  const bgAsset = skin.asset && skin.asset.backgroundImage ? skin.asset.backgroundImage : "fallback CSS";
  box.innerHTML = `
    <div class="mapSkinSelectBox">
      <label for="menuLayoutMapSkinSelect">
        <span>Skin / sfondo mappa</span>
        <select id="menuLayoutMapSkinSelect" data-menu-layout-skin>
          ${menuLayoutCalibrationSkinOptionsHtml(clean.mapSkinKey)}
        </select>
      </label>
      <label for="menuLayoutTokenGraphicsModeSelect">
        <span>Token grafici in mappa</span>
        <select id="menuLayoutTokenGraphicsModeSelect" data-menu-layout-token-mode>
          ${menuLayoutCalibrationTokenModeOptionsHtml(clean.tokenGraphicsMode)}
        </select>
      </label>
      <div class="mapSkinSlotMeta">F9M2c separa asset reale e fallback CSS; se il file manca resta il fallback procedurale.</div>
    </div>
    <div class="mapSkinPreviewCard" aria-hidden="true">
      <div class="mapSkinPreviewText">
        <strong>${menuLayoutCalibrationEscapeHtml(skin.label || skin.key)}</strong>
        <span>${menuLayoutCalibrationEscapeHtml(skin.description || "Skin visuale mappa")}</span>
        <span class="mapSkinAssetPath">BG: ${menuLayoutCalibrationEscapeHtml(bgAsset)}</span>
        <span class="mapSkinAssetPath">Asset status: ${menuLayoutCalibrationEscapeHtml((document.documentElement.dataset.mapBgAssetStatus || "checking").toUpperCase())}</span>
        <span class="mapSkinAssetPath">Token: ${menuLayoutCalibrationEscapeHtml(clean.tokenGraphicsMode.toUpperCase())}</span>
      </div>
    </div>`;
}

function menuLayoutCalibrationReadControls() {
  const next = { ...menuLayoutCalibrationState.values };
  const enabled = document.getElementById("menuLayoutEnabledInput");
  const skinSelect = document.getElementById("menuLayoutMapSkinSelect");
  const tokenModeSelect = document.getElementById("menuLayoutTokenGraphicsModeSelect");
  next.enabled = enabled ? enabled.checked : true;
  if (skinSelect) next.mapSkinKey = menuLayoutCalibrationSkinKey(skinSelect.value);
  if (tokenModeSelect) next.tokenGraphicsMode = menuLayoutCalibrationTokenGraphicsMode(tokenModeSelect.value);
  for (const field of MENU_LAYOUT_CALIBRATION_FIELDS) {
    const input = document.getElementById(`menuLayoutField_${field.key}`);
    if (input) next[field.key] = menuLayoutCalibrationClamp(field, input.value);
  }
  return menuLayoutCalibrationSanitize(next);
}

function menuLayoutCalibrationWriteControls(values = menuLayoutCalibrationState.values) {
  const clean = menuLayoutCalibrationSanitize(values);
  const enabled = document.getElementById("menuLayoutEnabledInput");
  if (enabled) enabled.checked = clean.enabled;
  const grid = document.getElementById("menuLayoutLabControls");
  if (grid) {
    grid.innerHTML = MENU_LAYOUT_CALIBRATION_FIELDS.map(field => menuLayoutCalibrationControlHtml(field, clean[field.key])).join("");
  }
  menuLayoutCalibrationRenderSkinSlot(clean);
  menuLayoutCalibrationRefreshValueLabels(clean);
  menuLayoutCalibrationRefreshExport(clean);
}

function menuLayoutCalibrationRefreshValueLabels(values = menuLayoutCalibrationState.values) {
  const clean = menuLayoutCalibrationSanitize(values);
  for (const field of MENU_LAYOUT_CALIBRATION_FIELDS) {
    const label = document.getElementById(`menuLayoutValue_${field.key}`);
    if (!label) continue;
    const value = menuLayoutCalibrationClamp(field, clean[field.key]);
    label.textContent = field.suffix === "px" ? `${Math.round(value)} px` : `${Math.round(value * 100) / 100}`;
  }
}

function menuLayoutCalibrationRefreshExport(values = menuLayoutCalibrationState.values) {
  const text = menuLayoutCalibrationExportBundle(values);
  menuLayoutCalibrationState.lastExport = text;
  const area = document.getElementById("menuLayoutExportText");
  if (area) area.value = text;
}

function menuLayoutCalibrationSetStatus(text, tone = "") {
  const line = document.getElementById("menuLayoutStatusLine");
  if (!line) return;
  line.textContent = text || "";
  line.classList.toggle("good", tone === "good");
  line.classList.toggle("bad", tone === "bad");
}

function menuLayoutCalibrationApplyFromControls(save = false) {
  const next = menuLayoutCalibrationReadControls();
  applyMenuLayoutCalibration(next);
  menuLayoutCalibrationWriteControls(next);
  if (save) {
    const ok = menuLayoutCalibrationSaveStore();
    if (typeof mapSkinSaveKey === "function") mapSkinSaveKey(next.mapSkinKey);
    if (typeof visualAssetSetTokenGraphicsMode === "function") visualAssetSetTokenGraphicsMode(next.tokenGraphicsMode, { save:true });
    menuLayoutCalibrationSetStatus(ok ? "Override layout, skin e token mode salvati in locale." : "Salvataggio locale non riuscito.", ok ? "good" : "bad");
  } else {
    menuLayoutCalibrationSetStatus("Preview layout applicata.", "good");
  }
}

function menuLayoutCalibrationCopy(text, statusText) {
  const value = String(text || "");
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(value)
      .then(() => menuLayoutCalibrationSetStatus(statusText || "Copiato negli appunti.", "good"))
      .catch(() => menuLayoutCalibrationFallbackCopy(value, statusText));
    return;
  }
  menuLayoutCalibrationFallbackCopy(value, statusText);
}

function menuLayoutCalibrationFallbackCopy(text, statusText) {
  try {
    const area = document.getElementById("menuLayoutExportText");
    if (area) {
      area.value = text;
      area.focus();
      area.select();
      document.execCommand("copy");
      menuLayoutCalibrationSetStatus(statusText || "Copiato negli appunti.", "good");
      return;
    }
  } catch (_) {}
  menuLayoutCalibrationSetStatus("Copia automatica non disponibile: seleziona il testo export.", "bad");
}

function menuLayoutCalibrationBindScreen(screen) {
  if (!screen || screen.dataset.bound === "1") return;
  screen.dataset.bound = "1";

  screen.addEventListener("input", event => {
    const target = event.target;
    if (!target || !target.matches("[data-menu-layout-field], [data-menu-layout-skin], [data-menu-layout-token-mode], #menuLayoutEnabledInput")) return;
    const next = menuLayoutCalibrationReadControls();
    applyMenuLayoutCalibration(next);
    if (target.matches("[data-menu-layout-skin], [data-menu-layout-token-mode]")) menuLayoutCalibrationRenderSkinSlot(next);
    menuLayoutCalibrationRefreshValueLabels(next);
    menuLayoutCalibrationRefreshExport(next);
    menuLayoutCalibrationSetStatus("Preview live applicata.");
  });

  const applyBtn = screen.querySelector("#menuLayoutApplyBtn");
  if (applyBtn) applyBtn.addEventListener("click", () => menuLayoutCalibrationApplyFromControls(false));

  const saveBtn = screen.querySelector("#menuLayoutSaveBtn");
  if (saveBtn) saveBtn.addEventListener("click", () => menuLayoutCalibrationApplyFromControls(true));

  const resetBtn = screen.querySelector("#menuLayoutResetBtn");
  if (resetBtn) resetBtn.addEventListener("click", () => {
    menuLayoutCalibrationState.values = { ...MENU_LAYOUT_CALIBRATION_DEFAULTS };
    applyMenuLayoutCalibration(menuLayoutCalibrationState.values);
    menuLayoutCalibrationWriteControls(menuLayoutCalibrationState.values);
    menuLayoutCalibrationSaveStore();
    if (typeof mapSkinSaveKey === "function") mapSkinSaveKey(menuLayoutCalibrationState.values.mapSkinKey);
    if (typeof visualAssetSetTokenGraphicsMode === "function") visualAssetSetTokenGraphicsMode(menuLayoutCalibrationState.values.tokenGraphicsMode, { save:true });
    menuLayoutCalibrationSetStatus("Valori F9M2c riportati ai default.", "good");
  });

  const copyJsonBtn = screen.querySelector("#menuLayoutCopyJsonBtn");
  if (copyJsonBtn) copyJsonBtn.addEventListener("click", () => {
    const next = menuLayoutCalibrationReadControls();
    menuLayoutCalibrationCopy(menuLayoutCalibrationJsonExport(next), "JSON calibrazione copiato.");
  });

  const copyCssBtn = screen.querySelector("#menuLayoutCopyCssBtn");
  if (copyCssBtn) copyCssBtn.addEventListener("click", () => {
    const next = menuLayoutCalibrationReadControls();
    menuLayoutCalibrationCopy(menuLayoutCalibrationCssExport(next), "CSS calibrazione copiato.");
  });

  screen.querySelectorAll("[data-menu-layout-preview]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.menuLayoutPreview;
      if (target === "mainMenu" && typeof openMainMenu === "function") openMainMenu();
      else if (target === "setup" && typeof openNewGameSetupScreen === "function") openNewGameSetupScreen();
      else if (target === "deckBuilder" && typeof openDeckBuilderScreen === "function") openDeckBuilderScreen();
    });
  });
}

function renderMenuLayoutCalibrationLab() {
  const screen = menuLayoutCalibrationEnsureScreen();
  if (!screen) return;
  menuLayoutCalibrationWriteControls(menuLayoutCalibrationState.values);
}

function openMenuLayoutCalibrationLabScreen() {
  menuLayoutCalibrationEnsureScreen();
  renderMenuLayoutCalibrationLab();
  if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") {
    setAppScreen(ARENA_APP_SCREENS.LAYOUT_LAB || "layoutLab");
  }
}

function initializeMenuLayoutCalibrationLab() {
  menuLayoutCalibrationState.values = menuLayoutCalibrationLoadStore();
  applyMenuLayoutCalibration(menuLayoutCalibrationState.values);
  menuLayoutCalibrationEnsureScreen();
}

// Applica eventuali override salvati appena lo script viene caricato.
try {
  menuLayoutCalibrationState.values = menuLayoutCalibrationLoadStore();
  applyMenuLayoutCalibration(menuLayoutCalibrationState.values);
} catch (err) {
  console.warn("Menu Layout Calibration Lab: bootstrap non riuscito", err);
}
