# C2c-1a – Tholos Dynamic DEF Hotfix

## Base

`arena_rubra_C2c_1_single_damage_tactics.zip`

## Problema

La struttura Agathoi `AGC1F08 – Tholos Sacro` sembrava immune agli attacchi.

Causa: `dynamicDefAdjacentUnits` veniva trattato dal combattimento come blocco danno dinamico rinnovabile a ogni attacco. Questo poteva assorbire attacchi piccoli senza consumare DEF/HP.

## Correzione

Il dato del Tholos resta in `data/units_base.js`, ma il contributo `dynamicDefAdjacentUnits` non viene più applicato dentro `dynamicDefenseBonus` come scudo rinnovabile nel calcolo immediato del danno.

File modificato:
- `src/combat.js`

File non modificati:
- `data/units_base.js`
- `data/tactics_cards_c2.js`
- deck/hand lifecycle
- AI
- economia
- targeting tattiche C2c-1

## Nota di design

La passiva del Tholos potrà essere reintrodotta correttamente più avanti come:
- bonus DEF corrente applicato a inizio turno; oppure
- bonus difensivo consumabile e non rinnovabile per singolo attacco.

## Tholos rilevato nei dati

- { id:"AGC1F08", faction:"Agathoi", name:"Tholos Sacro", type:"Struttura", weight:"Pesante", cost:2, hp:4, att:0, def:2, source:"C1f · Agathoi", dynamicDefAdjacentUnits:{ value:1, max:4 }, bleedImmune:true, ability:null, description:"Passiva: +1 DEF, max +4, per ogni unità non-QG adiacente, alleata o nemica." },

## Controlli

- JS check: OK
- missing scripts: none
- duplicate function definitions: none
- duplicate blueprint IDs: none
- duplicate deck tactic IDs: none
- deck tactic total: 59/59
- playable C2c-1 statuses preserved: 5/5
- pivot counts: Nexus 1, Exordium 1, Liberti 1, Agathoi 1, Fabeot 1
- distinct pool counts: Nexus 30, Exordium 30, Liberti 30, Agathoi 30, Fabeot 30
- Tholos data still has dynamicDefAdjacentUnits: True
- combat hotfix comment present: True
- combat still references dynamicDefAdjacentUnits only as disabled/commented guard: True

## Funzione prima

```js
function dynamicDefenseBonus(target, attacker=null, options={}) {
      if (!target) return 0;
      let bonus = 0;
      if (target.adjacentVehicleDef && combatUnits(target.side).some(v => v.type === "Veicolo" && areAdjacent(v.pos, target.pos))) bonus += target.adjacentVehicleDef || 0;
      if (target.defVsInfantryAttacker && attacker && attacker.type === "Fanteria") bonus += target.defVsInfantryAttacker || 0;
      if (target.defVsLightAttacker && attacker && isLightUnit(attacker)) bonus += target.defVsLightAttacker || 0;
      if (target.adjacentAllyDef && combatUnits(target.side).some(ally => ally.uid !== target.uid && ally.type !== "QG" && areAdjacent(ally.pos, target.pos))) bonus += target.adjacentAllyDef || 0;
      if (target.structureAdjDef && isAdjacentToAlliedStructure(target)) bonus += target.structureAdjDef || 0;
      if (target.dynamicDefAdjacentUnits) {
        const count = combatUnits(null).filter(u => u.uid !== target.uid && u.type !== "QG" && areAdjacent(u.pos, target.pos)).length;
        bonus += Math.min(target.dynamicDefAdjacentUnits.max || 0, count * (target.dynamicDefAdjacentUnits.value || 1));
      }
      if (target.dynamicDefAdjacentStructures) {
        const count = combatUnits(target.side).filter(u => u.uid !== target.uid && u.type === "Struttura" && areAdjacent(u.pos, target.pos)).length;
        bonus += Math.min(target.dynamicDefAdjacentStructures.max || 0, count * (target.dynamicDefAdjacentStructures.value || 1));
      }
      if (target.stationaryDefBonus) bonus += target.stationaryDefBonus || 0;
      return bonus;
    }

    function findFrontLineInterceptor(attacker, defender) {
      if (!attacker || !defender || !defender.pos) return null;
      return combatUnits(defender.side)
        .filter(u => u.uid !== defender.uid && 
```

## Funzione dopo

```js
function dynamicDefenseBonus(target, attacker=null, options={}) {
      if (!target) return 0;
      let bonus = 0;
      if (target.adjacentVehicleDef && combatUnits(target.side).some(v => v.type === "Veicolo" && areAdjacent(v.pos, target.pos))) bonus += target.adjacentVehicleDef || 0;
      if (target.defVsInfantryAttacker && attacker && attacker.type === "Fanteria") bonus += target.defVsInfantryAttacker || 0;
      if (target.defVsLightAttacker && attacker && isLightUnit(attacker)) bonus += target.defVsLightAttacker || 0;
      if (target.adjacentAllyDef && combatUnits(target.side).some(ally => ally.uid !== target.uid && ally.type !== "QG" && areAdjacent(ally.pos, target.pos))) bonus += target.adjacentAllyDef || 0;
      if (target.structureAdjDef && isAdjacentToAlliedStructure(target)) bonus += target.structureAdjDef || 0;
      // C2c-1a hotfix: dynamicDefAdjacentUnits non deve agire come scudo rinnovabile a ogni attacco.
```
