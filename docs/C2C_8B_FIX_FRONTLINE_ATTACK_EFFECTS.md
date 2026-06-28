# C2c-8b-fix – Prima Linea / effetti del prossimo attacco

Hotfix mirata su C2c-8b.

## Problema
Gli attacchi di reazione C2c-8 non risolvevano l'intercettazione di Prima Linea prima degli effetti del prossimo attacco.

Caso osservato:
- una fanteria Liberti con Marchio dei Sanguis attacca/reagisce contro un bersaglio protetto da Prima Linea;
- l'intercettore subisce l'attacco, ma gli effetti post-attacco rischiano di non essere risolti sul difensore reale.

## Fix
`c2c8ReactionAttack()` ora:
1. conserva il bersaglio originario;
2. cerca un intercettore con `findFrontLineInterceptor()`;
3. se presente, sostituisce il difensore con l'intercettore;
4. calcola danno, Spine, Ordine di Varran, Marchio dei Sanguis, Diploma da Mentalista e sanguinamento Liberti sul difensore reale.

## Regola confermata
Gli effetti di attacco base o base-like si applicano all'unità che subisce davvero l'attacco dopo Prima Linea, non al bersaglio originario.

## Gameplay invariato
Nessuna nuova tattica. Nessuna modifica a deck, UI, economia, AI o cap.
