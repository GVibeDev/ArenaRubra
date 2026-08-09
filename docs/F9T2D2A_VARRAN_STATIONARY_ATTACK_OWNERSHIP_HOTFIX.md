# Arena Rubra — F9T2d2a

## Varran Stationary Attack Ownership Hotfix

**Build candidata:** `C2-STABLE-1-F9T2d2a-APK-M4c`  
**Baseline ufficiale preservata:** `C2-STABLE-1-F9T2c4-APK-M4c`  
**Modulo Exordium:** `expert-exordium-f9t2d2a`  
**Estensione telemetrica:** `F9T2d2a-1`

## Problema corretto

In F9T2d2, `VARRAN_ASSAULT_CHAIN` poteva usare correttamente `Ordine di Varran` e ottenere il previsto attacco quando l'attore era già a portata, ma il fallback generico poteva consumare l'attore prima dell'esecutore Expert.

Il risultato gameplay avveniva, mentre il micro-piano restava incompleto e terminava con `turn_ended_before_completion`.

## Soluzione

È stato introdotto un gate dedicato prima dell'emergenza Advanced:

```text
Clear Occupation Commitment
→ Reserved Stationary Varran Assault
→ Emergency Advanced
→ Planned Unit Action
→ Generic Fallback
```

Il gate si attiva soltanto quando:

- il piano attivo è `EXORDIUM_VARRAN_ASSAULT_CHAIN`;
- il passo corrente è `execute_varran_assault`;
- l'unità corrente coincide con l'attore prenotato;
- `moveCell` è nullo;
- il controllo del rischio QG interno al piano consente l'azione.

L'attacco viene quindi eseguito dall'Expert prima che il fallback possa consumare l'attore.

## Proprietà e riconciliazione

Il piano e la decisione `varran_assault_executed` registrano:

```text
stationaryAttackBranch
movementRequired
movementSkippedReason
requestedActorId
actualActorId
requestedTargetUnitId
actualTargetUnitId
attackOwnership
attackObservedSequence
attackOccurredAfterOrder
attackExecutionRecognized
```

Valori attesi nel ramo stazionario:

```text
stationaryAttackBranch = true
movementRequired = false
movementSkippedReason = already_in_attack_range
attackOwnership = expert_executor
attackExecutionRecognized = true
```

La previsione ATT→DEF→HP, il danno marginale e le metriche kill restano quelle validate in F9T2d1.

## Aggregati

Sono disponibili:

- `varranStationaryAssaultsExecuted`;
- `varranAttackOwnershipRecognized`.

## Limiti

La patch non introduce:

- nuove priorità strategiche;
- secondo attaccante coordinato;
- ricerca ricorsiva;
- simulazioni multi-turno;
- modifiche a carte, statistiche, costi o bilanciamento.

Il ramo con movimento resta invariato.
