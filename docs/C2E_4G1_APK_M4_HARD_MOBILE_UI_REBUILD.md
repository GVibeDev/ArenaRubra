# Arena Rubra – C2e-4g1 APK-M4 Hard Mobile UI Rebuild

## Base
C2e-4g1 APK-M3b Intro Flow Polish.

## Obiettivo
Correggere la giocabilità smartphone dopo i test M2/M3: pagina troppo grande, scroll instabile, mappa nell'angolo alto sinistro, mano e pannello unità difficili o impossibili da raggiungere.

## Modifiche principali
- UI mobile M4 dedicata, separata dal layout desktop ma sullo stesso motore di gioco.
- Pagina bloccata in mobile: niente scroll globale della pagina durante la partita.
- Mappa centrata in un viewport fisso.
- Rimosso pan/zoom libero come controllo obbligatorio.
- Camera mobile a preset: Fit, Gioca, focus su unità/area corrente.
- Barra mobile compatta: Fit, Gioca, Unità, Mano, Log, Opz.
- Pannelli mobile bottom-sheet con scroll interno:
  - Mano: carte/deck/starter;
  - Unità: unità selezionata, azioni e log;
  - Log: scorciatoia al log dentro il pannello comandi;
  - Opz: opzioni partita.
- Status strip mobile compatta con round, giocatore corrente, ENE, PS e pressione.
- Testi e pulsanti mobile ridotti e più densi.

## Non modificato
- Gameplay.
- AI.
- Deck e regole copie.
- Tattiche.
- Bilanciamento numerico.
- Mappa logica.
- Regola danno normale no-overflow DEF → HP.
- Splash screen e musica M3b.

## Note test APK
Verificare soprattutto:
- mappa centrata e non più confinata in alto a sinistra;
- nessuno scroll pagina globale durante il game;
- Fit/Gioca/Unità/Mano/Log/Opz;
- scroll interno di Mano, Unità/Log e Opzioni;
- selezione unità: apertura pannello Unità e focus camera;
- tap su celle dopo Fit/Gioca;
- comportamento su landscape smartphone reale.
