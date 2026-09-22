# F9T2a — Android Touch & Render Baseline

Build candidata: `C2-STABLE-1-F9T2a-APK-M4c`  
Sorgente funzionale: candidata F9T2  
Baseline logica validata: `C2-STABLE-1-F9T1-APK-M4c`

## Decisione architetturale

Non è giustificato convertire l'intera applicazione in Canvas.

La direzione raccomandata è ibrida:

- DOM per menu, pannelli, moduli, testi, pulsanti, accessibilità e strumenti degli editor;
- SVG del Map Editor mantenuto finché il rendering incrementale rispetta i budget su APK reale;
- Canvas 2D valutato per i soli layer grafici della mappa di gioco che risultassero ancora costosi dopo dirty rendering, cache limitate e lifecycle delle schermate;
- hit target, selezione, HUD e controlli sempre separati dal layer pittorico.

Un Canvas totale sposterebbe nel codice hit testing, focus, accessibilità, layout del testo, strumenti editor e gestione della densità. Inoltre un backing store ad alto DPR può consumare più memoria del DOM che dovrebbe sostituire.

## Diagnosi del codice F9T2

### Touch

- La camera di gioco possedeva già Pointer Events, pinch/pan e applicazione coalescente su `requestAnimationFrame`.
- I controlli standard basati su `click` sono attivabili dal touch del browser, ma non esisteva un contratto unico verificato per tutte le superfici.
- Il Map Editor era il guasto concreto: l'avvio del pan sopra una cella veniva bloccato, tap e trascinamento non erano separati in modo robusto, mancavano gestione completa di `pointercancel` e `lostpointercapture`, e l'aggiunta nello spazio vuoto dipendeva dal doppio click.
- I listener delle celle venivano legati ai nodi generati, moltiplicando lavoro e rischio di divergenze a ogni ricostruzione.

### Rendering e camera

- Il renderer della partita conserva già uno skeleton DOM e patcha celle e token, ma `renderAll()` richiama sempre tutte le aree e `renderBoard()` attraversa comunque l'intera mappa, costruendo indici, mappe e set temporanei.
- La camera di gioco applica trasformazioni coalescenti; il costo residuo su WebView può quindi provenire dal compositing di centinaia di nodi, dai layer grafici e dalle invalidazioni indotte da altri renderer.
- Il Map Editor ricostruiva l'intero SVG anche per variazioni della vista. Con 575 celle questo significa rigenerare markup, classi e geometria per un'operazione che richiede un solo `transform`.

### Miniature e memoria

- Il Card Pool creava un canvas per ogni carta filtrata e li renderizzava tutti immediatamente.
- Le tre anteprime di Deck Builder, Card Editor e Card Pool partivano da `1024×1536`, anche fuori schermata.
- Il bootstrap token caricava in anticipo tutti i 35 asset registrati.
- La cache immagini delle carte non aveva un limite. La cache bitmap delle miniature aveva limite 40 anche sui dispositivi mobili.
- Questi costi spiegano perché il peso compresso degli asset non corrisponde alla memoria reale: dopo la decodifica contano pixel, backing store Canvas, copie nelle cache e texture del compositor.

### Layout mobile

- Nel Map Editor, pannelli e barre precedevano la mappa e sottraevano gran parte del primo viewport.
- Il CSS mobile conserva numerosi strati storici `mobile-apk-m1`…`m4` e media query sovrapposte. Funziona, ma aumenta il rischio di cascade contraddittoria, controlli sovradimensionati e overlay che coprono il campo.

## Correzioni F9T2a

### Map Editor

- Registro Pointer limitato alla sessione.
- Soglia tap/drag di 8 px.
- Pan avviabile anche sopra una cella.
- Pinch ancorato al punto medio e wheel zoom ancorato al cursore.
- Gestione `pointercancel` e `lostpointercapture`.
- Soppressione del click generato dopo pan o pinch.
- Tap sullo spazio vuoto per `Cella / Aggiungi`.
- Event delegation per click, tastiera e hover delle celle.
- Durante pan, pinch e wheel viene aggiornato soltanto il `transform` di `#mapEditorWorld`, una volta per frame.
- Layout compatto map-first.

### Canvas e miniature

