# Changelog — F9T2b

## Build

- Versione: `C2-STABLE-1-F9T2b-APK-M4c`
- Baseline: `C2-STABLE-1-F9T2a-APK-M4c`
- Data: 31 luglio 2026
- Canale: `f9t2b-candidate`

## Aggiunto

- micro-piano Exordium `EXORDIUM_CLEAR_OCCUPY_FORTIFY`;
- selezione greedy di massimo tre attaccanti già in contatto;
- riserva di danno, attori, azioni ed ENE;
- conversione del PS mediante Bastione o guarnigione economica;
- filtro `RELAY_SURVIVAL_CHECK` con classi `SAFE`, `CONTESTED`, `CRITICAL`, `UNSUSTAINABLE`;
- memoria delle perdite di Bastioni limitata agli ultimi cinque round;
- eccezione controllata per centro/Pressione/finale;
- audit telemetrico della conversione territoriale;
- contatori `psCleared`, `psOccupiedAfterClear`, `psFortifiedAfterClear`, `relaySurvivalChecks`, `relayRebuildsRejected`;
- test Node e browser dedicati F9T2b.

## Modificato

- router Exordium aggiornato a `expert-exordium-f9t2b`;
- priorità Exordium: conversione territoriale prima del Relay ordinario;
- acquisti ordinari filtrati dalla riserva Expert;
- Precheck e metadata aggiornati a F9T2b;
- etichetta Setup Expert aggiornata.

## Preservato

- Bastion Relay F9T2a e sua sequenza legale;
- fallback Advanced F9T0;
- isolamento dei cinque moduli F9T1;
- quattro contratti strategici comuni;
- limiti di candidati, cache e assenza di ricorsione;
- regole, carte, statistiche, deck, mappe, Missioni e bilanciamento.

## Fuori ambito

Mech d’Assalto, Varran, scelta del percorso di vittoria, recupero materiale, colonna combinata e dottrine Expert delle altre fazioni.
