# C2c-4 – Simple AoE Tactics

## Obiettivo

Abilitare un primo nucleo di tattiche ad area semplici, giocabili dalla mano, senza introdurre reazioni, trappole, selezioni multi-step o logiche avanzate.

## Tattiche rese giocabili

- NXTAC04 – Bombardamento aereo (`aoe_cell_damage`)
- FABTAC11 – Pacco Bomba (`small_cell_cluster_damage`)

Il totale delle tattiche C2c giocabili dalla mano passa da 15 a 17.

## Regole implementate

### Bombardamento aereo

Scegli una cella entro R3 dalla rete operativa alleata. La tattica colpisce la cella selezionata e tutte le celle adiacenti valide. Ogni unità non-QG presente nell'area subisce 1 danno normale/non perforante.

### Pacco Bomba

Scegli una cella entro R1 dalla rete operativa alleata. La tattica colpisce un piccolo cluster: cella selezionata + fino a 2 celle adiacenti valide, con priorità deterministica alle celle occupate. Ogni unità non-QG presente nel cluster subisce 1 danno normale/non perforante.

## Note di bilanciamento

Il danno AoE non è diretto/perforante: rispetta la regola C2c-2a. Se DEF > 0, il danno consuma DEF e l'eccesso non passa agli HP.

## Perimetro escluso

Non sono incluse in C2c-4:

- Ultima Corsa;
- Torretta Lanciafiamme/AoE condizionali;
- trappole e celle persistenti;
- movimento e spostamenti;
- pesca/economia;
- conversioni e furto mano;
- contrattacco, agguato e attacchi opportunità.
