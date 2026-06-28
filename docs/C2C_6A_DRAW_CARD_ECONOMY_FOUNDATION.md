# C2c-6a – Draw / Card Economy Foundation

Base: C2c-5c validata.

Obiettivo: rendere giocabili le prime tattiche C2 legate a pesca carte e modifiche sulle carte pescate, senza introdurre ancora ENE income, furti mano, conversioni o rimbalzi Fabeot.

## Tattiche abilitate

- **NXTAC08 – Richiesta rifornimenti**
  - Pesca 1 carta.
  - Se la prima carta pescata è una tattica, pesca 1 carta aggiuntiva.
  - Tutte le carte pescate da questo effetto ricevono costo -1 ENE sull'istanza carta, minimo 0.
  - Lo sconto è persistente finché la carta resta in mano / viene giocata.

- **EXTAC08 – Rifornimenti in arrivo**
  - Pesca 2 carte.
  - Ogni carta Veicolo pescata da questo effetto riceve un bonus spawn: +1 ATT permanente quando viene schierata.

- **LBTAC11 – Tributo dei Clan**
  - Pesca 1 carta.
  - Se la prima carta pescata è una fanteria, pesca 1 carta aggiuntiva.
  - Non catena oltre la seconda pesca.

- **AGTAC08 – Carovane di Mercanti**
  - Pesca 1 carta per ogni struttura alleata viva in gioco, massimo 4.

## Note tecniche

Le tattiche C2c-6a sono tattiche senza bersaglio mappa. Premendo il pulsante dalla mano vengono risolte immediatamente, senza entrare in modalità targeting.

Le carte pescate possono ricevere metadati C2c-6a:

- `c2c6aCostAdjusted`
- `basePrintedCost`
- `c2c6aCostDelta`
- `c2c6aCostSource`
- `c2c6aSpawnAttBonus`
- `c2c6aSpawnAttBonusSource`

Per le unità giocate dalla mano, il costo effettivo usa il costo modificato dell'istanza carta quando presente. Questo consente a Richiesta rifornimenti di scontare anche unità, non solo tattiche.

Per i veicoli pescati con Rifornimenti in arrivo, il +1 ATT viene applicato allo spawn dell'unità dalla carta.

## Fuori perimetro

Restano fuori da C2c-6a:

- ENE depot / income / economia permanente;
- Seme della Ricchezza;
- Ricalcolo ENE Nexus/Exordium;
- Contratto da Sicario;
- Contratto di Usura;
- Contratto Capestro;
- Embargo;
- furti mano, rimbalzi e conversioni Fabeot.

Questi effetti appartengono a C2c-6b o C2c-7.
