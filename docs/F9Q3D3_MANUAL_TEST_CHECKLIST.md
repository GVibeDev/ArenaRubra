# F9Q3d3 — Checklist manuale

Build: `C2-STABLE-1-F9Q3d3-APK-M4c`  
Baseline: `C2-STABLE-1-F9Q3d2-APK-M4c`

## 1. Avvio e regressione immediata

- [ ] Aprire la build e verificare la versione F9Q3d3 nel menu Informazioni.
- [ ] Avviare un normale 1v1 e completare almeno due round.
- [ ] Verificare che il turno alterni correttamente G1 e G2.
- [ ] Verificare che deck custom, Missione e Pivot alternativa selezionati nel Setup siano conservati.

## 2. Eliminazione in una partita FFA

Usare una mappa a 3 o 4 giocatori, preferibilmente Central hotspot o La Trappola.

- [ ] Eliminare il QG di un giocatore che non è quello di turno.
- [ ] Verificare che tutte le sue unità e strutture spariscano dal campo.
- [ ] Verificare che il suo QG resti visibile ma non sia più conquistabile o bersagliabile come QG attivo.
- [ ] Verificare che il giocatore non compaia più nei selettori di bersaglio.
- [ ] Verificare che il giocatore non riceva più turni.
- [ ] Verificare che gli altri giocatori continuino normalmente.

## 3. Eliminazione del giocatore corrente

- [ ] Durante il turno di un giocatore, usare Concedi oppure provocare una resa tecnica/eliminazione.
- [ ] Verificare che il gioco passi subito al prossimo giocatore attivo.
- [ ] Verificare che non vengano applicati due inizi turno o due fine turno.
- [ ] Eliminare l’ultimo giocatore nell’ordine del round e verificare che il round aumenti una sola volta.
- [ ] Con due giocatori consecutivi già eliminati, verificare che entrambi vengano saltati senza blocco o rallentamento anomalo.

## 4. Controllo territorio e pericoli

- [ ] Prima dell’eliminazione, far controllare almeno un PS al giocatore bersaglio.
- [ ] Dopo l’eliminazione, verificare che quel PS non resti assegnato al giocatore eliminato.
- [ ] Creare una mina o un effetto cella appartenente al giocatore e verificare che venga rimosso.
- [ ] Su una mappa con pericolo iniziale, verificare che un pericolo della mappa venga neutralizzato e non cancellato per errore.
- [ ] Verificare che eventuali blocchi PS creati dall’eliminato terminino.

## 5. Effetti persistenti

- [ ] Applicare da parte del giocatore da eliminare un debuff ENE/costo a un avversario.
- [ ] Eliminare la fonte e verificare che il debuff termini.
- [ ] Applicare uno stato temporaneo a un’unità avversaria e verificare che termini quando la fonte viene eliminata.
- [ ] Verificare che effetti appartenenti agli altri giocatori restino attivi.
- [ ] Verificare che lock ENE, lock mano e cooldown dell’eliminato vengano azzerati.

## 6. Possesso di carte e unità

- [ ] Rubare una carta al giocatore che verrà eliminato.
- [ ] Eliminare il proprietario originario e verificare che la carta resti al possessore corrente.
- [ ] Convertire un’unità del giocatore che verrà eliminato.
- [ ] Eliminare il proprietario originario e verificare che l’unità convertita resti in campo al nuovo controllore.
- [ ] Aprire log/statistiche e verificare che mano, deck e scarti dell’eliminato siano ancora registrabili e non trasferiti.

## 7. Selettori e Missioni pendenti

- [ ] Aprire un selettore FFA che includa il giocatore da eliminare.
- [ ] Eliminare quel giocatore e verificare che il selettore non resti bloccato.
- [ ] Con almeno un altro bersaglio valido, verificare che la scelta possa proseguire.
- [ ] Con nessun bersaglio valido, verificare che la ricompensa si chiuda senza softlock.
- [ ] Eliminare il giocatore incaricato di scegliere carte per Cospirazione e verificare la chiusura sicura.
- [ ] Eliminare il proprietario di una Missione con ricompensa pendente e verificare che la ricompensa venga annullata.

## 8. Vittoria finale

- [ ] Eliminare i giocatori fino a lasciarne uno solo attivo.
- [ ] Verificare che la partita termini immediatamente.
- [ ] Verificare che il vincitore sia quello realmente ancora attivo.
- [ ] Verificare che il log riporti le eliminazioni nell’ordine corretto.
- [ ] Verificare che lo snapshot/statistiche distingua `winner` ed `eliminated`.

## 9. Android/APK

- [ ] Generare l’APK dalla candidata senza modificare il contenuto del pacchetto.
- [ ] Ripetere almeno un’eliminazione in una partita a 3 giocatori.
- [ ] Controllare che overlay, menu inferiori e selettori si chiudano correttamente.
- [ ] Verificare che il salto del turno non produca schermate vuote o blocchi della WebView.
- [ ] Lasciare proseguire i bot per almeno cinque round dopo la prima eliminazione.

## Criterio di validazione

La build è validabile quando nessun giocatore eliminato riceve turni o può essere bersagliato, la bonifica non rimuove proprietà già trasferite, le selezioni pendenti non causano softlock e l’ultimo giocatore attivo vince correttamente.
