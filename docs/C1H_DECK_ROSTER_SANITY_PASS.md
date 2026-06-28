# Arena Rubra – C1h Deck/Roster Sanity Pass

## Regola deck

- Deck target: 30 carte.
- Ogni carta può comparire massimo 2 volte.
- Pivot e comandanti possono comparire massimo 1 volta per carta.
- Il deck pool include tutte le carte fazione non-QG: base, pesanti, elite, pivot, comandanti e tattiche.

## Apertura

L'ordine deterministico del deck debug viene stabilizzato per aprire con:

1. comandante;
2. due carte base, se disponibili;
3. due carte speciali unità, se disponibili.

La pesca e il ciclo mano/scarti restano quelli validati in C1d/C1e.

## Sanity report

Nuove funzioni console:

- `deckSanityForFaction(faction)`
- `deckSanitySummary()`

La UI debug carte mostra pool, capacità legale e copie extra debug.

## Nota Liberti

Con il roster attuale, Liberti non ha abbastanza carte uniche per costruire un deck da 30 rispettando rigidamente max 2 copie e 1 copia per pivot/comandante.

Per non bloccare il tester, C1h mantiene il deck a 30 con copie extra debug e lo segnala. Questo non è il deckbuilder finale: è una compatibilità da tester finché il roster Liberti non verrà ampliato.
