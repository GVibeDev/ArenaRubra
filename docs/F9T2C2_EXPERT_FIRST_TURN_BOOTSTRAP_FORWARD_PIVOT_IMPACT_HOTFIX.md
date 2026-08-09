# Arena Rubra — F9T2c2 Expert First-Turn Bootstrap & Forward Pivot Impact Hotfix

## Identità della candidata

- **Build:** `C2-STABLE-1-F9T2c2-APK-M4c`
- **Baseline logica validata:** `C2-STABLE-1-F9T2b-APK-M4c`
- **Schema telemetrico principale:** `F9Q3e1-2`
- **Contratto Expert:** `F9T1-1`
- **Estensione Exordium:** `F9T2c2-1`
- **Canale:** `f9t2c2-candidate`

F9T2c e F9T2c1 restano candidate non validate. F9T2c2 ne sostituisce la linea correttiva senza modificare la baseline ufficiale.

## Scopo

La patch corregge due difetti bloccanti osservati nella telemetria F9T2c1:

1. un primo turno bot, soprattutto dopo cambio partita e iniziativa del Giocatore 2, poteva essere chiuso senza sessione Expert completa;
2. `FORWARD_PIVOT_DEPLOYMENT` riusciva a schierare il Mech, ma poteva assegnargli un corridoio QG puramente geometrico e lasciare la memoria del piano in funzione soltanto diagnostica.

L’obiettivo non è aggiungere una nuova dottrina, ma rendere affidabile e operativo il contenuto già introdotto da F9T2c/F9T2c1.

## 1. Bootstrap del primo turno vincolato al match

Ogni esecuzione asincrona del bot possiede un token composto da:

```text
epoch
matchId
player
```

Il token viene verificato dopo ogni attesa e dopo le principali fasi del turno. Quando viene creata una nuova partita:

```text
invalidate old bot run
→ reset Expert runtime/cache
→ create new state
→ initialize telemetry
→ prepare Expert match
→ start first turn
```

Un turno appartenente a una partita precedente non può più:

- completare una sessione Expert del nuovo match;
- azzerare `botRunning` mentre il nuovo bot sta agendo;
- chiamare `endTurn()` sul nuovo stato;
- produrre `AI_EXPERT_TURN_COMPLETED` senza bootstrap valido.

`expertCompleteTurnF9T1()` rifiuta inoltre sessioni assenti o con `matchId` diverso dal match corrente.

### Invariante

Per ogni turno Expert valido:

```text
AI_EXPERT_TURN_STARTED
AI_EXPERT_CONTEXT_CREATED
AI_EXPERT_MODULE_ROUTED
AI_EXPERT_TURN_COMPLETED
```

I quattro conteggi devono restare riconciliati, indipendentemente dall’iniziativa.

## 2. Classificazione operativa del Forward Pivot

La proiezione resta limitata a un singolo movimento del turno successivo. Non viene introdotto alcun albero di ricerca.

Gli obiettivi ammessi, in ordine concettuale, sono:

```text
CENTER_CAPTURE
ENEMY_PS_CAPTURE
IMMEDIATE_ATTACK
IMMEDIATE_ABILITY
HQ_BREAKTHROUGH
HQ_CORRIDOR
```

`HQ_CORRIDOR` è valido soltanto quando la posizione proiettata porta la Pivot nella zona operativa del QG: attacco raggiungibile, cella critica o ingresso plausibile nel turno successivo con almeno un PS controllato. La semplice riduzione della distanza dal QG non crea più un candidato.

Il candidato registra:

```text
pivotCost
energyAfterDeployment
sourceStructureId
deploymentCell
projectedEndCellNextTurn
preferredMoveCell
preferredTargetId
objectiveType
objectiveCell
distanceToCenterAfterMove
distanceToNearestEnemyPsAfterMove
attackOrAbilityRangeAfterMove
impactDeadlineRound
```

## 3. Memoria d’impatto attiva

