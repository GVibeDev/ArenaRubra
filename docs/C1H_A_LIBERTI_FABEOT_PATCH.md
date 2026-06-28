# C1h-a – Liberti/Fabeot Deck Legality Patch

## Obiettivo

Rendere il deck Liberti legalmente componibile a 30 carte senza overflow debug e aggiungere due veicoli Fabeot semplici.

## Regola deck

- Deck target: 30 carte.
- Max 2 copie per carta normale.
- Max 1 copia per comandanti e pivot.

## Unità aggiunte

### Liberti

1. Predone cacciacarri
2. Predone corazzato
3. Buggy da Sbarco
4. Ariete Liberto
5. Forte di Rottami

### Fabeot

1. Lancia Fabeot
2. Prima Linea Fabeot

## Note

`Prima Linea Fabeot` non usa la keyword tecnica Prima Linea/intercettazione. Mantiene il nome, ma l'effetto è `+1 DEF se adiacente ad almeno una unità alleata`.

## Controlli

- JS check: OK
- duplicate function definitions: none
- duplicate blueprint IDs: none
- C1h-a version: True
- C1h-a mode: True
- game label C1h-a: True
- new units present: True
- ability vehicleValue supported: True
- adjacentAllyDef supported: True
- faction counts: Nexus 18, Exordium 18, Liberti 16, Agathoi 21, Fabeot 18
- type counts: Fanteria 31, Veicolo 30, Struttura 25, Comandante 5, QG 0
- Nexus: pool 0, legal capacity 0, overflow needed 30
- Exordium: pool 0, legal capacity 0, overflow needed 30
- Liberti: pool 0, legal capacity 0, overflow needed 30
- Agathoi: pool 0, legal capacity 0, overflow needed 30
- Fabeot: pool 0, legal capacity 0, overflow needed 30
