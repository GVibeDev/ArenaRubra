# Arena Rubra – C1a Card/Deck/Hand Data Foundation

## Obiettivo

Preparare la fondazione dati per carte, deck e mano senza cambiare il gameplay dello Starter Game ALPHA.

## File nuovi

- `data/cards_base.js`
- `src/cards.js`
- `src/deck.js`

## File modificati

- `src/state.js`
- `src/game.js`
- `src/precheck.js`
- `index.html`

## Cosa viene aggiunto allo state

- `state.cardCatalog`
- `state.deck`
- `state.hand`
- `state.discard`
- `state.starterCards`
- `state.cardDebug`

## Modalità

`debug_passive`.

Il deck e la mano vengono inizializzati a `newGame`, ma non modificano ancora il gameplay reale.

## Regola di sicurezza

- Non cambia UI.
- Non rimuove il mercato.
- Non trasforma ancora le tattiche in carte giocabili dalla mano.
- Non cambia AI.
- Non cambia economia.
- Non cambia condizioni di vittoria.
- Non cambia mappe.
- Non aggiunge stati.
- Non aggiunge sottofazioni.

## Console helper utili

- `buildCardCatalog()`
- `cardDebugSummary()`
- `cardZoneDebugSummary()`
- `drawCards(side, count)`
- `discardCard(side, cardUid)`

## Test consigliati

- `newGame`
- `runPrecheck()`
- `cardDebugSummary()`
- `cardZoneDebugSummary()`
- controllo `state.deck`
- controllo `state.hand`
- controllo `state.discard`
- bot vs bot
- human vs bot
