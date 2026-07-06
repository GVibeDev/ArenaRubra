# F9K3a2 – Map Hand Overlay Move Units Microfix

Base: `C2-STABLE-1-F9K3a1-APK-M4c`.

## Scopo
Liberare rapidamente QG e area di sbarco bassa, soprattutto per il Giocatore 1, quando l’overlay mano copre la parte inferiore della mappa.

## Cosa cambia
- Aggiunto sotto `Fine turno` il pulsante `Muovi unità`.
- `Muovi unità` riduce temporaneamente l’overlay mano.
- In modalità ridotta resta un mini-comando sul lato destro con:
  - `Mostra mano`
  - `Fine turno`
- `Mostra mano` riapre la mano rapida.
- Cambio turno e selezione carta ripuliscono lo stato ridotto.

## Non modificato
- gameplay
- AI
- deck rules
- bilanciamento
- Card Editor
- Card Pool
- custom art
- coordinate renderer F9K2d
- Starter Logic Freeze
