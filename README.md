# Arena Rubra — C2-STABLE-1-F9T0-APK-M4c

Candidata **F9T0 — Advanced AI Finalization · Expert AI Preparation** basata sulla baseline validata `C2-STABLE-1-F9U3-APK-M4c`.

## F9T0 — finalizzazione IA avanzata

- Le soglie strategiche della Pressione leggono `pressureRuleProfile().requiredPs` e il controllo del PS centrale: sulle mappe da 7+ PS l’IA non interpreta più due PS come una posizione di chiusura.
- I presidi usano un **budget dinamico di guarnigione**. PS minacciati, centrale e close-pressure lock restano protetti; PS sicuri possono liberare unità per espansione e finalizzazione.
- Rimosso il doppio conteggio delle dottrine di fazione e il richiamo duplicato verso i PS Agathoi. La valutazione del movimento non somma più due volte gli stessi attrattori.
- Nexus dispone dello stato `network_mature`: quando rete, copertura e massa mobile sono sufficienti, riduce l’ammassamento statico e proietta unità verso PS avversari e QG.
- Agathoi dispone dello stato `green_line_mature`: una linea verde stabilizzata smette di comportarsi come se fosse costantemente in svantaggio e autorizza avanzata, conquista e pressione.
- Memoria leggera per round e per unità rileva stallo e oscillazioni. I ritorni ripetuti sulla cella precedente vengono penalizzati; l’avanzamento reale, i PS ostili e la riduzione della distanza dal QG vengono premiati.
- La scelta discrezionale del movimento confluisce in un **unico passaggio di scoring** con stato strategico e contesto condivisi. Le azioni deterministiche immediate, come una vittoria QG già disponibile, restano prioritarie.
- Il futuro grado **Expert AI** non è ancora implementato: F9T0 prepara una base più coerente, misurabile e meno ridondante, evitando di moltiplicare scansioni e rescoring prima dell’introduzione di pianificazione più complessa.
- Nessuna modifica a regole, carte, statistiche, deck, mappe, Missioni, targeting, bilanciamento o schema telemetrico `F9Q3e1-2`.

## Fuori ambito F9T0

- Nessun minimax, Monte Carlo o albero ricorsivo.
- Nessun nuovo grado IA selezionabile.
- Nessun rebalance delle fazioni o delle carte.
- Nessuna modifica ai dati ufficiali di mappe e deck.

---

## Storico build conservato

Candidata correttiva **Inspector, Hand Alignment & Header Controls Hotfix** basata sulla baseline validata `C2-STABLE-1-F9Q3e1a-APK-M4c` e sulla candidata F9U1a.

## F9U1a1 — correzioni UI pre-validazione

- Inspector dell’unità selezionata disposto in colonna: carta grande, abilità principale, tabella HP/DEF/ATT, abilità attive/passive e pulsanti Muovi, Costruisci, Fine turno.
- Overlay della mano spostato verso sinistra per risultare più centrato rispetto alla mappa.
- Controlli Carte animate, Miniature FX ed Effetti allineati affiancati su una riga separata da musica e volume.
- Nessuna modifica a carte, 50 deck ufficiali, mappe, regole, IA o schema telemetrico `F9Q3e1-2`.


Candidata **Telemetry Attribution & Pivot Instances Hotfix** basata sulla candidata F9Q3e1 e sulla baseline validata `C2-STABLE-1-F9S1c1-APK-M4c`.

## F9Q3e1a — correzione attribuzione telemetrica e Pivot multi-istanza

- Schema telemetrico versionato `F9Q3e1-2`, inizializzato all’avvio e chiuso con la partita.

