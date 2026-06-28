# Piano Fase B – Modularizzazione controllata

## B0 – Separazione sicura
CSS e JS estratti da HTML. Nessuna modifica al comportamento.

## B1 – Data extraction
Spostare fazioni, unità, tattiche e mappe in `data/`.
Obiettivo: ridurre la massa di `main.js` senza toccare le regole.

## B2 – State + Render
Spostare stato e rendering in `src/state.js` e `src/render.js`.

## B3 – Rules engine
Spostare turni, vittoria, cap, PS/QG in `src/rules.js`.

## B4 – Combat, Economy, Statuses, Abilities
Separare:
- `combat.js`
- `economy.js`
- `statuses.js`
- `abilities.js`

## B5 – AI + Stats
Estrarre:
- `ai.js`
- `stats.js`

## B6 – Verifica regressione
Confrontare contro BASELINE FASE A:
- avvio partita
- bot vs bot
- acquisti
- movimento
- combattimento
- tattiche
- stati
- log
- statistiche matchup
