# Arena Rubra — F9T2d2

## Clear Effective Damage Preview Hotfix

**Build candidata:** `C2-STABLE-1-F9T2d2-APK-M4c`  
**Baseline ufficiale preservata:** `C2-STABLE-1-F9T2c4-APK-M4c`  
**Estensione telemetrica:** `F9T2d2-1`  
**Modulo Exordium:** `expert-exordium-f9t2d2`

## Problema corretto

Il selettore di `CLEAR_OCCUPY_FORTIFY` poteva accettare una sequenza confrontando la somma nominale degli ATT con una quantità assimilabile a `HP + DEF`.

Questo modello non è compatibile con il combattimento Starter non perforante:

```text
se DEF > 0:
    l'attacco riduce soltanto la DEF
    l'eccesso di ATT viene perso

se DEF = 0:
    l'attacco riduce gli HP
```

Di conseguenza, un attacco con ATT 4 contro un bersaglio con DEF 1 e HP 3 non elimina il bersaglio: rimuove un solo punto DEF e perde i tre punti eccedenti.

## Soluzione

F9T2d2 applica al Clear la stessa anteprima pura ATT→DEF→HP già validata per Varran in F9T2d1.

Per ogni presidio su PS:

1. costruisce lo stato iniziale autorevole di DEF e HP;
2. valuta soltanto attaccanti legalmente capaci di colpire il bersaglio;
3. simula gli attacchi in sequenza;
4. aggiorna DEF e HP dopo ciascun attacco;
5. seleziona al massimo tre attaccanti;
6. accetta il candidato soltanto se `predictedTargetDestroyed = true`.

La selezione resta greedy e bounded. Non esegue alberi combinatori, simulazioni multi-turno o pathfinding congiunto.

## Vincoli operativi

- massimo tre attaccanti;
- esclusione degli attacchi intercettati da un bersaglio diverso dal presidio;
- builder e occupanti distinti dagli attaccanti riservati;
- una sola ricomposizione bounded della sequenza;
- commitment territoriale F9T2c4 preservato;
- priorità QG, Bastion Relay, Forward Pivot e Varran preservate.

## Piano e telemetria

Il piano registra:

```text
predictionModel = ATT_DEF_HP_NON_PIERCING
clearPredictedDefDamage
clearPredictedHpDamage
clearPredictedRemainingDef
clearPredictedRemainingHp
clearPredictedTargetDestroyed
clearRequiredAttackerIds
clearRequiredAttackCount
clearExecutedAttackerIds
clearActualDefDamage
clearActualHpDamage
clearActualTargetDestroyed
clearPredictionMatched
clearAttackSequenceRecomputed
```

Decisioni dedicate:

- `clear_effective_damage_step`;
- `clear_effective_damage_sequence_result`;
- `clear_attack_sequence_recomputed`.

Ragioni di esclusione dedicate:

- `insufficient_hp_damage_after_def_break`;
- `no_effective_kill_sequence`.

## Ricomposizione bounded

Se un attaccante richiesto diventa indisponibile prima del proprio passo:

1. il modulo legge lo stato corrente del bersaglio;
2. esclude gli attaccanti già eseguiti;
3. calcola una sola sequenza sostitutiva entro il limite residuo di tre attacchi;
4. aggiorna passi e riserve;
5. abortisce senza consumare ulteriori azioni quando non esiste più una sequenza letale.

## Compatibilità preservata

- `VARRAN_ASSAULT_CHAIN` F9T2d1;
- Clear Occupation Commitment F9T2c4;
- proprietà temporale e audit F9T2c3a;
- Bastion Relay e Survival Check;
- Forward Pivot;
- bootstrap Expert per entrambe le iniziative;
- fallback Advanced F9T0;
- Control Center, Pool carte, Card Editor e Map Editor.

## Stato

F9T2d2 è una candidata da collaudare in match reale. Non sostituisce la baseline ufficiale finché non viene validata dall'utente.
