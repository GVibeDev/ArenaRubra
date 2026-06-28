# C2c-5 – Movimento e celle / trappole semplici

Patch C2c-5 applicata su base C2c-4b validata.

## Tattiche rese giocabili

- NXTAC06 – Fossato: piazza una trappola su cella libera entro R2. La prima unità nemica che occupa la cella riceve Inibizione Movimento fino al prossimo turno utile.
- AGTAC01 – Barricata Verde: cella libera non PS/non QG diventa invalicabile per 2 tick di inizio turno del proprietario.
- AGTAC02 – Anatema Vegetale: cella libera valida per 2 tick. Se occupata da nemico: -2 ATT temporaneo. Se occupata da alleato: +2 DEF permanente. Si consuma al primo trigger.
- AGTAC03 – Sentiero dei Rovi: cella libera valida per 3 tick. La prima unità nemica che la occupa perde 1 DEF corrente e riceve Inibizione Movimento; alleati ignorano. Si consuma al trigger.

## Perimetro escluso

Restano fuori da questa patch: NXTAC05 Passaggio tattico, EXTAC05 Manovra d’attacco, LBTAC12 L’Orda si Muove, spawn tattici Liberti, mine avanzate, reazioni/agguati e furti/conversioni Fabeot.

## Note tecniche

Aggiunto `state.cellEffects`. Le celle bloccate sono escluse da movimento, spawn e costruzione. Le trappole si innescano su movimento e sbarco/spawn.
