# Arena Rubra – Fase B8c Input / Controller Extraction

## Obiettivo

Spostare fuori dal `main.js` il controller umano.

## Nuovo modulo

- `src/controller.js`

## Estratto da `main.js`

- `handleCellClick`
- `toggleAbilityMode`
- `passUnit`
- `clearSelection`
- `isAttackTarget`
- `isAbilityTarget`

## Non toccato

Restano nel `main.js`:

- `staticLimitLabel`
- `unitCardHtml`
- `doctrineSummary`
- `unitStatusSummary`
- `statusPillsHtml`
- `hasAnyInhibition`
- `adjacentAlliedAuras`
- `attackAuraBonus`
- `defenseAuraBonus`

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI.
Nessun cambio al flusso turno.
Solo estrazione del controller umano.

## Test consigliati

- click su unità propria;
- click su unità nemica per attacco;
- click su cella valida per movimento;
- click su spawn valido;
- acquisto unità e piazzamento;
- uso abilità target;
- abilità self;
- pass unità;
- annullamento selezione;
- tattiche target;
- costruzione struttura;
- fine turno dopo azione;
- bot dopo turno umano.
