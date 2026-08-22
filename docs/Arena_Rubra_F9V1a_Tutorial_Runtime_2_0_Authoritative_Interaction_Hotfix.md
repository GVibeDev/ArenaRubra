# Arena Rubra — F9V1a Tutorial Runtime 2.0 · Authoritative Interaction Hotfix

## Identità build

- Versione candidata: `C2-STABLE-1-F9V1a-APK-M4c`
- Base tecnica GitHub: `C2-STABLE-1-F9T2d3-APK-M4c`
- Commit base GitHub `main`: `05509e2209af3b325f3bef1d6f4e4bfb2094f4bb`
- Baseline logica ufficiale preservata: `C2-STABLE-1-F9T2c4-APK-M4c`
- Scope: consolidamento Starter 2.0 — Tutorial Runtime P0

## Difetti corretti

### Selector drift della UI
Gli scenari tutorial storici puntavano a controlli sostituiti dalla riorganizzazione HUD:

- `.mapHandShowBtn` → `#mapActionDock .mapLeftHandBtn`
- `.mapHandEndTurnBtn` → `.mapLeftEndTurnBtn`
- `#actionPanel [data-unit-action="ability"]` → `#selectedUnitPrimaryAbilitySlot [data-unit-action="ability"]`

Questo drift rendeva verdi diversi audit statici ma interrompeva i percorsi browser reali.

### Contratto di interazione autorevole
È stato introdotto `tutorialRuntimeGateInteraction(action, data)`.

Durante un tutorial attivo il runtime ricava l'interazione attesa dallo step corrente e impedisce alle azioni utente non previste di raggiungere una mutazione dello stato.

Interazioni coperte in questa hotfix:

- selezione carta;
- click unità;
- click cella;
- attivazione abilità;
- selezione movimento;
- selezione costruzione;
- tattica starter;
- passaggio azione unità;
- fine turno manuale.

Gli step `informative` bloccano le interazioni di gameplay e lasciano attivi i controlli del dialogo. Gli step `locked/guided` consentono soltanto l'interazione prevista dal contratto dello step.

I turni interni deterministici dello scenario (`auto`, `bot`, `tutorial_script`) restano autorizzati: non sono input del giocatore e sono necessari alla regia delle lezioni esistenti.

## Diagnostica

`tutorialRuntimeDiagnostics()` espone ora anche `expectedInteraction`, così un blocco o un drift futuro può essere diagnosticato senza dedurre il contratto dal DOM.

## Compatibilità preservata

Nessuna modifica intenzionale a:

- carte, costi o bilanciamento;
- deck o Missioni;
- mappe o terreni;
- Advanced AI / Expert AI;
- telemetria `F9Q3e1-2`;
- contratto Expert `F9T1-1` / estensione `F9T2d3-1`;
- logica F9T2c4 sullo stato autorevole;
- riorganizzazione del Pool carte.

Android resta fuori dal gate Starter 2.0 secondo la nuova matrice di consolidamento.

## Verifiche eseguite

- syntax check JS `src/ + data/`: **94/94 PASS**;
- suite Node completa: **90/90 PASS**;
- smoke browser F9V1a Authoritative Tutorial: **PASS**;
- Lezione 1 Exordium completa: **PASS**, errori pagina/console 0;
- Lezione 2 Nexus completa: **PASS**, errori pagina/console 0;
- Lezione 3 Agathoi completa: **PASS**, errori pagina/console 0;
- Lezione 4 Liberti completa: **PASS**, errori pagina/console 0;
- Lezione 5 Fabeot completa: **PASS**, errori pagina/console 0;
- checkpoint/resume, UI-state resume, guidance e adaptive framing: **PASS** nei test mirati eseguiti durante lo sviluppo della patch.

Lo smoke autorevole verifica inoltre che:

1. durante uno step informativo un Fine turno manuale sia respinto senza cambiare turno, ENE o unità;
2. una carta diversa da quella richiesta sia respinta senza alterare ENE o pending state;
3. una cella di sbarco diversa da quella richiesta sia respinta anche se legalmente utilizzabile dal normale gameplay;
4. l'interazione corretta proceda e completi normalmente lo step.

## Gate di validazione manuale

Questa patch stabilizza il runtime, ma non espande ancora testi e struttura didattica. Prima di passare a F9V1b/F9V2 è richiesto un giro manuale delle cinque lezioni sulla build sovrascritta, verificando in particolare che durante ogni step sia cliccabile/azionabile soltanto l'obiettivo indicato e che non ricompaiano conflitti di stato.
