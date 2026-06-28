# Arena Rubra – Fase B6e / B6-final

## Obiettivo

Chiudere B6 con un cleanup prudente delle utility generali di board/ritmo/PS rimaste nel main.

## File reso operativo

- `src/board.js`

## Estratto

- `currentPace`
- `pressureStartRound`
- `paceLabel`
- `generateMap`
- `applyAttackBuff`
- `isOnPS`
- `isOnOrAdjacentToAnyPS`
- `adjacentAllyOfOtherAssaultType`
- `hqSideAt`
- `hqOccupancyText`
- `psBonusActive`
- `psBonusValue`
- `agathoiStructureAdjacencyDefBonus`

## Cosa resta nel main

Restano volutamente nel `main.js`:

- sequenza turno;
- funzioni AI;
- punteggi AI;
- scelta movimento/acquisto/build del bot;
- funzioni strategiche collegate all'AI.

Questa è la soglia corretta: l'AI diventa B7.

## Stato B6

B6 chiusa con:

- `economy.js`
- `deployment.js`
- `movement.js`
- `board.js`

più le hotfix funzionali già integrate.

## Test consigliati

- avvio nuova partita;
- cambio preset;
- movimento unità;
- acquisto/sbarco;
- costruzione strutture;
- abilità che usano PS;
- tattiche che usano PS;
- fine partita;
- CSV/statistiche.
