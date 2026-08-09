# F9T2a — Bastion Relay Candidate & Legal Sequence Hotfix

Baseline ufficiale: `C2-STABLE-1-F9T1-APK-M4c`  
Candidata: `C2-STABLE-1-F9T2a-APK-M4c`  
Schema Expert: `F9T2a-1`

## Difetto corretto

F9T2 scartava ogni PS occupato. Questo rendeva incompatibile il candidato con il caso reale nel quale una unità mobile mantiene il controllo del PS e deve essere sostituita dal Bastione.

## Contratto candidato

Un candidato è valido solo quando esistono contemporaneamente:

- PS controllato da Exordium;
- nessuna struttura sul PS;
- occupante mobile Exordium pronto;
- builder distinto, pronto e adiacente;
- cella costruibile dopo il rilascio;
- Bastione disponibile;
- ENE sufficiente e riservabile;
- obiettivo successivo;
- movimento legale con guadagno di distanza almeno 1.

## Sequenza legale

1. Selezione e riserva ENE.
2. Movimento pre-acquisto della guarnigione dalla cella PS.
3. Verifica che il PS sia libero.
4. Costruzione del Bastione mediante il builder dichiarato.
5. Completamento del piano e ritorno all’Advanced.

## Audit

Per ogni PS sono registrati: coordinate, controllo, occupante, tipo, eleggibilità della guarnigione, struttura presente, builder adiacenti/eleggibili, ENE, costo, riserva, numero destinazioni e ragione di esclusione. Gli audit del turno sono emessi in un unico evento batch e poi espansi dalla telemetria, per conservare il dettaglio riducendo il costo del modulo.

## Fuori ambito

Varran, Pivot, tattiche, nuove priorità combattive, bilanciamento e dottrine delle altre fazioni.
