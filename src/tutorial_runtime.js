"use strict";

// Arena Rubra – F9V3b Tutorial Runtime Hardening & Action Contract Closure.
// Basata sulla F9V3a validata: preserva l’intero percorso Tutorial/Challenge e
// l’Unified Result Modal, consolidando gate semantico pre-mutation e selector fallback.
// Motore data-driven con spotlight, vignette, input controllato, setup deterministico,
// comandi di scenario, eventi di completamento e checkpoint con ripristino dello stato.

const TUTORIAL_RUNTIME_STORAGE_KEY = "arenaRubra.tutorial.v1";
const TUTORIAL_RUNTIME_SCHEMA = 1;
const TUTORIAL_STEP_MODES = Object.freeze({
  INFORMATIVE:"informative",
  GUIDED:"guided",
  LOCKED:"locked"
});

// F9V3b — Tutorial Runtime Hardening / Action Contract Closure.
// Il contratto semantico separa l'intenzione didattica dai selettori DOM e
// classifica l'azione PRIMA di entrare nei mutatori del core. I selettori
// storici restano validi, ma hanno fallback semantici per evitare selector drift.
const TUTORIAL_ACTION_CONTRACT_F9V3B = Object.freeze({
  schemaVersion:"F9V3b-1",
  selectorTargets:Object.freeze({
    hand_collapse:Object.freeze([
      "#mapHandOverlay .mapHandCollapseBtn",
      "#mapHandCollapseBtn",
      "[data-map-hand-action=\"collapse\"]"
    ]),
    hand_show:Object.freeze([
      "#mapActionDock .mapLeftHandBtn",
      "#mapActionDock .mapHandShowBtn",
      "#mapLeftHandBtn",
      "[data-map-hand-action=\"show\"]"
    ]),
    end_turn:Object.freeze([
      ".mapLeftEndTurnBtn",
      "#endTurnBtn",
      "[data-game-action=\"end-turn\"]",
      "[data-action=\"end-turn\"]"
    ]),
    ability_toggle:Object.freeze([
      "#selectedUnitPrimaryAbilitySlot [data-unit-action=\"ability\"]",
      "[data-unit-action=\"ability\"]",
      "#abilityBtn"
    ]),
    hand_cards:Object.freeze([
      "#mapHandOverlay .mapHandOverlayCards",
      "#mapHandOverlay [data-preview-card-uid]",
      "[data-preview-card-uid]"
    ]),
    opponent_score:Object.freeze([
      "#p2Score",
      "[data-player-score=\"2\"]"
    ])
  }),
  guardedEntrypoints:Object.freeze([
    "handleCellClick",
    "endTurn",
    "beginStarterCardPurchase",
    "beginHandCardPlay",
    "toggleAbilityMode",
    "toggleBuildMode",
    "passUnit"
  ]),
  semanticActions:Object.freeze([
    "unit_select", "move", "attack", "ability_toggle", "ability_target",
    "tactic_target", "deploy", "build", "card_selected", "end_turn",
    "hand_collapse", "hand_show", "pass_unit", "build_toggle",
    "unit_click", "cell_click"
  ])
});

let tutorialActionContractBypassDepthF9V3b = 0;
const tutorialActionContractStateF9V3b = {
  installCount:0,
  wrapped:new Set(),
  missing:new Set(),
  lastInstallAt:null
};

let tutorialRuntimeMemoryStore = { schemaVersion:TUTORIAL_RUNTIME_SCHEMA, scenarios:{}, lessons:{}, challenges:{}, updatedAt:null };

let tutorialChallengeRuntimeState = {
  active:false,
  challenge:null,
  challengeId:"",
  scenario:null,
  startedAt:null,
  lastResult:null,
  meta:null,
  timers:new Set(),
  completing:false
};

let tutorialRuntimeState = {
  active:false,
  scenario:null,
  scenarioId:"",
  stepIndex:0,
  step:null,
  target:null,
  allowedTargets:[],
  attentionTargets:[],
  previewPortals:[],
  spotlightDom:null,
  retryTimer:null,
  updateFrame:null,
  hintTimer:null,
  focusTimer:null,
  timers:new Set(),
  sessionToken:0,
  stepToken:0,
  preparingStep:false,
  targetRecoveryCount:0,
  closing:false,
  botPaused:false,
  lastAction:null
};


// =====================================================
// F9V3a — Unified Result Modal
// UI-only: presenta gli esiti terminali senza alterare regole, eventi VICTORY,
// statistiche, telemetria o progressione Tutorial/Challenge.
// =====================================================

const ARENA_RESULT_MODAL_REASON_LABELS_F9V3A = Object.freeze({
  qg:"Occupazione del QG nemico",
  pressione:"Pressione Strategica",
  eliminazione:"Ultimo giocatore attivo",
  concessione:"Concessione",
  resa_tecnica:"Resa tecnica",
  spareggio:"Spareggio al limite round",
  pareggio:"Pareggio tecnico",
  all_enemy_units_destroyed:"Forze avversarie eliminate",
  central_ps_held_three_turns:"PS centrale mantenuto per tre turni",
  enemy_hq_occupied:"QG nemico occupato",
  pressure_victory:"Vittoria per Pressione Strategica",
  match_victory:"Match vinto",
  all_player_units_destroyed:"Forze del giocatore eliminate",
  enemy_victory:"Vittoria avversaria",
  match_draw:"Pareggio",
  wrong_victory_condition:"Condizione richiesta non soddisfatta",
  wave_spawn_failed:"Errore nello scenario"
});

let arenaResultModalStateF9V3a = {
  open:false,
  payload:null,
  dom:null,
  previousFocus:null
};

function arenaResultModalEscapeF9V3a(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));
}

function arenaResultModalReasonLabelF9V3a(reason) {
  const key = String(reason || "").trim();
  if (!key) return "Partita conclusa";
  return ARENA_RESULT_MODAL_REASON_LABELS_F9V3A[key] || key.replace(/_/g, " ");
}

function arenaResultModalHumanSidesF9V3a() {
  if (typeof state === "undefined" || !state || !state.modes) return [];
  const ids = typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(state) : [1,2];
  return ids.filter(side => state.modes[side] === "human");
}

function arenaResultModalFactionColorF9V3a(side, faction) {
  try {
    if (Number(side) && typeof factionMetaBySide === "function") {
      const meta = factionMetaBySide(Number(side));
      if (meta && meta.color) return meta.color;
    }
    if (faction && typeof factionMeta === "function") {
      const meta = factionMeta(faction);
      if (meta && meta.color) return meta.color;
    }
  } catch (_) {}
  return "#c88b45";
}

function arenaResultModalEnsureStylesF9V3a() {
  if (typeof document === "undefined" || !document.head) return;
  if (document.getElementById("arenaResultModalStylesF9V3a")) return;
  const style = document.createElement("style");
  style.id = "arenaResultModalStylesF9V3a";
  style.textContent = `
    .arenaResultModalRootF9V3a{position:fixed;inset:0;z-index:1800;display:grid;place-items:center;padding:clamp(14px,3vw,36px);background:rgba(4,7,11,.74);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
    .arenaResultModalRootF9V3a[hidden]{display:none!important}
    .arenaResultModalCardF9V3a{--result-accent:#c88b45;width:min(720px,100%);max-height:calc(100% - 8px);overflow:auto;box-sizing:border-box;border:1px solid rgba(200,139,69,.52);border-top:4px solid var(--result-accent);border-radius:18px;background:linear-gradient(180deg,rgba(24,29,36,.98),rgba(10,13,18,.985));box-shadow:0 24px 70px rgba(0,0,0,.55);padding:clamp(20px,4vw,36px);color:#f4f6f8;text-align:center}
    .arenaResultModalEyebrowF9V3a{font-size:.74rem;letter-spacing:.2em;text-transform:uppercase;color:#b8c0ca;margin-bottom:8px}
    .arenaResultModalTitleF9V3a{margin:0;font-size:clamp(1.9rem,6vw,3.7rem);line-height:.98;letter-spacing:.035em;color:#fff;text-transform:uppercase}
    .arenaResultModalSubjectF9V3a{margin:18px auto 4px;font-size:clamp(1.15rem,3.4vw,1.65rem);font-weight:800;color:var(--result-accent)}
    .arenaResultModalFactionF9V3a{margin:0 auto 12px;font-size:.86rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#e7ebef}
    .arenaResultModalDetailF9V3a{margin:0 auto;max-width:58ch;color:#c9d0d8;line-height:1.5;font-size:.96rem}
    .arenaResultModalMetaF9V3a{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:16px 0 0}
    .arenaResultModalMetaF9V3a span{border:1px solid rgba(255,255,255,.13);border-radius:999px;padding:6px 10px;background:rgba(255,255,255,.045);font-size:.76rem;color:#d8dde3}
    .arenaResultModalDividerF9V3a{height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);margin:24px 0 18px}
    .arenaResultModalActionsF9V3a{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
    .arenaResultModalActionsF9V3a + .arenaResultModalActionsF9V3a{margin-top:10px}
    .arenaResultModalBtnF9V3a{min-height:46px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:#242a32;color:#f6f7f9;font:inherit;font-weight:750;padding:10px 12px;cursor:pointer}
    .arenaResultModalBtnF9V3a:hover{background:#303842;border-color:rgba(255,255,255,.28)}
    .arenaResultModalBtnF9V3a:focus-visible{outline:3px solid var(--result-accent);outline-offset:2px}
    .arenaResultModalBtnF9V3a[data-primary="true"]{background:var(--result-accent);border-color:var(--result-accent);color:#101317}
    .arenaResultModalBtnF9V3a[data-primary="true"]:hover{filter:brightness(1.08)}
    @media(max-width:620px){.arenaResultModalRootF9V3a{padding:10px}.arenaResultModalCardF9V3a{border-radius:13px;padding:20px 14px}.arenaResultModalActionsF9V3a{grid-template-columns:1fr}.arenaResultModalDividerF9V3a{margin:18px 0 14px}}
    @media(prefers-reduced-motion:no-preference){.arenaResultModalCardF9V3a{animation:arenaResultModalInF9V3a .18s ease-out both}@keyframes arenaResultModalInF9V3a{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}}
  `;
  document.head.appendChild(style);
}

function arenaResultModalEnsureDomF9V3a() {
  if (typeof document === "undefined") return null;
  if (arenaResultModalStateF9V3a.dom && arenaResultModalStateF9V3a.dom.root && arenaResultModalStateF9V3a.dom.root.isConnected) return arenaResultModalStateF9V3a.dom;
  arenaResultModalEnsureStylesF9V3a();
  const host = document.body || document.getElementById("gameScreen");
  if (!host) return null;
  let root = document.getElementById("arenaResultModalRootF9V3a");
  if (!root) {
    root = document.createElement("div");
    root.id = "arenaResultModalRootF9V3a";
    root.className = "arenaResultModalRootF9V3a";
    root.hidden = true;
    root.innerHTML = `
      <section class="arenaResultModalCardF9V3a" role="dialog" aria-modal="true" aria-labelledby="arenaResultModalTitleF9V3a" aria-describedby="arenaResultModalDetailF9V3a">
        <div class="arenaResultModalEyebrowF9V3a"></div>
        <h2 class="arenaResultModalTitleF9V3a" id="arenaResultModalTitleF9V3a"></h2>
        <div class="arenaResultModalSubjectF9V3a"></div>
        <div class="arenaResultModalFactionF9V3a"></div>
        <p class="arenaResultModalDetailF9V3a" id="arenaResultModalDetailF9V3a"></p>
        <div class="arenaResultModalMetaF9V3a"></div>
        <div class="arenaResultModalDividerF9V3a" aria-hidden="true"></div>
        <div class="arenaResultModalActionsF9V3a arenaResultModalAnalysisF9V3a">
          <button class="arenaResultModalBtnF9V3a" type="button" data-result-action="log">Log</button>
          <button class="arenaResultModalBtnF9V3a" type="button" data-result-action="telemetry">Telemetria</button>
          <button class="arenaResultModalBtnF9V3a" type="button" data-result-action="statistics">Statistiche</button>
        </div>
        <div class="arenaResultModalActionsF9V3a arenaResultModalNavigationF9V3a"></div>
      </section>`;
    host.appendChild(root);
  }
  const card = root.querySelector(".arenaResultModalCardF9V3a");
  const dom = {
    root, card,
    eyebrow:root.querySelector(".arenaResultModalEyebrowF9V3a"),
    title:root.querySelector(".arenaResultModalTitleF9V3a"),
    subject:root.querySelector(".arenaResultModalSubjectF9V3a"),
    faction:root.querySelector(".arenaResultModalFactionF9V3a"),
    detail:root.querySelector(".arenaResultModalDetailF9V3a"),
    meta:root.querySelector(".arenaResultModalMetaF9V3a"),
    navigation:root.querySelector(".arenaResultModalNavigationF9V3a")
  };
  if (!root.dataset.f9v3aBound) {
    root.dataset.f9v3aBound = "1";
    root.addEventListener("click", event => {
      const button = event.target && event.target.closest ? event.target.closest("[data-result-action]") : null;
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      arenaResultModalHandleActionF9V3a(button.dataset.resultAction || "");
    });
    root.addEventListener("keydown", event => {
      event.stopPropagation();
      if (event.key === "Escape") { event.preventDefault(); return; }
      if (event.key !== "Tab") return;
      const buttons = [...root.querySelectorAll("button:not([disabled])")].filter(button => !button.hidden);
      if (!buttons.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }
  arenaResultModalStateF9V3a.dom = dom;
  return dom;
}

function arenaResultModalHideF9V3a(options={}) {
  const dom = arenaResultModalEnsureDomF9V3a();
  if (dom && dom.root) dom.root.hidden = true;
  arenaResultModalStateF9V3a.open = false;
  if (typeof document !== "undefined" && document.body) document.body.classList.remove("arena-result-modal-open-f9v3a");
  if (options.restoreFocus !== false) {
    const previous = arenaResultModalStateF9V3a.previousFocus;
    if (previous && previous.isConnected && typeof previous.focus === "function") {
      try { previous.focus(); } catch (_) {}
    }
  }
  return true;
}

function arenaResultModalShowF9V3a(payload={}) {
  const dom = arenaResultModalEnsureDomF9V3a();
  if (!dom) return false;
  const safe = {
    kind:String(payload.kind || "match"),
    title:String(payload.title || "PARTITA CONCLUSA"),
    eyebrow:String(payload.eyebrow || "ARENA RUBRA"),
    subject:String(payload.subject || ""),
    faction:String(payload.faction || ""),
    detail:String(payload.detail || ""),
    round:Number.isFinite(Number(payload.round)) ? Number(payload.round) : null,
    winType:String(payload.winType || ""),
    side:Number(payload.side) || null,
    showAcademy:payload.showAcademy === true,
    primaryAction:String(payload.primaryAction || (payload.showAcademy ? "academy" : "new-game"))
  };
  arenaResultModalStateF9V3a.payload = safe;
  arenaResultModalStateF9V3a.previousFocus = typeof document !== "undefined" ? document.activeElement : null;
  dom.card.style.setProperty("--result-accent", arenaResultModalFactionColorF9V3a(safe.side, safe.faction));
  dom.eyebrow.textContent = safe.eyebrow;
  dom.title.textContent = safe.title;
  dom.subject.textContent = safe.subject;
  dom.subject.hidden = !safe.subject;
  dom.faction.textContent = safe.faction;
  dom.faction.hidden = !safe.faction;
  dom.detail.textContent = safe.detail;
  const chips = [];
  if (safe.round != null && safe.round > 0) chips.push(`Round ${safe.round}`);
  if (safe.winType) chips.push(arenaResultModalReasonLabelF9V3a(safe.winType));
  dom.meta.innerHTML = chips.map(text => `<span>${arenaResultModalEscapeF9V3a(text)}</span>`).join("");
  dom.meta.hidden = chips.length === 0;
  const nav = [];
  if (safe.showAcademy) nav.push({ action:"academy", label:"Torna all’Accademia" });
  nav.push({ action:"main-menu", label:"Menu principale" });
  nav.push({ action:"new-game", label:"Nuova partita" });
  dom.navigation.innerHTML = nav.map(item => `<button class="arenaResultModalBtnF9V3a" type="button" data-result-action="${item.action}"${safe.primaryAction === item.action ? ' data-primary="true"' : ""}>${arenaResultModalEscapeF9V3a(item.label)}</button>`).join("");
  dom.root.hidden = false;
  arenaResultModalStateF9V3a.open = true;
  if (typeof document !== "undefined" && document.body) document.body.classList.add("arena-result-modal-open-f9v3a");
  const primary = dom.root.querySelector('[data-primary="true"]') || dom.root.querySelector("button");
  if (primary && typeof primary.focus === "function") setTimeout(() => { try { primary.focus(); } catch (_) {} }, 0);
  return true;
}

function arenaResultModalOpenAnalysisF9V3a(kind) {
  arenaResultModalHideF9V3a({ restoreFocus:false });
  if (kind === "log" && typeof openGamePanel === "function") {
    openGamePanel("log", { focusId:"log" });
    return true;
  }
  if (kind === "statistics" && typeof openGamePanel === "function") {
    openGamePanel("stats", { focusId:"matchupStatsPanel" });
    return true;
  }
  if (kind === "telemetry" && typeof controlCenterOpenPanel === "function") {
    controlCenterOpenPanel("telemetry");
    return true;
  }
  return false;
}

function arenaResultModalHandleActionF9V3a(action) {
  const key = String(action || "");
  if (key === "log" || key === "statistics" || key === "telemetry") return arenaResultModalOpenAnalysisF9V3a(key);
  arenaResultModalHideF9V3a({ restoreFocus:false });
  if (key === "academy") {
    if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.TUTORIAL);
    if (typeof tutorialRuntimeRenderMenu === "function") tutorialRuntimeRenderMenu();
    return true;
  }
  if (key === "main-menu") {
    if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.MAIN_MENU);
    return true;
  }
  if (key === "new-game") {
    if (typeof openNewGameSetupScreen === "function") openNewGameSetupScreen();
    else if (typeof startNewGameFromAppMenu === "function") startNewGameFromAppMenu();
    else if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.SETUP);
    return true;
  }
  return false;
}

function arenaResultModalShowMatchVictoryF9V3a(event) {
  const data = event && event.data ? event.data : {};
  const winner = Number(data.winner) || null;
  const round = typeof state !== "undefined" && state ? Number(state.turn) || null : Number(data.round) || null;
  if (!winner) {
    return arenaResultModalShowF9V3a({
      kind:"draw", eyebrow:"MATCH CONCLUSO", title:"PAREGGIO", subject:"Nessun vincitore", detail:data.message || "La partita si conclude senza un vincitore.", round, winType:data.winType || "pareggio", primaryAction:"new-game"
    });
  }
  const faction = data.winnerFaction || (typeof state !== "undefined" && state && state.factions ? state.factions[winner] : "") || "";
  const humanSides = arenaResultModalHumanSidesF9V3a();
  const localDefeat = humanSides.length === 1 && humanSides[0] !== winner;
  const winnerName = `Giocatore ${winner}`;
  const detail = data.message || `Vittoria di ${winnerName}${faction ? ` (${faction})` : ""}.`;
  return arenaResultModalShowF9V3a({
    kind:localDefeat ? "defeat" : "victory",
    eyebrow:"MATCH CONCLUSO",
    title:localDefeat ? "SCONFITTA" : "VITTORIA",
    subject:`Vincitore · ${winnerName}`,
    faction,
    detail,
    round,
    winType:data.winType || "",
    side:winner,
    primaryAction:"new-game"
  });
}

