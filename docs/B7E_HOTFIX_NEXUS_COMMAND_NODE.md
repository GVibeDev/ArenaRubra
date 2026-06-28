# Arena Rubra – B7e-hotfix Nexus Command Node classification

## Bug

`Nodo Comando Nexus` era classificato come:

```js
type: "Comandante"
```

ma per design deve essere un edificio/nodo infrastrutturale Nexus.

## Correzione

Blueprint `NX0B00` aggiornato a:

```js
type: "Struttura",
role: "command_node",
weight: "Pesante"
```

## Nota di design

"Comando" descrive la funzione.
"Struttura" descrive il tipo meccanico.

## Effetti attesi

Il Nodo Comando Nexus:

- conta nel cap strutture;
- viene incluso tra le strutture alleate;
- estende le aree di sbarco se le strutture lo permettono;
- è bersagliabile come struttura;
- non conta come comandante;
- non occupa slot comandante;
- non viene selezionato da logiche comandante;
- non viene mosso dall'AI;
- mantiene `Protocollo Ripristino`.

## Nessun cambio intenzionale

Non sono state modificate AI, economia, movimento, tattiche, combat o abilità.
È una correzione di classificazione blueprint.
