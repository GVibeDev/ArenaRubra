# Arena Rubra — F9W2c Global Theme Scope & Skin Architecture

## Baseline

- Baseline validata: `C2-STABLE-1-F9W2b-APK-M4c`
- Build candidata: `C2-STABLE-1-F9W2c-APK-M4c`
- Build name: `Global Theme Scope & Skin Architecture`
- Channel: `starter2-global-ui-theme-w2c`
- Logic baseline: `C2-STABLE-1-F9T2c4-APK-M4c`
- Data: 2026-08-24

La candidata è costruita sulla F9W2b validata. Il `src/ui.js` di partenza coincide con il blob presente su `main` alla baseline F9W2b (`2bc7dbcc62bd8ff7ba7ee17b22676c532a241e49`).

## Scopo

F9W2b aveva reso persistente la scelta fra i sei temi, ma il rendering era circoscritto a Home e Control Center. F9W2c trasforma quel sistema in un contratto UI globale senza ancora introdurre i materiali grafici definitivi.

Il tema globale selezionato in Impostazioni ora governa la shell di:

- Home / Control Center;
- Tutorial / Challenge fuori dal match;
- Nuova partita / Setup;
- Deck Builder;
- Card Pool;
- Card Editor;
- Map Editor;
- schermate placeholder e tabelle/modali appartenenti alla shell.

## Regola del tema durante la partita

F9W2c separa il tema globale dalla skin UI del match.

- Con zero o un solo giocatore umano, la UI della partita usa sempre la fazione del Giocatore 1.
- Con due o più giocatori umani, la UI segue la fazione del giocatore umano attivo.
- Durante un turno Bot, se il match contiene più umani, resta visibile l'ultima skin umana applicata: la UI non cambia inutilmente per i turni AI.
- Uscendo dalla partita, la shell ripristina automaticamente il tema globale persistito.

La presentazione della **mappa** non viene modificata: `presentation_theme.js`, map skin, sfondi mappa e musica di fazione mantengono il comportamento già validato. F9W2c agisce su pannelli, tabelle, controlli e shell UI.

## Contrasto e leggibilità

Vengono introdotti token separati per:

- testo primario;
- testo secondario;
- titoli;
- testo su accent;
- testo tabellare;
- testo tabellare attenuato;
- good / warning / danger.

Il testo su accent viene determinato tramite luminanza del colore. Gli slot grafici possono inoltre sovrascrivere i token di testo: questo permetterà a F9W2d, per esempio, di usare testo scuro su una superficie Agathoi chiara e testo chiaro sui materiali Nexus/Fabeot scuri.

Le celle delle tabelle ricevono un velo cromatico derivato dalla superficie del tema, così il contrasto non dipenderà dalla porzione della futura texture sottostante.

## Skin architecture preparata per F9W2d

F9W2c definisce slot grafici, ancora vuoti, per:

- texture/materiale di superficie;
- overlay/veil del materiale;
- blend mode;
- quattro corner ornaments;
- quattro segmenti di bordo;
- divisore;
- crest/fregio;
- opacità ornamentale.

Gli elementi principali della DOM vengono inoltre annotati semanticamente come `shell`, `panel`, `table` e `header`. L'obiettivo è permettere a F9W2d di ricomporre le parti modulari estratte dalle cinque cornici carta fornite dall'utente senza utilizzare le cornici complete e senza cambiare geometria/layout della UI.

## Invarianti

F9W2c non modifica:

- regole di gioco;
- ATT / DEF / HP;
- ENE / PS / Pressione;
- AI Base / Advanced / Expert;
- carte, deck, Missioni;
- mappe e geometrie;
- Snow Battlefield F9W2a1;
- Match Data F9W1a;
- separazione Player / DEV F9W2a;
- Tutorial Action Contract;
- asset grafici definitivi.

Nessuna delle 10 immagini fornite per il futuro material pass è incorporata in F9W2c: saranno consumate dalla candidata F9W2d.
