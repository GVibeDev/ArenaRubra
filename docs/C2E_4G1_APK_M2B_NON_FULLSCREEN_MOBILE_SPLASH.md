# Arena Rubra – C2e-4g1 APK-M2b Non-fullscreen Mobile Fit / Splash Shell

Base: C2e-4g1 APK-M2.

## Motivo
Il test APK-M2 ha mostrato che la mappa fullscreen su smartphone è difficile da gestire: mano e pannelli risultano nascosti/off-canvas, lo scroll non è affidabile e la mappa non viene percepita come realmente gestibile.

## Modifiche
- Rimossa la modalità fullscreen obbligata della mappa in landscape mobile.
- Layout mobile landscape a due colonne: mappa adattata a sinistra, mano e comandi/log visibili e scrollabili a destra.
- I pulsanti Mano/Cmd/Opz restano nell'HUD ma diventano scorciatoie verso i pannelli, non drawer off-canvas.
- Conservati fit, reset e zoom leggero della mappa.
- Aggiunto shell splash HTML iniziale, testuale e sostituibile con asset grafici forniti dall'utente.

## Splash screen
La scelta consigliata è splash HTML interno, non dipendente dal converter APK: prima schermata dev/logo, poi in futuro title screen Arena Rubra e musica sbloccata da tap utente.

## Non modificato
Gameplay, AI, deck, tattiche, mappa logica, costi, HP/DEF/ATT e regola danno no-overflow.
