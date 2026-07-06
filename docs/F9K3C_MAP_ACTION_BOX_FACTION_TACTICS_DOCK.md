# F9K3c – Map Action Box / Faction Tactics Dock

Base: `C2-STABLE-1-F9K3a2-APK-M4c`.

## Scopo
Aggiungere sulla mappa un box azioni basso-sinistra con le tattiche di fazione del giocatore corrente.

## Cosa cambia
- Nuovo `#mapActionDock` dentro `#boardWrap`.
- Il dock mostra le tattiche della fazione del giocatore corrente.
- Ogni tattica mostra nome, costo ENE, cooldown e stato compatto.
- Stati previsti: pronta, bloccata, attiva.
- Comandi rapidi: `Usa`, `Mira`, `Annulla`.
- Le tattiche con bersaglio usano `toggleTacticMode` e quindi l’highlight già esistente della mappa.
- Le tattiche senza bersaglio vengono usate direttamente come nel pannello legacy.
- Quando si mira con una tattica dal dock, la mano rapida viene ridotta per liberare la mappa.
- Il pannello `Tattiche` legacy resta disponibile come consultazione/modalità alternativa.

## File modificati
- `index.html`
- `src/render.js`
- `css/style.css`
- `src/build_info.js`
- `src/game.js`
- `README.md`

## Non modificato
- gameplay
- AI
- deck rules
- bilanciamento
- Card Editor
- Card Pool
- custom art
- coordinate renderer F9K2d
- Starter Logic Freeze
