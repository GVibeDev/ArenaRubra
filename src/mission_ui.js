"use strict";

// Arena Rubra – F9N10 Mission UI visibile e ciclo recuperabile.
// Missioni giocabili su cicli multipli, con recupero e gestione IA.

const MISSION_UI_STATE = {
  selectedSide: 0,
  revealPendingSide: 0,
  playPendingSide: 0,
  lastOpenedAt: null,
  renderRevision: 0,
  lastInvalidationReason: "startup"
};

const MISSION_UI_RENDER_EVENT_TYPES = new Set([
  "MISSION_PROGRESS_CHANGED",
  "MISSION_READY",
  "MISSION_CHECKPOINT",
  "MISSION_REVEALED",
  "MISSION_PLAYED",
  "MISSION_REWARD_PENDING",
  "MISSION_REWARD_RESOLVED",
  "MISSION_CYCLE_RESET",
  "MISSION_RECOVERY_LOCKED",
  "MISSION_UNLOCKED",
  "DECK_RECOVERED",
  "CARD_BLOCKED",
  "CARD_UNBLOCKED"
]);

function missionUiInvalidate(reason="manual") {
  MISSION_UI_STATE.renderRevision = Number(MISSION_UI_STATE.renderRevision || 0) + 1;
  MISSION_UI_STATE.lastInvalidationReason = String(reason || "manual");
  if (typeof document !== "undefined") {
    for (const id of ["mapHandOverlay", "cardZonePanel", "mapActionDock"]) {
      const node = document.getElementById(id);
      if (node && node.dataset) delete node.dataset.renderSignature;
    }
  }
  return MISSION_UI_STATE.renderRevision;
}

function missionUiHandleGameEvent(event) {
  const type = event && event.type ? String(event.type) : "";
  if (!MISSION_UI_RENDER_EVENT_TYPES.has(type)) return false;
  missionUiInvalidate(`event:${type}`);
  return true;
}

function missionUiSignatureValue(value) {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number" || typeof value === "string") return String(value);
  try { return JSON.stringify(value); }
  catch (_err) { return String(value); }
}

function missionUiPendingRewardSignature() {
  const pending = typeof missionPendingReward === "function"
    ? missionPendingReward()
    : (typeof state !== "undefined" && state ? state.missionPendingReward : null);
  if (!pending) return "none";
  const groups = Array.isArray(pending.groups)
    ? pending.groups.map(group => [
        group && group.key || "",
        group && group.required || 0,
        group && group.wasted || 0,
        Array.isArray(group && group.selectedUids) ? group.selectedUids.slice().sort().join(",") : ""
      ].join("~")).join("|")
    : "";
  return [
    pending.kind || "",
    pending.side || pending.player || pending.chooserSide || 0,
    pending.missionId || "",
    pending.multiplier || 1,
    pending.required || 0,
    pending.remaining || pending.repeatAttacksRemaining || 0,
    pending.attackerUid || "",
    pending.defenderUid || "",
    Array.isArray(pending.selectedUids) ? pending.selectedUids.slice().sort().join(",") : "",
    Array.isArray(pending.targetSides) ? pending.targetSides.slice().sort((a,b)=>a-b).join(",") : "",
    groups
  ].join("^");
}

