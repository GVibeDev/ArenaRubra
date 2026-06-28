# Arena Rubra – C2c-8 – Reactions / Opportunity / Counterattack Pass

## Tattiche rese giocabili

- EXTAC11 – Dispositivo di Puntamento (`extra_attack_on_kill`)
- LBTAC09 – Predoni in Agguato (`grant_ambush`)
- LBTAC14 – Esca d’Attacco (`coordinated_opportunity_attacks`)
- AGTAC05 – Natura Vigile (`grant_counterattack`)

## Regole implementate

### Extra attack on kill
Se l’unità con `extra_attack_on_kill` uccide con un attacco base normale, il suo `attacksPerTurn` viene esteso di 1 per il turno corrente e lo status viene consumato.

### Agguato
Quando una unità entra in una cella adiacente a un nemico con status `ambush`, l’ambusher consuma lo status ed effettua un attacco di reazione. L’attacco non genera catene di reazione.

### Contrattacco
Se una fanteria con `counterattack` subisce un attacco base nemico e sopravvive, consuma lo status e attacca l’aggressore. Non si attiva contro abilità, tattiche o altri attacchi di reazione.

### Esca d’Attacco
La fanteria nemica bersaglio viene attaccata da tutte le fanterie alleate adiacenti valide. Le unità possono attaccare anche se già agite, ma devono essere vive, non bloccate all’attacco e adiacenti. Nessuna catena.

## Anti-regressione

Da ritestare: C2c-7a/b, C2c-6a/b/c, movimento, spawn, trappole, AoE e danno no-overflow.
