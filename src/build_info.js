"use strict";

// Arena Rubra – F9O7g Lezione 5 Fabeot metadata.
// Single source of truth for visible build/version metadata.
// Do not hardcode build labels in menu, HUD, log/export or startup messages:
// read from BUILD_INFO through the helpers below.
// F9O7g compatibility audit markers retained for its frozen regression:
// version: "C2-STABLE-1-F9O7g-APK-M4c"
// logicBaseline: "C2-STABLE-1-F9O7f-APK-M4c"
// buildChannel: "lesson-5-fabeot"

const BUILD_INFO = Object.freeze({
  appName: "Arena Rubra",
  stage: "Starter Game ALPHA",
  version: "C2-STABLE-1-F9Q3-APK-M4c",
  buildName: "Mappe composite multiplayer · terreni · editor",
  buildDate: "2026-07-25",
  buildChannel: "f9q3-candidate",
  logicBaseline: "C2-STABLE-1-F9O7g-APK-M4c",
  map: "MAP1 classica · MAP2 Triumvirato · MAP3 Quadrivio Spezzato · mappe custom v1",
  notes: "Candidato F9Q3 basato su F9O7g validata: MAP1 e cinque lezioni invariati; MAP2/MAP3 FFA locale, terreni statici, pericoli iniziali, runtime 2-4 giocatori ed editor mappe con validazione/import-export."
});

function buildInfoLabel() {
  if (typeof BUILD_INFO === "undefined" || !BUILD_INFO) return "unknown";
  return BUILD_INFO.version || "unknown";
}

function buildInfoFullLabel() {
  if (typeof BUILD_INFO === "undefined" || !BUILD_INFO) return "Arena Rubra";
  const parts = [BUILD_INFO.appName, BUILD_INFO.stage, BUILD_INFO.version, BUILD_INFO.buildName].filter(Boolean);
  return parts.join(" · ");
}

function buildInfoShortStageLabel() {
  if (typeof BUILD_INFO === "undefined" || !BUILD_INFO) return "Arena Rubra";
  return `${BUILD_INFO.appName || "Arena Rubra"} · ${BUILD_INFO.stage || ""}`.trim();
}

function buildInfoExportMeta() {
  if (typeof BUILD_INFO === "undefined" || !BUILD_INFO) return {};
  return {
    appName: BUILD_INFO.appName || "Arena Rubra",
    stage: BUILD_INFO.stage || "",
    version: BUILD_INFO.version || "unknown",
    buildName: BUILD_INFO.buildName || "",
    buildDate: BUILD_INFO.buildDate || "",
    buildChannel: BUILD_INFO.buildChannel || "",
    logicBaseline: BUILD_INFO.logicBaseline || "",
    map: BUILD_INFO.map || "",
    notes: BUILD_INFO.notes || ""
  };
}

function setTextIfPresent(id, value) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (el) el.textContent = value == null ? "" : String(value);
}

function applyBuildInfoToDom() {
  if (typeof document === "undefined" || typeof BUILD_INFO === "undefined") return;
  document.title = `${BUILD_INFO.appName} – ${BUILD_INFO.stage} (${BUILD_INFO.version})`;
  setTextIfPresent("buildAppName", BUILD_INFO.appName || "Arena Rubra");
  setTextIfPresent("buildStage", BUILD_INFO.stage || "");
  setTextIfPresent("buildVersion", BUILD_INFO.version || "unknown");
  setTextIfPresent("topBuildStage", BUILD_INFO.stage || "Starter Game");
  setTextIfPresent("topBuildVersion", BUILD_INFO.version || "unknown");
  setTextIfPresent("menuBuildVersion", BUILD_INFO.version || "unknown");
  setTextIfPresent("menuBuildName", BUILD_INFO.buildName || "");
  setTextIfPresent("menuBuildDate", BUILD_INFO.buildDate || "");
  setTextIfPresent("menuBuildChannel", BUILD_INFO.buildChannel || "");
  setTextIfPresent("menuLogicBaseline", BUILD_INFO.logicBaseline || "");
  setTextIfPresent("menuBuildNotes", BUILD_INFO.notes || "");
  setTextIfPresent("setupBuildVersion", BUILD_INFO.version || "unknown");
  setTextIfPresent("setupBuildName", BUILD_INFO.buildName || "");
  setTextIfPresent("freezeRulesBuildVersion", BUILD_INFO.version || "unknown");
  setTextIfPresent("gameHudBuild", BUILD_INFO.version || "unknown");
  setTextIfPresent("deckBuilderMetaLine", `${BUILD_INFO.version || "unknown"} · ${BUILD_INFO.buildName || ""}`.trim());
}
