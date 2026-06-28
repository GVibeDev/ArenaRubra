# Arena Rubra – C1b Hand/Deck Debug UI Foundation

## Obiettivo

Rendere visibile in interfaccia la fondazione C1a di carte, deck, mano, scarti e starter cards.

## Modificati

- `src/render.js`
- `index.html`
- `css/style.css`
- `README.md`
- `docs/`

## Nuove funzioni render/debug

- `cardTypeLabel`
- `cardRoleLabel`
- `cardLabel`
- `renderCardInstanceDebug`
- `renderStarterCardsDebug`
- `renderPlayerHandDebug`
- `cardZoneDebugHtml`
- `renderCardZonePanel`

## Cosa mostra la UI

Per G1 e G2:

- conteggio deck;
- conteggio mano;
- conteggio scarti;
- starter cards fuori deck;
- 5 carte in mano debug/passiva.

## Non modificato

- mercato attuale;
- acquisto/spawn;
- tattiche attuali;
- AI;
- turn flow;
- economia;
- condizioni vittoria;
- deck/hand logic;
- giocabilità reale delle carte in mano.

## Test consigliati

- nuova partita;
- pannello Carte – debug passive visibile;
- deck G1/G2 = 25 dopo mano iniziale;
- mano G1/G2 = 5;
- scarti G1/G2 = 0;
- starter cards visibili;
- mercato ancora funzionante;
- bot vs bot;
- human vs bot;
- nessun errore console;
- `runPrecheck()`;
- `cardDebugSummary()`;
- `cardZoneDebugSummary()`.
