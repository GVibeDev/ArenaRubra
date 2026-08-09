# Arena Rubra — Checklist manuale F9T2c2

Build: `C2-STABLE-1-F9T2c2-APK-M4c`

## A. Bootstrap primo turno

- [ ] Avvia Expert con iniziativa Giocatore 1.
- [ ] Verifica `STARTED = CONTEXT = ROUTED = COMPLETED`.
- [ ] Avvia Expert con iniziativa Giocatore 2.
- [ ] Verifica gli stessi quattro conteggi.
- [ ] Controlla che nessun turno completato abbia `moduleId: null`.
- [ ] Controlla che nessun turno completato abbia `context: null`.
- [ ] Avvia una nuova partita mentre il bot della precedente è ancora in attesa/animazione.
- [ ] Verifica che il vecchio turno non cambi il giocatore corrente del nuovo match.
- [ ] Verifica `activeSessions = 0` al termine di ciascun turno.
- [ ] Verifica assenza di decisioni fantasma.

## B. Forward Pivot

- [ ] Usa Exordium `Breccia Cremisi` con Mech d’Assalto in mano.
- [ ] Crea almeno un Bastione avanzato con supporto.
- [ ] Verifica che il candidato registri costo 5 e sorgente reale.
- [ ] Verifica `projectedEndCellNextTurn`.
- [ ] Verifica che un QG a distanza elevata non produca `HQ_CORRIDOR`.
- [ ] Verifica che un PS/centro raggiungibile prevalga sul QG lontano.
- [ ] Dopo lo schieramento, verifica che il Mech raggiunga la cella preferita.
- [ ] Nel turno seguente, verifica attacco, abilità o acquisizione PS coerente.
- [ ] Verifica impatto entro due round oppure `impactWindowMiss`.
- [ ] Se l’impatto arriva tardi, verifica `firstActualImpactRound` e ritardo.

## C. Telemetria

- [ ] `expertForwardPivotsDeployed` conta soltanto il piano Expert.
- [ ] `allExordiumPivotsTracked` conta anche Pivot da fallback/mercato.
- [ ] I denominatori non producono più due miss su un solo deployment Expert.
- [ ] Le ragioni di esclusione di Relay, Clear e Forward sono riconciliate.
- [ ] Massimo 24 decisioni conservate per turno.
- [ ] Audit eccedenti dichiarati, non nascosti.
- [ ] Nessun budget exhaustion del modulo.

## D. Regressioni Exordium

- [ ] Bastion Relay esegue `move_guard → verify_ps_free → build_bastion`.
- [ ] Clear–Occupy–Fortify completa sullo stato autorevole.
- [ ] Survival Check attraversa ogni Bastione costruito su PS.
- [ ] Il PS centrale è riconosciuto dalla definizione mappa.
- [ ] Le riserve ENE vengono liberate a completamento/abort.

## E. Regressioni applicazione

- [ ] Control Center mostra build, baseline e schema corretti.
- [ ] Pool carte si apre senza errori.
- [ ] Card Editor e Map Editor si aprono e conservano i layout.
- [ ] Nessun errore pagina o console.
- [ ] Test APK reale: touch, Back, sospensione/ripresa.
- [ ] Partita lunga: nessuna crescita persistente di sessioni/cache.
