# F9Q3c — Custom Map Backgrounds

## Scopo

Consentire alle mappe custom di usare un’immagine di sfondo persistente e regolabile, mantenendo separati i dati della mappa dall’asset binario e conservando la compatibilità con le skin ufficiali.

## Contratto `presentation`

Campi supportati:

```json
{
  "skinKey": "red_dust",
  "backgroundKey": null,
  "backgroundAssetId": "map-bg-custom_example",
  "backgroundAssetPath": "maps/backgrounds/map-bg-custom_example.webp",
  "backgroundName": "arena.webp",
  "backgroundMime": "image/webp",
  "backgroundWidth": 1920,
  "backgroundHeight": 1080,
  "backgroundFit": "cover",
  "backgroundOpacity": 0.9,
  "backgroundScale": 1,
  "backgroundOffsetX": 0,
  "backgroundOffsetY": 0
}
```

`backgroundInlineDataUrl` è ammesso soltanto come fallback o durante l’import portatile; non viene incluso nell’export leggero.

## Formati e limiti

- PNG, JPEG, WebP.
- File massimo: 12 MiB.
- Export portatile massimo: 20 MiB.
- Fallback inline massimo: 2 MiB quando non è disponibile un backend Blob.

## Modalità di adattamento

- `cover`: riempie l’area della mappa, con possibile ritaglio.
- `contain`: mostra l’intera immagine, con possibili bande libere.
- `native`: mantiene il rapporto/dimensione naturale come base, poi applica scala e offset.

Le regolazioni di scala e offset sono applicate in modo identico nella preview dell’editor e nel runtime.

## Storage

Gli asset vengono salvati tramite `ArenaDataStore.writeBlob()` nel percorso logico `maps/backgrounds/`. La rimozione usa `ArenaDataStore.removeBlob()` e non cancella altri dati della mappa.

## Export

### JSON leggero

Contiene definizione e riferimento dell’asset locale, ma non incorpora i byte dell’immagine. È adatto a backup interni o a mappe condivise insieme al relativo archivio locale.

### JSON portatile

Incorpora l’immagine come Data URL controllato. All’import, l’immagine viene validata, convertita in Blob e salvata nel Local Data Vault; la definizione torna a usare un riferimento locale.

## Fallback

Se l’asset manca o non può essere letto:

1. il runtime rilascia eventuali object URL obsoleti;
2. rimuove la modalità custom;
3. conserva la skin/background ufficiale della mappa;
4. non blocca caricamento, editor o partita.

## Sicurezza

- nessun `eval`;
- nessuna funzione nel JSON;
- controllo MIME e dimensione;
- Data URL limitato a immagini ammesse;
- nomi e metadati non diventano HTML eseguibile;
- object URL revocati quando sostituiti o non più necessari.
