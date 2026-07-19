# C2-STABLE-1-F9N4-APK-M4c

## Perimetro implementato

- Definizioni strutturate delle 15 Missioni ufficiali in `data/missions_base.js`.
- Due Missioni ordinarie e una disperata per ciascuna delle cinque fazioni.
- Carte catalogo con `sourceType`, `cardType` e `deckRole` impostati a `mission`.
- Missione facoltativa e limite globale di una per deck, anche tra Missioni con ID diversi.
- Composizione valida: 30 carte senza Missione oppure 29 carte ordinarie + 1 Missione.
- Template automatici invariati e senza Missione; scelta della Missione lasciata esplicitamente al Deck Builder.
- Card Pool con filtro Missioni e renderer basato sul layout Tattica.
- Percorsi illustrazioni deterministici e documentati in `docs/F9N4_MISSION_ASSET_PATHS.md`.
- Precheck esteso e test automatico `tests/f9n4_mission_contract_smoke.js`.

## Limiti intenzionali

In F9N4 le Missioni sono `data_only`: non sono ancora giocabili. Mano iniziale garantita, segretezza, protezione da furto/scarto, tracker, rivelazione e ricompense appartengono alle fasi F9N5 e successive.

## Fonte

Contenuti normalizzati da `NUOVE MISSIONI BASE — (Gioco Starter).docx`, senza modificare il documento originale.
