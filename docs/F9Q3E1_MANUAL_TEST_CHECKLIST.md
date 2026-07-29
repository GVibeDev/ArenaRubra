# Arena Rubra — F9Q3e1 Checklist manuale

Build candidata: `C2-STABLE-1-F9Q3e1-APK-M4c`

## A. Avvio e identità della partita

- [ ] Avvia una partita 1v1 usando due deck ufficiali riconoscibili.
- [ ] Apri Statistiche e verifica la presenza del pannello **Telemetria testing F9Q3e1**.
- [ ] Controlla che siano corretti fazione, nome del deck, Comandante, Pivot e Missione.
- [ ] Verifica che lo schema mostrato sia `F9Q3e1-1`.
- [ ] Verifica che sia mostrato un seed non vuoto.

## B. Riproducibilità

- [ ] Copia il seed dal pannello o dal JSON.
- [ ] Avvia nuovamente lo stesso Setup con lo stesso seed.
- [ ] Verifica che inizi lo stesso giocatore.
- [ ] Verifica che mano iniziale e ordine delle prime carte coincidano.
- [ ] Con un seed differente, verifica che almeno iniziativa o ordine carte possano cambiare.

## C. ENE

Durante 3–5 turni annota manualmente income, PS e spese.

- [ ] L’ENE guadagnata cresce con income e PS reali.
- [ ] Le unità e strutture aumentano le rispettive spese.
- [ ] Le tattiche aumentano la spesa tattiche.
- [ ] Le abilità a costo ENE aumentano la spesa abilità.
- [ ] Eventuali furti, perdite, blocchi o debiti sono registrati sul giocatore corretto.
- [ ] L’ENE inutilizzata a fine turno è coerente con il valore visibile.

## D. Carte e mani morte

- [ ] Pesca una carta e verifica l’incremento della pesca.
- [ ] Gioca unità e tattiche e verifica l’incremento delle carte giocate.
- [ ] Scarta, ruba o blocca una carta quando possibile e controlla l’attribuzione.
- [ ] Termina un turno senza giocare carte pur avendone una legalmente utilizzabile: deve aumentare “giocabili non usate”, non “mano morta”.
- [ ] Crea un turno senza carte legalmente giocabili: deve aumentare “mani morte”.
- [ ] Verifica che “nessuna carta giocata” resti un contatore distinto.

## E. Pivot

- [ ] Verifica il round in cui la Pivot viene pescata.
- [ ] Schiera la Pivot e verifica il round di schieramento.
- [ ] Esegui un attacco e un’abilità con la Pivot.
- [ ] Controlla danni, attacchi e abilità attribuiti alla Pivot.
- [ ] Distruggi la Pivot e verifica round e sopravvivenza.

## F. Missioni

Usa almeno un deck Missione.

- [ ] La Missione corretta è indicata nel record del deck.
- [ ] Il progresso cresce quando soddisfi una condizione.
- [ ] Prontezza, completamento e ricompensa riportano il round corretto.
- [ ] Una Missione non completata non viene indicata come completata.
- [ ] In FFA, progresso e ricompensa restano attribuiti al giocatore corretto.

## G. Combattimento, PS e Pressione

- [ ] Danni a DEF e HP sono coerenti con il log.
- [ ] Kill, assist e perdite restano coerenti con F9Q3d4.
- [ ] Conquista e perdita dei PS vengono conteggiate.
- [ ] Gli incrementi di Pressione sono attribuiti al giocatore corretto.
- [ ] I giocatori eliminati non continuano ad accumulare dati attivi impropri.

## H. Chiusura e storico

- [ ] Concludi una partita per QG, Pressione o concessione.
- [ ] Verifica vincitore, tipo di vittoria e round finale.
- [ ] Copia **Telemetria F9Q3e1** e valida che il JSON sia leggibile.
- [ ] Apri lo storico e verifica che la partita contenga `matchTelemetry` con schema `F9Q3e1-1`.
- [ ] Riavvia l’app e verifica che lo storico sia ancora disponibile.

## I. Android fisico

- [ ] Crea APK dalla candidata senza modificare il contenuto della build.
- [ ] Avvia su dispositivo reale.
- [ ] Verifica che il pannello Statistiche sia leggibile e scorra correttamente.
- [ ] Verifica che il pulsante di copia JSON funzioni o mostri un fallback utilizzabile.
- [ ] Controlla che la telemetria non produca blocchi durante turni bot o partite lunghe.
- [ ] Verifica assenza di regressioni nel Deck Builder, nelle mappe e nel tutorial.

## Criterio di validazione

La candidata è validabile quando i valori telemetrici corrispondono agli eventi osservati, la stessa partita è riproducibile tramite seed, lo storico conserva il record completo e non emergono regressioni su gameplay, Deck Builder o Android.
