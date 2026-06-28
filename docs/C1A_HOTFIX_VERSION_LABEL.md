# Arena Rubra – C1a-hotfix Version Label / Debug Log Cleanup

## Obiettivo

Rendere riconoscibile la build C1a nei log partita.

## Modificato

- `src/game.js`
- `index.html`
- `README.md`
- `docs/`

## Cambiamenti

- Il log iniziale non dice più `Partita v1.8.12a avviata`.
- Il log iniziale dice ora `Arena Rubra – Starter Game ALPHA C1a avviata`.
- Il messaggio iniziale include `Card/deck/hand foundation: debug passive`.
- L'evento `GAME_STARTED` include:
  - `buildLabel: "Starter Game ALPHA C1a"`
  - `cardFoundation: state.cardDebug.mode`

## Non modificato

- gameplay;
- AI;
- turn flow;
- controller;
- mercato;
- tattiche;
- economia;
- condizioni vittoria;
- deck/hand logic.
