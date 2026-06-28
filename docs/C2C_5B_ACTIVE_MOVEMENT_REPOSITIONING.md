# C2c-5b – Movimento attivo / riposizionamento

Base: C2c-5 validata.

Obiettivo: completare il primo pass movimento attivo senza aprire sistemi complessi come mine avanzate, furto mano, conversioni o reazioni.

## Tattiche rese giocabili

- NXTAC05 – Passaggio tattico
  - Piazza un effetto cella su una cella libera entro rete alleata.
  - La prima unità alleata che occupa quella cella ottiene +1 movimento e può muovere ancora; dopo il movimento aggiuntivo viene considerata agita.
  - La cella si consuma al trigger.
  - Il trigger avviene su occupazione/termine movimento, non sul passaggio intermedio.

- EXTAC05 – Manovra d’attacco
  - Bersaglia una unità alleata che ha già attaccato.
  - La unità può effettuare un movimento aggiuntivo.
  - Riceve Movimento obbligato: può solo muovere e dopo il movimento viene considerata agita.

- LBTAC12 – L’Orda si Muove
  - Bersaglia una unità alleata pronta e connessa ad almeno una seconda unità pronta.
  - Seleziona automaticamente un gruppo di 2-3 unità pronte collegate per adiacenza.
  - Le unità del gruppo ottengono MOV raddoppiato.
  - Le unità del gruppo possono solo muovere e, dopo il movimento, vengono considerate agite.

## Abilità/passive unità consolidate

- AGC1F06 – Karyon Mobile / Traslazione Karyon
  - Relocate automatico già esistente.
  - Ora rispetta celle invalicabili e trigger di cella.

- FBC1F07 – Cabina Dislocante / Dislocazione Locale
  - Relocate automatico già esistente.
  - Ora rispetta celle invalicabili e trigger di cella.

- FB2B02 – Persecutore Fabeot / Posizionamento Ingannevole
  - Scambio posizione già esistente.
  - Ora segna movimento e triggera eventuali effetti cella sulle celle di arrivo.

- EXC1F04 – Cursor
  - Passiva già presente: se non attacca, riceve +1 movimento nel prossimo turno.
  - Inclusa come controllo di compatibilità C2c-5b.

- AGC1F05 – Aratron Camminatore
  - Passiva già presente: +1 movimento se inizia turno adiacente a struttura alleata.
  - Inclusa come controllo di compatibilità C2c-5b.

- FBC1HA01 – Lancia Fabeot
  - Fix compatibilità: il bonus movimento permanente viene conservato come `baseMoveBonus` e non viene perso al reset di inizio turno.

## Note implementative

- Aggiunto status `move_only` / Movimento obbligato: blocca attacco e abilità, ma non movimento.
- Aggiunti flag temporanei unità C2c-5b:
  - `c2c5bMoveBonus`
  - `c2c5bDoubleMove`
  - `c2c5bPassageContinue`
  - `c2c5bMoveOnlyExhaustAfterMove`
- I flag vengono ripuliti a inizio turno e quando l’unità viene marcata come agita.
- Non è stata aggiunta scelta manuale della destinazione per relocateAlly: resta automatica e stabile.

## Non incluso

- Movimento passo-passo con trigger sulle celle attraversate.
- Mine avanzate.
- Spawn tattici Liberti.
- Furto mano / conversioni Fabeot.
- Agguato, Contrattacco, attacchi opportunità.
