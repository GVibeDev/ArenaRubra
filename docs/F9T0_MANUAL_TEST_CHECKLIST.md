# F9T0 — Checklist manuale di validazione

Build: `C2-STABLE-1-F9T0-APK-M4c`  
Baseline logica: `C2-STABLE-1-F9U3-APK-M4c`

## A. Avvio e regressioni essenziali

- [ ] Avvio browser desktop senza errori diagnostici.
- [ ] Avvio APK Android senza crash.
- [ ] Centro di controllo F9U3 integro.
- [ ] Nuova partita, Tutorial e Riprendi funzionanti.
- [ ] Deck, mappe e Missioni invariati.
- [ ] Turno bot completato senza softlock.
- [ ] Fine turno, sbarco, attacco, abilità e tattiche funzionanti.

## B. Nexus — finalizzazione della rete

Usare almeno una mappa grande con 7 o più PS.

- [ ] Nexus costruisce e presidia la rete iniziale.
- [ ] Una volta stabilizzata la rete, non continua ad accumulare indefinitamente tutte le unità sugli stessi PS.
- [ ] I PS minacciati restano protetti.
- [ ] Almeno una parte della massa mobile viene liberata dai PS sicuri.
- [ ] Nexus conquista nuovi PS oppure prepara una sequenza credibile verso il QG.
- [ ] Non alterna ripetutamente le stesse due celle senza progresso.
- [ ] In vantaggio, passa da presidio a proiezione offensiva.
- [ ] In svantaggio reale, continua a difendere senza suicidarsi.

## C. Agathoi — avanzata della linea verde

- [ ] Agathoi costruisce una linea coerente attorno a strutture e PS.
- [ ] Quando la linea è stabile, smette di comportarsi come se fosse sempre in emergenza.
- [ ] Le unità mobili avanzano oltre il primo anello difensivo.
- [ ] Cerca PS non controllati e terreno utile.
- [ ] Non duplica il richiamo verso il PS domestico.
- [ ] Non ammassa tutte le unità sul medesimo PS sicuro.
- [ ] In vantaggio numerico/economico accetta un’esposizione ragionevole per conquistare terreno.
- [ ] Le strutture continuano a sostenere la fazione senza trasformarsi in un vincolo assoluto.

## D. Pressione sulle mappe grandi

Eseguire partite bot-vs-bot su mappe da 7 e 9 PS, con matchup invertiti.

- [ ] Due PS su sette non attivano una falsa modalità di chiusura.
- [ ] Quattro PS su sette, incluso il centrale, vengono riconosciuti come qualificazione reale.
- [ ] Il bot reagisce prima che l’avversario completi una lunga sequenza di Pressione.
- [ ] La fazione in vantaggio continua a espandersi se non possiede ancora la soglia reale.
- [ ] I round finali non sono l’unico momento in cui l’IA tenta di chiudere.
- [ ] Frequenza degli spareggi inferiore rispetto alla baseline F9U3, a parità di mappe e matchup.

## E. Guarnigioni dinamiche

- [ ] Un solo PS posseduto resta normalmente presidiato.
- [ ] Il PS centrale resta prioritario nella finestra di Pressione.
- [ ] Un PS sotto minaccia R2 non viene abbandonato senza motivo.
- [ ] Con tre o più PS sicuri, non tutte le unità restano bloccate come guarnigione.
- [ ] In close-pressure lock, il bot conserva i PS necessari alla vittoria.
- [ ] Durante `tutto_per_tutto`, le guarnigioni non impediscono una risposta urgente.

## F. Stabilità CPU/RAM

Confrontare F9T0 e F9U3 sullo stesso dispositivo, mappa e matchup.

- [ ] Nessun aumento evidente del tempo medio del turno bot.
- [ ] Nessun blocco crescente dopo molti round.
- [ ] Nessuna crescita anomala della RAM osservabile durante partite lunghe.
- [ ] Nessun picco ripetuto causato da oscillazioni o rescoring multipli.
- [ ] Android resta reattivo durante bot-vs-bot e mappe grandi.
- [ ] La partita può essere chiusa e riavviata senza residui o crash.

## G. Log attesi

Durante i casi appropriati possono comparire:

- `rete Nexus matura: proiezione offensiva`;
- `linea verde matura: avanzata`;
- `stallo operativo N round`;
- modalità `sblocco_stallo`;
- modalità proporzionali `vittoria_pressione`, `rompi_controllo_ps`, `difesa_pressione`.

La loro assenza non è automaticamente un errore: dipende dallo stato effettivo della partita.

## Criterio di validazione

F9T0 è validabile soltanto se:

1. non introduce regressioni funzionali;
2. Nexus e Agathoi mostrano un miglioramento osservabile nella conquista/finalizzazione;
3. le mappe da 7+ PS non vengono interpretate con soglie da MAP1;
4. CPU e RAM non peggiorano in modo rilevante;
5. non emergono nuovi softlock o loop decisionali.
