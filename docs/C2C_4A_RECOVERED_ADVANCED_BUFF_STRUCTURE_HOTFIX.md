# Arena Rubra – C2c-4a
## Recovered Advanced Buff / Structure Hotfix

Base di partenza: `C2c-4 – Simple AoE Tactics`, validata dall'utente.

Obiettivo: recuperare cinque tattiche che erano già state implementate in una patch precedente probabilmente persa nel passaggio di chat/memoria, senza anticipare C2c-5 Movimento e celle.

## Tattiche abilitate

- `FABTAC12 – Attacco Ingannevole`
  - Fanteria alleata.
  - Ottiene `Attacco a Sorpresa` fino a fine turno o al prossimo attacco base.
  - Il prossimo attacco base ignora la DEF e colpisce direttamente gli HP.

- `FABTAC02 – Diploma da Mentalista`
  - Fanteria o veicolo alleato, no comandante/pivot.
  - Ottiene passiva permanente `Diploma da Mentalista`.
  - Gli attacchi base che colpiscono applicano Stordimento al bersaglio.

- `NXTAC11 – Puntatori avanzati`
  - Unità alleata combattente, no struttura/QG.
  - Ottiene passiva permanente `Puntatori Avanzati`.
  - I suoi attacchi base ignorano la DEF.

- `AGTAC04 – Bastione Ligneo`
  - Struttura alleata.
  - Porta la DEF corrente almeno al valore degli HP correnti.
  - Non modifica HP, HP massimo o ATT.

- `AGTAC06 – Fortezza Verde`
  - Struttura alleata.
  - Bonus calcolato alla giocata: +2 DEF corrente per ogni struttura alleata adiacente; +1 HP massimo per ogni fanteria alleata adiacente.
  - Il +HP massimo non cura gli HP correnti.

## Note tecniche

- Totale tattiche giocabili dalla mano: 22/59.
- Aggiunti gli status tecnici:
  - `next_attack_ignore_defense`
  - `ignore_defense_permanent`
  - `stun_on_basic_attack`
- `attackUnit()` ora riconosce gli status di bypass DEF e passa `directHp:true` ad `applyDamage()` solo quando richiesto.
- `FABTAC12` consuma il proprio status al primo attacco base oppure scade a fine turno.
- `NXTAC11` e `FABTAC02` restano status manuali/permanenti finché l'unità resta in campo.
- `AGTAC04` non riduce mai la DEF: se la DEF è già pari o superiore agli HP correnti, non viene abbassata.

## Perimetro non toccato

- Nessuna nuova meccanica movimento/celle.
- Nessuna trappola.
- Nessuna pesca/economia.
- Nessuna conversione/furto mano.
- Nessuna reazione/attacco opportunità.
- Nessuna modifica AI dedicata.
