# Checklist manuale APK — F9T2a

La candidata non è validabile definitivamente senza APK fisico.

## Dispositivi

- [ ] Android/WebView datato o telefono con 3–4 GB RAM.
- [ ] Telefono Android medio.
- [ ] Ritest dopo aggiornamento della System WebView.

Annotare per ogni prova: modello, Android, WebView, orientamento, mappa e durata.

## Map Editor

- [ ] Aprire la mappa più grande disponibile.
- [ ] Trascinare iniziando sopra una cella: la mappa si muove e la cella non viene modificata.
- [ ] Tap breve su una cella: lo strumento viene applicato una sola volta.
- [ ] Pinch lento e rapido: lo zoom resta ancorato e non salta.
- [ ] Interrompere un gesto con cambio app/rotazione: nessun trascinamento rimane attivo.
- [ ] Con `Cella / Aggiungi`, toccare uno spazio vuoto.
- [ ] Provare selezione, terreno, PS, QG, schieramento, rimozione e Undo/Redo.
- [ ] Importare uno sfondo mediante file picker.
- [ ] Verificare Fit, zoom, esportazione e reimportazione JSON.
- [ ] Ripetere in portrait e landscape.

## Card Pool e editor carte

- [ ] Aprire Card Pool e scorrere rapidamente l'intera galleria.
- [ ] Le miniature vicine compaiono; quelle lontane non bloccano lo scroll.
- [ ] Cambiare filtri più volte.
- [ ] Aprire focus, tornare, passare a Card Editor e Deck Builder.
- [ ] Tornare al menu e riaprire Card Pool: nessuna anteprima bianca permanente.
- [ ] Ripetere il ciclo 10 volte e verificare che la memoria non cresca continuamente.

## Partita

- [ ] Avviare una mappa 7–9 PS con grafica token ON.
- [ ] Pan e pinch sopra celle e token.
- [ ] Tap di selezione, movimento, attacco, abilità, schieramento e costruzione.
- [ ] Aprire/chiudere mano, azioni, Missioni, Debug e pannelli.
- [ ] Eseguire almeno 15 round bot-vs-bot.
- [ ] Verificare che gli asset token compaiano su domanda senza caricamento infinito.
- [ ] Controllare Back Android: prima chiude overlay/drawer, poi torna alla schermata precedente.

## Diagnostica

Da console remota WebView:

```js
androidRuntimeDiagnosticsResetF9T2a()
androidRuntimeDiagnosticsStartFrameProbeF9T2a(10000)
androidRuntimeDiagnosticsSnapshotF9T2a()
```

Salvare snapshot:

- subito dopo il bootstrap;
- dopo apertura della mappa grande;
- dopo 10 cicli Card Pool → Map Editor;
- dopo 15 round;
- dopo background/foreground.

## Gate proposto

- [ ] Nessun errore pagina/console inatteso.
- [ ] Nessun pan o pinch che provochi un full render del Map Editor.
- [ ] Nessun long task >100 ms durante il gesto.
- [ ] P95 frame ≤33 ms nel profilo compatibilità.
- [ ] Nessuna crescita continua di canvas, cache o heap dopo ritorno al menu.
- [ ] Nessuna schermata coperta permanentemente da header, pulsanti o drawer.
