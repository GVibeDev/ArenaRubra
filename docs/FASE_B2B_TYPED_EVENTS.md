# Arena Rubra – Fase B2b Typed Events

## Obiettivo

Convertire alcuni eventi principali da semplice `LOG_MESSAGE` a eventi tipizzati,
senza cambiare comportamento visibile o gameplay.

## Eventi convertiti

- `GAME_STARTED`
- `TURN_STARTED`
- `TURN_ENDED`
- `ECONOMY_CHANGED`
- `UNIT_SPAWNED`
- `UNIT_BUILT`
- `UNIT_MOVED`
- `UNIT_ATTACKED`
- `UNIT_DAMAGED`
- `UNIT_DESTROYED`
- `ABILITY_USED`
- `VICTORY`
- `MATCH_STATS_RECORDED`

## Regola di sicurezza

Il vecchio testo del log rimane identico o equivalente.
L'evento è un metadata layer aggiuntivo, non una nuova regola.

## Debug

In console browser, durante una partita:

```js
lastGameEvents(10)
eventCountsByType()
```

## Prossimo step possibile

B2c:
- aggiungere pannello/debug export eventi;
- oppure convertire tattiche/status/AI plan in eventi tipizzati.
