# Arena Rubra — Changelog F9T2c3

## Build

`C2-STABLE-1-F9T2c3-APK-M4c`

## Modifiche

- schema dottrinale/telemetrico aggiornato a `F9T2c3-1`;
- aggregazione Expert spostata sul riepilogo autorevole di fine turno;
- aggiunti `decisionRecordsTotal`, `decisionRecordsStored`, `decisionRecordsDropped` a livello di modulo;
- aggiunti `candidateAuditsTotal`, `candidateAuditsStored`, `candidateAuditsDropped`;
- aggiunti conteggi audit separati per Relay, Clear–Occupy–Fortify e Forward Pivot;
- aggiunti aggregati separati delle ragioni di esclusione per scanner;
- aggiunti `psClearedDuringExpertPlan` e `psClearedDirectlyByExpertStep`;
- campi legacy `psCleared`/`expertPsCleared` riconciliati al risultato del piano;
- batch candidati uniformati con scanner, totale, conteggi e dettagli limitati;
- preservati tutti i comportamenti F9T2c2 senza nuove priorità strategiche.

## Fuori ambito

- nessuna modifica a Varran;
- nessun filtro tattiche;
- nessuna correzione mine Nexus;
- nessun budget strutture Nexus;
- nessuna modifica a cap di campo o pathfinding;
- nessuna modifica a carte o bilanciamento.
