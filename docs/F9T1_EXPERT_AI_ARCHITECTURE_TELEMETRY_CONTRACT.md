# Arena Rubra — F9T1 Expert AI Architecture & Telemetry Contract

**Build candidata:** `C2-STABLE-1-F9T1-APK-M4c`  
**Baseline validata:** `C2-STABLE-1-F9T0-APK-M4c`  
**Schema telemetrico base:** `F9Q3e1-2`  
**Estensione Expert:** `F9T1-1`

## Obiettivo

F9T1 introduce l’infrastruttura del terzo grado IA senza introdurre ancora nuove decisioni strategiche. La milestone deve dimostrare isolamento per fazione, costo controllato, telemetria leggibile e fallback sicuro.

## Architettura

```text
Expert runtime comune
├── contesto costruito una volta per turno
├── cache effimera limitata al turno
├── budget e limiti duri
├── contratto micro-piani non ricorsivo
├── telemetria F9T1-1
└── fallback Advanced F9T0

Router singola fazione
├── expert_nexus.js
├── expert_exordium.js
├── expert_liberti.js
├── expert_agathoi.js
└── expert_fabeot.js
```

Il router invoca esclusivamente il modulo corrispondente alla fazione del giocatore bot corrente. Non confronta le cinque dottrine e non esegue codice delle altre fazioni.

## Quattro valutazioni strategiche comuni

1. `adaptive_enemy_proximity`: distanza espressa anche in turni plausibili, usando il movimento reale adattato al moltiplicatore della mappa.
2. `hq_structure_protection`: presenza di strutture sul QG o adiacenti.
3. `structures_on_strategic_points`: copertura strutturale dei PS controllati.
4. `hq_cell_occupation_risk`: rischio geometrico di occupazione del QG nel prossimo turno plausibile, senza simulazione ricorsiva.

Questi dati non contengono pesi o scelte. Ogni modulo di fazione deciderà in milestone successive come interpretarli.

## Contratto micro-piano

Campi previsti:

```text
id
faction
goal
targetCell / targetPs / targetUnitId
primaryActorId
supportActorIds
requiredEnergy
reservedEnergy
reservedActions
orderedSteps
currentStep
expectedResult
abortConditions
fallbackPlan
status
```

Vincoli:

- massimo 12 passaggi;
- massimo 8 attori di supporto;
- massimo 12 condizioni di abbandono;
- nessun piano o sottopiano annidato;
- `fallbackPlan` è soltanto un ID stringa;
- ENE richiesta e riservata non possono essere negative;
- un piano invalido viene scartato e produce fallback Advanced.

## Budget iniziali

| Voce | Limite |
|---|---:|
| Costruzione contesto | 12 ms |
| Esecuzione modulo fazione | 8 ms |
| Fondazione Expert a inizio turno | 30 ms |
| Candidati massimi | 64 |
| Decisioni dettagliate conservate per turno | 24 |

Il superamento del budget produce diagnostica e fallback; non autorizza ricorsione o ulteriore rivalutazione.

## Eventi Expert

- `AI_EXPERT_TURN_STARTED`
- `AI_EXPERT_CONTEXT_CREATED`
- `AI_EXPERT_MODULE_ROUTED`
- `AI_MICROPLAN_SELECTED`
- `AI_MICROPLAN_STEP`
- `AI_MICROPLAN_COMPLETED`
- `AI_MICROPLAN_ABORTED`
- `AI_EXPERT_DECISION`
- `AI_EXPERT_FALLBACK`
- `AI_EXPERT_BUDGET_EXHAUSTED`
- `AI_EXPERT_TURN_COMPLETED`

Le microazioni del fallback Advanced sono registrate direttamente nell’estensione telemetrica con un limite per turno, evitando un evento globale per ogni piccolo movimento.

## Stato dei moduli in F9T1

Tutti i moduli rispondono `architecture_only` e non restituiscono un piano. Di conseguenza la modalità Expert produce lo stesso comportamento decisionale dell’Advanced F9T0, aggiungendo esclusivamente isolamento, contratto e osservabilità.

## Criteri di accettazione

- selezionando Expert viene eseguito un solo modulo per turno;
- Advanced e Base non attivano il runtime Expert;
- il contesto viene creato una sola volta nel turno;
- cache e sessione vengono eliminate a fine turno;
- il fallback F9T0 è esplicito e telemetrizzato;
- i quattro controlli comuni sono presenti;
- i micro-piani ricorsivi vengono rifiutati;
- la telemetria base rimane compatibile;
- nessuna differenza di gameplay rispetto all’Advanced F9T0;
- nessun errore o blocco su desktop e APK.
