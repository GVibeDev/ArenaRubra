# Arena Rubra — F9T2c3 Expert Telemetry Aggregation Reconciliation Hotfix

- **Build:** `C2-STABLE-1-F9T2c3-APK-M4c`
- **Baseline ufficiale:** `C2-STABLE-1-F9T2b-APK-M4c`
- **Candidata tecnica precedente:** `C2-STABLE-1-F9T2c2-APK-M4c`
- **Schema principale:** `F9Q3e1-2`
- **Contratto Expert:** `F9T1-1`
- **Estensione dottrinale/telemetrica:** `F9T2c3-1`

## Scopo

F9T2c3 non aggiunge né modifica decisioni strategiche. Corregge esclusivamente la riconciliazione degli aggregati telemetrici Expert emersa dai test reali F9T2c2.

Il problema precedente non era la mancanza degli eventi elementari: il turno conteneva le informazioni corrette, ma il riepilogo di modulo perdeva o mescolava parte dei dati quando:

- un record decisionale veniva escluso dal limite di 24;
- un batch di audit conservava soltanto un campione dei dettagli;
- `CLEAR_OCCUPY_FORTIFY` raggiungeva il risultato tramite azioni del fallback;
- scanner diversi condividevano lo stesso aggregato delle ragioni di esclusione.

## Correzioni

### 1. Riepilogo autorevole di fine turno

Gli aggregati di modulo vengono aggiornati una sola volta alla ricezione di `AI_EXPERT_TURN_COMPLETED`, usando il riepilogo runtime completo.

Questo evita doppi conteggi e rende osservabili anche i record scartati dal limite diagnostico.

### 2. Decisioni

Ogni modulo espone:

```text
decisionRecordsTotal
decisionRecordsStored
decisionRecordsDropped
```

Il limite di 24 continua a riguardare soltanto i dettagli conservati. Il totale reale non viene perso.

### 3. Audit candidati

Ogni turno e modulo espongono:

```text
candidateAuditsTotal
candidateAuditsStored
candidateAuditsDropped
```

Il campo legacy `candidateAudits` resta disponibile e coincide con `candidateAuditsTotal`.

Gli audit sono inoltre distinti per scanner:

```text
candidateAuditCountByScanner.relay
candidateAuditCountByScanner.clearOccupyFortify
candidateAuditCountByScanner.forwardPivot
```

### 4. Ragioni di esclusione

Sono disponibili sia l’aggregato generale sia gli aggregati specifici:

```text
candidateRejectionCounts
relayCandidateRejectionCounts
clearCandidateRejectionCounts
forwardPivotCandidateRejectionCounts
```

I batch Relay, Clear e Forward dichiarano ora esplicitamente:

```text
scanner
auditTotal
rejectionCounts
auditRecordsDropped
```

### 5. Conversione territoriale

La telemetria distingue:

```text
psClearedDuringExpertPlan
psClearedDirectlyByExpertStep
psOccupiedAfterClear
psFortifiedAfterClear
```

Esempio:

```text
bersaglio eliminato dal fallback
→ PS occupato durante CLEAR_OCCUPY_FORTIFY
→ psClearedDuringExpertPlan = 1
→ psClearedDirectlyByExpertStep = 0
```

I campi legacy `psCleared` ed `expertPsCleared` vengono riconciliati con `psClearedDuringExpertPlan`, evitando la combinazione contraddittoria `0 clear / 1 occupazione dopo clear`.

### 6. Compatibilità

Restano invariati:

- quattro valutazioni comuni F9T1;
- router monofazione;
- fallback Advanced F9T0;
- Bastion Relay;
- `CLEAR_OCCUPY_FORTIFY`;
- Survival Check;
- Forward Pivot e memoria d’impatto;
- bootstrap simmetrico del primo turno;
- limite di 24 record decisionali;
- regole, carte, costi, statistiche, deck, mappe, Missioni e bilanciamento.

## Criteri di accettazione

- Totale = conservati + scartati per decisioni e audit candidati.
- Somma degli scanner = totale audit candidati.
- Somma delle ragioni per scanner coerente con l’aggregato generale.
- Un clear ottenuto durante il piano viene contato anche se il colpo finale proviene dal fallback.
- Nessun doppio conteggio fra evento elementare e riepilogo di fine turno.
- Nessuna regressione su Relay, Clear, Forward Pivot, bootstrap o Control Center.
