# Arena Rubra – Fase B7d AI Action/Combat/Ability Extraction

## Obiettivo

Spostare in `src/ai.js` il blocco operativo dell'AI:

- azioni da fermo;
- attacco puro;
- follow-up dopo movimento;
- gestione Spinta di Guerra;
- gestione moveAttack;
- emergency action;
- scoring bersagli;
- scoring abilità.

## Aggiornato

- `src/ai.js`

## Estratto

- `botTryStationaryAction`
- `botTryAttackOnly`
- `finishBotMove`
- `emergencyBotAction`
- `scoreAttackTarget`
- `scoreAbility`

## Cosa resta nel main

Il `main.js` mantiene ancora:

- bootstrap/new game;
- click/selection/controller;
- turn flow;
- start/end turn;
- status applicati dal flusso turno;
- render helpers/UI summaries residue;
- endUnitAction e funzioni di selezione.

I blocchi AI principali risultano ora concentrati in `src/ai.js`.

## Regola di sicurezza

Nessuna nuova meccanica.
Nessun cambio AI intenzionale.
Solo spostamento fisico del blocco action/combat/ability.

## Test consigliati

- bot usa abilità curative;
- bot usa abilità offensive;
- bot attacca bersagli adiacenti;
- veicolo esegue follow-up corretto;
- Spinta di Guerra non rompe il turno;
- moveAttack funziona;
- emergenza QG/pressione funziona;
- unità morta durante azione non causa freeze;
- botRunning non resta bloccato;
- partita bot vs bot completa.
