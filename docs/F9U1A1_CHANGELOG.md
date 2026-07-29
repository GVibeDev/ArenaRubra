# Arena Rubra — F9U1a1 Changelog

## Build

`C2-STABLE-1-F9U1a1-APK-M4c — Inspector, Hand Alignment & Header Controls Hotfix`

Baseline logica validata: `C2-STABLE-1-F9Q3e1a-APK-M4c`.

La candidata corregge F9U1a prima della validazione. Non modifica carte, deck, mappe, regole, IA o schema telemetrico `F9Q3e1-2`.

## Modifiche

### Inspector dell’unità

- Pannello destro disposto in una sola colonna.
- Anteprima della carta portata a 230 px su desktop, equivalente alla preview della mano.
- Pulsante dell’abilità principale subito sotto l’immagine.
- Tabella leggibile con sole statistiche HP, DEF e ATT.
- Abilità attiva e passive raccolte in una sezione dedicata.
- Comandi inferiori ridotti a `Muovi unità`, `Costruisci` e `Fine turno`.
- Rimosso dall’Inspector il comando legacy `Passa azione unità`.
- Altezza limitata al viewport con scorrimento interno.

### Overlay della mano

- Spostato verso sinistra e ristretto fra dock azioni e Inspector.
- Non si sovrappone più all’Inspector destro su desktop.

### Controlli audio e presentazione

- Musica e volume raccolti in una riga dedicata.
- `Carte animate`, `Miniature FX` ed `Effetti` affiancati su una seconda riga.
- Etichette aggiornate da `FX token` e `SFX` a termini più chiari per l’utente.
- Layout adattato anche alla modalità mobile/APK.

## File principali modificati

- `index.html`
- `css/style.css`
- `src/render.js`
- `src/token_fx.js`
- `src/sfx_manager.js`
- `src/build_info.js`
- `src/game.js`
- `README.md`
