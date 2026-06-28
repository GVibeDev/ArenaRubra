# C2c-6a-fix2 – Runtime Deck Shuffle / Draw Testability

## Obiettivo

Rendere testabili le tattiche di pesca di C2c-6a evitando che il deck runtime resti ordinato per ruolo/tipo.

## Modifiche

- Aggiunta funzione `shuffleCardsRuntime(cards)` in `src/deck.js`.
- Aggiunto toggle `runtimeDeckShuffleAfterInitialHand: true` in `data/cards_base.js`.
- `createInitialHandFromDeck()` mantiene la mano iniziale controllata, poi mischia solo il deck rimanente.
- `state.cardDebug` espone:
  - `runtimeDeckShuffled`
  - `runtimeDeckShuffleMode`
- Il precheck stampa la modalità di shuffle runtime.
- Log di avvio: `Runtime deck shuffled: G1 25 carte, G2 25 carte. Mano iniziale controllata mantenuta.`

## Non modificato

- Composizione legale del deck.
- Limite copie.
- Mano iniziale controllata.
- Starter cards.
- Tattiche C2c-6a.
- AI.

## Test consigliati

1. Avviare nuova partita e controllare il log `Runtime deck shuffled`.
2. Verificare precheck senza problemi.
3. Controllare che i deck siano ancora 25 carte e le mani 5 carte.
4. Testare `Tributo dei Clan`: deve poter pescare una fanteria e attivare la seconda pesca.
5. Testare `Richiesta rifornimenti`: deve poter pescare tattica + seconda carta non necessariamente tattica.
6. Testare `Rifornimenti in arrivo`: se pesca veicoli, il bonus +1 ATT deve restare sulla carta.
7. Testare `Carovane di Mercanti`: pesca multipla realistica con deck mischiato.
