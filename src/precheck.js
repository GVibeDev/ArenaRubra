"use strict";

// Arena Rubra – Fase B3c-precheck
// Controlli diagnostici su dati, handler e riferimenti.
// Non introduce gameplay. Non modifica state, unità, economia o AI.
// Espone funzioni console: runPrecheck(), copyPrecheckJson(), precheckSummary().

function collectDuplicateValues(items, selector) {
  const seen = new Map();
  const duplicates = [];
  for (const item of items || []) {
    const key = selector(item);
    if (key == null) continue;
    if (seen.has(key)) duplicates.push({ key, first: seen.get(key), duplicate: item });
    else seen.set(key, item);
  }
  return duplicates;
}

function precheckAbility(ab, owner, problems, warnings) {
  if (!ab) return;
  const label = owner && owner.id ? owner.id : (owner && owner.name ? owner.name : "unknown-owner");

  if (ab.passive) return;

  if (!ab.kind) {
    problems.push(`Ability senza kind su ${label}: ${ab.name || "(senza nome)"}`);
    return;
  }

  if (typeof ABILITY_HANDLERS !== "undefined" && !ABILITY_HANDLERS[ab.kind]) {
    problems.push(`Ability kind senza handler: ${ab.kind} su ${label} (${ab.name || "senza nome"})`);
  }

  if (!ab.name) warnings.push(`Ability senza nome su ${label}`);
  if (ab.cost != null && (!Number.isFinite(ab.cost) || ab.cost < 0)) {
    problems.push(`Costo ability non valido su ${label}: ${ab.name || ab.kind}`);
  }
  if (ab.cooldown != null && (!Number.isFinite(ab.cooldown) || ab.cooldown < 0)) {
    problems.push(`Cooldown ability non valido su ${label}: ${ab.name || ab.kind}`);
  }
  if (ab.range != null && (!Number.isFinite(ab.range) || ab.range < 0)) {
    problems.push(`Range ability non valido su ${label}: ${ab.name || ab.kind}`);
  }

  if (ab.statusKind && typeof STATUS_DEFINITIONS !== "undefined" && !STATUS_DEFINITIONS[ab.statusKind]) {
    warnings.push(`Ability applica status non presente in STATUS_DEFINITIONS: ${ab.statusKind} su ${label}`);
  }

  // Alcune abilità sono volutamente tecniche/economiche: qui segnaliamo solo casi sospetti, non errori.
  if (ab.affects === "enemy" && !["economicEffect", "incomeDelta", "status", "damage", "directDamage", "psLock"].includes(ab.kind)) {
    warnings.push(`Ability con affects=enemy e kind insolito (${ab.kind}) su ${label}: ${ab.name || "senza nome"}`);
  }
}

