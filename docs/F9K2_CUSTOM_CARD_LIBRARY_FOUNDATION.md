# F9K2 – Custom Card Library Foundation

Base: `C2-STABLE-1-F9K1b-APK-M4c`

## Obiettivo
Rendere il Card Editor una piccola libreria custom sicura, mantenendo le carte ufficiali read-only.

## Funzioni
- Libreria custom filtrabile per testo, tipo e fazione.
- Duplicazione di una custom selezionata.
- Export JSON della carta corrente.
- Export JSON dell'intera libreria custom.
- Area import JSON per singola custom, array di custom o payload libreria F9K2.
- Reset delle sole custom salvate.
- Duplicazione sicura dal Pool: una carta ufficiale viene copiata come nuova custom, mai modificata in origine.
- Filtro origine nel Pool carte: tutte / ufficiali / custom.
- Badge `CUSTOM` in tabella e galleria Pool.

## Non modificato
Gameplay, AI, deck rules, bilanciamento, setup partita, runtime standard e integrazione automatica nel Deck Builder.
