# C2c-4a-fix – Recovered Playability / HP max Fix

Base: C2c-4a – Recovered Advanced Buff / Structure Hotfix.

## Problemi segnalati in test

- NXTAC11 – Puntatori avanzati: funzionante.
- AGTAC04 – Bastione Ligneo: funzionante.
- AGTAC06 – Fortezza Verde: funzionante solo parzialmente; aumentava DEF ma non risultava evidente/applicato il bonus HP massimo con 1 fanteria adiacente.
- FABTAC02 – Diploma da Mentalista: ancora mostrata come `Tattica data-only`.
- FABTAC12 – Attacco Ingannevole: ancora mostrata come `Tattica data-only`.

## Fix applicati

### 1. Normalizzazione tattiche da mano

Aggiunta normalizzazione delle carte tattica in mano tramite definizione canonica in `DECK_TACTICS`.

Funzioni introdotte/rafforzate:

- `tacticIdFromHandCard(card)`
- `normalizeHandTacticCard(card)`
- `handTacticEffectKind(card)`

Questo permette a carte già create con metadati vecchi o incompleti di diventare giocabili se il loro `tacticId` è presente negli ID implementati.

Esempio: una carta in mano con `tacticId: "FABTAC12"` ma `implementationStatus: "data_only"` viene normalizzata alla definizione canonica:

- `effectKind: "next_attack_ignore_defense"`
- `implementationStatus: "playable_c2c4a"`
- `targetSide: "ally"`
- `rangeMode: "ally_network"`

### 2. FABTAC02 e FABTAC12 rese effettivamente giocabili

La giocabilità non dipende più solo dai metadati della singola copia carta, ma dalla definizione canonica del catalogo tattiche.

- FABTAC02 – Diploma da Mentalista: fanteria/veicolo alleato non comandante/pivot ottiene `stun_on_basic_attack` permanente.
- FABTAC12 – Attacco Ingannevole: fanteria alleata ottiene `next_attack_ignore_defense` fino al prossimo attacco base.

### 3. AGTAC06 – Fortezza Verde, HP max esplicito

`applyGreenFortressGrowth()` ora:

- conta strutture alleate adiacenti con helper robusto;
- conta fanterie alleate adiacenti con helper robusto;
- applica `+2 currentDef` per ogni struttura alleata adiacente;
- applica `+1 maxHp` per ogni fanteria alleata adiacente;
- mantiene gli HP correnti invariati, come da design;
- logga chiaramente il passaggio `HP max prima → HP max dopo`.

Esempio atteso:

Struttura HP 4/4, DEF 1, con 1 struttura e 1 fanteria alleata adiacenti:

- DEF: 1 → 3
- HP max: 4 → 5
- HP correnti: 4 invariati

### 4. Alias effectKind C2c-2

Aggiunti alias per garantire conteggio e compatibilità delle tattiche già validate:

- `damage_and_permanent_attack_debuff`
- `set_defense_to_one`
- `grant_thorns_two`

Questi affiancano i nomi già gestiti:

- `damage_and_permanent_att_debuff`
- `set_def_to_one_round`
- `grant_thorns_temp`

## File toccati

- `src/tactics.js`
- `data/cards_base.js`
- `README.md`
- `docs/C2C_4A_FIX_RECOVERED_PLAYABILITY_HPMAX.md`
- `docs/CHECK_C2C_4A_FIX.txt`

## Non incluso

- C2c-5 movimento/celle/trappole.
- Pesca/economia.
- Conversione e furto mano Fabeot avanzati.
- Reazioni, contrattacco, agguato.
- AI tattiche.
