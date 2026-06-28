# Arena Rubra – C2-STABLE-1-F9C1a-APK-M4c

## GameScreen UI Alignment Hotfix

Base: `C2-STABLE-1-F9C1-APK-M4c GameScreen UI Alignment Microfix`.

Correzione mirata: dopo F9C1 lo splash poteva chiudersi lasciando solo lo sfondo vuoto perché l’inizializzazione della GameScreen chiamava la scheda unità selezionata prima che esistesse `state`.

Interventi:

- `syncSelectedUnitFloatState()` ora verifica che `state` esista e che `state.units` sia disponibile prima di chiamare `getSelectedUnit()`.
- `initializeArenaAppShell()` isola l’inizializzazione GameScreen in un `try/catch` non bloccante, così un errore HUD/GameScreen non impedisce mai la comparsa del menu principale.
- Label/build aggiornate a `C2-STABLE-1-F9C1a-APK-M4c`.

Non modificato:

- gameplay;
- AI;
- deck rules;
- tattiche/effetti;
- mappa;
- roster;
- costi/stat;
- HP/DEF/ATT;
- splash/audio assets;
- regola danno no-overflow.
