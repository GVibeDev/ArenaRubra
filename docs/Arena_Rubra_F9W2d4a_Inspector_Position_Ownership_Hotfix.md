# Arena Rubra — F9W2d4a Inspector Position Ownership Hotfix

## Baseline

- Remote `main` verificato: `311a05ca988c4c5343f7b00356c247d3a6fea328`
- Build di partenza: `C2-STABLE-1-F9W2d4-APK-M4c`
- Candidata: `C2-STABLE-1-F9W2d4a-APK-M4c`

## Problema

F9W2d4 definisce correttamente `.selectedUnitFloat` nel CSS statico come pannello
`position: fixed` ancorato al lato destro del viewport Desktop/Web.

Il runtime dei temi, però, includeva lo stesso elemento nel gruppo host che applica
dinamicamente `position: relative; isolation: isolate;`. Poiché lo style dinamico viene
installato a runtime, la proprietà `position` del layout veniva sovrascritta.

## Correzione

`selectedUnitFloat` viene rimosso soltanto dal gruppo dinamico che assegna
`position: relative`.

Resta invece nei selettori visuali del theme layer:
- colore e superficie;
- materiale;
- bordo;
- contenuti con z-index;
- pseudo-elemento ornamentale.

La posizione torna quindi ad appartenere esclusivamente al CSS di layout F9W2d4.

## Invarianti

Nessuna modifica a gameplay, AI, tutorial, mappe, Match Data, Player/DEV,
skin/materiali, moduli ornamentali o `presentation_theme`.
