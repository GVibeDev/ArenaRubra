# F9O6 — Tutorial Runtime Foundation

## Baseline

- Build: `C2-STABLE-1-F9O6-APK-M4c`
- Baseline tecnica: `C2-STABLE-1-F9O5b-APK-M4c`
- Regole scenario predefinite: ritmo `competitive` (Rapida) e scala `tactical` (Tattica)

F9O6 costruisce il motore generico del tutorial. Le cinque lezioni complete appartengono a F9O7; questa build contiene il loro piano dati e una demo tecnica minima, ripetibile e deterministica.

## Funzioni implementate

- menu Tutorial separato dal Setup normale;
- scenari descritti tramite dati, non tramite una sequenza hardcoded nel renderer;
- setup deterministico di fazioni, comandanti, ENE, mani e deck;
- tre modalità di input: `informative`, `guided`, `locked`;
- spotlight con oscuramento e foro luminoso su UI, carta, miniatura, cella, PS e QG;
- aggiornamento continuo del foro durante ricostruzioni DOM, pan, zoom e resize;
- focus camera esplicito soltanto quando richiesto dal passo;
- vignette narrative con narratore, lato, espressione e set ritratto;
- completamento tramite Avanti, click, azione o evento strutturato del motore;
- messaggio correttivo per azioni non previste;
- checkpoint persistente in `arenaRubra.tutorial.v1`;
- pausa del bot durante lo scenario;
- esclusione delle partite tutorial dalle statistiche competitive;
- diagnostica e audit del contratto dati.

## Demo tecnica inclusa

La demo usa Exordium contro Nexus con sole due carte nella mano del giocatore:

- `EXC1F01` — Il Tribuno;
- `EX1B04` — Legionario Pesante.

Gli Starter sono disattivati. La demo verifica:

1. vignetta informativa;
2. spotlight sul QG corretto dalla F9O5b;
3. riduzione e riapertura dell'overlay Mano;
4. selezione semantica della carta Il Tribuno;
5. schieramento su una delle celle legali;
6. completamento del passo tramite evento `UNIT_SPAWNED`;
7. selezione della miniatura runtime;
8. spotlight guidato sul PS centrale;
9. checkpoint e completamento dello scenario.

## Piano delle cinque lezioni congelato

1. **Exordium — Carte, combattimento e tattiche.** Il Tribuno, Legionario Pesante, lettura carta, overlay Mano, schieramento, ATT/DEF, fine turno, abilità attiva, Missile EMP e nemici Nexus scriptati.
2. **Nexus — Starter, unità e rete di sbarco.** Tipi di unità, basi del deck, tre turni per il PS centrale, soluzione con Avanguardia oppure movimento + costruzione + sbarco avanzato.
3. **Agathoi — Difesa del PS.** Scelta 5 su 10, Struttura sul PS centrale, tre ondate incrementali, Spine, Contrattacco, fortificazione e sinergie strutturali. Prima Linea non viene attribuita artificialmente agli Agathoi.
4. **Liberti — Assalto coordinato.** Scelta 5 su 10, tre ondate contro difensori Agathoi, Sanguinamento, Superiorità Numerica e conquista del PS.
5. **Fabeot — Partita guidata conclusiva.** Deck ufficiale, Missione 1, Furtivo, Stordito, blocchi, spiegazione delle vittorie e conclusione per occupazione del QG.

## Ritratti narrativi

Il runtime registra già cinque set:

- `tutorial-exordium`;
- `tutorial-nexus`;
- `tutorial-agathoi`;
- `tutorial-liberti`;
- `tutorial-fabeot`.

Le espressioni previste sono `neutral`, `explain`, `approve`, `warning` e `stern`. La build LITE non contiene ancora le immagini definitive: usa placeholder di fazione. Gli asset reali potranno essere aggiunti al manifest senza modificare la logica del tutorial.

## Fuori ambito

F9O6 non contiene ancora:

- le cinque lezioni giocabili complete;
- scelta reale 5 su 10;
- sistema delle tre ondate;
- bot completamente scriptato;
- deck ordinati per ogni lezione;
- testi e ritratti definitivi;
- salvataggio di ogni singolo stato della battaglia.

Queste parti verranno costruite dopo la validazione del runtime, in F9O6a/F9O7.
