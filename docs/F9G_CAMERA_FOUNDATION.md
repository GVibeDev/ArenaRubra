# F9G – Camera Foundation

Base: `C2-STABLE-1-F9F-APK-M4c Stats & Export Foundation`.

## Obiettivo

Formalizzare la camera come stato UI/render separato dallo stato logico della partita. Lo zoom o il focus della mappa non modificano gameplay, AI, regole, mappa o eventi di gioco.

## Modifiche

- Aggiunto `src/camera.js`.
- Aggiunto stato `boardCamera` con `x`, `y`, `zoom`, `fitScale`, `mode`.
- Funzioni disponibili: `fitToBoard()`, `focusCoord()`, `focusUnit()`, `panBy()`, `zoomAt()`, `resetCamera()`, `screenToBoardCoord()`, `syncBoardCameraAfterRender()`.
- Action bar desktop aggiornata con `Fit` e `Focus`.
- `Fit` chiude i pannelli e riadatta la board.
- `Focus` chiude i pannelli e centra la vista su unità selezionata, target/pending disponibile o QG del giocatore corrente.
- HUD aggiornata con chip `Camera: Fit/Focus`.
- `renderAll()` richiama `syncBoardCameraAfterRender()` dopo il render.
- Camera APK-M4 mobile preservata: F9G non sostituisce la camera mobile validata, la integra tramite routing compatibile.

## Non modificato

Nessuna modifica a gameplay, AI, deck rules, effetti tattiche, mappa, roster, costi, HP/DEF/ATT, splash/audio o regola danno no-overflow.
