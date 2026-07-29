# F9S1c1 — Official 50-Deck Roster & Deck Builder UX Optimization

Versione candidata: `C2-STABLE-1-F9S1c1-APK-M4c`  
Baseline validata: `C2-STABLE-1-F9Q3d4-APK-M4c`

## Roster ufficiale

- Integrati 50 deck ufficiali visibili.
- Distribuzione: 10 deck per fazione e 5 deck per ciascuno dei 10 Comandanti.
- Conservati i 10 deck Missione esistenti.
- Integrate 40 liste tattiche v0.1 derivate dalla bozza `Decks.pdf`.
- Eliminati dalla libreria integrata i tre preset legacy:
  - `Nexus::NXCMD01::nexus-avatex-ufficiale`
  - `Exordium::EX0B00::varran-default`
  - `Liberti::LXCMD02::pravus-default`
- Le liste v0.1 sono ufficiali come roster e legalità, ma non ancora validate come bilanciamento competitivo.

## Esclusione degli Starter

- Confermata l'esclusione dal deck delle quindici carte Starter.
- Sostituite 142 copie Starter presenti nelle 40 bozze.
- Priorità di sostituzione: legalità, costo ENE vicino, limite di copia, ruolo funzionale e identità dell'archetipo.
- Nessuna carta Starter residua nei 50 deck.
- Aumento massimo della media ENE rispetto alla bozza: `+0,27`.
- Tre liste non richiedevano sostituzioni: `Decapitazione Cremisi`, `Orgoglio Immortale`, `Falange d’Assedio`.
- Le variazioni di densità Struttura causate dai limiti del pool sono registrate nell'audit dedicato.

## Deck Builder

- Toolbar principale riorganizzata in una griglia compatta.
- Operazioni JSON, import/export, manifest ed eliminazione spostate in `Strumenti avanzati`.
- Aggiunta e rimozione riunite nella stessa casella con controllo `− quantità/limite +`.
- Il medesimo controllo è disponibile sia nel pool sia nel deck in costruzione.
- Libreria filtrata sulla fazione corrente: piccoli pulsanti con il solo nome del deck.
- I dettagli del deck selezionato vengono mostrati in una scheda separata.
- Deck raggruppati per Comandante: cinque nomi per ciascun Comandante.
- La scheda mostra categoria, archetipo, Pivot, Missione, ENE media, unità, tattiche e strutture.
- Aggiunto pannello analisi live del draft:
  - ENE media;
  - curva ENE 0–7;
  - unità, tattiche, strutture e Missioni;
  - percentuale unità/tattiche.
- Selezionare un nome non modifica il draft; il caricamento resta un'azione esplicita.
- Il pulsante principale `Carica scelto` rispetta il deck selezionato anche quando appartiene all'altro Comandante della stessa fazione.

## Compatibilità

- Nessuna modifica a carte, effetti, mappe, Pressione o regole FFA validate.
- Tutti i deck integrati restano immutabili.
- I deck locali e CUSTOM continuano a usare lo storage separato.
- I vecchi salvataggi che contengono una chiave non più integrata non vengono promossi a preset ufficiali.
