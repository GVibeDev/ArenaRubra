# Arena Rubra – C2e-4b Exordium Recovery / Breakpoint Doctrine

Base: C2e-4a2 Objective Recovery / Pressure Emergency / Mine Awareness.

Questa patch non cambia regole, carte, costi, stat, economia, comandanti, mappa o UI. Interviene solo sullo scoring AI avanzato specifico di Exordium, mantenendo attiva la dottrina generale C2e-4a2.

## Cosa aggiunge C2e-4b

- Opening Anchor Rule: i primi pezzi d’urto Exordium da 3/4+ ENE non vengono spinti verso centro/PS contestati senza supporto, se esposti a 2+ minacce.
- Active Defense Exordium: con 0 PS o pressione nemica, Exordium valuta più fortemente PS proprio/centrale e crea linea di ripartenza invece di difendere passivamente il QG.
- Breakpoint Combat Doctrine: gli attacchi ad alto ATT ricevono bonus se azzerano DEF, aprono follow-up su HP, producono kill o liberano PS; ricevono malus se sprecano molto danno normale contro DEF alta senza follow-up.
- Target Priority anti-Nexus: più peso a presidi PS, Drone Geniere su PS, Bunker/Nodo/Fabbrica/Torre vicino al fronte e bersagli con DEF già abbassata.
- Structure Use Exordium: Bastione/Avamposto/Caserma/Torretta vengono valorizzati come strutture di linea vicino a PS e assi di recupero, non solo come difesa arretrata.
- Hand Cap / Tempo Response: con mano alta, Exordium valorizza di più carte chiave utili a presenza e recupero PS.

## Test consigliato

1. Exordium vs Nexus, bot avanzati, preset Standard e Rapida.
2. Verificare se Exordium resta meno spesso a 0 PS e prova a rompere presidi Nexus.
3. Verificare se Carro Medio / Legionario / Testudo evitano isolamento precoce.
4. Verificare se gli attacchi ATT alto sembrano più legati a breakpoint/kill/PS e meno a danno sprecato su DEF alta.
5. Regressione: controllare che gli altri bot non abbiano perso la dottrina generale C2e-4a2.

