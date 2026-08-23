# Arena Rubra — F9V4a Strategic Tutorial Content & Faction Voice Pass

## Milestone

`C2-STABLE-1-F9V4a-APK-M4c`

Base richiesta: `C2-STABLE-1-F9V3c-APK-M4c` VALIDATA.

Riferimento remoto verificato prima della costruzione: GitHub `main` commit `69ed46e854215c9624cff0e585a33cd11466d557` (F9V3c). Il blob remoto di `src/tutorial_runtime.js` è `978e42245f4875dc21316889183593a94adab288` ed è identico al file F9V3c usato come base locale.

## Obiettivo

Avviare S2-C2 — Tutorial Content Pass con un intervento a rischio minimo: nessun nuovo step e nessuna modifica ai contratti interattivi già validati. I 116 step esistenti restano invariati; F9V4a sostituisce soltanto il copy di 27 messaggi selezionati tramite un overlay indicizzato per `scenarioId + stepId`.

## Contenuti strategici integrati

- Strutture come presidi legali dei PS.
- Strutture come nodi di sbarco e schieramento avanzato nello stesso turno, se ENE/carta/spazio lo consentono.
- Efficienza ATT–DEF–HP: l’ATT eccedente non oltrepassa la DEF e va evitato lo spreco di colpi pesanti sulla sola protezione residua.
- Fuoco concentrato di più unità per eliminare davvero un bersaglio invece di distribuire danni.
- Timing dell’assalto coordinando Depot ENE, tattiche e ricariche delle abilità.
- Conservazione del vantaggio scegliendo quali PS sostenere e proteggere.
- Ribaltamento dello svantaggio attaccando PS meno difesi e costringendo l’avversario a spostare la difesa.
- Rioccupazione del PS dopo la rimozione del presidio: eliminare l’unità non basta a produrre vantaggio territoriale.
- PS come motore della partita: economia ENE, Pressione e posizioni di schieramento generano decisioni interdipendenti.

## Voci di fazione

- Exordium: militaresco, audace, sprezzante verso l’esitazione Nexus e i contratti Fabeot.
- Nexus: neutro, analitico, quasi robotico; nessuna ostilità personale.
- Agathoi: cauto, sospettoso; diffidenza verso l’impulsività Liberti.
- Liberti: selvaggio, aggressivo; insofferenza verso Nexus e Fabeot.
- Fabeot: aristocratico, subdolo; superiorità implicita verso tutti.

La lore resta indiretta: nessun dialogo dichiara esplicitamente “odio” o “disprezzo”. Ogni frase di carattere deve anche insegnare o rinforzare una decisione tattica.

## Invarianti

F9V4a non modifica:

- numero, ordine o ID dei 116 step tutorial;
- `mode`, `completeOn`, `allowedTargets`, checkpoint o comandi `onEnter`;
- Action Contract F9V3b-1;
- Result Lock e UX F9V3c;
- setup delle cinque lezioni;
- Challenge I–V;
- carte, costi, deck, Starter, Missioni, ENE;
- AI, mappe, QG, Pressione;
- statistiche, storico o schema telemetrico;
- baseline logica `C2-STABLE-1-F9T2c4-APK-M4c`.

## Nota architetturale

Il pass è implementato come tabella dati di copy nel runtime tutorial e applicato solo al momento del rendering narrativo. La struttura congelata degli scenari non viene mutata. In un successivo content freeze il copy potrà essere consolidato nel catalogo dati definitivo senza alterare i contratti già validati.
