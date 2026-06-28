# C2-STABLE-1-APK-M4c – Starter Logic Freeze Candidate

## Scopo

Questa patch apre la Fase 8 della roadmap: **Starter Logic Freeze**.

La build non aggiunge meccaniche e non modifica gameplay. Serve a consolidare la C2e-6a MAP1 come candidata stabile dello Starter Game dopo la normalizzazione delle statistiche su mappa radius 6.

## Base

Base utilizzata: `C2e-6a-APK-M4c Starter Map Expansion MAP1`.

## Modifiche effettuate

- Aggiornate label/versioni visibili a `C2-STABLE-1-APK-M4c`.
- Aggiornato log iniziale partita con dicitura `Starter Logic Freeze Candidate`.
- Aggiornata documentazione di root.
- Aggiunta questa documentazione di freeze.
- Aggiunto file check dedicato.

## Logica candidata al freeze

Sono candidati al congelamento:

- regola danno normale no-overflow DEF -> HP;
- condizioni di vittoria QG/PS/pressione;
- economia ENE base + PS;
- deck/hand flow C2 con starter loadout fuori deck;
- roster e tattiche Starter C2;
- comandanti, pivot e cap attuali;
- AI C2e-4g + C2e-4h;
- micro-balance C2e-5a su Protocollo di Blocco Nexus;
- MAP1 radius 6;
- log export completo.

## Vincolo di Fase 8

Da questa build in avanti, salvo decisione esplicita, sono ammessi solo:

- bugfix;
- fix UI/APK;
- correzioni log/export/statistiche;
- refusi;
- documentazione;
- preparazione Application Foundation senza alterare logica Starter.

Non sono ammessi come patch ordinarie:

- nuove unità;
- nuove tattiche;
- cambi mappa/PS/QG;
- cambi numerici a stat/costi;
- rework AI sistemici;
- nuove regole.

## Non modificato

Nessuna modifica a gameplay, AI, deck, tattiche, mappa, roster, costi, HP, DEF, ATT, UI mobile, splash/audio o regola danno.
