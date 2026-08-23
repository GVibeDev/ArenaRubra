ARENA RUBRA — F9W1a CANDIDATE PATCH OVERWRITE
==============================================

Milestone:
  C2-STABLE-1-F9W1a-APK-M4c
  Match Data 2.0 Foundation

Base richiesta:
  C2-STABLE-1-F9V4a-APK-M4c VALIDATA

Riferimento remoto verificato prima della patch:
  GitHub main 0d1aa4ee68e745c275c70c543306fd9f58049f6e

SCOPO
-----
Apre S2-C3 Match Data 2.0.

- MatchRecord canonico AR-MATCH-2, N-player.
- partecipanti 2P/3P/4P con human/bot, fazione, comandante, deck, lifecycle e finali.
- MatchTelemetry tecnica separata in arenaRubra.matchTelemetry.v2 / AR-TELEMETRY-2.
- collegamento MatchRecord <-> Telemetry tramite matchId.
- migrazione idempotente dello storico legacy con estrazione della telemetria incorporata.
- alias p1/p2 mantenuti temporaneamente per compatibilità.
- Cronologia, Statistiche, pannello in-game e CSV aggiornati per N-player.
- nuovo store incluso nei backup Control Center e persistito nel Local Data Vault.
- Tutorial/Challenge e Match Lab restano esclusi dalle statistiche competitive.

NESSUNA MODIFICA CORE
---------------------
Nessuna modifica a regole, carte, costi, deck, ENE, mappe, Missioni, AI, QG,
Pressione, Action Contract, Tutorial/Challenge o contenuti F9V4a.

INSTALLAZIONE
-------------
Sovrascrivere i file del pacchetto sulla cartella completa F9V4a validata mantenendo
la stessa struttura relativa.

Questa è una CANDIDATA. Non diventa baseline fino a VALIDATA manuale.
