# Arena Rubra — F9S1b Changelog

## Build

- Versione: `C2-STABLE-1-F9S1b-APK-M4c`
- Nome: **Alternative Pivots & Complete 40-Card Pools**
- Canale: `f9s1b-candidate`
- Baseline logica: `C2-STABLE-1-F9S1a-APK-M4c`
- Data build: 2026-07-27

## Obiettivo

Aggiungere una seconda Pivot alternativa per ciascuna fazione e completare tutti i pool ufficiali a **40 carte esatte**:

- 23 unità;
- 14 tattiche da deck;
- 3 Missioni.

Il limite rimane **una sola Pivot complessiva per deck**. I deck ufficiali non sono stati modificati e saranno ricostruiti nella milestone F9S1c.

## Nuove Pivot

### Nexus

- `NXPIV02` — **UCB Unità Corazzata da Battaglia**
- Veicolo Pivot, 5 ENE, 4 HP, 6 DEF, 4 ATT.
- **Tramonto:** alla fine del turno del proprietario, ogni nemico non-QG adiacente perde 1 DEF corrente, minimo 0.
- **Trappola:** 2 ENE, CD2; applica Inibizione Movimento a tutti i nemici non-QG adiacenti per il loro prossimo turno.

### Exordium

- `EXPIV02` — **Mech d’Assalto**
- Veicolo Pivot, 5 ENE, 5 HP, 4 DEF, 5 ATT.
- **Corazza Reattiva:** riduce di 1, minimo 0, il danno immediato proveniente da abilità attive e tattiche nemiche.
- La riduzione non si applica ad attacchi base, contrattacchi, Sanguinamento, Spine, mine/pericoli, perdita pura di DEF o costi/autodanni.
- **Soppressione:** 5 ENE, CD3, R2; seleziona una cella centrale e un orientamento per formare tre celle collineari valide, tutte entro R2. Infligge 2 danni normali a ogni unità sulla linea, alleati inclusi. La linea non può comprendere la cella del Mech.

### Liberti

- `LXPIV02` — **Camion Corazzato**
- Veicolo Pivot, 4 ENE, 4 HP, 3 DEF, 3 ATT.
- **Sanguinamento 2:** gli attacchi base applicano Sanguinamento 2 per due turni ai bersagli validi che sopravvivono.
- **Schianto:** 2 ENE, CD3, R1; un nemico non-QG adiacente subisce danni normali pari agli HP correnti del Camion. Se il bersaglio è Pesante perde prima 1 DEF corrente.

### Agathoi

- `AGPIV02` — **Giganthropos**
- Veicolo Pivot, 6 ENE, 6 HP, 5 DEF, 4 ATT.
- **Spine 2.**
- **Erkos:** 3 ENE, CD2, R1; infligge 2 danni normali a un nemico non-QG e, se sopravvive, gli applica Inibizione Movimento per il prossimo turno.

### Fabeot

- `FBPIV02` — **La Torre dell’Architetto**
- Struttura Pivot, 6 ENE, 6 HP, 8 DEF, 0 ATT; non effettua attacchi base.
- **Geometria della Sofferenza:** ogni nemico non-QG adiacente subisce +1 danno per ciascun evento di danno, da qualsiasi fonte, finché rimane adiacente a una Torre nemica viva.
- **Bonifica:** 5 ENE, CD3, R2; seleziona due celle distinte e adiacenti, entrambe entro R2. Infligge 2 danni normali a ogni unità sulle celle, alleati inclusi.

## Runtime aggiunto

- trigger passivi di fine turno per Tramonto;
- targeting FFA su tutti i nemici attivi per gli effetti adiacenti;
- stato di Inibizione Movimento ad area e a bersaglio singolo;
- selettore umano e IA per linee di tre celle su griglia esagonale;
- verifica di unicità, adiacenza, esistenza e gittata delle celle della linea;
- rifiuto delle linee che attraversano la cella del Mech d’Assalto;
- danno dinamico basato sugli HP correnti dell’utilizzatore;
- perdita DEF condizionata alla classe Pesante;
- riduzione del danno dipendente dalla fonte e dal tipo di evento;
- aura dinamica Fabeot applicata a ogni evento di danno separato;
- integrazione con Sanguinamento 2 e Spine 2 già presenti nel runtime;
- valutazione IA dedicata alle nuove abilità.

## Integrazione di sistema

- catalogo unità aggiornato a 115 blueprint totali;
- ogni fazione dispone di due Pivot e di 40 carte complessive;
- Pool carte, Card Renderer e Deck Builder leggono le nuove Pivot;
- il controller gestisce i nuovi target `cell_line` oltre ai gruppi di celle esistenti;
- combat runtime aggiornato per applicare amplificazione e riduzione del danno nell’ordine definito;
- fine turno aggiornata per risolvere Tramonto;
- metadati build, precheck, tassonomia e smoke test aggiornati;
- limite di una Pivot totale per deck conservato senza eccezioni.

## Ordine degli effetti di danno

Per gli eventi compatibili:

1. si calcola il danno base e le vulnerabilità già attive;
2. Geometria della Sofferenza aggiunge +1 se il bersaglio è adiacente a una Torre nemica;
3. Corazza Reattiva riduce di 1 se la fonte è un’abilità attiva o una tattica nemica;
4. il danno risultante viene applicato secondo le normali regole ATT–DEF/HP.

Il bonus della Torre si applica separatamente a ogni colpo di effetti multi-hit.

## Esclusioni intenzionali

- I deck ufficiali non sono stati modificati.
- Le nuove Pivot sono disponibili nel Pool carte e nei deck custom.
- Gli asset dedicati delle cinque nuove Pivot non erano inclusi nei materiali ricevuti: la build utilizza il sistema di fallback grafico esistente.
- Nessuna modifica a Pressione, mappe, Missioni o regole FFA residue.
- Il bilanciamento fine delle combinazioni fra Pivot e deck completi è rinviato a F9S1c e ai benchmark successivi.

## Compatibilità

La candidata conserva integralmente la baseline validata F9S1a, comprese le 14 unità e 11 tattiche aggiunte, gli asset già integrati, le mappe ufficiali F9R3, la Pressione proporzionale, gli hotfix prestazionali, il targeting FFA delle unità, la politica delle strutture e il tutorial.
