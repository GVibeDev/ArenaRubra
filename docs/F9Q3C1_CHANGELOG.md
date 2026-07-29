# Arena Rubra — F9Q3c1 Obstacle Readability Hotfix

Build candidata: `C2-STABLE-1-F9Q3c1-APK-M4c`
Baseline validata: `C2-STABLE-1-F9Q3c-APK-M4c`

## Modifica

- Riempimento nero/charcoal ad alta opacità per le celle `terrain-obstacle` nella mappa di gioco.
- Trama diagonale leggera e doppio bordo interno per distinguere immediatamente le celle invalicabili.
- Override finale con `!important` mirato: impedisce alla calibrazione generica dell’opacità celle di attenuare gli ostacoli.
- Riempimento near-black del poligono esagonale nell’Editor mappe, con opacità rinforzata quando è presente uno sfondo custom.
- Conservati badge `×`, tooltip, hover/selezione dell’Editor e tutte le regole di gioco.

## Fuori ambito

Nessuna modifica a movimento, pathfinding, terreni, Pressione, IA, Missioni, camera, storage o sfondi custom.
