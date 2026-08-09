# ARENA RUBRA — PRIMO RAPPORTO OPERATIVO PER L’IA EXPERT

**Versione:** 0.1 preliminare
**Build analizzata:** `C2-STABLE-1-F9T0-APK-M4c`
**Schema telemetrico:** `F9Q3e1-2`
**Modalità principale:** tattica, ritmo competitivo, IA Advanced
**Mappa comune:** `Plains 2G large`, rev. 169, movimento ×2

## 1. Scopo del rapporto

Questo primo rapporto non definisce ancora l’implementazione definitiva dell’IA Expert. Individua, sulla base dei confronti raccolti, le differenze operative fra:

* IA Advanced contro IA Advanced;
* giocatore umano contro la stessa IA Advanced;
* vecchia IA e Advanced F9T0, dove il confronto storico è disponibile.

L’obiettivo non è rendere l’Expert semplicemente più aggressiva o più efficiente nel combattimento. I dati mostrano che il salto necessario riguarda soprattutto:

> **la capacità di concatenare azioni valide in un piano territoriale completo, riconoscere il percorso di vittoria e convertire ogni vantaggio tattico in un cambiamento persistente della mappa.**

F9T0 ha già corretto i problemi più gravi dell’Advanced: ricorsioni, oscillazioni, doppi conteggi dottrinali, guarnigioni eccessive e mancata proiezione di Nexus e Agathoi. L’Expert dovrà essere costruita sopra questa base, non sostituirla. 

---

# 2. Campione attualmente disponibile

## Partite principali post-F9T0

| Gruppo                     | Match                                          | Controllo          | Esito                      |
| -------------------------- | ---------------------------------------------- | ------------------ | -------------------------- |
| Nexus                      | Presidio Reticolare vs Breccia Cremisi         | bot–bot            | Nexus, Pressione R25       |
| Agathoi baseline           | Furia del Colosso vs Acquisizione Territoriale | bot–bot            | Fabeot, Pressione R27      |
| Agathoi riferimento umano  | stessi deck                                    | umano Agathoi–bot  | Agathoi, eliminazione R14  |
| Exordium baseline          | Breccia Cremisi vs Esecuzione Porpora          | bot–bot            | Fabeot, Pressione R28      |
| Exordium riferimento umano | stessi deck e stessa iniziativa                | umano Exordium–bot | Exordium, eliminazione R14 |

Il confronto Exordium è il più pulito: stessa build, mappa, revisione, deck, comandanti e iniziativa. Cambiano soltanto seed e controllo di Exordium.

Nel confronto Agathoi cambiano controllo, seed e iniziativa: resta molto informativo, ma non è un A/B perfettamente isolato.

Per Nexus manca ancora un riferimento umano post-F9T0 con lo stesso matchup.

## Dati storici separati

Il precedente campione di Presidio Reticolare con la vecchia IA mostrava sei sconfitte bot consecutive sulla stessa mappa, prevalentemente caratterizzate da grande massa sul campo ma insufficiente conversione in PS. È usato soltanto come riferimento direzionale pre/post correzione, non come parte dello stesso campione F9T0. 

---

# 3. Sintesi esecutiva

## Conclusione principale

L’Advanced possiede già:

* riconoscimento dell’obiettivo strategico;
* selezione di piani come `contesta_centro`, `rompi_controllo_ps`, `vittoria_pressione`;
* capacità di combattere e infliggere danni;
* identità di fazione riconoscibili;
* meccanismi anti-stallo;
* gestione funzionale della partita fino alla conclusione.

Quello che le manca rispetto al giocatore umano è soprattutto il **collegamento fra le singole decisioni**.

Il giocatore non valuta separatamente:

1. muovere;
2. attaccare;
3. costruire;
4. occupare;
5. schierare.

Le considera parti di una sequenza unica:

> eliminare il presidio → occupare il PS → costruire una struttura → liberare l’unità mobile → schierare più avanti → aprire il PS successivo o il QG.

L’Advanced tende ancora a valutare bene le singole azioni, ma non sempre il risultato combinato della sequenza.

## Evidenze più solide

**Alta confidenza**

