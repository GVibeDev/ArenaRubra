# Arena Rubra — C2-STABLE-1-F9O3-APK-M4c

## Event & Narrative Overlay Foundation

Baseline logica: **F9O2e — Mission Accessibility & Build Flow Reliability**.

F9O3 introduce una infrastruttura visuale non bloccante per gli eventi della partita e la base riutilizzabile delle finestre narrative destinate a tutorial e campagne.

### Eventi rapidi

- entrata dal basso e uscita verso l'alto;
- opacità circa 23% ai margini e 100% al centro;
- chiusura al click o dopo 1 secondo;
- coda con priorità, deduplica e limite difensivo;
- nessun cambio automatico della camera.

Sono coperti: inizio turno, controllo PS, minaccia QG R4, Comandante/Pivot in gioco o distrutti, Missioni, deck terminato/rimescolato, Pressione, conversioni, furti/blocchi carta e conclusione partita.

### Narrativa

- cornice responsive desktop/mobile;
- avatar sinistra/destra;
- cinque espressioni: neutrale, spiegazione, approvazione, allarme, severo;
- asset registrabili con fallback placeholder;
- comandi Indietro, Ripeti, Chiudi, Avanti/Fine;
- campi predisposti per focus, highlight e azioni consentite, senza applicarli ancora.

### Diagnostica

```js
eventOverlayDiagnostics()
narrativeDiagnostics()
```

Questa è una build **LITE**: gli asset binari restano nel deploy completo.
