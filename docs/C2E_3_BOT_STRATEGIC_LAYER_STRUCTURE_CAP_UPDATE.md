# Arena Rubra – C2e-3 Bot Strategic Layer / Structure Cap Update

## Perimetro

Patch AI/flow senza modifiche a effetti, tattiche, comandanti, costi carte o stat.

## Modifiche

- Cap strutture generale: 4 → 6.
- Cap strutture Agathoi: 7.
- Aggiunto primo layer di valutazione strategica bot:
  - vantaggio/svantaggio da PS;
  - income previsto;
  - carte in mano, deck e scarti;
  - valore unità sul campo;
  - controllo/contestazione PS centrale;
  - pressione da deck quasi vuoto e mano quasi vuota.
- Aggiunta threat map semplice:
  - stima se una cella può essere minacciata da attacchi nemici nel turno successivo;
  - penalizza movimenti troppo esposti, soprattutto per comandanti, elite e pivot.
- Aggiunta riserva ENE leggera:
  - il bot evita di spendere tutto se ha tattiche C2 ad alto valore giocabili;
  - conserva ENE se si avvicina alla condizione di recupero deck.
- Aggiunta consapevolezza mano/deck:
  - quando deck è quasi vuoto e mano bassa, il bot tende a liberare carte dalla mano;
  - evita pescate poco utili in prossimità di deck vuoto.
- Priorità PS centrale rafforzata anche oltre l'apertura iniziale.

## Non modificato

- Nessuna nuova tattica.
- Nessuna nuova abilità.
- Nessuna modifica a commander roster.
- Nessuna modifica ai costi/stat delle carte.
- Nessuna modifica a regole di combattimento, mano, deck recovery o income base.
