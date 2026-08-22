# Arena Rubra — F9V2a
## Tutorial Challenge Framework & Unlock System

Build candidata: `C2-STABLE-1-F9V2a-APK-M4c`

Baseline logica preservata: `C2-STABLE-1-F9T2c4-APK-M4c`

Base funzionale: F9V1a validata — Tutorial Runtime 2.0 / Authoritative Interaction Hotfix.

## Obiettivo

F9V2a aggiunge il secondo livello dell'Accademia senza ancora introdurre gli scenari giocabili delle singole Challenge.

Le cinque Prove sul campo:

1. Eliminazione — solo unità; 4 unità starter nemiche in 2 ondate da 2.
2. Tenuta — unità + mano fissa; deck vuoto; PS centrale per 3 turni; 6 unità starter avversarie.
3. Breccia — unità + mano + deck da 10; occupazione del QG nemico.
4. Pressione — unità + mano + deck da 20; vittoria per Pressione.
5. Esame finale — partita normale Rapida sulla mappa Starter contro Bot Nexus.

## Contratto di unlock

Le cinque Challenge sono sempre visibili nella schermata Tutorial.

Prima del completamento delle cinque lezioni:
- tutte mostrano stato `Bloccata`;
- il pulsante di avvio è disabilitato;
- ogni card mostra la condizione di sblocco e il progresso `n/5`.

Quando tutte le cinque lezioni risultano completate:
- tutte le Challenge si sbloccano simultaneamente;
- il gate mostra `5/5` e conferma lo sblocco;
- in F9V2a il pulsante resta `In preparazione`, perché gli scenari giocabili saranno introdotti in F9V2b–F9V2f.

L'ordine delle Challenge non costituisce un gate: dopo lo sblocco potranno essere ripetute liberamente e non richiederanno completamento sequenziale.

## Persistenza

Il key storico `arenaRubra.tutorial.v1` viene preservato.

F9V2a estende il payload con `challenges:{}` senza cambiare schema e senza azzerare i progressi F9V1a/F9O7 esistenti. L'unlock è derivato ogni volta dal completamento delle cinque lezioni; non viene memorizzato come flag separato, evitando stato stale.

Ogni Challenge dispone di uno storico separato di:
- tentativi;
- completamento;
- ultimo esito;
- ultima ragione;
- timestamp di aggiornamento.

## Runtime freeplay

F9V2a introduce il contratto generico per le milestone successive:
- `tutorialRuntimeStartChallenge()`;
- `tutorialRuntimeApplyChallengeSetup()`;
- `tutorialRuntimeCompleteChallenge()`;
- `tutorialRuntimeAbortChallenge()`;
- `tutorialRuntimeChallengeDiagnostics()`.

Una Challenge attiva usa `tutorialMode=true`, `tutorialChallengeMode=true` e `matchRecorded=false`, ma non attiva il gate di interazione step-by-step F9V1a. Questo permette freeplay autonomo e mantiene le future Challenge separate dalle statistiche competitive normali.

## Fuori scope F9V2a

- Nessuna delle cinque Challenge è ancora giocabile.
- Nessun nuovo comportamento AI.
- Nessuna modifica a carte, deck, costi, Missioni, mappe, regole o bilanciamento.
- Nessuna espansione dei dialoghi delle cinque lezioni.
- Nessun lavoro Android.

## Test dedicati

- `tests/f9v2a_tutorial_challenge_framework_smoke.js`
- `tests/f9v2a_browser_challenge_unlock_smoke.py`

I test verificano il registro 5 Challenge, il gate 0/5 → 5/5, la migrazione trasparente dello storage precedente, la persistenza Challenge separata e il contratto freeplay `tutorialMode / tutorialChallengeMode / matchRecorded=false`.
