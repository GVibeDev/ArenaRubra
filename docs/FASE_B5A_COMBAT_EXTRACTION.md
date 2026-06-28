# Arena Rubra – Fase B5a Combat Extraction

## Obiettivo

Spostare in `src/combat.js` il blocco di combattimento, senza cambiare gameplay.

## File reso operativo

- `src/combat.js`

## Funzioni estratte

- `handleUnitDestroyed`
- `adjacentAttackTargets`
- `effectiveAtt`
- `numericalSuperiorityBonus`
- `effectiveThorns`
- `applyDamage`
- `attackUnit`
- `canAttack`
- `vehicleHasFollowupAfterAttack`
- `shouldEndAfterAttack`
- `canBleed`
- `applyBleed`

## Copertura della fase

Questa fase riguarda:

- attacco base;
- calcolo ATT effettivo;
- superiorità numerica Liberti;
- applicazione danni;
- distruzione unità;
- Spine;
- sanguinamento applicato da attacco Liberti;
- follow-up attacco/veicoli.

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio economia.
Nessun cambio abilità.
Nessun cambio rendering.
Solo spostamento fisico delle funzioni combat.

## Dipendenze ancora globali

`combat.js` usa ancora funzioni definite in altri moduli o ancora in `main.js`, tra cui:

- `getStatus`
- `applyStatus`
- `statusBlocks`
- `canAct`
- `triggerLogisticChoke`
- `psBonusValue`
- `attackAuraBonus`
- `defenseAuraBonus`
- `agathoiStructureAdjacencyDefBonus`
- `isUntargetableTo`
- `abilityTargets`
- `canUseAbility`
- `addPlayerEffect`

Sono dipendenze accettate in questa fase perché il progetto usa ancora script browser non-module.

## Prossimo step consigliato

B5b – Status extraction:

- `getStatus`
- `hasStatus`
- `statusBlocks`
- `applyStatus`
- `statusText`
- tick status/durate
- eventuali helper stati.
