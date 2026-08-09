# Arena Rubra — F9T2 Exordium Expert · Bastion Relay Doctrine

**Build candidata:** `C2-STABLE-1-F9T2-APK-M4c`  
**Baseline validata:** `C2-STABLE-1-F9T1-APK-M4c`  
**Schema telemetrico principale:** `F9Q3e1-2`  
**Contratto Expert base:** `F9T1-1`  
**Estensione dottrinale:** `F9T2-1`  
**Modulo attivo:** `expert-exordium-f9t2`

## 1. Obiettivo

F9T2 introduce la prima dottrina Expert reale senza ampliare indiscriminatamente il motore. La modifica riguarda esclusivamente Exordium e implementa la differenza più solida emersa dalla telemetria: la capacità di trasformare un PS conquistato in un nodo logistico, sostituendo una guarnigione mobile con un Bastione Armato e liberando una unità per continuare l’avanzata.

La dottrina non è una nuova IA generale. È un micro-piano dichiarativo e finito sopra l’Advanced F9T0.

## 2. Confine di fazione

Il router F9T1 conserva la regola monofazione:

- Exordium esegue `expert-exordium-f9t2`;
- Nexus esegue il modulo F9T1 vuoto e ricade su Advanced F9T0;
- Liberti esegue il modulo F9T1 vuoto e ricade su Advanced F9T0;
- Agathoi esegue il modulo F9T1 vuoto e ricade su Advanced F9T0;
- Fabeot esegue il modulo F9T1 vuoto e ricade su Advanced F9T0.

Nessun modulo viene eseguito per confrontare le decisioni di più fazioni.

## 3. Condizioni di selezione

Il piano `EXORDIUM_BASTION_RELAY` può essere selezionato soltanto quando esistono tutte le condizioni seguenti:

1. modalità IA `expert`;
2. fazione attiva Exordium;
3. rischio di occupazione QG non classificato `direct` o `occupied`;
4. almeno un PS già controllato da Exordium, vuoto e privo di struttura;
5. un builder Exordium attivo capace di costruire sul PS;
6. disponibilità legale del blueprint `EX4B02` — Bastione Armato — da mano o roster;
7. ENE sufficiente e carta non bloccata;
8. una unità mobile attiva entro distanza 2 dal PS;
9. almeno una destinazione legale che riduca la distanza dal successivo PS non controllato o, in assenza di PS, dal QG nemico;
10. nessun nemico adiacente alla unità mobile candidata al momento della pianificazione.

I builder validi vengono ordinati privilegiando quello di minor valore operativo. Per ciascun PS viene prodotto al massimo un candidato. Il tetto generale resta 64 candidati.

## 4. Micro-piano

Il piano è piatto e contiene due passaggi.

### Passaggio 1 — `fortify_ps_with_bastion`

- riserva l’ENE necessaria;
- forza la scelta del Bastione Armato nel roster;
- usa il builder dichiarato;
- costruisce sulla cella del PS;
- registra il Bastione come nodo logistico;
- libera la riserva ENE dopo il successo.

### Passaggio 2 — `release_mobile_guard`

- attribuisce priorità alla unità mobile dichiarata;
- esegue il movimento pianificato prima di azioni stazionarie marginali;
- accetta soltanto celle che riducono la distanza dall’obiettivo di almeno una cella;
- penalizza destinazioni esposte a nemici in R1/R2;
- completa il piano dopo il movimento effettivo.

Le vittorie immediate sul QG, le emergenze strategiche e la conquista dell’unico PS necessario restano prioritarie nel flusso generale del bot.

## 5. Riserva operativa

Finché il Bastione non viene costruito, `reservedEnergy` protegge la spesa necessaria. Le tattiche di mano e le tattiche Starter non possono consumare ENE che renderebbe impossibile il passaggio pianificato.

La riserva non assegna ENE extra e non modifica i costi. Dopo la costruzione viene azzerata.

## 6. Abort e fallback

Il piano viene abbandonato con telemetria esplicita quando:

- builder o cella non sono più disponibili;
- l’ENE riservata non è più sufficiente;
- la struttura non può essere costruita;
- l’attore mobile non è più utilizzabile;
- non esiste più un movimento che avanza verso l’obiettivo;
- il turno termina prima del completamento.

Dopo l’abbandono il turno continua con il fallback `advanced_f9t0`. Non viene creato un sottopiano e non parte alcuna ricerca alternativa ricorsiva.

## 7. Telemetria F9T2

La telemetria Expert conserva `F9T1-1` e aggiunge `doctrineSchemaVersion: F9T2-1`.

Nuovi indicatori per modulo:

- `bastionRelayPlans`;
- `microplanSteps`;
- `bastionsBuiltOnPs`;
- `mobileGuardsReleased`.

Per ogni piano vengono inoltre registrati:

- PS e cella bersaglio;
- attore principale e builder;
- ENE richiesta e riservata;
- passaggi completati;
- distanza prima/dopo il rilascio;
- completamento o motivo di abort;
- fallback;
- candidati considerati/scartati;
- durata del contesto e del modulo;
- eventuali superamenti del budget.

## 8. Disciplina prestazionale

F9T2 conserva i limiti F9T1:

- contesto: 12 ms;
- modulo: 8 ms;
- fondazione di turno: 30 ms;
- candidati: massimo 64;
- passaggi: massimo 12;
- record decisionali dettagliati: massimo 24 per turno.

La dottrina aggiunge:

- un solo candidato per PS;
- cache locale dei movimenti delle unità candidate;
- nessuna rivalutazione completa dopo ciascun micro-passaggio;
- nessuna ricerca ricorsiva, minimax o simulazione del turno avversario.

## 9. Fuori ambito

F9T2 non introduce:

- una dottrina completa Exordium di armi combinate;
- schieramento Expert di Mech, Pivot o Comandante;
- sequenze potenziamento → movimento → attacco;
- conversione post-eliminazione generale;
- valutazione Expert delle tattiche;
- dottrine Expert per le altre quattro fazioni;
- modifiche a regole, carte, statistiche, costi o bilanciamento.

## 10. Criterio di validazione manuale

La build può essere validata soltanto dopo avere verificato in partite reali che:

- Exordium costruisca Bastioni su PS controllati quando esiste una finestra sensata;
- la costruzione non avvenga quando il QG è a rischio diretto;
- almeno una parte dei Bastioni sostituisca davvero una guarnigione mobile;
- la unità liberata riduca la distanza dal successivo obiettivo;
- il piano non provochi spese bloccate, softlock o turni incompleti;
- Nexus, Liberti, Agathoi e Fabeot mantengano il comportamento Advanced F9T0;
- tempi di calcolo e memoria non peggiorino in modo significativo.
