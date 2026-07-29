# F9S1b — Checklist manuale

Build attesa: `C2-STABLE-1-F9S1b-APK-M4c`

Baseline ufficiale durante il collaudo: `C2-STABLE-1-F9S1a-APK-M4c`

## 1. Avvio, catalogo e deck

- [ ] La versione F9S1b compare nel menu, HUD e log esportato.
- [ ] Il precheck termina con 0 problemi e 0 warning.
- [ ] Ogni fazione mostra 23 unità, 14 tattiche e 3 Missioni.
- [ ] Ogni fazione mostra esattamente 40 carte complessive e 2 Pivot.
- [ ] Le cinque nuove Pivot mostrano nome, costo, HP, DEF, ATT, testo e anteprima corretti.
- [ ] I deck ufficiali F9S1a sono invariati e restano validi.
- [ ] Un deck custom non può contenere più di una Pivot complessiva, anche scegliendo le due Pivot della stessa fazione.
- [ ] Un deck custom può usare ciascuna nuova Pivot in alternativa alla Pivot storica.

## 2. Nexus — UCB Unità Corazzata da Battaglia

- [ ] Costo 5 ENE; 4 HP, 6 DEF, 4 ATT; tipo Veicolo Pivot.
- [ ] Tramonto si risolve alla fine del turno del proprietario.
- [ ] Ogni nemico non-QG adiacente perde 1 DEF corrente, minimo 0.
- [ ] Tramonto colpisce nemici appartenenti a tutti i giocatori FFA attivi.
- [ ] Tramonto non riduce la DEF massima e non danneggia gli HP.
- [ ] Un nemico non adiacente non viene influenzato.
- [ ] Trappola costa 2 ENE e applica CD2.
- [ ] Trappola blocca il movimento di tutti i nemici non-QG adiacenti per il loro prossimo turno.
- [ ] Le unità bloccate possono comunque usare azioni consentite che non richiedono movimento.
- [ ] Il QG non viene bersagliato.

## 3. Exordium — Mech d’Assalto

- [ ] Costo 5 ENE; 5 HP, 4 DEF, 5 ATT; tipo Veicolo Pivot.
- [ ] Corazza Reattiva riduce di 1 il danno immediato da abilità attive nemiche.
- [ ] Corazza Reattiva riduce di 1 il danno immediato da tattiche nemiche.
- [ ] Il danno non scende sotto 0.
- [ ] Attacchi base e contrattacchi non vengono ridotti.
- [ ] Sanguinamento, Spine, mine e pericoli non vengono ridotti.
- [ ] Perdita pura di DEF e costi/autodanni non vengono ridotti.
- [ ] Soppressione costa 5 ENE e applica CD3.
- [ ] La prima selezione sceglie la cella centrale entro R2.
- [ ] La seconda selezione orienta una linea di tre celle collineari.
- [ ] Tutte e tre le celle sono distinte, esistenti e comprese entro R2.
- [ ] La linea non può comprendere la cella del Mech.
- [ ] Ogni unità sulla linea subisce 2 danni normali, alleati inclusi.
- [ ] L’interfaccia touch consente di distinguere chiaramente cella centrale e orientamento.

## 4. Liberti — Camion Corazzato

- [ ] Costo 4 ENE; 4 HP, 3 DEF, 3 ATT; tipo Veicolo Pivot.
- [ ] Ogni attacco base applica Sanguinamento 2 per due turni al bersaglio valido sopravvissuto.
- [ ] Contrattacchi e abilità non applicano Sanguinamento 2 salvo regole già esistenti.
- [ ] Schianto costa 2 ENE, usa CD3 e richiede un nemico non-QG adiacente.
- [ ] Il danno di Schianto è pari agli HP correnti del Camion al momento della risoluzione.
- [ ] Un Camion ferito produce correttamente meno danno.
- [ ] Contro una Fanteria o un Veicolo Pesante, il bersaglio perde prima 1 DEF corrente.
- [ ] La DEF non scende sotto 0.
- [ ] Il danno resta normale e segue la regola non perforante DEF/HP.

## 5. Agathoi — Giganthropos

