# F9J2a – Card Pool Unified Preview Microfix

Base: `C2-STABLE-1-F9J2-APK-M4c`

## Obiettivo
Rifinire il Pool carte dopo il test della galleria renderizzata.

## Modifiche
- Apertura default su `Nexus` + `Unità`, per evitare il render iniziale di tutte le 155 carte.
- Preview unica in alto: filtri, descrizione, path asset e carta selezionata restano nello stesso blocco.
- Fullscreen/focus usa la stessa preview principale, non crea più un secondo canvas duplicato.
- Pulsante `Chiudi fullscreen` ora agisce sulla stessa preview/focus mode.
- Sotto la preview resta la galleria renderizzata filtrata; la tabella resta come vista alternativa.

## Non modificato
Gameplay, AI, deck rules, bilanciamento, storage, setup, card data e geometria renderer.
