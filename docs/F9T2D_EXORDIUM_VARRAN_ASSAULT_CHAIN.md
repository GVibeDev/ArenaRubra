# Arena Rubra — F9T2d Exordium Varran Assault Chain

## Stato

- Build candidata: `C2-STABLE-1-F9T2d-APK-M4c`
- Baseline ufficiale di partenza: `C2-STABLE-1-F9T2c4-APK-M4c`
- Schema Expert: `F9T2d-1`
- Modulo Exordium: `expert-exordium-f9t2d`
- Stato: candidata da collaudare in match reale.

## Problema affrontato

Nei match telemetrici precedenti Varran poteva restare sul campo per molti round senza usare la propria abilità o senza collegarla a un attacco concreto. Il nuovo micro-piano non tenta di rendere Varran genericamente più aggressivo: lega una sola abilità a una singola azione offensiva verificabile.

## Identità del micro-piano

```text
EXORDIUM_VARRAN_ASSAULT_CHAIN
```

Sequenza:

```text
use_varran_order
→ execute_varran_assault
```

Il piano viene selezionato dopo i piani territoriali e dopo il Forward Pivot. Non sostituisce il fallback Advanced.

## Generazione del candidato

Il modulo richiede contemporaneamente:

1. Varran in campo, vivo e non già consumato;
2. abilità `varranOrder` disponibile;
3. ENE sufficiente;
4. rischio QG diverso da `direct` e `occupied`;
5. almeno un alleato Exordium legale entro il raggio dell'abilità;
6. almeno un bersaglio nemico attaccabile immediatamente o dopo un solo movimento;
7. bonus ATT capace di produrre danno effettivo aggiuntivo.

L'abilità non viene prenotata quando il danno base eliminerebbe già il bersaglio.

## Ordinamento bounded

La scansione è limitata a:

- 8 attori alleati;
- 32 bersagli nemici;
- 24 opzioni complete.

Il punteggio considera:

- valutazione dell'attacco già usata dall'Advanced;
- danno incrementale del bonus;
- eliminazione resa possibile dal bonus;
- presidio di PS o centro;
- Comandanti e Pivot nemiche;
- costo del movimento necessario.

Non esistono ricerca ricorsiva, albero di attacchi o simulazione del turno avversario.

## Esecuzione

### Passo 1 — Ordine

Varran usa `Ordine di Varran` sull'attore prenotato. Il modulo verifica:

- disponibilità dell'abilità;
- legalità del bersaglio alleato;
- pagamento dell'ENE;
- incremento reale dell'ATT.

Se il bonus non viene applicato, il piano abortisce con una ragione esplicita.

### Passo 2 — Assalto

L'attore prenotato:

- attacca immediatamente se già adiacente;
- altrimenti compie il singolo movimento pianificato;
- verifica nuovamente legalità e disponibilità dell'attacco;
- esegue l'attacco;
- completa il micro-piano.

## Retarget bounded

Se il bersaglio originario scompare dopo l'uso dell'abilità, è permesso un solo retarget.

Il retarget valuta il bonus già applicato all'attore. Non aggiunge virtualmente un secondo `+1 ATT`. Il nuovo bersaglio conserva:

- danno corrente reale;
- contributo effettivo del buff già presente;
- eventuale eliminazione resa possibile dal buff;
- un solo movimento legale.

Dopo una riassegnazione non vengono aperte ulteriori ricerche.

## Priorità e abort

Restano superiori:

1. vittoria immediata;
2. rischio QG `direct` o `occupied`;
3. piani territoriali `CLEAR_OCCUPY_FORTIFY` e `BASTION_RELAY`;
4. `FORWARD_PIVOT_DEPLOYMENT`.

Cause di arresto principali:

- Varran o attore non disponibili;
- abilità non più legale;
- ENE insufficiente;
- bersaglio scomparso senza sostituto;
- movimento previsto non più legale;
- attacco non più disponibile;
- emergenza QG.

## Telemetria

Decisioni:

- `varran_assault_scan`;
- `varran_assault_order_committed`;
- `varran_assault_target_reassigned`;
- `varran_assault_executed`.

Metadati comuni:

```text
source = expert_exordium_f9t2d
decisionLayer = expert_microplan
featureOrigin = varran_assault_chain
featureRevision = F9T2d
```

Aggregati:

```text
varranAssaultPlans
varranAssaultScans
varranAssaultOrdersCommitted
varranAssaultTargetsReassigned
varranAssaultsExecuted
```

## Invarianti preservate

F9T2d non modifica:

- statistiche o testo delle carte;
- costi di abilità;
- deck, roster e regole di copia;
- mappe e condizioni di vittoria;
- Clear Occupation Commitment F9T2c4;
- Bastion Relay e Survival Check;
- Forward Pivot;
- bootstrap Expert;
- aggregati e proprietà temporale della telemetria;
- Control Center, Pool carte ed editor.

## Criteri di accettazione in match reale

Un caso positivo deve mostrare:

```text
Varran pronto
→ candidato con attore e bersaglio identificati
→ Ordine di Varran applicato
→ attore prenotato prioritario
→ attacco nello stesso turno
→ danno effettivo
→ piano completato
```

Controlli minimi:

- nessun uso dell'abilità senza un attacco realizzabile;
- `varranAssaultPlans = 1` nel caso positivo;
- `varranAssaultOrdersCommitted = 1`;
- `varranAssaultsExecuted = 1`;
- ENE spesa riconciliata;
- bersaglio e danno registrati;
- nessun budget exhaustion;
- nessuna regressione sui piani precedenti.
