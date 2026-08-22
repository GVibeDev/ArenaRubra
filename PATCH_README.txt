ARENA RUBRA — F9V2a CUMULATIVE OVERWRITE PATCH
================================================

Target tecnico remoto verificato:
  GitHub main commit 05509e2209af3b325f3bef1d6f4e4bfb2094f4bb
  C2-STABLE-1-F9T2d3-APK-M4c

Questa patch è CUMULATIVA:
- incorpora integralmente la patch F9V1a validata;
- aggiunge F9V2a Tutorial Challenge Framework & Unlock System.

Può quindi essere sovrascritta anche su una copia del repository ancora ferma alla
HEAD F9T2d3 indicata sopra. Se la tua copia locale contiene già F9V1a, la
sovrascrittura porta semplicemente i file alla versione F9V2a.

BUILD DOPO LA PATCH
-------------------
C2-STABLE-1-F9V2a-APK-M4c
Build name: Tutorial Challenge Framework & Unlock System
Logic baseline: C2-STABLE-1-F9T2c4-APK-M4c

INSTALLAZIONE
-------------
1. Fai un backup o assicurati che il working tree Git sia pulito.
2. Estrai IL CONTENUTO di questo ZIP nella root di ArenaRubra.
3. Consenti la sovrascrittura dei file esistenti.
4. Non cancellare gli altri file del repository: lo ZIP contiene solo i file
   modificati/aggiunti dal cumulativo F9V1a + F9V2a.
5. Esegui i tuoi test locali/browser e verifica git diff / git status prima del commit.

COSA AGGIUNGE F9V2a
-------------------
- 5 Tutorial Challenge sempre visibili nell'Accademia.
- Stato LOCKED fino al completamento di tutte le 5 lezioni guidate.
- Unlock simultaneo di tutte le Challenge a 5/5.
- Condizione di unlock visibile su ogni card.
- Registro data-driven delle cinque Challenge pianificate.
- Storage retrocompatibile: aggiunge challenges:{} senza azzerare i progressi esistenti.
- Persistenza separata di tentativi/completamenti Challenge.
- Scheletro runtime freeplay per F9V2b–F9V2f.
- Challenge predisposte con tutorialMode=true e matchRecorded=false.

IMPORTANTE
----------
F9V2a NON rende ancora giocabili le cinque Challenge. Dopo l'unlock le card risultano
"Sbloccata · in preparazione" e il pulsante resta disabilitato. Gli scenari reali
entreranno separatamente in F9V2b, F9V2c, F9V2d, F9V2e e F9V2f.

F9V1a RESTA PRESERVATA
----------------------
Il contratto autorevole delle lezioni F9V1a non è stato modificato. Le funzioni di
action matching / interaction gate / action gate / notify / capture hanno hash
identici tra F9V1a e F9V2a nel controllo eseguito durante la preparazione della patch.

TEST ESEGUITI QUI
-----------------
- node --check su tutti i file JS presenti nel pacchetto cumulativo: PASS.
- python -m py_compile su tutti i test Python presenti nel pacchetto: PASS.
- tests/f9v2a_tutorial_challenge_framework_smoke.js: PASS.
- tests/f9v2a_browser_challenge_unlock_smoke.py con Chromium headless: PASS.
- Nessun pageerror / console error nel browser smoke dedicato.

La suite completa del repository non è stata eseguita in questo ambiente perché il
container non ha accesso di rete per clonare l'intero repository. I test congelati
inclusi nel cumulativo sono stati aggiornati alla nuova BUILD_INFO, ma la regressione
completa va eseguita sulla tua copia locale completa prima del freeze definitivo.
