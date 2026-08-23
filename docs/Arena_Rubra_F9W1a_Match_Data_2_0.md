# Arena Rubra — F9W1a Match Data 2.0 Foundation

Base richiesta: `C2-STABLE-1-F9V4a-APK-M4c` VALIDATA.

Riferimento remoto verificato prima della patch: GitHub `main` commit `0d1aa4ee68e745c275c70c543306fd9f58049f6e` (F9V4a).

## Obiettivo

F9W1a apre S2-C3 e separa il dato leggibile della partita dai dati tecnici di diagnostica/bilanciamento, mantenendo compatibilità con lo storico già salvato.

La patch non modifica regole, combattimento, carte, deck, ENE, mappe, Missioni, IA, QG, Pressione, Tutorial o Challenge.

## MatchRecord canonico

Schema: `AR-MATCH-2`.

Ogni partita competitiva registra un singolo record N-player contenente:

- `matchId`, data e metadati build;
- setup: numero e ID giocatori, IA, ritmo, scala, seed e iniziativa;
- mappa: ID, nome, revisione, schema, celle, PS, terreno e moltiplicatore movimento;
- `participants[]`: side, fazione, human/bot, comandante, identità deck, lifecycle/eliminazione, valori finali e statistiche del giocatore;
- outcome: vincitore, sconfitti, tipo vittoria, round e messaggio;
- snapshot finali PS / Pressione / ENE / unità per tutti i giocatori;
- summary match: eventi, totali, tattiche e abilità principali;
- `telemetryRef`, se esiste telemetria tecnica associata.

Gli alias storici `p1*` / `p2*` vengono mantenuti temporaneamente per non rompere renderer, export e funzioni legacy. Non sono più il modello autorevole.

## MatchTelemetry separata

Store: `arenaRubra.matchTelemetry.v2`.

Schema contenitore: `AR-TELEMETRY-2`.

Percorso vault: `stats/match-telemetry.json`.

Il record tecnico è collegato al MatchRecord tramite `matchId` e può contenere:

- payload telemetrico corrente `F9Q3e1-2`;
- developer stats strutturate;
- `aiTelemetry`;
- `f9n3Telemetry`;
- attribution FFA.

Il payload tecnico NON viene più incorporato nel MatchRecord canonico.

F9W1a installa un adattatore di percorso sul Local Data Vault e carica esplicitamente il nuovo store dopo `arenaDataStoreReady()`, così la chiave resta persistente anche con OPFS/IndexedDB pur non essendo ancora presente nella tabella storica `ARENA_DATA_PATHS` della baseline.

## Migrazione

All'avvio viene eseguita una migrazione idempotente dello storico `arenaRubra.matchHistory.v1`:

1. i record legacy vengono convertiti in `AR-MATCH-2`;
2. eventuale `matchTelemetry` incorporata viene estratta nel nuovo store tecnico;
3. `f9n3Telemetry` viene spostata insieme alla telemetria;
4. gli alias di compatibilità vengono rigenerati;
5. un secondo avvio non duplica né record né telemetria.

La chiave dello storico resta intenzionalmente `arenaRubra.matchHistory.v1` per compatibilità con installazioni esistenti; è lo schema del record a diventare `AR-MATCH-2`.

## 2P / 3P / 4P

Il modello autorevole usa sempre `playerIds` e `participants[]` e non presuppone due giocatori. Human/Bot è registrato per ogni partecipante.

Le viste Cronologia e Statistiche del Control Center, il pannello statistiche in-game e il CSV sono aggiornati per visualizzare tutti i partecipanti senza perdere G3/G4.

## Esclusioni

Restano invariate:

- Tutorial e Challenge: fuori da statistiche competitive e storico;
- Match Lab: fuori da statistiche competitive e storico.

## Compatibilità

`arenaRubra.matchupStats.v1` continua a ricevere una copia compatta del MatchRecord con alias storici, per evitare regressioni nei consumer legacy durante la transizione.

Il dato autorevole per il futuro è però `arenaRubra.matchHistory.v1` con record `AR-MATCH-2`; il dato tecnico autorevole è `arenaRubra.matchTelemetry.v2`.
