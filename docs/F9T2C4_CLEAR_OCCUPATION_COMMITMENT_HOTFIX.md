# Arena Rubra — F9T2c4 Clear Occupation Commitment Hotfix

## Stato

- Build candidata: `C2-STABLE-1-F9T2c4-APK-M4c`
- Baseline logica validata di partenza: `C2-STABLE-1-F9T2c3a-APK-M4c`
- Schema Expert: `F9T2c4-1`
- Modulo Exordium: `expert-exordium-f9t2c4`
- Stato: candidata da collaudare in match reale; non sostituisce ancora la baseline validata.

## Problema corretto

Nel match di validazione F9T2c3a, `CLEAR_OCCUPY_FORTIFY` ha rimosso quattro presidi nemici ma ha convertito soltanto due PS. Nei due aborti reali il bersaglio era già stato eliminato, mentre l'unità prenotata per l'occupazione veniva consumata o deviata dal fallback generico. Il PS rimaneva libero e il piano terminava con `turn_ended_before_completion`.

## Contratto comportamentale F9T2c4

Quando il presidio bersaglio non esiste più, la conversione del PS diventa un impegno operativo prioritario:

```text
target rimosso
→ verifica autorevole del PS
→ conferma dell'occupante prenotato
→ eventuale riassegnazione bounded
→ occupazione prima delle azioni generiche del fallback
→ riconciliazione e completamento del piano
```

Restano superiori:

1. una vittoria immediata sul QG;
2. un rischio QG `direct` o `occupied`.

Il piano non introduce ricerca ricorsiva, simulazione estesa o pathfinding congiunto.

## Riassegnazione dell'occupante

Il candidato `CLEAR_OCCUPY_FORTIFY` conserva l'elenco ordinato degli occupanti inizialmente disponibili. Se l'attore prenotato è morto, ha già agito o non può più raggiungere il PS, viene selezionato un sostituto con una singola scansione bounded delle unità Exordium ancora disponibili.

Ordine di preferenza:

1. posizione nell'elenco originario degli occupanti;
2. costo inferiore;
3. distanza inferiore dal PS;
4. identificatore stabile.

Sono ammesse al massimo due riassegnazioni nello stesso piano. Dopo il limite, il piano viene abortito esplicitamente invece di continuare a cercare.

## Priorità nel ciclo bot

L'hook `expertFactionTryCommittedConversionActionF9T2c4` viene eseguito nel ciclo `botAct` dopo il controllo della vittoria immediata sul QG e prima delle azioni generiche del fallback Advanced.

L'occupante committed riceve un bonus di priorità pari a `1600`; gli altri attori di piano mantengono il valore precedente. La priorità Forward Pivot resta cumulabile e non viene rimossa.

## Telemetria

La patch registra:

- `clear_conversion_actor_reassigned`;
- `clear_conversion_actor_committed`;
- `clear_conversion_commitment_deferred_hq_risk`;
- `clear_conversion_commitment_executed`.

Metadati del piano:

- `occupierCandidateIds`;
- `conversionActorInitialId`;
- `conversionActorCurrentId`;
- `conversionActorReassignments`;
- `conversionCommitmentActive`;
- `targetRemovedObservedRound`.

## Invarianti preservate

F9T2c4 non modifica:

- carte, costi, ATT, DEF, HP o abilità;
- composizione dei deck e regole di copia;
- mappe o condizioni di vittoria;
- Bastion Relay e Survival Check;
- Forward Pivot e memoria d'impatto;
- bootstrap Expert simmetrico;
- proprietà temporale e riconciliazione telemetrica F9T2c3a;
- Pool carte, Card Editor, Map Editor e Control Center.

## Criteri di accettazione in match reale

Un caso positivo deve mostrare:

```text
bersaglio rimosso
PS libero
occupante originario indisponibile oppure deviato
sostituto selezionato
occupazione nello stesso turno
micro-piano completato
```

Controlli minimi:

- nessun `turn_ended_before_completion` quando esiste un occupante legale;
- `conversionActorReassignments >= 1` nel caso di sostituzione;
- evento `clear_conversion_commitment_executed` presente;
- PS controllato da Exordium a fine sequenza;
- nessuna deviazione dell'occupante committed prima dell'occupazione;
- emergenza QG ancora prioritaria;
- nessuna regressione su Relay, Forward Pivot, bootstrap e telemetria.
