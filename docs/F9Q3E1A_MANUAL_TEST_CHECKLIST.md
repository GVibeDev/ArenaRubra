# Arena Rubra — F9Q3e1a Checklist manuale

Build candidata: `C2-STABLE-1-F9Q3e1a-APK-M4c`
Schema: `F9Q3e1-2`

## Avvio

- [ ] Avvia una nuova partita e verifica la versione F9Q3e1a.
- [ ] Apri Statistiche e verifica lo schema `F9Q3e1-2`.
- [ ] Verifica che `metricAuthority` sia presente nel JSON copiato.
- [ ] Verifica che il roster mostri ancora 50 deck ufficiali.

## Attribuzione PS

- [ ] Conquista un PS neutrale con G1.
- [ ] Conquista un altro PS con G2.
- [ ] Abbandona un PS o trasferiscilo fra i due giocatori.
- [ ] Copia la telemetria e verifica che non esista `players[0]`.
- [ ] Verifica `psGained` per chi conquista.
- [ ] Verifica `psLost` per chi perde.
- [ ] Verifica `psControlChanges` per entrambi i lati coinvolti.
- [ ] Verifica `timelines.psControl` contro il log testuale.

## Pivot multi-istanza

- [ ] Schiera la Pivot e annota UID/numero istanza nel log.
- [ ] Esegui almeno un attacco e una abilità con la Pivot.
- [ ] Distruggi la Pivot.
- [ ] Recupera, rigenera o schiera una seconda copia della stessa Pivot durante la stessa partita.
- [ ] Esegui danni con la seconda istanza.
- [ ] Verifica `pivotInstanceCount: 2`.
- [ ] Verifica che la prima istanza abbia `destroyedRound` e `survivalRounds`.
- [ ] Verifica che la seconda istanza sia `active` oppure abbia una propria distruzione separata.
- [ ] Verifica che `pivotAttacks`, `pivotAbilitiesUsed` e `pivotDamageDealt` siano la somma delle istanze.
- [ ] Verifica che `timelines.pivots` contenga due deploy e tutte le distruzioni effettive.
- [ ] Verifica `pivotDestroyedRound` come ultima distruzione, non come stato dell'unica Pivot.

## Sovrapesca

- [ ] Porta la mano al limite.
- [ ] Pesca una carta che viene mandata direttamente negli scarti.
- [ ] Conta gli eventi espliciti nel log.
- [ ] Verifica che `cards.overdrawn` aumenti di 1.
- [ ] Verifica che `cards.byCard[ID].overdrawn` aumenti di 1.
- [ ] Ripeti con un furto di carta verso una mano piena, quando possibile.

## Confronto fonti

- [ ] Per PS, confronta telemetria principale e timeline F9F: devono coincidere.
- [ ] Per carte pescate/giocate, usa `players[*].cards` della telemetria principale.
- [ ] Verifica che il JSON F9F venga trattato come riepilogo ausiliario, non come fonte carta autorevole.

## Chiusura partita

- [ ] Termina la partita normalmente.
- [ ] Verifica che lo storico salvi lo schema F9Q3e1-2.
- [ ] Verifica la sopravvivenza cumulativa delle Pivot al round finale.
- [ ] Verifica che non compaiano errori console o blocchi UI.

## Android fisico

- [ ] Genera l'APK dalla candidata.
- [ ] Avvia una partita bot-vs-bot.
- [ ] Esegui almeno un cambio PS.
- [ ] Esegui una distruzione e rigenerazione Pivot.
- [ ] Copia/esporta la telemetria.
- [ ] Verifica side, istanze Pivot e overdraw nel JSON.
- [ ] Verifica assenza di regressioni nel pannello Statistiche.
