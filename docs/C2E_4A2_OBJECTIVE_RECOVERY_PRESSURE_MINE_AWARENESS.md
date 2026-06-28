# C2e-4a2 – Objective Recovery / Pressure Emergency / Mine Awareness

Patch AI generale su base C2e-4a1.

## Interventi

- `zeroPsRecovery`: 0 PS spinge il bot verso PS proprio/centrale.
- `pressureEmergency`: 3 PS nemici o Pressione 3/5+ attivano override per rompere controllo PS.
- `defendQGRecovery`: difesa QG con direttrice di ripartenza verso PS.
- Mine awareness: malus a movimento/spawn/build su mine, Fossato, Anatema nemico, Rovi nemici e celle ostili.
- Goal refinement: se il bot è in vantaggio e può chiudere QG, piano `vittoria_qg` prima di `vittoria_pressione`.

## Non incluso

- Fortificazione QG speciale fuori cap.
- Ingrandimento mappa.
- Profili specifici di fazione.
