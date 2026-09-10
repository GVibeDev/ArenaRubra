# Arena Rubra Starter 1.0 — Regolamento italiano

Stato: contenuto normativo congelato per Desktop/Web. Questo documento descrive il runtime Starter 1.0; in caso di divergenza, il manifest congelato e i servizi di regola del runtime sono autorevoli.

## Obiettivo e giocatori

Arena Rubra è uno strategico a turni, free-for-all, per 2–4 giocatori umani e/o bot. Ogni giocatore sceglie una fazione, un comandante e un deck valido; la mappa deve supportare esattamente il numero di giocatori configurato.

## Preparazione

- Ogni giocatore parte con 3 ENE.
- Il deck regolamentare contiene 30 carte. La mano iniziale è di 5 carte e include il comandante; se il deck contiene una Missione, la Missione è inclusa secondo il contratto runtime.
- Le tre carte Starter di fazione — Fanteria, Veicolo e Struttura — restano in una riserva separata, riutilizzabile, e richiedono comunque il pagamento del costo e un piazzamento legale.
- Il QG è una cella-obiettivo vuota e occupabile. Lo sbarco ordinario avviene sul QG o in una cella libera adiacente al QG o a un edificio alleato; abilità e tratti possono modificare questa regola.

## Turno

All'inizio del proprio turno si risolvono stati ed effetti, si ottiene il reddito e — salvo il primo turno personale — si pesca una carta. Il reddito base è 3 ENE più i PS controllati, modificato da effetti e dottrine.

Ogni unità pronta può normalmente muovere e/o compiere l'azione consentita dal proprio tipo, dai propri tratti e dallo stato corrente. Fanteria e Comandanti possono normalmente agire dopo il movimento; Veicoli e Strutture seguono le limitazioni mostrate dall'interfaccia e dalle carte. Attacchi, abilità, costruzione e tattiche consumano l'azione o le risorse indicate. Il turno termina manualmente o quando il runtime non rileva altre azioni disponibili.

## Combattimento, PS e risorse

- ATT determina la forza offensiva; DEF assorbe il danno prima degli HP salvo effetti diretti; a 0 HP l'unità viene rimossa.
- Un PS non bloccato è controllato dal giocatore che occupa la sua cella con un'unità valida.
- La mano ha cap 10. Le pescate oltre il cap vanno direttamente negli scarti.
- Quando deck e carte ordinarie in mano sono esauriti e gli scarti non sono vuoti, il recupero costa 5 ENE: gli scarti vengono rimescolati e si pescano 3 carte. Il ciclo con Missione applica il contratto specifico mostrato dal runtime.

## Ritmo e limiti

Standard: Pressione dal round `20 + ceil((PS + giocatori) / 2)`, 7 incrementi per vincere, limite round 50, movimento base Veicolo 1, cap leggere 10.

Rapida/Competitive: Pressione dal round 20, 5 incrementi, limite `30 + ceil((PS + giocatori) / 2)`, movimento base Veicolo 2, cap leggere 5 (7 per Liberti).

Il moltiplicatore di movimento della mappa si applica al movimento base. Cap generali: 1 Comandante, 2 copie Pesanti per blueprint, 1 Elite/Pivot non-Struttura per blueprint. Le Strutture da deck non hanno un cap generale. In scala Tattica restano al massimo 2 Strutture Starter vive per giocatore; la scala Vasta non applica quel cap dedicato.

## Condizioni di vittoria

1. **Conquista QG:** occupa il QG avversario con una tua unità mentre controlli almeno un PS. Il difensore è eliminato; in una partita multiplayer vince l'ultimo giocatore attivo.
2. **Pressione Strategica:** a fine round, un solo giocatore deve controllare il PS centrale designato e almeno `ceil(PS totali / 2)` PS complessivi. Quel giocatore guadagna un punto Pressione; raggiunta la soglia del ritmo, vince.
3. **Limite round:** spareggio nell'ordine: più PS, più unità in campo, più ENE non spesa. Parità completa = pareggio tecnico.
4. **Concessione o resa tecnica:** il giocatore è eliminato; resta valida la regola dell'ultimo giocatore attivo.

## Missioni e informazione

Le Missioni sono pubbliche nel runtime digitale. Progressi, ricompense e scelte sospese sono risolti dall'interfaccia; una scelta Missione in sospeso deve essere completata prima di terminare il turno. Le mani avversarie restano coperte, salvo le carte rese pubbliche o gli effetti che concedono informazione.

## Intelligenza artificiale

Advanced è il livello massimo ufficiale di Starter 1.0. Expert è una funzione DEV/sperimentale, non fa parte del profilo Distribution e non costituisce una promessa pubblica di prodotto.

## Mappe e dati numerici

L'elenco effettivo delle mappe ufficiali, le dimensioni, i PS, i moltiplicatori e tutti i conteggi congelati sono nel registro generato `STARTER_1_0_STATISTICS_REGISTER.md`. Le due mappe legacy disabilitate sono conservate soltanto per compatibilità dei salvataggi.

