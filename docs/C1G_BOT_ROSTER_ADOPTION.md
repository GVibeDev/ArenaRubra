# Arena Rubra – C1g Bot Roster Adoption

## Obiettivo

Aggiornare il bot perché inizi a usare il roster C1f e le carte unità in mano.

## Cosa cambia

- Il bot valuta le carte unità in mano.
- Se una carta è giocabile, può usarla per spawn o costruzione.
- Dopo l’uso, la carta passa dalla mano agli scarti.
- Il bot continua a usare anche il mercato vecchio come fallback.
- Gli spawn bot ora usano `spawnCellsFor(player, bp)`, quindi rispettano sorgenti speciali come Punto di Raccolta.
- Le strutture bot possono essere costruite da qualunque costruttore valido, non solo fanteria.
- Aggiunti punteggi AI base per proprietà e abilità C1f.

## Limiti intenzionali

- Non è ancora AI specifica per sottofazione.
- Non è ancora deckbuilding intelligente.
- Non gioca tattiche dalla mano.
- Furtivo/Visione/Agguato restano placeholder o semi-placeholder.
- AoE resta semplificata.

## Test consigliati

- Bot vs bot su tutte le fazioni.
- Controllare log: “gioca dalla mano”.
- Verificare uso di pesanti/elite/pivot dal deck.
- Verificare Punto di Raccolta con leggere Liberti.
- Verificare che il bot non crashi su strutture, cap dinamici e mano bloccata.