* Exordium Advanced non sfrutta la propria capacità di costruire Bastioni come rete logistica offensiva.
* Agathoi Advanced considera la linea verde matura troppo in base alla stabilità e non abbastanza in base alla profondità e agli obiettivi.
* L’Advanced tende a equiparare “carta giocabile” e “carta utile”.
* Le eliminazioni non vengono sempre convertite in controllo persistente.
* Comandanti e Pivot vengono spesso schierati quando economicamente disponibili, non quando possono produrre impatto immediato.
* Il giocatore umano ottiene risultati molto superiori senza dover necessariamente spendere più ENE o giocare più tattiche.

**Media confidenza**

* Fabeot ha bisogno di una risposta specifica al collasso della propria rete territoriale.
* L’IA tende a reagire con disturbo tattico e rinforzi leggeri quando servirebbe un’ancora strategica.
* La valutazione del QG viene aperta troppo tardi rispetto alle possibilità reali di eliminazione.

**Non ancora dimostrato**

* Qualsiasi problema strutturale di bilanciamento delle carte.
* Superiorità eccessiva di una specifica fazione.
* Comportamento Expert necessario per Liberti.
* Generalizzazione dei risultati a tutte le mappe.

---

# 4. Nexus — stato dopo F9T0

## Risultato osservato

Presidio Reticolare, con la nuova Advanced F9T0, sconfigge Breccia Cremisi per Pressione al round 25:

* PS 4–1;
* Pressione 5–0;
* pezzi finali 34–14;
* 25 attacchi;
* 64 danni;
* 19 eliminazioni;
* 206 movimenti;
* 309 celle percorse;
* 25 unità generate;
* 19 strutture costruite. 

La partita mostra correttamente:

* attivazione di `network_mature`;
* passaggio alla proiezione offensiva;
* recupero da uno svantaggio iniziale territoriale;
* conquista del centro;
* mantenimento della Pressione;
* chiusura con protezione degli obiettivi.

## Differenza rispetto alla vecchia IA

Il vecchio Nexus produceva molta massa, effettuava molti movimenti e costruiva una rete che restava prevalentemente difensiva.

F9T0:

* genera meno unità;
* costruisce una rete più sviluppata;
* attacca prima;
* elimina più bersagli;
* si muove meno;
* converte la rete in controllo territoriale.

Questo conferma che il problema non era “Nexus costruisce troppo”, ma:

> **Nexus costruiva senza trasformare l’infrastruttura in capacità offensiva.**

## Obiettivo Expert per Nexus

Nexus non richiede ora un incremento generale dell’aggressività. L’Expert dovrebbe aggiungere precisione:

* valutare la profondità della rete;
* distinguere strutture di retrovia e nodi avanzati;
* sostituire una guarnigione mobile con una struttura quando conveniente;
* mantenere aperte le linee di rinforzo;
* proteggere il centro durante la proiezione;
* riconoscere quando la Pressione è ormai la via più sicura;
* evitare di inseguire eliminazioni che espongano i PS necessari.

### Stato

**Advanced Nexus:** correzione fortemente supportata.
**Expert Nexus:** da calibrare con un confronto umano post-F9T0 prima di introdurre nuove regole sostanziali.

---

# 5. Agathoi — confronto Advanced contro giocatore umano

## Risultati finali

### Advanced Agathoi

Furia del Colosso perde contro Acquisizione Territoriale:

* sconfitta per Pressione al round 27;
* PS 2–4;
* pezzi 26–33;
* Alexandros mai schierato;
* mano spesso vicina al limite;
* otto sovrapesche;
* Giganthropos distrutto al round 20. 

### Agathoi umano

Lo stesso deck, controllato dal giocatore:

* vittoria per eliminazione al round 14;
* PS 7–0;
* pezzi attivi 22–0;
* ENE finale 14;
* controllo del centro ottenuto molto presto;
* ingresso nel QG prima dell’attivazione della Pressione. 

## Confronto entro il round 14

| Agathoi             | Advanced |   Umano |
| ------------------- | -------: | ------: |
| PS                  |        3 |   **7** |
| Carte giocate       |        7 |  **17** |
| Strutture costruite |        8 |  **10** |
| Unità schierate     |       10 |  **15** |
| Attacchi            |        2 |  **23** |
| Danno               |        4 |  **49** |
| Eliminazioni        |        2 |  **17** |
| Movimenti           |       62 |      69 |
| Celle percorse      |      112 | **165** |
| ENE ottenuta dai PS |       27 |  **50** |
| Mano                |        9 |   **2** |

## Diagnosi Agathoi

### 1. La linea verde dell’Advanced è stabile ma poco profonda

