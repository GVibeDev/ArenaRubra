# C2e-4h2 APK-M4c – Full Log Export Microfix

## Obiettivo

Risolvere il limite per cui il registro eventi esportato tramite **Copia log** / **Esporta log .txt** perdeva gli eventi iniziali oltre quota 1000.

Esempio problema precedente: partita con 1276 eventi → export partiva circa dall'evento #276.

## Intervento

In `src/events.js` è stato rimosso il cap automatico a 1000 eventi su `state.events`.

Il registro eventi runtime conserva ora tutti gli eventi della partita. L'export TXT continua a invertire l'array per produrre log cronologico dal primo all'ultimo evento.

## Telemetria export

L'header TXT include ora:

- `EventCount`
- `EventSeqMax`

In una partita nuova e non troncata, i due valori dovrebbero combaciare.

## Perimetro

Nessun cambio a gameplay, AI, deck, bilanciamento, mappa, UI mobile, splash/audio, roster o regola danno.