function arenaResultModalShowLessonCompleteF9V3a(title) {
  return arenaResultModalShowF9V3a({
    kind:"lesson_complete", eyebrow:"ACCADEMIA", title:"LEZIONE COMPLETATA", subject:String(title || "Lezione guidata"), detail:"Progressi salvati. Puoi tornare all’Accademia, consultare i dati della sessione oppure avviare una nuova partita.", showAcademy:true, primaryAction:"academy"
  });
}

function arenaResultModalShowChallengeResultF9V3a(challenge, success, reason) {
  const title = challenge && challenge.title ? challenge.title : "Prova sul campo";
  return arenaResultModalShowF9V3a({
    kind:success ? "challenge_complete" : "challenge_failed",
    eyebrow:"PROVA SUL CAMPO",
    title:success ? "PROVA COMPLETATA" : "PROVA FALLITA",
    subject:title,
    detail:success ? "Obiettivo raggiunto. Il risultato è stato salvato nell’Accademia." : `La prova è terminata: ${arenaResultModalReasonLabelF9V3a(reason)}.`,
    winType:reason || "",
    round:typeof state !== "undefined" && state ? Number(state.turn) || null : null,
    showAcademy:true,
    primaryAction:"academy"
  });
}

function tutorialRuntimeStorageClone(value) {
  try { return JSON.parse(JSON.stringify(value)); }
  catch (_) { return { schemaVersion:TUTORIAL_RUNTIME_SCHEMA, scenarios:{}, lessons:{}, challenges:{}, updatedAt:null }; }
}

function tutorialRuntimeNormalizeStore(value) {
  const safe = value && typeof value === "object" ? tutorialRuntimeStorageClone(value) : {};
  safe.schemaVersion = TUTORIAL_RUNTIME_SCHEMA;
  if (!safe.scenarios || typeof safe.scenarios !== "object") safe.scenarios = {};
  if (!safe.lessons || typeof safe.lessons !== "object") safe.lessons = {};
  if (!safe.challenges || typeof safe.challenges !== "object") safe.challenges = {};
  if (!Object.prototype.hasOwnProperty.call(safe, "updatedAt")) safe.updatedAt = null;
  return safe;
}

function tutorialRuntimeStorageRead() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TUTORIAL_RUNTIME_STORAGE_KEY) || "null");
    if (!parsed || parsed.schemaVersion !== TUTORIAL_RUNTIME_SCHEMA) throw new Error("schema");
    const normalized = tutorialRuntimeNormalizeStore(parsed);
    tutorialRuntimeMemoryStore = tutorialRuntimeStorageClone(normalized);
    return normalized;
  } catch (_) {
    return tutorialRuntimeNormalizeStore(tutorialRuntimeMemoryStore);
  }
}

function tutorialRuntimeStorageWrite(payload) {
  const safe = tutorialRuntimeNormalizeStore(payload && typeof payload === "object" ? payload : tutorialRuntimeStorageRead());
  safe.updatedAt = new Date().toISOString();
  tutorialRuntimeMemoryStore = tutorialRuntimeStorageClone(safe);
  try { localStorage.setItem(TUTORIAL_RUNTIME_STORAGE_KEY, JSON.stringify(safe)); }
  catch (_) { /* fallback memoria per contesti senza localStorage */ }
  return tutorialRuntimeStorageClone(safe);
}

function tutorialRuntimeScenarioById(id) {
  if (!id || typeof TUTORIAL_SCENARIOS_F9O6 === "undefined") return null;
  return TUTORIAL_SCENARIOS_F9O6[String(id)] || null;
}

function tutorialRuntimeProgressForScenario(id) {
  const store = tutorialRuntimeStorageRead();
  return store.scenarios && store.scenarios[id] ? { ...store.scenarios[id] } : null;
}

function tutorialRuntimeLessonPlan() {
  return typeof TUTORIAL_LESSON_PLAN_F9O6 !== "undefined" && Array.isArray(TUTORIAL_LESSON_PLAN_F9O6)
    ? TUTORIAL_LESSON_PLAN_F9O6
    : [];
}

function tutorialRuntimeChallengePlan() {
  return typeof TUTORIAL_CHALLENGE_PLAN_F9V2A !== "undefined" && Array.isArray(TUTORIAL_CHALLENGE_PLAN_F9V2A)
    ? TUTORIAL_CHALLENGE_PLAN_F9V2A
    : [];
}

function tutorialRuntimeChallengeById(id) {
  return tutorialRuntimeChallengePlan().find(item => item && item.id === String(id || "")) || null;
}

function tutorialRuntimeChallengeScenarioById(id) {
  if (!id || typeof TUTORIAL_CHALLENGE_SCENARIOS_F9V2 === "undefined" || !TUTORIAL_CHALLENGE_SCENARIOS_F9V2) return null;
  return TUTORIAL_CHALLENGE_SCENARIOS_F9V2[String(id)] || null;
}

function tutorialRuntimeCompletedLessonCount(store=tutorialRuntimeStorageRead()) {
  return tutorialRuntimeLessonPlan().filter(item => item && store.lessons && store.lessons[item.id] && store.lessons[item.id].completed).length;
}

function tutorialRuntimeChallengesUnlocked(store=tutorialRuntimeStorageRead()) {
  const plan = tutorialRuntimeLessonPlan();
  return plan.length > 0 && tutorialRuntimeCompletedLessonCount(store) === plan.length;
}

function tutorialRuntimeChallengeUnlockStatus(store=tutorialRuntimeStorageRead()) {
  const required = tutorialRuntimeLessonPlan().length;
  const completed = tutorialRuntimeCompletedLessonCount(store);
  return {
    unlocked:required > 0 && completed === required,
    completedLessons:completed,
    requiredLessons:required,
    remainingLessons:Math.max(0, required - completed)
  };
}

function tutorialRuntimeProgressForChallenge(id) {
  const store = tutorialRuntimeStorageRead();
  return store.challenges && store.challenges[id] ? { ...store.challenges[id] } : null;
}

function tutorialRuntimeSaveChallengeProgress(id, options={}) {
  const challenge = tutorialRuntimeChallengeById(id);
  if (!challenge) return null;
  const store = tutorialRuntimeStorageRead();
  const previous = store.challenges[challenge.id] || {};
  store.challenges[challenge.id] = {
    ...previous,
    challengeId:challenge.id,
    attempts:Math.max(0, Number(previous.attempts) || 0) + (options.incrementAttempt === true ? 1 : 0),
    completed:options.completed === true || previous.completed === true,
    lastOutcome:options.outcome || previous.lastOutcome || null,
    lastReason:options.reason || previous.lastReason || null,
    updatedAt:new Date().toISOString()
  };
  return tutorialRuntimeStorageWrite(store).challenges[challenge.id];
}

function tutorialRuntimeGameSnapshot() {
  if (!state) return null;
  const clone = value => tutorialRuntimeStorageClone(value);
  return {
    currentPlayer:state.currentPlayer,
    turn:state.turn,
    orderIndex:state.orderIndex,
    turnOrder:clone(state.turnOrder || []),
    energy:clone(state.energy || {}),
    units:clone(state.units || []),
    hand:clone(state.hand || {}),
    deck:clone(state.deck || {}),
    discard:clone(state.discard || {}),
    starterCards:clone(state.starterCards || {}),
    tacticUsedThisTurn:clone(state.tacticUsedThisTurn || {}),
    tacticCooldowns:clone(state.tacticCooldowns || {}),
    turnsStarted:clone(state.turnsStarted || {}),
    pressure:clone(state.pressure || {}),
    instanceCounters:clone(state.instanceCounters || {}),
    playerEffects:clone(state.playerEffects || {}),
    tutorialBotPaused:true
  };
}

function tutorialRuntimeRestoreGameSnapshot(snapshot) {
  if (!state || !snapshot || typeof snapshot !== "object") return false;
  for (const key of ["currentPlayer","turn","orderIndex","turnOrder","energy","units","hand","deck","discard","starterCards","tacticUsedThisTurn","tacticCooldowns","turnsStarted","pressure","instanceCounters","playerEffects"]) {
    if (Object.prototype.hasOwnProperty.call(snapshot, key)) state[key] = tutorialRuntimeStorageClone(snapshot[key]);
  }
  state.tutorialMode = true;
  state.tutorialScenarioId = tutorialRuntimeState.scenarioId;
  state.tutorialLessonId = tutorialRuntimeState.scenario && tutorialRuntimeState.scenario.lessonId || null;
  state.tutorialBotPaused = true;
  state.matchRecorded = false;
  if (typeof syncCardDebugState === "function") syncCardDebugState();
  if (typeof resetInteractionContext === "function") resetInteractionContext();
  if (typeof updateControlFromOccupants === "function") updateControlFromOccupants();
  if (typeof renderAll === "function") renderAll();
  return true;
}

function tutorialRuntimeSaveProgress(options={}) {
  if (!tutorialRuntimeState.scenarioId) return null;
  const store = tutorialRuntimeStorageRead();
  store.scenarios = store.scenarios || {};
  store.lessons = store.lessons || {};
  const previous = store.scenarios[tutorialRuntimeState.scenarioId] || {};
  const nextIndex = Number.isFinite(options.nextStepIndex) ? options.nextStepIndex : tutorialRuntimeState.stepIndex;
  const snapshot = options.includeSnapshot === true ? tutorialRuntimeGameSnapshot() : (previous.snapshot || null);
  store.scenarios[tutorialRuntimeState.scenarioId] = {
    ...previous,
    scenarioId:tutorialRuntimeState.scenarioId,
    nextStepIndex:Math.max(0, nextIndex),
    completed:options.completed === true || previous.completed === true,
    lastStepId:tutorialRuntimeState.step && tutorialRuntimeState.step.id || previous.lastStepId || null,
    snapshot,
    updatedAt:new Date().toISOString()
  };
  const lessonId = tutorialRuntimeState.scenario && tutorialRuntimeState.scenario.lessonId;
  if (lessonId) {
    const priorLesson = store.lessons[lessonId] || {};
    store.lessons[lessonId] = {
      ...priorLesson,
      completed:options.completed === true || priorLesson.completed === true,
      scenarioId:tutorialRuntimeState.scenarioId,
      updatedAt:new Date().toISOString()
    };
  }
  return tutorialRuntimeStorageWrite(store);
}

function tutorialRuntimeResetProgress() {
  tutorialRuntimeMemoryStore = { schemaVersion:TUTORIAL_RUNTIME_SCHEMA, scenarios:{}, lessons:{}, challenges:{}, updatedAt:null };
  try { localStorage.removeItem(TUTORIAL_RUNTIME_STORAGE_KEY); }
  catch (_) { /* no-op */ }
  tutorialRuntimeRenderMenu();
  tutorialRuntimeSetStatus("Progressi tutorial azzerati.");
  return true;
}

function tutorialRuntimeSetStatus(text) {
  if (typeof document === "undefined") return;
  const el = document.getElementById("tutorialRuntimeStatus");
  if (el) el.textContent = String(text || "");
}

function tutorialRuntimeEnsureChallengeSection() {
  if (typeof document === "undefined") return null;
  const lessonGrid = document.getElementById("tutorialLessonGrid");
  if (!lessonGrid || !lessonGrid.parentNode) return null;
  let section = document.getElementById("tutorialChallengeSection");
  if (!section) {
    section = document.createElement("section");
    section.id = "tutorialChallengeSection";
    section.className = "tutorialChallengeSection";
    section.setAttribute("aria-label", "Prove sul campo");
    section.innerHTML = `
      <div class="mainMenuSectionHeading tutorialChallengeHeading">
        <span class="mainMenuSectionEyebrow">Dopo l'Accademia</span>
        <h3>Prove sul campo</h3>
        <p>Le cinque Challenge verificano in autonomia ciò che hai appreso. Sono visibili da subito e si sbloccano tutte insieme dopo aver completato le 5 lezioni guidate.</p>
      </div>
      <div id="tutorialChallengeGate" class="tutorialRuntimeStatus" aria-live="polite"></div>
      <div id="tutorialChallengeGrid" class="tutorialLessonGrid"></div>`;
    lessonGrid.insertAdjacentElement("afterend", section);
  }
  return section;
}

function tutorialRuntimeRenderChallenges(store=tutorialRuntimeStorageRead()) {
  if (typeof document === "undefined") return false;
  const section = tutorialRuntimeEnsureChallengeSection();
  const grid = section && section.querySelector ? section.querySelector("#tutorialChallengeGrid") : null;
  const gate = section && section.querySelector ? section.querySelector("#tutorialChallengeGate") : null;
  if (!section || !grid || !gate) return false;

  const unlock = tutorialRuntimeChallengeUnlockStatus(store);
  const plan = tutorialRuntimeChallengePlan();
  gate.textContent = unlock.unlocked
    ? `Accademia completata ${unlock.completedLessons}/${unlock.requiredLessons} · ${plan.length} Prove sul campo sbloccate.`
    : `Accademia ${unlock.completedLessons}/${unlock.requiredLessons} · Prove bloccate: completa tutte le ${unlock.requiredLessons} lezioni guidate per sbloccarle.`;

  grid.innerHTML = plan.map(challenge => {
    const progress = store.challenges && store.challenges[challenge.id] || null;
    const completed = Boolean(progress && progress.completed);
    const scenarioReady = Boolean(challenge.scenarioId && tutorialRuntimeChallengeScenarioById(challenge.scenarioId));
    const unlocked = unlock.unlocked;
    const playable = unlocked && scenarioReady;
    const status = completed ? "Completata" : (!unlocked ? "Bloccata" : (scenarioReady ? "Disponibile" : "Sbloccata · in preparazione"));
    const cardClass = unlocked ? " isAvailable" : " isLocked";
    const unlockText = unlocked
      ? "Sbloccata: Accademia completata."
      : `Sblocco: completa tutte le ${unlock.requiredLessons} lezioni dell'Accademia (${unlock.completedLessons}/${unlock.requiredLessons}).`;
    const actionLabel = !unlocked ? "Bloccata" : (scenarioReady ? (completed ? "Ripeti" : "Avvia") : "In preparazione");
    const action = `<div class="tutorialLessonCardActions"><button class="${playable && !completed ? "primary" : "ghost"}" type="button" data-tutorial-challenge-start="${tutorialRuntimeEscape(challenge.id)}"${playable ? "" : " disabled"}>${tutorialRuntimeEscape(actionLabel)}</button></div>`;
    return `<article class="tutorialLessonCard tutorialChallengeCard${cardClass}" data-tutorial-challenge="${tutorialRuntimeEscape(challenge.id)}" data-challenge-unlocked="${unlocked ? "true" : "false"}">
      <h3>${challenge.order}. ${tutorialRuntimeEscape(challenge.subtitle || "Prova sul campo")}</h3>
      <strong>${tutorialRuntimeEscape(challenge.title)}</strong>
      <p>${tutorialRuntimeEscape(challenge.summary)}</p>
      <div class="tutorialLessonMeta"><span>${tutorialRuntimeEscape(status)}</span><span>${tutorialRuntimeEscape(challenge.progression)}</span></div>
      <p class="help"><strong>Obiettivo:</strong> ${tutorialRuntimeEscape(challenge.objective)}<br>${tutorialRuntimeEscape(unlockText)}</p>
      ${action}
    </article>`;
  }).join("");

  if (grid.dataset.bound !== "1") {
    grid.dataset.bound = "1";
    grid.addEventListener("click", event => {
      const button = event.target && event.target.closest ? event.target.closest("[data-tutorial-challenge-start]") : null;
      if (!button || button.disabled) return;
      tutorialRuntimeStartChallenge(button.dataset.tutorialChallengeStart);
    });
  }
  return true;
}

function tutorialRuntimeRenderMenu() {
  if (typeof document === "undefined") return false;
  const grid = document.getElementById("tutorialLessonGrid");
  if (!grid) return false;
  const store = tutorialRuntimeStorageRead();
  const plan = tutorialRuntimeLessonPlan();
  grid.innerHTML = plan.map(lesson => {
    const progress = store.lessons && store.lessons[lesson.id] || null;
    const scenarioProgress = lesson.scenarioId && store.scenarios && store.scenarios[lesson.scenarioId] || null;
    const available = Boolean(lesson.scenarioId && tutorialRuntimeScenarioById(lesson.scenarioId));
    const completed = Boolean(progress && progress.completed);
    const canResume = Boolean(available && scenarioProgress && !scenarioProgress.completed && scenarioProgress.snapshot && Number.isFinite(scenarioProgress.nextStepIndex) && scenarioProgress.nextStepIndex > 0);
    const status = completed ? "Completata" : (available ? "Disponibile" : "Bloccata");
    const actions = available
      ? `<div class="tutorialLessonCardActions"><button class="${completed ? "ghost" : "primary"}" type="button" data-tutorial-start="${tutorialRuntimeEscape(lesson.scenarioId)}">${completed ? "Ripeti" : "Avvia"}</button><button class="ghost" type="button" data-tutorial-resume="${tutorialRuntimeEscape(lesson.scenarioId)}"${canResume ? "" : " disabled"}>Riprendi</button></div>`
      : "";
    return `<article class="tutorialLessonCard${available ? " isAvailable" : " isLocked"}" data-tutorial-lesson="${String(lesson.id)}">
      <h3>${lesson.order}. ${tutorialRuntimeEscape(lesson.narratorFaction)}</h3>
      <strong>${tutorialRuntimeEscape(lesson.title)}</strong>
      <p>${tutorialRuntimeEscape(lesson.summary)}</p>
      <div class="tutorialLessonMeta"><span>${tutorialRuntimeEscape(status)}</span><span>Rapida</span><span>Tattica</span></div>${actions}
    </article>`;
  }).join("");

  if (grid.dataset.bound !== "1") {
    grid.dataset.bound = "1";
    grid.addEventListener("click", event => {
      const startButton = event.target && event.target.closest ? event.target.closest("[data-tutorial-start]") : null;
      if (startButton) {
        tutorialRuntimeStartScenario(startButton.dataset.tutorialStart, { resume:false });
        return;
      }
      const resumeButton = event.target && event.target.closest ? event.target.closest("[data-tutorial-resume]") : null;
      if (resumeButton && !resumeButton.disabled) tutorialRuntimeStartScenario(resumeButton.dataset.tutorialResume, { resume:true });
    });
  }

  const scenarioId = "lesson-1-exordium";
  const lesson = tutorialRuntimeScenarioById(scenarioId);
  const progress = tutorialRuntimeProgressForScenario(scenarioId);
  const startBtn = document.getElementById("tutorialRuntimeDemoBtn");
  const resumeBtn = document.getElementById("tutorialResumeBtn");
  const resetBtn = document.getElementById("tutorialResetProgressBtn");
  if (startBtn) {
    startBtn.textContent = progress && progress.completed ? "Ripeti Lezione 1" : "Avvia Lezione 1";
    if (startBtn.dataset.bound !== "1") {
      startBtn.dataset.bound = "1";
      startBtn.addEventListener("click", () => tutorialRuntimeStartScenario(lesson && lesson.id || scenarioId, { resume:false }));
    }
  }
  if (resumeBtn) {
    const canResume = Boolean(progress && !progress.completed && progress.snapshot && Number.isFinite(progress.nextStepIndex) && progress.nextStepIndex > 0);
    resumeBtn.disabled = !canResume;
    resumeBtn.textContent = progress && progress.completed ? "Lezione 1 completata" : "Riprendi Lezione 1";
    if (resumeBtn.dataset.bound !== "1") {
      resumeBtn.dataset.bound = "1";
      resumeBtn.addEventListener("click", () => tutorialRuntimeStartScenario(scenarioId, { resume:true }));
    }
  }
  if (resetBtn && resetBtn.dataset.bound !== "1") {
    resetBtn.dataset.bound = "1";
    resetBtn.addEventListener("click", tutorialRuntimeResetProgress);
  }
  const availableCount = plan.filter(item => item && item.scenarioId && tutorialRuntimeScenarioById(item.scenarioId)).length;
  const completedCount = tutorialRuntimeCompletedLessonCount(store);
  tutorialRuntimeRenderChallenges(store);
  const unlock = tutorialRuntimeChallengeUnlockStatus(store);
  tutorialRuntimeSetStatus(`${availableCount} lezioni disponibili · ${completedCount} completate · Prove sul campo ${unlock.unlocked ? "sbloccate" : "bloccate"}.`);
  return true;
}



