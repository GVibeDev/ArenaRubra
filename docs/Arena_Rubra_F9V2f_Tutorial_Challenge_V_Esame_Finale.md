# Arena Rubra — F9V2f · Tutorial Challenge V · Esame finale

## Base

- Base validata dall'autore: `C2-STABLE-1-F9V2e-APK-M4c`.
- Riferimento remoto del core verificato: GitHub `main` commit `16537833101b7ff1ffb0c07f72aa180301196003` (F9V2c).
- Target candidato: `C2-STABLE-1-F9V2f-APK-M4c`.

## Obiettivo

La quinta Prova sul campo chiude la progressione Challenge Starter 2.0 con un cambio intenzionale di contratto: **non aggiunge più una regola speciale di scenario**. L'Esame finale lancia una partita completa di Arena Rubra in modalità Rapida sul Campo Starter e considera superata la Prova quando il normale core di gioco assegna la vittoria al giocatore.

Le Prove I–IV isolavano progressivamente combattimento, tenuta territoriale, occupazione QG e Pressione. La Prova V verifica che il giocatore sappia combinare questi sistemi nel match ordinario.

## Scenario

- Mappa: Campo Starter (`map1_starter`).
- Modalità: Rapida / Competitive.
- Giocatore: Exordium, umano.
- Avversario: Nexus, Bot Advanced.
- Comandanti selezionati: Varran (`EX0B00`) contro Avatex (`NXCMD01`).
- Iniziativa deterministica della Prova: giocatore.
- Scala: Tattica.
- Auto-resign: attivo come nel normale percorso di gioco.

Non vengono pre-schierate unità Challenge: all'avvio sono presenti soltanto i QG creati dal normale `newGame()`. Ogni unità deve quindi essere schierata tramite i sistemi ordinari.

## Carte ed economia

La Challenge V non materializza una mano o un deck custom.

Per entrambi i lati usa `selectedDecks.mode = "template"` e lascia lavorare il normale `initializeCardZonesForGame()`:

- deck regolamentare da 30 carte conteggiate;
- mano iniziale normale da 5 carte;
- 25 carte residue nel deck dopo la mano iniziale;
- comandante garantito secondo il contratto della mano iniziale;
- Starter reserve ordinaria della fazione;
- pesca ordinaria;
- scarti ordinari;
- recupero deck ordinario;
- ENE iniziale e income ordinari;
- tattiche, abilità, schieramento e costruzione ordinari.

Il runtime Challenge non forza né rimuove Missioni: l'eventuale stato Missione resta quello prodotto dal normale setup/deck selezionato.

## Contratto di vittoria

L'obiettivo è `win_match`.

La Challenge non duplica `checkVictory()`, non legge il testo del log e non introduce un proprio criterio di vittoria. Aspetta l'evento tipizzato `VICTORY` del core:

- `winner = playerSide` → Esame superato (`match_victory`), indipendentemente dalla condizione core legittima che ha prodotto la vittoria;
- `winner = enemySide` → Esame fallito (`enemy_victory`);
- nessun vincitore / pareggio → Esame fallito (`match_draw`).

Sono quindi valide, se prodotte normalmente dal core, vittoria per QG, Pressione, resa tecnica o altra condizione ufficiale del match. La Challenge non le altera.

## Separazione dai dati competitivi

L'Esame finale resta una Challenge dell'Accademia:

- `tutorialMode = true`;
- `tutorialChallengeMode = true`;
- `matchRecorded = false`.

Quindi il match usa il gameplay completo ma non deve contaminare storico/statistiche competitive.

## HUD dedicato

Il chip Challenge mostra soltanto informazioni di stato già presenti nel core:

- Mano;
- Deck;
- ENE;
- Pressione.

Non contiene un contatore artificiale di completamento: l'unico obiettivo è **Vinci il match**.

## Fuori ambito

- Nessuna modifica a regole QG o Pressione.
- Nessuna modifica a carte, costi, deck ufficiali o Starter reserve.
- Nessuna modifica a Missioni.
- Nessuna modifica a mappe.
- Nessuna modifica ad Advanced/Expert AI.
- Nessun rebalance.
- Nessuna modifica allo storico/statistiche competitive oltre all'esclusione già prevista per le Challenge.
