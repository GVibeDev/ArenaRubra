# C2c-8c-fix – Stolen Unit Spawn Hotfix

## Problema

Durante i test Fabeot, `Esproprio di Mano` dell'Agente Espropriatore copiava correttamente carte dalla mano nemica. Le tattiche copiate erano giocabili, mentre le carte unità copiate da altra fazione risultavano pronte in UI ma non venivano piazzate quando si cliccava una cella valida di sbarco.

Il log non mostrava errori e la console restava pulita.

## Causa

`beginHandCardPlay()` risolveva correttamente il blueprint della carta unità copiata usando `blueprintForHandCard()`, che supporta carte di fazione diversa.

Al momento del click su mappa, però, `handleCellClick()` rileggeva il blueprint così:

```js
blueprintById(pendingPurchaseBlueprintId, state.factions[state.currentPlayer])
```

Per un Fabeot che copia una unità Nexus/Exordium/Liberti/Agathoi, questa ricerca falliva perché il blueprint non apparteneva alla fazione Fabeot.

## Fix

Aggiunto helper centrale:

```js
pendingBlueprintForHandOrMarket(player, pendingBlueprintId)
```

Se esiste una carta mano pendente, l'helper risolve il blueprint dalla carta stessa tramite `blueprintForHandCard()`. In assenza di carta mano pendente, mantiene il comportamento mercato/roster normale.

Aggiornati:

- `src/deployment.js`
- `src/controller.js`

## Effetti attesi

- Le unità copiate/rubate da altre fazioni possono essere piazzate/costruite dalla mano.
- Le carte tattica copiate/rubate restano invariate.
- Il mercato unità/debug continua a usare i blueprint della fazione corrente.
- Le carte unità normali della propria fazione continuano a funzionare.

## Perimetro

Nessuna modifica a tattiche, AI, economia, combat, status, UI o deck composition.