Dopo lo schieramento, per due round la Pivot mantiene una memoria leggera:

```text
forwardRole
objectiveType
objectiveCell
preferredMoveCell
preferredTargetId
impactDeadlineRound
```

La memoria non sostituisce il fallback Advanced e non apre una pianificazione ricorsiva. Interviene soltanto per:

- dare priorità alla Pivot nella selezione delle unità;
- favorire la cella proiettata;
- penalizzare l’allontanamento ingiustificato;
- anticipare un attacco o un’abilità realmente disponibili;
- occupare il PS obiettivo prima di riposizionamenti marginali.

Emergenza QG, distruzione della Pivot, scomparsa dell’obiettivo o scadenza della finestra possono interrompere la guida.

## 4. Impatto entro scadenza e impatto tardivo

La scadenza non elimina più il monitor. Vengono separati:

```text
deploymentRound
impactDeadlineRound
impactWithinDeadline
firstActualImpactRound
roundsToFirstActualImpact
firstActualImpactType
```

Alla scadenza viene emesso `forward_pivot_impact_window_missed`, ma la Pivot resta in `awaiting_late_impact`. Un attacco, un’abilità o un’acquisizione PS successivi vengono registrati come `forward_pivot_late_impact`.

Questo distingue:

- Pivot efficace entro due round;
- Pivot efficace ma lenta;
- Pivot mai incisiva;
- Pivot distrutta prima dell’impatto.

## 5. Denominatori telemetrici separati

I rapporti non mescolano più la sola Pivot del piano Expert con tutte le istanze Exordium:

```text
expertForwardPivotsDeployed
expertForwardPivotImpacts
expertForwardPivotImpactMisses

allExordiumPivotsTracked
allExordiumPivotImpacts
allExordiumPivotImpactMisses
forwardPivotLateImpacts
```

Le origini di schieramento restano distinte (`hand_deck`, `market`, `starter_roster`, `structure_spawn`, `ability_spawn`, `debug_roster`, `scenario`, recupero telemetrico).

## 6. Aggregati candidati e limiti

Restano attivi:

- massimo 24 record decisionali per turno;
- audit separati dai record decisionali;
- conteggi completi delle ragioni di esclusione per Relay, conversione territoriale e Forward Pivot;
- massimo 64 candidati generali;
- budget modulo 8 ms;
- cache limitata al turno;
- nessuna ricorsione libera.

## Funzioni preservate

F9T2c2 conserva senza estensioni strategiche:

- `BASTION_RELAY`;
- `CLEAR_OCCUPY_FORTIFY`;
- `RELAY_SURVIVAL_CHECK`;
- centro letto dalla mappa autorevole;
- riserva ENE dei micro-piani;
- fallback Advanced F9T0;
- isolamento dei cinque moduli Expert.

## Fuori ambito

La patch non modifica:

- `VARRAN_ASSAULT_CHAIN`;
- utilità di `Ordine d’Assalto`;
- mine e struttura-budget Nexus;
- ruolo delle Pivot Nexus;
- gestione generale del field cap;
- carte, costi, statistiche, deck, mappe, Missioni o condizioni di vittoria;
- legalità delle Pivot acquistate dal mercato.

## Criteri di accettazione manuale

F9T2c2 può essere validata soltanto se, su partita reale:

1. iniziativa G1 e G2 producono lo stesso contratto completo di eventi Expert;
2. nessun turno completato presenta `moduleId: null` o `context: null`;
3. un nuovo match non viene chiuso da un turno asincrono del match precedente;
4. un Forward Pivot viene schierato solo con obiettivo operativo;
5. il Mech segue la proiezione e produce attacco, abilità o impatto PS entro due round, oppure il candidato viene respinto;
6. un impatto tardivo resta osservabile;
7. Relay, conversione territoriale e Survival Check non regrediscono;
8. nessun superamento del budget Expert o crescita persistente delle sessioni.
