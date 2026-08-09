# Changelog — F9T2c

## Build

- Versione: `C2-STABLE-1-F9T2c-APK-M4c`
- Baseline: `C2-STABLE-1-F9T2b-APK-M4c`
- Data: 1 agosto 2026
- Canale: `f9t2c-candidate`

## Aggiunto

- micro-piano Exordium `EXORDIUM_FORWARD_PIVOT_DEPLOYMENT`;
- selezione esclusiva di Pivot realmente presenti nella mano;
- esclusione della Pivot già in gioco e della cella QG propria;
- valutazione di nodi strutturali avanzati;
- requisito di supporto mobile entro raggio 2;
- controllo locale di minacce e danno plausibile;
- obiettivi PS, centro, bersaglio di alto valore e corridoio QG;
- riserva del costo effettivo della Pivot;
- verifica stretta della carta, del nodo, del supporto e della cella prima dello schieramento;
- memoria d’impatto limitata a due round;
- riconoscimento di impatto tramite attacco, abilità o acquisizione PS;
- registrazione di distruzione/scadenza prima dell’impatto;
- contatori telemetrici `forwardPivotPlans`, `forwardPivotsDeployed`, `forwardPivotImpacts`, `forwardPivotImpactMisses`;
- smoke test Node e browser dedicati F9T2c.

## Modificato

- router Exordium aggiornato a `expert-exordium-f9t2c`;
- schema dottrinale aggiornato a `F9T2c-1`;
- etichetta Expert nel Setup aggiornata;
- Precheck e metadata aggiornati;
- audit dei candidati Expert memorizzati in forma limitata per ridurre l’impatto RAM.

## Preservato

- `BASTION_RELAY` F9T2a;
- `CLEAR_OCCUPY_FORTIFY` F9T2b;
- `RELAY_SURVIVAL_CHECK` F9T2b;
- memoria delle perdite a cinque round;
- riserva ENE e fallback Advanced F9T0;
- isolamento dei moduli F9T1;
- assenza di ricorsione e budget rigidi;
- regole, carte, statistiche, deck, mappe, Missioni e bilanciamento.

## Fuori ambito

Varran, selezione della via di vittoria, recupero materiale, colonna ad armi combinate e dottrine Expert delle altre fazioni.
