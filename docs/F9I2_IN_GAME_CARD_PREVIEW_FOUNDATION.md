# F9I2 – In-game Card Preview Foundation

Base: `C2-STABLE-1-F9I1e-APK-M4c`

## Obiettivo
Portare il Card Renderer fuori dal solo Deck Builder e integrarlo nella schermata di gioco in modo non distruttivo.

## Contenuto
- Miniatura renderer per l'unità selezionata sulla mappa.
- Preview renderer nel pannello `Mano / deck C2`.
- Click sulle starter card e sulle carte in mano per aggiornare la preview.
- Evidenziazione della carta correntemente mostrata nella preview.
- Nessuna modifica a gameplay, AI, bilanciamento, deck rules o storage.

## Note
La preview dell'unità in campo mostra la carta base del blueprint, mentre lo stato dinamico dell'unità (HP/DEF correnti, status, azioni) continua a vivere nel pannello unità già esistente.
