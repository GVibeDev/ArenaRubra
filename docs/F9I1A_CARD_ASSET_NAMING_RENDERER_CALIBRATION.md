# F9I1a – Card Asset Naming & Renderer Calibration Microfix

## Scopo
Standardizzare i file immagine delle illustrazioni e rifinire il renderer preview introdotto in F9I1.

## Convenzioni asset
- Cartelle: `assets/cards/art/<factionKey>/units/` e `assets/cards/art/<factionKey>/tactics/`
- Nome file: **ID puro normalizzato** della carta sorgente
  - unità/comandanti/strutture: `blueprintId`
  - tattiche: `tacticId`
- Esempi: `nx2b04.png`, `extac05.png`, `fab1c01.png`
- Niente spazi, accenti o nomi lunghi descrittivi nel filename principale.

## Formato immagini consigliato
- Unità / comandanti / strutture: **1664 × 1700 px**
- Tattiche: **1664 × 1400 px**
- Formato: **PNG RGB 24-bit**
- Alpha: **RGBA 32-bit opzionale** solo se davvero necessario

## Renderer calibration
- Nome carta centrato e leggermente più grande (+2/+3 pt)
- Tipo carta centrato
- Tipo unità in italiano e in maiuscolo (es. `FANTERIA LEGGERA`, `VEICOLO ELITE`, `COMANDANTE`)
- Colori stat coerenti con la UI in-game:
  - HP verde
  - DEF bianco
  - ATT rosso
  - ENE giallo

## Note
La microfix non modifica gameplay, deck rules, AI o runtime partita.
