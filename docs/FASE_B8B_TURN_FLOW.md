# Arena Rubra – Fase B8b Turn Flow Extraction

Nuovo modulo: `src/turns.js`.

Estratti da `main.js`:
- `postActionChecks`
- `endTurn`
- `startTurn`
- `applyStartTurnStatuses`
- `applyEndTurnStatuses`
- `applyAgathoiIdleGuardThorns`
- `endUnitAction`

Restano in `main.js`:
- controller umano;
- selezione;
- target check;
- UI summary;
- aura helper.

Test consigliati:
- startTurn iniziale;
- endTurn umano;
- endTurn bot;
- bot vs bot;
- status start/end;
- cooldown;
- PS/vittoria;
- auto-resign;
- Agathoi idle guard;
- nessun blocco `botRunning`.
