# F9O7d — Collapsed Hand Controls Reflow

## Baseline

`C2-STABLE-1-F9O7c-APK-M4c`, validata manualmente.

## Obiettivo

Spostare i due comandi disponibili quando la Mano è ridotta dal lato destro della mappa al lato sinistro, immediatamente sotto il dock delle abilità di fazione, senza modificare il layout della Mano aperta.

## Contratto UI

- **Mano aperta:** nessuna modifica rispetto a F9O7c.
- **Mano ridotta:** `#mapHandOverlay` resta il marker di stato ma non renderizza più il vecchio riquadro compatto.
- Il dock `#mapActionDock` aggiunge `.mapCollapsedHandControls` soltanto quando la Mano è ridotta e non è attivo un targeting.
- I pulsanti conservano le classi `.mapHandShowBtn` e `.mapHandEndTurnBtn`, quindi tutorial e comandi esistenti continuano a risolverli semanticamente.
- `Fine turno` mantiene le stesse condizioni di disabilitazione della Mano aperta.

## Fuori ambito

Nessuna modifica a regole, IA, tutorial, camera, carte, missioni o stato partita.
