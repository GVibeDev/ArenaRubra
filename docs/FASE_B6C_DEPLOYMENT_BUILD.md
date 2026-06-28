# Arena Rubra – Fase B6c Deployment / Build Extraction

## Obiettivo

Spostare in `src/deployment.js` lo strato di acquisto, sbarco e costruzione, senza cambiare gameplay.

## File reso operativo

- `src/deployment.js`

## Estratto

- `beginPurchase`
- `toggleBuildMode`
- `isBuildTarget`
- `isSpawnTarget`
- `spawnSourcesFor`
- `spawnCellsFor`
- `canBuildStructures`
- `buildableCells`
- `canAnyInfantryBuild`
- `spawnUnit`
- `applyAgathoiSpawnDefBonus`
- `buildStructure`

## Cosa resta nel main

Restano nel `main.js`:

- scelta AI di cosa comprare;
- punteggi AI per spawn/build;
- scelta cella spawn/build;
- movimento;
- sequenza turno.

Questa scelta è intenzionale: B6c separa il motore di deployment, non l'AI.

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio combat/status/abilità/tattiche/economia/render.
Solo spostamento fisico delle funzioni deployment/build.

## Test consigliati

- acquisto manuale unità;
- piazzamento unità;
- costruzione struttura da fanteria;
- costruzione struttura da veicolo Agathoi costruttore;
- bonus +DEF da Bastione Agathoi allo sbarco;
- bot che compra unità;
- bot che costruisce strutture.
