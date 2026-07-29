# Arena Rubra — F9Q3a Changelog

Build candidata: `C2-STABLE-1-F9Q3a-APK-M4c`

Baseline tecnica: `C2-STABLE-1-F9Q3-APK-M4c`

## Obiettivo

F9Q3a stabilizza l'uso delle mappe di grandi dimensioni, centralizza la persistenza dei dati utente e sostituisce il menu iniziale incrementale con una dashboard responsive. Non modifica carte, Missioni, IA, terreni, bilanciamento o regole FFA.

## Camera e geometria della board

- Aggiunto `src/board_geometry.js` come fonte unica delle metriche native della mappa attiva.
- Il renderer pubblica dimensioni, origine grafica e limiti reali della board dopo ogni cambio mappa o ricostruzione della geometria.
- Camera desktop e camera APK-M4 leggono la stessa geometria dinamica.
- Fit, focus, pinch, wheel e clamp del pan non dipendono più dal rettangolo storico fisso `920 × 780`, salvo fallback MAP1.
- Le mappe grandi sono centrate in un contenitore visuale assoluto, evitando che le dimensioni della board allarghino le tracce della griglia della UI.
- I limiti permettono di portare ciascun bordo della mappa fino al margine visibile senza perdere completamente la board fuori schermo.
- Apertura/chiusura dei pannelli e resize ricalcolano i limiti senza forzare focus durante il turno bot.

Fixture di stress usata: `tests/fixtures/custom_double_ms0cunhu.json`, 383 celle, 3 QG, 7 PS.

## Arena Rubra Local Data Vault

- Aggiunto `src/data_store.js`.
- Backend selezionati in ordine:
  1. Origin Private File System, sottodirectory privata `ArenaRubraData`;
  2. IndexedDB;
  3. localStorage di compatibilità;
  4. memoria temporanea come ultimo fallback diagnostico.
- Namespace logici:
  - `cards/index.json` e `cards/art/`;
  - `decks/index.json`;
  - `maps/index.json`;
  - `stats/matchup-stats.json`;
  - `stats/match-history.json`;
  - `settings/`;
  - `backups/`.
- Centralizzati gli accessi di Card Editor, Deck Builder, Map Editor/runtime, statistiche, impostazioni e Storage Foundation.
- Migrazione automatica e non distruttiva delle precedenti chiavi `arenaRubra.*`.
- Creato un backup pre-migrazione una sola volta.
- Le immagini custom possono essere estratte dai Data URL e conservate come Blob nel backend binario; il formato esportato resta compatibile.
- Export/import JSON, copia testo ed export statistiche restano disponibili.
- Il boot attende l'inizializzazione del datastore prima di popolare librerie e menu.

## Menu principale

- Nuova gerarchia visiva con aree `Gioca`, `Studio`, `Audio e presentazione` e `Funzioni in preparazione`.
- `Nuova partita` è l'azione primaria; `Riprendi partita` e `Tutorial` sono immediatamente distinguibili.
- Editor carte, Costruttore deck, Pool carte ed Editor mappe sono raccolti in una griglia uniforme.
- Stato build, backend locale e riepilogo dei contenuti custom sono mostrati in forma compatta.
- Layout Calibration Lab nascosto nel menu normale e disponibile solo con `?dev=1`.
- I pulsanti seguenti restano intenzionalmente disattivi:
  - `Statistiche / log test`;
  - `Informazioni versione`;
  - `Opzioni / debug`.
- Responsive verificato da desktop largo a mobile portrait/landscape, con menu scorrevole e controlli touch adeguati.

## Compatibilità

- MAP1 e tutorial F9O7a–F9O7g invariati.
- Nessuna modifica al targeting multigiocatore, alle Missioni FFA o al significato dei terreni.
- I backend storici restano disponibili come fallback e come copia di compatibilità durante questa candidata.
