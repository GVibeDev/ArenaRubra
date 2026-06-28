# Arena Rubra – C2e-3a Bot Deck Cycle / Last Card Hotfix

## Obiettivo

Evitare un deadlock AI emerso nei test lunghi: bot con deck vuoto, scarti disponibili per il recupero deck e una sola carta unità giocabile in mano che non viene giocata perché lo scoring normale o la riserva ENE la penalizzano.

## Regola AI introdotta

Quando il bot ha:

- deck vuoto;
- una sola carta non bloccata in mano;
- quella carta è una unità giocabile;
- scarti sufficienti per il recupero deck;
- ENE sufficiente per giocarla;

allora la carta riceve priorità molto alta, così la mano si libera e al turno/controllo successivo può partire il recupero deck.

## Eccezione

La priorità è sospesa se esiste una minaccia immediata di vittoria nemica sul QG e la giocata non contribuisce alla difesa del QG. In quel caso la riserva ENE/difesa resta prioritaria.

## Non modificato

- Nessun costo carta.
- Nessuna stat.
- Nessun effetto.
- Nessuna meccanica di recupero deck.
- Nessun cambio ai cap strutture.
- Nessun cambio ai comandanti.

## File principali

- `src/ai.js`
- `src/game.js`
- `src/constants.js`
- `data/cards_base.js`
