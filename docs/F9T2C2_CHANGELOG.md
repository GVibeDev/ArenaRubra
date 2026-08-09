# Arena Rubra — Changelog F9T2c2

## Build

`C2-STABLE-1-F9T2c2-APK-M4c`

Baseline logica: `C2-STABLE-1-F9T2b-APK-M4c`

## Correzioni

### Primo turno Expert

- aggiunto token asincrono legato a `epoch`, `matchId` e giocatore;
- invalidati i turni bot ancora attivi alla creazione di una nuova partita;
- impedito al `finally` di un vecchio turno di chiudere il primo turno del nuovo match;
- reset di sessioni e cache Expert prima del bootstrap del nuovo match;
- sessione Expert associata al `matchId` corrente;
- rifiuto dei completamenti senza sessione o appartenenti a un altro match;
- aggiunto test browser specifico con iniziativa G2 e sostituzione rapida del match.

### Forward Pivot

- rimossa l’assegnazione di `HQ_CORRIDOR` basata sul solo avvicinamento;
- obiettivi limitati a impatti territoriali, attacchi, abilità o QG realmente operativo;
- conservati cella proiettata, ruolo, bersaglio e scadenza;
- aggiunta guida leggera nei due round successivi allo schieramento;
- anticipato l’uso di azioni stazionarie coerenti con l’obiettivo;
- mantenuto il monitor dopo la scadenza per rilevare il primo impatto tardivo.

### Telemetria

- schema dottrina aggiornato a `F9T2c2-1`;
- separati contatori Expert Forward e tutte le Pivot Exordium;
- aggiunto `forwardPivotLateImpacts`;
- registrati `firstActualImpactRound`, `roundsToFirstActualImpact` e `impactWithinDeadline`;
- incrementato `allExordiumPivotsTracked` alla prima registrazione dell’istanza;
- preservati aggregati completi delle ragioni di esclusione.

### Metadati e precheck

- versione e canale aggiornati a F9T2c2;
- voce Setup aggiornata a “Bootstrap e impatto Pivot”;
- precheck aggiornato per bootstrap, memoria attiva e schema `F9T2c2-1`.

## Preservato

- Bastion Relay F9T2a;
- Territorial Conversion e Relay Survival F9T2b;
- riconciliazione autorevole F9T2c1;
- gate comune dei Bastioni;
- limite di 24 decisioni;
- Pool carte, Control Center, Card Editor e Map Editor;
- gameplay e bilanciamento.

## Non incluso

- Varran Expert;
- revisione tattiche;
- mine Nexus;
- ruolo persistente delle Pivot Nexus;
- gestione endgame/spareggio;
- ottimizzazione generale del fallback Advanced.
