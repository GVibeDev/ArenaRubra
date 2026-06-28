# Arena Rubra – C2e-4g1-APK-M1 Mobile Fit / Landscape Pass

## Base
C2e-4g1 Log Export / Deck Rules / Fabeot Tune.

## Scopo
Prima patch del ramo Android/APK. Interviene solo su layout e adattamento mobile.

## Modifiche
- Nuovo `src/mobile.js` per rilevamento mobile, orientamento e fit automatico board.
- Viewport con `viewport-fit=cover`.
- Classi runtime `mobile-apk-m1`, `mobile-landscape`, `mobile-portrait`.
- Mappa 920×680 scalata per stare dentro il viewport.
- Pulsante mappa **Adatta**.
- Landscape mobile: mappa prioritaria, setup collassabile, mano/comandi/log compatti, mercato debug nascosto.
- Portrait: avviso di ruotare il dispositivo.
- Target touch più comodi e coordinate celle nascoste su mobile.

## Non modificato
- Nessuna modifica a gameplay, AI o bilanciamento.
- Nessuna modifica a carte, costi, HP, DEF, ATT.
- Nessuna modifica alla regola danno normale no-overflow.
- Nessuna modifica alla mappa logica.

## Da testare su APK
- Avvio in landscape.
- Mappa interamente visibile.
- Tap su unità/celle.
- Evidenziazione celle raggiungibili.
- Mano/comandi/log leggibili nel pannello mobile.
- Pulsante **Adatta** dopo rotazione o resize.
