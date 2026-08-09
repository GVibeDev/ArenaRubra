# Arena Rubra — Checklist manuale F9T2c3

Build: `C2-STABLE-1-F9T2c3-APK-M4c`

## Partita Expert

- [ ] Avviare Exordium Expert contro una fazione diversa.
- [ ] Esportare telemetria dopo almeno 15 round.
- [ ] Verificare `doctrineSchemaVersion = F9T2c3-1`.
- [ ] Verificare che ogni turno abbia `candidateAuditsTotal`, `candidateAuditsStored`, `candidateAuditsDropped`.
- [ ] Verificare `total = stored + dropped`.
- [ ] Verificare che la somma di `candidateAuditCountByScanner` coincida col totale.
- [ ] Verificare la presenza degli aggregati Relay/Clear/Forward separati.
- [ ] Verificare che `decisionRecordsTotal = stored + dropped`.

## CLEAR_OCCUPY_FORTIFY

- [ ] Esercitare un clear completato direttamente da un passo Expert.
- [ ] Esercitare un clear completato da un attacco del fallback.
- [ ] Nel secondo caso verificare `psClearedDuringExpertPlan = 1` e `psClearedDirectlyByExpertStep = 0`.
- [ ] Verificare che `psCleared` non resti a zero quando il PS viene occupato dopo il clear.

## Regressioni

- [ ] Bastion Relay completa `move_guard → build_bastion`.
- [ ] Survival Check continua a valutare tutti i Bastioni su PS.
- [ ] Forward Pivot produce impatto entro la finestra nello scenario controllato.
- [ ] Iniziativa G1/G2 non genera turni Expert orfani.
- [ ] Nessun errore console o page error.
- [ ] Nessun aumento evidente di RAM nel corso della partita.
