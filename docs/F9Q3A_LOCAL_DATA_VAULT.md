# F9Q3a — Arena Rubra Local Data Vault

## Scopo

Il Local Data Vault fornisce un unico punto di accesso persistente per contenuti creati dall'utente, statistiche e impostazioni. Il codice applicativo non deve conoscere il backend effettivo.

## Backend

| Priorità | Backend | Uso |
|---:|---|---|
| 1 | OPFS | Directory privata dell'origine, con file JSON e Blob separati |
| 2 | IndexedDB | Fallback persistente con supporto a valori strutturati e Blob |
| 3 | localStorage | Compatibilità e fallback per WebView/browser limitati |
| 4 | Memoria | Ultimo fallback non persistente, segnalato dalla diagnostica |

La directory OPFS è privata dell'app/origine. Non equivale a una cartella pubblica visibile nel file manager Android. Gli export manuali restano il canale portabile e leggibile dall'utente.

## API pubblica

Il modulo espone, fra le altre, le operazioni:

```js
await ArenaDataStore.initialize();
await ArenaDataStore.ready();
ArenaDataStore.readJsonSync(path, fallback);
ArenaDataStore.writeJsonSync(path, value);
ArenaDataStore.removeSync(path);
await ArenaDataStore.writeBlob(path, blob);
await ArenaDataStore.readBlob(path);
await ArenaDataStore.createBackup();
await ArenaDataStore.restoreBackup(backupId);
ArenaDataStore.diagnostics();
```

Le letture sincrone sono servite da una mirror cache inizializzata al boot; le scritture vengono propagate al backend persistente.

## Migrazione

Chiavi storiche registrate:

- `arenaRubra.customCards.v1`;
- `arenaRubraF9H3SavedDecksV1`;
- `arenaRubra.maps.v1`;
- `arenaRubra.matchupStats.v1`;
- `arenaRubra.matchHistory.v1`;
- `arenaRubra.settings.v1`.

La migrazione:

1. crea uno snapshot pre-migrazione;
2. valida e importa i dati leggibili;
3. verifica la scrittura nel nuovo backend;
4. registra `arenaRubra.dataStoreMigration.v1`;
5. conserva le chiavi precedenti in questa milestone.

## Artwork delle carte custom

Quando il backend lo supporta, un Data URL di artwork viene separato in un Blob e il record JSON conserva il riferimento stabile all'asset. Durante il caricamento viene ricostruita una rappresentazione compatibile con il renderer corrente. L'export portabile può continuare a includere i dati necessari al round-trip.

## Diagnostica

La diagnostica indica almeno:

- backend attivo;
- disponibilità OPFS/IndexedDB;
- stato inizializzazione;
- migrazione eseguita o già completata;
- errori/fallback incontrati.
