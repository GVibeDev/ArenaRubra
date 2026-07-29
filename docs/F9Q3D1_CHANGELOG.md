# Arena Rubra — F9Q3d1 Changelog

## Build

- Versione: `C2-STABLE-1-F9Q3d1-APK-M4c`
- Nome: **Target Player Foundation**
- Canale: `f9q3d1-candidate`
- Baseline logica validata: `C2-STABLE-1-F9S1b1-APK-M4c`
- Data build: 2026-07-28

## Obiettivo

Rimuovere dagli effetti di livello giocatore l'assunzione implicita che esista un solo avversario. La candidata introduce una fondazione comune per selezionare esplicitamente il giocatore bersaglio quando una tattica o un'abilità agisce su ENE, mano, deck, costi o blocchi.

F9Q3d1 non modifica carte, deck, mappe, statistiche delle unità o regole di Pressione. La semantica FFA delle Missioni, le eliminazioni, gli assist e le dottrine IA storiche restano nelle milestone successive F9Q3d2–F9Q3d4.

## Nuovo modulo Target Player

È stato aggiunto `src/player_targeting.js`, responsabile di:

- enumerare gli avversari attivi del giocatore che genera l'effetto;
- escludere sempre il giocatore stesso e i giocatori eliminati;
- generare token stabili `PLAYER-<side>` separati dai bersagli unità/cella;
- applicare filtri specifici dell'effetto, evitando bersagli sui quali l'effetto non può risolversi;
- aprire un selettore esplicito per il giocatore umano nelle partite FFA;
- risolvere automaticamente l'unico avversario valido in 1v1;
- scegliere un bersaglio deterministico per i bot mediante scoring di Pressione, PS, ENE, mano, deck e utilità specifica dell'effetto;
- chiudere e pulire il targeting quando la selezione viene annullata o cambia il contesto di interazione.

Il pannello mostra per ogni avversario valido nome, fazione, ENE, PS, Pressione, carte in mano e carte nel deck.

## Tattiche migrate

### Tattiche da deck

- `EXTAC10` — **Campo statico**: sceglie il giocatore le cui abilità non gratuite vengono tassate.
- `FABTAC06` — **Contratto Capestro**: sceglie l'avversario che pesca e dal quale può essere rubata la carta appena pescata.
- `FABTAC07` — **Embargo**: sceglie la mano avversaria da bloccare.
- `FABTAC09` — **Contratto di Usura**: sceglie il giocatore che perde ENE e riceve il debuff income.

### Tattica Starter/legacy

- `FB_TAC_CONTRACT` — **Contratto Capestro** (`contractTrap`): ora usa `target:"enemy_player"` e applica il sovraccosto al giocatore scelto.

## Abilità migrate

- `FBCMD02` — **Logistica Compromessa**: pesca e possibile furto dal deck del giocatore scelto.
- `FBC1F03` — **Esproprio di Mano**: copia una carta dalla mano del giocatore scelto.
- `FBC1F04` — **Clausola di Stasi**: blocca ENE, ed eventualmente mano, del giocatore scelto.

Le abilità economiche generiche con `affects:"enemy"` e kind `incomeSwing`, `costDelta` o `incomeDelta` usano la stessa fondazione. È mantenuto un fallback a `enemyOf()` soltanto per vecchie chiamate non interattive 1v1 e test storici.

## Integrazione UI e runtime

- Le tattiche player-level non sono più trattate come effetti immediati senza bersaglio.
- Il flusso pubblico `beginHandTacticCardPlay()` apre il selettore, consuma la carta e applica l'effetto soltanto dopo una scelta valida.
- Il flusso pubblico `toggleAbilityMode()` apre lo stesso selettore e, dopo la scelta, applica costo, cooldown e fine azione ordinari.
- `clearSelection()` e il reset del contesto chiudono il pannello e cancellano il bersaglio pendente.
- Log ed eventi registrano `targetSide`, nome del giocatore e dominio `player`.
- Il targeting unità corretto in F9O7h3 resta invariato.

## Integrazione IA

- Le tattiche da mano valutano token giocatore anziché scegliere implicitamente il primo avversario.
- Le abilità Fabeot player-level valutano il bersaglio in base all'effetto concreto.
- La scelta è stabile a parità di stato e non usa casualità come fallback.
- I giocatori eliminati non entrano nel pool IA.

## File aggiunti

- `src/player_targeting.js`
- `tests/f9q3d1_target_player_foundation_smoke.js`
- `tests/f9q3d1_browser_target_player_smoke.py`

## File principali modificati

- `index.html`
- `css/style.css`
- `src/state.js`
- `src/tactics.js`
- `src/abilities.js`
- `src/economy.js`
- `src/deck.js`
- `src/controller.js`
- `src/ai.js`
- `src/build_info.js`
- `data/tactics_base.js`
- `data/units_base.js`
- `data/cards_base.js`
- `README.md`

## Compatibilità conservata

- pool completi da 40 carte e Pivot alternative F9S1b;
- asset grafici delle nuove Pivot;
- selezione dei deck custom e sincronizzazione comandante F9S1b1;
- nove mappe ufficiali e relativi sfondi;
- Pressione proporzionale e PS centrale F9R3;
- targeting FFA delle unità F9O7h3;
- tutorial, prestazioni, salvataggi e sistema mappe delle baseline precedenti.

## Esclusioni intenzionali

- Nessuna modifica alle Missioni FFA.
- Nessuna nuova regola per eliminazioni, assist o attribuzione della Pressione.
- Nessuna rimozione generale delle assunzioni `enemyOf()` nelle dottrine IA, nel ciclo eliminazioni o nelle regole storiche: saranno affrontate nelle fasi successive.
- Nessun nuovo deck ufficiale.
- Nessun test su APK Android fisico.
