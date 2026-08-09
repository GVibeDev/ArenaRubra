# Changelog — F9T2d

## Build

`C2-STABLE-1-F9T2d-APK-M4c`

Baseline: `C2-STABLE-1-F9T2c4-APK-M4c`.

## Aggiunto

- micro-piano `EXORDIUM_VARRAN_ASSAULT_CHAIN`;
- selezione bounded di attore e bersaglio;
- riserva ENE dell'abilità di Varran;
- sequenza piatta `use_varran_order → execute_varran_assault`;
- supporto a un singolo movimento prima dell'attacco;
- un retarget massimo se il bersaglio originario scompare;
- filtro contro l'uso dell'abilità quando l'attacco base elimina già il bersaglio;
- priorità dedicate a Varran e all'attore prenotato;
- blocco della catena in presenza di rischio QG `direct` o `occupied`;
- decisioni e aggregati telemetrici dedicati F9T2d;
- smoke Node e browser specifici.

## Corretto durante il collaudo

- il retarget ora valuta il buff già applicato e non simula un secondo incremento ATT inesistente;
- test storici aggiornati alla baseline ufficiale F9T2c4;
- Control Center aggiornato alla nuova candidata e alla baseline corretta.

## Preservato

- Clear Occupation Commitment F9T2c4;
- proprietà temporale e audit F9T2c3a;
- Bastion Relay;
- Territorial Conversion;
- Survival Check;
- Forward Pivot;
- bootstrap Expert simmetrico;
- fallback Advanced F9T0;
- carte, deck, mappe e bilanciamento.

## Non incluso

- revisione generale di `Ordine d'Assalto`;
- ruolo persistente per tutte le Pivot;
- modulo Expert Nexus;
- correzione delle mine Nexus;
- valutazione globale delle tattiche;
- ottimizzazione del ciclo Advanced su campi congestionati.