- Correzione `PS_CONTROL_CHANGED`: usa `nextControl`/`previousControl`, non crea più il giocatore neutrale `side: 0` e conserva una timeline PS nella telemetria principale.
- Tracciamento Pivot per singola istanza (`unitId`): più schieramenti della stessa Pivot mantengono deployment, distruzione, sopravvivenza, attacchi, abilità e danni separati.
- Campi Pivot compatibili aggregati su tutte le istanze; `pivotDestroyedRound` indica l’ultima distruzione e `pivotSurvivalRounds` la sopravvivenza cumulativa.
- Sovrapesca contabilizzata una sola volta dall’evento di scarto; gestita anche la carta rubata inviata direttamente agli scarti per mano piena.
- Identità esatta dei deck: ID, nome, fazione, Comandante, Pivot, Missione, archetipo, 30 carte, rapporto unità/tattiche e ENE media.
- Seed match esplicito e RNG `mulberry32` riproducibile per iniziativa, mescolamento e selezioni casuali di gameplay.
- Telemetria ENE: entrate, spese, perdite, furti, blocchi, penalità income ed ENE inutilizzata a fine turno.
- Telemetria carte: pesca, gioco, scarto, furto, copia, blocco, overdraw, recupero deck e contatori per carta.
- Diagnostica dei turni: nessuna carta giocata, vera mano morta e carte giocabili lasciate inutilizzate sono casi distinti.
- Ciclo di vita Pivot: pesca, schieramento, distruzione, sopravvivenza, danni, attacchi e abilità.
- Missioni: progresso, prontezza, gioco, completamento, ricompensa e impossibilità a fine partita.
- Combattimento, PS, Pressione, eliminazioni e durata dei turni inclusi nel record.
- Snapshot JSON copiabile e persistenza completa nello storico locale della partita.
- Pannello diagnostico compatto nel menu statistiche.
- Nessuna modifica a carte, 50 deck ufficiali, mappe, soglie o regole validate.

## F9S1c1 — roster ufficiale e Deck Builder

- Libreria ufficiale visibile composta da 50 deck: 40 tattici v0.1 e 10 deck Missione conservati.
- Distribuzione congelata: 10 deck per fazione e 5 per ciascuno dei 10 Comandanti.
- Le 40 liste tattiche derivano dal documento `Decks.pdf` e restano candidati da bilanciare tramite test reali e bot-vs-bot.
- Le quindici carte Starter restano escluse dal deck. Le 142 copie presenti nelle bozze sono state sostituite privilegiando costo ENE, legalità delle copie e identità dell'archetipo.
- I tre preset legacy esterni al roster sono stati eliminati dalla libreria integrata.
- Deck Builder: toolbar principale compatta, strumenti JSON raccolti in un pannello avanzato, controllo `− quantità +` nella stessa casella, deck disponibili mostrati come pulsanti con il solo nome e scheda dettagli separata.
- Pannello analisi live con ENE media, curva 0–7, unità, tattiche, strutture, Missioni e proporzione unità/tattiche.
- Nessuna modifica al gameplay, alle carte o alle regole FFA validate in F9Q3d4.

## F9Q3d4 — attribuzione FFA

- Registro deterministico della provenienza del danno per unità, sorgente, giocatore, round e tipo di effetto.
- Eliminazione unità assegnata alla fonte ostile dell’ultimo danno; gli altri contributori ostili recenti ricevono assist.
- Finestra assist unità: 2 round. I contributi scaduti non producono assist.
- Classificazione separata per danno diretto, persistente, pericolo/mina, reazione/Spine, indiretto, autodistruzione e causa non attribuita.
- Mine possedute, Sanguinamento e Spine conservano la sorgente corretta. Autodistruzioni, pericoli neutrali e concessioni non assegnano eliminazioni arbitrarie.
- Eliminazioni giocatore registrano responsabile, assist, motivo e tipo di attribuzione.
- Finestra assist eliminazione giocatore: 3 round, basata su ostilità recente derivata da eliminazioni e assist contro quel giocatore.
- La Pressione emette una valutazione tipizzata per round con giocatori attivi, eliminati, qualificati, pareggi e giocatore avanzante.
- I giocatori eliminati restano nello storico ma sono esclusi dalla valutazione attiva della Pressione.
- Statistiche, cronologia partita ed export includono danni inflitti, eliminazioni unità, assist, eliminazioni giocatore, assist eliminazione e timeline Pressione.
- Conservato il campo legacy `destroyedBySide` per compatibilità con log, Missioni e test precedenti.
- Nessuna modifica ai valori di danno, alle soglie della Pressione, alle carte, ai deck o alle mappe.

## F9Q3d3 — ciclo dei giocatori eliminati

