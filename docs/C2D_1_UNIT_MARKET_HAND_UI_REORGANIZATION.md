# C2d-1 – Unit Market / Hand UI Reorganization

Base: `arena_rubra_C2c_8_reactions_opportunity_counterattack.zip` validata.

Questa patch corregge la rotta dopo il fraintendimento su C2d-2: il pannello da ridurre non era quello delle tattiche/abilità di fazione, ma il mercato unità.

## Modifiche

- La sezione mano/deck C2 viene posizionata sopra il mercato unità.
- Il mercato unità diventa un pannello `<details>` chiuso di default, etichettato come debug roster.
- La mano riceve un banner sticky con:
  - round e giocatore di turno;
  - deck/mano/scarti per G1 e G2;
  - depot ENE per G1 e G2;
  - income stimato per G1 e G2.
- L'area scrollabile della mano contiene solo starter e carte in mano.
- Le carte tattica in mano sono più compatte ma mostrano ancora costo ENE ed effetto.
- Mano e mercato hanno resize verticale CSS prudente.

## Non modificato

- Nessuna tattica nuova.
- Nessun cambio a AI, combat, economia o deck.
- Il vecchio pannello tattiche/abilità di fazione resta aperto e invariato.