- [ ] Costo 6 ENE; 6 HP, 5 DEF, 4 ATT; tipo Veicolo Pivot.
- [ ] Spine 2 reagisce correttamente agli attacchi base ricevuti.
- [ ] Spine non si cumula impropriamente con un’altra fonte di Spine; viene usato il valore previsto dal runtime.
- [ ] Erkos costa 3 ENE, usa CD2 e ha R1.
- [ ] Erkos infligge 2 danni normali a un nemico non-QG.
- [ ] Se il bersaglio sopravvive, riceve Inibizione Movimento per il prossimo turno.
- [ ] Un bersaglio distrutto non conserva stati residui o riferimenti invalidi.

## 6. Fabeot — La Torre dell’Architetto

- [ ] Costo 6 ENE; 6 HP, 8 DEF, 0 ATT; tipo Struttura Pivot.
- [ ] La Torre non può effettuare attacchi base.
- [ ] Un nemico non-QG adiacente subisce +1 danno da una fonte singola.
- [ ] Il bonus termina immediatamente quando il bersaglio si allontana o la Torre viene distrutta.
- [ ] Il bonus si applica separatamente a ciascun colpo di Doppio Colpo e Doppio Colpo Pesante.
- [ ] Il bonus si applica a Sanguinamento, mine e altre fonti di danno compatibili.
- [ ] Il bonus non si applica a unità alleate o al QG.
- [ ] Bonifica costa 5 ENE e usa CD3.
- [ ] Bonifica richiede due celle distinte e adiacenti, entrambe entro R2.
- [ ] Ogni unità presente sulle due celle subisce 2 danni normali, alleati inclusi.
- [ ] Celle non adiacenti, duplicate o fuori gittata vengono rifiutate.

## 7. Interazioni critiche

- [ ] Un Mech d’Assalto adiacente a una Torre nemica riceve prima il +1 della Torre e poi la riduzione -1 per abilità/tattiche.
- [ ] Doppio Colpo contro un bersaglio adiacente alla Torre applica il bonus a entrambi gli eventi separati.
- [ ] Tramonto non attiva Corazza Reattiva perché è perdita di DEF, non danno.
- [ ] Schianto usa gli HP correnti anche dopo cure o danni subiti nello stesso round.
- [ ] Erkos e Trappola non producono blocchi permanenti dopo la durata prevista.
- [ ] Eliminare il proprietario di un’aura o di uno stato non lascia effetti orfani.

## 8. IA e partite

- [ ] Preparare almeno un deck custom per fazione con la nuova Pivot.
- [ ] I bot acquistano le nuove Pivot senza freeze o loop.
- [ ] Il bot usa Trappola quando ci sono bersagli adiacenti utili.
- [ ] Il bot sceglie per Soppressione una linea valida e non comprendente il Mech.
- [ ] Il bot usa Schianto tenendo conto degli HP correnti e dei bersagli Pesanti.
- [ ] Il bot usa Erkos su bersagli validi a R1.
- [ ] Il bot usa Bonifica con due celle valide e gestisce il rischio di fuoco amico.
- [ ] Nessun rallentamento anomalo appare su mappe grandi con le nuove auree/passive.

## 9. Regressione F9S1a/F9R3

- [ ] Le 14 unità e 11 tattiche F9S1a restano presenti e funzionanti.
- [ ] Gli asset già integrati in F9S1a restano visibili.
- [ ] Le sei mappe ufficiali e i PS centrali restano validi.
- [ ] Pressione Rapida e Standard funzionano come in F9R3.
- [ ] Targeting FFA continua a includere tutti gli avversari attivi.
- [ ] Tutorial, anteprime carta e ripresa della lezione funzionano.
- [ ] Salvataggio, ripresa ed export del log funzionano.

## 10. Android reale

- [ ] Avvio APK e navigazione menu senza errori.
- [ ] Pool carte e Deck Builder mostrano 40 carte per fazione senza problemi di layout.
- [ ] Selezione della linea di Soppressione comoda e leggibile tramite touch.
- [ ] Selezione doppia di Bonifica comoda e leggibile tramite touch.
- [ ] Anteprime e pannelli non coprono le celle bersaglio.
- [ ] Nessun freeze durante turni bot con le nuove Pivot.
- [ ] Esportazione del log riuscita.
