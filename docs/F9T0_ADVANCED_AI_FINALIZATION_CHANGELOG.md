# Arena Rubra — F9T0 Advanced AI Finalization · Expert AI Preparation

**Build candidata:** `C2-STABLE-1-F9T0-APK-M4c`  
**Baseline logica validata:** `C2-STABLE-1-F9U3-APK-M4c`  
**Data:** 29 luglio 2026

## Obiettivo

Chiudere l’impostazione dell’IA avanzata prima di progettare il terzo grado, Expert AI. F9T0 riduce sovrapposizioni e comportamenti statici senza introdurre alberi ricorsivi, minimax, Monte Carlo o altre ricerche ad alto costo.

## Modifiche implementate

### 1. Pressione proporzionale alla mappa

Lo stato strategico usa `pressureRuleProfile()` come fonte autorevole:

- `totalPs`;
- `requiredPs`;
- PS centrale;
- round di attivazione;
- soglia di vittoria;
- limite round.

Le modalità `pressureWinPlan`, `pressureEmergency`, `pressureDanger` e `enemyPressurePlan` non usano più la vecchia scorciatoia fissa basata su due PS. Su una mappa da sette PS, il controllo di due PS non equivale più a una posizione di chiusura.

### 2. Budget dinamico delle guarnigioni

Ogni PS controllato riceve una priorità basata su:

- minacce entro R2;
- controllo del PS centrale;
- prossimità al QG;
- stato di Pressione;
- close-pressure lock.

Il piano conserva un numero limitato di guarnigioni e libera i PS sicuri quando la fazione è in vantaggio, ha una rete matura o è in stallo. Le emergenze reali possono ancora imporre il presidio completo.

### 3. Rimozione dei doppi conteggi

- La dottrina generale e quella specifica di fazione vengono sommate una sola volta per candidato.
- Il richiamo Agathoi verso il PS domestico non viene più applicato due volte.
- I vecchi selettori di movimento per emergenza, sicurezza comandante e dovere PS non eseguono più passaggi discrezionali separati nell’IA avanzata.
- Corretto `botNexusCoreStructure()`: rimosso il `|| true` che rendeva ogni struttura Nexus automaticamente “core”.

### 4. Maturità strategica Nexus e Agathoi

**Nexus — `network_mature`**

La rete è matura quando possiede una copertura sufficiente di PS, strutture e massa mobile. Dopo la maturità:

- diminuisce l’attrazione verso ammassi statici;
- aumenta la proiezione verso PS non controllati e QG nemico;
- il piano QG può essere preparato prima di avere già due unità adiacenti al bersaglio.

**Agathoi — `green_line_mature`**

La linea verde è matura quando PS, strutture, copertura e unità mobili sono sufficienti. Dopo la maturità:

- diminuisce il richiamo ridondante verso strutture e PS già sicuri;
- la prudenza contro gruppi nemici viene rilassata quando la fazione è realmente in vantaggio;
- conquista, avanzata e finalizzazione ricevono più peso.

### 5. Anti-stallo e anti-oscillazione

Lo stato conserva una memoria leggera per giocatore e per unità:

- ultimo round con progresso;
- round consecutivi senza progresso;
- PS e Pressione;
- numero di unità nemiche;
- distanza minima dal QG nemico;
- unità realmente proiettate in avanti;
- cella precedente e corrente delle unità mosse.

Dopo due round senza progresso, Nexus e Agathoi possono entrare in `sblocco_stallo`. Il ritorno immediato alla cella precedente viene penalizzato; avanzamento, conquista e riduzione della distanza dal QG vengono premiati.

### 6. Movimento in un solo passaggio

La scelta discrezionale del movimento usa:

- uno stato strategico calcolato una volta per l’azione;
- un contesto condiviso per unità, PS, QG, minacce e dottrina;
- un solo ciclo sui candidati;
- un solo punteggio finale per cella.

Restano fuori dal passaggio unico soltanto le azioni deterministiche che non richiedono confronto fra alternative, come occupare immediatamente il QG nemico quando la vittoria è già legale.

## Telemetria e diagnostica

Aggiunti contatori interni compatibili con il sistema esistente:

- massimo numero di round in stallo;
- movimenti oscillatori rilevati;
- modalità `sblocco_stallo`;
- log di rete Nexus matura e linea Agathoi matura.

Il precheck verifica la presenza dei sette helper fondamentali F9T0 e lo schema di memoria `F9T0-1` nella partita attiva.

## Fuori ambito

- nessun terzo grado IA selezionabile;
- nessuna ricerca ricorsiva;
- nessun rebalance di carte, unità o fazioni;
- nessuna modifica a deck, mappe, Missioni o regole;
- nessuna modifica allo schema telemetrico ufficiale `F9Q3e1-2`;
- nessuna dichiarazione di miglioramento prestazionale quantitativo prima dei test reali.
