# Arena Rubra – B7f-hotfix Nexus commander + precheck cleanup

## Problema

Dopo la correzione del `Nodo Comando Nexus` a `type:"Struttura"`, il precheck segnalava:

```text
Fazione senza comandante: Nexus
```

Il precheck era corretto: Nexus non aveva più un blueprint comandante riconosciuto.

## Correzioni

### 1. Avatex aggiunto come comandante Nexus

```js
{
  id:"NXCMD01",
  faction:"Nexus",
  name:"Avatex",
  type:"Comandante",
  role:"commander",
  weight:"Base",
  cost:4,
  hp:4,
  att:3,
  def:3,
  ability:null
}
```

Avatex è provvisorio e meccanicamente valido. Il kit definitivo resta fase di design/balance successiva.

### 2. Nodo Comando Nexus confermato struttura

```js
{
  id:"NX0B00",
  faction:"Nexus",
  name:"Nodo Comando Nexus",
  type:"Struttura",
  role:"command_node",
  weight:"Pesante",
  att:0,
  canAttack:false
}
```

`Protocollo Ripristino` resta invariato.

### 3. Precheck cleanup

- accetta anche `weight:"Leggero"`;
- accetta `incomeDelta` con `affects:"enemy"` come effetto economico offensivo legittimo.

## Regola di design

"Comando" indica la funzione.
"Struttura" indica il tipo meccanico.
"Comandante" resta un blueprint separato.