function tutorialRuntimeChallengeClearTimers() {
  for (const timerId of tutorialChallengeRuntimeState.timers || []) clearTimeout(timerId);
  if (tutorialChallengeRuntimeState.timers && typeof tutorialChallengeRuntimeState.timers.clear === "function") tutorialChallengeRuntimeState.timers.clear();
}

function tutorialRuntimeChallengeSchedule(callback, delay=0) {
  if (typeof callback !== "function") return null;
  const challengeId = tutorialChallengeRuntimeState.challengeId;
  const timerId = setTimeout(() => {
    if (tutorialChallengeRuntimeState.timers) tutorialChallengeRuntimeState.timers.delete(timerId);
    if (!tutorialChallengeRuntimeState.active || tutorialChallengeRuntimeState.challengeId !== challengeId) return;
    callback();
  }, Math.max(0, Number(delay) || 0));
  tutorialChallengeRuntimeState.timers.add(timerId);
  return timerId;
}

function tutorialRuntimeChallengeEnsureHud() {
  if (typeof document === "undefined") return null;
  let hud = document.getElementById("tutorialChallengeHud");
  if (hud && hud.isConnected) return hud;
  const strip = document.getElementById("gameHudStrip");
  if (!strip) return null;
  hud = document.createElement("span");
  hud.id = "tutorialChallengeHud";
  hud.className = "hudChip hudPrimary tutorialChallengeHud";
  hud.setAttribute("aria-live", "polite");
  strip.appendChild(hud);
  return hud;
}

function tutorialRuntimeChallengeRemoveHud() {
  if (typeof document === "undefined") return;
  const hud = document.getElementById("tutorialChallengeHud");
  if (hud) hud.remove();
}

function tutorialRuntimeChallengeRenderHud() {
  const hud = tutorialRuntimeChallengeEnsureHud();
  if (!hud) return false;
  const scenario = tutorialChallengeRuntimeState.scenario;
  const meta = tutorialChallengeRuntimeState.meta || {};
  const objective = scenario && scenario.objective || {};
  if (objective.kind === "hold_ps") {
    const target = Math.max(1, Number(objective.consecutiveTurns || objective.target) || 3);
    const held = Math.max(0, Number(meta.holdCount) || 0);
    const spawned = Math.max(0, Number(meta.enemiesSpawned) || 0);
    const totalThreat = Math.max(spawned, Array.isArray(scenario && scenario.waves) ? scenario.waves.reduce((sum,w)=>sum + ((w && w.units && w.units.length) || 0), 0) : 6);
    hud.textContent = `PROVA II · Tenuta ${held}/${target} · Minaccia ${spawned}/${totalThreat}`;
    hud.title = objective.label || "Mantieni il PS centrale.";
    return true;
  }
  if (objective.kind === "occupy_enemy_hq") {
    const playerSide = Number(scenario && scenario.playerSide || 1);
    const handSize = state && state.hand && Array.isArray(state.hand[playerSide]) ? state.hand[playerSide].length : 0;
    const deckSize = state && state.deck && Array.isArray(state.deck[playerSide]) ? state.deck[playerSide].length : 0;
    const status = meta.hqOccupied ? "QG OCCUPATO" : "QG da occupare";
    hud.textContent = `PROVA III · Breccia · Mano ${handSize} · Deck ${deckSize} · ${status}`;
    hud.title = objective.label || "Occupa il QG nemico.";
    return true;
  }
  if (objective.kind === "win_by_pressure") {
    const playerSide = Number(scenario && scenario.playerSide || 1);
    const handSize = state && state.hand && Array.isArray(state.hand[playerSide]) ? state.hand[playerSide].length : 0;
    const deckSize = state && state.deck && Array.isArray(state.deck[playerSide]) ? state.deck[playerSide].length : 0;
    const target = Math.max(1, Number(meta.pressureTarget || objective.target) || 5);
    const current = Math.max(0, Number(state && state.pressure && state.pressure[playerSide] != null ? state.pressure[playerSide] : meta.pressureValue) || 0);
    const controlledPs = typeof countControlledPS === "function" ? countControlledPS(playerSide) : null;
    const centralControl = typeof tutorialRuntimeChallengeCentralPsControl === "function" ? tutorialRuntimeChallengeCentralPsControl({ objective:{ coord:objective.centralCoord || [0,0,0] } }) : 0;
    const qualification = controlledPs == null ? "" : ` · PS ${controlledPs}/${Math.max(1, Number(objective.totalPs) || 3)}${centralControl === playerSide ? "★" : ""}`;
    hud.textContent = `PROVA IV · Pressione ${current}/${target}${qualification} · Mano ${handSize} · Deck ${deckSize}`;
    hud.title = objective.label || "Vinci per Pressione.";
    return true;
  }
  if (objective.kind === "win_match") {
    const playerSide = Number(scenario && scenario.playerSide || 1);
    const handSize = state && state.hand && Array.isArray(state.hand[playerSide]) ? state.hand[playerSide].length : 0;
    const deckSize = state && state.deck && Array.isArray(state.deck[playerSide]) ? state.deck[playerSide].length : 0;
    const energy = Math.max(0, Number(state && state.energy && state.energy[playerSide]) || 0);
    const pressure = Math.max(0, Number(state && state.pressure && state.pressure[playerSide]) || 0);
    const pressureTarget = typeof pressureWinLimit === "function" ? pressureWinLimit() : 5;
    hud.textContent = `PROVA V · Esame finale · Mano ${handSize} · Deck ${deckSize} · ENE ${energy} · Pressione ${pressure}/${pressureTarget}`;
    hud.title = objective.label || "Vinci il match.";
    return true;
  }
  const target = Math.max(0, Number(objective.target) || 0);
  const destroyed = Math.max(0, Number(meta.enemyDestroyed) || 0);
  const waves = Array.isArray(scenario && scenario.waves) ? scenario.waves.length : 0;
  const wave = Math.max(1, Number(meta.waveIndex) + 1 || 1);
  hud.textContent = `PROVA I · Eliminazione ${destroyed}/${target} · Ondata ${Math.min(wave, Math.max(1,waves))}/${Math.max(1,waves)}`;
  hud.title = objective.label || "Elimina tutte le unità nemiche.";
  return true;
}

function tutorialRuntimeChallengeAnnounce(title, message, options={}) {
  if (typeof eventOverlayEnqueue === "function") {
    eventOverlayEnqueue({
      title:String(title || "PROVA SUL CAMPO"),
      message:String(message || ""),
      icon:options.icon || "◆",
      priority:options.priority || "high",
      durationMs:Number(options.durationMs) || 1500,
      key:`tutorial-challenge:${tutorialChallengeRuntimeState.challengeId}:${String(title || "event")}:${Date.now()}`
    });
  }
  if (typeof log === "function" && message) {
    const eventType = typeof EventTypes !== "undefined" ? EventTypes.LOG_MESSAGE : undefined;
    log(`${title}: ${message}`, eventType, { source:"F9V2f-tutorial-challenge", challengeId:tutorialChallengeRuntimeState.challengeId });
  }
}

function tutorialRuntimeChallengeResolveSpawnCoord(item) {
  if (!state || !item) return null;
  const preferred = Array.isArray(item.coord) ? [...item.coord] : null;
  const free = coord => Array.isArray(coord)
    && (typeof isInsideMap !== "function" || isInsideMap(coord))
    && (typeof getUnitAt !== "function" || !getUnitAt(coord));
  if (free(preferred)) return preferred;
  if (!preferred || !Array.isArray(state.cells)) return null;
  const candidates = state.cells
    .map(cell => cell && Array.isArray(cell.coord) ? [...cell.coord] : null)
    .filter(free)
    .sort((a,b) => {
      const da = typeof hexDistance === "function" ? hexDistance(a, preferred) : 0;
      const db = typeof hexDistance === "function" ? hexDistance(b, preferred) : 0;
      return da - db || a.join(",").localeCompare(b.join(","));
    });
  return candidates[0] || null;
}

function tutorialRuntimeChallengeSpawnTrackedUnit(item, kind, waveIndex=null) {
  if (!item) return null;
  const coord = tutorialRuntimeChallengeResolveSpawnCoord(item);
  if (!coord) return null;
  const unit = tutorialRuntimeSpawnUnit({ ...item, coord });
  if (!unit) return null;
  unit.tutorialChallengeUnit = true;
  unit.tutorialChallengeId = tutorialChallengeRuntimeState.challengeId;
  if (waveIndex != null) unit.tutorialChallengeWave = Number(waveIndex) + 1;
  const meta = tutorialChallengeRuntimeState.meta;
  if (meta) {
    if (kind === "player") meta.playerUnitIds.add(String(unit.uid));
    if (kind === "enemy") {
      meta.enemyUnitIds.add(String(unit.uid));
      const key = Number(waveIndex) || 0;
      if (!meta.waveUnitIds[key]) meta.waveUnitIds[key] = new Set();
      meta.waveUnitIds[key].add(String(unit.uid));
      meta.enemiesSpawned += 1;
    }
  }
  return unit;
}

function tutorialRuntimeChallengeStartWave(index) {
  const scenario = tutorialChallengeRuntimeState.scenario;
  const meta = tutorialChallengeRuntimeState.meta;
  const waves = scenario && Array.isArray(scenario.waves) ? scenario.waves : [];
  const wave = waves[index];
  if (!wave || !meta || meta.startedWaves.has(index)) return false;
  meta.startedWaves.add(index);
  meta.waveIndex = Math.max(meta.waveIndex, index);
  const spawned = (wave.units || []).map(item => tutorialRuntimeChallengeSpawnTrackedUnit(item, "enemy", index)).filter(Boolean);
  if (!spawned.length) {
    tutorialRuntimeChallengeSchedule(() => tutorialRuntimeCompleteChallenge({ success:false, outcome:"failure", reason:"wave_spawn_failed" }), 0);
    return false;
  }
  tutorialRuntimeChallengeRenderHud();
  tutorialRuntimeChallengeAnnounce(
    wave.label || `Ondata ${index + 1}`,
    wave.message || (index === 0 ? "Due unità nemiche entrano nell'area." : "Nuovi rinforzi nemici entrano nell'area."),
    { icon:String(index + 1), durationMs:1500 }
  );
  if (typeof renderAll === "function") renderAll();
  return true;
}

function tutorialRuntimeChallengeLivingTrackedUnits(ids) {
  if (!state || !Array.isArray(state.units) || !ids) return [];
  return state.units.filter(unit => unit && unit.alive && ids.has(String(unit.uid)));
}

function tutorialRuntimeChallengeLivingCombatUnits(side) {
  if (!state || !Array.isArray(state.units)) return [];
  return state.units.filter(unit => unit && unit.alive && unit.type !== "QG" && Number(unit.side) === Number(side));
}

function tutorialRuntimeChallengeCentralPsControl(scenario=tutorialChallengeRuntimeState.scenario) {
  const objective = scenario && scenario.objective || {};
  const coord = Array.isArray(objective.coord) ? objective.coord : [0,0,0];
  const cell = typeof getCellAt === "function" ? getCellAt(coord) : (state && Array.isArray(state.cells) ? state.cells.find(item => item && Array.isArray(item.coord) && item.coord.join(",") === coord.join(",")) : null);
  return cell ? Number(cell.control || 0) : 0;
}

function tutorialRuntimeChallengeEnemyHqCoord(scenario=tutorialChallengeRuntimeState.scenario) {
  if (!scenario || !state) return null;
  const objective = scenario.objective || {};
  const enemySide = Number(objective.targetSide || scenario.enemySide || 2);
  const hq = typeof getHq === "function" ? getHq(enemySide) : (Array.isArray(state.units) ? state.units.find(unit => unit && unit.type === "QG" && Number(unit.side) === enemySide) : null);
  return hq && Array.isArray(hq.pos) ? [...hq.pos] : null;
}

function tutorialRuntimeChallengeSameCoord(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (typeof sameCoord === "function") return sameCoord(a, b);
  return a.length === b.length && a.every((value,index) => Number(value) === Number(b[index]));
}

function tutorialRuntimeChallengeInitializeScenario() {
  const scenario = tutorialChallengeRuntimeState.scenario;
  if (!scenario || !state) return false;
  tutorialChallengeRuntimeState.meta = {
    waveIndex:-1,
    enemyDestroyed:0,
    enemiesSpawned:0,
    playerTurnsEnded:0,
    holdCount:0,
    hqOccupied:false,
    hqOccupantUid:null,
    targetHqCoord:null,
    pressureWon:false,
    pressureValue:0,
    pressureTarget:0,
    matchWon:false,
    finalWinType:null,
    playerUnitIds:new Set(),
    enemyUnitIds:new Set(),
    destroyedEnemyUnitIds:new Set(),
    startedWaves:new Set(),
    waveUnitIds:{}
  };
  const initial = Array.isArray(scenario.initialUnits) ? scenario.initialUnits : [];
  const players = initial.map(item => tutorialRuntimeChallengeSpawnTrackedUnit(item, "player")).filter(Boolean);
  const objectiveKind = scenario.objective && scenario.objective.kind;
  const fullMatch = Boolean(scenario.rules && scenario.rules.fullMatch === true);
  if (!players.length && !fullMatch && objectiveKind !== "win_match") return false;
  const waves = Array.isArray(scenario.waves) ? scenario.waves : [];
  if (waves.length && !tutorialRuntimeChallengeStartWave(0)) return false;
  if (scenario.objective && scenario.objective.kind === "occupy_enemy_hq") tutorialChallengeRuntimeState.meta.targetHqCoord = tutorialRuntimeChallengeEnemyHqCoord(scenario);
  if (scenario.objective && scenario.objective.kind === "win_by_pressure") {
    const playerSide = Number(scenario.playerSide || 1);
    tutorialChallengeRuntimeState.meta.pressureValue = Math.max(0, Number(state.pressure && state.pressure[playerSide]) || 0);
    tutorialChallengeRuntimeState.meta.pressureTarget = Math.max(1, Number(scenario.objective.target) || (typeof pressureWinLimit === "function" ? pressureWinLimit() : 5));
  }
  tutorialRuntimeChallengeRenderHud();
  const intro = scenario.intro || {};
  tutorialRuntimeChallengeAnnounce(
    intro.title || (objectiveKind === "hold_ps"
      ? "PROVA SUL CAMPO II · TENUTA"
      : objectiveKind === "occupy_enemy_hq"
        ? "PROVA SUL CAMPO III · BRECCIA"
        : objectiveKind === "win_by_pressure"
          ? "PROVA SUL CAMPO IV · PRESSIONE"
          : objectiveKind === "win_match"
            ? "PROVA SUL CAMPO V · ESAME FINALE"
            : "PROVA SUL CAMPO I · ELIMINAZIONE"),
    intro.message || (objectiveKind === "hold_ps"
      ? "Conquista il PS centrale e mantienilo per 3 tuoi turni consecutivi."
      : objectiveKind === "occupy_enemy_hq"
        ? "Apri una via e porta una tua unità sulla cella del QG nemico."
        : objectiveKind === "win_by_pressure"
          ? "Mantieni il PS centrale e almeno 2 dei 3 PS finché il core assegna la vittoria per Pressione."
          : objectiveKind === "win_match"
            ? "Partita completa: usa tutte le regole normali di Arena Rubra e sconfiggi Nexus Advanced con una qualunque condizione di vittoria valida."
            : "Usa soltanto le unità già schierate. Nessuna carta, nessun acquisto: distruggi 4 unità Starter Nexus in due ondate."),
    { icon:"◆", durationMs:2200 }
  );
  return true;
}

function tutorialRuntimeChallengeApplyTurnRestrictions(event) {
  const scenario = tutorialChallengeRuntimeState.scenario;
  if (!scenario || !state || !event || event.type !== (typeof EventTypes !== "undefined" ? EventTypes.TURN_STARTED : "TURN_STARTED")) return false;
  const rules = scenario.rules || {};
  const side = Number(event.data && event.data.player);
  const enemySide = Number(scenario.enemySide || 2);
  if (rules.energyLocked && state.energy && Number.isFinite(side)) state.energy[side] = 0;
  if (rules.enemyEnergyLocked && state.energy && side === enemySide) state.energy[side] = 0;
  const clearCardsForSide = targetSide => {
    if (!Number.isFinite(targetSide)) return;
    if (state.hand && Array.isArray(state.hand[targetSide])) state.hand[targetSide] = [];
    if (state.deck && Array.isArray(state.deck[targetSide])) state.deck[targetSide] = [];
    if (state.discard && Array.isArray(state.discard[targetSide])) state.discard[targetSide] = [];
    if (state.starterCards) state.starterCards[targetSide] = {};
  };
  if (rules.cardsDisabled && Number.isFinite(side)) clearCardsForSide(side);
  if (rules.enemyCardsDisabled && side === enemySide) clearCardsForSide(side);
  if (rules.deckDisabled && state.deck && Number.isFinite(side)) state.deck[side] = [];
  if ((rules.starterCardsDisabled || rules.cardsDisabled) && state.starterCards && Number.isFinite(side)) state.starterCards[side] = {};
  if ((rules.cardsDisabled || rules.enemyCardsDisabled || rules.deckDisabled || rules.starterCardsDisabled) && typeof syncCardDebugState === "function") syncCardDebugState();
  return true;
}

function tutorialRuntimeChallengeCheckPlayerSurvival(scenario, destroyedUid="") {
  const playerSide = Number(scenario && scenario.playerSide || 1);
  const objectiveKind = scenario && scenario.objective && scenario.objective.kind;
  if (objectiveKind === "win_match") return true;
  if (objectiveKind === "destroy_tracked_enemies") {
    const meta = tutorialChallengeRuntimeState.meta;
    if (meta && destroyedUid && meta.playerUnitIds.has(String(destroyedUid)) && tutorialRuntimeChallengeLivingTrackedUnits(meta.playerUnitIds).length === 0) return false;
    return true;
  }
  return tutorialRuntimeChallengeLivingCombatUnits(playerSide).length > 0;
}

