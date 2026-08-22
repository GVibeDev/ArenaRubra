ARENA RUBRA — F9V2b OVERWRITE PATCH
====================================

Target remoto verificato al momento della preparazione:
  GitHub main commit f7fab59402d779835ef0ec270383cc9a50b9e805
  F9V2a CUMULATIVE OVERWRITE PATCH
  Build: C2-STABLE-1-F9V2a-APK-M4c

Questa patch è un DELTA sopra F9V2a validata.
Non è necessario riapplicare F9V1a/F9V2a se il repository è già alla main indicata sopra.

BUILD DOPO LA PATCH
-------------------
C2-STABLE-1-F9V2b-APK-M4c
Build name: Tutorial Challenge I · Elimination
Logic baseline: C2-STABLE-1-F9T2c4-APK-M4c

INSTALLAZIONE
-------------
1. Assicurati che la copia locale corrisponda alla F9V2a validata / main indicata sopra.
2. Fai un backup oppure verifica che il working tree Git sia pulito.
3. Estrai IL CONTENUTO di questo ZIP nella root di ArenaRubra.
4. Consenti la sovrascrittura dei file esistenti.
5. Non cancellare gli altri file del repository: lo ZIP contiene solo file modificati/aggiunti da F9V2b rispetto a F9V2a.
6. Controlla git diff / git status prima del commit.

COSA AGGIUNGE F9V2b
-------------------
- Rende giocabile la Challenge I · Eliminazione dopo lo sblocco globale 5/5.
- Campo Starter, Exordium umano contro Nexus Bot Advanced.
- 4 unità Exordium già in campo.
- Nessuna mano, deck, Starter Card o acquisto; ENE bloccata a 0.
- 4 unità Starter Nexus in due ondate da due:
    NX2B01 Droide di Sicurezza
    NX3B01 Quad Ricognitore
- Ondata II solo dopo l'eliminazione completa dell'Ondata I.
- Vittoria Challenge al quarto abbattimento tracciato.
- Sconfitta se vengono eliminate tutte le unità assegnate al giocatore oppure il match termina con una condizione incompatibile con l'obiettivo.
- HUD dedicato con eliminazioni e ondata corrente.
- Persistenza tentativo/completamento nel registro Challenge F9V2a.
- Pulizia runtime quando si lascia la Challenge.
- Esclusione dai dati competitivi: tutorialMode=true e matchRecorded=false.

NON CAMBIA
----------
- Challenge II–V: restano visibili/sbloccabili ma In preparazione.
- Le 5 lezioni guidate F9V1a/F9V2a.
- Carte, costi, deck ufficiali, mappe, Missioni e bilanciamento.
- Advanced AI / Expert AI.
- Logic baseline F9T2c4.

TEST ESEGUITI
-------------
- JS syntax: 185 file PASS.
- Suite Node: 91/91 PASS.
- Browser: F9V1a authority PASS.
- Browser: F9V2a unlock PASS.
- Browser: tutte e 5 le lezioni guidate complete PASS, eseguite separatamente.
- Browser: Challenge I PASS con turno reale Bot Advanced, nessun acquisto, due ondate, completamento, nessun record competitivo, 0 page/console errors.

Vedi docs/Arena_Rubra_F9V2b_Test_Report.txt per il dettaglio e la nota sul timeout del batch browser aggregato.

TEST MANUALE RICHIESTO PRIMA DEL FREEZE
---------------------------------------
Gioca realmente Challenge I dopo lo sblocco 5/5 e verifica soprattutto:
- nessuna carta/ENE/acquisto disponibile;
- comportamento sensato del Nexus con sole due unità per ondata;
- seconda ondata non anticipata;
- vittoria esattamente al quarto abbattimento;
- ritorno corretto all'Accademia e possibilità di Ripeti.
