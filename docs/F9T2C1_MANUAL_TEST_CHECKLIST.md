# Checklist manuale — F9T2c1

Build candidata: `C2-STABLE-1-F9T2c1-APK-M4c`

Baseline ufficiale: `C2-STABLE-1-F9T2b-APK-M4c`

## A. Retest principale

- [ ] Usare `Plains 2G large`, rev. 169, movimento ×2.
- [ ] Usare `Breccia Cremisi` contro `Bastione Mobile`.
- [ ] Iniziativa Exordium.
- [ ] Seed `AR-msa55oq9-8rh612`, quando riproducibile.
- [ ] Esportare telemetria e log completi.

## B. Forward Pivot Candidate

- [ ] Pivot presente in mano e nessuna Pivot Exordium già in campo.
- [ ] Nodo avanzato con supporto disponibile.
- [ ] Audit con `pivotCost` numerico.
- [ ] `energyAfterDeployment` numerico e coerente.
- [ ] `sourceStructure` valorizzata.
- [ ] `deploymentCell` valorizzata.
- [ ] `projectedEndCellNextTurn` valorizzata.
- [ ] `objectiveType` e `objectiveCell` valorizzati.
- [ ] `no_one_turn_objective` compare solo dopo la proiezione legale.
- [ ] Nessuna simulazione oltre il singolo movimento successivo.

## C. Impatto Pivot globale

- [ ] Pivot schierata dal piano Expert: fonte `expert_forward_plan`.
- [ ] Pivot schierata dal fallback: fonte distinta e monitorata.
- [ ] Primo attacco registra `firstImpactRound`.
- [ ] Prima abilità registra l'impatto.
- [ ] Acquisizione PS registra l'impatto.
- [ ] Nessun impatto entro due round registra `impactMiss`.
- [ ] Distruzione prima dell'impatto registra il mancato impatto.
- [ ] Il record attivo viene eliminato dopo l'esito.
- [ ] La cronologia recente resta limitata.

## D. Clear–Occupy–Fortify autorevole

- [ ] Eliminare un presidio nemico su PS.
- [ ] Fare occupare il PS dal fallback con un attore diverso da quello prenotato.
- [ ] Il piano riconosce lo stato autorevole.
- [ ] `expertPsCleared` aumenta.
- [ ] `expertPsOccupiedAfterClear` oppure `expertPsFortifiedAfterClear` aumenta.
- [ ] Nessun falso aborto `turn_ended_before_completion`.
- [ ] Il piano completa e restituisce il turno all'Advanced.

## E. Gate comune dei Bastioni

- [ ] Bastione costruito dal Relay passa dal gate.
- [ ] Bastione costruito da Clear–Fortify passa dal gate.
- [ ] Bastione costruito dal fallback Advanced passa dal gate.
- [ ] Ricostruzione ordinaria sullo stesso PS passa dal gate.
- [ ] PS `UNSUSTAINABLE` periferico può essere bloccato.
- [ ] Centro o PS critico può essere autorizzato con motivazione.
- [ ] Telemetria distingue fonte Expert/fallback.
- [ ] `totalBastionsBuiltOnPs` coincide con il gameplay.

## F. Centro autorevole

- [ ] `[0,5,-5]` è riconosciuto come centro sulla mappa del test.
- [ ] `isCenter: true` negli audit pertinenti.
- [ ] `criticalValue` usa il centro autorevole.
- [ ] Nessuna deduzione geometrica sostituisce il dato mappa.

## G. Budget e registri

- [ ] `decisionRecordsStored <= 24` in ogni turno.
- [ ] Gli audit sono separati dalle decisioni.
- [ ] `decisionLimitReached` è coerente.
- [ ] `decisionRecordsDropped` è coerente.
- [ ] `auditRecordsDropped` è coerente.
- [ ] `candidateScanStoppedEarly` compare quando applicabile.
- [ ] Nessun `budgetExhaustion` del modulo in condizioni normali.
- [ ] Nessuna crescita progressiva anomala dei record.

## H. Origine degli schieramenti e Pivot

- [ ] `spawnSource` distingue mano, roster, mercato, struttura, abilità, scenario e debug.
- [ ] `deckPivotInstances` coerente.
- [ ] `rosterPivotInstances` coerente.
- [ ] `marketPivotInstances` coerente.
- [ ] `allPivotInstances` contiene tutte le Pivot osservate.
- [ ] Nessuna modifica implicita alla legalità delle Pivot fuori deck.

## I. Regressioni

- [ ] Bastion Relay esegue `move_guard → build_bastion`.
- [ ] Clear–Occupy–Fortify conserva la selezione greedy fino a tre attaccanti.
- [ ] Relay Survival conserva la memoria a cinque round.
- [ ] Riserva ENE protetta.
- [ ] Fallback Advanced operativo.
- [ ] Un solo modulo di fazione eseguito per turno.
- [ ] Nessun softlock.
- [ ] Nessun errore console o pagina.

## L. APK e partita lunga

- [ ] Test su APK reale.
- [ ] Almeno una partita completa fino a vittoria/spareggio.
- [ ] Nessun rallentamento progressivo anomalo.
- [ ] Nessuna crescita RAM persistente attribuibile al modulo Expert.
- [ ] Esportazione telemetria completa riuscita.
