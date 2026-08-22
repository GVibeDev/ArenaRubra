# Arena Rubra — F9V2e · Tutorial Challenge IV · Pressione

## Base

- Base validata dall'autore: `C2-STABLE-1-F9V2d-APK-M4c`.
- Riferimento remoto del core Pressione verificato: GitHub `main` commit `16537833101b7ff1ffb0c07f72aa180301196003` (F9V2c).
- Target candidato: `C2-STABLE-1-F9V2e-APK-M4c`.

## Obiettivo

La quarta Prova sul campo realizza il quarto gradino della progressione Challenge Starter 2.0: **unità già schierate + mano iniziale + deck ridotto a 20 carte**, con vittoria soltanto quando il core ordinario assegna una **vittoria per Pressione**.

La Challenge non introduce una variante della Pressione e non abbrevia artificialmente la soglia: usa il contratto F9R3 già presente nel gioco.

## Scenario

- Mappa: Campo Starter.
- Modalità: Rapida / Competitive.
- Round iniziale: 20.
- Giocatore: Agathoi, umano.
- Avversario: Exordium, Bot Advanced.
- Iniziativa: giocatore.
- Pressione iniziale: 0–0.
- ENE iniziale: Agathoi 10, Exordium 8.

### Schieramento Agathoi

1. `AGCMD02` — Dycaios sul PS centrale `[0,0,0]`.
2. `AG1B02` — Oplita di Confine sul PS nord `[0,-4,4]`.
3. `AG2B01` — Carro Falange a `[-2,-1,3]`.
4. `AGC1F03` — Phylax Difensore a `[-1,-1,2]`.

Il giocatore parte quindi qualificato per l'avanzamento Pressione: controlla il centro e 2/3 PS.

### Opposizione Exordium

1. `EX0B00` — Varran a `[2,0,-2]`.
2. `EX1B04` — Legionario Pesante a `[1,0,-1]`.
3. `EX2B03` — Carro Medio Exordium a `[2,-1,-1]`.
4. `EXC1F04` — Cursor sul PS sud `[0,4,-4]`.

Il Bot non dispone di mano/deck, ma conserva ENE e abilità delle unità schierate. Deve quindi spezzare il presidio territoriale con il normale runtime Advanced, senza introdurre una seconda economia di carte nella Prova.

## Carte

### Mano iniziale Agathoi — 5

- `UNIT:AG2B02`
- `UNIT:AGC1F02`
- `TACTIC:AGTAC07`
- `TACTIC:AGTAC05`
- `TACTIC:AGTAC04`

### Deck ridotto Agathoi — 20

- `UNIT:AG1B01`
- `UNIT:AG1B02`
- `UNIT:AG1B03`
- `UNIT:AG2B01`
- `UNIT:AG2B02`
- `UNIT:AGC1F01`
- `UNIT:AGC1F02`
- `UNIT:AGC1F03`
- `UNIT:AGC1F04`
- `UNIT:AGC1F05`
- `UNIT:AGC1F06`
- `UNIT:AGC1F07`
- `UNIT:AG4B01`
- `TACTIC:AGTAC01`
- `TACTIC:AGTAC02`
- `TACTIC:AGTAC03`
- `TACTIC:AGTAC06`
- `TACTIC:AGTAC08`
- `TACTIC:AGTAC09`
- `TACTIC:AGTAC08`

Il pool mano+deck rispetta il limite massimo di due copie per ID. Non vengono aggiunte carte nuove al catalogo.

## Contratto della Pressione

Su Campo Starter sono presenti 3 PS:

- centro `[0,0,0]`;
- nord `[0,-4,4]`;
- sud `[0,4,-4]`.

In Rapida, dal round 20 il core F9R3 valuta la Pressione al confine del round. Per avanzare un giocatore deve:

1. controllare il **PS centrale**;
2. controllare almeno `ceil(3/2) = 2` PS complessivi;
3. essere l'unico giocatore qualificato in quella valutazione.

Ogni valutazione valida incrementa la Pressione di 1. La soglia ordinaria Rapida resta **5**.

La Challenge ascolta `PRESSURE_CHANGED` soltanto per aggiornare HUD e feedback. Il completamento non viene deciso da quel contatore: è autorevole esclusivamente l'evento `VICTORY` emesso dal core con:

- `winner = playerSide`;
- `winType = "pressione"`.

Se il giocatore vince per QG, spareggio o altra condizione, la Challenge termina come fallita (`wrong_victory_condition`). Se vince l'avversario, termina come fallita (`enemy_victory`).

## Restrizioni della Prova

- Starter reserve disabilitata.
- Missioni disabilitate.
- Recupero deck disabilitato.
- Mano/deck del Bot disabilitati.
- ENE del Bot **non** bloccata: abilità delle unità schierate restano operative.
- `tutorialMode=true` e `matchRecorded=false`.

## Fuori ambito

- Nessuna modifica alle regole Pressione F9R3 del match normale.
- Nessuna modifica a carte, costi o deck ufficiali.
- Nessuna modifica a mappe o bilanciamento.
- Nessuna modifica ad Advanced/Expert AI.
- Challenge V resta placeholder sbloccato ma non giocabile.
