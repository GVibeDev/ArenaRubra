# C2c-2a – No Overflow Damage Hotfix

## Base

`arena_rubra_C2c_2_damage_debuff_cleanse_tactics.zip`

## Obiettivo

Allineare il combattimento alla regola ufficiale del danno normale non perforante.

## Regola implementata

- Il danno normale colpisce la DEF finché `currentDef > 0`.
- Se il danno supera la DEF residua, l’eccesso viene perso.
- Gli HP vengono colpiti dal danno normale solo quando `currentDef <= 0` già al momento della risoluzione del danno.
- Il danno diretto, perforante o che ignora DEF continua a usare `options.directHp === true` e colpisce direttamente gli HP.

## File modificati

- `src/combat.js`
- `src/game.js`
- `src/render.js`
- `src/precheck.js`
- `README.md`

## Dettaglio tecnico

In `applyDamage()` il blocco danno normale non sottrae più il danno residuo dagli HP dopo aver consumato la DEF.

È stato aggiunto `overflowLost` nel payload evento `UNIT_DAMAGED`, utile per debug/log.

## Non incluso

- Nessuna nuova tattica giocabile.
- Nessuna modifica ad abilità, AI, deck, mano, economia o mappa.
- Nessuna modifica a `directHp`, quindi Spine, sanguinamento, mine/status diretti e futuri effetti `ignora DEF` restano eccezioni funzionanti.

## Controlli

- JS syntax check: OK
- missing scripts: none
- duplicate function definitions: none
- `applyDamage` no-overflow marker: present
- `directHp` branch preserved: present
- `overflowLost` debug field: present
