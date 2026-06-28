# Arena Rubra – F9E1 HUD & Panel Usability Hotfix

Build: `C2-STABLE-1-F9E1-APK-M4c`
Base: `C2-STABLE-1-F9E-APK-M4c`

## Scopo

Microfix di usabilità dopo F9E. Il PanelManager era valido, ma il flusso pratico aveva tre problemi:

1. `Fit` non chiudeva i pannelli e non riportava immediatamente alla mappa.
2. La Mano/Azioni poteva restare davanti alla mappa dopo `Gioca carta`, `Gioca ora` o `Piazza starter`.
3. Il pulsante `Unità` era ridondante rispetto alla scheda unità flottante automatica.

## Modifiche

- `Fit` chiude i pannelli desktop/mobile e riporta alla mappa.
- Fix in `panel_manager.js`: `openGamePanel()` ora recupera `def` prima di usarla per il placement.
- Aggiunta uscita robusta `closeAnyGamePanelForMapReturn()`.
- `closePanelForMapTarget()` non dipende più solo da `currentPanel` e rimuove direttamente classi attive/scrim quando parte una selezione su mappa.
- Rimosso `Unità` da action bar desktop e mobile.
- Aggiornate griglie CSS da 7 a 6 pulsanti.

## Invarianti

Non sono stati toccati gameplay, AI, deck rules, tattiche/effetti, mappa, roster, costi, HP/DEF/ATT, splash/audio o no-overflow damage rule.
