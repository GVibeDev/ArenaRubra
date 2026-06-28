# Arena Rubra – Fase B3c-precheck

## Obiettivo

Aggiungere un controllo diagnostico prima di passare alle fasi più invasive.

## Nuovo file

- `src/precheck.js`

## Controlli effettuati

- `FACTIONS`, `BLUEPRINTS`, `TACTICS`, `STATUS_DEFINITIONS`, `ABILITY_HANDLERS`, `TACTIC_HANDLERS` definiti
- fazioni con roster/comandante/struttura/pivot
- ID duplicati su unità e tattiche
- blueprint senza nome/id/fazione/tipo/peso
- costi/statistiche non validi
- ability kind senza handler
- tactic kind senza handler
- status referenziati ma non definiti
- strutture con ATT > 0
- handler orfani informativi

## Uso console

```js
runPrecheck()
precheckSummary()
exportPrecheckJson()
copyPrecheckJson()
```

## Regola di sicurezza

Il precheck non modifica gameplay, AI, economia, stati o render.
È solo diagnostica.

## Prossimo step consigliato

Se B3c gira pulito:

- B4a: estrazione `state.js` e funzioni di inizializzazione stato;
- oppure B4-pre: ulteriore cleanup di funzioni core prima di rules/combat/economy.
