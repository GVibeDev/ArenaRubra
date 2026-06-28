# Arena Rubra – Fase B7e AI Movement Extraction

## Obiettivo

Spostare in `src/ai.js` la scelta del movimento AI e i profili movimento per fazione.

## Aggiornato

- `src/ai.js`

## Estratto

- `chooseBotMove`
- `chooseAdvancedMove`
- `chooseAdvancedAgathoiMove`
- `chooseAdvancedFabeotMove`
- `chooseAdvancedNexusMove`
- `chooseAdvancedExordiumMove`
- `chooseAdvancedLibertiMove`
- `chooseLibertiMove`
- `exordiumFrontTargets`
- `chooseExordiumFrontForUnit`
- `libertiFlankTarget`
- `hashString`

## Cosa resta nel main

Restano nel `main.js`:

- acquisti AI;
- scoring acquisti;
- azioni AI;
- scoring attacchi/abilità;
- `finishBotMove`;
- `botAct`;
- `runBotTurn`;
- `maybeRunBot`.

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI intenzionale.
Solo spostamento fisico della scelta movimento AI.

## Test consigliati

- bot vs bot breve;
- movimento Nexus verso PS/protezione;
- Exordium su due fronti;
- Liberti flank/QG;
- Agathoi territorio/strutture;
- Fabeot sgattaiolamento/QG;
- PS centrale in early game;
- PS laterale.
