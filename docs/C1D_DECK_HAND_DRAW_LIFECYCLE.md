# Arena Rubra – C1d Deck/Hand Draw Lifecycle Foundation

## Obiettivo

Introdurre la pesca automatica da deck a mano nel ciclo turno, senza rendere ancora giocabili le carte in mano.

## Modificati

- `data/cards_base.js`
- `src/deck.js`
- `src/turns.js`
- `src/game.js`
- `src/render.js`
- `index.html`
- `README.md`
- `docs/`

## Nuove funzioni

In `src/deck.js`:

- `cardZoneCounts`
- `syncCardDebugState`
- `drawCardForTurn`

## Regole C1d

- Mano iniziale: 5 carte.
- Deck iniziale: 30 carte meno mano iniziale, quindi 25.
- Pesca per turno: 1 carta.
- Primo `startTurn(first=true)`: non pesca extra.
- Turni successivi: pesca 1 carta.
- Deck vuoto: nessun crash, log dedicato.
- Nessun reshuffle scarti → deck.
- Nessun limite massimo mano per ora.

## Non modificato

- mano ancora non giocabile;
- carte non consumate dalla mano;
- tattiche non ancora collegate alla mano;
- AI non adattata al deck;
- mercato vecchio ancora presente;
- starter cards operative come in C1c;
- economia invariata;
- combattimento invariato;
- condizioni vittoria invariate.

## Test consigliati

- nuova partita;
- all'avvio: deck 25, mano 5;
- primo startTurn iniziale: nessuna pesca extra;
- turno successivo: deck 24, mano 6 per il giocatore che comincia il turno;
- log pesca visibile;
- `cardZoneDebugSummary()` coerente;
- starter cards ancora funzionanti;
- mercato vecchio ancora funzionante;
- bot vs bot;
- human vs bot;
- `runPrecheck()`;
- nessun errore console.
