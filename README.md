# Arena Rubra — C2-STABLE-1-F9O2e-APK-M4c

## Mission Accessibility & Build Flow Reliability

Baseline logica: **F9O2d — Token Layering & Active Unit Cues**.

F9O2e è una patch di affidabilità e accessibilità che non modifica ricompense, targeting, danni o identità delle fazioni.

### Correzioni

- Il cap Starter in modalità Tattica conta soltanto unità realmente presenti sul campo. Una struttura distrutta, rimossa o con HP 0 libera immediatamente lo slot.
- Le strutture giocate dalla mano possono essere costruite tramite un costruttore attivo oppure direttamente sulla casella del proprio QG libero.
- Il fix è generale e comprende la **Caserma Fanteria Exordium**.

### Missioni

- Profilo di bilanciamento: `F9O2e-starter-accessibility-v1`.
- Le soglie delle 10 Missioni ordinarie sono ridotte per renderne realistico il completamento durante una normale partita Starter.
- Alcune condizioni numeriche delle 5 Missioni disperate sono ridotte, mantenendo invariata la logica ×1–×3.
- Ricompense, protezione della carta, recupero e secondo ciclo restano invariati.
- Cliccando la carta Missione, se pronta, compare subito la conferma di gioco.
- I tre progressi Missione sono sempre visibili nel dock **Azioni** sotto ENE e tattiche.

### Compatibilità ereditata

- camera F9O2c congelata durante i turni bot;
- click di sbarco, pan, wheel e pinch;
- layering token e indicatore unità attiva F9O2d;
- Missioni, IA, deck built-in, temi e audio delle build precedenti.

Questa è una build **LITE**: gli asset binari restano nel deploy completo.


## Camera Autonomy & Inspection Contract

Baseline validata: **F9O2a**.

F9O2c mantiene la camera F9O2a e congela il contratto di autonomia/ispezione, senza modificare gameplay, IA o bilanciamento:

- trascinamento con mouse e touch;
- zoom continuo con rotellina;
- pinch-to-zoom con due dita;
- mantenimento del punto sotto cursore o dita durante lo zoom;
- soglia fra tap/click e trascinamento, con soppressione del click dopo un pan;
- limiti di spostamento e zoom;
- pulsanti `−`, `Centra`, `Fit`, `+`;
- conservazione della camera manuale durante render e turni bot;
- reset a ogni nuova partita;
- API dedicate al futuro tutorial: `cameraFocusHex`, `cameraFocusUnit`, `cameraFocusHQ`, `cameraFitCoords`, `cameraFitDeploymentTargets`, `cameraSetZoom`, `cameraResetView`, `cameraLockInput`;
- diagnostica `cameraDiagnostics()` e `cameraGetState()`.

La build conserva inoltre temi fazione, mappe, musica dinamica e controlli audio persistenti della baseline F9O1b.

Questa è una build **LITE**: gli asset binari restano nel deploy completo.


## F9O2c — Camera Autonomy & Inspection Contract
- Nessun cambio automatico della camera durante azioni bot, render o selezioni del giocatore.
- Click su unità durante il turno bot apre una ispezione UI separata e azioni disabilitate, senza modificare selectedId/mode/pending dell’IA.
- Unica eccezione automatica: selezionando una carta unità, la mano si chiude e la camera inquadra tutte le celle legali di sbarco.
- Focus, Fit, pan e zoom manuali restano sempre sotto controllo del giocatore.


## F9O2c — Bot Camera Freeze Hotfix

I render ripetuti prodotti da movimenti, attacchi e abilità dei bot non ricalcolano più fitScale, zoom o pan. La camera cambia soltanto tramite input/comandi espliciti del giocatore, resize/orientamento reale o fit delle celle legali di sbarco.


## F9O2d — Token Layering & Active Unit Cues

- separa la base colorata di fazione dall’asset grafico;
- con Token ON e asset caricato, la base resta trasparente anche prima che l’unità agisca;
- dopo l’azione viene attenuato soltanto l’asset grafico, non statistiche o indicatori;
- l’unità selezionata/ispezionata mostra alone pulsante nel colore di fazione e freccia superiore;
- con `prefers-reduced-motion` gli indicatori restano statici;
- tutti i marker usano `pointer-events:none`, quindi non interferiscono con click, touch, pan o pinch.
