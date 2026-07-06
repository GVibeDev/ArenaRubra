# F9K2b – Permanent Card Art Alignment Tool

Base: `C2-STABLE-1-F9K2-APK-M4c`

## Obiettivo
Integrare nel Card Editor una gestione permanente dell'artwork custom delle carte.

## Funzioni
- Import immagine custom locale nel Card Editor.
- Indicazione dimensioni consigliate:
  - Unità: 800x780 px.
  - Tattiche: 800x670 px.
  - Alta risoluzione opzionale: 1600x1560 / 1600x1340 px.
- Downscale/compressione guidata in WebP/JPEG/PNG.
- Preview dell'immagine allegata.
- Allineamento permanente artwork:
  - zoom;
  - offset X;
  - offset Y.
- Salvataggio dei valori su carta custom come `customArtTransform`.
- Export JSON del transform.
- Renderer capace di usare `customArt.dataUrl` e applicare `customArtTransform`.
- Manifest asset indica `artEmbedded: true` quando una custom contiene immagine embedded.

## Non modificato
Gameplay, AI, deck rules, bilanciamento, carte ufficiali e logica Starter.
