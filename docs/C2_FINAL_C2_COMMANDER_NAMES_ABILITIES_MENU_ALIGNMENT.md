# C2-FINAL-C2 – Commander Names / Abilities / Menu Alignment

## Obiettivo

Rendere definitivi i 10 comandanti dello Starter Game dopo C2-FINAL-C1 Commander Choice Foundation, mantenendo la scelta pre-partita introdotta nella patch precedente.

La patch sistema anche l’allineamento del pannello Opzioni di gioco, dove ora fazione, comandante e controllo umano/bot sono disposti su griglia più stabile.

## Perimetro

- Rinominati e rifiniti i 10 comandanti.
- Aggiornate stat e abilità dei comandanti secondo griglia confermata.
- Aggiunti handler specifici per le nuove abilità comandante.
- Corretto layout menu partita per le righe G1/G2.
- Nessuna nuova tattica.
- Nessun bilanciamento delle altre carte.
- Nessuna integrazione AI completa dei comandanti: rimandata a patch successiva.

## Comandanti

### Nexus

- Avatex: Protocollo di Presidio.
- Unità Comando: Logistica Avanzata.

### Exordium

- Varran: Ordine di Varran.
- Nemira: Comando di Nemira.

### Liberti

- Rauk del Ripudio: Richiamo del Ripudio.
- Pravus dei Sanguis: Sanguinamento 2 + Predazione Sanguis passiva.

### Agathoi

- Alexandros: Mandato del Primarca.
- Dycaios: Ordini dell’Agorà.

### Fabeot

- Gerarca Fabeot: Sentenza Porpora invariata.
- Emissario della Torre: Logistica Compromessa.

## Note tecniche

- Logistica Avanzata usa un nuovo effetto `hand_deploy_discount`: vale solo per la prossima unità Nexus giocata dalla mano, minimo 1 ENE, e non influenza il mercato/debug roster.
- Ordine di Varran applica +1 ATT e consente a Varran di restare pronto dopo l’abilità.
- Richiamo del Ripudio usa lo status `enhanced_superiority_next_attack`.
- Pravus usa `bleedValue: 2` e `onKillHealInfantry: 1`.
- Mandato del Primarca aumenta la DEF attuale di Alexandros e delle unità Agathoi alleate adiacenti senza cap.
- Logistica Compromessa fa pescare l’avversario e ruba la carta se è fanteria/veicolo non comandante e non pivot.

## File principali modificati

- `data/units_base.js`
- `data/cards_base.js`
- `src/abilities.js`
- `src/combat.js`
- `src/statuses.js`
- `src/economy.js`
- `src/deployment.js`
- `index.html`
- `css/style.css`
- `src/game.js`
- `src/precheck.js`

## Test consigliati

1. Cambiare fazione nei menu G1/G2 e verificare dropdown comandante allineato.
2. Avviare una partita con ciascun comandante scelto.
3. Verificare che la mano iniziale includa solo il comandante selezionato.
4. Testare le 10 abilità/passive comandante.
5. Verificare che Logistica Avanzata non sconti il mercato/debug roster.
6. Verificare che Varran possa agire dopo Ordine di Varran.
7. Verificare che Pravus applichi Sanguinamento 2 e curi 1 HP quando distrugge fanteria.
8. Verificare cap mano con Logistica Compromessa.
9. Regressione su C2-FINAL-A/B: income 3, cap mano, recupero deck, bilanciamenti fazioni.
