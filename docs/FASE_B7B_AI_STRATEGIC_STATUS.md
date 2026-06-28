# Arena Rubra – Fase B7b AI Strategic Status Extraction

## Obiettivo

Spostare in `src/ai.js` il blocco di lettura strategica avanzata del bot.

## Aggiornato

- `src/ai.js`

## Estratto

- `strategicStatus`
- `logEmergencyIfNeeded`
- `strategicTargetCoords`
- `isStrategicEnemyTarget`
- `strategicMoveBonus`
- `chooseEmergencyMove`
- `centerMoveScore`
- `homePsMoveScore`
- `chooseHomePsDutyMove`
- `contestedPsCells`
- `nearestControlledPsNeedingGuard`
- `shouldReleasePsGarrison`
- `commanderSafetyMove`
- `commanderProtectionMoveBonus`
- `psProtectionMoveBonus`
- `shouldHoldStrategicCell`

## Cosa resta nel main

Restano nel `main.js`:

- scoring acquisti;
- scoring abilità/attacchi;
- scelta movimento completa per fazione;
- scelta unità bot;
- `botPurchasePhase`;
- `botAct`;
- `runBotTurn`;
- `maybeRunBot`.

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI intenzionale.
Solo spostamento fisico della lettura strategica e dei bonus/protezioni emergenziali.

## Test consigliati

- bot vs bot breve;
- apertura centrale;
- PS laterale;
- QG minacciato;
- comandante minacciato;
- pressione strategica quasi a vittoria;
- match in round avanzati.
