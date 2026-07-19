# F9O2a — Deployment Click & Pointer Capture Hotfix

## Problema
La camera F9O2 acquisiva il puntatore al `pointerdown`. Nei browser con Pointer Events, la capture poteva ritargettizzare `pointerup` e `click` al contenitore `boardVisualStack`, impedendo al bottone `.hex` di ricevere il click necessario per sbarco, movimento, attacco o targeting.

## Correzione
- Nessuna pointer capture al semplice `pointerdown`.
- La capture viene attivata soltanto quando il movimento supera la soglia di pan.
- Il pinch acquisisce i puntatori quando il gesto a due dita è effettivamente iniziato.
- Tap/click brevi raggiungono normalmente la cella.
- Dopo un vero trascinamento il click fantasma resta soppresso.

Nessuna modifica alle regole o alla logica di sbarco.
