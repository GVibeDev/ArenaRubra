# F9O4e — Public Bot Card Thumbnail Stability Hotfix

## Baseline

`C2-STABLE-1-F9O4d-APK-M4c` — validata su gioco umano-vs-bot e umano-vs-umano.

## Problema osservato

Nelle partite bot-vs-bot i dorsi delle carte ordinarie coperte erano stabili. Lo sfarfallio riguardava invece le carte pubbliche della mano rapida:

- tre carte Starter;
- Comandante;
- Missione, quando presente.

Il renderer incrementale ricostruiva talvolta i nodi della mano durante le micro-azioni del bot. I nuovi canvas ripartivano dal fallback mentre illustrazione e cornice venivano nuovamente risolte.

## Correzione

- Cache bitmap persistente delle miniature già disegnate.
- Snapshot conservato anche durante il caricamento: una ricostruzione mantiene l'ultimo frame utile invece di tornare al fallback.
- Snapshot definitivo marcato `ready` quando art e cornice sono caricate o definitivamente risolte tramite fallback.
- Ripristino sincrono del canvas prima dell'accodamento del renderer.
- Aggiornamento automatico dei canvas collegati quando il prewarm termina.
- Prewarm delle sole carte pubbliche per entrambi i giocatori quando la modalità è bot-vs-bot.
- Esclusione completa delle carte ordinarie coperte dal prewarm e dal caricamento delle illustrazioni.
- Cache LRU limitata a 40 miniature; una carta visualmente identica riusa la cache anche se cambia il nodo DOM o l'UID dell'istanza.

## Compatibilità

La patch conserva:

- renderer DOM incrementale F9O4c;
- integrità delle firme Missione F9O4d;
- privacy della mano F9O4;
- camera e controlli touch;
- animazioni carte;
- fallback WebView Android;
- browser desktop ed EXE Windows.

## Fuori ambito

Nessuna modifica a gameplay, IA, deck, Missioni, soglie, ricompense, camera, asset, dorsi o regole di visibilità.
