# Arena Rubra — F9V2b Tutorial Challenge I · Eliminazione

## Stato

Candidata Starter 2.0 costruita sulla milestone **F9V2a — Tutorial Challenge Framework & Unlock System**, validata manualmente prima di questo sviluppo.

Build candidata: `C2-STABLE-1-F9V2b-APK-M4c`  
Logic baseline preservata: `C2-STABLE-1-F9T2c4-APK-M4c`

## Obiettivo della milestone

F9V2b rende realmente giocabile la prima **Prova sul campo** dopo lo sblocco globale delle Challenge a 5/5 lezioni guidate completate.

La Challenge è deliberatamente più semplice di un match normale: il giocatore non dispone di carte, deck, Starter Card o acquisti. Deve gestire soltanto le unità già presenti sul campo e applicare autonomamente movimento, combattimento, scelta dei bersagli e ordine delle azioni.

## Scenario

**Prova sul campo I · Eliminazione**

- Mappa: `map1_starter` / Campo Starter.
- Giocatore: Exordium, lato 1, controllo umano.
- Avversario: Nexus, lato 2, Bot Advanced.
- Iniziativa: giocatore 1.
- ENE: bloccata a `0` per entrambi i lati.
- Mano, deck, scarti e Starter Card: vuoti/disabilitati.
- Acquisti e tattiche sostenute dall'ENE: di fatto indisponibili.
- Match marcato `tutorialMode=true`, `tutorialChallengeMode=true`, `matchRecorded=false`.

### Forza iniziale Exordium

1. `EX1B01` — Guardia di Aurex.
2. `EXC1F04` — Cursor.
3. `EXC1F05` — Carro Leggero.
4. `EX2B01` — Veicolo Ricognitore.

### Forze Nexus

Ogni ondata contiene esattamente due unità Starter Nexus:

- `NX2B01` — Droide di Sicurezza / Starter fanteria.
- `NX3B01` — Quad Ricognitore / Starter veicolo.

L'Ondata II viene generata soltanto quando entrambe le unità tracciate dell'Ondata I risultano distrutte.

## Condizioni

Successo: distruzione di **4 unità nemiche tracciate** della Challenge.

Sconfitta: tutte le quattro unità assegnate al giocatore vengono distrutte, oppure il motore conclude normalmente il match con una condizione incompatibile con l'obiettivo della Challenge.

Il conteggio usa gli UID delle unità generate dalla Challenge e non un conteggio generico delle unità Nexus presenti sul campo. Questo evita che eventuali entità estranee alterino l'obiettivo.

## Runtime e UX

F9V2b aggiunge:

- HUD dedicato `PROVA I · Eliminazione n/4 · Ondata x/2`;
- annunci per inizio Challenge e cambio ondata;
- tracciamento separato di unità del giocatore, unità nemiche, ondate avviate e abbattimenti;
- pulizia del runtime Challenge quando si torna al menu o si apre una nuova partita;
- invalidazione del bot run alla chiusura della Challenge, quando disponibile;
- persistenza di tentativi, completamento e ultimo risultato nello storage tutorial F9V2a.

## Isolamento dai dati competitivi

La Challenge resta un contenuto didattico. Non deve essere usata per analisi di bilanciamento o statistiche Player.

Il test browser dedicato verifica che `matchRecorded` resti `false`. Inoltre il sistema statistiche corrente esclude le partite con `state.tutorialMode === true`.

## Scope non modificato

F9V2b non modifica carte, costi, deck ufficiali, mappe, Missioni, regole di bilanciamento, Advanced AI, Expert AI o il contratto autorevole F9V1a delle cinque lezioni guidate.

Le Challenge II–V restano visibili secondo F9V2a ma ancora **In preparazione**.
