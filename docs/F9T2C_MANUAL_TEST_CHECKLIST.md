# Checklist manuale — F9T2c

Build candidata: `C2-STABLE-1-F9T2c-APK-M4c`

## A. Regressione F9T2b

- [ ] `CLEAR_OCCUPY_FORTIFY` resta prioritario quando esiste un presidio PS eliminabile.
- [ ] `BASTION_RELAY` resta operativo sui PS con guarnigione mobile.
- [ ] `RELAY_SURVIVAL_CHECK` continua a bloccare ricostruzioni periferiche `UNSUSTAINABLE`.
- [ ] La riserva ENE F9T2b continua a proteggere il piano.
- [ ] Il fallback Advanced completa il resto del turno.

## B. Disponibilità Pivot

- [ ] Nessuna Pivot in mano: nessun candidato F9T2c.
- [ ] Pivot bloccata: nessun candidato.
- [ ] Pivot già in gioco: nessun secondo schieramento.
- [ ] La Pivot non viene selezionata dal mercato.
- [ ] La carta esatta dichiarata dal piano viene usata.

## C. Nodo avanzato

- [ ] Esiste una cella legale adiacente a una struttura Exordium avanzata.
- [ ] La cella del QG proprio non viene scelta ordinariamente.
- [ ] Almeno un alleato mobile è entro raggio 2.
- [ ] Nodo senza supporto: candidato respinto.
- [ ] Nodo eccessivamente esposto: candidato respinto.
- [ ] Perdita della struttura prima dell’acquisto: abort esplicito.
- [ ] Perdita del supporto prima dell’acquisto: abort esplicito.

## D. Obiettivo

- [ ] Priorità a un PS contestabile o acquisibile.
- [ ] Il centro viene riconosciuto come obiettivo rilevante.
- [ ] Un bersaglio di alto valore può motivare lo schieramento.
- [ ] Un corridoio QG può motivare lo schieramento quando plausibile.
- [ ] Nessun obiettivo nella finestra operativa: nessun candidato.

## E. Esecuzione

- [ ] Il piano selezionato è `EXORDIUM_FORWARD_PIVOT_DEPLOYMENT`.
- [ ] Il piano contiene un solo step `deploy_pivot_forward`.
- [ ] Il costo effettivo viene riservato.
- [ ] Tattiche e acquisti ordinari non consumano la riserva.
- [ ] La legalità della cella viene ricontrollata subito prima dello schieramento.
- [ ] La Pivot compare nella cella dichiarata.
- [ ] Il piano viene completato e la riserva liberata.
- [ ] Il resto del turno torna all’Advanced.

## F. Rischio QG e abort

- [ ] Rischio QG `occupied` o `direct`: il piano non viene eseguito.
- [ ] Carta rimossa o bloccata: abort `pivot_unavailable`.
- [ ] Nodo perso: abort `advanced_node_lost`.
- [ ] Supporto perso: abort `support_lost`.
- [ ] Cella invalida: abort `deployment_cell_invalid`.
- [ ] ENE insufficiente: abort `reserved_energy_unavailable`.
- [ ] Nessun abort produce softlock.

## G. Impatto entro due round

- [ ] Primo attacco della Pivot: risultato `impacted`.
- [ ] Prima abilità della Pivot: risultato `impacted`.
- [ ] Acquisizione PS con la Pivot: risultato `impacted`.
- [ ] Distruzione prima dell’impatto: risultato `missed`.
- [ ] Nessun impatto entro la scadenza: risultato `missed`.
- [ ] Il record attivo viene rimosso dopo il primo esito.
- [ ] Non cresce una cronologia illimitata.

## H. Telemetria

- [ ] Modulo `expert-exordium-f9t2c` eseguito una sola volta per turno.
- [ ] Estensione `F9T2c-1` presente.
- [ ] Audit candidati e ragioni di esclusione leggibili.
- [ ] Audit dettagliati limitati, conteggi aggregati completi.
- [ ] `forwardPivotPlans` coerente.
- [ ] `forwardPivotsDeployed` coerente.
- [ ] `forwardPivotImpacts` e `forwardPivotImpactMisses` coerenti.
- [ ] Nessun budget esaurito in condizioni normali.

## I. Partita lunga / APK

- [ ] Almeno 10 seed bot–bot con iniziativa invertita.
- [ ] Almeno una mappa ×1, una ×2 e una ×3.
- [ ] Confronto F9T2b–F9T2c sullo stesso matchup/seed quando possibile.
- [ ] Primo impatto della Pivot entro due round nella maggioranza degli schieramenti validi.
- [ ] Nessuna crescita progressiva anomala di RAM.
- [ ] Nessun rallentamento crescente dei turni.
- [ ] Nessun peggioramento del Bastion Relay o della conversione territoriale.
