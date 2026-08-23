# Arena Rubra — F9V3b · Tutorial Runtime Hardening & Action Contract Closure

## Obiettivo

F9V3b chiude il blocco tecnico del Tutorial Runtime 2.0 senza introdurre nuovi contenuti didattici e senza modificare il core di Arena Rubra.

La patch parte dalla baseline validata F9V3a e consolida due punti P0:

1. l'azione richiesta dal passo Tutorial deve essere identificata semanticamente prima che il core possa mutare lo stato;
2. i pochi target UI ancora espressi come selettori CSS devono avere fallback semantici per ridurre il rischio di selector drift.

## Action Contract F9V3b-1

Il runtime introduce `TUTORIAL_ACTION_CONTRACT_F9V3B`, schema `F9V3b-1`.

Le azioni di mappa non vengono più trattate soltanto come `unit_click` / `cell_click`. Prima dell'ingresso nel mutatore vengono classificate come:

- `unit_select`;
- `move`;
- `attack`;
- `ability_toggle`;
- `ability_target`;
- `tactic_target`;
- `deploy`;
- `build`;
- `card_selected`;
- `end_turn`;
- `pass_unit`;
- `build_toggle`.

La classificazione usa lo stato runtime corrente (`mode`, unità selezionata, bersaglio, side e coordinate). In particolare, un click su un'unità nemica con una propria unità già selezionata viene classificato come `attack` anche quando la selezione ha pre-attivato la modalità movimento.

## Gate pre-mutation

F9V3b installa in modo lazy guardie sugli entrypoint di interazione già esistenti:

- `handleCellClick`;
- `endTurn`;
- `beginStarterCardPurchase`;
- `beginHandCardPlay`;
- `toggleAbilityMode`;
- `toggleBuildMode`;
- `passUnit`.

La guardia viene installata all'avvio della lezione, quando tutti gli script del core sono disponibili. Questo è necessario perché `tutorial_runtime.js` viene caricato prima di alcuni moduli gameplay.

Flusso:

1. costruzione descrittore semantico dell'azione;
2. `tutorialRuntimeGateInteraction()`;
3. se rifiutata: ritorno immediato, nessun ingresso nel mutatore;
4. se accettata: esecuzione dell'entrypoint originale;
5. soltanto durante questa esecuzione viene bypassato il vecchio gate interno duplicato.

Il bypass non autorizza una nuova azione: viene attivato esclusivamente dopo l'accettazione del gate semantico esterno.

Quando il Tutorial non è attivo, gli entrypoint eseguono direttamente il core originale senza passare dal bypass F9V3b.

## Selector drift

I target storici restano compatibili, ma il runtime associa i selettori sensibili a un'identità semantica e a una serie di fallback.

Target coperti:

- collassa Mano;
- mostra Mano;
- Fine turno;
- pulsante abilità primaria;
- area carte Mano;
- score avversario.

`tutorialRuntimeResolveTarget()` e `tutorialRuntimeResolveTargets()` provano il selettore storico e quindi i fallback registrati. Un selettore legacy non valido non interrompe più la ricerca del target semantico.

I 116 step delle cinque lezioni non vengono riscritti in F9V3b: la compatibilità è centralizzata nel runtime.

## Diagnostica

`tutorialRuntimeDiagnostics()` espone ora anche:

- `expectedSemanticInteraction`;
- `actionContract.schemaVersion`;
- entrypoint guardati;
- entrypoint effettivamente wrappati;
- entrypoint mancanti al momento dell'ultima installazione;
- numero installazioni;
- elenco azioni semantiche.

## Copertura Tutorial

Il test `f9v3b_tutorial_contract_coverage_smoke.js` analizza le cinque lezioni congelate:

- 5 scenari;
- 116 step complessivi;
- 64 step interattivi locked/guided;
- nessun contratto sconosciuto;
- nessun selettore interattivo privo di mapping.

Il test `f9v3b_tutorial_action_contract_smoke.js` verifica inoltre classificazione semantica e proprietà pre-mutation: una coordinata errata viene rifiutata prima di entrare nel mutatore; la coordinata corretta esegue il mutatore una sola volta.

## Browser gate

`f9v3b_browser_tutorial_5x5_suite.py` aggrega le suite browser esistenti per:

- Lezione 1;
- Lezione 2;
- Lezione 3;
- Lezione 4;
- Lezione 5;
- checkpoint/ripresa;
- guidance/selector regression;
- Unified Result Modal F9V3a.

La suite richiede il checkout completo del repository, Playwright e il runtime Chromium previsto dal progetto.

## Invarianti

F9V3b non modifica:

- regole QG;
- Pressione Strategica;
- condizioni di vittoria;
- AI Advanced/Expert;
- carte e costi;
- deck ufficiali;
- Missioni;
- ENE;
- mappe;
- schema telemetrico;
- statistiche competitive;
- contenuto e ordine dei 116 step;
- struttura delle cinque Challenge;
- Unified Result Modal F9V3a.

Baseline logica: `C2-STABLE-1-F9T2c4-APK-M4c`.
