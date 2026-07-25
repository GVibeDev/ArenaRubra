# Arena Rubra — C2-STABLE-1-F9Q3-APK-M4c

Baseline validata: `C2-STABLE-1-F9O7g-APK-M4c`.

Questa candidata completa F9Q1–F9Q3 con una fondazione dati per mappe composite, partite locali tutti-contro-tutti da 2 a 4 giocatori, terreni statici e un editor di mappe separato. Le cinque lezioni tutorial, compresa Lezione 5 Fabeot, restano disponibili e forzano la MAP1 storica.

## Mappe integrate

| ID | Nome | Giocatori | Celle | Movimento | Contenuto |
|---|---|---:|---:|---:|---|
| `map1_starter` | Campo Starter | 2 | 127 | ×1 | MAP1 storica, 3 PS, nessun terreno o pericolo |
| `map2_triumvirate` | Triumvirato Rubro | 3 | 229 | ×2 | doppio esagono, 4 PS, terreni e 3 pericoli iniziali |
| `map3_quadrivium` | Quadrivio Spezzato | 4 | 265 | ×3 | triplo esagono, 5 PS, terreni e 4 pericoli iniziali |

Il setup adatta automaticamente numero di giocatori, fazioni, comandanti, deck, controllo umano/bot e iniziativa alla mappa scelta. I turni sono circolari, i giocatori eliminati vengono saltati e l’ultimo giocatore attivo vince.

## Terreni

- `free`: costo movimento 1, nessun modificatore;
- `obstacle`: invalicabile, non occupabile, non utilizzabile per deployment o costruzione;
- `difficult`: costo ingresso 2;
- `defensive`: +1 DEF derivata finché l’unità occupa la cella;
- `exposed`: −1 DEF derivata, minimo 0.

QG e PS sono ruoli di cella separati dal terreno. Trappole e mine iniziali sono pericoli separati e non cambiano il catalogo carte.

## Editor mappe

Dal menu principale apri **Editor mappe e terreni**. Sono disponibili:

- modelli esagono singolo, doppio, triplo e vuoto;
- strumenti cella, terreno, ruolo e pericolo;
- simmetria, pan, zoom, adatta, annulla e ripeti;
- validazione live di coordinate, connettività, QG, PS, deployment e terreni;
- salvataggio locale in `arenaRubra.maps.v1`;
- import/export JSON con schema versione 1;
- duplicazione protetta delle mappe integrate e avvio nel Match Lab.

Le mappe integrate non possono essere sovrascritte o eliminate.

## Compatibilità

- MAP1 mantiene 127 celle, QG `[-6,0,6]` / `[6,0,-6]`, PS storici e movimento ×1.
- Lezioni 1–5, checkpoint, resume e scenario deterministico Fabeot sono invariati.
- Le anteprime carte restano sopra lo scrim tutorial.
- Costi, statistiche, cap, effetti carte e bilanciamento ordinario non sono stati modificati.
- La build è LITE: conserva manifest e fallback, senza i binari multimediali del pacchetto FULL.
