"use strict";

// Arena Rubra – F9O7h1 Tutorial Visibility Hotfix metadata.
// F9O7h2 Performance Hotfix metadata.
// F9O7h3 FFA Unit Targeting & Structure Cap Hotfix metadata.
// F9R3 Proportional Pressure & Official Map Set metadata.
// F9R3 validated-baseline compatibility marker: version: "C2-STABLE-1-F9R3-APK-M4c"
// F9O7h3 validated-baseline compatibility marker: logicBaseline: "C2-STABLE-1-F9O7h3-APK-M4c"
// F9S1a Faction Unit & Tactic Expansion metadata.
// F9S1b Alternative Pivots & Complete 40-Card Pools metadata.
// F9S1b1 Custom Deck Selection & Official Map Pack Hotfix metadata.
// F9Q3d1 Target Player Foundation metadata.
// F9Q3d2 FFA Effects & Missions Hardening metadata.
// F9Q3d2 validated-baseline compatibility marker: version: "C2-STABLE-1-F9Q3d2-APK-M4c"
// F9Q3d2 historical logic marker: logicBaseline: "C2-STABLE-1-F9Q3d1-APK-M4c"
// F9Q3d3 Player Elimination & Active State Foundation metadata.
// F9Q3d3 validated-baseline compatibility marker: version: "C2-STABLE-1-F9Q3d3-APK-M4c"
// F9Q3d3 historical logic marker: logicBaseline: "C2-STABLE-1-F9Q3d2-APK-M4c"
// F9Q3d4 Elimination, Assist & Pressure Attribution metadata.
// F9Q3d4 validated-baseline compatibility marker: version: "C2-STABLE-1-F9Q3d4-APK-M4c"
// F9S1c1 Official 50-Deck Roster & Deck Builder UX Optimization metadata.
// F9Q3e1 Match Telemetry Foundation metadata.
// F9Q3e1a Telemetry Attribution & Pivot Instances Hotfix metadata.
// F9U1a Map HUD Layout Foundation metadata.
// F9U1a1 Inspector, Hand Alignment & Header Controls Hotfix metadata.
// F9U1b Unit Inspector & PS/Unit Bars metadata.
// F9U2a Card Pool Reorganization metadata.
// F9U2b Card Editor & Map Editor Layout Reorganization metadata.
// F9U2b frozen compatibility markers for historical static regressions:
// version: "C2-STABLE-1-F9U2b-APK-M4c"
// buildName: "Card Editor & Map Editor Layout Reorganization"
// logicBaseline: "C2-STABLE-1-F9U2a-APK-M4c"
// buildChannel: "f9u2b-candidate"
// telemetria F9Q3e1-2 restano invariati
// F9U3 Control Center metadata.
// F9U3 validated-baseline compatibility markers:
// version: "C2-STABLE-1-F9U3-APK-M4c"
// buildName: "Control Center"
// buildChannel: "f9u3-candidate"
// logicBaseline: "C2-STABLE-1-F9U2b-APK-M4c"
// F9T0 Advanced AI Finalization / Expert AI Preparation metadata.
// F9Q3d1 validated-baseline compatibility marker: version: "C2-STABLE-1-F9Q3d1-APK-M4c"
// F9Q3d1 historical logic marker: logicBaseline: "C2-STABLE-1-F9S1b1-APK-M4c"
// F9S1b1 validated-baseline compatibility marker: version: "C2-STABLE-1-F9S1b1-APK-M4c"
// F9S1b validated logic marker: logicBaseline: "C2-STABLE-1-F9S1b-APK-M4c"
// Single source of truth for visible build/version metadata.
// Do not hardcode build labels in menu, HUD, log/export or startup messages:
// read from BUILD_INFO through the helpers below.
// F9O7h candidate compatibility marker: version: "C2-STABLE-1-F9O7h-APK-M4c"
// F9O7h1 compatibility marker: version: "C2-STABLE-1-F9O7h1-APK-M4c"
// F9Q3c1 validated-baseline compatibility marker: version: "C2-STABLE-1-F9Q3c1-APK-M4c"
// F9Q3c1 historical logic marker: logicBaseline: "C2-STABLE-1-F9Q3c-APK-M4c"
// F9O7g compatibility audit markers retained for its frozen regression:
// version: "C2-STABLE-1-F9O7g-APK-M4c"
// logicBaseline: "C2-STABLE-1-F9O7f-APK-M4c"
// buildChannel: "lesson-5-fabeot"
// buildName storico: "Lezione 5 Fabeot" (marker di compatibilità per regressioni congelate F9O4b–F9O7g).

const BUILD_INFO = Object.freeze({
  appName: "Arena Rubra",
  stage: "Starter Game ALPHA",
  version: "C2-STABLE-1-F9T0-APK-M4c",
  buildName: "Advanced AI Finalization · Expert AI Preparation",
  buildDate: "2026-07-29",
  buildChannel: "f9t0-candidate",
  logicBaseline: "C2-STABLE-1-F9U3-APK-M4c",
  map: "Campo Starter · Diamond 4 · Claustro Clash · Narrow Path · Triple Battlefield · The Valley · Central hotspot · Plains 2G large · La Trappola",
  notes: "Candidata F9T0 basata sulla baseline validata F9U3. Finalizza l’IA avanzata e prepara il futuro grado Expert senza introdurre ricerca ricorsiva: soglie Pressione proporzionali a requiredPs e al controllo centrale; budget dinamico delle guarnigioni; rimozione dei doppi conteggi dottrinali; stati network_mature Nexus e green_line_mature Agathoi; memoria leggera anti-stallo/anti-oscillazione; selezione del movimento in un solo passaggio con stato e contesto condivisi. Nexus converte la rete matura in proiezione offensiva; Agathoi avanza quando la linea verde è stabilizzata. Regole, carte, statistiche, 50 deck ufficiali, mappe, Missioni, targeting, bilanciamento e schema telemetrico F9Q3e1-2 restano invariati. Il Centro di controllo F9U3 resta integralmente disponibile, compresi Deck Builder, Pool carte, Card Editor e Map Editor; pannelli e barre continuano a leggere lo stato autorevole della partita."
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
