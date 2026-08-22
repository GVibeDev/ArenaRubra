"use strict";

// Arena Rubra – F9O7g: Lezioni 1–5; la chiusura Fabeot unisce marchio, vulnerabilità,
// controllo della Mano, disturbo ENE e conversione in uno scenario deterministico.
// I testi destinati al giocatore parlano soltanto di regole, carte e situazione tattica.

const TUTORIAL_LESSON_PLAN_F9O6 = Object.freeze([
  Object.freeze({
    id:"lesson-1-exordium",
    order:1,
    narratorFaction:"Exordium",
    title:"Carte, combattimento e tattiche",
    summary:"Impara a leggere una carta, gestire la Mano, schierare unità, consumare la DEF, usare un’abilità attiva e giocare Missile EMP.",
    status:"available",
    scenarioId:"lesson-1-exordium"
  }),
  Object.freeze({
    id:"lesson-2-nexus",
    order:2,
    narratorFaction:"Nexus",
    title:"Starter, unità e rete di sbarco",
    summary:"Starter, tipi di unità, Avanguardia e due procedure per raggiungere il Punto Strategico centrale.",
    status:"available",
    scenarioId:"lesson-2-nexus"
  }),
  Object.freeze({
    id:"lesson-3-agathoi",
    order:3,
    narratorFaction:"Agathoi",
    title:"Difesa del Punto Strategico",
    summary:"Scelta delle carte, Spine, Contrattacco, fortificazione e resistenza contro tre ondate.",
    status:"available",
    scenarioId:"lesson-3-agathoi"
  }),
  Object.freeze({
    id:"lesson-4-liberti",
    order:4,
    narratorFaction:"Liberti",
    title:"Assalto coordinato",
    summary:"Sanguinamento, Superiorità Numerica e conquista di un Punto Strategico difeso dagli Agathoi.",
    status:"available",
    scenarioId:"lesson-4-liberti"
  }),
  Object.freeze({
    id:"lesson-5-fabeot",
    order:5,
    narratorFaction:"Fabeot",
    title:"Contratti, vulnerabilità e acquisizione",
    summary:"Marchia un bersaglio vulnerabile, controlla la Mano, disturba l’ENE e converti un’unità nemica.",
    status:"available",
    scenarioId:"lesson-5-fabeot"
  })
]);



// F9V2a – Tutorial Challenge Framework & Unlock System.
// Le cinque Prove sul campo sono sempre visibili nell'Accademia ma restano bloccate
// finché tutte le cinque lezioni guidate non risultano completate. Il contenuto
// eseguibile delle singole Challenge viene aggiunto nelle milestone F9V2b–F9V2f.
const TUTORIAL_CHALLENGE_PLAN_F9V2A = Object.freeze([
  Object.freeze({
    id:"challenge-1-elimination",
    order:1,
    title:"Eliminazione",
    subtitle:"Prova sul campo I",
    summary:"Solo unità sul campo. Distruggi 4 unità starter nemiche in 2 ondate da 2.",
    progression:"Solo unità",
    objective:"Elimina tutte le unità nemiche",
    unlockRule:"all_tutorial_lessons_completed",
    scenarioId:null,
    contentStatus:"planned_f9v2b"
  }),
  Object.freeze({
    id:"challenge-2-hold-ps",
    order:2,
    title:"Tenuta",
    subtitle:"Prova sul campo II",
    summary:"Unità e mano fissa, nessuna pesca dal deck. Mantieni il PS centrale per 3 tuoi turni mentre arrivano 6 unità starter avversarie.",
    progression:"Unità + mano · deck vuoto",
    objective:"Mantieni il PS centrale per 3 turni",
    unlockRule:"all_tutorial_lessons_completed",
    scenarioId:null,
    contentStatus:"planned_f9v2c"
  }),
  Object.freeze({
    id:"challenge-3-hq-breach",
    order:3,
    title:"Breccia",
    subtitle:"Prova sul campo III",
    summary:"Unità, mano iniziale e 10 carte di deck. Apri una via e occupa il QG nemico.",
    progression:"Unità + mano + deck 10",
    objective:"Occupa il QG nemico",
    unlockRule:"all_tutorial_lessons_completed",
    scenarioId:null,
    contentStatus:"planned_f9v2d"
  }),
  Object.freeze({
    id:"challenge-4-pressure",
    order:4,
    title:"Pressione",
    subtitle:"Prova sul campo IV",
    summary:"Unità, mano iniziale e 20 carte di deck. Porta il match a una vittoria per Pressione.",
    progression:"Unità + mano + deck 20",
    objective:"Vinci per Pressione",
    unlockRule:"all_tutorial_lessons_completed",
    scenarioId:null,
    contentStatus:"planned_f9v2e"
  }),
  Object.freeze({
    id:"challenge-5-final-exam",
    order:5,
    title:"Esame finale",
    subtitle:"Prova sul campo V",
    summary:"Partita normale in modalità Rapida sulla mappa Starter contro un Bot Nexus.",
    progression:"Partita completa",
    objective:"Vinci il match",
    unlockRule:"all_tutorial_lessons_completed",
    scenarioId:null,
    contentStatus:"planned_f9v2f"
  })
]);

// Registro stabile per gli scenari Challenge. F9V2a lo introduce vuoto: le milestone
// successive aggiungono le definizioni senza cambiare il contratto del runtime.
const TUTORIAL_CHALLENGE_SCENARIOS_F9V2 = Object.freeze({});

const TUTORIAL_PORTRAIT_MANIFEST_F9O6 = Object.freeze({
  exordium:Object.freeze({ id:"tutorial-exordium", label:"Narratore Exordium", faction:"Exordium", frames:Object.freeze({
    neutral:"assets/narrative/portraits/exordium/neutral.webp",
    explain:"assets/narrative/portraits/exordium/explain.webp",
    approve:"assets/narrative/portraits/exordium/approve.webp",
    warning:"assets/narrative/portraits/exordium/warning.webp",
    stern:"assets/narrative/portraits/exordium/stern.webp"
  }) }),
  nexus:Object.freeze({ id:"tutorial-nexus", label:"Narratore Nexus", faction:"Nexus", frames:Object.freeze({
    neutral:"assets/narrative/portraits/nexus/neutral.webp",
    explain:"assets/narrative/portraits/nexus/explain.webp",
    approve:"assets/narrative/portraits/nexus/approve.webp",
    warning:"assets/narrative/portraits/nexus/warning.webp",
    stern:"assets/narrative/portraits/nexus/stern.webp"
  }) }),
  agathoi:Object.freeze({ id:"tutorial-agathoi", label:"Narratore Agathoi", faction:"Agathoi", frames:Object.freeze({
    neutral:"assets/narrative/portraits/agathoi/neutral.webp",
    explain:"assets/narrative/portraits/agathoi/explain.webp",
    approve:"assets/narrative/portraits/agathoi/approve.webp",
    warning:"assets/narrative/portraits/agathoi/warning.webp",
    stern:"assets/narrative/portraits/agathoi/stern.webp"
  }) }),
  liberti:Object.freeze({ id:"tutorial-liberti", label:"Narratore Liberti", faction:"Liberti", frames:Object.freeze({
    neutral:"assets/narrative/portraits/liberti/neutral.webp",
    explain:"assets/narrative/portraits/liberti/explain.webp",
    approve:"assets/narrative/portraits/liberti/approve.webp",
    warning:"assets/narrative/portraits/liberti/warning.webp",
    stern:"assets/narrative/portraits/liberti/stern.webp"
  }) }),
  fabeot:Object.freeze({ id:"tutorial-fabeot", label:"Narratore Fabeot", faction:"Fabeot", frames:Object.freeze({
    neutral:"assets/narrative/portraits/fabeot/neutral.webp",
    explain:"assets/narrative/portraits/fabeot/explain.webp",
    approve:"assets/narrative/portraits/fabeot/approve.webp",
    warning:"assets/narrative/portraits/fabeot/warning.webp",
    stern:"assets/narrative/portraits/fabeot/stern.webp"
  }) })
});

const TUTORIAL_EXORDIUM_COORDS_F9O7A = Object.freeze({
  tribune:Object.freeze([-5,0,5]),
  legionary:Object.freeze([-5,-1,6]),
  enemy:Object.freeze([-4,-1,5])
});

const TUTORIAL_NEXUS_COORDS_F9O7C = Object.freeze({
  infantryDeploy:Object.freeze([-5,0,5]),
  infantryMove:Object.freeze([-4,0,4]),
  forwardStructure:Object.freeze([-3,0,3]),
  networkDeploy:Object.freeze([-2,0,2]),
  centerPs:Object.freeze([0,0,0]),
  quadHolding:Object.freeze([0,1,-1])
});

const TUTORIAL_AGATHOI_COORDS_F9O7E = Object.freeze({
  centerPs:Object.freeze([0,0,0]),
  healingGrove:Object.freeze([-1,0,1]),
  waveOne:Object.freeze([1,0,-1]),
  waveTwo:Object.freeze([0,1,-1]),
  waveThree:Object.freeze([0,-1,1])
});

const TUTORIAL_LIBERTI_COORDS_F9O7F = Object.freeze({
  centerPs:Object.freeze([0,0,0]),
  predone:Object.freeze([-1,0,1]),
  militiaMarked:Object.freeze([0,-1,1]),
  militiaSupport:Object.freeze([1,-1,0])
});

const TUTORIAL_FABEOT_COORDS_F9O7G = Object.freeze({
  target:Object.freeze([1,0,-1]),
  hierarch:Object.freeze([0,1,-1]),
  adept:Object.freeze([1,-1,0]),
  citadel:Object.freeze([-1,0,1]),
  controlledPs:Object.freeze([0,-4,4])
});

