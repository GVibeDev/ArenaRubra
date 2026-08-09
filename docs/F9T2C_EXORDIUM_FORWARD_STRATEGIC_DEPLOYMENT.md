# F9T2c — Exordium Expert Forward Strategic Deployment

Baseline ufficiale: `C2-STABLE-1-F9T2b-APK-M4c`  
Candidata: `C2-STABLE-1-F9T2c-APK-M4c`  
Schema principale: `F9Q3e1-2`  
Contratto Expert: `F9T1-1`  
Estensione dottrinale: `F9T2c-1`

## 1. Scopo

F9T2c estende il profilo Exordium Expert con un solo micro-piano P1:

`EXORDIUM_FORWARD_PIVOT_DEPLOYMENT`

Lo scopo è evitare che la Pivot venga schierata automaticamente in retrovia e debba trascorrere più round prima di produrre un effetto strategico. La Pivot viene valutata soltanto quando è già presente nella mano e può entrare da un nodo strutturale avanzato sostenuto, con un obiettivo influenzabile nella finestra operativa prevista.

F9T2c preserva senza modificarne l’ordine:

1. `CLEAR_OCCUPY_FORTIFY`;
2. `BASTION_RELAY`, filtrato da `RELAY_SURVIVAL_CHECK`;
3. `FORWARD_PIVOT_DEPLOYMENT`;
4. fallback `advanced_f9t0`.

È consentito un solo micro-piano attivo.

## 2. Trigger tecnico

Il candidato richiede contemporaneamente:

- fazione attiva Exordium in modalità Expert;
- nessuna Pivot Exordium già presente sul campo;
- carta Pivot Exordium reale e non bloccata nella mano;
- limite di acquisto non raggiunto;
- cella di schieramento legale;
- cella diversa dalla cella del proprio QG;
- almeno una struttura Exordium adiacente alla cella, usata come nodo avanzato;
- almeno un alleato mobile entro raggio 2;
- esposizione locale non incompatibile con durabilità e supporto;
- obiettivo strategico influenzabile;
- ENE disponibile pari al costo effettivo della carta;
- assenza di rischio QG `occupied` o `direct`.

Il mercato non viene interrogato per creare artificialmente la disponibilità della Pivot.

## 3. Obiettivi ammessi

Il candidato può riferirsi a:

1. PS contestabile o acquisibile;
2. centro;
3. bersaglio nemico di alto valore;
4. ingresso o corridoio verso il QG nemico.

La selezione considera il movimento proiettato della Pivot e il moltiplicatore di movimento della mappa. Non viene simulato un turno completo.

## 4. Valutazione del nodo

Per ogni cella candidata vengono raccolti:

- struttura sorgente e profondità rispetto al QG proprio;
- alleati mobili di supporto entro raggio 2;
- nemici capaci di minacciare la cella nel prossimo turno plausibile;
- danno nemico stimato;
- durabilità iniziale della Pivot;
- tipo, posizione e distanza dell’obiettivo;
- costo effettivo e ENE disponibile.

Il nodo viene respinto quando:

- non è associato a una struttura avanzata;
- non dispone di supporto;
- è eccessivamente esposto;
- non esiste un obiettivo utile;
- la Pivot non è pagabile;
- la cella non è più legale.

I candidati sono ordinati deterministicamente per punteggio, distanza e coordinate.

## 5. Contratto del micro-piano

Il piano contiene un solo step:

```text
deploy_pivot_forward
```

Campi principali:

- `goal: EXORDIUM_FORWARD_PIVOT_DEPLOYMENT`;
- `cardUid` e `blueprintId` della Pivot esatta;
- `targetCell`;
- `sourceStructureId`;
- `supportActorIds`;
- `objectiveType` e `objectiveCell`;
- `requiredEnergy` e `reservedEnergy`;
- `expectedImpactDeadlineRound`;
- fallback `advanced_f9t0`.

Prima dell’esecuzione vengono ricontrollati:

- rischio QG;
- carta ancora presente e non bloccata;
- assenza di altra Pivot in gioco;
- sopravvivenza e adiacenza del nodo;
- supporto alleato;
- legalità della cella;
- costo effettivo ed ENE.

Dopo lo schieramento il runtime verifica la presenza della Pivot nella cella dichiarata, completa il piano, libera la riserva e restituisce il resto del turno all’Advanced.

## 6. Memoria d’impatto

Viene conservato al massimo un record attivo per giocatore Exordium:

- unità Pivot;
- round e sequenza di schieramento;
- cella di schieramento;
- struttura sorgente;
- obiettivo dichiarato;
- scadenza della finestra.

Il primo impatto entro due round è riconosciuto da:

- `UNIT_ATTACKED` con la Pivot come attaccante;
- `ABILITY_USED` dalla Pivot;
- `PS_CONTROL_CHANGED` con la Pivot come occupante acquisitore.

Sono registrati come mancato impatto:

- distruzione della Pivot prima di un risultato;
- scadenza della finestra di due round.

Il record attivo viene rimosso al primo impatto o fallimento, evitando crescita storica non limitata.

## 7. Telemetria

F9T2c aggiunge:

- audit aggregato dei candidati `forward_pivot_candidate_audit_batch`;
- piano selezionato;
- Pivot schierate in avanti;
- struttura sorgente e supporti;
- tipo di obiettivo;
- primo impatto e round necessari;
- finestre d’impatto mancate;
- motivi di abort;
- tempi del modulo e budget esauriti.

Contatori principali:

- `forwardPivotPlans`;
- `forwardPivotsDeployed`;
- `forwardPivotImpacts`;
- `forwardPivotImpactMisses`.

Gli audit dettagliati sono limitati prima dell’emissione e ulteriormente limitati nella lista delle decisioni del turno. I conteggi aggregati restano completi.

## 8. Limiti espliciti

F9T2c non implementa:

- movimento coordinato successivo della Pivot;
- uso Expert di Soppressione;
- `VARRAN_ASSAULT_CHAIN`;
- selezione `PRESSURE_OR_HQ_BREAKTHROUGH`;
- `ENDGAME_MATERIAL_RECOVERY`;
- `COMBINED_ARMS_COLUMN`;
- nuove dottrine delle altre fazioni;
- modifiche al bilanciamento.