function runPrecheck(options = {}) {
  const quiet = Boolean(options.quiet);
  const source = options.source || "manual";
  const problems = [];
  const warnings = [];
  const info = [];

  try {
    if (typeof FACTIONS === "undefined") problems.push("FACTIONS non definito.");
    if (typeof BLUEPRINTS === "undefined") problems.push("BLUEPRINTS non definito.");
    if (typeof TACTICS === "undefined") problems.push("TACTICS non definito.");
    if (typeof STATUS_DEFINITIONS === "undefined") problems.push("STATUS_DEFINITIONS non definito.");
    if (typeof ABILITY_HANDLERS === "undefined") problems.push("ABILITY_HANDLERS non definito.");
    if (typeof TACTIC_HANDLERS === "undefined") problems.push("TACTIC_HANDLERS non definito.");

    const factions = typeof FACTIONS !== "undefined" ? FACTIONS : {};
    const blueprints = typeof BLUEPRINTS !== "undefined" ? BLUEPRINTS : [];
    const tactics = typeof TACTICS !== "undefined" ? TACTICS : [];
    const deckTactics = typeof DECK_TACTICS !== "undefined" ? DECK_TACTICS : [];
    const missions = typeof MISSION_DEFINITIONS !== "undefined" ? MISSION_DEFINITIONS : [];

    const factionNames = Object.keys(factions);
    info.push(`Fazioni: ${factionNames.length}`);
    info.push(`Blueprint unità: ${blueprints.length}`);
    info.push(`Tattiche starter/base: ${tactics.length}`);
    info.push(`Tattiche deck C2-FINAL-C2: ${deckTactics.length}`);
    info.push(`Missioni F9N6: ${missions.length}`);
    if (typeof missionUiDashboardHtml !== "function") warnings.push("F9N7: missionUiDashboardHtml non disponibile.");
    else info.push("F9N10 Mission UI visibile; Missioni su cicli multipli disponibili.");
    if (typeof missionUiRevealOnPlay !== "function") warnings.push("F9N7: hook missionUiRevealOnPlay non disponibile.");
    if (typeof handCardHiddenFromViewer !== "function" || typeof cardPresentationViewerSide !== "function") problems.push("F9O4: privacy mano bot non disponibile.");
    else info.push("F9O4: privacy mano avversaria attiva; Missione e Comandante pubblici.");
    if (typeof cardAssetBackCandidatePathsFor !== "function" || typeof cardBackVisualHtml !== "function") problems.push("F9O4: resolver dorsi fazione non disponibile.");
    else for (const factionName of ["Nexus","Exordium","Liberti","Agathoi","Fabeot"]) info.push(`F9O4 dorso ${factionName}: ${cardAssetBackCandidatePathsFor(factionName)[0]}.`);
    if (typeof cardMotionEnqueueGameEvent !== "function") problems.push("F9O4: coda animazioni carte non disponibile.");
    else info.push("F9O4: coda animazioni carta non bloccante disponibile.");

    if (missions.length !== 15) problems.push(`Missioni F9N6: ${missions.length}/15.`);
    for (const dup of collectDuplicateValues(missions, mission => mission && mission.id)) {
      problems.push(`Mission ID duplicato: ${dup.key}`);
    }
    for (const mission of missions) {
      if (!mission || !mission.id || !mission.name || !mission.faction) {
        problems.push("Missione F9N6 senza id, nome o fazione.");
        continue;
      }
      if (!factionNames.includes(mission.faction)) problems.push(`Missione ${mission.id}: fazione non valida ${mission.faction}.`);
      if (!["ordinary", "desperate"].includes(mission.missionClass)) problems.push(`Missione ${mission.id}: classe non valida ${mission.missionClass}.`);
      const clauses = mission.missionClass === "desperate" ? mission.conditions : mission.objectives;
      if (!Array.isArray(clauses) || clauses.length !== 3) problems.push(`Missione ${mission.id}: obiettivi/condizioni ${Array.isArray(clauses) ? clauses.length : 0}/3.`);
      if (!mission.reward || !mission.reward.kind || !mission.reward.text) problems.push(`Missione ${mission.id}: ricompensa incompleta.`);
      for (const clause of clauses || []) {
        if (!clause.id || !clause.metric || !clause.operator || !clause.text) problems.push(`Missione ${mission.id}: clausola incompleta.`);
        if (clause.consecutive && !clause.durationMode) problems.push(`Missione ${mission.id}/${clause.id}: durata consecutiva senza durationMode.`);
      }
    }
    for (const factionName of factionNames) {
      const factionMissions = missions.filter(mission => mission && mission.faction === factionName);
      const ordinary = factionMissions.filter(mission => mission.missionClass === "ordinary").length;
      const desperate = factionMissions.filter(mission => mission.missionClass === "desperate").length;
      if (factionMissions.length !== 3 || ordinary !== 2 || desperate !== 1) {
        problems.push(`Missioni ${factionName}: totale ${factionMissions.length}/3, ordinarie ${ordinary}/2, disperate ${desperate}/1.`);
      }
    }

    // C1a – controlli passivi card/deck/hand foundation.
    if (typeof CARD_CATALOG_CONFIG === "undefined") {
      warnings.push("CARD_CATALOG_CONFIG non definito: fondazione carte C1a non caricata.");
    } else {
      if (CARD_CATALOG_CONFIG.initialHandIncludesMissionWhenPresent !== true) problems.push("F9N5: Missione non garantita nella mano iniziale.");
      const protectedRoles = Array.isArray(CARD_CATALOG_CONFIG.protectedHandCardRoles) ? CARD_CATALOG_CONFIG.protectedHandCardRoles : [];
      if (!protectedRoles.includes("mission") || !protectedRoles.includes("commander")) problems.push("F9N5: ruoli protetti Missione/Comandante incompleti.");
      if (CARD_CATALOG_CONFIG.protectedHandCardsCanBeBlocked !== true) problems.push("F9N5: le carte protette devono poter essere bloccate temporaneamente.");
    }
    if (typeof buildCardCatalog !== "function") {
      warnings.push("buildCardCatalog non definita: catalogo carte C1a non disponibile.");
    } else {
      const cardCatalog = buildCardCatalog();
      info.push(`Catalogo carte C2a: ${cardCatalog.length}`);

      // F9N1 – le tattiche custom restano fuori dal catalogo ufficiale, ma il precheck
      // verifica la libreria locale e distingue runtime whitelistato da fallback data-only.
      if (typeof cardEditorCustomCards === "function" && typeof validateCustomTacticCard === "function") {
        const customTactics = cardEditorCustomCards().filter(card => card && card.custom === true && card.sourceType === "tactic");
        let customPlayable = 0;
        let customDataOnly = 0;
        for (const card of customTactics) {
          const check = validateCustomTacticCard(card);
          if (check && check.playable) customPlayable += 1;
          else {
            customDataOnly += 1;
            warnings.push(`Tattica custom data-only ${card.name || card.id}: ${check && check.errors && check.errors.length ? check.errors.join("; ") : "schema runtime non supportato"}`);
          }
          for (const warning of check && check.warnings || []) warnings.push(`Tattica custom ${card.name || card.id}: ${warning}`);
        }
        info.push(`Tattiche custom F9N1: ${customTactics.length} · runtime ${customPlayable} · data-only ${customDataOnly}.`);
      }

      for (const dup of collectDuplicateValues(cardCatalog, card => card && card.id)) {
        problems.push(`Card ID duplicato: ${dup.key}`);
      }

      const deckTacticCards = cardCatalog.filter(card => card.sourceType === "tactic");
      const missionCards = cardCatalog.filter(card => card.sourceType === "mission");
      if (missionCards.length !== 15) problems.push(`Carte Missione F9N4 nel catalogo: ${missionCards.length}/15.`);
      for (const card of missionCards) {
        if (card.cardType !== "mission" || card.deckRole !== "mission" || card.implementationStatus !== "data_only") {
          problems.push(`Carta Missione ${card.id}: contratto catalogo non valido.`);
        }
      }
      if (deckTacticCards.length !== 59) problems.push(`Tattiche deck C2-FINAL-C2 nel catalogo: ${deckTacticCards.length}/59.`);
      const expectedTacticCounts = { Nexus:12, Exordium:12, Liberti:14, Agathoi:9, Fabeot:12 };
      for (const [factionName, expected] of Object.entries(expectedTacticCounts)) {
        const count = deckTacticCards.filter(card => card.faction === factionName).length;
        if (count !== expected) problems.push(`Tattiche deck C2-FINAL-C2 ${factionName}: ${count}/${expected}.`);
      }

      const playableC2c1 = deckTacticCards.filter(card => typeof isC2c1SingleDamageTacticCard === "function" && isC2c1SingleDamageTacticCard(card));
      info.push(`Tattiche giocabili C2-FINAL-C2: ${playableC2c1.length}/59.`);
      

      for (const factionName of factionNames) {
        const factionCards = cardCatalog.filter(card => card.faction === factionName);
        const deckPool = typeof deckPoolCardsForFaction === "function" ? deckPoolCardsForFaction(factionName, cardCatalog) : [];
        const starters = typeof starterCardsForFaction === "function" ? starterCardsForFaction(factionName, cardCatalog) : [];
        const commanders = typeof commanderCardsForFaction === "function" ? commanderCardsForFaction(factionName, cardCatalog) : [];
        if (!factionCards.length) warnings.push(`Nessuna carta generata per fazione: ${factionName}`);
        if (!deckPool.length) warnings.push(`Deck pool C2a vuoto per fazione: ${factionName}`);
        if (!starters.length) warnings.push(`Starter cards C2a assenti per fazione: ${factionName}`);
        if (commanders.length !== 2) problems.push(`Commander Choice ${factionName}: comandanti disponibili ${commanders.length}/2.`);

        if (typeof deckSanityForFaction === "function") {
          const sanity = deckSanityForFaction(factionName, cardCatalog);
          info.push(`Deck C2-FINAL-C2 ${factionName}: ${sanity.deckSize}/${sanity.targetSize}, pool ${sanity.poolSize}, capacità legale ${sanity.legalCapacity}, overflow debug ${sanity.debugOverflowCopies}.`);
          if (sanity.deckSize !== sanity.targetSize) problems.push(`Deck C2-FINAL-C2 ${factionName}: deck ${sanity.deckSize}/${sanity.targetSize}.`);
          if (sanity.legalCapacity < sanity.targetSize) problems.push(`Deck C2-FINAL-C2 ${factionName}: capacità legale insufficiente ${sanity.legalCapacity}/${sanity.targetSize}.`);
          if (sanity.debugOverflowCopies > 0) problems.push(`Deck C2-FINAL-C2 ${factionName}: overflow debug presente (${sanity.debugOverflowCopies}).`);
          if (sanity.commanderCopies !== 1) problems.push(`Deck C2-FINAL-C2 ${factionName}: copie comandante ${sanity.commanderCopies}, atteso 1.`);
          if (sanity.pivotCopies > 1) problems.push(`Deck C2-FINAL-C2 ${factionName}: copie pivot ${sanity.pivotCopies}, massimo 1.`);
          if (sanity.copyViolations && sanity.copyViolations.length) {
            problems.push(`Deck C2-FINAL-C2 ${factionName}: violazioni copie ${sanity.copyViolations.map(v => `${v.name || v.id} ${v.count}/${v.limit}`).join(", ")}.`);
          }
        }
      }

      if (typeof state !== "undefined" && state && state.cardDebug && state.cardDebug.initialized) {
        info.push(`Deck C2-FINAL-C2 G1: ${state.deck && state.deck[1] ? state.deck[1].length : 0}`);
        info.push(`Deck C2-FINAL-C2 G2: ${state.deck && state.deck[2] ? state.deck[2].length : 0}`);
        info.push(`Mano C2-FINAL-C2 G1: ${state.hand && state.hand[1] ? state.hand[1].length : 0}`);
        info.push(`Mano C2-FINAL-C2 G2: ${state.hand && state.hand[2] ? state.hand[2].length : 0}`);
        if (state.cardDebug.openingHand) {
          for (const side of (typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(state) : [1, 2])) {
            const opening = state.cardDebug.openingHand[side];
            if (!opening || opening.ok !== true) problems.push(`F9N5 mano iniziale G${side}: contratto non valido.`);
            else info.push(`F9N5 mano iniziale G${side}: ${opening.missionCopies ? "Missione + " : ""}Comandante + ${opening.ordinaryCopies} ordinarie.`);
          }
        } else {
          warnings.push("F9N5: diagnostica mano iniziale non disponibile nello stato runtime.");
        }
        if (state.cardDebug && Object.prototype.hasOwnProperty.call(state.cardDebug, "runtimeDeckShuffled")) {
          info.push(`Runtime deck shuffle C2c-6a-fix2: ${state.cardDebug.runtimeDeckShuffleMode || (state.cardDebug.runtimeDeckShuffled ? "after_initial_hand" : "off")}.`);
        }
        if (state.tutorialMode === true) {
          info.push(`F9O6 scenario tutorial ${state.tutorialScenarioId || "custom"}: validazione deck competitivo esclusa per setup deterministico.`);
        } else if (typeof deckRuntimeValidationSummary === "function") {
          const runtime = deckRuntimeValidationSummary();
          for (const side of (typeof mapRuntimePlayerIds === "function" ? mapRuntimePlayerIds(state) : [1, 2])) {
            const r = runtime.sides && runtime.sides[side];
            if (!r) continue;
            info.push(`Runtime deck C2-FINAL-C2 G${side}: totale ${r.totalCards}/${r.targetSize}, deck ${r.zoneCounts.deck}, mano ${r.zoneCounts.hand}, scarti ${r.zoneCounts.discard}, overflow ${r.debugOverflowCopies}, ok ${r.ok}.`);
            if (!r.ok) problems.push(`Runtime deck C2-FINAL-C2 G${side}: ${r.issues.join("; ")}.`);
          }
        }
      }
    }


    // Fazioni minime.
    for (const factionName of factionNames) {
      const roster = blueprints.filter(bp => bp.faction === factionName);
      if (!roster.length) problems.push(`Fazione senza roster: ${factionName}`);
      const commanderCount = roster.filter(bp => bp.type === "Comandante").length;
      if (!commanderCount) problems.push(`Fazione senza comandante: ${factionName}`);
      if (commanderCount !== 2) problems.push(`Commander Choice ${factionName}: blueprint comandanti ${commanderCount}/2.`);
      if (!roster.some(bp => bp.type === "Struttura")) warnings.push(`Fazione senza struttura: ${factionName}`);
      if (!roster.some(bp => bp.weight === "Pivot")) warnings.push(`Fazione senza pivot: ${factionName}`);
    }

    // Duplicati ID.
    for (const dup of collectDuplicateValues(blueprints, bp => bp && bp.id)) {
      problems.push(`Blueprint ID duplicato: ${dup.key}`);
    }
    for (const dup of collectDuplicateValues(tactics, t => t && t.id)) {
      problems.push(`Tactic ID duplicato: ${dup.key}`);
    }

    for (const dup of collectDuplicateValues(deckTactics, t => t && t.id)) {
      problems.push(`Deck tactic C2-FINAL-C2 ID duplicato: ${dup.key}`);
    }

    // Blueprint checks.
    const knownUnitTypes = typeof UnitTypes !== "undefined" ? new Set(Object.values(UnitTypes)) : null;
    const knownWeights = typeof UnitWeights !== "undefined" ? new Set([...Object.values(UnitWeights), "Leggero"]) : null;

    for (const bp of blueprints) {
      if (!bp.id) problems.push(`Blueprint senza id: ${bp.name || "(senza nome)"}`);
      if (!bp.name) problems.push(`Blueprint senza name: ${bp.id || "(senza id)"}`);
      if (!bp.faction || !factions[bp.faction]) problems.push(`Blueprint con fazione sconosciuta: ${bp.id || bp.name} -> ${bp.faction}`);
      if (!bp.type) problems.push(`Blueprint senza type: ${bp.id || bp.name}`);
      else if (knownUnitTypes && !knownUnitTypes.has(bp.type)) warnings.push(`Blueprint con type non enumerato: ${bp.id} -> ${bp.type}`);
      if (!bp.weight) warnings.push(`Blueprint senza weight: ${bp.id || bp.name}`);
      else if (knownWeights && !knownWeights.has(bp.weight)) warnings.push(`Blueprint con weight non enumerato: ${bp.id} -> ${bp.weight}`);

      for (const stat of ["cost", "hp", "att", "def"]) {
        if (!Number.isFinite(bp[stat]) || bp[stat] < 0) problems.push(`Blueprint ${bp.id || bp.name}: ${stat} non valido (${bp[stat]})`);
      }

      if (bp.type === "Struttura" && bp.att > 0) warnings.push(`Struttura con ATT > 0: ${bp.id} (${bp.name})`);
      if (bp.type === "QG") warnings.push(`Blueprint dati contiene QG: ${bp.id || bp.name}`);

      precheckAbility(bp.ability, bp, problems, warnings);

      if (Array.isArray(bp.passives)) {
        for (const passive of bp.passives) precheckAbility(passive, bp, problems, warnings);
      }
    }

    if (typeof unitTaxonomyAuditF9O5 === "function") {
      const taxonomyAudit = unitTaxonomyAuditF9O5(blueprints);
      info.push(`F9O5 tassonomia unità: ${taxonomyAudit.total} blueprint · ${Object.entries(taxonomyAudit.counts).map(([key,value]) => `${key} ${value}`).join(", ")}.`);
      for (const error of taxonomyAudit.errors || []) problems.push(`F9O5: ${error}`);
      for (const warning of taxonomyAudit.warnings || []) warnings.push(`F9O5: ${warning}`);
    }

    if (typeof tokenFxProfileAuditF9O5a === "function") {
      const fxAudit = tokenFxProfileAuditF9O5a(blueprints);
      info.push(`F9O5a profili FX/SFX: ${fxAudit.total} blueprint · ${Object.entries(fxAudit.counts).map(([key,value]) => `${key} ${value}`).join(", ")}.`);
      for (const error of fxAudit.errors || []) problems.push(`F9O5a: ${error}`);
    } else {
      warnings.push("F9O5a: audit profili FX/SFX non disponibile.");
    }

    if (typeof CARD_CATALOG_CONFIG !== "undefined") {
      const requiredF9O5aFlags = [
        "tokenFxProfilesF9O5a",
        "dynamicTokenFxLayerF9O5a",
        "tokenFxReducedOffModesF9O5a",
        "synthesizedSfxRuntimeF9O5a",
        "persistentSfxControlsF9O5a",
        "noWebGlMigrationF9O5a"
      ];
      for (const flag of requiredF9O5aFlags) {
        if (CARD_CATALOG_CONFIG[flag] !== true) problems.push(`F9O5a: feature flag mancante o disattivato: ${flag}.`);
      }
      info.push("F9O5a: miniature statiche con FX dinamici e SFX sintetici; nessuna migrazione WebGL o spritesheet massivo.");

      const requiredF9O6Flags = [
        "hqObjectiveTokenSuppressionF9O5b",
        "dataDrivenTutorialRuntimeF9O6",
        "semanticTutorialSpotlightF9O6",
        "tutorialNarrativePortraitsF9O6",
        "tutorialInputModesF9O6",
        "tutorialEventCompletionF9O6",
        "tutorialCheckpointStorageF9O6",
        "tutorialBotPauseF9O6",
        "tutorialStatsExclusionF9O6"
      ];
      for (const flag of requiredF9O6Flags) {
        if (CARD_CATALOG_CONFIG[flag] !== true) problems.push(`F9O6: feature flag mancante o disattivato: ${flag}.`);
      }
      const requiredF9O7aFlags = [
        "tutorialLessonOneExordiumF9O7a",
        "tutorialScenarioCommandsF9O7a",
        "tutorialCheckpointSnapshotF9O7a",
        "tutorialPlayerTextGameplayOnlyF9O7a"
      ];
      for (const flag of requiredF9O7aFlags) {
        if (CARD_CATALOG_CONFIG[flag] !== true) problems.push(`F9O7a: feature flag mancante o disattivato: ${flag}.`);
      }
      const requiredF9O7bFlags = [
        "tutorialUiStateContractF9O7b",
        "tutorialResumeSynchronizationF9O7b",
        "tutorialAsyncSessionGuardF9O7b",
        "tutorialPortraitFallbackF9O7b"
      ];
      for (const flag of requiredF9O7bFlags) {
        if (CARD_CATALOG_CONFIG[flag] !== true) problems.push(`F9O7b: feature flag mancante o disattivato: ${flag}.`);
      }
      const requiredF9O7cFlags = [
        "tutorialLessonTwoNexusF9O7c",
        "tutorialStarterReserveF9O7c",
        "tutorialDeploymentNetworkF9O7c",
        "tutorialVanguardComparisonF9O7c",
        "tutorialMultiLessonMenuF9O7c"
      ];
      for (const flag of requiredF9O7cFlags) {
        if (CARD_CATALOG_CONFIG[flag] !== true) problems.push(`F9O7c: feature flag mancante o disattivato: ${flag}.`);
      }
      if (CARD_CATALOG_CONFIG.collapsedHandControlsReflowF9O7d !== true) {
        problems.push("F9O7d: reflow dei comandi Mano ridotta mancante o disattivato.");
      }
      const requiredF9O7eFlags = [
        "tutorialLessonThreeAgathoiF9O7e",
        "tutorialDefenseChoiceF9O7e",
        "tutorialThornsCounterattackF9O7e",
        "tutorialFortificationWavesF9O7e"
      ];
      for (const flag of requiredF9O7eFlags) {
        if (CARD_CATALOG_CONFIG[flag] !== true) problems.push(`F9O7e: feature flag mancante o disattivato: ${flag}.`);
      }
      const requiredF9O7fFlags = [
        "tutorialLessonFourLibertiF9O7f",
        "tutorialCardChoiceGateF9O7f",
        "tutorialHoverPreviewAboveSpotlightF9O7f",
        "tutorialBleedSuperiorityCoordinationF9O7f"
      ];
      for (const flag of requiredF9O7fFlags) {
        if (CARD_CATALOG_CONFIG[flag] !== true) problems.push(`F9O7f: feature flag mancante o disattivato: ${flag}.`);
      }
      const requiredF9O7gFlags = [
        "tutorialLessonFiveFabeotF9O7g",
        "tutorialFabeotMarkVulnerabilityF9O7g",
        "tutorialHandEnergyDisruptionF9O7g",
        "tutorialConversionResumeF9O7g"
      ];
      for (const flag of requiredF9O7gFlags) {
        if (CARD_CATALOG_CONFIG[flag] !== true) problems.push(`F9O7g: feature flag mancante o disattivato: ${flag}.`);
      }
    }

    if (typeof tutorialScenarioAuditF9O6 === "function") {
      const tutorialAudit = tutorialScenarioAuditF9O6();
      info.push(`Tutorial: ${tutorialAudit.lessons} lezioni pianificate · ${tutorialAudit.scenarios} lezioni giocabili · ${tutorialAudit.portraitSets} set ritratti.`);
      for (const error of tutorialAudit.errors || []) problems.push(`F9O6: ${error}`);
      for (const warning of tutorialAudit.warnings || []) warnings.push(`F9O6: ${warning}`);
    } else {
      problems.push("F9O6: audit scenari tutorial non disponibile.");
    }
    if (typeof tutorialRuntimeStartScenario !== "function" || typeof tutorialRuntimeHandleGameEvent !== "function" || typeof tutorialRuntimeShouldPauseBot !== "function") {
      problems.push("F9O6: API runtime tutorial incompleta.");
    } else {
      info.push("F9O7a: Lezione 1 Exordium, comandi scenario e checkpoint con ripristino disponibili.");
      info.push("F9O7b: contratto UI della Mano, ripresa sincronizzata, guardie asincrone e fallback ritratti attivi.");
      info.push("F9O7c: Lezione 2 Nexus, riserva Starter, rete di sbarco, Avanguardia e menu multi-lezione disponibili.");
      info.push("F9O7d: con la Mano ridotta, Mostra mano e Fine turno sono sotto le abilità di fazione; Mano aperta invariata.");
      info.push("F9O7e: Lezione 3 Agathoi disponibile con scelta difensiva, Spine, Contrattacco, fortificazione e tre ondate deterministiche.");
      info.push("F9O7f: Lezione 4 Liberti disponibile con scelta carte vincolata, anteprime hover leggibili, Sanguinamento, Superiorità Numerica e assalto coordinato.");
      info.push("F9O7g: Lezione 5 Fabeot disponibile con Marchio, Vulnerabilità, controllo Mano, disturbo ENE, conversione e ripresa deterministica.");
    }

    // C2a deck tactic checks.
    for (const tactic of deckTactics) {
      if (!tactic.id) problems.push(`Deck tactic C2-FINAL-C2 senza id: ${tactic.name || "(senza nome)"}`);
      if (!tactic.name) problems.push(`Deck tactic C2-FINAL-C2 senza name: ${tactic.id || "(senza id)"}`);
      if (!tactic.faction || !factions[tactic.faction]) problems.push(`Deck tactic C2-FINAL-C2 con fazione sconosciuta: ${tactic.id || tactic.name} -> ${tactic.faction}`);
      if (!Number.isFinite(tactic.cost) || tactic.cost < 0) problems.push(`Deck tactic C2-FINAL-C2 ${tactic.id || tactic.name}: costo non valido (${tactic.cost})`);
      if (!tactic.quality) warnings.push(`Deck tactic C2-FINAL-C2 ${tactic.id}: qualità mancante`);
      if (!tactic.targetDomain) warnings.push(`Deck tactic C2-FINAL-C2 ${tactic.id}: targetDomain mancante`);
      if (!tactic.effectKind) warnings.push(`Deck tactic C2-FINAL-C2 ${tactic.id}: effectKind mancante`);
      if ((tactic.targetDomain === "board_unit" || tactic.targetDomain === "board_cell") && tactic.rangeMode !== "none" && !Number.isFinite(tactic.range)) {
        problems.push(`Deck tactic C2-FINAL-C2 ${tactic.id}: range non valido per bersaglio mappa.`);
      }
    }

    // Tactic checks.
    for (const tactic of tactics) {
      if (!tactic.id) problems.push(`Tattica senza id: ${tactic.name || "(senza nome)"}`);
      if (!tactic.name) problems.push(`Tattica senza name: ${tactic.id || "(senza id)"}`);
      if (!tactic.faction || !factions[tactic.faction]) problems.push(`Tattica con fazione sconosciuta: ${tactic.id || tactic.name} -> ${tactic.faction}`);
      if (!tactic.kind) problems.push(`Tattica senza kind: ${tactic.id || tactic.name}`);
      else if (typeof TACTIC_HANDLERS !== "undefined" && !TACTIC_HANDLERS[tactic.kind]) problems.push(`Tactic kind senza handler: ${tactic.kind} su ${tactic.id || tactic.name}`);

      if (!Number.isFinite(tactic.cost) || tactic.cost < 0) problems.push(`Tattica ${tactic.id || tactic.name}: costo non valido (${tactic.cost})`);
      if (tactic.cooldown != null && (!Number.isFinite(tactic.cooldown) || tactic.cooldown < 0)) problems.push(`Tattica ${tactic.id || tactic.name}: cooldown non valido (${tactic.cooldown})`);
      if (tactic.range != null && (!Number.isFinite(tactic.range) || tactic.range < 0)) warnings.push(`Tattica ${tactic.id || tactic.name}: range sospetto (${tactic.range})`);
      if (tactic.statusKind && typeof STATUS_DEFINITIONS !== "undefined" && !STATUS_DEFINITIONS[tactic.statusKind]) {
        warnings.push(`Tattica applica status non definito: ${tactic.statusKind} su ${tactic.id || tactic.name}`);
      }
    }

    // F9N6 – Mission Progress Tracker contract.
    if (missions.length !== 15) problems.push(`Missioni F9N6: ${missions.length}/15 definizioni.`);
    if (typeof missionSupportedMetrics !== "function") problems.push("missionSupportedMetrics non disponibile.");
    else {
      const supportedMetrics = missionSupportedMetrics();
      for (const mission of missions) {
        const items = typeof missionObjectivesFor === "function" ? missionObjectivesFor(mission) : [];
        if (items.length !== 3) problems.push(`Missione ${mission.id}: ${items.length}/3 obiettivi/condizioni.`);
        for (const item of items) {
          if (!supportedMetrics.has(item.metric)) problems.push(`Missione ${mission.id}/${item.id}: metrica senza tracker ${item.metric}.`);
          if (item.consecutive && !["owner_turns","enemy_turns","rounds"].includes(item.durationMode)) problems.push(`Missione ${mission.id}/${item.id}: durata consecutiva ambigua (${item.durationMode || "assente"}).`);
        }
      }
      info.push(`Missioni F9N6: ${missions.length} definizioni, ${missions.reduce((n,m)=>n+(missionObjectivesFor(m).length),0)} condizioni tracciate.`);
    }
    if (typeof initializeMissionTrackerForGame !== "function" || typeof missionDiagnosticsSummary !== "function") problems.push("Runtime/diagnostica Missioni F9N6 non disponibile.");

    // F9N8 – 10 Missioni ordinarie e reward handlers.
    const ordinaryRewardKinds = new Set(["card_cost_sequence","gain_energy_per_controlled_ps","draw_with_discount","draw_cards","gain_energy","enemy_loses_energy_fraction","enemy_discards_hand_fraction"]);
    const ordinaryMissions = missions.filter(mission => mission && mission.missionClass === "ordinary");
    if (ordinaryMissions.length !== 10) problems.push(`Missioni ordinarie F9N8: ${ordinaryMissions.length}/10.`);
    for (const mission of ordinaryMissions) {
      if (!mission.reward || !ordinaryRewardKinds.has(mission.reward.kind)) problems.push(`Missione ordinaria ${mission.id}: ricompensa senza handler F9N8 (${mission.reward && mission.reward.kind || "assente"}).`);
    }
    if (typeof missionPlayOrdinary !== "function" || typeof missionApplyOrdinaryReward !== "function") problems.push("Runtime Missioni ordinarie F9N8 non disponibile.");
    else info.push(`F9N8: ${ordinaryMissions.length} Missioni ordinarie giocabili; ${ordinaryRewardKinds.size} famiglie ricompensa supportate.`);

    // F9N9 – 5 Missioni disperate e ricompense x1-x3.
    const desperateMissions = missions.filter(m => m && m.missionClass === "desperate");
    const desperateRewardKinds = new Set(["energy_and_draw_per_condition","distinct_units_per_condition","repeat_attacks_current_round","phase_shield_per_condition","stun_enemy_per_condition"]);
    if (desperateMissions.length !== 5) problems.push(`Missioni disperate F9N9: ${desperateMissions.length}/5.`);
    for (const mission of desperateMissions) if (!mission.reward || !desperateRewardKinds.has(mission.reward.kind)) problems.push(`Missione disperata ${mission.id}: ricompensa senza handler F9N9 (${mission.reward && mission.reward.kind || "assente"}).`);
    if (typeof missionPlayDesperate !== "function" || typeof missionApplyDesperateReward !== "function") problems.push("Runtime Missioni disperate F9N9 non disponibile.");
    else info.push(`F9N9: ${desperateMissions.length} Missioni disperate giocabili; ${desperateRewardKinds.size} famiglie ricompensa supportate.`);

    // F9N10 – recupero ciclico, deck built-in e gestione IA Missioni.
    if (typeof recoverDeckForPlayer !== "function" || typeof missionResetCycle !== "function" || typeof missionIsRecoveryLocked !== "function") {
      problems.push("Runtime recupero/ciclo Missioni F9N10 non disponibile.");
    } else info.push("F9N10: recupero Missione + 4 carte, reset ciclo e blocco fino al turno personale successivo disponibili.");

    const builtInDecks = typeof BUILTIN_DECKS !== "undefined" && BUILTIN_DECKS ? BUILTIN_DECKS : {};
    const builtInEntries = Object.entries(builtInDecks);
    if (builtInEntries.length !== 13) problems.push(`Deck built-in F9N10: ${builtInEntries.length}/13.`);
    else if (typeof deckBuilderValidateSavedDeckPayload !== "function" || typeof buildCardCatalog !== "function") warnings.push("Validazione runtime deck built-in F9N10 non disponibile nel precheck.");
    else {
      const catalogF9N10 = buildCardCatalog();
      let missionPresets = 0;
      for (const [key, payload] of builtInEntries) {
        const check = deckBuilderValidateSavedDeckPayload(payload, payload.faction, payload.commanderId, catalogF9N10, { allowCustom:true, setupRuntime:true, savedKey:key });
        if (!check.ok) problems.push(`Deck built-in ${key}: ${check.issues.join("; ")}`);
        if (check.runtimeMissionCopies === 1) missionPresets += 1;
      }
      if (missionPresets !== 10) problems.push(`Preset Missione built-in F9N10: ${missionPresets}/10.`);
      const tafos = builtInDecks["Agathoi::AG0B00::agathoi-alexandros-tafos-lithos"];
      if (!tafos || tafos.supplementalMissionId !== "AGMSN01" || tafos.deckIds.length !== 30) problems.push("Preset Tafos Lithos F9N10 non rispetta 30 carte + Missione supplementare AGMSN01.");
      else info.push(`F9N10: ${builtInEntries.length} deck integrati, ${missionPresets} preset Missione; Tafos Lithos 30+Missione.`);
    }

    if (typeof botTryPlayMission !== "function" || typeof botMissionPurchaseBonus !== "function" || typeof botMissionMoveBonus !== "function") problems.push("Runtime IA Missioni F9N10 non disponibile.");
    else info.push("F9N10: IA Missioni attiva su gioco carta, acquisti, movimento, attacchi, abilità e tattiche.");

    // F9O1 – tema fazione Giocatore 1, mappe e audio.
    if (typeof ARENA_FACTION_PRESENTATION_THEMES === "undefined" || Object.keys(ARENA_FACTION_PRESENTATION_THEMES).length !== 5) {
      problems.push("Temi fazione F9O1 incompleti.");
    } else {
      const exTheme = ARENA_FACTION_PRESENTATION_THEMES.Exordium;
      const fbTheme = ARENA_FACTION_PRESENTATION_THEMES.Fabeot;
      if (!exTheme || exTheme.mapSkinKey !== "exordium_battlegrounds") problems.push("Tema Exordium F9O1 non collegato a battlegrounds.");
      if (!fbTheme || fbTheme.mapSkinKey !== "fabeot_velvet_hoods") problems.push("Tema Fabeot F9O1 non collegato a velvet_hoods.");
      info.push("F9O1: 5 temi fazione collegati al Giocatore 1.");
    }
    if (typeof ARENA_AUDIO_TRACKS === "undefined" || !ARENA_AUDIO_TRACKS.victory || !ARENA_AUDIO_TRACKS.defeat) problems.push("Manifest audio F9O1 incompleto.");
    if (typeof arenaAudioHandleMatchEnd !== "function" || typeof arenaAudioChoosePostMatchTrack !== "function") problems.push("Playlist post-partita F9O1 non disponibile.");
    else info.push("F9O1: musica menu, 5 temi fazione e playlist vittoria/sconfitta disponibili.");

    // F9O2 – camera interattiva e API tutorial.
    const cameraApiF9O2 = ["cameraFocusHex", "cameraFocusUnit", "cameraFocusHQ", "cameraFitCoords", "cameraFitDeploymentTargets", "cameraSetZoom", "cameraResetView", "cameraLockInput"];
    for (const apiName of cameraApiF9O2) {
      if (typeof globalThis[apiName] !== "function") problems.push(`Camera F9O2: API ${apiName} non disponibile.`);
    }
    if (typeof cameraDiagnostics !== "function" || typeof initializeCameraInteraction !== "function") problems.push("Runtime camera F9O2 incompleto.");
    else {
      const diagnostics = cameraDiagnostics();
      if (!diagnostics || !diagnostics.limits || diagnostics.limits.minZoom >= diagnostics.limits.maxZoom) problems.push("Camera F9O2: limiti zoom non validi.");
      info.push("F9O2c: camera autonoma e congelata durante render/azioni bot; ispezione UI e fit sbarco disponibili.");
      info.push("F9O2d: livelli token separati; base fazione trasparente con asset ON, asset acted attenuato e indicatori unità selezionata attivi.");
      const perf = diagnostics && diagnostics.performance;
      if (!perf || !perf.frameCoalescing || !perf.geometryCache || !perf.compositeTransform || !perf.gestureReducedEffects) problems.push("F9O4a: contratto prestazioni camera Android incompleto.");
      else info.push("F9O4a: frame coalescing, geometry cache, transform composito ed effetti ridotti durante gesto attivi.");
    }

    // F9O4b – renderer DOM incrementale della mappa.
    const rendererFlagsF9O4b = typeof CARD_CATALOG_CONFIG !== "undefined" && CARD_CATALOG_CONFIG ? CARD_CATALOG_CONFIG : {};
    if (typeof boardRenderDiagnostics !== "function") {
      problems.push("F9O4b: diagnostica renderer DOM incrementale non disponibile.");
    } else if (!rendererFlagsF9O4b.incrementalBoardDomF9O4b || !rendererFlagsF9O4b.persistentHexNodesF9O4b || !rendererFlagsF9O4b.delegatedBoardInputF9O4b || !rendererFlagsF9O4b.cachedBoardTargetsF9O4b || !rendererFlagsF9O4b.reusableUnitTokensF9O4b) {
      problems.push("F9O4b: contratto renderer DOM incrementale incompleto.");
    } else {
      const rendererDiag = boardRenderDiagnostics();
      if (!rendererDiag || !Number.isFinite(rendererDiag.generation)) problems.push("F9O4b: diagnostica renderer non valida.");
      else info.push("F9O4b: celle persistenti, input delegato, target cache e token riutilizzabili attivi.");
    }

    // F9O4c – stabilità WebView Android, asset canvas e pannelli mobile.
    if (!rendererFlagsF9O4b.webViewReplaceChildrenFallbackF9O4c || !rendererFlagsF9O4b.boardContainmentDisabledF9O4c || !rendererFlagsF9O4b.boundedThumbnailQueueF9O4c || !rendererFlagsF9O4b.staleCanvasRedrawGuardF9O4c || !rendererFlagsF9O4b.coalescedMobilePanelLayoutF9O4c) {
      problems.push("F9O4c: contratto stabilità Android incompleto.");
    } else if (typeof boardRenderReplaceChildrenCompat !== "function" || typeof requestInGameHandThumbnailRender !== "function" || typeof apkM4SchedulePanelLayout !== "function") {
      problems.push("F9O4c: runtime compatibilità/coda/pannelli non disponibile.");
    } else {
      info.push("F9O4c: fallback WebView, containment disattivato, thumbnail a budget e pannelli mobile coalescenti attivi.");
    }

    // F9O3 – overlay eventi rapidi e fondazione narrativa.
    if (typeof eventOverlayEnqueueGameEvent !== "function" || typeof eventOverlayDiagnostics !== "function") {
      problems.push("Runtime overlay eventi F9O3 non disponibile.");
    } else {
      const overlayDiag = eventOverlayDiagnostics();
      if (!overlayDiag || !overlayDiag.config || overlayDiag.config.durationMs !== 1000) problems.push("Overlay F9O3: durata rapida non valida.");
      info.push("F9O3: coda eventi rapidi attiva, durata 1 secondo e dismiss al click.");
    }
    if (typeof narrativeOpen !== "function" || typeof narrativeRegisterPortraitSet !== "function" || typeof narrativeDiagnostics !== "function") {
      problems.push("Fondazione narrativa F9O3 non disponibile.");
    } else {
      const narrativeDiag = narrativeDiagnostics();
      if (!narrativeDiag || !Array.isArray(narrativeDiag.expressions) || narrativeDiag.expressions.length < 5) problems.push("Narrativa F9O3: espressioni avatar incomplete.");
      info.push("F9O3: dialoghi narrativi con cinque espressioni e controlli di navigazione disponibili.");
    }

    // Handler orfani: non errore, ma utile per pulizia.
    if (typeof ABILITY_HANDLERS !== "undefined") {
      const usedKinds = new Set(blueprints.map(bp => bp.ability && bp.ability.kind).filter(Boolean));
      const orphanHandlers = Object.keys(ABILITY_HANDLERS).filter(k => !usedKinds.has(k));
      if (orphanHandlers.length) info.push(`Ability handler non usati direttamente da blueprint: ${orphanHandlers.join(", ")}`);
    }

    if (typeof TACTIC_HANDLERS !== "undefined") {
      const usedKinds = new Set(tactics.map(t => t.kind).filter(Boolean));
      const orphanHandlers = Object.keys(TACTIC_HANDLERS).filter(k => !usedKinds.has(k));
      if (orphanHandlers.length) info.push(`Tactic handler non usati direttamente da tattiche: ${orphanHandlers.join(", ")}`);
    }

  } catch (err) {
    problems.push(`Precheck exception: ${err && err.message ? err.message : err}`);
  }

  const report = {
    ok: problems.length === 0,
    source,
    at: new Date().toISOString(),
    problems,
    warnings,
    info
  };

  window.__arenaRubraLastPrecheck = report;
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.dataset.arenaPrecheckOk = String(report.ok);
    document.documentElement.dataset.arenaPrecheckProblems = JSON.stringify(problems);
    document.documentElement.dataset.arenaPrecheckWarnings = JSON.stringify(warnings);
  }

  if (!quiet || problems.length || warnings.length) {
    const msg = `Precheck Arena Rubra: ${report.ok ? "OK" : "PROBLEMI"} · problemi ${problems.length}, warning ${warnings.length}.`;
    if (typeof console !== "undefined") {
      if (problems.length) console.error(msg, JSON.stringify({ problems, warnings }));
      else if (warnings.length) console.warn(msg, JSON.stringify({ warnings }));
      else console.info(msg, report);
    }
    if (typeof log === "function" && (problems.length || warnings.length)) {
      log(`⚠️ ${msg} Controlla console o runPrecheck().`);
    }
  }

  return report;
}

function precheckSummary() {
  const r = window.__arenaRubraLastPrecheck || runPrecheck({ quiet: true, source: "summary" });
  return {
    ok: r.ok,
    problems: r.problems.length,
    warnings: r.warnings.length,
    info: r.info
  };
}

function exportPrecheckJson() {
  const report = window.__arenaRubraLastPrecheck || runPrecheck({ quiet: true, source: "export" });
  return JSON.stringify(report, null, 2);
}

function copyPrecheckJson() {
  const text = exportPrecheckJson();
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    return navigator.clipboard.writeText(text).then(() => text);
  }

  if (typeof document !== "undefined") {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "true");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); }
    finally { document.body.removeChild(area); }
  }

  return text;
}
