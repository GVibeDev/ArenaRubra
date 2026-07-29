# Arena Rubra — F9O7h2 Performance Hotfix

Baseline: `C2-STABLE-1-F9O7h1-APK-M4c`

## Ambito

Hotfix prestazionale conservativa per partite a tre e quattro giocatori, soprattutto su mappe grandi con movimento ×3 e molti pezzi. Nessuna modifica a regole, carte, statistiche, cap, punteggi decisionali o bilanciamento.

## Modifiche

- `src/map_runtime.js`
  - indice celle per coordinata memorizzato per array geometrico;
  - indice condiviso da lookup, percorso e raggiungibilità;
  - estrazione stabile del nodo a costo minimo senza ordinare l’intera coda;
  - contatori diagnostici runtime per query e costruzioni indice.
- `src/movement.js`
  - occupazione costruita da unità attive ed effetti di blocco;
  - eliminata la scansione celle × storico unità.
- `src/ai.js`
  - cache di `movableCells` condivisa tra stato strategico e scoring;
  - una sola raggiungibilità per unità nella singola decisione;
  - liste PS, nemici e coordinate condivise tra candidati;
  - raggiungibilità riusata nelle fasi della singola azione bot;
  - render iniziale duplicato eliminato nel passaggio bot→bot.
- `src/rules.js`
  - `getCellAt` usa l’indice centrale della mappa.
- `src/render.js`
  - log DOM limitato a 300 nodi;
  - registro eventi completo e ordine export invariati.

## Compatibilità

- Lezioni 1–5, checkpoint e resume invariati.
- Fix UI e anteprime carta sopra lo scrim invariati.
- Pressione, vittoria, economia e bilanciamento invariati.
- Ordine dei pareggi del pathfinding mantenuto.
- Formato dei log esportati invariato.
