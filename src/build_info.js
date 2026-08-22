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
// F9T0 frozen compatibility markers:
// version: "C2-STABLE-1-F9T0-APK-M4c"
// buildChannel: "f9t0-candidate"
// logicBaseline: "C2-STABLE-1-F9U3-APK-M4c"
// F9T1 Expert AI Architecture & Telemetry Contract metadata.
// F9T2 Exordium Expert Bastion Relay Doctrine metadata.
// F9T2a Bastion Relay Candidate & Legal Sequence Hotfix metadata.
// F9T2b Exordium Expert Territorial Conversion & Relay Survival metadata.
// F9T2c2 Expert First-Turn Bootstrap & Forward Pivot Impact Hotfix metadata.
// F9T2c3a Expert Turn Ownership & Audit Unit Consistency Hotfix metadata.
// F9T2c4 Clear Occupation Commitment Hotfix metadata.
// F9T2d2 Clear Effective Damage Preview Hotfix metadata.
// F9T2d2a Varran Stationary Attack Ownership Hotfix metadata.
// F9T2d3 Commander Deployment Commitment metadata.
// F9V1a Tutorial Runtime 2.0 · Authoritative Interaction & Selector Drift Hotfix metadata.
// F9V2a Tutorial Challenge Framework & Unlock System metadata.
// F9V2b Tutorial Challenge I · Elimination metadata.
// F9V2c Tutorial Challenge II · Tenuta metadata.
// F9V2d Tutorial Challenge III · Breccia metadata.
// F9T2 validated-baseline candidate: logicBaseline: "C2-STABLE-1-F9T1-APK-M4c"
// F9T1 validated baseline: logicBaseline: "C2-STABLE-1-F9T0-APK-M4c"
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
  version: "C2-STABLE-1-F9V2d-APK-M4c",
  buildName: "Tutorial Challenge III · Breccia",
  buildDate: "2026-08-22",
  buildChannel: "starter2-tutorial-v2d",
  logicBaseline: "C2-STABLE-1-F9T2c4-APK-M4c",
  map: "Campo Starter · Diamond 4 · Claustro Clash · Narrow Path · Triple Battlefield · The Valley · Central hotspot · Plains 2G large · La Trappola",
  notes: "Candidata Starter 2.0 F9V2d costruita sulla F9V2c validata e con baseline logica F9T2c4. Preserva le Prove I · Eliminazione e II · Tenuta e rende giocabile la Prova III · Breccia dopo lo sblocco globale 5/5 dell’Accademia. Scenario su Campo Starter con Exordium umano contro Nexus Advanced: Varran e due unità leggere già in campo, mano iniziale deterministica di 5 carte e deck ridotto reale di 10 carte pescabili. Starter reserve e Missioni sono escluse; il recupero deck è disabilitato per mantenere finito il pool da 10. Il Nexus non usa carte né ENE e difende l’asse del QG con quattro unità iniziali. Obiettivo Challenge autorevole: una unità Exordium deve entrare sulla cella del QG Nexus; per questa Prova non è richiesto il prerequisito di controllo PS della vittoria QG ordinaria. HUD dedicato mostra Mano, Deck e stato del QG. Sconfitta se il giocatore resta senza unità combattenti o il match termina con una condizione incompatibile con l’obiettivo. Le Challenge restano tutorialMode e fuori da statistiche e storico competitivi. Le Challenge IV–V restano sbloccabili ma in preparazione. Nessuna modifica a carte, costi, deck ufficiali, mappe, Missioni, Advanced/Expert AI o bilanciamento generale. Preserva F9V1a/F9V2a/F9V2b/F9V2c, schema telemetrico F9Q3e1-2, contratto Expert F9T1-1, estensione F9T2d3-1 e Pool carte F9U2a. Android resta fuori scope Starter."
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
