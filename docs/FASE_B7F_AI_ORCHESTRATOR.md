# Arena Rubra – Fase B7f AI Orchestrator Extraction

## Obiettivo

Spostare in `src/ai.js` il driver del turno bot e la scelta della prossima unità, senza cambiare comportamento.

## Aggiornato

- `src/ai.js`

## Estratto

- `maybeRunBot`
- `chooseNextBotUnit`
- `chooseNextAdvancedBotUnit`
- `runBotTurn`
- `botAct`

## Cosa resta nel main

Restano nel `main.js`:

- `maybeUseBotTactic`
- `scoreBotTactic`
- `maybeUseBotPrePurchaseEconomyAbility`
- `botPurchasePhase`
- `chooseBotPurchase`
- `scoreFactionPurchase`
- `scoreLibertiPurchase`
- `advancedPurchaseBonus`
- `botTryStationaryAction`
- `botTryAttackOnly`
- `finishBotMove`
- `emergencyBotAction`
- `scoreAttackTarget`
- `scoreAbility`

Questi blocchi sono ancora dipendenze operative dell'orchestratore e verranno estratti nelle fasi successive.

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI intenzionale.
Solo spostamento fisico dell'orchestratore bot.

## Test consigliati

- bot vs bot breve;
- auto-start turno bot dopo nuova partita;
- chiusura automatica turno bot;
- scelta unità in AI standard;
- scelta unità in AI avanzata;
- bot che compra prima di agire;
- bot che usa tattiche prima/dopo acquisti;
- bot che termina senza freeze.
