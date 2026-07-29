# F9O4c — Android Render Stability Hotfix

## Stato di ingresso

- Baseline validata: `C2-STABLE-1-F9O4a-APK-M4c`.
- `F9O4b` respinta al test APK per regressioni bloccanti.
- Nessuna modifica a gameplay, IA, carte, Missioni, privacy della mano o bilanciamento.

## Regressioni osservate su Android

- sparizione dei menu durante il caricamento;
- sparizione delle celle durante il caricamento;
- asset carta che scompaiono prima di completare il caricamento successivo, soprattutto nell’overlay delle mani durante partite bot contro bot;
- apertura dei menu inferiori capace di bloccare l’interfaccia.

## Diagnosi tecnica

### 1. Incompatibilità WebView riprodotta

F9O4b chiamava direttamente `board.replaceChildren(fragment)`. Disabilitando `Element.prototype.replaceChildren` nel browser di prova, il primo `renderBoard()` produceva:

`TypeError: board.replaceChildren is not a function`

Poiché `renderAll()` richiama prima la mappa e poi i pannelli, l’eccezione interrompeva anche il rendering dei menu.

### 2. Containment troppo aggressivo

F9O4b applicava `contain: layout style` al board e a ciascuna delle 127 celle assolute. La patch lo rimuove, mantenendo soltanto le ottimizzazioni compositive già validate in F9O4a.

### 3. Rendering carta sincrono e fallback nascosto troppo presto

F9O4b ridisegnava tutti i canvas mano in ogni ciclo e aggiungeva immediatamente `thumbRendered`. Inoltre una regola `:has(.mapHandThumbCanvas)` nascondeva il fallback alla sola presenza del canvas, prima che art e frame fossero disponibili.

### 4. Callback asset legate a nodi sostituiti

Se una art falliva dopo che il canvas era stato rimpiazzato da un nuovo render, il percorso di fallback poteva non produrre un ridisegno conclusivo visibile.

### 5. Apertura bottom sheet con lavoro concorrente

L’apertura dei pannelli poteva sovrapporre cambio classi, misure geometriche, fit camera, scroll e rendering simultaneo delle miniature.

## Soluzione implementata

- `boardRenderReplaceChildrenCompat()` con fallback `removeChild` + `appendChild`;
- validazione di struttura, numero figli e connessione nodi prima di riusare la cache;
- ricostruzione automatica se una cella viene persa;
- coda canvas persistente e deduplicata;
- budget di 1 canvas/frame su mobile, 3 su desktop;
- priorità all’overlay mappa e sospensione dei canvas del pannello Mano quando chiuso;
- fallback carta mantenuto durante lo stato `pending`;
- stato canvas `pending`/`ready` basato sul completamento o esaurimento degli asset;
- prosecuzione art preferita → fallback e segnale finale `settled-error`;
- guardia di generazione contro redraw asincroni obsoleti;
- firme dati per evitare ricostruzioni inutili di mano e overlay;
- apertura pannelli coalescente su doppio `requestAnimationFrame`;
- cancellazione delle aperture obsolete e fit camera solo dopo assestamento del layout.

## Gate

F9O4c resta candidata finché non supera il test APK sul dispositivo Android reale. La baseline ufficiale rimane F9O4a.
