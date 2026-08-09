# Changelog — F9T2d2a

- Versione: `C2-STABLE-1-F9T2d2a-APK-M4c`
- Baseline logica: `C2-STABLE-1-F9T2c4-APK-M4c`
- Schema dottrina: `F9T2d2a-1`
- Modulo: `expert-exordium-f9t2d2a`

## Modifiche

1. Aggiunto il gate `expertFactionTryReservedStationaryAssaultActionF9T2d2a` prima dell'emergenza Advanced.
2. Aggiunto il ramo Exordium `expertExordiumTryReservedStationaryVarranAssaultF9T2d2a`.
3. Impedito al fallback generico di consumare l'attore prenotato quando `moveCell = null`.
4. Aggiunti campi di ownership, attore, bersaglio e movimento alla telemetria Varran.
5. Aggiunti gli aggregati `varranStationaryAssaultsExecuted` e `varranAttackOwnershipRecognized`.
6. Aggiornati build info, router, runtime, precheck e schema telemetrico.
7. Preservati Clear F9T2d2, Varran effective value F9T2d1, commitment F9T2c4 e aggregati F9T2c3a.
