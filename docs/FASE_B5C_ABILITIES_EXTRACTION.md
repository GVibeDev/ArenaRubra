# Arena Rubra – Fase B5c Abilities Extraction

## Obiettivo

Spostare in `src/abilities.js` la logica delle abilità unità, senza cambiare gameplay.

## File reso operativo

- `src/abilities.js`

## Estratto

- `ABILITY_HANDLERS`
- `isFabeotMarkedBy`
- `conversionCapAllows`
- `canConvertEnemy`
- `canCorruptLightInfantry`
- `performFabeotConversion`
- `convertEnemyUnit`
- `corruptLightInfantryUnit`
- `bestDeceptivePositioningVictim`
- `abilityDamageValue`
- `isAdjacentToAgathoiStructure`
- `isUntargetableTo`
- `targetLabel`
- `abilityLogTarget`
- `useAbility`
- `vehicleHasFollowupAfterAbility`
- `shouldEndAfterAbility`
- `abilityTargets`

## Copertura della fase

Questa fase riguarda:

- handler abilità unità;
- validazione/targeting abilità;
- conversioni/corruzioni Fabeot;
- Manto della Selva/Untargetable;
- follow-up dei veicoli dopo abilità;
- log del bersaglio abilità.

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio economia generale.
Nessun cambio tattiche.
Nessun cambio rendering.
Solo spostamento fisico della logica abilità.

## Dipendenze ancora globali

`abilities.js` usa ancora funzioni definite in altri moduli o ancora in `main.js`, tra cui:

- `applyDamage`
- `applyStatus`
- `getStatus`
- `hasStatus`
- `canUseAbility`
- `combatUnits`
- `enemyOf`
- `playerName`
- `updateControlFromOccupants`
- `effectiveLife`
- `addPlayerEffect`
- `countsAsLightCap`
- `activeLightCount`
- `lightFieldLimit`
- `isOnPS`

Sono dipendenze accettate in questa fase perché il progetto usa ancora script browser non-module.

## Prossimo step consigliato

B5d oppure B6a:

- B5d: Tactics extraction;
- B6a: Economy extraction;
- oppure B5c-hotfix se emergono regressioni.
