# F9O3 — Event & Narrative Overlay Foundation

Baseline logica: `C2-STABLE-1-F9O2e-APK-M4c`.

## Messaggi evento rapidi

La UI usa una coda non bloccante. Ogni messaggio:

- entra dal basso;
- raggiunge opacità 100% al centro;
- esce verso l'alto;
- resta al 23% circa ai due estremi;
- si chiude al click oppure dopo 1.000 ms;
- non modifica camera, selezione, turni o IA.

Eventi coperti:

- inizio turno G1/G2, incluso il primo turno;
- PS occupato, liberato, conquistato o bloccato;
- QG minacciato da una unità nemica entro R4, una volta per episodio;
- Comandante/Pivot in gioco;
- Comandante sconfitto/Pivot distrutta;
- Missione ordinaria superata;
- ogni singola condizione completata di una Missione disperata;
- carta Missione giocata;
- deck terminato e deck rimescolato;
- aumento Pressione;
- unità convertita;
- carta rubata o bloccata;
- Vittoria, Sconfitta locale o Pareggio.

Le notifiche critiche possono superare un messaggio informativo già in corso. La coda ha un limite difensivo e deduplica eventi identici ravvicinati.

## API eventi

```js
eventOverlayEnqueue(item)
eventOverlayDismissCurrent(reason)
eventOverlayClear(options)
eventOverlayDiagnostics()
eventOverlayEnqueueGameEvent(gameEvent)
```

## Fondazione narrativa

Supporta caselle con:

- narratore;
- testo;
- avatar a sinistra o destra;
- portrait set registrabile;
- espressioni `neutral`, `explain`, `approve`, `warning`, `stern`;
- pulsanti Indietro, Ripeti, Chiudi, Avanti/Fine;
- placeholder grafico quando l'asset non è presente.

```js
narrativeRegisterPortraitSet("tutorial-guide", {
  neutral: "assets/narrative/guide-neutral.webp",
  explain: "assets/narrative/guide-explain.webp",
  approve: "assets/narrative/guide-approve.webp",
  warning: "assets/narrative/guide-warning.webp",
  stern: "assets/narrative/guide-stern.webp"
});

narrativeOpen([
  { speaker:"Istruttore", text:"Osserva il QG.", portraitSet:"tutorial-guide", expression:"explain", side:"left" }
]);
```

La fondazione conserva anche i campi `focus`, `highlight` e `allowedActions`, che saranno consumati dal runtime tutorial F9O6. F9O3 non applica automaticamente focus camera o blocchi gameplay.