- I canvas delle schermate inattive iniziano e tornano a `1×1`.
- Uscendo dal Card Pool vengono scollegati observer, rimossi i canvas galleria e rilasciato il backing store dell'anteprima.
- La galleria usa `IntersectionObserver` con una finestra di 320 px: renderizza soltanto le miniature vicine al viewport e rilascia quelle lontane.
- In assenza di `IntersectionObserver`, il fallback è limitato alle prime 12 miniature.

### Cache asset

- Nessun preload globale dei 35 asset token al bootstrap.
- I candidati token sono richiesti su domanda e in sequenza.
- Cache immagini carta: massimo 32 immagini decodificate; i fallimenti restano metadati leggeri per non ripetere richieste impossibili.
- Cache bitmap miniature: 40 desktop, 18 su coarse pointer/mobile.

### Diagnostica

Lo schema volatile `F9T2a-1` registra:

- durata di `renderAll`, `renderBoard`, render completi e frame vista del Map Editor;
- long task, quando esposti dal browser;
- numero e backing store stimato dei canvas;
- immagini DOM e stima dei pixel decodificati;
- heap JavaScript, quando disponibile;
- cache miniature, immagini carta e token;
- contatori DOM e diagnostica del renderer mappa.

La diagnostica ha ring buffer limitati e non scrive in `localStorage` o IndexedDB.

## Colli di bottiglia rimasti

1. `renderAll()` non possiede ancora invalidazione per dominio.
2. `renderBoard()` percorre tutte le celle anche quando cambia una sola entità.
3. Il DOM della mappa di gioco non usa ancora culling per viewport.
4. La cache token su domanda non possiede ancora eviction per cambio partita/fazione.
5. I CSS mobile storici devono essere consolidati.
6. Back Android, selettori file, tastiera virtuale e lifecycle WebView richiedono APK fisico.

## Roadmap tecnica

### F9T2b — Touch Contract & Mobile Density

Priorità P0:

- matrice automatica tap/pan/pinch per tutte le schermate;
- Back Android e chiusura ordinata di modal, drawer e editor;
- file picker e import immagini su WebView;
- safe area, tastiera virtuale e rotazione;
- profilo UI compatto: mappa dominante, controlli secondari in drawer, nessun overlay permanente sopra il campo.

Rischio: ridurre troppo i target touch. La densità deve diminuire tramite gerarchia e drawer, non rendendo i pulsanti essenziali difficili da toccare.

### F9T2c — Dirty Rendering & Asset Lifecycle

Priorità P0/P1:

- sostituire `renderAll()` con dirty flag per board, mano, pannelli, telemetria e HUD;
- patchare soltanto celle e unità cambiate;
- cache geometria/occupazione valida per revisione di stato;
- rilascio asset token non appartenenti alla partita corrente;
- sospensione completa dei renderer delle schermate non attive;
- benchmark P50/P95 e picco heap per scenario.

Rischio: stato UI non aggiornato. Ogni dominio dovrà avere fallback `force full render` e test di equivalenza.

### F9T2d — Hybrid Game Map Renderer

Da attivare soltanto se F9T2c non soddisfa i budget su dispositivo:

- Canvas 2D per sfondo, griglia, terreno e controllo PS;
- layer separato per token/effects oppure DOM limitato ai soli elementi interattivi;
- hit map deterministica basata su coordinate esagonali, non su lettura pixel;
- renderer DOM corrente mantenuto dietro feature flag per confronto A/B.

Rischi: regressioni di selezione/targeting, testo sfocato, backing store eccessivo su DPR alto, differenze tra WebView.

### F9T2e — APK Device Qualification

- telefono vecchio reale e telefono medio;
- mappe 7–9 PS, partite lunghe, Card Pool e tutti gli editor;
- rotazione, background/foreground e pressione memoria;
- confronto snapshot `F9T2a-1`;
- gate proposto: nessun blocco >100 ms durante pan, P95 frame sotto 33 ms nel profilo compatibilità, nessuna crescita continua di heap/canvas dopo ripetuti cambi schermata.

## Criterio di disciplina

Canvas 2D entra soltanto dove una misura su APK dimostra che DOM/SVG incrementale non raggiunge il budget. La prima ottimizzazione resta eliminare lavoro, cache e nodi non necessari; cambiare tecnologia senza ridurre il lavoro sposterebbe soltanto il problema.
