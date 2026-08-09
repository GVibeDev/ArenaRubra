"use strict";

// Arena Rubra – Fase B8a
// Game lifecycle extraction.
// Contiene bootstrap partita, validazione minima data model e scelta iniziativa.
// Non contiene turn flow generale, controller umano o AI.

function normalizeBlueprints() {
      if (typeof applyUnitTaxonomyF9O5 === "function") applyUnitTaxonomyF9O5(BLUEPRINTS);
      for (const bp of BLUEPRINTS) {
        bp.tags = bp.tags || [];
        bp.factionRules = Array.isArray(bp.factionRules) ? [...bp.factionRules] : [];
        bp.capGroup = capGroupForBlueprint(bp);
      }
    }

function capGroupForBlueprint(bp) {
      if (bp.type === "Struttura") return "structure";
      if (bp.type === "Comandante") return "commander";
      if (bp.weight === "Pivot") return "pivot";
      if (bp.weight === "Elite") return "elite";
      if (String(bp.weight || "").toLowerCase().startsWith("pesant")) return "heavy";
      if (String(bp.weight || "").toLowerCase().startsWith("legger")) return "light";
      return "free";
    }

function validateDataModel() {
      const problems = [];
      for (const f of Object.keys(FACTIONS)) {
        const roster = BLUEPRINTS.filter(bp => bp.faction === f);
        if (!roster.length) problems.push(`Fazione senza roster: ${f}`);
        if (!roster.some(bp => bp.type === "Comandante")) problems.push(`Fazione senza comandante: ${f}`);
        if (!roster.some(bp => bp.type === "Struttura")) problems.push(`Fazione senza struttura: ${f}`);
        if (!roster.some(bp => bp.weight === "Pivot")) problems.push(`Fazione senza pivot: ${f}`);
      }
      for (const bp of BLUEPRINTS) {
        if (!FACTIONS[bp.faction]) problems.push(`Blueprint con fazione sconosciuta: ${bp.id}`);
        if (!Number.isFinite(bp.cost) || bp.cost < 0) problems.push(`Costo non valido: ${bp.id}`);
        if (!Number.isFinite(bp.hp) || bp.hp < 0) problems.push(`HP non validi: ${bp.id}`);
      }
      for (const f of Object.keys(FACTIONS)) {
        const tactics = TACTICS.filter(t => t.faction === f);
        if (tactics.length !== 2) problems.push(`Fazione ${f} dovrebbe avere 2 tattiche, trovate ${tactics.length}`);
      }
      if (problems.length) console.warn("Arena Rubra data model warnings", problems);
      return problems;
    }

