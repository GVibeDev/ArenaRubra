# C2-FINAL-D1 – Tactical UX / Map Readability

Obiettivo: migliorare leggibilità e fluidità dei test senza modificare il gameplay.

## Modifiche

1. **ATT visibile in mappa**
   - La mini-etichetta delle unità mostra ora `HP`, `D` e `A`.
   - Il valore ATT usa `effectiveAtt(unit)`, quindi riflette bonus temporanei/aura già applicati dal motore.

2. **Movimento immediato alla selezione**
   - Quando il giocatore umano clicca una propria unità attiva e mobile, il gioco entra automaticamente in modalità movimento.
   - Le celle raggiungibili vengono evidenziate subito.
   - Clic su una cella evidenziata muove l'unità.
   - Clic su un nemico adiacente resta valido per l'attacco se l'unità può attaccare.
   - Il pulsante `Annulla movimento` resta come fallback.

## Non modificato

- Nessuna modifica ad AI.
- Nessuna modifica a tattiche, abilità, comandanti, costi o stat.
- Nessuna modifica a deck, mano, cap mano, recupero deck o income.
- Nessuna modifica alle regole di movimento: cambia solo la UX di selezione.
