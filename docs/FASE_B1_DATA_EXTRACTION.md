# Arena Rubra – Fase B1 Data Extraction

Obiettivo: spostare dati e costanti fuori da `src/main.js` mantenendo invariato il gameplay.

## File resi operativi

- `data/maps.js`
- `src/constants.js`
- `data/factions.js`
- `data/units_base.js`
- `data/tactics_base.js`

## File ancora placeholder

- `src/state.js`
- `src/render.js`
- `src/rules.js`
- `src/combat.js`
- `src/economy.js`
- `src/statuses.js`
- `src/abilities.js`
- `src/ai.js`
- `src/stats.js`

## Nota tecnica

I file sono ancora caricati come normali script browser, non come ES modules.
Questo riduce il rischio di errori CORS/import nella fase iniziale.

La prossima fase consigliata è B1.5:

- `src/enums.js`
- `src/hex.js`
- eventuale `src/events.js` minimale
