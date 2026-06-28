# C2c-6b – ENE / income / depot / economia permanente

Base: C2c-6a-fix2 validata.

Obiettivo: attivare le tattiche economiche che modificano ENE immediata, income temporaneo/permanente e profitto condizionale, senza aprire furti mano, conversioni o rimbalzi Fabeot avanzati.

## Tattiche rese giocabili

- NXTAC07 – Ricalcolo ENE
  - immediata, senza bersaglio;
  - richiede almeno 1 PS controllato;
  - guadagna +1 ENE per ogni PS controllato e +1 ENE se il comandante è vivo in campo.

- EXTAC07 – Ricalcolo ENE
  - immediata, senza bersaglio;
  - richiede almeno 1 unità nemica distrutta nel turno corrente;
  - guadagna +1 ENE per ogni unità nemica distrutta in questo turno, massimo +3.

- AGTAC09 – Seme della Ricchezza
  - bersaglia struttura alleata;
  - non riapplicabile sulla stessa struttura;
  - applica stato permanente `agathoi_income_seed`;
  - ogni struttura viva con questo stato aggiunge +1 ENE all'income del proprietario.

- FABTAC08 – Contratto da Sicario
  - bersaglia unità nemica viva, esclusi strutture, comandanti e pivot;
  - applica stato permanente `fabeot_sicario_contract`;
  - quando quell'unità uccide con attacco base, il Fabeot guadagna subito +1 ENE.

- FABTAC09 – Contratto di Usura
  - immediata, senza bersaglio;
  - l'avversario perde 1 ENE depot, senza scendere sotto 0;
  - l'avversario subisce -1 income per 2 turni;
  - se l'avversario aveva ENE = 0 prima del lancio, scarta 1 carta casuale.

## Motore aggiornato

- Aggiunto tracking `state.c2c6b.enemyDestroyedThisTurn`.
- Il tracking viene resettato a inizio turno del giocatore.
- `applyDamage()` registra le distruzioni ai fini di EXTAC07 e Contratto da Sicario.
- `effectiveIncomeGain()` include i Semi della Ricchezza vivi come bonus income.
- Precheck aggiornato a 42 tattiche giocabili.

## Fuori perimetro

Restano fuori da C2c-6b:

- FABTAC03 Congedo Forzato;
- FABTAC04 Dottrina del Tradimento;
- FABTAC05 Taglia sulla Testa;
- FABTAC06 Contratto Capestro;
- FABTAC07 Embargo.

Queste carte appartengono a C2c-7 – Fabeot avanzati: mano, furto, conversione.