function tutorialRuntimeChallengeHandleHoldObjective(event) {
  const scenario = tutorialChallengeRuntimeState.scenario;
  const meta = tutorialChallengeRuntimeState.meta;
  const objective = scenario && scenario.objective || {};
  if (!scenario || !meta || objective.kind !== "hold_ps") return false;
  const playerSide = Number(scenario.playerSide || 1);
  const type = event && event.type;
  const data = event && event.data || {};
  const turnStartedType = typeof EventTypes !== "undefined" ? EventTypes.TURN_STARTED : "TURN_STARTED";
  const turnEndedType = typeof EventTypes !== "undefined" ? EventTypes.TURN_ENDED : "TURN_ENDED";

  if (type === turnStartedType && Number(data.player) === playerSide && meta.holdCount > 0 && tutorialRuntimeChallengeCentralPsControl(scenario) !== playerSide) {
    meta.holdCount = 0;
    tutorialRuntimeChallengeRenderHud();
    tutorialRuntimeChallengeAnnounce("CONTROLLO INTERROTTO", "Il PS centrale è stato perso: il conteggio di Tenuta riparte da 0/3.", { icon:"!", durationMs:1300 });
    return true;
  }

  if (type !== turnEndedType || Number(data.player) !== playerSide) return false;
  meta.playerTurnsEnded += 1;
  const waves = Array.isArray(scenario.waves) ? scenario.waves : [];
  if (meta.playerTurnsEnded < waves.length && !meta.startedWaves.has(meta.playerTurnsEnded)) tutorialRuntimeChallengeStartWave(meta.playerTurnsEnded);

  const controlled = tutorialRuntimeChallengeCentralPsControl(scenario) === playerSide;
  meta.holdCount = controlled ? meta.holdCount + 1 : 0;
  tutorialRuntimeChallengeRenderHud();
  const target = Math.max(1, Number(objective.consecutiveTurns || objective.target) || 3);
  tutorialRuntimeChallengeAnnounce(
    controlled ? "TENUTA" : "PS NON CONTROLLATO",
    controlled ? `Controllo centrale mantenuto: ${Math.min(meta.holdCount,target)}/${target}.` : `Il PS centrale non è sotto controllo Nexus: Tenuta 0/${target}.`,
    { icon:controlled ? "✓" : "!", durationMs:1100, priority:controlled ? "normal" : "high" }
  );
  if (meta.holdCount >= target) {
    tutorialChallengeRuntimeState.completing = true;
    tutorialRuntimeChallengeSchedule(() => {
      tutorialChallengeRuntimeState.completing = false;
      tutorialRuntimeCompleteChallenge({ success:true, outcome:"success", reason:"central_ps_held_three_turns" });
    }, 0);
  }
  return true;
}

function tutorialRuntimeChallengeHandleHqObjective(event) {
  const scenario = tutorialChallengeRuntimeState.scenario;
  const meta = tutorialChallengeRuntimeState.meta;
  const objective = scenario && scenario.objective || {};
  if (!scenario || !meta || objective.kind !== "occupy_enemy_hq") return false;

  const type = event && event.type;
  const data = event && event.data || {};
  const movedType = typeof EventTypes !== "undefined" ? EventTypes.UNIT_MOVED : "UNIT_MOVED";
  const victoryType = typeof EventTypes !== "undefined" ? EventTypes.VICTORY : "VICTORY";
  const playerSide = Number(scenario.playerSide || 1);
  const targetCoord = tutorialRuntimeChallengeEnemyHqCoord(scenario) || meta.targetHqCoord;

  if (type === movedType && Number(data.player) === playerSide && tutorialRuntimeChallengeSameCoord(data.to, targetCoord)) {
    meta.hqOccupied = true;
    meta.hqOccupantUid = data.unitId == null ? null : String(data.unitId);
    meta.targetHqCoord = Array.isArray(targetCoord) ? [...targetCoord] : null;
    tutorialRuntimeChallengeRenderHud();
    tutorialRuntimeChallengeAnnounce("BRECCIA COMPLETATA", "Una unità Exordium ha raggiunto il QG Nexus.", { icon:"✓", durationMs:1300 });
    tutorialChallengeRuntimeState.completing = true;
    tutorialRuntimeChallengeSchedule(() => {
      tutorialChallengeRuntimeState.completing = false;
      tutorialRuntimeCompleteChallenge({ success:true, outcome:"success", reason:"enemy_hq_occupied" });
    }, 0);
    return true;
  }

  if (type === victoryType && Number(data.winner || 0) === playerSide && String(data.winType || data.type || "").toLowerCase() === "qg") {
    meta.hqOccupied = true;
    meta.targetHqCoord = Array.isArray(targetCoord) ? [...targetCoord] : null;
    tutorialRuntimeChallengeRenderHud();
    tutorialChallengeRuntimeState.completing = true;
    tutorialRuntimeChallengeSchedule(() => {
      tutorialChallengeRuntimeState.completing = false;
      tutorialRuntimeCompleteChallenge({ success:true, outcome:"success", reason:"enemy_hq_occupied" });
    }, 0);
    return true;
  }

  const cardTypes = new Set([
    typeof EventTypes !== "undefined" ? EventTypes.CARD_DRAWN : "CARD_DRAWN",
    typeof EventTypes !== "undefined" ? EventTypes.CARD_PLAYED : "CARD_PLAYED",
    typeof EventTypes !== "undefined" ? EventTypes.CARD_DISCARDED : "CARD_DISCARDED"
  ]);
  if (cardTypes.has(type)) tutorialRuntimeChallengeRenderHud();
  return false;
}

function tutorialRuntimeChallengeHandlePressureObjective(event) {
  const scenario = tutorialChallengeRuntimeState.scenario;
  const meta = tutorialChallengeRuntimeState.meta;
  const objective = scenario && scenario.objective || {};
  if (!scenario || !meta || objective.kind !== "win_by_pressure") return false;

  const type = event && event.type;
  const data = event && event.data || {};
  const playerSide = Number(scenario.playerSide || 1);
  const pressureChangedType = typeof EventTypes !== "undefined" ? EventTypes.PRESSURE_CHANGED : "PRESSURE_CHANGED";
  const pressureEvaluatedType = typeof EventTypes !== "undefined" ? EventTypes.PRESSURE_EVALUATED : "PRESSURE_EVALUATED";
  const victoryType = typeof EventTypes !== "undefined" ? EventTypes.VICTORY : "VICTORY";
  const cardTypes = new Set([
    typeof EventTypes !== "undefined" ? EventTypes.CARD_DRAWN : "CARD_DRAWN",
    typeof EventTypes !== "undefined" ? EventTypes.CARD_PLAYED : "CARD_PLAYED",
    typeof EventTypes !== "undefined" ? EventTypes.CARD_DISCARDED : "CARD_DISCARDED",
    typeof EventTypes !== "undefined" ? EventTypes.PS_CONTROL_CHANGED : "PS_CONTROL_CHANGED"
  ]);

  if (type === pressureChangedType && Number(data.player) === playerSide) {
    meta.pressureValue = Math.max(0, Number(data.current) || Number(state && state.pressure && state.pressure[playerSide]) || 0);
    meta.pressureTarget = Math.max(1, Number(data.limit) || Number(objective.target) || meta.pressureTarget || 5);
    tutorialRuntimeChallengeRenderHud();
    tutorialRuntimeChallengeAnnounce("PRESSIONE", `Avanzamento strategico: ${Math.min(meta.pressureValue,meta.pressureTarget)}/${meta.pressureTarget}.`, { icon:"◆", durationMs:900, priority:"normal" });
    return true;
  }

  if (type === pressureEvaluatedType || cardTypes.has(type)) {
    tutorialRuntimeChallengeRenderHud();
    return true;
  }

  if (type === victoryType) {
    const winner = Number(data.winner || 0);
    const winType = String(data.winType || data.type || "").toLowerCase();
    if (winner === playerSide && winType === "pressione") {
      meta.pressureWon = true;
      meta.pressureValue = Math.max(meta.pressureValue, Number(state && state.pressure && state.pressure[playerSide]) || Number(objective.target) || 5);
      tutorialRuntimeChallengeRenderHud();
      tutorialRuntimeChallengeAnnounce("PRESSIONE COMPLETATA", "Il dominio territoriale è stato convertito in vittoria per Pressione.", { icon:"✓", durationMs:1300 });
      tutorialChallengeRuntimeState.completing = true;
      tutorialRuntimeChallengeSchedule(() => {
        tutorialChallengeRuntimeState.completing = false;
        tutorialRuntimeCompleteChallenge({ success:true, outcome:"success", reason:"pressure_victory" });
      }, 0);
      return true;
    }
  }
  return false;
}

function tutorialRuntimeChallengeHandleFinalExamObjective(event) {
  const scenario = tutorialChallengeRuntimeState.scenario;
  const meta = tutorialChallengeRuntimeState.meta;
  const objective = scenario && scenario.objective || {};
  if (!scenario || !meta || objective.kind !== "win_match") return false;

  const type = event && event.type;
  const data = event && event.data || {};
  const playerSide = Number(scenario.playerSide || 1);
  const victoryType = typeof EventTypes !== "undefined" ? EventTypes.VICTORY : "VICTORY";
  const hudTypes = new Set([
    typeof EventTypes !== "undefined" ? EventTypes.CARD_DRAWN : "CARD_DRAWN",
    typeof EventTypes !== "undefined" ? EventTypes.CARD_PLAYED : "CARD_PLAYED",
    typeof EventTypes !== "undefined" ? EventTypes.CARD_DISCARDED : "CARD_DISCARDED",
    typeof EventTypes !== "undefined" ? EventTypes.PS_CONTROL_CHANGED : "PS_CONTROL_CHANGED",
    typeof EventTypes !== "undefined" ? EventTypes.PRESSURE_CHANGED : "PRESSURE_CHANGED",
    typeof EventTypes !== "undefined" ? EventTypes.TURN_STARTED : "TURN_STARTED"
  ]);
  if (hudTypes.has(type)) {
    tutorialRuntimeChallengeRenderHud();
    return true;
  }
  if (type !== victoryType) return false;

  const winner = Number(data.winner || 0);
  const winType = String(data.winType || data.type || "altro").toLowerCase();
  meta.finalWinType = winType;
  if (winner === playerSide) {
    meta.matchWon = true;
    tutorialRuntimeChallengeRenderHud();
    tutorialRuntimeChallengeAnnounce("ESAME SUPERATO", `Vittoria ${winType}: hai completato le cinque Prove sul campo.`, { icon:"✓", durationMs:1500 });
    tutorialChallengeRuntimeState.completing = true;
    tutorialRuntimeChallengeSchedule(() => {
      tutorialChallengeRuntimeState.completing = false;
      tutorialRuntimeCompleteChallenge({ success:true, outcome:"success", reason:"match_victory" });
    }, 0);
    return true;
  }

  tutorialChallengeRuntimeState.completing = true;
  tutorialRuntimeChallengeSchedule(() => {
    tutorialChallengeRuntimeState.completing = false;
    tutorialRuntimeCompleteChallenge({ success:false, outcome:"failure", reason:winner > 0 ? "enemy_victory" : "match_draw" });
  }, 0);
  return true;
}

function tutorialRuntimeHandleChallengeGameEvent(event) {
  if (!tutorialChallengeRuntimeState.active || !tutorialChallengeRuntimeState.scenario || tutorialChallengeRuntimeState.completing) return false;
  const scenario = tutorialChallengeRuntimeState.scenario;
  const meta = tutorialChallengeRuntimeState.meta;
  if (!meta) return false;

  tutorialRuntimeChallengeApplyTurnRestrictions(event);

  const type = event && event.type;
  const data = event && event.data || {};
  const destroyedType = typeof EventTypes !== "undefined" ? EventTypes.UNIT_DESTROYED : "UNIT_DESTROYED";
  const victoryType = typeof EventTypes !== "undefined" ? EventTypes.VICTORY : "VICTORY";
  const objectiveKind = scenario.objective && scenario.objective.kind;

  if (objectiveKind === "hold_ps") tutorialRuntimeChallengeHandleHoldObjective(event);
  if (objectiveKind === "occupy_enemy_hq") tutorialRuntimeChallengeHandleHqObjective(event);
  if (objectiveKind === "win_by_pressure") tutorialRuntimeChallengeHandlePressureObjective(event);
  if (objectiveKind === "win_match") tutorialRuntimeChallengeHandleFinalExamObjective(event);
  if (tutorialChallengeRuntimeState.completing) return true;

  if (type === destroyedType) {
    const uid = String(data.unitId || "");
    if (objectiveKind === "destroy_tracked_enemies" && uid && meta.enemyUnitIds.has(uid) && !meta.destroyedEnemyUnitIds.has(uid)) {
      meta.destroyedEnemyUnitIds.add(uid);
      meta.enemyDestroyed += 1;
      tutorialRuntimeChallengeRenderHud();

      const target = Math.max(1, Number(scenario.objective && scenario.objective.target) || 4);
      if (meta.enemyDestroyed >= target) {
        tutorialChallengeRuntimeState.completing = true;
        tutorialRuntimeChallengeSchedule(() => {
          tutorialChallengeRuntimeState.completing = false;
          tutorialRuntimeCompleteChallenge({ success:true, outcome:"success", reason:"all_enemy_units_destroyed" });
        }, 0);
        return true;
      }

      if (meta.waveIndex === 0) {
        const waveOneIds = meta.waveUnitIds[0] || new Set();
        const waveOneLiving = tutorialRuntimeChallengeLivingTrackedUnits(waveOneIds);
        if (waveOneIds.size > 0 && waveOneLiving.length === 0 && !meta.startedWaves.has(1)) tutorialRuntimeChallengeStartWave(1);
      }
    }

    if (!tutorialRuntimeChallengeCheckPlayerSurvival(scenario, uid)) {
      tutorialChallengeRuntimeState.completing = true;
      tutorialRuntimeChallengeSchedule(() => {
        tutorialChallengeRuntimeState.completing = false;
        tutorialRuntimeCompleteChallenge({ success:false, outcome:"failure", reason:"all_player_units_destroyed" });
      }, 0);
      return true;
    }
  }

  if (type === victoryType) {
    const playerSide = Number(scenario.playerSide || 1);
    const winner = Number(data.winner || 0);
    const objectiveComplete = objectiveKind === "destroy_tracked_enemies"
      ? meta.enemyDestroyed >= Math.max(1, Number(scenario.objective && scenario.objective.target) || 4)
      : objectiveKind === "hold_ps"
        ? meta.holdCount >= Math.max(1, Number(scenario.objective && (scenario.objective.consecutiveTurns || scenario.objective.target)) || 3)
        : objectiveKind === "occupy_enemy_hq"
          ? meta.hqOccupied === true
          : objectiveKind === "win_by_pressure"
            ? meta.pressureWon === true
            : objectiveKind === "win_match"
              ? meta.matchWon === true
              : false;
    if (!objectiveComplete || winner !== playerSide) {
      tutorialChallengeRuntimeState.completing = true;
      tutorialRuntimeChallengeSchedule(() => {
        tutorialChallengeRuntimeState.completing = false;
        tutorialRuntimeCompleteChallenge({ success:false, outcome:"failure", reason:winner === playerSide ? "wrong_victory_condition" : "enemy_victory" });
      }, 0);
      return true;
    }
  }
  return false;
}

function tutorialRuntimeChallengeInstallDeckRecoveryGuard() {
  if (typeof canRecoverDeck !== "function" || canRecoverDeck.__tutorialChallengeGuardF9V2c) return false;
  const original = canRecoverDeck;
  const guarded = function(side) {
    if (typeof state !== "undefined" && state && state.tutorialChallengeMode && state.tutorialChallengeDeckRecoveryDisabled) {
      const cfg = typeof deckRecoveryConfig === "function" ? deckRecoveryConfig() : { cost:5, draw:3, missionOrdinaryDraw:4 };
      return { ok:false, reason:"Recupero deck disabilitato in questa Prova sul campo", cost:cfg.cost, draw:cfg.draw, missionOrdinaryDraw:cfg.missionOrdinaryDraw };
    }
    return original(side);
  };
  guarded.__tutorialChallengeGuardF9V2c = true;
  guarded.__original = original;
  canRecoverDeck = guarded;
  return true;
}

function tutorialRuntimeApplyChallengeSetup(challenge, scenario) {
  if (!challenge || !scenario || !scenario.setup || typeof newGame !== "function") return false;
  const setup = scenario.setup;
  const initiative = typeof document !== "undefined" ? document.getElementById("initiativeMode") : null;
  if (initiative && setup.firstPlayer != null) initiative.value = String(setup.firstPlayer);
  if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.GAME);
  newGame({
    mapId:setup.mapId || undefined,
    factions:{ ...(setup.factions || {1:"Exordium",2:"Nexus"}) },
    selectedCommanders:{ ...(setup.selectedCommanders || {}) },
    selectedDecks:{ ...(setup.selectedDecks || {1:{mode:"template"},2:{mode:"template"}}) },
    modes:{ ...(setup.modes || {1:"human",2:"bot"}) },
    autoResignEnabled:setup.autoResignEnabled === true,
    aiMode:setup.aiMode || "advanced",
    pacePreset:setup.pacePreset || "competitive",
    gameScaleMode:setup.gameScaleMode || "tactical",
    tutorialMode:true,
    tutorialChallengeMode:true,
    tutorialChallengeId:challenge.id,
    tutorialTitle:scenario.title || challenge.title
  });
  if (!state) return false;
  const rules = scenario.rules || {};
  state.tutorialMode = true;
  state.tutorialChallengeMode = true;
  state.tutorialChallengeId = challenge.id;
  state.tutorialChallengeDeckRecoveryDisabled = rules.deckRecoveryDisabled === true;
  state.tutorialScenarioId = null;
  state.tutorialLessonId = null;
  state.tutorialBotPaused = false;
  state.autoResignEnabled = setup.autoResignEnabled === true;
  state.matchRecorded = false;
  if (Number.isFinite(Number(setup.startingRound))) state.turn = Math.max(1, Math.trunc(Number(setup.startingRound)));
  if (setup.pressure && typeof setup.pressure === "object") state.pressure = { ...state.pressure, ...setup.pressure };
  if (setup.energy) state.energy = { ...state.energy, ...setup.energy };
  for (const side of (typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(state) : [1,2])) {
    if (setup.starterCardsEnabled === false && state.starterCards) state.starterCards[side] = {};
    if (setup.hand && Array.isArray(setup.hand[side])) state.hand[side] = setup.hand[side].map((cardId,index) => tutorialRuntimeCardInstance(cardId, side, index, "hand")).filter(Boolean);
    if (setup.deck && Array.isArray(setup.deck[side])) state.deck[side] = setup.deck[side].map((cardId,index) => tutorialRuntimeCardInstance(cardId, side, index, "deck")).filter(Boolean);
    if (setup.discard && Array.isArray(setup.discard[side])) state.discard[side] = setup.discard[side].map((cardId,index) => tutorialRuntimeCardInstance(cardId, side, index, "discard")).filter(Boolean);
  }
  if (rules.cardsDisabled || rules.enemyCardsDisabled || rules.fixedHand || rules.missionsDisabled) {
    const sides = typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(state) : [1,2];
    const clearMissionSides = (rules.cardsDisabled || rules.fixedHand || rules.missionsDisabled) ? sides : [Number(scenario.enemySide || 2)];
    if (state.missions) for (const side of clearMissionSides) state.missions[side] = null;
    state.missionPendingReward = null;
  }
  if (typeof syncCardDebugState === "function") syncCardDebugState();
  if (typeof resetInteractionContext === "function") resetInteractionContext();
  if (typeof renderAll === "function") renderAll();
  tutorialRuntimeChallengeInstallDeckRecoveryGuard();
  return true;
}

