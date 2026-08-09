# F9T2c3a — Expert Turn Ownership & Audit Unit Consistency Hotfix

## Build

`C2-STABLE-1-F9T2c3a-APK-M4c`

Baseline ufficiale preservata: `C2-STABLE-1-F9T2b-APK-M4c`.

## Ambito

Hotfix telemetrico senza cambiamenti strategici o di bilanciamento.

## Correzione A — proprietà temporale

`WINDOW_EXPIRED`, `LATE_IMPACT` e gli altri risultati differiti della Pivot vengono scritti nel turno corrente, cioè nel turno in cui sono accertati. Il record contiene riferimenti allo schieramento originario ma non modifica più l’array `decisions` di un turno finalizzato.

Quando nessun runtime Expert Exordium è attivo, il record viene accodato e scaricato nel successivo turno Exordium valido.

## Correzione B — finalizzazione autorevole

La finalizzazione del turno calcola i contatori direttamente dagli array e dai record scartati. Dopo la finalizzazione il turno è immutabile.

Invarianti:

```text
decisionRecordsStored == decisions.length
decisionRecordsTotal == decisionRecordsStored + decisionRecordsDropped
```

## Correzione C — audit atomici e container

- `auditItemsTotal/Stored/Dropped`: numero di valutazioni atomiche;
- `auditContainersTotal/Stored/Dropped`: numero di batch o record contenitore;
- `auditRecords*`: alias legacy coerente con i container.

## Compatibilità

Sono preservati F9T2c3, F9T2c2, F9T2b e il contratto F9T1. Nessuna modifica a carte, unità, costi, mappe o regole.
