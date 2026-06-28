# F9A – Application Shell / Main Menu Foundation

## Obiettivo

Avviare la Fase 9 / Application Foundation senza toccare la logica congelata dello Starter Game.

La patch introduce il primo telaio applicativo:

- fonte unica `BUILD_INFO`;
- AppShell minimale;
- menu principale;
- placeholder per schermate future;
- avvio partita da menu invece che auto-start tecnico.

## File principali

- `src/build_info.js`
- `src/app.js`
- `index.html`
- `css/style.css`
- `src/ui.js`
- `src/game.js`
- `src/stats.js`

## BUILD_INFO

`BUILD_INFO` contiene:

- `appName`
- `stage`
- `version`
- `buildName`
- `buildDate`
- `buildChannel`
- `logicBaseline`
- `map`
- `notes`

Questa fonte alimenta:

- titolo pagina;
- menu principale;
- top bar;
- log di avvio partita;
- export log;
- fallback versione `CONFIG.version`.

## AppShell

Aggiunto stato schermata:

- `mainMenu`
- `game`
- `deckBuilder`
- `cardEditor`
- `cardPool`
- `stats`
- `options`
- `about`

Per F9A solo `mainMenu` e `game` sono schermate reali. Le altre sono placeholder.

## Avvio partita

La vecchia `bootArenaRubra()` non chiama più direttamente `newGame()`.

Ora:

1. inizializza select/handler;
2. inizializza AppShell;
3. mostra menu principale;
4. `Nuova partita` chiama `newGame()`.

## Freeze rispettato

Nessun cambiamento a gameplay, AI, deck, tattiche, mappa, roster, costi, HP/DEF/ATT o regola danno.

