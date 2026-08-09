# F9T2d3 — Checklist manuale

## Metadati

- [ ] La build mostrata è `C2-STABLE-1-F9T2d3-APK-M4c`.
- [ ] La baseline logica mostrata è `C2-STABLE-1-F9T2c4-APK-M4c`.
- [ ] Il modulo Exordium è `expert-exordium-f9t2d3`.
- [ ] Lo schema dottrina è `F9T2d3-1`.

## Test principale anti-starvation

Configurazione consigliata: Exordium Expert con Varran disponibile presto.

- [ ] Da R4, se Varran è in mano e non in campo, compare un Commander Deployment Commitment.
- [ ] `reservedEnergy` corrisponde al costo reale minimo di schieramento.
- [ ] Tattiche/acquisti marginali non consumano l'ENE sotto la riserva.
- [ ] Se a R4 l'ENE è insufficiente, l'IA la conserva e Varran diventa la scelta roster non appena il costo è raggiunto.
- [ ] Con condizioni normali Varran viene schierato entro la deadline base R6.
- [ ] Dopo lo schieramento la riserva torna a zero.

## Differimenti

- [ ] Con rischio QG `direct`, il deployment viene differito.
- [ ] Durante l'emergenza la riserva comandante viene sospesa.
- [ ] Quando il rischio rientra, lo stesso commitment riprende senza essere ricreato.
- [ ] Un micro-piano Expert attivo può differire il comandante con causa esplicita.
- [ ] Nessuna cella legale produce `no_legal_deployment_cell`, senza perdere il commitment.
- [ ] Una deadline mancata produce telemetria e non cancella il commitment.

## Telemetria

- [ ] `commanderDeploymentCommitments` aumenta alla creazione.
- [ ] `commanderDeploymentAttempts` aumenta al tentativo reale.
- [ ] `commanderDeploymentCommitmentsExecuted` aumenta allo schieramento.
- [ ] `commanderActualDeploymentRound` coincide col round reale.
- [ ] `commanderPlayableRoundsBeforeDeployment` è coerente col log.
- [ ] Le ragioni di differimento sono presenti in `commanderDeploymentDeferredReasons`.

## Regressioni

- [ ] Varran stationary attack resta eseguibile.
- [ ] Clear Effective Damage Preview resta corretto.
- [ ] Clear Occupation Commitment resta corretto.
- [ ] Bastion Relay e Survival Check restano corretti.
- [ ] Forward Pivot resta selezionabile/deployabile.
- [ ] Nessun budget exhaustion Expert.
- [ ] Nessun errore pagina/console.
