# Arena Rubra – B6b-hotfix Functional Corrections

## Correzioni incluse

### 1. Strozzatura Logistica

`triggerLogisticChoke(attacker)` ora:

- sottrae ENE al giocatore dell'attaccante;
- non scende sotto 0;
- logga l'evento come `ECONOMY_CHANGED`;
- non consuma lo status al primo attacco.

Quindi, se l'unità ha multi-attacco, paga per ogni attacco finché lo stato dura.

### 2. Radura Curativa

Aggiunta:

```js
applyAgathoiRaduraAutoHeal(player)
```

A inizio turno Agathoi, ogni Radura Curativa:

- cerca una fanteria alleata ferita entro R1;
- cura 1 HP;
- lo fa una volta per struttura;
- logga solo se cura effettivamente almeno 1 HP.

### 3. Pivot strutture

`purchaseLimitReached`, `fieldLimitFor`, `limitLabel` e `limitReason` controllano ora:

1. Comandante
2. Pivot
3. Elite
4. Struttura
5. Leggere / Pesanti

Così una struttura Pivot non bypassa più il limite Pivot passando dal limite edifici.

### 4. Sportello Fabeot

Aggiunta:

```js
maybeUseBotPrePurchaseEconomyAbility(player)
```

Il bot Fabeot ora prova a usare `deploymentDiscount` prima di acquistare unità.

### 5. Log strutture AI

`botAct(unit)` intercetta le strutture all'inizio:

- usa eventuale abilità;
- chiude l'azione;
- non cerca movimento.

## Regola di sicurezza

Nessun balancing creativo.
Nessuna nuova unità.
Solo correzioni di comportamento/regola già prevista.