const TUTORIAL_SCENARIOS_F9O6 = Object.freeze({
  "lesson-1-exordium": Object.freeze({
    id:"lesson-1-exordium",
    schemaVersion:1,
    title:"Lezione 1 · Disciplina di Aurex",
    lessonId:"lesson-1-exordium",
    narratorFaction:"Exordium",
    setup:Object.freeze({
      factions:Object.freeze({ 1:"Exordium", 2:"Nexus" }),
      selectedCommanders:Object.freeze({ 1:"EX0B00", 2:"NXCMD01" }),
      selectedDecks:Object.freeze({ 1:Object.freeze({ mode:"template" }), 2:Object.freeze({ mode:"template" }) }),
      modes:Object.freeze({ 1:"human", 2:"human" }),
      autoResignEnabled:false,
      aiMode:"advanced",
      pacePreset:"competitive",
      gameScaleMode:"tactical",
      firstPlayer:1,
      energy:Object.freeze({ 1:12, 2:6 }),
      starterCardsEnabled:false,
      hand:Object.freeze({ 1:Object.freeze(["UNIT:EXC1F01", "UNIT:EX1B04"]), 2:Object.freeze([]) }),
      deck:Object.freeze({ 1:Object.freeze([]), 2:Object.freeze([]) })
    }),
    steps:Object.freeze([
      Object.freeze({
        id:"lesson-welcome",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"explain", side:"left", text:"Benvenuto nelle schiere di Aurex. Imparerai a leggere le carte, schierare le unità, affrontare la DEF, usare un’abilità attiva e giocare una tattica." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"read-tribune-card",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"UNIT:EXC1F01" }), padding:8, label:"Il Tribuno" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"explain", side:"right", text:"Ogni carta mostra il costo in ENE, il nome, il tipo e le statistiche. HP indica quanto danno può sopportare l’unità; DEF è la protezione da consumare; ATT è la forza dell’attacco base. Il Tribuno costa 2 ENE e possiede anche un’abilità." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"collapse-hand",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:"#mapHandOverlay .mapHandCollapseBtn" }), padding:8, label:"Riduci mano" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"explain", side:"right", text:"Riduci la Mano per osservare meglio la mappa." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Premi Riduci mano."
      }),
      Object.freeze({
        id:"show-hand",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:"#mapActionDock .mapLeftHandBtn" }), padding:8, label:"Mostra mano" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"approve", side:"right", text:"Riapri la Mano. Potrai ridurla e mostrarla ogni volta che serve." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Premi Mostra mano."
      }),
      Object.freeze({
        id:"select-tribune-card",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"UNIT:EXC1F01" }), padding:8, label:"Il Tribuno" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"stern", side:"right", text:"Seleziona Il Tribuno. Dopo aver scelto una carta unità, la mappa evidenzia le celle legali di sbarco." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona la carta Il Tribuno."
      }),
      Object.freeze({
        id:"deploy-tribune",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"hex", coord:TUTORIAL_EXORDIUM_COORDS_F9O7A.tribune }), padding:7, label:"Cella di sbarco" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"stern", side:"left", text:"Schiera Il Tribuno sulla cella indicata. Le unità senza Avanguardia entrano esauste e agiranno da un turno successivo." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_SPAWNED", match:Object.freeze({ blueprintId:"EXC1F01", player:1 }) }),
        wrongActionText:"Schiera Il Tribuno sulla cella evidenziata."
      }),
      Object.freeze({
        id:"fante-robot-arrives",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        onEnter:Object.freeze([Object.freeze({ action:"spawn_unit", side:2, blueprintId:"NXC1F01", coord:TUTORIAL_EXORDIUM_COORDS_F9O7A.enemy, acted:true })]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NXC1F01" }), padding:9, label:"Fante Robot Nexus" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"warning", side:"left", text:"Un Fante Robot Nexus entra nell’area di addestramento. Possiede 2 HP, 1 DEF e 2 ATT." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"explain-defense",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NXC1F01" }), padding:9, label:"HP e DEF" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"explain", side:"right", text:"Un attacco normale colpisce prima la DEF. Finché il bersaglio possiede DEF, l’eventuale forza in eccesso non passa agli HP. Dopo che la DEF è scesa a zero, un attacco successivo può ferire gli HP." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"end-first-turn",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:".mapLeftEndTurnBtn" }), padding:8, label:"Fine turno" }),
        allowedTargets:Object.freeze([Object.freeze({ type:"selector", selector:".mapLeftEndTurnBtn", all:true }), Object.freeze({ type:"selector", selector:"#endTurnBtn", all:true })]),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"explain", side:"right", text:"Il Tribuno è esausto. Termina il turno per renderlo pronto nel prossimo." }),
        completeOn:Object.freeze({ kind:"event", event:"TURN_ENDED", match:Object.freeze({ player:1 }) }),
        wrongActionText:"Termina il turno con il pulsante evidenziato."
      }),
      Object.freeze({
        id:"nexus-yields-initiative",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        onEnter:Object.freeze([Object.freeze({ action:"pass_turn", side:2 })]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"UNIT:EX1B04" }), padding:8, label:"Legionario Pesante" }),
        checkpoint:true,
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"approve", side:"left", text:"Il Nexus mantiene la posizione. È di nuovo il tuo turno: schiera il Legionario Pesante prima di impegnare il Tribuno." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-legionary-card",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"UNIT:EX1B04" }), padding:8, label:"Legionario Pesante" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"stern", side:"right", text:"Seleziona il Legionario Pesante. Costa 3 ENE, ha 3 HP, 2 DEF e 4 ATT." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona il Legionario Pesante."
      }),
      Object.freeze({
        id:"deploy-legionary",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"hex", coord:TUTORIAL_EXORDIUM_COORDS_F9O7A.legionary }), padding:7, label:"Cella di sbarco" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"stern", side:"left", text:"Schiera il Legionario sulla cella indicata. Entrerà esausto, ma sarà pronto dopo il turno del Nexus." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_SPAWNED", match:Object.freeze({ blueprintId:"EX1B04", player:1 }) }),
        wrongActionText:"Schiera il Legionario sulla cella evidenziata."
      }),
      Object.freeze({
        id:"select-tribune-for-attack",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        onEnter:Object.freeze([Object.freeze({ action:"collapse_hand" })]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"EXC1F01" }), padding:9, label:"Il Tribuno" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"stern", side:"left", text:"Seleziona Il Tribuno. È pronto e si trova adiacente al Fante Robot." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona Il Tribuno."
      }),
      Object.freeze({
        id:"tribune-attacks-fante",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NXC1F01" }), padding:9, label:"Fante Robot" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"stern", side:"right", text:"Attacca il Fante Robot. I 2 ATT del Tribuno consumeranno la sua unica DEF; il danno eccedente non raggiungerà ancora gli HP." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_ATTACKED", match:Object.freeze({ attackerName:"Il Tribuno", defenderName:"Fante Robot" }) }),
        wrongActionText:"Attacca il Fante Robot evidenziato."
      }),
      Object.freeze({
        id:"legionary-ready",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        onEnter:Object.freeze([Object.freeze({ action:"pass_turn", side:2 })]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"EX1B04" }), padding:9, label:"Legionario Pesante" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"approve", side:"left", text:"La DEF del Fante Robot è ora a zero. Dopo il turno del Nexus, il Legionario è pronto a usare Colpo Pesante." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-legionary-unit",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"EX1B04" }), padding:9, label:"Legionario Pesante" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"stern", side:"left", text:"Seleziona il Legionario Pesante." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona il Legionario Pesante."
      }),
      Object.freeze({
        id:"activate-heavy-blow",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:"#selectedUnitPrimaryAbilitySlot [data-unit-action=\"ability\"]" }), padding:8, label:"Colpo Pesante" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"explain", side:"right", text:"Premi il pulsante dell’abilità. Colpo Pesante costa 1 ENE, infligge 2 danni entro raggio 2 e poi entra in ricarica." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Attiva Colpo Pesante."
      }),
      Object.freeze({
        id:"heavy-blow-target",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NXC1F01" }), padding:9, label:"Bersaglio" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"stern", side:"right", text:"Colpisci il Fante Robot. Senza DEF, i 2 danni ridurranno direttamente i suoi 2 HP." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_DESTROYED", match:Object.freeze({ unitName:"Fante Robot", side:2 }) }),
        wrongActionText:"Usa Colpo Pesante sul Fante Robot."
      }),
      Object.freeze({
        id:"mech-arrival",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        onEnter:Object.freeze([
          Object.freeze({ action:"spawn_unit", side:2, blueprintId:"NX3B03", coord:TUTORIAL_EXORDIUM_COORDS_F9O7A.enemy, acted:true }),
          Object.freeze({ action:"grant_card", side:1, cardId:"TACTIC:EXTAC03", zone:"hand" })
        ]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NX3B03" }), padding:10, label:"Mech Pesante" }),
        checkpoint:true,
        focus:true,
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"warning", side:"left", text:"Il Nexus risponde con un Mech Pesante: 4 HP, 3 DEF e 3 ATT. Una sola azione non basterà; dovrai coordinare tattica e unità." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"read-emp-card",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"TACTIC:EXTAC03" }), padding:8, label:"Missile EMP" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"explain", side:"right", text:"Missile EMP è una tattica. Costa 3 ENE, infligge 2 danni e riduce permanentemente di 1 l’ATT del bersaglio. Le tattiche non diventano miniature: si risolvono dalla Mano." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-emp-card",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"TACTIC:EXTAC03" }), padding:8, label:"Missile EMP" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"stern", side:"right", text:"Seleziona Missile EMP." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona Missile EMP."
      }),
      Object.freeze({
        id:"emp-target-mech",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NX3B03" }), padding:10, label:"Mech Pesante" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"stern", side:"left", text:"Lancia Missile EMP contro il Mech Pesante." }),
        completeOn:Object.freeze({ kind:"event", event:"TACTIC_USED", match:Object.freeze({ tacticId:"EXTAC03", player:1 }) }),
        wrongActionText:"Bersaglia il Mech Pesante con Missile EMP."
      }),
      Object.freeze({
        id:"emp-result",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        onEnter:Object.freeze([Object.freeze({ action:"collapse_hand" })]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NX3B03" }), padding:10, label:"Mech indebolito" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"approve", side:"left", text:"Il Missile ha consumato 2 DEF: al Mech ne resta 1. Inoltre il suo ATT è sceso da 3 a 2. Ora il Tribuno può spezzare l’ultima protezione." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-tribune-again",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"EXC1F01" }), padding:9, label:"Il Tribuno" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"stern", side:"left", text:"Seleziona Il Tribuno." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona Il Tribuno."
      }),
      Object.freeze({
        id:"tribune-breaks-mech-defense",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NX3B03" }), padding:10, label:"Mech Pesante" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"stern", side:"right", text:"Attacca il Mech Pesante. Il Tribuno consumerà l’ultima DEF, preparando il colpo decisivo." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_DAMAGED", match:Object.freeze({ targetName:"Mech Pesante", source:"attacco", sourceSide:1, damageKind:"attack", defLoss:1 }) }),
        wrongActionText:"Attacca il Mech Pesante."
      }),
      Object.freeze({
        id:"mech-counterattack",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        onEnter:Object.freeze([Object.freeze({ action:"script_attack_and_end_turn", side:2, attackerBlueprintId:"NX3B03", targetSide:1, targetBlueprintId:"EX1B04" })]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"EX1B04" }), padding:9, label:"Legionario Pesante" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"warning", side:"left", text:"Il Mech reagisce contro il Legionario. Grazie all’EMP attacca con 2: consuma la sua DEF, ma non raggiunge gli HP. Ora il Mech è privo di protezione." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-legionary-final",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"EX1B04" }), padding:9, label:"Legionario Pesante" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"stern", side:"left", text:"Seleziona il Legionario Pesante per il colpo finale." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona il Legionario Pesante."
      }),
      Object.freeze({
        id:"destroy-mech",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NX3B03" }), padding:10, label:"Mech Pesante" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"stern", side:"right", text:"Attacca. Con DEF zero, i 4 ATT del Legionario colpiranno i 4 HP del Mech e lo distruggeranno." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_DESTROYED", match:Object.freeze({ unitName:"Mech Pesante", side:2 }) }),
        wrongActionText:"Attacca il Mech Pesante con il Legionario."
      }),
      Object.freeze({
        id:"lesson-complete",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        message:Object.freeze({ speaker:"Narratore Exordium", portraitSet:"tutorial-exordium", expression:"approve", side:"left", text:"Lezione completata. Hai letto e giocato carte unità, consumato la DEF prima degli HP, usato un’abilità attiva e coordinato Missile EMP con due attacchi." }),
        completeOn:Object.freeze({ kind:"next" })
      })
    ])

  }),
  "lesson-2-nexus": Object.freeze({
    id:"lesson-2-nexus",
    schemaVersion:1,
    title:"Lezione 2 · Rete operativa Nexus",
    lessonId:"lesson-2-nexus",
    narratorFaction:"Nexus",
    setup:Object.freeze({
      factions:Object.freeze({ 1:"Nexus", 2:"Exordium" }),
      selectedCommanders:Object.freeze({ 1:"NXCMD01", 2:"EX0B00" }),
      selectedDecks:Object.freeze({ 1:Object.freeze({ mode:"template" }), 2:Object.freeze({ mode:"template" }) }),
      modes:Object.freeze({ 1:"human", 2:"human" }),
      autoResignEnabled:false,
      aiMode:"advanced",
      pacePreset:"competitive",
      gameScaleMode:"tactical",
      firstPlayer:1,
      energy:Object.freeze({ 1:20, 2:0 }),
      starterCardsEnabled:true,
      hand:Object.freeze({ 1:Object.freeze(["UNIT:NXC1F03"]), 2:Object.freeze([]) }),
      deck:Object.freeze({ 1:Object.freeze([]), 2:Object.freeze([]) })
    }),
    steps:Object.freeze([
      Object.freeze({
        id:"nexus-welcome",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"explain", side:"left", text:"Benvenuto nella rete Nexus. Questa lezione mostra la riserva Starter, le differenze tra Fanteria, Veicolo e Struttura, e il vantaggio di Avanguardia." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"starter-reserve-overview",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"UNIT:NX2B01" }), padding:8, label:"Starter Nexus" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"explain", side:"right", text:"Le tre carte Starter restano sempre nella riserva: una Fanteria, un Veicolo e una Struttura. Non vengono pescate e non vengono consumate quando le usi; paghi comunque il loro costo in ENE e rispetti i limiti di campo." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"read-security-droid",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"UNIT:NX2B01" }), padding:8, label:"Droide di Sicurezza" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"explain", side:"right", text:"Il Droide di Sicurezza è la Fanteria Starter. La Fanteria muove di una cella e, dopo il movimento, può ancora attaccare, usare un’abilità o costruire una Struttura." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-security-droid-starter",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"UNIT:NX2B01" }), padding:8, label:"Droide di Sicurezza" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"stern", side:"right", text:"Seleziona il Droide di Sicurezza dalla riserva Starter." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona il Droide di Sicurezza Starter."
      }),
      Object.freeze({
        id:"deploy-security-droid",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"hex", coord:TUTORIAL_NEXUS_COORDS_F9O7C.infantryDeploy }), padding:7, label:"Sbarco iniziale" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"stern", side:"left", text:"Schiera il Droide sulla cella indicata, vicino al QG. Come quasi tutte le unità appena schierate, entra esausto." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_SPAWNED", match:Object.freeze({ blueprintId:"NX2B01", player:1, spawnSource:"starter" }) }),
        wrongActionText:"Schiera il Droide sulla cella evidenziata."
      }),
      Object.freeze({
        id:"starter-remains-available",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"UNIT:NX2B01" }), padding:8, label:"Starter ancora disponibile" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"approve", side:"right", text:"La carta Starter è ancora nella riserva. Potrai schierare altre copie finché ENE, spazio e limiti della modalità lo consentono." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"end-turn-for-infantry",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:".mapLeftEndTurnBtn" }), padding:8, label:"Fine turno" }),
        allowedTargets:Object.freeze([Object.freeze({ type:"selector", selector:".mapLeftEndTurnBtn", all:true }), Object.freeze({ type:"selector", selector:"#endTurnBtn", all:true })]),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"explain", side:"right", text:"Termina il turno. Il Droide sarà pronto quando la rete tornerà sotto il tuo controllo." }),
        completeOn:Object.freeze({ kind:"event", event:"TURN_ENDED", match:Object.freeze({ player:1 }) }),
        wrongActionText:"Termina il turno con il pulsante evidenziato."
      }),
      Object.freeze({
        id:"exordium-passes-for-infantry",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        onEnter:Object.freeze([Object.freeze({ action:"pass_turn", side:2 })]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"NX2B01" }), padding:9, label:"Fanteria pronta" }),
        checkpoint:true,
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"approve", side:"left", text:"Il turno torna al Nexus. Ora il Droide può muovere e poi costruire nello stesso turno." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-security-droid-unit",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"NX2B01" }), padding:9, label:"Droide di Sicurezza" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"stern", side:"left", text:"Seleziona il Droide di Sicurezza. Le celle raggiungibili verranno evidenziate subito." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona il Droide di Sicurezza."
      }),
      Object.freeze({
        id:"move-security-droid",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"hex", coord:TUTORIAL_NEXUS_COORDS_F9O7C.infantryMove }), padding:7, label:"Avanzata Fanteria" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"stern", side:"right", text:"Muovi il Droide sulla cella indicata. Dopo lo spostamento resterà pronto per costruire." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_MOVED", match:Object.freeze({ player:1, unitName:"Droide di Sicurezza" }) }),
        wrongActionText:"Muovi il Droide sulla cella evidenziata."
      }),
      Object.freeze({
        id:"read-starter-structure",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"UNIT:NXC1F07" }), padding:8, label:"Barriera Armata" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"explain", side:"right", text:"La Barriera Armata è la Struttura Starter. Le Strutture non si muovono, ma diventano nuovi nodi della rete: le unità possono sbarcare sul QG o nelle celle libere adiacenti a un edificio alleato." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-starter-structure",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"UNIT:NXC1F07" }), padding:8, label:"Barriera Armata" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"stern", side:"right", text:"Seleziona la Barriera Armata dalla riserva Starter. Il Droide appena mosso agirà da costruttore." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona la Barriera Armata Starter."
      }),
      Object.freeze({
        id:"build-forward-structure",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"hex", coord:TUTORIAL_NEXUS_COORDS_F9O7C.forwardStructure }), padding:7, label:"Nodo avanzato" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"stern", side:"left", text:"Costruisci la Barriera sulla cella indicata. La Fanteria ha mosso e ora usa la propria azione per estendere la rete di sbarco." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_BUILT", match:Object.freeze({ blueprintId:"NXC1F07", player:1, buildSource:"unit" }) }),
        wrongActionText:"Costruisci la Barriera sulla cella evidenziata."
      }),
      Object.freeze({
        id:"deployment-network-online",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"NXC1F07" }), padding:10, label:"Rete di sbarco" }),
        checkpoint:true,
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"approve", side:"left", text:"Il nodo avanzato è operativo. Da questa Struttura puoi schierare nuove unità più vicino al Punto Strategico centrale." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"read-starter-vehicle",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        onEnter:Object.freeze([Object.freeze({ action:"pass_turn", side:2 })]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"UNIT:NX3B01" }), padding:8, label:"Quad Ricognitore" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"explain", side:"right", text:"Il turno torna al Nexus. Il Quad Ricognitore è il Veicolo Starter: nel ritmo Rapida può muovere fino a due celle, ma normalmente deve scegliere tra movimento e azione." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-starter-vehicle",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"UNIT:NX3B01" }), padding:8, label:"Quad Ricognitore" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"stern", side:"right", text:"Seleziona il Quad Ricognitore dalla riserva Starter." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona il Quad Ricognitore Starter."
      }),
      Object.freeze({
        id:"deploy-quad-from-network",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"hex", coord:TUTORIAL_NEXUS_COORDS_F9O7C.networkDeploy }), padding:7, label:"Sbarco dalla rete" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"stern", side:"left", text:"Schiera il Quad sulla cella indicata, resa disponibile dalla Barriera avanzata." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_SPAWNED", match:Object.freeze({ blueprintId:"NX3B01", player:1, spawnSource:"starter" }) }),
        wrongActionText:"Schiera il Quad sulla cella evidenziata."
      }),
      Object.freeze({
        id:"ordinary-vehicle-exhausted",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"NX3B01" }), padding:9, label:"Veicolo esausto" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"warning", side:"left", text:"Il Quad è arrivato vicino al centro, ma entra esausto. Un Veicolo ordinario deve attendere il turno successivo prima di muovere." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"end-turn-for-quad",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:".mapLeftEndTurnBtn" }), padding:8, label:"Fine turno" }),
        allowedTargets:Object.freeze([Object.freeze({ type:"selector", selector:".mapLeftEndTurnBtn", all:true }), Object.freeze({ type:"selector", selector:"#endTurnBtn", all:true })]),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"explain", side:"right", text:"Termina il turno per rendere pronto il Quad." }),
        completeOn:Object.freeze({ kind:"event", event:"TURN_ENDED", match:Object.freeze({ player:1 }) }),
        wrongActionText:"Termina il turno con il pulsante evidenziato."
      }),
      Object.freeze({
        id:"exordium-passes-for-quad",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        onEnter:Object.freeze([Object.freeze({ action:"pass_turn", side:2 })]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"NX3B01" }), padding:9, label:"Quad pronto" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"approve", side:"left", text:"Il Quad è pronto. Ora completerà il percorso ordinario verso il Punto Strategico." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-quad-unit",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"NX3B01" }), padding:9, label:"Quad Ricognitore" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"stern", side:"left", text:"Seleziona il Quad Ricognitore. Le celle raggiungibili verranno evidenziate subito." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona il Quad Ricognitore."
      }),
      Object.freeze({
        id:"quad-captures-center",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"hex", coord:TUTORIAL_NEXUS_COORDS_F9O7C.centerPs }), padding:9, label:"Punto Strategico centrale" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"stern", side:"right", text:"Muovi il Quad sul Punto Strategico centrale." }),
        completeOn:Object.freeze({ kind:"event", event:"PS_CONTROL_CHANGED", match:Object.freeze({ nextControl:1, occupantName:"Quad Ricognitore" }) }),
        wrongActionText:"Muovi il Quad sul Punto Strategico centrale."
      }),
      Object.freeze({
        id:"ordinary-route-complete",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"ps", coord:TUTORIAL_NEXUS_COORDS_F9O7C.centerPs }), padding:10, label:"PS controllato" }),
        checkpoint:true,
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"approve", side:"left", text:"Primo procedimento completato: rete avanzata, sbarco del Veicolo, attesa di un turno e movimento sul Punto Strategico." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"prepare-vanguard-comparison",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        onEnter:Object.freeze([
          Object.freeze({ action:"pass_turn", side:2 }),
          Object.freeze({ action:"relocate_unit", side:1, blueprintId:"NX3B01", coord:TUTORIAL_NEXUS_COORDS_F9O7C.quadHolding, acted:true })
        ]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"UNIT:NXC1F03" }), padding:8, label:"Mech Leggero" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"explain", side:"right", text:"Il Quad libera il centro per il confronto. Il Mech Leggero è una carta della Mano e possiede Avanguardia: può agire nello stesso turno in cui entra in gioco." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-vanguard-card",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"UNIT:NXC1F03" }), padding:8, label:"Mech Leggero" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"stern", side:"right", text:"Seleziona il Mech Leggero dalla Mano." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona il Mech Leggero."
      }),
      Object.freeze({
        id:"deploy-vanguard-from-network",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"hex", coord:TUTORIAL_NEXUS_COORDS_F9O7C.networkDeploy }), padding:7, label:"Sbarco Avanguardia" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"stern", side:"left", text:"Schiera il Mech sulla stessa cella della rete avanzata. Avanguardia lo manterrà pronto." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_SPAWNED", match:Object.freeze({ blueprintId:"NXC1F03", player:1, exhausted:false }) }),
        wrongActionText:"Schiera il Mech sulla cella evidenziata."
      }),
      Object.freeze({
        id:"select-vanguard-unit",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"NXC1F03" }), padding:9, label:"Mech Leggero pronto" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"approve", side:"left", text:"Il Mech non è esausto. Selezionalo: le celle raggiungibili verranno evidenziate e potrà muovere immediatamente." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona il Mech Leggero."
      }),
      Object.freeze({
        id:"vanguard-captures-center",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"hex", coord:TUTORIAL_NEXUS_COORDS_F9O7C.centerPs }), padding:9, label:"Punto Strategico centrale" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"stern", side:"right", text:"Muovi il Mech sul Punto Strategico. Avanguardia ha eliminato il turno di attesa." }),
        completeOn:Object.freeze({ kind:"event", event:"PS_CONTROL_CHANGED", match:Object.freeze({ nextControl:1, occupantName:"Mech Leggero" }) }),
        wrongActionText:"Muovi il Mech sul Punto Strategico centrale."
      }),
      Object.freeze({
        id:"nexus-lesson-complete",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        message:Object.freeze({ speaker:"Narratore Nexus", portraitSet:"tutorial-nexus", expression:"approve", side:"left", text:"Lezione completata. Hai usato la riserva Starter, mosso e costruito con la Fanteria, esteso la rete con una Struttura, raggiunto il centro con un Veicolo e confrontato lo sbarco ordinario con Avanguardia." }),
        completeOn:Object.freeze({ kind:"next" })
      })
    ])
  }),
  "lesson-3-agathoi": Object.freeze({
    id:"lesson-3-agathoi",
    schemaVersion:1,
    title:"Lezione 3 · Il Punto non arretra",
    lessonId:"lesson-3-agathoi",
    narratorFaction:"Agathoi",
    setup:Object.freeze({
      factions:Object.freeze({ 1:"Agathoi", 2:"Exordium" }),
      selectedCommanders:Object.freeze({ 1:"AGCMD02", 2:"EX0B00" }),
      selectedDecks:Object.freeze({ 1:Object.freeze({ mode:"template" }), 2:Object.freeze({ mode:"template" }) }),
      modes:Object.freeze({ 1:"human", 2:"human" }),
      autoResignEnabled:false,
      aiMode:"advanced",
      pacePreset:"competitive",
      gameScaleMode:"tactical",
      firstPlayer:1,
      energy:Object.freeze({ 1:20, 2:0 }),
      starterCardsEnabled:false,
      hand:Object.freeze({
        1:Object.freeze(["TACTIC:AGTAC07", "TACTIC:AGTAC05", "TACTIC:AGTAC04", "TACTIC:AGTAC08"]),
        2:Object.freeze([])
      }),
      deck:Object.freeze({ 1:Object.freeze([]), 2:Object.freeze([]) })
    }),
    steps:Object.freeze([
      Object.freeze({
        id:"agathoi-welcome",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        onEnter:Object.freeze([
          Object.freeze({ action:"spawn_unit", side:1, blueprintId:"AG1B02", coord:TUTORIAL_AGATHOI_COORDS_F9O7E.centerPs, acted:false }),
          Object.freeze({ action:"spawn_unit", side:1, blueprintId:"AG4B01", coord:TUTORIAL_AGATHOI_COORDS_F9O7E.healingGrove, acted:true })
        ]),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"explain", side:"left", text:"La linea Agathoi non vince inseguendo ogni bersaglio. Imparerai a scegliere la difesa adatta, presidiare un Punto Strategico e resistere a tre ondate Exordium." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"defensive-line-overview",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"AG1B02" }), padding:10, label:"Oplita di Confine" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"explain", side:"right", text:"L’Oplita di Confine presidia il Punto centrale con 3 HP, 3 DEF e Spine 1 permanenti. La Radura Curativa adiacente mantiene aperta la rete alleata per le tattiche difensive." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"choose-first-defense",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"TACTIC:AGTAC07" }), padding:8, label:"Manto di Rovi" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"explain", side:"right", text:"La Mano offre più risposte, ma la prima ondata è fragile. Manto di Rovi porta le Spine a 2 fino al prossimo turno: è la scelta più efficiente per punire un assalto leggero." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-thorns-tactic",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"TACTIC:AGTAC07" }), padding:8, label:"Manto di Rovi" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"stern", side:"right", text:"Seleziona Manto di Rovi." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona Manto di Rovi."
      }),
      Object.freeze({
        id:"apply-thorns-to-oplite",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"AG1B02" }), padding:10, label:"Oplita di Confine" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"stern", side:"left", text:"Applica Manto di Rovi all’Oplita." }),
        completeOn:Object.freeze({ kind:"event", event:"TACTIC_USED", match:Object.freeze({ tacticId:"AGTAC07", player:1 }) }),
        wrongActionText:"Bersaglia l’Oplita di Confine con Manto di Rovi."
      }),
      Object.freeze({
        id:"thorns-defense-ready",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"AG1B02" }), padding:10, label:"Spine 2" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"approve", side:"left", text:"L’Oplita ora infligge 2 danni diretti a chi lo attacca. Le Spine non impediscono il colpo nemico: trasformano però ogni assalto in un costo." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"end-turn-wave-one",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:".mapLeftEndTurnBtn" }), padding:8, label:"Fine turno" }),
        allowedTargets:Object.freeze([Object.freeze({ type:"selector", selector:".mapLeftEndTurnBtn", all:true }), Object.freeze({ type:"selector", selector:"#endTurnBtn", all:true })]),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"stern", side:"right", text:"Termina il turno e lascia che l’Exordium urti contro la linea." }),
        completeOn:Object.freeze({ kind:"event", event:"TURN_ENDED", match:Object.freeze({ player:1 }) }),
        wrongActionText:"Termina il turno con il pulsante evidenziato."
      }),
      Object.freeze({
        id:"wave-one-resolved",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        onEnter:Object.freeze([
          Object.freeze({ action:"spawn_unit", side:2, blueprintId:"EX1B01", coord:TUTORIAL_AGATHOI_COORDS_F9O7E.waveOne, acted:false, currentHp:2, currentDef:0 }),
          Object.freeze({ action:"script_attack_and_end_turn", side:2, attackerBlueprintId:"EX1B01", targetSide:1, targetBlueprintId:"AG1B02" })
        ]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"AG1B02" }), padding:10, label:"Prima ondata respinta" }),
        checkpoint:true,
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"approve", side:"left", text:"La Guardia ha consumato parte della DEF dell’Oplita, ma le Spine 2 l’hanno distrutta. Prima ondata respinta senza spendere un attacco." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"choose-counterattack",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"TACTIC:AGTAC05" }), padding:8, label:"Natura Vigile" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"warning", side:"right", text:"La seconda ondata è più resistente. Natura Vigile concede Contrattacco: se l’Oplita sopravvive a un attacco base, risponde immediatamente una sola volta." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-counterattack-tactic",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"TACTIC:AGTAC05" }), padding:8, label:"Natura Vigile" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"stern", side:"right", text:"Seleziona Natura Vigile." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona Natura Vigile."
      }),
      Object.freeze({
        id:"apply-counterattack-to-oplite",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"AG1B02" }), padding:10, label:"Oplita di Confine" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"stern", side:"left", text:"Concedi Contrattacco all’Oplita." }),
        completeOn:Object.freeze({ kind:"event", event:"TACTIC_USED", match:Object.freeze({ tacticId:"AGTAC05", player:1 }) }),
        wrongActionText:"Bersaglia l’Oplita di Confine con Natura Vigile."
      }),
      Object.freeze({
        id:"counterattack-ready",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"AG1B02" }), padding:10, label:"Contrattacco pronto" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"explain", side:"left", text:"Spine e Contrattacco sono reazioni diverse. Le Spine infliggono danno diretto; il Contrattacco usa l’ATT dell’Oplita e colpisce prima la DEF nemica." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"end-turn-wave-two",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:".mapLeftEndTurnBtn" }), padding:8, label:"Fine turno" }),
        allowedTargets:Object.freeze([Object.freeze({ type:"selector", selector:".mapLeftEndTurnBtn", all:true }), Object.freeze({ type:"selector", selector:"#endTurnBtn", all:true })]),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"stern", side:"right", text:"Termina il turno e prepara la risposta dell’Oplita." }),
        completeOn:Object.freeze({ kind:"event", event:"TURN_ENDED", match:Object.freeze({ player:1 }) }),
        wrongActionText:"Termina il turno con il pulsante evidenziato."
      }),
      Object.freeze({
        id:"wave-two-resolved",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        onEnter:Object.freeze([
          Object.freeze({ action:"spawn_unit", side:2, blueprintId:"EX1B04", coord:TUTORIAL_AGATHOI_COORDS_F9O7E.waveTwo, acted:false, currentDef:0 }),
          Object.freeze({ action:"script_attack_and_end_turn", side:2, attackerBlueprintId:"EX1B04", targetSide:1, targetBlueprintId:"AG1B02" })
        ]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"AG1B02" }), padding:10, label:"Seconda ondata respinta" }),
        checkpoint:true,
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"approve", side:"left", text:"Il Legionario ha spezzato l’ultima DEF dell’Oplita. Le Spine lo hanno ferito e il Contrattacco lo ha abbattuto. L’Oplita conserva tutti gli HP." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"choose-fortification",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"TACTIC:AGTAC04" }), padding:8, label:"Bastione Ligneo" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"warning", side:"right", text:"La terza ondata mira alla Radura. Bastione Ligneo imposta la DEF attuale della Struttura pari ai suoi HP: la scelta corretta contro un singolo colpo molto potente." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-fortification-tactic",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"TACTIC:AGTAC04" }), padding:8, label:"Bastione Ligneo" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"stern", side:"right", text:"Seleziona Bastione Ligneo." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona Bastione Ligneo."
      }),
      Object.freeze({
        id:"fortify-healing-grove",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"AG4B01" }), padding:10, label:"Radura Curativa" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"stern", side:"left", text:"Fortifica la Radura Curativa." }),
        completeOn:Object.freeze({ kind:"event", event:"TACTIC_USED", match:Object.freeze({ tacticId:"AGTAC04", player:1 }) }),
        wrongActionText:"Bersaglia la Radura Curativa con Bastione Ligneo."
      }),
      Object.freeze({
        id:"fortification-ready",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"AG4B01" }), padding:10, label:"DEF pari agli HP" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"approve", side:"left", text:"La Radura possiede ora 4 DEF, pari ai suoi 4 HP. Finché il colpo incontra almeno un punto di DEF, l’eccesso non oltrepassa la protezione." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"end-turn-wave-three",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:".mapLeftEndTurnBtn" }), padding:8, label:"Fine turno" }),
        allowedTargets:Object.freeze([Object.freeze({ type:"selector", selector:".mapLeftEndTurnBtn", all:true }), Object.freeze({ type:"selector", selector:"#endTurnBtn", all:true })]),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"stern", side:"right", text:"Termina il turno. L’ultima ondata tenterà di demolire la Struttura." }),
        completeOn:Object.freeze({ kind:"event", event:"TURN_ENDED", match:Object.freeze({ player:1 }) }),
        wrongActionText:"Termina il turno con il pulsante evidenziato."
      }),
      Object.freeze({
        id:"wave-three-survived",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        onEnter:Object.freeze([
          Object.freeze({ action:"spawn_unit", side:2, blueprintId:"EX2B04", coord:TUTORIAL_AGATHOI_COORDS_F9O7E.waveThree, acted:false, currentHp:2, currentDef:0 }),
          Object.freeze({ action:"script_attack_and_end_turn", side:2, attackerBlueprintId:"EX2B04", targetSide:1, targetBlueprintId:"AG4B01" })
        ]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"AG4B01" }), padding:10, label:"Radura ancora integra" }),
        checkpoint:true,
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"approve", side:"left", text:"L’Artiglieria ha annullato tutta la DEF, ma non ha sottratto HP alla Radura. La fortificazione ha assorbito il colpo e la linea può rispondere." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-oplite-final",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"AG1B02" }), padding:10, label:"Oplita di Confine" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"stern", side:"left", text:"Seleziona l’Oplita. Ha resistito alle ondate ed è ancora pronto ad agire." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona l’Oplita di Confine."
      }),
      Object.freeze({
        id:"destroy-third-wave",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"EX2B04" }), padding:10, label:"Artiglieria Exordium" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"stern", side:"right", text:"Attacca l’Artiglieria. Senza DEF e con 2 HP rimasti, verrà distrutta dai 2 ATT dell’Oplita." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_DESTROYED", match:Object.freeze({ unitName:"Artiglieria Exordium", side:2 }) }),
        wrongActionText:"Attacca l’Artiglieria Exordium con l’Oplita."
      }),
      Object.freeze({
        id:"agathoi-lesson-complete",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"ps", coord:TUTORIAL_AGATHOI_COORDS_F9O7E.centerPs }), padding:10, label:"Punto difeso" }),
        message:Object.freeze({ speaker:"Narratore Agathoi", portraitSet:"tutorial-agathoi", expression:"approve", side:"left", text:"Lezione completata. Hai scelto tre difese diverse, trasformato gli attacchi nemici in danno con Spine e Contrattacco, fortificato una Struttura e mantenuto il controllo del Punto." }),
        completeOn:Object.freeze({ kind:"next" })
      })
    ])
  }),
  "lesson-4-liberti": Object.freeze({
    id:"lesson-4-liberti",
    schemaVersion:1,
    title:"Lezione 4 · La pressione apre il varco",
    lessonId:"lesson-4-liberti",
    narratorFaction:"Liberti",
    setup:Object.freeze({
      factions:Object.freeze({ 1:"Liberti", 2:"Agathoi" }),
      selectedCommanders:Object.freeze({ 1:"LX0B00", 2:"AGCMD02" }),
      selectedDecks:Object.freeze({ 1:Object.freeze({ mode:"template" }), 2:Object.freeze({ mode:"template" }) }),
      modes:Object.freeze({ 1:"human", 2:"human" }),
      autoResignEnabled:false,
      aiMode:"advanced",
      pacePreset:"competitive",
      gameScaleMode:"tactical",
      firstPlayer:1,
      energy:Object.freeze({ 1:20, 2:0 }),
      starterCardsEnabled:false,
      hand:Object.freeze({
        1:Object.freeze(["TACTIC:LBTAC08", "TACTIC:LBTAC14", "TACTIC:LBTAC05", "TACTIC:LBTAC09"]),
        2:Object.freeze([])
      }),
      deck:Object.freeze({ 1:Object.freeze([]), 2:Object.freeze([]) })
    }),
    steps:Object.freeze([
      Object.freeze({
        id:"liberti-welcome",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        onEnter:Object.freeze([
          Object.freeze({ action:"spawn_unit", side:1, blueprintId:"LX2B02", coord:TUTORIAL_LIBERTI_COORDS_F9O7F.predone, acted:false }),
          Object.freeze({ action:"spawn_unit", side:1, blueprintId:"LX2B01", coord:TUTORIAL_LIBERTI_COORDS_F9O7F.militiaMarked, acted:false }),
          Object.freeze({ action:"spawn_unit", side:1, blueprintId:"LX2B01", coord:TUTORIAL_LIBERTI_COORDS_F9O7F.militiaSupport, acted:false }),
          Object.freeze({ action:"spawn_unit", side:2, blueprintId:"AGC1F04", coord:TUTORIAL_LIBERTI_COORDS_F9O7F.centerPs, acted:true })
        ]),
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"explain", side:"left", text:"Gli Agathoi tengono il Punto centrale con un Anthropos di Pietra. Non lo abbatterai con un singolo colpo: dovrai leggere la Mano, scegliere le carte giuste e trasformare il numero in pressione." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"liberti-formation-overview",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"AGC1F04" }), padding:10, label:"Anthropos di Pietra" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"warning", side:"right", text:"L’Anthropos possiede 6 HP e 4 DEF. Tre fanterie Liberti lo circondano: quando almeno un alleato è adiacente allo stesso bersaglio, Superiorità Numerica aggiunge +1 ATT all’attacco." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"inspect-liberti-hand",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:"#mapHandOverlay .mapHandOverlayCards" }), padding:8, label:"Confronta le carte" }),
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"explain", side:"right", text:"Passa il puntatore sulle carte e leggi le anteprime. Nel tutorial l’anteprima resta pienamente visibile anche quando il resto della schermata è oscurato. Cerca una carta che faccia applicare Sanguinamento 2 al prossimo attacco di una fanteria." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"choose-sanguis-card",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:"#mapHandOverlay .mapHandOverlayCards" }), padding:8, label:"Scegli la carta corretta" }),
        allowedTargets:Object.freeze([Object.freeze({ type:"selector", selector:"#mapHandOverlay .mapHandCardSlot", all:true })]),
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"stern", side:"right", text:"Scegli dalla Mano la carta che prepara Sanguinamento 2 sul prossimo attacco base di una fanteria." }),
        completeOn:Object.freeze({ kind:"action", action:"card_selected", match:Object.freeze({ side:1, cardId:"TACTIC:LBTAC08" }) }),
        wrongActionText:"Confronta gli effetti: serve Marchio dei Sanguis."
      }),
      Object.freeze({
        id:"apply-sanguis-mark",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"LX2B01" }), padding:10, label:"Miliziano da marchiare" }),
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"stern", side:"left", text:"Applica Marchio dei Sanguis al Miliziano evidenziato." }),
        completeOn:Object.freeze({ kind:"event", event:"TACTIC_USED", match:Object.freeze({ tacticId:"LBTAC08", player:1 }) }),
        wrongActionText:"Bersaglia il Miliziano evidenziato con Marchio dei Sanguis."
      }),
      Object.freeze({
        id:"select-marked-militia",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"LX2B01" }), padding:10, label:"Miliziano marchiato" }),
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"stern", side:"left", text:"Seleziona il Miliziano marchiato." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona il Miliziano marchiato."
      }),
      Object.freeze({
        id:"superiority-attack",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"AGC1F04" }), padding:10, label:"Anthropos di Pietra" }),
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"stern", side:"right", text:"Attacca l’Anthropos. Il Miliziano passa da 2 a 3 ATT grazie alla Superiorità Numerica: consumerà 3 dei 4 punti DEF e applicherà Sanguinamento 2." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_ATTACKED", match:Object.freeze({ attackerName:"Miliziano Liberto", defenderName:"Anthropos di Pietra", amount:3 }) }),
        wrongActionText:"Attacca l’Anthropos di Pietra con il Miliziano selezionato."
      }),
      Object.freeze({
        id:"bleed-prepared",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"AGC1F04" }), padding:10, label:"1 DEF · Sanguinamento 2" }),
        checkpoint:true,
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"approve", side:"left", text:"La DEF è scesa da 4 a 1. Il bersaglio è ancora a 6 HP, ma Sanguinamento 2 lo colpirà direttamente all’inizio del suo turno, ignorando la DEF residua." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"end-turn-for-bleed",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:".mapLeftEndTurnBtn" }), padding:8, label:"Fine turno" }),
        allowedTargets:Object.freeze([Object.freeze({ type:"selector", selector:".mapLeftEndTurnBtn", all:true }), Object.freeze({ type:"selector", selector:"#endTurnBtn", all:true })]),
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"stern", side:"right", text:"Termina il turno per far scattare il Sanguinamento." }),
        completeOn:Object.freeze({ kind:"event", event:"TURN_ENDED", match:Object.freeze({ player:1 }) }),
        wrongActionText:"Termina il turno con il pulsante evidenziato."
      }),
      Object.freeze({
        id:"bleed-resolved",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        onEnter:Object.freeze([Object.freeze({ action:"pass_turn", side:2 })]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"AGC1F04" }), padding:10, label:"Sanguinamento risolto" }),
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"approve", side:"left", text:"Il Sanguinamento ha sottratto 2 HP direttamente: l’Anthropos è sceso a 4 HP pur conservando 1 DEF. Ora serve una carta che trasformi l’accerchiamento in attacchi immediati." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"choose-coordinated-card",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:"#mapHandOverlay .mapHandOverlayCards" }), padding:8, label:"Seconda scelta" }),
        allowedTargets:Object.freeze([Object.freeze({ type:"selector", selector:"#mapHandOverlay .mapHandCardSlot", all:true })]),
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"stern", side:"right", text:"Scegli la carta che ordina alle fanterie adiacenti al nemico di attaccare immediatamente, anche se hanno già agito." }),
        completeOn:Object.freeze({ kind:"action", action:"card_selected", match:Object.freeze({ side:1, cardId:"TACTIC:LBTAC14" }) }),
        wrongActionText:"Serve una carta di attacco coordinato: Esca d’Attacco."
      }),
      Object.freeze({
        id:"play-coordinated-attack",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"AGC1F04" }), padding:10, label:"Bersaglio accerchiato" }),
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"stern", side:"left", text:"Gioca Esca d’Attacco sull’Anthropos accerchiato." }),
        completeOn:Object.freeze({ kind:"event", event:"TACTIC_USED", match:Object.freeze({ tacticId:"LBTAC14", player:1 }) }),
        wrongActionText:"Bersaglia l’Anthropos di Pietra con Esca d’Attacco."
      }),
      Object.freeze({
        id:"coordinated-pressure-resolved",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"ps", coord:TUTORIAL_LIBERTI_COORDS_F9O7F.centerPs }), padding:10, label:"Varco aperto" }),
        checkpoint:true,
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"approve", side:"left", text:"Esca d’Attacco ha attivato le fanterie in sequenza. La prima ha eliminato l’ultima DEF; le successive hanno abbattuto gli HP. Il Punto centrale è ora libero." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-predone-to-capture",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"LX2B02" }), padding:10, label:"Predone Liberto" }),
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"stern", side:"left", text:"Seleziona il Predone Liberto. Le reazioni coordinate non gli hanno consumato l’azione normale." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona il Predone Liberto."
      }),
      Object.freeze({
        id:"capture-center-ps",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"hex", coord:TUTORIAL_LIBERTI_COORDS_F9O7F.centerPs }), padding:10, label:"Punto Strategico centrale" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"stern", side:"right", text:"Muovi il Predone sul Punto Strategico e completa l’assalto." }),
        completeOn:Object.freeze({ kind:"event", event:"PS_CONTROL_CHANGED", match:Object.freeze({ nextControl:1, occupantName:"Predone Liberto" }) }),
        wrongActionText:"Muovi il Predone sul Punto Strategico centrale."
      }),
      Object.freeze({
        id:"liberti-lesson-complete",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"ps", coord:TUTORIAL_LIBERTI_COORDS_F9O7F.centerPs }), padding:10, label:"Punto conquistato" }),
        message:Object.freeze({ speaker:"Narratore Liberti", portraitSet:"tutorial-liberti", expression:"approve", side:"left", text:"Lezione completata. Hai confrontato le carte tramite anteprima, scelto la risposta corretta, applicato Sanguinamento, sfruttato Superiorità Numerica e convertito l’accerchiamento in conquista." }),
        completeOn:Object.freeze({ kind:"next" })
      })
    ])
  }),
  "lesson-5-fabeot": Object.freeze({
    id:"lesson-5-fabeot",
    schemaVersion:1,
    title:"Lezione 5 · Il contratto cambia padrone",
    lessonId:"lesson-5-fabeot",
    narratorFaction:"Fabeot",
    setup:Object.freeze({
      factions:Object.freeze({ 1:"Fabeot", 2:"Nexus" }),
      selectedCommanders:Object.freeze({ 1:"FB0B00", 2:"NXCMD02" }),
      selectedDecks:Object.freeze({ 1:Object.freeze({ mode:"template" }), 2:Object.freeze({ mode:"template" }) }),
      modes:Object.freeze({ 1:"human", 2:"human" }),
      autoResignEnabled:false,
      aiMode:"advanced",
      pacePreset:"competitive",
      gameScaleMode:"tactical",
      firstPlayer:1,
      energy:Object.freeze({ 1:20, 2:5 }),
      starterCardsEnabled:false,
      hand:Object.freeze({
        1:Object.freeze(["TACTIC:FABTAC07", "TACTIC:FABTAC09", "TACTIC:FABTAC04", "TACTIC:FABTAC03"]),
        2:Object.freeze(["UNIT:NXC1F03"])
      }),
      deck:Object.freeze({ 1:Object.freeze([]), 2:Object.freeze([]) })
    }),
    steps:Object.freeze([
      Object.freeze({
        id:"fabeot-welcome",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        onEnter:Object.freeze([
          Object.freeze({ action:"spawn_unit", side:1, blueprintId:"FB4B01", coord:TUTORIAL_FABEOT_COORDS_F9O7G.controlledPs, acted:false }),
          Object.freeze({ action:"spawn_unit", side:1, blueprintId:"FB0B00", coord:TUTORIAL_FABEOT_COORDS_F9O7G.hierarch, acted:false }),
          Object.freeze({ action:"spawn_unit", side:1, blueprintId:"FB1B01", coord:TUTORIAL_FABEOT_COORDS_F9O7G.adept, acted:false }),
          Object.freeze({ action:"spawn_unit", side:1, blueprintId:"FBPIV01", coord:TUTORIAL_FABEOT_COORDS_F9O7G.citadel, acted:false }),
          Object.freeze({ action:"spawn_unit", side:2, blueprintId:"NXC1F01", coord:TUTORIAL_FABEOT_COORDS_F9O7G.target, acted:true })
        ]),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NXC1F01" }), padding:10, label:"Fante Robot" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"explain", side:"left", text:"Il Nexus ha lasciato un Fante Robot isolato. Non serve distruggerlo: prima rendilo vulnerabile, poi sfrutta il Marchio per trasferirne il controllo alla Cittadella." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"fabeot-contract-overview",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"FB0B00" }), padding:10, label:"Gerarca Fabeot" }),
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"explain", side:"right", text:"Sentenza Porpora costa 2 ENE. Il bersaglio marchiato subisce +1 danno da attacchi e abilità offensive fino a fine turno; quel Marchio soddisfa anche una clausola di acquisizione Fabeot." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-fabeot-hierarch",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"FB0B00" }), padding:10, label:"Gerarca Fabeot" }),
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"stern", side:"left", text:"Seleziona il Gerarca Fabeot." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona il Gerarca Fabeot."
      }),
      Object.freeze({
        id:"activate-purple-sentence",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:"#selectedUnitPrimaryAbilitySlot [data-unit-action=\"ability\"]" }), padding:8, label:"Sentenza Porpora" }),
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"stern", side:"right", text:"Attiva Sentenza Porpora." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Attiva Sentenza Porpora dal pannello dell’unità."
      }),
      Object.freeze({
        id:"mark-fante-with-vulnerability",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NXC1F01" }), padding:10, label:"Fante Robot" }),
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"stern", side:"left", text:"Applica il Marchio al Fante Robot." }),
        completeOn:Object.freeze({ kind:"event", event:"ABILITY_USED", match:Object.freeze({ player:1, abilityKind:"vulnerableMark", rawTargetName:"Fante Robot" }) }),
        wrongActionText:"Bersaglia il Fante Robot con Sentenza Porpora."
      }),
      Object.freeze({
        id:"vulnerability-contract-ready",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NXC1F01" }), padding:10, label:"Marchiato · Vulnerabile +1" }),
        checkpoint:true,
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"approve", side:"right", text:"Il Fante Robot è Marchiato e Vulnerabile: il prossimo attacco riceverà +1 danno. La sua DEF verrà rimossa, mentre i 2 HP resteranno entro il limite della Clausola di Acquisizione." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-fabeot-adept",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"FB1B01" }), padding:10, label:"Adepto Fabeot" }),
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"stern", side:"left", text:"Seleziona l’Adepto Fabeot." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona l’Adepto Fabeot."
      }),
      Object.freeze({
        id:"exploit-fabeot-vulnerability",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NXC1F01" }), padding:10, label:"Fante Robot vulnerabile" }),
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"stern", side:"right", text:"Attacca il Fante Robot. L’Adepto ha 1 ATT, ma la Vulnerabilità aggiunge 1 danno e rimuove l’unica DEF senza ferire gli HP." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_ATTACKED", match:Object.freeze({ attackerName:"Adepto Fabeot", defenderName:"Fante Robot" }) }),
        wrongActionText:"Attacca il Fante Robot con l’Adepto selezionato."
      }),
      Object.freeze({
        id:"target-ready-for-acquisition",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NXC1F01" }), padding:10, label:"2 HP · 0 DEF · Marchiato" }),
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"approve", side:"left", text:"Il bersaglio è ancora vivo, ha costo 2, 2 HP e conserva il Marchio. Tutte le condizioni della Clausola di Acquisizione sono ora leggibili sulla mappa." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"select-fabeot-citadel",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"FBPIV01" }), padding:10, label:"Cittadella Fabeot" }),
        focus:true,
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"stern", side:"left", text:"Seleziona la Cittadella Fabeot." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Seleziona la Cittadella Fabeot."
      }),
      Object.freeze({
        id:"activate-acquisition-clause",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:"#selectedUnitPrimaryAbilitySlot [data-unit-action=\"ability\"]" }), padding:8, label:"Clausola di Acquisizione" }),
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"stern", side:"right", text:"Attiva Clausola di Acquisizione. Costa 4 ENE e converte un bersaglio valido già marchiato." }),
        completeOn:Object.freeze({ kind:"click" }),
        wrongActionText:"Attiva Clausola di Acquisizione."
      }),
      Object.freeze({
        id:"convert-marked-fante",
        mode:"locked",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:2, blueprintId:"NXC1F01" }), padding:10, label:"Fante Robot acquisibile" }),
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"stern", side:"left", text:"Converti il Fante Robot marchiato." }),
        completeOn:Object.freeze({ kind:"event", event:"UNIT_CONVERTED", match:Object.freeze({ unitName:"Fante Robot", oldSide:2, newSide:1 }) }),
        wrongActionText:"Usa la Clausola sul Fante Robot marchiato."
      }),
      Object.freeze({
        id:"fabeot-conversion-resolved",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"NXC1F01" }), padding:10, label:"Fante Robot convertito" }),
        checkpoint:true,
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"approve", side:"right", text:"Il Fante Robot è passato sotto controllo Fabeot. Entra esausto e con Inibizione Azione: la conversione è permanente, ma non concede un’azione immediata." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"inspect-fabeot-contracts",
        mode:"informative",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:"#mapHandOverlay .mapHandOverlayCards" }), padding:8, label:"Contratti Fabeot" }),
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"explain", side:"left", text:"Ora controlla le risorse dell’avversario. Embargo blocca una carta per ogni Punto Strategico Fabeot; Contratto di Usura sottrae 1 ENE e riduce l’entrata di 1 per due turni." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"play-fabeot-embargo",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"TACTIC:FABTAC07" }), padding:8, label:"Embargo" }),
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"stern", side:"right", text:"Gioca Embargo. L’Avamposto presidia un Punto Strategico e la Mano Nexus contiene una sola carta: il risultato è deterministico." }),
        completeOn:Object.freeze({ kind:"event", event:"TACTIC_USED", match:Object.freeze({ player:1, tacticId:"FABTAC07" }) }),
        wrongActionText:"Gioca Embargo."
      }),
      Object.freeze({
        id:"fabeot-embargo-resolved",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"FB4B01" }), padding:10, label:"1 PS controllato" }),
        checkpoint:true,
        focus:true,
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"approve", side:"left", text:"Embargo ha bloccato l’unica carta Nexus per un turno. Il numero di carte colpite deriva dai Punti Strategici controllati, non da una scelta nascosta." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"play-fabeot-usury",
        mode:"locked",
        uiState:Object.freeze({ hand:"open" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"card", side:1, cardId:"TACTIC:FABTAC09" }), padding:8, label:"Contratto di Usura" }),
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"stern", side:"right", text:"Gioca Contratto di Usura per disturbare il deposito e le prossime entrate ENE del Nexus." }),
        completeOn:Object.freeze({ kind:"event", event:"TACTIC_USED", match:Object.freeze({ player:1, tacticId:"FABTAC09" }) }),
        wrongActionText:"Gioca Contratto di Usura."
      }),
      Object.freeze({
        id:"fabeot-usury-resolved",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"selector", selector:"#p2Score" }), padding:8, label:"ENE Nexus disturbata" }),
        checkpoint:true,
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"approve", side:"left", text:"Il deposito Nexus è sceso da 5 a 4 ENE e subirà -1 ENE alle prossime due entrate. Mano, territorio e risorse sono tre leve distinte dello stesso controllo Fabeot." }),
        completeOn:Object.freeze({ kind:"next" })
      }),
      Object.freeze({
        id:"fabeot-lesson-complete",
        mode:"informative",
        uiState:Object.freeze({ hand:"collapsed" }),
        spotlight:Object.freeze({ target:Object.freeze({ type:"unit", side:1, blueprintId:"NXC1F01" }), padding:10, label:"Acquisizione completata" }),
        message:Object.freeze({ speaker:"Narratore Fabeot", portraitSet:"tutorial-fabeot", expression:"approve", side:"right", text:"Lezione completata. Hai applicato un Marchio di Vulnerabilità, preparato e convertito il bersaglio, bloccato la Mano nemica e disturbato il flusso ENE senza affidarti al caso." }),
        completeOn:Object.freeze({ kind:"next" })
      })
    ])
  })
});

