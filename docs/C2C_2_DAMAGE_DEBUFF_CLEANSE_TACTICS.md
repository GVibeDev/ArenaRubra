# C2c-2 – Damage / Debuff / Cleanse Tactics

## Base

`arena_rubra_C2c_1b_hand_tactic_activation_hotfix.zip`

## Obiettivo

Ampliare le tattiche giocabili dalla mano con una famiglia ancora controllabile:
- danno + rimozione buff;
- danno + debuff permanente;
- danno + stato semplice;
- debuff DEF temporaneo;
- buff Spine temporaneo.

## Nuove tattiche abilitate

- `NXTAC03 – Missile Jam`: 2 danni a fanteria/veicolo nemico + rimozione buff/effetti positivi.
- `EXTAC03 – Missile EMP`: 2 danni a fanteria/veicolo nemico + -1 ATT permanente.
- `LBTAC05 – Granata Sporca`: 1 danno a fanteria/veicolo nemico + Sanguinamento 1.
- `EXTAC06 – Neutralizza Armamenti`: DEF corrente del bersaglio nemico portata a 1 fino al prossimo turno.
- `AGTAC07 – Manto di Rovi`: Spine 2 a unità alleata fino al prossimo turno.

## Tattiche C2c-1 preservate

- `NXTAC01`
- `NXTAC02`
- `EXTAC01`
- `EXTAC02`
- `LBTAC06`

## Non incluso

- AoE.
- Distruzione diretta.
- Trappole e celle.
- Pesca/economia.
- Conversioni/Fabeot.
- AI tattiche deck.

## Note implementative

- `isC2c1SingleDamageTacticCard()` resta come nome storico per compatibilità UI, ma da C2c-2 verifica l’intero set tattiche C2c giocabili.
- `Neutralizza Armamenti` usa un debuff temporaneo su `buffs` con valore negativo e durata 1. È sufficiente per questo step, da monitorare se interagisce con danni alla DEF nello stesso round.
- `Missile Jam` usa `removePositiveEffects()` quando disponibile, con fallback locale.
- `Manto di Rovi` usa lo status `thorns` già esistente.

## Controlli

- JS check: OK
- missing scripts: none
- duplicate function definitions: none
- duplicate blueprint IDs: none
- duplicate deck tactic IDs: none
- deck tactic total: 59/59
- deck tactic counts: Nexus 12/12, Exordium 12/12, Liberti 14/14, Agathoi 9/9, Fabeot 12/12
- playable C2c-1 statuses preserved: 5/5
- playable C2c-2 statuses: 5/5
- total playable hand tactics: 10/10
- pivot counts: Nexus 1, Exordium 1, Liberti 1, Agathoi 1, Fabeot 1
- distinct pool counts: Nexus 30, Exordium 30, Liberti 30, Agathoi 30, Fabeot 30
- C2c-2 config version: True
- C2c-2 mode: True
- C2c2 ids config: True
- C2c2 effect kinds config: True
- resolver present: True
- cleanse handler present: True
- permanent att debuff present: True
- temporary def handler present: True
- ally target support present: True
- C2c2 source marker: True
