# F9Q3d4 — Elimination, Assist & Pressure Attribution

Versione candidata: `C2-STABLE-1-F9Q3d4-APK-M4c`  
Baseline validata: `C2-STABLE-1-F9Q3d3-APK-M4c`

## Obiettivo

Completare l’hardening FFA rendendo deterministica e verificabile l’attribuzione di danni, eliminazioni, assist ed avanzamenti della Pressione nelle partite da 2 a 4 giocatori.

## Provenienza del danno

- Aggiunto `src/ffa_attribution.js` come registro centrale della provenienza del danno.
- Ogni contributo conserva giocatore sorgente, bersaglio, quantità sottratta a HP e DEF, sorgente testuale, tipo di danno, round e sequenza evento.
- Il registro distingue danno diretto, persistente, pericolo/mina, reazione/Spine, indiretto, autodanno e causa non attribuita.
- Mine possedute, Sanguinamento, Spine, abilità e tattiche mantengono la sorgente corretta fino alla distruzione del bersaglio.
- Le autodistruzioni e i pericoli neutrali non assegnano una kill arbitraria.

## Eliminazioni unità e assist

- La kill viene assegnata alla fonte ostile che causa l’ultimo danno letale.
- Gli altri giocatori ostili che hanno contribuito al danno entro gli ultimi 2 round ricevono assist.
- I contributi scaduti non generano assist.
- L’evento `UNIT_DESTROYED` include ora `killerSide`, `assistSides`, `attributionType`, `damageKind` e il riepilogo dei contributi.
- Il campo storico `destroyedBySide` è conservato per compatibilità con Missioni, log e moduli precedenti.

## Eliminazioni giocatore

- L’eliminazione di un giocatore conserva responsabile, assist, motivo, round e tipo di attribuzione.
- La conquista del QG viene classificata come `qg_capture`.
- Gli assist all’eliminazione del giocatore derivano da ostilità recenti contro la vittima entro una finestra di 3 round.
- Concessione, resa tecnica e abbandono non assegnano il merito ad un avversario scelto implicitamente.
- Il record centralizzato del ciclo vita esporta anche `eliminationAssistSides` ed `eliminationAttributionType`.

## Pressione FFA

- Aggiunto l’evento tipizzato `PRESSURE_EVALUATED`.
- Ogni valutazione registra giocatori attivi, eliminati, qualificati, giocatore avanzante, pareggio, soglia PS, PS centrale e classifica del round.
- I giocatori eliminati restano nello storico ma non partecipano più alla valutazione attiva.
- `PRESSURE_CHANGED` collega l’incremento alla valutazione che lo ha prodotto.
- Pareggi e mancate qualificazioni sono distinguibili dagli avanzamenti effettivi.

## Statistiche ed export

Le statistiche runtime registrano ora:

- danni inflitti;
- eliminazioni unità;
- assist unità;
- eliminazioni giocatore;
- assist alle eliminazioni giocatore;
- volte eliminate;
- incrementi di Pressione;
- qualificazioni alla Pressione;
- incrementi negati da pareggio;
- timeline delle eliminazioni e della Pressione;
- snapshot completo dell’attribuzione nel risultato e nella cronologia partita.

## Compatibilità

- Nessuna modifica ai valori di danno, alle formule della Pressione o alle condizioni di vittoria.
- Nessuna modifica a carte, deck, Missioni, mappe o asset.
- Conservate le fondazioni FFA validate in F9Q3d1–F9Q3d3.
- F9Q3d4 resta candidata finché non viene validata con collaudo manuale.
