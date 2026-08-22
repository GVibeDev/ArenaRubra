# Arena Rubra — F9V2c · Tutorial Challenge II: Tenuta

## Base

- Base operativa validata: `C2-STABLE-1-F9V2b-APK-M4c`
- Baseline logica preservata: `C2-STABLE-1-F9T2c4-APK-M4c`
- Scope: Tutorial Challenge soltanto. Nessuna modifica a carte ufficiali, bilanciamento, mappe, Missioni o AI generale.

## Prova sul campo II — Tenuta

La Challenge diventa disponibile insieme alle altre Prove dopo il completamento 5/5 dell'Accademia.

Setup:

- Mappa: Campo Starter.
- Giocatore: Nexus umano.
- Avversario: Exordium, Bot Advanced.
- 4 unità Nexus già schierate.
- Mano fissa di 5 carte Nexus.
- Deck vuoto per entrambi i giocatori.
- Nessuna Starter reserve.
- Nessuna pesca dal deck.
- Recupero deck disabilitato autoritativamente durante la Challenge.
- Exordium senza mano, deck, Starter reserve o ENE utilizzabile.

Obiettivo:

- controllare il PS centrale `[0,0,0]` alla fine di 3 propri turni consecutivi;
- se Exordium sottrae il controllo durante il proprio turno, il contatore viene azzerato al successivo TURN_STARTED Nexus;
- il controllo valido viene certificato sul `TURN_ENDED` Nexus, dopo l'aggiornamento autorevole del controllo PS.

Pressione nemica:

- 6 unità Starter Exordium;
- 3 ondate da 2;
- Ondata I all'avvio;
- Ondata II dopo il primo turno personale Nexus;
- Ondata III dopo il secondo turno personale Nexus;
- ogni ondata contiene `EX1B01` Guardia di Aurex e `EXC1F04` Cursor.

HUD Challenge:

`PROVA II · Tenuta x/3 · Minaccia y/6`

Sconfitta:

- nessuna unità combattente Nexus rimasta;
- oppure il motore conclude il match con una condizione diversa dall'obiettivo Challenge.

Persistenza e statistiche:

- progressi separati in `arenaRubra.tutorial.v1.challenges`;
- `tutorialMode=true` e `tutorialChallengeMode=true` durante la prova;
- `matchRecorded=false`: nessuna contaminazione dello storico competitivo.

## Compatibilità F9V2b

La Prova I · Eliminazione resta disponibile e invariata nel contratto: 4 bersagli Starter Nexus in 2 ondate da 2, senza carte/ENE.

Le Challenge III–V restano visibili, sbloccabili 5/5 e `In preparazione`.
