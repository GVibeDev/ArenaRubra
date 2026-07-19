# F9O2c — Bot Camera Freeze Hotfix

Baseline logica: `C2-STABLE-1-F9O2b-APK-M4c`.

## Problema corretto
Durante partite bot-vs-bot, ogni micro-azione produce più `renderAll()`. La pipeline camera richiamava sia `syncBoardCameraAfterRender()` sia un secondo `fitApkM4Board({ preserveCamera:true })` nel bridge mobile. Il parametro `preserveCamera` conservava zoom relativo e pan, ma ricalcolava `fitScale`; la scala totale oscillava quindi durante i render consecutivi.

## Contratto F9O2c
- Movimento, attacco, abilità, tattiche e render dei bot non modificano `fitScale`, `zoom`, `x`, `y` o `mode`.
- `syncBoardCameraAfterRender()` riapplica soltanto la trasformazione già esistente.
- Il bridge mobile non esegue più un secondo fit dopo `renderAll()`.
- Restano autorizzati soltanto:
  - pan/zoom manuali;
  - pulsanti Fit/Focus/Zoom;
  - resize/orientamento/viewport reali;
  - fit automatico delle celle legali quando si seleziona una carta unità per lo sbarco;
  - API di focus chiamate esplicitamente dal futuro tutorial.

## Regressione dedicata
`tests/f9o2c_bot_camera_freeze_smoke.js` verifica 100 render consecutivi desktop e mobile senza variazioni del modello camera.
`tests/f9o2c_browser_smoke.py` verifica in Chromium 120 render bot, modifica manuale della camera e altri 80 render senza oscillazioni.
