ARENA RUBRA — F9V3a PATCH OVERWRITE
====================================

Milestone:
  C2-STABLE-1-F9V3a-APK-M4c
  Unified Result Modal

Base richiesta:
  C2-STABLE-1-F9V2f-APK-M4c VALIDATA
  F9V2f validata dall'autore il 2026-08-22

Riferimento remoto verificato:
  GitHub main commit 683688a543298c7dbccd4d9096708b6e05dea3a5
  F9V2f PATCH OVERWRITE

SCOPO
-----
Aggiungere un unico popup conclusivo persistente condiviso da:
- lezioni Tutorial;
- Challenge / Prove sul campo;
- normale modalità di gioco.

La patch è UI/runtime soltanto. Non modifica condizioni di vittoria, carte, deck,
Missioni, mappe, ENE, AI, Pressione, QG, statistiche o schema telemetrico.

INSTALLAZIONE
-------------
1. Apri la root locale del repository ArenaRubra già aggiornata a F9V2f validata.
2. Estrai IL CONTENUTO di questo ZIP nella root.
3. Consenti la sovrascrittura dei file esistenti.
4. Non cancellare asset o altri file non presenti nello ZIP.
5. Ricarica completamente la pagina dopo la sovrascrittura.

COSA AGGIUNGE
-------------
- Lezioni Tutorial: popup persistente "LEZIONE COMPLETATA".
- Challenge: popup persistente "PROVA COMPLETATA" o "PROVA FALLITA".
- Niente ritorno automatico all'Accademia dopo una lezione/Challenge conclusa.
- Il campo finale resta visibile dietro al popup fino a una scelta del giocatore.
- Match normale: popup terminale VITTORIA / SCONFITTA / PAREGGIO.
- Il risultato normale legge esclusivamente l'evento VICTORY autorevole del core.
- Vincitore mostrato chiaramente come "Giocatore N" + fazione.
- Round e condizione di vittoria mostrati quando disponibili.
- Pulsanti comuni: Log, Telemetria, Statistiche, Menu principale, Nuova partita.
- Nei flussi Tutorial/Challenge compare anche "Torna all'Accademia".
- Log riusa il PanelManager esistente.
- Statistiche riusa il pannello Statistiche del GameScreen.
- Telemetria riusa il pannello Telemetria del Control Center.
- Nuova partita apre il Setup esistente; non avvia automaticamente un match.
- Escape non chiude il popup terminale: serve una scelta esplicita.
- Focus tastiera confinato ai pulsanti del popup durante la visualizzazione.
- Le normali Carte Missione continuano a usare l'event overlay rapido già esistente.

FILE RUNTIME MODIFICATI
-----------------------
- src/tutorial_runtime.js
- src/build_info.js

TEST
----
Vedi docs/Arena_Rubra_F9V3a_Test_Report.txt.
