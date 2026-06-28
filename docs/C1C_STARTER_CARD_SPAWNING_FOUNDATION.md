# Arena Rubra – C1c Starter Card Spawning Foundation

## Obiettivo

Rendere operative le starter cards fuori deck senza attivare ancora la mano/deck come sistema completo.

## Starter cards operative

Per ogni giocatore:

- fanteria leggera starter;
- veicolo leggero starter;
- struttura starter.

## Modificati

- `src/deployment.js`
- `src/render.js`
- `index.html`
- `css/style.css`
- `README.md`
- `docs/`

## Nuove funzioni

In `src/deployment.js`:

- `starterCardsForPlayer`
- `starterCardByUid`
- `blueprintForStarterCard`
- `starterCardActionState`
- `beginStarterCardPurchase`

In `src/render.js`:

- `renderStarterCardSlotDebug`

## Regole operative

Le starter cards:

- non stanno nel deck;
- non vengono consumate;
- usano il blueprint associato;
- rispettano ENE disponibile;
- rispettano cap e limiti esistenti;
- usano le stesse celle di sbarco del mercato;
- per le strutture richiedono un costruttore attivo selezionato.

## Non modificato

- mano ancora non giocabile;
- deck ancora non consumato;
- pesca non introdotta;
- tattiche non ancora carte in mano;
- AI non adattata al deck;
- mercato vecchio ancora presente;
- economia invariata;
- combattimento invariato;
- condizioni vittoria invariate.

## Test consigliati

- nuova partita human vs bot;
- starter fanteria: click, scelta cella blu, spawn;
- starter veicolo: click, scelta cella blu, spawn;
- starter struttura: selezionare costruttore attivo, click starter struttura, costruzione;
- ENE scalata correttamente;
- cap rispettati;
- mercato vecchio ancora funzionante;
- bot vs bot ancora funzionante;
- `runPrecheck()`;
- `cardDebugSummary()`;
- `cardZoneDebugSummary()`;
- nessun errore console.