- Stato centralizzato `active`, `eliminated`, `winner` per tutti i giocatori runtime.
- Eliminazione atomica: unità e strutture del giocatore lasciano il campo; il QG resta come riferimento della mappa ma viene marcato inattivo.
- Controllo PS aggiornato immediatamente; Pressione ed ENE storiche restano disponibili per statistiche ma il giocatore non partecipa più alle regole attive.
- Mine, effetti cella e blocchi PS creati dal giocatore eliminato vengono rimossi; eventuali pericoli iniziali della mappa vengono neutralizzati e conservati.
- Stati ed effetti economici con proprietario/caster eliminato terminano; lock ENE/mano e cooldown del giocatore vengono azzerati.
- Selezioni bersaglio e ricompense Missione pendenti vengono filtrate o chiuse senza softlock.
- Il turno salta i giocatori eliminati senza chiamate ricorsive e risolve il confine round una sola volta.
- Le carte già rubate e le unità già convertite restano al possessore corrente; le zone carte dell’eliminato restano congelate per log e diagnostica.
- Nessuna modifica ai deck ufficiali.

## F9Q3d2 — semantica FFA di effetti e Missioni

- Tutte le Missioni valutano gli avversari attivi senza assumere il solo giocatore 2.
- Le metriche cumulative aggregano eventi validi causati da qualsiasi avversario.
- Le condizioni di stato usano `any_active`, `max_active` o `same_active_enemy` in modo dichiarato nei dati.
- Le serie su turni nemici sono tracciate separatamente per ciascun avversario: un giocatore deve soddisfare la condizione per i propri turni consecutivi.
- Le ricompense Fabeot `Ex Lucis Tenebrae` e `Cospirazione` richiedono la scelta esplicita dell’avversario in FFA; in 1v1 e per i bot la scelta è automatica e deterministica.
- `Anatema` può stordire unità appartenenti a qualsiasi avversario attivo.
- Tracker, IA, diagnostica e stato delle ricompense supportano dinamicamente 2–4 giocatori.
- Giocatori eliminati non sono bersagli validi né contribuiscono alle metriche di stato correnti.
- Nessuna modifica ai deck ufficiali.


## F9S1b1 — selezione deck custom e nuove mappe ufficiali

- Baseline validata: `C2-STABLE-1-F9S1b-APK-M4c`.
- Nel Setup, la modalità deck salvato mostra tutti i deck disponibili per la fazione, non soltanto quelli associati al comandante già selezionato.
- Quando viene scelto un deck salvato, il Setup sincronizza automaticamente il comandante contenuto nel deck e impedisce combinazioni incoerenti.
- Restano attive la validazione da 30 carte, il massimo di una Pivot, il limite Missione e tutti i limiti di copia.
- Aggiunte come mappe ufficiali `Central hotspot`, `Plains 2G large` e `La Trappola`.
- Gli sfondi incorporati nei tre JSON sono stati estratti senza ricompressione e inclusi come asset WebP statici.
- Le mappe sono abilitate, non modificabili, dotate di PS centrale semantico ed equidistante dai QG.

## F9S1b — Pivot alternative e pool completi

- Baseline validata: `C2-STABLE-1-F9S1a-APK-M4c`.
- Aggiunta una Pivot alternativa per Nexus, Exordium, Liberti, Agathoi e Fabeot.
- Ogni fazione dispone di 40 carte esatte: 23 unità, 14 tattiche e 3 Missioni.
- Rimane il limite di una sola Pivot complessiva per deck.
- I deck ufficiali non sono stati modificati; saranno ricostruiti in F9S1c dopo il completamento del pool.
- Le nuove Pivot mantengono le associazioni grafiche validate nel ciclo F9S1b.

### Pivot alternative integrate

- **Nexus — UCB Unità Corazzata da Battaglia:** Tramonto riduce la DEF corrente dei nemici adiacenti a fine turno; Trappola blocca il movimento dei nemici adiacenti.
- **Exordium — Mech d’Assalto:** Corazza Reattiva riduce il danno immediato da abilità e tattiche nemiche; Soppressione colpisce una linea valida di tre celle entro R2.
- **Liberti — Camion Corazzato:** gli attacchi base applicano Sanguinamento 2; Schianto infligge danni pari agli HP correnti e indebolisce prima i bersagli Pesanti.
- **Agathoi — Giganthropos:** Spine 2; Erkos infligge danno e applica Inibizione Movimento.
- **Fabeot — La Torre dell’Architetto:** amplifica di 1 ogni evento di danno contro nemici adiacenti; Bonifica colpisce due celle adiacenti entro R2.

## F9S1a — contenuti integrati

