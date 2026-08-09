# Checklist manuale — F9T2c4

## Preparazione

- [ ] Verificare build `C2-STABLE-1-F9T2c4-APK-M4c`.
- [ ] Modalità bot–bot Expert.
- [ ] Exordium con deck `Breccia Cremisi`.
- [ ] Attivare telemetria e log completi.
- [ ] Annotare seed, mappa, iniziativa e match ID.

## Caso principale: riassegnazione dell'occupante

- [ ] `CLEAR_OCCUPY_FORTIFY` viene selezionato su un PS nemico.
- [ ] Il presidio viene eliminato durante il turno.
- [ ] L'occupante originariamente prenotato non è più disponibile o ha già agito.
- [ ] Il PS è ancora libero.
- [ ] Compare `clear_conversion_actor_reassigned`.
- [ ] `conversionActorCurrentId` indica il sostituto.
- [ ] La riserva `garrison:` è aggiornata al sostituto.
- [ ] Il sostituto agisce prima delle azioni generiche del fallback.
- [ ] Il PS passa a Exordium nello stesso turno.
- [ ] Compare `clear_conversion_commitment_executed`.
- [ ] Il micro-piano termina `completed`.

## Caso senza riassegnazione

- [ ] L'occupante originario resta vivo, non ha agito e può raggiungere il PS.
- [ ] Non viene generata una riassegnazione superflua.
- [ ] L'occupante originario converte il PS.
- [ ] Il piano termina `completed`.

## Priorità QG

- [ ] Con rischio QG `direct` o `occupied`, la conversione viene differita.
- [ ] Compare `clear_conversion_commitment_deferred_hq_risk`.
- [ ] L'occupante non viene consumato dalla conversione durante l'emergenza.
- [ ] Il piano resta attivo oppure viene rivalutato in modo esplicito.

## Casi di arresto corretti

- [ ] Se il PS viene rioccupato dal nemico, il piano abortisce con `target_ps_reoccupied`.
- [ ] Se non esiste alcun occupante legale, il piano abortisce con `conversion_actor_unavailable_after_clear`.
- [ ] Dopo due riassegnazioni fallite, compare `conversion_actor_reassignment_exhausted`.

## Regressioni

- [ ] Bastion Relay continua a completare la sequenza legale.
- [ ] Survival Check continua a valutare ogni Bastione su PS.
- [ ] Forward Pivot conserva candidato, deployment e memoria d'impatto.
- [ ] Primo turno integro con iniziativa G1.
- [ ] Primo turno integro con iniziativa G2.
- [ ] Ogni turno rispetta `stored = len(decisions)`.
- [ ] Audit items e containers restano riconciliati.
- [ ] Control Center mostra build e baseline corrette.
- [ ] Pool carte, Card Editor e Map Editor restano operativi.

## Prestazioni e integrità

- [ ] Nessun errore pagina o console.
- [ ] Nessun budget exhaustion Expert.
- [ ] Nessun blocco del turno bot.
- [ ] Nessun aumento anomalo della durata del modulo Exordium.
- [ ] ENE, pezzi, PS e carte si riconciliano a fine partita.