function tutorialScenarioAuditF9O6() {
  const errors = [];
  const warnings = [];
  const plan = typeof TUTORIAL_LESSON_PLAN_F9O6 !== "undefined" ? TUTORIAL_LESSON_PLAN_F9O6 : [];
  const scenarios = typeof TUTORIAL_SCENARIOS_F9O6 !== "undefined" ? TUTORIAL_SCENARIOS_F9O6 : {};
  const portraits = typeof TUTORIAL_PORTRAIT_MANIFEST_F9O6 !== "undefined" ? TUTORIAL_PORTRAIT_MANIFEST_F9O6 : {};
  const expectedFactions = ["Exordium", "Nexus", "Agathoi", "Liberti", "Fabeot"];
  if (!Array.isArray(plan) || plan.length !== 5) errors.push(`Piano lezioni ${Array.isArray(plan) ? plan.length : 0}/5.`);
  const lessonIds = new Set();
  for (const lesson of plan || []) {
    if (!lesson || !lesson.id || !lesson.title || !lesson.narratorFaction || !lesson.summary) errors.push("Lezione pianificata incompleta.");
    if (lesson && lessonIds.has(lesson.id)) errors.push(`ID lezione duplicato: ${lesson.id}.`);
    if (lesson && lesson.id) lessonIds.add(lesson.id);
  }
  for (const faction of expectedFactions) if (!(plan || []).some(item => item && item.narratorFaction === faction)) errors.push(`Narratore ${faction} assente dal piano.`);
  if (Object.keys(portraits).length !== 5) errors.push(`Set ritratti ${Object.keys(portraits).length}/5.`);
  for (const [portraitKey, portrait] of Object.entries(portraits)) {
    const frames = portrait && portrait.frames || {};
    for (const expression of ["neutral", "explain", "approve", "warning", "stern"]) {
      if (!frames[expression]) errors.push(`Set ritratto ${portraitKey}: frame ${expression} assente.`);
    }
  }
  const validModes = new Set(["informative", "guided", "locked"]);
  const validTargets = new Set(["selector", "ui", "card", "unit", "hex", "hq", "ps"]);
  const forbiddenPlayerTerms = /\b(build|versione|update|aggiornamento|sviluppo|debug|placeholder|milestone|runtime|test)\b/i;
  for (const [scenarioId, scenario] of Object.entries(scenarios)) {
    if (!scenario || scenario.id !== scenarioId || Number(scenario.schemaVersion) !== 1) errors.push(`Scenario ${scenarioId}: identità/schema non valido.`);
    if (!scenario.setup || scenario.setup.pacePreset !== "competitive" || scenario.setup.gameScaleMode !== "tactical") errors.push(`Scenario ${scenarioId}: default Rapida/Tattica non rispettato.`);
    if (!Array.isArray(scenario.steps) || !scenario.steps.length) errors.push(`Scenario ${scenarioId}: passi assenti.`);
    const stepIds = new Set();
    for (const step of scenario.steps || []) {
      if (!step || !step.id || !validModes.has(step.mode)) errors.push(`Scenario ${scenarioId}: passo incompleto o mode non valido.`);
      if (step && stepIds.has(step.id)) errors.push(`Scenario ${scenarioId}: step ID duplicato ${step.id}.`);
      if (step && step.id) stepIds.add(step.id);
      if (!step.completeOn || !["next", "click", "event", "action"].includes(step.completeOn.kind)) errors.push(`Scenario ${scenarioId}/${step && step.id}: completeOn non valido.`);
      const handState = step && step.uiState && step.uiState.hand;
      if (handState && !["open", "collapsed", "preserve"].includes(handState)) errors.push(`Scenario ${scenarioId}/${step && step.id}: uiState.hand non valido ${handState}.`);
      if (step && step.mode === "locked" && !handState) warnings.push(`Scenario ${scenarioId}/${step.id}: passo vincolato senza contratto Mano esplicito.`);
      const target = step && step.spotlight && step.spotlight.target;
      if (target && !validTargets.has(target.type)) errors.push(`Scenario ${scenarioId}/${step.id}: target spotlight non valido ${target.type}.`);
      for (const allowed of step && step.allowedTargets || []) if (!validTargets.has(allowed.type)) errors.push(`Scenario ${scenarioId}/${step.id}: allowedTarget non valido ${allowed.type}.`);
      if (step && step.message && !step.message.portraitSet) warnings.push(`Scenario ${scenarioId}/${step.id}: vignetta senza portraitSet.`);
      if (step && step.message && forbiddenPlayerTerms.test(String(step.message.text || ""))) errors.push(`Scenario ${scenarioId}/${step.id}: testo giocatore contiene linguaggio estraneo a regole e gameplay.`);
    }
  }
  const lesson = scenarios["lesson-1-exordium"];
  if (!lesson) errors.push("Lezione 1 Exordium assente.");
  else {
    const hand = lesson.setup && lesson.setup.hand && lesson.setup.hand[1];
    if (!Array.isArray(hand) || hand.length !== 2 || !hand.includes("UNIT:EXC1F01") || !hand.includes("UNIT:EX1B04")) errors.push("Lezione 1: mano iniziale non conforme.");
    if (lesson.setup.starterCardsEnabled !== false) errors.push("Lezione 1: Starter devono essere disattivati.");
    const requiredEvents = ["UNIT_SPAWNED", "TURN_ENDED", "UNIT_ATTACKED", "UNIT_DESTROYED", "TACTIC_USED"];
    for (const type of requiredEvents) if (!(lesson.steps || []).some(step => step.completeOn && step.completeOn.kind === "event" && step.completeOn.event === type)) errors.push(`Lezione 1: evento ${type} non coperto.`);
    if (!(lesson.steps || []).some(step => step.checkpoint === true)) errors.push("Lezione 1: checkpoint assente.");
    const commands = (lesson.steps || []).flatMap(step => step.onEnter || []).map(item => item.action);
    for (const action of ["spawn_unit", "grant_card", "pass_turn", "script_attack_and_end_turn"]) if (!commands.includes(action)) errors.push(`Lezione 1: comando ${action} non utilizzato.`);
  }
  const nexusLesson = scenarios["lesson-2-nexus"];
  if (!nexusLesson) errors.push("Lezione 2 Nexus assente.");
  else {
    const hand = nexusLesson.setup && nexusLesson.setup.hand && nexusLesson.setup.hand[1];
    if (!Array.isArray(hand) || hand.length !== 1 || !hand.includes("UNIT:NXC1F03")) errors.push("Lezione 2: Mano iniziale Avanguardia non conforme.");
    if (nexusLesson.setup.starterCardsEnabled !== true) errors.push("Lezione 2: riserva Starter deve essere attiva.");
    const requiredEvents = ["UNIT_SPAWNED", "UNIT_BUILT", "UNIT_MOVED", "TURN_ENDED", "PS_CONTROL_CHANGED"];
    for (const type of requiredEvents) if (!(nexusLesson.steps || []).some(step => step.completeOn && step.completeOn.kind === "event" && step.completeOn.event === type)) errors.push(`Lezione 2: evento ${type} non coperto.`);
    if ((nexusLesson.steps || []).filter(step => step.checkpoint === true).length < 2) errors.push("Lezione 2: checkpoint insufficienti.");
    const commands = (nexusLesson.steps || []).flatMap(step => step.onEnter || []).map(item => item.action);
    for (const action of ["pass_turn", "relocate_unit"]) if (!commands.includes(action)) errors.push(`Lezione 2: comando ${action} non utilizzato.`);
  }
  const agathoiLesson = scenarios["lesson-3-agathoi"];
  if (!agathoiLesson) errors.push("Lezione 3 Agathoi assente.");
  else {
    const hand = agathoiLesson.setup && agathoiLesson.setup.hand && agathoiLesson.setup.hand[1];
    const expectedHand = ["TACTIC:AGTAC07", "TACTIC:AGTAC05", "TACTIC:AGTAC04", "TACTIC:AGTAC08"];
    if (!Array.isArray(hand) || expectedHand.some(cardId => !hand.includes(cardId))) errors.push("Lezione 3: Mano difensiva non conforme.");
    if (agathoiLesson.setup.starterCardsEnabled !== false) errors.push("Lezione 3: Starter devono essere disattivati.");
    const requiredEvents = ["TACTIC_USED", "TURN_ENDED", "UNIT_DESTROYED"];
    for (const type of requiredEvents) if (!(agathoiLesson.steps || []).some(step => step.completeOn && step.completeOn.kind === "event" && step.completeOn.event === type)) errors.push(`Lezione 3: evento ${type} non coperto.`);
    if ((agathoiLesson.steps || []).filter(step => step.checkpoint === true).length < 3) errors.push("Lezione 3: checkpoint insufficienti.");
    const commands = (agathoiLesson.steps || []).flatMap(step => step.onEnter || []).map(item => item.action);
    for (const action of ["spawn_unit", "script_attack_and_end_turn"]) if (!commands.includes(action)) errors.push(`Lezione 3: comando ${action} non utilizzato.`);
    for (const tacticId of ["AGTAC07", "AGTAC05", "AGTAC04"]) if (!(agathoiLesson.steps || []).some(step => step.completeOn && step.completeOn.event === "TACTIC_USED" && step.completeOn.match && step.completeOn.match.tacticId === tacticId)) errors.push(`Lezione 3: tattica ${tacticId} non coperta.`);
  }
  const libertiLesson = scenarios["lesson-4-liberti"];
  if (!libertiLesson) errors.push("Lezione 4 Liberti assente.");
  else {
    const hand = libertiLesson.setup && libertiLesson.setup.hand && libertiLesson.setup.hand[1];
    const expectedHand = ["TACTIC:LBTAC08", "TACTIC:LBTAC14", "TACTIC:LBTAC05", "TACTIC:LBTAC09"];
    if (!Array.isArray(hand) || expectedHand.some(cardId => !hand.includes(cardId))) errors.push("Lezione 4: Mano tattica Liberti non conforme.");
    if (libertiLesson.setup.starterCardsEnabled !== false) errors.push("Lezione 4: Starter devono essere disattivati.");
    const choices = (libertiLesson.steps || []).filter(step => step.completeOn && step.completeOn.kind === "action" && step.completeOn.action === "card_selected");
    for (const cardId of ["TACTIC:LBTAC08", "TACTIC:LBTAC14"]) if (!choices.some(step => step.completeOn.match && step.completeOn.match.cardId === cardId)) errors.push(`Lezione 4: scelta carta ${cardId} non coperta.`);
    const requiredEvents = ["TACTIC_USED", "UNIT_ATTACKED", "TURN_ENDED", "PS_CONTROL_CHANGED"];
    for (const type of requiredEvents) if (!(libertiLesson.steps || []).some(step => step.completeOn && step.completeOn.kind === "event" && step.completeOn.event === type)) errors.push(`Lezione 4: evento ${type} non coperto.`);
    if ((libertiLesson.steps || []).filter(step => step.checkpoint === true).length < 2) errors.push("Lezione 4: checkpoint insufficienti.");
    const commands = (libertiLesson.steps || []).flatMap(step => step.onEnter || []).map(item => item.action);
    for (const action of ["spawn_unit", "pass_turn"]) if (!commands.includes(action)) errors.push(`Lezione 4: comando ${action} non utilizzato.`);
  }
  const fabeotLesson = scenarios["lesson-5-fabeot"];
  if (!fabeotLesson) errors.push("Lezione 5 Fabeot assente.");
  else {
    const hand = fabeotLesson.setup && fabeotLesson.setup.hand && fabeotLesson.setup.hand[1];
    const enemyHand = fabeotLesson.setup && fabeotLesson.setup.hand && fabeotLesson.setup.hand[2];
    const expectedHand = ["TACTIC:FABTAC07", "TACTIC:FABTAC09", "TACTIC:FABTAC04", "TACTIC:FABTAC03"];
    if (!Array.isArray(hand) || expectedHand.some(cardId => !hand.includes(cardId))) errors.push("Lezione 5: Mano contratti Fabeot non conforme.");
    if (!Array.isArray(enemyHand) || enemyHand.length !== 1 || enemyHand[0] !== "UNIT:NXC1F03") errors.push("Lezione 5: Mano Nexus deterministica non conforme.");
    if (fabeotLesson.setup.starterCardsEnabled !== false) errors.push("Lezione 5: Starter devono essere disattivati.");
    if (Number(fabeotLesson.setup.energy && fabeotLesson.setup.energy[2]) !== 5) errors.push("Lezione 5: deposito ENE Nexus iniziale non conforme.");
    const requiredEvents = ["ABILITY_USED", "UNIT_ATTACKED", "UNIT_CONVERTED", "TACTIC_USED"];
    for (const type of requiredEvents) if (!(fabeotLesson.steps || []).some(step => step.completeOn && step.completeOn.kind === "event" && step.completeOn.event === type)) errors.push(`Lezione 5: evento ${type} non coperto.`);
    for (const tacticId of ["FABTAC07", "FABTAC09"]) if (!(fabeotLesson.steps || []).some(step => step.completeOn && step.completeOn.event === "TACTIC_USED" && step.completeOn.match && step.completeOn.match.tacticId === tacticId)) errors.push(`Lezione 5: tattica ${tacticId} non coperta.`);
    if ((fabeotLesson.steps || []).filter(step => step.checkpoint === true).length < 4) errors.push("Lezione 5: checkpoint insufficienti.");
    const commands = (fabeotLesson.steps || []).flatMap(step => step.onEnter || []).map(item => item.action);
    if (!commands.includes("spawn_unit")) errors.push("Lezione 5: comando spawn_unit non utilizzato.");
  }
  return { ok:errors.length === 0, lessons:plan.length, scenarios:Object.keys(scenarios).length, portraitSets:Object.keys(portraits).length, errors, warnings };
}
