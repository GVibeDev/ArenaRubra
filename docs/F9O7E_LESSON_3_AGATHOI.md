# F9O7e — Lezione 3 Agathoi

**Build:** `C2-STABLE-1-F9O7e-APK-M4c`  
**Baseline logica:** `C2-STABLE-1-F9O7d-APK-M4c`  
**Data:** 25 luglio 2026  
**Stato:** candidata da validare manualmente

## Obiettivo

Aggiungere una lezione deterministica centrata sull’identità difensiva Agathoi, senza modificare carte, statistiche, regole, IA ordinaria o layout validati.

## Scenario

Il giocatore Agathoi presidia il Punto Strategico centrale con:

- `AG1B02` — Oplita di Confine;
- `AG4B01` — Radura Curativa, adiacente all’Oplita.

La Mano contiene:

- `AGTAC07` — Manto di Rovi;
- `AGTAC05` — Natura Vigile;
- `AGTAC04` — Bastione Ligneo;
- `AGTAC08` — Carovane di Mercanti, mantenuta come alternativa non adatta alla difesa immediata.

Gli Starter sono disattivati. Il bot ordinario è sospeso e le ondate vengono eseguite tramite comandi scenario.

## Tre ondate

### Prima ondata — Spine

Il giocatore applica Manto di Rovi all’Oplita. Una Guardia di Aurex priva di DEF attacca il Punto e viene distrutta da Spine 2. L’Oplita perde soltanto parte della propria DEF.

### Seconda ondata — Contrattacco

Il giocatore applica Natura Vigile all’Oplita. Un Legionario Pesante privo di DEF attacca: consuma l’ultima DEF dell’Oplita, subisce Spine 1 e viene distrutto dal Contrattacco da 2 ATT. Gli HP dell’Oplita restano integri.

### Terza ondata — Fortificazione

Il giocatore usa Bastione Ligneo sulla Radura Curativa, portandone la DEF attuale a 4, pari agli HP. Un’Artiglieria Exordium attacca con 6 ATT: la DEF viene azzerata, ma l’eccesso non passa agli HP. L’Oplita distrugge poi l’Artiglieria con un attacco base.

## Contratti conservati

- stato Mano imposto per ogni passo;
- nessun bersaglio vincolato può essere assente;
- checkpoint con snapshot dopo ogni ondata;
- ritratti Agathoi predisposti nel manifest esistente;
- comandi Mano ridotta F9O7d invariati;
- Lezioni 1–2 e relativi progressi invariati.

## Eventi usati

- `TACTIC_USED`;
- `TURN_ENDED`;
- `UNIT_DESTROYED`;
- eventi di combattimento prodotti dal motore durante le ondate.

## Fuori ambito

- nessuna nuova regola Agathoi;
- nessuna modifica a Spine, Contrattacco o Bastione Ligneo;
- nessuna IA libera durante lo scenario;
- nessuna integrazione di asset narratore nella build LITE;
- nessuna Lezione 4 Liberti.
