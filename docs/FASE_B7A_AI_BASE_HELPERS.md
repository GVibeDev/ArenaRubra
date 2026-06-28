# Arena Rubra – Fase B7a AI Base Helpers Extraction

## Obiettivo

Iniziare l'estrazione AI senza toccare il comportamento decisionale del bot.

## File reso operativo

- `src/ai.js`

## Estratto

- `advancedAiEnabled`
- `controlledPsCells`
- `centerPsCell`
- `centerPsOccupant`
- `centerControlledBy`
- `centerControlledByEnemy`
- `centerOpeningActive`
- `centerContestUrgent`
- `sidePsCells`
- `homePsCell`
- `homePsOccupant`
- `homePsControlled`
- `homePsDutyActive`
- `alliesNear`
- `enemiesNear`
- `commanderOf`
- `unitIsGarrisoningPs`
- `threatenedOwnHqUnits`
- `commanderThreatLevel`

## Cosa resta nel main

Restano nel `main.js`:

- `strategicStatus`
- logica emergenza
- score movimento
- score acquisti
- score abilità/attacchi
- scelta unità bot
- `runBotTurn`
- `botAct`

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI intenzionale.
Solo spostamento fisico degli helper base di lettura campo.

## Test consigliati

- avvio partita;
- bot vs bot breve;
- controllo PS centrale;
- controllo PS laterale;
- minacce al QG;
- comportamento comandante quando minacciato.
