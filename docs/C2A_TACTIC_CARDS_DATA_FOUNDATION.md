# C2a – Tactic Cards Data Foundation

## Obiettivo

Inserire le 59 tattiche deck C2 nel catalogo carte e nei deck automatici.

## Regola

Le tattiche C2a sono pescabili ma ancora data-only:
- appaiono nel deck;
- appaiono in mano;
- non sono ancora giocabili;
- saranno risolte da C2c.

Le tattiche starter/base già presenti in `data/tactics_base.js` restano fuori deck e sempre disponibili.

## Tattiche inserite

- Nexus: 12
- Exordium: 12
- Liberti: 14
- Agathoi: 9
- Fabeot: 12

Totale: 59.

## File aggiunto

- `data/tactics_cards_c2.js`

## File modificati

- `index.html`
- `data/cards_base.js`
- `src/cards.js`
- `src/deck.js`
- `src/deployment.js`
- `src/render.js`
- `src/precheck.js`
- `src/game.js`
- `README.md`

## Non incluso

- targeting tattiche dalla mano;
- pagamento ed effetto tattiche dalla mano;
- AI tattiche deck;
- rimozione vecchio pannello tattiche.

## Controlli

- JS check: OK
- duplicate function definitions: none
- duplicate blueprint IDs: none
- duplicate deck tactic IDs: none
- C2a config version: True
- C2a config mode: True
- DECK_TACTICS file present: True
- DECK_TACTICS script linked: True
- buildCardCatalog uses DECK_TACTICS: True
- old starter TACTICS excluded from card catalog source: True
- unique_pool_first enabled: True
- deck tactic total: 59/59
- deck tactic counts: Nexus 12, Exordium 12, Liberti 14, Agathoi 9, Fabeot 12
- unit counts: Nexus 18, Exordium 18, Liberti 16, Agathoi 21, Fabeot 18
- distinct pool counts: Nexus 30, Exordium 30, Liberti 30, Agathoi 30, Fabeot 30
- auto-deck tactic copies in template: Nexus 12, Exordium 12, Liberti 14, Agathoi 9, Fabeot 12
