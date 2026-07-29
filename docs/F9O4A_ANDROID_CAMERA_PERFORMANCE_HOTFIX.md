# F9O4a — Android Camera Performance Hotfix

Build: `C2-STABLE-1-F9O4a-APK-M4c`  
Baseline funzionale: `C2-STABLE-1-F9O4-APK-M4c`

## Ambito implementato

1. **Frame coalescing**: pan, pinch e wheel accodano un solo aggiornamento camera per frame.
2. **Geometry cache**: `boardWrap.getBoundingClientRect()` viene letto all'inizio del gesto e invalidato su resize/orientamento; non viene riletto a ogni `pointermove`.
3. **Transform composito**: lo stack mappa usa `translate3d(...) scale(...)`, `will-change: transform`, backface hiding e containment.
4. **Layout write deferral**: durante pan/pinch non vengono aggiornate le dimensioni visuali del wrapper; vengono sincronizzate alla fine del gesto.
5. **HUD differito**: percentuale zoom e stato camera non vengono riscritti per ogni evento touch.
6. **Gesture performance mode**: durante il gesto vengono sospesi blur, glow, blend mode, ombre e animazioni interne costose.
7. **DOM write deduplication**: `applyApkM4Camera()` scrive soltanto i valori CSS realmente cambiati.

## Fuori ambito

- Nessuna modifica a regole, IA, missioni, deck, targeting o selezione.
- Nessuna conversione Canvas/PixiJS.
- Nessun renderer DOM incrementale: previsto come eventuale F9O4b.

## Test manuale Android

- Avviare una partita su MAP1 raggio 6.
- Eseguire pan continuo per almeno 10 secondi con un dito.
- Eseguire pinch ripetuto tra zoom minimo e massimo.
- Verificare che il tap su una cella resti distinto dal drag.
- Verificare sbarco dopo fit, pan e pinch.
- Verificare che glow/ombre tornino al rilascio del dito.
- Ripetere durante il turno bot e con mappa affollata.
