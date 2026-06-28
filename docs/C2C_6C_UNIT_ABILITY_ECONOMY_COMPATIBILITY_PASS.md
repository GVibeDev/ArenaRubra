# C2c-6c – Unit Ability Economy / Draw Compatibility Pass

## Obiettivo

Consolidare abilità e passive unità già compatibili con C2c-6a/C2c-6b prima di passare a C2c-7 Fabeot avanzati.

Questa patch non aggiunge nuove tattiche giocabili e non apre furto mano, conversione o rimbalzo unità.

## Abilità / passive incluse

- **Bunker Nexus – Ottimizzazione Logistica**: cost_delta su unità non struttura, compatibile con carte unità giocate dalla mano.
- **Pretore di Aurex – Interdizione Rifornimenti**: income_delta negativo sul nemico.
- **Ekklesion del Raccolto**: +1 ENE ogni 2 turni del proprietario.
- **Avamposto Fabeot – Sportello di Reclutamento**: deploy_discount su prossima unità non struttura, compatibile anche con carte unità scontate da C2c-6a.
- **Inseguitore Fabeot – Contratto di Riscossione**: fabeot_bounty, +2 ENE al prossimo income se il bersaglio muore nel turno Fabeot.
- **Agente Espropriatore**: +1 ENE immediato su kill con attacco base.
- **Agente Sabotatore**: -1 income nemico al prossimo income su kill con attacco base.
- **Spia Silente**: pesca +1 se resta furtiva.
- **Matrice Multigenica**: crea in mano carta dell’unità nemica morta entro R1.

## Fix tecnico principale

Le carte unità pescate e scontate da C2c-6a mantengono il loro costo di istanza, ma ora possono ricevere anche modificatori economici già stabilizzati:

- cost_delta da Bunker;
- deploy_discount da Avamposto Fabeot;
- riduzioni di piazzamento come Avanguardia Liberta vicino a veicolo;
- futuri playerCostModifiers compatibili.

Gli sconti di sbarco vengono consumati anche quando la carta aveva già uno sconto C2c-6a.

## Fuori perimetro

Restano fuori da questo step:

- Esproprio di Mano come copia carta avversaria attiva;
- Clausola di Stasi;
- conversioni Fabeot;
- Congedo Forzato;
- Contratto Capestro;
- Embargo;
- Taglia sulla Testa.

Questi effetti appartengono a C2c-7.
