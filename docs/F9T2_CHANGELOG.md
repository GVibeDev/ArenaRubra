# Arena Rubra — Changelog F9T2

## Build

`C2-STABLE-1-F9T2-APK-M4c — Exordium Expert · Bastion Relay Doctrine`

Baseline: `C2-STABLE-1-F9T1-APK-M4c`.

## Aggiunto

- Prima dottrina Expert reale, esclusiva di Exordium.
- Modulo `expert-exordium-f9t2` instradato soltanto per la fazione attiva.
- Micro-piano `EXORDIUM_BASTION_RELAY` in due passaggi:
  1. costruzione del Bastione Armato su un PS controllato e vuoto;
  2. rilascio di una unità mobile verso il successivo obiettivo territoriale.
- Riserva ENE fino alla costruzione del Bastione.
- Selezione deterministica di builder, PS, unità mobile e destinazione.
- Esecuzione del movimento pianificato prima delle azioni stazionarie marginali.
- Abort e fallback Advanced F9T0 espliciti.
- Estensione telemetrica `F9T2-1` con conteggi dei piani relay, passaggi, Bastioni sui PS e unità liberate.
- Precheck dei nuovi hook F9T2.
- Modalità Setup rinominata `Expert F9T2 · Exordium pilota`.

## Ottimizzato

- Un solo candidato per PS.
- Cache locale delle celle di movimento durante la selezione del piano.
- Riutilizzo degli insiemi di unità alleate e nemiche nella valutazione.
- Limite generale di 64 candidati conservato.

## Conservato

- Contratto Expert base `F9T1-1`.
- Schema telemetrico principale `F9Q3e1-2`.
- Router monofazione e cache di turno F9T1.
- Advanced F9T0 come fallback.
- Nessuna dottrina Expert per Nexus, Liberti, Agathoi e Fabeot.

## Non modificato

- Regole di gioco.
- Carte, costi e statistiche.
- Deck e mappe ufficiali.
- Missioni e condizioni di vittoria.
- Targeting, terreno e Pressione.
- Bilanciamento.
