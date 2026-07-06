# F9K3 – In-game Hand Rendered Thumbnails

Base: `C2-STABLE-1-F9K2d-APK-M4c`.

## Scopo
Rendere la mano in partita più simile a un vero card game: nel pannello `Mano / deck C2`, carte in mano e starter card vengono mostrate come miniature renderizzate invece che come blocchi testuali.

## Cosa cambia
- Le carte in mano usano canvas miniatura con `renderArenaCardPreviewCanvas(..., { scale: 0.19 })`.
- Le starter card usano lo stesso rendering miniaturizzato.
- Click/tap sulla miniatura seleziona la carta e aggiorna la preview grande già esistente.
- I pulsanti operativi `Gioca` / `Acquista starter` restano separati e invariati.
- Le ragioni di disponibilità/indisponibilità restano visibili sotto l’azione.
- Su mobile la mano usa scorrimento orizzontale.

## File modificati
- `src/render.js`
- `css/style.css`
- `src/build_info.js`
- `src/game.js`
- `index.html`
- `README.md`

## Non modificato
- gameplay
- AI
- deck rules
- bilanciamento
- Card Editor
- Card Pool
- custom art
- coordinate renderer F9K2d
- Starter Logic Freeze
