# C2c-1b – Hand Tactic Activation Hotfix

## Base

`arena_rubra_C2c_1a_tholos_dynamic_def_hotfix.zip`

## Problema

Le tattiche C2c-1 a danno singolo venivano riconosciute dalla UI, ma il pulsante risultava ancora disabilitato/non cliccabile.

Causa principale: `canUseHandTacticCard()` bloccava il pulsante se non trovava già bersagli validi. Questo rendeva l’attivazione troppo fragile.

## Correzione

- Il pulsante delle 5 tattiche implementate è abilitabile se:
  - è il turno del giocatore;
  - il giocatore è umano;
  - la tattica è una delle 5 implementate;
  - la mano non è bloccata;
  - l’ENE non è bloccata;
  - c’è ENE sufficiente.

- Il controllo dei bersagli avviene dopo il click:
  - se ci sono bersagli, entra in modalità targeting;
  - se non ci sono bersagli, logga chiaramente che non ci sono bersagli validi entro raggio.

- La rete standard `ally_network` viene esplicitata come:
  - unità o struttura alleata viva;
  - QG escluso.

## File modificati

- `src/tactics.js`
- `src/deployment.js`
- `src/render.js`
- `src/precheck.js`
- `data/cards_base.js`
- `src/game.js`
- `index.html`
- `README.md`

## Non modificato

- Non sono state aggiunte nuove tattiche giocabili.
- Non sono stati toccati gli effetti delle tattiche.
- Non sono stati toccati Tholos/combat hotfix.
- Non sono stati toccati AI, economia o deck generation.

## Controlli

- JS check: OK
- missing scripts: none
- duplicate function definitions: none
- duplicate blueprint IDs: none
- duplicate deck tactic IDs: none
- deck tactic total: 59/59
- deck tactic counts: Nexus 12/12, Exordium 12/12, Liberti 14/14, Agathoi 9/9, Fabeot 12/12
- playable C2c-1 statuses preserved: 5/5
- pivot counts: Nexus 1, Exordium 1, Liberti 1, Agathoi 1, Fabeot 1
- distinct pool counts: Nexus 30, Exordium 30, Liberti 30, Agathoi 30, Fabeot 30
- C2c-1b config version: True
- C2c-1b mode: True
- button text Gioca ora: True
- target count no longer disables canUse: True
- beginHandTacticCardPlay target log present: True
- ally network comment includes structure: True
