# F9T2d3 — Commander Deployment Commitment

**Build candidata:** `C2-STABLE-1-F9T2d3-APK-M4c`  
**Baseline ufficiale:** `C2-STABLE-1-F9T2c4-APK-M4c`  
**Modulo Exordium:** `expert-exordium-f9t2d3`  
**Estensione telemetrica:** `F9T2d3-1`

## 1. Problema osservato

Nel match H-bot F9T2d2a Varran rimaneva in mano pur risultando legalmente giocabile per circa quindici turni. Il purchase planner consumava sistematicamente l'ENE disponibile, rendendo irraggiungibile una parte della dottrina Expert che dipende dalla presenza del comandante.

F9T2d3 non cambia il costo di Varran, le carte o il bilanciamento. Introduce un vincolo di spesa persistente che impedisce la starvation del comandante.

## 2. Livello architetturale

Il Commander Deployment Commitment non è un nuovo micro-piano strategico e non viola il vincolo di un solo micro-piano principale per turno.

È un commitment persistente conservato in:

```text
state.expertAiF9T1.commanderCommitments[player]
```

Il runtime comune espone la riserva; il router delega la politica alla fazione attiva. La prima policy concreta è Exordium/Varran, ma la struttura è estendibile ad altri comandanti senza introdurre logica Varran-specific nel runtime comune.

## 3. Policy Exordium

Per `EX0B00 — Varran`:

```text
earliestCommitRound      = 4
maxPlayableDelayRounds   = 2
```

Condizioni di creazione:

```text
Expert attivo
+ fazione Exordium
+ comandante selezionato ancora in mano
+ nessun comandante già in campo
+ round >= 4
```

La creazione non richiede che tutta l'ENE sia già disponibile. Questo è intenzionale: la riserva serve anche ad accumularla.

## 4. Riserva ENE autorevole

`expertReservedEnergyF9T2(player)` somma:

```text
reservedEnergy del micro-piano attivo
+ reservedEnergy del Commander Commitment
```

Gli acquisti e le tattiche generiche passano da `expertCanSpendEnergyF9T2` e non possono scendere sotto la riserva.

Le azioni appartenenti a un micro-piano Expert usano `planSpend` e mantengono la priorità prevista dall'architettura.

## 5. Deployment

Quando esiste almeno una cella legale e l'ENE è sufficiente, `expertExordiumCommanderRosterChoiceF9T2d3` produce una scelta roster dalla mano con:

```text
expertDoctrine = commander_deployment_commitment_f9t2d3
score = 2200
```

La cella usa `chooseSpawnCell` quando disponibile; altrimenti viene selezionata deterministicamente per costo e chiave di coordinata.

Dopo lo spawn, `expertExordiumObserveCommanderRosterPlayF9T2d3` chiude il commitment e libera immediatamente la riserva.

Se lo stesso comandante viene schierato dal fallback Advanced mentre il commitment è attivo, l'osservatore lo riconcilia come:

```text
deploymentSource = advanced_fallback_while_committed
```

## 6. Differimenti

Il commitment può essere differito per:

- `hq_occupation_risk_priority`;
- `higher_priority_expert_plan`;
- `higher_priority_expert_roster_step`;
- `no_legal_deployment_cell`;
- `commander_field_limit`;
- `hand_locked`;
- `commander_card_blocked`.

Per i blocchi reali la deadline viene estesa una volta per round. Il commitment resta attivo.

Con rischio QG `direct` o `occupied`, la riserva viene temporaneamente sospesa per non sottrarre ENE alla risposta di sopravvivenza.

## 7. Deadline

La deadline iniziale è:

```text
commitmentCreatedRound + maxPlayableDelayRounds
```

Per Varran, con commitment a R4, la deadline base è R6.

Un superamento della deadline non cancella il commitment. Produce invece `commander_deployment_deadline_missed`, così un eventuale fallimento rimane osservabile.

## 8. Telemetria

Decisioni:

```text
commander_deployment_commitment_created
commander_deployment_energy_reserved
commander_deployment_deferred
commander_deployment_deadline_missed
commander_deployment_attempted
commander_deployment_executed
```

Campi aggregati:

```text
commanderDeploymentCommitments
commanderDeploymentCommitmentsExecuted
commanderDeploymentDeferred
commanderDeploymentDeferredReasons
commanderDeploymentAttempts
commanderDeploymentDeadlineMisses
commanderEnergyReserved
commanderPlayableRoundsBeforeDeployment
commanderCommitmentCreatedRound
commanderDeploymentDeadlineRound
commanderActualDeploymentRound
```

## 9. Vincoli di complessità

F9T2d3 non introduce:

- pathfinding aggiuntivo;
- simulazioni multi-turno;
- ricerca ricorsiva;
- nuovi scanner di bersagli;
- memoria storica non bounded.

La verifica usa soltanto carta comandante, costo, celle di spawn già fornite dal runtime, stato QG e micro-piano attivo.

## 10. Fuori scope

Restano esplicitamente fuori da F9T2d3:

- Forward Pivot authoritative reachability preview;
- HQ Emergency Defense executor;
- Tactical Utility Filter;
- mine Nexus;
- modifiche a deck, carte, costi o statistiche.
