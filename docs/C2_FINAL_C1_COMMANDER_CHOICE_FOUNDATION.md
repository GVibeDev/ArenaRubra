# C2-FINAL-C1 – Commander Choice Foundation

## Obiettivo

Introdurre la scelta comandante pre-partita senza alterare il resto del gameplay C2-FINAL.

La scelta comandante diventa il primo ponte verso archetipi interni di fazione: ogni fazione ha due comandanti possibili, ma ogni giocatore porta in partita un solo comandante.

## Regola implementata

- Ogni fazione possiede 2 blueprint di tipo `Comandante`.
- Il pannello Opzioni di gioco mostra un selettore comandante per G1 e G2.
- Il selettore si aggiorna quando cambia la fazione.
- Alla nuova partita, `state.selectedCommanders` salva gli ID scelti.
- Il deck builder filtra i comandanti e include solo il comandante scelto.
- La mano iniziale continua a pescare forzatamente 1 comandante.
- Il validatore runtime continua ad aspettarsi 1 solo comandante nel deck+mano+scarti.

## Comandanti aggiunti

- Nexus: `NXCMD02` – Coordinatore di Campo.
- Exordium: `EXCMD02` – Stratega Corazzato.
- Liberti: `LXCMD02` – Matriarca Sanguis.
- Agathoi: `AGCMD02` – Ierofante delle Radici.
- Fabeot: `FBCMD02` – Archivista Capestro.

## Comandanti esistenti mantenuti

- Nexus: Avatex.
- Exordium: Pretore di Aurex.
- Liberti: Capobanda Liberto.
- Agathoi: Demagos Verde.
- Fabeot: Agente Porpora.

## Note di design

Le abilità dei nuovi comandanti usano handler già esistenti. Questa patch crea la struttura di scelta e un primo prototipo giocabile; il bilanciamento e la rifinitura delle identità comandante restano rinviati al pass dedicato C2-FINAL-C2.

## File modificati

- `index.html`
- `css/style.css`
- `data/units_base.js`
- `data/cards_base.js`
- `src/cards.js`
- `src/deck.js`
- `src/state.js`
- `src/ui.js`
- `src/render.js`
- `src/game.js`
- `src/precheck.js`
- `README.md`

## Non modificato

- Nessuna nuova tattica.
- Nessuna nuova economia.
- Nessuna modifica a cap mano o deck recovery.
- Nessuna modifica AI tattiche C2.
- Nessun refactor massivo.
