# Checklist manuale — F9T2d Varran Assault Chain

## Preparazione

- [ ] Verificare build `C2-STABLE-1-F9T2d-APK-M4c`.
- [ ] Verificare baseline logica `C2-STABLE-1-F9T2c4-APK-M4c`.
- [ ] Modalità bot–bot Expert.
- [ ] Exordium con Varran e deck `Breccia Cremisi` o altro deck legale di Varran.
- [ ] Attivare log e telemetria completi.
- [ ] Annotare seed, mappa, iniziativa e match ID.

## Caso positivo immediato

- [ ] Varran è in campo, pronto e con abilità disponibile.
- [ ] Exordium possiede almeno 1 ENE.
- [ ] Un alleato Exordium entro R1 può attaccare nello stesso turno.
- [ ] Il bonus produce almeno 1 danno effettivo aggiuntivo.
- [ ] Viene selezionato `EXORDIUM_VARRAN_ASSAULT_CHAIN`.
- [ ] Il primo passo è `use_varran_order`.
- [ ] Compare `varran_assault_order_committed`.
- [ ] L'ENE viene spesa una sola volta.
- [ ] L'attore prenotato riceve priorità.
- [ ] L'attore attacca il bersaglio previsto.
- [ ] Compare `varran_assault_executed`.
- [ ] Il piano termina `completed`.

## Caso con movimento

- [ ] L'attore non è inizialmente adiacente al bersaglio.
- [ ] Il piano registra una sola `moveCell`.
- [ ] L'attore può agire dopo il movimento.
- [ ] L'attore raggiunge la cella prevista.
- [ ] L'attacco viene eseguito nello stesso turno.
- [ ] Non vengono effettuati movimenti aggiuntivi o ricerche ricorsive.

## Retarget

- [ ] Il bersaglio originario scompare dopo l'uso dell'abilità.
- [ ] Compare `varran_assault_target_reassigned`.
- [ ] Il retarget avviene una sola volta.
- [ ] Il nuovo calcolo usa l'ATT realmente buffato, senza un secondo `+1` virtuale.
- [ ] Il nuovo bersaglio viene attaccato oppure il piano abortisce esplicitamente.

## Casi di rifiuto

- [ ] Nessun piano se Varran non è in campo.
- [ ] Nessun piano se l'abilità è in cooldown o già usata.
- [ ] Nessun piano con ENE insufficiente.
- [ ] Nessun piano se non esiste un attacco realizzabile.
- [ ] Nessun uso dell'abilità quando l'attacco base elimina già il bersaglio.
- [ ] Nessun piano con rischio QG `direct` o `occupied`.

## Telemetria

- [ ] `source = expert_exordium_f9t2d`.
- [ ] `featureOrigin = varran_assault_chain`.
- [ ] `featureRevision = F9T2d`.
- [ ] `varranAssaultPlans` coincide con i piani selezionati.
- [ ] `varranAssaultOrdersCommitted` coincide con le abilità realmente applicate.
- [ ] `varranAssaultTargetsReassigned` coincide con i retarget.
- [ ] `varranAssaultsExecuted` coincide con gli attacchi concatenati.
- [ ] Decisioni `total = stored + dropped`.
- [ ] Ogni turno finalizzato rispetta `stored = len(decisions)`.

## Regressioni Exordium

- [ ] Bastion Relay continua a funzionare.
- [ ] Clear–Occupy–Fortify continua a convertire il PS.
- [ ] Clear Occupation Commitment mantiene o riassegna l'occupante.
- [ ] Survival Check continua a filtrare i Bastioni.
- [ ] Forward Pivot mantiene deployment e memoria d'impatto.
- [ ] Il primo turno resta integro con iniziativa G1 e G2.

## UI e integrità

- [ ] Control Center mostra candidata e baseline corrette.
- [ ] Pool carte, Card Editor e Map Editor restano operativi.
- [ ] Nessun errore pagina o console.
- [ ] Nessun budget exhaustion Expert.
- [ ] ENE, danni, pezzi, PS e carte si riconciliano a fine partita.

## Prestazioni

- [ ] `moduleDurationMs` Exordium resta sotto 8 ms nei turni con scansione Varran.
- [ ] Nessun aumento anomalo del tempo completo del turno rispetto a match comparabili.
- [ ] Nessuna crescita non limitata dei record telemetrici.
