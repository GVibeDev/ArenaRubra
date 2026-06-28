# Arena Rubra – Fase B8a Game Lifecycle Extraction

## Obiettivo

Spostare fuori dal `main.js` il blocco di avvio partita e validazione dati.

## Nuovo modulo

- `src/game.js`

## Estratto da `main.js`

- `normalizeBlueprints`
- `capGroupForBlueprint`
- `validateDataModel`
- `newGame`
- `chooseFirstPlayer`

## Non toccato

Restano nel `main.js`:

- `startTurn`
- `endTurn`
- `postActionChecks`
- `applyStartTurnStatuses`
- `applyEndTurnStatuses`
- `applyAgathoiIdleGuardThorns`
- `handleCellClick`
- `toggleAbilityMode`
- `passUnit`
- `endUnitAction`
- `clearSelection`
- `isAttackTarget`
- `isAbilityTarget`
- UI summary residue

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio turn flow.
Solo estrazione game lifecycle.

## Test consigliati

- nuova partita human vs bot;
- nuova partita bot vs bot;
- scelta iniziativa casuale;
- scelta iniziativa forzata G1/G2;
- precheck a newGame;
- log avvio partita;
- start del primo turno;
- bot auto-start se G1/G2 è bot.
