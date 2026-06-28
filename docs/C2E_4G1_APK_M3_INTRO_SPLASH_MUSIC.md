# Arena Rubra – C2e-4g1 APK-M3 Intro / Splash / Music

## Base
C2e-4g1 APK-M2b Non-fullscreen Mobile Fit / Splash Shell.

## Modifiche
- Aggiunti asset intro in `assets/intro/`:
  - `g-vibe-dev-logo.png`
  - `arena-rubra-title.png`
- Aggiunto audio in `assets/audio/432-hertz-rift.mp3`.
- Aggiornato `src/splash.js` con flusso intro a fasi: idle → dev → title → ready.
- La musica parte solo dopo il primo gesto utente, per rispettare i blocchi autoplay di Android/WebView.
- Aggiunti controlli intro: Avvia intro, Entra nell’Arena, Musica ON/OFF, Salta intro.

## Non modificato
Gameplay, AI, deck, tattiche, bilanciamento, mappa logica e regola danno no-overflow non sono stati modificati.
