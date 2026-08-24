# Arena Rubra — F9W2d Faction Material & Modular Ornament Pass

## Baseline

- Baseline validata: `C2-STABLE-1-F9W2c-APK-M4c`
- Build candidata: `C2-STABLE-1-F9W2d-APK-M4c`
- Build name: `Faction Material & Modular Ornament Pass`
- Channel: `starter2-ui-material-pass-w2d`
- Logic baseline: `C2-STABLE-1-F9T2c4-APK-M4c`
- Data: 2026-08-24

La candidata è costruita sulla F9W2c validata. Consuma finalmente i 10 asset forniti dall’utente:

- 5 texture/sfondi pagina di fazione;
- 5 cornici tattica di fazione.

## Scopo

F9W2c aveva introdotto il contratto globale del tema e l’architettura degli slot modulari, lasciandoli vuoti. F9W2d popola quegli slot con materiale reale.

Per ogni tema di fazione vengono ora applicati:

- **materialImage**: texture di superficie derivata dallo sfondo pagina;
- **materialOverlay** e **blend mode**: velo cromatico per mantenere leggibilità e coerenza;
- **4 corner ornaments**;
- **4 edge segments**;
- **divider**;
- **crest**.

Le cornici non vengono usate “interamente” come immagine completa sopra la UI: vengono **scomposte** e ricomposte in modo modulare sui contenitori della shell, in linea con il requisito utente.

## Ambito grafico

L’integrazione copre:

- Home / Main Menu;
- Tutorial / Challenge fuori dal match;
- Setup / Nuova partita;
- Deck Builder;
- Card Pool;
- Card Editor;
- Map Editor;
- Control Center;
- shell/pannelli della partita già temati da F9W2c.

La mappa e il board restano esclusi: `presentation_theme.js`, sfondi mappa, skin del campo e layer del board non vengono modificati.

## Leggibilità e contrasto

È stato mantenuto e usato il sistema F9W2c di token separati per:

- testo primario;
- testo secondario;
- titoli;
- testo su accent;
- testo tabellare;
- testo tabellare attenuato.

In F9W2d questi token vengono popolati per-theme quando necessario.

Casi principali:

- **Nexus / Exordium / Fabeot**: testo chiaro su materiali scuri;
- **Agathoi**: override su testo scuro e verde profondo, per non perdere leggibilità sulla texture chiara;
- **Liberti**: override su testo brunito/scuro per sfruttare bene il materiale caldo e chiaro.

Le tabelle mantengono un velo cromatico dedicato, così la leggibilità non dipende direttamente dalla trama sottostante.

## Regola del tema in partita

Resta invariato il contratto F9W2c:

- con zero/un solo umano la UI del match usa la fazione del **Giocatore 1**;
- con 2+ umani la UI segue il **giocatore umano attivo**;
- nei turni Bot, se ci sono più umani, resta l’ultima skin umana visibile;
- uscendo dalla partita torna il tema globale persistito.

## Asset packaging

Sono stati aggiunti asset dedicati in:

`assets/ui/faction_skins/<theme-key>/`

Per ciascuna delle 5 fazioni sono presenti:

- `material.webp`
- `corner_tl.webp`
- `corner_tr.webp`
- `corner_bl.webp`
- `corner_br.webp`
- `edge_top.webp`
- `edge_right.webp`
- `edge_bottom.webp`
- `edge_left.webp`
- `divider.webp`
- `crest.webp`

## Invarianti

F9W2d non modifica:

- regole di gioco;
- ATT / DEF / HP;
- ENE / PS / Pressione;
- AI Base / Advanced / Expert;
- mappe e geometrie;
- Snow Battlefield F9W2a1;
- Match Data F9W1a;
- Player / DEV F9W2a;
- tema runtime della mappa / board.