function missionUiRenderSignature(side) {
  const runtime = missionUiRuntime(side);
  if (!runtime || !runtime.active) {
    return [
      "mission-absent",
      side,
      MISSION_UI_STATE.selectedSide || 0,
      MISSION_UI_STATE.revealPendingSide || 0,
      MISSION_UI_STATE.playPendingSide || 0,
      MISSION_UI_STATE.renderRevision || 0,
      missionUiPendingRewardSignature()
    ].join("¦");
  }
  const definition = missionUiDefinition(side);
  const items = definition && typeof missionObjectivesFor === "function" ? missionObjectivesFor(definition) : [];
  const orderedIds = items.map(item => String(item && item.id || "")).filter(Boolean);
  const extraIds = Object.keys(runtime.entries || {}).filter(id => !orderedIds.includes(id)).sort();
  const entrySignature = orderedIds.concat(extraIds).map(id => {
    const entry = runtime.entries && runtime.entries[id] ? runtime.entries[id] : null;
    return [
      id,
      entry && missionUiSignatureValue(entry.current),
      entry && missionUiSignatureValue(entry.target),
      entry && Number(entry.streak || 0),
      entry && entry.satisfied ? 1 : 0,
      entry && entry.completed ? 1 : 0,
      entry && missionUiSignatureValue(entry.detail)
    ].join("~");
  }).join("|");
  const card = missionUiCardForSide(side);
  const blocked = typeof handCardBlocked === "function" && card ? (handCardBlocked(card) ? 1 : 0) : 0;
  return [
    "mission",
    side,
    runtime.missionId || "",
    runtime.missionClass || "",
    runtime.cycle || 1,
    runtime.status || "",
    runtime.played ? 1 : 0,
    runtime.revealed ? 1 : 0,
    runtime.rewardPending ? 1 : 0,
    runtime.ready ? 1 : 0,
    Number(runtime.readyCount || 0),
    runtime.recoveryLocked ? 1 : 0,
    Number(runtime.unlockAtOwnerTurnStarted || 0),
    blocked,
    missionUiBlockedReason(side),
    entrySignature,
    MISSION_UI_STATE.selectedSide || 0,
    MISSION_UI_STATE.revealPendingSide || 0,
    MISSION_UI_STATE.playPendingSide || 0,
    MISSION_UI_STATE.renderRevision || 0,
    missionUiPendingRewardSignature()
  ].join("¦");
}

