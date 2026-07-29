# Audit delle assunzioni a due giocatori

## Convertite al runtime 2–4

- setup: mappa, slot, fazioni, comandanti, controllo e iniziativa;
- stato: giocatori, ordine turno, risorse, pressione, effetti, missioni, deck e telemetria;
- QG e deployment;
- ciclo turni e salto eliminati;
- vittoria QG, pressione, spareggio, concessione e resa tecnica;
- selezione nemico IA e insiemi di unità avversarie;
- deck, mano, scarti, mano iniziale e validazione runtime;
- missioni, ricompense e contatori;
- HUD, riepiloghi mano, banner, audio umano/bot e overlay pubblici;
- statistiche evento, pannello G1–G4, export, storico e metadati mappa;
- resume con definizione mappa serializzata.

## Assunzioni binarie conservate intenzionalmente

- gli scenari tutorial dichiarano e forzano `[1,2]`;
- MAP1 dichiara due slot;
- campi legacy `p1*` / `p2*` restano nello storico e nel CSV per retrocompatibilità;
- pannelli legacy P1/P2 restano presenti, mentre il riepilogo F9Q aggiunge G3/G4;
- i fallback usano `[1,2]` soltanto quando il nuovo runtime mappa non è disponibile;
- alcuni testi storici di avvio citano ancora il duello P1/P2, seguiti dal messaggio FFA nelle mappe avanzate.

## Audit di isolamento bilanciamento

I seguenti file sono identici alla baseline F9O7g:

- `data/cards_base.js`
- `data/units_base.js`
- `data/tactics_base.js`
- `data/tactics_cards_c2.js`
- `data/factions.js`
- `data/tutorial_scenarios.js`
- `src/constants.js`
- `src/game_scale.js`

Non sono stati introdotti nuovi costi, statistiche, cap, carte, unità o modificatori di fazione. Le sole modifiche al motore ordinario sono adattatori necessari a mappa, terreno e numero partecipanti.

## Esito

Le assunzioni binarie ancora presenti sono limitate a compatibilità legacy, presentazione storica o tutorial esplicitamente a due partecipanti. I percorsi di gioco F9Q usano gli ID giocatore forniti dalla mappa.
