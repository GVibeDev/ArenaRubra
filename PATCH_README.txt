ARENA RUBRA — F9V1a PATCH OVERWRITE
=====================================

Target:
  GVibeDev/ArenaRubra

Base ESATTA verificata:
  main commit 05509e2209af3b325f3bef1d6f4e4bfb2094f4bb
  C2-STABLE-1-F9T2d3-APK-M4c — Commander Deployment Commitment

Build candidata dopo la sovrascrittura:
  C2-STABLE-1-F9V1a-APK-M4c
  Tutorial Runtime 2.0 · Authoritative Interaction Hotfix

Baseline logica preservata:
  C2-STABLE-1-F9T2c4-APK-M4c

COME APPLICARE
1. Fai un commit/backup dello stato locale corrente.
2. Verifica che il repository locale corrisponda ancora al commit base sopra.
3. Estrai QUESTO ZIP direttamente nella root di ArenaRubra e consenti la sovrascrittura.
   Le cartelle src/, data/, tests/ e docs/ sono già nella posizione corretta.
4. Non copiare la cartella contenitore F9V1a_PATCH_OVERWRITE dentro ArenaRubra:
   devono essere copiati i suoi CONTENUTI nella root del repository.
5. Avvia i tutorial e fai il retest manuale delle cinque lezioni.

SCOPE
- riallineamento selector Tutorial ↔ HUD corrente;
- blocco degli input gameplay negli step informative;
- contratto autorevole per input utente negli step locked/guided;
- guardia su carta, cella/unità, abilità, movimento, build, tattica, pass unità e Fine turno manuale;
- diagnostica expectedInteraction;
- test tutorial aggiornati alla build F9V1a.

NON MODIFICA
- carte, costi, deck, Missioni, mappe, terreni o bilanciamento;
- Advanced/Expert AI;
- modello telemetrico F9Q3e1-2;
- logica baseline F9T2c4.

IMPORTANTE
I turni interni auto/bot/tutorial_script restano autorizzati. La prima implementazione che
bloccava anche l'auto-end rompeva la regia deterministica della Lezione 1; questa patch
blocca gli input utente fuori contratto senza interrompere gli eventi interni dello scenario.

TEST ESEGUITI
- JS syntax src+data: 94/94 PASS
- Node suite: 90/90 PASS
- F9V1a authoritative browser smoke: PASS
- Browser E2E Lezioni 1,2,3,4,5: PASS; page/console errors 0
- checkpoint/resume, UI-state resume, guidance, adaptive framing: PASS nei test mirati

Questa è la fase F9V1a di stabilizzazione runtime. L'espansione didattica e dei dialoghi
viene dopo il retest manuale, non è contenuta in questa patch.
