# Arena Rubra – F9D1 Panel Separation Microfix

Build: `C2-STABLE-1-F9D1-APK-M4c`

Base: `C2-STABLE-1-F9D-APK-M4c PanelManager Foundation`.

## Obiettivo

Pulire la GameScreen dopo la validazione del PanelManager, separando i contenuti che erano ancora accorpati in pannelli legacy.

## Modifiche

- `tacticPanel` separato in `tacticDock`.
- `logDock` separato in un pannello log dedicato.
- `matchupStatsPanel` e `recentStatsPanel` spostati in `statsPanel` fuori dal setup.
- PanelManager aggiornato con selettori separati per `actions`, `log`, `setup`, `stats`.
- Action bar desktop semplificata: rimosso `Mappa`, resta `Fit` come comando di riadattamento mappa.
- Mobile/APK-M4 aggiornato con classi dedicate `mobile-panel-actions`, `mobile-panel-log`, `mobile-panel-stats`.

## Non modificato

Gameplay, AI, deck rules, effetti tattiche, mappe, roster, costi/stat unità, HP/DEF/ATT, splash/audio e regola no-overflow non sono stati modificati.
