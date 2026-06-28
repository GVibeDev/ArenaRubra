# C2c-1 – Single Damage Tactics Playable

## Base

`arena_rubra_C2b_tactic_hand_ui_debug_refinement.zip`

## Obiettivo

Rendere giocabili dalla mano solo le tattiche C2 a danno singolo diretto.

## Tattiche abilitate

- `NXTAC01 – Colpo di mortaio`: 2 danni a unità nemica.
- `NXTAC02 – Artiglieria di precisione`: 4 danni a unità nemica.
- `EXTAC01 – Artiglieria anticarro`: 2 danni a unità nemica, 3 se Veicolo.
- `EXTAC02 – Artiglieria pesante`: 4 danni a struttura nemica.
- `LBTAC06 – Carica da Demolizione`: 5 danni a struttura nemica entro R1 da fanteria/veicolo Liberti alleato.

## Regole implementate

- Le tattiche abilitate mostrano il pulsante `Gioca tattica`.
- Il costo ENE viene pagato alla risoluzione.
- La carta usata viene scartata.
- Il danno usa `applyDamage`, quindi rispetta DEF/HP e distruzione esistente.
- Le altre tattiche C2 restano data-only.

## Non implementato

- AoE.
- Sanguinamento.
- Debuff.
- Distruzione diretta.
- Trappole/celle.
- Economia/pesca.
- Conversione/Fabeot.
- Uso AI delle tattiche deck.

## Controlli

- JS check: OK
- missing scripts: none
- duplicate function definitions: none
- duplicate blueprint IDs: none
- duplicate deck tactic IDs: none
- deck tactic total: 59/59
- deck tactic counts: Nexus 12/12, Exordium 12/12, Liberti 14/14, Agathoi 9/9, Fabeot 12/12
- playable C2c-1 statuses: 5/5
- pivot counts: Nexus 1, Exordium 1, Liberti 1, Agathoi 1, Fabeot 1
- distinct pool counts: Nexus 30, Exordium 30, Liberti 30, Agathoi 30, Fabeot 30
- C2c-1 config version: True
- C2c-1 mode: True
- canUseHandTacticCard: True
- beginHandTacticCardPlay: True
- useHandTacticCard: True
- controller pendingHandCardUid route: True
- deployment action text: True
