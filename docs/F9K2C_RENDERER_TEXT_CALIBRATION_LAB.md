# F9K2c – Temporary Renderer Text Calibration Lab

Base: `C2-STABLE-1-F9K2b-APK-M4c`.

## Scopo
Tool dev temporaneo per calibrare il renderer delle carte senza modificare gameplay, AI, deck rules o dati ufficiali.

## Dove si trova
La patch aggiunge un pulsante `Calibra renderer` in:
- Card Editor
- Card Pool
- Deck Builder

Il tool lavora sulla carta corrente e permette di calibrare per:
- tipo carta: `unit` / `tactic`
- faction key: `nexus`, `exordium`, `liberti`, `agathoi`, `fabeot`, `neutral`

## Parametri esportati
Caselle testo:
- `name`
- `type`
- `description`

Per ogni casella:
- `x`
- `y`
- `w`
- `h`
- `maxFontSize`
- `minFontSize`

Stat/ENE:
- `ene`
- `hp`
- `def`
- `att`

Per ogni stat:
- `cx`
- `labelY`
- `valueY`
- `labelSize`
- `valueSize`

## Export
Il pulsante `Copia JSON calibrazione` produce un payload con:
- target carta/fazione/tipo
- patch provvisoria
- layout risolto
- nota per fissare poi le coordinate nel codice

## Persistenza temporanea
Gli override locali sono salvati in:
`arenaRubra.rendererTextCalibration.v1`

## Non modificato
- gameplay
- AI
- deck rules
- bilanciamento
- carte ufficiali
- custom cards
- Card Editor data model
- Starter Logic Freeze
