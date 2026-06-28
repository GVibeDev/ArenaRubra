# Arena Rubra – C2e-4g1-APK-M2 Mobile Map Camera / Drawer UI

## Base
`arena_rubra_C2e_4g1_APK_M1_mobile_fit_landscape_pass`.

## Obiettivo
Secondo step Android/APK: passare da mappa semplicemente adattata a mappa mobile usabile, mantenendo intatto il motore.

## Modifiche
- `src/mobile.js` aggiornato da APK-M1 ad APK-M2.
- Camera mobile sopra il renderer esistente: fit, pan trascinando la mappa, zoom +/− e pinch zoom.
- Mappa fullscreen in landscape mobile.
- Drawer laterali/overlay per Mano, Comandi/Log e Opzioni.
- HUD mobile aggiornato con pulsanti: `−`, `Adatta/Reset`, `+`, `Mano`, `Cmd`, `Opz`.
- Classe runtime `mobile-apk-m2` aggiunta, mantenendo compatibilità con classi M1.

## Non modificato
- Nessuna modifica a gameplay, AI, deck, dati unità/tattiche o bilanciamento.
- Nessuna modifica alla mappa logica: radius, QG e PS restano invariati.
- Nessuna modifica alla regola danno normale no-overflow.
- Nessuna modifica al renderer delle celle, salvo trasformazione camera applicata al contenitore `#board`.

## Cose da testare su APK
- Landscape: mappa fullscreen visibile e centrata.
- Drag su mappa: pan fluido senza click accidentali sulle celle dopo trascinamento.
- Tap breve su cella/unità: click ancora funzionante.
- Zoom +/− e pinch zoom.
- Reset/Adatta dopo pan/zoom e dopo rotazione.
- Drawer Mano, Cmd e Opz: apertura/chiusura e scroll interno.
