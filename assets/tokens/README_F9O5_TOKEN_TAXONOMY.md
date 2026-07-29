# Arena Rubra — Convenzioni miniature F9O5

Formato raccomandato: **WebP 256×256 con sfondo trasparente**.

## Priorità dei file

### 1. Asset dedicato

```text
assets/tokens/<fazione>/units/<tokenAssetId>.webp
```

Esempio:

```text
assets/tokens/nexus/units/nx2b04.webp
```

### 2. Asset per tipo e classe

```text
assets/tokens/<fazione>/<tipo>/<classe>.webp
```

Tipi: `infantry`, `vehicle`, `structure`, `commander`.  
Classi: `starter`, `light`, `heavy`, `elite`, `pivot`, `commander`.

### 3. Asset per classe

```text
assets/tokens/<fazione>/<classe>.webp
```

### 4. Asset legacy per tipo

```text
assets/tokens/<fazione>/infantry.webp
assets/tokens/<fazione>/vehicle.webp
assets/tokens/<fazione>/structure.webp
assets/tokens/<fazione>/commander.webp
assets/tokens/<fazione>/pivot.webp
```

### 5. Fallback procedurale

Usato quando nessun candidato grafico è disponibile.

## Fazioni

- `nexus`
- `exordium`
- `liberti`
- `agathoi`
- `fabeot`

## Regole

- nomi minuscoli;
- nessuno spazio;
- non cambiare il rapporto 1:1 senza aggiornare il renderer;
- mantenere una zona trasparente sufficiente attorno alla sagoma;
- non incorporare badge, statistiche o colore fazione nell'immagine;
- le varianti future useranno `tokenVariant`, ma F9O5 usa solo la variante 1;
- gli asset dedicati devono usare il `tokenAssetId` registrato in `UNIT_TAXONOMY_F9O5.json`.
