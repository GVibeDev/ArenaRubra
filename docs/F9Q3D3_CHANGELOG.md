# F9Q3d3 — Player Elimination & Active State Foundation

Versione candidata: `C2-STABLE-1-F9Q3d3-APK-M4c`  
Baseline validata: `C2-STABLE-1-F9Q3d2-APK-M4c`

## Obiettivo

Rendere l’eliminazione di un giocatore un’operazione unica e coerente per tutte le partite a 2–4 giocatori, eliminando stati intermedi, bersagli non validi e salti turno ricorsivi.

## Modifiche principali

- Aggiunto `src/player_lifecycle.js` come fonte centrale per gli stati `active`, `eliminated` e `winner`.
- `getActivePlayers()` usa lo stato di ciclo vita centralizzato.
- Ogni record giocatore conserva turno, indice d’ordine, responsabile e motivo dell’eliminazione.
- Aggiunto l’evento tipizzato `PLAYER_ELIMINATED`.
- Le statistiche runtime esportano stato, turno, responsabile e motivo dell’eliminazione.

## Bonifica atomica dell’eliminato

Quando un giocatore viene eliminato:

- fanterie, veicoli, comandanti e strutture lasciano il campo logico;
- il QG rimane sulla mappa come riferimento storico, ma non è più un obiettivo attivo;
- il controllo dei PS viene aggiornato immediatamente;
- mine ed effetti cella creati dal giocatore vengono rimossi;
- i pericoli iniziali della mappa posseduti dal giocatore vengono neutralizzati, non cancellati;
- blocchi PS, lock ENE/mano e cooldown vengono rimossi;
- stati ed effetti persistenti riconducibili al giocatore eliminato terminano;
- selezioni di unità o giocatori non più valide vengono chiuse;
- ricompense Missione pendenti vengono filtrate, concluse senza bersaglio oppure annullate quando il proprietario è eliminato.

## Politica di possesso

- Le carte già rubate restano nella zona del possessore corrente.
- Le unità già convertite restano al giocatore che le controlla al momento dell’eliminazione.
- Mano, deck e scarti del giocatore eliminato restano congelati per log e diagnostica.
- Gli effetti che hanno metadati `casterSide`, `owner` o `sourceSide` vengono rimossi correttamente quando la loro fonte viene eliminata.

## Turni e vittoria

- Nuovo cursore non ricorsivo per saltare uno o più giocatori eliminati.
- Il confine di round viene risolto una sola volta quando il cursore supera l’ultimo slot.
- Un giocatore che concede durante il proprio turno viene saltato immediatamente.
- L’ultimo giocatore attivo viene marcato esplicitamente come `winner`.

## Compatibilità

- Nessuna modifica a carte, deck ufficiali, mappe o formule della Pressione.
- Conservate le semantiche FFA di F9Q3d1 e F9Q3d2.
- F9Q3d4 resta responsabile dell’attribuzione completa di eliminazioni, assist e Pressione.
