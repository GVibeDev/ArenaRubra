"use strict";

// Arena Rubra – Fase B3a
// Render isolation prudente.
// Questo file contiene funzioni di rendering/UI/log DOM estratte da src/main.js.
// Non introduce nuove meccaniche e non modifica il gameplay.

const MAP_HAND_OVERLAY_STATE = {
      selectedCardUid: "",
      selectedSource: "",
      selectedSide: 0,
      hiddenForTarget: false,
      hiddenForMovement: false,
      manuallyCollapsed: false,
      lastSide: 0,
      hoverCardUid: "",
      hoverSource: "",
      hoverSide: 0,
      renderSignature: ""
    };

    const HAND_THUMB_RENDER_QUEUE = {
      frame: 0,
      pending: [],
      queued: new Set(),
      renderedThisRun: 0
    };

// Nota architetturale:
// Le funzioni qui presenti usano ancora lo stato globale e varie funzioni del motore.
// È una separazione fisica controllata, non ancora un renderer puro/headless.


    function syncBoardCssMetrics() {
      if (typeof document === "undefined" || !document.documentElement) return;
      const root = document.documentElement;
      if (typeof CENTER_X !== "undefined") root.style.setProperty("--hex-center-x", `${CENTER_X}px`);
      if (typeof CENTER_Y !== "undefined") root.style.setProperty("--hex-center-y", `${CENTER_Y}px`);
      if (typeof HEX_SIZE !== "undefined") root.style.setProperty("--hex-size", `${HEX_SIZE}px`);
      root.style.setProperty("--board-native-width", "920px");
      root.style.setProperty("--board-native-height", "780px");
    }

    function syncMapVisualLayerState() {
      const stack = typeof document !== "undefined" ? document.getElementById("boardVisualStack") : null;
      if (!stack || typeof state === "undefined" || !state) return;
      stack.dataset.mapRadius = String(typeof RADIUS !== "undefined" ? RADIUS : "");
      stack.dataset.mapVisualMode = "skin-slot";
      stack.dataset.mapCells = Array.isArray(state.cells) ? String(state.cells.length) : "0";
      if (typeof mapSkinLoadKey === "function") stack.dataset.mapSkin = mapSkinLoadKey();
    }


    function renderAll() {
      renderBoard();
      renderPanels();
      renderMarket();
      renderRoster();
      renderCardZonePanel();
      if (typeof renderMapHandOverlay === "function") renderMapHandOverlay();
      if (typeof renderMapHandSelectionPreview === "function") renderMapHandSelectionPreview();
      if (typeof renderMapActionDock === "function") renderMapActionDock();
      renderMatchupStats();
      if (typeof renderCurrentMatchStatsPanel === "function") renderCurrentMatchStatsPanel();
      if (typeof renderPersistentMatchHistoryPanel === "function") renderPersistentMatchHistoryPanel();
      if (typeof renderGameHud === "function") renderGameHud();
      if (typeof syncBoardCameraAfterRender === "function") syncBoardCameraAfterRender();
      if (typeof combatFeedbackAfterRender === "function") combatFeedbackAfterRender();
    }



    const BOARD_DOM_CACHE = {
      board: null,
      structureKey: "",
      cells: new Map(),
      unitNodes: new Map(),
      unitSignatures: new Map(),
      delegatedClick: null,
      generation: 0,
      lastMetrics: {
        fullBuilds: 0,
        renders: 0,
        patchedCells: 0,
        patchedTokens: 0,
        reusedTokens: 0,
        skeletonRepairs: 0
      }
    };


    function boardRenderCoordKey(coord) {
      return Array.isArray(coord) ? coord.join(",") : String(coord || "");
    }


    function boardRenderParseCoordKey(key) {
      const values = String(key || "").split(",").map(Number);
      return values.length === 3 && values.every(Number.isFinite) ? values : null;
    }


    function boardRenderResetCache() {
      BOARD_DOM_CACHE.board = null;
      BOARD_DOM_CACHE.structureKey = "";
      BOARD_DOM_CACHE.cells.clear();
      BOARD_DOM_CACHE.unitNodes.clear();
      BOARD_DOM_CACHE.unitSignatures.clear();
      BOARD_DOM_CACHE.delegatedClick = null;
      BOARD_DOM_CACHE.generation += 1;
    }


    function boardRenderDiagnostics() {
      return {
        generation: BOARD_DOM_CACHE.generation,
        cells: BOARD_DOM_CACHE.cells.size,
        unitNodes: BOARD_DOM_CACHE.unitNodes.size,
        ...BOARD_DOM_CACHE.lastMetrics
      };
    }


    function boardRenderHandleDelegatedClick(event) {
      const board = BOARD_DOM_CACHE.board;
      if (!board || !event || !event.target || typeof event.target.closest !== "function") return;
      const cell = event.target.closest(".hex[data-coord-key]");
      if (!cell || !board.contains(cell)) return;
      const coord = boardRenderParseCoordKey(cell.dataset.coordKey);
      if (coord && typeof handleCellClick === "function") handleCellClick(coord);
    }


    function boardRenderStructureKey() {
      if (!state || !Array.isArray(state.cells)) return "";
      return state.cells.map(cell => boardRenderCoordKey(cell.coord)).join("|");
    }


    function boardRenderReplaceChildrenCompat(board, fragment) {
      if (!board) return;
      if (typeof board.replaceChildren === "function") {
        board.replaceChildren(fragment);
        return;
      }
      while (board.firstChild) board.removeChild(board.firstChild);
      board.appendChild(fragment);
    }


    function boardRenderCacheNodesConnected(board) {
      if (!board || BOARD_DOM_CACHE.cells.size === 0) return false;
      for (const entry of BOARD_DOM_CACHE.cells.values()) {
        if (!entry || !entry.element || entry.element.parentNode !== board) return false;
      }
      return true;
    }


    function boardRenderEnsureSkeleton(board) {
      const structureKey = boardRenderStructureKey();
      const cacheValid = BOARD_DOM_CACHE.board === board
        && BOARD_DOM_CACHE.structureKey === structureKey
        && BOARD_DOM_CACHE.cells.size === state.cells.length
        && board.childElementCount === state.cells.length
        && boardRenderCacheNodesConnected(board);
      if (cacheValid) return false;

      if (BOARD_DOM_CACHE.board && BOARD_DOM_CACHE.delegatedClick) {
        BOARD_DOM_CACHE.board.removeEventListener("click", BOARD_DOM_CACHE.delegatedClick);
      }
      BOARD_DOM_CACHE.board = board;
      BOARD_DOM_CACHE.structureKey = structureKey;
      BOARD_DOM_CACHE.cells.clear();
      BOARD_DOM_CACHE.unitNodes.clear();
      BOARD_DOM_CACHE.unitSignatures.clear();
      BOARD_DOM_CACHE.delegatedClick = boardRenderHandleDelegatedClick;

      const advancedMap = state.mapId && state.mapId !== "map1_starter";
      const rawPoints = state.cells.map(cell => {
        const q = cell.coord[0];
        const r = cell.coord[2];
        return {
          x: HEX_SIZE * Math.sqrt(3) * (q + r / 2),
          y: HEX_SIZE * 1.5 * r
        };
      });
      const minX = rawPoints.length ? Math.min(...rawPoints.map(point => point.x)) : 0;
      const maxX = rawPoints.length ? Math.max(...rawPoints.map(point => point.x)) : 0;
      const minY = rawPoints.length ? Math.min(...rawPoints.map(point => point.y)) : 0;
      const maxY = rawPoints.length ? Math.max(...rawPoints.map(point => point.y)) : 0;
      const dynamicCenterX = advancedMap ? 70 - minX : CENTER_X;
      const dynamicCenterY = advancedMap ? 70 - minY : CENTER_Y;
      const nativeWidth = advancedMap ? Math.ceil(maxX - minX + 140) : 920;
      const nativeHeight = advancedMap ? Math.ceil(maxY - minY + 140) : 780;
      board.style.width = `${nativeWidth}px`;
      board.style.height = `${nativeHeight}px`;
      document.documentElement.style.setProperty("--board-native-width", `${nativeWidth}px`);
      document.documentElement.style.setProperty("--board-native-height", `${nativeHeight}px`);
      board.dataset.mapId = state.mapId || "map1_starter";

      const fragment = document.createDocumentFragment();
      for (const cell of state.cells) {
        const [x, y, z] = cell.coord;
        const q = x;
        const r = z;
        const left = dynamicCenterX + HEX_SIZE * Math.sqrt(3) * (q + r / 2);
        const top = dynamicCenterY + HEX_SIZE * 1.5 * r;
        const element = document.createElement("button");
        element.type = "button";
        element.className = "hex";
        element.dataset.coordKey = boardRenderCoordKey(cell.coord);
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        const coordLabel = document.createElement("span");
        coordLabel.className = "coord";
        coordLabel.textContent = `${x},${y},${z}`;
        element.appendChild(coordLabel);
        fragment.appendChild(element);
        BOARD_DOM_CACHE.cells.set(element.dataset.coordKey, {
          element,
          coordLabel,
          cellSignature: "",
          tokenUid: ""
        });
      }
      boardRenderReplaceChildrenCompat(board, fragment);
      board.addEventListener("click", BOARD_DOM_CACHE.delegatedClick);
      BOARD_DOM_CACHE.generation += 1;
      BOARD_DOM_CACHE.lastMetrics.fullBuilds += 1;
      BOARD_DOM_CACHE.lastMetrics.skeletonRepairs += 1;
      return true;
    }


    function boardRenderCoordSet(items) {
      const out = new Set();
      for (const item of Array.isArray(items) ? items : []) {
        const coord = Array.isArray(item) ? item : item && Array.isArray(item.pos) ? item.pos : item && Array.isArray(item.coord) ? item.coord : null;
        if (coord) out.add(boardRenderCoordKey(coord));
      }
      return out;
    }


    function boardRenderTargetSets() {
      const empty = () => new Set();
      const targets = {
        move: empty(),
        attack: empty(),
        ability: empty(),
        build: empty(),
        spawn: empty()
      };
      const selected = typeof getSelectedUnit === "function" ? getSelectedUnit() : null;
      try {
        if (mode === "move" && selected && typeof movableCells === "function") targets.move = boardRenderCoordSet(movableCells(selected));
        if (mode === "idle" && selected && selected.side === state.currentPlayer && selected.type !== "QG" && typeof canAttack === "function" && canAttack(selected) && typeof adjacentAttackTargets === "function") targets.attack = boardRenderCoordSet(adjacentAttackTargets(selected));
        if (mode === "ability" && selected && pendingAbility && typeof abilityTargets === "function") targets.ability = boardRenderCoordSet(abilityTargets(selected, pendingAbility));
        if (mode === "tactic") {
          let tacticTargetsNow = [];
          if (pendingHandCardUid && typeof handCardByUid === "function" && typeof handTacticTargets === "function") {
            const card = handCardByUid(state.currentPlayer, pendingHandCardUid);
            if (card) tacticTargetsNow = handTacticTargets(state.currentPlayer, card);
          } else if (pendingTacticId && typeof tacticById === "function" && typeof tacticTargets === "function") {
            const tactic = tacticById(pendingTacticId);
            if (tactic) tacticTargetsNow = tacticTargets(state.currentPlayer, tactic);
          }
          targets.ability = boardRenderCoordSet(tacticTargetsNow);
        }
        if (mode === "build" && pendingBuildBlueprintId) {
          if (pendingBuildSource && pendingBuildSource.type === "own_hq" && typeof ownHqBuildCell === "function") {
            const ownHqCell = ownHqBuildCell(pendingBuildSource.side);
            targets.build = boardRenderCoordSet(ownHqCell ? [ownHqCell] : []);
          } else if (selected && typeof buildableCells === "function") {
            targets.build = boardRenderCoordSet(buildableCells(selected));
          }
        }
        if (mode === "spawn" && pendingPurchaseBlueprintId && typeof pendingBlueprintForHandOrMarket === "function" && typeof spawnCellsFor === "function") {
          const bp = pendingBlueprintForHandOrMarket(state.currentPlayer, pendingPurchaseBlueprintId);
          if (bp) targets.spawn = boardRenderCoordSet(spawnCellsFor(state.currentPlayer, bp));
        }
      } catch (error) {
        console.warn("F9O4b target cache fallback", error);
      }
      return targets;
    }


    function boardRenderCellVisualIndex() {
      const index = new Map();
      const ensure = key => {
        if (!index.has(key)) index.set(key, { psLocked:false, blocked:false, kinds:new Set(), summary:"" });
        return index.get(key);
      };
      for (const lock of state && Array.isArray(state.psLocks) ? state.psLocks : []) {
        if (lock && Array.isArray(lock.coord)) ensure(boardRenderCoordKey(lock.coord)).psLocked = true;
      }
      const summaries = new Map();
      for (const effect of state && Array.isArray(state.cellEffects) ? state.cellEffects : []) {
        if (!effect || !Array.isArray(effect.coord)) continue;
        const key = boardRenderCoordKey(effect.coord);
        const visual = ensure(key);
        visual.kinds.add(effect.kind || "");
        if (effect.kind === "temporary_block_cell") visual.blocked = true;
        const label = typeof cellEffectLabel === "function" ? cellEffectLabel(effect) : (effect.source || effect.kind || "Effetto cella");
        const summary = `${label}${Number.isFinite(effect.turns) ? ` (${effect.turns})` : ""}`;
        if (!summaries.has(key)) summaries.set(key, []);
        summaries.get(key).push(summary);
      }
      for (const [key, parts] of summaries.entries()) ensure(key).summary = parts.join(" · ");
      return index;
    }


    function boardRenderCellClasses(cell, unit, hqSide, flags, displayedSelectedId, visual) {
      const classes = ["hex"];
      const terrain = typeof getMapTerrainAt === "function" ? getMapTerrainAt(cell.coord) : null;
      if (terrain && terrain.visualClass) classes.push(terrain.visualClass);
      if (terrain && terrain.blocksMovement) classes.push("terrainBlocksMovement");
      if (cell.initialHazard && cell.initialHazard.type) classes.push(`initialHazard-${cell.initialHazard.type}`);
      if (cell.ps) classes.push("ps", "cellObjective");
      if (cell.ps && visual.psLocked) classes.push("psLocked");
      if (visual.blocked) classes.push("cellBlocked");
      if (visual.kinds.has("cell_movement_trap")) classes.push("cellTrapNexus");
      if (visual.kinds.has("cell_movement_boost")) classes.push("cellPassageNexus");
      if (visual.kinds.has("vegetal_anathema_trap")) classes.push("cellTrapAgathoi");
      if (visual.kinds.has("bramble_path_trap")) classes.push("cellBramble");
      if (hqSide) classes.push("hq", `hq${hqSide}`, "cellObjective");
      if (cell.control) classes.push("controlledCell", `controlledSide${cell.control}`);
      if (displayedSelectedId && unit && unit.uid === displayedSelectedId) classes.push("selected");
      if (flags.tacticalTarget) classes.push("tacticalTarget");
      if (flags.moveTarget) classes.push("moveTarget");
      if (flags.attackTarget) classes.push("attackTarget");
      if (flags.abilityTarget) classes.push("abilityTarget");
      if (flags.buildTarget) classes.push("buildTarget");
      if (flags.spawnTarget) classes.push("spawnTarget");
      if (unit) {
        classes.push("occupied");
        const occupiedTypeClass = tokenTypeClass(unit);
        const occupiedWeightClass = tokenWeightClass(unit);
        if (occupiedTypeClass) classes.push(`occupied-${occupiedTypeClass}`);
        if (occupiedWeightClass) classes.push(`occupied-${occupiedWeightClass}`);
        if (unit.customRuntime === true) classes.push("occupied-custom");
      }
      return classes.join(" ");
    }


    function boardRenderCellTitle(cell, hqSide, visual) {
      const notes = [];
      const terrain = typeof getMapTerrainAt === "function" ? getMapTerrainAt(cell.coord) : null;
      if (terrain && terrain.id !== "free") {
        const defense = terrain.defenseModifier ? ` · DEF ${terrain.defenseModifier > 0 ? "+" : ""}${terrain.defenseModifier}` : "";
        const movement = terrain.blocksMovement ? " · invalicabile" : terrain.movementCost > 1 ? ` · costo movimento ${terrain.movementCost}` : "";
        notes.push(`${terrain.name}${defense}${movement}`);
      }
      if (cell.initialHazard) notes.push(`Pericolo iniziale: ${cell.initialHazard.type}`);
      if (cell.ps) notes.push(visual.psLocked ? "Punto Strategico bloccato" : "Punto Strategico");
      if (hqSide) notes.push(`QG ${playerName(hqSide)} · cella obiettivo`);
      if (visual.summary) notes.push(visual.summary);
      return `${boardRenderCoordKey(cell.coord)} ${notes.length ? "· " + notes.join(" · ") : ""}`;
    }


    function boardRenderTokenSignature(unit, displayedSelectedId, tokenArtPath, tokenArtStatus) {
      return [
        unit.uid,
        unit.name,
        unit.faction,
        unit.type,
        unit.weight,
        unit.unitClass || "",
        unit.tokenClass || "",
        unit.customRuntime === true ? 1 : 0,
        displayedSelectedId && unit.uid === displayedSelectedId ? 1 : 0,
        unit.acted && unit.type !== "QG" ? 1 : 0,
        hasStatus(unit, "bleed") ? 1 : 0,
        hasAnyInhibition(unit) ? 1 : 0,
        effectiveThorns(unit) || 0,
        unit.currentHp,
        unit.maxHp,
        typeof getEffectiveDefense === "function" ? getEffectiveDefense(unit) : unit.currentDef,
        effectiveAtt(unit),
        unitStatusSummary(unit),
        unitIcon(unit),
        unitOverlay(unit),
        tokenArtPath || "",
        tokenArtStatus || ""
      ].join("¦");
    }


    function boardRenderPatchToken(token, unit, displayedSelectedId, tokenArtPath, tokenArtStatus) {
      const tokenClasses = ["unitToken", `faction-${factionMeta(unit.faction).key}`, tokenTypeClass(unit), tokenWeightClass(unit), tokenTaxonomyClass(unit)].filter(Boolean);
      if (unit.customRuntime === true) tokenClasses.push("is-custom");
      if (displayedSelectedId && unit.uid === displayedSelectedId) tokenClasses.push("is-selected");
      if (unit.acted && unit.type !== "QG") tokenClasses.push("acted");
      if (hasStatus(unit, "bleed")) tokenClasses.push("bleeding");
      if (hasAnyInhibition(unit)) tokenClasses.push("inhibited");
      if (effectiveThorns(unit)) tokenClasses.push("thorns");
      if (tokenArtPath) {
        tokenClasses.push("has-token-art");
        if (tokenArtStatus === "loaded") tokenClasses.push("token-art-loaded");
        else if (tokenArtStatus === "missing") tokenClasses.push("token-art-missing");
        else tokenClasses.push("token-art-loading");
      }
      token.className = tokenClasses.join(" ");
      token.dataset.unitUid = String(unit.uid || "");
      token.dataset.unitPos = Array.isArray(unit.pos) ? unit.pos.join(",") : "";
      token.dataset.unitClass = String(unit.unitClass || "");
      token.dataset.tokenClass = String(unit.tokenClass || unit.unitClass || "");
      if (tokenArtPath) token.dataset.tokenArt = tokenArtPath;
      else delete token.dataset.tokenArt;
      const customBadge = unit.customRuntime === true ? `<span class="tokenCustomBadge" title="Custom runtime">C</span>` : "";
      const selectionCues = displayedSelectedId && unit.uid === displayedSelectedId
        ? `<span class="tokenSelectionHalo" aria-hidden="true"></span><span class="tokenActiveArrow" aria-hidden="true"></span>`
        : "";
      const displayedDefense = typeof getEffectiveDefense === "function" ? getEffectiveDefense(unit) : unit.currentDef;
      const terrainModifier = typeof getTerrainDefenseModifier === "function" ? getTerrainDefenseModifier(unit) : 0;
      const terrainBadge = terrainModifier ? `<span class="terrainBadge" title="Modificatore DEF del terreno">${terrainModifier > 0 ? "+" : ""}${terrainModifier}</span>` : "";
      token.innerHTML = `<span class="tokenFactionBase" aria-hidden="true"></span><span class="symbol">${unitIcon(unit)}</span>${unitOverlay(unit)}${customBadge}<span class="mini statMini"><span class="statNum statHp">${unit.currentHp}</span><span class="statNum statDef">${displayedDefense}</span><span class="statNum statAtt">${effectiveAtt(unit)}</span></span>${terrainBadge}${selectionCues}`;
      if (tokenArtPath) {
        const art = document.createElement("span");
        art.className = "tokenArt";
        art.setAttribute("aria-hidden", "true");
        art.style.backgroundImage = `url("${String(tokenArtPath).replace(/\"/g, "%22")}")`;
        token.prepend(art);
        if (tokenArtStatus !== "loaded" && tokenArtStatus !== "missing" && typeof visualAssetPreloadTokenArt === "function") {
          const expectedUid = String(unit.uid || "");
          visualAssetPreloadTokenArt(tokenArtPath, nextStatus => {
            if (!token || !token.isConnected || token.dataset.unitUid !== expectedUid || token.dataset.tokenArt !== tokenArtPath) return;
            token.classList.remove("token-art-loading");
            token.classList.toggle("token-art-loaded", nextStatus === "loaded");
            token.classList.toggle("token-art-missing", nextStatus === "missing");
            BOARD_DOM_CACHE.unitSignatures.delete(expectedUid);
          });
        }
      }
      token.title = `${unit.name}\nHP ${unit.currentHp}/${unit.maxHp} · DEF ${unit.currentDef} · ATT ${effectiveAtt(unit)}${unitStatusSummary(unit) ? "\nStati: " + unitStatusSummary(unit) : ""}`;
    }


    function renderBoard() {
      if (typeof syncBoardCssMetrics === "function") syncBoardCssMetrics();
      if (typeof syncMapVisualLayerState === "function") syncMapVisualLayerState();
      const board = $("board");
      if (!board || !state || !Array.isArray(state.cells)) return;
      const displayedSelectedId = typeof gameScreenDisplayedUnitId === "function" ? gameScreenDisplayedUnitId() : selectedId;
      board.dataset.interactionMode = mode || "idle";
      board.classList.toggle("has-tactical-mode", Boolean(mode && mode !== "idle"));
      boardRenderEnsureSkeleton(board);

      const targetSets = boardRenderTargetSets();
      const cellVisualIndex = boardRenderCellVisualIndex();
      const emptyCellVisual = { psLocked:false, blocked:false, kinds:new Set(), summary:"" };
      const occupancy = new Map();
      for (const unit of Array.isArray(state.units) ? state.units : []) {
        // F9O5b: il QG resta una pseudo-unità logica per regole, vittoria e costruzione,
        // ma la sua casella-obiettivo non deve produrre un token, una silhouette o statistiche 0/0/0.
        if (unit && unit.alive && unit.type !== "QG" && Array.isArray(unit.pos)) occupancy.set(boardRenderCoordKey(unit.pos), unit);
      }
      const activeUnitIds = new Set();
      let patchedCells = 0;
      let patchedTokens = 0;
      let reusedTokens = 0;

      for (const cell of state.cells) {
        const key = boardRenderCoordKey(cell.coord);
        const entry = BOARD_DOM_CACHE.cells.get(key);
        if (!entry) continue;
        const unit = occupancy.get(key) || null;
        const hqSide = hqSideAt(cell.coord);
        const cellVisual = cellVisualIndex.get(key) || emptyCellVisual;
        const flags = {
          moveTarget: targetSets.move.has(key),
          attackTarget: targetSets.attack.has(key),
          abilityTarget: targetSets.ability.has(key),
          buildTarget: targetSets.build.has(key),
          spawnTarget: targetSets.spawn.has(key)
        };
        flags.tacticalTarget = flags.moveTarget || flags.attackTarget || flags.abilityTarget || flags.buildTarget || flags.spawnTarget;
        const className = boardRenderCellClasses(cell, unit, hqSide, flags, displayedSelectedId, cellVisual);
        const controlColor = cell.control ? factionMetaBySide(cell.control).color : "";
        const title = boardRenderCellTitle(cell, hqSide, cellVisual);
        const signature = [className, controlColor, title, unit ? unit.uid : ""].join("¦");
        if (entry.cellSignature !== signature) {
          entry.element.className = className;
          entry.element.title = title;
          if (controlColor) {
            entry.element.style.setProperty("--cell-control-color", controlColor);
            entry.element.style.boxShadow = `inset 0 0 0 3px ${controlColor}cc`;
          } else {
            entry.element.style.removeProperty("--cell-control-color");
            entry.element.style.removeProperty("box-shadow");
          }
          entry.cellSignature = signature;
          patchedCells += 1;
        }

        if (!unit) {
          const stale = entry.element.querySelector(".unitToken");
          if (stale) stale.remove();
          entry.tokenUid = "";
          continue;
        }

        const uid = String(unit.uid || "");
        activeUnitIds.add(uid);
        let token = BOARD_DOM_CACHE.unitNodes.get(uid);
        if (!token) {
          token = document.createElement("div");
          BOARD_DOM_CACHE.unitNodes.set(uid, token);
        } else {
          reusedTokens += 1;
        }
        let tokenArtPath = "";
        let tokenArtStatus = "";
        if (typeof visualAssetTokenGraphicsEnabled === "function" && visualAssetTokenGraphicsEnabled() && typeof visualAssetTokenArtForUnit === "function") {
          tokenArtPath = visualAssetTokenArtForUnit(unit) || "";
          tokenArtStatus = tokenArtPath && typeof visualAssetTokenAssetStatus === "function" ? visualAssetTokenAssetStatus(tokenArtPath) : "";
        }
        const tokenSignature = boardRenderTokenSignature(unit, displayedSelectedId, tokenArtPath, tokenArtStatus);
        if (BOARD_DOM_CACHE.unitSignatures.get(uid) !== tokenSignature) {
          boardRenderPatchToken(token, unit, displayedSelectedId, tokenArtPath, tokenArtStatus);
          BOARD_DOM_CACHE.unitSignatures.set(uid, tokenSignature);
          patchedTokens += 1;
        } else {
          token.dataset.unitPos = Array.isArray(unit.pos) ? unit.pos.join(",") : "";
        }
        if (token.parentNode !== entry.element || token.nextSibling !== entry.coordLabel) entry.element.insertBefore(token, entry.coordLabel);
        entry.tokenUid = uid;
      }

      for (const [uid, token] of [...BOARD_DOM_CACHE.unitNodes.entries()]) {
        if (activeUnitIds.has(uid)) continue;
        if (token && token.parentNode) token.remove();
        BOARD_DOM_CACHE.unitNodes.delete(uid);
        BOARD_DOM_CACHE.unitSignatures.delete(uid);
      }

      BOARD_DOM_CACHE.lastMetrics.renders += 1;
      BOARD_DOM_CACHE.lastMetrics.patchedCells = patchedCells;
      BOARD_DOM_CACHE.lastMetrics.patchedTokens = patchedTokens;
      BOARD_DOM_CACHE.lastMetrics.reusedTokens = reusedTokens;
      board.dataset.renderer = "incremental-f9o4c";
      board.dataset.rendererPatches = `${patchedCells}:${patchedTokens}`;
    }



    function renderPanels() {
      const currentName = playerName(state.currentPlayer);
      const currentMode = state.modes[state.currentPlayer] === "bot" ? "Bot" : "Umano";
      const hq1 = getHq(1);
      const hq2 = getHq(2);
      const field1 = combatUnits(1).length;
      const field2 = combatUnits(2).length;
      const multiplayerSummary = (typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(state) : [1, 2]).map(side => {
        const player = typeof getPlayerById === "function" ? getPlayerById(side) : null;
        const eliminated = player && player.eliminated ? " · ELIMINATO" : "";
        return `<span class="pill${eliminated ? " bad" : ""}">G${side} ${escapeHtml(state.factions[side])} · ${state.energy[side]} ENE · ${countControlledPS(side)} PS · ${combatUnits(side).length} unità${eliminated}</span>`;
      }).join("");
      $("p1Title").textContent = playerName(1);
      $("p2Title").textContent = playerName(2);
      $("p1Title").className = `faction-${factionMetaBySide(1).key}-text`;
      $("p2Title").className = `faction-${factionMetaBySide(2).key}-text`;
      $("p1Score").textContent = `QG: ${hqOccupancyText(1)} · ENE: ${state.energy[1]} · PS: ${countControlledPS(1)} · Pressione: ${state.pressure[1]}/${PRESSURE_WIN} · Campo: ${field1}`;
      $("p2Score").textContent = `QG: ${hqOccupancyText(2)} · ENE: ${state.energy[2]} · PS: ${countControlledPS(2)} · Pressione: ${state.pressure[2]}/${PRESSURE_WIN} · Campo: ${field2}`;
      $("turnInfo").innerHTML = `
        <h4>Round ${state.turn} <span>${currentName}</span></h4>
        <div class="stats f9qPlayerStandings">${multiplayerSummary}</div>
        <div class="meta">Mappa: ${escapeHtml(state.mapDefinition ? state.mapDefinition.name : "MAP1")} · ${state.cells.length} celle · movimento ×${state.mapDefinition ? state.mapDefinition.movementMultiplier : 1}${state.mapLabMode ? " · MATCH LAB" : ""}</div>
        <div class="meta">Giocatore corrente: ${currentMode} · AI bot: ${state.aiMode === "advanced" ? "Avanzata" : "Base"} · Ritmo: ${paceLabel()} · ENE disponibili: ${state.energy[state.currentPlayer]} · PS presidiati: ${countControlledPS(state.currentPlayer)}</div>
        <div class="meta">Effetti economici: ${economicEffectsSummary(state.currentPlayer)}</div>
        <div class="meta">Dottrina fazione: ${doctrineSummary(state.currentPlayer)}</div>
        <div class="stats">
          <span class="pill">QG occupabile</span>
          <span class="pill">Vittoria: PS + QG nemico</span>
          <span class="pill">Income: ${BASE_INCOME}+PS</span>
          <span class="pill">Leggere campo ${activeLightCount(state.currentPlayer)}/${lightFieldLimit(state.currentPlayer)}</span>
          <span class="pill">Pesanti 2x tipo</span>
          <span class="pill">Elite/Pivot 1x campo</span>
          <span class="pill">Pressione ${state.pressure[state.currentPlayer]}/${PRESSURE_WIN}</span>
          <span class="pill">Round max ${MAX_ROUND}</span>
          <span class="pill">Pressione dal round ${pressureStartRound()}</span>
          <span class="pill">Mov. veicoli ${vehicleMoveRange()}</span>
          <span class="pill">Edifici max ${STRUCTURE_FIELD_LIMIT} · Agathoi ${AGATHOI_STRUCTURE_FIELD_LIMIT}</span>
          <span class="pill">Tattica: ${state.tacticUsedThisTurn[state.currentPlayer] ? "usata" : "disponibile"}</span>
        </div>`;

      const selected = typeof gameScreenDisplayedUnit === "function" ? gameScreenDisplayedUnit() : getSelectedUnit();
      const panel = $("selectedPanel");
      const actions = $("actionPanel");
      const tactics = $("tacticPanel") || actions;
      actions.innerHTML = "";
      if (tactics !== actions) tactics.innerHTML = "";
      if (!selected) {
        panel.innerHTML = `${selectedUnitPreviewShellHtml()}<h4>Nessuna unità selezionata</h4><div class="meta">Clicca una tua unità attiva sulla mappa, oppure compra dal mercato.</div>`;
        if (typeof renderSelectedUnitCardPreview === "function") renderSelectedUnitCardPreview(null);
      } else {
        panel.innerHTML = `${selectedUnitPreviewShellHtml()}${unitCardHtml(selected, true)}`;
        if (typeof renderSelectedUnitCardPreview === "function") renderSelectedUnitCardPreview(selected);
        const isHumanTurn = state.modes[state.currentPlayer] === "human";
        const canCommand = isHumanTurn && selected.side === state.currentPlayer && selected.type !== "QG" && !selected.acted && selected.alive && !state.winner;
        const moveBtn = document.createElement("button");
        moveBtn.dataset.unitAction = "move";
        moveBtn.textContent = mode === "move" ? "Annulla movimento" : `Muovi di ${movementRangeFor(selected)} cella${movementRangeFor(selected) > 1 ? "e" : ""}`;
        moveBtn.disabled = !canCommand || !canMove(selected) || movableCells(selected).length === 0;
        moveBtn.addEventListener("click", () => toggleMoveMode());
        actions.appendChild(moveBtn);

        const abilityBtn = document.createElement("button");
        abilityBtn.dataset.unitAction = "ability";
        const ab = selected.ability;
        abilityBtn.textContent = ab ? `Abilità: ${ab.name}${ab.cost ? ` (${ab.cost} ENE)` : ""}` : "Nessuna abilità";
        abilityBtn.disabled = !canCommand || !ab || ab.passive || !canUseAbility(selected, ab) || abilityTargets(selected, ab).length === 0;
        abilityBtn.addEventListener("click", () => toggleAbilityMode(selected));
        actions.appendChild(abilityBtn);

        const structure = structureBlueprintFor(selected.side);
        const buildBtn = document.createElement("button");
        buildBtn.dataset.unitAction = "build";
        buildBtn.textContent = structure ? `Costruisci: ${structure.name} (${effectiveBlueprintCost(selected.side, structure)} ENE)` : "Struttura non disponibile";
        buildBtn.disabled = !canCommand || !canBuildStructures(selected) || !structure || state.energy[selected.side] < effectiveBlueprintCost(selected.side, structure) || purchaseLimitReached(selected.side, structure) || buildableCells(selected).length === 0;
        buildBtn.addEventListener("click", () => toggleBuildMode(selected));
        actions.appendChild(buildBtn);

        const passBtn = document.createElement("button");
        passBtn.dataset.unitAction = "pass";
        passBtn.className = "ghost";
        passBtn.textContent = "Passa azione unità";
        passBtn.disabled = !canCommand;
        passBtn.addEventListener("click", () => passUnit(selected));
        actions.appendChild(passBtn);
      }
      renderTacticPanel(tactics);

      $("endTurnBtn").disabled = Boolean(state.winner) || state.modes[state.currentPlayer] === "bot" || botRunning;
      $("runBotBtn").disabled = Boolean(state.winner) || botRunning;
      $("concedeBtn").disabled = Boolean(state.winner) || state.modes[state.currentPlayer] === "bot" || botRunning;
      const banner = $("winnerBanner");
      if (state.winner) {
        banner.classList.add("show");
        banner.textContent = state.winner;
      } else {
        banner.classList.remove("show");
        banner.textContent = "";
      }
    }



    function renderTacticPanel(container) {
      if (!state) return;
      const player = state.currentPlayer;
      const faction = state.factions[player];
      const isHuman = state.modes[player] === "human";
      const wrap = document.createElement("div");
      wrap.innerHTML = `<h3 style="padding-left:0; background:transparent; border-bottom:1px solid var(--line); margin-top:10px;">Tattiche ${faction}</h3>`;
      for (const tactic of tacticsForFaction(faction)) {
        const cd = tacticCooldown(player, tactic);
        const blocked = !canUseTactic(player, tactic);
        const card = document.createElement("div");
        card.className = "tacticCard" + (blocked ? " unavailable" : "");
        const targets = tactic.target === "none" ? [] : tacticTargets(player, tactic);
        let reason = "Pronta";
        if (state.tacticUsedThisTurn[player]) reason = "Tattica già usata questo turno";
        else if (cd > 0) reason = `Cooldown ${cd}`;
        else if (state.energy[player] < tactic.cost) reason = "ENE insufficiente";
        else if (tactic.target !== "none" && targets.length === 0) reason = "Nessun bersaglio valido";
        card.innerHTML = `<h4>${tactic.name}<span>${tactic.cost} ENE · CD ${tactic.cooldown}</span></h4><div class="meta">${tactic.description}</div><div class="stats"><span class="pill">${reason}</span></div>`;
        const btn = document.createElement("button");
        btn.textContent = tactic.target === "none" ? "Usa tattica" : (mode === "tactic" && pendingTacticId === tactic.id ? "Annulla bersaglio" : "Scegli bersaglio");
        btn.disabled = !isHuman || blocked || botRunning || Boolean(state.winner);
        btn.addEventListener("click", () => toggleTacticMode(tactic));
        card.appendChild(btn);
        wrap.appendChild(card);
      }
      container.appendChild(wrap);
    }

    function mapActionDockTacticReason(player, tactic, targets = null) {
      if (!state || !tactic) return "n/d";
      if (mode === "tactic" && pendingTacticId === tactic.id) return "Bersaglio in scelta";
      const cd = typeof tacticCooldown === "function" ? tacticCooldown(player, tactic) : 0;
      const targetList = Array.isArray(targets) ? targets : (tactic.target === "none" ? [] : tacticTargets(player, tactic));
      if (state.tacticUsedThisTurn && state.tacticUsedThisTurn[player]) return "già usata";
      if (cd > 0) return `CD ${cd}`;
      if (state.energy && Number.isFinite(state.energy[player]) && state.energy[player] < tactic.cost) return "ENE insuff.";
      if (tactic.target !== "none" && targetList.length === 0) return "no bersagli";
      return tactic.target === "none" ? "pronta" : `${targetList.length} bers.`;
    }

    function mapActionDockToggleTactic(tacticId) {
      if (!state || !tacticId || typeof tacticById !== "function") return false;
      const tactic = tacticById(tacticId);
      if (!tactic) return false;
      const wasActive = mode === "tactic" && pendingTacticId === tactic.id;
      MAP_HAND_OVERLAY_STATE.hiddenForTarget = false;
      MAP_HAND_OVERLAY_STATE.hiddenForMovement = !wasActive && tactic.target !== "none";
      MAP_HAND_OVERLAY_STATE.selectedCardUid = "";
      MAP_HAND_OVERLAY_STATE.selectedSource = "";
      MAP_HAND_OVERLAY_STATE.selectedSide = 0;
      if (typeof toggleTacticMode === "function") toggleTacticMode(tactic);
      if (wasActive || tactic.target === "none") MAP_HAND_OVERLAY_STATE.hiddenForMovement = false;
      if (typeof renderMapActionDock === "function") renderMapActionDock();
      return true;
    }

    function mapCollapsedHandControlsHtml(disabled = false) {
      const overlay = $("mapHandOverlay");
      const collapsed = Boolean(
        overlay &&
        overlay.classList.contains("isMovementHidden") &&
        !overlay.classList.contains("isTargeting")
      );
      if (!collapsed) return "";
      return `
        <div class="mapCollapsedHandControls" data-collapsed-hand-controls="true" aria-label="Comandi Mano ridotta">
          <button class="ghost mapHandShowBtn" type="button" onclick="mapHandOverlayShowHand()">Mostra mano</button>
          <button class="danger mapHandEndTurnBtn compact" id="mapHandEndTurnBtn" type="button" onclick="mapHandOverlayEndTurn()"${disabled ? " disabled" : ""}>Fine turno</button>
        </div>`;
    }

    function renderMapActionDock() {
      const dock = $("mapActionDock");
      if (!dock) return;
      if (!state || !state.factions || typeof tacticsForFaction !== "function") {
        dock.innerHTML = `<div class="mapActionDockEmpty">Avvia una partita per vedere le azioni.</div>`;
        dock.classList.add("isEmpty");
        return;
      }
      const player = state.currentPlayer || 1;
      const faction = state.factions[player] || "—";
      const isHuman = state.modes && state.modes[player] === "human";
      const tactics = tacticsForFaction(faction) || [];
      const income = typeof incomeSummaryForSide === "function" ? incomeSummaryForSide(player) : { total:0, sourceText:"n/d", delta:0, doctrineLabel:"n/d" };
      const currentEnergy = state.energy && Number.isFinite(state.energy[player]) ? state.energy[player] : 0;
      const disabledGlobal = Boolean(state.winner) || !isHuman || botRunning;
      if (!tactics.length) {
        dock.innerHTML = `<div class="mapActionDockEmpty">Nessuna tattica fazione.</div>`;
        dock.classList.add("isEmpty");
        return;
      }
      dock.classList.remove("isEmpty");
      if (dock.dataset) dock.dataset.renderSignature = [
        player,
        state.turn || 0,
        currentEnergy,
        typeof missionUiRenderSignature === "function" ? missionUiRenderSignature(player) : "mission-ui-unavailable"
      ].join("¦");
      const rows = tactics.map(tactic => {
        const targets = tactic.target === "none" ? [] : tacticTargets(player, tactic);
        const active = mode === "tactic" && pendingTacticId === tactic.id;
        const blocked = !active && !canUseTactic(player, tactic);
        const disabled = disabledGlobal || blocked;
        const safeId = String(tactic.id || "").replace(/'/g, "\'");
        const reason = mapActionDockTacticReason(player, tactic, targets);
        const title = escapeHtml(`${tactic.name || "Tattica"}
${tactic.description || ""}
${reason}`);
        const stateClass = active ? " active" : (blocked ? " unavailable" : " ready");
        const buttonText = active ? "Annulla" : (tactic.target === "none" ? "Usa" : "Mira");
        return `
          <button class="mapActionDockItem${stateClass}" type="button" title="${title}" onclick="mapActionDockToggleTactic('${safeId}')"${disabled ? " disabled" : ""}>
            <span class="mapActionDockName">${escapeHtml(tactic.name || tactic.id || "Tattica")}</span>
            <span class="mapActionDockMeta"><strong>${tactic.cost} ENE</strong> · CD ${tactic.cooldown} · ${escapeHtml(reason)}</span>
            <span class="mapActionDockCmd">${buttonText}</span>
          </button>`;
      }).join("");
      dock.innerHTML = `
        <div class="mapActionDockInner">
          <div class="mapActionDockHeader">
            <div class="mapActionDockIdentity">
              <strong>Azioni · ${escapeHtml(faction)}</strong>
              <span>G${player}</span>
            </div>
            <div class="mapActionDockEnergy" title="${escapeHtml(`Prossimo income: ${income.total} ENE · ${income.sourceText || "n/d"}`)}">
              <strong>${currentEnergy}<small> ENE</small></strong>
              <span>+${income.total} prossimo turno</span>
            </div>
          </div>
          ${typeof missionUiCompactPanelHtml === "function" ? missionUiCompactPanelHtml(player) : ""}
          <div class="mapActionDockList">
            ${rows}
          </div>
        </div>
        ${mapCollapsedHandControlsHtml(disabledGlobal)}`;
    }




    // =====================================================
    // C1b – Hand/deck debug UI foundation
    // =====================================================

    function cardTypeLabel(card) {
      if (!card) return "Carta";
      const labels = {
        commander: "Comandante",
        pivot: "Pivot",
        unit_structure: "Struttura",
        unit_infantry: "Fanteria",
        unit_vehicle: "Veicolo",
        unit: "Unità",
        tactic: "Tattica",
        mission: "Missione"
      };
      return labels[card.cardType] || card.cardType || card.sourceType || "Carta";
    }

    function cardRoleLabel(card) {
      if (!card) return "—";
      if (card.starterRole) {
        const starterLabels = {
          starter_infantry: "Starter fanteria",
          starter_vehicle: "Starter veicolo",
          starter_structure: "Starter struttura"
        };
        return starterLabels[card.starterRole] || card.starterRole;
      }
      const roleLabels = {
        commander: "Deck · comandante",
        pivot: "Deck · pivot",
        base: "Deck · base",
        heavy: "Deck · pesante",
        elite: "Deck · elite",
        tactic: "Deck · tattica",
        mission: "Deck · Missione"
      };
      return roleLabels[card.deckRole] || card.deckRole || "Debug";
    }

    function cardCostLabel(card) {
      if (!card || !Number.isFinite(card.cost)) return "costo —";
      const side = Number(card.side || (state && state.currentPlayer) || 0);
      const effective = typeof missionEffectiveCardCost === "function" ? missionEffectiveCardCost(side, card, card.cost) : card.cost;
      const base = effective !== card.cost ? ` (base ${card.cost})` : (Number.isFinite(card.basePrintedCost) && card.basePrintedCost !== card.cost ? ` (base ${card.basePrintedCost})` : "");
      return `${effective} ENE${base}`;
    }

    function cardLabel(card) {
      if (!card) return "—";
      const name = escapeHtml(card.name || card.id || "Carta");
      const type = escapeHtml(cardTypeLabel(card));
      const cost = cardCostLabel(card);
      return `${name} · ${type} · ${cost}`;
    }

    function tacticRangeDebugLabel(card) {
      if (!card || card.sourceType !== "tactic") return "—";
      const mode = card.rangeMode || "none";
      const range = Number.isFinite(card.range) ? `R${card.range}` : "";
      if (mode === "none") return "Nessun raggio mappa";
      if (mode === "ally_network") return range ? `Rete alleata ${range}` : "Rete alleata";
      if (mode === "deployment_points") return "Punti di sbarco validi";
      if (mode === "ally_half_edge") return "Bordo metà campo alleata";
      if (mode === "commander_adjacency") return "Adiacenza comandante";
      if (mode === "liberti_unit_range") return range ? `R${card.range} da unità Liberti` : "Da unità Liberti";
      return range ? `${mode} · ${range}` : mode;
    }

    function tacticTargetDebugLabel(card) {
      if (!card || card.sourceType !== "tactic") return "—";
      const target = card.target || card.targetDomain || "Bersaglio non definito";
      const side = card.targetSide ? ` · ${card.targetSide}` : "";
      return `${target}${side}`;
    }

    function renderTacticCardDebugDetails(card) {
      if (!card || card.sourceType !== "tactic") return "";
      const quality = escapeHtml(card.quality || "Tattica");
      const category = escapeHtml(card.category || "Categoria n/d");
      const target = escapeHtml(tacticTargetDebugLabel(card));
      const range = escapeHtml(tacticRangeDebugLabel(card));
      const duration = escapeHtml(card.duration || "Durata n/d");
      const condition = escapeHtml(card.condition || "Nessuna");
      const effect = escapeHtml(card.effectText || "Effetto data-only C2");
      const kind = escapeHtml(card.effectKind || "effectKind n/d");
      const status = escapeHtml(card.implementationStatus || "data_only");
      const full = escapeHtml([
        `Categoria: ${card.category || "n/d"}`,
        `Qualità: ${card.quality || "n/d"}`,
        `Bersaglio: ${tacticTargetDebugLabel(card)}`,
        `Raggio: ${tacticRangeDebugLabel(card)}`,
        `Condizione: ${card.condition || "Nessuna"}`,
        `Durata: ${card.duration || "n/d"}`,
        `Kind: ${card.effectKind || "n/d"}`,
        `Stato: ${card.implementationStatus || "data_only"}`,
        `Effetto: ${card.effectText || ""}`
      ].join("\n"));
      return `
          <div class="tacticDebugDetails tacticCompactDetails" title="${full}">
            <div class="tacticTags">
              <span class="pill tacticPill">${quality}</span>
              <span class="pill">${category}</span>
            </div>
            <div class="tacticEffect"><strong>Effetto:</strong> ${effect}</div>
            <div class="tacticTinyMeta">
              <span>${target}</span>
              <span>${range}</span>
              <span>Condizione: ${condition}</span>
              <span>${duration}</span>
              <span>${kind}</span>
              <span>${status}</span>
            </div>
          </div>`;
    }

    function renderCardInstanceDebug(card) {
      if (!card) return `<div class="debugCard empty">Slot vuoto</div>`;
      const role = escapeHtml(cardRoleLabel(card));
      const name = escapeHtml(card.name || card.id || "Carta");
      const type = escapeHtml(cardTypeLabel(card));
      const cost = cardCostLabel(card);
      const faction = escapeHtml(card.faction || "—");
      const copy = Number.isFinite(card.deckCopyNo) ? `<span class="pill">Copia ${card.deckCopyNo}</span>` : "";
      const overflow = card.debugOverflowCopy ? `<span class="pill bad">Extra debug</span>` : "";
      const isMission = card.sourceType === "mission";
      const sourceClass = card.sourceType === "tactic" || isMission ? " tacticCardDebug" : " unitCardDebug";
      const isPlayableTactic = card.sourceType === "tactic" && typeof isC2c1SingleDamageTacticCard === "function" && isC2c1SingleDamageTacticCard(card);
      const tacticPlayablePill = card.sourceType === "tactic" ? `<span class="pill ${isPlayableTactic ? "good" : "tacticPill"}">${isPlayableTactic ? "Giocabile" : "Data-only"}</span>` : (isMission ? `<span class="pill tacticPill">Missione F9N10</span>` : "");
      const c2c6aCost = card.c2c6aCostAdjusted ? `<span class="pill good">Sconto pesca</span>` : "";
      const c2c6aAtt = card.c2c6aSpawnAttBonus ? `<span class="pill good">+${card.c2c6aSpawnAttBonus} ATT spawn</span>` : "";
      const c2c7aBlocked = (typeof handCardBlocked === "function" && handCardBlocked(card)) ? `<span class="pill bad">Bloccata: ${escapeHtml(card.c2c7aBlockedSource || "Embargo")}</span>` : "";
      const tacticMeta = renderTacticCardDebugDetails(card);
      const missionMeta = isMission ? `<div class="tacticDebugDetails tacticCompactDetails"><div class="tacticEffect"><strong>Regole:</strong> ${escapeHtml(card.effectText || "Missione giocabile F9N10")}</div></div>` : "";
      if (card.sourceType === "tactic" || isMission) {
        const compactCategory = escapeHtml(card.category || card.quality || (isMission ? "Missione" : "Tattica"));
        return `
        <div class="debugCard${sourceClass}${card.debugOverflowCopy ? " overflow" : ""}">
          <strong>${name}</strong>
          <span>${compactCategory}</span>
          <div class="stats compactStats">
            <span class="pill enePill">${cost}</span>
            ${tacticPlayablePill}${copy}${overflow}${c2c6aCost}${c2c6aAtt}${c2c7aBlocked}
          </div>
          ${isMission ? missionMeta : tacticMeta}
        </div>`;
      }
      return `
        <div class="debugCard${sourceClass}${card.debugOverflowCopy ? " overflow" : ""}">
          <strong>${name}</strong>
          <span>${type}</span>
          <div class="stats">
            <span class="pill">${cost}</span>
            <span class="pill">${role}</span>
            <span class="pill">${faction}</span>
            ${copy}${overflow}${tacticPlayablePill}${c2c6aCost}${c2c6aAtt}${c2c7aBlocked}
          </div>
          ${tacticMeta}
        </div>`;
    }

    function renderCardThumbnailShell(card, safeUid, source, label = "") {
      if (!card) return `<div class="handRenderedCard empty"><div class="handThumbEmpty">Slot vuoto</div></div>`;
      const title = escapeHtml(`${card.name || "Carta"} · ${cardTypeLabel(card)} · ${cardCostLabel(card)}`);
      const badge = card.sourceType === "mission" ? "MISSIONE" : (card.sourceType === "tactic" ? "TATTICA" : (card.deckRole === "commander" ? "COM." : "UNITÀ"));
      return `
        <div class="handRenderedCard" title="${title}">
          ${label ? `<div class="miniLabel">${escapeHtml(label)}</div>` : ""}
          <div class="handCardThumbFrame">
            <canvas class="handCardThumbCanvas" width="194" height="292"
              data-hand-thumb-card-uid="${safeUid}"
              data-hand-thumb-source="${escapeHtml(source)}"
              aria-label="Miniatura carta ${title}"></canvas>
            <div class="handCardThumbFallback">
              <strong>${escapeHtml(card.name || "Carta")}</strong>
              <span>${escapeHtml(cardTypeLabel(card))}</span>
            </div>
          </div>
          <div class="handCardThumbMeta">
            <span class="pill enePill">${cardCostLabel(card)}</span>
            <span class="pill">${badge}</span>
            ${card.custom ? `<span class="pill customCardPill">CUSTOM</span>` : ""}
          </div>
        </div>`;
    }

    function renderStarterCardSlotDebug(side, key, label, card) {
      const action = typeof starterCardActionState === "function"
        ? starterCardActionState(side, card)
        : { canUse: false, reason: "Starter controller non disponibile", actionText: "Non disponibile" };
      const disabled = action.canUse ? "" : " disabled";
      const playableClass = action.canUse ? " playable" : "";
      const safeUid = card && card.cardUid ? String(card.cardUid).replace(/'/g, "\\'") : "";
      const selectedClass = card && typeof gameCardPreviewSelectedHandUid === "function" && gameCardPreviewSelectedHandUid() === card.cardUid ? " previewSelected" : "";
      const button = card
        ? `<button type="button"${disabled} onclick="event.stopPropagation(); beginStarterCardPurchase('${safeUid}')">${escapeHtml(action.actionText)}</button>`
        : `<button type="button" disabled>Non disponibile</button>`;
      return `
        <div class="debugStarterSlot renderedStarterSlot${playableClass}${selectedClass}"${card ? ` data-preview-card-uid="${safeUid}" onclick="gameCardPreviewSelectHandCard(${side}, '${safeUid}', 'starter')"` : ""}>
          ${renderCardThumbnailShell(card, safeUid, "starter", label)}
          <div class="starterAction">
            ${button}
            <div class="meta">${escapeHtml(action.reason)}</div>
          </div>
        </div>`;
    }

    function renderStarterCardsDebug(side) {
      const starters = state && state.starterCards ? state.starterCards[side] || {} : {};
      const order = [
        ["starter_infantry", "Fanteria"],
        ["starter_vehicle", "Veicolo"],
        ["starter_structure", "Struttura"]
      ];
      return `
        <div class="debugStarterGrid renderedStarterGrid">
          ${order.map(([key, label]) => renderStarterCardSlotDebug(side, key, label, starters[key])).join("")}
        </div>`;
    }

    function missionCardHiddenFromViewer(side, card) {
      // F9N10: Missioni pubbliche nel digitale, giocabili su cicli multipli.
      return false;
    }

    function renderHiddenMissionHandSlot() {
      return `
        <div class="debugHandSlot renderedHandSlot missionHiddenCard" aria-label="Missione avversaria nascosta">
          <div class="handRenderedCard missionHiddenCardFace">
            <div class="handThumbEmpty"><strong>MISSIONE</strong><span>Nascosta fino alla rivelazione</span></div>
          </div>
          <div class="handAction"><button type="button" disabled>Protetta</button><div class="meta">Informazione privata</div></div>
        </div>`;
    }

    function renderHiddenHandCardSlot(side, card) {
      const faction = state && state.factions ? state.factions[side] : "";
      const blocked = typeof handCardBlocked === "function" && handCardBlocked(card);
      const back = typeof cardBackVisualHtml === "function" ? cardBackVisualHtml(faction, { blocked }) : `<div class="handThumbEmpty"><strong>CARTA</strong><span>Coperta</span></div>`;
      return `
        <div class="debugHandSlot renderedHandSlot hiddenOpponentCard" aria-label="Carta avversaria coperta">
          <div class="handRenderedCard hiddenOpponentCardFace">${back}</div>
          <div class="handAction"><button type="button" disabled>${blocked ? "Bloccata" : "Coperta"}</button><div class="meta">Informazione privata</div></div>
        </div>`;
    }

    function renderHandCardSlotDebug(side, card) {
      if (typeof handCardHiddenFromViewer === "function" && handCardHiddenFromViewer(side, card)) return renderHiddenHandCardSlot(side, card);
      if (missionCardHiddenFromViewer(side, card)) return renderHiddenMissionHandSlot();
      const action = typeof handCardActionState === "function"
        ? handCardActionState(side, card)
        : { canUse: false, reason: "Hand card controller non disponibile", actionText: "Non disponibile" };
      const disabled = action.canUse ? "" : " disabled";
      const playableClass = action.canUse ? " playable" : "";
      const pendingClass = pendingHandCardUid && card && pendingHandCardUid === card.cardUid ? " pending" : "";
      const safeUid = card && card.cardUid ? String(card.cardUid).replace(/'/g, "\\'") : "";
      const selectedClass = card && typeof gameCardPreviewSelectedHandUid === "function" && gameCardPreviewSelectedHandUid() === card.cardUid ? " previewSelected" : "";
      const isMission = card && (card.sourceType === "mission" || card.cardType === "mission" || card.deckRole === "mission");
      const button = card
        ? (isMission
          ? `<button type="button"${disabled} onclick="event.stopPropagation(); missionUiActivateCard(${side}, { source:'hand_panel' })">${escapeHtml(action.actionText)}</button>`
          : `<button type="button"${disabled} onclick="event.stopPropagation(); beginHandCardPlay('${safeUid}')">${escapeHtml(action.actionText)}</button>`)
        : `<button type="button" disabled>Non disponibile</button>`;
      const protectedBadge = card && typeof isProtectedHandCard === "function" && isProtectedHandCard(card) ? `<span class="pill good">PROTETTA</span>` : "";
      const cardClick = !card ? "" : (isMission
        ? ` data-preview-card-uid="${safeUid}" onclick="missionUiActivateCard(${side}, { source:'hand_card_face' })"`
        : ` data-preview-card-uid="${safeUid}" onclick="gameCardPreviewSelectHandCard(${side}, '${safeUid}', 'hand')"`);
      return `
        <div class="debugHandSlot renderedHandSlot${playableClass}${pendingClass}${selectedClass}"${cardClick}>
          ${renderCardThumbnailShell(card, safeUid, "hand")}
          <div class="handAction">
            ${button}${protectedBadge}
            <div class="meta">${escapeHtml(action.reason)}</div>
          </div>
        </div>`;
    }

    function renderPlayerHandDebug(side) {
      const hand = state && state.hand ? state.hand[side] || [] : [];
      if (!hand.length) return `<div class="meta">Mano vuota.</div>`;
      return `<div class="debugHandList renderedHandList">${hand.map(card => renderHandCardSlotDebug(side, card)).join("")}</div>`;
    }

    function handThumbRequestFrame(callback) {
      if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") return window.requestAnimationFrame(callback);
      return setTimeout(callback, 16);
    }

    function handThumbCancelFrame(handle) {
      if (!handle) return;
      if (typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(handle);
      else clearTimeout(handle);
    }

    function handThumbCanvasShouldRender(canvas) {
      if (!canvas || !canvas.isConnected) return false;
      if (typeof document === "undefined" || !document.body || !document.body.classList.contains("mobile-apk-m4")) return true;
      const handDock = typeof canvas.closest === "function" ? canvas.closest(".handPrimaryDock") : null;
      if (handDock && !document.body.classList.contains("mobile-panel-hand")) return false;
      return true;
    }

    function requestInGameHandThumbnailRender() {
      return renderInGameHandThumbnails({ onlyUnrendered:true });
    }

    function handThumbCardForCanvas(canvas) {
      if (!canvas || !state) return null;
      const uid = canvas.getAttribute("data-hand-thumb-card-uid");
      const source = canvas.getAttribute("data-hand-thumb-source") || "hand";
      const sideBox = typeof canvas.closest === "function" ? canvas.closest("[data-hand-zone-side]") : null;
      const side = sideBox ? Number(sideBox.getAttribute("data-hand-zone-side")) : (state.currentPlayer || 1);
      if (source === "starter") {
        const starters = state.starterCards && state.starterCards[side] ? Object.values(state.starterCards[side]).filter(Boolean) : [];
        return starters.find(card => card && card.cardUid === uid) || null;
      }
      const hand = state.hand && state.hand[side] ? state.hand[side] : [];
      return hand.find(card => card && card.cardUid === uid) || null;
    }

    function handThumbPrewarmPublicBotCards() {
      // Frozen F9O4e guard marker: state.modes[1] !== "bot" || state.modes[2] !== "bot"
      if (!state || !state.modes || typeof cardRendererPrewarmHandThumbnail !== "function") return 0;
      const playerIds = typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(state) : [1, 2];
      if (!playerIds.every(side => state.modes[side] === "bot")) return 0;
      let requested = 0;
      for (const side of playerIds) {
        const starters = state.starterCards && state.starterCards[side] ? Object.values(state.starterCards[side]).filter(Boolean) : [];
        const hand = state.hand && state.hand[side] ? state.hand[side].filter(card => {
          if (!card) return false;
          return !(typeof handCardHiddenFromViewer === "function" && handCardHiddenFromViewer(side, card));
        }) : [];
        for (const card of [...starters, ...hand]) {
          if (cardRendererPrewarmHandThumbnail(card)) requested += 1;
        }
      }
      return requested;
    }

    function renderInGameHandThumbnails(options = {}) {
      if (typeof document === "undefined" || typeof renderArenaCardPreviewCanvas !== "function" || !state) return false;

      // F9O4e: prepara in anticipo le sole carte pubbliche dei due bot. Le carte
      // coperte non hanno canvas e non entrano mai nel resolver delle illustrazioni.
      handThumbPrewarmPublicBotCards();

      // F9O4c: la coda non viene più cancellata a ogni renderAll(). Nei turni bot rapidi
      // una nuova mano può sostituire i nodi precedenti, ma i canvas ancora validi restano
      // in coda e quelli nuovi vengono accodati senza affamare le carte successive.
      const canvases = Array.from(document.querySelectorAll("[data-hand-thumb-card-uid]"))
        .filter(canvas => handThumbCanvasShouldRender(canvas))
        .filter(canvas => !options.onlyUnrendered || !canvas.dataset.thumbRendered);
      canvases.sort((a, b) => {
        const aMap = typeof a.closest === "function" && a.closest("#mapHandOverlay") ? 0 : 1;
        const bMap = typeof b.closest === "function" && b.closest("#mapHandOverlay") ? 0 : 1;
        return aMap - bMap;
      });
      for (const canvas of canvases) {
        const card = handThumbCardForCanvas(canvas);
        if (!card) continue;
        const restored = typeof cardRendererRestoreHandThumbnailSnapshot === "function" ? cardRendererRestoreHandThumbnailSnapshot(canvas, card) : false;
        if (restored === "ready") continue;
        if (HAND_THUMB_RENDER_QUEUE.queued.has(canvas)) continue;
        HAND_THUMB_RENDER_QUEUE.queued.add(canvas);
        HAND_THUMB_RENDER_QUEUE.pending.push(canvas);
      }

      const processFrame = () => {
        HAND_THUMB_RENDER_QUEUE.frame = 0;
        const mobile = typeof document !== "undefined" && document.body && document.body.classList.contains("mobile-apk-m4");
        let budget = mobile ? 1 : 3;
        while (budget > 0 && HAND_THUMB_RENDER_QUEUE.pending.length) {
          const canvas = HAND_THUMB_RENDER_QUEUE.pending.shift();
          HAND_THUMB_RENDER_QUEUE.queued.delete(canvas);
          if (!handThumbCanvasShouldRender(canvas)) continue;
          budget -= 1;
          const card = handThumbCardForCanvas(canvas);
          if (!card) continue;
          const restored = typeof cardRendererRestoreHandThumbnailSnapshot === "function" ? cardRendererRestoreHandThumbnailSnapshot(canvas, card) : false;
          if (restored === "ready") continue;
          const thumbScale = Number(canvas.getAttribute("data-hand-thumb-scale") || 0.19);
          const rendered = renderArenaCardPreviewCanvas(canvas, card, { scale: Number.isFinite(thumbScale) && thumbScale > 0 ? thumbScale : 0.19 });
          if (rendered) {
            if (canvas.dataset.cardRenderState === "ready") canvas.dataset.thumbRendered = "1";
            else if (typeof canvas.removeAttribute === "function") canvas.removeAttribute("data-thumb-rendered");
            HAND_THUMB_RENDER_QUEUE.renderedThisRun += 1;
          }
        }
        if (HAND_THUMB_RENDER_QUEUE.pending.length) HAND_THUMB_RENDER_QUEUE.frame = handThumbRequestFrame(processFrame);
      };

      if (!HAND_THUMB_RENDER_QUEUE.frame && HAND_THUMB_RENDER_QUEUE.pending.length) {
        HAND_THUMB_RENDER_QUEUE.frame = handThumbRequestFrame(processFrame);
      }
      return true;
    }

    function mapHandOverlayCardLabel(card) {
      if (!card) return "Carta";
      if (card.cardType === "commander" || card.deckRole === "commander") return "Comandante";
      if (card.sourceType === "mission" || card.cardType === "mission") return "Missione";
      if (card.sourceType === "tactic" || card.cardType === "tactic") return "Tattica";
      return "Unità";
    }

    function mapHandOverlayCardByUid(side, cardUid, source = "hand") {
      if (!state || !side || !cardUid) return null;
      if (source === "starter") {
        const starters = state.starterCards && state.starterCards[side] ? Object.values(state.starterCards[side]).filter(Boolean) : [];
        return starters.find(card => card && card.cardUid === cardUid) || null;
      }
      const hand = state.hand && state.hand[side] ? state.hand[side] : [];
      const card = hand.find(item => item && item.cardUid === cardUid) || null;
      return (typeof handCardHiddenFromViewer === "function" && handCardHiddenFromViewer(side, card)) || missionCardHiddenFromViewer(side, card) ? null : card;
    }

    function mapHandOverlayHoverEnabled() {
      if (typeof document === "undefined" || !document.body) return false;
      if (document.body.classList.contains("mobile-apk-m4")) return false;
      if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
        const fineHover = window.matchMedia("(hover: hover) and (pointer: fine)");
        if (fineHover && fineHover.matches === false) return false;
      }
      return true;
    }

    function mapHandOverlayMoveHoverPreview(event) {
      // F9K5c: l'hover desktop non segue più il puntatore.
      // Usa la preview laterale #mapHandSelectionPreview, quindi il mousemove resta no-op compatibile.
      return Boolean(event || MAP_HAND_OVERLAY_STATE.hoverCardUid);
    }

    function mapHandOverlayClearHoverState() {
      MAP_HAND_OVERLAY_STATE.hoverCardUid = "";
      MAP_HAND_OVERLAY_STATE.hoverSource = "";
      MAP_HAND_OVERLAY_STATE.hoverSide = 0;
    }

    function mapHandOverlayHideHoverPreview() {
      mapHandOverlayClearHoverState();
      if (typeof renderMapHandSelectionPreview === "function") renderMapHandSelectionPreview();
      return true;
    }

    function mapHandOverlayHoverPreview(side, cardUid, source = "hand", event = null) {
      if (!mapHandOverlayHoverEnabled()) return false;
      if (!state || !state.cardDebug || !state.cardDebug.initialized) return false;
      const card = mapHandOverlayCardByUid(side, cardUid, source);
      if (!card) return false;
      MAP_HAND_OVERLAY_STATE.hoverCardUid = String(cardUid || "");
      MAP_HAND_OVERLAY_STATE.hoverSource = String(source || "hand");
      MAP_HAND_OVERLAY_STATE.hoverSide = Number(side || 0) || 0;
      if (typeof renderMapHandSelectionPreview === "function") renderMapHandSelectionPreview();
      return true;
    }

    function mapHandOverlaySelectedCard() {
      const side = MAP_HAND_OVERLAY_STATE.selectedSide || (state ? state.currentPlayer : 1) || 1;
      const source = MAP_HAND_OVERLAY_STATE.selectedSource || "hand";
      const uid = MAP_HAND_OVERLAY_STATE.selectedCardUid || pendingHandCardUid || "";
      return mapHandOverlayCardByUid(side, uid, source);
    }

    function mapHandOverlayHoverCard() {
      if (!mapHandOverlayHoverEnabled()) return null;
      const side = MAP_HAND_OVERLAY_STATE.hoverSide || (state ? state.currentPlayer : 1) || 1;
      const source = MAP_HAND_OVERLAY_STATE.hoverSource || "hand";
      const uid = MAP_HAND_OVERLAY_STATE.hoverCardUid || "";
      return uid ? mapHandOverlayCardByUid(side, uid, source) : null;
    }

    function mapHandOverlayCancelLabel() {
      if (mode === "tactic") return "Annulla tattica";
      if (mode === "build") return "Annulla costruzione";
      if (mode === "spawn") return "Annulla sbarco";
      return "Annulla";
    }

    function mapHandOverlayTargetModeActive() {
      if (!state) return false;
      if (!MAP_HAND_OVERLAY_STATE.hiddenForTarget) return false;
      if (mode === "tactic" && (pendingHandCardUid || MAP_HAND_OVERLAY_STATE.selectedCardUid)) return true;
      if ((mode === "spawn" || mode === "build") && (pendingPurchaseBlueprintId || pendingBuildBlueprintId || MAP_HAND_OVERLAY_STATE.selectedCardUid)) return true;
      return false;
    }

    function mapHandOverlayThumbnailShell(card, safeUid, source) {
      if (!card) return `<div class="mapHandVisualCard empty"><div class="handThumbEmpty">Slot vuoto</div></div>`;
      const label = mapHandOverlayCardLabel(card);
      const title = escapeHtml(`${card.name || "Carta"} · ${label}`);
      return `
        <div class="mapHandVisualCard" title="${title}">
          <div class="mapHandThumbFrame">
            <canvas class="handCardThumbCanvas mapHandThumbCanvas" width="215" height="323"
              data-hand-thumb-card-uid="${safeUid}"
              data-hand-thumb-source="${escapeHtml(source)}"
              data-hand-thumb-scale="0.21"
              aria-label="Miniatura ${title}"></canvas>
            <div class="handCardThumbFallback">
              <strong>${escapeHtml(card.name || "Carta")}</strong>
              <span>${escapeHtml(label)}</span>
            </div>
          </div>
          <span class="mapHandKindPill">${escapeHtml(label)}</span>
          ${typeof isProtectedHandCard === "function" && isProtectedHandCard(card) ? `<span class="mapHandKindPill protected">PROTETTA</span>` : ""}
        </div>`;
    }

    function mapHandOverlayHiddenMissionSlot() {
      return `
        <button class="mapHandCardSlot hand unavailable missionHiddenCard" type="button" title="Missione privata del giocatore" disabled>
          <div class="mapHandVisualCard missionHiddenCardFace"><div class="handThumbEmpty"><strong>MISSIONE</strong><span>Nascosta</span></div></div>
        </button>`;
    }

    function mapHandOverlayHiddenCardSlot(side, card) {
      const faction = state && state.factions ? state.factions[side] : "";
      const blocked = typeof handCardBlocked === "function" && handCardBlocked(card);
      const back = typeof cardBackVisualHtml === "function" ? cardBackVisualHtml(faction, { compact:true, blocked }) : `<div class="handThumbEmpty"><strong>CARTA</strong><span>Coperta</span></div>`;
      return `<button class="mapHandCardSlot hand unavailable hiddenOpponentCard" type="button" title="Carta avversaria coperta" disabled><div class="mapHandVisualCard hiddenOpponentCardFace">${back}</div></button>`;
    }

    function mapHandOverlayStarterCardSlot(side, card) {
      if (!card) return "";
      const action = typeof starterCardActionState === "function"
        ? starterCardActionState(side, card)
        : { canUse: false, reason: "Starter controller non disponibile", actionText: "Sbarca" };
      const playableClass = action.canUse ? " playable" : " unavailable";
      const pendingClass = MAP_HAND_OVERLAY_STATE.selectedSource === "starter" && MAP_HAND_OVERLAY_STATE.selectedCardUid === card.cardUid ? " pending" : "";
      const safeUid = card && card.cardUid ? String(card.cardUid).replace(/'/g, "\\'") : "";
      const selectedClass = card && typeof gameCardPreviewSelectedHandUid === "function" && gameCardPreviewSelectedHandUid() === card.cardUid ? " previewSelected" : "";
      const title = escapeHtml(`${card.name || "Starter"} · ${action.reason || ""}`);
      return `
        <button class="mapHandCardSlot starter${playableClass}${pendingClass}${selectedClass}" type="button" title="${title}" data-preview-card-uid="${safeUid}" onmouseenter="mapHandOverlayHoverPreview(${side}, '${safeUid}', 'starter', event)" onmousemove="mapHandOverlayMoveHoverPreview(event)" onmouseleave="mapHandOverlayHideHoverPreview()" onclick="mapHandOverlaySelectCard(${side}, '${safeUid}', 'starter')">
          ${mapHandOverlayThumbnailShell(card, safeUid, "starter")}
        </button>`;
    }

    function mapHandOverlayCardSlot(side, card) {
      if (!card) return "";
      if (typeof handCardHiddenFromViewer === "function" && handCardHiddenFromViewer(side, card)) return mapHandOverlayHiddenCardSlot(side, card);
      if (missionCardHiddenFromViewer(side, card)) return mapHandOverlayHiddenMissionSlot();
      const action = typeof handCardActionState === "function"
        ? handCardActionState(side, card)
        : { canUse: false, reason: "Hand card controller non disponibile", actionText: "Gioca" };
      const playableClass = action.canUse ? " playable" : " unavailable";
      const pendingClass = pendingHandCardUid && card && pendingHandCardUid === card.cardUid ? " pending" : "";
      const safeUid = card && card.cardUid ? String(card.cardUid).replace(/'/g, "\\'") : "";
      const selectedClass = card && typeof gameCardPreviewSelectedHandUid === "function" && gameCardPreviewSelectedHandUid() === card.cardUid ? " previewSelected" : "";
      const title = escapeHtml(`${card.name || "Carta"} · ${action.reason || ""}`);
      return `
        <button class="mapHandCardSlot hand${playableClass}${pendingClass}${selectedClass}" type="button" title="${title}" data-preview-card-uid="${safeUid}" onmouseenter="mapHandOverlayHoverPreview(${side}, '${safeUid}', 'hand', event)" onmousemove="mapHandOverlayMoveHoverPreview(event)" onmouseleave="mapHandOverlayHideHoverPreview()" onclick="mapHandOverlaySelectCard(${side}, '${safeUid}', 'hand')">
          ${mapHandOverlayThumbnailShell(card, safeUid, "hand")}
        </button>`;
    }

    function mapHandOverlayEndTurn() {
      if (!state || state.winner || botRunning || state.modes[state.currentPlayer] === "bot") return false;
      MAP_HAND_OVERLAY_STATE.hiddenForTarget = false;
      MAP_HAND_OVERLAY_STATE.hiddenForMovement = false;
      MAP_HAND_OVERLAY_STATE.selectedCardUid = "";
      MAP_HAND_OVERLAY_STATE.selectedSource = "";
      if (typeof endTurn === "function") {
        endTurn();
        return true;
      }
      const legacy = $("endTurnBtn");
      if (legacy && !legacy.disabled) legacy.click();
      return true;
    }

    function mapHandOverlayMoveUnits() {
      if (!state || state.winner || botRunning || state.modes[state.currentPlayer] === "bot") return false;
      MAP_HAND_OVERLAY_STATE.hiddenForMovement = true;
      MAP_HAND_OVERLAY_STATE.hiddenForTarget = false;
      MAP_HAND_OVERLAY_STATE.selectedCardUid = "";
      MAP_HAND_OVERLAY_STATE.selectedSource = "";
      MAP_HAND_OVERLAY_STATE.selectedSide = 0;
      mapHandOverlayClearHoverState();
      if (typeof clearSelection === "function") clearSelection();
      if (typeof renderAll === "function") renderAll();
      else renderMapHandOverlay();
      return true;
    }

    function mapHandOverlayCollapse() {
      if (!state || !state.cardDebug || !state.cardDebug.initialized) return false;
      MAP_HAND_OVERLAY_STATE.manuallyCollapsed = true;
      mapHandOverlayClearHoverState();
      if (typeof renderAll === "function") renderAll();
      else renderMapHandOverlay();
      return true;
    }

    function mapHandOverlayShowHand() {
      MAP_HAND_OVERLAY_STATE.hiddenForMovement = false;
      MAP_HAND_OVERLAY_STATE.manuallyCollapsed = false;
      if (typeof renderAll === "function") renderAll();
      else renderMapHandOverlay();
      return true;
    }

    function mapHandOverlaySelectCard(side, cardUid, source = "hand") {
      if (!state || !cardUid) return false;
      const card = mapHandOverlayCardByUid(side, cardUid, source);
      if (!card) return false;
      const tutorialCardAction = { side:Number(side) || 0, cardId:String(card.id || ""), cardUid:String(card.cardUid || cardUid || ""), source:String(source || "hand") };
      if (typeof tutorialRuntimeGateAction === "function") {
        const gate = tutorialRuntimeGateAction("card_selected", tutorialCardAction);
        if (gate && gate.handled && gate.allowed === false) return false;
      }
      if (card.sourceType === "mission" || card.cardType === "mission" || card.deckRole === "mission") {
        MAP_HAND_OVERLAY_STATE.hiddenForMovement = false;
        MAP_HAND_OVERLAY_STATE.hiddenForTarget = false;
        MAP_HAND_OVERLAY_STATE.selectedCardUid = "";
        MAP_HAND_OVERLAY_STATE.selectedSource = "";
        MAP_HAND_OVERLAY_STATE.selectedSide = 0;
        return typeof missionUiActivateCard === "function"
          ? missionUiActivateCard(side, { card, source:"map_hand_card" })
          : (typeof missionUiOpenPanel === "function" ? missionUiOpenPanel(side) : false);
      }
      MAP_HAND_OVERLAY_STATE.hiddenForMovement = false;
      MAP_HAND_OVERLAY_STATE.manuallyCollapsed = false;
      MAP_HAND_OVERLAY_STATE.selectedCardUid = cardUid;
      MAP_HAND_OVERLAY_STATE.selectedSource = source;
      MAP_HAND_OVERLAY_STATE.selectedSide = side;
      mapHandOverlayClearHoverState();
      if (typeof gameCardPreviewSelectHandCard === "function") gameCardPreviewSelectHandCard(side, cardUid, source === "starter" ? "starter" : "mapOverlay");
      let accepted = false;
      if (source === "starter" && typeof beginStarterCardPurchase === "function") accepted = Boolean(beginStarterCardPurchase(cardUid));
      else if (typeof beginHandCardPlay === "function") accepted = Boolean(beginHandCardPlay(cardUid));
      MAP_HAND_OVERLAY_STATE.hiddenForTarget = Boolean(accepted && (mode === "spawn" || mode === "build" || mode === "tactic"));
      renderMapHandOverlay();
      renderMapHandSelectionPreview();
      if (accepted && typeof tutorialRuntimeNotifyAction === "function") tutorialRuntimeNotifyAction("card_selected", tutorialCardAction);
      return accepted;
    }

    function mapHandOverlayCancelSelection() {
      MAP_HAND_OVERLAY_STATE.hiddenForTarget = false;
      MAP_HAND_OVERLAY_STATE.hiddenForMovement = false;
      MAP_HAND_OVERLAY_STATE.selectedCardUid = "";
      MAP_HAND_OVERLAY_STATE.selectedSource = "";
      MAP_HAND_OVERLAY_STATE.selectedSide = 0;
      if (typeof clearSelection === "function") clearSelection();
      if (typeof renderAll === "function") renderAll();
      return true;
    }

    function mapHandOverlayCardStateSignature(card) {
      if (!card) return "";
      const blocked = typeof handCardBlocked === "function" && handCardBlocked(card) ? 1 : 0;
      const protectedCard = typeof isProtectedHandCard === "function" && isProtectedHandCard(card) ? 1 : 0;
      return [card.cardUid || card.id || card.name || "card", card.cost || 0, blocked, protectedCard].join(":");
    }

    function mapHandOverlayBuildSignature(side, hand, starters, targeting, compactHand, disabled, counts) {
      return [
        side,
        state && state.currentPlayer || 0,
        state && state.turn || 0,
        state && state.energy && state.energy[side] || 0,
        mode || "idle",
        botRunning ? 1 : 0,
        targeting ? 1 : 0,
        compactHand ? 1 : 0,
        disabled ? 1 : 0,
        pendingHandCardUid || "",
        pendingPurchaseBlueprintId || "",
        pendingBuildBlueprintId || "",
        counts && counts.deck || 0,
        counts && counts.hand || 0,
        hand.map(mapHandOverlayCardStateSignature).join("|"),
        starters.map(mapHandOverlayCardStateSignature).join("|"),
        typeof missionUiRenderSignature === "function" ? missionUiRenderSignature(side) : "mission-ui-unavailable"
      ].join("¦");
    }

    function renderMapHandOverlay() {
      const overlay = $("mapHandOverlay");
      if (!overlay) return;
      if (!state || !state.cardDebug || !state.cardDebug.initialized) {
        if (typeof mapHandOverlayHideHoverPreview === "function") mapHandOverlayHideHoverPreview();
        const emptySignature = "empty";
        if (overlay.dataset.renderSignature !== emptySignature || !overlay.firstElementChild) {
          overlay.innerHTML = `<div class="mapHandOverlayEmpty">Avvia una partita per vedere la mano sulla mappa.</div>`;
          overlay.dataset.renderSignature = emptySignature;
        }
        overlay.classList.add("isEmpty");
        overlay.classList.remove("isTargeting");
        overlay.classList.remove("isMovementHidden");
        renderMapHandSelectionPreview();
        return;
      }
      const targeting = mapHandOverlayTargetModeActive();
      if (!targeting && (mode === "idle" || !pendingHandCardUid)) MAP_HAND_OVERLAY_STATE.hiddenForTarget = false;
      overlay.classList.toggle("isTargeting", Boolean(targeting));
      overlay.classList.remove("isEmpty");
      const side = typeof cardPresentationDisplaySide === "function" ? cardPresentationDisplaySide() : (state.currentPlayer || 1);
      if (MAP_HAND_OVERLAY_STATE.lastSide !== side) {
        MAP_HAND_OVERLAY_STATE.lastSide = side;
        MAP_HAND_OVERLAY_STATE.hiddenForMovement = false;
        MAP_HAND_OVERLAY_STATE.selectedCardUid = "";
        MAP_HAND_OVERLAY_STATE.selectedSource = "";
        MAP_HAND_OVERLAY_STATE.selectedSide = 0;
        mapHandOverlayClearHoverState();
      }
      const hand = state.hand && state.hand[side] ? state.hand[side] : [];
      const starters = state.starterCards && state.starterCards[side] ? Object.values(state.starterCards[side]).filter(Boolean) : [];
      const isHuman = state.modes && state.modes[side] === "human";
      const disabled = Boolean(state.winner) || !isHuman || botRunning || side !== state.currentPlayer;
      const counts = typeof cardZoneCountsForSide === "function" ? cardZoneCountsForSide(side) : { deck: 0, hand: hand.length, discard: 0 };
      const faction = state.factions ? state.factions[side] : "—";
      if (targeting && typeof mapHandOverlayHideHoverPreview === "function") mapHandOverlayHideHoverPreview();
      const compactHand = Boolean((MAP_HAND_OVERLAY_STATE.hiddenForMovement || MAP_HAND_OVERLAY_STATE.manuallyCollapsed) && !targeting);
      const renderSignature = mapHandOverlayBuildSignature(side, hand, starters, targeting, compactHand, disabled, counts);

      if (compactHand) {
        overlay.classList.add("isMovementHidden");
        overlay.setAttribute("aria-hidden", "true");
        if (overlay.dataset.renderSignature !== renderSignature || overlay.firstElementChild) {
          overlay.replaceChildren();
          overlay.dataset.renderSignature = renderSignature;
        }
        renderMapHandSelectionPreview();
        return;
      }

      overlay.classList.remove("isMovementHidden");
      overlay.removeAttribute("aria-hidden");
      const needsMarkup = overlay.dataset.renderSignature !== renderSignature || !overlay.firstElementChild;
      if (needsMarkup) {
        const startersHtml = starters.length ? starters.map(card => mapHandOverlayStarterCardSlot(side, card)).join("") : "";
        const handHtml = hand.length ? hand.map(card => mapHandOverlayCardSlot(side, card)).join("") : "";
        const cardsHtml = (startersHtml || handHtml)
          ? `${startersHtml}${handHtml}`
          : `<div class="mapHandOverlayEmpty">Mano vuota.</div>`;
        overlay.innerHTML = `
          <div class="mapHandOverlayInner" data-hand-zone-side="${side}">
            <div class="mapHandOverlayHeader">
              <strong>G${side} · ${escapeHtml(faction)}</strong>
              <span>ENE ${state.energy && Number.isFinite(state.energy[side]) ? state.energy[side] : "—"} · Deck ${counts.deck} · Mano ${counts.hand} · Starter ${starters.length}</span>
            </div>
            <div class="mapHandOverlayCards" aria-label="Carte rapide del giocatore corrente">
              ${cardsHtml}
            </div>
            <div class="mapHandOverlayActions">
              <button class="danger mapHandEndTurnBtn" id="mapHandEndTurnBtn" type="button" onclick="mapHandOverlayEndTurn()"${disabled ? " disabled" : ""}>Fine turno</button>
              <button class="ghost mapHandMoveUnitsBtn" type="button" onclick="mapHandOverlayMoveUnits()"${disabled ? " disabled" : ""}>Muovi unità</button>
              <button class="ghost mapHandCollapseBtn" type="button" onclick="mapHandOverlayCollapse()">Riduci mano</button>
              ${typeof missionUiMapBadgeHtml === "function" ? missionUiMapBadgeHtml(side) : ""}
            </div>
          </div>`;
        overlay.dataset.renderSignature = renderSignature;
      }
      if (typeof renderInGameHandThumbnails === "function") renderInGameHandThumbnails({ onlyUnrendered:!needsMarkup });
      if (typeof syncGameHandPreviewSelectionUi === "function") syncGameHandPreviewSelectionUi();
      renderMapHandSelectionPreview();
    }

    function renderMapHandSelectionPreview() {
      const box = $("mapHandSelectionPreview");
      if (!box) return;
      const targeting = Boolean(state && state.cardDebug && state.cardDebug.initialized && mapHandOverlayTargetModeActive());
      const hoverCard = !targeting && state && state.cardDebug && state.cardDebug.initialized ? mapHandOverlayHoverCard() : null;
      const card = targeting ? mapHandOverlaySelectedCard() : hoverCard;
      if (!card) {
        box.hidden = true;
        box.classList.remove("isVisible", "hoverPreview", "targetPreview");
        box.innerHTML = "";
        return;
      }
      const label = mapHandOverlayCardLabel(card);
      const footerHint = targeting ? "Bersaglio richiesto" : "Anteprima hover";
      box.hidden = false;
      box.classList.add("isVisible");
      box.classList.toggle("hoverPreview", !targeting);
      box.classList.toggle("targetPreview", targeting);
      box.innerHTML = `
        <div class="mapHandSelectionPreviewInner">
          <canvas id="mapHandSelectionPreviewCanvas" width="368" height="552" aria-label="Anteprima carta ${targeting ? "selezionata" : "in hover"}"></canvas>
          <div class="mapHandSelectionPreviewFooter">
            <span>${escapeHtml(footerHint)} · ${escapeHtml(label)} · ${escapeHtml(cardCostLabel(card))}</span>
            ${targeting ? `<button class="ghost" type="button" onclick="mapHandOverlayCancelSelection()">${escapeHtml(mapHandOverlayCancelLabel())}</button>` : ""}
          </div>
        </div>`;
      const canvas = $("mapHandSelectionPreviewCanvas");
      if (canvas && typeof renderArenaCardPreviewCanvas === "function") renderArenaCardPreviewCanvas(canvas, card, { scale: 0.36 });
    }

    function cardZoneCountsForSide(side) {
      return {
        deck: state && state.deck && state.deck[side] ? state.deck[side].length : 0,
        hand: state && state.hand && state.hand[side] ? state.hand[side].length : 0,
        discard: state && state.discard && state.discard[side] ? state.discard[side].length : 0
      };
    }

    function incomeSummaryForSide(side) {
      if (typeof effectiveIncomeGain !== "function") {
        const ps = typeof countControlledPS === "function" ? countControlledPS(side) : 0;
        return { total: BASE_INCOME + ps, sourceText: `${ps} PS`, delta: 0, doctrineLabel: "n/d" };
      }
      return effectiveIncomeGain(side);
    }

    function handBannerPlayerSummary(side) {
      const counts = cardZoneCountsForSide(side);
      const income = incomeSummaryForSide(side);
      const current = state && state.currentPlayer === side ? " current" : "";
      const faction = state && state.factions ? state.factions[side] : "—";
      const commander = typeof selectedCommanderCardForSide === "function" ? selectedCommanderCardForSide(side, state && state.cardCatalog ? state.cardCatalog : null) : null;
      const commanderName = commander ? commander.name : "—";
      const depot = state && state.energy ? state.energy[side] : 0;
      const incomeTitle = escapeHtml(`Income ${income.total}: base/territorio ${income.sourceText || "n/d"}; delta ${income.delta || 0}; dottrina ${income.doctrineLabel || "nessuna"}`);
      return `
        <div class="handBannerPlayer${current}">
          <strong>G${side} · ${escapeHtml(faction)}</strong>
          <div class="meta">Comandante: ${escapeHtml(commanderName)}</div>
          <div class="handBannerPills">
            <span class="pill">Deck ${counts.deck}</span>
            <span class="pill">Mano ${counts.hand}</span>
            <span class="pill">Scarti ${counts.discard}</span>
            <span class="pill enePill">Depot ${depot} ENE</span>
            <span class="pill good" title="${incomeTitle}">Income ${income.total}</span>
          </div>
        </div>`;
    }

    function renderDeckRecoveryControl() {
      if (!state || typeof canRecoverDeck !== "function") return "";
      const side = state.currentPlayer || 1;
      const check = canRecoverDeck(side);
      const isHuman = state.modes && state.modes[side] === "human";
      const blockingHand = typeof deckRecoveryBlockingHandCards === "function" ? deckRecoveryBlockingHandCards(side) : (state.hand && state.hand[side] || []);
      const visible = check.ok || ((state.deck && state.deck[side] && state.deck[side].length <= 0) && blockingHand.length <= 0);
      if (!visible) return "";
      const disabled = !check.ok || !isHuman ? " disabled" : "";
      const title = escapeHtml(check.ok ? `Paga ${check.cost} ENE, rimescola gli scarti nel deck e pesca ${check.draw}` : check.reason);
      return `<button class="deckRecoveryBtn" type="button" onclick="recoverCurrentPlayerDeck()"${disabled} title="${title}">Riorganizza deck · ${check.cost} ENE</button>`;
    }

    function renderHandStatusBanner() {
      const current = state ? state.currentPlayer : 1;
      const catalog = state && state.cardDebug ? state.cardDebug.catalogSize : 0;
      const config = typeof CARD_CATALOG_CONFIG !== "undefined" ? CARD_CATALOG_CONFIG : {};
      const draw = Number.isFinite(config.drawPerTurn) ? config.drawPerTurn : 1;
      const cap = Number.isFinite(config.maxHandSize) ? config.maxHandSize : "∞";
      const rec = typeof deckRecoveryConfig === "function" ? deckRecoveryConfig() : { cost:5, draw:3 };
      return `
        <div class="handStatusBanner">
          <div class="handBannerTitle">
            <strong>Mano / deck C2</strong>
            <span>Round ${state.turn} · turno: ${escapeHtml(playerName(current))} · pesca ${draw}/turno · cap mano ${cap} · recupero ${rec.cost} ENE → ${rec.draw} carte · catalogo ${catalog}</span>
          </div>
          ${renderDeckRecoveryControl()}
          <div class="handStatusGrid">
            ${(typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(state) : [1, 2]).map(handBannerPlayerSummary).join("")}
          </div>
        </div>`;
    }

    function cardZoneDebugHtml(side) {
      return `
        <div class="cardZonePlayer" data-hand-zone-side="${side}">
          <h4>${escapeHtml(playerName(side))}<span>${escapeHtml(state.factions[side])}</span></h4>
          <div class="miniSectionTitle">Starter fuori deck</div>
          ${renderStarterCardsDebug(side)}
          <div class="miniSectionTitle">Carte in mano</div>
          ${renderPlayerHandDebug(side)}
        </div>`;
    }

    function cardZonePanelRenderSignature() {
      if (!state || !state.cardDebug || !state.cardDebug.initialized) return "empty";
      const sideSignature = side => {
        const hand = state.hand && state.hand[side] ? state.hand[side] : [];
        const starters = state.starterCards && state.starterCards[side] ? Object.values(state.starterCards[side]).filter(Boolean) : [];
        const deckCount = state.deck && state.deck[side] ? state.deck[side].length : 0;
        const discardCount = state.discard && state.discard[side] ? state.discard[side].length : 0;
        return [
          side,
          state.energy && state.energy[side] || 0,
          deckCount,
          discardCount,
          hand.map(mapHandOverlayCardStateSignature).join("|"),
          starters.map(mapHandOverlayCardStateSignature).join("|"),
          typeof missionUiRenderSignature === "function" ? missionUiRenderSignature(side) : "mission-ui-unavailable"
        ].join(":");
      };
      return [state.currentPlayer || 1, state.turn || 0, sideSignature(1), sideSignature(2)].join("¦");
    }

    function renderCardZonePanel() {
      const panel = $("cardZonePanel");
      if (!panel) return;

      if (!state || !state.cardDebug || !state.cardDebug.initialized) {
        if (panel.dataset.renderSignature !== "empty" || !panel.firstElementChild) {
          panel.innerHTML = `
            <div class="unitCard">
              <h4>Mano / deck C2</h4>
              <div class="meta">Fondazione carte non ancora inizializzata. Avvia una nuova partita.</div>
            </div>`;
          panel.dataset.renderSignature = "empty";
        }
        return;
      }

      const current = state.currentPlayer || 1;
      const orderedPlayers = [current, ...(typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(state) : [1, 2]).filter(side => side !== current)];
      const renderSignature = cardZonePanelRenderSignature();
      const needsMarkup = panel.dataset.renderSignature !== renderSignature || !panel.firstElementChild;
      if (needsMarkup) {
        panel.innerHTML = `
          ${renderHandStatusBanner()}
          ${typeof missionUiDashboardHtml === "function" ? missionUiDashboardHtml(current) : ""}
          ${handPreviewShellHtml()}
          <div class="cardZoneGrid handScrollContent">
            ${orderedPlayers.map(cardZoneDebugHtml).join("")}
          </div>`;
        panel.dataset.renderSignature = renderSignature;
      }
      if (typeof gameCardPreviewEnsureDefaultHandCard === "function") gameCardPreviewEnsureDefaultHandCard(current);
      if (typeof renderInGameHandThumbnails === "function") renderInGameHandThumbnails({ onlyUnrendered:!needsMarkup });
      if (typeof renderInGameHandCardPreview === "function") renderInGameHandCardPreview();
    }


    function selectedUnitPreviewShellHtml() {
      return `
        <div class="inGameCardPreviewBox compactPreviewBox">
          <div class="inGameCardPreviewLayout compactPreviewLayout">
            <div class="inGameCardPreviewCanvasWrap compactPreviewCanvasWrap">
              <canvas id="selectedUnitCardPreviewCanvas" aria-label="Anteprima carta unità selezionata"></canvas>
            </div>
            <div class="inGameCardPreviewInfo compactPreviewInfo">
              <div class="meta" id="selectedUnitCardPreviewMeta">Seleziona una unità sulla mappa per vedere la miniatura renderizzata.</div>
              <div class="deckBuilderPreviewBody compactPreviewBody" id="selectedUnitCardPreviewBody">
                <div class="deckBuilderPreviewHelp">Anteprima carta in-game F9I2.</div>
              </div>
            </div>
          </div>
        </div>`;
    }

    function handPreviewShellHtml() {
      return `
        <div class="inGameCardPreviewBox handPreviewBox">
          <div class="inGameCardPreviewLayout">
            <div class="inGameCardPreviewCanvasWrap">
              <canvas id="gameHandCardPreviewCanvas" aria-label="Anteprima carta dalla mano"></canvas>
            </div>
            <div class="inGameCardPreviewInfo">
              <div class="meta" id="gameHandCardPreviewMeta">Seleziona una carta dalla mano o una starter card per vedere l'anteprima.</div>
              <div class="deckBuilderPreviewBody" id="gameHandCardPreviewBody">
                <div class="deckBuilderPreviewHelp">Anteprima renderer in-game F9I2.</div>
              </div>
            </div>
          </div>
        </div>`;
    }

    function factionRulesPillsHtml(unitOrBlueprint) {
      const rules = Array.isArray(unitOrBlueprint && unitOrBlueprint.factionRules) ? unitOrBlueprint.factionRules : [];
      if (!rules.length) return "";
      return rules.map(rule => {
        const cls = rule === "Sanguinamento" ? "pill bad" : "pill";
        return `<span class="${cls}">${rule}</span>`;
      }).join("");
    }

    function factionRulesText(unitOrBlueprint) {
      const rules = Array.isArray(unitOrBlueprint && unitOrBlueprint.factionRules) ? unitOrBlueprint.factionRules : [];
      return rules.length ? rules.join("; ") : "—";
    }

    function renderMarket() {
      const box = $("marketPanel");
      const player = state.currentPlayer;
      const isHuman = state.modes[player] === "human";
      const faction = state.factions[player];
      const items = BLUEPRINTS.filter(u => u.faction === faction);
      box.innerHTML = "";
      for (const bp of items) {
        const normal = bp.type !== "Struttura";
        const blockedLimit = purchaseLimitReached(player, bp);
        const canBuy = isHuman && !state.winner && canAffordBlueprint(player, bp) && !blockedLimit && (normal ? spawnCellsFor(player, bp).length > 0 : canAnyInfantryBuild(player, bp));
        const card = document.createElement("div");
        card.className = "buyCard" + (canBuy ? "" : " unavailable");
        const actionText = normal ? "Acquista e piazza" : "Costruisci con fanteria";
        let reason = "Pronto";
        if (blockedLimit) reason = limitReason(player, bp);
        else if (!canAffordBlueprint(player, bp)) reason = "ENE insufficiente";
        else if (normal) reason = spawnCellsFor(player, bp).length ? "Pronto" : "Nessuna cella di sbarco";
        else reason = canAnyInfantryBuild(player, bp) ? "Serve costruttore selezionato" : "Serve costruttore attivo e cella libera";
        const psText = bp.psBonus ? `<span class="pill">PS: ${bp.psBonus.description}</span>` : "";
        const libText = factionRulesPillsHtml(bp);
        const specialText = bp.ability && bp.ability.passive ? `<span class="pill">${bp.ability.name}</span>` : "";
        const c1fText = bp.vanguard ? `<span class="pill">Avanguardia</span>` : "";
        const copiesText = limitLabel(player, bp);
        card.innerHTML = `
          <div class="head">
            <div class="iconBadge faction-${factionMeta(bp.faction).key} ${tokenTypeClass(bp)} ${tokenWeightClass(bp)}">${unitIcon(bp)}</div>
            <div class="titleWrap">
              <div class="titleRow"><strong>${bp.name}</strong><span>${effectiveBlueprintCost(player, bp)} ENE · ${copiesText}</span></div>
              <div class="subRow">${bp.type} · ${bp.weight} · HP ${bp.hp} · ATT ${bp.att} · DEF ${bp.def}</div>
            </div>
          </div>
          <div class="stats"><span class="pill">${bp.ability ? bp.ability.name : "Nessuna abilità"}</span><span class="pill">${reason}</span>${specialText}${c1fText}${psText}${libText}</div>`;
        const btn = document.createElement("button");
        btn.textContent = actionText;
        btn.disabled = !canBuy || botRunning;
        btn.addEventListener("click", () => beginPurchase(bp));
        card.appendChild(btn);
        box.appendChild(card);
      }
    }



    function renderRoster() {
      const rows = BLUEPRINTS.map(u => `
        <tr>
          <td>${u.faction}</td><td>${u.name}</td><td>${u.type}</td><td>${u.weight}</td>
          <td>${u.cost}</td><td>${u.hp}</td><td>${u.att}</td><td>${u.def}</td><td>${staticLimitLabel(u)}</td>
          <td>${u.type === "Struttura" ? "Costruibile da fanteria" : "Acquistabile/sbarco QG o edifici"}</td>
          <td>${u.ability ? u.ability.name : "—"}</td>
          <td>${u.psBonus ? u.psBonus.description : "—"}</td>
          <td>${factionRulesText(u)}</td>
        </tr>`).join("");
      $("rosterTable").innerHTML = `
        <table>
          <thead><tr><th>Fazione</th><th>Unità</th><th>Tipo</th><th>Classe</th><th>ENE</th><th>HP</th><th>ATT</th><th>DEF</th><th>Copie</th><th>Regola</th><th>Abilità</th><th>Bonus PS</th><th>Regole fazione</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    }



    function renderMatchupStats() {
      const panel = $("matchupStatsPanel");
      const recent = $("recentStatsPanel");
      if (!panel || !recent) return;
      const items = loadMatchStats();
      if (!items.length) {
        panel.innerHTML = `<div class="help">Nessuna partita registrata. Il registro si aggiorna automaticamente a fine match.</div>`;
        recent.innerHTML = "";
        return;
      }
      const agg = aggregateMatchStats(items);
      const total = items.length;
      const avgRound = (items.reduce((s,r) => s + Number(r.round || 0), 0) / total).toFixed(1);
      const last = items[0];
      panel.innerHTML = `
        <div class="statGrid">
          <div class="statTile"><strong>${total}</strong><span>partite registrate</span></div>
          <div class="statTile"><strong>${avgRound}</strong><span>round medio</span></div>
        </div>
        <div class="miniTable"><table>
          <thead><tr><th>Matchup</th><th>Partite</th><th>Vittorie</th><th>Round medio</th><th>Tipi vittoria</th></tr></thead>
          <tbody>${agg.map(r => `<tr><td>${escapeHtml(r.key)}</td><td>${r.games}</td><td>${formatWins(r.wins)}</td><td>${(r.roundTotal/r.games).toFixed(1)}</td><td>${formatTypes(r.types)}</td></tr>`).join("")}</tbody>
        </table></div>`;
      recent.innerHTML = `<div class="miniTable"><table>
        <thead><tr><th>Ultime partite</th><th>Vincitore</th><th>Tipo</th><th>Round</th><th>Preset</th></tr></thead>
        <tbody>${items.slice(0,8).map(r => `<tr><td>${escapeHtml(r.p1Faction)} vs ${escapeHtml(r.p2Faction)}</td><td class="${factionWinClass(r.winnerFaction)}">${escapeHtml(r.winnerFaction)}</td><td>${escapeHtml(r.winType)}</td><td>${r.round}</td><td>${escapeHtml(r.pacePreset)}</td></tr>`).join("")}</tbody>
      </table></div>`;
    }



    function tokenTypeClass(unit) {
      const type = String(unit.type || "").toLowerCase();
      if (type === "fanteria") return "type-fanteria";
      if (type === "veicolo") return "type-veicolo";
      if (type === "struttura") return "type-struttura";
      if (type === "comandante") return "type-comandante";
      if (type === "qg") return "type-qg";
      return "";
    }



    function tokenTaxonomyClass(unit) {
      const cls = String(unit && (unit.tokenClass || unit.unitClass) || "").toLowerCase();
      return cls ? `token-class-${cls.replace(/[^a-z0-9_-]+/g, "-")}` : "";
    }


    function tokenWeightClass(unit) {
      const w = String(unit.weight || "").toLowerCase();
      if (w.includes("pivot")) return "weight-pivot";
      if (w.includes("elite")) return "weight-elite";
      if (w.includes("pesante")) return "weight-pesante";
      if (w.includes("leggera")) return "weight-leggera";
      return "";
    }



    function svgWrap(inner, vb = "0 0 24 24") {
      return `<svg viewBox="${vb}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor">${inner}</g></svg>`;
    }



    function infantryIconSvg() {
      return svgWrap(`<circle cx="12" cy="5.2" r="2.2"/>
        <path d="M8.3 10.2c.7-1.5 2.2-2.4 3.7-2.4s3 .9 3.7 2.4l.8 1.8c.2.5 0 .9-.5.9H14.6v3.2l2 4.5h-2.6l-1.3-3.2-1.3 3.2H8.8l2-4.5v-3.2H8c-.5 0-.7-.4-.5-.9l.8-1.8Z"/>`);
    }



    function vehicleIconSvg() {
      return svgWrap(`<path d="M6 8h8l2.1 2.2H18c1.1 0 2 .9 2 2v2H4v-2c0-1.1.9-2 2-2h.8L8 8Zm2 7h2.2l-.6 1.7H7.2L8 15Zm5.8 0H16l.8 1.7h-2.4l-.6-1.7ZM6.5 17.2a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8Zm11 0a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8ZM7.5 10.2h6.3l.9 1H6.9l.6-1Z"/>`);
    }



    function structureIconSvg() {
      return svgWrap(`<path d="M5 18V9.6l2-1V6h2v1.4h2V6h2v1.4h2V6h2v2.6l2 1V18h-4v-3h-2v3H9v-3H7v3H5Zm3-5h2v-2H8v2Zm6 0h2v-2h-2v2Z"/>`);
    }



    function commanderIconSvg() {
      return svgWrap(`<path d="m12 2 2.4 4.9 5.4.8-3.9 3.8.9 5.5L12 14.9 7.2 17l.9-5.5L4.2 7.7l5.4-.8L12 2Z"/>`);
    }



    function qgIconSvg() {
      return svgWrap(`<path d="M5 18V9.8L12 4l7 5.8V18h-4v-4h-6v4H5Z"/>`);
    }



    function pivotOverlaySvg() {
      return `<span class="pivotOverlay" aria-hidden="true">✦</span>`;
    }



    function unitIcon(unit) {
      let icon = "";
      if (unit.type === "Fanteria") icon = infantryIconSvg();
      else if (unit.type === "Veicolo") icon = vehicleIconSvg();
      else if (unit.type === "Struttura") icon = structureIconSvg();
      else if (unit.type === "Comandante") icon = commanderIconSvg();
      else if (unit.type === "QG") icon = qgIconSvg();
      else icon = initials(unit.name || "?");
      return icon;
    }



    function unitOverlay(unit) {
      return String(unit.weight || "").toLowerCase().includes("pivot") ? pivotOverlaySvg() : "";
    }



function initials(name) {
      const clean = name.replace(/[^A-Za-zÀ-ÿ0-9 ]/g, "").trim().split(/\s+/);
      if (clean.length === 1) return clean[0].slice(0,3).toUpperCase();
      return (clean[0][0] + clean[clean.length-1][0]).toUpperCase();
    }



    function clearLog() { $("log").innerHTML = ""; }



    function appendLogLine(msg) {
      if (!state) return;
      state.logSeq += 1;
      const item = document.createElement("div");
      item.className = "logItem";
      item.innerHTML = `<small>#${state.logSeq}</small> ${escapeHtml(msg)}`;
      const logBox = $("log");
      logBox.prepend(item);
    }



    function log(msg, type = EventTypes.LOG_MESSAGE, data = {}) {
      if (!state) return;
      if (typeof logGameEvent === "function") {
        return logGameEvent({ type, message: msg, data });
      }
      appendLogLine(msg);
      return null;
    }



    function escapeHtml(str) { return String(str).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c])); }



// =====================================================
// B8-final – UI/card/status helpers moved from main.js
// =====================================================

function staticLimitLabel(bp) {
      if (bp.type === "Struttura") return `max ${structureFieldLimit(state.currentPlayer || 1)} edifici`;
      if (bp.type === "Comandante") return `max ${COMMANDER_FIELD_LIMIT}`;
      if (bp.weight === "Pivot") return `max ${PIVOT_FIELD_LIMIT}`;
      if (bp.weight === "Elite") return `max ${ELITE_FIELD_LIMIT}`;
      if (String(bp.weight || "").toLowerCase().startsWith("pesant")) return `max ${HEAVY_FIELD_LIMIT} per tipo`;
      if (countsAsLightCap(bp)) return `cap ${lightFieldLimit(state.currentPlayer)} leggere campo`;
      return "∞";
    }

function unitCardHtml(u, detailed=false) {
      const hpPct = Math.max(0, Math.round((u.currentHp / u.maxHp) * 100));
      const defDen = Math.max(u.maxDef, u.currentDef, 1);
      const defPct = Math.max(0, Math.round((u.currentDef / defDen) * 100));
      const cd = u.ability ? (u.ability.passive ? "passiva" : (u.cooldownLeft > 0 ? `CD ${u.cooldownLeft}` : "pronta")) : "—";
      const attBonus = psBonusValue(u, "att");
      const auraAtt = attackAuraBonus(u);
      const auraDef = defenseAuraBonus(u);
      const statuses = statusPillsHtml(u);
      const libRules = factionRulesPillsHtml(u);
      const doubleText = u.attacksPerTurn > 1 ? `<span class="pill">Attacchi ${u.attacksMade}/${u.attacksPerTurn}</span>` : "";
      return `
        <h4>${u.name} <span>${u.faction}</span></h4>
        <div class="meta">${u.type} · ${u.weight || "Base"}${u.instanceNo ? ` · #${u.instanceNo}` : ""} · ENE ${u.cost} · ${u.source}</div>
        <div class="bars">
          <div>HP ${u.currentHp}/${u.maxHp}</div><div class="bar"><i style="width:${hpPct}%"></i></div>
          <div>DEF ${u.currentDef}${auraDef ? ` (+${auraDef} aura)` : ""}</div><div class="bar def"><i style="width:${defPct}%"></i></div>
        </div>
        <div class="stats">
          <span class="pill">ATT ${effectiveAtt(u)}${attBonus ? ` (+${attBonus} PS)` : ""}${auraAtt ? ` (+${auraAtt} aura)` : ""}</span>
          <span class="pill">DEF base ${u.maxDef}</span>
          <span class="pill">Abilità: ${cd}</span>
          ${doubleText}
          ${statuses}
          ${u.acted && u.type !== "QG" ? `<span class="pill">Ha agito</span>` : ""}
          ${libRules}
        </div>
        ${detailed && u.ability ? `<p class="help"><strong>${u.ability.name}</strong>: ${u.ability.description}</p>` : ""}`;
    }

function doctrineSummary(player) {
      const info = factionDoctrineIncome(player, countControlledPS(player));
      return info.value ? `attiva: +${info.value} ENE (${info.label})` : `non attiva (${info.label})`;
    }

function unitStatusSummary(unit) {
      const parts = (unit.statuses || []).map(st => `${(STATUS_DEFINITIONS[st.kind] || {}).label || st.kind} (${statusText(st)})`);
      if (unit.passiveThorns) parts.push(`Spine passive (${unit.passiveThorns})`);
      if (unit.bleedImmune) parts.push(`Immune a Sanguinamento`);
      if (unit.guardThornsOnIdle) parts.push(`Guardia Spinosa: Spine 1 se non agisce`);
      if (agathoiStructureAdjacencyDefBonus(unit)) parts.push(`+1 DEF da struttura Agathoi`);
      return parts.join("; ");
    }

function statusPillsHtml(unit) {
      const pills = (unit.statuses || []).map(st => {
        const def = STATUS_DEFINITIONS[st.kind] || { label:st.kind };
        const cls = st.kind === "bleed" ? "bad" : "warn";
        const label = st.kind === "bleed" ? `Sanguina ${st.value}/turno · ${st.turns}` : `${def.label} · ${st.turns || 1}`;
        return `<span class="pill ${cls}">${label}</span>`;
      });
      if (unit.passiveThorns) pills.push(`<span class="pill warn">Spine passive · ${unit.passiveThorns}</span>`);
      if (unit.guardThornsOnIdle && !hasStatus(unit, "thorns")) pills.push(`<span class="pill warn">Guardia Spinosa</span>`);
      return pills.join("");
    }

function hasAnyInhibition(unit) {
      return hasStatus(unit, "inhibit_action") || hasStatus(unit, "inhibit_attack") || hasStatus(unit, "inhibit_move");
    }
