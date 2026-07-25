# F9Q3 — Editor mappe e terreni

## Flusso

L’editor è una schermata separata raggiungibile dal menu. Carica una copia di lavoro di una mappa integrata, una mappa custom salvata oppure uno dei quattro modelli: singolo, doppio, triplo e vuoto.

Le mappe integrate sono protette. Possono essere ispezionate o duplicate in una bozza custom, ma non sovrascritte né eliminate.

## Strumenti

- **Ispeziona**: mostra coordinate, terreno, ruolo e pericolo.
- **Cella**: aggiunge o rimuove celle esplicite.
- **Terreno**: assegna libero, ostacolo, difficile, difensivo o scoperto.
- **Ruolo**: assegna normale, PS o QG G1–G4.
- **Pericolo**: assegna nessuno, trappola o mina.

Ogni componente espone raggio, origine cubica e rotazione. L’origine Z è derivata da X e Y per conservare `x+y+z=0`; la rigenerazione unisce e deduplica le celle coincidenti.

Le modifiche possono applicare nessuna simmetria, replica rispetto ai QG, replica radiale a 3/4 settori, specchio, rotazione 180° o rotazione 60°. Il passaggio del puntatore mostra l’anteprima. Coordinate mancanti e ruoli protetti vengono saltati e segnalati; l’intera replica crea una sola voce annulla/ripeti. Pan, zoom, doppio clic per aggiungere una cella e comando Adatta permettono di lavorare su geometrie estese.

## Persistenza

Le mappe custom valide vengono salvate nello storage `arenaRubra.maps.v1`, con revisione e timestamp aggiornati. L’export produce JSON leggibile; l’import normalizza, valida e assegna un nuovo ID in caso di conflitto.

Il pulsante **Avvia nel Match Lab** salva la bozza valida e apre il setup con la mappa già selezionata.

## Validazione live

Il pannello laterale riporta errori e warning a ogni modifica. Una mappa non valida non può essere salvata o avviata. I controlli coprono:

- schema, moltiplicatore di movimento e coordinate cubiche;
- duplicati e limite celle;
- terreni e pericoli riconosciuti;
- numero, unicità e posizione dei QG;
- deployment valido;
- PS validi e non sovrapposti ai QG;
- connettività percorribile e raggiungibilità;
- strozzature a cella singola;
- coerenza della simmetria dichiarata.

## Sicurezza dati

Testo e ID vengono normalizzati, gli array sono limitati e le mappe importate perdono sempre i privilegi `official`. La definizione usata nel match è una copia serializzabile, non un riferimento mutabile al progetto nell’editor.
