# Arena Rubra – C1f Base Faction Roster Expansion

## Base

`arena_rubra_C1e_hand_unit_cards_playable.zip`

## Obiettivo

Integrare il nuovo roster base delle cinque fazioni nel ciclo carta già validato:

`roster → catalogo carte → deck → mano → gioco carta → spawn/costruzione → scarto`

## Numeri finali

| Fazione | Unità totali |
|---|---:|
| Nexus | 18 |
| Exordium | 18 |
| Liberti | 11 |
| Agathoi | 21 |
| Fabeot | 16 |
| **Totale** | **84** |

| Tipo | Totale |
|---|---:|
| Fanteria | 29 |
| Veicolo | 26 |
| Struttura | 24 |
| Comandante | 5 |
| **Totale** | **84** |

Catalogo carte runtime: **94** carte, includendo le tattiche.

## File modificati

- `data/units_base.js`
- `data/cards_base.js`
- `src/state.js`
- `src/economy.js`
- `src/statuses.js`
- `src/combat.js`
- `src/abilities.js`
- `src/deck.js`
- `src/deployment.js`
- `src/movement.js`
- `src/controller.js`
- `src/render.js`
- `src/turns.js`
- `src/game.js`
- `index.html`
- `README.md`
- `docs/`

## Meccaniche integrate

- Nuove unità e rework per le cinque fazioni base.
- Avanguardia riusata come ingresso non esausto.
- Visione e Furtivo come tag/status placeholder.
- Agguato come status placeholder.
- Sanguinamento 1 e Superiorità Numerica riusati dalle regole esistenti Liberti.
- Mine Nexus con trigger sulla prossima unità che entra nella cella.
- Prima Linea: intercetta solo attacchi base diretti contro unità alleate adiacenti.
- Spawn da strutture: Fabbrica Nexus, Caserma Exordium, Matrice Fabeot.
- Cap dinamici per veicoli leggeri e strutture, tollerando unità già sopra cap.
- Punto di Raccolta Liberti: sbarco R2 solo per fanteria leggera e veicoli leggeri, incluse starter/fuori deck.
- Costo dinamico di Avanguardia Liberta sulla cella scelta.
- Trigger alba/inizio turno per Agathoi.
- Rimozione buff positivi.
- Effetti Fabeot su mano, ENE, morte unità e copia carta.
- AoE semplificata per Torretta Lanciafiamme.

## Limiti consapevoli

- Le tattiche in mano restano non giocabili fino a C2.
- Furtivo, Visione e Agguato sono predisposti, non ancora sistema completo.
- AoE geometrica completa rimandata.
- Spostamenti Karyon/Cabina usano destinazione automatica valida.
- Duplicazione tattiche del Modulo Fabeot rimandata a C2.

## Test consigliati

- Avviare nuova partita per ogni matchup.
- Eseguire `runPrecheck()`.
- Controllare `cardDebugSummary()` e `cardZoneDebugSummary()`.
- Verificare che il catalogo carte sia 94.
- Giocare carte unità nuove dalla mano.
- Testare Mech Leggero/Avanguardia.
- Testare Corazzato Posamine e mine.
- Testare Punto di Raccolta con starter leggera a R2.
- Testare Prima Linea con attacchi base.
- Testare spawn da struttura se cap/spazio disponibile.
- Testare Agathoi in late game con strutture adiacenti.
- Testare Fabeot con copia carta / rimozione buff.