Il trigger `green_line_mature` si attiva, quindi la correzione F9T0 funziona. Tuttavia entra quando il fronte è già in ritardo.

Il giocatore costruisce la linea direttamente:

* sui PS;
* sul centro;
* verso la metà avversaria;
* lungo un corridoio che consente nuovi schieramenti.

L’Advanced tende maggiormente a sviluppare una linea compatta e resistente nella propria zona.

### 2. Il movimento dell’Advanced è locale

La quantità di movimenti è simile, ma il giocatore percorre molte più celle e raggiunge prima:

* centro;
* PS laterali;
* linea nemica;
* QG.

L’Expert deve distinguere fra:

* movimento che modifica lo stato strategico;
* micro-riposizionamento che lascia invariata la distanza dagli obiettivi.

### 3. La mano è giocabile ma sottoutilizzata

Non si tratta di mano morta. Il bot possiede carte legali ma le conserva mentre usa ripetutamente azioni starter o costruzioni locali.

Serve una pressione crescente legata alla dimensione della mano, ma senza trasformarla in una regola cieca.

### 4. Spine vengono usate senza previsione del bersaglio probabile

Il giocatore sfrutta Spine sui pezzi realmente esposti al fuoco, ottenendo diverse eliminazioni di ritorno.

L’Expert dovrebbe valutare la probabilità che il bersaglio:

* venga attaccato;
* sopravviva al colpo;
* restituisca danno;
* occupi un PS o blocchi un corridoio.

### 5. Giganthropos viene schierato prima che il fronte sia pronto

Nella baseline avanza isolato, viene controllato e distrutto.

Il giocatore lo schiera quando esistono già:

* nodi avanzati;
* alleati di supporto;
* strutture nella metà campo;
* bersagli strategici raggiungibili.

## Modulo Expert Agathoi proposto

`green_line_expert` dovrebbe considerare:

* PS occupati da strutture;
* controllo del centro;
* distanza media della linea dal QG nemico;
* continuità del corridoio;
* unità capaci di entrare in combattimento entro un turno;
* rapporto fra strutture arretrate e avanzate;
* probabilità di sostenere Giganthropos;
* opportunità di sostituire un presidio mobile con una struttura.

---

# 6. Exordium — il confronto più importante

## Risultati finali

### Advanced Exordium

Breccia Cremisi perde contro Esecuzione Porpora:

* sconfitta per Pressione al round 28;
* PS 2–4;
* pezzi finali 16–26;
* 47 attacchi contro 44;
* 83 danni contro 65;
* 22 eliminazioni contro 17.

Exordium vince quindi il confronto combattivo complessivo, ma perde territorialmente.  

### Exordium umano

Stessi deck, stessa mappa e stessa iniziativa Fabeot:

* vittoria per eliminazione al round 14;
* PS 7–0;
* pezzi attivi 18–0;
* ENE finale 38;
* 14 eliminazioni e soltanto 3 perdite.  

## Confronto entro il round 14

| Exordium            | Advanced |   Umano |
| ------------------- | -------: | ------: |
| PS                  |        3 |   **7** |
| Strutture costruite |        0 |   **7** |
| Unità schierate     |       17 |      15 |
| Attacchi            |        7 |  **17** |
| Danno               |       13 |  **30** |
| Eliminazioni        |        4 |  **14** |
| Movimenti           |       76 |      86 |
| Celle percorse      |      168 | **225** |
| ENE spesa           |   **70** |      63 |
| ENE finale          |        0 |  **38** |
| Tattiche usate      |   **14** |       4 |

## Diagnosi Exordium

### 1. Staffetta di guarnigione assente

Il giocatore usa una sequenza ricorrente:

1. l’unità raggiunge il PS;
2. costruisce un Bastione Armato;
3. il Bastione conserva il PS;
4. l’unità prosegue;
5. il Bastione apre un nuovo punto di schieramento.

Cinque dei sette Bastioni vengono costruiti direttamente sui PS.

L’Advanced non costruisce alcun Bastione in ventotto round, nonostante disponga degli strumenti per farlo.

Questa è la più importante differenza Expert emersa finora.

### 2. L’infrastruttura viene usata come proiezione, non solo difesa

Il giocatore non costruisce per accumulare resistenza:

* sostituisce le guarnigioni;
* consolida il centro;
* porta il punto di schieramento nella metà avversaria;
* evita che i rinforzi debbano partire dal QG.

