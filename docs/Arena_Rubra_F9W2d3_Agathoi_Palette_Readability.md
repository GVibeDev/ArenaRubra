# Arena Rubra — F9W2d3 Agathoi Palette Readability Hotfix

## Baseline

- Base di correzione: `C2-STABLE-1-F9W2d2-APK-M4c`
- Build candidata: `C2-STABLE-1-F9W2d3-APK-M4c`
- Build name: `Agathoi Palette Readability Hotfix`
- Channel: `starter2-ui-agathoi-palette-w2d3`
- Logic baseline: `C2-STABLE-1-F9T2c4-APK-M4c`

## Problema

Dopo F9W2d2 il tema Agathoi risultava ancora debole sul piano della leggibilità:
la combinazione fra materiale chiaro, superfici verde scuro e token testo ereditati
faceva percepire sfondo e caratteri troppo vicini in tono/temperatura su vari menu e
pannelli di gioco.

## Intervento

F9W2d3 modifica soltanto la palette Agathoi:

- `bg/bg2/surface/surface2/line/accent/accent2` riequilibrati;
- `textPrimary`, `textSecondary`, `textHeading`, `tableText`, `tableMuted` portati su
  una gamma chiara ad alto contrasto;
- `textOnAccent` mantenuto scuro per i pulsanti primary;
- `materialOverlay` reso più scuro;
- `materialBlendMode` cambiato da `soft-light` a `multiply` per aumentare separazione
  fra texture e testo.

## Obiettivo pratico

Migliorare la leggibilità di:

- titoli e paragrafi nelle schermate menu;
- input, pulsanti ghost e tabelle;
- pannelli di gioco con tema Agathoi.

## Invarianti

Nessuna modifica a:

- gameplay, AI, tutorial, mappe, Match Data;
- profili Player / DEV;
- contract F9W2d2 dei moduli ornamentali (4 corner + 4 side);
- rimozione di crest/divider;
- fix scroll F9W2d1.
