# C2-FINAL-A – Starter Flow / Hand Cap / Deck Recovery

Questa patch parte da **C2c-8c-fix – Stolen Unit Spawn Hotfix** validata e non aggiunge nuove tattiche, nuove abilità o nuovi effetti carta.

Obiettivo: rendere più fluido lo Starter Game su mappa minimale e preparare il successivo pass di bilanciamento numerico.

## Modifiche di flusso

1. **Income base aumentato**
   - `BASE_INCOME` passa da 2 a 3 ENE.
   - L'income resta: base + territorio/strutture/dottrine/effetti economici.

2. **Cap mano**
   - `maxHandSize` impostato a 10.
   - Ogni pescata da deck controlla la dimensione della mano.
   - Se la mano ha già 10 carte, la carta pescata viene messa direttamente negli scarti.
   - Il log mostra: `Mano piena (10): [carta] viene pescata ma va direttamente negli scarti.`

3. **Recupero deck**
   - Se deck vuoto + mano vuota + scarti non vuoti + almeno 5 ENE:
     - il giocatore può pagare 5 ENE;
     - gli scarti vengono rimescolati nel deck;
     - il giocatore pesca 3 carte.
   - Per il giocatore umano compare il pulsante nel banner mano/deck.
   - Il bot usa automaticamente il recupero se la condizione è valida durante il proprio turno.

## Note importanti

- Il cap mano si applica alle pescate da deck.
- Le carte perse per overdraw restano nei runtime card zones e quindi non rompono la validazione deck.
- Gli effetti di pesca che applicano bonus/sconti li applicano solo alle carte effettivamente entrate in mano, non alle carte mandate direttamente negli scarti per mano piena.
- Non sono state modificate singole carte per bilanciamento.

## File principali modificati

- `src/constants.js`
- `data/cards_base.js`
- `src/deck.js`
- `src/tactics.js`
- `src/render.js`
- `src/ai.js`
- `src/game.js`
- `src/precheck.js`
- `css/style.css`
- `index.html`

