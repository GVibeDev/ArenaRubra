# Arena Rubra — F9Q3b Changelog

Build candidata: `C2-STABLE-1-F9Q3b-APK-M4c`  
Baseline validata: `C2-STABLE-1-F9Q3a-APK-M4c`

## 1. Pressione Strategica sulle mappe avanzate

- MAP1 Starter conserva integralmente i tempi precedenti:
  - Rapida / Competitive: dal round 20;
  - Standard: dal round 30.
- Tutte le mappe diverse da `map1_starter` usano:
  - Rapida / Competitive: dal round 25;
  - Standard: dal round 35.
- Nelle mappe con più di 3 PS totali, la Pressione non avanza più per semplice primato relativo:
  - serve controllare almeno il 70% dei PS totali;
  - la soglia viene arrotondata per eccesso;
  - 4 PS → 3 richiesti;
  - 5 PS → 4 richiesti;
  - 7 PS → 5 richiesti.
- Con 3 PS o meno resta la regola storica: avanza il leader unico; in parità nessuno avanza.
- Log ed evento `PRESSURE_CHANGED` espongono tipo di regola, PS totali e soglia richiesta.
- L'HUD mostra la regola effettiva della mappa attiva.

## 2. Leggibilità dei terreni

Ogni cella con terreno speciale riceve un badge persistente, visibile anche quando occupata:

- Ostacolo: `×`;
- Difficile: `2`, cioè costo di ingresso 2 MOV;
- Difensivo/coperto: `+D`;
- Scoperto: `−D`.

Restano anche pattern, colori e tooltip già presenti. Nessuna regola terreno è stata modificata.

## 3. Visibilità token e celle occupate

- Alpha dello sfondo fazione sotto i token grafici aumentato da `.22` a `.28`.
- Le celle occupate ricevono una tinta e un anello leggero del colore della fazione.
- L'effetto è attenuato durante targeting e selezione per non coprire gli indicatori d'azione.

## 4. Bandiera sui PS conquistati

Un PS controllato mostra una bandierina nel colore della fazione del proprietario runtime:

- Nexus: blu;
- Exordium: rosso scuro;
- Liberti: ocra/giallo;
- Agathoi: verde;
- Fabeot: viola scuro.

Il PS neutrale o bloccato non mostra una bandiera. La bandiera non modifica controllo, income o targeting.

## 5. File modificati

- `src/constants.js`
- `src/board.js`
- `src/rules.js`
- `src/render.js`
- `css/style.css`
- `src/build_info.js`
- `index.html`
- `README.md`
- `tests/f9q3a_main_menu_smoke.js`
- `tests/f9q3b_pressure_battlefield_readability_smoke.js` — nuovo

## 6. Fuori ambito conservato

Non sono stati modificati:

- targeting FFA;
- semantica Missioni multigiocatore;
- IA avanzata F9Q4;
- background custom dell'editor mappe;
- tutorial e camera tutorial;
- statistiche, carte, deck, unità o costi;
- Local Data Vault e menu validati in F9Q3a.
