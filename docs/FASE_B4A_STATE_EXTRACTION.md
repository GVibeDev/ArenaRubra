# Arena Rubra – Fase B4a State Extraction

## Obiettivo

Separare la base dello stato dal file principale, senza toccare regole, AI, combattimento o economia.

## File reso operativo

- `src/state.js`

## Spostato in `state.js`

- `state`
- `selectedId`
- `mode`
- `pendingAbility`
- `pendingBuildBlueprintId`
- `pendingPurchaseBlueprintId`
- `pendingTacticId`
- `botRunning`
- `$`
- `sleep`
- `createMatchId`
- `readGameSetupFromDom`
- `createInitialGameState`
- `resetInteractionContext`
- `createHq`
- `createUnitFromBlueprint`

## Modifica a `newGame`

`newGame()` ora costruisce lo stato tramite:

```js
const setup = readGameSetupFromDom();
state = createInitialGameState({ ...setup, firstPlayer });
resetInteractionContext();
```

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio combat/economia/stati/render.
Solo spostamento della creazione dello stato e delle factory base.

## Prossimo step possibile

B4b:
- estrarre `rules.js` con helper generici tipo `enemyOf`, `playerName`, `getCellAt`, `combatUnits`;
- oppure B4a-hotfix se il browser segnala regressioni.
