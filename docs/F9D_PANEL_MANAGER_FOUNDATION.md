# Arena Rubra – F9D PanelManager Foundation

Build: `C2-STABLE-1-F9D-APK-M4c`
Base: `C2-STABLE-1-F9C1a-APK-M4c`

## Scopo

Introdurre un gestore unico per i pannelli principali della GameScreen, in modo da preparare il passaggio definitivo a una UI map-first con pannelli overlay/bottom sheet.

## Implementazione

È stato aggiunto `src/panel_manager.js` con stato UI separato dalla logica partita.

Il manager controlla:

- mano;
- azioni/tattiche;
- log;
- setup;
- statistiche;
- mercato tecnico legacy.

Il pannello aperto viene marcato con `panelOverlayActive`. Lo scrim `gamePanelScrim` intercetta il click esterno, chiude il pannello e consuma l’evento, così il click non arriva alla mappa.

Su mobile/APK-M4 il manager rimanda alle funzioni M4 già validate (`setApkM4Panel`), evitando di duplicare la UI mobile.

## Vincoli rispettati

Nessuna modifica a:

- motore partita;
- AI;
- regole deck;
- tattiche;
- mappa;
- roster;
- valori numerici;
- danno no-overflow.

## Nota architetturale

Questa build non è ancora il redesign finale. È il telaio del PanelManager. I pannelli legacy restano esistenti, ma ora possono essere richiamati in modo coerente dalla action bar e chiusi in modo sicuro.