function tutorialRuntimeStartChallenge(id, options={}) {
  const challenge = tutorialRuntimeChallengeById(id);
  if (!challenge) {
    tutorialRuntimeSetStatus(`Prova sul campo non trovata: ${id}`);
    return false;
  }
  const unlock = tutorialRuntimeChallengeUnlockStatus();
  if (!unlock.unlocked) {
    tutorialRuntimeSetStatus(`Prova bloccata: completa tutte le ${unlock.requiredLessons} lezioni dell'Accademia (${unlock.completedLessons}/${unlock.requiredLessons}).`);
    return false;
  }
  const scenario = challenge.scenarioId ? tutorialRuntimeChallengeScenarioById(challenge.scenarioId) : null;
  if (!scenario) {
    tutorialRuntimeSetStatus(`${challenge.title} è sbloccata. Il contenuto giocabile sarà aggiunto nella milestone dedicata.`);
    return false;
  }

  tutorialRuntimeAbort({ silent:true, keepScreen:true, reason:"challenge-start" });
  tutorialRuntimeAbortChallenge({ silent:true, keepScreen:true, reason:"restart" });
  tutorialChallengeRuntimeState.active = true;
  tutorialChallengeRuntimeState.challenge = challenge;
  tutorialChallengeRuntimeState.challengeId = challenge.id;
  tutorialChallengeRuntimeState.scenario = scenario;
  tutorialChallengeRuntimeState.startedAt = Date.now();
  tutorialChallengeRuntimeState.lastResult = null;
  if (typeof document !== "undefined" && document.body) document.body.classList.add("tutorial-challenge-active");
  if (!tutorialRuntimeApplyChallengeSetup(challenge, scenario)) {
    tutorialRuntimeAbortChallenge({ returnToTutorial:true, reason:"setup-failed" });
    return false;
  }
  if (!tutorialRuntimeChallengeInitializeScenario()) {
    tutorialRuntimeAbortChallenge({ returnToTutorial:true, reason:"scenario-init-failed" });
    return false;
  }
  tutorialRuntimeSaveChallengeProgress(challenge.id, { incrementAttempt:true, outcome:"started" });
  tutorialRuntimeSetStatus(`${challenge.title} · Prova sul campo avviata.`);
  return true;
}

function tutorialRuntimeCompleteChallenge(options={}) {
  if (!tutorialChallengeRuntimeState.active || !tutorialChallengeRuntimeState.challengeId) return false;
  const challengeId = tutorialChallengeRuntimeState.challengeId;
  const challenge = tutorialChallengeRuntimeState.challenge || tutorialRuntimeChallengeById(challengeId);
  const success = options.success !== false;
  const outcome = options.outcome || (success ? "success" : "failure");
  const reason = options.reason || null;
  tutorialRuntimeSaveChallengeProgress(challengeId, { completed:success, outcome, reason });
  tutorialChallengeRuntimeState.lastResult = { success, outcome, reason, at:Date.now() };
  if (typeof invalidateBotRunForNewMatchF9T2c2 === "function") invalidateBotRunForNewMatchF9T2c2("tutorial_challenge_complete");
  tutorialRuntimeChallengeClearTimers();
  tutorialRuntimeChallengeRemoveHud();
  tutorialChallengeRuntimeState.active = false;
  tutorialChallengeRuntimeState.completing = false;
  if (typeof state !== "undefined" && state) {
    state.tutorialChallengeMode = false;
    state.tutorialChallengeId = null;
    state.tutorialChallengeDeckRecoveryDisabled = false;
    state.tutorialMode = false;
    state.tutorialBotPaused = false;
  }
  if (typeof document !== "undefined" && document.body) document.body.classList.remove("tutorial-challenge-active");
  tutorialRuntimeSetStatus(success ? "Prova sul campo completata." : "Prova sul campo terminata. Puoi riprovarla quando vuoi.");
  if (options.showResultModal !== false) arenaResultModalShowChallengeResultF9V3a(challenge, success, reason);
  else if (options.returnToTutorial !== false && typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") {
    setAppScreen(ARENA_APP_SCREENS.TUTORIAL);
    tutorialRuntimeRenderMenu();
  }
  return true;
}

function tutorialRuntimeAbortChallenge(options={}) {
  const wasActive = tutorialChallengeRuntimeState.active;
  if (wasActive && typeof invalidateBotRunForNewMatchF9T2c2 === "function") invalidateBotRunForNewMatchF9T2c2("tutorial_challenge_abort");
  tutorialRuntimeChallengeClearTimers();
  tutorialRuntimeChallengeRemoveHud();
  tutorialChallengeRuntimeState.active = false;
  tutorialChallengeRuntimeState.challenge = null;
  tutorialChallengeRuntimeState.challengeId = "";
  tutorialChallengeRuntimeState.scenario = null;
  tutorialChallengeRuntimeState.startedAt = null;
  tutorialChallengeRuntimeState.meta = null;
  tutorialChallengeRuntimeState.completing = false;
  if (typeof state !== "undefined" && state) {
    state.tutorialChallengeMode = false;
    state.tutorialChallengeId = null;
    state.tutorialChallengeDeckRecoveryDisabled = false;
    state.tutorialMode = false;
    state.tutorialBotPaused = false;
  }
  if (typeof document !== "undefined" && document.body) document.body.classList.remove("tutorial-challenge-active");
  if (!options.silent && options.returnToTutorial !== false && !options.keepScreen && typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") {
    setAppScreen(ARENA_APP_SCREENS.TUTORIAL);
    tutorialRuntimeRenderMenu();
    tutorialRuntimeSetStatus(options.reason === "setup-failed" ? "Impossibile avviare la Prova sul campo." : "Prova sul campo chiusa.");
  }
  return wasActive;
}

function tutorialRuntimeChallengeDiagnostics() {
  const unlock = tutorialRuntimeChallengeUnlockStatus();
  return {
    active:tutorialChallengeRuntimeState.active,
    challengeId:tutorialChallengeRuntimeState.challengeId || null,
    scenarioId:tutorialChallengeRuntimeState.scenario && tutorialChallengeRuntimeState.scenario.id || null,
    objectiveKind:tutorialChallengeRuntimeState.scenario && tutorialChallengeRuntimeState.scenario.objective && tutorialChallengeRuntimeState.scenario.objective.kind || null,
    unlocked:unlock.unlocked,
    completedLessons:unlock.completedLessons,
    requiredLessons:unlock.requiredLessons,
    startedAt:tutorialChallengeRuntimeState.startedAt,
    lastResult:tutorialChallengeRuntimeState.lastResult,
    wave:tutorialChallengeRuntimeState.meta ? tutorialChallengeRuntimeState.meta.waveIndex + 1 : 0,
    enemyDestroyed:tutorialChallengeRuntimeState.meta ? tutorialChallengeRuntimeState.meta.enemyDestroyed : 0,
    enemiesSpawned:tutorialChallengeRuntimeState.meta ? tutorialChallengeRuntimeState.meta.enemiesSpawned : 0,
    holdCount:tutorialChallengeRuntimeState.meta ? tutorialChallengeRuntimeState.meta.holdCount : 0,
    hqOccupied:tutorialChallengeRuntimeState.meta ? tutorialChallengeRuntimeState.meta.hqOccupied === true : false,
    hqOccupantUid:tutorialChallengeRuntimeState.meta ? tutorialChallengeRuntimeState.meta.hqOccupantUid : null,
    targetHqCoord:tutorialChallengeRuntimeState.meta && Array.isArray(tutorialChallengeRuntimeState.meta.targetHqCoord) ? [...tutorialChallengeRuntimeState.meta.targetHqCoord] : null,
    round:state ? state.turn : null,
    pressureWon:tutorialChallengeRuntimeState.meta ? tutorialChallengeRuntimeState.meta.pressureWon === true : false,
    pressureValue:tutorialChallengeRuntimeState.meta ? tutorialChallengeRuntimeState.meta.pressureValue || 0 : 0,
    pressureTarget:tutorialChallengeRuntimeState.meta ? tutorialChallengeRuntimeState.meta.pressureTarget || 0 : 0,
    playerHandSize:state && tutorialChallengeRuntimeState.scenario && state.hand && Array.isArray(state.hand[tutorialChallengeRuntimeState.scenario.playerSide || 1]) ? state.hand[tutorialChallengeRuntimeState.scenario.playerSide || 1].length : 0,
    playerDeckSize:state && tutorialChallengeRuntimeState.scenario && state.deck && Array.isArray(state.deck[tutorialChallengeRuntimeState.scenario.playerSide || 1]) ? state.deck[tutorialChallengeRuntimeState.scenario.playerSide || 1].length : 0,
    playerTurnsEnded:tutorialChallengeRuntimeState.meta ? tutorialChallengeRuntimeState.meta.playerTurnsEnded : 0,
    playerUnitsAlive:tutorialChallengeRuntimeState.meta ? tutorialRuntimeChallengeLivingCombatUnits(tutorialChallengeRuntimeState.scenario && tutorialChallengeRuntimeState.scenario.playerSide || 1).length : 0
  };
}

function tutorialRuntimeEscape(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[char]));
}

function tutorialRuntimeAttrEscape(value) {
  return String(value == null ? "" : value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}


function tutorialRuntimeCancelTimer(timerId) {
  if (timerId == null) return;
  clearTimeout(timerId);
  tutorialRuntimeState.timers.delete(timerId);
}

function tutorialRuntimeClearTimers() {
  for (const timerId of tutorialRuntimeState.timers) clearTimeout(timerId);
  tutorialRuntimeState.timers.clear();
  tutorialRuntimeState.retryTimer = null;
  tutorialRuntimeState.hintTimer = null;
}

function tutorialRuntimeSchedule(callback, delay=0, options={}) {
  if (typeof callback !== "function") return null;
  const sessionToken = options.sessionToken == null ? tutorialRuntimeState.sessionToken : options.sessionToken;
  const stepToken = options.stepToken === false
    ? null
    : (options.stepToken == null ? tutorialRuntimeState.stepToken : options.stepToken);
  const timerId = setTimeout(() => {
    tutorialRuntimeState.timers.delete(timerId);
    if (tutorialRuntimeState.sessionToken !== sessionToken) return;
    if (stepToken != null && tutorialRuntimeState.stepToken !== stepToken) return;
    callback();
  }, Math.max(0, Number(delay) || 0));
  tutorialRuntimeState.timers.add(timerId);
  return timerId;
}

function tutorialRuntimeInvalidateAsync() {
  tutorialRuntimeState.sessionToken += 1;
  tutorialRuntimeState.stepToken += 1;
  tutorialRuntimeClearTimers();
  if (tutorialRuntimeState.updateFrame) cancelAnimationFrame(tutorialRuntimeState.updateFrame);
  tutorialRuntimeState.updateFrame = null;
}

function tutorialRuntimeHandStateFromDom() {
  if (typeof document === "undefined") return "unknown";
  const overlay = document.getElementById("mapHandOverlay");
  if (!overlay) return "unknown";
  const collapse = overlay.querySelector(".mapHandCollapseBtn");
  if (overlay.classList.contains("isTargeting") || overlay.classList.contains("isMovementHidden")) return "collapsed";
  if (tutorialRuntimeElementIsVisible(collapse)) return "open";
  if (typeof MAP_HAND_OVERLAY_STATE !== "undefined" && MAP_HAND_OVERLAY_STATE && MAP_HAND_OVERLAY_STATE.manuallyCollapsed) return "collapsed";
  return overlay.firstElementChild ? "open" : "collapsed";
}

function tutorialRuntimeDesiredHandState(step) {
  const explicit = step && step.uiState && step.uiState.hand;
  if (["open", "collapsed", "preserve"].includes(explicit)) return explicit;
  const target = step && step.spotlight && step.spotlight.target;
  if (!target) return "preserve";
  if (target.type === "card") return "open";
  if (["unit", "hex", "hq", "ps"].includes(target.type)) return "collapsed";
  const selector = String(target.selector || "");
  const semanticTarget = tutorialRuntimeSemanticKeyForSelectorF9V3b(selector);
  if (semanticTarget === "hand_collapse") return "open";
  if (["hand_show", "ability_toggle"].includes(semanticTarget) || selector.includes("actionPanel")) return "collapsed";
  return "preserve";
}

function tutorialRuntimeNormalizeTransientUi(options={}) {
  if (typeof closeAnyGamePanelForMapReturn === "function") closeAnyGamePanelForMapReturn();
  if (typeof closeApkM4Panel === "function") closeApkM4Panel();
  if (typeof mapHandOverlayHideHoverPreview === "function") mapHandOverlayHideHoverPreview();
  if (typeof resetInteractionContext === "function") resetInteractionContext();
  else if (typeof clearSelection === "function") clearSelection();
  if (typeof MAP_HAND_OVERLAY_STATE !== "undefined" && MAP_HAND_OVERLAY_STATE) {
    MAP_HAND_OVERLAY_STATE.hiddenForTarget = false;
    MAP_HAND_OVERLAY_STATE.hiddenForMovement = false;
    MAP_HAND_OVERLAY_STATE.manuallyCollapsed = options.hand === "collapsed";
    MAP_HAND_OVERLAY_STATE.selectedCardUid = "";
    MAP_HAND_OVERLAY_STATE.selectedSource = "";
    MAP_HAND_OVERLAY_STATE.selectedSide = 0;
    MAP_HAND_OVERLAY_STATE.hoverCardUid = "";
    MAP_HAND_OVERLAY_STATE.hoverSource = "";
    MAP_HAND_OVERLAY_STATE.hoverSide = 0;
  }
  if (typeof renderAll === "function") renderAll();
  return true;
}

function tutorialRuntimeApplyStepUiState(step, options={}) {
  const desired = tutorialRuntimeDesiredHandState(step);
  if (desired === "preserve") return true;
  const current = tutorialRuntimeHandStateFromDom();
  if (!options.force && current === desired) return true;
  if (desired === "open" && typeof mapHandOverlayShowHand === "function") return mapHandOverlayShowHand();
  if (desired === "collapsed" && typeof mapHandOverlayCollapse === "function") return mapHandOverlayCollapse();
  return false;
}

function tutorialRuntimeAbortForMissingTarget(step) {
  const stepId = step && step.id || "sconosciuto";
  tutorialRuntimeState.lastAction = { kind:"target-missing", stepId, at:Date.now() };
  tutorialRuntimeAbort({ returnToTutorial:true, reason:"target-missing" });
  return false;
}

function tutorialRuntimeRegisterPortraits() {
  if (typeof narrativeRegisterPortraitSet !== "function" || typeof TUTORIAL_PORTRAIT_MANIFEST_F9O6 === "undefined") return;
  for (const item of Object.values(TUTORIAL_PORTRAIT_MANIFEST_F9O6)) {
    narrativeRegisterPortraitSet(item.id, item.frames || {});
  }
}

function tutorialRuntimeEnsureSpotlightDom() {
  if (typeof document === "undefined") return null;
  if (tutorialRuntimeState.spotlightDom && tutorialRuntimeState.spotlightDom.root && tutorialRuntimeState.spotlightDom.root.isConnected) return tutorialRuntimeState.spotlightDom;
  const host = document.body || document.getElementById("gameScreen");
  if (!host) return null;
  let root = document.getElementById("tutorialSpotlightRoot");
  if (!root) {
    root = document.createElement("div");
    root.id = "tutorialSpotlightRoot";
    root.className = "tutorialSpotlightRoot";
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `<div class="tutorialSpotlightHole"></div><div class="tutorialSpotlightArrow" aria-hidden="true"></div><div class="tutorialSpotlightHint" role="status"></div>`;
    host.appendChild(root);
  }
  tutorialRuntimeState.spotlightDom = {
    root,
    hole:root.querySelector(".tutorialSpotlightHole"),
    arrow:root.querySelector(".tutorialSpotlightArrow"),
    hint:root.querySelector(".tutorialSpotlightHint")
  };
  return tutorialRuntimeState.spotlightDom;
}

function tutorialRuntimeAllCards(side) {
  if (!state || !side) return [];
  return [
    ...((state.hand && state.hand[side]) || []),
    ...Object.values((state.starterCards && state.starterCards[side]) || {}).filter(Boolean),
    ...((state.deck && state.deck[side]) || []),
    ...((state.discard && state.discard[side]) || [])
  ];
}

function tutorialRuntimeFindCard(spec) {
  const side = Number(spec.side) || (state && state.currentPlayer) || 1;
  const cardId = spec.cardId || spec.id || null;
  const sourceId = spec.sourceId || spec.blueprintId || null;
  return tutorialRuntimeAllCards(side).find(card => card && (
    (cardId && card.id === cardId) ||
    (sourceId && (card.sourceId === sourceId || card.blueprintId === sourceId || card.tacticId === sourceId))
  )) || null;
}

function tutorialRuntimeElementIsVisible(element) {
  if (!element || !element.isConnected || typeof element.getBoundingClientRect !== "function") return false;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const style = typeof getComputedStyle === "function" ? getComputedStyle(element) : null;
  return !style || (style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0);
}

function tutorialRuntimeBestVisibleTarget(nodes) {
  const list = Array.from(nodes || []).filter(Boolean);
  if (!list.length) return null;
  return list.find(node => node.closest && node.closest("#mapHandOverlay") && tutorialRuntimeElementIsVisible(node))
    || list.find(tutorialRuntimeElementIsVisible)
    || list[0];
}

function tutorialRuntimeSemanticKeyForSelectorF9V3b(selector) {
  const text = String(selector || "");
  if (!text) return null;
  if (text.includes("mapHandCollapseBtn")) return "hand_collapse";
  if (text.includes("mapLeftHandBtn") || text.includes("mapHandShowBtn")) return "hand_show";
  if (/endturnbtn/i.test(text) || text.includes('data-game-action="end-turn"') || text.includes("data-game-action='end-turn'")) return "end_turn";
  if (text.includes('data-unit-action="ability"') || text.includes("data-unit-action='ability'") || text.includes("selectedUnitPrimaryAbilitySlot")) return "ability_toggle";
  if (text.includes("mapHandOverlayCards") || text.includes("data-preview-card-uid")) return "hand_cards";
  if (text.includes("p2Score") || text.includes('data-player-score="2"') || text.includes("data-player-score='2'")) return "opponent_score";
  return null;
}

function tutorialRuntimeSelectorCandidatesF9V3b(specOrSelector) {
  const direct = typeof specOrSelector === "string"
    ? String(specOrSelector || "")
    : String(specOrSelector && specOrSelector.selector || "");
  const semantic = (specOrSelector && typeof specOrSelector === "object" && specOrSelector.semanticTarget)
    ? String(specOrSelector.semanticTarget)
    : tutorialRuntimeSemanticKeyForSelectorF9V3b(direct);
  const fallbacks = semantic && TUTORIAL_ACTION_CONTRACT_F9V3B.selectorTargets[semantic]
    ? TUTORIAL_ACTION_CONTRACT_F9V3B.selectorTargets[semantic]
    : [];
  return [...new Set([direct, ...fallbacks].filter(Boolean))];
}

function tutorialRuntimeQuerySelectorCandidatesF9V3b(specOrSelector, options={}) {
  if (typeof document === "undefined") return options.all ? [] : null;
  const nodes = [];
  for (const selector of tutorialRuntimeSelectorCandidatesF9V3b(specOrSelector)) {
    try {
      for (const node of document.querySelectorAll(selector)) if (!nodes.includes(node)) nodes.push(node);
    } catch (_) { /* selettore legacy non valido: prova il fallback semantico */ }
  }
  if (options.all) return nodes.filter(tutorialRuntimeElementIsVisible);
  return tutorialRuntimeBestVisibleTarget(nodes);
}

function tutorialRuntimeResolveTarget(spec) {
  if (typeof document === "undefined" || !spec) return null;
  if (typeof spec === "string") return tutorialRuntimeQuerySelectorCandidatesF9V3b(spec);
  if (spec.type === "selector") return tutorialRuntimeQuerySelectorCandidatesF9V3b(spec);
  if (spec.type === "ui") {
    const byId = document.getElementById(spec.id || spec.target || "");
    if (tutorialRuntimeElementIsVisible(byId)) return byId;
    return tutorialRuntimeQuerySelectorCandidatesF9V3b(spec) || byId;
  }
  if (spec.type === "card") {
    const card = tutorialRuntimeFindCard(spec);
    if (!card || !card.cardUid) return null;
    return tutorialRuntimeBestVisibleTarget(document.querySelectorAll(`[data-preview-card-uid="${tutorialRuntimeAttrEscape(card.cardUid)}"]`));
  }
  if (spec.type === "unit") {
    let unit = null;
    if (state && Array.isArray(state.units)) {
      unit = spec.uid ? state.units.find(item => item && item.uid === spec.uid) : state.units.find(item => item && item.alive && item.type !== "QG" && (!spec.side || item.side === Number(spec.side)) && (!spec.blueprintId || item.id === spec.blueprintId));
    }
    return unit ? document.querySelector(`.unitToken[data-unit-uid="${tutorialRuntimeAttrEscape(unit.uid)}"]`) : null;
  }
  if (spec.type === "hex") {
    const coord = Array.isArray(spec.coord) ? spec.coord.join(",") : String(spec.coord || spec.id || "");
    return coord ? document.querySelector(`.hex[data-coord-key="${tutorialRuntimeAttrEscape(coord)}"]`) : null;
  }
  if (spec.type === "hq") {
    const side = Number(spec.side) || 1;
    const coord = typeof HQ_POS !== "undefined" && HQ_POS[side] ? HQ_POS[side].join(",") : "";
    return coord ? document.querySelector(`.hex[data-coord-key="${tutorialRuntimeAttrEscape(coord)}"]`) : null;
  }
  if (spec.type === "ps") {
    const cells = state && Array.isArray(state.cells) ? state.cells.filter(cell => cell && cell.ps) : [];
    const cell = spec.coord ? cells.find(item => item.coord && item.coord.join(",") === [].concat(spec.coord).join(",")) : cells[Number(spec.index) || 0];
    return cell ? document.querySelector(`.hex[data-coord-key="${tutorialRuntimeAttrEscape(cell.coord.join(","))}"]`) : null;
  }
  return null;
}

function tutorialRuntimeResolveTargets(spec) {
  if (typeof document === "undefined" || !spec) return [];
  if (spec.all === true && (spec.type === "selector" || typeof spec === "string")) {
    return tutorialRuntimeQuerySelectorCandidatesF9V3b(spec, { all:true });
  }
  const target = tutorialRuntimeResolveTarget(spec);
  return target ? [target] : [];
}

function tutorialRuntimeResolveAllowedTargets(step) {
  const specs = Array.isArray(step && step.allowedTargets) && step.allowedTargets.length
    ? step.allowedTargets
    : step && step.spotlight && step.spotlight.target ? [step.spotlight.target] : [];
  return specs.flatMap(tutorialRuntimeResolveTargets).filter(Boolean);
}


function tutorialRuntimePortalPreviewElement(element) {
  if (typeof document === "undefined" || !document.body || !element || !element.parentNode) return false;
  if (tutorialRuntimeState.previewPortals.some(item => item && item.element === element)) return true;
  const originalParent = element.parentNode;
  const marker = document.createComment(`tutorial-preview-portal:${element.id || element.className || "preview"}`);
  originalParent.insertBefore(marker, element);
  document.body.appendChild(element);
  element.classList.add("tutorialPreviewPortal");
  tutorialRuntimeState.previewPortals.push({ element, marker, originalParent });
  return true;
}

function tutorialRuntimePortalCardPreviews() {
  if (typeof document === "undefined") return false;
  const previews = Array.from(document.querySelectorAll("#mapHandSelectionPreview,.mapHandHoverPreview"));
  let moved = false;
  for (const preview of previews) moved = tutorialRuntimePortalPreviewElement(preview) || moved;
  return moved;
}

function tutorialRuntimeRestoreCardPreviews() {
  const portals = Array.isArray(tutorialRuntimeState.previewPortals) ? [...tutorialRuntimeState.previewPortals] : [];
  tutorialRuntimeState.previewPortals = [];
  for (const item of portals) {
    const element = item && item.element;
    const marker = item && item.marker;
    if (!element) continue;
    element.classList.remove("tutorialPreviewPortal");
    if (marker && marker.parentNode) {
      marker.parentNode.insertBefore(element, marker);
      marker.remove();
    } else if (item.originalParent && item.originalParent.isConnected) {
      item.originalParent.appendChild(element);
    }
  }
  return portals.length > 0;
}

function tutorialRuntimeClearAttentionTargets() {
  if (typeof document !== "undefined") {
    document.querySelectorAll(".tutorialAttentionTarget,.tutorialAttentionContext").forEach(element => {
      element.classList.remove("tutorialAttentionTarget", "tutorialAttentionContext");
      element.removeAttribute("data-tutorial-attention");
    });
  }
  tutorialRuntimeState.attentionTargets = [];
}

function tutorialRuntimeMarkAttentionTarget(element, kind="action") {
  if (!element || !element.classList) return false;
  const className = kind === "context" ? "tutorialAttentionContext" : "tutorialAttentionTarget";
  element.classList.add(className);
  element.setAttribute("data-tutorial-attention", kind);
  tutorialRuntimeState.attentionTargets.push(element);
  return true;
}

function tutorialRuntimeApplyAttention(step) {
  tutorialRuntimePortalCardPreviews();
  tutorialRuntimeClearAttentionTargets();
  if (!step || typeof document === "undefined") return false;
  const informative = step.mode === TUTORIAL_STEP_MODES.INFORMATIVE;
  if (informative) {
    const next = document.querySelector("#narrativeOverlayRoot:not([hidden]) .narrativeNextBtn:not([hidden]):not(:disabled)");
    if (next) tutorialRuntimeMarkAttentionTarget(next, "action");
    const context = step.spotlight && step.spotlight.target ? tutorialRuntimeResolveTarget(step.spotlight.target) : null;
    if (context) tutorialRuntimeMarkAttentionTarget(context, "context");
  } else {
    const targets = tutorialRuntimeResolveAllowedTargets(step);
    for (const target of targets) tutorialRuntimeMarkAttentionTarget(target, "action");
  }
  return tutorialRuntimeState.attentionTargets.length > 0;
}

function tutorialRuntimeRect(element, padding=0) {
  if (!tutorialRuntimeElementIsVisible(element)) return null;
  const rect = element.getBoundingClientRect();
  const p = Math.max(0, Number(padding) || 0);
  const left = Math.max(0, rect.left - p);
  const top = Math.max(0, rect.top - p);
  const right = Math.min(window.innerWidth, rect.right + p);
  const bottom = Math.min(window.innerHeight, rect.bottom + p);
  return { left, top, right, bottom, width:Math.max(0, right-left), height:Math.max(0, bottom-top) };
}

function tutorialRuntimeRectIntersection(a, b) {
  if (!a || !b) return null;
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.right, b.right);
  const bottom = Math.min(a.bottom, b.bottom);
  if (right <= left || bottom <= top) return null;
  return { left, top, right, bottom, width:right-left, height:bottom-top };
}

