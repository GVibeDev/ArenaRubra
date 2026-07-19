# F9O2 — Interactive Map Camera Foundation

## Obiettivo

Fornire una camera unica e affidabile per desktop e APK-M4, pronta per essere controllata anche dal tutorial interattivo.

## Input

- mouse: trascinamento con pulsante sinistro;
- touch: trascinamento con un dito;
- desktop: rotellina per zoom continuo;
- touch: pinch con due dita;
- pulsanti accessibili: meno, centra, fit e più.

Un gesto inferiore alla soglia resta un normale click/tap sulla cella. Superata la soglia, il gesto diventa pan e il click sintetico successivo viene bloccato.

## Limiti

Lo zoom relativo è limitato fra 0,72 e 2,20. Il pan viene limitato in funzione della dimensione visibile della mappa, così non è possibile perderla completamente fuori dallo schermo.

## Persistenza di sessione

La posizione manuale resta invariata durante render, animazioni e turni bot. Una nuova partita riporta la camera in modalità Fit.

## API tutorial

```js
cameraFocusHex(coordOrKey, options)
cameraFocusUnit(unitOrId, options)
cameraFocusHQ(side, options)
cameraSetZoom(level, options)
cameraResetView(options)
cameraLockInput(enabled)
cameraGetState()
cameraDiagnostics()
```

Il blocco tutorial potrà quindi centrare l'inquadratura, impostare lo zoom e bloccare temporaneamente l'input senza duplicare logica della camera.
