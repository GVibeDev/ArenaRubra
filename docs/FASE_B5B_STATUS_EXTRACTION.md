# Arena Rubra – Fase B5b Status Extraction

## Obiettivo

Spostare in `src/statuses.js` la gestione generale degli stati, senza cambiare gameplay.

## File reso operativo

- `src/statuses.js`

## Estratto

- `STATUS_DEFINITIONS`
- `tickStatuses`
- `tickDurationOnly`
- `getStatus`
- `hasStatus`
- `statusBlocks`
- `canAct`
- `canMove`
- `canUseAbility`
- `applyStatus`
- `statusText`
- `tickCooldownsAndBuffs`

## Copertura della fase

Questa fase riguarda:

- definizioni status;
- status che bloccano azione/movimento/attacco/abilità;
- applicazione status;
- descrizione testuale status;
- tick e scadenza status;
- cooldown e buff temporanei;
- danno periodico del Sanguinamento tramite `STATUS_DEFINITIONS.bleed.tick`.

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio economia.
Nessun cambio abilità.
Nessun cambio rendering.
Solo spostamento fisico delle funzioni status.

## Nota

`STATUS_DEFINITIONS.bleed.tick()` chiama ancora `applyDamage()`, definita in `combat.js`.
Questo va bene perché la funzione viene eseguita a runtime, quando tutti gli script sono già caricati.

## Prossimo step consigliato

B5c – Abilities extraction:

- `ABILITY_HANDLERS`
- `abilityTargets`
- `canUseAbility` eventualmente potrà restare qui o essere richiamata da abilities;
- `useAbility`
- helper target/valutazione abilità.
