# F9T2b — Exordium Expert Territorial Conversion & Relay Survival

Baseline ufficiale: `C2-STABLE-1-F9T2a-APK-M4c`  
Candidata: `C2-STABLE-1-F9T2b-APK-M4c`  
Schema principale: `F9Q3e1-2`  
Contratto Expert: `F9T1-1`  
Estensione dottrinale: `F9T2b-1`

## 1. Scopo

F9T2b estende il profilo Exordium Expert con due componenti strettamente delimitate:

1. `CLEAR_OCCUPY_FORTIFY`, micro-piano per convertire una rimozione su Punto Strategico in controllo persistente;
2. `RELAY_SURVIVAL_CHECK`, filtro di sopravvivenza applicato al Bastion Relay prima della ricostruzione.

Il `BASTION_RELAY` di F9T2a resta attivo e conserva la sequenza legale `move_guard → verify_ps_free → build_bastion`.

## 2. Priorità del modulo

Il router esegue soltanto `expert-exordium-f9t2b` per Exordium. Il modulo applica l’ordine:

1. emergenza QG gestita dal contratto comune;
2. candidato `CLEAR_OCCUPY_FORTIFY`;
3. candidato `BASTION_RELAY` approvato dal controllo di sopravvivenza;
4. fallback `advanced_f9t0`.

È consentito un solo micro-piano attivo.

## 3. CLEAR_OCCUPY_FORTIFY

### Trigger tecnico

Il candidato richiede:

- unità o struttura nemica presente su un PS;
- almeno un attaccante Exordium pronto e già capace di colpire;
- danno stimato sufficiente usando al massimo tre attaccanti;
- conversione plausibile nello stesso turno tramite:
  - Bastione e builder distinto; oppure
  - guarnigione mobile economica capace di entrare sul PS dopo la rimozione.

### Selezione degli attaccanti

Gli attaccanti vengono ordinati deterministicamente per:

1. danno utile decrescente;
2. valore/costo crescente;
3. ID stabile.

La selezione termina appena il danno stimato raggiunge la vita effettiva del presidio o dopo tre attaccanti. Non viene generato alcun albero di combinazioni.

### Sequenza con Bastione

1. `attack_ps_target`, fino a un massimo di tre passi;
2. verifica che il presidio sia stato realmente distrutto;
3. `build_roster_clear_ps` con builder dichiarato e distinto;
4. ricontrollo di cella, builder, ENE e sopravvivenza del Relay;
5. costruzione del Bastione;
6. completamento e rilascio della riserva.

### Sequenza con guarnigione

1. rimozione coordinata del presidio;
2. verifica della cella libera;
3. `occupy_ps` con l’unità economica dichiarata;
4. completamento del piano.

### Abort principali

- attaccante riservato non disponibile;
- bersaglio sopravvissuto al danno riservato;
- PS non liberato;
- builder o guarnigione non più disponibili;
- ENE riservata non disponibile;
- ricostruzione respinta dal controllo di sopravvivenza;
- rischio diretto di occupazione del QG.

## 4. RELAY_SURVIVAL_CHECK

### Memoria

Per ogni lato e coordinate PS viene conservato esclusivamente:

- round delle perdite recenti di Bastioni;
- ultimo round di perdita.

La finestra è limitata agli ultimi cinque round; i record scaduti vengono eliminati.

### Indicatori

- Bastioni persi negli ultimi 2 round;
- Bastioni persi negli ultimi 5 round;
- nemici capaci di raggiungere/attaccare la cella nel prossimo turno plausibile;
- danno nemico stimato;
- supporto Exordium entro raggio 2;
- durabilità del Bastione;
- valore del centro;
- round residui;
- Pressione avversaria;
- PS controllati e soglia richiesta.

### Classificazione

- `SAFE`: ricostruzione ordinaria ammessa;
- `CONTESTED`: ricostruzione ammessa ma penalizzata;
- `CRITICAL`: preferenza per pulizia o supporto prima della ricostruzione;
- `UNSUSTAINABLE`: ricostruzione automatica respinta.

L’eccezione `criticalValue` mantiene possibile la ricostruzione sul centro quando necessaria per impedire Pressione, sostenere il finale o conservare la soglia territoriale. Non viene applicato un divieto assoluto.

## 5. Riserva operativa

L’ENE dichiarata dal piano viene protetta da:

- tattiche di mano;
- tattiche Starter;
- acquisti ordinari dal roster.

La riserva viene liberata al completamento o all’abbandono del piano.

## 6. Telemetria

F9T2b registra:

- candidati di conversione valutati e motivi di rifiuto;
- attaccanti e danno riservato;
- modalità `BASTION` o `GARRISON`;
- PS liberati;
- PS occupati dopo la rimozione;
- PS fortificati dopo la rimozione;
- controlli di sopravvivenza;
- ricostruzioni respinte;
- passi, completamenti, abort e fallback;
- tempi di contesto/modulo e budget esauriti.

## 7. Limiti espliciti

F9T2b non implementa:

- schieramento avanzato del Mech;
- catena d’assalto di Varran;
- selezione Pressione/QG;
- recupero materiale da spareggio;
- colonna ad armi combinate;
- nuove dottrine per Nexus, Liberti, Agathoi o Fabeot;
- modifiche di bilanciamento.