- 14 nuove unità: 3 Nexus, 3 Exordium, 5 Liberti e 3 Fabeot;
- 11 nuove tattiche: 2 Nexus, 2 Exordium, 5 Agathoi e 2 Fabeot;
- roster finale: 22 unità e 14 tattiche da deck per ciascuna fazione;
- runtime per movimento raddoppiato, riparazioni HP/DEF, bombardamenti multi-cella, attentato suicida, movimento dopo attacco, colpo che ignora DEF, sconti/sbarchi da struttura una volta per turno, Visione permanente, Furia Verde, mine doppie, doppio Custode e colpi sequenziali;
- Pool carte, Card Renderer, Deck Builder e IA collegati ai nuovi contenuti;
- deck ufficiali lasciati intenzionalmente invariati in attesa delle ultime carte.

## Baseline ereditata: F9R3 — Proportional Pressure & Official Map Set

La candidata conserva integralmente la baseline validata `C2-STABLE-1-F9R3-APK-M4c`.

F9R3 sostituisce le precedenti soglie fisse/percentuali della Pressione con un profilo proporzionale alla mappa e al numero di giocatori.

Sia:

```text
C = ceil((PS totali + giocatori) / 2)
```

Preset **Standard**:

- inizio Pressione: round `20 + C`;
- vittoria per Pressione: 7 incrementi;
- limite partita: round 50.

Preset **Rapida/Competitive**:

- inizio Pressione: round 20;
- vittoria per Pressione: 5 incrementi;
- limite partita: round `30 + C`.

Per ottenere un incremento bisogna controllare:

- il PS centrale designato della mappa;
- almeno `ceil(PS totali / 2)` PS complessivi, con il PS centrale incluso nel conteggio.

Se più giocatori soddisfano contemporaneamente il requisito, nessuno avanza in quel round.

## PS centrale semantico

Ogni mappa attiva possiede un solo `centralStrategicPointId`. Il PS indicato deve:

- esistere nell’elenco dei PS;
- avere ID univoco;
- essere collocato su una cella valida;
- risultare equidistante in linea retta da tutti i QG, usando la distanza esagonale cubica e ignorando terreni e percorsi.

Il runtime, l’IA, le Missioni, la camera e l’Editor usano lo stesso riferimento semantico. Il validatore blocca mappe con centro mancante, ambiguo o non equidistante.

## Mappe ufficiali attive

| ID | Nome | Giocatori | Celle | PS | Centro | Movimento | Standard | Limite Rapida |
|---|---|---:|---:|---:|---|---:|---:|---:|
| `map1_starter` | Campo Starter | 2 | 127 | 3 | `[0,0,0]` | ×1 | R23 | R33 |
| `custom_single_ms0nf51r` | Diamond 4 | 4 | 469 | 9 | `[0,0,0]` | ×3 | R27 | R37 |
| `map1_starter_copy` | Claustro Clash | 4 | 127 | 7 | `[0,0,0]` | ×2 | R26 | R36 |
| `custom_double_ms0ra3ds` | Narrow Path | 2 | 229 | 4 | `[0,-4,4]` | ×2 | R23 | R33 |
| `map3_quadrivium_copy` | Triple Battlefield | 4 | 575 | 7 | `[2,3,-5]` | ×3 | R26 | R36 |
| `custom_double_ms0cunhu` | The Valley | 3 | 383 | 7 | `[2,0,-2]` | ×2 | R25 | R35 |
| `custom_triple_ms3r4ifn` | Central hotspot | 3 | 439 | 8 | `[0,-3,3]` | ×3 | R26 | R36 |
| `custom_double_ms3ppdyc` | Plains 2G large | 2 | 313 | 7 | `[0,5,-5]` | ×2 | R25 | R35 |
| `custom_triple_ms3s2abv` | La Trappola | 4 | 151 | 7 | `[0,0,0]` | ×1 | R26 | R36 |

Le precedenti mappe integrate `map2_triumvirate` e `map3_quadrivium` restano risolvibili tramite ID per compatibilità con vecchi salvataggi e log, ma sono disabilitate nei selettori perché non soddisfano il nuovo requisito di equidistanza del PS centrale.

Narrow Path conserva lo sfondo WebP esportato nel pacchetto portatile, ora incluso come asset statico della build.

## Normalizzazioni dei JSON approvati

