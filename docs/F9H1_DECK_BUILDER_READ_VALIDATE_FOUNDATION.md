# F9H1 – Deck Builder Read/Validate Foundation

Base: `C2-STABLE-1-F9G-APK-M4c Camera Foundation`.

Build: `C2-STABLE-1-F9H1-APK-M4c`.

## Scopo

Questa patch apre la sottofase F9H del Deck Builder con una fondazione prudente e non invasiva.

La schermata `Costruisci deck` diventa reale, ma resta in modalità read/validate:

- legge il catalogo carte già esistente;
- permette di scegliere fazione;
- permette di scegliere comandante;
- mostra le carte starter escluse dal deck;
- mostra il pool legale della fazione;
- mostra il template deck generato automaticamente;
- mostra regole copie e validazione;
- permette di copiare un report JSON.

## Regola importante

F9H1 non salva deck personalizzati e non li usa in partita.

Il gameplay continua a usare il flusso esistente di inizializzazione deck. Questa patch serve a verificare dati, pool, template e regole prima di introdurre editing/salvataggio.

## Non modificato

Nessuna modifica a:

- gameplay;
- AI;
- deck rules;
- effetti tattiche;
- mappa;
- roster;
- costi;
- HP/DEF/ATT;
- splash/audio;
- UI mobile di partita;
- regola danno no-overflow.

## Test consigliati

1. Splash → Menu.
2. Aprire `Costruisci deck`.
3. Cambiare fazione.
4. Cambiare comandante.
5. Verificare che il template resti a 30 carte.
6. Verificare che comandante/pivot/elite non superino 1 copia.
7. Verificare che le altre carte/tattiche non superino 2 copie.
8. Verificare che gli starter mostrati siano esclusi dal deck.
9. Copiare report JSON.
10. Tornare al menu.
11. Avviare una nuova partita e verificare che gameplay/deck/hand siano invariati.