function missionUiEscape(value) {
  if (typeof escapeHtml === "function") return escapeHtml(value == null ? "" : String(value));
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function missionUiIsMissionCard(card) {
  return Boolean(card && (card.sourceType === "mission" || card.cardType === "mission" || card.deckRole === "mission"));
}

function missionUiCardForSide(side) {
  return typeof missionCardForSide === "function" ? missionCardForSide(side) : null;
}

function missionUiRuntime(side) {
  return typeof missionRuntime === "function" ? missionRuntime(side) : (state && state.missions ? state.missions[side] : null);
}

function missionUiDefinition(side) {
  const runtime = missionUiRuntime(side);
  return runtime && typeof missionDefinitionById === "function" ? missionDefinitionById(runtime.missionId) : null;
}

function missionUiIsRevealed(side) {
  const runtime = missionUiRuntime(side);
  const card = missionUiCardForSide(side);
  return Boolean((runtime && runtime.revealed) || (card && card.missionRevealed === true));
}

function missionUiOwnerHasPrivateView(side) {
  return Boolean(
    state &&
    state.currentPlayer === side &&
    state.modes &&
    state.modes[side] === "human"
  );
}

function missionUiCanViewDetails(viewerSide, ownerSide) {
  // F9N7a: privacy rimossa per la versione digitale. Missioni e progressi
  // sono sempre leggibili, indipendentemente dal giocatore corrente.
  return Boolean(state && Number(ownerSide) > 0);
}

function missionUiBlockedReason(side) {
  if (!state) return "Partita non inizializzata";
  const card = missionUiCardForSide(side);
  if (!card) return "Missione assente";
  if (state.winner) return "Partita conclusa";
  if (typeof missionIsRecoveryLocked === "function" && missionIsRecoveryLocked(side)) return "Missione recuperata: sarà utilizzabile dal prossimo turno personale";
  if (typeof playerHandLocked === "function" && playerHandLocked(side)) return "Mano bloccata";
  if (state.handLocked && Number(state.handLocked[side] || 0) > 0) return "Mano bloccata";
  if (typeof handCardBlocked === "function" && handCardBlocked(card)) {
    return typeof handCardBlockReason === "function" ? handCardBlockReason(card) : "Carta bloccata";
  }
  return "";
}

function missionUiStatus(side) {
  const runtime = missionUiRuntime(side);
  if (!runtime || !runtime.active) return { key:"absent", label:"Nessuna Missione", detail:"Il deck non contiene una Missione." };
  if (runtime.played) {
    if (runtime.rewardPending) return { key:"reward_pending", label:"SCELTA RICOMPENSA", detail:"La Missione è stata giocata: completa la scelta richiesta dalla ricompensa." };
    return { key:"resolved", label:"RISOLTA", detail:"Missione giocata e ricompensa risolta in questo ciclo." };
  }
  const blocked = missionUiBlockedReason(side);
  if (blocked) return { key:"blocked", label:"BLOCCATA", detail:blocked };
  if (runtime.ready) {
    const multiplier = runtime.missionClass === "desperate" ? ` · ×${Math.max(1, runtime.readyCount || 1)}` : "";
    return { key:"ready", label:`PRONTA${multiplier}`, detail:"Le condizioni necessarie risultano soddisfatte." };
  }
  return { key:"tracking", label:"IN CORSO", detail:"Il tracker sta verificando gli obiettivi." };
}

function missionUiPlayCheck(side, card=null, options={}) {
  const runtime = missionUiRuntime(side);
  if (!runtime || !runtime.active) return { ok:false, reason:"Missione assente" };
  return runtime.missionClass === "desperate"
    ? (typeof missionCanPlayDesperate === "function" ? missionCanPlayDesperate(side, card, options) : { ok:false, reason:"Runtime Missione disperata non disponibile" })
    : (typeof missionCanPlayOrdinary === "function" ? missionCanPlayOrdinary(side, card, options) : { ok:false, reason:"Runtime Missione ordinaria non disponibile" });
}

function missionUiActivateCard(side, options={}) {
  const runtime = missionUiRuntime(side);
  if (!runtime || !runtime.active || !missionUiOwnerHasPrivateView(side)) return false;
  const check = missionUiPlayCheck(side, options.card || null);
  MISSION_UI_STATE.selectedSide = side;
  MISSION_UI_STATE.revealPendingSide = 0;
  if (check.ok) {
    MISSION_UI_STATE.playPendingSide = side;
  } else {
    MISSION_UI_STATE.playPendingSide = 0;
  }
  MISSION_UI_STATE.lastOpenedAt = new Date().toISOString();
  missionUiInvalidate("activate_card");
  if (typeof renderAll === "function") renderAll();
  return true;
}

function missionUiCompactPanelHtml(side) {
  const runtime = missionUiRuntime(side);
  if (!runtime || !runtime.active) return `<section class="mapMissionCompact mapMissionCompact-absent"><div class="mapMissionCompactHeader"><strong>Missione</strong><span>FACOLTATIVA · assente</span></div></section>`;
  const definition = missionUiDefinition(side);
  const items = definition && typeof missionObjectivesFor === "function" ? missionObjectivesFor(definition) : [];
  const status = missionUiStatus(side);
  const check = missionUiPlayCheck(side, null, { evaluate:false, source:"ui_render_compact" });
  const pending = MISSION_UI_STATE.playPendingSide === side;
  const rows = items.map((item, index) => {
    const entry = runtime.entries && runtime.entries[item.id];
    const done = Boolean(entry && entry.completed);
    const active = Boolean(entry && entry.satisfied);
    const icon = done ? "✓" : (active ? "●" : "○");
    const progress = missionUiProgressText(item, entry);
    return `<div class="mapMissionCompactRow${done ? " completed" : active ? " active" : ""}" title="${missionUiEscape(item.text || "")}"><span class="mapMissionCompactIcon">${icon}</span><span class="mapMissionCompactText">${index + 1}. ${missionUiEscape(item.text || `Obiettivo ${index + 1}`)}</span><span class="mapMissionCompactValue">${missionUiEscape(progress)}</span></div>`;
  }).join("");
  let controls = `<span class="mapMissionCompactReason">${missionUiEscape(check.reason || status.detail || "")}</span>`;
  if (missionUiOwnerHasPrivateView(side) && !runtime.played) {
    if (pending) {
      controls = `<div class="mapMissionCompactConfirm"><span>Giocare “${missionUiEscape(runtime.missionName)}”?</span><button class="ghost" type="button" onclick="missionUiCancelPlay()">Annulla</button><button type="button" onclick="missionUiConfirmPlay(${side})">Conferma</button></div>`;
    } else {
      const multiplier = runtime.missionClass === "desperate" ? ` ×${Math.max(1, runtime.readyCount || 1)}` : "";
      controls = `<div class="mapMissionCompactActions"><span class="mapMissionCompactReason">${missionUiEscape(check.reason || status.detail || "")}</span><button type="button" onclick="missionUiRequestPlay(${side})"${check.ok ? "" : " disabled"}>Gioca${multiplier}</button></div>`;
    }
  }
  return `<section class="mapMissionCompact mapMissionCompact-${status.key}" data-mission-side="${side}">
    <div class="mapMissionCompactHeader"><strong>${missionUiEscape(runtime.missionName || "Missione")}</strong><span>${missionUiEscape(status.label)}</span></div>
    <div class="mapMissionCompactRows">${rows}</div>
    <div class="mapMissionCompactFooter">${controls}</div>
  </section>`;
}

function missionUiEntryState(entry) {
  if (!entry) return { key:"missing", label:"NON VALUTATO" };
  if (entry.completed) return { key:"completed", label:"COMPLETATO" };
  if (entry.satisfied) return { key:"satisfied", label:"ATTIVO" };
  return { key:"incomplete", label:"INCOMPLETO" };
}

function missionUiValue(value) {
  if (typeof value === "boolean") return value ? "Sì" : "No";
  if (value == null || value === "") return "—";
  return String(value);
}

function missionUiProgressText(item, entry) {
  if (!entry) return "Non valutato";
  if (item && item.consecutive) {
    return `${missionUiValue(entry.current)} · serie ${Number(entry.streak || 0)}/${item.consecutive}`;
  }
  return `${missionUiValue(entry.current)} / ${missionUiValue(entry.target)}`;
}

function missionUiObjectiveHtml(item, entry, index) {
  const stateInfo = missionUiEntryState(entry);
  return `
    <div class="missionObjective missionObjective-${stateInfo.key}">
      <div class="missionObjectiveIndex">${index + 1}</div>
      <div class="missionObjectiveBody">
        <div class="missionObjectiveHeader">
          <strong>${missionUiEscape(item && item.text ? item.text : `Obiettivo ${index + 1}`)}</strong>
          <span class="missionObjectiveState">${missionUiEscape(stateInfo.label)}</span>
        </div>
        <div class="missionObjectiveProgress">${missionUiEscape(missionUiProgressText(item, entry))}</div>
        <div class="missionObjectiveDetail">${missionUiEscape(entry && entry.detail ? entry.detail : "Non valutato")}</div>
      </div>
    </div>`;
}

function missionUiActionHtml(side, viewerSide) {
  const runtime = missionUiRuntime(side);
  if (!runtime || !runtime.active) return "";
  if (runtime.played) return `<div class="missionUiHint">${runtime.rewardPending ? "Completa la scelta della ricompensa." : "Missione risolta e carta negli scarti."}</div>`;
  const check = missionUiPlayCheck(side, null, { evaluate:false, source:"ui_render_detailed" });
  if (!missionUiOwnerHasPrivateView(side)) return `<div class="missionUiHint">${missionUiEscape(check.reason)}</div>`;
  if (MISSION_UI_STATE.playPendingSide === side) {
    return `<div class="missionRevealConfirm"><span>Confermi il gioco di “${missionUiEscape(runtime.missionName)}”? La carta andrà negli scarti e la ricompensa sarà applicata.</span><div class="missionUiButtons"><button class="ghost" type="button" onclick="missionUiCancelPlay()">Annulla</button><button type="button" onclick="missionUiConfirmPlay(${side})">Conferma Missione</button></div></div>`;
  }
  const multiplier = runtime.missionClass === "desperate" ? ` ×${Math.max(1, runtime.readyCount || 1)}` : "";
  return `<div class="missionUiButtons"><button type="button" ${check.ok ? "" : "disabled"} onclick="missionUiRequestPlay(${side})">Gioca Missione${multiplier}</button></div><div class="missionUiHint">${missionUiEscape(check.reason)}</div>`;
}

function missionUiHiddenPanelHtml(ownerSide) {
  return `
    <article class="missionPanel missionPanelHidden" data-mission-side="${ownerSide}">
      <div class="missionPanelHeader">
        <div>
          <span class="missionEyebrow">G${ownerSide} · Missione</span>
          <h4>MISSIONE NASCOSTA</h4>
        </div>
        <span class="missionStatus missionStatus-hidden">PRIVATA</span>
      </div>
      <div class="missionHiddenBody">Presenza, nome, obiettivi e progressi non sono informazioni pubbliche fino alla rivelazione.</div>
    </article>`;
}

function missionUiDetailedPanelHtml(ownerSide, viewerSide) {
  const runtime = missionUiRuntime(ownerSide);
  if (!runtime || !runtime.active) {
    return `
      <article class="missionPanel missionPanelAbsent" data-mission-side="${ownerSide}">
        <div class="missionPanelHeader"><div><span class="missionEyebrow">G${ownerSide}</span><h4>Nessuna Missione</h4></div><span class="missionStatus missionStatus-absent">FACOLTATIVA</span></div>
        <div class="missionHiddenBody">Il deck è composto da 30 carte ordinarie.</div>
      </article>`;
  }
  const definition = missionUiDefinition(ownerSide);
  const items = definition && typeof missionObjectivesFor === "function" ? missionObjectivesFor(definition) : [];
  const status = missionUiStatus(ownerSide);
  const selectedClass = MISSION_UI_STATE.selectedSide === ownerSide ? " isSelected" : "";
  const publicClass = " isPublic";
  return `
    <article class="missionPanel missionPanel-${status.key}${selectedClass}${publicClass}" data-mission-side="${ownerSide}">
      <div class="missionPanelHeader">
        <div>
          <span class="missionEyebrow">G${ownerSide} · ${missionUiEscape(runtime.missionClass === "desperate" ? "Missione disperata" : "Missione ordinaria")} · ciclo ${runtime.cycle || 1}</span>
          <h4>${missionUiEscape(runtime.missionName || runtime.missionId || "Missione")}</h4>
        </div>
        <span class="missionStatus missionStatus-${status.key}" title="${missionUiEscape(status.detail)}">${missionUiEscape(status.label)}</span>
      </div>
      <div class="missionObjectiveList">
        ${items.map((item, index) => missionUiObjectiveHtml(item, runtime.entries && runtime.entries[item.id], index)).join("")}
      </div>
      <div class="missionRewardPreview"><strong>Ricompensa:</strong> ${missionUiEscape(definition && definition.reward ? definition.reward.text : "Non disponibile")}</div>
      <div class="missionPanelFooter">
        <span>${missionUiEscape(status.detail)}</span>
        ${missionUiActionHtml(ownerSide, viewerSide)}
      </div>
    </article>`;
}

function missionUiPanelForSideHtml(ownerSide, viewerSide) {
  return missionUiDetailedPanelHtml(ownerSide, viewerSide);
}

function missionUiDashboardHtml(viewerSide = state && state.currentPlayer) {
  if (!state || !state.missions) return "";
  const viewer = Number(viewerSide || state.currentPlayer || 1);
  const other = viewer === 1 ? 2 : 1;
  return `
    <section class="missionDashboard" id="missionDashboard" aria-label="Missioni e progressi">
      <div class="missionDashboardTitle">
        <div><strong>Missioni</strong><span>F9N10 · Missioni su cicli multipli, recupero protetto e gestione IA.</span></div>
        <button class="ghost missionDiagnosticsBtn" type="button" onclick="copyMissionDiagnosticsJson()">Copia diagnostica</button>
      </div>
      <div class="missionDashboardGrid">
        ${missionUiPanelForSideHtml(viewer, viewer)}
        ${missionUiPanelForSideHtml(other, viewer)}
      </div>
      ${missionUiPendingRewardChoiceHtml()}
    </section>`;
}

function missionUiMapBadgeHtml(side) {
  const runtime = missionUiRuntime(side);
  if (!runtime || !runtime.active) return `<button class="ghost missionMapBadge missionMapBadge-absent" type="button" onclick="missionUiOpenPanel(${side})">Missione: nessuna</button>`;
  const status = missionUiStatus(side);
  const label = `${runtime.missionName || runtime.missionId || "Missione"} · ${status.label}`;
  return `<button class="ghost missionMapBadge missionMapBadge-${status.key}" type="button" onclick="missionUiOpenPanel(${side})">${missionUiEscape(label)}</button>`;
}

function missionUiSelect(side) {
  if (!state || !missionUiOwnerHasPrivateView(side)) return false;
  const runtime = missionUiRuntime(side);
  if (!runtime || !runtime.active) return false;
  if (typeof clearSelection === "function" && mode !== "idle") clearSelection();
  MISSION_UI_STATE.selectedSide = side;
  MISSION_UI_STATE.revealPendingSide = 0;
  MISSION_UI_STATE.playPendingSide = 0;
  MISSION_UI_STATE.lastOpenedAt = new Date().toISOString();
  missionUiInvalidate("select");
  if (typeof renderAll === "function") renderAll();
  return true;
}

function missionUiCancelSelection(options={}) {
  MISSION_UI_STATE.selectedSide = 0;
  MISSION_UI_STATE.revealPendingSide = 0;
  MISSION_UI_STATE.playPendingSide = 0;
  missionUiInvalidate("cancel_selection");
  if (!options.skipRender && typeof renderAll === "function") renderAll();
  return true;
}

function missionUiRequestReveal(side) {
  const runtime = missionUiRuntime(side);
  if (!runtime || !runtime.active || !runtime.ready || missionUiIsRevealed(side)) return false;
  if (!missionUiOwnerHasPrivateView(side) || missionUiBlockedReason(side)) return false;
  MISSION_UI_STATE.selectedSide = side;
  MISSION_UI_STATE.revealPendingSide = side;
  missionUiInvalidate("request_reveal");
  if (typeof renderAll === "function") renderAll();
  return true;
}

function missionUiCancelReveal() {
  MISSION_UI_STATE.revealPendingSide = 0;
  missionUiInvalidate("cancel_reveal");
  if (typeof renderAll === "function") renderAll();
  return true;
}

function missionUiMarkCardsRevealed(side) {
  if (!state) return 0;
  let changed = 0;
  for (const zoneName of ["hand", "deck", "discard"]) {
    const zone = state[zoneName] && state[zoneName][side] ? state[zoneName][side] : [];
    for (const card of zone) {
      if (!missionUiIsMissionCard(card)) continue;
      if (card.missionRevealed !== true) changed += 1;
      card.missionRevealed = true;
      card.missionRevealedAt = new Date().toISOString();
    }
  }
  return changed;
}

function missionUiReveal(side, options = {}) {
  const runtime = missionUiRuntime(side);
  if (!runtime || !runtime.active) return false;
  if (missionUiIsRevealed(side)) return true;
  if (!options.fromPlay) {
    if (!runtime.ready || !missionUiOwnerHasPrivateView(side) || missionUiBlockedReason(side)) return false;
  }
  runtime.revealed = true;
  runtime.revealedAt = new Date().toISOString();
  runtime.revealedBy = options.source || (options.fromPlay ? "mission_play" : "f9n7_ui_confirmation");
  missionUiMarkCardsRevealed(side);
  if (typeof emitGameEvent === "function" && typeof EventTypes !== "undefined" && EventTypes.MISSION_REVEALED) {
    emitGameEvent({
      type:EventTypes.MISSION_REVEALED,
      data:{
        player:side,
        faction:state.factions && state.factions[side],
        missionId:runtime.missionId,
        missionName:runtime.missionName,
        missionClass:runtime.missionClass,
        readyCount:runtime.readyCount,
        cycle:runtime.cycle,
        source:runtime.revealedBy,
        rewardsApplied:false,
        discarded:false
      }
    });
  }
  if (typeof log === "function") log(`${playerName(side)} rivela la Missione “${runtime.missionName}”. F9N7: nessuna ricompensa applicata e carta non scartata.`);
  MISSION_UI_STATE.selectedSide = 0;
  MISSION_UI_STATE.revealPendingSide = 0;
  missionUiInvalidate("revealed");
  if (typeof renderAll === "function") renderAll();
  return true;
}

function missionUiConfirmReveal(side) {
  if (MISSION_UI_STATE.revealPendingSide !== side) return false;
  return missionUiReveal(side, { source:"f9n7_ui_confirmation" });
}

function missionUiRevealOnPlay(side) {
  return missionUiReveal(side, { fromPlay:true, source:"mission_play" });
}


function missionUiRequestPlay(side) {
  const check = missionUiPlayCheck(side);
  if (!check.ok) return false;
  MISSION_UI_STATE.selectedSide = side;
  MISSION_UI_STATE.playPendingSide = side;
  MISSION_UI_STATE.lastOpenedAt = new Date().toISOString();
  missionUiInvalidate("request_play");
  if (typeof renderAll === "function") renderAll();
  return true;
}

function missionUiCancelPlay() {
  MISSION_UI_STATE.playPendingSide = 0;
  missionUiInvalidate("cancel_play");
  if (typeof renderAll === "function") renderAll();
  return true;
}

function missionUiConfirmPlay(side) {
  if (MISSION_UI_STATE.playPendingSide !== side) return false;
  MISSION_UI_STATE.playPendingSide = 0;
  missionUiInvalidate("confirm_play");
  return typeof missionPlayMission === "function" ? missionPlayMission(side) : (typeof missionPlayOrdinary === "function" ? missionPlayOrdinary(side) : false);
}

function missionUiPendingRewardChoiceHtml() {
  const pending = typeof missionPendingReward === "function" ? missionPendingReward() : null;
  if (!pending) return "";
  if (pending.kind === "mission_player_target_selection") {
    const buttons = (pending.targetSides || []).map(side => {
      const info = typeof f9q3d1TargetSummary === "function" ? f9q3d1TargetSummary(side) : {faction:state.factions && state.factions[side],energy:state.energy && state.energy[side],hand:state.hand && state.hand[side] ? state.hand[side].length : 0,deck:state.deck && state.deck[side] ? state.deck[side].length : 0,pressure:state.pressure && state.pressure[side] || 0,ps:typeof countControlledPS === "function" ? countControlledPS(side) : 0};
      return `<button type="button" class="missionRewardCard" onclick="missionRewardConfirmPlayerTarget(${side})"><strong>${missionUiEscape(playerName(side))}</strong><span>${missionUiEscape(info.faction || "Fazione")} · ENE ${info.energy} · PS ${info.ps} · Pressione ${info.pressure} · Mano ${info.hand} · Deck ${info.deck}</span></button>`;
    }).join("");
    return `<section class="missionRewardChoice" aria-label="Scelta avversario ricompensa Missione"><div class="missionRewardChoiceHeader"><div><strong>Scegli l’avversario della Missione “${missionUiEscape(pending.missionName)}”</strong><span>Solo i giocatori attivi sono bersagli validi.</span></div><span class="missionStatus missionStatus-reward_pending">FFA</span></div><div class="missionRewardCardGrid">${buttons}</div></section>`;
  }
  if (pending.kind === "enemy_discard_selection") {
    const cards = typeof missionPendingDiscardEligibleCards === "function" ? missionPendingDiscardEligibleCards() : [];
    const selected = new Set(pending.selectedUids || []);
    return `
      <section class="missionRewardChoice" aria-label="Scelta scarto ricompensa Missione">
        <div class="missionRewardChoiceHeader">
          <div><strong>${missionUiEscape(playerName(pending.chooserSide))} sceglie le carte da scartare</strong><span>Missione “${missionUiEscape(pending.missionName)}” · seleziona ${pending.required} carte ordinarie.</span></div>
          <span class="missionStatus missionStatus-reward_pending">${selected.size}/${pending.required}</span>
        </div>
        <div class="missionRewardCardGrid">
          ${cards.map(card => {
            const active = selected.has(card.cardUid);
            const uid = missionUiEscape(card.cardUid);
            return `<button type="button" class="missionRewardCard${active ? " isSelected" : ""}" onclick="missionRewardToggleDiscardSelection('${uid}')"><strong>${missionUiEscape(card.name || card.id)}</strong><span>${missionUiEscape(card.cardType || card.sourceType || "carta")} · ${Number(card.cost) || 0} ENE</span></button>`;
          }).join("")}
        </div>
        <div class="missionUiButtons"><button type="button" ${selected.size === pending.required ? "" : "disabled"} onclick="missionRewardConfirmDiscardSelection()">Conferma scarto scelto</button></div>
      </section>`;
  }
  if (pending.kind === "mission_target_selection") {
    const complete = typeof missionTargetGroupsComplete === "function" && missionTargetGroupsComplete(pending);
    return `<section class="missionRewardChoice" aria-label="Scelta bersagli ricompensa Missione">
      <div class="missionRewardChoiceHeader"><div><strong>Scegli i bersagli della Missione “${missionUiEscape(pending.missionName)}”</strong><span>Moltiplicatore ×${pending.multiplier}. Ogni bersaglio deve essere distinto; le quote senza bersaglio valido sono sprecate.</span></div><span class="missionStatus missionStatus-reward_pending">×${pending.multiplier}</span></div>
      ${(pending.groups || []).map(group => {
        const selected = new Set(group.selectedUids || []);
        const units = typeof missionPendingTargetEligibleUnits === "function" ? missionPendingTargetEligibleUnits(group.key) : [];
        return `<div class="missionRewardTargetGroup"><div class="missionObjectiveHeader"><strong>${missionUiEscape(group.label)}</strong><span>${selected.size}/${group.required}${group.wasted ? ` · ${group.wasted} sprecata/e` : ""}</span></div><div class="missionRewardCardGrid">${units.map(unit => `<button type="button" class="missionRewardCard${selected.has(unit.uid) ? " isSelected" : ""}" onclick="missionRewardToggleTargetSelection('${missionUiEscape(group.key)}','${missionUiEscape(unit.uid)}')"><strong>${missionUiEscape(unit.name)}</strong><span>${missionUiEscape(unit.type)} · ${missionUiEscape(unit.weight || "")}</span></button>`).join("") || `<span class="missionUiHint">Nessun bersaglio valido: quota sprecata.</span>`}</div></div>`;
      }).join("")}
      <div class="missionUiButtons"><button type="button" ${complete ? "" : "disabled"} onclick="missionRewardConfirmTargetSelection()">Conferma bersagli</button></div>
    </section>`;
  }
  if (pending.kind === "repeat_attack_confirmation") {
    const attacker = typeof missionRewardUnitByUid === "function" ? missionRewardUnitByUid(pending.attackerUid) : null;
    const defender = typeof missionRewardUnitByUid === "function" ? missionRewardUnitByUid(pending.defenderUid) : null;
    return `<section class="missionRewardChoice" aria-label="Ripetizione attacco Missione"><div class="missionRewardChoiceHeader"><div><strong>Ripetere l’attacco?</strong><span>${missionUiEscape(attacker ? attacker.name : "Attaccante")} contro ${missionUiEscape(defender ? defender.name : "bersaglio")} · cariche disponibili ${pending.remaining}.</span></div><span class="missionStatus missionStatus-reward_pending">${pending.remaining}</span></div><div class="missionUiButtons"><button class="ghost" type="button" onclick="missionRewardSkipRepeatAttack()">Conserva per dopo</button><button type="button" onclick="missionRewardConfirmRepeatAttack()">Ripeti ora</button></div></section>`;
  }
  return "";
}

function missionUiOpenPanel(side) {
  if (typeof setApkM4Panel === "function") setApkM4Panel("hand", { force:true, scrollTo:"missionDashboard" });
  else if (typeof toggleGamePanel === "function") toggleGamePanel("hand", { focusId:"missionDashboard" });
  else if (typeof document !== "undefined") {
    const panel = document.getElementById("missionDashboard");
    if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior:"smooth", block:"start" });
  }
  return true;
}

function missionUiResetSelectionForTurn() {
  MISSION_UI_STATE.selectedSide = 0;
  MISSION_UI_STATE.revealPendingSide = 0;
  MISSION_UI_STATE.playPendingSide = 0;
  missionUiInvalidate("turn_reset");
}