### 3. Il Mech viene valutato per impatto immediato

**Advanced**

* schierato R9 presso il QG;
* un solo attacco nell’intera partita;
* un danno;
* nessuna abilità;
* distrutto R16.

**Umano**

* schierato R6 direttamente sul centro;
* conquista immediatamente un PS;
* continua l’avanzata;
* assorbe due Ipnosi;
* usa Soppressione;
* resta attivo fino alla vittoria.

La posizione di schieramento vale più dell’anticipo assoluto.

### 4. Varran deve entrare in una formazione operativa

Il bot lo schiera presto ma arretrato.

Il giocatore lo schiera più tardi vicino al fronte e combina:

* Ordine di Varran;
* conservazione dell’azione;
* movimento;
* attacco decisivo al Gerarca.

### 5. Troppe tattiche legalmente valide ma strategicamente deboli

L’Advanced usa molte più tattiche, ma produce meno danni ed eliminazioni.

Caso esplicito: `Neutralizza Armamenti` viene usata su un bersaglio con DEF già pari a zero.

L’Expert deve distinguere:

* bersaglio legale;
* effetto numericamente reale;
* effetto utile al micro-piano corrente.

### 6. Spendere tutto non equivale a giocare bene

Il bot chiude quasi ogni turno a zero ENE.

Il giocatore termina con 38 ENE, valore certamente non ottimale in assoluto, ma domina la partita perché non spende su azioni marginali.

L’Expert non deve ricevere un premio generico per l’ENE inutilizzata, ma deve smettere di ricevere un premio implicito per averla consumata tutta.

## Modulo Expert Exordium proposto

`combined_arms_expert` dovrebbe includere:

* sostituzione della guarnigione con Bastione;
* valore logistico delle strutture;
* schieramento avanzato;
* mantenimento del centro;
* impatto immediato di Pivot e Comandante;
* sequenze `potenziamento → movimento → attacco`;
* occupazione dopo eliminazione;
* avanzata verso QG prima del round 20.

---

# 7. Fabeot — comportamento sotto pressione umana

Fabeot vince entrambe le baseline bot–bot:

* contro Agathoi per Pressione R27;
* contro Exordium per Pressione R28.

Contro il giocatore umano, con gli stessi deck avversari:

* perde contro Agathoi per eliminazione R14, PS 0;
* perde contro Exordium per eliminazione R14, PS 0.    

## Diagnosi provvisoria

Fabeot è efficace contro un avversario che:

* sviluppa lentamente il fronte;
* lascia tempo alla rete Fabeot;
* contesta i PS in modo discontinuo;
* non converte subito le eliminazioni.

Quando subisce pressione coordinata:

* perde PS;
* perde il reddito;
* spende in tattiche di disturbo;
* genera piccoli rinforzi;
* ritarda o rinuncia a Pivot e strutture;
* entra tardi in `tutto_per_tutto`;
* non ricostruisce un punto stabile sulla mappa.

Nel match contro Exordium umano, Architetto Nero è disponibile ma non viene mai schierato; Fabeot non costruisce alcuna struttura e termina senza PS. 

## Modulo Expert Fabeot proposto

`network_collapse_response` dovrebbe attivarsi quando:

* l’avversario controlla almeno quattro PS;
* Fabeot non controlla più il centro;
* Fabeot possiede zero o un solo PS;
* la distanza media nemica dal QG è inferiore a una soglia;
* due o più presidi sono stati eliminati negli ultimi turni.

Le risposte candidate devono essere confrontate:

* schierare Architetto Nero come ancora;
* costruire una struttura su un PS recuperabile;
* concentrare Ipnosi e disturbo sul vettore principale;
* rinunciare a un PS periferico per difendere centro/QG;
* creare una contropressione laterale;
* conservare ENE per una risposta strutturale invece di spenderla tutta in disturbo.

Questa parte ha **confidenza media**, perché nei due match umani Fabeot ha affrontato seed diversi e pressioni molto rapide.

---

# 8. Principi generali dell’IA Expert

## 8.1 Nessuna ricerca ricorsiva generale

L’Expert può restare coerente con l’architettura F9T0:

* contesto condiviso;
* selezione in un passaggio;
* memoria leggera;
* niente albero ricorsivo esteso;
* niente vantaggi informativi;
* niente lettura della mano avversaria.

Il salto può essere ottenuto con **micro-piani dichiarativi**, non con una ricerca combinatoria.

