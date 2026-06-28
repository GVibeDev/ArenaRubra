# Arena Rubra – Fase B7c AI Purchase/Tactics Extraction

## Obiettivo

Spostare in `src/ai.js` la parte di decisione economica del bot:

- uso tattiche;
- scoring tattiche;
- pre-acquisto Fabeot;
- acquisti;
- scelta spawn;
- scelta build;
- scoring acquisti avanzato.

## Aggiornato

- `src/ai.js`

## Estratto

- `maybeUseBotTactic`
- `scoreBotTactic`
- `maybeUseBotPrePurchaseEconomyAbility`
- `botPurchasePhase`
- `chooseBotPurchase`
- `scoreFactionPurchase`
- `scoreLibertiPurchase`
- `chooseSpawnCell`
- `chooseAdvancedSpawnCell`
- `buildCellStrategicScore`
- `chooseBuildCell`
- `centerPurchaseBonus`
- `advancedPurchaseBonus`

## Cosa resta nel main

Restano nel `main.js`:

- `botTryStationaryAction`
- `botTryAttackOnly`
- `finishBotMove`
- `emergencyBotAction`
- `scoreAttackTarget`
- `scoreAbility`

Questi sono il blocco B7d: azioni, attacco, abilità e follow-up.

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI intenzionale.
Solo spostamento fisico del blocco purchase/tactics.

## Test consigliati

- bot compra a inizio turno;
- bot usa tattiche prima degli acquisti;
- bot usa tattiche dopo gli acquisti;
- Fabeot usa Sportello prima del purchase;
- bot costruisce strutture;
- bot piazza unità in celle valide;
- Nexus mantiene Avatex come comandante e Nodo Comando come struttura;
- nessun freeze durante turno bot.
