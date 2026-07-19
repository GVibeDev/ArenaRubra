# F9O2b — Camera Autonomy & Inspection Contract

Baseline: C2-STABLE-1-F9O2a-APK-M4c.

## Contratto
- Nessun autofocus causato da render, selezione unità, movimento, attacco, abilità o azioni bot.
- Focus/Fit cambiano la vista soltanto quando richiesti esplicitamente.
- Durante il bot, il click su una unità usa `gameScreenUiState.inspectedUnitId`, non `selectedId`.
- La scheda unità e il pannello azioni vengono mostrati, ma i comandi restano disabilitati.
- Selezionando una carta unità o starter, la mano si chiude e `cameraFitDeploymentTargets` inquadra tutte le celle di sbarco valide.
- Costruzione, tattiche, movimento e abilità non attivano fit automatici.

## API aggiunte
- `cameraFitCoords(coords, options)`
- `cameraFitDeploymentTargets(side, blueprint, options)`
- `cameraScheduleDeploymentFit(side, blueprint, options)`
- `gameScreenInspectUnit(unitOrId)`
- `gameScreenDisplayedUnit()`
- `gameScreenClearInspection()`
