# F9O5b — HQ Empty Objective Visual Hotfix

## Correzione
La pseudo-unità QG resta nello stato di gioco, ma viene esclusa dalla mappa di occupazione usata dal renderer dei token. La cella QG continua a essere resa come obiettivo tramite `hqSideAt()`.

## Invarianti
- nessun token o stats HP/DEF/ATT sulla casella QG libera;
- costruzione diretta sul proprio QG invariata;
- occupazione da parte di unità reali invariata;
- vittoria PS + QG invariata;
- camera, FX/SFX e hit detection invariati.
