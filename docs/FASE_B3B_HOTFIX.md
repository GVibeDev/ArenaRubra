# Arena Rubra – B3b-hotfix

## Motivazione

Dal log Agathoi vs Exordium è emerso un errore runtime quando una unità del bot moriva per Spine durante il proprio attacco.

## Correzioni

### Coordinate null-safe

`hexDistance`, `areAdjacent` e `neighbors` ora gestiscono coordinate assenti senza generare errore.

### AI dopo Spine

Dopo `attackUnit(unit, target)`, i cicli AI verificano se `unit` è ancora una unità valida in campo.
Se l'attaccante è morto per Spine, l'azione del bot si interrompe pulitamente.

### Strutture

`canAttack` ora impedisce attacchi da strutture e QG e attacchi con ATT effettivo 0.

### Log bersagli abilità

Per abilità che usano un bersaglio tecnico ma colpiscono il giocatore avversario (`affects: "enemy"`), il log mostra il giocatore realmente colpito.

## Regola

Nessuna nuova meccanica.
Solo correzioni difensive e pulizia log.
