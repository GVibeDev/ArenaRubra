# C2e-4h1 APK-M4c – Splash / Audio Asset Microfix

Base: `arena_rubra_C2e_4h_APK_M4c_superior_doctrine_calibration.zip`.

Obiettivo: aggiornare gli asset di intro e title screen senza modificare gameplay, AI, deck, mappa o bilanciamento.

## Interventi

- Sostituito `assets/intro/g-vibe-dev-logo.png` con il nuovo logo G vibe dev fornito dall'utente.
- Sostituito `assets/intro/arena-rubra-title.png` con la nuova schermata Arena Rubra fornita dall'utente.
- Sostituito `assets/audio/432-hertz-rift.mp3` con la nuova traccia `432 Hertz Rift2.mp3` fornita dall'utente.
- Timer dello splash G vibe dev portato da 3 a 5 secondi.
- Audio avviato quando compare il logo G vibe dev, con fallback al primo gesto utente se WebView/browser blocca autoplay.
- Volume playback abbassato di circa il 10% rispetto alla M4c precedente: da 0.74 a 0.67.
- Rimossa la scritta HTML duplicata `G Vibe Dev` dalla schermata Arena Rubra, perché la nuova immagine la include già.
- Label build aggiornata a `C2e-4h1-APK-M4c`.

## Non modificato

- Gameplay.
- AI e dottrina C2e-4h.
- Deck / hand flow.
- Tattiche.
- Roster.
- Mappa logica.
- Bilanciamento numerico.
- Costi, HP, DEF, ATT.
- Regola danno normale no-overflow DEF → HP.
