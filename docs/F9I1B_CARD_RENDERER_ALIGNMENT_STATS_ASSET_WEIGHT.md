# F9I1b – Card Renderer Alignment / Stats / Asset Weight Microfix

## Scopo
Rifinire il renderer F9I1a prima di portarlo in game.

## Modifiche renderer
- Nome unità spostato 1.5 px più in alto.
- Nome tattica spostato 2.5 px più in alto.
- Stat abbassate di 7 px.
- Stat disegnate con font numerico tabulare monospace: `Consolas / Liberation Mono / Courier New / monospace`.
- Colori stat confermati:
  - ENE giallo
  - HP verde
  - DEF bianco
  - ATT rosso
- HP/DEF/ATT restano visibili per carte unità/comandante/struttura.
- Le tattiche mostrano solo ENE, perché non hanno HP/DEF/ATT.

## Asset art
Il renderer supporta ora fallback multiplo: `.webp`, `.jpg`, `.png`.

Naming:

```text
assets/cards/art/<factionKey>/units/<blueprintId>.<webp|jpg|png>
assets/cards/art/<factionKey>/tactics/<tacticId>.<webp|jpg|png>
```

Dimensioni consigliate leggere:

- unità/comandanti/strutture: `800x780 px`
- tattiche: `800x670 px`

Dimensioni opzionali @2x:

- unità/comandanti/strutture: `1600x1560 px`
- tattiche: `1600x1340 px`

## Non modificato
Gameplay, AI, deck rules, setup, storage, tattiche e regole combattimento restano invariati.