function tutorialRuntimeRectOverlaps(a, b, tolerance=2) {
  const hit = tutorialRuntimeRectIntersection(a, b);
  return Boolean(hit && hit.width > tolerance && hit.height > tolerance);
}

function tutorialRuntimeBoardViewportRect() {
  const wrap = typeof cameraInteractionViewportRect === "function"
    ? cameraInteractionViewportRect({ refresh:true })
    : tutorialRuntimeRect(document.getElementById("boardWrap"));
  if (!wrap) return null;
  const left = Math.max(0, wrap.left);
  const top = Math.max(0, wrap.top);
  const right = Math.min(window.innerWidth, wrap.right);
  const bottom = Math.min(window.innerHeight, wrap.bottom);
  return { left, top, right, bottom, width:Math.max(0,right-left), height:Math.max(0,bottom-top) };
}

function tutorialRuntimeOccluderRects() {
  if (typeof document === "undefined") return [];
  const selectors = [
    "#narrativeOverlayRoot:not([hidden]) .narrativeDialog",
    "#mapHandOverlay:not([hidden]):not(.isCollapsed)",
    ".mapHandSelectionPreview.isVisible",
    ".apkM4Panel.isOpen",
    "#mobileGameBar"
  ];
  return selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)))
    .map(element => tutorialRuntimeRect(element, 10))
    .filter(Boolean);
}

function tutorialRuntimeLargestFreeRect(base, occluders) {
  if (!base) return null;
  const clipped = (occluders || []).map(rect => tutorialRuntimeRectIntersection(base, rect)).filter(Boolean);
  if (!clipped.length) return { ...base };
  const xs = new Set([base.left, base.right]);
  const ys = new Set([base.top, base.bottom]);
  for (const rect of clipped) {
    xs.add(Math.max(base.left, Math.min(base.right, rect.left)));
    xs.add(Math.max(base.left, Math.min(base.right, rect.right)));
    ys.add(Math.max(base.top, Math.min(base.bottom, rect.top)));
    ys.add(Math.max(base.top, Math.min(base.bottom, rect.bottom)));
  }
  const xValues = [...xs].sort((a,b)=>a-b);
  const yValues = [...ys].sort((a,b)=>a-b);
  let best = null;
  let bestScore = -Infinity;
  const baseCx = base.left + base.width/2;
  const baseCy = base.top + base.height/2;
  for (let xi=0; xi<xValues.length-1; xi++) {
    for (let xj=xi+1; xj<xValues.length; xj++) {
      for (let yi=0; yi<yValues.length-1; yi++) {
        for (let yj=yi+1; yj<yValues.length; yj++) {
          const rect = { left:xValues[xi], right:xValues[xj], top:yValues[yi], bottom:yValues[yj] };
          rect.width = rect.right-rect.left;
          rect.height = rect.bottom-rect.top;
          if (rect.width < 96 || rect.height < 84) continue;
          if (clipped.some(block => tutorialRuntimeRectOverlaps(rect, block))) continue;
          const area = rect.width*rect.height;
          const cx = rect.left+rect.width/2;
          const cy = rect.top+rect.height/2;
          const distance = Math.hypot(cx-baseCx, cy-baseCy);
          const score = area - distance*42;
          if (score > bestScore) { bestScore=score; best=rect; }
        }
      }
    }
  }
  return best || { ...base };
}

function tutorialRuntimeSafeViewport() {
  const board = tutorialRuntimeBoardViewportRect();
  if (!board) return null;
  const free = tutorialRuntimeLargestFreeRect(board, tutorialRuntimeOccluderRects());
  if (!free) return null;
  const padding = Math.min(36, Math.max(14, Math.min(free.width, free.height)*0.06));
  const rect = {
    left:free.left+padding,
    top:free.top+padding,
    right:free.right-padding,
    bottom:free.bottom-padding
  };
  rect.width = Math.max(1, rect.right-rect.left);
  rect.height = Math.max(1, rect.bottom-rect.top);
  return { rect, point:{ x:rect.left+rect.width/2, y:rect.top+rect.height/2 } };
}

function tutorialRuntimeStepNeedsAdaptiveFocus(step) {
  if (!step || !step.spotlight || !step.spotlight.target || step.focus === false) return false;
  if (step.focus === true) return true;
  const spec = step.spotlight.target;
  if (spec && ["hex","unit","hq","ps"].includes(spec.type)) return true;
  const target = tutorialRuntimeResolveTarget(spec);
  return Boolean(target && target.closest && target.closest("#boardVisualStack,#board"));
}

function tutorialRuntimeTargetRect(target, padding=8) {
  if (!target || typeof target.getBoundingClientRect !== "function") return null;
  const rect = target.getBoundingClientRect();
  if (!Number.isFinite(rect.left) || rect.width <= 0 || rect.height <= 0) return null;
  const p = Math.max(0, Number(padding) || 0);
  const left = Math.max(4, rect.left - p);
  const top = Math.max(4, rect.top - p);
  const right = Math.min(window.innerWidth - 4, rect.right + p);
  const bottom = Math.min(window.innerHeight - 4, rect.bottom + p);
  return { left, top, width:Math.max(8, right-left), height:Math.max(8, bottom-top), right, bottom };
}

function tutorialRuntimePositionSpotlight() {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step || !tutorialRuntimeState.step.spotlight) return false;
  const dom = tutorialRuntimeEnsureSpotlightDom();
  const target = tutorialRuntimeResolveTarget(tutorialRuntimeState.step.spotlight.target);
  if (!dom || !target) return false;
  tutorialRuntimeState.target = target;
  tutorialRuntimeState.allowedTargets = tutorialRuntimeResolveAllowedTargets(tutorialRuntimeState.step);
  if (!tutorialRuntimeState.attentionTargets.length || tutorialRuntimeState.attentionTargets.some(item => !item || !item.isConnected)) {
    tutorialRuntimeApplyAttention(tutorialRuntimeState.step);
  }
  const rect = tutorialRuntimeTargetRect(target, tutorialRuntimeState.step.spotlight.padding);
  if (!rect) return false;
  Object.assign(dom.hole.style, { left:`${rect.left}px`, top:`${rect.top}px`, width:`${rect.width}px`, height:`${rect.height}px` });
  const arrowLeft = Math.max(8, Math.min(window.innerWidth - 28, rect.left + rect.width / 2 - 10));
  const arrowTop = rect.top > 42 ? rect.top - 27 : rect.bottom + 8;
  Object.assign(dom.arrow.style, { left:`${arrowLeft}px`, top:`${arrowTop}px` });
  if (dom.hint && !dom.hint.classList.contains("isVisible")) {
    const hintLeft = Math.max(8, Math.min(window.innerWidth - 370, rect.left));
    const hintTop = Math.min(window.innerHeight - 52, rect.bottom + 14);
    Object.assign(dom.hint.style, { left:`${hintLeft}px`, top:`${hintTop}px` });
  }
  return true;
}

function tutorialRuntimeScheduleSpotlightUpdate() {
  if (!tutorialRuntimeState.active || tutorialRuntimeState.updateFrame) return;
  tutorialRuntimeState.updateFrame = requestAnimationFrame(() => {
    tutorialRuntimeState.updateFrame = null;
    tutorialRuntimePositionSpotlight();
    if (tutorialRuntimeState.active) tutorialRuntimeScheduleSpotlightUpdate();
  });
}

function tutorialRuntimeShowSpotlight(step) {
  const dom = tutorialRuntimeEnsureSpotlightDom();
  if (!dom) return false;
  if (!step || !step.spotlight) {
    dom.root.hidden = true;
    tutorialRuntimeState.target = null;
    tutorialRuntimeState.allowedTargets = [];
    return true;
  }
  dom.root.hidden = false;
  dom.root.dataset.mode = step.mode || TUTORIAL_STEP_MODES.INFORMATIVE;
  dom.root.dataset.stepId = step.id || "";
  tutorialRuntimePositionSpotlight();
  tutorialRuntimeScheduleSpotlightUpdate();
  return true;
}

function tutorialRuntimeHideSpotlight() {
  tutorialRuntimeCancelTimer(tutorialRuntimeState.retryTimer);
  tutorialRuntimeCancelTimer(tutorialRuntimeState.hintTimer);
  tutorialRuntimeCancelTimer(tutorialRuntimeState.focusTimer);
  tutorialRuntimeState.retryTimer = null;
  tutorialRuntimeState.hintTimer = null;
  tutorialRuntimeState.focusTimer = null;
  tutorialRuntimeClearAttentionTargets();
  if (tutorialRuntimeState.updateFrame) cancelAnimationFrame(tutorialRuntimeState.updateFrame);
  tutorialRuntimeState.updateFrame = null;
  const dom = tutorialRuntimeEnsureSpotlightDom();
  if (dom && dom.root) dom.root.hidden = true;
  if (dom && dom.hint) dom.hint.classList.remove("isVisible");
  tutorialRuntimeState.target = null;
  tutorialRuntimeState.allowedTargets = [];
}

function tutorialRuntimeShowHint(text) {
  const dom = tutorialRuntimeEnsureSpotlightDom();
  if (!dom || !dom.hint) return;
  dom.hint.textContent = String(text || "Azione non disponibile in questo passo.");
  dom.hint.classList.add("isVisible");
  tutorialRuntimeCancelTimer(tutorialRuntimeState.hintTimer);
  tutorialRuntimeState.hintTimer = tutorialRuntimeSchedule(() => dom.hint.classList.remove("isVisible"), 1500);
}

function tutorialRuntimeFocusTarget(spec, options={}) {
  if (!spec) return false;
  try {
    const safe = options.adaptive === false ? null : tutorialRuntimeSafeViewport();
    const cameraOptions = { animate:true, zoom:Number(options.zoom) || 1.28 };
    if (safe && safe.point) cameraOptions.viewportPoint = safe.point;
    if (spec.type === "hex" && typeof cameraFocusHex === "function") return cameraFocusHex(spec.coord || spec.id, cameraOptions);
    if (spec.type === "hq" && typeof cameraFocusHQ === "function") return cameraFocusHQ(spec.side, { ...cameraOptions, zoom:Number(options.zoom) || 1.25 });
    if (spec.type === "unit" && typeof state !== "undefined" && state && Array.isArray(state.units) && typeof cameraFocusUnit === "function") {
      const unit = spec.uid ? state.units.find(item => item && item.uid === spec.uid) : state.units.find(item => item && item.alive && item.type !== "QG" && (!spec.side || item.side === Number(spec.side)) && (!spec.blueprintId || item.id === spec.blueprintId));
      return unit ? cameraFocusUnit(unit, { ...cameraOptions, zoom:Number(options.zoom) || 1.32 }) : false;
    }
    const target = tutorialRuntimeResolveTarget(spec);
    const boardHex = target && target.closest ? target.closest(".hex[data-coord-key]") : null;
    if (boardHex && typeof cameraFocusHex === "function") {
      return cameraFocusHex(boardHex.dataset.coordKey, cameraOptions);
    }
    if (target && typeof target.scrollIntoView === "function" && !target.closest("#boardVisualStack,#board")) {
      target.scrollIntoView({ behavior:"smooth", block:"center", inline:"center" });
      return true;
    }
  } catch (_) { /* focus best effort */ }
  return false;
}

function tutorialRuntimeNarrativePositionForStep(step) {
  if (!step || !step.message) return "bottom";
  if (step.message.position === "top" || step.message.position === "bottom") return step.message.position;
  if (step.id && /hand|card/.test(step.id)) return "top";
  const target = step.spotlight && step.spotlight.target ? tutorialRuntimeResolveTarget(step.spotlight.target) : null;
  const rect = target && typeof target.getBoundingClientRect === "function" ? target.getBoundingClientRect() : null;
  if (rect && rect.height > 0) return rect.top + rect.height / 2 >= window.innerHeight / 2 ? "top" : "bottom";
  return "bottom";
}

function tutorialRuntimeNarrativeForStep(step) {
  if (!step || !step.message || typeof narrativeOpen !== "function") return false;
  const informative = step.mode === TUTORIAL_STEP_MODES.INFORMATIVE;
  return narrativeOpen([step.message], {
    nonModal:true,
    position:tutorialRuntimeNarrativePositionForStep(step),
    showPrev:false,
    showRepeat:true,
    showClose:true,
    showNext:informative,
    closeLabel:"Esci",
    nextLabel:informative ? "Avanti" : "Continua",
    stepLabel:`Passo ${tutorialRuntimeState.stepIndex + 1}/${tutorialRuntimeState.scenario.steps.length}`,
    onRender:() => {
      tutorialRuntimeSchedule(() => {
        if (!tutorialRuntimeState.active || tutorialRuntimeState.step !== step) return;
        tutorialRuntimeApplyAttention(step);
        if (tutorialRuntimeStepNeedsAdaptiveFocus(step)) tutorialRuntimeFocusTarget(step.spotlight.target, { adaptive:true });
        tutorialRuntimePositionSpotlight();
      }, 30);
    },
    onClose:(_index, reason) => {
      if (tutorialRuntimeState.closing) return;
      if (reason === "complete" && informative) tutorialRuntimeCompleteStep("next");
      else if (reason === "manual") tutorialRuntimeAbort({ returnToTutorial:true, reason:"manual" });
    }
  });
}

