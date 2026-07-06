# F9K1 – Card Editor Data-only Foundation

Base: `C2-STABLE-1-F9J2a-APK-M4c`

## Obiettivo
Aggiungere un Card Editor sicuro per creare carte custom separate dal catalogo ufficiale.

## Regola fondamentale
Le carte ufficiali sono read-only. L'editor non modifica unità o tattiche base: crea solo carte custom con ID `CUSTOM:*` e source ID `CUS_*`.

## Capacità F9K1
- Creazione di unità custom data-only.
- Creazione di tattiche custom data-only.
- Validazione budget ENE/stat per unità custom.
- Effetti attivi/passivi data-only tramite menu guidato.
- Preview renderer live.
- Salvataggio custom in localStorage.
- Export JSON della carta corrente.
- Custom visibili nel Pool carte.
- Manifest asset capace di includere custom quando la funzione custom è disponibile.

## Budget unità custom
- 1 ENE: max 4 HP+DEF+ATT + passiva.
- 2 ENE: max 7 HP+DEF+ATT + passiva o attiva.
- 3 ENE: max 10 HP+DEF+ATT + passiva o attiva.
- 4 ENE: max 14 HP+DEF+ATT + passiva e/o attiva.
- 5 ENE: max 18 HP+DEF+ATT + passiva e/o attiva.
- 6 ENE: max 22 HP+DEF+ATT + passiva e/o attiva.
- 7 ENE: max 27 HP+DEF+ATT + passiva e/o attiva.

## Non modificato
Gameplay, AI, deck rules, bilanciamento, setup partita, runtime standard e integrazione automatica nel Deck Builder.
