# F9Q3d2 — Checklist manuale

Build da collaudare: **C2-STABLE-1-F9Q3d2-APK-M4c**  
Baseline di confronto: **C2-STABLE-1-F9Q3d1-APK-M4c**

## 1. Avvio e regressioni di base

- [ ] Aprire la build su desktop e verificare la versione F9Q3d2 nel menu.
- [ ] Avviare una partita 1v1 con deck Starter.
- [ ] Avviare una partita usando un deck custom con Pivot alternativa.
- [ ] Verificare che le nove mappe ufficiali siano ancora selezionabili.
- [ ] Controllare che non compaiano errori visibili o blocchi durante apertura di mano, Missione e pannelli inferiori.

## 2. Comportamento 1v1

- [ ] Giocare **Ex Lucis Tenebrae** in 1v1: l'unico avversario deve essere scelto automaticamente.
- [ ] Giocare **Cospirazione** in 1v1: l'unico avversario deve essere scelto automaticamente.
- [ ] Verificare che non appaia un pannello inutile quando esiste un solo bersaglio valido.
- [ ] Controllare che ENE o mano vengano modificati soltanto sull'avversario.

## 3. Partita FFA a tre giocatori

Mappa consigliata: **Central hotspot**.

- [ ] Preparare G1 Fabeot con Ex Lucis Tenebrae e due avversari attivi.
- [ ] Giocare la Missione e verificare che compaiano entrambi gli avversari.
- [ ] Verificare che il selettore non mostri G1.
- [ ] Scegliere G3 e controllare che soltanto G3 perda metà ENE, arrotondata per difetto.
- [ ] Verificare che la scelta non possa essere annullata dopo il consumo della Missione.
- [ ] Ripetere con Cospirazione scegliendo G2.
- [ ] Controllare che sia G2 a scegliere/scartare le proprie carte quando è umano.
- [ ] Controllare che una Missione o un Comandante in mano non possa essere scartato dall'effetto.
- [ ] Verificare che la mano di G3 rimanga invariata.

## 4. Partita FFA a quattro giocatori

Mappa consigliata: **La Trappola**.

- [ ] Verificare che una ricompensa player-level mostri tre avversari validi.
- [ ] Controllare nomi, fazioni, ENE, PS, Pressione, mano e deck nel selettore.
- [ ] Usare Anatema e verificare che possano essere selezionate unità appartenenti a fazioni avversarie differenti.
- [ ] Verificare che la quota ×1, ×2 o ×3 richieda unità distinte.
- [ ] Controllare che lo stordimento duri un turno del proprietario della singola unità.

## 5. Condizioni Missione FFA

- [ ] **Punto di Ripristino:** enemy_pressure deve considerare l'avversario attivo con Pressione più alta.
- [ ] **Punto di Ripristino:** Pivot e Comandante devono appartenere allo stesso avversario.
- [ ] **Sangue e Sabbia:** una propria unità vicina a qualunque QG avversario attivo deve soddisfare la condizione.
- [ ] **Ultimo Assalto:** le distruzioni di veicoli pesanti causate da avversari differenti devono sommarsi.
- [ ] **Ultimo Assalto:** i tre turni consecutivi devono appartenere allo stesso avversario.
- [ ] **Ultima Possibilità:** le unità perdute contro avversari differenti devono sommarsi.
- [ ] **Primo Verae:** le strutture perdute contro avversari differenti devono sommarsi.
- [ ] **Anatema:** le manipolazioni ENE e le perdite devono aggregarsi correttamente fra avversari.

## 6. Giocatore eliminato

Questa build esclude già i giocatori eliminati dai nuovi bersagli e dalle metriche correnti; la gestione completa del loro stato verrà chiusa in F9Q3d3.

- [ ] Eliminare o marcare come eliminato un giocatore in una partita FFA.
- [ ] Verificare che non compaia più nei selettori delle ricompense Missione.
- [ ] Verificare che le sue unità non siano selezionabili da Anatema.
- [ ] Controllare che la sua Pressione non venga usata da enemy_pressure.
- [ ] Controllare che gli eventi storici già prodotti restino nei contatori cumulativi.

## 7. Bot e automazione

- [ ] Assegnare Ex Lucis Tenebrae a un bot Fabeot e verificare che scelga un avversario valido.
- [ ] Assegnare Cospirazione a un bot Fabeot e verificare il bersaglio scelto.
- [ ] Verificare che un bot bersaglio scarti automaticamente il numero corretto di carte.
- [ ] Verificare che l'IA orienti la Missione Sangue e Sabbia verso il QG avversario attivo più vicino.
- [ ] Verificare che l'IA Anatema consideri le unità di tutti gli avversari attivi.

## 8. Salvataggio e ripresa

- [ ] Salvare mentre è aperta la scelta del giocatore bersaglio di una Missione.
- [ ] Riprendere la partita e verificare che la scelta obbligatoria sia ancora disponibile.
- [ ] Salvare durante la scelta delle carte da scartare di Cospirazione.
- [ ] Riprendere e verificare quantità richiesta, carte eleggibili e selezioni già effettuate.
- [ ] Esportare la diagnostica e controllare la presenza di tutti i giocatori della mappa.

## 9. Android fisico

- [ ] Aprire il selettore del giocatore su schermo verticale.
- [ ] Verificare leggibilità e scorrimento con tre avversari.
- [ ] Toccare ogni scheda senza selezioni accidentali.
- [ ] Completare Ex Lucis Tenebrae, Cospirazione e Anatema.
- [ ] Verificare che il pannello Missione non resti bloccato sopra la mappa.
- [ ] Controllare memoria, fluidità e assenza di chiusure improvvise.

## Criterio di validazione

La candidata è validabile quando 1v1, FFA a tre giocatori e FFA a quattro giocatori completano i flussi sopra senza bersagli errati, softlock o regressioni sui deck, sulle carte e sulle mappe.
