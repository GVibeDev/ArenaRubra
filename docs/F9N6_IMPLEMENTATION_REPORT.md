# C2-STABLE-1-F9N6-APK-M4c

## Mission Progress Tracker

F9N6 introduce `src/missions.js`, tracker data-driven delle 15 Missioni ufficiali.

### Architettura

Il tracker riceve esclusivamente eventi strutturati e checkpoint espliciti. Non analizza il testo del log. Ogni giocatore possiede un runtime separato con ciclo, contatori, serie consecutive, stato degli obiettivi e diagnostica.

### Eventi aggiunti

- `UNIT_CONVERTED`
- `CARD_DRAWN`
- `CARD_PLAYED`
- `MISSION_PROGRESS_CHANGED`
- `MISSION_READY`
- `MISSION_CHECKPOINT`

Gli eventi di danno e distruzione sono stati arricchiti con lato sorgente, tipo di danno, tipo/peso/ruolo dell'unità e lato responsabile. Questo permette di distinguere correttamente Sanguinamento, Spine, strutture, veicoli pesanti, Comandanti e Pivot.

### Regole interpretative

- Missione facoltativa; runtime `absent` se non presente.
- Tutte le durate consecutive si azzerano quando la condizione viene interrotta.
- Soglie `gte/lte` seguono la specifica normalizzata.
- Le condizioni ordinarie completate restano registrate nel ciclo.
- Le Missioni disperate risultano pronte da almeno una condizione; il conteggio indica il futuro moltiplicatore ×1–×3.
- `missionResetCycle(side)` azzera integralmente i progressi e incrementa il ciclo, ma il collegamento al recupero deck resta rinviato a F9N10.

### Esclusioni deliberate

Nessuna UI privata definitiva, nessuna rivelazione, nessun gioco della carta, nessuna ricompensa e nessuna logica IA Missioni.

### Test

- 59 file JavaScript: sintassi valida.
- regressioni precedenti: tutte superate.
- F9N6 tracker: 92/92 controlli.
- riferimenti HTML/CSS/JS: nessun file mancante.
