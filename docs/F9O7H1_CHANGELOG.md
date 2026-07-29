# Arena Rubra — F9O7h1 Tutorial Visibility Hotfix

Baseline di partenza: `C2-STABLE-1-F9Q3c1-APK-M4c` tramite la candidata F9O7h.

## Correzioni

### Lampeggio reale del pulsante narrativo

- Il pulsante `Avanti` richiesto dai passaggi informativi non usa più soltanto alone e bordo pulsanti.
- L'animazione alterna fasi nettamente visibili e quasi invisibili (`opacity 1 → 0.10 → 1`) con andamento a scatti controllati.
- Il pulsante resta cliccabile durante tutta l'animazione.
- Con `prefers-reduced-motion: reduce` il lampeggio viene sostituito da un'evidenziazione statica ad alto contrasto.

### Anteprima carta realmente sopra lo scrim

- Il solo `z-index` non era sufficiente perché `#boardWrap` usa `isolation: isolate` e crea uno stacking context separato.
- Durante il tutorial le anteprime carta vengono temporaneamente spostate nel `body` tramite un portal DOM.
- Le anteprime usano `position: fixed` e `z-index: 95`, sopra lo spotlight tutorial (`z-index: 94`) e sotto la vignetta narrativa (`z-index: 96`).
- Alla chiusura, interruzione o conclusione del tutorial, gli elementi vengono ripristinati nella posizione DOM originale.

## Invariato

- Testi, passi e condizioni delle cinque lezioni.
- Camera adattiva F9O7h.
- Gameplay, carte, unità, mappe, terreni, Pressione, Missioni e IA.
- Checkpoint e ripresa del tutorial.