- tutte le mappe ufficiali sono abilitate, non modificabili e marcate `official`;
- le mappe F9R3 normalizzate usano `ps-center`; i nuovi pacchetti F9S1b1 conservano il proprio ID centrale semantico valido (`ps-center` oppure `ps-center-2`) e il tag `central`;
- Triple Battlefield non contiene più il doppio ID `ps-7`;
- The Valley è confermata a 3 giocatori e la descrizione è coerente;
- le quattro mine iniziali di The Valley hanno ID e `sourceId` univoci;
- coordinate, ruoli cella, QG, PS, pericoli e componenti geometrici sono stati validati.

## Editor mappe

L’Editor permette di designare direttamente una cella come **PS centrale**. La preview mostra `PS★`; il riepilogo di validazione riporta ID e coordinate del centro. La rimozione del PS centrale cancella anche il riferimento semantico, impedendo l’esportazione come mappa valida finché non viene scelto un nuovo centro.

I nuovi pericoli iniziali ricevono ID derivati dalle coordinate per evitare duplicati.

## Compatibilità ereditata

F9R3 conserva integralmente:

- ottimizzazioni IA, pathfinding, rendering e log di F9O7h2;
- targeting unità coerente contro tutti gli avversari FFA attivi;
- assenza di cap generale per le strutture del deck;
- limite di 2 strutture Starter vive per giocatore in modalità Tattica;
- tutorial, checkpoint, ripresa e visibilità delle anteprime carta di F9O7h1;
- sfondi custom, terreni, archivio locale e leggibilità ostacoli F9Q3c/F9Q3c1.

## F9Q3d1 — Target Player Foundation

Gli effetti che colpiscono direttamente un giocatore — ENE, mano, deck, costi o blocchi — usano ora un bersaglio esplicito. In 1v1 l’unico avversario attivo viene selezionato automaticamente; nelle partite FFA gli umani scelgono da un pannello dedicato e i bot usano uno scoring deterministico. Il giocatore attivo e i giocatori eliminati non sono mai bersagli validi.

La fondazione è collegata alle tattiche `Campo statico`, `Contratto bilaterale`, `Embargo`, `Contratto di Usura` e `Contratto-Trappola`, oltre alle abilità `Logistica Compromessa`, `Esproprio di Mano` e `Clausola di Stasi`. Gli effetti economici generici con `affects: "enemy"` consumano lo stesso token giocatore, mantenendo un fallback solo per chiamate legacy 1v1 non interattive.

Questa fase non modifica ancora la semantica FFA delle Missioni, l’attribuzione delle eliminazioni, gli assist, la Pressione dopo eliminazione o le dottrine IA storiche che usano ancora un avversario primario: sono attività di F9Q3d2 e successive.

## Verifica automatica F9Q3d1

- 145 file JavaScript controllati con `node --check`: 145 validi, 0 errori;
- 65 suite Node eseguite: 65 superate;
- smoke dedicato F9Q3d1 Node: 28/28 verifiche;
- smoke Chromium F9Q3d1: selezione umana FFA, risoluzione reale di tattica e abilità, esclusione eliminati e auto-risoluzione 1v1 superate;
- regressioni Chromium mirate su selettore deck, pool/Pivot e nove mappe ufficiali superate;
- precheck del catalogo: superato senza problemi;
- nessun errore pagina o console nei test Chromium eseguiti;
- nessun test è stato eseguito su APK Android fisico.

F9Q3d1 resta una baseline storica congelata. Le semantiche successive F9Q3d2 e F9Q3d3 sono state validate e sono incluse nella baseline logica di questa candidata.

## F9U1a — Map HUD Layout Foundation

Candidata costruita sulla baseline validata `C2-STABLE-1-F9Q3e1a-APK-M4c`, mantenendo lo schema telemetrico `F9Q3e1-2`.

- la mappa occupa il centro della schermata senza la barra inferiore legacy;
- Missione, abilità di fazione, Mano e Fine turno sono raccolti in un dock permanente sul lato sinistro;
- Fit, Centra e zoom restano nei controlli camera sovrapposti alla mappa;
- Setup, mercato, mano legacy e tattiche legacy non sono più visibili nella schermata di gioco;
- Log, Statistiche e Telemetria sono richiamati dal nuovo pulsante `Debug` nella barra superiore/HUD;
- il pannello dell’unità selezionata resta sul lato destro ed è rinviato al rework F9U1b;
- layout desktop e APK/mobile condividono la stessa gerarchia, senza barra inferiore mobile.

F9U1a è un intervento esclusivamente UI: non modifica carte, deck, mappe, asset, regole, IA, seed o raccolta telemetrica.
