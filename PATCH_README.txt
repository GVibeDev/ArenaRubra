Arena Rubra — F9W2a1 · Snow Battlefield Standard / Classic Official Map
============================================================================

BASELINE RICHIESTA
- F9W2a · Player / DEV Runtime Profile Foundation — VALIDATA
- Versione baseline: C2-STABLE-1-F9W2a-APK-M4c

CANDIDATA
- Versione: C2-STABLE-1-F9W2a1-APK-M4c
- Build name: Snow Battlefield · Standard / Classic Official Map
- Canale: starter2-official-map-snowbf-w2a1
- Baseline logica: C2-STABLE-1-F9T2c4-APK-M4c
- Data: 2026-08-24

SCOPO
Promuove il file utente allegato Mappa_SnowBF_4gg_x3mov.json a mappa built-in ufficiale
classificata Standard / Classic. Il JSON sorgente viene usato come autorità per geometria
e gameplay; nessuna regola della mappa è stata reinterpretata o riequilibrata.

MAPPA UFFICIALE
- ID canonico: map10_snow_bf_4pl_3x
- Nome: Snow BF - 4PL - 3x
- 4 giocatori
- movimento globale ×3
- geometria triple_hex
- 349 celle
- 13 Punti Strategici
- 4 QG
- 4 trap iniziali
- sfondo statico WebP 906×1061
- tag catalogo: official, standard, classic, four-player, 4-players, large, triple-hex

PRESERVAZIONE DATI
Sono identici al JSON sorgente:
schemaVersion, playerCount, movementMultiplier, turnOrder, geometry completa,
playerSlots, strategicPoints, centralStrategicPointId e initialHazards.
SHA-256 payload gameplay canonico:
119055f3cc7cfcbd7b36a0fd5ce0f856b4369e8164f71ca4b162432a0da90a8f

Le sole trasformazioni intenzionali sono di promozione/catalogo:
- id custom -> id canonico built-in;
- official false -> true;
- editable true -> false;
- descrizione da custom a Standard / Classic;
- metadata/tag ufficiali;
- background embedded -> asset WebP statico incluso nella patch.

BACKGROUND
assets/maps/backgrounds/snow_bf_4pl_3x.webp
SHA-256: 6cb3ea1fa2f67c7b509a6e57dca0d787fcf5deac3c7e8059796d605be779e8dd

INSTALLAZIONE
Estrarre questa patch sopra una installazione F9W2a VALIDATA mantenendo i percorsi.
La mappa viene registrata a runtime come built-in ufficiale e resta disponibile anche
nel profilo Demo / Distribution, che nasconde le mappe custom ma conserva quelle ufficiali.

TEST AUTOMATICI ESEGUITI
- node --check src/ui.js: PASS
- node --check src/build_info.js: PASS
- F9W2a profile static smoke: PASS
- F9W2a product profile regression: PASS
- F9W1a Match Data 2.0 regression: PASS
- F9W2a1 Snow BF official map smoke: PASS
- JSON sorgente: 0 incongruenze strutturali rilevate
- celle percorribili connesse: 305/305
- PS centrale equidistante dai 4 QG: 15/15/15/15
- costo minimo QG -> PS più vicino: 4/4/4/4
- PS irraggiungibili: 0
- strozzature a singola cella: 0
- browser E2E preparato ma NON eseguito nel container overwrite-only.

VALIDAZIONE MANUALE CONSIGLIATA
1. Avviare F9W2a1 in DEV e verificare la presenza di Snow BF - 4PL - 3x nel Setup.
2. Selezionarla: devono comparire 4 giocatori e movimento ×3.
3. Avviare un match e verificare sfondo, 4 QG, 13 PS, terreni e trap.
4. Tornare al menu, passare a Demo / Distribution e verificare che Snow BF resti disponibile
   perché ufficiale Standard / Classic.
5. Verificare che Card/Map Editor e tool DEV seguano ancora il profilo F9W2a senza regressioni.

NOTA
F9W2a è ora baseline VALIDATA. F9W2a1 resta CANDIDATA finché non viene esplicitamente
validata dopo il test manuale.
