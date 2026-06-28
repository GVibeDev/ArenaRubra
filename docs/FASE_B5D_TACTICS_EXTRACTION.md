# Arena Rubra – Fase B5d Tactics Extraction

## Obiettivo

Spostare in `src/tactics.js` la logica delle tattiche, senza cambiare gameplay.

## File reso operativo

- `src/tactics.js`

## Estratto

- `TACTIC_HANDLERS`
- `tickTacticCooldowns`
- `cleanupTurnTactics`
- `triggerLogisticChoke`
- `tacticsForFaction`
- `tacticById`
- `tacticCooldown`
- `canUseTactic`
- `toggleTacticMode`
- `isTacticTarget`
- `tacticTargets`
- `useTactic`

## Copertura della fase

Questa fase riguarda:

- handler tattiche;
- cooldown tattiche;
- uso tattiche;
- target tattiche;
- cleanup tattico di turno;
- trigger di Strozzatura Logistica.

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio economia generale.
Nessun cambio abilità unità.
Nessun cambio rendering.
Solo spostamento fisico della logica tattiche.

## Dipendenze ancora globali

`tactics.js` usa ancora funzioni definite in altri moduli o ancora in `main.js`, tra cui:

- `applyDamage`
- `applyStatus`
- `getStatus`
- `hasStatus`
- `targetLabel`
- `combatUnits`
- `enemyOf`
- `playerName`
- `addPlayerEffect`
- `isOnPS`
- `isOnOrAdjacentToAnyPS`
- `adjacentAllyOfOtherAssaultType`
- `movableCells`
- `applyAttackBuff`
- `clearSelection`
- `postActionChecks`
- `renderAll`

Sono dipendenze accettate in questa fase perché il progetto usa ancora script browser non-module.

## Prossimo step consigliato

B6a – Economy extraction:

- income;
- dottrine;
- effetti economici;
- costi effettivi;
- sconti/sovrapprezzi;
- cap economici legati al deployment.
