# Arena Rubra – C1e Hand Unit Cards Playable Foundation

## Obiettivo

Rendere giocabili dalla mano le carte unità pescate dal deck.

## Cosa ora è giocabile dalla mano

- Comandanti;
- pivot;
- unità pesanti;
- unità elite;
- eventuali strutture presenti nel deck.

## Flusso

1. Il giocatore umano clicca `Gioca carta` su una carta unità in mano.
2. Se è fanteria/veicolo/comandante/pivot non-struttura:
   - modalità spawn;
   - selezione cella valida;
   - pagamento ENE;
   - unità piazzata;
   - carta rimossa dalla mano;
   - carta mandata negli scarti.
3. Se è struttura:
   - serve costruttore attivo selezionato;
   - modalità build;
   - selezione cella valida;
   - pagamento ENE;
   - struttura costruita;
   - carta rimossa dalla mano;
   - carta mandata negli scarti.

## Modificati

- `data/cards_base.js`
- `src/state.js`
- `src/deck.js`
- `src/deployment.js`
- `src/controller.js`
- `src/render.js`
- `src/game.js`
- `index.html`
- `css/style.css`
- `README.md`
- `docs/`

## Nuove funzioni

In `src/deck.js`:

- `handCardByUid`
- `isPlayableUnitHandCard`
- `isPlayableTacticHandCard`
- `discardPlayedHandCard`

In `src/deployment.js`:

- `blueprintForHandCard`
- `handCardActionState`
- `beginHandCardPlay`
- `completeHandCardUnitPlay`

In `src/render.js`:

- `renderHandCardSlotDebug`

## Nuovo contesto UI

In `src/state.js`:

- `pendingHandCardUid`

## Non modificato

- tattiche in mano non ancora giocabili;
- AI non ancora adattata al deck;
- mercato vecchio ancora presente;
- starter cards ancora operative;
- pesca C1d invariata;
- economia invariata;
- combattimento invariato;
- condizioni vittoria invariate.

## Test consigliati

- nuova partita human vs bot;
- `runPrecheck()`;
- carta unità in mano con pulsante `Gioca carta`;
- giocare comandante/pesante/elite/pivot dalla mano;
- ENE scalata;
- carta rimossa dalla mano;
- carta aggiunta agli scarti;
- deck invariato quando una carta viene giocata dalla mano;
- struttura da mano richiede costruttore attivo;
- annullamento selezione non consuma carta;
- starter cards ancora funzionanti;
- mercato vecchio ancora funzionante;
- bot vs bot;
- nessun errore console.
