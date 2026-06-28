# Arena Rubra – C2-FINAL-A1 – Missile Jam / Vehicle Action Audit

## Perimetro

Hotfix mirata sulla base C2-FINAL-A validata. Non introduce nuove tattiche, nuove abilità o balancing numerico.

## Modifiche

1. **Missile Jam** (`damage_and_cleanse_buffs`)
   - prima rimuove buff/effetti positivi dal bersaglio;
   - poi applica i 2 danni normali;
   - evita che il danno sembri assente perché assorbito da protezioni poi rimosse.

2. **Audit movimento/azione veicoli**
   - aggiunti helper centrali `vehicleMovedBlocksAttack()` e `vehicleMovedBlocksAbility()`;
   - `canAttack()` blocca i veicoli che hanno già mosso, salvo `warPush` o `moveAttack`;
   - `canUseAbility()` blocca i veicoli che hanno già mosso, salvo `warPush`;
   - `moveAttack` resta interpretato come “può attaccare dopo movimento”, non “può usare abilità dopo movimento”.

## Eccezioni preservate

- **Spinta di Guerra / warPush**: movimento + azione completa conservata.
- **moveAttack**: movimento + attacco, quando previsto esplicitamente.
- **Passaggio tattico / movimento speciale**: continua a passare dai flag C2c-5b già validati.

## Non modificato

- nessuna modifica ENE/stat/costi;
- nessuna modifica a deck/hand/recovery;
- nessuna modifica ad AI tattiche C2;
- nessuna modifica alle 59 tattiche implementate, salvo ordine interno di Missile Jam.
