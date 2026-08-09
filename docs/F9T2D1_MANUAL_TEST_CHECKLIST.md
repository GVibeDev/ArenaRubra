# Arena Rubra — Checklist manuale F9T2d1

## Identità

- [ ] La build visibile è `C2-STABLE-1-F9T2d1-APK-M4c`.
- [ ] La baseline logica è `C2-STABLE-1-F9T2c4-APK-M4c`.
- [ ] Lo schema Expert è `F9T2d1-1`.
- [ ] Il modulo Exordium è `expert-exordium-f9t2d1`.

## Replay principale

- [ ] Ripetere il seed `AR-msav9j6q-mfkmt6` con la stessa mappa, deck e iniziativa del rapporto F9T2d.
- [ ] Verificare che i cinque vecchi bersagli a danno marginale nullo vengano respinti.
- [ ] Verificare che `killEnabled` non venga usato come dato autorevole.
- [ ] Verificare `budgetExhaustions = 0`.

## Catene selezionate

Per ogni piano `EXORDIUM_VARRAN_ASSAULT_CHAIN`:

- [ ] l’ENE viene riservata e spesa una sola volta;
- [ ] l’attore potenziato è lo stesso che attacca;
- [ ] viene eseguito al massimo un movimento;
- [ ] il bersaglio reale dopo intercettazione è registrato;
- [ ] `predictedBonusEffectiveDamage > 0`;
- [ ] `actualBonusEffectiveDamage > 0`, oppure `bonusEnabledKill` e `immediateKillAchieved` sono entrambi veri;
- [ ] `predictionMatched` è coerente con lo stato autorevole;
- [ ] il piano completa senza consumare attori prenotati altrove.

## Casi di esclusione

- [ ] Attacco base già letale → `base_attack_already_kills`.
- [ ] Bonus assorbito da eccesso contro DEF → `no_marginal_bonus_value`.
- [ ] Varran assente → `varran_not_in_play`.
- [ ] Abilità non utilizzabile → `ability_not_usable`.
- [ ] Nessun attacco realizzabile → `no_realizable_attack_for_actor`.

## Audit

- [ ] `candidateAuditCountByScanner.varranAssault` è presente.
- [ ] `varranCandidateRejectionCounts` riconcilia tutti gli audit Varran.
- [ ] La somma Relay + Clear + Forward Pivot + Varran coincide con `candidateAuditsTotal`.
- [ ] `candidateAuditsTotal = stored + dropped`.
- [ ] `auditItemsTotal` include gli audit Varran.
- [ ] Ogni turno mantiene la riconciliazione decisionale F9T2c3a.

## Regressioni

- [ ] Bastion Relay completa una sequenza legale.
- [ ] `CLEAR_OCCUPY_FORTIFY` mantiene il commitment F9T2c4.
- [ ] Forward Pivot conserva deployment e impatto.
- [ ] Il primo turno funziona con iniziativa G1 e G2.
- [ ] Nessuna mutazione retroattiva dei turni finalizzati.
- [ ] Nessun errore pagina o console.
- [ ] Nessun cambiamento a carte, costi, statistiche, deck e mappe.
