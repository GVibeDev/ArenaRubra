# Arena Rubra – Fase B6a Economy Helpers Extraction

## Obiettivo

Spostare in `src/economy.js` gli helper economici e i controlli di acquisto/cap, senza cambiare gameplay.

## File reso operativo

- `src/economy.js`

## Estratto

- `lightFieldLimit`
- `agathoiStructureCount`
- `agathoiStructureIncomeBonus`
- `economicEffectsSummary`
- `addPlayerEffect`
- `affectedPlayerForAbility`
- `activeEconomicEffect`
- `effectiveIncomeGain`
- `factionDoctrineIncome`
- `effectiveBlueprintCost`
- `playerCostModifiers`
- `matchesEconomyFilter`
- `consumeDeploymentDiscount`
- `canAffordBlueprint`
- `fieldUnitsByBlueprint`
- `activeBlueprintCount`
- `activeStructureCount`
- `activeCommanderCount`
- `isLight`
- `countsAsLightCap`
- `activeLightCount`
- `activeLightCountByType`
- `fieldLimitFor`
- `purchaseLimitReached`
- `limitLabel`
- `limitReason`
- `commanderUses`
- `commanderLimitReached`

## Copertura della fase

Questa fase riguarda:

- effetti economici;
- modificatori costo;
- sconti deployment;
- income effettivo;
- dottrine fazione;
- Radicamento Agathoi;
- cap unità leggere/pesanti/elite/pivot/comandante/strutture;
- controllo acquisto.

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio combat/status/abilità/tattiche/render.
Solo spostamento fisico delle funzioni economia/cap.

## Nota

La sequenza completa di inizio turno resta ancora dove si trova.
B6a sposta i mattoni economici, non il ciclo del turno.

## Prossimo step consigliato

B6b – Turn economy extraction:

- parte income dentro `startTurn`;
- tick player effects;
- cleanup economici post-income/fine turno;
- eventuale separazione `tickPlayerEffects`.
