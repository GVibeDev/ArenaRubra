# Arena Rubra – C2-STABLE-1-F9J1-APK-M4c

Card Pool Screen Foundation.

Baseline: `C2-STABLE-1-F9P1a-APK-M4c Storage Import/Export UX Hotfix`.

Questa build mantiene congelata la logica Starter e rifinisce il Deck Builder persistente:

- mantiene `src/storage.js` come layer unico per storage persistente;
- mantiene compatibilità con i deck custom salvati da F9H3/F9P1/F9P1a;
- mantiene export/import JSON chiaro con download file, copia clipboard, import da file e import da testo incollato;
- aggiunge nel Deck Builder una gallery dei deck salvati/importati;
- la gallery mostra tutti i deck persistenti locali, anche di altre fazioni/comandanti;
- ogni deck in gallery mostra fazione, comandante, chiave storage, data, validità e numero carte;
- da gallery è possibile caricare un deck nel draft, copiarne il JSON importabile o eliminarlo;
- caricando un deck dalla gallery, il Deck Builder passa automaticamente alla sua fazione/comandante;
- il SetupScreen continua a usare solo deck custom validi per la fazione/comandante selezionati;
- lo storico partite persistente e il manifest asset carte introdotti in F9P1 restano invariati.

Le illustrazioni carta non vengono incluse in questa patch: il codice continua a definire nomi file e albero directory attesi per il futuro renderer.

Nessuna modifica a gameplay, AI, tattiche, mappa, roster, costi/statistiche unità o regola danno no-overflow.


## Novità F9I2
- Preview renderer integrata nella schermata di gioco per l'unità selezionata.
- Preview renderer integrata nel pannello Mano / deck C2 per starter card e carte in mano.
- Click sulle carte del pannello mano/starter per aggiornare l'anteprima senza alterare il gameplay.
- Nessuna modifica a regole, AI, deck building o bilanciamento.


## Novità F9I2a
- Box unità selezionata più alto su desktop, circa +20/25%.
- Box unità selezionata molto più alto su mobile/APK, circa +100%.
- Miniatura card renderer dell'unità più leggibile su mobile.
- Nessuna modifica a gameplay, AI, deck rules, storage o bilanciamento.


## F9J1 – Card Pool Screen Foundation
Aggiunge una schermata `Pool carte` read-only con filtri per fazione, tipo e ruolo, ricerca testuale, preview renderer e riferimenti ai path asset. Nessuna modifica a gameplay, AI, deck rules, setup o storage.
