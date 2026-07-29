# F9R3 — Proportional Pressure & Official Map Set

Build candidata: `C2-STABLE-1-F9R3-APK-M4c`  
Baseline validata: `C2-STABLE-1-F9O7h3-APK-M4c`

## Pressione proporzionale

Introdotto il fattore:

```text
C = ceil((PS totali + giocatori) / 2)
```

Profilo Standard:

- avvio Pressione al round `20 + C`;
- 7 incrementi necessari;
- limite round 50.

Profilo Rapida/Competitive:

- avvio Pressione al round 20;
- 5 incrementi necessari;
- limite round `30 + C`.

Per avanzare occorre controllare il PS centrale e almeno `ceil(PS totali / 2)` PS complessivi. Il PS centrale è incluso nella soglia. Se più giocatori soddisfano il requisito nello stesso checkpoint, nessuno riceve l’incremento.

HUD, log, eventi, AI e spareggio leggono il profilo dinamico della partita.

## PS centrale

- aggiunto `centralStrategicPointId` allo schema runtime;
- aggiunti helper condivisi per centro, coordinate e distanze lineari;
- eliminata la dipendenza dalle coordinate storiche di MAP1 nei moduli IA, Missioni, camera e mobile;
- il validatore richiede un solo centro, ID univoco e distanza esagonale lineare identica da tutti i QG;
- l’Editor permette di assegnare il ruolo `PS centrale` e mostra `PS★` nella preview;
- la rimozione del centro invalida correttamente la mappa;
- i nuovi pericoli dell’Editor ricevono ID univoci derivati dalle coordinate.

## Mappe ufficiali

Aggiunte come mappe integrate ufficiali e in sola lettura:

- Diamond 4 — 4 giocatori, 469 celle, 9 PS, MOV ×3;
- Claustro Clash — 4 giocatori, 127 celle, 7 PS, MOV ×2;
- Narrow Path — 2 giocatori, 229 celle, 4 PS, MOV ×2;
- Triple Battlefield — 4 giocatori, 575 celle, 7 PS, MOV ×3;
- The Valley — 3 giocatori, 383 celle, 7 PS, MOV ×2.

Campo Starter resta attiva come sesta mappa ufficiale.

Le vecchie `map2_triumvirate` e `map3_quadrivium` restano risolvibili per compatibilità con salvataggi e log, ma sono disabilitate nei selettori perché non possiedono un PS equidistante dai QG.

## Correzioni dati applicate

- Triple Battlefield: PS `[2,3,-5]` designato come centro, distanza 11 da tutti i QG; rimosso il doppio ID `ps-7`;
- The Valley: confermata a 3 giocatori; descrizione corretta; quattro mine iniziali rese univoche;
- Narrow Path: sfondo WebP portatile estratto e incluso come asset statico;
- tutte le mappe: centro normalizzato come `ps-center`, tag `central`, coordinate/ruoli/pericoli validati.

## Compatibilità

Nessuna modifica a carte, statistiche, costi, targeting, cap strutture o decisioni tattiche già validate. Restano incluse tutte le ottimizzazioni e correzioni di F9O7h3.
