# Arena Rubra — F9U3 Automated Test Report

Build candidata: `C2-STABLE-1-F9U3-APK-M4c`  
Baseline logica: `C2-STABLE-1-F9U2b-APK-M4c`  
Schema telemetrico: `F9Q3e1-2`  
Data: 29 luglio 2026

## Esito sintetico

- Controllo sintattico JavaScript: **86/86 file superati**.
- Smoke test dedicato F9U3: **61/61 verifiche superate**.
- Suite regressione Node: **77/77 test superati**.
- Browser smoke F9U3 desktop e mobile: **SUPERATO**.
- Regressione browser F9U2a — Card Pool: **SUPERATA**.
- Regressione browser F9U2b — Editor layout: **SUPERATA**.

## Valori verificati

- Aree Control Center: **5** — Gioca, Carte e deck, Mappe, Analisi, Sistema.
- Deck ufficiali: **50**.
- Mappe ufficiali: **9**.
- Schema telemetrico visualizzato: **F9Q3e1-2**.
- Errori diagnostici bloccanti nel browser harness: **0**.
- Baseline logica invariata: **C2-STABLE-1-F9U2b-APK-M4c**.

## Browser e layout

- Desktop verificato a **1440×1000 px**.
- Mobile verificato a **390×844 px**.
- Overflow orizzontale del menu: **0 px**.
- Pannello mobile: **378×832 px**, contenuto nel viewport con margine di 6 px.
- Tabelle larghe: scorrimento interno confermato senza allargare la pagina.

## Flussi verificati

- Apertura di Versione, Archivio mappe, Statistiche, Cronologia, Telemetria, Log, Impostazioni, Debug e Import/Export.
- Selezione di una mappa ufficiale e inoltro al Setup.
- Modalità sviluppatore disattivabile e riattivabile; voce Debug nascosta/mostrata correttamente.
- Snapshot diagnostico coerente con precheck, storage e contatori runtime.
- Pulsante Riprendi conserva struttura grafica e resta disabilitato senza sessione.

## Note ambientali

Nel browser harness isolato IndexedDB non è consentito: il runtime passa correttamente al backend in memoria e registra la condizione come **avviso**, non come errore. La navigazione HTTP diretta su localhost è bloccata dall'ambiente di esecuzione; i test Playwright equivalenti su DOM e script applicativi sono stati completati con successo.

## Validazione ancora manuale

La candidata resta da verificare su browser reale e APK Android, soprattutto per persistenza IndexedDB, pulsante Back, touch, viewport, copia/download e import/ripristino del vault reale. Nessuna validazione automatica sostituisce il collaudo sul dispositivo.

## Garanzia di ambito

F9U3 interviene sul Centro di controllo e sui relativi pannelli. Non modifica regole, carte, 50 deck ufficiali, mappe, IA, targeting, Missioni, Pressione, bilanciamento o schema telemetrico.
