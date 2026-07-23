# F9O4f — Real Art Thumbnail Cache Finalization Hotfix

## Problema
La cache F9O4e poteva considerare definitivo un canvas contenente il placeholder `Art mancante` non appena il placeholder terminava il caricamento, anche se uno o più candidati dell’illustrazione reale erano ancora in stato `loading`.

## Contratto corretto
- `realArtState=loaded`: la miniatura può essere finalizzata con arte reale.
- `realArtState=pending`: un placeholder caricato resta soltanto provvisorio.
- `realArtState=error/empty`: il placeholder può diventare definitivo quando anche il suo stato è risolto.
- Il frame deve essere risolto prima dello stato `ready`.
- Uno snapshot provvisorio evita il flash ma non imposta `data-thumb-rendered`.
- Il prewarm può completare il ridisegno anche su canvas non collegati al DOM.

## Fuori ambito
Nessuna modifica a deck, IA, Missioni, gameplay, camera, dorsi coperti o resolver degli asset.