function tutorialRuntimeMatchEvent(event, condition) {
  if (!event || !condition || condition.kind !== "event" || event.type !== condition.event) return false;
  const data = event.data || {};
  const expected = condition.match || {};
  for (const [key, value] of Object.entries(expected)) {
    if (data[key] !== value) return false;
  }
  return true;
}

function tutorialRuntimeHandleGameEvent(event) {
  let handled = false;
  const eventType = event && event.type ? event.type : "";
  const victoryType = typeof EventTypes !== "undefined" && EventTypes.VICTORY ? EventTypes.VICTORY : "VICTORY";
  // F9V3a: il tutorial runtime è già un subscriber globale degli eventi.
  // Usiamo questo punto per il Result Modal della partita normale, ma non durante
  // Tutorial/Challenge: quei flussi mostrano il proprio esito contestuale.
  if (eventType === victoryType && !tutorialChallengeRuntimeState.active && !tutorialRuntimeState.active) {
    arenaResultModalShowMatchVictoryF9V3a(event);
    handled = true;
  }
  if (tutorialChallengeRuntimeState.active) handled = tutorialRuntimeHandleChallengeGameEvent(event) || handled;
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step) return handled;
  const condition = tutorialRuntimeState.step.completeOn;
  if (!tutorialRuntimeMatchEvent(event, condition)) return handled;
  tutorialRuntimeSchedule(() => tutorialRuntimeCompleteStep(`event:${event.type}`), 0);
  return true;
}

function tutorialRuntimeElementAllowed(target) {
  if (!target || typeof target.closest !== "function") return false;
  if (target.closest(".narrativeDialog")) return true;
  return tutorialRuntimeState.allowedTargets.some(item => item === target || item.contains(target));
}

function tutorialRuntimeCaptureInteraction(event) {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step || tutorialRuntimeState.closing) return;
  if (!event.target || event.type !== "click") return;
  const step = tutorialRuntimeState.step;
  const inNarrative = Boolean(event.target.closest && event.target.closest(".narrativeDialog"));
  const allowed = tutorialRuntimeElementAllowed(event.target);
  const mustBlock = (step.mode === TUTORIAL_STEP_MODES.INFORMATIVE && !inNarrative)
    || ((step.mode === TUTORIAL_STEP_MODES.LOCKED || step.mode === TUTORIAL_STEP_MODES.GUIDED) && !allowed);
  if (mustBlock) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    tutorialRuntimeShowHint(step.wrongActionText || (step.mode === TUTORIAL_STEP_MODES.INFORMATIVE ? "Continua dal riquadro della lezione." : "Segui l'elemento evidenziato."));
    return;
  }
  if (allowed && step.completeOn && step.completeOn.kind === "click") {
    tutorialRuntimeState.lastAction = { kind:"click", stepId:step.id, at:Date.now() };
    tutorialRuntimeSchedule(() => tutorialRuntimeCompleteStep("click"), 0);
  }
}

function tutorialRuntimeActionMatch(condition, action, data={}) {
  if (!condition || condition.kind !== "action" || condition.action !== action) return { handled:false, matched:false };
  const expected = condition.match || {};
  for (const [key, value] of Object.entries(expected)) if (data[key] !== value) return { handled:true, matched:false, key, expected:value, actual:data[key] };
  return { handled:true, matched:true };
}

function tutorialRuntimeComparable(value) {
  if (Array.isArray(value)) return value.map(item => String(item)).join(",");
  if (value == null) return "";
  return String(value);
}

function tutorialRuntimeInteractionFieldMatches(expected, actual) {
  return tutorialRuntimeComparable(expected) === tutorialRuntimeComparable(actual);
}

function tutorialRuntimeExpectedInteraction(step=tutorialRuntimeState.step) {
  if (!step) return null;
  const completion = step.completeOn || null;
  if (completion && completion.kind === "action" && completion.action) {
    return { action:String(completion.action), match:{ ...(completion.match || {}) }, source:"completeOn" };
  }

  const target = step.spotlight && step.spotlight.target ? step.spotlight.target : null;
  if (!target) return null;
  if (target.type === "card") {
    const match = {};
    if (target.side != null) match.side = Number(target.side);
    if (target.cardId) match.cardId = String(target.cardId);
    return { action:"card_selected", match, source:"spotlight" };
  }
  if (target.type === "hex") {
    return { action:"cell_click", match:{ coord:Array.isArray(target.coord) ? [...target.coord] : target.coord }, source:"spotlight" };
  }
  if (target.type === "unit") {
    const match = {};
    if (target.side != null) match.side = Number(target.side);
    if (target.uid) match.uid = String(target.uid);
    if (target.blueprintId) match.blueprintId = String(target.blueprintId);
    return { action:"unit_click", match, source:"spotlight" };
  }
  if (target.type === "selector") {
    const selector = String(target.selector || "");
    const semanticTarget = tutorialRuntimeSemanticKeyForSelectorF9V3b(selector);
    if (semanticTarget === "hand_collapse") return { action:"hand_collapse", match:{}, source:"spotlight" };
    if (semanticTarget === "hand_show") return { action:"hand_show", match:{}, source:"spotlight" };
    if (semanticTarget === "end_turn") {
      const match = {};
      if (completion && completion.match && completion.match.player != null) match.player = Number(completion.match.player);
      return { action:"end_turn", match, source:"spotlight" };
    }
    if (semanticTarget === "ability_toggle") return { action:"ability_toggle", match:{}, source:"spotlight" };
  }
  return null;
}

function tutorialRuntimeInteractionMatch(expected, action, data={}) {
  if (!expected || expected.action !== action) return { matched:false, reason:"action", expected:expected && expected.action || null, actual:action };
  for (const [key, value] of Object.entries(expected.match || {})) {
    if (!tutorialRuntimeInteractionFieldMatches(value, data[key])) return { matched:false, reason:key, expected:value, actual:data[key] };
  }
  return { matched:true };
}

function tutorialRuntimeUnitForInteractionF9V3b(data={}) {
  if (!state || !Array.isArray(state.units)) return null;
  const uid = data.uid || data.unitUid || null;
  if (uid) {
    const byUid = state.units.find(unit => unit && unit.uid === uid);
    if (byUid) return byUid;
  }
  if (Array.isArray(data.coord)) {
    const byCoord = state.units.find(unit => unit && unit.alive && Array.isArray(unit.pos) && tutorialRuntimeInteractionFieldMatches(unit.pos, data.coord));
    if (byCoord) return byCoord;
  }
  const side = Number(data.side) || null;
  const blueprintId = data.blueprintId || data.unitId || null;
  if (blueprintId) {
    const byBlueprint = state.units.find(unit => unit && unit.alive && unit.id === blueprintId && (!side || Number(unit.side) === side));
    if (byBlueprint) return byBlueprint;
  }
  return null;
}

function tutorialRuntimeSelectedUnitF9V3b() {
  if (typeof getSelectedUnit === "function") {
    try { return getSelectedUnit(); } catch (_) {}
  }
  if (!state || !Array.isArray(state.units) || typeof selectedId === "undefined" || !selectedId) return null;
  return state.units.find(unit => unit && unit.uid === selectedId) || null;
}

function tutorialRuntimeSemanticActionForInteractionF9V3b(action, data={}) {
  const raw = String(action || "");
  if (!raw) return raw;
  if (TUTORIAL_ACTION_CONTRACT_F9V3B.semanticActions.includes(raw) && !["unit_click","cell_click"].includes(raw)) return raw;
  if (raw === "card_selected" || raw === "end_turn" || raw === "ability_toggle" || raw === "build_toggle" || raw === "pass_unit" || raw === "hand_collapse" || raw === "hand_show") return raw;

  const runtimeMode = typeof mode !== "undefined" ? String(mode || "idle") : "idle";
  if (raw === "cell_click") {
    if (runtimeMode === "spawn") return "deploy";
    if (runtimeMode === "build") return "build";
    if (runtimeMode === "move") return "move";
    if (runtimeMode === "ability") return "ability_target";
    if (runtimeMode === "tactic") return "tactic_target";
    return "cell_click";
  }

  if (raw === "unit_click") {
    if (runtimeMode === "ability") return "ability_target";
    if (runtimeMode === "tactic") return "tactic_target";
    const target = tutorialRuntimeUnitForInteractionF9V3b(data);
    const selected = tutorialRuntimeSelectedUnitF9V3b();
    if (selected && target && Number(selected.side) !== Number(target.side)) return "attack";
    if (target && state && Number(target.side) === Number(state.currentPlayer)) return "unit_select";
    return "unit_click";
  }
  return raw;
}

function tutorialRuntimeExpectedSemanticInteractionF9V3b(step=tutorialRuntimeState.step) {
  const expected = tutorialRuntimeExpectedInteraction(step);
  if (!expected) return null;
  return {
    ...expected,
    rawAction:expected.action,
    action:tutorialRuntimeSemanticActionForInteractionF9V3b(expected.action, expected.match || {}),
    semantic:true
  };
}

function tutorialRuntimeWithActionContractBypassF9V3b(callback) {
  tutorialActionContractBypassDepthF9V3b += 1;
  try { return callback(); }
  finally { tutorialActionContractBypassDepthF9V3b = Math.max(0, tutorialActionContractBypassDepthF9V3b - 1); }
}

function tutorialRuntimeActionDescriptorForEntrypointF9V3b(name, args=[]) {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step || tutorialRuntimeState.closing) return null;
  const player = state && Number(state.currentPlayer) || null;
  if (name === "handleCellClick") {
    const coord = Array.isArray(args[0]) ? [...args[0]] : args[0];
    const unit = state && Array.isArray(state.units) && Array.isArray(coord)
      ? state.units.find(candidate => candidate && candidate.alive && Array.isArray(candidate.pos) && tutorialRuntimeInteractionFieldMatches(candidate.pos, coord))
      : null;
    const rawAction = unit ? "unit_click" : "cell_click";
    const data = unit
      ? { coord, uid:unit.uid, side:unit.side, blueprintId:unit.id, player }
      : { coord, player };
    return { action:tutorialRuntimeSemanticActionForInteractionF9V3b(rawAction, data), data };
  }
  if (name === "endTurn") {
    const options = args[0] && typeof args[0] === "object" ? args[0] : {};
    const source = options.source ? String(options.source) : "runtime";
    if (options.tutorialBypass === true || ["auto","bot","tutorial_script"].includes(source)) return null;
    return { action:"end_turn", data:{ player, source } };
  }
  if (name === "beginStarterCardPurchase" || name === "beginHandCardPlay") {
    const cardUid = String(args[0] || "");
    let card = null;
    try {
      if (name === "beginStarterCardPurchase" && typeof starterCardByUid === "function") card = starterCardByUid(player, cardUid);
      if (name === "beginHandCardPlay" && typeof handCardByUid === "function") card = handCardByUid(player, cardUid);
    } catch (_) {}
    return {
      action:"card_selected",
      data:{ side:player, cardId:String(card && card.id || ""), cardUid:String(card && card.cardUid || cardUid), source:name === "beginStarterCardPurchase" ? "starter" : "hand" }
    };
  }
  if (name === "toggleAbilityMode") {
    const unit = args[0] || null;
    return { action:"ability_toggle", data:{ player, side:unit && unit.side, uid:unit && unit.uid, blueprintId:unit && unit.id, abilityName:unit && unit.ability && unit.ability.name || "" } };
  }
  if (name === "toggleBuildMode") {
    const unit = args[0] || null;
    return { action:"build_toggle", data:{ player, side:unit && unit.side, uid:unit && unit.uid, blueprintId:unit && unit.id } };
  }
  if (name === "passUnit") {
    const unit = args[0] || null;
    return { action:"pass_unit", data:{ player, side:unit && unit.side, uid:unit && unit.uid, blueprintId:unit && unit.id } };
  }
  return null;
}

function tutorialRuntimeInstallActionContractF9V3b() {
  const root = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : null);
  if (!root) return false;
  tutorialActionContractStateF9V3b.installCount += 1;
  tutorialActionContractStateF9V3b.lastInstallAt = Date.now();
  tutorialActionContractStateF9V3b.missing.clear();
  for (const name of TUTORIAL_ACTION_CONTRACT_F9V3B.guardedEntrypoints) {
    const current = root[name];
    if (typeof current !== "function") {
      tutorialActionContractStateF9V3b.missing.add(name);
      continue;
    }
    if (current.__arenaTutorialActionContractF9V3b === true) {
      tutorialActionContractStateF9V3b.wrapped.add(name);
      continue;
    }
    const original = current;
    const wrapped = function(...args) {
      const descriptor = tutorialRuntimeActionDescriptorForEntrypointF9V3b(name, args);
      if (!descriptor) return original.apply(this, args);
      const gate = tutorialRuntimeGateInteraction(descriptor.action, descriptor.data || {});
      if (gate && gate.handled && gate.allowed === false) return false;
      return tutorialRuntimeWithActionContractBypassF9V3b(() => original.apply(this, args));
    };
    wrapped.__arenaTutorialActionContractF9V3b = true;
    wrapped.__arenaTutorialActionContractOriginalF9V3b = original;
    root[name] = wrapped;
    tutorialActionContractStateF9V3b.wrapped.add(name);
  }
  return tutorialActionContractStateF9V3b.wrapped.size > 0;
}

function tutorialRuntimeActionContractScenarioAuditF9V3b() {
  const scenarios = typeof TUTORIAL_SCENARIOS_F9O6 !== "undefined" && TUTORIAL_SCENARIOS_F9O6
    ? Object.values(TUTORIAL_SCENARIOS_F9O6).filter(Boolean)
    : [];
  const errors = [];
  let totalSteps = 0;
  let interactiveSteps = 0;
  for (const scenario of scenarios) {
    const steps = Array.isArray(scenario.steps) ? scenario.steps : [];
    totalSteps += steps.length;
    for (const step of steps) {
      if (!step || ![TUTORIAL_STEP_MODES.LOCKED, TUTORIAL_STEP_MODES.GUIDED].includes(step.mode)) continue;
      interactiveSteps += 1;
      const target = step.spotlight && step.spotlight.target;
      if (!target) {
        errors.push(`${scenario.id}/${step.id || "?"}: step interattivo senza target`);
        continue;
      }
      if (["card","unit","hex","hq","ps","ui"].includes(target.type)) continue;
      if (target.type === "selector") {
        const completionAction = step.completeOn && step.completeOn.kind === "action" && step.completeOn.action;
        const semanticTarget = tutorialRuntimeSemanticKeyForSelectorF9V3b(target.selector || "");
        if (!completionAction && !semanticTarget) errors.push(`${scenario.id}/${step.id || "?"}: selector senza contratto semantico`);
        continue;
      }
      errors.push(`${scenario.id}/${step.id || "?"}: target interattivo non riconosciuto ${String(target.type || "unknown")}`);
    }
  }
  return {
    ok:errors.length === 0,
    schemaVersion:TUTORIAL_ACTION_CONTRACT_F9V3B.schemaVersion,
    scenarios:scenarios.length,
    totalSteps,
    interactiveSteps,
    errors
  };
}

function tutorialRuntimeActionContractDiagnosticsF9V3b() {
  return {
    schemaVersion:TUTORIAL_ACTION_CONTRACT_F9V3B.schemaVersion,
    guardedEntrypoints:[...TUTORIAL_ACTION_CONTRACT_F9V3B.guardedEntrypoints],
    wrapped:[...tutorialActionContractStateF9V3b.wrapped],
    missing:[...tutorialActionContractStateF9V3b.missing],
    installCount:tutorialActionContractStateF9V3b.installCount,
    lastInstallAt:tutorialActionContractStateF9V3b.lastInstallAt,
    semanticActions:[...TUTORIAL_ACTION_CONTRACT_F9V3B.semanticActions],
    scenarioAudit:tutorialRuntimeActionContractScenarioAuditF9V3b()
  };
}

function tutorialRuntimeGateInteraction(action, data={}) {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step) return { handled:false, allowed:true };
  if (tutorialActionContractBypassDepthF9V3b > 0 || (data && data.tutorialBypass === true)) {
    return { handled:true, allowed:true, bypass:true };
  }
  const step = tutorialRuntimeState.step;
  const expected = tutorialRuntimeExpectedSemanticInteractionF9V3b(step);
  const semanticAction = tutorialRuntimeSemanticActionForInteractionF9V3b(action, data);
  const blockedByPhase = tutorialRuntimeState.preparingStep || tutorialRuntimeState.closing;
  const result = blockedByPhase ? { matched:false, reason:"step_transition" } : tutorialRuntimeInteractionMatch(expected, semanticAction, data);
  const allowed = Boolean(!blockedByPhase && step.mode !== TUTORIAL_STEP_MODES.INFORMATIVE && expected && result.matched);
  if (!allowed) {
    if (!data || data.quiet !== true) tutorialRuntimeShowHint(step.wrongActionText || (step.mode === TUTORIAL_STEP_MODES.INFORMATIVE ? "Continua dal riquadro della lezione." : "Segui l’azione evidenziata."));
    tutorialRuntimeState.lastAction = {
      kind:"interaction-rejected",
      action,
      semanticAction,
      data,
      stepId:step.id,
      expected:expected ? { action:expected.action, rawAction:expected.rawAction || expected.action, match:{ ...(expected.match || {}) } } : null,
      reason:result.reason || (step.mode === TUTORIAL_STEP_MODES.INFORMATIVE ? "informative_step" : "no_expected_interaction"),
      at:Date.now()
    };
    return { handled:true, allowed:false, expected, semanticAction, reason:result.reason || "blocked" };
  }
  tutorialRuntimeState.lastAction = { kind:"interaction-allowed", action, semanticAction, data, stepId:step.id, at:Date.now() };
  return { handled:true, allowed:true, expected, semanticAction };
}

function tutorialRuntimeGateAction(action, data={}) {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step) return { handled:false, allowed:true };
  const result = tutorialRuntimeActionMatch(tutorialRuntimeState.step.completeOn, action, data);
  if (!result.handled) return { handled:false, allowed:true };
  if (!result.matched) {
    tutorialRuntimeShowHint(tutorialRuntimeState.step.wrongActionText || "Questa non è la scelta richiesta dal passo.");
    tutorialRuntimeState.lastAction = { kind:"action-rejected", action, data, stepId:tutorialRuntimeState.step.id, at:Date.now() };
    return { handled:true, allowed:false };
  }
  return { handled:true, allowed:true };
}

function tutorialRuntimeNotifyAction(action, data={}) {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step) return false;
  const result = tutorialRuntimeActionMatch(tutorialRuntimeState.step.completeOn, action, data);
  if (!result.handled || !result.matched) return false;
  tutorialRuntimeState.lastAction = { kind:"action", action, data, at:Date.now() };
  tutorialRuntimeSchedule(() => tutorialRuntimeCompleteStep(`action:${action}`), 0);
  return true;
}

function tutorialRuntimeShouldPauseBot() {
  return Boolean(tutorialRuntimeState.active && tutorialRuntimeState.botPaused);
}

function tutorialRuntimeSetBotPaused(paused=true) {
  tutorialRuntimeState.botPaused = Boolean(paused);
  if (state) {
    state.tutorialBotPaused = tutorialRuntimeState.botPaused;
    state.tutorialMode = true;
  }
  if (!tutorialRuntimeState.botPaused && typeof maybeRunBot === "function") maybeRunBot();
  return tutorialRuntimeState.botPaused;
}

function tutorialRuntimeCardInstance(cardId, side, index=0, zone="hand") {
  if (typeof cardById !== "function" || typeof createCardInstance !== "function") return null;
  const card = cardById(cardId, state && state.cardCatalog ? state.cardCatalog : null);
  return card ? createCardInstance(card, side, zone, index) : null;
}

