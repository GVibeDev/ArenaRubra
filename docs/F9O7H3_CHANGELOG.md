# Arena Rubra — F9O7h3 FFA Targeting & Structure Cap Hotfix

Build candidata: `C2-STABLE-1-F9O7h3-APK-M4c`

Base tecnica: candidata F9O7h2 Performance Hotfix, derivata dalla baseline validata `C2-STABLE-1-F9O7h1-APK-M4c`.

## Diagnosi

Il log F9O7h2 mostra ripetuti casi nei quali tattiche come `Missile Jam` dichiarano assenza di bersagli validi durante una partita FFA, pur con più avversari ancora attivi. La causa principale non è la nuova tassonomia grafica dei token: alcuni pool di bersagli runtime continuavano a usare `enemyOf(player)`, cioè un solo avversario operativo, invece dell'insieme di tutti gli avversari FFA attivi.

Il medesimo log mostra inoltre il vecchio limite globale degli edifici, non più adatto alle mappe multigiocatore estese.

## Correzione bersagli FFA

- Le tattiche base con bersaglio unità consultano ora tutte le unità degli avversari attivi.
- Le tattiche pescate dalla Mano consultano tutti gli avversari attivi.
- Le tattiche custom runtime consultano tutti gli avversari attivi.
- Le abilità delle unità con bersaglio `enemy` o `any` consultano tutti gli avversari attivi.
- Gli effetti secondari ad area o di scelta automatica collegati alle abilità usano lo stesso insieme FFA.
- Le unità appartenenti a giocatori eliminati restano escluse.
- Filtri Fanteria, Veicolo, Struttura, Comandante/Pivot, gittata, furtività e altre condizioni specifiche restano invariati.

Gli effetti rivolti direttamente a mano, deck, ENE o giocatore continuano a usare il bersaglio operativo FFA corrente e saranno affrontati nella futura milestone F9Q3d — FFA Rules Hardening.

## Nuova politica strutture

- Rimosso il cap generale delle strutture schierate.
- Rimosso anche il precedente cap separato delle strutture Agathoi.
- Le strutture provenienti dal deck sono limitate dalle copie realmente disponibili nel deck e dalle normali regole di deck building.
- Le strutture Elite o Pivot non vengono bloccate dai cap di campo Elite/Pivot applicati alle unità non strutturali.
- In modalità Tattica resta il solo limite di **2 strutture Starter vive complessive per giocatore**.
- Quando una struttura Starter viene distrutta o rimossa dal campo, libera nuovamente uno slot Starter.
- In modalità Grande Scala il limite tattico Starter non si applica.

## Conservato da F9O7h2

- indici geometrici riusabili;
- occupazione O(unità);
- cache delle celle raggiungibili per decisione IA;
- riduzione dei render duplicati;
- log DOM visibile limitato, con export completo;
- tutorial, camera adattiva e anteprime sopra lo scrim.

## Invariato

- valori delle carte e delle unità;
- composizione dei deck;
- regole di movimento e combattimento;
- economia e Pressione;
- Missioni;
- dottrine e priorità dell'IA;
- grafica e classi CSS dei token.
