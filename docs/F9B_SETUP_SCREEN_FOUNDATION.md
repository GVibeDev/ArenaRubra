# F9B – Setup Screen Foundation

Base: `C2-STABLE-1-F9A-APK-M4c Application Shell / Main Menu Foundation`.

Output: `C2-STABLE-1-F9B-APK-M4c Setup Screen Foundation`.

## Obiettivo

Inserire una schermata setup reale tra menu principale e partita, mantenendo congelata la logica Starter.

La F9B non cambia il motore: prepara i parametri di avvio e poi li sincronizza con i controlli legacy già letti da `newGame()`.

## Cambiamenti

- Aggiunta schermata AppShell `setup`.
- `Nuova partita` dal menu principale apre la SetupScreen.
- `Avvia partita` dalla SetupScreen sincronizza i controlli e avvia `newGame()`.
- Il pulsante top bar `Nuova partita` apre SetupScreen con capture handler e impedisce il reset immediato accidentale.
- `Riprendi partita` è disabilitato finché non esiste uno `state` di gioco.
- Aggiunti controlli setup per:
  - fazione G1/G2;
  - comandante G1/G2;
  - controllo umano/bot;
  - preset ritmo;
  - iniziativa;
  - AI bot;
  - resa tecnica automatica;
  - mappa informativa `Starter MAP1 · radius 6`.
- Aggiornato `BUILD_INFO` a `C2-STABLE-1-F9B-APK-M4c`.

## Non modificato

- Gameplay.
- AI.
- Deck rules.
- Tattiche.
- Mappa.
- Roster.
- Costi.
- Statistiche unità.
- HP / DEF / ATT.
- UI mobile di partita.
- Splash/audio.
- Regola danno no-overflow.

## Test manuale consigliato

1. Splash → Menu principale.
2. `Nuova partita` → SetupScreen.
3. Cambiare fazioni e verificare refresh comandanti.
4. Cambiare modalità umano/bot, ritmo e iniziativa.
5. `Avvia partita`.
6. Verificare che il match usi il setup scelto.
7. Verificare bot purchase/move/attack.
8. Verificare umano selection/move/attack.
9. `Menu` → `Riprendi partita`.
10. Dalla partita, premere `Nuova partita`: deve aprire SetupScreen senza resettare subito.
