# Arena Rubra — Changelog F9T2d1

## Build

`C2-STABLE-1-F9T2d1-APK-M4c`

Baseline validata preservata: `C2-STABLE-1-F9T2c4-APK-M4c`.

## Correzioni

- Aggiunta l’anteprima pura `previewBasicAttackOutcome()` coerente con il combattimento non perforante ATT → DEF → HP.
- Il selettore Varran confronta attacco base e attacco con `+1 ATT`.
- Esclusi i casi `base_attack_already_kills`.
- Esclusi i casi `no_marginal_bonus_value`.
- Rimossa la semantica operativa ambigua di `killEnabled`.
- Aggiunti `baseWouldKill`, `immediateKillPredicted`, `immediateKillAchieved` e `bonusEnabledKill`.
- Registrati danni DEF/HP ed effettivi predetti e reali.
- Gestito il bersaglio realmente colpito dopo un’eventuale intercettazione.
- Integrato lo scanner `varranAssault` negli audit candidati autorevoli.
- Aggiunti `varranCandidateRejectionCounts` e i contatori di valore marginale/eliminazione.
- Limitata la scansione a 24 coppie complete.
- Riutilizzate proiezioni di movimento e contesto strategico.
- Spostata la serializzazione telemetrica del modulo fuori dalla finestra cronometrata.
- Aggiornati build metadata, precheck e schema a `F9T2d1-1`.

## Non modificato

- Nessuna modifica a carte, costi, statistiche o abilità.
- Nessuna modifica a deck, roster, mappe o Missioni.
- Nessuna modifica al bilanciamento.
- Nessuna catena coordinata con un secondo attore.
- Nessuna correzione a `Ordine d’Assalto`, mine Nexus, congestione o ruoli generali delle Pivot.
