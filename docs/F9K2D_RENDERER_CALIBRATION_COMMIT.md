# F9K2d – Renderer Calibration Commit / Coordinate Freeze

Base: `C2-STABLE-1-F9K2c-APK-M4c`.

## Scopo
Fissare nel renderer le coordinate validate con il Calibration Lab F9K2c.

## Coordinate integrate
Sono stati integrati 8 target:

### Unità
- `unit:exordium`
- `unit:agathoi`
- `unit:liberti`
- `unit:fabeot`

### Tattiche
- `tactic:exordium`
- `tactic:agathoi`
- `tactic:liberti`
- `tactic:fabeot`

Nexus resta baseline.

## Implementazione
Le coordinate sono state integrate in `src/card_renderer.js` come `CARD_RENDERER_FIXED_LAYOUT_OVERRIDES`.

Il renderer applica prima la geometria base e poi, per le fazioni calibrate, sovrascrive:
- `textAreas.name`
- `textAreas.type`
- `textAreas.description`
- `statText.ene`
- `statText.hp`
- `statText.def`
- `statText.att`

## Calibration Lab
Il tool resta disponibile, ma usa una nuova chiave locale:
`arenaRubra.rendererTextCalibration.v2`

Questo evita che vecchi override F9K2c rimasti nel dispositivo possano sovrascrivere il layout fissato.

## Non modificato
- gameplay
- AI
- deck rules
- bilanciamento
- carte ufficiali
- Card Editor data model
- custom art
- logica Starter Freeze
