# C2e-6a APK-M4c – Starter Map Expansion MAP1

## Base

`arena_rubra_C2e_5a_APK_M4c_nexus_protocol_block_tune.zip`

## Obiettivo

Aprire la Fase 6 della roadmap con una prima espansione moderata della mappa Starter, senza modificare bilanciamento numerico, deck, AI doctrine o regole base.

## Modifiche

- `data/maps.js`
  - `RADIUS` da 5 a 6.
  - QG G1 da `[-5,0,5]` a `[-6,0,6]`.
  - QG G2 da `[5,0,-5]` a `[6,0,-6]`.
  - PS invariati: centro e laterali restano in `[0,0,0]`, `[0,-4,4]`, `[0,4,-4]`.

- `src/constants.js`
  - build label a `C2e-6a-APK-M4c`.
  - `CENTER_Y` da 340 a 390 per centrare il nuovo radius 6.
  - `CENTER_X` resta 460.

- `css/style.css`
  - board da `920x680` a `920x780`.
  - board wrap desktop alzato a 830px.

- `src/mobile.js`
  - camera APK-M4c aggiornata a board `920x780`.

- `src/ai.js`
  - target flank Liberti reso scalabile con `RADIUS`, per evitare riferimento rigido al bordo radius 5.

- `index.html`, `src/game.js`, `README.md`
  - label e descrizioni aggiornate a C2e-6a / MAP1.

## Scelta di design

I PS laterali non sono stati spostati verso il nuovo bordo. Questo mantiene la funzione tattica già validata, ma crea margine esterno/laterale attorno agli assi di combattimento. L’obiettivo è ridurre saturazione e aumentare recupero/aggiramento senza stravolgere lo Starter.

## Non modificato

- Nessuna modifica a costi/stat/HP/DEF/ATT.
- Nessuna modifica a roster.
- Nessuna modifica a deck.
- Nessuna modifica a tattiche.
- Nessuna modifica ad AI doctrine C2e-4g/C2e-4h, salvo il target flank Liberti reso compatibile con radius 6.
- Nessuna modifica a log export, splash/audio o regola danno no-overflow.
