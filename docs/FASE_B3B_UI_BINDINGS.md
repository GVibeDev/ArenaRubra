# Arena Rubra – Fase B3b UI Bindings Isolation

## Obiettivo

Separare i binding DOM dal motore principale.

## Nuovo file operativo

- `src/ui.js`

## Cosa è stato spostato

- `newGameBtn`
- `resetStatsBtn`
- `copyStatsBtn`
- `endTurnBtn`
- `runBotBtn`
- `concedeBtn`
- `autoResignToggle`
- `botAiMode`
- `pacePreset`
- `p1Mode`
- `p2Mode`
- `p1Faction`
- `p2Faction`
- `initiativeMode`
- chiamata iniziale `newGame()`

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio combat/economia/stati.
Nessun cambio render.

## Nota architetturale

`src/ui.js` è ancora un adapter browser semplice: usa funzioni globali del motore.
Il passo serve a separare "come l'utente clicca" da "cosa il gioco fa".

## Prossimo step possibile

B3c:
- separare altri helper UI minori;
- oppure iniziare B4 con `state.js` e funzioni di inizializzazione stato.
