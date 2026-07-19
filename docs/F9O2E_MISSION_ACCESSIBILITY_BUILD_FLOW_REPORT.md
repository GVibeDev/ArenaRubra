# F9O2e — Mission Accessibility & Build Flow Reliability

Baseline: `C2-STABLE-1-F9O2d-APK-M4c`

## Obiettivi

1. Liberare correttamente il cap Starter quando una struttura viene distrutta.
2. Rendere coerente la costruzione da carta con la regola del QG proprio.
3. Rendere la Missione giocabile cliccando direttamente la carta, mantenendo conferma/annullamento.
4. Mostrare i progressi Missione nel dock Azioni sulla mappa.
5. Applicare un primo passaggio di accessibilità alle soglie Missione, senza cambiare ricompense.

## Correzioni runtime

- `starterUnitsInField()` usa `isFieldUnit()` quando disponibile e verifica HP/posizione nel fallback.
- Una struttura con HP 0, posizione rimossa o `alive=false` non occupa più il cap `starter_structure`.
- `handCardActionState()` accetta una struttura se esiste almeno uno dei due percorsi:
  - costruttore attivo con cella adiacente libera;
  - casella del QG proprio libera.
- `beginHandCardPlay()` imposta esplicitamente `pendingBuildSource` a `unit` oppure `own_hq`.
- Il fix comprende `EXC1F09 — Caserma Fanteria`, ma non è hardcoded sulla carta.

## UI Missione

- `missionUiActivateCard()` viene usata dalla carta nella mano rapida e dalla carta nel pannello Mano.
- Se la Missione è pronta, il click apre subito la richiesta di conferma.
- Se non è pronta, il click mantiene visibili i progressi senza tentare la risoluzione.
- `missionUiCompactPanelHtml()` mostra sotto il dock Azioni:
  - nome e stato;
  - tre obiettivi/condizioni;
  - valore corrente/soglia o serie consecutiva;
  - pulsante Gioca;
  - conferma/annullamento inline.

## Profilo Missioni

`MISSION_BALANCE_PROFILE = "F9O2e-starter-accessibility-v1"`

Le ricompense non cambiano.

### Missioni ordinarie

| Missione | Soglia precedente | Nuova soglia |
|---|---|---|
| Civiltà Algoritmica | 2 PS per 2 turni | 2 PS a un checkpoint personale |
| Civiltà Algoritmica | 5 strutture obiettivo | 3 strutture |
| Civiltà Algoritmica | 12 ENE + 8 carte | 8 ENE + 6 carte |
| Mainframe | PS centrale per 2 turni | checkpoint personale |
| Mainframe | 5 effetti PS | 3 effetti PS |
| Triumphale Iter | 5 veicoli | 4 veicoli |
| Triumphale Iter | 5 distruzioni | 3 distruzioni |
| Ordo Legio | rapporto 50/50 per 5 turni | 2 turni |
| Ordo Legio | 3 strutture distrutte | 2 strutture |
| Ordo Legio | 3 unità nello stesso turno | 2 unità |
| Arena Selvaggia | 10 schieramenti | 7 schieramenti |
| Arena Selvaggia | Superiorità su 5 bersagli | 3 bersagli |
| Sangue e Sabbia | 20 danni Sanguinamento | 10 danni |
| Sangue e Sabbia | 3 unità da tattiche | 2 unità |
| Sangue e Sabbia | distanza R5 | distanza R6 |
| Tafos Lithos | 3 unità costo 3+ | 2 unità |
| Tafos Lithos | 5 abilità difensive | 3 abilità |
| Tafos Lithos | deck ≤10 | deck ≤15 |
| Erkos | gruppo 4 strutture | gruppo 3 |
| Erkos | 10 danni Spine | 6 danni |
| Erkos | round 20 + 20 ENE | round 12 + 12 ENE |
| Ex Lucis Tenebrae | 3 veicoli presso PS | 2 veicoli |
| Ex Lucis Tenebrae | 5 Marchi | 3 Marchi |
| Ex Lucis Tenebrae | PS centrale 5 turni | 2 turni |
| Cospirazione | 5 ENE da dottrina | 3 ENE |
| Cospirazione | 3 unità convertite | 2 unità |
| Cospirazione | 10 manipolazioni ENE | 5 manipolazioni |

### Missioni disperate

| Missione | Soglia precedente | Nuova soglia |
|---|---|---|
| Punto di Ripristino | PS centrale nemico 10 round | 5 round |
| Ultimo Assalto | 3 veicoli pesanti persi | 2 |
| Ultimo Assalto | 2 PS nemici per 5 turni | 3 turni |
| Ultima Possibilità | 15 unità perse | 8 |
| Ultima Possibilità | inferiorità per 5 turni | 3 turni |
| Primo Verae | 3 strutture perse | 2 |
| Primo Verae | PS centrale nemico 10 turni | 5 turni |
| Anatema | nemico con più ENE per 5 turni | 3 turni |
| Anatema | 10 unità perse | 6 |

## Esclusioni

- Nessuna modifica alle ricompense.
- Nessuna modifica al moltiplicatore disperato ×1–×3.
- Nessuna modifica a recupero, secondo ciclo, protezione carta o IA di base.
- Nessuna modifica a camera, token, combattimento o bilanciamento unità.
