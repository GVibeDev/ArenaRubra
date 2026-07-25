# F9O7a — Lezione 1: Exordium

## Identità della candidata

- Build: `C2-STABLE-1-F9O7a-APK-M4c`
- Baseline validata: `C2-STABLE-1-F9O6-APK-M4c`
- Scenario: `lesson-1-exordium`
- Ritmo: `competitive` — Rapida
- Scala: `tactical` — Tattica
- Fazione giocatore: Exordium
- Fazione avversaria: Nexus
- Starter: disattivati

F9O7a trasforma la demo tecnica della F9O6 nella prima lezione completa e deterministica del tutorial. Non modifica statistiche delle unità, regole generali, IA competitiva o condizioni delle partite normali.

## Obiettivi didattici

La lezione insegna, nell’ordine:

1. come leggere una carta unità;
2. come ridurre e riaprire la Mano;
3. come selezionare e schierare una carta unità;
4. la relazione fra ATT, DEF e HP;
5. che il danno eccedente contro la DEF non passa agli HP nello stesso attacco;
6. come terminare il turno;
7. come schierare una seconda unità;
8. come usare un’abilità attiva e comprenderne costo e ricarica;
9. la differenza fra carta unità e tattica;
10. come coordinare tattica e attacchi per abbattere un bersaglio pesante.

## Stato iniziale

La mano del giocatore contiene soltanto:

- `EXC1F01` — Il Tribuno;
- `EX1B04` — Legionario Pesante.

Lo scenario imposta direttamente fazioni, comandanti, ENE, ordine di turno, mani e comportamento avversario. Il bot ordinario resta sospeso: le risposte Nexus sono eseguite da comandi deterministici dello scenario.

## Sequenza della lezione

### 1. Carta e Mano

Il Narratore Exordium presenta costo ENE, nome, tipo, HP, DEF, ATT e presenza di un’abilità. Il giocatore riduce la Mano, la riapre, seleziona Il Tribuno e lo schiera sulla cella indicata.

### 2. Primo avversario e sistema ATT–DEF

Compare un Fante Robot Nexus. La vignetta spiega che un attacco normale consuma prima la DEF e che l’eccesso non passa agli HP. Il giocatore termina il turno per rendere pronto Il Tribuno.

### 3. Legionario Pesante e abilità attiva

Il giocatore schiera il Legionario Pesante. Il Tribuno consuma la DEF del Fante Robot; dopo il passaggio Nexus, il Legionario usa Colpo Pesante e infligge direttamente 2 danni ai suoi 2 HP, distruggendolo.

### 4. Missile EMP e bersaglio pesante

Compare il Mech Pesante Nexus. Il giocatore riceve `EXTAC03` — Missile EMP. La tattica:

- costa 3 ENE;
- infligge 2 danni;
- riduce permanentemente di 1 l’ATT del bersaglio.

Contro il Mech con 3 DEF, l’EMP consuma 2 DEF e riduce ATT da 3 a 2. Il Tribuno elimina l’ultima DEF. Il Mech reagisce contro il Legionario ma, indebolito dall’EMP, consuma soltanto la sua DEF. Il Legionario conclude con un attacco da 4 contro i 4 HP del Mech privo di protezione.

## Passi e checkpoint

- Passi scenario: 29.
- Checkpoint: 2.
- Completamento: evento reale di distruzione del Mech Pesante seguito dalla vignetta conclusiva.
- Ripresa: il checkpoint conserva turno, giocatore attivo, ENE, carte in mano, unità vive, statistiche correnti, posizione e stato di azione.

## Spotlight e controllo delle azioni

La lezione usa bersagli semantici, non posizioni DOM fragili:

- carta tramite `cardUid`/ID;
- miniatura tramite `unit uid`/blueprint;
- cella tramite coordinate esagonali;
- pulsante tramite attributo `data-unit-action`;
- Mano e Fine turno tramite selettori dedicati.

Le modalità informative, guidate e vincolate della F9O6 vengono usate per impedire che un’azione estranea alteri la sequenza deterministica.

## Politica dei testi visibili

I testi destinati al giocatore parlano esclusivamente di:

- regole;
- carte e statistiche;
- azioni consentite;
- situazione tattica;
- risultati delle azioni.

Sono esclusi riferimenti a versioni, aggiornamenti, sviluppo, test, debug, placeholder o stato tecnico del progetto. L’audit automatico verifica questa regola.

## Correzione Missile EMP

Nel catalogo dati la tattica usa `damage_and_permanent_attack_debuff`; una parte storica del calcolo del danno riconosceva soltanto `damage_and_permanent_att_debuff`. Il runtime applicava il malus ATT ma poteva omettere i 2 danni dichiarati.

F9O7a riconosce entrambe le denominazioni. Il test end-to-end conferma:

- DEF del Mech: 3 → 1;
- ATT del Mech: 3 → 2;
- carta consumata correttamente;
- evento `TACTIC_USED` emesso per `EXTAC03`.

## Asset narrativi

La build LITE usa ancora il placeholder del set `tutorial-exordium`. Le immagini definitive del narratore possono essere aggiunte al manifest già predisposto senza modificare la sequenza o il runtime.

## Fuori ambito

- Lezioni 2–5 giocabili.
- Selezione 5 carte su 10.
- Ondate Agathoi e Liberti.
- Partita finale Fabeot.
- Ritratti narrativi definitivi.
- Validazione APK reale, touch e prestazioni sul dispositivo dell’autore.
