# Arena Rubra — F9S1b1 Changelog

## Build

- Versione: `C2-STABLE-1-F9S1b1-APK-M4c`
- Nome: **Custom Deck Selection & Official Map Pack Hotfix**
- Canale: `f9s1b1-candidate`
- Baseline logica validata: `C2-STABLE-1-F9S1b-APK-M4c`
- Data build: 2026-07-28

## Obiettivo

Correggere la selezione dei deck salvati nella schermata **Nuova partita**, così da rendere realmente utilizzabili e testabili tutti i deck custom validi della fazione, e integrare tre nuovi pacchetti mappa ufficiali con sfondo WebP incorporato.

F9S1b è stata validata dall’utente, comprese le associazioni grafiche delle cinque Pivot alternative. Questa hotfix non modifica il pool da 40 carte, le Pivot o i deck ufficiali esistenti.

## Correzione del selettore deck

### Problema precedente

In modalità deck salvato, il Setup filtrava i deck contemporaneamente per:

- fazione selezionata;
- comandante già selezionato nel Setup.

Di conseguenza, un deck custom valido appartenente alla stessa fazione ma associato a un altro comandante non compariva nell’elenco. Questo impediva, fra l’altro, di preparare rapidamente deck di prova per le nuove Pivot F9S1b.

### Nuovo comportamento

- Il selettore mostra **tutti i deck salvati validi della fazione selezionata**, indipendentemente dal comandante attualmente impostato.
- Quando viene scelto un deck salvato, il Setup legge il comandante memorizzato nel payload del deck e sincronizza automaticamente il relativo selettore.
- In modalità deck salvato il selettore del comandante viene disabilitato, evitando combinazioni incoerenti fra deck e comandante.
- Tornando alla modalità Starter/template, il selettore del comandante viene riabilitato.
- La chiave del deck selezionato continua a raggiungere `readGameSetupFromDom()` e la validazione ordinaria del deck resta obbligatoria.
- Restano invariati: 30 carte, massimo una Pivot, una Missione, limiti di copia, fazione e comandante coerenti.

## Nuove mappe ufficiali

### Central hotspot

- ID: `custom_triple_ms3r4ifn`
- 3 giocatori
- 439 celle
- 8 PS
- MOV ×3
- PS centrale: `[0,-3,3]`, distanza 13 da tutti i QG
- Pressione Standard: round 26
- Limite Rapida: round 36
- Soglia: 4 PS complessivi, centro incluso
- Sfondo: `ruins.webp`, 1970×1968

### Plains 2G large

- ID: `custom_double_ms3ppdyc`
- 2 giocatori
- 313 celle
- 7 PS
- MOV ×2
- PS centrale: `[0,5,-5]`, distanza 12 da entrambi i QG
- Pressione Standard: round 25
- Limite Rapida: round 35
- Soglia: 4 PS complessivi, centro incluso
- Sfondo: `plains.webp`, 2697×1528

### La Trappola

- ID: `custom_triple_ms3s2abv`
- 4 giocatori
- 151 celle
- 7 PS
- MOV ×1
- PS centrale: `[0,0,0]`, distanza 7 da tutti i QG
- Pressione Standard: round 26
- Limite Rapida: round 36
- Soglia: 4 PS complessivi, centro incluso
- Sfondo: `trap.webp`, 2379×1782

## Normalizzazione e asset

Per ciascun pacchetto:

- geometria, coordinate, terreni, ruoli, QG, PS, ordine di turno e presentazione sono stati conservati;
- `official` è impostato a `true`;
- `editable` è impostato a `false`;
- `enabled` è impostato a `true`;
- il tag `official` è aggiunto ai metadati;
- `metadata.source` è impostato a `F9S1b1-official-map-pack`;
- lo sfondo incorporato è stato decodificato ed estratto come file WebP statico senza ricompressione;
- `backgroundAssetPath` punta all’asset statico incluso nella build;
- gli ID semantici originali dei PS centrali sono stati mantenuti, inclusi `ps-center-2` dove presente nel pacchetto sorgente.

## Controlli sui pacchetti mappa

Sono stati verificati tutti i campi rilevanti:

- coordinate cubiche valide e somma `q+r+s = 0`;
- coordinate cella univoche;
- componenti geometrici esistenti;
- QG coerenti con `playerSlots`, ruolo cella e proprietario;
- corrispondenza esatta fra celle PS e lista `strategicPoints`;
- ID PS univoci;
- PS centrale presente, semanticamente marcato ed equidistante dai QG;
- assenza di riferimenti a pericoli inesistenti;
- metadati e dimensioni dello sfondo coerenti con il WebP reale.

Non sono state rilevate incongruenze bloccanti nei tre JSON.

## File aggiunti

- `data/official_maps_f9s1b1.js`
- `assets/maps/backgrounds/map-bg-custom_triple_ms3r4ifn-ruins_webp-ms3rwq9c.webp`
- `assets/maps/backgrounds/map-bg-custom_double_ms3ppdyc-plains_webp-ms3qzmsc.webp`
- `assets/maps/backgrounds/map-bg-custom_triple_ms3s2abv-trap_webp-ms3skg6o.webp`
- `tests/f9s1b1_deck_selection_official_maps_smoke.js`
- `tests/f9s1b1_browser_deck_selection_smoke.py`

## File principali modificati

- `src/app.js`
- `src/build_info.js`
- `data/map_definitions.js`
- `data/cards_base.js`
- `index.html`
- `README.md`
- `tests/f9r3_browser_official_maps_pressure_smoke.py`

## Compatibilità

La candidata conserva:

- i 40 pool completi e le Pivot alternative F9S1b;
- gli asset e le associazioni grafiche già validati dall’utente nel ciclo F9S1b;
- i deck ufficiali correnti, ancora invariati in attesa di F9S1c;
- Pressione proporzionale e PS centrale F9R3;
- targeting FFA, ottimizzazioni prestazionali, tutorial e sistema mappe custom delle baseline precedenti.

## Esclusioni intenzionali

- Nessun nuovo deck ufficiale è stato costruito.
- Nessuna carta o statistica è stata modificata.
- Nessuna regola FFA residua è stata affrontata.
- Nessun test è stato eseguito su APK Android fisico.
