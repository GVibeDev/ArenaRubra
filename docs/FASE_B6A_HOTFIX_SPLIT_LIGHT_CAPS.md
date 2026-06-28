# Arena Rubra – B6a-hotfix Split Light Caps

## Problema

Il cap delle unità leggere usava un unico recipiente:

```js
activeLightCount(player) >= lightFieldLimit(player)
```

Questo significava:

```text
max 5 leggere totali
```

invece di:

```text
max 5 fanterie leggere + max 5 veicoli leggeri
```

## Correzione

Aggiunto:

```js
function lightBucketCount(player, obj) {
  return activeLightCountByType(player, obj && obj.type);
}
```

Aggiornato `purchaseLimitReached`, `limitLabel`, `limitReason` e `conversionCapAllows`.

## Effetto previsto

- Fanteria leggera e veicolo leggero non competono più nello stesso cap.
- Le strutture leggere restano escluse dal cap leggere.
- QG resta escluso.
- Conversione Fabeot rispetta il cap separato per tipo.

## Regola di sicurezza

Nessuna nuova meccanica.
Solo correzione dell'enforcement del cap leggero già previsto.
