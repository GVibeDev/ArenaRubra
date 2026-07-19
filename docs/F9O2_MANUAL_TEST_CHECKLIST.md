# F9O2 — Checklist test manuale

## Desktop

1. Avvia una partita e verifica che la camera parta in Fit.
2. Trascina la mappa con il tasto sinistro: la visuale deve spostarsi senza selezionare accidentalmente una cella.
3. Fai un click breve su una cella: deve continuare a funzionare come prima.
4. Usa la rotellina sopra zone diverse della mappa: il punto sotto il cursore deve restare stabile.
5. Prova i pulsanti `−`, `Centra`, `Fit`, `+`.
6. Seleziona un'unità, sposta manualmente la camera e lascia agire il bot: la camera manuale non deve essere azzerata.

## Telefono / touch

1. Trascina con un dito.
2. Tocca brevemente una cella e verifica la selezione.
3. Esegui pinch in apertura e chiusura.
4. Verifica che la pagina non scorra o zoomi al posto della mappa.
5. Apri e chiudi Mano/Azioni/Log: tornando alla mappa la posizione deve restare coerente.
6. Ruota il dispositivo e verifica che la mappa rimanga raggiungibile.

## API console

```js
cameraFocusHQ(1)
cameraFocusHQ(2)
cameraSetZoom(1.5)
cameraFocusHex("0,0,0")
cameraLockInput(true)
cameraLockInput(false)
cameraResetView()
cameraDiagnostics()
```
