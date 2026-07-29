# F9O7g — Lezione 5 Fabeot

**Build:** `C2-STABLE-1-F9O7g-APK-M4c`  
**Baseline logica:** `C2-STABLE-1-F9O7f-APK-M4c`  
**Data:** 25 luglio 2026  
**Stato:** candidata da validare manualmente

## Obiettivo

Aggiungere una lezione deterministica sull’identità Fabeot senza modificare regole, costi, statistiche, IA ordinaria o bilanciamento. Il percorso integra Marchio, Vulnerabilità, controllo della Mano, disturbo ENE e conversione.

## Scenario

Il giocatore Fabeot controlla:

- `FB0B00` — Gerarca Fabeot;
- `FB1B01` — Adepto Fabeot;
- `FBPIV01` — Cittadella Fabeot;
- `FB4B01` — Avamposto Fabeot su un Punto Strategico.

Il Nexus controlla:

- `NXC1F01` — Fante Robot isolato, con 2 HP e 1 DEF.

La Mano Fabeot contiene:

- `FABTAC07` — Embargo;
- `FABTAC09` — Contratto di Usura;
- `FABTAC04` — Dottrina del Tradimento;
- `FABTAC03` — Congedo Forzato.

La Mano Nexus contiene una sola carta, `UNIT:NXC1F03`. Gli Starter e i deck sono vuoti. Entrambi i lati sono impostati come umani e il runtime mantiene il bot sospeso.

## Marchio e Vulnerabilità

Il Gerarca usa `Sentenza Porpora` sul Fante Robot:

- costo: 2 ENE;
- status applicato: `fabeot_vulnerable`;
- bonus subito: +1 danno da attacchi e abilità offensive;
- durata: fino a fine turno;
- il Marchio soddisfa la clausola di acquisizione della Cittadella.

L’Adepto attacca con 1 ATT. La Vulnerabilità porta il danno effettivo a 2: la DEF del Fante Robot passa da 1 a 0, mentre i 2 HP restano intatti perché il danno non oltrepassa la DEF.

## Conversione

La Cittadella usa `Clausola di Acquisizione`:

- costo: 4 ENE;
- bersaglio non comandante, non pivot e non struttura;
- costo del bersaglio non superiore a 3;
- HP del bersaglio non superiori a 2;
- Marchio Fabeot ancora attivo;
- cap Fabeot disponibile.

Il Fante Robot passa permanentemente dal lato Nexus al lato Fabeot. Entra esausto e riceve Inibizione Azione, quindi non ottiene un’azione immediata.

## Controllo della Mano

L’Avamposto presidia un solo Punto Strategico. `Embargo` blocca una carta casuale per ogni Punto controllato, ma la Mano Nexus contiene una sola carta: il risultato è deterministico.

La carta riceve:

- `c2c7aBlockedTurns = 1`;
- `c2c7aBlockedBy = 1`;
- sorgente `Embargo`.

Una carta Fabeot diversa resta leggibile tramite anteprima, ma lo scrim ne impedisce l’attivazione durante il passo vincolato.

## Disturbo ENE

`Contratto di Usura` costa 4 ENE e produce due effetti separati:

1. il deposito Nexus scende da 5 a 4 ENE;
2. viene applicato `income_delta = -1` per due entrate, con minimo 0.

Il Nexus non ha ENE 0 prima della risoluzione, quindi la clausola di scarto casuale non si attiva.

## Checkpoint e ripresa

Sono presenti quattro checkpoint:

1. `vulnerability-contract-ready`;
2. `fabeot-conversion-resolved`;
3. `fabeot-embargo-resolved`;
4. `fabeot-usury-resolved`.

Il test browser interrompe la lezione dopo aver completato il checkpoint Embargo e la riprende su `play-fabeot-usury`. Il ripristino conserva:

- Fante Robot convertito e lato Fabeot;
- carta Nexus bloccata per un turno;
- Mano Fabeot senza Embargo;
- ENE Fabeot 11 e Nexus 5;
- Mano aperta sul passo successivo;
- nessun targeting transitorio della sessione precedente.

## Anteprime hover

La gerarchia F9O7f resta invariata:

- spotlight: 94;
- anteprima hover: 95;
- vignetta narrativa: 96.

Il test conferma inoltre opacità 1 e filtro `none`.

## Fuori ambito

- nessuna modifica a carte o abilità Fabeot;
- nessuna modifica a costi, statistiche o cap;
- nessuna modifica a combattimento, economia o conversione ordinari;
- nessuna modifica all’IA;
- nessun nuovo asset binario nella variante LITE;
- nessuna modifica alle Lezioni 1–4 oltre all’aggiornamento delle aspettative di build e del conteggio delle lezioni disponibili.
