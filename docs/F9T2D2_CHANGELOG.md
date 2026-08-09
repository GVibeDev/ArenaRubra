# Changelog — F9T2d2

## Build

- Versione: `C2-STABLE-1-F9T2d2-APK-M4c`
- Nome: `Clear Effective Damage Preview Hotfix`
- Canale: `f9t2d2-candidate`
- Baseline logica: `C2-STABLE-1-F9T2c4-APK-M4c`
- Schema dottrina: `F9T2d2-1`

## Modifiche funzionali

- Sostituito nel Clear il confronto nominale ATT contro vita effettiva con una simulazione sequenziale ATT→DEF→HP non perforante.
- Il candidato viene accettato soltanto se la sequenza prevista distrugge realmente il presidio.
- Limite invariato di tre attaccanti.
- Aggiunto filtro per intercettazioni che devierebbero l'attacco dal presidio del PS.
- Builder e occupanti vengono selezionati escludendo gli attaccanti riservati.
- Aggiunta una sola ricomposizione bounded quando un attaccante richiesto diventa indisponibile.
- Gli attacchi residui vengono saltati quando il bersaglio è già stato eliminato.
- Il commitment territoriale F9T2c4 parte sullo stato autorevole del PS.

## Telemetria

Aggiunti:

- modello `ATT_DEF_HP_NON_PIERCING`;
- danni DEF/HP previsti e reali;
- DEF/HP residui previsti;
- attaccanti richiesti ed eseguiti;
- corrispondenza previsione/risultato;
- conteggio della ricomposizione della sequenza;
- decisioni `clear_effective_damage_step`, `clear_effective_damage_sequence_result` e `clear_attack_sequence_recomputed`;
- ragioni `insufficient_hp_damage_after_def_break` e `no_effective_kill_sequence`.

## Versioni e diagnostica

- Aggiornati build info, precheck, runtime Expert e schema telemetrico a F9T2d2.
- Aggiornato l'identificatore del router Exordium a `expert-exordium-f9t2d2`.
- Aggiornati i test congelati alla nuova versione candidata.
- Reso il browser smoke Territorial Conversion indipendente dall'identità rigida dell'attaccante: risolve gli attori realmente prenotati dal piano.

## Non modificato

- carte, statistiche, costi e deck;
- regole del combattimento;
- mappe e Missioni;
- bilanciamento;
- comportamento di Varran F9T2d1;
- comportamento delle altre fazioni;
- budget Expert da 8 ms.
