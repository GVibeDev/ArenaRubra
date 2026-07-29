# F9O4b — Incremental DOM Renderer

## Baseline

C2-STABLE-1-F9O4a-APK-M4c, validata su APK reale con miglioramento sensibile di pan e zoom Android.

## Scopo

Ridurre allocazioni, listener, ricostruzioni e scritture DOM della mappa senza modificare la logica di gioco.

## Implementazione

- Cache persistente `BOARD_DOM_CACHE`.
- Skeleton delle celle ricostruito solo se cambia la sequenza delle coordinate o il nodo board.
- Event delegation su `#board`.
- Mappa occupazione `coord -> unit` costruita una sola volta per render.
- Set target movimento/attacco/abilità-tattica/costruzione/sbarco costruiti una sola volta per render.
- Firma visuale separata per cella e token.
- Riuso nodo token per UID anche quando cambia cella.
- Pruning deterministico dei token non più in campo.
- Diagnostica runtime `boardRenderDiagnostics()`.

## Fuori ambito

- Nessuna conversione Canvas/PixiJS.
- Nessuna modifica a `renderPanels`, mano, mercato, roster o statistiche.
- Nessuna modifica a regole, IA, Missioni, audio o asset.
- Nessun frame loop continuo.

## Gate

La milestone richiede test APK reale. Se gli scatti durante bot/azioni restano elevati, il passo successivo è separare `renderAll()` in regioni dirty e aggiornare soltanto i pannelli interessati.
