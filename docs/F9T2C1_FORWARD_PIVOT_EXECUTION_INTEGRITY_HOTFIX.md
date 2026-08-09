# Arena Rubra — F9T2c1 Forward Pivot Candidate & Expert Execution Integrity Hotfix

## Identità della build

- **Candidata:** `C2-STABLE-1-F9T2c1-APK-M4c`
- **Baseline ufficiale conservata:** `C2-STABLE-1-F9T2b-APK-M4c`
- **Candidata sostituita:** `C2-STABLE-1-F9T2c-APK-M4c`, non validata
- **Schema telemetrico principale:** `F9Q3e1-2`
- **Contratto Expert:** `F9T1-1`
- **Estensione Exordium:** `F9T2c1-1`
- **Data:** 1 agosto 2026

## Scopo

F9T2c1 corregge i punti bloccanti emersi nel test reale di F9T2c senza introdurre nuove dottrine. L'obiettivo è rendere verificabili e affidabili i tre micro-piani Exordium già presenti:

- `BASTION_RELAY`;
- `CLEAR_OCCUPY_FORTIFY`;
- `FORWARD_PIVOT_DEPLOYMENT`.

La patch non aggiunge Varran, scelta del percorso di vittoria, gestione dello spareggio, valutazione generale delle tattiche, correzioni Nexus o coordinamento ad armi combinate.

## 1. Forward Pivot: candidato con una sola proiezione legale

Il precedente filtro `no_one_turn_objective` poteva respingere nodi validi perché valutava soprattutto la cella di schieramento. F9T2c1 considera una sola proiezione limitata:

```text
cella di schieramento
→ movimento legale del turno successivo
→ posizione proiettata
→ obiettivo influenzabile
```

Non viene costruito alcun albero di ricerca. Per ogni candidato vengono esposti:

```text
pivotCost
energyAfterDeployment
sourceStructure
deploymentCell
projectedEndCellNextTurn
distanceToCenterAfterMove
distanceToNearestEnemyPsAfterMove
attackOrAbilityRangeAfterMove
objectiveType
objectiveCell
expectedImpactRound
```

Gli obiettivi ammessi restano PS, centro, bersaglio di alto valore e corridoio verso il QG.

## 2. Monitoraggio di tutte le Pivot Exordium

La finestra d'impatto non dipende più dall'origine Expert dello schieramento. Ogni Pivot Exordium osservata viene classificata per fonte:

```text
expert_forward_plan
hand_deck
starter_roster
market
structure_spawn
ability_spawn
debug_roster
scenario
unknown
```

Per ogni istanza vengono registrati:

```text
deploymentSource
deploymentRound
firstImpactRound
roundsToFirstImpact
impactType
impactMiss
```

L'impatto è riconosciuto attraverso attacco, abilità o acquisizione di un PS. Il mancato impatto entro due round viene registrato anche quando la Pivot è stata schierata dal fallback Advanced.

La memoria è limitata: massimo dodici esiti recenti e nessuna cronologia crescente senza limite.

## 3. Riconciliazione autorevole di Clear–Occupy–Fortify

Dopo ogni azione del fallback e prima della chiusura del turno, il piano verifica lo stato reale del gioco:

```text
bersaglio ancora presente?
PS controllato da Exordium?
occupante alleato presente?
struttura alleata presente?
```

Se il presidio è stato eliminato e il PS è stato occupato o fortificato, il piano viene completato anche quando l'attore effettivo non coincide con quello originariamente prenotato. Questo elimina il falso aborto `turn_ended_before_completion` osservato in F9T2c.

## 4. Gate comune per ogni Bastione costruito su PS

Ogni costruzione di `Bastione Armato` su un PS attraversa:

```text
expertExordiumCanBuildBastionOnPsF9T2c1(...)
```

Il gate viene applicato al confine reale `buildStructure()` e alle scelte Advanced/Expert. Copre:

- Bastion Relay;
- Clear–Occupy–Fortify;
- costruzione del fallback Advanced;
- ricostruzione ordinaria;
- costruzione su un PS appena conquistato.

Il gate usa `RELAY_SURVIVAL_CHECK`. Una classificazione `UNSUSTAINABLE` può bloccare la ricostruzione periferica; una costruzione critica resta ammessa quando il valore strategico lo giustifica. Ogni valutazione viene telemetrata con fonte e risultato.

## 5. Centro autorevole della mappa

Il PS centrale viene letto dai dati autorevoli della mappa. Non viene più dedotto geometricamente. Il test dedicato conferma il riconoscimento della coordinata non geometrica:

```text
[0,5,-5]
```

Questo dato alimenta Survival Check, valore critico, priorità del centro e candidato Forward Pivot.

## 6. Budget e registri realmente limitati

F9T2c1 separa:

```text
decisionRecords
auditRecords
```

Il limite di 24 si applica realmente ai record decisionali. Gli audit eccedenti vengono aggregati o scartati senza perdere i conteggi totali. Sono esposti:

```text
decisionLimitReached
decisionRecordsDropped
auditRecordsDropped
candidateScanStoppedEarly
```

Le scansioni territoriali evitano valutazioni di sopravvivenza sui PS senza presidio nemico e possono fermarsi dopo il primo candidato P0 ad alto valore. Non sono state introdotte ricorsione, simulazioni multi-turno o pathfinding congiunto.

## 7. Telemetria corretta

I contatori territoriali sono distinti:

```text
expertPsCleared
expertPsOccupiedAfterClear
expertPsFortifiedAfterClear

expertBastionsBuiltOnPs
fallbackBastionsBuiltOnPs
totalBastionsBuiltOnPs
```

Le Pivot sono separate per origine:

```text
deckPivotInstances
rosterPivotInstances
marketPivotInstances
allPivotInstances
```

`spawnSource` non usa più l'etichetta ambigua `deck_or_market` nei nuovi eventi compatibili con F9T2c1.

## 8. Disciplina prestazionale

Ottimizzazioni applicate:

- nessuna valutazione Survival completa sui PS privi di bersaglio;
- PS con presidio nemico e centro valutati per primi;
- arresto anticipato dopo un candidato P0 sufficiente;
- massimo 24 decisioni dettagliate;
- audit separati e limitati;
- una sola proiezione di movimento per la Pivot;
- nessuna ricerca ricorsiva.

Nei test browser ripetuti il modulo ha rispettato il budget di 8 ms:

- Bastion Relay: **6,5–7,8 ms**;
- Clear–Occupy–Fortify: **5,5–6,9 ms**;
- Forward Pivot: **5,8–6,3 ms**.

## 9. Fuori ambito

Non sono state modificate:

- mine Nexus;
- budget strutture Nexus;
- congestione generale del movimento;
- regole o legalità delle Pivot fuori deck;
- `VARRAN_ASSAULT_CHAIN`;
- tattiche, carte, costi, statistiche o bilanciamento;
- cap di campo;
- ordine autorevole dello spareggio;
- Missioni, mappe o deck.

## 10. Criterio di validazione manuale

Il retest principale consigliato resta:

```text
seed AR-msa55oq9-8rh612
Breccia Cremisi vs Bastione Mobile
iniziativa Exordium
Plains 2G large rev.169
```

La candidata può essere validata soltanto dopo aver verificato in una partita reale:

- candidato Forward Pivot con costo, proiezione e obiettivo valorizzati;
- monitoraggio della Pivot anche se schierata dal fallback;
- completamento autorevole di Clear–Occupy–Fortify;
- gate Survival applicato a ogni Bastione su PS;
- centro `[0,5,-5]` riconosciuto;
- nessun superamento del budget;
- nessuna regressione di Relay e conversione territoriale.
