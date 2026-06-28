# Arena Rubra – Fase B6b Turn Economy Extraction

## Obiettivo

Spostare fuori dal `main.js` la risoluzione economica di inizio turno, lasciando nel main la sequenza del turno.

## Aggiornato

- `src/economy.js`

## Aggiunto / spostato

- `resetTurnEconomyFlags(player)`
- `resolveStartTurnIncome(player, first=false)`
- `tickPlayerEffects(player, timing)`

## Modifica a `startTurn`

Prima:

```js
if (state.fabeotEconomyAbilityUsed) ...
if (state.fabeotConversionUsed) ...
...
if (state.turnsStarted[player] > 0) {
  // income completo
}
```

Ora:

```js
resetTurnEconomyFlags(player);
...
resolveStartTurnIncome(player, first);
```

## Cosa resta nel main

- ordine generale del turno;
- tick PS lock;
- status start/end;
- reset azioni unità;
- tattiche cooldown;
- auto-resign;
- chiamata bot.

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio combat/status/abilità/tattiche/render.
Solo spostamento fisico della risoluzione economica di inizio turno.

## Prossimo step possibile

B6c:

- ulteriore cleanup di start/end turn;
- oppure estrazione deployment/spawn/build helpers.
