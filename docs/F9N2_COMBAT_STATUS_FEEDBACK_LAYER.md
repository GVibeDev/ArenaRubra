# F9N2 – Combat & Status Feedback Layer

Baseline: C2-STABLE-1-F9N1-APK-M4c validata.

## Obiettivo

Rendere visibili i risultati effettivi del motore senza spostare logica nel renderer.

## Contratto

- `UNIT_ATTACKED`: include `attackerPos` e `defenderPos`; genera un piccolo affondo visuale.
- `UNIT_DAMAGED`: include `targetPos`, `defLoss` e `hpLoss`; mostra solo perdite realmente applicate.
- `UNIT_DEFENSE_LOST`: evento nuovo per sottrazioni DEF che non passano da `applyDamage()`.
- `STATUS_APPLIED`: include `targetPos`; F9N2 visualizza `inhibit_move`, `inhibit_attack`, `inhibit_action` e `bleed`.

## Sicurezza architetturale

Il layer non calcola danni o validità degli effetti. Consuma soltanto eventi già risolti dal motore. La coda visuale è asincrona e non blocca il turno umano o bot.

## Compatibilità

- token CSS/SVG;
- token grafici WebP cache F9M2f;
- mobile APK-M4c;
- preferenza sistema per movimento ridotto.
