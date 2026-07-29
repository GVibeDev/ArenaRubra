"use strict";

// Arena Rubra – F9U1a Map HUD Layout Foundation.
// UI-only: dock sinistro permanente, rimozione barra inferiore legacy e menu Debug.
// Non modifica stato logico, regole, AI, deck, carte, mappe o telemetria.

const F9U1A_UI_STATE = {
  debugOpen: false,
  initialized: false
};

function f9u1aDebugMenuElement() {
  return typeof document !== "undefined" ? document.getElementById("gameDebugMenu") : null;
}

function f9u1aDebugButtons() {
  if (typeof document === "undefined") return [];
  return [document.getElementById("gameDebugBtn"), document.getElementById("gameDebugHeaderBtn")].filter(Boolean);
}

function f9u1aSetDebugMenuOpen(open) {
  const menu = f9u1aDebugMenuElement();
  F9U1A_UI_STATE.debugOpen = Boolean(open && menu);
  if (menu) menu.hidden = !F9U1A_UI_STATE.debugOpen;
  for (const button of f9u1aDebugButtons()) {
    button.setAttribute("aria-expanded", F9U1A_UI_STATE.debugOpen ? "true" : "false");
    button.classList.toggle("active", F9U1A_UI_STATE.debugOpen);
  }
  if (typeof document !== "undefined" && document.body) {
    document.body.classList.toggle("game-debug-menu-open", F9U1A_UI_STATE.debugOpen);
  }
}

function f9u1aToggleDebugMenu() {
  f9u1aSetDebugMenuOpen(!F9U1A_UI_STATE.debugOpen);
}

function f9u1aFocusTelemetryPanel() {
  const details = typeof document !== "undefined" ? document.querySelector("#matchTelemetryPanel") : null;
  if (!details) return;
  const parent = details.closest ? details.closest("details") : null;
  if (parent) parent.open = true;
  window.requestAnimationFrame(() => {
    if (typeof details.scrollIntoView === "function") details.scrollIntoView({ block:"start", inline:"nearest", behavior:"auto" });
  });
}

function f9u1aOpenDebugAction(action) {
  const key = String(action || "").trim();
  f9u1aSetDebugMenuOpen(false);

  if (key === "hand") {
    if (typeof closeGamePanel === "function") closeGamePanel();
    if (typeof mapHandOverlayShowHand === "function") mapHandOverlayShowHand();
    if (typeof gameScrollToElement === "function") gameScrollToElement("boardWrap");
    return true;
  }
  if (key === "log") {
    if (typeof setLogDockCollapsed === "function") setLogDockCollapsed(false);
    if (typeof openGamePanel === "function") openGamePanel("log", { focusId:"log" });
    return true;
  }
  if (key === "stats") {
    const details = typeof document !== "undefined" ? document.getElementById("statsDetails") : null;
    if (details) details.open = true;
    if (typeof openGamePanel === "function") openGamePanel("stats", { focusId:"currentMatchStatsPanel" });
    return true;
  }
  if (key === "telemetry") {
    const details = typeof document !== "undefined" ? document.getElementById("statsDetails") : null;
    if (details) details.open = true;
    if (typeof openGamePanel === "function") openGamePanel("stats", { focusId:"matchTelemetryPanel" });
    window.requestAnimationFrame(f9u1aFocusTelemetryPanel);
    return true;
  }
  return false;
}

function f9u1aRefreshDebugMetadata() {
  if (typeof document === "undefined") return;
  const build = document.getElementById("gameDebugBuildLabel");
  const schema = document.getElementById("gameDebugSchemaLabel");
  if (build) build.textContent = typeof buildInfoLabel === "function" ? buildInfoLabel() : "—";
  if (schema) {
    const value = typeof MATCH_TELEMETRY_SCHEMA_VERSION !== "undefined" ? MATCH_TELEMETRY_SCHEMA_VERSION : "F9Q3e1-2";
    schema.textContent = `Schema telemetrico: ${value}`;
  }
}

function initializeF9U1aUi() {
  if (typeof document === "undefined" || F9U1A_UI_STATE.initialized) return;
  F9U1A_UI_STATE.initialized = true;

  for (const button of f9u1aDebugButtons()) {
    if (button.dataset.f9u1aBound === "1") continue;
    button.dataset.f9u1aBound = "1";
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      f9u1aToggleDebugMenu();
    });
  }

  const close = document.getElementById("closeGameDebugMenuBtn");
  if (close && close.dataset.f9u1aBound !== "1") {
    close.dataset.f9u1aBound = "1";
    close.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      f9u1aSetDebugMenuOpen(false);
    });
  }

  const menu = f9u1aDebugMenuElement();
  if (menu && menu.dataset.f9u1aBound !== "1") {
    menu.dataset.f9u1aBound = "1";
    menu.addEventListener("click", event => {
      const button = event.target && event.target.closest ? event.target.closest("button[data-game-debug-action]") : null;
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      f9u1aOpenDebugAction(button.dataset.gameDebugAction);
    });
  }

  document.addEventListener("click", event => {
    if (!F9U1A_UI_STATE.debugOpen) return;
    const menuNode = f9u1aDebugMenuElement();
    const clickedButton = f9u1aDebugButtons().some(button => button.contains(event.target));
    if (clickedButton || (menuNode && menuNode.contains(event.target))) return;
    f9u1aSetDebugMenuOpen(false);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && F9U1A_UI_STATE.debugOpen) {
      event.preventDefault();
      f9u1aSetDebugMenuOpen(false);
    }
  });

  f9u1aRefreshDebugMetadata();
  f9u1aSetDebugMenuOpen(false);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeF9U1aUi, { once:true });
  else initializeF9U1aUi();
}
