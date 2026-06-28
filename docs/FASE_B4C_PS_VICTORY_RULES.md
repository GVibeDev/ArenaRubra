# Arena Rubra – Fase B4c PS/QG/Victory Rules

## Obiettivo

Rendere `src/rules.js` un modulo reale, spostando helper generali e regole legate a PS/QG/vittoria.

## Spostato in `src/rules.js`

### Helper generali

- `getSelectedUnit`
- `getCellAt`
- `isFieldUnit`
- `getUnitAt`
- `getHq`
- `combatUnits`
- `activeCombatUnits`
- `hasAnyCombatUnits`
- `structureBlueprintFor`
- `blueprintById`
- `enemyOf`
- `factionMeta`
- `factionMetaBySide`
- `playerName`
- `effectiveLife`
- `isInsideMap`

### PS / QG / vittoria

- `isPsLocked`
- `addPsLock`
- `tickPsLocksAtStart`
- `updateControlFromOccupants`
- `removeDeadControl`
- `countControlledPS`
- `resolveEndOfRound`
- `resolveRoundLimit`
- `maybeAutoResign`
- `concedeMatch`
- `setWinner`
- `inferWinnerSide`
- `inferWinType`
- `checkVictory`

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio combat/economia/stati/abilità/render.
Solo spostamento fisico delle funzioni.

## Nota

`setWinner()` continua a chiamare `recordMatchResult()` e `renderMatchupStats()`.
Queste dipendenze restano globali in questa fase, perché il progetto usa ancora script browser non-module.

## Prossimo step possibile

B4d:
- estrarre `stats.js` con localStorage, CSV e registro matchup;

oppure B5a:
- iniziare `combat.js` con funzioni di danno/attacco.
