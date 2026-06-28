# F9I1c – Deck Builder Renderer Data/Asset Path Microfix

## Scopo
Rendere affidabile la preview carta nel Deck Builder prima dell’integrazione in-game.

## Correzioni
- La preview è stata spostata più in basso: dopo il Pool legale e prima del Deck draft locale.
- Il renderer idrata sempre la carta dal catalogo completo tramite `card.id`, così le righe del draft non perdono `blueprintId`, `tacticId`, `unitType`, `weight`, descrizione e dati stat.
- HP, DEF, ATT e descrizione cambiano coerentemente quando si seleziona una carta dal Pool o dal Draft.
- Il report del Deck Builder conserva più campi carta nel blocco `deck`.
- Il caricamento immagini prova varianti lower-case e raw-case: per `NXTAC02` accetta sia `nxtac02.jpg` sia `NXTAC02.jpg`, fermo restando che il naming consigliato resta lower-case.

## Naming consigliato
`assets/cards/art/nexus/tactics/nxtac02.jpg` resta preferibile.

## Nota cache
Se un’immagine viene aggiunta mentre la schermata è già aperta, ricaricare la pagina/app: il browser può avere già memorizzato il fallimento di caricamento.

## Non modificato
Gameplay, AI, deck rules, tattiche, setup, storage, roster, mappa e regole di combattimento non sono stati modificati.