## 8.2 Micro-piano di turno

Ogni micro-piano dovrebbe contenere:

```text
goal
targetCell / targetPs / targetUnit
primaryActor
supportActors
requiredEnergy
reservedActions
orderedSteps
expectedResult
abortConditions
fallbackPlan
```

Esempi:

```text
CLEAR_AND_OCCUPY_PS
1. elimina il presidio;
2. muovi sul PS;
3. costruisci o assegna guarnigione;
4. libera le unità eccedenti.
```

```text
ADVANCED_PIVOT_DEPLOYMENT
1. individua nodo di schieramento avanzato;
2. verifica supporto;
3. schiera Pivot;
4. conquista/contesta;
5. sostituisci la Pivot con presidio se deve avanzare.
```

```text
HQ_BREAKTHROUGH
1. conserva almeno un PS;
2. libera il corridoio;
3. neutralizza il difensore chiave;
4. muovi l’incursore;
5. occupa il QG.
```

## 8.3 Riesame dopo ogni passaggio

Non serve riesaminare tutte le mosse possibili. Basta verificare dopo ogni azione:

* il bersaglio esiste ancora;
* la cella è libera;
* il PS ha cambiato controllo;
* l’ENE riservata è sufficiente;
* la via di vittoria è ancora valida;
* il piano deve essere completato o abbandonato.

## 8.4 Valutare il risultato, non l’attività

L’Expert deve premiare:

* variazione dei PS;
* controllo del centro;
* apertura del QG;
* riduzione della distanza dal fronte;
* unità liberate dalla guarnigione;
* danno che completa una rimozione;
* struttura che modifica la logistica;
* Pivot che produce impatto entro uno o due turni.

Non deve premiare automaticamente:

* numero di azioni eseguite;
* ENE consumata;
* tattica giocata;
* movimento effettuato;
* unità generata.

---

# 9. Priorità di implementazione

## P0 — Strato Expert comune

1. **Conversione post-eliminazione**

   * eliminare non basta;
   * verificare occupazione, struttura o apertura del percorso.

2. **Staffetta di guarnigione**

   * sostituire unità mobili con strutture o unità meno preziose.

3. **Schieramento a impatto**

   * valutare dove e quando schierare, non solo se la carta è pagabile.

4. **Valore reale delle tattiche**

   * calcolare DEF rimossa, danno utile, azioni negate e probabilità d’impatto.

5. **Valutazione dinamica della vittoria**

   * Pressione, eliminazione e QG confrontati ogni turno.

6. **Risposta al collasso**

   * comportamento specifico quando la rete territoriale viene distrutta.

7. **Riserva operativa**

   * prenotare ENE e azioni necessarie a completare una sequenza.

## P1 — Moduli di fazione

* **Nexus:** profondità rete, proiezione e pressure lock.
* **Agathoi:** profondità linea verde, Spine, supporto Giganthropos.
* **Exordium:** Bastioni, staffetta, formazione combinata, Pivot avanzata.
* **Fabeot:** ancora territoriale, risposta al collasso, contropressione.

## P2 — Dati ancora mancanti

* Liberti Expert;
* Missioni;
* deck alternativi delle stesse fazioni;
* mappe con choke o movimento ×1/×3;
* FFA;
* più comandanti e Pivot;
* comportamento contro furtivo e terreni speciali.

---

# 10. Telemetria richiesta per sviluppare l’Expert

Le telemetrie attuali permettono già una buona analisi, ma per l’Expert servirebbero nuovi indicatori.

## Micro-piani

* `AI_MICROPLAN_SELECTED`
* `AI_MICROPLAN_STEP`
* `AI_MICROPLAN_COMPLETED`
* `AI_MICROPLAN_ABORTED`
* motivo dell’abbandono;
* risultato previsto e risultato effettivo.

## Conversione territoriale

* PS liberato;
* PS occupato nello stesso turno;
* PS occupato nel turno successivo;
* PS fortificato;
* unità liberata dalla guarnigione;
* durata del controllo dopo la conquista.

## Movimento

* distanza da obiettivo prima/dopo;
* movimento che apre un attacco;
* movimento che apre una costruzione;
* movimento puramente locale;
* movimenti per attacco;
* celle percorse per eliminazione.

## Schieramento

* distanza dal fronte al momento dello schieramento;
* round fino al primo attacco;
* round fino alla prima abilità;
* round fino al primo PS influenzato;
* ENE investita prima dell’impatto.

