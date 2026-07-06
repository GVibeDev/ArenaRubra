# F9K3a – Map Hand Overlay Foundation

Base: `C2-STABLE-1-F9K3-APK-M4c`.

## Scopo
Portare la mano renderizzata direttamente sopra la mappa, senza obbligare il giocatore ad aprire il pannello `Mano / deck C2` per vedere le carte disponibili.

## Cosa cambia
- Aggiunto `#mapHandOverlay` dentro `#boardWrap`.
- Le carte della mano corrente vengono mostrate come miniature verticali affiancate orizzontalmente.
- L’overlay è trasparente/blur e resta sopra la mappa.
- Il pulsante `Fine turno` viene mostrato nello stesso overlay.
- Il vecchio pulsante `Fine turno` in top bar resta nel DOM per compatibilità con il listener esistente, ma viene nascosto in game screen.
- Click/tap su una miniatura seleziona la carta e aggiorna lo stato di preview esistente.
- Il pannello `Mano / deck C2` resta disponibile come consultazione/fallback.
- Su mobile/APK l’overlay usa una barra orizzontale compatta.

## Nota roadmap
Questa è solo la foundation UI. Preview grande laterale e highlight automatico delle celle/bersagli validi sono rimandati a F9K3b.

## Non modificato
- gameplay
- AI
- deck rules
- bilanciamento
- Card Editor
- Card Pool
- custom art
- coordinate renderer F9K2d
- Starter Logic Freeze
