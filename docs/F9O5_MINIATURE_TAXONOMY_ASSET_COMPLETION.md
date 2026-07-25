# F9O5 — Miniature Taxonomy & Asset Completion

Build candidata: **C2-STABLE-1-F9O5-APK-M4c**  
Baseline logica: **C2-STABLE-1-F9O4f-APK-M4c**

## Scopo

F9O5 normalizza il roster ufficiale in una tassonomia progettuale unica, separata dal vecchio campo runtime `weight`, e prepara un resolver deterministico per le miniature. La milestone non introduce animazioni delle unità e non modifica le regole di combattimento, movimento, IA o Missioni.

## Tassonomia congelata

| Classe | Costo ENE | Abilità |
|---|---:|---|
| Starter | nessun vincolo generale | nessun cap generale; eccezioni gestite caso per caso |
| Leggera | massimo 2 | massimo una abilità, attiva oppure passiva |
| Pesante | minimo 2, massimo 4 | massimo una attiva e una passiva |
| Elite | minimo 3, massimo 5 | nessun cap |
| Pivot | minimo 4, nessun massimo | nessun cap |
| Comandante | massimo 5 | nessun cap |

La classe è dichiarata esplicitamente. Non viene dedotta dal solo costo, perché le fasce si sovrappongono.

## Traits esclusi dai cap abilità

Le keyword seguenti sono registrate come `traits` e non consumano il limite delle abilità passive:

- Superiorità Numerica;
- Sanguinamento;
- immunità al Sanguinamento;
- Avanguardia;
- Spine.

## Esito dell'audit

- Blueprint verificati: **96**.
- Starter: **15**.
- Leggere: **15**.
- Pesanti: **31**.
- Elite: **20**.
- Pivot: **5**.
- Comandanti: **10**.
- Errori: **0**.
- Avvisi: **0**.

Ogni fazione possiede esattamente uno Starter Fanteria, uno Starter Veicolo e uno Starter Struttura.

## Normalizzazioni approvate

- `AGC1F09` Peribolos Murario: **Pesante**.
- `FBC1F01` Spia Silente: **Elite**.
- `FBC1F06` Matrice Multigenica: **Elite**.
- `AGC1F12` Domos Cosmico: costo ridotto da **6 a 5 ENE**, classe Elite.
- `NXC1F05` Corazzato Posamine: **Elite**.
- `NXC1F06` Barriera Difensiva: **Leggera**.
- `NXC1F07` Barriera Armata: **Starter**; conserva il peso runtime Leggera.
- `NXC1F08` Fabbrica Automatizzata: **Pesante**.
- `NXC1F09` Torre Difensiva: **Elite**.
- `FBPIV01` Cittadella Fabeot: **Elite**, non Pivot.
- `FBC1F04` Architetto Nero: resta la Pivot Fabeot.

## Preset Fabeot riallineati

Per rispettare il limite di una copia per le Elite senza alterare il numero totale di carte:

- **Ex Lucis Tenebrae**: la seconda Spia Silente è sostituita da una seconda copia di **Agente Opportunista** (`FBC1F02`).
- **Cospirazione**: la seconda Spia Silente è sostituita da una seconda copia di **Agente Espropriatore** (`FBC1F03`).

Cittadella Fabeot resta presente in entrambi i preset come Elite. Architetto Nero resta la Pivot.

## Campi aggiunti ai blueprint

```js
{
  unitClass: "heavy",
  unitClassLabel: "Pesante",
  starterRole: null,
  traits: [],
  tokenClass: "heavy",
  tokenAssetId: "nx2b04",
  tokenVariant: 1,
  tokenFallbackClass: "heavy",
  tokenAnimationProfile: "heavy",
  taxonomySchema: "arena-rubra-unit-taxonomy-f9o5-v1"
}
```

Il vecchio `weight` resta disponibile per le regole runtime legacy. In particolare, gli Starter mantengono il peso funzionale utile a cap e interazioni, mentre `unitClass="starter"` guida editor, diagnostica e miniature.

## Resolver miniature

Ordine di risoluzione:

1. asset dedicato all'unità;
2. asset fazione + tipo + classe;
3. asset fazione + classe;
4. classe fallback, quando diversa;
5. asset legacy fazione + tipo;
6. token procedurale.

Esempio:

```text
assets/tokens/exordium/units/exc1f06.webp
assets/tokens/exordium/vehicle/heavy.webp
assets/tokens/exordium/heavy.webp
assets/tokens/exordium/vehicle.webp
fallback procedurale
```

Il caricamento dei candidati superiori avviene in background. L'asset legacy già disponibile può restare visibile come placeholder stabile finché un asset più specifico non è pronto, evitando flicker.

## File diagnostici

- `docs/UNIT_TAXONOMY_F9O5.json`: catalogo completo delle 96 unità.
- `docs/TOKEN_ASSET_COVERAGE_F9O5.json`: candidati e stato di copertura.
- `assets/tokens/README_F9O5_TOKEN_TAXONOMY.md`: convenzioni per gli asset.

La build LITE non contiene i binari delle miniature. Il rapporto di copertura del pacchetto LITE non sostituisce l'audit del deploy FULL.
