# Arena Rubra — F9T2d1 Effective Assault Value & Varran Audit Hotfix

## Identità della candidata

- Build candidata: `C2-STABLE-1-F9T2d1-APK-M4c`
- Baseline logica validata: `C2-STABLE-1-F9T2c4-APK-M4c`
- Canale: `f9t2d1-candidate`
- Schema telemetrico principale: `F9Q3e1-2`
- Contratto Expert: `F9T1-1`
- Estensione dottrinale: `F9T2d1-1`
- Modulo Exordium: `expert-exordium-f9t2d1`

F9T2d1 conserva l’esecutore piatto di `EXORDIUM_VARRAN_ASSAULT_CHAIN` introdotto in F9T2d e corregge il criterio che autorizza l’uso di `Ordine di Varran`.

## Problema corretto

In F9T2d la catena veniva eseguita correttamente, ma il selettore trattava DEF e HP come una singola riserva attraversabile. In cinque catene reali, il bonus `+1 ATT` non aveva prodotto alcun danno marginale: l’eccesso contro la DEF era stato perso secondo la regola non perforante ATT → DEF → HP.

F9T2d1 accetta un candidato soltanto quando il bonus modifica direttamente l’esito dell’attacco eseguito dalla catena.

## Risoluzione autorevole dell’attacco

È disponibile una funzione pura:

```text
previewBasicAttackOutcome(attacker, defender, options)
```

L’anteprima usa la stessa semantica del combattimento reale e restituisce almeno:

```text
defDamage
hpDamage
effectiveDamage
targetDestroyed
remainingDef
remainingHp
resolvedTargetId
```

Per ogni coppia attore–bersaglio vengono confrontati:

```text
baseOutcome    = anteprima con ATT base
orderedOutcome = anteprima con ATT base + 1
```

Il valore marginale è:

```text
bonusEffectiveDamage =
    orderedOutcome.effectiveDamage
    - baseOutcome.effectiveDamage
```

Il candidato è valido soltanto se:

```text
bonusEffectiveDamage > 0
```

oppure se il bonus trasforma un non-kill in un’eliminazione immediata reale.

Un bersaglio già eliminabile dall’attacco base viene escluso con:

```text
base_attack_already_kills
```

Un bonus nominale che non cambia il danno effettivo viene escluso con:

```text
no_marginal_bonus_value
```

## Semantica delle eliminazioni

Il campo ambiguo `killEnabled` non è più usato dal contratto F9T2d1. Sono registrati:

```text
baseWouldKill
immediateKillPredicted
immediateKillAchieved
bonusEnabledKill
```

Dopo l’attacco vengono confrontati previsione e risultato autorevole:

```text
predictedBonusEffectiveDamage
actualBonusEffectiveDamage
predictedDefDamage
actualDefDamage
predictedHpDamage
actualHpDamage
predictionMatched
```

L’intercettazione viene risolta prima del confronto finale: la telemetria distingue bersaglio richiesto e bersaglio realmente colpito.

## Perimetro della catena

La catena resta piatta:

```text
selezione bounded
→ riserva di 1 ENE
→ Ordine di Varran
→ eventuale singolo movimento
→ attacco dello stesso attore
→ completamento
```

F9T2d1 non introduce una catena con un secondo attore. Un eventuale follow-up coordinato richiederà un micro-piano separato con prenotazione esplicita.

## Limiti deterministici

Lo scanner valuta al massimo:

- 8 attori Exordium;
- 32 bersagli nemici;
- 24 coppie attore–bersaglio complete;
- un solo movimento prima dell’attacco;
- un solo retarget.

Le celle raggiungibili e le anteprime sono riutilizzate nel turno. I dati territoriali vengono letti dal contesto Expert già costruito.

## Priorità strategica

I fattori territoriali ordinano soltanto candidati che hanno già superato il filtro del valore marginale:

```text
targetOnStrategicPoint
opensPathToStrategicPoint
sameTurnPsCapturePossible
pressureThresholdEnabled
pressureDenialValue
tiebreakUrgency
roundsRemaining
```

Un bersaglio strategico non rende valido un uso dell’abilità con danno marginale nullo.

## Audit autorevoli Varran

Lo scanner `varranAssault` è integrato negli aggregati comuni:

```text
candidateAuditCountByScanner.varranAssault
varranCandidateRejectionCounts
candidateAuditsTotal
candidateAuditsStored
candidateAuditsDropped
auditItemsTotal
```

Ragioni principali:

```text
varran_not_in_play
ability_not_usable
no_realizable_attack_for_actor
base_attack_already_kills
no_marginal_bonus_value
valid_candidate
```

Le decisioni e gli audit pesanti vengono serializzati dopo la misura della durata del modulo, senza alterare l’ordine degli eventi del turno Expert.

## Prestazioni

Il budget del modulo resta `8 ms`; non è stato aumentato.

Nel batch browser dedicato equivalente a uno stato di partita già avviato, cinque esecuzioni consecutive hanno registrato durate comprese fra `1,6 ms` e `3,0 ms`, con zero `AI_EXPERT_BUDGET_EXHAUSTED`.

Le prime invocazioni isolate in Chromium headless possono mostrare varianza JIT. Una regressione Clear avviata a freddo ha inizialmente registrato `8,6 ms`, ma tre ripetizioni indipendenti successive hanno registrato `6,7 ms`, `4,1 ms` e `6,5 ms`, tutte senza esaurimenti. La candidata richiede comunque conferma nel replay completo reale.

## Compatibilità preservata

Restano invariati:

- `CLEAR_OCCUPY_FORTIFY` e Commitment F9T2c4;
- Bastion Relay;
- Relay Survival Check;
- Forward Pivot Deployment;
- bootstrap simmetrico del primo turno;
- proprietà temporale e aggregati F9T2c3a;
- fallback Advanced F9T0;
- carte, costi, statistiche, deck, mappe, Missioni e bilanciamento.

## Criteri di accettazione nel match reale

Replay principale consigliato:

```text
AR-msav9j6q-mfkmt6
```

Per ogni `VARRAN_ASSAULT_CHAIN` selezionata deve valere almeno una delle condizioni:

```text
actualBonusEffectiveDamage > 0
```

oppure:

```text
bonusEnabledKill = true
immediateKillAchieved = true
```

Inoltre:

```text
budgetExhaustions = 0
varranAssault incluso negli audit aggregati
candidate audit riconciliati
nessuna regressione F9T2c4/F9T2c3a
```

È accettabile che lo stesso seed produca zero catene Varran: nessun uso è preferibile a un uso senza valore marginale.
