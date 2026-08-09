# F9T2a — Checklist manuale

## Retest prioritario

- Seed: `AR-ms73t56g-yyyzl3`
- Mappa: `Plains 2G large`, rev. 169, movimento ×2
- Exordium: Breccia Cremisi / Varran
- Nexus: Bastione Mobile / Avatex
- Iniziativa: Exordium

Entro il round 5 verificare sul PS `[-6,11,-5]` quando la configurazione coincide:

- audit del PS presente;
- `mobileGuardEligible = true`;
- almeno un builder eleggibile;
- almeno una destinazione di rilascio;
- candidato selezionato;
- 2 ENE riservate;
- guarnigione spostata prima degli acquisti;
- cella PS libera dopo il movimento;
- Bastione costruito sul PS;
- micro-piano completato;
- nessun softlock o doppio movimento.

## Regressioni

- Le quattro fazioni non Exordium usano il fallback Advanced.
- Nessun Bastione costruito su cella occupata.
- Nessuna tattica consuma l’ENE riservata.
- Un abort rilascia la riserva e prosegue col fallback.
- Cache/sessione Expert eliminate a fine turno.
