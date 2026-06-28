# Arena Rubra – Fase B1.5 Enums + Hex utilities

Obiettivo: migliorare scalabilità e portabilità senza cambiare gameplay.

## Nuovi file operativi

- `src/enums.js`
- `src/hex.js`

## Perché `hex.js`

La geometria esagonale è usata da movimento, range abilità, AI, PS e QG.
Separarla rende il codice più portabile verso un futuro engine e riduce la duplicazione mentale.

## Perché `enums.js`

Gli enum centralizzano nomi ricorrenti:

- tipi unità
- pesi unità
- fazioni
- stati
- abilità
- condizioni di vittoria
- modalità giocatore

In B1.5 gli enum sono introdotti in modo prudente.
La sostituzione delle stringhe magiche dentro `main.js` sarà graduale, per evitare regressioni.

## Controllo

Il codice resta caricato come normali script browser, non ES modules.
Questo mantiene compatibilità con apertura diretta di `index.html`.
