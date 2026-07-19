# Arena Rubra — C2-STABLE-1-F9O2a-APK-M4c

## Interactive Map Camera Foundation

Baseline validata: **F9O1b**.

F9O2a mantiene la camera F9O2 e corregge il conflitto fra pointer capture e click/tap sulle celle, senza modificare gameplay, IA o bilanciamento:

- trascinamento con mouse e touch;
- zoom continuo con rotellina;
- pinch-to-zoom con due dita;
- mantenimento del punto sotto cursore o dita durante lo zoom;
- soglia fra tap/click e trascinamento, con soppressione del click dopo un pan;
- limiti di spostamento e zoom;
- pulsanti `−`, `Centra`, `Fit`, `+`;
- conservazione della camera manuale durante render e turni bot;
- reset a ogni nuova partita;
- API dedicate al futuro tutorial: `cameraFocusHex`, `cameraFocusUnit`, `cameraFocusHQ`, `cameraSetZoom`, `cameraResetView`, `cameraLockInput`;
- diagnostica `cameraDiagnostics()` e `cameraGetState()`.

La build conserva inoltre temi fazione, mappe, musica dinamica e controlli audio persistenti della baseline F9O1b.
