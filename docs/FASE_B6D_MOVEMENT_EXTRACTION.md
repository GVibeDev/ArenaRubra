# Arena Rubra – Fase B6d Movement Extraction

## Obiettivo

Spostare in `src/movement.js` lo strato movimento, senza cambiare gameplay.

## File reso operativo

- `src/movement.js`

## Estratto

- `vehicleMoveRange`
- `isInfantryActionLike`
- `canActAfterMove`
- `movementRangeFor`
- `toggleMoveMode`
- `moveUnit`
- `isMoveTarget`
- `movableCells`

## Cosa resta nel main

Restano nel `main.js`:

- scelta AI del movimento;
- punteggi movimento;
- funzioni strategiche del bot;
- sequenza turno;
- `generateMap`, per ora.

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio combat/status/abilità/tattiche/economia/render/deployment.
Solo spostamento fisico delle funzioni movimento.

## Test consigliati

- movimento manuale fanteria;
- movimento manuale comandante;
- veicoli in Standard e Competitive;
- veicoli con Spinta di Guerra;
- Inseguitore Fabeot con `moveAttack`;
- bot che muove unità;
- bot che non prova a muovere strutture.
