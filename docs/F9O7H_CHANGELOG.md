# Arena Rubra — F9O7h Tutorial Guidance & Adaptive Framing

Build candidata: `C2-STABLE-1-F9O7h-APK-M4c`  
Baseline validata: `C2-STABLE-1-F9Q3c1-APK-M4c`

## Modifiche

- L’anteprima carta della Mano resta pienamente visibile sopra lo scrim del tutorial in stato hover, selezionato o targeting.
- Il pulsante `Avanti` dei passi informativi riceve un richiamo pulsante.
- Carte, unità, celle, azioni e pulsanti richiesti dai passi guidati ricevono un indicatore pulsante automatico.
- Gli elementi descritti ma non cliccabili nei passi informativi ricevono un richiamo contestuale più leggero.
- Il runtime ripristina automaticamente l’evidenziazione se il renderer sostituisce il nodo DOM bersaglio.
- La camera tutorial calcola una safe viewport sottraendo vignetta narrativa, Mano aperta, preview carta e pannelli mobile.
- `cameraFocusHex`, `cameraFocusUnit` e `cameraFocusHQ` accettano ora un `viewportPoint` per centrare il bersaglio in una zona libera diversa dal centro fisico.
- Il focus adattivo viene applicato automaticamente ai bersagli su mappa, non soltanto ai passi che avevano già `focus:true`.
- Supporto `prefers-reduced-motion`: nessun lampeggio continuo, evidenziazione statica ad alto contrasto.
- Aggiunti smoke test desktop, mobile e statici F9O7h.

## Compatibilità

- Nessuna modifica ai testi, alle condizioni, alle carte o alla sequenza delle cinque lezioni.
- Nessuna modifica a gameplay, IA, mappe, Pressione, Missioni, terreni o salvataggi.
- Checkpoint e ripresa tutorial conservati.
- La fondazione è riutilizzabile da futuri scenari campagna data-driven.

## Fuori ambito

- Ottimizzazione generale del renderer e dell’IA a quattro giocatori.
- Riduzione della durata delle partite multigiocatore.
- Regole FFA e Missioni multigiocatore.
