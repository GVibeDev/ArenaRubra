# Arena Rubra — C2-STABLE-1-F9O4d-APK-M4c

## Cross-platform Render Signature Integrity Hotfix

F9O4d usa F9O4c come baseline tecnica e ne conserva renderer DOM incrementale, camera composita, fallback WebView e code thumbnail limitate. Corregge una regressione condivisa da Android, browser ed EXE Windows: le firme della mano e del pannello carte non includevano lo stato completo delle Missioni e potevano lasciare visibili contatori o comandi superati.

### Correzioni F9O4d

- Firma Missione deterministica con obiettivi, valori correnti/target, serie, soddisfazione e completamento.
- Inclusi stato `ready`, `readyCount`, ciclo, blocco recupero, carta bloccata e Missione giocata/rivelata.
- Inclusi conferma di gioco/rivelazione e revisione UI.
- Incluse scelte di ricompensa pendenti e selezioni effettuate.
- Invalidazione esplicita delle firme sugli eventi Missione, recupero deck, blocco e sblocco carta.
- Mano rapida, badge Missione, dashboard Mano e dock Azioni si riallineano nello stesso `renderAll()`.
- Il markup Missione usa un controllo di giocabilità in modalità render puro: non rivaluta o altera contatori durante la costruzione del DOM; il controllo definitivo resta al click e alla conferma.
- Nessuna modifica a gameplay, Missioni, soglie, ricompense, IA, camera o asset.

## Cronologia F9O4c

## Android Render Stability Hotfix

Baseline validata conservata: **F9O4a — Android Camera Performance Hotfix**.

**F9O4b non è una baseline valida.** Il test APK ha rilevato sparizione di menu e celle, asset carta incompleti durante i caricamenti e blocchi frequenti all’apertura dei bottom menu. F9O4c è una micro-patch correttiva: conserva l’obiettivo del renderer incrementale, ma rimuove i punti incompatibili o troppo aggressivi emersi sulla WebView Android del dispositivo di stress test.

### Correzioni F9O4c

- fallback DOM quando `Element.replaceChildren()` non è disponibile;
- autoripristino delle 127 celle se il board o la cache DOM risultano incompleti;
- rimozione del `contain: layout style` introdotto da F9O4b sul board e sulle singole celle;
- miniature delle mani distribuite su più frame: massimo 1 canvas per frame su mobile e 3 su desktop;
- coda miniature persistente, non cancellata da ogni nuovo `renderAll()`;
- fallback testuale della carta visibile finché gli asset del canvas non sono caricati o definitivamente esauriti;
- prosecuzione automatica fra art preferita e fallback anche se il vecchio canvas è stato sostituito;
- callback asincrone protette da una generazione del canvas, così un asset vecchio non ridisegna una carta nuova;
- markup di mano e overlay ricostruito solo quando cambia la relativa firma dati;
- apertura e chiusura dei menu mobile accorpate: una sola misura geometrica e un solo fit dopo che il bottom sheet si è stabilizzato;
- nessuno scorrimento animato durante l’apertura dei pannelli.

La camera mantiene tutte le ottimizzazioni validate di F9O4a: `requestAnimationFrame`, geometria in cache, transform composito ed effetti ridotti durante pan e pinch.

### Diagnostica

```js
boardRenderDiagnostics()
```

Campi principali:

- `fullBuilds`: ricostruzioni complete dello scheletro;
- `renders`: render della mappa richiesti;
- `patchedCells`: celle realmente riscritte nell’ultimo render;
- `patchedTokens`: token realmente aggiornati nell’ultimo render;
- `reusedTokens`: token esistenti riutilizzati;
- `skeletonRepairs`: autoripristini del board.

### Test APK prioritari

1. Avvio e caricamento: menu e 127 celle non devono sparire.
2. Pan e zoom: nessuna regressione rispetto a F9O4a.
3. Aprire e chiudere ripetutamente Mano, Azioni, Log e Opzioni.
4. Partita bot contro bot: osservare la mano in overlay durante pescate e giocate rapide.
5. Le miniature possono mostrare temporaneamente il fallback testuale, ma non devono diventare vuote.
6. Movimento, attacco, cura, DEF, stati, sbarco e distruzione devono aggiornarsi senza token fantasma.
7. Partita affollata e almeno 15 round.

Build **LITE**: gli asset binari devono essere reinseriti dal deploy FULL tramite il manifest e i fallback esistenti.
