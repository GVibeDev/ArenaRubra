ARENA RUBRA — F9V3c PATCH OVERWRITE
====================================

Milestone:
  C2-STABLE-1-F9V3c-APK-M4c
  Result Flow & Tutorial UX Polish

Base richiesta:
  C2-STABLE-1-F9V3b-APK-M4c VALIDATA
  F9V3b validata manualmente il 2026-08-23 con green flag sulle cinque lezioni,
  azioni errate e checkpoint/ripresa.

Riferimento remoto verificato:
  GitHub main commit a785b2460f440fe6ee5da9216950374667c1962a
  F9V3a PATCH OVERWRITE
  (F9V3b validata localmente non era ancora pubblicata su main.)

SCOPO
-----
F9V3c rifinisce il flusso di conclusione partita e l'esperienza Accademia senza
modificare il core di gioco.

Aggiunge:
- Terminal Result Lock persistente;
- Log / Telemetria / Statistiche come viste temporanee del risultato normale;
- ritorno automatico al Result Modal quando tali viste vengono chiuse;
- risoluzione del lock da Menu principale / Nuova partita, compresi i pulsanti title bar;
- risultati Tutorial/Challenge senza strumenti di analisi;
- Lezione successiva, Prova successiva e Riprova contestuali;
- Lezione 5 -> Prova sul campo I;
- indicazione grafica X/5 e check di completamento nell'Accademia;
- rimozione della label tecnica `neutral`/espressione sotto i narratori;
- controllo di recupero deck sempre visibile a deck vuoto, anche quando bloccato,
  con motivazione esplicita.

AUDIT DECK RECOVERY
-------------------
Le tre Starter NON sono carte della Mano e NON bloccano il recovery.
La Mano ordinaria vive in state.hand; le Starter in state.starterCards.
La causa UX individuata è la precedente condizione che nascondeva completamente
il pulsante se a deck vuoto restava almeno una carta ordinaria in Mano.

INSTALLAZIONE
-------------
1. Parti dalla root locale Arena Rubra già aggiornata alla F9V3b VALIDATA.
2. Estrai IL CONTENUTO di questo ZIP nella root del repository/progetto.
3. Consenti la sovrascrittura dei file esistenti.
4. Non cancellare file o asset non presenti nello ZIP.
5. Esegui un refresh completo della pagina prima dei test.

INVARIANTI
----------
Nessuna modifica a:
- regole di vittoria;
- carte / costi / deck rules / Starter;
- regole del deck recovery;
- ENE;
- Missioni;
- AI;
- mappe;
- QG / Pressione;
- statistiche / storico / schema telemetrico;
- Action Contract F9V3b-1.

TEST
----
Vedi:
  docs/Arena_Rubra_F9V3c_Test_Report.txt
  docs/Arena_Rubra_F9V3c_Result_Flow_Tutorial_UX.md

STATO
-----
CANDIDATA — richiede validazione manuale prima di diventare nuova baseline.
