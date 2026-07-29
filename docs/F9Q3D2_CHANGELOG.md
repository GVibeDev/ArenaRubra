# Arena Rubra — F9Q3d2 Changelog

## Build

- Versione: `C2-STABLE-1-F9Q3d2-APK-M4c`
- Nome: **FFA Effects & Missions Hardening**
- Baseline validata: `C2-STABLE-1-F9Q3d1-APK-M4c`
- Stato: candidata da collaudare

## Missioni FFA

- Aggiunto il profilo dati `F9Q3d2-ffa-mission-semantics-v1` senza alterare il profilo di bilanciamento precedente.
- Le condizioni contro il nemico dichiarano ora la propria semantica: qualunque avversario attivo, massimo fra gli avversari, stesso avversario, aggregazione cumulativa o evento causato da qualsiasi avversario.
- Le metriche di stato escludono i giocatori eliminati.
- Le metriche cumulative conservano gli eventi storici validi prodotti da qualunque avversario, anche quando quel giocatore viene eliminato in seguito.
- `enemy_pressure` usa il valore massimo fra gli avversari attivi.
- `enemy_pivot_and_commander_in_play` richiede Pivot e Comandante appartenenti allo stesso avversario attivo.
- La distanza dal QG nemico viene verificata rispetto a qualunque QG avversario attivo.
- Le condizioni consecutive sui turni nemici sono tracciate separatamente per giocatore: i turni degli altri avversari non interrompono né incrementano la serie.

## Ricompense e targeting

- **Ex Lucis Tenebrae** richiede in FFA la scelta esplicita dell’avversario che perde metà ENE.
- **Cospirazione** richiede in FFA la scelta esplicita dell’avversario che deve scartare metà della mano ordinaria.
- La scelta è automatica in 1v1 e per i bot.
- Il selettore delle ricompense Missione non può essere annullato dopo che la carta Missione è stata giocata.
- Le carte Missione, i Comandanti e gli altri elementi protetti non vengono inclusi nello scarto di Cospirazione.
- **Anatema** può scegliere unità appartenenti a qualunque avversario attivo; le unità dei giocatori eliminati sono escluse.

## IA, interfaccia e diagnostica

- L’IA Missioni valuta tutti i QG e tutte le unità avversarie attive.
- La scelta automatica del giocatore bersaglio riutilizza il sistema deterministico introdotto in F9Q3d1.
- Il pannello Missioni mostra una scelta alternativa del giocatore bersaglio qualora l’overlay generale non sia disponibile.
- Telemetria, stato ricompense e diagnostica Missioni vengono inizializzati dinamicamente per tutti i giocatori della mappa.
- La diagnostica esporta le sezioni di tutti i giocatori runtime, non soltanto G1 e G2.

## Compatibilità

- Nessuna modifica ai pool, agli asset, ai deck ufficiali o alle nove mappe ufficiali.
- Conservati targeting F9Q3d1, pool da 40 carte, Pivot alternative e selezione dei deck custom.
- Il comportamento 1v1 resta automatico e non introduce una scelta superflua.

## Non incluso

- Rimozione completa dal ciclo di turno dei giocatori eliminati e destino delle loro permanenti: prevista in F9Q3d3.
- Attribuzione avanzata di eliminazioni, assist e Pressione: prevista in F9Q3d4.
- Ricostruzione dei deck ufficiali: prevista in F9S1c.
