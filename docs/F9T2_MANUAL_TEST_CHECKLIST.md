# Arena Rubra — F9T2 Checklist manuale

## A. Avvio e isolamento

- [ ] La build mostra `C2-STABLE-1-F9T2-APK-M4c`.
- [ ] Il Setup mostra `Expert F9T2 · Exordium pilota`.
- [ ] Con Exordium Expert viene instradato `expert-exordium-f9t2`.
- [ ] Con Nexus, Liberti, Agathoi e Fabeot Expert viene eseguito un solo modulo e il turno ricade su Advanced F9T0.
- [ ] La modalità Advanced continua a ignorare interamente la dottrina F9T2.

## B. Bastion Relay — percorso valido

- [ ] Exordium controlla un PS vuoto.
- [ ] Un builder attivo è adiacente al PS.
- [ ] Bastione Armato è disponibile e pagabile.
- [ ] Esiste una unità mobile entro R2 che può avvicinarsi a un PS non controllato.
- [ ] L’IA seleziona `EXORDIUM_BASTION_RELAY`.
- [ ] L’ENE necessaria resta disponibile prima della costruzione.
- [ ] Il Bastione viene costruito sulla cella del PS.
- [ ] La unità mobile selezionata agisce prima di unità non prioritarie.
- [ ] La distanza dall’obiettivo diminuisce.
- [ ] Il piano termina come `completed` senza fallback.

## C. Abort sicuri

- [ ] Nessun piano quando il QG è occupato o a rischio diretto.
- [ ] Nessun piano su PS già occupato.
- [ ] Nessun piano senza builder legale.
- [ ] Nessun piano senza Bastione disponibile o senza ENE.
- [ ] Nessun piano senza unità mobile liberabile.
- [ ] Se la cella o il builder diventano invalidi, il piano viene abortito e il turno continua.
- [ ] Se non esiste più un movimento in avanti, il piano viene abortito senza loop.
- [ ] La riserva ENE viene azzerata dopo completamento o abort.

## D. Telemetria

- [ ] `expertAi.schemaVersion` resta `F9T1-1`.
- [ ] `expertAi.doctrineSchemaVersion` è `F9T2-1`.
- [ ] Un piano selezionato incrementa `bastionRelayPlans`.
- [ ] La costruzione incrementa `bastionsBuiltOnPs`.
- [ ] Il rilascio incrementa `mobileGuardsReleased`.
- [ ] Sono presenti due `planSteps` nel percorso completo.
- [ ] Gli abort registrano motivo e dettagli.
- [ ] Candidati considerati e scartati non superano il limite.
- [ ] Nessuna sessione Expert resta attiva dopo la fine del turno.

## E. Partite reali

- [ ] Almeno 10 seed Exordium Expert contro Fabeot Advanced/Expert fallback.
- [ ] Iniziativa invertita 5/5.
- [ ] Campo Starter, Plains 2G large e una mappa ×3.
- [ ] Registrare numero di Bastioni sui PS e unità effettivamente liberate.
- [ ] Verificare durata del controllo dei PS fortificati.
- [ ] Verificare round fino al primo impatto della unità liberata.
- [ ] Confrontare movimenti per attacco e celle percorse per eliminazione con Exordium Advanced.
- [ ] Controllare che la dottrina non costruisca Bastioni su PS destinati a essere persi immediatamente.

## F. Prestazioni e regressioni

- [ ] Nessun blocco o crescita persistente della RAM dopo partite lunghe.
- [ ] Nessun aumento importante del tempo massimo di decisione.
- [ ] Nessun evento `AI_EXPERT_BUDGET_EXHAUSTED` sistematico.
- [ ] Nessun loop di acquisto o movimento.
- [ ] Control Center, Pool carte, Card Editor e Map Editor restano funzionanti.
- [ ] Test APK reale: touch, Back, sospensione/ripresa e partita lunga.
