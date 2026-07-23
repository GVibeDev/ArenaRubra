# F9O4d — Cross-platform Render Signature Integrity Hotfix

## Problema
Il renderer incrementale F9O4c evitava la ricostruzione della mano e del pannello carte quando la firma DOM non cambiava. Le firme non comprendevano però lo stato Missione. Dopo un progresso, il runtime poteva risultare pronto mentre badge, obiettivi o conferma restavano fermi al markup precedente.

## Contratto corretto
`missionUiRenderSignature(side)` serializza Missione, classe, ciclo, stato, obiettivi, valori, serie, `ready`, `readyCount`, blocchi, conferme e ricompense pendenti.

La firma viene inclusa nella mano rapida e nel pannello Mano/deck. Il dock Azioni espone la stessa firma a fini diagnostici. `emitGameEvent()` invalida le firme dopo gli eventi Missione, `DECK_RECOVERED`, `CARD_BLOCKED` e `CARD_UNBLOCKED`.

Il rendering usa una verifica di giocabilità non mutante (`evaluate:false`): generare dashboard, dock e carte non richiama la rivalutazione del tracker. La validazione completa viene comunque rieseguita quando il giocatore richiede o conferma il gioco della Missione.

## Compatibilità
La patch conserva le ottimizzazioni F9O4c e non cambia logica, soglie, ricompense, IA, camera o asset. La correzione è condivisa da WebView Android, browser e wrapper Windows.
