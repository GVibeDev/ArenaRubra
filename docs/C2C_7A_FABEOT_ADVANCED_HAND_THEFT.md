# C2c-7a – Fabeot Advanced Hand / Theft Foundation

Base: C2c-6c validata.

## Obiettivo

Attivare le tattiche Fabeot avanzate legate a mano, pesca, furto e rimbalzo, lasciando la conversione permanente a C2c-7b.

## Tattiche attivate

- **FABTAC03 – Congedo Forzato**: fanteria/veicolo alleato o nemico, no comandanti, no pivot, no strutture. L'unità torna nella mano del proprietario come carta base pulita. Non attiva morte, taglie, mine o conteggi kill.
- **FABTAC05 – Taglia sulla Testa**: fanteria/veicolo nemico, no comandanti, no pivot, no strutture. Se muore entro il turno del Fabeot che ha posto la taglia, il Fabeot aggiunge in mano una copia base pulita dell'unità.
- **FABTAC06 – Contratto Capestro**: entrambi pescano 1 carta. Se la carta pescata dal Fabeot è una tattica, il Fabeot ruba anche la carta appena pescata dall'avversario.
- **FABTAC07 – Embargo**: richiede almeno 1 PS controllato dal Fabeot. Blocca una carta casuale nella mano nemica per ogni PS controllato, per il prossimo turno del bersaglio.

## Sistemi aggiunti

- Blocco carta singola in mano (`c2c7aBlockedTurns`, `c2c7aBlockedBy`, `c2c7aBlockedSource`).
- Tick blocco carte a fine turno del proprietario della mano.
- Spostamento controllato di una carta tra mani per il furto di Contratto Capestro.
- Fallback blueprint per giocare carte unità copiate/rubate o generate da unità di fazione diversa.
- Status `fabeot_copy_bounty` per Taglia sulla Testa.

## Escluso volutamente

- FABTAC04 – Dottrina del Tradimento.
- Conversioni permanenti e corruption pass.
- Reazioni avanzate, agguato, contrattacco, attacchi extra su kill.
