# C2c-6a-fix – Bot card reference runtime hotfix

## Problema
Durante il turno del bot poteva comparire l'errore runtime:

```text
card is not defined
```

## Causa
In `src/ai.js`, dentro `chooseBotPurchase()`, il ramo di acquisto dal mercato usava per errore `effectiveHandUnitCardCost(player, card, bp, c)`.

In quel contesto però il bot non sta giocando una carta dalla mano: sta valutando il mercato/roster. Quindi la variabile `card` non esiste.

## Fix
Nel ramo mercato di `chooseBotPurchase()` il costo viene ora calcolato solo con:

```js
effectiveBlueprintCost(player, bp, c)
```

Gli sconti C2c-6a sulle carte pescate restano gestiti nel ramo corretto, cioè `chooseBotHandCardPlay()` / gioco dalla mano.

## File toccati
- `src/ai.js`

## Note
La patch non modifica le tattiche C2c-6a, non modifica pesca, bonus ATT o sconti carta. Corregge solo la reference errata nel bot.
