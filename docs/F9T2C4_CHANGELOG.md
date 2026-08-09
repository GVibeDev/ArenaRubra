# Changelog — F9T2c4

## Aggiunto

- Impegno operativo persistente per l'occupazione successiva a `CLEAR_OCCUPY_FORTIFY`.
- Elenco degli occupanti candidati conservato nel micro-piano.
- Riassegnazione bounded dell'occupante quando quello prenotato non è più utilizzabile.
- Hook di conversione eseguito prima delle azioni generiche del fallback.
- Priorità `1600` per l'occupante committed.
- Telemetria di commitment, riassegnazione, differimento per rischio QG ed esecuzione.
- Smoke dedicato `f9t2c4_clear_occupation_commitment_smoke.js`.

## Corretto

- PS lasciato libero dopo l'eliminazione del presidio quando l'occupante originario era già stato consumato dal fallback.
- Abort `turn_ended_before_completion` evitabile in presenza di un sostituto legale.
- Azioni di attacco diventate obsolete saltate dopo la rimozione autorevole del bersaglio.
- Riserva `garrison:<unitId>` aggiornata quando cambia l'occupante.

## Preservato

- Baseline logica F9T2c3a.
- Bastion Relay, Survival Check e Forward Pivot.
- Bootstrap del primo turno e sessioni Expert.
- Riconciliazione decisioni/audit e proprietà temporale dei record.
- Regole, bilanciamento, carte, deck, mappe, editor e Control Center.

## Non incluso

- Nuove dottrine Exordium.
- `VARRAN_ASSAULT_CHAIN`.
- Correzione delle mine Nexus.
- Revisione generale delle tattiche.
- Gestione del field cap o della congestione.
- Ottimizzazione completa del ciclo Advanced su APK.
