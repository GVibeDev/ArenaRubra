# Arena Rubra — F9U1a Changelog

## Build

- Versione: `C2-STABLE-1-F9U1a-APK-M4c`
- Nome: **Map HUD Layout Foundation**
- Canale: `f9u1a-candidate`
- Baseline logica: `C2-STABLE-1-F9Q3e1a-APK-M4c`
- Schema telemetrico: `F9Q3e1-2` invariato

## Schermata di gioco

- Rimossa dal markup la barra inferiore legacy della partita.
- La mappa resta l’area centrale principale e conserva i controlli camera Fit, Centra e zoom.
- Aggiunto un dock permanente sul lato sinistro con:
  - riepilogo Missione, quando presente;
  - abilità di fazione;
  - Mostra/Nascondi mano;
  - Fine turno.
- Mano e Fine turno rimangono disponibili anche quando la mano rapida è nascosta.
- Setup, mercato, pannello mano legacy e pannello tattiche legacy non sono più visibili nella schermata di gioco.
- Il pannello dell’unità selezionata rimane sul lato destro senza rework strutturale; la sua revisione è rinviata a F9U1b.

## Menu Debug

- Aggiunto il pulsante **Debug** nell’HUD desktop e nella barra superiore mobile.
- Il menu Debug raccoglie:
  - Mano;
  - Log;
  - Statistiche;
  - Telemetria.
- Il menu mostra la build corrente e lo schema telemetrico.
- Log e Statistiche vengono aperti tramite il Panel Manager come overlay, senza riportare il vecchio Setup nella partita in corso.

## Desktop e mobile

- Eliminata anche la vecchia barra inferiore mobile.
- Il dock sinistro usa la stessa gerarchia su desktop e APK/mobile.
- Il vecchio HUD mobile con Mano/Cmd/Opz resta nascosto.
- I controlli camera sovrapposti alla mappa restano disponibili su mobile.
- Corrette le precedenze CSS ereditate che centravano verticalmente il vecchio dock azioni.

## Compatibilità

Nessuna modifica a:

- carte e pool;
- 50 deck ufficiali;
- mappe e asset;
- regole, combattimento, IA o Pressione;
- seed e RNG;
- telemetria F9Q3e1a;
- attribuzione PS, tracciamento multi-istanza Pivot e sovrapesca.
