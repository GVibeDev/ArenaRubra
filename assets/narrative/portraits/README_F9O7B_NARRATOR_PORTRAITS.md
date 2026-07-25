# Ritratti narratori tutorial — F9O7b

Formato consigliato: WebP trasparente, 512×512 px, busto o mezzo busto, stessa inquadratura e scala in tutti i frame.

Struttura obbligatoria per il deploy FULL:

```
assets/narrative/portraits/
  exordium/
  nexus/
  agathoi/
  liberti/
  fabeot/
```

Ogni cartella usa gli stessi nomi:

```
neutral.webp
explain.webp
approve.webp
warning.webp
stern.webp
```

La build LITE può omettere i binari. Il runtime prova il frame richiesto, poi `neutral.webp`, poi il placeholder procedurale.
