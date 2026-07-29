# F9Q1 — Map Data Foundation

## Obiettivo

F9Q1 introduce un contratto dati serializzabile e versionato per descrivere mappe singole e composite senza codificare la geometria nel renderer o nelle regole di partita.

## Contratto JSON v1

Ogni definizione usa `schemaVersion: 1` e contiene:

- identità: `id`, `name`, `description`, `official`, `editable`, `enabled`;
- partita: `playerCount`, `movementMultiplier`, `turnOrder`;
- geometria: `geometry.type`, `nominalRadius`, `components`, `cells`;
- slot: `playerSlots[]` con `slotId`, `headquarters` e deployment;
- obiettivi: `strategicPoints[]`;
- pericoli iniziali: `initialHazards[]`;
- presentazione e metadati: skin, autore, revisione, tag, simmetria e sorgente.

Le coordinate sono cubiche intere `[x,y,z]` con `x+y+z=0`. Ogni cella conserva `componentId` / `componentIds`, `terrainType`, `cellRole`, `ownerPlayerId` e un eventuale `initialHazard`.

`cellRole` ammette `normal`, `headquarters` e `strategic_point`; non viene derivato dal terreno.

## Composizione

Una componente esagonale conserva raggio, origine e rotazione. Le celle coincidenti di più componenti vengono deduplicate, mantenendo l’elenco delle componenti di origine. Il runtime ammette fino a otto componenti e 1000 celle per mappa.

## MAP1 come regressione

`map1_starter` ricostruisce esattamente il campo storico:

- singolo esagono raggio 6;
- 127 celle;
- due giocatori;
- QG `[-6,0,6]` e `[6,0,-6]`;
- PS `[0,0,0]`, `[0,-4,4]`, `[0,4,-4]`;
- movimento ×1;
- 127 celle `free`;
- nessun pericolo iniziale.

Tutorial e partita ordinaria a due giocatori continuano a utilizzare questo percorso dati.

## Validazione e import

Il validatore controlla schema, ID, coordinate cubiche, duplicati, dimensione, terreni, numero e posizione dei QG, deployment, PS, sovrapposizioni, connettività percorribile, raggiungibilità degli obiettivi e simmetria dichiarata.

L’import normalizza testo e valori, rimuove lo stato `official`, risolve i conflitti di ID e valida prima del salvataggio. L’export racchiude la definizione nel formato `arena-rubra-map`.
