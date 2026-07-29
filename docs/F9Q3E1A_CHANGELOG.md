# Arena Rubra — F9Q3e1a Telemetry Attribution & Pivot Instances Hotfix

## Identità

- Build candidata: `C2-STABLE-1-F9Q3e1a-APK-M4c`
- Build di partenza: `C2-STABLE-1-F9Q3e1-APK-M4c`
- Baseline logica validata: `C2-STABLE-1-F9S1c1-APK-M4c`
- Schema telemetrico: `F9Q3e1-2`
- RNG: `mulberry32`, invariato

## Motivo della patch

Il confronto fra JSON telemetrico principale, statistiche eventi F9F e log testuale ha evidenziato tre incongruenze tecniche:

1. i cambi di controllo dei PS venivano assegnati a un giocatore sintetico `side: 0`;
2. la telemetria Pivot presupponeva una sola istanza per partita e non rilevava correttamente la distruzione tramite `unitId`;
3. una carta sovrapescata poteva essere conteggiata due volte, una in `CARD_DRAWN` e una in `CARD_DISCARDED`.

Il JSON F9F resta un riepilogo ausiliario degli eventi. Per pesca, mano, carte giocate e statistiche per carta, la fonte autorevole resta la telemetria match principale.

## Correzione attribuzione PS

### Causa

L'evento `PS_CONTROL_CHANGED` emette i campi:

- `previousControl`;
- `nextControl`.

F9Q3e1 cercava invece `newControl`. Il valore non trovato diventava `null`; la funzione di accesso al giocatore convertiva poi `null` in `0`, creando `players[0]`.

### Correzione

- lettura prioritaria di `nextControl` e `previousControl`;
- rifiuto centralizzato di side non interi o minori di 1;
- nessuna creazione di bucket per il controllo neutrale;
- `psControlChanges` incrementato sia per chi guadagna sia per chi perde il PS;
- `psGained` e `psLost` mantenuti separati;
- nuova timeline principale `timelines.psControl` con coordinate, round, vecchio e nuovo controllo, lock e occupante.

## Tracciamento Pivot multi-istanza

### Causa

Gli eventi di distruzione unità forniscono sempre `unitId`, ma non necessariamente `blueprintId`. F9Q3e1 verificava quasi esclusivamente il blueprint e manteneva un solo gruppo di campi per l'intera partita.

Una Pivot distrutta e poi rigenerata o schierata di nuovo sovrascriveva quindi il ciclo di vita precedente oppure non veniva riconosciuta.

### Correzione

Ogni schieramento della Pivot crea un elemento in:

```text
players[side].field.pivotInstances[]
```

Ogni istanza conserva:

- `unitId`;
- `instanceNo`;
- ID e nome Pivot;
- round di schieramento;
- round di distruzione;
- sopravvivenza conclusa e corrente;
- stato attivo/distrutto;
- costo e sorgente dello schieramento;
- attacchi;
- abilità usate;
- danni inflitti;
- killer e causa della distruzione.

Attacchi, abilità, danni e distruzioni vengono attribuiti usando l'UID dell'unità. Gli eventi di danno ora includono anche `sourceUnitId` e `sourceBlueprintId`. La provenienza viene conservata anche per Sanguinamento e Spine quando originano da una unità.

### Campi aggregati compatibili

I campi già presenti restano disponibili con semantica esplicita:

- `pivotDrawRound`: prima pesca;
- `pivotDrawRounds`: tutte le pescate rilevate;
- `pivotDeployedRound`: primo schieramento;
- `pivotDestroyedRound`: ultima distruzione rilevata;
- `pivotSurvivalRounds`: somma della sopravvivenza di tutte le istanze, comprese quelle ancora attive al round dello snapshot;
- `pivotDamageDealt`, `pivotAttacks`, `pivotAbilitiesUsed`: totali di tutte le istanze;
- `pivotInstanceCount`, `pivotDestroyedCount`, `pivotActiveCount`: conteggi espliciti.

La timeline `timelines.pivots` contiene ogni pesca, schieramento e distruzione con UID e numero di istanza.

## Correzione sovrapesca

### Causa

La stessa sovrapesca era indicata sia nella carta inclusa in `CARD_DRAWN` sia nell'evento `CARD_DISCARDED` con `reason: "overdraw"`.

### Correzione

- `CARD_DRAWN` registra la pesca ma non incrementa il contatore overdraw;
- `CARD_DISCARDED` con `reason: "overdraw"` è la fonte unica per la pesca ordinaria;
- una carta rubata e inviata direttamente negli scarti per mano piena viene conteggiata tramite `CARD_STOLEN` con `destination: "discard"`;
- contatori globali e per carta avanzano una sola volta.

## Autorità dei dati

Il record espone `metricAuthority`:

- PS: `players[*].field.ps*` e `timelines.psControl`;
- Pivot: `players[*].field.pivotInstances`;
- carte: `players[*].cards` e `cards.byCard`;
- overdraw: eventi di scarto o furto a mano piena.

I contatori carta del JSON F9F non vengono promossi a fonte autorevole.

## Compatibilità e analisi

I dati `F9Q3e1-1` prodotti prima della patch non devono essere aggregati automaticamente con `F9Q3e1-2`.

Per partite già esportate con F9Q3e1-1:

- usare la timeline F9F per i PS quando il bucket `side: 0` è presente;
- considerare non affidabili i campi Pivot aggregati in presenza di rigenerazioni o schieramenti multipli;
- usare la telemetria principale F9Q3e1-1 per pesca, mano, carte giocate e statistiche per carta;
- verificare gli overdraw dubbi contro il log.

## Ambito invariato

Nessuna modifica a:

- carte e costi;
- 50 deck ufficiali;
- IA;
- Missioni;
- mappe e terreni;
- Pressione;
- regole di combattimento;
- asset.
