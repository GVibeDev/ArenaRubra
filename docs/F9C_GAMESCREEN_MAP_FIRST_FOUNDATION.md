# F9C – GameScreen Map-First Foundation

Base: `C2-STABLE-1-F9B-APK-M4c Setup Screen Foundation`.

Output: `C2-STABLE-1-F9C-APK-M4c GameScreen Map-First Foundation`.

## Scopo

Aprire la trasformazione progressiva della schermata partita verso il paradigma map-first senza toccare la logica Starter congelata.

La F9C non implementa ancora il PanelManager universale: prepara il terreno con una HUD compatta, una action bar rapida e un layout desktop più centrato sulla mappa, mantenendo i pannelli legacy ancora presenti e accessibili.

## Modifiche UI

- Aggiunta `gameHudStrip` sopra la schermata partita con:
  - round;
  - giocatore/turno corrente;
  - ENE G1/G2;
  - PS G1/G2;
  - pressione G1/G2;
  - deck/mano/scarti G1/G2;
  - build breve.
- Aggiunta `gameActionBar` inferiore desktop con accessi rapidi:
  - Mappa;
  - Fit;
  - Mano;
  - Unità;
  - Azioni;
  - Log;
  - Setup;
  - Stats.
- Aggiunto `src/game_screen.js` per HUD/action bar senza inserire logica nel motore.
- `renderAll()` aggiorna anche la HUD compatta tramite `renderGameHud()` se disponibile.
- Layout desktop della `GameScreen` reso map-first:
  - board/hand/market in area superiore;
  - setup e comandi/log sotto, ancora legacy;
  - nessun PanelManager ancora forzato.
- La UI mobile APK-M4 resta protetta: la nuova action bar e la nuova HUD desktop sono nascoste in `body.mobile-apk-m4`, così non duplicano mobileStatusStrip/mobileGameBar.

## Modifiche build

- `BUILD_INFO.version` aggiornato a `C2-STABLE-1-F9C-APK-M4c`.
- `BUILD_INFO.buildName` aggiornato a `GameScreen Map-First Foundation`.
- Log iniziale partita aggiornato con riferimento F9C.
- README aggiornato.

## Non modificato

- Gameplay.
- AI.
- Deck rules.
- Tattiche.
- Mappa radius 6 MAP1.
- Roster.
- Costi.
- HP/DEF/ATT.
- Regola danno no-overflow.
- Splash/audio asset.
- Mobile match UI APK-M4.

## Note

Questa fase deve essere validata soprattutto sul flusso desktop/EXE:

`menu → setup → partita → HUD aggiornata → action bar rapida → input mappa normale → log/export normale`.

Se validata, la fase successiva naturale è F9D: PanelManager/bottom sheet unificato.
