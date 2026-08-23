ARENA RUBRA — F9V3b PATCH OVERWRITE
====================================

Milestone candidata:
  C2-STABLE-1-F9V3b-APK-M4c
  Tutorial Runtime Hardening & Action Contract Closure

Base richiesta:
  C2-STABLE-1-F9V3a-APK-M4c VALIDATA
  F9V3a validata dall'autore il 2026-08-22

Riferimento remoto verificato:
  GitHub main commit a785b2460f440fe6ee5da9216950374667c1962a
  F9V3a PATCH OVERWRITE

SCOPO
-----
Chiudere il blocco tecnico Tutorial Runtime 2.0 prima del Content Pass.
La patch non aggiunge nuove regole e non riscrive le cinque lezioni.

F9V3b aggiunge:
- Action Contract semantico schema F9V3b-1;
- classificazione pre-mutation di selezione unità, movimento, attacco,
  ability target, tactic target, deploy, build, carta e fine turno;
- guardie lazy sugli entrypoint gameplay usati dal Tutorial;
- blocco dell'azione errata prima dell'ingresso nel mutatore;
- bypass del gate interno duplicato soltanto dopo accettazione semantica;
- fallback anti selector-drift per Mano, Fine turno, Abilità, area carte e score;
- diagnostica expectedSemanticInteraction + Action Contract;
- audit statico di tutti i 116 step / 64 step interattivi;
- aggregatore browser 5/5 lezioni + resume + guidance + Result Modal.

INVARIANTI
----------
Nessuna modifica a:
- carte / deck / costi;
- Missioni;
- ENE;
- mappe;
- AI Advanced / Expert;
- Pressione / QG / condizioni di vittoria;
- telemetria e statistiche competitive;
- struttura delle cinque Challenge;
- contenuto e ordine dei 116 step;
- Unified Result Modal F9V3a.

INSTALLAZIONE
-------------
1. Parti dalla root locale Arena Rubra aggiornata a F9V3a VALIDATA.
2. Estrai IL CONTENUTO di questo ZIP nella root del repository.
3. Consenti la sovrascrittura dei file esistenti.
4. Non cancellare file o asset non presenti nello ZIP.
5. Esegui un refresh completo della pagina dopo la sovrascrittura.

TEST
----
Vedi:
  docs/Arena_Rubra_F9V3b_Test_Report.txt
  docs/Arena_Rubra_F9V3b_Tutorial_Runtime_Hardening.md

Stato:
  CANDIDATA — richiede validazione manuale browser.
