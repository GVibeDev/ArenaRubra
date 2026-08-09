# Changelog — F9T2c1

## Build

- Versione: `C2-STABLE-1-F9T2c1-APK-M4c`
- Baseline ufficiale: `C2-STABLE-1-F9T2b-APK-M4c`
- Sostituisce come candidata: `C2-STABLE-1-F9T2c-APK-M4c`
- Data: 1 agosto 2026
- Canale: `f9t2c1-candidate`

## Corretto

- candidato `FORWARD_PIVOT_DEPLOYMENT` valutato dopo una sola proiezione legale del movimento del turno successivo;
- `pivotCost`, ENE residua, struttura sorgente, cella proiettata e obiettivo sempre esposti negli audit validi;
- riconciliazione autorevole di `CLEAR_OCCUPY_FORTIFY` dopo le azioni del fallback e a fine turno;
- eliminato il falso aborto quando il PS è stato realmente occupato o fortificato;
- `RELAY_SURVIVAL_CHECK` applicato a ogni costruzione di Bastione su PS, incluse quelle del fallback;
- riconoscimento del PS centrale tramite dato autorevole della mappa;
- limite reale di 24 record decisionali per turno;
- record decisionali separati dagli audit;
- scansioni territoriali interrotte dopo un candidato P0 ad alto valore;
- eliminata la valutazione Survival completa sui PS senza presidio nemico;
- fonti di schieramento rese precise;
- telemetria di tutte le Pivot, comprese quelle schierate dal fallback.

## Aggiunto

- `expertExordiumCanBuildBastionOnPsF9T2c1` come gate comune;
- `expertExordiumCentralCoordF9T2c1` e `expertExordiumIsCenterF9T2c1`;
- monitor d'impatto globale delle Pivot Exordium;
- `expertExordiumReconcileActivePlanF9T2c1`;
- contatori `decisionRecordsDropped`, `auditRecordsDropped`, `candidateScanStoppedEarly`;
- contatori distinti Expert/fallback/totali per Bastioni e conversioni;
- elenchi Pivot per origine;
- smoke test `f9t2c1_execution_integrity_smoke.js`.

## Preservato

- Bastion Relay F9T2a;
- Territorial Conversion e Relay Survival F9T2b;
- riserva operativa dell'ENE;
- router a un solo modulo di fazione;
- fallback Advanced F9T0;
- budget F9T1;
- assenza di ricorsione;
- regole, carte, deck, mappe, Missioni e bilanciamento.

## Fuori ambito

Mine Nexus, budget strutture Nexus, congestione generale, legalità delle Pivot fuori deck, Varran, spareggio, valutazione generale delle tattiche, cap di campo e colonna ad armi combinate.