function newGame(setupOverrides = null) {
      if (typeof invalidateBotRunForNewMatchF9T2c2 === "function") invalidateBotRunForNewMatchF9T2c2("new_game_requested");
      if (typeof normalizeBlueprints === "function") normalizeBlueprints();
      let setup = { ...readGameSetupFromDom(), ...(setupOverrides && typeof setupOverrides === "object" ? setupOverrides : {}) };
      if (setup.tutorialMode === true) {
        setup = {
          ...setup,
          mapId: "map1_starter",
          mapDefinition: getMapDefinitionById("map1_starter"),
          playerCount: 2,
          playerIds: [1, 2],
          factions: { 1: setup.factions[1], 2: setup.factions[2] },
          selectedCommanders: { 1: setup.selectedCommanders[1], 2: setup.selectedCommanders[2] },
          selectedDecks: { 1: setup.selectedDecks[1], 2: setup.selectedDecks[2] },
          modes: { 1: setup.modes[1], 2: setup.modes[2] }
        };
      } else {
        const definition = getMapDefinitionById(setup.mapId || "map1_starter");
        setup.mapDefinition = definition;
        setup.playerCount = definition ? definition.playerCount : 2;
        setup.playerIds = Array.from({ length: setup.playerCount }, (_, index) => index + 1);
      }
      const factions = setup.factions;
      const matchSeed = String(setup.matchSeed || (typeof createMatchSeed === "function" ? createMatchSeed() : Date.now()));
      const matchRng = typeof createMatchRngController === "function" ? createMatchRngController(matchSeed) : null;
      const firstPlayer = chooseFirstPlayer(setup.playerIds, matchRng);
      state = createInitialGameState({
        ...setup,
        firstPlayer,
        matchSeed,
        matchRngState: matchRng ? matchRng.state : 0,
        matchRngCalls: matchRng ? matchRng.calls : 0
      });
      if (typeof arenaPresentationApplyForGame === "function") arenaPresentationApplyForGame({ music: true, fade: true, resetSessionOverride: true });
      state.units.push(...state.playerIds.map(createHq));
      if (typeof initializeCardZonesForGame === "function") initializeCardZonesForGame();
      resetInteractionContext();
      if (typeof cameraResetForNewGame === "function") cameraResetForNewGame();
      clearLog();
      updateControlFromOccupants();
      if (typeof initializeMatchStats === "function") initializeMatchStats();
      if (typeof initializeMatchTelemetry === "function") initializeMatchTelemetry();
      if (typeof expertPrepareMatchF9T2c2 === "function") expertPrepareMatchF9T2c2(state.matchId, { reason:"new_game_initialized" });
      validateDataModel();
      if (typeof runPrecheck === "function") runPrecheck({ quiet: true, source: "newGame" });
      const buildLabel = typeof buildInfoLabel === "function" ? buildInfoLabel() : (CONFIG && CONFIG.version ? CONFIG.version : "unknown");
      const buildName = typeof BUILD_INFO !== "undefined" && BUILD_INFO && BUILD_INFO.buildName ? BUILD_INFO.buildName : "Starter Logic Freeze Candidate";
      const tutorialLaunch = setup.tutorialMode === true;
      const startMessage = tutorialLaunch
        ? `${setup.tutorialTitle || "Lezione guidata"}. ${playerName(1)} contro ${playerName(2)}. Ritmo Rapida, scala Tattica. Iniziativa: ${playerName(firstPlayer)}.`
        : `Arena Rubra – ${buildName} ${buildLabel} avviata. ${playerName(1)} contro ${playerName(2)}. QG occupabili: per vincere serve almeno 1 PS e occupare il QG nemico. Deck/Roster Sanity Pass: deck da 30; comandanti/pivot/elite max 1 copia; altre carte, incluse tattiche, max 2 copie; starter loadout escluso dal deck; mano/deck C2 attivi; cap mano 10; recupero deck a 5 ENE; Missile Jam audit + blocco centrale azioni veicoli; Nexus + Exordium + Liberti + Agathoi + Fabeot numerical/faction-rules balance pass attivi; Bot Strategic Layer C2e-4g Integration/Regression attivo; Superior Doctrine Calibration C2e-4h attiva per Exordium/Fabeot/Agathoi; Fine Balance C2e-5a: Protocollo di Blocco Nexus 1 danno / 1 ENE; MAP1 C2e-6a validata; Starter Logic Freeze C2-STABLE-1: mappa radius 6, QG sui nuovi bordi, PS invariati con margine esterno; F9K6 Ability Runtime Binding attiva: F9K5c validata, Custom Match Test Lab operativo, unità custom con abilità attive runtime semplici collegate a danno/cura/ripristino DEF/shred/buff/pesca/ENE; effetti ambigui e tattiche custom restano data-only; BUILD_INFO centralizzato, Main Menu, SetupScreen con deck custom runtime esplicito, HUD contestuale, PanelManager, Fit ritorna alla mappa, Mano/Azioni si chiudono sui flussi di targeting, matchStats/export strutturati, camera UI separata con Fit/Focus, Deck Builder con salvataggio locale/export-import dei deck validi, Card Editor con import immagini custom e allineamento permanente artwork, storico partite persistente, preview renderer nel Deck Builder e nel GameScreen con box unità selezionata più alto su desktop e mobile; Tactical UX D1 attivo: ATT visibile in mappa e movimento evidenziato alla selezione unità; APK-M1/M2b/M3b ereditati; APK-M4 Fixed Mobile Game Layout attivo: pagina bloccata, mappa centrata, preset camera, dock sinistro F9U1b e pannelli Debug Log/Statistiche; ogni fazione sceglie 1 comandante tra 2 opzioni prima della partita; overlay mano rapido con starter giocabili, preview laterale e pulsante Muovi unità; dock F9U1b fissato a sinistra con Missione, abilità di fazione, Mano e Fine turno; Missioni F9N10 giocabili su cicli multipli con recupero Missione + 4 carte, 50 deck ufficiali integrati e IA orientata agli obiettivi; mercato unità in pannello debug a scomparsa. Iniziativa: ${playerName(firstPlayer)}.`;
      log(startMessage, EventTypes.GAME_STARTED, {
        player1: 1,
        player2: 2,
        faction1: state.factions[1],
        faction2: state.factions[2],
        firstPlayer,
        matchSeed: state.matchSeed || matchSeed,
        rngAlgorithm: typeof MATCH_TELEMETRY_RNG_ALGORITHM !== "undefined" ? MATCH_TELEMETRY_RNG_ALGORITHM : "unknown",
        telemetrySchemaVersion: typeof MATCH_TELEMETRY_SCHEMA_VERSION !== "undefined" ? MATCH_TELEMETRY_SCHEMA_VERSION : null,
        pacePreset: state.pacePreset,
        aiMode: state.aiMode,
        gameScaleMode: state.gameScaleMode,
        mapId: state.mapId,
        mapName: state.mapDefinition.name,
        mapSchemaVersion: state.mapDefinition.schemaVersion,
        mapRevision: state.mapDefinition.metadata.revision,
        mapCellCount: state.cells.length,
        terrainUsage: { ...state.mapRuntime.terrainUsage },
        playerIds: [...state.playerIds],
        tutorialMode:tutorialLaunch,
        tutorialScenarioId:setup.tutorialScenarioId || null,
        buildLabel,
        buildInfo: typeof buildInfoExportMeta === "function" ? buildInfoExportMeta() : {},
        selectedCommanders: state.selectedCommanders ? { ...state.selectedCommanders } : {},
        cardFoundation: state.cardDebug ? state.cardDebug.mode : "unknown",
        drawPerTurn: typeof CARD_CATALOG_CONFIG !== "undefined" ? CARD_CATALOG_CONFIG.drawPerTurn : null,
        drawOnFirstTurn: typeof CARD_CATALOG_CONFIG !== "undefined" ? CARD_CATALOG_CONFIG.drawOnFirstTurn : null,
        handUnitCardsPlayable: typeof CARD_CATALOG_CONFIG !== "undefined" ? CARD_CATALOG_CONFIG.handUnitCardsPlayable : null,
        handTacticCardsPlayable: typeof CARD_CATALOG_CONFIG !== "undefined" ? CARD_CATALOG_CONFIG.handTacticCardsPlayable : null,
        botRosterAdoption: true,
        presentationTheme: state.presentationTheme ? { ...state.presentationTheme } : null
      });
      if (state.mapLabMode) {
        log(`MATCH LAB · ${state.mapDefinition.name} · ${state.playerIds.length} giocatori. La sessione non entra nelle statistiche competitive.`, EventTypes.LOG_MESSAGE, {
          mapId: state.mapId,
          playerIds: [...state.playerIds],
          source: "F9Q3-map-lab-start"
        });
      }
      if (!tutorialLaunch && state.playerIds.length > 2) {
        log(`${state.mapDefinition.name}: ${state.playerIds.map(playerName).join(" · ")} in modalità tutti contro tutti. Movimento mappa ×${state.mapDefinition.movementMultiplier}; i giocatori eliminati vengono saltati.`, EventTypes.LOG_MESSAGE, {
          mapId: state.mapId,
          players: [...state.playerIds],
          movementMultiplier: state.mapDefinition.movementMultiplier,
          terrainUsage: { ...state.mapRuntime.terrainUsage },
          source: "F9Q-multiplayer-start"
        });
      }
      if (!tutorialLaunch && typeof pressureRequirementSummary === "function") {
        log(`Regola F9R3: ${pressureRequirementSummary()}.`, EventTypes.LOG_MESSAGE, {
          mapId: state.mapId,
          pacePreset: state.pacePreset,
          pressureProfile: typeof pressureRuleProfile === "function" ? pressureRuleProfile() : null,
          source: "F9R3-pressure-profile"
        });
      }
      if (typeof initializeMissionTrackerForGame === "function") initializeMissionTrackerForGame();
      startTurn(firstPlayer, true);
      renderAll();
      maybeRunBot();
    }

function chooseFirstPlayer(playerIds = null, rngController = null) {
      const modeValue = $("initiativeMode").value;
      const ids = Array.isArray(playerIds) && playerIds.length ? playerIds.map(Number) : [1, 2];
      if (ids.includes(Number(modeValue))) return Number(modeValue);
      const randomValue = rngController && typeof rngController.next === "function" ? rngController.next() : Math.random();
      return ids[Math.floor(randomValue * ids.length)];
    }
