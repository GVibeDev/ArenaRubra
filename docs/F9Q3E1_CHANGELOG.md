# Arena Rubra — F9Q3e1 Match Telemetry Foundation

## Build candidata

- Versione: `C2-STABLE-1-F9Q3e1-APK-M4c`
- Nome: **Match Telemetry Foundation**
- Canale: `f9q3e1-candidate`
- Baseline logica validata: `C2-STABLE-1-F9S1c1-APK-M4c`
- Schema telemetrico: `F9Q3e1-1`
- RNG match: `mulberry32`

La baseline F9S1c1 non è stata modificata. Non sono stati cambiati carte, 50 deck ufficiali, mappe, valori, soglie, regole FFA o priorità IA.

## Nuovo record telemetrico

Ogni partita crea ora un record strutturato all’avvio e lo chiude al termine. Il record contiene:

- ID partita, versione build, schema, data e durata;
- seed riproducibile e stato/numero chiamate RNG;
- modalità, mappa, scala, ritmo, ordine dei giocatori e iniziativa;
- identità completa di ogni deck: chiave, nome, fazione, Comandante, Pivot, Missione, archetipo, quantità carte, ENE media e composizione;
- esito finale, vincitore, causa, round, PS, Pressione, ENE, unità e stato dei giocatori.

## RNG riproducibile

Il gameplay casuale usa un seed esplicito per:

- scelta dell’iniziativa casuale;
- mescolamento del deck;
- selezioni casuali su mano, pool o effetti delle tattiche.

Lo stesso seed, con lo stesso Setup e la stessa sequenza di azioni, ricrea iniziativa e ordine delle carte. Audio, rumore sintetico e generazione dell’ID partita restano fuori dal RNG competitivo.

## Economia ENE

Per ciascun giocatore vengono raccolti:

- ENE iniziale;
- entrate totali e per provenienza: income, PS, carte, abilità, Missioni e altre fonti;
- spesa totale e per unità, strutture, tattiche, abilità e Missioni;
- ENE persa, rubata e bloccata;
- penalità all’income;
- ENE inutilizzata a fine turno, totale e media.

## Carte e qualità della mano

Vengono registrati:

- carte pescate, giocate, scartate, rubate, bloccate e perse per overdraw;
- esaurimenti e recuperi del deck;
- dimensione massima della mano;
- contatori per singola carta e round della prima pesca/prima giocata;
- turni senza carte giocate;
- turni con vera mano morta, cioè senza alcuna carta legalmente giocabile;
- turni con carte giocabili presenti ma non utilizzate.

## Campo, Pivot, Missioni e combattimento

Il record include:

- unità schierate, strutture costruite, variazioni di controllo PS e incrementi di Pressione;
- round di pesca, schieramento e distruzione della Pivot;
- sopravvivenza, danni, attacchi e abilità della Pivot;
- progresso, prontezza, gioco, completamento e ricompensa della Missione;
- attacchi, abilità, tattiche, danni a DEF/HP, kill, assist, perdite ed eliminazioni giocatore;
- durata totale, media e massima dei turni misurati.

## Persistenza e consultazione

- La telemetria completa viene inclusa nel record dello storico locale della partita.
- È disponibile una copia JSON dello snapshot corrente.
- Il Match Log testuale include seed, algoritmo RNG, numero chiamate e versione dello schema.
- Il pannello Statistiche mostra un riepilogo compatto per giocatore con deck, ENE, pesca, mani morte, Pivot e Missione.

## File principali

- Nuovo: `src/match_telemetry.js`
- Aggiornati: `src/state.js`, `src/game.js`, `src/deck.js`, `src/tactics.js`, `src/events.js`, `src/turns.js`, `src/stats.js`, `src/render.js`, `src/ui.js`, `src/build_info.js`, `index.html`, `README.md`
- Test nuovi: `tests/f9q3e1_match_telemetry_foundation_smoke.js`, `tests/f9q3e1_browser_match_telemetry_smoke.py`

## Fuori ambito

F9Q3e1 non include ancora:

- dashboard aggregata fra molte partite;
- export CSV del campione complessivo;
- filtri statistici per deck/mappa/avversario;
- Benchmark Runner automatico;
- bilanciamento dei 50 deck;
- collaudo APK Android fisico.

Queste aree appartengono a F9Q3e2 e F9Q3e3 o al successivo ciclo di bilanciamento.
