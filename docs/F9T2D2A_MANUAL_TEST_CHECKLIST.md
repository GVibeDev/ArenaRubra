# Checklist manuale — F9T2d2a

## Identità

- [ ] La build mostrata è `C2-STABLE-1-F9T2d2a-APK-M4c`.
- [ ] La baseline logica è `C2-STABLE-1-F9T2c4-APK-M4c`.
- [ ] Il modulo Exordium è `expert-exordium-f9t2d2a`.

## Ramo stazionario Varran

- [ ] Varran è in campo e può usare `Ordine di Varran`.
- [ ] L'attore è già adiacente al bersaglio.
- [ ] Il candidato registra `moveCell = null`.
- [ ] Il bonus ATT produce valore marginale effettivo.
- [ ] L'Ordine viene applicato.
- [ ] L'attore prenotato attacca il bersaglio prenotato nello stesso turno.
- [ ] L'emergenza/fallback non consuma l'attore prima dell'Expert.
- [ ] Non viene tentato un secondo attacco.
- [ ] Il piano termina `completed`, non `turn_ended_before_completion`.

## Telemetria

- [ ] `stationaryAttackBranch = true`.
- [ ] `movementRequired = false`.
- [ ] `movementSkippedReason = already_in_attack_range`.
- [ ] `requestedActorId = actualActorId`.
- [ ] `requestedTargetUnitId = actualTargetUnitId`, salvo intercettazione registrata.
- [ ] `attackOwnership = expert_executor`.
- [ ] `attackExecutionRecognized = true`.
- [ ] Il danno marginale previsto coincide con quello reale.
- [ ] `varranStationaryAssaultsExecuted` aumenta.
- [ ] `varranAttackOwnershipRecognized` aumenta.

## Regressioni

- [ ] Varran con movimento prima dell'attacco continua a completare il piano.
- [ ] Clear Effective Damage Preview completa sequenze ATT→DEF→HP valide.
- [ ] Clear Occupation Commitment resta prioritario.
- [ ] Bastion Relay, Forward Pivot e bootstrap Expert restano operativi.
- [ ] Nessun budget exhaustion.
- [ ] Nessun errore pagina o console.
