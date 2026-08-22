# Arena Rubra — F9V2d · Tutorial Challenge III · Breccia

## Base

- Base validata: `C2-STABLE-1-F9V2c-APK-M4c`.
- GitHub `main` verificata prima della generazione: `16537833101b7ff1ffb0c07f72aa180301196003`.
- Target candidato: `C2-STABLE-1-F9V2d-APK-M4c`.

## Obiettivo

La terza Prova sul campo completa il terzo gradino della progressione Challenge definita per Starter 2.0: **unità già schierate + mano iniziale + deck ridotto a 10 carte**, con vittoria quando una unità del giocatore **occupa il QG nemico**.

## Scenario

- Mappa: Campo Starter.
- Giocatore: Exordium, umano.
- Avversario: Nexus, Bot Advanced.
- Iniziativa: giocatore.
- 3 unità Exordium iniziali: Varran, Cursor, Veicolo Ricognitore.
- 4 difensori Nexus iniziali: Droide di Sicurezza, Quad Ricognitore, Fante Robot, Mech Leggero.
- Mano iniziale Exordium: 5 carte deterministiche.
- Deck Exordium: 10 carte deterministiche pescabili.
- Mano/deck Nexus: vuoti.
- ENE Nexus: bloccata a 0.
- Starter reserve: disabilitata.
- Missioni: disabilitate.
- Recupero deck: disabilitato.

## Contratto dell'obiettivo

La Challenge ascolta `UNIT_MOVED` e considera completata la prova quando `data.player` coincide con il giocatore e `data.to` coincide con la posizione runtime del QG nemico. La verifica usa la posizione del QG presente nello stato, non una coordinata duplicata nel contratto della Challenge.

Questo è intenzionale: **Breccia valuta soltanto l'occupazione del QG**. Non richiede il controllo di almeno un PS previsto dalla vittoria QG della partita ordinaria, perché il focus didattico della Prova III è attraversare la linea, usare mano/deck e convertire l'avanzata in penetrazione del QG.

## Fuori ambito

- Nessuna modifica alle regole QG del match normale.
- Nessuna modifica a carte, costi o deck ufficiali.
- Nessuna modifica a mappe o bilanciamento.
- Nessuna modifica ad Advanced/Expert AI.
- Challenge IV e V restano placeholder sbloccati ma non giocabili.
