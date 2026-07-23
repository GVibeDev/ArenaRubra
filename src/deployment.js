"use strict";

// Arena Rubra – Fase B6c
// Deployment / Build extraction prudente.
// Questo file contiene modalità acquisto/build/spawn,
// celle valide di sbarco/costruzione, esecuzione spawn e costruzione,
// bonus Agathoi allo sbarco.
// Non contiene ancora logica decisionale AI pesante.

// Dipendenze globali accettate in questa fase:
// - state.js: state, selectedId, mode, pending...
// - rules.js: combatUnits, getHq, getUnitAt, isInsideMap, structureBlueprintFor, playerName
// - economy.js: canAffordBlueprint, purchaseLimitReached, effectiveBlueprintCost, consumeDeploymentDiscount
// - statuses.js: canAct
// - main.js/map/movement future: isOnPS, buildCellStrategicScore, chooseBuildCell, chooseSpawnCell
// - render/events: log, EventTypes, renderAll



    // =====================================================
    // C1c – Starter cards spawning foundation
    // =====================================================

    function starterCardsForPlayer(side) {
      if (!state || !state.starterCards || !state.starterCards[side]) return [];
      return Object.values(state.starterCards[side]).filter(Boolean);
    }

    function starterCardByUid(side, cardUid) {
      return starterCardsForPlayer(side).find(card => card.cardUid === cardUid) || null;
    }

    function blueprintForStarterCard(card, side) {
      if (!card || !card.blueprintId || !state || !state.factions) return null;
      return blueprintById(card.blueprintId, state.factions[side]);
    }

    function starterCardActionState(side, card) {
      if (!state || !card) return { canUse: false, reason: "Starter assente", actionText: "Non disponibile" };

      const bp = blueprintForStarterCard(card, side);
      const isCurrent = state.currentPlayer === side;
      const isHuman = state.modes && state.modes[side] === "human";
      const actionText = bp && bp.type === "Struttura" ? "Costruisci starter" : "Piazza starter";

      if (!bp) return { canUse: false, reason: "Blueprint non trovato", actionText };
      if (state.winner) return { canUse: false, reason: "Partita conclusa", actionText };
      if (!isCurrent) return { canUse: false, reason: "Non è il turno", actionText };
      if (!isHuman) return { canUse: false, reason: "Controllo bot", actionText };
      if (botRunning) return { canUse: false, reason: "Bot in esecuzione", actionText };
      if (purchaseLimitReached(side, bp)) return { canUse: false, reason: limitReason(side, bp), actionText };
      const capState = typeof tacticalStarterCapState === "function" ? tacticalStarterCapState(side, card.starterRole) : { blocked:false };
      if (capState.blocked) return { canUse:false, reason:`Cap Tattica ${capState.count}/${capState.cap} per questo tipo`, actionText };
      if (state.energy[side] < effectiveHandUnitCardCost(side, card, bp)) return { canUse: false, reason: "ENE insufficiente", actionText };

      if (bp.type === "Struttura") {
        const builder = getSelectedUnit();
        const unitBuildReady = Boolean(builder && builder.side === side && canBuildStructures(builder) && !builder.acted && buildableCells(builder).length);
        const hqBuildReady = typeof canBuildFromOwnHq === "function" && canBuildFromOwnHq(side, bp);
        if (!unitBuildReady && !hqBuildReady) {
          return { canUse: false, reason: "Nessuna cella libera adiacente", actionText };
        }
      } else if (!spawnCellsFor(side, bp).length) {
        return { canUse: false, reason: "Nessuna cella di sbarco", actionText };
      }

      return { canUse: true, reason: "Pronto", actionText };
    }

    function beginStarterCardPurchase(cardUid) {
      pendingHandCardUid = null;
      if (!state || state.winner || botRunning || (typeof missionInteractionBlocked === "function" && missionInteractionBlocked())) return false;
      const player = state.currentPlayer;
      const card = starterCardByUid(player, cardUid);
      if (!card) {
        log("Carta starter non trovata per il giocatore corrente.");
        renderAll();
        return false;
      }

      const check = starterCardActionState(player, card);
      const bp = blueprintForStarterCard(card, player);
      if (!check.canUse || !bp) {
        if (bp && card.starterRole && typeof tacticalStarterCapState === "function" && tacticalStarterCapState(player, card.starterRole).blocked && typeof noteTacticalStarterCapBlocked === "function") noteTacticalStarterCapBlocked(player, card.starterRole);
        log(`Starter ${card.name || card.id}: ${check.reason}.`);
        renderAll();
        return false;
      }

      log(`Starter ${card.name}: seleziona il piazzamento.`, EventTypes.GAME_STARTED, {
        player,
        faction: state.factions[player],
        cardUid: card.cardUid,
        cardName: card.name,
        blueprintId: card.blueprintId,
        starterRole: card.starterRole,
        source: "C1c-starter-card"
      });
      pendingStarterCardUid = card.cardUid;
      pendingDeploymentContext = { source:"starter", starterRole:card.starterRole, cardUid:card.cardUid, side:player };
      beginPurchase(bp);
      if ((mode === "spawn" || mode === "build") && typeof closeHandPanelAfterAcceptedCardPlay === "function") closeHandPanelAfterAcceptedCardPlay();
      else if ((mode === "spawn" || mode === "build") && typeof apkM4CloseHandAfterCardPlay === "function") apkM4CloseHandAfterCardPlay();
      renderAll();
      return true;
    }



    // =====================================================
    // C1e – Hand unit cards playable foundation
    // =====================================================

    // =====================================================
    // F9K5 – Custom Match Test Lab unit runtime bridge
    // =====================================================

    function isCustomRuntimeUnitCard(card) {
      return Boolean(card && card.custom === true && card.sourceType === "unit");
    }

    const CUSTOM_RUNTIME_STATUS_OPTIONS = Object.freeze({
      inhibit_action: { statusKind:"inhibit_action", target:"enemy", valueDefault:0, valueMin:0, valueMax:0, turnsDefault:1, turnsMin:1, turnsMax:1 },
      inhibit_attack: { statusKind:"inhibit_attack", target:"enemy", valueDefault:0, valueMin:0, valueMax:0, turnsDefault:1, turnsMin:1, turnsMax:2 },
      inhibit_move: { statusKind:"inhibit_move", target:"enemy", valueDefault:0, valueMin:0, valueMax:0, turnsDefault:1, turnsMin:1, turnsMax:2 },
      bleed: { statusKind:"bleed", target:"enemy", valueDefault:1, valueMin:1, valueMax:3, turnsDefault:2, turnsMin:1, turnsMax:3 },
      thorns: { statusKind:"thorns", target:"ally", valueDefault:1, valueMin:1, valueMax:3, turnsDefault:1, turnsMin:1, turnsMax:2 }
    });

    function customRuntimeStatusOption(active) {
      const key = String(active && (active.statusKey || active.statusKind) || "inhibit_attack");
      const byKey = CUSTOM_RUNTIME_STATUS_OPTIONS[key];
      if (byKey) return byKey;
      return Object.values(CUSTOM_RUNTIME_STATUS_OPTIONS).find(opt => opt.statusKind === key) || null;
    }

    function customRuntimeClampInt(value, fallback, min, max) {
      const n = Number(value);
      const raw = Number.isFinite(n) ? Math.round(n) : fallback;
      return Math.max(min, Math.min(max, raw));
    }

    function customRuntimeStatusEnabled(active) {
      if (!active || active.kind !== "apply_status") return false;
      const opt = customRuntimeStatusOption(active);
      return Boolean(opt && opt.statusKind && (typeof STATUS_DEFINITIONS === "undefined" || STATUS_DEFINITIONS[opt.statusKind]));
    }

    function customRuntimeAbilityKind(active) {
      const kind = active && active.kind ? String(active.kind) : "";
      const map = {
        damage: "damage",
        heal: "heal",
        restore_def: "armor",
        shred_def: "shred",
        buff_att: "buffAtt",
        buff_def: "buffDef",
        draw_card: "customDrawCard",
        gain_energy: "customGainEnergy",
        apply_status: customRuntimeStatusEnabled(active) ? "status" : null
      };
      return map[kind] || null;
    }

    function customRuntimeAbilityTarget(active, runtimeKind) {
      if (runtimeKind === "customDrawCard" || runtimeKind === "customGainEnergy") return "self";
      if (runtimeKind === "status" && active && active.kind === "apply_status") {
        const opt = customRuntimeStatusOption(active);
        return opt && opt.target ? opt.target : "enemy";
      }
      const target = String(active && active.target || "enemy").toLowerCase();
      if (["ally", "enemy", "self", "any"].includes(target)) return target;
      return "enemy";
    }

    function customRuntimeAbilityFilter(active) {
      const filter = String(active && active.filter || "any").toLowerCase();
      if (!filter || filter === "any") return "Any";
      if (filter === "infantry") return "infantry";
      if (filter === "vehicle") return "vehicle";
      if (filter === "structure") return "structure";
      if (filter === "commander_or_pivot") return "commander_or_pivot";
      return "Any";
    }

    function customRuntimeAbilityFromCard(card) {
      if (!card) return null;
      const schema = card.customAbilitySchema || {};
      const active = schema.active || null;
      const passive = schema.passive || null;

      if (active && active.kind && active.kind !== "none") {
        const runtimeKind = customRuntimeAbilityKind(active);
        const enabled = Boolean(runtimeKind);
        const statusOpt = active.kind === "apply_status" ? customRuntimeStatusOption(active) : null;
        const statusTurns = statusOpt ? customRuntimeClampInt(active.statusTurns || active.turns, statusOpt.turnsDefault || 1, statusOpt.turnsMin || 1, statusOpt.turnsMax || 1) : null;
        const statusValue = statusOpt ? customRuntimeClampInt(active.value, statusOpt.valueDefault || 0, statusOpt.valueMin || 0, Number.isFinite(statusOpt.valueMax) ? statusOpt.valueMax : 0) : null;
        return {
          ...(card.ability || {}),
          name: (card.ability && card.ability.name) || active.label || "Abilità custom",
          kind: runtimeKind || active.kind,
          editorKind: active.kind,
          value: statusOpt ? statusValue : (active.value || 0),
          turns: statusOpt ? statusTurns : (active.turns || null),
          statusKind: statusOpt ? statusOpt.statusKind : (active.statusKind || null),
          range: active.range || 0,
          cost: active.cost || 0,
          cooldown: active.cooldown || 0,
          target: customRuntimeAbilityTarget(active, runtimeKind),
          filter: customRuntimeAbilityFilter(active),
          description: active.description || active.label || (enabled ? "Abilità custom runtime." : "Abilità custom non ancora collegata al runtime."),
          customDataOnly: !enabled,
          runtimeEnabled: enabled,
          customRuntime: true,
          runtimeNote: enabled
            ? "F9K6b: abilità custom collegata al motore runtime semplice."
            : "F9K6b: effetto custom non ancora supportato dal binding runtime."
        };
      }

      if (passive && passive.kind === "aura_att") {
        return { name: passive.label || "Aura ATT custom", kind: "auraAtt", passive: true, value: passive.value || 1, range: passive.range || 1, customRuntime: true, description: passive.description || passive.label || "Aura ATT custom." };
      }
      if (passive && passive.kind === "aura_def") {
        return { name: passive.label || "Aura DEF custom", kind: "auraDef", passive: true, value: passive.value || 1, range: passive.range || 1, customRuntime: true, description: passive.description || passive.label || "Aura DEF custom." };
      }

      if (card.ability && card.ability.passive) return { ...card.ability, customRuntime: true };
      return null;
    }

    function customRuntimeBlueprintFromCard(card, side=null) {
      if (!isCustomRuntimeUnitCard(card)) return null;
      const unitType = card.unitType || card.type || "Fanteria";
      const weight = card.weight || "Leggera";
      const id = card.blueprintId || card.sourceId || String(card.id || "CUSTOM_UNIT").replace(/^CUSTOM:UNIT:/, "");
      const factionRules = Array.isArray(card.factionRules) ? [...card.factionRules] : [];
      if (card.faction === "Liberti") {
        if (!factionRules.includes("Superiorità Numerica")) factionRules.push("Superiorità Numerica");
        if (unitType !== "Struttura" && !factionRules.includes("Sanguinamento")) factionRules.push("Sanguinamento");
      }
      return {
        ...card,
        id,
        cardId: card.id,
        sourceId: card.sourceId || id,
        sourceType: "custom_unit_runtime",
        blueprintId: id,
        faction: card.faction || (state && state.factions && side ? state.factions[side] : "Nexus"),
        name: card.name || "Unità custom",
        type: unitType,
        unitType,
        weight,
        cost: Number.isFinite(card.cost) ? card.cost : 1,
        hp: Number.isFinite(card.hp) ? card.hp : 1,
        att: Number.isFinite(card.att) ? card.att : 0,
        def: Number.isFinite(card.def) ? card.def : 0,
        ability: customRuntimeAbilityFromCard(card),
        factionRules,
        customRuntime: true,
        source: card.source || "F9K5 Custom Match Test Lab"
      };
    }

    function blueprintForHandCard(card, side) {
      if (!card || !state || !state.factions) return null;
      if (isCustomRuntimeUnitCard(card)) return customRuntimeBlueprintFromCard(card, side);
      if (!card.blueprintId) return null;
      // C2c-7a: carte copiate/rubate o generate da Taglia/Matrice possono
      // appartenere a una fazione diversa da quella del controllore. Prima
      // tentiamo il roster della fazione del giocatore, poi la fazione originale
      // della carta, infine il blueprint globale.
      return blueprintById(card.blueprintId, state.factions[side])
        || blueprintById(card.blueprintId, card.faction)
        || BLUEPRINTS.find(bp => bp && bp.id === card.blueprintId)
        || null;
    }


    function pendingBlueprintForHandOrMarket(player, pendingBlueprintId) {
      if (!state || !state.factions || !pendingBlueprintId) return null;
      // C2c-8c-fix: se stiamo piazzando/costruendo una carta dalla mano,
      // il blueprint va risolto dalla carta stessa. Questo è essenziale per
      // carte unità copiate/rubate da altre fazioni tramite Esproprio di Mano,
      // Contratto Capestro, Taglia o altri effetti hand/deck.
      if (pendingHandCardUid && typeof handCardByUid === "function") {
        const card = handCardByUid(player, pendingHandCardUid);
        if (card && card.blueprintId === pendingBlueprintId && typeof blueprintForHandCard === "function") {
          return blueprintForHandCard(card, player);
        }
      }
      return blueprintById(pendingBlueprintId, state.factions[player])
        || BLUEPRINTS.find(bp => bp && bp.id === pendingBlueprintId)
        || null;
    }

    function effectiveHandUnitCardCost(side, card, bp, coord=null) {
      if (!bp) return Infinity;
      if (!card || !card.c2c6aCostAdjusted || !Number.isFinite(card.cost)) {
        const base = effectiveBlueprintCost(side, bp, coord);
        const handModifiers = typeof playerHandUnitCostModifiers === "function" ? playerHandUnitCostModifiers(side, bp) : [];
        const delta = handModifiers.reduce((sum, mod) => sum + (mod.value || 0), 0);
        const minCost = handModifiers.reduce((min, mod) => Math.max(min, mod.minCost || 0), 0);
        const normalCost = Math.max(minCost, base + delta);
        return typeof missionEffectiveCardCost === "function" ? missionEffectiveCardCost(side, card, normalCost) : normalCost;
      }

      // C2c-6c: le carte pescate con costo modificato mantengono il proprio
      // costo di istanza, ma possono ancora ricevere modificatori economici
      // di turno/posizione già stabilizzati: Bunker Nexus, Avamposto Fabeot,
      // riduzioni da adiacenza e futuri effetti cost_delta/deploy_discount.
      const baseCost = Number(card.cost);
      const modifiers = typeof playerCostModifiers === "function" ? playerCostModifiers(side, bp) : [];
      const handModifiers = typeof playerHandUnitCostModifiers === "function" ? playerHandUnitCostModifiers(side, bp) : [];
      const allModifiers = [...modifiers, ...handModifiers];
      const placement = typeof c1fPlacementCostModifier === "function" ? c1fPlacementCostModifier(side, bp, coord) : { value:0, minCost:0 };
      const delta = allModifiers.reduce((sum, mod) => sum + (mod.value || 0), 0) + (placement.value || 0);
      const modifierMin = allModifiers.reduce((min, mod) => Math.max(min, mod.minCost || 0), 0);
      const cardMin = Number.isFinite(card.c2c6aMinCost) ? card.c2c6aMinCost : 0;
      const minCost = Math.max(cardMin, modifierMin, placement.minCost || 0);
      const normalCost = Math.max(minCost, baseCost + delta);
      return typeof missionEffectiveCardCost === "function" ? missionEffectiveCardCost(side, card, normalCost) : normalCost;
    }

    function c2c6aPendingHandCardFor(side, bp=null) {
      if (!pendingHandCardUid || typeof handCardByUid !== "function") return null;
      const card = handCardByUid(side, pendingHandCardUid);
      if (!card || card.sourceType !== "unit") return null;
      if (bp && card.blueprintId !== bp.id) return null;
      return card;
    }

    function applyC2c6aHandCardSpawnBonuses(unit, card) {
      if (!unit || !card) return;
      const attBonus = Number.isFinite(card.c2c6aSpawnAttBonus) ? card.c2c6aSpawnAttBonus : 0;
      if (attBonus > 0) {
        unit.baseAtt = (unit.baseAtt || 0) + attBonus;
        unit.currentAtt = (unit.currentAtt || 0) + attBonus;
        unit.buffs = unit.buffs || [];
        unit.buffs.push({ stat:"att", value:attBonus, turns:999, permanent:true, source:card.c2c6aSpawnAttBonusSource || "Rifornimenti in arrivo", c2c6a:true });
        log(`${unit.name} entra con +${attBonus} ATT permanente dalla carta pescata (${card.c2c6aSpawnAttBonusSource || "C2c-6a"}).`);
      }
    }

    function handCardActionState(side, card) {
      if (!state || !card) return { canUse: false, reason: "Carta assente", actionText: "Non disponibile" };

      const isCurrent = state.currentPlayer === side;
      const isHuman = state.modes && state.modes[side] === "human";

      if (card.sourceType === "mission") {
        const runtime = typeof missionRuntime === "function" ? missionRuntime(side) : null;
        const status = typeof missionUiStatus === "function" ? missionUiStatus(side) : null;
        const canOpen = Boolean(state.currentPlayer === side && state.modes && state.modes[side] === "human" && !botRunning);
        const playable = typeof missionUiPlayCheck === "function" ? missionUiPlayCheck(side, card, { evaluate:false, source:"hand_render" }) : { ok:false, reason:"Runtime Missione non disponibile" };
        const reason = status ? `${status.label} · ${playable.reason || status.detail}` : playable.reason;
        return { canUse:canOpen, reason, actionText:playable.ok ? "Gioca Missione" : "Mostra progressi" };
      }

      if (card.sourceType === "tactic") {
        const implemented = typeof isC2c1SingleDamageTacticCard === "function" && isC2c1SingleDamageTacticCard(card);
        const playable = typeof canUseHandTacticCard === "function" ? canUseHandTacticCard(side, card) : { ok:false, reason:"Controller tattiche non disponibile" };
        const actionText = implemented ? "Gioca ora" : "Tattica data-only";
        if (!isCurrent) return { canUse:false, reason:"Non è il turno", actionText };
        if (!isHuman) return { canUse:false, reason:"Controllo bot", actionText };
        if (botRunning) return { canUse:false, reason:"Bot in esecuzione", actionText };
        if (!implemented) return { canUse:false, reason:playable.reason, actionText };
        return { canUse: Boolean(playable.ok), reason: playable.reason, actionText };
      }

      if (!isPlayableUnitHandCard(card)) {
        return { canUse: false, reason: "Carta non unità", actionText: "Non giocabile" };
      }

      const bp = blueprintForHandCard(card, side);
      const actionText = bp && bp.type === "Struttura" ? "Costruisci carta" : "Gioca carta";

      if (!bp) return { canUse: false, reason: "Blueprint non trovato", actionText };
      if (state.winner) return { canUse: false, reason: "Partita conclusa", actionText };
      if (typeof playerHandLocked === "function" && playerHandLocked(side)) return { canUse:false, reason:"Mano bloccata", actionText };
      if (typeof handCardBlocked === "function" && handCardBlocked(card)) return { canUse:false, reason:handCardBlockReason(card), actionText };
      if (!isCurrent) return { canUse: false, reason: "Non è il turno", actionText };
      if (!isHuman) return { canUse: false, reason: "Controllo bot", actionText };
      if (botRunning) return { canUse: false, reason: "Bot in esecuzione", actionText };
      if (purchaseLimitReached(side, bp)) return { canUse: false, reason: limitReason(side, bp), actionText };
      if (state.energy[side] < effectiveHandUnitCardCost(side, card, bp)) return { canUse: false, reason: "ENE insufficiente", actionText };

      if (bp.type === "Struttura") {
        const builder = getSelectedUnit();
        const unitBuildReady = Boolean(builder && builder.side === side && canBuildStructures(builder) && !builder.acted && buildableCells(builder).length);
        const hqBuildReady = typeof canBuildFromOwnHq === "function" && canBuildFromOwnHq(side, bp);
        if (!unitBuildReady && !hqBuildReady) {
          return { canUse: false, reason: "Serve un costruttore attivo con spazio oppure il proprio QG libero", actionText };
        }
      } else if (!spawnCellsFor(side, bp).length) {
        return { canUse: false, reason: "Nessuna cella di sbarco", actionText };
      }

      return { canUse: true, reason: "Pronto", actionText };
    }

    function beginHandCardPlay(cardUid) {
      pendingStarterCardUid = null;
      pendingDeploymentContext = null;
      if (!state || state.winner || botRunning || (typeof missionInteractionBlocked === "function" && missionInteractionBlocked())) return false;

      const player = state.currentPlayer;
      const card = handCardByUid(player, cardUid);
      if (!card) {
        log("Carta in mano non trovata per il giocatore corrente.");
        renderAll();
        return false;
      }

      const check = handCardActionState(player, card);
      if (!check.canUse) {
        log(`Carta ${card.name || card.id}: ${check.reason}.`);
        renderAll();
        return false;
      }

      if (card.sourceType === "mission") {
        if (typeof missionUiActivateCard === "function") return missionUiActivateCard(player, { card, source:"hand_card" });
        if (typeof missionUiOpenPanel === "function") missionUiOpenPanel(player);
        return true;
      }

      if (card.sourceType === "tactic") {
        return beginHandTacticCardPlay(cardUid);
      }

      const bp = blueprintForHandCard(card, player);
      if (!bp) {
        log(`Carta ${card.name || card.id}: Blueprint non trovato.`);
        renderAll();
        return false;
      }

      pendingHandCardUid = card.cardUid;
      pendingAbility = null;
      pendingTacticId = null;

      if (bp.type === "Struttura") {
        const builder = getSelectedUnit();
        const unitBuildReady = Boolean(builder && builder.side === player && canBuildStructures(builder) && !builder.acted && buildableCells(builder).length);
        const hqBuildReady = typeof canBuildFromOwnHq === "function" && canBuildFromOwnHq(player, bp);
        if (!unitBuildReady && !hqBuildReady) {
          log(`Carta ${card.name}: nessuna costruzione valida per ${bp.name}.`);
          pendingHandCardUid = null;
          renderAll();
          return false;
        }
        mode = "build";
        pendingBuildSource = unitBuildReady ? { type:"unit", builderId:builder.uid } : { type:"own_hq", side:player };
        pendingBuildBlueprintId = bp.id;
        pendingPurchaseBlueprintId = null;
        log(unitBuildReady
          ? `Carta ${card.name}: scegli una cella blu adiacente a ${builder.name} per costruire ${bp.name}.`
          : `Carta ${card.name}: seleziona la casella del tuo QG per costruire ${bp.name}.`, EventTypes.LOG_MESSAGE, {
          player,
          faction: state.factions[player],
          cardUid: card.cardUid,
          cardName: card.name,
          blueprintId: bp.id,
          buildSource:unitBuildReady ? "unit" : "own_hq",
          source: "F9O2e-hand-structure-build"
        });
      } else {
        mode = "spawn";
        pendingPurchaseBlueprintId = bp.id;
        pendingBuildBlueprintId = null;
        selectedId = null;
        log(`Carta ${card.name}: scegli una cella blu per piazzare ${bp.name}.`, EventTypes.LOG_MESSAGE, {
          player,
          faction: state.factions[player],
          cardUid: card.cardUid,
          cardName: card.name,
          blueprintId: bp.id,
          source: "C1e-hand-card-play"
        });
      }

      if (typeof closeHandPanelAfterAcceptedCardPlay === "function") closeHandPanelAfterAcceptedCardPlay();
      else if (typeof apkM4CloseHandAfterCardPlay === "function") apkM4CloseHandAfterCardPlay();
      renderAll();
      if (mode === "spawn" && typeof cameraScheduleDeploymentFit === "function") cameraScheduleDeploymentFit(player, bp, { animate:true });
      return true;
    }

    function completeHandCardUnitPlay(side, cardUid, bp) {
      if (!cardUid) return null;
      const card = handCardByUid(side, cardUid);
      if (!card) return null;
      if (bp && card.blueprintId !== bp.id) return null;
      return discardPlayedHandCard(side, cardUid);
    }


    function beginPurchase(bp) {
      pendingHandCardUid = null;
      if ((typeof missionInteractionBlocked === "function" && missionInteractionBlocked()) || state.modes[state.currentPlayer] !== "human" || state.winner) return;
      const pendingStarterCostCard = pendingStarterCardUid ? starterCardByUid(state.currentPlayer, pendingStarterCardUid) : null;
      const canPayPendingStarter = pendingStarterCostCard
        ? state.energy[state.currentPlayer] >= effectiveHandUnitCardCost(state.currentPlayer, pendingStarterCostCard, bp)
        : canAffordBlueprint(state.currentPlayer, bp);
      if (!canPayPendingStarter) return;
      if (commanderLimitReached(state.currentPlayer, bp)) {
        log(`${playerName(state.currentPlayer)} ha già schierato il proprio comandante.`);
        return;
      }
      if (bp.type === "Struttura") {
        const builder = getSelectedUnit();
        const unitBuildReady = Boolean(builder && builder.side === state.currentPlayer && canBuildStructures(builder) && !builder.acted && buildableCells(builder).length);
        const hqBuildReady = typeof canBuildFromOwnHq === "function" && canBuildFromOwnHq(state.currentPlayer, bp);
        if (!unitBuildReady && !hqBuildReady) {
          log(`Nessuna costruzione valida per ${bp.name}: serve un costruttore attivo con spazio adiacente oppure il proprio QG libero.`);
          return;
        }
        mode = "build";
        pendingBuildSource = unitBuildReady ? { type:"unit", builderId:builder.uid } : { type:"own_hq", side:state.currentPlayer };
        pendingBuildBlueprintId = bp.id;
        pendingPurchaseBlueprintId = null;
        pendingAbility = null;
        log(unitBuildReady ? `Scegli una cella blu adiacente a ${builder.name} per costruire ${bp.name}.` : `Costruzione dal QG: seleziona la casella del tuo QG per costruire ${bp.name}.`);
      } else {
        if (!spawnCellsFor(state.currentPlayer, bp).length) {
          log(`Nessuna cella libera di sbarco intorno al QG o agli edifici per piazzare ${bp.name}.`);
          return;
        }
        mode = "spawn";
        pendingPurchaseBlueprintId = bp.id;
        pendingBuildBlueprintId = null;
        pendingAbility = null;
        pendingTacticId = null;
        selectedId = null;
        log(`Scegli una cella blu adiacente al tuo QG o a un tuo edificio per piazzare ${bp.name}.`);
      }
      renderAll();
      if (mode === "spawn" && typeof cameraScheduleDeploymentFit === "function") cameraScheduleDeploymentFit(state.currentPlayer, bp, { animate:true });
    }



    function toggleBuildMode(unit) {
      if (typeof missionInteractionBlocked === "function" && missionInteractionBlocked()) return;
      const structure = structureBlueprintFor(unit.side);
      if (!structure || !canBuildStructures(unit) || state.energy[unit.side] < effectiveBlueprintCost(unit.side, structure)) return;
      mode = mode === "build" ? "idle" : "build";
      pendingAbility = null;
      pendingBuildBlueprintId = mode === "build" ? structure.id : null;
      pendingPurchaseBlueprintId = null;
      pendingTacticId = null;
      pendingHandCardUid = null;
      renderAll();
    }



    function spawnUnit(bp, side, coord, options={}) {
      if (purchaseLimitReached(side, bp)) return false;
      const handCard = c2c6aPendingHandCardFor(side, bp);
      const starterCard = !handCard && pendingStarterCardUid ? starterCardByUid(side, pendingStarterCardUid) : null;
      const costCard = handCard || starterCard;
      const paid = effectiveHandUnitCardCost(side, costCard, bp, coord);
      if (state.energy[side] < paid || (playerEnergyLocked(side) && paid > 0)) { log(`${playerName(side)} non può pagare ${paid} ENE per piazzare ${bp.name} in questa cella.`); return false; }
      const unit = createUnitFromBlueprint(bp, side);
      const starterRole = options.spawnSource === "starter" ? options.starterRole : null;
      if (starterRole && typeof tacticalStarterCapState === "function" && tacticalStarterCapState(side, starterRole).blocked) {
        if (typeof noteTacticalStarterCapBlocked === "function") noteTacticalStarterCapBlocked(side, starterRole);
        log(`Cap modalità Tattica raggiunto per ${starterRole}.`);
        return false;
      }
      state.energy[side] -= paid;
      // C2c-6c: se uno sconto di sbarco ha contribuito al costo effettivo,
      // va consumato anche quando la carta aveva già uno sconto C2c-6a.
      consumeDeploymentDiscount(side, bp);
      if (handCard && typeof consumeHandDeploymentDiscount === "function") consumeHandDeploymentDiscount(side, bp);
      unit.pos = [...coord];
      applyAgathoiSpawnDefBonus(unit);
      applyC1fSpawnAdjacencyBonuses(unit);
      applyC2c6aHandCardSpawnBonuses(unit, handCard);
      unit.acted = !unit.vanguard;
      state.units.push(unit);
      if (starterRole && typeof markStarterOrigin === "function") markStarterOrigin(unit, side, starterRole, paid);
      const ownHq = getHq(side);
      if (ownHq && sameCoord(coord, ownHq.pos) && state.f9n3Telemetry) state.f9n3Telemetry.hqDeployments[side] = (state.f9n3Telemetry.hqDeployments[side] || 0) + 1;
      if (typeof triggerMinesAt === "function") triggerMinesAt(unit.pos, unit);
      if (typeof triggerCellEffectsAt === "function") triggerCellEffectsAt(unit.pos, unit);
      if (starterCard && typeof missionConsumeCardCostSequence === "function") missionConsumeCardCostSequence(side, starterCard);
      log(`${playerName(side)} acquista ${unit.name} #${unit.instanceNo} per ${paid} ENE e lo piazza in [${coord.join(",")}].${unit.vanguard ? " Avanguardia: può agire subito." : " Entra esausto."}`, EventTypes.UNIT_SPAWNED, {
        player: side,
        faction: state.factions[side],
        unitId: unit.uid,
        unitName: unit.name,
        blueprintId: bp.id,
        cost: paid,
        coord: [...coord],
        exhausted: !unit.vanguard,
        spawnSource: unit.spawnSource || "deck_or_market",
        starterRole: unit.starterRole || null,
        deployedOnOwnHq: Boolean(ownHq && sameCoord(coord, ownHq.pos))
      });
      return true;
    }



    function applyAgathoiSpawnDefBonus(unit) {
      if (!unit || unit.faction !== "Agathoi" || unit.type !== "Fanteria" || !unit.pos) return;
      const bonusSource = combatUnits(unit.side).find(s => s.faction === "Agathoi" && s.type === "Struttura" && s.spawnDefBonus && areAdjacent(s.pos, unit.pos));
      if (!bonusSource) return;
      const bonus = bonusSource.spawnDefBonus || 1;
      unit.currentDef += bonus;
      log(`${unit.name} entra con +${bonus} DEF corrente grazie a ${bonusSource.name}.`);
    }




    function applyC1fSpawnAdjacencyBonuses(unit) {
      if (!unit || !unit.pos) return;
      for (const s of combatUnits(unit.side).filter(x => x.type === "Struttura" && areAdjacent(x.pos, unit.pos))) {
        if (s.spawnAdjacentPermanentAtt) {
          unit.baseAtt += s.spawnAdjacentPermanentAtt || 1;
          unit.currentAtt += s.spawnAdjacentPermanentAtt || 1;
          log(`${unit.name} entra con +${s.spawnAdjacentPermanentAtt || 1} ATT permanente grazie a ${s.name}.`);
        }
      }
    }

    function buildStructure(builder, bp, coord, options={}) {
      const buildSource = options.buildSource === "own_hq" ? "own_hq" : "unit";
      const side = buildSource === "own_hq" ? Number(options.side) : (builder && builder.side);
      const hqCell = buildSource === "own_hq" && typeof ownHqBuildCell === "function" ? ownHqBuildCell(side) : null;
      if (!side || !bp || (buildSource === "unit" && !builder) || (buildSource === "own_hq" && (!hqCell || !sameCoord(coord, hqCell)))) return false;
      const handCard = c2c6aPendingHandCardFor(side, bp);
      const starterCard = !handCard && pendingStarterCardUid ? starterCardByUid(side, pendingStarterCardUid) : null;
      const costCard = handCard || starterCard;
      const paid = effectiveHandUnitCardCost(side, costCard, bp, coord);
      const starterRole = options.spawnSource === "starter" ? options.starterRole : null;
      if (starterRole && typeof tacticalStarterCapState === "function" && tacticalStarterCapState(side, starterRole).blocked) {
        if (typeof noteTacticalStarterCapBlocked === "function") noteTacticalStarterCapBlocked(side, starterRole);
        return false;
      }
      if ((playerEnergyLocked(side) && paid > 0) || state.energy[side] < paid || purchaseLimitReached(side, bp)) return false;
      const structure = createUnitFromBlueprint(bp, side);
      state.energy[side] -= paid;
      structure.pos = [...coord];
      structure.acted = true;
      state.units.push(structure);
      if (starterRole && typeof markStarterOrigin === "function") markStarterOrigin(structure, side, starterRole, paid);
      if (builder) builder.builtThisTurn = true;
      if (buildSource === "own_hq" && state.f9n3Telemetry) state.f9n3Telemetry.hqBuilds[side] = (state.f9n3Telemetry.hqBuilds[side] || 0) + 1;
      if (starterCard && typeof missionConsumeCardCostSequence === "function") missionConsumeCardCostSequence(side, starterCard);
      const builderLabel = buildSource === "own_hq" ? `QG ${state.factions[side]}` : builder.name;
      log(`${builderLabel} costruisce ${structure.name} #${structure.instanceNo} in [${coord.join(",")}] per ${paid} ENE.`, EventTypes.UNIT_BUILT, {
        player: side,
        faction: state.factions[side],
        builderId: builder ? builder.uid : null,
        builderName: builderLabel,
        buildSource,
        unitId: structure.uid,
        unitName: structure.name,
        blueprintId: bp.id,
        cost: paid,
        coord: [...coord]
      });
      return true;
    }



    function isBuildTarget(coord) {
      const u = getSelectedUnit();
      if (mode !== "build" || !pendingBuildBlueprintId) return false;
      if (pendingBuildSource && pendingBuildSource.type === "own_hq") {
        const cell = typeof ownHqBuildCell === "function" ? ownHqBuildCell(pendingBuildSource.side) : null;
        return Boolean(cell && sameCoord(cell, coord));
      }
      return Boolean(u && buildableCells(u).some(c => sameCoord(c, coord)));
    }



    function isSpawnTarget(coord) {
      if (mode !== "spawn" || !pendingPurchaseBlueprintId) return false;
      const bp = pendingBlueprintForHandOrMarket(state.currentPlayer, pendingPurchaseBlueprintId);
      return Boolean(bp) && spawnCellsFor(state.currentPlayer, bp).some(c => sameCoord(c, coord));
    }



    function spawnSourcesFor(player) {
      const hq = getHq(player);
      return [hq.pos, ...combatUnits(player).filter(u => u.type === "Struttura").map(u => u.pos)];
    }

    function specialSpawnSourcesFor(player, bp=null) {
      if (!bp || !countsAsLightCap(bp)) return [];
      const sources = [];
      for (const s of combatUnits(player).filter(u => u.type === "Struttura" && u.specialSpawn)) {
        const rule = s.specialSpawn;
        if (rule.onlyLight && !countsAsLightCap(bp)) continue;
        if (Array.isArray(rule.unitTypes) && !rule.unitTypes.includes(bp.type)) continue;
        sources.push({ source:s.pos, range:rule.range || 1 });
      }
      return sources;
    }

    function cellsInRangeFrom(source, range) {
      return state.cells.map(c => c.coord).filter(c => hexDistance(source, c) <= range && hexDistance(source, c) > 0);
    }

    function spawnCellsFor(player, bp=null) {
      const enemyHq = getHq(enemyOf(player));
      const seen = new Set();
      const cells = [];
      const addCell = (c) => {
        const key = coordKey(c);
        if (!seen.has(key) && isCellEnterable(c) && !getUnitAt(c) && hexDistance(c, enemyHq.pos) > 1) {
          seen.add(key);
          cells.push(c);
        }
      };
      const ownHq = getHq(player);
      if (ownHq && Array.isArray(ownHq.pos)) addCell(ownHq.pos);
      for (const source of spawnSourcesFor(player)) for (const c of neighbors(source)) addCell(c);
      for (const src of specialSpawnSourcesFor(player, bp)) for (const c of cellsInRangeFrom(src.source, src.range)) addCell(c);
      return cells;
    }



    function canBuildStructures(unit) {
      return Boolean(unit && (unit.type === "Fanteria" || unit.canBuild));
    }



    function buildableCells(unit) {
      if (!canAct(unit) || !unit.pos || !canBuildStructures(unit)) return [];
      return neighbors(unit.pos).filter(c => isCellEnterable(c) && !getUnitAt(c));
    }



    function canAnyInfantryBuild(player, structure) {
      const unitPath = activeCombatUnits(player).some(u => canBuildStructures(u) && buildableCells(u).length > 0);
      const hqPath = typeof canBuildFromOwnHq === "function" && canBuildFromOwnHq(player, structure);
      return !playerEnergyLocked(player) && !purchaseLimitReached(player, structure) && (unitPath || hqPath) && state.energy[player] >= effectiveBlueprintCost(player, structure);
    }
