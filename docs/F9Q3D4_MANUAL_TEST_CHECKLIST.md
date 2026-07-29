# F9Q3d4 — Checklist manuale

Build: `C2-STABLE-1-F9Q3d4-APK-M4c`  
Baseline: `C2-STABLE-1-F9Q3d3-APK-M4c`

## 1. Avvio e regressione immediata

- [ ] Aprire Informazioni e verificare la versione F9Q3d4.
- [ ] Avviare un normale 1v1 e completare almeno tre round.
- [ ] Verificare che attacchi, contrattacchi, abilità e tattiche infliggano gli stessi danni della baseline.
- [ ] Verificare che deck custom, Missione, Pivot alternativa e mappa scelti nel Setup restino corretti.
- [ ] Verificare che non compaiano errori o blocchi nella console/log diagnostico.

## 2. Kill diretta e assist su unità

Usare una partita a 3 o 4 giocatori.

- [ ] Danneggiare la stessa unità con G2 e G3.
- [ ] Distruggerla infine con G2.
- [ ] Verificare nel log/statistiche che G2 riceva la kill e G3 l’assist.
- [ ] Ripetere facendo trascorrere più di 2 round dal contributo di G3: l’assist non deve essere assegnato.
- [ ] Verificare che la vittima registri correttamente la perdita dell’unità.

## 3. Fonti persistenti, reazioni e pericoli

- [ ] Eliminare un’unità tramite Sanguinamento e verificare che la kill vada al giocatore che ha applicato lo stato.
- [ ] Eliminare un attaccante tramite Spine e verificare l’attribuzione al proprietario dell’unità con Spine.
- [ ] Eliminare un’unità con una mina piazzata da un giocatore e verificare l’attribuzione al proprietario della mina.
- [ ] Attivare un pericolo iniziale neutrale della mappa e verificare che non assegni una kill arbitraria.
- [ ] Usare un’autodistruzione o sacrificio e verificare che non produca una kill nemica.

## 4. Eliminazione di un giocatore

- [ ] Prima di conquistare un QG, far eliminare al futuro assistente almeno un’unità del difensore.
- [ ] Conquistare il QG con un altro giocatore entro 3 round.
- [ ] Verificare che il conquistatore riceva l’eliminazione giocatore e il contributore recente riceva l’assist.
- [ ] Ripetere oltre la finestra di 3 round e verificare che l’assist non venga assegnato.
- [ ] Verificare che motivo e tipo risultino `qg_capture` nella diagnostica.
- [ ] Controllare che il ciclo vita dell’eliminato riporti responsabile ed assist.

## 5. Concessione e resa tecnica

- [ ] Far concedere un giocatore in una partita FFA.
- [ ] Verificare che nessun avversario riceva l’eliminazione o l’assist.
- [ ] Verificare che il motivo sia registrato come concessione.
- [ ] Provocare una resa tecnica di un bot e verificare che non venga attribuita arbitrariamente al primo avversario.
- [ ] Verificare comunque la corretta prosecuzione dei turni e la vittoria dell’ultimo attivo.

## 6. Pressione con giocatori eliminati

- [ ] Su una mappa a 4 giocatori, eliminare G4 prima dell’inizio della Pressione.
- [ ] Portare un solo giocatore a controllare PS centrale e soglia richiesta.
- [ ] Verificare che soltanto quel giocatore ottenga +1 Pressione.
- [ ] Verificare che G4 compaia nello storico come eliminato ma non nella classifica attiva.
- [ ] Fare qualificare contemporaneamente due giocatori e verificare che nessuno avanzi.
- [ ] Verificare nelle statistiche la qualificazione e l’incremento negato da pareggio.
- [ ] Lasciare poi un unico qualificato e verificare l’attribuzione dell’incremento.

## 7. Statistiche e cronologia

- [ ] Aprire le statistiche durante la partita e controllare danni, kill e assist dei giocatori coinvolti.
- [ ] Verificare eliminazioni giocatore, assist e volte eliminate.
- [ ] Terminare la partita e controllare che il risultato riporti vincitore e tipo di vittoria corretti.
- [ ] Esportare log/statistiche e verificare la presenza delle timeline `eliminationTimeline`, `pressureTimeline` e dello snapshot `attribution`.
- [ ] Riaprire la cronologia locale e verificare che i dati siano ancora disponibili.

## 8. Regressione FFA precedente

- [ ] Verificare che i giocatori eliminati non compaiano nei selettori player-level.
- [ ] Verificare che le Missioni continuino a valutare tutti gli avversari attivi.
- [ ] Verificare che unità e strutture dell’eliminato vengano bonificate come in F9Q3d3.
- [ ] Verificare che carte rubate e unità convertite rimangano al possessore corrente.
- [ ] Verificare che il turno salti correttamente più giocatori eliminati consecutivi.

## 9. Android/APK

- [ ] Generare l’APK senza modificare il contenuto del pacchetto.
- [ ] Avviare una partita a 3 giocatori su Central hotspot.
- [ ] Produrre almeno una kill con assist e controllare log/statistiche.
- [ ] Eliminare un giocatore e lasciare proseguire i bot per almeno cinque round.
- [ ] Controllare che overlay, cronologia e pannelli statistiche non blocchino la WebView.
- [ ] Verificare che non compaiano rallentamenti anomali dovuti al registro di attribuzione.

## Criterio di validazione

La build è validabile quando kill e assist seguono sempre le fonti reali, concessioni e cause neutrali non attribuiscono meriti arbitrari, i giocatori eliminati non alterano la Pressione attiva e statistiche/export conservano dati coerenti senza regressioni nel 1v1 o nel ciclo FFA.
