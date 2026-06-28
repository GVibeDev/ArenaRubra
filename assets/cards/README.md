# Arena Rubra – Card assets directory

F9I1b usa questa directory per frame, retro, placeholder e illustrazioni carta. Le patch ordinarie devono restare leggere: le illustrazioni complete possono essere inserite manualmente seguendo il manifest.

## Cornici e retro

I frame/retro leggeri restano nel progetto:

```text
assets/cards/frames/<faction>_unit_frame.png
assets/cards/frames/<faction>_tactic_frame.png
assets/cards/frames/<faction>_back.png
```

Fazioni: `nexus`, `exordium`, `liberti`, `agathoi`, `fabeot`.

## Illustrazioni

Naming basato su ID puro, non sul nome della carta:

```text
assets/cards/art/<faction>/units/<blueprintId>.<webp|jpg|png>
assets/cards/art/<faction>/tactics/<tacticId>.<webp|jpg|png>
```

Esempi:

```text
assets/cards/art/nexus/units/nx2b04.webp
assets/cards/art/nexus/units/nx2b04.jpg
assets/cards/art/nexus/units/nx2b04.png
assets/cards/art/nexus/tactics/nxtac05.webp
```

Il renderer prova in ordine: `.webp`, `.jpg`, `.png`. Se non trova nulla, usa il placeholder.

## Dimensioni consigliate

Target leggero nativo:

- Unità / comandanti / strutture: `800x780 px`
- Tattiche: `800x670 px`

Target opzionale @2x:

- Unità / comandanti / strutture: `1600x1560 px`
- Tattiche: `1600x1340 px`

Formato consigliato: `WEBP` o `JPG` compresso. Usa `PNG` solo se serve qualità lossless o alpha.

## Placeholder

```text
assets/cards/placeholders/missing_art_unit.png
assets/cards/placeholders/missing_art_tactic.png
```
