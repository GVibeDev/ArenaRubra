# C2a-a – Pivot Sanity Hotfix

## Base

`arena_rubra_C2a_tactic_cards_data_foundation.zip`

## Motivo

Il tester girava normalmente, ma il precheck segnalava due problemi:
- Agathoi aveva 2 pivot nel deck.
- Fabeot aveva 2 pivot nel deck.

La causa era la modalità C2a `unique_pool_first`, che ora prende una copia di ogni carta del pool da 30 e quindi rende visibili eventuali doppie marcature `weight:"Pivot"` nei blueprint.

## Modifiche

- `AGC1F12 – Domos Cosmico`: `weight:"Pivot"` → `weight:"Elite"`
- `FBPIV01 – Cittadella Fabeot`: `weight:"Pivot"` → `weight:"Elite"`
- `FBC1F04 – Architetto Nero`: confermato `weight:"Pivot"`

## Non modificato

- Nessuna tattica C2a.
- Nessun effetto.
- Nessuna economia.
- Nessuna AI.
- Nessuna regola deck/hand.

## Prima

- { id:"AGPIV01", faction:"Agathoi", name:"Selva Simbiotica", type:"Struttura", weight:"Pivot", cost:5, hp:7, att:0, def:5, source:"Pivot v1.8.11 · costruibile", bleedImmune:true, ability:{ name:"Manto della Selva", kind:"agathoiShroud", range:99, cooldown:3, cost:3, target:"ally", filter:"Any", description:"Scegli una unità alleata adiacente a una struttura Agathoi: non può essere bersagliata da attacchi o abilità nemiche fino al tuo prossimo turno. Costo 3 ENE." }, description:"Pivot Agathoi immune a Sanguinamento." },
- { id:"AGC1F12", faction:"Agathoi", name:"Domos Cosmico", type:"Struttura", weight:"Pivot", cost:6, hp:8, att:0, def:4, source:"C1f · Agathoi", capBonus:{ group:"structure", value:3 }, bleedImmune:true, ability:{ name:"Velo del Domos", kind:"abilityUntargetable", turns:1, range:2, cooldown:3, cost:1, target:"ally", filter:"Struttura", description:"Rende una struttura alleata non bersagliabile da abilità/tattiche nemiche fino al prossimo turno." } },
- { id:"FBPIV01", faction:"Fabeot", name:"Cittadella Fabeot", type:"Struttura", weight:"Pivot", cost:5, hp:4, att:0, def:2, source:"Pivot v1.8.12 · costruibile", ability:{ name:"Clausola di Acquisizione", kind:"convertEnemy", range:2, cooldown:4, cost:4, conversionLock:true, target:"enemy", filter:"Any", description:"Converte un nemico non comandante, non pivot, non struttura, costo ≤3 e HP ≤2, già marchiato da Fabeot. Rispetta i cap. Costo 4 ENE." } },
- { id:"FBC1F04", faction:"Fabeot", name:"Architetto Nero", type:"Fanteria", weight:"Pivot", cost:6, hp:8, att:5, def:4, source:"C1f · Fabeot", ability:{ name:"Clausola di Stasi", kind:"lockEnemyEnergy", range:0, cooldown:4, cost:5, target:"self", filter:"Any", description:"Blocca la spesa ENE avversaria per 1 turno; se l'avversario ha 0 ENE, blocca anche la mano per 1 turno." } },

## Dopo

- { id:"AGPIV01", faction:"Agathoi", name:"Selva Simbiotica", type:"Struttura", weight:"Pivot", cost:5, hp:7, att:0, def:5, source:"Pivot v1.8.11 · costruibile", bleedImmune:true, ability:{ name:"Manto della Selva", kind:"agathoiShroud", range:99, cooldown:3, cost:3, target:"ally", filter:"Any", description:"Scegli una unità alleata adiacente a una struttura Agathoi: non può essere bersagliata da attacchi o abilità nemiche fino al tuo prossimo turno. Costo 3 ENE." }, description:"Pivot Agathoi immune a Sanguinamento." },
- { id:"AGC1F12", faction:"Agathoi", name:"Domos Cosmico", type:"Struttura", weight:"Elite", cost:6, hp:8, att:0, def:4, source:"C1f · Agathoi", capBonus:{ group:"structure", value:3 }, bleedImmune:true, ability:{ name:"Velo del Domos", kind:"abilityUntargetable", turns:1, range:2, cooldown:3, cost:1, target:"ally", filter:"Struttura", description:"Rende una struttura alleata non bersagliabile da abilità/tattiche nemiche fino al prossimo turno." } },
- { id:"FBPIV01", faction:"Fabeot", name:"Cittadella Fabeot", type:"Struttura", weight:"Elite", cost:5, hp:4, att:0, def:2, source:"Pivot v1.8.12 · costruibile", ability:{ name:"Clausola di Acquisizione", kind:"convertEnemy", range:2, cooldown:4, cost:4, conversionLock:true, target:"enemy", filter:"Any", description:"Converte un nemico non comandante, non pivot, non struttura, costo ≤3 e HP ≤2, già marchiato da Fabeot. Rispetta i cap. Costo 4 ENE." } },
- { id:"FBC1F04", faction:"Fabeot", name:"Architetto Nero", type:"Fanteria", weight:"Pivot", cost:6, hp:8, att:5, def:4, source:"C1f · Fabeot", ability:{ name:"Clausola di Stasi", kind:"lockEnemyEnergy", range:0, cooldown:4, cost:5, target:"self", filter:"Any", description:"Blocca la spesa ENE avversaria per 1 turno; se l'avversario ha 0 ENE, blocca anche la mano per 1 turno." } },

## Controlli

- JS check: OK
- duplicate function definitions: none
- duplicate blueprint IDs: none
- duplicate deck tactic IDs: none
- deck tactic total: 59/59
- pivot counts: Nexus 1 (Fortezza Mobile), Exordium 1 (Orgoglio di Aurex), Liberti 1 (Bestia della Fossa), Agathoi 1 (Selva Simbiotica), Fabeot 1 (Architetto Nero)
- distinct pool counts: Nexus 30, Exordium 30, Liberti 30, Agathoi 30, Fabeot 30
- deck template size model: Nexus 30/30, Exordium 30/30, Liberti 30/30, Agathoi 30/30, Fabeot 30/30
