# Arena Rubra — C2-STABLE-1-F9T2d3-APK-M4c

Candidata **F9T2d3 — Commander Deployment Commitment**.

Baseline ufficiale di partenza: `C2-STABLE-1-F9T2c4-APK-M4c`.
Candidate tecniche preservate: F9T2d1, F9T2d2 e F9T2d2a.

## Obiettivo

F9T2d3 impedisce che il purchase planner Advanced tenga indefinitamente fuori dal campo un comandante necessario alla dottrina Expert.

Il problema riprodotto nel test H-bot F9T2d2a era:

```text
comandante in mano e legalmente giocabile per molti turni
→ acquisti/tattiche consumano continuamente l'ENE
→ comandante non schierato
→ VARRAN_ASSAULT_CHAIN irraggiungibile
```

F9T2d3 introduce un **commitment persistente di schieramento del comandante**, distinto dai micro-piani di turno.

## Politica Exordium/Varran

Configurazione iniziale:

- `earliestCommitRound = 4`;
- `maxPlayableDelayRounds = 2`;
- costo Varran protetto: costo reale minimo di schieramento, normalmente 4 ENE.

Dal round 4, se il comandante selezionato è ancora in mano e non è già in campo, viene creato il commitment anche quando l'ENE corrente è insufficiente. In questo modo la riserva può accumularsi e impedire la starvation.

Quando il deployment è legale e abbordabile, il planner Expert restituisce direttamente la carta comandante dalla mano con priorità bounded.

## Riserva ENE

Il runtime Expert espone una riserva persistente:

```text
reservedEnergy.commander
```

Gli acquisti e le tattiche generiche vengono filtrati da `expertCanSpendEnergyF9T2` e non possono portare l'ENE sotto la riserva del comandante.

I micro-piani Expert che spendono la propria ENE restano superiori e possono differire il commitment.

## Differimenti ammessi

Il commitment può essere differito senza essere cancellato quando esiste una priorità superiore o un blocco reale, fra cui:

- rischio QG `direct` o `occupied`;
- micro-piano Expert già attivo;
- scelta roster Expert prioritaria già impegnata;
- nessuna cella di deployment legale;
- limite comandante/field cap;
- mano o carta comandante bloccata.

Il differimento estende la deadline di un solo round per round di causa e conserva il commitment originale.

L'insufficienza di ENE non estende la deadline: la riserva resta attiva proprio per accumulare la risorsa necessaria.

## Telemetria

Nuove decisioni:

- `commander_deployment_commitment_created`;
- `commander_deployment_energy_reserved`;
- `commander_deployment_deferred`;
- `commander_deployment_deadline_missed`;
- `commander_deployment_attempted`;
- `commander_deployment_executed`.

Nuovi aggregati di modulo:

- `commanderDeploymentCommitments`;
- `commanderDeploymentCommitmentsExecuted`;
- `commanderDeploymentDeferred`;
- `commanderDeploymentDeferredReasons`;
- `commanderDeploymentAttempts`;
- `commanderDeploymentDeadlineMisses`;
- `commanderEnergyReserved`;
- `commanderPlayableRoundsBeforeDeployment`;
- `commanderCommitmentCreatedRound`;
- `commanderDeploymentDeadlineRound`;
- `commanderActualDeploymentRound`.

Lo schieramento dello stesso comandante avvenuto comunque attraverso il fallback Advanced durante un commitment viene riconciliato come `advanced_fallback_while_committed`, senza lasciare una riserva orfana.

## Funzioni preservate

- Varran Stationary Attack Ownership F9T2d2a;
- Varran Effective Assault Value F9T2d1;
- Clear Effective Damage Preview F9T2d2;
- Clear Occupation Commitment F9T2c4 sullo stato autorevole;
- proprietà temporale e aggregati F9T2c3a;
- Bastion Relay e Survival Check;
- Forward Pivot;
- bootstrap Expert simmetrico;
- fallback Advanced F9T0;
- Control Center, Pool carte ed editor.

## Versioni

- build candidata: `C2-STABLE-1-F9T2d3-APK-M4c`;
- baseline logica: `C2-STABLE-1-F9T2c4-APK-M4c`;
- schema principale: `F9Q3e1-2`;
- contratto Expert: `F9T1-1`;
- estensione candidata: `F9T2d3-1`;
- modulo Exordium: `expert-exordium-f9t2d3`.

## Stato

La build è candidata. La baseline ufficiale resta `C2-STABLE-1-F9T2c4-APK-M4c` fino alla validazione dell'utente su gameplay reale.
