# F9U1a1 — Checklist manuale

Build: `C2-STABLE-1-F9U1a1-APK-M4c`

## Inspector unità

- [ ] Selezionando un’unità sulla mappa, l’Inspector si apre sul lato destro.
- [ ] L’immagine della carta è grande quanto la preview delle carte in mano.
- [ ] Il pulsante dell’abilità principale compare subito sotto la carta.
- [ ] Il pulsante abilità mostra correttamente costo, cooldown e stato disabilitato.
- [ ] La tabella mostra soltanto HP, DEF e ATT con font chiaramente leggibile.
- [ ] Le abilità attive e passive sono leggibili sotto le statistiche.
- [ ] I pulsanti inferiori sono Muovi unità, Costruisci e Fine turno.
- [ ] Non compare più Passa azione unità.
- [ ] Un’unità senza abilità attiva mostra il relativo pulsante disabilitato senza errori.
- [ ] Una struttura o un’unità non comandabile mostra correttamente i pulsanti disabilitati.
- [ ] Con testi lunghi, l’Inspector scorre internamente e non esce dallo schermo.

## Mano

- [ ] L’overlay della mano è più centrato rispetto alla mappa.
- [ ] Non copre l’Inspector destro.
- [ ] Mostra/Nascondi mano continua a funzionare dal dock sinistro.
- [ ] Le anteprime hover delle carte continuano a funzionare.
- [ ] La selezione e la giocata delle carte non hanno regressioni.

## Controlli superiori

- [ ] Musica e volume non sono coperti da altri pulsanti.
- [ ] Carte animate, Miniature FX ed Effetti sono affiancati.
- [ ] I tre pulsanti cambiano correttamente stato e testo.
- [ ] Il controllo volume resta utilizzabile.
- [ ] Il pulsante Debug resta accessibile.

## Desktop e Android

- [ ] Desktop 16:9: nessuna sovrapposizione fra dock, mano e Inspector.
- [ ] APK landscape: i controlli superiori non coprono il dock sinistro.
- [ ] APK landscape: l’Inspector scorre senza bloccare la mappa.
- [ ] Rotazione o ritorno dall’app non rompe la disposizione.
- [ ] Nessun rallentamento evidente rispetto a F9U1a.

## Regressioni essenziali

- [ ] Telemetria schema F9Q3e1-2 ancora presente.
- [ ] Attribuzione PS corretta.
- [ ] Pivot multi-istanza correttamente tracciate.
- [ ] 50 deck ufficiali visibili.
- [ ] Tutorial avviabile.
- [ ] Debug Log, Statistiche e Telemetria apribili.
