# Changelog F9Q1–F9Q3

Build candidata: `C2-STABLE-1-F9Q3-APK-M4c`  
Baseline: `C2-STABLE-1-F9O7g-APK-M4c`

## F9Q1 — Fondazione dati

- Aggiunto schema mappa JSON versione 1.
- Aggiunti registry terreni e API comuni per celle, QG, PS, deployment e pericoli.
- Aggiunta composizione di uno, due o tre esagoni con deduplicazione delle celle.
- Migrata MAP1 al nuovo contratto mantenendo geometria, QG, PS e movimento storico.
- Aggiunti normalizzazione, validazione, storage, duplicazione e import/export.

## F9Q2 — Multiplayer e terreni

- Aggiunte MAP2 a tre giocatori e MAP3 a quattro giocatori.
- Generalizzati setup, stato, turni, eliminazione, vittoria, deck, missioni, HUD, log e statistiche per G1–G4.
- Aggiunta selezione bersaglio IA FFA basata su minaccia, obiettivi, pressione e distanza.
- Aggiunti movimento pesato e moltiplicatore di mappa ×1/×2/×3.
- Aggiunti ostacolo, difficile, difensivo e scoperto senza modificare valori base delle unità.
- Aggiunti pericoli iniziali di mappa distinti da terreni e carte.
- Aggiunti metadati mappa e giocatori a eventi, telemetria, storico e resume.

## F9Q3 — Editor

- Aggiunta schermata Editor mappe e terreni.
- Aggiunti modelli singolo, doppio, triplo e vuoto, oltre alle copie delle mappe integrate.
- Aggiunti nome, descrizione, tag, giocatori, movimento e parametri delle componenti.
- Aggiunti strumenti cella, terreno, ruolo, pericolo, pan, zoom, fit e normalizzazione componenti.
- Aggiunti replica rispetto ai QG, radiale 3/4, specchio e rotazioni, con anteprima e collisioni segnalate.
- Aggiunti annulla/ripeti, validazione live, salvataggio locale, JSON e Match Lab.
- Le sessioni Match Lab non vengono registrate nelle statistiche competitive.

## Correzioni emerse dal collaudo

- Resi dinamici per G1–G4 la mano iniziale, il debug deck e il preflight runtime.
- Resa nulla-safe l’inizializzazione della selezione unità prima dell’avvio partita.
- Resi dinamici i bucket statistici e il pannello statistiche per G3/G4.
- Deduplicati i pericoli iniziali fra definizione e celle.
- Rimossi quattro ostacoli periferici di MAP3 che creavano due strozzature a cella singola, conservando la simmetria a 180°.

## Invarianti

- Catalogo carte, roster, tattiche, fazioni, costanti di bilanciamento, scala di gioco e scenari tutorial sono byte-per-byte identici alla baseline.
- Il CSS della baseline è conservato come prefisso esatto; gli stili F9Q sono aggiunti in coda.
- Lezioni 1–5 e gerarchia delle anteprime sopra lo scrim sono mantenute.
