# Arena Rubra — F9T1 Changelog

## Build

`C2-STABLE-1-F9T1-APK-M4c — Expert AI Architecture · Telemetry Contract`

Baseline: `C2-STABLE-1-F9T0-APK-M4c`.

## Aggiunto

- modalità Expert di sviluppo nel Setup;
- runtime Expert separato dall’Advanced;
- router singola fazione;
- cinque moduli indipendenti e inizialmente vuoti;
- contesto comune unico per turno;
- cache effimera con conteggio hit/miss;
- budget temporali e limiti di candidati/passaggi;
- contratto di micro-piano non ricorsivo;
- fallback esplicito ad Advanced F9T0;
- eventi Expert tipizzati;
- estensione telemetrica `F9T1-1` dentro lo schema base `F9Q3e1-2`;
- tracciamento di modulo, contesto, fallback, budget, decisioni e memoria heap quando esposta dal browser.

## Valutazioni comuni congelate

- prossimità nemica adattiva al movimento mappa;
- protezione strutturale del QG;
- strutture sui PS;
- rischio di occupazione della cella QG.

## Non modificato

- nessuna dottrina di fazione Expert;
- comportamento dell’Advanced F9T0;
- regole, carte, statistiche, deck, mappe, Missioni e bilanciamento;
- informazioni disponibili ai bot;
- casualità e seed.
