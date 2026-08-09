# Checklist manuale F9T2c3a

## Proprietà temporale

- [ ] Schierare una Pivot al round A.
- [ ] Lasciare scadere la finestra al round B.
- [ ] Produrre un impatto tardivo al round C.
- [ ] Verificare che `WINDOW_EXPIRED` sia nel turno B.
- [ ] Verificare che `LATE_IMPACT` sia nel turno C.
- [ ] Verificare che il turno A non venga mutato retroattivamente.

## Riconciliazione decisioni

Per ogni turno:

- [ ] `decisionRecordsStored == decisions.length`.
- [ ] `decisionRecordsTotal == decisionRecordsStored + decisionRecordsDropped`.
- [ ] `decisionReconciliationOk == true`.
- [ ] `decisionStoredArrayDelta == 0`.
- [ ] `decisionTotalDelta == 0`.

## Audit

- [ ] `auditItems*` conta le valutazioni atomiche.
- [ ] `auditContainers*` conta i batch o record conservati.
- [ ] `auditRecords*` coincide con i container legacy.
- [ ] gli scarti degli audit candidati sono dichiarati.

## Regressioni

- [ ] Bootstrap con iniziativa G1.
- [ ] Bootstrap con iniziativa G2.
- [ ] Bastion Relay.
- [ ] Clear–Occupy–Fortify con colpo finale del fallback.
- [ ] Forward Pivot positivo.
- [ ] Survival Check.
- [ ] Cap di 24 decisioni.
- [ ] Nessun errore pagina o console.

## Prestazioni

- [ ] Registrare `moduleDurationMs` nei test browser.
- [ ] Segnalare ogni superamento del budget da 8 ms senza nasconderlo.
