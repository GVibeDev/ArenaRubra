# Arena Rubra – Fase B2a Event Layer minimale

## Obiettivo

Introdurre un canale eventi senza cambiare il gameplay.

## Nuovo file

- `src/events.js`

## Funzioni principali

- `emitGameEvent(event)`
- `logGameEvent(event)`
- `gameEventToLogText(event)`
- `lastGameEvents(limit)`
- `clearGameEvents()`

## Modifica a `src/main.js`

Il vecchio `log(msg)` è diventato un wrapper:

1. costruisce un evento `LOG_MESSAGE`;
2. lo salva in `state.events`;
3. lo passa al vecchio rendering DOM tramite `appendLogLine(msg)`.

## Perché è prudente

La UI visibile resta identica.
Le funzioni di gioco continuano a chiamare `log(...)`.
Ma ora ogni log ha anche una forma strutturata, utile per:

- replay;
- debug;
- test;
- futura UI separata;
- multiplayer;
- motore headless.

## Prossimo step possibile

B2b: convertire gradualmente alcuni log importanti in eventi specifici:

- `GAME_STARTED`
- `UNIT_SPAWNED`
- `UNIT_MOVED`
- `UNIT_ATTACKED`
- `UNIT_DESTROYED`
- `VICTORY`

Senza convertire tutto insieme.