## Tattiche

* effetto teorico;
* effetto reale;
* danno sprecato;
* DEF realmente rimossa;
* attacco realmente impedito;
* tattica usata senza variazione utile dello stato.

## Percorso di vittoria

* Pressione valutata;
* QG valutato;
* eliminazione valutata;
* percorso selezionato;
* motivo della selezione;
* turni stimati alla chiusura.

---

# 11. Anomalie telemetriche da separare dall’IA

Queste incongruenze non invalidano i risultati strategici, ma devono restare escluse dai confronti interessati:

* nella baseline Agathoi mancano dal totale economico 14 ENE generate da Ekklesion;
* nella baseline Exordium–Fabeot gli sconti dello Sportello di Reclutamento producono una differenza di 3 ENE;
* nel match umano Exordium il contatore F9N3 `starter_structure` riporta 2 mentre log e campo autorevole registrano 7 Bastioni;
* log e JSON possono differire di un evento tecnico dopo l’esportazione.

PS, combattimento, strutture autorevoli, Pivot e risultati restano utilizzabili nei match analizzati.    

---

# 12. Criteri iniziali di accettazione Expert

L’Expert non dovrebbe essere validata soltanto sulla percentuale di vittorie.

## Requisiti comportamentali

* completa una conquista con occupazione o fortificazione;
* usa nodi avanzati quando disponibili;
* evita tattiche senza effetto reale;
* schiera Pivot e Comandanti in una finestra d’impatto;
* distingue movimento locale e avanzamento operativo;
* riconosce la via al QG prima del round 20;
* reagisce al collasso territoriale prima di perdere tutti i PS;
* non richiede ENE bonus, carte note o casualità manipolata;
* mantiene log diagnostici comprensibili;
* non reintroduce ricorsioni o oscillazioni.

## Metriche candidate

Da considerare provvisorie, non ancora soglie definitive:

* almeno il 70% dei PS liberati deve essere occupato o fortificato entro il turno successivo;
* Pivot con primo impatto strategico entro due round dallo schieramento;
* tattiche senza effetto reale inferiori al 5%;
* riduzione dei turni con mano 9–10 e carte giocabili inutilizzate;
* riduzione dei movimenti per attacco rispetto alla Advanced;
* aumento dei PS mantenuti per almeno due round;
* nessun peggioramento importante dei tempi di calcolo.

## Piano minimo di test

Per ogni modulo Expert:

* almeno 10 seed bot–bot;
* iniziativa invertita 5/5;
* almeno 3 mappe;
* stesso deck contro almeno 3 archetipi;
* confronto Advanced–Expert;
* almeno un riferimento umano;
* separazione fra risultato e qualità del processo.

---

# 13. Verdetto sul bilanciamento

I dati raccolti non giustificano modifiche a:

* carte;
* costi;
* statistiche;
* Pivot;
* comandanti;
* condizioni di vittoria.

I due confronti umani mostrano che Agathoi ed Exordium possiedono già gli strumenti per dominare i rispettivi matchup.

La differenza è nell’impiego:

* profondità del fronte;
* posizione delle strutture;
* schieramento avanzato;
* selezione dei bersagli;
* conversione delle eliminazioni;
* scelta del percorso di vittoria.

Un intervento numerico adesso rischierebbe di compensare artificialmente un limite dell’IA.

---

# 14. Conclusione operativa

La prima definizione utile dell’IA Expert è questa:

> **L’Advanced sceglie azioni coerenti con un obiettivo.
> L’Expert sceglie e completa sequenze di azioni che cambiano in modo persistente lo stato strategico della partita.**

Il nucleo non deve essere un motore ricorsivo più pesante. Deve essere uno strato di **micro-pianificazione, riserva delle risorse, verifica del risultato e memoria delle conversioni incompiute**.

La priorità tecnica più forte emersa è:

1. conversione post-eliminazione;
2. staffetta unità–struttura;
3. schieramento a impatto;
4. valutazione reale delle tattiche;
5. confronto dinamico Pressione–QG–eliminazione;
6. risposta al collasso territoriale.

**Stato attuale del progetto Expert:** fondazione analitica sufficiente per iniziare lo strato comune e i primi moduli Agathoi/Exordium. Nexus richiede ancora un riferimento umano post-F9T0; Fabeot richiede ulteriori match sotto pressione; Liberti non ha ancora un campione adeguato.
