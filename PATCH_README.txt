ARENA RUBRA — F9V2f PATCH OVERWRITE
====================================

Milestone:
  C2-STABLE-1-F9V2f-APK-M4c
  Tutorial Challenge V · Esame finale

Base richiesta:
  C2-STABLE-1-F9V2e-APK-M4c VALIDATA
  F9V2e validata dall'autore il 2026-08-22

Riferimento core remoto verificato:
  GitHub main commit 16537833101b7ff1ffb0c07f72aa180301196003
  F9V2c
  Deck/mano, economia e condizioni di vittoria usate dall'Esame finale non vengono modificate dalla patch.

NOTA SIGLA
-----------
La sequenza pianificata delle cinque Prove è F9V2b -> F9V2c -> F9V2d -> F9V2e -> F9V2f.
Questa patch usa quindi F9V2f come milestone della quinta Prova.

INSTALLAZIONE
-------------
1. Apri la root locale del repository ArenaRubra già aggiornata a F9V2e validata.
2. Estrai IL CONTENUTO di questo ZIP nella root.
3. Consenti la sovrascrittura dei file esistenti.
4. Non cancellare asset o altri file non presenti nello ZIP.

COSA AGGIUNGE
-------------
- Challenge V · Esame finale giocabile.
- Exordium umano vs Nexus Advanced su Campo Starter.
- Modalità Rapida / Competitive, scala Tattica.
- Varran contro Avatex.
- Nessuna unità Challenge pre-schierata: partenza normale dai QG.
- Nessuna mano/deck custom della Challenge.
- Entrambi i lati usano il normale deck template regolamentare: 30 carte conteggiate, mano iniziale 5, 25 carte residue nel deck.
- Starter reserve, ENE, income, pesca, scarti e recupero deck restano normali.
- Nessuna restrizione speciale su carte o abilità del Bot.
- Mission runtime non forzato né rimosso dalla Challenge.
- Obiettivo autorevole: qualunque VICTORY del core con winner=giocatore completa l'Esame.
- Vittoria Nexus => fallimento; pareggio => fallimento.
- HUD dedicato: Mano / Deck / ENE / Pressione.
- Prove I–IV preservate.
- Match tutorialMode=true e matchRecorded=false: gameplay completo, dati competitivi esclusi.
- Nessuna modifica a regole QG/Pressione, carte, costi, deck ufficiali, mappe, Missioni, Advanced/Expert AI o bilanciamento.

TEST
----
Vedi docs/Arena_Rubra_F9V2f_Test_Report.txt.
