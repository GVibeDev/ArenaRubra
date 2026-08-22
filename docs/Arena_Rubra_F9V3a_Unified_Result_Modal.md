# Arena Rubra — F9V3a · Unified Result Modal

## Obiettivo

F9V3a introduce un unico risultato terminale persistente per i tre flussi di gioco già presenti nella Starter 2.0: Tutorial, Challenge e partita normale.

Il componente è puramente presentazionale. Non crea nuove condizioni di vittoria e non sostituisce `VICTORY`: nella partita normale mostra soltanto l'esito già deciso dal core.

## Tutorial

Quando l'ultimo passo di una lezione viene completato:

- il progresso viene salvato come prima;
- il runtime Tutorial viene chiuso;
- non avviene più il ritorno automatico all'Accademia;
- compare `LEZIONE COMPLETATA` con il titolo della lezione;
- il campo finale resta visibile dietro il popup.

## Challenge

Quando una Prova termina:

- il progresso Challenge viene salvato come prima;
- il runtime speciale viene disattivato;
- il campo finale resta visibile;
- successo -> `PROVA COMPLETATA`;
- fallimento -> `PROVA FALLITA` con motivo leggibile;
- non avviene più il ritorno automatico all'Accademia.

## Partita normale

`tutorialRuntimeHandleGameEvent()` è già subscriber globale del bus eventi. F9V3a usa quel punto soltanto quando non esiste un Tutorial o una Challenge attiva.

Su `VICTORY`:

- winner presente -> VITTORIA oppure SCONFITTA nel caso di singolo umano sconfitto;
- winner assente -> PAREGGIO;
- il popup espone sempre il vincitore come `Giocatore N` e la fazione quando esiste;
- round e `winType` vengono mostrati come metadati.

## Azioni

Azioni analisi:

- Log -> `openGamePanel("log")`;
- Statistiche -> `openGamePanel("stats")`;
- Telemetria -> `controlCenterOpenPanel("telemetry")`.

Azioni navigazione:

- Torna all'Accademia -> disponibile solo per Tutorial/Challenge;
- Menu principale -> App Shell Main Menu;
- Nuova partita -> apre il normale Setup partita.

## Missioni

Le Carte Missione ordinarie non sono esiti terminali. Il loro `MISSIONE SUPERATA` resta affidato all'event overlay rapido già esistente.

## Invarianti

F9V3a non modifica:

- `checkVictory()` / `setWinner()`;
- Pressione Strategica;
- regole QG;
- AI Advanced/Expert;
- carte, costi, deck o Starter reserve;
- Mission runtime;
- mappe;
- ENE;
- registrazione statistiche;
- schema telemetrico F9Q3e1-2.
