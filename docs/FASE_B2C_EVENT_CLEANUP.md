# Arena Rubra – Fase B2c Event Cleanup / Debug Bridge

## Obiettivo

Completare il ponte eventi prima di passare alla separazione del render.

## Eventi aggiunti o ripuliti

- `TACTIC_USED`
- `STATUS_APPLIED`
- `STATUS_EXPIRED`
- `AI_PLAN_CHANGED`
- `PS_CONTROL_CHANGED`

## Nota su PS_CONTROL_CHANGED

Il controllo dei PS ora genera eventi dati tramite `emitGameEvent`.
Non aggiunge nuove righe al log visibile, quindi non cambia la leggibilità della partita.

## Funzioni debug/export

In console browser:

```js
lastGameEvents(10)
eventCountsByType()
exportEventsJson()
copyEventsJson()
downloadEventsJson()
```

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio bilanciamento.
Solo metadata eventi e strumenti debug.

## Prossimo step

B3 – Render isolation.
