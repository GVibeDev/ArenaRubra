# F9Q2 — Multiplayer locale e terreni

## Mappe avanzate

### MAP2 — Triumvirato Rubro

- ID `map2_triumvirate`;
- due componenti raggio 6;
- 229 celle;
- tre giocatori FFA;
- quattro PS;
- movimento globale ×2;
- 6 ostacoli, 6 celle difficili, 3 difensive, 4 scoperte;
- due trappole e una mina iniziali.

### MAP3 — Quadrivio Spezzato

- ID `map3_quadrivium`;
- tre componenti raggio 6;
- 265 celle;
- quattro giocatori FFA;
- cinque PS;
- movimento globale ×3;
- 10 ostacoli, 6 celle difficili, 4 difensive, 6 scoperte;
- due trappole e due mine iniziali.

Entrambe le mappe sono connesse, hanno percorsi validi da ogni QG agli obiettivi e superano la validazione senza errori o warning.

## Runtime 2–4 giocatori

Lo stato deriva l’elenco giocatori dalla mappa. Economia, deck, mano, scarti, missioni, telemetria, HUD e turni sono indicizzati dinamicamente da G1 a G4.

L’ordine inizia dal giocatore scelto o casuale e prosegue in modo circolare. Un giocatore eliminato viene saltato. L’occupazione di un QG nemico con almeno un PS controllato elimina il difensore; l’ultimo giocatore attivo ottiene la vittoria. Pressione e spareggio confrontano tutti i giocatori ancora attivi.

La selezione bersaglio dell’IA FFA usa lo stesso percorso comune e valuta minaccia, PS, pressione e distanza. Non sono introdotti bonus di fazione o correzioni di bilanciamento specifiche per MAP2/MAP3.

## Terreni

Il registry è dichiarativo:

| Terreno | Movimento | Occupazione | DEF derivata |
|---|---:|---|---:|
| Libero | 1 | sì | 0 |
| Ostacolo | bloccato | no | 0 |
| Difficile | 2 | sì | 0 |
| Difensivo | 1 | sì | +1 |
| Scoperto | 1 | sì | −1, minimo 0 |

Il pathfinding è pesato e condiviso da umano e IA. Deployment e costruzione rifiutano gli ostacoli. I modificatori DEF sono calcolati al momento del combattimento e non mutano i valori base dell’unità.

Trappole e mine di mappa entrano nello stato come pericoli iniziali distinti, con origine `map`; non sono carte e non cambiano i loro effetti o costi.

## Telemetria e resume

Gli eventi di avvio e lo storico includono ID, nome, revisione, schema, numero celle, utilizzo terreni, giocatori e moltiplicatore movimento. Il salvataggio conserva la definizione attiva, permettendo il resume anche per mappe composite.
