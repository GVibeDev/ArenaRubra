# F9O7f — Lezione 4 Liberti

**Build:** `C2-STABLE-1-F9O7f-APK-M4c`  
**Baseline logica:** `C2-STABLE-1-F9O7e-APK-M4c`  
**Data:** 25 luglio 2026  
**Stato:** candidata da validare manualmente

## Obiettivo

Aggiungere una lezione deterministica centrata sulla scelta delle carte e sulla pressione Liberti, senza modificare statistiche, regole, IA ordinaria o layout validati.

## Scenario

Il giocatore Liberti circonda il Punto Strategico centrale con:

- `LX2B02` — Predone Liberto;
- due `LX2B01` — Miliziani Liberti.

Il Punto è occupato da:

- `AGC1F04` — Anthropos di Pietra, con 6 HP e 4 DEF.

La Mano contiene:

- `LBTAC08` — Marchio dei Sanguis;
- `LBTAC14` — Esca d’Attacco;
- `LBTAC05` — Granata Sporca;
- `LBTAC09` — Predoni in Agguato.

Gli Starter sono disattivati. L’avversario non usa l’IA ordinaria e lo scenario resta deterministico.

## Prima scelta — Marchio dei Sanguis

Il giocatore deve leggere le quattro carte e selezionare quella che applica Sanguinamento 2 al prossimo attacco base di una fanteria.

La selezione è vincolata semanticamente:

- scelta corretta: `TACTIC:LBTAC08`;
- una carta errata resta nella Mano;
- il targeting non viene avviato;
- il tutorial non avanza;
- viene mostrato un suggerimento correttivo.

Marchio dei Sanguis viene applicato al Miliziano evidenziato. Il suo attacco contro l’Anthropos passa da 2 a 3 ATT grazie a Superiorità Numerica, riducendo la DEF da 4 a 1 e applicando Sanguinamento 2.

## Sanguinamento

Terminando il turno, il Sanguinamento infligge 2 danni diretti agli HP dell’Anthropos. La DEF residua resta a 1 e gli HP scendono da 6 a 4.

Il runtime restituisce poi il controllo al giocatore senza affidarsi al bot ordinario.

## Seconda scelta — Esca d’Attacco

Il giocatore deve selezionare la carta che ordina alle fanterie adiacenti di attaccare immediatamente il bersaglio, anche se hanno già agito.

La scelta corretta è `TACTIC:LBTAC14`. Le fanterie Liberti attaccano in sequenza:

1. viene eliminata l’ultima DEF;
2. gli attacchi successivi riducono gli HP;
3. l’Anthropos viene distrutto;
4. il Punto Strategico resta libero.

Il Predone conserva l’azione normale, viene selezionato e si muove sul Punto centrale per completare la lezione.

## Anteprime hover retroattive

Il tutorial applica globalmente questa gerarchia:

- scrim/spotlight: `z-index 94`;
- anteprima carta in hover: `z-index 95`;
- vignetta narrativa: `z-index 96`.

L’anteprima riceve inoltre opacità piena e nessun filtro. La modifica vale per tutte le lezioni mentre `body.tutorial-runtime-active` è presente, non soltanto per la Lezione 4.

## Checkpoint

Sono presenti due checkpoint:

1. dopo il primo attacco e l’applicazione del Sanguinamento;
2. dopo la distruzione dell’Anthropos tramite Esca d’Attacco.

Il secondo checkpoint ripristina correttamente Mano, turno, unità, bersaglio distrutto e passo di selezione del Predone.

## Fuori ambito

- nessuna modifica al bilanciamento Liberti;
- nessuna modifica alle quattro tattiche;
- nessuna modifica alla Superiorità Numerica;
- nessuna modifica al sistema Sanguinamento;
- nessun nuovo asset narratore incluso nella build LITE;
- nessuna Lezione 5 Fabeot anticipata.