function tutorialRuntimeFindUnit(spec={}) {
  if (!state || !Array.isArray(state.units)) return null;
  const side = Number(spec.side || spec.targetSide || 0) || null;
  const uid = spec.uid || spec.unitId || spec.targetUid || null;
  const blueprintId = spec.blueprintId || spec.attackerBlueprintId || spec.targetBlueprintId || null;
  return state.units.find(unit => unit && unit.alive && unit.type !== "QG"
    && (!uid || unit.uid === uid)
    && (!side || unit.side === side)
    && (!blueprintId || unit.id === blueprintId)) || null;
}

function tutorialRuntimeSpawnUnit(item) {
  if (!state || typeof BLUEPRINTS === "undefined" || typeof createUnitFromBlueprint !== "function") return false;
  const bp = BLUEPRINTS.find(entry => entry && entry.id === item.blueprintId);
  const coord = Array.isArray(item.coord) ? [...item.coord] : null;
  if (!bp || !coord || (typeof isInsideMap === "function" && !isInsideMap(coord))) return false;
  if (typeof getUnitAt === "function" && getUnitAt(coord)) return false;
  const unit = createUnitFromBlueprint(bp, Number(item.side) || 2);
  unit.pos = coord;
  unit.acted = item.acted !== false;
  if (Number.isFinite(Number(item.currentHp))) unit.currentHp = Math.max(0, Math.min(unit.maxHp, Number(item.currentHp)));
  if (Number.isFinite(Number(item.currentDef))) unit.currentDef = Math.max(0, Number(item.currentDef));
  if (Number.isFinite(Number(item.currentAtt))) unit.currentAtt = Math.max(0, Number(item.currentAtt));
  unit.spawnSource = "tutorial_scenario";
  state.units.push(unit);
  if (typeof updateControlFromOccupants === "function") updateControlFromOccupants();
  if (typeof emitGameEvent === "function" && typeof EventTypes !== "undefined") emitGameEvent({
    type:EventTypes.UNIT_SPAWNED,
    data:{ player:unit.side, faction:unit.faction, unitId:unit.uid, unitName:unit.name, blueprintId:unit.id, cost:0, coord:[...coord], exhausted:unit.acted, spawnSource:"tutorial_scenario" }
  });
  if (typeof renderAll === "function") renderAll();
  return unit;
}

function tutorialRuntimeGrantCard(item) {
  if (!state) return false;
  const side = Number(item.side) || 1;
  const zone = item.zone || "hand";
  if (!state[zone] || !Array.isArray(state[zone][side])) return false;
  const card = tutorialRuntimeCardInstance(item.cardId, side, state[zone][side].length, zone);
  if (!card) return false;
  state[zone][side].push(card);
  if (typeof syncCardDebugState === "function") syncCardDebugState();
  if (typeof emitGameEvent === "function" && typeof EventTypes !== "undefined" && zone === "hand") emitGameEvent({
    type:EventTypes.CARD_DRAWN,
    data:{ player:side, faction:state.factions && state.factions[side], cardId:card.id, cardUid:card.cardUid, cardName:card.name, source:"tutorial_scenario" }
  });
  if (typeof renderAll === "function") renderAll();
  return card;
}

function tutorialRuntimeApplyScenarioSetup(scenario) {
  if (!scenario || !scenario.setup || typeof newGame !== "function") return false;
  const setup = scenario.setup;
  const initiative = typeof document !== "undefined" ? document.getElementById("initiativeMode") : null;
  if (initiative) initiative.value = String(setup.firstPlayer || 1);
  if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.GAME);
  newGame({
    factions:{ ...(setup.factions || {1:"Exordium",2:"Nexus"}) },
    selectedCommanders:{ ...(setup.selectedCommanders || {}) },
    selectedDecks:{ ...(setup.selectedDecks || {1:{mode:"template"},2:{mode:"template"}}) },
    modes:{ ...(setup.modes || {1:"human",2:"human"}) },
    autoResignEnabled:setup.autoResignEnabled === true,
    aiMode:setup.aiMode || "advanced",
    pacePreset:setup.pacePreset || "competitive",
    gameScaleMode:setup.gameScaleMode || "tactical",
    tutorialMode:true,
    tutorialScenarioId:scenario.id,
    tutorialLessonId:scenario.lessonId || null,
    tutorialTitle:scenario.title || "Lezione guidata"
  });
  if (!state) return false;
  state.tutorialMode = true;
  state.tutorialScenarioId = scenario.id;
  state.tutorialLessonId = scenario.lessonId || null;
  state.tutorialBotPaused = true;
  state.autoResignEnabled = false;
  state.matchRecorded = false;
  state.energy = { ...state.energy, ...(setup.energy || {}) };
  for (const side of [1,2]) {
    if (setup.starterCardsEnabled === false && state.starterCards) state.starterCards[side] = {};
    if (setup.hand && Array.isArray(setup.hand[side])) {
      state.hand[side] = setup.hand[side].map((cardId,index) => tutorialRuntimeCardInstance(cardId, side, index, "hand")).filter(Boolean);
    }
    if (setup.deck && Array.isArray(setup.deck[side])) {
      state.deck[side] = setup.deck[side].map((cardId,index) => tutorialRuntimeCardInstance(cardId, side, index, "deck")).filter(Boolean);
    }
    if (setup.discard && Array.isArray(setup.discard[side])) {
      state.discard[side] = setup.discard[side].map((cardId,index) => tutorialRuntimeCardInstance(cardId, side, index, "discard")).filter(Boolean);
    }
  }
  if (typeof syncCardDebugState === "function") syncCardDebugState();
  if (typeof resetInteractionContext === "function") resetInteractionContext();
  if (typeof renderAll === "function") renderAll();
  tutorialRuntimeSetBotPaused(true);
  return true;
}

function tutorialRuntimeStepAt(index) {
  const steps = tutorialRuntimeState.scenario && Array.isArray(tutorialRuntimeState.scenario.steps) ? tutorialRuntimeState.scenario.steps : [];
  return steps[index] || null;
}

function tutorialRuntimeExecuteCommand(command) {
  const item = typeof command === "string" ? { action:command } : (command || {});
  switch (item.action) {
    case "collapse_hand":
      return typeof mapHandOverlayCollapse === "function" ? mapHandOverlayCollapse() : false;
    case "show_hand":
      return typeof mapHandOverlayShowHand === "function" ? mapHandOverlayShowHand() : false;
    case "pause_bot":
      return tutorialRuntimeSetBotPaused(true);
    case "resume_bot":
      return tutorialRuntimeSetBotPaused(false);
    case "set_energy": {
      const side = Number(item.side) || 1;
      if (!state || !state.energy || !Number.isFinite(Number(item.value))) return false;
      state.energy[side] = Number(item.value);
      if (typeof renderAll === "function") renderAll();
      return true;
    }
    case "relocate_unit": {
      const unit = tutorialRuntimeFindUnit(item);
      const coord = Array.isArray(item.coord) ? [...item.coord] : null;
      if (!unit || !coord || (typeof isInsideMap === "function" && !isInsideMap(coord))) return false;
      const occupant = typeof getUnitAt === "function" ? getUnitAt(coord) : null;
      if (occupant && occupant.uid !== unit.uid) return false;
      unit.pos = coord;
      if (typeof item.acted === "boolean") unit.acted = item.acted;
      if (typeof updateControlFromOccupants === "function") updateControlFromOccupants();
      if (typeof resetInteractionContext === "function") resetInteractionContext();
      if (typeof renderAll === "function") renderAll();
      return unit;
    }
    case "spawn_unit":
      return tutorialRuntimeSpawnUnit(item);
    case "grant_card":
      return tutorialRuntimeGrantCard(item);
    case "pass_turn": {
      if (!state || typeof endTurn !== "function") return false;
      if (item.side && Number(item.side) !== Number(state.currentPlayer)) return false;
      endTurn({ source:"tutorial_script", tutorialBypass:true });
      return true;
    }
    case "script_attack_and_end_turn": {
      if (!state || typeof attackUnit !== "function" || typeof endTurn !== "function") return false;
      if (item.side && Number(item.side) !== Number(state.currentPlayer)) return false;
      const attacker = tutorialRuntimeFindUnit({ side:item.side, blueprintId:item.attackerBlueprintId, uid:item.attackerUid });
      const target = tutorialRuntimeFindUnit({ side:item.targetSide, blueprintId:item.targetBlueprintId, uid:item.targetUid });
      if (!attacker || !target) return false;
      attacker.acted = false;
      attacker.attacksMade = 0;
      attackUnit(attacker, target);
      if (attacker.alive && typeof endUnitAction === "function") endUnitAction(attacker);
      if (!state.winner) endTurn({ source:"tutorial_script", tutorialBypass:true });
      return true;
    }
    default:
      return false;
  }
}

function tutorialRuntimeRunCommands(commands) {
  const list = Array.isArray(commands) ? commands : (commands ? [commands] : []);
  return list.map(tutorialRuntimeExecuteCommand);
}

function tutorialRuntimeEnterStep(index) {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.scenario) return false;
  const step = tutorialRuntimeStepAt(index);
  if (!step) return tutorialRuntimeFinish();
  tutorialRuntimeCancelTimer(tutorialRuntimeState.retryTimer);
  tutorialRuntimeState.retryTimer = null;
  tutorialRuntimeState.stepToken += 1;
  const sessionToken = tutorialRuntimeState.sessionToken;
  const stepToken = tutorialRuntimeState.stepToken;
  tutorialRuntimeState.stepIndex = index;
  tutorialRuntimeState.step = step;
  tutorialRuntimeState.preparingStep = true;
  tutorialRuntimeState.targetRecoveryCount = 0;
  tutorialRuntimeState.closing = true;
  if (typeof narrativeClose === "function") narrativeClose("tutorial-step-change");
  tutorialRuntimeState.closing = false;
  tutorialRuntimeHideSpotlight();
  tutorialRuntimeRunCommands(step.onEnter);
  tutorialRuntimeApplyStepUiState(step, { force:true });

  let attempts = 0;
  const renderStep = () => {
    if (!tutorialRuntimeState.active || tutorialRuntimeState.sessionToken !== sessionToken || tutorialRuntimeState.stepToken !== stepToken || tutorialRuntimeState.step !== step) return;
    attempts += 1;
    const targetRequired = Boolean(step.spotlight && step.spotlight.target);
    const target = targetRequired ? tutorialRuntimeResolveTarget(step.spotlight.target) : null;
    if (targetRequired && !target) {
      if (attempts === 6 || attempts === 15) {
        tutorialRuntimeState.targetRecoveryCount += 1;
        tutorialRuntimeApplyStepUiState(step, { force:true });
      }
      if (attempts < 30) {
        tutorialRuntimeState.retryTimer = tutorialRuntimeSchedule(renderStep, 80, { sessionToken, stepToken });
        return;
      }
      tutorialRuntimeState.preparingStep = false;
      return tutorialRuntimeAbortForMissingTarget(step);
    }
    tutorialRuntimeState.preparingStep = false;
    tutorialRuntimeNarrativeForStep(step);
    tutorialRuntimeShowSpotlight(step);
    tutorialRuntimeSetStatus(`${tutorialRuntimeState.scenario.title} · passo ${index + 1}/${tutorialRuntimeState.scenario.steps.length}`);
  };
  tutorialRuntimeState.retryTimer = tutorialRuntimeSchedule(renderStep, step.focus ? 220 : 20, { sessionToken, stepToken });
  return true;
}

function tutorialRuntimeCompleteStep(source="runtime") {
  if (!tutorialRuntimeState.active || !tutorialRuntimeState.step || tutorialRuntimeState.closing) return false;
  const current = tutorialRuntimeState.step;
  tutorialRuntimeState.closing = true;
  if (current.checkpoint) tutorialRuntimeSaveProgress({ nextStepIndex:tutorialRuntimeState.stepIndex + 1, includeSnapshot:true });
  tutorialRuntimeHideSpotlight();
  if (typeof narrativeClose === "function") narrativeClose("tutorial-step-complete");
  const nextIndex = tutorialRuntimeState.stepIndex + 1;
  tutorialRuntimeState.closing = false;
  tutorialRuntimeState.lastAction = { kind:"complete", source, stepId:current.id, at:Date.now() };
  if (nextIndex >= tutorialRuntimeState.scenario.steps.length) return tutorialRuntimeFinish();
  return tutorialRuntimeEnterStep(nextIndex);
}

function tutorialRuntimeStartScenario(id, options={}) {
  // F9V3b: installazione lazy dopo il caricamento del core. È intenzionale:
  // tutorial_runtime.js viene caricato prima di turns/controller/deployment.
  tutorialRuntimeInstallActionContractF9V3b();
  const scenario = tutorialRuntimeScenarioById(id);
  if (!scenario) {
    tutorialRuntimeSetStatus(`Scenario tutorial non trovato: ${id}`);
    return false;
  }
  tutorialRuntimeAbort({ silent:true, keepScreen:true, reason:"restart" });
  tutorialRuntimeState.sessionToken += 1;
  tutorialRuntimeState.stepToken = 0;
  tutorialRuntimeState.active = true;
  tutorialRuntimeState.scenario = scenario;
  tutorialRuntimeState.scenarioId = scenario.id;
  tutorialRuntimeState.stepIndex = 0;
  tutorialRuntimeState.step = null;
  tutorialRuntimeState.botPaused = true;
  tutorialRuntimeState.preparingStep = false;
  if (typeof document !== "undefined" && document.body) document.body.classList.add("tutorial-runtime-active");
  tutorialRuntimePortalCardPreviews();
  if (!tutorialRuntimeApplyScenarioSetup(scenario)) {
    tutorialRuntimeAbort({ returnToTutorial:true, reason:"setup-failed" });
    return false;
  }
  const progress = options.resume ? tutorialRuntimeProgressForScenario(scenario.id) : null;
  const startIndex = progress && !progress.completed && Number.isFinite(progress.nextStepIndex)
    ? Math.max(0, Math.min(progress.nextStepIndex, scenario.steps.length - 1))
    : 0;
  if (progress && progress.snapshot) tutorialRuntimeRestoreGameSnapshot(progress.snapshot);
  tutorialRuntimeNormalizeTransientUi({ hand:"open" });
  tutorialRuntimeSaveProgress({ nextStepIndex:startIndex, completed:false });
  tutorialRuntimeEnterStep(startIndex);
  return true;
}

function tutorialRuntimeFinish() {
  if (!tutorialRuntimeState.scenarioId) return false;
  tutorialRuntimeSaveProgress({ nextStepIndex:tutorialRuntimeState.scenario.steps.length, completed:true });
  tutorialRuntimeState.closing = true;
  tutorialRuntimeHideSpotlight();
  if (typeof narrativeClose === "function") narrativeClose("tutorial-finished");
  tutorialRuntimeState.closing = false;
  tutorialRuntimeState.active = false;
  tutorialRuntimeState.botPaused = false;
  if (state) state.tutorialBotPaused = false;
  if (typeof document !== "undefined" && document.body) document.body.classList.remove("tutorial-runtime-active");
  tutorialRuntimeRestoreCardPreviews();
  const lessonPlanItem = typeof TUTORIAL_LESSON_PLAN_F9O6 !== "undefined" ? TUTORIAL_LESSON_PLAN_F9O6.find(item => item && item.id === (tutorialRuntimeState.scenario && tutorialRuntimeState.scenario.lessonId)) : null;
  const completionMessage = lessonPlanItem && lessonPlanItem.title ? lessonPlanItem.title : (tutorialRuntimeState.scenario && tutorialRuntimeState.scenario.title || "Lezione guidata");
  // F9V3a: niente ritorno automatico. Il campo resta visibile finché il giocatore
  // sceglie Accademia, Menu, Nuova partita oppure apre i dati della sessione.
  arenaResultModalShowLessonCompleteF9V3a(completionMessage);
  return true;
}

function tutorialRuntimeAbort(options={}) {
  const wasActive = tutorialRuntimeState.active;
  tutorialRuntimeState.closing = true;
  tutorialRuntimeInvalidateAsync();
  tutorialRuntimeHideSpotlight();
  if (typeof narrativeClose === "function") narrativeClose("tutorial-abort");
  tutorialRuntimeState.active = false;
  tutorialRuntimeState.botPaused = false;
  tutorialRuntimeState.preparingStep = false;
  tutorialRuntimeState.step = null;
  tutorialRuntimeState.target = null;
  tutorialRuntimeState.allowedTargets = [];
  tutorialRuntimeState.closing = false;
  if (state) state.tutorialBotPaused = false;
  if (typeof document !== "undefined" && document.body) document.body.classList.remove("tutorial-runtime-active");
  tutorialRuntimeRestoreCardPreviews();
  if (!options.silent && options.returnToTutorial !== false && !options.keepScreen) {
    if (typeof setAppScreen === "function" && typeof ARENA_APP_SCREENS !== "undefined") setAppScreen(ARENA_APP_SCREENS.TUTORIAL);
    tutorialRuntimeRenderMenu();
    const message = options.reason === "manual"
      ? "Tutorial interrotto. Il checkpoint resta disponibile."
      : options.reason === "target-missing"
        ? "Il passaggio non era disponibile. L’interfaccia è stata liberata: riprendi dal checkpoint oppure riavvia la lezione."
        : "Tutorial chiuso.";
    tutorialRuntimeSetStatus(message);
  }
  return wasActive;
}

function tutorialRuntimeDiagnostics() {
  return {
    active:tutorialRuntimeState.active,
    scenarioId:tutorialRuntimeState.scenarioId,
    stepIndex:tutorialRuntimeState.stepIndex,
    stepId:tutorialRuntimeState.step && tutorialRuntimeState.step.id || null,
    stepMode:tutorialRuntimeState.step && tutorialRuntimeState.step.mode || null,
    desiredHandState:tutorialRuntimeDesiredHandState(tutorialRuntimeState.step),
    actualHandState:tutorialRuntimeHandStateFromDom(),
    preparingStep:tutorialRuntimeState.preparingStep,
    sessionToken:tutorialRuntimeState.sessionToken,
    stepToken:tutorialRuntimeState.stepToken,
    targetRecoveryCount:tutorialRuntimeState.targetRecoveryCount,
    targetResolved:Boolean(tutorialRuntimeState.target && tutorialRuntimeState.target.isConnected),
    allowedTargets:tutorialRuntimeState.allowedTargets.length,
    previewPortals:tutorialRuntimeState.previewPortals.length,
    botPaused:tutorialRuntimeState.botPaused,
    progress:tutorialRuntimeState.scenarioId ? tutorialRuntimeProgressForScenario(tutorialRuntimeState.scenarioId) : null,
    expectedInteraction:tutorialRuntimeExpectedInteraction(tutorialRuntimeState.step),
    expectedSemanticInteraction:tutorialRuntimeExpectedSemanticInteractionF9V3b(tutorialRuntimeState.step),
    actionContract:tutorialRuntimeActionContractDiagnosticsF9V3b(),
    lastAction:tutorialRuntimeState.lastAction
  };
}

function tutorialRuntimeInit() {
  tutorialRuntimeRegisterPortraits();
  tutorialRuntimeInstallActionContractF9V3b();
  tutorialRuntimeEnsureSpotlightDom();
  if (typeof document !== "undefined") {
    document.addEventListener("click", tutorialRuntimeCaptureInteraction, true);
    window.addEventListener("resize", tutorialRuntimePositionSpotlight, { passive:true });
    window.addEventListener("scroll", tutorialRuntimePositionSpotlight, { passive:true, capture:true });
  }
  tutorialRuntimeRenderMenu();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tutorialRuntimeInit, { once:true });
  else tutorialRuntimeInit();
}
