# F9C1 – GameScreen UI Alignment Microfix

Base: `C2-STABLE-1-F9C-APK-M4c GameScreen Map-First Foundation`.
Output: `C2-STABLE-1-F9C1-APK-M4c GameScreen UI Alignment Microfix`.

## Obiettivo

Correggere tre problemi emersi durante la validazione F9C:

1. Lo stato dell’unità selezionata era ancora mescolato al pannello log/comandi.
2. Il log non era ancora riducibile come pannello informativo richiamabile.
3. La barra mobile non era più allineata al nuovo layout GameScreen.

## Interventi

### Scheda unità flottante

`selectedPanel` e `actionPanel` sono stati spostati dentro `boardWrap`, in `selectedUnitFloat`.
La scheda compare sulla mappa quando una unità è selezionata e può essere ridotta/ingrandita tramite `toggleSelectedUnitFloatBtn`.

### Separazione tattiche

Le tattiche non vengono più renderizzate dentro `actionPanel` della scheda unità. Sono state spostate nel nuovo `tacticPanel`, dentro il pannello `commandLogPanel`.

### Log riducibile

Il log è stato racchiuso in `logDock`, con pulsante `toggleLogDockBtn`.
`Log` nella action bar desktop riapre il log e porta al relativo pannello.

### Mobile/APK-M4

La barra mobile è stata aggiornata a:

`Fit`, `Focus`, `Unità`, `Azioni`, `Mano`, `Log`, `Opz`.

Mapping:

- `Fit`: camera fit.
- `Focus`: camera focus.
- `Unità`: apre/focalizza la scheda flottante sulla mappa.
- `Azioni`: apre il pannello tattiche.
- `Mano`: apre la mano.
- `Log`: apre il log.
- `Opz`: apre setup/opzioni.

## File modificati

- `index.html`
- `css/style.css`
- `src/build_info.js`
- `src/game_screen.js`
- `src/mobile.js`
- `src/render.js`
- `src/app.js`
- `src/constants.js`
- `src/game.js`
- `README.md`

## Non modificato

Nessuna modifica a gameplay, AI, deck, tattiche, mappa, roster, costi, HP/DEF/ATT, splash/audio o regola danno no-overflow.
